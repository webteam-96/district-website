import { useLayoutEffect } from 'react';
import { reducedMotion } from '../../shared/rotary';

const TARGETS: [string, 'up' | 'rise' | 'pop'][] = [
  ['.stage__controls, .stitle, .ssub, .rail__clubs, .about__lead, .about__body, .about .btn-read', 'up'],
  ['.panel, .about__ad', 'rise'],
  ['.person__photo', 'pop'],
  ['.person__info', 'rise'],
  ['.fchips, .deck, .scrub', 'up'],
  ['.gml, .spine, .press__foot', 'rise'],
  ['.fcard, .foot__bar', 'rise']
];

/* Replays each element's entrance every time it comes back into view: data-in goes on as it
   enters and comes off only once it is fully off screen, so nothing vanishes while visible.
   Data attributes, not classes: React rewrites className when a spine opens, which would wipe them. */
export function useReveal() {
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;
    const enter = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).dataset.in = ''; }), { rootMargin: '0px 0px -8% 0px' });
    const leave = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) delete (e.target as HTMLElement).dataset.in; }));
    const scan = () => TARGETS.forEach(([sel, kind]) => root.querySelectorAll<HTMLElement>(sel).forEach(el => {
      if (el.dataset.rv) return;
      el.dataset.rv = kind;
      el.style.setProperty('--d', String(Math.min(el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0, 7)));
      enter.observe(el);
      leave.observe(el);
    }));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => { mo.disconnect(); enter.disconnect(); leave.disconnect(); };
  }, []);
}
