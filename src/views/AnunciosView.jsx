import React, { useState, useMemo } from 'react';
import FiltroCombo from '../components/FiltroCombo';

// Módulo Anuncios (solo desarrollador): envía avisos a todos los usuarios
// o a uno específico. La entrega usa la tabla `notificaciones` existente
// (una fila por destinatario, para que el leído sea individual).
export default function AnunciosView({
  usuariosList = [],
  anunciosGrupos = [],
  onEnviar,
  onEliminarGrupo,
  currentUser
}) {
  const [titulo, setTitulo] = useState(() => { try { return localStorage.getItem('anuncio_borrador_titulo') || ''; } catch { return ''; } });
  const [mensaje, setMensaje] = useState(() => { try { return localStorage.getItem('anuncio_borrador_mensaje') || ''; } catch { return ''; } });
  const [destino, setDestino] = useState('TODOS');
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(null);

  const usuariosOrdenados = useMemo(
    () => [...usuariosList].sort((a, b) => String(a.nombre || a.username || '').localeCompare(String(b.nombre || b.username || ''), 'es')),
    [usuariosList]
  );

  const puedeEnviar = titulo.trim() !== '' && mensaje.trim() !== '' && (destino === 'TODOS' || destino !== '');
  const cantDest = destino === 'TODOS' ? usuariosList.length : 1;

  const handleEnviar = async () => {
    if (!puedeEnviar || enviando) return;
    setEnviando(true);
    try {
      const ok = await onEnviar({ titulo: titulo.trim(), mensaje: mensaje.trim(), destino });
      if (ok) { setTitulo(''); setMensaje(''); setDestino('TODOS'); try { localStorage.removeItem('anuncio_borrador_titulo'); localStorage.removeItem('anuncio_borrador_mensaje'); } catch {} }
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (grupo) => {
    if (eliminando) return;
    setEliminando(grupo);
    try { await onEliminarGrupo(grupo); } finally { setEliminando(null); }
  };

  const formatearFecha = (iso) => {
    try {
      return new Date(iso).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return String(iso || ''); }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-bullhorn text-lg"></i>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap">Anuncios</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 whitespace-nowrap shrink-0">
                {anunciosGrupos.length} enviados
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Avisos del desarrollador a todos o a un usuario específico</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Nuevo anuncio</h3>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Título</label>
          <input
            type="text" value={titulo} onChange={(e) => { setTitulo(e.target.value); try { localStorage.setItem('anuncio_borrador_titulo', e.target.value); } catch {} }} maxLength={120}
            placeholder="Ej: Mantenimiento programado este sábado"
            className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Mensaje</label>
          <textarea
            rows={3} value={mensaje} onChange={(e) => { setMensaje(e.target.value); try { localStorage.setItem('anuncio_borrador_mensaje', e.target.value); } catch {} }} maxLength={1000}
            placeholder="Detalle del aviso que verán en la campana de notificaciones..."
            className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex gap-2">
            <button
              type="button" onClick={() => setDestino('TODOS')}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold border transition-all cursor-pointer ${destino === 'TODOS' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-400'}`}
            >
              <i className="fa-solid fa-users mr-2 text-xs"></i>Todos ({usuariosList.length})
            </button>
            <button
              type="button" onClick={() => setDestino(usuariosOrdenados.find(u => u.username !== currentUser?.username)?.username || '')}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold border transition-all cursor-pointer ${destino !== 'TODOS' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-400'}`}
            >
              <i className="fa-solid fa-user mr-2 text-xs"></i>Específico
            </button>
          </div>
          {destino !== 'TODOS' && (
            <FiltroCombo
              valor={destino}
              opciones={usuariosOrdenados.map(u => ({ label: `${u.nombre || u.username} (@${u.username})`, value: u.username }))}
              onElegir={setDestino}
              etiquetaTodos="Elegir usuario..."
              titulo="Destinatario del anuncio"
            />
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button" onClick={handleEnviar} disabled={!puedeEnviar || enviando}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid ${enviando ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'} text-xs`}></i>
            {enviando ? 'Enviando...' : `Enviar a ${cantDest} usuario${cantDest === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200/50 dark:border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Historial</h3>
        </div>
        {anunciosGrupos.length === 0 ? (
          <p className="p-10 text-center text-sm font-semibold text-zinc-400">Aún no enviaste anuncios.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-white/5">
            {anunciosGrupos.map(a => (
              <li key={a.grupo} className="px-5 sm:px-6 py-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                  <i className="fa-solid fa-bullhorn text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{a.titulo}</p>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {a.alcance === 'TODOS' ? 'Todos' : `@${a.alcance}`}
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-1 whitespace-pre-wrap break-words">{a.mensaje}</p>
                  <p className="text-[11px] text-zinc-400 mt-1.5 tabular-nums">
                    {formatearFecha(a.fecha)} · Leído por {a.leidos}/{a.total}
                  </p>
                </div>
                <button
                  type="button" onClick={() => handleEliminar(a.grupo)} disabled={eliminando === a.grupo}
                  title="Eliminar anuncio para todos" aria-label="Eliminar anuncio"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <i className={`fa-solid ${eliminando === a.grupo ? 'fa-circle-notch fa-spin' : 'fa-trash-can'} text-xs`}></i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
