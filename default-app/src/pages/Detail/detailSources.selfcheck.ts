/* Self-check for the four detail mappers. No framework — run it with bare node:
     node src/pages/Detail/detailSources.selfcheck.ts
   Fixtures are REAL payloads captured from production (district 3011 / id 471),
   trimmed to the fields the mappers read. They pin the three things that differ
   per endpoint and are easy to get wrong: the response WRAPPER key, the photo
   field names/order, and which cost/date field carries the value. */
import assert from 'node:assert/strict';
import { mapClubProject, mapDistrictProject, mapDistrictEvent, mapClubEvent, mapUpcomingEvent } from './detailSources.ts';

/* ---- club project — /api/public/projects/{id}: { project, photos } ---- */
const clubProject = mapClubProject({
  project: {
    id: 1, title: 'Tree Plantation', description: 'd', projectDate: '2025-06-01T00:00:00',
    projectCost: 5000, directBeneficiaries: 40, manHours: 12, rotariansInvolved: 9, location: 'Sector 5',
    areaOfFocus: 'ENVIRONMENT', clubId: 614, clubName: 'Delhi South', clubCity: 'Delhi', clubState: 'DL',
  },
  photos: [
    { imagePath: '/Documents/Project/b.jpg', isPrimary: false },
    { imagePath: '/Documents/Project/a.jpg', isPrimary: true },
  ],
})!;
assert.equal(clubProject.owner, 'Delhi South');
assert.equal(clubProject.location, 'Sector 5, Delhi, DL', 'club location joins city + state');
assert.equal(clubProject.badge, 'ENVIRONMENT');
assert.equal(clubProject.cost, 5000);
assert.equal(clubProject.rotarians, 9);
assert.equal(clubProject.clubId, '614', 'clubId drives the President/Secretary lookup');
assert.equal(clubProject.withTime, false);
assert.ok(/a\.jpg$/.test(clubProject.images[0].path), 'primary photo sorts first');
assert.equal(clubProject.images.length, 2);

/* ---- district project — /api/districts/{d}/projects/{yearId}/{id} ----
   Note: detail returns areaOfFocusId (an ID), never a name → no badge. And
   amountSpent wins over projectCost when the district recorded it. */
const districtProject = mapDistrictProject({
  project: {
    id: 113248, yearId: 41, title: 'Career Counselling 5.0', description: 'd', location: null,
    areaOfFocusId: 1, categoryId: 7, projectDate: '2020-10-22T00:00:00',
    projectCost: 10000, amountSpent: null, directBeneficiaries: 100, manHours: 45, rotariansInvolved: 15,
  },
  photos: [{ imagePath: '/Documents/DistrictProject/471/a.png', isPrimary: false, sortOrder: 0 }],
})!;
assert.equal(districtProject.badge, '', 'detail has no area-of-focus NAME to show');
assert.equal(districtProject.cost, 10000, 'falls back to projectCost when amountSpent is null');
assert.equal(districtProject.location, '');
assert.equal(districtProject.beneficiaries, 100);
assert.equal(districtProject.rotarians, 15);
assert.equal(districtProject.clubId, '', 'district-owned -> no club, so no officer lookup');
assert.equal(mapDistrictProject({ project: { amountSpent: 7500, projectCost: 10000 }, photos: [] })!.cost, 7500);
assert.equal(mapDistrictProject({ eventDetail: {} }), null, 'wrong wrapper key -> null, not a blank page');
assert.equal(
  mapDistrictProject({ project: { directBeneficiaries: 'n/a', projectCost: '1,200' }, photos: [] })!.beneficiaries,
  null,
  'junk numerics read as absent — a NaN would render as a "NaN" stat card',
);

/* ---- district event — { eventDetail, photos } (NOT { project, … }) ----
   `location` ships with the backend fix to the detail SELECT; until it does the
   field is simply absent and the Location card must not render. */
