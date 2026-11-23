/* ==========================================================================
   Dynamic nav — maps the API's menu rows onto this SPA's routes.

   Endpoint (ALREADY LIVE — not the /api/public/district/{id}/menus path the
   spec draft named):
     GET /api/districts/{districtId}/website-data/menus        -> bare array
     GET /api/districts/{districtId}/website-data/menus/{id}/submenus
                                                -> { value: [...], Count: n }
   Sub-menus are NOT inlined, so a row with subMenuCount > 0 costs one extra
   request. Both envelopes are handled liberally (the two endpoints disagree).

   PURE MODULE — deliberately imports nothing from client.ts so the mapping can
   be exercised by menus.selfcheck.ts under bare `node` (client.ts reads
   import.meta.env, which only exists inside Vite). Document paths are returned
   raw with doc:true; the caller resolves them through RotaryAPI.mediaUrl.
   ========================================================================== */

export interface MenuRow {
  id: number;
  menuName?: string;
  linkType?: string;
  linkValue?: string;
  sortOrder?: number;
  isActive?: boolean;
  isDefault?: number | boolean;
  subMenuCount?: number;
  subMenus?: SubMenuRow[];
}
export interface SubMenuRow {
  id: number;
  menuId?: number;
  subMenuName?: string;
  linkType?: string;
  linkValue?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** A renderable nav entry. `route` -> <Link to>, `href` -> <a>, `parent` -> label only. */
export interface NavNode {
  key: string;
  label: string;
  kind: 'route' | 'href' | 'parent';
  /** Route path (kind 'route') or URL/document path (kind 'href'). '' for 'parent'. */
  target: string;
  /** target is a media-relative document path — resolve via RotaryAPI.mediaUrl. */
  doc: boolean;
  children: NavNode[];
}

/* ---------------------------------------------------------------------------
   linkValue -> route.

   Real production data carries TWO dialects in the same column (surveyed across
   44 district-website districts): legacy ASPX filenames ("Home.aspx",
   "DistrictCommitteNew.aspx" — note the backend's missing 'e') and the newer
   slugs district 3220 was migrated to ("home", "club-projects"). Sub-menu rows
   use the API's avenue moduleKeys ("community_service"). All three are keyed
   here after normalisation, so no migration is needed on either side.
   --------------------------------------------------------------------------- */
const PAGE_ROUTES: Record<string, string> = {
  // Home
  home: '/', default: '/', index: '/',
  // About
  about: '/about', aboutus: '/about', 'about-us': '/about',
  // District Committee  (backend spells it "DistrictCommitteNew")
  districtcommittenew: '/district-committee',
  districtcommittee: '/district-committee',
  'district-committee': '/district-committee',
  // Club Finder
  clubsfinder: '/club-finder', clubfinder: '/club-finder', 'club-finder': '/club-finder',
  // Club Projects
  'club-projects': '/projects', clubprojects: '/projects', projects: '/projects',
  // Club Service has its own page — it is excluded from the Club Projects feed.
  'club-service': '/club-service', club_service: '/club-service', clubservice: '/club-service',
  // Avenue sub-menus -> the Club Projects category filter.
  community_service: '/projects?category=community-service',
  vocational_service: '/projects?category=vocational-service',
  international_service: '/projects?category=international-service',
  new_generation_service: '/projects?category=new-generation-service',
  public_image_initiative: '/projects?category=public-image',
  // Newsletters. Club bulletins are the page's default variant; the district
  // feed IS the Governor's Monthly Letter, hence the governor variant.
  newsletter: '/newsletters', newsletters: '/newsletters',
  'club-newsletter': '/newsletters', clubnewsletter: '/newsletters',
  gml: '/newsletters?variant=governor',
  'district-newsletter': '/newsletters?variant=governor',
  districtnewsletter: '/newsletters?variant=governor',
  governorsmonthlyletter: '/newsletters?variant=governor',
  // Calendar
  allspecialdates: '/calendar', calendar: '/calendar', specialdates: '/calendar',
  // Dignitary profiles
  'district-governor': '/dignitary?type=governor', districtgovernor: '/dignitary?type=governor',
  dg: '/dignitary?type=governor',
  'ri-president': '/dignitary', ripresident: '/dignitary', president: '/dignitary',
  // District Awards — the District Citation matrix. Preferred slug for new rows is
  // 'district-awards'; the rest are live values kept resolving (legacy
  // club_performance.aspx rows in 3 districts, plus the old page slug).
  'district-awards': '/district-awards', districtawards: '/district-awards',
  club_performance: '/district-awards', clubperformance: '/district-awards',
  'citation-performance': '/district-awards', citationperformance: '/district-awards',
};

/* ponytail: name-keyed fallback for rows whose linkValue is the '#' placeholder.
   ~40 of the 44 live district-website districts ship "CLUB PROJECTS" with
   linkValue '#' and no sub-menus — in the legacy ASPX the avenue links lived
   inside the page, so the parent never needed a target. Dropping those rows
   would delete Club Projects from the nav of almost every district, so when
   linkValue resolves to nothing the menu NAME is consulted instead.
   Upgrade path: once the backend backfills linkValue on those rows (district
   3220 and 3206 are already migrated to 'club-projects'), this table and the
   nameRoute() call in toNode() can be deleted outright. */
const NAME_ROUTES: Record<string, string> = {
  home: '/',
  about: '/about', aboutus: '/about',
  districtcommittee: '/district-committee',
  clubfinder: '/club-finder', clubsfinder: '/club-finder',
  clubprojects: '/projects', clubsprojects: '/projects', projects: '/projects',
  clubservice: '/club-service',
  newsletter: '/newsletters', newsletters: '/newsletters', clubnewsletter: '/newsletters',
  governorsmonthlyletter: '/newsletters?variant=governor',
  districtnewsletter: '/newsletters?variant=governor',
  calendar: '/calendar',
  districtawards: '/district-awards', cpindex: '/district-awards',
  clubperformance: '/district-awards', citationperformance: '/district-awards',
};

/** Route implied by a menu's NAME. Folds to letters only, so "CLUB  PROJECTS",
 *  "Club PROJECTS" and "CLUBS PROJECTS" all land on the same key. */
export function nameRoute(menuName: string | undefined | null): string {
  return NAME_ROUTES[String(menuName == null ? '' : menuName).toLowerCase().replace(/[^a-z]/g, '')] || '';
}

/** Fold a linkValue to its PAGE_ROUTES key: trim, lowercase, drop the leading
 *  slash and the .aspx extension. "/Home.aspx" and "home" collapse to "home". */
export function pageKey(linkValue: string | undefined | null): string {
  let s = String(linkValue == null ? '' : linkValue).trim().toLowerCase();
  if (s.charAt(0) === '/') s = s.slice(1);
  s = s.replace(/\.aspx$/, '');
  return s;
}

/** Route for a linkType:'page' row, or '' when this SPA has no such page. */
export function pageRoute(linkValue: string | undefined | null): string {
  return PAGE_ROUTES[pageKey(linkValue)] || '';
}

/** Absolutise an external URL. Production rows include bare hosts ("www.rotary.org"),
 *  which would otherwise resolve as a relative path off the current route. */
function externalHref(linkValue: string): string {
  const s = String(linkValue || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (s.charAt(0) === '/') return s; // same-origin absolute path
  return 'https://' + s;
}

/* ---------------------------------------------------------------------------
   Row -> NavNode. Returns null for anything unrenderable.

   An unmapped linkType:'page' row is DROPPED rather than linked. The router's
   catch-all renders Home for unknown paths, so linking it would silently look
   like it worked — real data contains rows this must swallow, e.g. one
   district's prose blob "Please register for all upcoming events...". A '#'
   placeholder is kept only when it has children, as the dropdown label.
   --------------------------------------------------------------------------- */
function toNode(
  id: number,
  label: string,
  linkType: string | undefined,
  linkValue: string | undefined,
  children: NavNode[],
  warn: string[],
): NavNode | null {
  const name = String(label || '').trim();
  if (!name) return null;
  const type = String(linkType || 'page').trim().toLowerCase();
  const raw = String(linkValue == null ? '' : linkValue).trim();
  const key = 'm' + id;

  if (type === 'document') {
    return raw ? { key, label: name, kind: 'href', target: raw, doc: true, children } : null;
  }
  // A full URL is honoured whatever the row claims its linkType is: production
  // has linkType:'page' rows carrying absolute URLs (a district's "Contact" ->
  // instamojo.com, "Gallery" -> weblink.rotaryindia.org). Checked before the
  // page lookup so those become real links instead of being dropped.
  if (type === 'external' || type === 'url' || /^https?:\/\//i.test(raw)) {
    const href = externalHref(raw);
    return href ? { key, label: name, kind: 'href', target: href, doc: false, children } : null;
  }

  // linkType 'page' (and any unknown type — treated as a page, not a raw href,
  // so a typo can never become an off-site link).
  const route = pageRoute(raw) || nameRoute(name);
  if (route) return { key, label: name, kind: 'route', target: route, doc: false, children };
  if (children.length) return { key, label: name, kind: 'parent', target: '', doc: false, children };
  warn.push(name + ' -> ' + (raw || '(empty)'));
  return null;
}

/** sortOrder 0 means "unset" in production data (every legacy district ships all
 *  zeroes), so unset rows keep their server order and sit after ordered ones. */
function bySortOrder<T extends { sortOrder?: number }>(rows: T[]): T[] {
  const n = (r: T) => (Number(r.sortOrder) > 0 ? Number(r.sortOrder) : Number.MAX_SAFE_INTEGER);
  return rows.map((r, i) => ({ r, i })).sort((a, b) => n(a.r) - n(b.r) || a.i - b.i).map((x) => x.r);
}

const isOn = (v: any) => v === undefined || v === null || v === true || v === 1 || v === '1';

/** Unwrap the API's inconsistent list envelopes: bare array or { value: [...] }. */
export function listOf(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}

/**
 * Build the nav tree. `subsByMenuId` is optional — menus whose sub-menus were
 * not fetched simply render without children.
 */
export function buildNav(rows: MenuRow[], subsByMenuId?: Record<number, SubMenuRow[]>): NavNode[] {
  const warn: string[] = [];
  const out: NavNode[] = [];

  bySortOrder(rows.filter((r) => isOn(r.isActive))).forEach((r) => {
    const subRows = (subsByMenuId && subsByMenuId[r.id]) || r.subMenus || [];
    const children: NavNode[] = [];
    bySortOrder(subRows.filter((s) => isOn(s.isActive))).forEach((s) => {
      const c = toNode(s.id, String(s.subMenuName || ''), s.linkType, s.linkValue, [], warn);
      if (c) children.push(c);
    });
    const node = toNode(r.id, String(r.menuName || ''), r.linkType, r.linkValue, children, warn);
    if (node) out.push(node);
  });

  if (warn.length && typeof console !== 'undefined') {
    console.warn('[menus] dropped unmapped rows: ' + warn.join(', '));
  }
  return out;
}
