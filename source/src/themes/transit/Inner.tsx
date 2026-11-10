import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, longDate, shortDate, monthMatrix, toISO } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* TRANSIT inner pages: a normal vertical page. Each page opens on a big rounded colour card with a
   route line of all eight pages under it (the current page is the lit stop); the bodies are
   colour cards and white "platform" cards. Behaviour is data attributes (shared/inner.js). */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
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

/* one Rotary colour per page; the cards below cycle through the same set */
const PAGE_C: Record<PageKey, string> = {
  about: 'var(--azure)', committee: 'var(--cranberry)', finder: 'var(--teal)', projects: '#0a7d4f',
  service: 'var(--orange)', calendar: 'var(--violet)', newsletters: 'var(--royal)', contact: 'var(--cranberry)'
};
const CYCLE = ['var(--azure)', 'var(--cranberry)', 'var(--teal)', 'var(--violet)', 'var(--orange)', '#0a7d4f'];
const col = (i: number) => CYCLE[i % CYCLE.length];
const v = (o: Record<string, string | number>) => o as CSSProperties;
const delay = (i: number) => `${(i % 4) * 80}ms`;

/* ---------- page head: a colour card, then the route line of every page ---------- */
function PageHead({ k, side }: { k: PageKey; side?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className="tx-head" id="top" style={v({ '--c': PAGE_C[k] })}>
      <div className="wrap tx-head__grid">
        <div className="tx-head__card" data-rv>
          <nav className="tx-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.title}</span>
          </nav>
          <h1 className="tx-head__title">{p.title}</h1>
          <p className="tx-head__lead">{p.lead}</p>
        </div>
        {side && <div className="tx-head__side" data-rv style={v({ '--d': '120ms' })}>{side}</div>}
      </div>
      <nav className="wrap tx-route" aria-label="District pages" data-rv style={v({ '--d': '200ms' })}>
        <ol>
          {P.list.map(x => (
            <li key={x.key} className={x.key === k ? 'is-here' : ''}>
              <a href={x.file} aria-current={x.key === k ? 'page' : undefined}><i aria-hidden="true" />{x.title}</a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
const SideStat = ({ n, text }: { n: number; text: string }) => <div className="tx-sstat"><b>{num(n)}</b><span>{text}</span></div>;

const Search = ({ label }: { label: string }) => (
  <label className="tx-search">
    {I.search}
    <span className="tx-sr">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ total, noun }: { total: number; noun: string }) => <p className="tx-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>;
const Empty = ({ text }: { text: string }) => <p className="tx-empty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="tx-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
const Chip = ({ attr, val, on, children }: { attr: string; val: string; on?: boolean; children: ReactNode }) => (
  <button type="button" className="fchip" data-f-chip={attr} data-v={val} aria-pressed={on ? 'true' : 'false'}>{children}</button>
);

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
  const stops = ['first', 'second', 'third', 'fourth'];
  return (
    <>
      <PageHead k="about" />
      <section className="tx-sec">
        <div className="wrap tx-about">
          <figure className="tx-about__photo" data-rv>
            <img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" />
          </figure>
          <div className="tx-about__text tx-plate" data-rv style={v({ '--d': '100ms' })}>
            <p className="tx-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn-go" href={a.cta.href}>{a.cta.label}{I.arrow}</a>
          </div>
        </div>
        <ul className="wrap tx-tiles">
          {stats.map((x, i) => (
            <li key={x.label} className="tx-tile" style={v({ '--c': col(i), '--d': delay(i) })} data-rv><b>{x.value}</b><span>{x.label}</span></li>
          ))}
        </ul>
      </section>
      <section className="tx-sec">
        <div className="wrap">
          <div className="tx-fwt" data-rv>
            <div className="tx-fwt__head">
              <h2 className="tx-h2">{R.fourWayTest.title}</h2>
              <p>{R.fourWayTest.lead}</p>
            </div>
            <ol className="tx-fwt__line">
              {R.fourWayTest.questions.map((q, i) => (
                <li key={i} data-rv style={v({ '--d': `${i * 90}ms` })}>
                  <span className="tx-fwt__stop" aria-hidden="true">{stops[i]}</span>
                  <p><span dangerouslySetInnerHTML={{ __html: q.html }} /></p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <section className="tx-sec">
        <div className="wrap">
          <h2 className="tx-h2" data-rv>{a.focusTitle}</h2>
          <ul className="tx-focus">
            {a.focus.map((f, i) => (
              <li key={f.key} className="tx-focus__card" data-rv style={v({ '--c': col(i), '--d': delay(i) })}>
                <span className="tx-focus__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
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
      <PageHead k="committee" side={<SideStat n={all.length} text={`members in ${groups.length} committees`} />} />
      <section className="tx-sec" data-filter>
        <div className="wrap">
          <div className="tx-bar" data-rv>
            <Search label={P.committee.searchLabel} />
            <div className="tx-chips" role="group" aria-label="Committee">
              <Chip attr="group" val="" on>All</Chip>
              {groups.map(g => <Chip key={g.key} attr="group" val={g.key}>{g.title}</Chip>)}
            </div>
          </div>
          <Count total={all.length} noun="members" />
          <ul className="tx-people">
            {all.map((m, i) => (
              <li key={i} className={`tx-person ${m.gi === 0 ? 'tx-person--exec' : ''}`} style={v({ '--c': col(m.gi) })} data-item data-q={m.q} data-group={m.group} data-rv>
                <span className="tx-person__av" aria-hidden="true">{m.initials}</span>
                <div className="tx-person__text">
                  <h3>{m.name}</h3>
                  <p className="tx-person__role">{m.role}</p>
                  {m.club && <p className="tx-person__club">{clubName(m.club)}</p>}
                </div>
                <span className="tx-person__group">{m.groupTitle}</span>
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
      <PageHead k="finder" side={<SideStat n={list.length} text={`clubs in District ${R.site.district}`} />} />
      <section className="tx-sec" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="tx-bar" data-rv>
            <Search label={f.searchLabel} />
            <label className="tx-select">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="tx-clubs">
            {list.map((c, i) => (
              <li key={c.id} className="tx-club" style={v({ '--c': col(i) })} data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <div className="tx-club__top">
                  <span className="tx-club__mono" aria-hidden="true">{c.initials}</span>
                  {c.day && <span className="tx-club__day">{c.day.slice(0, 3)}</span>}
                </div>
                <h3>Rotary Club of {c.name}</h3>
                {c.day && <p className="tx-club__meta">Meets every {c.day}</p>}
                {c.place && <p className="tx-club__meta">{I.pin}<span>{c.place}</span></p>}
                <a className="tx-club__go" href={c.href} target="_blank" rel="noopener">{f.visit}{I.arrow}</a>
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
const AV_C: Record<string, string> = {};
P.projects.avenues.forEach((a, i) => { AV_C[a.key] = col(i); });

function ProjectCard({ p }: { p: Project }) {
  const L = P.projects.statLabels;
  return (
    <li className="tx-proj" style={v({ '--c': AV_C[p.avenue] ?? 'var(--azure)' })} data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="tx-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
        <span className="tx-proj__tag">{avenueLabel(p.avenue)}</span>
      </figure>
      <div className="tx-proj__body">
        <p className="tx-proj__date">{shortDate(p.date)} · {clubName(p.club)}</p>
        <h3>{p.title}</h3>
        <p className="tx-proj__sum">{p.summary}</p>
        <dl className="tx-proj__nums">
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
  const rows = [
    { label: x.statLabels.projects, value: num(t.projects) },
    { label: x.statLabels.beneficiaries, value: num(t.beneficiaries) },
    { label: x.statLabels.amount, value: `₹${R.fmt.num(t.amount, 1)} L` },
    { label: x.statLabels.hours, value: num(t.hours) }
  ];
  return (
    <>
      <PageHead k={service ? 'service' : 'projects'} />
      <section className="tx-sec tx-sec--tight">
        <ul className="wrap tx-bento">
          {rows.map((r, i) => (
            <li key={r.label} className="tx-tile" style={v({ '--c': col(i + (service ? 4 : 5)), '--d': delay(i) })} data-rv><b>{r.value}</b><span>{r.label}</span></li>
          ))}
        </ul>
      </section>
      <section className="tx-sec" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="tx-bar" data-rv>
            <Search label={x.searchLabel} />
            {!service && (
              <div className="tx-chips" role="group" aria-label="Avenue of service">
                <Chip attr="avenue" val="" on>{x.allLabel}</Chip>
                {x.avenues.map(a => <Chip key={a.key} attr="avenue" val={a.key}><i className="dot" style={{ background: AV_C[a.key] }} />{a.label}</Chip>)}
              </div>
            )}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="tx-projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
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
      <section className="tx-sec tx-sec--tight" data-tabs>
        <div className="wrap">
          <div className="tx-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`tx-mtab ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
                <b>{m.short}</b><small>{m.date.getFullYear()}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const by = new Map(days.map(d => [d.iso, d.list]));
            const total = days.reduce((s, d) => s + d.list.length, 0);
            return (
              <div key={m.key} className="tx-mpanel" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="tx-month" data-rv>
                  <h2 className="tx-month__title">{m.label}</h2>
                  <div className="tx-month__wd" aria-hidden="true">{C.weekdays.map(w => <span key={w}>{w}</span>)}</div>
                  <div className="tx-month__days">
                    {monthMatrix(m.date, C.weekStartsOn).map(d => {
                      const iso = toISO(d);
                      const list = by.get(iso);
                      const inMonth = d.getMonth() === m.date.getMonth();
                      const cls = `tx-day ${inMonth ? '' : 'is-out'} ${iso === C.today ? 'is-today' : ''} ${list ? 'has' : ''}`;
                      return list && inMonth ? (
                        <a key={iso} className={cls} href={`#d-${iso}`} aria-label={`${longDate(d)}: ${list.length} entries`}>
                          <b>{d.getDate()}</b>
                          <span aria-hidden="true">{typesOf(list).map(t => <i key={t} className={`dot dot--${t}`} />)}</span>
                        </a>
                      ) : (
                        <span key={iso} className={cls} aria-hidden={!inMonth}><b>{d.getDate()}</b></span>
                      );
                    })}
                  </div>
                  <ul className="tx-month__key">{C.types.map(t => <li key={t.key}><i className={`dot dot--${t.key}`} />{t.label}</li>)}</ul>
                </div>
                <div className="tx-agenda">
                  <div className="tx-chips" role="group" aria-label="Show" data-rv>
                    <Chip attr="type" val="" on>All</Chip>
                    {C.types.map(t => <Chip key={t.key} attr="type" val={t.key}><i className={`dot dot--${t.key}`} />{t.group}</Chip>)}
                  </div>
                  {total ? (
                    <ol className="tx-agenda__days">
                      {days.map(d => (
                        <li key={d.iso} id={`d-${d.iso}`} className={`tx-aday ${d.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(d.list).join('|')} data-rv>
                          <h3 className="tx-aday__date"><b>{d.date.getDate()}</b><span>{longDate(d.date).split(',')[0]}</span>{d.iso === C.today && <em>{C.todayTag}</em>}</h3>
                          <ul className="tx-aday__list">
                            {d.list.map((e, i) => {
                              const t = entryText(e);
                              return (
                                <li key={i} className={`tx-ent tx-ent--${e.type}`} data-type={e.type}>
                                  <small>{C.types.find(x => x.key === e.type)!.label}</small>
                                  <div><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</div>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <p className="tx-empty" data-f-empty hidden={total > 0}>{P.calendar.emptyMonth}</p>
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
const DocCard = ({ who, title, date, pdf }: { who: string; title: string; date: string; pdf: string }) => (
  <>
    <span className="tx-doc__icon" aria-hidden="true">{I.doc}</span>
    <p className="tx-doc__who">{who}</p>
    <h3>{title}</h3>
    <p className="tx-doc__date">{shortDate(date)}</p>
    <div className="tx-doc__acts">
      <a className="pbtn pbtn--solid" href={pdf} target="_blank" rel="noopener" aria-label={`${R.press.actions.preview}: ${title}`}>{R.press.actions.preview}</a>
      <a className="pbtn" href={pdf} download aria-label={`${R.press.actions.download}: ${title}`}>{R.press.actions.download}</a>
    </div>
  </>
);
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="tx-sec tx-sec--tight">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="tx-ntabs" role="tablist" aria-label="Newsletters" data-rv>
                <button type="button" role="tab" className="tx-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                <button type="button" role="tab" className="tx-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                <p className="tx-ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="tx-bar" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="tx-docs">
                    {y.bulletins.map((b, i) => (
                      <li key={i} className="tx-doc" style={v({ '--c': col(i) })} data-item data-q={`${b.title} ${b.club}`.toLowerCase()} data-rv>
                        <DocCard who={clubName(b.club)} title={b.title} date={b.date} pdf={b.pdf} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="tx-empty" data-f-empty hidden={y.bulletins.length > 0}>{R.fmt.fill(R.press.club.empty, { year: y.year })}</p>
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="tx-docs">
                    {y.gml.map((g, i) => (
                      <li key={i} className="tx-doc tx-doc--gml" data-rv>
                        <DocCard who={g.governor} title={g.month} date={g.date} pdf={g.pdf} />
                      </li>
                    ))}
                  </ul>
                ) : <p className="tx-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
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
      <section className="tx-sec tx-sec--tight">
        <div className="wrap tx-contact">
          <form className="tx-form tx-plate" data-demo-form data-rv>
            <h2 className="tx-h2">{c.title}</h2>
            <p className="tx-form__note">{c.hours}</p>
            <div className="tx-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="tx-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn-go btn-go--solid">{F.send}</button>
            <p className="tx-form__note">{c.formNote}</p>
            <p className="tx-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <div className="tx-cside">
            <div className="tx-ccard" data-rv style={v({ '--c': 'var(--azure)' })}>
              <h3>{c.office}</h3>
              <p>{R.dignitaries.byYear[R.years.current].dg.name}, {d.label}</p>
              <a className="tx-ccard__line" href={`mailto:${d.email}`}>{I.mail}<span>{d.email}</span></a>
              <a className="tx-ccard__line" href={`tel:${d.tel}`}>{I.phone}<span>{d.phoneDisplay}</span></a>
            </div>
            <div className="tx-ccard" data-rv style={v({ '--c': 'var(--cranberry)', '--d': '90ms' })}>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="pbtn pbtn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="tx-ccard" data-rv style={v({ '--c': 'var(--teal)', '--d': '180ms' })}>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="pbtn pbtn--solid" href={pageInfo('finder').file}>{pageInfo('finder').title}</a>
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
  return <main id="main" ref={ref} className={`tx-main tx-main--${page}`}>{BODY[page]({ year })}</main>;
}

export default function Inner({ page }: { page: PageKey }) {
  const [year, setYear] = useState(R.years.current);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { saveTheme(theme); }, [theme]);
  /* inner pages scroll vertically at every width (the homepage runs sideways on desktop) */
  useEffect(() => { startSmoothScroll({ anchors: { offset: -80 }, allowNestedScroll: true }); }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  return (
    <ThemeCtx.Provider value={theme}>
      <TopStrip year={year} onYear={setYear} theme={theme} onTheme={toggleTheme} />
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
