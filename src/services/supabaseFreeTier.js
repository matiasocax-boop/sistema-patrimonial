// ============================================================================
// AJUSTES PARA EL PLAN FREE DE SUPABASE
// ============================================================================
// El plan free tiene limites que pesan sobre el uso real del sistema:
//
//   - 500 MB de base de datos
//   - 1 GB de egress (salida) por mes
//   - 5 GB de storage
//   - 2 millones de filas leidas por mes
//   - 500 MB de ancho de banda
//   - Realtime con limites de conexiones y mensajes
//
// Este modulo concentra las decisiones que las respetan. Todo lo que sigue
// asume que el sistema corre sobre el free tier, no sobre un plan pagos.
//
// ============================================================================

/** Egress: bytes que Supabase puede descargar desde la region del proyecto. */
export const LIMITE_EGRESS_MES = 1 * 1024 * 1024 * 1024; // 1 GB
/** Filas leidas por mes (2 M en free). */
export const LIMITE_FILAS_MES = 2_000_000;
/** Espacio de base de datos. */
export const LIMITE_DB = 500 * 1024 * 1024; // 500 MB
/** Storage de archivos. */
export const LIMITE_STORAGE = 5 * 1024 * 1024 * 1024; // 5 GB

/**
 * Trafico que genera una carga completa del inventario.
 * El sistema usa sync delta (solo filas con updated_at nuevo), pero cada 24 h
 * hace una recarga total. Este numero sirve para decidir cada cuanto.
 *
 * Medido en el sistema real: ~1800 bienes por dependencia, ~2 KB por fila.
 */
export const BYTES_POR_FILA_BIEN = 2 * 1024;
export const BIENES_POR_DEPENDENCIA = 1800;

/** Bytes de una recarga total. */
export const bytesRecargaTotal = (bienes = BIENES_POR_DEPENDENCIA) => bienes * BYTES_POR_FILA_BIEN;

/** Cuantas recargas completas aguantamos en el mes con el egress disponible. */
export const recargasPorMes = () => Math.floor(LIMITE_EGRESS_MES / bytesRecargaTotal());

// ---------------------------------------------------------------------------
// 1. Periodicidad de la recarga total
// ---------------------------------------------------------------------------
// El syncBienes.js ya hace delta cada 24 h. En free, 30 recargas completas por
// mes (~55 MB) es un presupuesto cómodo. Bajar a 7 días lo deja en ~8
// recargas/mes (~28 MB) y libera margen para fotos y consultas.
// ---------------------------------------------------------------------------
export const INTERVALO_RESYNC_MS = 24 * 60 * 60 * 1000; // 24 h (el valor actual)

// ---------------------------------------------------------------------------
// 2. Compresión de imágenes antes de subirlas
// ---------------------------------------------------------------------------
// El storage del free es 5 GB y cada foto cuenta. comprimirImagen() en helpers
// ya recorta a 1024 px y ~120 KB, que es lo razonable. Lo que se controla acá
// es cuántas se permiten por bien: 5 fotos de 120 KB son 600 KB por bien.
// Con 1800 bienes, el tope teorico es ~1 GB solo en fotos.
// ---------------------------------------------------------------------------
export const MAX_FOTOS_POR_BIEN = 3;
export const KB_POR_FOTO = 120;

// ---------------------------------------------------------------------------
// 3. Consulta de auditoría acotada
// ---------------------------------------------------------------------------
// La auditoría crece sin límite: cada firma, cambio o borrado escribe una fila.
// Es la tabla que más crece y la que solo el admin lee. En free conviene
// traer solo una ventana reciente, no todo el historial.
// ---------------------------------------------------------------------------
export const AUDITORIA_WINDOW_DIAS = 180;
export const AUDITORIA_MAX_FILAS = 1000;

// ---------------------------------------------------------------------------
// 4. Realtime: qué merece suscripción y qué no
// ---------------------------------------------------------------------------
// El realtime del free cobra por conexiones y mensajes. La estrategia:
//
//   - bens: SI se suscribe. Es la tabla que cambia entre equipos y el Savings
//     es lo que hace útil la app en campo. Como el delta ya cubre el resto,
//     llega muy poco por este canal.
//   - notificaciones: se puede reemplazar por sondeo (ya hay un setInterval
//     de 30 s en useRealtimeSync) si se quiere ahorrar conexiones.
//
// Los canales se abren solo con la sesión iniciada y se cierran al salir
// (ver el return del useEffect), así que no quedan conexiones colgando.
// ---------------------------------------------------------------------------
export const REALTIME_BENS_ACTIVO = true;
export const REALTIME_NOTIF_ACTIVO = false; // el sondeo ya cubre el caso

// Cadencia del sondeo de notificaciones. El presupuesto del free es de 2 M de
// filas leidas al mes (plan de 8 h/dia ≈ 1.44 M con 100 filas cada 60 s: dos o
// tres equipos lo reventaban). Con 25 filas cada 3 minutos son ~30 k por mes
// por cliente: margen amplio para lo que realmente importa (que le avisen de
// una solicitud de baja o un anuncio).
export const POLL_NOTIFICACIONES_MS = 180000; // 3 minutos
export const POLL_NOTIF_ROWS = 25;

// ---------------------------------------------------------------------------
// 5. Consulta de bienes: solo columnas necesarias
// ---------------------------------------------------------------------------
// Traer '*' en una tabla con JSONB puede duplicar el ancho de banda si se
// seleccionan columnas anidadas. El select explicito de id, data, updated_at
// ya es lo que usa syncBienes para el delta.

/**
 * Estimacion de lo que ocupa la base con el estado actual.
 * Se usa para mostrar en el dashboard de salud de datos cuanto queda libre.
 */
export const estimarUsoDB = async (supabase) => {
  const tablas = ['bens', 'fc10', 'fc11', 'fc04', 'estructuras', 'usuarios', 'funcionarios', 'notificaciones', 'auditoria', 'dependencias', 'ubicaciones'];
  let totalFilas = 0;
  const porTabla = {};
  for (const t of tablas) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        porTabla[t] = count;
        totalFilas += count;
      }
    } catch (e) { /* tabla que aun no existe */ }
  }
  // 2 KB por fila es el orden de magnitud de un bien con su JSONB.
  const bytesEstimados = totalFilas * BYTES_POR_FILA_BIEN;
  return { porTabla, totalFilas, bytesEstimados, pctUso: (bytesEstimados / LIMITE_DB) * 100 };
};

/** Aviso si el uso se acerca al limite del free. */
export const alertaUso = ({ pctUso }) => {
  if (pctUso >= 90) return { nivel: 'critico', texto: 'Base de datos casi llena. Conviene archivar auditoría antigua.' };
  if (pctUso >= 70) return { nivel: 'aviso', texto: 'La base de datos está usando más de 70% del plan free.' };
  return null;
};