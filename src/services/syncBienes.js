// Sincronización delta de bienes (ahorro de egress de Supabase).
//
// Estrategia: la primera carga (o cada 24 h) descarga todo; después solo las
// filas con `updated_at` posterior a la última sincronización. Como cada fila
// pesa ~2 KB y son ~1800 por dependencia, un refetch silencioso pasa de ~4 MB
// a unos pocos KB cuando no hubo cambios.
//
// Requisito: TODA escritura a 'bens' debe sellar `updated_at` con `conSello`.
// Las filas viejas sin sello se capturan en la descarga total; a partir de
// ahí, cualquier edición posterior ya trae sello fresco y entra en el delta.

export const RESYNC_MS = 24 * 60 * 60 * 1000;

export const ahoraISO = () => new Date().toISOString();

// Sella cualquier payload { data } o { id, data } con marca de tiempo fresca.
export const conSello = (payload) => ({ ...payload, updated_at: ahoraISO() });

// ¿Toca descarga total? Sin meta, sin marca, o meta vieja (>24 h, válvula
// de seguridad contra derivas: borrados externos, cambios de dependencia).
export const debeResyncTotal = (meta, ahora = Date.now()) => {
  if (!meta || !meta.actualizadoEn || !meta.updated_at) return true;
  return (ahora - meta.actualizadoEn) > RESYNC_MS;
};

const parseData = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : (data || {});
  } catch {
    return {};
  }
};

// Fusiona filas remotas sobre la caché: por id; descarta las que salieron
// de la dependencia (cambio de dependencia en otro equipo). Devuelve la
// lista final y el max(updated_at) para avanzar la meta del delta.
export const fusionarBienes = (cache, filas, dependencia) => {
  const mapa = new Map((cache || []).map(b => [b.id, b]));
  let max = null;
  for (const row of filas || []) {
    const d = parseData(row.data);
    if ((d.dependencia || '') !== dependencia) {
      mapa.delete(row.id);
      continue;
    }
    mapa.set(row.id, { id: row.id, updated_at: row.updated_at, ...d });
    if (row.updated_at && (!max || row.updated_at > max)) max = row.updated_at;
  }
  return { lista: Array.from(mapa.values()), maxUpdatedAt: max };
};
