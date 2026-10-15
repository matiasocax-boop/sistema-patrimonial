import { useState, useCallback } from 'react';

// Sistema de notificaciones flotantes (extraído de App.jsx, Fase 1).
// Misma API que el código original: [toasts, addToast].
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  return { toasts, addToast };
}
