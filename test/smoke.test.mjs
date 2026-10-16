import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

// Smoke test de render: ejecuta el cuerpo de App (todos los hooks en orden)
// vía SSR. Efectos no corren, pero los ReferenceError/TDZ de render sí
// explotan aquí. Este test habría evitado la pantalla blanca de producción.
describe('smoke de render', () => {
  let server;

  before(async () => {
    // Stubs mínimos de navegador para el render
    const storage = () => {
      const m = new Map();
      return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => m.set(k, String(v)),
        removeItem: (k) => m.delete(k),
        clear: () => m.clear()
      };
    };
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true
    });
    globalThis.window = {
      location: { search: '', origin: 'http://localhost:5173' },
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    const { createServer } = await import('vite');
    const { fileURLToPath } = await import('node:url');
    const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    server = await createServer({
      root,
      logLevel: 'silent',
      server: { middlewareMode: true },
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://localhost:54321'),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key')
      }
    });
  });

  after(async () => {
    if (server) await server.close();
  });

  it('App renderiza sin ReferenceError', async () => {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    const React = (await import('react')).default;
    const { renderToString } = await import('react-dom/server');
    let html = '';
    assert.doesNotThrow(() => {
      html = renderToString(React.createElement(App));
    }, 'el render no debe lanzar');
    assert.ok(html.includes('Iniciar Sesi'), 'muestra el login (sin sesion)');
  });
});
