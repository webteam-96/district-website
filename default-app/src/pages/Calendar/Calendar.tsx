/* Calendar.tsx — Calendar dashboard page.

   Faithful React/TS port of js/calendar.js (itself a vanilla port of the
   original React CalendarPage tree):
     Calendar -> PageBanner (breadcrumb) + DashboardGrid of
       [ ListCard(birthday) | ListCard(anniversary) | ListCard(event) | MonthCalendar ]
   MonthCalendar reproduces the prev/next month nav (refetches the month), the
   Monday-first weekday row (M T W T F S S), the 6x7 DayCell grid with marker dots
   (bday #2E9E5B / annivdot #E5483A / evt #16429B), the today state, roving-tabindex
   keyboard nav, click-to-select day filtering, and the Legend.

   Data: RotaryAPI.districtCalendar(month, year) is MONTH-SCOPED. The DTO is mapped
   to the CalendarEntry shape ({id,name,date:"YYYY-MM-DD",type}). Renders a loading
   (skeleton) state, then live data, and a designed "No Data Found..!" empty state
   on no-data / error. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RotaryAPI from '../../api/client';

/* ----------------------------- date helpers ----------------------------- */
// Plain-JS ports of the date-fns helpers the calendar relies on.
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function getMonth(d: Date) { return d.getMonth(); }
function getYear(d: Date) { return d.getFullYear(); }
function getDate(d: Date) { return d.getDate(); }
function addDays(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function subDays(d: Date, n: number) { return addDays(d, -n); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
function subMonths(d: Date, n: number) { return addMonths(d, -n); }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
// startOfWeek with weekStartsOn: 1 (Monday).
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day < 1 ? 7 : 0) + day - 1;
  return addDays(startOfDay(d), -diff);
}
// parse a "YYYY-MM-DD" string as a local date (no TZ drift).
function parseISO(str: string) {
  const p = String(str).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function pad(n: number) { return String(n).padStart(2, '0'); }
// "YYYY-MM-DD" -> "DD-MM" (Indian day-month order).
function formatDayMonth(isoStr: string) {
  const d = parseISO(isoStr);
  return pad(getDate(d)) + '-' + pad(getMonth(d) + 1);
}
// Date -> "June 2026".
function formatMonthYear(d: Date) { return MONTHS[getMonth(d)] + ' ' + getYear(d); }

/* ----------------------------- calendar grid ----------------------------- */
// Full 6-row (42-day) grid, Monday-first, with greyed adjacent-month days. When
// the 1st already lands on the first column a full prior week is prepended.
const GRID_DAYS = 42;
function getCalendarDays(month: Date) {
  const monthStart = startOfMonth(month);
  let start = startOfWeek(monthStart);
  if (isSameDay(start, monthStart)) start = subDays(start, 7);
  const out: Date[] = [];
  for (let i = 0; i < GRID_DAYS; i++) out.push(addDays(start, i));
  return out;
}
function chunkIntoWeeks(days: Date[]) {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}
// Birthdays & anniversaries recur annually (match month+day); events match exact.
function entryMatchesDay(entry: CalendarEntry, day: Date) {
  const entryDate = parseISO(entry.date);
  if (entry.type === 'event') return isSameDay(entryDate, day);
  return getMonth(entryDate) === getMonth(day) && getDate(entryDate) === getDate(day);
}
interface DayMarkers { hasBirthday: boolean; hasAnniversary: boolean; hasEvent: boolean }
function buildDayMarkers(day: Date, entries: CalendarEntry[]): DayMarkers {
  const m: DayMarkers = { hasBirthday: false, hasAnniversary: false, hasEvent: false };
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!entryMatchesDay(e, day)) continue;
    if (e.type === 'birthday') m.hasBirthday = true;
    else if (e.type === 'anniversary') m.hasAnniversary = true;
    else if (e.type === 'event') m.hasEvent = true;
  }
  return m;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ------------------------------- DTO mapping ------------------------------- */
type EntryType = 'birthday' | 'anniversary' | 'event';
interface CalendarEntry { id: string; name: string; date: string; type: EntryType; eventId?: string }

