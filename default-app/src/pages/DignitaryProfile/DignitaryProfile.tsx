/* DignitaryProfile — Dignitary detail page (RI President / District Governor).
   Faithful port of DignitaryProfile.aspx + js/dignitary-profile.js. Mirrors the
   legacy diginitary.aspx?Type=1/2: a navy banner + photo panel + full
   designation, name, term, biography and (for the DG) Rotary/contact details.
   ?type=president|1  -> RI President (international-president endpoint, has a bio
                         `description`).
   ?type=dg|2         -> District Governor (public governor feed + committee
                         fallback + /api/members/{id} enrichment).
   The JS re-renders progressively (first paint from the governor/committee row,
   then enrich from the member record). Here that's modelled by calling `show`
   more than once — each call updates state. Photo onError swaps to the user glyph
   (onError→state), matching the aspx's img.onerror outerHTML swap. */
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import RotaryAPI from '../../api/client';
import { sanitizeAdminHtml } from '../../api/adminHtml';

const resolveMedia = (p: any) => RotaryAPI.mediaUrl(p);

function fmtDate(s: any): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return d.toDateString();
  }
}

/* ---- inline SVG helper + icon inner-paths (mirror the aspx svg()/IC) ---- */
const Svg = ({ inner, cls, sw = 2 }: { inner: JSX.Element; cls: string; sw?: number }) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inner}</svg>
);
const IC: Record<string, JSX.Element> = {
  arrowLeft: (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  chevronRight: (<path d="m9 18 6-6-6-6" />),
  loader: (<path d="M21 12a9 9 0 1 1-6.219-8.56" />),
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  building: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></>),
  idCard: (<><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2" /><path d="M15 12h2" /><path d="M7 15.5c.5-1 1.7-1.5 2-1.5s1.5.5 2 1.5" /></>),
  briefcase: (<><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>),
  calendar: (<><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>),
  mail: (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
  phone: (<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />),
};

/* ---- data shapes ---- */
interface Row { icon: JSX.Element; label: string; value: any; href?: string }
interface Profile {
  name: string;
  designation: string;
  term?: string;
  photo?: string;
  bioHtml?: string;
  bioText?: string;
  detailRows?: Row[];
  crumb?: string;
}

/* ---- info row (aspx infoRow) ---- */
function InfoRow({ icon, label, value, href }: Row) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Svg inner={icon} cls="h-[18px] w-[18px]" sw={2} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
        {href ? (
          <a href={href} className="block break-words text-[14px] font-medium text-ink transition-colors hover:text-brand-blue">{value}</a>
        ) : (
          <dd className="break-words text-[14px] font-medium text-ink">{value}</dd>
        )}
      </div>
    </div>
  );
}

/* ---- photo panel: img with onError→user-glyph fallback (aspx img.onerror) ---- */
function PhotoPanel({ photo, name }: { photo?: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!photo || err) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <Svg inner={IC.user} cls="h-28 w-28 text-white/25" sw={1.25} />
      </div>
    );
  }
  return (
    <img src={photo} alt={name} className="relative block aspect-[4/5] w-full object-cover object-top" onError={() => setErr(true)} />
  );
}

/* ---- bio: RI-President / DG bios are admin-entered rich HTML from our own API;
   render as HTML (strip <script> defensively). Plain-text intro otherwise. ---- */
function BioBlock({ html, text }: { html?: string; text?: string }) {
  if (html) {
    const safe = sanitizeAdminHtml(html);
    return <div className="dignitary-bio mt-4 space-y-3 text-[14.5px] leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: safe }} />;
  }
  if (text) {
    return <p className="mt-4 whitespace-pre-line text-[14.5px] leading-relaxed text-muted">{text}</p>;
  }
  return null;
}

/* ------------------------------ loaders ------------------------------ */
function dgDetailRows(club: string, m: any): Row[] {
  m = m || {};
  return [
    { icon: IC.building, label: 'Club', value: club ? 'Rotary Club of ' + club : '' },
    { icon: IC.idCard, label: 'Rotary ID', value: m.rotaryId },
    { icon: IC.briefcase, label: 'Classification', value: m.classificationProfession },
    { icon: IC.calendar, label: 'Member Since', value: fmtDate(m.joinedDate) },
    { icon: IC.mail, label: 'Email', value: m.emailId, href: m.emailId ? 'mailto:' + m.emailId : undefined },
    { icon: IC.phone, label: 'Phone', value: m.primaryMobileNumber, href: m.primaryMobileNumber ? 'tel:' + m.primaryMobileNumber : undefined },
  ];
}

