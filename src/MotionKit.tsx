import React from "react";
import { interpolate, random, spring, useCurrentFrame } from "remotion";
import { icons } from "lucide";

/**
 * Motion-graphics kit (user 2026-10-16: «ما عندك مهارات موشن جرافيك»): reusable animated pieces for any video.
 *  - DrawIcon   : any Lucide icon (ISC licence, `npm i lucide`) drawn stroke by stroke, with glow.
 *  - Rays       : rotating light rays.      - Sparks : floating gold sparks.     - Ring : expanding shock ring.     - Flash : transition flash.
 *  - StageVisual: ready-made semantic scenes (sun / book / trust / judge / justice / speed) for ~620 px stage: change them phrase by phrase.
 * Everything is driven by seconds (t = seconds since the visual started) so it can be timed to speech.
 */
type IconNode = [string, Record<string, string | number>][];
const ICONS = icons as unknown as Record<string, IconNode>;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export const DrawIcon: React.FC<{ name: string; p: number; size?: number; color?: string; sw?: number; glow?: number; style?: React.CSSProperties }> = ({ name, p, size = 200, color = "#fff4d6", sw = 1.6, glow = 0, style }) => {
  // lucide keys are PascalCase ("Check", "BookOpen"); accept "check" / "book-open" too, which used to draw nothing
  const nodes = ICONS[name] ?? ICONS[name.replace(/(^|[-_ ])(\w)/g, (_, __, c: string) => c.toUpperCase())] ?? [];
  const n = nodes.length;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${glow}px ${color})` : undefined, ...style }}>
      {nodes.map(([tag, attrs], i) => {
        const d = clamp(p * (n + 1) - i);
        return React.createElement(tag, { key: i, ...attrs, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - d, opacity: d > 0 ? 1 : 0 });
      })}
    </svg>
  );
};

export const Rays: React.FC<{ t: number; size?: number; rgb?: string; op?: number }> = ({ t, size = 900, rgb = "255,217,120", op = 0.5 }) => {
  const mask = "radial-gradient(circle, #000 10%, transparent 68%)";
  return <div style={{ position: "absolute", width: size, height: size, left: "50%", top: "50%", marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", background: `repeating-conic-gradient(from ${t * 14}deg, rgba(${rgb},${op}) 0deg 7deg, rgba(${rgb},0) 7deg 22deg)`, WebkitMaskImage: mask, maskImage: mask }} />;
};

export const Sparks: React.FC<{ t: number; w: number; h: number; n?: number; seed?: number; color?: string }> = ({ t, w, h, n = 22, seed = 1, color = "#ffd978" }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const ph = random(`${seed}-p${i}`), sp = 0.08 + random(`${seed}-s${i}`) * 0.12, x = random(`${seed}-x${i}`) * w, s = 5 + random(`${seed}-z${i}`) * 10;
      const u = (t * sp + ph) % 1;
      return <div key={i} style={{ position: "absolute", left: x + Math.sin(t * 1.3 + i) * 18, top: h - u * h, width: s, height: s, borderRadius: "50%", background: color, opacity: Math.sin(Math.PI * u) * 0.8, boxShadow: `0 0 ${s * 2}px ${color}` }} />;
    })}
  </>
);

export const Ring: React.FC<{ p: number; size?: number; color?: string }> = ({ p, size = 360, color = "#ffd978" }) =>
  p <= 0 || p >= 1 ? null : <div style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", border: `8px solid ${color}`, opacity: 1 - p, transform: `scale(${0.3 + 1.3 * p})` }} />;

export const Flash: React.FC<{ p: number }> = ({ p }) => (p <= 0 || p >= 1 ? null : <div style={{ position: "absolute", inset: 0, background: "#fff4d6", opacity: (1 - p) * 0.45 }} />);

export type VisualKind = "sun" | "book" | "trust" | "judge" | "justice" | "speed" | "alert" | "repeat" | "nomusic";

/** balance scale (justice) — angle in degrees (positive = right pan down) */
export const BalanceScale: React.FC<{ angle: number; glow?: number; size?: number }> = ({ angle, glow = 0, size = 560 }) => {
  const r = (angle * Math.PI) / 180, L = 150, cx = 200, cy = 90;
  const lx = cx - L * Math.cos(r), ly = cy - L * Math.sin(r), rx = cx + L * Math.cos(r), ry = cy + L * Math.sin(r);
  const pan = (x: number, y: number) => (<g><line x1={x} y1={y} x2={x - 55} y2={y + 120} stroke="#f3e3c0" strokeWidth={4} /><line x1={x} y1={y} x2={x + 55} y2={y + 120} stroke="#f3e3c0" strokeWidth={4} /><path d={`M${x - 70},${y + 120} Q${x},${y + 175} ${x + 70},${y + 120} Z`} fill="#e8ae2c" stroke="#fff4d6" strokeWidth={4} /></g>);
  return (
    <svg viewBox="0 0 400 360" width={size} height={size * 0.9} style={{ filter: `drop-shadow(0 0 ${28 * glow}px #ffd978)` }}>
      <path d="M150,345 L250,345 L228,318 L172,318 Z" fill="#e8ae2c" stroke="#fff4d6" strokeWidth={4} />
      <rect x={191} y={95} width={18} height={225} rx={6} fill="#e8ae2c" stroke="#fff4d6" strokeWidth={4} />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#fff4d6" strokeWidth={12} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={16} fill="#e8ae2c" stroke="#fff4d6" strokeWidth={4} />
      {pan(lx, ly)}{pan(rx, ry)}
    </svg>
  );
};

