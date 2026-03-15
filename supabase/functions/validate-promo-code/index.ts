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
    let discountType = 'percentage'; // Default to percentage
    let sourceType = null; 

    // 2. Check User-Specific Coupons First (Your existing logic)
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

    // 3. Check Global Promo Codes (UPDATED LOGIC)
    if (!sourceType) {
      const { data: promoData } = await supabaseAdmin
        .from('promo_codes')
        // We now pull the new columns we added to the database
        .select('discount_percentage, discount_type, min_order_value') 
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (promoData) {
        // SECURITY CHECK: Has this user already used this specific global code?
        const { data: usageHistory } = await supabaseAdmin
          .from('promo_usage')
          .select('id')
          .eq('user_id', user.id)
          .eq('promo_code', code)
          .maybeSingle();

        if (usageHistory) {
           throw new Error(`You have already used the code ${code}.`);
        }

        // If they haven't used it, map the variables
        discountPercentage = promoData.discount_percentage;
        discountType = promoData.discount_type; // This will now grab 'free_delivery'
        sourceType = 'promo_code';
      }
    }

    // 4. Final Response (UPDATED TO RETURN DISCOUNT TYPE)
    if (sourceType) {
      return new Response(JSON.stringify({ 
        discount: discountPercentage, 
        source: sourceType,
        discount_type: discountType // Send this back to React so it knows what to do!
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error('Invalid, expired, or already used code.');
    }

  } catch (error) {
    console.error("Validation error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})