import { Fragment, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, weekdayName, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, pressYears, AdminContent, type PageKey, type Project, projNo
} from '../../shared/inner';
import {
  D, clubProfile, projectDetail, eventDetail, dignitaryProfile, memberProfile, paras,
  clubHref, projectHref, eventHref, dignitaryHref, memberHref, memberId, clubIdOf, useDocTitle
} from '../../shared/detail';
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
  back: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M13 8H3M7 4 3 8l4 4" /></svg>,
  down: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="m4 6 4 4 4-4" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  person: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.6" /><path {...sw} d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>,
  focus: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><circle {...sw} cx="12" cy="12" r="4.5" /><circle {...sw} cx="12" cy="12" r="0.8" /></svg>,
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

/* page head: deep teal, the breadcrumb (Home / page) and the poster title; the page's own totals or
   control docked on the right. Detail pages pass the item's name as the title. */
type Crumb = { label: string; href: string };
function PageHead({ k, dock, center = false, title }: { k: PageKey; dock?: ReactNode; center?: boolean; title?: string }) {
  const name = title || pageInfo(k).title;
  return (
    <section className={`tp-head${center ? ' tp-head--center' : ''}`} id="top">
      <div className="wrap tp-head__in">
        <div className="tp-head__main" data-rv>
          <nav className="tp-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <h1 className="tp-h1">{name}</h1>
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
/* the live number, for screen readers only (the client asked for no visible count at the search) */
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="sr-only" aria-live="polite"><b data-f-count>{num(total)}</b> of {num(total)} {noun}</p>
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
/* the same look for a section of a detail page (an h2, a static number) */
const SecHead = ({ title, n }: { title: string; n?: number }) => (
  <header className="tp-gh"><h2>{title}</h2>{n != null && <span className="tp-gh__n">{num(n)}</span>}<Rule /></header>
);
/* snapshot panels on deep teal: label over a number that counts up; [label, value, accent] */
const Stats = ({ list, className = '' }: { list: [string, string, string][]; className?: string }) => (
  <dl className={`tp-stats ${className}`.trim()}>
    {list.map(([label, val, a]) => (
      <div key={label} style={v({ '--a': a })} data-glow><dt>{label}</dt><dd data-count data-w={val}>{val}</dd></div>
    ))}
  </dl>
);
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;
/* a document's two actions: Preview (new tab) and Download */
const Acts = ({ title, pdf, solid, line }: { title: string; pdf: string; solid: string; line: string }) => (
  <>
    <a className={`tp-btn ${solid}`} href={pdf} target="_blank" rel="noopener" aria-label={`${R.press.actions.preview}: ${title} (opens in a new tab)`}>{R.press.actions.preview}</a>
    <a className={`tp-btn ${line}`} href={pdf} download aria-label={`${R.press.actions.download}: ${title}`}>{R.press.actions.download}</a>
  </>
);
/* a person's avatar: the photo when there is one, initials when not */
const Face = ({ name, photo }: { name: string; photo?: Photo | null }) => (
  <span className="tp-ava" aria-hidden="true">{photo ? <img src={photo.src} alt="" width={photo.w} height={photo.h} loading="lazy" /> : initials(name)}</span>
);
const Paras = ({ text, empty }: { text: string; empty: string }) => {
  const list = paras(text);
  return list.length ? <div className="tp-text">{list.map((t, i) => <p key={i}>{t}</p>)}</div> : <Empty text={empty} hidden={false} filter={false} />;
};

/* ================= About: the title and the admin's one content field ================= */
function About() {
  return (
    <>
      <PageHead k="about" center />
      <section className="tp-about">
        <div className="wrap">
          <div className="tp-col" data-rv><AdminContent className="tp-prose" /></div>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee: every member a portrait card (the homepage's photo with a white card
   overlapping it); the Governor featured large inside the first committee. Each committee shows its first row,
   "Show all N" opens the rest (CSS only); searching or choosing a committee shows every match. ================= */
type Mem = ReturnType<typeof committee>[number]['members'][number];
const Avatar = ({ m }: { m: Mem }) => <Face name={m.name} photo={m.photo} />;
/* every member links to their own page: the name is the link and covers the card (one action) */
const ToMember = ({ m }: { m: Mem }) => <a className="tp-stretch" href={memberHref(m)}>{m.name}</a>;
const Band = ({ title, n, lead = false }: { title: string; n: number; lead?: boolean }) => (
  <header className={`tp-band${lead ? ' tp-band--lead' : ''}`}>
    <h2>{title}</h2><Rule /><span className="tp-band__n" data-f-group-count>{num(n)}</span>
  </header>
);
/* group: the card is a filter item of that committee; me: the member whose page this is (marked, not a link) */
const Card = ({ m, group, dg = false, me = false }: { m: Mem; group?: string; dg?: boolean; me?: boolean }) => (
  <li className={`tp-pc${dg ? ' tp-pc--dg' : ''}${me ? ' is-me' : ''}`} {...(group ? { 'data-item': '', 'data-q': m.q, 'data-group': group } : {})} {...(me ? { 'aria-current': 'true' as const } : {})}>
    <figure className="tp-pc__photo">
      {m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} {...(dg ? {} : { loading: 'lazy' as const })} /> : <span aria-hidden="true">{m.initials}</span>}
    </figure>
    <div className="tp-pc__card">
      <h3 className="tp-pc__name">{me ? m.name : <ToMember m={m} />}</h3>
      <p className="tp-pc__role">{m.role}</p>
      {m.club && <p className="tp-pc__club">{clubName(m.club)}</p>}
    </div>
  </li>
);
/* a long list shows its first rows; this CSS-only toggle opens the rest */
const ShowAll = ({ n, noun = '' }: { n: number; noun?: string }) => (
  <details className="tp-all">
    <summary><span className="tp-all__more">Show all {num(n)}{noun && ` ${noun}`}</span><span className="tp-all__less">Show fewer</span>{I.down}</summary>
  </details>
);
/* the box around a capped list: is-over-d / is-over-m say whether the toggle is needed on desktop / on a phone */
const capBox = (n: number, desk: number, phone: number) => `tp-capbox${n > desk ? ' is-over-d' : ''}${n > phone ? ' is-over-m' : ''}`;

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  return (
    <div className="tp-flt" data-filter>
      <PageHead k="committee" dock={<Find label={P.committee.searchLabel} deep />} />
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
            {groups.map((g, gi) => {
              const n = g.members.length;
              const lead = gi === 0;
              /* how many cards the first rows hold: desktop six a row (the Governor takes 2 x 2 of the first
                 committee's grid), tablets and phones four */
              const [desk, small] = lead ? [9, 5] : [6, 4];
              return (
                <section key={g.key} className={`tp-cmg ${lead ? 'tp-cmg--lead' : 'tp-cmg--rest'}${n > desk ? ' is-over-d' : ''}${n > small ? ' is-over-m' : ''}`} data-f-group data-rv>
                  <Band title={g.title} n={n} lead={lead} />
                  <div className="tp-cmg__box">
                    {n > small && <ShowAll n={n} />}
                    <ul className="tp-pcs">{g.members.map((m, i) => <Card key={i} m={m} group={g.key} dg={lead && i === 0} />)}</ul>
                  </div>
                </section>
              );
            })}
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
      <PageHead k="finder" dock={<Find label={f.searchLabel} deep />} />
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
                  {/* this year's president and their phone; the line keeps its height when either is missing */}
                  <p className="tp-club__pres">
                    {c.president && <span className="tp-club__who">{I.person}<span><span className="sr-only">President: </span>{c.president}</span></span>}
                    {c.phone && (c.tel
                      ? <a className="tp-club__tel" href={`tel:${c.tel}`}>{I.phone}<span>{c.phone}</span></a>
                      : <span className="tp-club__tel">{I.phone}<span>{c.phone}</span></span>)}
                  </p>
                </div>
                <a className="tp-tk__end" href={c.href} aria-label={`${f.visit}: Rotary Club of ${c.name}`}>
                  <span>{f.visit}</span>{I.go}
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

/* the card's main action: "Read more", whose hit area covers the whole card */
const ReadMore = ({ p }: { p: Project }) => (
  <a className="tp-btn tp-btn--solid tp-stretch" href={projectHref(p)} aria-label={`Read more: ${p.title}`}>Read more{I.go}</a>
);
/* the second, smaller control: Share (shared/inner.js opens the phone's share sheet or a menu beside it) */
const ShareBtn = ({ p }: { p: { id: number | string; title: string } }) => (
  <button type="button" className="tp-share" data-share data-share-url={projectHref(p)} data-share-title={p.title} aria-haspopup="menu" aria-expanded={false} aria-label={`Share: ${p.title}`}>{I.share}<span>Share</span></button>
);
/* a project photo opens full size (shared/inner.js lightbox); one data-lightbox value = one gallery */
const Zoom = ({ ph, group, lazy = true }: { ph: Photo; group: string; lazy?: boolean }) => (
  <a className="tp-zoom" href={ph.src} data-lightbox={group} data-caption={ph.alt}><img src={ph.src} alt={ph.alt} width={ph.w || undefined} height={ph.h || undefined} {...(lazy ? { loading: 'lazy' as const } : {})} /></a>
);

/* the number on the photo comes from a CSS counter over the visible cards: #1 is the latest project */
function ProjectCard({ p, no }: { p: Project; no?: string }) {
  const [day, mon, yr] = shortDate(p.date).split(' ');
  return (
    <li className="tp-pj" data-item data-q={q(p)} data-avenue={p.avenue}>
      <div className="tp-pj__in">
        <figure className="tp-pj__photo">
          {p.photo && <Zoom ph={p.photo} group={`p-${p.id}`} />}
          <span className="tp-pj__tag">{avenueLabel(p.avenue)}</span>
          <span className="tp-pj__no" aria-hidden="true" data-no={no} />
        </figure>
        <div className="tp-pj__body">
          <p className="tp-pj__meta">
            <time className="tp-pj__date" dateTime={p.date}><b>{day}</b> <span>{mon} {yr}</span></time>
            <span className="tp-pj__av">{avenueLabel(p.avenue)}</span>
          </p>
          <h3 className="tp-pj__title">{p.title}</h3>
          <p className="tp-pj__club">{clubName(p.club)}</p>
          <p className="tp-pj__sum">{p.summary}</p>
          <div className="tp-pj__acts"><ReadMore p={p} /><ShareBtn p={p} /></div>
        </div>
      </div>
    </li>
  );
}

const Spread = ({ p }: { p: Project }) => (
  <li className="tp-sp" data-item data-q={q(p)} data-avenue={p.avenue}>
    <figure className="tp-sp__photo" data-rv>{p.photo && <Zoom ph={p.photo} group={`p-${p.id}`} />}</figure>
    <div className="tp-sp__card" data-rv style={v({ '--i': 1 })}>
      <time className="tp-sp__date" dateTime={p.date}>{shortDate(p.date)}</time>
      <h3 className="tp-sp__title">{p.title}</h3>
      <p className="tp-sp__club">{clubName(p.club)}</p>
      <p className="tp-sp__sum">{p.summary}</p>
      <div className="tp-sp__acts"><ReadMore p={p} /><ShareBtn p={p} /></div>
      <Nums p={p} className="tp-sp__nums" />
    </div>
  </li>
);

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const list = [...projectsOf(service ? 'club' : undefined)].sort((a, b) => b.date.localeCompare(a.date));
  const t = totals(list);
  const L = x.statLabels;
  /* Club Service: the production counter strip, these labels in this order */
  const stats: [string, string, string][] = service ? [
    ['Projects', num(t.projects), '#5FD8E3'],
    ['Clubs Involved', num(new Set(list.map(p => p.club)).size), '#FFC44D'],
    ['Beneficiaries', num(t.beneficiaries), '#FF8FBC'],
    ['Volunteer Hours', num(t.hours), '#7CC4FF'],
    ['Amount Spent', lakh(t.amount), '#FFC44D']
  ] : [
    [L.projects, num(t.projects), '#5FD8E3'],
    [L.beneficiaries, num(t.beneficiaries), '#FF8FBC'],
    [L.amount, lakh(t.amount), '#FFC44D'],
    [L.hours, num(t.hours), '#7CC4FF']
  ];
  const months = new Map<string, Project[]>();
  const nos = new Map(list.map((p, i) => [p.id, projNo(i, list.length)]));     /* one countdown across the months */
  list.forEach(p => months.set(p.date.slice(0, 7), [...(months.get(p.date.slice(0, 7)) ?? []), p]));
  return (
    <div className="tp-flt" data-filter data-page-size={x.pageSize}>
      <PageHead k={service ? 'service' : 'projects'} dock={<>
        <Stats list={stats} className={service ? 'tp-stats--row' : ''} />
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
                      <ul className="tp-log__cards">{ps.map(p => <ProjectCard key={p.id} p={p} no={nos.get(p.id)} />)}</ul>
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
      <h4 className="tp-ev__title"><a className="tp-stretch" href={eventHref(e)}>{e.title}</a></h4>
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
  const years = pressYears();
  const acts = (title: string, pdf: string, solid: string, line: string) => <Acts title={title} pdf={pdf} solid={solid} line={line} />;
  return (
    <>
      <PageHead k="newsletters" />
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
                      <Find label={N.searchLabel}><span className="sr-only" aria-live="polite"><b data-f-count>{num(y.bulletins.length)}</b> of {num(y.bulletins.length)}</span></Find>
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

/* ================= Detail pages: one item each (shared/detail.tsx) =================
   Every one opens with a block that rides up over the head's wave edge, as the Contact office ticket does:
   the club's pass, the project's spread, the event's ticket, the dignitary's portrait, the member's card. */
const ROT = (name: string) => (name ? `Rotary Club of ${name}` : '');
const tel = (s: string) => s.replace(/[^\d+]/g, '');
const ratio = (ph: Photo, lo: number, hi: number) => String(+Math.min(hi, Math.max(lo, ph.w > 0 && ph.h > 0 ? ph.w / ph.h : 1.5)).toFixed(3));

/* photos in justified rows: every photo keeps its own shape, rows fill the width, six show before "Show all" */
const Gallery = ({ title, photos, group }: { title: string; photos: Photo[]; group: string }) => (
  <section className={`tp-dsec tp-gal${photos.length < 3 ? ' tp-gal--few' : ''}`} data-rv>
    <SecHead title={title} n={photos.length} />
    <div className="tp-gal__box">
      {photos.length > 6 && (
        <details className="tp-all">
          <summary><span className="tp-all__more">Show all {num(photos.length)} photos</span><span className="tp-all__less">Show fewer</span>{I.down}</summary>
        </details>
      )}
      <ul className="tp-gal__grid">
        {photos.map((ph, i) => (
          <li key={ph.src + i} style={v({ '--r': ratio(ph, 0.5, 3) })}><Zoom ph={ph} group={group} /></li>
        ))}
      </ul>
    </div>
  </section>
);

/* nothing found: a white card riding the wave with the message and the way back */
function NotFound({ k, text, back }: { k: PageKey; text: string; back: Crumb }) {
  return (
    <>
      <PageHead k={k} />
      <section className="tp-dt">
        <div className="wrap">
          <div className="tp-ride tp-nf" data-rv>
            <svg className="tp-empty__wave" viewBox="0 0 60 8" aria-hidden="true"><path d="M1 4c5-4 9-4 14.5 0s9 4 14.5 0 9-4 14.5 0 9 4 14.5 0" /></svg>
            <p>{text}</p>
            <a className="tp-btn tp-btn--solid" href={back.href}>{I.back}{back.label}</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---- Club profile: totals in the head; the club's pass (meeting day on the stub); its board; the roster; three tabs ---- */
function ClubPage() {
  const c = clubProfile();
  const name = c ? ROT(c.name) : '';
  useDocTitle(name);
  const finder = pageInfo('finder');
  if (!c) return <NotFound k="club" text={D.club.missing} back={{ label: D.club.back, href: finder.file }} />;
  const L = P.projects.statLabels;
  const g = c.glance;
  const day = (c.meeting.day || '').trim();
  const ct = c.contact ?? {};
  const nl = c.leaders.length;
  const nm = c.members.length;
  const projects = [...c.projects].sort((a, b) => b.date.localeCompare(a.date));
  const bulletins = [...c.bulletins].sort((a, b) => b.date.localeCompare(a.date));
  const events = [...c.events].sort((a, b) => a.date.localeCompare(b.date));
  const tabs = [
    { k: 'projects', label: D.club.tabs.projects, n: projects.length },
    { k: 'bulletins', label: D.club.tabs.bulletins, n: bulletins.length },
    { k: 'events', label: D.club.tabs.events, n: events.length }
  ];
  const fact = (label: string, value: ReactNode, cls?: string) => <div className={cls}><dt>{label}</dt><dd>{value}</dd></div>;
  return (
    <>
      <PageHead k="club" title={name} dock={<Stats className="tp-stats--row" list={[
        [D.club.members, num(g.members), '#5FD8E3'],
        [L.projects, num(g.projects), '#7CC4FF'],
        [L.beneficiaries, num(g.beneficiaries), '#FF8FBC'],
        [L.amount, lakh(g.amount), '#FFC44D'],
        [L.hours, num(g.hours), '#5FD8E3']
      ]} />} />
      <section className="tp-dt tp-cp">
        <div className="wrap">
          <section className="tp-ride tp-tk tp-pass" aria-labelledby="tp-pass-h" data-rv>
            <h2 id="tp-pass-h" className="sr-only">{D.club.details}</h2>
            <span className="tp-tk__stub">
              {day ? <><b>{day.slice(0, 3)}</b><small>{dayKey(day) || day}</small></> : <><b aria-hidden="true">—</b><span className="sr-only">Meeting day not listed</span></>}
            </span>
            <dl className="tp-pass__facts">
              {fact('Time', c.meeting.time || '—', 'tp-pass__time')}
              {fact('Meeting place', c.meeting.place ? <>{I.pin}<span>{c.meeting.place}</span></> : '—', 'tp-pass__place')}
              {c.details.map(f => <Fragment key={f.label}>{fact(f.label, f.value)}</Fragment>)}
              {ct.email && fact('Email', <a href={`mailto:${ct.email}`}>{ct.email}</a>)}
              {ct.phone && fact('Phone', <a href={`tel:${tel(ct.phone)}`}>{ct.phone}</a>)}
              {ct.web && fact('Website', <a href={/^https?:\/\//i.test(ct.web) ? ct.web : `https://${ct.web}`} target="_blank" rel="noopener">{ct.web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}</a>)}
            </dl>
          </section>

          {/* the board as the committee page's portrait cards: one row shows, "Show all N" opens the rest */}
          <section className={`tp-dsec tp-cmg tp-cmg--rest${nl > 6 ? ' is-over-d' : ''}${nl > 4 ? ' is-over-m' : ''}`} data-rv>
            <SecHead title={D.club.leadership} n={nl} />
            {nl ? (
              <div className="tp-cmg__box">
                {nl > 4 && <ShowAll n={nl} />}
                <ul className="tp-pcs tp-pcs--red">
                  {c.leaders.map((m, i) => (
                    <li key={i} className="tp-pc">
                      <figure className="tp-pc__photo">{m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" /> : <span aria-hidden="true">{initials(m.name)}</span>}</figure>
                      <div className="tp-pc__card"><h3 className="tp-pc__name">{m.name}</h3><p className="tp-pc__role">{m.role}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <Empty text={D.club.none.leaders} hidden={false} filter={false} />}
          </section>

          {/* the roster (up to 400+ live): search, then pages of D.club.pageSize with "Show more members" */}
          <section className="tp-dsec" data-filter data-page-size={D.club.pageSize} data-rv>
            <div className="tp-dsec__bar">
              <SecHead title={D.club.members} n={nm} />
              {nm > 0 && <Find label={D.club.searchLabel} />}
              {nm > 0 && <Count total={nm} noun="members" />}
            </div>
            {nm > 0 ? (
              <>
                <ul className="tp-mems tp-roll">
                  {c.members.map((m, i) => (
                    <li key={i} className="tp-mem" data-item data-q={`${m.name} ${m.role}`.toLowerCase()}>
                      <Face name={m.name} photo={m.photo} />
                      <div className="tp-mem__text"><h3>{m.name}</h3>{m.role && <p className="tp-mem__role">{m.role}</p>}</div>
                    </li>
                  ))}
                </ul>
                <Empty text={D.club.empty} />
                <More label={D.club.more} />
              </>
            ) : <Empty text="No members listed yet." hidden={false} filter={false} />}
          </section>

          <section className="tp-dsec tp-ctabs" data-tabs data-rv>
            <div className="tp-tabs" role="tablist" aria-label={name}>
              {tabs.map((t, i) => (
                <button key={t.k} type="button" role="tab" className={`tp-tab${i ? '' : ' is-on'}`} data-tab={t.k} aria-selected={i === 0} tabIndex={i ? -1 : 0}>{t.label}<b>{num(t.n)}</b></button>
              ))}
            </div>
            <div className="tp-ctabs__p" data-panel="projects" role="tabpanel" aria-label={D.club.tabs.projects}>
              {projects.length ? (
                <div className={capBox(projects.length, 6, 3)}>
                  {projects.length > 3 && <ShowAll n={projects.length} />}
                  <ul className="tp-cprj">{projects.map((p, i, a) => <ProjectCard key={p.id} p={p} no={projNo(i, a.length)} />)}</ul>
                </div>
              ) : <Empty text={D.club.none.projects} hidden={false} filter={false} />}
            </div>
            <div className="tp-ctabs__p" data-panel="bulletins" role="tabpanel" aria-label={D.club.tabs.bulletins} hidden>
              {bulletins.length ? (
                <div className={capBox(bulletins.length, 8, 5)}>
                  {bulletins.length > 5 && <ShowAll n={bulletins.length} />}
                  <ul className="tp-issues tp-issues--cap">
                    {bulletins.map((b, i) => (
                      <li key={b.title + i} className="tp-issue" style={v({ '--c': SPINES[i % SPINES.length] })}>
                        <time dateTime={b.date}>{shortDate(b.date)}</time>
                        <div><h3>{b.title}</h3></div>
                        <div className="tp-issue__acts"><Acts title={b.title} pdf={b.pdf} solid="tp-btn--solid" line="tp-btn--line" /></div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : <Empty text={D.club.none.bulletins} hidden={false} filter={false} />}
            </div>
            <div className="tp-ctabs__p" data-panel="events" role="tabpanel" aria-label={D.club.tabs.events} hidden>
              {events.length ? (
                <div className={capBox(events.length, 8, 4)}>
                  {events.length > 4 && <ShowAll n={events.length} />}
                  <ul className="tp-evts tp-evts--cap">
                    {events.map((e, i) => <Ticket key={i} e={e} stub={<><b>{parseISO(e.date).getDate()}</b><small>{shortDate(e.date).split(' ').slice(1).join(' ')}</small></>} />)}
                  </ul>
                </div>
              ) : <Empty text={D.club.none.events} hidden={false} filter={false} />}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

/* ---- Project: the Club Service spread (cover + overlapping card), the story beside its impact, then the photos ---- */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title);
  const list = pageInfo(p?.avenue === 'club' ? 'service' : 'projects');
  if (!p) return <NotFound k="project" text={D.project.missing} back={{ label: D.project.back, href: list.file }} />;
  const pics = (p.gallery?.length ? p.gallery : [p.photo]).filter((x): x is Photo => !!x && !!x.src);
  const [cover, ...rest] = pics;
  const L = P.projects.statLabels;
  const figs: [string, string, string][] = [
    [L.beneficiaries, num(p.beneficiaries), '#FF8FBC'],
    [L.amount, lakh(p.amount), '#FFC44D'],
    [L.hours, num(p.hours), '#7CC4FF']
  ];
  if (p.rotarians != null) figs.push(['Rotarians', num(p.rotarians), '#5FD8E3']);
  return (
    <>
      <PageHead k="project" title={p.title} />
      <section className="tp-dt tp-pd">
        <div className="wrap">
          <div className="tp-ride tp-pd__spread" data-rv>
            <figure className={`tp-pd__cover${cover ? '' : ' is-none'}`} style={cover ? v({ aspectRatio: ratio(cover, 1.25, 2) }) : undefined}>
              {cover ? <Zoom ph={cover} group={`p-${p.id}`} lazy={false} /> : <Rule />}
            </figure>
            <div className="tp-pd__card">
              <p className="tp-pd__meta"><time className="tp-pd__date" dateTime={p.date}>{shortDate(p.date)}</time><span>{avenueLabel(p.avenue)}</span></p>
              <ul className="tp-lines">
                {p.club && <li>{I.people}<span>{D.project.organiser} {p.clubId ? <a href={clubHref(p.clubId)}>{ROT(p.club)}</a> : <b>{ROT(p.club)}</b>}</span></li>}
                {p.location && <li>{I.pin}<span>{p.location}</span></li>}
                {p.focus && <li>{I.focus}<span>Area of focus: <b>{p.focus}</b></span></li>}
              </ul>
              <div className="tp-pd__acts"><ShareBtn p={p} /><a className="tp-link" href={list.file}>{I.back}{list.title}</a></div>
            </div>
          </div>
          <div className="tp-pd__row">
            <section className="tp-dsec" data-rv>
              <SecHead title={D.project.about} />
              <Paras text={p.description} empty="No description added yet." />
            </section>
            <aside className="tp-dsec tp-impact" aria-labelledby="tp-impact-h" data-rv style={v({ '--i': 1 })}>
              <h2 id="tp-impact-h">{D.project.figures}</h2>
              <Stats list={figs} className="tp-stats--pair" />
            </aside>
          </div>
          {rest.length > 0 && <Gallery title={D.project.gallery} photos={rest} group={`p-${p.id}`} />}
        </div>
      </section>
    </>
  );
}

/* ---- Event: the story on the left, the event's admission ticket on the right (date on the stub) ---- */
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title);
  const cal = pageInfo('calendar');
  if (!e) return <NotFound k="event" text={D.event.missing} back={{ label: D.event.back, href: cal.file }} />;
  const d = parseISO(e.date);
  const today = e.date === C.today;
  const ct = e.contact && (e.contact.name || e.contact.email || e.contact.phone) ? e.contact : null;
  return (
    <>
      <PageHead k="event" title={e.title} />
      <section className="tp-dt tp-evp">
        <div className="wrap tp-evp__in">
          <aside className={`tp-ride tp-adm tp-adm--${e.kind}${today ? ' is-today' : ''}`} aria-label={`${e.title}, ${longDate(d)}`} data-rv>
            <div className="tp-adm__stub">
              <time dateTime={e.date} {...(today ? { 'aria-current': 'date' as const } : {})}>
                <b>{d.getDate()}</b>
                <span className="tp-adm__when"><span className="tp-adm__wd">{weekdayName(d)}</span><span className="tp-adm__my">{monthLabel(d)}</span></span>
              </time>
              <span className="tp-adm__kind">{today && <span className="tp-tag">{C.todayTag}</span>}<span>{typeLabel(e.kind)}</span></span>
            </div>
            <ul className="tp-lines tp-adm__lines">
              {e.time && <li>{I.clock}<span><span className="sr-only">{D.event.when}: </span><b className="tp-adm__time">{e.time}</b></span></li>}
              {e.venue && <li>{I.pin}<span><span className="sr-only">{D.event.where}: </span>{e.venue}</span></li>}
              {e.club && <li>{I.people}<span>{D.event.organiser} {e.clubId ? <a href={clubHref(e.clubId)}>{ROT(e.club)}</a> : <b>{ROT(e.club)}</b>}</span></li>}
              {ct?.name && <li>{I.person}<span><span className="sr-only">{D.event.contact}: </span>{ct.name}</span></li>}
              {ct?.email && <li>{I.mail}<a href={`mailto:${ct.email}`}>{ct.email}</a></li>}
              {ct?.phone && <li>{I.phone}<a href={`tel:${tel(ct.phone)}`}>{ct.phone}</a></li>}
            </ul>
            {e.registration && <a className="tp-btn tp-btn--solid tp-adm__go" href={e.registration} target="_blank" rel="noopener">{D.event.register}{I.out}</a>}
          </aside>
          <div className="tp-evp__main">
            <section className="tp-dsec" data-rv>
              <SecHead title={D.event.about} />
              <Paras text={e.description} empty="No details added yet." />
            </section>
            {e.gallery.length > 0 && <Gallery title={D.project.gallery} photos={e.gallery} group={`e-${e.id}`} />}
            <a className="tp-btn tp-btn--line tp-back" href={cal.file}>{I.back}{D.event.back}</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---- Dignitary: the homepage's portrait with its overlapping card, the biography beside it, the other dignitary ---- */
function DignitaryPage() {
  const p = dignitaryProfile();
  useDocTitle(p?.name);
  if (!p) return <NotFound k="dignitary" text={D.dignitary.missing} back={{ label: D.dignitary.back, href: R.nav[0].href }} />;
  const otherKey = p.type === 'dg' ? 'president' : 'dg';
  const o = R.dignitaries.byYear[R.years.current]?.[otherKey];
  const ct = p.contact && (p.contact.email || p.contact.phone) ? p.contact : null;
  return (
    <>
      <PageHead k="dignitary" title={p.name} />
      <section className={`tp-dt tp-dig tp-dig--${p.type}`}>
        <div className="wrap tp-dig__grid">
          <figure className="tp-ride tp-dig__photo" data-rv>
            {p.photo ? <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} /> : <span aria-hidden="true">{initials(p.name)}</span>}
          </figure>
          <div className="tp-dig__card" data-rv style={v({ '--i': 1 })}>
            <p className="tp-dig__role">{p.role}</p>
            {p.term && <p className="tp-dig__term">{p.term}</p>}
            {p.facts.length > 0 && <dl className="tp-facts tp-dig__facts">{p.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
            {ct && (
              <div className="tp-dig__ct">
                {ct.email && <a href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>}
                {ct.phone && <a href={`tel:${tel(ct.phone)}`}>{I.phone}<span>{ct.phone}</span></a>}
              </div>
            )}
          </div>
          <section className="tp-dig__bio" data-rv>
            <SecHead title={D.dignitary.bio} />
            <Paras text={p.bio} empty={D.dignitary.missing} />
          </section>
          {o && (
            <a className={`tp-tk tp-other tp-other--${otherKey}`} href={dignitaryHref(otherKey)} data-rv>
              <span className="tp-tk__stub">{o.photo ? <img src={o.photo.src} alt="" width={o.photo.w} height={o.photo.h} loading="lazy" /> : <b>{initials(o.name)}</b>}</span>
              <span className="tp-tk__main"><span className="tp-other__name">{o.name}</span><span className="tp-other__role">{o.role}</span></span>
              <span className="tp-tk__end">{I.go}</span>
            </a>
          )}
        </div>
      </section>
    </>
  );
}

/* ---- Member: the committee page's portrait card, and the member's committee beside it (everyone links) ---- */
function MemberPage() {
  const m = memberProfile();
  useDocTitle(m?.name);
  const list = pageInfo('committee');
  if (!m) return <NotFound k="member" text={D.member.missing} back={{ label: D.member.back, href: list.file }} />;
  const groups = committee();
  const g = m.group ? groups.find(x => x.title === m.group) : undefined;
  const exec = !!g && g.key === groups[0]?.key;
  const clubId = clubIdOf(m.club);
  /* the committee, this member first (marked), so they are never behind "Show all" */
  const team = g ? [...g.members.filter(x => memberId(x) === m.id), ...g.members.filter(x => memberId(x) !== m.id)] : [];
  const n = team.length;
  return (
    <>
      <PageHead k="member" title={m.name} />
      <section className="tp-dt tp-mp">
        <div className="wrap tp-mp__in">
          <article className={`tp-ride tp-top tp-mp__me${exec ? '' : ' tp-mp__me--teal'}`} data-rv>
            <figure className="tp-top__photo">
              {m.photo ? <img src={m.photo.src} alt={m.photo.alt} width={m.photo.w} height={m.photo.h} /> : <span aria-hidden="true">{initials(m.name)}</span>}
            </figure>
            <div className="tp-top__card">
              {m.role && <p className="tp-top__role">{m.role}</p>}
              <ul className="tp-lines">
                {m.group && <li>{I.people}<span>{D.member.committee}: <b>{m.group}</b></span></li>}
                {m.club && <li>{I.pin}<span>{D.member.club}: {clubId ? <a href={clubHref(clubId)}>{ROT(m.club)}</a> : <b>{ROT(m.club)}</b>}</span></li>}
                {m.email && <li>{I.mail}<span><span className="sr-only">{D.member.email}: </span><a href={`mailto:${m.email}`}>{m.email}</a></span></li>}
              </ul>
            </div>
          </article>
          <div className="tp-mp__team" data-rv style={v({ '--i': 1 })}>
            {g && (
              <section className={`tp-cmg tp-cmg--rest${n > 6 ? ' is-over-d' : ''}${n > 4 ? ' is-over-m' : ''}`}>
                <Band title={g.title} n={n} lead={exec} />
                <div className="tp-cmg__box">
                  {n > 4 && <ShowAll n={n} />}
                  <ul className={`tp-pcs tp-pcs--three${exec ? ' tp-pcs--red' : ''}`}>
                    {team.map((x, i) => <Card key={i} m={x} me={memberId(x) === m.id} />)}
                  </ul>
                </div>
              </section>
            )}
            <a className="tp-btn tp-btn--line tp-back" href={list.file}>{I.back}{D.member.back}</a>
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
  contact: () => <Contact />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />,
  member: () => <MemberPage />
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
