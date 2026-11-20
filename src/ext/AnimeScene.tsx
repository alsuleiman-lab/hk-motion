import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * مشهد أنيمي بالكود (٥ ثوانٍ، ٢٤ إطاراً) على طريقة مستودع «إتش تي إم إل أنيم»:
 * ورقة لقطات ثم رسم مسطّح بخط، ثلاث لقطات (تمهيد واسع، لقطة الحركة الغالية، لقطة الختام القريبة)،
 * الشخصية على اثنين والمطر والنصل على واحد، القطع بغمسة لون، ولوحة ألوان مغلقة، ولا ظهور تدريجي لشخصية.
 * ٢٠٢٦-١١-٢٠ تجربة مستقلة (لا علاقة لها بقواعد المونتاج).
 */
const W = 1920, H = 1080;
export const ANIME_FPS = 24;
export const ANIME_FRAMES = 120;

/** اللوحة المغلقة «القمر النيلي» من المستودع، ولا لون خارجها */
const C = {
  sky: "#1b2d6b", ink: "#101628", moon: "#d5e2ff", accent: "#e23b4a", practical: "#f0c36a",
  iris: "#e7a04a", skin: "#f0c2ae", hair: "#16141c", sclera: "#f6f3ee", line: "#e7eefc",
};

/** ورقة اللقطات: [البداية، النهاية) بالإطارات */
const SHOT = { establish: [0, 36], sakuga: [36, 90], button: [90, 120] } as const;
const CUTS = [{ at: 36, color: C.accent }, { at: 90, color: C.ink }];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // power1.inOut
const rad = (d: number) => (d * Math.PI) / 180;

/** سلسلة عشوائية ثابتة (بلا Math.random) */
const seeded = (seed: number) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); };

/* ───────────── المطر: خطوط مستقيمة على واحد (كل إطار) ───────────── */
const RAIN = (() => {
  const r = seeded(7);
  return Array.from({ length: 170 }, () => ({ x: r() * (W + 400), y: r() * (H + 240), len: 70 + r() * 60, sp: 62 + r() * 40, o: 0.3 + r() * 0.35 }));
})();
const Rain: React.FC<{ f: number; k?: number; w?: number }> = ({ f, k = 1, w = 2.4 }) => (
  <g stroke={C.line} strokeWidth={w} strokeLinecap="round">
    {RAIN.slice(0, Math.round(RAIN.length * k)).map((d, i) => {
      const y = ((d.y + d.sp * f) % (H + 240)) - 120;
      const x = d.x - 0.2 * (y + 120) - 120;
      return <line key={i} x1={x} y1={y} x2={x - 0.2 * d.len} y2={y + d.len} opacity={d.o} />;
    })}
  </g>
);

/* ───────────── السماء والقمر والمباني البعيدة ───────────── */
const Sky: React.FC<{ moon?: { x: number; y: number; r: number }; far?: boolean; farY?: number }> = ({ moon, far, farY = 700 }) => (
  <g>
    <defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="1" stopColor={C.ink} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sk)" />
    {moon && (
      <g>
        <circle cx={moon.x} cy={moon.y} r={moon.r * 1.35} fill={C.moon} opacity={0.1} />
        <circle cx={moon.x} cy={moon.y} r={moon.r} fill={C.moon} />
        {/* سحابتان مسطّحتان تقطعان القمر */}
        <path d={`M ${moon.x - moon.r * 1.6} ${moon.y + moon.r * 0.25} q ${moon.r * 1.1} -60 ${moon.r * 2.4} -8 q ${moon.r * 0.5} 30 ${moon.r * 1.3} 18 l 0 46 l -${moon.r * 3.9} 0 z`} fill={C.ink} opacity={0.55} />
        <path d={`M ${moon.x - moon.r * 1.1} ${moon.y - moon.r * 0.5} q ${moon.r * 0.9} -34 ${moon.r * 1.9} -6 l 0 26 l -${moon.r * 1.9} 0 z`} fill={C.sky} opacity={0.5} />
      </g>
    )}
    {far && (
      <g>
        {/* سلسلة مبانٍ بعيدة أفتح وأقلّ تبايناً، بنوافذ قليلة بلون الضوء العملي */}
        {[
          [0, 90, 220], [90, 70, 300], [160, 110, 190], [270, 80, 340], [350, 120, 250], [470, 70, 200], [540, 100, 310], [640, 90, 230],
          [730, 130, 360], [860, 80, 210], [940, 100, 290], [1040, 90, 400], [1130, 120, 240], [1250, 80, 330], [1330, 110, 270], [1440, 90, 380],
          [1530, 130, 220], [1660, 80, 310], [1740, 100, 260], [1840, 90, 340],
        ].map(([x, w, h], i) => (
          <rect key={i} x={x} y={farY - h * 0.6} width={w} height={h * 0.6 + 400} fill={C.moon} opacity={0.12} />
        ))}
        {[[150, 560], [380, 540], [585, 590], [790, 520], [985, 580], [1170, 600], [1390, 560], [1580, 610], [1800, 570]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={14} height={20} fill={C.practical} opacity={0.9} />
        ))}
      </g>
    )}
  </g>
);

/* ───────────── الشخصية: سيّاف جانبي مسطّح (النسخة الثانية: أطراف مدبّبة، حذاء، ركب، رأس بملامح، سيف بمقبض وحرس) ───────────── */
type V2 = [number, number];
type Pose = {
  crouch: number; lean: number;                        // نزول الورك عن الوقوف، وميل الجذع (درجات، + للأمام)
  hand: [number, number];                              // موضع اليد بالنسبة للورك داخل إطار الجذع
  blade: number; bladeL: number;                       // زاوية النصل العامة (٠ = يميناً، − = للأعلى) وطوله ٠..١
  trail?: [number, number];                            // قوس لطخة النصل بين زاويتين
  scarf: number; hairA: number;                        // ميل الوشاح وذيل الشعر
  fa: number; ba: number;                              // كاحل الرجل الأمامية والخلفية أفقياً عن الورك
  fAng: number; bAng: number;                          // زاوية الحذاء (+ الإصبع للأسفل أي الكعب مرفوع)
  head: number;                                        // ميل الرأس
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dir = (a: number) => [Math.cos(rad(a)), Math.sin(rad(a))] as const;

/** الحذاء بالنسبة للكاحل (أعلى الساق) والإصبع لليمين */
const BOOT: V2[] = [[-22, -6], [24, -6], [26, 26], [48, 38], [80, 46], [88, 54], [84, 58], [-26, 58], [-30, 44], [-26, 20]];
const rotP = (p: V2, deg: number): V2 => { const r = rad(deg); return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)]; };
/** ارتفاع الكاحل عن الأرض ليلمس أخفض نقطة في الحذاء الأرض */
const ankleH = (deg: number) => Math.max(...BOOT.map((p) => rotP(p, deg)[1]));

