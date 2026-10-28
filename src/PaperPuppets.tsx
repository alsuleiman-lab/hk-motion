// Paper stop-motion puppets (Man, scenes) — kept from the «خرافات السيد البدوي» montage (approved 2026-10-25) for reuse.
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

/**
 * Paper cut-out puppets for the four «animation» requests of the Badawi video (collage-broll-local style: flat paper shapes, torn edge, stop-motion every 3rd frame,
 * NO facial features — every person is a faceless silhouette, user rule 2026-10-22). Every scene takes ABSOLUTE composition seconds (`at`, `until`).
 */
const FPS = 30;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
/** stop-motion clock: seconds quantised to 1/10 s (every 3rd frame) */
const useQ = () => { const f = useCurrentFrame(); return Math.floor(f / 3) * 3 / FPS; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * clamp(u);

export const PC = {
  cream: "#efe3c8", sand: "#d9c49a", brown: "#7a5233", dark: "#3b2a1c", mustard: "#d9a441", terra: "#b5573a", slate: "#4a6a82",
  white: "#f6efe0", rope: "#c9a66b", skin: "#e0b48a", night: "#2f3f52", sea: "#4f7894", sky: "#c9d9de", ash: "#8d8577",
};

/** torn-paper edge + soft shadow, applied once to a whole group */
export const PaperDefs: React.FC<{ id?: string }> = ({ id = "pe" }) => (
  <defs>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d" />
      <feDropShadow dx="3" dy="5" stdDeviation="3.5" floodColor="#1e130a" floodOpacity="0.38" />
    </filter>
  </defs>
);

type ManProps = {
  x: number; y: number; s?: number; flip?: boolean; robe?: string; robe2?: string; turban?: string; turbanW?: number; veil?: string | null;
  armL?: number; armR?: number; lenL?: number; lenR?: number; tilt?: number; patches?: boolean; bob?: number; scaleY?: number; hand?: string;
};
/** faceless paper man; origin = feet centre; ~330 units tall. arm angles in degrees (0 = hanging down, 90 = out to the side, 180 = straight up) */
export const Man: React.FC<ManProps> = ({ x, y, s = 1, flip = false, robe = PC.white, robe2 = PC.rope, turban = PC.white, turbanW = 62, veil = null, armL = 15, armR = 15, lenL = 120, lenR = 120, tilt = 0, patches = false, bob = 0, scaleY = 1, hand = PC.skin }) => {
  const sx = flip ? -s : s;
  const arm = (side: -1 | 1, ang: number, len: number) => (
    <g transform={`translate(${side * 58},-232) rotate(${side * -ang})`}>
      <rect x={-13} y={0} width={26} height={len} rx={12} fill={robe} stroke={robe2} strokeWidth={3} />
      <circle cx={0} cy={len + 4} r={16} fill={hand} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y + bob}) scale(${sx},${s * scaleY}) rotate(${tilt})`}>
      {arm(-1, armL, lenL)}
      {arm(1, armR, lenR)}
      <path d="M-62,-236 Q0,-262 62,-236 L96,-4 Q0,10 -96,-4 Z" fill={robe} stroke={robe2} strokeWidth={4} />
      <path d="M-18,-246 L0,-120 L18,-246" fill="none" stroke={robe2} strokeWidth={5} />
      {patches ? (<><rect x={-52} y={-130} width={30} height={30} fill={PC.terra} transform="rotate(-8 -37 -115)" /><rect x={20} y={-70} width={34} height={28} fill={PC.slate} transform="rotate(6 37 -56)" /><path d="M-70,-14 l12,-22 l12,22 l12,-22 l12,22 l12,-22" fill="none" stroke={PC.dark} strokeWidth={4} /></>) : null}
      <rect x={-17} y={-262} width={34} height={30} fill={hand} />
      <circle cx={0} cy={-286} r={36} fill={hand} />
      {veil ? <path d="M-36,-286 Q0,-296 36,-286 L36,-262 Q0,-246 -36,-262 Z" fill={veil} stroke={PC.dark} strokeWidth={3} /> : null}
      <ellipse cx={0} cy={-326} rx={turbanW} ry={turbanW * 0.62} fill={turban} stroke={PC.dark} strokeWidth={3.5} />
      <path d={`M${-turbanW * 0.8},-326 Q0,${-326 - turbanW * 0.45} ${turbanW * 0.8},-326 M${-turbanW * 0.7},-308 Q0,${-308 - turbanW * 0.3} ${turbanW * 0.7},-308`} fill="none" stroke={PC.dark} strokeWidth={3} opacity={0.55} />
    </g>
  );
};

const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='1.6'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/></g></svg>`;
const Sheet: React.FC<{ w: number; h: number; bg: string; children: React.ReactNode; at: number; until: number; grain?: boolean; lattice?: boolean; hard?: boolean; style?: React.CSSProperties }> = ({ w, h, bg, children, at, until, grain = true, lattice = false, hard = false, style }) => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  if (t < at - 0.02 || t > until + 0.4) return null;
  const k = hard ? (t <= until ? 1 : 0) : Math.min(ease((t - at) / 0.35), ease((until + 0.35 - t) / 0.35));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", opacity: k, transform: hard ? undefined : `translateY(${(1 - k) * 30}px)`, background: bg, ...style }}>
      {lattice ? <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${fr * 0.25}px ${fr * 0.15}px`, opacity: 0.16 }} /> : null}
      {grain ? <div style={{ position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "multiply", backgroundImage: "radial-gradient(rgba(70,45,20,.55) 1px, transparent 1.4px)", backgroundSize: "9px 9px" }} /> : null}
      {children}
    </div>
  );
};

/** 1) the saint on the roof: giant turban + veil + ragged robe, a very long rosary dangling to a man below who greets it  (instruction 4) */
export const RoofScene: React.FC<{ at: number; until: number; w?: number; h?: number; beadsAt: number; greetAt: number }> = ({ at, until, w = 935, h = 1080, beadsAt, greetAt }) => {
  const q = useQ();
  const t = q - at;
  const wob = Math.sin(q * 5) * 1.6;
  const dangle = ease((q - beadsAt) / 4.2);                    // rosary length 0 → 1
  const ropeLen = 640 * dangle;
  const grab = clamp((q - greetAt) / 0.6);
  const shake = grab > 0 ? Math.sin(q * 22) * 9 * grab : 0;
  const nBeads = Math.round(34 * dangle);
  const roofY = 400;
  return (
    <Sheet w={w} h={h} bg={PC.sand} at={at} until={until}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs />
        <g filter="url(#pe)">
          <rect x={0} y={760} width={w} height={320} fill={PC.brown} />
          <rect x={90} y={roofY} width={520} height={400} fill={PC.cream} stroke={PC.dark} strokeWidth={4} />
          <rect x={70} y={roofY - 26} width={560} height={34} fill={PC.terra} stroke={PC.dark} strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={86 + i * 80} y={roofY - 52} width={46} height={30} fill={PC.terra} stroke={PC.dark} strokeWidth={3} />)}
          <rect x={150} y={roofY + 90} width={90} height={130} rx={40} fill={PC.slate} stroke={PC.dark} strokeWidth={4} />
          <rect x={300} y={roofY + 90} width={90} height={130} rx={40} fill={PC.slate} stroke={PC.dark} strokeWidth={4} />
          <rect x={470} y={roofY + 520 - 330} width={90} height={160} rx={6} fill={PC.mustard} stroke={PC.dark} strokeWidth={4} opacity={0} />
          <rect x={420} y={roofY + 150} width={120} height={250} rx={8} fill={PC.brown} stroke={PC.dark} strokeWidth={4} />
        </g>
        {/* the saint: sits on the roof edge, enormous turban */}
        <g filter="url(#pe)">
          <Man x={500} y={roofY - 26} s={0.95} robe="#8a6a49" robe2={PC.dark} turban={PC.cream} turbanW={118} veil={PC.slate} armL={95} armR={20} lenL={96} lenR={110} patches tilt={wob} bob={Math.sin(q * 3) * 2} />
        </g>
        {/* rosary: from his raised hand along the wall down to the street */}
        <g filter="url(#pe)">
          {dangle > 0 ? (
            <>
              <line x1={398} y1={roofY - 190} x2={398} y2={roofY - 190 + ropeLen} stroke={PC.dark} strokeWidth={4} />
              {Array.from({ length: nBeads }).map((_, i) => (
                <circle key={i} cx={398 + Math.sin(i * 0.9 + q * 3) * 3} cy={roofY - 190 + (i / 34) * 640} r={i % 10 === 9 ? 17 : 11} fill={i % 10 === 9 ? PC.mustard : PC.terra} stroke={PC.dark} strokeWidth={2.5} />
              ))}
            </>
          ) : null}
        </g>
        {/* the man below greets the dangling rosary */}
        <g filter="url(#pe)">
          <Man x={330 + shake} y={940 - clamp(grab) * Math.abs(Math.sin(q * 11)) * 14} s={0.8} robe={PC.white} robe2={PC.rope} turban={PC.slate} turbanW={46} armL={20} armR={grab > 0 ? 165 : 40} lenL={110} lenR={120} hand={PC.skin} tilt={grab > 0 ? -4 + Math.sin(q * 14) * 3 : 0} />
        </g>
        {/* the counter «١٠٠٠ حبة» */}
        {dangle > 0.2 ? <g transform="translate(640,230) rotate(-6)"><rect x={-110} y={-52} width={220} height={84} rx={14} fill={PC.white} stroke={PC.dark} strokeWidth={4} /><text x={0} y={5} textAnchor="middle" fontFamily="Noto Kufi Arabic" fontWeight={800} fontSize={44} fill={PC.terra}>ألف حبّة!</text></g> : null}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center", fontFamily: "Almarai", fontWeight: 800, fontSize: 38, color: PC.white, textShadow: "0 3px 8px rgba(0,0,0,.6)", direction: "rtl", opacity: clamp(t / 0.5) }}>مقبوض على السطوح</div>
    </Sheet>
  );
};

/** 2) the milk-skin story: Badawi points a finger, the skin spills, a huge snake comes out and the man does not notice (instruction 5) */
export const MilkScene: React.FC<{ at: number; until: number; w?: number; h?: number; pointAt: number; spillAt: number; snakeAt: number; unawareAt: number }> = ({ at, until, w = 760, h = 640, pointAt, spillAt, snakeAt, unawareAt }) => {
  const q = useQ();
  const slide = ease((q - (pointAt - 1.2)) / 1.0);
  const point = clamp((q - pointAt) / 0.5);
  const tipU = eio((q - spillAt) / 0.9);
  const snake = ease((q - snakeAt) / 1.6);
  const unaware = clamp((q - unawareAt) / 0.6);
  const sway = Math.sin(q * 6) * 14 * snake;
  const milk = clamp((q - spillAt - 0.4) / 1.4);
  return (
    <Sheet w={w} h={h} bg="#8fb0b9" at={at} until={until} style={{ borderRadius: 26, border: `8px solid ${PC.white}`, boxShadow: "0 22px 44px rgba(0,0,0,.4)" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs id="pm" />
        <rect x={0} y={h - 150} width={w} height={150} fill={PC.sand} />
        <g filter="url(#pm)">
          {/* milk puddle */}
          <ellipse cx={330} cy={h - 70} rx={20 + milk * 190} ry={6 + milk * 34} fill={PC.white} stroke={PC.ash} strokeWidth={2.5} />
          {/* the man, his back half-turned: does not see the snake */}
          <Man x={210} y={h - 60} s={0.82} robe={PC.cream} robe2={PC.brown} turban={PC.terra} turbanW={48} armL={20} armR={110 - tipU * 30} lenL={110} lenR={110} flip={unaware > 0.5} tilt={Math.sin(q * 8) * 2 * (1 - snake)} />
          {/* the water-skin he carries */}
          <g transform={`translate(${290 + tipU * 40},${h - 270 + tipU * 60}) rotate(${tipU * 118})`}>
            <path d="M-46,-40 Q-60,40 -30,78 Q0,96 30,78 Q60,40 46,-40 Q0,-60 -46,-40 Z" fill={PC.brown} stroke={PC.dark} strokeWidth={4} />
            <rect x={-12} y={-70} width={24} height={34} rx={6} fill={PC.mustard} stroke={PC.dark} strokeWidth={3} />
          </g>
          {/* the saint: giant turban, veil, slides in from the left, raises one finger */}
          <Man x={lerp(-160, 560, slide)} y={h - 60} s={0.95} robe="#8a6a49" robe2={PC.dark} turban={PC.cream} turbanW={96} veil={PC.slate} armL={15} armR={40 + point * 120} lenL={105} lenR={140 + point * 40} flip patches />
          {/* the snake rising out of the skin, swaying over the man */}
          {snake > 0 ? (
            <g>
              <path d={`M300,${h - 250} C ${360 + sway},${h - 300 - 160 * snake} ${240 - sway},${h - 330 - 230 * snake} ${300 + sway},${h - 340 - 330 * snake * 0.9}`} fill="none" stroke={PC.ash} strokeWidth={46} strokeLinecap="round" />
              <path d={`M300,${h - 250} C ${360 + sway},${h - 300 - 160 * snake} ${240 - sway},${h - 330 - 230 * snake} ${300 + sway},${h - 340 - 330 * snake * 0.9}`} fill="none" stroke={PC.terra} strokeWidth={10} strokeDasharray="22 26" strokeLinecap="round" />
              <ellipse cx={300 + sway} cy={h - 346 - 330 * snake * 0.9} rx={48} ry={34} fill={PC.ash} stroke={PC.dark} strokeWidth={4} />
              <path d={`M${300 + sway},${h - 316 - 330 * snake * 0.9} l-4,34 M${300 + sway},${h - 316 - 330 * snake * 0.9} l12,30`} stroke={PC.terra} strokeWidth={5} />
            </g>
          ) : null}
        </g>
      </svg>
    </Sheet>
  );
};

/** 3) Abdel Aal and the bull: behind the isolated Sheikh; Badawi's paper arm reaches from his side, BEHIND the Sheikh's back, to lift the child (instruction 7). `abdalSide`: where the child is. */
export const AbdalScene: React.FC<{ hard?: boolean; at: number; until: number; abdalSide: "left" | "right"; times: { baby: number; manger: number; bull: number; lift: number; rage: number; egypt: number; iraq: number; crowd: number; arm: number; reach: number; save: number } }> = ({ at, until, abdalSide, times, hard }) => {
  const q = useQ();
  const W = 1920, H = 1080;
  const dir = abdalSide === "right" ? 1 : -1;             // +1: child on the right, Badawi on the left
  const cx = (off: number) => 960 + dir * off;             // helper: x measured outward from the centre on the child's side
  const cr = (off: number) => cx(off + 170);               // user 2026-10-25: the child's group sits further out so it comes out from behind the Sheikh's back
  const bull = ease((q - times.bull) / 1.3);
  const lift = eio((q - times.lift) / 1.2);
  const rage = clamp((q - times.rage) / 0.5);
  const crowd = clamp((q - times.crowd) / 0.6);
  const arm = ease((q - times.arm) / (times.reach - times.arm));
  const save = eio((q - times.save) / 1.4);
  const babyY = 760 - lift * 190 * (1 - save) + save * 40;
  const babyX = lerp(cr(520), cx(-560), save);
  const bullX = lerp(cr(1000), cr(520 + 10), bull) + (rage > 0 ? Math.sin(q * 24) * 8 * rage * (1 - save) : 0);
  const hip = Math.sin(q * 7) * 4;
  const badX = cx(-620);
  const handTipX = lerp(badX + dir * -0, babyX - dir * 20, arm);
  return (
    <Sheet w={W} h={H} bg="linear-gradient(135deg,#6b4a2e,#8a6a49 52%,#4a3322)" at={at} until={until} grain lattice hard={hard} style={{ zIndex: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs id="pa" />
        <rect x={0} y={800} width={W} height={280} fill="#8a6a49" />
        <g filter="url(#pa)">
          {/* manger of straw on the child's side */}
          {q > times.manger ? <g><rect x={cr(520) - 150} y={820} width={300} height={70} rx={10} fill={PC.mustard} stroke={PC.dark} strokeWidth={4} /><path d={`M${cr(520) - 140},820 l20,-34 l20,34 l20,-34 l20,34 l20,-34 l20,34 l20,-34 l20,34 l20,-34 l20,34 l20,-34 l20,34`} fill="none" stroke={PC.dark} strokeWidth={4} /></g> : null}
          {/* the child: a small swaddled paper figure */}
          {q > times.baby ? (
            <g transform={`translate(${babyX},${babyY}) rotate(${lift > 0 && save < 1 ? Math.sin(q * 9) * 9 : 0})`}>
              <ellipse cx={0} cy={0} rx={50} ry={64} fill={PC.cream} stroke={PC.brown} strokeWidth={4} />
              <circle cx={0} cy={-76} r={30} fill={PC.skin} />
              <path d="M-34,-92 Q0,-122 34,-92" fill={PC.white} stroke={PC.dark} strokeWidth={3} />
            </g>
          ) : null}
          {/* the bull: charges in, horn hooks the baby's clothes */}
          {bull > 0 ? (
            <g transform={`translate(${bullX},${770 + hip}) scale(${dir},1)`}>
              <rect x={-170} y={-120} width={290} height={140} rx={60} fill="#3f3328" stroke={PC.dark} strokeWidth={4} />
              {[-130, -60, 30, 90].map((lx, i) => <rect key={i} x={lx} y={10} width={26} height={90 - (i % 2) * Math.abs(Math.sin(q * 14)) * 10} rx={8} fill="#3f3328" stroke={PC.dark} strokeWidth={3} />)}
              <rect x={90} y={-150} width={110} height={90} rx={34} fill="#4a3b2d" stroke={PC.dark} strokeWidth={4} />
              <path d="M170,-150 q40,-30 28,-86 M120,-150 q-30,-26 -20,-80" fill="none" stroke={PC.cream} strokeWidth={14} strokeLinecap="round" />
              <path d="M-170,-70 q-40,-10 -34,40" fill="none" stroke={PC.dark} strokeWidth={8} />
            </g>
          ) : null}
          {/* Badawi: on the opposite side, giant turban + veil, arm stretched across the whole picture BEHIND the Sheikh */}
          {/* user 2026-10-25: the stretched arm (y≈493) must leave from HIS shoulder, not pass over his head → he stands raised on a paper mound (shoulder = y − 232·1.05) */}
          {q > times.iraq ? <rect x={badX - 150} y={737} width={300} height={170} rx={18} fill="#7a5a3c" stroke={PC.dark} strokeWidth={4} /> : null}
          {q > times.iraq ? <Man x={badX} y={737} s={1.05} robe="#8a6a49" robe2={PC.dark} turban={PC.cream} turbanW={112} veil={PC.slate} armL={15} armR={arm > 0 ? 90 : 20} lenL={120} lenR={120} flip={dir > 0 ? false : true} patches bob={Math.sin(q * 3) * 2} /> : null}
          {arm > 0 ? (
            <g>
              <rect x={Math.min(badX, handTipX)} y={470} width={Math.abs(handTipX - badX)} height={46} rx={22} fill="#8a6a49" stroke={PC.dark} strokeWidth={4} />
              <circle cx={handTipX} cy={493} r={34} fill={PC.skin} stroke={PC.dark} strokeWidth={3} />
            </g>
          ) : null}
          {/* the crowd that cannot help: small jumping silhouettes */}
          {crowd > 0 ? [0, 1, 2].map((i) => <Man key={i} x={cr(400 + i * 110)} y={900 - Math.abs(Math.sin(q * 9 + i * 1.7)) * 26} s={0.42} robe={[PC.slate, PC.terra, PC.cream][i]} robe2={PC.dark} turban={PC.white} turbanW={40} armL={170} armR={170} lenL={90} lenR={90} />) : null}
        </g>
        {/* place tags */}
        {q > times.egypt ? <g transform={`translate(${cr(470)},300) rotate(${-4 * dir})`}><rect x={-120} y={-44} width={240} height={80} rx={14} fill={PC.white} stroke={PC.dark} strokeWidth={4} /><text x={0} y={14} textAnchor="middle" fontFamily="Noto Kufi Arabic" fontWeight={800} fontSize={46} fill={PC.terra}>مصر</text></g> : null}
        {q > times.iraq ? <g transform={`translate(${badX},230) rotate(${4 * dir})`}><rect x={-120} y={-44} width={240} height={80} rx={14} fill={PC.white} stroke={PC.dark} strokeWidth={4} /><text x={0} y={14} textAnchor="middle" fontFamily="Noto Kufi Arabic" fontWeight={800} fontSize={46} fill={PC.slate}>العراق</text></g> : null}
      </svg>
    </Sheet>
  );
};

/** 4) Badawi flicks Ibn Daqiq al-Eid, who flies away over the sea trailing flour, into an island (instruction 8). Full-frame cut-away, huge and funny. */
export const DaqiqScene: React.FC<{ at: number; until: number; flickAt: number; landAt: number; hard?: boolean }> = ({ at, until, flickAt, landAt, hard }) => {
  const q = useQ();
  const W = 1920, H = 1080;
  const fly = eio((q - flickAt) / (landAt - flickAt));
  const flick = clamp((q - (flickAt - 0.4)) / 0.4);
  const px = lerp(700, 1500, fly), py = 640 - Math.sin(fly * Math.PI) * 420 - fly * 20;
  const spin = fly * 720;
  const puffs = Array.from({ length: 14 }).map((_, i) => ({ k: i, u: clamp(fly - i * 0.05) }));
  return (
    <Sheet w={W} h={H} bg={PC.sky} at={at} until={until} hard={hard} style={{ zIndex: 5 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs id="pd" />
        <rect x={0} y={760} width={W} height={320} fill={PC.sea} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${i * 420},${800 + (i % 2) * 40} q60,-28 120,0 t120,0 t120,0`} fill="none" stroke={PC.white} strokeWidth={6} opacity={0.7} />)}
        <g filter="url(#pd)">
          {/* island with a palm */}
          <ellipse cx={1560} cy={800} rx={300} ry={70} fill={PC.sand} stroke={PC.dark} strokeWidth={4} />
          <path d="M1580,790 q-10,-200 20,-330" fill="none" stroke={PC.brown} strokeWidth={22} strokeLinecap="round" />
          {[-90, -30, 30, 90, 140].map((a, i) => <path key={i} d={`M1600,462 q${a},-70 ${a * 1.6},${20 + (i % 2) * 22}`} fill="none" stroke={PC.slate} strokeWidth={20} strokeLinecap="round" />)}
          {/* Badawi: giant turban + veil, at the left, finger flicking */}
          <Man x={300} y={900} s={1.5} robe="#8a6a49" robe2={PC.dark} turban={PC.cream} turbanW={118} veil={PC.slate} armL={15} armR={60 + flick * 90} lenL={120} lenR={150} patches bob={Math.sin(q * 3) * 3} />
          {/* flour puffs along the trajectory */}
          {puffs.map((p) => p.u > 0 && p.u < 1 ? <circle key={p.k} cx={lerp(700, 1500, p.u - 0.02)} cy={640 - Math.sin((p.u - 0.02) * Math.PI) * 420 + (p.k % 3) * 18} r={26 + p.k * 2.5} fill={PC.white} opacity={0.82 - p.u * 0.3} /> : null)}
          {/* the flying scholar: sack of flour on his back, robe flapping */}
          <g transform={`translate(${px},${py}) rotate(${spin})`}>
            <Man x={0} y={0} s={0.9} robe={PC.cream} robe2={PC.brown} turban={PC.white} turbanW={52} armL={170} armR={150} lenL={115} lenR={115} tilt={Math.sin(q * 20) * 6} />
            <g transform="translate(70,-170) rotate(18)"><rect x={-44} y={-52} width={88} height={104} rx={20} fill={PC.white} stroke={PC.dark} strokeWidth={4} /><text x={0} y={14} textAnchor="middle" fontFamily="Noto Kufi Arabic" fontWeight={800} fontSize={34} fill={PC.terra}>دقيق</text></g>
          </g>
        </g>
        <text x={960} y={150} textAnchor="middle" fontFamily="Noto Kufi Arabic" fontWeight={800} fontSize={96} fill={PC.white} stroke={PC.dark} strokeWidth={9} paintOrder="stroke" opacity={clamp((q - flickAt) / 0.3)} transform={`rotate(${-3 + Math.sin(q * 14) * 1.2} 960 150)`}>طيّرت دقيقك!</text>
      </svg>
    </Sheet>
  );
};

/** tiny helper for staged jitter-free random (unused externally) */
export const rr = (i: number) => random("badawi-" + i);
export const _i = interpolate;
void AbsoluteFill;
