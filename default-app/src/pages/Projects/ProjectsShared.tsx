/* ProjectsShared.tsx — the regions that js/projects.js rendered identically for
   BOTH the Club Projects and Club Service pages: the live analysis stat tiles,
   the category filter tabs (Club Projects only), and the card grid with lazy
   per-card photos + "Load more". Each page composes these with its own banner
   and analysis-card wrapper (which differ between the two aspx pages). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CATEGORY_TABS,
  cachedImage,
  fmtMoney,
  fmtNum,
  formatDate,
  imageKnown,
  requestCardImage,
  tabCount,
  type Project,
} from './projectsData';

/* ----------------------------- inline icons ----------------------------- */
const ImageIcon = () => (
  <svg className="h-10 w-10 text-brand-blue/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);
const ArrowRight = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
const Loader = () => (
  <svg className="h-8 w-8 animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

/* --------------------------- analysis stat tiles --------------------------- */
// Per-metric accent (coloured icon chip + faint wash + matching ring + hover
// lift), matching the home District Snapshot tiles so both pages read as one
// design system. Full literal class strings so Tailwind's scanner keeps them.
const A_ACCENT: Record<string, { wash: string; ring: string; chip: string }> = {
  projects: { wash: 'from-blue-600/10', ring: 'ring-blue-600/20', chip: 'bg-blue-600/10 text-blue-600' },
  clubs: { wash: 'from-violet-600/10', ring: 'ring-violet-600/20', chip: 'bg-violet-600/10 text-violet-600' },
  beneficiaries: { wash: 'from-rose-600/10', ring: 'ring-rose-600/20', chip: 'bg-rose-600/10 text-rose-600' },
  hours: { wash: 'from-amber-600/10', ring: 'ring-amber-600/20', chip: 'bg-amber-600/10 text-amber-600' },
  cost: { wash: 'from-emerald-600/10', ring: 'ring-emerald-600/20', chip: 'bg-emerald-600/10 text-emerald-600' },
};
const A_ICONS: Record<string, JSX.Element> = {
  projects: (<><path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" /><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 15 6 6" /><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" /></>),
  clubs: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /></>),
  beneficiaries: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  hours: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  cost: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
};

function AStat({ iconKey, value, label }: { iconKey: string; value: string; label: string }) {
  const ac = A_ACCENT[iconKey] || A_ACCENT.projects;
  return (
    <div className={'group relative overflow-hidden rounded-2xl bg-gradient-to-br ' + ac.wash + ' to-white p-4 shadow-sm ring-1 ' + ac.ring + ' transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'}>
      <span className={'flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ' + ac.chip}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{A_ICONS[iconKey]}</svg>
      </span>
      <p className="mt-3.5 text-[26px] font-extrabold leading-none tracking-tight text-brand-bluedark">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
    </div>
  );
}

// Live stats for the SELECTED category (All by default); hidden while loading.
export function AnalysisStats({ loading, list }: { loading: boolean; list: Project[] }) {
  if (loading) return null;
  let ben = 0, hrs = 0, cost = 0;
  const clubs: Record<string, 1> = {};
  list.forEach((p) => {
    ben += p.beneficiaries; hrs += p.manHours; cost += p.amountSpent;
    if (p.clubName) clubs[p.clubName] = 1;
  });
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <AStat iconKey="projects" value={fmtNum(list.length)} label="Projects" />
      <AStat iconKey="clubs" value={fmtNum(Object.keys(clubs).length)} label="Clubs Involved" />
      <AStat iconKey="beneficiaries" value={fmtNum(ben)} label="Beneficiaries" />
      <AStat iconKey="hours" value={fmtNum(hrs)} label="Volunteer Hours" />
      <AStat iconKey="cost" value={fmtMoney(cost)} label="Amount Spent" />
    </div>
  );
}

/* ----------------------------- category filter tabs ----------------------------- */
// `scope` = the club-search-scoped list, so the per-type counts reflect the
// searched club (not the whole district).
export function FilterTabs({ activeSlug, scope, onSelect }: { activeSlug: string; scope: Project[]; onSelect: (slug: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_TABS.map((t) => {
        const on = String(activeSlug) === String(t.slug);
        const n = tabCount(scope, t.slug);
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => onSelect(t.slug)}
            className={'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ' + (on ? 'bg-brand-blue text-white shadow-soft' : 'bg-brand-blue/5 text-brand-bluedark hover:bg-brand-blue/10')}
          >
            {t.label}
            {/* Only show the count badge when there's at least one project of this
               type — an empty category shows just its label, no "0". */}
            {n > 0 && (
              <span className={'rounded-full px-1.5 py-0.5 text-[11px] font-bold ' + (on ? 'bg-white/25 text-white' : 'bg-brand-blue text-white')}>{n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------- project card ----------------------------- */
function ProjectCard({ p }: { p: Project }) {
  // Real project photo once we've fetched it, otherwise the gradient placeholder.
  const [img, setImg] = useState<string>(() => (p.id ? cachedImage(p.id) : ''));
  useEffect(() => {
    if (!p.id || imageKnown(p.id)) return;
    let alive = true;
    requestCardImage(p.id, (url) => { if (alive) setImg(url || ''); });
    return () => { alive = false; };
  }, [p.id]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-divider/50 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-44 overflow-hidden">
        {img ? (
          <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-blue/10 via-brand-blue/5 to-brand-gold/10">
            <ImageIcon />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand-blue px-3 py-1 text-[11px] font-semibold text-white">{p.categoryLabel}</span>
        {p.num ? (
          <span className="absolute right-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-blue px-2 text-[13px] font-bold text-white shadow-md ring-2 ring-white/70">{p.num}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[16px] font-bold leading-snug text-brand-bluedark line-clamp-2">{p.title}</h3>
          {p.projectDate ? (
            <span className="mt-0.5 shrink-0 whitespace-nowrap rounded-full bg-brand-blue/5 px-2.5 py-1 text-[11.5px] font-semibold text-brand-blue">{formatDate(p.projectDate)}</span>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] font-semibold text-brand-blue">{p.clubName}</p>
        <p className="mt-2.5 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-muted">{p.description}</p>
        {/* from=: the public project payload carries no avenue, so the card tells
            the detail page which listing to send the user back to. */}
        {p.id ? (
          <Link to={'/project?id=' + encodeURIComponent(p.id) + (p.moduleKey === 'club_service' ? '&from=club-service' : '')} className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-bluehover">
            Read More <ArrowRight />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/* ----------------------------- grid + load-more ----------------------------- */
// Renders into the aspx [data-projects-root]: loading / empty / grid + load-more.
export function ProjectsGrid({ loading, items, limit, onLoadMore }: { loading: boolean; items: Project[]; limit: number; onLoadMore: () => void }) {
  if (loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-white text-center shadow-card ring-1 ring-divider/50">
        <Loader />
        <p className="text-sm font-semibold text-muted">Loading projects…</p>
      </div>
    );
  }
  if (!items.length) {
    return <p className="py-16 text-center text-sm font-medium text-muted">No projects found.</p>;
  }
  const visible = items.slice(0, limit);
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((p, i) => <ProjectCard key={p.id || 'i' + i} p={p} />)}
      </div>
      {limit < items.length && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={onLoadMore} className="rounded-xl border border-divider bg-white px-6 py-3 text-sm font-semibold text-brand-blue shadow-soft transition-colors hover:bg-pagebg">
            Load more ({items.length - limit} more)
          </button>
        </div>
      )}
    </>
  );
}
