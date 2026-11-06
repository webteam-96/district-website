import { useRef, useState } from 'react';
import MonthPicker from '../../shared/MonthPicker';
import { R, initials, longDate, monthLabel, parseISO, reducedMotion, toISO, type CalEntry } from '../../shared/rotary';
import { Title } from './Sections';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
/* How long the open card takes to close before the next one starts opening; kinetic.css matches it. */
const CLOSE_MS = 480;
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const weekOf = (d: Date) => addDays(d, -((d.getDay() - C.weekStartsOn + 7) % 7));
const arrow = (dir: 'l' | 'r') => <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d={dir === 'l' ? 'M12 4 6 10l6 6' : 'm8 4 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/* 6 · District Calendar: one week as seven columns that rise with the scroll. The chosen day opens
   wide and its entries come up one after another; the others stay narrow, showing the date and a
   coloured dot per type. Changing the date is always two steps: the open card closes completely, then
   the next one opens (in a new week, its dates slide in as it does). The columns stay in place (the
   scroll scene holds them) and what's inside each is keyed by date. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [dir, setDir] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const target = useRef(selected);
  const closeTimer = useRef(0);
  const [tab, setTab] = useState<Tab>('all');
  const sel = parseISO(selected);
  const start = weekOf(sel);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  /* the new week and date slide in from the side you are moving towards */
  const pick = (iso: string) => {
    if (iso === target.current) return;
    setDir(iso > target.current ? 1 : -1);
    target.current = iso;
    if (reducedMotion()) { setSelected(iso); return; }
    /* already closing: the timer below opens whichever date was chosen last */
    if (collapsed) return;
    setCollapsed(true);
    closeTimer.current = window.setTimeout(() => {
      setSelected(target.current);
      setCollapsed(false);
    }, CLOSE_MS);
  };
  const base = () => parseISO(target.current);
  const shift = (n: number) => pick(toISO(addDays(base(), n)));
  const shiftMonth = (n: number) => {
    const b = base();
    const last = new Date(b.getFullYear(), b.getMonth() + n + 1, 0).getDate();
    pick(toISO(new Date(b.getFullYear(), b.getMonth() + n, Math.min(b.getDate(), last))));
  };
  const entriesOf = (iso: string) => (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab);

  return (
    <section id="calendar" className="cal" aria-labelledby="cal-title">
      <div className="wrap">
        <header className="cal__head">
          <div>
            <Title id="cal-title" text={C.eyebrow} />
            <p className="ssub">{C.subtext}</p>
          </div>
          <div className="fchips" role="group" aria-label="Show">
            {C.tabs.map(t => (
              <button key={t.key} type="button" className="fchip" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
                {t.key !== 'all' && <i className={`dot dot--${t.key}`} aria-hidden="true" />}{t.label}<b>{num(C.counts[t.key])}</b>
              </button>
            ))}
          </div>
        </header>

        <div className="wkbar">
          <button type="button" className="ic" aria-label="Previous month" onClick={() => shiftMonth(-1)}>{arrow('l')}{arrow('l')}</button>
          <button type="button" className="ic" aria-label="Previous week" onClick={() => shift(-7)}>{arrow('l')}</button>
          <p aria-live="polite"><MonthPicker value={sel} today={C.today} onPick={pick}><span key={monthLabel(sel)} className="wkbar__m">{monthLabel(sel)}</span></MonthPicker></p>
          <button type="button" className="ic" aria-label="Next week" onClick={() => shift(7)}>{arrow('r')}</button>
          <button type="button" className="ic" aria-label="Next month" onClick={() => shiftMonth(1)}>{arrow('r')}{arrow('r')}</button>
          <button type="button" className="ic ic--today" disabled={selected === C.today} onClick={() => pick(C.today)}>{C.todayTag}</button>
        </div>

        <ol className="week" style={{ ['--dir' as string]: dir }}>
          {days.map((d, i) => {
            const iso = toISO(d);
            const open = iso === selected && !collapsed;
            const isClosing = iso === selected && collapsed;
            const list = entriesOf(iso);
            const today = iso === C.today;
            return (
              <li key={i} className={`day ${open ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''} ${today ? 'is-today' : ''}`} style={{ ['--i' as string]: i }}>
                <button key={iso} type="button" className="day__btn" aria-expanded={open} aria-controls={`d-${iso}`} aria-label={`${longDate(d)}, ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`} onClick={() => pick(iso)}>
                  <span className="day__wd">{SHORT[d.getDay()]}</span>
                  <b className="day__n">{d.getDate()}</b>
                  {today && <span className="tag-today">{C.todayTag}</span>}
                  <span className="day__dots" aria-hidden="true">
                    {C.types.filter(t => list.some(e => e.type === t.key)).map(t => <i key={t.key} className={`dot dot--${t.key}`} />)}
                  </span>
                  <span className="day__count" aria-hidden="true">{list.length || ''}</span>
                </button>
                <div key={`${iso}-p`} id={`d-${iso}`} className="day__panel" {...(open ? { tabIndex: 0 } : { inert: '' })}>
                  {(open || isClosing) && (list.length ? C.types.map((t, n) => {
                    const items = list.filter(e => e.type === t.key);
                    if (!items.length) return null;
                    const isEvent = t.key === 'club' || t.key === 'district';
                    return (
                      <div key={`${tab}-${t.key}`} className="pin" style={{ ['--n' as string]: n }}>
                        <h3 className="pin__title"><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{num(items.length)}</b></h3>
                        <ul className={isEvent ? 'evts' : 'notes'}>
                          {items.map((e, k) => isEvent ? (
                            <li key={k} className={`evt evt--${e.type}`} style={{ ['--k' as string]: Math.min(k, 8) }}>
                              <span className="evt__time">{e.time ?? '—'}</span>
                              <span className="evt__main"><b>{e.title}</b>{e.club && <span>{e.club}</span>}{e.venue && <span>{e.venue}</span>}</span>
                            </li>
                          ) : (
                            <li key={k} className={`note note--${e.type}`} style={{ ['--k' as string]: Math.min(k, 8) }}>
                              <span className="note__av" aria-hidden="true">{initials(e.name ?? '')}</span>
                              <span className="note__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }) : <p key={tab} className="day__empty">{C.emptyDay}</p>)}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
