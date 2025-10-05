// supabase/functions/approve-quest/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { submissionId } = await req.json()
    if (!submissionId) throw new Error("Submission ID is required.")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the submission to get user_id and points
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('quest_submissions')
      .select('user_id, points_to_award, status')
      .eq('id', submissionId)
      .single()

    if (fetchError) throw new Error(`Submission not found: ${fetchError.message}`)
    if (submission.status !== 'pending') throw new Error("This submission has already been processed.")

    // Update the submission status to 'approved'
    const { error: updateError } = await supabaseAdmin
      .from('quest_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId)

    if (updateError) throw updateError;

    // Award the points by updating the user's profile
    const { error: pointsError } = await supabaseAdmin.rpc('award_points', {
      p_user_id: submission.user_id,
      p_points_to_add: submission.points_to_award
    })

    if (pointsError) throw pointsError;

    return new Response(JSON.stringify({ message: "Quest approved and points awarded." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})