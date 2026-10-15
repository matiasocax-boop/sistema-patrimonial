import { lazy } from 'react';

// Carga diferida con auto-recuperación: si un chunk viejo falla (deploy intermedio),
// recarga una vez para traer el HTML y los chunks consistentes.
export const lazyConReintento = (importador) => lazy(async () => {
  try {
    return await importador();
  } catch (e) {
    try {
      if (!sessionStorage.getItem('chunk_reintentado')) {
        sessionStorage.setItem('chunk_reintentado', '1');
        window.location.reload();
      }
    } catch (err) {}
    throw e;
  }
});
