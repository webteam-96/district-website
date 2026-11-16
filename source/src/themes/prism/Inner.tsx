import { Fragment, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, toISO, weekdayName, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, entriesByDate, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import {
  D, paras, memberId, clubHref, clubIdOf, projectHref, eventHref, dignitaryHref, memberHref, useDocTitle,
  clubProfile, projectDetail, eventDetail, dignitaryProfile, memberProfile
} from '../../shared/detail';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* PRISM inner pages (v2). Every page head is the homepage's split hero at a third of its height:
   title on the tinted band, the Rotary-blue dotted panel bleeding right with the page's key figure
   or control. Bodies are plain markup + data attributes (shared/inner.js), so the static HTML
   version is the same page. */

const ACC = ['#0067C8', '#00A2E0', '#D41367', '#00ADBB', '#F7A81B'];
const AVENUE: Record<string, string> = { club: '#0067C8', community: '#00ADBB', vocational: '#F7A81B', international: '#00A2E0', youth: '#D41367', image: '#8a5a00' };
const css = (o: Record<string, string | number>) => o as CSSProperties;

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  next: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M3 8h10M9 4l4 4-4 4" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.8" /><path {...sw} d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>,
  people: <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8" r="3.5" /><path {...sw} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2a6.5 6.5 0 0 1 3 5.8" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  join: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="10" cy="8" r="3.5" /><path {...sw} d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></svg>,
  pin: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  check: <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} strokeWidth={2.4} d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3.5" y="5" width="17" height="15.5" rx="3" /><path {...sw} d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  globe: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5z" /></svg>,
  club: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M4 10.5 12 4l8 6.5V20H4z" /><path {...sw} d="M9.5 20v-5h5v5" /></svg>,
  tag: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" /><circle {...sw} cx="8.5" cy="8.5" r="1.6" /></svg>,
  photo: <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><circle {...sw} cx="9" cy="10" r="1.8" /><path {...sw} d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></svg>,
  back: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M13 8H3M7 4 3 8l4 4" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
};

/* Share (shared/inner.js: the phone's share sheet, else a menu of WhatsApp, Facebook, X, LinkedIn, Copy link).
   On cards it is a round icon beside "Read more"; `label` shows the word too (the project page). */
const Share = ({ p, label = false }: { p: { id: number | string; title: string }; label?: boolean }) => (
  <button type="button" className={label ? 'px-share px-share--label' : 'px-share'} data-share data-share-url={projectHref(p)} data-share-title={p.title}
    aria-haspopup="menu" aria-expanded="false" aria-label={`Share: ${p.title}`}>{I.share}<span>Share</span></button>
);
/* a photo that opens full size in the shared lightbox; one `group` = one gallery (prev/next) */
const Zoom = ({ ph, group, className, children }: { ph: Photo; group: string; className?: string; children: ReactNode }) => (
  <a className={className} href={ph.src} data-lightbox={group} data-caption={ph.alt}>{children}</a>
);

/* the last word in the homepage's spectrum gradient (.stitle__hl) */
const HL = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i > 0 ? <>{text.slice(0, i)} <span className="px-hl">{text.slice(i + 1)}</span></> : <span className="px-hl">{text}</span>;
};

/* always two levels: Home / the page (on a detail page: Home / the item) */
const Crumbs = ({ title }: { title: string }) => (
  <nav className="px-crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{title}</span>
  </nav>
);

/* ---------- page head: tinted band with the breadcrumb and the title only, the blue panel right (bleeds to the
   screen edge). Detail pages pass the item's name as the title; `wide` gives the panel the larger share. ---------- */
function PageHead({ k, children, keyClass = '', title, wide = false }: { k: PageKey; children: ReactNode; keyClass?: string; title?: string; wide?: boolean }) {
  const t = title ?? pageInfo(k).title;
  return (
    <section className={wide ? 'px-head px-head--wide' : 'px-head'} id="top">
      <div className="wrap px-head__in">
        <div className="px-head__text" data-rv>
          <Crumbs title={t} />
          <h1 className={title ? 'px-head__title px-head__title--item' : 'px-head__title'}><HL text={t} /></h1>
        </div>
        <div className={`px-head__key ${keyClass}`.trim()} data-glow data-rv>{children}</div>
      </div>
    </section>
  );
}

/* ---------- shared parts ---------- */
const Search = ({ label, count, hero = false }: { label: string; count?: number; hero?: boolean }) => (
  <label className={hero ? 'px-search px-search--hero' : 'px-search'}>
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
    {/* the live count is for screen readers only (client: no count inside the search bar) */}
    {count != null && <span className="sr-only" aria-live="polite"><b data-f-count>{num(count)}</b> shown</span>}
  </label>
);

interface ChipItem { v: string; label: string; n?: number; color?: string; cls?: string }
const Chips = ({ attr, all, label, items }: { attr: string; all: string; label: string; items: ChipItem[] }) => (
  <div className="px-chips" role="group" aria-label={label}>
    <button type="button" className="px-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => (
      <button key={x.v} type="button" className={`px-chip ${x.cls ?? ''}`.trim()} data-f-chip={attr} data-v={x.v} aria-pressed="false" style={x.color ? css({ '--accent': x.color }) : undefined}>
        <i className="dot" aria-hidden="true" />{x.label}{x.n != null && <b>{num(x.n)}</b>}
      </button>
    ))}
  </div>
);

const Empty = ({ text, live = true, hidden = live }: { text: string; live?: boolean; hidden?: boolean }) => (
  <div className="px-empty" {...(live ? { 'data-f-empty': '' } : {})} hidden={hidden}>
    <span className="px-empty__ring" aria-hidden="true" />
    <p>{text}</p>
  </div>
);
const More = ({ label }: { label: string }) => (
  <div className="px-more"><button type="button" className="btn btn--line px-btn" data-f-more hidden>{label}</button></div>
);
const Pill = ({ n, noun }: { n: number; noun: string }) => (
  <span className="px-pill">{I.people}<b data-f-group-count>{num(n)}</b><span className="sr-only"> {noun}</span></span>
);

/* ================= About: the title pinned beside one reading sheet of admin HTML ================= */
function About() {
  const p = pageInfo('about');
  return (
    <div className="px-about" id="top">
      <div className="wrap px-about__in">
        <header className="px-about__head" data-rv>
          <Crumbs title={p.title} />
          <h1 className="px-head__title"><HL text={p.title} /></h1>
          <span className="px-about__bar" aria-hidden="true" />
        </header>
        <div className="px-about__sheet" data-rv style={css({ '--i': 1 })}><AdminContent className="px-prose" /></div>
      </div>
    </div>
  );
}

/* ================= District Committee: the Governor featured beside the executive; every committee as a row of portrait cards ================= */
type Member = ReturnType<typeof committee>[number]['members'][number];