/** مفصل بعظمتين: يعيد المرفق أو الركبة (للذراع «down»: المرفق للأسفل، وللساق «fwd»: الركبة للأمام) */
const ik = (a: V2, b: V2, l1: number, l2: number, rule: "down" | "fwd"): V2 => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.max(1, Math.hypot(dx, dy));
  const dist = Math.min(L, l1 + l2 - 1);
  const ux = dx / L, uy = dy / L;
  const aa = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
  const mx = a[0] + ux * aa, my = a[1] + uy * aa;
  let kx = mx - uy * hh, ky = my + ux * hh;
  if (rule === "down" ? ky < my : kx < mx) { kx = mx + uy * hh; ky = my - ux * hh; }
  return [kx, ky];
};
const reachTo = (a: V2, b: V2, l: number): V2 => {
  const dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy);
  return d > l ? [a[0] + (dx / d) * l, a[1] + (dy / d) * l] : b;
};

const Figure: React.FC<{ p: Pose; x: number; ground: number; s: number; detail?: boolean }> = ({ p, x, ground, s, detail }) => {
  const lw = (n: number) => n * s;
  const L1 = 124 * s, L2 = 124 * s;
  const cl = Math.cos(rad(p.lean)), sl = Math.sin(rad(p.lean));

  // الورك: الارتفاع المطلوب، ويُخفَض تلقائياً إن لم تبلغ إحدى القدمين الأرض (فتبقى القدمان ملتصقتين بالأرض دائماً)
  const hF = ankleH(p.fAng) * s, hB = ankleH(p.bAng) * s;
  const dxF = p.fa * s, dxB = p.ba * s; const reach = L1 + L2 - 1;
  const hipH = Math.min((296 - p.crouch) * s, hF + Math.sqrt(Math.max(0, reach * reach - dxF * dxF)), hB + Math.sqrt(Math.max(0, reach * reach - dxB * dxB)));
  const hipG: V2 = [x, ground - hipH];
  const T = (px: number, py: number): V2 => [hipG[0] + (px * cl - py * sl) * s, hipG[1] + (px * sl + py * cl) * s];
  const q = (px: number, py: number) => T(px, py).join(" ");

  /** سلسلة أطراف مدبّبة: حدّ فاتح للخارج ثم لون ثم ظلّ قاسٍ على جهة الأسفل واليسار */
  const chain = (pts: V2[], ws: number[], fill: string, shadeOp = 0.3) => {
    const outl: React.ReactNode[] = [], fills: React.ReactNode[] = [], shades: React.ReactNode[] = [];
    for (let i = 0; i < pts.length; i++) {
      const r = (ws[i] * s) / 2;
      outl.push(<circle key={"o" + i} cx={pts[i][0]} cy={pts[i][1]} r={r} />);
      fills.push(<circle key={"f" + i} cx={pts[i][0]} cy={pts[i][1]} r={r} />);
      if (i < pts.length - 1) {
        const a = pts[i], b = pts[i + 1]; const wa = ws[i] * s, wb = ws[i + 1] * s;
        const dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.max(1, Math.hypot(dx, dy));
        const nx = -dy / d, ny = dx / d; const sg = -nx + ny >= 0 ? 1 : -1;
        const P = `${a[0] + nx * wa / 2},${a[1] + ny * wa / 2} ${b[0] + nx * wb / 2},${b[1] + ny * wb / 2} ${b[0] - nx * wb / 2},${b[1] - ny * wb / 2} ${a[0] - nx * wa / 2},${a[1] - ny * wa / 2}`;
        outl.push(<polygon key={"op" + i} points={P} />);
        fills.push(<polygon key={"fp" + i} points={P} />);
        const S2 = `${a[0] + sg * nx * wa / 2},${a[1] + sg * ny * wa / 2} ${b[0] + sg * nx * wb / 2},${b[1] + sg * ny * wb / 2} ${b[0] + sg * nx * wb * 0.06},${b[1] + sg * ny * wb * 0.06} ${a[0] + sg * nx * wa * 0.06},${a[1] + sg * ny * wa * 0.06}`;
        shades.push(<polygon key={"s" + i} points={S2} />);
      }
    }
    return (
      <g>
        <g fill={C.line} stroke={C.line} strokeWidth={lw(7)} strokeLinejoin="round">{outl}</g>
        <g fill={fill}>{fills}</g>
        <g fill={C.ink} opacity={shadeOp}>{shades}</g>
      </g>
    );
  };

  /* الأرجل: كاحلان على الأرض، ركبتان للأمام */
  const aF: V2 = [x + dxF, ground - hF], aB: V2 = [x + dxB, ground - hB];
  const kF = ik(hipG, aF, L1, L2, "fwd"), kB = ik(hipG, aB, L1, L2, "fwd");
  const boot = (a: V2, ang: number) => {
    const P = BOOT.map((b) => { const r = rotP(b, ang); return `${a[0] + r[0] * s},${a[1] + r[1] * s}`; }).join(" ");
    const c0 = rotP([-24, 12], ang), c1 = rotP([26, 12], ang);
    return (
      <g>
        <polygon points={P} fill={C.ink} stroke={C.line} strokeWidth={lw(6)} strokeLinejoin="round" />
        <line x1={a[0] + c0[0] * s} y1={a[1] + c0[1] * s} x2={a[0] + c1[0] * s} y2={a[1] + c1[1] * s} stroke={C.accent} strokeWidth={lw(6)} />
      </g>
    );
  };
  const legBack = chain([hipG, kB, aB], [66, 52, 40], C.ink, 0.55);
  const legFront = chain([hipG, kF, aF], [68, 54, 42], C.ink, 0.35);

  /* الذراعان */
  const shN = T(10, -186), shF = T(-6, -190);
  const hdTarget = T(p.hand[0], p.hand[1]);
  const A1 = 140 * s, A2 = 130 * s;
  const hand = reachTo(shN, hdTarget, A1 + A2 - 2);
  const elbow = ik(shN, hand, A1, A2, "down");
  const bd = dir(p.blade);
  const nrm: V2 = [-bd[1], bd[0]];
  // اليد الخلفية تمسك المقبض خلف اليد الأمامية، وقبل السلّ تتدلّى
  const drawn = p.bladeL > 0.3;
  const hand2 = drawn ? reachTo(shF, [hand[0] - bd[0] * 44 * s, hand[1] - bd[1] * 44 * s], A1 + A2 - 2) : reachTo(shF, T(26, -52), A1 + A2 - 2);
  const elbow2 = ik(shF, hand2, A1, A2, "down");

  /* السيف */
  const BL = 420 * s * p.bladeL;
  const G: V2 = [hand[0] + bd[0] * 40 * s, hand[1] + bd[1] * 40 * s];
  const tip: V2 = [G[0] + bd[0] * BL, G[1] + bd[1] * BL];
  const swordC: V2 = [G[0] + bd[0] * BL * 0.5 - nrm[0] * 16 * s * p.bladeL, G[1] + bd[1] * BL * 0.5 - nrm[1] * 16 * s * p.bladeL];

  /* لطخة النصل: شكل مدبّب على قوس بين زاويتين */
  let trail: React.ReactNode = null;
  if (p.trail) {
    const [t0, t1] = p.trail; const N = 10; const R = 455 * s; const wmax = 130 * s;
    const outer: string[] = [], inner: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; const dd = dir(lerp(t0, t1, u)); const w = wmax * Math.pow(u, 1.3);
      outer.push(`${hand[0] + dd[0] * R},${hand[1] + dd[1] * R}`);
      inner.push(`${hand[0] + dd[0] * (R - w)},${hand[1] + dd[1] * (R - w)}`);
    }
    trail = <polygon points={[...outer, ...inner.reverse()].join(" ")} fill={C.practical} />;
  }

  /* الوشاح وذيل الشعر: أشكال مدبّبة تتبع الحركة */
  const neck = T(4, -212);
  const hc = T(18, -284);
  const sc = rad(p.scarf);
  const scarfEnd: V2 = [neck[0] - Math.cos(sc) * 300 * s, neck[1] + Math.sin(sc) * 130 * s + 20 * s];
  const scarfMid: V2 = [neck[0] - Math.cos(sc) * 140 * s, neck[1] + Math.sin(sc) * 40 * s - 34 * s];
  const scarf2End: V2 = [neck[0] - Math.cos(sc + 0.28) * 190 * s, neck[1] + Math.sin(sc + 0.28) * 90 * s + 54 * s];
  const tail = (ang: number, len: number, thick: number): React.ReactNode => {
    const b0 = hc[0] - 40 * s, b1 = hc[1] - 42 * s;
    const e0 = b0 - Math.cos(rad(ang)) * len * s, e1 = b1 - 10 * s + Math.sin(rad(ang)) * len * 0.62 * s;
    const m0 = (b0 + e0) / 2, m1 = (b1 + e1) / 2 - 34 * s;
    return <path d={`M ${b0 + 8 * s} ${b1 - thick * s} Q ${m0} ${m1 - thick * s} ${e0} ${e1} Q ${m0} ${m1 + thick * 1.2 * s} ${b0 + 10 * s} ${b1 + thick * s} Z`} fill={C.hair} />;
  };
  const flare = Math.max(0, p.hairA) * 2.2 + 20;
  const rotHead = p.head + p.lean * 0.4;
  const hq = (px: number, py: number) => `${hc[0] + px * s} ${hc[1] + py * s}`;

  return (
    <g>
      {/* الرجل الخلفية والذراع البعيدة */}
      {legBack}{boot(aB, p.bAng)}
      {chain([shF, elbow2, hand2], [46, 40, 32], C.sky, 0.6)}
      {/* الوشاح وذيل الشعر خلف الجسم */}
      <path d={`M ${neck[0]} ${neck[1] - 22 * s} Q ${scarfMid[0]} ${scarfMid[1]} ${scarfEnd[0]} ${scarfEnd[1]} Q ${scarfMid[0]} ${scarfMid[1] + 62 * s} ${neck[0] - 6 * s} ${neck[1] + 26 * s} Z`} fill={C.accent} />
      <path d={`M ${neck[0]} ${neck[1] - 2 * s} Q ${scarfMid[0]} ${scarfMid[1] + 70 * s} ${scarf2End[0]} ${scarf2End[1]} Q ${scarfMid[0] + 20 * s} ${scarfMid[1] + 110 * s} ${neck[0] - 2 * s} ${neck[1] + 30 * s} Z`} fill={C.accent} opacity={0.82} />
      {tail(p.hairA + 18, 190, 18)}
      {tail(p.hairA, 270, 26)}
      {/* الغمد عند الورك: خشب بفم فضي */}
      {(() => {
        const g0 = T(38, -10), g1 = T(-250, 64);
        return (
          <g>
            <line x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]} stroke={C.line} strokeWidth={lw(24)} strokeLinecap="round" />
            <line x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]} stroke={C.ink} strokeWidth={lw(15)} strokeLinecap="round" />
            <circle cx={g0[0]} cy={g0[1]} r={lw(11)} fill={C.practical} stroke={C.line} strokeWidth={lw(3)} />
          </g>
        );
      })()}
      {/* الرجل الأمامية */}
      {legFront}{boot(aF, p.fAng)}
      {/* ذيل المعطف المتطاير ثم لوحه الأمامي ثم الجذع: مسطّح بظلّ واحد قاسٍ */}
      <path d={`M ${q(-46, -8)} L ${q(-4, -8)} Q ${q(-66 - flare, 70)} ${q(-96 - flare * 1.3, 168)} Q ${q(-44, 132)} ${q(-46, -8)} Z`} fill={C.sky} stroke={C.line} strokeWidth={lw(6)} strokeLinejoin="round" />
      <path d={`M ${q(-46, -8)} L ${q(-4, -8)} Q ${q(-66 - flare, 70)} ${q(-96 - flare * 1.3, 168)} Z`} fill={C.ink} opacity={0.32} />
      <polygon points={[T(-34, -8), T(50, -8), T(58, 150), T(24, 160), T(-6, 140), T(-36, 150)].map((v) => v.join(",")).join(" ")} fill={C.sky} stroke={C.line} strokeWidth={lw(6)} strokeLinejoin="round" />
      <polygon points={[T(-34, -8), T(-6, -8), T(-6, 140), T(-36, 150)].map((v) => v.join(",")).join(" ")} fill={C.ink} opacity={0.3} />
      <path d={`M ${q(-46, 8)} Q ${q(-66, -70)} ${q(-52, -150)} Q ${q(-44, -204)} ${q(-14, -220)} L ${q(24, -220)} Q ${q(58, -190)} ${q(54, -130)} Q ${q(42, -70)} ${q(46, 8)} Z`} fill={C.sky} stroke={C.line} strokeWidth={lw(6)} strokeLinejoin="round" />
      <path d={`M ${q(-46, 8)} Q ${q(-66, -70)} ${q(-52, -150)} Q ${q(-44, -204)} ${q(-14, -220)} L ${q(-2, -218)} Q ${q(-26, -150)} ${q(-20, -60)} L ${q(-14, 8)} Z`} fill={C.ink} opacity={0.3} />
      <path d={`M ${q(34, -208)} Q ${q(14, -130)} ${q(34, -16)}`} fill="none" stroke={C.line} strokeWidth={lw(4)} strokeLinecap="round" />
      <path d={`M ${q(-16, -222)} L ${q(28, -224)} L ${q(34, -196)} L ${q(-10, -200)} Z`} fill={C.moon} stroke={C.line} strokeWidth={lw(3)} strokeLinejoin="round" />
      {/* الحزام وعقدته وذيلاه */}
      <polygon points={[T(-50, -30), T(52, -30), T(52, -2), T(-50, -2)].map((v) => v.join(",")).join(" ")} fill={C.accent} stroke={C.line} strokeWidth={lw(4)} strokeLinejoin="round" />
      {(() => {
        const k = T(-54, -16);
        const e1: V2 = [k[0] - Math.cos(sc) * 100 * s, k[1] + Math.sin(sc) * 50 * s + 24 * s];
        const e2: V2 = [k[0] - Math.cos(sc + 0.3) * 70 * s, k[1] + Math.sin(sc + 0.3) * 40 * s + 62 * s];
        return (
          <g fill={C.accent} stroke={C.line} strokeWidth={lw(3)} strokeLinejoin="round">
            <path d={`M ${k[0]} ${k[1] - 6 * s} L ${e1[0]} ${e1[1]} L ${e1[0] + 6 * s} ${e1[1] + 22 * s} L ${k[0]} ${k[1] + 8 * s} Z`} />
            <path d={`M ${k[0]} ${k[1]} L ${e2[0]} ${e2[1]} L ${e2[0] + 8 * s} ${e2[1] + 20 * s} L ${k[0] + 4 * s} ${k[1] + 12 * s} Z`} />
            <circle cx={k[0]} cy={k[1]} r={lw(13)} />
          </g>
        );
      })()}
      {/* الذراع القريبة: كمّ مدبّب ثم سوار */}
      {chain([shN, elbow, hand], [54, 44, 34], C.sky, 0.32)}
      {(() => {
        const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1]; const d = Math.max(1, Math.hypot(dx, dy));
        const a: V2 = [hand[0] - (dx / d) * 34 * s, hand[1] - (dy / d) * 34 * s];
        return chain([a, [hand[0] - (dx / d) * 6 * s, hand[1] - (dy / d) * 6 * s]], [36, 34], C.accent, 0.2);
      })()}
      {trail}
      {/* السيف: مقبض ملفوف ثم حرس ثم نصل مقوّس بحدّ لامع */}
      {(() => {
        const t0: V2 = [hand[0] - bd[0] * 58 * s, hand[1] - bd[1] * 58 * s];
        return (
          <g>
            {p.bladeL > 0.02 && (
              <g>
                <path d={`M ${G[0] + bd[0] * 4 * s + nrm[0] * 14 * s} ${G[1] + bd[1] * 4 * s + nrm[1] * 14 * s} Q ${swordC[0] + nrm[0] * 10 * s} ${swordC[1] + nrm[1] * 10 * s} ${tip[0]} ${tip[1]} Q ${swordC[0] - nrm[0] * 6 * s} ${swordC[1] - nrm[1] * 6 * s} ${G[0] + bd[0] * 4 * s - nrm[0] * 6 * s} ${G[1] + bd[1] * 4 * s - nrm[1] * 6 * s} Z`} fill={C.line} />
                <path d={`M ${G[0] + bd[0] * 30 * s} ${G[1] + bd[1] * 30 * s} Q ${swordC[0]} ${swordC[1]} ${tip[0] - bd[0] * 20 * s} ${tip[1] - bd[1] * 20 * s}`} fill="none" stroke={C.sky} strokeWidth={lw(3)} opacity={0.55} />
              </g>
            )}
            <ellipse cx={G[0]} cy={G[1]} rx={lw(7)} ry={lw(26)} transform={`rotate(${p.blade + 90} ${G[0]} ${G[1]})`} fill={C.practical} stroke={C.line} strokeWidth={lw(3)} />
            <line x1={t0[0]} y1={t0[1]} x2={G[0] - bd[0] * 4 * s} y2={G[1] - bd[1] * 4 * s} stroke={C.line} strokeWidth={lw(24)} strokeLinecap="round" />
            <line x1={t0[0]} y1={t0[1]} x2={G[0] - bd[0] * 4 * s} y2={G[1] - bd[1] * 4 * s} stroke={C.ink} strokeWidth={lw(16)} strokeLinecap="round" />
            {[0.25, 0.5, 0.75].map((u) => {
              const c: V2 = [lerp(t0[0], G[0], u), lerp(t0[1], G[1], u)];
              return <line key={u} x1={c[0] + nrm[0] * 7 * s} y1={c[1] + nrm[1] * 7 * s} x2={c[0] - nrm[0] * 7 * s} y2={c[1] - nrm[1] * 7 * s} stroke={C.accent} strokeWidth={lw(3)} />;
            })}
          </g>
        );
      })()}
      <circle cx={hand2[0]} cy={hand2[1]} r={lw(17)} fill={C.skin} stroke={C.line} strokeWidth={lw(3)} />
      <circle cx={hand[0]} cy={hand[1]} r={lw(19)} fill={C.skin} stroke={C.line} strokeWidth={lw(3)} />
      <path d={`M ${hand[0] - 8 * s} ${hand[1] - 2 * s} q ${8 * s} ${6 * s} ${16 * s} 0`} fill="none" stroke={C.ink} strokeWidth={lw(2.5)} opacity={0.55} />
      {/* العنق ثم الرأس: وجه ثلاثة أرباع بذقن وأنف وأذن وعين، وغرّة وخصلة جانبية */}
      {chain([T(4, -200), T(10, -238)], [36, 32], C.skin, 0.28)}
      <g transform={`rotate(${rotHead} ${hc[0]} ${hc[1]})`}>
        <path d={`M ${hq(-44, -6)} Q ${hq(-50, -66)} ${hq(6, -68)} Q ${hq(60, -66)} ${hq(60, -18)} L ${hq(-30, 34)} Z`} fill={C.hair} stroke={C.line} strokeWidth={lw(5)} strokeLinejoin="round" />
        <path d={`M ${hq(-34, -8)} Q ${hq(-30, -44)} ${hq(6, -50)} Q ${hq(40, -50)} ${hq(46, -20)} L ${hq(48, -4)} L ${hq(62, 14)} L ${hq(48, 20)} Q ${hq(50, 32)} ${hq(44, 38)} Q ${hq(40, 56)} ${hq(16, 60)} Q ${hq(-14, 60)} ${hq(-32, 28)} Z`} fill={C.skin} stroke={C.line} strokeWidth={lw(4)} strokeLinejoin="round" />
        <ellipse cx={hc[0] - 6 * s} cy={hc[1] + 12 * s} rx={lw(9)} ry={lw(14)} fill={C.skin} stroke={C.line} strokeWidth={lw(3)} />
        {/* الغرّة: ثلاث خصل حادّة فوق الجبين */}
        <path d={`M ${hq(-48, 18)} Q ${hq(-60, -74)} ${hq(8, -72)} Q ${hq(60, -70)} ${hq(62, -18)} L ${hq(40, -34)} L ${hq(32, -14)} L ${hq(16, -36)} L ${hq(4, -12)} L ${hq(-10, -34)} L ${hq(-20, -8)} L ${hq(-36, 10)} Z`} fill={C.hair} />
        <path d={`M ${hq(-2, -30)} Q ${hq(-14, 20)} ${hq(2, 66)} Q ${hq(14, 24)} ${hq(16, -20)} Z`} fill={C.hair} />
        <path d={`M ${hq(-42, -56)} Q ${hq(2, -76)} ${hq(44, -52)}`} fill="none" stroke={C.moon} strokeWidth={lw(5)} strokeLinecap="round" />
        {/* العين: لوزة بيضاء وقزحية ذهبية ولمعة وجفن علوي ثقيل وحاجب مائل */}
        <path d={`M ${hq(16, 6)} Q ${hq(32, -10)} ${hq(50, -2)} Q ${hq(34, 12)} ${hq(16, 6)} Z`} fill={C.sclera} />
        <ellipse cx={hc[0] + 36 * s} cy={hc[1] + 1 * s} rx={lw(6.5)} ry={lw(8)} fill={C.iris} />
        <ellipse cx={hc[0] + 37 * s} cy={hc[1] + 1 * s} rx={lw(3)} ry={lw(5)} fill={C.hair} />
        <rect x={hc[0] + 33 * s} y={hc[1] - 4 * s} width={lw(4)} height={lw(4)} fill={C.moon} />
        <path d={`M ${hq(13, 6)} Q ${hq(32, -14)} ${hq(52, -4)}`} fill="none" stroke={C.hair} strokeWidth={lw(5.5)} strokeLinecap="round" />
        <path d={`M ${hq(18, -16)} L ${hq(52, -12)}`} stroke={C.hair} strokeWidth={lw(6)} strokeLinecap="round" />
        {detail && <path d={`M ${hq(40, 40)} L ${hq(52, 36)}`} stroke={C.ink} strokeWidth={lw(3.5)} strokeLinecap="round" />}
      </g>
    </g>
  );
};

