import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Later } from '../../shared/inner';
import { R, initials, longDate, parseISO, shortDate, toISO, weekdayName, type Bulletin, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, entryText, pressYears, AdminContent, type PageKey, type Project, projNo
} from '../../shared/inner';
import {
  D, clubProfile, projectDetail, eventDetail, dignitaryProfile, paras, clubHref, projectHref, eventHref,
  dignitaryHref, eventId, useDocTitle
} from '../../shared/detail';
import { Header, TopStrip } from './Chrome';
import { Slide } from '../ether/Chrome';
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
  compass: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="m15.5 8.5-2 5-5 2 2-5z" /></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3.5" y="5" width="17" height="15.5" rx="3" /><path {...sw} d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z" /></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M4 10.5 12 4l8 6.5V20H4z" /><path {...sw} d="M9.5 20v-5.5h5V20" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8" r="3.8" /><path {...sw} d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>,
  ring: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><circle cx="12" cy="3.5" r="2.2" fill="currentColor" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>,
  back: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3m4-4L3 8l4 4" {...sw} /></svg>
};
const css = (o: Record<string, string | number>) => o as CSSProperties;
const dayMonth = (iso: string) => { const [d, m, y] = shortDate(iso).split(' '); return { d, m, y }; };
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;

/* ---------- page head: indigo band under the bar, text left, the page's instrument right ---------- */
type Crumb = { href: string; label: string };
/* two levels everywhere: Home / this page (a detail page: Home / the item) */
const Crumbs = ({ title }: { title: string }) => (
  <nav className="oi-crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a><i aria-hidden="true" /><span aria-current="page">{title}</span>
  </nav>
);
const Rings = () => <div className="oi-head__rings" aria-hidden="true"><span /><span /></div>;
/* title + breadcrumb only (no description line); detail pages pass the item's name (title, crumb) and its lines (sub) */
function Head({ k, aside, children, title, crumb, sub }: {
  k: PageKey; aside?: ReactNode; children?: ReactNode; title?: ReactNode; crumb?: string; sub?: ReactNode;
}) {
  const p = pageInfo(k);
  return (
    <section className="oi-head" id="top">
      <Rings />
      <div className="wrap oi-head__row">
        <div className="oi-head__text" data-rv>
          <Crumbs title={crumb ?? p.title} />
          <h1 className="oi-head__title">{title ?? p.title}</h1>
          {sub}
        </div>
        {aside && <div className="oi-head__aside" data-rv style={css({ '--d': 1 })}>{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/* search on indigo (or light); the live count is for screen readers only ("33 of 33") */
const Search = ({ label, total, light }: { label: string; total: number; light?: boolean }) => (
  <label className={`oi-search ${light ? 'oi-search--light' : ''}`}>
    {I.search}
    <input type="search" data-f-search placeholder={label} aria-label={label} autoComplete="off" enterKeyHint="search" />
    <span className="sr-only" aria-live="polite"><b data-f-count>{total}</b> of {num(total)}</span>
  </label>
);
const Chip = ({ attr, v, on = false, cls = '', label, children }: { attr: string; v: string; on?: boolean; cls?: string; label?: string; children: ReactNode }) => (
  <button type="button" className={`oi-chip ${cls}`} data-f-chip={attr} data-v={v} aria-pressed={on} aria-label={label} title={label}>{children}</button>
);
const Empty = ({ text, show = false }: { text: string; show?: boolean }) => <p className="oi-empty" data-f-empty hidden={!show}>{text}</p>;
const More = ({ label }: { label: string }) => <div className="oi-more"><button type="button" className="pbtn pbtn--solid pbtn--big" data-f-more hidden>{label}</button></div>;
/* the rest of a long list on request, no script: a checkbox in a button (inner.css, .oi-all / .oi-cap) */
const ShowAll = () => (
  <label className="oi-all pbtn">
    <input type="checkbox" />
    <span className="oi-all__more">Show all</span>
    <span className="oi-all__less">Show fewer</span>
  </label>
);
/* a person's disc: the photo when the backend sends one, otherwise initials */
const Face = ({ name, photo, cls = '' }: { name: string; photo: Photo | null; cls?: string }) => (photo
  ? <img className={`oi-hub oi-hub--photo ${cls}`} src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} loading="lazy" />
  : <span className={`oi-hub oi-hub--init ${cls}`} aria-hidden="true">{initials(name)}</span>);

/* ================= About: the admin's one content field on a white sheet hanging from the head ================= */
function About() {
  return (
    <>
      <Head k="about" />
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
/* a committee's name as a heading for its members: "District Secretary" names a group of them */
const teamName = (t: string) => t.replace(/\bSecretary$/, 'Secretaries');

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
            {groups.map(g => <Chip key={g.key} attr="group" v={g.key} cls="oi-chip--tile"><span>{teamName(g.title)}</span><b data-count>{g.members.length}</b></Chip>)}
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
            {/* the Governor and two rows show (one row of two on a phone); the rest on request, no script (inner.css) */}
            {exec.members.length > 5 && <ShowAll />}
          </section>

          {lanes.map(g => (
            <section key={g.key} className="oi-lane" data-f-group data-rv>
              <div className="oi-lane__head">
                <h2>{teamName(g.title)}</h2>
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
              {/* one row of four shows; the rest on request (inner.css) */}
              {g.members.length > 4 && <ShowAll />}
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
    </div>
  );
  return (
    <div className="oi-scope" data-filter data-page-size={f.pageSize}>
      <Head k="finder" aside={tools} />
      <section className="oi-sec oi-find">
        <div className="wrap">
          <div className="oi-reg__cols" aria-hidden="true">
            <span>Club</span><span>President</span><span>Phone</span>
            <span className="oi-reg__wk">{f.days.map((d, i) => <i key={i}>{d[0]}</i>)}</span>
          </div>
          <ul className="oi-reg">
            {list.map(c => {
              const di = f.days.indexOf(c.day ?? '');
              const dial = c.tel || c.phone?.replace(/[^\d+]/g, '');
              return (
                <li key={c.id} className="oi-club" data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                  <span className="oi-hub oi-hub--init" aria-hidden="true">{c.initials}</span>
                  <h2 className="oi-club__name"><span>Rotary Club of </span>{c.name}</h2>
                  <p className="oi-club__pres">{c.president && <>{I.user}<span><span className="sr-only">President: </span>{c.president}</span></>}</p>
                  <p className="oi-club__tel">{c.phone && (dial ? <a href={`tel:${dial}`}>{I.phone}<span>{c.phone}</span></a> : <>{I.phone}<span>{c.phone}</span></>)}</p>
                  <p className="oi-club__day">{c.day && <><i className="oi-wk" style={di >= 0 ? css({ '--d': di }) : undefined} aria-hidden="true" />{c.day}</>}</p>
                  <a className="pbtn oi-club__go" href={c.href} aria-label={`${f.visit}: Rotary Club of ${c.name}`}>{f.visit}{I.arrow}</a>
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
const projQ = (p: Project) => `${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase();
/* listings run newest first; the cards number themselves 1, 2, 3 … over what is showing (a CSS counter, inner.css) */
const newest = (list: Project[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
const ReadMore = ({ p, cls }: { p: Project; cls: string }) => (
  <a className={`pbtn oi-stretch ${cls}`} href={projectHref(p)} aria-label={`Read more: ${p.title}`}>Read more{I.arrow}</a>
);
/* the second, smaller control: system share sheet or the shared menu (shared/inner.js); a disc on cards, a pill with its word on the page */
const ShareBtn = ({ p, word = false }: { p: { id: number | string; title: string }; word?: boolean }) => (
  <button type="button" className={`oi-share ${word ? 'oi-share--word' : ''}`} data-share data-share-url={projectHref(p)} data-share-title={p.title}
    aria-haspopup="menu" aria-expanded={false} aria-label={`Share: ${p.title}`} title="Share">{I.share}<span>Share</span></button>
);
/* a project photo that opens full size (shared lightbox); one group per project */
const Zoom = ({ ph, group, cls = '', eager = false }: { ph: Photo; group: string; cls?: string; eager?: boolean }) => (
  <a className={cls} href={ph.src} data-lightbox={group} data-caption={ph.alt}><img src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} loading={eager ? undefined : 'lazy'} /></a>
);
const DateHub = ({ iso, cls = '', year = false }: { iso: string; cls?: string; year?: boolean }) => {
  const t = dayMonth(iso);
  return <p className={`oi-hub ${cls}`}><b>{t.d}</b><span>{t.m}{year ? ` ${t.y}` : <span className="sr-only"> {t.y}</span>}</span></p>;
};
const ACCENT = ['#FFC44D', '#FF7DB2', '#3DD6E3', '#7CC4FF'];
type Stat = { label: string; value: string };
const statRows = (list: Project[]): Stat[] => {
  const t = totals(list), L = P.projects.statLabels;
  return [
    { label: L.projects, value: num(t.projects) },
    { label: L.beneficiaries, value: num(t.beneficiaries) },
    { label: L.amount, value: lakh(t.amount) },
    { label: L.hours, value: num(t.hours) }
  ];
};
/* totals on indigo, counting up; three or five of them sit three to a row on a phone */
const Ledger = ({ rows, rv = true }: { rows: Stat[]; rv?: boolean }) => (
  <ul className={`oi-ledger ${rows.length % 2 ? 'oi-ledger--odd' : ''}`} {...(rv ? { 'data-rv': '' } : {})} style={css({ '--d': 2, '--n': rows.length })}>
    {rows.map((r, i) => <li key={r.label} style={css({ '--c': ACCENT[i % 4] })}><b data-count>{r.value}</b><span>{r.label}</span></li>)}
  </ul>
);
/* a card's own figures; a 0 is left out, and no figures means no row */
const CardFigs = ({ p }: { p: Project }) => {
  const L = P.projects.statLabels;
  const f = ([[L.beneficiaries, p.beneficiaries, num(p.beneficiaries)], [L.amount, p.amount, lakh(p.amount)], [L.hours, p.hours, num(p.hours)]] as const).filter(x => x[1]);
  return f.length ? <dl className="oi-figs">{f.map(([l, , v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl> : null;
};
/* one project card: one action, "Read more", which covers the card */
const ProjCard = ({ p, club = true, no, figs = false }: { p: Project; club?: boolean; no?: string; figs?: boolean }) => (
  <li className="oi-proj oi-card" data-item data-q={projQ(p)} data-avenue={p.avenue} data-glow data-rv>
    <figure className="oi-proj__photo"><Zoom ph={p.photo} group={`p-${p.id}`} /></figure>
    <span className="oi-tab">{avenueLabel(p.avenue)}</span>
    <span className="oi-tab oi-tab--n" aria-hidden="true" data-no={no} />
    <DateHub iso={p.date} />
    <div className="oi-proj__body">
      <div className="oi-proj__text">
        {club && <p className="oi-proj__club">{clubName(p.club)}</p>}
        <h2 className="oi-proj__title">{p.title}</h2>
        <p className="oi-proj__sum">{p.summary}</p>
      </div>
      {figs && <CardFigs p={p} />}
      <div className="oi-acts"><ReadMore p={p} cls="oi-proj__go" /><ShareBtn p={p} /></div>
    </div>
  </li>
);
function Projects() {
  const x = P.projects;
  const list = newest(projectsOf());
  return (
    <div className="oi-scope" data-filter data-page-size={x.pageSize}>
      <Head k="projects" aside={<Search label={x.searchLabel} total={list.length} />}>
        <div className="wrap"><Ledger rows={statRows(list)} /></div>
      </Head>
      <section className="oi-sec">
        <div className="wrap">
          <div className="oi-chips" role="group" aria-label="Avenues of service" data-rv data-lenis-prevent>
            <Chip attr="avenue" v="" on>{x.allLabel}</Chip>
            {x.avenues.filter(a => a.key !== 'club').map(a => <Chip key={a.key} attr="avenue" v={a.key}>{a.label}</Chip>)}
          </div>
          <ul className="oi-pgrid">
            {list.map((p, i, a) => <ProjCard key={p.id} p={p} no={projNo(i, a.length)} figs />)}
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
  const list = newest(projectsOf('club'));
  const t = totals(list);
  /* the production strip's five counters, in its order: the first in the ringed disc, the rest as lines */
  const [first, ...stats]: Stat[] = [
    { label: 'Projects', value: num(t.projects) },
    { label: 'Clubs Involved', value: num(new Set(list.map(p => p.club)).size) },
    { label: 'Beneficiaries', value: num(t.beneficiaries) },
    { label: 'Volunteer Hours', value: num(t.hours) },
    { label: 'Amount Spent', value: lakh(t.amount) }
  ];
  return (
    <>
      <Head k="service" />
      <section className="oi-sec oi-svc">
        <div className="wrap oi-svc__grid" data-filter data-page-size={x.pageSize}>
          <div className="oi-svc__list">
            <ul className="oi-stories">
              {list.map((p, i, a) => (
                <li key={p.id} className="oi-story oi-card" data-item data-q={projQ(p)} data-avenue={p.avenue} data-glow data-rv>
                  <figure className="oi-story__photo"><Zoom ph={p.photo} group={`p-${p.id}`} /></figure>
                  <span className="oi-tab oi-tab--n" aria-hidden="true" data-no={projNo(i, a.length)} />
                  <div className="oi-story__body">
                    <div className="oi-story__head">
                      <DateHub iso={p.date} />
                      <div className="oi-story__titles">
                        <p className="oi-story__club">{clubName(p.club)}</p>
                        <h2 className="oi-story__title">{p.title}</h2>
                      </div>
                    </div>
                    <p className="oi-story__sum">{p.summary}</p>
                    <CardFigs p={p} />
                    <div className="oi-acts oi-story__acts"><ReadMore p={p} cls="oi-story__go" /><ShareBtn p={p} /></div>
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
            {ev.map((e, i) => { const t = entryText(e); return <li key={i} className={`oi-ev oi-ev--${e.type}`} data-item data-type={e.type}><b><a className="oi-stretch" href={eventHref(e)}>{t.head}</a></b>{t.sub && <span>{t.sub}</span>}</li>; })}
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
        {pp.length > 6 && <ShowAll />}
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
      <Later open={open}>
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
          <Slide>
          <nav className="oi-dayrail" aria-label={m.label} data-lenis-prevent>
            {here && (todayDay
              ? <a className="oi-dayrail__today" href={`#d-${C.today}`} aria-current="date">{C.todayTag}<b>{today.getDate()}</b></a>
              : <span className="oi-dayrail__today" aria-current="date">{C.todayTag}<b>{today.getDate()}</b></span>)}
            {days.filter(d => d !== todayDay).map(d => <a key={d.iso} href={`#d-${d.iso}`} aria-label={longDate(d.date)}>{d.date.getDate()}</a>)}
          </nav>
          </Slide>
        )}
        {days.length > 0 && <ol className="oi-daylist">{ordered.map(d => <DayCard key={d.iso} d={d} today={d === todayDay} />)}</ol>}
        <Empty text={P.calendar.emptyMonth} show={!total} />
      </div>
      </Later>
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
/* a text-only document card: date disc, who, title, Preview + Download (no image: client rule) */
const DocCard = ({ d, item }: { d: Doc; item: Record<string, string> }) => (
  <li className="oi-doc oi-card" {...item} data-glow data-rv>
    <div className="oi-doc__top">
      <p className="oi-hub oi-hub--init"><b>{d.day}</b><span>{d.mon}</span></p>
      <p className="oi-doc__meta"><b>{d.who}</b><span>{d.year}</span></p>
    </div>
    <h2 className="oi-doc__title">{d.title}</h2>
    <Acts pdf={d.pdf} title={d.title} />
  </li>
);
const bulletinDoc = (b: Bulletin, i: number): Doc => {
  const t = dayMonth(b.date);
  return { key: b.title + i, day: t.d, mon: t.m, year: t.y, who: clubName(b.club), title: b.title, pdf: b.pdf, q: `${b.title} ${b.club}`.toLowerCase() };
};
function DocList({ docs, filter }: { docs: Doc[]; filter: boolean }) {
  const [lead, ...rest] = docs;
  const item = (q?: string): Record<string, string> => (filter && q ? { 'data-item': '', 'data-q': q } : {});
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
          {rest.map(d => <DocCard key={d.key} d={d} item={item(d.q)} />)}
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
            const club: Doc[] = y.bulletins.map(bulletinDoc);
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

/* ================= Detail pages: one club, project, event or dignitary =================
   Each opens with the indigo head (Home / the item, its name as the title, totals where it has them, its own
   instrument at the right); everything else about the item sits in the body, built from the list pages' parts. */
const listLink = (k: PageKey): Crumb => { const p = pageInfo(k); return { href: p.file, label: p.title }; };
const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`;
const Pre = () => <span className="oi-pre">Rotary Club of </span>;
/* label / value rows with an icon disc, on a white card */
type FactRow = { icon: ReactNode; label: string; value: ReactNode };
const factsOf = (rows: (FactRow | false | null | undefined | '')[]) => rows.filter(Boolean) as FactRow[];
const Facts = ({ rows }: { rows: FactRow[] }) => (
  <ul className="oi-facts">
    {rows.map((r, i) => (
      <li key={r.label + i}>
        <span className="oi-facts__ic" aria-hidden="true">{r.icon}</span>
        <p className="oi-facts__k">{r.label}</p>
        <div className="oi-facts__v">{r.value}</div>
      </li>
    ))}
  </ul>
);
const Copy = ({ text }: { text: string[] }) => <div className="oi-copy">{text.map((t, i) => <p key={i}>{t}</p>)}</div>;
/* photos at their own colours, opening full size in the lightbox (one group); twelve show, the rest on request */
const Gallery = ({ photos, group }: { photos: Photo[]; group: string }) => (
  <div className="oi-cap">
    <ul className="oi-gal">
      {photos.map((ph, i) => (
        <li key={ph.src + i} data-rv style={css({ '--d': i % 3 })}><Zoom ph={ph} group={group} /></li>
      ))}
    </ul>
    {photos.length > 12 && <ShowAll />}
  </div>
);
/* a dated event row that fills with gold, the whole row one link */
const EvRow = ({ e, club = true }: { e: CalEntry; club?: boolean }) => (
  <li className="oi-evrow" data-item data-rv>
    <DateHub iso={e.date} cls={e.date === R.calendar.today ? 'oi-hub--today' : ''} />
    <div className="oi-evrow__text">
      <h3><a className="oi-stretch" href={eventHref(e)}>{e.title}</a></h3>
      <p><i className={`dot dot--${e.type}`} aria-hidden="true" /><span>{[e.date === R.calendar.today && R.calendar.todayTag, e.time, e.venue, club && e.club && clubName(e.club)].filter(Boolean).join(' · ') || R.calendar.types.find(t => t.key === e.type)?.label}</span></p>
    </div>
    <span className="oi-evrow__go" aria-hidden="true">{I.arrow}</span>
  </li>
);
/* nothing matches the id: the head with the page's own title, the data's sentence and the way back */
function Missing({ k, text, back }: { k: PageKey; text: string; back: Crumb }) {
  return (
    <>
      <Head k={k} />
      <section className="oi-sec oi-gone">
        <div className="wrap">
          <div className="oi-empty oi-empty--page" data-rv>
            <p>{text}</p>
            <a className="pbtn pbtn--solid pbtn--big" href={back.href}>{I.back}{back.label}</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Club profile: the year at a glance and a week dial in the head; details beside the board; work; members ---------- */
const WeekShow = ({ day, hub }: { day: string; hub: string }) => (
  <div className="oi-week oi-week--show oi-turn" aria-hidden="true" data-rv>
    <span className="oi-week__any">{hub}</span>
    {P.finder.days.map((d, i) => <span key={d} className={d === day ? 'is-on' : ''} style={{ left: `${WEEK[i][0]}%`, top: `${WEEK[i][1]}%` }}>{d.slice(0, 2)}</span>)}
  </div>
);
function ClubPage() {
  const c = clubProfile();
  const C = D.club;
  useDocTitle(c && `Rotary Club of ${c.name}`);
  const via = listLink('finder');
  if (!c) return <Missing k="club" text={C.missing} back={{ href: via.href, label: C.back }} />;
  const L = P.projects.statLabels, g = c.glance, m = c.meeting, ct = c.contact;
  const day = P.finder.days.find(d => m.day && d.slice(0, 3).toLowerCase() === m.day.trim().slice(0, 3).toLowerCase()) ?? '';
  const ini = initials(c.name) || c.name.slice(0, 2).toUpperCase();
  const paged = (n: number) => (n ? { 'data-filter': '', 'data-page-size': 6 } : {});
  const projects = c.projects.filter(p => p.avenue !== 'club'), service = c.projects.filter(p => p.avenue === 'club');
  const tabs = [
    { key: 'projects', label: C.tabs.projects, n: projects.length },
    { key: 'service', label: C.tabs.service, n: service.length },
    { key: 'bulletins', label: C.tabs.bulletins, n: c.bulletins.length },
    { key: 'events', label: C.tabs.events, n: c.events.length }
  ];
  /* only what the data has */
  const details = factsOf([
    (m.day || m.time) && { icon: I.cal, label: P.finder.dayLabel, value: <>{m.day && <span>{m.day}</span>}{m.time && <span className="oi-facts__sub">{m.time}</span>}</> },
    m.place && { icon: I.pin, label: 'Meets at', value: m.place },
    ...c.details.map(f => ({ icon: I.ring, label: f.label, value: f.value })),
    ct?.email && { icon: I.mail, label: P.email, value: <a href={`mailto:${ct.email}`}>{ct.email}</a> },
    ct?.phone && { icon: I.phone, label: 'Phone', value: <a href={tel(ct.phone)}>{ct.phone}</a> },
    ct?.web && { icon: I.globe, label: 'Website', value: <a href={ct.web} target="_blank" rel="noopener">{ct.web.replace(/^https?:\/\/(www\.)?|\/$/g, '')}</a> }
  ]);
  return (
    <>
      <Head k="club" crumb={clubName(c.name)} title={<><Pre />{c.name}</>}
        sub={<>
          <h2 className="sr-only">{C.glance}</h2>
          <Ledger rv={false} rows={[
            { label: C.members, value: num(g.members) },
            { label: L.projects, value: num(g.projects) },
            { label: L.beneficiaries, value: num(g.beneficiaries) },
            { label: L.amount, value: lakh(g.amount) },
            { label: L.hours, value: num(g.hours) }
          ]} />
        </>}
        aside={m.day || m.time
          ? <WeekShow day={day} hub={m.time.split(/\s*[–-]\s*/)[0] || ini} />
          : <p className="oi-hub oi-hub--paper oi-hub--big oi-turn" aria-hidden="true" data-rv><b>{ini}</b></p>} />

      <section className="oi-sec oi-ldrs">
        <div className={`wrap oi-cbody ${details.length ? '' : 'is-solo'}`}>
          {details.length > 0 && (
            <div className="oi-card oi-cdetails" data-rv>
              <h2 className="oi-cdetails__title">{C.details}</h2>
              <Facts rows={details} />
            </div>
          )}
          <div className="oi-cbody__board">
            <div className="oi-shead" data-rv><h2>{C.leadership}</h2><p className="oi-shead__aux">{R.years.current}</p></div>
            {c.leaders.length ? (
              <div className="oi-cap">
                <ul className="oi-ldr-grid">
                  {c.leaders.map((l, i) => (
                    <li key={l.role + i} className={`oi-card oi-xcard oi-ldr ${i ? '' : 'is-lead'}`} data-glow data-rv style={css({ '--d': i % 3 })}>
                      <Face name={l.name} photo={l.photo ?? null} />
                      <div><h3 className="oi-who">{l.name}</h3><p className="oi-role">{l.role}</p></div>
                    </li>
                  ))}
                </ul>
                {c.leaders.length > 12 && <ShowAll />}
              </div>
            ) : <p className="oi-empty">{C.none.leaders}</p>}
          </div>
        </div>
      </section>

      <section className="oi-sec oi-work" data-tabs>
        <div className="wrap">
          <div className="oi-ntabs" role="tablist" aria-label={`Rotary Club of ${c.name}`} data-rv>
            {tabs.map((t, i) => <button key={t.key} type="button" role="tab" className={`oi-ntab ${i ? '' : 'is-on'}`} data-tab={t.key} aria-selected={!i} tabIndex={i ? -1 : 0}>{t.label}<b data-count>{num(t.n)}</b></button>)}
          </div>
          <div data-panel="projects" role="tabpanel" aria-label={C.tabs.projects} {...paged(projects.length)}>
            {projects.length ? <>
              <ul className="oi-pgrid">{newest(projects).map((p, i, a) => <ProjCard key={p.id} p={p} club={false} no={projNo(i, a.length)} />)}</ul>
              <More label={P.projects.more} />
            </> : <p className="oi-empty">{C.none.projects}</p>}
          </div>
          <div data-panel="service" role="tabpanel" aria-label={C.tabs.service} hidden {...paged(service.length)}>
            {service.length ? <>
              <ul className="oi-pgrid">{newest(service).map((p, i, a) => <ProjCard key={p.id} p={p} club={false} no={projNo(i, a.length)} />)}</ul>
              <More label={P.projects.more} />
            </> : <p className="oi-empty">{C.none.service}</p>}
          </div>
          <div data-panel="bulletins" role="tabpanel" aria-label={C.tabs.bulletins} hidden {...paged(c.bulletins.length)}>
            {c.bulletins.length ? <>
              <ul className="oi-docs oi-docs--3">{c.bulletins.map((b, i) => { const d = bulletinDoc(b, i); return <DocCard key={d.key} d={d} item={{ 'data-item': '' }} />; })}</ul>
              <More label="Show more newsletters" />
            </> : <p className="oi-empty">{C.none.bulletins}</p>}
          </div>
          <div data-panel="events" role="tabpanel" aria-label={C.tabs.events} hidden {...paged(c.events.length)}>
            {c.events.length ? <>
              <ul className="oi-evlist">{c.events.map(e => <EvRow key={eventId(e)} e={e} club={false} />)}</ul>
              <More label="Show more events" />
            </> : <p className="oi-empty">{C.none.events}</p>}
          </div>
        </div>
      </section>

      {c.members.length > 0 && (
        <section className="oi-sec oi-roster" data-filter data-page-size={C.pageSize}>
          <div className="wrap">
            <div className="oi-shead" data-rv>
              <h2>{C.members}</h2>
              <Search light label={C.searchLabel} total={c.members.length} />
            </div>
            <ul className="oi-roster__list">
              {c.members.map((p, i) => (
                <li key={p.name + i} className="oi-mem" data-item data-q={`${p.name} ${p.role}`.toLowerCase()} data-rv>
                  <Face name={p.name} photo={p.photo ?? null} />
                  <div><h3 className="oi-who">{p.name}</h3>{p.role && <p className="oi-role">{p.role}</p>}</div>
                </li>
              ))}
            </ul>
            <Empty text={C.empty} />
            <More label={C.more} />
          </div>
        </section>
      )}
    </>
  );
}

/* ---------- Project: title and figures on indigo; the cover carries its avenue tab and date disc; the story beside it ---------- */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title);
  const svc = p?.avenue === 'club';
  const list = listLink(svc ? 'service' : 'projects');
  const X = D.project;
  if (!p) return <Missing k="project" text={X.missing} back={{ href: list.href, label: X.back }} />;
  const L = P.projects.statLabels;
  const photos = p.gallery.length ? p.gallery : p.photo?.src ? [p.photo] : [];
  const [cover, ...rest] = photos;
  const t = dayMonth(p.date);
  const text = paras(p.description);
  const figs = svc ? [] : [
    { label: L.beneficiaries, value: num(p.beneficiaries) },
    { label: L.amount, value: lakh(p.amount) },
    { label: L.hours, value: num(p.hours) },
    ...(p.rotarians != null ? [{ label: 'Rotarians', value: num(p.rotarians) }] : [])
  ];
  const facts = factsOf([
    p.club && { icon: I.home, label: X.organiser, value: p.clubId ? <a href={clubHref(p.clubId)}>{clubName(p.club)}{I.arrow}</a> : clubName(p.club) },
    !cover && { icon: I.cal, label: 'Date', value: longDate(parseISO(p.date)) },
    !cover && { icon: I.ring, label: 'Avenue', value: avenueLabel(p.avenue) },
    p.location && { icon: I.pin, label: 'Location', value: p.location },
    p.focus && { icon: I.compass, label: 'Area of focus', value: p.focus }
  ]);
  return (
    <>
      <Head k="project" crumb={p.title} title={p.title} />

      <section className="oi-sec oi-pbody">
        <div className={`wrap oi-pbody__grid ${cover ? '' : 'is-solo'}`}>
          {cover && (
            /* a lone cover stays beside a long story; with photos under it, it scrolls with the page */
            <div className={`oi-pbody__media ${rest.length ? '' : 'is-sticky'}`}>
              <figure className="oi-cover" data-rv>
                <div className="oi-cover__img">
                  <Zoom ph={cover} group={`p-${p.id}`} cls="oi-cover__zoom" eager />
                  <span className="oi-tab">{avenueLabel(p.avenue)}</span>
                  {/* client: the date disc on the photo's top-right corner */}
                  <p className="oi-hub oi-cover__date"><b>{t.d}</b><span>{t.m} {t.y}</span></p>
                </div>
                {cover.alt && <div className="oi-cover__foot"><figcaption>{cover.alt}</figcaption></div>}
              </figure>
              {rest.length > 0 && (
                <div className="oi-pbody__photos">
                  <div className="oi-shead oi-shead--sm" data-rv><h2>{X.gallery}</h2><p className="oi-shead__aux">{num(photos.length)}</p></div>
                  <Gallery photos={rest} group={`p-${p.id}`} />
                </div>
              )}
            </div>
          )}
          <div className="oi-pbody__text" data-rv style={css({ '--d': 1 })}>
            {(text.length > 0 || figs.length > 0) && <h2 className="oi-h2">{X.about}</h2>}
            {/* the project's figures sit with its story (a Club Service report has none) */}
            {figs.length > 0 && (
              <ul className="oi-pfigs" aria-label={X.figures}>
                {figs.map(f => <li key={f.label}><b data-count>{f.value}</b><span>{f.label}</span></li>)}
              </ul>
            )}
            {text.length > 0 && <Copy text={text} />}
            {facts.length > 0 && <div className="oi-card oi-pfacts"><Facts rows={facts} /></div>}
            <div className="oi-acts oi-pacts"><ShareBtn p={p} word /><a className="pbtn" href={list.href}>{I.back}{svc ? list.label : X.back}</a></div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Event: a day dial in the head (the month's days round a ring, the event's day in gold) ---------- */
const DayDial = ({ iso, today }: { iso: string; today: boolean }) => {
  const d = parseISO(iso), t = dayMonth(iso);
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return (
    <div className={`oi-ddial oi-turn ${today ? 'is-today' : ''}`} style={css({ '--n': n, '--a': `${(((d.getDate() - 1) / n) * 360).toFixed(1)}deg` })} aria-hidden="true" data-rv>
      <i className="oi-ddial__mark" />
      <p className="oi-ddial__hub"><span>{today ? R.calendar.todayTag : weekdayName(d)}</span><b>{t.d}</b><span>{t.m} {t.y}</span></p>
    </div>
  );
};
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title);
  const cal = listLink('calendar');
  const X = D.event, C = R.calendar;
  if (!e) return <Missing k="event" text={X.missing} back={{ href: cal.href, label: X.back }} />;
  const d = parseISO(e.date);
  const isToday = e.date === C.today;
  const text = paras(e.description);
  const ct = e.contact;
  const facts = factsOf([
    { icon: I.cal, label: X.when, value: <>
      <span className="oi-facts__line"><b>{longDate(d)}</b>{isToday && <span className="oi-pill">{C.todayTag}</span>}</span>
      {e.time && <span className="oi-facts__sub">{e.time}</span>}
    </> },
    e.venue && { icon: I.pin, label: X.where, value: e.venue },
    { icon: I.home, label: X.organiser, value: <>
      {e.kind === 'district' || !e.club ? <span>{R.site.name}</span>
        : e.clubId ? <a href={clubHref(e.clubId)}>{clubName(e.club)}{I.arrow}</a> : <span>{clubName(e.club)}</span>}
      <span className="oi-facts__sub oi-facts__kind"><i className={`dot dot--${e.kind}`} aria-hidden="true" />{C.types.find(x => x.key === e.kind)?.label}</span>
    </> },
    ct && (ct.name || ct.email || ct.phone) && { icon: I.mail, label: X.contact, value: <>
      {ct.name && <span>{ct.name}</span>}
      {ct.email && <a href={`mailto:${ct.email}`}>{ct.email}</a>}
      {ct.phone && <a href={tel(ct.phone)}>{ct.phone}</a>}
    </> }
  ]);
  const main = [
    text.length > 0 && <div key="about" data-rv><h2 className="oi-h2">{X.about}</h2><Copy text={text} /></div>,
    e.gallery.length > 0 && <div key="photos"><div className="oi-shead oi-shead--sm" data-rv><h2>{D.project.gallery}</h2><p className="oi-shead__aux">{num(e.gallery.length)}</p></div><Gallery photos={e.gallery} group={`e-${e.id}`} /></div>
  ].filter(Boolean);
  return (
    <>
      <Head k="event" crumb={e.title} title={e.title} aside={<DayDial iso={e.date} today={isToday} />} />
      <section className={`oi-sec oi-ebody ${main.length ? '' : 'is-solo'}`}>
        <div className="wrap oi-ebody__grid">
          <div className="oi-card oi-efacts" data-rv>
            <Facts rows={facts} />
            <div className="oi-efacts__acts">
              {e.registration && <a className="btn-read" href={e.registration} target="_blank" rel="noopener">{X.register}{I.arrow}</a>}
              <a className="pbtn" href={cal.href}>{I.back}{X.back}</a>
            </div>
          </div>
          {main.length > 0 && <div className="oi-ebody__main">{main}</div>}
        </div>
      </section>
    </>
  );
}

/* ---------- Dignitary: a white portrait plate hanging from the head, the biography beside it ---------- */
function DignitaryPage() {
  const p = dignitaryProfile();
  useDocTitle(p?.name);
  const X = D.dignitary;
  const home: Crumb = { href: R.nav[0].href, label: X.back };
  if (!p) return <Missing k="dignitary" text={X.missing} back={home} />;
  const ok = p.type === 'dg' ? 'president' : 'dg';
  const o = X.item?.[ok] ?? R.dignitaries.byYear[R.years.current]?.[ok];
  const bio = paras(p.bio);
  const ct = p.contact;
  return (
    <>
      <Head k="dignitary" crumb={p.name} title={p.name} />
      <section className="oi-sec oi-dig">
        <div className={`wrap oi-dig__grid ${bio.length ? '' : 'is-solo'}`}>
          <div className="oi-dig__art oi-turn" data-rv>
            <Ring text={[p.role, p.term].filter(Boolean).join(' • ')} />
            <Face name={p.name} photo={p.photo} />
          </div>
          <div className="oi-dig__who" data-rv>
            <p className="oi-dig__role">{p.role}</p>
            {p.term && <p className="oi-dig__term">{p.term}</p>}
          </div>
          {bio.length > 0 && <div className="oi-dig__bio" data-rv><h2 className="oi-h2">{X.bio}</h2><Copy text={bio} /></div>}
          {(p.facts.length > 0 || ct?.email || ct?.phone) && (
            <div className="oi-dig__side">
              {p.facts.length > 0 && (
                <div className="oi-card oi-dcard" data-rv>
                  <h2>{X.details}</h2>
                  <dl className="oi-dl">{p.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
                </div>
              )}
              {(ct?.email || ct?.phone) && (
                <div className="oi-card oi-dcard" data-rv>
                  <h2>{X.contact}</h2>
                  <ul className="oi-clines">
                    {ct?.email && <li><a href={`mailto:${ct.email}`}><span aria-hidden="true">{I.mail}</span>{ct.email}</a></li>}
                    {ct?.phone && <li><a href={tel(ct.phone)}><span aria-hidden="true">{I.phone}</span>{ct.phone}</a></li>}
                  </ul>
                </div>
              )}
            </div>
          )}
          {o && (
            <div className="oi-card oi-other" data-glow data-rv>
              <Face name={o.name} photo={o.photo} />
              <div>
                <h2 className="oi-other__name">{o.name}</h2>
                <p className="oi-role">{o.role}</p>
                {o.term && <p className="oi-club-of">{o.term}</p>}
              </div>
              <a className="btn-read" href={dignitaryHref(ok)} aria-label={`${R.dignitaries.readMore}: ${o.name}`}>{R.dignitaries.readMore}{I.arrow}</a>
            </div>
          )}
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
  contact: () => <Contact />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />
};
const DETAIL: PageKey[] = ['club', 'project', 'event', 'dignitary'];

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`oi oi--${page} ${DETAIL.includes(page) ? 'oi--detail' : ''}`}>{BODY[page]({ year })}</main>;
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
      <Header top={<TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} menu />} />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
