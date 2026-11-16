/* Run the React themes with LIVE district data on this computer.

     cd themes-sample/source
     node scripts/live.mjs [port]                (default 4317)
     then open http://localhost:4317/  (add ?district=3011 to any page to show another district)

   It serves themes-sample/ and passes the themes' data requests (GET /live-api?path=/api/...) to the
   district API, adding the API key here. The key is read from district_website_react/.env.local
   (VITE_API_TOKEN) or the RID_API_TOKEN environment variable. It never reaches the browser, a build,
   or the demo site: there, /live-api does not exist and the themes show their sample data instead.

   GET /live-media?url=https://…  serves a public image from the district's media hosts same-origin
   (for anything that draws images onto a canvas). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');                                   /* themes-sample/ */
const ENV = path.resolve(ROOT, '../district_website_react/.env.local');
const API = 'https://rizones45678.org/API';
const MEDIA_HOSTS = /^https:\/\/([a-z0-9-]+\.)*(rotaryindia\.org|rizones45678\.org)\//i;
const PORT = +process.argv[2] || 4317;

const readToken = () => {
  if (process.env.RID_API_TOKEN) return process.env.RID_API_TOKEN.trim();
  try {
    const line = fs.readFileSync(ENV, 'utf8').split(/\r?\n/).find(l => /^\s*VITE_API_TOKEN\s*=/.test(l));
    return line ? line.replace(/^\s*VITE_API_TOKEN\s*=\s*/, '').replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const TOKEN = readToken();

/* the API is slow and a page asks for many things (a club page reads a 5 MB report): keep answers for half an
   hour, so moving between pages during a review stays fast; restart this server to see changes sooner */
const cache = new Map();
const TTL = 30 * 60 * 1000;
const fetchCached = async (key, url, headers) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit;
  const r = await fetch(url, { headers });
  const entry = { at: Date.now(), status: r.status, type: r.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await r.arrayBuffer()) };
  if (r.ok) cache.set(key, entry);
  return entry;
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.json': 'application/json', '.woff2': 'font/woff2' };
const send = (res, status, type, body) => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/live-api') {
      const p = url.searchParams.get('path') || '';
      if (req.method !== 'GET' || !/^\/api\/[\w\-/?=&.%,:+]*$/.test(p)) return send(res, 400, 'text/plain', 'bad request');
      if (!TOKEN) return send(res, 503, 'text/plain', 'no API key on this computer');
      const r = await fetchCached('api ' + p, API + p, { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN });
      return send(res, r.status, r.type, r.body);
    }
    if (url.pathname === '/live-media') {
      const u = url.searchParams.get('url') || '';
      if (req.method !== 'GET' || !MEDIA_HOSTS.test(u)) return send(res, 400, 'text/plain', 'bad request');
      const r = await fetchCached('media ' + u, u, {});
      return send(res, r.status, r.type, r.body);
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!path.resolve(f).startsWith(ROOT)) return send(res, 403, 'text/plain', 'forbidden');
    fs.readFile(f, (e, d) => (e ? send(res, 404, 'text/plain', 'not found') : send(res, 200, TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', d)));
  } catch (e) {
    send(res, 502, 'text/plain', 'upstream error');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Themes: http://localhost:${PORT}/`);
  console.log(TOKEN ? 'Live data: on (API key found on this computer)' : 'Live data: off (no API key found; the themes show their sample data)');
});
