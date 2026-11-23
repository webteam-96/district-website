/* detailSources.ts — PURE payload → `Detail` mappers for the five things the
   site shows a detail ("view") page for: club projects (the original
   ProjectDetail.aspx port), district-owned projects, district events, club
   events and upcoming events. Detail.tsx owns the fetching and renders whatever
   comes back here.

   Pure on purpose — no api/client import — so detailSources.selfcheck.ts runs
   under bare node. Consequences, both handled in Detail.tsx: `images` are RAW
   API paths (the component runs them through RotaryAPI.mediaProxy), and an
   empty `owner` means "this district" (the component fills in its name).

   Endpoint quirks worth knowing (verified live against district 3011):
   - district project / district event rows live in YEAR-PARTITIONED tables, so
     their detail route needs the row's OWN yearId (?year= carries it from the
     card). Wrappers differ: { project, photos } vs { eventDetail, photos }.
   - the club-event detail route drops the clubId segment its list uses, returns
     the event FLAT, is not year-scoped, and has ONE image (no gallery).
   - district PROJECT detail returns areaOfFocusId/categoryId — ids, not names
     (only the list carries names), so those rows get no badge. */

export type DetailKind =
  | 'club-project'
  | 'district-project'
  | 'district-event'
  | 'club-event'
  | 'upcoming-event';

/* A gallery photo. `caption` is the admin's per-photo description — every photo
   feed carries one, and it is usually empty. */
export interface Photo {
  path: string;
  caption: string;
}

export interface Detail {
  title: string;
  description: string;
  /* Who ran it + what to call them. '' = this district (Detail.tsx names it). */
  owner: string;
  ownerLabel: string;
  location: string;
  /* Gold pill in the banner (area of focus). '' hides it. */
  badge: string;
  /* ISO date; `withTime` is true only when the source records a real time. */
  date: string;
  withTime: boolean;
  cost: number | null;
  beneficiaries: number | null;
  manHours: number | null;
  rotarians: number | null;
  /* RAW API image paths + captions — Detail.tsx proxies the paths. */
  images: Photo[];
  registrationLink: string;
  contact: { name: string; email: string; mobile: string } | null;
  /* Club that owns this row, when there is one — the detail page uses it to load
     the club's President/Secretary. '' for district-owned rows. */
  clubId: string;
  /* Where the "Back to …" link goes; resolved per row (a club event knows its
     club, so it can point at that club's profile). */
  backTo: string;
  backLabel: string;
}

/* ------------------------------- helpers ------------------------------- */
// Photo rows -> Photo[]. Primary first (district projects + public club projects
// flag one), then the admin's sortOrder.
function photos(rows: any[]): Photo[] {
  return (rows || [])
    .slice()
    .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((p) => ({ path: String(p.imagePath || p.ImagePath || ''), caption: p.description || '' }))
    .filter((p) => p.path);
}

// True when the timestamp carries a real clock time (midnight = date-only).
// Read off the STRING, not a Date: getHours() is local time, so the day the
// backend starts emitting a 'Z' every date-only event would grow a 5:30 am.
function hasTime(s: any): boolean {
  const m = /T(\d{2}):(\d{2})/.exec(String(s || ''));
  return !!m && m[1] + m[2] !== '0000';
}

