/* Live district data for the React themes, on this computer only.

   scripts/live.mjs serves the themes and answers GET /live-api?path=/api/… from the district API (it adds the
   API key there; the key never reaches the browser or a build). loadLive(page) asks for what that page shows,
   maps the answers into window.ROTARY in the shapes the themes already read, and resolves; main.tsx renders
   after it. Anywhere else (the public demo, file://, any other server) it resolves at once and the sample in
   shared/content.js stays. So does whatever has not arrived after CAP ms.

   The calls and the media-path workarounds follow the production site (district_website_react/src/api/client.ts,
   pages/Home/homeData.ts, HomeCalendar.tsx, clubData.ts, DistrictCommittee/, Projects/). Calls that can answer
   404 are avoided: the browser reports every failed request as a console error. */
import { R, monogram, monthLabel, parseISO, shortDate, toISO, type Bulletin, type CalEntry, type Letter, type Person, type Photo, type Rotary } from './rotary';
import { totals, type Member, type PageKey, type Pages, type Project } from './inner';
import { type DetailPages, type EventDetail, type Fact, type Leader } from './detail';

type Row = Record<string, any>;
type Apply = () => void;
interface Year { id?: number; label: string }
interface Ctx { num: string; id: number; years: Year[]; cur: string; all: Year[] }   /* years: the ones loaded (this Rotary year, the next one); all: the year menu */

const P = (R as unknown as { pages: Pages }).pages;
const D = P as unknown as DetailPages;              /* the detail pages' item slots (shared/detail.tsx) */
const CAP = 30000;                                   /* ms: what has not arrived by then stays sample */
let until = 0;                                      /* performance.now() at which loadLive stops waiting */
const MEDIA = 'https://rizones45678.org/API';        /* /Documents/… and /uploads/… live under the API host */
const DEFAULT = { num: '3141', id: 490 };
const LOGOS: Record<string, string> = { '3141': 'https://rotaryindia.org/Documents/WebsiteData/Group31093/LOGO/UpperLogo030520240653590088347PM.png' };
/* the logo is blue artwork for light backgrounds; on dark ones the same file shows white (the #reversed rule) */
const setLogo = (src: string) => {
  if (!src) return;
  R.brand.logo = src;
  R.brand.logoReversed = src + '#reversed';
  if (!document.getElementById('logo-rev')) document.head.insertAdjacentHTML('beforeend', '<style id="logo-rev">img[src$="#reversed"]{filter:brightness(0) invert(1)}</style>');
};
const KEY = 'rid-dev-district';                      /* production's session key for ?district= */
const PRESIDENT_CLUB = 34297;                        /* production's always-serviceable club; the RI President is the same for every club */
/* production's DISTRICT_GROUPS: banners and Governor's letters sit under the district's website group */
const GROUPS: Record<string, string> = {
  2981: '31689', 2982: '31157', 3000: '31690', 3011: '31091', 3012: '31092', 3020: '32020', 3030: '31085', 3040: '31370',
  3053: '32021', 3055: '34307', 3056: '34308', 3060: '31234', 3070: '31525', 3080: '31709', 3090: '31115', 3100: '31680',
  3110: '31116', 3120: '31691', 3131: '31683', 3132: '31552', 3141: '31093', 3142: '31072', 3150: '31138', 3160: '31096',
  3170: '31685', 3181: '31303', 3182: '31094', 3191: '34309', 3192: '34310', 3203: '31095', 3204: '33415', 3205: '35015',
  3206: '34991', 3211: '31681', 3212: '31687', 3231: '31114', 3233: '31682', 3234: '34732', 3240: '31113', 3250: '31088',
  3261: '31684', 3262: '31375', 3291: '31083'
};
/* the API's avenue keys → the themes' six */
const AVENUE: Record<string, string> = {
  club_service: 'club', community_service: 'community', vocational_service: 'vocational',
  international_service: 'international', new_generation_service: 'youth', public_image_initiative: 'image'
};

/* ---------- small helpers ---------- */
const info = (m: string) => console.info('[live] ' + m);
const list = (r: unknown): Row[] => (Array.isArray(r) ? r : Array.isArray((r as Row)?.items) ? (r as Row).items : []);
const clean = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();
const isoDay = (s: unknown) => /^\d{4}-\d{2}-\d{2}/.exec(String(s ?? ''))?.[0] ?? '';
const hhmm = (s: unknown) => { const t = /T(\d{2}):(\d{2})/.exec(String(s ?? '')); return t && t[1] + t[2] !== '0000' ? `${t[1]}:${t[2]}` : undefined; };
const yearOf = (d: Date) => { const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${String((y + 1) % 100).padStart(2, '0')}`; };
const fileName = (p: unknown) => String(p ?? '').split(/[\\/]/).pop() ?? '';
/* an API media path as a URL that also works unquoted in CSS url() (file names can hold double spaces: only trim) */
const media = (p: unknown) => {
  const s = String(p ?? '').trim();
  if (!s) return '';
  const u = /^https?:\/\//i.test(s) ? s : MEDIA + (s.startsWith('/') ? '' : '/') + s;
  return /%[0-9a-f]{2}/i.test(u) ? u : encodeURI(u).replace(/[()']/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
};
/* an admin-typed link as a URL ("www.club.org" → "https://www.club.org"), '' when none */
const link = (u: unknown) => { const l = String(u ?? '').trim(); return l ? (/^(https?:)?\/\//i.test(l) ? l : 'https://' + l) : ''; };
/* a banner's or an ad's own link, or its uploaded document (production's clickThroughUrl) */
const clickThrough = (r: Row) => link(r.linkUrl) || (r.documentPath ? media(r.documentPath) : null);
const portrait = (src: string, name: string): Photo | null => (src ? { src, w: 480, h: 600, alt: `Portrait of ${name}` } : null);
const tba = (role: string, term: string): Person => ({ name: 'To be announced', role, term, bio: '', photo: null });
/* production's isDistrictGovernor, plus "Lt Governor" */
const isDG = (d: unknown) => { const s = clean(d).toLowerCase(); return s.includes('governor') && !/governor[’'`]s|\blt\b|vice|deputy|assistant|asst|acting|nominee|elect|past|nominate|counsel|mentor|advis|aide|secretary|chair|coordinator|trainer/.test(s); };
/* admin HTML as plain text, a line for each paragraph */
const lines = (html: unknown) => (new DOMParser().parseFromString(String(html ?? '').replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, '$&\n'), 'text/html').body.textContent ?? '')
  .split('\n').map(clean).filter(Boolean);
