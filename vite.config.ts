import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Three entry points: popup, side panel, and the MV3 service worker.
// public/manifest.json is copied to dist/ as-is.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': r('./src') } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: r('./popup.html'),
        sidepanel: r('./sidepanel.html'),
        background: r('./src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
