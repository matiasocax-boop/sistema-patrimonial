import React, { useState, useEffect, useMemo, useRef } from 'react';
import { normalizeStr } from '../utils/helpers';

// Paleta de comandos global (Ctrl+K): bienes, funcionarios y acciones.
export default function CommandPalette({
  isOpen, onClose, bienes, funcionarios, dependenciaActual,
  irInventario, abrirNuevoBien, abrirEscaner, abrirFC03, irTab,
  isAdmin, esDesarrollador, onToggleTheme, onAbrirAtajos, onAbrirTour,
  onExportCSV, onExportExcel, onRepetirExport, ultimaExportacion
}) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen ]);

  const resultados = useMemo(() => {
    const q = normalizeStr(query);
    const tokens = q.split(' ').filter(Boolean);
    const match = (texto) => {
      if (tokens.length === 0) return true;
      const h = normalizeStr(texto);
      return tokens.every(t => h.includes(t));
    };
    const guardarReciente = (r) => {
      try {
        const prev = JSON.parse(localStorage.getItem('cmd_recientes') || '[]');
        const next = [{ kind: r.kind, ref: r.ref, titulo: r.titulo, subtitulo: r.subtitulo }, ...prev.filter(x => !(x.kind === r.kind && x.ref === r.ref))].slice(0, 5);
        localStorage.setItem('cmd_recientes', JSON.stringify(next));
      } catch {}
    };
    const out = [];
    // Recientes (solo sin búsqueda): bienes y funcionarios visitados
    if (!tokens.length) {
      try {
        const recientes = JSON.parse(localStorage.getItem('cmd_recientes') || '[]');
        recientes.forEach(r => {
          if (r.kind === 'bien') out.push({ tipo: 'Reciente', titulo: r.titulo, subtitulo: r.subtitulo, icon: 'fa-tag', accion: () => irInventario(r.ref) });
          if (r.kind === 'func') out.push({ tipo: 'Reciente', titulo: r.titulo, subtitulo: r.subtitulo, icon: 'fa-user-tie', accion: () => irTab('funcionarios', r.ref) });
        });
      } catch {}
    }
    if (dependenciaActual) {
      bienes
        .filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual))
        .filter(b => match(`${b.rotulo || ''} ${b.descripcion || ''} ${b.funcionario || ''}`))
        .slice(0, 6)
        .forEach(b => out.push({
          tipo: 'Bien', titulo: b.rotulo || 'S/R', subtitulo: String(b.descripcion || '').slice(0, 60),
          icon: 'fa-tag', accion: () => { guardarReciente({ kind: 'bien', ref: b.rotulo || '', titulo: b.rotulo || 'S/R', subtitulo: String(b.descripcion || '').slice(0, 60) }); irInventario(b.rotulo || ''); }
        }));
      funcionarios
        .filter(f => !dependenciaActual || f.dependencia === dependenciaActual)
        .filter(f => match(`${f.nombre || ''} ${f.cedula || ''}`))
        .slice(0, 3)
        .forEach(f => out.push({
          tipo: 'Funcionario', titulo: f.nombre, subtitulo: f.cedula ? `CI ${f.cedula}` : (f.cargo || ''),
          icon: 'fa-user-tie', accion: () => { guardarReciente({ kind: 'func', ref: f.nombre || '', titulo: f.nombre, subtitulo: f.cedula ? `CI ${f.cedula}` : (f.cargo || '') }); irTab('funcionarios', f.nombre || ''); }
        }));
    }
    const acciones = [
      { titulo: 'Nuevo registro de bien', subtitulo: 'Inventario', icon: 'fa-plus', accion: abrirNuevoBien },
      { titulo: 'Escanear código QR', subtitulo: 'Cámara', icon: 'fa-qrcode', accion: abrirEscaner },
      { titulo: 'Generar reporte FC-03', subtitulo: 'Documento', icon: 'fa-print', accion: abrirFC03 },
      { titulo: 'Exportar inventario (CSV)', subtitulo: 'Descarga', icon: 'fa-file-export', accion: onExportCSV },
      { titulo: 'Exportar inventario (Excel)', subtitulo: 'Descarga', icon: 'fa-file-excel', accion: onExportExcel },
      ...(ultimaExportacion ? [{ titulo: `Repetir última exportación (${ultimaExportacion.formato.toUpperCase()})`, subtitulo: 'Favorita', icon: 'fa-rotate-right', accion: onRepetirExport }] : []),
      { titulo: 'Alternar tema claro / oscuro', subtitulo: 'Apariencia', icon: 'fa-circle-half-stroke', accion: onToggleTheme },
      { titulo: 'Ver atajos de teclado', subtitulo: 'Ayuda', icon: 'fa-keyboard', accion: onAbrirAtajos },
      { titulo: 'Hacer tour guiado', subtitulo: 'Ayuda', icon: 'fa-route', accion: onAbrirTour },
      { titulo: 'Ir al Inventario General', subtitulo: 'Sección', icon: 'fa-boxes-stacked', accion: () => irTab('inventario') },
      { titulo: 'Ir a Asignaciones FC-10', subtitulo: 'Sección', icon: 'fa-file-signature', accion: () => irTab('fc10') },
      { titulo: 'Ir a Mi Dependencia', subtitulo: 'Sección', icon: 'fa-house-user', accion: () => irTab('resumen') },
      ...(isAdmin ? [
        { titulo: 'Ir a Aprobaciones', subtitulo: 'Sección', icon: 'fa-check-to-slot', accion: () => irTab('aprobaciones') },
        { titulo: 'Ir a Auditoría', subtitulo: 'Sección', icon: 'fa-magnifying-glass-chart', accion: () => irTab('auditoria') },
        { titulo: 'Ir a Gestión de Usuarios', subtitulo: 'Sección', icon: 'fa-users-gear', accion: () => irTab('usuarios') },
      ] : []),
      ...(esDesarrollador ? [
        { titulo: 'Ir a Anuncios', subtitulo: 'Sección', icon: 'fa-bullhorn', accion: () => irTab('anuncios') },
      ] : []),
    ].filter(a => a.accion && (!tokens.length || match(`${a.titulo} ${a.subtitulo}`)));
    acciones.forEach(a => out.push({ tipo: 'Acción', ...a }));
    return out.slice(0, 14);
  }, [query, bienes, funcionarios, dependenciaActual, irInventario, abrirNuevoBien, abrirEscaner, abrirFC03, irTab, isAdmin, esDesarrollador, onToggleTheme, onAbrirAtajos, onAbrirTour, onExportCSV, onExportExcel, onRepetirExport, ultimaExportacion]);

  useEffect(() => { setSel(0); }, [query]);

  if (!isOpen) return null;

  const ejecutar = (r) => {
    onClose();
    setTimeout(() => r.accion(), 30);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-start justify-center p-4 pt-[12dvh] bg-zinc-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-label="Búsqueda global"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <i className="fa-solid fa-magnifying-glass text-zinc-400 text-sm"></i>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, resultados.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && resultados[sel]) ejecutar(resultados[sel]);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Buscar bienes, funcionarios o acciones... (Esc para cerrar)"
            className="flex-1 bg-transparent outline-none text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">Ctrl K</kbd>
        </div>
        <div className="max-h-[50dvh] overflow-y-auto custom-scrollbar py-2">
          {resultados.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs font-semibold text-zinc-400">Sin coincidencias. Prueba con rótulo, nombre o apellido.</p>
          ) : (
            resultados.map((r, i) => (
              <button
                key={`${r.tipo}-${r.titulo}-${i}`}
                onClick={() => ejecutar(r)}
                onMouseEnter={() => setSel(i)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${i === sel ? 'bg-zinc-100 dark:bg-white/10' : ''}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-300">
                  <i className={`fa-solid ${r.icon} text-xs`}></i>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-zinc-900 dark:text-white truncate">{r.titulo}</span>
                  <span className="block text-[11px] text-zinc-400 truncate">{r.subtitulo}</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-600 shrink-0">{r.tipo}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
