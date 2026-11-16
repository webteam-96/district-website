/* Save the district's REAL data for the public demo (client, 2026-11-16: "don't want dummy data").

     1. node scripts/live.mjs 4317          (in another window: it holds the API key; this script never sees it)
     2. node scripts/snapshot.mjs           (about 10-15 minutes)
     3. build the themes (pages.mjs bakes the snapshot into the plain-HTML pages) and push

   It runs the themes' own live loaders (src/shared/live.ts) in Node, against the local server, and writes what
   they map — never the key — to themes-sample/data/:
     data/page/<page>.json      the changes a page's live data makes to window.ROTARY (a patch over shared/content.js)
     data/<kind>/<id>.json      one item per detail page: every club, the listed projects, the events, every
                                committee member; data/dignitary.json holds the RI President and the Governor
     data/index.json            the date, the pages and the saved ids
   Where there is no live API (the demo), live.ts reads these instead (its "snapshot" mode).
   Projects: those on Club Projects / Club Service plus each club's latest few; a club page lists only saved ones.
   Internal: node scripts/snapshot.mjs --projects <i>/<n>   saves one slice of the project list (run in parallel). */
import { createServer } from 'vite';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const SRC = resolve(dirname(SCRIPT), '..');
const OUT = resolve(SRC, '..');
const DATA = resolve(OUT, 'data');
const LIVE = 'http://127.0.0.1:4317';
const PER_CLUB = 6;                  /* each club's latest projects saved beside the ones on Club Projects */
const SLICES = 4;                    /* project items are fetched by this many processes at once */
const slice = (process.argv.find(a => a.startsWith('--projects=')) || '').slice(11);

