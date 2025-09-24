// supabase/functions/bog-callback-handler/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyBogSignature } from '../_shared/cryptoUtils.ts'

Deno.serve(async (req) => {
  // 1. Read the raw body and signature. Must use req.text() for verification.
  const rawBody = await req.text();
  const signature = req.headers.get('Callback-Signature');

  if (!signature) {
    console.error("Missing Callback-Signature header.");
    // Enforce security: reject requests without a signature.
    return new Response("Missing signature.", { status: 403 });
  }

  // 2. Verify the signature
  const isValid = await verifyBogSignature(signature, rawBody);
  if (!isValid) {
    console.error("SECURITY ALERT: Invalid signature received.");
    return new Response("Invalid signature.", { status: 403 }); // Forbidden
  }

  console.log("Signature verified successfully.");

  // 3. Process the verified payload
  try {
    const payload = JSON.parse(rawBody);
    // Details are nested in the 'body' field of the callback payload
    const paymentDetails = payload.body;

    const orderId = paymentDetails?.external_order_id;
    const status = paymentDetails?.order_status?.key;

    if (!orderId || !status) {
      console.error("Callback missing order ID or status.", rawBody);
      throw new Error("Callback missing order ID or status.");
    }

    // 4. Handle the status
    // 'completed' is the success status for automatic capture.
    if (status === 'completed') {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Call the unified database function
        const { data, error } = await supabaseAdmin.rpc('process_payment_callback', {
            external_id: orderId
        });

        if (error) {
            throw new Error(`Failed to process payment in DB: ${error.message}`);
        }
        console.log(`Order/Topup ${orderId} confirmed. Result: ${data}`);

    } else if (status === 'rejected') {
      console.log(`Order ${orderId} rejected by the bank.`);
      // Optional: Update status to 'failed' in relevant tables
    } else {
      console.log(`Received status '${status}' for order ${orderId}. No action taken.`);
    }

    // 5. Respond to the bank's server with 200 OK (as required by documentation)
    return new Response("Callback processed.", { status: 200 });

  } catch (error) {
    console.error("Error processing callback:", error.message);
    // Respond with 500 Internal Server Error so BOG might retry
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})