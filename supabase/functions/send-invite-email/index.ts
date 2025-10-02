// supabase/functions/send-invite-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  console.log("Function invoked."); // Log start

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitee_email } = await req.json();
    if (!invitee_email) {
      throw new Error("Invitee email is required.");
    }
    console.log(`Payload received for: ${invitee_email}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Admin client created.");

    console.log("Checking for existing user...");
    const { data: existingUserData } = await supabaseAdmin.auth.admin.getUserByEmail(invitee_email);
    console.log("User check complete.");

    if (existingUserData?.user) {
      throw new Error("This person is already a registered user.");
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log("Getting inviter details...");
    const { data: { user: inviterUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !inviterUser) throw new Error("Could not identify the inviter.");
    console.log(`Inviter found: ${inviterUser.id}`);
    
    console.log("Awarding points...");
    const { error: creditError } = await supabaseAdmin.rpc('credit_points', {
      user_id_to_credit: inviterUser.id,
      points_to_add: 3
    });
    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);
    console.log("Points awarded successfully.");

    console.log("Creating invitation record...");
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({ inviter_id: inviterUser.id, invitee_email: invitee_email })
      .select('id')
      .single();
    if (inviteError) throw new Error(`Could not create invitation: ${inviteError.message}`);
    console.log(`Invitation record created: ${invitation.id}`);
    
    console.log("Sending email via Resend...");
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
        html: `<p>Your friend has invited you to join the Saucer Burger loyalty program.</p><a href="${signUpLink}">Sign Up Now</a>`,
      }),
    });
    console.log(`Resend response status: ${res.status}`);

    if (!res.ok) {
        const errorBody = await res.text();
        console.error("Failed to send email:", errorBody);
        throw new Error(`Invitation created, but failed to send email. Status: ${res.status}`);
    }

    console.log("Function completed successfully.");
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