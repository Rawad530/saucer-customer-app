// supabase/functions/add-funds-to-wallet/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Securely identify the user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Initialize Supabase Clients (User context and Admin context)
  const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
  )

  const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { amount, transactionId } = await req.json();
    if (!amount || !transactionId) {
      throw new Error("Amount and a unique transaction ID are required.");
    }

    // Verify User Identity
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        throw new Error("User not authenticated.");
    }

    // 2. Register the pending top-up
    const { error: insertError } = await supabaseAdmin.from('pending_wallet_topups').insert({
        topup_id: transactionId,
        customer_id: user.id,
        amount: amount
    });
    if (insertError) {
        throw new Error(`Failed to register pending top-up: ${insertError.message}`);
    }

    // 3. BOG Authentication
    const clientId = Deno.env.get('BOG_CLIENT_ID');
    const clientSecret = Deno.env.get('BOG_CLIENT_SECRET');
    const basicAuthHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
    const tokenResponse = await fetch('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': basicAuthHeader },
        body: 'grant_type=client_credentials',
    });
    if (!tokenResponse.ok) {
        throw new Error(`Bank auth failed: ${await tokenResponse.text()}`);
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 4. BOG Create Order
    const orderPayload = {
        callback_url: `https://kgambgofdizxgcdjhxlk.supabase.co/functions/v1/bog-callback-handler`,
        external_order_id: transactionId,
        purchase_units: {
            currency: "GEL",
            total_amount: amount,
            basket: [{
                quantity: 1,
                unit_price: amount,
                product_id: "WALLET-TOP-UP"
            }]
        },
        // CRITICAL UPDATE: Added type=wallet context parameter
        redirect_urls: {
            fail: `https://saucerburger.ge/payment-status?status=fail&type=wallet`,
            success: `https://saucerburger.ge/payment-status?status=success&type=wallet&transaction_id=${transactionId}`
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
        throw new Error(`Bank Error: ${JSON.stringify(await bogOrderResponse.json())}`);
    }

    const bogOrderData = await bogOrderResponse.json();
    const redirectLink = bogOrderData._links?.redirect?.href;
    if (!redirectLink) throw new Error("Could not find redirect link from bank.");
    
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