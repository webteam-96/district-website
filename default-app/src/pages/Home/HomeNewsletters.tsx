/* HomeNewsletters.tsx — the Home "Newsletters" section: the Governor's Monthly
   Letter as a featured magazine-cover card (+ earlier-issue chips) beside the
   latest club bulletins from across the district.

   SMART LOADING:
   • Nothing loads until the section is about to scroll into view
     (IntersectionObserver, 600px early) — Home's initial load is untouched.
   • GMLs = ONE request (RotaryAPI.districtNewsletters), render instantly.
   • Club bulletins have NO aggregate endpoint — they reuse the SAME cached
     per-club fan-out infrastructure as the calendar's Club Events (clubData.ts)
     and STREAM in per batch: the "latest 8" list re-sorts live while scanning.
   • Featured GML = newest across ALL years (a current-year-only filter would
     render the section empty for districts like 3011 today); its derived
     Rotary-year chip keeps the vintage honest.
   • PDF URLs resolve exactly like the Newsletters page: linkUrl wins; GML
     filePaths use the legacy-group guess upgraded by a PROD-only head-probe. */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';
import { allClubNewsletters, type RawClubNewsletter } from './clubData';

/* ------------------------------- helpers ------------------------------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(raw: any): string {
  const d = raw ? new Date(raw) : null;
  if (!d || isNaN(d.getTime())) return '';
  try { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return d.toDateString(); }
}
// Rotary year (Jul 1 – Jun 30) label for a timestamp, e.g. "2022-23".
function rotaryYearOf(ts: number): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return y + '-' + ('0' + ((y + 1) % 100)).slice(-2);
}

interface Gml { id: string; title: string; ts: number; pdf: string; fpath?: string }

/* --------------------------------- icons --------------------------------- */
function Svg({ paths, cls, sw = '2' }: { paths: string; cls: string; sw?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
const ICON = {
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
};

/* ------------------------------ preview modal ------------------------------ */
function PreviewModal({ title, sub, pdf, onClose }: { title: string; sub: string; pdf: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={title + ' preview'} onClick={onClose}>
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
            <Svg paths={ICON.doc} cls="h-[18px] w-[18px]" sw="1.9" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-bluedark">{title}</p>
            {sub ? <p className="truncate text-[12px] font-medium text-muted">{sub}</p> : null}
          </div>
          <a href={pdf} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-bluehover">
            <Svg paths={ICON.download} cls="h-4 w-4" /> Download
          </a>
          <button type="button" aria-label="Close preview" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-pagebg hover:text-ink">
            <Svg paths={ICON.x} cls="h-5 w-5" />
          </button>
        </div>
        <iframe src={pdf} title={title} className="h-full w-full flex-1 bg-pagebg" />
      </div>
    </div>
  );
}

/* --------------------------------- section --------------------------------- */
export default function HomeNewsletters() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [gmls, setGmls] = useState<Gml[] | null>(null); // null = loading
  const [clubNls, setClubNls] = useState<RawClubNewsletter[] | null>(null); // null = scanning
  const [scan, setScan] = useState<{ done: number; total: number } | null>(null);
  const [preview, setPreview] = useState<{ title: string; sub: string; pdf: string } | null>(null);
  const [gmlResolved, setGmlResolved] = useState<Record<string, string>>({});
  const probing = useRef<Set<string>>(new Set());

  // Load nothing until the section approaches the viewport — but FAIL OPEN:
  // IntersectionObserver only delivers while the tab is actually rendering
  // (hidden/occluded windows never fire it), so a fallback timer starts the
  // load anyway shortly after mount. The gate's job is just to keep this
  // section's requests out of the initial page load, and a few seconds does
  // that; it must never be able to leave the panels on skeletons forever.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(
      (es) => { if (es.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); } },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    const failOpen = window.setTimeout(() => { setVisible(true); io.disconnect(); }, 5000);
    return () => { io.disconnect(); window.clearTimeout(failOpen); };
  }, []);

  // GMLs: one request. Newest first across ALL years.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    RotaryAPI.districtNewsletters()
      .then((r: any) => {
        if (!alive) return;
        const rows = (r && r.items) || (Array.isArray(r) ? r : []);
        const list: Gml[] = [];
        rows.forEach((x: any, i: number) => {
          const link = x.linkUrl || x.LinkUrl;
          const fpath = x.filePath || x.FilePath;
          if (!link && !fpath) return;
          list.push({
            id: String(x.id != null ? x.id : i),
            title: x.title || x.Title || "Governor's Monthly Letter",
            ts: Date.parse(x.publishDateTime || x.PublishDateTime) || 0,
            // linkUrl (flipbook) wins; else the legacy-group guess (PROD probe upgrades below)
            pdf: link ? RotaryAPI.mediaUrl(link) : RotaryAPI.gmlUrl(fpath) || RotaryAPI.mediaUrl(fpath),
            fpath: link ? undefined : fpath,
          });
        });
        list.sort((a, b) => b.ts - a.ts);
        setGmls(list);
      })
      .catch(() => { if (alive) setGmls([]); });
    return () => { alive = false; };
  }, [visible]);

  // Club bulletins: shared cached fan-out, STREAMED in per batch.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setScan({ done: 0, total: 0 });
    allClubNewsletters(
      (done, total) => { if (alive) setScan({ done, total }); },
      (found) => { if (alive) setClubNls(found.slice().sort((a, b) => b.ts - a.ts)); },
    )
      .then((all) => { if (alive) { setClubNls(all.slice().sort((a, b) => b.ts - a.ts)); setScan(null); } })
      .catch(() => { if (alive) { setClubNls([]); setScan(null); } });
    return () => { alive = false; };
  }, [visible]);

  // PROD-only: probe each displayed GML's candidates (api path vs legacy group
  // folder) through ApiProxy.ashx?head= and upgrade the URL to the one that
  // actually exists. In DEV (no .ashx, media host has no CORS) the legacy guess
  // is served as-is — same behaviour as the Newsletters page.
  // Featured only ("Earlier issues" removed per user), SELECTED Rotary year only
  // (user decision 2026-07-17). GML rows carry no usable yearId (fk_year_id is 0
  // on every record — see client.districtNewsletters), so the year is DERIVED
  // from publishDateTime, exactly like the Newsletters page's year filter.
  const shownGmls = (gmls || []).filter((g) => rotaryYearOf(g.ts) === config.yearLabel).slice(0, 1);
  useEffect(() => {
    if (!config.proxy || !shownGmls.length) return;
    shownGmls.forEach((g) => {
      const fpath = g.fpath;
      if (!fpath || gmlResolved[fpath] || probing.current.has(fpath)) return;
      probing.current.add(fpath);
      const legacy = RotaryAPI.gmlLegacyPath(fpath);
      const cands = [fpath, legacy].filter(Boolean) as string[];
      (function probe(i: number) {
        if (i >= cands.length) return;
        fetch(config.proxy + '?head=' + encodeURIComponent(cands[i]))
          .then((res) => res.json())
          .then((j) => {
            if (j && j.ok) setGmlResolved((prev) => ({ ...prev, [fpath]: RotaryAPI.mediaUrl(cands[i]) }));
            else probe(i + 1);
          })
          .catch(() => probe(i + 1));
      })(0);
    });
  }, [shownGmls.map((g) => g.id).join(','), gmlResolved]); // eslint-disable-line react-hooks/exhaustive-deps

  const gmlPdf = (g: Gml) => (g.fpath && gmlResolved[g.fpath]) || g.pdf;
  const featured = shownGmls[0];
  // CLUB BULLETINS: the SELECTED Rotary year ONLY (user decision — matches the
  // Newsletters page's year filter exactly): a row's own yearId wins; rows
  // without one fall back to the year derived from publishDateTime. Already
  // sorted newest-first when stored. (GMLs deliberately stay latest-across-years.)
  const inSelectedYear = (n: RawClubNewsletter) =>
    n.yearId > 0 ? n.yearId === config.yearId : rotaryYearOf(n.ts) === config.yearLabel;
  const yearClub = (clubNls || []).filter(inSelectedYear);
  const latestClub = yearClub.slice(0, 8);
  const scanning = scan !== null;

  return (
    <div ref={hostRef} className="mt-6 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-divider/60">
      <div className="grid lg:grid-cols-[2fr_3fr]">

        {/* ============ Governor's Monthly Letter (featured) — warm "press desk" panel ============ */}
        <div className="border-b border-divider/60 bg-gradient-to-br from-[#fff4dd] via-[#fffdf7] to-white p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-blue/60">Governor&rsquo;s Monthly Letter</p>
            <Link to="/newsletters?variant=governor" className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-blue transition-colors hover:text-brand-bluedark">
              View all <Svg paths={ICON.arrowRight} cls="h-3.5 w-3.5" sw="2.25" />
            </Link>
          </div>

          {gmls === null ? (
            /* skeleton */
            <div className="mt-5 flex gap-4" aria-hidden="true">
              <div className="h-44 w-36 shrink-0 animate-pulse rounded-xl bg-divider/80" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-divider" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-divider/70" />
                <div className="h-8 w-2/3 animate-pulse rounded-lg bg-divider/60" />
              </div>
            </div>
          ) : !featured ? (
            /* empty */
            <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                <Svg paths={ICON.mail} cls="h-7 w-7" sw="1.8" />
                <Svg paths={ICON.sparkles} cls="absolute -right-2.5 -top-2 h-5 w-5 text-brand-gold" sw="2" />
              </span>
              <p className="text-sm font-semibold text-muted">No Governor&rsquo;s Monthly Letters in {config.yearLabel} yet.</p>
            </div>
          ) : (
            <>
              {/* featured issue: CSS magazine cover (atop a "stack" of earlier issues) + details */}
              <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                <div className="relative shrink-0 self-start">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -rotate-[5deg] rounded-xl bg-white shadow-sm ring-1 ring-divider" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -rotate-[2.5deg] rounded-xl bg-[#dfe8f6] shadow-sm ring-1 ring-divider/70" />
                  <button type="button" aria-label={'Preview ' + featured.title}
                    onClick={() => setPreview({ title: featured.title, sub: 'Governor’s Monthly Letter · ' + fmtDate(featured.ts), pdf: gmlPdf(featured) })}
                    className="group relative flex h-48 w-36 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#1e57c4] via-[#16429B] to-[#0A1F4D] p-3.5 text-left text-white shadow-md ring-1 ring-brand-bluedark/20 transition-transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60">
                    <span aria-hidden="true" className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/5" />
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-9 -left-6 h-24 w-24 rounded-full bg-brand-gold/10" />
                    <img src="/default/assets/img/rotary-logo-white.png" alt="" className="h-6 w-auto self-start opacity-95" />
                    <span>
                      <span className="block font-script text-[30px] font-bold leading-none text-brand-gold">{MONTHS[new Date(featured.ts).getMonth()] || ''}</span>
                      <span className="mt-1 block text-[12px] font-semibold text-white/75">{new Date(featured.ts).getFullYear() || ''}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/85 transition-colors group-hover:text-white">
                      <Svg paths={ICON.eye} cls="h-3.5 w-3.5" /> Read issue
                    </span>
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-brand-gold/15 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wide text-amber-700">
                    Latest · {rotaryYearOf(featured.ts)}
                  </span>
                  <h3 className="mt-2 text-[17px] font-bold leading-snug text-brand-bluedark line-clamp-3">{featured.title}</h3>
                  <p className="mt-1.5 text-[12.5px] font-medium text-muted">Published {fmtDate(featured.ts)}</p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPreview({ title: featured.title, sub: 'Governor’s Monthly Letter · ' + fmtDate(featured.ts), pdf: gmlPdf(featured) })}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-bluehover">
                      <Svg paths={ICON.eye} cls="h-4 w-4" /> Preview
                    </button>
                    <a href={gmlPdf(featured)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-divider bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand-blue transition-colors hover:bg-pagebg">
                      <Svg paths={ICON.download} cls="h-4 w-4" /> Download
                    </a>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>

        {/* ============ latest club bulletins ============ */}
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600/80">
              Club Newsletters <span className="ml-1 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-extrabold tracking-normal text-amber-700">{config.yearLabel}</span>
            </p>
            <Link to="/newsletters?variant=club" className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-blue transition-colors hover:text-brand-bluedark">
              View all <Svg paths={ICON.arrowRight} cls="h-3.5 w-3.5" sw="2.25" />
            </Link>
          </div>

          {/* scan progress (streams while the list below fills in) */}
          {scanning && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-divider">
                <div className="h-full rounded-full bg-brand-gold transition-all duration-300"
                  style={{ width: (scan && scan.total ? Math.round((scan.done / scan.total) * 100) : 4) + '%' }} />
              </div>
              <span className="shrink-0 text-[11.5px] font-semibold text-muted">
                {scan && scan.total ? 'Scanning clubs… ' + scan.done + '/' + scan.total : 'Loading clubs…'}
              </span>
            </div>
          )}

          {/* max-h ≈ 5 rows (each row is 44px + 2×10px padding); the rest scrolls.
              data-lenis-prevent hands the wheel to this scroller, not Lenis. */}
          <div data-lenis-prevent className="slim-scroll mt-3 max-h-[334px] flex-1 overflow-y-auto pr-1">
            {clubNls === null && !latestClub.length ? (
              /* skeleton rows while the first batches arrive */
              <ul className="flex flex-col gap-1" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3.5 px-2.5 py-2.5">
                    <span className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-divider/80" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-divider" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-divider/70" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : !latestClub.length && !scanning ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/15 text-amber-600">
                  <Svg paths={ICON.doc} cls="h-7 w-7" sw="1.8" />
                  <Svg paths={ICON.sparkles} cls="absolute -right-2.5 -top-2 h-5 w-5 text-brand-gold" sw="2" />
                </span>
                <p className="text-sm font-semibold text-muted">No club newsletters in {config.yearLabel} yet.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {latestClub.map((n) => (
                  <li key={n.id} className="group flex items-center gap-3.5 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-pagebg/70">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-amber-600">
                      <Svg paths={ICON.doc} cls="h-5 w-5" sw="1.9" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink" title={n.title}>{n.title}</p>
                      <p className="mt-0.5 truncate text-[12px] font-medium text-muted">{[n.clubName, fmtDate(n.ts)].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" aria-label={'Preview ' + n.title}
                        onClick={() => setPreview({ title: n.title, sub: [n.clubName, fmtDate(n.ts)].filter(Boolean).join(' · '), pdf: n.pdf })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-blue/10 hover:text-brand-blue">
                        <Svg paths={ICON.eye} cls="h-[18px] w-[18px]" />
                      </button>
                      <a href={n.pdf} target="_blank" rel="noopener noreferrer" aria-label={'Download ' + n.title}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-blue/10 hover:text-brand-blue">
                        <Svg paths={ICON.download} cls="h-[18px] w-[18px]" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* footer note: how much is on the full page (same year filter there) */}
          {clubNls !== null && yearClub.length > latestClub.length && (
            <p className="mt-3 border-t border-divider/60 pt-3 text-[12px] font-medium text-muted">
              Showing the {latestClub.length} most recent — {yearClub.length} bulletins in {config.yearLabel} on the{' '}
              <Link to="/newsletters?variant=club" className="font-semibold text-brand-blue hover:text-brand-bluedark">Newsletters page</Link>.
            </p>
          )}
        </div>
      </div>

      {preview && <PreviewModal title={preview.title} sub={preview.sub} pdf={preview.pdf} onClose={() => setPreview(null)} />}
    </div>
  );
}