const ease = (u: number) => u * u * (3 - 2 * u);

/** t = seconds since this visual started. Stage is 620 x 620, centred by the caller. */
export const StageVisual: React.FC<{ kind: VisualKind; t: number }> = ({ kind, t }) => {
  const W = 620;
  const box: React.CSSProperties = { position: "relative", width: W, height: W };
  const gold = "#ffd978", cream = "#fff4d6";
  if (kind === "sun") {
    return (
      <div style={box}>
        <Rays t={t} size={900} />
        <Ring p={(t % 1.6) / 1.6} />
        <div style={{ position: "absolute", left: 130, top: 130 }}><DrawIcon name="Sun" p={clamp(t / 0.9)} size={360} color={gold} sw={1.1} glow={26} style={{ transform: `rotate(${t * 18}deg)` }} /></div>
        <Sparks t={t} w={W} h={W} n={14} seed={3} />
      </div>
    );
  }
  if (kind === "book") {
    return (
      <div style={box}>
        <Rays t={t} size={760} op={0.35} />
        <div style={{ position: "absolute", left: 90, top: 150 }}><DrawIcon name="BookOpen" p={clamp(t / 1.0)} size={440} color={cream} sw={1.1} glow={18} /></div>
        <div style={{ position: "absolute", left: 250, top: 40, opacity: clamp((t - 0.8) / 0.4) }}><DrawIcon name="Sparkles" p={clamp((t - 0.8) / 0.6)} size={120} color={gold} sw={1.6} glow={14} /></div>
        <Sparks t={t} w={W} h={W} n={12} seed={5} />
      </div>
    );
  }
  if (kind === "trust") {
    const u = ease(clamp((t - 0.5) / 1.3)), arrived = t > 1.8;
    const px = 470 - 330 * u, py = 280 - Math.sin(Math.PI * u) * 110;
    return (
      <div style={box}>
        <Rays t={t} size={760} op={0.22} />
        <div style={{ position: "absolute", left: px - 90, top: py - 90 }}><DrawIcon name="Package" p={clamp(t / 0.5)} size={180} color={gold} sw={1.4} glow={16} style={{ transform: `rotate(${(1 - u) * 14}deg)` }} /></div>
        {[0.25, 0.5, 0.75].map((k) => <div key={k} style={{ position: "absolute", left: 470 - 330 * ease(clamp((t - 0.5) / 1.3 - k * 0.12)) - 8, top: 280 - Math.sin(Math.PI * ease(clamp((t - 0.5) / 1.3 - k * 0.12))) * 110 - 8, width: 16, height: 16, borderRadius: "50%", background: gold, opacity: u > 0 && u < 1 ? 0.5 - k * 0.4 : 0 }} />)}
        <div style={{ position: "absolute", left: 20, top: 190, transform: `scale(${arrived ? 1 + 0.08 * Math.sin((t - 1.8) * 9) * Math.exp(-(t - 1.8) * 2) : 1})` }}><DrawIcon name="Users" p={clamp((t - 0.2) / 0.8)} size={240} color={cream} sw={1.3} glow={10} /></div>
        {arrived ? <div style={{ position: "absolute", left: 70, top: 80 }}><DrawIcon name="CircleCheck" p={clamp((t - 1.8) / 0.5)} size={130} color="#7ed99a" sw={1.8} glow={14} /></div> : null}
        <Ring p={arrived ? clamp((t - 1.8) / 0.8) : 0} size={300} color="#7ed99a" />
      </div>
    );
  }
  if (kind === "judge") {
    const k = (t * 1.1) % 1;                                  // one blow per cycle: raise (0-0.5), strike (0.5-0.6), rest
    const ang = k < 0.5 ? -46 * ease(k / 0.5) : k < 0.6 ? -46 * (1 - (k - 0.5) / 0.1) : 0;
    const strike = k >= 0.6 ? clamp((k - 0.6) / 0.4) : 0;
    return (
      <div style={box}>
        <Rays t={t} size={760} op={0.2} />
        <div style={{ position: "absolute", left: 150, top: 330, width: 320, height: 40, borderRadius: 14, background: "linear-gradient(#e8ae2c,#b9822a)", border: "4px solid #fff4d6", boxShadow: "0 10px 24px rgba(0,0,0,.4)" }} />
        <div style={{ position: "absolute", left: 160, top: 40 }}><DrawIcon name="Gavel" p={clamp(t / 0.6)} size={300} color={cream} sw={1.3} glow={14} style={{ transform: `rotate(${ang}deg)`, transformOrigin: "30% 70%" }} /></div>
        <div style={{ position: "absolute", left: 140, top: 390 }}><DrawIcon name="Users" p={clamp((t - 0.3) / 0.8)} size={340} color={gold} sw={1.2} glow={10} /></div>
        <Ring p={strike} size={320} />
      </div>
    );
  }
  if (kind === "justice") {
    const ang = 9 * Math.exp(-t / 1.1) * Math.cos(t * 5);
    return (
      <div style={box}>
        <Rays t={t} size={800} op={0.28} />
        <div style={{ position: "absolute", left: 30, top: 60 }}><BalanceScale angle={ang} glow={0.4 + 0.6 * clamp((t - 1.0) / 0.8)} size={560} /></div>
        <div style={{ position: "absolute", left: 250, top: -10, opacity: clamp((t - 1.0) / 0.4) }}><DrawIcon name="ShieldCheck" p={clamp((t - 1.0) / 0.6)} size={120} color={gold} sw={1.6} glow={14} /></div>
        <Sparks t={t} w={W} h={W} n={16} seed={9} />
        <Ring p={clamp((t - 1.0) / 1.0)} size={420} />
      </div>
    );
  }
  if (kind === "alert") {
    return (
      <div style={box}>
        <Rays t={t} size={780} op={0.22} rgb="255,170,110" />
        <Ring p={(t % 1.1) / 1.1} size={440} color="#ffb072" />
        <Ring p={((t + 0.55) % 1.1) / 1.1} size={440} color="#ffb072" />
        <div style={{ position: "absolute", left: 150, top: 135 }}><DrawIcon name="TriangleAlert" p={clamp(t / 0.5)} size={320} color="#ffcf8a" sw={1.4} glow={22} style={{ transform: `rotate(${Math.sin(t * 16) * 4 * Math.exp(-t * 2.5)}deg)` }} /></div>
      </div>
    );
  }
  if (kind === "repeat") {
    return (
      <div style={box}>
        <Rays t={t} size={760} op={0.2} />
        <Ring p={(t % 1.2) / 1.2} size={420} />
        <div style={{ position: "absolute", left: 135, top: 135 }}><DrawIcon name="Repeat" p={clamp(t / 0.6)} size={350} color={gold} sw={1.3} glow={20} style={{ transform: `rotate(${t * 75}deg)` }} /></div>
      </div>
    );
  }
  if (kind === "nomusic") {
    const x1 = clamp((t - 0.35) / 0.2), x2 = clamp((t - 0.5) / 0.2), shake = t > 0.35 && t < 0.8 ? Math.sin(t * 60) * 8 * (1 - (t - 0.35) / 0.45) : 0;
    return (
      <div style={box}>
        <Rays t={t} size={760} op={0.18} rgb="255,170,110" />
        <div style={{ position: "absolute", left: 140, top: 140, transform: `translateX(${shake}px)` }}><DrawIcon name="Music" p={clamp(t / 0.5)} size={340} color={cream} sw={1.3} glow={16} /></div>
        <svg viewBox="0 0 620 620" width={620} height={620} style={{ position: "absolute", inset: 0 }}>
          <line x1={110} y1={110} x2={110 + 400 * x1} y2={110 + 400 * x1} stroke="#d9503a" strokeWidth={34} strokeLinecap="round" />
          <line x1={510} y1={110} x2={510 - 400 * x2} y2={110 + 400 * x2} stroke="#d9503a" strokeWidth={34} strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // speed: chevrons racing to the left
  return (
    <div style={box}>
      {[0, 1, 2].map((i) => {
        const u = ((t * 1.4 + i / 3) % 1);
        return <div key={i} style={{ position: "absolute", left: 470 - u * 440, top: 190 + (i - 1) * 8, opacity: Math.sin(Math.PI * u) }}><DrawIcon name="ChevronsLeft" p={1} size={200} color={gold} sw={2} glow={14} /></div>;
      })}
      <div style={{ position: "absolute", left: 210, top: 380 }}><DrawIcon name="Zap" p={clamp(t / 0.6)} size={200} color={gold} sw={1.5} glow={22} /></div>
    </div>
  );
};

/** small helper for entrance spring inside stage visuals */
export const useSpringIn = (startFrame: number, fps: number) => {
  const f = useCurrentFrame();
  return spring({ frame: f - startFrame, fps, config: { damping: 13, stiffness: 120 } });
};
void interpolate;

/** A work-boot sole print (vector, drawn here): forefoot + waist + heel, toe cap and chevron tread — the "boot stamp" the Sheikh asked for. Dark ink with a rough, inked edge. */
export const ShoePrint: React.FC<{ size?: number; color?: string }> = ({ size = 300, color = "#1c1b19" }) => (
  <svg viewBox="0 0 170 340" width={size * 0.5} height={size} style={{ overflow: "visible" }}>
    <defs>
      <filter id="inkrough"><feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="4" /></filter>
      <mask id="tread">
        <rect width="170" height="340" fill="#fff" />
        <path d="M22,34 C40,12 130,12 148,34" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" />
        {[62, 88, 114, 140, 166, 192].map((y) => <path key={y} d={`M20,${y + 10} L85,${y - 8} L150,${y + 10}`} fill="none" stroke="#000" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />)}
        {[276, 292, 308].map((y) => <line key={y} x1="56" y1={y} x2="114" y2={y} stroke="#000" strokeWidth="6" strokeLinecap="round" />)}
      </mask>
    </defs>
    <g filter="url(#inkrough)" mask="url(#tread)" fill={color}>
      <path d="M85,6 C126,6 153,28 157,70 C161,112 152,150 140,186 C132,208 126,220 126,238 L44,238 C44,220 38,208 30,186 C18,150 9,112 13,70 C17,28 44,6 85,6 Z" />
      <path d="M48,252 C48,246 62,244 85,244 C108,244 122,246 122,252 C130,278 128,312 110,326 C98,336 72,336 60,326 C42,312 40,278 48,252 Z" />
    </g>
  </svg>
);

/** radial burst of dust dots from the centre (t = seconds since impact) */
export const Burst: React.FC<{ t: number; n?: number; r?: number; color?: string }> = ({ t, n = 14, r = 260, color = "#e9dcc0" }) => (
  <>
    {t > 0 && t < 0.8 ? Array.from({ length: n }).map((_, i) => {
      const ang = (i / n) * Math.PI * 2 + random(`b${i}`) * 0.5, d = r * (1 - Math.pow(1 - clamp(t / 0.8), 3)) * (0.6 + random(`d${i}`) * 0.6), sz = 8 + random(`z${i}`) * 12;
      return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: sz, height: sz, marginLeft: -sz / 2, marginTop: -sz / 2, borderRadius: "50%", background: color, opacity: 1 - clamp(t / 0.8), transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px)` }} />;
    }) : null}
  </>
);
