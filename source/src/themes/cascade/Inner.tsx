import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { R, initials, longDate, monthLabel, parseISO, shortDate, toISO, weekdayName, type CalEntry, type Photo } from '../../shared/rotary';
import { startSmoothScroll } from '../../shared/smooth';
import {
  P, pageInfo, useBehaviours, committee, clubs, avenueLabel, projectsOf, totals, num, clubName,
  calMonths, todayMonthKey, monthEntries, typesOf, pressYears, AdminContent, type PageKey, type Project
} from '../../shared/inner';
import {
  D, paras, clubHref, projectHref, eventHref, dignitaryHref, memberHref, memberId, clubIdOf, useDocTitle,
  clubProfile, projectDetail, eventDetail, dignitaryProfile, memberProfile, type Fact
} from '../../shared/detail';
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
  left: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M19 12H6M11 6l-6 6 6 6" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>,
  web: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle {...sw} cx="12" cy="12" r="9" /><path {...sw} d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>,
  gift: <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3 6.5 3.5 7 5.5S10 7 12 7zm0 0c2-4 5.5-3.5 5-1.5S14 7 12 7z" /></svg>,
  heart: <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5S3.5 15.3 3.5 9.3C3.5 6.6 5.6 4.8 8 4.8c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.4 0 4.5 1.8 4.5 4.5 0 6-8.5 11.2-8.5 11.2z" /></svg>
};

/* One pass through the ramp for item i of n things (.ci-t in inner.css turns --i / --of into --tone). */
const tone = (i: number, n: number, more?: CSSProperties) => ({ ['--i' as string]: i, ['--of' as string]: Math.max(1, n - 1), ...more }) as CSSProperties;
const lag = (d: number) => ({ ['--d' as string]: d }) as CSSProperties;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/* ---------- page head: the title and a two-step breadcrumb (Home / page); a plate on the right where the
   page has a key figure or control, a full-width strip under it (Club Service's counters), folder tabs.
   Detail pages pass the item's name as title (and, for now, a meta block). ---------- */
function Head({ k, plate, tabs, strip, mod = '', title, crumb, meta }: {
  k: PageKey; plate?: ReactNode; tabs?: ReactNode; strip?: ReactNode; mod?: string; title?: string; crumb?: string; meta?: ReactNode;
}) {
  const name = title || pageInfo(k).title;
  return (
    <header className={`ci-head ${mod}`} id="top">
      <div className="wrap ci-head__in">
        <div className="ci-head__text" data-rv>
          <h1 className="ci-head__title">{name}</h1>
          {meta}
          <nav className="ci-crumbs" aria-label={P.breadcrumb}>
            <a href={R.nav[0].href}>{P.home}</a><span aria-hidden="true">/</span><span aria-current="page">{crumb || name}</span>
          </nav>
        </div>
        {plate && <div className="ci-head__plate" data-rv style={lag(1)}>{plate}</div>}
      </div>
      {strip && <div className="wrap ci-head__strip" data-rv style={lag(1)}>{strip}</div>}
      {tabs}
    </header>
  );
}

/* ---------- shared parts ---------- */
const Search = ({ label }: { label: string }) => (
  <label className="ci-search">{I.search}<span className="sr-only">{label}</span><input type="search" data-f-search placeholder={label} autoComplete="off" /></label>
);
/* "4 of 18 projects", for screen readers only (the client wants no count in the search bar); it reads right
   for any number the filter writes into data-f-count */
const Count = ({ n, one, many }: { n: number; one: string; many: string }) => (
  <p className="ci-count sr-only" aria-live="polite"><b data-f-count>{n}</b> of {num(n)} {plural(n, one, many)}</p>
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
      <Head k="about" mod="ci-head--about" />
      <section className="ci-sheet ci-desk">
        <div className="wrap">
          <article className="ci-letter" data-rv aria-label={pageInfo('about').title}><AdminContent className="ci-prose" /></article>
        </div>
      </section>
    </>
  );
}

/* ================= District Committee: the Governor on wine, then a folder per committee ================= */
/* a person as a portrait card: the photo (or initials) on an offset block, then name, role, club. href makes the
   name the card's one link; item carries what the page's filter reads; the lead card (the Governor, a club's
   president, the member on their own page) is twice the size; children replace the name there. */
