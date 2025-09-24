// supabase/functions/bog-callback-handler/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyBogSignature } from '../_shared/cryptoUtils.ts'

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get('Callback-Signature');

  if (!signature) {
    console.error("Missing Callback-Signature header.");
    return new Response("Missing signature.", { status: 403 });
  }

  const isValid = await verifyBogSignature(signature, rawBody);
  if (!isValid) {
    console.error("SECURITY ALERT: Invalid signature received.");
    return new Response("Invalid signature.", { status: 403 });
  }

  console.log("Signature verified successfully.");
  
  try {
    const payload = JSON.parse(rawBody);
    const paymentDetails = payload.body;
    const orderId = paymentDetails?.external_order_id;
    const status = paymentDetails?.order_status?.key;

    if (!orderId || !status) {
      throw new Error("Callback missing order ID or status.");
    }

    if (status === 'completed') {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        const { data, error } = await supabaseAdmin.rpc('process_payment_callback', {
            external_id: orderId
        });
        
        if (error) {
            throw new Error(`Failed to process payment in DB: ${error.message}`);
        }
        console.log(`Callback for ${orderId} processed. Result: ${data}`);
    } else {
      console.log(`Received status '${status}' for order ${orderId}. No action taken.`);
    }

    return new Response("Callback processed.", { status: 200 });

  } catch (error) {
    console.error("Error processing callback:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})