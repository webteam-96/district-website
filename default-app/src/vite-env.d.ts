/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TOKEN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* Vendored effect modules (copied verbatim from the ASPX js/effects/*). They are
   plain ES-module JS and are NOT type-checked; the bundler bundles them as-is.
   These ambient signatures are enough for the React callers/EffectMount. */
type EffectHandle = { destroy: () => void } | void;

declare module '*hero-carousel.js' {
  export function initHeroCarousel(container: HTMLElement, opts: any): EffectHandle;
  const _default: typeof initHeroCarousel;
  export default _default;
}
declare module '*reveal.js' {
  export function initReveals(root: Document | HTMLElement): EffectHandle;
  const _default: typeof initReveals;
  export default _default;
}
declare module '*smooth-scroll.js' {
  export function initSmoothScroll(): EffectHandle;
  export function destroySmoothScroll(): void;
  export function stopScroll(): void;
  export function startScroll(): void;
  export function scrollToTopImmediate(): void;
  export function getLenis(): { on(event: 'scroll', cb: () => void): () => void } | null;
  const _default: typeof initSmoothScroll;
  export default _default;
}
declare module '*circular-gallery.js' {
  export function initCircularGallery(container: HTMLElement, opts: any): EffectHandle;
  const _default: typeof initCircularGallery;
  export default _default;
}
declare module '*dome-gallery.js' {
  export function initDomeGallery(container: HTMLElement, opts: any): EffectHandle;
  const _default: typeof initDomeGallery;
  export default _default;
}
