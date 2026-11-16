import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, monthLabel, parseISO, shortDate, toISO, weekdayName, type CalEntry } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, entriesByDate, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import { Header, TopStrip } from './Chrome';
import Footer from './Footer';
import { ThemeCtx, readTheme, saveTheme, type Theme } from './theme';
import './inner.css';

/* PRISM inner pages (v2). Every page head is the homepage's split hero at a third of its height:
   title on the tinted band, the Rotary-blue dotted panel bleeding right with the page's key figure
   or control. Bodies are plain markup + data attributes (shared/inner.js), so the static HTML
   version is the same page. */

const ACC = ['#0067C8', '#00A2E0', '#D41367', '#00ADBB', '#F7A81B'];
const AVENUE: Record<string, string> = { club: '#0067C8', community: '#00ADBB', vocational: '#F7A81B', international: '#00A2E0', youth: '#D41367', image: '#8a5a00' };
const css = (o: Record<string, string | number>) => o as CSSProperties;

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="11" cy="11" r="7" /><path {...sw} d="m20 20-3.5-3.5" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M4 12 12 4M6 4h6v6" /></svg>,
  next: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path {...sw} d="M3 8h10M9 4l4 4-4 4" /></svg>,
  people: <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="9" cy="8" r="3.5" /><path {...sw} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2a6.5 6.5 0 0 1 3 5.8" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  join: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="10" cy="8" r="3.5" /><path {...sw} d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></svg>,
  pin: <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle {...sw} cx="12" cy="10" r="2.4" /></svg>,
  check: <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} strokeWidth={2.4} d="m5 12.5 4.5 4.5L19 7.5" /></svg>
};

/* the last word in the homepage's spectrum gradient (.stitle__hl) */
const HL = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i > 0 ? <>{text.slice(0, i)} <span className="px-hl">{text.slice(i + 1)}</span></> : <span className="px-hl">{text}</span>;
};

const Crumbs = ({ title }: { title: string }) => (
  <nav className="px-crumbs" aria-label={P.breadcrumb}>
    <a href={R.nav[0].href}>{P.home}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{title}</span>
  </nav>
);

/* ---------- page head: tinted band, title left, the blue panel right (bleeds to the screen edge) ---------- */
function PageHead({ k, children, keyClass = '' }: { k: PageKey; children: ReactNode; keyClass?: string }) {
  const p = pageInfo(k);
  return (
    <section className="px-head" id="top">
      <div className="wrap px-head__in">
        <div className="px-head__text" data-rv>
          <Crumbs title={p.title} />
          <h1 className="px-head__title"><HL text={p.title} /></h1>
          <p className="px-head__lead">{p.lead}</p>
        </div>
        <div className={`px-head__key ${keyClass}`.trim()} data-glow data-rv>{children}</div>
      </div>
    </section>
  );
}

/* ---------- shared parts ---------- */
const Search = ({ label, count, hero = false }: { label: string; count?: number; hero?: boolean }) => (
  <label className={hero ? 'px-search px-search--hero' : 'px-search'}>
    {I.search}
    <span className="sr-only">{label}</span>
    <input type="search" data-f-search placeholder={label} autoComplete="off" />
    {count != null && <span className="px-search__n" aria-live="polite"><b data-f-count>{num(count)}</b><span className="sr-only"> shown</span></span>}
  </label>
);

interface ChipItem { v: string; label: string; n?: number; color?: string; cls?: string }
const Chips = ({ attr, all, label, items }: { attr: string; all: string; label: string; items: ChipItem[] }) => (
  <div className="px-chips" role="group" aria-label={label}>
    <button type="button" className="px-chip" data-f-chip={attr} data-v="" aria-pressed="true">{all}</button>
    {items.map(x => (
      <button key={x.v} type="button" className={`px-chip ${x.cls ?? ''}`.trim()} data-f-chip={attr} data-v={x.v} aria-pressed="false" style={x.color ? css({ '--accent': x.color }) : undefined}>
        <i className="dot" aria-hidden="true" />{x.label}{x.n != null && <b>{num(x.n)}</b>}
      </button>
    ))}
  </div>
);

