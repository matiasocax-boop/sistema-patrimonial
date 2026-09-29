import localforage from 'localforage';
import { supabase } from '../supabaseClient';

const QUEUE_KEY = 'pending_offline_actions';

// Encolar acción localmente
export const enqueueOfflineAction = async (action) => {
  try {
    const currentQueue = (await localforage.getItem(QUEUE_KEY)) || [];
    currentQueue.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    await localforage.setItem(QUEUE_KEY, currentQueue);
    console.log('📦 Acción guardada en cola offline:', action);
  } catch (error) {
    console.error('❌ Error al guardar en cola offline:', error);
  }
};

// Sincronizar cola al recuperar señal
export const processOfflineQueue = async (onSuccessCallback) => {
  if (!navigator.onLine) return;

  try {
    const currentQueue = (await localforage.getItem(QUEUE_KEY)) || [];
    if (currentQueue.length === 0) return;

    console.log(`🚀 Procesando ${currentQueue.length} acciones pendientes...`);
    const remainingQueue = [];
    let syncedCount = 0;

    for (const item of currentQueue) {
      try {
        let res = { error: null };

        if (item.type === 'SAVE_BIEN') {
          // Aseguramos el payload en formato JSONB que usa Supabase
          const payload = { id: item.payload.id, data: item.payload };
          res = await supabase.from('bens').upsert([payload]);
        } else if (item.type === 'DELETE_BIEN') {
          res = await supabase.from('bens').delete().eq('id', item.payload.id);
        } else if (item.type === 'SAVE_FC10') {
          const payload = { id: item.payload.id, data: item.payload };
          res = await supabase.from('fc10').upsert([payload]);
        }

        if (res?.error) {
          console.error('❌ Error al sincronizar ítem en Supabase:', res.error);
          remainingQueue.push(item);
        } else {
          syncedCount++;
        }
      } catch (err) {
        console.error('❌ Error de red durante la sincronización:', err);
        remainingQueue.push(item);
      }
    }

    // Actualizamos la cola con los que no pudieron enviarse
    await localforage.setItem(QUEUE_KEY, remainingQueue);

    if (syncedCount > 0 && onSuccessCallback) {
      onSuccessCallback(syncedCount);
    }
  } catch (error) {
    console.error('❌ Error general procesando la cola offline:', error);
  }
};