const districtEvent = mapDistrictEvent({
  eventDetail: { id: 136849, yearId: 43, title: 'Rotary Badminton League', description: 'd', eventDate: '2023-05-05T00:00:00', location: 'Siri Fort Sports Complex' },
  photos: [
    { imagePath: '/Documents/DistrictEvent/471/b.jpeg', description: 'Finals', sortOrder: 1 },
    { imagePath: '/Documents/DistrictEvent/471/a.jpeg', description: 'Opening ceremony', sortOrder: 0 },
  ],
})!;
assert.equal(districtEvent.title, 'Rotary Badminton League');
assert.equal(districtEvent.location, 'Siri Fort Sports Complex');
assert.equal(districtEvent.images[0].caption, 'Opening ceremony', 'each photo keeps its own caption through the sort');
assert.equal(districtEvent.images[1].caption, 'Finals');
assert.equal(
  mapDistrictEvent({ eventDetail: { title: 'x' }, photos: [{ imagePath: '/a.jpg' }] })!.location,
  '',
  'pre-fix API (no location field) -> no Location card',
);
assert.equal(
  mapDistrictEvent({ eventDetail: { title: 'x' }, photos: [{ imagePath: '/a.jpg' }] })!.images[0].caption,
  '',
  'a photo with no description gets an empty caption, not undefined',
);
assert.equal(districtEvent.withTime, false, 'midnight = a date-only event, no Time card');
assert.equal(
  mapDistrictEvent({ eventDetail: { eventDate: '2023-05-05T00:00:00Z' }, photos: [] })!.withTime,
  false,
  'a zoned midnight is still date-only — no local-time 5:30 am',
);
assert.equal(districtEvent.cost, null);
assert.ok(/a\.jpeg$/.test(districtEvent.images[0].path), 'sortOrder decides when nothing is primary');

/* ---- club event — FLAT payload, single imagePath, real clock time ---- */
const clubEvent = mapClubEvent({
  eventId: 37596, clubId: 614, clubName: 'Delhi Garden City', title: 'Blood Donation Camp',
  description: 'd', imagePath: null, eventDate: '2026-08-14T09:00:00',
  venue: 'Indian Bank, Sansad Marg', registrationLink: null,
  organizerName: 'Kapil Goswamy', organizerEmail: 'k@example.com', organizerMobile: '9811028077',
})!;
assert.equal(clubEvent.location, 'Indian Bank, Sansad Marg', 'venue -> location');
assert.equal(clubEvent.withTime, true, '09:00 is a real start time');
assert.equal(clubEvent.backTo, '/club?id=614', 'back link points at the owning club');
assert.equal(clubEvent.images.length, 0, 'null imagePath -> no gallery at all, not a broken img');
assert.equal(clubEvent.contact!.mobile, '9811028077');
assert.equal(clubEvent.registrationLink, '');
assert.equal(mapClubEvent({ message: 'Event not found.' }), null);

/* ---- upcoming event — the home calendar's District Events tab. A DIFFERENT
   module from district-events: flat payload, `eventVenue` (not `venue`), and
   ids that must never be sent to /district-event. ---- */
const upcoming = mapUpcomingEvent({
  id: 30981, clubId: 0, title: 'AGASTYA President Elect Meet (PEM-1)', description: 'President Elect Meet',
  imagePath: '/Documents/Event/Group471/fff05092024034155PM.jpeg',
  eventDate: '2024-09-08T12:00:00', eventVenue: 'Orana Conventions, Sector 64 Gurugram',
  registrationLink: 'https://zfrmz.com/LV6nCnXHOcDPWGCRYvZ9', status: 'Expired',
})!;
assert.equal(upcoming.location, 'Orana Conventions, Sector 64 Gurugram', 'eventVenue -> location');
assert.equal(upcoming.withTime, true, '12:00 is a real start time');
assert.equal(upcoming.images.length, 1);
assert.equal(upcoming.registrationLink, 'https://zfrmz.com/LV6nCnXHOcDPWGCRYvZ9');
assert.equal(upcoming.owner, '', 'district-owned — Detail.tsx fills in the district name');
assert.equal(mapUpcomingEvent({ message: 'Not found' }), null);

console.log('detailSources selfcheck OK');
