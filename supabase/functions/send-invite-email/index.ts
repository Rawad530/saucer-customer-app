// supabase/functions/send-invite-email/index.ts (Final Secure Version)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// The corsHeaders object is hardcoded here to prevent any deployment issues.
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
    
    // All checks passed, proceed...
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: inviterUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !inviterUser) throw new Error("Could not identify the inviter.");
    
    const { error: creditError } = await supabaseAdmin.rpc('credit_points', { user_id_to_credit: inviterUser.id, points_to_add: 3 });
    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);

    const { data: invitation, error: inviteError } = await supabaseAdmin.from('invitations').insert({ inviter_id: inviterUser.id, invitee_email: invitee_email }).select('id').single();
    if (inviteError) throw new Error(`Could not create invitation: ${inviteError.message}`);
    
    // Securely reading the API key from the Vault
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error("Resend API key not found in Supabase Vault.");

    const signUpLink = `https://saucerburger.ge/register?invite_code=${invitation.id}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        // Using your verified domain email address
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