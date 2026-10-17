import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analizarRespaldo, previsualizarRestauracion, armarLote, dividirEnLotes,
  calcularPerdidas, normalizarFila, ORDEN_RESTAURACION, TABLAS_RESTORABLES
} from '../src/services/restore.js';

// Réplica fiel de lo que produce handleExportBackupGeneral: filas crudas con la
// envoltura { id, data }, y usuarios aplanados.
const respaldoReal = () => ({
  metadata: {
    version: '2.2',
    sistema: 'Sistema de Gestión Patrimonial UNP',
    fechaGeneracion: '2026-01-01',
    totalBienes: 2
  },
  bienes: [
    { id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1', dependencia: 'Ciencias' }, updated_at: '2026-01-01T10:00:00Z' },
    { id: 'b2', data: { id: 'b2', rotulo: '1046', ubicacion: 'Aula 2', dependencia: 'Ciencias' }, updated_at: '2026-01-01T10:00:00Z' }
  ],
  fc10: [{ id: 'f1', data: { id: 'f1', bienId: 'b1', estadoFirma: 'CERRADO' } }],
  usuarios: [{ username: 'admin', nombre: 'Admin', cargo: 'admin', dependencia: 'Rectorado' }]
});

test('rechaza un archivo que no es un respaldo', () => {
  assert.equal(analizarRespaldo(null).ok, false);
  assert.equal(analizarRespaldo('texto').ok, false);
  assert.equal(analizarRespaldo([]).ok, false);
  assert.equal(analizarRespaldo({ hola: 'mundo' }).ok, false);
  assert.match(analizarRespaldo({ hola: 'mundo' }).error, /metadata\.sistema/);
});

test('rechaza un respaldo sin filas válidas', () => {
  const r = analizarRespaldo({ metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' } });
  assert.equal(r.ok, false);
  assert.match(r.error, /ninguna fila/i);
});

test('desenvuelve la envoltura {id, data} que produce el respaldo real', () => {
  const r = analizarRespaldo(respaldoReal());
  assert.equal(r.ok, true);
  assert.equal(r.tablas.bienes.length, 2);
  // El objeto de negocio, no la fila cruda.
  assert.equal(r.tablas.bienes[0].rotulo, '1045');
  assert.equal(r.tablas.bienes[0].dependencia, 'Ciencias');
  assert.equal(r.tablas.bienes[0].id, 'b1');
  assert.equal(r.tablas.bienes[0].data, undefined, 'la envoltura no debe quedar adentro');
});

test('el id de la columna manda sobre el del JSON', () => {
  // Si divergieran, el .eq('id', ...) escribiría sobre la fila equivocada.
  const r = analizarRespaldo({
    metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' },
    bienes: [{ id: 'idDeColumna', data: { id: 'idDelJson', rotulo: '1045' } }]
  });
  assert.equal(r.tablas.bienes[0].id, 'idDeColumna');
});

test('acepta data serializado como texto', () => {
  const r = analizarRespaldo({
    metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' },
    bienes: [{ id: 'b1', data: '{"rotulo":"1045"}' }]
  });
  assert.equal(r.ok, true);
  assert.equal(r.tablas.bienes[0].rotulo, '1045');
});

test('usuarios se leen planos y conservan la dependencia', () => {
  const r = analizarRespaldo(respaldoReal());
  assert.equal(r.tablas.usuarios[0].username, 'admin');
  assert.equal(r.tablas.usuarios[0].dependencia, 'Rectorado');
});

test('advierte CRÍTICO si el respaldo perdió la dependencia de los usuarios', () => {
  // Es el archivo v2.1: guardar 'rol' (columna inexistente) y dropear dependencia.
  // Restaurarlo sin más dejaría a todas las cuentas sin inventario.
  const r = analizarRespaldo({
    metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' },
    usuarios: [{ username: 'admin', nombre: 'Admin', cargo: 'admin' }]
  });
  assert.equal(r.ok, true);
  assert.ok(r.avisos.some(a => /CRÍTICO/.test(a) && /dependencia/.test(a)), r.avisos.join(' | '));
});

test('ese aviso no aparece si al menos un usuario trae dependencia', () => {
  const r = analizarRespaldo({
    metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' },
    usuarios: [{ username: 'a', dependencia: 'Ciencias' }, { username: 'b' }]
  });
  assert.equal(r.avisos.some(a => /CRÍTICO/.test(a)), false);
});

test('nunca escribe una contraseña en usuarios', () => {
  // La clave vive en Supabase Auth; meterla en la tabla no la reinstala y sería
  // guardar un secreto en un archivo que viaja por correo.
  const def = TABLAS_RESTORABLES.find(t => t.clave === 'usuarios');
  const fila = normalizarFila({ username: 'a', cargo: 'admin', password: 'secreto', password_hash: 'x' }, def);
  assert.equal(fila.password, undefined);
  assert.equal(fila.password_hash, undefined);
  assert.equal(fila.cargo, 'admin');
});

test('cuenta las filas de todas las tablas', () => {
  const r = analizarRespaldo(respaldoReal());
  assert.equal(r.totalFilas, 4, '2 bienes + 1 acta + 1 usuario');
  assert.equal(r.tablas.auditoria.length, 0, 'las ausentes van vacías, no undefined');
  assert.ok(Array.isArray(r.tablas.notificaciones));
});

test('descarta filas ilegibles y lo avisa', () => {
  const crudo = respaldoReal();
  crudo.bienes.push(null, 'basura', [1, 2], { id: 'b3', data: null, rotulo: 'sin data' });
  const r = analizarRespaldo(crudo);
  assert.equal(r.tablas.bienes.length, 2, 'solo quedan las recuperables');
  assert.ok(r.avisos.some(a => /Bienes: .*descartadas/.test(a)), r.avisos.join(' | '));
});

test('descarta filas sin clave primaria y lo avisa', () => {
  const crudo = respaldoReal();
  crudo.bienes.push({ data: { rotulo: 'sin id' } });
  const r = analizarRespaldo(crudo);
  assert.equal(r.tablas.bienes.length, 2);
  assert.ok(r.avisos.some(a => /sin "id"/i.test(a)));
});

test('normaliza la clave primaria a texto para comparar sin falsos desajustes', () => {
  const r = analizarRespaldo({
    metadata: { sistema: 'Sistema de Gestión Patrimonial UNP' },
    usuarios: [{ username: 123, nombre: 'A' }]
  });
  assert.equal(r.tablas.usuarios[0].username, '123');
});

test('previsualización distingue nuevas de actualizadas', () => {
  const r = analizarRespaldo(respaldoReal());
  const actuales = { bienes: [{ id: 'b1', rotulo: '1045', ubicacion: 'Aula 9', dependencia: 'Ciencias' }] };
  const p = previsualizarRestauracion(r.tablas, actuales);

  assert.equal(p.bienes.nuevas, 1, 'b2 no existe hoy');
  assert.equal(p.bienes.actualizadas, 1, 'b1 cambia la ubicación');
  assert.equal(p.bienes.sinCambio, 0);
  assert.deepEqual(p.bienes.cambios[0].campos, ['ubicacion']);
});

test('previsualización no inventa cambios por el orden de las claves', () => {
  // Mismo dato, distinto orden de claves en el JSON: no es un cambio.
  const r = analizarRespaldo(respaldoReal());
  const actuales = { bienes: [{ dependencia: 'Ciencias', ubicacion: 'Aula 1', rotulo: '1045', id: 'b1' }] };
  const p = previsualizarRestauracion(r.tablas, actuales);
  assert.equal(p.bienes.sinCambio, 1);
  assert.equal(p.bienes.actualizadas, 0);
});

test('previsualización marca las tablas sin nada que hacer', () => {
  const r = analizarRespaldo(respaldoReal());
  const p = previsualizarRestauracion(r.tablas, { bienes: r.tablas.bienes });
  assert.equal(p.bienes.hayCambios, false);
  assert.equal(p.auditoria.entrantes, 0);
  assert.equal(p.auditoria.hayCambios, false);
});

test('armarLote devuelve la forma {id, data} que espera la tabla', () => {
  const lote = armarLote('bienes', [{ id: 'b1', rotulo: '1045' }]);
  assert.equal(lote.tabla, 'bens');
  assert.equal(lote.esPlana, false);
  assert.equal(lote.filas.length, 1);
  assert.equal(lote.filas[0].id, 'b1');
  assert.equal(lote.filas[0].data.rotulo, '1045');
});

test('armarLote sella updated_at con AHORA, no con el del archivo', () => {
  // Si se usara el sello viejo, la sincronización delta de los clientes abiertos
  // no vería el cambio hasta la próxima descarga total (24 h).
  const lote = armarLote('bienes', [{ id: 'b1', rotulo: '1045' }], '2026-10-17T12:00:00Z');
  assert.equal(lote.filas[0].updated_at, '2026-10-17T12:00:00Z');
  assert.equal(lote.filas[0].data.updated_at, undefined, 'el sello no se mete en el JSON del bien');
});

test('armarLote de usuarios aplana y conserva la dependencia', () => {
  const lote = armarLote('usuarios', [{ username: 'admin', cargo: 'admin', dependencia: 'Rectorado' }]);
  assert.equal(lote.tabla, 'usuarios');
  assert.equal(lote.esPlana, true);
  assert.equal(lote.filas[0].dependencia, 'Rectorado');
  assert.equal(lote.filas[0].username, 'admin');
  assert.ok(lote.filas[0].updated_at, 'también se sella para el delta');
});

test('calcularPerdidas detecta lo que se perdería en modo reemplazo', () => {
  const entrantes = [{ id: 'b1' }, { id: 'b2' }];
  const actuales = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }];
  assert.deepEqual(calcularPerdidas(entrantes, actuales, 'id'), ['b3']);
  assert.deepEqual(calcularPerdidas(entrantes, [], 'id'), []);
});

test('dividirEnLotes parte sin perder ni duplicar filas', () => {
  const filas = Array.from({ length: 1201 }, (_, i) => ({ id: i }));
  const lotes = dividirEnLotes(filas, 500);
  assert.equal(lotes.length, 3);
  assert.equal(lotes[0].length, 500);
  assert.equal(lotes[2].length, 201);
  assert.equal(lotes.flat().length, 1201);
  assert.deepEqual(lotes.flat().map(f => f.id), filas.map(f => f.id));
});

test('dividirEnLotes con lista vacía no inventa lotes', () => {
  assert.deepEqual(dividirEnLotes([], 500), []);
  assert.deepEqual(dividirEnLotes(null, 500), []);
});

test('el orden pone las tablas base antes que las que las referencian', () => {
  const pos = (c) => ORDEN_RESTAURACION.indexOf(c);
  assert.ok(pos('usuarios') < pos('bienes'));
  assert.ok(pos('funcionarios') < pos('bienes'));
  assert.ok(pos('estructuras') < pos('fc10'));
  assert.ok(pos('bienes') < pos('fc10'));
  assert.equal(pos('auditoria'), ORDEN_RESTAURACION.length - 1, 'auditoría al final');
});

test('toda tabla restaurable declara su tabla real y su clave primaria', () => {
  for (const t of TABLAS_RESTORABLES) {
    assert.ok(t.tabla, `${t.clave} sin tabla`);
    assert.ok(t.pk, `${t.clave} sin clave primaria`);
    assert.ok(['data', 'plana'].includes(t.envoltura), `${t.clave} con envoltura desconocida`);
  }
  // Coherencia con el formato real del respaldo: bienes vive en 'bens'.
  assert.equal(TABLAS_RESTORABLES.find(t => t.clave === 'bienes').tabla, 'bens');
  assert.equal(TABLAS_RESTORABLES.find(t => t.clave === 'usuarios').envoltura, 'plana');
});