/* «شيخ الردود» — شخصية كرتونية مرسومة بالكود (لا توليد): شاب بلباس الشباب، لحية طويلة كبيرة وهيبة الشيوخ،
   وجه مكشوف بلا عيون، جالس على كرسي رِجلاً على رِجل، وشاشة نرى فيها ما يشاهد (المقطع يوضع داخلها).
   كل جزء (رأس، لحية، ذراع، ساق، جهاز) مرسوم منفصلاً بمفاصل مسماة ليُحرَّك لاحقاً.
   عشر نسخ للاختيار: الإطار رقم n = النسخة n. */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

export const SHEIKH_CAST_FRAMES = 10;
const INK = "#2a1c14";
const SW = 4.5;
type P = [number, number];
type Top = "hoodie" | "bomber" | "denim" | "leather" | "sweater" | "plaid" | "puffer" | "track" | "cardigan" | "quarterzip";
type Hair = "quiff" | "side" | "curly" | "crop" | "bun" | "beanie" | "wavy" | "slick";
type Dev = "tablet" | "phone" | "tv" | "laptop" | "screen";
type Arm = "beard" | "rest";
type Design = {
  skin: string; hair: string; hairStyle: Hair; beard: string; beardShape: "spade" | "point" | "wave"; beardLen: number; beardW: number;
  top: Top; c1: string; c2: string; pants: string; shoe: string; shoeAcc: string; chair: string; chairStyle: "club" | "modern" | "wing";
  device: Dev; arm: Arm; wall: string; wall2: string; floor: string; decor: ("shelf" | "lamp" | "plant" | "window" | "art")[];
};

const DESIGNS: Design[] = [
  { skin: "#e2a77f", hair: "#1f1712", hairStyle: "quiff", beard: "#1d1611", beardShape: "spade", beardLen: 285, beardW: 112, top: "hoodie", c1: "#4c5a3f", c2: "#3a4630", pants: "#3f5a7a", shoe: "#f4f1ea", shoeAcc: "#b8452f", chair: "#8a4f2c", chairStyle: "club", device: "tablet", arm: "beard", wall: "#efe2c8", wall2: "#e3d1b0", floor: "#a8714b", decor: ["shelf", "lamp"] },
  { skin: "#c98b62", hair: "#2a1d15", hairStyle: "side", beard: "#2b1e15", beardShape: "point", beardLen: 300, beardW: 104, top: "bomber", c1: "#5e6b3a", c2: "#f1ece0", pants: "#cdb48c", shoe: "#ece6da", shoeAcc: "#2f5f4f", chair: "#c99a3e", chairStyle: "modern", device: "tv", arm: "rest", wall: "#cfd8c0", wall2: "#bccaa8", floor: "#8d6a4c", decor: ["plant", "art"] },
  { skin: "#d9a27a", hair: "#1a1310", hairStyle: "curly", beard: "#17110d", beardShape: "wave", beardLen: 295, beardW: 118, top: "denim", c1: "#4f6f95", c2: "#f3efe6", pants: "#7d6a46", shoe: "#5a3a26", shoeAcc: "#e9dcc4", chair: "#7a2433", chairStyle: "wing", device: "laptop", arm: "beard", wall: "#f1e6d2", wall2: "#e6d6ba", floor: "#9a6a44", decor: ["window", "plant"] },
  { skin: "#b97a52", hair: "#1c1410", hairStyle: "crop", beard: "#1a130f", beardShape: "spade", beardLen: 320, beardW: 120, top: "leather", c1: "#5a3524", c2: "#9aa0a3", pants: "#2f3a4a", shoe: "#f2efe8", shoeAcc: "#5a3524", chair: "#b0703f", chairStyle: "club", device: "phone", arm: "rest", wall: "#d98f6b", wall2: "#c97b57", floor: "#6f4a33", decor: ["art", "lamp"] },
  { skin: "#e6b08a", hair: "#2a1f17", hairStyle: "bun", beard: "#2a1e16", beardShape: "point", beardLen: 290, beardW: 108, top: "sweater", c1: "#7b2f2b", c2: "#e9d9b6", pants: "#5b5e63", shoe: "#2c2f33", shoeAcc: "#e9e4d8", chair: "#6f7a80", chairStyle: "modern", device: "screen", arm: "rest", wall: "#2f4a4c", wall2: "#26403f", floor: "#4d3a2d", decor: ["lamp", "plant"] },
  { skin: "#cf9468", hair: "#3a2a1e", hairStyle: "beanie", beard: "#21180f", beardShape: "wave", beardLen: 300, beardW: 116, top: "plaid", c1: "#3f6b4a", c2: "#f0ebe1", pants: "#40597a", shoe: "#c9a46b", shoeAcc: "#6b4a2a", chair: "#7d4a2a", chairStyle: "club", device: "tablet", arm: "rest", wall: "#efe3cc", wall2: "#e0cfae", floor: "#a07045", decor: ["shelf", "plant"] },
  { skin: "#a8704a", hair: "#16100c", hairStyle: "wavy", beard: "#3b2416", beardShape: "spade", beardLen: 305, beardW: 118, top: "puffer", c1: "#2f4f6f", c2: "#d8c7a4", pants: "#6b6a3e", shoe: "#ede8dd", shoeAcc: "#c46a2c", chair: "#9a6138", chairStyle: "wing", device: "tv", arm: "beard", wall: "#e8dcc6", wall2: "#d8c8aa", floor: "#7f5a3e", decor: ["window", "shelf"] },
  { skin: "#dca37b", hair: "#1e1611", hairStyle: "slick", beard: "#1c1510", beardShape: "point", beardLen: 310, beardW: 106, top: "track", c1: "#244a3c", c2: "#efe6cf", pants: "#3b3e43", shoe: "#f5f2ec", shoeAcc: "#244a3c", chair: "#c08a4a", chairStyle: "modern", device: "phone", arm: "beard", wall: "#ead2b6", wall2: "#dcbf9d", floor: "#8a5f40", decor: ["art", "plant"] },
  { skin: "#c48a60", hair: "#241a13", hairStyle: "side", beard: "#211812", beardShape: "wave", beardLen: 290, beardW: 114, top: "cardigan", c1: "#b98a52", c2: "#f2ede3", pants: "#5a4a3a", shoe: "#3a2a20", shoeAcc: "#d9c9a8", chair: "#2f5a46", chairStyle: "wing", device: "laptop", arm: "rest", wall: "#efe6d6", wall2: "#e2d4bd", floor: "#93653f", decor: ["shelf", "lamp"] },
  { skin: "#d69c72", hair: "#1b1410", hairStyle: "quiff", beard: "#1e1712", beardShape: "spade", beardLen: 315, beardW: 122, top: "quarterzip", c1: "#33415e", c2: "#e6e1d6", pants: "#45607f", shoe: "#f3efe7", shoeAcc: "#33415e", chair: "#8b5a34", chairStyle: "club", device: "screen", arm: "beard", wall: "#e9dfcf", wall2: "#d9ccb5", floor: "#7c563b", decor: ["window", "plant"] },
];

