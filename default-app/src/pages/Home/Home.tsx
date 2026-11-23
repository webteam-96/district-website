import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';
import { sanitizeAdminHtml } from '../../api/adminHtml';
import { initHeroCarousel } from '../../effects/hero-carousel.js';
import { initReveals } from '../../effects/reveal.js';
import HomeCalendar from './HomeCalendar';
import HomeNewsletters from './HomeNewsletters';
import {
  loadPresident,
  loadGovernor,
  loadDistrictProjects,
  loadDistrictEvents,
  loadDistrictSnapshot,
  loadHeroSlides,
  loadAds,
  fallbackHero,
  fallbackAds,
  snapNum,
  snapMoney,
  eventDateLabel,
  type Dignitary,
  type HeroSlide,
  type SnapshotData,
} from './homeData';

/* ---- small inline SVG helpers (mirror the ASPX markup exactly) ---- */
const UserGlyph = () => (
  <span className="flex h-full w-full items-center justify-center text-white/90">
    <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </span>
);
const ProjectIcon = () => (
  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
    </svg>
  </span>
);

/* ---- District Snapshot: per-metric categorical accents (literal class strings
   so Tailwind's scanner keeps them) — mirrors js/home.js SNAP_ACCENT. ---- */
const SNAP_ACCENT: Record<string, { wash: string; ring: string; chip: string }> = {
  projects: { wash: 'from-blue-600/10', ring: 'ring-blue-600/20', chip: 'bg-blue-600/10 text-blue-600' },
  hours: { wash: 'from-amber-600/10', ring: 'ring-amber-600/20', chip: 'bg-amber-600/10 text-amber-600' },
  cost: { wash: 'from-emerald-600/10', ring: 'ring-emerald-600/20', chip: 'bg-emerald-600/10 text-emerald-600' },
  beneficiaries: { wash: 'from-rose-600/10', ring: 'ring-rose-600/20', chip: 'bg-rose-600/10 text-rose-600' },
  clubs: { wash: 'from-violet-600/10', ring: 'ring-violet-600/20', chip: 'bg-violet-600/10 text-violet-600' },
  members: { wash: 'from-cyan-600/10', ring: 'ring-cyan-600/20', chip: 'bg-cyan-600/10 text-cyan-600' },
};
const SNAP_ICONS: Record<string, JSX.Element> = {
  projects: (<><path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" /><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 15 6 6" /><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" /></>),
  clubs: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></>),
  members: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  beneficiaries: (<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />),
  cost: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  hours: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
};