type Face = { name: string; role?: string; club?: string; photo?: Photo | null };
const PCard = ({ m, href, lead, item, children }: { m: Face; href?: string; lead?: boolean; item?: { q: string; group?: string }; children?: ReactNode }) => (
  <li className={`ci-pcard${lead ? ' ci-pcard--lead' : ''}${m.photo ? '' : ' is-bare'}`} {...(item ? { 'data-item': '', 'data-q': item.q, 'data-group': item.group } : {})}>
    <div className="ci-pcard__photo">
      {m.photo
        ? <img src={m.photo.src} alt={lead ? m.photo.alt || m.name : ''} width={m.photo.w} height={m.photo.h} loading={lead ? undefined : 'lazy'} />
        : <span aria-hidden="true">{initials(m.name)}</span>}
    </div>
    <div className="ci-pcard__text">
      {lead && m.role && <p className="ci-pcard__role">{m.role}</p>}
      {children ?? <h3 className="ci-pcard__name">{href ? <a className="ci-cardlink" href={href}>{m.name}</a> : m.name}</h3>}
      {!lead && m.role && <p className="ci-pcard__role">{m.role}</p>}
      {m.club && <p className="ci-pcard__club">{clubName(m.club)}</p>}
    </div>
  </li>
);
/* two rows of cards, then this switch shows the rest (CSS only; a typed search shows every match anyway) */
const ShowAll = ({ id, n }: { id: string; n: number }) => (
  <>
    <input className="ci-all" type="checkbox" id={`ci-all-${id}`} />
    <label className="ci-all-l" htmlFor={`ci-all-${id}`}><span>Show all {num(n)}</span><span>Show fewer</span></label>
  </>
);

function Committee() {
  const C = P.committee;
  const groups = committee();
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  const [exec, ...rest] = groups;
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
            <section className="ci-exec ci-exec--board" data-f-group data-glow aria-labelledby="ci-exec-t">
              <div className="ci-exec__in ci-cap" data-rv>
                <header className="ci-exec__head"><h2 id="ci-exec-t">{exec.title}</h2><b data-f-group-count>{exec.members.length}</b></header>
                <ul className="ci-pgrid ci-pgrid--exec">
                  {exec.members.map((m, i) => <PCard key={m.name + m.role + i} m={m} href={memberHref(m)} lead={i === 0} item={{ q: m.q, group: exec.key }} />)}
                </ul>
                {exec.members.length > 3 && <ShowAll id={exec.key} n={exec.members.length} />}
              </div>
            </section>
          )}

          {/* every other committee: a folder in a pile; the first opens, a search or a chip opens what it needs */}
          <div className="ci-folds">
            {rest.map((g, i) => (
              <section key={g.key} className="ci-fold ci-t" style={tone(i + 1, groups.length)} data-f-group aria-labelledby={`ci-f-${g.key}`}>
                <details className="ci-fold__sw" open={i === 0}>
                  <summary className="ci-fold__tab"><h2 id={`ci-f-${g.key}`}>{g.title}</h2><b data-f-group-count>{g.members.length}</b>{I.chev}</summary>
                </details>
                <div className="ci-fold__body ci-cap">
                  <ul className="ci-pgrid">{g.members.map((m, j) => <PCard key={m.name + m.role + j} m={m} href={memberHref(m)} item={{ q: m.q, group: g.key }} />)}</ul>
                  {g.members.length > 4 && <ShowAll id={g.key} n={g.members.length} />}
                </div>
              </section>
            ))}
          </div>
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
                  /* the club's president and their phone (optional: a club may have neither) */
                  const { president, phone, tel } = c;
                  const dial = tel || phone?.replace(/[^\d+]/g, '');
                  return (
                    <li key={c.id} className="ci-club" data-item data-q={c.q} data-day={day}>
                      {day
                        ? <span className="ci-club__day ci-t" style={tone(di < 0 ? 2 : di, days.length)} aria-hidden="true">{day.slice(0, 3)}</span>
                        : <span className="ci-club__day ci-club__day--none" aria-hidden="true">{c.initials}</span>}
                      <h3 className="ci-club__name"><a href={c.href}><span className="sr-only">Rotary Club of </span>{c.name}{day && <span className="sr-only">, meets on {day}</span>}</a></h3>
                      {president && <p className="ci-club__pres"><span>President</span> {president}</p>}
                      {phone && <p className="ci-club__tel"><a href={`tel:${dial}`}>{I.phone}<span>{phone}</span></a></p>}
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
const newest = (l: Project[]) => [...l].sort((a, b) => b.date.localeCompare(a.date));
const ReadMore = ({ p }: { p: Project }) => (
  <a className="btn-go" href={projectHref(p)}>Read more{I.go}<span className="sr-only">: {p.title}</span></a>
);
/* Share (shared/inner.js: the phone's share sheet, else a menu of WhatsApp, Facebook, X, LinkedIn, Copy link) */
const ShareBtn = ({ url, title }: { url: string; title: string }) => (
  <button type="button" className="ci-share" data-share data-share-url={url} data-share-title={title} aria-haspopup="menu" aria-expanded="false" aria-label={`Share: ${title}`}>{I.share}<span>Share</span></button>
);
/* a photo that opens full size in the shared lightbox (one data-lightbox value = one gallery); a club's initials
   plate, standing in for a missing photo, is not worth enlarging */
const Zoom = ({ ph, group, label, cls = 'ci-zoom', children }: { ph: Photo; group: string; label?: string; cls?: string; children: ReactNode }) => (ph.src.startsWith('data:')
  ? <span className={cls}>{children}</span>
  : <a className={cls} href={ph.src} data-lightbox={group} data-caption={ph.alt} aria-label={label}>{children}</a>);
/* a project card: the photo (it opens full size) rises out of its top edge on an offset block (the ramp, item i
   of n), its rank among the cards shown (a CSS counter: 1 is the newest) on it; Read more, then Share */
const ProjCard = ({ p, i, n }: { p: Project; i: number; n: number }) => (
  <li className="ci-proj" data-item data-q={projQ(p)} data-avenue={p.avenue}>
    <figure className="ci-proj__photo ci-t" style={tone(i % n, n)}>
      <Zoom ph={p.photo} group={`p-${p.id}`}><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></Zoom>
      <figcaption className="ci-pill">{avenueLabel(p.avenue)}</figcaption>
      <span className="ci-proj__no" aria-hidden="true" />
    </figure>
    <h3 className="ci-proj__title">{p.title}</h3>
    <p className="ci-proj__meta">{shortDate(p.date)} · {clubName(p.club)}</p>
    <p className="ci-proj__sum">{p.summary}</p>
    <p className="ci-proj__go"><ReadMore p={p} /><ShareBtn url={projectHref(p)} title={p.title} /></p>
  </li>
);

function Projects() {
  const x = P.projects;
  const list = newest(projectsOf());
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
          <ul className="ci-projs">{list.map((p, i) => <ProjCard key={p.id} p={p} i={i} n={x.pageSize} />)}</ul>
          <Empty text={x.empty} />
          <More label={x.more} />
        </div>
      </section>
    </div>
  );
}

