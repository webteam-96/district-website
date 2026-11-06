import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import MonthPicker from '../../shared/MonthPicker';
import { R, initials, longDate, monthLabel, parseISO, toISO, weekdayName, type CalEntry } from '../../shared/rotary';
import { Title } from './Sections';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const pad2 = (n: number) => String(n).padStart(2, '0');
const ORDER = C.types.map(t => t.key);
const EVENT = new Set<CalEntry['type']>(['club', 'district']);
const MAX = 3; // entries shown inside a day column before "+N more"
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const weekStart = (d: Date) => addDays(d, -((d.getDay() - C.weekStartsOn + 7) % 7));
const shortMonth = (d: Date) => monthLabel(d).slice(0, 3);
const range = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${monthLabel(a)}` : `${a.getDate()} ${shortMonth(a)} – ${b.getDate()} ${shortMonth(b)} ${b.getFullYear()}`;
const describe = (d: Date, list: CalEntry[]) => {
  const parts = C.types.map(t => ({ t, n: list.filter(e => e.type === t.key).length })).filter(x => x.n)
    .map(x => `${x.n} ${x.n === 1 ? x.t.label.toLowerCase() : x.t.group.toLowerCase()}`);
  return `${longDate(d)}${parts.length ? ', ' + parts.join(', ') : ', nothing scheduled'}`;
};

/* Birthdays / anniversaries as name pills. Phones show the first few until asked (CSS hides the rest). */
function People({ list, label }: { list: CalEntry[]; label: string }) {
  const [all, setAll] = useState(false);
  return (
    <>
      <ul className={`dv-people ${all ? 'is-all' : ''}`}>
        {list.map((e, k) => (
          <li key={k} className={`dv-person dv-person--${e.type}`}>
            <span className="dv-person__av" aria-hidden="true">{initials(e.name ?? '')}</span>
            <span className="dv-person__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
          </li>
        ))}
      </ul>
      {list.length > 6 && (
        <button type="button" className="dvg__more" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${num(list.length)} ${label.toLowerCase()}`}
        </button>
      )}
    </>
  );
}

