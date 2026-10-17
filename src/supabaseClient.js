import { createClient } from '@supabase/supabase-js';

// VITE_* se embeben en el bundle público: son claves públicas (anon), no
// secretos. La seguridad real depende de las políticas RLS de la base.
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

// Diagnóstico de red: los errores de Supabase llegan como { error } en el
// resultado y muchos se silencian con catch vacío, así que en DevTools solo
// aparecía un "Failed to load resource: 400" sin decir qué consulta era.
// Este envoltorio registra en consola la URL y el cuerpo de cualquier respuesta
// >= 400 de la API, para poder diagnosticarla pegando esa línea en el reporte.
const registrarFallo = async (res) => {
  if (!res || res.status < 400) return;
  try {
    const clon = res.clone();
    const cuerpo = await clon.text().catch(() => '');
    console.warn(
      `[supabase:${res.status}] ${res.method || 'GET'} ${res.url}`,
      cuerpo ? cuerpo.slice(0, 500) : '(sin cuerpo)'
    );
  } catch {
    /* diagnóstico: nunca debe romper la app */
  }
};

const fetchOriginal = globalThis.fetch;
if (typeof fetchOriginal === 'function') {
  globalThis.fetch = async (...args) => {
    const res = await fetchOriginal(...args);
    const url = typeof res?.url === 'string' ? res.url : String(args[0]?.url || args[0] || '');
    if (url.includes(SUPABASE_URL)) registrarFallo(res);
    return res;
  };
}