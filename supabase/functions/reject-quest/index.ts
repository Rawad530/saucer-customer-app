// supabase/functions/reject-quest/index.ts

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

    // Update the submission status to 'rejected'
    const { error: updateError } = await supabaseAdmin
      .from('quest_submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId)
      .single()

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: "Quest submission rejected." }), {
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