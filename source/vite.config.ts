import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/*
  One build per theme:  npx vite build --mode <theme>
  Output: ../<theme>/index.html + ../<theme>/assets/app.{js,css}
  The bundle is a classic IIFE script (no type="module", no crossorigin), so the
  page also opens straight from file:// — Chrome blocks module scripts there.
*/
const classicScript = (): Plugin => ({
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler: html =>
      html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=')
  }
});

export default defineConfig(({ mode }) => {
  const theme = mode;
  return {
    root: __dirname,
    base: './',
    publicDir: false,
    plugins: [react(), classicScript()],
    build: {
      outDir: resolve(__dirname, '..'),
      emptyOutDir: false,
      assetsDir: `${theme}/assets`,
      modulePreload: false,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: resolve(__dirname, `${theme}/index.html`),
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: `${theme}/assets/app.js`,
          assetFileNames: `${theme}/assets/[name][extname]`
        }
      }
    }
  };
});
