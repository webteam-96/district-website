import { forwardRef, useEffect, useId, useRef, useState, type AnchorHTMLAttributes, type KeyboardEvent } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import PillNav from '../../rb/PillNav/PillNav';
import StarBorder from '../../rb/StarBorder/StarBorder';
import { useTheme, type Theme } from './theme';

/* Sun / moon switch: the icon shows the theme you'll switch to. */
export function ThemeToggle({ theme, onTheme }: { theme: Theme; onTheme: () => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className={`mode mode--${theme}`} onClick={onTheme} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <svg className="mode__sun" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></svg>
      <svg className="mode__moon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" /></svg>
    </button>
  );
}

/* New tab only for links the content marks external (Optimus Studio, Join, Admin). */
const EXTERNAL = new Set([...R.nav.filter(n => n.external).map(n => n.href), R.ctas.join.href, R.ctas.admin.href]);
const isExternal = (href = '') => EXTERNAL.has(href);

/* ---------- Year selector: button + listbox (↑ ↓ Home End Enter Esc) ---------- */
export function YearSelect({ year, onYear, compact = false }: { year: string; onYear: (y: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(R.years.list.indexOf(year));
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const years = R.years.list;

  useEffect(() => {
    if (!open) return;
    setActive(years.indexOf(year));
    list.current?.focus();
    const off = (e: PointerEvent) => {
      if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open, year, years]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    onYear(years[i]);
    setOpen(false);
    btn.current?.focus();
  };
  const onListKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowDown') setActive(a => Math.min(years.length - 1, a + 1));
    else if (k === 'ArrowUp') setActive(a => Math.max(0, a - 1));
    else if (k === 'Home') setActive(0);
    else if (k === 'End') setActive(years.length - 1);
    else if (k === 'Enter' || k === ' ') choose(active);
    else if (k === 'Escape') { setOpen(false); btn.current?.focus(); }
    else if (k === 'Tab') setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div className={`year ${open ? 'is-open' : ''} ${compact ? 'year--compact' : ''}`}>
      {!compact && <span className="year__label" id={`${id}-l`}>{R.years.label}</span>}
      <button
        ref={btn}
        type="button"
        className="year__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={compact ? undefined : `${id}-l ${id}-b`}
        aria-label={compact ? `${R.years.label}: ${year}` : undefined}
        id={`${id}-b`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}
      >
        <span className="year__value">{year}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul
          ref={list}
          className="year__list"
          role="listbox"
          tabIndex={-1}
          aria-label={R.years.label}
          aria-activedescendant={`${id}-o${active}`}
          onKeyDown={onListKey}
          data-lenis-prevent
        >
          {years.map((y, i) => (
            <li
              key={y}
              id={`${id}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={y === year}
              className={`${i === active ? 'is-active' : ''} ${y === year ? 'is-selected' : ''}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span>{y}</span>
              {y === R.years.current && <em>Current</em>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- 1 · Utility bar ---------- */
export function UtilityBar({ year, onYear, theme, onTheme }: { year: string; onYear: (y: string) => void; theme: Theme; onTheme: () => void }) {
  const c = R.contact;
  return (
    <div className="utility">
      <div className="wrap utility__row">
        <p className="utility__contact" aria-label={c.label}>
          <a href={`mailto:${c.email}`} className="utility__link">
            <span className="utility__full">{c.email}</span>
            <span className="utility__short" aria-hidden="true">Email</span>
          </a>
          <span className="utility__sep" aria-hidden="true" />
          <a href={`tel:${c.tel}`} className="utility__link">{c.phoneDisplay}</a>
        </p>
        <div className="utility__right">
          <YearSelect year={year} onYear={onYear} compact />
        </div>
        <div className="utility__ctas">
          <StarBorder
            as="a"
            href={R.ctas.join.href}
            target="_blank"
            rel="noopener"
            className="btn-join"
            color="#F7A81B"
            trailColor="#FFE3A3"
            duration={5}
            thickness={1.5}
            radius={999}
            hover="brighten"
            backgroundColor="#F7A81B"
            textColor="#1a1200"
          >
            {R.ctas.join.label}
          </StarBorder>
          <a className="btn-ghost" href={R.ctas.admin.href} target="_blank" rel="noopener">
            {R.ctas.admin.label}
          </a>
          <ThemeToggle theme={theme} onTheme={onTheme} />
        </div>
      </div>
    </div>
  );
}

/* ---------- 2 · Header ---------- */
const NavLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(({ href, ...rest }, ref) => (
  <a ref={ref} href={href} {...(isExternal(href) ? { target: '_blank', rel: 'noopener' } : {})} {...rest} />
));
NavLink.displayName = 'NavLink';

export function Header() {
  const theme = useTheme();
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const items = R.nav.map(n => ({
    label: n.external ? `${n.label} ↗` : n.label,
    href: n.href,
    ariaLabel: n.external ? `${n.label} (opens in a new tab)` : undefined
  }));
  return (
    <header className={`header ${stuck ? 'is-stuck' : ''}`}>
      <div className="wrap header__row">
        <h1 className="brand">
          <a href="#top">
            <img src={theme === 'light' ? R.brand.logo : R.brand.logoReversed} alt={R.site.name} width="392" height="148" />
          </a>
        </h1>
        <PillNav
          key={theme}
          items={items}
          activeHref="#top"
          linkComponent={NavLink}
          theme={theme}
          surface="glass"
          itemStyle="plain"
          hoverEffect="fill"
          indicator="dot"
          highlightColor="#F7A81B"
          highlightTextColor="#1a1200"
          size="md"
          ariaLabel="Main"
          className="header__nav"
        />
      </div>
    </header>
  );
}

/* ---------- Preloader: once per session, < 1.2 s, any key/click skips ---------- */
export function Preloader() {
  const seen = (() => { try { return sessionStorage.getItem('ether-intro') === '1'; } catch { return false; } })();
  const [state, setState] = useState<'on' | 'leaving' | 'off'>(seen || reducedMotion() ? 'off' : 'on');
  useEffect(() => {
    if (state !== 'on') return;
    try { sessionStorage.setItem('ether-intro', '1'); } catch { /* private mode */ }
    const leave = () => setState(s => (s === 'on' ? 'leaving' : s));
    const t = window.setTimeout(leave, 950);
    window.addEventListener('keydown', leave, { once: true });
    window.addEventListener('pointerdown', leave, { once: true });
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', leave); window.removeEventListener('pointerdown', leave); };
  }, [state]);
  useEffect(() => {
    if (state !== 'leaving') return;
    const t = window.setTimeout(() => setState('off'), 700);
    return () => window.clearTimeout(t);
  }, [state]);
  if (state === 'off') return null;
  return (
    <div className={`intro ${state === 'leaving' ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="intro__mark">
        <img src={R.brand.wheel} alt="" width="96" height="96" />
        <span>{R.site.name}</span>
      </div>
    </div>
  );
}
