import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { R, longDate, shortDate, weekdayName, toISO } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, pressYears, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { Balloon, Rings } from './Calendar';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* TIDE inner pages: a deep-teal page head that ends in rolling sea, then white sheets built from
   Tide's own pieces — tickets with perforated stubs, spines, accent bars and tall poster type.
   Every interactive part is plain markup with data attributes (shared/inner.js), so the same page
   works as static HTML too. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
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
const ACCENTS = ['var(--turq)', 'var(--cranberry)', 'var(--azure)', 'var(--gold)'];
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` });
const TILE = 'M0 40C125 80 375 0 500 40S875 80 1000 40V120H0Z';

/* ---------- page head: deep teal, poster title, the band ends in rolling sea ---------- */
function PageHead({ k, children }: { k: PageKey; children?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="tp-head" id="top">
      <div className="wrap tp-head__row">
        <div className="tp-head__text" data-rv>
          <nav className="tp-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.title}</span>
          </nav>
          <h1 className="tp-head__title">{p.title}</h1>
          <p className="tp-head__lead">{p.lead}</p>
        </div>
        {children && <div className="tp-head__side" data-rv style={d(140)}>{children}</div>}
      </div>
      <div className="tp-sea" aria-hidden="true">
        {[0, 1].map(i => (
          <svg key={i} className={`tp-sea__layer tp-sea__layer--${i}`} viewBox="0 0 2000 120" preserveAspectRatio="none">
            <path d={TILE} /><path d={TILE} transform="translate(1000 0)" />
          </svg>
        ))}
      </div>
    </section>
  );
}

/* a ticket-shaped figure used in page heads */
const HeadTicket = ({ value, label }: { value: string; label: string }) => (
  <div className="tp-hticket"><b>{value}</b><span>{label}</span></div>
);

const Search = ({ label }: { label: string }) => (
  <label className="tp-search">
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Chips = ({ attr, label, all, items }: { attr: string; label: string; all: string; items: { v: string; label: ReactNode }[] }) => (
  <div className="tp-chips" role="group" aria-label={label}>
    <button type="button" className="tp-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(i => <button key={i.v} type="button" className="tp-chip" data-f-chip={attr} data-v={i.v} aria-pressed="false">{i.label}</button>)}
  </div>
);
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="tp-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>
);
const Empty = ({ text }: { text: string }) => <p className="tp-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="tp-more"><button type="button" className="btn-read" data-f-more hidden>{label}</button></div>;

/* ================= About ================= */
function About() {
  const a = P.about;
  const s = R.snapshot.byYear[R.years.current];
  const stats = [
    { label: 'Clubs', value: num(s.clubs) },
    { label: 'Members', value: num(s.members) },
    { label: 'Projects this year', value: num(s.projects) },
    { label: 'Beneficiaries', value: num(s.beneficiaries) }
  ];
  const ORD = ['1st', '2nd', '3rd', '4th'];
  return (
    <>
      <PageHead k="about" />
      <section className="tp-sec">
        <div className="wrap tp-about">
          <div className="tp-about__text" data-rv>
            <p className="tp-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn-read" href={a.cta.href}>{a.cta.label}{I.arrow}</a>
          </div>
          <figure className="tp-about__photo" data-rv style={d(120)}>
            <img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" />
          </figure>
        </div>
      </section>
      <section className="tp-band" aria-label="District at a glance">
        <ul className="wrap tp-band__row">
          {stats.map((x, i) => (
            <li key={x.label} className="tp-band__cell" style={{ ['--accent' as string]: ACCENTS[i], ...d(i * 90) }} data-rv><b>{x.value}</b><span>{x.label}</span></li>
          ))}
        </ul>
      </section>
      <section className="tp-sec">
        <div className="wrap">
          <div className="tp-title-row" data-rv>
            <h2 className="tp-title">{R.fourWayTest.title}</h2>
            <p>{R.fourWayTest.lead}</p>
          </div>
          <ol className="tp-fwt">
            {R.fourWayTest.questions.map((q, i) => (
              <li key={i} className="tp-tk" style={{ ['--c' as string]: ACCENTS[i], ...d(i * 90) }} data-rv>
                <span className="tp-tk__stub"><b>{ORD[i]}</b></span>
                <p className="tp-tk__main tp-fwt__q"><span dangerouslySetInnerHTML={{ __html: q.html }} /></p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="tp-sec tp-sec--tint">
        <div className="wrap">
          <h2 className="tp-title" data-rv>{a.focusTitle}</h2>
          <ul className="tp-focus">
            {a.focus.map((f, i) => (
              <li key={f.key} className="tp-focus__card" style={{ ['--c' as string]: ACCENTS[i % 4], ...d((i % 4) * 70) }} data-rv>
                <span className="tp-focus__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
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

/* ================= District Committee: arched name badges ================= */
function Committee() {
  const groups = committee();
  const all = groups.flatMap(g => g.members.map(m => ({ ...m, group: g.key, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee">
        <HeadTicket value={num(all.length)} label={`members in ${groups.length} committees`} />
      </PageHead>
      <section className="tp-sec" data-filter>
        <div className="wrap">
          <div className="tp-bar" data-rv>
            <Search label={P.committee.searchLabel} />
            <Chips attr="group" label="Committee" all="All" items={groups.map(g => ({ v: g.key, label: g.title }))} />
          </div>
          <Count total={all.length} noun="members" />
          <ul className="tp-badges">
            {all.map((m, i) => (
              <li key={i} className={`tp-badge ${m.group === 'g0' ? 'tp-badge--exec' : ''}`} data-item data-q={m.q} data-group={m.group} data-rv>
                <span className="tp-badge__arch" aria-hidden="true">{m.initials}</span>
                <div className="tp-badge__text">
                  <h3>{m.name}</h3>
                  <p className="tp-badge__role">{m.role}</p>
                  {m.club && <p className="tp-badge__club">{clubName(m.club)}</p>}
                  <p className="tp-badge__group">{m.groupTitle}</p>
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

/* ================= Club Finder: one ticket per club, the stub is its meeting day ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  return (
    <>
      <PageHead k="finder">
        <HeadTicket value={num(list.length)} label={`clubs in District ${R.site.district}`} />
      </PageHead>
      <section className="tp-sec" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="tp-bar" data-rv>
            <Search label={f.searchLabel} />
            <label className="tp-select">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="tp-clubs">
            {list.map((c, i) => (
              <li key={c.id} className="tp-tk tp-club" style={{ ['--c' as string]: ACCENTS[i % 3] }} data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <span className="tp-tk__stub">
                  <b>{c.day ? c.day.slice(0, 3) : '—'}</b>
                  <small>{c.day ? 'Weekly' : 'Day TBC'}</small>
                </span>
                <div className="tp-tk__main">
                  <h3>Rotary Club of {c.name}</h3>
                  {c.place && <p className="tp-club__place">{I.pin}<span>{c.place}</span></p>}
                  <a className="tp-link" href={c.href} target="_blank" rel="noopener">{f.visit}{I.arrow}</a>
                </div>
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

/* ================= Club Projects / Club Service: photo cards with a date stub and a deep-teal tally ================= */
function ProjectCard({ p }: { p: Project }) {
  const [day, mon, yr] = shortDate(p.date).split(' ');
  return (
    <li className="tp-proj" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="tp-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
        <span className={`tp-proj__tag tp-proj__tag--${p.avenue}`}>{avenueLabel(p.avenue)}</span>
      </figure>
      <div className="tp-proj__head">
        <span className="tp-proj__date" aria-label={shortDate(p.date)}><b>{day}</b><small>{mon} {yr}</small></span>
        <div>
          <h3>{p.title}</h3>
          <p className="tp-proj__club">{clubName(p.club)}</p>
        </div>
      </div>
      <p className="tp-proj__sum">{p.summary}</p>
      <dl className="tp-proj__nums">
        <div><dt>{P.projects.statLabels.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
        <div><dt>{P.projects.statLabels.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
        <div><dt>{P.projects.statLabels.hours}</dt><dd>{num(p.hours)}</dd></div>
      </dl>
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
      <PageHead k={service ? 'service' : 'projects'}>
        <dl className="tp-tally">
          <div><dt>{L.projects}</dt><dd>{num(t.projects)}</dd></div>
          <div><dt>{L.beneficiaries}</dt><dd>{num(t.beneficiaries)}</dd></div>
          <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(t.amount, 1)} L</dd></div>
          <div><dt>{L.hours}</dt><dd>{num(t.hours)}</dd></div>
        </dl>
      </PageHead>
      <section className="tp-sec" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="tp-bar" data-rv>
            <Search label={x.searchLabel} />
            {!service && <Chips attr="avenue" label="Avenue of service" all={x.allLabel} items={x.avenues.map(a => ({ v: a.key, label: a.label }))} />}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="tp-projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar: a tide gauge of the month's days over a wall of day cards ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <>
      <PageHead k="calendar" />
      <section className="tp-sec" data-tabs>
        <div className="wrap">
          <div className="tp-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`tp-month ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
                <span>{m.short}</span><small>{m.date.getFullYear()}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const by = new Map(days.map(x => [x.iso, x.list]));
            const total = days.reduce((s, x) => s + x.list.length, 0);
            const count = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0).getDate();
            return (
              <div key={m.key} className="tp-mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="tp-gauge" data-rv>
                  <h2 className="tp-gauge__title">{m.label}</h2>
                  <ol className="tp-gauge__days" data-lenis-prevent>
                    {Array.from({ length: count }, (_, i) => {
                      const day = new Date(m.date.getFullYear(), m.date.getMonth(), i + 1);
                      const iso = toISO(day);
                      const list = by.get(iso);
                      const cls = `tp-gday ${iso === C.today ? 'is-today' : ''} ${list ? 'has' : ''}`;
                      const inner = <><small>{weekdayName(day).slice(0, 2)}</small><b>{i + 1}</b><span className="tp-gday__dots" aria-hidden="true">{list && typesOf(list).map(t => <i key={t} className={`dot dot--${t}`} />)}</span></>;
                      return (
                        <li key={iso}>
                          {list ? <a className={cls} href={`#d-${iso}`} aria-label={`${longDate(day)}: ${list.length} entries`}>{inner}</a> : <span className={cls} aria-hidden="true">{inner}</span>}
                        </li>
                      );
                    })}
                  </ol>
                  <ul className="tp-gauge__key">{C.types.map(t => <li key={t.key}><i className={`dot dot--${t.key}`} />{t.label}</li>)}</ul>
                </div>
                <Chips attr="type" label="Show" all="All" items={C.types.map(t => ({ v: t.key, label: <><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}</> }))} />
                {total ? (
                  <ol className="tp-wall">
                    {days.map(x => (
                      <li key={x.iso} id={`d-${x.iso}`} className={`tp-dcard ${x.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(x.list).join('|')} data-rv>
                        <h3 className="tp-dcard__head">
                          <b>{x.date.getDate()}</b>
                          <span><strong>{weekdayName(x.date)}</strong>{m.label}</span>
                          {x.iso === C.today && <em className="tag-today">{C.todayTag}</em>}
                        </h3>
                        <div className="tp-dcard__body">
                          {C.types.filter(t => x.list.some(e => e.type === t.key)).map(t => {
                            const list = x.list.filter(e => e.type === t.key);
                            const event = t.key === 'club' || t.key === 'district';
                            return (
                              <div key={t.key} className="tp-dgroup" data-type={t.key}>
                                <p className="dgroup__title"><i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{num(list.length)}</b></p>
                                <ul className={event ? 'tickets' : t.key === 'birthday' ? 'wishes' : 'vows'}>
                                  {list.map((e, k) => event ? (
                                    <li key={k} className={`ticket ticket--${e.type}`}>
                                      <span className="ticket__stub"><b>{e.time ?? '—'}</b><small>{t.label}</small></span>
                                      <span className="ticket__main">
                                        <b>{e.title}</b>
                                        {e.club && <span>{clubName(e.club)}</span>}
                                        {e.venue && <span>{e.venue}</span>}
                                      </span>
                                    </li>
                                  ) : (
                                    <li key={k} className={t.key === 'birthday' ? 'wish' : 'vow'} style={{ ['--i' as string]: Math.min(k, 10) }}>
                                      {t.key === 'birthday' ? <Balloon name={e.name ?? ''} /> : <Rings name={e.name ?? ''} />}
                                      <span className="wish__text"><b>{e.name}</b><span>{e.club ? clubName(e.club) : e.relation}</span></span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
                <p className="tp-empty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters: document spines, no images ================= */
function DocSpine({ n, top, title, date, pdf, q }: { n: number; top: string; title: string; date: string; pdf: string; q?: string }) {
  return (
    <li className="tp-doc" style={{ ['--c' as string]: ['#0a6d79', 'var(--cranberry)', 'var(--azure)', 'var(--deep)'][n % 4] }} {...(q ? { 'data-item': '', 'data-q': q } : {})} data-rv>
      <span className="tp-doc__spine" aria-hidden="true">{shortDate(date)}</span>
      <div className="tp-doc__body">
        <p className="tp-doc__top">{top}</p>
        <h3>{title}</h3>
        <p className="tp-doc__date">{shortDate(date)}</p>
        <div className="tp-doc__acts">
          <a className="tp-btn tp-btn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
          <a className="tp-btn" href={pdf} download>{R.press.actions.download}</a>
        </div>
      </div>
    </li>
  );
}
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="tp-sec">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="tp-ntabs" role="tablist" aria-label="Newsletters" data-rv>
                <button type="button" role="tab" className="tp-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                <button type="button" role="tab" className="tp-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                <p className="tp-ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="tp-bar" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="tp-docs">
                    {y.bulletins.map((b, i) => <DocSpine key={i} n={i} top={clubName(b.club)} title={b.title} date={b.date} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ul>
                ) : null}
                <p className="tp-empty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="tp-docs">
                    {y.gml.map((g, i) => <DocSpine key={i} n={i + 3} top={g.governor} title={g.month} date={g.date} pdf={g.pdf} />)}
                  </ul>
                ) : <p className="tp-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: one sheet, the form beside a deep-teal dock of perforated stubs ================= */
function Contact() {
  const c = P.contact;
  const ct = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <section className="tp-sec">
        <div className="wrap tp-contact" data-rv>
          <form className="tp-form" data-demo-form>
            <h2 className="tp-title">{c.title}</h2>
            <p className="tp-form__note">{c.hours}</p>
            <div className="tp-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="tp-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn-read">{F.send}{I.arrow}</button>
            <p className="tp-form__note">{c.formNote}</p>
            <p className="tp-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <aside className="tp-dock">
            <div className="tp-dock__part">
              <h3>{c.office}</h3>
              <p className="tp-dock__who">{R.dignitaries.byYear[R.years.current].dg.name}, {ct.label}</p>
              <a className="tp-dock__line" href={`mailto:${ct.email}`}>{I.mail}<span>{ct.email}</span></a>
              <a className="tp-dock__line" href={`tel:${ct.tel}`}>{I.phone}<span>{ct.phoneDisplay}</span></a>
            </div>
            <div className="tp-dock__part">
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="tp-btn tp-btn--gold" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="tp-dock__part">
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="tp-btn tp-btn--solid" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.arrow}</a>
            </div>
          </aside>
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
      <TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
