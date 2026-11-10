import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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

/* CASCADE inner pages: the page head is a warm-paper sheet with the tonal ramp stacked behind it;
   every section below is another rounded sheet that overlaps the one above (paper, apricot,
   aubergine), so a page reads as a pile of sheets, like the homepage stack but without pinning.
   All interaction is data attributes run by shared/inner.js, so the static HTML works too. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  go: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
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
/* the homepage ramp, aubergine to coral: item i takes step i % 6 */
const RAMP = ['#3f0f42', '#5a1248', '#7f164f', '#a31c51', '#c22c4a', '#d9483c'];
const ramp = (i: number) => ({ ['--c' as string]: RAMP[i % RAMP.length] }) as CSSProperties;
const delay = (i: number) => ({ ['--d' as string]: `${(i % 6) * 70}ms` }) as CSSProperties;

type Tone = 'paper' | 'apricot' | 'plum';
const Sheet = ({ tone, className = '', children, ...rest }: { tone: Tone; className?: string; children: ReactNode } & Record<string, unknown>) => (
  <section className={`ci-sheet ci-sheet--${tone} ${className}`} {...rest}><div className="wrap ci-sheet__in">{children}</div></section>
);

/* ---------- page head: title on paper, the ramp's sheets fanned behind it ---------- */
function PageHead({ k, aside, children }: { k: PageKey; aside?: ReactNode; children?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <header className={`ci-head ${children ? 'ci-head--tiers' : ''}`} id="top">
      {!children && <div className="ci-head__fan" aria-hidden="true"><i /><i /><i /><i /></div>}
      <div className="wrap ci-head__row">
        <div className="ci-head__text" data-rv>
          <h1 className="ci-head__title">{p.title}</h1>
          <p className="ci-head__lead">{p.lead}</p>
          <nav className="ci-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a><span aria-hidden="true">/</span><span aria-current="page">{p.title}</span>
          </nav>
        </div>
        {aside && <div className="ci-head__aside" data-rv style={delay(2)}>{aside}</div>}
      </div>
      {children}
    </header>
  );
}
const Big = ({ n, label }: { n: string; label: string }) => <p className="ci-big"><b>{n}</b><span>{label}</span></p>;

const Search = ({ label }: { label: string }) => (
  <label className="ci-search">{I.search}<span className="sr-only">{label}</span><input type="search" data-f-search placeholder={label} autoComplete="off" /></label>
);
const Chips = ({ attr, label, items, all = 'All' }: { attr: string; label: string; items: { v: string; label: ReactNode }[]; all?: string }) => (
  <div className="ci-chips" role="group" aria-label={label} data-lenis-prevent>
    <button type="button" className="ci-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => <button key={x.v} type="button" className="ci-chip" data-f-chip={attr} data-v={x.v} aria-pressed="false">{x.label}</button>)}
  </div>
);
const Count = ({ total, noun }: { total: number; noun: string }) => <p className="ci-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>;
const Empty = ({ text, hidden = true }: { text: string; hidden?: boolean }) => <p className="ci-empty" data-f-empty hidden={hidden}>{text}</p>;
const More = ({ label }: { label: string }) => <div className="ci-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;

