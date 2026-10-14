import React from 'react';
import { APP_VERSION } from '../utils/helpers';

export default function MaintenanceScreen({ config }) {
  const mejoras = Array.isArray(config?.mejoras)
    ? config.mejoras
    : String(config?.mejoras || '').split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0a1c38] font-sans relative overflow-hidden">
      <span className="absolute bottom-4 right-5 z-10 text-[10px] font-semibold text-slate-500">v{APP_VERSION}</span>
      {/* Fondo tenue */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-96 w-[44rem] rounded-full bg-blue-500/15 blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"></div>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          <img
            src="/UNP-Site-Logo.png"
            alt="Universidad Nacional de Pilar"
            className="h-14 w-auto mx-auto object-contain drop-shadow-md mb-6"
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] bg-amber-500/15 text-amber-300 border border-amber-500/25 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            Sistema en mantenimiento
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {config?.titulo || 'Estamos mejorando el sistema'}
          </h1>
          <p className="text-sm text-slate-300/85 leading-relaxed mt-3 max-w-md mx-auto">
            {config?.mensaje || 'El acceso está pausado temporalmente mientras se aplican mejoras. Por favor, intenta nuevamente en unos minutos.'}
          </p>

          {mejoras.length > 0 && (
            <div className="mt-8 text-left rounded-3xl bg-white/[0.05] border border-white/10 p-5 sm:p-6 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">
                Mejoras en curso
              </p>
              <ul className="space-y-3">
                {mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25 mt-0.5">
                      <i className="fa-solid fa-check text-[9px] text-emerald-300"></i>
                    </span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-8">
            Contacto: <span className="font-bold text-slate-300">patrimonio@unp.edu.py</span>
          </p>
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
