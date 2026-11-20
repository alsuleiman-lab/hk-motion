import React from "react";

/**
 * محارب جانبي مسطّح (تجربة أنمي بالكود، 2026-11-20): كل الرؤوس مغطّاة بخوذة ولثام فلا وجوه.
 * هندسة الجسم تُحسب في دالة صرفة (solve) فيستعملها الرسم ويستعملها المخرج لتحديد مواضع الشرر والتماس.
 * الاتجاه المحلي: الأمام = +x؛ والمحارب الذي يواجه اليسار يُعكس بتحويل أفقي.
 */
export type V2 = [number, number];
export type Pose = {
  crouch: number; lean: number;                    // نزول الورك وميل الجذع (درجات، + للأمام)
  hand: V2; blade: number; bladeL: number;         // يد السيف داخل إطار الجذع، وزاوية النصل (٠ أمام، −٩٠ أعلى)، وطوله ٠..١
  sh: V2; shA: number; shield: number;             // يد الدرع، وميل الدرع، وظهوره ٠..١
  cloak: number;                                   // ميل الرداء واللثام
  fa: number; ba: number; fAng: number; bAng: number; // كاحلا الرجلين أفقياً عن الورك وزاويتا الحذاءين
  lf: number; lb: number;                          // رفع الكاحلين عن الأرض (للمشي)
  head: number;
  trail?: V2;                                      // قوس لطخة النصل بين زاويتين
};
export const STAND: Pose = {
  crouch: 0, lean: 0, hand: [60, -40], blade: -90, bladeL: 0, sh: [40, -60], shA: 0, shield: 0, cloak: 14,
  fa: 40, ba: -40, fAng: 0, bAng: 0, lf: 0, lb: 0, head: 0,
};
export type Costume = {
  kind: "muslim" | "kafir"; line: string; cloth: string; cloth2: string; trouser: string; boot: string; sash: string;
  mail: string; helm: string; helmTrim: string; veil: string; plume: string; cape: string; shield: string; boss: string; skin: string; steel: string; build: number;
  turban?: boolean;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number) => [Math.cos(rad(a)), Math.sin(rad(a))] as const;
/** تفتيح (k>0) أو تغميق (k<0) لون سداسي */
const tone = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
  return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
};

const BOOT: V2[] = [[-22, -6], [24, -6], [26, 26], [48, 38], [80, 46], [88, 54], [84, 58], [-26, 58], [-30, 44], [-26, 20]];
const rotP = (p: V2, deg: number): V2 => { const r = rad(deg); return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)]; };
const ankleH = (deg: number) => Math.max(...BOOT.map((p) => rotP(p, deg)[1]));

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

export const SWORD_LEN = 400;

export type Geo = {
  hipG: V2; T: (px: number, py: number) => V2; hand: V2; elbow: V2; hand2: V2; elbow2: V2; shN: V2; shF: V2;
  aF: V2; aB: V2; kF: V2; kB: V2; hc: V2; neck: V2; bd: readonly [number, number]; nrm: V2; G: V2; tip: V2; shC: V2;
};

export const solve = (p: Pose, x: number, ground: number, s: number): Geo => {
  const L1 = 124 * s, L2 = 124 * s;
  const cl = Math.cos(rad(p.lean)), sl = Math.sin(rad(p.lean));
  const hF = (ankleH(p.fAng) + p.lf) * s, hB = (ankleH(p.bAng) + p.lb) * s;
  const dxF = p.fa * s, dxB = p.ba * s; const reach = L1 + L2 - 1;
  const hipH = Math.min((296 - p.crouch) * s, hF + Math.sqrt(Math.max(0, reach * reach - dxF * dxF)), hB + Math.sqrt(Math.max(0, reach * reach - dxB * dxB)));
  const hipG: V2 = [x, ground - hipH];
  const T = (px: number, py: number): V2 => [hipG[0] + (px * cl - py * sl) * s, hipG[1] + (px * sl + py * cl) * s];
  const aF: V2 = [x + dxF, ground - hF], aB: V2 = [x + dxB, ground - hB];
  const kF = ik(hipG, aF, L1, L2, "fwd"), kB = ik(hipG, aB, L1, L2, "fwd");
  const shN = T(10, -186), shF = T(-6, -190);
  const A1 = 140 * s, A2 = 130 * s;
  const hand = reachTo(shN, T(p.hand[0], p.hand[1]), A1 + A2 - 2);
  const elbow = ik(shN, hand, A1, A2, "down");
  const hand2 = reachTo(shF, T(p.sh[0], p.sh[1]), A1 + A2 - 2);
  const elbow2 = ik(shF, hand2, A1, A2, "down");
  const bd = dir(p.blade); const nrm: V2 = [-bd[1], bd[0]];
  const G: V2 = [hand[0] + bd[0] * 40 * s, hand[1] + bd[1] * 40 * s];
  const tip: V2 = [G[0] + bd[0] * SWORD_LEN * s * p.bladeL, G[1] + bd[1] * SWORD_LEN * s * p.bladeL];
  return { hipG, T, hand, elbow, hand2, elbow2, shN, shF, aF, aB, kF, kB, hc: T(18, -284), neck: T(4, -212), bd, nrm, G, tip, shC: [hand2[0] + 30 * s, hand2[1] - 10 * s] };
};

