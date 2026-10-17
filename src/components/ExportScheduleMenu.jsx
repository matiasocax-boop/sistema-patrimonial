// ============================================================================
// PANEL DE EXPORTACIÓN PROGRAMADA
// ============================================================================
// Menú desplegable desde la barra del Inventario. Permite:
//   - activar una frecuencia (diaria / semanal / mensual / manual),
//   - elegir el formato (CSV / Excel),
//   - generar la exportación ahora mismo,
//   - ver y descargar los archivos que quedaron "pendientes" de sesiones
//     anteriores (generados al abrir la app cuando ya había vencido el plazo).
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  FRECUENCIAS, FORMATOS, obtenerProgramacion, guardarProgramacion,
  listarPendientes, descargarPendiente, descartarPendiente
} from '../services/exportSchedule';

export default function ExportScheduleMenu({ onEjecutarAhora, disabled }) {
  const [abierto, setAbierto] = useState(false);
  const [cfg, setCfg] = useState(() => obtenerProgramacion() || { frecuencia: 'manual', formato: 'csv', ultimaEjecucion: 0 });
  const [pendientes, setPendientes] = useState([]);

  const refrescar = () => listarPendientes().then(setPendientes);
  useEffect(() => { refrescar(); }, []);

  const cambiar = (parcial) => {
    const nueva = guardarProgramacion(parcial);
    setCfg(nueva);
  };

  const activa = cfg.frecuencia && cfg.frecuencia !== 'manual';
  const etiquetaFrecuencia = FRECUENCIAS.find(f => f.id === cfg.frecuencia)?.label || 'Manual';

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setAbierto(v => !v)}
        disabled={disabled}
        title="Exportación programada"
        className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
      >
        <i className={`fa-solid ${activa ? 'fa-clock text-brand-primary dark:text-brand-accent' : 'fa-clock'}`}></i>
        <span className="hidden lg:inline">Programar</span>
        {pendientes.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-black text-white">
            {pendientes.length}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)}></div>
          <div className="absolute right-0 z-50 mt-1.5 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-3 animate-pop">
            <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-clock"></i> Exportación programada
            </p>

            {/* Frecuencia */}
            <label className="block px-1 pt-1 pb-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Frecuencia</label>
            <div className="relative">
              <select
                value={cfg.frecuencia}
                onChange={(e) => cambiar({ frecuencia: e.target.value })}
                className="w-full h-9 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 pr-8 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none focus:border-brand-primary"
              >
                {FRECUENCIAS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Formato */}
            <label className="block px-1 pt-3 pb-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Formato</label>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {FORMATOS.map(f => (
                <button
                  key={f.id}
                  onClick={() => cambiar({ formato: f.id })}
                  className={`h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    cfg.formato === f.id
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} mr-1 text-[10px]`}></i> {f.label}
                </button>
              ))}
            </div>

            <p className="px-1 pt-2.5 pb-1 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              {activa
                ? `Se genera ${etiquetaFrecuencia.toLowerCase()} al abrir el sistema y queda listo para descargar.`
                : 'La programación está desactivada. Usá “Generar ahora” para una exportación puntual.'}
            </p>

            {cfg.ultimaEjecucion > 0 && (
              <p className="px-1 pb-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                Última: {new Date(cfg.ultimaEjecucion).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}

            {/* Generar ahora */}
            <button
              onClick={() => { setAbierto(false); onEjecutarAhora && onEjecutarAhora(); }}
              disabled={disabled}
              className="w-full mt-2 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <i className="fa-solid fa-download text-[10px]"></i> Generar ahora
            </button>

            {/* Pendientes */}
            {pendientes.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/10">
                <p className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Pendientes ({pendientes.length})
                </p>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto hide-scrollbar">
                  {pendientes.map(p => (
                    <div key={p.nombre} className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/5">
                      <i className={`fa-solid ${p.formato === 'xlsx' ? 'fa-file-excel text-emerald-500' : 'fa-file-csv text-sky-500'} text-[11px] shrink-0`}></i>
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 truncate flex-1" title={p.nombre}>{p.nombre}</span>
                      <button
                        onClick={async () => { await descargarPendiente(p.nombre); refrescar(); }}
                        title="Descargar" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
                      >
                        <i className="fa-solid fa-download text-[9px]"></i>
                      </button>
                      <button
                        onClick={async () => { await descartarPendiente(p.nombre); refresharSafe(refrescar); }}
                        title="Descartar" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10 text-zinc-400 cursor-pointer transition-colors"
                      >
                        <i className="fa-solid fa-xmark text-[9px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Pequeño helper: si descartarPendiente falla, no dejamos la UI desincronizada.
const refresharSafe = (fn) => { try { fn(); } catch { /* noop */ } };