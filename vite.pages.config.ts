import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
  root: path.resolve('pages'),
  base: '/creitivika-knowledge/',
  plugins: [react()],
  publicDir: path.resolve('public'),
  resolve: { alias: { '@': path.resolve('.') } },
  define: {
    'process.env.NEXT_PUBLIC_STATIC_MODE': JSON.stringify('1'),
    'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify('/creitivika-knowledge'),
  },
  css: { postcss: path.resolve('.') },
  build: { outDir: path.resolve('docs'), emptyOutDir: false },
});
