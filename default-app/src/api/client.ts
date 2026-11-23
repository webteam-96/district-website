/* ==========================================================================
   Rotary District — API client  (TypeScript port of the ASPX js/api/client.js)
   Faithful 1:1 port. Talks to the live REST API at rizones45678.org/API.

   TOKEN HANDLING (the one deploy-shaped difference from the JS original):
   - PRODUCTION (vite build): requests go same-origin through /ApiProxy.ashx,
     which injects the bearer token server-side (token in Web.config, NEVER in
     the browser). Media for the WebGL galleries goes through /MediaProxy.ashx
     so it is same-origin (WebGL taints a cross-origin canvas otherwise).
   - DEV (npm run dev): there is no .ashx handler, so we hit the API directly
     with the token from .env.local (VITE_API_TOKEN). The API is CORS-open, so
     direct browser fetch — including CORS-clean WebGL textures — works locally.
   ========================================================================== */

import { buildNav, listOf, type MenuRow, type SubMenuRow } from './menus';

const IS_PROD = import.meta.env.PROD;
/* THEMES ('Default' theme, /default/): on this computer the data comes through the themes' own live-data
   server (/live-api, it adds the key); on the demo, /ApiProxy.ashx and /MediaProxy.ashx are forwarded to the
   live website's own proxies (vercel.json). */
const ON_THIS_COMPUTER = /^(localhost|127.0.0.1)$/.test((typeof location !== 'undefined' && location.hostname) || '');

export interface RotaryConfig {
  base: string;
  proxy: string | null;
  token: string;
  districtId: number | null;
  districtNumber: string;
  refClubId: number;
  mediaBase: string;
  yearLabel: string;
  yearId?: number | null;
  currentYearId?: number;
  currentYearLabel?: string;
  districtName?: string;
  districtLogo?: string;
  unresolved?: boolean;
  years?: any[];
}

// The Rotary year runs 1 July – 30 June; its label is "<startYear>-<endYY>"
// (e.g. any date on/after 1 Jul 2026 -> "2026-27", before that -> "2025-26").
// Deriving the CURRENT year from the calendar — NOT from the backend's isCurrent
// flag — is what makes the site roll over to the new year automatically at local
// midnight on 1 July, even if the API hasn't flipped the flag yet or a cached
// year list is briefly stale. This is the single source of truth for "what year
// is it now"; no year value is hardcoded anywhere.
function rotaryYearLabelForDate(d?: Date): string {
  d = d || new Date();
  const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; // getMonth() 6 = July
  return startYear + '-' + ('0' + ((startYear + 1) % 100)).slice(-2);
}

const config: RotaryConfig = {
  base: 'https://rizones45678.org/API',
  // Same-origin proxy in prod (token added server-side); direct in dev.
  proxy: IS_PROD ? (ON_THIS_COMPUTER ? '/live-api' : '/ApiProxy.ashx') : null,
  token: IS_PROD ? '' : import.meta.env.VITE_API_TOKEN || '',

  // District identity (THEMES: Rotary District 3141, the district these themes are made for)
  districtId: 490,
  districtNumber: '3141',
  // Reference club used by the public/club/* endpoints (RI President, etc.).
  refClubId: 34297,
  // Media base for /Documents/* asset paths (404 without the /API segment).
  mediaBase: 'https://rizones45678.org/API',

  // Current Rotary year LABEL, computed from today's date (self-updates at the
  // 1 July rollover). The numeric yearId is resolved from the live API at boot.
  yearLabel: rotaryYearLabelForDate(),
};

/* WORKAROUND for a backend path bug: each district's banners and Governor's
   Monthly Letters physically live under /Documents/WebsiteData/Group{N}/ on
   rotaryindia.org, but the API returns banner paths as /uploads/banner/* and GML
   paths as Group{districtId}/* (both 404), and never exposes this group id. These
   ids are harvested from the districts' existing legacy sites. Remove this map +
   the *Url() helpers once the API returns correct media paths. */
