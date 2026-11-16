import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, monthMatrix, shortDate, toISO } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
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
  pin: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>
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
          <span className="kx-fig__n">{f.pre && <small>{f.pre}</small>}{f.count === false ? <b>{f.n}</b> : <b data-count>{f.n}</b>}{f.post && <small>{f.post}</small>}</span>
          <span className="kx-fig__l">{f.label}</span>
        </span>
      </li>
    ))}
  </ul>
);

function Head({ k, figs, tools, lead = true }: { k: PageKey; figs?: Fig[]; tools?: ReactNode; lead?: boolean }) {
  const p = pageInfo(k);
  return (
    <section className="kx-head" id="top">
      <div className="wrap kx-head__in">
        <nav className="kx-crumbs" aria-label={P.breadcrumb}>
          <a href={R.nav[0].href}>{P.home}</a>
          <i aria-hidden="true" />
          <span aria-current="page">{p.title}</span>
        </nav>
        <div className="kx-head__line">
          <h1 className="kx-title"><span>{p.title}</span></h1>
          {figs && <Hexes figs={figs} className={`kx-figs--${figs.length}`} />}
        </div>
        {lead && <p className="kx-head__lead">{p.lead}</p>}
        {tools && <div className="kx-tools">{tools}</div>}
      </div>
    </section>
  );
}

const Search = ({ label, total }: { label: string; total: number }) => (
  <div className="kx-search">
    {I.search}
    <input type="search" data-f-search placeholder={label} aria-label={label} autoComplete="off" enterKeyHint="search" />
    <span className="kx-search__n" aria-live="polite"><b data-f-count>{num(total)}</b><span className="kx-search__of"> of {num(total)}</span></span>
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

/* ================= About: title, breadcrumb and the admin's one content field ================= */
function About() {
  return (
    <>
      <Head k="about" lead={false} />
      <section className="kx-about">
        <div className="wrap"><AdminContent className="kx-prose" /></div>
      </section>
    </>
  );
}

/* ================= District Committee: everyone meets in the middle, on one spine ================= */
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
            {groups.map((g, gi) => (
              <section key={g.key} className={`kx-cg kx-t${gi % 6}`} data-f-group data-rv aria-labelledby={`kx-${g.key}`}>
                <h2 className="kx-cg__name" id={`kx-${g.key}`}><span>{g.title}</span><b data-f-group-count>{g.members.length}</b></h2>
                <ul className="kx-pairs">
                  {g.members.map((m, i) => (
                    /* the first two of the first committee (the Governor and the Governor Elect) are the duo */
                    <li key={i} className={`kx-mem${gi === 0 && i < 2 ? ' kx-mem--lead' : ''}`} data-item data-q={m.q} data-group={g.key}>
                      <span className="kx-av">
                        {m.photo ? <img src={m.photo.src} alt={m.photo.alt} width={m.photo.w} height={m.photo.h} /> : <span aria-hidden="true">{m.initials}</span>}
                      </span>
                      <span className="kx-mem__t">
                        <h3 className="kx-mem__name">{m.name}</h3>
                        <span className="kx-mem__role">{m.role}</span>
                        {m.club && <span className="kx-mem__club">{clubName(m.club)}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
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
                  {(c.day || c.place) && <p className="kx-club__meta">{c.day && <b>{c.day}</b>}{c.day && c.place && ' · '}{c.place}</p>}
                </div>
                <a className="kx-club__go" href={c.href} target="_blank" rel="noopener" aria-label={`${f.visit}: Rotary Club of ${c.name}`}>{I.go}</a>
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

function ProjectCard({ p }: { p: Project }) {
  return (
    <li className="kx-proj" data-item data-q={qOf(p)} data-avenue={p.avenue} data-rv>
      <img className="kx-proj__img" src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
      <div className="kx-proj__body">
        <p className="kx-proj__meta"><time dateTime={p.date}>{shortDate(p.date)}</time> · {clubName(p.club)}</p>
        <h3 className="kx-proj__title">{p.title}</h3>
        <p className="kx-proj__sum">{p.summary}</p>
        <dl className="kx-nums">
          {figsOf(p).map(x => <div key={x.label}><dt>{x.label}</dt><dd>{x.pre}{x.n}{x.post}</dd></div>)}
        </dl>
      </div>
    </li>
  );
}

function Projects() {
  const x = P.projects;
  const list = projectsOf();
  /* the avenues in their usual order, then any the data adds */
  const keys = [...new Set([...x.avenues.map(a => a.key), ...list.map(p => p.avenue)])];
  return (
    <div data-filter>
      <Head
        k="projects"
        figs={totalFigs(totals(list))}
        tools={<>
          <Search label={x.searchLabel} total={list.length} />
          <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.map(a => ({ v: a.key, label: a.label }))} />
        </>}
      />
      <section className="kx-body">
        <div className="wrap kx-avs">
          {keys.map(k => {
            const items = list.filter(p => p.avenue === k);
            return items.length ? (
              <section key={k} className={`kx-avn kx-avn--${k}`} data-f-group aria-labelledby={`kx-av-${k}`}>
                <div className="kx-avn__head">
                  <h2 className="kx-avn__title" id={`kx-av-${k}`}>{avenueLabel(k)}</h2>
                  <b className="kx-avn__n" data-f-group-count>{items.length}</b>
                </div>
                <ul className="kx-projs">{items.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
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
  return (
    <>
      <Head k="service" figs={totalFigs(totals(list))} />
      <div className="kx-chapters" data-filter data-page-size={x.pageSize}>
        <ol className="kx-chaps">
          {list.map((p, i) => (
            <li key={p.id} className={`kx-chap kx-s${i % 4}`} data-item data-q={qOf(p)} data-avenue={p.avenue}>
              <div className="wrap kx-chap__in" data-rv>
                <p className="kx-chap__meta"><time dateTime={p.date}>{shortDate(p.date)}</time> · {clubName(p.club)}</p>
                <h2 className="kx-chap__title kx-stretch">{p.title}</h2>
                <img className="kx-chap__img" src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading={i ? 'lazy' : undefined} />
                <p className="kx-chap__sum">{p.summary}</p>
                <Hexes figs={figsOf(p)} className="kx-chap__nums" />
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
                            return <li key={k} className={`kx-ent kx-ent--${e.type}`} data-type={e.type}><span className="sr-only">{typeLabel(e.type)}: </span><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</li>;
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
function Issue({ date, title, by, pdf, q, i }: { date: string; title: string; by: string; pdf: string; q?: string; i: number }) {
  const [d, mon, yr] = dmy(date);
  return (
    <li className="kx-issue" data-rv style={v({ '--n': Math.min(i, 4) })} {...(q ? { 'data-item': '', 'data-q': q } : {})}>
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
