import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { R, longDate, monthLabel, parseISO, toISO, type CalEntry } from '../../shared/rotary';
import GooeyNav from '../../rb/GooeyNav/GooeyNav';
import AnimatedList from '../../rb/AnimatedList/AnimatedList';
import SpotlightCard from '../../rb/SpotlightCard/SpotlightCard';
import BlurText from '../../rb/BlurText/BlurText';
import { useTheme } from './theme';

type Tab = 'all' | CalEntry['type'];

const C = R.calendar;
const num = (n: number) => n.toLocaleString('en-IN');
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const byDate = (() => {
  const m = new Map<string, CalEntry[]>();
  C.entries.forEach(e => m.set(e.date, [...(m.get(e.date) ?? []), e]));
  return m;
})();

const describe = (d: Date, list: CalEntry[]) => {
  const parts = C.types
    .map(t => ({ t, n: list.filter(e => e.type === t.key).length }))
    .filter(x => x.n)
    .map(x => `${x.n} ${x.n === 1 ? x.t.label.toLowerCase() : x.t.group.toLowerCase()}`);
  return `${longDate(d)}${parts.length ? ', ' + parts.join(', ') : ', nothing scheduled'}`;
};

/* 6 · What's Happening: a glowing day strip across the month, and the selected
   day's entries in four category columns (Club Events · District Events ·
   Birthdays · Anniversaries). Tabs narrow the columns to one category. */
