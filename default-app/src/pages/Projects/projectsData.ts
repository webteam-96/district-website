/* projectsData.ts — shared logic for the Club Projects AND Club Service pages,
   ported from the ASPX js/projects.js (both aspx pages load that ONE script and
   differ only by <main data-page>: 'club-service' => ONLY Club Service projects
   (no category filter — its own page); anything else => the Club Projects page =
   every avenue EXCEPT Club Service, with the category filter).
   The list feed has no thumbnails, so each card resolves its primary photo
   lazily (same source as the detail page); cards link to /project?id=. */
import { useEffect, useMemo, useState } from 'react';
import RotaryAPI from '../../api/client';

export const PAGE_STEP = 24;

/* UI category slug -> display label (from data/projects.ts PROJECT_CATEGORIES). */
export const CATEGORIES: Record<string, string> = {
  'community-service': 'Community Service',
  'club-service': 'Club Service',
  'vocational-service': 'Vocational Service',
  'new-generation-service': 'New Generation Service',
  'international-service': 'International Service',
  'public-image': 'Public Image',
};

/* UI slug -> API moduleKey (from api/projects.ts SLUG_TO_MODULE). */
export const SLUG_TO_MODULE: Record<string, string> = {
  'community-service': 'community_service',
  'club-service': 'club_service',
  'vocational-service': 'vocational_service',
  'new-generation-service': 'new_generation_service',
  'international-service': 'international_service',
  'public-image': 'public_image_initiative',
};

/* Category filter TABS (Club Projects page). */
export const CATEGORY_TABS: { slug: string; label: string }[] = [
  { slug: '', label: 'All' },
  { slug: 'community-service', label: 'Community Service' },
  { slug: 'vocational-service', label: 'Vocational Service' },
  { slug: 'international-service', label: 'International Service' },
  { slug: 'new-generation-service', label: 'New Generation Service' },
  { slug: 'public-image', label: 'Public Image' },
];

export interface Project {
  id: string;
  moduleKey: string;
  projectDate: string;
  title: string;
  clubName: string;
  categoryLabel: string;
  beneficiaries: number;
  manHours: number;
  amountSpent: number;
  description: string;
  num?: number;
}