/* ───────────── الأوضاع ───────────── */
const STAND: Pose = { crouch: 0, lean: 0, hand: [60, -36], blade: 0, bladeL: 0, scarf: 14, hairA: 12, fa: 52, ba: -52, fAng: 0, bAng: 0, head: 0 };
const PS = (o: Partial<Pose>): Pose => ({ ...STAND, ...o });

/** رسومات لقطة الحركة: [إطار البداية المحلي، الوضع] — كل رسمة تثبت حتى بداية التي بعدها (على اثنين، واللطخات إطار واحد) */
const SAKUGA: [number, Pose][] = [
  [0,  PS({ lean: -8, crouch: 26, hand: [52, -26], scarf: 34, hairA: 34, fa: 54, ba: -72, bAng: 0 })],                                                                    // ١ تمهيد: ميل للخلف وقبضة على المقبض
  [4,  PS({ lean: 10, crouch: 56, hand: [124, -10], blade: 14, bladeL: 0.4, scarf: -6, hairA: -6, fa: 90, ba: -155, bAng: 27, head: -4 })],                                 // ٢ اندفاع وبدء السلّ
  [8,  PS({ lean: 16, crouch: 64, hand: [176, -40], blade: 2, bladeL: 1, trail: [30, -22], scarf: -28, hairA: -24, fa: 102, ba: -183, bAng: 38 })],                        // لطخة ١
  [9,  PS({ lean: 16, crouch: 56, hand: [160, -90], blade: -34, bladeL: 1, trail: [-10, -58], scarf: -32, hairA: -28, fa: 98, ba: -173, bAng: 34 })],                      // لطخة ٢
  [10, PS({ lean: 10, crouch: 40, hand: [140, -150], blade: -62, bladeL: 1, scarf: -22, hairA: -18, fa: 86, ba: -146, bAng: 23 })],                                        // ٣
  [12, PS({ lean: 2, crouch: 28, hand: [96, -236], blade: -94, bladeL: 1, scarf: 0, hairA: 6, fa: 74, ba: -118, bAng: 13 })],                                              // ٤ النصل فوق الرأس
  [14, PS({ lean: -8, crouch: 22, hand: [100, -268], blade: -118, bladeL: 1, scarf: 28, hairA: 30, fa: 66, ba: -100, bAng: 5, head: 6 })],                                  // ٥ أقصى الرفع
  [16, PS({ lean: 14, crouch: 62, hand: [196, -118], blade: 12, bladeL: 1, trail: [-126, 14], scarf: -12, hairA: -8, fa: 102, ba: -183, bAng: 38 })],                      // لطخة ٣: الضربة
  [17, PS({ lean: 20, crouch: 76, hand: [222, -88], blade: 32, bladeL: 1, trail: [14, 44], scarf: -32, hairA: -28, fa: 110, ba: -201, bAng: 45 })],                        // لطخة ٤
  [18, PS({ lean: 22, crouch: 82, hand: [222, -96], blade: 14, bladeL: 1, scarf: -36, hairA: -30, fa: 112, ba: -206, bAng: 47 })],                                         // ٦ متابعة منخفضة
  [20, PS({ lean: 22, crouch: 82, hand: [218, -100], blade: 8, bladeL: 1, scarf: 4, hairA: 2, fa: 112, ba: -206, bAng: 47 })],                                              // ٧ الوشاح يلحق
];
/** بعد الضربة: يقف السيّاف من الاندفاع إلى وقفة هادئة والنصل منخفض (متابعة الحركة تُدرَّج على اثنين) */
const SETTLE: [number, Pose][] = [
  [24, PS({ lean: 20, crouch: 80, hand: [216, -102], blade: 6, bladeL: 1, scarf: 26, hairA: 22, fa: 112, ba: -206, bAng: 47 })],
  [30, PS({ lean: 20, crouch: 80, hand: [214, -100], blade: 8, bladeL: 1, scarf: 18, hairA: 14, fa: 112, ba: -206, bAng: 47 })],
  [38, PS({ lean: 12, crouch: 54, hand: [190, -76], blade: 18, bladeL: 1, scarf: 10, hairA: 6, fa: 84, ba: -128, bAng: 26, head: 4 })],
  [46, PS({ lean: 6, crouch: 30, hand: [150, -40], blade: 28, bladeL: 1, scarf: 4, hairA: 0, fa: 66, ba: -88, bAng: 10, head: 6 })],
  [53, PS({ lean: 2, crouch: 14, hand: [124, -20], blade: 34, bladeL: 1, scarf: 2, hairA: -2, fa: 56, ba: -66, bAng: 0, head: 8 })],
];

