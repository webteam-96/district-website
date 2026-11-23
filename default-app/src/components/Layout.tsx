import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, type To } from 'react-router-dom';
import RotaryAPI, { config } from '../api/client';
import type { NavNode } from '../api/menus';
import { useTenant } from '../tenant/TenantProvider';
import VisitorCounter from './VisitorCounter';

/* ============================ nav model ============================ */
/* The nav comes from the API (RotaryAPI.navMenus — see api/menus.ts). This list
   is the FALLBACK only: used until the fetch resolves, and permanently if it
   fails or returns nothing usable, so a district is never left without a nav.
   It mirrors the five isDefault rows the backend seeds per district. */
export const FALLBACK_NAV: NavNode[] = [
  { key: 'f-home', label: 'HOME', kind: 'route', target: '/', doc: false, children: [] },
  { key: 'f-committee', label: 'DISTRICT COMMITTEE', kind: 'route', target: '/district-committee', doc: false, children: [] },
  { key: 'f-finder', label: 'CLUB FINDER', kind: 'route', target: '/club-finder', doc: false, children: [] },
  { key: 'f-projects', label: 'CLUB PROJECTS', kind: 'route', target: '/projects', doc: false, children: [] },
  { key: 'f-service', label: 'CLUB SERVICE', kind: 'route', target: '/club-service', doc: false, children: [] },
];

/* ponytail: DEV-ONLY nav preview. The nav is DB-driven and production stays
   "whatever the API returns" — no district has a `district-awards` menu row
   yet (MENU-API-PAGES.md section B), so the page is unreachable from the nav
   until an admin adds one. This makes it reachable under `npm run dev` only;
   import.meta.env.DEV is false in every build, so nothing ships.
   Delete this block once the menu row is seeded. */
const DEV_NAV: NavNode[] = [
  { key: 'dev-awards', label: 'District Awards', kind: 'route', target: '/district-awards', doc: false, children: [] },
];
const withDevNav = (list: NavNode[]): NavNode[] =>
  import.meta.env.DEV ? list.concat(DEV_NAV.filter((d) => !list.some((n) => n.target === d.target))) : list;

// Canonical route for the CURRENT url, so the active nav item can be found by
// matching node.target. Detail pages fold onto their listing page (a member
// profile keeps DISTRICT COMMITTEE lit) — same rules as the old app.js navFromUrl.
function routeFromPath(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p === '/' || p === '') return '/';
  if (p.startsWith('/about')) return '/about';
  if (p.startsWith('/district-committee') || p.startsWith('/director')) return '/district-committee';
  if (p.startsWith('/club-service')) return '/club-service';
  if (p.startsWith('/club-finder') || p.startsWith('/club')) return '/club-finder';
  if (p.startsWith('/calendar')) return '/calendar';
  if (p.startsWith('/projects') || p.startsWith('/project')) return '/projects';
  if (p.startsWith('/newsletters')) return '/newsletters';
  if (p.startsWith('/dignitary')) return '/dignitary';
  if (p.startsWith('/district-awards')) return '/district-awards';
  return '';
}

// A node is active when its route matches the current one. Query strings are
// compared only when the NODE carries one, so '/projects' stays lit while a
// '/projects?category=x' child is open, and only the matching child also lights.
function isActive(node: NavNode, activeRoute: string, search: string): boolean {
  if (node.kind !== 'route') return false;
  const [path, qs] = node.target.split('?');
  if (path !== activeRoute) return false;
  return !qs || ('?' + qs) === search;
}
const isBranchActive = (n: NavNode, r: string, s: string): boolean =>
  isActive(n, r, s) || n.children.some((c) => isActive(c, r, s));

