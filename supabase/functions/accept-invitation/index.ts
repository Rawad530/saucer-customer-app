// supabase/functions/accept-invitation/index.ts
// --- MODIFIED FILE ---

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invite_code } = await req.json()
    if (!invite_code) throw new Error('Invite code is required.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user: newUser } } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (!newUser) throw new Error('Could not identify the new user.')

    // Find the invitation and update its status
    const { error } = await supabaseAdmin
      .from('invitations')
      .update({
        status: 'awaiting_purchase', // Set status to wait for the first order
        invitee_id: newUser.id,
        accepted_at: new Date().toISOString()
      })
      .eq('code', invite_code)
      .eq('status', 'sent') // Only update invitations that are pending

    if (error) throw new Error('Invalid invitation code or the invitation could not be updated.')
    
    // NO POINTS ARE AWARDED HERE.

    return new Response(JSON.stringify({ message: 'Invitation accepted. Your account is ready.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})