/* ================= Club Service: a pile of project sheets, photo always on the left ================= */
/* five counters in one strip under the title, falling through the ramp; each number counts up */
const Counters = ({ rows }: { rows: [string, string][] }) => (
  <ul className="ci-counters" aria-label="Totals">
    {rows.map(([k, v], i) => <li key={k} className="ci-t" style={tone(i, rows.length)}><b data-count>{v}</b><span>{k}</span></li>)}
  </ul>
);

function Service() {
  const x = P.projects;
  const list = projectsOf('club');
  const L = x.statLabels;
  const t = totals(list);
  return (
    <div className="ci-page" data-filter data-page-size={x.pageSize}>
      <Head k="service" mod="ci-head--strip" strip={<Counters rows={[
        ['Projects', num(t.projects)], ['Clubs Involved', num(new Set(list.map(p => p.club)).size)],
        ['Beneficiaries', num(t.beneficiaries)], ['Volunteer Hours', num(t.hours)], ['Amount Spent', `₹${R.fmt.num(t.amount, 1)} L`]
      ]} />} />
      <section className="ci-sheet ci-sheet--slim">
        <div className="wrap ci-tools" data-rv><Search label={x.searchLabel} /><Count n={list.length} one="project" many="projects" /></div>
      </section>
      <ul className="ci-pile">
        {list.map((p, i) => (
          <li key={p.id} className="ci-story" data-item data-q={projQ(p)} data-avenue={p.avenue}>
            <div className="wrap ci-story__in" data-rv>
              <figure className="ci-story__photo ci-t" style={tone(i % x.pageSize, Math.min(list.length, x.pageSize))}>
                <Zoom ph={p.photo} group={`p-${p.id}`}><img src={p.photo.src} alt={p.photo.alt} width={p.photo.w} height={p.photo.h} loading="lazy" /></Zoom>
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
                <p className="ci-story__go"><ReadMore p={p} /><ShareBtn url={projectHref(p)} title={p.title} /></p>
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

/* a day leaf; month adds "Nov 2026" under the day for lists that run over several months */
const Leaf = ({ d, today, month }: { d: Date; today: boolean; month?: boolean }) => (
  <p className={`ci-leaf${month ? ' ci-leaf--m' : ''}`} {...(today ? { 'aria-current': 'date' as const } : {})}>
    <span>{wd3(d)}</span><b>{d.getDate()}</b>
    {month && <small>{monthLabel(d).slice(0, 3)} {d.getFullYear()}</small>}
    {today && <em className="tag-today">{C.todayTag}</em>}
  </p>
);
/* club and district events open their own page: the title is the row's one link */
const Evt = ({ e, club = true }: { e: CalEntry; club?: boolean }) => {
  const where = [club && e.club && clubName(e.club), e.venue].filter(Boolean).join(' · ');
  return (
    <li className={`evt evt--${e.type} ci-ev`} data-item data-type={e.type}>
      <span className="evt__time">{e.time || '—'}</span>
      <span className="evt__main"><b><a className="ci-evlink" href={eventHref(e)}>{e.title}</a></b>{where && <span>{where}</span>}</span>
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

/* ================= Detail pages: one item each (shared/detail.tsx picks it from the query string) ================= */
const lakh = (n: number) => `₹${R.fmt.num(n, 1)} L`;
const fullClub = (n: string) => (/^rotary\b/i.test(n) ? n : `Rotary Club of ${n}`);
const clubMark = (n: string) => n.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const telOf = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`;
const WEEK = P.finder.days;
const weekdayOf = (d: string) => WEEK.find(w => w.slice(0, 3).toLowerCase() === d.trim().slice(0, 3).toLowerCase()) ?? d.trim();
const byDate = (a: CalEntry, b: CalEntry) => a.date.localeCompare(b.date);

/* figures as small Snapshot stripes, one pass through the ramp; each value counts up */
const Stripes = ({ rows, label }: { rows: [string, string][]; label: string }) => (
  <ul className="ci-totals ci-totals--ramp" aria-label={label}>
    {rows.map(([k, v], i) => <li key={k} className="ci-t" style={tone(i, rows.length)}><span>{k}</span><b data-count>{v}</b></li>)}
  </ul>
);
const Portrait = ({ name, photo }: { name: string; photo?: Photo | null }) => (photo
  ? <img src={photo.src} alt={photo.alt || name} width={photo.w} height={photo.h} />
  : <span aria-hidden="true">{initials(name)}</span>);
const Facts = ({ list, label }: { list: Fact[]; label?: string }) => (
  <dl className="ci-facts" aria-label={label}>{list.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
);
type Reach = { href: string; icon: ReactNode; text: string; ext?: boolean };
const reachOf = (c?: { email?: string; phone?: string; web?: string } | null): Reach[] => {
  const l: Reach[] = [];
  if (c?.email) l.push({ href: `mailto:${c.email}`, icon: I.mail, text: c.email });
  if (c?.phone) l.push({ href: telOf(c.phone), icon: I.phone, text: c.phone });
  if (c?.web) l.push({ href: /^https?:/i.test(c.web) ? c.web : `https://${c.web}`, icon: I.web, text: c.web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), ext: true });
  return l;
};
const ReachList = ({ list }: { list: Reach[] }) => (
  <ul className="ci-reach">{list.map(l => <li key={l.href}><a href={l.href} {...(l.ext ? { target: '_blank', rel: 'noopener' } : {})}>{l.icon}<span>{l.text}</span></a></li>)}</ul>
);
/* the club that ran it: a card that opens the club's profile when the club is known */
const ClubCard = ({ name, id }: { name: string; id: string }) => {
  const inner = <><span className="ci-org__mark" aria-hidden="true">{clubMark(name)}</span><span className="ci-org__name">{fullClub(name)}</span>{id && <span className="ci-org__go" aria-hidden="true">{I.right}</span>}</>;
  return id ? <a className="ci-org__card" href={clubHref(id)}>{inner}</a> : <p className="ci-org__card">{inner}</p>;
};
const Back = ({ href, label }: { href: string; label: string }) => (
  <div className="wrap ci-back"><a className="ci-back__a" href={href}>{I.left}<span>{label}</span></a></div>
);
const Paras = ({ list }: { list: string[] }) => <div className="ci-paras">{list.map((t, i) => <p key={i}>{t}</p>)}</div>;

/* Photos: the cover large on an offset ramp block, the rest as thumbnails under it; every one opens the shared
   lightbox, all of them one gallery (cover first). Twelve thumbnails, then a "show all" switch (CSS only). */
function Gallery({ photos, id, label, style }: { photos: Photo[]; id: string; label: string; style?: CSSProperties }) {
  const [cover, ...rest] = photos;
  const name = (p: Photo, i: number) => p.alt || `${label} ${i + 1}`;
  return (
    <div className={`ci-gal ci-t${rest.length ? '' : ' ci-gal--one'}`} style={style} role="group" aria-label={label} data-rv>
      <figure className={`ci-gal__big${cover.w && cover.h && cover.w < cover.h * 1.2 ? ' is-tall' : ''}`}>
        <Zoom ph={cover} group={id} label={name(cover, 0)} cls="ci-gal__cover"><img src={cover.src} alt={cover.alt} width={cover.w || undefined} height={cover.h || undefined} /></Zoom>
        {cover.alt && <figcaption aria-hidden="true">{cover.alt}</figcaption>}
      </figure>
      {rest.map((p, i) => (
        <Zoom key={p.src + i} ph={p} group={id} label={name(p, i + 1)} cls="ci-gal__thumb"><img src={p.src} alt="" width={p.w || undefined} height={p.h || undefined} loading="lazy" /></Zoom>
      ))}
      {rest.length > 12 && <>
        <input className="ci-gal__all" type="checkbox" id={`${id}-all`} />
        <label className="ci-gal__more" htmlFor={`${id}-all`}><span>Show all {photos.length} photos</span><span>Show fewer photos</span></label>
      </>}
    </div>
  );
}

/* not found: the page's own title, an empty folder that says so, and the way back */
function Missing({ k, parent, text, back }: { k: PageKey; parent?: PageKey; text: string; back: string }) {
  return (
    <>
      <Head k={k} mod="ci-head--item" />
      <section className="ci-sheet ci-miss">
        <div className="wrap">
          <div className="ci-empty ci-miss__box" data-rv>
            <p>{text}</p>
            <a className="btn-go" href={parent ? pageInfo(parent).file : R.nav[0].href}>{I.left}{back}</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Club profile: the glance in the head; the club's details and its board on wine; the roster on the
   desk; projects, newsletters and events in folders standing on the last sheet's edge ---------- */
function ClubPage() {
  const c = clubProfile();
  useDocTitle(c?.name);
  if (!c) return <Missing k="club" parent="finder" text={D.club.missing} back={D.club.back} />;
  const X = D.club, L = P.projects.statLabels, m = c.meeting, g = c.glance;
  const full = fullClub(c.name);
  const day = m.day ? weekdayOf(m.day) : '';
  const when = [day && `Meets on ${day}`, m.time].filter(Boolean).join(' at ');
  const reach = reachOf(c.contact);
  const board = c.leaders.length;
  const evs = [...c.events.filter(e => e.date >= C.today).sort(byDate), ...c.events.filter(e => e.date < C.today).sort(byDate).reverse()];
  const tabs = [
    { key: 'projects', label: X.tabs.projects, n: c.projects.length },
    { key: 'bulletins', label: X.tabs.bulletins, n: c.bulletins.length },
    { key: 'events', label: X.tabs.events, n: evs.length }
  ];
  const open = (tabs.find(t => t.n > 0) ?? tabs[0]).key;
  const panel = (key: string, body: ReactNode, all: ReactNode) => (
    <div className="ci-tpanel ci-cap" data-panel={key} role="tabpanel" aria-label={tabs.find(t => t.key === key)!.label} hidden={open !== key}>{body}{all}</div>
  );
  return (
    <>
      <Head k="club" title={full} mod="ci-head--item"
        plate={<Stripes label={X.glance} rows={[[X.members, num(g.members)], [L.projects, num(g.projects)], [L.beneficiaries, num(g.beneficiaries)], [L.amount, lakh(g.amount)], [L.hours, num(g.hours)]]} />} />

      <section className="ci-sheet ci-clubtop">
        <div className="wrap">
          {(when || m.place || c.details.length > 0 || reach.length > 0) && (
            <section className="ci-cdet" data-rv aria-labelledby="ci-cdet-t">
              <h2 id="ci-cdet-t" className="ci-h3">{X.details}</h2>
              <div className="ci-cdet__row">
                {(when || m.place) && (
                  <div className="ci-meet">
                    {day && <span className="ci-meet__day ci-t" style={tone(Math.max(0, WEEK.indexOf(day)), WEEK.length)} aria-hidden="true">{day.slice(0, 3)}</span>}
                    <p>{when && <b>{when}</b>}{m.place && <span>{m.place}</span>}</p>
                  </div>
                )}
                {c.details.length > 0 && <Facts list={c.details} />}
                {reach.length > 0 && <ReachList list={reach} />}
              </div>
            </section>
          )}
          <section className="ci-exec ci-exec--board" data-glow aria-labelledby="ci-lb-t">
            <div className="ci-exec__in ci-cap" data-rv>
              <header className="ci-exec__head"><h2 id="ci-lb-t">{X.leadership}</h2>{board > 0 && <b>{num(board)}</b>}</header>
              {board
                ? <ul className="ci-pgrid ci-pgrid--exec">{c.leaders.map((l, i) => <PCard key={l.name + i} m={l} lead={i === 0} />)}</ul>
                : <p className="ci-exec__none">{X.none.leaders}</p>}
              {board > 3 && <ShowAll id="board" n={board} />}
            </div>
          </section>
        </div>
      </section>

      {c.members.length > 0 && (
        <section className="ci-sheet ci-desk ci-roll" data-filter aria-labelledby="ci-roll-t">
          <div className="wrap ci-cap">
            <div className="ci-roll__head" data-rv>
              <h2 id="ci-roll-t" className="ci-h2">{X.members} <span className="ci-h2__n">{num(c.members.length)}</span></h2>
              <Search label={X.searchLabel} />
              <Count n={c.members.length} one="member" many="members" />
            </div>
            <ul className="ci-pgrid ci-pgrid--roll">
              {c.members.map((p, i) => <PCard key={p.name + i} m={{ name: p.name, role: p.role, photo: p.photo }} item={{ q: `${p.name} ${p.role}`.toLowerCase() }} />)}
            </ul>
            <Empty text={X.empty} />
            {c.members.length > 4 && <ShowAll id="roll" n={c.members.length} />}
          </div>
        </section>
      )}

      <section className="ci-sheet ci-tabsheet" data-tabs>
        <div className="wrap ci-tabs ci-tabs--press ci-tabs--sheet" role="tablist" aria-label={full} data-lenis-prevent>
          {tabs.map((t, i) => (
            <button key={t.key} type="button" role="tab" className={`ci-tab ci-t${t.key === open ? ' is-on' : ''}`} style={tone(i, tabs.length)} data-tab={t.key} aria-selected={t.key === open} tabIndex={t.key === open ? 0 : -1}>
              {t.label}<b>{num(t.n)}</b>
            </button>
          ))}
        </div>
        <div className="wrap">
          {panel('projects', c.projects.length
            ? <ul className="ci-projs">{newest(c.projects).map((p, i) => <ProjCard key={p.id} p={p} i={i} n={6} />)}</ul>
            : <p className="ci-empty">{X.none.projects}</p>, c.projects.length > 3 && <ShowAll id="projects" n={c.projects.length} />)}
          {panel('bulletins', c.bulletins.length
            ? <ul className="ci-stack">{c.bulletins.map((b, i) => <Strip key={b.title + i} n={i} title={b.title} date={b.date} pdf={b.pdf} />)}</ul>
            : <p className="ci-empty">{X.none.bulletins}</p>, c.bulletins.length > 3 && <ShowAll id="bulletins" n={c.bulletins.length} />)}
          {panel('events', evs.length
            ? <div className="ci-evlist">{evs.map((e, i) => (
                <div key={e.date + i} className="ci-eday">
                  <Leaf d={parseISO(e.date)} today={e.date === C.today} month />
                  <ul className="ci-evts"><Evt e={e} club={false} /></ul>
                </div>))}</div>
            : <p className="ci-empty">{X.none.events}</p>, evs.length > 3 && <ShowAll id="events" n={evs.length} />)}
        </div>
        <Back href={pageInfo('finder').file} label={X.back} />
      </section>
    </>
  );
}

/* ---------- Project: its figures in the head; the photos on the left, the facts, the story and the club on the right ---------- */
function ProjectPage() {
  const p = projectDetail();
  useDocTitle(p?.title);
  if (!p) return <Missing k="project" parent="projects" text={D.project.missing} back={D.project.back} />;
  const X = D.project, L = P.projects.statLabels;
  const list: PageKey = p.avenue === 'club' ? 'service' : 'projects';
  const av = P.projects.avenues;
  const ai = Math.max(0, av.findIndex(a => a.key === p.avenue));
  const figs: [string, string][] = [[L.beneficiaries, num(p.beneficiaries)], [L.amount, lakh(p.amount)], [L.hours, num(p.hours)]];
  if (p.rotarians != null) figs.push(['Rotarians', num(p.rotarians)]);
  const text = paras(p.description || p.summary);
  const facts: Fact[] = [{ label: 'Date', value: longDate(parseISO(p.date)) }, { label: 'Avenue', value: avenueLabel(p.avenue) }];
  if (p.location) facts.push({ label: 'Location', value: p.location });
  if (p.focus) facts.push({ label: 'Area of focus', value: p.focus });
  const gal = (p.gallery ?? []).filter(x => x?.src);
  return (
    <>
      <Head k="project" title={p.title} mod="ci-head--item" plate={<Stripes rows={figs} label={X.figures} />} />
      <section className="ci-sheet ci-item">
        <div className={`wrap ci-split${gal.length ? '' : ' ci-split--solo'}`}>
          {gal.length > 0 && <Gallery photos={gal} id={`p-${p.id}`} label={X.gallery} style={tone(ai, av.length)} />}
          <div className="ci-split__text">
            <Facts list={facts} />
            <p className="ci-split__share"><ShareBtn url={projectHref(p)} title={p.title} /></p>
            {text.length > 0 && (
              <section className="ci-about" data-rv aria-labelledby="ci-about-t">
                <h2 id="ci-about-t" className="ci-h2">{X.about}</h2>
                <Paras list={text} />
              </section>
            )}
            {p.club && (
              <section className="ci-org" data-rv style={lag(1)} aria-labelledby="ci-org-t">
                <h2 id="ci-org-t" className="ci-h3">{X.organiser}</h2>
                <ClubCard name={p.club} id={p.clubId} />
              </section>
            )}
          </div>
        </div>
        <Back href={pageInfo(list).file} label={X.back} />
      </section>
    </>
  );
}

/* ---------- Event: the story and its photos beside a ticket whose top is the day's page from the pad ---------- */
function EventPage() {
  const e = eventDetail();
  useDocTitle(e?.title);
  if (!e) return <Missing k="event" parent="calendar" text={D.event.missing} back={D.event.back} />;
  const X = D.event;
  const d = parseISO(e.date);
  const now = e.date === C.today;
  const text = paras(e.description);
  const gal = (e.gallery ?? []).filter(x => x?.src);
  const reach = reachOf(e.contact);
  /* with photos: the story and photos beside the ticket; without: one wide ticket that holds the story too */
  const about = text.length > 0 && (
    <section className="ci-about" aria-labelledby="ci-about-t"><h2 id="ci-about-t" className="ci-h2">{X.about}</h2><Paras list={text} /></section>
  );
  return (
    <>
      <Head k="event" title={e.title} mod="ci-head--item" />
      <section className="ci-sheet ci-item">
        <div className={`wrap ci-evd${gal.length ? '' : ' ci-evd--solo'}`}>
          {gal.length > 0 && (<div className="ci-evd__main" data-rv>{about}<Gallery photos={gal} id={`e-${e.id}`} label={D.project.gallery} style={tone(e.kind === 'club' ? 1 : 3, 5)} /></div>)}
          <aside className={`ci-ticket${now ? ' is-today' : ''}`} data-rv style={lag(1)} aria-label={e.title}>
            <p className="ci-ticket__pad" aria-label={longDate(d)}>
              <span className="ci-ticket__month">{monthLabel(d)}</span>
              <b className="ci-ticket__day" {...(now ? { 'aria-current': 'date' as const } : {})}>{d.getDate()}</b>
              <span className="ci-ticket__wd">{weekdayName(d)}{now && <em className="tag-today">{C.todayTag}</em>}</span>
            </p>
            <div className="ci-ticket__body">
              <p className="ci-ticket__kind">
                <span className="ci-kindtag"><i className={`dot dot--${e.kind}`} aria-hidden="true" />{typeLabel(e.kind)}</span>
                {e.time && <span className={`ci-time evt--${e.kind}`}>{e.time}</span>}
              </p>
              {!gal.length && about}
              {(e.venue || e.club || e.contact?.name || reach.length > 0) && (
                <dl className="ci-ticket__dl">
                  {e.venue && <div><dt>{X.where}</dt><dd>{e.venue}</dd></div>}
                  {e.club && <div><dt>{X.organiser}</dt><dd><ClubCard name={e.club} id={e.clubId} /></dd></div>}
                  {(e.contact?.name || reach.length > 0) && (
                    <div><dt>{X.contact}</dt><dd className="ci-ticket__who">{e.contact?.name && <b>{e.contact.name}</b>}{reach.length > 0 && <ReachList list={reach} />}</dd></div>
                  )}
                </dl>
              )}
              {e.registration && <a className="btn-go ci-ticket__go" href={e.registration} target="_blank" rel="noopener">{X.register}{I.go}</a>}
            </div>
          </aside>
        </div>
        <Back href={pageInfo('calendar').file} label={X.back} />
      </section>
    </>
  );
}

/* ---------- Dignitary: the homepage's white card on wine, at page scale; the other dignitary one click away ---------- */
function DignitaryPage() {
  const d = dignitaryProfile();
  useDocTitle(d?.name);
  if (!d) return <Missing k="dignitary" text={D.dignitary.missing} back={D.dignitary.back} />;
  const X = D.dignitary;
  const ot = d.type === 'dg' ? 'president' : 'dg';
  /* live, the page loads only this dignitary: the other is offered by role alone, never with the sample's person */
  const o = D.dignitary.item ? null : R.dignitaries.byYear[R.years.current]?.[ot];
  const oRole = o?.role ?? (ot === 'dg' ? 'District Governor' : 'President');
  const bio = paras(d.bio);
  const reach = reachOf(d.contact);
  return (
    <>
      <Head k="dignitary" title={d.name} mod="ci-head--item" />
      <section className="ci-sheet ci-wine" data-glow>
        <div className="wrap">
          <article className={`ci-vcard ci-vcard--${d.type}${bio.length || d.facts.length || reach.length ? '' : ' ci-vcard--short'}`} data-rv aria-label={d.name}>
            <div className="ci-vcard__side">
              <div className="ci-vcard__photo"><Portrait name={d.name} photo={d.photo} /></div>
              <p className="ci-vcard__role"><b>{d.role}</b>{d.term && <span>{d.term}</span>}</p>
              {o?.name !== d.name && (
                <a className={`ci-other ci-other--${ot}${o ? '' : ' ci-other--bare'}`} href={dignitaryHref(ot)}>
                  {o && <span className="ci-other__photo"><Portrait name={o.name} photo={o.photo} /></span>}
                  <span className="ci-other__text"><span>{oRole}</span>{o && <b>{o.name}</b>}</span>
                  <span className="ci-other__go" aria-hidden="true">{I.right}</span>
                </a>
              )}
            </div>
            {/* the story, then the Rotary details and the contact, so a one-line biography still fills the card */}
            {(bio.length > 0 || d.facts.length > 0 || reach.length > 0) && (
              <div className="ci-vcard__main">
                {bio.length > 0 && <section className="ci-vcard__bio" aria-labelledby="ci-bio-t"><h2 id="ci-bio-t" className="ci-h2">{X.bio}</h2><Paras list={bio} /></section>}
                {d.facts.length > 0 && <section className="ci-vcard__more" aria-labelledby="ci-facts-t"><h2 id="ci-facts-t" className="ci-h3">{X.details}</h2><Facts list={d.facts} /></section>}
                {reach.length > 0 && <section className="ci-vcard__more" aria-labelledby="ci-reach-t"><h2 id="ci-reach-t" className="ci-h3">{X.contact}</h2><ReachList list={reach} /></section>}
              </div>
            )}
          </article>
        </div>
        <Back href={R.nav[0].href} label={X.back} />
      </section>
    </>
  );
}

/* ---------- Member: their portrait leads their committee's wine block, the rest of the committee beside it ---------- */
function MemberPage() {
  const m = memberProfile();
  useDocTitle(m?.name);
  if (!m) return <Missing k="member" parent="committee" text={D.member.missing} back={D.member.back} />;
  const X = D.member;
  const g = committee().find(x => x.title === m.group);
  const others = g ? g.members.filter(x => memberId(x) !== m.id) : [];
  const cid = clubIdOf(m.club);
  return (
    <>
      <Head k="member" title={m.name} mod="ci-head--item" />
      <section className="ci-sheet ci-mem-d">
        <div className="wrap">
          <section className={`ci-exec ci-exec--board ci-exec--me${others.length ? '' : ' ci-exec--solo'}`} data-glow aria-label={m.group || m.name}>
            <div className="ci-exec__in ci-cap" data-rv>
              {m.group && <header className="ci-exec__head"><h2>{m.group}</h2>{g && <b>{num(g.members.length)}</b>}</header>}
              <ul className="ci-pgrid ci-pgrid--me">
                <PCard m={{ name: m.name, role: m.role, photo: m.photo }} lead>
                  <p className="ci-pcard__name">{m.name}</p>
                  {(m.club || m.email) && (
                    <dl className="ci-facts">
                      {m.club && <div><dt>{X.club}</dt><dd>{cid ? <a className="ci-link" href={clubHref(cid)}>{fullClub(m.club)}{I.right}</a> : fullClub(m.club)}</dd></div>}
                      {m.email && <div><dt>{X.email}</dt><dd><a className="ci-link" href={`mailto:${m.email}`}>{m.email}</a></dd></div>}
                    </dl>
                  )}
                </PCard>
                {others.map((p, i) => <PCard key={p.name + p.role + i} m={p} href={memberHref(p)} />)}
              </ul>
              {g && others.length > 2 && <ShowAll id="peers" n={g.members.length} />}
            </div>
          </section>
        </div>
        <Back href={pageInfo('committee').file} label={X.back} />
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
  contact: () => <Contact />,
  club: () => <ClubPage />,
  project: () => <ProjectPage />,
  event: () => <EventPage />,
  dignitary: () => <DignitaryPage />,
  member: () => <MemberPage />
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
