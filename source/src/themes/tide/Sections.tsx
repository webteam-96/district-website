import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { R, monogram, reducedMotion, type StatDef } from '../../shared/rotary';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import { useTheme } from './theme';

type Key = StatDef['key'];
const S = R.snapshot;
const ACCENT: Record<Key, string> = { projects: '#5FD8E3', hours: '#7CC4FF', amount: '#FFC44D', beneficiaries: '#FF8FBC', clubs: '#FFC44D', members: '#5FD8E3' };
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="24" height="24"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.500 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.500V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.700 0 2.500 1.200 2.500 1.500S14.700 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="9" cy="8.500" r="3" /><path {...sw} d="M3.500 19c.6-3 2.800-4.800 5.500-4.800s4.900 1.800 5.500 4.800" /><circle {...sw} cx="16.500" cy="9.500" r="2.400" /><path {...sw} d="M15.500 14.400c2.600-.3 4.500 1.300 5 4.100" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="24" height="24" />,
  members: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="10" cy="8.500" r="3.400" /><path {...sw} d="M3.800 19.500c.7-3.300 3.100-5.200 6.200-5.200 1.600 0 3 .5 4.100 1.400" /><path {...sw} d="M18 13.500v6M15 16.500h6" /></svg>
};

/* The number counts up again each time its card comes back into view. */
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

/* About: a short introduction with the advertisement on the right. */
export function About() {
  const now = S.byYear[R.years.current];
  const ad = R.hero.ads?.[0];
  const link = R.nav.find(n => n.key === 'about');
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__text">
          <h2 id="about-title" className="stitle">About {R.site.name}</h2>
          <p className="about__lead">{R.site.name} brings together {R.fmt.num(now.clubs)} clubs and {R.fmt.num(now.members)} Rotarians across Mumbai and Palghar.</p>
          <p className="about__body">Club by club, members give their time and skills to projects in their own communities, guided by The Four-Way Test in everything they think, say and do.</p>
          {link && <a className="btn-read" href={link.href}>Read More<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></a>}
        </div>
        {ad && <aside className="about__ad"><img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} loading="lazy" /></aside>}
      </div>
    </section>
  );
}

/* 4 · District Snapshot: the row of cards moves sideways as the section scrolls up the screen,
   with no pause, so the section stays only as tall as its content. On phones the row is a swipe. */
export function Snapshot({ year }: { year: string }) {
  const theme = useTheme();
  const v = S.byYear[year];
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  useEffect(() => {
    if (reducedMotion() || !root.current || !track.current) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const el = track.current!;
      const travel = () => Math.max(0, el.scrollWidth - document.documentElement.clientWidth);
      const t = gsap.to(el, { x: () => -travel(), ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'top top+=72', scrub: true, invalidateOnRefresh: true } });
      return () => { t.scrollTrigger?.kill(); t.kill(); gsap.set(el, { clearProps: 'x,transform' }); };
    });
    return () => mm.revert();
  }, []);
  return (
    <section id="snapshot" ref={root} className="rail" aria-labelledby="snap-title">
      <div className="rail__stick">
        <div ref={track} className="rail__track">
          <header className="rail__head">
            {v.status === 'upcoming' && v.note && <p className="rail__note">{v.note}</p>}
            <h2 id="snap-title" className="stitle">{S.title}</h2>
          </header>
          {S.stats.map(d => (
            <article key={d.key} className="panel" style={{ ['--accent' as string]: ACCENT[d.key] }}>
              <div className="panel__top">
                <span className="panel__icon" aria-hidden="true">{ICON[d.key]}</span>
                <p className="panel__label">{d.label}</p>
                {d.href && (
                  <a className="panel__go" href={d.href} target="_blank" rel="noopener" aria-label={`${d.label} (opens the page)`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                )}
              </div>
              <p className="panel__num" aria-label={`${d.label}: ${R.fmt.stat(d, v[d.key])}`}>
                <span aria-hidden="true">
                  {d.prefix && <small>{d.prefix}</small>}
                  <Count d={d} value={v[d.key]} year={year} />
                  {d.suffix && <small className="panel__suf">{d.suffix.trim()}</small>}
                </span>
              </p>
            </article>
          ))}
        </div>
        <div className="rail__clubs">
          <LogoLoop key={theme} logos={clubs} speed={38} gap={10} logoHeight={34} pauseOnHover fadeOut fadeOutColor={theme === 'dark' ? '#031a20' : '#062b33'} ariaLabel="Clubs of District 3141" />
        </div>
      </div>
    </section>
  );
}

/* 5 · Dignitaries: both on one line, a large portrait with a white info card overlapping it.
   The two cards share rows, so role, name, term, bio and button line up across them. */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const d = R.dignitaries;
  const set = d.byYear[year];
  return (
    <section id="dignitaries" className="dig" aria-labelledby="dig-title">
      <div className="wrap">
        <header className="shead"><h2 id="dig-title" className="stitle">{d.title}</h2></header>
        <div className={`people ${switching ? 'is-switching' : ''}`}>
          {d.order.map(k => {
            const p = set[k];
            return (
              <article key={`${year}-${k}`} className="person">
                <div className="person__photo"><img src={p.photo?.src ?? monogram(p.name)} alt={p.photo?.alt ?? ''} width="480" height="600" /></div>
                <div className="person__info">
                  <p className="person__role">{p.role}</p>
                  <h3 className="person__name">{p.name}</h3>
                  <p className="person__term">{p.term}</p>
                  <p className="person__bio">{p.bio}</p>
                  <a className="btn-read" href={d.links[k]}>
                    {d.readMore}
                    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
