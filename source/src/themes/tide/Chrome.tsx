import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { R } from '../../shared/rotary';
import { lockScroll } from '../../shared/smooth';
import { ThemeToggle, YearSelect } from '../ether/Chrome';
import { useTheme, type Theme } from './theme';

const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/* 1 · Top strip: contact, year, Join / Admin, theme */
export function TopStrip({ year, onYear, theme, onTheme }: { year: string; onYear: (y: string) => void; theme: Theme; onTheme: () => void }) {
  const c = R.contact;
  return (
    <div className="strip">
      <div className="wrap strip__row">
        <p className="strip__contact" aria-label={c.label}>
          <a href={`mailto:${c.email}`} className="strip__link">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect {...sw} x="3" y="5" width="18" height="14" rx="3" /><path {...sw} d="m4 7 8 6 8-6" /></svg>
            <span className="strip__full">{c.email}</span>
            <span className="strip__short" aria-hidden="true">Email</span>
          </a>
          <a href={`tel:${c.tel}`} className="strip__link">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
            {c.phoneDisplay}
          </a>
        </p>
        <div className="strip__year"><YearSelect year={year} onYear={onYear} compact /></div>
        <div className="strip__ctas">
          <a className="strip__join" href={R.ctas.join.href} target="_blank" rel="noopener"><span>{R.ctas.join.label}</span></a>
          <a className="strip__admin" href={R.ctas.admin.href} target="_blank" rel="noopener">{R.ctas.admin.label}</a>
          <ThemeToggle theme={theme} onTheme={onTheme} />
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const el = ref.current;
    window.setTimeout(() => el?.querySelector<HTMLElement>('.mmenu__close')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !el) return;
      const f = Array.from(el.querySelectorAll<HTMLElement>('a[href],button'));
      const i = f.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => { lockScroll(false); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  return (
    <div ref={ref} id="m-menu" className={`mmenu ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" {...(!open ? { inert: '' } : {})}>
      <span className="mmenu__layer mmenu__layer--1" aria-hidden="true" />
      <span className="mmenu__layer mmenu__layer--2" aria-hidden="true" />
      <div className="mmenu__panel">
        <div className="mmenu__top">
          <img src={R.brand.logoReversed} alt="" width="392" height="148" />
          <button type="button" className="mmenu__close" onClick={onClose}>Close <span aria-hidden="true">✕</span></button>
        </div>
        <ul className="mmenu__list">
          {R.nav.map((n, i) => (
            <li key={n.key} style={{ ['--i' as string]: i }}>
              <a href={n.href} {...(n.external ? { target: '_blank', rel: 'noopener' } : {})} onClick={onClose}>
                {n.label}{n.external && <span aria-hidden="true"> ↗</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* 2 · Header: logo on the left, menu on the right; a wave draws itself under the item you point at. */
export function Header() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setOpen(false); btn.current?.focus(); }, []);
  return (
    <header className="head">
      <div className="wrap head__row">
        <h1 className="head__brand">
          <a href="#top"><img src={theme === 'dark' ? R.brand.logoReversed : R.brand.logo} alt={R.site.name} width="392" height="148" /></a>
        </h1>
        <nav className="head__nav" aria-label="Main">
          <ul>
            {R.nav.map(n => (
              <li key={n.key}>
                <a href={n.href} className={n.current ? 'is-current' : ''} aria-current={n.current ? 'page' : undefined} {...(n.external ? { target: '_blank', rel: 'noopener', 'aria-label': `${n.label} (opens in a new tab)` } : {})}>
                  {n.label}{n.external && <span aria-hidden="true"> ↗</span>}
                  <svg className="head__wave" viewBox="0 0 60 8" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M1 4c5-4 9-4 14.500 0s9 4 14.500 0 9-4 14.500 0 9 4 14.500 0" /></svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button ref={btn} type="button" className="head__menu" aria-expanded={open} aria-controls="m-menu" onClick={() => setOpen(true)}>
          <span>Menu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path {...sw} d="M4 8h16M4 16h16" /></svg>
        </button>
      </div>
      {createPortal(<MobileMenu open={open} onClose={close} />, document.body)}
    </header>
  );
}
