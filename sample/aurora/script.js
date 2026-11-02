/* Aurora: the live rid3141 home page (banner + ad, snapshot, dignitaries,
   calendar, newsletters) in its own design: an aurora-glow hero with a stacked
   banner deck, a numbers band with the advertisement beside it, dignitary
   medallions, a day-strip calendar with one panel per entry type, a
   self-scrolling events row and a newsletter shelf.
   Light/dark toggle, dark by default.
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

  const head = (id, label, icon, title, intro = '', action = '') => `
    <header class="sec-head">
      <div>
        <p class="label" data-reveal="up"><span class="label-ic">${ic(icon)}</span>${label}</p>
        <h2 id="${id}-h" data-reveal="lines">${title}</h2>
      </div>
      ${intro || action ? `<div class="sec-head-side" data-reveal="up" style="--i:2">${intro ? `<p>${intro}</p>` : ''}${action}</div>` : ''}
    </header>`;
  const section = (id, cls, inner) => `<section id="${id}" class="sec ${cls}" aria-labelledby="${id}-h"><div class="wrap">${inner}</div></section>`;
  const btn = (label, href, cls, icon = 'arrow') =>
    `<a class="btn ${cls}" href="${href}"${ext(href)}><span>${label}</span>${icon ? ic(icon) : ''}</a>`;

  /* ---------------- header / menu ---------------- */
  function renderChrome() {
    const s = C.site, join = C.headerCtas[0], admin = C.headerCtas[1];
    const brand = $('#brand');
    brand.href = s.live + '/';
    brand.setAttribute('aria-label', `${s.name}, home`);
    brand.innerHTML = `<img class="logo-dark" src="${s.logoReversed}" alt="" width="199" height="74"><img class="logo-light" src="${s.logo}" alt="" width="199" height="74">`;
    $('#topbar').innerHTML = `
      <p class="tb-place">${ic('pin')}<b>${s.name}</b><span>${s.region}</span></p>
      <div class="tb-links">
        <a href="mailto:${s.email}">${ic('mail')}<span>${s.email}</span></a>
        <a href="tel:${tel(s.phone)}">${ic('phone')}<span>${s.phone}</span></a>
        <a href="${admin.href}" target="_blank" rel="noopener">${ic('lock')}<span>${admin.label}</span></a>
        <label class="tb-year">${ic('cal')}<span>Rotary year</span>
          <select aria-label="Rotary year">${s.years.map((y) => `<option${y === s.year ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>`;
    $('#nav').innerHTML = C.nav.map((n, i) => `<li><a href="${n.href}"${ext(n.href)}${i === 0 ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('') + '<li class="nav-ind" aria-hidden="true"></li>';
    $('#header-actions').innerHTML = `<a class="btn btn-gold btn-sm" data-magnetic href="${join.href}"${ext(join.href)}><span>${join.label}</span>${ic('arrow')}</a>`;
    $('#menu').innerHTML = `
      <nav aria-label="Mobile"><ol role="list">${C.nav.map((n, i) => `<li style="--i:${i}"><a href="${n.href}"${ext(n.href)}>${n.label}${ic('arrowUR')}</a></li>`).join('')}</ol></nav>
      <div class="menu-foot" style="--i:${C.nav.length}">
        ${btn(join.label, join.href, 'btn-gold')}
        ${btn(admin.label, admin.href, 'btn-glass', 'lock')}
        <p><a href="mailto:${s.email}">${ic('mail')}${s.email}</a><a href="tel:${tel(s.phone)}">${ic('phone')}${s.phone}</a></p>
      </div>`;
  }

  /* ---------------- 1. hero: aurora glow + stacked banner deck ---------------- */
  function hero() {
    const h = C.hero, dg = C.dignitaries.find((d) => d.key === 'dg'), join = C.headerCtas[0];
    return `
    <section class="hero" id="top" aria-labelledby="hero-h">
      <div class="aurora" aria-hidden="true"><div class="aur-a"><i></i><i></i><i></i></div><div class="aur-b"><i></i><i></i></div></div>
      <div class="hero-dots" aria-hidden="true"></div>
      <div class="wrap hero-in">
        <div class="hero-copy">
          <p class="pill" data-reveal="up"><span class="dot"></span>Rotary year ${C.site.year}</p>
          <h1 id="hero-h" data-reveal="lines">${C.site.name}</h1>
          <p class="hero-sub" data-reveal="up" style="--i:2">${U.num(stat('clubs').value)} clubs and ${U.num(stat('members').value)} Rotarians serving ${C.site.region.split(',')[0]} through ${U.num(stat('projects').value)} projects this year.</p>
          <div class="hero-ctas" data-reveal="up" style="--i:3">
            <a class="btn btn-gold btn-lg" data-magnetic href="${join.href}"${ext(join.href)}><span>${join.label}</span>${ic('arrow')}</a>
            <button type="button" class="btn btn-glass btn-lg" data-kbar>${ic('search')}<span>Find a club</span></button>
          </div>
          ${dg ? `<a class="dg-chip" href="${dg.href}"${ext(dg.href)} data-reveal="up" style="--i:4">
            <img src="${dg.photo}" alt="" width="44" height="44">
            <span><strong>${dg.name}</strong><small>${dg.role}, ${dg.term}</small></span>${ic('arrowUR')}</a>` : ''}
        </div>
        <div class="deck" data-reveal="up" style="--i:2" role="region" aria-roledescription="carousel" aria-label="District banners">
          <div class="deck-stack">
            ${h.slides.map((s, i) => `<figure class="deck-card" data-pos="${Math.min(i, 2)}" aria-hidden="${i !== 0}">
              <img src="${s.image}" alt="${s.alt}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-fade></figure>`).join('')}
          </div>
          <div class="deck-ui">
            <p class="deck-cap" aria-live="polite">${h.slides[0].alt}</p>
            <div class="deck-btns">
              <button type="button" class="chip-btn" data-view>${ic('eye')}<span>View banners</span></button>
              <button type="button" class="round" data-slide="prev" aria-label="Previous banner">${ic('prev')}</button>
              <button type="button" class="round" data-slide="next" aria-label="Next banner">${ic('next')}</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- 2. district snapshot: numbers band + the advertisement beside it ---------------- */
  function stats() {
    const p = stat('projects'), ad = C.hero.ads[0];
    const adImg = ad ? `<img src="${ad.image}" alt="${ad.alt}" loading="lazy" decoding="async" data-fade>` : '';
    return `<section class="sec-snap" id="stats" aria-labelledby="stats-h">
      <div class="wrap snap-row${ad ? '' : ' no-ad'}">
        <div class="snap" data-reveal="up">
          <div class="snap-glow" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="snap-head">
            <div>
              <p class="label"><span class="label-ic">${ic('projects')}</span>District Snapshot</p>
              <h2 id="stats-h">Rotary year <span class="nw">${C.site.year}</span> in numbers</h2>
            </div>
            ${btn('All club projects', p.href, 'btn-glass btn-sm', 'arrowUR')}
          </div>
          <ul class="snap-grid" role="list">
            ${C.stats.map((s, i) => `<li class="snap-cell tone-${s.key}" style="--i:${i}">
              <span class="snap-ic">${ic(s.key)}</span>
              <span class="snap-num" data-count="${s.value}" data-decimals="${s.decimals || 0}" data-prefix="${s.prefix || ''}" data-suffix="${s.suffix || ''}">${s.prefix || ''}${U.num(s.value, s.decimals || 0)}${s.suffix || ''}</span>
              <span class="snap-label">${s.label}</span>
            </li>`).join('')}
          </ul>
        </div>
        ${ad ? `<aside class="ad-card" data-reveal="up" style="--i:2" aria-label="${ad.badge || 'Advertisement'}">
          ${ad.badge ? `<span class="ad-badge">${ad.badge}</span>` : ''}
          ${ad.href ? `<a href="${ad.href}"${ext(ad.href)}>${adImg}</a>` : adImg}
        </aside>` : ''}
      </div>
    </section>`;
  }

  /* ---------------- 3. dignitaries: medallions in one hall ---------------- */
  // Each portrait sits in a gradient ring that draws itself in on reveal, with a
  // gold dot orbiting it and a soft glow behind.
  function dignitaries() {
    const R = 57, CIRC = (2 * Math.PI * R).toFixed(1);
    const medal = (d, i) => `
      <article class="medal m-${d.key}" style="--i:${i}">
        <a class="medal-photo" href="${d.href}"${ext(d.href)} tabindex="-1" aria-hidden="true">
          <span class="medal-glow"></span>
          <svg class="medal-ring" viewBox="0 0 120 120" style="--circ:${CIRC}">
            <defs><linearGradient id="mg-${d.key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F80FF"/><stop offset=".55" stop-color="#7C5CFF"/><stop offset="1" stop-color="#F7A81B"/></linearGradient></defs>
            <circle class="ring-track" cx="60" cy="60" r="${R}"/>
            <circle class="ring-draw" cx="60" cy="60" r="${R}" stroke="url(#mg-${d.key})"/>
          </svg>
          <span class="medal-orbit"><i></i></span>
          ${img(d.photo, '')}
        </a>
        <span class="role">${d.role}</span>
        <h3><a href="${d.href}"${ext(d.href)}>${d.name}</a></h3>
        <p class="term">${d.term}</p>
        ${d.bio ? `<p class="bio">${d.bio}</p>` : ''}
        <div class="medal-foot">${btn('Read more', d.href, 'btn-outline btn-sm')}</div>
      </article>`;
    return section('dignitaries', 'sec-digs', `
      ${head('dignitaries', 'Dignitaries', 'star', 'Dignitaries of Rotary', `The leaders guiding Rotary International and District ${C.site.district} in ${C.site.year}.`)}
      <div class="hall" data-reveal="up">
        <div class="hall-glow" aria-hidden="true"><i></i><i></i></div>
        ${C.dignitaries.map(medal).join('<span class="hall-div" aria-hidden="true"></span>')}
      </div>`);
  }

  /* ---------------- 4. what's happening: day strip + type panels + events carousel ---------------- */
  const KIND = {
    'Club Events': { k: 'club', icon: 'people', one: 'Club event' },
    'District Events': { k: 'district', icon: 'flag', one: 'District event' },
    Birthdays: { k: 'birthday', icon: 'cake', one: 'Birthday' },
    Anniversaries: { k: 'anniv', icon: 'rings', one: 'Anniversary' },
  };
  const TAB_ICON = { All: 'layers', 'Club Events': 'people', 'District Events': 'flag', Birthdays: 'cake', Anniversaries: 'rings' };
  const TAB_K = { All: '', 'Club Events': 'club', 'District Events': 'district', Birthdays: 'birthday', Anniversaries: 'anniv' };

  function calendarSection() {
    const cal = C.calendar;
    const months = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleDateString('en-IN', { month: 'long' }));
    return section('calendar', 'sec-cal', `
      ${head('calendar', 'District Calendar', 'cal', 'What’s happening', `Birthdays, anniversaries and events across District ${C.site.district}, day by day. Pick a month, then a day.`)}
      <div class="cal" data-reveal="up">
        <div class="cal-bar">
          <div class="cal-nav">
            <button type="button" class="round" data-month="-1" aria-label="Previous month">${ic('prev')}</button>
            <label class="pick"><span class="sr-only">Month</span><select id="cal-m">${months.map((mn, i) => `<option value="${i + 1}">${mn}</option>`).join('')}</select></label>
            <label class="pick"><span class="sr-only">Year</span><select id="cal-y">${cal.years.map((yy) => `<option>${yy}</option>`).join('')}</select></label>
            <button type="button" class="round" data-month="1" aria-label="Next month">${ic('next')}</button>
            <button type="button" class="btn btn-gold btn-sm" data-today>Today</button>
          </div>
          <div class="seg-tabs" role="group" aria-label="Filter the calendar">
            <span class="seg-ind" aria-hidden="true"></span>
            ${cal.tabs.map((t, i) => `<button type="button" class="seg-tab${TAB_K[t] ? ' k-' + TAB_K[t] : ''}" aria-pressed="${i === 0}" data-tab="${t}">${ic(TAB_ICON[t])}<span>${t === 'All' ? 'All' : t.replace(' Events', '')}</span><b>0</b></button>`).join('')}
          </div>
        </div>
        <div class="strip" id="strip" role="group" aria-label="Days of the month" aria-busy="true"></div>
        <p class="sr-only" id="day-status" aria-live="polite"></p>
        <div class="day" id="day"></div>
      </div>
      <div class="evs" data-reveal="up">
        <div class="evs-head"><h3 id="ev-h">Club events</h3></div>
        <div class="marquee" id="ev-marquee">
          <ol class="ev-row" id="ev-track" role="list"></ol>
        </div>
      </div>`);
  }

  /* ---------------- 5. newsletters: letter strip + bulletin shelf ---------------- */
  const TONES = ['#2F80FF', '#7C5CFF', '#13B4CC', '#E8930C', '#E2557A', '#1FB57F'];
  const tone = (s) => TONES[[...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % TONES.length];
  function newsletters() {
    const n = C.news;
    return section('newsletters', 'sec-news', `
      ${head('newsletters', 'District Press', 'news', 'Newsletters', `The Governor’s Monthly Letter and the latest bulletins from clubs across District ${C.site.district}.`, btn('All newsletters', n.clubHref, 'btn-outline btn-sm'))}
      <a class="gml-strip spot" href="${n.gmlHref}"${ext(n.gmlHref)} data-reveal="up">
        <span class="gml-ic">${ic('mail')}</span>
        <span class="gml-txt"><strong>Governor’s Monthly Letter</strong><small>${n.gml.length ? `${n.gml.length} letters in ${C.site.year}` : `No letter published for ${C.site.year} yet. Earlier letters are on the Newsletters page.`}</small></span>
        <span class="gml-go">See letters ${ic('arrowUR')}</span>
      </a>
      <h3 class="shelf-h">Latest club bulletins <span class="count">${C.site.year}</span></h3>
      <ul class="shelf" role="list" data-reveal="stagger">
        ${n.bulletins.map((b, i) => {
          const d = new Date(b.date + 'T00:00:00');
          return `<li class="issue spot" style="--i:${i};--c:${tone(b.club)}">
            <div class="issue-cover" aria-hidden="true">
              <span class="paper paper-2"></span>
              <span class="paper"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</small><i></i><i></i><i></i></span>
              <span class="issue-pdf">PDF</span>
            </div>
            <div class="issue-body">
              <strong>${b.title}</strong>
              <small>${b.club}</small>
              <div class="issue-actions">
                <button type="button" class="mini" data-preview="${i}" aria-label="Preview ${b.title}">${ic('eye')}<span>Preview</span></button>
                <a class="mini" href="${b.pdf}" target="_blank" rel="noopener" aria-label="Download ${b.title} (PDF)">${ic('download')}<span>Download</span></a>
              </div>
            </div>
          </li>`;
        }).join('')}
      </ul>`);
  }

  function footer() {
    const f = C.footer, s = C.site;
    const col = (title, links, social) => `<div class="f-col"><h2>${title}</h2><ul role="list"${social ? ' class="f-social"' : ''}>${links.map((l) =>
      `<li><a href="${l.href}"${ext(l.href)}>${social ? `<span class="f-sic">${ic(l.platform)}</span>` : ic('next')}<span>${l.label}</span></a></li>`).join('')}</ul></div>`;
    // Visitor count as odometer tiles: each digit's 0-9 strip rolls into place on reveal.
    const odo = String(f.visits).padStart(6, '0').split('').map((d, i) =>
      `<span class="odo-d"><span class="odo-s" style="--n:${d};--i:${i}">${'0123456789'.split('').map((x) => `<i>${x}</i>`).join('')}</span></span>`).join('');
    $('#footer').innerHTML = `
      <div class="f-aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="wrap">
        <div class="f-top">
          <img class="f-logo" src="${s.logoReversed}" alt="Rotary" width="199" height="74">
          <div class="odo" data-reveal="up" role="img" aria-label="${U.num(f.visits)} website visitors">
            <span class="odo-l">Website visitors</span><span class="odo-row" aria-hidden="true">${odo}</span>
          </div>
        </div>
        <div class="f-grid">
          ${col('Rotary Links', f.rotaryLinks)}
          ${col('Quick Links', f.quickLinks)}
          ${col('Social Media Links', f.social, true)}
        </div>
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

  // Banner deck: the front card flies out to the left and tucks in behind the
  // stack; the next one comes forward. Autoplays (5 s, like the live site)
  // unless reduced motion; hovering or focusing the deck holds it.
  function deck() {
    const root = $('.deck'), cards = $$('.deck-card', root), cap = $('.deck-cap', root);
    const n = cards.length, DUR = 5000, playing = !U.reduced && n > 1;
    let i = 0, held = false, timer;
    const pos = (k) => Math.min((k - i + n) % n, 2);
    const arm = () => { clearTimeout(timer); if (playing && !held) timer = setTimeout(() => go(i + 1), DUR); };
    const layout = (out) => {
      cards.forEach((c, k) => { c.dataset.pos = String(pos(k)); c.setAttribute('aria-hidden', String(k !== i)); });
      if (out == null) return;
      const c = cards[out];
      c.dataset.pos = 'out';
      setTimeout(() => { if (c.dataset.pos === 'out') c.dataset.pos = String(pos(out)); }, 480);
    };
    const go = (k) => {
      const prev = i;
      i = (k + n) % n;
      if (i !== prev) {
        layout((i - prev + n) % n === 1 ? prev : null);
        cap.classList.remove('in'); void cap.offsetWidth;
        cap.textContent = C.hero.slides[i].alt; cap.classList.add('in');
      }
      arm();
    };
    root.addEventListener('click', (e) => {
      const card = e.target.closest('.deck-card');
      if (card) return card.dataset.pos === '0' ? bannerGallery(i) : go(cards.indexOf(card));
      const b = e.target.closest('[data-slide],[data-view]'); if (!b) return;
      if (b.dataset.view !== undefined) return bannerGallery(i);
      go(i + (b.dataset.slide === 'next' ? 1 : -1));
    });
    ['pointerenter', 'focusin'].forEach((ev) => root.addEventListener(ev, () => { held = true; clearTimeout(timer); }));
    ['pointerleave', 'focusout'].forEach((ev) => root.addEventListener(ev, () => { held = false; arm(); }));
    arm();
  }

  // Pill that slides behind the pressed button of a group (works across wrapped rows).
  // The pill is looked up on every call: the day strip re-renders its own.
  function slidePill(group, indSel, btnSel) {
    const place = (instant) => {
      const ind = $(indSel, group), b = $(btnSel + '[aria-pressed="true"]', group); if (!b || !ind) return;
      ind.style.transition = instant ? 'none' : '';
      ind.style.width = b.offsetWidth + 'px'; ind.style.height = b.offsetHeight + 'px';
      ind.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    };
    window.addEventListener('resize', () => place(true));
    if (document.fonts) document.fonts.ready.then(() => place(true));
    return place;
  }

  function calendar() {
    const cal = C.calendar;
    const strip = $('#strip'), dayEl = $('#day'), status = $('#day-status'), tabs = $('.seg-tabs');
    const selM = $('#cal-m'), selY = $('#cal-y'), track = $('#ev-track'), evH = $('#ev-h'), marquee = $('#ev-marquee');
    const placeTab = slidePill(tabs, '.seg-ind', '.seg-tab');
    const placeDay = slidePill(strip, '.strip-ind', '.sd');
    const [ty, tm, td] = cal.today.split('-').map(Number);
    let tab = 'All', y = ty, m = tm, sel = td, entries = [], req = 0;
    const TYPE = { B: 'Birthdays', A: 'Anniversaries' };
    const pad = (n) => String(n).padStart(2, '0');
    const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    const isToday = (d) => y === ty && m === tm && d === td;
    const monthName = () => new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Birthdays/anniversaries recur yearly, so each month's file is loaded once
    // and reused for every year. Dated events come from content.js.
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
      const evs = cal.events.filter((e) => e.date.startsWith(key)).map((e) => ({ ...e, day: +e.date.slice(8, 10), time: fmtTime(e.date) }));
      return evs.concat(people);
    };

    // One look per type: events show where and when; people get a badge on the face.
    const eventRow = (e) => `<li class="pe k-${KIND[e.tab].k}">
        <span class="pe-img">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : ic(KIND[e.tab].icon)}</span>
        <span class="pe-txt"><span class="pe-club">${esc(e.sub || 'District')}</span><strong>${esc(e.name)}</strong>
          <small>${e.time ? `<span>${ic('clock')}${e.time}</span>` : ''}${e.venue ? `<span>${ic('pin')}${esc(e.venue)}</span>` : ''}</small></span></li>`;
    const personRow = (e) => `<li class="pp k-${KIND[e.tab].k}">
        <span class="pp-face">${e.photo ? `<img src="${esc(e.photo)}" alt="" loading="lazy">` : `<span class="avatar">${initials(e.name)}</span>`}<i>${ic(KIND[e.tab].icon)}</i></span>
        <span class="pp-txt"><strong>${esc(e.name)}</strong><small>${esc(e.sub)}</small></span></li>`;
    const panel = (o, max, i) => {
      const many = !o.evt && o.rows.length > max;
      return `<section class="panel k-${o.k}" style="--i:${i}" aria-label="${o.title}">
        <h4><span class="panel-ic">${ic(o.icon)}</span>${o.title}<b>${o.rows.length}</b></h4>
        ${o.rows.length ? `<ul role="list" class="${o.evt ? 'p-evts' : 'p-people'}${many ? ' clamp' + max : ''}">${o.rows.map(o.evt ? eventRow : personRow).join('')}</ul>
          ${many ? `<button type="button" class="more" data-more="${max}" aria-expanded="false"><span>Show all ${o.rows.length}</span>${ic('down')}</button>` : ''}`
          : `<p class="panel-empty">${ic('cal')}${o.empty}</p>`}
      </section>`;
    };

    const drawDay = () => {
      const rows = entries.filter((e) => e.day === sel);
      const parts = [];
      if (tab === 'All' || /Events/.test(tab)) parts.push({
        k: tab === 'District Events' ? 'district' : 'events', evt: true, icon: tab === 'District Events' ? 'flag' : 'people',
        title: tab === 'All' ? 'Events' : tab, empty: 'No events on this day.',
        rows: rows.filter((e) => /Events/.test(e.tab) && (tab === 'All' || e.tab === tab)),
      });
      if (tab === 'All' || tab === 'Birthdays') parts.push({ k: 'birthday', icon: 'cake', title: 'Birthdays', empty: 'No birthdays on this day.', rows: rows.filter((e) => e.tab === 'Birthdays') });
      if (tab === 'All' || tab === 'Anniversaries') parts.push({ k: 'anniv', icon: 'rings', title: 'Anniversaries', empty: 'No anniversaries on this day.', rows: rows.filter((e) => e.tab === 'Anniversaries') });
      const max = parts.length === 1 ? 12 : 6;
      const total = parts.reduce((a, o) => a + o.rows.length, 0);
      const date = new Date(y, m - 1, sel);
      dayEl.innerHTML = `
        <div class="day-head">
          <span class="day-date"><b>${sel}</b><span>${date.toLocaleDateString('en-IN', { weekday: 'long' })}<small>${monthName()}</small></span></span>
          ${isToday(sel) ? '<em>Today</em>' : ''}
          <span class="day-total">${total} ${total === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div class="day-cols${parts.length === 1 ? ' one' : ''}">${parts.map((o, i) => panel(o, max, i)).join('')}</div>`;
      status.textContent = `${date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}: ${total} ${total === 1 ? 'entry' : 'entries'}`;
    };

    const center = (instant) => {
      if (strip.scrollWidth <= strip.clientWidth + 2) return;
      const b = $('.sd[aria-pressed="true"]', strip); if (!b) return;
      strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: instant || U.reduced ? 'auto' : 'smooth' });
    };
    const drawStrip = () => {
      const days = new Date(y, m, 0).getDate();
      const byDay = {};
      entries.filter((e) => tab === 'All' || e.tab === tab).forEach((e) => { (byDay[e.day] = byDay[e.day] || new Set()).add(KIND[e.tab].k); });
      strip.style.setProperty('--days', days);
      strip.innerHTML = '<span class="strip-ind" aria-hidden="true"></span>' + Array.from({ length: days }, (_, k) => {
        const d = k + 1, dt = new Date(y, m - 1, d), wd = dt.getDay(), ks = [...(byDay[d] || [])];
        return `<button type="button" class="sd${wd === 0 || wd === 6 ? ' we' : ''}${isToday(d) ? ' today' : ''}" aria-pressed="${sel === d}" data-d="${d}" aria-label="${dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}${ks.length ? '' : ', nothing listed'}">
          <small>${dt.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}</small><b>${d}</b><span class="dots">${ks.map((x) => `<i class="k-${x}"></i>`).join('')}</span></button>`;
      }).join('');
      strip.removeAttribute('aria-busy');
      placeDay(true); center(true);
    };
    const selectDay = (d, focus) => {
      sel = d;
      $$('.sd', strip).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === d)));
      placeDay(); center(); drawDay();
      if (focus) strip.querySelector(`[data-d="${d}"]`).focus({ preventScroll: true });
    };
    const drawCounts = () => {
      $$('.seg-tab', tabs).forEach((b) => {
        const t = b.dataset.tab;
        b.querySelector('b').textContent = U.num(t === 'All' ? entries.length : entries.filter((e) => e.tab === t).length);
      });
      placeTab(true);
    };

    // Club events: poster cards in a row that scrolls by itself and pauses on
    // hover, focus or touch. Copies of the set make the loop seamless; they are
    // hidden from screen readers and skipped by Tab.
    const SPEED = 40; // px per second
    let evHTML = '', evCount = 0;
    const poster = (e, i) => {
      const dt = new Date(y, m - 1, e.day), today = isToday(e.day), past = dt < new Date(ty, tm - 1, td);
      return `<li class="evp${past ? ' is-past' : ''}${today ? ' is-today' : ''}" style="--i:${Math.min(i, 6)};--c:${tone(e.sub || e.name)}">
        <div class="evp-media">${e.photo ? img(esc(e.photo), '') : `<span class="evp-ph">${ic(KIND[e.tab].icon)}</span>`}</div>
        <time class="evp-date" datetime="${e.date.slice(0, 10)}"><span>${dt.toLocaleDateString('en-IN', { month: 'short' })}</span><b>${e.day}</b></time>
        ${today ? '<span class="evp-today">Today</span>' : ''}
        <div class="evp-body">
          <span class="evp-club">${esc(e.sub || 'District')}</span>
          <h4>${esc(e.name)}</h4>
          <p class="evp-meta">${e.venue ? `<span>${ic('pin')}<em>${esc(e.venue)}</em></span>` : ''}<span>${ic('clock')}<em>${dt.toLocaleDateString('en-IN', { weekday: 'short' })}, ${e.time}</em></span></p>
          <button type="button" class="evp-go" data-jump="${e.day}">${ic('cal')}<span>Show on calendar</span></button>
        </div></li>`;
    };
    const loop = () => {
      marquee.classList.remove('is-moving');
      track.innerHTML = evHTML;
      if (!evCount) return;
      U.initImages(track);
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const period = track.scrollWidth + gap;
      if (U.reduced || track.scrollWidth <= marquee.clientWidth) return; // fits, or motion is off: a plain row
      const copy = evHTML.replace(/<li class="evp/g, '<li aria-hidden="true" class="evp').replace(/<button type="button" class="evp-go"/g, '<button type="button" tabindex="-1" class="evp-go"');
      track.insertAdjacentHTML('beforeend', copy.repeat(Math.ceil(marquee.clientWidth / period) + 1));
      U.initImages(track);
      track.style.setProperty('--period', period + 'px');
      track.style.setProperty('--dur', (period / SPEED).toFixed(1) + 's');
      marquee.classList.add('is-moving');
    };
    const drawEvents = () => {
      const evs = entries.filter((e) => /Events/.test(e.tab)).sort((a, b) => a.date.localeCompare(b.date));
      const name = monthName();
      evH.innerHTML = `Club events in ${name} <span>${evs.length}</span>`;
      evCount = evs.length;
      evHTML = evs.length ? evs.map(poster).join('') : `<li class="ev-empty">${ic('cal')}No club or district events are listed for ${name}.</li>`;
      marquee.classList.toggle('is-empty', !evs.length);
      loop();
    };
    // Touch has no hover: a tap pauses the row, which resumes a few seconds later.
    let resume;
    marquee.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { clearTimeout(resume); marquee.classList.add('is-paused'); } });
    ['pointerup', 'pointercancel'].forEach((ev) => marquee.addEventListener(ev, (e) => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(resume); resume = setTimeout(() => marquee.classList.remove('is-paused'), 3500);
    }));

    // Switch month (wraps the year); keeps the chosen filter. A newer request wins.
    const show = async (yy, mm, day) => {
      if (mm < 1) { mm = 12; yy--; } else if (mm > 12) { mm = 1; yy++; }
      if (yy < cal.years[0] || yy > cal.years[cal.years.length - 1]) return;
      y = yy; m = mm; selM.value = m; selY.value = y;
      strip.setAttribute('aria-busy', 'true');
      const mine = ++req, rows = await loadMonth(m);
      if (mine !== req) return;
      entries = monthEntries(rows);
      const days = new Date(y, m, 0).getDate();
      sel = Math.min(day || (y === ty && m === tm ? td : (entries.find((e) => /Events/.test(e.tab)) || entries[0] || { day: 1 }).day), days);
      drawCounts(); drawStrip(); drawDay(); drawEvents();
      const c = $('.cal'); c.classList.remove('turn'); void c.offsetWidth; c.classList.add('turn');
    };

    strip.addEventListener('click', (e) => { const b = e.target.closest('.sd'); if (b) selectDay(+b.dataset.d); });
    strip.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      selectDay(Math.min(new Date(y, m, 0).getDate(), Math.max(1, sel + (e.key === 'ArrowRight' ? 1 : -1))), true);
    });
    $$('[data-month]').forEach((b) => b.addEventListener('click', () => show(y, m + +b.dataset.month)));
    selM.addEventListener('change', () => show(y, +selM.value));
    selY.addEventListener('change', () => show(+selY.value, m));
    $('[data-today]').addEventListener('click', () => show(ty, tm, td));
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('.seg-tab'); if (!b) return;
      tab = b.dataset.tab;
      $$('.seg-tab', tabs).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      placeTab(); drawStrip(); drawDay();
    });
    dayEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]'); if (!b) return;
      const ul = b.previousElementSibling, open = !ul.classList.toggle('clamp' + b.dataset.more);
      b.setAttribute('aria-expanded', String(open));
      b.querySelector('span').textContent = open ? 'Show fewer' : `Show all ${ul.children.length}`;
    });
    // A member photo that 404s falls back to initials, like a missing one.
    dayEl.addEventListener('error', (e) => {
      const im = e.target; if (im.tagName !== 'IMG') return;
      const li = im.closest('li');
      im.outerHTML = li.classList.contains('pe') ? ic('people') : `<span class="avatar">${initials(li.querySelector('strong').textContent)}</span>`;
    }, true);
    // "Show on calendar": select that day and bring the calendar into view.
    track.addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump]'); if (!b) return;
      selectDay(+b.dataset.jump);
      const c = $('.cal'), top = c.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) {
        if (U.lenis) U.lenis.scrollTo(c, { offset: -96 });
        else window.scrollTo({ top: top + window.scrollY - 96, behavior: U.reduced ? 'auto' : 'smooth' });
      }
      c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1100);
    });
    let lastW = marquee.clientWidth, rt;
    window.addEventListener('resize', () => {
      center(true);
      clearTimeout(rt);
      rt = setTimeout(() => { if (marquee.clientWidth !== lastW) { lastW = marquee.clientWidth; loop(); } }, 200);
    });
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

  // Primary buttons lean toward the cursor, then spring back.
  function magnetic() {
    if (U.touch || U.reduced) return;
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1)}px ${(((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1)}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  // One listener drives the soft cursor light on every .spot card.
  function spotlight() {
    if (U.touch || U.reduced) return;
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.spot'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // The banner deck tilts a few degrees toward the cursor.
  function deckTilt() {
    if (U.touch || U.reduced) return;
    const deckEl = $('.deck'), stack = $('.deck-stack');
    deckEl.addEventListener('pointermove', (e) => {
      const r = stack.getBoundingClientRect();
      stack.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
      stack.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 6).toFixed(2) + 'deg');
    });
    deckEl.addEventListener('pointerleave', () => { stack.style.setProperty('--rx', '0deg'); stack.style.setProperty('--ry', '0deg'); });
  }

  // Ctrl/⌘K club search over the district's clubs; each result opens the club's page.
  function kbar() {
    const clubs = C.clubs.list;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$('[data-kbar]').forEach((b) => { b.title = `Search clubs (${mac ? '⌘K' : 'Ctrl K'})`; });
    const d = document.createElement('dialog');
    d.className = 'kbar';
    d.setAttribute('aria-label', 'Search clubs');
    d.innerHTML = `<div class="kbar-box">
      <label class="kbar-in">${ic('search')}<span class="sr-only">Search clubs</span>
        <input type="text" id="kbar-q" role="combobox" aria-expanded="true" aria-controls="kbar-list" aria-autocomplete="list" placeholder="Search ${clubs.length} clubs by name, meeting day or place" autocomplete="off"><kbd>Esc</kbd></label>
      <ul id="kbar-list" role="listbox" aria-label="Clubs" data-lenis-prevent></ul>
      <div class="kbar-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><a href="${C.clubs.finder}" target="_blank" rel="noopener">Open Club Finder ${ic('arrowUR')}</a></div>
    </div>`;
    document.body.appendChild(d);
    const q = $('#kbar-q', d), list = $('#kbar-list', d);
    let hits = [], act = 0;
    const mark = (t, term) => {
      if (!term) return esc(t);
      const at = t.toLowerCase().indexOf(term);
      return at < 0 ? esc(t) : esc(t.slice(0, at)) + '<mark>' + esc(t.slice(at, at + term.length)) + '</mark>' + esc(t.slice(at + term.length));
    };
    const draw = () => {
      const term = q.value.trim().toLowerCase();
      hits = clubs.filter((c) => !term || (c.name + ' ' + c.day + ' ' + c.place).toLowerCase().includes(term));
      act = Math.min(act, Math.max(hits.length - 1, 0));
      list.innerHTML = hits.length ? hits.map((c, i) => `<li role="option" id="kb-${c.id}" aria-selected="${i === act}">
          <a href="${C.clubs.href}${c.id}" target="_blank" rel="noopener" tabindex="-1">
            <span class="kb-av">${initials(c.name)}</span>
            <span class="kb-txt"><strong>Rotary Club of ${mark(c.name, term)}</strong><small>${c.day ? mark(c.day, term) + ' · ' : ''}${mark(c.place, term)}</small></span>
            ${ic('arrowUR')}</a></li>`).join('')
        : `<li class="kb-empty">No club matches “${esc(q.value)}”. Try a neighbourhood or a weekday.</li>`;
      q.setAttribute('aria-activedescendant', hits[act] ? 'kb-' + hits[act].id : '');
    };
    const move = (step) => {
      if (!hits.length) return;
      act = (act + step + hits.length) % hits.length;
      $$('[role=option]', list).forEach((li, k) => li.setAttribute('aria-selected', String(k === act)));
      const li = list.children[act]; li.scrollIntoView({ block: 'nearest' });
      q.setAttribute('aria-activedescendant', li.id);
    };
    const open = () => {
      if (d.open) return;
      q.value = ''; act = 0; draw();
      d.showModal(); q.focus();
      if (U.lenis) U.lenis.stop();
    };
    d.addEventListener('close', () => { if (U.lenis) U.lenis.start(); });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    q.addEventListener('input', () => { act = 0; draw(); });
    q.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); d.close(); }
      else if (e.key === 'Enter' && hits[act]) { e.preventDefault(); window.open(C.clubs.href + hits[act].id, '_blank', 'noopener'); }
    });
    list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('[role=option]'); if (!li) return;
      const k = [...list.children].indexOf(li); if (k !== act) { act = k; move(0); }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-kbar]')) open(); });
  }

  // Light/dark toggle. Remembers the choice per browser; the new theme spreads
  // out from the button in a circle where View Transitions are supported.
  function themeToggle() {
    const root = document.documentElement, b = $('[data-theme-toggle]');
    const label = () => {
      const dark = root.dataset.theme === 'dark';
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      b.title = dark ? 'Light theme' : 'Dark theme';
    };
    const set = (t) => {
      root.dataset.theme = t;
      try { localStorage.setItem('aurora-theme', t); } catch (e) {}
      label();
    };
    b.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || U.reduced) return set(next);
      const r = b.getBoundingClientRect(), x = r.left + r.width / 2, yy = r.top + r.height / 2;
      root.style.setProperty('--vt-x', x + 'px');
      root.style.setProperty('--vt-y', yy + 'px');
      root.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(yy, innerHeight - yy)) + 'px');
      document.startViewTransition(() => set(next));
    });
    label();
  }

  // The hero's aurora warms from blue/violet toward gold/rose as it scrolls away.
  function auroraScroll() {
    if (U.reduced) return;
    const heroEl = $('.hero'), warm = $('.aur-b');
    let ticking = false;
    const set = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, window.scrollY / (heroEl.offsetHeight * 0.8)));
      warm.style.opacity = (0.15 + p * 0.85).toFixed(3);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  /* ---------------- go ---------------- */
  renderChrome();
  $('#main').innerHTML = [hero(), stats(), dignitaries(), calendarSection(), newsletters()].join('');
  footer();
  deck(); calendar(); pdfPreview();
  navIndicator(); magnetic(); spotlight(); deckTilt(); kbar(); themeToggle(); auroraScroll();
  U.boot({ theme: 'aurora' });
})();
