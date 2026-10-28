import React from "react";
import { AbsoluteFill } from "remotion";
import { MGTheme, TimelineCounter, T, kufiF } from "./MG";
import type { MGThemeName } from "./mgThemes";

/** Practice composition for TimelineCounter (placeholder labels only — no real facts). Stop times stand in for the moments a speaker would say each item. */
export const TIMELINE_DEMO_FRAMES = 9 * 30;
export const TimelineDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: `linear-gradient(135deg,${T.navy},${T.accent})` }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: kufiF, fontSize: 54, color: "#fff", opacity: 0.85, direction: "rtl" }}>مثال تجريبي — عدّاد على خط زمني</div>
      <TimelineCounter
        at={0.4} x={160} y={240} w={1600} unit="سنة" step={1}
        stops={[
          { t: 0, value: 0, label: "البداية" },
          { t: 2.2, value: 20, label: "المحطة الأولى", sub: "نص توضيحي" },
          { t: 3.8, value: 35, label: "المحطة الثانية" },
          { t: 5.6, value: 52, label: "المحطة الثالثة" },
          { t: 7.0, value: 60, label: "النهاية" },
        ]}
      />
    </AbsoluteFill>
  </MGTheme>
);