/* ---------- a Node stand-in for the browser (as the live loaders expect it) ---------- */
const realFetch = globalThis.fetch;
const sample = () => { const ctx = { window: {} }; vm.runInNewContext(readFileSync(resolve(OUT, 'shared/content.js'), 'utf8'), ctx); return ctx.window.ROTARY; };
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
globalThis.window = globalThis;
globalThis.sessionStorage = store(); globalThis.localStorage = store();
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.fetch = (u, o) => realFetch(new URL(u, LIVE + globalThis.location.pathname), o);
const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };
globalThis.DOMParser = class { parseFromString(s) { return { body: { textContent: String(s).replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m) } }; } };
/* an image's pixel size from its first bytes (JPEG, PNG, GIF, WebP); only the first 128 KB are downloaded */
const size = b => {
  if (b.length > 24 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const f = b.toString('ascii', 12, 16);
    if (f === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (f === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
    if (f === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
};
const bytes = async (u, range) => { const r = await realFetch(u, range ? { headers: { Range: 'bytes=0-131071' } } : {}); return r.ok ? Buffer.from(await r.arrayBuffer()) : null; };
globalThis.Image = class {
  naturalWidth = 0; naturalHeight = 0; onload = null; onerror = null; #src = '';
  get src() { return this.#src; }
  set src(u) {
    this.#src = u;
    (async () => {
      let b = await bytes(u, true), s = b && size(b);
      if (!s) { b = await bytes(u, false); s = b && size(b); }
      if (!s) throw new Error('not an image');
      [this.naturalWidth, this.naturalHeight] = s; this.onload?.();
    })().catch(() => this.onerror?.());
  }
};
const quiet = console.info;
console.info = () => {};                        /* the loaders' "[live] …" lines */

const vite = await createServer({ root: SRC, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
/* a fresh window.ROTARY and freshly evaluated modules, so one page's data never leaks into the next */
const fresh = async () => {
  globalThis.ROTARY = sample();
  vite.moduleGraph.invalidateAll();
  return (await vite.ssrLoadModule('/src/shared/live.ts')).loadLive;
};
const go = async (loadLive, key, path) => {
  globalThis.location = new URL(LIVE.replace('127.0.0.1', 'localhost') + '/prism/' + path);
  globalThis.document = { title: 'Page · Rotary District 3141 — Prism', body: { dataset: { page: key } } };
  await loadLive(key);
  return globalThis.ROTARY;
};
const write = (rel, data) => { const f = resolve(DATA, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(data)); };
const isRow = v => !!v && typeof v === 'object' && !Array.isArray(v);
const diff = (a, b) => {
  if (isRow(a) && isRow(b)) { const o = {}; for (const k of Object.keys(b)) { const d = diff(a[k], b[k]); if (d !== undefined) o[k] = d; } return Object.keys(o).length ? o : undefined; }
  return JSON.stringify(a) === JSON.stringify(b) ? undefined : b;
};
const pool = async (list, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) await fn(list[i++]); })); };

/* ---------- a slice of the projects (child process) ---------- */
if (slice) {
  const [k, n] = slice.split('/').map(Number);
  const ids = JSON.parse(readFileSync(resolve(DATA, '.projects.json'), 'utf8')).filter((_, i) => i % n === k);
  const loadLive = await fresh();
  let ok = 0;
  for (const id of ids) {
    const R = await go(loadLive, 'project', `project.html?id=${id}`);
    const item = R.pages.project.item;
    if (item && String(item.id) === String(id)) { write(`project/${id}.json`, item); ok++; }
  }
  quiet(`projects slice ${k}/${n}: ${ok} of ${ids.length}`);
  await vite.close();
  process.exit(0);
}

/* ---------- main ---------- */
const t0 = Date.now();
const ping = await realFetch(LIVE + '/live-api?path=' + encodeURIComponent('/api/Districts?page=1&pageSize=1')).catch(() => null);
if (!ping || !ping.ok) { quiet('The live server is not answering at ' + LIVE + ' — start it first: node scripts/live.mjs 4317'); process.exit(1); }
rmSync(DATA, { recursive: true, force: true });
mkdirSync(DATA, { recursive: true });

/* 1 · the pages: what each one's live data changes */
const files = Object.fromEntries(sample().pages.list.map(p => [p.key, p.file]));
const examples = { club: '18', project: '76179', event: 'c-15-38634', member: '1160069' };
const PAGES = {
  home: 'index.html', about: files.about, committee: files.committee, finder: files.finder, projects: files.projects, service: files.service,
  calendar: files.calendar, newsletters: files.newsletters,
  club: `${files.club}?id=${examples.club}`, project: `${files.project}?id=${examples.project}`, event: `${files.event}?id=${examples.event}`,
  dignitary: `${files.dignitary}?type=president`, member: `${files.member}?id=${examples.member}`
};
const saved = {};
for (const [key, path] of Object.entries(PAGES)) {
  const loadLive = await fresh();
  const R = await go(loadLive, key, path);
  const patch = diff(sample(), R) || {};
  if (patch.pages?.[key]) { delete patch.pages[key].item; if (examples[key]) patch.pages[key].example = examples[key]; }
  if (patch.calendar) delete patch.calendar.today;     /* "today" stays the visitor's own day (content.js), not this one */
  write(`page/${key}.json`, patch);
  saved[key] = R;
  quiet(`page ${key}: ${(JSON.stringify(patch).length / 1024).toFixed(0)} KB`);
}

/* 2 · the items, one loader at a time (they share window.ROTARY) */
let loadLive = await fresh();
const index = { date: new Date().toISOString().slice(0, 10), pages: Object.keys(PAGES), club: [], project: [], event: [], member: [], dignitary: false };
const item = async (key, path, want) => { const R = await go(loadLive, key, path); const it = R.pages[key].item; return it && (!want || String(it.id) === String(want)) ? it : null; };

const clubIds = saved.finder.clubs.list.map(c => String(c.id));
const clubs = {};
for (const id of clubIds) { const it = await item('club', `${files.club}?id=${id}`, id); if (it) clubs[id] = it; }
quiet(`clubs: ${Object.keys(clubs).length} of ${clubIds.length}`);

const events = [...new Map([...saved.home.calendar.entries, ...saved.calendar.calendar.entries].filter(e => e.id && (e.type === 'club' || e.type === 'district')).map(e => [e.id, e])).keys()];
for (const id of events) { const it = await item('event', `${files.event}?id=${encodeURIComponent(id)}`, id); if (it) { write(`event/${id}.json`, it); index.event.push(id); } }
quiet(`events: ${index.event.length} of ${events.length}`);

const members = [...new Map(saved.committee.pages.committee.groups.flatMap(g => g.members).filter(m => m.id).map(m => [String(m.id), m])).values()];
for (const m of members) {
  const q = new URLSearchParams({ id: m.id, name: m.name, role: m.role, club: m.club }).toString();
  const it = await item('member', `${files.member}?${q}`, m.id);
  if (it) { write(`member/${m.id}.json`, it); index.member.push(String(m.id)); }
}
quiet(`members: ${index.member.length} of ${members.length}`);

const dig = {};
for (const type of ['president', 'dg']) { const R = await go(loadLive, 'dignitary', `${files.dignitary}?type=${type}`); const it = R.pages.dignitary.item?.[type]; if (it) dig[type] = it; }
if (dig.president || dig.dg) { write('dignitary.json', dig); index.dignitary = true; }
quiet(`dignitaries: ${Object.keys(dig).join(', ') || 'none'}`);

/* 3 · the projects: on Club Projects / Club Service, plus each club's latest few — fetched in parallel slices */
const want = new Set([...saved.projects.pages.projects.list, ...saved.service.pages.projects.list].map(p => String(p.id)));
for (const c of Object.values(clubs)) for (const p of (c.projects || []).slice(0, PER_CLUB)) want.add(String(p.id));
write('.projects.json', [...want]);
await vite.close();
await Promise.all(Array.from({ length: SLICES }, (_, k) => new Promise((ok, no) => {
  const child = spawn(process.execPath, [SCRIPT, `--projects=${k}/${SLICES}`], { cwd: SRC, stdio: ['ignore', 'inherit', 'inherit'] });
  child.on('exit', c => (c === 0 ? ok() : no(new Error(`slice ${k} exited ${c}`))));
})));
rmSync(resolve(DATA, '.projects.json'));
index.project = existsSync(resolve(DATA, 'project')) ? readdirSync(resolve(DATA, 'project')).map(f => f.replace(/\.json$/, '')) : [];
const have = new Set(index.project);

/* a club page lists only projects that open (the rest are counted in its figures) */
for (const [id, c] of Object.entries(clubs)) {
  c.projects = (c.projects || []).filter(p => have.has(String(p.id)));
  write(`club/${id}.json`, c);
  index.club.push(id);
}
write('index.json', index);
const kb = f => { let s = 0; const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = resolve(d, e.name); if (e.isDirectory()) walk(p); else s += readFileSync(p).length; } }; walk(f); return (s / 1048576).toFixed(1) + ' MB'; };
quiet(`saved ${index.date}: ${index.pages.length} pages, ${index.club.length} clubs, ${index.project.length} projects, ${index.event.length} events, ${index.member.length} members, dignitaries ${index.dignitary} — ${kb(DATA)} in ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(0);
