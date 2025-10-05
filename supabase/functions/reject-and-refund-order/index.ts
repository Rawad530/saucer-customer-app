// supabase/functions/reject-and-refund-order/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- NEW: Added more detailed logging ---
  console.log("--- New reject-and-refund-order invocation ---");
  console.log("Request Method:", req.method);
  console.log("Request Headers:", Object.fromEntries(req.headers));

  try {
    const body = await req.json()
    console.log("Parsed request body:", body);
    
    const { orderId, rejectionReason } = body;

    if (!orderId) {
      throw new Error("Order ID is required in the request body.")
    }
    console.log(`Processing rejection for Order ID: ${orderId} with reason: ${rejectionReason}`);

    // Use the Service Role Key for elevated access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch the transaction to get details for the refund
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('user_id, status, payment_mode, total_price, wallet_credit_applied, order_number')
      .eq('transaction_id', orderId)
      .single()

    if (fetchError) throw new Error(`Order not found: ${fetchError.message}`)
    console.log("Found order:", order);

    if (order.status === 'rejected') throw new Error("This order has already been rejected.")

    let refundAmount = 0;
    let refundDescription = '';

    // 2. Calculate the refund amount based on payment mode
    switch (order.payment_mode) {
      case 'Wallet Only':
        refundAmount = order.wallet_credit_applied;
        refundDescription = `Refund for rejected Order #${order.order_number}`;
        break;
      case 'Card - Online':
        refundAmount = order.total_price;
        refundDescription = `Wallet credit from rejected card payment for Order #${order.order_number}`;
        break;
      case 'Wallet/Card Combo':
        refundAmount = (order.wallet_credit_applied || 0) + (order.total_price || 0);
        refundDescription = `Full wallet refund for rejected combo payment (Order #${order.order_number})`;
        break;
      default:
        refundAmount = 0;
    }
    console.log(`Calculated refund amount: ${refundAmount}`);

    // 3. Credit the user's wallet if a refund is applicable
    if (refundAmount > 0 && order.user_id) {
      console.log(`Attempting to credit wallet for user ${order.user_id} with amount ${refundAmount}`);
      const { error: rpcError } = await supabaseAdmin.rpc('credit_wallet', {
        p_user_id: order.user_id,
        p_amount: refundAmount,
        p_description: refundDescription
      })

      if (rpcError) throw new Error(`Failed to credit wallet: ${rpcError.message}`)
      console.log("Wallet credited successfully.");
    }

    // 4. Update the order status and add the rejection reason
    console.log("Updating order status to 'rejected'.");
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason || 'Order was cancelled by the restaurant.' 
      })
      .eq('transaction_id', orderId)

    if (updateError) throw new Error(`Failed to update order status: ${updateError.message}`)
    console.log("Order status updated successfully.");

    return new Response(JSON.stringify({ message: "Order successfully rejected and refunded." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // --- NEW: Added specific error logging in the catch block ---
    console.error("!!! An error occurred in the Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})