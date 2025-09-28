// supabase/functions/generate-order-number/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

const TBILISI_OFFSET = 4 * 60 * 60 * 1000; // +4 hours for Georgia Standard Time

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderType } = await req.json();
    if (!orderType || !['app_pickup', 'shop_pickup', 'dine_in'].includes(orderType)) {
      throw new Error('Invalid orderType provided.');
    }

    const prefixMap = {
      app_pickup: 'APP',
      shop_pickup: 'SHOP',
      dine_in: 'DINE',
    };
    const prefix = prefixMap[orderType];

    const now = new Date(Date.now() + TBILISI_OFFSET);
    const datePart = format(now, "ddMMyy");
    const timePart = format(now, "HHmmss");

    // Corrected to use datePart
    const searchPattern = `${prefix}-${datePart}-%`;

    const { data: lastOrder, error: queryError } = await supabaseAdmin
      .from('transactions')
      .select('order_number')
      .like('order_number', searchPattern)
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError;
    }

    let nextSequence = 1;
    if (lastOrder) {
      // The sequence is the 4th part (index 3) of the string
      const lastSequence = parseInt(lastOrder.order_number.split('-')[3], 10);
      nextSequence = lastSequence + 1;
    }
    
    const paddedSequence = String(nextSequence).padStart(6, '0');
    const newOrderNumber = `${prefix}-${datePart}-${timePart}-${paddedSequence}`;

    return new Response(JSON.stringify({ orderNumber: newOrderNumber }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});