/* …run together; a paragraph ends a sentence even when the editor left off its full stop */
const textOf = (html: unknown) => lines(html).map(s => (/[.!?:…"”’)]$/.test(s) ? s : s + '.')).join(' ');
/* …or kept as paragraphs, a blank line between them (detail.tsx paras() splits them again) */
const parasOf = (html: unknown) => lines(html).join('\n\n');
/* the admin's plain text (descriptions, introductions): line breaks kept as typed (blank line = new paragraph), so
   detail.tsx paras() can tell a sentence wrapped mid-line or a typed list from a new paragraph */
const plain = (t: unknown) => String(t ?? '').replace(/\r\n?/g, '\n').split('\n')
  .map(s => s.replace(/[ \t ]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
/* the first whole sentences of a long text, about `max` characters (bios and project reports are written at length) */
const ABBR = /\b(?:Dr|Mr|Mrs|Ms|Rtn|St|Lt|Col|Capt|Brig|Prof|Smt|Shri|No|Jr|Sr)\.$/;
const lead = (text: string, max: number) => {
  if (text.length <= max) return text;
  let out = '';
  for (const s of text.split(/(?<=[.!?])\s+(?=[A-Z“"‘(])/)) {
    if (out && out.length + 1 + s.length > max && !ABBR.test(out)) break;
    out = out ? `${out} ${s}` : s;
  }
  if (out.length <= max * 1.4) return out;
  const cut = out.lastIndexOf(' ', max);
  return out.slice(0, cut > 0 ? cut : max).replace(/[\s,;:–-]+$/, '') + '…';
};
/* the real size of an image, and proof that it loads (banners, ads) */
const probe = (src: string, alt: string) => new Promise<Photo | null>(done => {
  const img = new Image();
  img.onload = () => done({ src, w: img.naturalWidth, h: img.naturalHeight, alt });
  img.onerror = () => done(null);
  img.src = src;
});
/* a gallery photo's real size, as soon as the browser knows it (long before a large file has arrived); a dead file
   → null, and one that has not told its size within 3 s keeps w×h (so a slow photo never costs the page its data) */
const sized = (src: string, alt: string, w = 1200, h = 900) => new Promise<Photo | null>(resolve => {
  if (!src) return resolve(null);
  let over = false;
  const done = (p: Photo | null) => { over = true; resolve(p); };
  const img = new Image(), t0 = performance.now();
  const tick = () => {
    if (over) return;
    if (img.naturalWidth) done({ src, w: img.naturalWidth, h: img.naturalHeight, alt });
    else if (performance.now() - t0 > 3000) done({ src, w, h, alt });
    else setTimeout(tick, 40);
  };
  img.onerror = () => done(null);
  img.src = src;
  tick();
});
/* fn over every item, at most n at a time (125 clubs must not mean 125 requests at once); a failure skips its item */
const pool = <T>(items: T[], n: number, fn: (x: T) => Promise<unknown>) => {
  let i = 0;
  return Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]).catch(() => {}); }));
};
/* resolves a moment before loadLive stops waiting: a job that gathers many small answers hands over what it has */
const lapse = () => new Promise<void>(r => setTimeout(r, Math.max(0, until - performance.now() - 300)));
/* a phone number as shown and as dialled: "+91 90047 62626" / "+919004762626" (others as the member typed them) */
const dial = (num: unknown, code: unknown = '+91') => {
  const s = clean(num), d = s.replace(/\D/g, ''), cc = clean(code) || '+91';
  const ten = cc !== '+91' ? d : d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  if (!d) return null;
  return cc === '+91' && ten.length === 10 ? { phone: `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`, tel: '+91' + ten }
    : { phone: s.startsWith('+') ? s : `${cc} ${s}`, tel: (s.startsWith('+') ? s : cc + s).replace(/[^\d+]/g, '') };
};
/* "PDP Park,, Mumbai" + "Mumbai" + "Maharashtra" → "PDP Park, Mumbai, Maharashtra": tidy commas, and a part already said is left out */
const places = (parts: unknown[]) => parts.map(p => clean(p).replace(/\s*,[\s,]*/g, ', ').replace(/^, |, $/g, ''))
  .filter((s, i, a) => s && !a.slice(0, i).some(p => p.toLowerCase().includes(s.toLowerCase()))).join(', ');
/* "DISEASE PREVENTION AND TREATMENT" → "Disease prevention and treatment" (mixed case stays as typed) */
const sentence = (s: string) => (/[a-z]/.test(s) ? s : s.charAt(0) + s.slice(1).toLowerCase());
/* an object without its empty fields, or null when none is left (contacts) */
const filled = <T extends Record<string, string>>(o: T): Partial<T> | null => { const e = Object.entries(o).filter(([, v]) => v); return e.length ? (Object.fromEntries(e) as Partial<T>) : null; };
/* label and value pairs; a value that repeats its label ("Zone" "Zone 4") keeps only the rest ("4"), as themes print both */
const facts = (pairs: [string, string][]): Fact[] => pairs.filter(([, v]) => v).map(([label, value]) => {
  const rest = value.replace(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[\\s:–—-]*`, 'i'), '').trim();
  return { label, value: rest || value };
});
const dated = (s: unknown) => { const d = isoDay(s); return d > '1900' ? shortDate(d) : ''; };
/* the page's query string, read exactly as detail.tsx reads it: a detail job learns which item it is for */
const param = (k: string) => new URLSearchParams(location.search).get(k) ?? '';
/* a 404 means "no such item" (the page shows its not-found state); any other failure leaves the sample */
const absent = (e: Error) => (/^404 /.test(e.message) ? null : Promise.reject(e));
/* "Thurs" → "Thursday"; a club's meeting time "13:15:00" → "13:15" ("00:00:00" is the API's "not set") */
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekday = (d: unknown) => { const s = clean(d); return WEEK.find(w => s && w.slice(0, 3).toLowerCase() === s.slice(0, 3).toLowerCase()) ?? s; };
const clock = (t: unknown) => { const m = /^(\d{1,2}):(\d{2})/.exec(clean(t)); return m && +m[1] + +m[2] ? `${m[1].padStart(2, '0')}:${m[2]}` : ''; };

/* ---------- the API, through the local server ---------- */
let signal: AbortSignal | undefined;
const asked = new Map<string, Promise<any>>();
const api = (path: string): Promise<any> => {
  let p = asked.get(path);
  if (!p) {
    p = fetch('../live-api?path=' + encodeURIComponent(path), { signal, headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} for ${path}`))));
    asked.set(path, p);
  }
  return p;
};
const clubsOf = (c: Ctx) => api(`/api/mobile/club-finder?districtNumber=${c.num}&page=1&pageSize=100`).then(async (first: Row) => {
  const total = Number(first?.totalCount) || list(first).length;
  const rest = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / 100) - 1) }, (_, i) =>
    api(`/api/mobile/club-finder?districtNumber=${c.num}&page=${i + 2}&pageSize=100`)));
  return { rows: [first, ...rest].flatMap(list), total };
});
/* the API has no district-wide list of club events or bulletins: one request per club, as production does */
const everyClub = (c: Ctx, path: (id: number) => string) => clubsOf(c).then(({ rows }) => Promise.all(rows.map(club =>
  api(path(club.clubId)).then((r): Row[] => list(r).map(x => ({ ...x, club: clean(club.clubName), clubId: club.clubId })), (): Row[] => [])))).then(a => a.flat());
const feed = (c: Ctx, yearId?: number) => (yearId ? api(`/api/districts/${c.id}/district-report/avenue-of-service-all-clubs?yearId=${yearId}`).then(list) : Promise.resolve([] as Row[]));
const eventsOf = (clubId: number | string) => `/api/mobile/club-finder/${clubId}/events`;

/* an avenue-of-service report as a project card; the report has no photos: the club's initials plate, until
   cardPhotos() fetches the card's own. The id is the public project's (project.html?id= opens it). */
