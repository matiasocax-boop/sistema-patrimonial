import { normalizeStr } from './helpers.js';

// Puntuación de cercanía para buscadores (combos de filtros, asignaciones).
// 0 = empieza con la búsqueda, 1 = alguna palabra empieza con ella,
// 2 = la contiene, 3 = sin coincidencia. Insensible a tildes/mayúsculas.
export function puntuarOpcion(textoNorm, q) {
  if (!q) return 3;
  if (textoNorm.startsWith(q)) return 0;
  if (textoNorm.split(' ').some(p => p.startsWith(q))) return 1;
  if (textoNorm.includes(q)) return 2;
  return 3;
}

// Ordena opciones por cercanía a la búsqueda (normaliza adentro).
// Devuelve hasta `tope` elementos { original }.
export function ordenarPorCercania(opciones, texto, tope = 100) {
  const q = normalizeStr(texto);
  const base = (opciones || []).map(o => ({ original: o, norm: normalizeStr(o) }));
  const filtrada = q ? base.filter(o => o.norm.includes(q)) : base;
  return filtrada
    .map(o => ({ ...o, score: puntuarOpcion(o.norm, q) }))
    .sort((a, b) => a.score - b.score || a.original.localeCompare(b.original, 'es'))
    .slice(0, tope);
}
