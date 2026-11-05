import { useEffect, useMemo } from 'react';
import { R, monogram, type StatDef } from '../../shared/rotary';
import LogoLoop from '../../rb/LogoLoop/LogoLoop';
import { paintNums } from './motion';

type Key = StatDef['key'];
const S = R.snapshot;
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const go = <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" {...sw} /></svg>;
const ICON: Record<Key, React.ReactNode> = {
  projects: <svg viewBox="0 0 24 24" width="24" height="24"><path {...sw} d="M3.500 7.500h6l2 2h9v8.500a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...sw} d="m9 14.500 2 2 4-4" /></svg>,
  hours: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M12 7.500V12l3 2" /></svg>,
  amount: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="12" cy="12" r="8.500" /><path {...sw} d="M9 8h6M9 11h6M13 8c1.700 0 2.500 1.200 2.500 1.500S14.700 11 13 11h-1l4 5" /></svg>,
  beneficiaries: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="9" cy="8.500" r="3" /><path {...sw} d="M3.500 19c.6-3 2.800-4.800 5.500-4.800s4.900 1.800 5.500 4.800" /><circle {...sw} cx="16.500" cy="9.500" r="2.400" /><path {...sw} d="M15.500 14.400c2.600-.3 4.500 1.300 5 4.100" /></svg>,
  clubs: <img src={R.brand.wheel} alt="" width="24" height="24" />,
  members: <svg viewBox="0 0 24 24" width="24" height="24"><circle {...sw} cx="10" cy="8.500" r="3.400" /><path {...sw} d="M3.800 19.500c.7-3.300 3.100-5.200 6.200-5.200 1.600 0 3 .5 4.100 1.400" /><path {...sw} d="M18 13.500v6M15 16.500h6" /></svg>
};

/* A heading whose letters stretch wider with the scroll. Its lines are fixed so that it never rewraps
   while it stretches. */
export function Title({ id, text, className = '' }: { id?: string; text: string; className?: string }) {
  const words = text.split(' ');
  let cut = 1, best = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < best) { best = diff; cut = i; }
  }
  const lines = words.length > 1 ? [words.slice(0, cut).join(' '), words.slice(cut).join(' ')] : words;
  return (
    <h2 id={id} className={`kt ${className}`} aria-label={text}>
      {lines.map((l, i) => <span key={i} className="kt__l" aria-hidden="true">{l}</span>)}
    </h2>
  );
}

const Words = ({ text }: { text: string }) => <>{text.split(' ').map((w, i) => <span key={i} className="w">{w} </span>)}</>;

/* About: the advertisement swings upright on the left while the words light up one by one. */
export function About() {
  const ad = R.hero.ads?.[0];
  const link = R.nav.find(n => n.key === 'about');
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="hold">
        <div className="wrap about__grid">
          {ad && <aside className="about__ad"><img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} /></aside>}
          <div className="about__copy">
            <Title id="about-title" text={`About ${R.site.name}`} />
            <p className="about__lead"><Words text="Clubs and Rotarians across Mumbai and Palghar, serving their own communities." /></p>
            <p className="about__body"><Words text="Club by club, members give their time and skills to projects in their own communities, guided by The Four-Way Test in everything they think, say and do." /></p>
            {link && <a className="btn-go" href={link.href}>Read More{go}</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 4 · District Snapshot: six cells fly in one at a time and lock into a honeycomb. Each number counts
   up with the scroll, and counts back down when you scroll back. */
export function Snapshot({ year }: { year: string }) {
  const v = S.byYear[year];
  const clubs = useMemo(() => R.clubs.list.map(c => ({ node: <span className="clubchip">{c.name}</span>, title: c.name, href: R.clubs.href + c.id })), []);
  useEffect(paintNums, [year]);
  return (
    <section id="snapshot" className="snap" aria-labelledby="snap-title">
      <div className="hold">
        <div className="wrap snap__grid">
          <header className="snap__head">
            <Title id="snap-title" text={S.title} />
            {v.status === 'upcoming' && v.note && <p className="snap__note">{v.note}</p>}
          </header>
          <div className="comb">
            {S.stats.map(d => (
              <article key={d.key} className="hex" aria-label={`${d.label}: ${R.fmt.stat(d, v[d.key])}`}>
                <div className="hex__in">
                  <span className="hex__icon" aria-hidden="true">{ICON[d.key]}</span>
                  <p className="hex__label" aria-hidden="true">{d.label}</p>
                  <p className="hex__num" aria-hidden="true">
                    {d.prefix && <small>{d.prefix}</small>}
                    <span className="hex__n" data-v={v[d.key]} data-d={d.decimals ?? 0}>{v[d.key].toLocaleString('en-IN', { minimumFractionDigits: d.decimals ?? 0, maximumFractionDigits: d.decimals ?? 0 })}</span>
                    {d.suffix && <small> {d.suffix.trim()}</small>}
                  </p>
                  {d.href && <a className="hex__go" href={d.href} target="_blank" rel="noopener" aria-label={`${d.label} (opens the page)`}>{go}</a>}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="clubs">
          <LogoLoop logos={clubs} speed={36} gap={10} logoHeight={32} pauseOnHover ariaLabel="Clubs of District 3141" />
        </div>
      </div>
    </section>
  );
}

/* 5 · Dignitaries: the two portraits travel in from the screen edges and meet in the middle, then
   each one's details slide out beside it. Details share rows, so they line up across the two. */
export function Dignitaries({ year, switching }: { year: string; switching: boolean }) {
  const d = R.dignitaries;
  const set = d.byYear[year];
  return (
    <section id="dignitaries" className="dig" aria-labelledby="dig-title">
      <div className="hold">
        <div className="wrap">
          <Title id="dig-title" text={d.title} className="kt--center" />
          <div className={`duo ${switching ? 'is-switching' : ''}`}>
            {d.order.map(k => {
              const p = set[k];
              return (
                <article key={k} className="dp">
                  <div className="dp__photo"><img src={p.photo?.src ?? monogram(p.name)} alt={p.photo?.alt ?? ''} width="480" height="600" /></div>
                  <p className="dp__t dp__role">{p.role}</p>
                  <h3 className="dp__t dp__name">{p.name}</h3>
                  <p className="dp__t dp__term">{p.term}</p>
                  <p className="dp__t dp__bio">{p.bio}</p>
                  <a className="dp__t btn-go" href={d.links[k]}>{d.readMore}{go}</a>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