const plates = new Map<string, string>();
const plate = (club: string) => plates.get(club) ?? plates.set(club, monogram(club || 'Rotary')).get(club)!;
const toProject = (r: Row, i: number): Project => {
  const club = clean(r.clubName), key = clean(r.moduleKey).toLowerCase();
  return {
    id: Number(/\/project\/(\d+)/.exec(String(r.publicPhotoUrl))?.[1]) || -(i + 1),
    title: clean(r.title) || 'Untitled project',
    club,
    avenue: AVENUE[key] ?? (key || 'community'),
    date: isoDay(r.projectDate),
    photo: { src: plate(club), w: 480, h: 600, alt: '' },
    beneficiaries: Number(r.beneficiaries) || 0,
    amount: (Number(r.amountSpent) || 0) / 1e5,                                /* ₹ lakh */
    hours: Number(r.manHours) || 0,
    summary: lead(clean(r.description) || clean(r.areaOfFocus), 180)
  };
};
const newestFirst = (a: Project, b: Project) => b.date.localeCompare(a.date) || b.id - a.id;
/* real photos for the cards a visitor sees first, one request a card (as production) */
const cardPhotos = (cards: Project[], yearId?: number) => Promise.all(cards.filter(p => p.id > 0).map(p => api(`/api/public/projects/${p.id}?yearId=${yearId}`).then((d: Row) => {
  const ph = list(d?.photos).find(x => x.isPrimary) ?? list(d?.photos)[0];
  const src = media(ph?.imagePath);
  if (src) p.photo = { src, w: 1200, h: 900, alt: clean(ph!.description) || p.title };
}, () => { /* the card keeps its plate */ })));

/* club bulletins: production's rules (published, not scheduled for later, with a file or a link; the year from
   yearId, or from the date when the row has none) */
const ts = (r: Row) => Date.parse(r.publishDateTime) || 0;
const shown = (r: Row) => String(r.status ?? 'Published').toLowerCase() === 'published' && !!(r.linkUrl || r.filePath) && ts(r) <= Date.now();
const inYear = (r: Row, y: Year) => (r.yearId ? r.yearId === y.id : !!ts(r) && yearOf(new Date(ts(r))) === y.label);
const newest = (a: Row, b: Row) => ts(b) - ts(a);
const bulletinOf = (r: Row): Bulletin => ({
  title: clean(r.title) || 'Newsletter', club: r.club, date: isoDay(r.publishDateTime), pdf: media(r.linkUrl || r.filePath),
  cover: R.photos.school                                                       /* the API has no cover; the themes show none */
});

/* a club's event as a calendar entry. Its id names the club and the event (c-<club id>-<event id>), so the event
   page can check the club's own list before asking for the event: a wrong id never costs a 404. */
const clubEvent = (e: Row): CalEntry => {
  const when = e.eventDate || e.date || e.startDate;
  return { date: isoDay(when), type: 'club', title: clean(e.title || e.eventTitle || e.name) || 'Club event', club: e.club, time: hhmm(when), venue: clean(e.venue || e.eventVenue || e.location) || undefined, id: e.eventId ? `c-${e.clubId}-${e.eventId}` : undefined };
};

/* the Governor in a committee roster */
const findDG = (rows: Row[]) => rows.find(m => /^district governor$/i.test(clean(m.districtDesignation))) ?? rows.find(m => isDG(m.districtDesignation)) ?? null;
/* production's pickPresident: designationId 1, else a "…President" role that is not Vice or Past */
const pickPresident = (board: Row[]) => board.find(b => b.designationId === 1)
  ?? board.find(b => { const n = clean(b.designationName).toLowerCase(); return n.includes('president') && !n.includes('vice') && !n.includes('past'); }) ?? null;

/* District Committee: the executive, then every committee group (and its sub-groups), in API order */
const committeeOf = async (c: Ctx) => {
  const y = c.years[0].id, base = `/api/districts/${c.id}/committee`;
  /* only what a committee card shows: there is no member page, so no member id or e-mail is kept */
  const member = (m: Row): Member => {
    const name = clean(m.name) || 'Member';
    return { name, role: clean(m.districtDesignation), club: clean(m.clubName), photo: portrait(media(m.profilePhoto), name) };
  };
  /* sub-group rows name only the photo's file (production's fixSubPhoto) */
  const subPhoto = (m: Row) => {
    const p = clean(m.profilePhoto);
    return p && !p.startsWith('/') && !/^https?:/i.test(p) ? { ...m, profilePhoto: (m.memberId > 0 ? '/Documents/directory/' : `/Documents/DistrictCommittee/Group${m.clubId || 0}/`) + p } : m;
  };
  const [exec, groups] = await Promise.all([api(`${base}/members?yearId=${y}&page=1&pageSize=200`).then(list), groupsOf(c)]);
  const sections = await Promise.all(groups.map(async g => {
    const [own, subs] = await Promise.all([
      groupMembers(c, g.id).catch(() => [] as Row[]),
      g.subGroupCount > 0
        ? api(`${base}/groups/${g.id}/sub-groups`).then(r => Promise.all(list(r).map(async sg => ({
          title: `${clean(g.groupName)} · ${clean(sg.subGroupName)}`,
          members: list(await api(`${base}/sub-groups/${sg.id}/members`).catch(() => [])).map(subPhoto).map(member)
        })))).catch(() => [])
        : []
    ]);
    return [{ title: clean(g.groupName), members: own.map(member) }, ...subs];
  }));
  /* the themes lead the page with the first member of the first group: the District Governor */
  const gov = exec.findIndex(m => isDG(m.districtDesignation));
  if (gov > 0) exec.unshift(...exec.splice(gov, 1));
  return [{ title: 'Executive Committee', members: exec.map(member) }, ...sections.flat()].filter(s => s.members.length);
};
const groupsOf = (c: Ctx) => api(`/api/districts/${c.id}/committee/groups?yearId=${c.years[0].id}&page=1&pageSize=200`).then(list);
/* every page of a group (200 is the API's page cap) */
const groupMembers = async (c: Ctx, gid: number) => {
  const page = (n: number) => api(`/api/districts/${c.id}/committee/groups/${gid}/members?page=${n}&pageSize=200`);
  const first = await page(1);
  const more = await Promise.all(Array.from({ length: Math.max(0, (Number(first?.totalPages) || 1) - 1) }, (_, i) => page(i + 2)));
  return [first, ...more].flatMap(list);
};

/* District: 3141, or ?district=NNNN, remembered for the session (production's tenant rule).
   Rotary year: the one today falls in (production's rule), and the next one. */
