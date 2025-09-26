// supabase/functions/bog-callback-handler/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyBogSignature } from '../_shared/cryptoUtils.ts'

Deno.serve(async (req) => {
  // 1. Security Verification (Mandatory)
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
  
  // 2. Process the Callback
  try {
    const payload = JSON.parse(rawBody);
    
    // Using the structure from your current working code
    const paymentDetails = payload.body; 
    const externalId = paymentDetails?.external_order_id;
    const status = paymentDetails?.order_status?.key; 

    // We must respond 200 OK to the bank to acknowledge receipt (unless internal error occurs).

    if (!externalId || !status) {
        console.error("Callback missing order ID or status.");
        return new Response("Missing required data.", { status: 200 });
    }

    // We only process successful payments ('completed' based on your current code)
    if (status !== 'completed') {
        console.log(`Received status '${status}' for ID ${externalId}. No action taken.`);
        return new Response(`Callback received. Status: ${status}.`, { status: 200 });
    }
        
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
        
    // 3. Finalization (Updated for the new architecture)

    // Attempt 1: Try to finalize it as a Wallet Top-up (Idempotent)
    const { data: topupSuccess, error: topupError } = await supabaseAdmin.rpc('finalize_wallet_topup', {
        topup_id_to_finalize: externalId
    });
      
    if (topupError) {
        console.error(`Error during finalize_wallet_topup RPC: ${topupError.message}`);
        // Return 500 for internal errors so BOG might retry
        return new Response("Internal Server Error during top-up finalization.", { status: 500 });
    }

    // If the function returned TRUE, it was a successful top-up.
    if (topupSuccess) {
        console.log(`Successfully finalized wallet top-up: ${externalId}`);
        return new Response("Wallet top-up finalized successfully.", { status: 200 });
    }

    // Attempt 2: If not a top-up, try to finalize it as a regular Order
    console.log(`ID ${externalId} not found in pending top-ups. Attempting to process as order.`);
    
    const { error: orderError } = await supabaseAdmin.rpc('confirm_order_payment', {
        order_id_to_confirm: externalId
    });

    if (orderError) {
        console.error(`Failed to update order status: ${orderError.message}`);
        return new Response("Callback received, but failed to confirm order payment.", { status: 200 });
    }

    console.log(`Successfully confirmed order payment: ${externalId}`);
    return new Response("Order payment confirmed successfully.", { status: 200 });

  } catch (error) {
    console.error("Error processing callback (e.g., JSON parsing):", error.message);
    // Respond 500 for unexpected errors
    return new Response(JSON.stringify({ error: "Error processing callback" }), { status: 500 });
  }
})