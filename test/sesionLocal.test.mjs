import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// localStorage de prueba: el módulo solo lo lee al llamar a sus funciones.
function storage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear()
  };
}
globalThis.localStorage = storage();

const { leerUsuarioLocal, sesionMarcadaLocal } = await import('../src/utils/sesionLocal.js');

beforeEach(() => localStorage.clear());

test('sin datos no hay sesión', () => {
  assert.equal(leerUsuarioLocal(), null);
  assert.equal(sesionMarcadaLocal(), false);
});

test('lee una sesión válida', () => {
  localStorage.setItem('current_user', JSON.stringify({ username: 'admin', role: 'admin' }));
  assert.equal(leerUsuarioLocal().username, 'admin');
});

test('JSON corrupto se limpia y no explota', () => {
  localStorage.setItem('current_user', '{no es json');
  assert.equal(leerUsuarioLocal(), null);
  assert.equal(localStorage.getItem('current_user'), null);
  assert.equal(localStorage.getItem('is_logged_in'), null);
});

test('sesionMarcadaLocal exige bandera y perfil', () => {
  localStorage.setItem('current_user', JSON.stringify({ username: 'admin' }));
  localStorage.setItem('is_logged_in', 'true');
  assert.equal(sesionMarcadaLocal(), true);
  localStorage.setItem('is_logged_in', 'false');
  assert.equal(sesionMarcadaLocal(), false);
});

test('un perfil sin username no se considera válido', () => {
  localStorage.setItem('current_user', JSON.stringify({ role: 'admin' }));
  assert.equal(leerUsuarioLocal(), null);
});