/* ----------------------------- helpers ----------------------------- */
export function parseDate(v: any): Date | null {
  if (!v) return null;
  // DD-MM-YYYY first: native new Date() reads '05-06-2026' as US MM-DD (May 6),
  // but this is an en-IN site — day-first wins. ISO 'YYYY-MM-DD…' doesn't match
  // this regex and falls through to the native parser.
  const m = String(v).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  const d = m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(v: any): string {
  if (!v) return '';
  const d = parseDate(v);
  if (!d) return String(v);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Sort key: the project's DONE date (0 when missing/unparseable → sinks last).
function dateVal(p: Project): number {
  const d = parseDate(p.projectDate);
  return d ? d.getTime() : 0;
}

// Project id: prefer an explicit id field; otherwise extract /project/<id>
// from the public photo url (the React rowToProject strategy).
function projectId(r: any): string {
  if (r.id != null && r.id !== '') return String(r.id);
  const u = r.publicPhotoUrl || r.PublicPhotoUrl || '';
  const m = String(u).match(/\/project\/(\d+)/);
  return m ? m[1] : '';
}

function normalizeModule(v: any): string {
  return String(v == null ? '' : v).trim().toLowerCase();
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

function rowToProject(r: any): Project {
  return {
    id: projectId(r),
    moduleKey: normalizeModule(r.moduleKey),
    projectDate: r.projectDate || '',
    title: r.title || 'Untitled Project',
    clubName: r.clubName || 'Rotary District',
    categoryLabel: r.typeOfProject || 'Service',
    beneficiaries: Number(r.beneficiaries) || 0,
    manHours: Number(r.manHours) || 0,
    amountSpent: Number(r.amountSpent) || 0,
    description:
      r.description ||
      [r.areaOfFocus, formatDate(r.projectDate)].filter(Boolean).join(' • ') ||
      r.title ||
      '',
  };
}

// Count of projects in a filter tab (over the whole page-scoped list `all`).
export function tabCount(all: Project[], slug: string): number {
  if (!slug) return all.length;
  const mk = SLUG_TO_MODULE[slug];
  return all.filter((p) => p.moduleKey === mk).length;
}

/* ----------------------------- data ----------------------------- */
// The avenue endpoint IGNORES moduleKey (it returns the whole district feed),
// so we don't send it — every category then shares ONE proxy-cached response
// instead of refetching the (large) feed per category — and we filter by the
// avenue row's own moduleKey client-side. No "fall back to all rows": a
// category with no matching projects must show the empty state, not everything.
export function loadProjects(onlyClubService: boolean): Promise<Project[]> {
  return RotaryAPI.districtProjects()
    .then((rows: any) => {
      const list = Array.isArray(rows) ? rows : (rows && rows.items) || [];
      const all: Project[] = list.map(rowToProject).filter((p: Project) => {
        // Club Service lives on its own page now: this page shows ONLY it, the
        // Club Projects page shows everything EXCEPT it.
        const isCS = p.moduleKey === 'club_service';
        return onlyClubService ? isCS : !isCS;
      });
      // Done-date order: projects count by the date they were DONE (projectDate),
      // not the date they were added — a project done 1 Jun but entered 9 Jun
      // sorts as 1 Jun. The auto-increment id only breaks same-day ties (later
      // entry first). Number oldest = 1 … newest = N so badges run N down to 1.
      all.sort((a, b) => (dateVal(b) - dateVal(a)) || ((Number(b.id) || 0) - (Number(a.id) || 0)));
      const total = all.length;
      all.forEach((p, i) => { p.num = total - i; });
      return all;
    })
    .catch((err: any) => {
      console.warn('projects: load failed', err);
      return [];
    });
}

/* ------------------- lazy per-card primary-photo loader -------------------
   The list feed has no thumbnails, so we resolve each visible project's primary
   photo per-project (same source as the detail page). Results are cached so
   search / "Load more" re-renders never refetch, and a small concurrency pool
   keeps us from firing dozens of requests at once. */
const imgCache: Record<string, string | false> = {}; // id -> url | false (no photo)
const imgPending: Record<string, boolean> = {};
type Waiter = { id: string; cb: (url: string | false) => void };
const queue: Waiter[] = [];
let active = 0;
const MAX = 6;

function fetchPrimaryPhoto(id: string): Promise<string> {
  return RotaryAPI.publicProject(id)
    .then((d: any) => {
      const photos = (d && d.photos) || [];
      const primary = photos.filter((x: any) => x.isPrimary)[0] || photos[0];
      const ip = primary && (primary.imagePath || primary.ImagePath);
      return ip ? RotaryAPI.mediaProxy(ip) : '';
    })
    .catch(() => '');
}

function pump() {
  while (active < MAX && queue.length) {
    const w = queue.shift() as Waiter;
    if (imgCache[w.id] !== undefined) { w.cb(imgCache[w.id]); continue; }
    if (imgPending[w.id]) continue;
    imgPending[w.id] = true;
    active++;
    fetchPrimaryPhoto(w.id).then((url) => {
      imgPending[w.id] = false;
      active--;
      imgCache[w.id] = url || false;
      w.cb(imgCache[w.id]);
      pump();
    });
  }
}

export function imageKnown(id: string): boolean {
  return imgCache[id] !== undefined;
}
export function cachedImage(id: string): string {
  const c = imgCache[id];
  return typeof c === 'string' ? c : '';
}
export function requestCardImage(id: string, cb: (url: string | false) => void) {
  if (imgCache[id] !== undefined) { cb(imgCache[id]); return; }
  queue.push({ id, cb });
  pump();
}

/* ----------------------------- page state hook ----------------------------- */
// Single hook that mirrors projects.js state: load once, then filter (category
// tab) + search + "Load more" happen client-side. `initialSlug` pre-selects a
// category from the ?category= deep link (Club Projects page only).
export function useProjectsState(onlyClubService: boolean, initialSlug = '') {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<Project[]>([]);
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_STEP);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadProjects(onlyClubService).then((rows) => {
      if (!alive) return;
      setAll(rows);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [onlyClubService]);

  // Smart CLUB search, applied FIRST so it scopes the WHOLE page — the type tabs,
  // the analysis stat tiles AND the card grid all recompute for the searched club.
  // Case-insensitive substring on the CLUB NAME: "thane" matches every Thane club,
  // "thane hills" narrows to that one club (more words = more specific). Matching
  // club names ONLY (per the request) keeps "Clubs Involved" + the tab counts
  // meaningful. Empty query = the whole page-scoped list (no club filter).
  const searchScoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) => p.clubName.toLowerCase().includes(q));
  }, [all, query]);

  // The selected category tab, applied on top of the club scope. This is BOTH what
  // the analysis stat tiles aggregate and what the card grid shows, so both track
  // the club search live.
  const categoryList = useMemo(() => {
    const mk = activeSlug ? SLUG_TO_MODULE[activeSlug] : '';
    return mk ? searchScoped.filter((p) => p.moduleKey === mk) : searchScoped;
  }, [searchScoped, activeSlug]);

  const filtered = categoryList; // cards = club search ∩ selected category

  // Reset the visible count whenever the result set changes (tab / search).
  const selectSlug = (s: string) => { setActiveSlug(s); setLimit(PAGE_STEP); };
  const onSearch = (v: string) => { setQuery(v); setLimit(PAGE_STEP); };
  const loadMore = () => setLimit((l) => l + PAGE_STEP);

  return { loading, all, searchScoped, activeSlug, selectSlug, query, onSearch, limit, loadMore, categoryList, filtered };
}
