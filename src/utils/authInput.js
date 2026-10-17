/**
 * ============================================================================
 * NORMALIZACIÓN DE ACCESO Y CONSTRUCCIÓN DE SESIÓN (lógica pura)
 * ============================================================================
 * Se extrae de `useAuthSession` para que el pipeline del login (entrada del
 * usuario -> email de Supabase -> perfil -> sesión con rol) se pueda probar
 * sin montar React ni Supabase.
 *
 * Reglas:
 *   - El usuario puede escribir su nombre corto (`admin`) o su email completo
 *     (`admin@unp.edu.py`). En ambos casos se normaliza a minúsculas.
 *   - Todo se acota en longitud: un valor gigante no debe llegar a la consulta.
 *   - La sesión siempre lleva un rol derivado del cargo, nunca del cliente.
 * ========================================================================== */

import { rolDesdeCargo } from './postgrest.js';

export const DOMINIO_ACCESO = 'unp.edu.py';
export const LIMITE_ENTRADA = 254;   // límite práctico de un email
export const LIMITE_PASSWORD = 200;

/**
 * Normaliza lo que el usuario tipea en el campo "Usuario (ID)".
 *
 * @param {string} entrada  texto crudo del input
 * @returns {{ok: boolean, esEmail?: boolean, emailAcceso?: string,
 *            nombreUsuario?: string, error?: string}}
 */
export function normalizarEntradaAcceso(entrada) {
  const limpio = String(entrada ?? '').trim();
  if (!limpio) return { ok: false, error: 'Ingresá tu usuario.' };
  if (limpio.length > LIMITE_ENTRADA) return { ok: false, error: 'El usuario es demasiado largo.' };

  const minus = limpio.toLowerCase();
  const esEmail = minus.includes('@');
  return {
    ok: true,
    esEmail,
    emailAcceso: esEmail ? minus : `${minus}@${DOMINIO_ACCESO}`,
    // El perfil se busca por nombre de usuario: para el email se toma la parte
    // antes de la @, en minúsculas (mismo criterio que el backend).
    nombreUsuario: esEmail ? minus.split('@')[0] : minus
  };
}

/** Valida la contraseña antes de mandarla a Supabase. */
export function validarPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, error: 'Ingresá tu contraseña.' };
  }
  if (password.length > LIMITE_PASSWORD) {
    return { ok: false, error: 'La contraseña es demasiado larga.' };
  }
  return { ok: true };
}

/**
 * Arma la sesión local a partir del perfil de la tabla `usuarios`.
 * El rol sale del cargo de la base, nunca de lo que el cliente recuerde.
 */
export function construirSesion(perfil) {
  const cargo = typeof perfil?.cargo === 'string' && perfil.cargo.trim()
    ? perfil.cargo.trim()
    : 'funcionario';
  return {
    username: perfil.username,
    nombre: perfil.nombre,
    cargo,
    role: rolDesdeCargo(cargo),
    dependencia: perfil.dependencia || 'Rectorado'
  };
}
