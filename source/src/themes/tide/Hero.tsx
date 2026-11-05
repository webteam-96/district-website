import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { R, reducedMotion } from '../../shared/rotary';

const STRIPS = 10;

/* 3 · Hero: the banner fills the width and stays put while the next section slides up over it,
   shrinking into a card as it goes. A new banner rises in ten staggered strips. */
export default function Hero() {
  const h = R.hero;
  const slides = h.slides;
  const calm = reducedMotion();
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [hold, setHold] = useState(false);
  const [cycle, setCycle] = useState(0);
  const two = slides.length > 1;
  const stage = useRef<HTMLDivElement>(null);

  const go = useCallback((d: 1 | -1) => {
    setIndex(i => { setPrev(i); return (i + d + slides.length) % slides.length; });
    setCycle(c => c + 1);
  }, [slides.length]);

  useEffect(() => { slides.forEach(s => { new Image().src = s.photo.src; }); }, [slides]);
  useEffect(() => {
    if (calm || hold || !two) return;
    const t = window.setTimeout(() => go(1), h.autoplayMs);
    return () => window.clearTimeout(t);
  }, [calm, hold, two, go, h.autoplayMs, cycle]);
  useEffect(() => {
    const next = document.getElementById('about');
    if (calm || !stage.current || !next) return;
    const t = gsap.fromTo(stage.current, { scale: 1, borderRadius: 0 }, { scale: 0.86, borderRadius: 36, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, [calm]);

  const s = slides[index];
  return (
    <section id="top" className="hero" aria-label={h.title}>
      <div
        ref={stage}
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
        <div className="stage__frame" role="img" aria-label={s.photo.alt}>
          {prev >= 0 && <img className="slide" src={slides[prev].photo.src} alt="" draggable={false} />}
          <div key={cycle} className={`strips ${prev >= 0 ? 'is-moving' : ''}`} aria-hidden="true">
            {Array.from({ length: STRIPS }, (_, i) => (
              <span key={i} style={{ ['--n' as string]: i, backgroundImage: `url(${s.photo.src})`, backgroundSize: `${STRIPS * 100}% auto`, backgroundPosition: `${(i / (STRIPS - 1)) * 100}% 0` }} />
            ))}
          </div>
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
    </section>
  );
}