/* 6 · What's Happening as a week planner: seven day columns with their first entries,
   and a tear-off page underneath with everything on the picked day. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const board = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ x: 0, w: 0 });
  const sel = parseISO(selected);
  const start = weekStart(sel);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start.getTime()]);
  const listFor = (iso: string) => (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab).sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const dayList = listFor(selected);
  const groups = C.types.map(t => ({ t, list: dayList.filter(e => e.type === t.key) })).filter(g => g.list.length);
  const isToday = selected === C.today;

  useLayoutEffect(() => {
    const el = chips.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [tab]);

  /* on narrow screens the week scrolls sideways: keep the picked day in view */
  useEffect(() => {
    const box = board.current;
    const el = box?.querySelector<HTMLElement>(`[data-date="${selected}"]`);
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    const l = el.offsetLeft, r = l + el.offsetWidth; // the board is the offsetParent
    if (l < box.scrollLeft || r > box.scrollLeft + box.clientWidth) box.scrollTo({ left: l - 4, behavior: 'smooth' });
  }, [selected]);

  const move = (date: Date) => {
    const iso = toISO(date);
    setSelected(iso);
    requestAnimationFrame(() => board.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus());
  };
  const onKey = (e: KeyboardEvent) => {
    const d = new Date(sel);
    const dow = (d.getDay() - C.weekStartsOn + 7) % 7;
    if (e.key === 'ArrowRight') d.setDate(d.getDate() + 1);
    else if (e.key === 'ArrowLeft') d.setDate(d.getDate() - 1);
    else if (e.key === 'ArrowDown') d.setDate(d.getDate() + 7);
    else if (e.key === 'ArrowUp') d.setDate(d.getDate() - 7);
    else if (e.key === 'Home') d.setDate(d.getDate() - dow);
    else if (e.key === 'End') d.setDate(d.getDate() + (6 - dow));
    else if (e.key === 'PageDown') d.setMonth(d.getMonth() + 1);
    else if (e.key === 'PageUp') d.setMonth(d.getMonth() - 1);
    else return;
    e.preventDefault();
    move(d);
  };

  return (
    <section id="calendar" className="cal" aria-labelledby="cal-title">
      <div className="wrap">
        <header className="shead shead--split">
          <Title id="cal-title" text={C.eyebrow} />
          <p className="ssub">{C.subtext}</p>
        </header>

        <div className="wbar">
          <div className="wbar__nav">
            <button type="button" className="wbar__btn" aria-label="Previous week" onClick={() => setSelected(toISO(addDays(sel, -7)))}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="wbar__range" id="cal-week" aria-live="polite"><MonthPicker value={sel} today={C.today} onPick={setSelected}>{range(days[0], days[6])}</MonthPicker></p>
            <button type="button" className="wbar__btn" aria-label="Next week" onClick={() => setSelected(toISO(addDays(sel, 7)))}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="wbar__today" onClick={() => setSelected(C.today)} disabled={isToday}>{C.todayTag}</button>
          </div>
          <div ref={chips} className="chips" role="group" aria-label="Show">
            <span className="chips__pill" aria-hidden="true" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
            {C.tabs.map(t => (
              <button key={t.key} type="button" className={`chip chip--${t.key}`} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}<b>{num(C.counts[t.key])}</b>
              </button>
            ))}
          </div>
        </div>

        <div ref={board} className="wboard" role="grid" aria-labelledby="cal-week" onKeyDown={onKey}>
          <div role="row" className="wboard__row">
            {days.map((d, i) => {
              const iso = toISO(d);
              const list = listFor(iso);
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div role="gridcell" key={iso} aria-selected={iso === selected}>
                  <button
                    type="button"
                    data-date={iso}
                    tabIndex={iso === selected ? 0 : -1}
                    className={`wday ${iso === selected ? 'is-sel' : ''} ${iso === C.today ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''}`}
                    aria-label={describe(d, list)}
                    aria-current={iso === C.today ? 'date' : undefined}
                    onClick={() => setSelected(iso)}
                    style={{ ['--i' as string]: i }}
                  >
                    <span className="wday__head">
                      <span className="wday__wd">{C.weekdays[i]}</span>
                      {iso === C.today && <span className="tag-today">{C.todayTag}</span>}
                      <span className="wday__num">{pad2(d.getDate())}</span>
                    </span>
                    <span className="wday__list">
                      {list.slice(0, MAX).map((e, k) => (
                        <span key={k} className={`wchip wchip--${e.type}`}>{e.time && <i>{e.time}</i>}{e.title ?? e.name}</span>
                      ))}
                      {list.length > MAX && <span className="wday__more">+{num(list.length - MAX)} more</span>}
                      {!list.length && <span className="wday__free" aria-hidden="true">—</span>}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dayview" key={`${selected}-${tab}`}>
          <div className="dayview__date">
            <span className="dayview__wd">{weekdayName(sel)}</span>
            <span className="dayview__num">{pad2(sel.getDate())}</span>
            <span className="dayview__month">{monthLabel(sel)}</span>
            {isToday && <span className="tag-today">{C.todayTag}</span>}
          </div>
          {groups.length ? (
            <div className="dayview__body">
              {groups.map(g => (
                <div key={g.t.key} className="dvg">
                  <p className="dvg__title"><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></p>
                  {EVENT.has(g.t.key) ? (
                    <ul className="dv-events">
                      {g.list.map((e, k) => (
                        <li key={k} className={`dv-event dv-event--${e.type}`}>
                          <span className="dv-event__time">{e.time ?? '—'}</span>
                          <span className="dv-event__text">
                            <b>{e.title}</b>
                            <span>{[e.club, e.venue].filter(Boolean).join(' · ')}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <People list={g.list} label={g.t.group} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="dayview__empty">
              <span className="dayview__ring" aria-hidden="true" />
              <p>{C.emptyDay}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
