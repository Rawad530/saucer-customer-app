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
    
    // Structure based on previously working implementation
    const paymentDetails = payload.body; 
    const externalId = paymentDetails?.external_order_id;
    const status = paymentDetails?.order_status?.key; 

    if (!externalId || !status) {
        console.error("Callback missing order ID or status.");
        return new Response("Missing required data.", { status: 200 }); // Acknowledge receipt
    }
        
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Handle Status Updates

    if (status === 'completed') {
        // --- SUCCESS LOGIC (Remains the same) ---
        
        // Attempt 1: Wallet Top-up
        const { data: topupSuccess, error: topupError } = await supabaseAdmin.rpc('finalize_wallet_topup', {
            topup_id_to_finalize: externalId
        });
          
        if (topupError) {
            console.error(`Error during finalize_wallet_topup RPC: ${topupError.message}`);
            return new Response("Internal Server Error during top-up finalization.", { status: 500 });
        }

        if (topupSuccess) {
            console.log(`Successfully finalized wallet top-up: ${externalId}`);
            return new Response("Wallet top-up finalized successfully.", { status: 200 });
        }

        // Attempt 2: Regular Order
        console.log(`ID ${externalId} not a top-up. Processing as order.`);
        const { error: orderError } = await supabaseAdmin.rpc('confirm_order_payment', {
            order_id_to_confirm: externalId
        });

        if (orderError) {
            console.error(`Failed to confirm order payment: ${orderError.message}`);
            return new Response("Callback received, but failed to confirm order payment.", { status: 200 });
        }

        console.log(`Successfully confirmed order payment: ${externalId}`);
        return new Response("Order payment confirmed successfully.", { status: 200 });

    } else if (['rejected', 'failed', 'canceled', 'expired'].includes(status)) {
        // --- FAILURE LOGIC (NEW) ---
        console.log(`Payment failed/rejected for ID ${externalId} (Status: '${status}'). Initiating rejection/refund.`);

        // Call the new rejection function (handles status update AND refunds)
        const { error: rejectError } = await supabaseAdmin.rpc('reject_order_payment', {
            order_id_to_reject: externalId
        });

        if (rejectError) {
            // This is a critical error if we fail to refund or update status
            console.error(`CRITICAL ERROR during reject_order_payment RPC: ${rejectError.message}`);
            return new Response("Internal Server Error during payment rejection.", { status: 500 });
        }

        // Also ensure pending wallet top-ups are cleaned up if it was a top-up attempt
        await supabaseAdmin.from('pending_wallet_topups').delete().eq('topup_id', externalId);

        return new Response(`Order rejected/refunded. Status: ${status}.`, { status: 200 });

    } else {
        // --- OTHER STATUSES (e.g., pending) ---
        console.log(`Received status '${status}' for ID ${externalId}. No action taken.`);
        return new Response(`Callback received. Status: ${status}.`, { status: 200 });
    }

  } catch (error) {
    console.error("Error processing callback (e.g., JSON parsing):", error.message);
    return new Response(JSON.stringify({ error: "Error processing callback" }), { status: 500 });
  }
})