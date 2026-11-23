/* clubData.ts — shared per-club fan-out infrastructure for the Home sections.

   The API has NO district-level aggregate for club events or club newsletters —
   both exist only per club. This module owns the (session-cached) club list and
   ONE pooled sweep implementation, so the calendar's Club Events and the
   newsletters section share the same club fetch + pool instead of each rolling
   their own. Every result set is cached per district for the session; in PROD
   the ApiProxy additionally caches each per-club response server-side. */
import RotaryAPI, { config } from '../../api/client';

export interface ClubRef { id: number; name: string }

/* ------------------------------ club list ------------------------------ */
let clubsKey = '';
let clubsPromise: Promise<ClubRef[]> | null = null;
export function allClubs(): Promise<ClubRef[]> {
  const key = String(config.districtId);
  if (clubsPromise && clubsKey === key) return clubsPromise;
  clubsKey = key;
  clubsPromise = RotaryAPI.clubFinderAll().then((res: any) =>
    (((res && res.items) || []) as any[])
      .map((c) => ({ id: c.clubId, name: c.clubName || c.name || '' }))
      .filter((c) => c.id),
  );
  return clubsPromise;
}

/* ------------------------------ pooled sweep ------------------------------
   Runs `perClub` for every club, BATCH at a time. onProgress fires per club;
   onPartial fires per batch with a snapshot of everything found so far (lets a
   caller stream results into the UI while the sweep continues). */
const BATCH = 8;
export function sweepClubs<T>(
  perClub: (c: ClubRef) => Promise<T[]>,
  onProgress?: (done: number, total: number) => void,
  onPartial?: (found: T[]) => void,
): Promise<T[]> {
  return allClubs().then((clubs) => {
    const out: T[] = [];
    let done = 0;
    function run(start: number): Promise<void> {
      if (start >= clubs.length) return Promise.resolve();
      return Promise.all(
        clubs.slice(start, start + BATCH).map((c) =>
          perClub(c)
            .then((items) => { out.push(...items); })
            .catch(() => {})
            .then(() => { done++; if (onProgress) onProgress(done, clubs.length); }),
        ),
      ).then(() => {
        if (onPartial) onPartial(out.slice());
        return run(start + BATCH);
      });
    }
    return run(0).then(() => out);
  });
}

/* ------------------------------ club events ------------------------------ */
export interface RawClubEvent { id: number; title: string; date: Date; venue: string; image: string; link: string; clubName: string }
let evKey = '';
let evPromise: Promise<RawClubEvent[]> | null = null;
export function allClubEvents(onProgress?: (done: number, total: number) => void): Promise<RawClubEvent[]> {
  const key = String(config.districtId);
  if (evPromise && evKey === key) return evPromise; // cached: progress won't re-fire
  evKey = key;
  evPromise = sweepClubs<RawClubEvent>(
    (c) =>
      RotaryAPI.get('/api/mobile/club-finder/' + c.id + '/events').then((r: any) => {
        const list = (r && r.items) || (Array.isArray(r) ? r : []);
        const out: RawClubEvent[] = [];
        list.forEach((e: any) => {
          const raw = e.eventDate || e.date || e.startDate;
          const d = raw ? new Date(raw) : null;
          if (!d || isNaN(d.getTime())) return;
          out.push({
            // eventId: what /club-event?id= needs. Rows without one are still
            // listed, just not linkable.
            id: Number(e.eventId || e.id) || 0,
            title: e.title || e.eventTitle || e.name || 'Event',
            date: d,
            venue: e.eventVenue || e.venue || e.location || '',
            image: e.imagePath ? RotaryAPI.mediaUrl(e.imagePath) : '',
            link: e.registrationLink || '',
            clubName: c.name,
          });
        });
        return out;
      }),
    onProgress,
  );
  return evPromise;
}

/* ---------------------------- club newsletters ----------------------------
   Same row rules as the Newsletters page: a row needs linkUrl OR filePath; an
   external linkUrl (flipbook) wins, else the filePath resolves via mediaUrl. */
export interface RawClubNewsletter {
  id: string;
  title: string;
  clubName: string;
  ts: number;      // publish time (sort key)
  pdf: string;     // resolved URL
  yearId: number;  // the row's own Rotary-year id (0/absent on legacy rows)
}
let nlKey = '';
let nlPromise: Promise<RawClubNewsletter[]> | null = null;
export function allClubNewsletters(
  onProgress?: (done: number, total: number) => void,
  onPartial?: (found: RawClubNewsletter[]) => void,
): Promise<RawClubNewsletter[]> {
  const key = String(config.districtId);
  if (nlPromise && nlKey === key) return nlPromise; // cached: callbacks won't re-fire
  nlKey = key;
  nlPromise = sweepClubs<RawClubNewsletter>(
    (c) =>
      RotaryAPI.clubNewsletters(c.id).then((rows: any[]) => {
        const out: RawClubNewsletter[] = [];
        (rows || []).forEach((r: any, i: number) => {
          const link = r.linkUrl || r.LinkUrl;
          const fpath = r.filePath || r.FilePath;
          if (!link && !fpath) return;
          const raw = r.publishDateTime || r.PublishDateTime;
          // PUBLISHED only (user decision): skip non-Published statuses AND
          // scheduled rows whose publishDateTime is still in the future.
          const status = String(r.status || r.Status || 'Published').toLowerCase();
          if (status !== 'published') return;
          const pubTs = Date.parse(raw) || 0;
          if (pubTs > Date.now()) return;
          out.push({
            id: c.id + ':' + (r.id != null ? r.id : i),
            title: r.title || r.Title || 'Newsletter',
            clubName: c.name,
            ts: Date.parse(raw) || 0,
            pdf: RotaryAPI.mediaUrl(link || fpath),
            yearId: Number(r.yearId != null ? r.yearId : r.YearId) || 0,
          });
        });
        return out;
      }),
    onProgress,
    onPartial,
  );
  return nlPromise;
}
