import { useLayoutEffect } from 'react';
import { reducedMotion } from '../../shared/rotary';

/* What animates in, and how. Listed items get a small stagger from their position among their siblings. */
const TARGETS: [string, 'up' | 'zoom' | 'spin'][] = [
  ['.stage__frame', 'zoom'],
  ['.stage__controls, .stitle, .ssub, .snap__clubs', 'up'],
  ['.stat', 'up'],
  ['.hub, .orb__art, .dial', 'spin'],
  ['.orb__role, .orb__name, .orb__term, .orb__bio, .btn-read', 'up'],
  ['.dialbar, .dayp', 'up'],
  ['.gml, .press__head, .row, .press__foot', 'up'],
  ['.fcard, .foot__bar', 'up']
];

/* Replays each element's entrance every time it comes back into view: .is-in goes on as it
   enters and comes off only once it is fully off screen, so nothing vanishes while visible. */
export function useReveal() {
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;
    const enter = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-in'); }), { rootMargin: '0px 0px -8% 0px' });
    const leave = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) e.target.classList.remove('is-in'); }));
    /* scanned again on every DOM change: a year switch re-creates rows and portraits */
    const scan = () => TARGETS.forEach(([sel, kind]) => root.querySelectorAll<HTMLElement>(sel).forEach(el => {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv', `rv--${kind}`);
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
