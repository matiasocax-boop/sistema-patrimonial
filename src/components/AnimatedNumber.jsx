import React, { useState, useEffect, useRef } from 'react';

// Número con animación de conteo suave al cambiar de valor.
export default function AnimatedNumber({ value, className }) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;
    if (from === target) {
      setShown(target);
      return;
    }
    const start = performance.now();
    const dur = 600;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(from + (target - from) * eased);
      setShown(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span className={className}>
      {Number(shown).toLocaleString('es-PY')}
    </span>
  );
}
