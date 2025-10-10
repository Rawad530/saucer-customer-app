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

    // 1. Authentication Check (Required for user-specific coupons)
    const authHeader = req.headers.get('Authorization')!;
    // Create a client using the user's Authorization header to identify them.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        // Guests cannot use referral coupons or other specific promos in this setup.
        throw new Error("You must be logged in to use promo codes or coupons.");
    }
    
    // Use Service Role Key for secure access to database tables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let discountPercentage = 0;
    let sourceType = null; // 'coupon' or 'promo_code'

    // 2. Check User-Specific Coupons (e.g., Referral Bonuses)
    const { data: couponData } = await supabaseAdmin
      .from('coupons')
      .select('discount_percent, usage_limit, used_count, expires_at')
      .eq('code', code)
      .eq('user_id', user.id) // SECURITY: Must belong to the user
      .eq('is_active', true)
      .maybeSingle();

    if (couponData) {
      // Check expiration (if applicable) and usage limit
      if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
        // Coupon is expired
      } else if (couponData.used_count < couponData.usage_limit) {
        discountPercentage = couponData.discount_percent;
        sourceType = 'coupon';
      }
    }

    // 3. If no valid user coupon found, check Generic Promo Codes
    if (!sourceType) {
      const { data: promoData } = await supabaseAdmin
        // Note: Assuming your existing table column name is 'discount_percentage'
        .from('promo_codes')
        .select('discount_percentage') 
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (promoData) {
        discountPercentage = promoData.discount_percentage;
        sourceType = 'promo_code';
      }
    }

    // 4. Final Response
    if (sourceType) {
      return new Response(JSON.stringify({ discount: discountPercentage, source: sourceType }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Consolidated error message
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