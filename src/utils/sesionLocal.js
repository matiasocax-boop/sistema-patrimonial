/** Lee el perfil cacheado. JSON corrupto no debe tumbar la app. */
export function leerUsuarioLocal() {
  try {
    const saved = localStorage.getItem('current_user');
    if (!saved) return null;
    const u = JSON.parse(saved);
    if (!u || typeof u !== 'object' || typeof u.username !== 'string' || !u.username.trim()) {
      throw new Error('sesión inválida');
    }
    return u;
  } catch {
    try {
      localStorage.removeItem('current_user');
      localStorage.removeItem('is_logged_in');
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function sesionMarcadaLocal() {
  try {
    return localStorage.getItem('is_logged_in') === 'true' && !!leerUsuarioLocal();
  } catch {
    return false;
  }
}
