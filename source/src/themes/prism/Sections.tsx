import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { R, monogram, reducedMotion, type StatDef } from '../../shared/rotary';
import CountUp from '../../rb/CountUp/CountUp';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import TiltedCard from '../../rb/TiltedCard/TiltedCard';
import { useTheme } from './theme';

type Key = StatDef['key'];
const ACCENT: Record<Key, string> = { projects: '#0067C8', hours: '#00A2E0', amount: '#F7A81B', beneficiaries: '#D41367', clubs: '#F7A81B', members: '#00ADBB' };
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.5 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M12 7.5V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.7 0 2.5 1.2 2.5 1.5S14.7 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="9" cy="8.5" r="3" /><path {...sw} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...sw} cx="16.5" cy="9.5" r="2.4" /><path {...sw} d="M15.5 14.4c2.6-.3 4.5 1.3 5 4.1" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="22" height="22" />,
  members: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="10" cy="8.5" r="3.4" /><path {...sw} d="M3.8 19.5c.7-3.3 3.1-5.2 6.2-5.2 1.6 0 3 .5 4.1 1.4" /><path {...sw} d="M18 13.5v6M15 16.5h6" /></svg>
};

/* Section title: the last word carries the Prism gradient. */
export function Title({ id, text }: { id: string; text: string }) {
  const i = text.lastIndexOf(' ');
  return (
    <h2 id={id} className="stitle">
      {i > 0 ? <>{text.slice(0, i)} <span className="stitle__hl">{text.slice(i + 1)}</span></> : <span className="stitle__hl">{text}</span>}
    </h2>
  );
}

const useInView = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
};

const Num = ({ def, value, year }: { def: StatDef; value: number; year: string }) => (
  <span aria-hidden="true" className="num">
    {def.prefix && <span className="num__affix">{def.prefix}</span>}
    <CountUp key={year} to={value} decimals={def.decimals ?? 0} separator="," duration={1.6} trigger="view" />
    {def.suffix && <span className="num__affix num__affix--suf">{def.suffix.trim()}</span>}
  </span>
);

/* ---------- 4 · District Snapshot: one featured panel + a ranked list with meters ---------- */
export function Snapshot({ year }: { year: string }) {
  const theme = useTheme();
  const s = R.snapshot;
  const v = s.byYear[year];
  const def = (k: Key) => s.stats.find(x => x.key === k)!;
  const max = (k: Key) => Math.max(...R.years.list.map(y => s.byYear[y][k])) || 1;
  const [ref, inView] = useInView<HTMLDivElement>();
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  const years = R.years.list;
  const p = def('projects');
  const rows: Key[] = ['hours', 'amount', 'beneficiaries', 'members', 'clubs'];
  return (
    <section id="snapshot" className="snap" aria-labelledby="snap-title">
      <div className="wrap">
        <header className="shead">
          {v.status === 'upcoming' && v.note && <p className="eyebrow">{v.note}</p>}
          <Title id="snap-title" text={s.title} />
        </header>

        <div ref={ref} className={`snap__layout ${inView ? 'is-in' : ''}`}>
          <article className="feat">
            <div className="feat__top">
              <span className="feat__icon" aria-hidden="true">{ICON.projects}</span>
              <p className="feat__label">{p.label}</p>
              {p.href && (
                <a className="feat__go" href={p.href} target="_blank" rel="noopener" aria-label={`${p.label} (opens the projects page)`}>
                  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              )}
            </div>
            <p className="feat__num" aria-label={`${p.label}: ${R.fmt.stat(p, v.projects)}`}><Num def={p} value={v.projects} year={year} /></p>
            <div className="feat__bars" aria-hidden="true">
              {years.map((y, i) => {
                const st = s.byYear[y].status;
                return <span key={y} className={`fb ${y === year ? 'is-sel' : ''} ${st === 'upcoming' ? 'is-up' : ''} ${st === 'in-progress' ? 'is-ytd' : ''}`} style={{ ['--h' as string]: Math.max(0.04, s.byYear[y].projects / max('projects')), ['--i' as string]: i }} title={`${y}: ${R.fmt.stat(p, s.byYear[y].projects)}`} />;
              })}
            </div>
            <div className="feat__axis" aria-hidden="true"><span>{years[0]}</span><span>{years[years.length - 1]}</span></div>
          </article>

          <ol className="slist">
            {rows.map((k, i) => {
              const d = def(k);
              const val = v[k];
              return (
                <li key={k} className="srow" style={{ ['--accent' as string]: ACCENT[k], ['--w' as string]: Math.max(0.02, val / max(k)), ['--i' as string]: i }}>
                  <span className="srow__icon" aria-hidden="true">{ICON[k]}</span>
                  <div className="srow__text">
                    <p className="srow__label">{d.label}</p>
                    <p className="srow__num" aria-label={`${d.label}: ${R.fmt.stat(d, val)}`}><Num def={d} value={val} year={year} /></p>
                  </div>
                  <span className="srow__meter" aria-hidden="true"><i /></span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="clubsband">
          <span className="clubsband__label">{def('clubs').label}</span>
          <div className="clubsband__loop">
            <LogoLoop key={theme} logos={clubs} speed={42} gap={10} logoHeight={34} pauseOnHover fadeOut fadeOutColor={theme === 'dark' ? '#0e1628' : '#ffffff'} ariaLabel="Clubs of District 3141" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5 · Dignitaries: both at once, as two wide profile banners in a zig-zag ---------- */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const theme = useTheme();
  const d = R.dignitaries;
  const set = d.byYear[year];
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reducedMotion() || !root.current) return;
    const wheels = root.current.querySelectorAll('.duo__wheel');
    const t = gsap.fromTo(wheels, { rotate: -70 }, { rotate: 110, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, [year, theme]);
  return (
    <section id="dignitaries" ref={root} className="dig" aria-labelledby="dig-title">
      <div className="wrap">
        <header className="shead">
          <Title id="dig-title" text={d.title} />
        </header>
        <div className={`duo ${switching ? 'is-switching' : ''}`}>
          {d.order.map((k, i) => {
            const p = set[k];
            return (
              <article key={`${year}-${k}-${theme}`} className={`duo__row duo__row--${k} ${i % 2 ? 'is-flip' : ''}`}>
                <img className="duo__wheel" src={R.brand.wheel} alt="" aria-hidden="true" width="520" height="520" />
                <div className="duo__photo">
                  <span className="duo__ring" aria-hidden="true" />
                  <TiltedCard
                    imageSrc={p.photo?.src ?? monogram(p.name)}
                    altText={p.photo?.alt ?? ''}
                    captionText=""
                    showTooltip={false}
                    containerHeight="100%"
                    containerWidth="100%"
                    imageHeight="100%"
                    imageWidth="100%"
                    rotateAmplitude={8}
                    scaleOnHover={1.03}
                    radius={26}
                    glare={0.45}
                    shadow={0.55}
                    flipOnClick={false}
                    gyroscope={false}
                    className="duo__card"
                  />
                </div>
                <div className="duo__info">
                  <p className="duo__role">{p.role}</p>
                  <h3 className="duo__name">{p.name}</h3>
                  <p className="duo__term">{p.term}</p>
                  <p className="duo__bio">{p.bio}</p>
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
