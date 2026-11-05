import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './rotary';

gsap.registerPlugin(ScrollTrigger);

/* One Lenis instance per page, driven by GSAP's ticker so ScrollTrigger stays in sync.
   Off under reduced motion (native scrolling). */
export let lenis: Lenis | null = null;

export const startSmoothScroll = (opts: ConstructorParameters<typeof Lenis>[0] = {}) => {
  if (lenis || reducedMotion()) return lenis;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, anchors: { offset: -84 }, ...opts });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
};

export const lockScroll = (on: boolean) => {
  if (lenis) on ? lenis.stop() : lenis.start();
  document.documentElement.classList.toggle('is-locked', on);
};

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -84 });
  else el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
};
