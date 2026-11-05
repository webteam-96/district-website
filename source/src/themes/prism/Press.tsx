import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';

const P = R.press;

/* the content line ends "... on the {link}."; here the link is a button of its own */
const footerLine = (vals: Record<string, string | number>) => R.fmt.fill(P.club.footer, vals).split(' on the {link}')[0] + '.';

/* 7 · Newsletters as a newspaper front page: masthead, the Governor's Monthly
   Letter as the lead story, club bulletins as headlines in ruled columns. No images. */
export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  const bulletins = py.bulletins;
  return (
    <section id="press" className="press" aria-labelledby="press-title">
      <div className="wrap">
        <div className="news">
          <header className="news__mast">
            <h2 id="press-title" className="news__title">{P.title}</h2>
          </header>
          <p className="news__sub">{P.subtext}</p>

          <div className="news__grid">
            <article className="lead">
              <p className="lead__kicker">{P.gml.title}</p>
              {py.gml.length ? (
                <ul className="lead__list">
                  {py.gml.map(l => (
                    <li key={l.title}>
                      <h3 className="lead__head">{l.month}</h3>
                      <p className="lead__by">{l.governor}</p>
                      <button type="button" className="newsbtn" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}>{P.actions.preview} →</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <h3 className="lead__head">{R.fmt.fill(P.gml.empty, { year })}</h3>
                  <span className="lead__seal" aria-hidden="true"><img src={R.brand.wheel} alt="" width="64" height="64" /></span>
                </>
              )}
              <a className="newsbtn newsbtn--strong" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
            </article>

            <div className="stories">
              <h3 className="stories__title">{P.club.title} <span>{year}</span></h3>
              {switching ? (
                <div className="stories__cols" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="story story--skeleton" />)}</div>
              ) : bulletins.length ? (
                <div className="stories__cols" key={year}>
                  {bulletins.map((b, i) => (
                    <article key={b.title + i} className="story" style={{ ['--i' as string]: i }}>
                      <p className="story__byline">{b.club}</p>
                      <h4 className="story__head">{b.title}</h4>
                      <p className="story__date">{shortDate(b.date)}</p>
                      <div className="story__actions">
                        <button type="button" className="newsbtn newsbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                        <a className="newsbtn" href={b.pdf} download>{P.actions.download}</a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="stories__empty">{R.fmt.fill(P.club.empty, { year })}</p>
              )}
            </div>
          </div>
          {bulletins.length > 0 && !switching && (
            <div className="news__foot">
              <p>{footerLine({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
              <a className="newsbtn newsbtn--solid" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
