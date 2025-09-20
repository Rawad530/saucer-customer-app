// supabase/functions/award-cashback/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId } = await req.json();
    if (!customerId) {
      throw new Error("Customer ID is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Find the customer's most recent completed order
    const { data: lastOrder, error: orderError } = await supabaseAdmin
      .from('transactions')
      .select('transaction_id, total_price, order_type, cashback_awarded')
      .eq('user_id', customerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !lastOrder) {
      throw new Error("No recent completed order found for this customer.");
    }

    // Step 2: Perform security checks
    if (lastOrder.order_type !== 'dine_in') {
      throw new Error("Cashback is only available for dine-in orders.");
    }
    if (lastOrder.cashback_awarded) {
      throw new Error("Cashback has already been awarded for this order.");
    }

    // Step 3: Calculate cashback and credit the wallet
    const cashbackAmount = lastOrder.total_price * 0.05;
    if (cashbackAmount <= 0) {
      throw new Error("No cashback to award for this order.");
    }
    
    // Call the secure database function to credit the wallet
    const { error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
      customer_id_to_credit: customerId,
      amount_to_credit: cashbackAmount,
      transaction_description: `5% cashback for dine-in order #${lastOrder.transaction_id.substring(0, 8)}`,
    });

    if (creditError) throw creditError;

    // Step 4: Mark the order to prevent double-dipping
    await supabaseAdmin
      .from('transactions')
      .update({ cashback_awarded: true })
      .eq('transaction_id', lastOrder.transaction_id);

    return new Response(JSON.stringify({ message: `Success! ₾${cashbackAmount.toFixed(2)} cashback awarded.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
```

Finally, save the file and deploy this new function by running this command in your terminal:

```bash
npx supabase functions deploy award-cashback --no-verify-jwt
