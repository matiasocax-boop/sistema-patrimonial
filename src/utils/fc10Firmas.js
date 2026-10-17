// ============================================================================
// CICLO DE FIRMAS DEL FC-10
// ============================================================================
// Un FC-10 no cierra con una sola firma. El circuito real de la UNP es:
//
//   1) El funcionario responsable firma (en Acrobat, con su certificado MITIC)
//   2) Su jefe inmediato firma
//   3) Con ambas firmas el acta queda cerrada y el bien pasa a hasFC10 = true
//
// La app NO firma ni valida certificados: eso ocurre fuera, en Acrobat. Aquí
// solo se registra en qué etapa va el trámite y quién lo completó, de modo que
// nadie pueda dar por cerrado un acta que todavía no firmó el jefe.
//
// Orden de firmas: siempre Funcionario -> Jefe Inmediato (definido por la UNP).
// Quién puede registrar cada firma: la misma persona que lleva el trámite
// (no el firmante real), porque la firma ocurre en Acrobat y lo que se guarda
// es constancia de que ese trámite ya se completó.
//
// ============================================================================

// Estados posibles del FC-10. El orden de la lista es también el del ciclo:
// cada estado se alcanza solo desde el anterior (ver ESTADO_SIGUIENTE).
export const ESTADOS_FC10 = {
  BORRADOR: 'BORRADOR',
  ESPERA_FIRMA_1: 'ESPERA_FIRMA_1',
  ESPERA_FIRMA_2: 'ESPERA_FIRMA_2',
  CERRADO: 'CERRADO'
};

// Presentación de cada estado para la UI: etiqueta, color e ícono.
export const ESTADO_INFO = {
  BORRADOR: {
    label: 'Borrador',
    corto: 'Borrador',
    icon: 'fa-pen-ruler',
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300 border-zinc-200 dark:border-white/10',
    dot: 'bg-zinc-400',
    descripcion: 'El acta se esta armando todavia.'
  },
  ESPERA_FIRMA_1: {
    label: 'Esperando firma del funcionario',
    corto: 'Falta funcionario',
    icon: 'fa-file-signature',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    dot: 'bg-amber-500',
    descripcion: 'Firma el funcionario responsable.'
  },
  ESPERA_FIRMA_2: {
    label: 'Esperando firma del jefe inmediato',
    corto: 'Falta jefe',
    icon: 'fa-user-tie',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
    dot: 'bg-sky-500',
    descripcion: 'Ya firmó el funcionario. Falta el jefe inmediato.'
  },
  CERRADO: {
    label: 'Cerrado (firmas completas)',
    corto: 'Cerrado',
    icon: 'fa-circle-check',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-500',
    descripcion: 'Ambas firmas registradas. El bien ya cuenta con FC-10.'
  }
};

// A qué estado se pasa al registrar la firma pendiente.
export const ESTADO_SIGUIENTE = {
  [ESTADOS_FC10.BORRADOR]: ESTADOS_FC10.ESPERA_FIRMA_1,
  [ESTADOS_FC10.ESPERA_FIRMA_1]: ESTADOS_FC10.ESPERA_FIRMA_2,
  [ESTADOS_FC10.ESPERA_FIRMA_2]: ESTADOS_FC10.CERRADO
};

// Los dos puestos de firma, en el orden en que se firman.
export const PUESTOS_FIRMA = [
  { clave: 'firma1', orden: 1, campo: 'funcionarioNombre', puesto: 'Funcionario Responsable' },
  { clave: 'firma2', orden: 2, campo: 'jefeInmediatoNombre', puesto: 'Jefe Inmediato' }
];

