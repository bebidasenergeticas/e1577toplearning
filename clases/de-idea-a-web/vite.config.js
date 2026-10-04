import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' → rutas relativas: el sitio funciona en cualquier subcarpeta
// (GitHub Pages /e1577toplearning/de-idea-a-web/, Netlify, Vercel o un servidor local).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notas: resolve(import.meta.dirname, 'notas.html'),
      },
    },
  },
  server: { host: true },
});
