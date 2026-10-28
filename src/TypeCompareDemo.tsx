import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MGTheme, TypeBox, DimLayer, TimelineCounter, T } from "./MG";
import type { MGThemeName } from "./mgThemes";

/** Practice composition for TypeBox + DimLayer + TimelineCounter (placeholder text only). */
export const TYPECOMPARE_DEMO_FRAMES = 11 * 30;
const Seg: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useCurrentFrame() / 30;
  return t < from || t > to ? null : <AbsoluteFill>{children}</AbsoluteFill>;
};
export const TypeCompareDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: `linear-gradient(135deg,${T.navy},${T.accent})` }}>
      <TypeBox at={0.3} x={360} y={400} w={1200} text="جملة تجريبية تُكتب حرفاً حرفاً" title="اقتباس" chip="الفكرة" cps={12} until={5.0} />
      {/* تعتيم فوق «فيديو» ثم خط زمني فوق التعتيم */}
      <Seg from={5.4} to={10.9}>
        <AbsoluteFill style={{ background: "linear-gradient(120deg,#d9a35b,#6fb0d6)", display: "grid", placeItems: "center", fontSize: 90, color: "#fff", fontFamily: "sans-serif" }}>مقطع فيديو (تجريبي)</AbsoluteFill>
        <DimLayer at={5.6} until={10.6} amount={0.62} blur={6} />
        <TimelineCounter at={5.9} x={160} y={300} w={1600} unit="سنة" stops={[{ t: 0, value: 0, label: "البداية" }, { t: 1.6, value: 25, label: "محطة" }, { t: 3.2, value: 50, label: "النهاية" }]} />
      </Seg>
    </AbsoluteFill>
  </MGTheme>
);
