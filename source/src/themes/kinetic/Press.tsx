import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';
import { Title } from './Sections';

const P = R.press;

/* 7 · Newsletters: the cards start as one fanned pile and are dealt out to a grid as you scroll.
   No images. The Governor's letters sit underneath. */
export default function Press({ year, onPreview }: { year: string; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  return (
    <section id="press" className="press" aria-labelledby="press-title">
      <div className="wrap">
        <header className="press__head">
          <div>
            <Title id="press-title" text={P.title} />
            <p className="ssub">{P.subtext}</p>
          </div>
          <a className="btn-go" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
        </header>
        {py.bulletins.length ? (
          <ul className="deck">
            {py.bulletins.map((b, i) => (
              <li key={i} className="card">
                <h3 className="card__title">{b.title}</h3>
                <p className="card__club">{b.club}</p>
                <p className="card__date">{shortDate(b.date)}</p>
                <div className="card__actions">
                  <button type="button" className="pbtn pbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                  <a className="pbtn" href={b.pdf} download>{P.actions.download}</a>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="deck__empty">{R.fmt.fill(P.club.empty, { year })}</p>}
        <div className="gml">
          <h3>{P.gml.title}</h3>
          {py.gml.length ? (
            <ul>{py.gml.map(l => <li key={l.title}><button type="button" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}><b>{l.month}</b><span>{l.governor}</span></button></li>)}</ul>
          ) : <p>{R.fmt.fill(P.gml.empty, { year })}</p>}
          <a className="gml__all" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
        </div>
      </div>
    </section>
  );
}
