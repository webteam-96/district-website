import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, monthMatrix, toISO, weekdayName, type Bulletin, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, pressYears, AdminContent, type PageKey, type Project, projNo
} from '../../shared/inner';
import {
  D, paras, clubHref, projectHref, eventHref, dignitaryHref, useDocTitle,
  clubProfile, projectDetail, eventDetail, dignitaryProfile
} from '../../shared/detail';
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
  phone: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  back: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M13 8H3M7 4 3 8l4 4" /></svg>,
  cal: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3.5" y="5" width="17" height="15.5" rx="3" /><path {...sw} d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  web: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17" /></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8.5" r="3.8" /><path {...sw} d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" /></svg>,
  share: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>,
  flag: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11" /></svg>,
  group: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>
};

/* the Rotary colours, in the order every list cycles through them */
const CYCLE = ['var(--azure)', 'var(--cranberry)', 'var(--teal)', 'var(--violet)', 'var(--orange)', 'var(--green)'];
const col = (i: number) => CYCLE[i % CYCLE.length];
const css = (o: Record<string, string | number>) => o as CSSProperties;
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;

/* a homepage section title: the last word in the page's pop colour (one word: all of it) */
const Title = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i < 0 ? <em>{text}</em> : <>{text.slice(0, i)} <em>{text.slice(i + 1)}</em></>;
};

/* ---------- page head: a short band on the page's pastel ground; the slot holds the page's control or figures.
   Page tops are the title and the breadcrumb only (client): no description line, and the route line has two
   stops, Home ━ ● page (a detail page names its item). `sub` is the item's own data under its name (a role). ---------- */
type Crumb = { label: string; href: string };
const crumb = (k: PageKey): Crumb => { const p = pageInfo(k); return { label: p.title, href: p.file }; };

