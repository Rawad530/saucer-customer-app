// supabase/functions/finalize-order/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, useWallet } = await req.json();
    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the order total first to ensure it exists
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('transactions')
      .select('total_price')
      .eq('transaction_id', orderId)
      .single();

    if (orderError) throw new Error("Order not found.");

    let amountToPayByCard = orderData.total_price;

    // If the user wants to use their wallet, process that first
    if (useWallet) {
      const { data: remainingAmount, error: rpcError } = await supabaseAdmin.rpc('process_wallet_payment', {
        order_id_to_process: orderId
      });

      if (rpcError) throw rpcError;
      amountToPayByCard = remainingAmount;
    }

    // If the wallet covered the full amount, the order is complete.
    if (amountToPayByCard <= 0) {
      await supabaseAdmin.from('transactions').update({ status: 'pending_approval' }).eq('transaction_id', orderId);
      return new Response(JSON.stringify({ paymentComplete: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- If there is a remaining balance, proceed to Bank of Georgia payment ---
    const clientId = Deno.env.get('BOG_CLIENT_ID');
    const clientSecret = Deno.env.get('BOG_CLIENT_SECRET');
    const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    const tokenResponse = await fetch('https://api.businessonline.ge/api/v1/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader },
        body: 'grant_type=client_credentials',
    });
    if (!tokenResponse.ok) throw new Error('Failed to get authorization token from the bank.');

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "GEL", value: amountToPayByCard.toFixed(2) } }],
        redirect_url: "https://saucerburger.ge/payment-status",
        shop_order_id: orderId,
    };

    const bogOrderResponse = await fetch('https://ipay.ge/opay/api/v1/checkout/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(orderPayload),
    });

    if (!bogOrderResponse.ok) {
        const errorBody = await bogOrderResponse.json();
        throw new Error(`Bank Error: ${JSON.stringify(errorBody)}`);
    }

    const bogOrderData = await bogOrderResponse.json();
    const redirectLink = bogOrderData.links?.find((link: any) => link.rel === 'approve');

    if (!redirectLink?.href) throw new Error("Could not find payment redirect link from bank.");

    return new Response(JSON.stringify({ paymentComplete: false, redirectUrl: redirectLink.href }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})