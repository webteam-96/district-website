import { useCallback, useMemo, useRef, useState } from 'react';
import { R, monogram, type StatDef } from '../../shared/rotary';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import { useOnReveal } from './motion';

type Key = StatDef['key'];
const S = R.snapshot;
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const go = <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>;
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="24" height="24"><path {...sw} d="M3.500 7.500h6l2 2h9v8.500a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.500 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M12 7.500V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.700 0 2.500 1.200 2.500 1.500S14.700 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="9" cy="8.500" r="3" /><path {...sw} d="M3.500 19c.6-3 2.800-4.800 5.500-4.800s4.900 1.800 5.500 4.800" /><circle {...sw} cx="16.500" cy="9.500" r="2.400" /><path {...sw} d="M15.500 14.400c2.600-.3 4.500 1.300 5 4.100" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="24" height="24" />,
  members: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="10" cy="8.500" r="3.400" /><path {...sw} d="M3.800 19.500c.7-3.300 3.100-5.200 6.200-5.200 1.600 0 3 .5 4.100 1.400" /><path {...sw} d="M18 13.500v6M15 16.500h6" /></svg>
};

/* The number counts up again each time its stripe plays its entrance. */
function Count({ d, value, year }: { d: StatDef; value: number; year: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visit, setVisit] = useState(0);
  useOnReveal(ref, useCallback(() => setVisit(n => n + 1), []));
  return <span ref={ref}><CountUp key={`${year}-${visit}`} to={value} decimals={d.decimals ?? 0} separator="," duration={1.5} trigger="view" /></span>;
}

/* About: a coral panel with the introduction and two big numbers, then the advertisement as a
   large poster on a panel of its own colour, so it has no visible edge. A slant joins the two. */
export function About() {
  const now = S.byYear[R.years.current];
  const ad = R.hero.ads?.[0];
  const link = R.nav.find(n => n.key === 'about');
  const year = R.years.current;
  const nums = (['clubs', 'members'] as Key[]).map(k => S.stats.find(d => d.key === k)!);
  return (
    <section id="about" className="sheet about" aria-labelledby="about-title">
      <div className="sheet__in">
        <div className="about__grid">
          <div className="about__text">
            <h2 id="about-title" className="stitle">About {R.site.name}</h2>
            <p className="about__lead">Clubs and Rotarians across Mumbai and Palghar, serving their own communities.</p>
            <ul className="about__nums">
              {nums.map(d => (
                <li key={d.key}>
                  <b aria-hidden="true"><Count d={d} value={now[d.key]} year={year} /></b>
                  <span aria-hidden="true">{d.label}</span>
                  <span className="sr-only">{R.fmt.stat(d, now[d.key])} {d.label}</span>
                </li>
              ))}
            </ul>
            <p className="about__body">Club by club, members give their time and skills to projects in their own communities, guided by The Four-Way Test in everything they think, say and do.</p>
            {link && <a className="btn-go" href={link.href}>Read More{go}</a>}
          </div>
          {ad && <aside className="about__ad"><img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} loading="lazy" /></aside>}
        </div>
      </div>
    </section>
  );
}

/* 4 · District Snapshot: six full-width colour stripes, each with its label on the left and a big
   number on the right. They slide in from alternate sides. */
export function Snapshot({ year }: { year: string }) {
  const v = S.byYear[year];
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  return (
    <section id="snapshot" className="sheet snap" aria-labelledby="snap-title">
      <div className="sheet__in">
        <header className="wrap snap__head">
          <h2 id="snap-title" className="stitle">{S.title}</h2>
          {v.status === 'upcoming' && v.note && <p className="snap__note">{v.note}</p>}
        </header>
        <div className="stripes">
          {S.stats.map(d => (
            <article key={d.key} className="stripe">
              <div className="stripe__row">
                <div className="stripe__top">
                  <span className="stripe__icon" aria-hidden="true">{ICON[d.key]}</span>
                  <p className="stripe__label">{d.label}</p>
                  {d.href && <a className="stripe__go" href={d.href} target="_blank" rel="noopener" aria-label={`${d.label} (opens the page)`}>{go}</a>}
                </div>
                <p className="stripe__num" aria-label={`${d.label}: ${R.fmt.stat(d, v[d.key])}`}>
                  <span aria-hidden="true">
                    {d.prefix && <small>{d.prefix}</small>}
                    <Count d={d} value={v[d.key]} year={year} />
                    {d.suffix && <small className="stripe__suf">{d.suffix.trim()}</small>}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="clubs">
          <LogoLoop logos={clubs} speed={36} gap={10} logoHeight={32} pauseOnHover ariaLabel="Clubs of District 3141" />
        </div>
      </div>
    </section>
  );
}

/* 5 · Dignitaries: both on one line on deep teal. Each is a white card with the portrait rising out
   of its top edge on a colour block. The cards share rows, so role, name, term, bio and button line up. */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const d = R.dignitaries;
  const set = d.byYear[year];
  return (
    <section id="dignitaries" className="sheet dig" aria-labelledby="dig-title">
      <div className="sheet__in">
        <div className="wrap">
          <h2 id="dig-title" className="stitle dig__title">{d.title}</h2>
          <div className={`vips ${switching ? 'is-switching' : ''}`}>
            {d.order.map(k => {
              const p = set[k];
              return (
                <article key={k} className="vip">
                  <div className="vip__photo"><img src={p.photo?.src ?? monogram(p.name)} alt={p.photo?.alt ?? ''} width="480" height="600" /></div>
                  <p className="vip__role">{p.role}</p>
                  <h3 className="vip__name">{p.name}</h3>
                  <p className="vip__term">{p.term}</p>
                  <p className="vip__bio">{p.bio}</p>
                  <a className="btn-go" href={d.links[k]}>{d.readMore}{go}</a>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
