// ============================================================================
// Pruebas de la cola offline
// ============================================================================
// El caso crítico es la pérdida silenciosa: si el usuario edita algo mientras
// el sincronizado está corriendo, esa edición no debe perderse.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  encolarAccion, procesarCola, quitarExitosas, contarPendientes, TIPOS_CONOCIDOS
} from '../src/services/offlineQueue.js';

const accion = (tipo, id, extra = {}) => ({ type: tipo, payload: { id }, ...extra });

test('encolar agrega sin modificar la cola original', () => {
  const original = [accion('SAVE_BIEN', 'a')];
  const nueva = encolarAccion(original, accion('SAVE_BIEN', 'b'));
  assert.equal(original.length, 1, 'el original no se toca');
  assert.equal(nueva.length, 2);
});

test('cada acción encolada recibe una clave única', () => {
  let cola = [];
  for (let i = 0; i < 50; i++) cola = encolarAccion(cola, accion('SAVE_BIEN', `b${i}`));
  const claves = cola.map(a => a.clave);
  assert.equal(new Set(claves).size, 50, 'no puede haber claves repetidas');
});

test('procesar marca como exitosas solo las que el emisor aceptó', async () => {
  const cola = [accion('SAVE_BIEN', 'a'), accion('SAVE_BIEN', 'b')];
  const { exitosas, fallidas } = await procesarCola(cola, async (item) =>
    item.payload.id === 'b' ? { error: new Error('red caída') } : { error: null });
  assert.equal(exitosas.length, 1);
  assert.equal(fallidas.length, 1);
  assert.equal(fallidas[0].payload.id, 'b');
});

test('un tipo desconocido NO se borra (pérdida silenciosa)', async () => {
  const cola = [accion('TIPO_INVENTADO', 'z')];
  const r = await procesarCola(cola, async () => { throw new Error('no debería llamarse'); });
  assert.equal(r.desconocidas.length, 1);
  assert.equal(r.exitosas.length, 0, 'no puede contar como sincronizada');
});

test('un error de red lanza excepción y el ítem se conserva', async () => {
  const cola = [accion('SAVE_BIEN', 'a')];
  const r = await procesarCola(cola, async () => { throw new Error('sin conexión'); });
  assert.equal(r.fallidas.length, 1);
  assert.equal(r.exitosas.length, 0);
});

test('quitarExitosas NO borra lo que se.agregó durante el procesamiento', () => {
  // Este es el caso que antes perdía datos.
  // Estado inicial: una acción en cola.
  const alEmpezar = encolarAccion([], accion('SAVE_BIEN', 'vieja'));

  // Se procesa y esa una acción se sincroniza bien.
  const procesar = async () => {
    const { exitosas } = await procesarCola(alEmpezar, async () => ({ error: null }));
    return exitosas;
  };

  // Mientras corría la red, el usuario (sin conexión) editó OTRO bien y la
  // acción entró en la cola vigente.
  const claveVieja = alEmpezar[0].clave;
  const colaVigente = encolarAccion(alEmpezar, accion('SAVE_BIEN', 'nueva-durante-el-proceso'));

  // Al terminar, el sincronizado escribe: solo debe quitar la vieja.
  const claveNueva = colaVigente.find(a => a.payload.id === 'nueva-durante-el-proceso').clave;
  const finales = quitarExitosas(colaVigente, [claveVieja]);

  assert.equal(finales.length, 1, 'debe quedar solo la acción nueva');
  assert.equal(finales[0].payload.id, 'nueva-durante-el-proceso', 'la acción nueva NO puede perderse');
  assert.ok(claveNueva !== claveVieja);
});

test('quitarExitosas sin claves no modifica nada', () => {
  const cola = [accion('SAVE_BIEN', 'a'), accion('SAVE_BIEN', 'b')];
  assert.equal(quitarExitosas(cola, []).length, 2);
  assert.equal(quitarExitosas(cola, null).length, 2);
  assert.equal(quitarExitosas(cola, undefined).length, 2);
});

test('quitarExitosas no toca las claves que no están en la lista', () => {
  const cola = encolarAccion(encolarAccion([], accion('SAVE_BIEN', 'a')), accion('SAVE_BIEN', 'b'));
  const claveA = cola.find(a => a.payload.id === 'a').clave;
  const finales = quitarExitosas(cola, [claveA]);
  assert.equal(finales.length, 1);
  assert.equal(finales[0].payload.id, 'b');
});

test('cola vacía y entradas inválidas no rompen nada', async () => {
  assert.equal(contarPendientes(null), 0);
  assert.deepEqual(quitarExitosas(null, ['x']), []);
  const r = await procesarCola([], async () => ({ error: null }));
  assert.equal(r.procesadas, 0);
});

test('los tipos conocidos son los que el emisor de Supabase sabe enviar', () => {
  assert.deepEqual(TIPOS_CONOCIDOS, ['SAVE_BIEN', 'DELETE_BIEN', 'SAVE_FC10']);
});