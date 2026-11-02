# RID 3141 — Homepage Sections (live structure)

Every theme renders **only the sections the live home page shows**, in the same
order, from `shared/content.js` (`window.CONTENT`).

Content is the live https://rid3141.rotaryindia.org/ home page, captured on 2 Nov 2026
from the same API calls the React app makes (`district_website_react/src/pages/Home`).
It is a static snapshot. The production build fetches it live.

| # | Section | Live source | Content fields | `content.js` key |
|---|---------|-------------|----------------|------------------|
| 0 | **Header / nav** | `Layout.tsx` + menus API | Logo; nav (Home · About · District Committee · Club Finder · Club Projects · Club Service · Optimus Studio); Join Rotary and Admin Login buttons; contact email and phone; Rotary-year selector | `site`, `nav`, `headerCtas` |
| 1 | **Banner** (full-bleed) + **advertisement** (popup on load) | `website-data/banners`, `/advertisements` | 2 uploaded banners (996×596, shown uncropped, autoplay 5 s). The ad slot falls back to the Four-Way Test graphic because the district has no ads. | `hero.slides`, `hero.ads` |
| 2 | **District Snapshot** | projects + club-finder + district APIs | Projects: 2,727 Projects (links to /projects), 61,965 Man Hours, ₹54.24 Cr Amount Spent, 6,37,150 Beneficiaries. Membership: 125 Clubs, 7,168 Members | `stats` |
| 3 | **Dignitaries of Rotary** | international-president, district-governor | RI President Olayinka Hakeem Babalola (photo, term, bio); DG Rajan Dua (photo, term, no bio published). "Read more" goes to /dignitary | `dignitaries` |
| — | *District Events / Projects tabs* | district-events, projects | **Hidden.** The live site shows this card only when either list has rows, and both are empty for 2026-27. | `districtEvents`, `districtProjects` (empty) |
| 4 | **What's Happening** (calendar) | `mobile/district-calendar` (12 months) + per-club events | Pick any month and year (2016-2027) with the arrows or pickers. Today = 2 Nov 2026. Birthdays and anniversaries recur every year, so each month is one file in `shared/data/cal-MM.js`, loaded only when that month is opened. Dated club events (13: 9 in Nov, 4 in Dec 2026) are in `content.js`. Tabs: All · Club Events · District Events · Birthdays · Anniversaries | `calendar` + `shared/data/` |
| 5 | **Newsletters** | GML + club bulletin fan-out | Governor's Monthly Letter: none yet for 2026-27, so an empty state shows. The 8 latest club bulletins (title, club, date, PDF), out of 105. | `news` |
| — | *Club search (aurora)* | `mobile/club-finder` | All 125 clubs (name, meeting day, meeting place, id), used by aurora's Ctrl/⌘K club search; each result opens the club's page on the live site | `clubs` |
| 6 | **Footer** | `Layout.tsx` | Visitor counter (10,444); Rotary Links; Quick Links; Social (Facebook); "Together, we Create Change" | `footer` |

Images saved locally in `shared/img/live/`: banners, the ad graphic and both dignitary
photos. Member photos in the calendar load from rizones45678.org. Where a photo 404s,
the calendar shows the member's initials instead.

Earlier drafts used a 16-section dummy brief. That content is kept in the scratchpad,
not here.
