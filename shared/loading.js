/* Loading skeleton: shown in #root while a page waits for its live district data (source/src/shared/live.ts).
   React replaces it when the page renders. Load it right after <div id="root"></div>:
     <script src="../shared/loading.js"></script>
   It needs nothing else (the theme's CSS has not arrived yet): its own styles, the theme's header colour from
   <meta name="theme-color">, and the theme's light/dark choice from <html data-theme> (Ether is dark unless "light"). */
(function () {
  var root = document.getElementById('root');
  if (!root || root.firstChild) return;
  var html = document.documentElement, body = document.body;
  var meta = document.querySelector('meta[name="theme-color"]');
  var accent = (meta && meta.getAttribute('content')) || '#17458f';
  var ether = /ether/.test(location.pathname);
  var dark = html.dataset.theme === 'dark' || (ether && html.dataset.theme !== 'light');
  var page = body.dataset.page || 'home';
  var detail = /^(club|project|event|dignitary)$/.test(page);

  var css =
    '.rsk{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:' + (dark ? '#0b1020' : '#f4f6fa') + ';font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;color:' + (dark ? '#c9d2e3' : '#4a5568') + '}' +
    '.rsk *{box-sizing:border-box}' +
    '.rsk__strip{height:44px;background:' + accent + '}' +
    '.rsk__nav{height:76px;display:flex;align-items:center;gap:24px;padding:0 max(16px,calc((100% - 1200px)/2));background:' + (dark ? '#111830' : '#fff') + ';box-shadow:0 1px 0 ' + (dark ? '#ffffff14' : '#0000000f') + '}' +
    '.rsk__wrap{max-width:1200px;margin:0 auto;padding:32px 16px}' +
    '.rsk__b{display:block;border-radius:10px;background:' + (dark ? '#1c2540' : '#e3e8f0') + ';position:relative;overflow:hidden}' +
    '.rsk__b::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,' + (dark ? '#ffffff14' : '#ffffffb3') + ',transparent);animation:rsk 1.3s infinite}' +
    '@keyframes rsk{to{transform:translateX(100%)}}' +
    '@media (prefers-reduced-motion:reduce){.rsk__b::after{animation:none}}' +
    '.rsk__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:28px}' +
    '.rsk__card{border-radius:16px;padding:14px;background:' + (dark ? '#111830' : '#fff') + ';box-shadow:0 1px 3px ' + (dark ? '#0006' : '#0000000d') + '}' +
    '.rsk__links{display:flex;gap:22px;margin-left:auto}' +
    '.rsk__note{display:flex;align-items:center;gap:10px;margin:0 0 22px;font-weight:600}' +
    '.rsk__spin{width:18px;height:18px;border-radius:50%;border:3px solid ' + (dark ? '#ffffff26' : '#0000001a') + ';border-top-color:' + (dark ? '#f7a81b' : accent) + ';animation:rsks .8s linear infinite}' +
    '@keyframes rsks{to{transform:rotate(1turn)}}' +
    '@media (prefers-reduced-motion:reduce){.rsk__spin{animation-duration:2.4s}}' +
    '@media (max-width:700px){.rsk__links{display:none}.rsk__wrap{padding:24px 16px}}';

  var b = function (w, h, extra) { return '<span class="rsk__b" style="width:' + w + ';height:' + h + 'px;' + (extra || '') + '"></span>'; };
  var card = '<div class="rsk__card">' + b('100%', 170) + b('80%', 16, 'margin-top:14px') + b('55%', 14, 'margin-top:10px') + '</div>';
  var cards = function (n) { var s = ''; for (var i = 0; i < n; i++) s += card; return '<div class="rsk__grid">' + s + '</div>'; };
  var links = '<span class="rsk__links">' + b('64px', 14) + b('110px', 14) + b('84px', 14) + b('96px', 14) + '</span>';

  var main;
  if (page === 'home') main = b('100%', 360, 'border-radius:20px') + cards(3);
  else if (detail) main = b('140px', 14) + b('min(560px,90%)', 38, 'margin-top:16px') +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:28px">' + b('100%', 300, 'border-radius:16px') +
    '<div>' + b('100%', 16) + b('92%', 16, 'margin-top:12px') + b('96%', 16, 'margin-top:12px') + b('70%', 16, 'margin-top:12px') + '</div></div>';
  else main = b('140px', 14) + b('min(420px,80%)', 40, 'margin-top:16px') + b('min(620px,95%)', 16, 'margin-top:14px') +
    b('100%', 52, 'margin-top:26px;border-radius:999px') + cards(6);

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  root.innerHTML =
    '<div class="rsk" role="status" aria-live="polite">' +
      '<div class="rsk__strip"></div>' +
      '<div class="rsk__nav">' + b('130px', 34) + links + '</div>' +
      '<div class="rsk__wrap"><p class="rsk__note"><span class="rsk__spin" aria-hidden="true"></span>Loading live district data…</p>' + main + '</div>' +
    '</div>';
})();