export default function Calendar() {
  const theme = useTheme();
  const [selected, setSelected] = useState(C.today);
  const [tab, setTab] = useState<Tab>('all');
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });
  const sel = parseISO(selected);
  const y = sel.getFullYear(), m = sel.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
  const show = (e: CalEntry) => tab === 'all' || e.type === tab;
  const dayAll = byDate.get(selected) ?? [];
  const dayList = dayAll.filter(show);
  const cols = tab === 'all' ? C.types : C.types.filter(t => t.key === tab);
  const isToday = selected === C.today;

  /* keep the selected day centred in the strip (horizontal only — never moves the page) */
  useEffect(() => {
    const s = strip.current;
    const el = s?.querySelector<HTMLElement>(`[data-date="${selected}"]`);
    if (!s || !el) return;
    s.scrollTo({ left: el.offsetLeft - s.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
  }, [selected]);

  const pick = (date: Date, focus = false) => {
    const iso = toISO(date);
    setSelected(iso);
    if (focus) requestAnimationFrame(() => strip.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus({ preventScroll: true }));
  };
  const shiftMonth = (delta: number) => {
    const t = new Date(y, m + delta, 1);
    const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    setSelected(toISO(new Date(t.getFullYear(), t.getMonth(), Math.min(sel.getDate(), last))));
  };
  const onKey = (e: KeyboardEvent) => {
    const d = new Date(sel);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d.setDate(d.getDate() + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d.setDate(d.getDate() - 1);
    else if (e.key === 'Home') d.setDate(1);
    else if (e.key === 'End') d.setDate(count);
    else if (e.key === 'PageDown') d.setMonth(d.getMonth() + 1);
    else if (e.key === 'PageUp') d.setMonth(d.getMonth() - 1);
    else return;
    e.preventDefault();
    pick(d, true);
  };
  /* drag to scroll with a mouse; a drag never selects */
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !strip.current) return;
    drag.current = { on: true, x: e.clientX, left: strip.current.scrollLeft, moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const g = drag.current;
    if (!g.on || !strip.current) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 5) g.moved = true;
    strip.current.scrollLeft = g.left - dx;
  };
  const onUp = () => { drag.current.on = false; };

  return (
    <section id="calendar" className="cal" aria-labelledby="cal-title">
      <div className="wrap">
        <header className="section-head cal__head">
          <div>
            <p className="eyebrow">{C.eyebrow}</p>
            <h2 id="cal-title" className="section-title">{C.title}</h2>
            <p className="section-sub">{C.subtext}</p>
          </div>
          <div className="cal__month">
            <button type="button" className="round round--sm" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="cal__title" id="cal-month" aria-live="polite">{monthLabel(sel)}</p>
            <button type="button" className="round round--sm" aria-label="Next month" onClick={() => shiftMonth(1)}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="pill-btn" onClick={() => setSelected(C.today)} disabled={isToday}>{C.todayTag}</button>
          </div>
        </header>

        <div className="cal__tabs" role="group" aria-label="Show">
          <GooeyNav
            key={theme}
            items={C.tabs.map(t => ({ label: `${t.label}  ${num(C.counts[t.key])}` }))}
            activeIndex={C.tabs.findIndex(t => t.key === tab)}
            onChange={i => setTab(C.tabs[i].key)}
            theme={theme}
            colors={theme === 'light' ? ['#F7A81B', '#0067C8', '#FF5C93', '#2BD9C5'] : ['#F7A81B', '#2EA8FF', '#FFFFFF', '#FF5C93']}
            particleCount={12}
            size="md"
            frame
          />
        </div>

        <div className="cal__stripwrap">
          <div
            ref={strip}
            className="cal__strip"
            role="radiogroup"
            aria-labelledby="cal-month"
            onKeyDown={onKey}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            onClickCapture={e => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } }}
          >
            {days.map(d => {
              const iso = toISO(d);
              const list = (byDate.get(iso) ?? []).filter(show);
              const types = C.types.filter(t => list.some(e => e.type === t.key));
              const on = iso === selected;
              return (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  data-date={iso}
                  className={`day ${on ? 'is-on' : ''} ${iso === C.today ? 'is-today' : ''} ${d.getDay() === 0 ? 'is-sun' : ''}`}
                  aria-label={describe(d, list)}
                  aria-current={iso === C.today ? 'date' : undefined}
                  onClick={() => setSelected(iso)}
                >
                  <span className="day__dow">{DOW[d.getDay()]}</span>
                  <span className="day__num">{String(d.getDate()).padStart(2, '0')}</span>
                  <span className="day__marks" aria-hidden="true">{types.map(t => <i key={t.key} className={`mark mark--${t.key}`} />)}</span>
                  {iso === C.today && <span className="day__today" aria-hidden="true">{C.todayTag}</span>}
                </button>
              );
            })}
          </div>
          <ul className="cal__legend" aria-label="Legend">
            {C.types.map(t => <li key={t.key}><i className={`mark mark--${t.key}`} aria-hidden="true" />{t.label}</li>)}
          </ul>
        </div>

        <div className="cal__day">
          <span className="cal__big" aria-hidden="true">{String(sel.getDate()).padStart(2, '0')}</span>
          <div>
            <p className="cal__long">{longDate(sel)}</p>
            <p className="cal__sum">
              {isToday && <span className="tag-today">{C.todayTag}</span>}
              {dayList.length ? `${num(dayList.length)} ${dayList.length === 1 ? 'entry' : 'entries'}` : ''}
            </p>
          </div>
        </div>

        {dayList.length ? (
          <div className={`cal__cols cal__cols--${cols.length}`} key={selected + tab + theme}>
            {cols.map((t, ci) => {
              const list = dayAll.filter(e => e.type === t.key);
              return (
                <SpotlightCard key={t.key} className={`col col--${t.key}`} spotlightColor={theme === 'light' ? 'rgba(0, 103, 200, 0.08)' : 'rgba(46, 168, 255, 0.14)'} grain={0} theme={theme} style={{ ['--ci' as string]: ci }}>
                  <div className="col__head">
                    <i className={`mark mark--${t.key}`} aria-hidden="true" />
                    <h3 className="col__title">{t.group}</h3>
                    <span className="col__count">{num(list.length)}</span>
                  </div>
                  {list.length ? (
                    <div className="col__list" data-lenis-prevent>
                      <AnimatedList
                        items={list.map((e, i) => ({ id: i, title: e.title ?? e.name ?? '' }))}
                        renderItem={(_, i) => {
                          const e = list[i];
                          return (
                            <div className={`entry entry--${e.type}`}>
                              <p className="entry__title">{e.title ?? e.name}</p>
                              <p className="entry__meta">
                                {e.club && <span>{e.club}</span>}
                                {e.relation && <span>{e.relation}</span>}
                                {e.time && <span>{e.time}{e.venue ? ` · ${e.venue}` : ''}</span>}
                              </p>
                            </div>
                          );
                        }}
                        selectOnHover={false}
                        enableArrowNavigation={false}
                        animation="pop"
                        stagger={0.03}
                        showGradients
                        fadeSize={44}
                        displayScrollbar
                        frame={false}
                        theme={theme}
                        accentColor="#2EA8FF"
                        gap={8}
                        maxHeight={380}
                        width="100%"
                        className="col__alist"
                      />
                    </div>
                  ) : (
                    <p className="col__none">—</p>
                  )}
                </SpotlightCard>
              );
            })}
          </div>
        ) : (
          <div className="cal__empty">
            <span className="cal__empty-ring" aria-hidden="true" />
            <BlurText key={selected + tab} text={C.emptyDay} animateBy="words" delay={40} className="cal__empty-text" />
          </div>
        )}
      </div>
    </section>
  );
}
