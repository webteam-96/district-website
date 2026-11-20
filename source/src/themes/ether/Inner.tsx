import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, parseISO, shortDate, type Bulletin, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, AdminContent, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, toISO, type PageKey, type Project, projNo
} from '../../shared/inner';
import {
  D, clubProfile, projectDetail, eventDetail, dignitaryProfile, paras, useDocTitle,
  clubHref, projectHref, eventHref, dignitaryHref, eventId
} from '../../shared/detail';
import { Header, Slide, UtilityBar } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';

/* ETHER inner pages (v2): a short band of liquid light under the header, then the homepage's own
   objects at page size: the blue glass card, the mirrored stage, the bento, the day strip with its
   four columns, the newsletter paper. Every interactive part is plain markup with data attributes,
   so the same page also works as static HTML (shared/inner.js). */

const v = (o: Record<string, string | number>) => o as CSSProperties;
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="m6 3.5 4.5 4.5L6 12.5" /></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="8.5" r="3.6" /><path {...sw} d="M5 20c.8-3.7 3.6-5.8 7-5.8s6.2 2.1 7 5.8" /></svg>,
  next: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M3 8h10M9 4l4 4-4 4" /></svg>,
  doc: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M7 3h7l5 5v13H7z" /><path {...sw} d="M14 3v5h5M10 13h6M10 17h6" /></svg>,
  pin: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3.5" y="5" width="17" height="15.5" rx="3" /><path {...sw} d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z" /></svg>,
  group: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  back: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M13 8H3M7 4 3 8l4 4" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
};
/* the District Snapshot's own icons (Sections.tsx), plus a building for "Clubs Involved" */
const SNAP = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.5 2 2 4-4" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.7 0 2.5 1.2 2.5 1.5S14.7 11 13 11h-1l4 5" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  clubs: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path {...sw} d="M6.5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5V21z" /><path {...sw} d="M6.5 11.5h-2a1.5 1.5 0 0 0-1.5 1.5v8h3.5M17.5 9h2a1.5 1.5 0 0 1 1.5 1.5V21h-3.5M10 7h4M10 11h4M10 15h4" /></svg>,
  members: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="10" cy="8.5" r="3.4" /><path {...sw} d="M3.8 19.5c.7-3.3 3.1-5.2 6.2-5.2 1.6 0 3 .5 4.1 1.4" /><path {...sw} d="M18 13.5v6M15 16.5h6" /></svg>
};
/* the homepage's four accent hues, in the order it uses them (theme-aware tokens, see inner.css) */
const HUE = ['var(--c-club)', 'var(--c-district)', 'var(--c-birthday)', 'var(--c-anniversary)'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wd = (d: Date) => R.calendar.weekdays[(d.getDay() - R.calendar.weekStartsOn + 7) % 7];
const pad = (n: number) => String(n).padStart(2, '0');
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;

/* ---------- page head: a band of liquid light under the header, title + breadcrumb left, the page's key control right ---------- */
const Fluid = () => <div className="phead__fluid" aria-hidden="true"><i /><i /></div>;
const Crumbs = ({ title }: { title: string }) => (
  <nav className="crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{title}</span>
  </nav>
);
function PageHead({ k, title, children }: { k: PageKey; title?: string; children?: ReactNode }) {
  const t = title || pageInfo(k).title;
  return (
    <section className={`phead phead--${k}`} id="top">
      <Fluid />
      <div className="wrap phead__row">
        <div className="phead__text" data-rv>
          <h1 className="phead__title">{t}</h1>
          <Crumbs title={t} />
        </div>
        {children && <div className="phead__key" data-rv style={v({ '--d': '80ms' })}>{children}</div>}
      </div>
    </section>
  );
}

/* search; the live result count is announced to screen readers, not shown in the field */
function Search({ label, total, noun, placeholder = label, className = '' }: { label: string; total: number; noun: string; placeholder?: string; className?: string }) {
  return (
    <label className={`gsearch ${className}`.trim()}>
      {I.search}
      <span className="sr-only">{label}</span>
      <input type="search" data-f-search placeholder={placeholder} autoComplete="off" />
      <span className="sr-only" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</span>
    </label>
  );
}
const Empty = ({ text }: { text: string }) => <p className="gempty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="gmore"><button type="button" className="pill-btn pill-btn--lg" data-f-more hidden>{label}</button></div>;
/* "Show all N": a checkbox in a pill, no script; inner.css shows a list's first rows until it is ticked */
const ShowAll = ({ n }: { n: number }) => (
  <label className="cmore pill-btn">
    <input type="checkbox" className="cmore__box" />
    <span className="cmore__all">Show all <span className="cmore__n">{num(n)}</span></span>
    <span className="cmore__less">Show fewer</span>
    {I.chevron}
  </label>
);
/* Share (shared/inner.js: the phone's share sheet, else a menu of WhatsApp, Facebook, X, LinkedIn, Copy link) */
const Share = ({ href, title, className }: { href: string; title: string; className: string }) => (
  <button type="button" className={className} data-share data-share-url={href} data-share-title={title} aria-haspopup="menu" aria-expanded="false" aria-label={`Share: ${title}`}>{I.share}<span>Share</span></button>
);
/* a person as a card: a large photo (or initials), name, role, club */
function PersonCard({ m, q, group }: { m: { name: string; role?: string; club?: string; photo?: Photo | null }; q?: string; group?: string }) {
  return (
    <li className="ccard glass" data-item={q === undefined ? undefined : true} data-q={q} data-group={group}>
      <span className="ccard__photo">
        {m.photo ? <img src={m.photo.src} alt="" width={m.photo.w} height={m.photo.h} loading="lazy" /> : <span className="ccard__plate" aria-hidden="true">{initials(m.name)}</span>}
      </span>
      <h3 className="ccard__name">{m.name}</h3>
      {m.role && <p className="ccard__role">{m.role}</p>}
      {m.club && <p className="ccard__club">{clubName(m.club)}</p>}
    </li>
  );
}

/* ================= About =================
   The backend has one field for this page, "content" (HTML from the admin's editor). The page is a
   document sheet: its title and breadcrumb are the sheet's title block, the content follows. */
function About() {
  const p = pageInfo('about');
  return (
    <section className="psec psec--doc" id="top">
      <Fluid />
      <div className="wrap">
        <article className="sheet" data-rv>
          <header className="sheet__head">
            <h1 className="phead__title">{p.title}</h1>
            <Crumbs title={p.title} />
          </header>
          <AdminContent className="prose" />
        </article>
      </div>
    </section>
  );
}

/* ================= District Committee =================
   The homepage's mirrored stage: the District Governor (the first member of the first committee) at
   the left, the committees as the filter at the right. Under it every committee is a section of member
   cards with large photos. Each committee shows one row of cards and a "Show all N" checkbox (CSS only,
   in its heading), so a committee of 120 club presidents never makes the page run on; choosing a
   committee with its chip shows all of it. */
function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const gov = groups[0]?.members[0];
  return (
    <div className="croot" data-filter>
      <PageHead k="committee"><Search label={P.committee.searchLabel} total={total} noun="members" className="gsearch--head" /></PageHead>
      <section className="psec psec--top">
        <div className="wrap">
          <div className="cstage glass glass--stage" data-glow data-rv>
            {gov && (
              <article className="cstage__gov">
                <div className="portrait">
                  {gov.photo ? <img src={gov.photo.src} alt={gov.photo.alt} width={gov.photo.w} height={gov.photo.h} /> : <span className="portrait__plate" aria-hidden="true">{gov.initials}</span>}
                </div>
                <div className="cstage__who">
                  <h2>{gov.name}</h2>
                  <p className="cstage__role">{gov.role}</p>
                  {gov.club && <p className="cstage__club">{clubName(gov.club)}</p>}
                </div>
              </article>
            )}
            <div className="cstage__index">
              {groups.length > 1 && (
                <div className="cstage__chips" role="group" aria-label="Committee">
                  <button type="button" className="cchip" data-f-chip="group" data-v="" aria-pressed="true"><span>All</span><b>{num(total)}</b></button>
                  {groups.map((g, gi) => (
                    <button key={g.key} type="button" className="cchip" data-f-chip="group" data-v={g.key} aria-pressed="false" style={v({ '--c': HUE[gi % 4] })}>
                      <i aria-hidden="true" /><span>{g.title}</span><b>{num(g.members.length)}</b>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cgroups">
            {groups.map((g, gi) => {
              const list = gi === 0 ? g.members.slice(1) : g.members;
              if (!list.length) return null;
              return (
                <section key={g.key} className="cgroup" data-f-group data-rv aria-labelledby={`cg-${g.key}`} style={v({ '--c': HUE[gi % 4] })}>
                  <header className="cgroup__head">
                    <i aria-hidden="true" />
                    <h2 id={`cg-${g.key}`}>{g.title}</h2>
                    <b data-f-group-count>{num(list.length)}</b>
                    {list.length > CAP_MIN && <ShowAll n={list.length} />}
                  </header>
                  <ul className="cgrid">{list.map((m, i) => <PersonCard key={i} m={m} q={m.q} group={g.key} />)}</ul>
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
/* the fewest cards a committee shows before "Show all" (one row of four, or two rows of two on a phone; see inner.css) */
const CAP_MIN = 4;

/* ================= Club Finder =================
   A console that stays in view (search + the seven meeting days drawn as bars) beside the clubs. Each club
   row: the name (the link to the club), then the meeting day, the president and the president's phone in
   fixed slots, so the rows line up when a club has no president or phone on record. */
function Finder() {
  const f = P.finder;
  const list = clubs();
  const perDay = f.days.map(d => list.filter(c => c.day === d).length);
  const max = Math.max(1, ...perDay);
  return (
    <>
      <PageHead k="finder" />
      <section className="psec psec--top froot" data-filter data-page-size={f.pageSize}>
        <div className="wrap froot__grid">
          <aside className="fconsole glass" data-rv>
            <p className="fconsole__label" aria-hidden="true">{f.searchLabel}</p>
            <Search label={f.searchLabel} total={list.length} noun="clubs" placeholder="Search" />
            <p className="fconsole__label" id="fday-l">{f.dayLabel}</p>
            <div className="fconsole__days" role="group" aria-labelledby="fday-l">
              <button type="button" className="fday" data-f-chip="day" data-v="" aria-pressed="true"><span>{f.anyDay}</span><b data-count>{num(list.length)}</b></button>
              {f.days.map((d, i) => (
                <button key={d} type="button" className="fday" data-f-chip="day" data-v={d} aria-pressed="false" disabled={!perDay[i]} style={v({ '--v': (perDay[i] / max).toFixed(3) })}>
                  <span>{d}</span><b data-count>{num(perDay[i])}</b>
                </button>
              ))}
            </div>
          </aside>
          <div className="froot__list">
            <ul className="flist" data-rv>
              {list.map(c => (
                <li key={c.id} className="fclub glass" data-item data-q={c.q} data-day={c.day ?? ''} data-glow>
                  <h3><a className="fclub__link" href={c.href}>Rotary Club of {c.name}</a></h3>
                  <p className="fclub__meta">
                    <span className="fclub__cell">{c.day && <span className="fclub__day">{I.clock}{c.day}</span>}</span>
                    <span className="fclub__cell">{c.president && <span className="fclub__pres">{I.user}<span className="sr-only">President: </span>{c.president}</span>}</span>
                    <span className="fclub__cell">{c.phone && <a className="fclub__tel" href={`tel:${c.tel || c.phone.replace(/[^\d+]/g, '')}`}>{I.phone}{c.phone}</a>}</span>
                  </p>
                  <span className="fclub__go" aria-hidden="true">{I.arrow}{I.chevron}</span>
                </li>
              ))}
            </ul>
            <Empty text={f.empty} />
            <More label={f.more} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ================= Club Projects / Club Service =================
   Cards newest first; each card's number (#1 = the latest) is a CSS counter over the cards that show,
   so it stays 1, 2, 3 … after a search, an avenue chip or "Show more". The photo opens full size (lightbox),
   "Read more" opens the project, Share is the second, smaller control. */
function ProjectCard({ p, no }: { p: Project; no?: string }) {
  return (
    <li className="pcard glass" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-glow>
      <div className="pcard__in">
        <figure className="pcard__photo">
          <a className="pcard__zoom" href={p.photo.src} data-lightbox={`p-${p.id}`} data-caption={p.photo.alt}>
            <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
          </a>
          <span className={`pcard__tag pcard__tag--${p.avenue}`}><i aria-hidden="true" />{avenueLabel(p.avenue)}</span>
          <span className="pcard__no" aria-hidden="true" data-no={no} />
        </figure>
        <div className="pcard__body">
          <h3>{p.title}</h3>
          <p className="pcard__meta"><span>{clubName(p.club)}</span><span>{shortDate(p.date)}</span></p>
          <p className="pcard__sum">{p.summary}</p>
          <div className="pcard__acts">
            <a className="pill-btn pcard__more" href={projectHref(p)}>Read more<span className="sr-only">: {p.title}</span>{I.next}</a>
            <Share href={projectHref(p)} title={p.title} className="pcard__share" />
          </div>
        </div>
      </div>
    </li>
  );
}

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const L = x.statLabels;
  const list = [...projectsOf(service ? 'club' : undefined)].sort((a, b) => b.date.localeCompare(a.date));
  const t = totals(list);
  const amount = `₹${R.fmt.num(t.amount, 1)} L`;
  const stats = [
    { key: 'projects' as const, label: L.projects, value: num(t.projects), accent: HUE[1] },
    { key: 'beneficiaries' as const, label: L.beneficiaries, value: num(t.beneficiaries), accent: HUE[2] },
    { key: 'amount' as const, label: L.amount, value: amount, accent: HUE[3] },
    { key: 'hours' as const, label: L.hours, value: num(t.hours), accent: HUE[0] }
  ];
  /* Club Service: the counter strip of production's project pages, in its order and words */
  const strip = [
    { key: 'projects' as const, label: 'Projects', value: num(t.projects), accent: HUE[1] },
    { key: 'clubs' as const, label: 'Clubs Involved', value: num(new Set(list.map(p => p.club)).size), accent: HUE[3] },
    { key: 'beneficiaries' as const, label: 'Beneficiaries', value: num(t.beneficiaries), accent: HUE[2] },
    { key: 'hours' as const, label: 'Volunteer Hours', value: num(t.hours), accent: HUE[0] },
    { key: 'amount' as const, label: 'Amount Spent', value: amount, accent: HUE[1] }
  ];
  const search = <Search label={x.searchLabel} total={list.length} noun="projects" className="gsearch--head" />;
  return (
    <div className={`proot ${service ? 'proot--service' : ''}`.trim()} data-filter data-page-size={x.pageSize}>
      {service ? (
        <PageHead k="service">{list.length > x.pageSize ? search : null}</PageHead>
      ) : (
        <PageHead k="projects">
          <ul className="hticker glass">
            {stats.map(s => <li key={s.key} style={v({ '--accent': s.accent })}><b data-count>{s.value}</b><span>{s.label}</span></li>)}
          </ul>
          {search}
        </PageHead>
      )}
      <section className="psec psec--top">
        <div className="wrap">
          {!service && (
            <div className="gchips" role="group" aria-label="Avenue of service" data-rv>
              <button type="button" className="gchip" data-f-chip="avenue" data-v="" aria-pressed="true">{x.allLabel}<b>{num(list.length)}</b></button>
              {x.avenues.filter(a => a.key !== 'club').map(a => {
                const n = list.filter(p => p.avenue === a.key).length;
                return n ? <button key={a.key} type="button" className="gchip" data-f-chip="avenue" data-v={a.key} aria-pressed="false"><i className={`gdot gdot--${a.key}`} aria-hidden="true" />{a.label}<b>{num(n)}</b></button> : null;
              })}
            </div>
          )}
          <ul className="pwall" data-rv style={v({ '--d': '60ms' })}>{list.map((p, i, a) => <ProjectCard key={p.id} p={p} no={projNo(i, a.length)} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= District Calendar =================
   The homepage calendar at page size: twelve months in the head, then for the open month the day strip
   (every day a homepage day tile, which filters) and the four category columns. */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <div className="calroot" data-tabs>
      <PageHead k="calendar">
        <div className="mline" role="tablist" aria-label={P.calendar.monthLabel}>
          {months.map(m => {
            const on = m.key === open;
            return (
              <button key={m.key} type="button" role="tab" className={`mtab ${on ? 'is-on is-now' : ''}`} data-tab={m.key} aria-selected={on} tabIndex={on ? 0 : -1} aria-label={m.label}>
                {m.short}<span> {m.date.getFullYear()}</span>
              </button>
            );
          })}
        </div>
      </PageHead>
      <section className="psec psec--top">
        <div className="wrap">
          {months.map(m => {
            const y = m.date.getFullYear(), mo = m.date.getMonth();
            const days = monthEntries(m.date);
            const byIso = new Map(days.map(d => [d.iso, d.list]));
            const total = days.reduce((s, d) => s + d.list.length, 0);
            const dim = new Date(y, mo + 1, 0).getDate();
            const isNow = m.key === open;
            const lanes = C.types.map(t => ({ t, items: days.flatMap(d => d.list.filter(e => e.type === t.key).map(e => ({ e, d }))) }));
            return (
              <div key={m.key} className="mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!isNow} data-filter>
                <h2 className="sr-only">{m.label}</h2>
                <div className="dstrip glass" data-rv>
                  <Slide>
                  <div className="dstrip__days" role="group" aria-label="Day">
                    <button type="button" className="dday dday--all" data-f-chip="day" data-v="" aria-pressed="true" disabled={!total}><i>All</i><b>{num(total)}</b></button>
                    {Array.from({ length: dim }, (_, i) => {
                      const date = new Date(y, mo, i + 1);
                      const iso = toISO(date);
                      const list = byIso.get(iso);
                      const isToday = iso === C.today;
                      return (
                        <button key={iso} type="button" className={`dday ${isToday ? 'is-today' : ''} ${date.getDay() === 0 ? 'is-sun' : ''}`}
                          data-f-chip="day" data-v={String(i + 1)} aria-pressed="false" disabled={!list}
                          aria-current={isToday ? 'date' : undefined} aria-label={`${longDate(date)}, ${list ? list.length : 0} entries`}>
                          <i>{wd(date)}</i><b>{pad(i + 1)}</b>
                          <span className="dday__dots" aria-hidden="true">{list && typesOf(list).map(t => <i key={t} className={`mark mark--${t}`} />)}</span>
                          {isToday && <em aria-hidden="true">{C.todayTag}</em>}
                        </button>
                      );
                    })}
                  </div>
                  </Slide>
                  {total > 0 && (
                    <div className="dstrip__types">
                      <div className="gchips" role="group" aria-label="Show">
                        <button type="button" className="gchip" data-f-chip="type" data-v="" aria-pressed="true">All<b>{num(total)}</b></button>
                        {lanes.filter(l => l.items.length).map(l => (
                          <button key={l.t.key} type="button" className="gchip" data-f-chip="type" data-v={l.t.key} aria-pressed="false"><i className={`mark mark--${l.t.key}`} aria-hidden="true" />{l.t.group}<b>{num(l.items.length)}</b></button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {total > 0 && (
                  <div className="tlanes">
                    {lanes.map((l, li) => (
                      <section key={l.t.key} className={`tlane tlane--${l.t.key} glass`} data-f-group data-glow data-rv hidden={!l.items.length} style={v({ '--d': `${li * 60}ms` })}>
                        <header className="tlane__head"><i className={`mark mark--${l.t.key}`} aria-hidden="true" /><h3>{l.t.group}</h3><b data-f-group-count>{num(l.items.length)}</b></header>
                        <ul className="tlane__list" tabIndex={0} aria-label={l.t.group} data-lenis-prevent>
                          {l.items.map(({ e, d }, i) => {
                            const tx = entryText(e);
                            return (
                              <li key={i} className={`tentry ${d.iso === C.today ? 'is-today' : ''}`} data-item data-type={e.type} data-day={String(d.date.getDate())}>
                                <span className="tentry__date" aria-hidden="true"><i>{wd(d.date)}</i><b>{pad(d.date.getDate())}</b></span>
                                <div className="tentry__text">
                                  <span className="sr-only">{longDate(d.date)}: </span>
                                  <b>{e.type === 'club' || e.type === 'district' ? <a className="tentry__link" href={eventHref(e)}>{tx.head}</a> : tx.head}</b>
                                  {tx.sub && <span>{tx.sub}</span>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
                <p className="gempty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* a newsletter as the homepage's paper: text only, Preview + Download */
function Paper({ b, i, filter = false }: { b: Bulletin; i: number; filter?: boolean }) {
  const A = R.press.actions;
  return (
    <li className={`doc glass ${i % 2 ? 'doc--gold' : ''}`.trim()} data-item={filter || undefined} data-q={filter ? `${b.title} ${b.club}`.toLowerCase() : undefined} data-glow>
      <span className="doc__icon" aria-hidden="true">{I.doc}</span>
      <h3>{b.title}</h3>
      <p className="doc__club">{clubName(b.club)}</p>
      <p className="doc__date">{shortDate(b.date)}</p>
      <div className="doc__acts">
        <a className="pill-btn pill-btn--solid" href={b.pdf} target="_blank" rel="noopener">{A.preview}</a>
        <a className="pill-btn" href={b.pdf} download>{A.download}</a>
      </div>
    </li>
  );
}

/* ================= Newsletters =================
   One block per Rotary year (the year chosen in the top strip shows). The newest issue is an open
   sheet in the middle, the next four papers stand two on each side of it, the rest in lines of four. */
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const A = R.press.actions;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="psec psec--top">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} className="nyear" data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash data-filter data-page-size="13">
              <div className="ndock" data-rv>
                <div className="ndock__tabs" role="tablist" aria-label={R.press.title}>
                  <button type="button" role="tab" className="ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                <Search label={N.searchLabel} total={y.bulletins.length} noun={`bulletins in ${y.year}`} className="gsearch--head gsearch--long" />
              </div>
              <div data-panel="club" role="tabpanel">
                <h2 className="sr-only">{N.club}</h2>
                {y.bulletins.length > 0 && (
                  <ul className="nwall" data-rv style={v({ '--d': '60ms' })}>
                    {y.bulletins.map((b, i) => <Paper key={i} b={b} i={i} filter />)}
                  </ul>
                )}
                <p className="gempty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
                <More label="Show more" />
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                <h2 className="sr-only">{N.governor}</h2>
                {y.gml.length ? (
                  <ul className="nwall" data-rv>
                    {y.gml.map((g, i) => (
                      <li key={i} className="doc doc--gold doc--letter glass" data-glow>
                        <span className="doc__icon" aria-hidden="true">{I.doc}</span>
                        <h3>{g.month}</h3>
                        <p className="doc__club">{g.governor}</p>
                        <p className="doc__date">{shortDate(g.date)}</p>
                        <div className="doc__acts">
                          <a className="pill-btn pill-btn--solid" href={g.pdf} target="_blank" rel="noopener">{A.preview}</a>
                          <a className="pill-btn" href={g.pdf} download>{A.download}</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="gempty gempty--gold"><span className="gempty__icon" aria-hidden="true">{I.doc}</span>{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Detail pages: club, project, event, dignitary =================
   One item each (shared/detail.tsx); the static HTML shows the example item. The head is the inner pages'
   band with the item's name and "Home / name". The body reuses the homepage's objects: the Snapshot's
   bento and stat cells, the mirrored stage and its portrait, the calendar's day tile and lanes, the
   newsletter paper, and the committee's member cards. People and photos show their first rows and a
   CSS-only "Show all N"; lists that can run to hundreds (a roster, a club's projects) page with "Show more". */

/* not found: the head with the page's own name, the data's sentence and the way back to the list */
function Missing({ k, text, href, label }: { k: PageKey; text: string; href: string; label: string }) {
  return (
    <>
      <PageHead k={k} />
      <section className="psec psec--top">
        <div className="wrap">
          <div className="gempty dmissing" data-rv>
            <p>{text}</p>
            <a className="pill-btn pill-btn--solid pill-btn--lg" href={href}>{label}</a>
          </div>
        </div>
      </section>
    </>
  );
}
const Back = ({ href, label }: { href: string; label: string }) => (
  <div className="dback"><a className="pill-btn" href={href}>{I.back}{label}</a></div>
);
const Facts = ({ list }: { list: { label: string; value: ReactNode }[] }) => (
  <dl className="dfacts">{list.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
);
const telOf = (s: string) => s.replace(/[^\d+]/g, '');
const webOf = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);

/* photos, the first is the cover: one keeps its own shape, two stand side by side, three or more are a cover
   with two beside it and the rest a strip of thumbnails, two rows until "Show all N" (no photo is cut to a sliver) */
function Gallery({ photos, label, group }: { photos: Photo[]; label: string; group: string }) {
  const n = photos.length;
  if (!n) return null;
  const ar = (x: Photo) => (x.w > 0 && x.h > 0 ? (x.w / x.h).toFixed(3) : '1.5');
  const img = (x: Photo, lazy: boolean) => (
    <a href={x.src} data-lightbox={group} data-caption={x.alt}>
      <img src={x.src} alt={x.alt} width={x.w || undefined} height={x.h || undefined} loading={lazy ? 'lazy' : undefined} />
    </a>
  );
  const rest = photos.slice(3);
  return (
    <section className="pgal" aria-label={label} data-rv>
      <div className={`pgal__lead pgal__lead--${Math.min(n, 3)}`}>
        {photos.slice(0, 3).map((x, i) => <figure key={i} className="pgal__ph" style={v({ '--ar': ar(x) })}>{img(x, i > 0)}</figure>)}
      </div>
      {rest.length > 0 && (
        <div className="dlist dlist--12">
          <ul className="pgal__grid">{rest.map((x, i) => <li key={i} className="pgal__ph">{img(x, true)}</li>)}</ul>
          {rest.length > 12 && <div className="dlist__foot"><ShowAll n={rest.length} /></div>}
        </div>
      )}
    </section>
  );
}

/* an event as a tile: the calendar's date badge, the title (the link), time and venue */
function EventTile({ e, club = false, item = false }: { e: CalEntry; club?: boolean; item?: boolean }) {
  const d = parseISO(e.date);
  const sub = [e.time, e.venue, club && e.club ? clubName(e.club) : ''].filter(Boolean).join(' · ');
  return (
    <li className={`etile glass ${e.date === R.calendar.today ? 'is-today' : ''}`.trim()} data-item={item || undefined} data-glow>
      <span className="etile__date" aria-hidden="true"><i>{wd(d)}</i><b>{pad(d.getDate())}</b><em>{MON[d.getMonth()]}</em></span>
      <div className="etile__text">
        <h3><a className="etile__link" href={eventHref(e)}><span className="sr-only">{longDate(d)}: </span>{e.title}</a></h3>
        {sub && <p>{sub}</p>}
      </div>
      <span className="etile__go" aria-hidden="true">{I.arrow}</span>
    </li>
  );
}

/* the organising club as one card, linked to its profile when the club is known */
function ClubCard({ name, id, label }: { name: string; id: string; label: string }) {
  const full = `Rotary Club of ${name}`;
  return (
    <section className={`dorg glass ${id ? 'dorg--link' : ''}`.trim()} data-glow>
      <h2 className="dorg__label">{label}</h2>
      <div className="dorg__row">
        <span className="dorg__mono" aria-hidden="true">{initials(name) || name.slice(0, 1)}</span>
        <p className="dorg__name">{id ? <a className="dorg__link" href={clubHref(id)}>{full}</a> : full}</p>
        {id && <span className="dorg__go" aria-hidden="true">{I.arrow}</span>}
      </div>
    </section>
  );
}

/* ---------- club profile: the club's own Snapshot (details + five figures), its board as photo cards, its
   roster as compact tiles (search, 24 at a time), then its projects, newsletters and events as tabs ---------- */
function ClubPage() {
  const c = clubProfile();
  const name = c ? `Rotary Club of ${c.name}` : '';
  useDocTitle(name);
  if (!c) return <Missing k="club" text={D.club.missing} href={pageInfo('finder').file} label={D.club.back} />;
  const C = D.club;
  const g = c.glance;
  const ct = c.contact;
  const when = [c.meeting.day, c.meeting.time].filter(Boolean).join(' · ');
  const links = ct ? [ct.email, ct.phone, ct.web].filter(Boolean).length : 0;
  const hasDetails = !!(when || c.meeting.place || c.details.length || links);
  /* the five figures of production's club page, in its order and words */
  const stats = [
    { key: 'members' as const, label: C.members, value: num(g.members), accent: HUE[3] },
    { key: 'projects' as const, label: 'Projects', value: num(g.projects), accent: HUE[1] },
    { key: 'beneficiaries' as const, label: 'Beneficiaries', value: num(g.beneficiaries), accent: HUE[2] },
    { key: 'hours' as const, label: 'Volunteer Hours', value: num(g.hours), accent: HUE[0] },
    { key: 'amount' as const, label: 'Amount Spent', value: lakh(g.amount), accent: HUE[1] }
  ];
  const projects = [...c.projects].sort((a, b) => b.date.localeCompare(a.date));
  const events = [...c.events].sort((a, b) => a.date.localeCompare(b.date));
  const tabs = [
    { key: 'projects', label: C.tabs.projects, n: projects.length },
    { key: 'bulletins', label: C.tabs.bulletins, n: c.bulletins.length },
    { key: 'events', label: C.tabs.events, n: events.length }
  ];
  return (
    <>
      <PageHead k="club" title={name} />
      <section className="psec psec--top">
        <div className="wrap dstack">
          <div className={`cbento ${hasDetails ? '' : 'cbento--figures'}`.trim()}>
            {hasDetails && (
              <section className="cbento__feature" data-glow data-rv aria-labelledby="cd-t">
                <div className="cbento__top"><span className="sstrip__icon" aria-hidden="true">{I.cal}</span><h2 id="cd-t" className="sstrip__label">{C.details}</h2></div>
                {when && <p className="cbento__when"><span className="sr-only">{P.finder.dayLabel}: </span>{when}</p>}
                {c.meeting.place && <p className="cbento__place">{I.pin}<span>{c.meeting.place}</span></p>}
                {c.details.length > 0 && <Facts list={c.details} />}
                {ct && links > 0 && (
                  <div className="cbento__links">
                    {ct.email && <a className="cbento__link" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>}
                    {ct.phone && <a className="cbento__link" href={`tel:${telOf(ct.phone)}`}>{I.phone}<span>{ct.phone}</span></a>}
                    {ct.web && <a className="cbento__link" href={webOf(ct.web)} target="_blank" rel="noopener">{I.globe}<span>{ct.web.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</span></a>}
                  </div>
                )}
              </section>
            )}
            <h2 className="sr-only">{C.glance}</h2>
            {stats.map((s, i) => (
              <div key={s.key} className={`sstrip__cell ${i ? '' : 'sstrip__cell--wide'}`.trim()} data-glow data-rv style={v({ '--accent': s.accent, '--d': `${(i + 1) * 60}ms` })}>
                <span className="sstrip__icon" aria-hidden="true">{SNAP[s.key]}</span>
                <span className="sstrip__label">{s.label}</span>
                <b className="sstrip__num" data-count>{s.value}</b>
              </div>
            ))}
          </div>

          <section className="cgroup" data-rv aria-labelledby="cl-t" style={v({ '--c': HUE[1] })}>
            <header className="cgroup__head">
              <i aria-hidden="true" /><h2 id="cl-t">{C.leadership}</h2><span className="dterm">{R.years.current}</span>
              {c.leaders.length > CAP_MIN && <ShowAll n={c.leaders.length} />}
            </header>
            {c.leaders.length ? <ul className="cgrid cgrid--6">{c.leaders.map((l, i) => <PersonCard key={i} m={l} />)}</ul> : <p className="gempty">{C.none.leaders}</p>}
          </section>

          {c.members.length > 0 && (
            <section className="cgroup croster" data-filter data-page-size={C.pageSize} data-rv aria-labelledby="cm-t" style={v({ '--c': HUE[0] })}>
              <header className="cgroup__head">
                <i aria-hidden="true" /><h2 id="cm-t">{C.members}</h2><b>{num(c.members.length)}</b>
                <Search label={C.searchLabel} total={c.members.length} noun="members" className="croster__search" />
              </header>
              <ul className="rgrid">
                {c.members.map((m, i) => (
                  <li key={i} className="rtile" data-item data-q={`${m.name} ${m.role}`.toLowerCase()}>
                    <span className="avatar">{m.photo ? <img src={m.photo.src} alt="" width="52" height="52" loading="lazy" /> : <span aria-hidden="true">{initials(m.name)}</span>}</span>
                    <span className="rtile__who"><b>{m.name}</b>{m.role && <span>{m.role}</span>}</span>
                  </li>
                ))}
              </ul>
              <Empty text={C.empty} />
              <More label={C.more} />
            </section>
          )}

          <section className="ctabs" data-tabs aria-labelledby="ct-t">
            <h2 id="ct-t" className="sr-only">{name}</h2>
            <div className="ndock__tabs ctabs__bar" role="tablist" aria-labelledby="ct-t" data-rv>
              {tabs.map((t, i) => (
                <button key={t.key} type="button" role="tab" className={`ntab ${i ? '' : 'is-on'}`.trim()} data-tab={t.key} aria-selected={!i} tabIndex={i ? -1 : 0}>{t.label}<b>{num(t.n)}</b></button>
              ))}
            </div>
            <div data-panel="projects" role="tabpanel" aria-label={C.tabs.projects}>
              {projects.length ? (
                <div data-filter data-page-size="8">
                  <ul className="dwall">{projects.map((p, i, a) => <ProjectCard key={p.id} p={p} no={projNo(i, a.length)} />)}</ul>
                  <More label={P.projects.more} />
                </div>
              ) : <p className="gempty">{C.none.projects}</p>}
            </div>
            <div data-panel="bulletins" role="tabpanel" aria-label={C.tabs.bulletins} hidden>
              {c.bulletins.length ? (
                <div data-filter data-page-size="8">
                  <ul className="dpapers">{c.bulletins.map((b, i) => <Paper key={i} b={b} i={i} filter />)}</ul>
                  <More label="Show more" />
                </div>
              ) : <p className="gempty">{C.none.bulletins}</p>}
            </div>
            <div data-panel="events" role="tabpanel" aria-label={C.tabs.events} hidden>
              {events.length ? (
                <div data-filter data-page-size="6">
                  <ul className="evlist">{events.map(e => <EventTile key={eventId(e)} e={e} item />)}</ul>
                  <More label="Show more" />
                </div>
              ) : <p className="gempty">{C.none.events}</p>}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

/* ---------- project: its figures in the head (as on Club Projects), the photos, then the story beside the
   organising club and the facts ---------- */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title);
  if (!p) return <Missing k="project" text={D.project.missing} href={pageInfo('projects').file} label={D.project.back} />;
  const list = pageInfo(p.avenue === 'club' ? 'service' : 'projects');
  const L = P.projects.statLabels;
  const figs = [
    { key: 'beneficiaries', label: L.beneficiaries, value: num(p.beneficiaries), accent: HUE[2] },
    { key: 'amount', label: L.amount, value: lakh(p.amount), accent: HUE[3] },
    { key: 'hours', label: L.hours, value: num(p.hours), accent: HUE[0] },
    ...(p.rotarians != null ? [{ key: 'rotarians', label: 'Rotarians', value: num(p.rotarians), accent: HUE[1] }] : [])
  ];
  const text = paras(p.description);
  const facts = [
    { label: 'Avenue of service', value: avenueLabel(p.avenue) },
    { label: 'Date', value: longDate(parseISO(p.date)) },
    ...(p.location ? [{ label: 'Location', value: p.location }] : []),
    ...(p.focus ? [{ label: 'Area of focus', value: p.focus }] : [])
  ];
  return (
    <>
      <PageHead k="project" title={p.title}>
        {!(p.avenue === 'club') && (
<ul className="hticker glass" aria-label={D.project.figures}>
          {figs.map(f => <li key={f.key} style={v({ '--accent': f.accent })}><b data-count>{f.value}</b><span>{f.label}</span></li>)}
        </ul>
)}
      </PageHead>
      <section className="psec psec--top">
        <div className="wrap dstack">
          <Gallery photos={p.gallery} label={D.project.gallery} group={`p-${p.id}`} />
          <div className="dbody">
            {text.length > 0 && (
              <article className="dsheet glass" data-rv aria-labelledby="pa-t">
                <h2 id="pa-t" className="dsheet__title">{D.project.about}</h2>
                <div className="dprose">{text.map((t, i) => <p key={i}>{t}</p>)}</div>
              </article>
            )}
            <aside className="dside" data-rv style={v({ '--d': '60ms' })}>
              {p.club && <ClubCard name={p.club} id={p.clubId} label={D.project.organiser} />}
              <div className="dpanel glass">
                <Facts list={facts} />
                <Share href={projectHref(p)} title={p.title} className="pill-btn dshare" />
              </div>
            </aside>
          </div>
          <Back href={list.file} label={p.avenue === 'club' ? list.title : D.project.back} />
        </div>
      </section>
    </>
  );
}

/* ---------- event: the day as the homepage's day tile in the head (today is gold), then When / Where /
   Organised by / Contact as the calendar's lanes, the story, the photos and what comes next ---------- */
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title);
  const cal = pageInfo('calendar');
  if (!e) return <Missing k="event" text={D.event.missing} href={cal.file} label={D.event.back} />;
  const E = D.event;
  const date = parseISO(e.date);
  const today = e.date === R.calendar.today;
  const kind = R.calendar.types.find(t => t.key === e.kind);
  const text = paras(e.description);
  const ct = e.contact;
  /* the next events on the calendar: sample/static only (live, the page loads just its own event, so the
     calendar there is still the sample's) */
  const more = D.event.item ? [] : R.calendar.entries
    .filter(x => (x.type === 'club' || x.type === 'district') && x.date >= e.date && eventId(x) !== e.id)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return (
    <>
      <PageHead k="event" title={e.title}>
        <p className={`ticket ${today ? 'is-today' : ''}`.trim()} aria-hidden="true">
          {today && <em>{R.calendar.todayTag}</em>}
          <i>{wd(date)}</i><b>{pad(date.getDate())}</b><span>{MON[date.getMonth()]} {date.getFullYear()}</span>
        </p>
      </PageHead>
      <section className="psec psec--top">
        <div className="wrap dstack">
          <div className="elanes">
            <section className={`elane glass ${today ? 'is-today' : ''}`.trim()} style={v({ '--c': e.kind === 'district' ? 'var(--c-district)' : 'var(--c-club)' })} data-glow data-rv>
              <h2 className="elane__label"><span className="elane__icon" aria-hidden="true">{I.cal}</span>{E.when}</h2>
              <p className="elane__value">{longDate(date)}{today && <span className="tag-today">{R.calendar.todayTag}</span>}</p>
              {e.time && <p className="elane__sub">{I.clock}{e.time}</p>}
              {e.registration && <a className="pill-btn pill-btn--solid elane__cta" href={e.registration} target="_blank" rel="noopener">{E.register}{I.arrow}</a>}
            </section>
            {e.venue && (
              <section className="elane glass" style={v({ '--c': 'var(--c-anniversary)' })} data-glow data-rv>
                <h2 className="elane__label"><span className="elane__icon" aria-hidden="true">{I.pin}</span>{E.where}</h2>
                <p className="elane__value">{e.venue}</p>
              </section>
            )}
            <section className={`elane glass ${e.clubId ? 'elane--link' : ''}`.trim()} style={v({ '--c': 'var(--c-district)' })} data-glow data-rv>
              <h2 className="elane__label"><span className="elane__icon" aria-hidden="true">{I.group}</span>{E.organiser}</h2>
              <p className="elane__value">
                {e.club ? (e.clubId ? <a className="elane__link" href={clubHref(e.clubId)}>Rotary Club of {e.club}</a> : `Rotary Club of ${e.club}`) : R.site.name}
              </p>
              {kind && <p className="elane__sub"><i className={`mark mark--${e.kind}`} aria-hidden="true" />{kind.label}</p>}
            </section>
            {ct && (ct.name || ct.email || ct.phone) && (
              <section className="elane glass" style={v({ '--c': 'var(--c-birthday)' })} data-glow data-rv>
                <h2 className="elane__label"><span className="elane__icon" aria-hidden="true">{I.phone}</span>{E.contact}</h2>
                {ct.name && <p className="elane__value">{ct.name}</p>}
                {ct.email && <a className="elane__row" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>}
                {ct.phone && <a className="elane__row" href={`tel:${telOf(ct.phone)}`}>{I.phone}<span>{ct.phone}</span></a>}
              </section>
            )}
          </div>
          {text.length > 0 && (
            <article className="dsheet dsheet--solo glass" data-rv aria-labelledby="ea-t">
              <h2 id="ea-t" className="dsheet__title">{E.about}</h2>
              <div className="dprose">{text.map((t, i) => <p key={i}>{t}</p>)}</div>
            </article>
          )}
          <Gallery photos={e.gallery} label={D.project.gallery} group={`e-${e.id}`} />
          {more.length > 0 && (
            <section className="dmore" data-rv aria-labelledby="em-t">
              <h2 id="em-t" className="dtitle">More events</h2>
              <ul className="evlist">{more.map(x => <EventTile key={eventId(x)} e={x} club />)}</ul>
            </section>
          )}
          <Back href={cal.file} label={E.back} />
        </div>
      </section>
    </>
  );
}

/* ---------- dignitary: the homepage's stage for one person (portrait, role and term, biography), the Rotary
   details and contact beside it, and the other dignitary one step away ---------- */
function DignitaryPage() {
  const d = dignitaryProfile();
  useDocTitle(d?.name);
  if (!d) return <Missing k="dignitary" text={D.dignitary.missing} href={R.nav[0].href} label={D.dignitary.back} />;
  const G = D.dignitary;
  const otherKey = d.type === 'dg' ? 'president' : 'dg';
  const other = R.dignitaries.byYear[R.years.current]?.[otherKey];
  const text = paras(d.bio);
  const ct = d.contact;
  const contact = !!ct && !!(ct.email || ct.phone);
  return (
    <>
      <PageHead k="dignitary" title={d.name} />
      <section className="psec psec--top">
        <div className="wrap dprofile">
          <article className={`dstage glass glass--stage dstage--${d.type}`} data-rv>
            <div className="portrait dstage__portrait">
              {d.photo ? <img src={d.photo.src} alt={d.photo.alt} width={d.photo.w} height={d.photo.h} /> : <span className="portrait__plate" aria-hidden="true">{initials(d.name)}</span>}
            </div>
            <div className="dstage__text">
              <p className="dstage__role">{d.role}{d.term && <span className="dterm">{d.term}</span>}</p>
              {text.length > 0 && (
                <>
                  <h2 className="sr-only">{G.bio}</h2>
                  <div className="dprose">{text.map((t, i) => <p key={i}>{t}</p>)}</div>
                </>
              )}
            </div>
          </article>
          {(d.facts.length > 0 || contact || other) && (
            <aside className="dside" data-rv style={v({ '--d': '60ms' })}>
              {d.facts.length > 0 && (
                <section className="dpanel glass" aria-labelledby="dd-t">
                  <h2 id="dd-t" className="dpanel__title">{G.details}</h2>
                  <Facts list={d.facts} />
                </section>
              )}
              {contact && ct && (
                <section className="dpanel glass" aria-labelledby="dc-t">
                  <h2 id="dc-t" className="dpanel__title">{G.contact}</h2>
                  {ct.email && <a className="drow" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>}
                  {ct.phone && <a className="drow" href={`tel:${telOf(ct.phone)}`}>{I.phone}<span>{ct.phone}</span></a>}
                </section>
              )}
              {other && (
                <a className="dother glass" href={dignitaryHref(otherKey)} data-glow>
                  <span className="dother__photo">{other.photo ? <img src={other.photo.src} alt="" width={other.photo.w} height={other.photo.h} loading="lazy" /> : <span className="ccard__plate" aria-hidden="true">{initials(other.name)}</span>}</span>
                  <span className="dother__who"><b>{other.name}</b><span>{other.role}</span></span>
                  <span className="dother__go" aria-hidden="true">{I.arrow}</span>
                </a>
              )}
            </aside>
          )}
        </div>
      </section>
    </>
  );
}

const BODY: Partial<Record<PageKey, (p: { year: string }) => ReactNode>> = {
  about: () => <About />,
  committee: () => <Committee />,
  finder: () => <Finder />,
  projects: () => <Projects />,
  service: () => <Projects service />,
  calendar: () => <CalendarPage />,
  newsletters: ({ year }) => <Newsletters year={year} />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />
};

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`inner inner--${page}`}>{BODY[page]?.({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  useEffect(() => { startSmoothScroll(); }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  return (
    <ThemeCtx.Provider value={theme}>
      <UtilityBar year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} />
      <Header top={<UtilityBar year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} menu />} />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
