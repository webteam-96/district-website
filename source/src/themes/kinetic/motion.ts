import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '../../shared/rotary';

/* Every animation here is tied to the scroll position (scrub), so it runs forward and backward with
   the wheel and stops when the wheel stops. Scenes hold with CSS sticky, never a GSAP pin, and only
   where the scene fits the screen. These queries must match the ones in kinetic.css.
   For smoothness, tweens stick to transform and opacity; SCRUB lets them glide to the scroll position. */
const STICK = '(min-width: 1024px) and (min-height: 620px) and (min-aspect-ratio: 1/1)';
const DUO = '(min-width: 1200px) and (min-height: 640px) and (min-aspect-ratio: 1/1)';

const SCRUB = 0.5;
const q = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));
const headH = () => document.querySelector<HTMLElement>('.head')?.offsetHeight ?? 70;

/* Numbers follow the same scroll position; the progress is kept on the element for a year change. */
const paintNum = (el: HTMLElement) => {
  const d = Number(el.dataset.d ?? 0), v = Number(el.dataset.v ?? 0), p = Number(el.dataset.p ?? 1);
  const text = (v * p).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  if (el.textContent !== text) el.textContent = text;
};
export const paintNums = () => q('.hex__n').forEach(paintNum);
const countTo = (tl: gsap.core.Timeline, el: HTMLElement | null, at: number, dur: number) => {
  if (!el) return;
  const o = { p: 0 };
  tl.to(o, { p: 1, duration: dur, ease: 'none', onUpdate: () => { el.dataset.p = String(o.p); paintNum(el); } }, at);
};

/* Headings stretch out from narrow to full width. Scaling is far lighter than changing the font's width. */
/* The banner stays held while it shrinks into a rounded card, then About comes up. On small and upright
   screens it isn't held and shrinks as it leaves. Its images change on their own timer (Hero.tsx). */
const hero = (stick: boolean) => {
  const stage = document.querySelector<HTMLElement>('.stage');
  if (!stage) return;
  const to = { scale: 0.84, borderRadius: 40, ease: 'none' };
  if (stick) gsap.to(stage, { ...to, scrollTrigger: { trigger: '.hero', start: () => `top ${headH()}px`, end: () => `bottom ${headH() + stage.offsetHeight}px`, scrub: SCRUB } });
  else gsap.to(stage, { ...to, scrollTrigger: { trigger: stage, start: () => `top ${headH()}px`, end: 'bottom top', scrub: SCRUB } });
};

const titles = () => q('.kt').forEach(el => {
  gsap.fromTo(el, { scaleX: 0.6 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 42%', scrub: SCRUB } });
});

const about = (stick: boolean) => {
  const ad = document.querySelector('.about__ad');
  const words = q('.about .w');
  const from = { xPercent: -30, rotate: -13, scale: 0.74 }, to = { xPercent: 0, rotate: 0, scale: 1, ease: 'none' };
  if (stick) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.about', start: 'top 72%', end: 'bottom bottom', scrub: SCRUB } });
    tl.fromTo(ad, from, { ...to, duration: 3 }, 0)
      .fromTo(words, { opacity: 0.16 }, { opacity: 1, duration: 0.5, stagger: 6 / Math.max(words.length, 1), ease: 'none' }, 1)
      .fromTo('.about .btn-go', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'none' }, 6.8)
      .to({}, { duration: 2.4 }); /* stays settled for reading before the scene lets go */
  } else {
    gsap.fromTo(ad, from, { ...to, scrollTrigger: { trigger: ad as Element, start: 'top 98%', end: 'top 52%', scrub: SCRUB } });
    q('.about__copy p').forEach(p => {
      gsap.fromTo(q('.w', p), { opacity: 0.16 }, { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 58%', scrub: SCRUB } });
    });
  }
};

/* Where each honeycomb cell flies in from on a large screen. */
const FLY = [
  { xPercent: -170, yPercent: -120, rotate: -50 }, { xPercent: 0, yPercent: -190, rotate: 34 }, { xPercent: 180, yPercent: -120, rotate: 58 },
  { xPercent: -190, yPercent: 130, rotate: 42 }, { xPercent: 0, yPercent: 200, rotate: -36 }, { xPercent: 180, yPercent: 130, rotate: -56 }
];
const snapshot = (stick: boolean) => {
  const hexes = q('.hex');
  if (stick) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.snap', start: 'top 68%', end: 'bottom bottom', scrub: SCRUB } });
    hexes.forEach((h, i) => {
      const at = [0, 0.5, 1, 1.5, 2, 2.5][i] ?? 0;
      tl.fromTo(h, { ...FLY[i % 6], scale: 0.5 }, { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, duration: 2, ease: 'none' }, at);
      countTo(tl, h.querySelector<HTMLElement>('.hex__n'), at, 2);
    });
    tl.fromTo('.clubs', { yPercent: 130 }, { yPercent: 0, duration: 1, ease: 'none' }, 3.5).to({}, { duration: 1.6 });
  } else {
    hexes.forEach((h, i) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 100%', end: 'top 60%', scrub: SCRUB } });
      tl.fromTo(h, { xPercent: i % 2 ? 40 : -40, rotate: i % 2 ? 24 : -24, scale: 0.7 }, { xPercent: 0, rotate: 0, scale: 1, duration: 1, ease: 'none' }, 0);
      countTo(tl, h.querySelector<HTMLElement>('.hex__n'), 0, 1);
    });
  }
};

