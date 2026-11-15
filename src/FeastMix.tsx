import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { HybridHost, HyLayer, VSlot } from "./hybrid/Slot";

const KUFI = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] }).fontFamily;
const FPS = 30;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const rnd = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const pop = (t: number, a: number, d = 0.4) => { const x = clamp((t - a) / d); return t < a ? 0 : easeOut(x) * (1 + 0.16 * Math.sin(x * Math.PI)); };

/* ------------------------------------------------------------------ the clips (cut at the lowest sound next to each spoken word) ------------------------------------------------------------------ */
type Bg = "desert" | "sea" | "space" | "palace" | "alarm";
type Clip = { id: string; v: 29 | 30 | 31 | 32; s: number; e: number; y0: number; kind: "F" | "W"; bg: Bg; place?: string; hits: number[]; stamp: string };
const SRC_H: Record<number, number> = { 29: 976, 30: 794, 31: 928, 32: 944 };
const CLIPS: Clip[] = [
  { id: "F1", v: 29, s: 0.93, e: 2.46, y0: 300, kind: "F", bg: "desert", place: "في الصحراء", hits: [0.59], stamp: "وليمة!" },
  { id: "F2", v: 30, s: 5.37, e: 6.6, y0: 175, kind: "F", bg: "sea", place: "على البحر", hits: [0.73], stamp: "وليمة!" },
  { id: "F3", v: 31, s: 1.6, e: 3.2, y0: 300, kind: "F", bg: "space", place: "في الفضاء", hits: [0.7], stamp: "وليمة!" },
  { id: "F4", v: 32, s: 0.95, e: 4.02, y0: 262, kind: "F", bg: "palace", place: "في القصر", hits: [1.0, 1.97], stamp: "وليمة!" },
  { id: "W1", v: 31, s: 18.7, e: 19.9, y0: 345, kind: "W", bg: "alarm", hits: [0.58], stamp: "وهابية!" },
  { id: "W3", v: 31, s: 52.12, e: 53.2, y0: 250, kind: "W", bg: "alarm", hits: [0.04], stamp: "وهابية!" },
  { id: "W6", v: 32, s: 45.6, e: 46.46, y0: 262, kind: "W", bg: "alarm", hits: [0.08], stamp: "وهابي!" },
  { id: "W2", v: 31, s: 29.62, e: 30.18, y0: 340, kind: "W", bg: "alarm", hits: [0.06], stamp: "وهابية!" },
  { id: "W5", v: 32, s: 28.4, e: 29.1, y0: 262, kind: "W", bg: "alarm", hits: [0.04], stamp: "وهابية!" },
  { id: "W4", v: 32, s: 10.08, e: 10.62, y0: 262, kind: "W", bg: "alarm", hits: [0.04], stamp: "وهابية!" },
  { id: "W7", v: 32, s: 49.43, e: 50.54, y0: 262, kind: "W", bg: "alarm", hits: [0.73], stamp: "وهابية!" },
  // the rapid-fire ending: the shortest ones again
  { id: "R1", v: 31, s: 29.62, e: 30.18, y0: 340, kind: "W", bg: "alarm", hits: [0.06], stamp: "وهابية!" },
  { id: "R2", v: 32, s: 10.08, e: 10.62, y0: 262, kind: "W", bg: "alarm", hits: [0.04], stamp: "وهابية!" },
  { id: "R3", v: 32, s: 28.4, e: 29.1, y0: 262, kind: "W", bg: "alarm", hits: [0.04], stamp: "وهابية!" },
];
const DUR = CLIPS.map((c) => Math.round((c.e - c.s) * FPS));
const FROM = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
export const FEAST_FRAMES = DUR.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------ backgrounds (code-drawn, one per place) ------------------------------------------------------------------ */
const wavePath = (y: number, amp: number, len: number, ph: number, w = 1080, h = 1920) => {
  let d = `M0,${h} L0,${y}`;
  for (let x = 0; x <= w; x += 20) d += ` L${x},${y + Math.sin((x / len) * Math.PI * 2 + ph) * amp}`;
  return d + ` L${w},${h} Z`;
};
const BgDesert: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#ff8a3d 0%,#ffbf5e 38%,#ffe9a8 62%,#f7c77a 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <circle cx={820} cy={330 + Math.sin(t) * 6} r={190} fill="#fff4c9" />
      <circle cx={820} cy={330} r={250} fill="rgba(255,244,201,0.35)" />
      <path d={wavePath(1150, 40, 700, t * 0.4 + 1)} fill="#e89a45" />
      <path d={wavePath(1300, 60, 900, t * 0.3 + 3)} fill="#cf7e33" />
      <path d={wavePath(1480, 50, 600, t * 0.5 + 5)} fill="#a85f26" />
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={((rnd(i) * 1300 + t * (60 + rnd(i + 3) * 80)) % 1300) - 110} cy={900 + rnd(i + 9) * 900} r={3 + rnd(i + 5) * 4} fill="rgba(255,236,190,0.7)" />)}
    </svg>
  </AbsoluteFill>
);
const BgSea: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#2fa8ff 0%,#8fdcff 45%,#d9f6ff 60%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <circle cx={250} cy={300} r={140} fill="#fff7c8" />
      {[0, 1, 2].map((i) => <ellipse key={i} cx={((i * 520 + t * 30) % 1500) - 200} cy={200 + i * 120} rx={150} ry={40} fill="rgba(255,255,255,0.8)" />)}
      <path d={wavePath(1060, 22, 260, -t * 2.2)} fill="#1b8fd6" />
      <path d={wavePath(1200, 30, 340, -t * 1.7 + 2)} fill="#126db0" />
      <path d={wavePath(1360, 36, 420, -t * 1.3 + 4)} fill="#0c4f8c" />
      <path d={wavePath(1540, 40, 500, -t * 1.0 + 6)} fill="#083a69" />
    </svg>
  </AbsoluteFill>
);
const BgSpace: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%,#2b1d63 0%,#120a33 60%,#070517 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 90 }).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 50) * 1920} r={1.5 + rnd(i + 7) * 3 * (0.7 + 0.3 * Math.sin(t * 3 + i))} fill="#fff" />)}
      <g transform={`translate(860 ${1330 + Math.sin(t * 0.8) * 14})`}>
        <circle r={150} fill="#e0763a" /><circle r={150} fill="url(#pl)" />
        <ellipse rx={260} ry={52} fill="none" stroke="#ffd7a1" strokeWidth={14} transform="rotate(-18)" />
      </g>
      <circle cx={170} cy={360} r={90} fill="#6aa8ff" /><circle cx={140} cy={330} r={34} fill="rgba(255,255,255,0.35)" />
      <line x1={((t * 600) % 2400) - 300} y1={200} x2={((t * 600) % 2400) - 180} y2={250} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      <defs><radialGradient id="pl" cx="35%" cy="30%"><stop offset="0" stopColor="rgba(255,255,255,0.4)" /><stop offset="1" stopColor="rgba(0,0,0,0.45)" /></radialGradient></defs>
    </svg>
  </AbsoluteFill>
);
const star8 = (r: number) => { let d = ""; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, rr = i % 2 ? r * 0.55 : r; d += `${i ? "L" : "M"}${Math.cos(a) * rr},${Math.sin(a) * rr} `; } return d + "Z"; };
const BgPalace: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#4a1226,#2a0a17)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 8 }).map((_, r) => Array.from({ length: 6 }).map((__, c) => {
        const x = c * 220 + (r % 2 ? 110 : 0) - ((t * 20) % 220), y = r * 260 + 70;
        return <path key={`${r}-${c}`} d={star8(86)} transform={`translate(${x} ${y})`} fill="none" stroke="rgba(235,190,90,0.55)" strokeWidth={4} />;
      }))}
      <path d="M0,1700 L0,1300 Q540,900 1080,1300 L1080,1700 Z" fill="rgba(235,190,90,0.10)" />
      {[120, 540, 960].map((x, i) => <g key={i} transform={`translate(${x} ${1740})`}><rect x={-34} y={-460} width={68} height={460} fill="#d9a43f" /><circle cy={-470} r={52} fill="#f0c25a" /></g>)}
    </svg>
  </AbsoluteFill>
);
const BgAlarm: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "#130707" }}>
    <AbsoluteFill style={{ background: "repeating-linear-gradient(135deg,#b3141d 0 70px,#1b0707 70px 140px)", backgroundPosition: `${(t * 120) % 198}px 0` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%,rgba(0,0,0,0) 30%,rgba(10,0,0,0.78) 100%)" }} />
  </AbsoluteFill>
);
const BG: Record<Bg, React.FC<{ t: number }>> = { desert: BgDesert, sea: BgSea, space: BgSpace, palace: BgPalace, alarm: BgAlarm };

