import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  CAM, proj, pxm, zForFootY, xAt, MAN, HEAD, HORSE, WEAR, WIND, SUN, ink, lod, atDepth, hexMix, haze,
  polyPath, smoothPath, linePath, hangFolds, Guides, headPt, ik2, rng, add, sub, mul, norm, perp, lerp2, len,
  type V2, type V3, type HeadFrame,
} from "./draw/construct";
import { Fist, Sleeve } from "./draw/parts";

/**
 * «لوحة ١ بالبناء»: المشهد نفسه، لكن كل شيء موضوع بالأمتار في عالم ثلاثي الأبعاد ثم مُسقَط بالكاميرا.
 * الإطار ٠ = اللوحة، والإطار ١ = اللوحة مع خطوط البناء التي تُظهر سبب كل نقطة.
 */
export const KEY2_W = 1024, KEY2_H = 576;
const LN = "#0a0908";
const at = (o: V3, dx: number, dy: number, dz: number): V3 => ({ x: o.x + dx, y: o.y + dy, z: o.z + dz });

// ───────── مواضع العالم (بالأمتار) ─────────
/** اتجاه الحصان: نحو الكاميرا ويسارها */
const HF = { x: -0.55, z: -0.83 };
const HL = { x: -HF.z, z: HF.x }; // يسار الحصان (يظهر يمين الشاشة)
const SEAT: V3 = { x: 0.3, y: 1.38, z: 14.0 };
const fwd = (p: V3, d: number, dy = 0): V3 => ({ x: p.x + HF.x * d, y: p.y + dy, z: p.z + HF.z * d });
const lft = (p: V3, d: number, dy = 0): V3 => ({ x: p.x + HL.x * d, y: p.y + dy, z: p.z + HL.z * d });
const WITHERS = fwd(SEAT, 0.4, 0.07);
const POLL = fwd(WITHERS, 0.85, 0.27);
const MUZZLE: V3 = { x: POLL.x + HF.x * 0.35, y: POLL.y - 0.5, z: POLL.z + HF.z * 0.35 };
const CROUP = fwd(WITHERS, -HORSE.backToCroup, 0.02);
const NECKB: V3 = at(SEAT, -0.03, MAN.seatToNeck - 0.02, -0.18);
const CHIN: V3 = at(NECKB, 0, 0.08, -0.03);
const CROWN: V3 = at(CHIN, 0, MAN.head, 0);

/** الجنديان الأماميان: قدماهما عند السطرين ٥٧٦ و٥٦٦ فعمقهما محسوب لا مخمَّن */
const S1 = { z: zForFootY(576), sx: 92 };
const S2 = { z: zForFootY(566), sx: 192 };

