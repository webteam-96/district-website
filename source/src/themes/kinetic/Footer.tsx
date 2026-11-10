import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { lenis } from '../../shared/smooth';
import { STATIC, toBody } from '../../shared/inner';

const ext = (href: string) => (/^https?:/.test(href) && !href.startsWith(R.site.live) ? { target: '_blank', rel: 'noopener' } : {});
/* stopPropagation: Lenis's own anchor handler would otherwise take over the click */
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
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.500 7.500 8 3l4.500 4.500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </a>
  );
}

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
        {STATIC ? <span className="visits__static">{value.split("").map((d, i) => <i key={i}>{d}</i>)}</span> : seen ? <SplitFlapText text={value} charset="0123456789" padTo={value.length} loop={false} fontSize={46} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#4BD2FF" textColor="#0B0E55" tileRadius={10} gap={5} glare={0.1} depth={0.25} className="visits__flap" /> : <span className="visits__ghost">{value}</span>}
      </div>
      <p className="visits__text" aria-hidden="true">{f.visitorsText}</p>
    </div>
  );
}

/* 8 · Footer: logo, links, counter and social icon, above the district's name set across the full
   width. The name stretches from narrow to wide as the page reaches its end. */
export default function Footer() {
  const f = R.footer;
  const col = (title: string, items: { label: string; href: string }[]) => (
    <div className="fcol">
      <h3>{title}</h3>
      <ul>{items.map(i => <li key={i.label}><a href={i.href} {...ext(i.href)}>{i.label}</a></li>)}</ul>
    </div>
  );
  return (
    <footer className="foot">
      <div className="wrap foot__wrap">
        <div className="fmain">
          <a href="#top" className="fbrand" onClick={toTop}><img src={R.brand.logoReversed} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="392" height="148" /></a>
          {col(f.rotaryLinks.title, f.rotaryLinks.items)}
          {col(f.quickLinks.title, f.quickLinks.items)}
          <div className="fside">
            <Visitors />
            <div className="fsocial">
              {f.social.items.map(s => (
                <a key={s.label} href={s.href} {...ext(s.href)} aria-label={s.label} title={s.label}>
                  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.500 21v-7.500h2.600l.4-3h-3V8.600c0-.9.3-1.500 1.600-1.500h1.600V4.400c-.3 0-1.200-.1-2.300-.1-2.300 0-3.900 1.400-3.900 4v2.200H8v3h2.500V21h3z" /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        <p className="mark" aria-hidden="true">District 3141</p>
        <div className="foot__bar">
          {f.copyright && <p>{f.copyright}</p>}
          {f.poweredBy && <p>{f.poweredBy.lead} <b>{f.poweredBy.name}</b></p>}
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
