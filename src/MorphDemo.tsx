import React from "react";
import { AbsoluteFill } from "remotion";
import { MGTheme, MorphBox, MorphContent, T, kufiF, useT } from "./MG";
import type { MGThemeName } from "./mgThemes";

/** Practice composition for MorphBox: word box → big card → baseline with bars → word box. Placeholder text only. Times stand in for speech moments. */
export const MORPH_DEMO_FRAMES = 13 * 30;
const STATES = [
  { t: 0.3, x: 560, y: 420, w: 800, h: 190, r: 28 },
  { t: 3.6, x: 460, y: 180, w: 1000, h: 640, r: 36 },
  { t: 7.0, x: 300, y: 820, w: 1320, h: 6, r: 3 },
  { t: 10.4, x: 560, y: 420, w: 800, h: 190, r: 28 },
];
const Row: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const t = useT(at), k = Math.max(0, Math.min(1, t / 0.4));
  return <div style={{ width: 860, margin: "14px 0", padding: "22px 30px", fontSize: 48, border: "2px solid rgba(255,255,255,.35)", borderRadius: 18, background: "rgba(255,255,255,.06)", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>{text}</div>;
};
const Bars: React.FC<{ y: number; at: number }> = ({ y, at }) => {
  const t = useT(at), o = Math.max(0, Math.min(1, (10.4 - (t + at)) / 0.3));
  if (t < 0 || o <= 0) return null;
  return (
    <div style={{ opacity: o }}>
      {[{ x: 520, h: 140, v: 20 }, { x: 900, h: 300, v: 40 }, { x: 1280, h: 480, v: 60 }].map((b, i) => {
        const k = Math.max(0, Math.min(1, (t - i * 0.25) / 0.8)), e = 1 - Math.pow(1 - k, 3), h = b.h * e;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: b.x, top: y - h, width: 120, height: h, background: i === 2 ? T.orange : "rgba(255,255,255,.35)", borderRadius: "14px 14px 0 0" }} />
            <div style={{ position: "absolute", left: b.x - 40, width: 200, textAlign: "center", top: y - h - 78, fontFamily: kufiF, fontSize: 64, color: "#fff", opacity: k }}>{Math.round(b.v * e).toLocaleString("ar-EG", { useGrouping: false })}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const MorphDemo: React.FC<{ theme?: MGThemeName }> = ({ theme = "teal" }) => (
  <MGTheme theme={theme}>
    <AbsoluteFill style={{ background: `linear-gradient(135deg,${T.navy},${T.accent})` }}>
      <MorphBox states={STATES}>
        {(r) => (
          <>
            <MorphContent from={0.8} to={3.6}><div style={{ fontSize: 96 }}>كلمة مهمة</div></MorphContent>
            <MorphContent from={4.4} to={7.0}>
              <Row at={4.4} text="الصف الأول" /><Row at={4.9} text="الصف الثاني" /><Row at={5.4} text="الصف الثالث" />
            </MorphContent>
            <MorphContent from={7.8} to={10.4}><div /></MorphContent>
            <Bars y={r.y} at={7.8} />
            <MorphContent from={10.9}><div style={{ fontSize: 80 }}>الخلاصة</div></MorphContent>
          </>
        )}
      </MorphBox>
    </AbsoluteFill>
  </MGTheme>
);
