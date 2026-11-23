/* Newsletters — faithful port of Newsletters.aspx + js/newsletters.js.

   Two variants, read from ?variant=governor|club (default club):

   • CLUB    — a club selector (RotaryAPI.clubFinderAll, default "All Clubs")
               feeds RotaryAPI.clubNewsletters(clubId); each PDF renders as a card
               (title / club / published date) with a Preview (in-page iframe
               modal) + Download action. "All Clubs" fans out across every club in
               the district (no district-wide endpoint), concurrency-capped, and
               paints progressively as results arrive.
   • GOVERNOR — Governor's Monthly Letters from the district-level newsletters
               endpoint (RotaryAPI.districtNewsletters). GML rows carry no usable
               year field, so the year filter is DERIVED from each letter's
               publishDateTime (Rotary year = Jul 1 – Jun 30).

   Both variants share the search box + strict per-year filter (header year
   selector, config.yearLabel/yearId). */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';

const ALL_CLUBS = '__all__'; // club dropdown sentinel = every club in the district

/* ----------------------------- helpers ----------------------------- */
const resolveMedia = (p: any) => RotaryAPI.mediaUrl(p);

function fmtDate(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return d.toLocaleDateString();
  }
}

// Rotary year (runs Jul 1 – Jun 30) label for a date, e.g. 2024-09 -> "2024-25",
// 2025-04 -> "2024-25". Newsletter/GML records carry no usable year field, so the
// year is DERIVED from the publish date for the year filter. '' if no/invalid date.
function rotaryYearLabelOf(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const start = d.getMonth() >= 6 ? y : y - 1; // Jul = month index 6
  return start + '-' + String(start + 1).slice(-2);
}

/* A GML PDF physically lives under ONE of two folders on the media host,
   depending on which admin uploaded it: the row's own path (new-admin uploads)
   or the district's LEGACY website-group folder (legacy-admin uploads). The row
   doesn't say which. In PROD we probe the candidates through ApiProxy.ashx?head=
   (server-side, so the media host's static-file CORS policy can't block it) and
   re-render with the first URL that exists. In DEV there is no .ashx and the
   media host has no CORS, so a browser probe can't run — we serve the legacy
   gmlUrl directly (the pre-probe guess = old behavior). */
function pdfUrlFor(fpath: string, variant: string, resolved: Record<string, string>): string {
  if (resolved[fpath]) return resolved[fpath];
  // Only governor GMLs of districts WITH a legacy website group have two possible
  // locations; everything else has exactly one candidate — nothing to probe.
  const legacy = variant === 'governor' && RotaryAPI.gmlLegacyPath ? RotaryAPI.gmlLegacyPath(fpath) : '';
  if (!legacy) return resolveMedia(fpath);
  return RotaryAPI.gmlUrl(fpath); // pre-probe guess = legacy folder; PROD probe may upgrade it
}

// PROD-only existence check: the media host has no CORS, so the probe must go
// through the same-origin server proxy (ApiProxy.ashx?head=). Guarded by the
// caller so it never runs in DEV (config.proxy null).
function headOk(path: string): Promise<boolean> {
  const proxy = config.proxy;
  if (!proxy) return Promise.resolve(false);
  return fetch(proxy + '?head=' + encodeURIComponent(path))
    .then((r) => r.json())
    .then((j: any) => !!(j && j.ok))
    .catch(() => false);
}

interface NItem {
  id: string;
  title: string;
  club: string;
  date: string;
  pdf: string;
  ts: number;
  _fpath?: string; // raw file path (governor rows w/o link) — for the PROD head-probe
}

function clubNameFor(id: string, clubs: { id: string; name: string }[]): string {
  for (let i = 0; i < clubs.length; i++) {
    if (clubs[i].id === id) return clubs[i].name;
  }
  return '';
}

/** Map raw DTOs -> NItems, filtered by the SELECTED Rotary year (the header year
    selector) + the search box, newest-first. */
