// ============================================================================
// COLA DE ACCIONES OFFLINE - LÓGICA PURA
// ============================================================================
// Sin IndexedDB ni Supabase: solo transforma la cola. Así se puede probar el
// caso que antes perdía datos sin necesidad de simular red y almacenamiento.
//
// El problema que resuelve este módulo:
// `processOfflineQueue` leía la cola, la procesaba con varias esperas de red y
// al final escribía la cola "restante" que había calculado. Si el usuario
// seguía editando durante esos segundos, la acción nueva se guardaba en la
// cola... y la escritura de fin la pisaba. La edición se perdía sin aviso.
//
// La solución es escribir por diferencia, no por reemplazo: se registra QUÉ
// se procesó con éxito y al final solo se quitan esos elementos concretos de
// la cola vigente. Lo que haya entrado durante el trabajo se conserva.
// ============================================================================

export const TIPOS_CONOCIDOS = ['SAVE_BIEN', 'DELETE_BIEN', 'SAVE_FC10'];

/** Identificador único de una acción encolada. */
const nuevaClave = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `off-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Agrega una acción a la cola. Puro: devuelve una cola nueva.
 * @param {Array} cola  cola actual (no se modifica)
 * @param {object} accion  { type, payload, ... }
 * @param {string} [ahora]  ISO de la marca de tiempo
 */
export const encolarAccion = (cola, accion, ahora) => {
  const base = Array.isArray(cola) ? cola : [];
  return [
    ...base,
    { ...accion, clave: accion.clave || nuevaClave(), timestamp: ahora || new Date().toISOString() }
  ];
};

/**
 * Procesa la cola contra un emisor y devuelve qué queda.
 *
 * @param {Array} cola        cola a procesar
 * @param {(accion: object) => Promise<{error?: any}>} enviar
 *        emisor; devuelve { error } si la escritura falló (igual que Supabase).
 * @returns {Promise<{exitosas: string[], fallidas: object[], desconocidas: object[],
 *                    procesadas: number}>}
 *          `exitosas` son las CLAVES que se pueden quitar de la cola.
 */
export const procesarCola = async (cola, enviar) => {
  const exitosas = [];
  const fallidas = [];
  const desconocidas = [];

  for (const item of (cola || [])) {
    // Tipo desconocido: antes caía en `res = { error: null }`, el ítem se
    // contaba como sincronizado y se borraba de la cola. Pérdida silenciosa.
    if (!TIPOS_CONOCIDOS.includes(item.type)) {
      desconocidas.push(item);
      continue;
    }
    try {
      const res = await enviar(item);
      if (res && res.error) fallidas.push(item);
      else exitosas.push(item.clave);
    } catch {
      // Error de red real: se conserva para el próximo intento.
      fallidas.push(item);
    }
  }

  return {
    exitosas,
    fallidas,
    desconocidas,
    procesadas: exitosas.length + fallidas.length + desconocidas.length
  };
};

/**
 * Quita de la cola vigente SOLO las claves indicadas.
 *
 * Es la parte que evita la pérdida: se lee la cola de nuevo (que puede tener
 * acciones agregadas durante el procesamiento) y se filtran únicamente las
 * exitosas. Todo lo demás sobrevive.
 *
 * @param {Array} colaVigente  cola tal como está ahora en el almacenamiento
 * @param {string[]} clavesExitosas  claves ya sincronizadas
 * @returns {Array} cola final
 */
export const quitarExitosas = (colaVigente, clavesExitosas) => {
  if (!clavesExitosas || clavesExitosas.length === 0) return (colaVigente || []).slice();
  const aQuitar = new Set(clavesExitosas);
  return (colaVigente || []).filter(a => !aQuitar.has(a.clave));
};

/**
 * Cuenta cuántas acciones siguen pendientes.
 */
export const contarPendientes = (cola) => (Array.isArray(cola) ? cola.length : 0);