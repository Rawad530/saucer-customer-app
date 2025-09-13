import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed to handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { promoCode } = await req.json()

    // Create a Supabase client with the service role key to securely access private tables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find an active promo code that matches the one provided
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('discount_percentage')
      .eq('code', promoCode)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw new Error('Invalid or expired promo code.')
    }

    // Return the discount percentage if the code is valid
    return new Response(JSON.stringify({ discount: data.discount_percentage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})