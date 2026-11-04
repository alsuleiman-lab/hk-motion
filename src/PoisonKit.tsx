import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Gfx, kufiF, naskhF } from "./MG";
import { BRAND, RED, alpha } from "./brand";

/**
 * PoisonKit — explanatory motion graphics for «كيف تعمل السموم، وكيف يمكن لموادّ التمر أن تعارضها؟».
 * One panel = 960×1080 (the half-screen size of a 1920×1080 video); the panel is a rounded "electronic sticker" with transparent corners,
 * so the same clip works as half of the screen or scaled down as a sticker in front of the video. Colours are brand tokens only:
 * toxin = RED, date compound = BRAND.green, body structures = card / light / blue / accent. All times are seconds in `at`.
 */
export const PW = 960;
export const PH = 1080;
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const eo = (u: number) => 1 - Math.pow(1 - cl(u), 3);
export const eio = (u: number) => { const c = cl(u); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** progress 0→1 of an ease-out starting at `at` and lasting `d` seconds */
export const pr = (t: number, at: number, d = 0.6) => eo((t - at) / d);
/** progress 0→1 linear between a and b */
export const ln = (t: number, a: number, b: number) => cl((t - a) / (b - a));
export const useTime = () => useCurrentFrame() / FPS;

export type Badge = { kind: "proved" | "maybe" | "none"; text: string; at: number };
const BADGE_COL = () => ({ proved: BRAND.green, maybe: BRAND.accent, none: RED });
const BADGE_ICON = { proved: "✓", maybe: "؟", none: "✕" };

/** The sticker panel: title + sub on top, illustration area (y 190–900), «حدّ ما نعرفه» badges at the bottom. */
export const Panel: React.FC<{ t: number; title: string; sub?: string; badges?: Badge[]; dy?: number; children: React.ReactNode }> = ({ t, title, sub, badges = [], dy = 0, children }) => {
  const n = badges.length;
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <Gfx>
        <svg viewBox={`0 0 ${PW} ${PH}`} width={PW} height={PH} style={{ position: "absolute", inset: 0, fontFamily: `${kufiF}, "Segoe UI", Arial, sans-serif` }}>
          <defs>
            <linearGradient id="pkBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={BRAND.base2} /><stop offset="1" stopColor={BRAND.base3} /></linearGradient>
            <pattern id="pkDots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.6" fill="rgba(255,255,255,.07)" /></pattern>
            <clipPath id="pkClip"><rect x="14" y="14" width={PW - 28} height={PH - 28} rx="48" /></clipPath>
          </defs>
          <rect x="14" y="14" width={PW - 28} height={PH - 28} rx="48" fill="url(#pkBg)" />
          <rect x="14" y="14" width={PW - 28} height={PH - 28} rx="48" fill="url(#pkDots)" />
          <rect x="14" y="14" width={PW - 28} height={PH - 28} rx="48" fill="none" stroke={alpha(BRAND.accent, 0.85)} strokeWidth="4" />
          <rect x="30" y="30" width={PW - 60} height={PH - 60} rx="36" fill="none" stroke={alpha(BRAND.light, 0.12)} strokeWidth="2" />
          <g opacity={pr(t, 0, 0.5)} transform={`translate(0 ${(1 - pr(t, 0, 0.5)) * -18})`}>
            <text x={PW / 2} y="112" textAnchor="middle" direction="rtl" fontSize="56" fontWeight="800" fill={BRAND.card}>{title}</text>
            <rect x={PW / 2 - 70} y="146" width="140" height="6" rx="3" fill={BRAND.accent} />
            {sub && <text x={PW / 2} y="196" textAnchor="middle" direction="rtl" fontSize="28" fill={BRAND.light} fontFamily={`${naskhF}, "Segoe UI", Arial, sans-serif`}>{sub}</text>}
          </g>
          <g clipPath="url(#pkClip)"><g transform={`translate(0 ${dy})`}>{children}</g></g>
          {badges.map((b, i) => {
            const y = PH - 44 - (n - i) * 78 + 8, p = pr(t, b.at, 0.5), c = BADGE_COL()[b.kind];
            return (
              <g key={i} opacity={p} transform={`translate(${(1 - p) * 40} 0)`}>
                <rect x="52" y={y} width={PW - 104} height="68" rx="34" fill={alpha(c, 0.2)} stroke={c} strokeWidth="3" />
                <circle cx={PW - 90} cy={y + 34} r="24" fill={c} />
                <text x={PW - 90} y={y + 45} textAnchor="middle" fontSize="32" fontWeight="800" fill={BRAND.onAccent}>{BADGE_ICON[b.kind]}</text>
                <text x={(PW - 130) / 2 + 20} y={y + 45} textAnchor="middle" direction="rtl" fontSize="29" fontWeight="800" fill={BRAND.card}>{b.text}</text>
              </g>
            );
          })}
        </svg>
      </Gfx>
    </AbsoluteFill>
  );
};

