// supabase/functions/process-invitation/index.ts (CORRECTED VERSION)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Resend } from 'https://esm.sh/resend'

const REWARD_POINTS = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Setup Admin Client (Service Role Key) - Used for database operations (RPC, inserts)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Authenticate the Inviter (Robust Check)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Authorization header missing.");

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '').trim();
    
    // Use a temporary client with the ANON key specifically to validate the user token (JWT)
    const supabaseAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user: inviterUser }, error: userError } = await supabaseAuthClient.auth.getUser(token);

    if (userError || !inviterUser) {
        console.error("Authentication error:", userError);
        throw new Error("Authentication required. Please log in again.");
    }

    // 3. Get and Normalize Invitee Email
    const { invitee_email: raw_invitee_email } = await req.json();
    if (!raw_invitee_email) throw new Error("Friend's email is required.");

    const invitee_email = raw_invitee_email.toLowerCase().trim();

    if (inviterUser.email?.toLowerCase().trim() === invitee_email) {
        throw new Error("You cannot invite yourself.");
    }

    // 4. Check if the user already exists (THE FIX: Using RPC)
    // We call the secure database function instead of the failing auth.admin method.
    const { data: userExists, error: userLookupError } = await supabaseAdmin.rpc('check_user_exists_by_email', {
        p_email: invitee_email
    });

    if (userLookupError) {
        console.error("Error during RPC user lookup:", userLookupError);
        throw new Error("An error occurred while checking registration status.");
    }

    if (userExists) {
        throw new Error("This person is already a registered user.");
    }
    // --- END OF FIX ---

    // 5. Check if an active invitation already exists
    const { data: existingInvite } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('invitee_email', invitee_email)
      .in('status', ['pending_signup', 'signed_up'])
      .maybeSingle();
      
    if (existingInvite) throw new Error("This person already has an active invitation.");

    // 6. Create Invitation Record
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

    // 7. Send Email
    const resendApiKey = Deno.env.get('INVITE_SYSTEM_KEY');
    // CRITICAL: Ensure this Secret is set in your Supabase Dashboard (Functions > Secrets)
    if (!resendApiKey) throw new Error("Resend API Key (INVITE_SYSTEM_KEY) not found in environment secrets.");
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
    
    if (emailError) {
        console.error("Resend error:", emailError);
        // If the email fails, the invitation is still created. Return success (200) but with a warning message.
        return new Response(JSON.stringify({ message: `Invitation created, but the email failed to send. Please contact support if this persists.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Success, but with warning
        });
    }

    // 8. Success response
    return new Response(JSON.stringify({ message: `Invitation sent successfully! You will receive points after their first purchase.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function failed:", error.message);
    // Return a 400 Bad Request for expected errors (like user exists, missing email, auth failure)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})