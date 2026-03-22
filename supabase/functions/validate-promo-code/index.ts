// supabase/functions/validate-promo-code/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { promoCode } = await req.json();
    if (!promoCode) {
        throw new Error("Promo code is required.");
    }
    const code = promoCode.toUpperCase().trim();

    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        throw new Error("You must be logged in to use promo codes or coupons.");
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let discountPercentage = 0;
    let discountType = 'percentage';
    let sourceType = null; 
    let minOrderValue = 0; // Added to track minimums

    // 2. Check User-Specific Coupons
    const { data: couponData } = await supabaseAdmin
      .from('coupons')
      .select('discount_percent, usage_limit, used_count, expires_at')
      .eq('code', code)
      .eq('user_id', user.id) 
      .eq('is_active', true)
      .maybeSingle();

    if (couponData) {
      if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
        // Expired
      } else if (couponData.used_count < couponData.usage_limit) {
        discountPercentage = couponData.discount_percent;
        sourceType = 'coupon';
      }
    }

    // 3. Check Global Promo Codes (THE SMART DATABASE CHECK)
    if (!sourceType) {
      const { data: promoData } = await supabaseAdmin
        .from('promo_codes')
        .select('discount_percentage, discount_type, min_order_value') 
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (promoData) {
        // If it's SAUCERDROP, check the transactions table
        if (code === 'SAUCERDROP') {
            const { data: pastOrders } = await supabaseAdmin
              .from('transactions')
              .select('status')
              .eq('user_id', user.id)
              .eq('promo_code_used', code);

            if (pastOrders && pastOrders.length > 0) {
                const hasSuccessfulOrder = pastOrders.some(order => 
                    order.status !== 'pending_payment' && 
                    order.status !== 'failed' && 
                    order.status !== 'cancelled'
                );

                if (hasSuccessfulOrder) {
                    throw new Error(`You have already claimed this one-time free delivery code!`);
                }
            }
        }

        // Code is valid and hasn't been successfully used yet!
        discountPercentage = promoData.discount_percentage;
        discountType = promoData.discount_type; 
        minOrderValue = promoData.min_order_value || 0; // Capture the min order value
        sourceType = 'promo_code';
      }
    }

    // 4. Final Response
    if (sourceType) {
      return new Response(JSON.stringify({ 
        discount: discountPercentage, 
        source: sourceType,
        discount_type: discountType,
        min_order_value: minOrderValue // Send it back to the frontend
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error('Invalid, expired, or already used code.');
    }

  } catch (error: any) { // Typed as any to safely read error.message
    console.error("Validation error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})