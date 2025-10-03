// supabase/functions/send-invite-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ email: invitee_email });
    if (listUsersError) throw new Error(`Error checking for existing user: ${listUsersError.message}`);
    if (users && users.length > 0) throw new Error("This person is already a registered user.");

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
    
    // --- TEMPORARY DEBUG: Your API key is hardcoded here for this test ---
    const resendApiKey = "re_5AhUzWiZ_FhDNvRR4nv6o51SksrqZ6J13"; 
    // const resendApiKey = Deno.env.get('RESEND_API_KEY'); 
    // --------------------------------------------------------------------

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