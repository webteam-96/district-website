import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, type Location } from 'react-router-dom';
import Layout from './components/Layout';
import { useTenant } from './tenant/TenantProvider';
import { initSmoothScroll, destroySmoothScroll, scrollToTopImmediate } from './effects/smooth-scroll.js';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import DistrictCommittee from './pages/DistrictCommittee/DistrictCommittee';
import ClubFinder from './pages/ClubFinder/ClubFinder';
import ClubProfile from './pages/ClubProfile/ClubProfile';
import ClubService from './pages/ClubService/ClubService';
import Projects from './pages/Projects/Projects';
import Detail from './pages/Detail/Detail';
import Calendar from './pages/Calendar/Calendar';
import Newsletters from './pages/Newsletters/Newsletters';
import DignitaryProfile from './pages/DignitaryProfile/DignitaryProfile';
import DirectorProfile from './pages/DirectorProfile/DirectorProfile';
import CitationPerformance from './pages/CitationPerformance/CitationPerformance';
import SamplesIndex from './samples/SamplesIndex';
import SampleRoute from './samples/SampleRoute';

/* ---- double staircase page transition ----
   Drives the .pt-* CSS in styles/site.css; COLUMNS / SLIDE / STAGGER / HOLD
   here MUST match the timings documented there. The route swap (and scroll
   reset) happens while the columns fully cover the viewport. */
const PT_COLS = 8;
const PT_SLIDE = 380;
const PT_STAGGER = 60;
const PT_HOLD = 90;
const PT_COVER_MS = PT_SLIDE + PT_STAGGER * (PT_COLS - 1) + PT_HOLD;
const PT_REVEAL_MS = PT_SLIDE + PT_STAGGER * (PT_COLS - 1);
type PtStage = 'idle' | 'cover' | 'reveal';

function StairOverlay({ stage }: { stage: PtStage }) {
  return (
    <div className={'pt-overlay' + (stage === 'idle' ? ' pt-idle' : '')} data-stage={stage === 'idle' ? undefined : stage} aria-hidden="true">
      {Array.from({ length: PT_COLS }).map((_, i) => (
        <div
          key={i}
          className={'pt-col ' + (i % 2 === 0 ? 'pt-top pt-blue' : 'pt-bottom pt-gold')}
          /* +0.1% width: columns overlap a hair so no seam shows between them */
          style={{ left: (i * 100) / PT_COLS + '%', width: 100 / PT_COLS + 0.1 + '%', animationDelay: i * PT_STAGGER + 'ms' }}
        />
      ))}
    </div>
  );
}

export default function App() {
  // Gate all page routes on tenant resolution — the ASPX did `ready().then(mount)`
  // per page so config.districtId/yearId were set before any fetch. Mounting a page
  // before ready() resolves would bake a null districtId/yearId into its requests.
  const { ready } = useTenant();
  const location = useLocation();
  const [shown, setShown] = useState<Location>(location);
  const [stage, setStage] = useState<PtStage>('idle');

  // Site-wide Lenis smooth scroll. Teardown MUST go through destroySmoothScroll
  // (killing the instance directly leaves a zombie rAF pump — see smooth-scroll.js).
  useEffect(() => {
    initSmoothScroll();
    return () => { destroySmoothScroll(); };
  }, []);

  // Staircase between routes: cover → swap the rendered location + reset scroll
  // while hidden → reveal. Reduced motion swaps instantly (CSS hides the overlay).
  useEffect(() => {
    if (location.key === shown.key) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(location); scrollToTopImmediate(); return; }
    setStage('cover');
    const swap = window.setTimeout(() => {
      setShown(location);
      scrollToTopImmediate();
      setStage('reveal');
    }, PT_COVER_MS);
    const done = window.setTimeout(() => setStage('idle'), PT_COVER_MS + PT_REVEAL_MS);
    return () => { window.clearTimeout(swap); window.clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const page = !ready ? (
    <main className="flex-1 bg-[#f5f8fc]">
      <div className="flex items-center justify-center py-32">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-blue/25 border-t-brand-blue" aria-label="Loading" />
      </div>
    </main>
  ) : (
    <Routes location={shown}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/district-committee" element={<DistrictCommittee />} />
      <Route path="/club-finder" element={<ClubFinder />} />
      <Route path="/club" element={<ClubProfile />} />
      <Route path="/club-service" element={<ClubService />} />
      <Route path="/projects" element={<Projects />} />
      {/* One detail page, five sources (see pages/Detail/detailSources.ts). */}
      <Route path="/project" element={<Detail kind="club-project" />} />
      <Route path="/district-project" element={<Detail kind="district-project" />} />
      <Route path="/district-event" element={<Detail kind="district-event" />} />
      <Route path="/club-event" element={<Detail kind="club-event" />} />
      {/* The calendars' District Events are `upcoming_events` rows, NOT the
          district-events module — different table, so /district-event ids
          never resolve here (and vice versa). */}
      <Route path="/upcoming-event" element={<Detail kind="upcoming-event" />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/newsletters" element={<Newsletters />} />
      <Route path="/dignitary" element={<DignitaryProfile />} />
      <Route path="/director" element={<DirectorProfile />} />
      <Route path="/district-awards" element={<CitationPerformance />} />
      <Route path="/samples" element={<SamplesIndex />} />
      <Route path="/samples/:id" element={<SampleRoute />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );

  // Theme samples bring their own header and footer, so they skip Layout.
  if (/^\/samples(\/|$)/.test(shown.pathname)) {
    return (
      <>
        <StairOverlay stage={stage} />
        {page}
      </>
    );
  }
  return (
    <Layout>
      <StairOverlay stage={stage} />
      {page}
    </Layout>
  );
}
