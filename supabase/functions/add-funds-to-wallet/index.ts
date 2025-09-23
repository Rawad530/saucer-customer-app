// supabase/functions/add-funds-to-wallet/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, transactionId } = await req.json();
    if (!amount || !transactionId) {
      throw new Error("Amount and a unique transaction ID are required.");
    }

    const clientId = Deno.env.get('BOG_CLIENT_ID');
    const clientSecret = Deno.env.get('BOG_CLIENT_SECRET');
    const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    // --- THIS IS THE FINAL, CORRECT AUTHENTICATION URL FROM YOUR NEW DOCUMENTATION ---
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

    const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "GEL", value: amount.toFixed(2) } }],
        redirect_url: "https://saucerburger.ge/payment-status",
        shop_order_id: transactionId,
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

    return new Response(JSON.stringify({ redirectUrl: redirectLink.href }), {
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