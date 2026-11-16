import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, parseISO, shortDate } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, AdminContent, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, entryText, pressYears, toISO, type PageKey, type Project
} from '../../shared/inner';
import { Header, UtilityBar } from './Chrome';
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
  doc: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M7 3h7l5 5v13H7z" /><path {...sw} d="M14 3v5h5M10 13h6M10 17h6" /></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="9" /><path {...sw} d="m8 12.5 2.6 2.6L16 9.6" /></svg>
};
/* the District Snapshot's own icons (Sections.tsx) */
const SNAP = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.5 2 2 4-4" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.7 0 2.5 1.2 2.5 1.5S14.7 11 13 11h-1l4 5" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>
};
/* the homepage's four accent hues, in the order it uses them (theme-aware tokens, see inner.css) */
const HUE = ['var(--c-club)', 'var(--c-district)', 'var(--c-birthday)', 'var(--c-anniversary)'];

/* ---------- page head: a band of liquid light under the header, title left, the page's key control right ---------- */
const Fluid = () => <div className="phead__fluid" aria-hidden="true"><i /><i /></div>;
const Crumbs = ({ title }: { title: string }) => (
  <nav className="crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{title}</span>
  </nav>
);
function PageHead({ k, children }: { k: PageKey; children?: ReactNode }) {
  const p = pageInfo(k);
  return (
    <section className={`phead phead--${k}`} id="top">
      <Fluid />
      <div className="wrap phead__row">
        <div className="phead__text" data-rv>
          <h1 className="phead__title">{p.title}</h1>
          <p className="phead__lead">{p.lead}</p>
          <Crumbs title={p.title} />
        </div>
        {children && <div className="phead__key" data-rv style={v({ '--d': '80ms' })}>{children}</div>}
      </div>
    </section>
  );
}

