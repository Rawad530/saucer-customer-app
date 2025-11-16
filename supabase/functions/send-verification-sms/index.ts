// supabase/functions/send-verification-sms/index.ts

import { corsHeaders } from '../_shared/cors.ts'

// These are read from the Supabase Secrets you just set
const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone) throw new Error("Phone number is required.")

    // 1. Call Vonage Verify V2 API to send a PIN
    const vonageResponse = await fetch('https://api.nexmo.com/v2/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the secrets to build the authorization header
        'Authorization': `Basic ${btoa(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`)}`
      },
      body: JSON.stringify({
        brand: "SaucerBurger", // This will be the name in the SMS
        workflow: [
          {
            channel: "sms",
            to: phone
          }
        ]
      })
    })

    const data = await vonageResponse.json()

    // 202 is the success code for Vonage Verify V2
    if (vonageResponse.status !== 202) { 
      throw new Error(`Vonage error: ${data.title || 'Failed to send code.'}`)
    }

    // 2. Return the 'request_id'. The frontend needs this
    // to check the code in the next step.
    return new Response(JSON.stringify({ request_id: data.request_id }), {
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