/** fade + slide-up group */
export const A: React.FC<{ t: number; at: number; d?: number; dy?: number; dx?: number; until?: number; children: React.ReactNode }> = ({ t, at, d = 0.5, dy = 16, dx = 0, until, children }) => {
  const p = pr(t, at, d) * (until === undefined ? 1 : 1 - pr(t, until, 0.4));
  return <g opacity={p} transform={`translate(${(1 - pr(t, at, d)) * dx} ${(1 - pr(t, at, d)) * dy})`}>{children}</g>;
};

export const Tx: React.FC<{ x: number; y: number; s?: number; c?: string; w?: number; a?: "middle" | "start" | "end"; children: React.ReactNode; font?: string }> = ({ x, y, s = 30, c = BRAND.card, w = 800, a = "middle", children, font }) => (
  <text x={x} y={y} textAnchor={a} direction="rtl" fontSize={s} fontWeight={w} fill={c} fontFamily={font}>{children}</text>
);

/** label pill centred on (x,y); width follows the text length */
export const Pill: React.FC<{ t: number; at: number; x: number; y: number; text: string; s?: number; fill?: string; color?: string; stroke?: string; until?: number }> = ({ t, at, x, y, text, s = 28, fill = BRAND.navy, color = BRAND.card, stroke = BRAND.accent, until }) => {
  const w = Math.max(80, text.length * s * 0.5 + 44), h = s * 1.75;
  return (
    <A t={t} at={at} until={until} d={0.4}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth="3" />
      <text x={x} y={y + s * 0.36} textAnchor="middle" direction="rtl" fontSize={s} fontWeight="800" fill={color}>{text}</text>
    </A>
  );
};

/** leader line that draws itself */
export const Lead: React.FC<{ t: number; at: number; x1: number; y1: number; x2: number; y2: number; c?: string; dash?: boolean; until?: number }> = ({ t, at, x1, y1, x2, y2, c = BRAND.light, dash, until }) => {
  const p = pr(t, at, 0.5);
  return <g opacity={p > 0 ? (until === undefined ? 1 : 1 - pr(t, until, 0.4)) : 0}><line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={c} strokeWidth="3" strokeDasharray={dash ? "8 7" : undefined} /><circle cx={lerp(x1, x2, p)} cy={lerp(y1, y2, p)} r="6" fill={c} /></g>;
};

/** the toxin's scissors: `th` = half opening angle in degrees (14 open … 0 closed) */
export const Scissors: React.FC<{ x: number; y: number; s?: number; rot?: number; th?: number; c?: string; ring?: string }> = ({ x, y, s = 1, rot = 0, th = 14, c = RED, ring }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <g transform={`rotate(${-th * 1.6})`}><path d="M-16 6 C-16 -40 -6 -100 4 -136 C 14 -90 16 -30 16 6 Z" fill={c} stroke={BRAND.navyDeep} strokeWidth="3" /><path d="M0 4 V50" stroke={c} strokeWidth="12" strokeLinecap="round" /><ellipse cx="0" cy="82" rx="26" ry="32" fill="none" stroke={ring ?? c} strokeWidth="11" /></g>
    <g transform={`rotate(${th * 1.6})`}><path d="M16 6 C16 -40 6 -100 -4 -136 C -14 -90 -16 -30 -16 6 Z" fill={c} stroke={BRAND.navyDeep} strokeWidth="3" opacity=".95" /><path d="M0 4 V50" stroke={c} strokeWidth="12" strokeLinecap="round" /><ellipse cx="0" cy="82" rx="26" ry="32" fill="none" stroke={ring ?? c} strokeWidth="11" /></g>
    <circle r="11" fill={BRAND.card} stroke={BRAND.navyDeep} strokeWidth="3" />
  </g>
);

