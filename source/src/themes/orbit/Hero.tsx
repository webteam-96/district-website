import { useCallback, useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import { lockScroll } from '../../shared/smooth';

const AD_SEEN = 'orbit-ad-seen';

/* The advertisement as a popup, shown once per visit shortly after the page loads.
   A native dialog gives the focus trap, Esc to close and the backdrop. */
function AdPopup() {
  const ad = R.hero.ads?.[0];
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ad) return;
    try { if (sessionStorage.getItem(AD_SEEN)) return; } catch { /* private mode: just show it */ }
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem(AD_SEEN, '1'); } catch { /* private mode */ }
      lockScroll(true);
      ref.current?.showModal();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [ad]);
  if (!ad) return null;
  return (
    <dialog ref={ref} className="adpop" aria-label="Advertisement" onClose={() => lockScroll(false)} onClick={e => { if (e.target === ref.current) ref.current?.close(); }}>
      <img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} />
      <button type="button" className="adpop__close" aria-label="Close advertisement" onClick={() => ref.current?.close()}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </dialog>
  );
}

/* 3 · Hero: the banner fills the full width under the header, with no background around it, and
   changes through a wheel-shaped iris. The controls sit on it; the advertisement is a popup. */
export default function Hero() {
  const h = R.hero;
  const slides = h.slides;
  const calm = reducedMotion();
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [hold, setHold] = useState(false);
  const [cycle, setCycle] = useState(0);
  const two = slides.length > 1;

  const go = useCallback((d: 1 | -1) => {
    setIndex(i => { setPrev(i); return (i + d + slides.length) % slides.length; });
    setCycle(c => c + 1);
  }, [slides.length]);

  useEffect(() => {
    if (calm || hold || !two) return;
    const t = window.setTimeout(() => go(1), h.autoplayMs);
    return () => window.clearTimeout(t);
  }, [calm, hold, two, go, h.autoplayMs, cycle]);

  return (
    <section id="top" className="hero" aria-label={h.title}>
      <div
        className="stage"
        role="region"
        aria-roledescription="carousel"
        aria-label={h.title}
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        }}
      >
        <div className="stage__frame">
          {prev >= 0 && <img className="slide" src={slides[prev].photo.src} alt="" width={slides[prev].photo.w} height={slides[prev].photo.h} draggable={false} />}
          <img key={index} className={`slide ${prev >= 0 ? 'is-iris' : ''}`} src={slides[index].photo.src} alt={slides[index].photo.alt} width={slides[index].photo.w} height={slides[index].photo.h} draggable={false} />
          {prev >= 0 && <img key={`w${cycle}`} className="stage__flash" src={R.brand.wheel} alt="" aria-hidden="true" />}
        </div>
        {two && (
          <div className="stage__bar">
            <div className="stage__controls">
              <button type="button" className="hbtn" aria-label="Previous highlight" onClick={() => go(-1)}>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <ol className="segs" aria-label={`Highlight ${index + 1} of ${slides.length}`}>
                {slides.map((_, i) => (
                  <li key={i} className={i === index ? 'is-now' : ''}>
                    {i === index && <span key={cycle} className={`segs__fill ${!calm && !hold ? 'is-running' : ''}`} style={{ animationDuration: `${h.autoplayMs}ms` }} />}
                  </li>
                ))}
              </ol>
              <button type="button" className="hbtn" aria-label="Next highlight" onClick={() => go(1)}>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <AdPopup />
    </section>
  );
}
