import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 👈 AGREGAR ESTA LÍNEA (asegura que las rutas a los JS/CSS sean relativas)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});