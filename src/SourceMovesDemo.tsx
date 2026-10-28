import React from "react";
import { AbsoluteFill } from "remotion";
import { MGTheme, CollageAssemble, SakugaMove, SpotlightCard, TimelineTravel, T, kufiF } from "./MG";
import type { MGThemeName } from "./mgThemes";

/** Practice compositions for SakugaMove, SpotlightCard and TimelineTravel. Placeholder content only. */
export const SAKUGA_DEMO_FRAMES = 6 * 30;
export const SPOT_DEMO_FRAMES = 7 * 30;
export const TRAVEL_DEMO_FRAMES = 16 * 30;
const bg = () => `linear-gradient(135deg,${T.navy},#0e1624)`;

const Src: React.FC<{ title?: string }> = ({ title = "بطاقة مصدر" }) => (
  <div style={{ width: "100%", height: "100%", background: "#f4efe3", color: "#1d1b17", fontFamily: kufiF, direction: "rtl", padding: 30, boxSizing: "border-box", borderRadius: 24 }}>
    <div style={{ fontSize: 54 }}>{title}</div>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 14, width: `${90 - i * 12}%`, background: "#b9b3a2", borderRadius: 7, marginTop: 22 }} />)}
  </div>
);

export const SakugaDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      <SakugaMove at={0.2} w={640} h={380} from={{ x: 200, y: 330 }} mid={{ x: 1000, y: 330 }} to={{ x: 640, y: 330 }} labels={["على ٣ إطارات", "على إطار واحد"]}><Src /></SakugaMove>
    </AbsoluteFill>
  </MGTheme>
);

export const SpotDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      <SpotlightCard
        at={0.2} card={{ x: 560, y: 230, w: 800, h: 560 }}
        background={<AbsoluteFill style={{ background: "#d9d2c0" }}>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: "absolute", left: 120 + (i % 3) * 600, top: 120 + Math.floor(i / 3) * 460, width: 520, height: 380, background: "#efe9db", borderRadius: 18 }} />)}</AbsoluteFill>}
      ><Src title="نص المصدر المكتوب" /></SpotlightCard>
    </AbsoluteFill>
  </MGTheme>
);

export const TravelDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: "linear-gradient(120deg,#d9a35b,#6fb0d6)" }}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: kufiF, fontSize: 80, color: "#fff" }}>فيديو يتكلم عن سيرة (تجريبي)</div>
      <TimelineTravel stages={[
        { at: 1.6, date: "المرحلة ١", title: "البداية", sub: "نص توضيحي" },
        { at: 7.0, date: "المرحلة ٢", title: "الانتقال", sub: "نص توضيحي" },
        { at: 12.0, date: "المرحلة ٣", title: "النهاية" },
      ]} />
    </AbsoluteFill>
  </MGTheme>
);

export const COLLAGE_DEMO_FRAMES = 5 * 30;
export const CollageDemo: React.FC = () => (
  <CollageAssemble
    at={0.3}
    pieces={[
      { at: 0.0, x: 140, y: 420, w: 800, h: 800, radius: 400, color: "#f3ead3", from: "bottom" },
      { at: 0.7, x: 260, y: 520, w: 560, h: 380, color: "#2e2a26", rot: -3, from: "left", halftone: true, node: <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#999,#333)" }} /> },
      { at: 1.3, x: 520, y: 1000, w: 420, h: 260, color: "#e7b94a", rot: 4, from: "right" },
      { at: 1.9, x: 130, y: 1080, w: 300, h: 300, color: "#3f7a78", rot: -5, from: "bottom", radius: 150 },
    ]}
  />
);

export const CollageDemoL: React.FC = () => (
  <CollageAssemble
    at={0.3} w={1920} h={1080} bg="#2f5f94"
    pieces={[
      { at: 0.0, x: 640, y: 180, w: 640, h: 640, radius: 320, color: "#f3ead3", from: "bottom" },
      { at: 0.7, x: 720, y: 260, w: 480, h: 340, color: "#2e2a26", rot: -3, from: "left", halftone: true, node: <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#999,#333)" }} /> },
      { at: 1.3, x: 1240, y: 520, w: 380, h: 240, color: "#e7b94a", rot: 4, from: "right" },
      { at: 1.9, x: 300, y: 600, w: 280, h: 280, color: "#e0505a", rot: -5, from: "bottom", radius: 140 },
      { at: 2.5, x: 1380, y: 160, w: 300, h: 200, color: "#8fd12e", rot: 3, from: "top" },
    ]}
  />
);
