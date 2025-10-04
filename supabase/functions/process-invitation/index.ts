// supabase/functions/process-invitation/index.ts (Fresh Start Version)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Hardcoded CORS headers for stability, bypassing potential shared file issues.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitee_email } = await req.json();
    if (!invitee_email) {
      throw new Error("Invitee email is required.");
    }

    // --- Using the fresh secret name: INVITE_SYSTEM_KEY ---
    const resendApiKey = Deno.env.get('INVITE_SYSTEM_KEY');
    // ------------------------------------------------------
    
    if (!resendApiKey) throw new Error("Invite System Key not found in Supabase Vault.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check #1: Is this email already a registered user?
    const { data: userExists, error: rpcError } = await supabaseAdmin.rpc('does_user_exist', {
      email_to_check: invitee_email
    });
    if (rpcError) throw new Error(`Error checking for existing user: ${rpcError.message}`);
    if (userExists) throw new Error("This person is already a registered user.");

    // Check #2: Has this email already been invited and is pending?
    const { data: existingInvite, error: inviteCheckError } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('invitee_email', invitee_email)
      .eq('status', 'pending')
      .maybeSingle();
    if (inviteCheckError) throw new Error(`Error checking for existing invitations: ${inviteCheckError.message}`);
    if (existingInvite) throw new Error("This person already has a pending invitation.");

    // Identify the inviter
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: inviterUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !inviterUser) throw new Error("Could not identify the inviter.");

    // Award points
    const { error: creditError } = await supabaseAdmin.rpc('credit_points', { user_id_to_credit: inviterUser.id, points_to_add: 3 });
    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseAdmin.from('invitations').insert({ inviter_id: inviterUser.id, invitee_email: invitee_email }).select('id').single();
    if (inviteError) throw new Error(`Could not create invitation: ${inviteError.message}`);
    
    // Send the email
    const signUpLink = `https://saucerburger.ge/register?invite_code=${invitation.id}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Saucer Burger <noreply@saucerburger.ge>',
        to: [invitee_email],
        subject: 'You have been invited to Saucer Burger!',
        html: `<p>Your friend has invited you to join the Saucer Burger loyalty program.</p><a href="${signUpLink}">Sign Up Now</a>`,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Invitation created, but failed to send email. Status: ${res.status}. Body: ${errorBody}`);
    }

    return new Response(JSON.stringify({ message: "Invitation sent successfully!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Function failed with error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})