/* ------------------------------------------------------------------ one clip ------------------------------------------------------------------ */
const CARD = { x: 70, y: 330, w: 940 };
const K = CARD.w / 720;
const DIRS: [number, number, number][] = [[-900, 0, -8], [900, 0, 8], [0, -700, 5], [0, 900, -6]];

const Confetti: React.FC<{ t: number; at: number; cx: number; cy: number; seed: number }> = ({ t, at, cx, cy, seed }) => {
  const q = t - at; if (q < 0 || q > 1.6) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const a = -Math.PI / 2 + (rnd(i + seed) - 0.5) * 2.6, v = 520 + rnd(i + seed + 7) * 700;
        const x = cx + Math.cos(a) * v * q, y = cy + Math.sin(a) * v * q + 900 * q * q;
        return <rect key={i} x={x} y={y} width={16} height={26} rx={3} fill={["#ffcc33", "#ff5252", "#4cc9ff", "#7cff8a", "#ff8ad8"][i % 5]} transform={`rotate(${q * 540 * (rnd(i) - 0.5) * 2} ${x} ${y})`} />;
      })}
    </svg>
  );
};

const ClipScene: React.FC<{ c: Clip; idx: number; countBefore: number; total: number }> = ({ c, idx, countBefore, total }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const Bgc = BG[c.bg];
  const SH = SRC_H[c.v], cardH = Math.min(860, Math.round((SH - c.y0) * K));
  const [dx, dy, rot] = DIRS[idx % 4];
  const enter = easeOut(t / 0.42);
  const wob = Math.sin(t * 7 + idx) * 0.8;
  const hit = c.hits.filter((h) => t >= h).length;
  const lastHit = hit ? c.hits[hit - 1] : -1;
  const count = countBefore + hit;
  const sh = lastHit >= 0 && t - lastHit < 0.32 ? (1 - (t - lastHit) / 0.32) * (c.kind === "W" ? 10 : 5) : 0;
  const punch = lastHit >= 0 ? 1 + 0.07 * Math.max(0, 1 - (t - lastHit) / 0.22) : 1;
  const col = c.kind === "F" ? "#ffcf3a" : "#ff4d4d";
  const vol = (fr: number) => Math.min(1, fr / 1.5, (DUR[idx] - fr) / 1.5);
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`fb/v${c.v}.mp4`)} startFrom={Math.round(c.s * FPS)} volume={vol} />
      <HyLayer z={0}><Bgc t={f / FPS + idx * 7} /></HyLayer>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: cardH, transform: `translate(${(1 - enter) * dx + Math.sin(t * 90) * sh}px,${(1 - enter) * dy + Math.cos(t * 77) * sh}px) rotate(${(1 - enter) * rot + wob}deg) scale(${(0.9 + 0.1 * enter) * punch})` }}>
        <VSlot src={`fb/v${c.v}.mp4`} startFrom={Math.round(c.s * FPS)} w={CARD.w} h={cardH} radius={38} vx={0} vy={-c.y0 * K} vw={CARD.w} vh={SH * K} />
        <div style={{ position: "absolute", inset: -8, border: "8px solid #fff", borderRadius: 46, boxShadow: "0 22px 60px rgba(0,0,0,0.5)", pointerEvents: "none" }} />
      </div>
      {c.place ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", transform: `scale(${pop(t, 0.1)})` }}>
          <div style={{ direction: "rtl", fontFamily: KUFI, fontSize: 70, color: "#fff", background: "rgba(10,14,28,0.82)", border: "4px solid #fff", borderRadius: 30, padding: "8px 44px 14px", whiteSpace: "nowrap" }}>{c.place}</div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", transform: `scale(${pop(t, 0.05)})` }}>
          <div style={{ direction: "rtl", fontFamily: KUFI, fontSize: 70, color: "#fff", background: "#b3141d", border: "4px solid #fff", borderRadius: 30, padding: "8px 44px 14px", whiteSpace: "nowrap" }}>كم مرة قالها؟</div>
        </div>
      )}
      {/* the spoken word, stamped at its onset */}
      {c.hits.map((h, i) => (t >= h && t < h + 0.9 ? (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: CARD.y + cardH + 40, display: "flex", justifyContent: "center", transform: `scale(${pop(t, h, 0.3) * (t > h + 0.62 ? 1 - (t - h - 0.62) * 2.6 : 1)}) rotate(${i % 2 ? 4 : -5}deg)` }}>
          <div style={{ direction: "rtl", fontFamily: KUFI, fontSize: 170, lineHeight: 1.1, color: col, WebkitTextStroke: "10px #111", paintOrder: "stroke fill", textShadow: "0 10px 0 #111", whiteSpace: "nowrap" }}>{c.stamp}</div>
        </div>
      ) : null))}
      {c.hits.map((h, i) => <Confetti key={i} t={t} at={h} cx={540} cy={CARD.y + cardH + 120} seed={idx * 10 + i} />)}
      {/* the counter */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center" }}>
        <div style={{ direction: "rtl", fontFamily: KUFI, color: "#fff", background: "rgba(10,14,28,0.88)", border: `4px solid ${col}`, borderRadius: 34, padding: "10px 50px 16px", display: "flex", alignItems: "baseline", gap: 24, whiteSpace: "nowrap", transform: `scale(${lastHit >= 0 && t - lastHit < 0.3 ? 1 + 0.18 * (1 - (t - lastHit) / 0.3) : 1})` }}>
          <span style={{ fontSize: 56 }}>{c.kind === "F" ? "عدد الولائم" : "عدد المرات"}</span>
          <span style={{ fontSize: 120, color: col, fontVariantNumeric: "tabular-nums", direction: "ltr" }}>{c.kind === "F" ? count : count}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const FeastMix: React.FC = () => {
  let fc = 0, wc = 0;
  const pre = CLIPS.map((c) => { const b = c.kind === "F" ? fc : wc; if (c.kind === "F") fc += c.hits.length; else wc += c.hits.length; return b; });
  return (
    <HybridHost>
      {CLIPS.map((c, i) => (
        <Sequence key={c.id} from={FROM[i]} durationInFrames={DUR[i]}>
          <ClipScene c={c} idx={i} countBefore={pre[i]} total={fc} />
        </Sequence>
      ))}
    </HybridHost>
  );
};