/* أدوات رسم */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16); const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, "0")).join("");
};
/* طرف مستدق بين نقطتين (عظم بعرضين) مع نهايتين مستديرتين */
const limb = (a: P, b: P, w1: number, w2: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = (q: P, w: number, s: number): string => `${q[0] + nx * w * s},${q[1] + ny * w * s}`;
  return `M${p(a, w1 / 2, 1)} L${p(b, w2 / 2, 1)} A${w2 / 2},${w2 / 2} 0 0 1 ${p(b, w2 / 2, -1)} L${p(a, w1 / 2, -1)} A${w1 / 2},${w1 / 2} 0 0 1 ${p(a, w1 / 2, 1)} Z`;
};
/* طرف من مفصلين أو ثلاثة: الحد الحبري كله أولاً ثم اللون، فلا يظهر خط عند المرفق أو الركبة */
const Limb: React.FC<{ pts: P[]; w: number; fill: string }> = ({ pts, w, fill }) => {
  const d = "M" + pts.map((p) => p.join(",")).join(" L");
  return <g><path d={d} fill="none" stroke={INK} strokeWidth={w + SW * 2} strokeLinecap="round" strokeLinejoin="round" /><path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></g>;
};
const Ink: React.FC<{ d: string; fill: string; sw?: number; o?: number }> = ({ d, fill, sw = SW, o = 1 }) => (
  <path d={d} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" opacity={o} />
);
const Line: React.FC<{ d: string; c?: string; w?: number; o?: number }> = ({ d, c = INK, w = 3, o = 1 }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

/* الخلفية: جدار وأرضية وزخارف الغرفة */
const Room: React.FC<{ d: Design }> = ({ d }) => (
  <g>
    <rect x={0} y={0} width={1080} height={1080} fill={d.wall} />
    {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 130 - 20} y={0} width={64} height={880} fill={d.wall2} opacity={0.35} />)}
    <rect x={0} y={858} width={1080} height={26} fill={shade(d.wall, -0.18)} />
    <rect x={0} y={884} width={1080} height={196} fill={d.floor} />
    {Array.from({ length: 7 }).map((_, i) => <Line key={i} d={`M0,${900 + i * 28} L1080,${900 + i * 28}`} c={shade(d.floor, -0.15)} w={2} />)}
    <ellipse cx={440} cy={985} rx={360} ry={58} fill={shade(d.floor, 0.25)} stroke={INK} strokeWidth={3} />
    <ellipse cx={440} cy={985} rx={320} ry={44} fill="none" stroke={shade(d.floor, -0.1)} strokeWidth={6} strokeDasharray="14 10" />
    {d.decor.includes("shelf") && (
      <g transform="translate(40,150)">
        <Ink d="M0,0 h170 v560 h-170 Z" fill="#7a4b2c" />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <rect x={10} y={20 + r * 135} width={150} height={110} fill="#5d3820" />
            {Array.from({ length: 7 }).map((_, k) => {
              const h = 70 + ((k * 37 + r * 11) % 35), cols = ["#a8442f", "#3f6b5a", "#c9a34f", "#3d4f6e", "#8a5a3b", "#6e2f3f", "#d9c9a2"];
              return <rect key={k} x={16 + k * 20} y={128 + r * 135 - h} width={17} height={h} fill={cols[(k + r * 3) % 7]} stroke={INK} strokeWidth={2} />;
            })}
            <rect x={0} y={128 + r * 135} width={170} height={10} fill="#8f5a35" stroke={INK} strokeWidth={2} />
          </g>
        ))}
      </g>
    )}
    {d.decor.includes("window") && (
      <g transform="translate(60,150)">
        <Ink d="M0,0 h230 v300 h-230 Z" fill="#f6e7c4" />
        <rect x={14} y={14} width={202} height={272} fill="#f3c98f" />
        <circle cx={150} cy={210} r={34} fill="#f8e0a8" opacity={0.9} />
        <path d="M14,230 Q80,200 140,232 T216,220 V286 H14 Z" fill="#c7a074" opacity={0.7} />
        <Line d="M115,14 V286 M14,150 H216" c="#f6e7c4" w={10} />
        <Ink d="M-14,300 h258 v18 h-258 Z" fill="#e8d6b4" sw={3} />
      </g>
    )}
    {d.decor.includes("lamp") && (
      <g transform="translate(960,260)">
        <Ink d="M-60,0 L60,0 L80,110 L-80,110 Z" fill="#f2d79a" />
        <ellipse cx={0} cy={110} rx={80} ry={14} fill="#f7e6b8" stroke={INK} strokeWidth={3} />
        <Line d="M0,110 V600" w={7} c={INK} />
        <ellipse cx={0} cy={604} rx={48} ry={10} fill="#3b2a20" />
        <ellipse cx={0} cy={160} rx={160} ry={80} fill="#fff3cc" opacity={0.18} />
      </g>
    )}
    {d.decor.includes("plant") && (
      <g transform="translate(980,700)">
        {[-50, -25, 0, 25, 50, -38, 38].map((a, i) => (
          <path key={i} d={`M0,40 Q${a * 1.2},${-60 - (i % 3) * 30} ${a * 2},${-140 - (i % 3) * 40} Q${a * 0.6},${-60} 0,40`} fill={i % 2 ? "#3f7a4f" : "#56935f"} stroke={INK} strokeWidth={2.5} />
        ))}
        <Ink d="M-48,40 h96 l-12,120 h-72 Z" fill="#c9784a" />
        <rect x={-52} y={34} width={104} height={16} rx={5} fill="#b5683c" stroke={INK} strokeWidth={3} />
      </g>
    )}
    {d.decor.includes("art") && (
      <g transform="translate(70,190)">
        <Ink d="M0,0 h200 v200 h-200 Z" fill="#e9d8b4" />
        <rect x={16} y={16} width={168} height={168} fill={shade(d.wall, -0.35)} />
        <g transform="translate(100,100)">
          {[0, 45].map((r) => <rect key={r} x={-50} y={-50} width={100} height={100} fill="none" stroke="#f0e1bd" strokeWidth={5} transform={`rotate(${r})`} />)}
          <circle r={22} fill="#f0e1bd" />
        </g>
      </g>
    )}
  </g>
);