const DISTRICT_GROUPS: Record<string, string> = {
  '2981': '31689', '2982': '31157', '3000': '31690', '3011': '31091', '3012': '31092', '3020': '32020',
  '3030': '31085', '3040': '31370', '3053': '32021', '3055': '34307', '3056': '34308', '3060': '31234',
  '3070': '31525', '3080': '31709', '3090': '31115', '3100': '31680', '3110': '31116', '3120': '31691',
  '3131': '31683', '3132': '31552', '3141': '31093', '3142': '31072', '3150': '31138', '3160': '31096',
  '3170': '31685', '3181': '31303', '3182': '31094', '3191': '34309', '3192': '34310', '3203': '31095',
  '3204': '33415', '3205': '35015', '3206': '34991', '3211': '31681', '3212': '31687', '3231': '31114',
  '3233': '31682', '3234': '34732', '3240': '31113', '3250': '31088', '3261': '31684', '3262': '31375',
  '3291': '31083',
};
// District header logos ("Rotary Dist NNNN") — the API returns districtLogoPath
// null, so these full URLs are harvested from the districts' legacy sites.
const DISTRICT_LOGOS: Record<string, string> = {
  '2981': 'https://rotaryindia.org/Documents/WebsiteData/Group31689/LOGO/UpperLogo030520240456492989307PM.png',
  '2982': 'https://rotaryindia.org/Documents/WebsiteData/Group31157/LOGO/UpperLogo030520240459251122790PM.png',
  '3000': 'https://rotaryindia.org/Documents/WebsiteData/Group31690/LOGO/UpperLogo030520240510119432851PM.png',
  '3011': 'https://rotaryindia.org/Documents/WebsiteData/Group31091/LOGO/UpperLogo030520240513523814219PM.png',
  '3012': 'https://rotaryindia.org/Documents/WebsiteData/Group31092/LOGO/UpperLogo030520240543313348299PM.png',
  '3020': 'https://rotaryindia.org/Documents/WebsiteData/Group32020/LOGO/UpperLogo030520240600594633488PM.png',
  '3030': 'https://rotaryindia.org/Documents/WebsiteData/Group31085/LOGO/UpperLogo030520240604037453816PM.png',
  '3040': 'https://rotaryindia.org/Documents/WebsiteData/Group31370/LOGO/UpperLogo030520240606050896432PM.png',
  '3053': 'https://rotaryindia.org/Documents/WebsiteData/Group32021/LOGO/UpperLogo030520240610239973244PM.png',
  '3055': 'https://rotaryindia.org/Documents/WebsiteData/Group34307/LOGO/UpperLogo030520240618480777387PM.png',
  '3056': 'https://rotaryindia.org/Documents/WebsiteData/Group34308/LOGO/UpperLogo030520240622043284655PM.png',
  '3060': 'https://rotaryindia.org/Documents/WebsiteData/Group31234/LOGO/UpperLogo030520240625217514940PM.png',
  '3070': 'https://rotaryindia.org/Documents/WebsiteData/Group31525/LOGO/UpperLogo030520240631027683186PM.png',
  '3080': 'https://rotaryindia.org/Documents/WebsiteData/Group31709/LOGO/UpperLogo030520240634544099954PM.png',
  '3090': 'https://rotaryindia.org/Documents/WebsiteData/Group31115/LOGO/UpperLogo030520240635428165404PM.png',
  '3100': 'https://rotaryindia.org/Documents/WebsiteData/Group31680/LOGO/UpperLogo030520240639333020021PM.png',
  '3110': 'https://rotaryindia.org/Documents/WebsiteData/Group31116/LOGO/UpperLogo260720241210139305155PM.png',
  '3120': 'https://rotaryindia.org/Documents/WebsiteData/Group31691/LOGO/UpperLogo030520240644556626029PM.png',
  '3131': 'https://rotaryindia.org/Documents/WebsiteData/Group31683/LOGO/UpperLogo030520240648121638588PM.png',
  '3132': 'https://rotaryindia.org/Documents/WebsiteData/Group31552/LOGO/UpperLogo030520240652322274130PM.png',
  '3141': 'https://rotaryindia.org/Documents/WebsiteData/Group31093/LOGO/UpperLogo030520240653590088347PM.png',
  '3142': 'https://rotaryindia.org/Documents/WebsiteData/Group31072/LOGO/UpperLogo030520240453020947672PM.png',
  '3150': 'https://rotaryindia.org/Documents/WebsiteData/Group31138/LOGO/UpperLogo030520240656207597360PM.png',
  '3160': 'https://rotaryindia.org/Documents/WebsiteData/Group31096/LOGO/UpperLogo030520240657015877292PM.png',
  '3170': 'https://rotaryindia.org/Documents/WebsiteData/Group31685/LOGO/UpperLogo030520240658014629938PM.png',
  '3181': 'https://rotaryindia.org/Documents/WebsiteData/Group31303/LOGO/UpperLogo030520240659192917671PM.png',
  '3182': 'https://rotaryindia.org/Documents/WebsiteData/Group31094/LOGO/UpperLogo030520240659566510230PM.png',
  '3191': 'https://rotaryindia.org/Documents/WebsiteData/Group34309/LOGO/UpperLogo120920250737240087837AM.png',
  '3192': 'https://rotaryindia.org/Documents/WebsiteData/Group34310/LOGO/UpperLogo040520240249233531560PM.png',
  '3203': 'https://rotaryindia.org/Documents/WebsiteData/Group31095/LOGO/UpperLogo040520240300241529011PM.png',
  '3204': 'https://rotaryindia.org/Documents/WebsiteData/Group33415/LOGO/UpperLogo040520240302356690289PM.png',
  '3205': 'https://rotaryindia.org/Documents/WebsiteData/Group35015/LOGO/UpperLogo311020250444269586447PM.png',
  '3206': 'https://rotaryindia.org/Documents/WebsiteData/Group34991/LOGO/UpperLogo020720251211526880902PM.png',
  '3211': 'https://rotaryindia.org/Documents/WebsiteData/Group31681/LOGO/UpperLogo040520240307411859505PM.png',
  '3212': 'https://rotaryindia.org/Documents/WebsiteData/Group31687/LOGO/UpperLogo040520240310501394740PM.png',
  // 3220 has no logo on the legacy site (districtLogoPath null); supplied by the district.
  '3220': '/default/assets/img/3220.png',
  '3231': 'https://rotaryindia.org/Documents/WebsiteData/Group31114/LOGO/UpperLogo040520240319382824578PM.png',
  '3233': 'https://rotaryindia.org/Documents/WebsiteData/Group31682/LOGO/UpperLogo010720240410598720353PM.png',
  '3234': 'https://rotaryindia.org/Documents/WebsiteData/Group34732/LOGO/UpperLogo010720240436000464055PM.png',
  '3240': 'https://rotaryindia.org/Documents/WebsiteData/Group31113/LOGO/UpperLogo040520240322388301016PM.png',
  '3250': 'https://rotaryindia.org/Documents/WebsiteData/Group31088/LOGO/UpperLogo040520240324316275086PM.png',
  '3261': 'https://rotaryindia.org/Documents/WebsiteData/Group31684/LOGO/UpperLogo030520240655247125897PM.png',
  '3262': 'https://rotaryindia.org/Documents/WebsiteData/Group31375/LOGO/UpperLogo030520240650205550877PM.png',
  '3291': 'https://rotaryindia.org/Documents/WebsiteData/Group31083/LOGO/UpperLogo030520240646093659485PM.png',
};
function groupOf(): string { return DISTRICT_GROUPS[String(config.districtNumber)] || ''; }
function logoOf(): string { return DISTRICT_LOGOS[String(config.districtNumber)] || ''; }
function baseName(p: any): string { return String(p || '').split(/[\\/]/).pop() || ''; }
config.districtLogo = logoOf(); // default district's header logo (updated on tenant resolve)

