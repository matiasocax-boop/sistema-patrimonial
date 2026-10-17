// ============================================================================
// Pruebas del barajado para muestreo de auditoría
// ============================================================================
// El acta de muestreo es un documento formal: si la muestra no es uniforme,
// la auditoría no es defendible. Estos tests lo comprueban de forma estadística,
// no solo que "no falle".
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { barajar, tomarMuestra, testUniformidad } from '../src/utils/muestreo.js';

// Generador determinista (mulberry32) para poder reproducir corridas exactas.
const rngSemilla = (semilla) => {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

test('no modifica el array original', () => {
  const base = [1, 2, 3, 4, 5];
  const copia = base.slice();
  barajar(base, rngSemilla(1));
  assert.deepEqual(base, copia, 'el original debe quedar intacto');
});

test('conserva todos los elementos, sin duplicar ni perder', () => {
  const base = Array.from({ length: 50 }, (_, i) => i);
  const resultado = barajar(base, rngSemilla(7));
  assert.equal(resultado.length, 50);
  assert.deepEqual([...resultado].sort((a, b) => a - b), base);
});

test('el barajado es uniforme (chi-cuadrado)', () => {
  // 40k corridas sobre un universo de 6: el límite de chi-cuadrado para
  // p=0.001 y 5 grados de libertad es 20.5. Se usa margen para que el test
  // no sea flaky por azar estadístico.
  const { chi2, limite, uniforme } = testUniformidad(barajar, 6, 40000);
  assert.ok(uniforme, `chi2=${chi2.toFixed(2)} superó el límite ${limite}: el barajado no sería uniforme`);
});

test('el shuffle sesgado por sort() SÍ es sesgado (el problema que corregimos)', () => {
  // Esta es la razón de existir del módulo. Se comprueba que el método
  // histórico NO supera la prueba de uniformidad: si algún día se "optimiza"
  // volviendo a sort(Math.random() - 0.5), este test lo delata.
  const sesgado = (items) => items.slice().sort(() => Math.random() - 0.5);
  const { chi2, uniforme } = testUniformidad(sesgado, 6, 20000);
  assert.equal(uniforme, false, `el sort(Math.random()-0.5) resultó uniforme (chi2=${chi2.toFixed(2)}); la premisa del módulo ya no aplica`);
});

test('toma la cantidad pedida y la acota al universo', () => {
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(tomarMuestra(base, 3, rngSemilla(2)).length, 3);
  assert.equal(tomarMuestra(base, 999, rngSemilla(2)).length, 10, 'no puede pedir más de lo que hay');
  assert.equal(tomarMuestra(base, 0, rngSemilla(2)).length, 0);
  assert.equal(tomarMuestra(base, -5, rngSemilla(2)).length, 0);
});

test('la muestra cambia entre corridas (no es determinista por azar de una vez)', () => {
  const base = Array.from({ length: 50 }, (_, i) => i);
  const a = tomarMuestra(base, 5).join(',');
  const b = tomarMuestra(base, 5).join(',');
  assert.notEqual(a, b, 'dos sorteos seguidos deberían diferir');
});

test('tolera inputs inválidos sin romperse', () => {
  assert.deepEqual(barajar(null), []);
  assert.deepEqual(barajar(undefined), []);
  assert.deepEqual(tomarMuestra(null, 5), []);
  assert.deepEqual(tomarMuestra([], 5), []);
});

test('un rng degenerado (siempre 0) no rompe el rango', () => {
  // Math.floor(0 * (i+1)) = 0 siempre: el array se invierte, pero no hay
  // índice fuera de rango ni crash.
  const resultado = barajar([1, 2, 3, 4, 5], () => 0);
  assert.deepEqual([...resultado].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test('un rng degenerado (siempre 1) no rompe el rango', () => {
  const resultado = barajar([1, 2, 3, 4, 5], () => 1);
  assert.deepEqual([...resultado].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});