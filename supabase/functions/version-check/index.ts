import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appVersion = req.headers.get('x-app-version');
    
    console.log('Version check request received. App version:', appVersion);
    
    // Check if the app version is the required version
    if (appVersion !== '3') {
      console.log('Version mismatch. Required: 3, Received:', appVersion);
      return new Response(
        JSON.stringify({ 
          error: 'Version mismatch', 
          message: 'A mandatory update is required. Please install the new version.',
          requiredVersion: '3',
          currentVersion: appVersion 
        }), 
        { 
          status: 426, // 426 Upgrade Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Version check passed');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Version check passed',
        version: appVersion 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in version-check function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'A mandatory update is required. Please install the new version.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});