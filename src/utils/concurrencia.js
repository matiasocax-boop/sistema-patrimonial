// ============================================================================
// GUARDA DE GENERACIÓN (protección contra carreras de carga)
// ============================================================================
// Las cargas de datos son async y pueden tardar varios segundos. Si el usuario
// cambia de dependencia (o de pestaña, o de filtro) mientras corre una, arranca
// otra: si la primera resolviera DESPUÉS, su resultado pisaría los datos de la
// nueva y la pantalla mostraría el encabezado de una con el contenido de la
// otra. Es el bug clásico de "respuesta fuera de orden".
//
// La solución es un contador monotónico: cada carga toma un número y solo puede
// escribir en el estado si sigue siendo la última. Las anteriores se descartan
// al llegar.
//
// No cancela la petición (la API de Supabase no lo expone de forma fiable), solo
// impide que un resultado viejo llegue a la pantalla.
// ============================================================================

/**
 * Crea una guarda de generación.
 * @returns {{siguiente: () => number, vigente: (turno: number) => boolean, invalidar: () => void}}
 */
export const crearGuardaGeneracion = () => {
  let actual = 0;
  return {
    /** Toma el turno de una carga nueva y devuelve su número. */
    siguiente: () => ++actual,
    /** ¿Este turno sigue siendo el vigente? Si no, el resultado se descarta. */
    vigente: (turno) => turno === actual,
    /** Invalida cualquier carga en curso (al desmontar, al cerrar sesión). */
    invalidar: () => { actual++; }
  };
};

/**
 * Envoltorio de un handler asíncrono que solo permite una ejecución a la vez.
 * Los clics repetidos se ignoran con un aviso, en vez de lanzar el trabajo dos
 * veces en paralelo (que compiten por el mismo estado y descargan duplicado).
 *
 * @param {{advertir?: (msg: string) => void}} opciones
 * @returns {(fn: Function) => Function} generador de handlers protegidos
 */
export const crearCerrojo = ({ advertir } = {}) => {
  let ocupado = false;
  const envoltura = (fn) => async (...args) => {
    if (ocupado) {
      if (advertir) advertir('Ese proceso ya está en curso. Esperá a que termine.');
      return undefined;
    }
    ocupado = true;
    try {
      return await fn(...args);
    } finally {
      ocupado = false;
    }
  };
  envoltura.ocupado = () => ocupado;
  return envoltura;
};