import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, weekdayName, type CalEntry } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { Balloon, Rings } from './Calendar';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* TIDE inner pages. Built only from the homepage's own objects: the deep-teal band of the
   snapshot (it heads every page and ends in a rolling wave edge), the white card that overlaps
   a portrait, tickets with stubs and perforations, newsletter spines and the waterline under
   the menu. Page bodies are plain markup with data attributes (shared/inner.js), so the same
   page also works as static HTML. */

const v = (o: Record<string, string | number>) => o as CSSProperties;
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  out: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  go: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M3 8h10M9 4l4 4-4 4" /></svg>,
  down: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="m4 6 4 4 4-4" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="9" /><path {...sw} d="m8 12.5 2.7 2.7L16 10" /></svg>,
  people: <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  place: <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>
};
const TILE = 'M0 40C125 80 375 0 500 40S875 80 1000 40V120H0Z';
const SPINES = ['#075e69', '#0058b0', '#a60f52', '#6d1a70', '#00707a', '#0b3d91', '#8a1c6c', '#0a4f5a'];

/* ---------- shared parts ---------- */
const Sea = ({ className, layers = 2, tiles = 2 }: { className: string; layers?: number; tiles?: number }) => (
  <div className={className} aria-hidden="true">
    {Array.from({ length: layers }, (_, i) => (
      <svg key={i} viewBox={`0 0 ${tiles * 1000} 120`} preserveAspectRatio="none">
        {Array.from({ length: tiles }, (_, t) => <path key={t} d={TILE} transform={`translate(${t * 1000} 0)`} />)}
      </svg>
    ))}
  </div>
);

/* page head: deep teal, poster title, the page's own figure or control docked on the right */
function PageHead({ k, dock, center = false, lead = true }: { k: PageKey; dock?: ReactNode; center?: boolean; lead?: boolean }) {
  const p = pageInfo(k);
  return (
    <section className={`tp-head${center ? ' tp-head--center' : ''}`} id="top">
      <div className="wrap tp-head__in">
        <div className="tp-head__main" data-rv>
          <nav className="tp-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.title}</span>
          </nav>
          <h1 className="tp-h1">{p.title}</h1>
          {lead && <p className="tp-lead">{p.lead}</p>}
        </div>
        {dock && <div className="tp-dock" data-rv="side" style={v({ '--i': 1 })}>{dock}</div>}
      </div>
      <Sea className="tp-wave" tiles={4} />
    </section>
  );
}

const Find = ({ label, deep = false, children }: { label: string; deep?: boolean; children?: ReactNode }) => (
  <label className={`tp-find${deep ? ' tp-find--deep' : ''}`}>
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" enterKeyHint="search" />
    {children}
  </label>
);
/* the live number; shown only while a search or a filter is active */
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="tp-count" aria-live="polite"><b data-f-count>{num(total)}</b> of {num(total)} {noun}</p>
);
const Chip = ({ attr, val, on = false, children }: { attr: string; val: string; on?: boolean; children: ReactNode }) => (
  <button type="button" className="tp-chip" data-f-chip={attr} data-v={val} aria-pressed={on}>{children}</button>
);
const Empty = ({ text, hidden = true, filter = true, children }: { text: string; hidden?: boolean; filter?: boolean; children?: ReactNode }) => (
  <div className="tp-empty" {...(filter ? { 'data-f-empty': '' } : {})} hidden={hidden}>
    <svg className="tp-empty__wave" viewBox="0 0 60 8" aria-hidden="true"><path d="M1 4c5-4 9-4 14.5 0s9 4 14.5 0 9-4 14.5 0 9 4 14.5 0" /></svg>
    <p>{text}</p>
    {children}
  </div>
);
const More = ({ label }: { label: string }) => (
  <div className="tp-more"><button type="button" className="tp-btn tp-btn--solid" data-f-more hidden>{label}{I.down}</button></div>
);
const Rule = () => <i className="tp-rule" aria-hidden="true" />;
/* a heading with its live number and a wave rule filling the rest of the line */
const GroupHead = ({ title, n }: { title: string; n: number }) => (
  <header className="tp-gh"><h3>{title}</h3><span className="tp-gh__n" data-f-group-count>{num(n)}</span><Rule /></header>
);

