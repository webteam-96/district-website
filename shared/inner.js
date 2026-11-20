/* ==========================================================================
   Rotary District 3141 — inner page behaviour, plain JavaScript (no framework)

   The React pages and the plain-HTML pages share this one file, so a tab, a
   filter or "show more" behaves the same in both. Everything is driven by data
   attributes in the markup:

   Reveal       [data-rv]                       gains .is-in each time it scrolls into view
   Pointer glow [data-glow]                     gets --mx / --my (px from its top-left) while a mouse is over it, for CSS spotlights
   Count-up     [data-count]                    its number ("59,895", "₹119.7 L") counts up from 0 each time it scrolls into view
   Tabs         [data-tabs] > [data-tab=K] buttons, [data-panel=K] panels
                data-tabs-hash on the root keeps the open tab in the URL (#K)
   Filter       [data-filter] root, holding:
                  input[data-f-search]              free text, matched against data-q
                  select[data-f=attr]               value matched against data-<attr>
                  button[data-f-chip=attr][data-v]  chips; data-v="" means "all"
                  [data-item]                       the things filtered
                  [data-f-count] [data-f-empty] [data-f-more]
                  [data-f-group]                    optional wrapper round some items (a committee, a letter):
                                                    hidden while none of its items show; [data-f-group-count] inside it gets how many do
                data-page-size="12" shows that many, then "show more"
   Demo form    form[data-demo-form] + [data-form-done]  (no message is sent)
   Lightbox     a[href=photo][data-lightbox=group] (+ data-caption)  opens the photo full size; one group = one gallery
   Share        button[data-share][data-share-url][data-share-title]  system share sheet on phones, else a menu:
                WhatsApp, Facebook, X, LinkedIn, Copy link (styles: source/src/shared/media.css)

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
    /* what is on screen when the page opens shows at once: a first screen never ends in an empty band */
    var vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) el.classList.add('is-in'); });
    /* plays when it rises a little past the lower edge of the view … */
    var show = new IntersectionObserver(function (list) {
      list.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('is-in'); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    /* … and resets only once it is wholly below the view, so it plays again on the way back down
       but never vanishes while part of it can still be seen */
    var hide = new IntersectionObserver(function (list) {
      list.forEach(function (e) { if (!e.isIntersecting && e.boundingClientRect.top > 0) e.target.classList.remove('is-in'); });
    }, { threshold: 0 });
    els.forEach(function (el) { show.observe(el); hide.observe(el); });
    return function () { show.disconnect(); hide.disconnect(); };
  }

  /* ---------- count-up: the element's own number, from 0, each time it scrolls into view ----------
     The finished text is already in the markup, so with no script (or reduced motion) it simply shows.
     Only the text node's value changes, so React keeps owning the node. */
  function counts(root) {
    var els = $$(root, '[data-count]');
    if (!els.length || reduced() || !('IntersectionObserver' in window)) return function () {};
    var finish = function (el) { if (el.rFinal != null) { el.firstChild.nodeValue = el.rFinal; el.rFinal = null; } };
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        var el = e.target, node = el.firstChild;
        if (!e.isIntersecting) { finish(el); return; }
        if (el.rFinal != null || !node || node.nodeType !== 3 || el.childNodes.length !== 1) return;
        var text = node.nodeValue, m = text.match(/[\d,]+(\.\d+)?/);
        if (!m) return;
        var end = parseFloat(m[0].replace(/,/g, '')), dec = m[1] ? m[1].length - 1 : 0, t0 = 0;
        el.rFinal = text;
        var step = function (t) {
          if (el.rFinal == null) return;
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 900);
          if (k === 1) { finish(el); return; }
          node.nodeValue = text.replace(m[0], (end * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });   /* one call per entry or exit, never mid-way */
    els.forEach(function (el) { io.observe(el); });
    return function () { io.disconnect(); els.forEach(finish); };
  }

  /* ---------- pointer glow: --mx/--my on the [data-glow] under the mouse (CSS draws the light) ---------- */
  function glow(root) {
    if (!root.querySelector('[data-glow]') || !window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return function () {};
    var move = function (e) {
      var el = e.target.closest && e.target.closest('[data-glow]');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    };
    root.addEventListener('pointermove', move, { passive: true });
    return function () { root.removeEventListener('pointermove', move); };
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
    var boxes = $$(root, '[data-filter]');
    if (root.matches && root.matches('[data-filter]')) boxes.unshift(root);   /* a panel built later binds itself */
    boxes.forEach(function (box) {
      var items = $$(box, '[data-item]');
      var search = box.querySelector('[data-f-search]');
      var selects = $$(box, 'select[data-f]');
      var chips = $$(box, '[data-f-chip]');
      var more = box.querySelector('[data-f-more]');
      var count = box.querySelector('[data-f-count]');
      var empty = box.querySelector('[data-f-empty]');
      var groups = $$(box, '[data-f-group]');
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
        groups.forEach(function (g) {
          var n = $$(g, '[data-item]').filter(function (it) { return !it.hidden; }).length;
          var c = g.querySelector('[data-f-group-count]');
          g.hidden = n === 0;
          if (c) c.textContent = n.toLocaleString('en-IN');
        });
        if (count) count.textContent = matched.toLocaleString('en-IN');   /* 1,000 like the page's own figures */
        if (empty) empty.hidden = matched !== 0;
        if (more) more.hidden = matched <= limit;
        box.setAttribute('data-f-on', '');   /* ROW: filtered once; until then CSS keeps long lists out of the first layout */
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

  /* ---------- lightbox: a photo opens full size; links with the same data-lightbox value form one gallery ----------
     <a href="photo.jpg" data-lightbox="p-12" data-caption="…"><img …></a>   (without the script the link opens the photo)
     Esc closes, ← → move, a swipe moves on touch screens, a click beside the photo closes. */
  var lb = null;
  function lightboxUi() {
    if (lb) return lb;
    var svg = function (d) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var box = document.createElement('div');
    box.className = 'lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo');
    box.setAttribute('data-lenis-prevent', '');
    box.innerHTML =
      '<figure class="lb__stage"><img class="lb__img" alt=""><figcaption class="lb__cap"></figcaption></figure>' +
      '<p class="lb__count" aria-live="polite"></p>' +
      '<button type="button" class="lb__btn lb__close" aria-label="Close">' + svg('M6 6l12 12M18 6L6 18') + '</button>' +
      '<button type="button" class="lb__btn lb__prev" aria-label="Previous photo">' + svg('M15 5l-7 7 7 7') + '</button>' +
      '<button type="button" class="lb__btn lb__next" aria-label="Next photo">' + svg('M9 5l7 7-7 7') + '</button>';
    document.body.appendChild(box);
    lb = { box: box, img: box.querySelector('.lb__img'), cap: box.querySelector('.lb__cap'), count: box.querySelector('.lb__count'), list: [], at: 0, back: null };
    var show = function (i) {
      var n = lb.list.length;
      lb.at = (i + n) % n;
      var a = lb.list[lb.at], im = a.querySelector('img');
      lb.img.src = a.getAttribute('href') || a.getAttribute('data-src') || (im && (im.currentSrc || im.src)) || '';
      lb.img.alt = (im && im.alt) || '';
      var c = a.getAttribute('data-caption') || (im && im.alt) || '';
      lb.cap.textContent = c;
      lb.cap.hidden = !c;
      lb.count.textContent = (lb.at + 1) + ' / ' + n;
      box.classList.toggle('lb--single', n < 2);
    };
    var close = function () {
      box.hidden = true;
      document.documentElement.classList.remove('lb-open');
      lb.img.removeAttribute('src');
      if (lb.back && lb.back.focus) lb.back.focus();
    };
    lb.open = function (list, i, from) {
      lb.list = list; lb.back = from; show(i);
      box.hidden = false;
      document.documentElement.classList.add('lb-open');
      box.querySelector('.lb__close').focus();
    };
    box.querySelector('.lb__close').addEventListener('click', close);
    box.querySelector('.lb__prev').addEventListener('click', function () { show(lb.at - 1); });
    box.querySelector('.lb__next').addEventListener('click', function () { show(lb.at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb__stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' && lb.list.length > 1) show(lb.at - 1);
      else if (e.key === 'ArrowRight' && lb.list.length > 1) show(lb.at + 1);
      else if (e.key === 'Tab') {                                   /* keep the focus inside the open photo */
        var f = $$(box, 'button').filter(function (b) { return b.offsetParent !== null; });
        e.preventDefault();
        f[(f.indexOf(document.activeElement) + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null || lb.list.length < 2) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(lb.at + (dx < 0 ? 1 : -1));
    });
    return lb;
  }
  function lightbox(root) {
    var onClick = function (e) {
      var a = e.target.closest && e.target.closest('[data-lightbox]');
      if (!a || !root.contains(a) || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var g = a.getAttribute('data-lightbox');
      var list = $$(root, '[data-lightbox]').filter(function (x) { return x.getAttribute('data-lightbox') === g && !x.closest('[hidden]'); });
      lightboxUi().open(list, Math.max(0, list.indexOf(a)), a);
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }

  /* ---------- share: <button data-share data-share-url="project.html?id=12" data-share-title="…" aria-haspopup="menu"> ----------
     On a phone with the system share sheet (Web Share API) the button opens that; elsewhere a small menu, as on
     the production site: WhatsApp, Facebook, X, LinkedIn, Copy link. A relative url is made absolute from the
     page's own address, so the static HTML works on any domain. */
  var BRAND = {
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
    facebook: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z'
  };
  var sm = null;
  function shareMenu() {
    if (sm) return sm;
    var ico = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var el = document.createElement('div');
    el.className = 'share-menu';
    el.hidden = true;
    el.setAttribute('role', 'menu');
    el.innerHTML =
      '<a role="menuitem" data-to="whatsapp" target="_blank" rel="noopener">' + ico(BRAND.whatsapp) + 'WhatsApp</a>' +
      '<a role="menuitem" data-to="facebook" target="_blank" rel="noopener">' + ico(BRAND.facebook) + 'Facebook</a>' +
      '<a role="menuitem" data-to="x" target="_blank" rel="noopener">' + ico(BRAND.x) + 'X</a>' +
      '<a role="menuitem" data-to="linkedin" target="_blank" rel="noopener">' + ico(BRAND.linkedin) + 'LinkedIn</a>' +
      '<button type="button" role="menuitem" data-to="copy"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg><span>Copy link</span></button>';
    document.body.appendChild(el);
    sm = { el: el, from: null, url: '' };
    sm.hide = function (refocus) {
      if (el.hidden) return;
      el.hidden = true;
      if (sm.from) { sm.from.setAttribute('aria-expanded', 'false'); if (refocus) sm.from.focus(); }
    };
    document.addEventListener('click', function (e) { if (!el.contains(e.target) && !(sm.from && sm.from.contains(e.target))) sm.hide(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sm.hide(true); });
    window.addEventListener('scroll', function () { sm.hide(false); }, { passive: true });
    window.addEventListener('resize', function () { sm.hide(false); });
    el.querySelector('[data-to="copy"]').addEventListener('click', function () {
      var t = this.querySelector('span');
      var done = function () { t.textContent = 'Link copied'; setTimeout(function () { t.textContent = 'Copy link'; sm.hide(true); }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sm.url).then(done, function () {});
    });
    return sm;
  }
  function share(root) {
    var onClick = function (e) {
      var b = e.target.closest && e.target.closest('[data-share]');
      if (!b || !root.contains(b)) return;
      e.preventDefault();
      e.stopPropagation();
      var url = new URL(b.getAttribute('data-share-url') || location.href, location.href).href;
      var title = b.getAttribute('data-share-title') || document.title;
      if (navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        navigator.share({ title: title, url: url }).catch(function () {});
        return;
      }
      var m = shareMenu();
      if (!m.el.hidden && m.from === b) { m.hide(true); return; }
      m.hide(false);
      m.from = b; m.url = url;
      var enc = encodeURIComponent;
      var to = { whatsapp: 'https://wa.me/?text=' + enc(title + ' ' + url), facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url),
                 x: 'https://x.com/intent/post?text=' + enc(title) + '&url=' + enc(url), linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url) };
      $$(m.el, 'a[data-to]').forEach(function (a) { a.href = to[a.getAttribute('data-to')]; });
      m.el.hidden = false;
      b.setAttribute('aria-expanded', 'true');
      /* under the button (above it near the bottom of the screen), kept inside the screen */
      var r = b.getBoundingClientRect(), w = m.el.offsetWidth, h = m.el.offsetHeight;
      m.el.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
      m.el.style.top = Math.max(8, r.bottom + 8 + h > innerHeight - 8 ? r.top - h - 8 : r.bottom + 8) + 'px';
      m.el.querySelector('a').focus();
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }

  function mount(root) {
    root = root || document;
    var stopReveal = reveal(root), stopCounts = counts(root), stopGlow = glow(root), stopLightbox = lightbox(root), stopShare = share(root);
    tabs(root);
    filters(root);
    forms(root);
    return function () { stopReveal(); stopCounts(); stopGlow(); stopLightbox(); stopShare(); };
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
