import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RotaryAPI, { config } from '../../api/client';

/* Citation Performance ("CP Index") — the District Citation matrix, public.
   Data: RotaryAPI.citationPerformance() (see client.ts).

   Layout: one column per category ranking every club by its points in that
   category, then a final Total column ranking by the grand total. */

interface MatrixCategory { id: number; name: string; span: number }
interface MatrixColumn { type: string; questionId: number; title: string; basePoints: number; answerType: string }
interface MatrixCell { achievedDisplay: string; achievedNumeric: number | null; total: number }
interface MatrixRow { clubId: number; clubName: string; cells: Record<string, MatrixCell> }
interface MatrixData {
  districtId: number; districtNumber: string; yearId: number; yearLabel: string;
  categories: MatrixCategory[]; columns: MatrixColumn[]; rows: MatrixRow[];
}
interface CatGroup extends MatrixCategory { cols: MatrixColumn[] }
interface RankedEntry { clubId: number; clubName: string; pts: number; rank: number }

const cellKey = (c: MatrixColumn) => c.type + '-' + c.questionId;

function fmt(n: number): string {
  return n === Math.trunc(n) ? n.toLocaleString('en-IN') : n.toFixed(2);
}

/* Categorical palette for the category columns, assigned in fixed order:
   a solid header (dark enough for white text) and a light tint for the list. */
const CAT_HEAD = ['bg-blue-600', 'bg-amber-700', 'bg-emerald-700', 'bg-rose-600', 'bg-violet-600', 'bg-cyan-700'];
const CAT_TINT = ['bg-blue-50', 'bg-amber-50', 'bg-emerald-50', 'bg-rose-50', 'bg-violet-50', 'bg-cyan-50'];
const MEDAL_TEXT = ['text-brand-gold', 'text-[#7d8ba0]', 'text-[#C88A4E]'];

/* Competition ranking (1, 2, 2, 4) by the given score, ties broken by name. */
function rankBy(rows: MatrixRow[], score: (r: MatrixRow) => number): RankedEntry[] {
  const list = rows.map((r) => ({ clubId: r.clubId, clubName: r.clubName, pts: score(r), rank: 0 }));
  list.sort((a, b) => b.pts - a.pts || a.clubName.localeCompare(b.clubName));
  let rank = 0, prev = Number.NaN;
  list.forEach((e, i) => {
    if (e.pts !== prev) { rank = i + 1; prev = e.pts; }
    e.rank = rank;
  });
  return list;
}

/* ---- One ranked column: a category, or the grand Total ---- */
function RankColumn({ title, color, entries, overall }: {
  title: string; color?: number; entries: RankedEntry[]; overall?: boolean;
}) {
  const head = overall ? 'bg-brand-gold text-[#0c2a66]' : CAT_HEAD[(color ?? 0) % CAT_HEAD.length] + ' text-white';
  const body = overall ? 'bg-[#fffaf0] ring-brand-gold/60' : CAT_TINT[(color ?? 0) % CAT_TINT.length] + ' ring-divider/50';
  return (
    <div className={'flex flex-col overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(13,38,92,0.12)] ring-1 ' + body}>
      <div className={'px-5 py-3.5 text-[15px] font-semibold ' + head}>
        <span className="block truncate" title={title}>{title}</span>
      </div>
      {/* data-lenis-prevent: the site's Lenis smooth-scroll otherwise
          swallows wheel events and scrolls the PAGE instead of this column. */}
      <ol className="lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto" data-lenis-prevent>
        {entries.map((e) => {
          const medal = e.pts > 0 && e.rank <= 3 ? MEDAL_TEXT[e.rank - 1] : null;
          return (
            <li key={e.clubId} className="flex items-center gap-4 border-t border-divider/40 px-5 py-3.5 text-sm first:border-t-0">
              <span className={'w-6 shrink-0 text-center font-bold ' + (medal || 'text-muted')}>{e.pts > 0 ? e.rank : '—'}</span>
              <span className="min-w-0 flex-1 break-words font-medium text-ink" title={e.clubName}>{e.clubName}</span>
              <span className={'shrink-0 text-sm font-semibold ' + (e.pts > 0 ? 'text-brand-blue' : 'text-muted/70')}>{fmt(e.pts)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function CitationPerformance() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    RotaryAPI.citationPerformance()
      .then((d: MatrixData) => { if (alive) setData(d); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const columns = data?.columns ?? [];
  const categories = data?.categories ?? [];

  const catGroups = useMemo<CatGroup[]>(() => {
    let i = 0;
    return categories.map((cat) => {
      const cols = columns.slice(i, i + cat.span);
      i += cat.span;
      return { ...cat, cols };
    });
  }, [categories, columns]);

  // Per-category rankings, then the Total ranking by grand total.
  const { perCategory, overall } = useMemo(() => {
    const rows = data?.rows ?? [];
    const catPts = (r: MatrixRow, g: CatGroup) =>
      g.cols.reduce((s, c) => s + (Number(r.cells?.[cellKey(c)]?.total) || 0), 0);
    return {
      perCategory: catGroups.map((g) => rankBy(rows, (r) => catPts(r, g))),
      overall: rankBy(rows, (r) => catGroups.reduce((s, g) => s + catPts(r, g), 0)),
    };
  }, [data, catGroups]);

  const yearLabel = data?.yearLabel || config.yearLabel;
  const hasMatrix = columns.length > 0;

  return (
    <main className="flex-1 bg-[#f5f8fc]" data-page="district-awards">

      {/* ---- Page Banner ---- */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0a2156] via-[#0c2a66] to-[#0a1f4d] text-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-7 sm:px-8 xl:px-12">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight tracking-wide sm:text-[30px]">District Awards</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 transition-colors hover:text-white">Home</Link>
              <svg className="h-4 w-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="font-medium text-brand-gold">District Awards</span>
            </nav>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70">Rotary Year</div>
            <div className="text-xl font-bold text-brand-gold">{yearLabel}</div>
          </div>
        </div>
      </section>

      <div className="px-5 py-8 sm:px-8 xl:px-12">
        {loading ? (
          <div className="flex items-center justify-center py-32" role="status">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-blue/25 border-t-brand-blue" aria-label="Loading" />
          </div>
        ) : failed || !data ? (
          <section className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-divider/50">
            <p className="text-lg font-semibold text-ink">Citation data is not available right now.</p>
            <p className="mt-2 text-sm text-muted">Please try again later.</p>
          </section>
        ) : !hasMatrix ? (
          <section className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-divider/50">
            <p className="text-lg font-semibold text-ink">No citation criteria published for {yearLabel} yet.</p>
            <p className="mt-2 text-sm text-muted">The District Citation matrix for this Rotary year has not been configured. Try another year from the year selector.</p>
          </section>
        ) : (
            // Category columns + Total. Scrolls sideways when the columns
            // don't fit the screen width.
            // Padding keeps the column shadows from being clipped by the scroller.
            <section className="-mx-3 overflow-x-auto px-3 pb-4 pt-1">
              <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] items-start gap-5">
                {catGroups.map((g, ci) => (
                  <RankColumn key={g.id} title={g.name} color={ci} entries={perCategory[ci]} />
                ))}
                <RankColumn title="Total" entries={overall} overall />
              </div>
            </section>
        )}
      </div>

    </main>
  );
}