const dignitaries = (duo: boolean) => {
  const photos = q('.dp__photo');
  const texts = q('.dp__t');
  if (duo) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.dig', start: 'top 62%', end: 'bottom bottom', scrub: SCRUB } });
    photos.forEach((p, i) => {
      tl.fromTo(p, { xPercent: i ? 135 : -135, rotate: i ? 11 : -11, scale: 0.78 }, { xPercent: 0, rotate: 0, scale: 1, duration: 2, ease: 'none' }, 0);
    });
    texts.forEach((t, i) => {
      const left = t.closest('.dp') === document.querySelector('.dp');
      tl.fromTo(t, { x: left ? 70 : -70, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'none' }, 1.5 + (i % 5) * 0.14);
    });
    tl.to({}, { duration: 1.4 });
  } else {
    photos.forEach((p, i) => gsap.fromTo(p, { xPercent: i ? 30 : -30, rotate: i ? 8 : -8, scale: 0.8 }, { xPercent: 0, rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 100%', end: 'top 55%', scrub: SCRUB } }));
    texts.forEach(t => gsap.fromTo(t, { y: 26, opacity: 0.2 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: t, start: 'top 98%', end: 'top 78%', scrub: SCRUB } }));
  }
};

const calendar = () => {
  const days = q('.day');
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.week', start: 'top 96%', end: 'top 52%', scrub: SCRUB } });
  days.forEach((d, i) => tl.fromTo(d, { y: 150 + i * 26, opacity: 0.25 }, { y: 0, opacity: 1, duration: 1, ease: 'none' }, i * 0.1));
};

const press = () => {
  const deck = document.querySelector<HTMLElement>('.deck');
  const cards = q('.card');
  if (!deck || !cards.length) return;
  const wide = window.matchMedia('(min-width: 761px)').matches;
  if (wide) {
    /* dealt from one pile at the middle of the grid out to each card's place */
    const tl = gsap.timeline({ scrollTrigger: { trigger: deck, start: 'top 94%', end: 'top 40%', scrub: SCRUB } });
    const box = deck.getBoundingClientRect();
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      tl.fromTo(c, { x: box.left + box.width / 2 - r.left - r.width / 2, y: box.top + box.height / 2 - r.top - r.height / 2, rotate: (i - 3.5) * 8, scale: 0.84 }, { x: 0, y: 0, rotate: 0, scale: 1, duration: 1, ease: 'none' }, i * 0.08);
    });
  } else {
    cards.forEach((c, i) => gsap.fromTo(c, { xPercent: i % 2 ? 30 : -30, rotate: i % 2 ? 7 : -7 }, { xPercent: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top 100%', end: 'top 68%', scrub: SCRUB } }));
  }
};

const footer = () => {
  gsap.fromTo('.mark', { scaleX: 0.42 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top 80%', end: 'bottom bottom', scrub: SCRUB } });
  gsap.fromTo('.fmain > *', { y: 54 }, { y: 0, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.fmain', start: 'top 100%', end: 'top 62%', scrub: SCRUB } });
};

export function useScenes(deps: unknown[]) {
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add({ stick: STICK, duo: DUO, any: '(min-width: 1px)' }, ctx => {
      const { stick, duo } = ctx.conditions as { stick: boolean; duo: boolean };
      gsap.to('.head__bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
      hero(stick);
      titles();
      about(stick);
      snapshot(stick);
      dignitaries(duo);
      calendar();
      press();
      footer();
    });
    const again = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(again);
    window.addEventListener('load', again);
    return () => { window.removeEventListener('load', again); mm.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

