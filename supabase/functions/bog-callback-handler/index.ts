// supabase/functions/bog-callback-handler/index.ts
import { createClient } from '@supabase/supabase-js'
import { verifyBogSignature } from '../_shared/cryptoUtils.ts'

// === META CONVERSIONS API HELPER (100% ISOLATED) ===
async function sendToMeta(eventId: string, value: number, contentName: string) {
  try {
    const pixelId = Deno.env.get('META_PIXEL_ID');
    const token = Deno.env.get('META_ACCESS_TOKEN');
    
    if (!pixelId || !token) {
      console.log("Meta CAPI: Missing environment variables, skipping tracking.");
      return;
    }

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: eventId, 
          user_data: { external_id: [eventId] },
          custom_data: {
            currency: "GEL",
            value: value,
            content_name: contentName
          }
        }
      ]
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const json = await res.json();
    console.log("Meta CAPI Ping Result:", json);
  } catch (err: unknown) {
    console.error("Meta CAPI Network Error:", err);
  }
}
// =========================================================

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
            
            // ---> META TRACKING INJECTION FOR WALLET <---
            try {
                const amount = paymentDetails?.amount ? parseFloat(paymentDetails.amount) : 0;
                if (amount > 0) {
                   await sendToMeta(externalId, amount, "Wallet Top Up");
                }
            } catch (e: unknown) { console.error("Wallet Meta Ping Failed:", e); }
            // --------------------------------------------

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
        
        // ---> META TRACKING INJECTION FOR ORDER <---
        try {
            const { data: trxData } = await supabaseAdmin
                .from('transactions')
                .select('total_price')
                .eq('transaction_id', externalId)
                .single();

            if (trxData && trxData.total_price > 0) {
                await sendToMeta(externalId, trxData.total_price, "Saucer Burger Order");
            }
        } catch (e: unknown) { console.error("Order Meta Ping Failed:", e); }
        // -------------------------------------------

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

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing callback (e.g., JSON parsing):", errMessage);
    return new Response(JSON.stringify({ error: "Error processing callback" }), { status: 500 });
  }
});