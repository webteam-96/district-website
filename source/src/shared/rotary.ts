/* Typed access to window.ROTARY (themes-sample/shared/content.js, loaded as a classic
   script before the bundle). Every theme renders from this one contract. */

export interface Photo { src: string; w: number; h: number; alt: string; credit?: string }
export interface NavItem { key: string; label: string; href: string; current?: boolean; external?: boolean; image: Photo }
export interface StatDef { key: StatKey; group: 'projects' | 'membership'; label: string; href?: string; prefix?: string; suffix?: string; decimals?: number; image: Photo }
export type StatKey = 'projects' | 'hours' | 'amount' | 'beneficiaries' | 'clubs' | 'members';
export type YearStats = Record<StatKey, number> & { status?: 'in-progress' | 'upcoming'; note?: string };
export interface Person { name: string; role: string; term: string; bio: string; photo: Photo | null; dummy?: boolean }
export interface CalEntry { date: string; type: 'club' | 'district' | 'birthday' | 'anniversary'; title?: string; name?: string; club?: string; relation?: string; time?: string; venue?: string }
export interface Bulletin { title: string; club: string; date: string; pdf: string; cover: Photo; source?: string }
export interface Letter { title: string; month: string; governor: string; date: string; pdf: string }
export interface PressYear { gml: Letter[]; bulletins: Bulletin[]; total: number; status: 'complete' | 'in-progress' | 'upcoming' }
export interface Link { label: string; href: string; key?: string }

export interface Rotary {
  site: { name: string; district: string; region: string; zone: string; live: string };
  brand: { blue: string; gold: string; logo: string; logoReversed: string; wheel: string; logoAlt: string; wheelSvg: { viewBox: string; outer: string; transform: string; d: string } };
  photos: Record<string, Photo>;
  contact: { label: string; email: string; phone: string; phoneDisplay: string; tel: string };
  years: { label: string; list: string[]; current: string };
  nav: NavItem[];
  ctas: { join: Link & { external?: boolean }; admin: Link & { external?: boolean } };
  hero: { title: string; autoplayMs: number; slides: { photo: Photo; caption: string }[]; ads?: { image: Photo; href: string | null }[] };
  fourWayTest: { kicker: string; title: string; lead: string; questions: { text: string; html: string }[] };
  snapshot: { title: string; groups: { key: string; label: string }[]; stats: StatDef[]; byYear: Record<string, YearStats> };
  dignitaries: { title: string; label: string; readMore: string; order: ('president' | 'dg')[]; links: Record<'president' | 'dg', string>; byYear: Record<string, Record<'president' | 'dg', Person>> };
  calendar: {
    eyebrow: string; title: string; subtext: string; today: string; weekStartsOn: number; weekdays: string[];
    types: { key: CalEntry['type']; label: string; group: string }[];
    tabs: { key: 'all' | CalEntry['type']; label: string }[];
    counts: Record<'all' | CalEntry['type'], number>;
    todayTag: string; emptyDay: string; entries: CalEntry[];
  };
  press: {
    eyebrow: string; title: string; tagline: string; subtext: string;
    gml: { title: string; viewAll: Link; empty: string };
    club: { title: string; href: string; empty: string; footer: string; footerLink: string };
    actions: { preview: string; download: string };
    placeholderPdf: string;
    byYear: Record<string, PressYear>;
  };
  footer: {
    visitors: number; visitorsText: string;
    rotaryLinks: { title: string; items: Link[] }; quickLinks: { title: string; items: Link[] }; social: { title: string; items: Link[] };
    tagline: { lead: string; emphasis: string };
    copyright?: string;
    poweredBy?: { lead: string; name: string };
  };
  clubs: { href: string; list: { id: number; name: string; day?: string; place?: string }[] };
  fmt: { num: (n: number, d?: number) => string; stat: (def: StatDef, v: number) => string; fill: (t: string, v: Record<string, string | number>) => string };
}

declare global { interface Window { ROTARY: Rotary } }

export const R: Rotary = window.ROTARY;

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const initials = (name: string) =>
  name.replace(/^(Dr\.|Rtn\.)\s+/i, '').split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('');

/* A designed plate for years without a usable portrait: initials on Rotary blue. */
export const monogram = (name: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600"><defs><radialGradient id="g" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#1f7fd6"/><stop offset=".55" stop-color="#0b3a7a"/><stop offset="1" stop-color="#06173a"/></radialGradient></defs><rect width="480" height="600" fill="url(#g)"/><text x="240" y="330" text-anchor="middle" font-family="Clash Display, Arial, sans-serif" font-weight="600" font-size="200" fill="none" stroke="#F7A81B" stroke-width="3" letter-spacing="-6">${initials(name)}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const longDate = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const shortDate = (iso: string) => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
export const weekdayName = (d: Date) => DAYS[d.getDay()];

/* Mon-first 6×7 month matrix including leading/trailing days. */
export const monthMatrix = (anchor: Date, weekStartsOn = 1) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};
