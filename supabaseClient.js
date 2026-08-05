import { createClient } from '@supabase/supabase-js';

// Tu URL del proyecto de Supabase y tu llave pública (Publishable Key)
const SUPABASE_URL = 'https://oygosimrplsiborgxffe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VbvQxF4MzOioroTl4dKqhg_W1BQi6Iy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);