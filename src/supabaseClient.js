import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oygosimrplsiborgxffe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VbvQxF4MzOioroTl4dKqhg_W1BQi6Iy';

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