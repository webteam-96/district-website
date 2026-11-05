import { useCallback, useEffect, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import DotGrid from '../../rb/DotGrid/DotGrid';
import PixelTransition from '../../rb/PixelTransition/PixelTransition';
import { useTheme } from './theme';

/* 3 · Hero, split screen: the banner runs edge to edge on the left (≈70%); a Rotary-blue
   panel on the right holds the advertisement and the controls over a live dot field.
   No text — banners, ad and icon controls only. */
export default function Hero() {
  const theme = useTheme();
  const h = R.hero;
  const slides = h.slides;
  const ad = h.ads?.[0];
  const calm = reducedMotion();
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const [cycle, setCycle] = useState(0);
  const two = slides.length > 1;

  const go = useCallback((d: 1 | -1) => {
    setIndex(i => (i + d + slides.length) % slides.length);
    setCycle(c => c + 1);
  }, [slides.length]);

  useEffect(() => {
    if (calm || hold || !two) return;
    const t = window.setTimeout(() => go(1), h.autoplayMs);
    return () => window.clearTimeout(t);
  }, [calm, hold, two, go, h.autoplayMs, cycle]);

  const img = (i: number) => {
    const s = slides[i];
    return <img src={s.photo.src} alt={i === index ? s.photo.alt : ''} width={s.photo.w} height={s.photo.h} draggable={false} className="banner__img" />;
  };

  return (
    <section id="top" className="hero" aria-label={h.title}>
      <div className="split">
        <div
          className="split__media"
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
          {two ? (
            <PixelTransition
              firstContent={img(0)}
              secondContent={img(1)}
              active={index === 1}
              gridSize={18}
              pixelColor="#F7A81B"
              pattern="ripple"
              pixelShape="rounded"
              pixelAnimation="pop"
              animationStepDuration={0.55}
              aspectRatio="59.84%"
              className="banner__pt"
            />
          ) : (
            <div className="banner__single">{img(0)}</div>
          )}
        </div>

        <aside className="split__panel">
          <div className="split__dots" aria-hidden="true">
            {!calm && (
              <DotGrid key={theme} dotSize={3} gap={20} baseColor="#2f74c9" activeColor="#FFD27A" proximity={120} shockRadius={200} shockStrength={4} returnDuration={1.4} />
            )}
          </div>
          {ad && (
            <div className="ad">
              <img src={ad.image.src} alt={ad.image.alt} width={ad.image.w} height={ad.image.h} />
            </div>
          )}
          {two && (
            <div className="hero__controls">
              <button type="button" className="hbtn" aria-label="Previous highlight" onClick={() => go(-1)}>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <ol className="segs" aria-label={`Highlight ${index + 1} of ${slides.length}`}>
                {slides.map((_, i) => (
                  <li key={i} className={i === index ? 'is-now' : i < index ? 'is-done' : ''}>
                    {i === index && <span key={cycle} className={`segs__fill ${!calm && !hold ? 'is-running' : ''}`} style={{ animationDuration: `${h.autoplayMs}ms` }} />}
                  </li>
                ))}
              </ol>
              <button type="button" className="hbtn" aria-label="Next highlight" onClick={() => go(1)}>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
