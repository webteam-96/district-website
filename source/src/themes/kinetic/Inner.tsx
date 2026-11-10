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

/* KINETIC inner pages: a colour band with the title set huge on two lines that drift apart as you
   scroll, a running ribbon under it, then candy-coloured cards and hexagons. All scroll motion is CSS
   (scroll and view timelines, transform and opacity only), so the plain-HTML pages move the same way. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  go: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
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
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` });

/* split a title into two lines of about equal length (the homepage's Title does the same) */
const twoLines = (text: string) => {
  const w = text.split(' ');
  if (w.length < 2) return [text];
  let cut = 1, best = Infinity;
  for (let i = 1; i < w.length; i++) {
    const diff = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length);
    if (diff < best) { best = diff; cut = i; }
  }
  return [w.slice(0, cut).join(' '), w.slice(cut).join(' ')];
};

/* a section heading that stretches out as it comes into view */
const Title = ({ text }: { text: string }) => <h2 className="kx-t" data-rv>{text}</h2>;

/* ---------- page head ---------- */
function PageHead({ k, stat }: { k: PageKey; stat?: { value: string; label: string } }) {
  const p = pageInfo(k);
  const lines = twoLines(p.title);
  return (
    <section className={`kx-head kx-head--${k}`} id="top">
      <div className="wrap kx-head__in">
        <h1 className="kx-h1" aria-label={p.title}>
          {lines.map((l, i) => <span key={i} className="kx-h1__l" aria-hidden="true"><span>{l}</span></span>)}
        </h1>
        <div className="kx-head__foot" data-rv>
          <div>
            <p className="kx-head__lead">{p.lead}</p>
            <nav className="kx-crumbs" aria-label={P.breadcrumb}>
              <a href={R.nav[0].href}>{P.home}</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{p.title}</span>
            </nav>
          </div>
          {stat && <p className="kx-head__stat"><b>{stat.value}</b><span>{stat.label}</span></p>}
        </div>
      </div>
      <div className="kx-ribbon" aria-hidden="true">
        <div className="kx-ribbon__track">
          {Array.from({ length: 2 }, (_, j) => (
            <span key={j}>{Array.from({ length: 6 }, (_, i) => <span key={i}>{p.title}<i>✦</i></span>)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const Search = ({ label }: { label: string }) => (
  <label className="kx-search">
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ total, noun }: { total: number; noun: string }) => <p className="kx-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>;
const Empty = ({ text }: { text: string }) => <p className="kx-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="kx-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
const Chips = ({ attr, all, items, label }: { attr: string; all: string; items: { v: string; label: ReactNode }[]; label: string }) => (
  <div className="kx-chips" role="group" aria-label={label} data-lenis-prevent>
    <button type="button" className="fchip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => <button key={x.v} type="button" className="fchip" data-f-chip={attr} data-v={x.v} aria-pressed="false">{x.label}</button>)}
  </div>
);

/* honeycomb row of numbers */
const Hexes = ({ items }: { items: { label: string; value: string }[] }) => (
  <ul className="kx-hexes">
    {items.map((x, i) => (
      <li key={x.label} className="kx-hex" data-rv style={d(i * 90)}>
        <div className="kx-hex__in"><b>{x.value}</b><span>{x.label}</span></div>
      </li>
    ))}
  </ul>
);

/* ================= About ================= */
function About() {
  const a = P.about;
  const s = R.snapshot.byYear[R.years.current];
  return (
    <>
      <PageHead k="about" />
      <section className="kx-sec">
        <div className="wrap kx-about">
          <figure className="kx-about__photo" data-rv>
            <img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" />
          </figure>
          <div className="kx-about__copy" data-rv style={d(100)}>
            <p className="kx-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn-go" href={a.cta.href}>{a.cta.label}{I.go}</a>
          </div>
        </div>
        <div className="wrap">
          <Hexes items={[
            { label: 'Clubs', value: num(s.clubs) },
            { label: 'Members', value: num(s.members) },
            { label: 'Projects this year', value: num(s.projects) },
            { label: 'Beneficiaries', value: num(s.beneficiaries) }
          ]} />
        </div>
      </section>
      <section className="kx-sec kx-band">
        <div className="wrap">
          <Title text={R.fourWayTest.title} />
          <p className="kx-band__lead" data-rv>{R.fourWayTest.lead}</p>
          <ol className="kx-fw">
            {R.fourWayTest.questions.map((q, i) => (
              <li key={i} className="kx-fw__row" data-rv style={d(i * 80)}>
                <span className="kx-fw__n" aria-hidden="true">{i + 1}</span>
                <span className="kx-fw__q" dangerouslySetInnerHTML={{ __html: q.html }} />
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="kx-sec">
        <div className="wrap">
          <Title text={a.focusTitle} />
          <ul className="kx-focus">
            {a.focus.map((f, i) => (
              <li key={f.key} className="kx-tile" data-rv style={d((i % 4) * 70)}>
                <span className="kx-tile__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee ================= */
function Committee() {
  const groups = committee();
  const all = groups.flatMap((g, gi) => g.members.map(m => ({ ...m, group: g.key, gi, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee" stat={{ value: num(all.length), label: `members in ${groups.length} committees` }} />
      <section className="kx-sec" data-filter>
        <div className="wrap">
          <div className="kx-bar" data-rv>
            <Search label={P.committee.searchLabel} />
            <Chips attr="group" all="All" label="Committee" items={groups.map(g => ({ v: g.key, label: g.title }))} />
          </div>
          <Count total={all.length} noun="members" />
          <ul className="kx-people">
            {all.map((m, i) => (
              <li key={i} className={`kx-person kx-g${m.gi % 6} ${m.gi === 0 ? 'kx-person--exec' : ''}`} data-item data-q={m.q} data-group={m.group} data-rv>
                <span className="kx-person__av" aria-hidden="true">{m.initials}</span>
                <div className="kx-person__text">
                  <h3>{m.name}</h3>
                  <p className="kx-person__role">{m.role}</p>
                  {m.club && <p className="kx-person__club">{clubName(m.club)}</p>}
                  <p className="kx-person__group">{m.groupTitle}</p>
                </div>
              </li>
            ))}
          </ul>
          <Empty text={P.committee.empty} />
        </div>
      </section>
    </>
  );
}

/* ================= Club Finder ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  return (
    <>
      <PageHead k="finder" stat={{ value: num(list.length), label: `clubs in District ${R.site.district}` }} />
      <section className="kx-sec" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="kx-bar" data-rv>
            <Search label={f.searchLabel} />
            <label className="kx-select">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="kx-clubs">
            {list.map(c => (
              <li key={c.id} className="kx-club" data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <span className="kx-club__mono" aria-hidden="true">{c.initials}</span>
                <h3>Rotary Club of {c.name}</h3>
                {c.day && <p className="kx-club__meta">{I.clock}Meets every {c.day}</p>}
                {c.place && <p className="kx-club__meta">{I.pin}<span>{c.place}</span></p>}
                <a className="pbtn pbtn--solid kx-club__go" href={c.href} target="_blank" rel="noopener">{f.visit}</a>
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

/* ================= Club Projects / Club Service ================= */
function ProjectCard({ p }: { p: Project }) {
  return (
    <li className="kx-proj" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="kx-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
        <span className={`kx-proj__tag kx-av--${p.avenue}`}>{avenueLabel(p.avenue)}</span>
      </figure>
      <div className="kx-proj__body">
        <p className="kx-proj__date">{shortDate(p.date)} · {clubName(p.club)}</p>
        <h3>{p.title}</h3>
        <p className="kx-proj__sum">{p.summary}</p>
        <dl className="kx-proj__nums">
          <div><dt>{P.projects.statLabels.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
          <div><dt>{P.projects.statLabels.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
          <div><dt>{P.projects.statLabels.hours}</dt><dd>{num(p.hours)}</dd></div>
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
  return (
    <>
      <PageHead k={service ? 'service' : 'projects'} />
      <section className="kx-sec kx-sec--first">
        <div className="wrap">
          <Hexes items={[
            { label: L.projects, value: num(t.projects) },
            { label: L.beneficiaries, value: num(t.beneficiaries) },
            { label: L.amount, value: `₹${R.fmt.num(t.amount, 1)} L` },
            { label: L.hours, value: num(t.hours) }
          ]} />
        </div>
      </section>
      <section className="kx-sec kx-sec--tight" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="kx-bar" data-rv>
            <Search label={x.searchLabel} />
            {!service && <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.map(a => ({ v: a.key, label: a.label }))} />}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="kx-projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar: a strip of months, then each day as a row led by a huge date ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <>
      <PageHead k="calendar" />
      <section className="kx-sec kx-sec--first" data-tabs>
        <div className="wrap">
          <div className="kx-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`kx-month ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
                <b>{m.short}</b><small>{m.date.getFullYear()}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const total = days.reduce((s, x) => s + x.list.length, 0);
            return (
              <div key={m.key} className="kx-mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="kx-mpanel__head">
                  <h2 className="kx-mpanel__title">{m.label}</h2>
                  <Chips attr="type" all="All" label="Show" items={C.types.map(t => ({ v: t.key, label: <><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}</> }))} />
                </div>
                {total ? (
                  <ol className="kx-days">
                    {days.map(x => (
                      <li key={x.iso} className={`kx-day ${x.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(x.list).join('|')} data-rv>
                        <h3 className="kx-day__date">
                          <b>{x.date.getDate()}</b>
                          <span>{longDate(x.date).split(',')[0]}{x.iso === C.today && <em className="tag-today">{C.todayTag}</em>}</span>
                        </h3>
                        <ul className="kx-day__list">
                          {x.list.map((e, i) => {
                            const t = entryText(e);
                            return (
                              <li key={i} className={`kx-ent kx-ent--${e.type}`} data-type={e.type}>
                                <i className={`dot dot--${e.type}`} aria-hidden="true" />
                                <div><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</div>
                                <small>{C.types.find(y => y.key === e.type)!.label}</small>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                ) : null}
                <p className="kx-empty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters: document cards dealt in candy colours ================= */
const DocCard = ({ by, title, date, pdf, q }: { by: string; title: string; date: string; pdf: string; q?: string }) => (
  <li className="kx-doc" data-rv {...(q ? { 'data-item': '', 'data-q': q } : {})}>
    <span className="kx-doc__icon" aria-hidden="true">{I.doc}</span>
    <p className="kx-doc__by">{by}</p>
    <h3>{title}</h3>
    <p className="kx-doc__date">{shortDate(date)}</p>
    <div className="kx-doc__acts">
      <a className="pbtn pbtn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
      <a className="pbtn" href={pdf} download>{R.press.actions.download}</a>
    </div>
  </li>
);
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="kx-sec kx-sec--first">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="kx-ntabs" data-rv>
                <div className="kx-ntabs__row" role="tablist" aria-label="Newsletters">
                  <button type="button" role="tab" className="kx-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="kx-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                <p className="kx-ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="kx-bar" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="kx-docs">
                    {y.bulletins.map((b, i) => <DocCard key={i} by={clubName(b.club)} title={b.title} date={b.date} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ul>
                ) : null}
                <p className="kx-empty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="kx-docs kx-docs--gml">
                    {y.gml.map((g, i) => <DocCard key={i} by={g.governor} title={g.month} date={g.date} pdf={g.pdf} />)}
                  </ul>
                ) : <p className="kx-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact ================= */
function Contact() {
  const c = P.contact;
  const ct = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <section className="kx-sec kx-sec--first">
        <div className="wrap kx-contact">
          <form className="kx-form" data-demo-form data-rv>
            <h2 className="kx-t">{c.title}</h2>
            <p className="kx-form__note">{c.hours}</p>
            <div className="kx-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="kx-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn-go">{F.send}{I.go}</button>
            <p className="kx-form__note">{c.formNote}</p>
            <p className="kx-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <div className="kx-cside">
            <div className="kx-ccard" data-rv>
              <h3>{c.office}</h3>
              <p>{R.dignitaries.byYear[R.years.current].dg.name}, {ct.label}</p>
              <a className="kx-ccard__line" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>
              <a className="kx-ccard__line" href={`tel:${ct.tel}`}>{I.phone}<span>{ct.phoneDisplay}</span></a>
            </div>
            <div className="kx-ccard" data-rv style={d(90)}>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="pbtn pbtn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="kx-ccard" data-rv style={d(180)}>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="pbtn" href={pageInfo('finder').file}>{pageInfo('finder').title}</a>
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