const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  crouch: lerp(a.crouch, b.crouch, t), lean: lerp(a.lean, b.lean, t),
  hand: [lerp(a.hand[0], b.hand[0], t), lerp(a.hand[1], b.hand[1], t)],
  blade: lerp(a.blade, b.blade, t), bladeL: lerp(a.bladeL, b.bladeL, t),
  scarf: lerp(a.scarf, b.scarf, t), hairA: lerp(a.hairA, b.hairA, t),
  fa: lerp(a.fa, b.fa, t), ba: lerp(a.ba, b.ba, t), fAng: lerp(a.fAng, b.fAng, t), bAng: lerp(a.bAng, b.bAng, t), head: lerp(a.head, b.head, t),
});

const poseAt = (lf: number): Pose => {
  if (lf < 24) {
    let cur = SAKUGA[0][1];
    for (const [f, p] of SAKUGA) if (lf >= f) cur = p;
    return cur;
  }
  const g = lf - (lf % 2); // على اثنين
  let i = 0;
  for (let k = 0; k < SETTLE.length - 1; k++) if (g >= SETTLE[k][0]) i = k;
  const [f0, p0] = SETTLE[i], [f1, p1] = SETTLE[Math.min(i + 1, SETTLE.length - 1)];
  return mixPose(p0, p1, f1 === f0 ? 1 : inOut(clamp01((g - f0) / (f1 - f0))));
};

