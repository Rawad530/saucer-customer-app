import { corsHeaders } from '../_shared/cors.ts'
// Note: createClient is not needed here if we don't interact with the DB before payment

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, transactionId } = await req.json();
    if (!amount || !transactionId) {
      throw new Error("Amount and a unique transaction ID are required.");
    }

    // 1. BOG Authentication
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

    // 2. BOG Create Order (CORRECTED PAYLOAD)
    const orderPayload = {
        callback_url: `https://kgambgofdizxgcdjhxlk.supabase.co/functions/v1/bog-callback-handler`,
        external_order_id: transactionId,
        // CORRECTED: purchase_units is an object, not an array
        purchase_units: {
            currency: "GEL",
            total_amount: amount,
            basket: [{
                quantity: 1,
                unit_price: amount,
                product_id: "WALLET-TOP-UP"
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
        throw new Error(`Bank Error: ${JSON.stringify(errorBody)}`);
    }

    const bogOrderData = await bogOrderResponse.json();
    const redirectLink = bogOrderData._links?.redirect?.href;

    if (!redirectLink) throw new Error("Could not find payment redirect link from bank.");

    return new Response(JSON.stringify({ redirectUrl: redirectLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Add-funds-to-wallet function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})