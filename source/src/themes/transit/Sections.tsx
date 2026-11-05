import { useEffect, useMemo, useRef, useState } from 'react';
import { R, monogram, type StatDef } from '../../shared/rotary';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import { useTheme } from './theme';

type Key = StatDef['key'];
const S = R.snapshot;
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const go = <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>;
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M3.500 7.500h6l2 2h9v8.500a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.500 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M12 7.500V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.700 0 2.500 1.200 2.500 1.500S14.700 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="9" cy="8.500" r="3" /><path {...sw} d="M3.500 19c.6-3 2.800-4.800 5.500-4.800s4.900 1.800 5.500 4.800" /><circle {...sw} cx="16.500" cy="9.500" r="2.400" /><path {...sw} d="M15.500 14.400c2.600-.3 4.500 1.300 5 4.100" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="22" height="22" />,
  members: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="10" cy="8.500" r="3.400" /><path {...sw} d="M3.800 19.500c.7-3.300 3.100-5.200 6.200-5.200 1.600 0 3 .5 4.100 1.400" /><path {...sw} d="M18 13.500v6M15 16.500h6" /></svg>
};

/* A heading whose last word is set in italics. */
export const Title = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return i < 0 ? <em>{text}</em> : <>{text.slice(0, i)} <em>{text.slice(i + 1)}</em></>;
};

/* The number counts up again each time it comes back into view. */
function Count({ d, value, year }: { d: StatDef; value: number; year: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisit(n => n + 1); });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <span ref={ref}><CountUp key={`${year}-${visit}`} to={value} decimals={d.decimals ?? 0} separator="," duration={1.6} trigger="view" /></span>;
}

/* About: a short introduction with the advertisement beside it. */
export function About() {
  const now = S.byYear[R.years.current];
  const ad = R.hero.ads?.[0];
  const link = R.nav.find(n => n.key === 'about');
  return (
    <section id="about" className="p about" aria-labelledby="about-title">
      <div className="about__text">
        <h2 id="about-title" className="stitle"><Title text={`About ${R.site.name}`} /></h2>
        <p className="about__lead">{R.site.name} brings together {R.fmt.num(now.clubs)} clubs and {R.fmt.num(now.members)} Rotarians across Mumbai and Palghar.</p>
        <ul className="about__chips">
          <li><b>{R.fmt.num(now.clubs)}</b>Clubs</li>
          <li><b>{R.fmt.num(now.members)}</b>Members</li>
          <li><b>{R.fmt.num(now.projects)}</b>Projects</li>
        </ul>
        <p className="about__body">Club by club, members give their time and skills to projects in their own communities, guided by The Four-Way Test in everything they think, say and do.</p>
        {link && <a className="btn-go" href={link.href}>Read More{go}</a>}
      </div>
      {ad && <aside className="about__ad"><img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} loading="lazy" /></aside>}
    </section>
  );
}

/* 4 · District Snapshot: colour cards of mixed sizes in a bento grid, each with its label above one big number. */
export function Snapshot({ year }: { year: string }) {
  const theme = useTheme();
  const v = S.byYear[year];
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  return (
    <section id="snapshot" className="p snap" aria-labelledby="snap-title">
      <div className="snap__body">
        <header className="snap__head">
          {v.status === 'upcoming' && v.note && <p className="snap__note">{v.note}</p>}
          <h2 id="snap-title" className="stitle"><Title text={S.title} /></h2>
        </header>
        <div className="snap__cols">
          {S.stats.map(d => (
            <article key={d.key} className="scol">
              <div className="scol__top">
                <span className="scol__icon" aria-hidden="true">{ICON[d.key]}</span>
                <p className="scol__label">{d.label}</p>
                {d.href && <a className="scol__go" href={d.href} target="_blank" rel="noopener" aria-label={`${d.label} (opens the page)`}>{go}</a>}
              </div>
              <p className="scol__num" aria-label={`${d.label}: ${R.fmt.stat(d, v[d.key])}`}>
                <span aria-hidden="true">
                  {d.prefix && <small>{d.prefix}</small>}
                  <Count d={d} value={v[d.key]} year={year} />
                  {d.suffix && <small className="scol__suf">{d.suffix.trim()}</small>}
                </span>
              </p>
            </article>
          ))}
        </div>
      </div>
      <div className="snap__clubs">
        <LogoLoop key={theme} logos={clubs} speed={38} gap={8} logoHeight={32} pauseOnHover fadeOut fadeOutColor={theme === 'dark' ? '#0e2260' : '#12337a'} ariaLabel="Clubs of District 3141" />
      </div>
    </section>
  );
}

/* 5 · Dignitaries: both on one line, each a white card with its portrait on a colour block.
   The two boards share rows, so role, name, term, bio and button line up across them. */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const d = R.dignitaries;
  const set = d.byYear[year];
  return (
    <section id="dignitaries" className="p dig" aria-labelledby="dig-title">
      <header className="dig__head"><h2 id="dig-title" className="stitle"><Title text={d.title} /></h2></header>
      <div className={`boards ${switching ? 'is-switching' : ''}`}>
        {d.order.map(k => {
          const p = set[k];
          return (
            <article key={k} className="board">
              <div className="board__photo"><img src={p.photo?.src ?? monogram(p.name)} alt={p.photo?.alt ?? ''} width="480" height="600" /></div>
              <div className="board__info">
                <p className="board__role">{p.role}</p>
                <h3 className="board__name">{p.name}</h3>
                <p className="board__term">{p.term}</p>
                <p className="board__bio" tabIndex={0}>{p.bio}</p>
                <a className="btn-go" href={d.links[k]}>{d.readMore}{go}</a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
