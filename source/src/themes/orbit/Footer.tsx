import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import SpotlightCard from '../../rb/SpotlightCard/SpotlightCard';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { lenis } from '../../shared/smooth';
import { useTheme } from './theme';
import { STATIC, toBody } from '../../shared/inner';

const ext = (href: string) => (/^https?:/.test(href) && !href.startsWith(R.site.live) ? { target: '_blank', rel: 'noopener' } : {});
/* stopPropagation: Lenis's own anchor handler would otherwise re-aim at the hero, 84px short of the top */
const toTop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); };

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return toBody(
    <a href="#top" className={`totop ${show ? 'is-on' : ''}`} aria-label="Back to top" title="Back to top" onClick={toTop}>
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </a>
  );
}

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON = {
  globe: <svg viewBox="0 0 24 24" width="20" height="20"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z" /></svg>,
  link: <svg viewBox="0 0 24 24" width="20" height="20"><path {...sw} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path {...sw} d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
};

function Visitors() {
  const f = R.footer;
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const value = String(f.visitors);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="visits" role="group" aria-label={`${R.fmt.num(f.visitors)} ${f.visitorsText}`}>
      <div className="visits__board" aria-hidden="true">
        {seen ? (
          <SplitFlapText text={value} charset="0123456789" padTo={value.length} loop={false} fontSize={38} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#17103f" textColor="#FFD27A" tileRadius={10} gap={5} glare={0.4} depth={0.6} className="visits__flap" />
        ) : (
          <span className={`visits__ghost ${STATIC ? 'visits__ghost--static' : ''}`}>{STATIC ? R.fmt.num(f.visitors) : value}</span>
        )}
      </div>
      <p className="visits__text" aria-hidden="true">{f.visitorsText}</p>
    </div>
  );
}

/* Orbit rings rising from the bottom centre, each with a dot travelling round it. Size in vmax, time in seconds. */
const RINGS = [
  { s: 34, t: 38, c: '#F7A81B', a: 20 },
  { s: 54, t: 56, c: '#FF7DB2', a: 200 },
  { s: 76, t: 74, c: '#7CC4FF', a: 300 },
  { s: 100, t: 96, c: '#F7A81B', a: 120 },
  { s: 128, t: 124, c: '#3DD6E3', a: 330 }
];

/* 8 · Footer: the logo card in the centre, link cards either side, on deep indigo with a gold glow and orbit rings. */
export default function Footer() {
  const f = R.footer;
  const theme = useTheme();
  const spot = theme === 'dark' ? 'rgba(247, 168, 27, 0.14)' : 'rgba(247, 168, 27, 0.16)';
  const col = (icon: React.ReactNode, title: string, items: { label: string; href: string }[]) => (
    <SpotlightCard className="fcard" spotlightColor={spot} grain={0} theme={theme}>
      <div className="fcard__head">
        <span className="fcard__icon" aria-hidden="true">{icon}</span>
        <h3 className="fcard__title">{title}</h3>
      </div>
      <ul className="fcard__links">
        {items.map(i => (
          <li key={i.label}>
            <a href={i.href} {...ext(i.href)}>
              <span>{i.label}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </li>
        ))}
      </ul>
    </SpotlightCard>
  );

  return (
    <footer className="foot">
      <div className="foot__bg" aria-hidden="true">
        {RINGS.map((r, i) => (
          <span key={i} className="foot__ring" style={{ ['--s' as string]: `${r.s}vmax`, ['--a' as string]: `${r.a}deg`, animationDuration: `${r.t}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}>
            <i style={{ background: r.c, boxShadow: `0 0 14px 3px ${r.c}` }} />
          </span>
        ))}
      </div>
      <div className="wrap">
        <div className="fgrid">
          {col(ICON.globe, f.rotaryLinks.title, f.rotaryLinks.items)}
          <SpotlightCard className="fcard fcard--brand" spotlightColor={spot} grain={0} theme={theme}>
            <a href="#top" className="foot__logo" onClick={toTop}>
              <img src={theme === 'dark' ? R.brand.logoReversed : R.brand.logo} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="392" height="148" loading="lazy" className={STATIC ? 'foot__logo-lt' : undefined} />
              {/* static pages: both logos, the stylesheet shows the one for the theme */}
              {STATIC && <img src={R.brand.logoReversed} alt="" width="392" height="148" loading="lazy" className="foot__logo-dk" />}
            </a>
            <Visitors />
            <div className="fsocial">
              {f.social.items.map(s => (
                <a key={s.label} href={s.href} {...ext(s.href)} aria-label={s.label} title={s.label}>
                  <span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" /></svg></span>
                </a>
              ))}
            </div>
          </SpotlightCard>
          {col(ICON.link, f.quickLinks.title, f.quickLinks.items)}
        </div>
        <div className="foot__bar">
          {f.copyright && <p>{f.copyright}</p>}
          {f.poweredBy && <p>{f.poweredBy.lead} <b>{f.poweredBy.name}</b></p>}
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
