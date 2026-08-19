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
  },
  // <-- AGREGA ESTE BLOQUE PARA HABILITAR EL TIEMPO REAL
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

javascript
  useEffect(() => { 
      if (!isAuthenticated) return;
      fetchData(); 
      
      const subscription = supabase
          .channel('cambios-patrimonio')
          .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
              const { table, eventType, new: newRecord, old: oldRecord } = payload;
              const parseRecord = (record) => record ? { id: record.id, updated_at: record.updated_at, ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data) } : null;
              const newItem = parseRecord(newRecord);
              const oldItem = parseRecord(oldRecord);
              const targetId = oldItem?.id || oldRecord?.id;

              const updateState = async (setter, isBensTable = false) => {
                  if (eventType === 'INSERT') {
                      setter(prev => {
                          const exists = prev.some(item => item.id === newItem.id);
                          if (exists) return prev.map(item => item.id === newItem.id ? newItem : item);
                          return [newItem, ...prev];
                      });
                  } else if (eventType === 'UPDATE') {
                      setter(prev => prev.map(i => i.id === newItem.id ? newItem : i));
                  } else if (eventType === 'DELETE') {
                      setter(prev => prev.filter(i => i.id !== targetId));
                  }

                  if (isBensTable) {
                      const cacheActual = await localforage.getItem('bienes_cache') || [];
                      let nuevoInventario = [...cacheActual];
                      if (eventType === 'INSERT') {
                          const exists = nuevoInventario.some(b => b.id === newItem.id);
                          if (!exists) nuevoInventario.unshift(newItem);
                      } else if (eventType === 'UPDATE') {
                          const index = nuevoInventario.findIndex(b => b.id === newItem.id);
                          if (index !== -1) nuevoInventario[index] = newItem;
                          else nuevoInventario.push(newItem);
                      } else if (eventType === 'DELETE') {
                          nuevoInventario = nuevoInventario.filter(b => b.id !== targetId);
                      }
                      await localforage.setItem('bienes_cache', nuevoInventario);
                  }
              };

              if (table === 'bens') await updateState(setBienes, true);
              else if (table === 'fc10') updateState(setFc10List);
              else if (table === 'fc11') updateState(setFc11List);
              else if (table === 'fc04') updateState(setFc04List);
              else if (table === 'auditoria') updateState(setNotificaciones);
              else if (table === 'configuracion_sistema' && eventType === 'UPDATE') {
                  setIsMaintenanceMode(newItem.en_mantenimiento);
                  setSystemConfig({ version: newItem.version_actual, notes: newItem.notas_actualizacion });
              }
          }).subscribe();

      return () => supabase.removeChannel(subscription); 
  }, [isAuthenticated, fetchData]);
