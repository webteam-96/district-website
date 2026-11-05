import { useState } from 'react';
import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';

const P = R.press;
const COLORS = ['#7a1450', '#c23a2b', '#0a7d6e', '#3b2a9e', '#a8125c', '#0067c8', '#5b1a78', '#b0460f'];
const summary = (vals: Record<string, string | number>) => R.fmt.fill(P.club.footer, vals).split(' on the {link}')[0] + '.';

/* 7 · Newsletters: a stack of coloured file folders. Click a folder's tab and it opens where it sits.
   The Governor's letters and the View all button stay beside it. No images. */
export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  const bulletins = py.bulletins;
  const [open, setOpen] = useState(0);
  return (
    <section id="press" className="sheet press" aria-labelledby="press-title">
      <div className="sheet__in">
        <div className="wrap press__grid">
          <div className="press__side">
            <h2 id="press-title" className="stitle">{P.title}</h2>
            <p className="ssub">{P.subtext}</p>
            <div className="gml">
              <h3>{P.gml.title}</h3>
              {py.gml.length ? (
                <ul>{py.gml.map(l => <li key={l.title}><button type="button" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}><b>{l.month}</b><span>{l.governor}</span></button></li>)}</ul>
              ) : <p>{R.fmt.fill(P.gml.empty, { year })}</p>}
              <a className="gml__all" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
            </div>
            {bulletins.length > 0 && !switching && (
              <div className="press__foot">
                <p>{summary({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
                <a className="btn-go btn-go--solid" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
              </div>
            )}
          </div>
          {switching ? <div className="folders folders--wait" aria-hidden="true" /> : bulletins.length ? (
            <ul className="folders" key={year}>
              {bulletins.map((b, i) => (
                <li key={b.title + i} className={`folder ${i === open ? 'is-open' : ''}`} style={{ ['--c' as string]: COLORS[i % COLORS.length], zIndex: i + 1 }}>
                  <button type="button" className="folder__tab" aria-expanded={i === open} onClick={() => setOpen(i)}>
                    <span className="folder__title">{b.title}</span>
                    <span className="folder__day">{shortDate(b.date)}</span>
                  </button>
                  <div className="folder__body" {...(i === open ? {} : { inert: '' })}>
                    <div className="folder__inner">
                      <p>{b.club}</p>
                      <div className="folder__actions">
                        <button type="button" className="pbtn pbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                        <a className="pbtn" href={b.pdf} download>{P.actions.download}</a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="folders__empty">{R.fmt.fill(P.club.empty, { year })}</p>}
        </div>
      </div>
    </section>
  );
}
