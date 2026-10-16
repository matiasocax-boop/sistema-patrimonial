import { useState, useCallback } from 'react';

// Sistema de notificaciones flotantes (extraído de App.jsx, Fase 1).
// Misma API que el código original: [toasts, addToast].
// opts: { duration, action: { label, onClick } } para toasts con acción.
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const quitarToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', opts = {}) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, action: opts.action || null }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), opts.duration || 4500);
    return id;
  }, []);

  return { toasts, addToast, quitarToast };
}
