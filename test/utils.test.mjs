import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { numeroALetras } from '../src/utils/numeroLetras.js';
import { extraerCodigoQR } from '../src/utils/qr.js';
import { normalizarBien, tieneValor } from '../src/utils/bienPublico.js';
import { puntuarOpcion, ordenarPorCercania } from '../src/utils/busqueda.js';
import { normalizeStr } from '../src/utils/helpers.js';

describe('numeroALetras', () => {
  it('casos base', () => {
    assert.equal(numeroALetras(0), 'cero');
    assert.equal(numeroALetras(70000), 'setenta mil');
    assert.equal(numeroALetras(1000000), 'un millon');
    assert.equal(
      numeroALetras(5861257),
      'cinco millones ochocientos sesenta y un mil doscientos cincuenta y siete'
    );
  });
});

describe('extraerCodigoQR', () => {
  it('acepta URL, codigo directo y vacio', () => {
    assert.equal(extraerCodigoQR('https://x.vercel.app/?id=ABC123'), 'ABC123');
    assert.equal(extraerCodigoQR('https://x.vercel.app/?bienId=Z9'), 'Z9');
    assert.equal(extraerCodigoQR('  2803-01-02-4655 '), '2803-01-02-4655');
    assert.equal(extraerCodigoQR(''), '');
  });
});

describe('bienPublico', () => {
  it('normalizarBien unifica fila cruda', () => {
    const n1 = normalizarBien({ id: '1', data: JSON.stringify({ rotulo: 'R', valorUnitario: '70000' }) });
    assert.equal(n1?.rotulo, 'R');
    assert.equal(n1?.valorUnitario, '70000');
    assert.equal(normalizarBien([{ id: '2', data: { rotulo: 'S' } }])?.rotulo, 'S');
    assert.equal(normalizarBien(null), null);
    assert.equal(normalizarBien({ id: '3' })?.valorUnitario, '0');
  });

  it('tieneValor detecta cero y nulo', () => {
    assert.equal(tieneValor({ valorUnitario: '70.000' }), true);
    assert.equal(tieneValor({ valorUnitario: '0' }), false);
    assert.equal(tieneValor(null), false);
  });
});

describe('busqueda sin tildes (reclamo de Victor/Victor)', () => {
  it('normalizeStr ignora tildes y mayusculas', () => {
    assert.equal(normalizeStr('Víctor'), normalizeStr('victor'));
    assert.equal(normalizeStr('Fernández Cristaldo'), normalizeStr('fernandez cristaldo'));
  });

  it('puntuarOpcion ordena por cercania', () => {
    const q = normalizeStr('victor');
    assert.ok(puntuarOpcion(normalizeStr('Víctor Ríos'), q) < puntuarOpcion(normalizeStr('Convicto Barrios'), q));
    assert.ok(puntuarOpcion(normalizeStr('Víctor'), q) < puntuarOpcion(normalizeStr('Alvíctor Gómez'), q));
    assert.equal(puntuarOpcion(normalizeStr('otra cosa'), 'zzz'), 3);
  });

  it('ordenarPorCercania devuelve lo mas cercano primero', () => {
    const r = ordenarPorCercania(['Alvíctor Gómez', 'Víctor Ríos'], 'victor').map(o => o.original);
    assert.deepEqual(r, ['Víctor Ríos', 'Alvíctor Gómez']);
  });
});
