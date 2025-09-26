// supabase/functions/initiate-payment/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // CRITICAL: Handles the CORS preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json();
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
      .select('total_price, order_number, status')
      .eq('transaction_id', orderId)
      .single();

    if (orderError || !orderData) throw new Error(`Order not found.`);

    if (orderData.status !== 'pending_payment') {
        throw new Error("Order is not in a payable state.");
    }

    const amountToPayByCard = orderData.total_price;

    // 2. Check if payment is needed
    if (amountToPayByCard < 0.01) {
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

    // 4. BOG Create Order
    const orderPayload = {
        callback_url: `https://kgambgofdizxgcdjhxlk.supabase.co/functions/v1/bog-callback-handler`,
        external_order_id: orderId,
        purchase_units: {
            currency: "GEL",
            total_amount: amountToPayByCard,
            basket: [{
                quantity: 1,
                unit_price: amountToPayByCard,
                product_id: `ORDER-${orderData.order_number}`
            }]
        },
        // CRITICAL UPDATE: Added type=order context parameter
        redirect_urls: {
            fail: "https://saucerburger.ge/payment-status?status=fail&type=order",
            success: "https://saucerburger.ge/payment-status?status=success&type=order"
        }
    };

    const bogOrderResponse = await fetch('https://api.bog.ge/payments/v1/ecommerce/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Accept-Language': 'en'
        },
        body: JSON.stringify(orderPayload),
    });

    if (!bogOrderResponse.ok) {
        const errorBody = await bogOrderResponse.json();
        console.error("Bank Error Details:", JSON.stringify(errorBody));
        throw new Error(`Bank Error Creating Order: ${JSON.stringify(errorBody)}`);
    }

    const bogOrderData = await bogOrderResponse.json();
    const redirectLink = bogOrderData._links?.redirect?.href;

    if (!redirectLink) throw new Error("Could not find payment redirect link from bank.");

    return new Response(JSON.stringify({ paymentComplete: false, redirectUrl: redirectLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("initiate-payment function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})