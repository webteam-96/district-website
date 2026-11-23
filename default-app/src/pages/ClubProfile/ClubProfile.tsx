/* ClubProfile.tsx — Club Profile page (reads ?id={clubId}).
   Faithful port of the ASPX ClubProfile.aspx + js/club-profile.js: a navy hero
   with a skyline + initials avatar + breadcrumb, then Club Details / At-a-Glance,
   YEAR-SCOPED Club Leadership (board-of-directors — tracks the header year), a
   searchable/paged Members roster, and a tabbed Projects | Newsletters | Events
   section. Loading, not-found and empty states mirror the original. */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { config } from '../../api/client';
import {
  initials,
  normalizeUrl,
  fmtNum,
  fmtMoney,
  dateLabel,
  resolveMedia,
  loadClub,
  loadAnalysis,
  loadMembersCount,
  loadNewsletters,
  loadEvents,
  loadLeadership,
  loadMembers,
  loadProjectImage,
  type Analysis,
  type Leader,
  type ProjectRow,
} from './clubProfileData';

/* ----------------------------- icons ----------------------------- */
const ICON_PATHS: Record<string, JSX.Element> = {
  arrowLeft: (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  chevronRight: (<path d="m9 18 6-6-6-6" />),
  calendarDays: (<><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  mapPin: (<><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>),
  globe: (<><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  handHeart: (<><path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" /><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 15 6 6" /><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" /></>),
  target: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  search: (<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>),
  arrowRight: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  fileText: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
};
function Icon({ name, className, stroke = 2 }: { name: string; className: string; stroke?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

function Skyline() {
  return (
    <svg className="pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-[45%] text-white/[0.06]" viewBox="0 0 600 160" preserveAspectRatio="xMaxYMax slice" fill="currentColor" aria-hidden="true">
      <rect x="20" y="90" width="34" height="70" /><rect x="60" y="60" width="40" height="100" /><rect x="106" y="100" width="28" height="60" /><rect x="140" y="40" width="44" height="120" /><rect x="190" y="78" width="32" height="82" /><rect x="228" y="55" width="38" height="105" /><rect x="272" y="20" width="30" height="140" /><rect x="308" y="70" width="42" height="90" /><rect x="356" y="48" width="36" height="112" /><rect x="398" y="96" width="30" height="64" /><rect x="434" y="64" width="44" height="96" /><rect x="484" y="38" width="34" height="122" /><rect x="524" y="84" width="40" height="76" />
    </svg>
  );
}

/* ----------------------------- hero ----------------------------- */
function Hero({ club }: { club: any }) {
  const name = club.name || '';
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
      <Skyline />
      <div className="relative px-5 py-8 sm:px-8 xl:px-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[13px] text-white/70">
          <Link to="/" className="hover:text-white">Home</Link>
          <Icon name="chevronRight" className="h-4 w-4 text-brand-gold" stroke={2.5} />
          <Link to="/club-finder" className="hover:text-white">Club Finder</Link>
          <Icon name="chevronRight" className="h-4 w-4 text-brand-gold" stroke={2.5} />
          <span className="font-medium text-white">{name}</span>
        </nav>
        <div className="mt-6 flex items-center gap-5">
          <span className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full border-4 border-brand-gold bg-white/95 text-2xl font-extrabold text-brand-blue shadow-lg sm:h-[120px] sm:w-[120px] sm:text-3xl">{initials(name)}</span>
          <div>
            <h1 className="text-[28px] font-bold leading-tight sm:text-[40px]">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {club.rotaryId && <span className="text-white/85">Club ID: {club.rotaryId}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------- Overview (Club Details + At a Glance) ------------------- */
function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon name={icon} className="h-[18px] w-[18px]" stroke={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-[13.5px] font-medium leading-snug text-ink">{value}</p>
      </div>
    </div>
  );
}

function Overview({ club, membersTotal, analysis }: { club: any; membersTotal: number; analysis: Analysis | null }) {
  const location =
    [club.meetingAddress, club.city, [club.state, club.pincode].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—';
  const charterLabel = dateLabel(club.charterDate);
  const links: JSX.Element[] = [];
  if (club.website)
    links.push(
      <a key="w" href={normalizeUrl(club.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-bluedark">
        <Icon name="globe" className="h-4 w-4" stroke={2.25} /> Visit Club Website
      </a>,
    );
  if (club.lat && club.lng)
    links.push(
      <a key="m" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(club.lat + ',' + club.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-bluedark">
        <Icon name="mapPin" className="h-4 w-4" stroke={2.25} /> View on Map
      </a>,
    );
  const stats = [
    { icon: 'users', label: 'Members', value: membersTotal ? fmtNum(membersTotal) : '—' },
    { icon: 'handHeart', label: 'Projects', value: analysis ? fmtNum(analysis.totalProjects) : '—' },
    { icon: 'users', label: 'Beneficiaries', value: analysis ? fmtNum(analysis.totalBeneficiaries) : '—' },
    { icon: 'clock', label: 'Volunteer Hours', value: analysis ? fmtNum(analysis.totalManHours) : '—' },
    { icon: 'target', label: 'Amount Spent', value: analysis ? fmtMoney(analysis.totalSpent) : '—' },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Club Details */}
      <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
        <h2 className="text-[18px] font-bold text-brand-bluedark">Club Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail icon="calendarDays" label="Meeting Day" value={club.meetingDay || '—'} />
          <Detail icon="clock" label="Meeting Time" value={club.meetingTime || '—'} />
          <Detail icon="mapPin" label="Location" value={location} />
          {charterLabel && <Detail icon="calendarDays" label="Chartered" value={charterLabel} />}
          {club.zone && <Detail icon="target" label="Zone" value={club.zone} />}
        </div>
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-divider/70 pt-5">{links}</div>
        )}
      </section>
      {/* At a Glance */}
      <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
        <h2 className="text-[18px] font-bold text-brand-bluedark">At a Glance</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-divider/70 bg-pagebg/40 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                <Icon name={s.icon} className="h-[18px] w-[18px]" stroke={2} />
              </span>
              <p className="mt-3 text-[22px] font-extrabold leading-none text-brand-bluedark">{s.value}</p>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- leadership ----------------------------- */
function LeaderCard({ leader }: { leader: Leader }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-divider/70 p-4">
      {leader.photo && !imgError ? (
        <img src={leader.photo} alt={leader.name} className="h-20 w-20 shrink-0 rounded-full object-cover object-top ring-2 ring-brand-gold/50" onError={() => setImgError(true)} />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xl font-bold text-brand-blue ring-2 ring-brand-gold/30">{initials(leader.name)}</span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gold">{leader.role}</p>
        <p className="mt-0.5 truncate text-[16px] font-bold text-brand-bluedark">{leader.name}</p>
        {leader.designation && leader.designation !== leader.role && (
          <p className="truncate text-[12.5px] text-muted">{leader.designation}</p>
        )}
      </div>
    </div>
  );
}

function Leadership({ clubId, fallback }: { clubId: string; fallback: any }) {
  const [data, setData] = useState<{ leaders: Leader[]; yearLabel: string } | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadLeadership(clubId, fallback).then((r) => { if (alive) setData(r); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);
  // undefined (loading) or null (hide — no board for a past/future year) → nothing.
  if (!data) return null;
  return (
    <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-bold text-brand-bluedark">Club Leadership</h2>
        {data.yearLabel && <span className="text-[12.5px] font-semibold text-muted">{data.yearLabel}</span>}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.leaders.map((l, i) => <LeaderCard key={i} leader={l} />)}
      </div>
    </section>
  );
}

/* ----------------------------- members roster ----------------------------- */
function MemberCard({ m }: { m: any }) {
  const photo = resolveMedia(m.profilePhoto);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-divider/70 p-4">
      {photo ? (
        <img src={photo} alt={m.memberName || ''} className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue">{initials(m.memberName)}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-brand-bluedark">{m.memberName || 'Member'}</p>
        {m.currentDesignation && <p className="truncate text-[12.5px] font-semibold text-brand-blue">{m.currentDesignation}</p>}
      </div>
    </div>
  );
}

function MembersSection({ clubId }: { clubId: string }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[] | null>(null); // null = loading
  const [total, setTotal] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState(false);

  // debounce the search box (300ms); a new query resets to page 1.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setErr(false);
    loadMembers(clubId, page, search)
      .then((res: any) => {
        if (!alive) return;
        const its = (res && res.items) || [];
        setTotal((res && res.totalCount) || its.length);
        if (!its.length) {
          // No members AND no active search → hide the whole section (avoids a
          // redundant empty state). A no-match on a search keeps the box.
          if (!search) { setHidden(true); return; }
          setItems([]);
          return;
        }
        setHidden(false);
        setItems(its);
      })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [clubId, page, search]);

  if (hidden) return null;
  const pageCount = Math.max(1, Math.ceil(total / 24));

  return (
    <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-brand-bluedark">
          Members<span className="ml-2 text-[13px] font-semibold text-muted">{total ? fmtNum(total) : ''}</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="search" className="h-4 w-4" stroke={2} />
          </span>
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-xl border border-divider bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-soft outline-none placeholder:text-muted focus:border-brand-blue/40 focus:ring-2 focus:ring-brand-blue/15"
            placeholder="Search members…"
            aria-label="Search members"
          />
        </div>
      </div>
      <div className="mt-6">
        {err ? (
          <p className="py-8 text-sm font-medium text-muted">Members unavailable.</p>
        ) : items === null ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-muted">Loading members…</div>
        ) : items.length === 0 ? (
          <p className="py-8 text-sm font-medium text-muted">No members match “{search}”.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m, i) => <MemberCard key={i} m={m} />)}
          </div>
        )}
      </div>
      {items && items.length > 0 && pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => { if (page > 1) setPage(page - 1); }} className="rounded-lg border border-divider bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <span className="text-sm font-semibold text-muted">Page {page} of {pageCount}</span>
          <button type="button" disabled={page >= pageCount} onClick={() => { if (page < pageCount) setPage(page + 1); }} className="rounded-lg border border-divider bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}

/* ----------------------------- tabbed section ----------------------------- */
// Lazily hydrated project mini-card (fetches its own primary photo; cached).
function ProjectMiniCard({ p }: { p: ProjectRow }) {
  const [img, setImg] = useState('');
  useEffect(() => {
    let alive = true;
    if (p.id) loadProjectImage(p.id).then((u) => { if (alive && u) setImg(u); });
    return () => { alive = false; };
  }, [p.id]);
  const date = dateLabel(p.projectDate);
  // from=: Club Service projects live on their own listing, and the detail
  // page's payload has no avenue to infer that from (same as ProjectsShared).
  const to = p.id
    ? '/project?id=' + encodeURIComponent(p.id) + (/club\s*service/i.test(p.typeOfProject || '') ? '&from=club-service' : '')
    : null;
  const cls = 'group flex flex-col overflow-hidden rounded-2xl border border-divider/70 transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-card';
  const inner = (
    <>
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-blue/10 via-brand-blue/5 to-brand-gold/10">
        {img ? (
          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-brand-blue/25"><Icon name="handHeart" className="h-9 w-9" stroke={1.5} /></span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand-gold/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#0a1f4d]">{p.typeOfProject || 'Service'}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[14.5px] font-bold leading-snug text-brand-bluedark">{p.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-muted">
          {date && <span className="inline-flex items-center gap-1"><Icon name="calendarDays" className="h-3.5 w-3.5 text-brand-blue" stroke={2} /> {date}</span>}
          {p.location && <span className="inline-flex items-center gap-1"><Icon name="mapPin" className="h-3.5 w-3.5 text-brand-blue" stroke={2} /> {p.location}</span>}
          {p.beneficiaries > 0 && <span className="inline-flex items-center gap-1"><Icon name="users" className="h-3.5 w-3.5 text-brand-blue" stroke={2} /> {fmtNum(p.beneficiaries)}</span>}
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-blue">View project <Icon name="arrowRight" className="h-3.5 w-3.5" stroke={2.25} /></span>
      </div>
    </>
  );
  return to ? <Link to={to} className={cls}>{inner}</Link> : <a href="#" className={cls}>{inner}</a>;
}

function NewsletterCard({ n }: { n: any }) {
  const link = n.linkUrl || n.LinkUrl;
  const url = link ? resolveMedia(link) : resolveMedia(n.filePath || n.FilePath);
  const date = dateLabel(n.publishDateTime || n.PublishDateTime);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-2xl border border-divider/70 p-4 transition hover:border-brand-blue/40 hover:shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><Icon name="fileText" className="h-5 w-5" stroke={2} /></span>
      <div className="min-w-0">
        <h3 className="text-[14px] font-bold leading-snug text-brand-bluedark">{n.title || n.Title || 'Newsletter'}</h3>
        {date && <p className="mt-0.5 text-[12px] font-semibold text-brand-gold">{date}</p>}
        <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-blue">{link ? 'Open' : 'Open PDF'} <Icon name="arrowRight" className="h-3.5 w-3.5" stroke={2.25} /></span>
      </div>
    </a>
  );
}

function ClubEventCard({ e }: { e: any }) {
  const date = dateLabel(e.eventDate);
  // The feed's field is `venue` (eventVenue never existed on this DTO).
  const meta = [date, e.venue].filter(Boolean).join(' · ');
  // Register stays its own anchor, so the title — not the card — is the link
  // to the detail page (an <a> inside an <a> is invalid).
  return (
    <div className="flex gap-3 rounded-2xl border border-divider/70 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue"><Icon name="calendarDays" className="h-6 w-6" stroke={1.8} /></span>
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-bold leading-snug text-brand-bluedark">
          <Link to={'/club-event?id=' + encodeURIComponent(e.eventId)} className="transition-colors hover:text-brand-blue">{e.title || 'Event'}</Link>
        </h3>
        {meta && <p className="mt-0.5 text-[12.5px] text-muted">{meta}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to={'/club-event?id=' + encodeURIComponent(e.eventId)} className="text-[12.5px] font-semibold text-brand-blue hover:underline">View details →</Link>
          {e.registrationLink && (
            <a href={normalizeUrl(e.registrationLink)} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-brand-blue hover:underline">Register →</a>
          )}
        </div>
      </div>
    </div>
  );
}

function TabsSection({ analysis, newsletters, events, yearLabel }: { analysis: Analysis | null; newsletters: any[]; events: any[]; yearLabel: string }) {
  const [active, setActive] = useState<'projects' | 'newsletters' | 'events'>('projects');
  const [cat, setCat] = useState('all');
  const [projLimit, setProjLimit] = useState(9);
  const projTotal = analysis ? analysis.totalProjects : 0;

  const tabs: { key: 'projects' | 'newsletters' | 'events'; label: string; count: number }[] = [
    { key: 'projects', label: 'Projects', count: projTotal },
  ];
  if (newsletters.length) tabs.push({ key: 'newsletters', label: 'Newsletters', count: newsletters.length });
  if (events.length) tabs.push({ key: 'events', label: 'Events', count: events.length });

  function selectTab(k: 'projects' | 'newsletters' | 'events') {
    if (active !== k) { setActive(k); setCat('all'); setProjLimit(9); }
  }
  const emptyMsg = (what: string) => (
    <p className="py-12 text-center text-sm font-medium text-muted">No {what} for {yearLabel || 'this year'}.</p>
  );

  function projectsPanel() {
    if (!analysis || !projTotal) return emptyMsg('projects');
    const chipDefs = [{ label: 'All', key: 'all', count: projTotal }].concat(
      analysis.byAvenue.map((av) => ({ label: av.label, key: av.label, count: av.count })),
    );
    const list = cat === 'all' ? analysis.projects : analysis.projects.filter((p) => p.typeOfProject === cat);
    const cards = list.slice(0, projLimit);
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {chipDefs.map((c) => {
            const on = String(cat) === String(c.key);
            return (
              <button key={c.key} type="button" onClick={() => { setCat(c.key); setProjLimit(9); }} className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ' + (on ? 'bg-brand-blue text-white' : 'bg-brand-blue/5 text-brand-bluedark hover:bg-brand-blue/10')}>
                {c.label}
                <span className={'rounded-full ' + (on ? 'bg-white/25 text-white' : 'bg-brand-blue text-white') + ' px-1.5 py-0.5 text-[11px] font-bold'}>{c.count}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((p, i) => <ProjectMiniCard key={(p.id || '') + '-' + i} p={p} />)}
        </div>
        {projLimit < list.length && (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => setProjLimit(projLimit + 9)} className="rounded-xl border border-divider bg-white px-6 py-2.5 text-sm font-semibold text-brand-blue shadow-soft transition hover:bg-pagebg">Load more ({list.length - projLimit} more)</button>
          </div>
        )}
      </>
    );
  }
  function newslettersPanel() {
    if (!newsletters.length) return emptyMsg('newsletters');
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{newsletters.map((n, i) => <NewsletterCard key={i} n={n} />)}</div>;
  }
  function eventsPanel() {
    if (!events.length) return emptyMsg('events');
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{events.map((e, i) => <ClubEventCard key={i} e={e} />)}</div>;
  }
  const panel = active === 'newsletters' ? newslettersPanel() : active === 'events' ? eventsPanel() : projectsPanel();

  return (
    <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center gap-1 border-b border-divider">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button key={t.key} type="button" onClick={() => selectTab(t.key)} className={'-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-[14px] font-semibold transition-colors ' + (on ? 'border-brand-blue text-brand-blue' : 'border-transparent text-muted hover:text-brand-bluedark')}>
              {t.label}
              <span className={'rounded-full ' + (on ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue') + ' px-2 py-0.5 text-[11px] font-bold'}>{t.count}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">{panel}</div>
    </section>
  );
}

/* --------------------------- loaded club body --------------------------- */
function ClubLoaded({ club }: { club: any }) {
  const clubId = club.id as string;
  const clubName = club.name as string;
  const [analysis, setAnalysis] = useState<Analysis | null | undefined>(undefined);
  const [membersCount, setMembersCount] = useState<number | undefined>(undefined);
  const [newsletters, setNewsletters] = useState<any[] | undefined>(undefined);
  const [events, setEvents] = useState<any[] | undefined>(undefined);

  // Shared enrichment loads (mirrors hydrateClubExtras). analysis feeds BOTH the
  // At-a-Glance stats and the Projects tab from ONE district-feed fetch.
  useEffect(() => {
    let alive = true;
    loadAnalysis(clubName).then((a) => { if (alive) setAnalysis(a); });
    loadMembersCount(clubId).then((n) => { if (alive) setMembersCount(n); });
    loadNewsletters(clubId).then((n) => { if (alive) setNewsletters(n); });
    loadEvents(clubId).then((e) => { if (alive) setEvents(e); });
    return () => { alive = false; };
  }, [clubId, clubName]);

  const overviewReady = analysis !== undefined && membersCount !== undefined;
  const tabsReady = analysis !== undefined && newsletters !== undefined && events !== undefined;

  return (
    <>
      <Hero club={club} />
      <div className="space-y-6 px-5 py-8 sm:px-8 xl:px-12">
        <Link to="/club-finder" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-bluedark">
          <Icon name="arrowLeft" className="h-4 w-4" stroke={2.25} /> Back to Club Finder
        </Link>
        {overviewReady && <Overview club={club} membersTotal={membersCount as number} analysis={analysis as Analysis | null} />}
        <Leadership clubId={clubId} fallback={club} />
        <MembersSection clubId={clubId} />
        {tabsReady && <TabsSection analysis={analysis as Analysis | null} newsletters={newsletters as any[]} events={events as any[]} yearLabel={config.yearLabel || ''} />}
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
      <p className="text-lg font-semibold text-ink">Club not found.</p>
      <Link to="/club-finder" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">
        <Icon name="arrowLeft" className="h-4 w-4" stroke={2} /> Back to Club Finder
      </Link>
    </div>
  );
}

/* ------------------------------ page ------------------------------ */
export default function ClubProfile() {
  const [sp] = useSearchParams();
  const id = sp.get('id') || '';
  const [club, setClub] = useState<any | null | undefined>(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let alive = true;
    setClub(undefined);
    if (!id) { setClub(null); return; }
    loadClub(id)
      .then((c) => { if (alive) setClub(c); })
      .catch((e) => { console.warn('Club profile failed to load', e); if (alive) setClub(null); });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (club) {
      const dn = config.districtName || 'Rotary District';
      document.title = club.name ? club.name + ' — ' + dn : document.title;
    }
  }, [club]);

  return (
    <main className="flex flex-1 flex-col bg-[#f5f8fc]" data-page="club-finder">
      <div className="flex flex-1 flex-col">
        {club === undefined ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
            <svg className="h-8 w-8 animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            <p className="text-sm font-semibold text-muted">Loading club…</p>
          </div>
        ) : club === null ? (
          <NotFound />
        ) : (
          <ClubLoaded club={club} />
        )}
      </div>
    </main>
  );
}
