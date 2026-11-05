import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { R, reducedMotion } from '../../shared/rotary';
import SpotlightCard from '../../rb/SpotlightCard/SpotlightCard';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { lenis } from '../../shared/smooth';
import { useTheme } from './theme';

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
  return createPortal(
    <a href="#top" className={`totop ${show ? 'is-on' : ''}`} aria-label="Back to top" title="Back to top" onClick={toTop}>
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </a>,
    document.body
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
          <SplitFlapText text={value} charset="0123456789" padTo={value.length} loop={false} fontSize={40} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#062b33" textColor="#FFD27A" tileRadius={10} gap={5} glare={0.4} depth={0.6} className="visits__flap" />
        ) : (
          <span className="visits__ghost">{value}</span>
        )}
      </div>
      <p className="visits__text" aria-hidden="true">{f.visitorsText}</p>
    </div>
  );
}

const TILE = 'M0 40C125 80 375 0 500 40S875 80 1000 40V120H0Z';

/* 8 · Footer: a wide logo card over two link cards, with layers of sea rolling along the bottom. */
export default function Footer() {
  const f = R.footer;
  const theme = useTheme();
  const spot = 'rgba(0, 173, 187, 0.16)';
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
      <div className="sea" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <svg key={i} className={`sea__layer sea__layer--${i}`} viewBox="0 0 2000 120" preserveAspectRatio="none">
            <path d={TILE} /><path d={TILE} transform="translate(1000 0)" />
          </svg>
        ))}
      </div>
      <div className="wrap">
        <div className="fgrid">
          <SpotlightCard className="fcard fcard--brand" spotlightColor={spot} grain={0} theme={theme}>
            <a href="#top" className="foot__logo" onClick={toTop}>
              <img src={theme === 'dark' ? R.brand.logoReversed : R.brand.logo} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="392" height="148" loading="lazy" />
            </a>
            <Visitors />
            <div className="fsocial">
              {f.social.items.map(s => (
                <a key={s.label} href={s.href} {...ext(s.href)} aria-label={s.label} title={s.label}>
                  <span aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" /></svg></span>
                </a>
              ))}
            </div>
          </SpotlightCard>
          {col(ICON.globe, f.rotaryLinks.title, f.rotaryLinks.items)}
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