type Props = { p: Pose; x: number; ground: number; s: number; co: Costume; weapon?: "sword" | "spear" | "none"; lite?: boolean };

export const Warrior: React.FC<Props> = ({ p, x, ground, s, co, weapon = "sword", lite }) => {
  const g = solve(p, x, ground, s);
  const { T, hipG, hand, elbow, hand2, elbow2, shN, shF, aF, aB, kF, kB, hc, bd, nrm, G, tip } = g;
  const lw = (n: number) => n * s;
  const bw = co.build;
  const q = (px: number, py: number) => T(px * bw, py).join(" ");
  const SW = lite ? 5 : 6;
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const GR = { cl: `url(#${uid}cl)`, tr: `url(#${uid}tr)`, cp: `url(#${uid}cp)`, hm: `url(#${uid}hm)`, sh: `url(#${uid}sh)`, st: `url(#${uid}st)` };

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
        shades.push(<polygon key={"s" + i} points={`${a[0] + sg * nx * wa / 2},${a[1] + sg * ny * wa / 2} ${b[0] + sg * nx * wb / 2},${b[1] + sg * ny * wb / 2} ${b[0] + sg * nx * wb * 0.06},${b[1] + sg * ny * wb * 0.06} ${a[0] + sg * nx * wa * 0.06},${a[1] + sg * ny * wa * 0.06}`} />);
      }
    }
    return (
      <g>
        <g fill={co.line} stroke={co.line} strokeWidth={lw(7)} strokeLinejoin="round">{outl}</g>
        <g fill={fill}>{fills}</g>
        <g fill="#000" opacity={shadeOp}>{shades}</g>
      </g>
    );
  };
  const boot = (a: V2, ang: number) => {
    const P = BOOT.map((b) => { const r = rotP(b, ang); return `${a[0] + r[0] * s},${a[1] + r[1] * s}`; }).join(" ");
    const s1 = rotP([-24, 14], ang), s2 = rotP([26, 14], ang), s3 = rotP([-26, 34], ang), s4 = rotP([30, 34], ang);
    return (
      <g>
        <polygon points={P} fill={co.boot} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
        <line x1={a[0] + s1[0] * s} y1={a[1] + s1[1] * s} x2={a[0] + s2[0] * s} y2={a[1] + s2[1] * s} stroke={co.line} strokeWidth={lw(3.2)} opacity={0.6} />
        <line x1={a[0] + s3[0] * s} y1={a[1] + s3[1] * s} x2={a[0] + s4[0] * s} y2={a[1] + s4[1] * s} stroke={co.line} strokeWidth={lw(3.2)} opacity={0.6} />
        <path d={`M ${a[0] + s2[0] * s} ${a[1] + s2[1] * s + 6 * s} l ${24 * s} ${10 * s}`} fill="none" stroke="#fff" strokeWidth={lw(3)} opacity={0.28} strokeLinecap="round" />
      </g>
    );
  };

  /* الرداء خلف الجسم: يتبع ميل cloak */
  const cr = rad(p.cloak);
  const shO = T(-30 * bw, -196);
  const capeEnd: V2 = [shO[0] - Math.cos(cr) * 250 * s, shO[1] + 250 * s + Math.sin(cr) * 120 * s];
  const capeMid: V2 = [shO[0] - Math.cos(cr) * 120 * s, shO[1] + 90 * s + Math.sin(cr) * 30 * s];

  /* الرأس: خوذة ولثام، بلا وجه */
  const hs = s * 1.08;
  const hq = (px: number, py: number) => `${hc[0] + px * hs} ${hc[1] + py * hs}`;
  const tail2: V2 = [hc[0] - (36 + 34 * Math.cos(cr)) * s, hc[1] + (58 + 26 * Math.sin(cr)) * s];
  const tailEnd: V2 = [hc[0] - Math.cos(cr) * 200 * s, hc[1] + 20 * s + Math.sin(cr) * 120 * s];
  const head = co.kind === "muslim" ? (
    <g transform={`rotate(${p.head + p.lean * 0.4} ${hc[0]} ${hc[1]})`}>
      {/* ذيل اللثام: شريط قصير يتأرجح خلف العنق */}
      <path d={`M ${hq(-30, -2)} Q ${(hc[0] + tail2[0]) / 2} ${(hc[1] + tail2[1]) / 2 - 20 * s} ${tail2[0]} ${tail2[1]} Q ${(hc[0] + tail2[0]) / 2 + 10 * s} ${(hc[1] + tail2[1]) / 2 + 24 * s} ${hq(-26, 34)} Z`} fill={co.cloth2} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
      <circle cx={hc[0]} cy={hc[1]} r={48 * hs} fill={co.helm} stroke={co.line} strokeWidth={lw(SW)} />
      {/* اللثام يغطي أسفل الوجه تحت شقّ العينين */}
      <path d={`M ${hq(-34, 6)} L ${hq(52, 8)} Q ${hq(58, 40)} ${hq(28, 56)} Q ${hq(-14, 62)} ${hq(-38, 30)} Z`} fill={co.veil} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
      <path d={`M ${hq(-20, 30)} Q ${hq(14, 44)} ${hq(46, 30)}`} fill="none" stroke={co.line} strokeWidth={lw(2.4)} opacity={0.4} />
      {/* قبّة الخوذة وغطاء الأذنين */}
      <path d={`M ${hq(-50, 22)} Q ${hq(-58, -62)} ${hq(0, -72)} Q ${hq(54, -68)} ${hq(50, -8)} L ${hq(12, -8)} Q ${hq(-8, 4)} ${hq(-22, 22)} Z`} fill={GR.hm} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      {co.turban ? (
        <g>
          <path d={`M ${hq(-52, 6)} Q ${hq(-62, -34)} ${hq(-10, -54)} Q ${hq(42, -60)} ${hq(54, -12)} Q ${hq(20, -26)} ${hq(-52, 6)} Z`} fill={co.helmTrim} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
          {[-34, -16, 2, 20].map((k) => <path key={k} d={`M ${hq(k, -22)} Q ${hq(k + 10, -40)} ${hq(k + 4, -58)}`} fill="none" stroke={co.line} strokeWidth={lw(2.6)} opacity={0.5} />)}
        </g>
      ) : <path d={`M ${hq(-48, 2)} Q ${hq(20, -22)} ${hq(50, -12)}`} fill="none" stroke={co.helmTrim} strokeWidth={lw(8)} />}
      <path d={`M ${hq(2, -72)} L ${hq(2, -92)}`} stroke={co.line} strokeWidth={lw(5)} strokeLinecap="round" />
      <path d={`M ${hq(-34, -52)} Q ${hq(0, -70)} ${hq(32, -56)}`} fill="none" stroke="#fff" strokeWidth={lw(4)} strokeLinecap="round" opacity={0.55} />
      {/* العينان العربيتان الرجوليتان بين العمامة واللثام: جلد، حاجب كثيف مائل، عين غائرة بقزحية بنّية داكنة */}
      <path d={`M ${hq(6, -9)} Q ${hq(28, -20)} ${hq(52, -9)} L ${hq(52, 9)} Q ${hq(28, 14)} ${hq(6, 9)} Z`} fill={co.skin} />
      <path d={`M ${hq(8, -4)} Q ${hq(28, -14)} ${hq(50, -5)} Q ${hq(30, 7)} ${hq(8, -4)} Z`} fill="#f4efe6" />
      <ellipse cx={hc[0] + 33 * hs} cy={hc[1] - 3 * hs} rx={5.4 * hs} ry={5.8 * hs} fill="#3a2214" />
      <circle cx={hc[0] + 34 * hs} cy={hc[1] - 3 * hs} r={2.4 * hs} fill={co.line} />
      <circle cx={hc[0] + 31.5 * hs} cy={hc[1] - 5.2 * hs} r={1.3 * hs} fill="#ffffff" />
      <path d={`M ${hq(6, -3)} Q ${hq(28, -16)} ${hq(52, -6)}`} fill="none" stroke={co.line} strokeWidth={lw(4.6)} strokeLinecap="round" />
      <path d={`M ${hq(2, -13)} L ${hq(54, -19)} L ${hq(53, -11)} L ${hq(8, -7)} Z`} fill={co.line} />
      <path d={`M ${hq(14, 8)} Q ${hq(30, 12)} ${hq(46, 6)}`} fill="none" stroke={co.line} strokeWidth={lw(2.2)} opacity={0.5} />
      </g>
  ) : (
    <g transform={`rotate(${p.head + p.lean * 0.4} ${hc[0]} ${hc[1]})`}>
      {/* عرف أحمر يطير للخلف ثم قلنسوة حلقات ثم خوذة حديدية بوجه كامل */}
      <path d={`M ${hq(-6, -66)} Q ${hq(-70, -110)} ${tailEnd[0]} ${tailEnd[1] - 40 * s} Q ${hq(-60, -50)} ${hq(-18, -50)} Z`} fill={co.plume} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
      <path d={`M ${hq(-48, -6)} Q ${hq(-62, 40)} ${hq(-30, 70)} L ${hq(24, 66)} L ${hq(8, 20)} Z`} fill={co.mail} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      <path d={`M ${hq(-50, 8)} Q ${hq(-56, -64)} ${hq(2, -76)} Q ${hq(56, -72)} ${hq(54, -6)} L ${hq(52, 22)} Q ${hq(54, 54)} ${hq(24, 66)} Q ${hq(-6, 60)} ${hq(-26, 34)} Q ${hq(-40, 24)} ${hq(-50, 8)} Z`} fill={GR.hm} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      <path d={`M ${hq(2, -76)} L ${hq(8, 60)}`} stroke={co.line} strokeWidth={lw(3.2)} opacity={0.55} />
      <path d={`M ${hq(-48, -22)} Q ${hq(2, -34)} ${hq(54, -22)}`} fill="none" stroke={co.helmTrim} strokeWidth={lw(8)} />
      <rect x={hc[0] + 12 * hs} y={hc[1] - 8 * hs} width={42 * hs} height={9 * hs} rx={3 * hs} fill={co.line} />
      {[22, 32, 42].map((k) => <line key={k} x1={hc[0] + k * hs} y1={hc[1] + 30 * hs} x2={hc[0] + (k + 6) * hs} y2={hc[1] + 30 * hs} stroke={co.line} strokeWidth={lw(3)} />)}
      {[-26, -4, 22].map((k) => <circle key={k} cx={hc[0] + k * hs} cy={hc[1] - 36 * hs} r={3.2 * hs} fill={co.helmTrim} />)}
      <path d={`M ${hq(-30, -58)} Q ${hq(2, -72)} ${hq(34, -58)}`} fill="none" stroke="#fff" strokeWidth={lw(4)} strokeLinecap="round" opacity={0.45} />
    </g>
  );

  /* السلاح */
  const sword = weapon === "sword" && p.bladeL > 0.02 && (
    <g>
      <path d={`M ${G[0] + bd[0] * 4 * s + nrm[0] * 14 * s} ${G[1] + bd[1] * 4 * s + nrm[1] * 14 * s} Q ${(G[0] + tip[0]) / 2 - nrm[0] * 12 * s + nrm[0] * 8 * s} ${(G[1] + tip[1]) / 2 - nrm[1] * 12 * s + nrm[1] * 8 * s} ${tip[0]} ${tip[1]} Q ${(G[0] + tip[0]) / 2 - nrm[0] * 12 * s - nrm[0] * 6 * s} ${(G[1] + tip[1]) / 2 - nrm[1] * 12 * s - nrm[1] * 6 * s} ${G[0] + bd[0] * 4 * s - nrm[0] * 6 * s} ${G[1] + bd[1] * 4 * s - nrm[1] * 6 * s} Z`} fill={GR.st} stroke={co.line} strokeWidth={lw(3)} strokeLinejoin="round" />
      <path d={`M ${G[0] + bd[0] * 30 * s} ${G[1] + bd[1] * 30 * s} L ${tip[0] - bd[0] * 26 * s} ${tip[1] - bd[1] * 26 * s}`} stroke="#ffffff" strokeWidth={lw(3)} opacity={0.75} />
    </g>
  );
  const hilt = weapon === "sword" && (() => {
    const t0: V2 = [hand[0] - bd[0] * 56 * s, hand[1] - bd[1] * 56 * s];
    return (
      <g>
        <ellipse cx={G[0]} cy={G[1]} rx={lw(7)} ry={lw(26)} transform={`rotate(${p.blade + 90} ${G[0]} ${G[1]})`} fill={co.boss} stroke={co.line} strokeWidth={lw(3)} />
        <line x1={t0[0]} y1={t0[1]} x2={G[0] - bd[0] * 4 * s} y2={G[1] - bd[1] * 4 * s} stroke={co.line} strokeWidth={lw(22)} strokeLinecap="round" />
        <line x1={t0[0]} y1={t0[1]} x2={G[0] - bd[0] * 4 * s} y2={G[1] - bd[1] * 4 * s} stroke={co.sash} strokeWidth={lw(14)} strokeLinecap="round" />
      </g>
    );
  })();
  const spear = weapon === "spear" && (() => {
    const b0: V2 = [hand[0] - bd[0] * 160 * s, hand[1] - bd[1] * 160 * s], b1: V2 = [hand[0] + bd[0] * 560 * s, hand[1] + bd[1] * 560 * s];
    const nrm2: V2 = [-bd[1], bd[0]];
    const t2: V2 = [b1[0] + bd[0] * 90 * s, b1[1] + bd[1] * 90 * s];
    return (
      <g>
        <line x1={b0[0]} y1={b0[1]} x2={b1[0]} y2={b1[1]} stroke={co.line} strokeWidth={lw(12)} strokeLinecap="round" />
        <line x1={b0[0]} y1={b0[1]} x2={b1[0]} y2={b1[1]} stroke={co.cape} strokeWidth={lw(6)} strokeLinecap="round" />
        <polygon points={`${b1[0] + nrm2[0] * 14 * s},${b1[1] + nrm2[1] * 14 * s} ${t2[0]},${t2[1]} ${b1[0] - nrm2[0] * 14 * s},${b1[1] - nrm2[1] * 14 * s}`} fill={co.steel} stroke={co.line} strokeWidth={lw(3)} strokeLinejoin="round" />
      </g>
    );
  })();

  /* لطخة النصل */
  let trail: React.ReactNode = null;
  if (p.trail && weapon === "sword") {
    const [t0, t1] = p.trail; const N = 10; const R = (SWORD_LEN + 40) * s; const wmax = 110 * s;
    const outer: string[] = [], inner: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; const dd = dir(lerp(t0, t1, u)); const w = wmax * Math.pow(u, 1.3);
      outer.push(`${hand[0] + dd[0] * R},${hand[1] + dd[1] * R}`);
      inner.push(`${hand[0] + dd[0] * (R - w)},${hand[1] + dd[1] * (R - w)}`);
    }
    trail = <polygon points={[...outer, ...inner.reverse()].join(" ")} fill="#fff6d8" opacity={0.75} />;
  }

  /* الدرع: قرص مائل مرئي بحافة ودرّة وحلقة زخرفية */
  const shC = g.shC; const sa = p.shA;
  const shield = p.shield > 0.02 && (
    <g transform={`rotate(${sa} ${shC[0]} ${shC[1]}) translate(${shC[0]} ${shC[1]}) scale(${p.shield} 1) translate(${-shC[0]} ${-shC[1]})`}>
      <ellipse cx={shC[0]} cy={shC[1]} rx={lw(44)} ry={lw(112)} fill={GR.sh} stroke={co.line} strokeWidth={lw(7)} />
      <ellipse cx={shC[0]} cy={shC[1]} rx={lw(30)} ry={lw(84)} fill="none" stroke={co.boss} strokeWidth={lw(5)} />
      <ellipse cx={shC[0] + lw(6)} cy={shC[1]} rx={lw(15)} ry={lw(22)} fill={co.boss} stroke={co.line} strokeWidth={lw(4)} />
      <path d={`M ${shC[0] - lw(30)} ${shC[1] - lw(60)} Q ${shC[0] - lw(8)} ${shC[1] - lw(96)} ${shC[0] + lw(22)} ${shC[1] - lw(80)}`} fill="none" stroke="#ffffff" strokeWidth={lw(4)} opacity={0.4} strokeLinecap="round" />
    </g>
  );

  return (
    <g>
      <defs>
        <linearGradient id={uid + "cl"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={tone(co.cloth, 0.2)} /><stop offset="0.55" stopColor={co.cloth} /><stop offset="1" stopColor={tone(co.cloth, -0.26)} /></linearGradient>
        <linearGradient id={uid + "tr"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tone(co.trouser, 0.16)} /><stop offset="1" stopColor={tone(co.trouser, -0.3)} /></linearGradient>
        <linearGradient id={uid + "cp"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={tone(co.cape, 0.22)} /><stop offset="1" stopColor={tone(co.cape, -0.34)} /></linearGradient>
        <radialGradient id={uid + "hm"} cx="0.35" cy="0.3" r="0.85"><stop offset="0" stopColor={tone(co.helm, 0.5)} /><stop offset="0.5" stopColor={co.helm} /><stop offset="1" stopColor={tone(co.helm, -0.4)} /></radialGradient>
        <radialGradient id={uid + "sh"} cx="0.38" cy="0.34" r="0.8"><stop offset="0" stopColor={tone(co.shield, 0.35)} /><stop offset="0.55" stopColor={co.shield} /><stop offset="1" stopColor={tone(co.shield, -0.4)} /></radialGradient>
        <linearGradient id={uid + "st"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor={co.steel} /><stop offset="1" stopColor={tone(co.steel, -0.35)} /></linearGradient>
        <pattern id="mailp" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M 0 6 Q 3.5 0 7 6 Q 10.5 12 14 6" fill="none" stroke="#000" strokeWidth="1.6" opacity="0.55" /><path d="M 0 12 Q 3.5 6 7 12" fill="none" stroke="#fff" strokeWidth="1" opacity="0.28" /></pattern>
      </defs>
      {chain([hipG, kB, aB], [66 * bw, 52 * bw, 40], GR.tr, 0.5)}{boot(aB, p.bAng)}
      {chain([shF, elbow2, hand2], [46 * bw, 40, 32], co.cloth2, 0.5)}
      {/* الرداء المتطاير وراء الجسم */}
      <path d={`M ${shO[0]} ${shO[1]} Q ${capeMid[0]} ${capeMid[1]} ${capeEnd[0]} ${capeEnd[1]} Q ${capeMid[0] + 20 * s} ${capeMid[1] + 90 * s} ${T(-40 * bw, 40)[0]} ${T(-40 * bw, 40)[1]} Z`} fill={GR.cp} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      {[0.2, 0.45, 0.7].map((u, i) => <path key={"cf" + i} d={`M ${lerp(shO[0], capeEnd[0], u * 0.5)} ${lerp(shO[1], capeEnd[1], u * 0.3) + 18 * s} Q ${lerp(capeMid[0], capeEnd[0], u)} ${lerp(capeMid[1], capeEnd[1], u) - 14 * s} ${lerp(capeMid[0], capeEnd[0], 0.4 + u * 0.6)} ${lerp(capeMid[1], capeEnd[1], 0.3 + u * 0.7)}`} fill="none" stroke={tone(co.cape, -0.5)} strokeWidth={lw(3)} opacity={0.5} strokeLinecap="round" />)}
      {chain([hipG, kF, aF], [68 * bw, 54 * bw, 42], GR.tr, 0.35)}{boot(aF, p.fAng)}
      {/* ذيل الثوب ثم الجذع */}
      <polygon points={[T(-34 * bw, -8), T(50 * bw, -8), T(58 * bw, 150), T(24, 160), T(-6, 140), T(-36 * bw, 150)].map((v) => v.join(",")).join(" ")} fill={GR.cl} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      <polygon points={[T(-34 * bw, -8), T(-6, -8), T(-6, 140), T(-36 * bw, 150)].map((v) => v.join(",")).join(" ")} fill="#000" opacity={0.22} />
      <path d={`M ${q(-46, 8)} Q ${q(-66, -70)} ${q(-52, -150)} Q ${q(-44, -204)} ${q(-14, -220)} L ${q(24, -220)} Q ${q(58, -190)} ${q(54, -130)} Q ${q(42, -70)} ${q(46, 8)} Z`} fill={GR.cl} stroke={co.line} strokeWidth={lw(SW)} strokeLinejoin="round" />
      <path d={`M ${q(-46, 8)} Q ${q(-66, -70)} ${q(-52, -150)} Q ${q(-44, -204)} ${q(-14, -220)} L ${q(-2, -218)} Q ${q(-26, -150)} ${q(-20, -60)} L ${q(-14, 8)} Z`} fill="#000" opacity={0.22} />
      <path d={`M ${q(-46, 8)} Q ${q(-66, -70)} ${q(-52, -150)} Q ${q(-44, -204)} ${q(-14, -220)} L ${q(24, -220)} Q ${q(58, -190)} ${q(54, -130)} Q ${q(42, -70)} ${q(46, 8)} Z`} fill="url(#mailp)" opacity={co.kind === "kafir" ? 0.6 : 0.34} />
      <path d={`M ${q(40, -200)} Q ${q(56, -150)} ${q(50, -90)}`} fill="none" stroke="#fff" strokeWidth={lw(4)} strokeLinecap="round" opacity={0.35} />
      {co.kind === "kafir" ? (
        <g>
          <path d={`M ${q(-50, -150)} L ${q(50, -170)} L ${q(56, -110)} L ${q(-50, -96)} Z`} fill={co.mail} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
          <circle cx={T(14 * bw, -214)[0]} cy={T(14 * bw, -214)[1]} r={lw(44 * bw)} fill={co.helm} stroke={co.line} strokeWidth={lw(SW)} />
        </g>
      ) : (
        <path d={`M ${q(36, -208)} Q ${q(16, -130)} ${q(32, -20)}`} fill="none" stroke={co.line} strokeWidth={lw(4)} strokeLinecap="round" />
      )}
      <polygon points={[T(-50 * bw, -30), T(52 * bw, -30), T(52 * bw, -2), T(-50 * bw, -2)].map((v) => v.join(",")).join(" ")} fill={co.sash} stroke={co.line} strokeWidth={lw(4)} strokeLinejoin="round" />
      {/* الغمد عند الورك */}
      {weapon === "sword" && (() => {
        const g0 = T(38, -10), g1 = T(-230, 54);
        return (
          <g>
            <line x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]} stroke={co.line} strokeWidth={lw(24)} strokeLinecap="round" />
            <line x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]} stroke={co.boot} strokeWidth={lw(15)} strokeLinecap="round" />
          </g>
        );
      })()}
      {shield}
      {chain([shN, elbow, hand], [54 * bw, 44, 34], co.cloth, 0.3)}
      {chain([[hand[0] - (hand[0] - elbow[0]) * 0.22, hand[1] - (hand[1] - elbow[1]) * 0.22], hand], [38, 34], co.sash, 0.2)}
      {trail}
      {sword}{hilt}{spear}
      <circle cx={hand2[0]} cy={hand2[1]} r={lw(16)} fill={co.skin} stroke={co.line} strokeWidth={lw(3)} />
      <circle cx={hand[0]} cy={hand[1]} r={lw(18)} fill={co.skin} stroke={co.line} strokeWidth={lw(3)} />
      {chain([T(4, -200), T(10, -236)], [38, 34], co.mail, 0.25)}
      {head}
    </g>
  );
};
