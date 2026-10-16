import React from 'react';

// Red de seguridad global: si cualquier parte de la app lanza un error en
// render, se muestra esta pantalla de recuperación en vez de quedar en blanco.
// No cambia ningún flujo: solo evita perder la sesión ante un crash.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tieneError: false, detalle: '', copiado: false };
  }

  static getDerivedStateFromError(error) {
    return { tieneError: true, detalle: String(error?.message || error || '') };
  }

  componentDidCatch(error, info) {
    try {
      console.error('ErrorBoundary capturó:', error, info?.componentStack);
    } catch { /* noop */ }
  }

  copiarDetalle = async () => {
    const texto = `Error SIGEP UNP - ${new Date().toISOString()}\n${this.state.detalle}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(texto);
      else {
        const ta = document.createElement('textarea');
        ta.value = texto;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.setState({ copiado: true });
      setTimeout(() => { try { this.setState({ copiado: false }); } catch {} }, 2500);
    } catch {}
  };

  render() {
    if (!this.state.tieneError) return this.props.children;

    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a1c38] px-6 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-8 sm:p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-slide-up">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
          </div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
            Algo falló al mostrar esta pantalla
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
            Tus datos están a salvo. Recarga la pantalla o vuelve al inicio.
            Si persiste, avisa al administrador del sistema.
          </p>
          {this.state.detalle && (
            <p className="mt-3 rounded-xl bg-zinc-100 dark:bg-white/5 px-3 py-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 break-words">
              {this.state.detalle.slice(0, 220)}
            </p>
          )}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-2xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-black transition-all cursor-pointer active:scale-[0.98]"
            >
              Recargar
            </button>
            <button
              onClick={() => { try { sessionStorage.clear(); } catch { /* noop */ } window.location.href = '/'; }}
              className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-100 text-xs font-black transition-all cursor-pointer active:scale-[0.98]"
            >
              Ir al inicio
            </button>
          </div>
          <button
            onClick={this.copiarDetalle}
            className="mt-3 text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copia el detalle técnico para enviarlo al administrador"
          >
            <i className={`fa-solid ${this.state.copiado ? 'fa-check text-emerald-500' : 'fa-copy'} mr-1.5`}></i>
            {this.state.copiado ? 'Detalle copiado' : 'Copiar detalle técnico'}
          </button>
        </div>
      </div>
    );
  }
}
