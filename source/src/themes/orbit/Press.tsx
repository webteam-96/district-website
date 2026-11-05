import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';

const P = R.press;
/* the content line ends "... on the {link}."; here the link is a button of its own */
const summary = (vals: Record<string, string | number>) => R.fmt.fill(P.club.footer, vals).split(' on the {link}')[0] + '.';

/* 7 · Newsletters: title and the Governor's letters stay put on the left while bulletins
   scroll past as full-width rows that fill with gold on hover. No images. */
export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  const bulletins = py.bulletins;
  return (
    <section id="press" className="press" aria-labelledby="press-title">
      <div className="wrap press__grid">
        <div className="press__side">
          <h2 id="press-title" className="stitle">{P.title}</h2>
          <p className="ssub">{P.subtext}</p>
          <div className="gml">
            <h3 className="gml__title">{P.gml.title}</h3>
            {py.gml.length ? (
              <ul className="gml__list">
                {py.gml.map(l => (
                  <li key={l.title}>
                    <button type="button" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}>
                      <b>{l.month}</b><span>{l.governor}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="gml__empty">{R.fmt.fill(P.gml.empty, { year })}</p>
            )}
            <a className="pbtn" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
          </div>
        </div>

        <div className="press__main">
          <h3 className="press__head">{P.club.title} <span>{year}</span></h3>
          {switching ? (
            <div className="rows" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="row row--skeleton" />)}</div>
          ) : bulletins.length ? (
            <ul className="rows" key={year}>
              {bulletins.map((b, i) => {
                const [day, ...rest] = shortDate(b.date).split(' ');
                return (
                  <li key={b.title + i} className="row" style={{ ['--i' as string]: i }}>
                    <p className="row__date"><b>{day}</b><span>{rest.join(' ')}</span></p>
                    <div className="row__text">
                      <p className="row__club">{b.club}</p>
                      <h4 className="row__title">{b.title}</h4>
                    </div>
                    <div className="row__actions">
                      <button type="button" className="pbtn pbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                      <a className="pbtn" href={b.pdf} download>{P.actions.download}</a>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rows__empty">{R.fmt.fill(P.club.empty, { year })}</p>
          )}
          {bulletins.length > 0 && !switching && (
            <div className="press__foot">
              <p>{summary({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
              <a className="pbtn pbtn--solid pbtn--big" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
