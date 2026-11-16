import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, shortDate, monthMatrix, toISO, weekdayName, type CalEntry } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* TRANSIT inner pages (v2): ordinary vertical pages built from the homepage's parts. A short pastel head
   band with the two-tone title and a route-line breadcrumb, then colour cards, white boards and "platform"
   cards. Page bodies are plain markup + the data attributes of shared/inner.js, so the plain-HTML pages
   (rendered once from this same code) behave the same with no React. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M3 8h10M9 4l4 4-4 4" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
};

/* the Rotary colours, in the order every list cycles through them */
const CYCLE = ['var(--azure)', 'var(--cranberry)', 'var(--teal)', 'var(--violet)', 'var(--orange)', 'var(--green)'];
const col = (i: number) => CYCLE[i % CYCLE.length];
const css = (o: Record<string, string | number>) => o as CSSProperties;

/* a homepage section title: the last word in the page's pop colour (one word: all of it) */
const Title = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i < 0 ? <em>{text}</em> : <>{text.slice(0, i)} <em>{text.slice(i + 1)}</em></>;
};

/* ---------- page head: a short band on the page's pastel ground; the slot holds the page's control or figures ---------- */
function Head({ k, lead = true, slot, tools, below }: { k: PageKey; lead?: boolean; slot?: ReactNode; tools?: ReactNode; below?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="tx-head" id="top">
      <span className="tx-head__art" aria-hidden="true" />
      <div className="wrap tx-head__row">
        <div className="tx-head__text" data-rv>
          <nav className="tx-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-current="page">{p.title}</span>
          </nav>
          <h1 className="tx-head__title"><Title text={p.title} /></h1>
          {lead && <p className="tx-head__lead">{p.lead}</p>}
          {tools}
        </div>
        {slot && <div className="tx-head__slot" data-rv style={css({ '--d': 1 })}>{slot}</div>}
      </div>
      {below && <div className="wrap tx-head__below" data-rv style={css({ '--d': 1 })}>{below}</div>}
    </section>
  );
}

/* ---------- shared parts ---------- */
const Search = ({ label }: { label: string }) => (
  <label className="tx-search">
    {I.search}
    <span className="tx-sr">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ n, noun }: { n: number; noun: string }) => <p className="tx-count" aria-live="polite"><b data-f-count>{num(n)}</b> {noun}</p>;
const Empty = ({ text }: { text: string }) => <p className="tx-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="tx-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
const Chip = ({ attr, v, on = false, c, children }: { attr: string; v: string; on?: boolean; c?: string; children: ReactNode }) => (
  <button type="button" className="tx-chip" data-f-chip={attr} data-v={v} aria-pressed={on ? 'true' : 'false'} style={c ? css({ '--tc': c }) : undefined}>{children}</button>
);

/* ================= About: the title, the breadcrumb and the admin's content on a sheet ================= */
function About() {
  return (
    <>
      <Head k="about" lead={false} />
      <section className="tx-sec tx-about">
        <div className="wrap" data-rv><AdminContent className="tx-prose" /></div>
      </section>
    </>
  );
}

/* ================= District Committee: a line-map rail of committees + the roster ================= */
type Member = ReturnType<typeof committee>[number]['members'][number];

