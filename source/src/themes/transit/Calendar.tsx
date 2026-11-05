import { useEffect, useRef, useState } from 'react';
import { Title } from './Sections';
import { R, initials, longDate, monthLabel, parseISO, toISO, weekdayName, type CalEntry } from '../../shared/rotary';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const arrow = (dir: 'l' | 'r') => <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d={dir === 'l' ? 'M12 4 6 10l6 6' : 'm8 4 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function Entry({ e }: { e: CalEntry }) {
  if (e.type === 'club' || e.type === 'district') return (
    <li className={`dep dep--${e.type}`}>
      <span className="dep__time">{e.time ?? '—'}</span>
      <span className="dep__main"><b>{e.title}</b>{e.club && <span>{e.club}</span>}{e.venue && <span>{e.venue}</span>}</span>
    </li>
  );
  if (e.type === 'birthday') return (
    <li className="greet">
      <span className="candle" aria-hidden="true">{initials(e.name ?? '')}</span>
      <span className="greet__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
    </li>
  );
  const [a, b] = (e.name ?? '').split(' & ');
  return (
    <li className="greet">
      <span className="pair" aria-hidden="true"><i>{a?.[0]}</i><i>{b?.[0]}</i></span>
      <span className="greet__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
    </li>
  );
}

/* 6 · District Calendar: the month is a row of day chips, and the chosen day is a big colour
   card with a coloured card beside it for each kind of entry. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const line = useRef<HTMLDivElement>(null);
  const sel = parseISO(selected);
  const y = sel.getFullYear(), m = sel.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const listFor = (iso: string) => (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab);
  const today = listFor(selected);
  const groups = C.types.map(t => ({ t, list: today.filter(e => e.type === t.key) })).filter(g => g.list.length);
  const shiftMonth = (delta: number) => {
    const last = new Date(y, m + delta + 1, 0).getDate();
    setSelected(toISO(new Date(y, m + delta, Math.min(sel.getDate(), last))));
  };

  /* on narrow screens the line scrolls by itself, so keep the chosen stop in view */
  useEffect(() => {
    const el = line.current;
    const stop = el?.querySelector<HTMLElement>('.dstop.is-sel');
    if (el && stop && el.scrollWidth > el.clientWidth) el.scrollLeft = stop.offsetLeft - el.clientWidth / 2 + stop.offsetWidth / 2;
  }, [selected]);

  return (
    <section id="calendar" className="p cal" aria-labelledby="cal-title">
      <div className="cal__top">
        <div>
          <h2 id="cal-title" className="stitle"><Title text={C.eyebrow} /></h2>
          <p className="ssub">{C.subtext}</p>
        </div>
        <div className="cal__tools">
          <div className="cal__filters" role="group" aria-label="Show">
          {C.tabs.map(t => (
            <button key={t.key} type="button" className="fchip" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
              {t.key !== 'all' && <i className={`dot dot--${t.key}`} aria-hidden="true" />}{t.label}<b>{num(C.counts[t.key])}</b>
            </button>
          ))}
        </div>
          <div className="cal__month">
        <button type="button" className="mbtn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>{arrow('l')}</button>
        <p aria-live="polite">{monthLabel(sel)}</p>
        <button type="button" className="mbtn" aria-label="Next month" onClick={() => shiftMonth(1)}>{arrow('r')}</button>
        <button type="button" className="mbtn mbtn--today" disabled={selected === C.today} onClick={() => setSelected(C.today)}>{C.todayTag}</button>
      </div>
        </div>
      </div>

      <div ref={line} className="droute" style={{ ['--n' as string]: count, ['--p' as string]: (sel.getDate() - 0.5) / count }}>
        <ol className="droute__stops">
          {Array.from({ length: count }, (_, i) => {
            const d = new Date(y, m, i + 1);
            const iso = toISO(d);
            const list = listFor(iso);
            const kinds = C.types.filter(t => list.some(e => e.type === t.key));
            return (
              <li key={iso}>
                <button type="button" className={`dstop ${iso === selected ? 'is-sel' : ''} ${iso === C.today ? 'is-today' : ''}`} aria-pressed={iso === selected} aria-label={`${longDate(d)}, ${list.length} entries`} onClick={() => setSelected(iso)}>
                  <span className="dstop__kinds" aria-hidden="true">{kinds.map(t => <i key={t.key} className={`dot dot--${t.key}`} />)}</span>
                  <i className="dstop__pin" aria-hidden="true" />
                  <b>{i + 1}</b>
                  <small aria-hidden="true">{weekdayName(d)[0]}</small>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="cal__stage">
        <p key={selected} className="cal__big">
          <b>{sel.getDate()}</b>
          <span className="cal__wd">{weekdayName(sel)}</span>
          <span>{monthLabel(sel)}</span>
          {selected === C.today && <span className="tag-today">{C.todayTag}</span>}
        </p>
      {groups.length ? (
        <div key={`${selected}-${tab}`} className="plats" style={{ ['--cols' as string]: groups.length }}>
          {groups.map(g => (
            <div key={g.t.key} className={`plat plat--${g.t.key}`}>
              <h3 className="plat__head"><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></h3>
              <ul className="plat__list" tabIndex={0} aria-label={g.t.group}>
                {g.list.map((e, k) => <Entry key={k} e={e} />)}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="plats__empty">{C.emptyDay}</p>
      )}
      </div>
    </section>
  );
}
