/* Inner pages for one or more themes:   node scripts/pages.mjs ether [prism …]   (run after vite build)

   1. React:  ../<theme>/about.html …  — copies of the built index.html with <body data-page>;
              the theme's bundle renders the page named there.
   2. HTML:   ../html/<theme>/about.html …  — the same React pages rendered once to static markup,
              with no React: shared/inner.js runs tabs, filters, menu, theme and year. */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(SRC, '..');

/* per theme: what shared/inner.js needs to run the header on a static page */
const CHROME = {
  ether:   { themeKey: 'ether-theme',   defaultTheme: 'dark',  colors: { dark: '#040a1a', light: '#f3f6fb' }, stuck: '.header' },
  prism:   { themeKey: 'prism-theme',   defaultTheme: 'light', colors: { dark: '#070c18', light: '#f6f8fc' }, stuck: 'header' },
  orbit:   { themeKey: 'orbit-theme',   defaultTheme: 'light', colors: { dark: '#120c30', light: '#17103f' }, stuck: 'header' },
  tide:    { themeKey: 'tide-theme',    defaultTheme: 'light', colors: { dark: '#04222a', light: '#062b33' }, stuck: 'header' },
  transit: { themeKey: 'transit-theme', defaultTheme: 'light', colors: { dark: '#0b1437', light: '#17458f' }, stuck: 'header' },
  cascade: { themeKey: 'cascade-theme', defaultTheme: 'light', colors: { dark: '#1a0716', light: '#2b0a25' }, stuck: 'header' },
  kinetic: { themeKey: 'kinetic-theme', defaultTheme: 'light', colors: { dark: '#070a2b', light: '#10134f' }, stuck: 'header' }
};

/* content.js, evaluated the way a browser would, gives the page list */
const loadRotary = () => {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(resolve(OUT, 'shared/content.js'), 'utf8'), ctx);
  return ctx.window.ROTARY;
};

const themes = process.argv.slice(2);
if (!themes.length) { console.error('usage: node scripts/pages.mjs <theme> [...]'); process.exit(1); }

const ROT = loadRotary();
const pages = ROT.pages.list;

/* a Node stand-in for the browser globals the components read while rendering */
const fakeBrowser = () => {
  const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
  const win = globalThis;
  win.window = win;
  win.ROTARY = loadRotary();
  win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  win.localStorage = store();
  win.sessionStorage = store();
  win.innerWidth = 1440; win.innerHeight = 900;
  win.addEventListener = () => {}; win.removeEventListener = () => {};
  win.requestAnimationFrame = () => 0; win.cancelAnimationFrame = () => {};
  win.devicePixelRatio = 1;
};

for (const theme of themes) {
  const base = readFileSync(resolve(OUT, theme, 'index.html'), 'utf8');
  const name = theme[0].toUpperCase() + theme.slice(1);

  /* ---- 1 · React shells ---- */
  for (const p of pages) {
    const html = base
      .replace(/<title>[^<]*<\/title>/, `<title>${p.title} · ${ROT.site.name} — ${name}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${p.lead}">`)
      .replace('<body>', `<body data-page="${p.key}">`);
    writeFileSync(resolve(OUT, theme, p.file), html);
  }

  /* ---- 2 · static HTML ---- */
  const tmp = resolve(SRC, '.ssr-' + theme);   /* one folder per theme, so parallel runs don't collide */
  mkdirSync(tmp, { recursive: true });
  const entry = resolve(tmp, `${theme}.tsx`);
  writeFileSync(entry, `import { renderToStaticMarkup } from 'react-dom/server';
import Inner from '../src/themes/${theme}/Inner';
import { setPage, type PageKey } from '../src/shared/inner';
export const render = (k: PageKey) => { setPage(k); return renderToStaticMarkup(<Inner page={k} />); };
`);
  await build({
    configFile: false, root: SRC, logLevel: 'warn', plugins: [react()],
    ssr: { noExternal: true },
    build: { ssr: entry, outDir: resolve(tmp, 'out', theme), emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'entry.mjs', format: 'es' } } }
  });
  fakeBrowser();
  const { render } = await import(pathToFileURL(resolve(tmp, 'out', theme, 'entry.mjs')).href + `?t=${Date.now()}`);

  const dir = resolve(OUT, 'html', theme);
  mkdirSync(resolve(dir, 'assets'), { recursive: true });
  copyFileSync(resolve(OUT, theme, 'assets/style.css'), resolve(dir, 'assets/style.css'));
  const head = base.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/\s*<script defer src="[^"]*app\.js"><\/script>/, '')
    .replace(/href="[^"]*style\.css"/, 'href="assets/style.css"')
    .replace(/(src|href)="\.\.\/shared\//g, '$1="../../shared/')
    .replace('<script src="../../shared/inner.js"></script>', '<script src="../../shared/inner.js"></script>\n  <script src="../../shared/lenis.min.js"></script>');
  const opts = JSON.stringify(CHROME[theme]);
  for (const p of pages) {
    const body = render(p.key)
      .replace(/(src|href)="\.\.\/shared\//g, '$1="../../shared/')
      .replace(/href="index\.html"/g, `href="../../${theme}/index.html"`)
      /* entrance states that only a component's own script would clear */
      .replace(/ data-intro=""/g, '');
    const html = `<!doctype html>
<html lang="en">
<head>${head
      .replace(/<title>[^<]*<\/title>/, `<title>${p.title} · ${ROT.site.name} — ${name}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${p.lead}">`)}</head>
<body data-page="${p.key}">
  <a class="skip" href="#main">Skip to content</a>
  <!-- Static page: no framework. Content below is sample data from shared/content.js; bind your own. -->
${body}
  <script>RInner.mount(document.getElementById('main')); RInner.chrome(${opts});</script>
</body>
</html>
`;
    writeFileSync(resolve(dir, p.file), html);
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${theme}: ${pages.length} React pages, ${pages.length} HTML pages`);
}
copyFileSync(resolve(SRC, 'node_modules/lenis/dist/lenis.min.js'), resolve(OUT, 'shared/lenis.min.js'));
