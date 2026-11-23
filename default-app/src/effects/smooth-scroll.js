/* Smooth scroll — Lenis (vanilla port of SmoothScroll.tsx + lib/smoothScroll.ts).
   Single shared instance; exposes stop/start for modal/lightbox scroll-lock.
   Disabled under prefers-reduced-motion. */
import Lenis from './vendor/lenis.mjs';

var lenis = null;
var rafId = null;

export function initSmoothScroll() {
  var reduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || lenis) return lenis;

  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);
  return lenis;
}

/* Full teardown for page unmount. Cancels the rAF pump BEFORE destroying and
   nulls the singleton so the next init builds a fresh instance — destroying the
   instance alone leaves a zombie rAF loop driving a dead Lenis, which sticks
   `lenis-scrolling` on <html> and repaints every frame forever. */
export function destroySmoothScroll() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
}

export function stopScroll() {
  if (lenis) lenis.stop();
  else document.documentElement.classList.add('lenis-stopped');
}

export function startScroll() {
  if (lenis) lenis.start();
  else document.documentElement.classList.remove('lenis-stopped');
}

export function scrollToTopImmediate() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export function getLenis() {
  return lenis;
}

export default initSmoothScroll;
