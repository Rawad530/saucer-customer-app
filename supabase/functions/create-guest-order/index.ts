import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { guestName, guestContact, orderItems, totalPrice } = await req.json();
    if (!guestName || !guestContact || !orderItems || totalPrice === undefined) {
      throw new Error("Guest details and order information are required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Create a new unclaimed_profile for the guest
    const { data: unclaimedProfile, error: unclaimedError } = await supabaseAdmin
      .from('unclaimed_profiles')
      .insert({ guest_name: guestName, guest_contact: guestContact })
      .select()
      .single();

    if (unclaimedError) throw unclaimedError;

    // Step 2: Get the next unique order number
    const { data: orderNumberData, error: orderNumberError } = await supabaseAdmin
      .rpc('get_next_order_number');
    if (orderNumberError) throw orderNumberError;

    // Step 3: Create the transaction and link it to the unclaimed profile
    const transactionId = crypto.randomUUID();
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        transaction_id: transactionId,
        unclaimed_profile_id: unclaimedProfile.id,
        order_number: orderNumberData,
        items: orderItems,
        total_price: totalPrice,
        payment_mode: 'Card - Online',
        status: 'pending_payment',
        order_type: 'pick_up', // Guest orders are always pick-up
      });

    if (transactionError) throw transactionError;

    // Return the unique transaction ID to start the payment process
    return new Response(JSON.stringify({ transactionId }), {
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