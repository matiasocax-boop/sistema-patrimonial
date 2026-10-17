import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarEntradaAcceso, validarPassword, construirSesion
} from '../src/utils/authInput.js';

test('nombre corto se convierte al email del dominio', () => {
  const r = normalizarEntradaAcceso('  Admin ');
  assert.equal(r.ok, true);
  assert.equal(r.esEmail, false);
  assert.equal(r.emailAcceso, 'admin@unp.edu.py');
  assert.equal(r.nombreUsuario, 'admin');
});

test('email completo se conserva y extrae el usuario', () => {
  const r = normalizarEntradaAcceso('Funcionario@UNP.edu.py');
  assert.equal(r.ok, true);
  assert.equal(r.esEmail, true);
  assert.equal(r.emailAcceso, 'funcionario@unp.edu.py');
  assert.equal(r.nombreUsuario, 'funcionario');
});

test('rechaza vacío, nulo y exceso de longitud', () => {
  assert.equal(normalizarEntradaAcceso('').ok, false);
  assert.equal(normalizarEntradaAcceso('   ').ok, false);
  assert.equal(normalizarEntradaAcceso(null).ok, false);
  assert.equal(normalizarEntradaAcceso('a'.repeat(300)).ok, false);
});

test('validarPassword exige string no vacío y acota', () => {
  assert.equal(validarPassword('').ok, false);
  assert.equal(validarPassword(null).ok, false);
  assert.equal(validarPassword(1234).ok, false);
  assert.equal(validarPassword('x'.repeat(300)).ok, false);
  assert.equal(validarPassword('secreto').ok, true);
});

test('construirSesion deriva el rol del cargo y aplica dependencia por defecto', () => {
  const admin = construirSesion({ username: 'admin', nombre: 'Admin', cargo: 'admin', dependencia: 'Rectorado' });
  assert.equal(admin.role, 'admin');
  assert.equal(admin.dependencia, 'Rectorado');

  const dev = construirSesion({ username: 'dev', nombre: 'Dev', cargo: 'desarrollador' });
  assert.equal(dev.role, 'dev');
  assert.equal(dev.dependencia, 'Rectorado');

  const func = construirSesion({ username: 'juan', nombre: 'Juan', cargo: 'funcionario', dependencia: 'Facultad' });
  assert.equal(func.role, 'user');
  assert.equal(func.dependencia, 'Facultad');

  const sinCargo = construirSesion({ username: 'x', nombre: 'X' });
  assert.equal(sinCargo.role, 'user');
});
