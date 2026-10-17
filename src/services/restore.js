// ============================================================================
// RESTAURACIÓN DE RESPALDOS
// ============================================================================
// El sistema genera un JSON con todo el sistema, pero no había forma de volver
// atrás con él: la única salida era entrar al panel de Supabase a mano. Un
// respaldo que no se puede restaurar es una moneda de canto.
//
// Este módulo valida y prepara la restauración. NO escribe en Supabase: eso lo
// hace el llamador, que es el único que tiene el cliente. Aquí queda toda la
// lógica comprobable: qué trae el archivo, si el formato sirve, qué tablas se
// pueden tocar, qué cambia y qué se perdería.
//
// --- FORMATO REAL DEL RESPALDO ---
// `handleExportBackupGeneral` descarga las filas crudas de cada tabla, así que
// llegan como { id, data: {...}, created_at, updated_at }, NO como objetos
// planos. `usuarios` es la excepción: sus columnas son sueltas y el respaldo las
// aplana. Este módulo entiende las dos formas, y también acepta la forma plana
// por si alguien armó el archivo a mano desde un export anterior.
//
// --- DECISIÓN DE DISEÑO: MERGE, NO REEMPLAZO ---
// Restaurar NO borra lo que hay: se hace merge por clave primaria y lo que
// viene en el archivo gana. El modo reemplazo existe, pero pide confirmación
// explícita con el detalle de lo que se va a perder.
// ============================================================================

/**
 * Tablas que la restauración puede tocar, en el orden en que deben restaurarse.
 * `envoltura` dice cómo viene la fila en el archivo:
 *   'data' → { id, data: {objeto} }
 *   'plana' → el objeto plano (usuarios)
 */
export const TABLAS_RESTORABLES = [
  { clave: 'usuarios', tabla: 'usuarios', etiqueta: 'Usuarios', pk: 'username', envoltura: 'plana' },
  { clave: 'funcionarios', tabla: 'funcionarios', etiqueta: 'Padrón de funcionarios', pk: 'id', envoltura: 'data' },
  { clave: 'estructuras', tabla: 'estructuras', etiqueta: 'Estructuras', pk: 'id', envoltura: 'data' },
  { clave: 'bienes', tabla: 'bens', etiqueta: 'Bienes', pk: 'id', envoltura: 'data' },
  { clave: 'fc10', tabla: 'fc10', etiqueta: 'Actas FC-10', pk: 'id', envoltura: 'data' },
  { clave: 'fc11', tabla: 'fc11', etiqueta: 'Traslados FC-11', pk: 'id', envoltura: 'data' },
  { clave: 'fc04', tabla: 'fc04', etiqueta: 'Expedientes FC-04', pk: 'id', envoltura: 'data' },
  { clave: 'notificaciones', tabla: 'notificaciones', etiqueta: 'Notificaciones', pk: 'id', envoltura: 'data' },
  { clave: 'auditoria', tabla: 'auditoria', etiqueta: 'Auditoría', pk: 'id', envoltura: 'data' }
];

export const ORDEN_RESTAURACION = TABLAS_RESTORABLES.map(t => t.clave);

/** Parsea el campo `data` si viene como texto. */
const parseData = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return null; }
  }
  return null;
};

/**
 * Convierte una fila del archivo en el objeto de negocio plano, con su clave
 * primaria garantizada. Devuelve null si no se puede rescatar.
 */
