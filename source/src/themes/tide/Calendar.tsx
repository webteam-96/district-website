import { useRef, useState } from 'react';
import MonthPicker from '../../shared/MonthPicker';
import { R, initials, longDate, monthLabel, parseISO, toISO, weekdayName, type CalEntry } from '../../shared/rotary';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const EVENT = new Set<CalEntry['type']>(['club', 'district']);
const OFFSETS = [-2, -1, 0, 1, 2];
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const LIST_CLASS: Record<CalEntry['type'], string> = { club: 'tickets', district: 'tickets', birthday: 'wishes', anniversary: 'vows' };

const Balloon = ({ name }: { name: string }) => (
  <svg className="wish__balloon" viewBox="0 0 40 54" aria-hidden="true">
    <path className="wish__string" d="M20 40c-3 4 3 6 0 13" />
    <path className="wish__skin" d="M16.5 42h7L20 37z" />
    <ellipse className="wish__skin" cx="20" cy="20" rx="18" ry="19" />
    <ellipse cx="12" cy="11" rx="3.4" ry="5" fill="#fff" opacity=".35" transform="rotate(24 12 11)" />
    <text x="20" y="25" textAnchor="middle">{initials(name)}</text>
  </svg>
);

/* Two linked rings, one partner's initial in each. Ring B is redrawn over A at the lower crossing. */
const Rings = ({ name }: { name: string }) => {
  const [a, b] = name.split(' & ');
  return (
    <svg className="vow__rings" viewBox="0 0 64 40" aria-hidden="true">
      <circle className="vow__b" cx="42" cy="20" r="17" />
      <circle className="vow__a" cx="22" cy="20" r="17" />
      <path className="vow__b" d="M36.19 35.97A17 17 0 0 1 28.6 30.47" />
      <text x="15" y="25">{a?.[0]}</text>
      <text x="49" y="25">{b?.[0]}</text>
    </svg>
  );
};

