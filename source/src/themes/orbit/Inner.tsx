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
import { useReveal } from './reveal';
import './inner.css';

/* ORBIT inner pages: an indigo page head with orbit rings and a gold-ringed number disc, then
   bodies built from the homepage's parts: round portraits, gold pills, rows that fill with gold,
   and the month as a dial. Behaviour is plain data attributes (shared/inner.js), so the same
   markup also works as static HTML. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  mail: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  doc: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M7 3h7l5 5v13H7z" /><path {...sw} d="M14 3v5h5M10 13h6M10 17h6" /></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8" r="3.5" /><path {...sw} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>,
  compass: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
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

/* ---------- page head: indigo band, orbit rings, title left, a gold-ringed number disc right ---------- */
const RINGS = [{ s: 30, a: 30, c: '#F7A81B' }, { s: 48, a: 210, c: '#FF7DB2' }, { s: 68, a: 300, c: '#7CC4FF' }];
function PageHead({ k, orb }: { k: PageKey; orb?: { value: string; label: string } }) {
  const p = pageInfo(k);
  return (
    <section className="oi-head" id="top">
      <div className="oi-head__rings" aria-hidden="true">
        {RINGS.map((r, i) => <span key={i} style={{ ['--s' as string]: `${r.s}vmax`, ['--a' as string]: `${r.a}deg`, animationDuration: `${50 + i * 22}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}><i style={{ background: r.c, boxShadow: `0 0 12px 2px ${r.c}` }} /></span>)}
      </div>
      <div className="wrap oi-head__row">
        <div className="oi-head__text" data-rv>
          <nav className="oi-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.title}</span>
          </nav>
          <h1 className="oi-head__title">{p.title}</h1>
          <p className="oi-head__lead">{p.lead}</p>
        </div>
        {orb && (
          <div className="oi-orb" data-rv style={d(140)}>
            <span className="oi-orb__ring" aria-hidden="true"><i /></span>
            <b>{orb.value}</b><span>{orb.label}</span>
          </div>
        )}
      </div>
    </section>
  );
}

const Search = ({ label }: { label: string }) => (
  <label className="oi-search">
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
  </label>
);
const Count = ({ total, noun }: { total: number; noun: string }) => (
  <p className="oi-count" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</p>
);
const Chip = ({ attr, v, on, children }: { attr: string; v: string; on?: boolean; children: ReactNode }) => (
  <button type="button" className="oi-chip" data-f-chip={attr} data-v={v} aria-pressed={on ? 'true' : 'false'}>{children}</button>
);
const Empty = ({ text, show = false }: { text: string; show?: boolean }) => <p className="oi-empty" data-f-empty hidden={!show}>{text}</p>;
const More = ({ label }: { label: string }) => <div className="oi-more"><button type="button" className="btn btn--solid" data-f-more hidden>{label}</button></div>;

/* ================= About ================= */
function About() {
  const a = P.about;
  const s = R.snapshot.byYear[R.years.current];
  const stats = [
    { label: 'Clubs', value: num(s.clubs), c: 'var(--azure)' },
    { label: 'Members', value: num(s.members), c: 'var(--turq)' },
    { label: 'Projects this year', value: num(s.projects), c: 'var(--gold)' },
    { label: 'Beneficiaries', value: num(s.beneficiaries), c: 'var(--cranberry)' }
  ];
  const line = `ROTARY DISTRICT ${R.site.district} · SERVICE ABOVE SELF · `;
  return (
    <>
      <PageHead k="about" orb={{ value: num(s.clubs), label: 'clubs, one district' }} />
      <section className="oi-sec oi-sec--clip">
        <div className="wrap oi-about">
          <figure className="oi-about__art" data-rv>
            <svg className="oi-about__ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs><path id="oi-ring" d="M100 8a92 92 0 1 1 -0.01 0" /></defs>
              <text><textPath href="#oi-ring" textLength={Math.floor(2 * Math.PI * 92) - 2} lengthAdjust="spacing">{line}{line}</textPath></text>
            </svg>
            <img src={a.image.src} alt={a.image.alt} width={a.image.w} height={a.image.h} loading="lazy" />
          </figure>
          <div className="oi-about__text" data-rv style={d(100)}>
            <p className="oi-about__intro">{a.intro}</p>
            {a.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <a className="btn btn--solid oi-btn-lg" href={a.cta.href}>{a.cta.label}{I.arrow}</a>
          </div>
        </div>
        <div className="wrap">
          <ul className="oi-planets">
            {stats.map((x, i) => (
              <li key={x.label} className="oi-planet" style={{ ['--c' as string]: x.c, ...d(i * 90) }} data-rv>
                <span className="oi-planet__disc"><b>{x.value}</b></span>
                <span className="oi-planet__label">{x.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="oi-band">
        <div className="wrap">
          <div className="oi-band__head" data-rv>
            <h2 className="oi-title">{R.fourWayTest.title}</h2>
            <p>{R.fourWayTest.lead}</p>
          </div>
          <ol className="oi-fwt">
            {R.fourWayTest.questions.map((q, i) => (
              <li key={i} data-rv style={d(i * 110)}>
                <span className="oi-fwt__n" aria-hidden="true">{i + 1}</span>
                <p dangerouslySetInnerHTML={{ __html: q.html }} />
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="oi-sec">
        <div className="wrap">
          <h2 className="oi-title oi-title--center" data-rv>{a.focusTitle}</h2>
          <ul className="oi-focus">
            {a.focus.map((f, i) => (
              <li key={f.key} className="oi-focus__card" data-rv style={d((i % 4) * 80)}>
                <span className="oi-focus__icon" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24">{FOCUS[f.key]}</svg></span>
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

/* ================= District Committee: pill cards with ringed initials ================= */
function Committee() {
  const groups = committee();
  const all = groups.flatMap(g => g.members.map(m => ({ ...m, group: g.key, groupTitle: g.title })));
  return (
    <>
      <PageHead k="committee" orb={{ value: num(all.length), label: `members in ${groups.length} committees` }} />
      <section className="oi-sec" data-filter>
        <div className="wrap">
          <div className="oi-tools" data-rv>
            <Search label={P.committee.searchLabel} />
            <div className="oi-chips" role="group" aria-label="Committee">
              <Chip attr="group" v="" on>All</Chip>
              {groups.map(g => <Chip key={g.key} attr="group" v={g.key}>{g.title}</Chip>)}
            </div>
          </div>
          <Count total={all.length} noun="members" />
          <ul className="oi-mems">
            {all.map((m, i) => (
              <li key={i} className={`oi-mem ${m.group === 'g0' ? 'oi-mem--exec' : ''}`} data-item data-q={m.q} data-group={m.group} data-rv>
                <span className="oi-mem__av" aria-hidden="true">{m.initials}</span>
                <div className="oi-mem__text">
                  <h3>{m.name}</h3>
                  <p className="oi-mem__role">{m.role}</p>
                  <p className="oi-mem__meta">{[m.club && clubName(m.club), m.groupTitle].filter(Boolean).join(' · ')}</p>
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

/* ================= Club Finder: rows that fill with gold, like the homepage newsletters ================= */
function Finder() {
  const f = P.finder;
  const list = clubs();
  return (
    <>
      <PageHead k="finder" orb={{ value: num(list.length), label: `clubs in District ${R.site.district}` }} />
      <section className="oi-sec" data-filter data-page-size={f.pageSize}>
        <div className="wrap">
          <div className="oi-tools" data-rv>
            <Search label={f.searchLabel} />
            <label className="oi-select">
              <span>{f.dayLabel}</span>
              <select data-f="day" defaultValue="">
                <option value="">{f.anyDay}</option>
                {f.days.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <Count total={list.length} noun="clubs" />
          <ul className="oi-rows">
            {list.map(c => (
              <li key={c.id} className="oi-rowx oi-club" data-item data-q={c.q} data-day={c.day ?? ''} data-rv>
                <span className="oi-club__mono" aria-hidden="true">{c.initials}</span>
                <div className="oi-club__text">
                  <h3>Rotary Club of {c.name}</h3>
                  {c.place && <p>{I.pin}<span>{c.place}</span></p>}
                </div>
                {c.day ? <span className="oi-club__day">{c.day}</span> : <span />}
                <a className="pbtn oi-club__go" href={c.href} target="_blank" rel="noopener">{f.visit}{I.arrow}</a>
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
  const L = P.projects.statLabels;
  return (
    <li className="oi-proj" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="oi-proj__photo">
        <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
      </figure>
      <span className={`oi-proj__tag oi-proj__tag--${p.avenue}`}>{avenueLabel(p.avenue)}</span>
      <div className="oi-proj__body">
        <p className="oi-proj__meta">{shortDate(p.date)} · {clubName(p.club)}</p>
        <h3>{p.title}</h3>
        <p className="oi-proj__sum">{p.summary}</p>
        <dl className="oi-proj__nums">
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
  const rows = [
    { label: L.projects, value: num(t.projects), c: 'var(--gold)' },
    { label: L.beneficiaries, value: num(t.beneficiaries), c: 'var(--cranberry)' },
    { label: L.amount, value: `₹${R.fmt.num(t.amount, 1)} L`, c: 'var(--turq)' },
    { label: L.hours, value: num(t.hours), c: 'var(--sky)' }
  ];
  return (
    <>
      <PageHead k={service ? 'service' : 'projects'} />
      <section className="oi-totals">
        <ul className="wrap oi-totals__row">
          {rows.map((r, i) => (
            <li key={r.label} style={{ ['--c' as string]: r.c, ...d(i * 90) }} data-rv><i aria-hidden="true" /><b>{r.value}</b><span>{r.label}</span></li>
          ))}
        </ul>
      </section>
      <section className="oi-sec" data-filter data-page-size={x.pageSize}>
        <div className="wrap">
          <div className="oi-tools" data-rv>
            <Search label={x.searchLabel} />
            {!service && (
              <div className="oi-chips" role="group" aria-label="Avenue of service">
                <Chip attr="avenue" v="" on>{x.allLabel}</Chip>
                {x.avenues.map(a => <Chip key={a.key} attr="avenue" v={a.key}>{a.label}</Chip>)}
              </div>
            )}
          </div>
          <Count total={list.length} noun="projects" />
          <ul className="oi-projs">{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </>
  );
}

/* ================= District Calendar: months as beads, each month as a dial, an agenda beside ================= */
function CalendarPage() {
  const C = R.calendar;
  const months = calMonths();
  const open = todayMonthKey();
  const typeLabel = (k: string) => C.types.find(t => t.key === k)!;
  return (
    <>
      <PageHead k="calendar" />
      <section className="oi-sec oi-sec--cal" data-tabs>
        <div className="wrap">
          <div className="oi-beads" role="tablist" aria-label={P.calendar.monthLabel} data-rv data-lenis-prevent>
            {months.map(m => (
              <button key={m.key} type="button" role="tab" className={`oi-bead ${m.key === open ? 'is-on' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1} aria-label={m.label}>
                <span>{m.short}</span><small>{String(m.date.getFullYear()).slice(2)}</small>
              </button>
            ))}
          </div>
          {months.map(m => {
            const days = monthEntries(m.date);
            const by = new Map(days.map(x => [x.iso, x.list]));
            const total = days.reduce((s, x) => s + x.list.length, 0);
            const n = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0).getDate();
            const y = m.date.getFullYear();
            const mo = String(m.date.getMonth() + 1).padStart(2, '0');
            return (
              <div key={m.key} className="oi-month" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={m.key !== open} data-filter>
                <div className="oi-month__dial" data-rv>
                  <div className="oi-dial">
                    {Array.from({ length: n }, (_, i) => {
                      const day = i + 1;
                      const iso = `${y}-${mo}-${String(day).padStart(2, '0')}`;
                      const list = by.get(iso);
                      const ang = (i / n) * 2 * Math.PI;
                      const pos = { left: `${50 + 41 * Math.sin(ang)}%`, top: `${50 - 41 * Math.cos(ang)}%` };
                      const cls = `oi-dday ${iso === C.today ? 'is-today' : ''} ${list ? 'has' : ''}`;
                      return list ? (
                        <a key={iso} className={cls} style={pos} href={`#d-${iso}`} aria-label={`${longDate(new Date(y, m.date.getMonth(), day))}: ${list.length} entries`}>
                          {day}
                          <span className="oi-dday__dots" aria-hidden="true">{typesOf(list).map(t => <i key={t} className={`dot dot--${t}`} />)}</span>
                        </a>
                      ) : <span key={iso} className={cls} style={pos} aria-hidden="true">{day}</span>;
                    })}
                    <div className="oi-dial__hub">
                      <h2>{m.label}</h2>
                      <b>{num(total)}</b>
                      <span>entries</span>
                    </div>
                  </div>
                  <ul className="oi-key">{C.types.map(t => <li key={t.key}><i className={`dot dot--${t.key}`} />{t.label}</li>)}</ul>
                </div>
                <div className="oi-agenda">
                  <div className="oi-chips" role="group" aria-label="Show">
                    <Chip attr="type" v="" on>All</Chip>
                    {C.types.map(t => <Chip key={t.key} attr="type" v={t.key}><i className={`dot dot--${t.key}`} />{t.group}</Chip>)}
                  </div>
                  {total ? (
                    <ol className="oi-agenda__days" data-lenis-prevent>
                      {days.map(x => (
                        <li key={x.iso} id={`d-${x.iso}`} className={`oi-aday ${x.iso === C.today ? 'is-today' : ''}`} data-item data-type={typesOf(x.list).join('|')}>
                          <h3 className="oi-aday__date">
                            <b>{x.date.getDate()}</b>
                            <span>{longDate(x.date).split(',')[0]}</span>
                            {x.iso === C.today && <em className="tag-today">{C.todayTag}</em>}
                          </h3>
                          <ul className="oi-aday__list">
                            {x.list.map((e, i) => {
                              const t = entryText(e);
                              return (
                                <li key={i} className={`oi-ent oi-ent--${e.type}`} data-type={e.type}>
                                  <div><b>{t.head}</b>{t.sub && <span>{t.sub}</span>}</div>
                                  <small>{typeLabel(e.type).label}</small>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <Empty text={P.calendar.emptyMonth} show={!total} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ================= Newsletters: document rows that fill with gold ================= */
function DocRow({ day, sub, top, title, pdf, q }: { day: string; sub: string; top: string; title: string; pdf: string; q?: string }) {
  return (
    <li className="oi-rowx oi-doc" data-rv {...(q ? { 'data-item': '', 'data-q': q } : {})}>
      <p className="oi-doc__date"><b>{day}</b><span>{sub}</span></p>
      <div className="oi-doc__text">
        <p className="oi-doc__top">{I.doc}<span>{top}</span></p>
        <h3>{title}</h3>
      </div>
      <div className="oi-doc__acts">
        <a className="pbtn pbtn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}</a>
        <a className="pbtn" href={pdf} download>{R.press.actions.download}</a>
      </div>
    </li>
  );
}
const dateParts = (iso: string) => { const s = shortDate(iso).split(' '); return { day: s[0], sub: `${s[1]} ${s[2]}` }; };
function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  return (
    <>
      <PageHead k="newsletters" />
      <section className="oi-sec">
        <div className="wrap">
          {pressYears().map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year} data-tabs data-tabs-hash>
              <div className="oi-ntabs" data-rv>
                <div className="oi-ntabs__track" role="tablist" aria-label="Newsletters">
                  <button type="button" role="tab" className="oi-ntab is-on" data-tab="club" aria-selected="true">{N.club}<b>{num(y.bulletins.length)}</b></button>
                  <button type="button" role="tab" className="oi-ntab" data-tab="governor" aria-selected="false" tabIndex={-1}>{N.governor}<b>{num(y.gml.length)}</b></button>
                </div>
                <p className="oi-ntabs__year">{N.yearLabel} <b>{y.year}</b></p>
              </div>
              <div data-panel="club" role="tabpanel" data-filter>
                <div className="oi-tools" data-rv><Search label={N.searchLabel} /><Count total={y.bulletins.length} noun="bulletins" /></div>
                {y.bulletins.length ? (
                  <ul className="oi-rows">
                    {y.bulletins.map((b, i) => <DocRow key={i} {...dateParts(b.date)} top={clubName(b.club)} title={b.title} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ul>
                ) : null}
                <Empty text={R.fmt.fill(R.press.club.empty, { year: y.year })} show={!y.bulletins.length} />
              </div>
              <div data-panel="governor" role="tabpanel" hidden>
                {y.gml.length ? (
                  <ul className="oi-rows">
                    {y.gml.map((g, i) => <DocRow key={i} {...dateParts(g.date)} top={g.governor} title={g.month} pdf={g.pdf} />)}
                  </ul>
                ) : <p className="oi-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================= Contact: indigo office disc card, form, two round-badge cards ================= */
function Contact() {
  const c = P.contact;
  const ct = R.contact;
  const F = c.fields;
  return (
    <>
      <PageHead k="contact" />
      <section className="oi-sec">
        <div className="wrap oi-contact">
          <div className="oi-office" data-rv>
            <span className="oi-office__ring" aria-hidden="true"><i /></span>
            <h2 className="oi-office__title">{c.office}</h2>
            <p className="oi-office__who">{R.dignitaries.byYear[R.years.current].dg.name}, {ct.label}</p>
            <a className="oi-office__line" href={`mailto:${ct.email}`}><span>{I.mail}</span>{ct.email}</a>
            <a className="oi-office__line" href={`tel:${ct.tel}`}><span>{I.phone}</span>{ct.phoneDisplay}</a>
            <p className="oi-office__note">{c.hours}</p>
          </div>
          <form className="oi-form" data-demo-form data-rv style={d(100)}>
            <h2 className="oi-title">{c.title}</h2>
            <div className="oi-form__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="oi-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <button type="submit" className="btn btn--solid oi-btn-lg">{F.send}</button>
            <p className="oi-form__note">{c.formNote}</p>
            <p className="oi-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
          </form>
          <div className="oi-badges">
            <div className="oi-badge" data-rv style={{ ['--c' as string]: 'var(--cranberry)', ...d(0) }}>
              <span className="oi-badge__icon" aria-hidden="true">{I.users}</span>
              <h3>{c.join.title}</h3>
              <p>{c.join.text}</p>
              <a className="btn btn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
            </div>
            <div className="oi-badge" data-rv style={{ ['--c' as string]: 'var(--azure)', ...d(100) }}>
              <span className="oi-badge__icon" aria-hidden="true">{I.compass}</span>
              <h3>{c.finder.title}</h3>
              <p>{c.finder.text}</p>
              <a className="pbtn" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.arrow}</a>
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
  return <main id="main" ref={ref} className={`oi oi--${page}`}>{BODY[page]({ year })}</main>;
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
      <Header />
      <Body page={page} year={year} />
      <Footer />
    </ThemeCtx.Provider>
  );
}