/* ============================ slot-reel label ============================ */
function SlotLabel({ label }: { label: string }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <span className="slot-text" aria-hidden="true">
        {label.split('').map((ch, i) => (
          <span className="slot-col" key={i}>
            <span className="slot-reel" style={{ ['--d' as any]: i * 45 + 'ms' }}>
              {[0, 1, 2, 3].map((k) => (
                <span key={k}>{ch}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}

/* ============================ nav item rendering ============================ */
/* One renderer for all three node kinds. 'href' covers both external links and
   documents — documents differ only in needing mediaUrl() to resolve the
   API-relative path, and both leave the SPA, so both open in a new tab. */
function NavLeaf({ node, cls, onNavigate, active }: { node: NavNode; cls: string; onNavigate?: () => void; active?: boolean }) {
  const inner = <SlotLabel label={node.label} />;
  if (node.kind === 'href') {
    return (
      <a href={node.doc ? RotaryAPI.mediaUrl(node.target) : node.target} target="_blank" rel="noopener noreferrer" className={cls} onClick={onNavigate}>
        {inner}
      </a>
    );
  }
  if (node.kind === 'parent') return <span className={cls}>{inner}</span>;
  return (
    <Link to={node.target} data-nav={node.key} data-active={active ? 'true' : undefined} className={cls} onClick={onNavigate}>
      {inner}
    </Link>
  );
}

/* Desktop dropdown. CSS-only (group-hover + focus-within) — no open/close state
   to manage, and keyboard tabbing reveals it for free. */
const CARET = (
  <svg className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

/* ============================ social icons ============================ */
const SOCIAL_ICONS: Record<string, JSX.Element> = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  twitter: (<><path d="M4 4l11.5 16h4.5l-11.5 -16z" /><path d="M4 20l6.5 -7.5" /><path d="M13.5 11l6.5 -7" /></>),
  instagram: (<><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></>),
  linkedin: (<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>),
  youtube: (<><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><polygon points="10 15 15 12 10 9" /></>),
  website: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>),
};
function socialLabel(platform: string): string {
  const p = String(platform || '').toLowerCase();
  if (p === 'twitter') return 'Twitter / X';
  return p.charAt(0).toUpperCase() + p.slice(1);
}
interface SocialLink { platform: string; url: string }

/* ============================ coming-soon overlay ============================ */
function ComingSoon() {
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.title = 'Coming soon';
    return () => { document.documentElement.style.overflow = ''; };
  }, []);
  return (
    <div role="status" style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, background: '#0b2a5b', color: '#fff', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: '32rem' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: 9999, background: '#f7a81b' }} />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 10px' }}>Website coming soon</h1>
        <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.5 }}>This district’s website is being set up. Please check back shortly.</p>
      </div>
    </div>
  );
}

/* Convert an "2026-27" short label to the long "2026-2027" API rotaryYear form
   is not needed here — the API year list already uses the short label. */

