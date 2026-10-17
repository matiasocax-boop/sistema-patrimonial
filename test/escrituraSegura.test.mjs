// ============================================================================
// Pruebas de escritura protegida contra ediciones simultáneas
// ============================================================================
// El escenario que reproduce estos tests: dos equipos editan el mismo bien a la
// vez y el segundo pisa el cambio del primero porque escribe el objeto entero.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectarCambios, fusionarSobreFresco, detectarConflictos, describirCampos
} from '../src/services/escrituraSegura.js';

const base = { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1', estadoConservacion: 'Bueno', funcionario: 'Rossana' };

test('detecta solo los campos realmente modificados', () => {
  const anterior = { ...base };
  const posterior = { ...base, estadoConservacion: 'Regular' };
  const cambios = detectarCambios(anterior, posterior);
  assert.deepEqual(cambios, { estadoConservacion: 'Regular' });
});

test('ignora updated_at e id', () => {
  const cambios = detectarCambios(base, { ...base, id: 'otro', updated_at: '2026-01-01' });
  assert.deepEqual(cambios, {});
});

test('trata 1 y "1" como cambio (conservador a propósito)', () => {
  // El JSONB puede devolver 1 como número y el formulario "1" como texto. Se
  // podría ignorar, pero aquí se decide lo contrario: una escritura de más es
  // inofensiva, mientras que descartar un cambio real por una comparación de
  // tipos sería pérdida de datos silenciosa. Ante la duda, se escribe.
  const cambios = detectarCambios({ ...base, cantidad: 1 }, { ...base, cantidad: '1' });
  assert.deepEqual(cambios, { cantidad: '1' });
});

test('el cambio real que el segundo editore pisaba', () => {
  // Equipo A cambia la ubicación. Equipo B, desde su memoria vieja, cambia el
  // estado y escribe el objeto entero: la ubicación de A se pierde.
  const enMemoriaDeB = { ...base };                       // B ve la ubicación vieja
  const loQueQuiereB = { ...enMemoriaDeB, estadoConservacion: 'Malo' };
  const loQueHayEnBase = { ...base, ubicacion: 'Aula 3' }; // A ya la cambió

  const cambiosDeB = detectarCambios(enMemoriaDeB, loQueQuiereB);
  const escritoPorB = fusionarSobreFresco(loQueHayEnBase, cambiosDeB, loQueQuiereB);

  assert.equal(escritoPorB.ubicacion, 'Aula 3', 'la ubicación de A debe sobrevivir');
  assert.equal(escritoPorB.estadoConservacion, 'Malo', 'el cambio de B se aplica');
});

test('el método anterior sí perdía el cambio de A', () => {
  // Contraprueba: escribir el objeto entero destruye el trabajo del otro.
  const loQueQuiereB = { ...base, estadoConservacion: 'Malo' }; // tiene la ubicación vieja
  const loQueHayEnBase = { ...base, ubicacion: 'Aula 3' };
  const escritoPorB = { ...loQueQuiereB }; // update({data: loQueQuiereB})
  assert.equal(escritoPorB.ubicacion, 'Aula 1', 'así se pierde: vuelve a la vieja');
  assert.notEqual(escritoPorB.ubicacion, loQueHayEnBase.ubicacion);
});

test('avisa cuando el MISMO campo cambió en la base', () => {
  const mio = { ...base, estadoConservacion: 'Malo' };
  const cambios = detectarCambios(base, mio);
  const fresco = { ...base, estadoConservacion: 'Inutilizable' }; // otro lo cambió antes
  const conflictos = detectarConflictos(base, fresco, cambios);
  assert.deepEqual(conflictos, ['estadoConservacion']);
});

test('sin conflicto si el campo sigue igual en la base', () => {
  const mio = { ...base, ubicacion: 'Aula 9' };
  const cambios = detectarCambios(base, mio);
  const conflictos = detectarConflictos(base, { ...base, ubicacion: 'Aula 1' }, cambios);
  assert.deepEqual(conflictos, [], 'cambié un campo que nadie tocó más: no hay conflicto');
});

test('fusionar conserva campos de la base que no conoce el cliente', () => {
  // Campos que agrega otra parte del sistema (por ejemplo, el estado del ciclo
  // de firmas del FC-10) no deben desaparecer.
  const fresco = { ...base, estadoFirma: 'CERRADO', firmas: { firma1: {} } };
  const mio = { ...base, ubicacion: 'Aula 5' }; // no sabe del ciclo de firmas
  const cambios = detectarCambios(base, mio);
  const escrito = fusionarSobreFresco(fresco, cambios, mio);
  assert.equal(escrito.estadoFirma, 'CERRADO', 'el dato ajeno se conserva');
  assert.equal(escrito.ubicacion, 'Aula 5');
});

test('describirCampos arma un texto legible', () => {
  assert.equal(describirCampos(['ubicacion', 'estadoConservacion']), 'ubicación, estado de conservación');
  assert.equal(describirCampos(['campoNuevo']), 'campoNuevo');
  assert.equal(describirCampos([]), '');
});