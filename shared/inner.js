/* ==========================================================================
   Rotary District 3141 — inner page behaviour, plain JavaScript (no framework)

   The React pages and the plain-HTML pages share this one file, so a tab, a
   filter or "show more" behaves the same in both. Everything is driven by data
   attributes in the markup:

   Reveal       [data-rv]                       gains .is-in each time it scrolls into view
   Tabs         [data-tabs] > [data-tab=K] buttons, [data-panel=K] panels
                data-tabs-hash on the root keeps the open tab in the URL (#K)
   Filter       [data-filter] root, holding:
                  input[data-f-search]              free text, matched against data-q
                  select[data-f=attr]               value matched against data-<attr>
                  button[data-f-chip=attr][data-v]  chips; data-v="" means "all"
                  [data-item]                       the things filtered
                  [data-f-count] [data-f-empty] [data-f-more]
                data-page-size="12" shows that many, then "show more"
   Demo form    form[data-demo-form] + [data-form-done]  (no message is sent)

   RInner.mount(root)   page behaviour (both versions)
   RInner.chrome(opts)  header/footer behaviour for the plain-HTML pages only;
                        in the React pages the components do this themselves.
   ========================================================================== */
window.RInner = (function () {
  'use strict';

  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var $$ = function (root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

  /* ---------- reveal: every time an element enters the view, not only once ---------- */
  function reveal(root) {
    var els = $$(root, '[data-rv]');
    if (!els.length) return function () {};
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return function () {}; }
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-in');
        /* leaving through the bottom resets it, so it plays again on the way back down */
        else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
    return function () { io.disconnect(); };
  }

  /* ---------- tabs ---------- */
  function tabs(root) {
    $$(root, '[data-tabs]').forEach(function (box) {
      var own = function (sel) { return $$(box, sel).filter(function (el) { return el.closest('[data-tabs]') === box; }); };
      var btns = own('[data-tab]');
      var show = function (key, focus) {
        var hit = false;
        btns.forEach(function (b) {
          var on = b.getAttribute('data-tab') === key;
          if (on) hit = true;
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
          b.classList.toggle('is-on', on);
          if (on && focus) b.focus();
        });
        if (!hit) return false;
        own('[data-panel]').forEach(function (p) {
          var on = p.getAttribute('data-panel') === key;
          p.hidden = !on;
          if (on) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
        });
        box.dispatchEvent(new CustomEvent('rinner:tab', { detail: key, bubbles: true }));
        return true;
      };
      btns.forEach(function (b, i) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-tab');
          show(k);
          if (box.hasAttribute('data-tabs-hash') && history.replaceState) history.replaceState(null, '', '#' + k);
        });
        b.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var n = btns[(i + d + btns.length) % btns.length];
          show(n.getAttribute('data-tab'), true);
        });
      });
      if (box.hasAttribute('data-tabs-hash') && location.hash) show(location.hash.slice(1));
    });
  }

  /* ---------- filter + search + show more ---------- */
  function filters(root) {
    $$(root, '[data-filter]').forEach(function (box) {
      var items = $$(box, '[data-item]');
      var search = box.querySelector('[data-f-search]');
      var selects = $$(box, 'select[data-f]');
      var chips = $$(box, '[data-f-chip]');
      var more = box.querySelector('[data-f-more]');
      var count = box.querySelector('[data-f-count]');
      var empty = box.querySelector('[data-f-empty]');
      var size = parseInt(box.getAttribute('data-page-size') || '0', 10) || Infinity;
      var limit = size;
      var chosen = {};
      chips.forEach(function (c) { if (c.getAttribute('aria-pressed') === 'true') chosen[c.getAttribute('data-f-chip')] = c.getAttribute('data-v'); });

      var run = function () {
        var q = search ? search.value.trim().toLowerCase() : '';
        var want = {};
        selects.forEach(function (s) { if (s.value) want[s.getAttribute('data-f')] = s.value; });
        for (var k in chosen) if (chosen[k]) want[k] = chosen[k];
        var shown = 0, matched = 0;
        items.forEach(function (it) {
          var ok = !q || (it.getAttribute('data-q') || it.textContent).toLowerCase().indexOf(q) !== -1;
          for (var a in want) {
            if (!ok) break;
            var have = (it.getAttribute('data-' + a) || '').split('|');
            ok = have.indexOf(want[a]) !== -1;
          }
          if (ok) matched++;
          var vis = ok && shown < limit;
          if (vis) shown++;
          it.hidden = !vis;
          if (vis) it.style.setProperty('--n', String((shown - 1) % (isFinite(size) ? size : 12)));
        });
        if (count) count.textContent = String(matched);
        if (empty) empty.hidden = matched !== 0;
        if (more) more.hidden = matched <= limit;
        box.dispatchEvent(new CustomEvent('rinner:filter', { detail: matched, bubbles: true }));
      };

      if (search) search.addEventListener('input', function () { limit = size; run(); });
      selects.forEach(function (s) { s.addEventListener('change', function () { limit = size; run(); }); });
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          var a = c.getAttribute('data-f-chip');
          chosen[a] = c.getAttribute('data-v');
          /* the root carries the choice too (data-f-type="birthday"), so CSS can narrow rows inside an item */
          if (chosen[a]) box.setAttribute('data-f-' + a, chosen[a]); else box.removeAttribute('data-f-' + a);
          chips.forEach(function (o) { if (o.getAttribute('data-f-chip') === a) o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
          limit = size;
          run();
        });
      });
      if (more) more.addEventListener('click', function () { limit += size; run(); });
      run();
    });
  }

  /* ---------- demo form: says plainly that nothing was sent ---------- */
  function forms(root) {
    $$(root, 'form[data-demo-form]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!f.reportValidity()) return;
        var done = f.querySelector('[data-form-done]');
        if (done) { done.hidden = false; done.focus && done.focus(); }
      });
    });
  }

  function mount(root) {
    root = root || document;
    var stop = reveal(root);
    tabs(root);
    filters(root);
    forms(root);
    return stop;
  }

  /* ======================= plain-HTML pages only ======================= */
  function chrome(opts) {
    opts = opts || {};
    var R = window.ROTARY;
    var html = document.documentElement;

    /* mobile menu: rendered inside the header, lives on <body> so position:fixed is the viewport */
    var menu = document.getElementById('m-menu');
    if (menu) {
      document.body.appendChild(menu);
      var opener = document.querySelector('[aria-controls="m-menu"]');
      var close = function () {
        menu.classList.remove('is-open'); menu.setAttribute('inert', ''); html.classList.remove('is-locked');
        if (lenis) lenis.start();
        if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
      };
      var open = function () {
        menu.classList.add('is-open'); menu.removeAttribute('inert'); html.classList.add('is-locked');
        if (lenis) lenis.stop();
        if (opener) opener.setAttribute('aria-expanded', 'true');
        setTimeout(function () { var c = menu.querySelector('.mmenu__close'); if (c) c.focus(); }, 60);
      };
      if (opener) opener.addEventListener('click', open);
      $$(menu, '.mmenu__close, a').forEach(function (el) { el.addEventListener('click', close); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) close(); });
    }

    /* light / dark */
    var key = opts.themeKey;
    var setTheme = function (t) {
      html.dataset.theme = t;
      $$(document, '.mode').forEach(function (b) {
        var next = t === 'dark' ? 'light' : 'dark';
        b.classList.toggle('mode--dark', t === 'dark'); b.classList.toggle('mode--light', t === 'light');
        b.setAttribute('aria-label', 'Switch to ' + next + ' theme'); b.title = 'Switch to ' + next + ' theme';
      });
      $$(document, 'header img[src*="rotary-logo"]').forEach(function (img) {
        img.setAttribute('src', img.getAttribute('src').replace(/rotary-logo(-reversed)?\.svg/, t === 'dark' ? 'rotary-logo-reversed.svg' : 'rotary-logo.svg'));
      });
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && opts.colors) meta.setAttribute('content', opts.colors[t]);
      try { localStorage.setItem(key, t); } catch (e) { /* private mode */ }
    };
    setTheme(html.dataset.theme === 'light' || html.dataset.theme === 'dark' ? html.dataset.theme : opts.defaultTheme || 'light');
    $$(document, '.mode').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'); });
    });

    /* Rotary year: the same listbox as the React YearSelect */
    $$(document, '.year').forEach(function (wrap) {
      var btn = wrap.querySelector('.year__btn');
      var value = wrap.querySelector('.year__value');
      if (!btn) return;
      var list = null;
      var shut = function () { if (list) { list.remove(); list = null; } wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
      var choose = function (y) {
        value.textContent = y;
        $$(document, '[data-year]').forEach(function (p) { p.hidden = p.getAttribute('data-year') !== y; });
        document.dispatchEvent(new CustomEvent('rinner:year', { detail: y }));
        shut(); btn.focus();
      };
      btn.addEventListener('click', function () {
        if (list) { shut(); return; }
        list = document.createElement('ul');
        list.className = 'year__list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
        list.setAttribute('data-lenis-prevent', '');
        R.years.list.forEach(function (y) {
          var li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.setAttribute('aria-selected', y === value.textContent ? 'true' : 'false');
          if (y === value.textContent) li.className = 'is-selected is-active';
          li.innerHTML = '<span>' + y + '</span>' + (y === R.years.current ? '<em>Current</em>' : '');
          li.addEventListener('click', function () { choose(y); });
          list.appendChild(li);
        });
        wrap.appendChild(list);
        wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
        var sel = list.querySelector('.is-selected'); if (sel) sel.scrollIntoView({ block: 'nearest' });
        list.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
        list.focus();
      });
      document.addEventListener('pointerdown', function (e) { if (list && !wrap.contains(e.target)) shut(); });
    });

    /* header that tightens after scrolling, back-to-top that appears */
    var stuck = opts.stuck ? document.querySelector(opts.stuck) : null;
    var tops = $$(document, '.totop');
    var onScroll = function () {
      var y = window.scrollY;
      if (stuck) stuck.classList.toggle('is-stuck', y > 40);
      tops.forEach(function (t) { t.classList.toggle('is-on', y > 600); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* smooth scrolling, as on the React pages (Lenis is optional) */
    var lenis = null;
    if (window.Lenis && !reduced()) {
      lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    $$(document, 'a[href="#top"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      });
    });
  }

  return { mount: mount, chrome: chrome };
})();
