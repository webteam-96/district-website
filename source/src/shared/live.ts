/* Live district data for the React themes, on this computer only.

   scripts/live.mjs serves the themes and answers GET /live-api?path=/api/… from the district API (it adds the
   API key there; the key never reaches the browser or a build). loadLive(page) asks for what that page shows,
   maps the answers into window.ROTARY in the shapes the themes already read, and resolves; main.tsx renders
   after it. Anywhere else (the public demo, file://, any other server) it resolves at once and the sample in
   shared/content.js stays. So does whatever has not arrived after CAP ms.

   The calls and the media-path workarounds follow the production site (district_website_react/src/api/client.ts,
   pages/Home/homeData.ts, HomeCalendar.tsx, clubData.ts, DistrictCommittee/, Projects/). Calls that can answer
   404 are avoided: the browser reports every failed request as a console error. */
import { R, monogram, monthLabel, toISO, type Bulletin, type CalEntry, type Letter, type Person, type Photo, type Rotary } from './rotary';
import type { Member, PageKey, Pages, Project } from './inner';

type Row = Record<string, any>;
type Apply = () => void;
interface Year { id?: number; label: string }
interface Ctx { num: string; id: number; years: [Year, Year] }   /* this Rotary year, the next one */

const P = (R as unknown as { pages: Pages }).pages;
const CAP = 8000;                                   /* ms: what has not arrived by then stays sample */
const MEDIA = 'https://rizones45678.org/API';        /* /Documents/… and /uploads/… live under the API host */
const DEFAULT = { num: '3141', id: 490 };
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
/* a banner's or an ad's own link, or its uploaded document (production's clickThroughUrl) */
const clickThrough = (r: Row) => { const l = String(r.linkUrl ?? '').trim(); return l ? (/^(https?:)?\/\//i.test(l) ? l : 'https://' + l) : r.documentPath ? media(r.documentPath) : null; };
const portrait = (src: string, name: string): Photo | null => (src ? { src, w: 480, h: 600, alt: `Portrait of ${name}` } : null);
const tba = (role: string, term: string): Person => ({ name: 'To be announced', role, term, bio: '', photo: null });
/* production's isDistrictGovernor, plus "Lt Governor" */
const isDG = (d: unknown) => { const s = clean(d).toLowerCase(); return s.includes('governor') && !/governor[’'`]s|\blt\b|vice|deputy|assistant|asst|acting|nominee|elect|past|nominate|counsel|mentor|advis|aide|secretary|chair|coordinator|trainer/.test(s); };
/* admin HTML as plain text; a paragraph ends a sentence even when the editor left off its full stop */
const textOf = (html: unknown) => (new DOMParser().parseFromString(String(html ?? '').replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, '$&\n'), 'text/html').body.textContent ?? '')
  .split('\n').map(clean).filter(Boolean).map(s => (/[.!?:…"”’)]$/.test(s) ? s : s + '.')).join(' ');
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
  api(path(club.clubId)).then((r): Row[] => list(r).map(x => ({ ...x, club: clean(club.clubName) })), (): Row[] => [])))).then(a => a.flat());
const feed = (c: Ctx, yearId?: number) => (yearId ? api(`/api/districts/${c.id}/district-report/avenue-of-service-all-clubs?yearId=${yearId}`).then(list) : Promise.resolve([] as Row[]));

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
  return { num, id, years: [{ id: cur.id, label: cur.yearLabel }, { id: years.find(y => y.yearLabel === next)?.id, label: next }] };
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

  /* District Snapshot: production's sums over the year's avenue-of-service report */
  async snapshot(c) {
    const [y0, y1] = c.years;
    const [cur, next, clubs, district] = await Promise.all([feed(c, y0.id), feed(c, y1.id), clubsOf(c), api(`/api/Districts/${c.id}`)]);
    const total = (rows: Row[], k: string) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const sums = (rows: Row[]) => ({
      projects: rows.filter(r => clean(r.moduleKey).toLowerCase() !== 'club_service').length,   /* club-service reports are not projects */
      hours: total(rows, 'manHours'),
      amount: total(rows, 'amountSpent') / 1e7,                                                /* ₹ crore */
      beneficiaries: total(rows, 'beneficiaries')
    });
    /* clubs and members are today's counts in either year: the API keeps no history of them */
    const people = { clubs: clubs.total, members: Number(district?.totalMembers) || 0 };
    return () => {
      R.snapshot.byYear[y0.label] = { ...sums(cur), ...people, status: 'in-progress', note: 'Year to date' };
      R.snapshot.byYear[y1.label] = { ...sums(next), ...people, status: 'upcoming', note: `Rotary year ${y1.label} begins on 1 July ${y1.label.slice(0, 4)}.` };
    };
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
      api(`/api/districts/${c.id}/committee/members?yearId=${y.id}&page=1&pageSize=200`).then(r => {
        const rows = list(r);
        return rows.find(m => /^district governor$/i.test(clean(m.districtDesignation))) ?? rows.find(m => isDG(m.districtDesignation)) ?? null;
      }, () => null)
    ]) : Promise.resolve([null, null]))));
    return () => c.years.forEach((y, i) => {
      const [p, g] = got[i] as (Row | null)[], was = R.dignitaries.byYear[y.label];
      const pName = clean(p?.name), gName = clean(g?.name);
      const president: Person | undefined = pName
        ? { name: pName, role: i ? 'President-elect' : 'President', term: `Rotary International ${y.label}`, bio: lead(textOf(p!.description), 260), photo: portrait(media(p!.profilePhotoPath), pName) }
        : was?.president;
      /* the API keeps no bio for the Governor: one line from the roster's own facts */
      const dg: Person | undefined = gName
        ? { name: gName, role: i ? 'District Governor-elect' : 'District Governor', term: y.label, bio: `${gName} ${i ? 'will lead' : 'leads'} Rotary District ${c.num} in ${y.label}.`, photo: portrait(media(g!.profilePhoto), gName) }
        : was?.dg;
      R.dignitaries.byYear[y.label] = {
        president: president ?? tba(i ? 'President-elect' : 'President', `Rotary International ${y.label}`),
        dg: dg ?? tba(i ? 'District Governor-elect' : 'District Governor', y.label)
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
      list(f?.upcomingEvents).filter(x => isoDay(x.eventDate || x.date).startsWith(toISO(m).slice(0, 8))).forEach(x => add(isoDay(x.eventDate || x.date), { type: 'district', title: clean(x.title || x.eventTitle || x.name) || 'District event', time: hhmm(x.eventDate || x.date), venue: clean(x.eventVenue || x.venue) || undefined }));
    });
    const first = toISO(months[0]), last = toISO(new Date(start + 1, 5, 30));
    events.forEach(e => {
      const when = e.eventDate || e.date || e.startDate, date = isoDay(when);
      if (date >= first && date <= last) entries.push({ date, type: 'club', title: clean(e.title || e.eventTitle || e.name) || 'Club event', club: e.club, time: hhmm(when), venue: clean(e.venue || e.eventVenue || e.location) || undefined });
    });
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
    const g = GROUPS[c.num], now = Date.now();
    const ts = (r: Row) => Date.parse(r.publishDateTime) || 0;
    /* production's rules: published, not scheduled for later, with a file or a link; letters carry no year, so it comes from the date */
    const shown = (r: Row) => String(r.status ?? 'Published').toLowerCase() === 'published' && !!(r.linkUrl || r.filePath) && ts(r) <= now;
    const inYear = (r: Row, y: Year) => (r.yearId ? r.yearId === y.id : !!ts(r) && yearOf(new Date(ts(r))) === y.label);
    const newest = (a: Row, b: Row) => ts(b) - ts(a);
    const home = page === 'home';
    return () => c.years.forEach((y, i) => {
      const gml: Letter[] = letters.filter(r => shown(r) && !!ts(r) && yearOf(new Date(ts(r))) === y.label).sort(newest).map(r => ({
        title: clean(r.title) || 'Governor’s Monthly Letter',
        month: monthLabel(new Date(ts(r))),
        governor: R.dignitaries.byYear[y.label]?.dg.name ?? '',
        date: isoDay(r.publishDateTime),
        /* the file sits in the district's website group, not the folder the API names */
        pdf: r.linkUrl ? media(r.linkUrl) : media(g ? `${MEDIA}/Documents/ebulletin/Group${g}/${fileName(r.filePath)}` : r.filePath)
      }));
      const club: Bulletin[] = bulletins.filter(r => shown(r) && inYear(r, y)).sort(newest).map(r => ({
        title: clean(r.title) || 'Newsletter', club: r.club, date: isoDay(r.publishDateTime), pdf: media(r.linkUrl || r.filePath),
        cover: R.photos.school                                                       /* the API has no cover; the themes show none */
      }));
      /* the homepage shows the latest few, as designed; the Newsletters page shows the whole year */
      R.press.byYear[y.label] = { gml: home ? gml.slice(0, 3) : gml, bulletins: home ? club.slice(0, 8) : club, total: club.length, status: i ? 'upcoming' : 'in-progress' };
    });
  },

  /* About: the backend's one HTML field (none: the page shows no content, as production does) */
  async about(c) {
    const row = list(await api(`/api/districts/${c.id}/website-data/about`)).find(x => x.isActive !== false && (x.content || x.Content));
    return () => Object.assign(P.about, { content: row ? String(row.content || row.Content) : '', placeholder: false });
  },

  /* District Committee: the executive, then every committee group (and its sub-groups), in API order */
  async committee(c) {
    const y = c.years[0].id, base = `/api/districts/${c.id}/committee`;
    const member = (m: Row): Member => { const name = clean(m.name) || 'Member'; return { name, role: clean(m.districtDesignation), club: clean(m.clubName), photo: portrait(media(m.profilePhoto), name) }; };
    /* every page of a group (200 is the API's page cap) */
    const members = async (gid: number) => {
      const first = await api(`${base}/groups/${gid}/members?page=1&pageSize=200`);
      const more = await Promise.all(Array.from({ length: Math.max(0, (Number(first?.totalPages) || 1) - 1) }, (_, i) => api(`${base}/groups/${gid}/members?page=${i + 2}&pageSize=200`)));
      return [first, ...more].flatMap(list);
    };
    /* sub-group rows name only the photo's file (production's fixSubPhoto) */
    const subPhoto = (m: Row) => {
      const p = clean(m.profilePhoto);
      return p && !p.startsWith('/') && !/^https?:/i.test(p) ? { ...m, profilePhoto: (m.memberId > 0 ? '/Documents/directory/' : `/Documents/DistrictCommittee/Group${m.clubId || 0}/`) + p } : m;
    };
    const [exec, groups] = await Promise.all([api(`${base}/members?yearId=${y}&page=1&pageSize=200`).then(list), api(`${base}/groups?yearId=${y}&page=1&pageSize=200`).then(list)]);
    const sections = await Promise.all(groups.map(async g => {
      const [own, subs] = await Promise.all([
        members(g.id).catch(() => [] as Row[]),
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
    return () => { P.committee.groups = [{ title: 'Executive Committee', members: exec.map(member) }, ...sections.flat()].filter(s => s.members.length); };
  },

  /* Club Projects / Club Service: this year's avenue-of-service report, newest first */
  async projects(c, page) {
    const y = c.years[0].id;
    const plates = new Map<string, string>();
    const plate = (club: string) => plates.get(club) ?? plates.set(club, monogram(club || 'Rotary')).get(club)!;
    const all: Project[] = (await feed(c, y)).map((r, i) => {
      const club = clean(r.clubName), key = clean(r.moduleKey).toLowerCase();
      return {
        id: Number(/\/project\/(\d+)/.exec(String(r.publicPhotoUrl))?.[1]) || -(i + 1),
        title: clean(r.title) || 'Untitled project',
        club,
        avenue: AVENUE[key] ?? (key || 'community'),
        date: isoDay(r.projectDate),
        /* the report has no photos: the club's initials plate, until the card's own photo is fetched below */
        photo: { src: plate(club), w: 480, h: 600, alt: '' },
        beneficiaries: Number(r.beneficiaries) || 0,
        amount: (Number(r.amountSpent) || 0) / 1e5,                                /* ₹ lakh */
        hours: Number(r.manHours) || 0,
        summary: lead(clean(r.description) || clean(r.areaOfFocus), 180)
      };
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    /* The designs put every card in the page and page them in the browser, and style "the first card shown" by
       counting siblings: past a few hundred cards that costs seconds to a minute of blank page (this year has
       4,387 reports). So the pages get the latest PER of each avenue, and their lead says so, with the full count. */
    const PER = 100, seen: Record<string, number> = {};
    const kept = all.filter(p => (seen[p.avenue] = (seen[p.avenue] ?? 0) + 1) <= PER);
    const clubs = (l: Project[]) => l.filter(p => p.avenue === 'club').length;
    /* real photos for the cards a visitor sees first: the first page of every avenue filter, one request a card (as production) */
    const views = page === 'service' ? [kept.filter(p => p.avenue === 'club')] : [kept, ...P.projects.avenues.map(a => kept.filter(p => p.avenue === a.key))];
    const first = new Set(views.flatMap(v => v.slice(0, P.projects.pageSize)).filter(p => p.id > 0));
    await Promise.all([...first].map(p => api(`/api/public/projects/${p.id}?yearId=${y}`).then((d: Row) => {
      const ph = list(d?.photos).find(x => x.isPrimary) ?? list(d?.photos)[0];
      const src = media(ph?.imagePath);
      if (src) p.photo = { src, w: 1200, h: 900, alt: clean(ph!.description) || p.title };
    }, () => { /* the card keeps its plate */ })));
    return () => {
      P.projects.list = kept;
      const n = (v: number) => R.fmt.num(v), yr = c.years[0].label, head = (k: PageKey) => P.list.find(p => p.key === k)!;
      if (kept.length < all.length) head('projects').lead = `The latest projects by the clubs of District ${c.num}, up to ${PER} for each avenue of service: ${n(kept.length)} of the ${n(all.length)} reported in ${yr}.`;
      if (clubs(kept) < clubs(all)) head('service').lead = `Projects that strengthen our clubs: the latest ${n(clubs(kept))} of the ${n(clubs(all))} reported in ${yr}.`;
    };
  }
};

/* what each page shows, besides the top strip and the footer (contact, social) */
const PAGE_JOBS: Record<PageKey | 'home', string[]> = {
  home: ['hero', 'snapshot', 'clubs', 'dignitaries', 'calendar', 'press'],
  about: ['about'],
  committee: ['committee'],
  finder: ['clubs'],
  projects: ['projects'],
  service: ['projects'],
  calendar: ['calendar'],
  newsletters: ['dignitaries', 'press'],     /* each letter names its Governor */
  contact: ['dignitaries']                   /* the Governor's office */
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

export async function loadLive(page: PageKey | 'home'): Promise<void> {
  /* only on this computer, where scripts/live.mjs runs: the public demo never asks */
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return info('not on this computer: sample data');
  const t0 = performance.now(), ctrl = new AbortController(), TIMEOUT = Symbol('timeout');
  signal = ctrl.signal;
  const deadline = new Promise<typeof TIMEOUT>(r => setTimeout(() => r(TIMEOUT), CAP));
  let c: Ctx | typeof TIMEOUT;
  try {
    /* the first request also tells whether this server has the data API (any other server returns the
       static stand-in themes-sample/live-api, so asking never fails with a 404) */
    c = await Promise.race([tenant(), deadline]);
    if (c === TIMEOUT) throw new Error(`no answer in ${CAP / 1000} s`);
  } catch (e) {
    ctrl.abort();
    return info(`no live data (${(e as Error).message}): sample data`);
  }
  const ctx = c;
  const names = ['contact', 'social', ...PAGE_JOBS[page]];
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
  Object.assign(R.years, { list: ctx.years.map(y => y.label), current: ctx.years[0].label });

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