function loadPresident(show: (d: Profile) => void, notFound: () => void) {
  if (!RotaryAPI.internationalPresident) { notFound(); return; }
  RotaryAPI.internationalPresident()
    .then((p: any) => {
      if (!p || !p.name) { notFound(); return; }
      show({
        name: (p.name || '').trim(),
        designation: p.designation || 'President, Rotary International',
        term: p.yearLabel ? 'Rotary International ' + p.yearLabel : '',
        photo: resolveMedia(p.profilePhotoPath || p.profilePhoto),
        bioHtml: p.description || '',
        crumb: 'RI President',
      });
    })
    .catch(() => notFound());
}

// PRIMARY DG source: the AUTHORITATIVE district_governors feed — the dedicated
// year-scoped public endpoint /api/public/club/{clubId}/district-governor?yearId=.
// Falls back to the committee roster only when this can't resolve (e.g. a district
// with no serviceable club).
function loadDGFromPublic(show: (d: Profile) => void, notFound: () => void) {
  const cfg = RotaryAPI.config;
  if (!RotaryAPI.districtGovernor) { loadDGFromCommittee(show, notFound); return; }
  RotaryAPI.districtGovernor(cfg.yearId)
    .then((g: any) => {
      if (!g || !g.memberName) { loadDGFromCommittee(show, notFound); return; }
      const base = {
        name: (g.memberName || '').trim() || 'District Governor',
        designation: g.designation || 'District Governor',
        term: g.yearLabel ? 'Rotary Year ' + g.yearLabel : (cfg.yearLabel ? 'Rotary Year ' + cfg.yearLabel : ''),
        club: '',
        photo: resolveMedia(g.profilePhoto || g.profilePhotoPath || ''),
        crumb: 'District Governor',
      };
      // First paint from the governor record (carries photo + contact + bio),
      // then enrich from the member record (Rotary ID / classification / joined).
      show({
        name: base.name, designation: base.designation, term: base.term,
        photo: base.photo, crumb: base.crumb,
        // The governor's bio is admin-entered rich HTML (same as the RI-President
        // bio) — render it as HTML so the <p>/&nbsp; markup formats the text
        // instead of showing as literal tags. BioBlock strips <script> defensively.
        bioHtml: g.description || '',
        detailRows: dgDetailRows(base.club, { emailId: g.email, primaryMobileNumber: g.mobileNumber }),
      });
      if (g.memberId) {
        RotaryAPI.get('/api/members/' + g.memberId)
          .then((m: any) => {
            m = m || {};
            show({
              name: base.name, designation: base.designation, term: base.term, crumb: base.crumb,
              photo: base.photo || resolveMedia(m.profilePhotoPath),
              // Prefer the HTML bio; fall back to the member's plain-text intro.
              bioHtml: g.description || '',
              bioText: g.description ? '' : (m.memberIntroduction || ''),
              detailRows: dgDetailRows(base.club, {
                rotaryId: m.rotaryId,
                classificationProfession: m.classificationProfession,
                joinedDate: m.joinedDate,
                emailId: m.emailId || g.email,
                primaryMobileNumber: m.primaryMobileNumber || g.mobileNumber,
              }),
            });
          })
          .catch(() => {});
      }
    })
    .catch(() => loadDGFromCommittee(show, notFound));
}

// FALLBACK DG source: the committee roster, for districts the public feed
// can't resolve.
function loadDGFromCommittee(show: (d: Profile) => void, notFound: () => void) {
  const cfg = RotaryAPI.config;
  RotaryAPI.get('/api/districts/' + cfg.districtId + '/committee/members', { yearId: cfg.yearId })
    .then((res: any) => {
      const items = (res && res.items) || res || [];
      const dg = items.filter((i: any) => RotaryAPI.isDistrictGovernor(i.districtDesignation))[0];
      if (!dg) { notFound(); return; }
      const base = {
        name: (dg.name || '').trim() || 'District Governor',
        designation: dg.districtDesignation || 'District Governor',
        term: dg.yearLabel ? 'Rotary Year ' + dg.yearLabel : (cfg.yearLabel ? 'Rotary Year ' + cfg.yearLabel : ''),
        club: dg.clubName || '',
        photo: resolveMedia(dg.profilePhoto || dg.profile_photo || dg.ProfilePhotoPath || ''),
        crumb: 'District Governor',
      };
      // First paint from the committee row, then enrich from the member record
      // (photo, bio, classification, contact).
      show({
        name: base.name, designation: base.designation, term: base.term,
        photo: base.photo, crumb: base.crumb, detailRows: dgDetailRows(base.club, null),
      });
      const mid = dg.memberId || dg.fk_member_id || dg.pk_member_master_profile_id;
      if (mid) {
        RotaryAPI.get('/api/members/' + mid)
          .then((m: any) => {
            show({
              name: base.name, designation: base.designation, term: base.term, crumb: base.crumb,
              // Prefer the member record's photo: the committee row's profilePhoto
              // can be a stale path that 404s (e.g. 3233's DG), while the member
              // profile carries the real uploaded picture.
              photo: resolveMedia(m.profilePhotoPath) || base.photo,
              bioText: m.memberIntroduction || '',
              detailRows: dgDetailRows(base.club, m),
            });
          })
          .catch(() => {});
      }
    })
    .catch(() => notFound());
}

