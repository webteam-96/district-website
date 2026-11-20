import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, extname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';

/*
  One build per theme:  npx vite build --mode <theme>
  Output: ../<theme>/index.html + ../<theme>/assets/app.{js,css}
  The bundle is a classic IIFE script (no type="module", no crossorigin), so the
  page also opens straight from file:// â€” Chrome blocks module scripts there.
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

/*
  Dev server (npm run dev): every theme runs straight from the React source, no build.
  http://localhost:5173/            the list of the 7 themes
  http://localhost:5173/<theme>     each theme's home (ether, prism, orbit, tide, transit, cascade, kinetic)
  http://localhost:5173/<theme>/<page>   its inner pages, e.g. /prism/club-finder, /tide/club?id=12
  Serves ../shared and ../data, and gives each inner page the theme's index.html with <body data-page>.
*/
const PAGES: Record<string, string> = {
  'about': 'about', 'district-committee': 'committee', 'club-finder': 'finder', 'club-projects': 'projects',
  'club-service': 'service', 'calendar': 'calendar', 'newsletters': 'newsletters',
  'club': 'club', 'project': 'project', 'event': 'event', 'dignitary': 'dignitary'
};
const THEMES = ['ether', 'prism', 'orbit', 'tide', 'transit', 'cascade', 'kinetic'];
/* Live API data: scripts/live.mjs runs beside the dev server and answers /live-api (it adds the API key on the
   server side, read from district_website_react/.env.local or RID_API_TOKEN; the key never reaches the browser). */
const LIVE_PORT = 4317;   /* ROW's copy uses 4327, so both can run at once */
let liveServer: ChildProcess | null = null;
const devPages = (): Plugin => ({
  name: 'dev-pages',
  apply: 'serve',
  configureServer(server) {
    if (!liveServer) {
      liveServer = spawn(process.execPath, [resolve(__dirname, 'scripts/live.mjs'), String(LIVE_PORT)], { stdio: 'inherit' });
      const stop = () => { liveServer?.kill(); liveServer = null; };
      process.once('exit', stop);
      server.httpServer?.once('close', stop);
    }
    const TYPES: Record<string, string> = { '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.css': 'text/css' };
    server.middlewares.use(async (req, res, next) => {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rizones District website â€” themes</title>
<body style="font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 16px"><h1>Rizones District website â€” 7 themes</h1><ul>${
          THEMES.map(t => `<li><a href="/${t}/">${t[0].toUpperCase() + t.slice(1)}</a></li>`).join('')}</ul></body>`);
      }
      /* /prism -> /prism/ for every theme (the pages' relative links need the slash) */
      if (THEMES.includes(url.slice(1))) {
        const q = (req.url ?? '').indexOf('?');
        res.statusCode = 301; res.setHeader('Location', url + '/' + (q >= 0 ? req.url!.slice(q) : '')); return res.end();
      }
      const m = url.match(/^\/(shared|data)\/(.+)$/);
      if (m) {
        const file = resolve(__dirname, '..', m[1], m[2]);
        if (!existsSync(file)) { res.statusCode = 404; return res.end(); }
        res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream');
        return res.end(readFileSync(file));
      }
      const p = url.match(/^\/(\w+)\/([\w-]+?)(?:\.html)?$/);   /* /prism/about (and the old /prism/about.html) */
      if (p && THEMES.includes(p[1]) && PAGES[p[2]]) {
        const html = readFileSync(resolve(__dirname, p[1], 'index.html'), 'utf8').replace('<body>', `<body data-page="${PAGES[p[2]]}">`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(await server.transformIndexHtml(url, html));
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
  const theme = mode;
  return {
    root: __dirname,
    base: './',
    publicDir: false,
    plugins: [react(), classicScript(), devPages()],
    server: { proxy: { '/live-api': `http://127.0.0.1:${LIVE_PORT}`, '/live-media': `http://127.0.0.1:${LIVE_PORT}` } },
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
