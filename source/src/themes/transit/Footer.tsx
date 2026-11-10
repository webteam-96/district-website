import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { lenis } from '../../shared/smooth';
import { isH } from './motion';
import { STATIC } from '../../shared/inner';

const ext = (href: string) => (/^https?:/.test(href) && !href.startsWith(R.site.live) ? { target: '_blank', rel: 'noopener' } : {});
/* stopPropagation: Lenis's own anchor handler would otherwise take over the click */
const toStart = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (lenis) lenis.scrollTo(0); else window.scrollTo({ left: 0, top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); };

function Visitors() {
  const f = R.footer;
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const value = String(f.visitors);
  const side = !STATIC && isH();
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
          <SplitFlapText text={value} charset="0123456789" padTo={value.length} loop={false} fontSize={side ? Math.round(Math.min(72, window.innerWidth * 0.042)) : 54} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#FFC66B" textColor="#0B1437" tileRadius={8} gap={4} glare={0.1} depth={0.25} className="visits__flap" />
        ) : (
          /* static HTML has no flip board script: show the plain number */
          <span className={`visits__ghost ${STATIC ? 'visits__ghost--static' : ''}`}>{value}</span>
        )}
      </div>
      <p className="visits__text" aria-hidden="true">{f.visitorsText}</p>
    </div>
  );
}

/* 8 · Footer (Sample 6): a real project photo behind everything, darkened so the links stay readable.
   Logo and district line, the two link lists, then the counter and social icon on the darkest side. */
export default function Footer() {
  const f = R.footer;
  const list = (title: string, items: { label: string; href: string }[]) => (
    <div className="flist">
      <h3>{title}</h3>
      <ul>{items.map(i => <li key={i.label}><a href={i.href} {...ext(i.href)}>{i.label}</a></li>)}</ul>
    </div>
  );
  return (
    <footer id="contact" className="p foot">
      <img className="foot__photo" src={R.photos.school.src} alt="" />
      <div className="fmain">
        <div className="fbrand">
          <a href="#top" className="foot__logo" onClick={toStart}>
            <img src={R.brand.logoReversed} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="392" height="148" loading="lazy" />
          </a>
          <p className="foot__tag">{f.tagline.lead} <em>{f.tagline.emphasis}</em></p>
        </div>
        {list(f.rotaryLinks.title, f.rotaryLinks.items)}
        {list(f.quickLinks.title, f.quickLinks.items)}
        <div className="fside">
          <Visitors />
          <div className="fsocial">
            {f.social.items.map(s => (
              <a key={s.label} href={s.href} {...ext(s.href)} aria-label={s.label} title={s.label}>
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.500 21v-7.500h2.600l.4-3h-3V8.600c0-.9.3-1.500 1.600-1.500h1.600V4.400c-.3 0-1.200-.1-2.300-.1-2.300 0-3.900 1.400-3.900 4v2.200H8v3h2.500V21h3z" /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="foot__bar">
        {f.copyright && <p>{f.copyright}</p>}
        {f.poweredBy && <p>{f.poweredBy.lead} <b>{f.poweredBy.name}</b></p>}
      </div>
    </footer>
  );
}
