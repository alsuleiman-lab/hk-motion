/* «شيخ الردود» — شخصية كرتونية مرسومة بالكود (لا توليد): شاب بلباس الشباب، لحية طويلة كبيرة وهيبة الشيوخ،
   وجه مكشوف بلا عيون، جالس على كرسي رِجلاً على رِجل، وشاشة نرى فيها ما يشاهد (المقطع يوضع داخلها).
   كل جزء (رأس، لحية، ذراع، ساق، جهاز) مرسوم منفصلاً بمفاصل مسماة ليُحرَّك لاحقاً.
   عشر نسخ للاختيار: الإطار رقم n = النسخة n. */
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

export const SHEIKH_CAST_FRAMES = 10;
const INK = "#2a1c14";
const SW = 4.5;
type P = [number, number];
type Top = "hoodie" | "bomber" | "denim" | "leather" | "sweater" | "plaid" | "puffer" | "track" | "cardigan" | "quarterzip";
type Hair = "quiff" | "side" | "curly" | "crop" | "bun" | "beanie" | "wavy" | "slick" | "kufi";
type Dev = "tablet" | "phone" | "tv" | "laptop" | "screen" | "wall";
type Arm = "beard" | "rest";
type Design = {
  skin: string; hair: string; hairStyle: Hair; beard: string; beardShape: "spade" | "point" | "wave"; beardLen: number; beardW: number;
  top: Top; c1: string; c2: string; pants: string; shoe: string; shoeAcc: string; chair: string; chairStyle: "club" | "modern" | "wing";
  device: Dev; arm: Arm; glasses?: boolean; lightMustache?: boolean; wall: string; wall2: string; floor: string; decor: ("shelf" | "lamp" | "plant" | "window" | "art")[];
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
const Beard: React.FC<{ d: Design; hx: number; hy: number; mouth?: number }> = ({ d, hx, hy, mouth = 0 }) => {
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
      {/* فتحة الفم بين الشارب واللحية (تنبيه المستخدم 2026-11-22): رقعة شفاه بلون البشرة تفصل الشارب عن اللحية، والفم داخلها يُغلق ويُفتح بالصوت */}
      <path d={`M${hx - 8},${hy + 50} Q${hx + 16},${hy + 44} ${hx + 40},${hy + 50} Q${hx + 46},${hy + 76} ${hx + 16},${hy + 86} Q${hx - 14},${hy + 76} ${hx - 8},${hy + 50} Z`} fill={shade(d.skin, -0.1)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${hx - 2},${hy + 78} Q${hx + 16},${hy + 86} ${hx + 34},${hy + 78}`} fill="none" stroke={shade(d.skin, -0.28)} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
      {mouth > 0.06 ? (
        <g>
          <ellipse cx={hx + 16} cy={hy + 66 + 3 * mouth} rx={11 + 5 * mouth} ry={2 + 10 * mouth} fill="#3a1410" stroke={INK} strokeWidth={2} />
          {mouth > 0.35 && <ellipse cx={hx + 16} cy={hy + 66 + 3 * mouth - (2 + 10 * mouth) * 0.5} rx={(11 + 5 * mouth) * 0.7} ry={(2 + 10 * mouth) * 0.26} fill="#f4efe6" />}
          {mouth > 0.45 && <ellipse cx={hx + 16} cy={hy + 66 + 3 * mouth + (2 + 10 * mouth) * 0.5} rx={8} ry={2 + 3 * mouth} fill="#b8524a" />}
        </g>
      ) : <Line d={`M${hx + 2},${hy + 66} Q${hx + 16},${hy + 71} ${hx + 30},${hy + 66}`} c="#3a1410" w={3.5} />}
      {/* الشارب تحت الأنف */}
      {d.lightMustache ? <path d={`M${hx + 14},${hy + 44} Q${hx - 4},${hy + 38} ${hx - 22},${hy + 52} Q${hx - 4},${hy + 50} ${hx + 14},${hy + 53} Q${hx + 34},${hy + 50} ${hx + 50},${hy + 52} Q${hx + 32},${hy + 38} ${hx + 14},${hy + 44} Z`} fill={shade(d.beard, 0.3)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" /> : <path d={`M${hx + 14},${hy + 38} Q${hx - 14},${hy + 28} ${hx - 40},${hy + 54} Q${hx - 14},${hy + 52} ${hx + 14},${hy + 56} Q${hx + 42},${hy + 52} ${hx + 66},${hy + 54} Q${hx + 42},${hy + 28} ${hx + 14},${hy + 38} Z`} fill={shade(d.beard, 0.3)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
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
    kufi: <g>
      <Ink d={`M${hx - 66},${hy - 10} Q${hx - 68},${hy - 60} ${hx - 40},${hy - 66} L${hx + 44},${hy - 66} Q${hx + 70},${hy - 60} ${hx + 68},${hy - 10} Q${hx + 60},${hy - 46} ${hx},${hy - 50} Q${hx - 60},${hy - 46} ${hx - 66},${hy - 10} Z`} fill={h} />
      <Ink d={`M${hx - 64},${hy - 52} Q${hx - 66},${hy - 118} ${hx + 2},${hy - 120} Q${hx + 70},${hy - 118} ${hx + 68},${hy - 52} Q${hx},${hy - 62} ${hx - 64},${hy - 52} Z`} fill="#f6f3ec" />
      {Array.from({ length: 6 }).map((_, k) => <Line key={k} d={`M${hx - 54 + k * 22},${hy - 58} Q${hx - 50 + k * 22},${hy - 90} ${hx - 46 + k * 21},${hy - 112}`} c="#ddd6c6" w={2.5} />)}
      <Line d={`M${hx - 62},${hy - 56} Q${hx},${hy - 66} ${hx + 66},${hy - 56}`} c="#cfc6b2" w={3} />
    </g>,
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
      {d.hairStyle !== "curly" && d.hairStyle !== "beanie" && d.hairStyle !== "kufi" && <Line d={`M${hx - 30},${hy - 76} Q${hx + 10},${hy - 92} ${hx + 44},${hy - 74}`} c={hl} w={4} o={0.7} />}
      {d.hairStyle !== "beanie" && <Line d={`M${hx - 58},${hy - 10} Q${hx - 52},${hy - 40} ${hx - 34},${hy - 52}`} c={hd} w={3} o={0.5} />}
      {d.glasses && (
        <g fill="none" stroke="#1a1a1a" strokeLinecap="round">
          {/* نظارة أنيقة: إطار رفيع شبه مربع بلا زجاج */}
          <path d={`M${hx - 56},${hy - 22} L${hx - 66},${hy - 10} M${hx + 70},${hy - 22} L${hx + 72},${hy - 10}`} strokeWidth={3} />
          <rect x={hx - 54} y={hy - 40} width={50} height={34} rx={7} strokeWidth={3.5} />
          <rect x={hx + 20} y={hy - 40} width={50} height={34} rx={7} strokeWidth={3.5} />
          <path d={`M${hx - 4},${hy - 30} Q${hx + 8},${hy - 36} ${hx + 20},${hy - 30}`} strokeWidth={3} />
        </g>
      )}
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

const mix = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/* مرفق ذراع بمفصلين: الكتف S واليد H وطول العضد U والساعد F؛ المرفق يُختار الأسفل */
const ikElbow = (S: P, H: P, U: number, F: number): P => {
  const dx = H[0] - S[0], dy = H[1] - S[1], real = Math.hypot(dx, dy) || 1;
  const dd = Math.max(Math.abs(U - F) + 1, Math.min(U + F - 1, real));
  const a = (U * U - F * F + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, U * U - a * a));
  const ux = dx / real, uy = dy / real;
  const e1: P = [S[0] + a * ux - h * uy, S[1] + a * uy + h * ux], e2: P = [S[0] + a * ux + h * uy, S[1] + a * uy - h * ux];
  return e1[1] > e2[1] ? e1 : e2;
};

/* ===== مشاهد «شيخ الردود» (أمر المستخدم 2026-11-22: «مرة جلسة عادية، مرة رجل على رجل، مرة يشرب عصير، مرة قهوة، مرة أمامه طاولة صغيرة»، لإزالة الملل) ===== */
export type Sit = "cross" | "crossR" | "normal";
export type Drink = "none" | "juice" | "coffee" | "tea";
export type Scene = { sit: Sit; drink: Drink; table: boolean };
const CUP_H: Record<Exclude<Drink, "none">, number> = { juice: 96, coffee: 44, tea: 70 };

/* الكأس: أصلها (0,0) قاعدتها وتمتد إلى الأعلى */
const Cup: React.FC<{ kind: Exclude<Drink, "none">; t?: number }> = ({ kind, t = 0 }) => {
  const steam = kind === "juice" ? null : (
    <g opacity={0.8}>{[-9, 0, 9].map((x, k) => <Line key={k} d={`M${x},${-CUP_H[kind] - 8} q${7 * Math.sin(t * 2 + k)},-10 0,-20 q${-7 * Math.sin(t * 2 + k)},-10 0,-20`} c="#cfc7b6" w={3.5} />)}</g>
  );
  if (kind === "juice") return (
    <g>
      <Ink d="M-22,0 L-27,-92 L27,-92 L22,0 Z" fill="rgba(238,246,245,0.6)" sw={3.5} />
      <path d="M-23.5,-5 L-26,-78 L26,-78 L23.5,-5 Z" fill="#f0a02f" />
      <path d="M-14,-84 L-15,-14" stroke="#ffffff" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
      <ellipse cx={0} cy={-92} rx={27} ry={6} fill="#fbe0a0" stroke={INK} strokeWidth={3} />
      <circle cx={26} cy={-90} r={11} fill="#f08a1c" stroke={INK} strokeWidth={2.5} />
      <Line d="M26,-100 V-80 M16,-90 H36" c="#fbd58a" w={2} />
    </g>
  );
  if (kind === "coffee") return (
    <g>
      <Ink d="M-17,0 L-26,-40 Q-26,-44 -22,-44 L22,-44 Q26,-44 26,-40 L17,0 Z" fill="#f4efe4" sw={3.5} />
      <Line d="M-25,-34 L25,-34" c="#c9a34f" w={4} />
      <ellipse cx={0} cy={-44} rx={26} ry={5} fill="#4a2a14" stroke={INK} strokeWidth={3} />
      {steam}
    </g>
  );
  return (
    <g>
      <Ink d="M-20,0 L-22,-24 Q-14,-34 -22,-44 L-27,-70 L27,-70 L22,-44 Q14,-34 22,-24 L20,0 Z" fill="rgba(240,225,200,0.6)" sw={3.5} />
      <path d="M-18,-4 L-20,-22 Q-12,-33 -20,-46 L-23,-62 L23,-62 L20,-46 Q12,-33 20,-22 L18,-4 Z" fill="#b5551f" opacity={0.92} />
      <Line d="M-26,-66 L26,-66" c="#c9a34f" w={4} />
      <ellipse cx={0} cy={-70} rx={27} ry={5} fill="#d98438" stroke={INK} strokeWidth={3} />
      {steam}
    </g>
  );
};

/* جهاز التحكم صغيراً (يُوضع على الطاولة أو على مسند الكرسي حين تشغل يده كأس) */
const RemoteProp: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <Ink d="M-30,-8 h60 a6,6 0 0 1 6,6 v4 a6,6 0 0 1 -6,6 h-60 a6,6 0 0 1 -6,-6 v-4 a6,6 0 0 1 6,-6 Z" fill="#3a3430" sw={3} />
    <circle cx={-16} cy={0} r={3.5} fill="#e2423a" /><circle cx={-4} cy={0} r={3} fill="#9aa0a3" /><circle cx={7} cy={0} r={3} fill="#9aa0a3" />
  </g>
);

/* الطاولة الصغيرة أمامه، وعليها ما يناسب مشروبه (دلة وتمر للقهوة، إبريق للعصير، براد للشاي، كتب إن لم يكن مشروب) */
const SmallTable: React.FC<{ cx: number; drink: Drink; remote: boolean }> = ({ cx, drink, remote }) => {
  const TY = 1012, RX = 200, RY = 34, wood = "#8a5a35", dk = shade(wood, -0.3), y = TY + 4;
  const dallah = (x: number) => (
    <g>
      <Line d={`M${x - 26},${y - 30} Q${x - 72},${y - 46} ${x - 64},${y - 94}`} c={INK} w={16} />
      <Line d={`M${x - 26},${y - 30} Q${x - 72},${y - 46} ${x - 64},${y - 94}`} c="#c9993b" w={9} />
      <Line d={`M${x + 28},${y - 52} Q${x + 70},${y - 52} ${x + 58},${y - 14}`} c={INK} w={14} />
      <Line d={`M${x + 28},${y - 52} Q${x + 70},${y - 52} ${x + 58},${y - 14}`} c="#a97a2a" w={7} />
      <Ink d={`M${x - 30},${y} Q${x - 38},${y - 40} ${x - 14},${y - 60} L${x + 14},${y - 60} Q${x + 38},${y - 40} ${x + 30},${y} Z`} fill="#c9993b" />
      <Line d={`M${x - 34},${y - 24} Q${x},${y - 18} ${x + 34},${y - 24}`} c="#8a6420" w={3} />
      <Ink d={`M${x - 13},${y - 60} L${x - 8},${y - 78} L${x + 8},${y - 78} L${x + 13},${y - 60} Z`} fill="#a97a2a" sw={3} />
      <circle cx={x} cy={y - 84} r={6} fill="#c9993b" stroke={INK} strokeWidth={2.5} />
    </g>
  );
  const dates = (x: number) => (
    <g>
      <ellipse cx={x} cy={y} rx={46} ry={12} fill="#e9e1d1" stroke={INK} strokeWidth={3} />
      {[-26, -12, 2, 16, 28, -18, -2, 14].map((dx, k) => <ellipse key={k} cx={x + dx} cy={y - 3 - (k > 4 ? 7 : 0)} rx={10} ry={6.5} fill="#5a2f18" stroke={INK} strokeWidth={2} />)}
    </g>
  );
  const jug = (x: number) => (
    <g>
      <Line d={`M${x + 24},${y - 66} Q${x + 58},${y - 62} ${x + 42},${y - 20}`} c={INK} w={13} /><Line d={`M${x + 24},${y - 66} Q${x + 58},${y - 62} ${x + 42},${y - 20}`} c="rgba(238,246,245,0.9)" w={6} />
      <Ink d={`M${x - 28},${y - 96} L${x - 34},${y} L${x + 30},${y} L${x + 26},${y - 96} Z`} fill="rgba(238,246,245,0.6)" sw={3.5} />
      <path d={`M${x - 30},${y - 74} L${x - 32},${y - 4} L${x + 28},${y - 4} L${x + 25},${y - 74} Z`} fill="#f0a02f" />
      <ellipse cx={x} cy={y - 96} rx={27} ry={6} fill="#fbe0a0" stroke={INK} strokeWidth={3} />
      <Line d={`M${x - 16},${y - 86} L${x - 19},${y - 14}`} c="#ffffff" w={4} o={0.5} />
    </g>
  );
  const teapot = (x: number) => (
    <g>
      <Line d={`M${x - 30},${y - 36} Q${x - 70},${y - 50} ${x - 64},${y - 78}`} c={INK} w={14} /><Line d={`M${x - 30},${y - 36} Q${x - 70},${y - 50} ${x - 64},${y - 78}`} c="#d9d2c3" w={7} />
      <Line d={`M${x + 32},${y - 56} Q${x + 72},${y - 54} ${x + 56},${y - 14}`} c={INK} w={13} /><Line d={`M${x + 32},${y - 56} Q${x + 72},${y - 54} ${x + 56},${y - 14}`} c="#d9d2c3" w={6} />
      <Ink d={`M${x - 34},${y} Q${x - 44},${y - 52} ${x - 18},${y - 66} L${x + 18},${y - 66} Q${x + 44},${y - 52} ${x + 34},${y} Z`} fill="#e9e3d6" />
      <Line d={`M${x - 36},${y - 30} Q${x},${y - 22} ${x + 36},${y - 30}`} c="#3f6b5a" w={4} />
      <Ink d={`M${x - 16},${y - 66} Q${x},${y - 82} ${x + 16},${y - 66} Z`} fill="#d9d2c3" sw={3} />
      <circle cx={x} cy={y - 84} r={5} fill="#3f6b5a" stroke={INK} strokeWidth={2} />
    </g>
  );
  const books = (x: number) => (
    <g>
      <Ink d={`M${x - 56},${y} h112 v-16 h-112 Z`} fill="#2f5a46" sw={3} /><Line d={`M${x - 50},${y - 8} h100`} c="#c9a34f" w={3} />
      <Ink d={`M${x - 44},${y - 16} h88 v-14 h-88 Z`} fill="#7a2f2b" sw={3} /><Line d={`M${x - 38},${y - 23} h76`} c="#e0c98a" w={3} />
    </g>
  );
  return (
    <g>
      <ellipse cx={cx} cy={TY + 100} rx={RX * 0.9} ry={20} fill="#000" opacity={0.16} />
      {[-138, 138].map((x) => <Ink key={x} d={`M${cx + x - 8},${TY + 24} L${cx + x + 8},${TY + 24} L${cx + x + Math.sign(x) * 12 + 5},${TY + 100} L${cx + x + Math.sign(x) * 12 - 5},${TY + 100} Z`} fill={dk} sw={3} />)}
      <path d={`M${cx - RX},${TY} v16 a${RX},${RY} 0 0 0 ${2 * RX},0 v-16 Z`} fill={dk} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={cx} cy={TY} rx={RX} ry={RY} fill={wood} stroke={INK} strokeWidth={4} />
      <ellipse cx={cx} cy={TY} rx={RX - 26} ry={RY - 8} fill="none" stroke={shade(wood, 0.22)} strokeWidth={3} opacity={0.6} />
      {drink === "coffee" && <>{dallah(cx - 108)}{dates(cx + 112)}</>}
      {drink === "juice" && <>{jug(cx - 92)}</>}
      {drink === "tea" && <>{teapot(cx - 108)}{dates(cx + 112)}</>}
      {drink === "none" && books(cx - 86)}
      {remote && <RemoteProp x={cx + 6} y={y + 12} rot={-8} />}
    </g>
  );
};

/* الرجلان: تُرسم أولاً تحت الجسد (تنبيه المستخدم 2026-11-22: «الرجل فوق الجسد»: الطبقات من أسفل: رجلان ثم جسد ثم يدان ثم لحية مع وجه) */
const Legs: React.FC<{ d: Design; cx: number; sit: Sit }> = ({ d, cx, sit }) => {
  const pantsDk = shade(d.pants, -0.22);
  const planted = (hip: P, knee: P, ank: P, rot: number) => (
    <g>
      <Limb pts={[hip, knee, ank]} w={84} fill={d.pants} />
      <Line d={`M${knee[0] + 18},${knee[1] + 30} Q${knee[0] + 26},${knee[1] + 90} ${ank[0] + 14},${ank[1] - 20}`} c={pantsDk} w={5} o={0.6} />
      <Shoe p={[ank[0] + 16, ank[1] + 14]} d={d} rot={rot} />
    </g>
  );
  const flip = (n: React.ReactNode) => <g transform={`translate(${2 * cx},0) scale(-1,1)`}>{n}</g>;
  if (sit === "normal") return <g>{planted([cx + 62, 690], [cx + 112, 800], [cx + 120, 960], 5)}{flip(planted([cx + 62, 690], [cx + 112, 800], [cx + 120, 960], 5))}</g>;
  const hipR: P = [cx - 62, 690], kneeR: P = [cx - 130, 748], ankR: P = [cx + 92, 770];
  const g = (
    <g>
      {planted([cx + 62, 690], [cx + 104, 800], [cx + 112, 960], 6)}
      <Limb pts={[hipR, kneeR, ankR]} w={86} fill={d.pants} />
      <Line d={`M${kneeR[0] + 20},${kneeR[1] + 26} Q${(kneeR[0] + ankR[0]) / 2},${kneeR[1] + 40} ${ankR[0] - 20},${ankR[1] + 20}`} c={pantsDk} w={5} o={0.6} />
      <Shoe p={[ankR[0] + 44, ankR[1] - 2]} d={d} rot={-8} sole />
    </g>
  );
  return sit === "crossR" ? flip(g) : g;
};

/* listen: يده على لحيته يمسحها، attend: إنصات عام (ميل الرأس وإيماءات بطيئة)، lean: يميل إلى الأمام نحو الشاشة،
   shake: يهز رأسه رفضاً، talk: يده تخرج من لحيته وتتحرك مع كلامه، sip: يرفع كأسه إلى فمه، t بالثواني. الكرسي والجسم ثابتان لا يهتزان.
   ترتيب الطبقات من أسفل (تنبيه المستخدم 2026-11-22): كرسي ← رجلان ← جسد ← يدان ← لحية مع وجه ← (طاولة) ← يد الكأس عند الشرب فقط. */
const Figure: React.FC<{ d: Design; i: number; mouth?: number; listen?: number; attend?: number; lean?: number; shake?: number; talk?: number; t?: number; sit?: Sit; drink?: Drink; table?: boolean; sip?: number }> = ({ d, i, mouth = 0, listen = 0, attend = 0, lean = 0, shake = 0, talk = 0, t = 0, sit = "cross", drink = "none", table = false, sip = 0 }) => {
  const cx = 430, hx = cx + 8, hy = 318, sk = d.skin, sleeve = d.top === "puffer" ? d.c2 : d.c1;
  /* المفاصل */
  const shR: P = [cx - 132, 486], shL: P = [cx + 132, 486];
  const restE: P = d.arm === "beard" ? [cx - 196, 626] : [cx - 205, 600], restH: P = d.arm === "beard" ? [cx - 72, 528] : [cx - 214, 690];
  /* يده اليمنى تمسح لحيته من طرفها: تبقى نصفها خلف اللحية لأن اللحية فوق اليدين */
  let elR = mix(restE, [cx - 196, 626], listen), haR = mix(restH, [cx - 104, 548], listen);
  elR = mix(elR, [cx - 246, 590], talk); haR = mix(haR, [cx - 272, 468], talk);
  const tap = attend * (1 - listen) * (1 - talk) * 3 * Math.max(0, Math.sin(t * 7));
  haR = [haR[0] + talk * 24 * Math.sin(t * 2.7) + listen * 4 * Math.sin(t * 2.4), haR[1] + talk * 30 * Math.sin(t * 3.9 + 1) + listen * 10 * Math.sin(t * 2.4) - tap];
  elR = [elR[0] + talk * 8 * Math.sin(t * 2.7), elR[1] + talk * 10 * Math.sin(t * 3.9 + 1)];
  const nod = attend * (1 - shake) * 2.2 * Math.max(0, Math.sin(t * 1.3)) ** 3;
  const headA = attend * (2.2 + 2.0 * Math.sin(t * 0.8)) + shake * 7 * Math.sin(t * 9) + talk * (2.2 * Math.sin(t * 2.3) + mouth * 1.2);
  const holds = d.device === "tablet" || d.device === "phone";
  const remote = d.device === "tv" || d.device === "screen" || d.device === "wall";
  const cupped = drink !== "none";
  const elL0: P = holds ? [cx + 186, 612] : remote ? [cx + 196, 600] : [cx + 205, 600];
  const haL0: P = holds ? [cx + 262, 560] : remote ? [cx + 268, 548] : [cx + 214, 690];
  /* الشرب: الكأس تصعد من يده الجالسة إلى فمه ثم تعود؛ المرفق بالمفصلين (ساعد أطول قليلاً وقت الشرب) */
  const ks = sip * sip * (3 - 2 * sip), ANG = -34, a = (ANG * Math.PI) / 180, ch = cupped ? CUP_H[drink as Exclude<Drink, "none">] : 0, vy = 14 - ch;
  const handS: P = [cx + 34 + vy * Math.sin(a), 404 - vy * Math.cos(a)];
  const elL = cupped ? mix(elL0, ikElbow(shL, handS, 131, 150), ks) : elL0, haL = cupped ? mix(haL0, handS, ks) : haL0;
  const leftArm = (
    <g>
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
      {cupped && <g transform={`translate(${haL[0]},${haL[1]}) rotate(${-6 + (ANG + 6) * ks})`}><g transform="translate(0,14)"><Cup kind={drink as Exclude<Drink, "none">} t={t} /></g></g>}
      {remote && !cupped && <Ink d={`M${haL[0] + 10},${haL[1] - 30} l46,-26 l10,14 l-46,26 Z`} fill="#3a3430" sw={3} />}
      <Hand p={haL} skin={sk} rot={holds ? -20 : remote ? -35 - 20 * ks : 0} fist={remote} />
    </g>
  );
  const sipping = cupped && sip > 0.02;
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
      <ChairFront d={d} cx={cx} />
      {cupped && !table && <RemoteProp x={cx + 212} y={578} rot={-14} />}
      {/* ١) الرجلان */}
      <Legs d={d} cx={cx} sit={sit} />
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
      {/* ٢) الجسد */}
      <Torso d={d} cx={cx} />
      <rect x={hx - 26} y={hy + 50} width={52} height={70} fill={sk} stroke={INK} strokeWidth={SW} />
      {/* ٣) اليدان: اليمنى (البعيدة عنّا) ثم الحاملة */}
      <Limb pts={[shR, elR, haR]} w={60} fill={sleeve} />
      <Hand p={haR} skin={sk} rot={(d.arm === "beard" ? -40 : 10) * (1 - Math.max(listen, talk)) - 40 * listen - 25 * talk + talk * 10 * Math.sin(t * 3.1)} />
      {!sipping && leftArm}
      {/* ٤) اللحية مع الوجه فوق اليدين */}
      <g transform={`translate(0,${8 * lean + 5 * nod}) rotate(${headA} ${hx} ${hy + 90}) translate(${hx},${hy}) scale(${1.16 * (1 + 0.05 * lean)}) translate(${-hx},${-hy})`}>
        <Head d={d} hx={hx} hy={hy} />
        <Beard d={d} hx={hx} hy={hy} mouth={mouth} />
      </g>
      {/* الطاولة أمامه (فوق الرجلين) */}
      {table && <SmallTable cx={cx} drink={drink} remote={cupped} />}
      {/* وقت الشرب فقط: اليد والكأس أمام اللحية */}
      {sipping && leftArm}
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

/* المعتمد (2026-11-20): المكان رقم ١ والشخصية رقم ٦، طولي. الشاشة الكبيرة على الحائط في النصف الأعلى
   (نرى المقطع معه)، وهو تحتها على كرسيه رِجلاً على رِجل وجهاز التحكم بيده. */
export const SHEIKH_RUDOOD_FRAMES = 1;
const RUDOOD: Design = { ...DESIGNS[5], chair: DESIGNS[0].chair, chairStyle: DESIGNS[0].chairStyle, wall: DESIGNS[0].wall, wall2: DESIGNS[0].wall2, floor: DESIGNS[0].floor, decor: DESIGNS[0].decor, device: "wall", arm: "rest" };
export const SheikhRudood: React.FC = () => {
  const d = RUDOOD, Y = 760, FL = 884 + Y;
  return (
    <AbsoluteFill style={{ background: d.wall }}>
      <Img src={staticFile("broll_lib/religion_distorters/distorters_podcast.png")} style={{ position: "absolute", width: 2, height: 2, opacity: 0.01 }} />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <rect x={0} y={0} width={1080} height={FL} fill={d.wall} />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 130 - 20} y={0} width={64} height={FL} fill={d.wall2} opacity={0.35} />)}
        <rect x={0} y={FL - 26} width={1080} height={26} fill={shade(d.wall, -0.18)} />
        <rect x={0} y={FL} width={1080} height={1920 - FL} fill={d.floor} />
        {Array.from({ length: 10 }).map((_, i) => <Line key={i} d={`M0,${FL + 16 + i * 28} L1080,${FL + 16 + i * 28}`} c={shade(d.floor, -0.15)} w={2} />)}
        <ellipse cx={540} cy={FL + 110} rx={420} ry={64} fill={shade(d.floor, 0.25)} stroke={INK} strokeWidth={3} />
        <ellipse cx={540} cy={FL + 110} rx={376} ry={48} fill="none" stroke={shade(d.floor, -0.1)} strokeWidth={6} strokeDasharray="14 10" />
        {/* الشاشة الكبيرة: نشاهد معه */}
        <ellipse cx={540} cy={430} rx={560} ry={330} fill="#fff6d8" opacity={0.14} />
        <Ink d="M56,150 h968 v568 h-968 Z" fill="#26211d" sw={6} />
        <Screen x={74} y={168} w={932} h={532} id="rudood" />
        <Ink d="M500,718 h80 v22 h-80 Z" fill="#3b332c" sw={3} />
        {/* رف الكتب يساراً والمصباح يميناً */}
        <g transform={`translate(24,${Y + 150}) scale(0.95)`}>
          <Ink d="M0,0 h170 v560 h-170 Z" fill="#7a4b2c" />
          {[0, 1, 2, 3].map((r) => (
            <g key={r}>
              <rect x={10} y={20 + r * 135} width={150} height={110} fill="#5d3820" />
              {Array.from({ length: 7 }).map((_, k) => { const h = 70 + ((k * 37 + r * 11) % 35), cols = ["#a8442f", "#3f6b5a", "#c9a34f", "#3d4f6e", "#8a5a3b", "#6e2f3f", "#d9c9a2"];
                return <rect key={k} x={16 + k * 20} y={128 + r * 135 - h} width={17} height={h} fill={cols[(k + r * 3) % 7]} stroke={INK} strokeWidth={2} />; })}
              <rect x={0} y={128 + r * 135} width={170} height={10} fill="#8f5a35" stroke={INK} strokeWidth={2} />
            </g>
          ))}
        </g>
        <g transform={`translate(990,${Y + 300})`}>
          <Ink d="M-56,0 L56,0 L74,104 L-74,104 Z" fill="#f2d79a" />
          <ellipse cx={0} cy={104} rx={74} ry={13} fill="#f7e6b8" stroke={INK} strokeWidth={3} />
          <Line d={`M0,104 V${FL - Y - 300 + 2}`} w={7} />
          <ellipse cx={0} cy={FL - Y - 296} rx={44} ry={9} fill="#3b2a20" />
          <ellipse cx={0} cy={150} rx={150} ry={76} fill="#fff3cc" opacity={0.18} />
        </g>
        <g transform={`translate(${540 - 430 * 1.15},${FL + 20 - 905 * 1.15}) scale(1.15)`}><Figure d={d} i={99} /></g>
      </svg>
    </AbsoluteFill>
  );
};

/* التلفاز المعلّق (أمر المستخدم 2026-11-21: «حسّن شكل التلفاز»): إطار رفيع مستدير، ظل وإضاءة خلفية على الجدار، مكبر صوت نحيف تحته */
const WallTV: React.FC<{ on: boolean; x: number; y: number; w: number; h: number }> = ({ on, x, y, w, h }) => {
  const b = 16, X = x - b, Y = y - b, W = w + 2 * b, H = h + 2 * b;
  return (
    <g>
      <defs>
        <radialGradient id="tvGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#ffe2a8" stopOpacity={on ? 0.55 : 0.12} /><stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} /></radialGradient>
        <linearGradient id="tvBezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a3a3e" /><stop offset="100%" stopColor="#151517" /></linearGradient>
        <filter id="tvShadow" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx={X + W / 2} cy={Y + H / 2} rx={W * 0.68} ry={H * 0.8} fill="url(#tvGlow)" />
      <rect x={X + 10} y={Y + 22} width={W} height={H} rx={18} fill="#000" opacity={0.28} filter="url(#tvShadow)" />
      <rect x={X + W / 2 - 90} y={Y + 40} width={180} height={H - 80} rx={8} fill="#2a2522" opacity={0.5} />
      <rect x={X} y={Y} width={W} height={H} rx={18} fill="url(#tvBezel)" stroke={INK} strokeWidth={4} />
      <rect x={X + 5} y={Y + 5} width={W - 10} height={H - 10} rx={14} fill="none" stroke="#5a5a60" strokeWidth={1.5} opacity={0.7} />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#0e0d0c" />
      <circle cx={X + W - 34} cy={Y + H - 8} r={3.5} fill={on ? "#7cf27a" : "#e2423a"} />
      <rect x={X + W / 2 - 300} y={Y + H + 22} width={600} height={30} rx={15} fill="url(#tvBezel)" stroke={INK} strokeWidth={3} />
      {Array.from({ length: 30 }).map((_, k) => <circle key={k} cx={X + W / 2 - 270 + k * 18.6} cy={Y + H + 37} r={2.2} fill="#55555a" />)}
    </g>
  );
};

/* ===== فيديو «شيخ الردود» يرد على مقطع «صلاح الدين» (طولي) =====
   المكان رقم ١ والشخصية رقم ٤ (أمر المستخدم 2026-11-20) بنظارة سوداء كبيرة شبه مربعة وشارب أخف، والفم يتحرك بصوته.
   يشغّل مقطعها (وجهها مطموس) على الشاشة الكبيرة، ثم يتوقف المقطع ويرد بالصوت المعتمد. */
/* تبديل خفيف للباسه في كل فيديو جديد (أمر المستخدم 2026-11-21: «غيّر شوي بلباس الشيخ… حتى ما يبين مستنسخ»):
   الوجه واللحية والنظارة والشعر والمكان ثابتة، ويتغير لون السترة أو نوعها أو القميص أو البنطال أو الحذاء.
   كل فيديو يأخذ رقماً جديداً بالترتيب: ٠ صلاح الدين. */
export const RUDOOD_OUTFITS: Partial<Design>[] = [
  { top: "leather", c1: "#5a3524", c2: "#9aa0a3", pants: "#2f3a4a", shoe: "#f2efe8", shoeAcc: "#5a3524" },
  { top: "leather", c1: "#2f2a26", c2: "#e8e2d6", pants: "#3d4a5c", shoe: "#ede8dd", shoeAcc: "#2f2a26" },
  { top: "bomber", c1: "#4a5a3a", c2: "#efe9dc", pants: "#2f3a4a", shoe: "#f4f1ea", shoeAcc: "#4a5a3a" },
  { top: "denim", c1: "#41607f", c2: "#f1ece2", pants: "#3a3530", shoe: "#5a3a26", shoeAcc: "#e9dcc4" },
  { top: "quarterzip", c1: "#6b2f2b", c2: "#e6e1d6", pants: "#2f3a4a", shoe: "#f3efe7", shoeAcc: "#6b2f2b" },
  { top: "leather", c1: "#7a4a2a", c2: "#2f3338", pants: "#26303d", shoe: "#2c2f33", shoeAcc: "#e9e4d8" },
  { top: "cardigan", c1: "#8a6a44", c2: "#f2ede3", pants: "#3b3e43", shoe: "#3a2a20", shoeAcc: "#d9c9a8" },
  { top: "track", c1: "#2b3f36", c2: "#efe6cf", pants: "#2f3338", shoe: "#f5f2ec", shoeAcc: "#2b3f36" },
  { hairStyle: "kufi", top: "leather", c1: "#3a3330", c2: "#e9e3d6", pants: "#2c3a4c", shoe: "#f2efe8", shoeAcc: "#3a3330" },
  { hairStyle: "kufi", top: "bomber", c1: "#5b4a36", c2: "#efe9dc", pants: "#3b3e43", shoe: "#ede8dd", shoeAcc: "#5b4a36" },
];
/* تدوير اللون: بعد الدورة الأولى من الألبسة العشرة يعود كل لباس بلون مختلف قليلاً، فلا يتكرر لباس بعينه */
const hueShift = (hex: string, deg: number) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
  const s = dl === 0 ? 0 : dl / (1 - Math.abs(2 * l - 1));
  let h = dl === 0 ? 0 : mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4;
  h = (((h * 60 + deg) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [rr, gg, bb] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [rr, gg, bb].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
};
export const rudoodLook = (n: number): Design => {
  const base = RUDOOD_OUTFITS[n % RUDOOD_OUTFITS.length], cyc = Math.floor(n / RUDOOD_OUTFITS.length);
  const o: Partial<Design> = cyc === 0 ? base : { ...base, c1: hueShift(base.c1 as string, 47 * cyc), shoeAcc: hueShift(base.shoeAcc as string, 47 * cyc), pants: hueShift(base.pants as string, -31 * cyc) };
  return { ...DESIGNS[3], chair: DESIGNS[0].chair, chairStyle: DESIGNS[0].chairStyle, wall: DESIGNS[0].wall, wall2: DESIGNS[0].wall2, floor: DESIGNS[0].floor, decor: DESIGNS[0].decor, device: "wall", arm: "rest", glasses: true, lightMustache: true, ...o };
};
/* مشهد كل فيديو (جلسة ومشروب وطاولة): الفيديوهات حتى رقم ٨ بالجلسة الأولى كما سُلّمت؛ ومن ٩ فصاعداً يدور الجدول فلا يتجاور مشهدان متشابهان */
const SCENES: Scene[] = [
  { sit: "normal", drink: "coffee", table: true },
  { sit: "crossR", drink: "juice", table: false },
  { sit: "normal", drink: "none", table: true },
  { sit: "cross", drink: "tea", table: true },
  { sit: "normal", drink: "juice", table: false },
  { sit: "crossR", drink: "coffee", table: true },
  { sit: "cross", drink: "none", table: true },
  { sit: "normal", drink: "tea", table: false },
];
const CLASSIC: Scene = { sit: "cross", drink: "none", table: false };
export const rudoodScene = (n: number): Scene => (n <= 8 ? CLASSIC : SCENES[(n - 9) % SCENES.length]);
/* غرفة «شيخ الردود»: جدار وأرضية وبساط والتلفاز المعلّق ورف الكتب والمصباح (مشتركة بين القالب ومعرض المشاهد) */
const RudoodRoom: React.FC<{ d: Design; on: boolean }> = ({ d, on }) => {
  const FL = 884 + 760;
  return (
    <g>
            <rect x={0} y={0} width={1080} height={FL} fill={d.wall} />
            {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 130 - 20} y={0} width={64} height={FL} fill={d.wall2} opacity={0.35} />)}
            <rect x={0} y={FL - 26} width={1080} height={26} fill={shade(d.wall, -0.18)} />
            <rect x={0} y={FL} width={1080} height={1920 - FL} fill={d.floor} />
            {Array.from({ length: 10 }).map((_, i) => <Line key={i} d={`M0,${FL + 16 + i * 28} L1080,${FL + 16 + i * 28}`} c={shade(d.floor, -0.15)} w={2} />)}
            <ellipse cx={540} cy={FL + 110} rx={420} ry={64} fill={shade(d.floor, 0.25)} stroke={INK} strokeWidth={3} />
            <ellipse cx={540} cy={FL + 110} rx={376} ry={48} fill="none" stroke={shade(d.floor, -0.1)} strokeWidth={6} strokeDasharray="14 10" />
            <WallTV on={on} x={SX} y={SY} w={SWD} h={SHT} />
            <g transform="translate(24,910) scale(0.95)">
              <Ink d="M0,0 h170 v560 h-170 Z" fill="#7a4b2c" />
              {[0, 1, 2, 3].map((rr) => (
                <g key={rr}>
                  <rect x={10} y={20 + rr * 135} width={150} height={110} fill="#5d3820" />
                  {Array.from({ length: 7 }).map((_, k) => { const h = 70 + ((k * 37 + rr * 11) % 35), cols = ["#a8442f", "#3f6b5a", "#c9a34f", "#3d4f6e", "#8a5a3b", "#6e2f3f", "#d9c9a2"];
                    return <rect key={k} x={16 + k * 20} y={128 + rr * 135 - h} width={17} height={h} fill={cols[(k + rr * 3) % 7]} stroke={INK} strokeWidth={2} />; })}
                  <rect x={0} y={128 + rr * 135} width={170} height={10} fill="#8f5a35" stroke={INK} strokeWidth={2} />
                </g>
              ))}
            </g>
            <g transform="translate(990,1060)">
              <Ink d="M-56,0 L56,0 L74,104 L-74,104 Z" fill="#f2d79a" />
              <ellipse cx={0} cy={104} rx={74} ry={13} fill="#f7e6b8" stroke={INK} strokeWidth={3} />
              <Line d={`M0,104 V${FL - 1060 + 2}`} w={7} />
              <ellipse cx={0} cy={FL - 1056} rx={44} ry={9} fill="#3b2a20" />
              <ellipse cx={0} cy={150} rx={150} ry={76} fill="#fff3cc" opacity={0.18} />
            </g>
    </g>
  );
};

/* قالب «شيخ الردود» لكل فيديو: يكفيه المقطع المعالَج وصوته ورقم اللباس والرد وحركة الفم؛ مراحل الإنصات نسبية إلى طول المقطع */
/* pics: صور تُعرض على التلفاز أثناء الرد (a وb بالثواني من بداية الرد)، مثل «تنبيه للمونتاج: جيب صور ناس جوعانين واعرضها على التلفزيون» */
type RudoodProps = { scene?: Partial<Scene>; intro?: { src: string; mouth: number[] }; introFirst?: boolean; look: number; clip: string; clipAudio: string; clipFrames: number; objPos: string; reply: string; mouthData: number[]; pics?: { src: string; a: number; b: number }[] };
const ON = 15;
export const rudoodFrames = (clipFrames: number, mouthLen: number) => ON + clipFrames + 12 + mouthLen + 36;
export const rudoodFullFrames = (introLen: number, clipFrames: number, mouthLen: number) => 10 + introLen + 12 + clipFrames + 12 + mouthLen + 36;
export const rudoodIntroFrames = (clipFrames: number, mouthLen: number) => 10 + mouthLen + 12 + clipFrames + 40;
const SX = 74, SY = 168, SWD = 932, SHT = 532;
export const RudoodReply: React.FC<RudoodProps> = ({ scene, look, clip, clipAudio, clipFrames: CLIP, objPos, reply, mouthData, pics = [], introFirst = false, intro }) => {
  /* introFirst: يعلّق أولاً («بص الأشعري ده…») ثم يشغّل المقطع؛ وإلا يشغّل المقطع ثم يرد */
  const REPLY = mouthData.length, I = intro ? intro.mouth.length : 0;
  const CON = introFirst ? 10 + REPLY + 12 : intro ? 10 + I + 12 : ON, REPLY_AT = introFirst ? 10 : CON + CLIP + 12;
  /* كلام الشيخ في الفيديو: تعليق أول (إن وُجد) ثم الرد */
  const speeches = intro && !introFirst ? [{ at: 10, data: intro.mouth }, { at: REPLY_AT, data: mouthData }] : [{ at: REPLY_AT, data: mouthData }];
  const f = useCurrentFrame(), d = rudoodLook(look), FL = 884 + 760, sc: Scene = { ...rudoodScene(look), ...scene };
  const sp = speeches.find((q) => f >= q.at - 6 && f < q.at + q.data.length + 20) || speeches[speeches.length - 1];
  const r = f - sp.at, SPL = sp.data.length, mouth = r >= 0 && r < SPL ? sp.data[r] : 0;
  /* الكاميرا: تقترب قليلاً من الشاشة أثناء مقطعها، ثم تنزل إليه حين يرد */
  const zIn = interpolate(f, [CON, CON + 60], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const toHim = intro && !introFirst
    ? interpolate(f, [10, 35, CON - 12, CON + 12, REPLY_AT - 10, REPLY_AT + 25], [0, 1, 1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : introFirst
    ? interpolate(f, [REPLY_AT, REPLY_AT + 25, CON - 12, CON + 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [REPLY_AT - 10, REPLY_AT + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const z = zIn + 0.03 * toHim, oy = interpolate(toHim, [0, 1], [420, 1180]);
  const t = f / 30, cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const attend = interpolate(f, [CON + 4, CON + 24, CON + CLIP + 4, CON + CLIP + 20], [0, 1, 1, 0], cl);
  const listen = interpolate(f, [CON + 6, CON + 30, CON + Math.round(0.27 * CLIP), CON + Math.round(0.34 * CLIP), CON + Math.round(0.74 * CLIP), CON + Math.round(0.83 * CLIP), CON + CLIP + 2, CON + CLIP + 16], [0, 1, 1, 0, 0, 1, 1, 0], cl);
  const lean = interpolate(f, [CON + Math.round(0.29 * CLIP), CON + Math.round(0.4 * CLIP), CON + Math.round(0.67 * CLIP), CON + Math.round(0.74 * CLIP)], [0, 1, 1, 0], cl);
  const shake = interpolate(f, [CON + Math.round(0.68 * CLIP), CON + Math.round(0.72 * CLIP), CON + Math.round(0.9 * CLIP), CON + Math.round(0.95 * CLIP)], [0, 1, 1, 0], cl);
  const act = r >= -6 && r < SPL + 6 ? sp.data.slice(Math.max(0, r - 12), Math.max(0, r + 12)).reduce((a, b) => a + b, 0) / 24 : 0;
  const talk = Math.min(1, act * 1.8) * interpolate(r, [-6, 10, SPL, SPL + 20], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(f, [CON - 2, CON + 2, CON + 8], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paused = f >= CON + CLIP;
  /* الشرب: أول رشفة بعد ٥٥ إطاراً من بدء المقطع ثم كل ٣٠٠ إطار (رفع ١٨ + إمساك ٣٠ + إنزال ١٨)، ولا رشفة وقت هزّ الرأس ولا قبل الرد */
  let sip = 0;
  if (sc.drink !== "none") for (let s0 = CON + 55; s0 + 66 < CON + CLIP - 40; s0 += 300) {
    if (s0 + 66 > CON + 0.68 * CLIP && s0 < CON + 0.95 * CLIP) continue;
    sip = Math.max(sip, interpolate(f, [s0, s0 + 18, s0 + 48, s0 + 66], [0, 1, 1, 0], cl));
  }
  return (
    <AbsoluteFill style={{ background: d.wall, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `540px ${oy}px` }}>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <RudoodRoom d={d} on={f >= CON} />
          <g transform={`translate(${540 - 430 * 1.15},${FL + 20 - 905 * 1.15}) scale(1.15)`}><Figure d={d} i={98} mouth={mouth} listen={listen} attend={attend} lean={lean} shake={shake} talk={talk} t={t} sit={sc.sit} drink={sc.drink} table={sc.table} sip={sip} /></g>
        </svg>
        {/* الشاشة: مقطعها يعمل ثم يتوقف عند آخر إطار */}
        <div style={{ position: "absolute", left: SX, top: SY, width: SWD, height: SHT, overflow: "hidden", background: "#141210" }}>
          <Sequence from={CON} durationInFrames={CLIP} layout="none">
            <OffthreadVideo muted src={staticFile(clip)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: objPos }} />
          </Sequence>
          {(introFirst || intro) && f < CON && (
            <>
              <Freeze frame={Math.min(45, CLIP - 1)}><OffthreadVideo muted src={staticFile(clip)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: objPos, filter: "brightness(.5) saturate(.7)" }} /></Freeze>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-40%,-50%)", width: 0, height: 0, borderTop: "56px solid transparent", borderBottom: "56px solid transparent", borderLeft: "92px solid rgba(255,255,255,.92)" }} />
            </>
          )}
          {paused && (
            <Freeze frame={Math.max(0, CLIP - 20)}>
              <OffthreadVideo muted src={staticFile(clip)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: objPos, filter: "brightness(.55) saturate(.7)" }} />
            </Freeze>
          )}
          {(() => { const rs = (f - (CON + CLIP + 12)) / 30, p = pics.find((q) => rs >= q.a && rs < q.b); if (!p) return null;
            const k = (rs - p.a) / (p.b - p.a);
            return <Img src={staticFile(p.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 28%", transform: `scale(${1.04 + 0.08 * k})` }} />; })()}
          {paused && !pics.some((q) => (f - (CON + CLIP + 12)) / 30 >= q.a && (f - (CON + CLIP + 12)) / 30 < q.b) && (
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${interpolate(f, [CON + CLIP, CON + CLIP + 8], [1.4, 1], { extrapolateRight: "clamp" })})`, display: "flex", gap: 22 }}>
              {[0, 1].map((k) => <div key={k} style={{ width: 34, height: 110, background: "rgba(255,255,255,.92)", borderRadius: 6, boxShadow: "0 4px 18px rgba(0,0,0,.4)" }} />)}
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: "rgba(0,0,0,.45)" }} />
          <div style={{ position: "absolute", left: 8, bottom: 5, height: 4, width: (SWD - 16) * interpolate(f, [CON, CON + CLIP], [0.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), background: "#e2423a" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
        </div>
      </AbsoluteFill>
      <Sequence from={CON - 3} durationInFrames={20}><Audio src={staticFile("ref_sfx/tap.wav")} volume={0.05} /></Sequence>
      <Sequence from={CON + CLIP} durationInFrames={20}><Audio src={staticFile("ref_sfx/tap.wav")} volume={0.05} /></Sequence>
      {/* صوتها عنصر مستقل: محرك كرت الشاشة لا يأخذ صوت الفيديو المضمَّن */}
      <Sequence from={CON} durationInFrames={CLIP}><Audio src={staticFile(clipAudio)} /></Sequence>
      <Sequence from={REPLY_AT} durationInFrames={REPLY + 30}><Audio src={staticFile(reply)} /></Sequence>
      {intro && !introFirst && <Sequence from={10} durationInFrames={I + 30}><Audio src={staticFile(intro.src)} /></Sequence>}
    </AbsoluteFill>
  );
};

/* معرض مشاهد «شيخ الردود» للمراجعة: إطار لكل مشهد (جلسة، مشروب، طاولة) وإطارات لحالات الفم واليدين والرشفة؛ ليس فيديو للتسليم */
type SceneItem = { scene: Scene; mouth?: number; listen?: number; talk?: number; sip?: number };
const SCENE_ITEMS: SceneItem[] = [
  { scene: CLASSIC }, { scene: CLASSIC, mouth: 0.85 }, { scene: CLASSIC, listen: 1 }, { scene: CLASSIC, talk: 1, mouth: 0.5 },
  ...SCENES.map((scene) => ({ scene })),
  ...SCENES.filter((q) => q.drink !== "none").map((scene) => ({ scene, sip: 1 })),
];
export const SHEIKH_RUDOOD_SCENES_FRAMES = SCENE_ITEMS.length;
export const SheikhRudoodScenes: React.FC = () => {
  const f = useCurrentFrame(), it = SCENE_ITEMS[Math.min(f, SCENE_ITEMS.length - 1)], d = rudoodLook(f + 9), FL = 884 + 760;
  return (
    <AbsoluteFill style={{ background: d.wall, overflow: "hidden" }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <RudoodRoom d={d} on />
        <g transform={`translate(${540 - 430 * 1.15},${FL + 20 - 905 * 1.15}) scale(1.15)`}>
          <Figure d={d} i={97} mouth={it.mouth || 0} listen={it.listen || 0} talk={it.talk || 0} attend={it.listen ? 1 : 0} t={f * 0.4} sit={it.scene.sit} drink={it.scene.drink} table={it.scene.table} sip={it.sip || 0} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
