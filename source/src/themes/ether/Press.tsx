import { R, shortDate } from '../../shared/rotary';
import type { PdfDoc } from '../../shared/PdfModal';
import SpotlightCard from '../../rb/SpotlightCard/SpotlightCard';
import ShinyText from '../../rb/ShinyText/ShinyText';
import BorderGlow from '../../rb/BorderGlow/BorderGlow';
import { useTheme } from './theme';

const P = R.press;
const pad2 = (n: number) => String(n).padStart(2, '0');

/* Template with a {link} slot → text + anchor + text. */
const footerLine = (vals: Record<string, string | number>) => {
  const [before, after = ''] = R.fmt.fill(P.club.footer, vals).split('{link}');
  return (
    <>
      {before}
      <a href={P.club.href} target="_blank" rel="noopener">{P.club.footerLink}</a>
      {after}
    </>
  );
};

export default function Press({ year, switching, onPreview }: { year: string; switching: boolean; onPreview: (d: PdfDoc) => void }) {
  const theme = useTheme();
  const py = P.byYear[year];
  const bulletins = py.bulletins;

  return (
    <section id="press" className="press" aria-labelledby="press-title">
      <div className="wrap">
        <header className="section-head press__head">
          <div>
            <p className="eyebrow">{P.eyebrow}</p>
            <h2 id="press-title" className="section-title">
              {P.title}{' '}
              <ShinyText key={theme} text={P.tagline} color={theme === 'light' ? '#a8740f' : '#c9922b'} shineColor={theme === 'light' ? '#ffe3a3' : '#fff3cf'} speed={3.2} className="press__tag" />
            </h2>
          </div>
          <p className="section-sub">{P.subtext}</p>
        </header>

        <div className="press__grid">
          <BorderGlow key={theme} className="gml" glowColor="39 93 54" backgroundColor={theme === 'light' ? '#ffffff' : '#0a1430'} borderRadius={26} glowRadius={36} colors={['#F7A81B', '#2EA8FF', '#FFD27A']} fillOpacity={0.35}>
            <div className="gml__inner">
              <div className="gml__top">
                <h3 className="gml__title">{P.gml.title}</h3>
                <a className="link-arrow" href={P.gml.viewAll.href} target="_blank" rel="noopener">
                  {P.gml.viewAll.label}
                  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
              {py.gml.length ? (
                <ul className="gml__list">
                  {py.gml.map(l => (
                    <li key={l.title} className="gml__item">
                      <div>
                        <p className="gml__month">{l.month}</p>
                        <p className="gml__by">{l.governor}</p>
                      </div>
                      <button type="button" className="pill-btn" onClick={() => onPreview({ title: l.title, meta: P.gml.title, pdf: l.pdf })}>
                        {P.actions.preview}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="gml__empty">
                  <span className="gml__seal" aria-hidden="true"><img src={R.brand.wheel} alt="" width="56" height="56" /></span>
                  <p>{R.fmt.fill(P.gml.empty, { year })}</p>
                </div>
              )}
            </div>
          </BorderGlow>

          <div className="club">
            <h3 className="club__title">{P.club.title} <span>{year}</span></h3>
            {switching ? (
              <ul className="club__grid" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => <li key={i} className="bull bull--skeleton"><span /></li>)}
              </ul>
            ) : bulletins.length ? (
              <ul className="club__grid" key={year}>
                {bulletins.map((b, i) => (
                  <li key={b.title + i} className="bull" style={{ ['--i' as string]: i }}>
                    <SpotlightCard className={`paper paper--${i % 2 ? 'gold' : 'blue'}`} spotlightColor={i % 2 ? 'rgba(247, 168, 27, 0.16)' : 'rgba(46, 168, 255, 0.16)'} grain={0} theme={theme}>
                      <div className="paper__top">
                        <span className="paper__badge">PDF</span>
                        <span className="paper__date">{shortDate(b.date)}</span>
                      </div>
                      <span className="paper__no" aria-hidden="true">{pad2(i + 1)}</span>
                      <div className="paper__body">
                        <p className="paper__club">{b.club}</p>
                        <h4 className="paper__title">{b.title}</h4>
                      </div>
                      <div className="paper__actions">
                        <button type="button" className="pill-btn pill-btn--solid" onClick={() => onPreview({ title: b.title, meta: `${b.club} · ${shortDate(b.date)}`, pdf: b.pdf })}>
                          {P.actions.preview}
                        </button>
                        <a className="pill-btn" href={b.pdf} download>{P.actions.download}</a>
                      </div>
                    </SpotlightCard>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="club__empty">
                <p>{R.fmt.fill(P.club.empty, { year })}</p>
              </div>
            )}
            {bulletins.length > 0 && !switching && (
              <p className="club__foot">{footerLine({ shown: bulletins.length, total: R.fmt.num(py.total), year })}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
