import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import Waves from '../../rb/Waves/Waves';
import SpotlightCard from '../../rb/SpotlightCard/SpotlightCard';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { lenis } from '../../shared/smooth';
import { useTheme } from './theme';
import { STATIC, toBody } from '../../shared/inner';

const ext = (href: string) => (/^https?:/.test(href) && !href.startsWith(R.site.live) ? { target: '_blank', rel: 'noopener' } : {});
/* stopPropagation: Lenis's own anchor handler would otherwise re-aim at the hero, 84px short of the top */
const toTop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); };
/* Pinned to the screen's bottom-right corner once the page has been scrolled. Portalled so the footer's stacking context can't trap it. */
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
  link: <svg viewBox="0 0 24 24" width="20" height="20"><path {...sw} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path {...sw} d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  heart: <svg viewBox="0 0 24 24" width="20" height="20"><path {...sw} d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" /></svg>
};

function Visitors() {
  const f = R.footer;
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const value = R.fmt.num(f.visitors);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="visits" role="group" aria-label={`${value} ${f.visitorsText}`}>
      <div className="visits__board" aria-hidden="true">
        {seen ? (
          <SplitFlapText text={value} charset="0123456789," padTo={value.length} loop={false} fontSize={36} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#0b3d91" textColor="#FFD27A" tileRadius={10} gap={5} glare={0.4} depth={0.6} className="visits__flap" />
        ) : (
          <span className={`visits__ghost ${STATIC ? 'is-static' : ''}`}>{value}</span>
        )}
      </div>
      <p className="visits__text" aria-hidden="true"><i className="visits__dot" />{f.visitorsText}</p>
    </div>
  );
}

/* 8 · Footer: link cards over flowing waves and a turning Rotary wheel. */
export default function Footer() {
  const f = R.footer;
  const theme = useTheme();
  const calm = reducedMotion();
  const spot = theme === 'dark' ? 'rgba(46, 168, 255, 0.14)' : 'rgba(0, 103, 200, 0.08)';
  const col = (icon: React.ReactNode, accent: string, title: string, items: { label: string; href: string }[]) => (
    <SpotlightCard className="fcard" spotlightColor={spot} grain={0} theme={theme} style={{ ['--accent' as string]: accent }}>
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
        {!calm && (
          <Waves
            key={theme}
            lineColor="#ffffff"
            accentColor="#FFD27A"
            backgroundColor="transparent"
            lightMode={false}
            mouseInteraction
            rotation={78}
            spacing={24}
            lineWidth={1.3}
            amplitude={42}
            twist={1.2}
            speed={0.55}
          />
        )}
        <img className="foot__wheel" src={R.brand.wheel} alt="" width="640" height="640" />
      </div>
      <div className="wrap">
        <div className="fgrid">
          <SpotlightCard className="fcard fcard--brand" spotlightColor={spot} grain={0} theme={theme} style={{ ['--accent' as string]: '#F7A81B' }}>
            <a href="#top" className="foot__logo" onClick={toTop}>
              <img src={theme === 'dark' ? R.brand.logoReversed : R.brand.logo} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="196" height="74" loading="lazy" />
            </a>
            <Visitors />
          </SpotlightCard>
          {col(ICON.globe, '#0067C8', f.rotaryLinks.title, f.rotaryLinks.items)}
          {col(ICON.link, '#00ADBB', f.quickLinks.title, f.quickLinks.items)}
          <SpotlightCard className="fcard fcard--social" spotlightColor={spot} grain={0} theme={theme} style={{ ['--accent' as string]: '#D41367' }}>
            <div className="fcard__head">
              <span className="fcard__icon" aria-hidden="true">{ICON.heart}</span>
              <h3 className="fcard__title">{f.social.title}</h3>
            </div>
            <div className="fcard__row">
              {f.social.items.map(s => (
                <a key={s.label} href={s.href} {...ext(s.href)} className="fcard__social">
                  <span className="fcard__fb" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" /></svg></span>
                  {s.label}
                </a>
              ))}
            </div>
          </SpotlightCard>
        </div>

        <div className="foot__bar">
          {f.copyright && <p>{f.copyright}</p>}
          {f.poweredBy && <p>{f.poweredBy.lead} <b>{f.poweredBy.name}</b></p>}
        </div>
      </div>
      <p className="foot__mark" aria-hidden="true">District {R.site.district}</p>
      <BackToTop />
    </footer>
  );
}