/* ================= About ================= */
function About() {
  const a = P.about;
  const s = R.snapshot.byYear[R.years.current];
  const stats = [['Clubs', s.clubs], ['Members', s.members], ['Projects this year', s.projects], ['Beneficiaries', s.beneficiaries]] as const;
  return (
    <>
      <PageHead k="about" />
      <Sheet tone="paper">
        <div className="ci-about">
          <figure className="ci-photo" data-rv><img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" /></figure>
          <div className="ci-about__text" data-rv style={delay(1)}>
            <p className="ci-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn-go" href={a.cta.href}>{a.cta.label}{I.go}</a>
          </div>
        </div>
      </Sheet>
      <section className="ci-ramp" aria-label="District in numbers">
        {stats.map(([label, v], i) => (
          <div key={label} className="ci-ramp__row" style={ramp(i + 2)}>
            <div className="wrap ci-ramp__in" data-rv style={delay(i)}><span>{label}</span><b>{num(v)}</b></div>
          </div>
        ))}
      </section>
      <Sheet tone="plum">
        <div className="ci-fwt">
          <div data-rv><h2 className="ci-title">{R.fourWayTest.title}</h2><p className="ci-sub">{R.fourWayTest.lead}</p></div>
          <ol className="ci-fwt__list">
            {R.fourWayTest.questions.map((q, i) => (
              <li key={i} data-rv style={{ ...ramp(i + 2), ...delay(i) }}><b className="ci-fwt__n" aria-hidden="true">{i + 1}</b><span dangerouslySetInnerHTML={{ __html: q.html }} /></li>
            ))}
          </ol>
        </div>
      </Sheet>
      <Sheet tone="apricot">
        <h2 className="ci-title" data-rv>{a.focusTitle}</h2>
        <ul className="ci-focus">
          {a.focus.map((f, i) => (
            <li key={f.key} className="ci-card" data-rv style={{ ...ramp(i), ...delay(i) }}>
              <span className="ci-focus__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

/* ================= District Committee ================= */
function Committee() {
  const groups = committee();
  const all = groups.flatMap((g, gi) => g.members.map(m => ({ ...m, gi, group: g.key, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee" aside={<Big n={num(all.length)} label={`members in ${groups.length} committees`} />} />
      <Sheet tone="paper" data-filter>
        <div className="ci-bar" data-rv>
          <Search label={P.committee.searchLabel} />
          <Chips attr="group" label="Committee" items={groups.map(g => ({ v: g.key, label: g.title }))} />
        </div>
        <Count total={all.length} noun="members" />
        <ul className="ci-people">
          {all.map((m, i) => (
            <li key={i} className="ci-person" data-item data-q={m.q} data-group={m.group} data-rv style={ramp(m.gi)}>
              <span className="ci-person__av" aria-hidden="true">{m.initials}</span>
              <div className="ci-person__text">
                <h3>{m.name}</h3>
                <p className="ci-person__role">{m.role}</p>
                {m.club && <p className="ci-person__club">{clubName(m.club)}</p>}
              </div>
              <span className="ci-person__group">{m.groupTitle}</span>
            </li>
          ))}
        </ul>
        <Empty text={P.committee.empty} />
      </Sheet>
    </>
  );
}

/* ================= Club Finder ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  return (
    <>
      <PageHead k="finder" aside={<Big n={num(list.length)} label={`clubs in District ${R.site.district}`} />} />
      <Sheet tone="paper" data-filter data-page-size={f.pageSize}>
        <div className="ci-bar" data-rv>
          <Search label={f.searchLabel} />
          <label className="ci-select">
            <span>{f.dayLabel}</span>
            <select data-f="day" defaultValue="">
              <option value="">{f.anyDay}</option>
              {f.days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
        <Count total={list.length} noun="clubs" />
        <ul className="ci-clubs">
          {list.map((c, i) => (
            <li key={c.id} className="ci-club" data-item data-q={c.q} data-day={c.day ?? ''} data-rv style={ramp(i)}>
              <span className="ci-club__mono" aria-hidden="true">{c.initials}</span>
              <h3>Rotary Club of {c.name}</h3>
              {c.day && <p className="ci-club__meta">{I.clock}<span>Meets every {c.day}</span></p>}
              {c.place && <p className="ci-club__meta">{I.pin}<span>{c.place}</span></p>}
              <a className="ci-link" href={c.href} target="_blank" rel="noopener">{f.visit}{I.go}</a>
            </li>
          ))}
        </ul>
        <Empty text={f.empty} />
        <More label={f.more} />
      </Sheet>
    </>
  );
}

/* ================= Club Projects / Club Service ================= */
function ProjectCard({ p, i }: { p: Project; i: number }) {
  const L = P.projects.statLabels;
  return (
    <li className="ci-proj" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv style={ramp(i)}>
      <figure className="ci-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
        <span className="ci-proj__tag">{avenueLabel(p.avenue)}</span>
      </figure>
      <div className="ci-proj__body">
        <p className="ci-proj__date">{shortDate(p.date)} · {clubName(p.club)}</p>
        <h3>{p.title}</h3>
        <p className="ci-proj__sum">{p.summary}</p>
        <dl className="ci-proj__nums">
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
      <PageHead k={service ? 'service' : 'projects'}>
        <div className="wrap">
          <ul className="ci-tiers" aria-label="Totals">
            {rows.map(([label, v], i) => <li key={label} style={{ ...ramp(i + 2), ...delay(i) }} data-rv><b>{v}</b><span>{label}</span></li>)}
          </ul>
        </div>
      </PageHead>
      <Sheet tone="paper" data-filter data-page-size={x.pageSize}>
        <div className="ci-bar" data-rv>
          <Search label={x.searchLabel} />
          {!service && <Chips attr="avenue" label="Avenue of service" all={x.allLabel} items={x.avenues.map(a => ({ v: a.key, label: a.label }))} />}
        </div>
        <Count total={list.length} noun="projects" />
        <ul className="ci-projs">{list.map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}</ul>
        <Empty text={x.empty} />
        <More label={x.more} />
      </Sheet>
    </>
  );
}

/* ================= District Calendar: month ribbon, a tear-off page per month, day sheets ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <>
      <PageHead k="calendar" />
      <Sheet tone="paper" className="ci-cal" data-tabs>
        <div className="ci-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
          {months.map((m, i) => (
            <button key={m.key} type="button" role="tab" className={`ci-month ${m.key === open ? 'is-on' : ''}`} style={ramp(Math.floor(i / 2))} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
              <span>{m.short}</span><small>{m.date.getFullYear()}</small>
            </button>
          ))}
        </div>
        {months.map(m => {
          const days = monthEntries(m.date);
          const total = days.reduce((s, d) => s + d.list.length, 0);
          const counts = C.types.map(t => ({ ...t, n: days.reduce((s, d) => s + d.list.filter(e => e.type === t.key).length, 0) }));
          return (
            <div key={m.key} className="ci-mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
              <aside className="ci-leaf" data-rv>
                <p className="ci-leaf__month">{m.date.getFullYear()}</p>
                <h2 className="ci-leaf__name">{m.label.split(' ')[0]}</h2>
                <p className="ci-leaf__total"><b>{num(total)}</b> entries</p>
                <ul className="ci-leaf__key">{counts.map(t => <li key={t.key}><i className={`dot dot--${t.key}`} />{t.label}<b>{num(t.n)}</b></li>)}</ul>
              </aside>
              <div className="ci-agenda">
                <Chips attr="type" label="Show" items={C.types.map(t => ({ v: t.key, label: <><i className={`dot dot--${t.key}`} />{t.group}</> }))} />
                {total ? (
                  <ol className="ci-days">
                    {days.map((d, i) => (
                      <li key={d.iso} id={`d-${d.iso}`} className={`ci-day ${d.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(d.list).join('|')} style={ramp(i)}>
                        <h3 className="ci-day__date"><b>{d.date.getDate()}</b><span>{longDate(d.date).split(',')[0]}</span>{d.iso === C.today && <em className="tag-today">{C.todayTag}</em>}</h3>
                        <ul className="ci-day__list">
                          {d.list.map((e, j) => {
                            const t = entryText(e);
                            return (
                              <li key={j} className="ci-ent" data-type={e.type}>
                                <i className={`dot dot--${e.type}`} aria-hidden="true" />
                                <div><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</div>
                                <small>{C.types.find(x => x.key === e.type)!.label}</small>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                ) : null}
                <Empty text={P.calendar.emptyMonth} hidden={total > 0} />
              </div>
            </div>
          );
        })}
      </Sheet>
    </>
  );
}

/* ================= Newsletters: file folders, no images ================= */
const Folder = ({ i, top, title, date, pdf, extra }: { i: number; top: string; title: string; date: string; pdf: string; extra?: Record<string, string> }) => (
  <li className="ci-file" data-rv style={ramp(i)} {...extra}>
    <span className="ci-file__icon" aria-hidden="true">{I.doc}</span>
    <p className="ci-file__top">{top}</p>
    <h3>{title}</h3>
    <p className="ci-file__date">{shortDate(date)}</p>
    <div className="ci-file__acts">
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
      <Sheet tone="apricot">
        {pressYears().map(y => (
          <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
            <div className="ci-ntabs" role="tablist" aria-label="Newsletters" data-rv>
              <button type="button" role="tab" className="ci-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
              <button type="button" role="tab" className="ci-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
              <p className="ci-ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
            </div>
            <div data-panel="club" role="tabpanel" data-filter>
              <div className="ci-bar" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
              {y.bulletins.length ? (
                <ul className="ci-files">
                  {y.bulletins.map((b, i) => <Folder key={i} i={i} top={clubName(b.club)} title={b.title} date={b.date} pdf={b.pdf} extra={{ 'data-item': '', 'data-q': `${b.title} ${b.club}`.toLowerCase() }} />)}
                </ul>
              ) : null}
              <Empty text={R.fmt.fill(R.press.club.empty, { year: y.year })} hidden={y.bulletins.length > 0} />
            </div>
            <div data-panel="governor" role="tabpanel" hidden>
              {y.gml.length ? (
                <ul className="ci-files">{y.gml.map((g, i) => <Folder key={i} i={i + 2} top={g.governor} title={g.month} date={g.date} pdf={g.pdf} />)}</ul>
              ) : <p className="ci-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
            </div>
          </div>
        ))}
      </Sheet>
    </>
  );
}

/* ================= Contact: the form on paper, three stacked colour sheets beside it ================= */
function Contact() {
  const c = P.contact;
  const d = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <Sheet tone="paper">
        <div className="ci-contact">
          <form className="ci-form" data-demo-form data-rv>
            <h2 className="ci-title">{c.title}</h2>
            <p className="ci-note">{c.hours}</p>
            <div className="ci-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="ci-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn-go">{F.send}{I.go}</button>
            <p className="ci-note">{c.formNote}</p>
            <p className="ci-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <div className="ci-stackcards">
            <div className="ci-scard" data-rv style={ramp(0)}>
              <h3>{c.office}</h3>
              <p className="ci-scard__who">{R.dignitaries.byYear[R.years.current].dg.name}, {d.label}</p>
              <a className="ci-scard__line" href={`mailto:${d.email}`}>{I.mail}<span>{d.email}</span></a>
              <a className="ci-scard__line" href={`tel:${d.tel}`}>{I.phone}<span>{d.phoneDisplay}</span></a>
            </div>
            <div className="ci-scard" data-rv style={{ ...ramp(3), ...delay(1) }}>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="pbtn pbtn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="ci-scard ci-scard--light" data-rv style={delay(2)}>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="ci-link" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.go}</a>
            </div>
          </div>
        </div>
      </Sheet>
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
  return <main id="main" ref={ref} className={`cin cin--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  useEffect(() => { startSmoothScroll({ allowNestedScroll: true }); }, []);
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
