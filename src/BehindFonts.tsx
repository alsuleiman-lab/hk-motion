import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont as f1 } from "@remotion/google-fonts/Lalezar";
import { loadFont as f2 } from "@remotion/google-fonts/ReemKufi";
import { loadFont as f3 } from "@remotion/google-fonts/Rakkas";
import { loadFont as f4 } from "@remotion/google-fonts/ElMessiri";
import { loadFont as f5 } from "@remotion/google-fonts/Changa";
import { loadFont as f6 } from "@remotion/google-fonts/Katibeh";
import { loadFont as f7 } from "@remotion/google-fonts/Jomhuria";
import { loadFont as f8 } from "@remotion/google-fonts/BalooBhaijaan2";
import { loadFont as f9 } from "@remotion/google-fonts/Kufam";
import { loadFont as f10 } from "@remotion/google-fonts/Lemonada";

/** Font audition for "behind the body" words (graphics-only layer, transparent). Each font shows the same phrase for 2 s, numbered 1-10.
 *  The phrase uses tatweel (ـ) so the word stays connected/readable across the part hidden by the speaker's head and body. */
const LOADED = [f1(), f2(), f3(), f4(), f5(), f6(), f7(), f8(), f9(), f10()];
const FONTS: { id: number; name: string; family: string; size: number; weight?: number }[] = [
  { id: 1, name: "Lalezar", family: LOADED[0].fontFamily, size: 430 },
  { id: 2, name: "Reem Kufi", family: LOADED[1].fontFamily, size: 400 },
  { id: 3, name: "Rakkas", family: LOADED[2].fontFamily, size: 430 },
  { id: 4, name: "El Messiri", family: LOADED[3].fontFamily, size: 400, weight: 700 },
  { id: 5, name: "Changa", family: LOADED[4].fontFamily, size: 400, weight: 800 },
  { id: 6, name: "Katibeh", family: LOADED[5].fontFamily, size: 560 },
  { id: 7, name: "Jomhuria", family: LOADED[6].fontFamily, size: 760 },
  { id: 8, name: "Baloo Bhaijaan 2", family: LOADED[7].fontFamily, size: 420, weight: 800 },
  { id: 9, name: "Kufam", family: LOADED[8].fontFamily, size: 380, weight: 800 },
  { id: 10, name: "Lemonada", family: LOADED[9].fontFamily, size: 360, weight: 700 },
];
const PHRASE = "مـــنـــظـــمـــة واحـــدة؟";
const MAX_W = 1840; // the whole word must fit the frame; every font is auto-scaled to this width
const fps = 30;
const SLOT = 2; // seconds per font

const Slot: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const t = f / fps - i * SLOT;
  const font = FONTS[i];
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [handle] = useState(() => delayRender("fit font " + font.name));
  useLayoutEffect(() => {
    LOADED[i].waitUntilDone().then(() => document.fonts.ready).then(() => {
      const w = ref.current?.scrollWidth ?? MAX_W;
      setScale(Math.min(1.25, MAX_W / w));
      continueRender(handle);
    });
  }, [handle, i]);
  const visible = t >= -0.1 && t <= SLOT + 0.1;
  const inP = spring({ frame: Math.round(t * fps), fps, config: { damping: 18, stiffness: 100, mass: 0.9 } });
  const out = interpolate(t, [SLOT - 0.35, SLOT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const x = (1 - Math.min(1, inP)) * 600 - out * 700;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", transform: `translateX(${x}px)`, opacity: visible ? Math.min(1, inP * 1.5) * (1 - out) : 0 }}>
        <div ref={ref} style={{ transform: `scale(${scale})`, transformOrigin: "center",  fontFamily: font.family, fontWeight: font.weight ?? 400, fontSize: font.size, lineHeight: 1.05, color: "#f3d9a4", whiteSpace: "nowrap", direction: "rtl", WebkitTextStroke: "5px rgba(120,80,40,.55)", textShadow: "0 16px 36px rgba(60,35,15,.5)" }}>{PHRASE}</div>
      </div>
      {/* audition tag (NOT part of the final design) */}
      <div style={{ opacity: visible ? 1 : 0, position: "absolute", left: 40, bottom: 40, background: "#24456e", color: "#fff", border: "4px solid #fff", borderRadius: 18, padding: "6px 26px", fontFamily: "sans-serif", fontSize: 54, fontWeight: 800 }}>
        {font.id} — {font.name}
      </div>
    </>
  );
};

export const BehindFonts: React.FC = () => (
  <AbsoluteFill>
    {FONTS.map((_, i) => (
      <Slot key={i} i={i} />
    ))}
  </AbsoluteFill>
);
