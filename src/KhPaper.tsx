import React from "react";
import { AbsoluteFill, Easing, getInputProps, useCurrentFrame } from "remotion";
const NOROUGH = (getInputProps() as { noRough?: boolean }).noRough === true;   // benchmark switch: draw the paper pieces without the SVG torn-edge filter
import { TITLE } from "./EuKit";

/**
 * Paper cut-out illustrations in the AGREED style (skills paper-montage + collage-selection; user 2026-10-23: «الصور غير جميلة… على شكل القصاصات الورقية… وفيها وجه ونحن نهينا عن رسم الوجوه»):
 *  flat strong floors (#c8553d #e0b04a #d98f4e #b7a58a), BLACK paper silhouettes with torn edges (never a face), objects in black + white halftone dots, ONE accent colour per frame,
 *  stop-motion on twos (10-12 poses a second) with a tiny seeded hand-shake, pieces enter from the edges with a small overshoot.
 */
const INK = "#1a1411", PAPER = "#f3ead3";
export const FLOOR = { orange: "#d98f4e", rust: "#c8553d", mustard: "#e0b04a", beige: "#b7a58a" };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const FPS = 30;
const ease = (x: number) => Easing.bezier(0.2, 0.9, 0.3, 1)(clamp(x));
/** stop-motion time in seconds (poses every 2 frames) */
const useStep = () => Math.floor(useCurrentFrame() / 2) * 2 / FPS;

/** SVG defs used by every piece: torn-edge filter + halftone dot pattern (mount once per scene) */
export const PaperDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="khRough" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="8" /></filter>
      <pattern id="khDots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="7.5" cy="7.5" r="3.4" fill={PAPER} /></pattern>
      <pattern id="khDotsSm" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill={PAPER} /></pattern>
    </defs>
  </svg>
);
const Grain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.2, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <svg width="100%" height="100%"><filter id="khGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" /></filter><rect width="100%" height="100%" filter="url(#khGrain)" /></svg>
  </AbsoluteFill>
);
/** the flat floor of a scene (+ faint dots + grain) */
export const Floor: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => (
  <AbsoluteFill style={{ background: color, overflow: "hidden" }}>
    <PaperDefs />
    {children}
    <Grain />
  </AbsoluteFill>
);

/** a piece that enters from an edge (stop-motion, overshoot) and then breathes with a 1-2 px hand-shake */
export const Pc: React.FC<{ at: number; x: number; y: number; w: number; h: number; rot?: number; from?: "left" | "right" | "top" | "bottom"; seed?: number; z?: number; children: React.ReactNode }> = ({ at, x, y, w, h, rot = 0, from = "bottom", seed = 1, z = 1, children }) => {
  const t = useStep() - at;
  if (t < 0) return null;
  const u = clamp(t / 0.42), e = ease(u), over = u < 1 ? 1 : 1 + 0.02 * Math.sin(Math.min(1, (t - 0.42) / 0.3) * Math.PI) * (t < 0.72 ? 1 : 0);
  const far = 1100 * (1 - e);
  const dx = from === "left" ? -far : from === "right" ? far : 0, dy = from === "top" ? -far : from === "bottom" ? far : 0;
  const j = (n: number) => Math.sin((Math.floor(t * 12) + seed * 7) * (n + 1.7)) * 1.3;
  return (
    <div style={{ position: "absolute", left: x + dx + j(1), top: y + dy + j(2), width: w, height: h, zIndex: z, transform: `rotate(${rot + j(3) * 0.35}deg) scale(${over})`, filter: "drop-shadow(0 10px 0 rgba(40,20,8,.28))" }}>
      <div style={{ width: "100%", height: "100%", filter: NOROUGH ? undefined : "url(#khRough)" }}>{children}</div>
    </div>
  );
};

