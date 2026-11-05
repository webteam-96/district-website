import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { R, monogram, reducedMotion, type StatDef } from '../../shared/rotary';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import { useTheme } from './theme';

type Key = StatDef['key'];
const S = R.snapshot;
const ACCENT: Record<Key, string> = { projects: '#7CC4FF', hours: '#3DD6E3', amount: '#FFC44D', beneficiaries: '#FF7DB2', clubs: '#FFC44D', members: '#3DD6E3' };
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.5 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.7 0 2.5 1.2 2.5 1.5S14.7 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="22" height="22" />,
  members: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="10" cy="8.5" r="3.4" /><path {...sw} d="M3.8 19.5c.7-3.3 3.1-5.2 6.2-5.2 1.6 0 3 .5 4.1 1.4" /><path {...sw} d="M18 13.5v6M15 16.5h6" /></svg>
};

/* 12-year trend: thin columns on one axis, the chosen year in gold. Hover or tap a year to read it. */
function Trend({ def, year }: { def: StatDef; year: string }) {
  const years = R.years.list;
  const max = Math.max(...years.map(y => S.byYear[y][def.key])) || 1;
  const [over, setOver] = useState<string | null>(null);
  return (
    <div className="trend" aria-hidden="true" onPointerLeave={() => setOver(null)}>
      <div className="trend__plot">
        {years.map((y, i) => {
          const d = S.byYear[y];
          return (
            <span key={y} className={`trend__col ${y === year ? 'is-sel' : ''} ${d.status === 'upcoming' ? 'is-up' : ''} ${d.status === 'in-progress' ? 'is-ytd' : ''} ${y === over ? 'is-over' : ''}`} onPointerEnter={() => setOver(y)} style={{ ['--h' as string]: Math.max(0.03, d[def.key] / max), ['--i' as string]: i }}>
              <i />
            </span>
          );
        })}
      </div>
      <p className="trend__read">
        {over ? <><b>{over}</b><b>{R.fmt.stat(def, S.byYear[over][def.key])}</b></> : <><span>{years[0]}</span><span>{years[years.length - 1]}</span></>}
      </p>
    </div>
  );
}

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

/* 4 · District Snapshot: the wheel at the hub, three stat cards on each side. */
export function Snapshot({ year }: { year: string }) {
  const theme = useTheme();
  const v = S.byYear[year];
  const root = useRef<HTMLElement>(null);
  const wheel = useRef<HTMLImageElement>(null);
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  useEffect(() => {
    if (reducedMotion() || !wheel.current) return;
    const t = gsap.fromTo(wheel.current, { rotate: -120 }, { rotate: 240, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, []);
  const card = (d: StatDef, i: number) => (
    <article key={d.key} className="stat" style={{ ['--accent' as string]: ACCENT[d.key], ['--i' as string]: i }}>
      <div className="stat__top">
        <span className="stat__icon" aria-hidden="true">{ICON[d.key]}</span>
        <p className="stat__label">{d.label}</p>
        {d.href && (
          <a className="stat__go" href={d.href} target="_blank" rel="noopener" aria-label={`${d.label} (opens the page)`}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        )}
      </div>
      <p className="stat__num" aria-label={`${d.label}: ${R.fmt.stat(d, v[d.key])}`}>
        <span aria-hidden="true">
          {d.prefix && <small>{d.prefix}</small>}
          <Count d={d} value={v[d.key]} year={year} />
          {d.suffix && <small className="stat__suf">{d.suffix.trim()}</small>}
        </span>
      </p>
      <Trend def={d} year={year} />
    </article>
  );
  return (
    <section id="snapshot" ref={root} className="snap" aria-labelledby="snap-title">
      <div className="wrap">
        <header className="shead shead--center">
          {v.status === 'upcoming' && v.note && <p className="snap__note">{v.note}</p>}
          <h2 id="snap-title" className="stitle">{S.title}</h2>
        </header>
        <div className="orbit">
          <div className="orbit__col">{S.stats.slice(0, 3).map(card)}</div>
          <div className="hub" aria-hidden="true">
            <span className="hub__ring hub__ring--a"><i /></span>
            <span className="hub__ring hub__ring--b"><i /></span>
            <img ref={wheel} className="hub__wheel" src={R.brand.wheel} alt="" width="320" height="320" />
          </div>
          <div className="orbit__col">{S.stats.slice(3).map(card)}</div>
        </div>
        <div className="snap__clubs">
          <LogoLoop key={theme} logos={clubs} speed={38} gap={10} logoHeight={34} pauseOnHover fadeOut fadeOutColor={theme === 'dark' ? '#0c0824' : '#17103f'} ariaLabel="Clubs of District 3141" />
        </div>
      </div>
    </section>
  );
}

/* Text set on a circle, spinning round the portrait. */
function Ring({ id, text }: { id: string; text: string }) {
  const R_ = 92;
  const line = `${text} • `.repeat(text.length < 24 ? 3 : 2);
  return (
    <svg className="orb__ring" viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id={id} d={`M100 ${100 - R_}a${R_} ${R_} 0 1 1 -0.01 0`} /></defs>
      <text><textPath href={`#${id}`} textLength={Math.floor(2 * Math.PI * R_) - 2} lengthAdjust="spacing">{line}</textPath></text>
    </svg>
  );
}

/* 5 · Dignitaries: both together, round portraits in orbit rings, stepped apart. */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const d = R.dignitaries;
  const set = d.byYear[year];
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reducedMotion() || !root.current) return;
    const t = gsap.fromTo(root.current.querySelectorAll('.orb__wheel'), { rotate: -80 }, { rotate: 120, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, [year]);
  return (
    <section id="dignitaries" ref={root} className="dig" aria-labelledby="dig-title">
      <div className="wrap">
        <header className="shead">
          <h2 id="dig-title" className="stitle">{d.title}</h2>
        </header>
        <div className={`orbs ${switching ? 'is-switching' : ''}`}>
          {d.order.map(k => {
            const p = set[k];
            return (
              <article key={`${year}-${k}`} className="orb">
                <div className="orb__art">
                  <span className="wm orb__wheel" aria-hidden="true" style={{ WebkitMaskImage: `url(${R.brand.wheel})`, maskImage: `url(${R.brand.wheel})` }} />
                  <Ring id={`ring-${k}`} text={`${p.role} • ${p.term}`} />
                  <img className="orb__photo" src={p.photo?.src ?? monogram(p.name)} alt={p.photo?.alt ?? ''} width="480" height="600" />
                </div>
                <div className="orb__info">
                  <p className="orb__role">{p.role}</p>
                  <h3 className="orb__name">{p.name}</h3>
                  <p className="orb__term">{p.term}</p>
                  <p className="orb__bio">{p.bio}</p>
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
