// supabase/functions/process-referral-purchase/index.ts
// --- NEW FILE ---

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function must be called by an authenticated user (the one who just made a purchase)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user: buyer } } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (!buyer) throw new Error('Could not identify the buyer.')

    // Find a pending invitation linked to this buyer
    const { data: invitation, error: findError } = await supabaseAdmin
      .from('invitations')
      .select('id, inviter_id, points_for_signup')
      .eq('invitee_id', buyer.id)
      .eq('status', 'awaiting_purchase') // IMPORTANT: Look for this specific status
      .single()

    // If no invitation is found, or an error occurs, it's not a referral purchase. Exit gracefully.
    if (findError || !invitation) {
      return new Response(JSON.stringify({ message: 'Not a referral purchase.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If we found one, award points to the inviter
    const { error: creditError } = await supabaseAdmin.rpc('award_points', {
      p_user_id: invitation.inviter_id,
      p_points_to_add: invitation.points_for_signup
    })

    if (creditError) throw new Error(`Could not award points: ${creditError.message}`)

    // Finally, update the invitation to mark it as fully completed
    await supabaseAdmin
      .from('invitations')
      .update({ status: 'completed' })
      .eq('id', invitation.id)

    return new Response(JSON.stringify({ message: 'Referral points awarded successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})