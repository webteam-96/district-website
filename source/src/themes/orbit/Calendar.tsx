import { useState, type KeyboardEvent } from 'react';
import MonthPicker from '../../shared/MonthPicker';
import { R, initials, longDate, monthLabel, parseISO, toISO, weekdayName, type CalEntry } from '../../shared/rotary';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const EVENT = new Set<CalEntry['type']>(['club', 'district']);
/* The three lines a day can show on the dial. Club and district events share the event line. */
const LINES: { key: string; label: string; has: (t: CalEntry['type']) => boolean }[] = [
  { key: 'event', label: 'Events', has: t => EVENT.has(t) },
  { key: 'birthday', label: 'Birthdays', has: t => t === 'birthday' },
  { key: 'anniversary', label: 'Anniversaries', has: t => t === 'anniversary' }
];
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const describe = (d: Date, list: CalEntry[]) => {
  const parts = C.types.map(t => ({ t, n: list.filter(e => e.type === t.key).length })).filter(x => x.n)
    .map(x => `${x.n} ${x.n === 1 ? x.t.label.toLowerCase() : x.t.group.toLowerCase()}`);
  return `${longDate(d)}${parts.length ? ', ' + parts.join(', ') : ', nothing scheduled'}`;
};

/* 6 · District Calendar as a dial: the month's days run round a wheel. Each day shows a line for its
   events, one for birthdays and one for anniversaries, longer when there are more, and the hand
   points at the chosen day. Its entries list beside the dial. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const sel = parseISO(selected);
  const y = sel.getFullYear(), m = sel.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
  const listFor = (iso: string) => (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab);
  const lists = days.map(d => listFor(toISO(d)));
  const lineCounts = lists.map(l => LINES.map(k => l.filter(e => k.has(e.type)).length));
  const busiest = Math.max(1, ...lineCounts.flat());
  const dayList = listFor(selected);
  const groups = C.types.map(t => ({ t, list: dayList.filter(e => e.type === t.key) })).filter(g => g.list.length);
  const isToday = selected === C.today;
  const angle = (i: number) => (i / count) * 360;

  const shiftMonth = (delta: number) => {
    const last = new Date(y, m + delta + 1, 0).getDate();
    setSelected(toISO(new Date(y, m + delta, Math.min(sel.getDate(), last))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = new Date(sel);
    if (e.key === 'ArrowRight') d.setDate(d.getDate() + 1);
    else if (e.key === 'ArrowLeft') d.setDate(d.getDate() - 1);
    else if (e.key === 'ArrowDown') d.setDate(d.getDate() + 7);
    else if (e.key === 'ArrowUp') d.setDate(d.getDate() - 7);
    else if (e.key === 'Home') d.setDate(1);
    else if (e.key === 'End') d.setDate(count);
    else if (e.key === 'PageDown') d.setMonth(d.getMonth() + 1);
    else if (e.key === 'PageUp') d.setMonth(d.getMonth() - 1);
    else return;
    e.preventDefault();
    const iso = toISO(d);
    const dial = e.currentTarget;
    setSelected(iso);
    requestAnimationFrame(() => dial.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus());
  };

  return (
    <section id="calendar" className="cal" aria-labelledby="cal-title">
      <div className="wrap">
        <header className="shead">
          <h2 id="cal-title" className="stitle">{C.eyebrow}</h2>
          <p className="ssub">{C.subtext}</p>
        </header>

        <div className="cal__grid">
          <div className="cal__left">
            <div className="dialbar">
              <button type="button" className="dialbar__btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <p className="dialbar__month" id="cal-month" aria-live="polite"><MonthPicker value={sel} today={C.today} onPick={setSelected}>{monthLabel(sel)}</MonthPicker></p>
              <button type="button" className="dialbar__btn" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" className="dialbar__today" disabled={isToday} onClick={() => setSelected(C.today)}>{C.todayTag}</button>
            </div>

            <div className="dial" role="radiogroup" aria-labelledby="cal-month" onKeyDown={onKey}>
              {days.map((d, i) => (
                <span key={i} className="dial__arm" style={{ transform: `rotate(${angle(i)}deg)` }} aria-hidden="true">
                  <span className="dial__lines">
                    {LINES.map((k, j) => lineCounts[i][j] > 0 && <i key={k.key} className={`dial__line dial__line--${k.key}`} style={{ height: `${25 + 75 * Math.sqrt(lineCounts[i][j] / busiest)}%` }} />)}
                  </span>
                </span>
              ))}
              <span className="dial__arm dial__arm--hand" style={{ transform: `rotate(${angle(sel.getDate() - 1)}deg)` }} aria-hidden="true"><i className="dial__hand" /></span>
              {days.map((d, i) => {
                const iso = toISO(d);
                const a = (angle(i) * Math.PI) / 180;
                return (
                  <button
                    key={iso}
                    type="button"
                    role="radio"
                    aria-checked={iso === selected}
                    tabIndex={iso === selected ? 0 : -1}
                    data-date={iso}
                    className={`dial__day ${iso === selected ? 'is-sel' : ''} ${iso === C.today ? 'is-today' : ''} ${lists[i].length ? '' : 'is-free'}`}
                    style={{ left: `${50 + 46 * Math.sin(a)}%`, top: `${50 - 46 * Math.cos(a)}%` }}
                    aria-label={describe(d, lists[i])}
                    aria-current={iso === C.today ? 'date' : undefined}
                    onClick={() => setSelected(iso)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
              <div className="dial__hub">
                <span className="dial__wd">{weekdayName(sel)}</span>
                <span className="dial__num">{sel.getDate()}</span>
                {isToday && <span className="tag-today">{C.todayTag}</span>}
              </div>
            </div>
            <ul className="dial__key" aria-hidden="true">
              {LINES.map(k => <li key={k.key}><i className={`dial__line dial__line--${k.key}`} />{k.label}</li>)}
            </ul>
          </div>

          <div className="dayp">
            <div className="fchips" role="group" aria-label="Show">
              {C.tabs.map(t => (
                <button key={t.key} type="button" className={`fchip chip--${t.key}`} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}<b>{num(C.counts[t.key])}</b>
                </button>
              ))}
            </div>
            <h3 className="dayp__date">{longDate(sel)}</h3>
            {groups.length ? (
              <div className="dayp__scroll" data-lenis-prevent tabIndex={0} aria-label={`Entries for ${longDate(sel)}`} key={`${selected}-${tab}`}>
                {groups.map(g => (
                  <div key={g.t.key} className="dgroup">
                    <p className="dgroup__title"><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></p>
                    <ul className={EVENT.has(g.t.key) ? 'devents' : 'dpeople'}>
                      {g.list.map((e, k) => EVENT.has(g.t.key) ? (
                        <li key={k} className={`devent devent--${e.type}`}>
                          <b>{e.title}</b>
                          <span>{[e.time, e.club, e.venue].filter(Boolean).join(' · ')}</span>
                        </li>
                      ) : (
                        <li key={k} className={`dperson dperson--${e.type}`}>
                          <span className="dperson__av" aria-hidden="true">{initials(e.name ?? '')}</span>
                          <span className="dperson__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dayp__empty">{C.emptyDay}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