// Mirrors api/calendar.ts mapDtoToEntries: API DTO -> CalendarEntry[].
function iso(year: number, month: number, day: number) { return year + '-' + pad(month) + '-' + pad(day); }
function dayFrom(day: any, ddmm?: any) {
  if (day && day > 0) return day;
  const d = Number(String(ddmm == null ? '' : ddmm).split('-')[0]);
  return isFinite(d) && d > 0 ? d : 1;
}
function mapDtoToEntries(dto: any, month: number, year: number): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  if (!dto || typeof dto !== 'object') return out;
  let i, x, day;

  const birthdays = dto.birthdays || [];
  for (i = 0; i < birthdays.length; i++) {
    x = birthdays[i];
    day = dayFrom(x.day, x.birthDate);
    out.push({ id: 'bday-' + x.memberId + '-' + day, name: x.memberName, date: iso(year, month, day), type: 'birthday' });
  }
  const familyBirthdays = dto.familyBirthdays || [];
  for (i = 0; i < familyBirthdays.length; i++) {
    x = familyBirthdays[i];
    day = dayFrom(x.day);
    const label = x.relation ? x.familyMemberName + ' · ' + x.relation : x.familyMemberName;
    out.push({ id: 'fbday-' + x.familyId + '-' + day, name: label, date: iso(year, month, day), type: 'birthday' });
  }
  const anniversaries = dto.anniversaries || [];
  for (i = 0; i < anniversaries.length; i++) {
    x = anniversaries[i];
    day = dayFrom(x.day, x.anniversaryDate);
    const aname = x.spouseName ? x.memberName + ' & ' + x.spouseName : x.memberName;
    out.push({ id: 'anniv-' + x.memberId + '-' + day, name: aname, date: iso(year, month, day), type: 'anniversary' });
  }
  const familyAnniversaries = dto.familyAnniversaries || [];
  for (i = 0; i < familyAnniversaries.length; i++) {
    x = familyAnniversaries[i];
    day = dayFrom(x.day, x.anniversaryDate);
    out.push({
      id: 'fanniv-' + (x.familyId != null ? x.familyId : x.memberId) + '-' + day,
      name: x.memberName != null ? x.memberName : x.familyMemberName,
      date: iso(year, month, day),
      type: 'anniversary',
    });
  }
  const upcomingEvents = dto.upcomingEvents || [];
  for (i = 0; i < upcomingEvents.length; i++) {
    x = upcomingEvents[i];
    const title = x.title || x.eventTitle || x.name || 'Event';
    const raw = x.eventDate || x.date;
    day = x.day != null ? x.day : (raw ? new Date(raw).getDate() : 1);
    // eventId: these are `upcoming_events` rows, so they have a view page at
    // /upcoming-event — same link the Home calendar's District Events give.
    const eventId = x.id != null ? x.id : x.eventId;
    out.push({ id: 'evt-' + (eventId != null ? eventId : title) + '-' + day, name: title, date: iso(year, month, day), type: 'event', eventId: eventId != null ? String(eventId) : '' });
  }
  return out;
}

