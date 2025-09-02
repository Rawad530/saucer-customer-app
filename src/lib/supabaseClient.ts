import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://kgambgofdizxgcdjhxlk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW1iZ29mZGl6eGdjZGpoeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTI1MDgsImV4cCI6MjA2NzA2ODUwOH0.w31-DoHc7VFgoR1l8dGaQs4vy1TPPDEb0sQmp8yvC0o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)