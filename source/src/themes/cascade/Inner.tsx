import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, toISO, weekdayName, type CalEntry } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* CASCADE inner pages. Every page is a short pile of rounded sheets, as on the homepage: a compact
   warm-paper head (title, lead, breadcrumb, the page's key figure or control on the right), two ramp
   lips behind the first sheet, and, where the page has a main control, ramp folder tabs standing on
   that sheet's top edge. All behaviour comes from data attributes run by shared/inner.js, so the
   plain-HTML pages render and behave the same with no React. */

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  go: <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  right: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 12h13M13 6l6 6-6 6" /></svg>,
  chev: <svg className="ci-chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="m6 9 6 6 6-6" /></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  gift: <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3 6.5 3.5 7 5.5S10 7 12 7zm0 0c2-4 5.5-3.5 5-1.5S14 7 12 7z" /></svg>,
  heart: <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5S3.5 15.3 3.5 9.3C3.5 6.6 5.6 4.8 8 4.8c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.4 0 4.5 1.8 4.5 4.5 0 6-8.5 11.2-8.5 11.2z" /></svg>
};

/* One pass through the ramp for item i of n things (.ci-t in inner.css turns --i / --of into --tone). */
const tone = (i: number, n: number, more?: CSSProperties) => ({ ['--i' as string]: i, ['--of' as string]: Math.max(1, n - 1), ...more }) as CSSProperties;
const lag = (d: number) => ({ ['--d' as string]: d }) as CSSProperties;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/* ---------- page head ---------- */
function Head({ k, plate, tabs, lead = true, mod = '' }: { k: PageKey; plate?: ReactNode; tabs?: ReactNode; lead?: boolean; mod?: string }) {
  const p = pageInfo(k);
  return (
    <header className={`ci-head ${mod}`} id="top">
      <div className="wrap ci-head__in">
        <div className="ci-head__text" data-rv>
          <h1 className="ci-head__title">{p.title}</h1>
          {lead && <p className="ci-head__lead">{p.lead}</p>}
          <nav className="ci-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a><span aria-hidden="true">/</span><span aria-current="page">{p.title}</span>
          </nav>
        </div>
        {plate && <div className="ci-head__plate" data-rv style={lag(1)}>{plate}</div>}
      </div>
      {tabs}
    </header>
  );
}

/* ---------- shared parts ---------- */
const Search = ({ label }: { label: string }) => (
  <label className="ci-search">{I.search}<span className="sr-only">{label}</span><input type="search" data-f-search placeholder={label} autoComplete="off" /></label>
);
/* "4 of 18 projects": reads right for any number the filter writes into data-f-count */
const Count = ({ n, one, many }: { n: number; one: string; many: string }) => (
  <p className="ci-count" aria-live="polite"><b data-f-count>{n}</b> of {num(n)}<span className="ci-count__noun"> {plural(n, one, many)}</span></p>
);
const Empty = ({ text, hidden = true }: { text: string; hidden?: boolean }) => <p className="ci-empty" data-f-empty hidden={hidden}>{text}</p>;
const More = ({ label }: { label: string }) => <div className="ci-more"><button type="button" className="btn-go" data-f-more hidden>{label}</button></div>;
const Totals = ({ list }: { list: Project[] }) => {
  const t = totals(list);
  const L = P.projects.statLabels;
  const rows = [[L.projects, num(t.projects)], [L.beneficiaries, num(t.beneficiaries)], [L.amount, `₹${R.fmt.num(t.amount, 1)} L`], [L.hours, num(t.hours)]];
  return <ul className="ci-totals" aria-label="Totals">{rows.map(([k, v]) => <li key={k}><span>{k}</span><b data-count>{v}</b></li>)}</ul>;
};

