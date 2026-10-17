// ============================================================================
// Pruebas del ciclo de firmas del FC-10
// ============================================================================
// La maquina de estados es la parte critica del tramite: si permite cerrar un
// acta con una sola firma, el control patrimonial se pierde. Se prueba sin
// Supabase porque fc10Firmas.js es un modulo puro.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ESTADOS_FC10, ESTADO_SIGUIENTE, ESTADO_NUEVO_FC10, estadoInicialFC10, estaPendiente,
  pendienteDeFirma, registrarFirma, registrarAmbasFirmas, habilitaFC10EnBien
} from '../src/utils/fc10Firmas.js';

const USUARIO = { username: 'admin', nombre: 'Administrador General' };
const FECHA = '2026-03-15T10:00:00.000Z';

const actaNueva = () => ({
  id: 'fc-1',
  bienId: 'bien-1',
  funcionarioNombre: 'Rossana',
  funcionarioDoc: '1234567',
  funcionarioCargo: 'Directora',
  jefeInmediatoNombre: 'Juan Perez',
  jefeInmediatoDoc: '7654321',
  jefeInmediatoCargo: 'Decano'
});

test('un FC-10 nuevo arranca esperando la firma del funcionario', () => {
  // saveFC10 escribe estadoFirma explicito al crear; un alta SIEMPRE nace en
  // espera, nunca cerrado. Un registro sin estadoFirma es heredado (cerrado).
  const fc = { ...actaNueva(), estadoFirma: ESTADO_NUEVO_FC10 };
  assert.equal(fc.estadoFirma, ESTADOS_FC10.ESPERA_FIRMA_1);
  const pendiente = pendienteDeFirma(fc);
  assert.equal(pendiente.puesto, 'Funcionario Responsable');
  assert.equal(pendiente.nombre, 'Rossana');
});

test('el ciclo completo es funcionario -> jefe -> cerrado', () => {
  let fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_1 };

  fc = registrarFirma(fc, USUARIO, FECHA);
  assert.equal(fc.estadoFirma, ESTADOS_FC10.ESPERA_FIRMA_2);
  assert.ok(fc.firmas.firma1, 'la firma 1 debe quedar registrada');
  assert.equal(fc.firmas.firma1.nombre, 'Rossana');
  assert.equal(fc.firmas.firma1.registradoPor, 'admin');
  assert.equal(fc.firmas.firma2, undefined, 'la firma 2 todavía no existe');

  fc = registrarFirma(fc, USUARIO, FECHA);
  assert.equal(fc.estadoFirma, ESTADOS_FC10.CERRADO);
  assert.ok(fc.firmas.firma2, 'la firma 2 debe quedar registrada');
  assert.equal(fc.firmas.firma2.nombre, 'Juan Perez');
  assert.equal(fc.fechaCierre, FECHA);
});

test('el bien solo habilita FC-10 cuando el acta cerro con ambas firmas', () => {
  let fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_1 };
  assert.equal(habilitaFC10EnBien(fc), false, 'esperando funcionario');

  fc = registrarFirma(fc, USUARIO, FECHA);
  assert.equal(habilitaFC10EnBien(fc), false, 'esperando jefe');

  fc = registrarFirma(fc, USUARIO, FECHA);
  assert.equal(habilitaFC10EnBien(fc), true, 'cerrado');
});

test('un acta en borrador no es un tramite en curso', () => {
  const fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.BORRADOR };
  assert.equal(estaPendiente(fc), true);
  assert.equal(pendienteDeFirma(fc), null, 'aun no se envio a firmar');
  assert.equal(habilitaFC10EnBien(fc), false);
});

test('firmar un acta ya cerrada no cambia nada', () => {
  const fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.CERRADO };
  const resultado = registrarFirma(fc, USUARIO, FECHA);
  assert.equal(resultado.estadoFirma, ESTADOS_FC10.CERRADO);
  assert.equal(resultado.firmas, undefined, 'no debe inventar firmas');
});

