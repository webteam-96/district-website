/* Impact: the live rid3141 home page (banner + ad, snapshot, dignitaries,
   calendar, newsletters) as cinematic, high-contrast scroll storytelling: a
   giant title over a framed banner screen with the advertisement beside it,
   giant rolling numbers over crossfading photos, billboard rows for the dignitaries,
   a photo calendar wall, a club-events timeline whose line fills as you
   scroll, and a numbered press room. Scroll effects follow the scroll; nothing
   pins the page.
   ponytail: markup is built with template strings from our own content.js;
   calendar rows come from member records, so those go through esc(). */
(function () {
  const C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const img = (src, alt, extra = '') => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" data-fade ${extra}>`;
  const svg = (paths, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const ext = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
  const tel = (p) => p.replace(/\s/g, '');
  const cssUrl = (u) => String(u).replace(/'/g, '%27').replace(/ /g, '%20');

  const P = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
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
  const initials = (name) => (name || '?').replace(/&.*$/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const stat = (k) => C.stats.find((s) => s.key === k);
  const pad2 = (n) => String(n).padStart(2, '0');

  // Section heading with an index label ("01 / Snapshot").
  const head = (id, label, title, intro = '', action = '') => `
    <header class="sec-head">
      <div class="sec-title">
        <p class="idx" data-reveal="up">${label}</p>
        <h2 id="${id}-h" data-reveal="lines">${title}</h2>
      </div>
      ${intro || action ? `<div class="sec-side" data-reveal="up" style="--i:2">${intro ? `<p>${intro}</p>` : ''}${action}</div>` : ''}
    </header>`;
  const btn = (label, href, cls, icon = 'arrow') =>
    `<a class="btn ${cls}" href="${href}"${ext(href)}><span>${label}</span>${icon ? ic(icon) : ''}</a>`;

  // A number as rolling digit columns: each digit's 0-9 strip slides into place on reveal.
  const rolling = (text) => [...String(text)].map((ch, i) => /\d/.test(ch)
    ? `<span class="roll"><span class="roll-s" style="--n:${ch};--i:${i}">${'0123456789'.split('').map((d) => `<i>${d}</i>`).join('')}</span></span>`
    : `<span class="roll-c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');

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
    $('#header-actions').innerHTML = `<a class="join" href="${join.href}"${ext(join.href)}><span>${join.label}</span>${ic('arrow')}</a>`;
    $('#menu').innerHTML = `
      <nav aria-label="Mobile"><ol role="list">${C.nav.map((n, i) => `<li style="--i:${i}"><a href="${n.href}"${ext(n.href)}><span>${n.label}</span>${ic('arrowUR')}</a></li>`).join('')}</ol></nav>
      <div class="menu-foot" style="--i:${C.nav.length}">
        ${btn(join.label, join.href, 'btn-gold')}
        ${btn(admin.label, admin.href, 'btn-line', 'lock')}
        <p><a href="mailto:${s.email}">${ic('mail')}${s.email}</a><a href="tel:${tel(s.phone)}">${ic('phone')}${s.phone}</a></p>
      </div>`;
  }

  /* ---------------- 1. hero: giant title over the banner screen + the advertisement ---------------- */
  // Banners are shown whole (their own 996x596 shape) in a framed screen, lit by
  // a soft glow taken from the banner itself. The square advertisement sits beside
  // it: columns in the ratio 996:596 make the square exactly as tall as the banner.
  function hero() {
    const h = C.hero, ad = h.ads[0];
    const adImg = ad ? `<img src="${ad.image}" alt="${ad.alt}" decoding="async" data-fade>` : '';
    return `
    <section class="hero" id="top" aria-labelledby="hero-h">
      <div class="wrap">
        <h1 id="hero-h" class="hero-title" data-reveal="lines">${C.site.name}</h1>
        <div class="stage${ad ? '' : ' no-ad'}">
          <div class="screen" role="region" aria-roledescription="carousel" aria-label="District banners" data-reveal="up" style="--i:2">
            <div class="screen-glow" aria-hidden="true">${h.slides.map((s, i) => `<span class="glow-i${i === 0 ? ' is-active' : ''}" style="background-image:url('${cssUrl(s.image)}')"></span>`).join('')}</div>
            <div class="screen-frame">
              ${h.slides.map((s, i) => `<figure class="slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}">
                <img src="${s.image}" alt="${s.alt}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-fade></figure>`).join('')}
              <button type="button" class="scr-nav prev" data-slide="prev" aria-label="Previous banner">${ic('prev')}</button>
              <button type="button" class="scr-nav next" data-slide="next" aria-label="Next banner">${ic('next')}</button>
              <button type="button" class="btn btn-line btn-sm scr-view" data-view>${ic('eye')}<span>View banners</span></button>
            </div>
            <i class="c c-tl" aria-hidden="true"></i><i class="c c-tr" aria-hidden="true"></i><i class="c c-bl" aria-hidden="true"></i><i class="c c-br" aria-hidden="true"></i>
          </div>
          ${ad ? `<aside class="ad" data-reveal="up" style="--i:3" aria-label="${ad.badge || 'Advertisement'}">
            ${ad.badge ? `<span class="ad-badge">${ad.badge}</span>` : ''}
            ${ad.href ? `<a href="${ad.href}"${ext(ad.href)}>${adImg}</a>` : adImg}
          </aside>` : ''}
        </div>
      </div>
    </section>`;
  }

  /* ---------------- 2. snapshot: giant rolling numbers + the advertisement beside them ---------------- */
  function stats() {
    const p = stat('projects');
    return `<section class="sec snap on-ink" id="stats" aria-labelledby="stats-h">
      <div class="snap-bg" aria-hidden="true">${C.hero.slides.map((s, i) => `<span class="snap-bg-i${i === 0 ? ' is-on' : ''}" style="background-image:url('${cssUrl(s.image)}')"></span>`).join('')}</div>
      <div class="wrap">
        ${head('stats', 'District Snapshot', `Rotary year <span class="nw">${C.site.year}</span> in numbers`, '', btn('All club projects', p.href, 'btn-line btn-sm', 'arrowUR'))}
        <dl class="board" data-reveal="up">
          ${C.stats.map((s, i) => {
            const txt = (s.prefix || '') + U.num(s.value, s.decimals || 0) + (s.suffix || '');
            return `<div class="cell tone-${s.key}" style="--i:${i}">
              <dt>${ic(s.key)}${s.label}</dt>
              <dd><span class="sr-only">${txt}</span><span class="num" aria-hidden="true">${rolling(txt)}</span></dd>
            </div>`;
          }).join('')}
        </dl>
      </div>
    </section>`;
  }

  /* ---------------- 3. dignitaries: billboard rows ---------------- */
  function dignitaries() {
    const WORD = { president: 'President', dg: 'Governor' };
    return `<section class="sec digs" id="dignitaries" aria-labelledby="dignitaries-h"><div class="wrap">
      ${head('dignitaries', 'Dignitaries', 'Dignitaries of Rotary', `The leaders guiding Rotary International and District ${C.site.district} in ${C.site.year}.`)}
      <div class="bills">
        ${C.dignitaries.map((d, i) => `
          <article class="bill${i % 2 ? ' rev' : ''}" data-reveal="up" style="--i:${i}">
            <span class="bill-word" aria-hidden="true">${WORD[d.key] || d.role}</span>
            <a class="bill-photo" href="${d.href}"${ext(d.href)} tabindex="-1" aria-hidden="true">
              <span class="bp-img">${img(d.photo, '')}</span>
            </a>
            <div class="bill-body">
              <span class="bill-role">${d.role}</span>
              <h3><a href="${d.href}"${ext(d.href)}>${d.name}</a></h3>
              <p class="bill-term">${d.term}</p>
              ${d.bio ? `<p class="bill-bio">${d.bio}</p>` : ''}
              ${btn('Read more', d.href, 'btn-ink btn-sm')}
            </div>
          </article>`).join('')}
      </div></div>
    </section>`;
  }

  /* ---------------- 4. what's happening: photo calendar wall + day panel + events timeline ---------------- */
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
      ${head('calendar', 'District Calendar', 'What’s happening', `Birthdays, anniversaries and events across District ${C.site.district}. Pick a month, then a day.`)}
      <div class="cal" data-reveal="up">
        <div class="cal-bar">
          <div class="cal-nav">
            <button type="button" class="sq" data-month="-1" aria-label="Previous month">${ic('prev')}</button>
            <label class="pick"><span class="sr-only">Month</span><select id="cal-m">${months.map((mn, i) => `<option value="${i + 1}">${mn}</option>`).join('')}</select></label>
            <label class="pick"><span class="sr-only">Year</span><select id="cal-y">${cal.years.map((yy) => `<option>${yy}</option>`).join('')}</select></label>
            <button type="button" class="sq" data-month="1" aria-label="Next month">${ic('next')}</button>
            <button type="button" class="btn btn-gold btn-sm" data-today>Today</button>
          </div>
          <div class="filters" role="group" aria-label="Filter the calendar">
            ${cal.tabs.map((t, i) => `<button type="button" class="filter${TAB_K[t] ? ' k-' + TAB_K[t] : ''}" aria-pressed="${i === 0}" data-tab="${t}"><span>${t === 'All' ? 'All' : t.replace(' Events', '')}</span><b>0</b></button>`).join('')}
            <span class="filter-ind" aria-hidden="true"></span>
          </div>
        </div>
        <div class="cal-body">
          <div class="wall-wrap">
            <div class="wall-dow" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span>${d}</span>`).join('')}</div>
            <div class="wall" id="wall" role="group" aria-label="Days of the month" aria-busy="true"></div>
            <ul class="legend" role="list">${Object.values(KIND).map((v) => `<li class="k-${v.k}"><i></i>${v.one}</li>`).join('')}<li class="lg-photo"><i></i>Event poster</li><li class="lg-today"><i>${Number(C.calendar.today.slice(8))}</i>Today</li></ul>
          </div>
          <div class="day"><div class="day-scroll" id="day" data-lenis-prevent></div></div>
        </div>
        <p class="sr-only" id="day-status" aria-live="polite"></p>
      </div>
      <div class="tl-wrap">
        <h3 class="tl-head" id="ev-h">Club events</h3>
        <div class="tl" id="tl">
          <span class="tl-line" aria-hidden="true"><i id="tl-fill"></i></span>
          <ol class="tl-list" id="tl-list" role="list"></ol>
        </div>
      </div>
    </div></section>`;
  }

  /* ---------------- 5. newsletters: press room ---------------- */
  function newsletters() {
    const n = C.news, [f, ...rest] = n.bulletins, fd = new Date(f.date + 'T00:00:00');
    return `<section class="sec press on-ink" id="newsletters" aria-labelledby="newsletters-h"><div class="wrap">
      ${head('newsletters', 'District Press', 'Newsletters', `The Governor’s Monthly Letter and the latest bulletins from clubs across District ${C.site.district}.`, btn('All newsletters', n.clubHref, 'btn-line btn-sm', 'arrowUR'))}
      <a class="gml" href="${n.gmlHref}"${ext(n.gmlHref)} data-reveal="up">
        <span class="gml-ic">${ic('mail')}</span>
        <span class="gml-txt"><strong>Governor’s Monthly Letter</strong><small>${n.gml.length ? `${n.gml.length} letters in ${C.site.year}` : `No letter published for ${C.site.year} yet. Earlier letters are on the Newsletters page.`}</small></span>
        <span class="gml-go">See letters${ic('arrowUR')}</span>
      </a>
      <div class="press-grid">
        <article class="lead" data-reveal="up">
          <p class="lead-kicker">Latest club bulletin</p>
          <p class="lead-date"><b>${pad2(fd.getDate())}</b><span>${fd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></p>
          <h3>${f.title}</h3>
          <p class="lead-club">${f.club}</p>
          <div class="lead-actions">
            <button type="button" class="btn btn-gold btn-sm" data-preview="0"><span>Preview</span>${ic('eye')}</button>
            ${btn('Download PDF', f.pdf, 'btn-line btn-sm', 'download')}
          </div>
        </article>
        <ol class="plist" role="list" data-reveal="stagger">
          ${rest.map((b, i) => `<li style="--i:${i}">
            <span class="pl-n" aria-hidden="true">${pad2(i + 2)}</span>
            <span class="pl-txt"><strong>${b.title}</strong><small>${b.club} · <time datetime="${b.date}">${U.fmtDate(b.date, { day: 'numeric', month: 'short' })}</time></small></span>
            <span class="pl-act">
              <button type="button" class="sq sq-sm" data-preview="${i + 1}" aria-label="Preview ${b.title}">${ic('eye')}</button>
              <a class="sq sq-sm" href="${b.pdf}" target="_blank" rel="noopener" aria-label="Download ${b.title} (PDF)">${ic('download')}</a>
            </span></li>`).join('')}
        </ol>
      </div></div>
    </section>`;
  }

  // Visitor count as a split-flap board: each digit's 0-9 strip rolls into place on reveal.
  const flaps = (text) => [...text].map((ch, i) => /\d/.test(ch)
    ? `<span class="flap-d"><span class="roll"><span class="roll-s" style="--n:${ch};--i:${i}">${'0123456789'.split('').map((d) => `<i>${d}</i>`).join('')}</span></span></span>`
    : `<span class="flap-sep">${ch}</span>`).join('');

  function footer() {
    const f = C.footer, s = C.site;
    const col = (title, links, social) => `<div class="f-col"><h2>${title}</h2><ul role="list">${links.map((l) =>
      `<li><a href="${l.href}"${ext(l.href)}>${social ? ic(l.platform) : ''}<span>${l.label}</span>${ic('arrowUR')}</a></li>`).join('')}</ul></div>`;
    $('#footer').innerHTML = `
      <div class="wrap f-main">
        <div class="f-brand">
          <a class="f-logo" href="${s.live}/" aria-label="${s.name}, home"><img src="${s.logo}" alt="" width="199" height="74"></a>
          <div class="flap" data-reveal="up">
            <span class="flap-l">Website visitors</span>
            <span class="sr-only">${U.num(f.visits)}</span>
            <span class="flap-row" aria-hidden="true">${flaps(U.num(f.visits))}</span>
          </div>
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

  // Banner slideshow: crossfades every 5 s (like the live site) unless reduced
  // motion; hovering or focusing the screen holds the current banner. Clicking
  // the screen opens every banner whole.
  function carousel() {
    const root = $('.screen'), slides = $$('.slide', root), glows = $$('.glow-i', root);
    const n = slides.length, DUR = 5000, playing = !U.reduced && n > 1;
    let i = 0, held = false, timer;
    const arm = () => { clearTimeout(timer); if (playing && !held) timer = setTimeout(() => go(i + 1), DUR); };
    const go = (k) => {
      const prev = i;
      i = (k + n) % n;
      if (i !== prev) {
        [slides, glows].forEach((l) => { l[prev].classList.remove('is-active'); l[i].classList.add('is-active'); });
        slides.forEach((s, x) => s.setAttribute('aria-hidden', String(x !== i)));
      }
      arm();
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slide],[data-view]');
      if (!b) { if (e.target.closest('.slide')) bannerGallery(i); return; }
      if (b.dataset.view !== undefined) return bannerGallery(i);
      go(i + (b.dataset.slide === 'next' ? 1 : -1));
    });
    ['pointerenter', 'focusin'].forEach((ev) => root.addEventListener(ev, () => { held = true; clearTimeout(timer); }));
    ['pointerleave', 'focusout'].forEach((ev) => root.addEventListener(ev, () => { held = false; arm(); }));
    arm();
  }

  // Gold underline that slides to the hovered nav link and back to the current page.
  function navIndicator() {
    const nav = $('.nav'), ul = $('#nav'), ind = $('.nav-ind', nav);
    const to = (a) => {
      if (!a) return;
      const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect(), pad = parseFloat(getComputedStyle(a).paddingLeft) || 0;
      ind.style.width = Math.max(0, r.width - pad * 2) + 'px';
      ind.style.transform = `translateX(${r.left - nr.left + pad}px)`;
      ind.style.opacity = 1;
    };
    const home = () => to($('a[aria-current]', ul));
    ul.addEventListener('pointerover', (e) => to(e.target.closest('a')));
    ul.addEventListener('focusin', (e) => to(e.target.closest('a')));
    ul.addEventListener('pointerleave', home);
    ul.addEventListener('focusout', home);
    if (document.fonts) document.fonts.ready.then(home); else home();
    window.addEventListener('resize', home);
  }

  // Scroll-linked scenes (none pins the page): the hero title drifts, the
  // snapshot backdrop crossfades while a highlight steps through the
  // numbers, the dignitary words drift, the events line fills (and empties on
  // the way back up) and the header shows reading progress.
  function scenes() {
    const root = document.documentElement, heroEl = $('.hero'), snapEl = $('.snap');
    const bgs = $$('.snap-bg-i'), cells = $$('.cell'), bills = $$('.bill');
    const tl = $('#tl'), fill = $('#tl-fill'), prog = $('.progress i');
    const clamp = (v) => Math.max(0, Math.min(1, v));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight, sy = scrollY, max = root.scrollHeight - vh;
      prog.style.transform = `scaleX(${max > 0 ? clamp(sy / max) : 0})`;
      const r = tl.getBoundingClientRect(), h = Math.max(r.height, 1);
      const f = U.reduced ? 1 : clamp((vh * 0.6 - r.top) / h);
      fill.style.transform = `scaleY(${f})`;
      $$('.tl-item', tl).forEach((it) => it.classList.toggle('is-lit', (it.offsetTop + it.offsetHeight / 2) / h <= f + 0.001));
      if (U.reduced) return;
      heroEl.style.setProperty('--p', clamp(sy / (heroEl.offsetHeight * 0.85)).toFixed(4));
      const s = snapEl.getBoundingClientRect();
      const q = clamp((vh * 0.7 - s.top) / Math.max(s.height, 1));
      const bi = Math.min(bgs.length - 1, Math.floor(q * bgs.length));
      bgs.forEach((b, k) => b.classList.toggle('is-on', k === bi));
      const live = s.top < vh && s.bottom > 0 && q > 0 && q < 1;
      const ci = live ? Math.min(cells.length - 1, Math.floor(q * cells.length)) : -1;
      cells.forEach((c, k) => c.classList.toggle('is-cur', k === ci));
      bills.forEach((b) => { const br = b.getBoundingClientRect(); b.style.setProperty('--q', clamp((vh - br.top) / (vh + br.height)).toFixed(4)); });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
    return { update: req };
  }

  function calendar(S) {
    const cal = C.calendar;
    const wall = $('#wall'), day = $('#day'), status = $('#day-status'), filters = $('.filters');
    const selM = $('#cal-m'), selY = $('#cal-y'), list = $('#tl-list'), evH = $('#ev-h'), tl = $('#tl');
    const [ty, tm, td] = cal.today.split('-').map(Number);
    let tab = 'All', y = ty, m = tm, sel = td, entries = [], req = 0;
    const TYPE = { B: 'Birthdays', A: 'Anniversaries' };
    const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    const isToday = (d) => y === ty && m === tm && d === td;
    const monthName = () => new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const dayLong = (d) => new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

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

    // Underline that slides to the active filter (works across wrapped rows).
    const placeFilter = (instant) => {
      const ind = $('.filter-ind', filters), b = $('.filter[aria-pressed="true"]', filters);
      if (!ind || !b) return;
      ind.style.transition = instant ? 'none' : '';
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop + b.offsetHeight - 3}px)`;
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    };

    // The wall: one tile per day; a day with an event poster shows it behind the date.
    const drawWall = (focus) => {
      const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
      const lead = (first.getDay() + 6) % 7; // Monday first
      const byDay = {};
      visible().forEach((e) => {
        const o = byDay[e.day] = byDay[e.day] || { club: 0, district: 0, birthday: 0, anniv: 0, photo: '' };
        o[KIND[e.tab].k]++;
        if (!o.photo && /Events/.test(e.tab) && e.photo) o.photo = e.photo;
      });
      const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
      wall.innerHTML = '<span class="t-pad" aria-hidden="true"></span>'.repeat(lead) + Array.from({ length: days }, (_, k) => {
        const d = k + 1, o = byDay[d], wd = new Date(y, m - 1, d).getDay();
        const evn = o ? o.club + o.district : 0;
        const words = o ? [evn && plural(evn, 'event', 'events'), o.birthday && plural(o.birthday, 'birthday', 'birthdays'), o.anniv && plural(o.anniv, 'anniversary', 'anniversaries')].filter(Boolean).join(', ') : 'nothing listed';
        const chips = o ? ['club', 'district', 'birthday', 'anniv'].filter((x) => o[x]).map((x) => `<i class="k-${x}">${o[x]}</i>`).join('') : '';
        return `<button type="button" class="tile${o ? '' : ' empty'}${o && o.photo ? ' has-photo' : ''}${wd === 0 || wd === 6 ? ' we' : ''}" aria-pressed="${sel === d}"${isToday(d) ? ' aria-current="date"' : ''} data-d="${d}" aria-label="${dayLong(d)}${isToday(d) ? ', today' : ''}: ${words}">
          ${o && o.photo ? `<span class="t-bg" style="background-image:url('${cssUrl(o.photo)}')"></span>` : ''}
          <b class="t-num">${d}</b><span class="t-counts">${chips}</span></button>`;
      }).join('');
      wall.removeAttribute('aria-busy');
      if (focus) wall.querySelector(`[data-d="${sel}"]`).focus({ preventScroll: true });
    };

    // One look per type: events as poster cards, birthdays and anniversaries as yearbook tiles.
    const eventCard = (e) => `<li class="ev k-${KIND[e.tab].k}">
        <span class="ev-img">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : ic(KIND[e.tab].icon)}</span>
        <span class="ev-txt"><span class="ev-club">${esc(e.sub || 'District')}</span><strong>${esc(e.name)}</strong>
          <small>${e.time ? `<span>${ic('clock')}${e.time}</span>` : ''}${e.venue ? `<span>${ic('pin')}${esc(e.venue)}</span>` : ''}</small></span></li>`;
    const personTile = (e) => `<li class="pt k-${KIND[e.tab].k}">
        <span class="pt-face">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : `<span class="avatar">${initials(e.name)}</span>`}<i>${ic(KIND[e.tab].icon)}</i></span>
        <strong>${esc(e.name)}</strong><small>${esc(e.sub)}</small></li>`;

    const drawDay = () => {
      const rows = entries.filter((e) => e.day === sel);
      const groups = [];
      if (tab === 'All' || /Events/.test(tab)) groups.push({ k: tab === 'District Events' ? 'district' : 'club', t: tab === 'All' ? 'Events' : tab, icon: tab === 'District Events' ? 'flag' : 'people', evt: true, rows: rows.filter((e) => /Events/.test(e.tab) && (tab === 'All' || e.tab === tab)) });
      if (tab === 'All' || tab === 'Birthdays') groups.push({ k: 'birthday', t: 'Birthdays', icon: 'cake', rows: rows.filter((e) => e.tab === 'Birthdays') });
      if (tab === 'All' || tab === 'Anniversaries') groups.push({ k: 'anniv', t: 'Anniversaries', icon: 'rings', rows: rows.filter((e) => e.tab === 'Anniversaries') });
      const shown = groups.filter((g) => g.rows.length);
      const total = shown.reduce((a, g) => a + g.rows.length, 0);
      const max = tab === 'All' ? 9 : 18;
      const date = new Date(y, m - 1, sel);
      day.innerHTML = `
        <div class="day-head">
          <b class="day-num">${pad2(sel)}</b>
          <span class="day-txt"><strong>${date.toLocaleDateString('en-IN', { weekday: 'long' })}</strong><span>${monthName()}</span></span>
          ${isToday(sel) ? '<em>Today</em>' : ''}
          <span class="day-total">${total} ${total === 1 ? 'entry' : 'entries'}</span>
        </div>
        ${shown.length ? shown.map((g, i) => {
          const many = !g.evt && g.rows.length > max;
          return `<section class="grp k-${g.k}" style="--i:${i}" aria-label="${g.t}">
            <h4>${ic(g.icon)}${g.t}<b>${g.rows.length}</b></h4>
            <ul role="list" class="${g.evt ? 'evs' : 'yb'}${many ? ' clamp' + max : ''}">${g.rows.map(g.evt ? eventCard : personTile).join('')}</ul>
            ${many ? `<button type="button" class="more" data-more aria-expanded="false"><span>Show all ${g.rows.length}</span>${ic('down')}</button>` : ''}
          </section>`;
        }).join('') : `<p class="empty">${ic('cal')}Nothing ${tab === 'All' ? '' : 'in ' + tab.toLowerCase() + ' '}on this day. Pick a day with a coloured mark.</p>`}`;
      day.scrollTop = 0;
      status.textContent = `${dayLong(sel)}: ${total} ${total === 1 ? 'entry' : 'entries'}`;
    };

    const drawCounts = () => {
      $$('.filter', filters).forEach((b) => {
        const t = b.dataset.tab;
        b.querySelector('b').textContent = U.num(t === 'All' ? entries.length : entries.filter((e) => e.tab === t).length);
      });
      placeFilter(true);
    };

    // Club events of the month as a timeline; S.update() re-measures the filling line.
    const drawTimeline = () => {
      const evs = entries.filter((e) => /Events/.test(e.tab)).sort((a, b) => a.date.localeCompare(b.date));
      const name = monthName();
      evH.innerHTML = `Club events in ${name} <span>${evs.length}</span>`;
      tl.classList.toggle('is-empty', !evs.length);
      list.innerHTML = evs.length ? evs.map((e, i) => {
        const dt = new Date(y, m - 1, e.day), today = isToday(e.day), past = dt < new Date(ty, tm - 1, td);
        return `<li class="tl-item ${i % 2 ? 'r' : 'l'}${past ? ' is-past' : ''}${today ? ' is-today' : ''}" style="--row:${i + 1}">
          <span class="tl-dot" aria-hidden="true"></span>
          <article class="tl-card">
            <button type="button" class="tl-media" data-jump="${e.day}" aria-label="Show ${dayLong(e.day)} on the calendar">
              ${e.photo ? img(esc(e.photo), '') : `<span class="tl-ph">${ic(KIND[e.tab].icon)}</span>`}
              <span class="tl-cap">${ic('cal')}Show on calendar</span>
            </button>
            <div class="tl-body">
              <p class="tl-when"><time datetime="${e.date.slice(0, 10)}">${dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</time> · ${e.time}${today ? '<em>Today</em>' : ''}</p>
              <h4>${esc(e.name)}</h4>
              <p class="tl-meta">${esc(e.sub || 'District')}${e.venue ? ' · ' + esc(e.venue) : ''}</p>
            </div>
          </article></li>`;
      }).join('') : `<li class="tl-empty">${ic('cal')}No club or district events are listed for ${name}.</li>`;
      U.initImages(list);
      S.update();
    };

    const selectDay = (d, focus) => {
      sel = d;
      $$('.tile', wall).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === d)));
      drawDay();
      if (focus) wall.querySelector(`[data-d="${d}"]`).focus({ preventScroll: true });
    };

    // Switch month (wraps the year); keeps the chosen filter. A newer request wins.
    const show = async (yy, mm, d) => {
      if (mm < 1) { mm = 12; yy--; } else if (mm > 12) { mm = 1; yy++; }
      if (yy < cal.years[0] || yy > cal.years[cal.years.length - 1]) return;
      y = yy; m = mm; selM.value = m; selY.value = y;
      wall.setAttribute('aria-busy', 'true');
      const mine = ++req, rows = await loadMonth(m);
      if (mine !== req) return;
      entries = monthEntries(rows);
      const days = new Date(y, m, 0).getDate();
      sel = Math.min(d || (y === ty && m === tm ? td : (entries.find((e) => /Events/.test(e.tab)) || entries[0] || { day: 1 }).day), days);
      drawCounts(); drawWall(); drawDay(); drawTimeline();
      const c = $('.cal'); c.classList.remove('turn'); void c.offsetWidth; c.classList.add('turn');
    };

    wall.addEventListener('click', (e) => { const b = e.target.closest('.tile'); if (b) selectDay(+b.dataset.d); });
    wall.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      selectDay(Math.min(new Date(y, m, 0).getDate(), Math.max(1, sel + step)), true);
    });
    $$('[data-month]').forEach((b) => b.addEventListener('click', () => show(y, m + +b.dataset.month)));
    selM.addEventListener('change', () => show(y, +selM.value));
    selY.addEventListener('change', () => show(+selY.value, m));
    $('[data-today]').addEventListener('click', () => show(ty, tm, td));
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('.filter'); if (!b) return;
      tab = b.dataset.tab;
      $$('.filter', filters).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      placeFilter(); drawWall(); drawDay();
    });
    day.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]'); if (!b) return;
      const ul = b.previousElementSibling, cls = [...ul.classList].find((c) => /^clamp\d+$/.test(c)) || ul.dataset.clamp;
      if (cls) { ul.dataset.clamp = cls; ul.classList.toggle(cls); }
      const open = !ul.classList.contains(ul.dataset.clamp);
      b.setAttribute('aria-expanded', String(open));
      b.querySelector('span').textContent = open ? 'Show fewer' : `Show all ${ul.children.length}`;
    });
    // A member photo that 404s falls back to initials, like a missing one.
    day.addEventListener('error', (e) => {
      const im = e.target; if (im.tagName !== 'IMG') return;
      const li = im.closest('li');
      im.outerHTML = li.classList.contains('ev') ? ic('people') : `<span class="avatar">${initials(li.querySelector('strong').textContent)}</span>`;
    }, true);
    // "Show on calendar": select that day and bring the calendar into view.
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump]'); if (!b) return;
      selectDay(+b.dataset.jump);
      const c = $('.cal'), top = c.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) {
        if (U.lenis) U.lenis.scrollTo(c, { offset: -90 });
        else window.scrollTo({ top: top + window.scrollY - 90, behavior: U.reduced ? 'auto' : 'smooth' });
      }
      c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1100);
    });
    window.addEventListener('resize', () => placeFilter(true));
    if (document.fonts) document.fonts.ready.then(() => placeFilter(true));
    show(ty, tm, td);
  }

  function pdfPreview() {
    $('#newsletters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preview]'); if (!b) return;
      const n = C.news.bulletins[+b.dataset.preview];
      U.dialog(`<div class="pdf-box"><div class="pdf-bar"><span><strong>${n.title}</strong><small>${n.club} · ${U.fmtDate(n.date)}</small></span>
        <a class="btn btn-gold btn-sm" href="${n.pdf}" target="_blank" rel="noopener"><span>Download</span>${ic('download')}</a></div>
        <iframe src="${n.pdf}" title="${n.title}"></iframe></div>`, n.title + ' preview');
    });
  }

  /* ---------------- go ---------------- */
  renderChrome();
  $('#main').innerHTML = [hero(), stats(), dignitaries(), calendarSection(), newsletters()].join('');
  footer();
  const S = scenes();
  carousel(); calendar(S); pdfPreview(); navIndicator();
  U.boot({ theme: 'impact' });
})();