const Spotlight = ({ m, g }: { m: Member; g: string }) => (
  <article className="px-spot px-blue" data-item data-q={m.q} data-group={g} data-glow data-rv>
    <figure className="px-spot__photo">
      <span className="px-spot__frame">
        {m.photo
          ? <img src={m.photo.src} alt={m.photo.alt || m.name} width={m.photo.w} height={m.photo.h} />
          : <span className="px-spot__mono" aria-hidden="true">{m.initials}</span>}
      </span>
    </figure>
    <div className="px-spot__text">
      <h3 className="px-spot__name"><a href={memberHref(m)}>{m.name}</a></h3>
      <p className="px-spot__role">{m.role}</p>
      {m.club && <p className="px-spot__club">{clubName(m.club)}</p>}
    </div>
  </article>
);

/* a member as a portrait card (initials on the committee's tint when there is no photo); the name links to the
   profile, except on that profile's own page, where the card is marked as the current one instead */
const MemberCard = ({ m, g, current = false }: { m: Member; g: string; current?: boolean }) => (
  <li className={current ? 'px-mcard is-current' : 'px-mcard'} data-item data-q={m.q} data-group={g} {...(current ? { 'aria-current': 'page' as const } : {})}>
    <span className="px-mcard__photo">
      {m.photo
        ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" />
        : <span className="px-mcard__mono" aria-hidden="true">{m.initials}</span>}
    </span>
    <h3 className="px-mcard__name">{current ? m.name : <a href={memberHref(m)}>{m.name}</a>}</h3>
    {m.role && <p className="px-mcard__role">{m.role}</p>}
    {m.club && <p className="px-mcard__club">{clubName(m.club)}</p>}
  </li>
);

/* Each committee shows one row of cards (two rows beside the Governor) until its own "show all"; a search or a
   committee chip lifts the cap (inner.css), so a match is never hidden behind it. */
function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [lead, ...rest] = groups;
  const [first, ...officers] = lead?.members ?? [];
  return (
    <div data-filter>
      <PageHead k="committee">
        <p className="px-kfig"><b data-count>{num(total)}</b><span>members</span><b data-count>{num(groups.length)}</b><span>committees</span></p>
        <Search label={P.committee.searchLabel} count={total} />
      </PageHead>
      <div className="wrap px-body">
        <div className="px-bar" data-rv>
          <Chips attr="group" all="All committees" label="Committee" items={groups.map((g, i) => ({ v: g.key, label: g.title, n: g.members.length, color: ACC[i % ACC.length] }))} />
        </div>
        {lead && first && (
          <section className="px-cmte px-lead" data-f-group style={css({ '--accent': ACC[0] })}>
            <header className="px-ghead">
              <h2 className="px-h2">{lead.title}</h2>
              <Pill n={lead.members.length} noun="members" />
            </header>
            <div className="px-lead__grid">
              <Spotlight m={first} g={lead.key} />
              {officers.length > 0 && (
                <ul className="px-mcards px-mcards--exec" data-f-group data-rv style={css({ '--i': 1 })}>
                  {officers.map((m, i) => <MemberCard key={i} m={m} g={lead.key} />)}
                </ul>
              )}
            </div>
            {officers.length > 4 && <ShowAll n={lead.members.length} noun="members" />}
          </section>
        )}
        {rest.map((g, i) => (
          <section key={g.key} className="px-cmte" data-f-group data-rv style={css({ '--accent': ACC[(i + 1) % ACC.length] })}>
            <header className="px-ghead">
              <h2 className="px-h2">{g.title}</h2>
              <Pill n={g.members.length} noun="members" />
            </header>
            <ul className="px-mcards">{g.members.map((m, j) => <MemberCard key={j} m={m} g={g.key} />)}</ul>
            {g.members.length > 2 && <ShowAll n={g.members.length} noun="members" />}
          </section>
        ))}
        <Empty text={P.committee.empty} />
      </div>
    </div>
  );
}

/* ================= Club Finder: search in the head, the week as the filter, one wide table ================= */
const isWeekend = (day?: string) => day === 'Saturday' || day === 'Sunday';

function Finder() {
  const f = P.finder;
  const list = clubs();
  const today = weekdayName(parseISO(R.calendar.today));
  /* exact equality, the test the filter uses, so a tile's number is what its click shows */
  const on = (d: string) => list.filter(c => c.day === d).length;
  return (
    <div data-filter data-page-size={f.pageSize}>
      <PageHead k="finder">
        <p className="px-kfig"><b data-count>{num(list.length)}</b><span>clubs in District {R.site.district}</span></p>
        <Search label={f.searchLabel} hero />
      </PageHead>
      <div className="wrap px-body">
        <div className="px-week" role="group" aria-label={f.dayLabel} data-rv>
          <button type="button" className="px-wtile" data-f-chip="day" data-v="" aria-pressed="true">
            <span className="px-wtile__d">{f.anyDay}</span>
            <b className="px-wtile__n" data-count>{num(list.length)}</b>
            <span className="px-wtile__u">clubs</span>
          </button>
          {f.days.map((d, i) => (
            <button key={d} type="button" className={`px-wtile${d === today ? ' is-today' : ''}${isWeekend(d) ? ' is-weekend' : ''}`} data-f-chip="day" data-v={d} aria-pressed="false" style={css({ '--i': i + 1 })}>
              <span className="px-wtile__d"><span aria-hidden="true">{d.slice(0, 3)}</span><span className="sr-only">{d}</span></span>
              {d === today && <em className="px-today">{R.calendar.todayTag}</em>}
              <b className="px-wtile__n" data-count>{num(on(d))}</b>
              <span className="px-wtile__u">clubs</span>
            </button>
          ))}
        </div>
        <section className="px-ledger px-table" data-rv style={css({ '--i': 1 })}>
          <header className="px-table__cap">
            <p className="px-table__n" aria-live="polite"><b data-f-count>{num(list.length)}</b> clubs</p>
            <p className="px-tag px-table__day">
              <span data-v="">{f.anyDay}</span>
              {f.days.map(d => <span key={d} data-v={d}>{d}</span>)}
            </p>
          </header>
          <ul className="px-rows">
            {list.map(c => (
              <li key={c.id} className="px-row px-club" data-item data-q={c.q} data-day={c.day ?? ''}>
                <span className={`px-tile px-tile--day${isWeekend(c.day) ? ' is-weekend' : ''}${c.day ? '' : ' is-none'}`} aria-hidden="true">{c.day ? c.day.slice(0, 3) : '—'}</span>
                <h3 className="px-club__name">
                  <a href={c.href}>Rotary Club of {c.name}{c.day && <span className="sr-only">, meets every {c.day}</span>}</a>
                </h3>
                {/* president and phone (either may be missing: the cell stays, so the columns line up); the venue is still searched (data-q) */}
                <p className="px-club__pres">{c.president && <>{I.user}<span><span className="sr-only">President: </span>{c.president}</span></>}</p>
                <p className="px-club__tel">{c.phone && (c.tel
                  ? <a href={`tel:${c.tel}`}>{I.phone}<span><span className="sr-only">Phone: </span>{c.phone}</span></a>
                  : <>{I.phone}<span><span className="sr-only">Phone: </span>{c.phone}</span></>)}</p>
                <span className="px-go" aria-hidden="true">{I.arrow}</span>
              </li>
            ))}
          </ul>
          <Empty text={f.empty} />
          <More label={f.more} />
        </section>
      </div>
    </div>
  );
}

