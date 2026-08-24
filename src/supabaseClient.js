import { createClient } from '@supabase/supabase-js';

// Aquí están tus nuevas credenciales del proyecto "Espejo"
const SUPABASE_URL = 'https://xgactumwhukhjwggcmqs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7foy8CTWF4qZACa6jxVDiA_wFLLcKmw';

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