/* ==========================================================================
   DomeGallery — standalone vanilla-JS ES module port of
   src/components/home/DomeGallery.tsx (React Bits, DavidHDev/react-bits).

   A draggable 3D photo "dome"/globe built from CSS `transform-style: preserve-3d`
   tiles (NO WebGL). Drag-to-rotate + inertia/momentum, idle auto-spin, optional
   click-to-enlarge lightbox (FLIP). The React version used @use-gesture/react;
   this port replaces it with native Pointer Events (pointerdown/move/up + capture)
   implementing the same drag-to-rotate + inertia physics.

   Usage (from <script type="module">):
     import initDomeGallery from './js/effects/dome-gallery.js';
     const inst = initDomeGallery(viewportDiv, {
       images: [{ src, alt }, ...],
       grayscale: false,
       overlayBlurColor: '#f5f8fc',
       onImageClick: (img) => openLightbox(img)   // { src, alt }
     });
     // later: inst.destroy();
   ========================================================================== */

/* ----------------------------------------------------------------------------
   Defaults — mirror DEFAULTS + the React component prop defaults verbatim.
   ---------------------------------------------------------------------------- */
const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35
};

const DEFAULT_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Abstract art'
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Modern sculpture'
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Digital artwork'
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Contemporary art'
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Geometric pattern'
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Textured surface'
  },
  { src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large', alt: 'Social media image' }
];

/* ----------------------------------------------------------------------------
   Helper math — verbatim from DomeGallery.tsx
   ---------------------------------------------------------------------------- */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const normalizeAngle = d => ((d % 360) + 360) % 360;
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el, name, fallback) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

/* buildItems(pool, seg) — verbatim. seg columns × 5 rows of 2×2 tiles.
   segments=35 → 35 cols × 5 rows = 175 tiles. */
function buildItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
    );
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: (image && image.src) || '', alt: (image && image.alt) || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt
  }));
}

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

/* ----------------------------------------------------------------------------
   CSS — verbatim from DomeGallery.css. Injected once (idempotent) so the module
   is fully standalone (no css import needed). Exact class names / values kept.
   ---------------------------------------------------------------------------- */
