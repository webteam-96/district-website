/* HomeCalendar.tsx — the Home "What's Happening" section: an interactive month
   calendar beside a date-wise, tabbed listing (Birthdays / Anniversaries /
   District Events / Club Events).

   Data: RotaryAPI.districtCalendar(month, year) — month-scoped; birthdays &
   anniversaries recur annually (month+day), events are exact-date. The API has
   NO aggregate club-events feed, so the Club Events tab lazily fans out over
   /api/mobile/club-finder/{clubId}/events (8 concurrent, cached per district,
   fetched only when the tab is opened; the prod proxy caches each response). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RotaryAPI from '../../api/client';
import { allClubEvents, type RawClubEvent } from './clubData';
// Admin-entered registration links often omit the scheme (see normalizeUrl).
import { normalizeUrl } from '../ClubProfile/clubProfileData';

/* ----------------------------- date helpers ----------------------------- */
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function addDays(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Monday-first 6x7 grid (42 cells) covering the visible month.
function gridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const dow = first.getDay(); // 0=Sun..6=Sat
  const back = (dow < 1 ? 7 : 0) + dow - 1 || 7; // full prior week when the 1st is a Monday
  const start = addDays(first, -back);
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) out.push(addDays(start, i));
  return out;
}

function eventTime(raw: any): string {
  const d = raw ? new Date(raw) : null;
  if (!d || isNaN(d.getTime()) || (d.getHours() === 0 && d.getMinutes() === 0)) return '';
  try { return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
}

/* ------------------------------- entry model ------------------------------- */
type EntryTab = 'birthday' | 'anniversary' | 'district' | 'club';
type TabKey = 'all' | EntryTab; // 'all' = every type mixed, date-wise
interface Entry {
  id: string;
  tab: EntryTab;
  day: number;      // day-of-month within the visible month
  name: string;
  sub?: string;     // club · designation / relation / venue line
  photo?: string;   // avatar (people) or event image
  venue?: string;
  time?: string;
  link?: string;    // event registration link
  to?: string;      // in-site detail page for this event ('' / absent = no id)
}

function dayFrom(day: any, ddmm?: any): number {
  if (day && day > 0) return day;
  const d = Number(String(ddmm == null ? '' : ddmm).split('-')[0]);
  return isFinite(d) && d > 0 ? d : 1;
}

// districtCalendar DTO -> Entry[] (birthdays + anniversaries + district events).
function mapDto(dto: any): Entry[] {
  const out: Entry[] = [];
  if (!dto || typeof dto !== 'object') return out;
  (dto.birthdays || []).forEach((x: any) => {
    out.push({
      id: 'b' + x.memberId + '-' + dayFrom(x.day, x.birthDate), tab: 'birthday', day: dayFrom(x.day, x.birthDate),
      name: x.memberName || 'Member',
      sub: [x.clubName, x.designation].filter(Boolean).join(' · '),
      photo: x.profilePhoto ? RotaryAPI.mediaUrl(x.profilePhoto) : '',
    });
  });
  (dto.familyBirthdays || []).forEach((x: any) => {
    out.push({
      id: 'fb' + (x.familyId != null ? x.familyId : x.memberId) + '-' + dayFrom(x.day, x.birthDate), tab: 'birthday', day: dayFrom(x.day, x.birthDate),
      name: x.familyMemberName || x.memberName || 'Family member',
      sub: [x.relation, x.memberName && x.relation ? 'of ' + x.memberName : x.clubName].filter(Boolean).join(' '),
      photo: x.profilePhoto ? RotaryAPI.mediaUrl(x.profilePhoto) : '',
    });
  });
  (dto.anniversaries || []).forEach((x: any) => {
    out.push({
      id: 'a' + x.memberId + '-' + dayFrom(x.day, x.anniversaryDate), tab: 'anniversary', day: dayFrom(x.day, x.anniversaryDate),
      name: x.spouseName ? x.memberName + ' & ' + x.spouseName : x.memberName || 'Member',
      sub: [x.clubName, x.designation].filter(Boolean).join(' · '),
      photo: x.profilePhoto ? RotaryAPI.mediaUrl(x.profilePhoto) : '',
    });
  });
  (dto.familyAnniversaries || []).forEach((x: any) => {
    out.push({
      id: 'fa' + (x.familyId != null ? x.familyId : x.memberId) + '-' + dayFrom(x.day, x.anniversaryDate), tab: 'anniversary', day: dayFrom(x.day, x.anniversaryDate),
      name: x.memberName != null ? x.memberName : x.familyMemberName || 'Family',
      sub: [x.relation, x.clubName].filter(Boolean).join(' · '),
      photo: x.profilePhoto ? RotaryAPI.mediaUrl(x.profilePhoto) : '',
    });
  });
  (dto.upcomingEvents || []).forEach((x: any) => {
    const raw = x.eventDate || x.date;
    const day = x.day != null ? x.day : raw ? new Date(raw).getDate() : 1;
    out.push({
      id: 'e' + (x.id != null ? x.id : x.title) + '-' + day, tab: 'district', day,
      name: x.title || x.eventTitle || x.name || 'Event',
      venue: x.eventVenue || x.venue || '',
      time: eventTime(raw),
      photo: x.imagePath ? RotaryAPI.mediaUrl(x.imagePath) : '',
      link: x.registrationLink || '',
      // These rows are the `upcoming_events` module (pk_upcoming_event_id), NOT
      // the district-events module — /upcoming-event, never /district-event.
      to: x.id != null ? '/upcoming-event?id=' + encodeURIComponent(x.id) : '',
    });
  });
  return out;
}

/* Club events come from the shared per-club fan-out in ./clubData (cached per
   district; also reused by the Home newsletters section for club bulletins). */

/* --------------------------------- icons --------------------------------- */
function Svg({ paths, cls, sw = '2' }: { paths: string; cls: string; sw?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
const ICON = {
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
  rings: '<circle cx="9" cy="14.5" r="5.3"/><circle cx="15" cy="9.5" r="5.3"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  mapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
};

/* ----------------------------- tab definitions -----------------------------
   Full literal class strings (never concatenated) so the compiled Tailwind
   build keeps them. Club Events uses the violet accent (already safelisted). */
const TABS: {
  key: TabKey; label: string; short: string; icon: string;
  activeCls: string; softCls: string; dotCls: string; textCls: string; badgeIdleCls: string;
  empty: string;
}[] = [
  // Priority order (user decision): Club Events lead, then District Events,
  // then Birthdays, then Anniversaries. This array's order drives the tab bar,
  // the All-tab day sub-sections, and the day-header chips.
  {
    key: 'all', label: 'All', short: 'All', icon: ICON.layers,
    activeCls: 'bg-brand-bluedark text-white shadow-pill', softCls: 'bg-brand-blue/10 text-brand-blue', dotCls: 'bg-brand-blue',
    textCls: 'text-brand-blue', badgeIdleCls: 'bg-brand-blue/10 text-brand-blue', empty: 'Nothing this month yet.',
  },
  {
    key: 'club', label: 'Club Events', short: 'Club', icon: ICON.users,
    activeCls: 'bg-violet-600 text-white shadow-pill', softCls: 'bg-violet-600/10 text-violet-600', dotCls: 'bg-violet-600',
    textCls: 'text-violet-600', badgeIdleCls: 'bg-violet-600/10 text-violet-600', empty: 'No club events this month.',
  },
  {
    key: 'district', label: 'District Events', short: 'District', icon: ICON.flag,
    activeCls: 'bg-evt text-white shadow-pill', softCls: 'bg-evtsoft text-evt', dotCls: 'bg-evt',
    textCls: 'text-evt', badgeIdleCls: 'bg-evt/10 text-evt', empty: 'No district events this month.',
  },
  {
    key: 'birthday', label: 'Birthdays', short: 'Birthdays', icon: ICON.cake,
    activeCls: 'bg-bday text-white shadow-pill', softCls: 'bg-bdaysoft text-bday', dotCls: 'bg-bday',
    textCls: 'text-bday', badgeIdleCls: 'bg-bday/10 text-bday', empty: 'No birthdays this month.',
  },
  {
    key: 'anniversary', label: 'Anniversaries', short: 'Anniversaries', icon: ICON.rings,
    activeCls: 'bg-anniv text-white shadow-pill', softCls: 'bg-annivsoft text-anniv', dotCls: 'bg-annivdot',
    textCls: 'text-anniv', badgeIdleCls: 'bg-anniv/10 text-anniv', empty: 'No anniversaries this month.',
  },
];
const TAB_OF: Record<TabKey, (typeof TABS)[number]> = TABS.reduce((a, t) => { a[t.key] = t; return a; }, {} as any);

/* ------------------------------- entry rows ------------------------------- */
function Avatar({ photo, name, soft, textCls }: { photo?: string; name: string; soft: string; textCls: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [photo]);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (photo && !broken) {
    return <img src={photo} alt="" loading="lazy" onError={() => setBroken(true)}
      className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white" />;
  }
  return (
    <span className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ring-2 ring-white shadow-sm ' + soft + ' ' + textCls}>
      {initials || <Svg paths={ICON.user} cls="h-5 w-5" sw="1.9" />}
    </span>
  );
}

// Rows style by the ENTRY's own type (so the All feed stays colour-coded).
function PersonRow({ e, tab }: { e: Entry; tab: (typeof TABS)[number] }) {
  return (
    <li className="flex items-center gap-3.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-pagebg/70">
      <Avatar photo={e.photo} name={e.name} soft={tab.softCls.split(' ')[0]} textCls={tab.textCls} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink" title={e.name}>{e.name}</p>
        {e.sub ? <p className="mt-0.5 truncate text-[12px] font-medium text-muted">{e.sub}</p> : null}
      </div>
      <span className={'shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ' + tab.badgeIdleCls}>
        {tab.key === 'birthday' ? 'Birthday' : 'Anniversary'}
      </span>
    </li>
  );
}

function EventRow({ e, tab }: { e: Entry; tab: (typeof TABS)[number] }) {
  const [broken, setBroken] = useState(false);
  return (
    <li className="rounded-2xl border border-divider/60 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-3.5">
        {e.photo && !broken ? (
          <img src={e.photo} alt="" loading="lazy" onError={() => setBroken(true)} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className={'flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ' + tab.softCls}>
            <Svg paths={tab.icon} cls="h-7 w-7" sw="1.8" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {/* The title is the link (not the whole card): Register below is its
              own anchor, and an <a> inside an <a> is invalid. */}
          <p className="text-[14px] font-bold leading-snug text-brand-bluedark line-clamp-2">
            {e.to ? <Link to={e.to} className="transition-colors hover:text-brand-blue">{e.name}</Link> : e.name}
          </p>
          {e.sub ? <p className={'mt-0.5 text-[12px] font-semibold ' + tab.textCls}>{e.sub}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-medium text-muted">
            {e.time ? (<span className="flex items-center gap-1"><Svg paths={ICON.clock} cls="h-3.5 w-3.5" />{e.time}</span>) : null}
            {e.venue ? (<span className="flex min-w-0 items-center gap-1"><Svg paths={ICON.mapPin} cls="h-3.5 w-3.5 shrink-0" /><span className="truncate">{e.venue}</span></span>) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {e.link ? (
              <a href={normalizeUrl(e.link)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-brand-bluehover">
                Register <Svg paths={ICON.external} cls="h-3.5 w-3.5" />
              </a>
            ) : null}
            {e.to ? (
              <Link to={e.to} className="text-[12px] font-semibold text-brand-blue hover:underline">View details →</Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/* --------------------------------- section --------------------------------- */
export default function HomeCalendar() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(today));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [clubEvents, setClubEvents] = useState<RawClubEvent[] | null>(null);
  const [clubProgress, setClubProgress] = useState<{ done: number; total: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const month = visibleMonth.getMonth() + 1;
  const year = visibleMonth.getFullYear();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  // Month feed (birthdays / anniversaries / district events).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    RotaryAPI.districtCalendar(month, year)
      .then((dto: any) => { if (alive) { setEntries(mapDto(dto)); setLoading(false); } })
      .catch(() => { if (alive) { setEntries([]); setLoading(false); } });
    return () => { alive = false; };
  }, [month, year]);

  // Club events: fan-out once All or Club Events is open (All is the default, so
  // this starts in the background on load); cached for the session. Only the
  // dedicated Club tab shows the blocking progress screen — in All the events
  // simply merge in when the scan completes.
  useEffect(() => {
    if ((tab !== 'club' && tab !== 'all') || clubEvents !== null) return;
    let alive = true;
    setClubProgress({ done: 0, total: 0 });
    allClubEvents((done, total) => { if (alive) setClubProgress({ done, total }); })
      .then((list) => { if (alive) { setClubEvents(list); setClubProgress(null); } })
      .catch(() => { if (alive) { setClubEvents([]); setClubProgress(null); } });
    return () => { alive = false; };
  }, [tab, clubEvents]);

  // Everything visible this month, all four tabs.
  const monthEntries = useMemo<Entry[]>(() => {
    const club: Entry[] = (clubEvents || [])
      .filter((e) => e.date.getMonth() + 1 === month && e.date.getFullYear() === year)
      .map((e, i) => ({
        id: 'c' + i + '-' + e.date.getDate(), tab: 'club' as EntryTab, day: e.date.getDate(),
        name: e.title, sub: e.clubName, venue: e.venue, time: eventTime(e.date), photo: e.image, link: e.link,
        to: e.id ? '/club-event?id=' + encodeURIComponent(e.id) : '',
      }));
    return entries.concat(club);
  }, [entries, clubEvents, month, year]);

  // The ONE day the All tab shows: the calendar-selected day, else today (current
  // month), else the month's first day that has anything (browsing other months).
  const allDay = useMemo(() => {
    if (selectedDay != null) return selectedDay;
    if (isCurrentMonth) return today.getDate();
    let min: number | null = null;
    monthEntries.forEach((e) => { if (min == null || e.day < min) min = e.day; });
    return min;
  }, [selectedDay, isCurrentMonth, monthEntries, today]);

  const counts = useMemo(() => {
    // All badge = what the All tab actually shows (that day), the type badges = month totals.
    const c: Record<TabKey, number> = {
      all: monthEntries.filter((e) => e.day === allDay).length,
      birthday: 0, anniversary: 0, district: 0, club: 0,
    };
    monthEntries.forEach((e) => { c[e.tab]++; });
    return c;
  }, [monthEntries, allDay]);

  // Calendar-day markers (which tabs have something on each day).
  const markers = useMemo(() => {
    const m: Record<number, Partial<Record<EntryTab, boolean>>> = {};
    monthEntries.forEach((e) => { (m[e.day] = m[e.day] || {})[e.tab] = true; });
    return m;
  }, [monthEntries]);

  // Listing: the type tabs show the WHOLE MONTH date-wise (narrowed by a selected
  // day); the All tab shows ONE day only — everything happening on `allDay`.
  const groups = useMemo(() => {
    let rows: Entry[];
    if (tab === 'all') rows = monthEntries.filter((e) => e.day === allDay);
    else {
      rows = monthEntries.filter((e) => e.tab === tab);
      if (selectedDay != null) rows = rows.filter((e) => e.day === selectedDay);
    }
    const byDay = new Map<number, Entry[]>();
    // Within a day (matters in All): club events → district events → birthdays → anniversaries.
    const rank: Record<EntryTab, number> = { club: 0, district: 1, birthday: 2, anniversary: 3 };
    rows.sort((a, b) => a.day - b.day || rank[a.tab] - rank[b.tab] || a.name.localeCompare(b.name));
    rows.forEach((e) => {
      if (!byDay.has(e.day)) byDay.set(e.day, []);
      byDay.get(e.day)!.push(e);
    });
    return [...byDay.entries()];
  }, [monthEntries, tab, selectedDay, allDay]);

  // Auto-scroll the listing to today's group (current month, no day filter).
  useEffect(() => {
    if (loading || selectedDay != null || !isCurrentMonth || !listRef.current) return;
    const list = listRef.current;
    const el = list.querySelector<HTMLElement>('[data-day-group="' + today.getDate() + '"]');
    // rect-based: immune to offsetParent differences between wrapper divs
    if (el) list.scrollTop = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    else list.scrollTop = 0;
  }, [loading, tab, selectedDay, isCurrentMonth, groups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const goPrev = () => { setVisibleMonth((m) => addMonths(m, -1)); setSelectedDay(null); };
  const goNext = () => { setVisibleMonth((m) => addMonths(m, 1)); setSelectedDay(null); };
  const goToday = () => { setVisibleMonth(startOfMonth(today)); setSelectedDay(today.getDate()); };
  const days = gridDays(visibleMonth);
  const activeTab = TAB_OF[tab];

  function weekdayLabel(day: number) {
    try { return new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'long' }); } catch (e) { return ''; }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-divider/60">
      <div className="grid lg:grid-cols-[5fr_7fr] xl:grid-cols-[2fr_3fr]">

        {/* ================= calendar panel (navy spotlight — echoes the dignitary cards) ================= */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#12327b] via-[#0c265f] to-[#0a1c44] p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-brand-gold/10" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold/90">District Calendar</p>
              <h3 className="mt-0.5 text-[22px] font-extrabold leading-tight text-white">
                {MONTHS[month - 1]} <span className="text-brand-gold">{year}</span>
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" aria-label="Previous month" onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <Svg paths={ICON.chevronLeft} cls="h-[18px] w-[18px]" sw="2.5" />
              </button>
              <button type="button" onClick={goToday}
                className="rounded-full bg-brand-gold px-3.5 py-2 text-[12px] font-bold text-brand-bluedarker shadow-pill transition-colors hover:bg-brand-goldhover focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                Today
              </button>
              <button type="button" aria-label="Next month" onClick={goNext}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <Svg paths={ICON.chevronRight} cls="h-[18px] w-[18px]" sw="2.5" />
              </button>
            </div>
          </div>

          {/* weekday header */}
          <div className="mt-5 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-white/50">{w}</div>
            ))}
          </div>

          {/* day grid */}
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={MONTHS[month - 1] + ' ' + year}>
            {days.map((d, i) => {
              const inMonth = d.getMonth() + 1 === month;
              const isToday = isSameDay(d, today);
              const isSelected = inMonth && selectedDay === d.getDate();
              const mk = inMonth ? markers[d.getDate()] || {} : {};
              const base = 'relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[13px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:h-12 ';
              const cls = isToday
                ? base + 'bg-brand-gold font-bold text-brand-bluedarker shadow-md ring-2 ring-white/25'
                : isSelected
                  ? base + 'bg-white/15 font-bold text-white ring-2 ring-brand-gold'
                  : inMonth
                    ? base + 'font-medium text-white/85 hover:-translate-y-0.5 hover:bg-white/10'
                    : base + 'font-normal text-white/45 hover:bg-white/5';
              return (
                <button key={i} type="button" className={cls}
                  aria-label={d.toDateString()} aria-pressed={isSelected}
                  onClick={() => {
                    // Greyed adjacent-month day: jump the calendar to that month.
                    if (!inMonth) { setVisibleMonth(startOfMonth(d)); setSelectedDay(d.getDate()); return; }
                    setSelectedDay((cur) => (cur === d.getDate() ? null : d.getDate()));
                  }}>
                  <span>{d.getDate()}</span>
                  <span className="flex h-1.5 items-center gap-[3px]">
                    {/* the today cell is gold: keep the category colours, add a navy ring for contrast */}
                    {mk.club && <span className={'h-1.5 w-1.5 rounded-full bg-violet-400' + (isToday ? ' ring-1 ring-brand-bluedarker/40' : '')} />}
                    {mk.district && <span className={'h-1.5 w-1.5 rounded-full bg-sky-400' + (isToday ? ' ring-1 ring-brand-bluedarker/40' : '')} />}
                    {mk.birthday && <span className={'h-1.5 w-1.5 rounded-full bg-emerald-400' + (isToday ? ' ring-1 ring-brand-bluedarker/40' : '')} />}
                    {mk.anniversary && <span className={'h-1.5 w-1.5 rounded-full bg-rose-400' + (isToday ? ' ring-1 ring-brand-bluedarker/40' : '')} />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-4 text-[12px] font-medium text-white/70">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />Club Event</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" />District Event</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Birthday</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Anniversary</span>
          </div>
        </div>

        {/* ================= listing panel =================
            On lg the panel is absolutely positioned inside its cell so the
            entry list can't stretch the row — the calendar's natural height
            sets the section height and the list scrolls in what's left
            (~5 rows). Without this the list ran ~165px past the calendar,
            leaving dead navy space under the legend. */}
        <div className="relative min-w-0">
        <div className="flex min-w-0 flex-col p-5 sm:p-6 lg:absolute lg:inset-0">
          {/* tabs */}
          <div className="slim-scroll flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0" role="tablist" aria-label="Calendar categories">
            {TABS.map((t) => {
              const on = tab === t.key;
              const n = counts[t.key];
              return (
                <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.key)}
                  className={'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all ' +
                    (on ? t.activeCls : 'bg-pagebg text-ink/70 hover:bg-divider/70 hover:text-ink')}>
                  <Svg paths={t.icon} cls="h-4 w-4" sw="1.9" />
                  {t.label}
                  {n > 0 && (
                    <span className={'rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ' + (on ? 'bg-white/25 text-white' : t.badgeIdleCls)}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* selected-day chip */}
          {selectedDay != null && (
            <div className="mt-3">
              <button type="button" onClick={() => setSelectedDay(null)}
                className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 px-3 py-1.5 text-[12px] font-bold text-amber-700 transition-colors hover:bg-brand-gold/25">
                {selectedDay + ' ' + MONTHS_ABBR[month - 1] + ' only'}
                <Svg paths={ICON.x} cls="h-3.5 w-3.5" sw="2.5" />
              </button>
            </div>
          )}

          {/* date-wise content */}
          {/* data-lenis-prevent: hand the mouse wheel to THIS scroller — without it
              the page's Lenis smooth-scroll swallows wheel events over the list and
              only scrollbar-dragging works. */}
          <div ref={listRef} data-lenis-prevent className="slim-scroll mt-4 h-[430px] overflow-y-auto pr-1.5 sm:h-[470px] lg:h-auto lg:min-h-0 lg:flex-1">
            {loading || (tab === 'club' && clubEvents === null) ? (
              tab === 'club' && clubProgress ? (
                /* club fan-out progress */
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600">
                    <Svg paths={ICON.users} cls="h-7 w-7" sw="1.8" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-brand-bluedark">Gathering club events…</p>
                    <p className="mt-1 text-[12.5px] font-medium text-muted">
                      {clubProgress.total ? 'Checked ' + clubProgress.done + ' of ' + clubProgress.total + ' clubs' : 'Loading clubs…'}
                    </p>
                  </div>
                  {clubProgress.total > 0 && (
                    <div className="h-1.5 w-56 overflow-hidden rounded-full bg-divider">
                      <div className="h-full rounded-full bg-violet-600 transition-all duration-300"
                        style={{ width: Math.round((clubProgress.done / clubProgress.total) * 100) + '%' }} />
                    </div>
                  )}
                </div>
              ) : (
                /* skeleton */
                <ul className="flex flex-col gap-1" aria-hidden="true">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3.5 px-2.5 py-2">
                      <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-divider/80" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-divider" />
                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-divider/70" />
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : groups.length === 0 ? (
              /* empty state */
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className={'relative flex h-14 w-14 items-center justify-center rounded-2xl ' + activeTab.softCls}>
                  <Svg paths={activeTab.icon} cls="h-7 w-7" sw="1.8" />
                  <Svg paths={ICON.sparkles} cls="absolute -right-2.5 -top-2 h-5 w-5 text-brand-gold" sw="2" />
                </span>
                <p className="text-sm font-semibold text-muted">
                  {tab === 'all' && allDay != null
                    ? 'Nothing on ' + allDay + ' ' + MONTHS_ABBR[month - 1] + ' — pick another date on the calendar.'
                    : selectedDay != null
                      ? 'Nothing on ' + selectedDay + ' ' + MONTHS_ABBR[month - 1] + '.'
                      : activeTab.empty}
                </p>
              </div>
            ) : (
              /* grouped, date-wise list — re-animates on tab switch */
              <div key={tab + ':' + selectedDay} className="card-enter">
                {groups.map(([day, rows]) => {
                  const isTodayGroup = isCurrentMonth && day === today.getDate();
                  // Per-type split of this day's entries (rank order kept by the sort).
                  const byType = TABS.filter((t) => t.key !== 'all')
                    .map((t) => ({ t, list: rows.filter((r) => r.tab === t.key) }))
                    .filter((x) => x.list.length > 0);
                  const rowsUl = (list: Entry[]) => (
                    /* two columns on wide screens so the panel's width is used */
                    <ul className={'grid grid-cols-1 pb-2 xl:grid-cols-2 xl:gap-x-4 ' + (list.some((r) => r.tab === 'district' || r.tab === 'club') ? 'gap-y-2.5 pt-1' : 'gap-y-0.5')}>
                      {list.map((e) =>
                        e.tab === 'district' || e.tab === 'club'
                          ? <EventRow key={e.id} e={e} tab={TAB_OF[e.tab]} />
                          : <PersonRow key={e.id} e={e} tab={TAB_OF[e.tab]} />,
                      )}
                    </ul>
                  );
                  return (
                    <div key={day} data-day-group={day}>
                      {/* sticky day header */}
                      <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-white/95 px-1 py-2 backdrop-blur">
                        <span className={'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ring-1 ' +
                          (isTodayGroup ? 'bg-brand-blue text-white ring-brand-blue shadow-sm' : 'bg-brand-blue/5 text-brand-bluedark ring-brand-blue/10')}>
                          <span className="text-[14px] font-extrabold leading-none">{day}</span>
                          <span className={'mt-0.5 text-[8px] font-bold uppercase leading-none tracking-wide ' + (isTodayGroup ? 'text-white/80' : 'text-brand-blue/60')}>
                            {MONTHS_ABBR[month - 1]}
                          </span>
                        </span>
                        <span className="text-[12px] font-bold uppercase tracking-wide text-muted">{weekdayLabel(day)}</span>
                        {isTodayGroup && (
                          <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Today</span>
                        )}
                        <span className="h-px flex-1 bg-divider" aria-hidden="true" />
                        {tab === 'all' ? (
                          /* per-type count chips: the day's full picture at a glance */
                          <span className="flex shrink-0 items-center gap-1">
                            {byType.map(({ t, list }) => (
                              <span key={t.key} className={'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ' + t.badgeIdleCls}>
                                <Svg paths={t.icon} cls="h-3 w-3" sw="2.2" />
                                {list.length}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-[11.5px] font-semibold text-muted/80">{rows.length}</span>
                        )}
                      </div>
                      {tab === 'all' ? (
                        /* the whole day, organised by category: labelled sub-sections */
                        byType.map(({ t, list }) => (
                          <div key={t.key}>
                            <div className="mb-1 mt-1.5 flex items-center gap-1.5 px-1">
                              <Svg paths={t.icon} cls={'h-3.5 w-3.5 ' + t.textCls} sw="2.1" />
                              <span className={'text-[11px] font-bold uppercase tracking-[0.08em] ' + t.textCls}>{t.label}</span>
                              <span className="text-[11px] font-semibold text-muted/70">{list.length}</span>
                            </div>
                            {rowsUl(list)}
                          </div>
                        ))
                      ) : (
                        rowsUl(rows)
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>

      </div>
    </div>
  );
}