/** a date compound (hexagon molecule) with its name under it */
export const Mol: React.FC<{ x: number; y: number; r?: number; label?: string; c?: string; ls?: number }> = ({ x, y, r = 30, label, c = BRAND.green, ls = 24 }) => {
  const pts = (k: number) => Array.from({ length: 6 }, (_, i) => `${x + k * Math.cos(Math.PI / 3 * i + Math.PI / 6)},${y + k * Math.sin(Math.PI / 3 * i + Math.PI / 6)}`).join(" ");
  return (
    <g>
      <polygon points={pts(r)} fill={alpha(c, 0.28)} stroke={c} strokeWidth="4" strokeLinejoin="round" />
      <polygon points={pts(r * 0.52)} fill="none" stroke={c} strokeWidth="3" />
      {label && <text x={x} y={y + r + ls + 4} textAnchor="middle" direction="rtl" fontSize={ls} fontWeight="800" fill={BRAND.card}>{label}</text>}
    </g>
  );
};

/** one phospholipid: round head + two tails; dir 1 = head up (top layer), -1 = head down (bottom layer) */
export const Lipid: React.FC<{ x: number; y: number; dir?: 1 | -1; o?: number; dy?: number; rot?: number; c?: string }> = ({ x, y, dir = 1, o = 1, dy = 0, rot = 0, c = BRAND.card }) => (
  <g opacity={o} transform={`translate(${x} ${y + dy}) rotate(${rot}) scale(1 ${dir})`}>
    <circle r="12" fill={c} />
    <path d="M-5 11 q-4 18 0 36 M5 11 q4 18 0 36" stroke={BRAND.light} strokeWidth="3.5" fill="none" strokeLinecap="round" />
  </g>
);

/** a droplet of toxin */
export const Drop: React.FC<{ x: number; y: number; s?: number; c?: string; o?: number }> = ({ x, y, s = 1, c = RED, o = 1 }) => (
  <path opacity={o} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -34 C 18 -8 26 6 26 18 A26 26 0 0 1 -26 18 C -26 6 -18 -8 0 -34 Z" fill={c} stroke={BRAND.navyDeep} strokeWidth="3" />
);

/** a red blood cell seen from the side-on (biconcave disc as a pill with a dimple) */
export const Rbc: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 1, rot = 0, o = 1 }) => (
  <g opacity={o} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse rx="30" ry="22" fill={BRAND.mark} stroke={BRAND.card} strokeWidth="3" />
    <ellipse rx="13" ry="8" fill={alpha(BRAND.navyDeep, 0.45)} />
  </g>
);

/** padlock-less "≠" / arrows / crosses */
export const Cross: React.FC<{ x: number; y: number; r?: number; c?: string; o?: number }> = ({ x, y, r = 22, c = RED, o = 1 }) => (
  <g opacity={o} stroke={c} strokeWidth="9" strokeLinecap="round"><line x1={x - r} y1={y - r} x2={x + r} y2={y + r} /><line x1={x + r} y1={y - r} x2={x - r} y2={y + r} /></g>
);
export const Tick: React.FC<{ x: number; y: number; r?: number; c?: string; o?: number }> = ({ x, y, r = 22, c = BRAND.green, o = 1 }) => (
  <path opacity={o} d={`M${x - r} ${y} L${x - r * 0.3} ${y + r * 0.8} L${x + r} ${y - r * 0.8}`} fill="none" stroke={c} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
);
export const Spark: React.FC<{ x: number; y: number; s?: number; o?: number; c?: string }> = ({ x, y, s = 1, o = 1, c = RED }) => (
  <path opacity={o} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill={c} />
);
export const wob = (t: number, k: number, amp = 6, sp = 1.4) => Math.sin(t * sp * 2 + k * 2.1) * amp;
