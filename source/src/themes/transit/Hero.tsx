import { useCallback, useEffect, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';

const arrow = (d: string) => <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/* 3 · Hero: the banner is as tall as the screen allows and the next section shows beside it.
   A new banner arrives like carriage doors: the old one splits down the middle and slides apart. */
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

  useEffect(() => { slides.forEach(s => { new Image().src = s.photo.src; }); }, [slides]);
  useEffect(() => {
    if (calm || hold || !two) return;
    const t = window.setTimeout(() => go(1), h.autoplayMs);
    return () => window.clearTimeout(t);
  }, [calm, hold, two, go, h.autoplayMs, cycle]);

  const s = slides[index];
  return (
    <section id="top" className="p hero" aria-label={h.title} style={{ ['--ar' as string]: s.photo.w / s.photo.h }}>
      <div
        className="stage"
        role="region"
        aria-roledescription="carousel"
        aria-label={h.title}
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(-1); }
        }}
      >
        <img className="stage__img" src={s.photo.src} alt={s.photo.alt} draggable={false} />
        {prev >= 0 && (
          <div key={cycle} className="doors" aria-hidden="true">
            <span className="door door--l"><img src={slides[prev].photo.src} alt="" draggable={false} /></span>
            <span className="door door--r"><img src={slides[prev].photo.src} alt="" draggable={false} /></span>
          </div>
        )}
        {two && (
          <div className="stage__ctl">
            <button type="button" className="hbtn" aria-label="Previous highlight" onClick={() => go(-1)}>{arrow('M12 4 6 10l6 6')}</button>
            <button type="button" className="hbtn" aria-label="Next highlight" onClick={() => go(1)}>{arrow('m8 4 6 6-6 6')}</button>
          </div>
        )}
      </div>
    </section>
  );
}