// Non-numeric junk ('n/a', '1,200') must read as "no value", not NaN — a NaN
// passes every `!= null` gate downstream and renders as "₹NaN".
function num(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* --------------------------------- maps --------------------------------- */
// Club project — /api/public/projects/{id}. Mirrors the aspx mapDetail().
export function mapClubProject(d: any): Detail | null {
  if (!d || !d.project) return null;
  const p = d.project;
  return {
    title: p.title || 'Untitled Project',
    description: p.description || '',
    owner: p.clubName || '',
    ownerLabel: 'Rotary Club',
    location: [p.location, p.clubCity, p.clubState].filter(Boolean).join(', '),
    badge: p.areaOfFocus || '',
    date: p.projectDate || '',
    withTime: false,
    cost: num(p.projectCost),
    beneficiaries: num(p.directBeneficiaries),
    manHours: num(p.manHours),
    rotarians: num(p.rotariansInvolved),
    images: photos(d.photos),
    registrationLink: '',
    contact: null,
    clubId: p.clubId != null ? String(p.clubId) : '',
    // Unchanged from the original ProjectDetail: the club-projects page opens on
    // its Community Service tab.
    backTo: '/projects?category=community-service',
    backLabel: 'Back to Projects',
  };
}

// District-owned project — /api/districts/{d}/projects/{yearId}/{id}.
export function mapDistrictProject(d: any): Detail | null {
  if (!d || !d.project) return null;
  const p = d.project;
  return {
    title: p.title || 'Untitled Project',
    description: p.description || '',
    owner: '',
    ownerLabel: 'Rotary District',
    location: p.location || '',
    badge: '',
    date: p.projectDate || '',
    withTime: false,
    // amountSpent is the better number when present; projectCost is the budget.
    cost: num(p.amountSpent) != null ? num(p.amountSpent) : num(p.projectCost),
    beneficiaries: num(p.directBeneficiaries),
    manHours: num(p.manHours),
    rotarians: num(p.rotariansInvolved),
    images: photos(d.photos),
    registrationLink: '',
    contact: null,
    clubId: '',
    backTo: '/',
    backLabel: 'Back to Home',
  };
}

// District event — /api/districts/{d}/district-events/{yearId}/{id}.
// `location` only arrives once the backend fix ships (district events sit in the
// same year table as district projects and have always HAD a location column;
// the detail SELECT just never returned it — DistrictModulesController.cs:1517).
// Absent = the Location card is simply not rendered. No fees/times/link exist on
// this module at all.
export function mapDistrictEvent(d: any): Detail | null {
  if (!d || !d.eventDetail) return null;
  const e = d.eventDetail;
  return {
    title: e.title || 'District Event',
    description: e.description || '',
    owner: '',
    ownerLabel: 'Rotary District',
    location: e.location || '',
    badge: '',
    date: e.eventDate || '',
    withTime: hasTime(e.eventDate),
    cost: null,
    beneficiaries: null,
    manHours: null,
    rotarians: null,
    images: photos(d.photos),
    registrationLink: '',
    contact: null,
    clubId: '',
    backTo: '/',
    backLabel: 'Back to Home',
  };
}

// Upcoming event — /api/districts/{d}/upcoming-events/{id}. NOT the
// district-events module: this is the `upcoming_events` table, which is what the
// calendars' District Events tab lists. Same table the club-event route reads —
// but that route inner-joins club_master, so these district rows (fk_club_id 0)
// 404 there and need their own source. Carries a venue and a registration link;
// no organiser, one image.
export function mapUpcomingEvent(e: any): Detail | null {
  if (!e || !e.id) return null;
  return {
    title: e.title || 'District Event',
    description: e.description || '',
    owner: '',
    ownerLabel: 'Rotary District',
    location: e.eventVenue || '',
    badge: '',
    date: e.eventDate || '',
    withTime: hasTime(e.eventDate),
    cost: null,
    beneficiaries: null,
    manHours: null,
    rotarians: null,
    images: e.imagePath ? [{ path: String(e.imagePath), caption: '' }] : [],
    registrationLink: e.registrationLink || '',
    contact: null,
    clubId: '',
    backTo: '/',
    backLabel: 'Back to Home',
  };
}

// Club event — /api/mobile/club-finder/events/{eventId} (flat, single image).
export function mapClubEvent(e: any): Detail | null {
  if (!e || !e.eventId) return null;
  return {
    title: e.title || 'Event',
    description: e.description || '',
    owner: e.clubName ? 'Rotary Club of ' + e.clubName : '',
    ownerLabel: 'Rotary Club',
    location: e.venue || '',
    badge: '',
    date: e.eventDate || '',
    withTime: hasTime(e.eventDate),
    cost: null,
    beneficiaries: null,
    manHours: null,
    rotarians: null,
    images: e.imagePath ? [{ path: String(e.imagePath), caption: '' }] : [],
    registrationLink: e.registrationLink || '',
    contact:
      e.organizerName || e.organizerEmail || e.organizerMobile
        ? { name: e.organizerName || '', email: e.organizerEmail || '', mobile: e.organizerMobile || '' }
        : null,
    clubId: e.clubId ? String(e.clubId) : '',
    backTo: e.clubId ? '/club?id=' + encodeURIComponent(e.clubId) : '/club-finder',
    backLabel: e.clubName ? 'Back to ' + e.clubName : 'Back to Club Finder',
  };
}