const Empty = ({ text, live = true, hidden = live }: { text: string; live?: boolean; hidden?: boolean }) => (
  <div className="px-empty" {...(live ? { 'data-f-empty': '' } : {})} hidden={hidden}>
    <span className="px-empty__ring" aria-hidden="true" />
    <p>{text}</p>
  </div>
);
const More = ({ label }: { label: string }) => (
  <div className="px-more"><button type="button" className="btn btn--line px-btn" data-f-more hidden>{label}</button></div>
);
const Pill = ({ n, noun }: { n: number; noun: string }) => (
  <span className="px-pill">{I.people}<b data-f-group-count>{num(n)}</b><span className="sr-only"> {noun}</span></span>
);

/* ================= About: the title pinned beside one reading sheet of admin HTML ================= */
function About() {
  const p = pageInfo('about');
  return (
    <div className="px-about" id="top">
      <div className="wrap px-about__in">
        <header className="px-about__head" data-rv>
          <Crumbs title={p.title} />
          <h1 className="px-head__title"><HL text={p.title} /></h1>
          <span className="px-about__bar" aria-hidden="true" />
        </header>
        <div className="px-about__sheet" data-rv style={css({ '--i': 1 })}><AdminContent className="px-prose" /></div>
      </div>
    </div>
  );
}

/* ================= District Committee: Governor spotlight + officer ledger, then committee ledgers ================= */
type Member = ReturnType<typeof committee>[number]['members'][number];

const MemberRow = ({ m, g }: { m: Member; g: string }) => (
  <li className="px-row px-member" data-item data-q={m.q} data-group={g}>
    {m.photo
      ? <img className="px-tile" src={m.photo.src} alt="" width={50} height={50} loading="lazy" />
      : <span className="px-tile" aria-hidden="true">{m.initials}</span>}
    <h3 className="px-member__name">{m.name}</h3>
    <p className="px-member__role">{m.role}</p>
    {m.club && <p className="px-member__club">{clubName(m.club)}</p>}
  </li>
);

const Spotlight = ({ m, g }: { m: Member; g: string }) => (
  <article className="px-spot px-blue" data-item data-q={m.q} data-group={g} data-glow data-rv>
    <figure className="px-spot__photo">
      <span className="px-spot__frame">
        {m.photo
          ? <img src={m.photo.src} alt={m.photo.alt || m.name} width={m.photo.w} height={m.photo.h} />
          : <span className="px-spot__mono" aria-hidden="true">{m.initials}</span>}
      </span>
    </figure>
    <div className="px-spot__text">
      <h3 className="px-spot__name">{m.name}</h3>
      <p className="px-spot__role">{m.role}</p>
      {m.club && <p className="px-spot__club">{clubName(m.club)}</p>}
    </div>
  </article>
);