/* ───────────── اللقطة ١: تمهيد واسع ───────────── */
const Establish: React.FC<{ lf: number }> = ({ lf }) => {
  const z = 1 + 0.06 * inOut(clamp01(lf / (SHOT.establish[1] - SHOT.establish[0])));
  // ثلاث رسمات فقط للوشاح والشعر، كل رسمة تثبت اثني عشر إطاراً
  const sway = [[14, 12], [28, 24], [6, 2]][Math.min(2, Math.floor(lf / 12))];
  const pose: Pose = { ...STAND, scarf: sway[0], hairA: sway[1] };
  return (
    <g transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-W / 2} ${-H / 2})`}>
      <Sky moon={{ x: 1380, y: 280, r: 150 }} far farY={700} />
      <Rain f={lf} k={0.45} w={2} />
      {/* السطح: كتلة سوداء وخزّان ماء وهوائي، ثم الشخصية الصغيرة */}
      <polygon points={`0,${H} 0,820 520,820 520,800 1120,800 1120,830 ${W},830 ${W},${H}`} fill={C.ink} />
      <rect x={1380} y={690} width={150} height={140} fill={C.ink} />
      <polygon points="1370,690 1455,630 1540,690" fill={C.ink} />
      <line x1={1760} y1={830} x2={1760} y2={560} stroke={C.ink} strokeWidth={8} />
      <line x1={1730} y1={600} x2={1790} y2={600} stroke={C.ink} strokeWidth={6} />
      <line x1={0} y1={822} x2={520} y2={822} stroke={C.line} strokeWidth={3} opacity={0.55} />
      <Figure p={pose} x={640} ground={806} s={0.46} />
      <Rain f={lf + 3} k={0.25} w={3.2} />
    </g>
  );
};

/* ───────────── اللقطة ٢: لقطة الحركة (الكاميرا ثابتة) ───────────── */
const SakugaShot: React.FC<{ lf: number }> = ({ lf }) => {
  const pose = poseAt(lf);
  const fast = (lf >= 8 && lf <= 11) || (lf >= 16 && lf <= 18);
  return (
    <g>
      <Sky moon={{ x: 1330, y: 330, r: 230 }} />
      <Rain f={lf} k={0.5} w={2.2} />
      <polygon points={`0,${H} 0,930 ${W},930 ${W},${H}`} fill={C.ink} />
      <line x1={0} y1={932} x2={W} y2={932} stroke={C.line} strokeWidth={3} opacity={0.5} />
      {/* ظلّ على الأرض */}
      <ellipse cx={760 + (pose.fa + pose.ba) * 0.6} cy={940} rx={(Math.abs(pose.fa) + Math.abs(pose.ba)) * 0.7 + 130} ry={16} fill={C.sky} opacity={0.35} />
      <Figure p={pose} x={760} ground={935} s={1.2} detail />
      {fast && (
        <g stroke={C.line} strokeWidth={4} strokeLinecap="round" opacity={0.85}>
          <line x1={80} y1={300} x2={700} y2={300} /><line x1={160} y1={420} x2={620} y2={420} /><line x1={40} y1={560} x2={540} y2={560} />
          <line x1={1280} y1={250} x2={1880} y2={250} /><line x1={1380} y1={640} x2={1900} y2={640} />
        </g>
      )}
      <Rain f={lf + 5} k={0.35} w={3.4} />
    </g>
  );
};

/* ───────────── اللقطة ٣: لقطة الختام (عينان قريبتان جداً) ───────────── */
/** عين يمنى مرسومة نحو اليمين؛ اليسرى تُعكس بتحويل أفقي */
const Eye: React.FC<{ cx: number; cy: number; w: number; open: number; flip?: boolean; glint?: number; id: string }> = ({ cx, cy, w, open, flip, glint, id }) => {
  const h = w * 0.3 * open;
  const inner: [number, number] = [cx - w / 2, cy + 16], outer: [number, number] = [cx + w / 2, cy - 20];
  const up: [number, number] = [cx + w * 0.02, cy - h * 2.0 - 12], lo: [number, number] = [cx + w * 0.06, cy + h * 0.9 + 8];
  const almond = `M ${inner[0]} ${inner[1]} Q ${up[0]} ${up[1]} ${outer[0]} ${outer[1]} Q ${lo[0]} ${lo[1]} ${inner[0]} ${inner[1]} Z`;
  const rI = w * 0.2, ix = cx + w * 0.05, iy = cy - h * 0.15;
  return (
    <g transform={flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      <defs><clipPath id={id}><path d={almond} /></clipPath></defs>
      {/* ثنية الجفن وحاجب ثقيل مائل نحو الأنف */}
      <path d={`M ${inner[0] + 16} ${inner[1] - 34} Q ${up[0]} ${up[1] - 14} ${outer[0] - 8} ${outer[1] - 34}`} fill="none" stroke={C.hair} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
      <polygon points={`${cx - w * 0.6},${cy - h - 52} ${cx + w * 0.25},${cy - h - 84} ${cx + w * 0.72},${cy - h - 66} ${cx + w * 0.3},${cy - h - 46} ${cx - w * 0.58},${cy - h - 20}`} fill={C.hair} />
      <path d={almond} fill={C.sclera} />
      <g clipPath={`url(#${id})`}>
        <ellipse cx={ix} cy={iy} rx={rI} ry={rI * 1.3} fill={C.iris} />
        <ellipse cx={ix} cy={iy + rI * 0.62} rx={rI * 0.78} ry={rI * 0.6} fill={C.practical} opacity={0.75} />
        <ellipse cx={ix} cy={iy} rx={rI} ry={rI * 1.3} fill="none" stroke={C.hair} strokeWidth={9} />
        <ellipse cx={ix + 2} cy={iy + 4} rx={rI * 0.42} ry={rI * 0.66} fill={C.hair} />
        <rect x={ix - rI * 0.62} y={iy - rI * 0.95} width={rI * 0.42} height={rI * 0.5} rx={8} fill={C.moon} />
        <circle cx={ix + rI * 0.42} cy={iy + rI * 0.55} r={rI * 0.15} fill={C.moon} />
        {/* ظلّ الجفن العلوي على المقلة */}
        <path d={`M ${inner[0]} ${inner[1] - h * 1.4} L ${outer[0]} ${outer[1] - h * 1.6} L ${outer[0]} ${outer[1] + h * 0.1} Q ${up[0]} ${cy - h * 0.95} ${inner[0]} ${inner[1] + 2} Z`} fill={C.ink} opacity={0.3} />
        {glint !== undefined && (
          <polygon points={`${cx - w * 0.6 + glint * w * 1.3},${cy - h * 2.4} ${cx - w * 0.48 + glint * w * 1.3},${cy - h * 2.4} ${cx - w * 0.34 + glint * w * 1.3},${cy + h * 1.6} ${cx - w * 0.48 + glint * w * 1.3},${cy + h * 1.6}`} fill={C.practical} />
        )}
      </g>
      {/* الجفن العلوي ثقيل بنهاية مطوية للخارج وثلاث رموش، والسفلي رقيق */}
      <path d={`M ${inner[0] - 6} ${inner[1] + 4} Q ${up[0]} ${up[1] - 6} ${outer[0] + 4} ${outer[1] + 2}`} fill="none" stroke={C.hair} strokeWidth={17} strokeLinecap="round" />
      <path d={`M ${outer[0]} ${outer[1]} L ${outer[0] + 52} ${outer[1] - 26}`} stroke={C.hair} strokeWidth={9} strokeLinecap="round" />
      {[0.55, 0.7, 0.84].map((u) => {
        const px = lerp(inner[0], outer[0], u), py = lerp(inner[1], outer[1], u) - h * 1.2 * Math.sin(Math.PI * u) - 8;
        return <path key={u} d={`M ${px} ${py} l ${14 + u * 12} ${-22}`} stroke={C.hair} strokeWidth={6} strokeLinecap="round" />;
      })}
      <path d={`M ${inner[0] + 14} ${inner[1] + 8} Q ${lo[0]} ${lo[1] + 6} ${outer[0] - 12} ${outer[1] + 4}`} fill="none" stroke={C.hair} strokeWidth={4} strokeLinecap="round" opacity={0.75} />
      <path d={`M ${inner[0] + 40} ${inner[1] + 40} Q ${lo[0]} ${lo[1] + 44} ${outer[0] - 60} ${outer[1] + 40}`} fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.18} />
    </g>
  );
};

