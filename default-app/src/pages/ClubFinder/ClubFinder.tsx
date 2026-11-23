import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../../api/client';
import {
  loadClubs,
  enrichPresident,
  runPool,
  getFiltered,
  locationOf,
  initials,
  type Club,
  type PresInfo,
} from './clubFinderData';

const PAGE_SIZE = 12;

const AVATAR_COLORS = [
  'bg-brand-blue/10 text-brand-blue',
  'bg-emerald-500/10 text-emerald-600',
  'bg-brand-gold/15 text-amber-600',
  'bg-violet-500/10 text-violet-600',
  'bg-rose-500/10 text-rose-600',
];

/* ----------------------------- icons ----------------------------- */
const ICON: Record<string, ReactNode> = {
  calendar: (
    <>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  search: (<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.9.37 1.78.7 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.27a2 2 0 0 1 2.11-.45c.84.33 1.72.57 2.62.7A2 2 0 0 1 22 16.92z" />
  ),
};
function Svg({ paths, cls, sw = 2 }: { paths: ReactNode; cls: string; sw?: number }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
}

/* ----------------------------- card pieces ----------------------------- */
function Avatar({ club, color }: { club: Club; color: string }) {
  const [err, setErr] = useState(false);
  const ini = initials(club.name);
  if (club.logo && !err) {
    return (
      <span className={'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ' + color}>
        <img src={club.logo} alt="" className="h-full w-full object-cover" onError={() => setErr(true)} />
      </span>
    );
  }
  return (
    <span className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ' + color}>
      {ini}
    </span>
  );
}

function MeetingCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Svg paths={icon} cls="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-[13px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

// Tapping a President's phone number dials it instead of opening the card.
const dialTel = (tel: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (tel) window.location.href = 'tel:' + tel;
};

// A meeting-style cell whose value is a tappable phone number.
function ContactCell({ tel, label }: { tel: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <Svg paths={ICON.phone} cls="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Contact</p>
        <span onClick={dialTel(tel)} className="block cursor-pointer truncate text-[13px] font-semibold text-brand-blue hover:underline">
          {label}
        </span>
      </div>
    </div>
  );
}

function ClubCard({ club, color, info, view }: { club: Club; color: string; info?: PresInfo; view: 'grid' | 'list' }) {
  const href = '/club?id=' + encodeURIComponent(club.id);
  const location = locationOf(club);
  // Full address for the card's Location cell: street + city + state, so it's
  // not just the bare street line (the list endpoint carries no pincode).
  const fullLoc = [club.meetingAddress, club.city, club.state].filter(Boolean).join(', ');
  const subtitle = club.president ? 'President: ' + club.president : location || club.zoneName || '—';

  if (view === 'list') {
    return (
      <Link to={href} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/50 transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <Avatar club={club} color={color} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-brand-bluedark">{club.name}</h3>
          <p className="truncate text-[13px] text-muted">{subtitle}</p>
        </div>
        {club.meetingDay && (
          <span className="hidden items-center gap-1.5 text-[13px] font-medium text-muted sm:flex">
            <Svg paths={ICON.calendar} cls="h-4 w-4 text-brand-blue" /> {club.meetingDay}
          </span>
        )}
        {location && (
          <span className="hidden items-center gap-1.5 text-[13px] font-medium text-muted md:flex">
            <Svg paths={ICON.mapPin} cls="h-4 w-4 text-brand-blue" /> {location}
          </span>
        )}
        {/* President + contact — filled lazily (renders nothing until resolved). */}
        {info && info.name && (
          <span className="contents">
            <span className="hidden items-center gap-1.5 text-[13px] font-medium text-muted lg:flex">
              <Svg paths={ICON.user} cls="h-4 w-4 text-brand-blue" /> {info.name}
            </span>
            {info.phone && (
              <span onClick={dialTel(info.tel)} className="hidden cursor-pointer items-center gap-1.5 text-[13px] font-medium text-brand-blue hover:underline xl:flex">
                <Svg paths={ICON.phone} cls="h-4 w-4" /> {info.phone}
              </span>
            )}
          </span>
        )}
        <Svg paths={ICON.chevronRight} cls="h-5 w-5 shrink-0 text-muted" sw={2.25} />
      </Link>
    );
  }

  return (
    <Link to={href} className="group flex flex-col rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/50 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <Avatar club={club} color={color} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-brand-bluedark">{club.name}</h3>
          <p className="truncate text-[12.5px] text-muted">{subtitle}</p>
        </div>
        <Svg paths={ICON.chevronRight} cls="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" sw={2.25} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-divider/70 pt-3">
        <MeetingCell icon={ICON.calendar} label="Meeting Day" value={club.meetingDay || '—'} />
        <MeetingCell icon={ICON.mapPin} label="Location" value={fullLoc || location || '—'} />
      </div>
      {/* President + contact — filled lazily below the meeting/location grid. */}
      {info && info.name && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-divider/70 pt-3">
          <MeetingCell icon={ICON.user} label="President" value={info.name} />
          {info.phone && <ContactCell tel={info.tel} label={info.phone} />}
        </div>
      )}
    </Link>
  );
}