function Committee() {
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [lead, ...rest] = groups;
  const [first, ...officers] = lead?.members ?? [];
  return (
    <div data-filter>
      <PageHead k="committee">
        <p className="px-kfig"><b data-count>{num(total)}</b><span>members</span><b data-count>{num(groups.length)}</b><span>committees</span></p>
        <Search label={P.committee.searchLabel} count={total} />
      </PageHead>
      <div className="wrap px-body">
        <div className="px-bar" data-rv>
          <Chips attr="group" all="All committees" label="Committee" items={groups.map((g, i) => ({ v: g.key, label: g.title, n: g.members.length, color: ACC[i % ACC.length] }))} />
        </div>
        {lead && first && (
          <section className="px-lead" data-f-group style={css({ '--accent': ACC[0] })}>
            <header className="px-ghead">
              <h2 className="px-h2">{lead.title}</h2>
              <Pill n={lead.members.length} noun="members" />
            </header>
            <div className="px-lead__grid">
              <Spotlight m={first} g={lead.key} />
              {officers.length > 0 && (
                <ul className="px-ledger px-rows" data-f-group data-rv style={css({ '--i': 1 })}>
                  {officers.map((m, i) => <MemberRow key={i} m={m} g={lead.key} />)}
                </ul>
              )}
            </div>
          </section>
        )}
        <div className="px-ledgers">
          {rest.map((g, i) => (
            <section key={g.key} className="px-ledger px-cmte" data-f-group data-rv style={css({ '--accent': ACC[(i + 1) % ACC.length], '--i': i % 3 })}>
              <header className="px-cmte__head">
                <h2>{g.title}</h2>
                <Pill n={g.members.length} noun="members" />
              </header>
              <ul className="px-rows">{g.members.map((m, j) => <MemberRow key={j} m={m} g={g.key} />)}</ul>
            </section>
          ))}
        </div>
        <Empty text={P.committee.empty} />
      </div>
    </div>
  );
}

/* ================= Club Finder: search in the head, the week as the filter, one wide table ================= */
const isWeekend = (day?: string) => day === 'Saturday' || day === 'Sunday';

function Finder() {
  const f = P.finder;
  const list = clubs();
  const today = weekdayName(parseISO(R.calendar.today));
  /* exact equality, the test the filter uses, so a tile's number is what its click shows */
  const on = (d: string) => list.filter(c => c.day === d).length;
  return (
    <div data-filter data-page-size={f.pageSize}>
      <PageHead k="finder">
        <p className="px-kfig"><b data-count>{num(list.length)}</b><span>clubs in District {R.site.district}</span></p>
        <Search label={f.searchLabel} hero />
      </PageHead>
      <div className="wrap px-body">
        <div className="px-week" role="group" aria-label={f.dayLabel} data-rv>
          <button type="button" className="px-wtile" data-f-chip="day" data-v="" aria-pressed="true">
            <span className="px-wtile__d">{f.anyDay}</span>
            <b className="px-wtile__n" data-count>{num(list.length)}</b>
            <span className="px-wtile__u">clubs</span>
          </button>
          {f.days.map((d, i) => (
            <button key={d} type="button" className={`px-wtile${d === today ? ' is-today' : ''}${isWeekend(d) ? ' is-weekend' : ''}`} data-f-chip="day" data-v={d} aria-pressed="false" style={css({ '--i': i + 1 })}>
              <span className="px-wtile__d"><span aria-hidden="true">{d.slice(0, 3)}</span><span className="sr-only">{d}</span></span>
              {d === today && <em className="px-today">{R.calendar.todayTag}</em>}
              <b className="px-wtile__n" data-count>{num(on(d))}</b>
              <span className="px-wtile__u">clubs</span>
            </button>
          ))}
        </div>
        <section className="px-ledger px-table" data-rv style={css({ '--i': 1 })}>
          <header className="px-table__cap">
            <p className="px-table__n" aria-live="polite"><b data-f-count>{num(list.length)}</b> clubs</p>
            <p className="px-tag px-table__day">
              <span data-v="">{f.anyDay}</span>
              {f.days.map(d => <span key={d} data-v={d}>{d}</span>)}
            </p>
          </header>
          <ul className="px-rows">
            {list.map(c => (
              <li key={c.id} className="px-row px-club" data-item data-q={c.q} data-day={c.day ?? ''}>
                <span className={`px-tile px-tile--day${isWeekend(c.day) ? ' is-weekend' : ''}${c.day ? '' : ' is-none'}`} aria-hidden="true">{c.day ? c.day.slice(0, 3) : '—'}</span>
                <h3 className="px-club__name">
                  <a href={c.href} target="_blank" rel="noopener">Rotary Club of {c.name}<span className="sr-only">{c.day ? `, meets every ${c.day}` : ''} (opens in a new tab)</span></a>
                </h3>
                {c.place && <p className="px-club__place" title={c.place}>{c.place}</p>}
                <span className="px-go" aria-hidden="true">{I.arrow}</span>
              </li>
            ))}
          </ul>
          <Empty text={f.empty} />
          <More label={f.more} />
        </section>
      </div>
    </div>
  );
}