const Button: React.FC<{ lf: number }> = ({ lf }) => {
  // ثلاث رسمات: عينان مفتوحتان، ثم تضيّقان مع لمعة نصل تعبر القزحية، ثم السكون
  const d = lf < 8 ? 0 : lf < 18 ? 1 : 2;
  const open = [1, 0.8, 0.66][d];
  const glint = d === 1 ? (lf - 8) / 10 : undefined;
  const FACE = "M 300 120 Q 226 520 330 820 Q 440 1040 740 1110 L 1180 1110 Q 1480 1040 1590 820 Q 1694 520 1620 120 Z";
  return (
    <g>
      {/* الخلفية: ليل بتدرّج، ومن خلف الوجه كتلة الشعر على الجانبين */}
      <defs>
        <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sky} /><stop offset="1" stopColor={C.ink} /></linearGradient>
        <clipPath id="faceclip"><path d={FACE} /></clipPath>
      </defs>
      <rect width={W} height={H} fill="url(#bk)" />
      <Rain f={lf + 9} k={0.35} w={2.2} />
      {/* الوجه: شكل مرسوم بحدّ، لا مساحة مسطّحة */}
      <path d={FACE} fill={C.skin} />
      <g clipPath="url(#faceclip)">
        {/* ظلّ الغرّة المسنّن على الجبين والصدغين */}
        <polygon points={`200,300 330,420 440,340 560,450 700,360 820,470 960,370 1100,470 1230,360 1370,450 1490,340 1600,420 1720,300 1720,160 200,160`} fill={C.ink} opacity={0.22} />
        {/* تجويف العينين: ظلّ ناعم الحافة القاسية أعلى كل عين */}
        <path d={`M 360 430 Q 650 380 930 450 L 930 520 Q 650 470 360 520 Z`} fill={C.ink} opacity={0.1} />
        <path d={`M 1000 450 Q 1280 380 1560 430 L 1560 520 Q 1280 470 1000 520 Z`} fill={C.ink} opacity={0.1} />
        {/* جسر الأنف: ضلع مظلّم وحدّ مضيء من جهة القمر */}
        <polygon points={`926,300 1004,300 1030,720 886,760`} fill={C.ink} opacity={0.15} />
        <polygon points={`1004,300 1022,300 1052,712 1030,720`} fill={C.moon} opacity={0.22} />
        {/* الوجنتان: ظلّ سفلي وخطوط احمرار قصيرة تحت العينين */}
        <path d={`M 300 860 Q 520 980 740 1010 L 740 1110 L 300 1110 Z`} fill={C.ink} opacity={0.14} />
        <path d={`M 1620 860 Q 1400 980 1180 1010 L 1180 1110 L 1620 1110 Z`} fill={C.ink} opacity={0.14} />
        {[[470, 700], [520, 712], [570, 720], [1330, 720], [1380, 712], [1430, 700]].map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2={x + 22} y2={y - 34} stroke={C.accent} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        ))}
        {/* الأنف من أسفل: طرف وفتحتان وظلّ تحته */}
        <path d={`M 884 828 Q 920 872 962 866 Q 1004 872 1040 828`} fill="none" stroke={C.hair} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <path d={`M 892 836 Q 900 858 928 858 Q 934 842 912 832 Z`} fill={C.hair} opacity={0.5} />
        <path d={`M 1032 836 Q 1024 858 996 858 Q 990 842 1012 832 Z`} fill={C.hair} opacity={0.5} />
        <path d={`M 906 790 Q 962 760 1018 790 L 1018 826 Q 962 800 906 826 Z`} fill={C.ink} opacity={0.08} />
        <circle cx={962} cy={812} r={9} fill={C.moon} opacity={0.5} />
        <ellipse cx={962} cy={910} rx={150} ry={26} fill={C.ink} opacity={0.2} />
      </g>
      {/* حدّ الوجه ولمعة القمر على جانبه الأيمن */}
      <path d={FACE} fill="none" stroke={C.hair} strokeWidth={6} />
      <path d={`M 1620 160 Q 1694 520 1590 820`} fill="none" stroke={C.moon} strokeWidth={9} strokeLinecap="round" opacity={0.45} />
      <Eye id="eyeL" cx={650} cy={590} w={480} open={open} flip glint={glint} />
      <Eye id="eyeR" cx={1270} cy={596} w={460} open={open} glint={glint !== undefined ? Math.max(0, glint - 0.05) : undefined} />
      {/* الغرّة: كتلة حادّة وخصلتان جانبيتان تحيطان بالوجه، وشريحة لمعان */}
      <polygon points={`0,0 ${W},0 ${W},250 1800,320 1700,250 1560,340 1430,250 1290,350 1150,246 1010,354 880,244 740,350 600,250 460,346 320,250 190,330 90,260 0,320`} fill={C.hair} />
      {[
        "M 236 180 Q 170 520 262 850 Q 270 930 300 990 Q 330 700 350 300 Z",
        "M 330 280 Q 296 560 330 760 Q 336 820 360 880 Q 392 620 392 330 Z",
        "M 150 120 Q 90 420 160 700 Q 170 760 190 800 Q 230 540 250 200 Z",
      ].map((d2, i) => <path key={"l" + i} d={d2} fill={C.hair} />)}
      {[
        "M 1684 180 Q 1750 520 1658 850 Q 1650 930 1620 990 Q 1590 700 1570 300 Z",
        "M 1590 280 Q 1624 560 1590 760 Q 1584 820 1560 880 Q 1528 620 1528 330 Z",
        "M 1770 120 Q 1830 420 1760 700 Q 1750 760 1730 800 Q 1690 540 1670 200 Z",
      ].map((d2, i) => <path key={"r" + i} d={d2} fill={C.hair} />)}
      <path d={`M 120 100 Q 800 36 1800 130`} fill="none" stroke={C.moon} strokeWidth={10} strokeLinecap="round" opacity={0.9} />
      <path d={`M 292 420 Q 270 600 318 790`} fill="none" stroke={C.moon} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
    </g>
  );
};

