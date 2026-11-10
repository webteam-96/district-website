import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { R, longDate, shortDate } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* PRISM inner pages: a split page head (Rotary-blue panel beside a full-colour photo, like the
   homepage hero), then white sheets, blue panels and ranked rows with meters. Every interactive
   part is plain markup with data attributes, so the static HTML works too (shared/inner.js). */

const ACC = ['#0067C8', '#00A2E0', '#D41367', '#00ADBB', '#F7A81B'];
const acc = (i: number) => ({ ['--accent' as string]: ACC[i % ACC.length] });
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` });

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  doc: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M7 3h7l5 5v13H7z" /><path {...sw} d="M14 3v5h5M10 13h6M10 17h6" /></svg>
};
const FOCUS: Record<string, ReactNode> = {
  peace: <path {...sw} d="M12 3v18M12 12l-6.4 6.4M12 12l6.4 6.4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" />,
  disease: <path {...sw} d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  water: <path {...sw} d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3z" />,
  mothers: <path {...sw} d="M12 20s-7-4.2-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4c0 5.4-7 9.6-7 9.6z" />,
  education: <path {...sw} d="m2.5 9 9.5-5 9.5 5-9.5 5zM6 11v5c3.5 2.5 8.5 2.5 12 0v-5" />,
  economy: <path {...sw} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  environment: <path {...sw} d="M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M5 19l7-7" />
};
const AVENUE: Record<string, string> = { club: '#0067C8', community: '#00ADBB', vocational: '#F7A81B', international: '#00A2E0', youth: '#D41367', image: '#8a5a00' };

/* the photo beside each page head: the menu's own picture where the page has one */
const navImg = (key: string) => R.nav.find(n => n.key === key)?.image;
const HEAD_IMG: Partial<Record<PageKey, string>> = { calendar: 'home', newsletters: 'service', contact: 'finder' };

/* Title with the last word in the Prism gold gradient (the homepage's stitle__hl idea). */
const HL = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i > 0 ? <>{text.slice(0, i)} <span className="px-hl">{text.slice(i + 1)}</span></> : <span className="px-hl">{text}</span>;
};

/* ---------- page head: blue panel (title, lead, breadcrumb) overlapping an edge-to-edge photo ---------- */
function PageHead({ k, aside }: { k: PageKey; aside?: ReactNode }) {
  const p = pageInfo(k);
  const img = navImg(HEAD_IMG[k] ?? k)!;
  return (
    <section className="px-head" id="top">
      <div className="px-head__panel" data-rv>
        <nav className="px-crumbs" aria-label={P.breadcrumb}>
          <a href={R.nav[0].href}>{P.home}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.title}</span>
        </nav>
        <h1 className="px-head__title"><HL text={p.title} /></h1>
        <p className="px-head__lead">{p.lead}</p>
        {aside && <div className="px-head__aside">{aside}</div>}
      </div>
      <figure className="px-head__photo" data-rv style={d(120)}>
        <img src={img.src} alt={img.alt} width={img.w} height={img.h} />
      </figure>
    </section>
  );
}
const HeadStat = ({ value, text }: { value: string; text: string }) => <p className="px-hstat"><b>{value}</b><span>{text}</span></p>;

const Search = ({ label }: { label: string }) => (
  <label className="px-search">
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="px-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>
);
const Empty = ({ text }: { text: string }) => <p className="px-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="px-more"><button type="button" className="btn btn--line" data-f-more hidden>{label}</button></div>;
const Chips = ({ attr, all, items, label }: { attr: string; all: string; items: { v: string; label: ReactNode }[]; label: string }) => (
  <div className="px-chips" role="group" aria-label={label}>
    <button type="button" className="px-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => <button key={x.v} type="button" className="px-chip" data-f-chip={attr} data-v={x.v} aria-pressed="false">{x.label}</button>)}
  </div>
);

/* ================= About ================= */
function About() {
  const a = P.about;
  const S = R.snapshot.byYear;
  const keys = [['clubs', 'Clubs'], ['members', 'Members'], ['projects', 'Projects this year'], ['beneficiaries', 'Beneficiaries']] as const;
  const max = (k: (typeof keys)[number][0]) => Math.max(...R.years.list.map(y => S[y][k])) || 1;
  return (
    <>
      <PageHead k="about" />
      <section className="px-sec">
        <div className="wrap px-about">
          <div className="px-about__text" data-rv>
            <p className="px-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn btn--solid px-btn" href={a.cta.href}>{a.cta.label}</a>
          </div>
          <ul className="px-meters" data-rv style={d(100)}>
            {keys.map(([k, label], i) => (
              <li key={k} className="px-meter" style={{ ...acc(i), ['--w' as string]: S[R.years.current][k] / max(k), ['--i' as string]: i }}>
                <span className="px-meter__label">{label}</span>
                <b className="px-meter__num">{num(S[R.years.current][k])}</b>
                <span className="px-meter__bar" aria-hidden="true"><i /></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="px-sec">
        <div className="wrap">
          <div className="px-blue px-fwt" data-rv>
            <div className="px-fwt__head">
              <h2 className="px-title px-title--on"><HL text={R.fourWayTest.title} /></h2>
              <p>{R.fourWayTest.lead}</p>
            </div>
            <ol className="px-fwt__list">
              {R.fourWayTest.questions.map((q, i) => (
                <li key={i} data-rv style={d(i * 90)}><span aria-hidden="true">{i + 1}</span><p dangerouslySetInnerHTML={{ __html: q.html }} /></li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <section className="px-sec">
        <ul className="wrap px-focus">
          <li className="px-focus__head" data-rv><h2 className="px-title"><HL text={a.focusTitle} /></h2></li>
          {a.focus.map((f, i) => (
            <li key={f.key} className="px-sheet px-focus__card" data-rv style={{ ...acc(i), ...d(((i + 1) % 4) * 70) }}>
              <span className="px-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ================= District Committee: blue filter rail + member roster ================= */
function Committee() {
  const groups = committee();
  const all = groups.flatMap((g, gi) => g.members.map(m => ({ ...m, gi, group: g.key, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee" aside={<HeadStat value={num(all.length)} text={`members in ${groups.length} committees`} />} />
      <section className="px-sec px-sec--first" data-filter>
        <div className="wrap px-roster">
          <aside className="px-blue px-rail" data-rv>
            <Search label={P.committee.searchLabel} />
            <Chips attr="group" all="All committees" label="Committee" items={groups.map(g => ({ v: g.key, label: g.title }))} />
          </aside>
          <div className="px-roster__main">
            <Count total={all.length} noun="members" />
            <ul className="px-people">
              {all.map((m, i) => (
                <li key={i} className={`px-person ${m.gi === 0 ? 'is-exec' : ''}`} style={acc(m.gi)} data-item data-q={m.q} data-group={m.group} data-rv>
                  <span className="px-person__av" aria-hidden="true">{m.initials}</span>
                  <div className="px-person__text">
                    <h3>{m.name}</h3>
                    <p className="px-person__role">{m.role}</p>
                    {m.club && <p className="px-person__club">{clubName(m.club)}</p>}
                  </div>
                  <span className="px-person__group">{m.groupTitle}</span>
                </li>
              ))}
            </ul>
            <Empty text={P.committee.empty} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ================= Club Finder: blue search bar + directory rows ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  return (
    <>
      <PageHead k="finder" aside={<HeadStat value={num(list.length)} text={`clubs in District ${R.site.district}`} />} />
      <section className="px-sec px-sec--first" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="px-blue px-tool" data-rv>
            <Search label={f.searchLabel} />
            <label className="px-select">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="px-dir">
            {list.map((c, i) => (
              <li key={c.id} className="px-club" style={acc(i)} data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <span className="px-club__mono" aria-hidden="true">{c.initials}</span>
                <div className="px-club__text">
                  <h3>Rotary Club of {c.name}</h3>
                  {c.day && <p className="px-club__meta">{I.clock}Meets every {c.day}</p>}
                  {c.place && <p className="px-club__meta">{I.pin}<span>{c.place}</span></p>}
                </div>
                <a className="px-go" href={c.href} target="_blank" rel="noopener" aria-label={`${f.visit}: Rotary Club of ${c.name}`}>{I.arrow}</a>
              </li>
            ))}
          </ul>
          <Empty text={f.empty} />
          <More label={f.more} />
        </div>
      </section>
    </>
  );
}

/* ================= Club Projects / Club Service: totals band + side-photo cards ================= */
function ProjectCard({ p }: { p: Project }) {
  const L = P.projects.statLabels;
  return (
    <li className="px-proj" style={{ ['--accent' as string]: AVENUE[p.avenue] ?? ACC[0] }} data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="px-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
      </figure>
      <div className="px-proj__body">
        <span className="px-proj__tag">{avenueLabel(p.avenue)}</span>
        <h3>{p.title}</h3>
        <p className="px-proj__date">{shortDate(p.date)} · {clubName(p.club)}</p>
        <p className="px-proj__sum">{p.summary}</p>
        <dl className="px-proj__nums">
          <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
          <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
          <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
        </dl>
      </div>
    </li>
  );
}
function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const list = projectsOf(service ? 'club' : undefined);
  const t = totals(list);
  const L = x.statLabels;
  const rows = [[L.projects, num(t.projects)], [L.beneficiaries, num(t.beneficiaries)], [L.amount, `₹${R.fmt.num(t.amount, 1)} L`], [L.hours, num(t.hours)]];
  return (
    <>
      <PageHead k={service ? 'service' : 'projects'} />
      <section className="px-sec px-sec--first">
        <ul className="wrap px-totals">
          {rows.map(([label, value], i) => (
            <li key={label} className="px-blue px-total" data-rv style={d(i * 80)}><b>{value}</b><span>{label}</span></li>
          ))}
        </ul>
      </section>
      <section className="px-sec" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="px-tool px-tool--light" data-rv>
            <Search label={x.searchLabel} />
            {!service && <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.map(a => ({ v: a.key, label: a.label }))} />}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="px-projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar: month rail + a board of day tiles ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  const label = (k: string) => C.types.find(x => x.key === k)!.label;
  return (
    <>
      <PageHead k="calendar" />
      <section className="px-sec px-sec--first" data-tabs>
        <div className="wrap">
          <div className="px-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`px-month ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
                <span>{m.short}</span><small>{m.date.getFullYear()}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const total = days.reduce((s, x) => s + x.list.length, 0);
            return (
              <div key={m.key} className="px-cal" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="px-cal__bar" data-rv>
                  <h2 className="px-title"><HL text={m.label} /></h2>
                  <Chips attr="type" all="All" label="Show" items={C.types.map(t => ({ v: t.key, label: <><i className={`dot dot--${t.key}`} />{t.group}</> }))} />
                </div>
                {total ? (
                  <ol className="px-board">
                    {days.map(x => (
                      <li key={x.iso} className={`px-day ${x.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(x.list).join('|')} data-rv>
                        <h3 className="px-day__date">
                          <b>{x.date.getDate()}</b>
                          <span>{longDate(x.date).split(',')[0]}</span>
                          {x.iso === C.today && <em className="tag-today">{C.todayTag}</em>}
                          <small>{num(x.list.length)}</small>
                        </h3>
                        <ul className="px-day__list" data-lenis-prevent>
                          {x.list.map((e, i) => {
                            const t = entryText(e);
                            return (
                              <li key={i} className={`px-ent px-ent--${e.type}`} data-type={e.type}>
                                <b>{t.head}</b>
                                <span>{[label(e.type), t.sub].filter(Boolean).join(' · ')}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                ) : null}
                <p className="px-empty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters: blue segmented bar + document cards ================= */
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const Doc = ({ i, by, title, date, pdf, q }: { i: number; by: string; title: string; date: string; pdf: string; q?: string }) => (
    <li className="px-doc" style={acc(i)} data-rv {...(q ? { 'data-item': '', 'data-q': q } : {})}>
      <div className="px-doc__band"><span aria-hidden="true">{I.doc}</span><p>{by}</p></div>
      <div className="px-doc__body">
        <h3>{title}</h3>
        <p className="px-doc__date">{shortDate(date)}</p>
        <div className="px-doc__acts">
          <a className="btn btn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
          <a className="btn btn--line" href={pdf} download>{R.press.actions.download}</a>
        </div>
      </div>
    </li>
  );
  return (
    <>
      <PageHead k="newsletters" />
      <section className="px-sec px-sec--first">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="px-blue px-seg" data-rv>
                <div className="px-seg__tabs" role="tablist" aria-label="Newsletters">
                  <button type="button" role="tab" className="px-seg__tab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="px-seg__tab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                <p className="px-seg__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="px-tool px-tool--light" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="px-docs">
                    {y.bulletins.map((b, i) => <Doc key={i} i={i} by={clubName(b.club)} title={b.title} date={b.date} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ul>
                ) : null}
                <p className="px-empty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="px-docs">
                    {y.gml.map((g, i) => <Doc key={i} i={i} by={g.governor} title={g.month} date={g.date} pdf={g.pdf} />)}
                  </ul>
                ) : <p className="px-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: tall blue office panel + white form sheet ================= */
function Contact() {
  const c = P.contact;
  const o = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <section className="px-sec px-sec--first">
        <div className="wrap px-contact">
          <aside className="px-blue px-office" data-rv>
            <div className="px-office__part">
              <h2 className="px-office__title">{c.office}</h2>
              <p className="px-office__who">{R.dignitaries.byYear[R.years.current].dg.name}, {o.label}</p>
              <a className="px-office__line" href={`mailto:${o.email}`}>{I.mail}<span>{o.email}</span></a>
              <a className="px-office__line" href={`tel:${o.tel}`}>{I.phone}<span>{o.phoneDisplay}</span></a>
            </div>
            <div className="px-office__part">
              <h3 className="px-office__title">{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="btn btn--solid px-btn" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="px-office__part">
              <h3 className="px-office__title">{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="px-office__link" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.arrow}</a>
            </div>
          </aside>
          <form className="px-sheet px-form" data-demo-form data-rv style={d(100)}>
            <h2 className="px-title"><HL text={c.title} /></h2>
            <p className="px-form__note">{c.hours}</p>
            <div className="px-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="px-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn btn--solid px-btn">{F.send}</button>
            <p className="px-form__note">{c.formNote}</p>
            <p className="px-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
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
  service: () => <Projects service />,
  calendar: () => <CalendarPage />,
  newsletters: ({ year }) => <Newsletters year={year} />,
  contact: () => <Contact />
};

function Body({ page, year }: { page: PageKey; year: string }) {
  const ref = useBehaviours<HTMLElement>();
  return <main id="main" ref={ref} className={`px-inner px-inner--${page}`}>{BODY[page]({ year })}</main>;
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
