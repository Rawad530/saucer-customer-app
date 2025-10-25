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

    // --- MODIFICATION 1: Add 'delivery' to allowed types ---
    if (!orderType || !['app_pickup', 'shop_pickup', 'dine_in', 'delivery'].includes(orderType)) {
      throw new Error(`Invalid orderType provided: ${orderType}`); // Added type to error message
    }
    // --------------------------------------------------------

    // --- MODIFICATION 2: Add 'delivery' prefix ---
    const prefixMap = {
      app_pickup: 'APP',
      shop_pickup: 'SHOP',
      dine_in: 'DINE',
      delivery: 'DLV', // Added delivery prefix
    };
    // ---------------------------------------------
    const prefix = prefixMap[orderType];

    const now = new Date(Date.now() + TBILISI_OFFSET);
    const datePart = format(now, "ddMMyy");
    const timePart = format(now, "HHmmss");

    const searchPattern = `${prefix}-${datePart}-%`;

    const { data: lastOrder, error: queryError } = await supabaseAdmin
      .from('transactions')
      .select('order_number')
      .like('order_number', searchPattern)
      .order('order_number', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

    // Simplified error handling
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = 0 rows returned
        console.error("Database query error:", queryError);
        throw new Error(`Database error fetching last order number: ${queryError.message}`);
    }


    let nextSequence = 1;
    if (lastOrder && lastOrder.order_number) { // Check if order_number exists
       // --- MODIFICATION 3: More robust sequence extraction ---
       const parts = lastOrder.order_number.split('-');
       if (parts.length === 4 && !isNaN(parseInt(parts[3], 10))) {
           const lastSequence = parseInt(parts[3], 10);
           nextSequence = lastSequence + 1;
       } else {
           console.warn(`Could not parse sequence from unexpected order number format: ${lastOrder.order_number}. Resetting sequence to 1.`);
           // Reset sequence if format is wrong, preventing NaN
       }
       // ----------------------------------------------------
    }

    const paddedSequence = String(nextSequence).padStart(6, '0');
    const newOrderNumber = `${prefix}-${datePart}-${timePart}-${paddedSequence}`;

    return new Response(JSON.stringify({ orderNumber: newOrderNumber }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("!!! Error in generate-order-number:", error.message); // Added console log for errors
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});