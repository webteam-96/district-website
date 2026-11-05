import { useState } from 'react';
import { R, initials, longDate, monthLabel, parseISO, toISO, type CalEntry } from '../../shared/rotary';
import { Title } from './Sections';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
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
   wide with its entries; the others stay narrow, showing the date and a coloured dot per type. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const sel = parseISO(selected);
  const start = weekOf(sel);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const shift = (n: number) => setSelected(toISO(addDays(sel, n)));
  const shiftMonth = (n: number) => {
    const last = new Date(sel.getFullYear(), sel.getMonth() + n + 1, 0).getDate();
    setSelected(toISO(new Date(sel.getFullYear(), sel.getMonth() + n, Math.min(sel.getDate(), last))));
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
          <p aria-live="polite">{monthLabel(sel)}</p>
          <button type="button" className="ic" aria-label="Next week" onClick={() => shift(7)}>{arrow('r')}</button>
          <button type="button" className="ic" aria-label="Next month" onClick={() => shiftMonth(1)}>{arrow('r')}{arrow('r')}</button>
          <button type="button" className="ic ic--today" disabled={selected === C.today} onClick={() => setSelected(C.today)}>{C.todayTag}</button>
        </div>

        <ol className="week">
          {days.map(d => {
            const iso = toISO(d);
            const open = iso === selected;
            const list = entriesOf(iso);
            const today = iso === C.today;
            return (
              <li key={iso} className={`day ${open ? 'is-open' : ''} ${today ? 'is-today' : ''}`}>
                <button type="button" className="day__btn" aria-expanded={open} aria-controls={`d-${iso}`} aria-label={`${longDate(d)}, ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`} onClick={() => setSelected(iso)}>
                  <span className="day__wd">{SHORT[d.getDay()]}</span>
                  <b className="day__n">{d.getDate()}</b>
                  {today && <span className="tag-today">{C.todayTag}</span>}
                  <span className="day__dots" aria-hidden="true">
                    {C.types.filter(t => list.some(e => e.type === t.key)).map(t => <i key={t.key} className={`dot dot--${t.key}`} />)}
                  </span>
                  <span className="day__count" aria-hidden="true">{list.length || ''}</span>
                </button>
                <div id={`d-${iso}`} className="day__panel" {...(open ? { tabIndex: 0 } : { inert: '' })}>
                  {open && (list.length ? C.types.map(t => {
                    const items = list.filter(e => e.type === t.key);
                    if (!items.length) return null;
                    const isEvent = t.key === 'club' || t.key === 'district';
                    return (
                      <div key={t.key} className="pin">
                        <h3 className="pin__title"><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{num(items.length)}</b></h3>
                        <ul className={isEvent ? 'evts' : 'notes'}>
                          {items.map((e, k) => isEvent ? (
                            <li key={k} className={`evt evt--${e.type}`}>
                              <span className="evt__time">{e.time ?? '—'}</span>
                              <span className="evt__main"><b>{e.title}</b>{e.club && <span>{e.club}</span>}{e.venue && <span>{e.venue}</span>}</span>
                            </li>
                          ) : (
                            <li key={k} className={`note note--${e.type}`}>
                              <span className="note__av" aria-hidden="true">{initials(e.name ?? '')}</span>
                              <span className="note__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }) : <p className="day__empty">{C.emptyDay}</p>)}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