export default function Layout({ children }: { children: React.ReactNode }) {
  const { ready, setYear } = useTenant();
  const location = useLocation();
  const activeRoute = routeFromPath(location.pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [nav, setNav] = useState<NavNode[]>(withDevNav(FALLBACK_NAV));
  const [logoSrc, setLogoSrc] = useState('/default/assets/img/rotary-logo.png');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [social, setSocial] = useState<SocialLink[] | null>(null);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(RotaryAPI.currentRotaryYearLabel());
  const [comingSoon, setComingSoon] = useState(false);
  const [visits, setVisits] = useState<number | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  // Close the mobile menu on navigation.
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);

  /* ---- tenant hydration (title / logo / about / year opts / contact / social / coming-soon) ---- */
  useEffect(() => {
    if (!ready) return;

    if (config.unresolved) { setComingSoon(true); return; }

    if (config.districtName) document.title = config.districtName;

    // Per-district header logo. PRIMARY source = the live API
    // /website-data/logo endpoint, so an admin-uploaded logo shows the moment it
    // is set. config.districtLogo (harvested map / districtLogoPath) is a synchronous
    // FALLBACK painted first (no flash, no regression for mapped districts); the
    // neutral Rotary mark (the img's default src) is the last resort.
    if (config.districtLogo) {
      const lp = config.districtLogo;
      setLogoSrc(/^(https?:\/\/|\/assets\/)/.test(lp) ? lp : (config.mediaBase || '') + (lp.charAt(0) === '/' ? '' : '/') + lp);
    }
    RotaryAPI.get('/api/districts/' + config.districtId + '/website-data/logo')
      .then((r: any) => {
        const row = r && r.items ? r.items[0] : Array.isArray(r) ? r[0] : r;
        const lp = row && (row.logoPath || row.LogoPath);
        if (lp) setLogoSrc(RotaryAPI.mediaUrl(lp));
      })
      .catch(() => {});

    // Year options — current-10 .. current+1, newest first (mirrors app.js).
    const curLbl = config.currentYearLabel || config.yearLabel || RotaryAPI.currentRotaryYearLabel();
    const shown = config.yearLabel || curLbl;
    setSelectedYear(shown);
    const m = /^(\d{4})/.exec(config.currentYearLabel || config.yearLabel || curLbl || '');
    const cur = m ? parseInt(m[1], 10) : new Date().getFullYear();
    const opts = (config.years || [])
      .filter((y: any) => {
        const mm = /^(\d{4})-\d{2}$/.exec(y.yearLabel || '');
        if (!mm) return false;
        const yy = parseInt(mm[1], 10);
        return yy >= cur - 10 && yy <= cur + 1;
      })
      .sort((a: any, b: any) => parseInt(b.yearLabel, 10) - parseInt(a.yearLabel, 10))
      .map((y: any) => y.yearLabel);
    if (opts.length) setYearOptions(opts);

    // Contact details (year-specific; blank if the selected year has none).
    RotaryAPI.get('/api/districts/' + config.districtId + '/website-data/contact-details', { yearId: config.yearId })
      .then((rows: any) => {
        const c = (rows && rows[0]) || null;
        setEmail((c && c.email) || '');
        setPhone((c && c.phone) || '');
      })
      .catch(() => {});

    // Per-district visitor counter (VisitCounter.ashx next to ApiProxy.ashx —
    // absent under `npm run dev`, where a failed fetch simply hides the
    // counter). hit=1 is sent once per browser session, so the number
    // approximates visits, not raw page loads.
    let hit = '';
    try {
      if (!sessionStorage.getItem('rid-visit-counted')) {
        hit = '&hit=1';
        sessionStorage.setItem('rid-visit-counted', '1');
      }
    } catch (e) {}
    fetch('/VisitCounter.ashx?district=' + config.districtNumber + hit)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.visits === 'number') setVisits(d.visits); })
      .catch(() => {});

    // Footer social links.
    RotaryAPI.get('/api/districts/' + config.districtId + '/website-data/social-links')
      .then((rows: any) => {
        const links = (rows || [])
          .filter((r: any) => (r.isActive === undefined || r.isActive) && (r.linkUrl || r.url))
          .map((r: any) => ({ platform: String(r.platform || '').toLowerCase(), url: r.linkUrl || r.url }));
        setSocial(links);
      })
      .catch(() => setSocial([]));

    // Nav menus. Whatever the API returns IS the nav — no per-page conditions.
    // Keep FALLBACK_NAV on failure or an empty/unmappable result.
    RotaryAPI.navMenus()
      .then((items: NavNode[]) => { if (items.length) setNav(withDevNav(items)); })
      .catch(() => {});
  }, [ready]);

  /* ---- magic pill positioning ----
     The header keeps shifting after first paint (Poppins swaps in, the district
     logo <img> loads and widens the logo area, the API nav replaces the fallback
     one) and the nav is centered, so a one-shot measurement goes stale: the pill
     ends up on the wrong link and narrower than the label. Re-measure on ANY size
     change of the nav or its links (ResizeObserver), plus font-ready and resize. */
  useLayoutEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const reposition = () => {
      // [data-active] not a[data-active]: a dropdown parent is not an anchor.
      const active = navEl.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) { setPill((p) => ({ ...p, opacity: 0 })); return; }
      setPill({ left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight, opacity: 1 });
    };
    reposition();
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(reposition);
      ro.observe(navEl);
      navEl.querySelectorAll('a, [data-nav]').forEach((a) => ro!.observe(a));
    }
    window.addEventListener('resize', reposition);
    if (document.fonts && (document.fonts as any).ready) (document.fonts as any).ready.then(reposition);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', reposition); };
  }, [activeRoute, location.search, nav]);

  const desktopLinkCls = (active: boolean) =>
    'slot-link relative z-[1] flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[14px] tracking-wide transition-colors ' +
    (active ? 'font-semibold text-white' : 'font-medium text-white/85 hover:text-white');
  const mobileLinkCls = (active: boolean) =>
    'slot-link block w-fit py-1.5 text-[30px] font-extrabold uppercase leading-[0.95] tracking-tight transition-colors sm:text-[38px] ' +
    (active ? 'text-brand-gold' : 'text-white/90 hover:text-white');

  const dropdownItemCls =
    'block whitespace-nowrap rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink/85 transition-colors hover:bg-brand-blue/8 hover:text-brand-blue';

  return (
    <>
      {/* ============================ HEADER / TOP NAV ============================ */}
      <header className="site-header sticky top-0 z-[1000] h-[70px] w-full shrink-0 bg-[#0d47a1] shadow-sm md:h-20">
        <div className="relative flex h-full w-full items-center pr-4 sm:pr-6">
          <div aria-hidden="true" className="logo-curve absolute inset-0 z-[1] bg-white" />
          <Link to="/" className="logo-area relative z-[2] flex h-full shrink-0 items-center pl-6">
            <img src={logoSrc} alt="Rotary" className="h-9 w-auto md:h-11" />
          </Link>

          <nav ref={navRef} className="main-nav relative z-[2] mx-2 hidden min-w-0 flex-1 items-center justify-center gap-1 min-[1400px]:flex">
            <span aria-hidden="true" className="nav-pill pointer-events-none absolute z-0 rounded-full border border-white/60 bg-white/15 transition-all duration-300 ease-out" style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height, opacity: pill.opacity }} />
            {nav.map((n) => {
              const on = isBranchActive(n, activeRoute, location.search);
              if (!n.children.length) {
                return <NavLeaf key={n.key} node={n} active={on} cls={desktopLinkCls(on)} />;
              }
              return (
                <div key={n.key} className="group relative" data-nav={n.key} data-active={on ? 'true' : undefined}>
                  {/* A focusable trigger is what makes group-focus-within reachable:
                      a visibility:hidden panel cannot be tabbed into otherwise. */}
                  <button type="button" aria-haspopup="true" className={desktopLinkCls(on) + ' cursor-default'}>
                    <SlotLabel label={n.label} />
                    {CARET}
                  </button>
                  {/* pt-1 keeps the hover bridge unbroken between trigger and panel */}
                  <div className="invisible absolute left-1/2 top-full z-20 -translate-x-1/2 pt-1 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="min-w-[13rem] rounded-xl bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(13,38,92,0.45)] ring-1 ring-black/5">
                      {n.children.map((c) => (
                        <NavLeaf key={c.key} node={c} active={isActive(c, activeRoute, location.search)} cls={dropdownItemCls + (isActive(c, activeRoute, location.search) ? ' bg-brand-blue/10 text-brand-blue' : '')} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="header-actions relative z-[2] hidden shrink-0 items-center gap-2.5 min-[1400px]:flex">
            <a href="https://zfrmz.com/IYIxCyfrS2jgW8gnR1Ia" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg bg-brand-gold px-3 py-2.5 text-[14px] font-semibold text-[#0d47a1] shadow-pill transition-colors hover:bg-brand-goldhover focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              JOIN ROTARY
            </a>
            <a href="https://rizones45678.org" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[14px] font-semibold text-[#0d47a1] shadow-pill transition-colors hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              ADMIN LOGIN
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>

          <button type="button" onClick={() => setMobileOpen((o) => !o)} className="mobile-toggle relative z-[2] ml-auto flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 min-[1400px]:hidden" aria-label="Toggle navigation menu" aria-expanded={mobileOpen}>
            <svg className={'h-6 w-6 ' + (mobileOpen ? 'hidden' : '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            <svg className={'h-6 w-6 ' + (mobileOpen ? '' : 'hidden')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        {/* Mobile nav */}
        <nav className={'mobile-nav border-t border-white/10 bg-[#0d47a1] px-6 pb-8 pt-5 min-[1400px]:hidden ' + (mobileOpen ? '' : 'hidden')}>
          <ul className="flex flex-col gap-1.5">
            {nav.map((n) => (
              <li key={n.key}>
                <NavLeaf node={n} active={isBranchActive(n, activeRoute, location.search)} cls={mobileLinkCls(isBranchActive(n, activeRoute, location.search))} onNavigate={() => setMobileOpen(false)} />
                {/* Sub-menus render inline — no accordion to tap open. */}
                {n.children.length > 0 && (
                  <ul className="mb-1 ml-3 flex flex-col gap-0.5 border-l-2 border-white/20 pl-3.5">
                    {n.children.map((c) => (
                      <li key={c.key}>
                        <NavLeaf
                          node={c}
                          active={isActive(c, activeRoute, location.search)}
                          cls={'slot-link block w-fit py-1 text-[17px] font-semibold uppercase leading-tight tracking-tight transition-colors ' + (isActive(c, activeRoute, location.search) ? 'text-brand-gold' : 'text-white/70 hover:text-white')}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-2.5">
            <a href="https://zfrmz.com/IYIxCyfrS2jgW8gnR1Ia" target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-3 text-sm font-semibold text-[#0d47a1]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              JOIN ROTARY
            </a>
            <a href="https://rizones45678.org" target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0d47a1]">
              ADMIN LOGIN
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
        </nav>
      </header>

      {/* ============================ CONTACT STRIP ============================ */}
      <div className="relative border-b border-white/45 bg-gradient-to-b from-white/55 to-white/25 shadow-[0_10px_30px_-14px_rgba(13,38,92,0.55)] backdrop-blur-xl backdrop-saturate-150">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
        <div className="relative mx-auto flex max-w-[1720px] flex-wrap items-center justify-end gap-x-2.5 gap-y-2 px-5 py-2.5 sm:px-8">
          {email && (
            <a href={'mailto:' + email} className="flex items-center gap-2 rounded-full bg-white/55 px-3.5 py-1.5 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-white/60 backdrop-blur-md transition hover:bg-white/80 hover:text-brand-blue">
              <svg className="h-4 w-4 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <span className="hidden sm:inline">{email}</span>
            </a>
          )}
          {phone && (
            <a href={'tel:' + phone} className="flex items-center gap-2 rounded-full bg-white/55 px-3.5 py-1.5 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-white/60 backdrop-blur-md transition hover:bg-white/80 hover:text-brand-blue">
              <svg className="h-4 w-4 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <span>{phone}</span>
            </a>
          )}
          <div className="relative inline-flex">
            <select aria-label="Select Rotary year" value={selectedYear} onChange={(e) => setYear(e.target.value)} className="year-select appearance-none rounded-full border border-white/60 bg-white/55 py-2 pl-4 pr-10 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-inset ring-white/60 backdrop-blur-md transition-colors hover:bg-white/80 focus:border-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30">
              {(yearOptions.length ? yearOptions : [selectedYear]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      </div>

      {/* ============================ PAGE CONTENT ============================ */}
      {children}


      {/* ============================ FOOTER ============================ */}
      <footer className="relative mt-12 overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e2f73] to-[#0a2154]" aria-hidden="true" />
        <img src="/default/assets/img/footer_banner.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-[70%] object-cover object-right opacity-90" style={{ maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 38%, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 38%, black 60%)' }} />
        <div className="relative mx-auto grid max-w-[1720px] grid-cols-1 gap-x-6 gap-y-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          <div className="flex flex-col items-start gap-4">
            <img src={logoSrc} alt="Rotary" className="h-14 w-auto brightness-0 invert" />
            {visits != null && <VisitorCounter visits={visits} />}
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-6">
            <h3 className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b5fd6] shadow-sm"><svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></span>
              Rotary Links
            </h3>
            <ul className="space-y-3">
              {[['https://rotary.org', 'Rotary.org'], ['https://rizones45678.org', 'Rotary Zones 4, 5, 6, 7 & 8'], ['https://www.rotary.org/en/our-programs/more-fellowships', 'Rotary Fellowship'], ['https://blog.rotary.org', 'Rotary Blog']].map(([href, txt]) => (
                <li key={href}><a href={href} className="group flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"><svg className="h-4 w-4 text-brand-gold transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>{txt}</a></li>
              ))}
            </ul>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-6">
            <h3 className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b5fd6] shadow-sm"><svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg></span>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {([['/', 'Home'], ['/district-committee', 'District Committee'], ['/club-finder', 'Clubs Finder'], ['/projects', 'Club Projects']] as [To, string][]).map(([to, txt]) => (
                <li key={txt}><Link to={to} className="group flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"><svg className="h-4 w-4 text-brand-gold transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>{txt}</Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-6">
            <h3 className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b5fd6] shadow-sm"><svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg></span>
              Social Media Links
            </h3>
            <ul className="space-y-3">
              {social == null ? (
                <li className="text-sm text-white/45">Loading…</li>
              ) : (
                social.map((r) => (
                  <li key={r.platform + r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-white/85 transition-colors hover:text-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SOCIAL_ICONS[r.platform] || SOCIAL_ICONS.website}</svg>
                      {socialLabel(r.platform)}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex flex-col items-start justify-center sm:col-span-2 lg:col-span-1 lg:items-end lg:border-l lg:border-white/10 lg:pl-6">
            <p className="text-sm font-medium text-white/85 lg:text-right">Together, we</p>
            <p className="-mt-1 font-script text-[42px] font-bold leading-none text-brand-gold">Create Change</p>
          </div>
        </div>
      </footer>


      {comingSoon && <ComingSoon />}
    </>
  );
}