const Avatar = ({ m }: { m: Member }) => (
  <span className="tx-av" aria-hidden="true">{m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" /> : m.initials}</span>
);
const Row = ({ m, g }: { m: Member; g: string }) => (
  <li className="tx-row" data-item data-q={m.q} data-group={g}>
    <Avatar m={m} />
    <div className="tx-row__text"><h3>{m.name}</h3><p>{m.role}</p></div>
    {m.club && <p className="tx-row__club">{clubName(m.club)}</p>}
  </li>
);
const PlatHead = ({ title, n }: { title: string; n: number }) => <h2 className="tx-plat__head"><span>{title}</span><b data-f-group-count>{n}</b></h2>;

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [first, ...rest] = groups;
  const lead = first?.members[0];
  return (
    <div data-filter>
      <Head k="committee" slot={
        <div className="tx-find">
          <Search label={P.committee.searchLabel} />
          <div className="tx-find__meta"><Count n={total} noun="members" /><span>{groups.length} committees</span></div>
        </div>
      } />
      <section className="tx-sec tx-sec--first">
        <div className={`wrap tx-com${groups.length > 1 ? '' : ' tx-com--one'}`}>
          {groups.length > 1 && (
            <div className="tx-rail" role="group" aria-label="Committee" data-lenis-prevent>
              <button type="button" className="tx-stop" data-f-chip="group" data-v="" aria-pressed="true"><i aria-hidden="true" /><span>All</span><b>{total}</b></button>
              {groups.map((g, i) => (
                <button key={g.key} type="button" className="tx-stop" data-f-chip="group" data-v={g.key} aria-pressed="false" style={css({ '--gc': col(i) })}>
                  <i aria-hidden="true" /><span>{g.title}</span><b>{g.members.length}</b>
                </button>
              ))}
            </div>
          )}
          <div className="tx-roster">
            {first && (
              <section className="tx-lead" data-f-group data-rv aria-label={first.title}>
                {lead && (
                  <article className="tx-feature tx-board" data-item data-q={lead.q} data-group={first.key}>
                    <div className="tx-feature__photo">
                      <div className="tx-feature__frame">
                        {lead.photo
                          ? <img src={lead.photo.src} alt={lead.photo.alt} width={lead.photo.w} height={lead.photo.h} />
                          : <span className="tx-feature__ini" aria-hidden="true">{lead.initials}</span>}
                      </div>
                    </div>
                    <div className="tx-feature__info">
                      <p className="tx-feature__role">{lead.role}</p>
                      <h3 className="tx-feature__name">{lead.name}</h3>
                      {lead.club && <p className="tx-feature__club">{clubName(lead.club)}</p>}
                    </div>
                  </article>
                )}
                {first.members.length > 1 && (
                  <div className="tx-plat" style={css({ '--gc': col(0) })}>
                    <PlatHead title={first.title} n={first.members.length} />
                    <ul className="tx-rows">{first.members.slice(1).map((m, j) => <Row key={j} m={m} g={first.key} />)}</ul>
                  </div>
                )}
              </section>
            )}
            {rest.length > 0 && (
              <div className="tx-plats">
                {rest.map((g, i) => (
                  <section key={g.key} className="tx-plat" data-f-group data-rv style={css({ '--gc': col(i + 1), '--d': i % 2 })}>
                    <PlatHead title={g.title} n={g.members.length} />
                    <ul className="tx-rows">{g.members.map((m, j) => <Row key={j} m={m} g={g.key} />)}</ul>
                  </section>
                ))}
              </div>
            )}
            <Empty text={P.committee.empty} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= Club Finder: a search console with a week switch, and a departure board ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  const onDay = (d: string) => list.filter(c => c.day === d).length;
  return (
    <div data-filter data-page-size={f.pageSize}>
      <Head k="finder" slot={
        <div className="tx-console tx-board">
          <div className="tx-console__top">
            <Search label={f.searchLabel} />
            <p className="tx-count tx-count--stack" aria-live="polite"><b data-f-count>{num(list.length)}</b><span>clubs</span></p>
          </div>
          <div className="tx-week" role="group" aria-label={f.dayLabel} data-lenis-prevent>
            <button type="button" className="tx-wday" data-f-chip="day" data-v="" aria-pressed="true"><b>{f.anyDay}</b><small>{num(list.length)}</small></button>
            {f.days.map(d => (
              <button key={d} type="button" className="tx-wday" data-f-chip="day" data-v={d} data-day={d} aria-pressed="false" aria-label={`${d}, ${onDay(d)} clubs`}>
                <b>{d.slice(0, 3)}</b><small>{onDay(d)}</small>
              </button>
            ))}
          </div>
        </div>
      } />
      <section className="tx-sec tx-sec--first">
        <div className="wrap">
          <ul className="tx-deps" data-rv>
            {list.map(c => (
              <li key={c.id} className="tx-dep" data-item data-q={c.q} data-day={c.day ?? ''}>
                <span className="tx-dep__day" aria-hidden="true">{c.day ? c.day.slice(0, 3) : I.clock}</span>
                <div className="tx-dep__text">
                  <h3>
                    <a href={c.href} target="_blank" rel="noopener">
                      Rotary Club of {c.name}
                      <span className="tx-sr">{c.day ? `. Meets every ${c.day}` : ''}. {f.visit} (opens in a new tab)</span>
                    </a>
                  </h3>
                  {c.place && <p className="tx-dep__place">{I.pin}<span>{c.place}</span></p>}
                </div>
                <span className="tx-dep__go" aria-hidden="true">{I.arrow}</span>
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

/* ================= Club Projects (brick courses) / Club Service (a dated route) ================= */
const AV: Record<string, string> = {};
P.projects.avenues.forEach((a, i) => { AV[a.key] = col(i); });
const BENTO = ['var(--green)', 'var(--azure)', 'var(--cranberry)', 'var(--teal)'];

function ProjectCard({ p, i, line }: { p: Project; i: number; line: boolean }) {
  const L = P.projects.statLabels;
  const date = shortDate(p.date);
  const [day, ...rest] = date.split(' ');
  return (
    <li className="tx-proj" data-item data-q={`${p.title} ${clubName(p.club)} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} style={css({ '--c': AV[p.avenue] ?? 'var(--azure)' })}>
      {line && <time className="tx-proj__stop" dateTime={p.date}><b>{day}</b><span>{rest.join(' ')}</span></time>}
      <div className="tx-proj__box" data-rv style={css({ '--d': line ? 0 : i % 3 })}>
        <article className="tx-proj__card">
          <figure className="tx-proj__photo">
            <span className="tx-proj__frame"><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></span>
            <span className="tx-proj__tag">{avenueLabel(p.avenue)}</span>
            {!line && <time className="tx-proj__when" dateTime={p.date}>{date}</time>}
          </figure>
          <div className="tx-proj__body">
            <p className="tx-proj__club">{clubName(p.club)}</p>
            <h3>{p.title}</h3>
            <p className="tx-proj__sum">{p.summary}</p>
            <dl className="tx-proj__nums">
              <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
              <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
              <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
            </dl>
          </div>
        </article>
      </div>
    </li>
  );
}

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const L = x.statLabels;
  const list = projectsOf(service ? 'club' : undefined);
  const t = totals(list);
  const stats = [
    { k: 'projects', label: L.projects, v: num(t.projects) },
    { k: 'beneficiaries', label: L.beneficiaries, v: num(t.beneficiaries) },
    { k: 'amount', label: L.amount, v: `₹${R.fmt.num(t.amount, 1)} L` },
    { k: 'hours', label: L.hours, v: num(t.hours) }
  ];
  const slot = service ? (
    <div className="tx-stotals tx-ccard" data-glow>
      {stats.map(s => <p key={s.k}><b data-count>{s.v}</b><span>{s.label}</span></p>)}
    </div>
  ) : (
    <ul className="tx-bento">
      {stats.map((s, i) => (
        <li key={s.k} className={`tx-ccard tx-bento__${s.k}`} style={css({ '--c': BENTO[i] })} data-glow={i === 0 ? '' : undefined}>
          <b data-count>{s.v}</b><span>{s.label}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div data-filter data-page-size={x.pageSize}>
      <Head k={service ? 'service' : 'projects'} slot={slot} tools={
        <div className="tx-head__tools"><Search label={x.searchLabel} />{service && <Count n={list.length} noun="projects" />}</div>
      } />
      <section className="tx-sec tx-sec--first">
        <div className="wrap">
          {!service && (
            <div className="tx-bar" data-rv>
              <div className="tx-chips" role="group" aria-label="Avenue of service" data-lenis-prevent>
                <Chip attr="avenue" v="" on>{x.allLabel}</Chip>
                {x.avenues.map(a => <Chip key={a.key} attr="avenue" v={a.key} c={AV[a.key]}><i className="dot" aria-hidden="true" />{a.label}</Chip>)}
              </div>
              <Count n={list.length} noun="projects" />
            </div>
          )}
          <ul className={service ? 'tx-line' : 'tx-bricks'}>
            {list.map((p, i) => <ProjectCard key={p.id} p={p} i={i} line={service} />)}
          </ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= District Calendar: the year line in the head, a month wall below ================= */
const TYPE_C: Record<CalEntry['type'], string> = { club: 'var(--azure)', district: 'var(--orange)', birthday: 'var(--cranberry)', anniversary: 'var(--teal)' };
const typeOf = (k: CalEntry['type']) => R.calendar.types.find(t => t.key === k)!;

const Ev = ({ e }: { e: CalEntry }) => {
  const sub = [e.club && clubName(e.club), e.venue].filter(Boolean).join(' · ');
  return (
    <li className="tx-ev" data-item data-type={e.type} style={css({ '--tc': TYPE_C[e.type] })}>
      <span className="tx-sr">{typeOf(e.type).label}: </span>
      <span className="tx-ev__top">{e.time && <time>{e.time}</time>}<b>{e.title}</b></span>
      {sub && <span className="tx-ev__sub">{sub}</span>}
    </li>
  );
};
const Greet = ({ e }: { e: CalEntry }) => {
  const sub = e.club ? clubName(e.club) : e.relation;
  return (
    <li className="tx-gr" data-item data-type={e.type} style={css({ '--tc': TYPE_C[e.type] })} title={sub || undefined}>
      <span className="tx-sr">{typeOf(e.type).label}: </span>
      <b>{e.name}</b>
      {sub && <span className="tx-gr__sub">{sub}</span>}
    </li>
  );
};

function Cell({ d, list }: { d: Date; list: CalEntry[] | null }) {
  const C = R.calendar;
  if (!list) return <div className="tx-cell is-out" aria-hidden="true"><p className="tx-cell__d"><b>{d.getDate()}</b></p></div>;
  const today = toISO(d) === C.today;
  const events = list.filter(e => e.type === 'club' || e.type === 'district');
  const greets = (['birthday', 'anniversary'] as const).map(k => ({ k, l: list.filter(e => e.type === k) })).filter(g => g.l.length);
  return (
    <div className={`tx-cell${list.length ? ' has' : ''}`} aria-current={today ? 'date' : undefined}>
      <p className="tx-cell__d">
        <b>{d.getDate()}</b><span>{weekdayName(d).slice(0, 3)}</span>
        {today && <em>{C.todayTag}</em>}
      </p>
      {list.length > 0 && (
        <ul className="tx-cell__list">
          {events.map((e, i) => <Ev key={`e${i}`} e={e} />)}
          {/* more than three greetings of a kind on one day fold into one chip that opens */}
          {greets.map(g => g.l.length > 3 ? (
            <li key={g.k} className="tx-gmore" data-f-group style={css({ '--tc': TYPE_C[g.k] })}>
              <details open={today}>
                <summary><b data-f-group-count>{g.l.length}</b> {typeOf(g.k).group}</summary>
                <ul>{g.l.map((e, i) => <Greet key={i} e={e} />)}</ul>
              </details>
            </li>
          ) : g.l.map((e, i) => <Greet key={`${g.k}${i}`} e={e} />))}
        </ul>
      )}
      {/* today stays marked on a day with nothing on (or with everything filtered out) */}
      {today && <p className="tx-cell__none">{C.emptyDay}</p>}
    </div>
  );
}

function Month({ m, open }: { m: ReturnType<typeof calMonths>[number]; open: boolean }) {
  const C = R.calendar;
  const days = monthEntries(m.date);
  const by = new Map(days.map(d => [d.iso, d.list]));
  const all = days.flatMap(d => d.list);
  const mo = m.date.getMonth();
  const cells = monthMatrix(m.date, C.weekStartsOn);
  const shown = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).filter(w => w.some(d => d.getMonth() === mo)).flat();
  return (
    <div className={`tx-mpanel${all.length ? '' : ' is-empty'}`} data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      {all.length > 0 && (
        <div className="tx-tools" data-rv>
          <div className="tx-chips" role="group" aria-label="Show" data-lenis-prevent>
            <Chip attr="type" v="" on>All<b>{num(all.length)}</b></Chip>
            {C.types.map(t => {
              const n = all.filter(e => e.type === t.key).length;
              return n ? <Chip key={t.key} attr="type" v={t.key} c={TYPE_C[t.key]}><i className="dot" aria-hidden="true" />{t.group}<b>{num(n)}</b></Chip> : null;
            })}
          </div>
          <Count n={all.length} noun="entries" />
        </div>
      )}
      <p className="tx-empty" data-f-empty hidden={all.length > 0}>{P.calendar.emptyMonth}</p>
      <div className="tx-wall" data-rv>
        {C.weekdays.map(w => <span key={w} className="tx-wd" aria-hidden="true">{w}</span>)}
        {shown.map(d => <Cell key={toISO(d)} d={d} list={d.getMonth() === mo ? by.get(toISO(d)) ?? [] : null} />)}
      </div>
    </div>
  );
}

function CalendarPage() {
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <div data-tabs>
      <Head k="calendar" below={
        <div className="tx-yline" role="tablist" aria-label={P.calendar.monthLabel}>
          {months.map(m => {
            const on = m.key === open;
            return (
              <button key={m.key} type="button" role="tab" className={`tx-ystop${on ? ' is-on is-now' : ''}${monthEntries(m.date).length ? ' has' : ''}`} data-tab={m.key} aria-selected={on} tabIndex={on ? 0 : -1} aria-label={m.label}>
                <i aria-hidden="true" /><b>{m.short}</b><small>{m.date.getFullYear()}</small>
              </button>
            );
          })}
        </div>
      } />
      <section className="tx-sec tx-sec--first">
        <div className="wrap">{months.map(m => <Month key={m.key} m={m} open={m.key === open} />)}</div>
      </section>
    </div>
  );
}

/* ================= Newsletters: the newest issue as a colour card, then a dated index ================= */
const NEWS_C = ['var(--orange)', 'var(--azure)', 'var(--cranberry)', 'var(--teal)', 'var(--violet)', 'var(--green)'];

function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const A = R.press.actions;
  const years = pressYears();
  return (
    <>
      <Head k="newsletters" slot={years.map(y => (
        <p key={y.year} className="tx-nyear tx-ccard" data-year={y.year} hidden={y.year !== year}><span>{N.yearLabel}</span><b>{y.year}</b></p>
      ))} />
      <section className="tx-sec tx-sec--first">
        <div className="wrap">
          {years.map(y => (
            <div key={y.year} className="tx-news" data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="tx-switch" role="tablist" aria-label="Newsletters" data-rv>
                <button type="button" role="tab" className="tx-tab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                <button type="button" role="tab" className="tx-tab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
              </div>
              <div className="tx-npanel" data-panel="club" role="tabpanel" data-filter data-page-size="12">
                {y.bulletins.length > 0 && (
                  <div className="tx-news__tools" data-rv style={css({ '--d': 1 })}><Search label={N.searchLabel} /><Count n={y.bulletins.length} noun="bulletins" /></div>
                )}
                {y.bulletins.length > 0 && (
                  <ul className="tx-issues">
                    {y.bulletins.map((b, i) => {
                      const [d, m, yy] = shortDate(b.date).split(' ');
                      return (
                        <li key={i} className="tx-issue" data-item data-q={`${b.title} ${b.club}`.toLowerCase()} data-glow style={css({ '--c': NEWS_C[i % NEWS_C.length] })}>
                          <time dateTime={b.date}><b>{d}</b><span>{m}</span><i>{yy}</i></time>
                          <div className="tx-issue__text"><p className="tx-issue__club">{clubName(b.club)}</p><h3>{b.title}</h3></div>
                          <div className="tx-issue__acts">
                            <a className="tx-act" href={b.pdf} target="_blank" rel="noopener" aria-label={`${A.preview}: ${b.title}`}>{A.preview}</a>
                            <a className="tx-act tx-act--line" href={b.pdf} download aria-label={`${A.download}: ${b.title}`}>{A.download}</a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="tx-empty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
                <More label="Show more" />
              </div>
              <div className="tx-npanel" data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="tx-letters">
                    {y.gml.map((g, i) => (
                      <li key={i} className="tx-letter tx-ccard">
                        <h3>{g.month}</h3>
                        <p className="tx-letter__who">{g.governor}</p>
                        <p className="tx-letter__date">{shortDate(g.date)}</p>
                        <div className="tx-letter__acts">
                          <a className="pbtn pbtn--solid" href={g.pdf} target="_blank" rel="noopener" aria-label={`${A.preview}: ${g.title}`}>{A.preview}</a>
                          <a className="pbtn" href={g.pdf} download aria-label={`${A.download}: ${g.title}`}>{A.download}</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="tx-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: the Governor's office stub joined to the form, then two routes ================= */
function Contact() {
  const c = P.contact;
  const d = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const finder = pageInfo('finder');
  return (
    <>
      <Head k="contact" />
      <section className="tx-sec tx-sec--first">
        <div className="wrap">
          <div className="tx-desk" data-rv>
            <div className="tx-office" data-glow>
              {dg?.photo && <img className="tx-office__face" src={dg.photo.src} alt={dg.photo.alt} width={dg.photo.w} height={dg.photo.h} loading="lazy" />}
              <h2>{c.office}</h2>
              {dg && <p>{dg.name}, {d.label}</p>}
              <div className="tx-office__lines">
                <a href={`mailto:${d.email}`}><span>{I.mail}</span>{d.email}</a>
                <a href={`tel:${d.tel}`}><span>{I.phone}</span>{d.phoneDisplay}</a>
              </div>
            </div>
            <form className="tx-form" data-demo-form>
              <h2 className="tx-h2">{c.title}</h2>
              <p className="tx-form__hours">{c.hours}</p>
              <div className="tx-form__grid">
                <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
                <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
                <label><span>{F.club}</span><input name="club" /></label>
                <label className="tx-form__wide"><span>{F.message}</span><textarea name="message" rows={4} required /></label>
              </div>
              <div className="tx-form__foot">
                <button type="submit" className="btn-go btn-go--solid">{F.send}</button>
                <p>{c.formNote}</p>
              </div>
              <p className="tx-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
            </form>
          </div>
          <div className="tx-routes" data-rv style={css({ '--d': 1 })}>
            <div className="tx-way tx-ccard" style={css({ '--c': 'var(--cranberry)' })}>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="pbtn pbtn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="tx-way tx-ccard" style={css({ '--c': 'var(--teal)' })}>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="pbtn pbtn--solid" href={finder.file}>{finder.title}</a>
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
  return <main id="main" ref={ref} className={`tx-main tx-main--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  /* inner pages scroll vertically at every width (the homepage runs sideways on desktop) */
  useEffect(() => { startSmoothScroll({ anchors: { offset: -80 }, allowNestedScroll: true }); }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  return (
    <ThemeCtx.Provider value={theme}>
      <TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