/* ================= About: the title and the admin's one content field ================= */
function About() {
  return (
    <>
      <PageHead k="about" center lead={false} />
      <section className="tp-about">
        <div className="wrap">
          <div className="tp-col" data-rv><AdminContent className="tp-prose" /></div>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee: the Governor spread, then one manifest per committee ================= */
type Mem = ReturnType<typeof committee>[number]['members'][number];
const Avatar = ({ m }: { m: Mem }) => (
  <span className="tp-ava" aria-hidden="true">{m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" /> : m.initials}</span>
);
const Leader = ({ m, group }: { m: Mem; group: string }) => (
  <article className="tp-top" data-item data-q={m.q} data-group={group}>
    <figure className="tp-top__photo">
      {m.photo ? <img src={m.photo.src} alt={m.photo.alt} width={m.photo.w} height={m.photo.h} /> : <span aria-hidden="true">{m.initials}</span>}
    </figure>
    <div className="tp-top__card">
      <p className="tp-top__role">{m.role}</p>
      <h3 className="tp-top__name">{m.name}</h3>
      {m.club && <p className="tp-top__club">{clubName(m.club)}</p>}
    </div>
  </article>
);
const Band = ({ title, n, lead = false }: { title: string; n: number; lead?: boolean }) => (
  <header className={`tp-band${lead ? ' tp-band--lead' : ''}`}>
    <h2>{title}</h2><Rule /><span className="tp-band__n" data-f-group-count>{num(n)}</span>
  </header>
);
const Row = ({ m, group }: { m: Mem; group: string }) => (
  <li className="tp-row" data-item data-q={m.q} data-group={group}>
    <Avatar m={m} />
    <h3 className="tp-row__name">{m.name}</h3>
    <p className="tp-row__role">{m.role}</p>
    {m.club && <p className="tp-row__club">{clubName(m.club)}</p>}
  </li>
);

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [first, ...rest] = groups;
  const [leader, ...exec] = first ? first.members : [];
  return (
    <div className="tp-flt" data-filter>
      <PageHead k="committee" dock={<>
        <p className="tp-fig"><b data-count data-w={num(total)}>{num(total)}</b> <span>members in {num(groups.length)} committees</span></p>
        <Find label={P.committee.searchLabel} deep />
      </>} />
      <section className="tp-body tp-cm">
        <div className="wrap">
          <div className="tp-rail" data-rv>
            <div className="tp-chips" role="group" aria-label="Committee">
              <Chip attr="group" val="" on>All<span className="tp-chip__n">{num(total)}</span></Chip>
              {groups.map(g => <Chip key={g.key} attr="group" val={g.key}>{g.title}<span className="tp-chip__n">{num(g.members.length)}</span></Chip>)}
            </div>
            <Count total={total} noun="members" />
          </div>
          <div className="tp-cm__list">
            {first && (
              <section className="tp-cm__lead" data-f-group data-rv>
                {leader && <Leader m={leader} group={first.key} />}
                <div className="tp-cm__exec">
                  <Band title={first.title} n={first.members.length} lead />
                  <ul className="tp-mems">
                    {exec.map((m, i) => (
                      <li key={i} className="tp-mem" data-item data-q={m.q} data-group={first.key}>
                        <Avatar m={m} />
                        <div className="tp-mem__text">
                          <h3>{m.name}</h3>
                          <p className="tp-mem__role">{m.role}</p>
                          {m.club && <p className="tp-mem__club">{clubName(m.club)}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
            {rest.map(g => (
              <section key={g.key} className="tp-man" data-f-group data-rv>
                <Band title={g.title} n={g.members.length} />
                <ul className="tp-rows">{g.members.map((m, i) => <Row key={i} m={m} group={g.key} />)}</ul>
              </section>
            ))}
            <Empty text={P.committee.empty} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= Club Finder: a week deck over boarding-strip tickets ================= */
/* the day the backend sends, matched by its first three letters ("Thurs" is Thursday) */
const dayKey = (d?: string) => P.finder.days.find(x => !!d && x.slice(0, 3).toLowerCase() === d.trim().slice(0, 3).toLowerCase()) ?? '';

function Finder() {
  const f = P.finder;
  const list = clubs().map(c => ({ ...c, dk: dayKey(c.day) }));
  const on = (d: string) => list.filter(c => c.dk === d).length;
  return (
    <div className="tp-flt" data-filter data-page-size={f.pageSize}>
      <PageHead k="finder" dock={<>
        <p className="tp-fig"><b data-count data-w={num(list.length)}>{num(list.length)}</b> <span>clubs in District {R.site.district}</span></p>
        <Find label={f.searchLabel} deep />
      </>} />
      <section className="tp-body tp-fd">
        <div className="wrap">
          <div className="tp-rail" data-rv>
            <div className="tp-week" role="group" aria-label={f.dayLabel}>
              <button type="button" className="tp-day" data-f-chip="day" data-v="" aria-pressed="true" aria-label={`${f.anyDay}, ${num(list.length)} clubs`}>
                <b>All</b><span>{num(list.length)}</span>
              </button>
              {f.days.map(d => (
                <button key={d} type="button" className={`tp-day${on(d) ? '' : ' is-none'}`} data-f-chip="day" data-v={d} aria-pressed="false" aria-label={`${d}, ${num(on(d))} clubs`}>
                  <b>{d.slice(0, 3)}</b><span>{num(on(d))}</span>
                </button>
              ))}
            </div>
            <Count total={list.length} noun="clubs" />
          </div>
          <ul className="tp-clubs" data-rv>
            {list.map(c => (
              <li key={c.id} className="tp-tk tp-club" data-item data-q={c.q} data-day={c.dk}>
                <span className="tp-tk__stub">
                  {c.day ? <><b>{c.day.trim().slice(0, 3)}</b><small>{c.dk || c.day}</small></> : <><b aria-hidden="true">—</b><span className="sr-only">Meeting day not listed</span></>}
                </span>
                <div className="tp-tk__main">
                  <h3>Rotary Club of {c.name}</h3>
                  {c.place && <p className="tp-club__place" title={c.place}>{I.pin}<span>{c.place}</span></p>}
                </div>
                <a className="tp-tk__end" href={c.href} target="_blank" rel="noopener" aria-label={`${f.visit}: Rotary Club of ${c.name} (opens in a new tab)`}>
                  <span>{f.visit}</span>{I.out}
                </a>
              </li>
            ))}
          </ul>
          <Empty text={f.empty} />
          <More label={f.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Projects: a monthly log; Club Service: overlap spreads ================= */
const q = (p: Project) => `${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase();
const Nums = ({ p, className }: { p: Project; className: string }) => {
  const L = P.projects.statLabels;
  return (
    <dl className={className}>
      <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
      <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
      <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
    </dl>
  );
};

function ProjectCard({ p }: { p: Project }) {
  const [day, mon, yr] = shortDate(p.date).split(' ');
  return (
    <li className="tp-pj" data-item data-q={q(p)} data-avenue={p.avenue}>
      <div className="tp-pj__in">
        <figure className="tp-pj__photo">
          {p.photo && <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />}
          <span className="tp-pj__tag">{avenueLabel(p.avenue)}</span>
        </figure>
        <div className="tp-pj__body">
          <p className="tp-pj__meta">
            <time className="tp-pj__date" dateTime={p.date}><b>{day}</b> <span>{mon} {yr}</span></time>
            <span className="tp-pj__av">{avenueLabel(p.avenue)}</span>
          </p>
          <h3 className="tp-pj__title">{p.title}</h3>
          <p className="tp-pj__club">{clubName(p.club)}</p>
          <p className="tp-pj__sum">{p.summary}</p>
          <Nums p={p} className="tp-pj__nums" />
        </div>
      </div>
    </li>
  );
}

const Spread = ({ p }: { p: Project }) => (
  <li className="tp-sp" data-item data-q={q(p)} data-avenue={p.avenue}>
    <figure className="tp-sp__photo" data-rv>{p.photo && <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />}</figure>
    <div className="tp-sp__card" data-rv style={v({ '--i': 1 })}>
      <time className="tp-sp__date" dateTime={p.date}>{shortDate(p.date)}</time>
      <h3 className="tp-sp__title">{p.title}</h3>
      <p className="tp-sp__club">{clubName(p.club)}</p>
      <p className="tp-sp__sum">{p.summary}</p>
      <Nums p={p} className="tp-sp__nums" />
    </div>
  </li>
);

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const list = [...projectsOf(service ? 'club' : undefined)].sort((a, b) => b.date.localeCompare(a.date));
  const t = totals(list);
  const L = x.statLabels;
  const stats: [keyof typeof L, string, string][] = [
    ['projects', num(t.projects), '#5FD8E3'],
    ['beneficiaries', num(t.beneficiaries), '#FF8FBC'],
    ['amount', `₹${R.fmt.num(t.amount, 1)} L`, '#FFC44D'],
    ['hours', num(t.hours), '#7CC4FF']
  ];
  const months = new Map<string, Project[]>();
  list.forEach(p => months.set(p.date.slice(0, 7), [...(months.get(p.date.slice(0, 7)) ?? []), p]));
  return (
    <div className="tp-flt" data-filter data-page-size={x.pageSize}>
      <PageHead k={service ? 'service' : 'projects'} dock={<>
        <dl className="tp-stats">
          {stats.map(([k, val, a]) => (
            <div key={k} style={v({ '--a': a })} data-glow><dt>{L[k]}</dt><dd data-count data-w={val}>{val}</dd></div>
          ))}
        </dl>
        <Find label={x.searchLabel} deep />
      </>} />
      <section className={`tp-body ${service ? 'tp-sv' : 'tp-pjs'}`}>
        <div className="wrap">
          {service ? (
            <>
              <div className="tp-rail tp-rail--bare"><Count total={list.length} noun="projects" /></div>
              <ul className="tp-spreads">{list.map(p => <Spread key={p.id} p={p} />)}</ul>
            </>
          ) : (
            <>
              <div className="tp-rail" data-rv>
                <div className="tp-chips" role="group" aria-label="Avenue of service">
                  <Chip attr="avenue" val="" on>{x.allLabel}</Chip>
                  {x.avenues.map(a => <Chip key={a.key} attr="avenue" val={a.key}>{a.label}</Chip>)}
                </div>
                <Count total={list.length} noun="projects" />
              </div>
              <div className="tp-logs">
                {[...months].map(([ym, ps]) => {
                  const d = parseISO(`${ym}-01`);
                  return (
                    <section key={ym} className="tp-log" data-f-group data-rv aria-label={monthLabel(d)}>
                      <header className="tp-log__m">
                        <h2><b>{monthLabel(d).slice(0, 3)}</b> <span>{d.getFullYear()}</span></h2>
                        <p className="tp-log__n">{L.projects} <b data-f-group-count>{num(ps.length)}</b></p>
                      </header>
                      <ul className="tp-log__cards">{ps.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
                    </section>
                  );
                })}
              </div>
            </>
          )}
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= District Calendar: today first, then the month's events, then the celebrations ================= */
const C = R.calendar;
const EVENT = (e: CalEntry) => e.type === 'club' || e.type === 'district';
const typeLabel = (k: CalEntry['type']) => C.types.find(t => t.key === k)?.label ?? '';

const Names = ({ kind, list }: { kind: 'birthday' | 'anniversary'; list: CalEntry[] }) => (
  <div className="tp-names" data-f-group>
    {list.length > 8 && (
      <details className="tp-all">
        <summary><span className="tp-all__more">Show all {num(list.length)}</span><span className="tp-all__less">Show fewer</span>{I.down}</summary>
      </details>
    )}
    <ul className={kind === 'birthday' ? 'wishes' : 'vows'}>
      {list.map((e, k) => (
        <li key={k} className={kind === 'birthday' ? 'wish' : 'vow'} data-item data-type={e.type}>
          {kind === 'birthday' ? <Balloon name={e.name ?? ''} /> : <Rings name={e.name ?? ''} />}
          <span className="wish__text"><b>{e.name}</b><span>{e.club ? clubName(e.club) : e.relation}</span></span>
        </li>
      ))}
    </ul>
  </div>
);

/* an event as a ticket; in the today card the stub shows the time, in the month list the date */
const Ticket = ({ e, stub }: { e: CalEntry; stub: ReactNode }) => (
  <li className={`tp-tk tp-ev tp-ev--${e.type}`} data-item data-type={e.type}>
    <span className="tp-tk__stub">{stub}</span>
    <div className="tp-tk__main">
      <p className="tp-ev__type">{typeLabel(e.type)}</p>
      <h4 className="tp-ev__title">{e.title}</h4>
      {(e.time || e.club) && <p className="tp-ev__when">{[e.time, e.club && clubName(e.club)].filter(Boolean).join(' · ')}</p>}
      {e.venue && <p className="tp-ev__where">{I.pin}<span>{e.venue}</span></p>}
    </div>
  </li>
);

function TodayCard({ list }: { list: CalEntry[] }) {
  const d = parseISO(C.today);
  const types = C.types.filter(t => list.some(e => e.type === t.key));
  return (
    <section className="tp-today" aria-label={`${C.todayTag}, ${longDate(d)}`} data-rv>
      <div className="tp-today__date" data-glow>
        <time dateTime={C.today} aria-current="date">
          <b>{d.getDate()}</b>
          <span className="tp-today__when">
            <span className="tp-today__wd">{weekdayName(d)}</span>
            <span className="tp-today__my">{monthLabel(d)}</span>
            <span className="tp-tag">{C.todayTag}</span>
          </span>
        </time>
      </div>
      <div className="tp-today__body">
        {types.map(t => {
          const l = list.filter(e => e.type === t.key);
          const ev = t.key === 'club' || t.key === 'district';
          return (
            <div key={t.key} className={`tp-today__g${ev ? ' tp-today__g--ev' : ''}`} data-f-group>
              <p className="dgroup__title"><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b data-f-group-count>{num(l.length)}</b></p>
              {ev ? (
                <ul className="tp-today__evs">{l.map((e, k) => <Ticket key={k} e={e} stub={<><b>{e.time ?? '—'}</b><small>{t.label}</small></>} />)}</ul>
              ) : <Names kind={t.key as 'birthday' | 'anniversary'} list={l} />}
            </div>
          );
        })}
        <p className={`tp-today__none${list.length ? '' : ' is-on'}`}>{C.emptyDay}</p>
      </div>
    </section>
  );
}

function CalendarPage() {
  const months = calMonths();
  const open = todayMonthKey();
  const nowLabel = months.find(m => m.key === open)?.label ?? '';
  const data = months.map(m => {
    const days = monthEntries(m.date);
    const isNow = m.key === open;
    const all = days.flatMap(x => x.list);
    const today = isNow ? days.find(x => x.iso === C.today)?.list ?? [] : [];
    const rest = days.filter(x => !(isNow && x.iso === C.today));
    const events = rest.flatMap(x => x.list.filter(EVENT).map(e => ({ e, date: x.date })));
    const ledger = rest.map(x => ({ ...x, list: x.list.filter(e => !EVENT(e)) })).filter(x => x.list.length);
    return { m, isNow, all, today, events, ledger };
  });
  const pad = (
    <div className="tp-pad" role="tablist" aria-label={P.calendar.monthLabel}>
      {[data.slice(0, 6), data.slice(6)].map((row, ri) => (
        <div key={ri} className="tp-pad__row" role="presentation">
          <span className="tp-pad__yr" aria-hidden="true">{row[0]?.m.date.getFullYear()}</span>
          {row.map(({ m, isNow, all }) => (
            <button key={m.key} type="button" role="tab" className={`tp-pad__m${isNow ? ' is-on' : ''}${all.length ? '' : ' is-quiet'}`}
              data-tab={m.key} aria-selected={isNow} tabIndex={isNow ? 0 : -1} aria-label={m.label} {...(isNow ? { 'data-now': '' } : {})}>
              {m.short}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <div className="tp-flt" data-tabs data-tabs-hash>
      <PageHead k="calendar" dock={pad} />
      <section className="tp-body tp-cal">
        <div className="wrap">
          {data.map(({ m, isNow, all, today, events, ledger }) => (
            <div key={m.key} className={`tp-cal__p${all.length ? '' : ' is-empty'}`} data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!isNow} data-filter>
              <header className="tp-cal__bar" data-rv>
                <h2>{m.label}</h2>
                {all.length > 0 && <Count total={all.length} noun="entries" />}
                {all.length > 0 && (
                  <div className="tp-chips" role="group" aria-label="Show">
                    <Chip attr="type" val="" on>All<span className="tp-chip__n">{num(all.length)}</span></Chip>
                    {C.types.map(t => {
                      const n = all.filter(e => e.type === t.key).length;
                      return n ? <Chip key={t.key} attr="type" val={t.key}><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<span className="tp-chip__n">{num(n)}</span></Chip> : null;
                    })}
                  </div>
                )}
              </header>
              {isNow && <TodayCard list={today} />}
              {events.length > 0 && (
                <section className="tp-cal__sec" data-f-group data-rv>
                  <GroupHead title="Events" n={events.length} />
                  <ul className="tp-evts">
                    {events.map(({ e, date }, i) => <Ticket key={i} e={e} stub={<><b>{date.getDate()}</b><small>{weekdayName(date).slice(0, 3)}</small></>} />)}
                  </ul>
                </section>
              )}
              {ledger.length > 0 && (
                <section className="tp-cal__sec" data-f-group data-rv>
                  <GroupHead title="Birthdays and anniversaries" n={ledger.reduce((s, x) => s + x.list.length, 0)} />
                  <ol className="tp-led">
                    {ledger.map(x => {
                      const b = x.list.filter(e => e.type === 'birthday');
                      const a = x.list.filter(e => e.type === 'anniversary');
                      return (
                        <li key={x.iso} className="tp-led__day" data-f-group>
                          <time className="tp-led__date" dateTime={x.iso}><b>{x.date.getDate()}</b><span>{weekdayName(x.date).slice(0, 3)}</span></time>
                          <div className="tp-led__names">
                            {b.length > 0 && <Names kind="birthday" list={b} />}
                            {a.length > 0 && <Names kind="anniversary" list={a} />}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
              <Empty text={P.calendar.emptyMonth} hidden={all.length > 0}>
                {!isNow && <a className="tp-btn tp-btn--line" href={pageInfo('calendar').file}>{nowLabel}{I.go}</a>}
              </Empty>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================= Newsletters: the shelf of spines, earlier issues as rows, the Governor's letters ================= */
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const A = R.press.actions;
  const years = pressYears();
  const acts = (title: string, pdf: string, solid: string, line: string) => (
    <>
      <a className={`tp-btn ${solid}`} href={pdf} target="_blank" rel="noopener" aria-label={`${A.preview}: ${title} (opens in a new tab)`}>{A.preview}</a>
      <a className={`tp-btn ${line}`} href={pdf} download aria-label={`${A.download}: ${title}`}>{A.download}</a>
    </>
  );
  return (
    <>
      <PageHead k="newsletters" dock={years.map(y => (
        <p key={y.year} className="tp-fig tp-fig--year" data-year={y.year} hidden={y.year !== year}><b>{y.year}</b><span>{N.yearLabel}</span></p>
      ))} />
      <section className="tp-body tp-nl">
        <div className="wrap">
          {years.map(y => {
            const shelf = y.bulletins.slice(0, 8);
            const older = y.bulletins.slice(8);
            return (
              <div key={y.year} className="tp-nl__y" data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
                <div className="tp-tabs" role="tablist" aria-label={R.press.title} data-rv>
                  <button type="button" role="tab" className="tp-tab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="tp-tab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                <div className="tp-nl__p" data-panel="club" role="tabpanel" aria-label={N.club} data-filter data-page-size="20">
                  {y.bulletins.length ? (
                    <>
                      <Find label={N.searchLabel}><span className="tp-count" aria-live="polite"><b data-f-count>{num(y.bulletins.length)}</b> of {num(y.bulletins.length)}</span></Find>
                      <ul className="tp-shelf" data-rv>
                        {shelf.map((b, i) => (
                          <li key={b.title + i} className="tp-spine" data-item data-q={`${b.title} ${b.club}`.toLowerCase()} style={v({ '--c': SPINES[i % SPINES.length] })} title={b.title}>
                            <div className="tp-spine__run" aria-hidden="true"><span className="tp-spine__t">{b.title}</span><span className="tp-spine__d">{shortDate(b.date)}</span></div>
                            <div className="tp-spine__body">
                              <p className="tp-spine__club">{clubName(b.club)}</p>
                              <h3 className="tp-spine__title">{b.title}</h3>
                              <p className="tp-spine__date">{shortDate(b.date)}</p>
                              <div className="tp-spine__acts">{acts(b.title, b.pdf, 'tp-btn--white', 'tp-btn--ghost')}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {older.length > 0 && (
                        <section className="tp-older" data-f-group data-rv>
                          <GroupHead title="Earlier issues" n={older.length} />
                          <ul className="tp-issues">
                            {older.map((b, i) => (
                              <li key={b.title + i} className="tp-issue" data-item data-q={`${b.title} ${b.club}`.toLowerCase()} style={v({ '--c': SPINES[(i + 8) % SPINES.length] })}>
                                <time dateTime={b.date}>{shortDate(b.date)}</time>
                                <div><h3>{b.title}</h3><p>{clubName(b.club)}</p></div>
                                <div className="tp-issue__acts">{acts(b.title, b.pdf, 'tp-btn--solid', 'tp-btn--line')}</div>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      <Empty text="No newsletter matches your search." />
                      <More label="Show more newsletters" />
                    </>
                  ) : <Empty text={R.fmt.fill(R.press.club.empty, { year: y.year })} hidden={false} />}
                </div>
                <div className="tp-nl__p" data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                  {y.gml.length ? (
                    <ul className="tp-letters" data-rv>
                      {y.gml.map(g => (
                        <li key={g.title} className="tp-letter" data-glow>
                          <h3>{g.month}</h3>
                          <p className="tp-letter__who">{g.governor}</p>
                          <p className="tp-letter__date">{shortDate(g.date)}</p>
                          <div className="tp-letter__acts">{acts(g.title, g.pdf, 'tp-btn--white', 'tp-btn--ghost')}</div>
                        </li>
                      ))}
                    </ul>
                  ) : <Empty text={R.fmt.fill(R.press.gml.empty, { year: y.year })} hidden={false} filter={false} />}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: the office ticket over the wave, the message ticket, two onward tickets ================= */
function Contact() {
  const c = P.contact;
  const ct = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const finder = pageInfo('finder');
  return (
    <>
      <PageHead k="contact" />
      <section className="tp-ct">
        <div className="wrap tp-ct__in">
          <div className="tp-office" data-rv>
            <span className="tp-office__stub">
              {dg?.photo ? <img src={dg.photo.src} alt={dg.photo.alt} width={dg.photo.w} height={dg.photo.h} /> : <b aria-hidden="true">{dg ? initials(dg.name) : ''}</b>}
            </span>
            <div className="tp-office__main">
              <h2>{c.office}</h2>
              {dg && <p>{dg.name}, {ct.label}</p>}
            </div>
            <a className="tp-office__end" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>
            {ct.tel && <a className="tp-office__end" href={`tel:${ct.tel}`}>{I.phone}<span>{ct.phoneDisplay}</span></a>}
          </div>
          <form className="tp-msg" data-demo-form data-rv style={v({ '--i': 1 })}>
            <div className="tp-msg__stub" data-glow>
              <h2>{c.title}</h2>
              <p>{c.hours}</p>
              <Sea className="tp-msg__sea" layers={3} />
            </div>
            <div className="tp-msg__main">
              <div className="tp-msg__grid">
                <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
                <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
                <label><span>{F.club}</span><input name="club" autoComplete="organization" /></label>
                <label className="tp-msg__wide"><span>{F.message}</span><textarea name="message" rows={4} required /></label>
              </div>
              <p className="tp-done" data-form-done hidden tabIndex={-1} role="status">{I.check}<span>{c.sent}</span></p>
              <div className="tp-msg__send">
                <p>{c.formNote}</p>
                <button type="submit" className="tp-btn tp-btn--solid tp-btn--big">{F.send}{I.go}</button>
              </div>
            </div>
          </form>
          <div className="tp-ct__more" data-rv>
            <div className="tp-tk tp-act tp-act--join">
              <span className="tp-tk__stub">{I.people}</span>
              <div className="tp-tk__main"><h2>{c.join.title}</h2><p>{c.join.text}</p></div>
              <div className="tp-tk__end"><a className="tp-btn tp-btn--gold" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}{I.out}</a></div>
            </div>
            <div className="tp-tk tp-act tp-act--find">
              <span className="tp-tk__stub">{I.place}</span>
              <div className="tp-tk__main"><h2>{c.finder.title}</h2><p>{c.finder.text}</p></div>
              <div className="tp-tk__end"><a className="tp-btn tp-btn--solid" href={finder.file}>{finder.title}{I.go}</a></div>
            </div>
          </div>
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
  service: () => <Projects service />,
  calendar: () => <CalendarPage />,
  newsletters: ({ year }) => <Newsletters year={year} />,
  contact: () => <Contact />
};

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`tp tp--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  useEffect(() => { startSmoothScroll(); }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);
  return (
    <ThemeCtx.Provider value={theme}>
      <TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} inner />
      <Header inner />
      <Body page={page} year={year} />
      <Footer inner />
    </ThemeCtx.Provider>
  );
}