/* ------------------------------- icons (svg) ------------------------------- */
// Raw path markup injected verbatim (keeps the exact lucide/brand paths).
function Svg({ paths, cls, sw, color }: { paths: string; cls: string; sw: string; color?: string }) {
  return (
    <svg
      className={cls}
      style={color ? { color } : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}
const ICON = {
  calendarDays:
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  partyPopper:
    '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
  gift:
    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  megaphone:
    '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  user:
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  // BrandIcons.RingsIcon — two interlocking rings (Anniversary header).
  rings: '<circle cx="9" cy="14.5" r="5.3"/><circle cx="15" cy="9.5" r="5.3"/>',
  // BrandIcons.CalendarStarIcon — calendar with a star (Events header).
  calendarStar:
    '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18"/><path d="M8 2.5v3"/><path d="M16 2.5v3"/><path d="M12 11.6 12.73 13.6 14.9 13.66 13.18 14.99 13.79 17.1 12 15.85 10.21 17.1 10.82 14.99 9.1 13.66 11.27 13.6 Z" fill="currentColor" stroke="none"/>',
};

/* ------------------------------- list cards ------------------------------- */
// Header/badge icons, accent colour and soft-bg per variant (ListCard.tsx).
const VARIANTS: Record<EntryType, {
  title: string; accent: string; soft: string; softText: string;
  headerIcon: string; badgeIcon: string; viewAllLabel: string;
}> = {
  birthday: {
    title: 'Birthday', accent: '#2E9E5B', soft: 'bg-bdaysoft', softText: 'text-bday',
    headerIcon: ICON.calendarDays, badgeIcon: ICON.partyPopper, viewAllLabel: 'View All',
  },
  anniversary: {
    title: 'Anniversary', accent: '#F08020', soft: 'bg-annivsoft', softText: 'text-anniv',
    headerIcon: ICON.rings, badgeIcon: ICON.gift, viewAllLabel: 'View All',
  },
  event: {
    title: 'Events', accent: '#16429B', soft: 'bg-evtsoft', softText: 'text-evt',
    headerIcon: ICON.calendarStar, badgeIcon: ICON.megaphone, viewAllLabel: 'View All Events',
  },
};

function EntryRow({ entry, accent, soft }: { entry: CalendarEntry; accent: string; soft: string }) {
  return (
    <li className="row-animate flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-pagebg">
      <span className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ' + soft}>
        <Svg paths={ICON.user} cls="h-[22px] w-[22px]" sw="1.9" color={accent} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink" title={entry.name}>
          {entry.eventId
            ? <Link to={'/upcoming-event?id=' + encodeURIComponent(entry.eventId)} className="transition-colors hover:text-brand-blue">{entry.name}</Link>
            : entry.name}
        </p>
        <p className="mt-0.5 text-[12.5px] font-medium text-muted">{formatDayMonth(entry.date)}</p>
      </div>
    </li>
  );
}

function SkeletonRows({ accent }: { accent: string }) {
  return (
    <ul className="flex flex-col" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3.5 px-2 py-2.5">
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-full opacity-20" style={{ backgroundColor: accent }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-divider" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-divider" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ accent }: { accent: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="relative">
        <svg width="92" height="92" viewBox="0 0 92 92" fill="none" aria-hidden="true">
          <rect x="14" y="20" width="64" height="58" rx="9" fill="#EEF3FB" stroke="#CBD5E6" strokeWidth="2.5" />
          <path d="M14 35h64" stroke="#CBD5E6" strokeWidth="2.5" />
          <rect x="27" y="11" width="5" height="15" rx="2.5" fill="#CBD5E6" />
          <rect x="60" y="11" width="5" height="15" rx="2.5" fill="#CBD5E6" />
          <circle cx="32" cy="50" r="3.6" fill="#CBD5E6" />
          <circle cx="46" cy="50" r="3.6" fill="#CBD5E6" />
          <circle cx="60" cy="50" r="3.6" fill="#CBD5E6" />
          <circle cx="32" cy="63" r="3.6" fill="#CBD5E6" />
          <circle cx="46" cy="63" r="3.6" fill="#CBD5E6" />
        </svg>
        <Svg paths={ICON.sparkles} cls="absolute -right-2 -top-1 h-7 w-7" sw="2" color={accent} />
      </div>
      <p className="text-sm font-semibold text-muted">No Data Found..!</p>
    </div>
  );
}

function ListCard({ variant, entries, isLoading }: { variant: EntryType; entries: CalendarEntry[]; isLoading: boolean }) {
  const v = VARIANTS[variant];
  let body: JSX.Element;
  if (isLoading) body = <SkeletonRows accent={v.accent} />;
  else if (!entries.length) body = <EmptyState accent={v.accent} />;
  else body = <ul className="flex flex-col">{entries.map((e) => <EntryRow key={e.id} entry={e} accent={v.accent} soft={v.soft} />)}</ul>;

  // No "View All" button — the body scrolls (overflow-y-auto) so all entries are
  // reachable; pb-6 keeps the old footer's bottom spacing.
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-divider/70">
      <div className="flex items-start justify-between px-6 pt-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Svg paths={v.headerIcon} cls="h-[22px] w-[22px]" sw="2" color={v.accent} />
            <h2 className="text-[17px] font-semibold text-ink">{v.title}</h2>
          </div>
          <span className="mt-2 block h-[3px] w-14 rounded-full" style={{ backgroundColor: v.accent }} />
        </div>
        <span className={'flex h-10 w-10 items-center justify-center rounded-full ' + v.soft}>
          <Svg paths={v.badgeIcon} cls="h-5 w-5" sw="2" color={v.accent} />
        </span>
      </div>
      <div className="slim-scroll mt-4 max-h-[440px] flex-1 overflow-y-auto px-4 pb-6 xl:max-h-none">
        {body}
      </div>
    </section>
  );
}

/* ------------------------------ month calendar ----------------------------- */
function DayCell({ day, markers, inMonth, isToday, isSelected, tabbable, index, onSelect, onKeyDown }: {
  day: Date; markers: DayMarkers; inMonth: boolean; isToday: boolean; isSelected: boolean;
  tabbable: boolean; index: number; onSelect: (d: Date) => void; onKeyDown: (e: React.KeyboardEvent, index: number) => void;
}) {
  const numberClass = isToday
    ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-[13px] font-semibold text-white shadow-sm'
    : 'text-[13.5px] ' + (inMonth ? 'font-medium text-ink' : 'font-normal text-muted/40');

  const btnClass =
    'group relative flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60 ' +
    (isSelected && !isToday ? 'ring-2 ring-brand-blue/40 ' : '') +
    (!isToday ? 'hover:bg-brand-blue/5' : '');

  const iso = day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate());

  return (
    <button
      type="button"
      role="gridcell"
      data-cal-day={iso}
      data-cal-index={index}
      tabIndex={tabbable ? 0 : -1}
      aria-label={day.toDateString()}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected ? 'true' : 'false'}
      className={btnClass.replace(/\s+$/, '')}
      onClick={() => onSelect(day)}
      onKeyDown={(e) => onKeyDown(e, index)}
    >
      <span className={numberClass}>{getDate(day)}</span>
      {isToday ? (
        <span className="text-[7.5px] font-semibold uppercase leading-none tracking-[0.08em] text-brand-blue">Today</span>
      ) : (
        <span className="flex h-1.5 items-center justify-center gap-1">
          {markers.hasBirthday && <span className="h-1.5 w-1.5 rounded-full bg-bday" aria-hidden="true" />}
          {markers.hasAnniversary && <span className="h-1.5 w-1.5 rounded-full bg-annivdot" aria-hidden="true" />}
          {markers.hasEvent && <span className="h-1.5 w-1.5 rounded-full bg-evt" aria-hidden="true" />}
        </span>
      )}
    </button>
  );
}

