/* homeData.ts — Home page data loaders, ported from the ASPX js/home.js.
   These return DATA (Home.tsx renders it as JSX + mounts the vendored WebGL
   effects). All the live/district-specific API logic + workarounds are kept. */
import RotaryAPI, { config } from '../../api/client';

export interface Dignitary {
  name: string;
  role: string;
  term: string;
  club: string;
  photo: string;
  /* Admin-authored bio HTML — same `description` the /dignitary page renders in
     full. Carried here only so the home card can show an excerpt; may be ''. */
  message?: string;
}
export interface HeroSlide { image: string; alt: string; fallback?: string; href?: string; badge?: string | null }
export interface SnapshotData {
  projects: number;
  beneficiaries: number;
  manHours: number;
  cost: number;
  totalClubs: number;
  totalMembers: number;
}

/* ------------------- banner / ad DEFAULTS (mirror the legacy site) ------------------- */
export const fallbackHero: HeroSlide[] = [{ image: '/default/assets/img/banner-default.png', alt: 'Rotary' }];
export const fallbackAds: HeroSlide[] = [
  { image: '/default/assets/img/ad-default.png', alt: 'Rotary — The Four-Way Test' },
];
/* ------------------------------ media helpers ------------------------------ */
const resolveMedia = (path: any) => RotaryAPI.mediaUrl(path);
const mediaProxy = (path: any) => RotaryAPI.mediaProxy(path);

// Resolve true/false once we know whether an image URL actually loads.
export function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
    setTimeout(() => finish(false), 6000);
  });
}

/* Optional click-through for a banner / advertisement row: the admin can attach
   EITHER an external link OR an uploaded document (link wins, both may be null).
   Unlike the banner IMAGE, the document needs no legacy-group rewrite — it is
   only ever written by the NEW admin into the API's own /uploads/{banner,
   advertisement}/, which the media host serves as-is. A link typed without a
   scheme ("www.x.org") must be forced absolute or the browser treats it as a
   same-site path. undefined = plain slide, no anchor. */
function clickThroughUrl(row: any): string | undefined {
  const link = String(row.linkUrl || row.LinkUrl || '').trim();
  if (link) return /^(https?:)?\/\//i.test(link) ? link : 'https://' + link;
  const doc = row.documentPath || row.DocumentPath;
  return doc ? resolveMedia(doc) : undefined;
}

// The per-YEAR Rotary theme banner (assets/img/themes/<yearLabel>.png).
function themeBannerUrl(): string {
  const lbl = config.yearLabel || '';
  return lbl ? '/default/assets/img/themes/' + lbl + '.png' : '';
}

// Hero: show the district's uploaded banners for the selected year whenever
// banner RECORDS exist. Fall back to the YEAR THEME banner, then the generic
// default — never a broken image, never another year's banner.
export function loadHeroSlides(): Promise<HeroSlide[]> {
  if (!RotaryAPI.get) return Promise.resolve(fallbackHero);

  const themeUrl = themeBannerUrl();
  const fallbackP: Promise<HeroSlide[]> = themeUrl
    ? probeImage(themeUrl).then((ok) =>
        ok ? [{ image: themeUrl, alt: 'Rotary theme', fallback: fallbackHero[0].image }] : fallbackHero,
      )
    : Promise.resolve(fallbackHero);

  // _t cache-buster so a just-uploaded banner isn't hidden by the proxy/browser cache.
  const bannersP = RotaryAPI.get(
    '/api/districts/' + config.districtId + '/website-data/banners',
    { yearId: config.yearId, _t: Date.now() },
  ).catch(() => []);

  return Promise.all([bannersP, fallbackP]).then((r) => {
    const rows = r[0] as any[];
    const fb = r[1] as HeroSlide[];
    const banners = (rows || []).filter((b) => b.bannerImagePath || b.BannerImagePath);
    if (!banners.length) return fb;
    // Resolve each banner to a URL that ACTUALLY loads: legacy website-group path,
    // then the API's own path via the proxy, then the theme/default.
    return Promise.all(
      banners.map((row) => {
        const b = row.bannerImagePath || row.BannerImagePath;
        const href = clickThroughUrl(row);
        const candidates: string[] = [];
        const legacy = (RotaryAPI.bannerUrl && RotaryAPI.bannerUrl(b)) || '';
        if (legacy) candidates.push(legacy);
        candidates.push(mediaProxy(b));
        return (function pick(i): Promise<HeroSlide> {
          if (i >= candidates.length)
            return Promise.resolve({ image: fb[0].image, alt: 'District banner', fallback: fb[0].image, href });
          return probeImage(candidates[i]).then((ok) =>
            ok
              ? { image: candidates[i], alt: 'District banner', fallback: fb[0].image, href }
              : pick(i + 1),
          );
        })(0);
      }),
    );
  });
}

