import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { R, longDate, shortDate } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, type PageKey, type Project
} from '../../shared/inner';
import { monthMatrix, toISO } from '../../shared/rotary';
import { Header, UtilityBar } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';

/* ETHER inner pages: a short liquid-light page head, then glass panels. Every interactive part is
   plain markup with data attributes, so the same page also works as static HTML (shared/inner.js). */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  doc: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M7 3h7l5 5v13H7z" /><path {...sw} d="M14 3v5h5M10 13h6M10 17h6" /></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8" r="3.5" /><path {...sw} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>
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

/* ---------- page head: liquid light behind the title, breadcrumb below it ---------- */
function PageHead({ k, children }: { k: PageKey; children?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="phead" id="top">
      <div className="phead__fluid" aria-hidden="true"><i /><i /><i /></div>
      <div className="wrap phead__row">
        <div className="phead__text" data-rv>
          <h1 className="phead__title">{p.title}</h1>
          <p className="phead__lead">{p.lead}</p>
          <nav className="crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.title}</span>
          </nav>
        </div>
        {children && <div className="phead__side" data-rv style={{ ['--d' as string]: '120ms' }}>{children}</div>}
      </div>
    </section>
  );
}

const Search = ({ label }: { label: string }) => (
  <label className="gsearch">
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="gcount" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>
);
const Empty = ({ text }: { text: string }) => <p className="gempty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="gmore"><button type="button" className="pill-btn" data-f-more hidden>{label}</button></div>;

