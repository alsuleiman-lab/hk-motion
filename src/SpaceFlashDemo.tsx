import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MGTheme, FlashCut, T, kufiF } from "./MG";
import type { MGThemeName } from "./mgThemes";

/** Practice composition for FlashCut (page → headline → line). Placeholder text only. */
export const FLASH_DEMO_FRAMES = 8 * 30;
const bg = () => `linear-gradient(135deg,${T.navy},#0e1624)`;

const Page: React.FC = () => (
  <div style={{ width: 1100, height: 800, background: "#ece6d6", color: "#1d1b17", fontFamily: kufiF, direction: "rtl", position: "relative" }}>
    <div style={{ position: "absolute", right: 50, top: 40, fontSize: 70 }}>عنوان الصحيفة</div>
    <div style={{ position: "absolute", right: 50, top: 150, width: 1000, height: 6, background: "#1d1b17" }} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ position: "absolute", right: 50, top: 190 + i * 40, width: 480, height: 14, background: "#b9b3a2", borderRadius: 7 }} />)}
    <div style={{ position: "absolute", left: 50, top: 190, width: 480, height: 300, background: "#c9c3b0" }} />
    <div style={{ position: "absolute", left: 50, top: 520, width: 520, fontSize: 38, lineHeight: 1.4, background: "#ffe38a", padding: "6px 10px" }}>الجملة المهمة هنا</div>
    {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 50, top: 650 + i * 40, width: 480, height: 14, background: "#b9b3a2", borderRadius: 7 }} />)}
  </div>
);
export const FlashDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => {
  const f = useCurrentFrame();
  void f;
  return (
    <MGTheme theme={theme}>
      <AbsoluteFill style={{ background: bg() }}>
        <FlashCut at={0.3} x={410} y={140} w={1100} h={800} hud="حُفظ" beats={[1.0, 1.73]} crops={[{ fx: 0.5, fy: 0.5, zoom: 1 }, { fx: 0.3, fy: 0.58, zoom: 1.6 }, { fx: 0.35, fy: 0.66, zoom: 2.3 }]}><Page /></FlashCut>
      </AbsoluteFill>
    </MGTheme>
  );
};