async function tenant(): Promise<Ctx> {
  const q = new URLSearchParams(location.search);
  const ok = (v: string | null) => (v && /^\d{3,5}$/.test(v) ? v : null);
  let num = ok(q.get('district')) ?? ok(q.get('d'));
  try { if (num) sessionStorage.setItem(KEY, num); else num = ok(sessionStorage.getItem(KEY)); } catch { /* private mode */ }
  num ??= DEFAULT.num;
  const [years, id] = await Promise.all([
    api('/api/rotary-years'),
    num === DEFAULT.num ? DEFAULT.id : api('/api/Districts?page=1&pageSize=500').then(r => list(r).find(d => String(d.districtNumber) === num)?.id)
  ]);
  if (!Array.isArray(years)) throw new Error('this server has no data API');
  if (!id) throw new Error(`district ${num} is not in the API`);
  const cur = years.find(y => y.yearLabel === yearOf(new Date())) ?? years.find(y => y.isCurrent);
  if (!cur) throw new Error('the API has no current Rotary year');
  const y0 = parseInt(cur.yearLabel, 10), next = `${y0 + 1}-${String((y0 + 2) % 100).padStart(2, '0')}`;
  /* the year menu: production's rule, ten years back to next year, newest first */
  const all: Year[] = years.filter(y => /^\d{4}-\d{2}$/.test(y.yearLabel) && +y.yearLabel.slice(0, 4) >= y0 - 10 && +y.yearLabel.slice(0, 4) <= y0 + 1)
    .sort((a, b) => b.yearLabel.localeCompare(a.yearLabel)).map(y => ({ id: y.id, label: y.yearLabel }));
  return { num, id, cur: cur.yearLabel, all, years: [{ id: cur.id, label: cur.yearLabel }, { id: years.find(y => y.yearLabel === next)?.id, label: next }] };
}

