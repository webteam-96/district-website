import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { R, monogram, reducedMotion, type StatDef } from '../../shared/rotary';
import MagicBento, { type MagicBentoItem } from '../../rb/MagicBento/MagicBento';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import ProfileCard from '../../rb/ProfileCard/ProfileCard';
import BlurText from '../../rb/BlurText/BlurText';
import { useTheme } from './theme';

/* ---------- 4 · District Snapshot: a magic bento of six live numbers ---------- */
const ACCENT: Record<StatDef['key'], string> = {
  projects: '#FFD27A', hours: '#2EA8FF', amount: '#F7A81B', beneficiaries: '#FF5C93', clubs: '#F7A81B', members: '#2BD9C5'
};
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON: Record<StatDef['key'], React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.5 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.7 0 2.5 1.2 2.5 1.5S14.7 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="22" height="22" />,
  members: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="10" cy="8.5" r="3.4" /><path {...sw} d="M3.8 19.5c.7-3.3 3.1-5.2 6.2-5.2 1.6 0 3 .5 4.1 1.4" /><path {...sw} d="M18 13.5v6M15 16.5h6" /></svg>
};

/* smooth path through the points (Catmull-Rom → cubic Bézier) */
const smooth = (p: number[][]) => p.reduce((d, pt, i, a) => {
  if (!i) return `M${pt[0]},${pt[1]}`;
  const p0 = a[i - 2] ?? a[i - 1], p1 = a[i - 1], p3 = a[i + 1] ?? pt;
  const c1 = [p1[0] + (pt[0] - p0[0]) / 6, p1[1] + (pt[1] - p0[1]) / 6];
  const c2 = [pt[0] - (p3[0] - p1[0]) / 6, pt[1] - (p3[1] - p1[1]) / 6];
  return `${d} C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${pt[0].toFixed(2)},${pt[1].toFixed(2)}`;
}, '');

/* the stat across the 12 Rotary years; the gold dot marks the selected year */
function Spark({ k, year }: { k: StatDef['key']; year: string }) {
  const years = R.years.list;
  const vals = years.map(y => R.snapshot.byYear[y][k]);
  const max = Math.max(...vals) || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 100, 27 - (v / max) * 23]);
  const line = smooth(pts);
  const si = Math.max(0, years.indexOf(year));
  return (
    <div className="spark" aria-hidden="true">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spark-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L100,30 L0,30 Z`} fill={`url(#spark-${k})`} />
        <path d={line} className="spark__line" fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" pathLength={1} />
      </svg>
      <span className="spark__dot" style={{ left: `${pts[si][0]}%`, top: `${(pts[si][1] / 30) * 100}%` }} />
    </div>
  );
}

function Stat({ def, value, year, big = false, spark = true, children }: { def: StatDef; value: number; year: string; big?: boolean; spark?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`stat stat--${def.key} ${big ? 'stat--big' : ''}`} style={{ ['--accent' as string]: ACCENT[def.key] }}>
      <div className="stat__top">
        <span className="stat__icon" aria-hidden="true">{ICON[def.key]}</span>
        <p className="stat__label">{def.label}</p>
        {def.href && (
          <span className="stat__go" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        )}
      </div>
      <p className="stat__num" aria-label={`${def.label}: ${R.fmt.stat(def, value)}`}>
        <span aria-hidden="true">
          {def.prefix && <span className="stat__affix">{def.prefix}</span>}
          <CountUp key={year} to={value} decimals={def.decimals ?? 0} separator="," duration={1.6} trigger="view" className="stat__digits" />
          {def.suffix && <span className="stat__affix stat__affix--suf">{def.suffix.trim()}</span>}
        </span>
      </p>
      {spark && <Spark k={def.key} year={year} />}
      {children}
    </div>
  );
}

