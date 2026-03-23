import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required.");
}

// 1. Declare the instance variable outside the export
let supabaseInstance: any = null;

// 2. Only execute createClient if an instance doesn't already exist
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  console.log("🛠️ Supabase Client Initialized (Locked to single instance)");
}

// 3. Export the locked instance
export const supabase = supabaseInstance;