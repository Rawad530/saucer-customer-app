// supabase/functions/get-next-order-number/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the highest order number in the entire transactions table
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore error for "query returned no rows"
      throw error;
    }

    let nextOrderNumber = 10001;
    if (data && data.order_number) {
      nextOrderNumber = data.order_number + 1;
    }

    return new Response(JSON.stringify({ nextOrderNumber }), {
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