/* ---------- one loader per data item: fetch and map, return the step that writes it into window.ROTARY ---------- */
const JOBS: Record<string, (c: Ctx, page: PageKey | 'home') => Promise<Apply>> = {
  /* top strip: the e-mail and phone for this year */
  async contact(c) {
    const row = list(await api(`/api/districts/${c.id}/website-data/contact-details?yearId=${c.years[0].id}`))[0] ?? {};
    const phone = clean(row.phone), d = phone.replace(/\D/g, ''), ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
    return () => Object.assign(R.contact, { email: clean(row.email), phone, phoneDisplay: ten.length === 10 ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : phone, tel: ten.length === 10 ? '+91' + ten : d });
  },

  /* footer */
  async social(c) {
    const rows = list(await api(`/api/districts/${c.id}/website-data/social-links`)).filter(r => r.isActive !== false && (r.linkUrl || r.url));
    return () => {
      R.footer.social.items = rows.map(r => {
        const key = clean(r.platform).toLowerCase();
        return { key, label: key === 'twitter' ? 'Twitter / X' : key.charAt(0).toUpperCase() + key.slice(1), href: String(r.linkUrl || r.url).trim() };
      });
    };
  },

  /* banners (hero slides) and advertisements of this year */
  async hero(c) {
    const y = c.years[0].id, g = GROUPS[c.num];
    const [banners, ads] = await Promise.all([api(`/api/districts/${c.id}/website-data/banners?yearId=${y}`), api(`/api/districts/${c.id}/website-data/advertisements?yearId=${y}`)]);
    const slides = (await Promise.all(list(banners).map(async b => {
      const path = b.bannerImagePath || b.BannerImagePath, alt = clean(b.description) || 'District banner';
      /* the API names /uploads/banner/…, which answers 404: the file is in the district's website group */
      const photo = path ? await probe(g ? `https://rotaryindia.org/Documents/WebsiteData/Group${g}/BANNERS/${encodeURIComponent(fileName(path))}` : media(path), alt) : null;
      return photo && { photo, caption: clean(b.description) };
    }))).filter(s => s !== null) as Rotary['hero']['slides'];
    const adverts = (await Promise.all(list(ads).map(async a => {
      const path = a.advertisementImagePath || a.imagePath || a.AdvertisementImagePath;
      const image = path ? await probe(media(path), 'Advertisement') : null;
      return image && { image, href: clickThrough(a) };
    }))).filter(s => s !== null) as NonNullable<Rotary['hero']['ads']>;
    return () => {
      if (slides.length) R.hero.slides = slides;     /* none: the sample banners stay (a hero cannot be empty) */
      if (adverts.length) R.hero.ads = adverts;      /* none: the live site shows its default ad, which the sample is */
    };
  },

  /* the header logo: the website's own upload, else the district record's, else production's map */
  async logo(c) {
    const [w, d] = await Promise.all([api(`/api/districts/${c.id}/website-data/logo`).catch(() => null), api(`/api/Districts/${c.id}`).catch(() => null)]);
    const row = Array.isArray(w) ? w[0] : w?.items ? w.items[0] : w;
    const src = media(row?.logoPath ?? row?.LogoPath) || media(d?.districtLogoPath) || LOGOS[c.num] || '';
    return () => setLogo(src);
  },

  /* District Snapshot: production's sums over the year's avenue-of-service report */
  async snapshot(c) {
    const [feeds, clubs, district] = await Promise.all([Promise.all(c.years.map(y => feed(c, y.id))), clubsOf(c), api(`/api/Districts/${c.id}`)]);
    const total = (rows: Row[], k: string) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const sums = (rows: Row[]) => ({
      projects: rows.filter(r => clean(r.moduleKey).toLowerCase() !== 'club_service').length,   /* club-service reports are not projects */
      hours: total(rows, 'manHours'),
      amount: total(rows, 'amountSpent') / 1e7,                                                /* ₹ crore */
      beneficiaries: total(rows, 'beneficiaries')
    });
    /* clubs and members are today's counts in either year: the API keeps no history of them */
    const people = { clubs: clubs.total, members: Number(district?.totalMembers) || 0 };
    return () => c.years.forEach((y, i) => {
      R.snapshot.byYear[y.label] = { ...sums(feeds[i]), ...people, ...(y.label === c.cur ? { status: 'in-progress' as const, note: 'Year to date' } : y.label > c.cur ? { status: 'upcoming' as const, note: `Rotary year ${y.label} begins on 1 July ${y.label.slice(0, 4)}.` } : {}) };
    });
  },

  /* Club Finder (and the homepage's club strip) */
  async clubs(c) {
    const { rows } = await clubsOf(c);
    return () => { R.clubs.list = rows.map(r => ({ id: Number(r.clubId), name: clean(r.clubName), day: clean(r.meetingDay) || undefined, place: clean(r.meetingAddress) || undefined })); };
  },

  /* RI President and District Governor, this year and next. The DG comes from the committee roster:
     the public DG endpoint answers 404 for many clubs, and finding one that answers means probing. */
  async dignitaries(c) {
    const got = await Promise.all(c.years.map(y => (y.id ? Promise.all([
      api(`/api/public/club/${PRESIDENT_CLUB}/international-president?yearId=${y.id}`).catch(() => null),
      api(`/api/districts/${c.id}/committee/members?yearId=${y.id}&page=1&pageSize=200`).then(r => findDG(list(r)), () => null)
    ]) : Promise.resolve([null, null]))));
    return () => c.years.forEach((y, i) => {
      const [p, g] = got[i] as (Row | null)[], was = R.dignitaries.byYear[y.label];
      const up = y.label > c.cur, past = y.label < c.cur;
      const pName = clean(p?.name), gName = clean(g?.name);
      const president: Person | undefined = pName
        ? { name: pName, role: up ? 'President-elect' : 'President', term: `Rotary International ${y.label}`, bio: lead(textOf(p!.description), 260), photo: portrait(media(p!.profilePhotoPath), pName) }
        : was?.president;
      /* the API keeps no bio for the Governor: one line from the roster's own facts */
      const dg: Person | undefined = gName
        ? { name: gName, role: up ? 'District Governor-elect' : 'District Governor', term: y.label, bio: `${gName} ${up ? 'will lead' : past ? 'led' : 'leads'} Rotary District ${c.num} in ${y.label}.`, photo: portrait(media(g!.profilePhoto), gName) }
        : was?.dg;
      R.dignitaries.byYear[y.label] = {
        president: president ?? tba(up ? 'President-elect' : 'President', `Rotary International ${y.label}`),
        dg: dg ?? tba(up ? 'District Governor-elect' : 'District Governor', y.label)
      };
    });
  },

  /* What's Happening: the twelve months of this Rotary year, and every club's events */
  async calendar(c) {
    const start = parseInt(c.years[0].label, 10);
    const months = Array.from({ length: 12 }, (_, i) => new Date(start, 6 + i, 1));
    const [feeds, events] = await Promise.all([
      Promise.all(months.map(m => api(`/api/mobile/district-calendar/${c.id}?month=${m.getMonth() + 1}&year=${m.getFullYear()}`))),
      everyClub(c, id => `/api/mobile/club-finder/${id}/events`)
    ]);
    const entries: CalEntry[] = [];
    const add = (date: string, e: Omit<CalEntry, 'date'>) => { if (date) entries.push({ date, ...e }); };
    feeds.forEach((f: Row, i) => {
      const m = months[i];
      const day = (x: Row) => {
        const n = Number(x.day) || parseInt(String(x.birthDate ?? x.anniversaryDate ?? ''), 10), d = new Date(m.getFullYear(), m.getMonth(), n);
        return n > 0 && d.getMonth() === m.getMonth() ? toISO(d) : '';
      };
      const of = (x: Row) => (clean(x.memberName) ? `${clean(x.relation) || 'Family'} of Rtn. ${clean(x.memberName)}` : clean(x.relation));
      list(f?.birthdays).forEach(x => add(day(x), { type: 'birthday', name: clean(x.memberName), club: clean(x.clubName) }));
      list(f?.familyBirthdays).forEach(x => add(day(x), { type: 'birthday', name: clean(x.familyMemberName) || clean(x.memberName), relation: of(x) }));
      const wed = new Set<string>();
      list(f?.anniversaries).forEach(x => {
        wed.add(`${x.memberId}|${day(x)}`);
        add(day(x), { type: 'anniversary', name: x.spouseName ? `${clean(x.memberName)} & ${clean(x.spouseName)}` : clean(x.memberName), club: clean(x.clubName) });
      });
      /* a spouse's record repeats the member's own anniversary: the couple is listed once */
      list(f?.familyAnniversaries).filter(x => !wed.has(`${x.memberId}|${day(x)}`)).forEach(x => add(day(x), /^spouse$/i.test(clean(x.relation))
        ? { type: 'anniversary', name: `${clean(x.memberName)} & ${clean(x.familyMemberName)}`, club: clean(x.clubName) }
        : { type: 'anniversary', name: clean(x.familyMemberName) || clean(x.memberName), relation: of(x) }));
      /* a district event's id names the month whose feed lists it (d-<yyyy-mm>-<event id>): the event page asks that one feed */
      list(f?.upcomingEvents).filter(x => isoDay(x.eventDate || x.date).startsWith(toISO(m).slice(0, 8))).forEach(x => add(isoDay(x.eventDate || x.date), { type: 'district', title: clean(x.title || x.eventTitle || x.name) || 'District event', time: hhmm(x.eventDate || x.date), venue: clean(x.eventVenue || x.venue) || undefined, id: x.id ? `d-${toISO(m).slice(0, 7)}-${x.id}` : undefined }));
    });
    const first = toISO(months[0]), last = toISO(new Date(start + 1, 5, 30));
    events.map(clubEvent).forEach(e => { if (e.date >= first && e.date <= last) entries.push(e); });
    entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    /* the tab counts are this month's, as in the sample */
    const today = toISO(new Date()), month = today.slice(0, 7);
    const counts = { all: 0, club: 0, district: 0, birthday: 0, anniversary: 0 };
    entries.forEach(e => { if (e.date.startsWith(month)) { counts[e.type]++; counts.all++; } });
    return () => Object.assign(R.calendar, { entries, today, counts });
  },

  /* Governor's Monthly Letters and club bulletins, this year and next */
  async press(c, page) {
    const [letters, bulletins] = await Promise.all([api(`/api/districts/${c.id}/newsletters?pageSize=200`).then(list), everyClub(c, id => `/api/clubs/${id}/newsletters?pageSize=200`)]);
    const g = GROUPS[c.num];
    const home = page === 'home';
    /* letters carry no year, so it comes from the date */
    return () => c.years.forEach((y, i) => {
      const gml: Letter[] = letters.filter(r => shown(r) && !!ts(r) && yearOf(new Date(ts(r))) === y.label).sort(newest).map(r => ({
        title: clean(r.title) || 'Governor’s Monthly Letter',
        month: monthLabel(new Date(ts(r))),
        governor: R.dignitaries.byYear[y.label]?.dg.name ?? '',
        date: isoDay(r.publishDateTime),
        /* the file sits in the district's website group, not the folder the API names */
        pdf: r.linkUrl ? media(r.linkUrl) : media(g ? `${MEDIA}/Documents/ebulletin/Group${g}/${fileName(r.filePath)}` : r.filePath)
      }));
      const club: Bulletin[] = bulletins.filter(r => shown(r) && inYear(r, y)).sort(newest).map(bulletinOf);
      /* the homepage shows the latest few, as designed; the Newsletters page shows the whole year */
      R.press.byYear[y.label] = { gml: home ? gml.slice(0, 3) : gml, bulletins: home ? club.slice(0, 8) : club, total: club.length, status: y.label > c.cur ? 'upcoming' : y.label === c.cur ? 'in-progress' : 'complete' };
    });
  },

  /* About: the backend's one HTML field (none: the page shows no content, as production does) */
  async about(c) {
    const row = list(await api(`/api/districts/${c.id}/website-data/about`)).find(x => x.isActive !== false && (x.content || x.Content));
    return () => Object.assign(P.about, { content: row ? String(row.content || row.Content) : '', placeholder: false });
  },

  /* District Committee (committeeOf above) */
  async committee(c) {
    const groups = await committeeOf(c);
    return () => { P.committee.groups = groups; };
  },

  /* Club Projects / Club Service: this year's avenue-of-service report, newest first */
  async projects(c, page) {
    const y = c.years[0].id;
    const all: Project[] = (await feed(c, y)).map(toProject).sort(newestFirst);
    /* The designs put every card in the page and page them in the browser, and style "the first card shown" by
       counting siblings: past a few hundred cards that costs seconds to a minute of blank page (this year has
       4,387 reports). So the pages get the latest PER of each avenue, and their lead says so, with the full count. */
    const PER = Infinity, seen: Record<string, number> = {};
    const kept = all.filter(p => (seen[p.avenue] = (seen[p.avenue] ?? 0) + 1) <= PER);
    const clubs = (l: Project[]) => l.filter(p => p.avenue === 'club').length;
    /* real photos for the cards a visitor sees first: the first page of every avenue filter, one request a card (as production) */
    const views = page === 'service' ? [kept.filter(p => p.avenue === 'club')] : [kept.filter(p => p.avenue !== 'club'), ...P.projects.avenues.filter(a => a.key !== 'club').map(a => kept.filter(p => p.avenue === a.key))];
    const first = new Set(views.flatMap(v => v.slice(0, P.projects.pageSize)));
    await cardPhotos([...first], y);
    return () => {
      P.projects.list = kept;
      const n = (v: number) => R.fmt.num(v), yr = c.years[0].label, head = (k: PageKey) => P.list.find(p => p.key === k)!;
      if (kept.length < all.length) head('projects').lead = `The latest projects by the clubs of District ${c.num}, up to ${PER} for each avenue of service: ${n(kept.length)} of the ${n(all.length)} reported in ${yr}.`;
      if (clubs(kept) < clubs(all)) head('service').lead = `Projects that strengthen our clubs: the latest ${n(clubs(kept))} of the ${n(clubs(all))} reported in ${yr}.`;
    };
  },

  /* Club Finder: each club's President and the President's phone (production's enrichPresident). The committee's
     "Club Presidents" group names nearly all of them in one request; the clubs it lacks ask their own board. The
     phone comes from the member's record, and only when the member has not hidden their personal details. ~130
     small requests, 8 at a time: what has not arrived just before loadLive stops waiting is left out (the server
     keeps answers for five minutes, so the next visit has them). */
  async presidents(c) {
    const y = c.years[0].id, got = new Map<number, { president: string; phone?: string; tel?: string }>();
    const work = (async () => {
      const [{ rows }, groups] = await Promise.all([clubsOf(c), groupsOf(c).catch(() => [] as Row[])]);
      const g = groups.find(x => /^club presidents?$/i.test(clean(x.groupName)));
      const who = new Map<number, Row>();
      if (g) (await groupMembers(c, g.id).catch(() => [] as Row[])).forEach(m => { if (m.clubId && clean(m.name)) who.set(Number(m.clubId), { memberId: m.memberId, memberName: m.name }); });
      await pool(rows.filter(r => !who.has(Number(r.clubId))), 8, r => api(`/api/clubs/${r.clubId}/board-of-directors?yearId=${y}`).then(b => {
        const p = pickPresident(list(b));
        if (p && clean(p.memberName)) who.set(Number(r.clubId), p);
      }));
      who.forEach((p, id) => got.set(id, { president: clean(p.memberName) }));
      await pool([...who].filter(([, p]) => p.memberId > 0), 8, ([id, p]) => api(`/api/mobile/club-finder/members/${p.memberId}`).then((d: Row) => {
        const m = d?.member ?? {}, hidden = m.isPersonalDetailsVisible === 0 || m.isPersonalDetailsVisible === false;
        got.set(id, { president: clean(m.memberName) || clean(p.memberName), ...(hidden ? null : dial(m.primaryMobile, m.primaryPhoneCode)) });
      }));
    })().catch(() => {});
    let finished = false;
    await Promise.race([work.then(() => { finished = true; }), lapse()]);
    if (!finished) info(`Club Finder: ${got.size} Presidents arrived in time, ${[...got.values()].filter(p => p.phone).length} with a phone`);
    return () => R.clubs.list.forEach(k => { const p = got.get(k.id); k.president = p?.president; k.phone = p?.phone; k.tel = p?.tel; });
  },

  /* Club profile (club.html?id=<club id>): production's ClubProfile. The id must be one of the district's clubs (the
     club endpoints answer 403 for any other). Projects and their totals come from the year's avenue-of-service
     report (as production: by club name), the board and the newsletters from this Rotary year. */
  async club(c) {
    const id = param('id'), y = c.years[0];
    const row = (await clubsOf(c)).rows.find(r => String(r.clubId) === id);
    if (!row) return () => { D.club.item = null; };
    const roster = async () => {                                           /* every page of the roster (100 is the page cap) */
      const page = (n: number) => api(`/api/mobile/club-finder/${id}/members?page=${n}&pageSize=100&excludeHonorary=true`);
      const first = await page(1);
      const more = await Promise.all(Array.from({ length: Math.max(0, Math.ceil((Number(first?.totalCount) || 0) / 100) - 1) }, (_, i) => page(i + 2)));
      return [first, ...more].flatMap(list).filter(m => !Number(m.isHonorary));   /* the API ignores excludeHonorary */
    };
    const none = (): Row[] => [], late: Row[] = [];
    const [d, board, people, reports, letters, events] = await Promise.all([
      api(`/api/mobile/club-finder/${id}`),
      api(`/api/clubs/${id}/board-of-directors?yearId=${y.id}`).then(list, none),
      roster().catch(none),
      /* the year's report is 5 MB: should it arrive too late, the club still shows live, without its projects */
      Promise.race([feed(c, y.id).catch(none), lapse().then(() => late)]),
      api(`/api/clubs/${id}/newsletters?pageSize=200`).then(list, none),
      api(eventsOf(id)).then(list, none)
    ]);
    if (reports === late) info('club: the year’s project report came too late; the club shows no projects');
    const k: Row = d?.club ?? {}, name = clean(k.ClubName) || clean(row.clubName);
    const projects = reports.map(toProject).filter(p => p.club === name).sort(newestFirst);
    await Promise.race([cardPhotos(projects.slice(0, P.projects.pageSize), y.id), lapse()]);
    const leader = (role: unknown, who: unknown, photo: unknown): Leader => { const n = clean(who); return { role: clean(role), name: n, photo: portrait(media(photo), n) }; };
    /* the year's board, in the API's order of office; none on record: the club's current President and Secretary */
    const leaders = board.length
      ? board.slice().sort((a, b) => (a.designationId || 999) - (b.designationId || 999))
        .map(b => leader(clean(b.designationName || 'Board Member').replace(/^club\s+/i, ''), b.memberName || b.nonMemberName, b.profilePhotoPath))
      : [leader('President', d?.president?.name, d?.president?.profilePhoto), leader('Secretary', d?.secretary?.name, d?.secretary?.profilePhoto)];
    const members: Member[] = people.map(m => { const n = clean(m.memberName) || 'Member'; return { name: n, role: clean(m.currentDesignation), club: name, photo: portrait(media(m.profilePhoto), n), id: m.memberId ? String(m.memberId) : undefined }; });
    const from = clock(k.MeetingFromTime), to = clock(k.MeetingToTime);
    return () => {
      D.club.item = {
        id, name,
        meeting: { day: weekday(k.MeetingDay || row.meetingDay), time: from && to ? `${from}–${to}` : from || to, place: places([k.MeetingAddress || row.meetingAddress, k.City, `${clean(k.State)} ${clean(k.Pincode)}`]) },
        details: facts([['Chartered', dated(k.ClubCharterDate)], ['Zone', clean(k.zoneName)], ['Club ID', clean(k.ClubRotaryId)]]),
        glance: { members: members.length, ...totals(projects) },
        contact: filled({ email: clean(k.ClubEmail), web: link(d?.clubWebsite?.clientDomain || k.ClubWebsite) }),
        leaders: leaders.filter(l => l.name),
        members, projects,
        bulletins: letters.filter(r => shown(r) && inYear(r, y)).sort(newest).map(r => bulletinOf({ ...r, club: name })),
        events: events.map(e => clubEvent({ ...e, club: name, clubId: id })).filter(e => yearOf(parseISO(e.date)) === y.label).sort((a, b) => a.date.localeCompare(b.date))
      };
    };
  },

  /* Project (project.html?id=<public project id>): production's club-project Detail, /api/public/projects/{id} in
     this Rotary year (the ids repeat across years). Every photo, primary first, with its real size. */
  async project(c) {
    const id = param('id'), y = c.years[0].id;
    const d: Row | null = /^\d+$/.test(id) ? await api(`/api/public/projects/${id}?yearId=${y}`).catch(absent) : null;
    const p: Row | undefined = d?.project;
    if (!p) return () => { D.project.item = null; };
    const title = clean(p.title) || 'Untitled project', club = clean(p.clubName), key = clean(p.moduleKey).toLowerCase();
    const shots = list(d!.photos).slice().sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || (a.sortOrder || 0) - (b.sortOrder || 0));
    const gallery = (await Promise.all(shots.map(s => sized(media(s.imagePath), clean(s.description) || title)))).filter((s): s is Photo => !!s);
    const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
    return () => {
      D.project.item = {
        id: Number(id), title, club,
        avenue: AVENUE[key] ?? (key || 'community'),
        date: isoDay(p.projectDate),
        photo: gallery[0] ?? { src: plate(club), w: 480, h: 600, alt: '' },
        beneficiaries: n(p.directBeneficiaries) ?? 0,
        amount: (n(p.projectCost) ?? 0) / 1e5,                                  /* ₹ lakh: the report's amount spent */
        hours: n(p.manHours) ?? 0,
        summary: lead(clean(p.description) || clean(p.areaOfFocus), 180),
        description: plain(p.description),
        gallery,
        location: places([p.location, p.clubCity, p.clubState]),
        rotarians: n(p.rotariansInvolved),
        focus: sentence(clean(p.areaOfFocus)),
        clubId: p.clubId ? String(p.clubId) : ''
      };
    };
  },

  /* Event (event.html?id=…): a club event, c-<club id>-<event id> (the club's list, then production's club-event
     detail for the organiser), or a district event, d-<yyyy-mm>-<event id> (that month's district calendar, which
     carries the whole event). Ids the lists do not name are not asked for. */
  async event(c) {
    const id = param('id');
    const ce = /^c-(\d+)-(\d+)$/.exec(id), de = /^d-(\d{4})-(\d{2})-(\d+)$/.exec(id);
    let item: EventDetail | null = null;
    if (ce) {
      const row = (await clubsOf(c)).rows.find(r => String(r.clubId) === ce[1]);
      const e = row ? list(await api(eventsOf(ce[1]))).find(x => String(x.eventId) === ce[2]) : null;
      if (e) {
        const x: Row = await api(`/api/mobile/club-finder/events/${ce[2]}`).catch(() => e);
        const when = x.eventDate || e.eventDate, title = clean(x.title) || 'Club event';
        const photo = await sized(media(x.imagePath), title);
        item = {
          id, kind: 'club', title, date: isoDay(when), time: hhmm(when) ?? '', venue: clean(x.venue),
          club: clean(x.clubName) || clean(row!.clubName), clubId: ce[1],
          description: plain(x.description), gallery: photo ? [photo] : [], registration: link(x.registrationLink),
          contact: filled({ name: clean(x.organizerName), email: clean(x.organizerEmail), phone: dial(x.organizerMobile)?.phone ?? '' })
        };
      }
    } else if (de) {
      const f: Row = await api(`/api/mobile/district-calendar/${c.id}?month=${+de[2]}&year=${de[1]}`);
      const e = list(f?.upcomingEvents).find(x => String(x.id) === de[3]);
      if (e) {
        const when = e.eventDate || e.date, title = clean(e.title || e.eventTitle || e.name) || 'District event';
        /* an image the old admin uploaded sits in the district's website group, not where the API says (production's eventMediaAlt) */
        const path = String(e.imagePath ?? ''), old = /^\/Documents\/Event\/Group\d+\/(.+)$/i.exec(path), g = GROUPS[c.num];
        const photo = (await sized(media(path), title)) ?? (old && g ? await sized(media(`/Documents/Event/Group${g}/${old[1]}`), title) : null);
        item = {
          id, kind: 'district', title, date: isoDay(when), time: hhmm(when) ?? '', venue: clean(e.eventVenue || e.venue),
          club: '', clubId: '', description: plain(e.description), gallery: photo ? [photo] : [], registration: link(e.registrationLink), contact: null
        };
      }
    }
    return () => { D.event.item = item; };
  },

  /* RI President or District Governor (dignitary.html?type=president|dg), this Rotary year: production's
     DignitaryProfile. The President's whole biography; the Governor from the committee roster (as the homepage),
     with the facts and contact of their member record. */
  async dignitary(c) {
    const t = param('type').toLowerCase(), y = c.years[0];
    if (!(t === 'dg' || t === '2' || t === 'governor')) {
      const p: Row | null = await api(`/api/public/club/${PRESIDENT_CLUB}/international-president?yearId=${y.id}`).catch(absent);
      const name = clean(p?.name);
      return () => {
        D.dignitary.item = name ? { president: { name, role: 'President', term: `Rotary International ${y.label}`, bio: parasOf(p!.description), photo: portrait(media(p!.profilePhotoPath), name), type: 'president', facts: [], contact: null } } : null;
      };
    }
    const g = findDG(list(await api(`/api/districts/${c.id}/committee/members?yearId=${y.id}&page=1&pageSize=200`)));
    const m: Row = g && g.memberId > 0 ? await api(`/api/members/${g.memberId}`).catch(() => ({})) : {};
    const name = clean(g?.name);
    return () => {
      D.dignitary.item = name ? {
        dg: {
          name, role: 'District Governor', term: y.label,
          /* the API keeps no bio for the Governor unless the member wrote an introduction */
          bio: plain(m.memberIntroduction) || `${name} leads Rotary District ${c.num} in ${y.label}.`,
          photo: portrait(media(m.profilePhotoPath) || media(g!.profilePhoto), name), type: 'dg',
          facts: facts([['Club', clean(g!.clubName) && `Rotary Club of ${clean(g!.clubName)}`], ['Rotary ID', clean(m.rotaryId)], ['Classification', clean(m.classificationProfession)], ['Member since', dated(m.joinedDate)]]),
          contact: filled({ email: clean(m.emailId) || clean(g!.email), phone: dial(m.primaryMobileNumber || g!.mobile, m.primaryCountryPhoneCode)?.phone ?? '' })
        }
      } : null;
    };
  }
};

