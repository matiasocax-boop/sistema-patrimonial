import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escaparFiltroPostgrest, rolDesdeCargo, rolEsPrivilegiado } from '../src/utils/postgrest.js';

test('escaparFiltroPostgrest entrecomilla y escapa comillas', () => {
  assert.equal(escaparFiltroPostgrest('Rectorado'), '"Rectorado"');
  assert.equal(escaparFiltroPostgrest('a"b'), '"a\\"b"');
  assert.equal(escaparFiltroPostgrest('Fac. de Derecho'), '"Fac. de Derecho"');
});

test('rolDesdeCargo mapea cargos conocidos', () => {
  assert.equal(rolDesdeCargo('admin'), 'admin');
  assert.equal(rolDesdeCargo('desarrollador'), 'dev');
  assert.equal(rolDesdeCargo('funcionario'), 'user');
});

test('rolEsPrivilegiado cubre admin y desarrollador', () => {
  assert.equal(rolEsPrivilegiado('dev'), true);
  assert.equal(rolEsPrivilegiado('admin'), true);
  assert.equal(rolEsPrivilegiado('user'), false);
});