/* ----------------------------- state cards ----------------------------- */
function LoadingCard() {
  return (
    <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-white text-center shadow-card ring-1 ring-divider/50">
      <Svg paths={ICON.loader} cls="h-8 w-8 animate-spin text-brand-blue" />
      <p className="text-sm font-semibold text-muted">Loading clubs…</p>
    </div>
  );
}
function EmptyCard({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-white text-center shadow-card ring-1 ring-divider/50">
      <Svg paths={ICON.search} cls="h-9 w-9 text-muted" sw={1.75} />
      <p className="text-sm font-semibold text-muted">No clubs match your filters.</p>
      <button type="button" onClick={onClear} className="text-sm font-semibold text-brand-blue hover:underline">Clear filters</button>
    </div>
  );
}

/* ----------------------------- pagination ----------------------------- */
function pageList(current: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('…');
    for (let j = Math.max(2, current - 1); j <= Math.min(totalPages - 1, current + 1); j++) pages.push(j);
    if (current < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  return pages;
}
function Pagination({ current, totalPages, onGo }: { current: number; totalPages: number; onGo: (n: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors';
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button type="button" onClick={() => onGo(current - 1)} disabled={current === 1} className={btn + ' border-divider text-ink hover:bg-pagebg disabled:cursor-not-allowed disabled:opacity-40'}>
        <Svg paths={ICON.chevronLeft} cls="h-4 w-4" sw={2.25} />
        <span className="ml-1 hidden sm:inline">Previous</span>
      </button>
      {pageList(current, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={'e' + i} className="px-1.5 text-muted">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onGo(p as number)}
            aria-current={p === current ? 'page' : undefined}
            className={btn + ' ' + (p === current ? 'border-brand-blue bg-brand-blue text-white' : 'border-divider text-ink hover:bg-pagebg')}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" onClick={() => onGo(current + 1)} disabled={current === totalPages} className={btn + ' border-divider text-ink hover:bg-pagebg disabled:cursor-not-allowed disabled:opacity-40'}>
        <span className="mr-1 hidden sm:inline">Next</span>
        <Svg paths={ICON.chevronRight} cls="h-4 w-4" sw={2.25} />
      </button>
    </nav>
  );
}

/* ----------------------------- page ----------------------------- */
export default function ClubFinder() {
  const [clubs, setClubs] = useState<Club[] | null>(null); // null = loading
  const [query, setQuery] = useState('');
  const [day, setDay] = useState('');
  const [sort, setSort] = useState<'az' | 'za'>('az');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [pres, setPres] = useState<Record<string, PresInfo>>({});

  const loading = clubs === null;

  // ---- data load (mirrors club-finder.js load()) ----
  useEffect(() => {
    let alive = true;
    loadClubs().then((list) => { if (alive) setClubs(list); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(
    () => (loading ? [] : getFiltered(clubs || [], query, day, sort)),
    [loading, clubs, query, day, sort],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  // ---- lazily fill President name + contact per visible card (cache makes
  //      re-renders from sort/view/paginate instant) ----
  const visibleIds = visible.map((c) => c.id).join(',');
  useEffect(() => {
    if (!visible.length) return;
    let alive = true;
    runPool(
      visible,
      (club) =>
        enrichPresident(club.id).then((info) => {
          if (!alive || !info || !info.name) return;
          setPres((prev) => (prev[club.id] ? prev : { ...prev, [club.id]: info }));
        }),
      6,
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds]);

  const resetFilters = () => { setQuery(''); setDay(''); setPage(1); };
  const goPage = (n: number) => {
    if (!isNaN(n) && n >= 1) {
      setPage(n);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const infoText = loading
    ? 'Loading clubs…'
    : filtered.length === 0
      ? 'No clubs found'
      : 'Showing ' + (start + 1) + ' – ' + Math.min(start + PAGE_SIZE, filtered.length) + ' of ' + filtered.length + ' clubs';

  const viewBtn = (v: 'grid' | 'list') =>
    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ' +
    (view === v ? 'bg-brand-blue text-white' : 'text-muted hover:text-ink');

  return (
    <main className="flex-1" data-page="club-finder">

      {/* ---- Page Banner (navy gradient title + subtitle + breadcrumb) ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">Club Finder</h1>
            <div className="mt-1.5 max-w-2xl text-sm text-white/75 sm:text-[15px]">Explore Rotary clubs across District <span className="district-number">{config.districtNumber}</span>. Connect, collaborate and make a difference together.</div>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">Club Finder</span>
            </nav>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8">

        {/* ---- Filter bar ---- */}
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/50 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-0 flex-1 lg:basis-[260px]">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by club name, city or zone…" aria-label="Search clubs" className="w-full rounded-xl border border-divider bg-pagebg/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-blue/40 focus:bg-white focus:ring-2 focus:ring-brand-blue/15" />
          </div>

          <div className="relative lg:basis-[160px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
            <select value={day} onChange={(e) => { setDay(e.target.value); setPage(1); }} aria-label="All Days" className="w-full appearance-none rounded-xl border border-divider bg-pagebg/40 py-2.5 pl-9 pr-8 text-sm font-medium text-ink outline-none transition-colors focus:border-brand-blue/40 focus:bg-white">
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </div>

          <div className="flex items-center gap-2.5">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-bluehover">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg> Search
            </button>
            <button type="button" onClick={resetFilters} className="flex items-center gap-2 rounded-xl border border-divider px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-pagebg">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg> Reset
            </button>
          </div>
        </form>

        {/* ---- Results info + view toggle + sort ---- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted">{infoText}</p>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-divider p-0.5">
              <button type="button" onClick={() => setView('grid')} className={viewBtn('grid')}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                <span className="hidden sm:inline">Grid View</span>
              </button>
              <button type="button" onClick={() => setView('list')} className={viewBtn('list')}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" /></svg>
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Sort by:</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value === 'za' ? 'za' : 'az'); setPage(1); }} className="rounded-lg border border-divider bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand-blue/40">
                <option value="az">A – Z</option>
                <option value="za">Z – A</option>
              </select>
            </label>
          </div>
        </div>

        {/* ---- Results ---- */}
        <div>
          {loading ? (
            <LoadingCard />
          ) : filtered.length === 0 ? (
            <EmptyCard onClear={resetFilters} />
          ) : (
            <div className={view === 'grid' ? 'mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3' : 'mt-6 flex flex-col gap-3'}>
              {visible.map((club, i) => (
                <ClubCard key={club.id} club={club} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} info={pres[club.id]} view={view} />
              ))}
            </div>
          )}
        </div>

        {/* ---- Pagination ---- */}
        <div>
          {!loading && filtered.length > 0 && <Pagination current={current} totalPages={totalPages} onGo={goPage} />}
        </div>
      </div>
    </main>
  );
}
