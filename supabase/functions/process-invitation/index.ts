// supabase/functions/process-invitation/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Assuming you have this shared file
import { Resend } from 'https://esm.sh/resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitee_email } = await req.json();
    if (!invitee_email) {
      throw new Error("Invitee email is required.");
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY'); // Use the key we set up
    if (!resendApiKey) throw new Error("Resend API Key not found in environment variables.");

    const resend = new Resend(resendApiKey);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the inviter from the auth header
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user: inviterUser }, error: userError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();
    if (userError || !inviterUser) throw new Error("Could not identify the inviter.");
    
    // Check 1: User cannot invite themselves
    if (inviterUser.email === invitee_email) {
      throw new Error("You cannot invite yourself!");
    }

    // Check 2: Is this email already a registered user?
    const { data: { user: existingUser } } = await supabaseAdmin.auth.admin.getUserByEmail(invitee_email)
    if (existingUser) {
        throw new Error("This person is already a registered user.");
    }

    // Check 3: Has this email already been invited and is pending?
    const { data: existingInvite } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('invitee_email', invitee_email)
      .eq('status', 'sent')
      .maybeSingle();
    if (existingInvite) throw new Error("This person already has a pending invitation.");

    // All checks passed. Create the invitation.
    const inviteCode = crypto.randomUUID();
    const pointsForSending = 3;

    // --- FIX: This now includes all the necessary fields ---
    const { error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        inviter_id: inviterUser.id,
        invitee_email: invitee_email,
        code: inviteCode,
        status: 'sent',
        points_for_sending: pointsForSending,
        points_for_signup: 3
      });
    if (insertError) throw new Error(`Could not create invitation: ${insertError.message}`);
    
    // Award the initial points to the inviter
    const { error: creditError } = await supabaseAdmin.rpc('award_points', {
      p_user_id: inviterUser.id,
      p_points_to_add: pointsForSending
    });
    if (creditError) throw new Error(`Failed to award points: ${creditError.message}`);

    // Send the custom email
    const signUpLink = `https://saucerburger.ge/register?invite_code=${inviteCode}`;
    const { error: emailError } = await resend.emails.send({
        from: 'Saucer Burger <noreply@saucerburger.ge>',
        to: [invitee_email],
        subject: 'You\'ve been invited to Saucer Burger! 🍔',
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;"><h2>You're Invited!</h2><p>Your friend thinks you'd love Saucer Burger, and they've sent you an invitation to join the experience.</p><p>As a member, you can earn loyalty points for rewards, get cashback on your orders, and enjoy a faster checkout.</p><a href="${signUpLink}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation & Create Account</a><p style="margin-top: 20px;">Thanks,<br/>The Saucer Burger Team</p></div>`,
    });
    if (emailError) throw new Error(`Invitation created, but failed to send email: ${emailError.message}`);

    return new Response(JSON.stringify({ message: `Success! ${pointsForSending} points awarded.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})