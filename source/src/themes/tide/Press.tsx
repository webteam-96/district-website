import { useState } from 'react';
import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';

const P = R.press;
const COLORS = ['#075e69', '#0058b0', '#a60f52', '#6d1a70', '#00707a', '#0b3d91', '#8a1c6c', '#0a4f5a'];
/* the content line ends "... on the {link}."; here the link is a button of its own */
const summary = (vals: Record<string, string | number>) => R.fmt.fill(P.club.footer, vals).split(' on the {link}')[0] + '.';

/* 7 · Newsletters as a shelf: each bulletin is a coloured spine with its title running up it.
   Point at or tap a spine and it opens wide. On phones the spines stack and open downward. No images. */
export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  const bulletins = py.bulletins;
  const [open, setOpen] = useState(0);
  return (
    <section id="press" className="press" aria-labelledby="press-title">
      <div className="wrap">
        <div className="press__top">
          <div>
            <h2 id="press-title" className="stitle">{P.title}</h2>
            <p className="ssub">{P.subtext}</p>
          </div>
          <div className="gml">
            <h3 className="gml__title">{P.gml.title}</h3>
            {py.gml.length ? (
              <ul className="gml__list">
                {py.gml.map(l => (
                  <li key={l.title}>
                    <button type="button" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}><b>{l.month}</b><span>{l.governor}</span></button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="gml__empty">{R.fmt.fill(P.gml.empty, { year })}</p>
            )}
            <a className="pbtn" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
          </div>
        </div>

        <h3 className="press__head">{P.club.title} <span>{year}</span></h3>
        {switching ? (
          <div className="shelf shelf--wait" aria-hidden="true" />
        ) : bulletins.length ? (
          <ul className="shelf" key={year}>
            {bulletins.map((b, i) => (
              <li key={b.title + i} className={`spine ${i === open ? 'is-open' : ''}`} style={{ ['--c' as string]: COLORS[i % COLORS.length] }} onMouseEnter={() => setOpen(i)}>
                <button type="button" className="spine__tab" aria-expanded={i === open} onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>
                  <span className="spine__label">{b.title}</span>
                  <span className="spine__day">{shortDate(b.date)}</span>
                </button>
                <div className="spine__body" {...(i === open ? {} : { inert: '' })}>
                  <p className="spine__club">{b.club}</p>
                  <h4 className="spine__title">{b.title}</h4>
                  <p className="spine__date">{shortDate(b.date)}</p>
                  <div className="spine__actions">
                    <button type="button" className="pbtn pbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                    <a className="pbtn" href={b.pdf} download>{P.actions.download}</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="shelf__empty">{R.fmt.fill(P.club.empty, { year })}</p>
        )}
        {bulletins.length > 0 && !switching && (
          <div className="press__foot">
            <p>{summary({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
            <a className="pbtn pbtn--big" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
          </div>
        )}
      </div>
    </section>
  );
}
