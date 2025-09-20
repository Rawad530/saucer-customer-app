// supabase/functions/check-restaurant-status/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { DateTime } from "https://esm.sh/luxon@3.3.0";

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Check 1: The Manual Override Switch ---
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('store_status')
      .select('is_ordering_enabled')
      .eq('id', 1)
      .single();

    if (statusError) {
      throw new Error(`Database error: Could not fetch store status. ${statusError.message}`);
    }

    const isOrderingManuallyEnabled = statusData.is_ordering_enabled;

    // --- Check 2: The Scheduled Hours ---
    const now = DateTime.now().setZone('Asia/Tbilisi');
    const currentDay = now.weekday === 7 ? 0 : now.weekday;
    const currentTime = now.toFormat('HH:mm:ss');

    const { data: hoursData, error: hoursError } = await supabaseAdmin
      .from('operational_hours')
      .select('open_time, close_time')
      .eq('id', currentDay)
      .single();

    if (hoursError) {
      throw new Error(`Database error: Could not fetch hours for today. ${hoursError.message}`);
    }

    const { open_time, close_time } = hoursData;
    
    let isWithinHours = false;
    if (open_time < close_time) {
      isWithinHours = currentTime >= open_time && currentTime < close_time;
    } else {
      isWithinHours = currentTime >= open_time || currentTime < close_time;
    }

    // --- Final Decision ---
    // The store is only open if BOTH checks are true
    const isOpen = isOrderingManuallyEnabled && isWithinHours;

    return new Response(JSON.stringify({ isOpen }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

After you have saved the changes to this file, you **must re-deploy it** for the new logic to take effect. Please run this command in your terminal:

```bash
npx supabase functions deploy check-restaurant-status --no-verify-jwt

