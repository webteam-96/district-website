/* Wheel: the live rid3141 home page (banner + ad, snapshot, dignitaries,
   calendar, newsletters) in a Swiss, geometric system: a strict 12-column
   grid, flat Rotary Blue blocks on white, Space Grotesk, and the Rotary wheel
   as the motif. A big outline wheel turns as the page scrolls (the footer's
   turns the other way, like meshing gears), the Join cog turns one tooth on
   hover, buttons fill from wherever the cursor comes in, cards snap into the
   grid and club-event cards flip in.
   ponytail: markup is built with template strings from our own content.js;
   calendar rows come from member records, so those go through esc(). */
(function () {
  const C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const img = (src, alt, extra = '') => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" data-fade ${extra}>`;
  const svg = (paths, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const use = (id, cls) => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const ext = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
  const tel = (p) => p.replace(/\s/g, '');
  const cssUrl = (u) => String(u).replace(/'/g, '%27').replace(/ /g, '%20');

  const P = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    cake: '<path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16c2 1 3-1 4.5 0s2.5 1 3.5 0 2.5-1 3.5 0 2.5 1 2.5 0M12 12V8M12 5.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5z"/>',
    rings: '<circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="M10 5l2-2 2 2"/>',
    facebook: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3.5h2V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10 9v6l5-3z"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5V17M7.5 7.2v.1M11.5 17v-6.5M11.5 13.5c0-2 1.2-3 2.6-3s2.4 1 2.4 3V17"/>',
    // snapshot metrics (same icons as the live site)
    projects: '<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/>',
    hours: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    cost: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    beneficiaries: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    clubs: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4"/>',
    members: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  };
  const ic = (k, cls) => svg(P[k] || '', cls);
  const initials = (name) => (name || '?').replace(/&.*$/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const stat = (k) => C.stats.find((s) => s.key === k);
  const pad2 = (n) => String(n).padStart(2, '0');
  const gridLines = () => `<div class="wrap grid-lines">${'<i></i>'.repeat(12)}</div>`;

  // Section heading on a ruled line: title on the left, intro and action on the right.
  const head = (id, title, intro = '', action = '') => `
    <header class="sec-head g12" data-reveal="wipe">
      <h2 id="${id}-h" data-reveal="lines">${title}</h2>
      ${intro || action ? `<div class="sec-side" data-reveal="up" style="--i:2">${intro ? `<p>${intro}</p>` : ''}${action}</div>` : ''}
    </header>`;
  const btn = (label, href, cls, icon = 'arrow', aria = '') =>
    `<a class="btn ${cls}" href="${href}"${ext(href)}${aria ? ` aria-label="${aria}"` : ''}><span>${label}</span>${icon ? ic(icon) : ''}</a>`;
  // The main call to action: a gold cog that turns one tooth on hover.
  const joinBtn = (j) => `<a class="btn btn-blue btn-join" href="${j.href}"${ext(j.href)}>${use('cog', 'cog')}<span>${j.label}</span></a>`;

  /* ---------------- header / menu ---------------- */
  function renderChrome() {
    const s = C.site, join = C.headerCtas[0], admin = C.headerCtas[1];
    const brand = $('#brand');
    brand.href = s.live + '/';
    brand.setAttribute('aria-label', `${s.name}, home`);
    brand.innerHTML = `<img src="${s.logo}" alt="" width="199" height="74">`;
    $('#topbar').innerHTML = `
      <p class="tb-place">${ic('pin')}<b>${s.name}</b><span>${s.region}</span></p>
      <div class="tb-links">
        <a href="mailto:${s.email}">${ic('mail')}<span>${s.email}</span></a>
        <a href="tel:${tel(s.phone)}">${ic('phone')}<span>${s.phone}</span></a>
        <a href="${admin.href}" target="_blank" rel="noopener">${ic('lock')}<span>${admin.label}</span></a>
        <label class="tb-year"><span>Rotary year</span>
          <select aria-label="Rotary year">${s.years.map((y) => `<option${y === s.year ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>`;
    $('#nav').innerHTML = C.nav.map((n, i) => `<li><a href="${n.href}"${ext(n.href)}${i === 0 ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
    $('#header-actions').innerHTML = joinBtn(join);
    $('#menu').innerHTML = `
      <nav aria-label="Mobile"><ol role="list">${C.nav.map((n, i) => `<li style="--i:${i}"><a href="${n.href}"${ext(n.href)}><span>${n.label}</span>${ic('arrowUR')}</a></li>`).join('')}</ol></nav>
      <div class="menu-foot">
        ${joinBtn(join)}
        ${btn(admin.label, admin.href, 'btn-line', 'lock')}
        <p><a href="mailto:${s.email}">${ic('mail')}${s.email}</a><a href="tel:${tel(s.phone)}">${ic('phone')}${s.phone}</a></p>
      </div>`;
  }

  /* ---------------- 1. hero: the banner on the grid, a blue block behind, the ad on the block ---------------- */
  function hero() {
    const h = C.hero, ad = h.ads[0];
    const adImg = ad ? `<img src="${ad.image}" alt="${ad.alt}" decoding="async" data-fade>` : '';
    return `
    <section class="hero" id="top" aria-labelledby="hero-h">
      <h1 id="hero-h" class="sr-only">${C.site.name}</h1>
      <div class="wrap g12 hero-grid${ad ? '' : ' no-ad'}">
        <div class="banner" role="region" aria-roledescription="carousel" aria-label="District banners" data-reveal="up">
          <span class="blue-block" aria-hidden="true"></span>
          <div class="frame">
            ${h.slides.map((s, i) => `<figure class="slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}">
              <img src="${s.image}" alt="${s.alt}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-fade></figure>`).join('')}
          </div>
          <div class="hero-ctrl">
            <button type="button" class="circ" data-slide="prev" aria-label="Previous banner">${ic('prev')}</button>
            <button type="button" class="circ" data-slide="next" aria-label="Next banner">${ic('next')}</button>
            <button type="button" class="btn btn-line btn-sm" data-view><span>View all banners</span>${ic('eye')}</button>
          </div>
        </div>
        ${ad ? `<aside class="ad" data-reveal="up" style="--i:3" aria-label="${ad.badge || 'Advertisement'}">
          ${ad.badge ? `<span class="ad-badge">${ad.badge}</span>` : ''}
          ${ad.href ? `<a href="${ad.href}"${ext(ad.href)}>${adImg}</a>` : adImg}
        </aside>` : ''}
      </div>
    </section>`;
  }

  /* ---------------- 2. snapshot: a blue and white checkerboard ---------------- */
  function stats() {
    const p = stat('projects');
    // each tile starts a little off its cell, then snaps onto the grid
    const off = [[-28, 18], [0, 30], [28, 18], [-28, -14], [0, -26], [28, -14]];
    return `<section class="sec snap" id="stats" aria-labelledby="stats-h"><div class="wrap">
      ${head('stats', 'District Snapshot', `Rotary year <span class="nw">${C.site.year}</span> in numbers.`, btn('All club projects', p.href, 'btn-line btn-sm', 'arrowUR'))}
      <ul class="board" role="list" data-reveal="snap">
        ${C.stats.map((s, i) => {
          const txt = (s.prefix || '') + U.num(s.value, s.decimals || 0) + (s.suffix || '');
          return `<li class="stat" style="--i:${i};--sx:${off[i % 6][0]}px;--sy:${off[i % 6][1]}px">
            <span class="stat-top">${ic(s.key)}</span>
            <span><span class="stat-num" data-count="${s.value}" data-decimals="${s.decimals || 0}" data-prefix="${s.prefix || ''}" data-suffix="${s.suffix || ''}">${txt}</span>
            <span class="stat-label">${s.label}</span></span>
          </li>`;
        }).join('')}
      </ul>
    </div></section>`;
  }

  /* ---------------- 3. dignitaries: portrait flush to the card ---------------- */
  function dignitaries() {
    return `<section class="sec digs" id="dignitaries" aria-labelledby="dignitaries-h"><div class="wrap">
      ${head('dignitaries', 'Dignitaries of Rotary', `The leaders guiding Rotary International and District ${C.site.district} in ${C.site.year}.`)}
      <div class="g12 digs-grid" data-reveal="snap">
        ${C.dignitaries.map((d, i) => `
          <article class="dig" style="--i:${i};--sx:${i ? 28 : -28}px;--sy:18px">
            <div class="dig-photo">${img(d.photo, '')}<i class="qc" aria-hidden="true"></i></div>
            <div class="dig-head">
              <p class="dig-role">${d.role}</p>
              <h3>${d.name}</h3>
              <p class="dig-term">${d.term.replace(/(\d{4}-\d{2,4})/g, '<span class="nw">$1</span>')}</p>
            </div>
            <div class="dig-body">
              ${d.bio ? `<p class="dig-bio">${d.bio}</p>` : ''}
              ${btn('Read more', d.href, 'btn-line btn-sm', 'arrow', `Read more about ${d.name}`)}
            </div>
          </article>`).join('')}
      </div>
    </div></section>`;
  }

  /* ---------------- 4. what's happening: month table + agenda + club events by week ---------------- */
  const KIND = {
    'Club Events': { k: 'club', icon: 'people', one: 'Club event' },
    'District Events': { k: 'district', icon: 'flag', one: 'District event' },
    Birthdays: { k: 'birthday', icon: 'cake', one: 'Birthday' },
    Anniversaries: { k: 'anniv', icon: 'rings', one: 'Anniversary' },
  };
  const TAB_K = { All: '', 'Club Events': 'club', 'District Events': 'district', Birthdays: 'birthday', Anniversaries: 'anniv' };

  function calendarSection() {
    const cal = C.calendar;
    const months = Array.from({ length: 12 }, (_, mm) => new Date(2000, mm, 1).toLocaleDateString('en-IN', { month: 'long' }));
    return `<section class="sec cal-sec" id="calendar" aria-labelledby="calendar-h"><div class="wrap">
      ${head('calendar', 'What’s happening', `Birthdays, anniversaries and events across District ${C.site.district}. Pick a month, then a day.`)}
      <div class="cal" data-reveal="up">
        <div class="cal-bar on-blue">
          <div class="cal-nav">
            <button type="button" class="circ" data-month="-1" aria-label="Previous month">${ic('prev')}</button>
            <label class="pick"><span class="sr-only">Month</span><select id="cal-m">${months.map((mn, i) => `<option value="${i + 1}">${mn}</option>`).join('')}</select></label>
            <label class="pick"><span class="sr-only">Year</span><select id="cal-y">${cal.years.map((yy) => `<option>${yy}</option>`).join('')}</select></label>
            <button type="button" class="circ" data-month="1" aria-label="Next month">${ic('next')}</button>
            <button type="button" class="btn btn-gold btn-sm" data-today><span>Today</span></button>
          </div>
          <div class="chips" role="group" aria-label="Filter the calendar">
            ${cal.tabs.map((t, i) => `<button type="button" class="chip${TAB_K[t] ? ' k-' + TAB_K[t] : ''}" aria-pressed="${i === 0}" data-tab="${t}">${TAB_K[t] ? '<i></i>' : ''}<span>${t === 'All' ? 'All' : t.replace(' Events', '')}</span><b>0</b></button>`).join('')}
          </div>
        </div>
        <div class="cal-body">
          <div class="month-wrap">
            <div class="dow" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span>${d}</span>`).join('')}</div>
            <div class="month" id="month" role="group" aria-label="Days of the month" aria-busy="true"></div>
            <ul class="legend" role="list">${Object.values(KIND).map((v) => `<li class="k-${v.k}"><i></i>${v.one}</li>`).join('')}<li class="lg-today"><i>${Number(cal.today.slice(8))}</i>Today</li></ul>
          </div>
          <div class="agenda"><div class="agenda-scroll" id="agenda" data-lenis-prevent></div></div>
        </div>
        <p class="sr-only" id="day-status" aria-live="polite"></p>
      </div>
      <div class="weeks-wrap">
        <h3 class="weeks-head" id="ev-h">Club events</h3>
        <ol class="weeks" id="weeks" role="list"></ol>
      </div>
    </div></section>`;
  }

  /* ---------------- 5. newsletters: the GML notice + document covers ---------------- */
  function newsletters() {
    const n = C.news;
    return `<section class="sec news" id="newsletters" aria-labelledby="newsletters-h"><div class="wrap">
      ${head('newsletters', 'Newsletters', `The Governor’s Monthly Letter and the latest bulletins from clubs across District ${C.site.district}.`, btn('All newsletters', n.clubHref, 'btn-line btn-sm', 'arrowUR'))}
      <a class="gml" href="${n.gmlHref}"${ext(n.gmlHref)} data-reveal="up">
        <span class="gml-ic">${ic('mail')}</span>
        <span class="gml-txt"><strong>Governor’s Monthly Letter</strong><small>${n.gml.length ? `${n.gml.length} letters in ${C.site.year}` : `No letter published for ${C.site.year} yet. Earlier letters are on the Newsletters page.`}</small></span>
        <span class="gml-go">See letters${ic('arrowUR')}</span>
      </a>
      <ul class="covers" role="list" data-reveal="snap">
        ${n.bulletins.map((b, i) => {
          const d = new Date(b.date + 'T00:00:00');
          return `<li class="cover${i === 0 ? ' is-latest' : ''}" style="--i:${i};--sx:0px;--sy:${22 + (i % 4) * 8}px"><article class="cv">
            <p class="cv-date"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></p>
            ${i === 0 ? '<span class="cv-tag">Latest bulletin</span>' : ''}
            <h3>${b.title}</h3>
            <p class="cv-club">${b.club}</p>
            <div class="cv-act">
              <button type="button" class="circ circ-sm" data-preview="${i}" aria-label="Preview ${b.title}">${ic('eye')}</button>
              <a class="circ circ-sm" href="${b.pdf}" target="_blank" rel="noopener" aria-label="Download ${b.title} (PDF)">${ic('download')}</a>
            </div>
          </article></li>`;
        }).join('')}
      </ul>
    </div></section>`;
  }

  function footer() {
    const f = C.footer, s = C.site;
    const col = (title, links, social) => `<div class="f-col"><h2>${title}</h2><ul role="list">${links.map((l) =>
      `<li><a href="${l.href}"${ext(l.href)}>${social ? ic(l.platform) : ''}<span>${l.label}</span>${ic('arrowUR')}</a></li>`).join('')}</ul></div>`;
    $('#footer').innerHTML = `
      <div class="f-lines" aria-hidden="true">${gridLines()}</div>
      ${use('wheel', 'f-wheel')}
      <div class="wrap g12 f-main">
        <div class="f-brand">
          <a class="f-logo" href="${s.live}/" aria-label="${s.name}, home"><img src="${s.logoReversed}" alt="" width="199" height="74"></a>
          <p class="f-visits" data-reveal="up"><b data-count="${f.visits}">${U.num(f.visits)}</b><span>Website visitors</span></p>
        </div>
        <nav class="f-cols" aria-label="Footer">${col('Rotary Links', f.rotaryLinks)}${col('Quick Links', f.quickLinks)}${col('Social Media Links', f.social, true)}</nav>
      </div>
      <div class="f-bottom"><div class="wrap f-bottom-in">
        <p>${f.copyright}</p>
        <p class="f-power">Powered by <b>${f.poweredBy}</b></p>
      </div></div>`;
  }

  /* ---------------- behaviour ---------------- */
  // Every banner, uncropped, in a popup with arrows (and ←/→ keys).
  function bannerGallery(start) {
    const sl = C.hero.slides;
    let k = start;
    U.dialog(`<figure class="gallery">
      <div class="gal-stage">${sl.map((s, n) => `<img src="${s.image}" alt="${s.alt}" class="${n === k ? 'is-active' : ''}">`).join('')}</div>
      <button type="button" class="gal-nav prev" aria-label="Previous banner">${ic('prev')}</button>
      <button type="button" class="gal-nav next" aria-label="Next banner">${ic('next')}</button>
      <figcaption><span class="gal-cap">${sl[k].alt}</span><span class="gal-count">${k + 1} / ${sl.length}</span></figcaption>
    </figure>`, 'District banners');
    const d = document.querySelector('dialog.lightbox:last-of-type');
    const show = (n) => {
      k = (n + sl.length) % sl.length;
      $$('.gal-stage img', d).forEach((im, j) => im.classList.toggle('is-active', j === k));
      $('.gal-cap', d).textContent = sl[k].alt;
      $('.gal-count', d).textContent = `${k + 1} / ${sl.length}`;
    };
    $('.prev', d).addEventListener('click', () => show(k - 1));
    $('.next', d).addEventListener('click', () => show(k + 1));
    d.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(k - 1); if (e.key === 'ArrowRight') show(k + 1); });
  }

  // Banner slideshow: every 5 s the next banner wipes in behind a gold edge,
  // from the side you're heading to; hovering or focusing holds it. Reduced
  // motion: no autoplay, no wipe. Clicking the banner opens them all.
  function carousel() {
    const root = $('.banner'), frame = $('.frame', root), slides = $$('.slide', root);
    const n = slides.length, DUR = 5000, playing = !U.reduced && n > 1;
    let i = 0, held = false, timer, settle;
    const arm = () => { clearTimeout(timer); if (playing && !held) timer = setTimeout(() => go(i + 1, 1), DUR); };
    const go = (k, dir) => {
      const prev = i;
      i = (k + n) % n;
      if (i !== prev) {
        slides.forEach((s, x) => {
          s.classList.toggle('is-active', x === i);
          s.classList.toggle('is-prev', x === prev && !U.reduced);
          s.setAttribute('aria-hidden', String(x !== i));
        });
        if (!U.reduced) {
          frame.classList.remove('is-wiping', 'dir-l', 'dir-r');
          void frame.offsetWidth;
          frame.classList.add('is-wiping', dir < 0 ? 'dir-l' : 'dir-r');
          clearTimeout(settle);
          settle = setTimeout(() => { frame.classList.remove('is-wiping'); slides[prev].classList.remove('is-prev'); }, 950);
        }
      }
      arm();
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slide],[data-view]');
      if (!b) { if (e.target.closest('.frame')) bannerGallery(i); return; }
      if (b.dataset.view !== undefined) return bannerGallery(i);
      const d = b.dataset.slide === 'next' ? 1 : -1;
      go(i + d, d);
    });
    ['pointerenter', 'focusin'].forEach((ev) => root.addEventListener(ev, () => { held = true; clearTimeout(timer); }));
    ['pointerleave', 'focusout'].forEach((ev) => root.addEventListener(ev, () => { held = false; arm(); }));
    arm();
  }

  // A blue block slides behind the hovered nav link (its text turns white) and
  // settles back on the current page.
  function navIndicator() {
    const nav = $('.nav'), ul = $('#nav'), ind = $('.nav-ind', nav);
    let lit = null;
    const to = (a) => {
      if (!a) return;
      const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      ind.style.width = r.width + 'px';
      ind.style.transform = `translateX(${r.left - nr.left}px)`;
      ind.style.opacity = 1;
      if (lit !== a) { if (lit) lit.classList.remove('is-lit'); a.classList.add('is-lit'); lit = a; }
    };
    const home = () => to($('a[aria-current]', ul));
    ul.addEventListener('pointerover', (e) => to(e.target.closest('a')));
    ul.addEventListener('focusin', (e) => to(e.target.closest('a')));
    ul.addEventListener('pointerleave', home);
    ul.addEventListener('focusout', home);
    if (document.fonts) document.fonts.ready.then(home); else home();
    window.addEventListener('resize', home);
  }

  // Buttons fill with a circle that grows from wherever the cursor came in and
  // shrinks back out towards wherever it leaves. Touch gets a plain :active fill.
  function radialButtons() {
    if (U.touch) return;
    const at = (b, e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--x', `${e.clientX - r.left}px`);
      b.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.btn');
      if (!b || b.contains(e.relatedTarget)) return;
      at(b, e); void b.offsetWidth; b.classList.add('is-hot');
    });
    document.addEventListener('pointerout', (e) => {
      const b = e.target.closest('.btn');
      if (!b || b.contains(e.relatedTarget)) return;
      at(b, e); b.classList.remove('is-hot');
    });
  }

  // The big wheel turns about once from the top of the page to the bottom; the
  // footer's wheel turns the other way, like two meshing gears.
  function wheels() {
    if (U.reduced) return;
    const w = $$('.big-wheel, .f-wheel');
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const deg = (scrollY / max) * 360;
      w.forEach((el, k) => { el.style.transform = `rotate(${(k ? -deg : deg).toFixed(2)}deg)`; });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function calendar() {
    const cal = C.calendar;
    const month = $('#month'), agenda = $('#agenda'), status = $('#day-status'), chips = $('.chips');
    const selM = $('#cal-m'), selY = $('#cal-y'), weeks = $('#weeks'), evH = $('#ev-h');
    const [ty, tm, td] = cal.today.split('-').map(Number);
    let tab = 'All', y = ty, m = tm, sel = td, entries = [], req = 0, weekIO = null;
    const TYPE = { B: 'Birthdays', A: 'Anniversaries' };
    const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    const isToday = (d) => y === ty && m === tm && d === td;
    const monthName = () => new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const dayLong = (d) => new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

    // Birthdays/anniversaries recur yearly, so each month's file is loaded once
    // and reused for every year. Dated events come from content.js.
    const loadMonth = (mm) => new Promise((resolve) => {
      if (window.CAL_MONTHS && window.CAL_MONTHS[mm]) return resolve(window.CAL_MONTHS[mm]);
      const sc = document.createElement('script');
      sc.src = cal.dataPath + pad2(mm) + '.js';
      sc.onload = () => resolve((window.CAL_MONTHS || {})[mm] || []);
      sc.onerror = () => resolve([]);
      document.head.appendChild(sc);
    });
    const monthEntries = (rows) => {
      const key = y + '-' + pad2(m);
      const people = rows.map(([t, d, name, sub, photo]) => ({ tab: TYPE[t], day: d, name, sub, photo }));
      const evs = cal.events.filter((e) => e.date.startsWith(key)).map((e) => ({ ...e, day: +e.date.slice(8, 10), time: fmtTime(e.date) }));
      return evs.concat(people);
    };
    const visible = () => entries.filter((e) => tab === 'All' || e.tab === tab);

    // The month as a ruled table: each day shows its date, how many events it
    // has, and a bar split by what is on that day.
    const drawMonth = (focus) => {
      const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
      const lead = (first.getDay() + 6) % 7, trail = (7 - ((lead + days) % 7)) % 7;
      const byDay = {};
      visible().forEach((e) => { const o = byDay[e.day] = byDay[e.day] || { club: 0, district: 0, birthday: 0, anniv: 0 }; o[KIND[e.tab].k]++; });
      const pad = '<span class="m-pad" aria-hidden="true"></span>';
      month.innerHTML = pad.repeat(lead) + Array.from({ length: days }, (_, k) => {
        const d = k + 1, o = byDay[d], wd = new Date(y, m - 1, d).getDay();
        const evn = o ? o.club + o.district : 0, total = o ? evn + o.birthday + o.anniv : 0;
        const words = o ? [evn && plural(evn, 'event', 'events'), o.birthday && plural(o.birthday, 'birthday', 'birthdays'), o.anniv && plural(o.anniv, 'anniversary', 'anniversaries')].filter(Boolean).join(', ') : 'nothing listed';
        const bar = o ? ['club', 'district', 'birthday', 'anniv'].filter((x) => o[x]).map((x) => `<i class="k-${x}" style="--n:${o[x]}"></i>`).join('') : '';
        return `<button type="button" class="dcell${o ? '' : ' empty'}${wd === 0 || wd === 6 ? ' we' : ''}" aria-pressed="${sel === d}"${isToday(d) ? ' aria-current="date"' : ''} data-d="${d}" aria-label="${dayLong(d)}${isToday(d) ? ', today' : ''}: ${words}">
          <span class="d-top"><b class="d-num">${d}</b>${evn ? `<span class="d-ev${o.club ? '' : ' k-district'}">${evn}</span>` : ''}</span>
          <span class="d-foot"><span class="d-bar">${bar}</span>${total ? `<span class="d-total">${total}</span>` : ''}</span></button>`;
      }).join('') + pad.repeat(trail);
      month.removeAttribute('aria-busy');
      if (focus) month.querySelector(`[data-d="${sel}"]`).focus({ preventScroll: true });
    };

    // One look per type: events as tickets with a poster stub, birthdays as
    // shaded rows, anniversaries as outlined rows with a double ring.
    const ticket = (e) => `<li class="k-${KIND[e.tab].k}">
        <span class="tix-img">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : ic(KIND[e.tab].icon)}</span>
        <span class="tix-txt"><span class="tix-club">${esc(e.sub || 'District')}</span><strong>${esc(e.name)}</strong>
          <small>${e.time ? `<span>${ic('clock')}${e.time}</span>` : ''}${e.venue ? `<span>${ic('pin')}${esc(e.venue)}</span>` : ''}</small></span></li>`;
    const person = (e) => `<li class="k-${KIND[e.tab].k}">
        <span class="ava">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : `<span class="ini">${initials(e.name)}</span>`}<i>${ic(KIND[e.tab].icon)}</i></span>
        <span class="pp-txt"><strong>${esc(e.name)}</strong><small>${esc(e.sub)}</small></span></li>`;

    const drawDay = () => {
      const rows = entries.filter((e) => e.day === sel);
      const groups = [];
      if (tab === 'All' || /Events/.test(tab)) groups.push({ k: tab === 'District Events' ? 'district' : 'club', t: tab === 'All' ? 'Events' : tab, icon: tab === 'District Events' ? 'flag' : 'people', evt: true, rows: rows.filter((e) => /Events/.test(e.tab) && (tab === 'All' || e.tab === tab)) });
      if (tab === 'All' || tab === 'Birthdays') groups.push({ k: 'birthday', t: 'Birthdays', icon: 'cake', rows: rows.filter((e) => e.tab === 'Birthdays') });
      if (tab === 'All' || tab === 'Anniversaries') groups.push({ k: 'anniv', t: 'Anniversaries', icon: 'rings', rows: rows.filter((e) => e.tab === 'Anniversaries') });
      const shown = groups.filter((g) => g.rows.length);
      const total = shown.reduce((a, g) => a + g.rows.length, 0);
      const max = tab === 'All' ? 9 : 18;
      const date = new Date(y, m - 1, sel), today = isToday(sel);
      agenda.innerHTML = `
        <div class="ag-head">
          <b class="ag-date${today ? ' is-today' : ''}">${sel}</b>
          <span class="ag-txt"><strong>${date.toLocaleDateString('en-IN', { weekday: 'long' })}${today ? '<em>Today</em>' : ''}</strong><span>${monthName()}</span></span>
          <span class="ag-total">${plural(total, 'entry', 'entries')}</span>
        </div>
        ${shown.length ? shown.map((g) => {
          const many = !g.evt && g.rows.length > max;
          return `<section class="grp k-${g.k}" aria-label="${g.t}">
            <h4>${ic(g.icon)}${g.t}<b>${g.rows.length}</b></h4>
            <ul role="list" class="${g.evt ? 'tix' : 'ppl ' + (g.k === 'anniv' ? 'an' : 'bd')}${many ? ' clamp' + max : ''}">${g.rows.map(g.evt ? ticket : person).join('')}</ul>
            ${many ? `<button type="button" class="more" data-more aria-expanded="false"><span>Show all ${g.rows.length}</span>${ic('down')}</button>` : ''}
          </section>`;
        }).join('') : `<p class="ag-empty">${ic('cal')}Nothing ${tab === 'All' ? '' : 'in ' + tab.toLowerCase() + ' '}on this day. Pick a day with a coloured bar.</p>`}`;
      agenda.scrollTop = 0;
      status.textContent = `${dayLong(sel)}: ${plural(total, 'entry', 'entries')}`;
    };

    const drawCounts = () => $$('.chip', chips).forEach((b) => {
      const t = b.dataset.tab;
      b.querySelector('b').textContent = U.num(t === 'All' ? entries.length : entries.filter((e) => e.tab === t).length);
    });

    // Club events of the month, a row per week (Monday to Sunday). Each row's
    // cards flip in when it scrolls into view.
    const evCard = (e, i) => {
      const dt = new Date(y, m - 1, e.day), today = isToday(e.day), past = dt < new Date(ty, tm - 1, td);
      return `<li class="evc k-${KIND[e.tab].k}${past ? ' is-past' : ''}${today ? ' is-today' : ''}" style="--i:${i}">
        <button type="button" class="evc-media" data-jump="${e.day}" aria-label="Show ${dayLong(e.day)} on the calendar">
          ${e.photo ? img(esc(e.photo), '') : `<span class="evc-ph">${ic(KIND[e.tab].icon)}</span>`}
          <span class="evc-date" aria-hidden="true"><b>${e.day}</b><span>${dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span></span>
          <span class="evc-go" aria-hidden="true">${ic('cal')}Show on calendar</span>
        </button>
        <div class="evc-body">
          <p class="evc-club">${esc(e.sub || 'District')}${today ? '<em>Today</em>' : ''}</p>
          <h4>${esc(e.name)}</h4>
          <p class="evc-meta"><span>${ic('clock')}<span><time datetime="${e.date.slice(0, 10)}">${dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</time>, ${e.time}</span></span>${e.venue ? `<span>${ic('pin')}${esc(e.venue)}</span>` : ''}</p>
        </div></li>`;
    };
    const drawWeeks = () => {
      const evs = entries.filter((e) => /Events/.test(e.tab)).sort((a, b) => a.date.localeCompare(b.date));
      const days = new Date(y, m, 0).getDate(), mon = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
      evH.innerHTML = `Club events in ${monthName()} <span>${evs.length}</span>`;
      const groups = [];
      evs.forEach((e) => {
        const start = e.day - ((new Date(y, m - 1, e.day).getDay() + 6) % 7);
        let g = groups[groups.length - 1];
        if (!g || g.start !== start) groups.push(g = { start, rows: [] });
        g.rows.push(e);
      });
      weeks.innerHTML = groups.length ? groups.map((g) => {
        const a = Math.max(1, g.start), b = Math.min(days, g.start + 6);
        return `<li class="wk">
          <p class="wk-label"><b>${a === b ? a : `${a}–${b}`}</b><span>${mon}</span></p>
          <ul class="wk-cards" role="list">${g.rows.map(evCard).join('')}</ul></li>`;
      }).join('') : `<li class="wk-empty">${ic('cal')}No club or district events are listed for ${monthName()}.</li>`;
      U.initImages(weeks);
      if (weekIO) weekIO.disconnect();
      weekIO = U.onInView($$('.wk', weeks), (w) => w.classList.add('is-in'), '0px 0px -12% 0px');
    };

    const selectDay = (d, focus) => {
      sel = d;
      $$('.dcell', month).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === d)));
      drawDay();
      if (focus) month.querySelector(`[data-d="${d}"]`).focus({ preventScroll: true });
    };

    // Switch month (wraps the year); keeps the chosen filter. A newer request wins.
    const show = async (yy, mm, d) => {
      if (mm < 1) { mm = 12; yy--; } else if (mm > 12) { mm = 1; yy++; }
      if (yy < cal.years[0] || yy > cal.years[cal.years.length - 1]) return;
      y = yy; m = mm; selM.value = m; selY.value = y;
      month.setAttribute('aria-busy', 'true');
      const mine = ++req, rows = await loadMonth(m);
      if (mine !== req) return;
      entries = monthEntries(rows);
      const days = new Date(y, m, 0).getDate();
      sel = Math.min(d || (y === ty && m === tm ? td : (entries.find((e) => /Events/.test(e.tab)) || entries[0] || { day: 1 }).day), days);
      drawCounts(); drawMonth(); drawDay(); drawWeeks();
      const c = $('.cal'); c.classList.remove('turn'); void c.offsetWidth; c.classList.add('turn');
    };

    month.addEventListener('click', (e) => { const b = e.target.closest('.dcell'); if (b) selectDay(+b.dataset.d); });
    month.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      selectDay(Math.min(new Date(y, m, 0).getDate(), Math.max(1, sel + step)), true);
    });
    $$('[data-month]').forEach((b) => b.addEventListener('click', () => show(y, m + +b.dataset.month)));
    selM.addEventListener('change', () => show(y, +selM.value));
    selY.addEventListener('change', () => show(+selY.value, m));
    $('[data-today]').addEventListener('click', () => show(ty, tm, td));
    // A chip fills from the point you pressed (its centre for the keyboard) and its count pops.
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      const r = b.getBoundingClientRect();
      b.style.setProperty('--x', `${e.detail ? e.clientX - r.left : r.width / 2}px`);
      b.style.setProperty('--y', `${e.detail ? e.clientY - r.top : r.height / 2}px`);
      void b.offsetWidth;
      tab = b.dataset.tab;
      $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      drawMonth(); drawDay();
    });
    agenda.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]'); if (!b) return;
      const ul = b.previousElementSibling, cls = [...ul.classList].find((c) => /^clamp\d+$/.test(c)) || ul.dataset.clamp;
      if (cls) { ul.dataset.clamp = cls; ul.classList.toggle(cls); }
      const open = !ul.classList.contains(ul.dataset.clamp);
      b.setAttribute('aria-expanded', String(open));
      b.querySelector('span').textContent = open ? 'Show fewer' : `Show all ${ul.children.length}`;
    });
    // A member photo that 404s falls back to initials, like a missing one.
    agenda.addEventListener('error', (e) => {
      const im = e.target; if (im.tagName !== 'IMG') return;
      const li = im.closest('li');
      im.outerHTML = li.closest('.tix') ? ic('people') : `<span class="ini">${initials(li.querySelector('strong').textContent)}</span>`;
    }, true);
    // "Show on calendar": select that day and bring the calendar into view.
    weeks.addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump]'); if (!b) return;
      selectDay(+b.dataset.jump);
      const c = $('.cal'), top = c.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) {
        if (U.lenis) U.lenis.scrollTo(c, { offset: -90 });
        else window.scrollTo({ top: top + window.scrollY - 90, behavior: U.reduced ? 'auto' : 'smooth' });
      }
      c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1100);
    });
    show(ty, tm, td);
  }

  function pdfPreview() {
    $('#newsletters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preview]'); if (!b) return;
      const n = C.news.bulletins[+b.dataset.preview];
      U.dialog(`<div class="pdf-box"><div class="pdf-bar"><span><strong>${n.title}</strong><small>${n.club}, ${U.fmtDate(n.date)}</small></span>
        <a class="btn btn-gold btn-sm" href="${n.pdf}" target="_blank" rel="noopener"><span>Download</span>${ic('download')}</a></div>
        <iframe src="${n.pdf}" title="${n.title}"></iframe></div>`, n.title + ' preview');
    });
  }

  /* ---------------- go ---------------- */
  renderChrome();
  $('#main').innerHTML = [hero(), stats(), dignitaries(), calendarSection(), newsletters()].join('');
  footer();
  carousel(); calendar(); pdfPreview(); navIndicator(); radialButtons(); wheels();
  U.boot({ theme: 'wheel' });
})();
