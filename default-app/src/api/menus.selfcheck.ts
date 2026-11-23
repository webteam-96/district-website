/* Self-check for the nav mapping. No framework — run it with bare node:
     node src/api/menus.selfcheck.ts
   Fixtures are REAL payloads captured from production (districts 3011 and 3220);
   3220 is the only district migrated to slug linkValues and the only one with
   sub-menus, so it covers both dialects at once. */
import assert from 'node:assert/strict';
import { buildNav, pageRoute, listOf, type MenuRow } from './menus.ts';

/* ---- district 3011 (id 471): all-legacy .aspx, sortOrder all 0 ---- */
const D3011: MenuRow[] = [
  { id: 705, menuName: 'Home', linkType: 'page', linkValue: 'Home.aspx', sortOrder: 0, isActive: true, isDefault: 1, subMenuCount: 0 },
  { id: 706, menuName: 'District Committee', linkType: 'page', linkValue: 'DistrictCommitteNew.aspx', sortOrder: 0, isActive: true, isDefault: 0, subMenuCount: 0 },
  { id: 707, menuName: 'Club Finder', linkType: 'page', linkValue: 'ClubsFinder.aspx', sortOrder: 0, isActive: true, isDefault: 0, subMenuCount: 0 },
  { id: 708, menuName: 'CLUB PROJECTS', linkType: 'page', linkValue: '#', sortOrder: 0, isActive: true, isDefault: 0, subMenuCount: 0 },
  { id: 709, menuName: 'Newsletters', linkType: 'page', linkValue: 'Newsletter.aspx', sortOrder: 0, isActive: true, isDefault: 0, subMenuCount: 0 },
  { id: 710, menuName: 'CALENDAR', linkType: 'page', linkValue: 'AllSpecialDates.aspx', sortOrder: 0, isActive: true, isDefault: 1, subMenuCount: 0 },
];

const nav3011 = buildNav(D3011);
// 'CLUB PROJECTS -> #' has no usable linkValue; the NAME fallback rescues it,
// which is what keeps Club Projects in the nav of ~40 unmigrated districts.
assert.deepEqual(
  nav3011.map((n) => [n.label, n.target]),
  [['Home', '/'], ['District Committee', '/district-committee'], ['Club Finder', '/club-finder'],
   ['CLUB PROJECTS', '/projects'], ['Newsletters', '/newsletters'], ['CALENDAR', '/calendar']],
  'legacy .aspx dialect maps in server order',
);

/* ---- district 3220 (id 181): migrated slugs + sub-menus + legacy leftovers ---- */
const D3220: MenuRow[] = [
  { id: 12273, menuName: 'Newsletters', linkType: 'page', linkValue: 'Newsletter.aspx', sortOrder: 0, isActive: true, subMenuCount: 0 },
  { id: 12277, menuName: 'Register', linkType: 'page', linkValue: 'Please register for all upcoming events, seminars, DISCON etc from here', sortOrder: 0, isActive: true, subMenuCount: 0 },
  { id: 12269, menuName: 'Home', linkType: 'page', linkValue: 'home', sortOrder: 1, isActive: true, subMenuCount: 0 },
  { id: 12270, menuName: 'District Committee', linkType: 'page', linkValue: 'district-committee', sortOrder: 2, isActive: true, subMenuCount: 0 },
  { id: 12271, menuName: 'Club Finder', linkType: 'page', linkValue: 'club-finder', sortOrder: 3, isActive: true, subMenuCount: 0 },
  { id: 12272, menuName: 'CLUB PROJECTS', linkType: 'page', linkValue: 'club-projects', sortOrder: 4, isActive: true, subMenuCount: 6 },
  { id: 49381, menuName: 'Newsletter', linkType: 'page', linkValue: 'newsletter', sortOrder: 5, isActive: true, subMenuCount: 2 },
  { id: 12274, menuName: 'CALENDAR', linkType: 'page', linkValue: 'calendar', sortOrder: 6, isActive: true, subMenuCount: 0 },
];
// Real /submenus payload, envelope included.
const SUB_12272 = { value: [
  { id: 8196, menuId: 12272, subMenuName: 'Community Service', linkType: 'page', linkValue: 'community_service', sortOrder: 1, isActive: true },
  { id: 8197, menuId: 12272, subMenuName: 'Club Service', linkType: 'page', linkValue: 'club_service', sortOrder: 2, isActive: true },
  { id: 8198, menuId: 12272, subMenuName: 'Vocational Service', linkType: 'page', linkValue: 'vocational_service', sortOrder: 3, isActive: true },
  { id: 8199, menuId: 12272, subMenuName: 'New Generation Service', linkType: 'page', linkValue: 'new_generation_service', sortOrder: 4, isActive: true },
  { id: 8200, menuId: 12272, subMenuName: 'International Service', linkType: 'page', linkValue: 'international_service', sortOrder: 5, isActive: true },
  { id: 8201, menuId: 12272, subMenuName: 'Public Image Initiative', linkType: 'page', linkValue: 'public_image_initiative', sortOrder: 6, isActive: true },
], Count: 6 };
const SUB_49381 = { value: [
  { id: 8202, menuId: 49381, subMenuName: 'District Newsletter', linkType: 'page', linkValue: 'district-newsletter', sortOrder: 1, isActive: true },
  { id: 8203, menuId: 49381, subMenuName: 'Club Newsletter', linkType: 'page', linkValue: 'club-newsletter', sortOrder: 2, isActive: true },
], Count: 2 };

const nav3220 = buildNav(D3220, { 12272: listOf(SUB_12272), 49381: listOf(SUB_49381) });

