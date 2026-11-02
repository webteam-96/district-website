/* Shared behaviour for every theme: motion prefs, formatting, line splitting,
   count-up, in-view reveals, and the required chrome (preloader, hide-on-scroll
   header, back-to-top ring, mobile menu, theme switcher, image fade-in, Lenis).
   Themes render their markup from window.CONTENT, then call U.boot(). */
(function () {
  const doc = document.documentElement;
  const mq = (q) => window.matchMedia(q).matches;
  const reduced = mq('(prefers-reduced-motion: reduce)');
  const touch = mq('(hover: none), (pointer: coarse)');
  const EASE = 'cubic-bezier(0.16,1,0.3,1)';

  doc.classList.add('js', reduced ? 'reduced' : 'motion');
  if (touch) doc.classList.add('touch');

  const THEMES = [
    { id: 'heritage', label: 'Heritage' },
    { id: 'aurora', label: 'Aurora' },
    { id: 'impact', label: 'Impact' },
    { id: 'wheel', label: 'Wheel' },
  ];

  const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', opts);
  const num = (n, d = 0) =>
    Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Wrap each rendered line of el in a mask. Lines are measured from word
     offsets, so call after fonts load. restore() puts the original markup back
     (after the reveal) so the text re-wraps normally on resize. */
  function splitLines(el) {
    const original = el.innerHTML;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => '<span class="w">' + w + '</span>').join(' ');
    const lines = [];
    let top = null;
    el.querySelectorAll('.w').forEach((w) => {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines
      .map((l, i) => '<span class="ln"><span class="ln-i" style="--i:' + i + '">' + l.join(' ') + '</span></span>')
      .join('');
    el.setAttribute('aria-label', el.textContent);
    return { count: lines.length, restore: () => { el.innerHTML = original; el.removeAttribute('aria-label'); } };
  }

  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const set = (v) => { el.textContent = pre + num(v, dec) + suf; };
    if (reduced) return set(to);
    const dur = 1600;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      set(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // Fires once when the element's top passes ~80% of the viewport (≈20% in view).
  function onInView(els, cb, margin = '0px 0px -20% 0px') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, { rootMargin: margin });
    [].concat(els).forEach((el) => el && io.observe(el));
    return io;
  }

  function reveal(el) {
    if (el.dataset.reveal === 'lines' && !reduced) {
      const s = splitLines(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
      setTimeout(s.restore, 950 + s.count * 80);
    } else {
      el.classList.add('is-in');
    }
    el.querySelectorAll('[data-count]').forEach(countUp);
    if (el.dataset.count) countUp(el);
  }

  function initImages(root = document) {
    root.querySelectorAll('img[data-fade]').forEach((img) => {
      const done = () => img.classList.add('is-loaded');
      if (img.complete) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }

  function preloader() {
    const el = document.querySelector('[data-preloader]');
    return new Promise((resolve) => {
      if (!el) return resolve();
      const finish = () => {
        el.classList.add('is-done');
        setTimeout(() => { el.remove(); }, 500);
        resolve();
      };
      // Brief beat for the brand mark, hard cap well under 1.2s.
      const min = new Promise((r) => setTimeout(r, reduced ? 150 : 700));
      const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.race([Promise.all([min, fonts]), new Promise((r) => setTimeout(r, 1000))]).then(finish);
    });
  }

  let lenis = null;
  function smoothScroll() {
    if (reduced || touch || !window.Lenis) return null;
    lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    return lenis;
  }

  function scrollToTarget(target) {
    const offset = -((document.querySelector('[data-header]') || {}).offsetHeight || 0);
    if (lenis) lenis.scrollTo(target, { offset });
    else {
      const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  function anchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#') return e.preventDefault(); // placeholder links
      const t = id === '#top' ? 0 : document.querySelector(id);
      if (t == null) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t);
      if (t !== 0) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    });
  }

  function header() {
    const h = document.querySelector('[data-header]');
    if (!h) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      h.classList.toggle('is-scrolled', y > 8);
      const hide = y > last && y > h.offsetHeight * 2 && !doc.classList.contains('menu-open');
      if (Math.abs(y - last) > 4) h.classList.toggle('is-hidden', hide);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    h.addEventListener('focusin', () => h.classList.remove('is-hidden'));
    onScroll();
  }

  function toTop() {
    const R = 20, C = 2 * Math.PI * R;
    const b = document.createElement('button');
    b.className = 'to-top';
    b.type = 'button';
    b.setAttribute('aria-label', 'Back to top');
    b.innerHTML =
      '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="to-top-track" cx="24" cy="24" r="' + R + '"/>' +
      '<circle class="to-top-ring" cx="24" cy="24" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/>' +
      '<path class="to-top-arrow" d="M24 31V17m-6 6 6-6 6 6"/></svg>';
    document.body.appendChild(b);
    const ring = b.querySelector('.to-top-ring');
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      ring.style.strokeDashoffset = C * (1 - p);
      b.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    b.addEventListener('click', () => { scrollToTarget(0); document.querySelector('[data-header] a')?.focus({ preventScroll: true }); });
    onScroll();
  }

  function closeMenu() {
    if (!doc.classList.contains('menu-open')) return;
    doc.classList.remove('menu-open');
    const btn = document.querySelector('[data-menu-toggle]');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); }
    const panel = document.querySelector('[data-menu]');
    if (panel) panel.setAttribute('inert', '');
    if (lenis) lenis.start();
  }
  function menu() {
    const btn = document.querySelector('[data-menu-toggle]');
    const panel = document.querySelector('[data-menu]');
    if (!btn || !panel) return;
    panel.setAttribute('inert', '');
    btn.addEventListener('click', () => {
      if (doc.classList.contains('menu-open')) { closeMenu(); return; }
      doc.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      panel.removeAttribute('inert');
      if (lenis) lenis.stop();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { closeMenu(); btn.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', closeMenu);
  }

  function switcher(current) {
    const nav = document.createElement('nav');
    nav.className = 'theme-pill';
    nav.setAttribute('aria-label', 'Switch theme');
    nav.innerHTML =
      '<a class="theme-pill-home" href="../index.html" title="All themes" aria-label="All themes"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg></a>' +
      THEMES.map((t) =>
        '<a href="../' + t.id + '/index.html"' + (t.id === current ? ' aria-current="page"' : '') + '>' + t.label + '</a>'
      ).join('');
    document.body.appendChild(nav);
  }

  // Native <dialog> lightbox shared by gallery/video blocks.
  function dialog(html, label) {
    const d = document.createElement('dialog');
    d.className = 'lightbox';
    d.setAttribute('aria-label', label);
    d.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">&times;</button>' + html;
    document.body.appendChild(d);
    const close = () => d.close();
    d.querySelector('.lightbox-close').addEventListener('click', close);
    d.addEventListener('click', (e) => { if (e.target === d) close(); });
    d.addEventListener('close', () => { d.remove(); if (lenis) lenis.start(); });
    if (lenis) lenis.stop();
    d.showModal();
  }

  async function boot({ theme }) {
    switcher(theme);
    toTop();
    header();
    menu();
    anchors();
    initImages();
    smoothScroll();
    await preloader();
    // Reveal on entering view, and also anything already scrolled past: a jump
    // (End key, anchor link, fast fling) can skip an element's intersection entirely.
    const pending = new Set(document.querySelectorAll('[data-reveal]'));
    const once = (el) => { if (pending.delete(el)) reveal(el); };
    const io = onInView([...pending], once);
    let ticking = false;
    const above = (line) => pending.forEach((el) => { if (el.getBoundingClientRect().top < line) { io.unobserve(el); once(el); } });
    const sweep = () => {
      ticking = false;
      above(window.innerHeight * 0.8);
      if (!pending.size) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Anything already on screen when the page opens shows straight away, even in
    // the bottom fifth of a tall first screen, where the 20% rule would hold it back.
    above(window.innerHeight);
    // Count-ups outside any reveal block.
    onInView([...document.querySelectorAll('[data-count]')].filter((n) => !n.closest('[data-reveal]')), countUp);
  }

  window.U = { reduced, touch, EASE, THEMES, fmtDate, num, splitLines, countUp, onInView, initImages, dialog, boot, get lenis() { return lenis; } };
})();
