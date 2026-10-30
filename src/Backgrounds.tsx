import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRAND, alpha } from "./brand";

/**
 * Decorated video backgrounds (user 2026-10-28: «اريد 10 خلفيات أخرى»; nine dropped in the gallery): dark, calm, never black or plain, in the one identity (src/brand.ts).
 * Each one = the brand base gradient + one pattern that drifts slowly + a soft vignette. Usage: <BgMashrabiya /> as the first layer of a scene.
 */
const Base: React.FC<{ children?: React.ReactNode; glow?: string }> = ({ children, glow = "62% 24%" }) => (
  <AbsoluteFill style={{ background: `linear-gradient(170deg,${BRAND.base2} 0%,${BRAND.base} 50%,${BRAND.base3} 100%)`, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${glow}, ${alpha(BRAND.blue, .20)}, transparent 55%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${alpha(BRAND.base3, .85)} 100%)` }} />
  </AbsoluteFill>
);
const sec = () => useCurrentFrame() / 30;

/** mashrabiya screen with light falling through it */
export const BgMashrabiya: React.FC = () => {
  const t = sec(), LINE = alpha(BRAND.light, .19), LINE2 = alpha(BRAND.light, .10);   // read per frame so the palette applies
  return (
    <Base glow="75% 18%">
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="bgMash" width="64" height="64" patternUnits="userSpaceOnUse">
            <circle cx="32" cy="32" r="20" fill="none" stroke={LINE} strokeWidth="2.2" />
            <circle cx="0" cy="0" r="12" fill="none" stroke={LINE2} strokeWidth="2" />
            <circle cx="64" cy="64" r="12" fill="none" stroke={LINE2} strokeWidth="2" />
            <circle cx="64" cy="0" r="12" fill="none" stroke={LINE2} strokeWidth="2" />
            <circle cx="0" cy="64" r="12" fill="none" stroke={LINE2} strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgMash)" />
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(${115 + Math.sin(t * 0.4) * 4}deg, transparent 30%, ${alpha(BRAND.light, .07)} 42%, transparent 54%)` }} />
    </Base>
  );
};

export const BACKGROUNDS = { BgMashrabiya };
