import { useEffect, useRef, useState } from 'react';
import MonthPicker from '../../shared/MonthPicker';
import { R, initials, longDate, monthLabel, parseISO, toISO, weekdayName, type CalEntry } from '../../shared/rotary';

type Tab = 'all' | CalEntry['type'];
const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const arrow = (dir: 'l' | 'r') => <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d={dir === 'l' ? 'M12 4 6 10l6 6' : 'm8 4 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const gift = <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3 6.500 3.500 7 5.500S10 7 12 7zm0 0c2-4 5.500-3.500 5-1.500S14 7 12 7z" /></svg>;
const heart = <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M12 20.500S3.500 15.300 3.500 9.300C3.500 6.600 5.600 4.800 8 4.800c1.700 0 3.100.9 4 2.300.9-1.400 2.300-2.300 4-2.300 2.400 0 4.500 1.800 4.500 4.500 0 6-8.500 11.200-8.500 11.200z" /></svg>;

const Pill = ({ e }: { e: CalEntry }) => (
  <li className={`note note--${e.type}`}>
    <span className="note__mark" aria-hidden="true">{e.type === 'birthday' ? gift : heart}</span>
    <span className="note__av" aria-hidden="true">{initials(e.name ?? '')}</span>
    <span className="note__text"><b>{e.name}</b><span>{e.club ?? e.relation}</span></span>
  </li>
);

/* 6 · District Calendar: a tear-off desk calendar. Changing the day tears the page off the pad;
   the day's entries are pinned to the board beside it. Numbered ticks above them pick a day. */
export default function Calendar() {
  const [selected, setSelected] = useState(C.today);
  const [torn, setTorn] = useState<{ iso: string; n: number } | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const ticks = useRef<HTMLDivElement>(null);
  const sel = parseISO(selected);
  const y = sel.getFullYear(), m = sel.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const list = (byDate.get(selected) ?? []).filter(e => tab === 'all' || e.type === tab);
  const groups = C.types.map(t => ({ t, list: list.filter(e => e.type === t.key) })).filter(g => g.list.length);

  const pick = (iso: string) => {
    if (iso === selected) return;
    setTorn(p => ({ iso: selected, n: (p?.n ?? 0) + 1 }));
    setSelected(iso);
  };
  const shiftMonth = (delta: number) => {
    const last = new Date(y, m + delta + 1, 0).getDate();
    pick(toISO(new Date(y, m + delta, Math.min(sel.getDate(), last))));
  };
  /* on phones the ticks scroll by themselves, so keep the chosen one in view */
  useEffect(() => {
    const el = ticks.current;
    const t = el?.querySelector<HTMLElement>('.tick.is-sel');
    if (el && t && el.scrollWidth > el.clientWidth) el.scrollLeft = t.offsetLeft - el.clientWidth / 2 + t.offsetWidth / 2;
  }, [selected]);

  const page = (iso: string) => {
    const d = parseISO(iso);
    return (<>
      <span className="page__month">{monthLabel(d)}</span>
      <b className="page__day">{d.getDate()}</b>
      <span className="page__wd">{weekdayName(d)}</span>
    </>);
  };

  return (
    <section id="calendar" className="sheet cal" aria-labelledby="cal-title">
      <div className="sheet__in">
        <div className="wrap">
          <header className="cal__head">
            <div>
              <h2 id="cal-title" className="stitle">{C.eyebrow}</h2>
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

          <div className="monthbar">
            <button type="button" className="pbtn-ic" aria-label="Previous month" onClick={() => shiftMonth(-1)}>{arrow('l')}</button>
            <p aria-live="polite"><MonthPicker value={sel} today={C.today} onPick={pick}>{monthLabel(sel)}</MonthPicker></p>
            <button type="button" className="pbtn-ic" aria-label="Next month" onClick={() => shiftMonth(1)}>{arrow('r')}</button>
          </div>
          <div ref={ticks} className="ticks" style={{ ['--n' as string]: count }}>
            {Array.from({ length: count }, (_, i) => {
              const d = new Date(y, m, i + 1);
              const iso = toISO(d);
              /* one dot per kind of entry that day, in the filter buttons' colours; follows the chosen filter */
              const dayList = (byDate.get(iso) ?? []).filter(e => tab === 'all' || e.type === tab);
              const kinds = C.types.map(t => ({ t, n: dayList.filter(e => e.type === t.key).length })).filter(x => x.n);
              const said = kinds.map(x => `${x.n} ${x.n === 1 ? x.t.label.toLowerCase() : x.t.group.toLowerCase()}`).join(', ');
              return (
                <button key={iso} type="button" className={`tick ${iso === selected ? 'is-sel' : ''} ${iso === C.today ? 'is-today' : ''}`} aria-pressed={iso === selected} aria-label={`${longDate(d)}${said ? ', ' + said : ', nothing scheduled'}`} onClick={() => pick(iso)}>
                  <b>{i + 1}</b>
                  <span className="tick__dots" aria-hidden="true">{kinds.map(x => <i key={x.t.key} className={`dot dot--${x.t.key}`} />)}</span>
                </button>
              );
            })}
          </div>

          <div className="cal__grid">
            <div className="pad">
              <div className="pad__sheets" aria-live="polite" aria-label={longDate(sel)}>
                <div className="page">{page(selected)}{selected === C.today && <span className="tag-today">{C.todayTag}</span>}</div>
                {torn && <div key={torn.n} className="page page--torn" aria-hidden="true">{page(torn.iso)}</div>}
              </div>
              <div className="pad__ctl">
                <button type="button" className="pbtn-ic" aria-label="Previous day" onClick={() => pick(toISO(addDays(sel, -1)))}>{arrow('l')}</button>
                <button type="button" className="pbtn-today" disabled={selected === C.today} onClick={() => pick(C.today)}>{C.todayTag}</button>
                <button type="button" className="pbtn-ic" aria-label="Next day" onClick={() => pick(toISO(addDays(sel, 1)))}>{arrow('r')}</button>
              </div>
            </div>

            <div className="board" tabIndex={0} aria-label={`Entries for ${longDate(sel)}`}>
              {groups.length ? groups.map(g => (
                <div key={g.t.key} className="pin">
                  <h3 className="pin__title"><i className={`dot dot--${g.t.key}`} aria-hidden="true" />{g.t.group}<b>{num(g.list.length)}</b></h3>
                  <ul className={g.t.key === 'club' || g.t.key === 'district' ? 'evts' : 'notes'}>
                    {g.list.map((e, k) => g.t.key === 'club' || g.t.key === 'district' ? (
                      <li key={k} className={`evt evt--${e.type}`}>
                        <span className="evt__time">{e.time ?? '—'}</span>
                        <span className="evt__main"><b>{e.title}</b>{e.club && <span>{e.club}</span>}{e.venue && <span>{e.venue}</span>}</span>
                      </li>
                    ) : <Pill key={k} e={e} />)}
                  </ul>
                </div>
              )) : <p className="board__empty">{C.emptyDay}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