// sortOrder 1..6 lead; the two unset (0) legacy rows trail. The prose-blob
// "Register" row is dropped entirely — it maps to no page.
assert.deepEqual(
  nav3220.map((n) => n.label),
  ['Home', 'District Committee', 'Club Finder', 'CLUB PROJECTS', 'Newsletter', 'CALENDAR', 'Newsletters'],
  'sortOrder 0 sorts last, unmappable rows dropped',
);

const projects = nav3220.find((n) => n.label === 'CLUB PROJECTS')!;
assert.deepEqual(
  projects.children.map((c) => c.target),
  ['/projects?category=community-service', '/club-service', '/projects?category=vocational-service',
   '/projects?category=new-generation-service', '/projects?category=international-service',
   '/projects?category=public-image'],
  'avenue moduleKeys map to the category filter; club_service keeps its own page',
);

const news = nav3220.find((n) => n.label === 'Newsletter')!;
assert.deepEqual(
  news.children.map((c) => c.target),
  ['/newsletters?variant=governor', '/newsletters'],
  'district newsletter IS the GML variant; club newsletter is the default',
);

/* ---- link types ---- */
const typed = buildNav([
  { id: 1, menuName: 'Rotary', linkType: 'external', linkValue: 'www.rotary.org', isActive: true },
  { id: 2, menuName: 'Fellowship', linkType: 'external', linkValue: 'https://www.rotary.org/en/about-rotary', isActive: true },
  { id: 3, menuName: 'About RID', linkType: 'document', linkValue: '/uploads/menu/ABOUT_RID_306021112025022832PM.pdf', isActive: true },
  // Real row from district 3150: linkType says 'page', linkValue is a URL.
  { id: 4, menuName: 'Contact', linkType: 'page', linkValue: 'https://www.instamojo.com/RID3150/dosti3150/', isActive: true },
  { id: 5, menuName: 'Hidden', linkType: 'page', linkValue: 'home', isActive: false },
  // Real row from 3 districts — routes to the District Awards page.
  { id: 6, menuName: 'CP INDEX', linkType: 'page', linkValue: 'club_performance.aspx', isActive: true },
  { id: 7, menuName: 'Prose', linkType: 'page', linkValue: 'Please register for all upcoming events, seminars, DISCON etc from here', isActive: true },
]);
assert.deepEqual(
  typed.map((n) => [n.label, n.kind, n.target, n.doc]),
  [['Rotary', 'href', 'https://www.rotary.org', false],
   ['Fellowship', 'href', 'https://www.rotary.org/en/about-rotary', false],
   ['About RID', 'href', '/uploads/menu/ABOUT_RID_306021112025022832PM.pdf', true],
   ['Contact', 'href', 'https://www.instamojo.com/RID3150/dosti3150/', false],
   ['CP INDEX', 'route', '/district-awards', false]],
  'bare host gets a scheme; doc keeps its raw path; URL wins over linkType; inactive + unmapped dropped; CP INDEX routes',
);

/* ---- a placeholder row survives ONLY as a dropdown label ---- */
// 'SERVICES' matches no page and no name route, so its only reason to exist is
// to label its children.
const hashParent = buildNav(
  [{ id: 9, menuName: 'SERVICES', linkType: 'page', linkValue: '#', isActive: true, subMenuCount: 1 }],
  { 9: [{ id: 91, subMenuName: 'Community Service', linkType: 'page', linkValue: 'community_service', isActive: true }] },
);
assert.equal(hashParent.length, 1);
assert.equal(hashParent[0].kind, 'parent');
assert.equal(hashParent[0].target, '');
assert.equal(hashParent[0].children[0].target, '/projects?category=community-service');

// ...and is dropped when it has none (real rows: 'MILESTONES', 'Policies' -> '#').
assert.deepEqual(buildNav([{ id: 10, menuName: 'MILESTONES', linkType: 'page', linkValue: '#', isActive: true }]), []);

/* ---- contract with MENU-API-PAGES.md ----
   Every slug handed to the backend in that doc must resolve. If a row here ever
   fails, either the doc or PAGE_ROUTES changed without the other. */
const DOC_SLUGS: [string, string][] = [
  // section A — the five seeded defaults
  ['home', '/'], ['district-committee', '/district-committee'], ['club-finder', '/club-finder'],
  ['club-projects', '/projects'], ['club-service', '/club-service'],
  // section B — dashboard-addable
  ['about', '/about'], ['calendar', '/calendar'], ['newsletter', '/newsletters'],
  ['district-newsletter', '/newsletters?variant=governor'],
  ['district-governor', '/dignitary?type=governor'], ['ri-president', '/dignitary'],
  // the six avenue sub-menu moduleKeys
  ['community_service', '/projects?category=community-service'],
  ['club_service', '/club-service'],
  ['vocational_service', '/projects?category=vocational-service'],
  ['new_generation_service', '/projects?category=new-generation-service'],
  ['international_service', '/projects?category=international-service'],
  ['public_image_initiative', '/projects?category=public-image'],
];
for (const [slug, route] of DOC_SLUGS) {
  assert.equal(pageRoute(slug), route, 'documented slug "' + slug + '" must map to ' + route);
}

/* ---- key folding + empty input ---- */
assert.equal(pageRoute('/Home.aspx'), '/');
assert.equal(pageRoute('  DISTRICTCOMMITTENEW.ASPX '), '/district-committee');
assert.equal(pageRoute('nope'), '');
assert.equal(pageRoute(''), '');
assert.equal(pageRoute(null), '');
assert.deepEqual(buildNav([]), []);
assert.deepEqual(listOf(null), []);

console.log('menus selfcheck OK');
