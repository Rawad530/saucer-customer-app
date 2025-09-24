import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // CRITICAL: Handles the CORS preflight request.
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

    // 1. Get Order Details
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('transactions')
      .select('total_price, order_number')
      .eq('transaction_id', orderId)
      .single();

    if (orderError) throw new Error(`Order not found: ${orderError.message}`);
    let amountToPayByCard = orderData.total_price;

    // 2. Process Wallet Payment
    if (useWallet) {
      const { data: remainingAmount, error: rpcError } = await supabaseAdmin.rpc('process_wallet_payment', {
        order_id_to_process: orderId
      });
      if (rpcError) throw rpcError;
      amountToPayByCard = remainingAmount;
    }

    if (amountToPayByCard <= 0) {
      await supabaseAdmin.from('transactions').update({ status: 'pending_approval' }).eq('transaction_id', orderId);
      return new Response(JSON.stringify({ paymentComplete: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. BOG Authentication
    const clientId = Deno.env.get('BOG_CLIENT_ID');
    const clientSecret = Deno.env.get('BOG_CLIENT_SECRET');
    const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    const tokenResponse = await fetch('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader },
        body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new Error(`Failed to get authorization token. Bank's response: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 4. BOG Create Order (CORRECTED PAYLOAD)
    const orderPayload = {
        callback_url: `https://kgambgofdizxgcdjhxlk.supabase.co/functions/v1/bog-callback-handler`,
        external_order_id: orderId,
        // CORRECTED: purchase_units is an object, not an array
        purchase_units: {
            currency: "GEL",
            total_amount: amountToPayByCard,
            basket: [{
                quantity: 1,
                unit_price: amountToPayByCard,
                product_id: `ORDER-${orderData.order_number}`
            }]
        },
        redirect_urls: {
            fail: "https://saucerburger.ge/payment-status?status=fail",
            success: "https://saucerburger.ge/payment-status?status=success"
        }
    };

    const bogOrderResponse = await fetch('https://api.bog.ge/payments/v1/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(orderPayload),
    });

    if (!bogOrderResponse.ok) {
        const errorBody = await bogOrderResponse.json();
        throw new Error(`Bank Error Creating Order: ${JSON.stringify(errorBody)}`);
    }

    const bogOrderData = await bogOrderResponse.json();
    const redirectLink = bogOrderData._links?.redirect?.href;

    if (!redirectLink) throw new Error("Could not find payment redirect link from bank.");

    return new Response(JSON.stringify({ paymentComplete: false, redirectUrl: redirectLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Finalize-order function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})