export const normalizarFila = (fila, defTabla) => {
  if (!fila || typeof fila !== 'object' || Array.isArray(fila)) return null;
  const pk = defTabla.pk;

  if (defTabla.envoltura === 'data') {
    // Si la fila trae la clave `data`, ES la envoltura: o se lee o es basura.
    // Sin esta comprobación, una fila corrupta ({id:'b3', data: null}) se
    // colaba como si fuera plana y se escribía {id:'b3', data:{data:null}}.
    const traeEnvoltura = Object.prototype.hasOwnProperty.call(fila, 'data');
    if (traeEnvoltura) {
      const dentro = parseData(fila.data);
      if (!dentro) return null; // data ausente, null o JSON inválido
      const obj = { ...dentro };
      // El id de la columna manda: es el que usa .eq('id', ...) al escribir.
      if (fila.id !== undefined && fila.id !== null) obj[pk] = fila.id;
      return obj;
    }
    // Forma plana (archivo armado a mano): se acepta tal cual.
    if (fila[pk] !== undefined) return { ...fila };
    return null;
  }

  // Forma plana (usuarios). Se descartan claves de autenticación heredadas por
  // si el archivo viene de un export crudo: la contraseña vive en Supabase
  // Auth y escribirla acá no reinstate el acceso.
  const { password, password_hash, encrypted_password, ...resto } = fila;
  return resto;
};

/**
 * Valida y normaliza un respaldo subido.
 *
 * @param {object} crudo  contenido parseado del JSON
 * @returns {{ok: boolean, error?: string, avisos: string[], tablas: object,
 *            metadata: object, totalFilas: number}}
 */
export const analizarRespaldo = (crudo) => {
  const avisos = [];
  const vacio = { ok: false, avisos, tablas: {}, metadata: {}, totalFilas: 0 };

  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
    return { ...vacio, error: 'El archivo no tiene el formato de un objeto de respaldo.' };
  }

  // Solo se acepta lo que generó este sistema. Un JSON cualquiera no debe
  // poder llegar a una escritura contra la base.
  const metadata = crudo.metadata && typeof crudo.metadata === 'object' ? crudo.metadata : null;
  if (!metadata || !metadata.sistema) {
    return { ...vacio, error: 'El archivo no parece un respaldo de este sistema (falta metadata.sistema).' };
  }
  if (metadata.sistema !== 'Sistema de Gestión Patrimonial UNP') {
    avisos.push(`El archivo dice provenir de "${metadata.sistema}", que no es exactamente este sistema.`);
  }

  const tablas = {};
  let totalFilas = 0;
  for (const t of TABLAS_RESTORABLES) {
    const brutas = Array.isArray(crudo[t.clave]) ? crudo[t.clave] : [];
    const limpias = [];
    let descartadas = 0, sinClave = 0;

    for (const fila of brutas) {
      const obj = normalizarFila(fila, t);
      if (!obj) { descartadas++; continue; }
      const valorPk = obj[t.pk];
      if (valorPk === undefined || valorPk === null || String(valorPk).trim() === '') { sinClave++; continue; }
      limpias.push({ ...obj, [t.pk]: String(valorPk) });
    }

    if (descartadas || sinClave) {
      avisos.push(`${t.etiqueta}: ${descartadas} fila(s) con formato ilegible y ${sinClave} sin "${t.pk}" fueron descartadas.`);
    }
    tablas[t.clave] = limpias;
    totalFilas += limpias.length;
  }

  if (totalFilas === 0) {
    return { ...vacio, tablas, metadata, error: 'El respaldo no contiene ninguna fila válida. Revisarlo antes de restaurar.' };
  }

  // Aviso específico del respaldo v2.1, que perdió la dependencia de los
  // usuarios: restaurarlo tal cual dejaría cuentas sin inventario asignado.
  const usuarios = tablas.usuarios || [];
  if (usuarios.length > 0 && usuarios.every(u => u.dependencia === undefined)) {
    avisos.push('CRÍTICO: el archivo no trae "dependencia" en los usuarios. Al restaurarlo, las cuentas quedarían sin inventario asignado. Corregí el archivo o asigná las dependencias a mano después.');
  }

  return { ok: true, avisos, tablas, metadata, totalFilas };
};

/** Compara dos objetos ignorando el orden de las claves. */
const iguales = (a, b) => {
  if (a === b) return true;
  const ka = Object.keys(a || {}).sort();
  const kb = Object.keys(b || {}).sort();
  if (ka.length !== kb.length) return false;
  return ka.every((k, i) => k === kb[i] && JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null));
};

