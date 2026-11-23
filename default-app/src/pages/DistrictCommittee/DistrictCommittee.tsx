import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../../api/client';
import { loadCommittee, type Card, type Section } from './districtCommitteeData';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------ glyphs (mirror the ASPX markup exactly) ------------------------------ */
// Fallback avatar shown when a member has no photo (or the photo 404s).
const UserGlyph = () => (
  <div className="relative flex h-full items-end justify-center">
    <svg className="h-24 w-24 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);
const Building2 = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
  </svg>
);

/* ----------------------------- member card ----------------------------- */
// Portrait spotlight: full-bleed photo, navy gradient scrim, text overlaid at
// the bottom. Club line is always visible below lg (no hover on touch) and
// hover-revealed at lg+.
function MemberCard({ card, visible }: { card: Card; visible: boolean }) {
  const [imgError, setImgError] = useState(false);
  const showImg = card.photo && !imgError;
  return (
    <article
      data-q={card.q}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#0a1c44] shadow-card ring-1 ring-divider/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-brand-gold/40"
      style={{ display: visible ? undefined : 'none' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c265f] to-[#0a1c44]" />
      {showImg ? (
        <img src={card.photo} alt={card.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onError={() => setImgError(true)} />
      ) : (
        <UserGlyph />
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0a1c44] via-[#0a1c44]/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        {card.role && <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-gold">{card.role}</p>}
        <h3 className="mt-0.5 text-[15px] font-bold leading-tight text-white">{card.name}</h3>
        <span className="mt-1.5 block h-[3px] w-9 rounded-full bg-brand-gold transition-all duration-300 group-hover:w-14" />
        {card.club && (
          <p className="mt-2 flex items-start gap-1.5 overflow-hidden text-[12px] font-medium leading-snug text-white/85 transition-all duration-300 lg:max-h-0 lg:translate-y-1 lg:opacity-0 lg:group-hover:max-h-16 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"><Building2 />{card.club}</p>
        )}
      </div>
    </article>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">{children}</div>
);

/* ------------------------- committee filter dropdown ------------------------- */
// Custom listbox replacing the native <select>, whose popup can't be styled or
// animated. Click-outside / Escape close; the panel animates via .dd-panel.
function FilterDropdown({ titles, value, onChange }: { titles: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const items = ['All Committees', ...titles];
  const selIdx = value === '' ? 0 : Number(value) + 1;
  const pick = (i: number) => { onChange(i === 0 ? '' : String(i - 1)); setOpen(false); };
  return (
    <div ref={boxRef} className="relative sm:w-80">
      <button type="button" data-dc-filter aria-haspopup="listbox" aria-expanded={open} aria-label="Filter by committee" onClick={() => setOpen((o) => !o)} className="w-full rounded-xl border border-divider bg-pagebg/40 py-2.5 pl-9 pr-8 text-left text-sm font-medium text-ink outline-none transition-colors focus:border-brand-blue/40 focus:bg-white">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        <span className="block truncate">{items[selIdx]}</span>
        <svg className={'pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-transform duration-200 ' + (open ? 'rotate-180' : '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="listbox" aria-label="Filter by committee" className="dd-panel absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-divider/60">
          {items.map((t, i) => (
            <button key={i} type="button" role="option" aria-selected={i === selIdx} onClick={() => pick(i)} className={'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ' + (i === selIdx ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'font-medium text-ink hover:bg-brand-blue/5')}>
              <span className="truncate">{t}</span>
              {i === selIdx && <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- loading / empty ---------------------------- */
const Loading = () => <p className="py-16 text-center text-sm font-medium text-muted">Loading district committee…</p>;
function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="pt-6"><div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-divider/50">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      </span>
      <h2 className="mt-4 text-[18px] font-bold text-brand-bluedark">District Committee</h2>
      <p className="mt-2 text-sm font-medium text-muted">{msg}</p>
    </div></div>
  );
}

export default function DistrictCommittee() {
  const [sections, setSections] = useState<Section[] | 'error' | null>(null); // null = loading
  const [openStates, setOpenStates] = useState<boolean[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // '' = All Committees, else committee index
  const [year, setYear] = useState<string>(config.yearLabel || config.currentYearLabel || '…');

  // ---- data load (mirrors district-committee.js mount()) ----
  useEffect(() => {
    let alive = true;
    loadCommittee()
      .then((list) => {
        if (!alive) return;
        setSections(list);
        setOpenStates(list.map((s) => s.openDefault));
        // Reflect the resolved year in the banner subtitle now that RotaryAPI.ready()
        // has run (the fetch waited on it), confirming WHICH tenant/year is on screen.
        setYear(config.yearLabel || config.currentYearLabel || '…');
      })
      .catch((err) => {
        console.warn('District committee failed to load', err);
        if (alive) setSections('error');
      });
    return () => { alive = false; };
  }, []);

  // ---- search/filter opens matching sections; clearing restores the default
  //      (Executive open, rest collapsed). Mirrors wireFilters' `sec.open = ...`. ----
  useEffect(() => {
    if (!Array.isArray(sections)) return;
    const toks = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtering = toks.length > 0 || filter !== '';
    setOpenStates(sections.map((s) => filtering || s.openDefault));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  // ---- animated open/close primitives. Opening flips state (the layout effect
  //      below plays the expand); closing animates the body to height 0 FIRST
  //      and only then flips state, so the collapse is smooth instead of the
  //      native <details> snap. killTweensOf makes rapid direction changes safe. ----
  const prefersReduce = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setOpen = (i: number, open: boolean) =>
    setOpenStates((prev) => {
      if (prev[i] === open) return prev;
      const next = prev.slice();
      next[i] = open;
      return next;
    });
  const secEl = (i: number) =>
    document.querySelectorAll<HTMLDetailsElement>('.committee-root [data-sec]')[i] || null;
  const openAnim = (i: number) => {
    const el = secEl(i);
    const body = el && el.querySelector<HTMLElement>('[data-sec-body]');
    setOpen(i, true);
    // Interrupted mid-close (state still true, inline height set): resume to auto.
    if (body && el!.open && body.style.height && !prefersReduce()) {
      gsap.killTweensOf(body);
      gsap.to(body, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'height,overflow,opacity', onComplete: () => ScrollTrigger.refresh() });
    }
  };
  const closeAnim = (i: number) => {
    const el = secEl(i);
    if (!el || !el.open) return;
    const body = el.querySelector<HTMLElement>('[data-sec-body]');
    if (!body || prefersReduce()) { setOpen(i, false); return; }
    gsap.killTweensOf(body);
    gsap.to(body, {
      height: 0, opacity: 0.35, overflow: 'hidden', duration: 0.45, ease: 'power2.inOut',
      onComplete: () => {
        setOpen(i, false);
        gsap.set(body, { clearProps: 'height,overflow,opacity' });
        ScrollTrigger.refresh();
      },
    });
  };

  // ---- scroll-driven sections: a committee OPENS when its top crosses HALF the
  //      viewport scrolling down, and smoothly CLOSES again (reverse order) when
  //      it drops back past that half-screen line scrolling up. Paused while a
  //      search/filter is active — that flow owns open state there. ----
  const filteringRef = useRef(false);
  filteringRef.current = search.trim() !== '' || filter !== '';
  useEffect(() => {
    if (!Array.isArray(sections) || sections.length === 0) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.committee-root [data-sec]'));
    const triggers = els.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        onEnter: () => { if (!filteringRef.current) openAnim(i); },
        onLeaveBack: () => { if (!filteringRef.current) closeAnim(i); },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Opening/closing (and filtering) reflows everything below a section, so
  // downstream trigger positions must be recomputed.
  useEffect(() => { ScrollTrigger.refresh(); }, [openStates, search, filter]);

  // ---- smooth expand: a newly-opened section slides open (height 0 -> auto)
  //      instead of snapping. Layout effect so the collapse-to-0 lands before
  //      paint (no one-frame flash of the full content). Close stays instant. ----
  const prevOpenRef = useRef<boolean[]>([]);
  useLayoutEffect(() => {
    const prev = prevOpenRef.current;
    prevOpenRef.current = openStates;
    if (!Array.isArray(sections)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = document.querySelectorAll<HTMLElement>('.committee-root [data-sec]');
    openStates.forEach((open, i) => {
      if (!open || prev[i] || !els[i]) return;
      const body = els[i].querySelector<HTMLElement>('[data-sec-body]');
      if (!body) return;
      gsap.fromTo(
        body,
        { height: 0, opacity: 0.35, overflow: 'hidden' },
        { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'height,overflow,opacity', onComplete: () => ScrollTrigger.refresh() },
      );
    });
  }, [openStates, sections]);

  // ---- row-by-row card reveal: cards start hidden and batch-animate in as
  //      they enter the viewport, so each grid row rises one after the other
  //      while scrolling instead of the whole section appearing at once. ----
  useLayoutEffect(() => {
    if (!Array.isArray(sections) || sections.length === 0) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = gsap.utils.toArray<HTMLElement>('.committee-root article[data-q]');
    if (!cards.length) return;
    gsap.set(cards, { opacity: 0, y: 24 });
    const batch = ScrollTrigger.batch(cards, {
      start: 'top 94%',
      once: true,
      // clearProps transform at the end so the CSS hover lift works again
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }),
    });
    return () => {
      batch.forEach((t) => t.kill());
      gsap.set(cards, { clearProps: 'opacity,transform' });
    };
  }, [sections]);

  const list = Array.isArray(sections) ? sections : [];

  // ---- visibility: token AND-match on each card's name/designation/club haystack;
  //      a query matching a committee's NAME shows that whole committee. The dropdown
  //      pick shows only that committee. Pure show/hide (all data already rendered). ----
  const toks = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const cardHit = (c: Card, titleHit: boolean) => titleHit || toks.every((t) => c.q.indexOf(t) > -1);
  const view = list.map((sec, i) => {
    const titleHit = toks.length > 0 && toks.every((t) => sec.title.toLowerCase().indexOf(t) > -1);
    const pickedOut = filter !== '' && filter !== String(i);
    const directVis = sec.cards.map((c) => cardHit(c, titleHit));
    const subs = sec.subs.map((sub) => {
      const vis = sub.cards.map((c) => cardHit(c, titleHit));
      return { vis, anyVis: vis.some(Boolean) };
    });
    const shown = directVis.filter(Boolean).length + subs.reduce((n, s) => n + s.vis.filter(Boolean).length, 0);
    return { titleHit, pickedOut, directVis, subs, shown, sectionVisible: !pickedOut && shown > 0 };
  });
  const anyShown = view.some((v) => v.sectionVisible);

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="district-committee">

      {/* ---- Page Banner (navy gradient title + breadcrumb) ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">District Committee</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">District Committee</span>
            </nav>
            <p className="mt-1.5 text-sm font-medium text-white/70">Rotary Year <span className="committee-year font-semibold text-brand-gold">{year}</span></p>
          </div>
        </div>
      </section>

      {/* ---- Search + committee filter ---- */}
      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8 xl:px-12">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/50 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="search" data-dc-search value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, designation, club or committee…" aria-label="Search committee members" className="w-full rounded-xl border border-divider bg-pagebg/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-blue/40 focus:bg-white focus:ring-2 focus:ring-brand-blue/15" />
          </div>
          <FilterDropdown titles={list.map((s) => s.title)} value={filter} onChange={setFilter} />
        </div>
      </div>

      {/* ---- Committee listing (Executive + each committee group) ---- */}
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 xl:px-12">
        <div className="committee-root">
          {sections === null ? (
            <Loading />
          ) : sections === 'error' ? (
            <EmptyState msg="We could not load the district committee right now. Please try again later." />
          ) : list.length === 0 ? (
            <EmptyState msg="No committee has been published for this district and year yet." />
          ) : (
            <>
              {list.map((sec, i) => {
                const v = view[i];
                return (
                  <details
                    key={i}
                    data-sec
                    data-title={sec.title.toLowerCase()}
                    data-open-default={sec.openDefault ? '' : undefined}
                    className="group mb-11"
                    open={openStates[i] ?? sec.openDefault}
                    style={{ display: v.sectionVisible ? undefined : 'none' }}
                  >
                    {/* preventDefault: manual toggles go through the SAME animated
                        open/close path as the scroll triggers (native toggle snaps) */}
                    <summary
                      className="mb-5 flex cursor-pointer select-none list-none items-center gap-3 [&::-webkit-details-marker]:hidden"
                      onClick={(e) => {
                        e.preventDefault();
                        if (openStates[i] ?? sec.openDefault) closeAnim(i);
                        else openAnim(i);
                      }}
                    >
                      <h2 className="text-[19px] font-bold text-brand-bluedark sm:text-[21px]">{sec.title}</h2>
                      <span data-count className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[12px] font-semibold text-brand-blue">{v.shown}</span>
                      <span className="h-px flex-1 bg-divider" />
                      <svg className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </summary>

                    <div data-sec-body>
                      {sec.cards.length > 0 && (
                        <Grid>{sec.cards.map((c, j) => <MemberCard key={j} card={c} visible={v.directVis[j]} />)}</Grid>
                      )}

                      {sec.subs.map((sub, si) => (
                        <div key={si} data-sub style={{ display: v.subs[si].anyVis ? undefined : 'none' }}>
                          <div className="mb-4 mt-8 flex items-center gap-2.5">
                            <h3 className="text-[15px] font-bold text-brand-bluedark">{sub.title}</h3>
                            <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-semibold text-brand-gold">{sub.cards.length}</span>
                            <span className="h-px flex-1 bg-divider/70" />
                          </div>
                          <Grid>{sub.cards.map((c, j) => <MemberCard key={j} card={c} visible={v.subs[si].vis[j]} />)}</Grid>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
              {!anyShown && <p className="py-16 text-center text-sm font-medium text-muted">No committee members match your search.</p>}
            </>
          )}
        </div>
      </div>

    </main>
  );
}