// ───────── رسم الجندي القائم ─────────
type SoldierP = { x: number; z: number; seed: number; spear?: "R" | "L"; banner?: boolean; near?: boolean; g?: Guides };
const Soldier: React.FC<SoldierP> = ({ x, z, seed, spear, banner, near, g }) => {
  const r = rng(seed);
  const s = pxm(z);
  const P = (dx: number, y: number) => proj({ x: x + dx, y, z });
  const c = (hex: string) => atDepth(hex, z);
  const hw = MAN.headW / 2 + WEAR.helmet.thick;
  const crown = P(0, MAN.H + 0.03), chin = P(0, MAN.H - MAN.head - 0.02), eye = P(0, MAN.H - MAN.head * HEAD.eye);
  const shL = P(-MAN.shoulderW / 2, MAN.shoulder), shR = P(MAN.shoulderW / 2, MAN.shoulder);
  const neck = P(0, MAN.neckBase);
  // العباءة معلّقة من الكتفين وتتسع نحو الأسفل إلى ما تحت الركبة، وتميل قليلاً مع الريح
  const sway = 0.05 * WIND.x;
  const cloak = smoothPath([
    P(-0.1, MAN.neckBase + 0.02), P(-MAN.shoulderW / 2 - 0.05, MAN.shoulder - 0.02), P(-0.3 + sway, 1.0), P(-0.34 + sway, 0.5),
    P(-0.24 + sway, 0.36), P(-0.1 + sway, 0.44), P(0.12 + sway, 0.4), P(0.28 + sway, 0.44), P(0.36 + sway, 0.5), P(0.3 + sway, 1.0),
    P(MAN.shoulderW / 2 + 0.05, MAN.shoulder - 0.02), P(0.1, MAN.neckBase + 0.02),
  ]);
  const torso = smoothPath([P(-0.16, 1.43), P(0.16, 1.43), P(0.155, 1.22), P(0.14, MAN.waist), P(-0.14, MAN.waist), P(-0.155, 1.22)]);
  const legs = [
    polyPath([P(-0.17, 0.95), P(-0.02, 0.95), P(-0.04, MAN.knee), P(-0.06, 0.1), P(-0.15, 0.1), P(-0.17, MAN.knee)]),
    polyPath([P(0.02, 0.95), P(0.17, 0.95), P(0.17, MAN.knee), P(0.15, 0.1), P(0.06, 0.1), P(0.04, MAN.knee)]),
  ];
  const boots = [polyPath([P(-0.16, 0.12), P(-0.05, 0.12), P(-0.04, 0), P(-0.18, 0)]), polyPath([P(0.05, 0.12), P(0.16, 0.12), P(0.18, 0), P(0.04, 0)])];
  const hx = spear === "L" ? -0.2 : 0.2;
  const hand = P(hx, 1.2);
  const spearTop = P(hx + 0.02, 2.7), spearBot = P(hx - 0.01, 0);
  const tube = (a: V2, b: V2, c2: V2, w: number) => { const q = norm(perp(sub(b, a))), q2 = norm(perp(sub(c2, b))); return smoothPath([add(a, mul(q, w)), add(b, mul(q, w)), add(c2, mul(q2, w * 0.8)), sub(c2, mul(q2, w * 0.8)), sub(b, mul(q, w)), sub(a, mul(q, w))]); };
  // الذراع: العضد تحت العباءة من الكتف إلى المرفق، والساعد يخرج من حافتها إلى الرسغ، والقبضة على الرمح أو على الحزام
  const arms = [-1, 1].map((sd) => {
    const holds = !!spear && ((spear === "R" && sd === 1) || (spear === "L" && sd === -1));
    // الممسكة: الساعد ممدود نحو الكاميرا فيقصر على الشاشة، والقبضة على العمود نفسه
    const el = holds ? P(hx + sd * 0.07, 1.0) : P(sd * 0.25, MAN.shoulder - MAN.upperArm);
    const wr = holds ? P(hx + sd * 0.02, 1.12) : P(sd * 0.2, MAN.waist + 0.06);
    const drape = smoothPath([P(sd * 0.1, MAN.neckBase), P(sd * 0.25, MAN.shoulder + 0.01), P(sd * 0.3, MAN.shoulder - 0.12), P(sd * 0.3, el.y > 0 ? MAN.shoulder - MAN.upperArm - 0.02 : 1.1), P(sd * 0.2, MAN.shoulder - MAN.upperArm + 0.03), P(sd * 0.16, MAN.shoulder - 0.1)]);
    return { el, wr, holds, drape };
  });
  const helm = smoothPath([
    add(crown, { x: 0, y: 0 }), add(crown, { x: hw * s * 0.95, y: hw * s * 0.35 }), add(eye, { x: hw * s, y: 0 }),
    add(chin, { x: hw * s * 0.55, y: -0.03 * s }), add(chin, { x: 0, y: 0 }), add(chin, { x: -hw * s * 0.55, y: -0.03 * s }),
    add(eye, { x: -hw * s, y: 0 }), add(crown, { x: -hw * s * 0.95, y: hw * s * 0.35 }),
  ]);
  const slit = polyPath([add(eye, { x: -hw * s * 0.8, y: -0.012 * s }), add(eye, { x: hw * s * 0.8, y: -0.012 * s }), add(eye, { x: hw * s * 0.76, y: 0.012 * s }), add(eye, { x: -hw * s * 0.76, y: 0.012 * s })]);
  const shadow = smoothPath([P(-0.25, 0), P(0.3, 0), add(P(0.3, 0), mul(SUN.shadowDir, 1.2 * s)), add(P(-0.25, 0), mul(SUN.shadowDir, 1.1 * s))]);
  if (g && near) {
    g.line([P(-0.6, 0), P(-0.6, MAN.H)], `طوله ١٫٧٦م × ${s.toFixed(0)} نقطة/م`);
    g.dot(P(0, 0), `القدمان على الأرض: العمق ${z.toFixed(1)}م`);
    g.line([shL, neck, shR], "نقطتا تعليق العباءة");
    g.line([add(eye, { x: -hw * s, y: 0 }), add(eye, { x: hw * s, y: 0 })], "شقّ الخوذة على خط العين");
  }
  const ow = ink(z, "outline");
  return (
    <g>
      {near && <path d={shadow} fill="#2a2016" opacity={0.25} filter="url(#b5)" />}
      {spear && lod(z, 0.03) && <polygon points={`${spearTop.x},${spearTop.y - 0.12 * s} ${spearTop.x + 0.02 * s},${spearTop.y} ${spearTop.x},${spearTop.y + 0.04 * s} ${spearTop.x - 0.02 * s},${spearTop.y}`} fill={c("#cfd3d8")} />}
      {banner && spear && <Banner top={spearTop} s={s} z={z} seed={seed} />}
      <path d={cloak} fill={c("#22201d")} stroke={LN} strokeWidth={ow} filter={near ? "url(#relM)" : undefined} />
      <clipPath id={"clk" + seed}><path d={cloak} /></clipPath>
      <g clipPath={`url(#clk${seed})`}>
      {near && hangFolds(shL, { x: -0.25 + sway, y: 1 }, 3, 0.75 * s, 0.5, seed).map((d, i) => <path key={"fl" + i} d={d} stroke="#3a3835" strokeWidth={ink(z, "fold")} fill="none" opacity={0.8} />)}
      {near && hangFolds(shR, { x: 0.25 + sway, y: 1 }, 3, 0.75 * s, 0.5, seed + 7).map((d, i) => <path key={"fr" + i} d={d} stroke="#3a3835" strokeWidth={ink(z, "fold")} fill="none" opacity={0.8} />)}
      </g>
      {legs.map((d, i) => <path key={"l" + i} d={d} fill={c(i ? "#9c9ba2" : "#a7a6ad")} stroke={LN} strokeWidth={ow * 0.8} />)}
      {boots.map((d, i) => <path key={"b" + i} d={d} fill={c("#2a241f")} />)}
      <path d={torso} fill={c("#2e2f34")} stroke={LN} strokeWidth={ow * 0.8} />
      {arms.map((a, i) => <Sleeve key={"sl" + i} start={a.el} wrist={a.wr} s={s} w0={0.05} w1={0.038} fill={c("#26262a")} edge={c("#55555c")} line={LN} lw={ow * 0.7} />)}
      {spear && <path d={`M ${spearBot.x} ${spearBot.y} L ${spearTop.x} ${spearTop.y}`} stroke={c("#17130f")} strokeWidth={Math.max(1, 0.035 * s)} />}
      {arms.map((a, i) => <path key={"dr" + i} d={a.drape} fill={c("#22201d")} stroke={LN} strokeWidth={ow * 0.8} />)}
      {0.1 * s >= 12 && arms.map((a, i) => <Fist key={"fs" + i} elbow={a.el} wrist={a.wr} s={s} tone={1} grip={a.holds ? [spearBot, spearTop] : undefined} gripW={Math.max(1, 0.035 * s)} gripColor={c("#17130f")} />)}
      {lod(z, 0.012) && (
        <g stroke={c("#141418")} strokeWidth={ink(z, "detail")} opacity={0.9} fill="none">
          <path d={linePath([P(-0.13, 1.4), P(0.12, 1.12)])} /><path d={linePath([P(0.13, 1.4), P(-0.12, 1.12)])} />
          <path d={linePath([P(-0.14, 1.3), P(0.14, 1.3)])} /><path d={linePath([P(-0.14, 1.18), P(0.14, 1.18)])} />
        </g>
      )}
      <path d={polyPath([P(-0.15, MAN.waist + 0.03), P(0.15, MAN.waist + 0.03), P(0.15, MAN.waist - 0.02), P(-0.15, MAN.waist - 0.02)])} fill={c("#5c2a23")} />
      {lod(z, 0.05) && <path d={polyPath([P(-0.21, 1.06), P(-0.15, 1.06), P(-0.15, 0.94), P(-0.21, 0.94)])} fill={c("#b07a38")} />}
      {lod(z, 0.05) && <path d={polyPath([P(0.15, 1.06), P(0.21, 1.06), P(0.21, 0.98), P(0.15, 0.98)])} fill={c("#b8843c")} />}
      <path d={helm} fill="url(#steel)" stroke={LN} strokeWidth={ow} filter={near ? "url(#relS)" : undefined} opacity={1 - haze(z) * 0.5} />
      <path d={slit} fill="#070707" />
      {lod(z, 0.01) && <path d={`M ${crown.x} ${crown.y} L ${chin.x} ${chin.y}`} stroke="#101114" strokeWidth={Math.max(0.6, 0.01 * s)} opacity={0.55} />}
      {lod(z, 0.02) && <path d={linePath([add(crown, { x: -hw * s * 0.7, y: hw * s * 0.5 }), add(crown, { x: -hw * s * 0.25, y: hw * s * 0.08 })])} stroke="#e6eaee" strokeWidth={Math.max(0.6, 0.012 * s)} opacity={0.6} fill="none" strokeLinecap="round" />}
      {/* الحافة المضيئة: الشمس عند الأفق يساراً */}
      <path d={cloak} fill="none" stroke="url(#rimL)" strokeWidth={ow * 1.4} opacity={0.6} />
    </g>
  );
};

