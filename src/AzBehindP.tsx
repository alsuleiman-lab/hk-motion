import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont as fRakkas } from "@remotion/google-fonts/Rakkas";
import { loadFont as fBaloo } from "@remotion/google-fonts/BalooBhaijaan2";
import { loadFont as fKufam } from "@remotion/google-fonts/Kufam";
import { AZ_BEHIND } from "./azPlan";

/** PORTRAIT graphics-only layer for the "behind the body" words (1080x1920, transparent). The phrase is broken into 1-2 big lines at the top;
 *  the speaker's head (matted, composed on top by tools/behind_compose.mjs) overlaps the lower line, so the words read as sitting behind him. */
const FONTS = [
  { f: fRakkas(), w: 400 },
  { f: fBaloo(), w: 800 },
  { f: fKufam(), w: 800 },
];
const WIN = 3.8;
const breakLines = (t: string): string[] => {
  const ws = t.split(" ");
  if (ws.length < 2) return [t];
  let best = 1, diff = 1e9;
  for (let i = 1; i < ws.length; i++) {
    const d = Math.abs(ws.slice(0, i).join(" ").length - ws.slice(i).join(" ").length);
    if (d < diff) { diff = d; best = i; }
  }
  return [ws.slice(0, best).join(" "), ws.slice(best).join(" ")];
};

const Word: React.FC<{ i: number; text: string; offset: number }> = ({ i, text, offset }) => {
  const f = useCurrentFrame();
  const t = f / 30 - offset;
  const ft = FONTS[i % 3];
  const lines = breakLines(text);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(lines.length === 1 ? 170 : 135, Math.floor(1000 / (longest * 0.47)));
  const inP = spring({ frame: Math.round((t - 0.35) * 30), fps: 30, config: { damping: 16, stiffness: 100 } });
  const out = interpolate(t, [WIN - 0.7, WIN - 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  if (t < 0.2 || t > WIN) return null;
  const top = lines.length === 1 ? 90 : 14;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, inP * 1.5) * (1 - out), transform: `translateY(${(1 - Math.min(1, inP)) * -120 - out * 90}px) scale(${0.85 + 0.15 * Math.min(1, inP)})` }}>
      {lines.map((l, k) => (
        <div key={k} style={{ fontFamily: ft.f.fontFamily, fontWeight: ft.w, fontSize: size, lineHeight: 1.0, whiteSpace: "nowrap", direction: "rtl", color: "#f3d9a4", paintOrder: "stroke fill", WebkitTextStroke: "7px rgba(110,70,35,.6)", textShadow: "0 14px 30px rgba(60,35,15,.45)" }}>{l}</div>
      ))}
    </div>
  );
};

export const AzBehindP: React.FC = () => (
  <AbsoluteFill>
    {AZ_BEHIND.map((k, i) => <Word key={i} i={i} text={k.word} offset={k.offset} />)}
  </AbsoluteFill>
);
