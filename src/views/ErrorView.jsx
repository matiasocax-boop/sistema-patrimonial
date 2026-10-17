// ============================================================================
// PÁGINAS DE ERROR Y RUTAS PROTEGIDAS
// ============================================================================
// Tres variantes reutilizables: 404 (ruta inexistente), 403 (sin permisos) y
// sesión expirada. Se usan como pantalla completa antes de montar el shell de
// la app, para que el usuario nunca aterrice en un canvas vacío.
//
// Nota de rutas: la app no usa react-router (es una SPA de una sola vista con
// `activeTab`), así que el 404 cubre el caso "el usuario Landing en una URL
// que no corresponde" y no un enrutado interno roto.
// ============================================================================
import React from 'react';

const VARIANTES = {
  404: {
    icon: 'fa-compass',
    tono: 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-300',
    codigo: '404',
    titulo: 'Página no encontrada',
    descripcion: 'La dirección que abriste no existe o cambió de lugar. Verificá el enlace o volvé al panel principal.',
    accion: 'Ir al Panel Principal'
  },
  403: {
    icon: 'fa-lock',
    tono: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    codigo: '403',
    titulo: 'Acceso restringido',
    descripcion: 'Tu cuenta no tiene permisos para ver esta sección. Si creés que es un error, pedile a un administrador que revise tu rol.',
    accion: 'Volver'
  },
  session: {
    icon: 'fa-user-clock',
    tono: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    codigo: 'Sesión expirada',
    titulo: 'Tu sesión se cerró',
    descripcion: 'Por seguridad cerramos la sesión después de un tiempo sin actividad. Volvé a iniciar sesión para continuar.',
    accion: 'Iniciar sesión'
  },
  error: {
    icon: 'fa-triangle-exclamation',
    tono: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    codigo: 'Error',
    titulo: 'Algo salió mal',
    descripcion: 'Ocurrió un problema inesperado al cargar esta sección. Probá de nuevo; si persiste, contactá al administrador.',
    accion: 'Reintentar'
  }
};

export default function ErrorView({ variante = '404', onAccion }) {
  const v = VARIANTES[variante] || VARIANTES[404];
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-zinc-50 dark:bg-darkbg-main px-4 animate-fade-in">
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${v.tono} shadow-inner mb-6`}>
          <i className={`fa-solid ${v.icon} text-3xl`}></i>
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500 mb-2">
          {v.codigo}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
          {v.titulo}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
          {v.descripcion}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={onAccion}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold shadow-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i> {v.accion}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-rotate-right text-xs"></i> Recargar
          </button>
        </div>
      </div>
    </div>
  );
}