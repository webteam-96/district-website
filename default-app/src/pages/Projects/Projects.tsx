import { Link, useSearchParams } from 'react-router-dom';
import { SLUG_TO_MODULE, useProjectsState } from './projectsData';
import { AnalysisStats, FilterTabs, ProjectsGrid } from './ProjectsShared';

// Club Projects page: ALL current-year projects EXCEPT Club Service, with the
// category filter. ?category= still pre-selects a filter (old deep links).
export default function Projects() {
  const [sp] = useSearchParams();
  const pre = (sp.get('category') || '').trim().toLowerCase();
  const initialSlug = pre && SLUG_TO_MODULE[pre] ? pre : '';

  const { loading, searchScoped, activeSlug, selectSlug, onSearch, limit, loadMore, categoryList, filtered } =
    useProjectsState(false, initialSlug);

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="club-projects">

      {/* ---- Page Banner (navy gradient title + breadcrumb) ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8 xl:px-12">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">Club Projects</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">Club Projects</span>
            </nav>
          </div>
        </div>
      </section>

      {/* ---- Page content ---- */}
      <div className="px-5 py-8 sm:px-8 xl:px-12">
        {/* Analysis card: category filter + search on top, live stats below */}
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-divider/50 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Category filter TABS */}
            <FilterTabs activeSlug={activeSlug} scope={searchScoped} onSelect={selectSlug} />
            {/* Search (rounded pill) */}
            <div className="relative w-full sm:w-64 sm:shrink-0">
              <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="search" placeholder="Search by club…" aria-label="Search projects by club" onChange={(e) => onSearch(e.target.value)} className="w-full rounded-full border border-divider bg-pagebg/50 py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-blue/40 focus:bg-white focus:ring-2 focus:ring-brand-blue/15" />
            </div>
          </div>
          <div className="mt-5">
            <AnalysisStats loading={loading} list={categoryList} />
          </div>
        </section>

        {/* loading / grid / empty + load-more */}
        <div>
          <ProjectsGrid loading={loading} items={filtered} limit={limit} onLoadMore={loadMore} />
        </div>
      </div>

    </main>
  );
}