/* ================= Club Projects / Club Service ================= */
const Totals = ({ list }: { list: Project[] }) => {
  const t = totals(list), L = P.projects.statLabels;
  const cells: [string, string][] = [[L.projects, num(t.projects)], [L.beneficiaries, num(t.beneficiaries)], [L.amount, `₹${R.fmt.num(t.amount, 1)} L`], [L.hours, num(t.hours)]];
  return <dl className="px-kquad">{cells.map(([l, v]) => <div key={l}><dt>{l}</dt><dd data-count>{v}</dd></div>)}</dl>;
};

function ProjectItem({ p, i, glow = false }: { p: Project; i: number; glow?: boolean }) {
  const L = P.projects.statLabels;
  const figs: [string, string][] = [[L.beneficiaries, num(p.beneficiaries)], [L.amount, `₹${R.fmt.num(p.amount, 1)} L`], [L.hours, num(p.hours)]];
  return (
    <li className="px-proj" style={css({ '--accent': AVENUE[p.avenue] ?? ACC[0], '--i': glow ? 0 : i % 3 })} data-item data-q={`${p.title} ${p.club} ${avenueLabel(p.avenue)}`.toLowerCase()} data-avenue={p.avenue} data-rv>
      <figure className="px-proj__photo"><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} {...(i ? { loading: 'lazy' as const } : {})} /></figure>
      <div className="px-proj__body" {...(glow ? { 'data-glow': '' } : {})}>
        <h3 className="px-proj__title">{p.title}</h3>
        <p className="px-proj__meta">
          <span className="px-tag"><i className="dot" aria-hidden="true" />{avenueLabel(p.avenue)}</span>
          <span>{shortDate(p.date)}{p.club ? ` · ${clubName(p.club)}` : ''}</span>
        </p>
        <p className="px-proj__sum">{p.summary}</p>
        <dl className="px-proj__nums">{figs.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
      </div>
    </li>
  );
}

/* Projects: a spectrum of the avenues over one sheet; the first visible project is drawn as a small hero */
function Projects() {
  const x = P.projects;
  const list = projectsOf();
  const n = (k: string) => list.filter(p => p.avenue === k).length;
  const used = x.avenues.filter(a => n(a.key) > 0);
  return (
    <div data-filter data-page-size={x.pageSize}>
      <PageHead k="projects"><Totals list={list} /></PageHead>
      <div className="wrap px-body">
        <div className="px-bar px-bar--proj" data-rv>
          <Search label={x.searchLabel} count={list.length} />
          <div className="px-spectrum" aria-hidden="true">
            {used.map((a, i) => <i key={a.key} title={a.label} style={css({ '--n': n(a.key), '--accent': AVENUE[a.key] ?? ACC[0], '--k': i })} />)}
          </div>
          <Chips attr="avenue" all={x.allLabel} label="Avenue of service" items={x.avenues.map(a => ({ v: a.key, label: a.label, n: n(a.key), color: AVENUE[a.key] ?? ACC[0] }))} />
        </div>
        <ul className="px-ledger px-projs">{list.map((p, i) => <ProjectItem key={p.id} p={p} i={i} glow />)}</ul>
        <Empty text={x.empty} />
        <More label={x.more} />
      </div>
    </div>
  );
}

/* Club Service: the few projects as a poster trio, figures in a blue foot */
function Service() {
  const x = P.projects;
  const list = projectsOf('club');
  return (
    <div data-filter data-page-size={x.pageSize}>
      <PageHead k="service"><Totals list={list} /></PageHead>
      <div className="wrap px-body">
        <div className="px-bar" data-rv><Search label={x.searchLabel} count={list.length} /></div>
        <ul className="px-posters">{list.map((p, i) => <ProjectItem key={p.id} p={p} i={i} />)}</ul>
        <Empty text={x.empty} />
        <More label={x.more} />
      </div>
    </div>
  );
}

