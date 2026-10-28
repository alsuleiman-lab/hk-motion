import React from "react";
import { random } from "remotion";
import { PaperTear } from "./PaperTear";
const FONT_TEXT = "Almarai";

/**
 * Newspaper-paper cover pieces (user 2026-10-25, Badawi cover):
 *  - Newsprint: the whole background is aged newsprint paper (texture only, no printed text), drawn in SVG.
 *  - NewsTearOpen: after the 3 still cover frames the whole sheet rips in two and the halves pull away (PaperTear).
 *  - PaperStrip: a torn cream paper strip with ink text (replaces the grey newsprint strip behind the key phrase).
 */
const INK = "#2c2418";

/** plain newsprint PAPER (no printing — user 2026-10-25: «لا تكتب جريدة، أردت شكل ورق الجريدة»; then «تظهر كأنها ذهب»):
 *  matte grey off-white stock, cloudy pulp mottling, short fibres in every direction, fine grain, specks; yellowing only at the edges; no directional streaks (they read as brushed gold) */
export const Newsprint: React.FC<{ w: number; h: number; seed?: number }> = ({ w, h, seed = 7 }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
    <defs>
      <radialGradient id={`np-edge${seed}`} cx="50%" cy="50%" r="72%"><stop offset="55%" stopColor="#c9b88e" stopOpacity="0" /><stop offset="100%" stopColor="#b39d6c" stopOpacity="0.55" /></radialGradient>
      <filter id={`np-cloud${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed={seed} /><feColorMatrix values="0 0 0 0 .42  0 0 0 0 .41  0 0 0 0 .38  0 0 0 .4 -.14" /></filter>
      <filter id={`np-fib${seed}`}><feTurbulence type="turbulence" baseFrequency="0.09" numOctaves="2" seed={seed + 4} /><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .34  0 0 0 0 .31  0 0 0 -9 .42" /></filter>
      <filter id={`np-grain${seed}`}><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed={seed + 1} /><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .3  0 0 0 0 .28  0 0 0 .22 0" /></filter>
      <filter id={`np-speck${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed={seed + 2} /><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .17  0 0 0 0 .15  0 0 0 9 -7.2" /></filter>
    </defs>
    <rect width={w} height={h} fill="#e8e3d6" />
    <rect width={w} height={h} filter={`url(#np-cloud${seed})`} />
    <rect width={w} height={h} filter={`url(#np-fib${seed})`} />
    <rect width={w} height={h} filter={`url(#np-grain${seed})`} />
    <rect width={w} height={h} filter={`url(#np-speck${seed})`} />
    <rect width={w} height={h} fill={`url(#np-edge${seed})`} />
    {/* folds: a soft crease shadow + a faint ridge (matte, no shine) */}
    <line x1={w / 2 + 2} x2={w / 2 + 2} y1={0} y2={h} stroke="#5d584c" strokeWidth={4} opacity={0.12} />
    <line x1={w / 2 - 2} x2={w / 2 - 2} y1={0} y2={h} stroke="#f2efe7" strokeWidth={2} opacity={0.35} />
    <line x1={0} x2={w} y1={h / 2 + 2} y2={h / 2 + 2} stroke="#5d584c" strokeWidth={3} opacity={0.09} />
  </svg>
);

/**
 * The cover opening (user 2026-10-28: «استعمل هذا لتمزيق الورق»): after the still cover frames the whole sheet rips in two along a ragged fibrous edge
 * and the halves pull away over the recording (PaperTear, adapted from Motionstash «Paper Tear Wipe», MIT). `sheet` = what is torn (default plain newsprint;
 * the covers pass the whole cover); frames before `from` = one whole sheet (thumbnail, no seam). `order` and `n` belonged to the old strip tear and are ignored.
 */
export const NewsTearOpen: React.FC<{ w: number; h: number; from?: number; to?: number; n?: number; order?: number[]; sheet?: React.ReactNode }> = ({ w, h, from = 3, to = 51, sheet }) =>
  <PaperTear from={from} to={to} sheet={sheet ?? <Newsprint w={w} h={h} />} />;

/** torn cream paper strip with dark ink text (the key phrase sits on paper, not on a grey print strip) */
export const PaperStrip: React.FC<{ w: number; h: number; text: string; size: number; textW?: number; style?: React.CSSProperties }> = ({ w, h, text, size, textW, style }) => {
  const n = 26;
  const topPts = Array.from({ length: n + 1 }, (_, i) => `${(i / n) * w}px ${8 + (random(`t${i}`) - 0.5) * 12}px`);
  const botPts = Array.from({ length: n + 1 }, (_, i) => `${w - (i / n) * w}px ${h - 8 + (random(`b${i}`) - 0.5) * 12}px`);
  return (
    <div style={{ position: "absolute", width: w, height: h, filter: "drop-shadow(0 10px 14px rgba(50,35,12,.38))", ...style }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${[...topPts, ...botPts].join(",")})`, background: "linear-gradient(176deg, #f6ecd4 0%, #ecdfc0 55%, #e0cfa8 100%)" }}>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
          <filter id="ps-fib"><feTurbulence type="fractalNoise" baseFrequency="0.7 0.08" numOctaves="2" seed="11" /><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .15  0 0 0 .2 0" /></filter>
          <rect width={w} height={h} filter="url(#ps-fib)" />
        </svg>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, width: w, height: h, overflow: "visible" }}>
        <text x={w / 2} y={h * 0.71} textAnchor="middle" direction="rtl" fontFamily={FONT_TEXT} fontWeight={800} fontSize={size} textLength={textW} lengthAdjust="spacingAndGlyphs" fill={INK}>{text}</text>
      </svg>
    </div>
  );
};
