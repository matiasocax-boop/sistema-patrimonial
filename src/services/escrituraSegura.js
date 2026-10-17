// ============================================================================
// ESCRITURA CON PROTECCIÓN CONTRA EDICIONES SIMULTÁNEAS
// ============================================================================
// El sistema guarda cada bien como un JSONB completo en la columna `data`. Una
// escritura es `update({ data: <el objeto entero> })`. Como el realtime está
// activo, dos equipos pueden estar editando el mismo bien a la vez: el segundo
// en escribir manda su objeto entero, que incluye los valores OLD de los campos
// que el primero acababa de cambiar. El cambio del primero desaparece sin que
// nadie lo note.
//
// Eso no se arregla desde el cliente por sí solo (haría falta una transacción o
// una columna de versión), pero sí se puede evitar la parte peor:
//
//   1. Releer la fila actual justo antes de escribir.
//   2. Aplicar SOLO el campo que cambió sobre esa versión fresca, en vez de
//      enviar el objeto entero.
//   3. Si entre la lectura y la escritura alguien más tocó el mismo campo,
//      avisar en vez de pisarlo en silencio.
//
// El paso 2 es el que evita la mayoría de las pérdidas: el resto de los campos
// conserva lo que tenga la base, no lo que tenía tu memoria.
// ============================================================================

/**
 * Calcula qué cambió entre dos versiones del mismo bien.
 *
 * @param {object} anterior  versión que tenía el cliente en memoria
 * @param {object} posterior  versión que el usuario acaba de editar
 * @param {string[]} camposIgnorados  campos que no cuentan (updated_at, etc.)
 * @returns {object} solo los campos con valor distinto, { clave: nuevoValor }
 */
export const detectarCambios = (anterior, posterior, camposIgnorados = ['updated_at', 'id']) => {
  const a = anterior || {};
  const b = posterior || {};
  const cambiados = {};
  Object.keys(b).forEach((clave) => {
    if (camposIgnorados.includes(clave)) return;
    const va = a[clave];
    const vb = b[clave];
    // Se comparan como texto porque del JSONB pueden volver tipos distintos
    // (número 1 vs string "1") sin que sea un cambio real.
    if (JSON.stringify(va ?? null) !== JSON.stringify(vb ?? null)) {
      cambiados[clave] = vb;
    }
  });
  return cambiados;
};

/**
 * Aplica solo los campos cambiados sobre la versión fresca de la fila.
 *
 * @param {object} fresco  lo que se acaba de releer de la base
 * @param {object} cambios  mapa campo → valor (de detectarCambios)
 * @param {object} nuevo  el objeto completo que el usuarioEdited
 * @returns {object} el objeto a escribir
 */
export const fusionarSobreFresco = (fresco, cambios, nuevo) => ({
  ...(nuevo || {}),
  ...(fresco || {}),
  ...cambios
});

/**
 * ¿Alguno de los campos que editamos cambió también en la base desde nuestra
 * lectura? Si sí, hay conflicto real y hay que avisar.
 *
 * @param {object} antesDeEscribir  versión que el cliente tenía en memoria
 * @param {object} fresco           versión recién leída de la base
 * @param {object} cambios          campos que el usuario está guardando
 * @returns {string[]} claves en conflicto
 */
export const detectarConflictos = (antesDeEscribir, fresco, cambios) => {
  const conflictos = [];
  if (!fresco) return conflictos;
  Object.keys(cambios || {}).forEach((clave) => {
    // Lo que se compara es el valor que TENÍAMOS (antesDeEscribir) contra el
    // que hay ahora en la base. Si difieren, otro lo tocó mientras editábamos.
    // Comparar contra el valor nuevo sería un error: siempre darían distintos
    // y se reportaría conflicto en cada guardado.
    const loQueTeniamos = (antesDeEscribir || {})[clave];
    const loQueHayAhora = (fresco || {})[clave];
    if (JSON.stringify(loQueTeniamos ?? null) !== JSON.stringify(loQueHayAhora ?? null)) {
      conflictos.push(clave);
    }
  });
  return conflictos;
};

/** Nombres de campo legibles para mostrar el aviso de conflicto. */
export const ETIQUETA_CAMPO = {
  estadoConservacion: 'estado de conservación',
  ubicacion: 'ubicación',
  funcionario: 'responsable',
  funcionarioDoc: 'cédula',
  funcionarioCargo: 'cargo',
  descripcion: 'descripción',
  valorUnitario: 'valor',
  fechaAdquisicion: 'fecha de adquisición',
  rotulo: 'rótulo',
  cuenta: 'cuenta',
  subcuenta: 'subcuenta',
  analitico1: 'analítico 1',
  analitico2: 'analítico 2',
  vidaUtil: 'vida útil',
  cantidad: 'cantidad',
  hasQR: 'estado de QR',
  hasFC10: 'estado de FC-10',
  fotos: 'fotos'
};

/** "ubicación y estado de conservación" */
export const describirCampos = (claves) => (claves || [])
  .map(c => ETIQUETA_CAMPO[c] || c)
  .join(', ');