function buildUrl(path: string, params?: Record<string, any> | null): string {
  let qs = '';
  if (params) {
    const parts: string[] = [];
    Object.keys(params).forEach(function (k) {
      const v = params[k];
      if (v === undefined || v === null || v === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    qs = parts.length ? '?' + parts.join('&') : '';
  }
  if (config.proxy) {
    return config.proxy + '?path=' + encodeURIComponent(path + qs);
  }
  return config.base + path + qs;
}

// Low-level fetch — does NOT wait for tenant resolution. Used internally to
// bootstrap the district, and by the public `request` once we're ready.
function rawRequest(path: string, params?: Record<string, any> | null, options?: any): Promise<any> {
  options = options || {};
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!config.proxy && config.token) {
    headers.Authorization = 'Bearer ' + config.token;
  }
  return fetch(buildUrl(path, params), {
    method: options.method || 'GET',
    headers: headers,
  }).then(function (res) {
    if (!res.ok) {
      const err: any = new Error('API ' + res.status + ' for ' + path);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    return ct.indexOf('application/json') !== -1 ? res.json() : res.text();
  });
}

/* ----------------------------------------------------------------------
   MULTI-TENANT RESOLUTION
   One deployment serves every district. Production: the SUBDOMAIN decides
   (rid3011.rotaryindia.org → "3011"). For local testing without subdomains,
   ?district=3011 (or a /3011/ path segment) also works and is remembered
   across page-to-page navigation (sessionStorage).
   Resolution order: subdomain → path segment → ?district= → remembered → default.
   ---------------------------------------------------------------------- */
const DEV_KEY = 'rid-dev-district';

function numFromSubdomain(): string | null {
  const host = ((window.location && window.location.hostname) || '').split(':')[0];
  if (!host || /^[0-9.]+$/.test(host)) return null; // ignore bare IPs / empty
  const m = /(?:^|[^0-9])(\d{3,5})(?:[^0-9]|$)/.exec(host);
  return m ? m[1] : null;
}
function numFromPath(): string | null {
  const loc = window.location || ({} as Location);
  const segs = ((loc.pathname || '') + '').split('/').filter(Boolean);
  return segs.length && /^\d{3,5}$/.test(segs[0]) ? segs[0] : null;
}
function numFromQuery(): string | null {
  const loc = window.location || ({} as Location);
  try {
    const q = new URLSearchParams(loc.search || '');
    const v = q.get('district') || q.get('d');
    return v && /^\d{3,5}$/.test(v) ? v : null;
  } catch (e) {
    return null;
  }
}
function remember(num: string) {
  try {
    window.sessionStorage.setItem(DEV_KEY, num);
  } catch (e) {}
}
function recall(): string | null {
  try {
    return window.sessionStorage.getItem(DEV_KEY);
  } catch (e) {
    return null;
  }
}

// Returns the district number for this request, or null to use the default.
function resolveDistrictNumber(): string | null {
  const sub = numFromSubdomain();
  if (sub) return sub; // production — never overridden by query/path
  const dev = numFromPath() || numFromQuery();
  if (dev) {
    remember(dev); // persist so further navigation keeps the district
    return dev;
  }
  return recall(); // a district set earlier this session
}

let readyPromise: Promise<any> | null = null;
function resolveTenant(): Promise<any> {
  const num = resolveDistrictNumber();

  // A subdomain that NAMES a district (e.g. rid3292) is UNRESOLVED until we
  // confirm it exists in the platform. Assume unresolved up front — with a null
  // districtId — so a district that isn't built yet renders BLANK (a "coming
  // soon" screen) instead of silently falling back to the DEFAULT district's
  // data. Cleared on a hit below. (num null = no subdomain, e.g. local dev →
  // keep the default district so testing still works.)
  if (num) {
    config.unresolved = true;
    config.districtNumber = String(num);
    config.districtId = null;
    config.districtName = '';
  }

  // 1. district number → numeric districtId (+ confirm it exists).
  const pId: Promise<any> = num
    ? rawRequest('/api/Districts', { page: 1, pageSize: 500 })
        .then(function (res) {
          const items = (res && res.items) || res || [];
          const row = items.filter(function (d: any) {
            return String(d.districtNumber) === String(num);
          })[0];
          if (row && row.id) {
            config.unresolved = false;
            config.districtNumber = String(num);
            config.districtId = row.id;
            config.districtName = 'Rotary District ' + num;
            config.districtLogo = logoOf() || row.districtLogoPath || row.DistrictLogoPath || '';
          }
          // No matching row → stays unresolved (blank), never the default district.
        })
        .catch(function () {}) // Districts fetch failed → stays unresolved (blank)
    : Promise.resolve();

  // 2. Rotary years: resolve the CURRENT year (by CALENDAR), then apply the
  //    user's selected year for this session (year dropdown stores a short label
  //    like "2024-25" in sessionStorage). Data endpoints use config.yearId.
  const pYear = rawRequest('/api/rotary-years')
    .then(function (res) {
      const years = (res && res.items) || res || [];
      config.years = years;
      const todayLabel = rotaryYearLabelForDate();
      const current =
        years.filter(function (y: any) { return y.yearLabel === todayLabel; })[0] ||
        years.filter(function (y: any) { return y.isCurrent; })[0];
      if (current) {
        config.currentYearId = current.id;
        config.currentYearLabel = current.yearLabel;
        config.yearId = current.id; // default = current
        config.yearLabel = current.yearLabel;
      }
      let selected: string | null = null;
      try { selected = window.sessionStorage.getItem('rid-year'); } catch (e) {}
      if (selected) {
        const row = years.filter(function (y: any) { return y.yearLabel === selected; })[0];
        if (row && row.id) {
          config.yearId = row.id;
          config.yearLabel = row.yearLabel;
        }
      }
    })
    .catch(function () {});

  return Promise.all([pId, pYear]).then(function () {
    // 3. reference club for this district (pick the first club).
    return rawRequest('/api/mobile/club-finder', {
      districtNumber: config.districtNumber,
      page: 1,
      pageSize: 1,
    })
      .then(function (res) {
        const c = res && res.items && res.items[0];
        if (c && c.clubId) config.refClubId = c.clubId;
      })
      .catch(function () {});
  });
}

/** Resolves once the tenant district + current year are known. */
function ready(): Promise<any> {
  if (!readyPromise) readyPromise = resolveTenant();
  return readyPromise;
}

// Public request — waits for tenant resolution so config.districtId /
// districtNumber / refClubId are correct before any page fetches data.
function request(path: string, params?: Record<string, any> | null, options?: any): Promise<any> {
  return ready().then(function () {
    return rawRequest(path, params, options);
  });
}

/* ------------------------------ media helpers ------------------------------
   Centralised here (the ASPX did this per-page). mediaUrl = direct absolute URL
   for ordinary <img> (member/dignitary photos; CORS irrelevant). mediaProxy =
   same-origin via /MediaProxy.ashx in PROD so WebGL galleries don't taint the
   canvas; direct (CORS-clean) in DEV. */
function mediaUrl(path: any): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = config.mediaBase || 'https://rizones45678.org/API';
  return path.charAt(0) === '/' ? base + path : base + '/' + path;
}
function mediaProxy(path: any): string {
  if (!path) return '';
  let p = String(path);
  if (/^https?:\/\//.test(p)) {
    try {
      const u = new URL(p);
      p = u.pathname + (u.search || '');
    } catch (e) {}
  }
  if (p.charAt(0) !== '/') p = '/' + p;
  // PROD: same-origin proxy (WebGL-safe). DEV: direct absolute (CORS-open API).
  return config.proxy && !ON_THIS_COMPUTER ? '/MediaProxy.ashx?path=' + encodeURIComponent(p) : config.mediaBase + p;
}

const RotaryAPI = {
  config: config,
  get: request,
  ready: ready,
  mediaUrl: mediaUrl,
  mediaProxy: mediaProxy,

  // ---- Reference data ----
  rotaryYears() {
    return request('/api/rotary-years');
  },
  currentYear() {
    return request('/api/rotary-years/current');
  },
  district(id?: number) {
    return request('/api/Districts/' + (id || config.districtId));
  },

  // ---- Clubs / Club Finder (public, district-scoped) ----
  // NOTE: club-finder pageSize caps at 100 server-side; use clubFinderAll to page.
  clubFinder(params?: Record<string, any>) {
    const p = Object.assign(
      { districtNumber: config.districtNumber, page: 1, pageSize: 100 },
      params || {},
    );
    return request('/api/mobile/club-finder', p);
  },
  clubFinderAll(filter?: Record<string, any>) {
    let acc: any[] = [];
    function page(p: number): Promise<any> {
      const params = Object.assign(
        { districtNumber: config.districtNumber, page: p, pageSize: 100 },
        filter || {},
      );
      return request('/api/mobile/club-finder', params).then(function (res) {
        const items = (res && res.items) || [];
        acc = acc.concat(items);
        const total = (res && res.totalCount) || acc.length;
        if (acc.length < total && items.length) return page(p + 1);
        return { items: acc, totalCount: total };
      });
    }
    return page(1);
  },
  club(clubId: number | string) {
    return request('/api/mobile/club-finder/' + clubId);
  },
  // ---- Club board of directors (YEAR-SCOPED) ----
  // Office bearers for the SELECTED Rotary year so the Club Leadership section
  // changes with the year selector. The club-finder detail returns
  // .president/.secretary that are NOT year-scoped (always the CURRENT year's).
  clubBoard(clubId: number | string, yearId?: number | null) {
    return request('/api/clubs/' + clubId + '/board-of-directors', {
      yearId: yearId != null ? yearId : config.yearId,
    });
  },

  // ---- District committee / governors / directory ----
  districtDirectory(rotaryYear?: string, districtNumber?: string) {
    return request('/api/district-directory/' + (districtNumber || config.districtNumber), {
      rotaryYear: rotaryYear || config.yearLabel,
    });
  },
  committeeMembers(params?: Record<string, any>) {
    return request(
      '/api/districts/' + config.districtId + '/committee/members',
      Object.assign({ yearId: config.yearId }, params || {}),
    );
  },
  // Is this committee row's designation the ACTUAL District Governor? Strict:
  // excludes vice/deputy/assistant/acting governors, nominee/elect/past, and any
  // "Governor's <aide>" advisory role; keeps "District Governor" / bare "Governor".
  isDistrictGovernor(designation?: string): boolean {
    const d = (designation || '').toLowerCase();
    if (d.indexOf('governor') === -1) return false;
    if (/governor[’'`]s/.test(d)) return false;
    return !/vice|deputy|assistant|asst|acting|nominee|elect|past|nominate|counsel|mentor|advis|aide|secretary|chair|coordinator|trainer/.test(d);
  },
  // ---- Full district member roster (the public "directory") ----
  districtMembers(params?: Record<string, any>) {
    return request(
      '/api/districts/' + config.districtId + '/members',
      Object.assign({ page: 1, pageSize: 24 }, params || {}),
    );
  },
  // ---- District committee groups (the "committees" the directory filters by) ----
  committeeGroups(params?: Record<string, any>) {
    return request(
      '/api/districts/' + config.districtId + '/committee/groups',
      Object.assign({ yearId: config.yearId, page: 1, pageSize: 200 }, params || {}),
    );
  },
  committeeGroupMembers(groupId: number | string, params?: Record<string, any>) {
    return request(
      '/api/districts/' + config.districtId + '/committee/groups/' + groupId + '/members',
      Object.assign({ page: 1, pageSize: 24 }, params || {}),
    );
  },
  // Level-3 sub-groups of a committee group + their members. Both return plain
  // arrays. Note the members route hangs off /committee/sub-groups/, NOT
  // /committee/groups/{gid}/sub-groups/.
  committeeSubGroups(groupId: number | string) {
    return request('/api/districts/' + config.districtId + '/committee/groups/' + groupId + '/sub-groups');
  },
  committeeSubGroupMembers(subGroupId: number | string) {
    return request('/api/districts/' + config.districtId + '/committee/sub-groups/' + subGroupId + '/members');
  },
  districtGovernors(params?: Record<string, any>) {
    return request('/api/district-governors', params);
  },

  // ---- Calendar (birthdays / anniversaries / events) — month-scoped ----
  districtCalendar(month: number, year: number, districtId?: number) {
    return request('/api/mobile/district-calendar/' + (districtId || config.districtId), {
      month: month,
      year: year,
    });
  },

  // ---- Projects (district-wide avenue-of-service report; moduleKey filters) ----
  districtProjects(params?: Record<string, any>) {
    return request(
      '/api/districts/' + config.districtId + '/district-report/avenue-of-service-all-clubs',
      Object.assign({ yearId: config.yearId }, params || {}),
    );
  },

  // DISTRICT-OWNED projects only. yearId is REQUIRED: the all-years path 500s on
  // the backend (Illegal mix of collations for UNION). Unwraps {items}.
  districtOwnedProjects(yearId?: number | null) {
    return request('/api/districts/' + config.districtId + '/projects', {
      yearId: yearId != null ? yearId : config.yearId,
      pageSize: 50,
    }).then(function (r) { return (r && r.items) || (Array.isArray(r) ? r : []); });
  },

  // DISTRICT-OWNED project / event DETAIL. Both live in YEAR-PARTITIONED tables,
  // so the route needs the row's yearId as a path segment (the list row carries
  // it — pass that through, don't assume the selected year).
  // Shapes: { project, photos } and { eventDetail, photos }.
  districtProject(id: number | string, yearId?: number | null) {
    return request('/api/districts/' + config.districtId + '/projects/' + (yearId != null ? yearId : config.yearId) + '/' + id);
  },
  districtEvent(id: number | string, yearId?: number | null) {
    return request('/api/districts/' + config.districtId + '/district-events/' + (yearId != null ? yearId : config.yearId) + '/' + id);
  },
  // Club event detail. NOTE the route drops the clubId segment the LIST uses,
  // and returns the event FLAT (no wrapper). Not year-scoped.
  clubEvent(eventId: number | string) {
    return request('/api/mobile/club-finder/events/' + eventId);
  },
  // Upcoming event detail (the `upcoming_events` module — what the home
  // calendar's District Events tab lists, NOT the district-events module).
  upcomingEvent(id: number | string) {
    return request('/api/districts/' + config.districtId + '/upcoming-events/' + id);
  },

  // ---- Newsletters (public, per club; default the reference club) ----
  // NOT year-scoped (per user decision): list ALL of a club's bulletins across
  // every Rotary year. WORKAROUND for a BACKEND bug: the public feed drops rows
  // where ExpiryDateTime < NOW(); newly-added newsletters get ExpiryDateTime ==
  // PublishDateTime and expire instantly. The admin LIST endpoint has no expiry
  // gate, so we use it. Unwrap {items}. See known-issues Session 9.
  clubNewsletters(clubId?: number | string) {
    return request('/api/clubs/' + (clubId || config.refClubId) + '/newsletters', {
      pageSize: 200,
    }).then(function (r) { return (r && r.items) || (Array.isArray(r) ? r : []); });
  },
  // District-level newsletters = the Governor's Monthly Letters (GMLs). GML rows
  // carry NO Rotary year (fk_year_id is 0/empty on every record), so filtering by
  // yearId returns ZERO — we fetch ALL and the Newsletters page filters by the
  // year DERIVED from each letter's publishDateTime.
  districtNewsletters() {
    return request('/api/districts/' + config.districtId + '/newsletters', {
      pageSize: 200,
    });
  },
  // Resolve a banner record path to its REAL working URL via the district's
  // website group (the API's /uploads/banner/* 404s). '' if the group is unknown.
  bannerUrl(path: any): string {
    const g = groupOf();
    return g ? 'https://rotaryindia.org/Documents/WebsiteData/Group' + g + '/BANNERS/' + baseName(path) : '';
  },
  // GMLs uploaded via the LEGACY admin live under the district's website-group
  // folder. Relative form so newsletters.js can probe it via ApiProxy.ashx?head=.
  gmlLegacyPath(path: any): string {
    const g = groupOf();
    return g ? '/Documents/ebulletin/Group' + g + '/' + baseName(path) : '';
  },
  gmlUrl(path: any): string {
    const p = this.gmlLegacyPath(path);
    return p ? config.mediaBase + p : '';
  },
  /* Photo url for a district PROJECT / EVENT row (id = that row's id).
     Third instance of the banner/GML path bug: the API hands back
     /Documents/DistrictEvent|DistrictProject/{districtId}/{file}, a convention
     the NEW admin invented — nothing migrated the legacy bytes into it, so those
     paths 404. The migrated photos sit in the club-gallery tree under the
     district's WEBSITE GROUP id: /Documents/gallery/Group{group}/Album{id}/{file}
     (verified 200 for districts 3011 and 2981). Only new uploads — GUID
     filenames — really live at the path the API returns, so those pass through.
     Remove this once the backend's 4 SELECTs build the gallery path themselves. */
  /* SECOND url to try for an `upcoming_events` image, or '' if there isn't one.
     This module has two live upload regimes and NEITHER path serves both
     (verified): rows written by the old admin sit under the district's WEBSITE
     GROUP — /Documents/Event/Group31091/… — while new ones sit under the
     districtId the API emits, /Documents/Event/Group471/…. There is no way to
     tell them apart from the row, so the gallery renders the API's path and
     swaps to this one if that 404s. */
  eventMediaAlt(path: any): string {
    const m = /^\/Documents\/Event\/Group\d+\/(.+)$/i.exec(String(path || ''));
    const g = groupOf();
    return m && g ? mediaProxy('/Documents/Event/Group' + g + '/' + m[1]) : '';
  },
  districtMedia(path: any, id: number | string): string {
    const m = /^\/Documents\/District(?:Event|Project)\/\d+\/(.+)$/i.exec(String(path || ''));
    const g = groupOf();
    if (m && g && id && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(m[1])) {
      return mediaProxy('/Documents/gallery/Group' + g + '/Album' + id + '/' + m[1]);
    }
    return mediaProxy(path);
  },

  // ---- Dynamic nav menus ----
  // Sub-menus are not inlined, so rows with subMenuCount > 0 need one extra
  // request each (usually 0–2 per district). A failed sub-menu fetch degrades to
  // "no children" rather than losing the whole nav.
  navMenus() {
    const base = '/api/districts/' + config.districtId + '/website-data/menus';
    return request(base).then(function (res: any) {
      const rows = listOf(res) as MenuRow[];
      const parents = rows.filter((r) => Number(r.subMenuCount) > 0);
      return Promise.all(
        parents.map((r) =>
          request(base + '/' + r.id + '/submenus')
            .then((s: any) => ({ id: r.id, subs: listOf(s) as SubMenuRow[] }))
            .catch(() => ({ id: r.id, subs: [] as SubMenuRow[] })),
        ),
      ).then(function (subs) {
        const byId: Record<number, SubMenuRow[]> = {};
        subs.forEach((s) => { byId[s.id] = s.subs; });
        return buildNav(rows, byId);
      });
    });
  },

  // ---- RI President (public, no auth needed) — year-specific ----
  // Try this district's club, and on ANY failure retry via a known
  // always-serviceable club (34297) — the president returned is identical.
  internationalPresident(clubId?: number | string) {
    const FALLBACK_CLUB = 34297;
    const primary = clubId || config.refClubId || FALLBACK_CLUB;
    function fetchFor(cid: number | string) {
      return request('/api/public/club/' + cid + '/international-president', { yearId: config.yearId });
    }
    return fetchFor(primary).catch(function () {
      return String(primary) === String(FALLBACK_CLUB) ? null : fetchFor(FALLBACK_CLUB);
    });
  },

  // ---- District Governor (authoritative, public, year-wise) ----
  // /api/public/club/{clubId}/district-governor?yearId= resolves the DISTRICT
  // from the club, so ANY serviceable club in the district returns THIS
  // district's governor. Try the reference club first, then probe more clubs.
  districtGovernor(yearId?: number | null) {
    const yr = yearId != null ? yearId : config.yearId;
    function tryClub(cid?: number | string): Promise<any> {
      if (!cid) return Promise.resolve(null);
      return request('/api/public/club/' + cid + '/district-governor', { yearId: yr })
        .then(function (d) { return d && d.memberName ? d : null; })
        .catch(function () { return null; });
    }
    return tryClub(config.refClubId).then(function (dg) {
      if (dg) return dg;
      return request('/api/mobile/club-finder', {
        districtNumber: config.districtNumber, page: 1, pageSize: 200,
      })
        .then(function (res) {
          const items = (res && res.items) || [];
          const ids: any[] = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i].clubId && items[i].clubId !== config.refClubId) ids.push(items[i].clubId);
          }
          const BATCH = 8;
          return (function batch(start): Promise<any> {
            if (start >= ids.length) return Promise.resolve(null);
            return Promise.all(ids.slice(start, start + BATCH).map(tryClub)).then(function (found) {
              const hit = found.filter(function (d: any) { return d; })[0];
              return hit || batch(start + BATCH);
            });
          })(0);
        })
        .catch(function () { return null; });
    });
  },

  // ---- Public projects ----
  // YEAR-SCOPED: the public-projects endpoint reuses the same numeric id across
  // Rotary years, so the id parsed from the avenue feed's publicPhotoUrl only
  // resolves to the SAME project when yearId is supplied.
  publicProject(id: number | string, yearId?: number | null) {
    return request('/api/public/projects/' + id, { yearId: yearId != null ? yearId : config.yearId });
  },

  // ---- District Citation performance (the CP Index matrix) ----
  // The spec'd public route (/api/public/district/{id}/citation/performance) is
  // NOT deployed — every variant 404s (verified 2026-08-14) — so the live
  // [Authorize] /api/citation-matrix goes FIRST (identical payload;
  // ApiProxy.ashx injects the bearer token in prod, .env.local token in dev)
  // and the public route is only the fallback for the day auth ever breaks.
  // Swap the order once the backend actually ships it.
  // Shape: { districtId, districtNumber, yearId, yearLabel,
  //          categories:[{id,name,span}], columns:[{type,questionId,title,basePoints,answerType}],
  //          rows:[{clubId,clubName,cells:{ "<type>-<qid>":{achievedDisplay,achievedNumeric,total} }}] }
  citationPerformance(yearId?: number | null) {
    const yr = yearId != null ? yearId : config.yearId;
    return request('/api/citation-matrix', { districtId: config.districtId, yearId: yr })
      .catch(function () {
        return request('/api/public/district/' + config.districtId + '/citation/performance', { yearId: yr });
      });
  },
  clubProjectsPublic(clubId: number | string, params?: Record<string, any>) {
    return request('/api/public/clubs/' + clubId + '/projects', params);
  },

  // The current Rotary year label derived from today's date (Jul 1 – Jun 30).
  currentRotaryYearLabel(): string { return rotaryYearLabelForDate(); },

  // Resolve the live current Rotary year on boot (non-blocking; updates config).
  resolveCurrentYear() {
    return RotaryAPI.currentYear()
      .then(function (y) {
        if (y && y.id) {
          config.yearId = y.id;
          config.yearLabel = y.yearLabel;
        }
        return y;
      })
      .catch(function () { /* keep defaults on failure */ });
  },
};

// Keep a global for the vendored effect modules / any legacy access parity.
(window as any).RotaryAPI = RotaryAPI;

export { config };
export default RotaryAPI;
