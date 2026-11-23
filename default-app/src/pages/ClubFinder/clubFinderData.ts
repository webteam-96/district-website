/* clubFinderData.ts — Club Finder data + pure helpers, ported from js/club-finder.js.
   Fetches every club via RotaryAPI.clubFinderAll(), then the component filters/
   sorts/paginates entirely client-side (keyword search + meeting-day filter,
   A–Z/Z–A sort, grid/list view, 12 per page). President name + contact is
   enriched lazily per visible card and cached so re-render/sort/paginate never
   refetch. An API failure yields an empty list (empty state) rather than a blank
   page. Follows the home.js conventions: RotaryAPI, resolveMedia, try/catch. */
import RotaryAPI from '../../api/client';

export interface Club {
  id: string;
  name: string;
  clubId: string;
  president: string;
  meetingDays: string[];
  meetingDay: string;
  meetingTime: string;
  city: string;
  state: string;
  meetingAddress: string;
  zoneName: string;
  logo: string;
}
export interface PresInfo { name: string; phone: string; tel: string; }

/* ----------------------------- helpers ----------------------------- */
// Club logos are ordinary <img> (CORS irrelevant) → direct absolute URL.
const resolveMedia = (path: any) => RotaryAPI.mediaUrl(path);

export function initials(s: any): string {
  return String(s || '')
    .replace(/\b(Rotary|Club|of)\b/gi, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Meeting day is a FREE-TEXT column, so districts store it every possible way:
// full names ("Wednesday"), abbreviations ("Wed", "Thurs", "Weds"), several days
// at once ("Mon, Wed", "Tue & Thu"), or a day buried in other text ("Every
// Wednesday", "1st & 3rd Thursday", "Tue 7pm"). The filter dropdown uses full
// names, so we parse EVERY day-of-week mentioned anywhere in the value into a
// canonical set and match the selected day against that set (multi-day aware).
// This is why the filter used to work in some districts but not others — the old
// logic only matched clean single-token values.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Abbreviations that are NOT a clean prefix of the full name (prefix-matching misses them).
const DAY_IRREGULAR: Record<string, number> = { weds: 3, wedns: 3, wednes: 3 };
// Two-letter codes — trusted ONLY when they are the WHOLE field, never mid-sentence
// (so a stray "we"/"th" inside longer text can't false-match a day).
const DAY_TWO_LETTER: Record<string, number> = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
// Which canonical day (0=Sun..6=Sat) a single word denotes, or -1 if none.
function dayIndexOfToken(tok: string): number {
  if (!tok || tok.length < 3) return -1; // ignore 1–2 letter noise (am/pm/st/nd/we/th)
  if (DAY_IRREGULAR[tok] != null) return DAY_IRREGULAR[tok];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const full = DAY_NAMES[i].toLowerCase();
    if (tok === full) return i;
    if (full.indexOf(tok) === 0) return i; // tok is a prefix: mon/tue/tues/thu/thur/thurs/wed/fri/sat/sun…
    if (tok.indexOf(full) === 0) return i; // tok STARTS WITH the full name: "wednesdays", "fridayevening"
  }
  return -1;
}
// Parse a free-text meeting-day value into an ordered, de-duped set of canonical
// day names (Sunday→Saturday). Returns [] when no day is recognised.
function parseDays(text: any): string[] {
  const toks = String(text == null ? '' : text).toLowerCase().split(/[^a-z]+/);
  const seen: Record<number, number> = {};
  const out: number[] = [];
  for (let i = 0; i < toks.length; i++) {
    const idx = dayIndexOfToken(toks[i]);
    if (idx >= 0 && !seen[idx]) { seen[idx] = 1; out.push(idx); }
  }
  if (out.length === 0) {
    const only = toks.filter((t) => t);
    if (only.length === 1 && DAY_TWO_LETTER[only[0]] != null) out.push(DAY_TWO_LETTER[only[0]]);
  }
  out.sort((a, b) => a - b);
  return out.map((i) => DAY_NAMES[i]);
}

export function mapItem(c: any): Club {
  const days = parseDays(c.meetingDay);
  return {
    id: String(c.clubId),
    name: c.clubName || '',
    clubId: c.clubRotaryId || String(c.clubId),
    president: '',
    // every canonical day present in the free-text value (drives the day filter)…
    meetingDays: days,
    // …and a clean label for the card (full names; falls back to the raw text).
    meetingDay: days.length ? days.join(', ') : String(c.meetingDay == null ? '' : c.meetingDay).trim(),
    meetingTime: '',
    city: c.city || '',
    state: c.state || '',
    meetingAddress: c.meetingAddress || '',
    zoneName: c.zoneName || '',
    logo: resolveMedia(c.clubLogo) || '',
  };
}

export function locationOf(club: Club): string {
  return [club.city, club.state].filter((v) => v).join(', ');
}

/* ----------------------------- filtering ----------------------------- */
export function getFiltered(clubs: Club[], query: string, day: string, sort: 'az' | 'za'): Club[] {
  const q = query.trim().toLowerCase();
  const r = clubs.filter((c) => {
    if (day && c.meetingDays.indexOf(day) === -1) return false;
    if (
      q &&
      ![c.name, c.president, c.city || '', c.zoneName || ''].some((f) => f.toLowerCase().indexOf(q) !== -1)
    )
      return false;
    return true;
  });
  r.sort((a, b) => (sort === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  return r;
}

/* ----------------------------- president + contact ----------------------------- */
// clubId -> Promise<PresInfo|null> — president name + contact, fetched lazily per
// visible card and cached so re-render/sort/paginate never refetch.
const presCache: Record<string, Promise<PresInfo | null>> = {};

// Pick the club President from a board-of-directors array: designationId 1 is the
// canonical President; fall back to a "…President" role that isn't Vice/Past.
function pickPresident(board: any): any {
  if (!Array.isArray(board) || !board.length) return null;
  let i;
  for (i = 0; i < board.length; i++) if (board[i] && board[i].designationId === 1) return board[i];
  for (i = 0; i < board.length; i++) {
    const n = String((board[i] && board[i].designationName) || '').toLowerCase();
    if (n.indexOf('president') !== -1 && n.indexOf('vice') === -1 && n.indexOf('past') === -1) return board[i];
  }
  return null;
}

// Resolve a club's current-year President name + contact number. The list endpoint
// carries neither, so we read the year-scoped board (name + memberId), then the
// member record for the phone. Cached per club. Returns {name, phone, tel} or null.
export function enrichPresident(clubId: string): Promise<PresInfo | null> {
  if (clubId in presCache) return presCache[clubId];
  const p = RotaryAPI.clubBoard(clubId)
    .then((board: any) => {
      const pres = pickPresident(board);
      if (!pres) return null;
      const info: PresInfo = { name: pres.memberName || '', phone: '', tel: '' };
      if (!info.name || !pres.memberId) return info.name ? info : null;
      return RotaryAPI.get('/api/mobile/club-finder/members/' + pres.memberId)
        .then((res: any) => {
          const m = res && res.member;
          if (m && m.memberName) info.name = m.memberName;
          // Respect the member's profile-visibility flag — only surface the number
          // when it isn't explicitly hidden.
          const hidden = m && (m.isPersonalDetailsVisible === 0 || m.isPersonalDetailsVisible === false);
          const mobile = m && !hidden ? String(m.primaryMobile || '').trim() : '';
          if (mobile) {
            const code = m && m.primaryPhoneCode ? String(m.primaryPhoneCode).trim() : '';
            info.phone = (code ? code + ' ' : '') + mobile;
            info.tel = (code + mobile).replace(/[^\d+]/g, '');
          }
          return info;
        })
        .catch(() => info);
    })
    .catch(() => null);
  presCache[clubId] = p;
  return p;
}

// Run `worker` over items with a bounded number of concurrent in-flight promises.
export function runPool<T>(items: T[], worker: (item: T) => Promise<any>, max?: number): void {
  max = max || 6;
  let idx = 0;
  function next(): void {
    if (idx >= items.length) return;
    const it = items[idx++];
    Promise.resolve()
      .then(() => worker(it))
      .then(next, next);
  }
  for (let k = 0; k < Math.min(max, items.length); k++) next();
}

/* ----------------------------- data ----------------------------- */
export function loadClubs(): Promise<Club[]> {
  if (!RotaryAPI.clubFinderAll) return Promise.resolve([]);
  return RotaryAPI.clubFinderAll()
    .then((res: any) => ((res && res.items) || []).map(mapItem))
    .catch((err: any) => {
      console.warn('Club Finder failed to load', err);
      return [];
    });
}
