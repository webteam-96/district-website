import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, parseISO, shortDate, toISO, weekdayName, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, entryText, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import { useReveal } from './reveal';
import './inner.css';

/* ORBIT inner pages. Every page head is one more indigo band joined to the header bar, with the
   page's instrument on the right (search, week dial, totals, today, the Rotary year). Bodies are
   built from the homepage's parts: the hub disc (indigo with a gold ring), rings, gold pills on
   indigo, rows that fill with gold, labels hanging like the logo tab. Behaviour is plain data
   attributes (shared/inner.js), so the same markup is also the static HTML. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  users: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8" r="3.5" /><path {...sw} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>,
  compass: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
};
const css = (o: Record<string, string | number>) => o as CSSProperties;
const dayMonth = (iso: string) => { const [d, m, y] = shortDate(iso).split(' '); return { d, m, y }; };

/* ---------- page head: indigo band under the bar, text left, the page's instrument right ---------- */
const Crumbs = ({ title }: { title: string }) => (
  <nav className="oi-crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a><i aria-hidden="true" /><span aria-current="page">{title}</span>
  </nav>
);
const Rings = () => <div className="oi-head__rings" aria-hidden="true"><span /><span /></div>;
function Head({ k, aside, lead = true, children }: { k: PageKey; aside?: ReactNode; lead?: boolean; children?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="oi-head" id="top">
      <Rings />
      <div className="wrap oi-head__row">
        <div className="oi-head__text" data-rv>
          <Crumbs title={p.title} />
          <h1 className="oi-head__title">{p.title}</h1>
          {lead && <p className="oi-head__lead">{p.lead}</p>}
        </div>
        {aside && <div className="oi-head__aside" data-rv style={css({ '--d': 1 })}>{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/* search on indigo (or light), the live count inside the field: "33 of 33" */
const Search = ({ label, total, light }: { label: string; total: number; light?: boolean }) => (
  <label className={`oi-search ${light ? 'oi-search--light' : ''}`}>
    {I.search}
    <input type="search" data-f-search placeholder={label} aria-label={label} autoComplete="off" enterKeyHint="search" />
    <span className="oi-search__count" aria-live="polite"><b data-f-count>{total}</b> of {num(total)}</span>
  </label>
);
const Chip = ({ attr, v, on = false, cls = '', label, children }: { attr: string; v: string; on?: boolean; cls?: string; label?: string; children: ReactNode }) => (
  <button type="button" className={`oi-chip ${cls}`} data-f-chip={attr} data-v={v} aria-pressed={on} aria-label={label} title={label}>{children}</button>
);
const Empty = ({ text, show = false }: { text: string; show?: boolean }) => <p className="oi-empty" data-f-empty hidden={!show}>{text}</p>;
const More = ({ label }: { label: string }) => <div className="oi-more"><button type="button" className="pbtn pbtn--solid pbtn--big" data-f-more hidden>{label}</button></div>;
/* a person's disc: the photo when the backend sends one, otherwise initials */
const Face = ({ name, photo, cls = '' }: { name: string; photo: Photo | null; cls?: string }) => (photo
  ? <img className={`oi-hub oi-hub--photo ${cls}`} src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} loading="lazy" />
  : <span className={`oi-hub oi-hub--init ${cls}`} aria-hidden="true">{initials(name)}</span>);

/* ================= About: the admin's one content field on a white sheet hanging from the head ================= */
function About() {
  return (
    <>
      <Head k="about" lead={false} />
      <section className="oi-about">
        <div className="wrap">
          <div className="oi-sheet">
            <span className="oi-sheet__ring" aria-hidden="true"><i /></span>
            <div data-rv><AdminContent className="oi-prose" /></div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee: the Governor as the hub, executive cards either side, committee lanes ================= */
function Ring({ text }: { text: string }) {
  const r = 92;
  return (
    <svg className="oi-lead__ring" viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id="oi-ring" d={`M100 ${100 - r}a${r} ${r} 0 1 1 -0.01 0`} /></defs>
      <text><textPath href="#oi-ring" textLength={Math.floor(2 * Math.PI * r) - 2} lengthAdjust="spacing">{`${text} • `.repeat(text.length < 24 ? 3 : 2)}</textPath></text>
    </svg>
  );
}
function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [exec, ...lanes] = groups;
  const item = (m: (typeof exec.members)[number], g: string) => ({ 'data-item': '', 'data-q': m.q, 'data-group': g });
  return (
    <div className="oi-scope" data-filter>
      <Head k="committee" aside={<Search label={P.committee.searchLabel} total={total} />} />
      <section className="oi-sec oi-com">
        <div className="wrap">
          <div className="oi-index" role="group" aria-label="Committees" data-rv data-lenis-prevent>
            <Chip attr="group" v="" on cls="oi-chip--tile"><span>All committees</span><b data-count>{total}</b></Chip>
            {groups.map(g => <Chip key={g.key} attr="group" v={g.key} cls="oi-chip--tile"><span>{g.title}</span><b data-count>{g.members.length}</b></Chip>)}
          </div>

          <section className="oi-execs" data-f-group>
            <h2 className="sr-only">{exec.title}</h2>
            <ul className="oi-exec">
              {exec.members.map((m, i) => i === 0 ? (
                <li key={m.name} className="oi-lead" {...item(m, exec.key)} data-rv>
                  <div className="oi-lead__art oi-turn" data-rv>
                    <Ring text={`${m.role} • ${R.years.current}`} />
                    <Face name={m.name} photo={m.photo} />
                  </div>
                  <h3 className="oi-lead__name">{m.name}</h3>
                  <p className="oi-lead__role">{m.role}</p>
                  {m.club && <p className="oi-lead__club">{clubName(m.club)}</p>}
                </li>
              ) : (
                <li key={m.name + i} className="oi-card oi-xcard" {...item(m, exec.key)} data-glow data-rv>
                  <Face name={m.name} photo={m.photo} />
                  <div>
                    <h3 className="oi-who">{m.name}</h3>
                    <p className="oi-role">{m.role}</p>
                    {m.club && <p className="oi-club-of">{clubName(m.club)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {lanes.map(g => (
            <section key={g.key} className="oi-lane" data-f-group data-rv>
              <div className="oi-lane__head">
                <h2>{g.title}</h2>
                <b className="oi-ring-n" data-f-group-count>{g.members.length}</b>
              </div>
              <ul className="oi-lane__list">
                {g.members.map((m, i) => (
                  <li key={m.name + i} className="oi-mem" {...item(m, g.key)}>
                    <Face name={m.name} photo={m.photo} />
                    <div>
                      <h3 className="oi-who">{m.name}</h3>
                      <p className="oi-role">{m.role}</p>
                      {m.club && <p className="oi-club-of">{clubName(m.club)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Empty text={P.committee.empty} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Finder: search and a week dial in the head, a register of rows that fill with gold ================= */
/* day node centres on the 160px dial, Monday at the top, clockwise (percent) */
const WEEK = [[50, 11.9], [79.8, 26.2], [87.1, 58.5], [66.5, 84.3], [33.5, 84.3], [12.9, 58.5], [20.2, 26.2]];
function Finder() {
  const f = P.finder;
  const list = clubs();
  const perDay = (d: string) => list.filter(c => c.day === d).length;
  const tools = (
    <div className="oi-ftools">
      <Search label={f.searchLabel} total={list.length} />
      <p className="oi-ftools__label" id="oi-daylabel">{f.dayLabel}</p>
      <div className="oi-week" role="group" aria-labelledby="oi-daylabel" data-lenis-prevent>
        <button type="button" className="oi-week__any" data-f-chip="day" data-v="" aria-pressed="true" aria-label={f.anyDay} title={f.anyDay}>Any</button>
        {f.days.map((d, i) => (
          <button key={d} type="button" data-f-chip="day" data-v={d} aria-pressed="false" aria-label={`${d} (${perDay(d)})`} title={`${d} (${perDay(d)})`} style={{ left: `${WEEK[i][0]}%`, top: `${WEEK[i][1]}%` }}>{d.slice(0, 2)}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="oi-scope" data-filter data-page-size={f.pageSize}>
      <Head k="finder" aside={tools} />
      <section className="oi-sec oi-find">
        <div className="wrap">
          <div className="oi-reg__cols" aria-hidden="true">
            <span>Club</span><span>Meets at</span>
            <span className="oi-reg__wk">{f.days.map((d, i) => <i key={i}>{d[0]}</i>)}</span>
          </div>
          <ul className="oi-reg">
            {list.map(c => {
              const di = f.days.indexOf(c.day ?? '');
              return (
                <li key={c.id} className="oi-club" data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                  <span className="oi-hub oi-hub--init" aria-hidden="true">{c.initials}</span>
                  <h2 className="oi-club__name"><span>Rotary Club of </span>{c.name}</h2>
                  <p className="oi-club__place">{c.place && <>{I.pin}<span>{c.place}</span></>}</p>
                  <p className="oi-club__day">{c.day && <><i className="oi-wk" style={di >= 0 ? css({ '--d': di }) : undefined} aria-hidden="true" />{c.day}</>}</p>
                  <a className="pbtn oi-club__go" href={c.href} target="_blank" rel="noopener" aria-label={`${f.visit}: Rotary Club of ${c.name}`}>{f.visit}{I.arrow}</a>
                </li>
              );
            })}
          </ul>
          <Empty text={f.empty} />
          <More label={f.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Projects: totals ledger in the head, paired horizontal photo cards ================= */
const Figs = ({ p }: { p: Project }) => {
  const L = P.projects.statLabels;
  return (
    <dl className="oi-figs">
      <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
      <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
      <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
    </dl>
  );
};
const projQ = (p: Project) => `${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase();
const DateHub = ({ iso, cls = '', year = false }: { iso: string; cls?: string; year?: boolean }) => {
  const t = dayMonth(iso);
  return <p className={`oi-hub ${cls}`}><b>{t.d}</b><span>{t.m}{year ? ` ${t.y}` : <span className="sr-only"> {t.y}</span>}</span></p>;
};
const ACCENT = ['#FFC44D', '#FF7DB2', '#3DD6E3', '#7CC4FF'];
const statRows = (list: Project[]) => {
  const t = totals(list), L = P.projects.statLabels;
  return [
    { label: L.projects, value: num(t.projects) },
    { label: L.beneficiaries, value: num(t.beneficiaries) },
    { label: L.amount, value: `₹${R.fmt.num(t.amount, 1)} L` },
    { label: L.hours, value: num(t.hours) }
  ].map((r, i) => ({ ...r, c: ACCENT[i] }));
};
function Projects() {
  const x = P.projects;
  const list = projectsOf();
  return (
    <div className="oi-scope" data-filter data-page-size={x.pageSize}>
      <Head k="projects" aside={<Search label={x.searchLabel} total={list.length} />}>
        <div className="wrap">
          <ul className="oi-ledger" data-rv style={css({ '--d': 2 })}>
            {statRows(list).map(r => <li key={r.label} style={css({ '--c': r.c })}><b data-count>{r.value}</b><span>{r.label}</span></li>)}
          </ul>
        </div>
      </Head>
      <section className="oi-sec">
        <div className="wrap">
          <div className="oi-chips" role="group" aria-label="Avenues of service" data-rv data-lenis-prevent>
            <Chip attr="avenue" v="" on>{x.allLabel}</Chip>
            {x.avenues.map(a => <Chip key={a.key} attr="avenue" v={a.key}>{a.label}</Chip>)}
          </div>
          <ul className="oi-pgrid">
            {list.map(p => (
              <li key={p.id} className="oi-proj oi-card" data-item data-q={projQ(p)} data-avenue={p.avenue} data-glow data-rv>
                <figure className="oi-proj__photo"><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></figure>
                <span className="oi-tab">{avenueLabel(p.avenue)}</span>
                <DateHub iso={p.date} />
                <div className="oi-proj__body">
                  <div className="oi-proj__text">
                    <p className="oi-proj__club">{clubName(p.club)}</p>
                    <h2 className="oi-proj__title">{p.title}</h2>
                    <p className="oi-proj__sum">{p.summary}</p>
                  </div>
                  <Figs p={p} />
                </div>
              </li>
            ))}
          </ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Service: a sticky indigo summary panel, the projects in one column of photo-top cards ================= */
function Service() {
  const x = P.projects;
  const list = projectsOf('club');
  const [first, ...stats] = statRows(list);
  return (
    <>
      <Head k="service" />
      <section className="oi-sec oi-svc">
        <div className="wrap oi-svc__grid" data-filter data-page-size={x.pageSize}>
          <div className="oi-panel" data-rv>
            <div className="oi-panel__total oi-turn" data-rv>
              <span className="oi-panel__ring" aria-hidden="true"><i /></span>
              <p className="oi-hub oi-hub--paper"><b data-count>{first.value}</b><span>{first.label}</span></p>
            </div>
            <ul className="oi-panel__stats">
              {stats.map(r => <li key={r.label} style={css({ '--c': r.c })}><span>{r.label}</span><b data-count>{r.value}</b></li>)}
            </ul>
          </div>
          <div className="oi-svc__list">
            <ul className="oi-stories">
              {list.map(p => (
                <li key={p.id} className="oi-story oi-card" data-item data-q={projQ(p)} data-avenue={p.avenue} data-glow data-rv>
                  <figure className="oi-story__photo"><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></figure>
                  <div className="oi-story__body">
                    <div className="oi-story__head">
                      <DateHub iso={p.date} />
                      <div className="oi-story__titles">
                        <p className="oi-story__club">{clubName(p.club)}</p>
                        <h2 className="oi-story__title">{p.title}</h2>
                      </div>
                    </div>
                    <p className="oi-story__sum">{p.summary}</p>
                    <Figs p={p} />
                  </div>
                </li>
              ))}
            </ul>
            <Empty text={x.empty} show={!list.length} />
            <More label={x.more} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar: the double dial (months round the rim, the month's days inside) + agenda ================= */
const LINES = [
  { key: 'event', label: 'Events', has: (t: string) => t === 'club' || t === 'district' },
  { key: 'birthday', label: 'Birthdays', has: (t: string) => t === 'birthday' },
  { key: 'anniversary', label: 'Anniversaries', has: (t: string) => t === 'anniversary' }
];
type Month = ReturnType<typeof calMonths>[number];
type DayEntries = { iso: string; date: Date; list: CalEntry[] };
const plural = (n: number) => (n === 1 ? 'entry' : 'entries');

function DayCard({ d, today }: { d: DayEntries; today: boolean }) {
  const C = R.calendar;
  const label = (t: string) => C.types.find(x => x.key === t)?.label ?? '';
  const ev = d.list.filter(e => e.type === 'club' || e.type === 'district');
  const pp = [...d.list.filter(e => e.type === 'birthday'), ...d.list.filter(e => e.type === 'anniversary')];
  return (
    <li id={`d-${d.iso}`} className={`oi-day oi-card ${today ? 'is-today' : ''}`} data-f-group data-rv>
      {today && <span className="oi-tab oi-tab--today" aria-hidden="true">{C.todayTag}</span>}
      <p className={`oi-hub ${today ? 'oi-hub--today' : ''}`} aria-hidden="true"><b>{d.date.getDate()}</b></p>
      <div className="oi-day__body">
        <div className="oi-day__head">
          <h3><span aria-hidden="true">{weekdayName(d.date)}</span><span className="sr-only">{today ? `${C.todayTag}, ` : ''}{longDate(d.date)}</span></h3>
          <b className="oi-ring-n" data-f-group-count>{d.list.length}</b>
        </div>
        {ev.length > 0 && (
          <ul className="oi-evs">
            {ev.map((e, i) => { const t = entryText(e); return <li key={i} className={`oi-ev oi-ev--${e.type}`} data-item data-type={e.type}><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</li>; })}
          </ul>
        )}
        {pp.length > 0 && (
          <ul className="oi-pp">
            {pp.map((e, i) => {
              const t = entryText(e);
              return (
                <li key={i} className={`oi-person oi-person--${e.type}`} data-item data-type={e.type}>
                  <span className="oi-person__av" aria-hidden="true">{initials(t.head)}</span>
                  <span className="oi-person__t"><b>{t.head}</b><span>{[label(e.type), t.sub].filter(Boolean).join(' · ')}</span></span>
                </li>
              );
            })}
          </ul>
        )}
        {/* a real day holds dozens of birthdays and anniversaries: six show, the rest on request (CSS, inner.css) */}
        {pp.length > 6 && (
          <label className="oi-all pbtn">
            <input type="checkbox" />
            <span className="oi-all__more">Show all</span>
            <span className="oi-all__less">Show fewer</span>
          </label>
        )}
      </div>
    </li>
  );
}

function MonthPanel({ m, open }: { m: Month; open: boolean }) {
  const C = R.calendar;
  const days: DayEntries[] = monthEntries(m.date);
  const by = new Map(days.map(d => [d.iso, d.list]));
  const total = days.reduce((s, d) => s + d.list.length, 0);
  const y = m.date.getFullYear(), mo = m.date.getMonth();
  const n = new Date(y, mo + 1, 0).getDate();
  const lineCount = (list: CalEntry[]) => LINES.map(l => list.filter(e => l.has(e.type)).length);
  const busiest = Math.max(1, ...days.flatMap(d => lineCount(d.list)));
  const today = parseISO(C.today);
  const here = today.getFullYear() === y && today.getMonth() === mo;
  const todayDay = days.find(d => d.iso === C.today);
  /* today's card first, then the month from the 1st */
  const ordered = todayDay ? [todayDay, ...days.filter(d => d !== todayDay)] : days;
  const typeCount = (k: string) => days.reduce((s, d) => s + d.list.filter(e => e.type === k).length, 0);
  const hubText = here ? (
    <>
      <span className="oi-dhub__m">{m.label}</span>
      <b className="oi-dhub__d">{today.getDate()}</b>
      <span className="oi-dhub__w">{weekdayName(today)}</span>
      <span className="oi-dhub__tag">{C.todayTag}</span>
    </>
  ) : (
    <>
      <span className="oi-dhub__m">{m.label}</span>
      <b className="oi-dhub__n" data-count>{num(total)}</b>
      <span className="oi-dhub__w">{plural(total)}</span>
    </>
  );
  return (
    <div className="oi-month" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      <div className="oi-days oi-turn" data-rv>
        {days.map(d => {
          const c = lineCount(d.list);
          return (
            <span key={d.iso} className="oi-arm" style={{ transform: `rotate(${(((d.date.getDate() - 1) / n) * 360).toFixed(2)}deg)` }} aria-hidden="true">
              <span className="oi-lns">
                {LINES.map((l, j) => c[j] > 0 && <i key={l.key} className={`oi-ln oi-ln--${l.key}`} style={{ height: `${Math.round(25 + 75 * Math.sqrt(c[j] / busiest))}%` }} />)}
              </span>
            </span>
          );
        })}
        {Array.from({ length: n }, (_, i) => {
          const iso = toISO(new Date(y, mo, i + 1));
          const list = by.get(iso);
          const a = (i / n) * 2 * Math.PI;
          const pos = { left: `${(50 + 35.8 * Math.sin(a)).toFixed(2)}%`, top: `${(50 - 35.8 * Math.cos(a)).toFixed(2)}%` };
          const cur = iso === C.today ? { 'aria-current': 'date' as const } : {};
          return list
            ? <a key={iso} className="oi-dd" href={`#d-${iso}`} style={pos} aria-label={`${longDate(new Date(y, mo, i + 1))}: ${list.length} ${plural(list.length)}`} {...cur}>{i + 1}</a>
            : <span key={iso} className="oi-dd" style={pos} aria-hidden="true" {...cur}>{i + 1}</span>;
        })}
        {here && todayDay
          ? <a className="oi-dhub" href={`#d-${C.today}`} aria-label={`${C.todayTag}: ${longDate(today)}`}>{hubText}</a>
          : <div className="oi-dhub">{hubText}</div>}
        <ul className="oi-key" aria-hidden="true">
          {LINES.map(l => <li key={l.key}><i className={`oi-ln oi-ln--${l.key}`} />{l.label}</li>)}
          <li><i className="oi-key__today" />{C.todayTag}</li>
        </ul>
      </div>

      <div className="oi-agenda">
        <div className="oi-agenda__head">
          <h2>{m.label}</h2>
          <p className="oi-agenda__count">Entries <b data-f-count>{total}</b></p>
        </div>
        <div className="oi-chips" role="group" aria-label="Show" data-lenis-prevent>
          <Chip attr="type" v="" on>{C.tabs[0].label}</Chip>
          {C.types.map(t => <Chip key={t.key} attr="type" v={t.key}><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{num(typeCount(t.key))}</b></Chip>)}
        </div>
        {days.length > 0 && (
          <nav className="oi-dayrail" aria-label={m.label} data-lenis-prevent>
            {here && (todayDay
              ? <a className="oi-dayrail__today" href={`#d-${C.today}`} aria-current="date">{C.todayTag}<b>{today.getDate()}</b></a>
              : <span className="oi-dayrail__today" aria-current="date">{C.todayTag}<b>{today.getDate()}</b></span>)}
            {days.filter(d => d !== todayDay).map(d => <a key={d.iso} href={`#d-${d.iso}`} aria-label={longDate(d.date)}>{d.date.getDate()}</a>)}
          </nav>
        )}
        {days.length > 0 && <ol className="oi-daylist">{ordered.map(d => <DayCard key={d.iso} d={d} today={d === todayDay} />)}</ol>}
        <Empty text={P.calendar.emptyMonth} show={!total} />
      </div>
    </div>
  );
}

function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  const R0 = 45.4;
  return (
    <>
      <Head k="calendar" aside={<p className="oi-today"><span>{C.todayTag}</span><b>{longDate(parseISO(C.today))}</b></p>} />
      <section className="oi-sec oi-cal" data-tabs>
        <div className="wrap oi-cal__grid">
          <div className="oi-dial oi-turn" role="tablist" aria-label={P.calendar.monthLabel} data-rv>
            {months.map((m, i) => {
              const a = (i / 12) * 2 * Math.PI;
              return (
                <button
                  key={m.key} type="button" role="tab" data-tab={m.key}
                  className={`oi-mo ${m.key === open ? 'is-on' : ''} ${monthEntries(m.date).length ? '' : 'is-empty'}`}
                  aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1} aria-label={m.label}
                  style={{ left: `${(50 + R0 * Math.sin(a)).toFixed(1)}%`, top: `${(50 - R0 * Math.cos(a)).toFixed(1)}%` }}
                >{m.short}</button>
              );
            })}
          </div>
          {months.map(m => <MonthPanel key={m.key} m={m} open={m.key === open} />)}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters: tab rail, the latest issue as an indigo card that stays put, document cards ================= */
type Doc = { key: string; day: string; mon: string; year: string; who: string; title: string; pdf: string; q?: string };
const Acts = ({ pdf, title, big }: { pdf: string; title: string; big?: boolean }) => {
  const A = R.press.actions;
  return (
    <div className={big ? 'oi-issue__acts' : 'oi-doc__acts'}>
      <a className={big ? 'oi-ibtn oi-ibtn--solid' : 'pbtn pbtn--solid'} href={pdf} target="_blank" rel="noopener" aria-label={`${A.preview}: ${title}`}>{A.preview}</a>
      <a className={big ? 'oi-ibtn' : 'pbtn'} href={pdf} download aria-label={`${A.download}: ${title}`}>{A.download}</a>
    </div>
  );
};
function DocList({ docs, filter }: { docs: Doc[]; filter: boolean }) {
  const [lead, ...rest] = docs;
  const item = (q?: string) => (filter && q ? { 'data-item': '', 'data-q': q } : {});
  return (
    <div className="oi-news">
      <article className="oi-issue" {...item(lead.q)} data-glow data-rv>
        <div className="oi-issue__in">
          <p className="oi-hub oi-hub--paper"><b>{lead.day}</b><span>{lead.mon} {lead.year}</span></p>
          <div className="oi-issue__text">
            <p className="oi-issue__who">{lead.who}</p>
            <h2 className="oi-issue__title">{lead.title}</h2>
          </div>
          <Acts pdf={lead.pdf} title={lead.title} big />
        </div>
      </article>
      {rest.length > 0 && (
        <ul className="oi-docs">
          {rest.map(d => (
            <li key={d.key} className="oi-doc oi-card" {...item(d.q)} data-glow data-rv>
              <div className="oi-doc__top">
                <p className="oi-hub oi-hub--init"><b>{d.day}</b><span>{d.mon}</span></p>
                <p className="oi-doc__meta"><b>{d.who}</b><span>{d.year}</span></p>
              </div>
              <h2 className="oi-doc__title">{d.title}</h2>
              <Acts pdf={d.pdf} title={d.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const years = pressYears();
  const parts = (iso: string) => { const t = dayMonth(iso); return { day: t.d, mon: t.m, year: t.y }; };
  return (
    <>
      <Head k="newsletters" aside={
        <p className="oi-hub oi-hub--paper oi-yeardisc"><span>{N.yearLabel}</span>{years.map(y => <b key={y.year} data-year={y.year} hidden={y.year !== year}>{y.year}</b>)}</p>
      } />
      <section className="oi-sec oi-press">
        <div className="wrap">
          {years.map(y => {
            const fill = (t: string) => R.fmt.fill(t, { year: y.year });
            const club: Doc[] = y.bulletins.map((b, i) => ({ key: b.title + i, ...parts(b.date), who: clubName(b.club), title: b.title, pdf: b.pdf, q: `${b.title} ${b.club}`.toLowerCase() }));
            const gov: Doc[] = y.gml.map((g, i) => ({ key: g.title + i, ...parts(g.date), who: g.governor, title: g.month, pdf: g.pdf }));
            return (
              <div key={y.year} className="oi-year" data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
                <div className="oi-ntabs" role="tablist" aria-label={`${R.press.title} ${y.year}`} data-rv>
                  <button type="button" role="tab" className="oi-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b data-count>{club.length}</b></button>
                  <button type="button" role="tab" className="oi-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b data-count>{gov.length}</b></button>
                </div>
                {club.length ? (
                  <div data-panel="club" role="tabpanel" aria-label={N.club} data-filter data-page-size={13}>
                    <div className="oi-ntools"><Search light label={N.searchLabel} total={club.length} /></div>
                    <DocList docs={club} filter />
                    <Empty text="No newsletter matches your search." />
                    <More label="Show more newsletters" />
                  </div>
                ) : (
                  <div data-panel="club" role="tabpanel" aria-label={N.club}><p className="oi-empty">{fill(R.press.club.empty)}</p></div>
                )}
                <div data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                  {gov.length ? <DocList docs={gov} filter={false} /> : <p className="oi-empty">{fill(R.press.gml.empty)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: one indigo stage holding the title, the Governor's office and the form card ================= */
function Contact() {
  const c = P.contact, ct = R.contact, F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const p = pageInfo('contact');
  const finder = pageInfo('finder');
  return (
    <>
      <section className="oi-head oi-stage" id="top">
        <Rings />
        <div className="wrap oi-stage__grid">
          <div className="oi-stage__text" data-rv>
            <Crumbs title={p.title} />
            <h1 className="oi-head__title">{p.title}</h1>
            <p className="oi-head__lead">{p.lead}</p>
          </div>
          <ul className="oi-lines" data-rv style={css({ '--d': 2 })}>
            <li><a href={`mailto:${ct.email}`}><span>{I.mail}</span>{ct.email}</a></li>
            {ct.tel && <li><a href={`tel:${ct.tel}`}><span>{I.phone}</span>{ct.phoneDisplay}</a></li>}
          </ul>
          <form className="oi-form" data-demo-form data-glow data-rv style={css({ '--d': 1 })}>
            <h2>{c.title}</h2>
            <div className="oi-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" autoComplete="organization" /></label>
              <label className="oi-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <p className="oi-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
            <div className="oi-form__foot">
              <button type="submit" className="oi-send">{F.send}{I.arrow}</button>
              <p className="oi-form__note">{c.formNote}</p>
            </div>
          </form>
          {dg && (
            <div className="oi-office" data-rv style={css({ '--d': 2 })}>
              <Face name={dg.name} photo={dg.photo} />
              <div>
                <h2>{c.office}</h2>
                <p>{dg.name}, {dg.role}</p>
              </div>
            </div>
          )}
          <p className="oi-stage__note" data-rv style={css({ '--d': 3 })}>{c.hours}</p>
        </div>
      </section>
      <section className="oi-next">
        <div className="wrap oi-next__grid">
          <article className="oi-card oi-step oi-step--join" data-glow data-rv>
            <span className="oi-hub" aria-hidden="true">{I.users}</span>
            <h2>{c.join.title}</h2>
            <p>{c.join.text}</p>
            <a className="btn btn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
          </article>
          <article className="oi-card oi-step oi-step--find" data-glow data-rv style={css({ '--d': 1 })}>
            <span className="oi-hub" aria-hidden="true">{I.compass}</span>
            <h2>{c.finder.title}</h2>
            <p>{c.finder.text}</p>
            <a className="pbtn" href={finder.file}>{finder.title}{I.arrow}</a>
          </article>
        </div>
      </section>
    </>
  );
}

const BODY: Record<PageKey, (p: { year: string }) => ReactNode> = {
  about: () => <About />,
  committee: () => <Committee />,
  finder: () => <Finder />,
  projects: () => <Projects />,
  service: () => <Service />,
  calendar: () => <CalendarPage />,
  newsletters: ({ year }) => <Newsletters year={year} />,
  contact: () => <Contact />
};

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`oi oi--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useReveal();
  useEffect(() => { saveTheme(theme); }, [theme]);
  useEffect(() => { startSmoothScroll(); }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);
  return (
    <ThemeCtx.Provider value={theme}>
      <TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
