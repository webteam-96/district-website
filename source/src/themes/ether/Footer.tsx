import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import Threads from '../../rb/Threads/Threads';
import MagicBento, { type MagicBentoItem } from '../../rb/MagicBento/MagicBento';
import SplitFlapText from '../../rb/SplitFlapText/SplitFlapText';
import { scrollToId } from '../../shared/smooth';
import { useTheme } from './theme';

/* Rotary-wide links and social open in a new tab; the district's own pages do not. */
const ext = (href: string) => (/^https?:/.test(href) && !href.startsWith(R.site.live) ? { target: '_blank', rel: 'noopener' } : {});
const toTop = (e: React.MouseEvent) => { e.preventDefault(); scrollToId('top'); };
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICON = {
  globe: <svg viewBox="0 0 24 24" width="22" height="22"><circle {...sw} cx="12" cy="12" r="8.5" /><path {...sw} d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z" /></svg>,
  link: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path {...sw} d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  heart: <svg viewBox="0 0 24 24" width="22" height="22"><path {...sw} d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" /></svg>
};

/* Visitor counter: an airport-style split-flap board that flips in when it scrolls into view. */
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
          <SplitFlapText text={value} charset="0123456789," padTo={value.length} loop={false} fontSize={38} flipDuration={0.09} stagger={0.08} flipsPerChar={10} tileColor="#0b1736" textColor="#FFD27A" tileRadius={9} gap={5} glare={0.35} depth={0.6} className="visits__flap" />
        ) : (
          <span className="visits__ghost">{value}</span>
        )}
      </div>
      <p className="visits__text" aria-hidden="true"><i className="foot__live" />{f.visitorsText}</p>
    </div>
  );
}

/* One footer card: icon chip + label on top, content below; same language as the snapshot cards. */
function Card({ icon, label, accent, children }: { icon: React.ReactNode; label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="fcard" style={{ ['--accent' as string]: accent }}>
      <div className="stat__top">
        <span className="stat__icon" aria-hidden="true">{icon}</span>
        <h3 className="stat__label">{label}</h3>
      </div>
      <div className="fcard__body">{children}</div>
    </div>
  );
}

/* 8 · Footer: four glowing cards (district + visitors, Rotary links, quick links, social),
   then the legal line and a District 3141 wordmark. */
export default function Footer() {
  const f = R.footer;
  const theme = useTheme();
  const [cols, setCols] = useState(() => (window.innerWidth < 600 ? 1 : window.innerWidth < 1000 ? 2 : 4));
  useEffect(() => {
    const on = () => setCols(window.innerWidth < 600 ? 1 : window.innerWidth < 1000 ? 2 : 4);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const links = (items: { label: string; href: string }[]) => (
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
  );

  const items: MagicBentoItem[] = [
    {
      id: 'brand',
      content: (
        <div className="fcard fcard--brand" style={{ ['--accent' as string]: '#F7A81B' }}>
          <a href="#top" className="foot__logo" onClick={toTop}>
            <img src={theme === 'light' ? R.brand.logo : R.brand.logoReversed} alt={`${R.brand.logoAlt} — ${R.site.name}`} width="196" height="74" loading="lazy" />
          </a>
          <Visitors />
        </div>
      )
    },
    { id: 'rotary', content: <Card icon={ICON.globe} label={f.rotaryLinks.title} accent="#2EA8FF">{links(f.rotaryLinks.items)}</Card> },
    { id: 'quick', content: <Card icon={ICON.link} label={f.quickLinks.title} accent="#2BD9C5">{links(f.quickLinks.items)}</Card> },
    {
      id: 'social',
      content: (
        <Card icon={ICON.heart} label={f.social.title} accent="#FF5C93">
          <ul className="fcard__links">
            {f.social.items.map(s => (
              <li key={s.label}>
                <a href={s.href} {...ext(s.href)} className="foot__social">
                  <span className="foot__fb" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" /></svg>
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )
    }
  ];

  return (
    <footer className="foot">
      <div className="foot__bg" aria-hidden="true">
        {!reducedMotion() && (
          <Threads
            key={theme}
            color={theme === 'light' ? '#F0A000' : '#F7A81B'}
            accentColor={theme === 'light' ? '#0067C8' : '#7FD0FF'}
            amplitude={1.3}
            distance={0.3}
            enableMouseInteraction
            opacity={theme === 'light' ? 0.55 : 0.75}
          />
        )}
        <img className="foot__wheel" src={R.brand.wheel} alt="" width="640" height="640" />
      </div>
      <div className="wrap">
        <MagicBento
          key={theme}
          items={items}
          columns={cols}
          rowHeight={cols === 1 ? 140 : 258}
          gap={14}
          radius={26}
          theme={theme}
          glowColor={theme === 'light' ? '#0067C8' : '#2EA8FF'}
          enableStars
          particleCount={10}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={false}
          spotlightRadius={320}
          textAutoHide={false}
          className="foot__bento"
        />

        <div className="foot__bar">
          {f.copyright && <p>{f.copyright}</p>}
          {f.poweredBy && <p>{f.poweredBy.lead} <b>{f.poweredBy.name}</b></p>}
          <a href="#top" className="foot__top" onClick={toTop}>
            Back to top
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
      <p className="foot__mark" aria-hidden="true">District {R.site.district}</p>
    </footer>
  );
}