/** راية سوداء تطير مع الريح نفسها التي تطيّر العباءة (من اليسار إلى اليمين) */
const Banner: React.FC<{ top: V2; s: number; z: number; seed: number }> = ({ top, s, z, seed }) => {
  const r = rng(seed * 3);
  const L = (0.9 + r() * 0.3) * s, H = 0.38 * s, w = WIND.x;
  const a = { x: top.x, y: top.y + 0.1 * s };
  const pts: V2[] = [a, { x: a.x + w * L * 0.35, y: a.y - 0.05 * s }, { x: a.x + w * L * 0.7, y: a.y + 0.04 * s }, { x: a.x + w * L, y: a.y + 0.02 * s },
    { x: a.x + w * L * 0.9, y: a.y + H * 0.5 }, { x: a.x + w * L, y: a.y + H * 0.85 }, { x: a.x + w * L * 0.65, y: a.y + H * 0.85 }, { x: a.x + w * L * 0.3, y: a.y + H * 1.0 }, { x: a.x, y: a.y + H }];
  return <path d={smoothPath(pts)} fill={atDepth("#191714", z)} stroke={LN} strokeWidth={ink(z, "outline") * 0.7} />;
};

// ───────── الفارس على الحصان ─────────
const Horse: React.FC<{ g: Guides }> = ({ g }) => {
  const P = proj(POLL), M = proj(MUZZLE), W = proj(WITHERS), C = proj(CROUP);
  const sH = pxm(POLL.z);
  const axis = sub(M, P), a = norm(axis), nr = mul(perp(a), -1); // nr يشير إلى يمين الشاشة (الخد)
  const along = (t: number, side: number, wM: number) => add(add(P, mul(axis, t)), mul(nr, side * wM * sH));
  // وجه الحصان: الجبهة أعرض (٢٢سم) والفم أضيق (١٤سم)؛ الخد (الجهة اليمنى) منتفخ عند الفك
  const face = smoothPath([
    along(0.02, -0.1, 1), along(0.25, -0.115, 1), along(0.55, -0.1, 1), along(0.85, -0.085, 1), along(1.0, -0.06, 1), along(1.04, 0.0, 1),
    along(1.0, 0.07, 1), along(0.85, 0.08, 1), along(0.6, 0.12, 1), along(0.4, 0.2, 1), along(0.25, 0.2, 1), along(0.08, 0.12, 1),
  ]);
  const cheekPlane = smoothPath([along(0.25, 0.04, 1), along(0.35, 0.18, 1), along(0.55, 0.12, 1), along(0.8, 0.07, 1), along(0.62, 0.02, 1)]);
  const throat = along(0.45, 0.2, 1);
  // العنق: من خلف الأذنين بقوس العرف إلى الحارك، ومن الحلق إلى الصدر
  const crestMid = add(lerp2(P, W, 0.5), mul(norm(perp(sub(W, P))), 0.12 * sH));
  const chest = proj(fwd(WITHERS, 0.35, -0.55));
  const shoulderB = proj(fwd(WITHERS, -0.1, -0.75));
  const neck = smoothPath([add(P, mul(nr, 0.06 * sH)), crestMid, W, proj(fwd(WITHERS, -0.15, -0.2)), shoulderB, { x: shoulderB.x, y: 600 }, { x: chest.x - 40, y: 600 }, chest, throat]);
  const ears = [-1, 1].map((sd) => {
    const base = add(P, mul(nr, sd * 0.075 * sH));
    const tip = add(base, { x: sd * 0.035 * sH, y: -HORSE.earL * sH });
    return { base, tip, d: smoothPath([add(base, mul(nr, -0.035 * sH)), lerp2(base, tip, 0.55), tip, add(lerp2(base, tip, 0.5), mul(nr, 0.045 * sH)), add(base, mul(nr, 0.04 * sH))]) };
  });
  // شعر العرف: ينبت من خط العنق العلوي ويسقط مع الجاذبية ويميل مع الريح
  const r = rng(5);
  const crest: V2[] = Array.from({ length: 16 }, (_, i) => lerp2(lerp2(P, crestMid, Math.min(1, i / 8)), lerp2(crestMid, W, Math.max(0, (i - 8) / 8)), i < 8 ? 0 : 1));
  const mane = crest.map((b, i) => {
    const L = (0.22 + r() * 0.2) * sH;
    const dir = norm({ x: WIND.x * 0.55 + 0.1, y: 1 });
    const tip = add(b, mul(dir, L));
    const w = 0.035 * sH;
    return `M ${b.x - w} ${b.y} Q ${b.x + dir.x * L * 0.4} ${b.y + L * 0.3} ${tip.x} ${tip.y} Q ${b.x + dir.x * L * 0.6 + w} ${b.y + L * 0.35} ${b.x + w} ${b.y} Z`;
  });
  // الناصية: تنبت بين الأذنين وتسقط على الجبهة مع الريح
  const forelock = Array.from({ length: 7 }, (_, i) => {
    const b = add(P, mul(nr, (i - 3) * 0.022 * sH));
    const tip = add(along(0.28 + r() * 0.08, (i - 3) * 0.03 + 0.03, 1), { x: WIND.x * 0.03 * sH, y: 0 });
    const w = 0.02 * sH;
    return `M ${b.x - w} ${b.y} Q ${lerp2(b, tip, 0.5).x - w} ${lerp2(b, tip, 0.5).y} ${tip.x} ${tip.y} Q ${lerp2(b, tip, 0.5).x + w} ${lerp2(b, tip, 0.5).y} ${b.x + w} ${b.y} Z`;
  });
  // اللجام: سير خلف الأذنين، وسير الجبهة، وسير الخد إلى حلقة الفم، وسير الأنف فوق الفم بكفّ
  const ring = along(0.88, 0.09, 1);
  const cheekStrap = linePath([along(0.0, 0.1, 1), along(0.3, 0.12, 1), along(0.6, 0.1, 1), ring]);
  const brow = linePath([along(0.1, -0.11, 1), along(0.1, 0.0, 1), along(0.1, 0.11, 1)]);
  const nose = linePath([along(0.72, -0.1, 1), along(0.74, 0.0, 1), along(0.75, 0.085, 1)]);
  // الحوض والظهر خلف الفارس: الكفل عند ارتفاع ١٫٤٧م، والفخذ الخلفي ينزل إلى خارج الإطار
  const sC = pxm(CROUP.z);
  const hind = smoothPath([add(C, { x: -0.25 * sC, y: 0.05 * sC }), add(C, { x: 0.05 * sC, y: -0.02 * sC }), add(C, { x: 0.28 * sC, y: 0.15 * sC }), add(C, { x: 0.32 * sC, y: 0.5 * sC }), { x: C.x + 0.3 * sC, y: 600 }, { x: C.x - 0.25 * sC, y: 600 }]);
  const tail = smoothPath([add(C, { x: 0.25 * sC, y: 0.1 * sC }), add(C, { x: 0.55 * sC, y: 0.3 * sC }), add(C, { x: 0.62 * sC, y: 0.6 * sC }), { x: C.x + 0.55 * sC, y: 600 }, { x: C.x + 0.32 * sC, y: 600 }, add(C, { x: 0.35 * sC, y: 0.4 * sC })]);
  g.line([P, M], "محور رأس الحصان: ٦٠سم من بين الأذنين إلى الفم");
  g.dot(W, "الحارك ١٫٤٥م");
  g.dot(C, "الكفل خلف العباءة");
  g.dot(lerp2(P, M, 0.33), "لا عين: بأمر المستخدم، يبقى الجلد أملس");
  const ow = ink(POLL.z, "outline");
  return (
    <g>
      <path d={smoothPath([W, add(lerp2(W, C, 0.5), { x: 0, y: -0.04 * sC }), C, { x: C.x + 0.1 * sC, y: 600 }, { x: W.x - 0.35 * sC, y: 600 }, add(W, { x: -0.3 * sC, y: 0.3 * sC })])} fill="#141110" filter="url(#relB)" />
      <path d={hind} fill="#15110f" stroke={LN} strokeWidth={ow} filter="url(#relB)" />
      <path d={tail} fill="#0f0c0b" />
      <path d={neck} fill="url(#horseNeck)" stroke={LN} strokeWidth={ow} filter="url(#relB)" />
      {ears.map((e, i) => <path key={"e" + i} d={e.d} fill="#1a1411" stroke={LN} strokeWidth={ow} />)}
      {ears.map((e, i) => <path key={"ei" + i} d={smoothPath([lerp2(e.base, e.tip, 0.15), lerp2(e.base, e.tip, 0.75), add(lerp2(e.base, e.tip, 0.4), mul(nr, 0.02 * sH))])} fill="#4a3a30" opacity={0.7} />)}
      <path d={face} fill="url(#horseFace)" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      <path d={cheekPlane} fill="#1c1615" opacity={0.55} />
      <path d={linePath([along(0.05, -0.095, 1), along(0.5, -0.09, 1), along(0.95, -0.055, 1)])} stroke="#7a6252" strokeWidth={0.02 * sH} opacity={0.35} fill="none" strokeLinecap="round" />
      {mane.map((d, i) => <path key={"m" + i} d={d} fill={i % 3 ? "#0d0b0b" : "#1d1817"} />)}
      {forelock.map((d, i) => <path key={"f" + i} d={d} fill={i % 2 ? "#0d0b0b" : "#1a1514"} />)}
      <path d={cheekStrap} stroke="#16100e" strokeWidth={0.022 * sH} fill="none" />
      <path d={brow} stroke="#16100e" strokeWidth={0.02 * sH} fill="none" />
      <path d={nose} stroke="#16100e" strokeWidth={0.026 * sH} fill="none" />
      <path d={nose} stroke="#5a4a3e" strokeWidth={0.005 * sH} fill="none" opacity={0.8} />
      <circle cx={ring.x} cy={ring.y} r={0.022 * sH} fill="none" stroke="#c4bfae" strokeWidth={0.007 * sH} />
      <circle cx={along(0.1, 0.11, 1).x} cy={along(0.1, 0.11, 1).y} r={0.012 * sH} fill="#cdbd9c" />
    </g>
  );
};

