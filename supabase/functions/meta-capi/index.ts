import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // 1. Get Secrets safely (Don't hardcode them!)
  const PIXEL_ID = Deno.env.get('META_PIXEL_ID');
  const ACCESS_TOKEN = Deno.env.get('META_API_ACCESS_TOKEN');

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Missing Configuration" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // 2. Parse Data from Frontend
  const { event_id, amount, user_email, user_phone, client_ip, client_user_agent } = await req.json();

  // 3. Hash Helper (SHA-256)
  const hash = async (str: string) => {
    if (!str) return null;
    const msgBuffer = new TextEncoder().encode(str.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const hashedEmail = await hash(user_email);
  const hashedPhone = await hash(user_phone);

  // 4. Construct Payload
  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id, // The key to deduplication
        action_source: 'website',
        event_source_url: 'https://saucerburger.ge',
        user_data: {
          em: hashedEmail ? [hashedEmail] : [],
          ph: hashedPhone ? [hashedPhone] : [],
          client_ip_address: client_ip,
          client_user_agent: client_user_agent,
        },
        custom_data: {
          currency: 'GEL',
          value: amount,
        },
      },
    ],
  };

  // 5. Send to Meta
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();
  return new Response(JSON.stringify(result), { 
    headers: { "Content-Type": "application/json" } 
  });
});