test('registrar firma es puro: no muta el acta original', () => {
  const fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_1 };
  registrarFirma(fc, USUARIO, FECHA);
  assert.equal(fc.estadoFirma, ESTADOS_FC10.ESPERA_FIRMA_1, 'el original queda intacto');
  assert.equal(fc.firmas, undefined);
});

test('las actas anteriores al flujo siguen contando como cerradas', () => {
  const legado = { id: 'fc-viejo', bienId: 'b', funcionarioNombre: 'Alguien' };
  assert.equal(estadoInicialFC10(legado), ESTADOS_FC10.CERRADO);
  assert.equal(estaPendiente(legado), false);
  assert.equal(habilitaFC10EnBien(legado), true, 'no debe romper lo que ya funcionaba');
});

test('no se puede saltar de ESPERA_FIRMA_1 a CERRADO', () => {
  assert.equal(ESTADO_SIGUIENTE[ESTADOS_FC10.ESPERA_FIRMA_1], ESTADOS_FC10.ESPERA_FIRMA_2);
  assert.notEqual(ESTADO_SIGUIENTE[ESTADOS_FC10.ESPERA_FIRMA_1], ESTADOS_FC10.CERRADO);
});

test('registrar ambas firmas cierra el ciclo de una vez', () => {
  // Caso real: el PDF vuelve con las dos firmas puestas y quien lleva el
  // tramite no las ve por separado. Debe cerrar en un solo paso.
  let fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_1 };
  fc = registrarAmbasFirmas(fc, USUARIO, FECHA);

  assert.equal(fc.estadoFirma, ESTADOS_FC10.CERRADO);
  assert.equal(fc.firmas.firma1.nombre, 'Rossana');
  assert.equal(fc.firmas.firma2.nombre, 'Juan Perez');
  assert.equal(habilitaFC10EnBien(fc), true, 'el bien ya cuenta con FC-10');
});

test('registrar ambas firmas funciona desde cualquier etapa pendiente', () => {
  for (const estado of [ESTADOS_FC10.ESPERA_FIRMA_1, ESTADOS_FC10.ESPERA_FIRMA_2, ESTADOS_FC10.BORRADOR]) {
    const fc = registrarAmbasFirmas({ ...actaNueva(), estadoFirma: estado }, USUARIO, FECHA);
    assert.equal(fc.estadoFirma, ESTADOS_FC10.CERRADO, `desde ${estado}`);
    assert.ok(fc.firmas.firma1 && fc.firmas.firma2);
  }
});

test('firmar ambas sobre un acta cerrada no la modifica', () => {
  const fc = { ...actaNueva(), estadoFirma: ESTADOS_FC10.CERRADO };
  const r = registrarAmbasFirmas(fc, USUARIO, FECHA);
  assert.equal(r, fc, 'debe devolver la misma referencia');
});

test('registrar ambas no pisa una firma previa', () => {
  // Si la firma 1 ya estaba registrada antes, se conserva su fecha real.
  const previa = {
    ...actaNueva(),
    estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_2,
    firmas: { firma1: { nombre: 'Rossana', fecha: '2026-01-01T09:00:00.000Z' } }
  };
  const fc = registrarAmbasFirmas(previa, USUARIO, FECHA);
  assert.equal(fc.firmas.firma1.fecha, '2026-01-01T09:00:00.000Z', 'la firma previa se conserva');
  assert.equal(fc.firmas.firma2.fecha, FECHA);
});

test('quien debe firmar se lee del puesto correspondiente', () => {
  const esperandoJefe = { ...actaNueva(), estadoFirma: ESTADOS_FC10.ESPERA_FIRMA_2 };
  const pendiente = pendienteDeFirma(esperandoJefe);
  assert.equal(pendiente.puesto, 'Jefe Inmediato');
  assert.equal(pendiente.nombre, 'Juan Perez');
  assert.equal(pendiente.orden, 2);
});