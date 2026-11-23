import { useEffect, useState } from 'react';

/* ==========================================================================
   Website Visitors — the per-district counter, shown in the footer.

   The artwork IS the supplied banner (07_website_visitors_banner_no_numbers),
   which ships with an empty slot where the number goes. Only the digits are
   drawn here, into that slot.

   Slot geometry, measured off the 1320x540 original: x 75-769, y 225-385.
   As a fraction of the banner that is left 5.68%, top 41.67%, width 52.58%,
   height 29.63% — so the overlay tracks the artwork at any width. The digits
   are one SVG with a 694x160 viewBox (the slot's own pixel size), which is
   what keeps tile size, type size and spacing all scaling together; sizing
   them in CSS units would need a container query and drift on rounding.

   The count comes from VisitCounter.ashx (see Layout.tsx). Digits are padded
   to six and roll up from 000,000 on first paint, skipped under
   prefers-reduced-motion.
   ========================================================================== */

const LADDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Slot-space layout: six 100x132 tiles either side of a comma, centred in 694.
const TILE_W = 100;
const TILE_H = 132;
const GAP = 10;
const COMMA_W = 20;
const TOP = (160 - TILE_H) / 2;
const X0 = (694 - (6 * TILE_W + 5 * GAP + COMMA_W)) / 2;

// Left edge of tile i, stepping over the comma that follows the third.
function tileX(i: number) {
  return X0 + i * (TILE_W + GAP) + (i >= 3 ? COMMA_W : 0);
}

// One odometer wheel. The strip holds 0–9 stacked; showing digit n slides it
// up by n tile-heights, and the tile's clip makes it a window onto the strip.
function Wheel({ digit, index, delay }: { digit: number; index: number; delay: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(digit);
      return;
    }
    const t = window.setTimeout(() => setShown(digit), delay);
    return () => window.clearTimeout(t);
  }, [digit, delay]);

  return (
    <g clipPath="url(#vc-tile-clip)" transform={'translate(' + tileX(index) + ',' + TOP + ')'}>
      <rect width={TILE_W} height={TILE_H} rx={18} fill="url(#vc-tile-face)" />
      <g
        style={{
          transform: 'translateY(' + -shown * TILE_H + 'px)',
          transition: 'transform 1200ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {LADDER.map((n) => (
          <text
            key={n}
            x={TILE_W / 2}
            y={n * TILE_H + TILE_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={78}
            fontWeight={700}
            fill="#FFFFFF"
          >
            {n}
          </text>
        ))}
      </g>
      {/* Seam of a split-flap tile. */}
      <rect y={TILE_H / 2} width={TILE_W} height={1.5} fill="#000000" opacity={0.4} />
    </g>
  );
}

export default function VisitorCounter({ visits }: { visits: number }) {
  // Six wheels, grouped in threes — the slot is drawn for exactly six.
  const digits = String(Math.max(0, Math.floor(visits))).padStart(6, '0').split('').map(Number);

  return (
    <div
      className="relative w-full max-w-[300px] overflow-hidden rounded-[18px] bg-[url('/default/assets/img/visitors-banner.jpg')] bg-[length:100%_100%] bg-no-repeat shadow-card"
      style={{ aspectRatio: '1320 / 540' }}
      role="img"
      aria-label={visits.toLocaleString('en-IN') + ' people have visited this website'}
    >
      <svg
        viewBox="0 0 694 160"
        className="absolute"
        style={{ left: '5.682%', top: '41.667%', width: '52.576%', height: '29.63%' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="vc-tile-clip">
            <rect width={TILE_W} height={TILE_H} rx={18} />
          </clipPath>
          <linearGradient id="vc-tile-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3648" />
            <stop offset="100%" stopColor="#101927" />
          </linearGradient>
        </defs>

        {digits.map((d, i) => (
          <Wheel key={i} digit={d} index={i} delay={140 + i * 100} />
        ))}

        <text
          x={X0 + 3 * (TILE_W + GAP) + COMMA_W / 2}
          y={TOP + TILE_H - 14}
          textAnchor="middle"
          fontSize={78}
          fontWeight={700}
          fill="#1A2B4A"
        >
          ,
        </text>
      </svg>
    </div>
  );
}
