// FIXED: Using 'npm:' to bypass the broken esm.sh server
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. VALIDATE INPUT
    const { phone } = await req.json()
    if (!phone) throw new Error("Phone number is required.")

    // 2. AUTHENTICATION CHECK
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("You must be logged in to request a code.")
    }

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is real
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error("Invalid session. Please log in again.")
    }

    // 3. RATE LIMITING
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check attempts from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Make sure you ran the SQL to create 'sms_request_logs' table!
    const { count, error: countError } = await supabaseAdmin
      .from('sms_request_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .gte('created_at', oneHourAgo)

    if (count && count >= 3) {
      console.error(`🚨 BLOCKED: IP ${clientIp} hit rate limit (User: ${user.id})`)
      throw new Error("Too many requests. Please try again in an hour.")
    }

    // 4. LOG THIS ATTEMPT
    await supabaseAdmin.from('sms_request_logs').insert({
      ip_address: clientIp,
      phone_number: phone,
      user_id: user.id
    })

    // 5. SEND SMS
    const vonageResponse = await fetch('https://api.nexmo.com/v2/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`)}`
      },
      body: JSON.stringify({
        brand: "SaucerBurger",
        workflow: [
          {
            channel: "sms",
            to: phone
          }
        ]
      })
    })

    const data = await vonageResponse.json()

    if (vonageResponse.status !== 202) { 
      throw new Error(`Vonage error: ${data.title || 'Failed to send code.'}`)
    }

    return new Response(JSON.stringify({ request_id: data.request_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("SMS Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})