/**
 * Estado inicial de un FC-10.
 *
 * Los registros anteriores a este flujo NO tienen `estadoFirma`. Esos se
 * consideran CERRADOS para no alterar el comportamiento previo ni los reportes
 * ya emitidos: fue lo que el sistema hizo siempre.
 *
 * Un FC-10 NUEVO sí arranca en ESPERA_FIRMA_1, y eso se decide al crearlo
 * (saveFC10 escribe estadoFirma explícito). Por eso esta función solo
 * interpreta lo que viene guardado y nunca inventa un estado de trámite:
 * si falta `estadoFirma`, es un registro heredado.
 */
export const estadoInicialFC10 = (registro) => {
  if (registro?.estadoFirma) return registro.estadoFirma;
  return ESTADOS_FC10.CERRADO;
};

/** Estado con el que debe crearse un FC-10 nuevo. */
export const ESTADO_NUEVO_FC10 = ESTADOS_FC10.ESPERA_FIRMA_1;

/** ¿El acta está esperando todavía alguna firma? */
export const estaPendiente = (fc) => {
  const e = estadoInicialFC10(fc);
  return e !== ESTADOS_FC10.CERRADO;
};

/**
 * Puesto que debe firmar en el estado actual, o null si ya cerró.
 * Devuelve también los datos de la persona que tiene que firmar.
 */
export const pendienteDeFirma = (fc) => {
  const estado = estadoInicialFC10(fc);
  if (estado === ESTADOS_FC10.CERRADO) return null;
  if (estado === ESTADOS_FC10.ESPERA_FIRMA_1) {
    return {
      puesto: PUESTOS_FIRMA[0].puesto,
      orden: 1,
      nombre: fc?.funcionarioNombre || '',
      doc: fc?.funcionarioDoc || '',
      cargo: fc?.funcionarioCargo || ''
    };
  }
  if (estado === ESTADOS_FC10.ESPERA_FIRMA_2) {
    return {
      puesto: PUESTOS_FIRMA[1].puesto,
      orden: 2,
      nombre: fc?.jefeInmediatoNombre || '',
      doc: fc?.jefeInmediatoDoc || '',
      cargo: fc?.jefeInmediatoCargo || ''
    };
  }
  // BORRADOR: todavía no se envió a firmar.
  return null;
};

/**
 * Registra la firma pendiente y devuelve el FC-10 actualizado.
 * No toca la base: es una función pura para que se pueda probar sin Supabase.
 *
 * `registro` : el FC-10 actual
 * `usuario`  : quién está haciendo el trámite ({ username, nombre })
 * `fecha`    : ISO string; se usa `new Date()` si no se pasa (tests)
 */
export const registrarFirma = (registro, usuario, fecha) => {
  const estado = estadoInicialFC10(registro);
  const siguiente = ESTADO_SIGUIENTE[estado];
  if (!siguiente) return registro; // ya cerrado: no hay nada que firmar

  const ahora = fecha || new Date().toISOString();
  const actualizado = {
    ...registro,
    estadoFirma: siguiente,
    firmas: { ...(registro.firmas || {}) }
  };

  if (siguiente === ESTADOS_FC10.ESPERA_FIRMA_2) {
    actualizado.firmas.firma1 = {
      nombre: registro.funcionarioNombre || '',
      cargo: registro.funcionarioCargo || '',
      registradoPor: usuario?.username || '',
      registradoPorNombre: usuario?.nombre || '',
      fecha: ahora
    };
  } else if (siguiente === ESTADOS_FC10.CERRADO) {
    actualizado.firmas.firma2 = {
      nombre: registro.jefeInmediatoNombre || '',
      cargo: registro.jefeInmediatoCargo || '',
      registradoPor: usuario?.username || '',
      registradoPorNombre: usuario?.nombre || '',
      fecha: ahora
    };
    // Cierre: queda constancia de cuándo se completó el ciclo.
    actualizado.fechaCierre = ahora;
  }

  return actualizado;
};

/**
 * ¿Este FC-10 habilita marcar el bien como "con FC-10"?
 * Es la única fuente de verdad para `hasFC10`.
 */
export const habilitaFC10EnBien = (fc) => !estaPendiente(fc);