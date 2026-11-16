/* Detail pages: one item each, picked by the query string; every theme lays them out its own way.

     club.html?id=<club id>             Club profile             ← Club Finder "View club", club links on the homepage
     project.html?id=<project id>       Club project             ← project cards (Club Projects, Club Service, homepage)
     event.html?id=<event id>           Club or district event   ← calendar events (District Calendar, homepage calendar)
     dignitary.html?type=president|dg   RI President / Governor  ← homepage "Read More"
     member.html?id=<member id>         Committee member         ← District Committee cards

   They mirror the production site's ClubProfile, Detail, DignitaryProfile and DirectorProfile pages
   (district_website_react/src/pages). The selectors below hand a theme one typed item, or null when the id
   matches nothing (the page then shows its not-found state, P.<key>.missing):
   - sample: built from shared/content.js; the static HTML pages (scripts/pages.mjs) show the example item
     (P.<key>.example), with the markup a backend binds its data into;
   - live (this computer): shared/live.ts puts the API's item in P.<key>.item before the first render, or null when
     the API has no such item (then the page shows its not-found state, never the sample's item of that id). */
import { useEffect } from 'react';
import { R, type Bulletin, type CalEntry, type Person, type Photo } from './rotary';
import { P, STATIC, clubs, committee, totals, type Member, type Project } from './inner';

/* The browser tab names the item: "Bombay · Rotary District 3141 — Prism" (the shell says "Club Profile · …") */
export const useDocTitle = (name?: string | null) => useEffect(() => {
  if (name) document.title = document.title.replace(/^[^·]*·/, `${name} ·`);
}, [name]);

export type DetailKey = 'club' | 'project' | 'event' | 'dignitary' | 'member';
export interface Fact { label: string; value: string }
export interface Leader { role: string; name: string; photo?: Photo | null }

export interface ClubProfile {
  id: string;
  name: string;                         /* "Bombay": print with clubName() or "Rotary Club of …" */
  meeting: { day: string; time: string; place: string };   /* '' when unknown */
  details: Fact[];                      /* Chartered, Zone, …: only what the data has */
  glance: { members: number; projects: number; beneficiaries: number; amount: number; hours: number };
  contact: { email?: string; phone?: string; web?: string } | null;
  leaders: Leader[];                    /* this Rotary year's board: President, Secretary, … */
  members: Member[];                    /* the roster; live it can be 100+, so give it search and paging (data-filter) */
  projects: Project[];
  bulletins: Bulletin[];
  events: CalEntry[];
}
export interface ProjectDetail extends Project {
  description: string;                  /* plain text; paras() splits it into paragraphs */
  gallery: Photo[];                     /* the first is the cover; each alt is the admin's caption */
  location: string;
  rotarians: number | null;
  focus: string;                        /* area of focus, '' when none */
  clubId: string;                       /* '' when unknown */
}
export interface EventDetail {
  id: string;
  kind: 'club' | 'district';
  title: string;
  date: string;                         /* ISO yyyy-mm-dd */
  time: string;                         /* '' when the source has none */
  venue: string;
  club: string;                         /* '' for a district event */
  clubId: string;
  description: string;
  gallery: Photo[];
  registration: string;                 /* a URL, or '' */
  contact: { name?: string; email?: string; phone?: string } | null;
}
export interface DignitaryProfile extends Person {
  type: 'president' | 'dg';
  facts: Fact[];                        /* Rotary details: home club, classification, member since, … */
  contact: { email?: string; phone?: string } | null;
}
export interface MemberProfile { id: string; name: string; role: string; club: string; group: string; email: string; photo: Photo | null }