/* what each page shows, besides the top strip and the footer (contact, social) */
const PAGE_JOBS: Record<PageKey | 'home', string[]> = {
  home: ['hero', 'snapshot', 'clubs', 'dignitaries', 'calendar', 'press'],
  about: ['about'],
  committee: ['committee'],
  finder: ['clubs', 'presidents'],
  projects: ['projects'],
  service: ['projects'],
  calendar: ['calendar'],
  newsletters: ['dignitaries', 'press'],     /* each letter names its Governor */
  contact: ['dignitaries'],                  /* the Governor's office */
  /* detail pages (shared/detail.tsx): the item the query string names, in P.<page>.item */
  club: ['clubs', 'club'],
  project: ['project'],
  event: ['event'],
  dignitary: ['dignitaries', 'dignitary']     /* both people, so the page can offer the other one with name and photo */
};
const ORDER = Object.keys(JOBS);               /* write order: the dignitaries before the press */

/* another district: the sample's name and links follow it (its copy says "District 3141" in places) */
function retarget(num: string) {
  const swap = (o: Row) => {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') o[k] = v.replace(/District 3141\b|rid3141\b/g, m => m.replace('3141', num));
      else if (v && typeof v === 'object') swap(v);
    }
  };
  swap(R as unknown as Row);
  R.site.district = num;
}