function computeItems(
  rawRows: any[],
  query: string,
  clubId: string,
  clubs: { id: string; name: string }[],
  variant: string,
  pdfResolved: Record<string, string>,
): NItem[] {
  const fallbackName = variant === 'governor'
    ? (config.districtName || 'District')
    : clubNameFor(clubId, clubs);
  // Year filter = the header year selector. STRICT: a newsletter shows only for the
  // year it actually belongs to; a year with nothing published shows the empty
  // state — we never spill other years' newsletters into it.
  const selYearId = config.yearId;        // numeric id of the selected Rotary year
  const selYear = config.yearLabel || ''; // label, e.g. "2026-27"

  // A record belongs to the selected year if its OWN yearId says so. Many rows come
  // back with yearId 0 (the API didn't tag them) — only then do we DERIVE the year
  // from the publish date (Jul 1–Jun 30). This is why a row dated 2026-06-30 counts
  // as 2025-26, not the new 2026-27 year that starts 1 July.
  function matchesSelectedYear(r: any): boolean {
    if (!selYear || selYear === 'all') return true;
    const yid = r.yearId != null ? r.yearId : r.YearId;
    if (yid && yid > 0) return selYearId != null && yid === selYearId;
    return rotaryYearLabelOf(r.publishDateTime || r.PublishDateTime) === selYear;
  }

  const out: NItem[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i] || {};
    if (!matchesSelectedYear(r)) continue;
    // CLUB variant: PUBLISHED only (user decision, supersedes the old "show
    // future-dated scheduled bulletins" behaviour) — skip non-Published
    // statuses and rows whose publishDateTime hasn't arrived yet. Same rule
    // as the Home panel (clubData.ts) so the two listings always agree.
    if (variant === 'club') {
      const status = String(r.status || r.Status || 'Published').toLowerCase();
      if (status !== 'published') continue;
      const pubTs = Date.parse(r.publishDateTime || r.PublishDateTime) || 0;
      if (pubTs > Date.now()) continue;
    }
    const link = r.linkUrl || r.LinkUrl;
    const fpath = r.filePath || r.FilePath;
    if (!link && !fpath) continue; // no PDF and no link -> nothing to display
    // An external linkUrl (e.g. a flipbook) wins. Otherwise resolve the PDF to
    // whichever physical location actually has the file (see pdfUrlFor above).
    const pdf = link ? resolveMedia(link) : pdfUrlFor(fpath, variant, pdfResolved);
    const raw = r.publishDateTime || r.PublishDateTime;
    out.push({
      id: String(r.id != null ? r.id : i),
      title: r.title || r.Title || 'Newsletter',
      club: r.__clubName || fallbackName, // All Clubs mode tags each row's club
      date: fmtDate(raw),
      pdf: pdf,
      ts: Date.parse(raw) || 0,
      _fpath: link ? undefined : fpath,
    });
  }
  out.sort((a, b) => b.ts - a.ts); // newest first across all clubs
  const q = query.trim().toLowerCase();
  if (!q) return out;
  return out.filter((n) =>
    [n.title, n.club, n.date].some((f) => String(f || '').toLowerCase().indexOf(q) !== -1),
  );
}

