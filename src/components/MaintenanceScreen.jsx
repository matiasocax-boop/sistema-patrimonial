import React from 'react';
import { APP_VERSION } from '../utils/helpers';

export default function MaintenanceScreen({ config, onAccesoDesarrollador }) {
  const mejoras = Array.isArray(config?.mejoras)
    ? config.mejoras
    : String(config?.mejoras || '').split('\n').map(s => s.trim()).filter(Boolean);

  const fechaInicio = config?.fechaInicio || new Date().toISOString();
  const transcurrido = config?.transcurrido || '';
  const estimado = config?.estimado || '';

  return (
    <div className="min-h-dvh flex flex-col w-full bg-[#0b0f19] font-sans antialiased relative overflow-hidden selection:bg-brand-primary/30">
      <span className="absolute bottom-4 right-5 z-10 text-[10px] font-semibold text-slate-400">v{APP_VERSION}</span>
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-96 w-[44rem] rounded-full bg-blue-900/20 blur-[100px]"></div>
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-indigo-900/20 blur-[100px]"></div>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          <img
            src="/UNP-Site-Logo.webp"
            alt="Universidad Nacional de Pilar"
            className="h-14 w-auto mx-auto object-contain drop-shadow-md mb-6"
            onError={(e) => { e.target.onerror = null; e.target.src = '/UNP-Site-Logo.png'; }}
          />

          {/* Estado del mantenimiento con indicador animado */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] bg-amber-900/20 text-amber-400 border border-amber-900/30 mb-6 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            Sistema en mantenimiento
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            {config?.titulo || 'Estamos mejorando el sistema'}
          </h1>
          <p className="text-sm text-slate-300/90 leading-relaxed mt-1 max-w-md mx-auto mb-8">
            {config?.mensaje || 'El acceso está pausado temporalmente mientras se aplican mejoras de seguridad y rendimiento. Por favor, intente nuevamente en unos minutos.'}
          </p>

          {/* Información de progreso */}
          {(transcurrido || estimado) && (
            <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiempo transcurrido</span>
                <span className="text-[11px] text-slate-300 font-mono">{transcurrido}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
              </div>
              {estimado && (
                <div className="mt-2 flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiempo estimado restante</span>
                  <span className="text-[11px] text-slate-300 font-mono">{estimado}</span>
                </div>
              )}
            </div>
          )}

          {mejoras.length > 0 && (
            <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 backdrop-blur-sm text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">
                Mejoras en curso
              </p>
              <ul className="space-y-3">
                {mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25 mt-0.5">
                      <i className="fa-solid fa-check text-[9px] text-emerald-400"></i>
                    </span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400 mb-8">
            Contacto: <span className="font-bold text-slate-300">patrimonio@unp.edu.py</span>
          </p>
          {onAccesoDesarrollador && (
            <button
              onClick={onAccesoDesarrollador}
              className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg px-3 py-2"
              title="Acceso del desarrollador del sistema"
            >
              <i className="fa-solid fa-key text-[10px]"></i>
              Acceso desarrollador
            </button>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center pb-6 px-6">
        <p className="text-[11px] font-medium text-slate-500">
          Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales
        </p>
        <p className="text-[11px] font-bold text-slate-400 mt-1">
          Desarrollador del Sistema: Matias Ocampo
        </p>
      </footer>
    </div>
  );
}
