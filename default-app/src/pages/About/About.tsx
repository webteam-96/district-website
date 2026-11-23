/* About.tsx — "About Us" page. Renders the district's about/history content from
   /api/districts/{id}/website-data/about (returns [{ content (HTML), isActive }]).
   Most districts have no about content (the matching nav link is hidden by
   app.js for those), so this page also shows a graceful "not available" state
   if reached directly. Ported 1:1 from js/about.js. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';
import { sanitizeAdminHtml } from '../../api/adminHtml';

/* ---- inline SVG helper (mirrors about.js svg()) ---- */
function Svg({ paths, cls, sw = 2 }: { paths: React.ReactNode; cls: string; sw?: number }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
}
const ARROW_LEFT = (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
const CHEVRON = <path d="m9 18 6-6-6-6" />;

function Banner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
      <div className="mx-auto max-w-[1000px] px-5 py-7 sm:px-8">
        <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">About Us</h1>
        <p className="mt-1.5 max-w-xl text-[13.5px] text-white/70">
          Who we are, what we do, and how District {config.districtNumber} serves.
        </p>
        <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
          <Svg paths={CHEVRON} cls="h-4 w-4 text-brand-gold" sw={2.5} />
          <span className="font-medium text-brand-gold">About Us</span>
        </nav>
      </div>
    </section>
  );
}

type State =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  /* textHtml = html with the first <img> lifted out (imgSrc); that image becomes
     part of the LAYOUT — beside or above the text depending on its shape — instead
     of an unstyled blob in the flow. Any further images stay in the text. */
  | { kind: 'content'; html: string; textHtml: string; imgSrc: string | null };

/* Lift the first <img> out of the admin HTML. If its wrapper <p> held nothing
   else, the wrapper goes too (an empty p would leave a phantom gap). */
function splitLeadImage(html: string): { textHtml: string; imgSrc: string | null } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const img = doc.querySelector('img');
  const src = img && img.getAttribute('src');
  if (!img || !src) return { textHtml: html, imgSrc: null };
  const parent = img.parentElement;
  img.remove();
  if (parent && parent.tagName === 'P' && parent.children.length === 0 && !(parent.textContent || '').trim()) parent.remove();
  return { textHtml: doc.body.innerHTML, imgSrc: src };
}

export default function About() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  /* Shape of the lead image, known only once it loads: wide (≥1.35 w/h) banners
     above the text; squarer/portrait sits beside it like the dignitary page.
     'none' = failed to load → text-only layout (a broken img helps nobody). */
  const [imgShape, setImgShape] = useState<'unknown' | 'side' | 'banner' | 'none'>('unknown');

  useEffect(() => {
    let alive = true;
    if (!RotaryAPI.get) { setState({ kind: 'unavailable' }); return; }
    RotaryAPI.get('/api/districts/' + config.districtId + '/website-data/about')
      .then((rows: any) => {
        if (!alive) return;
        const items = (rows && rows.items) ? rows.items : (Array.isArray(rows) ? rows : []);
        const item = items.filter((x: any) => (x.isActive === undefined || x.isActive) && (x.content || x.Content))[0];
        const html = item && (item.content || item.Content);
        if (!html) { setState({ kind: 'unavailable' }); return; }
        const clean = sanitizeAdminHtml(html);
        setState({ kind: 'content', html: clean, ...splitLeadImage(clean) });
      })
      .catch(() => { if (alive) setState({ kind: 'unavailable' }); });
    return () => { alive = false; };
  }, []);

  const imgSrc = state.kind === 'content' ? state.imgSrc : null;
  useEffect(() => {
    if (!imgSrc) return;
    let alive = true;
    const im = new Image();
    im.onload = () => { if (alive) setImgShape(im.naturalWidth / im.naturalHeight >= 1.35 ? 'banner' : 'side'); };
    im.onerror = () => { if (alive) setImgShape('none'); };
    im.src = imgSrc;
    return () => { alive = false; };
  }, [imgSrc]);

  const districtName = config.districtName || 'Rotary District';

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="about">
      <div data-about-root>
        {state.kind === 'loading' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
            <Svg paths={<path d="M21 12a9 9 0 1 1-6.219-8.56" />} cls="h-8 w-8 animate-spin text-brand-blue" sw={2} />
            <p className="text-sm font-semibold text-muted">Loading…</p>
          </div>
        )}

        {state.kind === 'unavailable' && (
          <>
            <Banner />
            <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
              <div className="rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-divider/50">
                <p className="text-base font-semibold text-ink">About information isn’t available for {districtName} yet.</p>
                <Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">
                  <Svg paths={ARROW_LEFT} cls="h-4 w-4" sw={2} /> Back to Home
                </Link>
              </div>
            </div>
          </>
        )}

        {state.kind === 'content' && (
          <>
            <Banner />
            <div className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8">
              {/* The content is admin-authored HTML — for most districts a plain run
                  of <p>s — so the design lives in the frame (the site's white card
                  idiom) and the .about-content typography in site.css (lede, drop
                  cap, gold-bar headings). The lead image, when there is one, is part
                  of the layout: wide → full-row banner above the text; square-ish or
                  portrait → dignitary-style photo beside it. While its shape is
                  still unknown (or it 404s) the text renders alone. */}
              {imgSrc && imgShape === 'side' ? (
                <article className="rounded-2xl bg-white shadow-card ring-1 ring-divider/50">
                  <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                    <div className="self-start px-6 pt-6 sm:px-8 sm:pt-8 md:sticky md:top-[92px] md:pr-0">
                      <img src={imgSrc} alt="" className="w-full rounded-xl ring-1 ring-divider/60" />
                    </div>
                    <div
                      className="about-content px-6 py-6 sm:px-8 sm:py-8"
                      dangerouslySetInnerHTML={{ __html: state.textHtml }}
                    />
                  </div>
                </article>
              ) : imgSrc && imgShape === 'banner' ? (
                <article className="rounded-2xl bg-white shadow-card ring-1 ring-divider/50">
                  <img src={imgSrc} alt="" className="max-h-[440px] w-full rounded-t-2xl object-cover" />
                  <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
                    <div
                      className="about-content mx-auto max-w-[720px]"
                      dangerouslySetInnerHTML={{ __html: state.textHtml }}
                    />
                  </div>
                </article>
              ) : (
                <article className="rounded-2xl bg-white px-6 py-8 shadow-card ring-1 ring-divider/50 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
                  <div
                    className="about-content mx-auto max-w-[720px]"
                    dangerouslySetInnerHTML={{ __html: imgSrc ? state.textHtml : state.html }}
                  />
                </article>
              )}
              {/* Same button as the dignitary page's back link, but at the foot here:
                  the About copy is one long read, so the exit belongs at the end of it. */}
              <div className="mt-8 flex justify-end">
                <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-brand-bluedark px-5 py-2.5 text-[13px] font-bold text-white shadow-pill transition-colors hover:bg-brand-blue">
                  <Svg paths={ARROW_LEFT} cls="h-4 w-4" sw={2.25} /> Back to Home
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