/* الكرسي: ظهر، ذراعان، مقعد، قاعدة */
const ChairBack: React.FC<{ d: Design; cx: number }> = ({ d, cx }) => {
  const c = d.chair, dk = shade(c, -0.25), lt = shade(c, 0.18);
  if (d.chairStyle === "wing") return (
    <g>
      <Ink d={`M${cx - 230},${720} L${cx - 250},${420} Q${cx - 250},${330} ${cx - 160},${320} Q${cx},${290} ${cx + 160},${320} Q${cx + 250},${330} ${cx + 250},${420} L${cx + 230},${720} Z`} fill={c} />
      <path d={`M${cx - 180},${360} Q${cx},${330} ${cx + 180},${360} L${cx + 170},${700} L${cx - 170},${700} Z`} fill={dk} opacity={0.35} />
      {Array.from({ length: 4 }).map((_, i) => Array.from({ length: 5 }).map((__, j) => <circle key={`${i}${j}`} cx={cx - 130 + j * 65} cy={380 + i * 70} r={5} fill={dk} />))}
    </g>
  );
  if (d.chairStyle === "modern") return (
    <g>
      <Ink d={`M${cx - 215},${720} L${cx - 215},${410} Q${cx - 215},${350} ${cx - 155},${350} L${cx + 155},${350} Q${cx + 215},${350} ${cx + 215},${410} L${cx + 215},${720} Z`} fill={c} />
      <path d={`M${cx - 195},${370} h390 v40 h-390 Z`} fill={lt} opacity={0.35} />
      <Line d={`M${cx},${360} V${700}`} c={dk} w={4} o={0.6} />
    </g>
  );
  return (
    <g>
      <Ink d={`M${cx - 225},${730} L${cx - 225},${430} Q${cx - 225},${355} ${cx - 140},${350} L${cx + 140},${350} Q${cx + 225},${355} ${cx + 225},${430} L${cx + 225},${730} Z`} fill={c} />
      <path d={`M${cx - 200},${380} Q${cx},${360} ${cx + 200},${380} L${cx + 200},${430} Q${cx},${410} ${cx - 200},${430} Z`} fill={lt} opacity={0.3} />
      {[-140, -70, 0, 70, 140].map((x) => <Line key={x} d={`M${cx + x},${370} V${700}`} c={dk} w={3} o={0.5} />)}
    </g>
  );
};
const ChairFront: React.FC<{ d: Design; cx: number }> = ({ d, cx }) => {
  const c = d.chair, dk = shade(c, -0.28), lt = shade(c, 0.15);
  const arm = (x: number, flip: number) => (
    <g>
      <Ink d={`M${x - 50},${820} L${x - 50},${600} Q${x - 50},${560} ${x},${556} Q${x + 50},${560} ${x + 50},${600} L${x + 50},${820} Z`} fill={c} />
      <ellipse cx={x} cy={584} rx={46} ry={24} fill={lt} stroke={INK} strokeWidth={3} />
      <Line d={`M${x + flip * 30},${610} V${800}`} c={dk} w={4} o={0.5} />
    </g>
  );
  return (
    <g>
      <Ink d={`M${cx - 245},${790} L${cx + 245},${790} L${cx + 238},${872} L${cx - 238},${872} Z`} fill={dk} />
      {[-215, 215].map((x) => <Ink key={x} d={`M${cx + x - 10},${872} L${cx + x + 10},${872} L${cx + x + 6},${905} L${cx + x - 6},${905} Z`} fill="#3a2618" sw={3} />)}
      <Ink d={`M${cx - 190},${690} Q${cx},${672} ${cx + 190},${690} L${cx + 195},${800} L${cx - 195},${800} Z`} fill={lt} />
      {arm(cx - 210, 1)}{arm(cx + 210, -1)}
    </g>
  );
};

