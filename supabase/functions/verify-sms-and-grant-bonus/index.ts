// supabase/functions/verify-sms-and-grant-bonus/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')

Deno.serve(async (req) => {
  console.log("Function invoked."); // New log
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { request_id, code, phone } = await req.json()
    if (!request_id || !code || !phone) {
      console.error("Missing request_id, code, or phone.");
      throw new Error("Request ID, code, and phone number are required.")
    }
    console.log(`Payload received: request_id=${request_id}, phone=${phone}`);
    
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
    console.log(`User ${user.id} authenticated.`);

    // 4. Call Vonage Verify V2 API to check the PIN
    console.log(`Calling Vonage to check code for request_id: ${request_id}`);
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
    console.log("Vonage response status:", vonageResponse.status);
    console.log("Vonage response body:", data);

    if (vonageResponse.status !== 200) { // 200 is the success code for checking
      throw new Error(`Vonage error: ${data.title || 'Invalid or expired code.'}`)
    }
    console.log("Vonage code verification successful.");

    // 5. Create an Admin client to perform secure operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 6. THE CRITICAL FRAUD CHECK
    console.log(`Checking 'verified_phones' table for phone: ${phone}`);
    const { data: existingPhone, error: phoneError } = await supabaseAdmin
      .from('verified_phones')
      .select('phone_number')
      .eq('phone_number', phone)
      .maybeSingle()
      
    if (phoneError) {
      console.error("Error checking verified_phones:", phoneError.message);
      throw phoneError
    }
    
    if (existingPhone) {
      console.warn(`Fraud attempt: Phone ${phone} already exists.`);
      throw new Error("This phone number has already been used to claim a bonus.")
    }
    console.log("Phone number is unique.");

    // 7. SUCCESS: Call our database function
    console.log(`Calling 'grant_signup_bonus' for user ${user.id}`);
    const { error: rpcError } = await supabaseAdmin.rpc('grant_signup_bonus', {
      p_user_id: user.id,
      p_phone_number: phone,
      p_bonus_amount: 5
    })
    
    if (rpcError) {
      console.error("Error calling 'grant_signup_bonus':", rpcError.message);
      throw rpcError
    }
    console.log("Bonus granted successfully.");

    return new Response(JSON.stringify({ message: "Success! 5 GEL has been added to your wallet." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function failed:", error.message); // This will be the REAL error
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})