// District advertisements (often empty).
export function loadAds(): Promise<HeroSlide[]> {
  if (!RotaryAPI.get) return Promise.resolve([]);
  return RotaryAPI.get('/api/districts/' + config.districtId + '/website-data/advertisements', {
    yearId: config.yearId,
  })
    .then((rows: any[]) =>
      (rows || [])
        .map((a) => {
          const p = a.advertisementImagePath || a.imagePath || a.AdvertisementImagePath;
          return p
            ? { image: mediaProxy(p), alt: 'Advertisement', href: clickThroughUrl(a), fallback: fallbackAds[0].image }
            : null;
        })
        .filter(Boolean) as HeroSlide[],
    )
    .catch(() => []);
}

/* --------------------------- district-owned projects --------------------------- */
export function loadDistrictProjects(): Promise<any[]> {
  if (!RotaryAPI.districtOwnedProjects) return Promise.resolve([]);
  return RotaryAPI.districtOwnedProjects(config.yearId)
    .then((rows: any[]) => {
      rows = rows || [];
      rows.sort((a, b) => +new Date(b.projectDate || 0) - +new Date(a.projectDate || 0));
      return rows;
    })
    .catch(() => []);
}

/* --------------------------- district events ---------------------------
   Admin-entered district-level events. yearId passed explicitly: the endpoint
   UNIONs per-year tables when omitted (same collation-500 risk as projects). */
export function loadDistrictEvents(): Promise<any[]> {
  return RotaryAPI.get('/api/districts/' + config.districtId + '/district-events', {
    yearId: config.yearId,
    pageSize: 50,
  })
    .then((r: any) => {
      const rows = (r && r.items) || (Array.isArray(r) ? r : []);
      rows.sort((a: any, b: any) => +new Date(b.eventDate || 0) - +new Date(a.eventDate || 0));
      return rows;
    })
    .catch(() => []);
}

/* --------------------------- district snapshot --------------------------- */
export function loadDistrictSnapshot(): Promise<SnapshotData> {
  const aggP = (RotaryAPI.districtProjects ? RotaryAPI.districtProjects() : Promise.resolve([]))
    .then((rows: any) => {
      rows = Array.isArray(rows) ? rows : (rows && rows.items) || [];
      let ben = 0, hrs = 0, cost = 0, projectCount = 0;
      rows.forEach((r: any) => {
        ben += Number(r.beneficiaries) || 0;
        hrs += Number(r.manHours) || 0;
        cost += Number(r.amountSpent) || 0;
        if (String(r.moduleKey || '').trim().toLowerCase() !== 'club_service') projectCount++;
      });
      return { projects: projectCount, beneficiaries: ben, manHours: hrs, cost };
    })
    .catch(() => ({ projects: 0, beneficiaries: 0, manHours: 0, cost: 0 }));
  const clubsP = (RotaryAPI.clubFinder ? RotaryAPI.clubFinder({ page: 1, pageSize: 1 }) : Promise.resolve(null))
    .then((res: any) => (res && res.totalCount) || 0)
    .catch(() => 0);
  // Distinct ACTIVE member headcount. /api/Districts/{id} returns TotalMembers =
  // COUNT(DISTINCT active member) — each person once, even across multiple clubs.
  // districtMembers().totalCount counts PER-MEMBERSHIP (a multi-club member N
  // times), so it over-counts; the district record's distinct count is correct.
  const membersP = RotaryAPI.district()
    .then((d: any) => (d && d.totalMembers) || 0)
    .catch(() => 0);
  return Promise.all([aggP, clubsP, membersP]).then((r) => {
    const a: any = r[0] || {};
    return {
      projects: a.projects || 0,
      beneficiaries: a.beneficiaries || 0,
      manHours: a.manHours || 0,
      cost: a.cost || 0,
      totalClubs: r[1] || 0,
      totalMembers: r[2] || 0,
    };
  });
}

