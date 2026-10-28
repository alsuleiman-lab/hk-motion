import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { AZ_MAP } from "./azMap";

/** TEST background (motion graphic) for the "replace the background behind the speaker" experiment: Turkey–Azerbaijan crisis map, timed to his words. */
const { fontFamily: kufi } = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] });
const fps = 30;
const T = { crisis: 3.12, tr: 3.76, az: 4.26, link: 4.7 }; // seconds in the clip (his words)
export const BG_TEST_FRAMES = 193;

export const BgMotionTest: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / fps;
  const k = (a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const mapIn = k(2.2, 0.8), tr = k(T.tr), az = k(T.az), link = k(T.link, 0.8), crisis = k(T.crisis, 0.5);
  const [ax, ay] = AZ_MAP.pts.ankara, [bx, by] = AZ_MAP.pts.baku;
  const mx = (ax + bx) / 2, my = Math.min(ay, by) - 80;
  const pulse = 1 + 0.12 * Math.sin(f / 3);
  const drift = interpolate(f, [0, BG_TEST_FRAMES], [0, 30]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg,#24456e,#2f5f94 48%,#6b4630)", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: mapIn }}>
        <svg viewBox={`${371 + drift} 178 1038 583`} style={{ width: "100%", height: "100%" }}>
          {Object.entries(AZ_MAP.countries).map(([name, d]) => (
            <path key={name} d={d} fill={name === "Turkey" ? `rgba(201,63,47,${0.3 + 0.7 * tr})` : name === "Azerbaijan" ? `rgba(46,125,91,${0.3 + 0.7 * az})` : "rgba(239,227,200,.28)"} stroke="rgba(246,236,211,.55)" strokeWidth={1.6} strokeLinejoin="round" />
          ))}
          <path d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} fill="none" stroke="#e8ae2c" strokeWidth={9} strokeLinecap="round" strokeDasharray="2 20" style={{ opacity: link }} />
          <circle cx={ax} cy={ay} r={13} fill="#c93f2f" stroke="#fff" strokeWidth={4} opacity={tr} />
          <circle cx={bx} cy={by} r={13} fill="#2e7d5b" stroke="#fff" strokeWidth={4} opacity={az} />
          <text x={ax} y={ay + 90} fontFamily={kufi} fontSize={58} fill="#fff" stroke="#6b2a1f" strokeWidth={8} paintOrder="stroke" opacity={tr} textAnchor="middle">تركيا</text>
          <text x={bx} y={by - 40} fontFamily={kufi} fontSize={58} fill="#fff" stroke="#1d4d3a" strokeWidth={8} paintOrder="stroke" opacity={az} textAnchor="middle">أذربيجان</text>
          <g opacity={link} transform={`translate(${mx},${my + 60}) scale(${pulse})`}>
            <circle r={40} fill="#e8ae2c" stroke="#fff" strokeWidth={6} />
            <text y={20} fontSize={60} fontFamily={kufi} fill="#3a2414" textAnchor="middle">!</text>
          </g>
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 50, top: 60, width: 820, direction: "rtl", textAlign: "center", opacity: crisis, transform: `translateY(${(1 - crisis) * 30}px)`, fontFamily: kufi, fontSize: 80, lineHeight: 1.2, color: "#f6ecd3", paintOrder: "stroke fill", WebkitTextStroke: "12px #4a2f1d" }}>أزمة بين تركيا وأذربيجان</div>
    </AbsoluteFill>
  );
};
