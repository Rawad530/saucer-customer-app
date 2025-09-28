import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, amount, description } = await req.json();
    if (!customerId || !amount || !description) {
      throw new Error("Customer ID, amount, and description are required.");
    }

    // Create a Supabase client with the service role key to perform admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the secure database function
    const { error } = await supabaseAdmin.rpc('credit_wallet', {
      customer_id_to_credit: customerId,
      amount_to_credit: amount,
      transaction_description: description,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Wallet credited successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})