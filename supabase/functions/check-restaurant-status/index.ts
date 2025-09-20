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

    // Get the current date and time in Tbilisi
    const now = DateTime.now().setZone('Asia/Tbilisi');
    const currentDay = now.weekday === 7 ? 0 : now.weekday; // Luxon uses 1-7 for Mon-Sun, DB uses 0-6 for Sun-Sat
    const currentTime = now.toFormat('HH:mm:ss'); // Format as HH:mm:ss

    // Fetch today's operational hours from the database
    const { data, error } = await supabaseAdmin
      .from('operational_hours')
      .select('open_time, close_time')
      .eq('id', currentDay)
      .single();

    if (error) {
      throw new Error(`Database error: Could not fetch hours for today. ${error.message}`);
    }

    const { open_time, close_time } = data;
    
    // Check if the current time is within the open hours
    // This logic correctly handles overnight hours (e.g., closing at 2:00 AM)
    let isOpen = false;
    if (open_time < close_time) {
        // Standard day (e.g., 09:00 to 17:00)
        isOpen = currentTime >= open_time && currentTime < close_time;
    } else {
        // Overnight hours (e.g., 12:00 PM to 02:00 AM)
        isOpen = currentTime >= open_time || currentTime < close_time;
    }

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

Finally, save the file and deploy your new function by running this command in your terminal:

```bash
npx supabase functions deploy check-restaurant-status --no-verify-jwt
