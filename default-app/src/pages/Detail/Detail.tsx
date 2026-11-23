/* Detail.tsx — the site's ONE detail ("view") page, used by five routes:
     /project         ?id=&year=   club project   (the original ProjectDetail.aspx port)
     /district-project?id=&year=   district-owned project
     /district-event  ?id=&year=   district event   (the district-events module)
     /club-event      ?id=         club event       ]  both read `upcoming_events`
     /upcoming-event  ?id=         district event   ]  — see detailSources.ts
   The route's `kind` picks a source in detailSources.ts, which fetches and maps
   onto one `Detail` shape; everything below renders that shape — navy banner +
   gallery + stats + about/organised-by panels, with graceful loading/not-found.
   Share buttons appear only for club projects (the only kind with a public
   share endpoint). */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';
import { useApi } from '../../tenant/useApi';
import {
  mapClubProject,
  mapDistrictProject,
  mapDistrictEvent,
  mapClubEvent,
  mapUpcomingEvent,
  type Detail,
  type DetailKind,
} from './detailSources';
/* Shared with the club profile: normalizeUrl (admin-entered links often omit the
   scheme, and a bare "example.com/x" href would resolve against this SPA's
   origin) and loadLeadership (the year-scoped board of directors). */
import { normalizeUrl, loadLeadership, type Leader } from '../ClubProfile/clubProfileData';

/* Which endpoint each route reads, its breadcrumb section, and whether it has a
   public share payload (club projects are the only kind that does). */
const SOURCES: Record<DetailKind, { section: string; share: boolean; load: (id: string, yearId?: number) => Promise<Detail | null> }> = {
  'club-project': {
    section: 'Club Projects',
    share: true,
    load: (id, yearId) => RotaryAPI.publicProject(id, yearId).then(mapClubProject),
  },
  'district-project': {
    section: 'District Projects',
    share: false,
    load: (id, yearId) => RotaryAPI.districtProject(id, yearId).then(mapDistrictProject),
  },
  'district-event': {
    section: 'District Events',
    share: false,
    load: (id, yearId) => RotaryAPI.districtEvent(id, yearId).then(mapDistrictEvent),
  },
  'club-event': {
    section: 'Club Events',
    share: false,
    load: (id) => RotaryAPI.clubEvent(id).then(mapClubEvent),
  },
  'upcoming-event': {
    section: 'District Events',
    share: false,
    load: (id) => RotaryAPI.upcomingEvent(id).then(mapUpcomingEvent),
  },
};