/* اللحية الطويلة الكبيرة: تبدأ من السالفين وتحيط بالفك، ويبقى الخدان والأنف ظاهرين، ثم تنسدل على الصدر */
const Beard: React.FC<{ d: Design; hx: number; hy: number }> = ({ d, hx, hy }) => {
  const L = d.beardLen * 0.78, W = d.beardW * 0.86, c = shade(d.beard, 0.05), lt = shade(d.beard, 0.4), dk = shade(d.beard, -0.45);
  const tip = d.beardShape === "point"
    ? `C${hx - W * 0.6},${hy + L * 0.9} ${hx - 14},${hy + L} ${hx + 4},${hy + L + 26} C${hx + 22},${hy + L} ${hx + W * 0.6},${hy + L * 0.9}`
    : d.beardShape === "wave"
    ? `C${hx - W * 0.8},${hy + L * 0.9} ${hx - 52},${hy + L + 6} ${hx - 30},${hy + L - 6} Q${hx - 12},${hy + L + 20} ${hx + 6},${hy + L + 2} Q${hx + 24},${hy + L + 22} ${hx + 40},${hy + L - 4} C${hx + 56},${hy + L + 6} ${hx + W * 0.8},${hy + L * 0.9}`
    : `C${hx - W * 0.9},${hy + L * 0.95} ${hx - 46},${hy + L + 8} ${hx + 4},${hy + L + 10} C${hx + 52},${hy + L + 8} ${hx + W * 0.9},${hy + L * 0.95}`;
  const body = `M${hx - 62},${hy + 6} C${hx - 74},${hy + 50} ${hx - W},${hy + 84} ${hx - W * 0.95},${hy + L * 0.6} ${tip} ${hx + W * 0.95},${hy + L * 0.6} C${hx + W},${hy + 90} ${hx + 78},${hy + 50} ${hx + 66},${hy + 6} Q${hx + 60},${hy + 36} ${hx + 42},${hy + 48} Q${hx + 8},${hy + 58} ${hx - 30},${hy + 48} Q${hx - 54},${hy + 36} ${hx - 62},${hy + 6} Z`;
  const strands = [-0.7, -0.48, -0.26, -0.04, 0.18, 0.4, 0.62];
  return (
    <g>
      <Ink d={body} fill={c} />
      <path d={`M${hx - W * 0.2},${hy + 60} Q${hx - W * 0.35},${hy + L * 0.55} ${hx - W * 0.15},${hy + L * 0.92} L${hx + W * 0.25},${hy + L * 0.9} Q${hx + W * 0.35},${hy + L * 0.5} ${hx + W * 0.2},${hy + 60} Z`} fill={dk} opacity={0.18} />
      {strands.map((k, i) => (
        <Line key={i} d={`M${hx + k * W * 0.8},${hy + 50 + (i % 3) * 14} C${hx + k * W * 1.05},${hy + L * 0.35} ${hx + k * W * 0.75},${hy + L * 0.6} ${hx + k * W * 0.6},${hy + L * 0.86}`} c={i % 2 ? dk : lt} w={i % 2 ? 3.5 : 3} o={0.8} />
      ))}
      {[-0.5, 0.05, 0.45].map((k, i) => <Line key={"h" + i} d={`M${hx + k * W},${hy + 70} q${8 - i * 6},40 ${2},80`} c={lt} w={5} o={0.45} />)}
      {/* الشارب تحت الأنف */}
      <path d={`M${hx + 14},${hy + 38} Q${hx - 14},${hy + 28} ${hx - 40},${hy + 54} Q${hx - 14},${hy + 52} ${hx + 14},${hy + 56} Q${hx + 42},${hy + 52} ${hx + 66},${hy + 54} Q${hx + 42},${hy + 28} ${hx + 14},${hy + 38} Z`} fill={shade(d.beard, 0.3)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

/* الرأس: وجه بلا عيون، أنف صغير، أذنان، شعر بأحد ثمانية أشكال */
const Head: React.FC<{ d: Design; hx: number; hy: number }> = ({ d, hx, hy }) => {
  const sk = d.skin, h = d.hair, hl = shade(h, 0.25), hd = shade(h, -0.3);
  const hair: Record<Hair, React.ReactNode> = {
    quiff: <Ink d={`M${hx - 66},${hy - 6} Q${hx - 76},${hy - 78} ${hx - 22},${hy - 100} Q${hx + 20},${hy - 140} ${hx + 64},${hy - 104} Q${hx + 84},${hy - 70} ${hx + 68},${hy - 6} Q${hx + 58},${hy - 52} ${hx + 20},${hy - 58} Q${hx - 26},${hy - 52} ${hx - 52},${hy - 34} Q${hx - 60},${hy - 22} ${hx - 66},${hy - 6} Z`} fill={h} />,
    side: <Ink d={`M${hx - 68},${hy - 4} Q${hx - 74},${hy - 84} ${hx - 6},${hy - 96} Q${hx + 66},${hy - 100} ${hx + 70},${hy - 4} Q${hx + 60},${hy - 50} ${hx + 30},${hy - 60} Q${hx - 10},${hy - 46} ${hx - 34},${hy - 66} Q${hx - 50},${hy - 40} ${hx - 68},${hy - 4} Z`} fill={h} />,
    curly: <g>{Array.from({ length: 11 }).map((_, i) => { const a = Math.PI * (1.05 + i * 0.09); return <circle key={i} cx={hx + Math.cos(a) * 64} cy={hy - 30 + Math.sin(a) * 66} r={24} fill={i % 2 ? h : hl} stroke={INK} strokeWidth={3} />; })}<ellipse cx={hx} cy={hy - 70} rx={56} ry={34} fill={h} /></g>,
    crop: <Ink d={`M${hx - 66},${hy - 10} Q${hx - 68},${hy - 92} ${hx},${hy - 94} Q${hx + 68},${hy - 92} ${hx + 68},${hy - 10} Q${hx + 62},${hy - 48} ${hx},${hy - 54} Q${hx - 62},${hy - 48} ${hx - 66},${hy - 10} Z`} fill={h} />,
    bun: <g><circle cx={hx + 4} cy={hy - 112} r={30} fill={h} stroke={INK} strokeWidth={SW} /><Ink d={`M${hx - 68},${hy - 6} Q${hx - 72},${hy - 92} ${hx},${hy - 94} Q${hx + 72},${hy - 92} ${hx + 70},${hy - 6} Q${hx + 60},${hy - 52} ${hx},${hy - 56} Q${hx - 60},${hy - 52} ${hx - 68},${hy - 6} Z`} fill={h} /></g>,
    beanie: <g><Ink d={`M${hx - 72},${hy - 26} Q${hx - 76},${hy - 132} ${hx},${hy - 134} Q${hx + 76},${hy - 132} ${hx + 72},${hy - 26} Z`} fill="#8a3b2e" /><Ink d={`M${hx - 76},${hy - 50} Q${hx},${hy - 64} ${hx + 76},${hy - 50} L${hx + 76},${hy - 22} Q${hx},${hy - 34} ${hx - 76},${hy - 22} Z`} fill="#a64b3a" />{Array.from({ length: 9 }).map((_, i) => <Line key={i} d={`M${hx - 64 + i * 16},${hy - 54} V${hy - 30}`} c="#7a3226" w={2.5} />)}</g>,
    wavy: <Ink d={`M${hx - 70},${hy - 2} Q${hx - 84},${hy - 70} ${hx - 44},${hy - 96} Q${hx - 20},${hy - 120} ${hx + 10},${hy - 104} Q${hx + 40},${hy - 124} ${hx + 66},${hy - 92} Q${hx + 88},${hy - 60} ${hx + 72},${hy - 2} Q${hx + 60},${hy - 40} ${hx + 36},${hy - 52} Q${hx + 10},${hy - 40} ${hx - 14},${hy - 56} Q${hx - 44},${hy - 44} ${hx - 70},${hy - 2} Z`} fill={h} />,
    slick: <Ink d={`M${hx - 66},${hy - 8} Q${hx - 70},${hy - 96} ${hx + 4},${hy - 98} Q${hx + 74},${hy - 92} ${hx + 70},${hy - 8} Q${hx + 64},${hy - 56} ${hx + 6},${hy - 62} Q${hx - 56},${hy - 56} ${hx - 66},${hy - 8} Z`} fill={h} />,
  };
  return (
    <g>
      <ellipse cx={hx - 66} cy={hy + 4} rx={14} ry={22} fill={sk} stroke={INK} strokeWidth={SW} />
      <ellipse cx={hx + 70} cy={hy + 4} rx={14} ry={22} fill={sk} stroke={INK} strokeWidth={SW} />
      <ellipse cx={hx + 2} cy={hy - 8} rx={66} ry={80} fill={sk} stroke={INK} strokeWidth={SW} />
      <ellipse cx={hx - 30} cy={hy - 30} rx={22} ry={30} fill={shade(sk, 0.25)} opacity={0.35} />
      <ellipse cx={hx + 44} cy={hy + 4} rx={16} ry={10} fill="#d9765f" opacity={0.25} />
      <ellipse cx={hx - 34} cy={hy + 4} rx={16} ry={10} fill="#d9765f" opacity={0.2} />
      {hair[d.hairStyle]}
      {d.hairStyle !== "curly" && d.hairStyle !== "beanie" && <Line d={`M${hx - 30},${hy - 76} Q${hx + 10},${hy - 92} ${hx + 44},${hy - 74}`} c={hl} w={4} o={0.7} />}
      {d.hairStyle !== "beanie" && <Line d={`M${hx - 58},${hy - 10} Q${hx - 52},${hy - 40} ${hx - 34},${hy - 52}`} c={hd} w={3} o={0.5} />}
      {/* الأنف فقط — بلا عيون ولا حواجب */}
      <path d={`M${hx + 16},${hy - 14} Q${hx + 40},${hy + 14} ${hx + 28},${hy + 28} Q${hx + 16},${hy + 34} ${hx + 4},${hy + 26}`} fill={shade(sk, -0.08)} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
};

/* الجذع حسب نوع اللباس */
const Torso: React.FC<{ d: Design; cx: number }> = ({ d, cx }) => {
  const c1 = d.c1, c2 = d.c2, dk = shade(c1, -0.25), lt = shade(c1, 0.18);
  const base = `M${cx - 150},${505} Q${cx - 158},${462} ${cx - 104},${452} L${cx + 104},${452} Q${cx + 158},${462} ${cx + 150},${505} L${cx + 132},${706} Q${cx},${722} ${cx - 132},${706} Z`;
  const shadowR = <path d={`M${cx + 60},${460} L${cx + 104},${452} Q${cx + 158},${462} ${cx + 150},${505} L${cx + 132},${706} Q${cx + 100},${714} ${cx + 70},${716} Z`} fill={dk} opacity={0.45} />;
  const inner = (col: string) => <Ink d={`M${cx - 54},${456} L${cx + 54},${456} L${cx + 46},${712} Q${cx},${718} ${cx - 46},${712} Z`} fill={col} sw={3} />;
  const parts: Record<Top, React.ReactNode> = {
    hoodie: <g><Ink d={base} fill={c1} />{shadowR}
      <Ink d={`M${cx - 120},${470} Q${cx - 130},${420} ${cx - 70},${430} Q${cx},${470} ${cx + 70},${430} Q${cx + 130},${420} ${cx + 120},${470} Q${cx},${500} ${cx - 120},${470} Z`} fill={lt} />
      <Ink d={`M${cx - 92},${600} L${cx + 92},${600} L${cx + 110},${690} L${cx - 110},${690} Z`} fill={dk} sw={3} />
      <Line d={`M${cx - 28},${480} V${560} M${cx + 34},${480} V${552}`} c={c2} w={4} /><circle cx={cx - 28} cy={562} r={5} fill={c2} /><circle cx={cx + 34} cy={554} r={5} fill={c2} /></g>,
    bomber: <g><Ink d={base} fill={c1} />{shadowR}{inner(c2)}
      <Ink d={`M${cx - 60},${452} Q${cx},${478} ${cx + 60},${452} L${cx + 66},${470} Q${cx},${498} ${cx - 66},${470} Z`} fill={shade(c1, -0.35)} sw={3} />
      <Ink d={`M${cx - 132},${690} Q${cx},${708} ${cx + 132},${690} L${cx + 132},${712} Q${cx},${730} ${cx - 132},${712} Z`} fill={shade(c1, -0.35)} sw={3} />
      <Line d={`M${cx - 54},${480} V${700} M${cx + 54},${480} V${700}`} c="#c9b27a" w={3} /></g>,
    denim: <g><Ink d={base} fill={c1} />{shadowR}{inner(c2)}
      <Ink d={`M${cx - 54},${456} L${cx - 96},${456} L${cx - 40},${560} Z`} fill={lt} sw={3} /><Ink d={`M${cx + 54},${456} L${cx + 96},${456} L${cx + 40},${560} Z`} fill={lt} sw={3} />
      {[-1, 1].map((s) => <g key={s}><Ink d={`M${cx + s * 74 - 30},${560} h60 v44 h-60 Z`} fill={lt} sw={3} /><Line d={`M${cx + s * 74 - 30},${574} h60`} c="#e8c27a" w={2} /></g>)}
      <Line d={`M${cx - 120},${640} L${cx - 58},${640} M${cx + 58},${640} L${cx + 120},${640}`} c="#e8c27a" w={2.5} /></g>,
    leather: <g><Ink d={base} fill={c1} />{shadowR}{inner(c2)}
      <Ink d={`M${cx - 54},${456} L${cx - 110},${462} L${cx - 70},${540} L${cx - 46},${520} Z`} fill={lt} sw={3} /><Ink d={`M${cx + 54},${456} L${cx + 110},${462} L${cx + 70},${540} L${cx + 46},${520} Z`} fill={lt} sw={3} />
      <Line d={`M${cx - 110},${600} L${cx - 66},${612}`} c="#d9c7a5" w={3} /><Line d={`M${cx + 66},${612} L${cx + 110},${600}`} c="#d9c7a5" w={3} />
      <path d={`M${cx - 120},${520} Q${cx - 100},${600} ${cx - 120},${680}`} fill="none" stroke={lt} strokeWidth={6} opacity={0.5} /></g>,
    sweater: <g><Ink d={base} fill={c1} />{shadowR}
      <Ink d={`M${cx - 60},${452} Q${cx},${490} ${cx + 60},${452} L${cx + 66},${466} Q${cx},${508} ${cx - 66},${466} Z`} fill={shade(c1, -0.3)} sw={3} />
      <rect x={cx - 140} y={555} width={280} height={30} fill={c2} opacity={0.95} /><Line d={`M${cx - 140},${555} h280 M${cx - 140},${585} h280`} w={2.5} />
      <Ink d={`M${cx - 132},${690} Q${cx},${708} ${cx + 132},${690} L${cx + 132},${710} Q${cx},${728} ${cx - 132},${710} Z`} fill={shade(c1, -0.3)} sw={3} /></g>,
    plaid: <g><Ink d={base} fill={c1} />
      {Array.from({ length: 7 }).map((_, i) => <Line key={"v" + i} d={`M${cx - 120 + i * 40},${458} V${712}`} c={dk} w={8} o={0.55} />)}
      {Array.from({ length: 6 }).map((_, i) => <Line key={"h" + i} d={`M${cx - 146},${490 + i * 40} H${cx + 146}`} c={dk} w={8} o={0.55} />)}
      {Array.from({ length: 6 }).map((_, i) => <Line key={"t" + i} d={`M${cx - 146},${505 + i * 40} H${cx + 146}`} c="#c94a3a" w={2.5} o={0.7} />)}
      <Ink d={base} fill="none" />{shadowR}{inner(c2)}
      <Ink d={`M${cx - 54},${456} L${cx - 90},${456} L${cx - 50},${520} Z`} fill={lt} sw={3} /><Ink d={`M${cx + 54},${456} L${cx + 90},${456} L${cx + 50},${520} Z`} fill={lt} sw={3} /></g>,
    puffer: <g><Ink d={base} fill={c2} />
      <Ink d={`M${cx - 132},${470} L${cx - 54},${456} L${cx - 46},${712} Q${cx - 90},${716} ${cx - 132},${706} Z`} fill={c1} />
      <Ink d={`M${cx + 132},${470} L${cx + 54},${456} L${cx + 46},${712} Q${cx + 90},${716} ${cx + 132},${706} Z`} fill={c1} />
      {[0, 1, 2, 3, 4].map((i) => <Line key={i} d={`M${cx - 130},${510 + i * 44} Q${cx - 90},${520 + i * 44} ${cx - 52},${512 + i * 44} M${cx + 52},${512 + i * 44} Q${cx + 90},${520 + i * 44} ${cx + 130},${510 + i * 44}`} c={shade(c1, -0.3)} w={3} />)}
      <Ink d={`M${cx - 58},${452} L${cx - 40},${440} L${cx + 40},${440} L${cx + 58},${452} L${cx + 50},${476} L${cx - 50},${476} Z`} fill={c1} sw={3} /></g>,
    track: <g><Ink d={base} fill={c1} />{shadowR}
      <Line d={`M${cx},${470} V${712}`} c="#d8c9a3" w={3} />
      <Ink d={`M${cx - 56},${450} L${cx + 56},${450} L${cx + 50},${476} L${cx - 50},${476} Z`} fill={shade(c1, -0.3)} sw={3} />
      <Line d={`M${cx - 136},${500} L${cx - 124},${700} M${cx - 122},${500} L${cx - 110},${700}`} c={c2} w={5} /><Line d={`M${cx + 136},${500} L${cx + 124},${700} M${cx + 122},${500} L${cx + 110},${700}`} c={c2} w={5} /></g>,
    cardigan: <g><Ink d={base} fill={c1} />{shadowR}{inner(c2)}
      <Line d={`M${cx - 36},${470} V${560}`} w={3} />{[0, 1, 2].map((i) => <circle key={i} cx={cx - 36} cy={480 + i * 30} r={4} fill={INK} />)}
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={cx - 60} cy={560 + i * 40} r={6} fill="#5a3a22" stroke={INK} strokeWidth={2} />)}
      <Ink d={`M${cx - 112},${620} h46 v40 h-46 Z`} fill={dk} sw={3} /><Ink d={`M${cx + 66},${620} h46 v40 h-46 Z`} fill={dk} sw={3} /></g>,
    quarterzip: <g><Ink d={base} fill={c1} />{shadowR}
      <Ink d={`M${cx - 62},${448} L${cx + 62},${448} L${cx + 56},${484} Q${cx},${492} ${cx - 56},${484} Z`} fill={shade(c1, -0.2)} sw={3} />
      <Line d={`M${cx},${452} V${560}`} c="#e0d6c0" w={4} /><rect x={cx - 6} y={556} width={12} height={20} rx={3} fill="#e0d6c0" stroke={INK} strokeWidth={2} />
      <Line d={`M${cx - 120},${520} L${cx - 70},${528}`} c={c2} w={4} /></g>,
  };
  return <g>{parts[d.top]}</g>;
};

const Hand: React.FC<{ p: P; skin: string; rot?: number; fist?: boolean }> = ({ p, skin, rot = 0, fist }) => (
  <g transform={`translate(${p[0]},${p[1]}) rotate(${rot})`}>
    <ellipse cx={0} cy={0} rx={fist ? 25 : 28} ry={fist ? 22 : 24} fill={skin} stroke={INK} strokeWidth={SW} />
    <ellipse cx={-18} cy={-12} rx={11} ry={15} fill={skin} stroke={INK} strokeWidth={3.5} transform="rotate(-30 -18 -12)" />
    {[-8, 4, 15].map((x) => <Line key={x} d={`M${x},${6} v10`} w={2.5} o={0.55} />)}
  </g>
);

const Shoe: React.FC<{ p: P; d: Design; rot?: number; sole?: boolean }> = ({ p, d, rot = 0, sole }) => (
  <g transform={`translate(${p[0]},${p[1]}) rotate(${rot})`}>
    <Ink d="M-30,-22 Q-10,-34 20,-24 Q52,-16 66,4 Q70,22 50,24 L-34,24 Q-46,8 -30,-22 Z" fill={d.shoe} />
    <Ink d="M-36,14 L60,14 Q70,18 62,26 L-34,26 Z" fill={sole ? shade(d.shoe, -0.12) : "#f6f3ec"} sw={3} />
    <Line d="M-6,-20 Q20,-6 46,0" c={d.shoeAcc} w={6} />
    <Line d="M2,-24 l6,10 M12,-22 l6,10" w={2.5} />
  </g>
);

/* الأجهزة: الشاشة دائماً بوجهها إلينا، والمقطع داخلها */
const Screen: React.FC<{ x: number; y: number; w: number; h: number; id: string }> = ({ x, y, w, h, id }) => (
  <g>
    <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={4} /></clipPath>
    <image href={staticFile("broll_lib/religion_distorters/distorters_podcast.png")} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    <rect x={x} y={y + h - 14} width={w} height={14} fill="rgba(0,0,0,.45)" clipPath={`url(#${id})`} />
    <rect x={x + 8} y={y + h - 8} width={w * 0.42} height={4} fill="#e2423a" />
    <circle cx={x + 8 + w * 0.42} cy={y + h - 6} r={5} fill="#e2423a" />
    <path d={`M${x},${y} l${w * 0.3},0 l${-w * 0.18},${h} l${-w * 0.12},0 Z`} fill="#fff" opacity={0.08} clipPath={`url(#${id})`} />
  </g>
);

const Figure: React.FC<{ d: Design; i: number }> = ({ d, i }) => {
  const cx = 430, hx = cx + 8, hy = 318, sk = d.skin, sleeve = d.top === "puffer" ? d.c2 : d.c1;
  const pantsDk = shade(d.pants, -0.22);
  /* المفاصل */
  const shR: P = [cx - 132, 486], shL: P = [cx + 132, 486];
  const elR: P = d.arm === "beard" ? [cx - 196, 626] : [cx - 205, 600];
  const haR: P = d.arm === "beard" ? [cx - 72, 528] : [cx - 214, 690];
  const holds = d.device === "tablet" || d.device === "phone";
  const remote = d.device === "tv" || d.device === "screen";
  const elL: P = holds ? [cx + 186, 612] : remote ? [cx + 196, 600] : [cx + 205, 600];
  const haL: P = holds ? [cx + 262, 560] : remote ? [cx + 268, 548] : [cx + 214, 690];
  /* الرجلان: اليسرى مغروسة، واليمنى فوقها على الركبة */
  const hipL: P = [cx + 62, 706], kneeL: P = [cx + 104, 800], ankL: P = [cx + 112, 960];
  const hipR: P = [cx - 62, 706], kneeR: P = [cx - 130, 748], ankR: P = [cx + 92, 770];
  return (
    <g>
      {/* الجهاز خلف الشخص (تلفاز/شاشة/حاسوب) */}
      {d.device === "tv" && (
        <g>
          <Ink d="M650,180 h380 v236 h-380 Z" fill="#26211d" />
          <Screen x={664} y={194} w={352} h={208} id={"sc" + i} />
          <Line d="M840,416 v40" w={8} /><Ink d="M800,452 h80 v10 h-80 Z" fill="#3b332c" sw={3} />
        </g>
      )}
      {d.device === "screen" && (
        <g>
          <ellipse cx={850} cy={330} rx={250} ry={180} fill="#fff6d8" opacity={0.12} />
          <Ink d="M640,130 h420 v262 h-420 Z" fill="#efe9dc" sw={5} />
          <Screen x={652} y={142} w={396} h={238} id={"sc" + i} />
          <Line d="M640,126 h420" w={10} c="#3b332c" />
        </g>
      )}
      <ChairBack d={d} cx={cx} />
      {/* الذراع البعيدة خلف الجذع لا يلزم؛ الكتفان على الجذع */}
      <Torso d={d} cx={cx} />
      <rect x={hx - 26} y={hy + 50} width={52} height={70} fill={sk} stroke={INK} strokeWidth={SW} />
      <g transform={`translate(${hx},${hy}) scale(1.16) translate(${-hx},${-hy})`}>
        <Head d={d} hx={hx} hy={hy} />
        <Beard d={d} hx={hx} hy={hy} />
      </g>
      <ChairFront d={d} cx={cx} />
      {/* الرِّجل المغروسة */}
      <Limb pts={[hipL, kneeL, ankL]} w={84} fill={d.pants} />
      <Line d={`M${kneeL[0] + 18},${kneeL[1] + 30} Q${kneeL[0] + 26},${kneeL[1] + 90} ${ankL[0] + 14},${ankL[1] - 20}`} c={pantsDk} w={5} o={0.6} />
      <Shoe p={[ankL[0] + 16, ankL[1] + 14]} d={d} rot={6} />
      {/* الرِّجل المرفوعة رِجلاً على رِجل */}
      <Limb pts={[hipR, kneeR, ankR]} w={86} fill={d.pants} />
      <Line d={`M${kneeR[0] + 20},${kneeR[1] + 26} Q${(kneeR[0] + ankR[0]) / 2},${kneeR[1] + 40} ${ankR[0] - 20},${ankR[1] + 20}`} c={pantsDk} w={5} o={0.6} />
      <rect x={ankR[0] + 6} y={ankR[1] - 24} width={22} height={40} fill={shade(d.pants, 0.4)} opacity={0} />
      <Shoe p={[ankR[0] + 44, ankR[1] - 2]} d={d} rot={-8} sole />
      {/* الحاسوب على طاولة جانبية */}
      {d.device === "laptop" && (
        <g>
          <Ink d="M700,700 h220 v18 h-220 Z" fill="#7a4b2c" />
          <Line d="M720,718 L700,880 M900,718 L920,880 M810,718 V880" w={7} c="#5a3820" />
          <Ink d="M712,528 L912,516 L918,690 L716,698 Z" fill="#3a3632" />
          <Screen x={724} y={534} w={182} h={146} id={"sc" + i} />
          <Ink d="M700,698 L930,690 L950,712 L690,716 Z" fill="#b9b4ab" sw={3} />
        </g>
      )}
      {/* الذراع البعيدة عنّا (يمينه): إلى اللحية أو مسندة */}
      <Limb pts={[shR, elR, haR]} w={60} fill={sleeve} />
      <Hand p={haR} skin={sk} rot={d.arm === "beard" ? -40 : 10} />
      {/* الذراع الحاملة */}
      <Limb pts={[shL, elL]} w={60} fill={sleeve} />
      {holds && d.device === "tablet" && (
        <g transform={`rotate(-7 ${haL[0] + 110} ${haL[1] - 90})`}>
          <Ink d={`M${haL[0] - 20},${haL[1] - 200} h266 v196 h-266 Z`} fill="#2b2724" />
          <Screen x={haL[0] - 8} y={haL[1] - 188} w={242} h={172} id={"sc" + i} />
        </g>
      )}
      {holds && d.device === "phone" && (
        <g transform={`rotate(-10 ${haL[0] + 80} ${haL[1] - 60})`}>
          <Ink d={`M${haL[0] - 16},${haL[1] - 130} h200 v108 h-200 Z`} fill="#2b2724" />
          <Screen x={haL[0] - 6} y={haL[1] - 122} w={180} h={92} id={"sc" + i} />
        </g>
      )}
      <Limb pts={[[elL[0] - (elL[0] - shL[0]) * 0.15, elL[1] - (elL[1] - shL[1]) * 0.15], elL, haL]} w={58} fill={sleeve} />
      {remote && <Ink d={`M${haL[0] + 10},${haL[1] - 30} l46,-26 l10,14 l-46,26 Z`} fill="#3a3430" sw={3} />}
      <Hand p={haL} skin={sk} rot={holds ? -20 : remote ? -35 : 0} fist={remote} />
    </g>
  );
};

export const SheikhCast: React.FC = () => {
  const f = useCurrentFrame();
  const d = DESIGNS[Math.min(DESIGNS.length - 1, f)];
  return (
    <AbsoluteFill style={{ background: d.wall }}>
      {/* تحميل صورة الشاشة قبل اللقطة (Img ينتظر التحميل) */}
      <Img src={staticFile("broll_lib/religion_distorters/distorters_podcast.png")} style={{ position: "absolute", width: 2, height: 2, opacity: 0.01 }} />
      <svg viewBox="0 0 1080 1080" width="100%" height="100%">
        <Room d={d} />
        <Figure d={d} i={f} />
      </svg>
    </AbsoluteFill>
  );
};