/* 6 · District Calendar as a deck of day cards: the chosen day sits large in the centre with its
   neighbours fanned behind it. Slide along the month, use the arrows, tap a neighbour or swipe. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const swipeFrom = useRef<number | null>(null);
  const sel = parseISO(selected);
  const y = sel.getFullYear(), m = sel.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const listFor = (iso: string) => (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab);
  const isToday = selected === C.today;
  const shift = (n: number) => setSelected(toISO(addDays(sel, n)));
  const shiftMonth = (delta: number) => {
    const last = new Date(y, m + delta + 1, 0).getDate();
    setSelected(toISO(new Date(y, m + delta, Math.min(sel.getDate(), last))));
  };
  const arrow = (dir: 'l' | 'r') => <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d={dir === 'l' ? 'M12 4 6 10l6 6' : 'm8 4 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;

  return (
    <section id="calendar" className="cal" aria-labelledby="cal-title">
      <div className="wrap">
        <header className="shead shead--center">
          <h2 id="cal-title" className="stitle">{C.eyebrow}</h2>
          <p className="ssub">{C.subtext}</p>
        </header>
        <div className="fchips" role="group" aria-label="Show">
          {C.tabs.map(t => (
            <button key={t.key} type="button" className="fchip" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
              {t.key !== 'all' && <i className={`dot dot--${t.key}`} aria-hidden="true" />}{t.label}<b>{num(C.counts[t.key])}</b>
            </button>
          ))}
        </div>
      </div>

      <div
        className="deck"
        onPointerDown={e => { swipeFrom.current = e.clientX; }}
        onPointerUp={e => {
          if (swipeFrom.current === null) return;
          const dx = e.clientX - swipeFrom.current;
          swipeFrom.current = null;
          if (Math.abs(dx) > 50) shift(dx < 0 ? 1 : -1);
        }}
      >
        {OFFSETS.map(o => {
          const d = addDays(sel, o);
          const iso = toISO(d);
          const list = listFor(iso);
          const groups = C.types.map(t => ({ t, list: list.filter(e => e.type === t.key) })).filter(g => g.list.length);
          return (
            <article key={iso} data-date={iso} className={`dcard ${o === 0 ? 'is-now' : o < 0 ? 'is-before' : 'is-after'}`} style={{ ['--o' as string]: o, ['--a' as string]: Math.abs(o), zIndex: 5 - Math.abs(o) }} aria-hidden={o !== 0}>
              <header className="dcard__head">
                <span className="dcard__num">{d.getDate()}</span>
                <span className="dcard__when"><b>{weekdayName(d)}</b><span>{monthLabel(d)}</span></span>
                {iso === C.today && <span className="tag-today">{C.todayTag}</span>}
                <span className="dcard__count">{num(list.length)}</span>
              </header>
              {o !== 0 ? (
                <ul className="dcard__sum">
                  {groups.map(g => <li key={g.t.key}><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></li>)}
                  {!groups.length && <li className="dcard__none">—</li>}
                </ul>
              ) : groups.length ? (
                <div className="dcard__list" data-lenis-prevent tabIndex={0} aria-label={`Entries for ${longDate(d)}`}>
                  {groups.map(g => (
                    <div key={g.t.key} className="dgroup">
                      <p className="dgroup__title"><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></p>
                      <ul className={LIST_CLASS[g.t.key]}>
                        {g.list.map((e, k) => EVENT.has(g.t.key) ? (
                          <li key={k} className={`ticket ticket--${e.type}`}>
                            <span className="ticket__stub"><b>{e.time ?? '—'}</b><small>{g.t.label}</small></span>
                            <span className="ticket__main">
                              <b>{e.title}</b>
                              {e.club && <span>{e.club}</span>}
                              {e.venue && <span className="ticket__venue">{e.venue}</span>}
                            </span>
                          </li>
                        ) : (
                          <li key={k} className={e.type === 'birthday' ? 'wish' : 'vow'} style={{ ['--i' as string]: Math.min(k, 10) }}>
                            {e.type === 'birthday' ? <Balloon name={e.name ?? ''} /> : <Rings name={e.name ?? ''} />}
                            <span className="wish__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="dcard__empty">{C.emptyDay}</p>
              )}
              {o !== 0 && <button type="button" className="dcard__pick" tabIndex={-1} aria-hidden="true" onClick={() => shift(o)} />}
            </article>
          );
        })}
      </div>

      <div className="wrap scrub">
        <button type="button" className="tbtn" aria-label="Previous day" onClick={() => shift(-1)}>{arrow('l')}</button>
        <div className="scrub__mid">
          <div className="scrub__month">
            <button type="button" className="scrub__mbtn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>{arrow('l')}</button>
            <p id="cal-month" aria-live="polite"><MonthPicker value={sel} today={C.today} onPick={setSelected}>{monthLabel(sel)}</MonthPicker></p>
            <button type="button" className="scrub__mbtn" aria-label="Next month" onClick={() => shiftMonth(1)}>{arrow('r')}</button>
            <button type="button" className="tbtn tbtn--today" disabled={isToday} onClick={() => setSelected(C.today)}>{C.todayTag}</button>
          </div>
          <input
            type="range"
            className="scrub__range"
            min={1}
            max={count}
            value={sel.getDate()}
            aria-label={`Day of ${monthLabel(sel)}`}
            aria-valuetext={longDate(sel)}
            style={{ ['--p' as string]: `${((sel.getDate() - 1) / (count - 1)) * 100}%` }}
            onChange={e => setSelected(toISO(new Date(y, m, Number(e.target.value))))}
          />
          <p className="scrub__ends" aria-hidden="true"><span>1</span><span>{count}</span></p>
        </div>
        <button type="button" className="tbtn" aria-label="Next day" onClick={() => shift(1)}>{arrow('r')}</button>
      </div>
    </section>
  );
}