/* ================= About ================= */
function About() {
  const a = P.about;
  const s = R.snapshot.byYear[R.years.current];
  const stats = [
    { label: 'Clubs', value: num(s.clubs), accent: '#2EA8FF' },
    { label: 'Members', value: num(s.members), accent: '#2BD9C5' },
    { label: 'Projects this year', value: num(s.projects), accent: '#F7A81B' },
    { label: 'Beneficiaries', value: num(s.beneficiaries), accent: '#FF5C93' }
  ];
  return (
    <>
      <PageHead k="about" />
      <section className="psec">
        <div className="wrap about">
          <figure className="about__photo glass" data-rv>
            <img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" />
          </figure>
          <div className="about__text" data-rv style={{ ['--d' as string]: '100ms' }}>
            <p className="about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="pill-btn pill-btn--solid" href={a.cta.href}>{a.cta.label}</a>
          </div>
        </div>
        <div className="wrap">
          <ul className="astats">
            {stats.map((x, i) => (
              <li key={x.label} className="glass astat" style={{ ['--accent' as string]: x.accent, ['--d' as string]: `${i * 80}ms` }} data-rv>
                <b>{x.value}</b><span>{x.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="psec">
        <div className="wrap fwt glass" data-rv>
          <div className="fwt__head">
            <h2 className="psec__title">{R.fourWayTest.title}</h2>
            <p>{R.fourWayTest.lead}</p>
          </div>
          <ol className="fwt__list">
            {R.fourWayTest.questions.map((q, i) => (
              <li key={i} data-rv style={{ ['--d' as string]: `${i * 90}ms` }}><span aria-hidden="true">{i + 1}</span><p dangerouslySetInnerHTML={{ __html: q.html }} /></li>
            ))}
          </ol>
        </div>
      </section>
      <section className="psec">
        <div className="wrap">
          <h2 className="psec__title" data-rv>{a.focusTitle}</h2>
          <ul className="focus">
            {a.focus.map((f, i) => (
              <li key={f.key} className="glass focus__card" data-rv style={{ ['--d' as string]: `${(i % 4) * 70}ms` }}>
                <span className="focus__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
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
  const all = groups.flatMap(g => g.members.map(m => ({ ...m, group: g.key, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee">
        <div className="hstat glass"><b>{num(all.length)}</b><span>members in {groups.length} committees</span></div>
      </PageHead>
      <section className="psec" data-filter>
        <div className="wrap">
          <div className="gbar glass" data-rv>
            <Search label={P.committee.searchLabel} />
            <div className="gchips" role="group" aria-label="Committee">
              <button type="button" className="gchip" data-f-chip="group" data-v="" aria-pressed="true">All</button>
              {groups.map(g => <button key={g.key} type="button" className="gchip" data-f-chip="group" data-v={g.key} aria-pressed="false">{g.title}</button>)}
            </div>
          </div>
          <Count total={all.length} noun="members" />
          <ul className="people">
            {all.map((m, i) => (
              <li key={i} className={`person glass ${m.group === 'g0' ? 'person--exec' : ''}`} data-item data-q={m.q} data-group={m.group} data-rv>
                <span className="person__av" aria-hidden="true">{m.initials}</span>
                <div className="person__text">
                  <h3>{m.name}</h3>
                  <p className="person__role">{m.role}</p>
                  {m.club && <p className="person__club">{clubName(m.club)}</p>}
                </div>
                <span className="person__group">{m.groupTitle}</span>
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
      <PageHead k="finder">
        <div className="hstat glass"><b>{num(list.length)}</b><span>clubs in District {R.site.district}</span></div>
      </PageHead>
      <section className="psec" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="gbar glass" data-rv>
            <Search label={f.searchLabel} />
            <label className="gselect">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="clubs">
            {list.map(c => (
              <li key={c.id} className="club glass" data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <div className="club__top">
                  <span className="club__mono" aria-hidden="true">{c.initials}</span>
                  <h3>Rotary Club of {c.name}</h3>
                </div>
                {c.day && <p className="club__meta">{I.clock}Meets every {c.day}</p>}
                {c.place && <p className="club__meta">{I.pin}<span>{c.place}</span></p>}
                <a className="link-arrow club__go" href={c.href} target="_blank" rel="noopener">{f.visit}{I.arrow}</a>
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
    <li className="proj glass" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
        <span className={`proj__tag proj__tag--${p.avenue}`}>{avenueLabel(p.avenue)}</span>
      </figure>
      <div className="proj__body">
        <p className="proj__date">{shortDate(p.date)} · {clubName(p.club)}</p>
        <h3>{p.title}</h3>
        <p className="proj__sum">{p.summary}</p>
        <dl className="proj__nums">
          <div><dt>{P.projects.statLabels.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
          <div><dt>{P.projects.statLabels.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
          <div><dt>{P.projects.statLabels.hours}</dt><dd>{num(p.hours)}</dd></div>
        </dl>
      </div>
    </li>
  );
}
function ProjectTotals({ list }: { list: Project[] }) {
  const t = totals(list);
  const L = P.projects.statLabels;
  const rows = [
    { label: L.projects, value: num(t.projects), accent: '#F7A81B' },
    { label: L.beneficiaries, value: num(t.beneficiaries), accent: '#FF5C93' },
    { label: L.amount, value: `₹${R.fmt.num(t.amount, 1)} L`, accent: '#2BD9C5' },
    { label: L.hours, value: num(t.hours), accent: '#2EA8FF' }
  ];
  return (
    <ul className="astats astats--tight">
      {rows.map((x, i) => (
        <li key={x.label} className="glass astat" style={{ ['--accent' as string]: x.accent, ['--d' as string]: `${i * 80}ms` }} data-rv><b>{x.value}</b><span>{x.label}</span></li>
      ))}
    </ul>
  );
}
function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const list = projectsOf(service ? 'club' : undefined);
  return (
    <>
      <PageHead k={service ? 'service' : 'projects'} />
      <section className="psec psec--first">
        <div className="wrap"><ProjectTotals list={list} /></div>
      </section>
      <section className="psec" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="gbar glass" data-rv>
            <Search label={x.searchLabel} />
            {!service && (
              <div className="gchips" role="group" aria-label="Avenue of service">
                <button type="button" className="gchip" data-f-chip="avenue" data-v="" aria-pressed="true">{x.allLabel}</button>
                {x.avenues.map(a => <button key={a.key} type="button" className="gchip" data-f-chip="avenue" data-v={a.key} aria-pressed="false">{a.label}</button>)}
              </div>
            )}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <>
      <PageHead k="calendar" />
      <section className="psec psec--first" data-tabs>
        <div className="wrap">
          <div className="mtabs glass" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`mtab ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
                <span>{m.short}</span><small>{m.date.getFullYear()}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const by = new Map(days.map(d => [d.iso, d.list]));
            const total = days.reduce((s, d) => s + d.list.length, 0);
            return (
              <div key={m.key} className="mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="mpanel__grid">
                  <div className="mgrid glass" data-rv>
                    <h2 className="mgrid__title">{m.label}</h2>
                    <div className="mgrid__wd" aria-hidden="true">{C.weekdays.map(w => <span key={w}>{w}</span>)}</div>
                    <div className="mgrid__days">
                      {monthMatrix(m.date, C.weekStartsOn).map(d => {
                        const iso = toISO(d);
                        const list = by.get(iso);
                        const inMonth = d.getMonth() === m.date.getMonth();
                        const cls = `mday ${inMonth ? '' : 'is-out'} ${iso === C.today ? 'is-today' : ''} ${list ? 'has' : ''}`;
                        return list && inMonth ? (
                          <a key={iso} className={cls} href={`#d-${iso}`} aria-label={`${longDate(d)}: ${list.length} entries`}>
                            <b>{d.getDate()}</b>
                            <span className="mday__dots" aria-hidden="true">{typesOf(list).map(t => <i key={t} className={`mark mark--${t}`} />)}</span>
                          </a>
                        ) : (
                          <span key={iso} className={cls} aria-hidden={!inMonth}><b>{d.getDate()}</b></span>
                        );
                      })}
                    </div>
                    <ul className="mgrid__key">{C.types.map(t => <li key={t.key}><i className={`mark mark--${t.key}`} />{t.label}</li>)}</ul>
                  </div>
                  <div className="agenda">
                    <div className="gchips" role="group" aria-label="Show">
                      <button type="button" className="gchip" data-f-chip="type" data-v="" aria-pressed="true">All</button>
                      {C.types.map(t => <button key={t.key} type="button" className="gchip" data-f-chip="type" data-v={t.key} aria-pressed="false"><i className={`mark mark--${t.key}`} />{t.group}</button>)}
                    </div>
                    {total ? (
                      <ol className="agenda__days" data-lenis-prevent>
                        {days.map(d => (
                          <li key={d.iso} id={`d-${d.iso}`} className={`aday ${d.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(d.list).join('|')}>
                            <h3 className="aday__date"><b>{d.date.getDate()}</b><span>{longDate(d.date).split(',')[0]}{d.iso === C.today && <em>{C.todayTag}</em>}</span></h3>
                            <ul className="aday__list">
                              {d.list.map((e, i) => {
                                const t = entryText(e);
                                return (
                                  <li key={i} className={`aent aent--${e.type}`} data-type={e.type}>
                                    <i className={`mark mark--${e.type}`} aria-hidden="true" />
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
                    <p className="gempty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters ================= */
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="psec psec--first">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="ntabs" role="tablist" aria-label="Newsletters" data-rv>
                <button type="button" role="tab" className="ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                <button type="button" role="tab" className="ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                <p className="ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="gbar glass" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="docs">
                    {y.bulletins.map((b, i) => (
                      <li key={i} className="doc glass" data-item data-q={`${b.title} ${b.club}`.toLowerCase()} data-rv>
                        <span className="doc__icon" aria-hidden="true">{I.doc}</span>
                        <p className="doc__club">{clubName(b.club)}</p>
                        <h3>{b.title}</h3>
                        <p className="doc__date">{shortDate(b.date)}</p>
                        <div className="doc__acts">
                          <a className="pill-btn pill-btn--solid" href={b.pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
                          <a className="pill-btn" href={b.pdf} download>{R.press.actions.download}</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="gempty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="docs docs--gml">
                    {y.gml.map((g, i) => (
                      <li key={i} className="doc doc--gml glass" data-rv>
                        <span className="doc__icon" aria-hidden="true">{I.doc}</span>
                        <p className="doc__club">{g.governor}</p>
                        <h3>{g.month}</h3>
                        <p className="doc__date">{shortDate(g.date)}</p>
                        <div className="doc__acts">
                          <a className="pill-btn pill-btn--solid" href={g.pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
                          <a className="pill-btn" href={g.pdf} download>{R.press.actions.download}</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="gempty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
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
  const d = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <section className="psec psec--first">
        <div className="wrap contact">
          <form className="cform glass" data-demo-form data-rv>
            <h2 className="psec__title">{c.title}</h2>
            <p className="cform__note">{c.hours}</p>
            <div className="cform__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="cform__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="pill-btn pill-btn--solid">{F.send}</button>
            <p className="cform__note">{c.formNote}</p>
            <p className="cform__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <div className="cside">
            <div className="ccard glass" data-rv style={{ ['--accent' as string]: '#F7A81B' }}>
              <h3>{c.office}</h3>
              <p className="ccard__who">{R.dignitaries.byYear[R.years.current].dg.name}, {d.label}</p>
              <a className="ccard__line" href={`mailto:${d.email}`}>{I.mail}<span>{d.email}</span></a>
              <a className="ccard__line" href={`tel:${d.tel}`}>{I.phone}<span>{d.phoneDisplay}</span></a>
            </div>
            <div className="ccard glass" data-rv style={{ ['--accent' as string]: '#2BD9C5', ['--d' as string]: '90ms' }}>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="pill-btn pill-btn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="ccard glass" data-rv style={{ ['--accent' as string]: '#2EA8FF', ['--d' as string]: '180ms' }}>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="link-arrow" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.arrow}</a>
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
  return <main id="main" ref={ref} className={`inner inner--${page}`}>{BODY[page]({ year })}</main>;
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
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}