const Rider: React.FC<{ g: Guides }> = ({ g }) => {
  const s = pxm(SEAT.z);
  const crown = proj(CROWN), chin = proj(CHIN);
  const hf: HeadFrame = { crown, chin, w: MAN.headW * pxm(CHIN.z), yaw: -0.12 };
  const H = (u: number, v: number) => headPt(hf, u, v);
  const hH = MAN.head * pxm(CHIN.z);
  const neckB = proj(NECKB);
  const shL = proj(at(NECKB, -0.2, -0.05, 0.03)), shR = proj(at(NECKB, 0.2, -0.05, -0.02));
  const waist = MAN.seatToNeck - 0.36;
  const wL = proj(at(SEAT, -0.13, waist, -0.05)), wR = proj(at(SEAT, 0.15, waist, -0.08));
  const shR3 = at(NECKB, 0.2, -0.05, -0.02), shL3 = at(NECKB, -0.2, -0.05, 0.03);
  const armR = ik2(shR3, at(SEAT, -0.08, 0.08, -0.36), MAN.upperArm, MAN.forearm + 0.07, { x: 0.3, y: -0.3, z: 0.9 });
  const armL = ik2(shL3, at(SEAT, -0.34, 0.12, -0.4), MAN.upperArm, MAN.forearm + 0.07, { x: -0.22, y: -0.3, z: 0.95 });
  const elbowR = proj(armR.mid), handR = proj(armR.end);
  const elbowL0 = proj(armL.mid), handL = proj(armL.end);
  const hip = proj(lft(SEAT, 0.17, 0.05));
  const knee = proj(fwd(lft(SEAT, 0.25, -0.28), 0.25));
  // ── العمامة: حافتها فوق الحاجبين، وقبّتها تعلو القمة ٧ سم، وذيلها مع الريح ──
  const rise = -WEAR.turban.rise / MAN.head, sideU = 1 + (2 * WEAR.turban.side) / MAN.headW;
  const edge = (u: number) => H(u, HEAD.turbanEdge + 0.035 * (1 - u * u));
  const turban = smoothPath([edge(-sideU), H(-sideU * 1.02, 0.1), H(-0.85, rise * 0.7), H(0, rise), H(0.85, rise * 0.75), H(sideU * 1.02, 0.08), edge(sideU), edge(0.5), edge(0), edge(-0.5)]);
  const bands = [0.18, 0.02, -0.14].map((v, i) => linePath([H(-sideU * 0.98, v + 0.08 + i * 0.02), H(0, v - 0.02), H(sideU * 0.97, v + 0.05)]));
  const tailRoot = H(sideU * 0.95, 0.2);
  const tl = 0.5 * s;
  const tail = smoothPath([tailRoot, add(tailRoot, { x: tl * 0.35, y: 0.02 * s }), add(tailRoot, { x: tl * 0.7, y: 0.06 * s }), add(tailRoot, { x: tl, y: 0.16 * s }),
    add(tailRoot, { x: tl * 0.93, y: 0.22 * s }), add(tailRoot, { x: tl * 0.65, y: 0.12 * s }), add(tailRoot, { x: tl * 0.3, y: 0.1 * s }), H(sideU * 0.9, 0.32)]);
  // ── شريط العينين: الجلد بين حافة العمامة وحافة اللثام ──
  const lithTop = (u: number) => H(u, HEAD.underEye + 0.025 * u * u);
  const skin = smoothPath([edge(-1), edge(0), edge(1), lithTop(1.02), lithTop(0), lithTop(-1.02)]);
  const eyes = [-1, 1].map((sd) => {
    const cx = sd * 0.4, ew = 0.2; // عرض العين خمس عرض الرأس، وبين العينين عين
    const inner = H(cx - sd * ew, HEAD.eye), outer = H(cx + sd * ew, HEAD.eye + 0.005), top = H(cx, HEAD.eye - 0.045), bot = H(cx, HEAD.eye + 0.035);
    const browIn = H(cx - sd * ew * 1.15, HEAD.brow + 0.03), browOut = H(cx + sd * ew * 1.3, HEAD.brow - 0.025); // مقطّب: الطرف الداخلي أخفض
    const iris = H(cx - sd * 0.02, HEAD.eye - 0.005);
    return { inner, outer, top, bot, browIn, browOut, iris };
  });
  // ── اللثام: من تحت العينين حتى أسفل الذقن، يتعلّق برأس الأنف فتنزل منه طيّتان ──
  const noseTip = H(0.02, HEAD.noseBase - 0.02);
  const litham = smoothPath([lithTop(-1.04), lithTop(-0.5), lithTop(0), lithTop(0.5), lithTop(1.04), H(1.0, 0.78), H(0.62, 1.02), H(0.0, 1.12), H(-0.6, 1.02), H(-1.0, 0.78)]);
  const lithFolds = [linePath([noseTip, H(-0.45, 1.0)]), linePath([noseTip, H(0.5, 0.98)]), linePath([H(0, HEAD.underEye + 0.01), noseTip])];
  // ── الوشاح: ملفوف حول العنق فطيّاته أفقية، ينزل إلى الكتفين ──
  const scarf = smoothPath([H(-1.12, 0.85), H(-0.4, 1.08), H(0.5, 1.08), H(1.15, 0.85), add(neckB, { x: 0.15 * s, y: 0.0 }), add(neckB, { x: 0.13 * s, y: 0.09 * s }),
    add(neckB, { x: 0.0, y: 0.12 * s }), add(neckB, { x: -0.12 * s, y: 0.09 * s }), add(neckB, { x: -0.15 * s, y: 0.0 })]);
  const scarfEnd = smoothPath([add(neckB, { x: 0.02 * s, y: 0.08 * s }), add(neckB, { x: 0.1 * s, y: 0.1 * s }), add(neckB, { x: 0.2 * s, y: 0.2 * s }), add(neckB, { x: 0.34 * s, y: 0.24 * s }), add(neckB, { x: 0.3 * s, y: 0.3 * s }), add(neckB, { x: 0.12 * s, y: 0.3 * s }), add(neckB, { x: 0.0, y: 0.22 * s })]);
  const scarfFolds = [0.0, 0.07, 0.13].map((k, i) => linePath([add(H(-1.05, 0.95), { x: 0, y: k * s }), add(neckB, { x: 0, y: (k - 0.03) * s }), add(H(1.1, 0.95), { x: 0.02 * s, y: (k + 0.02) * s })]));
  // ── العباءة: تُلقى على الكتفين فتغطي العضدين والمرفقين، ويخرج الساعدان من تحت حافتها الأمامية؛ ويمينها يطير مع الريح ──
  const Rw = at(NECKB, 0.22, -0.04, -0.03);
  const cp = (dx: number, dy: number, dz: number) => proj(at(Rw, dx, dy, dz));
  const o = (p: V2, dx: number, dy: number) => add(p, { x: dx * s, y: dy * s });
  const capeL = smoothPath([o(neckB, -0.06, -0.01), o(shL, -0.01, -0.05), o(shL, -0.045, 0.04), o(elbowL0, -0.07, -0.05), o(elbowL0, -0.06, 0.03), o(elbowL0, 0.0, 0.035),
    o(elbowL0, 0.05, -0.03), o(neckB, -0.11, 0.24), o(neckB, -0.07, 0.1)]);
  const capeR = smoothPath([o(neckB, 0.06, -0.01), o(shR, 0.02, -0.05), cp(0.22, 0.03, 0.12), cp(0.42, -0.1, 0.3), cp(0.58, -0.28, 0.42), cp(0.7, -0.5, 0.52), cp(0.58, -0.5, 0.44),
    cp(0.5, -0.47, 0.4), cp(0.44, -0.58, 0.34), cp(0.34, -0.66, 0.28), cp(0.22, -0.6, 0.2), o(elbowR, 0.09, 0.05), o(elbowR, 0.02, 0.06), o(elbowR, -0.05, 0.0), o(neckB, 0.12, 0.24), o(neckB, 0.07, 0.1)]);
  const capeRfront = smoothPath([o(neckB, 0.06, 0.0), o(shR, 0.02, -0.05), o(shR, 0.05, 0.05), o(elbowR, 0.08, -0.01), o(elbowR, 0.06, 0.07), o(elbowR, -0.01, 0.07), o(elbowR, -0.06, 0.0), o(neckB, 0.12, 0.24), o(neckB, 0.07, 0.1)]);
  const cloakFolds = hangFolds(o(shR, 0.02, 0.0), { x: WIND.x * 0.75, y: 0.55 }, 4, 0.75 * s, 0.55, 9);
  const capeLFolds = hangFolds(o(shL, -0.03, 0.0), { x: -0.15, y: 1 }, 2, 0.3 * s, 0.4, 4);
  // ── الصدرية: الجذع الظاهر بين حافتي العباءة ──
  const vest = smoothPath([o(neckB, -0.08, 0.04), o(neckB, 0.08, 0.04), o(neckB, 0.13, 0.24), o(wR, -0.02, 0), o(wL, 0.03, 0), o(neckB, -0.12, 0.24)]);
  // ── الساعدان: من المرفق إلى الرسغ، والقبضة بعد الرسغ على اللجام ──
  const wristOf = (el: V2, grip: V2) => { const u = norm(sub(grip, el)); return sub(grip, mul(u, 0.075 * s)); };
  const wristR = wristOf(elbowR, handR), wristL = wristOf(elbowL0, handL);
  const legPath = smoothPath([add(hip, { x: -0.06 * s, y: 0 }), add(hip, { x: 0.08 * s, y: -0.02 * s }), add(knee, { x: 0.08 * s, y: 0 }), { x: knee.x + 0.07 * s, y: 600 }, { x: knee.x - 0.07 * s, y: 600 }, add(knee, { x: -0.08 * s, y: 0 })]);
  const coatSkirt = smoothPath([add(wL, { x: 0.02 * s, y: -0.02 * s }), add(wR, { x: 0.02 * s, y: -0.02 * s }), add(hip, { x: 0.1 * s, y: 0.06 * s }), add(hip, { x: -0.06 * s, y: 0.1 * s }), add(wL, { x: 0.05 * s, y: 0.12 * s })]);
  const saddle = smoothPath([proj(lft(fwd(SEAT, 0.22, 0.02), 0.12)), proj(lft(fwd(SEAT, 0.05, -0.02), 0.2)), proj(lft(fwd(SEAT, -0.15, -0.04), 0.2)), proj(lft(fwd(SEAT, -0.15, -0.14), 0.21)), proj(lft(fwd(SEAT, 0.18, -0.16), 0.21))]);
  g.dot(elbowR, "المرفق محسوب من طولي العضد والساعد"); g.dot(wristR, "الرسغ: حافة الكم، ومنها وحدها تخرج اليد");
  const bit = proj(MUZZLE);
  // خطوط البناء
  [["القمة", 0], ["حافة العمامة: فوق الحاجبين بإصبعين", HEAD.turbanEdge], ["الحاجب", HEAD.brow], ["العين: منتصف الرأس", HEAD.eye], ["حافة اللثام: تحت العين", HEAD.underEye], ["قاعدة الأنف", HEAD.noseBase], ["الذقن", 1]].forEach(([l, v], i) => {
    const e = H(1.3, v as number);
    g.line([H(-1.3, v as number), e]);
    g.line([e, { x: 520, y: 22 + i * 13 }], l as string, "#7fe0ff");
  });
  g.line([H(0, rise), H(0, 1.05)], "خط منتصف الوجه (التفات قليل)");
  g.dot(shR, "العباءة على الكتف"); g.dot(shL, "العباءة على الكتف");
  g.dot(proj(SEAT), "السرج ١٫٣٨م"); g.line([proj(SEAT), proj(CROWN)], "جالساً: ٠٫٧٨م إلى العين");
  g.line([tailRoot, add(tailRoot, { x: 0.5 * s, y: 0.09 * s })], "ذيل العمامة مع الريح");
  const ow = ink(SEAT.z, "outline");
  return (
    <g>
      <path d={saddle} fill="#7a5130" stroke={LN} strokeWidth={ow} />
      <path d={legPath} fill="#b8b8be" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      <path d={linePath([add(hip, { x: 0.02 * s, y: 0.05 * s }), add(knee, { x: 0.0, y: 0.05 * s }), { x: knee.x - 0.01 * s, y: 600 }])} stroke="#e1e1e5" strokeWidth={0.03 * s} opacity={0.5} fill="none" />
      <path d={capeR} fill="url(#cloak)" stroke={LN} strokeWidth={ow} filter="url(#relB)" />
      <clipPath id="capeRclip"><path d={capeR} /></clipPath>
      <clipPath id="capeLclip"><path d={capeL} /></clipPath>
      {cloakFolds.map((d, i) => <path key={"cf" + i} clipPath="url(#capeRclip)" d={d} stroke="#3a3938" strokeWidth={ink(SEAT.z, "fold")} fill="none" opacity={0.7} strokeLinecap="round" />)}
      <path d={capeR} fill="none" stroke="url(#rimL)" strokeWidth={ow * 1.5} opacity={0.5} />
      <path d={coatSkirt} fill="#2a2a2f" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      <path d={linePath([add(wL, { x: 0, y: 0.02 * s }), add(wR, { x: 0.02 * s, y: 0.02 * s })])} stroke="#1c1613" strokeWidth={0.05 * s} fill="none" />
      <path d={vest} fill="url(#vest)" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      {[0.12, 0.3, 0.48, 0.66].map((k, i) => { const p = lerp2(o(neckB, 0.0, 0.06), lerp2(wL, wR, 0.5), k); return <circle key={"bt" + i} cx={p.x} cy={p.y} r={0.008 * s} fill="#a39d82" stroke="#222" strokeWidth={0.8} />; })}
      <path d={linePath([o(neckB, 0.0, 0.05), lerp2(wL, wR, 0.5)])} stroke="#2a2b2f" strokeWidth={ink(SEAT.z, "detail")} opacity={0.7} fill="none" />
      <path d={linePath([o(neckB, -0.11, 0.14), o(neckB, 0.12, 0.15)])} stroke="#2a2b2f" strokeWidth={ink(SEAT.z, "detail")} opacity={0.6} fill="none" />
      <Sleeve start={elbowL0} wrist={wristL} s={s} fill="#1b1b1e" edge="#4a4a50" line={LN} lw={ow * 0.7} />
      <Sleeve start={elbowR} wrist={wristR} s={s} fill="#3b3b40" edge="#8a8a92" line={LN} lw={ow * 0.7} />
      <path d={capeRfront} fill="#101011" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      <path d={linePath([o(shR, 0.04, 0.02), o(elbowR, 0.04, 0.02)])} stroke="#3a393a" strokeWidth={ink(SEAT.z, "fold")} fill="none" opacity={0.7} />
      <path d={capeL} fill="#121214" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      {capeLFolds.map((d, i) => <path key={"cl" + i} clipPath="url(#capeLclip)" d={d} stroke="#38383c" strokeWidth={ink(SEAT.z, "fold")} fill="none" opacity={0.7} />)}
      {/* اللجام يمر بين الأصابع، وفضلته تتدلى بعد القبضة */}
      <Fist elbow={elbowL0} wrist={wristL} s={s} tone={1} grip={[proj(MUZZLE), o(handL, 0.04, 0.16)]} gripW={0.011 * s} />
      <Fist elbow={elbowR} wrist={wristR} s={s} grip={[proj(MUZZLE), o(handR, 0.05, 0.18)]} gripW={0.012 * s} />
      <path d={scarfEnd} fill="#0d0c0c" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      <path d={scarf} fill="#0f0e0e" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      {scarfFolds.map((d, i) => <path key={"sf" + i} d={d} stroke="#353433" strokeWidth={ink(SEAT.z, "fold") * 1.2} fill="none" opacity={0.75} strokeLinecap="round" />)}
      <path d={tail} fill="#0b0b0b" stroke="#2a2928" strokeWidth={ow * 0.6} filter="url(#relS)" />
      <path d={skin} fill="#d9a47a" />
      <path d={smoothPath([edge(-1), edge(0), edge(1), H(1, HEAD.brow - 0.02), H(0, HEAD.brow - 0.04), H(-1, HEAD.brow - 0.02)])} fill="#8a5a3e" opacity={0.45} />
      {/* شعر الصدغين يطل من تحت العمامة */}
      <path d={smoothPath([edge(-1.02), H(-1.08, 0.45), H(-0.96, 0.55), H(-0.9, 0.36)])} fill="#0b0908" />
      <path d={smoothPath([edge(1.02), H(1.08, 0.45), H(0.97, 0.55), H(0.9, 0.36)])} fill="#0b0908" />
      {eyes.map((e, i) => (
        <g key={"ey" + i}>
          <path d={smoothPath([e.inner, e.top, e.outer, e.bot])} fill="#f1ebe0" />
          <circle cx={e.iris.x} cy={e.iris.y} r={hH * 0.032} fill="#2c1d15" />
          <circle cx={e.iris.x + hH * 0.01} cy={e.iris.y - hH * 0.01} r={hH * 0.009} fill="#fff" />
          <path d={linePath([e.inner, e.top, e.outer])} stroke="#0c0908" strokeWidth={hH * 0.018} fill="none" strokeLinecap="round" />
          <path d={linePath([lerp2(e.inner, e.bot, 0.4), e.bot, lerp2(e.outer, e.bot, 0.4)])} stroke="#6b4632" strokeWidth={hH * 0.006} fill="none" />
          <path d={smoothPath([e.browIn, lerp2(e.browIn, e.browOut, 0.5), e.browOut, add(e.browOut, { x: 0, y: -hH * 0.01 }), add(lerp2(e.browIn, e.browOut, 0.5), { x: 0, y: -hH * 0.035 }), add(e.browIn, { x: 0, y: -hH * 0.03 })])} fill="#0a0807" />
        </g>
      ))}
      <path d={litham} fill="#0c0c0c" stroke={LN} strokeWidth={ow} filter="url(#relS)" />
      {lithFolds.map((d, i) => <path key={"lf" + i} d={d} stroke="#2e2d2d" strokeWidth={ink(SEAT.z, "fold")} fill="none" opacity={0.8} />)}
      <path d={turban} fill="#141414" stroke={LN} strokeWidth={ow} filter="url(#relM)" />
      {bands.map((d, i) => <path key={"tb" + i} d={d} stroke={i === 1 ? "#050505" : "#3a3a39"} strokeWidth={ink(SEAT.z, "fold") * 1.4} fill="none" opacity={0.75} />)}
    </g>
  );
};

