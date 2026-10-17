// ============================================================================
// BARRA DE KIOSCO PARA LA VISTA PÚBLICA DE QR
// ============================================================================
// Complemento de la vista pública (?id=...): pantalla completa, temporizador de
// inactividad y botón "Escanear otro QR". Se renderiza solo en el kiosk (URL con
// kiosk=1) para no ensuciar la consulta normal con controles de exhibition.
//
// Decisión: el temporizador NO hace logout ni borra nada; solo redirige a la
// pantalla principal cuando la pantalla quedó sin tocar, que es el comportamiento
// deseado en un punto de atención unattended.
import React, { useEffect, useRef, useState } from 'react';

// Segundos de inactividad antes de volver al inicio. Configurable por ?kioskIdle=N
export const parseIdleSegundos = (search) => {
  try {
    const n = parseInt(new URLSearchParams(search).get('kioskIdle') || '45', 10);
    return Number.isFinite(n) && n > 5 && n <= 3600 ? n : 45;
  } catch { return 45; }
};

export default function KioskBar({ idleSegundos = 45, onSalir, onEscanearOtro }) {
  const [visible, setVisible] = useState(true);
  //Segundos restantes; se recalcula en cada tick a partir de un deadline para
  // que un tab en segundo plano nouela el temporizador.
  const [restantes, setRestantes] = useState(idleSegundos);
  const deadline = useRef(Date.now() + idleSegundos * 1000);
  const timerRef = useRef(null);

  const reiniciar = () => {
    deadline.current = Date.now() + idleSegundos * 1000;
    setRestantes(idleSegundos);
    setVisible(true);
  };

  // Contador regresivo.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const seg = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRestantes(seg);
      if (seg === 0) {
        clearInterval(timerRef.current);
        onSalir && onSalir();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [idleSegundos, onSalir]);

  // Reinicia con cualquier interacción humana.
  useEffect(() => {
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    eventos.forEach(e => window.addEventListener(e, reiniciar, { passive: true }));
    return () => eventos.forEach(e => window.removeEventListener(e, reiniciar));
  }, [idleSegundos]);

  // Barra oculta durante los últimos 8 s para no distraer al lector.
  useEffect(() => { setVisible(restantes > 8 || restantes === idleSegundos); }, [restantes, idleSegundos]);

  const pct = Math.max(0, Math.min(100, (restantes / idleSegundos) * 100));

  return (
    <>
      {/* Indicador de inactividad */}
      <div className="fixed top-0 inset-x-0 h-1 z-[700] bg-slate-300/60">
        <div
          className="h-full bg-blue-600 transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Barra de controles */}
      <div
        className={`fixed bottom-0 inset-x-0 z-[700] flex items-center justify-between gap-2 px-4 py-3 bg-slate-900/85 backdrop-blur-md text-white transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <span className="text-[11px] font-bold tabular-nums opacity-80">
          <i className="fa-regular fa-clock mr-1.5"></i>
          Vuelve al inicio en {restantes}s
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onEscanearOtro}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-qrcode text-[11px]"></i> Escanear otro QR
          </button>
          <button
            onClick={onSalir}
            title="Salir del modo kiosco"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>
    </>
  );
}

// Botón para activar pantalla completa desde la vista pública normal.
export function BotonPantallaCompleta({ onCambio }) {
  const [activo, setActivo] = useState(false);
  useEffect(() => {
    const alCambiar = () => { setActivo(Boolean(document.fullscreenElement)); onCambio && onCambio(Boolean(document.fullscreenElement)); };
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, [onCambio]);

  const toggle = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch { /* el navegador puede rechazarlo (permisos); no es crítico */ }
  };

  return (
    <button
      onClick={toggle}
      title={activo ? 'Salir de pantalla completa' : 'Pantalla completa'}
      className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
    >
      <i className={`fa-solid ${activo ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
      <span className="hidden sm:inline">{activo ? 'Reducir' : 'Pantalla completa'}</span>
    </button>
  );
}