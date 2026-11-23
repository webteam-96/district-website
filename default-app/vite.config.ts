import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/* Dev-only stand-in for VisitCounter.ashx. `vite` is not IIS, so the real
   handler cannot execute under `npm run dev` and the footer counter would stay
   hidden until deploy. Same URL, same JSON shape, same per-district isolation.
   Counts are in-memory (reset on dev-server restart) — enough to see the UI,
   and no file to leak into a build. `apply: 'serve'` keeps this out of
   production entirely; there the real .ashx answers. */
const visitCounterDev: Plugin = {
  name: 'visit-counter-dev',
  apply: 'serve',
  configureServer(server) {
    const counts: Record<string, number> = {};
    server.middlewares.use('/VisitCounter.ashx', (req, res) => {
      const query = new URLSearchParams((req.originalUrl || '').split('?')[1] || '');
      const district = query.get('district') || '';
      res.setHeader('Content-Type', 'application/json');
      if (!/^[0-9]{3,5}$/.test(district)) {
        res.statusCode = 400;
        res.end('{"message":"district (3-5 digits) is required"}');
        return;
      }
      // Same seed rule as the real handler: a district starts at 5000 + random.
      if (counts[district] === undefined) counts[district] = 5000 + Math.floor(Math.random() * 1000);
      if (query.get('hit') === '1') counts[district] += 1;
      res.end(JSON.stringify({ district, visits: counts[district] }));
    });
  },
};

// SPA build. Production is deployed as a static folder to the same Windows/IIS
// docroot as ApiProxy.ashx + MediaProxy.ashx (see public/). In dev the API is
// hit directly (CORS-open) with the token from .env.local — see src/api/client.ts.
export default defineConfig({
  plugins: [react(), visitCounterDev],
  /* THEMES: built as the 'Default' theme into themes-sample/default/ */
  base: '/default/',
  build: { outDir: '../default', emptyOutDir: true, assetsDir: 'assets/build' },
});
