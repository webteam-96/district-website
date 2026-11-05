import { useEffect, useRef, useState } from 'react';
import { R, reducedMotion } from '../../shared/rotary';
import LiquidEther from '../../rb/LiquidEther/LiquidEther';
import CardSwap, { Card, type CardSwapHandle } from '../../rb/CardSwap/CardSwap';
import TiltedCard from '../../rb/TiltedCard/TiltedCard';
import { useTheme } from './theme';


/* Card size from the deck column: the stack (4 cards, offset right/up) must fit inside it. */
const useDeckSize = (col: React.RefObject<HTMLDivElement | null>) => {
  const [size, setSize] = useState({ w: 560, h: 350 });
  useEffect(() => {
    const el = col.current;
    if (!el) return;
    const fit = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight || cw * 0.66;
      /* two banners: the back card only peeks out, so the front banner can fill the column */
      const w = Math.min(cw * 0.94, ch * 0.9 * 1.62);
      setSize({ w: Math.round(w), h: Math.round(w / 1.62) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [col]);
  return size;
};

/* 3 · Hero: the District Highlights card stack (60%) beside the advertisement (40%),
   floating on Rotary liquid light. No text — only the banners, the ad and icon controls. */
export default function Hero() {
  const h = R.hero;
  const slides = h.slides;
  const ad = h.ads?.[0];
  const calm = reducedMotion();
  const theme = useTheme();
  const deck = useRef<CardSwapHandle>(null);
  const col = useRef<HTMLDivElement>(null);
  const { w, h: hgt } = useDeckSize(col);
  const [index, setIndex] = useState(0);
  const [playing] = useState(!calm); // autoplay; pauses on hover, off under reduced motion
  const [hold, setHold] = useState(false);
  const [cycle, setCycle] = useState(0);

  const onChange = (i: number) => {
    setIndex(i);
    setCycle(c => c + 1);
  };

  return (
    <section id="top" className="hero" aria-label={h.title}>
      <div className="hero__fluid" aria-hidden="true">
        {!calm && (
          <LiquidEther
            key={theme}
            lightMode={theme === 'light'}
            colors={theme === 'light' ? ['#9CCBFF', '#3D8BFF', '#0B5FD6', '#F7A81B', '#FFB020'] : ['#00265F', '#0050B8', '#1E90FF', '#6CC8FF', '#F7A81B']}
            intensity={1.55}
            mouseForce={24}
            cursorSize={130}
            resolution={0.55}
            autoDemo
            autoSpeed={0.6}
            autoIntensity={2.6}
            autoResumeDelay={1800}
          />
        )}
      </div>
      <div className="hero__veil" aria-hidden="true" />

      <div className="wrap hero__grid">
        <div className="hero__deckcol">
          <div
            ref={col}
            className="hero__deck"
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
          >
            <CardSwap
              ref={deck}
              width={w}
              height={hgt}
              cardDistance={Math.round(w * 0.03)}
              verticalDistance={Math.round(hgt * 0.045)}
              depth={36}
              visibleCards={Math.min(4, slides.length)}
              delay={h.autoplayMs}
              autoplay={playing}
              pauseOnHover
              skewAmount={2}
              cardRadius={24}
              theme={theme}
              onChange={onChange}
              className="hero__swap"
            >
              {slides.map((s, i) => (
                <Card key={i} customClass="slide">
                  <img src={s.photo.src} alt={s.photo.alt} width={s.photo.w} height={s.photo.h} draggable={false} />
                  <span className="slide__shine" aria-hidden="true" />
                </Card>
              ))}
            </CardSwap>
          </div>
          <div className="hero__controls">
            <button type="button" className="round round--sm round--glass" aria-label="Previous highlight" onClick={() => deck.current?.prev()}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <ol className="banner__segs" aria-label={`Highlight ${index + 1} of ${slides.length}`}>
              {slides.map((_, i) => (
                <li key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''}>
                  {i === index && (
                    <span key={cycle} className={`banner__fill ${playing && !hold ? 'is-running' : ''}`} style={{ animationDuration: `${h.autoplayMs}ms` }} />
                  )}
                </li>
              ))}
            </ol>
            <button type="button" className="round round--sm round--glass" aria-label="Next highlight" onClick={() => deck.current?.next()}>
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {ad && (
          <div className="ad">
            <TiltedCard
              imageSrc={ad.image.src}
              altText={ad.image.alt}
              captionText=""
              showTooltip={false}
              containerHeight="100%"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={8}
              scaleOnHover={1.03}
              radius={26}
              glare={0.4}
              shadow={0.6}
              flipOnClick={false}
              gyroscope={false}
              className="ad__card"
            />
          </div>
        )}
      </div>
    </section>
  );
}
