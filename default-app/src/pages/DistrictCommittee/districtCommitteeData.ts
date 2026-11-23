/* districtCommitteeData.ts — District Committee data loaders, ported from the
   ASPX js/district-committee.js.

   Renders the committee structure for the RESOLVED district + year:
     1. "Executive Committee"      ← /api/districts/{id}/committee/members
        (the district's top office-bearers: Governor, District Secretaries, etc.)
     2. one section per committee  ← /api/districts/{id}/committee/groups
        each showing that committee's members
                                   ← /api/districts/{id}/committee/groups/{groupId}/members
        and, when the group has sub-groups (level 3), one sub-section per sub-group
                                   ← /api/districts/{id}/committee/groups/{groupId}/sub-groups
                                   ← /api/districts/{id}/committee/sub-groups/{subGroupId}/members

   Every committee (and every member) is listed verbatim from the API, in API
   order — no de-dup, no pagination across committees. The district comes from the
   subdomain and the year from the header's global year-select — BOTH resolved by
   RotaryAPI.ready() before any fetch and injected into every call by the wrapper
   (config.districtId / config.yearId). */
import RotaryAPI from '../../api/client';

export interface Card { name: string; role: string; club: string; photo: string; q: string }
export interface Sub { title: string; cards: Card[] }
export interface Section { title: string; openDefault: boolean; cards: Card[]; subs: Sub[] }

// Both /committee/members and /committee/groups/{id}/members return the same row
// shape, so one mapper serves both. Every row is rendered as-is (no de-dup).
function toCard(m: any): Card {
  const name = m.name || 'Member';
  const role = m.districtDesignation || m.district_designation || '';
  const club = m.clubName || m.club_name || '';
  return {
    name,
    role,
    club,
    photo: RotaryAPI.mediaUrl(m.profilePhoto || m.profile_photo || ''),
    q: (name + ' ' + role + ' ' + club).toLowerCase(), // search haystack
  };
}

// The sub-group members endpoint returns the RAW profile_photo column, unlike the
// group members endpoint which prefixes the storage folder server-side. Mirror that
// CASE here so bare filenames resolve.
function fixSubPhoto(m: any): any {
  let p = m.profilePhoto || '';
  if (p && p.charAt(0) !== '/' && !/^https?:\/\//.test(p)) {
    p = (m.memberId > 0 ? '/Documents/directory/' : '/Documents/DistrictCommittee/Group' + (m.clubId || 0) + '/') + p;
  }
  return Object.assign({}, m, { profilePhoto: p });
}

// Fetch EVERY member of a committee group. The API caps pageSize at 200, so we
// page through when a committee is larger, and never silently truncate.
function allGroupMembers(groupId: number | string): Promise<any[]> {
  return RotaryAPI.committeeGroupMembers(groupId, { page: 1, pageSize: 200 }).then((res: any) => {
    let items = (res && res.items) || [];
    const totalPages = (res && res.totalPages) || 1;
    if (totalPages <= 1) return items;
    const extra: Promise<any>[] = [];
    for (let p = 2; p <= totalPages; p++) {
      extra.push(RotaryAPI.committeeGroupMembers(groupId, { page: p, pageSize: 200 }));
    }
    return Promise.all(extra).then((rs: any[]) => {
      rs.forEach((r) => { items = items.concat((r && r.items) || []); });
      return items;
    });
  });
}

// Executive (level 1) + the committee groups (level 2), then every committee's
// members (and any level-3 sub-groups) concurrently — keeping API sort order. A
// failure of any piece degrades to an empty list rather than blanking the page.
export function loadCommittee(): Promise<Section[]> {
  return Promise.all([
    RotaryAPI.committeeMembers({ page: 1, pageSize: 200 }).catch(() => ({ items: [] })),
    RotaryAPI.committeeGroups({ page: 1, pageSize: 200 }).catch(() => ({ items: [] })),
  ]).then((res: any[]) => {
    const execItems = (res[0] && res[0].items) || [];
    const groups = (res[1] && res[1].items) || []; // ALL groups, incl. club rosters, in API order

    return Promise.all(groups.map((g: any) => {
      const membersP = allGroupMembers(g.id).catch(() => []);
      // Many committees keep ALL their members in sub-groups, with zero direct members.
      const subsP = g.subGroupCount > 0
        ? RotaryAPI.committeeSubGroups(g.id).then((sgs: any[]) =>
            Promise.all((sgs || []).map((sg: any) =>
              RotaryAPI.committeeSubGroupMembers(sg.id)
                .then((ms: any[]) => ({ sub: sg, members: ms || [] }))
                .catch(() => ({ sub: sg, members: [] })),
            )),
          ).catch(() => [])
        : Promise.resolve([]);
      return Promise.all([membersP, subsP]).then((r: any[]) => ({ group: g, members: r[0], subs: r[1] }));
    })).then((groupData: any[]) => {
      // Render exactly what the API returns, in API order — no de-dup.
      // Executive expanded, every other committee collapsed.
      const sections: Section[] = [];
      if (execItems.length) {
        sections.push({ title: 'Executive Committee', openDefault: true, cards: execItems.map(toCard), subs: [] });
      }
      groupData.forEach((gd) => {
        const subs = gd.subs.filter((s: any) => s.members.length);
        const total = subs.reduce((n: number, s: any) => n + s.members.length, gd.members.length);
        if (!total) return; // nothing in the group OR its sub-groups → nothing to show
        sections.push({
          title: gd.group.groupName,
          openDefault: false,
          cards: gd.members.map(toCard),
          subs: subs.map((s: any) => ({ title: s.sub.subGroupName, cards: s.members.map(fixSubPhoto).map(toCard) })),
        });
      });
      return sections;
    });
  });
}
