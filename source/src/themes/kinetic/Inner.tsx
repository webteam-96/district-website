import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, monthMatrix, shortDate, longDate, monthLabel, parseISO, toISO, initials, monogram, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, AdminContent, type PageKey, type Project, projNo
} from '../../shared/inner';
import {
  D, paras, clubHref, projectHref, eventHref, dignitaryHref, useDocTitle,
  clubProfile, projectDetail, eventDetail, dignitaryProfile, type ClubProfile, type DetailKey, type Fact
} from '../../shared/detail';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* KINETIC inner pages. Each page is a scene in one of the homepage's colours: a short field with the title
   on one line and the page's numbers in candy hexagons, then the page's own composition. Everything in a
   page body is plain markup + the data attributes of shared/inner.js, so the plain-HTML pages are the same
   pages. Motion is CSS only (inner.css): scroll timelines where supported, data-rv reveals, hovers. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  go: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  chev: <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path {...sw} d="m5 8 5 5 5-5" /></svg>,
  mail: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  join: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="10" cy="8.5" r="3.4" /><path {...sw} d="M3.8 19.5c.7-3.3 3.1-5.2 6.2-5.2 1.6 0 3 .5 4.1 1.4" /><path {...sw} d="M18 13.5v6M15 16.5h6" /></svg>,
  pin: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  back: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M13 8H3m4-4L3 8l4 4" /></svg>,
  user: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8.5" r="3.6" /><path {...sw} d="M4.8 20c.8-3.6 3.7-5.6 7.2-5.6s6.4 2 7.2 5.6" /></svg>,
  web: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.3 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.3-3.4-8.5s1-6.1 3.4-8.5z" /></svg>
};
/* custom properties for style={} */
const v = (o: Record<string, string | number>) => o as CSSProperties;
const dmy = (iso: string) => shortDate(iso).split(' ') as [string, string, string];

/* ---------- page head: one-line title, its numbers in hexagons, lead, the page's controls ---------- */
type Fig = { n: string; label: string; tone: string; pre?: string; post?: string; top?: string; count?: boolean };
const Hexes = ({ figs, className = '' }: { figs: Fig[]; className?: string }) => (
  <ul className={`kx-figs ${className}`}>
    {figs.map((f, i) => (
      <li key={i} className={`kx-fig kx-${f.tone}`} style={v({ '--i': i })}>
        <span className="kx-fig__in">
          {f.top && <span className="kx-fig__l">{f.top}</span>}
          <span className="kx-fig__n" style={v({ '--len': String(f.n).length + (f.pre ? 1 : 0) + (f.post ? 1 : 0) })}>{f.pre && <small>{f.pre}</small>}{f.count === false ? <b>{f.n}</b> : <b data-count>{f.n}</b>}{f.post && <small>{f.post}</small>}</span>
          <span className="kx-fig__l">{f.label}</span>
        </span>
      </li>
    ))}
  </ul>
);

/* Home / this page: two levels everywhere, the detail pages too */
const Crumbs = ({ name }: { name: string }) => (
  <nav className="kx-crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a>
    <i aria-hidden="true" />
    <span aria-current="page">{name}</span>
  </nav>
);

/* title + breadcrumb only (no lead line); a head that holds the page's totals keeps them */
function Head({ k, figs, tools }: { k: PageKey; figs?: Fig[]; tools?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="kx-head" id="top">
      <div className="wrap kx-head__in">
        <Crumbs name={p.title} />
        <div className="kx-head__line">
          <h1 className="kx-title"><span>{p.title}</span></h1>
          {figs && <Hexes figs={figs} className={`kx-figs--${figs.length}`} />}
        </div>
        {tools && <div className="kx-tools">{tools}</div>}
      </div>
    </section>
  );
}

/* the live count stays for screen readers (and check.mjs); nothing is shown inside the bar */
const Search = ({ label, total }: { label: string; total: number }) => (
  <div className="kx-search">
    {I.search}
    <input type="search" data-f-search placeholder={label} aria-label={label} autoComplete="off" enterKeyHint="search" />
    <span className="sr-only" aria-live="polite"><span data-f-count>{num(total)}</span> of {num(total)}</span>
  </div>
);
type Chip = { v: string; label: ReactNode; aria?: string };
const Chips = ({ attr, all, items, label }: { attr: string; all: ReactNode; items: Chip[]; label: string }) => (
  <div className="kx-chips" role="group" aria-label={label} data-lenis-prevent>
    <button type="button" className="kx-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => <button key={x.v} type="button" className="kx-chip" data-f-chip={attr} data-v={x.v} aria-pressed="false" aria-label={x.aria}>{x.label}</button>)}
  </div>
);
const Empty = ({ text }: { text: string }) => <p className="kx-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="kx-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
/* a photo that opens full size in the shared lightbox (shared/inner.js); one group = one gallery */
const Ph = ({ photo, group, className, eager }: { photo: Photo; group: string; className?: string; eager?: boolean }) => (
  <a className={className} href={photo.src} data-lightbox={group} data-caption={photo.alt || undefined}>
    <img src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} loading={eager ? undefined : 'lazy'} />
  </a>
);
/* Share: the system sheet on phones, a small menu elsewhere (shared/inner.js); a second, smaller control beside Read more */
const Share = ({ p }: { p: { id: number | string; title: string } }) => (
  <button type="button" className="kx-share" data-share data-share-url={projectHref(p)} data-share-title={p.title} aria-haspopup="menu" aria-expanded="false" aria-label={`Share: ${p.title}`}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
    <span>Share</span>
  </button>
);
/* CSS-only "show all" (inner.css): items past the cap carry .is-x until the box is ticked */
const ShowAll = ({ n }: { n: number }) => (
  <label className="kx-all btn-go">
    <input type="checkbox" />
    <span className="kx-all__more">Show all {num(n)}</span>
    <span className="kx-all__less">Show fewer</span>
  </label>
);