/* search with the live count inside the field */
function Search({ label, total, noun, placeholder = label, className = '' }: { label: string; total: number; noun: string; placeholder?: string; className?: string }) {
  return (
    <label className={`gsearch ${className}`.trim()}>
      {I.search}
      <span className="sr-only">{label}</span>
      <input type="search" data-f-search placeholder={placeholder} autoComplete="off" />
      <span className="gsearch__n" aria-live="polite"><b data-f-count>{num(total)}</b> {noun}</span>
    </label>
  );
}
const Empty = ({ text }: { text: string }) => <p className="gempty" data-f-empty hidden>{text}</p>;
const More = ({ label }: { label: string }) => <div className="gmore"><button type="button" className="pill-btn pill-btn--lg" data-f-more hidden>{label}</button></div>;

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
   the left, the committees as the filter at the right. Under it one ledger of everybody else. */
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
              <article className="cstage__gov" data-item data-q={gov.q} data-group={groups[0].key}>
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
              <p className="cstage__total"><b data-count>{num(total)}</b> members in <b data-count>{num(groups.length)}</b> committees</p>
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

          <div className="cledger glass" data-rv style={v({ '--d': '60ms' })}>
            {groups.map((g, gi) => {
              const list = gi === 0 ? g.members.slice(1) : g.members;
              if (!list.length) return null;
              return (
                <section key={g.key} className="cgroup" data-f-group style={v({ '--c': HUE[gi % 4] })}>
                  <h2 className="cgroup__title"><i aria-hidden="true" />{g.title}</h2>
                  <ul>
                    {list.map((m, i) => (
                      <li key={i} className="cperson" data-item data-q={m.q} data-group={g.key}>
                        <span className="avatar">{m.photo ? <img src={m.photo.src} alt="" width="44" height="44" loading="lazy" /> : <span aria-hidden="true">{m.initials}</span>}</span>
                        <h3 className="cperson__name">{m.name}</h3>
                        <p className="cperson__role">{m.role}</p>
                        <p className="cperson__club">{clubName(m.club)}</p>
                      </li>
                    ))}
                  </ul>
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

/* ================= Club Finder =================
   A console that stays in view (search + the seven meeting days drawn as bars) beside the clubs. */
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
                  <div className="fclub__text">
                    <h3><a className="fclub__link" href={c.href} target="_blank" rel="noopener">Rotary Club of {c.name}</a></h3>
                    {c.place && <p className="fclub__place">{c.place}</p>}
                  </div>
                  {c.day && <p className="fclub__day">{I.clock}{c.day}</p>}
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

/* ================= Club Projects / Club Service ================= */
function ProjectCard({ p }: { p: Project }) {
  const L = P.projects.statLabels;
  return (
    <li className="pcard glass" data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-glow>
      <div className="pcard__in">
        <figure className="pcard__photo">
          <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
          <span className={`pcard__tag pcard__tag--${p.avenue}`}><i aria-hidden="true" />{avenueLabel(p.avenue)}</span>
        </figure>
        <div className="pcard__body">
          <h3>{p.title}</h3>
          <p className="pcard__meta"><span>{clubName(p.club)}</span><span>{shortDate(p.date)}</span></p>
          <p className="pcard__sum">{p.summary}</p>
          <dl className="pcard__nums">
            <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
            <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
            <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
          </dl>
        </div>
      </div>
    </li>
  );
}

function Projects({ service = false }: { service?: boolean }) {
  const x = P.projects;
  const L = x.statLabels;
  const list = projectsOf(service ? 'club' : undefined);
  const t = totals(list);
  const stats = [
    { key: 'projects' as const, label: L.projects, value: num(t.projects), accent: HUE[1] },
    { key: 'beneficiaries' as const, label: L.beneficiaries, value: num(t.beneficiaries), accent: HUE[2] },
    { key: 'amount' as const, label: L.amount, value: `₹${R.fmt.num(t.amount, 1)} L`, accent: HUE[3] },
    { key: 'hours' as const, label: L.hours, value: num(t.hours), accent: HUE[0] }
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
          {service ? (
            <div className="sbento">
              {stats.map((s, i) => (
                <div key={s.key} className={`sbento__cell sbento__cell--${s.key}`} data-glow data-rv style={v({ '--accent': s.accent, '--d': `${i * 60}ms` })}>
                  <p className="sbento__top"><span className="sbento__icon">{SNAP[s.key]}</span><span className="sbento__label">{s.label}</span></p>
                  <b className="sbento__num" data-count>{s.value}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="gchips" role="group" aria-label="Avenue of service" data-rv>
              <button type="button" className="gchip" data-f-chip="avenue" data-v="" aria-pressed="true">{x.allLabel}<b>{num(list.length)}</b></button>
              {x.avenues.map(a => {
                const n = list.filter(p => p.avenue === a.key).length;
                return n ? <button key={a.key} type="button" className="gchip" data-f-chip="avenue" data-v={a.key} aria-pressed="false"><i className={`gdot gdot--${a.key}`} aria-hidden="true" />{a.label}<b>{num(n)}</b></button> : null;
              })}
            </div>
          )}
          <ul className="pwall" data-rv style={v({ '--d': '60ms' })}>{list.map(p => <ProjectCard key={p.id} p={p} />)}</ul>
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
  const today = parseISO(C.today);
  const wd = (d: Date) => C.weekdays[(d.getDay() - C.weekStartsOn + 7) % 7];
  const pad = (n: number) => String(n).padStart(2, '0');
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
                  {total > 0 && (
                    <div className="dstrip__types">
                      <div className="gchips" role="group" aria-label="Show">
                        <button type="button" className="gchip" data-f-chip="type" data-v="" aria-pressed="true">All<b>{num(total)}</b></button>
                        {lanes.filter(l => l.items.length).map(l => (
                          <button key={l.t.key} type="button" className="gchip" data-f-chip="type" data-v={l.t.key} aria-pressed="false"><i className={`mark mark--${l.t.key}`} aria-hidden="true" />{l.t.group}<b>{num(l.items.length)}</b></button>
                        ))}
                      </div>
                      {isNow && <p className="dstrip__today"><b>{today.getDate()}</b><span>{longDate(today)}</span></p>}
                      <p className="dstrip__n" aria-live="polite"><b data-f-count>{num(total)}</b> entries</p>
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
                                  <b>{tx.head}</b>
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
                    {y.bulletins.map((b, i) => (
                      <li key={i} className={`doc glass ${i % 2 ? 'doc--gold' : ''}`.trim()} data-item data-q={`${b.title} ${b.club}`.toLowerCase()} data-glow>
                        <span className="doc__icon" aria-hidden="true">{I.doc}</span>
                        <h3>{b.title}</h3>
                        <p className="doc__club">{clubName(b.club)}</p>
                        <p className="doc__date">{shortDate(b.date)}</p>
                        <div className="doc__acts">
                          <a className="pill-btn pill-btn--solid" href={b.pdf} target="_blank" rel="noopener">{A.preview}</a>
                          <a className="pill-btn" href={b.pdf} download>{A.download}</a>
                        </div>
                      </li>
                    ))}
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

/* ================= Contact =================
   One row read from the centre outwards, like the homepage's stage: the form in the middle, the
   Governor's office at its left, Join Rotary and Find a club at its right. */
function Contact() {
  const c = P.contact;
  const d = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  return (
    <>
      <PageHead k="contact" />
      <section className="psec psec--top">
        <div className="wrap kgrid">
          <form className="kform glass glass--stage" data-demo-form data-glow data-rv>
            <h2>{c.title}</h2>
            <p className="kform__hours">{c.hours}</p>
            <div className="kform__grid">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="kform__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
            </div>
            <div className="kform__end">
              <button type="submit" className="pill-btn pill-btn--solid pill-btn--lg">{F.send}</button>
              <p className="kform__note">{c.formNote}</p>
            </div>
            <p className="kform__done" data-form-done hidden tabIndex={-1} role="status">{I.check}<span>{c.sent}</span></p>
          </form>
          <aside className="koffice glass" data-glow data-rv style={v({ '--d': '60ms' })}>
            <div className="portrait koffice__portrait">
              {dg?.photo ? <img src={dg.photo.src} alt={dg.photo.alt} width={dg.photo.w} height={dg.photo.h} loading="lazy" /> : <span className="portrait__plate" aria-hidden="true">{initials(dg?.name ?? '')}</span>}
            </div>
            <div className="koffice__who">
              <h2>{c.office}</h2>
              {dg && <p className="koffice__name"><b>{dg.name}</b><span>{dg.role}</span></p>}
            </div>
            <div className="koffice__rows">
              {d.email && <a className="krow" href={`mailto:${d.email}`}>{I.mail}<span>{d.email.split('@')[0]}@<wbr />{d.email.split('@').slice(1).join('@')}</span></a>}
              {d.tel && <a className="krow" href={`tel:${d.tel}`}>{I.phone}<span>{d.phoneDisplay}</span></a>}
            </div>
          </aside>
          <div className="ktile glass" data-glow data-rv style={v({ '--accent': 'var(--c-anniversary)', '--d': '60ms' })}>
            <h2>{c.join.title}</h2>
            <p>{c.join.text}</p>
            <a className="pill-btn pill-btn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
          </div>
          <div className="ktile glass" data-glow data-rv style={v({ '--accent': 'var(--c-club)', '--d': '120ms' })}>
            <h2>{c.finder.title}</h2>
            <p>{c.finder.text}</p>
            <a className="link-arrow" href={pageInfo('finder').file}>{pageInfo('finder').title}{I.arrow}</a>
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
