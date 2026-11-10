/* Shared, design-free helpers for the inner pages. Every theme lays these pages out its own
   way; what they share is the data (content.js → R.pages), the page list, and the plain-JS
   behaviour in shared/inner.js (tabs, filters, reveal), which the plain-HTML pages use too. */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { R, initials, parseISO, toISO, type CalEntry } from './rotary';

export type PageKey = 'about' | 'committee' | 'finder' | 'projects' | 'service' | 'calendar' | 'newsletters' | 'contact';
export interface PageInfo { key: PageKey; file: string; title: string; lead: string }
export interface Member { name: string; role: string; club: string }
export interface Project { id: number; title: string; club: string; avenue: string; date: string; photo: { src: string; w: number; h: number; alt: string }; beneficiaries: number; amount: number; hours: number; summary: string }

interface Pages {
  list: PageInfo[]; home: string; back: string; breadcrumb: string;
  about: { placeholder: boolean; image: { src: string; w: number; h: number; alt: string }; intro: string; paragraphs: string[]; focusTitle: string; focus: { key: string; title: string; text: string }[]; cta: { label: string; href: string } };
  committee: { searchLabel: string; empty: string; groups: { title: string; members: Member[] }[] };
  finder: { searchLabel: string; dayLabel: string; anyDay: string; days: string[]; empty: string; more: string; pageSize: number; visit: string };
  projects: { searchLabel: string; allLabel: string; empty: string; more: string; pageSize: number; avenues: { key: string; label: string }[]; statLabels: Record<'projects' | 'beneficiaries' | 'amount' | 'hours', string>; list: Project[] };
  calendar: { emptyMonth: string; monthLabel: string };
  newsletters: { yearLabel: string; governor: string; club: string; searchLabel: string };
  contact: { title: string; office: string; hours: string; formNote: string; fields: Record<'name' | 'email' | 'phone' | 'club' | 'message' | 'send', string>; sent: string; join: { title: string; text: string }; finder: { title: string; text: string } };
}
export const P = (R as unknown as { pages: Pages }).pages;
export const pageInfo = (k: PageKey) => P.list.find(p => p.key === k)!;
export const isPage = (k: string | undefined): k is PageKey => !!k && P.list.some(p => p.key === k);

/* Marks the menu item for the page being shown (the homepage marks Home). */
export const setPage = (k: PageKey | 'home') => {
  const navKey = k === 'calendar' || k === 'newsletters' || k === 'contact' ? '' : k;
  R.nav.forEach(n => { n.current = k === 'home' ? n.key === 'home' : n.key === navKey; });
};

/* Attach shared/inner.js to a page body (reveal, tabs, filters, demo form). */
declare global { interface Window { RInner?: { mount: (root: Element) => () => void } } }
export function useBehaviours<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current || !window.RInner) return;
    return window.RInner.mount(ref.current);
  }, []);
  return ref;
}

/* The mobile menu renders into <body>; when pages are rendered to static HTML there is no
   document, so it stays where it is and shared/inner.js moves it at load. */
/* true while pages are rendered to static HTML (scripts/pages.mjs) */
export const STATIC = typeof document === 'undefined';

export const toBody = (node: ReactNode) => (typeof document === 'undefined' || !document.body ? node : createPortal(node, document.body));

/* ---------- data shaped for the pages ---------- */
export const num = (n: number) => R.fmt.num(n);
export const crore = (n: number) => `₹${R.fmt.num(n, 2)} L`;
export const clubName = (c: string) => (c ? `RC ${c}` : '');

export const committee = () => P.committee.groups.map((g, gi) => ({
  ...g,
  key: `g${gi}`,
  members: g.members.map(m => ({ ...m, initials: initials(m.name), q: `${m.name} ${m.role} ${m.club}`.toLowerCase() }))
}));

export const clubs = () => R.clubs.list.map(c => ({
  ...c,
  initials: c.name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
  href: R.clubs.href + c.id,
  q: `${c.name} ${c.place ?? ''} ${c.day ?? ''}`.toLowerCase()
}));

export const avenueLabel = (k: string) => P.projects.avenues.find(a => a.key === k)?.label ?? k;
export const projectsOf = (avenue?: string) => P.projects.list.filter(p => !avenue || p.avenue === avenue);
export const totals = (list: Project[]) => ({
  projects: list.length,
  beneficiaries: list.reduce((s, p) => s + p.beneficiaries, 0),
  amount: list.reduce((s, p) => s + p.amount, 0),
  hours: list.reduce((s, p) => s + p.hours, 0)
});

/* Calendar: the twelve months of the Rotary year that contains today, July to June. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const calMonths = () => {
  const t = parseISO(R.calendar.today);
  const startYear = t.getMonth() >= 6 ? t.getFullYear() : t.getFullYear() - 1;
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startYear, 6 + i, 1);
    return { key: `m${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, date: d, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, short: MONTHS[d.getMonth()].slice(0, 3) };
  });
};
export const todayMonthKey = () => { const t = parseISO(R.calendar.today); return `m${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; };
export const entriesByDate = (() => {
  let m: Map<string, CalEntry[]> | null = null;
  return () => {
    if (m) return m;
    m = new Map();
    for (const e of R.calendar.entries) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  };
})();
export const monthEntries = (d: Date) => {
  const by = entriesByDate();
  const days = [...by.keys()].filter(k => { const x = parseISO(k); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).sort();
  return days.map(k => ({ iso: k, date: parseISO(k), list: by.get(k)! }));
};
export const typesOf = (list: CalEntry[]) => R.calendar.types.filter(t => list.some(e => e.type === t.key)).map(t => t.key);
export const entryText = (e: CalEntry) => (e.type === 'club' || e.type === 'district'
  ? { head: e.title ?? '', sub: [e.time, e.venue, e.club && clubName(e.club)].filter(Boolean).join(' · ') }
  : { head: e.name ?? '', sub: e.club ? clubName(e.club) : e.relation ?? '' });
export { toISO };

/* Newsletters for every Rotary year; the page shows the year picked in the top strip. */
export const pressYears = () => R.years.list.map(y => ({ year: y, ...R.press.byYear[y] }));