/* ------------------------------ icons -------------------------------- */
function Icon({ paths, className, sw = '2' }: { paths: JSX.Element; className: string; sw?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
}
const ICONS: Record<string, JSX.Element> = {
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  arrowLeft: (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  building: (<><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></>),
  calendar: (<><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></>),
  mapPin: (<><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>),
  target: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  chevron: <path d="m9 18 6-6-6-6" />,
  share: (<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></>),
  check: <path d="M20 6 9 17l-5-5" />,
  link: (<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
  mail: (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92" />,
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  ticket: (<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v14" /></>),
};

/* Brand glyphs (filled, not stroked — the lucide Icon helper is for stroke
   paths, so these carry their own <svg fill>). */
const BRAND_PATHS: Record<string, string> = {
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
  facebook: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
};
const BrandIcon = ({ name, className }: { name: string; className: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={BRAND_PATHS[name]} />
  </svg>
);

/* ---------------------------- formatting ----------------------------- */
function fmtDate(s: any): string {
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return s;
  try {
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dt.toDateString();
  }
}
function fmtTime(s: any): string {
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return '';
  try {
    return dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}
/* ------------------------------ stat card ---------------------------- */
function StatCard({ paths, label, value }: { paths: JSX.Element; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-divider/50">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon paths={paths} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        {/* break-words, not truncate: half a value is worse than two lines. */}
        <p className="break-words text-[14px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------- stats ------------------------------- */
/* Date/time and location are NOT here — they live in the Organised By card. */
function Stats({ item }: { item: Detail }) {
  const cards: JSX.Element[] = [];
  if (item.beneficiaries != null) cards.push(<StatCard key="ben" paths={ICONS.users} label="Beneficiaries" value={String(item.beneficiaries)} />);
  if (item.rotarians != null) cards.push(<StatCard key="rtn" paths={ICONS.user} label="Rotarians Involved" value={String(item.rotarians)} />);
  if (item.manHours != null) cards.push(<StatCard key="hrs" paths={ICONS.target} label="Man Hours" value={String(item.manHours)} />);
  if (item.cost != null) {
    let cost: string;
    try {
      cost = '₹' + Number(item.cost).toLocaleString('en-IN');
    } catch (e) {
      cost = '₹' + item.cost;
    }
    cards.push(<StatCard key="cost" paths={ICONS.target} label="Project Cost" value={cost} />);
  }
  if (!cards.length) return null;
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{cards}</div>;
}

/* --------------------------- organised-by row -------------------------- */
/* Icon + label + value, the Organised By card's one repeated shape. */
function InfoRow({ paths, label, children }: { paths: JSX.Element; label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon paths={paths} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="break-words text-[15px] font-semibold text-ink">{children}</p>
      </div>
    </div>
  );
}

/* ------------------------------ officers ----------------------------- */
/* The two office bearers a project page shows, in this order. Roles come from
   the club profile's loadLeadership (which strips the "Club " prefix), so
   "Club Executive Secretary" and "Joint Secretary" stay out on their own. */
const OFFICER_ROLES = ['President', 'Secretary'];

function OfficerRow({ o }: { o: Leader }) {
  const [broken, setBroken] = useState(false);
  const initials = o.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex items-center gap-3">
      {o.photo && !broken ? (
        <img src={o.photo} alt="" loading="lazy" onError={() => setBroken(true)} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-divider" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-[12px] font-bold text-brand-blue">{initials}</span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{o.role}</p>
        <p className="truncate text-[14px] font-semibold text-ink">{o.name}</p>
      </div>
    </div>
  );
}

/* ------------------------------ gallery ------------------------------ */
/* A proxied photo: url + the admin's caption for it. */
interface Shot { src: string; caption: string }

function Gallery({ item, images, onOpen, onBroken }: { item: Detail; images: Shot[]; onOpen: (shot: Shot) => void; onBroken: (src: string) => void }) {
  const [active, setActive] = useState(0);
  const i = Math.min(active, images.length - 1);

  // No photo (or every photo 404'd) -> render NOTHING. An empty decorative frame
  // is worse than the page simply starting at the details.
  if (!images.length) return null;

  // Layout: main image with its OWN description beside it, the rest of the
  // photos in a strip underneath.
  const caption = images[i].caption;

  return (
    <div className="grid gap-4">
      {/* No caption on this photo -> the image takes the full width rather than
          leaving an empty column (most rows have no description). */}
      <figure className={'m-0 grid gap-4' + (caption ? ' lg:grid-cols-[1.6fr_1fr]' : '')}>
        {/* The frame HUGS the photo (no fixed height, width from the image) so a
            photo that doesn't fill a 16:9 box leaves no empty band around it.
            justify-self/self are REQUIRED, not decorative: as a grid item the
            button would otherwise stretch to the column width AND to the row
            height the caption sets, letterboxing the photo right back.
            Still object-contain at native size, capped — many source photos are
            low-resolution (WhatsApp-compressed) and upscaling them looks worse. */}
        <button type="button" onClick={() => onOpen(images[i])} className="flex max-w-full justify-self-center self-start overflow-hidden rounded-2xl bg-slate-100 shadow-card">
          {/* alt stays the title even when captioned — the figcaption already
              carries the description, and duplicating it reads it out twice. */}
          <img src={images[i].src} alt={item.title} className="max-h-[260px] max-w-full object-contain sm:max-h-[420px]" onError={() => onBroken(images[i].src)} />
        </button>
        {caption && (
          <figcaption className="self-start rounded-2xl bg-white p-5 shadow-card ring-1 ring-divider/50 sm:p-6">
            {images.length > 1 && (
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">Photo {i + 1} of {images.length}</span>
            )}
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-muted">{caption}</p>
          </figcaption>
        )}
      </figure>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          {images.map((shot, n) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setActive(n)}
              title={shot.caption || undefined}
              aria-label={shot.caption || item.title + ' photo ' + (n + 1)}
              className={'overflow-hidden rounded-xl ring-2 transition ' + (n === i ? 'ring-brand-blue' : 'ring-transparent hover:ring-brand-blue/40')}
            >
              <img src={shot.src} alt={shot.caption || item.title + ' ' + (n + 1)} className="h-16 w-full object-cover lg:h-[88px]" onError={() => onBroken(shot.src)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ lightbox ----------------------------- */
function Lightbox({ shot, alt, onClose }: { shot: Shot; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-3 bg-black/80 p-6" role="dialog" aria-modal="true" onClick={onClose}>
      {/* alt = the item title, not the caption: the caption is rendered below. */}
      <img src={shot.src} alt={alt || ''} className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain" />
      {shot.caption && <p className="max-w-[90vw] text-center text-[14px] leading-relaxed text-white/90">{shot.caption}</p>}
    </div>
  );
}

/* ------------------------------- banner ------------------------------ */
/* Share payload from GET /api/public/projects/{id}/share (PublicProjectShareController).
   shareText already ends with shareUrl, so it is the complete message for both
   navigator.share and the clipboard/WhatsApp fallbacks — never append the url again. */
interface ShareData {
  title?: string;
  clubDisplayName?: string;
  shareText: string;
  shareTextSingleLine: string;
  shareUrl: string;
}

function ShareActions({ share }: { share: ShareData }) {
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  const flash = (what: 'text' | 'link') => { setCopied(what); setTimeout(() => setCopied(null), 2000); };
  const onShare = () => {
    // Fetched up front (not in this handler) so the user gesture isn't spent
    // awaiting the network — Safari cancels navigator.share outside a gesture.
    if (navigator.share) {
      navigator.share({ text: share.shareText }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(share.shareText).then(() => flash('text')).catch(() => {});
  };
  // Facebook and LinkedIn ignore prefilled text — they unfurl the URL's og tags
  // (which is what /share-image.png exists for), so they get shareUrl alone.
  // X takes a short text + url; shareText would duplicate the URL it ends with.
  const xText = [share.title, share.clubDisplayName].filter(Boolean).join(' — ');
  const iconBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/25 transition-colors';
  const socials = [
    { label: 'Share on WhatsApp', icon: 'whatsapp', hover: ' hover:bg-[#25D366]', href: 'https://wa.me/?text=' + encodeURIComponent(share.shareText) },
    { label: 'Share on Facebook', icon: 'facebook', hover: ' hover:bg-[#1877F2]', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share.shareUrl) },
    { label: 'Share on X', icon: 'x', hover: ' hover:bg-black', href: 'https://x.com/intent/post?text=' + encodeURIComponent(xText) + '&url=' + encodeURIComponent(share.shareUrl) },
    { label: 'Share on LinkedIn', icon: 'linkedin', hover: ' hover:bg-[#0A66C2]', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(share.shareUrl) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/20"
      >
        <Icon paths={copied === 'text' ? ICONS.check : ICONS.share} className="h-4 w-4" sw="2.25" />
        {copied === 'text' ? 'Copied!' : 'Share'}
      </button>
      {socials.map((s) => (
        <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className={iconBtn + s.hover + ' hover:text-white'}>
          <BrandIcon name={s.icon} className="h-[18px] w-[18px]" />
        </a>
      ))}
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(share.shareUrl).then(() => flash('link')).catch(() => {})}
        aria-label="Copy link"
        title={copied === 'link' ? 'Link copied!' : 'Copy link'}
        className={iconBtn + ' hover:bg-white/20'}
      >
        <Icon paths={copied === 'link' ? ICONS.check : ICONS.link} className="h-[18px] w-[18px]" sw="2.25" />
      </button>
    </div>
  );
}

function Banner({ item, section, share }: { item: Detail; section: string; share: ShareData | null }) {
  const chevron = <Icon paths={ICONS.chevron} className="h-4 w-4 text-brand-gold" sw="2.5" />;
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">{item.title}</h1>
          <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
            {chevron}
            <span className="text-white/70">{section}</span>
            {chevron}
            <span className="font-medium text-brand-gold">{item.title}</span>
          </nav>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {item.badge && (
            <span className="rounded-full bg-brand-gold px-3 py-1 text-[12px] font-semibold text-[#0a1f4d]">{item.badge}</span>
          )}
          {item.registrationLink && (
            <a
              href={normalizeUrl(item.registrationLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-[13px] font-bold text-[#0a1f4d] transition-colors hover:bg-amber-400"
            >
              <Icon paths={ICONS.ticket} className="h-4 w-4" sw="2" /> Register
            </a>
          )}
          {share && <ShareActions share={share} />}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- render ------------------------------ */
export default function Detail({ kind }: { kind: DetailKind }) {
  const source = SOURCES[kind];
  const isEvent = kind === 'club-event' || kind === 'district-event' || kind === 'upcoming-event';
  const [sp] = useSearchParams();
  const id = sp.get('id') || '';
  const year = sp.get('year') || '';
  // ?from= — which listing the visitor came from. Club Service projects live on
  // their own page, and the public payload carries no avenue to infer it from,
  // so the card that linked here says so.
  const from = sp.get('from') || '';
  const [lightbox, setLightbox] = useState<Shot | null>(null);
  // Photo rows outlive their files (records from 2020 still list images the
  // media host no longer serves), so a photo that 404s is dropped rather than
  // left as a broken frame; losing them all renders no gallery at all.
  const [broken, setBroken] = useState<string[]>([]);

  // Optional ?year= overrides the selected year. The home galleries pass it so a
  // project sourced from a FALLBACK year (when the selected year is empty)
  // resolves to that SAME year — project ids are reused per year, so without it
  // the detail page would fetch an unrelated project for the same id. District
  // projects/events NEED it: their rows live in year-partitioned tables.
  const yearId = (() => {
    const n = year ? parseInt(year, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  })();

  const { data: item, loading } = useApi<Detail | null>(() => {
    if (!id) return Promise.resolve(null);
    return source.load(id, yearId).catch(() => null);
  }, [kind, id, year]);

  useEffect(() => { setBroken([]); }, [kind, id, year]);

  /* Club President + Secretary for a club project. NOT from the public payload's
     `officers[]`: that query filters designation_name = 'President'/'Secretary'
     while the data says 'Club President'/'Club Secretary', so it comes back
     empty for every project. loadLeadership reads the same board-of-directors
     rows the club profile shows, and works today. */
  const clubId = item && kind === 'club-project' ? item.clubId : '';
  const { data: officers } = useApi<Leader[]>(() => {
    if (!clubId) return Promise.resolve([]);
    return loadLeadership(clubId, null)
      .then((r) => (r ? r.leaders.filter((l) => OFFICER_ROLES.indexOf(l.role) !== -1) : []))
      .catch(() => []);
  }, [clubId]);

  // Share payload (text + canonical URL) for the banner's Share/WhatsApp actions.
  // Same id+yearId rules as the item fetch; the endpoint is anonymous and
  // server-cached (300s), so loading it up front is cheap and keeps the share
  // data ready inside the click's user gesture. null (e.g. 404) hides the buttons.
  const { data: share } = useApi<ShareData | null>(() => {
    if (!id || !source.share) return Promise.resolve(null);
    return RotaryAPI.get('/api/public/projects/' + id + '/share', { yearId: yearId != null ? yearId : RotaryAPI.config.yearId })
      .then((s: any) => (s && s.shareText && s.shareUrl ? (s as ShareData) : null))
      .catch(() => null);
  }, [kind, id, year]);

  // Raw API paths -> proxied urls, minus any that 404'd. districtMedia rewrites
  // the district modules' broken photo paths and passes everything else through.
  // Some modules also have a
  // SECOND place their file may live (see eventMediaAlt): if the first url
  // fails it lands in `broken`, this recomputes to the alternate, and only if
  // that fails too does the photo drop out.
  const images: Shot[] = item
    ? item.images
        .map((p) => {
          const first = RotaryAPI.districtMedia(p.path, id);
          // upcoming-event ONLY: club event images share the /Documents/Event/
          // shape but are keyed by the CLUB's group, so the district rewrite
          // would fetch a stranger's photo of the same basename.
          const alt = kind === 'upcoming-event' ? RotaryAPI.eventMediaAlt(p.path) : '';
          return { src: alt && broken.indexOf(first) !== -1 ? alt : first, caption: p.caption };
        })
        .filter((s) => s.src && broken.indexOf(s.src) === -1)
    : [];
  // An empty owner means the row belongs to the district itself.
  const owner = item && (item.owner || config.districtName || 'Rotary District ' + config.districtNumber);
  // The mapper's default back link, overridden by ?from= when the visitor came
  // from a listing the payload can't identify on its own.
  const back = from === 'club-service'
    ? { to: '/club-service', label: 'Back to Club Service' }
    : { to: item ? item.backTo : '/', label: item ? item.backLabel : 'Back to Home' };

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page={kind}>
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
          <Icon paths={ICONS.loader} className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm font-semibold text-muted">Loading…</p>
        </div>
      ) : !item ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
          <p className="text-lg font-semibold text-ink">Not found.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">
            <Icon paths={ICONS.arrowLeft} className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      ) : (
        <>
          <Banner item={item} section={source.section} share={share} />
          <div className="mx-auto max-w-[1100px] space-y-6 px-5 py-8 sm:px-8">
            <Link to={back.to} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-bluedark">
              <Icon paths={ICONS.arrowLeft} className="h-4 w-4" sw="2.25" /> {back.label}
            </Link>
            {/* key={id}: a Detail -> Detail navigation must reset the selected thumbnail. */}
            <Gallery key={id} item={item} images={images} onOpen={(shot) => setLightbox(shot)} onBroken={(src) => setBroken((b) => (b.indexOf(src) === -1 ? b.concat(src) : b))} />
            <Stats item={item} />
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
                <h2 className="text-[18px] font-bold text-brand-bluedark">{isEvent ? 'About the Event' : 'About the Project'}</h2>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-muted">{item.description ? item.description : '—'}</p>
              </section>
              <section className="rounded-[20px] bg-white p-6 shadow-card sm:p-7">
                <h2 className="text-[18px] font-bold text-brand-bluedark">Organised By</h2>
                <InfoRow paths={ICONS.building} label={item.ownerLabel}>
                  <span className="text-brand-blue">{owner}</span>
                </InfoRow>
                {/* Date/time and location live here rather than in the stat row
                    above, which keeps that row to the four project numbers. */}
                {item.date && (
                  <InfoRow paths={ICONS.calendar} label="Date">
                    {fmtDate(item.date)}
                    {item.withTime && <span className="font-medium text-muted"> · {fmtTime(item.date)}</span>}
                  </InfoRow>
                )}
                {item.location && (
                  <InfoRow paths={ICONS.mapPin} label={isEvent ? 'Venue' : 'Location'}>{item.location}</InfoRow>
                )}
                {officers && officers.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-divider/60 pt-4">
                    {officers.map((o) => <OfficerRow key={o.role} o={o} />)}
                  </div>
                )}
                {item.contact && (
                  <div className="mt-5 space-y-3 border-t border-divider/60 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Contact</p>
                    {item.contact.name && (
                      <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                        <Icon paths={ICONS.user} className="h-4 w-4 shrink-0 text-brand-blue" /> {item.contact.name}
                      </p>
                    )}
                    {item.contact.mobile && (
                      <a href={'tel:' + item.contact.mobile} className="flex items-center gap-2 text-[14px] font-medium text-brand-blue hover:text-brand-bluedark">
                        <Icon paths={ICONS.phone} className="h-4 w-4 shrink-0" /> {item.contact.mobile}
                      </a>
                    )}
                    {item.contact.email && (
                      <a href={'mailto:' + item.contact.email} className="flex items-center gap-2 break-all text-[14px] font-medium text-brand-blue hover:text-brand-bluedark">
                        <Icon paths={ICONS.mail} className="h-4 w-4 shrink-0" /> {item.contact.email}
                      </a>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
      {lightbox && <Lightbox shot={lightbox} alt={item ? item.title : ''} onClose={() => setLightbox(null)} />}
    </main>
  );
}