function Head({ k, title, h1, sub, slot, tools, below }: { k: PageKey; title?: string; h1?: ReactNode; sub?: ReactNode; slot?: ReactNode; tools?: ReactNode; below?: ReactNode }) {
  const t = title ?? pageInfo(k).title;
  return (
    <section className="tx-head" id="top">
      <span className="tx-head__art" aria-hidden="true" />
      <div className="wrap tx-head__row">
        <div className="tx-head__text" data-rv>
          <nav className="tx-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-current="page">{t}</span>
          </nav>
          <h1 className="tx-head__title">{h1 ?? <Title text={t} />}</h1>
          {sub}
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
/* the live count is for screen readers only (client: no count in the search bar) */
const Count = ({ n, noun }: { n: number; noun: string }) => <p className="tx-sr" aria-live="polite"><b data-f-count>{num(n)}</b> {noun}</p>;
const Empty = ({ text }: { text: string }) => <p className="tx-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="tx-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
const Chip = ({ attr, v, on = false, c, children }: { attr: string; v: string; on?: boolean; c?: string; children: ReactNode }) => (
  <button type="button" className="tx-chip" data-f-chip={attr} data-v={v} aria-pressed={on ? 'true' : 'false'} style={c ? css({ '--tc': c }) : undefined}>{children}</button>
);

/* Share: system share sheet on phones, else a menu (WhatsApp, Facebook, X, LinkedIn, Copy link): shared/inner.js */
const ShareBtn = ({ url, title }: { url: string; title: string }) => (
  <button type="button" className="tx-share" data-share data-share-url={url} data-share-title={title} aria-haspopup="menu" aria-expanded="false" aria-label={`Share: ${title}`}>{I.share}<span>Share</span></button>
);

/* ================= About: the title, the breadcrumb and the admin's content on a sheet ================= */
function About() {
  return (
    <>
      <Head k="about" />
      <section className="tx-sec tx-about">
        <div className="wrap" data-rv><AdminContent className="tx-prose" /></div>
      </section>
    </>
  );
}

/* ================= District Committee: a line-map rail, the Governor's board, committees of portrait cards ================= */
type Member = ReturnType<typeof committee>[number]['members'][number];

/* a member as a portrait card: the photo leads; with no photo, the initials on the committee's colour */
const Card = ({ m, g }: { m: Member; g: string }) => (
  <li className="tx-card" data-item data-q={m.q} data-group={g}>
    <span className={`tx-card__photo${m.photo ? '' : ' is-ini'}`} aria-hidden="true">
      {m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" /> : <b>{m.initials || m.name.charAt(0)}</b>}
    </span>
    <h3>{m.name}</h3>
    {m.role && <p className="tx-card__role">{m.role}</p>}
    {m.club && <p className="tx-card__club">{clubName(m.club)}</p>}
  </li>
);
const PlatHead = ({ title, n }: { title: string; n: number }) => <h2 className="tx-plat__head"><span>{title}</span><b data-f-group-count>{n}</b></h2>;
/* each committee shows its first two rows; this CSS-only toggle opens the rest (no script: plain HTML too) */
const ShowAll = ({ n }: { n: number }) => (
  <details className="tx-all"><summary><span>Show all {num(n)}</span><span>Show fewer</span></summary></details>
);

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [first, ...rest] = groups;
  const lead = first?.members[0];
  return (
    <div data-filter>
      <Head k="committee" slot={<div className="tx-find"><Search label={P.committee.searchLabel} /><Count n={total} noun="members" /></div>} />
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
                  <div className="tx-plat tx-group" style={css({ '--gc': col(0) })}>
                    <PlatHead title={first.title} n={first.members.length} />
                    <ul className="tx-cards">{first.members.slice(1).map((m, j) => <Card key={j} m={m} g={first.key} />)}</ul>
                    <ShowAll n={first.members.length - 1} />
                  </div>
                )}
              </section>
            )}
            {rest.map((g, i) => (
              <section key={g.key} className="tx-plat tx-group" data-f-group data-rv style={css({ '--gc': col(i + 1) })}>
                <PlatHead title={g.title} n={g.members.length} />
                <ul className="tx-cards">{g.members.map((m, j) => <Card key={j} m={m} g={g.key} />)}</ul>
                <ShowAll n={g.members.length} />
              </section>
            ))}
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
          <Search label={f.searchLabel} />
          <Count n={list.length} noun="clubs" />
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
                    <a href={c.href}>
                      Rotary Club of {c.name}
                      <span className="tx-sr">{c.day ? `. Meets every ${c.day}` : ''}. {f.visit}</span>
                    </a>
                  </h3>
                  {/* this year's president and their phone; a field the data lacks is simply left out */}
                  {(c.president || c.phone) && (
                    <p className="tx-dep__pres">
                      {c.president && <span>{I.user}<span className="tx-sr">President: </span>{c.president}</span>}
                      {c.phone && (c.tel ? <a href={`tel:${c.tel}`}>{I.phone}{c.phone}</a> : <span>{I.phone}{c.phone}</span>)}
                    </p>
                  )}
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

/* One card, three formats chosen by CSS. Its main action is "Read more" (the link covers the card); the photo opens
   the lightbox and Share is the second, smaller control, both above that link.
   The number is a CSS counter over the cards on screen, so after a search, a chip or "Show more" they still run
   1, 2, 3 … and #1 is the newest shown. */
