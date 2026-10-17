// ============================================================================
// Prueba de integración del pipeline de login (sin Supabase ni React)
// ============================================================================
// Recorre el mismo camino que `useAuthSession.handleLogin`:
//   entrada del usuario -> credenciales normalizadas -> perfil de la base ->
//   sesión local con rol.
// Así se fija el contrato aunque el hook cambie por fuera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarEntradaAcceso, validarPassword, construirSesion
} from '../src/utils/authInput.js';

const pipeline = (entrada, password, perfilEnDb) => {
  const acceso = normalizarEntradaAcceso(entrada);
  if (!acceso.ok) return { etapa: 'entrada', error: acceso.error };

  const clave = validarPassword(password);
  if (!clave.ok) return { etapa: 'password', error: clave.error };

  if (!perfilEnDb || perfilEnDb.username !== acceso.nombreUsuario) {
    return { etapa: 'perfil', error: 'Usuario sin perfil en el sistema.' };
  }
  return { etapa: 'ok', sesion: construirSesion(perfilEnDb) };
};

test('login con nombre corto construye sesión de admin', () => {
  const r = pipeline('ADMIN', 'secreto123', {
    username: 'admin', nombre: 'Admin Gral', cargo: 'admin', dependencia: 'Rectorado'
  });
  assert.equal(r.etapa, 'ok');
  assert.equal(r.sesion.role, 'admin');
  assert.equal(r.sesion.dependencia, 'Rectorado');
});

test('login con email construye sesión de funcionario', () => {
  const r = pipeline('juan@unp.edu.py', 'secreto123', {
    username: 'juan', nombre: 'Juan', cargo: 'funcionario', dependencia: 'Facultad'
  });
  assert.equal(r.etapa, 'ok');
  assert.equal(r.sesion.role, 'user');
  assert.equal(r.sesion.dependencia, 'Facultad');
});

test('sin perfil en la base se rechaza antes de armar la sesión', () => {
  const r = pipeline('nadie', 'secreto123', null);
  assert.equal(r.etapa, 'perfil');
  assert.equal(r.sesion, undefined);
});

test('el rol viene del cargo de la base, no de la entrada', () => {
  // El cliente escribe "admin" pero el perfil dice "funcionario": manda la base.
  const r = pipeline('admin', 'secreto123', {
    username: 'admin', nombre: 'Admin', cargo: 'funcionario', dependencia: 'Rectorado'
  });
  assert.equal(r.sesion.role, 'user');
});

test('faltan credenciales', () => {
  assert.equal(pipeline('', 'secreto123', { username: 'admin' }).etapa, 'entrada');
  assert.equal(pipeline('admin', '', { username: 'admin' }).etapa, 'password');
});
