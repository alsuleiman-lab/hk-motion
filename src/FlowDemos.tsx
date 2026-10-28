import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { MGTheme, ConvergeMerge, BlurRise, PanelToCanvas, PhoneChips, T } from "./MG";
import { CompareCards } from "./EuKit";
import type { MGThemeName } from "./mgThemes";

/** Practice compositions for ConvergeMerge, BlurRise (with a body box to avoid) and PanelToCanvas. Placeholder text only. */
export const CONVERGE_DEMO_FRAMES = 14 * 30;   // 0–8.5 s ConvergeMerge, then 9–14 s CompareCards (same paper-card style)
export const BLURRISE_DEMO_FRAMES = 6 * 30;
export const PANEL_DEMO_FRAMES = 8 * 30;
const bg = () => `linear-gradient(135deg,${T.navy},#0e1624)`;

export const ConvergeDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      <Sequence durationInFrames={255}><ConvergeMerge at={0.4} mergeAt={4.2} x={160} y={160} w={1600} h={700} sources={["الأول", "الثاني", "الثالث"]} result="الأصل" caption="أصلها واحد" /></Sequence>
      <CompareCards at={9} until={14} x={460} y={300} w={1000} h={340} good={{ label: "الأول", items: [{ text: "الاسم", at: 9.3 }, { text: "النتيجة", at: 10.3 }] }} bad={{ label: "الثاني", items: [{ text: "الاسم", at: 9.6 }, { text: "النتيجة", at: 10.8 }] }} />
    </AbsoluteFill>
  </MGTheme>
);

export const BlurRiseDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      {/* stand-in for the speaker's body (never covered by the text) */}
      <div style={{ position: "absolute", left: 640, top: 120, width: 640, height: 960, background: "rgba(255,255,255,.18)", borderRadius: "320px 320px 0 0" }} />
      <BlurRise at={0.4} y={200} size={72} text="عنوان تجريبي يظهر من الضبابية" accentWords={[2]} bodyBox={{ x: 640, w: 640 }} />
      <BlurRise at={2.2} y={700} size={44} stagger={0.09} text="سطر فرعي أصغر يتبع العنوان" bodyBox={{ x: 640, w: 640 }} color="rgba(255,255,255,.8)" />
    </AbsoluteFill>
  </MGTheme>
);

export const PanelDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      <div style={{ position: "absolute", left: 700, top: 120, width: 520, height: 960, background: "rgba(255,255,255,.14)", borderRadius: "260px 260px 0 0" }} />
      <PanelToCanvas
        at={0.3}
        panel={{ x: 1280, y: 150, w: 560, h: 780, title: "الأسباب الأربعة" }}
        canvas={{ x: 90, y: 190, w: 520, h: 700 }}
        rows={[{ title: "السبب الأول", sub: "شرح مختصر" }, { title: "السبب الثاني", sub: "شرح مختصر" }, { title: "السبب الثالث", sub: "شرح مختصر" }, { title: "السبب الرابع", sub: "شرح مختصر" }]}
        picks={[{ row: 0, check: 1.6, fly: 3.4 }, { row: 2, check: 2.4, fly: 3.8 }]}
      />
    </AbsoluteFill>
  </MGTheme>
);

export const PHONE_DEMO_FRAMES = 7 * 30;
const Feed: React.FC = () => (
  <div style={{ padding: "64px 22px 20px", direction: "rtl", fontFamily: "sans-serif" }}>
    <div style={{ fontSize: 34, fontWeight: 700, color: "#1d1b17", marginBottom: 16 }}>عنوان التطبيق</div>
    {Array.from({ length: 16 }, (_, i) => (
      <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, padding: 12, borderRadius: 18, background: i === 0 ? "#e9c9b4" : "#fff" }}>
        <div style={{ width: 62, height: 62, borderRadius: 14, background: ["#d98e6a", "#7d9cc4", "#c9ab7a", "#6b6258"][i % 4] }} />
        <div style={{ flex: 1 }}><div style={{ height: 14, width: "70%", background: "#3a352e", borderRadius: 7, marginBottom: 10 }} /><div style={{ height: 10, width: "45%", background: "#b8b0a3", borderRadius: 5 }} /></div>
      </div>
    ))}
  </div>
);
export const PhoneDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: bg() }}>
      <PhoneChips at={0.2} screen={<Feed />} chips={[{ text: "الميزة الأولى", side: "left", at: 1.4 }, { text: "الميزة الثانية", side: "right", at: 2.6 }]} />
    </AbsoluteFill>
  </MGTheme>
);