/* --------------------------- dignitaries --------------------------- */
// RI President -> dignitaries[0].
export function loadPresident(): Promise<Dignitary | null> {
  return RotaryAPI.internationalPresident()
    .then((p: any) => {
      if (!p || !p.name) return null;
      return {
        name: (p.name || '').trim(),
        role: 'President',
        term: 'Rotary International ' + (p.yearLabel || config.yearLabel),
        club: '',
        photo: resolveMedia(p.profilePhotoPath || p.profilePhoto),
        message: p.description || '',
      };
    })
    .catch(() => null);
}

// FALLBACK DG source: the committee roster. Prefer the member record's photo
// (the committee row's profilePhoto is unreliable / sometimes 404s).
function governorFromCommittee(): Promise<Dignitary | null> {
  return RotaryAPI.get('/api/districts/' + config.districtId + '/committee/members', {
    yearId: config.yearId,
  })
    .then((res: any) => {
      const items = (res && res.items) || res || [];
      const dg = items.filter((i: any) => RotaryAPI.isDistrictGovernor(i.districtDesignation))[0];
      if (!dg) return null;
      const base: Dignitary = {
        name: (dg.name || '').trim() || 'District Governor',
        role: 'District Governor',
        term: dg.yearLabel || config.yearLabel,
        club: dg.clubName || '',
        photo: resolveMedia(dg.profilePhoto || dg.profile_photo || dg.ProfilePhotoPath || dg.committeePhoto),
      };
      const mid = dg.memberId || dg.fk_member_id || dg.pk_member_master_profile_id;
      if (!mid) return base;
      return RotaryAPI.get('/api/members/' + mid)
        .then((m: any) => {
          const pp = m && (m.profilePhotoPath || m.ProfilePhotoPath);
          // memberIntroduction is the /dignitary page's bio fallback for this path.
          return { ...base, photo: pp ? resolveMedia(pp) : base.photo, message: (m && m.memberIntroduction) || '' };
        })
        .catch(() => base);
    })
    .catch(() => null);
}

// District Governor -> dignitaries[1]. Authoritative public endpoint first,
// committee roster as the fallback.
export function loadGovernor(): Promise<Dignitary | null> {
  return RotaryAPI.districtGovernor(config.yearId)
    .then((g: any) => {
      if (!g || !g.memberName) return governorFromCommittee();
      return {
        name: (g.memberName || '').trim(),
        role: 'District Governor',
        term: g.yearLabel || config.yearLabel,
        club: '',
        photo: resolveMedia(g.profilePhoto || g.profilePhotoPath),
        message: g.description || '',
      } as Dignitary;
    })
    .catch(() => governorFromCommittee());
}

/* --------------------------- formatting helpers --------------------------- */
export function snapNum(n: any): string {
  return Number(n || 0).toLocaleString('en-IN');
}
export function snapMoney(n: any): string {
  n = Number(n || 0);
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}
export function eventDateLabel(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return d.toDateString();
  }
}
