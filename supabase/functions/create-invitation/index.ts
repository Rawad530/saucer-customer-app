// supabase/functions/create-invitation/index.ts

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

    // 1. Create a Supabase client with the user's authorization
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Get the inviter's user data
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Could not identify the inviter.");

    const inviterId = user.id;

    // 3. Use the Admin client for secure operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Immediately award 5 points to the inviter
    const { error: creditError } = await supabaseAdmin.rpc('credit_points', {
      user_id_to_credit: inviterId,
      points_to_add: 5
    });

    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);

    // 5. Create the invitation record in the database
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        inviter_id: inviterId,
        invitee_email: invitee_email,
      })
      .select('id') // Get the ID of the new invitation
      .single();

    if (inviteError) throw new Error(`Could not create invitation: ${inviteError.message}`);

    // 6. Send the invitation email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const signUpLink = `https://saucerburger.ge/register?invite_code=${invitation.id}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Saucer Burger <onboarding@resend.dev>', // Or your verified domain
        to: [invitee_email],
        subject: 'You have been invited to Saucer Burger!',
        html: `
          <h1>You're Invited!</h1>
          <p>Your friend has invited you to join the Saucer Burger loyalty program.</p>
          <p>Sign up using the link below to get started and earn rewards.</p>
          <a href="${signUpLink}" style="padding: 10px 15px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 5px;">Sign Up Now</a>
          <p>See you soon!</p>
          <p>- The Saucer Burger Team</p>
        `,
      }),
    });

    if (!res.ok) {
        // If email fails, we should ideally roll back the points, but for now we'll just log it
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