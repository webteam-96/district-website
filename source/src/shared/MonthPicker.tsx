import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { monthLabel, parseISO, toISO } from './rotary';
import './month-picker.css';

const chevron = (d: string, size = 16) => <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/* The month in a calendar's bar opens this panel: year arrows, twelve months, "This month" and Close.
   It lives on <body> with position: fixed, so sections that clip their overflow or stack (Cascade,
   Transit, Kinetic) can't cut it off, and it follows its button as the page scrolls.
   Choosing a month keeps the same day number, or the month's last day if it is shorter. */
export default function MonthPicker({ value, today, onPick, children }: { value: Date; today: string; onPick: (iso: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.getFullYear());
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const now = parseISO(today);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btn.current, p = pop.current;
      if (!b || !p) return;
      const r = b.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) { setOpen(false); return; }
      const w = p.offsetWidth, h = p.offsetHeight;
      const below = r.bottom + 8, above = r.top - h - 8;
      const top = below + h <= vh - 8 ? below : above >= 8 ? above : Math.max(8, vh - h - 8);
      p.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8)}px`;
      p.style.top = `${top}px`;
    };
    place();
    (pop.current?.querySelector<HTMLElement>('.mp-m.is-on') ?? pop.current?.querySelector<HTMLElement>('.mp-m'))?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('scroll', place, { passive: true, capture: true });
    window.addEventListener('resize', place);
    document.addEventListener('pointerdown', away);
    return () => {
      window.removeEventListener('scroll', place, { capture: true });
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', away);
    };
  }, [open]);

  const close = () => { setOpen(false); btn.current?.focus({ preventScroll: true }); };
  const choose = (m: number) => {
    const last = new Date(year, m + 1, 0).getDate();
    onPick(toISO(new Date(year, m, Math.min(value.getDate(), last))));
    close();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="mp-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Choose a month"
        onClick={() => { setYear(value.getFullYear()); setOpen(o => !o); }}
      >
        <span>{children}</span>
        <span className="mp-btn__arrow" aria-hidden="true">{chevron('m5 8 5 5 5-5', 14)}</span>
      </button>
      {open && createPortal(
        <div
          ref={pop}
          className="mp-pop"
          role="dialog"
          aria-label="Choose a month"
          onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}
          onBlur={e => { const t = e.relatedTarget as Node | null; if (t && !pop.current?.contains(t) && !btn.current?.contains(t)) setOpen(false); }}
        >
          <div className="mp-year">
            <button type="button" className="mp-step" aria-label="Previous year" onClick={() => setYear(y => y - 1)}>{chevron('M12 4 6 10l6 6')}</button>
            <b aria-live="polite">{year}</b>
            <button type="button" className="mp-step" aria-label="Next year" onClick={() => setYear(y => y + 1)}>{chevron('m8 4 6 6-6 6')}</button>
          </div>
          <div className="mp-grid">
            {Array.from({ length: 12 }, (_, m) => {
              const name = monthLabel(new Date(year, m, 1));
              const on = year === value.getFullYear() && m === value.getMonth();
              const isNow = year === now.getFullYear() && m === now.getMonth();
              return (
                <button key={m} type="button" className={`mp-m ${on ? 'is-on' : ''} ${isNow ? 'is-now' : ''}`} aria-label={name} aria-current={on ? 'date' : undefined} onClick={() => choose(m)}>
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <div className="mp-foot">
            <button type="button" className="mp-now" onClick={() => { onPick(today); close(); }}>This month</button>
            <button type="button" className="mp-close" onClick={close}>Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
