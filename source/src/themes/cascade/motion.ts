import { useEffect, useLayoutEffect } from 'react';
import { reducedMotion } from '../../shared/rotary';

const TARGETS: [string, 'up' | 'left' | 'right' | 'drop'][] = [
  ['.stage__ctl, .stitle, .ssub, .about__lead, .about__body, .about .btn-go, .about__ad img, .about__nums li, .clubs, .fchips, .ticks, .board, .pad, .press__side, .folder, .foot__tag, .fcol, .fside, .fbrand, .foot__bar, .vip', 'up'],
  ['.stripe:nth-child(odd)', 'left'],
  ['.stripe:nth-child(even)', 'right'],
  ['.vip__photo', 'drop']
];

/* Sheets stack: each sticks once its own bottom reaches the screen bottom, so a tall sheet is read
   in full before the next one slides over it. A covered sheet shrinks and dims. Sticky elements stay
   "on screen" while covered, so IntersectionObserver alone never sees them leave: entrances are
   cleared when a sheet is fully covered and re-observed when it is uncovered, which replays them.
   ponytail: Shift+Tab into a covered sheet can focus a hidden link; scroll to it if keyboard use grows. */
export function useStack() {
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const calm = reducedMotion();
    const sheets = Array.from(root.querySelectorAll<HTMLElement>('.sheet'));
    const headH = () => root.querySelector<HTMLElement>('.head')?.offsetHeight ?? 72;
    const place = () => sheets.forEach(s => { s.style.top = `${Math.min(headH(), window.innerHeight - s.offsetHeight)}px`; });
    const ro = new ResizeObserver(place);
    sheets.forEach(s => ro.observe(s));
    window.addEventListener('resize', place);
    place();

    const enter = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).dataset.in = ''; }), { rootMargin: '0px 0px 6% 0px' });
    const leave = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) delete (e.target as HTMLElement).dataset.in; }));
    const scan = () => { if (!calm) TARGETS.forEach(([sel, kind]) => root.querySelectorAll<HTMLElement>(sel).forEach(el => {
      if (el.dataset.rv) return;
      el.dataset.rv = kind;
      el.style.setProperty('--d', String(Math.min(el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0, 7)));
      enter.observe(el);
      leave.observe(el);
    })); };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });

    const covered = new Set<HTMLElement>();
    let ticking = false;
    const frame = () => {
      ticking = false;
      const vh = window.innerHeight, h = headH();
      sheets.forEach((s, i) => {
        const next = sheets[i + 1];
        if (!next) return;
        const inner = s.firstElementChild as HTMLElement;
        const nt = next.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (vh - nt) / (vh - h)));
        if (!calm) {
          inner.style.transform = p > 0 ? `scale(${1 - 0.05 * p})` : '';
          inner.style.transformOrigin = `50% ${vh / 2 - s.getBoundingClientRect().top}px`;
          inner.style.setProperty('--shade', String(p * 0.45));
        }
        const isCovered = nt <= h + 0.5;
        if (isCovered === covered.has(s) || calm) return;
        const items = s.querySelectorAll<HTMLElement>('[data-rv]');
        if (isCovered) { covered.add(s); items.forEach(el => delete el.dataset.in); }
        else { covered.delete(s); items.forEach(el => { enter.unobserve(el); enter.observe(el); }); }
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
    return () => { ro.disconnect(); mo.disconnect(); enter.disconnect(); leave.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
}

/* Calls back each time the nearest revealed ancestor plays its entrance (for the count-up). */
export function useOnReveal(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    const el = ref.current?.closest<HTMLElement>('[data-rv]');
    if (!el) return;
    const mo = new MutationObserver(() => { if ('in' in el.dataset) cb(); });
    mo.observe(el, { attributes: true, attributeFilter: ['data-in'] });
    return () => mo.disconnect();
  }, [ref, cb]);
}
