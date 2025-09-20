import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/visualization',
  build: {
    outDir: '../../../dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
