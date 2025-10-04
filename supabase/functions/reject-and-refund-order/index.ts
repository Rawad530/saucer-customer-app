// supabase/functions/reject-and-refund-order/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, rejectionReason } = await req.json()

    if (!orderId) {
      throw new Error("Order ID is required.")
    }

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
        // Refund both the wallet part and the card part to the wallet
        refundAmount = (order.wallet_credit_applied || 0) + (order.total_price || 0);
        refundDescription = `Full wallet refund for rejected combo payment (Order #${order.order_number})`;
        break;
      // For 'Cash' or 'Card - Terminal', no wallet refund is processed
      default:
        refundAmount = 0;
    }

    // 3. Credit the user's wallet if a refund is applicable
    if (refundAmount > 0 && order.user_id) {
      // We can call your existing 'credit_wallet' DB function for security and consistency
      const { error: rpcError } = await supabaseAdmin.rpc('credit_wallet', {
        p_user_id: order.user_id,
        p_amount: refundAmount,
        p_description: refundDescription
      })

      if (rpcError) throw new Error(`Failed to credit wallet: ${rpcError.message}`)
    }

    // 4. Update the order status and add the rejection reason
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'rejected',
        // Use the provided reason or a default message
        rejection_reason: rejectionReason || 'Order was cancelled by the restaurant.' 
      })
      .eq('transaction_id', orderId)

    if (updateError) throw new Error(`Failed to update order status: ${updateError.message}`)

    return new Response(JSON.stringify({ message: "Order successfully rejected and refunded." }), {
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