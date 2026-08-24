import { createClient } from '@supabase/supabase-js';

// Vercel inyectará automáticamente estos valores de forma segura
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});