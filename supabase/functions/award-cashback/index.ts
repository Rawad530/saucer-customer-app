// supabase/functions/award-cashback/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId } = await req.json();
    if (!transactionId) {
      throw new Error("Transaction ID is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Fetch the transaction to verify it's eligible
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('total_price, user_id, order_type, cashback_awarded, order_number')
      .eq('transaction_id', transactionId)
      .single();

    if (fetchError) throw new Error(`Could not find transaction: ${fetchError.message}`);

    // Step 2: Perform safety checks
    if (!transaction.user_id) {
      throw new Error("Cannot award cashback: Order is not linked to a customer.");
    }
    if (transaction.order_type !== 'dine_in') {
      throw new Error("Cannot award cashback: Order is not a dine-in order.");
    }
    if (transaction.cashback_awarded) {
      throw new Error("Cashback has already been awarded for this order.");
    }

    // Step 3: Calculate cashback and credit the customer's wallet
    const cashbackAmount = transaction.total_price * 0.05;
    
    if (cashbackAmount > 0) {
      const { error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
        customer_id_to_credit: transaction.user_id,
        amount_to_credit: cashbackAmount,
        transaction_description: `5% cashback for order #${transaction.order_number}`,
      });

      if (creditError) throw new Error(`Failed to credit wallet: ${creditError.message}`);
    }

    // Step 4: Mark the transaction so cashback can't be awarded again
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ cashback_awarded: true })
      .eq('transaction_id', transactionId);

    if (updateError) throw new Error(`Failed to mark cashback as awarded: ${updateError.message}`);

    return new Response(JSON.stringify({ message: `Successfully awarded ${cashbackAmount.toFixed(2)} GEL cashback.` }), {
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