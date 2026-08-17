import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oygosimrplsiborgxffe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VbvQxF4MzOioroTl4dKqhg_W1BQi6Iy';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Error crítico: Las credenciales de Supabase no están definidas correctamente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY
    }
  }
});