/* ───────────── التركيب ───────────── */
const ANIME_BARS = 70; // شريط سينمائي علوي وسفلي من اللقطة كلها

export const AnimeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = frame < SHOT.sakuga[0] ? "establish" : frame < SHOT.button[0] ? "sakuga" : "button";
  const lf = frame - SHOT[shot][0];

  // غمسة اللون: تعلو قبل القطع بستة إطارات (power2.in) وتهبط بعده بثمانية (power2.out)؛ ما قبل القطع ما يزال مرسوماً كاملاً تحتها
  let dip = 0, dipColor: string = C.ink;
  for (const c of CUTS) {
    if (frame >= c.at - 6 && frame <= c.at) { dip = Math.pow(clamp01((frame - (c.at - 6)) / 6), 2); dipColor = c.color; }
    else if (frame > c.at && frame <= c.at + 9) { dip = Math.pow(1 - clamp01((frame - (c.at + 1)) / 8), 2); dipColor = c.color; }
  }
  const out = clamp01((frame - (ANIME_FRAMES - 8)) / 8); // آخر ثمانية إطارات إلى الحبر: الخروج الوحيد على مستوى المشهد

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {shot === "establish" && <Establish lf={lf} />}
        {shot === "sakuga" && <SakugaShot lf={lf} />}
        {shot === "button" && <Button lf={lf} />}
        <rect y={0} width={W} height={ANIME_BARS} fill={C.ink} />
        <rect y={H - ANIME_BARS} width={W} height={ANIME_BARS} fill={C.ink} />
        <rect width={W} height={H} fill={dipColor} opacity={dip} />
        <rect width={W} height={H} fill={C.ink} opacity={out} />
      </svg>
    </AbsoluteFill>
  );
};