function SnapCard({ iconKey, value, label, href }: { iconKey: string; value: string; label: string; href?: string }) {
  const navigate = useNavigate();
  const ac = SNAP_ACCENT[iconKey] || SNAP_ACCENT.projects;
  const isLink = !!href;
  const cls =
    'group relative block overflow-hidden rounded-2xl bg-gradient-to-br ' + ac.wash +
    ' to-white p-4 shadow-sm ring-1 ' + ac.ring +
    ' transition-all duration-200 hover:-translate-y-1 hover:shadow-lg' + (isLink ? ' cursor-pointer' : '');
  const inner = (
    <>
      {isLink && (
        <span className="absolute right-3 top-3 text-muted/70 transition-transform group-hover:translate-x-0.5">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </span>
      )}
      <span className={'flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ' + ac.chip}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SNAP_ICONS[iconKey]}</svg>
      </span>
      <p className="mt-3.5 text-[26px] font-extrabold leading-none tracking-tight text-brand-bluedark">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
    </>
  );
  if (isLink) {
    return (
      <a href={href} onClick={(e) => { e.preventDefault(); navigate(href!); }} aria-label="View all club projects" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function SnapGroup({ title, colCls, gridCls, iconPaths, chipCls, children }: { title: string; colCls: string; gridCls: string; iconPaths: JSX.Element; chipCls: string; children: React.ReactNode }) {
  return (
    <section className={colCls + ' rounded-2xl bg-pagebg/50 p-4 ring-1 ring-divider/60 sm:p-5'}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' + chipCls}>
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths}</svg>
        </span>
        <h3 className="text-[15px] font-bold tracking-tight text-brand-bluedark">{title}</h3>
        <span className="ml-1 h-px flex-1 rounded bg-divider" aria-hidden="true" />
      </div>
      <div className={'grid gap-3 ' + gridCls}>{children}</div>
    </section>
  );
}

/* Plain-text excerpt of the admin-authored bio HTML. DOMParser (not innerHTML)
   so tags AND entities (&ldquo;, &amp;) resolve without touching the live DOM;
   the visible length is left to CSS line-clamp rather than a character count. */
function bioExcerpt(html?: string): string {
  const doc = new DOMParser().parseFromString(sanitizeAdminHtml(html), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/* ---- Dignitary spotlight, wide variant: used when the projects/events card is
   absent and the row is full width, so the freed space carries a bio excerpt and
   a Read More button instead of empty gutter. ---- */
function DignitaryCardWide({ d, type }: { d: Dignitary; type: 'president' | 'dg' }) {
  const [imgError, setImgError] = useState(false);
  const excerpt = bioExcerpt(d.message);
  const href = '/dignitary?type=' + type;
  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-divider/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-brand-gold/40 sm:flex-row">
      <Link to={href} className="relative block aspect-[4/5] w-full shrink-0 bg-[#0a1c44] sm:aspect-auto sm:w-[44%] sm:min-h-[300px]" aria-label={d.name}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c265f] to-[#0a1c44]" />
        {d.photo && !imgError ? (
          <img src={d.photo} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onError={() => setImgError(true)} />
        ) : (
          <div className="relative h-full"><UserGlyph /></div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-muted">Dignitary</p>
        <h3 className="mt-0.5 font-script text-[26px] font-bold leading-[1.05] text-brand-bluedark">{d.name}</h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-gold">{d.role}</p>
        <span className="mt-2 block h-[3px] w-9 rounded-full bg-brand-gold transition-all duration-300 group-hover:w-14" />
        <p className="mt-2 text-[12px] font-medium text-muted">{d.term}</p>
        {d.club && <p className="mt-0.5 text-[12px] font-medium text-muted">Rotary Club of {d.club}</p>}
        {excerpt && <p className="mt-3 line-clamp-[7] text-[13.5px] leading-relaxed text-muted">{excerpt}</p>}
        {/* mt-auto on the wrapper pins the button to the card foot (so both cards'
            buttons line up) while pt-4 keeps a gap when the text already fills it */}
        <div className="mt-auto pt-4">
          <Link to={href} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bluedark px-4 py-2 text-[12.5px] font-bold text-white shadow-pill transition-colors hover:bg-brand-blue">
            Read More
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---- Dignitary portrait spotlight (matches the committee-page card style) ---- */
function DignitaryCard({ d, type }: { d: Dignitary; type: 'president' | 'dg' }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  return (
    <article
      className="group relative aspect-[4/5] w-full max-w-[340px] cursor-pointer overflow-hidden rounded-2xl bg-[#0a1c44] shadow-card ring-1 ring-divider/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-brand-gold/40"
      onClick={() => navigate('/dignitary?type=' + type)}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c265f] to-[#0a1c44]" />
      {d.photo && !imgError ? (
        <img src={d.photo} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onError={() => setImgError(true)} />
      ) : (
        <div className="relative h-full"><UserGlyph /></div>
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0a1c44] via-[#0a1c44]/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/60">Dignitary</p>
        <h3 className="mt-0.5 font-script text-[28px] font-bold leading-[1.05] text-white">{d.name}</h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-gold">{d.role}</p>
        <span className="mt-2 block h-[3px] w-9 rounded-full bg-brand-gold transition-all duration-300 group-hover:w-14" />
        <p className="mt-2 text-[12px] font-medium text-white/80">{d.term}</p>
        {d.club && <p className="mt-0.5 text-[12px] font-medium text-white/80">Rotary Club of {d.club}</p>}
        <span className="mt-2.5 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-white transition-colors group-hover:text-brand-gold">
          Know More
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </span>
      </div>
    </article>
  );
}

const EventIcon = () => (
  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-amber-600">
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
    </svg>
  </span>
);

/* Detail route for a district row. Its yearId MUST travel with the id — these
   rows live in year-partitioned tables and the detail route takes both. */
function districtDetailTo(page: string, r: any): string {
  return '/' + page + '?id=' + encodeURIComponent(r.id) +
    (r.yearId != null ? '&year=' + encodeURIComponent(r.yearId) : '');
}

/* ---- District event card (admin-entered district-events module) ---- */
function DistrictEventCard({ e }: { e: any }) {
  const [imgError, setImgError] = useState(false);
  const img = e.primaryPhoto ? RotaryAPI.districtMedia(e.primaryPhoto, e.id) : '';
  const dateLbl = eventDateLabel(e.eventDate);
  return (
    <Link to={districtDetailTo('district-event', e)} className="flex gap-3 rounded-xl border border-divider/50 bg-pagebg/40 p-3 transition-colors hover:border-brand-blue/40 hover:bg-white">
      {img && !imgError ? (
        <img src={img} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" onError={() => setImgError(true)} />
      ) : (
        <EventIcon />
      )}
      <div className="min-w-0 flex-1">
        {dateLbl && <span className="inline-block rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">{dateLbl}</span>}
        <h3 className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug text-brand-bluedark">{e.title || 'Event'}</h3>
        {e.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{e.description}</p>}
      </div>
    </Link>
  );
}

/* ---- District-owned project card ---- */
function DistrictProjectCard({ p }: { p: any }) {
  const [imgError, setImgError] = useState(false);
  const tag = p.areaOfFocusName || p.categoryName || 'District';
  const meta = [eventDateLabel(p.projectDate), p.location].filter(Boolean).join(' · ');
  const img = p.primaryPhoto ? RotaryAPI.districtMedia(p.primaryPhoto, p.id) : '';
  return (
    <Link to={districtDetailTo('district-project', p)} className="flex gap-3 rounded-xl border border-divider/50 bg-pagebg/40 p-3 transition-colors hover:border-brand-blue/40 hover:bg-white">
      {img && !imgError ? (
        <img src={img} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" onError={() => setImgError(true)} />
      ) : (
        <ProjectIcon />
      )}
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue">{tag}</span>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug text-brand-bluedark">{p.title || 'Project'}</h3>
        {meta && <p className="mt-0.5 text-[12px] text-muted">{meta}</p>}
      </div>
    </Link>
  );
}

/* ---- District Projects + District Events, merged into one tabbed card.
   Tab pills mirror the HomeCalendar idiom; the count badge doubles as the
   "is there any data?" signal, so it renders even when the count is 0. ---- */
const HIGHLIGHT_TABS = [
  {
    key: 'events' as const,
    label: 'District Events',
    activeCls: 'bg-evt text-white shadow-pill',
    badgeIdleCls: 'bg-evt/10 text-evt',
    icon: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>),
    empty: 'No district events yet.',
  },
  {
    key: 'projects' as const,
    label: 'District Projects',
    activeCls: 'bg-brand-bluedark text-white shadow-pill',
    badgeIdleCls: 'bg-brand-blue/10 text-brand-blue',
    icon: (<><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>),
    empty: 'No district projects yet.',
  },
];

function DistrictHighlights({ projects, events }: { projects: any[] | null; events: any[] | null }) {
  const [tab, setTab] = useState<'projects' | 'events'>('events');
  const isProjects = tab === 'projects';
  const rows = isProjects ? projects : events;
  const active = HIGHLIGHT_TABS.find((t) => t.key === tab)!;
  return (
    /* On lg the card is absolutely positioned inside this cell so its list
       length can't grow the grid row — the dignitary column alone sets the
       height and the list scrolls inside whatever is left. */
    <div className="relative">
      <div className="flex h-full min-h-[420px] flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-divider/50 lg:absolute lg:inset-0 lg:min-h-0">
        <div className="slim-scroll flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0" role="tablist" aria-label="District highlights">
          {HIGHLIGHT_TABS.map((t) => {
            const on = t.key === tab;
            const n = (t.key === 'projects' ? projects : events)?.length;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.key)}
                className={'inline-flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all ' +
                  (on ? t.activeCls : 'bg-pagebg text-ink/70 hover:bg-divider/70 hover:text-ink')}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
                {t.label}
                {n != null && (
                  <span className={'rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ' + (on ? 'bg-white/25 text-white' : t.badgeIdleCls)}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* data-lenis-prevent: wheel scrolls this list, not the Lenis page scroll */}
        <div data-lenis-prevent className="slim-scroll mt-4 max-h-[460px] min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 lg:max-h-none">
          {rows == null ? (
            <div className="py-10 text-center text-sm font-semibold text-muted">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              {isProjects ? <ProjectIcon /> : <EventIcon />}
              <p className="text-sm font-semibold text-muted">{active.empty}</p>
            </div>
          ) : isProjects ? (
            rows.map((p, i) => <DistrictProjectCard key={i} p={p} />)
          ) : (
            rows.map((e, i) => <DistrictEventCard key={i} e={e} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [dignitaries, setDignitaries] = useState<(Dignitary | null)[]>([null, null]);
  const [districtProjects, setDistrictProjects] = useState<any[] | null>(null);
  const [districtEvents, setDistrictEvents] = useState<any[] | null>(null);
  const [hero, setHero] = useState<HeroSlide[] | null>(null);
  const [ads, setAds] = useState<HeroSlide[] | null>(null);

  const rootRef = useRef<HTMLElement>(null);
  const heroMainRef = useRef<HTMLDivElement>(null);
  const heroAdRef = useRef<HTMLDivElement>(null);

  // ---- data load (mirrors home.js mount()) ----
  useEffect(() => {
    let alive = true;
    loadPresident().then((p) => { if (alive && p) setDignitaries((d) => [p, d[1]]); });
    loadGovernor().then((g) => { if (alive && g) setDignitaries((d) => [d[0], g]); });
    loadDistrictProjects().then((rows) => { if (alive) setDistrictProjects(rows); });
    loadDistrictEvents().then((rows) => { if (alive) setDistrictEvents(rows); });
    loadDistrictSnapshot().then((s) => { if (alive) setSnapshot(s); });
    Promise.all([loadHeroSlides(), loadAds()]).then(([h, a]) => {
      if (!alive) return;
      setHero(h && h.length ? h : fallbackHero);
      setAds(a);
    });
    return () => { alive = false; };
  }, []);

  // ---- scroll reveals (GSAP; Lenis now lives app-wide in App.tsx) ----
  useEffect(() => {
    const r: any = initReveals(rootRef.current || document);
    return () => { if (r && typeof r.destroy === 'function') r.destroy(); };
  }, []);

  // ---- hero carousels ----
  useEffect(() => {
    if (!hero || !heroMainRef.current) return;
    const h: any = initHeroCarousel(heroMainRef.current, { slides: hero, autoplayMs: 5000, label: 'District highlights', fit: 'contain' });
    return () => { if (h && typeof h.destroy === 'function') h.destroy(); };
  }, [hero]);
  useEffect(() => {
    if (ads == null || !heroAdRef.current) return;
    const hasAds = ads && ads.length;
    const h: any = initHeroCarousel(heroAdRef.current, {
      slides: hasAds ? ads : fallbackAds,
      autoplayMs: 6500,
      badge: hasAds ? 'Advertisement' : null,
      label: hasAds ? 'Advertisements' : 'Rotary',
      fit: 'contain',
    });
    return () => { if (h && typeof h.destroy === 'function') h.destroy(); };
  }, [ads]);

  const noHighlights = districtProjects?.length === 0 && districtEvents?.length === 0;

  return (
    <main ref={rootRef} className="flex-1 bg-[#f5f8fc]" data-page="home">
      {/* ---- Section 1: HERO (70/30 carousels) ---- */}
      <section className="bg-[#f5f8fc]">
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-5 lg:grid-cols-[7fr_3fr]">
            <div ref={heroMainRef} className="hero-carousel-main h-[260px] sm:h-[360px] lg:h-[440px]" aria-label="District highlights" />
            <div ref={heroAdRef} className="hero-carousel-ad h-[220px] lg:h-[440px]" aria-label="Advertisements" />
          </div>
        </div>
      </section>

      {/* ---- District Snapshot ---- */}
      <section className="pb-2">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-divider/50 sm:p-6" data-reveal>
            <div className="text-center">
              <h2 className="text-[19px] font-bold text-brand-bluedark">District Snapshot</h2>
              <span className="mx-auto mt-2 block h-1 w-14 rounded-full bg-brand-gold" />
            </div>
            <div className="mt-6">
              {!snapshot ? (
                <div className="col-span-full py-6 text-center text-sm font-semibold text-muted">Loading snapshot…</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <SnapGroup title="Projects" colCls="lg:col-span-2" gridCls="grid-cols-2 sm:grid-cols-4" chipCls="bg-brand-blue/10 text-brand-blue" iconPaths={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />}>
                    <SnapCard iconKey="projects" value={snapNum(snapshot.projects)} label="Projects" href="/projects" />
                    <SnapCard iconKey="hours" value={snapNum(snapshot.manHours)} label="Man Hours" />
                    <SnapCard iconKey="cost" value={snapMoney(snapshot.cost)} label="Amount Spent" />
                    <SnapCard iconKey="beneficiaries" value={snapNum(snapshot.beneficiaries)} label="Beneficiaries" />
                  </SnapGroup>
                  <SnapGroup title="Membership" colCls="lg:col-span-1" gridCls="grid-cols-2" chipCls="bg-brand-gold/15 text-amber-600" iconPaths={<><path d="M18 21a8 8 0 0 0-16 0" /><circle cx="10" cy="8" r="5" /><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" /></>}>
                    <SnapCard iconKey="clubs" value={snapNum(snapshot.totalClubs)} label="Clubs" />
                    <SnapCard iconKey="members" value={snapNum(snapshot.totalMembers)} label="Members" />
                  </SnapGroup>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Section 2: DIGNITARIES (left) + PROJECTS/EVENTS tabbed card (right).
           With no projects AND no events the card is dropped and the dignitaries
           take the whole row as two wide cards (photo + bio excerpt + Read More),
           since the portrait-only card leaves the freed half empty. `?.length === 0`
           is false while still null (loading), so the card keeps its own loading
           state instead of flickering out. ---- */}
      <section className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8" data-reveal>
        <div className={'grid gap-6' + (noHighlights ? '' : ' lg:grid-cols-2')}>
          <div>
            <div className="text-center">
              <h2 className="text-[24px] font-bold text-brand-bluedark sm:text-[28px]">Dignitaries of Rotary</h2>
              <span className="mx-auto mt-2 block h-1 w-12 rounded-full bg-brand-gold" />
            </div>
            <div className={'mt-6 grid items-stretch gap-4 sm:gap-6 ' + (noHighlights ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2 justify-items-center')}>
              {dignitaries[0] && (noHighlights
                ? <DignitaryCardWide d={dignitaries[0]!} type="president" />
                : <DignitaryCard d={dignitaries[0]!} type="president" />)}
              {dignitaries[1] && (noHighlights
                ? <DignitaryCardWide d={dignitaries[1]!} type="dg" />
                : <DignitaryCard d={dignitaries[1]!} type="dg" />)}
            </div>
          </div>
          {!noHighlights && <DistrictHighlights projects={districtProjects} events={districtEvents} />}
        </div>
      </section>

      {/* ---- Section 4: WHAT'S HAPPENING (calendar + date-wise tabbed listing) ---- */}
      <section className="py-8" data-reveal>
        <div className="mx-auto max-w-[1720px] px-5 sm:px-8">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-blue/70">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
                </svg>
              </span>
              District Calendar
            </p>
            <h2 className="mt-2 text-[26px] font-extrabold leading-tight text-brand-bluedark sm:text-[32px]">
              What&rsquo;s <span className="font-script text-[38px] font-bold leading-none text-brand-gold sm:text-[48px]">Happening</span>
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted">Birthdays, anniversaries and events across District <span>{config.districtNumber}</span> — date by date. Pick a day on the calendar to zoom in.</p>
          </div>
          <HomeCalendar />
        </div>
      </section>

      {/* ---- Section 5: NEWSLETTERS (Governor's Monthly Letter + club bulletins) ---- */}
      <section className="py-8" data-reveal>
        <div className="mx-auto max-w-[1720px] px-5 sm:px-8">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-amber-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
                </svg>
              </span>
              District Press
            </p>
            <h2 className="mt-2 flex flex-wrap items-baseline gap-x-3 text-[26px] font-extrabold leading-tight text-brand-bluedark sm:text-[32px]">
              Newsletters
              <span className="inline-block -rotate-2 font-script text-[26px] font-bold leading-none text-brand-gold sm:text-[32px]">hot off the press!</span>
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted">The Governor&rsquo;s Monthly Letter and the latest bulletins from clubs across District <span>{config.districtNumber}</span>.</p>
          </div>
          <HomeNewsletters />
        </div>
      </section>
    </main>
  );
}
