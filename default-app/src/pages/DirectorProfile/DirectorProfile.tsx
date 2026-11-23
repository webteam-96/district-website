/* DirectorProfile.tsx — Director / committee-member profile page.
   Ported 1:1 from DirectorProfile.aspx + js/director-profile.js.

   Reads ?id={member id} plus the optional instant-display params
   ?club=&name=&role= from the query string, then fetches /api/members/{id}.

   The directory card forwards the exact strings it displayed (name/role/club) on
   the link. PREFER them so the profile header matches the listing 1:1 — the
   member-detail endpoint returns DIFFERENT fields (member-master memberName +
   club-level designation + clubId, not club name), which otherwise drift from
   what the card showed. /api/members/{id} is then used only to fill the rest
   (email, photo) and as a fallback when a field wasn't forwarded.

   Digital-directory profile shows ONLY: Designation + Name (header), Home Club,
   and Email. Rotary ID / Committee / Classification / Member-Since / Phone /
   Address / Personal / bio / social are intentionally omitted per spec (which is
   why the aspx's toDirector/mergeDetail/infoRow-social helpers are never used by
   mount() and are not ported here). */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RotaryAPI from '../../api/client';

/* ----------------------------- inline icons (mirror aspx svg(inner, cls, sw)) ----------------------------- */
const Icon = ({ paths, className, sw = 2 }: { paths: React.ReactNode; className: string; sw?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
);
const IC = {
  arrowLeft: (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  chevronRight: (<path d="m9 18 6-6-6-6" />),
  loader: (<path d="M21 12a9 9 0 1 1-6.219-8.56" />),
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  building: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></>),
  mail: (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
};

interface Director {
  id: string;
  name: string;
  role: string;
  club: string;
  email: string;
  photo: string;
}
type State = { status: 'loading' } | { status: 'notfound' } | { status: 'ok'; director: Director };

/* ----------------------------- states ----------------------------- */
function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
      <Icon paths={IC.loader} className="h-8 w-8 animate-spin text-brand-blue" />
      <p className="text-sm font-semibold text-muted">Loading profile…</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
      <p className="text-lg font-semibold text-ink">Director not found.</p>
      <Link to="/district-committee" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">
        <Icon paths={IC.arrowLeft} className="h-4 w-4" /> Back to Directors
      </Link>
    </div>
  );
}

// Photo fallback: swap the broken/absent photo for the user glyph (aspx wired
// img.onerror = () => this.outerHTML = userFallback).
function PhotoPanel({ photo, name }: { photo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!photo || err) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <Icon paths={IC.user} className="h-28 w-28 text-white/25" sw={1.25} />
      </div>
    );
  }
  // Bound the photo to a portrait aspect (≈300×375) instead of stretching to the
  // full — now taller — details column, which over-magnified low-res photos and
  // made them blurry. The dark gradient fills any space below it.
  return <img src={photo} alt={name} className="relative block aspect-[4/5] w-full object-cover object-top" onError={() => setErr(true)} />;
}

function InfoRow({ paths, label, value, href }: { paths: React.ReactNode; label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon paths={paths} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
        {href
          ? <a href={href} className="block break-words text-[14px] font-medium text-ink transition-colors hover:text-brand-blue">{value}</a>
          : <dd className="break-words text-[14px] font-medium text-ink">{value}</dd>}
      </div>
    </div>
  );
}

function Profile({ director }: { director: Director }) {
  const clubVal = director.club && director.club !== '—' ? director.club : '';
  const hasRows = !!clubVal || !!director.email;
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">{director.name}</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <Icon paths={IC.chevronRight} className="h-4 w-4 text-brand-gold" sw={2.5} />
              <Link to="/district-committee" className="text-white/70 transition-colors hover:text-white">District Committee</Link>
              <Icon paths={IC.chevronRight} className="h-4 w-4 text-brand-gold" sw={2.5} />
              <span className="font-medium text-brand-gold">{director.name}</span>
            </nav>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
        <Link to="/district-committee" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-bluedark">
          <Icon paths={IC.arrowLeft} className="h-4 w-4" sw={2.25} /> Back to Directors
        </Link>
        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-divider/50">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            <div className="relative min-h-[300px] overflow-hidden bg-[#0a1c44]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0c265f] to-[#0a1c44]"></div>
              <PhotoPanel photo={director.photo} name={director.name} />
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-gold">{director.role}</p>
              <h2 className="mt-1 text-[24px] font-bold leading-tight text-brand-bluedark">{director.name}</h2>
              <span className="mt-2 block h-[3px] w-12 rounded-full bg-brand-gold"></span>
              {hasRows && (
                <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <InfoRow paths={IC.building} label="Home Club" value={clubVal} />
                  <InfoRow paths={IC.mail} label="Email" value={director.email} href={director.email ? 'mailto:' + director.email : undefined} />
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DirectorProfile() {
  const [sp] = useSearchParams();
  const id = sp.get('id') || '';
  const clubFromUrl = sp.get('club') || '';
  const nameFromUrl = sp.get('name') || '';
  const roleFromUrl = sp.get('role') || '';

  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!id) { setState({ status: 'notfound' }); return; }
    let alive = true;
    setState({ status: 'loading' });
    RotaryAPI.get('/api/members/' + id)
      .then((md: any) => {
        if (!alive) return;
        if (!md || !(md.memberName || md.MemberName)) { setState({ status: 'notfound' }); return; }
        // Digital-directory profile: ONLY name, designation, home club, email.
        const director: Director = {
          id: String(id),
          name: nameFromUrl || md.memberName || md.MemberName || 'Member',
          role: roleFromUrl || md.designation || md.Designation || 'Rotary Member',
          club: clubFromUrl || md.clubName || md.ClubName || '',
          email: md.emailId || md.EmailId || '',
          photo: RotaryAPI.mediaUrl(md.profilePhotoPath || md.ProfilePhotoPath || ''),
        };
        setState({ status: 'ok', director });
      })
      .catch(() => { if (alive) setState({ status: 'notfound' }); });
    return () => { alive = false; };
  }, [id, nameFromUrl, roleFromUrl, clubFromUrl]);

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="district-committee">
      {state.status === 'loading' && <Loading />}
      {state.status === 'notfound' && <NotFound />}
      {state.status === 'ok' && <Profile director={state.director} />}
    </main>
  );
}
