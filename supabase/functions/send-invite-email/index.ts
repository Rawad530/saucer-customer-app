// supabase/functions/send-invite-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// REMOVED: The import for corsHeaders has been removed.

// --- NEW: The corsHeaders object is now hardcoded directly inside this file ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
// --------------------------------------------------------------------------

Deno.serve(async (req) => {
  // The OPTIONS handler now uses the local corsHeaders object
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitee_email } = await req.json();
    if (!invitee_email) {
      throw new Error("Invitee email is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingUserData } = await supabaseAdmin.auth.admin.getUserByEmail(invitee_email);

    if (existingUserData?.user) {
      throw new Error("This person is already a registered user.");
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: inviterUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !inviterUser) throw new Error("Could not identify the inviter.");

    const { error: creditError } = await supabaseAdmin.rpc('credit_points', {
      user_id_to_credit: inviterUser.id,
      points_to_add: 3
    });

    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        inviter_id: inviterUser.id,
        invitee_email: invitee_email,
      })
      .select('id')
      .single();

    if (inviteError) throw new Error(`Could not create invitation: ${inviteError.message}`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const signUpLink = `https://saucerburger.ge/register?invite_code=${invitation.id}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Saucer Burger <onboarding@resend.dev>',
        to: [invitee_email],
        subject: 'You have been invited to Saucer Burger!',
        html: `...HTML for the email...`,
      }),
    });

    if (!res.ok) {
        console.error("Failed to send email:", await res.text());
        throw new Error("Invitation created, but failed to send the email.");
    }

    return new Response(JSON.stringify({ message: "Invitation sent successfully!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})