/* ---------- snapshot: the district's real data saved on this computer (scripts/snapshot.mjs) ----------
   Where there is no live data API (the public demo, any other server), a page reads data/page/<page>.json, the
   changes its live data makes to window.ROTARY, and a detail page also data/<kind>/<id>.json. data/index.json lists
   the saved items, so a missing one shows the page's not-found state without a failed request. No snapshot: sample. */
const isRow = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const merge = (t: Row, s: Row) => { for (const k of Object.keys(s)) { if (isRow(s[k]) && isRow(t[k])) merge(t[k], s[k]); else t[k] = s[k]; } };
const ITEM_PAGES = ['club', 'project', 'event'] as const;
async function snapshot(page: PageKey | 'home', why: string): Promise<void> {
  const base = new URL('../data/', location.href), ctrl = new AbortController();
  const stop = setTimeout(() => ctrl.abort(), CAP);
  const get = async (p: string) => { const r = await fetch(new URL(p, base), { signal: ctrl.signal }); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
  try {
    const index = await get('index.json');
    const patch = index.pages?.includes(page) ? await get(`page/${page}.json`) : null;
    if (!patch) throw new Error(`no snapshot for ${page}`);
    let item: unknown;
    if (page === 'dignitary') item = index.dignitary ? await get('dignitary.json') : null;
    else if ((ITEM_PAGES as readonly string[]).includes(page)) {
      /* no ?id=: the saved data's own example (the sample's is not among the saved items), as pages.mjs bakes it */
      const id = new URLSearchParams(location.search).get('id') ?? String(patch.pages?.[page]?.example ?? (P as unknown as Record<string, Row>)[page].example ?? '');
      item = (index[page] as string[] | undefined)?.includes(id) ? await get(`${page}/${encodeURIComponent(id)}.json`) : null;
    }
    merge(R as unknown as Row, patch);
    setLogo(LOGOS[DEFAULT.num] ?? '');
    if (item !== undefined) (P as unknown as Record<string, Row>)[page].item = item;
    /* a dead file on the media host shows the theme's initials plate, not a broken image */
    addEventListener('error', e => {
      const img = e.target;
      if (img instanceof HTMLImageElement && img.src.startsWith(MEDIA)) img.src = monogram(img.alt.replace(/^Portrait of /, ''));
    }, true);
    info(`${why}: the district's real data as saved on ${index.date}`);
  } catch (e) {
    info(`${why}; no saved data (${(e as Error).message}): sample data`);
  } finally { clearTimeout(stop); }
}

/* the year menu: a year not loaded yet is fetched when chosen (its Snapshot report can take a minute), then joins
   the loaded years in date order, so the 12-year trends grow with it */
let live: { ctx: Ctx; page: PageKey | 'home' } | null = null;
const YEAR_JOBS = ['snapshot', 'dignitaries', 'press'];
export async function loadYear(label: string): Promise<void> {
  if (!live || R.years.list.includes(label)) return;
  const { ctx, page } = live, y = ctx.all.find(x => x.label === label);
  if (!y) return;
  const c: Ctx = { ...ctx, years: [y] };
  signal = undefined;                                   /* the first load's requests were cut off; these are new */
  until = performance.now() + 120000;
  const names = YEAR_JOBS.filter(n => PAGE_JOBS[page].includes(n));
  const done = await Promise.all(names.map(n => JOBS[n](c, page).catch(e => { info(`${label}: ${n} failed (${(e as Error)?.message ?? e})`); return null; })));
  for (const n of ORDER) done[names.indexOf(n)]?.();
  R.snapshot.byYear[label] ??= { projects: 0, hours: 0, amount: 0, beneficiaries: 0, clubs: 0, members: 0 };
  R.press.byYear[label] ??= { gml: [], bulletins: [], total: 0, status: 'complete' };
  R.dignitaries.byYear[label] ??= { president: tba('President', `Rotary International ${label}`), dg: tba('District Governor', label) };
  R.years.list = [...R.years.list, label].sort();
}

export async function loadLive(page: PageKey | 'home'): Promise<void> {
  /* live only on this computer, where scripts/live.mjs runs; the public demo reads the saved snapshot */
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return snapshot(page, 'not on this computer');
  const t0 = performance.now(), ctrl = new AbortController(), TIMEOUT = Symbol('timeout');
  signal = ctrl.signal;
  until = t0 + CAP;
  const deadline = new Promise<typeof TIMEOUT>(r => setTimeout(() => r(TIMEOUT), CAP));
  let c: Ctx | typeof TIMEOUT;
  try {
    /* the first request also tells whether this server has the data API (any other server returns the
       static stand-in themes-sample/live-api, so asking never fails with a 404) */
    c = await Promise.race([tenant(), deadline]);
    if (c === TIMEOUT) throw new Error(`no answer in ${CAP / 1000} s`);
  } catch (e) {
    ctrl.abort();
    return snapshot(page, `no live data (${(e as Error).message})`);
  }
  const ctx = c;
  const names = ['contact', 'social', 'logo', ...PAGE_JOBS[page]];
  const ready = new Map<string, Apply>(), failed: string[] = [];
  await Promise.race([Promise.all(names.map(n => JOBS[n](ctx, page).then(a => void ready.set(n, a), e => void failed.push(`${n} (${(e as Error)?.message ?? e})`)))), deadline]);
  ctrl.abort();                                                /* nothing is written after this point */

  if (ctx.num !== DEFAULT.num) retarget(ctx.num);
  for (const n of ORDER) ready.get(n)?.();
  /* the year menu offers the years loaded, this one and the next: a past year's snapshot is an 8-14 MB report
     that takes longer than CAP to arrive. A section that did not arrive keeps the sample's entry for the year. */
  for (const y of ctx.years) {
    R.snapshot.byYear[y.label] ??= { projects: 0, hours: 0, amount: 0, beneficiaries: 0, clubs: 0, members: 0 };
    R.press.byYear[y.label] ??= { gml: [], bulletins: [], total: 0, status: 'upcoming' };
    R.dignitaries.byYear[y.label] ??= { president: tba('President', `Rotary International ${y.label}`), dg: tba('District Governor', y.label) };
  }
  Object.assign(R.years, { list: ctx.years.map(y => y.label), current: ctx.years[0].label, options: ctx.all.map(y => y.label) });
  live = { ctx, page };

  /* a dead file on the media host shows the theme's initials plate, not a broken image */
  addEventListener('error', e => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.src.startsWith(MEDIA)) img.src = monogram(img.alt.replace(/^Portrait of /, ''));
  }, true);

  const slow = names.filter(n => !ready.has(n) && !failed.some(f => f.startsWith(n + ' ')));
  info(`District ${ctx.num}, ${ctx.years[0].label}: live ${[...ready.keys()].join(', ') || 'nothing'}`
    + (failed.length ? `; failed, sample kept: ${failed.join(', ')}` : '')
    + (slow.length ? `; too slow, sample kept: ${slow.join(', ')}` : '')
    + ` (${Math.round(performance.now() - t0)} ms)`);
}
