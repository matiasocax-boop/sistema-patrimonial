// ============================================================================
// EXPORTACIÓN PROGRAMADA DE REPORTES
// ============================================================================
// Permite dejar el inventario "en piloto automático": el usuario configura una
// frecuencia y un formato, y la app genera el archivo al entrar si ya venció la
// próxima ejecución y guarda una copia pendiente para descargar.
//
// Decisión: el navegador no puede enviar correos por sí solo ni correr en
// segundo plano. Lo que sí es confiable es la ejecución al abrir la app, que es
// justo cuando el usuario necesita el dato. Por eso:
//   - la programación vive en localStorage (no requiere backend);
//   - al entrar, si toca, se genera el archivo en segundo plano;
//   - la copia queda en un "pendiente" que se ofrece descargar/descartar, para
//     que el usuario pueda enviarla por el canal que use la institución.
//
// Nota: se usa localforage (IndexedDB) para la copia del archivo porque puede
// pesar megabytes y localStorage tiene un límite de ~5 MB que lanzaría
// QuotaExceededError.
import localforage from 'localforage';

const CLAVE_CFG = 'export_programada';
const CLAVE_PEND = 'export_pendientes';

// Frecuencias expresadas en horas. 'manual' desactiva la programación.
export const FRECUENCIAS = [
  { id: 'manual', label: 'Manual (desactivado)', horas: 0 },
  { id: 'diaria', label: 'Todos los días', horas: 24 },
  { id: 'semanal', label: 'Todos los lunes', horas: 24 * 7 },
  { id: 'mensual', label: 'El día 1 de cada mes', horas: 24 * 30 }
];

export const FORMATOS = [
  { id: 'csv', label: 'CSV', icon: 'fa-file-csv' },
  { id: 'xlsx', label: 'Excel', icon: 'fa-file-excel' }
];

const store = localforage.createInstance({ name: 'export-programada', storeName: 'pendientes' });

const leerCfg = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CLAVE_CFG) || 'null');
    // defaults defensivos: un JSON corrupto no debe romper el arranque
    if (!raw || typeof raw !== 'object') return null;
    return {
      frecuencia: typeof raw.frecuencia === 'string' ? raw.frecuencia : 'manual',
      formato: raw.formato === 'xlsx' ? 'xlsx' : 'csv',
      ultimaEjecucion: Number(raw.ultimaEjecucion) || 0
    };
  } catch { return null; }
};

const guardarCfg = (cfg) => {
  try { localStorage.setItem(CLAVE_CFG, JSON.stringify(cfg)); } catch { /* cuota llena */ }
};

export const obtenerProgramacion = () => leerCfg();

export const guardarProgramacion = (parcial) => {
  const actual = leerCfg();
  const cfg = {
    frecuencia: parcial.frecuencia ?? actual?.frecuencia ?? 'manual',
    formato: parcial.formato ?? actual?.formato ?? 'csv',
    ultimaEjecucion: parcial.ultimaEjecucion ?? actual?.ultimaEjecucion ?? 0
  };
  guardarCfg(cfg);
  return cfg;
};

// ¿Toca ejecutar la exportación automática ahora?
export const tocaEjecutar = (cfg, ahora = Date.now()) => {
  if (!cfg || cfg.frecuencia === 'manual') return false;
  const f = FRECUENCIAS.find(x => x.id === cfg.frecuencia);
  if (!f || f.horas === 0) return false;
  return (ahora - (cfg.ultimaEjecucion || 0)) >= f.horas * 60 * 60 * 1000;
};

// Descarga un blob en disco. Aislado porque lo comparten la exportación manual
// (vía helpers) y la automática.
export const descargarBlob = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revocar de inmediato puede cancelar la descarga en Safari; se deja un margen.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// Guarda la copia para que el usuario la descargue cuando quiera.
export const registrarPendiente = async ({ nombre, tipo, formato, blob }) => {
  try {
    await store.setItem(nombre, { nombre, tipo, formato, fecha: new Date().toISOString(), blob });
  } catch (e) {
    console.warn('No se pudo guardar la exportación pendiente:', e);
  }
};

export const listarPendientes = async () => {
  try {
    const claves = await store.keys();
    const filas = [];
    for (const k of claves) {
      const v = await store.getItem(k);
      if (v) filas.push(v);
    }
    return filas.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  } catch { return []; }
};

export const descargarPendiente = async (nombre) => {
  try {
    const v = await store.getItem(nombre);
    if (v?.blob) descargarBlob(v.blob, v.nombre);
    await store.removeItem(nombre);
    return true;
  } catch { return false; }
};

export const descartarPendiente = async (nombre) => {
  try { await store.removeItem(nombre); return true; } catch { return false; }
};

// Guarda la copia Y la baja de inmediato: el usuario pidió la descarga ahora.
export const descargarYArchivar = async ({ nombre, tipo, formato, blob }) => {
  await registrarPendiente({ nombre, tipo, formato, blob });
  descargarBlob(blob, nombre);
  await store.removeItem(nombre);
};

const selloFecha = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

// Genera el CSV del inventario como Blob. Se extrajo del hook de PDF para que
// la exportación programada reutilice exactamente el mismo formato (mismas
// columnas, mismo separador ';' y el BOM para que Excel respete acentos).
const FECHA_TXT = (v) => {
  if (!v) return '-';
  const s = String(v);
  // Reutiliza la lógica de helpers solo si viene con formatoISO; si no, la cadena.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [a, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${a}`;
  }
  return s;
};

export const construirCSVInventario = (bienes, dependenciaActual) => {
  let csv = "\uFEFFCuenta;Subcuenta;Analitico 1;Analitico 2;Rotulo;Descripcion;Dependencia;Ubicacion;Funcionario;Fecha Adquisicion;Valor Unitario (Gs.);Estado Conservacion;Vida Util;Tiene FC10;Tiene QR\n";
  (bienes || []).forEach(b => {
    const row = [
      b.cuenta || '-', b.subcuenta || '-', b.analitico1 || '-', b.analitico2 || '-',
      b.rotulo || '-', `"${(b.descripcion || '').replace(/"/g, '""')}"`,
      b.dependencia || '-', b.ubicacion || '-', b.funcionario || '-',
      FECHA_TXT(b.fechaAdquisicion), b.valorUnitario || '0',
      b.estadoConservacion || '-', b.vidaUtil || '-',
      b.hasFC10 ? 'SI' : 'NO', b.hasQR ? 'SI' : 'NO'
    ];
    csv += row.join(';') + "\n";
  });
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

export const nombreArchivoInventario = (dependenciaActual, formato, sufijo = '') => {
  const dep = String(dependenciaActual || 'inventario').replace(/\s+/g, '_');
  const ext = formato === 'xlsx' ? 'xlsx' : 'csv';
  return `Reporte_Inventario_${dep}${sufijo ? `_${sufijo}` : ''}_${selloFecha()}.${ext}`;
};