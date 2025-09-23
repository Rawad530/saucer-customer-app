// supabase/functions/bog-callback-handler/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log(`Callback handler initialized`);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received callback from BOG:", payload);

    // Extract the order ID from the bank's callback data
    const orderId = payload.external_order_id; 
    if (!orderId) {
      throw new Error("Callback did not contain an order ID.");
    }

    // Securely connect to Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call our secure database function to update the order status
    const { error } = await supabaseAdmin.rpc('confirm_order_payment', {
      order_id_to_confirm: orderId
    });

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    // Respond to the bank's server with a success message
    return new Response("Callback received successfully.", { status: 200 });

  } catch (error) {
    console.error("Error in callback handler:", error.message);
    // Respond to the bank's server with an error message
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})