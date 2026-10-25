import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Content scripts can't be ES modules, so this is built on its own as a single classic script.
export default defineConfig({
  publicDir: false,
  resolve: { alias: { '@': r('./src') } },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2022',
    lib: { entry: r('./src/content/index.ts'), formats: ['iife'], name: 'WebPetContent', fileName: () => 'content.js' },
  },
});