// ───────── الجيش: صفوف حقيقية في العمق، فالبعيد أصغر وأبهت وأقل تفصيلاً ─────────
type Unit = { x: number; z: number; seed: number; spear?: "R" | "L"; banner?: boolean };
const army = (): Unit[] => {
  const r = rng(21);
  const out: Unit[] = [];
  // صف يسار ووسط: من ٥٢م إلى ٦٤م؛ تباعد الكتفين ٠٫٦٢م، وكل صف يزيح نصف خطوة
  for (let row = 0; row < 7; row++) {
    const z = 64 - row * 2;
    const half = (512 * z) / CAM.f + 0.5;
    for (let x = -half + (row % 2) * 0.31; x < half; x += 0.62) {
      const sx = 512 + (CAM.f * x) / z;
      if (sx > 760 && z < 58) continue; // خلف الفارس جيش اليمين أقرب
      out.push({ x: x + (r() - 0.5) * 0.06, z: z + (r() - 0.5) * 0.4, seed: Math.floor(r() * 1e6), spear: r() < 0.16 ? "R" : undefined, banner: r() < 0.07 });
    }
  }
  // جيش اليمين: أقرب قليلاً (٤٤–٥٠م)
  for (let row = 0; row < 4; row++) {
    const z = 50 - row * 2;
    for (let x = xAt(760, z); x < xAt(1060, z); x += 0.62) out.push({ x: x + (row % 2) * 0.31, z, seed: Math.floor(r() * 1e6), spear: r() < 0.2 ? "R" : undefined, banner: r() < 0.1 });
  }
  return out.sort((a, b) => b.z - a.z);
};
const ARMY = army();