export function Snapshot({ year }: { year: string }) {
  const theme = useTheme();
  const s = R.snapshot;
  const v = s.byYear[year];
  const def = (k: StatDef['key']) => s.stats.find(x => x.key === k)!;
  const clubs = useMemo(
    () => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })),
    []
  );
  const items: MagicBentoItem[] = [
    { id: 'projects', colSpan: 2, rowSpan: 2, href: def('projects').href,
      content: <Stat def={def('projects')} value={v.projects} year={year} big /> },
    { id: 'hours', content: <Stat def={def('hours')} value={v.hours} year={year} /> },
    { id: 'amount', content: <Stat def={def('amount')} value={v.amount} year={year} /> },
    { id: 'beneficiaries', colSpan: 2, content: <Stat def={def('beneficiaries')} value={v.beneficiaries} year={year} /> },
    { id: 'clubs', colSpan: 2,
      content: (
        <Stat def={def('clubs')} value={v.clubs} year={year} spark={false}>
          <div className="stat__loop">
            <LogoLoop key={theme} logos={clubs} speed={38} gap={10} logoHeight={30} pauseOnHover fadeOut fadeOutColor={theme === 'light' ? '#ffffff' : '#0a1530'} ariaLabel="Clubs of District 3141" />
          </div>
        </Stat>
      ) },
    { id: 'members', colSpan: 2, content: <Stat def={def('members')} value={v.members} year={year} /> }
  ];
  return (
    <section id="snapshot" className="snap" aria-labelledby="snap-title">
      <div className="wrap">
        <header className="section-head">
          <div>
            <p className="eyebrow">{v.status === 'upcoming' && v.note ? v.note : `${R.years.label} ${year}${v.note ? ` · ${v.note}` : ''}`}</p>
            <h2 id="snap-title" className="section-title">{s.title}</h2>
          </div>
        </header>
        <MagicBento
          key={theme}
          items={items}
          columns={4}
          rowHeight={196}
          gap={14}
          radius={26}
          theme={theme}
          glowColor={theme === 'light' ? '#0067C8' : '#2EA8FF'}
          enableStars
          particleCount={14}
          enableTilt
          enableMagnetism={false}
          spotlightRadius={340}
          textAutoHide={false}
          className="snap__bento"
        />
      </div>
    </section>
  );
}

/* ---------- 5 · Dignitaries: one stage, mirrored, the Rotary wheel turning between them ---------- */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const theme = useTheme();
  const d = R.dignitaries;
  const set = d.byYear[year];
  const root = useRef<HTMLElement>(null);
  const wheel = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (reducedMotion() || !wheel.current) return;
    const t = gsap.fromTo(wheel.current, { rotate: -90 }, {
      rotate: 90, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
    });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, []);

  return (
    <section id="dignitaries" ref={root} className="dig" aria-labelledby="dig-title">
      <div className="wrap">
        <header className="section-head">
          <div>
            <p className="eyebrow eyebrow--gold">{R.years.label} {year}</p>
            <h2 id="dig-title" className="section-title">{d.title}</h2>
          </div>
        </header>

        <div className={`dig__stage ${switching ? 'is-switching' : ''}`}>
          <div className="dig__core" aria-hidden="true">
            <span className="dig__ring" />
            <img ref={wheel} className="dig__wheel" src={R.brand.wheel} alt="" width="420" height="420" />
          </div>
          {d.order.map(k => {
            const p = set[k];
            return (
              <article key={`${year}-${k}-${theme}`} className={`dig__person dig__person--${k}`}>
                <div className="dig__card">
                  <ProfileCard
                    avatarUrl={p.photo?.src ?? monogram(p.name)}
                    name=""
                    title=""
                    handle=""
                    status={d.label}
                    statusColor="#F7A81B"
                    contactText={d.readMore}
                    contactHref={d.links[k]}
                    theme={theme}
                    holo={0.85}
                    glare={0.55}
                    radius={26}
                    enableTilt
                    tiltStrength={10}
                  />
                </div>
                <div className="dig__text">
                  <p className="dig__role">{p.role}</p>
                  <h3 className="dig__name">{p.name}</h3>
                  <p className="dig__term">{p.term}</p>
                  <BlurText key={`${year}-${k}-bio`} text={p.bio} animateBy="words" delay={16} stepDuration={0.3} className="dig__bio" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