/* ================= About: the admin's content as a letter on the desk ================= */
function About() {
  return (
    <>
      <Head k="about" lead={false} mod="ci-head--about" />
      <section className="ci-sheet ci-desk">
        <div className="wrap">
          <article className="ci-letter" data-rv aria-label={pageInfo('about').title}><AdminContent className="ci-prose" /></article>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee: the Governor on wine, then a folder per committee ================= */
type Person = ReturnType<typeof committee>[number]['members'][number];
const Avatar = ({ m }: { m: Person }) => (m.photo
  ? <img className="ci-av" src={m.photo.src} alt="" width="56" height="56" loading="lazy" />
  : <span className="ci-av" aria-hidden="true">{m.initials}</span>);
const PersonText = ({ m }: { m: Person }) => (
  <div className="ci-person__text">
    <h3>{m.name}</h3>
    <p className="ci-person__role">{m.role}</p>
    {m.club && <p className="ci-person__club">{clubName(m.club)}</p>}
  </div>
);

function Committee() {
  const C = P.committee;
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [exec, ...rest] = groups;
  const [lead, ...team] = exec ? exec.members : [];
  return (
    <div className="ci-page" data-filter>
      <Head k="committee" plate={
        <div className="ci-plate">
          <div className="ci-figs">
            <p className="ci-fig"><b data-count>{num(total)}</b><span>{plural(total, 'member', 'members')}</span></p>
            <p className="ci-fig"><b data-count>{num(groups.length)}</b><span>{plural(groups.length, 'committee', 'committees')}</span></p>
          </div>
          <div className="ci-searchbox"><Search label={C.searchLabel} /><Count n={total} one="member" many="members" /></div>
        </div>} />
      <section className="ci-sheet ci-roster">
        <div className="wrap">
          <div className="ci-chips ci-swipe" role="group" aria-label="Committee" data-lenis-prevent data-rv>
            <button type="button" className="ci-chip" data-f-chip="group" data-v="" aria-pressed="true">All committees<b>{total}</b></button>
            {groups.map((g, i) => (
              <button key={g.key} type="button" className="ci-chip ci-t" style={tone(i, groups.length)} data-f-chip="group" data-v={g.key} aria-pressed="false">
                <i aria-hidden="true" />{g.title}<b>{g.members.length}</b>
              </button>
            ))}
          </div>

          {exec && (
            <section className="ci-exec" data-f-group data-glow aria-labelledby="ci-exec-t">
              <div className="ci-exec__in" data-rv>
                <header className="ci-exec__head"><h2 id="ci-exec-t">{exec.title}</h2><b data-f-group-count>{exec.members.length}</b></header>
                <div className="ci-exec__body">
                  {lead && (
                    <article className="ci-lead" data-item data-q={lead.q} data-group={exec.key}>
                      <div className="ci-lead__photo">
                        {lead.photo
                          ? <img src={lead.photo.src} alt={lead.photo.alt} width={lead.photo.w} height={lead.photo.h} />
                          : <span aria-hidden="true">{lead.initials}</span>}
                      </div>
                      <div className="ci-lead__text">
                        <p className="ci-lead__role">{lead.role}</p>
                        <h3 className="ci-lead__name">{lead.name}</h3>
                        {lead.club && <p className="ci-lead__club">{clubName(lead.club)}</p>}
                      </div>
                    </article>
                  )}
                  {team.length > 0 && (
                    <ul className="ci-tiles">
                      {team.map(m => <li key={m.name + m.role} className="ci-person ci-tile" data-item data-q={m.q} data-group={exec.key}><Avatar m={m} /><PersonText m={m} /></li>)}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          {rest.map((g, i) => (
            <details key={g.key} className="ci-fold ci-t" style={tone(i + 1, groups.length)} open data-f-group data-rv>
              <summary className="ci-fold__tab"><h2>{g.title}</h2><b data-f-group-count>{g.members.length}</b>{I.chev}</summary>
              <ul className="ci-fold__list">
                {g.members.map(m => <li key={m.name + m.role} className="ci-person" data-item data-q={m.q} data-group={g.key}><Avatar m={m} /><PersonText m={m} /></li>)}
              </ul>
            </details>
          ))}
          <Empty text={C.empty} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Finder: an A to Z directory under sticky letter tabs ================= */
function Finder() {
  const f = P.finder;
  const days = f.days;
  /* the backend may send "Thurs": a known day is matched on its first three letters */
  const dayOf = (d?: string) => (d ? days.find(x => x.slice(0, 3).toLowerCase() === d.slice(0, 3).toLowerCase()) ?? d : '');
  const list = [...clubs()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const byLetter = new Map<string, typeof list>();
  list.forEach(c => {
    const ch = c.name.charAt(0).toUpperCase();
    const k = /[A-Z]/.test(ch) ? ch : '#';
    byLetter.set(k, [...(byLetter.get(k) ?? []), c]);
  });
  const letters = [...byLetter].map(([label, items]) => ({ label, id: `az-${label === '#' ? 'num' : label}`, items }));
  return (
    <div className="ci-page" data-filter>
      <Head k="finder" mod="ci-head--az" plate={
        <div className="ci-find">
          <Search label={f.searchLabel} />
          <div className="ci-days" role="group" aria-label={f.dayLabel}>
            <button type="button" className="ci-dchip" data-f-chip="day" data-v="" aria-pressed="true">{f.anyDay.split(' ')[0]}<span className="ci-wide"> {f.anyDay.split(' ').slice(1).join(' ')}</span></button>
            {days.map((d, i) => <button key={d} type="button" className="ci-dchip ci-t" style={tone(i, days.length)} data-f-chip="day" data-v={d} aria-pressed="false" aria-label={d}>{d.slice(0, 3)}</button>)}
          </div>
          <Count n={list.length} one="club" many="clubs" />
        </div>} />
      <nav className="ci-az" aria-label="Clubs from A to Z">
        <div className="ci-az__bar">
          <div className="wrap ci-tabs ci-swipe" data-lenis-prevent>
            {letters.map((l, i) => <a key={l.id} className="ci-tab ci-tab--az ci-t" style={tone(i, letters.length)} href={`#${l.id}`}>{l.label}</a>)}
          </div>
        </div>
      </nav>
      <section className="ci-sheet ci-dir">
        <div className="wrap">
          {letters.map((l, i) => (
            <section key={l.id} className="ci-abc" id={l.id} data-f-group>
              <h2 className="ci-abc__head"><span className="ci-abc__l ci-t" style={tone(i, letters.length)}>{l.label}</span><b className="ci-abc__n" data-f-group-count>{l.items.length}</b></h2>
              <ul className="ci-clubs">
                {l.items.map(c => {
                  const day = dayOf(c.day);
                  const di = days.indexOf(day);
                  return (
                    <li key={c.id} className="ci-club" data-item data-q={c.q} data-day={day}>
                      {day
                        ? <span className="ci-club__day ci-t" style={tone(di < 0 ? 2 : di, days.length)} aria-hidden="true">{day.slice(0, 3)}</span>
                        : <span className="ci-club__day ci-club__day--none" aria-hidden="true">{c.initials}</span>}
                      <h3 className="ci-club__name"><a href={c.href} target="_blank" rel="noopener"><span className="sr-only">Rotary Club of </span>{c.name}{day && <span className="sr-only">, meets on {day}</span>}</a></h3>
                      {c.place && <p className="ci-club__place">{c.place}</p>}
                      <span className="ci-club__go" aria-hidden="true">{I.right}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <Empty text={f.empty} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Projects: photo cards rising out of offset ramp blocks ================= */
const projQ = (p: Project) => `${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase();
const Figures = ({ p, cls }: { p: Project; cls: string }) => {
  const L = P.projects.statLabels;
  return (
    <dl className={cls}>
      <div><dt>{L.beneficiaries}</dt><dd>{num(p.beneficiaries)}</dd></div>
      <div><dt>{L.amount}</dt><dd>₹{R.fmt.num(p.amount, 1)} L</dd></div>
      <div><dt>{L.hours}</dt><dd>{num(p.hours)}</dd></div>
    </dl>
  );
};

function Projects() {
  const x = P.projects;
  const list = projectsOf();
  const avs = [{ key: '', label: x.allLabel, n: list.length }, ...x.avenues.map(a => ({ ...a, n: list.filter(p => p.avenue === a.key).length }))];
  return (
    <div className="ci-page" data-filter data-page-size={x.pageSize}>
      <Head k="projects" mod="ci-head--tabs" plate={<Totals list={list} />} tabs={
        <div className="wrap ci-tabs ci-swipe" role="group" aria-label="Avenue of service" data-lenis-prevent>
          {avs.map((a, i) => (
            <button key={a.key} type="button" className="ci-tab ci-t" style={tone(i, avs.length)} data-f-chip="avenue" data-v={a.key} aria-pressed={i === 0}>{a.label}<b>{a.n}</b></button>
          ))}
        </div>} />
      <section className="ci-sheet">
        <div className="wrap">
          <div className="ci-tools" data-rv><Search label={x.searchLabel} /><Count n={list.length} one="project" many="projects" /></div>
          <ul className="ci-projs">
            {list.map((p, i) => (
              <li key={p.id} className="ci-proj" data-item data-q={projQ(p)} data-avenue={p.avenue}>
                <figure className="ci-proj__photo ci-t" style={tone(i % x.pageSize, x.pageSize)}>
                  <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
                  <figcaption className="ci-pill">{avenueLabel(p.avenue)}</figcaption>
                </figure>
                <h3 className="ci-proj__title">{p.title}</h3>
                <p className="ci-proj__meta">{shortDate(p.date)} · {clubName(p.club)}</p>
                <p className="ci-proj__sum">{p.summary}</p>
                <Figures p={p} cls="ci-proj__nums" />
              </li>
            ))}
          </ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Service: a pile of project sheets, photo always on the left ================= */
function Service() {
  const x = P.projects;
  const list = projectsOf('club');
  const L = x.statLabels;
  return (
    <div className="ci-page" data-filter data-page-size={x.pageSize}>
      <Head k="service" plate={<Totals list={list} />} />
      <section className="ci-sheet ci-sheet--slim">
        <div className="wrap ci-tools" data-rv><Search label={x.searchLabel} /><Count n={list.length} one="project" many="projects" /></div>
      </section>
      <ul className="ci-pile">
        {list.map((p, i) => (
          <li key={p.id} className="ci-story" data-item data-q={projQ(p)} data-avenue={p.avenue}>
            <div className="wrap ci-story__in" data-rv>
              <figure className="ci-story__photo ci-t" style={tone(i % x.pageSize, Math.min(list.length, x.pageSize))}>
                <img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" />
                <figcaption className="ci-pill">{avenueLabel(p.avenue)}</figcaption>
              </figure>
              <div className="ci-story__text">
                <h2 className="ci-story__title">{p.title}</h2>
                <p className="ci-story__meta">{shortDate(p.date)} · {clubName(p.club)}</p>
                <p className="ci-story__sum">{p.summary}</p>
                <dl className="ci-story__nums">
                  <div><dt>{L.beneficiaries}</dt><dd data-count>{num(p.beneficiaries)}</dd></div>
                  <div><dt>{L.amount}</dt><dd data-count>{`₹${R.fmt.num(p.amount, 1)} L`}</dd></div>
                  <div><dt>{L.hours}</dt><dd data-count>{num(p.hours)}</dd></div>
                </dl>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <section className="ci-sheet ci-pile__end">
        <div className="wrap"><Empty text={x.empty} /><More label={x.more} /></div>
      </section>
    </div>
  );
}

/* ================= District Calendar: today's pad page, twelve month tabs, events + greetings ================= */
const C = R.calendar;
const EVENT = (e: CalEntry) => e.type === 'club' || e.type === 'district';
const typeLabel = (k: CalEntry['type']) => C.types.find(t => t.key === k)?.label ?? k;
const wd3 = (d: Date) => weekdayName(d).slice(0, 3);

const Leaf = ({ d, today }: { d: Date; today: boolean }) => (
  <p className="ci-leaf" {...(today ? { 'aria-current': 'date' as const } : {})}>
    <span>{wd3(d)}</span><b>{d.getDate()}</b>{today && <em className="tag-today">{C.todayTag}</em>}
  </p>
);
const Evt = ({ e }: { e: CalEntry }) => {
  const where = [e.club && clubName(e.club), e.venue].filter(Boolean).join(' · ');
  return (
    <li className={`evt evt--${e.type}`} data-item data-type={e.type}>
      <span className="evt__time">{e.time ?? '—'}</span>
      <span className="evt__main"><b>{e.title}</b>{where && <span>{where}</span>}</span>
      <small className="ci-kind">{typeLabel(e.type)}</small>
    </li>
  );
};
const Note = ({ e }: { e: CalEntry }) => (
  <li className={`note note--${e.type}`} data-item data-type={e.type}>
    <span className="note__mark" aria-hidden="true">{e.type === 'birthday' ? I.gift : I.heart}</span>
    <span className="note__av" aria-hidden="true">{initials(e.name ?? '')}</span>
    <span className="note__text"><b>{e.name}</b><span><span className="sr-only">{typeLabel(e.type)}: </span>{e.club ? clubName(e.club) : e.relation}</span></span>
  </li>
);

function Month({ m, open }: { m: ReturnType<typeof calMonths>[number]; open: boolean }) {
  const days = monthEntries(m.date);
  const all = days.flatMap(d => d.list);
  const now = m.key === todayMonthKey();
  const today = C.today;
  /* this month: today and what follows first, the days already past after them */
  const ahead = now ? days.filter(d => d.iso >= today) : days;
  const past = now ? days.filter(d => d.iso < today) : [];
  const evs = (d: (typeof days)[number]) => d.list.filter(EVENT);
  const gts = (d: (typeof days)[number]) => d.list.filter(e => !EVENT(e));
  const nEv = all.filter(EVENT).length;
  const nGt = all.length - nEv;
  const evDays = new Set(days.filter(d => evs(d).length).map(d => d.iso));
  const byIso = new Map(days.map(d => [d.iso, d.list]));
  const y = m.date.getFullYear(), mo = m.date.getMonth();
  const length = new Date(y, mo + 1, 0).getDate();
  const sum = (ds: typeof days, pick: typeof evs) => ds.reduce((s, d) => s + pick(d).length, 0);

  const eDay = (d: (typeof days)[number]) => {
    const list = evs(d);
    if (!list.length) return null;
    const isT = d.iso === today;
    return (
      <div key={d.iso} className={`ci-eday${isT ? ' is-today' : ''}`} id={`d-${d.iso}`} data-f-group>
        <Leaf d={d.date} today={isT} />
        <ul className="ci-evts">{list.map((e, j) => <Evt key={j} e={e} />)}</ul>
      </div>
    );
  };
  const gDay = (d: (typeof days)[number]) => {
    const list = gts(d);
    if (!list.length) return null;
    const isT = d.iso === today;
    return (
      <details key={d.iso} className={`ci-gday ci-t${isT ? ' is-today' : ''}`} style={tone(Math.floor((d.date.getDate() - 1) / 7), 5)} open={isT} data-f-group id={evDays.has(d.iso) ? undefined : `d-${d.iso}`}>
        <summary>
          <span className="ci-gday__date" {...(isT ? { 'aria-current': 'date' as const } : {})}><b>{d.date.getDate()}</b> {wd3(d.date)}</span>
          {isT && <em className="tag-today">{C.todayTag}</em>}
          <b className="ci-gday__n" data-f-group-count>{list.length}</b>{I.chev}
        </summary>
        <ul className="notes ci-notes">{list.map((e, j) => <Note key={j} e={e} />)}</ul>
      </details>
    );
  };

  return (
    <section className="ci-month" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      <div className="ci-month__head">
        <h2>{m.label}</h2>
        {all.length > 0 && (
          <div className="fchips ci-types ci-swipe" role="group" aria-label="Show" data-lenis-prevent>
            <button type="button" className="fchip" data-f-chip="type" data-v="" aria-pressed="true">{C.tabs[0].label}<b>{all.length}</b></button>
            {C.types.map(t => (
              <button key={t.key} type="button" className="fchip" data-f-chip="type" data-v={t.key} aria-pressed="false">
                <i className={`dot dot--${t.key}`} aria-hidden="true" />{t.group}<b>{all.filter(e => e.type === t.key).length}</b>
              </button>
            ))}
          </div>
        )}
      </div>
      {all.length > 0 && (
        <>
          <div className="ticks ci-ribbon">
            {Array.from({ length }, (_, i) => {
              const date = new Date(y, mo, i + 1);
              const iso = toISO(date);
              const list = byIso.get(iso);
              const cur = iso === today ? { 'aria-current': 'date' as const } : {};
              return list
                ? <a key={iso} className="tick" href={`#d-${iso}`} aria-label={longDate(date)} {...cur}><b>{i + 1}</b><span className="tick__dots" aria-hidden="true">{typesOf(list).map(k => <i key={k} className={`dot dot--${k}`} />)}</span></a>
                : <span key={iso} className="tick is-empty" {...cur}><b>{i + 1}</b><span className="tick__dots" /></span>;
            })}
          </div>
          <div className="ci-cal__cols">
            {nEv > 0 && (
              <section className="ci-evs" data-f-group aria-label="Events">
                <h3 className="ci-colh">Events <b data-f-group-count>{nEv}</b></h3>
                {now && !evDays.has(today) && (
                  <p className="ci-none"><em className="tag-today">{C.todayTag}</em><b aria-current="date">{weekdayName(parseISO(today))}, {shortDate(today)}</b><span>No events today</span></p>
                )}
                {ahead.map(eDay)}
                {sum(past, evs) > 0 && (
                  <div className="ci-past" data-f-group><p className="ci-past__h">Earlier this month <b data-f-group-count>{sum(past, evs)}</b></p>{past.map(eDay)}</div>
                )}
              </section>
            )}
            {nGt > 0 && (
              <aside className="ci-gts" data-f-group aria-label={`${C.types[2].group} and ${C.types[3].group.toLowerCase()}`}>
                <h3 className="ci-colh">{C.types[2].group} and {C.types[3].group.toLowerCase()} <b data-f-group-count>{nGt}</b></h3>
                <div className="ci-folders">{ahead.map(gDay)}</div>
                {sum(past, gts) > 0 && (
                  <div className="ci-past" data-f-group><p className="ci-past__h">Earlier this month <b data-f-group-count>{sum(past, gts)}</b></p><div className="ci-folders">{past.map(gDay)}</div></div>
                )}
              </aside>
            )}
          </div>
        </>
      )}
      <div className="ci-blank" data-f-empty hidden={all.length > 0}><b>{m.label}</b><span>{P.calendar.emptyMonth}</span></div>
    </section>
  );
}

function CalendarPage() {
  const months = calMonths();
  const open = todayMonthKey();
  const t = parseISO(C.today);
  return (
    <div className="ci-page" data-tabs>
      <Head k="calendar" mod="ci-head--tabs ci-head--months" plate={
        <div className="ci-pad" aria-label={`Today, ${longDate(t)}`} role="img">
          <p className="ci-pad__page">
            <span className="ci-pad__month">{monthLabel(t)}</span>
            <b className="ci-pad__day">{t.getDate()}</b>
            <span className="ci-pad__wd">{weekdayName(t)} <em className="tag-today">{C.todayTag}</em></span>
          </p>
        </div>} tabs={
        <div className="wrap ci-tabs ci-tabs--months" role="tablist" aria-label={P.calendar.monthLabel} data-lenis-prevent>
          {months.map((m, i) => (
            <button key={m.key} type="button" role="tab" className={`ci-tab ci-t${m.key === open ? ' is-on' : ''}`} style={tone(i, months.length)} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
              <span className="ci-tab__m">{m.short}</span><small className="ci-tab__y">{m.date.getFullYear()}</small>
              {m.key === open && <i className="ci-tab__now" aria-hidden="true" />}
            </button>
          ))}
        </div>} />
      <section className="ci-sheet ci-cal">
        <div className="wrap">{months.map(m => <Month key={m.key} m={m} open={m.key === open} />)}</div>
      </section>
    </div>
  );
}

/* ================= Newsletters: a pile of folders, newest on top; text only ================= */
const Strip = ({ n, title, sub, date, pdf, q }: { n: number; title: string; sub?: string; date: string; pdf: string; q?: string }) => (
  <li className="ci-strip" style={{ ['--n' as string]: n % 12 } as CSSProperties} {...(q !== undefined ? { 'data-item': '', 'data-q': q } : {})}>
    <div className="ci-strip__text"><h3>{title}</h3>{sub && <p className="ci-strip__sub">{sub}</p>}</div>
    <p className="ci-strip__date">{shortDate(date)}</p>
    <div className="ci-strip__acts">
      <a className="pbtn pbtn--solid" href={pdf} target="_blank" rel="noopener">{R.press.actions.preview}<span className="sr-only">: {title}</span></a>
      <a className="pbtn" href={pdf} download>{R.press.actions.download}<span className="sr-only">: {title}</span></a>
    </div>
  </li>
);

function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const years = pressYears();
  const tabs = [
    { key: 'club', label: N.club, n: (y: (typeof years)[number]) => y.bulletins.length },
    { key: 'governor', label: N.governor, n: (y: (typeof years)[number]) => y.gml.length }
  ];
  return (
    <div className="ci-page" data-tabs data-tabs-hash>
      <Head k="newsletters" mod="ci-head--tabs ci-head--press" plate={years.map(y => (
        <p key={y.year} className="ci-yearfig" data-year={y.year} hidden={y.year !== year}><b>{y.year}</b><span>{N.yearLabel}</span></p>
      ))} tabs={
        <div className="wrap ci-tabs ci-tabs--press" role="tablist" aria-label={pageInfo('newsletters').title} data-lenis-prevent>
          {tabs.map((t, i) => (
            <button key={t.key} type="button" role="tab" className={`ci-tab ci-t${i === 0 ? ' is-on' : ''}`} style={tone(i, 2)} data-tab={t.key} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1}>
              {t.label}{years.map(y => <b key={y.year} data-year={y.year} hidden={y.year !== year}>{t.n(y)}</b>)}
            </button>
          ))}
        </div>} />
      <section className="ci-sheet ci-press">
        <div className="wrap">
          {years.map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year}>
              <div className="ci-press__panel" data-panel="club" role="tabpanel" aria-label={N.club} data-filter data-page-size="12">
                <div className="ci-tools" data-rv><Search label={N.searchLabel} /><Count n={y.bulletins.length} one="bulletin" many="bulletins" /></div>
                {y.bulletins.length > 0 && (
                  <ul className="ci-stack">
                    {y.bulletins.map((b, i) => <Strip key={b.title + i} n={i} title={b.title} sub={clubName(b.club)} date={b.date} pdf={b.pdf} q={`${b.title} ${b.club}`.toLowerCase()} />)}
                  </ul>
                )}
                <Empty text={R.fmt.fill(R.press.club.empty, { year: y.year })} hidden={y.bulletins.length > 0} />
                <More label="Show more bulletins" />
              </div>
              <div className="ci-press__panel" data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                {y.gml.length
                  ? <ul className="ci-stack">{y.gml.map((g, i) => <Strip key={g.title + i} n={i} title={g.month} sub={g.governor} date={g.date} pdf={g.pdf} />)}</ul>
                  : <p className="ci-empty">{R.fmt.fill(R.press.gml.empty, { year: y.year })}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================= Contact: one form sheet under the Governor's office letterhead ================= */
function Contact() {
  const c = P.contact;
  const d = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const finder = pageInfo('finder');
  return (
    <>
      <Head k="contact" />
      <section className="ci-sheet ci-desk ci-desk--contact">
        <div className="wrap">
          <div className="ci-paper" data-rv>
            <aside className="ci-lhead" data-glow aria-labelledby="ci-office">
              <div className="ci-lhead__photo">
                {dg?.photo
                  ? <img src={dg.photo.src} alt={dg.photo.alt} width={dg.photo.w} height={dg.photo.h} />
                  : <span aria-hidden="true">{initials(dg?.name ?? d.label)}</span>}
              </div>
              <div className="ci-lhead__who">
                <h2 id="ci-office">{c.office}</h2>
                {dg && <p>{dg.name}, {d.label}</p>}
              </div>
              <ul className="ci-lhead__lines">
                <li><a href={`mailto:${d.email}`}><i aria-hidden="true">{I.mail}</i><span>{d.email}</span></a></li>
                <li><a href={`tel:${d.tel}`}><i aria-hidden="true">{I.phone}</i><span>{d.phoneDisplay}</span></a></li>
              </ul>
            </aside>
            <form className="ci-form" data-demo-form>
              <h2 className="ci-form__title">{c.title}</h2>
              <p className="ci-form__hours">{c.hours}</p>
              <div className="ci-form__grid">
                <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
                <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
                <label><span>{F.club}</span><input name="club" autoComplete="organization" /></label>
                <label className="ci-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
              </div>
              <div className="ci-form__foot">
                <button type="submit" className="btn-go">{F.send}{I.go}</button>
                <p className="ci-form__note">{c.formNote}</p>
              </div>
              <p className="ci-form__done" data-form-done hidden tabIndex={-1} role="status">{c.sent}</p>
            </form>
          </div>
          <div className="ci-feet">
            <div className="ci-foot ci-t" style={tone(0, 2)} data-rv>
              <h2>{c.join.title}</h2>
              <p>{c.join.text}</p>
              <a className="pbtn pbtn--solid" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}{I.go}</a>
            </div>
            <div className="ci-foot ci-t" style={tone(1, 2, lag(1))} data-rv>
              <h2>{c.finder.title}</h2>
              <p>{c.finder.text}</p>
              <a className="pbtn pbtn--solid" href={finder.file}>{finder.title}{I.go}</a>
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
  service: () => <Service />,
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