const STYLE_ID = 'dome-gallery-styles';
const CSS = `
.sphere-root {
  position: relative;
  width: 100%;
  height: 100%;
  --radius: 520px;
  --viewer-pad: 72px;
  --circ: calc(var(--radius) * 3.14);
  --rot-y: calc((360deg / var(--segments-x)) / 2);
  --rot-x: calc((360deg / var(--segments-y)) / 2);
  --item-width: calc(var(--circ) / var(--segments-x));
  --item-height: calc(var(--circ) / var(--segments-y));
}

.sphere-root * {
  box-sizing: border-box;
}

.sphere,
.item,
.item__image {
  transform-style: preserve-3d;
}

main.sphere-main {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: transparent;
}

.stage {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  perspective: calc(var(--radius) * 2);
  perspective-origin: 50% 50%;
  contain: layout paint size;
}

.sphere {
  transform: translateZ(calc(var(--radius) * -1));
  will-change: transform;
}

.overlay,
.overlay--blur {
  position: absolute;
  inset: 0;
  margin: auto;
  z-index: 3;
  pointer-events: none;
}

.overlay {
  background-image: radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, #120F17) 100%);
}

.overlay--blur {
  -webkit-mask-image: radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, #120F17) 90%);
  mask-image: radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, #120F17) 90%);
  backdrop-filter: blur(3px);
}

.item {
  width: calc(var(--item-width) * var(--item-size-x));
  height: calc(var(--item-height) * var(--item-size-y));
  position: absolute;
  top: -999px;
  bottom: -999px;
  left: -999px;
  right: -999px;
  margin: auto;
  transform-origin: 50% 50%;
  backface-visibility: hidden;
  transition: transform 300ms;
  transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
    rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
    translateZ(var(--radius));
}

.item__image {
  position: absolute;
  display: block;
  inset: 10px;
  border-radius: var(--tile-radius, 12px);
  background: transparent;
  overflow: hidden;
  backface-visibility: hidden;
  transition: transform 300ms;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  pointer-events: auto;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.item__image:focus {
  outline: none;
}

.item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  backface-visibility: hidden;
  filter: var(--image-filter, none);
}

.viewer {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--viewer-pad);
}

.viewer .frame {
  height: 100%;
  aspect-ratio: 1;
  border-radius: var(--enlarge-radius, 32px);
  display: flex;
}

@media (max-aspect-ratio: 1/1) {
  .viewer .frame {
    height: auto;
    width: 100%;
  }
}

.viewer .scrim {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  opacity: 0;
  transition: opacity 500ms ease;
  backdrop-filter: blur(3px);
}

.sphere-root[data-enlarging='true'] .viewer .scrim {
  opacity: 1;
  pointer-events: all;
}

.viewer .enlarge {
  position: absolute;
  z-index: 30;
  border-radius: var(--enlarge-radius, 32px);
  overflow: hidden;
  transition:
    transform 500ms ease,
    opacity 500ms ease;
  transform-origin: top left;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.viewer .enlarge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: var(--image-filter, none);
}

.sphere-root .enlarge-closing img {
  filter: var(--image-filter, none);
}

.edge-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 120px;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--overlay-blur-color, #120F17));
}

.edge-fade--top {
  top: 0;
  transform: rotate(180deg);
}

.edge-fade--bottom {
  bottom: 0;
}
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/* ----------------------------------------------------------------------------
   initDomeGallery — builds DOM, wires drag/inertia/auto-spin/enlarge, returns
   a controller with destroy().
   ---------------------------------------------------------------------------- */
export function initDomeGallery(container, options = {}) {
  if (!container) throw new Error('[DomeGallery] container element is required');

  const {
    images = DEFAULT_IMAGES,
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#120F17',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    openedImageWidth = '250px',
    openedImageHeight = '350px',
    imageBorderRadius = '30px',
    openedImageBorderRadius = '30px',
    grayscale = true,
    onImageClick = null
  } = options;

  injectStyles();

  /* ---- state (replaces React refs) ------------------------------------- */
  const rotation = { x: 0, y: 0 };
  let startRot = { x: 0, y: 0 };
  let startPos = null;
  let dragging = false;
  let moved = false;
  let inertiaRAF = null;
  let autoSpinRAF = 0;
  let opening = false;
  let openStartedAt = 0;
  let lastDragEndAt = 0;
  let focusedEl = null;
  let originalTilePosition = null;
  let activePointerId = null;

  // pointer velocity sampling (px/ms), replaces @use-gesture velocity/direction
  let prevSample = null; // { x, y, t }
  let curSample = null; // { x, y, t }

  let scrollLocked = false;

  /* ---- build DOM (root → leaves), mirrors §3.4 ------------------------- */
  const root = document.createElement('div');
  root.className = 'sphere-root';
  root.style.setProperty('--segments-x', String(segments));
  root.style.setProperty('--segments-y', String(segments));
  root.style.setProperty('--overlay-blur-color', overlayBlurColor);
  root.style.setProperty('--tile-radius', imageBorderRadius);
  root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
  root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');

  const main = document.createElement('main');
  main.className = 'sphere-main';

  const stage = document.createElement('div');
  stage.className = 'stage';

  const sphere = document.createElement('div');
  sphere.className = 'sphere';

  const items = buildItems(images, segments);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const item = document.createElement('div');
    item.className = 'item';
    item.setAttribute('data-src', it.src);
    item.setAttribute('data-offset-x', String(it.x));
    item.setAttribute('data-offset-y', String(it.y));
    item.setAttribute('data-size-x', String(it.sizeX));
    item.setAttribute('data-size-y', String(it.sizeY));
    item.style.setProperty('--offset-x', String(it.x));
    item.style.setProperty('--offset-y', String(it.y));
    item.style.setProperty('--item-size-x', String(it.sizeX));
    item.style.setProperty('--item-size-y', String(it.sizeY));

    const image = document.createElement('div');
    image.className = 'item__image';
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', it.alt || 'Open image');

    const img = document.createElement('img');
    img.src = it.src;
    img.alt = it.alt;
    img.draggable = false;
    img.setAttribute('draggable', 'false');
    img.loading = 'lazy';
    img.decoding = 'async';

    image.appendChild(img);
    item.appendChild(image);
    sphere.appendChild(item);
  }

  stage.appendChild(sphere);
  main.appendChild(stage);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const overlayBlur = document.createElement('div');
  overlayBlur.className = 'overlay overlay--blur';
  const edgeTop = document.createElement('div');
  edgeTop.className = 'edge-fade edge-fade--top';
  const edgeBottom = document.createElement('div');
  edgeBottom.className = 'edge-fade edge-fade--bottom';

  const viewer = document.createElement('div');
  viewer.className = 'viewer';
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const frame = document.createElement('div');
  frame.className = 'frame';
  viewer.appendChild(scrim);
  viewer.appendChild(frame);

  main.appendChild(overlay);
  main.appendChild(overlayBlur);
  main.appendChild(edgeTop);
  main.appendChild(edgeBottom);
  main.appendChild(viewer);

  root.appendChild(main);
  container.appendChild(root);

  /* ---- scroll lock (no CSS rule in source — matches live behaviour) ----- */
  const lockScroll = () => {
    if (scrollLocked) return;
    scrollLocked = true;
    document.body.classList.add('dg-scroll-lock');
  };
  const unlockScroll = () => {
    if (!scrollLocked) return;
    if (root.getAttribute('data-enlarging') === 'true') return;
    scrollLocked = false;
    document.body.classList.remove('dg-scroll-lock');
  };

  /* ---- applyTransform — verbatim ---------------------------------------- */
  const applyTransform = (xDeg, yDeg) => {
    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  };

  /* ---- ResizeObserver radius/size math — verbatim ----------------------- */
  const ro = new ResizeObserver(entries => {
    const cr = entries[0].contentRect;
    const w = Math.max(1, cr.width),
      h = Math.max(1, cr.height);
    const minDim = Math.min(w, h),
      maxDim = Math.max(w, h),
      aspect = w / h;
    let basis;
    switch (fitBasis) {
      case 'min':
        basis = minDim;
        break;
      case 'max':
        basis = maxDim;
        break;
      case 'width':
        basis = w;
        break;
      case 'height':
        basis = h;
        break;
      default:
        basis = aspect >= 1.3 ? w : minDim;
    }
    let radius = basis * fit;
    const heightGuard = h * 1.35;
    radius = Math.min(radius, heightGuard);
    radius = clamp(radius, minRadius, maxRadius);
    const lockedRadius = Math.round(radius);

    const viewerPad = Math.max(8, Math.round(minDim * padFactor));
    root.style.setProperty('--radius', `${lockedRadius}px`);
    root.style.setProperty('--viewer-pad', `${viewerPad}px`);
    root.style.setProperty('--overlay-blur-color', overlayBlurColor);
    root.style.setProperty('--tile-radius', imageBorderRadius);
    root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
    root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
    applyTransform(rotation.x, rotation.y);

    const enlargedOverlay = viewer.querySelector('.enlarge');
    if (enlargedOverlay) {
      const frameR = frame.getBoundingClientRect();
      const mainR = main.getBoundingClientRect();

      const hasCustomSize = openedImageWidth && openedImageHeight;
      if (hasCustomSize) {
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
        document.body.appendChild(tempDiv);
        const tempRect = tempDiv.getBoundingClientRect();
        document.body.removeChild(tempDiv);

        const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
        const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

        enlargedOverlay.style.left = `${centeredLeft}px`;
        enlargedOverlay.style.top = `${centeredTop}px`;
      } else {
        enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
        enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
        enlargedOverlay.style.width = `${frameR.width}px`;
        enlargedOverlay.style.height = `${frameR.height}px`;
      }
    }
  });
  ro.observe(root);

  /* ---- idle auto-spin — verbatim, with pause rules ---------------------- */
  applyTransform(rotation.x, rotation.y);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    const AUTO_SPEED = 0.08; // degrees per frame
    const spin = () => {
      autoSpinRAF = requestAnimationFrame(spin);
      // pause while dragging, while a fling's inertia is running, or while enlarged
      if (dragging || inertiaRAF || focusedEl) return;
      rotation.y = rotation.y + AUTO_SPEED;
      applyTransform(rotation.x, rotation.y);
    };
    autoSpinRAF = requestAnimationFrame(spin);
  }

  /* ---- inertia / momentum — verbatim constants -------------------------- */
  const stopInertia = () => {
    if (inertiaRAF) {
      cancelAnimationFrame(inertiaRAF);
      inertiaRAF = null;
    }
  };

  const startInertia = (vx, vy) => {
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = clamp(dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);
    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        inertiaRAF = null;
        return;
      }
      if (++frames > maxFrames) {
        inertiaRAF = null;
        return;
      }
      const nextX = clamp(rotation.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nextY = wrapAngleSigned(rotation.y + vX / 200);
      rotation.x = nextX;
      rotation.y = nextY;
      applyTransform(nextX, nextY);
      inertiaRAF = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF = requestAnimationFrame(step);
  };

  /* ---- drag via native Pointer Events (replaces @use-gesture) ----------- *
     - pointerdown captures the pointer on `main` so moves keep tracking even
       when the cursor leaves the element (mirrors @use-gesture pointer capture).
     - pointermove maps drag delta → rotation (same math as onDrag).
     - pointerup/pointercancel computes fling velocity from the last move sample
       (px/ms, signed) → startInertia, and decides click-vs-drag activation in
       the SAME handler (no event-ordering races; tile resolved from the
       pointerdown target so capture-retargeting can't lose it).
     ----------------------------------------------------------------------- */
  let downTile = null; // .item__image captured at pointerdown

  const onPointerDown = e => {
    if (focusedEl) return; // ignore while a tile is enlarged (in-component path)
    if (activePointerId !== null) return; // single active pointer
    activePointerId = e.pointerId;
    downTile = e.target && e.target.closest ? e.target.closest('.item__image') : null;

    stopInertia();
    dragging = true;
    moved = false;
    startRot = { x: rotation.x, y: rotation.y };
    startPos = { x: e.clientX, y: e.clientY };
    prevSample = { x: e.clientX, y: e.clientY, t: performance.now() };
    curSample = prevSample;

    try {
      main.setPointerCapture(e.pointerId);
    } catch (_) {
      /* no-op */
    }
  };

  const onPointerMove = e => {
    if (e.pointerId !== activePointerId) return;
    if (focusedEl || !dragging || !startPos) return;

    const dxTotal = e.clientX - startPos.x;
    const dyTotal = e.clientY - startPos.y;
    if (!moved) {
      const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
      if (dist2 > 16) moved = true; // >4px → drag, not a tap
    }

    // velocity sampling (px/ms) — replaces @use-gesture velocity/direction
    prevSample = curSample;
    curSample = { x: e.clientX, y: e.clientY, t: performance.now() };

    const nextX = clamp(startRot.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
    const nextY = wrapAngleSigned(startRot.y + dxTotal / dragSensitivity);
    if (rotation.x !== nextX || rotation.y !== nextY) {
      rotation.x = nextX;
      rotation.y = nextY;
      applyTransform(nextX, nextY);
    }
  };

  const endDrag = (e, allowActivate) => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    try {
      if (main.hasPointerCapture && main.hasPointerCapture(e.pointerId)) {
        main.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* no-op */
    }

    const wasMoved = moved;
    const wasFocused = !!focusedEl;
    dragging = false;

    // ---- fling velocity from last move sample (signed px/ms) ----
    let vx = 0;
    let vy = 0;
    const now = performance.now();
    if (prevSample && curSample) {
      const dt = curSample.t - prevSample.t;
      // ignore stale samples (pointer was resting before release → no fling)
      if (dt > 0 && now - curSample.t < 80) {
        vx = (curSample.x - prevSample.x) / dt;
        vy = (curSample.y - prevSample.y) / dt;
      }
    }
    // movement-fallback branch (verbatim scaling) when velocity ~0
    if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && startPos && curSample) {
      const mx = curSample.x - startPos.x;
      const my = curSample.y - startPos.y;
      vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
      vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
    }
    if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
    if (wasMoved) lastDragEndAt = now;
    moved = false;

    prevSample = null;
    curSample = null;

    // ---- click-vs-drag activation (mouse + touch, unified) ----
    if (!allowActivate) {
      downTile = null;
      return;
    }
    const tile = downTile;
    downTile = null;
    if (!tile) return;
    if (wasMoved) return; // it was a drag
    if (wasFocused) return;
    if (now - lastDragEndAt < 80) return; // just finished a drag elsewhere
    if (opening) return;
    activateTile(tile);
  };

  const onPointerUp = e => endDrag(e, true);
  const onPointerCancel = e => endDrag(e, false);

  main.addEventListener('pointerdown', onPointerDown);
  main.addEventListener('pointermove', onPointerMove);
  main.addEventListener('pointerup', onPointerUp);
  main.addEventListener('pointercancel', onPointerCancel);

  /* ---- tile activation: emit onImageClick OR in-component enlarge -------- */
  const emitImageClick = el => {
    const parent = el.parentElement;
    const src = (parent && parent.dataset && parent.dataset.src) || (el.querySelector('img') && el.querySelector('img').src) || '';
    const alt = (el.querySelector('img') && el.querySelector('img').alt) || '';
    if (src) onImageClick({ src, alt });
  };

  function activateTile(el) {
    if (dragging) return;
    if (moved) return;
    if (performance.now() - lastDragEndAt < 80) return;
    if (opening) return;
    if (onImageClick) {
      emitImageClick(el);
      return;
    }
    openItemFromElement(el);
  }

  /* ---- in-component enlarge (FLIP open) — verbatim port ------------------ *
     Only used when no onImageClick prop is supplied (default standalone
     behaviour). On the home page onImageClick is set so this path is bypassed.
     ----------------------------------------------------------------------- */
  function openItemFromElement(el) {
    if (opening) return;
    opening = true;
    openStartedAt = performance.now();
    lockScroll();
    const parent = el.parentElement;
    focusedEl = el;
    el.setAttribute('data-focused', 'true');
    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const parentY = normalizeAngle(parentRot.rotateY);
    const globalY = normalizeAngle(rotation.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - rotation.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    void refDiv.offsetHeight;

    const tileR = refDiv.getBoundingClientRect();
    const mainR = main.getBoundingClientRect();
    const frameR = frame.getBoundingClientRect();

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      opening = false;
      focusedEl = null;
      parent.removeChild(refDiv);
      unlockScroll();
      return;
    }

    originalTilePosition = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
    el.style.visibility = 'hidden';
    el.style.zIndex = 0;
    const ov = document.createElement('div');
    ov.className = 'enlarge';
    ov.style.position = 'absolute';
    ov.style.left = frameR.left - mainR.left + 'px';
    ov.style.top = frameR.top - mainR.top + 'px';
    ov.style.width = frameR.width + 'px';
    ov.style.height = frameR.height + 'px';
    ov.style.opacity = '0';
    ov.style.zIndex = '30';
    ov.style.willChange = 'transform, opacity';
    ov.style.transformOrigin = 'top left';
    ov.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;
    const rawSrc = parent.dataset.src || (el.querySelector('img') && el.querySelector('img').src) || '';
    const img = document.createElement('img');
    img.src = rawSrc;
    ov.appendChild(img);
    viewer.appendChild(ov);
    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;

    const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

    ov.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

    setTimeout(() => {
      if (!ov.parentElement) return;
      ov.style.opacity = '1';
      ov.style.transform = 'translate(0px, 0px) scale(1, 1)';
      root.setAttribute('data-enlarging', 'true');
    }, 16);

    const wantsResize = openedImageWidth || openedImageHeight;
    if (wantsResize) {
      const onFirstEnd = ev => {
        if (ev.propertyName !== 'transform') return;
        ov.removeEventListener('transitionend', onFirstEnd);
        const prevTransition = ov.style.transition;
        ov.style.transition = 'none';
        const tempWidth = openedImageWidth || `${frameR.width}px`;
        const tempHeight = openedImageHeight || `${frameR.height}px`;
        ov.style.width = tempWidth;
        ov.style.height = tempHeight;
        const newRect = ov.getBoundingClientRect();
        ov.style.width = frameR.width + 'px';
        ov.style.height = frameR.height + 'px';
        void ov.offsetWidth;
        ov.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
        const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
        const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
        requestAnimationFrame(() => {
          ov.style.left = `${centeredLeft}px`;
          ov.style.top = `${centeredTop}px`;
          ov.style.width = tempWidth;
          ov.style.height = tempHeight;
        });
        const cleanupSecond = () => {
          ov.removeEventListener('transitionend', cleanupSecond);
          ov.style.transition = prevTransition;
        };
        ov.addEventListener('transitionend', cleanupSecond, { once: true });
      };
      ov.addEventListener('transitionend', onFirstEnd);
    }
  }

  /* ---- close (scrim click / Escape) — verbatim port --------------------- */
  const close = () => {
    if (performance.now() - openStartedAt < 250) return;
    const el = focusedEl;
    if (!el) return;
    const parent = el.parentElement;
    const ov = viewer.querySelector('.enlarge');
    if (!ov) return;
    const refDiv = parent.querySelector('.item__image--reference');
    const originalPos = originalTilePosition;
    if (!originalPos) {
      ov.remove();
      if (refDiv) refDiv.remove();
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      el.style.visibility = '';
      el.style.zIndex = 0;
      focusedEl = null;
      root.removeAttribute('data-enlarging');
      opening = false;
      unlockScroll();
      return;
    }
    const currentRect = ov.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const originalPosRelativeToRoot = {
      left: originalPos.left - rootRect.left,
      top: originalPos.top - rootRect.top,
      width: originalPos.width,
      height: originalPos.height
    };
    const overlayRelativeToRoot = {
      left: currentRect.left - rootRect.left,
      top: currentRect.top - rootRect.top,
      width: currentRect.width,
      height: currentRect.height
    };
    const animatingOverlay = document.createElement('div');
    animatingOverlay.className = 'enlarge-closing';
    animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
    const originalImg = ov.querySelector('img');
    if (originalImg) {
      const img = originalImg.cloneNode();
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      animatingOverlay.appendChild(img);
    }
    ov.remove();
    root.appendChild(animatingOverlay);
    void animatingOverlay.getBoundingClientRect();
    requestAnimationFrame(() => {
      animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
      animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
      animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
      animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
      animatingOverlay.style.opacity = '0';
    });
    const cleanup = () => {
      animatingOverlay.remove();
      originalTilePosition = null;
      if (refDiv) refDiv.remove();
      parent.style.transition = 'none';
      el.style.transition = 'none';
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      requestAnimationFrame(() => {
        el.style.visibility = '';
        el.style.opacity = '0';
        el.style.zIndex = 0;
        focusedEl = null;
        root.removeAttribute('data-enlarging');
        requestAnimationFrame(() => {
          parent.style.transition = '';
          el.style.transition = 'opacity 300ms ease-out';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            setTimeout(() => {
              el.style.transition = '';
              el.style.opacity = '';
              opening = false;
              if (!dragging && root.getAttribute('data-enlarging') !== 'true')
                document.body.classList.remove('dg-scroll-lock');
            }, 300);
          });
        });
      });
    };
    animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
  };

  const onScrimClick = () => close();
  const onKey = e => {
    if (e.key === 'Escape') close();
  };
  scrim.addEventListener('click', onScrimClick);
  window.addEventListener('keydown', onKey);

  /* ---- destroy --------------------------------------------------------- */
  function destroy() {
    if (autoSpinRAF) cancelAnimationFrame(autoSpinRAF);
    autoSpinRAF = 0;
    stopInertia();
    ro.disconnect();
    main.removeEventListener('pointerdown', onPointerDown);
    main.removeEventListener('pointermove', onPointerMove);
    main.removeEventListener('pointerup', onPointerUp);
    main.removeEventListener('pointercancel', onPointerCancel);
    scrim.removeEventListener('click', onScrimClick);
    window.removeEventListener('keydown', onKey);
    document.body.classList.remove('dg-scroll-lock');
    if (root.parentElement === container) container.removeChild(root);
    else if (root.parentElement) root.parentElement.removeChild(root);
  }

  return { destroy };
}

export default initDomeGallery;
