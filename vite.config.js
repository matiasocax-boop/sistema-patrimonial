import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para desarrollo local y red privada
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // <--- Añade esta línea para permitir conexiones externas por Tailscale
    port: 5173,
    // Proxy para redirigir las peticiones de /api hacia Express (puerto 3001)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});