export const KeyArt2: React.FC = () => {
  const frame = useCurrentFrame();
  const g = new Guides();
  const showGuides = frame >= 1;
  const units = ARMY;
  const s1x = xAt(S1.sx, S1.z), s2x = xAt(S2.sx, S2.z);
  const front = [
    <g key="s2">{Soldier({ x: s2x, z: S2.z, seed: 77, near: true, g })}</g>,
    <g key="s1">{Soldier({ x: s1x, z: S1.z, seed: 78, spear: "R", banner: true, near: true, g })}</g>,
  ];
  const horse = Horse({ g });
  const rider = Rider({ g });
  // خطوط الأرض بالعمق: تتراكم قرب الأفق لأن المسافة نفسها تصغر كلما بعدت
  const depthLines = [12, 15, 20, 30, 45, 70, 120].map((z) => ({ z, y: proj({ x: 0, y: 0, z }).y }));
  return (
    <AbsoluteFill style={{ background: "#2a2a2c" }}>
      <svg width={KEY2_W} height={KEY2_H} viewBox={`0 0 ${KEY2_W} ${KEY2_H}`}>
        <defs>
          <filter id="b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="b5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="b12" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
          <filter id="b26" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="26" /></filter>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7d7464" /><stop offset="0.28" stopColor="#a8957a" /><stop offset="0.5" stopColor="#dcc7a0" /><stop offset="0.64" stopColor="#ecdcb6" /><stop offset="0.8" stopColor="#d4bb94" />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a9aeb6" /><stop offset="0.4" stopColor="#62666e" /><stop offset="1" stopColor="#1f2125" /></linearGradient>
          <linearGradient id="horseFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5d4d42" /><stop offset="0.45" stopColor="#372d29" /><stop offset="1" stopColor="#1b1514" /></linearGradient>
          <linearGradient id="horseNeck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1f1a1a" /><stop offset="1" stopColor="#090808" /></linearGradient>
          <linearGradient id="cloak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2c2b2b" /><stop offset="0.5" stopColor="#101010" /><stop offset="1" stopColor="#040404" /></linearGradient>
          <linearGradient id="vest" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7a7b81" /><stop offset="0.55" stopColor="#585960" /><stop offset="1" stopColor="#35363c" /></linearGradient>
          <linearGradient id="sleeve" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4a4f" /><stop offset="1" stopColor="#1d1d20" /></linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6e5c45" /><stop offset="0.4" stopColor="#7d6849" /><stop offset="1" stopColor="#a1845e" /></linearGradient>
          <linearGradient id="rimL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={SUN.rim} stopOpacity="1" /><stop offset="0.3" stopColor={SUN.rim} stopOpacity="0" /></linearGradient>
          <linearGradient id="groundDust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a58a66" stopOpacity="0" /><stop offset="0.3" stopColor="#a58a66" stopOpacity="0.75" /><stop offset="0.7" stopColor="#9c8160" stopOpacity="0.92" /><stop offset="1" stopColor="#9c8160" stopOpacity="0.6" /></linearGradient>
          <radialGradient id="dust" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#c2a37a" stopOpacity="0.9" /><stop offset="1" stopColor="#b08f66" stopOpacity="0" /></radialGradient>
          <filter id="cloudDark" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0055 0.013" numOctaves="5" seed="7" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.6 0 0 0 -2.45" /></filter>
          <filter id="cloudMid" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves="4" seed="19" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 5 0 0 -2.5" /></filter>
          <linearGradient id="cmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="0.3" stopColor="#fff" /><stop offset="0.52" stopColor="#555" /><stop offset="0.62" stopColor="#000" /></linearGradient>
          <linearGradient id="cmx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#777" /><stop offset="0.35" stopColor="#bbb" /><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#fff" /></linearGradient>
          <mask id="cloudMask"><rect width={1024} height={340} fill="url(#cmg)" /><rect width={1024} height={340} fill="url(#cmx)" style={{ mixBlendMode: "multiply" }} /></mask>
          {[["relS", 2, 3, 0.3, -0.22], ["relM", 5, 6, 0.34, -0.25], ["relB", 9, 9, 0.38, -0.28]].map(([id, b, sc, k3, k4]) => (
            <filter key={id as string} id={id as string} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation={b as number} result="h" />
              <feDiffuseLighting in="h" surfaceScale={sc as number} diffuseConstant={1} lightingColor="#ffffff" result="d"><feDistantLight azimuth={200} elevation={40} /></feDiffuseLighting>
              <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1={0} k2={1} k3={k3 as number} k4={k4 as number} result="m" />
              <feComposite in="m" in2="SourceAlpha" operator="in" />
            </filter>
          ))}
          <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.9 -0.28" /></filter>
        </defs>

        {/* السماء والأفق: الأفق عند السطر ٢١٩ = ارتفاع الكاميرا ١٫٩٠م */}
        <rect width={1024} height={360} fill="url(#sky)" />
        <g mask="url(#cloudMask)">
          <rect width={1024} height={340} fill="#1d1d1b" filter="url(#cloudDark)" />
          <rect width={1024} height={340} fill="#6d5a45" filter="url(#cloudMid)" opacity={0.8} />
        </g>
        <ellipse cx={80} cy={185} rx={230} ry={62} fill="#f3e6c2" opacity={0.9} filter="url(#b12)" />
        <ellipse cx={300} cy={208} rx={260} ry={30} fill="#ecd9b0" opacity={0.9} filter="url(#b12)" />
        <g filter="url(#b26)" opacity={0.55}>
          <ellipse cx={430} cy={50} rx={170} ry={46} fill="#161615" />
          <ellipse cx={870} cy={70} rx={190} ry={60} fill="#1f2020" />
        </g>
        {/* تلال بعيدة على الأفق */}
        <path d={smoothPath([{ x: 0, y: 226 }, { x: 120, y: 214 }, { x: 260, y: 222 }, { x: 420, y: 212 }, { x: 600, y: 220 }, { x: 800, y: 214 }, { x: 1024, y: 222 }, { x: 1024, y: 240 }, { x: 0, y: 240 }], true)} fill="#8a7a62" opacity={0.7} filter="url(#b2)" />
        {/* الأرض */}
        <rect y={CAM.horizonY + 4} width={1024} height={576} fill="url(#ground)" />
        {depthLines.map((d, i) => <path key={"dl" + i} d={`M 0 ${d.y} Q 512 ${d.y + 3} 1024 ${d.y}`} stroke="#5f4d38" strokeWidth={Math.max(0.6, 3 - i * 0.4)} opacity={0.35} fill="none" filter="url(#b2)" />)}

        {/* الجيش */}
        {units.map((u, i) => <Soldier key={i} x={u.x} z={u.z} seed={u.seed} spear={u.spear} banner={u.banner} />)}
        <rect y={CAM.horizonY} width={1024} height={130} fill="#c8a97c" opacity={0.1} />
        <rect y={290} width={1024} height={200} fill="url(#groundDust)" />

        {/* غبار عند الأقدام وخلف الفارس */}
        <g filter="url(#b12)">
          <ellipse cx={880} cy={450} rx={170} ry={70} fill="url(#dust)" />
          <ellipse cx={990} cy={540} rx={130} ry={60} fill="url(#dust)" />
          <ellipse cx={150} cy={500} rx={160} ry={60} fill="#9c8462" opacity={0.6} />
        </g>

        {front}
        {horse}
        {rider}

        <rect width={1024} height={576} filter="url(#grain)" opacity={0.35} style={{ mixBlendMode: "overlay" }} />
        <rect width={1024} height={576} fill="#000" opacity={0.05} />

        {showGuides && (
          <g fontFamily="Tahoma, Arial" fontSize={9} direction="rtl">
            <line x1={0} y1={CAM.horizonY} x2={1024} y2={CAM.horizonY} stroke="#ff4d6d" strokeWidth={1.2} strokeDasharray="6 4" />
            <text x={1018} y={CAM.horizonY - 4} fill="#ff4d6d" textAnchor="start">خط الأفق = ارتفاع الكاميرا ١٫٩٠م (عدسة طويلة)</text>
            {depthLines.map((d, i) => <text key={"dt" + i} x={6} y={d.y - 2} fill="#ffb34d" textAnchor="start" direction="ltr">{`${d.z}m`}</text>)}
            {g.list.map((q, i) => q.dot ? (
              <g key={"g" + i}><circle cx={q.pts[0].x} cy={q.pts[0].y} r={3} fill={q.color} />{q.label && <text x={q.pts[0].x + 5} y={q.pts[0].y - 4} fill={q.color} textAnchor="end" stroke="#000" strokeWidth={2.5} paintOrder="stroke">{q.label}</text>}</g>
            ) : (
              <g key={"g" + i}><path d={"M " + q.pts.map((p) => `${p.x} ${p.y}`).join(" L ")} stroke={q.color} strokeWidth={0.9} fill="none" opacity={0.9} />{q.label && <text x={q.pts[q.pts.length - 1].x + 4} y={q.pts[q.pts.length - 1].y + 3} fill={q.color} textAnchor="end" stroke="#000" strokeWidth={2.5} paintOrder="stroke">{q.label}</text>}</g>
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
