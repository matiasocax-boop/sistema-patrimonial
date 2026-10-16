import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, '..', 'src', 'App.jsx');

// Hooks propios cuyo orden de llamada importa (sus args se evalúan al llamar).
const HOOKS = [
  'useAuthSession', 'useInventarioFiltros', 'useAuditoria', 'useFuncionarios',
  'useRealtimeSync', 'usePdfHandlers', 'useFcModals', 'useToasts'
];
const CLAVES_JS = new Set([
  'true', 'false', 'null', 'undefined', 'async', 'await', 'return', 'new',
  'typeof', 'in', 'of', 'if', 'else', 'for', 'while', 'function', 'this',
  'const', 'let', 'var', 'export', 'default', 'from', 'import'
]);

// Declaraciones por linea: const [a, b], const x =, const {..} multilínea,
// function x, imports.
function declaraciones(lineas) {
  const mapa = new Map(); // nombre -> linea (1-based)
  const anotar = (s, lin) => {
    for (const mm of s.matchAll(/([A-Za-z_$][\w$]*)/g)) {
      if (!mapa.has(mm[1])) mapa.set(mm[1], lin);
    }
  };
  let dentro = 0; // linea de apertura de destructuring multilínea (0 = no)
  let acumulados = [];
  lineas.forEach((l, i) => {
    const t = l.trim();
    if (dentro) {
      acumulados.push(t.split('=')[0]);
      if (/[}\]]\s*=/.test(t)) {
        // La inicialización completa ocurre en la línea de cierre
        for (const s of acumulados) anotar(s, i + 1);
        acumulados = [];
        dentro = 0;
      }
      return;
    }
    let m = t.match(/^import\s+(.+?)\s+from\s+['"]/);
    if (m) {
      const parte = m[1];
      const def = parte.match(/^\*\s+as\s+(\w+)/);
      if (def) { if (!mapa.has(def[1])) mapa.set(def[1], i + 1); }
      else {
        const braces = parte.match(/\{([^}]*)\}/);
        if (braces) anotar(braces[1], i + 1);
        const resto = parte.replace(/\{[^}]*\}/, '').trim().replace(/,$/, '');
        if (resto) anotar(resto, i + 1);
      }
      return;
    }
    m = t.match(/^const\s+[\{\[]\s*$/);
    if (m) { dentro = i + 1; return; }
    m = t.match(/^const\s+\{([^}]*)\}/);
    if (m) { anotar(m[1], i + 1); return; }
    m = t.match(/^const\s+\[([^\]]*)\]/);
    if (m) {
      for (const n of m[1].split(',')) {
        const nombre = n.trim().replace(/^\.\.\./, '');
        if (/^[A-Za-z_$][\w$]*$/.test(nombre) && !mapa.has(nombre)) mapa.set(nombre, i + 1);
      }
      return;
    }
    m = t.match(/^const\s+([A-Za-z_$][\w$]*)\s*=/);
    if (m) { if (!mapa.has(m[1])) mapa.set(m[1], i + 1); return; }
    m = t.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) { if (!mapa.has(m[1])) mapa.set(m[1], i + 1); }
  });
  return mapa;
}

// Llamadas useX(...) con balanceo de paréntesis: solo el rango real de args.
// Omite fragmentos con => (ejecución diferida, ej. wrappers anti-TDZ).
function llamadas(lineas) {
  const out = [];
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(/=\s*(use\w+)\(/);
    if (!m || !HOOKS.includes(m[1])) continue;
    const inicio = i + 1;
    // Balancear paréntesis desde esta línea para hallar el cierre
    let depth = 0, fin = -1, empezo = false;
    for (let j = i; j < lineas.length; j++) {
      // Desde el ( de la llamada: ignora el } previo del destructuring
      let t = lineas[j].split('//')[0];
      if (j === i) t = t.slice(t.indexOf('('));
      let enStr = null;
      for (const ch of t) {
        if (enStr) { if (ch === enStr) enStr = null; continue; }
        if (ch === '"' || ch === "'" || ch === '`') { enStr = ch; continue; }
        if (ch === '(' || ch === '{' || ch === '[') { depth++; empezo = true; }
        if (ch === ')' || ch === '}' || ch === ']') depth--;
      }
      if (empezo && depth === 0) { fin = j; break; }
      if (j - i > 60) break; // seguridad
    }
    if (fin === -1) continue;
    const ids = [];
    for (let j = i; j <= fin; j++) {
      const t = lineas[j].split('//')[0];
      if (/=>/.test(t)) continue; // diferido
      for (const mm of t.matchAll(/([A-Za-z_$][\w$]*)/g)) {
        const w = mm[1];
        if (CLAVES_JS.has(w)) continue;
        // ¿es clave de objeto (va seguida de :) y no es acceso obj.clave?
        const idx = mm.index;
        const antes = t.slice(0, idx);
        const despues = t.slice(idx + w.length);
        if (/^\s*:/.test(despues) && !/\.\s*$/.test(antes)) continue; // clave
        if (/\.\s*$/.test(antes)) continue; // propiedad .xxx
        ids.push(w);
      }
    }
    // Fuera: el nombre del hook y la palabra const/destructure
    out.push({ hook: m[1], linea: inicio, ids: [...new Set(ids)].filter(w => w !== m[1]) });
  }
  return out;
}

describe('orden de hooks (regresion TDZ)', () => {
  it('todo argumento de hook se declara antes de la llamada', () => {
    const src = fs.readFileSync(APP, 'utf8');
    const lineas = src.split('\n');
    const decls = declaraciones(lineas);
    const calls = llamadas(lineas);
    assert.ok(calls.length >= HOOKS.length, 'se detectan todas las llamadas: ' + calls.map(c => c.hook).join(','));
    const fallas = [];
    for (const c of calls) {
      for (const id of c.ids) {
        const d = decls.get(id);
        if (d === undefined) fallas.push(`${c.hook}@${c.linea}: '${id}' sin declarar`);
        else if (d > c.linea) fallas.push(`${c.hook}@${c.linea}: '${id}' declarado en ${d} (TDZ)`);
      }
    }
    assert.deepEqual(fallas, [], 'fallas de orden:\n' + fallas.join('\n'));
  });
});