/* ------------------------------- icons ------------------------------- */
function Icon({ cls, children }: { cls: string; children: ReactNode }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const ICON = {
  fileText: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  search: (<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  eye: (<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  download: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>),
  externalLink: (<><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>),
  x: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
};

/* ------------------------------ cards / states ------------------------------ */
function Card({ n, onOpen }: { n: NItem; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group flex cursor-pointer flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-divider/50 transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
          <Icon cls="h-6 w-6">{ICON.fileText}</Icon>
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-snug text-brand-bluedark">{n.title}</h3>
          <p className="truncate text-[13px] font-semibold text-ink">{n.club}</p>
        </div>
      </div>
      {n.date && <p className="mt-3 text-[12.5px] font-semibold text-brand-gold">Published: {n.date}</p>}
      <div className="mt-4 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3.5 py-2 text-[13px] font-semibold text-white">
          <Icon cls="h-4 w-4">{ICON.eye}</Icon> Preview
        </span>
        <a
          href={n.pdf}
          download
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-lg border border-divider px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-pagebg"
        >
          <Icon cls="h-4 w-4">{ICON.download}</Icon> Download
        </a>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl bg-white text-center shadow-card ring-1 ring-divider/50">
      <Icon cls="h-8 w-8 animate-spin text-brand-blue">{ICON.loader}</Icon>
      <p className="text-sm font-semibold text-muted">Loading newsletters…</p>
    </div>
  );
}

function EmptyState({ variant, query }: { variant: string; query: string }) {
  // The year filter is strict (no fall back to other years), so this state means the
  // SELECTED year simply has nothing published — name the year so it's clear why.
  const yr = config.yearLabel || '';
  const suffix = yr && yr !== 'all' ? ' for ' + yr : '';
  const msg = query
    ? 'No newsletters match “' + query + '”.'
    : variant === 'governor'
      ? 'No Governor’s Monthly Letters' + suffix + '.'
      : 'No newsletters' + suffix + '.';
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white py-16 shadow-card ring-1 ring-divider/50">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
        <Icon cls="h-6 w-6">{ICON.fileText}</Icon>
      </span>
      <p className="mt-3 text-sm font-semibold text-muted">{msg}</p>
    </div>
  );
}

/* --------------------------- preview modal --------------------------- */
function Preview({ n, onClose }: { n: NItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  const meta = n.club + (n.date ? ' · ' + n.date : '');
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={n.title + ' preview'}
      onClick={onClose}
    >
      <div className="lb-panel flex h-full w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-bluedark">{n.title}</p>
            <p className="truncate text-[12px] text-muted">{meta}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={n.pdf} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg border border-divider px-3 py-2 text-[13px] font-semibold text-ink hover:bg-pagebg sm:flex">
              <Icon cls="h-4 w-4">{ICON.externalLink}</Icon> Open
            </a>
            <a href={n.pdf} download className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-[13px] font-semibold text-white hover:bg-brand-bluehover">
              <Icon cls="h-4 w-4">{ICON.download}</Icon> Download
            </a>
            <button type="button" className="lb-close flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-pagebg" aria-label="Close preview" onClick={onClose}>
              <Icon cls="h-5 w-5">{ICON.x}</Icon>
            </button>
          </div>
        </div>
        <iframe src={n.pdf} title={n.title + ' — ' + n.club} className="h-full w-full flex-1 bg-pagebg" />
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------- */
export default function Newsletters() {
  const [sp] = useSearchParams();
  const variant = sp.get('variant') === 'governor' ? 'governor' : 'club';
  const bannerTitle = variant === 'governor' ? "Governor's Monthly Letter" : 'Club Newsletter';

  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [clubsReady, setClubsReady] = useState(false);
  const [clubId, setClubId] = useState<string>(ALL_CLUBS);
  const [query, setQuery] = useState('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [pdfResolved, setPdfResolved] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<NItem | null>(null);
  const probingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.title = bannerTitle + ' — ' + (config.districtName || 'Rotary District');
  }, [bannerTitle]);

  // Club variant: populate the club picker with EVERY club in the district.
  useEffect(() => {
    if (variant !== 'club') return;
    let alive = true;
    RotaryAPI.clubFinderAll()
      .then((res: any) => {
        if (!alive) return;
        const items = (res && res.items) || [];
        const list: { id: string; name: string }[] = [];
        for (let i = 0; i < items.length; i++) {
          const c = items[i] || {};
          const id = c.clubId || c.ClubId;
          if (id == null) continue;
          list.push({ id: String(id), name: c.clubName || c.ClubName || ('Club ' + id) });
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (list.length) setClubs(list);
        setClubsReady(true);
      })
      .catch(() => { if (alive) setClubsReady(true); });
    return () => { alive = false; };
  }, [variant]);

  // Load the newsletters for the current selection. Governor -> district GMLs;
  // club + single club -> that club's feed; club + "All Clubs" -> fan out across
  // every club (concurrency-capped), painting results as they arrive.
  useEffect(() => {
    let alive = true;
    const finish = (rows: any[]) => { if (!alive) return; setRawRows(rows); setIsPending(false); };

    if (variant === 'governor') {
      setIsPending(true); setRawRows([]);
      // GMLs come from /api/districts/{id}/newsletters (fk_year_id is 0 on every
      // record; the page filters by the year DERIVED from publishDateTime).
      RotaryAPI.districtNewsletters()
        .then((r: any) => finish((r && r.items) ? r.items : (Array.isArray(r) ? r : [])))
        .catch(() => finish([]));
      return () => { alive = false; };
    }

    if (clubId !== ALL_CLUBS) {
      setIsPending(true); setRawRows([]);
      RotaryAPI.clubNewsletters(clubId)
        .then((rows: any) => finish(Array.isArray(rows) ? rows : []))
        .catch(() => finish([]));
      return () => { alive = false; };
    }

    // "All Clubs": the API has no district-wide club-newsletter endpoint, so fan
    // out across EVERY club, tag each row with its club name, and render
    // progressively as results arrive (concurrency-capped).
    setIsPending(true); setRawRows([]);
    if (!clubsReady) return () => { alive = false; }; // still loading clubs -> keep loading state
    if (!clubs.length) { setIsPending(false); return () => { alive = false; }; }

    const queue = clubs.slice();
    const MAX = 8;
    let active = 0;
    const acc: any[] = [];
    const pump = () => {
      while (active < MAX && queue.length) {
        active++;
        const club = queue.shift()!;
        RotaryAPI.clubNewsletters(club.id)
          .then((rows: any) => {
            const arr = Array.isArray(rows) ? rows : [];
            for (let k = 0; k < arr.length; k++) {
              if (arr[k]) { arr[k].__clubName = club.name; acc.push(arr[k]); }
            }
          })
          .catch(() => {})
          .then(() => {
            if (!alive) return;
            active--;
            setRawRows(acc.slice());
            setIsPending(false); // show results as they arrive
            pump();
          });
      }
    };
    pump();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, clubId, clubs, clubsReady]);

  const visibleItems = useMemo(
    () => computeItems(rawRows, query, clubId, clubs, variant, pdfResolved),
    [rawRows, query, clubId, clubs, variant, pdfResolved],
  );

  // PROD-only: confirm which physical folder each governor GML lives in and repaint
  // with the working URL. DEV (config.proxy null) can't probe (no .ashx, media host
  // has no CORS) — pdfUrlFor already serves the legacy gmlUrl directly there.
  useEffect(() => {
    if (variant !== 'governor' || !config.proxy) return;
    visibleItems.forEach((n) => {
      const fpath = n._fpath;
      if (!fpath || pdfResolved[fpath] || probingRef.current.has(fpath)) return;
      const legacy = RotaryAPI.gmlLegacyPath(fpath);
      if (!legacy) return;
      probingRef.current.add(fpath);
      const cands = [fpath, legacy]; // try the row's own path first, then legacy
      (function next(i: number) {
        if (i >= cands.length) return; // exists nowhere -> keep the guess
        headOk(cands[i]).then((ok) => {
          if (!ok) return next(i + 1);
          setPdfResolved((prev) => ({ ...prev, [fpath]: resolveMedia(cands[i]) }));
        });
      })(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleItems, variant]);

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="newsletters">

      {/* ---- Page Banner (navy gradient title + breadcrumb; title/crumb per variant) ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">{bannerTitle}</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="text-white/70">Newsletters</span>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">{bannerTitle}</span>
            </nav>
          </div>
        </div>
      </section>

      {/* ---- Page content ---- */}
      <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8">
        <div className="newsletters-root">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* The club variant gets a club picker (ANY club in the district) so a
                newsletter uploaded for any club is reachable. The governor variant
                is district-level (Monthly Letters), so it shows no club selector. */}
            {variant === 'club' && (
              <div className="relative w-full sm:w-[320px]">
                <Icon cls="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue">{ICON.chevronDown}</Icon>
                <select
                  aria-label="Select a club"
                  value={clubId}
                  onChange={(e) => { setClubId(e.target.value); setQuery(''); }}
                  className="newsletters-select w-full appearance-none rounded-xl border border-divider bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-ink shadow-soft outline-none focus:border-brand-blue/40 focus:ring-2 focus:ring-brand-blue/15"
                >
                  <option value={ALL_CLUBS}>All Clubs</option>
                  {!clubs.length && <option value="" disabled>Loading clubs…</option>}
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="relative w-full sm:max-w-md">
              <Icon cls="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">{ICON.search}</Icon>
              <input
                type="search"
                placeholder="Search by title or date…"
                aria-label="Search newsletters"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="newsletters-search w-full rounded-xl border border-divider bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-soft outline-none placeholder:text-muted focus:border-brand-blue/40 focus:ring-2 focus:ring-brand-blue/15"
              />
            </div>
          </div>

          <div className="newsletters-list">
            {isPending ? (
              <LoadingState />
            ) : !visibleItems.length ? (
              <EmptyState variant={variant} query={query} />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map((n) => (
                  <Card key={n.id} n={n} onOpen={() => setPreview(n)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {preview && <Preview n={preview} onClose={() => setPreview(null)} />}
    </main>
  );
}
