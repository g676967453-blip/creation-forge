import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'ES2022',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