/* ───────── pieces (all black / halftone / cream; never a face) ───────── */
/** a robed man seen from behind-front: black cone robe + black head hidden under a big cream turban (the big turban = the Sheikh/leader, small = the follower) */
export const Sil: React.FC<{ turban?: number; color?: string }> = ({ turban = 1, color = INK }) => (
  <svg viewBox="0 0 200 330" width="100%" height="100%" style={{ overflow: "visible" }}>
    <path d="M28 330 Q24 170 100 150 Q176 170 172 330Z" fill={color} />
    <circle cx="100" cy="112" r="40" fill={color} />
    <g transform={`translate(100 92) scale(${turban}) translate(-100 -92)`}>
      <ellipse cx="100" cy="82" rx="62" ry="38" fill={PAPER} />
      <path d="M50 86 Q100 120 150 86" fill="none" stroke="#cdbf9d" strokeWidth="7" />
      <path d="M62 66 Q100 44 138 66" fill="none" stroke="#cdbf9d" strokeWidth="6" />
      <path d="M132 100 Q160 120 150 160" fill="none" stroke={PAPER} strokeWidth="14" strokeLinecap="round" />
    </g>
    <circle cx="100" cy="230" r="46" fill="url(#khDots)" opacity=".9" clipPath="inset(0)" />
  </svg>
);
/** Medina: a black mosque with the green dome shown as a halftone dome (accent) and two minarets */
export const Mosque: React.FC<{ dome?: string }> = ({ dome = "#e0b04a" }) => (
  <svg viewBox="0 0 520 400" width="100%" height="100%" style={{ overflow: "visible" }}>
    <rect x="30" y="250" width="460" height="150" fill={INK} />
    <rect x="30" y="250" width="460" height="150" fill="url(#khDotsSm)" opacity=".55" />
    <path d="M150 250 Q150 110 260 110 Q370 110 370 250Z" fill={INK} />
    <path d="M150 250 Q150 110 260 110 Q370 110 370 250Z" fill="url(#khDots)" opacity=".6" />
    <rect x="254" y="50" width="12" height="64" fill={INK} /><circle cx="260" cy="44" r="15" fill={dome} />
    {[40, 450].map((x) => (<g key={x}><rect x={x - 17} y="90" width="34" height="170" fill={INK} /><path d={`M${x - 24} 94 L${x} 22 L${x + 24} 94Z`} fill={INK} /><rect x={x - 17} y="130" width="34" height="9" fill="url(#khDots)" /><rect x={x - 17} y="170" width="34" height="9" fill="url(#khDots)" /></g>))}
    {[90, 190, 330, 430].map((x) => (<path key={x} d={`M${x - 20} 400 V320 Q${x} 292 ${x + 20} 320 V400Z`} fill={PAPER} opacity=".92" />))}
  </svg>
);
/** Cairo: black skyline of domes and minarets in halftone */
export const Skyline: React.FC = () => (
  <svg viewBox="0 0 560 360" width="100%" height="100%" style={{ overflow: "visible" }}>
    <rect x="10" y="260" width="540" height="100" fill={INK} />
    <path d="M60 260 Q60 170 130 170 Q200 170 200 260Z" fill={INK} /><path d="M60 260 Q60 170 130 170 Q200 170 200 260Z" fill="url(#khDots)" opacity=".5" />
    <rect x="122" y="100" width="16" height="72" fill={INK} /><circle cx="130" cy="94" r="10" fill={INK} />
    <rect x="240" y="80" width="30" height="180" fill={INK} /><path d="M232 84 L255 10 L278 84Z" fill={INK} /><rect x="240" y="130" width="30" height="8" fill="url(#khDots)" /><rect x="240" y="170" width="30" height="8" fill="url(#khDots)" />
    <path d="M310 260 Q310 190 370 190 Q430 190 430 260Z" fill={INK} /><path d="M310 260 Q310 190 370 190 Q430 190 430 260Z" fill="url(#khDots)" opacity=".5" />
    <rect x="470" y="110" width="26" height="150" fill={INK} /><path d="M463 114 L483 40 L503 114Z" fill={INK} />
    <rect x="10" y="260" width="540" height="100" fill="url(#khDotsSm)" opacity=".4" />
  </svg>
);
/** a tomb: a long low mound with a standing stone and an arch niche */
export const Tomb: React.FC<{ accent?: string }> = ({ accent = "#c8553d" }) => (
  <svg viewBox="0 0 420 300" width="100%" height="100%" style={{ overflow: "visible" }}>
    <path d="M20 290 Q40 200 120 190 H300 Q380 200 400 290Z" fill={INK} /><path d="M20 290 Q40 200 120 190 H300 Q380 200 400 290Z" fill="url(#khDots)" opacity=".5" />
    <path d="M150 190 V70 Q210 20 270 70 V190Z" fill={INK} /><path d="M178 190 V92 Q210 62 242 92 V190Z" fill={accent} />
    <rect x="195" y="120" width="30" height="8" fill={PAPER} /><rect x="195" y="140" width="30" height="8" fill={PAPER} />
  </svg>
);
/** an open book (black cover, cream pages, dots) */
export const Book: React.FC<{ accent?: string }> = ({ accent = "#c8553d" }) => (
  <svg viewBox="0 0 520 340" width="100%" height="100%" style={{ overflow: "visible" }}>
    <path d="M20 300 L250 330 L250 70 L20 40Z" fill={INK} /><path d="M500 300 L270 330 L270 70 L500 40Z" fill={INK} />
    <path d="M44 280 L238 306 L238 90 L44 64Z" fill={PAPER} /><path d="M476 280 L282 306 L282 90 L476 64Z" fill={PAPER} />
    <path d="M70 110 L214 128 M70 150 L214 168 M70 190 L214 208 M70 230 L214 248" stroke="#bdb08e" strokeWidth="8" fill="none" /><path d="M450 110 L306 128 M450 150 L306 168 M450 190 L306 208" stroke="#bdb08e" strokeWidth="8" fill="none" />
    <rect x="320" y="212" width="130" height="40" fill={accent} transform="rotate(-6 385 232)" />
  </svg>
);
/** a balance: black beam + two pans, accent on one */
export const Scales: React.FC<{ left?: string; right?: string; tilt?: number }> = ({ left = "#5f9a6a", right = "#c8553d", tilt = 0 }) => (
  <svg viewBox="0 0 640 520" width="100%" height="100%" style={{ overflow: "visible" }}>
    <rect x="300" y="90" width="40" height="370" fill={INK} /><rect x="210" y="450" width="220" height="40" fill={INK} /><circle cx="320" cy="84" r="26" fill={INK} />
    <g transform={`rotate(${tilt} 320 100)`}>
      <rect x="40" y="86" width="560" height="28" rx="14" fill={INK} />
      <path d="M70 114 L20 300 M70 114 L150 300" stroke={INK} strokeWidth="8" fill="none" /><path d="M570 114 L490 300 M570 114 L620 300" stroke={INK} strokeWidth="8" fill="none" />
      <path d="M0 300 Q85 400 170 300Z" fill={left} /><path d="M470 300 Q555 400 640 300Z" fill={right} />
      <path d="M50 250 l26 32 l56 -64" stroke={PAPER} strokeWidth="12" fill="none" /><path d="M520 240 l60 60 M580 240 l-60 60" stroke={PAPER} strokeWidth="12" fill="none" />
    </g>
  </svg>
);
export const Bubble: React.FC<{ text?: string; accent?: string; size?: number }> = ({ text = "؟", accent = PAPER, size = 190 }) => (
  <div style={{ width: "100%", height: "100%", background: accent, borderRadius: "46% 54% 50% 50% / 56% 56% 44% 44%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: size, color: INK, direction: "rtl", textAlign: "center", lineHeight: 1.05, padding: 24 }}>{text}</div>
);
export const Passport: React.FC<{ accent?: string }> = ({ accent = "#c8553d" }) => (
  <svg viewBox="0 0 320 420" width="100%" height="100%" style={{ overflow: "visible" }}>
    <rect x="10" y="10" width="300" height="400" rx="26" fill={INK} /><rect x="10" y="10" width="300" height="400" rx="26" fill="url(#khDotsSm)" opacity=".35" />
    <circle cx="160" cy="170" r="70" fill="none" stroke={PAPER} strokeWidth="9" /><path d="M90 170 H230 M160 100 V240" stroke={PAPER} strokeWidth="8" /><rect x="70" y="290" width="180" height="26" fill={PAPER} /><rect x="95" y="335" width="130" height="20" fill={accent} />
  </svg>
);
export const Plane: React.FC = () => (
  <svg viewBox="0 0 420 200" width="100%" height="100%" style={{ overflow: "visible" }}>
    <path d="M10 100 L140 80 L260 20 L300 28 L230 90 L400 80 L410 100 L400 120 L230 110 L300 172 L260 180 L140 120Z" fill={INK} /><circle cx="360" cy="100" r="9" fill={PAPER} />
  </svg>
);
export const Shelf: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <svg viewBox="0 0 640 520" width="100%" height="100%" style={{ overflow: "visible" }}>
    {Array.from({ length: rows }).map((_, r) => (
      <g key={r} transform={`translate(0 ${r * 170})`}>
        <rect x="0" y="140" width="640" height="22" fill={INK} />
        {Array.from({ length: 11 }).map((__, i) => { const h = 90 + ((i * 37 + r * 13) % 40); return <g key={i}><rect x={14 + i * 56} y={140 - h} width="44" height={h} fill={INK} /><rect x={14 + i * 56} y={140 - h + 14} width="44" height="8" fill="url(#khDotsSm)" /></g>; })}
      </g>
    ))}
  </svg>
);
/** a paper text strip (the only text on the scene) */
export const Strip: React.FC<{ at: number; until: number; x: number; y: number; text: string; rot?: number; size?: number }> = ({ at, until, x, y, text, rot = -2, size = 52 }) => {
  const t = useStep();
  if (t < at || t > until) return null;
  const u = ease((t - at) / 0.3), o = ease((until - t) / 0.2);
  return <div style={{ position: "absolute", left: x, top: y + (1 - u) * -50, opacity: Math.min(u, o), transform: `rotate(${rot}deg)`, background: PAPER, color: INK, borderRadius: 6, padding: "6px 30px 14px", boxShadow: "0 9px 0 rgba(40,20,8,.3)", fontFamily: TITLE, fontWeight: 800, fontSize: size, direction: "rtl", filter: NOROUGH ? undefined : "url(#khRough)" }}>{text}</div>;
};

/* ───────── the scenes (1920x1080 stage; the zone / background scales it) ───────── */
export const PapChain: React.FC = () => (
  <Floor color={FLOOR.rust}>
    <div style={{ position: "absolute", left: 40, top: 650, width: 1060, height: 22, background: INK, borderRadius: 11, filter: NOROUGH ? undefined : "url(#khRough)" }} />
    {[0, 1, 2, 3, 4].map((i) => <Pc key={i} at={0.1 + i * 0.22} x={60 + i * 200} y={330 + (i % 2) * 12} w={150} h={300} from="bottom" seed={i + 2} rot={(i % 2 ? 2 : -2)}><Sil turban={i === 0 ? 1.1 : 0.8} /></Pc>)}
    <Strip at={0.2} until={9} x={70} y={110} text="سلسلة الأسانيد" />
  </Floor>
);
export const PapScales: React.FC = () => (
  <Floor color={FLOOR.mustard}>
    <Pc at={0.1} x={90} y={150} w={900} h={730} from="bottom"><Scales tilt={-4} /></Pc>
    <Strip at={0.6} until={9} x={80} y={50} text="صحيح أم ضعيف؟" rot={-3} />
  </Floor>
);
export const PapQuestion: React.FC<{ text?: string }> = ({ text = "؟" }) => (
  <Floor color={FLOOR.orange}>
    <Pc at={0.1} x={120} y={300} w={220} h={440} from="left"><Sil turban={1} /></Pc>
    <Pc at={0.45} x={420} y={110} w={560} h={380} rot={-3} from="top" seed={5}><Bubble text={text} size={text.length > 3 ? 84 : 230} /></Pc>
  </Floor>
);
export const PapQuotes: React.FC = () => (
  <Floor color={FLOOR.beige}>
    <Pc at={0.1} x={90} y={150} w={560} h={300} rot={-3} from="left"><Bubble text="❝" accent={PAPER} size={230} /></Pc>
    <Pc at={0.4} x={380} y={500} w={560} h={300} rot={2} from="right" seed={3}><Bubble text="❞" accent={FLOOR.mustard} size={230} /></Pc>
  </Floor>
);
/** a man facing Medina: the figure + the black mosque (used for «تشوف النبي» / «يقظةً») */
export const PapMedina: React.FC<{ open?: boolean }> = ({ open }) => (
  <Floor color={open ? FLOOR.mustard : FLOOR.orange}>
    <Pc at={0.1} x={500} y={330} w={560} h={430} from="right"><Mosque dome={open ? FLOOR.rust : FLOOR.mustard} /></Pc>
    <Pc at={0.4} x={190} y={360} w={200} h={400} from="left" seed={4}><Sil turban={1} /></Pc>
    <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}><path d="M410 440 Q560 250 760 330" fill="none" stroke={INK} strokeWidth="9" strokeDasharray="4 22" strokeLinecap="round" filter="url(#khRough)" /></svg>
  </Floor>
);
export const PapPassport: React.FC = () => (
  <Floor color={FLOOR.beige}>
    <Pc at={0.1} x={120} y={290} w={380} h={500} rot={-6} from="left"><Passport /></Pc>
    <Pc at={0.4} x={450} y={400} w={380} h={500} rot={5} from="bottom" seed={3}><Passport accent="#e0b04a" /></Pc>
    <Pc at={0.8} x={300} y={90} w={620} h={300} rot={-4} from="right" seed={6}><Plane /></Pc>
  </Floor>
);
export const PapShelf: React.FC = () => (
  <Floor color={FLOOR.rust}><Pc at={0.1} x={90} y={170} w={1000} h={810} from="bottom"><Shelf /></Pc></Floor>
);
export const PapBookRays: React.FC = () => (
  <Floor color={FLOOR.mustard}>
    <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>{Array.from({ length: 11 }).map((_, i) => { const a = (-80 + i * 16) * Math.PI / 180; return <line key={i} x1={520 + Math.sin(a) * 260} y1={460 - Math.cos(a) * 260} x2={520 + Math.sin(a) * 460} y2={460 - Math.cos(a) * 460} stroke={INK} strokeWidth="10" strokeLinecap="round" filter="url(#khRough)" />; })}</svg>
    <Pc at={0.1} x={170} y={420} w={700} h={460} from="bottom"><Book /></Pc>
  </Floor>
);
/** «يغمض عينيه ← القاهرة ← المدينة ← عند القبر»: figure hops from the Cairo skyline to the mosque and the tomb (times in seconds from the scene start) */
export const PapTrip: React.FC<{ T: { start: number; cairo: number; medina: number; tomb: number } }> = ({ T }) => {
  const t = useStep();
  const u = clamp((t - T.medina) / 0.7), hopY = -Math.sin(u * Math.PI) * 260;
  const px = t < T.medina ? 150 : 150 + (440 - 150) * ease(u);
  return (
    <Floor color={FLOOR.orange}>
      <Pc at={T.cairo} x={40} y={560} w={420} h={270} from="left"><Skyline /></Pc>
      <Pc at={T.medina} x={500} y={470} w={460} h={350} from="right" seed={3}><Mosque /></Pc>
      <Pc at={T.tomb} x={600} y={720} w={340} h={240} from="bottom" seed={5} z={3}><Tomb /></Pc>
      <div style={{ position: "absolute", left: px, top: 340 + hopY, width: 150, height: 300, zIndex: 4, transform: `rotate(${u > 0 && u < 1 ? -10 : 0}deg)`, filter: "drop-shadow(0 10px 0 rgba(40,20,8,.28))" }}><div style={{ width: "100%", height: "100%", filter: NOROUGH ? undefined : "url(#khRough)" }}>{t >= T.start ? <Sil turban={1} /> : null}</div></div>
    </Floor>
  );
};
