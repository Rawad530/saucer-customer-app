// supabase/functions/verify-sms-and-grant-bonus/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { request_id, code, phone } = await req.json()
    if (!request_id || !code || !phone) {
      throw new Error("Request ID, code, and phone number are required.")
    }
    
    // 1. Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization')!
    
    // 2. Create a Supabase client with the user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 3. Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error("User not found.")
    
    // 4. Call Vonage Verify V2 API to check the PIN
    const vonageResponse = await fetch(`https://api.nexmo.com/v2/verify/${request_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`)}`
      },
      body: JSON.stringify({
        code: code
      })
    })

    const data = await vonageResponse.json()

    if (vonageResponse.status !== 200) { // 200 is the success code for checking
      throw new Error(`Vonage error: ${data.title || 'Invalid or expired code.'}`)
    }

    // 5. Create an Admin client to perform secure operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 6. THE CRITICAL FRAUD CHECK: Has this phone number been used?
    const { data: existingPhone, error: phoneError } = await supabaseAdmin
      .from('verified_phones')
      .select('phone_number')
      .eq('phone_number', phone)
      .maybeSingle()
      
    if (phoneError) throw phoneError
    
    if (existingPhone) {
      // 7A. FRAUD DETECTED: Phone already exists
      throw new Error("This phone number has already been used to claim a bonus.")
    }

    // 7B. SUCCESS: This is a unique phone number.
    // Call our database function to grant the 5 GEL
    const { error: rpcError } = await supabaseAdmin.rpc('grant_signup_bonus', {
      p_user_id: user.id,
      p_phone_number: phone,
      p_bonus_amount: 5
    })
    
    if (rpcError) throw rpcError

    return new Response(JSON.stringify({ message: "Success! 5 GEL has been added to your wallet." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})