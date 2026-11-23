/* HeroCarousel — vanilla port of home/HeroCarousel.tsx.
   Infinite-loop CSS translateX carousel: clone-last-prepended + clone-first-appended,
   700ms ease-out, seamless snap on transitionend, forward autoplay, pause on hover,
   dot indicators, optional badge. No arrows on the home page. Respects reduced-motion.

   initHeroCarousel(container, {
     slides: [{ image, alt, href? }],
     autoplayMs = 5000,   // 0 disables
     badge = '',          // e.g. "Advertisement"
     label = '',          // aria-label
     fit = 'contain',     // 'contain' | 'cover'
     arrows = false,
   }) -> { destroy() }
*/
export function initHeroCarousel(container, opts) {
  opts = opts || {};
  var slides = opts.slides || [];
  var autoplayMs = opts.autoplayMs != null ? opts.autoplayMs : 5000;
  var badge = opts.badge || '';
  var label = opts.label || '';
  var fit = opts.fit || 'contain';
  var arrows = !!opts.arrows;

  var count = slides.length;
  var loop = count > 1;
  var reduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // container is the sized viewport div; add carousel chrome classes.
  container.classList.add(
    'relative', 'overflow-hidden', 'rounded-2xl', 'bg-white', 'shadow-card', 'ring-1', 'ring-divider/40'
  );
  container.setAttribute('role', 'region');
  container.setAttribute('aria-roledescription', 'carousel');
  if (label) container.setAttribute('aria-label', label);
  container.innerHTML = '';

  // Build the track item list (with clones when looping).
  var items = loop ? [slides[count - 1]].concat(slides, [slides[0]]) : slides.slice();

  var track = document.createElement('div');
  track.className = 'flex h-full';
  var anim = true;
  var pos = loop ? 1 : 0;

  items.forEach(function (slide, i) {
    var cell;
    if (slide.href) {
      cell = document.createElement('a');
      cell.href = slide.href;
      cell.target = '_blank';
      cell.rel = 'noopener';
      if (slide.alt) cell.setAttribute('aria-label', slide.alt);
    } else {
      cell = document.createElement('div');
    }
    cell.className = 'h-full w-full shrink-0';
    var img = document.createElement('img');
    img.src = slide.image;
    img.alt = slide.alt || '';
    img.loading = i <= 1 ? 'eager' : 'lazy';
    img.className = 'h-full w-full ' + (fit === 'contain' ? 'object-contain' : 'object-cover');
    // If a real banner image fails to load (e.g. media host 404), swap to its
    // default rather than showing a broken image.
    if (slide.fallback) {
      img.onerror = function () { this.onerror = null; this.src = slide.fallback; };
    }
    cell.appendChild(img);
    track.appendChild(cell);
  });
  container.appendChild(track);

  function applyTransform() {
    track.style.transform = 'translateX(-' + pos * 100 + '%)';
  }
  function setAnim(on) {
    anim = on;
    track.className = 'flex h-full' + (on ? ' transition-transform duration-700 ease-out' : '');
  }
  setAnim(true);
  applyTransform();

  function realIndex() {
    return loop ? (pos - 1 + count) % count : pos;
  }

  function go(n) {
    setAnim(true);
    pos = n;
    applyTransform();
    updateDots();
  }
  function next() {
    go(pos + 1);
  }
  function goToReal(i) {
    go(loop ? i + 1 : i);
  }

  // Seamless wrap.
  track.addEventListener('transitionend', function () {
    if (!loop) return;
    if (pos === count + 1) {
      setAnim(false);
      pos = 1;
      applyTransform();
      void track.offsetWidth; // reflow
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setAnim(true);
        });
      });
    } else if (pos === 0) {
      setAnim(false);
      pos = count;
      applyTransform();
      void track.offsetWidth;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setAnim(true);
        });
      });
    }
    updateDots();
  });

  // Badge.
  if (badge) {
    var b = document.createElement('span');
    b.className =
      'pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90';
    b.textContent = badge;
    container.appendChild(b);
  }

  // Arrows (not used on home).
  if (arrows && loop) {
    var prevB = document.createElement('button');
    prevB.type = 'button';
    prevB.setAttribute('aria-label', 'Previous slide');
    prevB.className =
      'absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-bluedark shadow transition hover:bg-white';
    prevB.innerHTML =
      '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
    prevB.addEventListener('click', function () {
      go(pos - 1);
    });
    var nextB = document.createElement('button');
    nextB.type = 'button';
    nextB.setAttribute('aria-label', 'Next slide');
    nextB.className =
      'absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-bluedark shadow transition hover:bg-white';
    nextB.innerHTML =
      '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    nextB.addEventListener('click', next);
    container.appendChild(prevB);
    container.appendChild(nextB);
  }

  // Dots.
  var dotsWrap = null;
  var dotEls = [];
  if (loop) {
    dotsWrap = document.createElement('div');
    dotsWrap.className = 'absolute inset-x-0 bottom-4 flex justify-center gap-2';
    for (var i = 0; i < count; i++) {
      (function (idx) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
        dot.className = 'h-2.5 rounded-full transition-all';
        dot.addEventListener('click', function () {
          goToReal(idx);
        });
        dotEls.push(dot);
        dotsWrap.appendChild(dot);
      })(i);
    }
    container.appendChild(dotsWrap);
  }

  function updateDots() {
    if (!dotsWrap) return;
    var ri = realIndex();
    dotEls.forEach(function (dot, i) {
      var active = i === ri;
      dot.setAttribute('aria-current', active ? 'true' : 'false');
      dot.className =
        'h-2.5 rounded-full transition-all ' +
        (active ? 'w-6 bg-brand-gold' : 'w-2.5 bg-brand-bluedark/25 hover:bg-brand-bluedark/40');
    });
  }
  updateDots();

  // Autoplay.
  var paused = false;
  var timer = null;
  function autoplayActive() {
    return loop && autoplayMs && !reduce;
  }
  function startTimer() {
    if (!autoplayActive()) return;
    stopTimer();
    timer = window.setInterval(function () {
      if (!paused) next();
    }, autoplayMs);
  }
  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }
  container.addEventListener('mouseenter', function () {
    paused = true;
  });
  container.addEventListener('mouseleave', function () {
    paused = false;
  });
  startTimer();

  return {
    destroy: function () {
      stopTimer();
      container.innerHTML = '';
    },
  };
}

export default initHeroCarousel;