/* ================= Club Projects / Club Service ================= */
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;
const Totals = ({ list }: { list: Project[] }) => {
  const t = totals(list), L = P.projects.statLabels;
  const cells: [string, string][] = [[L.projects, num(t.projects)], [L.beneficiaries, num(t.beneficiaries)], [L.amount, lakh(t.amount)], [L.hours, num(t.hours)]];
  return <dl className="px-kquad">{cells.map(([l, v]) => <div key={l}><dt>{l}</dt><dd data-count>{v}</dd></div>)}</dl>;
};

/* newest first: the cards are numbered in this order (#1 = the latest), by a CSS counter over the visible ones */
const latest = (list: Project[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));

/* "Read more" is the card's action and covers the card; above it sit the two smaller controls: the photo (opens
   full size in the lightbox) and Share */
function ProjectItem({ p, i, glow = false }: { p: Project; i: number; glow?: boolean }) {
  return (
    <li className="px-proj" style={css({ '--accent': AVENUE[p.avenue] ?? ACC[0], '--i': glow ? 0 : i % 3 })} data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="px-proj__photo">
        <Zoom ph={p.photo} group={`p-${p.id}`} className="px-proj__img"><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} {...(i ? { loading: 'lazy' as const } : {})} /></Zoom>
        <span className="px-proj__no" aria-hidden="true" />
      </figure>
      <div className="px-proj__body" {...(glow ? { 'data-glow': '' } : {})}>
        <h3 className="px-proj__title">{p.title}</h3>
        <p className="px-proj__meta">
          <span className="px-tag"><i className="dot" aria-hidden="true" />{avenueLabel(p.avenue)}</span>
          <span>{shortDate(p.date)}{p.club ? ` · ${clubName(p.club)}` : ''}</span>
        </p>
        <p className="px-proj__sum">{p.summary}</p>
        <div className="px-proj__acts">
          <a className="btn px-proj__more" href={projectHref(p)}>Read more<span className="sr-only">: {p.title}</span>{I.next}</a>
          <Share p={p} />
        </div>
      </div>
    </li>
  );
}

/* Projects: a spectrum of the avenues over one sheet; the first visible project is drawn as a small hero */
function Projects() {
  const x = P.projects;
  const list = latest(projectsOf());
  const n = (k: string) => list.filter(p => p.avenue === k).length;
  const used = x.avenues.filter(a => n(a.key) > 0);
  return (
    <div data-filter data-page-size={x.pageSize}>
      <PageHead k="projects"><Totals list={list} /></PageHead>
      <div className="wrap px-body">
        <div className="px-bar px-bar--proj" data-rv>
          <Search label={x.searchLabel} count={list.length} />
          <div className="px-spectrum" aria-hidden="true">
            {used.map((a, i) => <i key={a.key} title={a.label} style={css({ '--n': n(a.key), '--accent': AVENUE[a.key] ?? ACC[0], '--k': i })} />)}
          </div>
          <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.map(a => ({ v: a.key, label: a.label, n: n(a.key), color: AVENUE[a.key] ?? ACC[0] }))} />
        </div>
        <ul className="px-ledger px-projs">{list.map((p, i) => <ProjectItem key={p.id} p={p} i={i} glow />)}</ul>
        <Empty text={x.empty} />
        <More label={x.more} />
      </div>
    </div>
  );
}

/* Club Service: the five counters as one strip in the head (production's labels, in its order), the projects as a poster trio */
function Service() {
  const x = P.projects;
  const list = latest(projectsOf('club'));
  const t = totals(list);
  const strip: [string, string][] = [['Projects', num(t.projects)], ['Clubs Involved', num(new Set(list.map(p => p.club)).size)],
    ['Beneficiaries', num(t.beneficiaries)], ['Volunteer Hours', num(t.hours)], ['Amount Spent', lakh(t.amount)]];
  return (
    <div data-filter data-page-size={x.pageSize}>
      <PageHead k="service" wide>
        <dl className="px-kquad px-kquad--lead px-kstrip">{strip.map(([l, v]) => <div key={l}><dt>{l}</dt><dd data-count>{v}</dd></div>)}</dl>
      </PageHead>
      <div className="wrap px-body">
        <div className="px-bar" data-rv><Search label={x.searchLabel} count={list.length} /></div>
        <ul className="px-posters">{list.map((p, i) => <ProjectItem key={p.id} p={p} i={i} />)}</ul>
        <Empty text={x.empty} />
        <More label={x.more} />
      </div>
    </div>
  );
}

/* ================= District Calendar: month rail, a ruler of the days, tear-off day pages from today ================= */
const PEOPLE = new Set(['birthday', 'anniversary']);
/* "2 club events · 1 birthday", from the type labels in the data */
const summary = (list: CalEntry[]) => R.calendar.types
  .map(t => [t, list.filter(e => e.type === t.key).length] as const)
  .filter(([, n]) => n)
  .map(([t, n]) => `${n} ${(n === 1 ? t.label : t.group).toLowerCase()}`)
  .join(' · ');

function TodayKey() {
  const C = R.calendar;
  const d = parseISO(C.today);
  const line = summary(entriesByDate().get(C.today) ?? []);
  return (
    <div className="px-kday">
      <p className="px-kday__date">
        <b className="px-kday__num">{d.getDate()}</b>
        <span className="px-kday__wd">{weekdayName(d)}</span>
        <span className="px-kday__mo">{monthLabel(d)}</span>
        <em className="px-today">{C.todayTag}</em>
      </p>
      <p className="px-kday__line">{line ? `${line} today` : C.emptyDay}</p>
    </div>
  );
}