/**
 * Calcula qué pasa con cada tabla: cuántas filas entran, cuántas actualizan y
 * cuántas son nuevas. Se muestra ANTES de restaurar, que es la única forma de
 * que el usuario decida con información y no a ciegas.
 *
 * @param {object} tablas  salida de analizarRespaldo
 * @param {object} existentes  { bienes: [...], fc10: [...] } estado actual
 */
export const previsualizarRestauracion = (tablas, existentes = {}) => {
  const detalle = {};
  for (const t of TABLAS_RESTORABLES) {
    const entrantes = tablas[t.clave] || [];
    const actuales = Array.isArray(existentes[t.clave]) ? existentes[t.clave] : [];
    const idxActual = new Map(actuales.map(f => [String(f[t.pk]), f]));

    let nuevas = 0, actualizadas = 0, sinCambio = 0;
    const cambios = [];
    for (const fila of entrantes) {
      const pk = String(fila[t.pk]);
      const actual = idxActual.get(pk);
      if (!actual) { nuevas++; continue; }
      if (iguales(actual, fila)) { sinCambio++; continue; }
      actualizadas++;
      const campos = Object.keys(fila)
        .filter(k => k !== t.pk && JSON.stringify(fila[k] ?? null) !== JSON.stringify(actual[k] ?? null));
      cambios.push({ pk, campos });
    }
    detalle[t.clave] = {
      etiqueta: t.etiqueta,
      entrantes: entrantes.length,
      nuevas,
      actualizadas,
      sinCambio,
      cambios: cambios.slice(0, 50), // top 50: alcanza para entender, no para saturar
      cambiosOcultos: Math.max(0, cambios.length - 50),
      hayCambios: actualizadas > 0 || nuevas > 0
    };
  }
  return detalle;
};

/**
 * Arma el lote de escrituras de una tabla.
 *
 * `updated_at` se SIEMPRE con la hora actual, nunca con la del archivo. Motivo:
 * la sincronización delta de los clientes (useRealtimeSync) solo baja filas con
 * `updated_at` mayor al último visto. Si se restaurara con el sello viejo del
 * respaldo, los equipos abiertos no se enterarían del cambio hasta la
 * próxima descarga total (24 h) y mostrarían inventario desactualizado.
 *
 * @param {string} clave  clave de TABLAS_RESTORABLES
 * @param {Array} filas   filas ya normalizadas
 * @param {number} ahora  timestamp ISO a usar como sello
 */
export const armarLote = (clave, filas, ahora = new Date().toISOString()) => {
  const def = TABLAS_RESTORABLES.find(t => t.clave === clave);
  if (!def) return { tabla: clave, filas: [], esPlana: false };

  if (def.envoltura === 'plana') {
    // Usuarios: columnas sueltas, y se fuerza el sello para que el delta los vea.
    return {
      tabla: def.tabla,
      esPlana: true,
      filas: filas.map(f => ({ ...f, username: f.username, updated_at: ahora }))
    };
  }
  return {
    tabla: def.tabla,
    esPlana: false,
    filas: filas.map(f => ({ id: f[def.pk], data: f, updated_at: ahora }))
  };
};

/**
 * Claves que existen hoy y NO vienen en el archivo: lo que se perdería si se
 * restaurara en modo reemplazo.
 */
export const calcularPerdidas = (entrantes, actuales, pk) => {
  const presentes = new Set((entrantes || []).map(f => String(f[pk])));
  return (actuales || [])
    .filter(f => !presentes.has(String(f[pk])))
    .map(f => String(f[pk]));
};

/**
 * Divide el trabajo en lotes de escritura.
 * PostgREST y el navegador aguantan bien ~500 filas por request; archivos de
 * 2000 bienes en una sola llamada fallan o expiran.
 */
export const dividirEnLotes = (filas, tamano = 500) => {
  const lotes = [];
  for (let i = 0; i < (filas || []).length; i += tamano) {
    lotes.push(filas.slice(i, i + tamano));
  }
  return lotes;
};