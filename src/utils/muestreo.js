// ============================================================================
// BARAJADO PARA MUESTREO DE AUDITORÍA
// ============================================================================
// El muestreo aleatorio de bienes genera el "Acta de Muestreo", un documento
// formal. Si la muestra no sale de forma uniforme, la auditoría no es
// defendible: un sesgo toward el orden original concentra la muestra en los
// primeros bienes del listado.
//
// Por que NO se usa `array.sort(() => Math.random() - 0.5)`, que es el truco
// habitual: el comparador de Array.prototype.sort no es un orden coherente
// (debe antisimétrico y transitivo). Devolver valores aleatorios viola las
// dos condiciones y el resultado queda sesgado hacia el orden previo. Es un
// error conocido de la especificación de ECMAScript.
//
// Fisher-Yates (1949) sí es uniforme: cada elemento tiene exactamente la misma
// probabilidad de quedar en cualquier posición. Se usa el algoritmo de Durstenfeld
// (intercambios hacia atrás), que es el más breve y no necesita tabla auxiliar.
// ============================================================================

/**
 * Baraja una copia del array de forma uniforme (Fisher-Yates / Durstenfeld).
 * No modifica el original.
 *
 * @param {Array} items  Lista a barajar
 * @param {() => number} rng  Generador de aleatorios en [0, 1). Por defecto
 *        Math.random. Se puede inyectar uno para las pruebas.
 * @returns {Array} copia barajada
 */
export const barajar = (items, rng = Math.random) => {
  const arr = Array.isArray(items) ? items.slice() : [];
  for (let i = arr.length - 1; i > 0; i--) {
    // j ∈ [0, i]. Se redondea hacia abajo para no pasarse del índice.
    const j = Math.floor(rng() * (i + 1));
    // Un generator determinista (para tests) podría devolver 1 exacto por
    // redondeo de coma flotante: se acota para no salir del rango.
    const k = j < 0 ? 0 : (j > i ? i : j);
    const tmp = arr[i];
    arr[i] = arr[k];
    arr[k] = tmp;
  }
  return arr;
};

/**
 * Toma una muestra aleatoria de `n` elementos de una lista.
 *
 * @param {Array} items  universo de la muestra
 * @param {number} n     cantidad deseada (se acota al tamaño del universo)
 * @param {() => number} rng  generador de aleatorios
 * @returns {Array} los n elementos barajados
 */
export const tomarMuestra = (items, n, rng = Math.random) => {
  const cuantos = Math.max(0, Math.min(parseInt(n, 10) || 0, (items || []).length));
  return barajar(items, rng).slice(0, cuantos);
};

/**
 * Verifica que un generador de barajado sea uniforme.
 *
 * Corre el Fisher-Yates del módulo sobre un universo conocido y calcula con
 * chi-cuadrado chi2 contra la distribución uniforme. Sirve como prueba de que
 * el sesgo del `sort(Math.random() - 0.5)` desapareció. Se usa en los tests.
 *
 * @param {(items: Array, rng?: () => number) => Array} fn
 * @param {number} n  tamaño del universo en cada corrida
 * @param {number} corridas  cuántas permutaciones se generan
 * @returns {{chi2: number, limite: number, uniforme: boolean}}
 */
export const testUniformidad = (fn, n = 6, corridas = 60000) => {
  const universo = Array.from({ length: n }, (_, i) => i);

  // Se mide en qué posición FINAL cae un elemento concreto (el 0). Si el
  // barajado es uniforme, el elemento 0 debe caer en cada una de las n
  // posiciones la misma cantidad de veces.
  const porPosicion = new Array(n).fill(0);

  for (let c = 0; c < corridas; c++) {
    const perm = fn(universo);
    const indiceCero = perm.indexOf(0);
    if (indiceCero >= 0) porPosicion[indiceCero] += 1;
  }

  const esperado = corridas / n;
  let chi2 = 0;
  for (const cuenta of porPosicion) chi2 += ((cuenta - esperado) ** 2) / esperado;

  // Valor crítico de chi-cuadrado para p=0.001 y n-1 grados de libertad.
  // Debajo del 99.9% de confianza, aceptamos que es uniforme.
  const limites = { 5: 20.5, 6: 27.9, 7: 36.1, 8: 44.3, 9: 53.0, 10: 62.0 };
  const limite = limites[n - 1] ?? (n - 1) * 12;

  return { chi2, limite, uniforme: chi2 < limite };
};