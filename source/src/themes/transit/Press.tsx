import { useRef } from 'react';
import { R, shortDate } from '../../shared/rotary';
import { useSideScrub } from './motion';
import type { PdfDoc } from '../../shared/PdfModal';
import { Title } from './Sections';

const P = R.press;
const summary = (vals: Record<string, string | number>) => R.fmt.fill(P.club.footer, vals).split(' on the {link}')[0] + '.';

/* 7 · Newsletters: a long run of colour cards that rise and dip as they pass, with the title and
   the View all button staying in place at the left. No images. On phones the run becomes a swipe. */
export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const py = P.byYear[year];
  const bulletins = py.bulletins;
  const root = useRef<HTMLElement>(null);
  useSideScrub(() => Array.from(root.current!.querySelectorAll('.pslot')).map((el, i) => {
    const dip = i % 2 ? 20 : -20;
    return { target: el, trigger: el, from: { y: dip }, to: { y: -dip } };
  }), [year, switching]);
  return (
    <section id="press" ref={root} className="p press" aria-labelledby="press-title">
      <header className="press__side">
        <h2 id="press-title" className="stitle"><Title text={P.title} /></h2>
        <p className="ssub">{P.subtext}</p>
        {bulletins.length > 0 && !switching && (
          <div className="press__foot">
            <p>{summary({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
            <a className="btn-go btn-go--solid" href={P.club.href} target="_blank" rel="noopener">View all newsletters →</a>
          </div>
        )}
      </header>
      <ul className="pruns" key={year}>
        <li className="pslot">
          <div className="pcard pcard--gml">
            <h3 className="pcard__title">{P.gml.title}</h3>
            {py.gml.length ? (
              <ul className="gml__list">
                {py.gml.map(l => (
                  <li key={l.title}><button type="button" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}><b>{l.month}</b><span>{l.governor}</span></button></li>
                ))}
              </ul>
            ) : (
              <p className="pcard__empty">{R.fmt.fill(P.gml.empty, { year })}</p>
            )}
            <a className="pbtn" href={P.gml.viewAll.href} target="_blank" rel="noopener">{P.gml.viewAll.label} →</a>
          </div>
        </li>
        {!switching && bulletins.map((b, i) => (
          <li key={b.title + i} className="pslot">
            <article className="pcard">
              <p className="pcard__club">{b.club}</p>
              <h3 className="pcard__title">{b.title}</h3>
              <p className="pcard__date">{shortDate(b.date)}</p>
              <div className="pcard__actions">
                <button type="button" className="pbtn pbtn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>{P.actions.preview}</button>
                <a className="pbtn" href={b.pdf} download>{P.actions.download}</a>
              </div>
            </article>
          </li>
        ))}
        {!switching && !bulletins.length && <li className="pslot"><p className="pcard pcard__none">{R.fmt.fill(P.club.empty, { year })}</p></li>}
      </ul>
    </section>
  );
}