/* The words on these pages, and what live.ts fills (content.js → R.pages.club, .project, …) */
export interface DetailPages {
  club: { missing: string; back: string; details: string; glance: string; leadership: string; members: string; searchLabel: string; empty: string; more: string; pageSize: number;
          tabs: Record<'projects' | 'bulletins' | 'events', string>; none: Record<'projects' | 'bulletins' | 'events' | 'leaders', string>;
          example: string; sample: { leaders: Leader[]; members: Member[]; details: Fact[]; meetingTime: string; contact?: ClubProfile['contact'] }; item?: ClubProfile | null };
  project: { missing: string; back: string; about: string; gallery: string; organiser: string; figures: string; example: string;
             sample: Record<string, { description?: string; gallery?: Photo[]; location?: string; rotarians?: number; focus?: string }>; item?: ProjectDetail | null };
  event: { missing: string; back: string; about: string; when: string; where: string; organiser: string; register: string; contact: string; example: string | null;
           sample: Record<string, { description?: string; gallery?: Photo[]; registration?: string; contact?: EventDetail['contact'] }>; item?: EventDetail | null };
  dignitary: { missing: string; back: string; bio: string; details: string; contact: string; sample: Partial<Record<'president' | 'dg', { facts?: Fact[]; bio?: string }>>;
               item?: Partial<Record<'president' | 'dg', DignitaryProfile>> | null };
  member: { missing: string; back: string; club: string; email: string; committee: string; example: string; sample?: Record<string, { email?: string }>; item?: MemberProfile | null };
}
export const D = P as unknown as DetailPages;

/* ---------- reading the page's query string (none while rendering static HTML) ---------- */
const q = (k: string) => (STATIC ? null : new URLSearchParams(location.search).get(k));
const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/* Admin text → paragraphs. A blank line starts a paragraph. A single line break is read the way the admin meant it:
   a line that starts in lower case continues the sentence before it (a hard wrap: "A key highlight was / the entryway…"),
   a line ending in ":" runs on into the next ("Venue of Project: / Cotton Green Clinic:"), and a run of three or more
   short lines (a typed list: "Eye - 79 / Dental - 271 / …") becomes one line joined with " · " instead of a column of
   paragraphs. Anything else keeps its own paragraph. */
