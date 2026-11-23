/* Reveal — one-shot scroll reveal on GSAP ScrollTrigger (restores the original
   Reveal.tsx behaviour the IO port approximated). Targets [data-reveal].
   Hidden start: opacity 0, translateY(28px); reveals once when the element top
   crosses 88% of the viewport; 700ms ease-out. Direct children of an element
   marked data-reveal-stagger rise with a 90ms step stagger instead of as one
   block. Honors prefers-reduced-motion (renders final immediately).
   Returns { destroy } — kill it on page unmount so triggers don't pile up
   across route changes. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initReveals(root) {
  root = root || document;
  var reduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]'));
  if (!els.length || reduce) return { destroy: function () {} };

  var tweens = els.map(function (el) {
    var stagger = el.hasAttribute('data-reveal-stagger');
    var targets = stagger && el.children.length ? Array.prototype.slice.call(el.children) : el;
    return gsap.fromTo(
      targets,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: stagger ? 0.09 : 0,
        clearProps: 'opacity,transform', // leave no inline residue (hover transforms etc.)
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    );
  });

  return {
    destroy: function () {
      tweens.forEach(function (t) {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    },
  };
}

export default initReveals;
