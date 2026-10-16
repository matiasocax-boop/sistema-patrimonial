import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conSello, debeResyncTotal, fusionarBienes, RESYNC_MS
} from '../src/services/syncBienes.js';

describe('syncBienes', () => {
  it('conSello agrega updated_at ISO sin mutar el payload', () => {
    const s = conSello({ data: { a: 1 } });
    assert.ok(s.updated_at && !Number.isNaN(Date.parse(s.updated_at)));
    assert.equal(s.data.a, 1);
  });

  it('debeResyncTotal: sin meta, sin marca o meta vieja piden total', () => {
    assert.equal(debeResyncTotal(null), true);
    assert.equal(debeResyncTotal({ actualizadoEn: Date.now() }), true);
    assert.equal(debeResyncTotal({ updated_at: 'x', actualizadoEn: Date.now() - RESYNC_MS - 1000 }), true);
  });

  it('debeResyncTotal: meta fresca pide delta', () => {
    assert.equal(debeResyncTotal({ updated_at: '2026-10-01T00:00:00.000Z', actualizadoEn: Date.now() }), false);
  });

  it('fusionarBienes: edita, agrega y saca lo que cambio de dependencia', () => {
    const cache = [
      { id: '1', updated_at: '2026-09-01T00:00:00.000Z', dependencia: 'Rectorado', rotulo: 'A' },
      { id: '2', updated_at: '2026-09-01T00:00:00.000Z', dependencia: 'Rectorado', rotulo: 'B' },
      { id: '3', updated_at: '2026-09-01T00:00:00.000Z', dependencia: 'Rectorado', rotulo: 'C' }
    ];
    const filas = [
      { id: '2', updated_at: '2026-10-15T00:00:00.000Z', data: { dependencia: 'Rectorado', rotulo: 'B2' } },
      { id: '3', updated_at: '2026-10-15T00:00:00.000Z', data: JSON.stringify({ dependencia: 'Otra', rotulo: 'C' }) },
      { id: '4', updated_at: '2026-10-15T00:00:00.000Z', data: { dependencia: 'Rectorado', rotulo: 'D' } }
    ];
    const { lista, maxUpdatedAt } = fusionarBienes(cache, filas, 'Rectorado');
    const porId = new Map(lista.map(b => [b.id, b]));
    assert.equal(porId.get('1')?.rotulo, 'A');
    assert.equal(porId.get('2')?.rotulo, 'B2');
    assert.ok(!porId.has('3'));
    assert.equal(porId.get('4')?.rotulo, 'D');
    assert.equal(lista.length, 3);
    assert.equal(maxUpdatedAt, '2026-10-15T00:00:00.000Z');
  });

  it('fusionarBienes: delta vacio conserva la cache', () => {
    const cache = [{ id: '1', dependencia: 'Rectorado' }];
    const r = fusionarBienes(cache, [], 'Rectorado');
    assert.equal(r.lista.length, 1);
    assert.equal(r.maxUpdatedAt, null);
  });
});