/* ================= About: title, breadcrumb and the admin's one content field ================= */
function About() {
  return (
    <>
      <Head k="about" />
      <section className="kx-about">
        <div className="wrap"><AdminContent className="kx-prose" /></div>
      </section>
    </>
  );
}

/* ================= District Committee: the Governor's duo, then every committee as rows of portraits ================= */
type CommitteeMember = ReturnType<typeof committee>[number]['members'][number];
const MemberCard = ({ m, group, lead }: { m: CommitteeMember; group: string; lead?: boolean }) => (
  <li className={`kx-mem${lead ? ' kx-mem--lead' : ''}`} data-item data-q={m.q} data-group={group}>
    <span className="kx-av">
      {m.photo ? <img src={m.photo.src} alt={m.photo.alt} width={m.photo.w} height={m.photo.h} loading={lead ? undefined : 'lazy'} /> : <span aria-hidden="true">{m.initials || iniOf(m.name)}</span>}
    </span>
    <span className="kx-mem__t">
      <h3 className="kx-mem__name">{m.name}</h3>
      <span className="kx-mem__role">{m.role}</span>
      {m.club && <span className="kx-mem__club">{clubName(m.club)}</span>}
    </span>
  </li>
);

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  return (
    <div data-filter>
      <Head
        k="committee"
        figs={[{ n: num(total), label: 'members', tone: 'c6' }]}
        tools={<>
          <Search label={P.committee.searchLabel} total={total} />
          <Chips attr="group" all="All" label="Committee" items={groups.map(g => ({ v: g.key, label: <>{g.title}<b>{num(g.members.length)}</b></> }))} />
        </>}
      />
      <section className="kx-body">
        <div className="wrap">
          <div className="kx-roster">
            {groups.map((g, gi) => {
              /* the first two of the first committee (the Governor and the one beside them) meet in the middle */
              const lead = gi === 0 ? g.members.slice(0, 2) : [];
              const rest = g.members.slice(lead.length);
              return (
                <section key={g.key} className={`kx-cg kx-t${gi % 6}`} data-f-group data-rv aria-labelledby={`kx-${g.key}`}>
                  <h2 className="kx-cg__name" id={`kx-${g.key}`}><span>{g.title}</span><b data-f-group-count>{g.members.length}</b></h2>
                  {lead.length > 0 && <ul className="kx-duo">{lead.map((m, i) => <MemberCard key={i} m={m} group={g.key} lead />)}</ul>}
                  {rest.length > 0 && <ul className="kx-faces">{rest.map((m, i) => <MemberCard key={i} m={m} group={g.key} />)}</ul>}
                  {/* a committee shows its first row; the rest on request (CSS only, inner.css); a search or a committee chip shows all */}
                  {rest.length > 4 && <ShowAll n={g.members.length} />}
                </section>
              );
            })}
          </div>
          <Empty text={P.committee.empty} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Finder: hex-monogram cards, coloured by meeting day ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  const tone = (d?: string) => { const i = f.days.indexOf(d ?? ''); return i < 0 ? 'dx' : `d${i}`; };
  return (
    <div data-filter data-page-size={f.pageSize}>
      <Head
        k="finder"
        figs={[{ n: num(list.length), label: 'clubs', tone: 'c5' }]}
        tools={<>
          <Search label={f.searchLabel} total={list.length} />
          <Chips
            attr="day" all={f.anyDay} label={f.dayLabel}
            items={f.days.map((d, i) => {
              const n = list.filter(c => c.day === d).length;
              return { v: d, aria: `${d} (${n})`, label: <><i className={`kx-hx kx-d${i}`} aria-hidden="true" />{d.slice(0, 3)}<b>{n}</b></> };
            })}
          />
        </>}
      />
      <section className="kx-body">
        <div className="wrap">
          <ul className="kx-clubs">
            {list.map(c => (
              <li key={c.id} className={`kx-club kx-${tone(c.day)}`} data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <span className="kx-club__hex" aria-hidden="true"><span>{c.initials}</span></span>
                <div className="kx-club__t">
                  <h3><small>Rotary Club of </small>{c.name}</h3>
                  {/* meeting day, president, president's phone: three fixed lines, so cards stay aligned when one is missing
                      (the venue is still searched through data-q and shown on the club's own page) */}
                  <p className="kx-club__facts">
                    <span>{c.day && <><i className="kx-hx" aria-hidden="true" />{c.day}</>}</span>
                    <span>{c.president && <>{I.user}<span className="sr-only">President: </span>{c.president}</>}</span>
                    <span>{c.phone && <a className="kx-club__tel" href={c.tel ? `tel:${c.tel}` : telOf(c.phone)}>{I.phone}<span className="sr-only">Phone: </span>{c.phone}</a>}</span>
                  </p>
                </div>
                <a className="kx-club__go" href={c.href} aria-label={`${f.visit}: Rotary Club of ${c.name}`}>{I.go}</a>
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

/* ================= Club Projects: the totals honeycomb, then one colour panel per avenue ================= */
const L = P.projects.statLabels;
const totalFigs = (t: ReturnType<typeof totals>): Fig[] => [
  { n: num(t.projects), label: L.projects, tone: 'c1' },
  { n: num(t.beneficiaries), label: L.beneficiaries, tone: 'c4' },
  { pre: '₹', n: R.fmt.num(t.amount, 1), post: ' L', label: L.amount, tone: 'c3' },
  { n: num(t.hours), label: L.hours, tone: 'c2' }
];
const figsOf = (p: Project): Fig[] => [
  { n: num(p.beneficiaries), label: L.beneficiaries, tone: 'c4' },
  { pre: '₹', n: R.fmt.num(p.amount, 1), post: ' L', label: L.amount, tone: 'c3' },
  { n: num(p.hours), label: L.hours, tone: 'c2' }
];
const qOf = (p: Project) => `${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase();

/* a listing card: its number in a hexagon (a CSS counter: #1 is the newest shown, inner.css), no figures;
   "Read more" is the card's action (its link covers the card), the photo opens full size, Share is the second control */
function ProjectCard({ p, extra, no }: { p: Project; extra?: boolean; no?: string }) {
  return (
    <li className={`kx-proj${extra ? ' is-x' : ''}`} data-item data-no={no} data-q={qOf(p)} data-avenue={p.avenue} data-rv>
      <Ph className="kx-proj__img" photo={p.photo} group={`p-${p.id}`} />
      <div className="kx-proj__body">
        <p className="kx-proj__meta"><time dateTime={p.date}>{shortDate(p.date)}</time> · {clubName(p.club)}</p>
        <h3 className="kx-proj__title">{p.title}</h3>
        <p className="kx-proj__sum">{p.summary}</p>
        <div className="kx-proj__acts">
          <a className="btn-go kx-proj__go" href={projectHref(p)} aria-label={`Read more: ${p.title}`}>Read more{I.go}</a>
          <Share p={p} />
        </div>
      </div>
    </li>
  );
}
const newest = (a: Project, b: Project) => b.date.localeCompare(a.date);

function Projects() {
  const x = P.projects;
  const list = projectsOf();
  /* the avenues in their usual order, then any the data adds */
  const keys = [...new Set([...x.avenues.filter(a => a.key !== 'club').map(a => a.key), ...list.map(p => p.avenue)])];
  return (
    <div data-filter>
      <Head
        k="projects"
        figs={totalFigs(totals(list))}
        tools={<>
          <Search label={x.searchLabel} total={list.length} />
          <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.filter(a => a.key !== 'club').map(a => ({ v: a.key, label: a.label }))} />
        </>}
      />
      <section className="kx-body">
        <div className="wrap kx-avs">
          {keys.map(k => {
            const items = list.filter(p => p.avenue === k).sort(newest);
            return items.length ? (
              <section key={k} className={`kx-avn kx-avn--${k}`} data-f-group aria-labelledby={`kx-av-${k}`}>
                <div className="kx-avn__head">
                  <h2 className="kx-avn__title" id={`kx-av-${k}`}>{avenueLabel(k)}</h2>
                  <b className="kx-avn__n" data-f-group-count>{items.length}</b>
                </div>
                <ul className="kx-projs">{items.map((p, i, a) => <ProjectCard key={p.id} p={p} no={projNo(i, a.length)} />)}</ul>
                {/* a real year holds hundreds: each avenue shows its latest three, the rest on request (CSS, inner.css) */}
                {items.length > 3 && <ShowAll n={items.length} />}
              </section>
            ) : null;
          })}
          <Empty text={x.empty} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Service: one scene per project, a chapter each ================= */
function Service() {
  const x = P.projects;
  const list = projectsOf('club');
  const t = totals(list);
  /* the counter strip, as production labels it */
  const strip: Fig[] = [
    { n: num(t.projects), label: 'Projects', tone: 'c1' },
    { n: num(new Set(list.map(p => p.club)).size), label: 'Clubs Involved', tone: 'c5' },
    { n: num(t.beneficiaries), label: 'Beneficiaries', tone: 'c4' },
    { n: num(t.hours), label: 'Volunteer Hours', tone: 'c2' },
    { pre: '₹', n: R.fmt.num(t.amount, 1), post: ' L', label: 'Amount Spent', tone: 'c3' }
  ];
  return (
    <>
      <Head k="service" />
      <div className="kx-chapters" data-filter data-page-size={x.pageSize}>
        <ol className="kx-chaps">
          {list.map((p, i) => (
            <li key={p.id} className={`kx-chap kx-s${i % 4}`} data-item data-q={qOf(p)} data-avenue={p.avenue}>
              <div className="wrap kx-chap__in" data-rv>
                <p className="kx-chap__meta"><time dateTime={p.date}>{shortDate(p.date)}</time> · {clubName(p.club)}</p>
                <h2 className="kx-chap__title kx-stretch"><a href={projectHref(p)}>{p.title}</a></h2>
                <Ph className="kx-chap__img" photo={p.photo} group={`p-${p.id}`} eager={i === 0} />
                <p className="kx-chap__sum">{p.summary}</p>
                <Hexes figs={figsOf(p)} className="kx-chap__nums" />
                <Share p={p} />
              </div>
            </li>
          ))}
        </ol>
        <div className="wrap"><Empty text={x.empty} /><More label={x.more} /></div>
      </div>
    </>
  );
}

/* ================= District Calendar: month tabs, then the month as a week accordion ================= */
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const range = (w: Date[]) => {
  const [ad, am] = dmy(toISO(w[0])), [bd, bm] = dmy(toISO(w[w.length - 1]));
  return am === bm ? `${ad} – ${bd} ${bm}` : `${ad} ${am} – ${bd} ${bm}`;
};

function Month({ m, open }: { m: ReturnType<typeof calMonths>[number]; open: boolean }) {
  const C = R.calendar;
  const by = new Map(monthEntries(m.date).map(d => [d.iso, d.list]));
  const all = [...by.values()].flat();
  const inMonth = (d: Date) => d.getMonth() === m.date.getMonth();
  const weeks = chunk(monthMatrix(m.date, C.weekStartsOn), 7).filter(w => w.some(inMonth));
  /* today's week opens; in other months the first week with something on it */
  const todayAt = weeks.findIndex(w => w.some(d => toISO(d) === C.today));
  const openAt = todayAt >= 0 ? todayAt : Math.max(0, weeks.findIndex(w => w.some(d => inMonth(d) && by.has(toISO(d)))));
  const typeLabel = (k: string) => C.types.find(t => t.key === k)?.label ?? k;
  return (
    <div className="kx-mp" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      <div className="kx-mp__head">
        <h2 className="kx-mp__title kx-stretch">{m.label}</h2>
        {all.length > 0 && (
          <Chips
            attr="type" all={<>All<b>{num(all.length)}</b></>} label="Show"
            items={C.types.map(t => ({ v: t.key, label: <><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{num(all.filter(e => e.type === t.key).length)}</b></> }))}
          />
        )}
      </div>
      {all.length > 0 && (
        <div className="kx-weeks">
          {weeks.map((w, wi) => (
            <details key={wi} className="kx-wk" name={`kx-${m.key}`} open={wi === openAt} data-f-group data-rv>
              <summary className="kx-wk__bar">
                <span className="kx-wk__range">{range(w)}</span>
                <span className="kx-wk__mini" aria-hidden="true">
                  {/* the week's days at a glance; in-month days are filter items too, so a type chip
                      leaves only the days that have that type, in every week of the month */}
                  {w.map((d, di) => {
                    const iso = toISO(d), list = by.get(iso) ?? [];
                    return (
                      <span key={di} className={`kx-mini${inMonth(d) ? '' : ' is-out'}${iso === C.today ? ' is-today' : ''}`} style={v({ '--wd': di + 1 })} {...(inMonth(d) ? { 'data-item': '', 'data-type': typesOf(list).join('|') } : {})}>
                        <small>{C.weekdays[di].slice(0, 1)}</small><b>{d.getDate()}</b>
                        <span className="kx-mini__dots">{typesOf(list).map(k => <i key={k} className={`dot dot--${k}`} />)}</span>
                      </span>
                    );
                  })}
                </span>
                <span className="kx-wk__chev" aria-hidden="true">{I.chev}</span>
              </summary>
              <ol className="kx-wk__days">
                {w.map((d, di) => {
                  if (!inMonth(d)) return null;
                  const iso = toISO(d), list = by.get(iso) ?? [], today = iso === C.today;
                  return (
                    <li key={di} className={`kx-day${today ? ' is-today' : ''}`} style={v({ '--wd': di + 1 })} data-item data-type={typesOf(list).join('|')} aria-current={today ? 'date' : undefined}>
                      <p className="kx-day__d"><b>{d.getDate()}</b><span>{C.weekdays[di]}</span>{today && <em className="tag-today">{C.todayTag}</em>}</p>
                      {list.length ? (
                        <ul className="kx-day__list" data-lenis-prevent>
                          {list.map((e, k) => {
                            const t = entryText(e);
                            const body = <><span className="sr-only">{typeLabel(e.type)}: </span><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</>;
                            /* club and district events open their own page; birthdays and anniversaries do not */
                            return <li key={k} className={`kx-ent kx-ent--${e.type}`} data-type={e.type}>{e.type === 'club' || e.type === 'district' ? <a className="kx-ent__a" href={eventHref(e)}>{body}</a> : body}</li>;
                          })}
                        </ul>
                      ) : <p className="kx-day__none">{C.emptyDay}</p>}
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>
      )}
      <p className="kx-empty" data-f-empty hidden={all.length > 0}>{P.calendar.emptyMonth}</p>
    </div>
  );
}

function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  const [d, mon, yr] = dmy(C.today);
  return (
    <div data-tabs>
      <Head
        k="calendar"
        figs={[{ top: C.todayTag, n: d, label: `${mon} ${yr}`, tone: 'hot', count: false }]}
        tools={
          <div className="kx-months" role="tablist" aria-label={P.calendar.monthLabel} data-lenis-prevent>
            {months.map(m => {
              const on = m.key === open;
              return (
                <button key={m.key} type="button" role="tab" className={`kx-month${on ? ' is-on is-now' : ''}`} data-tab={m.key} aria-selected={on} tabIndex={on ? 0 : -1}>
                  <b>{m.short}</b><small>{m.date.getFullYear()}</small>
                </button>
              );
            })}
          </div>
        }
      />
      <section className="kx-body">
        <div className="wrap">{months.map(m => <Month key={m.key} m={m} open={m.key === open} />)}</div>
      </section>
    </div>
  );
}

/* ================= Newsletters: big dated rows, text only ================= */
function Issue({ date, title, by, pdf, q, i, extra }: { date: string; title: string; by: string; pdf: string; q?: string; i: number; extra?: boolean }) {
  const [d, mon, yr] = dmy(date);
  return (
    <li className={`kx-issue${extra ? ' is-x' : ''}`} data-rv style={v({ '--n': Math.min(i, 4) })} {...(q ? { 'data-item': '', 'data-q': q } : {})}>
      <time className="kx-issue__date" dateTime={date}><b>{d}</b><span>{mon} {yr}</span></time>
      <div className="kx-issue__main"><h3>{title}</h3><p>{by}</p></div>
      <div className="kx-issue__acts">
        <a className="kx-btn kx-btn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
        <a className="kx-btn" href={pdf} download>{R.press.actions.download}</a>
      </div>
    </li>
  );
}

function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <Head k="newsletters" />
      <section className="kx-body">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} className="kx-press" data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash data-filter>
              <div className="kx-press__bar">
                <div className="kx-ntabs" role="tablist" aria-label={R.press.title}>
                  <button type="button" role="tab" className="kx-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="kx-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                {y.bulletins.length > 0 && <Search label={N.searchLabel} total={y.bulletins.length} />}
              </div>
              <div data-panel="club" role="tabpanel" aria-label={N.club}>
                {y.bulletins.length ? (
                  <ol className="kx-issues">
                    {y.bulletins.map((b, i) => <Issue key={i} i={i} date={b.date} title={b.title} by={clubName(b.club)} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ol>
                ) : <p className="kx-empty">{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>}
                {y.bulletins.length > 0 && <Empty text="No bulletin matches your search." />}
              </div>
              <div data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                {y.gml.length ? (
                  <ol className="kx-issues">
                    {y.gml.map((g, i) => <Issue key={i} i={i} date={g.date} title={g.month} by={g.governor} pdf={g.pdf} />)}
                  </ol>
                ) : <p className="kx-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: four doors, then one wide form ================= */
function Contact() {
  const c = P.contact;
  const ct = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const doors = [
    { href: `mailto:${ct.email}`, title: c.office, text: ct.email, icon: I.mail, tone: 'c2' },
    { href: `tel:${ct.tel}`, title: dg ? `${dg.name}, ${ct.label}` : ct.label, text: ct.phoneDisplay, icon: I.phone, tone: 'c3' },
    { href: R.ctas.join.href, title: c.join.title, text: c.join.text, icon: I.join, tone: 'c1', ext: true },
    { href: pageInfo('finder').file, title: c.finder.title, text: c.finder.text, icon: I.pin, tone: 'c4' }
  ];
  return (
    <>
      <Head k="contact" />
      <section className="kx-body">
        <div className="wrap kx-contact">
          <ul className="kx-doors">
            {doors.map((d, i) => (
              <li key={i} className={`kx-door kx-${d.tone}`} data-rv style={v({ '--n': i })}>
                <a href={d.href} {...(d.ext ? { target: '_blank', rel: 'noopener' } : {})}>
                  <span className="kx-door__hex" aria-hidden="true">{d.icon}</span>
                  <span className="kx-door__t">{d.title}</span>
                  <span className="kx-door__v">{d.text}</span>
                  <span className="kx-door__go" aria-hidden="true">{I.go}</span>
                </a>
              </li>
            ))}
          </ul>
          <form className="kx-form" data-demo-form data-rv>
            <div className="kx-form__head">
              <h2 className="kx-form__title">{c.title}</h2>
              <p>{c.hours}</p>
            </div>
            <div className="kx-form__grid">
              <div className="kx-form__col">
                <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
                <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
                <label><span>{F.club}</span><input name="club" /></label>
              </div>
              <label className="kx-form__msg"><span>{F.message}</span><textarea name="message" rows={8} required /></label>
            </div>
            <div className="kx-form__foot">
              <button type="submit" className="btn-go">{F.send}{I.go}</button>
              <p className="kx-form__note">{c.formNote}</p>
            </div>
            <p className="kx-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
        </div>
      </section>
    </>
  );
}

/* ================= detail pages: one item each (shared/detail.tsx) =================
   The page top is the breadcrumb (Home / the item) and the item's name on a short scene field (with the club's
   monogram or the project's figures where it has them); then the item told in the homepage's language: scenes
   that fade into each other, numbers in candy hexagons, white cards, big 26px photos, portraits meeting in the
   middle. Long lists stop at a cap behind the CSS-only "Show all"; the club roster pages with shared/inner.js. */
const CAP = 6;
const SHOTS = 8;
const dayTone = (d?: string) => { const i = P.finder.days.indexOf(d ?? ''); return i < 0 ? 'kx-dx' : `kx-d${i}`; };
const monoOf = (name: string) => name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const iniOf = (name: string) => initials(name) || name.trim().slice(0, 1).toUpperCase();
const telOf = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`;
const webOf = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);
const listedClub = (id: string) => clubs().find(c => String(c.id) === String(id));
const plate = (p: { photo: Photo | null; name: string }): Photo => p.photo ?? { src: monogram(p.name), w: 480, h: 600, alt: '' };

/* a person: their photo in a hexagon, or their initials */
const Av = ({ name, photo, className = '' }: { name: string; photo?: Photo | null; className?: string }) => (
  <span className={`kx-av ${className}`.trim()}>
    {photo ? <img src={photo.src} alt="" width={photo.w} height={photo.h} loading="lazy" /> : <span aria-hidden="true">{iniOf(name)}</span>}
  </span>
);

/* pills: plain facts, or links with an arrow */
type Pill = { v: ReactNode; href?: string; ext?: boolean; tone?: string; icon?: ReactNode; hot?: boolean };
function Pills({ items }: { items: (Pill | false | '' | null | undefined)[] }) {
  const list = items.filter((x): x is Pill => !!x);
  if (!list.length) return null;
  return (
    <ul className="kx-pills">
      {list.map((x, i) => {
        const body = <>{x.tone && <i className={x.tone} aria-hidden="true" />}{x.icon}<b>{x.v}</b>{x.href && <span className="kx-pill__go" aria-hidden="true">{I.go}</span>}</>;
        return (
          <li key={i}>
            {x.href
              ? <a className="kx-pill" href={x.href} {...(x.ext ? { target: '_blank', rel: 'noopener' } : {})}>{body}</a>
              : <span className={`kx-pill${x.hot ? ' is-hot' : ''}`}>{body}</span>}
          </li>
        );
      })}
    </ul>
  );
}
const Facts = ({ items }: { items: Fact[] }) => (
  <dl className="kx-dl">{items.map((f, i) => <div key={i}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
);
const Copy = ({ id, title, text, aside }: { id: string; title: string; text: string[]; aside?: ReactNode }) => (
  <section className="kx-copy" aria-labelledby={id}>
    <div className="kx-copy__head"><h2 className="kx-sec__t kx-stretch" id={id}>{title}</h2>{aside}</div>
    {text.map((t, i) => <p key={i}>{t}</p>)}
  </section>
);
const Back = ({ href, label }: { href: string; label: string }) => <a className="kx-back" href={href}>{I.back}{label}</a>;

/* the page top: Home / the item, then [monogram] name [figures] on one line; nothing under it */
function ItemHead({ name, title, mark, figs }: { name: string; title?: ReactNode; mark?: ReactNode; figs?: Fig[] }) {
  return (
    <section className="kx-head kx-head--item" id="top">
      <div className="wrap kx-head__in">
        <Crumbs name={name} />
        <div className="kx-head__line">
          {mark && <span className="kx-mark">{mark}</span>}
          <h1 className="kx-title"><span>{title ?? name}</span></h1>
          {figs && figs.length > 0 && <Hexes figs={figs} className={`kx-figs--${figs.length}`} />}
        </div>
      </div>
    </section>
  );
}

/* the id matched nothing */
function Missing({ k, list, text, back }: { k: DetailKey; list?: PageKey; text: string; back: string }) {
  return (
    <section className="kx-head kx-miss" id="top">
      <div className="wrap kx-head__in">
        <Crumbs name={pageInfo(k).title} />
        <div className="kx-miss__in">
          <span className="kx-miss__comb" aria-hidden="true"><i className="kx-c1" /><i className="kx-c2" /><i className="kx-c4" /></span>
          <h1 className="kx-title kx-miss__t"><span>{text}</span></h1>
          <a className="btn-go" href={list ? pageInfo(list).file : R.nav[0].href}>{I.back}{back}</a>
        </div>
      </div>
    </section>
  );
}

/* a club, as its Club Finder card (the whole card one link). `live`: the page's live loader does not fill the club
   list, so its meeting day and place are not read from the sample (name and link only) */
function ClubCard({ name, id, live }: { name: string; id: string; live?: boolean }) {
  const c = id && !live ? listedClub(id) : undefined;
  return (
    <div className={`kx-club ${dayTone(c?.day)}`} data-rv>
      <span className="kx-club__hex" aria-hidden="true"><span>{c?.initials ?? monoOf(name)}</span></span>
      <div className="kx-club__t">
        <h3><small>Rotary Club of </small>{name}</h3>
        {(c?.day || c?.place) && <p className="kx-club__meta">{c?.day && <b>{c.day}</b>}{c?.day && c?.place && ' · '}{c?.place}</p>}
      </div>
      {id && <a className="kx-club__go" href={clubHref(id)} aria-label={`${P.finder.visit}: Rotary Club of ${name}`}>{I.go}</a>}
    </div>
  );
}

/* a person as a portrait card (the committee's cards): photo or initials, name, role */
function Face({ name, role, photo, extra }: { name: string; role?: string; photo?: Photo | null; extra?: boolean }) {
  return (
    <li className={`kx-mem${extra ? ' is-x' : ''}`}>
      <span className="kx-av">{photo ? <img src={photo.src} alt="" width={photo.w} height={photo.h} loading="lazy" /> : <span aria-hidden="true">{iniOf(name)}</span>}</span>
      <span className="kx-mem__t">
        <h3 className="kx-mem__name">{name}</h3>
        {role && <span className="kx-mem__role">{role}</span>}
      </span>
    </li>
  );
}

/* photos in full colour, four to a row; past eight they wait behind "Show all" */
function Gallery({ photos, title, group }: { photos: Photo[]; title: string; group: string }) {
  return (
    <section className="kx-gal" aria-labelledby="kx-gal-t">
      <div className="wrap kx-cap">
        <div className="kx-sec__head">
          <h2 className="kx-sec__t kx-stretch" id="kx-gal-t">{title}</h2>
          <b className="kx-n">{num(photos.length)}</b>
        </div>
        <ul className={`kx-shots kx-shots--${Math.min(photos.length, 4)}`}>
          {photos.map((ph, i) => (
            <li key={i} className={`kx-shot${i >= SHOTS ? ' is-x' : ''}`} data-rv style={v({ '--n': i % 4 })}>
              <Ph photo={ph} group={group} />
              {ph.alt && <p aria-hidden="true">{ph.alt}</p>}
            </li>
          ))}
        </ul>
        {photos.length > SHOTS && <ShowAll n={photos.length} />}
      </div>
    </section>
  );
}

/* an event as a dated row (the newsletters' rows), the whole row one link */
function EventRow({ e, i, extra }: { e: CalEntry; i: number; extra?: boolean }) {
  const [d, mon, yr] = dmy(e.date);
  const today = e.date === R.calendar.today;
  return (
    <li className={`kx-issue kx-issue--ev${today ? ' is-today' : ''}${extra ? ' is-x' : ''}`} data-rv style={v({ '--n': Math.min(i, 4) })}>
      <time className="kx-issue__date" dateTime={e.date}>{today && <em className="tag-today">{R.calendar.todayTag}</em>}<b>{d}</b><span>{mon} {yr}</span></time>
      <div className="kx-issue__main">
        <h3><a href={eventHref(e)}>{e.title}</a></h3>
        {(e.time || e.venue) && <p>{[e.time, e.venue].filter(Boolean).join(' · ')}</p>}
      </div>
      <span className="kx-issue__go" aria-hidden="true">{I.go}</span>
    </li>
  );
}

/* ---------- Club profile: sky head with the club's monogram; an ultramarine snapshot (details + honeycomb);
   its board as portraits and its roster on mint; its projects, newsletters and events on lavender ---------- */
const glanceFigs = (g: ClubProfile['glance']): Fig[] => [
  { n: num(g.projects), label: L.projects, tone: 'c1' },
  { n: num(g.hours), label: L.hours, tone: 'c2' },
  { pre: '₹', n: R.fmt.num(g.amount, 1), post: ' L', label: L.amount, tone: 'c3' },
  { n: num(g.beneficiaries), label: L.beneficiaries, tone: 'c4' },
  { n: num(g.members), label: D.club.members, tone: 'c6' }
];

function ClubPage() {
  const c = clubProfile();
  const T = D.club;
  const name = c ? `Rotary Club of ${c.name}` : null;
  useDocTitle(name);
  if (!c || !name) return <Missing k="club" list="finder" text={T.missing} back={T.back} />;
  const listed = listedClub(c.id);
  const day = listed?.day ?? c.meeting.day;
  const when = [day, c.meeting.time].filter(Boolean).join(' · ');
  const facts: Fact[] = [
    ...(when ? [{ label: D.event.when, value: when }] : []),
    ...(c.meeting.place ? [{ label: D.event.where, value: c.meeting.place }] : []),
    ...c.details
  ];
  const ct = c.contact ?? {};
  const links = ([
    ct.email && { v: ct.email, href: `mailto:${ct.email}`, icon: I.mail },
    ct.phone && { v: ct.phone, href: telOf(ct.phone), icon: I.phone },
    ct.web && { v: ct.web.replace(/^https?:\/\//i, '').replace(/\/$/, ''), href: webOf(ct.web), icon: I.web, ext: true }
  ] as (Pill | '' | undefined)[]).filter((x): x is Pill => !!x);
  const projects = [...c.projects].sort(newest);
  const tabs = [
    { k: 'projects' as const, n: projects.length },
    { k: 'bulletins' as const, n: c.bulletins.length },
    { k: 'events' as const, n: c.events.length }
  ];
  const card = facts.length > 0 || links.length > 0;
  return (
    <>
      <ItemHead
        name={name}
        mark={<span className={`kx-av ${dayTone(day)}`} aria-hidden="true"><span>{listed?.initials ?? monoOf(c.name)}</span></span>}
      />
      <section className="kx-sc kx-tn-ultra" style={v({ '--prev': 'var(--kx-hd)' })} aria-labelledby="kx-glance-t">
        <div className={`wrap kx-glance${card ? '' : ' is-solo'}`}>
          {card && (
            <div className="kx-card" data-rv>
              <h2 className="kx-sub">{T.details}</h2>
              {facts.length > 0 && <Facts items={facts} />}
              <Pills items={links} />
            </div>
          )}
          <div className="kx-glance__figs" data-rv>
            <h2 className="kx-sec__t kx-stretch" id="kx-glance-t">{T.glance}</h2>
            <Hexes figs={glanceFigs(c.glance)} className="kx-comb" />
          </div>
        </div>
      </section>
      <div className="kx-sc kx-tn-mint" style={v({ '--prev': 'var(--t-ultra)' })}>
        <div className="wrap kx-people">
          <section className="kx-cap" aria-labelledby="kx-lead-t">
            <div className="kx-sec__head">
              <h2 className="kx-sec__t kx-stretch" id="kx-lead-t">{T.leadership}</h2>
              <span className="kx-tag">{R.years.current}</span>
            </div>
            {c.leaders.length ? (
              <ul className="kx-faces kx-t0">
                {c.leaders.map((m, i) => <Face key={i} name={m.name} role={m.role} photo={m.photo} extra={i >= CAP} />)}
              </ul>
            ) : <p className="kx-empty">{T.none.leaders}</p>}
            {c.leaders.length > CAP && <ShowAll n={c.leaders.length} />}
          </section>
          <section className="kx-roll" aria-labelledby="kx-roll-t" data-filter data-page-size={T.pageSize}>
            <div className="kx-sec__head">
              <h2 className="kx-sec__t kx-stretch" id="kx-roll-t">{T.members}</h2>
              <b className="kx-n">{num(c.members.length)}</b>
              {c.members.length > 0 && <Search label={T.searchLabel} total={c.members.length} />}
            </div>
            {c.members.length ? (
              <ul className="kx-folk">
                {c.members.map((m, i) => (
                  <li key={i} className="kx-person kx-person--s" data-item data-q={`${m.name} ${m.role}`.toLowerCase()} data-rv>
                    <Av name={m.name} photo={m.photo} />
                    <span className="kx-person__t"><b>{m.name}</b>{m.role && <span>{m.role}</span>}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="kx-empty">No members listed yet.</p>}
            {c.members.length > 0 && <><Empty text={T.empty} /><More label={T.more} /></>}
          </section>
        </div>
      </div>
      <section className="kx-sc kx-tn-lav" style={v({ '--prev': 'var(--t-mint)' })} aria-label={tabs.map(t => T.tabs[t.k]).join(', ')}>
        <div className="wrap" data-tabs>
          <div className="kx-ntabs kx-ptabs" role="tablist" aria-label={name}>
            {tabs.map((t, i) => (
              <button key={t.k} type="button" role="tab" className={`kx-ntab${i ? '' : ' is-on'}`} data-tab={t.k} aria-selected={i === 0} tabIndex={i ? -1 : 0}>{T.tabs[t.k]}<b>{num(t.n)}</b></button>
            ))}
          </div>
          <div className="kx-cap" data-panel="projects" role="tabpanel" aria-label={T.tabs.projects}>
            {projects.length
              ? <ul className="kx-projs kx-projs--club">{projects.map((p, i, a) => <ProjectCard key={p.id} p={p} extra={i >= CAP} no={projNo(i, a.length)} />)}</ul>
              : <p className="kx-empty">{T.none.projects}</p>}
            {projects.length > CAP && <ShowAll n={projects.length} />}
          </div>
          <div className="kx-cap" data-panel="bulletins" role="tabpanel" aria-label={T.tabs.bulletins} hidden>
            {c.bulletins.length
              ? <ol className="kx-issues">{c.bulletins.map((b, i) => <Issue key={i} i={i} date={b.date} title={b.title} by={clubName(b.club)} pdf={b.pdf} extra={i >= CAP} />)}</ol>
              : <p className="kx-empty">{T.none.bulletins}</p>}
            {c.bulletins.length > CAP && <ShowAll n={c.bulletins.length} />}
          </div>
          <div className="kx-cap" data-panel="events" role="tabpanel" aria-label={T.tabs.events} hidden>
            {c.events.length
              ? <ol className="kx-issues">{c.events.map((e, i) => <EventRow key={i} e={e} i={i} extra={i >= CAP} />)}</ol>
              : <p className="kx-empty">{T.none.events}</p>}
            {c.events.length > CAP && <ShowAll n={c.events.length} />}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Project: ultramarine head with its figures in hexagons; the cover and its facts beside the story;
   the other photos ---------- */
function ProjectPage() {
  const p = projectDetail();
  const T = D.project;
  useDocTitle(p?.title);
  if (!p) return <Missing k="project" list="projects" text={T.missing} back={T.back} />;
  const list: PageKey = p.avenue === 'club' ? 'service' : 'projects';
  const cover = p.gallery[0] ?? p.photo;
  const text = paras(p.description || p.summary);
  const av = Math.max(0, P.projects.avenues.findIndex(a => a.key === p.avenue));
  const figs: Fig[] = [...figsOf(p), ...(p.rotarians != null ? [{ n: num(p.rotarians), label: 'Rotarians', tone: 'c5' }] : [])];
  const facts: Fact[] = [
    { label: 'Avenue', value: avenueLabel(p.avenue) },
    { label: 'Date', value: longDate(parseISO(p.date)) },
    ...(p.focus ? [{ label: 'Area of focus', value: p.focus }] : []),
    ...(p.location ? [{ label: 'Location', value: p.location }] : [])
  ];
  return (
    <>
      <ItemHead name={p.title} figs={figs} />
      <section className="kx-body kx-story">
        <div className="wrap kx-story__in">
          <div className="kx-story__side">
            <figure className="kx-cover"><Ph photo={cover} group={`p-${p.id}`} eager /></figure>
            <div className={`kx-card kx-card--facts kx-d${av}`} data-rv><Facts items={facts} /></div>
          </div>
          <div className="kx-story__text">
            {text.length > 0 ? <Copy id="kx-about-t" title={T.about} text={text} aside={<Share p={p} />} /> : <Share p={p} />}
            {p.club && (
              <section className="kx-org" aria-labelledby="kx-org-t">
                <h2 className="kx-sub" id="kx-org-t">{T.organiser}</h2>
                <ClubCard name={p.club} id={p.clubId} live={!!D.project.item} />
              </section>
            )}
            <Back href={pageInfo(list).file} label={list === 'service' ? pageInfo('service').title : T.back} />
          </div>
        </div>
      </section>
      {p.gallery.length > 1 && <Gallery photos={p.gallery.slice(1)} title={T.gallery} group={`p-${p.id}`} />}
    </>
  );
}

/* ---------- Event: lavender head; the day card (the date big, hot when it is today) beside the story ---------- */
function EventPage() {
  const e = eventDetail();
  const T = D.event;
  const C = R.calendar;
  useDocTitle(e?.title);
  if (!e) return <Missing k="event" list="calendar" text={T.missing} back={T.back} />;
  const d = parseISO(e.date);
  const today = e.date === C.today;
  const text = paras(e.description);
  const ct = e.contact;
  const side = text.length > 0 || !!e.club;
  return (
    <>
      <ItemHead name={e.title} />
      <section className="kx-body kx-story">
        <div className={`wrap kx-story__in kx-story__in--ev${side ? '' : ' is-solo'}`}>
          <div className={`kx-tix${today ? ' is-today' : ''}`}>
            <p className="kx-tix__date">
              {today && <em className="tag-today">{C.todayTag}</em>}
              <b>{d.getDate()}</b>
              <span>{monthLabel(d)}</span>
            </p>
            <div className="kx-tix__main">
              <Pills items={[{ v: C.types.find(t => t.key === e.kind)?.label ?? e.kind, tone: `dot dot--${e.kind}` }]} />
              <Facts items={[
                { label: T.when, value: e.time ? `${longDate(d)} · ${e.time}` : longDate(d) },
                ...(e.venue ? [{ label: T.where, value: e.venue }] : []),
                ...(ct?.name ? [{ label: T.contact, value: ct.name }] : [])
              ]} />
              <Pills items={[
                ct?.email && { v: ct.email, href: `mailto:${ct.email}`, icon: I.mail },
                ct?.phone && { v: ct.phone, href: telOf(ct.phone), icon: I.phone }
              ]} />
              {e.registration && <a className="btn-go kx-tix__go" href={e.registration} target="_blank" rel="noopener">{T.register}{I.go}</a>}
            </div>
          </div>
          <div className="kx-story__text">
            {text.length > 0 && <Copy id="kx-about-t" title={T.about} text={text} />}
            {e.club && (
              <section className="kx-org" aria-labelledby="kx-org-t">
                <h2 className="kx-sub" id="kx-org-t">{T.organiser}</h2>
                <ClubCard name={e.club} id={e.clubId} live={!!D.event.item} />
              </section>
            )}
            <Back href={pageInfo('calendar').file} label={T.back} />
          </div>
        </div>
      </section>
      {e.gallery.length > 0 && <Gallery photos={e.gallery} title={D.project.gallery} group={`e-${e.id}`} />}
    </>
  );
}

/* ---------- Dignitary: mint head with the name; the portrait meets the words in the middle; the other one after ---------- */
function DignitaryPage() {
  const d = dignitaryProfile();
  const T = D.dignitary;
  useDocTitle(d?.name);
  if (!d) return <Missing k="dignitary" text={T.missing} back={T.back} />;
  const otherKey = d.type === 'dg' ? 'president' : 'dg';
  const sample = R.dignitaries.byYear[R.years.current]?.[otherKey];
  const o = D.dignitary.item ? D.dignitary.item[otherKey] : sample;
  const text = paras(d.bio);
  const ct = d.contact;
  const ph = plate(d);
  return (
    <>
      <ItemHead name={d.name} />
      <section className="kx-body kx-prof">
        <div className="wrap kx-meet">
          <figure className="kx-meet__photo"><img src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} /></figure>
          <div className="kx-meet__text">
            <Pills items={[
              { v: d.role, tone: 'kx-hx kx-c1' },
              d.term && { v: d.term },
              ct?.email && { v: ct.email, href: `mailto:${ct.email}`, icon: I.mail },
              ct?.phone && { v: ct.phone, href: telOf(ct.phone), icon: I.phone }
            ]} />
            {text.length > 0 && <Copy id="kx-bio-t" title={T.bio} text={text} />}
            {d.facts.length > 0 && (
              <section className="kx-card kx-card--facts" aria-labelledby="kx-facts-t" data-rv>
                <h2 className="kx-sub" id="kx-facts-t">{T.details}</h2>
                <Facts items={d.facts} />
              </section>
            )}
          </div>
        </div>
        {(o || sample) && (
          <div className="wrap">
            <a className={`kx-other${o ? '' : ' kx-other--role'}`} href={dignitaryHref(otherKey)} data-rv>
              {o && <img src={plate(o).src} alt="" width={plate(o).w} height={plate(o).h} loading="lazy" />}
              {o
                ? <span className="kx-other__t"><b>{o.name}</b><span>{[o.role, o.term].filter(Boolean).join(' · ')}</span></span>
                : <span className="kx-other__t"><b>{sample!.role}</b></span>}
              <span className="btn-go" aria-hidden="true">{R.dignitaries.readMore}{I.go}</span>
            </a>
          </div>
        )}
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

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`kx kx--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  useEffect(() => { startSmoothScroll({ allowNestedScroll: true, lerp: 0.09 }); }, []);
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
