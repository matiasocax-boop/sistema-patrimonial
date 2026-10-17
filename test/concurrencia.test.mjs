import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearGuardaGeneracion, crearCerrojo } from '../src/utils/concurrencia.js';

// --- Guarda de generación ---

test('la primera carga arranca vigente', () => {
  const g = crearGuardaGeneracion();
  assert.equal(g.vigente(g.siguiente()), true);
});

test('una carga vieja deja de ser vigente cuando arranca otra', () => {
  const g = crearGuardaGeneracion();
  const vieja = g.siguiente();
  const nueva = g.siguiente();
  assert.equal(g.vigente(nueva), true);
  assert.equal(g.vigente(vieja), false, 'la vieja no debe poder escribir');
});

test('invalidar invalida la carga en curso', () => {
  const g = crearGuardaGeneracion();
  const turno = g.siguiente();
  g.invalidar();
  assert.equal(g.vigente(turno), false);
});

test('reproduce el caso real: cambio de dependencia durante la carga', async () => {
  // Escenario: carga de Rectorado en vuelo, el usuario cambia a Ciencias.
  const g = crearGuardaGeneracion();
  const estado = { dependencia: null, filas: [] };

  const turnoViejo = g.siguiente();
  const cargaVieja = (async () => {
    await new Promise(r => setTimeout(r, 30)); // red lenta
    if (g.vigente(turnoViejo)) {
      estado.dependencia = 'Rectorado';
      estado.filas = [1, 2, 3];
    }
  })();

  const turnoNuevo = g.siguiente();
  const cargaNueva = (async () => {
    await new Promise(r => setTimeout(r, 5)); // llega antes
    if (g.vigente(turnoNuevo)) {
      estado.dependencia = 'Ciencias';
      estado.filas = [9];
    }
  })();

  await Promise.all([cargaVieja, cargaNueva]);

  assert.equal(estado.dependencia, 'Ciencias', 'debe quedar la carga nueva');
  assert.deepEqual(estado.filas, [9], 'los datos viejos no deben pisar los nuevos');
});

test('sin la guarda los datos viejos sí pisarían los nuevos (el bug)', async () => {
  // Contraprueba: demuestra que el escenario es real, no un problema teórico.
  // Sin guarda de generación NO hay ninguna comprobación: cada carga escribe
  // cuando llega, así que gana la ÚLTIMA en llegar, que es la vieja y lenta.
  const estado = { dependencia: null, filas: [] };
  const cargaVieja = (async () => {
    await new Promise(r => setTimeout(r, 30));
    estado.dependencia = 'Rectorado';   // llega última → pisa todo
    estado.filas = [1, 2, 3];
  })();
  const cargaNueva = (async () => {
    await new Promise(r => setTimeout(r, 5));
    estado.dependencia = 'Ciencias';    // llega primera, pero la pisa la otra
    estado.filas = [9];
  })();
  await Promise.all([cargaVieja, cargaNueva]);
  assert.equal(estado.dependencia, 'Rectorado', 'así se rompe: queda la dependencia vieja');
});

// --- Cerrojo de ejecución ---

test('el cerrojo bloquea la segunda ejecución simultánea', async () => {
  let enCurso = 0, maxSimultaneos = 0;
  const conCerrojo = crearCerrojo();
  const lento = conCerrojo(async () => {
    enCurso++;
    maxSimultaneos = Math.max(maxSimultaneos, enCurso);
    await new Promise(r => setTimeout(r, 25));
    enCurso--;
  });
  await Promise.all([lento(), lento(), lento()]);
  assert.equal(maxSimultaneos, 1, 'nunca puede haber dos en paralelo');
});

test('el cerrojo avisa cuando rechaza', async () => {
  const avisos = [];
  const conCerrojo = crearCerrojo({ advertir: (m) => avisos.push(m) });
  const lento = conCerrojo(async () => new Promise(r => setTimeout(r, 25)));
  const p1 = lento();
  await lento(); // segunda, rechazada
  await p1;
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /en curso/i);
});

test('el cerrojo se libera tras un error', async () => {
  const conCerrojo = crearCerrojo();
  const falla = conCerrojo(async () => { throw new Error('boom'); });
  await assert.rejects(falla(), /boom/);
  assert.equal(conCerrojo.ocupado(), false, 'no puede quedar trabado');
  // Y debe poder volver a ejecutarse.
  const ok = conCerrojo(async () => 'bien');
  assert.equal(await ok(), 'bien');
});