function ProjectCard({ p, i, line, no }: { p: Project; i: number; line: boolean; no?: string }) {
  const date = shortDate(p.date);
  const [day, ...rest] = date.split(' ');
  return (
    <li className="tx-proj" data-item data-q={`${p.title} ${clubName(p.club)} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} style={css({ '--c': AV[p.avenue] ?? 'var(--azure)' })}>
      {line && <time className="tx-proj__stop" dateTime={p.date}><b>{day}</b><span>{rest.join(' ')}</span></time>}
      <div className="tx-proj__box" data-rv style={css({ '--d': line ? 0 : i % 3 })}>
        <article className="tx-proj__card">
          <figure className="tx-proj__photo">
            <span className="tx-proj__frame"><a href={p.photo.src} data-lightbox={`p-${p.id}`} data-caption={p.photo.alt}><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></a></span>
          </figure>
          <div className="tx-proj__body">
            {/* the avenue and the date are the body's first line: nothing sits on the photo (Club Service shows neither: its date is the stop) */}
            {!line && <p className="tx-proj__meta"><span className="tx-proj__tag">{avenueLabel(p.avenue)}</span><time className="tx-proj__when" dateTime={p.date}>{date}</time></p>}
            <div className="tx-proj__top">
              <span className="tx-proj__no" aria-hidden="true" data-no={no} />
              <div><p className="tx-proj__club">{clubName(p.club)}</p><h3>{p.title}</h3></div>
            </div>
            <p className="tx-proj__sum">{p.summary}</p>
            <div className="tx-proj__acts">
              <a className="tx-proj__more" href={projectHref(p)}>Read more<span className="tx-sr">: {p.title}</span>{I.arrow}</a>
              <ShareBtn url={projectHref(p)} title={p.title} />
            </div>
          </div>
        </article>
      </div>
    </li>
  );
}

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const L = x.statLabels;
  /* newest first: #1 is the latest project */
  const list = [...projectsOf(service ? 'club' : undefined)].sort((a, b) => b.date.localeCompare(a.date));
  const t = totals(list);
  const stats = [
    { k: 'projects', label: L.projects, v: num(t.projects) },
    { k: 'beneficiaries', label: L.beneficiaries, v: num(t.beneficiaries) },
    { k: 'amount', label: L.amount, v: lakh(t.amount) },
    { k: 'hours', label: L.hours, v: num(t.hours) }
  ];
  /* Club Service: the production site's counter strip, its labels in its order */
  const strip = [
    { k: 'projects', label: 'Projects', v: num(t.projects) },
    { k: 'clubs', label: 'Clubs Involved', v: num(new Set(list.map(p => p.club)).size) },
    { k: 'beneficiaries', label: 'Beneficiaries', v: num(t.beneficiaries) },
    { k: 'hours', label: 'Volunteer Hours', v: num(t.hours) },
    { k: 'amount', label: 'Amount Spent', v: lakh(t.amount) }
  ];
  const slot = service ? null : (
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
                {x.avenues.filter(a => a.key !== 'club').map(a => <Chip key={a.key} attr="avenue" v={a.key} c={AV[a.key]}><i className="dot" aria-hidden="true" />{a.label}</Chip>)}
              </div>
              <Count n={list.length} noun="projects" />
            </div>
          )}
          <ul className={service ? 'tx-line' : 'tx-bricks'}>
            {list.map((p, i, a) => <ProjectCard key={p.id} p={p} i={i} line={service} no={projNo(i, a.length)} />)}
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
      <span className="tx-ev__top">{e.time && <time>{e.time}</time>}<b><a href={eventHref(e)}>{e.title}</a></b></span>
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

/* a text-only document row (no images: client rule): date tile, title, Preview + Download */
const Issue = ({ b, i }: { b: Bulletin; i: number }) => {
  const A = R.press.actions;
  const [d, m, yy] = shortDate(b.date).split(' ');
  return (
    <li className="tx-issue" data-item data-q={`${b.title} ${b.club}`.toLowerCase()} data-glow style={css({ '--c': NEWS_C[i % NEWS_C.length] })}>
      <time dateTime={b.date}><b>{d}</b><span>{m}</span><i>{yy}</i></time>
      <div className="tx-issue__text"><p className="tx-issue__club">{clubName(b.club)}</p><h3>{b.title}</h3></div>
      <div className="tx-issue__acts">
        <a className="tx-act" href={b.pdf} target="_blank" rel="noopener" aria-label={`${A.preview}: ${b.title}`}>{A.preview}</a>
        <a className="tx-act tx-act--line" href={b.pdf} download aria-label={`${A.download}: ${b.title}`}>{A.download}</a>
      </div>
    </li>
  );
};

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
                  <ul className="tx-issues">{y.bulletins.map((b, i) => <Issue key={i} b={b} i={i} />)}</ul>
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

/* ===================================================================================================
   DETAIL PAGES — one item each (shared/detail.tsx). The same head band with a three-stop route line,
   then the homepage's parts: the meeting as a departure row, figures as colour cards, white boards with
   a portrait or photo on a colour block, platforms (a coloured band over rows), and a ticket.
   =================================================================================================== */
const fullClub = (n: string) => `Rotary Club of ${n}`;
const ini = (name: string) => initials(name) || name.trim().charAt(0).toUpperCase();
const MON = (d: Date) => monthLabel(d).slice(0, 3);
/* photos keep a sane shape: between 4:3 and 16:9, so a portrait is never cut to a sliver */
const shape = (ph: Photo) => String(Math.min(16 / 9, Math.max(4 / 3, ph.w / ph.h || 1.5)));
const telOf = (s: string) => s.replace(/[^\d+]/g, '');
const webOf = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);
/* a fact's icon: a calendar for dates, people for clubs, a flag for the rest */
const factIcon = (label: string) => (/charter|found|since|year|date|born|joined/i.test(label) ? I.cal : /club/i.test(label) ? I.group : I.flag);

/* a person in a platform: photo or initials, name, role */
const Person = ({ name, sub, photo, q }: { name: string; sub?: string; photo?: Photo | null; q?: string }) => (
  <li className="tx-row" {...(q !== undefined ? { 'data-item': '', 'data-q': q } : {})}>
    <span className="tx-av" aria-hidden="true">{photo ? <img src={photo.src} alt="" width={photo.w} height={photo.h} loading="lazy" /> : ini(name)}</span>
    <div className="tx-row__text"><h3>{name}</h3>{sub && <p>{sub}</p>}</div>
  </li>
);

/* label + value rows with an icon disc; a value may be a link */
type Fact = { label: string; value: string; href?: string; icon?: ReactNode; ext?: boolean };
const FactList = ({ list }: { list: Fact[] }) => (
  <dl className="tx-dl">
    {list.map(f => (
      <div key={f.label + f.value}>
        <dt><span className="tx-dl__ic" aria-hidden="true">{f.icon ?? I.pin}</span>{f.label}</dt>
        <dd>{f.href ? <a href={f.href} {...(f.ext ? { target: '_blank', rel: 'noopener' } : {})}>{f.value}</a> : f.value}</dd>
      </div>
    ))}
  </dl>
);
const Facts = ({ list, title, c }: { list: Fact[]; title: string; c?: string }) => (
  <section className="tx-plat tx-facts" data-rv style={c ? css({ '--gc': c }) : undefined}>
    <h2 className="tx-plat__head"><span>{title}</span></h2>
    <FactList list={list} />
  </section>
);

/* the item's own photos after the cover: natural shapes in columns (nothing cropped), nine at a time; each opens the lightbox */
const Gallery = ({ list, group, max = 3 }: { list: Photo[]; group: string; max?: number }) => {
  /* columns by count: four photos in three columns would balance 2 + 2 + 0 and leave one empty */
  const n = list.length;
  return (
    <div className="tx-galbox" data-filter data-page-size="9">
      <ul className={`tx-gal${n === 1 ? ' tx-gal--one' : ''}`} style={css({ '--cols': Math.min(max, n === 4 ? 2 : n) })} data-rv>
        {list.map((ph, i) => (
          <li key={i} data-item>
            <a href={ph.src} data-lightbox={group} data-caption={ph.alt}><img src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} loading="lazy" /></a>
          </li>
        ))}
      </ul>
      <More label="Show more" />
    </div>
  );
};

const Back = ({ to, label }: { to: string; label: string }) => (
  <div className="wrap tx-backrow"><a className="tx-back" href={to}>{I.back}<span>{label}</span></a></div>
);

/* the id matches nothing: the empty route, the words from the data and the way back */
function Missing({ k, text, to, label }: { k: PageKey; text: string; to: string; label: string }) {
  return (
    <>
      <Head k={k} />
      <section className="tx-sec tx-sec--first">
        <div className="wrap" data-rv>
          <div className="tx-empty tx-missing"><p>{text}</p><a className="btn-go" href={to}>{I.back}{label}</a></div>
        </div>
      </section>
    </>
  );
}

/* ================= Club profile: the meeting as a departure, figures in the head, platforms, then tabs ================= */
const EvRow = ({ e }: { e: CalEntry }) => {
  const d = parseISO(e.date);
  const sub = [e.time, e.venue].filter(Boolean).join(' · ');
  return (
    <li className="tx-dep tx-dep--ev" data-item style={css({ '--dc': TYPE_C[e.type] })}>
      <time className="tx-dep__day tx-dep__date" dateTime={e.date}><b>{d.getDate()}</b><span>{MON(d)}</span></time>
      <div className="tx-dep__text">
        <h3><a href={eventHref(e)}>{e.title}</a></h3>
        {sub && <p className="tx-dep__place">{I.clock}<span>{sub}</span></p>}
      </div>
      <span className="tx-dep__go" aria-hidden="true">{I.arrow}</span>
    </li>
  );
};

function ClubPage() {
  const c = clubProfile();
  const name = c ? fullClub(c.name) : '';
  useDocTitle(name || null);
  const back = crumb('finder');
  if (!c) return <Missing k="club" text={D.club.missing} to={back.href} label={D.club.back} />;
  const L = P.projects.statLabels;
  const T = D.club.tabs, N = D.club.none;
  const m = c.meeting;
  const g = c.glance;
  const glance = [
    { k: 'members', label: D.club.members, v: num(g.members), c: 'var(--orange)' },
    { k: 'projects', label: L.projects, v: num(g.projects), c: 'var(--green)' },
    { k: 'beneficiaries', label: L.beneficiaries, v: num(g.beneficiaries), c: 'var(--azure)' },
    { k: 'amount', label: L.amount, v: lakh(g.amount), c: 'var(--cranberry)' },
    { k: 'hours', label: L.hours, v: num(g.hours), c: 'var(--teal)' }
  ];
  const ct = c.contact ?? {};
  const facts: Fact[] = [
    ...c.details.map(f => ({ label: f.label, value: f.value, icon: factIcon(f.label) })),
    ...(ct.email ? [{ label: P.email, value: ct.email, href: `mailto:${ct.email}`, icon: I.mail }] : []),
    ...(ct.phone ? [{ label: 'Phone', value: ct.phone, href: `tel:${telOf(ct.phone)}`, icon: I.phone }] : []),
    ...(ct.web ? [{ label: 'Website', value: ct.web.replace(/^https?:\/\//i, '').replace(/\/$/, ''), href: webOf(ct.web), icon: I.web, ext: true }] : [])
  ];
  const tabs = [
    { k: 'projects', label: T.projects, n: c.projects.length },
    { k: 'bulletins', label: T.bulletins, n: c.bulletins.length },
    { k: 'events', label: T.events, n: c.events.length }
  ];
  const meets = m.day || m.time || m.place;
  return (
    <>
      <Head k="club" title={name} h1={<>Rotary Club of <em>{c.name}</em></>}
        tools={meets ? (
          <p className="tx-meet" data-day={m.day}>
            <span className="tx-meet__day" aria-hidden="true">{m.day ? m.day.slice(0, 3) : I.clock}</span>
            <span className="tx-meet__text">
              <b>{[m.day && `Meets every ${m.day}`, m.time].filter(Boolean).join(' · ')}</b>
              {m.place && <span>{I.pin}{m.place}</span>}
            </span>
          </p>
        ) : null}
        slot={
          <ul className="tx-bento tx-bento--club" aria-label={D.club.glance}>
            {glance.map(s => <li key={s.k} className={`tx-ccard tx-bento__${s.k}`} style={css({ '--c': s.c })} data-glow={s.k === 'members' ? '' : undefined}><b data-count>{s.v}</b><span>{s.label}</span></li>)}
          </ul>
        } />
      <section className="tx-sec tx-sec--first">
        <div className="wrap tx-club">
          {facts.length > 0 && <Facts list={facts} title={D.club.details} c="var(--orange)" />}
          <section className="tx-plat tx-leaders" data-rv style={css({ '--gc': 'var(--azure)', '--d': 1 })}>
            <h2 className="tx-plat__head"><span>{D.club.leadership}</span>{c.leaders.length > 0 && <b>{num(c.leaders.length)}</b>}</h2>
            {c.leaders.length
              ? <ul className="tx-rows">{c.leaders.map((l, i) => <Person key={i} name={l.name} sub={l.role} photo={l.photo} />)}</ul>
              : <p className="tx-none">{N.leaders}</p>}
          </section>
          {c.members.length > 0 && (
            <section className="tx-plat tx-roll" data-filter data-page-size={D.club.pageSize} data-rv style={css({ '--gc': 'var(--teal)', '--d': 1 })}>
              <h2 className="tx-plat__head"><span>{D.club.members}</span><b data-f-count>{num(c.members.length)}</b></h2>
              <div className="tx-roll__tools"><Search label={D.club.searchLabel} /></div>
              <ul className="tx-rows tx-roll__list">{c.members.map((p, i) => <Person key={i} name={p.name} sub={p.role} photo={p.photo} q={`${p.name} ${p.role}`.toLowerCase()} />)}</ul>
              <Empty text={D.club.empty} />
              <More label={D.club.more} />
            </section>
          )}
        </div>
      </section>
      <section className="tx-sec tx-sec--tabs">
        <div className="wrap" data-tabs>
          <div className="tx-switch tx-switch--3" role="tablist" aria-label={name} data-rv>
            {tabs.map((t, i) => (
              <button key={t.k} type="button" role="tab" className={`tx-tab${i ? '' : ' is-on'}`} data-tab={t.k} aria-selected={i === 0} tabIndex={i ? -1 : 0}>{t.label}<b>{num(t.n)}</b></button>
            ))}
          </div>
          <div className="tx-cpanel" data-panel="projects" role="tabpanel" data-filter data-page-size="6">
            {c.projects.length
              ? <><ul className="tx-bricks">{c.projects.map((p, i, a) => <ProjectCard key={p.id} p={p} i={i} line={false} no={projNo(i, a.length)} />)}</ul><More label={P.projects.more} /></>
              : <p className="tx-empty">{N.projects}</p>}
          </div>
          <div className="tx-cpanel" data-panel="bulletins" role="tabpanel" hidden data-filter data-page-size="8">
            {c.bulletins.length
              ? <><ul className="tx-docs">{c.bulletins.map((b, i) => <Issue key={i} b={b} i={i} />)}</ul><More label="Show more" /></>
              : <p className="tx-empty">{N.bulletins}</p>}
          </div>
          <div className="tx-cpanel" data-panel="events" role="tabpanel" hidden data-filter data-page-size="8">
            {c.events.length
              ? <><ul className="tx-deps">{c.events.map((e, i) => <EvRow key={i} e={e} />)}</ul><More label="Show more" /></>
              : <p className="tx-empty">{N.events}</p>}
          </div>
        </div>
      </section>
      <Back to={back.href} label={D.club.back} />
    </>
  );
}

/* ================= Project: impact in the head, the cover on its colour block beside the story, then the photos ================= */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title ?? null);
  const list = crumb(p?.avenue === 'club' ? 'service' : 'projects');
  if (!p) return <Missing k="project" text={D.project.missing} to={list.href} label={D.project.back} />;
  const L = P.projects.statLabels;
  const [cover, ...rest] = p.gallery;
  const figs = [
    { k: 'beneficiaries', label: L.beneficiaries, v: num(p.beneficiaries) },
    { k: 'amount', label: L.amount, v: lakh(p.amount) },
    { k: 'hours', label: L.hours, v: num(p.hours) },
    ...(p.rotarians != null ? [{ k: 'rotarians', label: 'Rotarians', v: num(p.rotarians) }] : [])
  ];
  const text = paras(p.description);
  const org = p.club ? fullClub(p.club) : '';
  return (
    <div className="tx-pj" style={css({ '--c': AV[p.avenue] ?? 'var(--green)' })}>
      <Head k="project" title={p.title}
        tools={
          <div className="tx-pj__tools">
            <ul className="tx-meta">
              <li className="tx-meta__tag">{avenueLabel(p.avenue)}</li>
              <li>{I.cal}<time dateTime={p.date}>{shortDate(p.date)}</time></li>
              {p.location && <li>{I.pin}<span>{p.location}</span></li>}
              {p.focus && <li>{I.group}<span>{p.focus}</span></li>}
            </ul>
            <ShareBtn url={projectHref(p)} title={p.title} />
          </div>
        }
        slot={p.avenue === 'club' ? undefined : (
          <div className="tx-stotals tx-figs tx-ccard" data-glow aria-label={D.project.figures} style={css({ '--n': figs.length })}>
            {figs.map(s => <p key={s.k}><b data-count>{s.v}</b><span>{s.label}</span></p>)}
          </div>
          )} />
      <section className="tx-sec tx-sec--first">
        <div className={`wrap tx-story${cover ? '' : ' tx-story--text'}`}>
          {cover && (
            <figure className="tx-cover tx-board" data-rv>
              <span className="tx-cover__frame" style={css({ aspectRatio: shape(cover) })}><a href={cover.src} data-lightbox={`p-${p.id}`} data-caption={cover.alt}><img src={cover.src} alt={cover.alt} width={cover.w} height={cover.h} /></a></span>
              {cover.alt && <figcaption>{cover.alt}</figcaption>}
            </figure>
          )}
          <div className="tx-story__text" data-rv style={css({ '--d': 1 })}>
            {text.length > 0 && <h2 className="tx-h2">{D.project.about}</h2>}
            {text.length > 0 && <div className="tx-text">{text.map((t, i) => <p key={i}>{t}</p>)}</div>}
            {org && (
              <div className="tx-org">
                <span className="tx-org__ic" aria-hidden="true">{ini(org.replace(/^Rotary Club of /, ''))}</span>
                <p><span>{D.project.organiser}</span>{p.clubId ? <a href={clubHref(p.clubId)}>{org}</a> : <b>{org}</b>}</p>
                {p.clubId && <span className="tx-dep__go" aria-hidden="true">{I.arrow}</span>}
              </div>
            )}
          </div>
        </div>
      </section>
      {rest.length > 0 && (
        <section className="tx-sec tx-sec--more">
          <div className="wrap">
            <h2 className="tx-h2 tx-sec__title" data-rv>{D.project.gallery}</h2>
            <Gallery list={rest} group={`p-${p.id}`} />
          </div>
        </section>
      )}
      <Back to={list.href} label={D.project.back} />
    </div>
  );
}

/* ================= Event: the day as the homepage's big date card, the story beside a ticket ================= */
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title ?? null);
  const cal = crumb('calendar');
  if (!e) return <Missing k="event" text={D.event.missing} to={cal.href} label={D.event.back} />;
  const C = R.calendar;
  const d = parseISO(e.date);
  const today = e.date === C.today;
  const kind = C.types.find(t => t.key === e.kind);
  const org = e.club ? fullClub(e.club) : e.kind === 'district' ? R.site.name : '';
  const text = paras(e.description);
  /* with photos the story runs beside the ticket; without, the words sit above a wide ticket (no empty column) */
  const story = e.gallery.length > 0;
  const ct = e.contact ?? {};
  const facts: Fact[] = [
    { label: D.event.when, value: [longDate(d), e.time].filter(Boolean).join(' · '), icon: I.cal },
    ...(e.venue ? [{ label: D.event.where, value: e.venue, icon: I.pin }] : []),
    ...(org ? [{ label: D.event.organiser, value: org, href: e.clubId ? clubHref(e.clubId) : undefined, icon: I.group }] : []),
    ...(ct.name ? [{ label: D.event.contact, value: ct.name, icon: I.user }] : []),
    ...(ct.email ? [{ label: P.email, value: ct.email, href: `mailto:${ct.email}`, icon: I.mail }] : []),
    ...(ct.phone ? [{ label: 'Phone', value: ct.phone, href: `tel:${telOf(ct.phone)}`, icon: I.phone }] : [])
  ];
  return (
    <>
      <Head k="event" title={e.title}
        tools={kind && <ul className="tx-meta"><li className="tx-meta__tag" style={css({ '--c': TYPE_C[e.kind] })}>{kind.label}</li></ul>}
        slot={
          <p className="tx-when tx-ccard" data-glow>
            <time dateTime={e.date}><b>{d.getDate()}</b><span className="tx-when__wd">{weekdayName(d)}</span><span>{monthLabel(d)}</span></time>
            {(e.time || today) && <span className="tx-when__tags">{e.time && <span className="tx-when__time">{I.clock}{e.time}</span>}{today && <em className="tag-today">{C.todayTag}</em>}</span>}
          </p>
        } />
      <section className="tx-sec tx-sec--first">
        <div className={`wrap tx-evt${story ? '' : ' tx-evt--wide'}`}>
          {(story || text.length > 0) && (
            <div className="tx-evt__story" data-rv>
              {text.length > 0 && <><h2 className="tx-h2">{D.event.about}</h2><div className="tx-text">{text.map((t, i) => <p key={i}>{t}</p>)}</div></>}
              {story && <Gallery list={e.gallery} group={`e-${e.id}`} max={2} />}
            </div>
          )}
          <aside className="tx-ticket tx-board" data-rv style={css({ '--d': 1 })} aria-label={e.title}>
            <FactList list={facts} />
            {e.registration && <div className="tx-ticket__stub"><a className="btn-go btn-go--solid" href={webOf(e.registration)} target="_blank" rel="noopener">{D.event.register}{I.arrow}</a></div>}
          </aside>
        </div>
      </section>
      <Back to={cal.href} label={D.event.back} />
    </>
  );
}

/* ================= RI President / District Governor: the homepage board's portrait, the biography, the other one ================= */
const PhotoBox = ({ name, photo }: { name: string; photo: Photo | null }) => (
  <div className="tx-feature__photo">
    <div className="tx-feature__frame">
      {photo ? <img src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} /> : <span className="tx-feature__ini" aria-hidden="true">{ini(name)}</span>}
    </div>
  </div>
);
const Portrait = ({ name, photo }: { name: string; photo: Photo | null }) => (
  <div className="tx-portrait tx-board" data-rv><PhotoBox name={name} photo={photo} /></div>
);

function DignitaryPage() {
  const d = dignitaryProfile();
  useDocTitle(d?.name ?? null);
  const home = { label: P.home, href: R.nav[0].href };
  if (!d) return <Missing k="dignitary" text={D.dignitary.missing} to={home.href} label={D.dignitary.back} />;
  const ot = d.type === 'dg' ? 'president' : 'dg';
  const o = D.dignitary.item?.[ot] ?? R.dignitaries.byYear[R.years.current]?.[ot];
  const text = paras(d.bio);
  const ct = d.contact ?? {};
  const lines: Fact[] = [
    ...(ct.email ? [{ label: P.email, value: ct.email, href: `mailto:${ct.email}`, icon: I.mail }] : []),
    ...(ct.phone ? [{ label: 'Phone', value: ct.phone, href: `tel:${telOf(ct.phone)}`, icon: I.phone }] : [])
  ];
  return (
    <div className={`tx-dig tx-dig--${d.type}`}>
      <Head k="dignitary" title={d.name} sub={<p className="tx-head__lead tx-role"><b>{d.role}</b>{d.term && <span>{d.term}</span>}</p>} />
      <section className="tx-sec tx-sec--first">
        {/* the portrait alone on the left (it stays in view beside a long biography); everything said about them on the right,
            so a one-line biography still makes a full column */}
        <div className="wrap tx-bio">
          <Portrait name={d.name} photo={d.photo} />
          <div className="tx-bio__main" data-rv style={css({ '--d': 1 })}>
            {text.length > 0 && <><h2 className="tx-h2">{D.dignitary.bio}</h2><div className="tx-text tx-text--lede">{text.map((t, i) => <p key={i}>{t}</p>)}</div></>}
            {lines.length > 0 && (
              <div className="tx-lines">
                {lines.map(l => <a key={l.label} href={l.href}><span aria-hidden="true">{l.icon}</span><span className="tx-sr">{l.label}: </span>{l.value}</a>)}
              </div>
            )}
            {d.facts.length > 0 && <Facts list={d.facts.map(f => ({ label: f.label, value: f.value, icon: factIcon(f.label) }))} title={D.dignitary.details} c="var(--c)" />}
            {o && (
              <div className={`tx-other tx-other--${ot}`}>
                <span className="tx-other__face" aria-hidden="true">{o.photo ? <img src={o.photo.src} alt="" width={o.photo.w} height={o.photo.h} loading="lazy" /> : ini(o.name)}</span>
                <p><span>{o.role}</span><a href={dignitaryHref(ot)}>{o.name}</a></p>
                <span className="tx-dep__go" aria-hidden="true">{I.arrow}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
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
  contact: () => <Contact />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />
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
