/* clubProfileData.ts — Club Profile data helpers + loaders, ported from the
   ASPX js/club-profile.js. Reads ?id={clubId}. All the year-scoped / workaround
   logic (leadership board, per-year projects, members paging) is kept 1:1.
   ClubProfile.tsx renders the returned DATA as JSX. */
import RotaryAPI, { config } from '../../api/client';

/* Ordinary <img> photos (member/club/leader) — direct absolute URL. Mirrors the
   aspx resolveMedia(); the brief maps that to RotaryAPI.mediaUrl. */
const resolveMedia = (p: any) => RotaryAPI.mediaUrl(p);

export interface Leader { role: string; name: string; photo: string; designation: string }
export interface ProjectRow {
  id: string;
  title: string;
  typeOfProject: string;
  projectDate: string;
  location: string;
  beneficiaries: number;
}
export interface Analysis {
  totalProjects: number;
  totalBeneficiaries: number;
  totalManHours: number;
  totalSpent: number;
  byAvenue: { label: string; count: number }[];
  projects: ProjectRow[];
}

/* ----------------------------- helpers ----------------------------- */
// Mirrors ClubProfilePage initials(): drop "Rotary/Club/of", take 2 initials.
export function initials(s: any): string {
  return String(s || '')
    .replace(/\b(Rotary|Club|of)\b/gi, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Format a "HH:mm:ss" time as a friendly "5:30 PM" label (mirrors clubs.ts).
function fmtTime(t: any): string {
  if (!t) return '';
  const parts = String(t).split(':');
  const hour = Number(parts[0]);
  const min = Number(parts[1] != null ? parts[1] : 0);
  if (!isFinite(hour)) return '';
  // "00:00:00" is the API's "not set" sentinel for meeting times — render
  // nothing rather than a misleading "12:00 AM" (the wrong-time bug).
  if (hour === 0 && (min === 0 || !isFinite(min))) return '';
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return h12 + ':' + (parts[1] != null ? parts[1] : '00') + ' ' + period;
}

export function normalizeUrl(url: any): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}

export function fmtNum(n: any): string {
  return Number(n || 0).toLocaleString('en-IN');
}
export function fmtMoney(n: any): string {
  n = Number(n || 0);
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}
function asArray(x: any): any[] {
  return Array.isArray(x) ? x : (x && x.items) || [];
}
function projIdFromUrl(u: any): string {
  const m = /\/project\/(\d+)/.exec(u || '');
  return m ? m[1] : '';
}
export function dateLabel(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Rotary year (Jul 1 – Jun 30) label for a date, e.g. 2026-09 -> "2026-27".
function rotaryYearOf(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear(), st = d.getMonth() >= 6 ? y : y - 1;
  return st + '-' + String(st + 1).slice(-2);
}
// Does a record belong to the SELECTED Rotary year? Prefer its own yearId; else
// derive from the given date. Keeps the club tabs in sync with the header selector.
function inSelectedYear(rec: any, dateStr: any): boolean {
  const cfg: any = config;
  const sel = cfg.yearLabel;
  if (!sel) return true;
  const yid = rec && (rec.yearId != null ? rec.yearId : rec.YearId);
  if (yid && yid > 0) return cfg.yearId != null && yid === cfg.yearId;
  return rotaryYearOf(dateStr) === sel;
}

// designationName is e.g. "Club President" — drop the leading "Club " for a
// cleaner card title (the section header already says "Club Leadership").
function boardRole(name: any): string {
  return String(name || 'Board Member').replace(/^club\s+/i, '');
}

// Normalize any abbreviated/partial meeting day (e.g. "Thurs", "thu.") to its full name ("Thursday").
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ALIASES: Record<string, string> = { weds: 'Wednesday', tues: 'Tuesday', thur: 'Thursday', thurs: 'Thursday' };
function normalizeDay(d: any): string {
  const s = String(d == null ? '' : d).trim().toLowerCase().replace(/\.+$/, '');
  if (!s) return '';
  if (DAY_ALIASES[s]) return DAY_ALIASES[s];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const full = DAY_NAMES[i].toLowerCase();
    if (full.indexOf(s) === 0 || s.indexOf(full) === 0) return DAY_NAMES[i];
  }
  return String(d).trim();
}

// Aggregate one club's projects (from the district avenue feed) into stats.
export function analyzeRows(rows: any[], clubName: string): Analysis {
  const mine = rows.filter((r) => r.clubName === clubName);
  const counts: Record<string, number> = {}, order: string[] = [];
  let ben = 0, hrs = 0, spent = 0;
  mine.forEach((r) => {
    const label = r.typeOfProject || 'Service';
    if (counts[label] == null) {
      counts[label] = 0;
      order.push(label);
    }
    counts[label]++;
    ben += Number(r.beneficiaries) || 0;
    hrs += Number(r.manHours) || 0;
    spent += Number(r.amountSpent) || 0;
  });
  const byAvenue = order
    .map((l) => ({ label: l, count: counts[l] }))
    .sort((a, b) => b.count - a.count);
  const projects: ProjectRow[] = mine
    .map((r) => ({
      id: projIdFromUrl(r.publicPhotoUrl),
      title: r.title,
      typeOfProject: r.typeOfProject,
      projectDate: r.projectDate,
      location: r.location,
      beneficiaries: Number(r.beneficiaries) || 0,
    }))
    .sort((a, b) => String(b.projectDate || '').localeCompare(String(a.projectDate || '')));
  return {
    totalProjects: mine.length,
    totalBeneficiaries: ben,
    totalManHours: hrs,
    totalSpent: spent,
    byAvenue,
    projects,
  };
}

// Map the live ClubDetail DTO -> the shape the page expects (mirrors clubs.ts).
function mapDetail(d: any): any {
  if (!d || !d.club) return null;
  const c = d.club;
  const from = fmtTime(c.MeetingFromTime);
  const to = fmtTime(c.MeetingToTime);
  const time = from && to ? from + ' – ' + to : to || from;
  return {
    id: String(c.pk_club_id),
    name: c.ClubName || '',
    rotaryId: c.ClubRotaryId || '',
    meetingDay: normalizeDay(c.MeetingDay),
    meetingTime: time,
    meetingAddress: c.MeetingAddress || '',
    city: c.City || '',
    state: c.State || '',
    pincode: c.Pincode || '',
    website: (d.clubWebsite && d.clubWebsite.clientDomain) || c.ClubWebsite || '',
    isActive: !!c.IsActive,
    charterDate: c.ClubCharterDate || c.CharterDate || '',
    zone: c.zoneName || c.ZoneName || '',
    lat: c.Latitude || c.latitude || '',
    lng: c.Longitude || c.longitude || '',
    // Do NOT fabricate a 'Club President'/'Club Secretary' designation: the
    // leaderCard already prints the role ("President"/"Secretary") as its title,
    // and a fabricated designation that differs from the role string renders as a
    // second subtitle line — the "directors shown twice" bug. Leave it blank
    // unless the API supplies a real, distinct designation.
    president:
      d.president && d.president.name
        ? { name: d.president.name, photo: resolveMedia(d.president.profilePhoto), designation: d.president.designation || '' }
        : null,
    secretary:
      d.secretary && d.secretary.name
        ? { name: d.secretary.name, photo: resolveMedia(d.secretary.profilePhoto), designation: d.secretary.designation || '' }
        : null,
  };
}

/* ------------------------------ loaders ------------------------------ */
// Club detail. Resolves to the mapped club, or null (→ not-found state).
export function loadClub(id: string): Promise<any> {
  if (!id) return Promise.resolve(null);
  return RotaryAPI.club(id).then(mapDetail).catch(() => null);
}

// Shared avenue analysis (one district-feed fetch, year-scoped via config.yearId)
// — drives BOTH the At-a-Glance stats and the Projects tab.
export function loadAnalysis(clubName: string): Promise<Analysis | null> {
  return RotaryAPI.districtProjects()
    .then((rows: any) => analyzeRows(asArray(rows), clubName))
    .catch(() => null);
}

// Member count for the analysis stats (cheap; the roster loads its own pages).
// excludeHonorary: honorary members are NOT counted in the club's membership
// strength (matches the roster below, which passes the same flag).
export function loadMembersCount(clubId: string): Promise<number> {
  return RotaryAPI.get('/api/mobile/club-finder/' + clubId + '/members', { page: 1, pageSize: 1, excludeHonorary: true })
    .then((r: any) => (r && r.totalCount) || 0)
    .catch(() => 0);
}

// Newsletters for the SELECTED year — admin endpoint dodges the ExpiryDateTime
// bug (see client.ts), then filter to the year + drop rows with no document.
export function loadNewsletters(clubId: string): Promise<any[]> {
  return (RotaryAPI.clubNewsletters ? RotaryAPI.clubNewsletters(clubId) : Promise.resolve([]))
    .then((res: any) =>
      asArray(res).filter(
        (n) =>
          (n.filePath || n.FilePath || n.linkUrl || n.LinkUrl) &&
          inSelectedYear(n, n.publishDateTime || n.PublishDateTime),
      ),
    )
    .catch(() => []);
}

// Club events for the SELECTED year (by event date), soonest first.
export function loadEvents(clubId: string): Promise<any[]> {
  const selYear = config.yearLabel || '';
  return RotaryAPI.get('/api/mobile/club-finder/' + clubId + '/events')
    .then((res: any) =>
      asArray(res)
        .filter((e) => !selYear || rotaryYearOf(e.eventDate) === selYear)
        .sort((a, b) => +new Date(a.eventDate || 0) - +new Date(b.eventDate || 0)),
    )
    .catch(() => []);
}

/* Club Leadership (YEAR-SCOPED board of directors).
   Source: /api/clubs/{id}/board-of-directors?yearId= — office bearers for the
   SELECTED Rotary year, so this section changes with the year selector. Falls
   back to the club-finder current officers ONLY when the selected year IS the
   current year, so a past/future year never shows the current officers.
   Resolves to { leaders, yearLabel } to render, or null to HIDE the section. */
export function loadLeadership(clubId: string, fallback: any): Promise<{ leaders: Leader[]; yearLabel: string } | null> {
  const cfg: any = config;
  function fb(): { leaders: Leader[]; yearLabel: string } | null {
    // Current-year-only fallback to the (non-year-scoped) club-finder officers.
    if (String(cfg.yearId) !== String(cfg.currentYearId)) return null;
    const leaders: Leader[] = [];
    if (fallback && fallback.president)
      leaders.push({ role: 'President', name: fallback.president.name, photo: fallback.president.photo, designation: fallback.president.designation || '' });
    if (fallback && fallback.secretary)
      leaders.push({ role: 'Secretary', name: fallback.secretary.name, photo: fallback.secretary.photo, designation: fallback.secretary.designation || '' });
    return leaders.length ? { leaders, yearLabel: cfg.yearLabel } : null;
  }
  if (!RotaryAPI.clubBoard) return Promise.resolve(fb());
  return RotaryAPI.clubBoard(clubId)
    .then((res: any) => {
      const rows = asArray(res).slice();
      // No board on record for the SELECTED year → don't show another year's
      // officers; hide (consistent with projects/members/events) unless this is
      // the current year, where the club-finder officers are the right fallback.
      if (!rows.length) return fb();
      rows.sort((a: any, b: any) => (a.designationId || a.DesignationId || 999) - (b.designationId || b.DesignationId || 999));
      const leaders: Leader[] = rows.map((b: any) => ({
        role: boardRole(b.designationName || b.DesignationName),
        name: b.memberName || b.MemberName || '',
        photo: resolveMedia(b.profilePhotoPath || b.ProfilePhotoPath || ''),
        designation: '',
      }));
      return { leaders, yearLabel: rows[0].yearLabel || rows[0].YearLabel || cfg.yearLabel };
    })
    .catch(() => fb());
}

// One page (24) of the members roster, with optional search. Raw {items,totalCount}.
// excludeHonorary keeps the roster (and its header count) consistent with the
// Overview "Members" stat — honorary members are excluded from both.
export function loadMembers(clubId: string, page: number, search: string): Promise<any> {
  return RotaryAPI.get('/api/mobile/club-finder/' + clubId + '/members', { page, pageSize: 24, search, excludeHonorary: true });
}

// Lazily fetch a club project's primary photo (module-level cache, dedup pending).
// ponytail: dropped the aspx's 6-at-a-time pool — per-card fetch-on-mount + this
// cache gives the same result; add a concurrency cap only if the API rate-limits.
const cpImgCache: Record<string, string | false> = {};
const cpImgPending: Record<string, Promise<string> | undefined> = {};
export function loadProjectImage(id: string): Promise<string> {
  if (!id || !RotaryAPI.publicProject) return Promise.resolve('');
  const cached = cpImgCache[id];
  if (cached !== undefined) return Promise.resolve(cached || '');
  const pending = cpImgPending[id];
  if (pending !== undefined) return pending;
  const p = RotaryAPI.publicProject(id)
    .then((d: any) => {
      const photos = (d && d.photos) || [];
      const pr = photos.filter((x: any) => x.isPrimary)[0] || photos[0];
      const ip = pr && (pr.imagePath || pr.ImagePath);
      return ip ? resolveMedia(ip) : '';
    })
    .catch(() => '')
    .then((url: string) => {
      cpImgCache[id] = url || false;
      delete cpImgPending[id];
      return url;
    });
  cpImgPending[id] = p;
  return p;
}
export { resolveMedia };
