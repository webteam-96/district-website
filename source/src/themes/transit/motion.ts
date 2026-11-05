import { useEffect, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { lenis } from '../../shared/smooth';
import { reducedMotion } from '../../shared/rotary';

/* Wide and tall enough: the page runs sideways. Otherwise it stacks. Same test as transit.css. */
export const H_QUERY = '(min-width: 1024px) and (min-height: 560px)';
export const isH = () => window.matchMedia(H_QUERY).matches;

/* A tween tied to how far `trigger` has crossed the screen sideways. Sideways layout only. */
export const useSideScrub = (build: () => { target: gsap.TweenTarget; trigger: Element; from: gsap.TweenVars; to: gsap.TweenVars; start?: string; end?: string }[], deps: unknown[]) => {
  useEffect(() => {
    if (reducedMotion() || !isH()) return;
    const tweens = build().map(t => gsap.fromTo(t.target, t.from, { ...t.to, ease: 'none', scrollTrigger: { trigger: t.trigger, horizontal: true, start: t.start ?? 'left right', end: t.end ?? 'right left', scrub: true } }));
    return () => tweens.forEach(t => { t.scrollTrigger?.kill(); t.kill(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const TARGETS: [string, 'in' | 'pop'][] = [
  ['.stage__ctl, .stitle, .ssub, .about__lead, .about__body, .about__chips, .about .btn-go, .snap__clubs, .cal__filters, .cal__month, .droute, .press__foot, .foot__bar', 'in'],
  ['.about__ad, .scol, .board, .plat, .pcard, .fbrand, .flist, .fside', 'pop']
];

/* Replays each entrance every time the element comes back on screen. Data attributes survive
   React rewriting className. */
export function useReveal() {
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;
    const enter = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).dataset.in = ''; }), { rootMargin: isH() ? '0px -6% 0px 0px' : '0px 0px -6% 0px' });
    const leave = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) delete (e.target as HTMLElement).dataset.in; }));
    const scan = () => TARGETS.forEach(([sel, kind]) => root.querySelectorAll<HTMLElement>(sel).forEach(el => {
      if (el.dataset.rv) return;
      el.dataset.rv = kind;
      el.style.setProperty('--d', String(Math.min(el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0, 6)));
      enter.observe(el);
      leave.observe(el);
    }));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => { mo.disconnect(); enter.disconnect(); leave.disconnect(); };
  }, []);
}

/* Page Up/Down, Space and the up/down arrows mean nothing on a sideways page, so they step by section.
   Crossing the layout breakpoint (a rotated tablet) reloads into the other layout. */
export function useSidePage(panels: string[]) {
  useEffect(() => {
    const mq = window.matchMedia(H_QUERY);
    const flip = () => window.location.reload();
    mq.addEventListener('change', flip);
    const onKey = (e: KeyboardEvent) => {
      if (!isH() || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, button, select, textarea, dialog, [role="listbox"], .plat__list')) return;
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const end = e.key === 'End' ? document.documentElement.scrollWidth - window.innerWidth : 0;
        if (lenis) lenis.scrollTo(end); else window.scrollTo({ left: end });
        return;
      }
      const dir = e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey) ? 1 : e.key === 'PageUp' || e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey) ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const lefts = panels.map(id => document.getElementById(id)!.getBoundingClientRect().left);
      const i = dir > 0 ? lefts.findIndex(l => l > 4) : lefts.reduce((a, l, k) => (l < -4 ? k : a), 0);
      if (i < 0) return;
      if (lenis) lenis.scrollTo(lefts[i] + window.scrollX);
      else window.scrollTo({ left: lefts[i] + window.scrollX });
    };
    document.addEventListener('keydown', onKey);
    return () => { mq.removeEventListener('change', flip); document.removeEventListener('keydown', onKey); };
  }, [panels]);
}