function MonthCalendar({ month, today, entries, selectedDate, onPrev, onNext, onSelect }: {
  month: Date; today: Date; entries: CalendarEntry[]; selectedDate: Date | null;
  onPrev: () => void; onNext: () => void; onSelect: (d: Date) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const days = getCalendarDays(month);
  const weeks = chunkIntoWeeks(days);

  // Roving tab index: today if it's in view, else the first day.
  let tabbableIndex = 0;
  for (let t = 0; t < days.length; t++) {
    if (isSameDay(days[t], today)) { tabbableIndex = t; break; }
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const cols = 7;
    const total = 42;
    let next = index;
    switch (e.key) {
      case 'ArrowRight': next = index + 1; break;
      case 'ArrowLeft': next = index - 1; break;
      case 'ArrowDown': next = index + cols; break;
      case 'ArrowUp': next = index - cols; break;
      case 'Home': next = index - (index % cols); break;
      case 'End': next = index - (index % cols) + (cols - 1); break;
      default: return;
    }
    if (next >= 0 && next < total) {
      e.preventDefault();
      const target = gridRef.current && gridRef.current.querySelector<HTMLElement>('[data-cal-index="' + next + '"]');
      if (target) target.focus();
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/70">
      {/* header */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#1e57c4] via-[#1a4aad] to-[#153f91] px-3 py-3 text-white shadow-soft">
        <button type="button" aria-label="Previous month" onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <Svg paths={ICON.chevronLeft} cls="h-[18px] w-[18px]" sw="2.5" />
        </button>
        <span className="text-[15px] font-semibold tracking-wide">{formatMonthYear(month)}</span>
        <button type="button" aria-label="Next month" onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <Svg paths={ICON.chevronRight} cls="h-[18px] w-[18px]" sw="2.5" />
        </button>
      </div>
      {/* weekday row */}
      <div className="grid grid-cols-7 gap-1.5 px-1 pb-1 pt-3">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[12px] font-semibold uppercase tracking-wide text-muted">{w}</div>
        ))}
      </div>
      {/* grid */}
      <div ref={gridRef} role="grid" className="mt-1 flex flex-1 flex-col gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid flex-1 grid-cols-7 gap-1.5">
            {week.map((day, di) => {
              const index = wi * 7 + di;
              return (
                <DayCell
                  key={index}
                  day={day}
                  markers={buildDayMarkers(day, entries)}
                  inMonth={isSameMonth(day, month)}
                  isToday={isSameDay(day, today)}
                  isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                  tabbable={index === tabbableIndex}
                  index={index}
                  onSelect={onSelect}
                  onKeyDown={handleKeyDown}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-4 text-[13px] font-medium text-muted">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-bday" />Birthday</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-annivdot" />Anniversary</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-evt" />Events</span>
      </div>
    </section>
  );
}

/* --------------------------------- page ---------------------------------- */
export default function Calendar() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(today));
  // Default the selection to TODAY so the Birthday / Anniversary / Event cards
  // show today's items on load. Clicking another day re-filters to it; clicking
  // the selected day clears the filter (shows the whole month).
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the month whenever it changes (mount + prev/next). districtCalendar is
  // MONTH-SCOPED and already waits for tenant resolution internally.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const month = getMonth(visibleMonth) + 1; // API expects 1-12
    const year = getYear(visibleMonth);
    RotaryAPI.districtCalendar(month, year)
      .then((dto: any) => {
        if (cancelled) return;
        setEntries(mapDtoToEntries(dto, month, year));
        setIsLoading(false);
      })
      .catch(() => {
        // No-data / error: keep the month frame, show the designed empty state.
        if (cancelled) return;
        setEntries([]);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [visibleMonth]);

  // Leaving the current month clears the day filter so the visited month shows
  // its full lists (the default-today selection only makes sense on the month
  // that actually contains today).
  const goPrev = () => { setVisibleMonth((m) => subMonths(m, 1)); setSelectedDate(null); };
  const goNext = () => { setVisibleMonth((m) => addMonths(m, 1)); setSelectedDate(null); };
  // Toggle: clicking the selected day clears the filter (handleSelectDate).
  const selectDay = (day: Date) =>
    setSelectedDate((cur) => (cur && isSameDay(cur, day) ? null : day));

  // Per-type list, further filtered to the selected day when one is set.
  const listFor = (type: EntryType) => {
    let rows = entries.filter((e) => e.type === type);
    if (selectedDate) rows = rows.filter((e) => entryMatchesDay(e, selectedDate!));
    return rows;
  };

  return (
    <main className="flex-1" data-page="calendar">

      {/* ---- Page Banner (navy gradient title + breadcrumb) ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">Calendar</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">Calendar</span>
            </nav>
          </div>
        </div>
      </section>

      {/* ---- Dashboard grid: Birthdays / Anniversaries / Events / Month calendar ---- */}
      <div className="mx-auto max-w-[1720px] px-5 pb-12 pt-8 sm:px-8">
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:[&>*]:h-[500px]">
          <div className="card-enter" style={{ animationDelay: '0ms' }} data-cal="birthday">
            <ListCard variant="birthday" entries={listFor('birthday')} isLoading={isLoading} />
          </div>
          <div className="card-enter" style={{ animationDelay: '90ms' }} data-cal="anniversary">
            <ListCard variant="anniversary" entries={listFor('anniversary')} isLoading={isLoading} />
          </div>
          <div className="card-enter" style={{ animationDelay: '180ms' }} data-cal="event">
            <ListCard variant="event" entries={listFor('event')} isLoading={isLoading} />
          </div>
          <div className="card-enter" style={{ animationDelay: '270ms' }} data-cal="calendar">
            <MonthCalendar month={visibleMonth} today={today} entries={entries} selectedDate={selectedDate} onPrev={goPrev} onNext={goNext} onSelect={selectDay} />
          </div>
        </div>
      </div>

    </main>
  );
}