function TypeBlock({ type, list, cap }: { type: (typeof R.calendar.types)[number]; list: CalEntry[]; cap: number }) {
  const people = PEOPLE.has(type.key);
  return (
    <section className={`px-dgroup px-t--${type.key}`} data-f-group>
      <h4 className="px-dgroup__h"><i className="dot" aria-hidden="true" />{type.group}<b className="px-pill" data-f-group-count>{num(list.length)}</b></h4>
      {people ? (
        <ul className="px-people">
          {list.map((e, i) => (
            <li key={i} className="px-person" data-item data-type={e.type}>
              <span className="px-person__av" aria-hidden="true">{initials(e.name ?? '')}</span>
              <span className="px-person__text"><b>{e.name}</b>{(e.club || e.relation) && <span>{e.club ? clubName(e.club) : e.relation}</span>}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="px-events">
          {list.map((e, i) => {
            const sub = [e.club && clubName(e.club), e.venue].filter(Boolean).join(' · ');
            return (
              <li key={i} className="px-event" data-item data-type={e.type}>
                <span className="px-event__time">{e.time ?? '—'}</span>
                <span className="px-event__text"><b><a href={eventHref(e)}>{e.title}</a></b>{sub && <span>{sub}</span>}</span>
              </li>
            );
          })}
        </ul>
      )}
      {people && list.length > cap && <ShowAll n={list.length} noun={type.group.toLowerCase()} />}
    </section>
  );
}

/* the CSS-only "show all": a checkbox pill; while it is unchecked the list past its cap is hidden (inner.css) */
const ShowAll = ({ n, noun }: { n: number; noun: string }) => (
  <label className="px-all">
    <input type="checkbox" />
    <span className="px-all__more">Show all {num(n)} {noun}</span>
    <span className="px-all__less">Show fewer</span>
  </label>
);

function DayPage({ iso, list, today = false }: { iso: string; list: CalEntry[]; today?: boolean }) {
  const C = R.calendar;
  const date = parseISO(iso);
  const wk = date.getDay() === 0 || date.getDay() === 6;
  const types = C.types.filter(t => list.some(e => e.type === t.key));
  return (
    <article className={`px-day${today ? ' px-day--today' : ''}${wk ? ' is-weekend' : ''}`} id={`d${iso}`}
      {...(list.length ? { 'data-f-group': '' } : {})} {...(today ? { 'aria-current': 'date' as const } : {})} data-rv>
      <h3 className="px-day__stub" {...(today ? { 'data-glow': '' } : {})}>
        <span className="px-day__wd">{weekdayName(date)}</span>
        <b className="px-day__num">{date.getDate()}</b>
        <span className="px-day__mo">{monthLabel(date)}</span>
        {today && <em className="px-today">{C.todayTag}</em>}
      </h3>
      <div className="px-day__body">
        {types.length
          ? types.map(t => <TypeBlock key={t.key} type={t} list={list.filter(e => e.type === t.key)} cap={today ? 8 : 4} />)
          : <p className="px-day__free">{C.emptyDay}</p>}
      </div>
    </article>
  );
}

function MonthPanel({ m, open }: { m: ReturnType<typeof calMonths>[number]; open: boolean }) {
  const C = R.calendar;
  const days = monthEntries(m.date);
  const byIso = new Map(days.map(d => [d.iso, d.list]));
  const total = days.reduce((s, d) => s + d.list.length, 0);
  const count = (k: string) => days.reduce((s, d) => s + d.list.filter(e => e.type === k).length, 0);
  const y = m.date.getFullYear(), mo = m.date.getMonth();
  const dim = new Date(y, mo + 1, 0).getDate();
  /* this month: today first, then the days after it, then the earlier days */
  const hasToday = m.key === todayMonthKey();
  const later = hasToday ? days.filter(d => d.iso > C.today) : days;
  const earlier = hasToday ? days.filter(d => d.iso < C.today) : [];
  return (
    <div className="px-cal" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      <header className="px-cal__top" data-rv>
        <h2 className="px-h2 px-cal__title"><HL text={m.label} /></h2>
        {total > 0 && <Chips attr="type" all="All" label="Show" items={C.types.map(t => ({ v: t.key, label: t.group, n: count(t.key), cls: `px-t--${t.key}` }))} />}
      </header>
      <ol className="px-ruler" style={css({ '--days': dim })} aria-label={`Days of ${m.label}`} data-rv>
        {Array.from({ length: dim }, (_, i) => {
          const date = new Date(y, mo, i + 1), iso = toISO(date), list = byIso.get(iso);
          const isToday = iso === C.today;
          const cls = `px-rtile${isToday ? ' is-today' : ''}${date.getDay() === 0 || date.getDay() === 6 ? ' is-weekend' : ''}`;
          const inner = <><span aria-hidden="true">{weekdayName(date)[0]}</span><b>{i + 1}</b></>;
          return (
            <li key={iso}>
              {list ? (
                <a className={cls} href={`#d${iso}`} aria-label={`${weekdayName(date)} ${i + 1} ${m.label}${isToday ? ', today' : ''}: ${summary(list)}`} {...(isToday ? { 'aria-current': 'date' as const } : {})}>
                  {inner}
                  <i className="px-rdots" aria-hidden="true">{C.types.filter(t => list.some(e => e.type === t.key)).map(t => <i key={t.key} className={`dot dot--${t.key}`} />)}</i>
                </a>
              ) : (
                <span className={cls} {...(isToday ? { 'aria-current': 'date' as const } : {})}>{inner}<span className="sr-only">{weekdayName(date)} {i + 1}</span></span>
              )}
            </li>
          );
        })}
      </ol>
      {total > 0 && (
        <div className="px-days">
          {hasToday && <DayPage iso={C.today} list={byIso.get(C.today) ?? []} today />}
          {later.map(d => <DayPage key={d.iso} iso={d.iso} list={d.list} />)}
          {earlier.length > 0 && (
            <section className="px-earlier" data-f-group>
              <h3 className="px-earlier__h">Earlier this month</h3>
              {earlier.map(d => <DayPage key={d.iso} iso={d.iso} list={d.list} />)}
            </section>
          )}
        </div>
      )}
      <div className="px-day px-day--none" data-f-empty hidden={total > 0}>
        <p className="px-day__stub"><b className="px-day__num">{m.short}</b><span className="px-day__mo">{y}</span></p>
        <div className="px-day__body"><span className="px-empty__ring" aria-hidden="true" /><p>{P.calendar.emptyMonth}</p></div>
      </div>
    </div>
  );
}

function CalendarPage() {
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <div data-tabs>
      <PageHead k="calendar" keyClass="px-head__key--today"><TodayKey /></PageHead>
      <div className="wrap px-body">
        <div className="px-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv>
          {months.map(m => (
            <button key={m.key} type="button" role="tab" className={`px-month${m.key === open ? ' is-on has-today' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
              <span>{m.short}</span><small>{m.date.getFullYear()}</small>
            </button>
          ))}
        </div>
        {months.map(m => <MonthPanel key={m.key} m={m} open={m.key === open} />)}
      </div>
    </div>
  );
}

/* ================= Newsletters: section tabs in the head panel, a broadsheet with a lead story ================= */
const footLine = (vals: Record<string, string | number>) => R.fmt.fill(R.press.club.footer, vals).split(' on the {link}')[0] + '.';
/* Preview opens the PDF in a new tab, Download saves it */
const acts = (pdf: string) => (
  <div className="px-story__acts">
    <a className="newsbtn newsbtn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
    <a className="newsbtn" href={pdf} download>{R.press.actions.download}</a>
  </div>
);

function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const years = pressYears();
  const per = (f: (y: (typeof years)[number]) => ReactNode) => years.map(y => <span key={y.year} data-year={y.year} hidden={y.year !== year}>{f(y)}</span>);
  return (
    <div data-tabs data-tabs-hash>
      <PageHead k="newsletters">
        <div className="px-ktabs" role="tablist" aria-label={pageInfo('newsletters').title}>
          <button type="button" role="tab" className="px-ktab is-on" data-tab="club" aria-selected="true"><span>{N.club}</span><b>{per(y => num(y.bulletins.length))}</b></button>
          <button type="button" role="tab" className="px-ktab" data-tab="governor" aria-selected="false" tabIndex={-1}><span>{N.governor}</span><b>{per(y => num(y.gml.length))}</b></button>
        </div>
        <p className="px-kline">{N.yearLabel} <b>{per(y => y.year)}</b></p>
      </PageHead>
      <div className="wrap px-body">
        <div className="px-news" data-rv>
          {years.map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year}>
              <section data-panel="club" role="tabpanel" aria-label={N.club} data-filter data-page-size="13">
                <header className="px-news__sec">
                  <h2 className="px-news__h">{N.club}</h2>
                  {y.bulletins.length > 0 && <Search label={N.searchLabel} count={y.bulletins.length} />}
                </header>
                {y.bulletins.length > 0 && (
                  <ol className="px-stories">
                    {y.bulletins.map((b, i) => (
                      <li key={i} className="px-story" data-item data-q={`${b.title} ${b.club}`.toLowerCase()}>
                        <h3 className="px-story__h">{b.title}</h3>
                        <p className="px-story__by">{clubName(b.club)}</p>
                        <p className="px-story__date">{shortDate(b.date)}</p>
                        {acts(b.pdf)}
                      </li>
                    ))}
                  </ol>
                )}
                <Empty text={y.bulletins.length ? 'No bulletin matches your search.' : R.fmt.fill(R.press.club.empty, { year: y.year })} hidden={y.bulletins.length > 0} />
                {y.bulletins.length > 0 && (
                  <footer className="px-news__foot">
                    <p>{footLine({ shown: y.bulletins.length, total: num(y.total), year: y.year })}</p>
                    <button type="button" className="newsbtn" data-f-more hidden>Show more bulletins</button>
                  </footer>
                )}
              </section>
              <section data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                <header className="px-news__sec"><h2 className="px-news__h">{N.governor}</h2></header>
                {y.gml.length ? (
                  <ol className="px-letters">
                    {y.gml.map((g, i) => (
                      <li key={i} className="px-letter">
                        <h3>{g.month}</h3>
                        <p className="px-letter__by">{g.governor} · {shortDate(g.date)}</p>
                        {acts(g.pdf)}
                      </li>
                    ))}
                  </ol>
                ) : <Empty text={R.fmt.fill(R.press.gml.empty, { year: y.year })} live={false} hidden={false} />}
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Contact: the Governor's office in the head panel, the form sheet beside two doors ================= */
function Contact() {
  const c = P.contact;
  const o = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const finder = pageInfo('finder');
  return (
    <>
      <PageHead k="contact">
        <div className="px-koffice">
          <span className="px-koffice__ring">
            {dg?.photo ? <img src={dg.photo.src} alt="" width={dg.photo.w} height={dg.photo.h} /> : <span className="px-koffice__mono" aria-hidden="true">{initials(dg?.name ?? c.office)}</span>}
          </span>
          <div>
            <h2 className="px-koffice__h">{c.office}</h2>
            {dg && <p className="px-koffice__who">{dg.name}, {o.label}</p>}
          </div>
        </div>
        <div className="px-klinks">
          {o.email && <a className="px-klink" href={`mailto:${o.email}`}>{I.mail}<span>{o.email}</span></a>}
          {o.tel && <a className="px-klink" href={`tel:${o.tel}`}>{I.phone}<span>{o.phoneDisplay}</span></a>}
        </div>
      </PageHead>
      <div className="wrap px-body px-contact">
        <form className="px-sheet px-form" data-demo-form data-rv>
          <header className="px-form__head">
            <h2 className="px-h2"><HL text={c.title} /></h2>
            <p className="px-form__hours">{c.hours}</p>
          </header>
          <div className="px-form__body">
            <div className="px-form__fields">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="px-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
              <div className="px-form__send px-form__wide">
                <button type="submit" className="btn btn--solid px-btn">{F.send}</button>
                <p className="px-form__note">{c.formNote}</p>
              </div>
            </div>
            <div className="px-form__done" data-form-done hidden tabIndex={-1} role="status">
              <span className="px-form__tick">{I.check}</span>
              <p>{c.sent}</p>
            </div>
          </div>
        </form>
        <aside className="px-doors">
          <article className="px-sheet px-door" style={css({ '--accent': '#F7A81B', '--i': 1 })} data-rv>
            <span className="px-tile" aria-hidden="true">{I.join}</span>
            <h2>{c.join.title}</h2>
            <p>{c.join.text}</p>
            <a className="btn btn--solid px-btn" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
          </article>
          <article className="px-sheet px-door" style={css({ '--accent': '#00ADBB', '--i': 2 })} data-rv>
            <span className="px-tile" aria-hidden="true">{I.pin}</span>
            <h2>{c.finder.title}</h2>
            <p>{c.finder.text}</p>
            <a className="btn btn--line px-btn" href={finder.file}>{finder.title}{I.next}</a>
          </article>
        </aside>
      </div>
    </>
  );
}

/* ================= Detail pages: shared/detail.tsx hands each page one item (null → not found) =================
   The same frame as the list pages: the item's name on the tinted band, its figures, date or portrait in the
   blue panel; then sheets and ledgers. Long lists are capped by the CSS "show all" pill or paged by inner.js. */
interface Fact { icon: ReactNode; label: string; value: ReactNode }
const Facts = ({ rows }: { rows: Fact[] }) => (
  <dl className="px-facts">
    {rows.map((r, i) => (
      <div key={i} className="px-fact">
        <dt><span className="px-fact__ic" aria-hidden="true">{r.icon}</span>{r.label}</dt>
        <dd>{r.value}</dd>
      </div>
    ))}
  </dl>
);

/* the line under an item's title: icon + text pairs, the empty ones left out */
const Meta = ({ bits }: { bits: [ReactNode, ReactNode][] }) => {
  const list = bits.filter(([, t]) => t);
  return list.length ? <ul className="px-meta">{list.map(([ic, t], i) => <li key={i}>{ic}<span>{t}</span></li>)}</ul> : null;
};

/* figures in the head panel, counting up; an odd number gives the first one the whole width */
const Figures = ({ title, cells }: { title: string; cells: [string, string][] }) => (
  <>
    <h2 className="sr-only">{title}</h2>
    <dl className={cells.length % 2 ? 'px-kquad px-kquad--lead' : 'px-kquad'}>
      {cells.map(([l, v]) => <div key={l}><dt>{l}</dt><dd data-count>{v}</dd></div>)}
    </dl>
  </>
);

/* Text from the admin: a run of short lines (a list typed with Enter) stays one block of lines; otherwise
   paragraphs, the first set as a lede only when more follow and it is not itself a wall of text. */
const Paras = ({ text: raw }: { text: string[] }) => {
  /* a line broken mid-sentence in the source (no closing punctuation, the next starting in lower case) is rejoined */
  const text = raw.reduce<string[]>((a, t) => {
    const prev = a[a.length - 1];
    if (prev && !/[.!?:;"')\]]$/.test(prev) && /^[a-z]/.test(t)) a[a.length - 1] = `${prev} ${t}`; else a.push(t);
    return a;
  }, []);
  if (text.length > 2 && text.filter(t => t.length < 60).length > text.length * 0.6)
    return <p className="px-lines">{text.map((t, i) => <Fragment key={i}>{i > 0 && <br />}{t}</Fragment>)}</p>;
  return <>{text.map((t, i) => <p key={i} className={i === 0 && text.length > 1 && t.length <= 320 ? 'px-lede' : undefined}>{t}</p>)}</>;
};

const Back = ({ href, label }: { href: string; label: string }) => (
  <p className="px-back" data-rv><a className="btn btn--line px-btn" href={href}>{I.back}{label}</a></p>
);

/* who organised it: a club (linked when the club is known) or the district itself */
const OrgRow = ({ club, id }: { club: string; id: string }) => {
  const label = club ? `Rotary Club of ${club}` : R.site.name;
  return (
    <div className="px-row px-orgrow">
      <span className="px-tile" aria-hidden="true">{club ? initials(club) : R.site.district}</span>
      <p className="px-orgrow__name">{id ? <a href={clubHref(id)}>{label}</a> : label}</p>
      {id && <span className="px-go" aria-hidden="true">{I.arrow}</span>}
    </div>
  );
};

/* photos past the cover; capped at eight (six on a phone) until "show all". Each opens in the lightbox, in the
   cover's gallery (`group`), so the lightbox runs through every photo even while the grid is capped. */
function Gallery({ photos, group }: { photos: Photo[]; group: string }) {
  if (!photos.length) return null;
  const T = D.project.gallery;
  return (
    <section className="px-gallery" aria-label={T} data-rv>
      <header className="px-ghead">
        <h2 className="px-h2">{T}</h2>
        <span className="px-pill">{I.photo}<b>{num(photos.length)}</b><span className="sr-only"> {T.toLowerCase()}</span></span>
      </header>
      <ul className="px-photos">
        {photos.map((ph, i) => <li key={i}><Zoom ph={ph} group={group} className="px-photos__a"><img src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} loading="lazy" /></Zoom></li>)}
      </ul>
      {photos.length > 6 && <ShowAll n={photos.length} noun={T.toLowerCase()} />}
    </section>
  );
}

/* the selector found nothing: the head says so in its blue panel and points back to the list */
function Missing({ k, via, text, back }: { k: PageKey; via?: PageKey; text: string; back: string }) {
  return (
    <>
      <PageHead k={k}>
        <div className="px-knone">
          <span className="px-empty__ring" aria-hidden="true" />
          <p>{text}</p>
          <a className="btn btn--solid px-btn" href={via ? pageInfo(via).file : R.nav[0].href}>{back}{I.next}</a>
        </div>
      </PageHead>
      {/* the page's usual space before the footer, so the blue panel never meets the blue footer */}
      <div className="px-body" />
    </>
  );
}

const Mono = ({ photo, name }: { photo: Photo | null | undefined; name: string }) => (photo
  ? <img src={photo.src} alt="" width={photo.w} height={photo.h} />
  : <span className="px-koffice__mono" aria-hidden="true">{initials(name)}</span>);

/* ---------- Club profile: figures in the head; details (meeting first) as one strip; leadership; the roster;
   projects | newsletters | events ---------- */
function ClubPage() {
  const c = clubProfile();
  const name = c ? `Rotary Club of ${c.name}` : '';
  useDocTitle(name);
  if (!c) return <Missing k="club" via="finder" text={D.club.missing} back={D.club.back} />;
  const W = D.club, L = P.projects.statLabels, g = c.glance, m = c.meeting, ct = c.contact;
  const facts: Fact[] = [
    ...(m.day ? [{ icon: I.cal, label: 'Meeting day', value: m.day }] : []),
    ...(m.time ? [{ icon: I.clock, label: 'Meeting time', value: m.time }] : []),
    ...(m.place ? [{ icon: I.pin, label: 'Meeting place', value: m.place }] : []),
    ...c.details.map(f => ({ icon: I.tag, label: f.label, value: f.value })),
    ...(ct?.email ? [{ icon: I.mail, label: D.member.email, value: <a href={`mailto:${ct.email}`}>{ct.email}</a> }] : []),
    ...(ct?.phone ? [{ icon: I.phone, label: 'Phone', value: <a href={`tel:${ct.phone.replace(/[^\d+]/g, '')}`}>{ct.phone}</a> }] : []),
    ...(ct?.web ? [{ icon: I.globe, label: 'Website', value: <a href={ct.web} target="_blank" rel="noopener">{ct.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a> }] : [])
  ];
  const events = [...c.events].sort((a, b) => a.date.localeCompare(b.date));
  const tabs = [['projects', c.projects.length], ['bulletins', c.bulletins.length], ['events', events.length]] as const;
  return (
    <>
      <PageHead k="club" title={name}>
        <Figures title={W.glance} cells={[['Members', num(g.members)], [L.projects, num(g.projects)], [L.beneficiaries, num(g.beneficiaries)], [L.amount, lakh(g.amount)], [L.hours, num(g.hours)]]} />
      </PageHead>
      <div className="wrap px-body px-detail">
        {facts.length > 0 && (
          <section aria-label={W.details} data-rv>
            <header className="px-ghead"><h2 className="px-h2">{W.details}</h2></header>
            <div className="px-sheet px-facts-strip"><Facts rows={facts} /></div>
          </section>
        )}

        <section className="px-leaders" aria-label={W.leadership} data-rv>
          <header className="px-ghead">
            <h2 className="px-h2">{W.leadership}</h2>
            {c.leaders.length > 0 && <Pill n={c.leaders.length} noun="people" />}
          </header>
          {c.leaders.length ? (
            <ul className="px-ledger px-grid">
              {c.leaders.map((l, i) => (
                <li key={i} className="px-row px-member">
                  {l.photo ? <img className="px-tile" src={l.photo.src} alt="" width={50} height={50} loading="lazy" /> : <span className="px-tile" aria-hidden="true">{initials(l.name)}</span>}
                  <h3 className="px-member__name">{l.name}</h3>
                  <p className="px-member__role">{l.role}</p>
                </li>
              ))}
            </ul>
          ) : <Empty text={W.none.leaders} live={false} hidden={false} />}
          {/* a real board runs to 20+: three rows of three until "show all" */}
          {c.leaders.length > 9 && <ShowAll n={c.leaders.length} noun="people" />}
        </section>

        {c.members.length > 0 && (
          <section className="px-roster" aria-label={W.members} data-filter data-page-size={W.pageSize} data-rv>
            <header className="px-ghead px-ghead--split">
              <h2 className="px-h2">{W.members}</h2>
              <Search label={W.searchLabel} count={c.members.length} />
            </header>
            <ul className="px-ledger px-mates">
              {c.members.map((p, i) => (
                <li key={i} className="px-mate" data-item data-q={`${p.name} ${p.role}`.toLowerCase()}>
                  {p.photo ? <img className="px-mate__av" src={p.photo.src} alt="" width={44} height={44} loading="lazy" /> : <span className="px-mate__av" aria-hidden="true">{initials(p.name)}</span>}
                  <span className="px-mate__text"><b>{p.name}</b>{p.role && <span>{p.role}</span>}</span>
                </li>
              ))}
            </ul>
            <Empty text={W.empty} />
            <More label={W.more} />
          </section>
        )}

        <section className="px-ctabs" data-tabs data-rv>
          <div className="px-chips px-tabbar" role="tablist" aria-label={name}>
            {tabs.map(([k, n], i) => (
              <button key={k} type="button" role="tab" className={i ? 'px-chip px-tab' : 'px-chip px-tab is-on'} data-tab={k} aria-selected={!i} tabIndex={i ? -1 : 0}>
                {W.tabs[k]}<b>{num(n)}</b>
              </button>
            ))}
          </div>
          <div className="px-ctab px-ctab--projects" data-panel="projects" role="tabpanel" aria-label={W.tabs.projects}>
            {c.projects.length ? (
              <>
                <ul className="px-ledger px-projs">{latest(c.projects).map((p, i) => <ProjectItem key={p.id} p={p} i={i} glow />)}</ul>
                {c.projects.length > 6 && <ShowAll n={c.projects.length} noun={W.tabs.projects.toLowerCase()} />}
              </>
            ) : <Empty text={W.none.projects} live={false} hidden={false} />}
          </div>
          <div className="px-ctab px-ctab--bulletins" data-panel="bulletins" role="tabpanel" aria-label={W.tabs.bulletins} hidden>
            {c.bulletins.length ? (
              <>
                <div className="px-news">
                  <ol className="px-stories">
                    {c.bulletins.map((b, i) => (
                      <li key={i} className="px-story">
                        <h3 className="px-story__h">{b.title}</h3>
                        <p className="px-story__date">{shortDate(b.date)}</p>
                        {acts(b.pdf)}
                      </li>
                    ))}
                  </ol>
                </div>
                {c.bulletins.length > 9 && <ShowAll n={c.bulletins.length} noun={W.tabs.bulletins.toLowerCase()} />}
              </>
            ) : <Empty text={W.none.bulletins} live={false} hidden={false} />}
          </div>
          <div className="px-ctab px-ctab--events" data-panel="events" role="tabpanel" aria-label={W.tabs.events} hidden>
            {events.length ? (
              <>
                <ul className="px-ledger px-erows">
                  {events.map((e, i) => {
                    const d = parseISO(e.date), today = e.date === R.calendar.today, sub = [e.time, e.venue].filter(Boolean).join(' · ');
                    return (
                      <li key={i} className={today ? 'px-row px-erow is-today' : 'px-row px-erow'}>
                        <span className="px-dtile" aria-hidden="true"><span>{weekdayName(d).slice(0, 3)}</span><b>{d.getDate()}</b><span>{monthLabel(d).slice(0, 3)}</span></span>
                        <h3 className="px-erow__title"><a href={eventHref(e)}>{e.title}<span className="sr-only">, {longDate(d)}</span></a></h3>
                        {(sub || today) && <p className="px-erow__meta">{today && <em className="px-today">{R.calendar.todayTag}</em>}{sub}</p>}
                        <span className="px-go" aria-hidden="true">{I.arrow}</span>
                      </li>
                    );
                  })}
                </ul>
                {events.length > 6 && <ShowAll n={events.length} noun={W.tabs.events.toLowerCase()} />}
              </>
            ) : <Empty text={W.none.events} live={false} hidden={false} />}
          </div>
        </section>

        <Back href={pageInfo('finder').file} label={W.back} />
      </div>
    </>
  );
}

/* ---------- Project: its figures in the head; the cover beside the story; the rest of the photos ---------- */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title);
  if (!p) return <Missing k="project" via="projects" text={D.project.missing} back={D.project.back} />;
  const via: PageKey = p.avenue === 'club' ? 'service' : 'projects';
  const L = P.projects.statLabels;
  const cells: [string, string][] = [[L.beneficiaries, num(p.beneficiaries)], [L.amount, lakh(p.amount)], [L.hours, num(p.hours)]];
  if (p.rotarians != null) cells.push(['Rotarians', num(p.rotarians)]);
  const [cover, ...rest] = p.gallery.length ? p.gallery : [p.photo];
  return (
    <>
      <PageHead k="project" title={p.title}>
        <Figures title={D.project.figures} cells={cells} />
      </PageHead>
      <div className="wrap px-body px-detail">
        <div className="px-split">
          {cover && (
            <figure className="px-cover" data-rv>
              <Zoom ph={cover} group={`p-${p.id}`} className="px-cover__a"><img src={cover.src} alt={cover.alt} width={cover.w} height={cover.h} /></Zoom>
              {cover.alt && <figcaption>{cover.alt}</figcaption>}
            </figure>
          )}
          <article className="px-sheet px-read" data-rv style={css({ '--i': 1 })}>
            <header className="px-read__head">
              <h2 className="px-h2">{D.project.about}</h2>
              <Share p={p} label />
            </header>
            {/* what, when, where: the avenue, the date, the place and the area of focus (each left out when empty) */}
            <Meta bits={[
              [<i className="dot" aria-hidden="true" style={css({ '--accent': AVENUE[p.avenue] ?? ACC[0] })} />, avenueLabel(p.avenue)],
              [I.cal, p.date && shortDate(p.date)],
              [I.pin, p.location],
              [I.tag, p.focus]
            ]} />
            <Paras text={paras(p.description || p.summary)} />
            {p.club && (
              <div className="px-org">
                <h3 className="px-org__h">{D.project.organiser}</h3>
                <OrgRow club={p.club} id={p.clubId} />
              </div>
            )}
          </article>
        </div>
        <Gallery photos={rest} group={`p-${p.id}`} />
        <Back href={pageInfo(via).file} label={via === 'service' ? pageInfo('service').title : D.project.back} />
      </div>
    </>
  );
}

/* ---------- Event: a tear-off date (and Register) in the head; when, where, who as one strip; the story beside
   its first photo; the rest of the photos ---------- */
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title);
  if (!e) return <Missing k="event" via="calendar" text={D.event.missing} back={D.event.back} />;
  const C = R.calendar;
  const d = parseISO(e.date);
  const today = e.date === C.today;
  const text = paras(e.description);
  const ct = e.contact;
  const [cover, ...more] = e.gallery;
  const org = e.club ? `Rotary Club of ${e.club}` : R.site.name;
  const rows: Fact[] = [
    { icon: I.cal, label: D.event.when, value: <>{longDate(d)}{e.time && ` · ${e.time}`}{today && <em className="px-today">{C.todayTag}</em>}</> },
    ...(e.venue ? [{ icon: I.pin, label: D.event.where, value: e.venue }] : []),
    { icon: I.club, label: D.event.organiser, value: e.club && e.clubId ? <a href={clubHref(e.clubId)}>{org}</a> : org },
    ...(ct && (ct.name || ct.email || ct.phone) ? [{
      icon: I.phone, label: D.event.contact, value: (
        <span className="px-fact__lines">
          {ct.name && <span>{ct.name}</span>}
          {ct.email && <a href={`mailto:${ct.email}`}>{ct.email}</a>}
          {ct.phone && <a href={`tel:${ct.phone.replace(/[^\d+]/g, '')}`}>{ct.phone}</a>}
        </span>
      )
    }] : [])
  ];
  return (
    <>
      <PageHead k="event" title={e.title} keyClass="px-head__key--date">
        <div className="px-kday">
          <p className="px-kday__date">
            <b className="px-kday__num">{d.getDate()}</b>
            <span className="px-kday__wd">{weekdayName(d)}</span>
            <span className="px-kday__mo">{monthLabel(d)}</span>
            {today && <em className="px-today">{C.todayTag}</em>}
          </p>
          {/* the kind of event and its time (the venue is in the strip below) */}
          <p className="px-kday__line">
            <span className="px-kday__kind"><i className={`dot dot--${e.kind}`} aria-hidden="true" />{C.types.find(t => t.key === e.kind)?.label}</span>
            {e.time && <span>{e.time}</span>}
          </p>
          {e.registration && <a className="btn btn--solid px-btn px-kday__go" href={e.registration} target="_blank" rel="noopener">{D.event.register}{I.next}</a>}
        </div>
      </PageHead>
      <div className="wrap px-body px-detail">
        <div className="px-sheet px-facts-strip" data-rv><Facts rows={rows} /></div>
        {(cover || text.length > 0) && (
          <div className={cover && text.length ? 'px-split' : 'px-split is-solo'}>
            {cover && (
              <figure className="px-cover" data-rv>
                <Zoom ph={cover} group={`e-${e.id}`} className="px-cover__a"><img src={cover.src} alt={cover.alt} width={cover.w} height={cover.h} /></Zoom>
                {cover.alt && <figcaption>{cover.alt}</figcaption>}
              </figure>
            )}
            {text.length > 0 && (
              <article className="px-sheet px-read" data-rv style={css({ '--i': 1 })}>
                <h2 className="px-h2">{D.event.about}</h2>
                <Paras text={text} />
              </article>
            )}
          </div>
        )}
        <Gallery photos={more} group={`e-${e.id}`} />
        <Back href={pageInfo('calendar').file} label={D.event.back} />
      </div>
    </>
  );
}

/* ---------- Dignitary: the portrait in the head panel; the biography beside the other dignitary; Rotary details ---------- */
function DignitaryPage() {
  const d = dignitaryProfile();
  useDocTitle(d?.name);
  if (!d) return <Missing k="dignitary" text={D.dignitary.missing} back={D.dignitary.back} />;
  const ot = d.type === 'dg' ? 'president' : 'dg';
  const o = D.dignitary.item?.[ot] ?? R.dignitaries.byYear[R.years.current]?.[ot];
  const ct = d.contact;
  const bio = paras(d.bio);
  return (
    <>
      <PageHead k="dignitary" title={d.name} wide>
        <div className="px-koffice px-koffice--lg">
          <span className="px-koffice__ring"><Mono photo={d.photo} name={d.name} /></span>
          <div className="px-koffice__text">
            <p className="px-koffice__role">{d.role}</p>
            {d.term && <p className="px-koffice__term">{d.term}</p>}
            {ct && (ct.email || ct.phone) && (
              <div className="px-klinks">
                {ct.email && <a className="px-klink" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>}
                {ct.phone && <a className="px-klink" href={`tel:${ct.phone.replace(/[^\d+]/g, '')}`}>{I.phone}<span>{ct.phone}</span></a>}
              </div>
            )}
          </div>
        </div>
      </PageHead>
      <div className="wrap px-body px-detail">
        {(bio.length > 0 || o) && (
          <div className={bio.length && o ? 'px-split' : 'px-split is-solo'}>
            {bio.length > 0 && (
              <article className="px-sheet px-read" data-rv>
                <h2 className="px-h2">{D.dignitary.bio}</h2>
                <Paras text={bio} />
              </article>
            )}
            {/* the other dignitary, as the homepage's white banner; it stays in view beside a long biography */}
            {o && (
              <aside className="px-aside">
                <article className="px-other" data-rv style={css({ '--i': 1 })}>
                  <span className="px-other__ring"><Mono photo={o.photo} name={o.name} /></span>
                  <div className="px-other__text">
                    <h2 className="px-other__name"><a href={dignitaryHref(ot)}>{o.name}</a></h2>
                    <p className="px-other__role">{o.role}</p>
                    <span className="btn-read" aria-hidden="true">{R.dignitaries.readMore}{I.arrow}</span>
                  </div>
                </article>
              </aside>
            )}
          </div>
        )}
        {d.facts.length > 0 && (
          <section aria-label={D.dignitary.details} data-rv>
            <header className="px-ghead"><h2 className="px-h2">{D.dignitary.details}</h2></header>
            <div className="px-sheet px-facts-strip"><Facts rows={d.facts.map(f => ({ icon: I.tag, label: f.label, value: f.value }))} /></div>
          </section>
        )}
        <Back href={R.nav[0].href} label={D.dignitary.back} />
      </div>
    </>
  );
}

/* ---------- Committee member: the profile in the head panel; their committee as portrait cards (one row until
   "show all", as on the District Committee page), this member's card marked ---------- */
function MemberPage() {
  const m = memberProfile();
  useDocTitle(m?.name);
  if (!m) return <Missing k="member" via="committee" text={D.member.missing} back={D.member.back} />;
  const groups = committee();
  const gi = groups.findIndex(g => g.title === m.group);
  const g = groups[gi];
  const cid = clubIdOf(m.club);
  return (
    <>
      <PageHead k="member" title={m.name}>
        <div className="px-koffice">
          <span className="px-koffice__ring"><Mono photo={m.photo} name={m.name} /></span>
          <div>
            {m.role && <p className="px-koffice__h">{m.role}</p>}
            {m.group && <p className="px-koffice__who"><span className="sr-only">{D.member.committee}: </span>{m.group}</p>}
          </div>
        </div>
        {(m.club || m.email) && (
          <div className="px-klinks">
            {m.club && (cid
              ? <a className="px-klink" href={clubHref(cid)}>{I.club}<span><span className="sr-only">{D.member.club}: </span>Rotary Club of {m.club}</span></a>
              : <p className="px-klink">{I.club}<span><span className="sr-only">{D.member.club}: </span>Rotary Club of {m.club}</span></p>)}
            {m.email && <a className="px-klink" href={`mailto:${m.email}`}>{I.mail}<span><span className="sr-only">{D.member.email}: </span>{m.email}</span></a>}
          </div>
        )}
      </PageHead>
      <div className="wrap px-body px-detail">
        {g && g.members.length > 1 && (
          <section className="px-cmte" aria-label={g.title} style={css({ '--accent': ACC[gi % ACC.length] })} data-rv>
            <header className="px-ghead">
              <h2 className="px-h2">{g.title}</h2>
              <Pill n={g.members.length} noun="members" />
            </header>
            <ul className="px-mcards">{g.members.map((x, i) => <MemberCard key={i} m={x} g={g.key} current={memberId(x) === m.id} />)}</ul>
            {g.members.length > 2 && <ShowAll n={g.members.length} noun="members" />}
          </section>
        )}
        <Back href={pageInfo('committee').file} label={D.member.back} />
      </div>
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
  contact: () => <Contact />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />,
  member: () => <MemberPage />
};

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return (
    <main id="main" ref={ref} className={`px-inner px-inner--${page}`}>
      {page === 'about' && <span className="px-progress" aria-hidden="true" />}
      {BODY[page]({ year })}
    </main>
  );
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
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
