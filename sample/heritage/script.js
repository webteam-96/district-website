/* Heritage: the live rid3141 home page (banner + ad, snapshot, dignitaries,
   calendar, newsletters) rendered from window.CONTENT in the heritage design.
   ponytail: markup is built with template strings from our own content.js;
   escape values first if this ever renders admin-authored data live. */
(function () {
  const C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const img = (src, alt, extra = '') => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" data-fade ${extra}>`;
  const svg = (paths, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const ext = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';

  const P = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    pdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    cake: '<path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16c2 1 3-1 4.5 0s2.5 1 3.5 0 2.5-1 3.5 0 2.5 1 2.5 0M12 12V8M12 5.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5z"/>',
    rings: '<circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="M10 5l2-2 2 2"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="m2 13 10 5 10-5"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    play: '<path d="M8 5.5v13l11-6.5z"/>', pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
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
  const arrowBtn = `<span class="arrow-btn" aria-hidden="true">${ic('arrowUR')}</span>`;
  const initials = (name) => (name || '?').replace(/&.*$/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const stat = (k) => C.stats.find((s) => s.key === k);

  const head = (id, label, icon, title, intro = '', action = '') => `
    <header class="sec-head">
      <div>
        <p class="label" data-reveal="up">${ic(icon)}${label}</p>
        <h2 id="${id}-h" data-reveal="lines">${title}</h2>
      </div>
      ${intro || action ? `<div class="sec-head-side" data-reveal="up" style="--i:2">${intro ? `<p>${intro}</p>` : ''}${action}</div>` : ''}
    </header>`;
  const section = (id, cls, inner) => `<section id="${id}" class="sec ${cls}" aria-labelledby="${id}-h"><div class="wrap">${inner}</div></section>`;
  const btn = (label, href, cls, icon = 'arrow') =>
    `<a class="btn ${cls}" href="${href}"${ext(href)}><span>${label}</span>${icon ? ic(icon) : ''}</a>`;

  /* ---------------- header / menu ---------------- */
  function renderChrome() {
    const s = C.site;
    const brand = $('#brand');
    brand.href = s.live + '/';
    brand.innerHTML = `<img class="brand-on-light" src="${s.logo}" alt="Rotary" width="199" height="74"><img class="brand-on-dark" src="${s.logoReversed}" alt="" width="199" height="74">`;
    brand.setAttribute('aria-label', `${s.name}, home`);
    $('#topbar').innerHTML = `
      <p class="tb-place"><span class="tb-ic">${ic('pin')}</span><b>${s.name}</b><span class="tb-sep" aria-hidden="true"></span><span>${s.region}</span></p>
      <div class="topbar-links">
        <a class="tb-link" href="mailto:${s.email}"><span class="tb-ic">${ic('mail')}</span><span>${s.email}</span></a>
        <a class="tb-link" href="tel:${s.phone.replace(/\s/g, '')}"><span class="tb-ic">${ic('phone')}</span><span>${s.phone}</span></a>
        <a class="tb-link topbar-admin" href="${C.headerCtas[1].href}" target="_blank" rel="noopener"><span class="tb-ic">${ic('arrowUR')}</span><span>${C.headerCtas[1].label}</span></a>
        <label class="year"><span class="year-l">${ic('cal')}Rotary year</span>
          <select aria-label="Rotary year">${s.years.map((y) => `<option${y === s.year ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>`;
    $('#nav').innerHTML = C.nav.map((n, i) => `<li><a href="${n.href}"${ext(n.href)}${i === 0 ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('') + '<li class="nav-ind" aria-hidden="true"></li>';
    $('#header-actions').innerHTML = C.headerCtas.map((c) => btn(c.label, c.href, c.primary ? 'btn-gold btn-sm' : 'btn-ghost btn-sm', c.primary ? 'arrow' : '')).join('');
    $('#menu').innerHTML = `
      <nav aria-label="Mobile"><ol role="list">${C.nav.map((n, i) => `<li style="--i:${i}"><a href="${n.href}"${ext(n.href)}><span>0${i + 1}</span>${n.label}</a></li>`).join('')}</ol></nav>
      <div class="menu-foot" style="--i:${C.nav.length}">
        ${C.headerCtas.map((c) => btn(c.label, c.href, c.primary ? 'btn-gold' : 'btn-ghost', c.primary ? 'arrow' : '')).join('')}
        <p><a href="mailto:${s.email}">${ic('mail')}${s.email}</a><a href="tel:${s.phone.replace(/\s/g, '')}">${ic('phone')}${s.phone}</a></p>
      </div>`;
  }

  /* ---------------- 1. banner slideshow (full-bleed) + advertisement ---------------- */
  function hero() {
    const h = C.hero, ad = h.ads[0];
    return `
    <section class="hero" id="top" aria-labelledby="hero-h" role="region" aria-roledescription="carousel">
      <div class="hero-bg" data-hero-bg>
        ${h.slides.map((s, i) => `<figure class="slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}">
          <img src="${s.image}" alt="${s.alt}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-fade></figure>`).join('')}
      </div>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="wrap hero-in">
        <div class="hero-copy">
          <p class="hero-pill" data-reveal="up"><span class="dot"></span>Rotary year ${C.site.year}</p>
          <h1 id="hero-h" data-reveal="lines">${C.site.name}</h1>
          <p class="hero-sub" data-reveal="up" style="--i:3">${U.num(stat('clubs').value)} clubs and ${U.num(stat('members').value)} Rotarians serving ${C.site.region.split(',')[0]} through ${U.num(stat('projects').value)} projects this year.</p>
          <div class="hero-ctas" data-reveal="up" style="--i:4">
            ${btn('Join Rotary', C.headerCtas[0].href, 'btn-gold btn-lg')}
            ${btn('Find a club', C.nav[3].href, 'btn-glass btn-lg')}
          </div>
        </div>
        <div class="hero-ui" data-reveal="up" style="--i:6">
          <div class="segs">${h.slides.map((s, i) => `<button type="button" class="seg" data-go="${i}" aria-label="Show banner ${i + 1}"><i></i></button>`).join('')}</div>
          <p class="hero-cap" aria-live="polite">${h.slides[0].alt}</p>
          <button type="button" class="view-banner" data-view>${ic('eye')}<span>View banners</span></button>
          <div class="hero-btns">
            <button type="button" class="round" data-slide="prev" aria-label="Previous banner">${ic('prev')}</button>
            <button type="button" class="round" data-slide="next" aria-label="Next banner">${ic('next')}</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- 2. district snapshot: one row of six cards over the hero ---------------- */
  function stats() {
    return `<section class="sec-stats" id="stats" aria-labelledby="stats-h">
      <div class="wrap">
        <div class="stats-card" data-reveal="up">
          <div class="stats-top">
            <h2 id="stats-h">District Snapshot <span>${C.site.year}</span></h2>
            <a class="link" href="${stat('projects').href}"${ext(stat('projects').href)}>All club projects ${ic('arrow')}</a>
          </div>
          <ul class="stats" role="list">
            ${C.stats.map((s, i) => {
              const tag = s.href ? 'a' : 'div';
              return `<li><${tag} class="stat tone-${s.key}"${s.href ? ` href="${s.href}"${ext(s.href)}` : ''} style="--i:${i}">
                <span class="stat-ic">${ic(s.key)}</span>
                <span class="stat-num" data-count="${s.value}" data-decimals="${s.decimals || 0}" data-prefix="${s.prefix || ''}" data-suffix="${s.suffix || ''}">${s.prefix || ''}${U.num(s.value, s.decimals || 0)}${s.suffix || ''}</span>
                <span class="stat-label">${s.label}</span>
                <span class="stat-group">${s.group}</span>
              </${tag}></li>`;
            }).join('')}
          </ul>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- 3. dignitaries: glass cards on a navy band ---------------- */
  function dignitaries() {
    return section('dignitaries', 'sec-dignitaries dark', `
      ${head('dignitaries', 'Dignitaries', 'star', 'Dignitaries of Rotary', `The leaders guiding Rotary International and District ${C.site.district} in ${C.site.year}.`)}
      <div class="digs">
        ${C.dignitaries.map((d, i) => `
          <article class="dig" data-reveal="up" style="--i:${i}">
            <div class="dig-top">
              <a class="dig-photo" href="${d.href}"${ext(d.href)} tabindex="-1" aria-hidden="true">
                <svg class="dig-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48"/></svg>
                ${img(d.photo, '')}
              </a>
              <div>
                <span class="dig-role">${d.role}</span>
                <h3><a href="${d.href}"${ext(d.href)}>${d.name}</a></h3>
                <p class="dig-term">${d.term}</p>
              </div>
            </div>
            ${d.bio ? `<p class="dig-bio">${d.bio}</p>` : ''}
            ${btn('Read more', d.href, 'btn-ghost btn-sm')}
          </article>`).join('')}
      </div>`);
  }

  /* ---------------- 4. what's happening: club events + calendar card ---------------- */
  const KIND = {
    'Club Events': { k: 'club', icon: 'people', one: 'Club event' },
    'District Events': { k: 'district', icon: 'flag', one: 'District event' },
    Birthdays: { k: 'birthday', icon: 'cake', one: 'Birthday' },
    Anniversaries: { k: 'anniv', icon: 'rings', one: 'Anniversary' },
  };
  function calendarSection() {
    const cal = C.calendar;
    const months = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleDateString('en-IN', { month: 'long' }));
    return section('calendar', 'sec-calendar tint', `
      ${head('calendar', 'District Calendar', 'cal', 'What’s happening', `Birthdays, anniversaries and events across District ${C.site.district}, date by date. Pick a month and a day to zoom in.`)}
      <div class="calendar" data-reveal="up">
        <div class="cal-main">
          <div class="cal-nav">
            <button type="button" class="round round-light" data-month="-1" aria-label="Previous month">${ic('prev')}</button>
            <label class="cal-pick"><span class="sr-only">Month</span><select id="cal-m">${months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label>
            <label class="cal-pick"><span class="sr-only">Year</span><select id="cal-y">${cal.years.map((y) => `<option>${y}</option>`).join('')}</select></label>
            <button type="button" class="round round-light" data-month="1" aria-label="Next month">${ic('next')}</button>
            <button type="button" class="btn btn-gold btn-sm" data-today>Today</button>
          </div>
          <div class="cal-tabs" role="group" aria-label="Filter the calendar">
            ${cal.tabs.map((t, i) => `<button type="button" class="cal-tab" aria-pressed="${i === 0}" data-tab="${t}">${t === 'All' ? 'All' : t.replace(' Events', '')} <b>0</b></button>`).join('')}
          </div>
          <div class="cal-grid" id="cal-grid" aria-busy="true"></div>
        </div>
        <div class="cal-day" id="cal-day" aria-live="polite" data-lenis-prevent></div>
      </div>
      <div class="club-events">
        <h3 class="col-h" id="ev-h"></h3>
        <ol class="event-list" role="list" id="ev-list"></ol>
      </div>`);
  }

  /* ---------------- 5. newsletters: featured latest bulletin + list ---------------- */
  function newsletters() {
    const n = C.news, [f, ...rest] = n.bulletins;
    return section('newsletters', 'sec-news', `
      ${head('newsletters', 'District Press', 'news', 'Newsletters', '', btn('All newsletters', n.clubHref, 'btn-outline btn-sm'))}
      <div class="news-grid">
        <div class="news-left">
          <article class="feature" data-reveal="up">
            <span class="feature-art" aria-hidden="true"><span class="doc"><i></i><i></i><i></i><i></i></span><span class="doc doc-2"></span></span>
            <div class="feature-body">
              <span class="feature-badge">Latest club bulletin</span>
              <h3>${f.title}</h3>
              <p>${f.club} · <time datetime="${f.date}">${U.fmtDate(f.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
              <div class="feature-actions">
                <button type="button" class="btn btn-gold btn-sm" data-preview="0"><span>Preview</span>${ic('eye')}</button>
                ${btn('Download PDF', f.pdf, 'btn-glass btn-sm', 'download')}
              </div>
            </div>
          </article>
          <a class="gml-note" href="${n.gmlHref}"${ext(n.gmlHref)} data-reveal="up" style="--i:1">
            <span class="gml-ic">${ic('mail')}</span>
            <span><strong>Governor’s Monthly Letter</strong><small>${n.gml.length ? n.gml.length + ' letters' : `None published for ${C.site.year} yet. See earlier letters.`}</small></span>
            ${arrowBtn}
          </a>
        </div>
        <div class="bulletins" data-reveal="up" style="--i:2">
          <h3>Club newsletters <span class="pill">${C.site.year}</span></h3>
          <ul role="list">
            ${rest.map((b, i) => `<li style="--i:${i}">
              <span class="pdf-ic">${ic('pdf')}</span>
              <span class="b-txt"><strong>${b.title}</strong><small>${b.club} · <time datetime="${b.date}">${U.fmtDate(b.date, { day: 'numeric', month: 'short' })}</time></small></span>
              <button type="button" class="icon-btn" data-preview="${i + 1}" aria-label="Preview ${b.title}">${ic('eye')}</button>
              <a class="icon-btn" href="${b.pdf}" target="_blank" rel="noopener" aria-label="Download ${b.title} (PDF)">${ic('download')}</a></li>`).join('')}
          </ul>
        </div>
      </div>`);
  }

  function footer() {
    const f = C.footer, s = C.site;
    const col = (title, links, social) => `<div class="f-col"><h2>${title}</h2><ul role="list"${social ? ' class="f-social"' : ''}>${links.map((l) =>
      `<li><a href="${l.href}"${ext(l.href)}>${social ? `<span class="f-sic">${ic(l.platform)}</span>` : ic('next')}<span>${l.label}</span></a></li>`).join('')}</ul></div>`;
    // Visitor count as odometer tiles: each digit's 0-9 strip rolls into place on reveal.
    const digits = String(f.visits).padStart(6, '0').split('');
    const odo = digits.map((d, i) => `<span class="odo-d"><span class="odo-s" style="--n:${d};--i:${i}">${'0123456789'.split('').map((x) => `<i>${x}</i>`).join('')}</span></span>`).join('');
    $('#footer').innerHTML = `
      <div class="wrap f-grid">
        <div class="f-brand">
          <img src="${s.logoReversed}" alt="Rotary" width="199" height="74">
          <ul class="f-contact" role="list">
            <li><a href="mailto:${s.email}"><span class="f-cic">${ic('mail')}</span>${s.email}</a></li>
            <li><a href="tel:${s.phone.replace(/\s/g, '')}"><span class="f-cic">${ic('phone')}</span>${s.phone}</a></li>
          </ul>
          <div class="odo" data-reveal="up" role="img" aria-label="${U.num(f.visits)} website visitors">
            <span class="odo-l">${ic('eye')}Website visitors</span>
            <span class="odo-row" aria-hidden="true">${odo}</span>
          </div>
        </div>
        ${col('Rotary Links', f.rotaryLinks)}
        ${col('Quick Links', f.quickLinks)}
        ${col('Social Media Links', f.social, true)}
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

  // The district advertisement opens as a popup once the page has loaded.
  function adPopup() {
    const ad = C.hero.ads[0]; if (!ad) return;
    const pic = `<img src="${ad.image}" alt="${ad.alt}">`;
    U.dialog(`<figure class="ad-pop">${ad.href ? `<a href="${ad.href}"${ext(ad.href)}>${pic}</a>` : pic}</figure>`, ad.alt);
  }

  function carousel() {
    const root = $('.hero');
    const slides = $$('.slide', root), segs = $$('.seg', root);
    const cap = $('.hero-cap', root);
    const DUR = 5000; // live site: autoplay 5 s
    // Autoplays unless reduced motion; hovering or focusing the controls holds the slide.
    const playing = !U.reduced;
    let i = 0, t0 = performance.now(), held = false, p = 0;
    const go = (n) => {
      slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden', 'true');
      segs[i].querySelector('i').style.transform = '';
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); slides[i].setAttribute('aria-hidden', 'false');
      segs.forEach((s, k) => s.classList.toggle('done', k < i));
      cap.classList.remove('in'); void cap.offsetWidth;
      cap.textContent = C.hero.slides[i].alt; cap.classList.add('in');
      t0 = performance.now(); p = 0;
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slide],[data-go],[data-view]'); if (!b) return;
      // Banners are admin uploads and may carry text, so the uncropped image is one click away.
      if (b.dataset.view !== undefined) return bannerGallery(i);
      if (b.dataset.go) return go(+b.dataset.go);
      go(i + (b.dataset.slide === 'next' ? 1 : -1));
    });
    const ui = $('.hero-ui', root);
    ui.addEventListener('pointerenter', () => { held = true; });
    ui.addEventListener('pointerleave', () => { held = false; t0 = performance.now() - p * DUR; });
    ui.addEventListener('focusin', () => { held = true; });
    ui.addEventListener('focusout', () => { held = false; t0 = performance.now() - p * DUR; });
    (function tick(now) {
      if (playing && !held) {
        p = Math.min(1, (now - t0) / DUR);
        segs[i].querySelector('i').style.transform = `scaleX(${p})`;
        if (p >= 1) go(i + 1);
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  function calendar() {
    const cal = C.calendar;
    const grid = $('#cal-grid'), list = $('#cal-day'), tabs = $('.cal-tabs');
    const selM = $('#cal-m'), selY = $('#cal-y'), evList = $('#ev-list'), evH = $('#ev-h');
    const [ty, tm, td] = cal.today.split('-').map(Number);
    let tab = 'All', y = ty, m = tm, sel = td, entries = [];
    const MAX = 6; // people per group before "Show all"
    const TYPE = { B: 'Birthdays', A: 'Anniversaries' };
    const pad = (n) => String(n).padStart(2, '0');
    const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

    // Birthdays/anniversaries recur yearly, so each month's file is loaded once and
    // reused for every year. Dated events come from content.js.
    const loadMonth = (mm) => new Promise((resolve) => {
      if (window.CAL_MONTHS && window.CAL_MONTHS[mm]) return resolve(window.CAL_MONTHS[mm]);
      const sc = document.createElement('script');
      sc.src = cal.dataPath + pad(mm) + '.js';
      sc.onload = () => resolve((window.CAL_MONTHS || {})[mm] || []);
      sc.onerror = () => resolve([]);
      document.head.appendChild(sc);
    });
    const monthEntries = (rows) => {
      const key = y + '-' + pad(m);
      const people = rows.map(([t, day, name, sub, photo]) => ({ tab: TYPE[t], day, name, sub, photo }));
      const evs = cal.events.filter((e) => e.date.startsWith(key))
        .map((e) => ({ ...e, day: +e.date.slice(8, 10), time: fmtTime(e.date) }));
      return evs.concat(people);
    };

    const face = (e) => e.photo ? `<img src="${e.photo}" alt="" loading="lazy">` : `<span class="avatar">${initials(e.name)}</span>`;
    // Each type has its own card: events show where and when; people show a badge.
    const evtCard = (e) => `<li class="d-evt">
        <span class="d-evt-img">${e.photo ? `<img src="${e.photo}" alt="" loading="lazy">` : ic(KIND[e.tab].icon)}</span>
        <span class="d-evt-txt"><span class="d-evt-club">${e.sub || 'District'}</span><strong>${e.name}</strong>
          <small>${e.time ? `<span>${ic('clock')}${e.time}</span>` : ''}${e.venue ? `<span>${ic('pin')}${e.venue}</span>` : ''}</small></span></li>`;
    const personCard = (e) => `<li class="d-person"><span class="d-face">${face(e)}<i>${ic(KIND[e.tab].icon)}</i></span>
        <span><strong>${e.name}</strong><small>${e.sub || ''}</small></span></li>`;
    const group = (t, rows) => {
      const k = KIND[t], isEvt = /Events/.test(t), many = !isEvt && rows.length > MAX;
      return `<section class="dg k-${k.k}">
        <h4><span class="dg-ic">${ic(k.icon)}</span>${t}<b>${rows.length}</b></h4>
        <ul role="list" class="${isEvt ? 'd-evts' : 'd-people'}${many ? ' clamp' : ''}">${rows.map(isEvt ? evtCard : personCard).join('')}</ul>
        ${many ? `<button type="button" class="more" data-more aria-expanded="false"><span>Show all ${rows.length}</span>${ic('down')}</button>` : ''}
      </section>`;
    };
    const visible = () => entries.filter((e) => tab === 'All' || e.tab === tab);

    const drawDay = () => {
      const rows = visible().filter((e) => e.day === sel);
      const date = new Date(y, m - 1, sel);
      const isToday = y === ty && m === tm && sel === td;
      list.innerHTML = `<p class="cal-day-h"><span>${date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${isToday ? ' <em>Today</em>' : ''}</span><b>${rows.length}</b></p>` +
        (rows.length ? `<div class="dgs">${Object.keys(KIND).map((t) => [t, rows.filter((e) => e.tab === t)]).filter(([, r]) => r.length).map(([t, r]) => group(t, r)).join('')}</div>`
          : `<p class="empty">${ic('cal')}Nothing ${tab === 'All' ? '' : 'in ' + tab.toLowerCase() + ' '}on this day. Pick a date with a dot.</p>`);
      list.scrollTop = 0;
    };
    const drawGrid = (focus) => {
      const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
      const lead = (first.getDay() + 6) % 7; // Monday first
      const byDay = {};
      visible().forEach((e) => { (byDay[e.day] = byDay[e.day] || new Set()).add(KIND[e.tab].k); });
      grid.innerHTML = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('') +
        '<span></span>'.repeat(lead) +
        Array.from({ length: days }, (_, k) => {
          const d = k + 1, ks = [...(byDay[d] || [])];
          const label = new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          return `<button type="button" class="cal-d${ks.length ? ' has' : ''}${y === ty && m === tm && d === td ? ' today' : ''}" aria-pressed="${sel === d}" data-d="${d}" aria-label="${label}">${d}<span class="dots">${ks.map((x) => `<i class="k-${x}"></i>`).join('')}</span></button>`;
        }).join('');
      if (focus) grid.querySelector(`[data-d="${sel}"]`).focus();
    };
    const drawCounts = () => $$('.cal-tab', tabs).forEach((b) => {
      const t = b.dataset.tab;
      b.querySelector('b').textContent = U.num(t === 'All' ? entries.length : entries.filter((e) => e.tab === t).length);
    });
    const drawEvents = () => {
      const evs = entries.filter((e) => /Events/.test(e.tab)).sort((a, b) => a.date.localeCompare(b.date));
      const name = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      evH.innerHTML = `Club events in ${name} <span>${evs.length}</span>`;
      evList.innerHTML = evs.length ? evs.map((e, i) => {
        const isToday = y === ty && m === tm && e.day === td;
        const past = new Date(y, m - 1, e.day) < new Date(ty, tm - 1, td);
        return `<li class="event pop${isToday ? ' is-today' : ''}${past ? ' is-past' : ''}" style="--i:${Math.min(i, 8)}">
          <span class="event-img">${e.photo ? img(e.photo, '') : `<span class="event-ph">${ic(KIND[e.tab].icon)}</span>`}
            <time datetime="${e.date.slice(0, 10)}"><b>${e.day}</b>${new Date(y, m - 1, e.day).toLocaleDateString('en-IN', { month: 'short' })}</time></span>
          <div class="event-body">
            <span class="event-kind">${isToday ? 'Today · ' : ''}${e.sub || 'District'}</span>
            <h4>${e.name}</h4>
            <p class="event-meta">${e.venue ? `<span>${ic('pin')}${e.venue}</span>` : ''}<span>${ic('clock')}${e.time}</span></p>
          </div>
          <button type="button" class="arrow-btn" data-jump="${e.day}" aria-label="Show ${e.day} ${name} on the calendar">${ic('arrowUR')}</button>
        </li>`;
      }).join('') : `<li class="empty ev-empty">${ic('cal')}No club or district events are listed for ${name}.</li>`;
      U.initImages(evList);
    };

    // Switch month (wraps the year); keeps the chosen tab.
    const show = async (yy, mm, day) => {
      if (mm < 1) { mm = 12; yy--; } else if (mm > 12) { mm = 1; yy++; }
      if (yy < cal.years[0] || yy > cal.years[cal.years.length - 1]) return;
      y = yy; m = mm;
      selM.value = m; selY.value = y;
      grid.setAttribute('aria-busy', 'true'); list.classList.add('is-loading');
      entries = monthEntries(await loadMonth(m));
      grid.removeAttribute('aria-busy'); list.classList.remove('is-loading');
      const days = new Date(y, m, 0).getDate();
      sel = day || (y === ty && m === tm ? td : (entries.find((e) => /Events/.test(e.tab)) || entries[0] || { day: 1 }).day);
      sel = Math.min(sel, days);
      drawCounts(); drawGrid(); drawDay(); drawEvents();
      const c = $('.calendar'); c.classList.remove('turn'); void c.offsetWidth; c.classList.add('turn');
    };

    list.addEventListener('error', (e) => {
      const im = e.target; if (im.tagName !== 'IMG') return;
      const li = im.closest('li');
      im.outerHTML = li.classList.contains('d-evt') ? ic(KIND['Club Events'].icon) : `<span class="avatar">${initials(li.querySelector('strong').textContent)}</span>`;
    }, true);
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]'); if (!b) return;
      const ul = b.previousElementSibling, open = !ul.classList.toggle('clamp');
      b.setAttribute('aria-expanded', String(open));
      b.querySelector('span').textContent = open ? 'Show fewer' : `Show all ${ul.children.length}`;
    });
    grid.addEventListener('click', (e) => { const b = e.target.closest('.cal-d'); if (!b) return; sel = +b.dataset.d; drawGrid(true); drawDay(); });
    $$('[data-month]').forEach((b) => b.addEventListener('click', () => show(y, m + +b.dataset.month)));
    selM.addEventListener('change', () => show(y, +selM.value));
    selY.addEventListener('change', () => show(+selY.value, m));
    $('[data-today]').addEventListener('click', () => show(ty, tm, td));
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('.cal-tab'); if (!b) return;
      tab = b.dataset.tab;
      $$('.cal-tab', tabs).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      drawGrid(); drawDay();
    });
    // An event card's arrow selects its day and brings the calendar into view.
    evList.addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump]'); if (!b) return;
      sel = +b.dataset.jump; drawGrid(); drawDay();
      const c = $('.calendar');
      if (c.getBoundingClientRect().top < 0 || c.getBoundingClientRect().top > innerHeight * 0.6) c.scrollIntoView({ behavior: U.reduced ? 'auto' : 'smooth', block: 'start' });
      c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
    });
    show(ty, tm, td);
  }

  function pdfPreview() {
    $('#newsletters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preview]'); if (!b) return;
      const n = C.news.bulletins[+b.dataset.preview];
      U.dialog(`<div class="pdf-box"><div class="pdf-bar"><span><strong>${n.title}</strong><small>${n.club} · ${U.fmtDate(n.date)}</small></span>
        <a class="btn btn-blue btn-sm" href="${n.pdf}" target="_blank" rel="noopener"><span>Download</span>${ic('download')}</a></div>
        <iframe src="${n.pdf}" title="${n.title}"></iframe></div>`, n.title + ' preview');
    });
  }

  /* ---- micro-interactions ---- */
  function navIndicator() {
    const ul = $('#nav'), ind = $('.nav-ind', ul);
    // a.offsetLeft is relative to its positioned <li>, so add the li's offset within the ul.
    const to = (a) => { if (!a) return; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.parentElement.offsetLeft + a.offsetLeft}px)`; ind.style.opacity = 1; };
    const home = () => to($('a[aria-current]', ul));
    ul.addEventListener('pointerover', (e) => to(e.target.closest('a')));
    ul.addEventListener('focusin', (e) => to(e.target.closest('a')));
    ul.addEventListener('pointerleave', home);
    ul.addEventListener('focusout', home);
    if (document.fonts) document.fonts.ready.then(home); else home();
    window.addEventListener('resize', home);
  }

  function ripples() {
    document.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.btn,.chip,.round,.icon-btn'); if (!b || U.reduced) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      b.appendChild(span);
      span.addEventListener('animationend', () => span.remove());
    });
  }

  function tilt() {
    if (U.touch || U.reduced) return;
    $$('.dig').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (x + 0.5) * 100 + '%');
        el.style.setProperty('--gy', (y + 0.5) * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  function scrollScenes() {
    if (U.reduced || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('[data-hero-bg]', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { y: -50, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  }

  /* ---------------- go ---------------- */
  renderChrome();
  $('#main').innerHTML = [hero(), stats(), dignitaries(), calendarSection(), newsletters()].join('');
  footer();
  carousel(); calendar(); pdfPreview();
  navIndicator(); ripples(); tilt();
  U.boot({ theme: 'heritage' }).then(() => { scrollScenes(); setTimeout(adPopup, U.reduced ? 0 : 700); });
})();