/* ------------------------------- page ------------------------------- */
export default function DignitaryProfile() {
  const [sp] = useSearchParams();
  // ?type=2|dg|governor -> District Governor; anything else -> RI President.
  const type = (sp.get('type') || '').toLowerCase();
  const isDG = type === '2' || type === 'dg' || type === 'governor';

  const [status, setStatus] = useState<'loading' | 'notfound' | 'profile'>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setProfile(null);
    const show = (d: Profile) => { if (alive) { setProfile(d); setStatus('profile'); } };
    const notFound = () => { if (alive) setStatus('notfound'); };
    if (isDG) loadDGFromPublic(show, notFound);
    else loadPresident(show, notFound);
    return () => { alive = false; };
  }, [isDG]);

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="home">
      {status === 'loading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
          <Svg inner={IC.loader} cls="h-8 w-8 animate-spin text-brand-blue" sw={2} />
          <p className="text-sm font-semibold text-muted">Loading…</p>
        </div>
      )}

      {status === 'notfound' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
          <p className="text-lg font-semibold text-ink">Details not available.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">
            <Svg inner={IC.arrowLeft} cls="h-4 w-4" sw={2} /> Back to Home
          </Link>
        </div>
      )}

      {status === 'profile' && profile && <ProfileView d={profile} />}
    </main>
  );
}

function ProfileView({ d }: { d: Profile }) {
  const rows = (d.detailRows || []).filter((r) => r.value);
  return (
    <>
      {/* ---- banner ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">{d.name}</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <Svg inner={IC.chevronRight} cls="h-4 w-4 text-brand-gold" sw={2.5} />
              <span className="text-white/70">{d.crumb || 'Dignitaries'}</span>
              <Svg inner={IC.chevronRight} cls="h-4 w-4 text-brand-gold" sw={2.5} />
              <span className="font-medium text-brand-gold">{d.name}</span>
            </nav>
          </div>
        </div>
      </section>

      {/* ---- card ---- */}
      <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
        <div className="mb-6 flex justify-end">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-brand-bluedark px-5 py-2.5 text-[13px] font-bold text-white shadow-pill transition-colors hover:bg-brand-blue">
            <Svg inner={IC.arrowLeft} cls="h-4 w-4" sw={2.25} /> Back to Home
          </Link>
        </div>
        {/* No overflow clipping on the card: `overflow-hidden` here would make it a
            scroll container and silently kill the photo's position:sticky. The photo
            carries its own radius instead (it is the only non-white child), so nothing
            needs clipping at this level. */}
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-divider/50">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            {/* self-start keeps the photo column at image height (not stretched to the
               taller bio), which is also what lets it stick: from md up it pins under
               the 80px sticky header while the page — bio and all — scrolls past.
               top-[92px] = header height + 12px breathing room.
               Radius: top-only on mobile (it sits in the card's top corners), all four
               from md up, where sticky floats it away from the card's corners. */}
            <div className="relative self-start overflow-hidden rounded-t-2xl bg-[#0a1c44] md:sticky md:top-[92px] md:rounded-2xl">
              {d.photo && <div className="absolute inset-0 bg-gradient-to-b from-[#0c265f] to-[#0a1c44]" />}
              <PhotoPanel key={d.photo || 'none'} photo={d.photo} name={d.name} />
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-gold">{d.designation}</p>
              <h2 className="mt-1 text-[24px] font-bold leading-tight text-brand-bluedark">{d.name}</h2>
              {d.term && <p className="mt-1 text-[13px] font-medium text-muted">{d.term}</p>}
              <span className="mt-2 block h-[3px] w-12 rounded-full bg-brand-gold" />
              <BioBlock html={d.bioHtml} text={d.bioText} />
              {rows.length > 0 && (
                <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-divider/60 pt-5 sm:grid-cols-2">
                  {rows.map((r, i) => <InfoRow key={i} {...r} />)}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