const LIST_LINE = (s: string) => s.length <= 40 && !/[.!?:]$/.test(s);      /* a line ending in ":" heads a list, it is not in it */
export const paras = (t: string) => String(t || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).flatMap(block => {
  const lines: string[] = [];
  let labelled = false;                         /* the last line already took in the line after its ":" */
  for (const raw of block.split('\n')) {
    const s = raw.trim();
    if (!s) continue;
    const prev: string | undefined = lines[lines.length - 1];
    const wrap: boolean = prev !== undefined && /^[a-z(]/.test(s);
    const label: boolean = prev !== undefined && !labelled && /:$/.test(prev);
    if (wrap || label) { lines[lines.length - 1] = `${prev} ${s}`; labelled = label; }
    else { lines.push(s); labelled = false; }
  }
  const out: string[] = [];
  for (let i = 0; i < lines.length;) {
    let j = i;
    while (j < lines.length && LIST_LINE(lines[j])) j++;
    if (j - i >= 3) { out.push(lines.slice(i, j).join(' · ')); i = j; }
    else out.push(lines[i++]);
  }
  return out;
});

/* ---------- ids and links ---------- */
const file = (k: DetailKey) => P.list.find(p => p.key === k)?.file ?? `${k}.html`;
const enc = encodeURIComponent;
export const eventId = (e: CalEntry) => String(e.id ?? `${e.date}-${slug(e.title ?? '')}`);
export const memberId = (m: Member) => String(m.id ?? slug(m.name));
export const clubHref = (id: string | number) => `${file('club')}?id=${enc(String(id))}`;
export const projectHref = (p: { id: string | number }) => `${file('project')}?id=${enc(String(p.id))}`;
export const eventHref = (e: CalEntry) => `${file('event')}?id=${enc(eventId(e))}`;
export const dignitaryHref = (type: 'president' | 'dg') => `${file('dignitary')}?type=${type}`;
/* like production, the card forwards what it shows, so the profile header matches it while the rest loads */
export const memberHref = (m: Member) => `${file('member')}?id=${enc(memberId(m))}&name=${enc(m.name)}&role=${enc(m.role)}&club=${enc(m.club)}`;
export const clubIdOf = (name?: string) => (name ? String(clubs().find(c => c.name === name)?.id ?? '') : '');

const calEvents = () => R.calendar.entries.filter(e => e.type === 'club' || e.type === 'district');
const allBulletins = () => R.years.list.flatMap(y => R.press.byYear[y]?.bulletins ?? []);

/* ---------- the items ---------- */
export const clubProfile = (): ClubProfile | null => {
  const id = q('id') ?? D.club.example;
  const live = D.club.item;
  if (live && String(live.id) === String(id)) return live;
  if (live === null) return null;
  const c = clubs().find(x => String(x.id) === String(id));
  if (!c) return null;
  const projects = P.projects.list.filter(p => p.club === c.name);
  const t = totals(projects);
  const s = D.club.sample;
  return {
    id: String(c.id), name: c.name,
    meeting: { day: c.day ?? '', time: s.meetingTime, place: c.place ?? '' },
    details: s.details, contact: s.contact ?? null,
    glance: { members: s.members.length, projects: t.projects, beneficiaries: t.beneficiaries, amount: t.amount, hours: t.hours },
    leaders: s.leaders, members: s.members,
    projects, bulletins: allBulletins().filter(b => b.club === c.name), events: calEvents().filter(e => e.club === c.name)
  };
};

export const projectDetail = (): ProjectDetail | null => {
  const id = q('id') ?? D.project.example ?? String(P.projects.list[0]?.id ?? '');
  const live = D.project.item;
  if (live && String(live.id) === String(id)) return live;
  if (live === null) return null;
  const p = P.projects.list.find(x => String(x.id) === String(id));
  if (!p) return null;
  const s = D.project.sample[String(p.id)] ?? {};
  return { ...p, description: s.description ?? p.summary, gallery: s.gallery ?? [p.photo], location: s.location ?? '', rotarians: s.rotarians ?? null, focus: s.focus ?? '', clubId: clubIdOf(p.club) };
};

export const eventDetail = (): EventDetail | null => {
  const first = calEvents()[0];
  const id = q('id') ?? D.event.example ?? (first ? eventId(first) : '');
  const live = D.event.item;
  if (live && live.id === id) return live;
  if (live === null) return null;
  const e = calEvents().find(x => eventId(x) === id);
  if (!e) return null;
  const s = D.event.sample[id] ?? {};
  return {
    id, kind: e.type === 'district' ? 'district' : 'club', title: e.title ?? '', date: e.date, time: e.time ?? '', venue: e.venue ?? '',
    club: e.club ?? '', clubId: clubIdOf(e.club), description: s.description ?? '', gallery: s.gallery ?? [], registration: s.registration ?? '', contact: s.contact ?? null
  };
};

export const dignitaryProfile = (): DignitaryProfile | null => {
  const t = (q('type') ?? 'president').toLowerCase();
  const type: 'president' | 'dg' = t === 'dg' || t === '2' || t === 'governor' ? 'dg' : 'president';
  const live = D.dignitary.item?.[type];
  if (live) return live;
  if (D.dignitary.item === null) return null;
  const p = R.dignitaries.byYear[R.years.current]?.[type];
  if (!p) return null;
  const s = D.dignitary.sample[type] ?? {};
  return { ...p, bio: s.bio ?? p.bio, type, facts: s.facts ?? [], contact: type === 'dg' ? { email: R.contact.email, phone: R.contact.phoneDisplay } : null };
};

export const memberProfile = (): MemberProfile | null => {
  const id = q('id') ?? D.member.example;
  const live = D.member.item;
  if (live && live.id === id) return live;
  if (live === null) return null;
  for (const g of committee()) for (const m of g.members)
    if (memberId(m) === id) return { id, name: q('name') ?? m.name, role: q('role') ?? m.role, club: q('club') ?? m.club, group: g.title, email: m.email ?? D.member.sample?.[id]?.email ?? '', photo: m.photo ?? null };
  const name = q('name');
  return name ? { id: id ?? '', name, role: q('role') ?? '', club: q('club') ?? '', group: '', email: '', photo: null } : null;
};
