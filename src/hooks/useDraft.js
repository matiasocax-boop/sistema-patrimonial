import { useState, useCallback } from 'react';

// Borradores de formularios en localStorage (UI Lote 4).
// Guarda el contenido sin enviar para no perder trabajo si se cae la sesión.
// Solo para altas (no para edición): clave distinta por formulario.
export function useDraft(clave, activo) {
  const leer = () => {
    if (!activo) return null;
    try {
      const raw = localStorage.getItem(clave);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : null;
    } catch {
      return null;
    }
  };

  const [borrador, setBorrador] = useState(leer);

  const guardar = useCallback((obj) => {
    if (!activo) return;
    try {
      if (!obj || Object.values(obj).every(v => v === '' || v === undefined || v === null)) {
        localStorage.removeItem(clave);
        return;
      }
      localStorage.setItem(clave, JSON.stringify(obj));
    } catch {}
  }, [activo, clave]);

  const limpiar = useCallback(() => {
    try { localStorage.removeItem(clave); } catch {}
    setBorrador(null);
  }, [clave]);

  const hay = borrador && Object.values(borrador).some(v => v !== '' && v !== undefined && v !== null);

  return { borrador, hayBorrador: !!hay, guardarBorrador: guardar, limpiarBorrador: limpiar };
}

// Serializa un <form> a objeto plano (para guardar borrador al escribir).
export const serializarForm = (form) => {
  if (!form) return null;
  const fd = new FormData(form);
  const obj = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string') obj[k] = v;
  }
  return obj;
};
