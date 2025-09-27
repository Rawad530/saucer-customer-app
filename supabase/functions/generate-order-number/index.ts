// supabase/functions/generate-order-number/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

// Get the Tbilisi timezone offset
const TBILISI_OFFSET = 4 * 60 * 60 * 1000; // +4 hours in milliseconds

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderType } = await req.json(); // e.g., 'app_pickup', 'shop_pickup', 'dine_in'
    if (!orderType || !['app_pickup', 'shop_pickup', 'dine_in'].includes(orderType)) {
      throw new Error('Invalid orderType provided.');
    }

    const prefixMap = {
      app_pickup: 'APP',
      shop_pickup: 'SHOP',
      dine_in: 'DINE',
    };
    const prefix = prefixMap[orderType];

    // Get current date in Tbilisi (YYYY-MM-DD)
    const now = new Date(Date.now() + TBILISI_OFFSET);
    const datePrefix = format(now, "yyMMdd");
    const todayStart = new Date(now.toISOString().split('T')[0] + 'Z');

    const searchPattern = `${prefix}-${datePrefix}-%`;

    // Find the last order number for today with the same prefix
    const { data: lastOrder, error: queryError } = await supabaseAdmin
      .from('transactions')
      .select('order_number')
      .like('order_number', searchPattern)
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means 'no rows found'
      throw queryError;
    }

    let nextSequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.order_number.split('-')[2], 10);
      nextSequence = lastSequence + 1;
    }
    
    // Pad the sequence number with leading zeros to make it 3 digits
    const paddedSequence = String(nextSequence).padStart(3, '0');
    const newOrderNumber = `${prefix}-${datePrefix}-${paddedSequence}`;

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