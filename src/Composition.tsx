import { SFX_LEVELS } from "./sfxConfig";
import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { FPS, lowerThirds, scenes, subscribeAt, TOTAL_SECONDS } from "./data";
import { C, cairo, revealTimes, SceneBody } from "./Scenes";

export const TOTAL_FRAMES = Math.ceil(TOTAL_SECONDS * FPS);
const PAD = 24;
const BROLL_W = 980;
const VIDEO_X = PAD + BROLL_W + PAD;
const VIDEO_W = 1920 - VIDEO_X - PAD;
const PANEL_H = 1080 - PAD * 2;
const TAIL = 12; // frames of overlap for exit transitions

const Pattern: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.18, backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='#e0bb62' stroke-width='1.2'><rect x='30' y='30' width='60' height='60'/><rect x='30' y='30' width='60' height='60' transform='rotate(45 60 60)'/><circle cx='60' cy='60' r='8'/></g></svg>`,
    )}")`, backgroundPosition: `${f * 0.25}px ${f * 0.15}px` }} />
  );
};

const SceneWrap: React.FC<{ index: number; dur: number; children: React.ReactNode }> = ({ index, dur, children }) => {
  const f = useCurrentFrame();
  const enter = spring({ frame: f, fps: FPS, config: { damping: 18, stiffness: 110 }, durationInFrames: 22 });
  const exit = interpolate(f, [dur - TAIL, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, dur], [1, 1.07]);
  const v = index % 4;
  const tx = v === 0 ? (1 - enter) * -260 : v === 1 ? 0 : v === 2 ? (1 - enter) * 260 : 0;
  const ty = v === 1 ? (1 - enter) * 180 : 0;
  const sc = v === 3 ? 0.82 + 0.18 * enter : 1;
  const clip = v === 3 ? 0 : 0;
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, 1) * (1 - exit), transform: `translate(${tx - exit * 40}px, ${ty}px) scale(${sc * zoom})`, filter: `blur(${(1 - enter) * 10 + exit * 6}px)`, clipPath: `inset(${clip}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Light sound effects only (no music) — volumes kept well under the speech. */
const SFX: { src: string; at: number; vol: number }[] = [
  ...scenes.map((s) => ({ src: "sfx/whoosh.wav", at: s.from, vol: SFX_LEVELS.whoosh })),
  ...scenes.flatMap((s) => (SFX_LEVELS.pop > 0 ? revealTimes(s) : []).map((t) => ({ src: "sfx/pop.wav", at: t, vol: SFX_LEVELS.pop }))),
  ...lowerThirds.map((l) => ({ src: "sfx/chime.wav", at: l.from, vol: SFX_LEVELS.chime })),
  ...subscribeAt.map(([a]) => ({ src: "sfx/chime.wav", at: a, vol: SFX_LEVELS.chime })),
];

const SubscribePill: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps: FPS, config: { damping: 12, stiffness: 140 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  const bell = Math.sin(f / 3) * 16 * Math.exp(-(f % 45) / 14);
  return (
    <div style={{ position: "absolute", top: 28, left: 28, transform: `scale(${p}) translateY(${(1 - out) * -30}px)`, opacity: out, transformOrigin: "top left", display: "flex", alignItems: "center", gap: 12, background: C.red, color: "#fff", borderRadius: 999, padding: "12px 26px", fontSize: 32, fontWeight: 900, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
      <span style={{ display: "inline-block", transform: `rotate(${bell}deg)`, transformOrigin: "top center" }}>🔔</span>
      اشترك في القناة
    </div>
  );
};

const LowerThird: React.FC<{ title: string; sub?: string; dur: number; name?: boolean }> = ({ title, sub, dur, name }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 130 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", right: 28, left: 28, bottom: 44, transform: `translateX(${(1 - p) * 520}px)`, opacity: out }}>
      <div style={{ display: "flex", alignItems: "stretch", background: "linear-gradient(270deg, rgba(8,24,32,0.94), rgba(8,24,32,0.82))", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,0.45)" }}>
        <div style={{ width: 12, background: name ? C.teal : C.gold }} />
        <div style={{ padding: "14px 26px" }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: C.cream, lineHeight: 1.25 }}>{title}</div>
          {sub && <div style={{ fontSize: 28, color: C.gold, fontWeight: 700, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

/** The raw footage drifts over time (brighter, magenta/green cast toward the end), so the grade is keyframed. */
const KEY_T = [0, 200, 400, 600, TOTAL_SECONDS];
const lerpK = (t: number, v: number[]) => interpolate(t, KEY_T, v, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const MyComponent: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const filter = `brightness(${lerpK(t, [0.9, 0.89, 0.87, 0.85, 0.84])}) contrast(${lerpK(t, [1.14, 1.1, 1.04, 0.98, 0.96])}) saturate(${lerpK(t, [1.12, 1.04, 0.94, 0.86, 0.82])})`;
  const tint = lerpK(t, [0, 0.03, 0.08, 0.11, 0.12]); // green-ish cancel of the magenta drift
  const edge = Math.round(lerpK(t, [168, 164, 156, 148, 144]));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 30%, #123546, ${C.bg} 70%)`, direction: "rtl", fontFamily: cairo }}>
      <Pattern />

      {/* B-roll panel (left) */}
      <div style={{ position: "absolute", left: PAD, top: PAD, width: BROLL_W, height: PANEL_H, borderRadius: 32, overflow: "hidden", background: "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))", border: "2px solid rgba(224,187,98,0.35)" }}>
        {scenes.map((s, i) => {
          const from = Math.round(s.from * FPS);
          const dur = Math.round((s.to - s.from) * FPS) + TAIL;
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <div style={{ position: "absolute", inset: 0 }}>
                <Sequence  durationInFrames={dur} layout="none">
                  <SceneWrap index={i} dur={dur}>
                    <SceneBody scene={s} />
                  </SceneWrap>
                </Sequence>
              </div>
            </Sequence>
          );
        })}
      </div>

      {/* Main video panel (right) — original audio only */}
      <div style={{ position: "absolute", left: VIDEO_X, top: PAD, width: VIDEO_W, height: PANEL_H, borderRadius: 32, overflow: "hidden", border: "2px solid rgba(224,187,98,0.6)", background: "#000" }}>
        <OffthreadVideo
          src={staticFile("yoga_panel.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter }}
        />
        {/* lighting grade: tame the blown-out background, add depth and a warm key on the speaker */}
        <AbsoluteFill style={{ mixBlendMode: "multiply", background: `radial-gradient(ellipse at 52% 48%, rgba(255,255,255,1) 32%, rgb(${edge},${edge - 8},${edge - 28}) 100%)` }} />
        <AbsoluteFill style={{ mixBlendMode: "multiply", background: `rgba(150,255,150,${tint})`, opacity: 1 }} />
        <AbsoluteFill style={{ mixBlendMode: "soft-light", background: "radial-gradient(ellipse at 50% 38%, rgba(255,214,160,0.55), rgba(255,214,160,0) 55%)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,15,20,0) 62%, rgba(5,15,20,0.75) 100%)" }} />
        {lowerThirds.map((l, i) => {
          const from = Math.round(l.from * FPS);
          const dur = Math.round((l.to - l.from) * FPS);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <LowerThird title={l.title} sub={l.sub} dur={dur} name={l.name} />
            </Sequence>
          );
        })}
        {subscribeAt.map(([a, b], i) => (
          <Sequence key={i} from={Math.round(a * FPS)} durationInFrames={Math.round((b - a) * FPS)} layout="none">
            <SubscribePill dur={Math.round((b - a) * FPS)} />
          </Sequence>
        ))}
      </div>

      {SFX.map((x, i) => (
        <Sequence key={i} from={Math.round(x.at * FPS)} durationInFrames={FPS * 2} layout="none">
          <Audio src={staticFile(x.src)} volume={x.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
