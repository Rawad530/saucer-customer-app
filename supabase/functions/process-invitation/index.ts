// supabase/functions/process-invitation/index.ts (NEW SECURE VERSION)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Resend } from 'https://esm.sh/resend'

const REWARD_POINTS = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Setup Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Identify the Inviter (using the user's authorization header)
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user: inviterUser }, error: userError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (userError || !inviterUser) throw new Error("Authentication required.");

    // Get Invitee Email
    const { invitee_email } = await req.json();
    if (!invitee_email) throw new Error("Friend's email is required.");
    if (inviterUser.email === invitee_email) throw new Error("You cannot invite yourself.");

    // Check if already registered (Using Admin access)
    const { data: userLookup, error: userLookupError } = await supabaseAdmin.auth.admin.getUserByEmail(invitee_email);
    
    if (userLookup?.user) {
        throw new Error("This person is already a registered user.");
    }
    // Robust check: Ensure the error is only 'User not found' (Status 404).
    if (userLookupError && userLookupError.status !== 404 && userLookupError.message !== 'User not found') {
        console.error("Error during user lookup:", userLookupError);
        throw new Error("An error occurred while checking registration status.");
    }

    // Check if an active invitation already exists
    const { data: existingInvite } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('invitee_email', invitee_email)
      .in('status', ['pending_signup', 'signed_up'])
      .maybeSingle();
    if (existingInvite) throw new Error("This person already has an active invitation.");

    // Create Invitation Record
    const inviteCode = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        inviter_id: inviterUser.id,
        invitee_email: invitee_email,
        code: inviteCode,
        status: 'pending_signup',
        reward_points: REWARD_POINTS
      });
    if (insertError) throw new Error(`Could not create invitation: ${insertError.message}`);

    // IMPORTANT: We DO NOT award points here anymore.

    // Send Email (Updated messaging)
    const resendApiKey = Deno.env.get('INVITE_SYSTEM_KEY');
    if (!resendApiKey) throw new Error("Resend API Key (INVITE_SYSTEM_KEY) not found.");
    const resend = new Resend(resendApiKey);

    const registrationLink = `https://saucerburger.ge/register?invite_code=${inviteCode}`;
    const { error: emailError } = await resend.emails.send({
        from: 'Saucer Burger <noreply@saucerburger.ge>',
        to: [invitee_email],
        subject: 'Get 10% Off! Your friend invited you to Saucer Burger 🍔',
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>You're Invited!</h2>
                <p>Your friend thinks you'd love Saucer Burger!</p>
                <p>Sign up using the link below and you will automatically receive a <strong>10% discount coupon</strong> for your first order.</p>
                <a href="${registrationLink}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation & Get 10% Off</a>
                <p style="margin-top: 20px;">Thanks,<br/>The Saucer Burger Team</p>
               </div>`,
    });
    if (emailError) throw new Error(`Invitation created, but failed to send email: ${JSON.stringify(emailError)}`);

    // Success response
    return new Response(JSON.stringify({ message: `Invitation sent successfully! You will receive points after their first purchase.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Function failed:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})