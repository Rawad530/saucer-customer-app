// supabase/functions/bog-payment/index.ts

import { corsHeaders } from '../_shared/cors.ts'

console.log("BOG Payment function initialized");

Deno.serve(async (req) => {
  // This is needed to handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amount } = await req.json();
    if (!orderId || !amount) {
      throw new Error("Order ID and amount are required.");
    }

    // --- Step 1: Authentication ---
    // Get the secret keys we stored in the Vault
    const clientId = Deno.env.get('BOG_CLIENT_ID');
    const clientSecret = Deno.env.get('BOG_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error("API credentials are not configured correctly.");
    }

    // Encode the credentials for Basic Auth
    const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    const tokenResponse = await fetch('https://api.businessonline.ge/api/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get authorization token from the bank.');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // --- Step 2: Create the Payment Order ---
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "GEL",
          value: amount.toFixed(2), // Ensure amount is a string with 2 decimal places
        }
      }],
      redirect_url: "https://saucerburger.ge/payment-status", // A page we will create later
      shop_order_id: orderId,
    };

    const orderResponse = await fetch('https://ipay.ge/opay/api/v1/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorBody = await orderResponse.json();
      throw new Error(`Failed to create payment order: ${JSON.stringify(errorBody)}`);
    }

    const orderData = await orderResponse.json();
    
    // Find the redirect link from the bank's response
    const redirectLink = orderData.links?.find((link: any) => link.rel === 'approve');

    if (!redirectLink || !redirectLink.href) {
      throw new Error("Could not find the payment redirect link in the bank's response.");
    }
    
    // --- Step 3: Send the Link Back to the App ---
    return new Response(JSON.stringify({ redirectUrl: redirectLink.href }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})