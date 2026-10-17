import localforage from 'localforage';
import { supabase } from '../supabaseClient';
import { conSello } from './syncBienes';
import {
  encolarAccion, procesarCola, quitarExitosas, contarPendientes
} from './offlineQueue';

const QUEUE_KEY = 'pending_offline_actions';

// Mutex: impide que dos sincronizados corran a la vez. El evento 'online' y el
// intervalo de reintento pueden dispararse casi juntos y, sin esto, el segundo
// leería la cola con la del primero todavía en curso.
let sincronizando = false;

// Encolar acción localmente.
export const enqueueOfflineAction = async (action) => {
  try {
    const actual = (await localforage.getItem(QUEUE_KEY)) || [];
    // Se vuelve a leer y a escribir la cola completa: si hay un sincronizado en
    // curso, su escritura final solo quita lo que él procesó, así que la acción
    // nueva sobrevive.
    await localforage.setItem(QUEUE_KEY, encolarAccion(actual, action));
  } catch (error) {
    console.error('❌ Error al guardar en cola offline:', error);
  }
};

// Cantidad de acciones guardadas localmente sin sincronizar.
export const getOfflineQueueLength = async () => {
  try {
    return contarPendientes((await localforage.getItem(QUEUE_KEY)) || []);
  } catch {
    return 0;
  }
};

/**
 * Sincroniza la cola al recuperar señal.
 *
 * Escribe POR DIFERENCIA: procesa, y al final relee la cola vigente para quitar
 * únicamente las claves que se sincronizaron. Antes se escribía la cola
 * "restante" calculada al principio, y cualquier acción que el usuario hubiera
 * encolado durante la espera se perdía en silencio.
 */
export const processOfflineQueue = async (onSuccessCallback) => {
  if (!navigator.onLine) return;
  if (sincronizando) return; // ya hay una pasada en curso

  sincronizando = true;
  try {
    const cola = (await localforage.getItem(QUEUE_KEY)) || [];
    if (cola.length === 0) return;

    const enviar = async (item) => {
      if (item.type === 'SAVE_BIEN') {
        // conSello es obligatorio: sin updated_at el cambio no entra en el
        // delta de los demás equipos hasta la resincronización total (24 h).
        return supabase.from('bens').upsert([conSello({ id: item.payload.id, data: item.payload })]);
      }
      if (item.type === 'DELETE_BIEN') {
        return supabase.from('bens').delete().eq('id', item.payload.id);
      }
      if (item.type === 'SAVE_FC10') {
        // fc10 no usa delta: se recarga entera, por eso no lleva conSello.
        return supabase.from('fc10').upsert([{ id: item.payload.id, data: item.payload }]);
      }
      return { error: new Error(`tipo no soportado: ${item.type}`) };
    };

    const { exitosas, fallidas } = await procesarCola(cola, enviar);

    if (exitosas.length > 0) {
      // Releer antes de escribir: entre la lectura inicial y ahora pueden
      // haber entrado acciones nuevas, y esas no se deben tocar.
      const vigente = (await localforage.getItem(QUEUE_KEY)) || [];
      await localforage.setItem(QUEUE_KEY, quitarExitosas(vigente, exitosas));
    }

    if (fallidas.length > 0) {
      console.warn(`⚠️ ${fallidas.length} acción(es) offline siguen pendientes.`);
    }
    if (exitosas.length > 0 && onSuccessCallback) onSuccessCallback(exitosas.length);
  } catch (error) {
    console.error('❌ Error general procesando la cola offline:', error);
  } finally {
    sincronizando = false;
  }
};