/* ================= District Calendar: month rail, a ruler of the days, tear-off day pages from today ================= */
const PEOPLE = new Set(['birthday', 'anniversary']);
/* "2 club events · 1 birthday", from the type labels in the data */
const summary = (list: CalEntry[]) => R.calendar.types
  .map(t => [t, list.filter(e => e.type === t.key).length] as const)
  .filter(([, n]) => n)
  .map(([t, n]) => `${n} ${(n === 1 ? t.label : t.group).toLowerCase()}`)
  .join(' · ');

function TodayKey() {
  const C = R.calendar;
  const d = parseISO(C.today);
  const line = summary(entriesByDate().get(C.today) ?? []);
  return (
    <div className="px-kday">
      <p className="px-kday__date">
        <b className="px-kday__num">{d.getDate()}</b>
        <span className="px-kday__wd">{weekdayName(d)}</span>
        <span className="px-kday__mo">{monthLabel(d)}</span>
        <em className="px-today">{C.todayTag}</em>
      </p>
      <p className="px-kday__line">{line ? `${line} today` : C.emptyDay}</p>
    </div>
  );
}

function TypeBlock({ type, list, cap }: { type: (typeof R.calendar.types)[number]; list: CalEntry[]; cap: number }) {
  const people = PEOPLE.has(type.key);
  return (
    <section className={`px-dgroup px-t--${type.key}`} data-f-group>
      <h4 className="px-dgroup__h"><i className="dot" aria-hidden="true" />{type.group}<b className="px-pill" data-f-group-count>{num(list.length)}</b></h4>
      {people ? (
        <ul className="px-people">
          {list.map((e, i) => (
            <li key={i} className="px-person" data-item data-type={e.type}>
              <span className="px-person__av" aria-hidden="true">{initials(e.name ?? '')}</span>
              <span className="px-person__text"><b>{e.name}</b>{(e.club || e.relation) && <span>{e.club ? clubName(e.club) : e.relation}</span>}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="px-events">
          {list.map((e, i) => {
            const sub = [e.club && clubName(e.club), e.venue].filter(Boolean).join(' · ');
            return (
              <li key={i} className="px-event" data-item data-type={e.type}>
                <span className="px-event__time">{e.time ?? '—'}</span>
                <span className="px-event__text"><b>{e.title}</b>{sub && <span>{sub}</span>}</span>
              </li>
            );
          })}
        </ul>
      )}
      {people && list.length > cap && (
        <label className="px-all">
          <input type="checkbox" />
          <span className="px-all__more">Show all {num(list.length)} {type.group.toLowerCase()}</span>
          <span className="px-all__less">Show fewer</span>
        </label>
      )}
    </section>
  );
}

function DayPage({ iso, list, today = false }: { iso: string; list: CalEntry[]; today?: boolean }) {
  const C = R.calendar;
  const date = parseISO(iso);
  const wk = date.getDay() === 0 || date.getDay() === 6;
  const types = C.types.filter(t => list.some(e => e.type === t.key));
  return (
    <article className={`px-day${today ? ' px-day--today' : ''}${wk ? ' is-weekend' : ''}`} id={`d${iso}`}
      {...(list.length ? { 'data-f-group': '' } : {})} {...(today ? { 'aria-current': 'date' as const } : {})} data-rv>
      <h3 className="px-day__stub" {...(today ? { 'data-glow': '' } : {})}>
        <span className="px-day__wd">{weekdayName(date)}</span>
        <b className="px-day__num">{date.getDate()}</b>
        <span className="px-day__mo">{monthLabel(date)}</span>
        {today && <em className="px-today">{C.todayTag}</em>}
      </h3>
      <div className="px-day__body">
        {types.length
          ? types.map(t => <TypeBlock key={t.key} type={t} list={list.filter(e => e.type === t.key)} cap={today ? 8 : 4} />)
          : <p className="px-day__free">{C.emptyDay}</p>}
      </div>
    </article>
  );
}

function MonthPanel({ m, open }: { m: ReturnType<typeof calMonths>[number]; open: boolean }) {
  const C = R.calendar;
  const days = monthEntries(m.date);
  const byIso = new Map(days.map(d => [d.iso, d.list]));
  const total = days.reduce((s, d) => s + d.list.length, 0);
  const count = (k: string) => days.reduce((s, d) => s + d.list.filter(e => e.type === k).length, 0);
  const y = m.date.getFullYear(), mo = m.date.getMonth();
  const dim = new Date(y, mo + 1, 0).getDate();
  /* this month: today first, then the days after it, then the earlier days */
  const hasToday = m.key === todayMonthKey();
  const later = hasToday ? days.filter(d => d.iso > C.today) : days;
  const earlier = hasToday ? days.filter(d => d.iso < C.today) : [];
  return (
    <div className="px-cal" data-panel={m.key} role="tabpanel" aria-label={m.label} hidden={!open} data-filter>
      <header className="px-cal__top" data-rv>
        <h2 className="px-h2 px-cal__title"><HL text={m.label} /></h2>
        {total > 0 && <Chips attr="type" all="All" label="Show" items={C.types.map(t => ({ v: t.key, label: t.group, n: count(t.key), cls: `px-t--${t.key}` }))} />}
      </header>
      <ol className="px-ruler" style={css({ '--days': dim })} aria-label={`Days of ${m.label}`} data-rv>
        {Array.from({ length: dim }, (_, i) => {
          const date = new Date(y, mo, i + 1), iso = toISO(date), list = byIso.get(iso);
          const isToday = iso === C.today;
          const cls = `px-rtile${isToday ? ' is-today' : ''}${date.getDay() === 0 || date.getDay() === 6 ? ' is-weekend' : ''}`;
          const inner = <><span aria-hidden="true">{weekdayName(date)[0]}</span><b>{i + 1}</b></>;
          return (
            <li key={iso}>
              {list ? (
                <a className={cls} href={`#d${iso}`} aria-label={`${weekdayName(date)} ${i + 1} ${m.label}${isToday ? ', today' : ''}: ${summary(list)}`} {...(isToday ? { 'aria-current': 'date' as const } : {})}>
                  {inner}
                  <i className="px-rdots" aria-hidden="true">{C.types.filter(t => list.some(e => e.type === t.key)).map(t => <i key={t.key} className={`dot dot--${t.key}`} />)}</i>
                </a>
              ) : (
                <span className={cls} {...(isToday ? { 'aria-current': 'date' as const } : {})}>{inner}<span className="sr-only">{weekdayName(date)} {i + 1}</span></span>
              )}
            </li>
          );
        })}
      </ol>
      {total > 0 && (
        <div className="px-days">
          {hasToday && <DayPage iso={C.today} list={byIso.get(C.today) ?? []} today />}
          {later.map(d => <DayPage key={d.iso} iso={d.iso} list={d.list} />)}
          {earlier.length > 0 && (
            <section className="px-earlier" data-f-group>
              <h3 className="px-earlier__h">Earlier this month</h3>
              {earlier.map(d => <DayPage key={d.iso} iso={d.iso} list={d.list} />)}
            </section>
          )}
        </div>
      )}
      <div className="px-day px-day--none" data-f-empty hidden={total > 0}>
        <p className="px-day__stub"><b className="px-day__num">{m.short}</b><span className="px-day__mo">{y}</span></p>
        <div className="px-day__body"><span className="px-empty__ring" aria-hidden="true" /><p>{P.calendar.emptyMonth}</p></div>
      </div>
    </div>
  );
}

function CalendarPage() {
  const months = calMonths();
  const open = todayMonthKey();
  return (
    <div data-tabs>
      <PageHead k="calendar" keyClass="px-head__key--today"><TodayKey /></PageHead>
      <div className="wrap px-body">
        <div className="px-months" role="tablist" aria-label={P.calendar.monthLabel} data-rv>
          {months.map(m => (
            <button key={m.key} type="button" role="tab" className={`px-month${m.key === open ? ' is-on has-today' : ''}`} data-tab={m.key} aria-selected={m.key === open} tabIndex={m.key === open ? 0 : -1}>
              <span>{m.short}</span><small>{m.date.getFullYear()}</small>
            </button>
          ))}
        </div>
        {months.map(m => <MonthPanel key={m.key} m={m} open={m.key === open} />)}
      </div>
    </div>
  );
}

/* ================= Newsletters: section tabs in the head panel, a broadsheet with a lead story ================= */
const footLine = (vals: Record<string, string | number>) => R.fmt.fill(R.press.club.footer, vals).split(' on the {link}')[0] + '.';

function Newsletters({ year }: { year: string }) {
  const N = P.newsletters;
  const A = R.press.actions;
  const years = pressYears();
  const per = (f: (y: (typeof years)[number]) => ReactNode) => years.map(y => <span key={y.year} data-year={y.year} hidden={y.year !== year}>{f(y)}</span>);
  const acts = (pdf: string) => (
    <div className="px-story__acts">
      <a className="newsbtn newsbtn--solid" href={pdf} target="_blank" rel="noopener">{A.preview}</a>
      <a className="newsbtn" href={pdf} download>{A.download}</a>
    </div>
  );
  return (
    <div data-tabs data-tabs-hash>
      <PageHead k="newsletters">
        <div className="px-ktabs" role="tablist" aria-label={pageInfo('newsletters').title}>
          <button type="button" role="tab" className="px-ktab is-on" data-tab="club" aria-selected="true"><span>{N.club}</span><b>{per(y => num(y.bulletins.length))}</b></button>
          <button type="button" role="tab" className="px-ktab" data-tab="governor" aria-selected="false" tabIndex={-1}><span>{N.governor}</span><b>{per(y => num(y.gml.length))}</b></button>
        </div>
        <p className="px-kline">{N.yearLabel} <b>{per(y => y.year)}</b></p>
      </PageHead>
      <div className="wrap px-body">
        <div className="px-news" data-rv>
          {years.map(y => (
            <div key={y.year} data-year={y.year} hidden={y.year !== year}>
              <section data-panel="club" role="tabpanel" aria-label={N.club} data-filter data-page-size="13">
                <header className="px-news__sec">
                  <h2 className="px-news__h">{N.club}</h2>
                  {y.bulletins.length > 0 && <Search label={N.searchLabel} count={y.bulletins.length} />}
                </header>
                {y.bulletins.length > 0 && (
                  <ol className="px-stories">
                    {y.bulletins.map((b, i) => (
                      <li key={i} className="px-story" data-item data-q={`${b.title} ${b.club}`.toLowerCase()}>
                        <h3 className="px-story__h">{b.title}</h3>
                        <p className="px-story__by">{clubName(b.club)}</p>
                        <p className="px-story__date">{shortDate(b.date)}</p>
                        {acts(b.pdf)}
                      </li>
                    ))}
                  </ol>
                )}
                <Empty text={y.bulletins.length ? 'No bulletin matches your search.' : R.fmt.fill(R.press.club.empty, { year: y.year })} hidden={y.bulletins.length > 0} />
                {y.bulletins.length > 0 && (
                  <footer className="px-news__foot">
                    <p>{footLine({ shown: y.bulletins.length, total: num(y.total), year: y.year })}</p>
                    <button type="button" className="newsbtn" data-f-more hidden>Show more bulletins</button>
                  </footer>
                )}
              </section>
              <section data-panel="governor" role="tabpanel" aria-label={N.governor} hidden>
                <header className="px-news__sec"><h2 className="px-news__h">{N.governor}</h2></header>
                {y.gml.length ? (
                  <ol className="px-letters">
                    {y.gml.map((g, i) => (
                      <li key={i} className="px-letter">
                        <h3>{g.month}</h3>
                        <p className="px-letter__by">{g.governor} · {shortDate(g.date)}</p>
                        {acts(g.pdf)}
                      </li>
                    ))}
                  </ol>
                ) : <Empty text={R.fmt.fill(R.press.gml.empty, { year: y.year })} live={false} hidden={false} />}
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Contact: the Governor's office in the head panel, the form sheet beside two doors ================= */
function Contact() {
  const c = P.contact;
  const o = R.contact;
  const F = c.fields;
  const dg = R.dignitaries.byYear[R.years.current]?.dg;
  const finder = pageInfo('finder');
  return (
    <>
      <PageHead k="contact">
        <div className="px-koffice">
          <span className="px-koffice__ring">
            {dg?.photo ? <img src={dg.photo.src} alt="" width={dg.photo.w} height={dg.photo.h} /> : <span className="px-koffice__mono" aria-hidden="true">{initials(dg?.name ?? c.office)}</span>}
          </span>
          <div>
            <h2 className="px-koffice__h">{c.office}</h2>
            {dg && <p className="px-koffice__who">{dg.name}, {o.label}</p>}
          </div>
        </div>
        <div className="px-klinks">
          {o.email && <a className="px-klink" href={`mailto:${o.email}`}>{I.mail}<span>{o.email}</span></a>}
          {o.tel && <a className="px-klink" href={`tel:${o.tel}`}>{I.phone}<span>{o.phoneDisplay}</span></a>}
        </div>
      </PageHead>
      <div className="wrap px-body px-contact">
        <form className="px-sheet px-form" data-demo-form data-rv>
          <header className="px-form__head">
            <h2 className="px-h2"><HL text={c.title} /></h2>
            <p className="px-form__hours">{c.hours}</p>
          </header>
          <div className="px-form__body">
            <div className="px-form__fields">
              <label><span>{F.name}</span><input name="name" required autoComplete="name" /></label>
              <label><span>{F.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>{F.phone}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label><span>{F.club}</span><input name="club" /></label>
              <label className="px-form__wide"><span>{F.message}</span><textarea name="message" rows={5} required /></label>
              <div className="px-form__send px-form__wide">
                <button type="submit" className="btn btn--solid px-btn">{F.send}</button>
                <p className="px-form__note">{c.formNote}</p>
              </div>
            </div>
            <div className="px-form__done" data-form-done hidden tabIndex={-1} role="status">
              <span className="px-form__tick">{I.check}</span>
              <p>{c.sent}</p>
            </div>
          </div>
        </form>
        <aside className="px-doors">
          <article className="px-sheet px-door" style={css({ '--accent': '#F7A81B', '--i': 1 })} data-rv>
            <span className="px-tile" aria-hidden="true">{I.join}</span>
            <h2>{c.join.title}</h2>
            <p>{c.join.text}</p>
            <a className="btn btn--solid px-btn" href={R.ctas.join.href} target="_blank" rel="noopener">{R.ctas.join.label}</a>
          </article>
          <article className="px-sheet px-door" style={css({ '--accent': '#00ADBB', '--i': 2 })} data-rv>
            <span className="px-tile" aria-hidden="true">{I.pin}</span>
            <h2>{c.finder.title}</h2>
            <p>{c.finder.text}</p>
            <a className="btn btn--line px-btn" href={finder.file}>{finder.title}{I.next}</a>
          </article>
        </aside>
      </div>
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
  return (
    <main id="main" ref={ref} className={`px-inner px-inner--${page}`}>
      {page === 'about' && <span className="px-progress" aria-hidden="true" />}
      {BODY[page]({ year })}
    </main>
  );
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
