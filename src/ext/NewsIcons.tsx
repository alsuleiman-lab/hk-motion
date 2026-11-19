import React from "react";
import { staticFile } from "remotion";
import { HS } from "./HistStyle";
import { mulberry32 } from "./rand";

/** أيقونات مرسومة بالشيفرة للموشن التوضيحي (أخبار معاصرة): بلا نص ولا وجوه، بأحبار الرق ذاتها. */
const INK = HS.ink, SEPIA = HS.sepia, RED = HS.vermilion, GOLD = HS.gold, TEAL = HS.verdigris, PARCH = HS.parch;

/** نصف تمثال بلا وجه داخل إطار؛ `photo` (مسار داخل public) يُستعمل صورةً حقيقية موثقة حين تتوفر. */
export const Bust: React.FC<{ w?: number; h?: number; photo?: string; tone?: string; bars?: number }> = ({ w = 470, h = 300, photo, tone = SEPIA, bars = 0 }) => (
  <svg width={w} height={h} viewBox="0 0 470 300" style={{ display: "block" }}>
    <defs><clipPath id="bustclip"><rect x="8" y="8" width="454" height="284" rx="10" /></clipPath></defs>
    <rect x="3" y="3" width="464" height="294" rx="12" fill={PARCH} stroke={SEPIA} strokeWidth="5" />
    <rect x="12" y="12" width="446" height="276" rx="8" fill="#ecd9a8" stroke={GOLD} strokeWidth="3" />
    {photo ? <image href={staticFile(photo)} x="8" y="8" width="454" height="284" preserveAspectRatio="xMidYMid slice" clipPath="url(#bustclip)" /> : (
      <g clipPath="url(#bustclip)">
        <circle cx="235" cy="118" r="62" fill={tone} opacity="0.8" />
        <path d="M70 300 C70 215 140 192 235 192 C330 192 400 215 400 300 Z" fill={tone} opacity="0.8" />
      </g>
    )}
    {bars > 0 && (
      <g clipPath="url(#bustclip)" transform={`translate(0 ${-(1 - bars) * 300})`}>
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={46 + i * 48} y="0" width="14" height="300" rx="5" fill="#4a3a28" stroke={INK} strokeWidth="2" />)}
        <rect x="8" y="28" width="454" height="14" fill="#4a3a28" /><rect x="8" y="250" width="454" height="14" fill="#4a3a28" />
      </g>
    )}
  </svg>
);

/** مبنى بأعمدة وجبهة؛ `seal` من 0 إلى 1 يرسم سلسلتين وقفلاً على بابه. */
export const Building: React.FC<{ s?: number; seal?: number; tone?: string; dome?: boolean }> = ({ s = 320, seal = 0, tone = "#c9b184", dome }) => (
  <svg width={s} height={s * 0.82} viewBox="0 0 320 262">
    {dome ? (
      <g>
        <path d="M70 92 A90 78 0 0 1 250 92 Z" fill="#7fb0a8" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <line x1="160" y1="14" x2="160" y2="-4" stroke={INK} strokeWidth="5" /><circle cx="160" cy="6" r="6" fill={GOLD} stroke={INK} strokeWidth="3" />
        <rect x="270" y="30" width="26" height="62" fill={tone} stroke={INK} strokeWidth="4" /><path d="M268 30 L283 6 L298 30 Z" fill="#7fb0a8" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </g>
    ) : <path d="M10 92 L160 14 L310 92 Z" fill={tone} stroke={INK} strokeWidth="5" strokeLinejoin="round" />}
    <rect x="22" y="92" width="276" height="16" fill={tone} stroke={INK} strokeWidth="4" />
    {[48, 100, 160, 212, 264].map((x) => <rect key={x} x={x - 14} y="108" width="28" height="112" fill={PARCH} stroke={INK} strokeWidth="4" />)}
    <rect x="12" y="220" width="296" height="14" fill={tone} stroke={INK} strokeWidth="4" />
    <rect x="2" y="234" width="316" height="18" fill={tone} stroke={INK} strokeWidth="4" />
    {seal > 0 && (
      <g>
        <line x1="30" y1="120" x2="290" y2="214" stroke="#3a2f22" strokeWidth="9" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 * (1 - Math.min(1, seal * 1.6))} />
        <line x1="290" y1="120" x2="30" y2="214" stroke="#3a2f22" strokeWidth="9" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 * (1 - Math.min(1, Math.max(0, seal * 1.6 - 0.3)))} />
        <g opacity={Math.max(0, seal * 2 - 1)}>
          <path d="M138 150 a22 22 0 0 1 44 0" fill="none" stroke="#3a2f22" strokeWidth="9" />
          <rect x="126" y="150" width="68" height="52" rx="8" fill={GOLD} stroke={INK} strokeWidth="5" />
          <circle cx="160" cy="172" r="7" fill={INK} />
        </g>
      </g>
    )}
  </svg>
);

/** رسالة مختومة. */
export const Envelope: React.FC<{ s?: number }> = ({ s = 200 }) => (
  <svg width={s} height={s * 0.7} viewBox="0 0 200 140">
    <rect x="6" y="14" width="188" height="118" rx="8" fill={PARCH} stroke={INK} strokeWidth="5" />
    <path d="M8 18 L100 84 L192 18" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="100" cy="84" r="20" fill={RED} stroke={INK} strokeWidth="4" />
    <circle cx="100" cy="84" r="9" fill="none" stroke={PARCH} strokeWidth="3" />
  </svg>
);

/** ختم دائري بعلامة صح (موافقة) أو ✕. */
export const Stamp: React.FC<{ s?: number; kind?: "ok" | "no"; color?: string }> = ({ s = 130, kind = "ok", color = TEAL }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="6" />
    <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="2.5" />
    {kind === "ok" ? <path d="M28 52 L44 68 L74 32" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /> : <g stroke={color} strokeWidth="9" strokeLinecap="round"><line x1="30" y1="30" x2="70" y2="70" /><line x1="70" y1="30" x2="30" y2="70" /></g>}
  </svg>
);

/** كتاب مفتوح. */
export const Book: React.FC<{ s?: number }> = ({ s = 170 }) => (
  <svg width={s} height={s * 0.7} viewBox="0 0 170 120">
    <path d="M85 20 C60 6 30 8 8 16 L8 102 C30 94 60 94 85 108 Z" fill={PARCH} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M85 20 C110 6 140 8 162 16 L162 102 C140 94 110 94 85 108 Z" fill="#f1dfae" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    {[34, 50, 66].map((y) => <g key={y} stroke={SEPIA} strokeWidth="3" strokeLinecap="round"><line x1="22" y1={y} x2="70" y2={y + 3} /><line x1="100" y1={y + 3} x2="148" y2={y} /></g>)}
  </svg>
);

/** ميزان بكفتين؛ `tilt` بالدرجات (موجب = اليمين أخفض). الكفتان تتسعان لعنصرين. */
export const Scales: React.FC<{ s?: number; tilt?: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ s = 640, tilt = 0, left, right }) => {
  const r = (tilt * Math.PI) / 180, L = 186;
  const lx = 320 - Math.cos(r) * L, ly = 120 - Math.sin(r) * L, rx = 320 + Math.cos(r) * L, ry = 120 + Math.sin(r) * L;
  return (
    <div style={{ position: "relative", width: s, height: s * 0.78 }}>
      <svg width={s} height={s * 0.78} viewBox="0 0 640 500" style={{ position: "absolute", inset: 0 }}>
        <rect x="306" y="120" width="28" height="330" fill={HS.sepia} stroke={INK} strokeWidth="4" />
        <path d="M200 470 L440 470 L400 440 L240 440 Z" fill={HS.sepia} stroke={INK} strokeWidth="4" />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={INK} strokeWidth="12" strokeLinecap="round" />
        <circle cx="320" cy="120" r="16" fill={GOLD} stroke={INK} strokeWidth="4" />
        {[[lx, ly], [rx, ry]].map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x - 90} y2={y + 170} stroke={INK} strokeWidth="4" /><line x1={x} y1={y} x2={x + 90} y2={y + 170} stroke={INK} strokeWidth="4" />
            <path d={`M${x - 112} ${y + 170} L${x + 112} ${y + 170} Q${x + 90} ${y + 222} ${x} ${y + 222} Q${x - 90} ${y + 222} ${x - 112} ${y + 170} Z`} fill="#e2c07c" stroke={INK} strokeWidth="5" />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", left: (lx - 100) * (s / 640), top: (ly + 40) * (s / 640), width: 200 * (s / 640), display: "flex", justifyContent: "center" }}>{left}</div>
      <div style={{ position: "absolute", left: (rx - 100) * (s / 640), top: (ry + 40) * (s / 640), width: 200 * (s / 640), display: "flex", justifyContent: "center" }}>{right}</div>
    </div>
  );
};

/** رؤوس جمهور بلا وجوه: `n` رأساً في شبكة، بذرة ثابتة. `hi` عدد المبرَز منها بالأحمر. */
export const Crowd: React.FC<{ w: number; h: number; n: number; seed?: number; hi?: number; size?: number }> = ({ w, h, n, seed = 5, hi = 0, size = 30 }) => {
  const rnd = mulberry32(seed);
  const cols = Math.max(1, Math.floor(w / (size * 1.25)));
  const ox = (w - Math.min(n, cols) * size * 1.25) / 2;
  return (
    <svg width={w} height={h}>
      {Array.from({ length: n }, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = ox + c * size * 1.25 + size * 0.7 + (rnd() - 0.5) * 6, y = r * size * 1.35 + size * 0.8 + (rnd() - 0.5) * 6;
        const col = i < hi ? RED : SEPIA;
        return <g key={i} fill={col} opacity={0.88}><circle cx={x} cy={y} r={size * 0.3} /><path d={`M${x - size * 0.46} ${y + size * 0.78} Q${x} ${y + size * 0.18} ${x + size * 0.46} ${y + size * 0.78} Z`} /></g>;
      })}
    </svg>
  );
};

/** ساعة بعقربين (دوام أسبوعي). */
export const Clock: React.FC<{ s?: number; a?: number }> = ({ s = 150, a = 0 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" fill={PARCH} stroke={INK} strokeWidth="6" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1="50" y1="12" x2="50" y2={i % 3 === 0 ? 22 : 18} stroke={INK} strokeWidth="3" transform={`rotate(${i * 30} 50 50)`} />)}
    <line x1="50" y1="50" x2="50" y2="22" stroke={INK} strokeWidth="5" strokeLinecap="round" transform={`rotate(${a * 12} 50 50)`} />
    <line x1="50" y1="50" x2="50" y2="32" stroke={RED} strokeWidth="6" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />
  </svg>
);

/** ثلاثة أطفال بلا وجوه. */
export const Kids: React.FC<{ s?: number }> = ({ s = 300 }) => (
  <svg width={s} height={s * 0.5} viewBox="0 0 300 150">
    {[70, 150, 230].map((x, i) => <g key={x} fill={[RED, TEAL, GOLD][i]} opacity="0.92"><circle cx={x} cy="68" r="28" /><path d={`M${x - 30} 142 Q${x} 92 ${x + 30} 142 Z`} /><rect x={x - 16} y="112" width="32" height="26" rx="4" fill={PARCH} stroke={INK} strokeWidth="3" /></g>)}
  </svg>
);

/** هاتف بزر تشغيل (تسجيل قديم). */
export const PhoneVideo: React.FC<{ s?: number }> = ({ s = 170 }) => (
  <svg width={s * 0.6} height={s} viewBox="0 0 102 170">
    <rect x="4" y="4" width="94" height="162" rx="16" fill={PARCH} stroke={INK} strokeWidth="6" />
    <rect x="14" y="22" width="74" height="120" rx="4" fill="#d8c08a" />
    <path d="M40 64 L72 82 L40 100 Z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <circle cx="51" cy="154" r="5" fill={INK} />
  </svg>
);

/** حلقة نقاط (تحالف دولي) حول كرة. */
export const Coalition: React.FC<{ s?: number }> = ({ s = 200 }) => (
  <svg width={s} height={s} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="44" fill="#cfe0d8" stroke={INK} strokeWidth="5" />
    <ellipse cx="100" cy="100" rx="20" ry="44" fill="none" stroke={INK} strokeWidth="3" /><line x1="56" y1="100" x2="144" y2="100" stroke={INK} strokeWidth="3" />
    {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <circle key={i} cx={100 + Math.cos(a) * 84} cy={100 + Math.sin(a) * 84} r="9" fill={TEAL} stroke={INK} strokeWidth="3" />; })}
  </svg>
);

/** مكبّر صوت. */
export const Megaphone: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 150 150">
    <path d="M26 58 L96 22 L96 122 L26 90 Z" fill={GOLD} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <rect x="10" y="56" width="22" height="36" rx="6" fill={PARCH} stroke={INK} strokeWidth="5" />
    <path d="M110 50 Q128 72 110 96 M122 38 Q150 72 122 108" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/** شخص بشارة عضوية. */
export const PersonBadge: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 150 150">
    <circle cx="75" cy="46" r="26" fill={SEPIA} /><path d="M24 140 Q75 52 126 140 Z" fill={SEPIA} />
    <rect x="62" y="96" width="26" height="18" rx="3" fill={PARCH} stroke={INK} strokeWidth="3" />
  </svg>
);

/** إشارة منع (دائرة بخط مائل) فوق عنصر؛ `k` من 0 إلى 1 لرسمها. */
export const Forbid: React.FC<{ s: number; k: number; color?: string }> = ({ s, k, color = RED }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{ position: "absolute", left: 0, top: 0 }}>
    <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="8" strokeDasharray="276" strokeDashoffset={276 * (1 - Math.min(1, k * 1.5))} />
    <line x1="19" y1="19" x2="81" y2="81" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray="88" strokeDashoffset={88 * (1 - Math.min(1, Math.max(0, k * 1.5 - 0.5)))} />
  </svg>
);

/** ورقة: `kind` = blank (فارغة بسطور متقطعة) | question | slash (شُطبت). */
export const Doc: React.FC<{ s?: number; kind?: "blank" | "question" | "slash" }> = ({ s = 170, kind = "blank" }) => (
  <svg width={s * 0.78} height={s} viewBox="0 0 130 166">
    <path d="M10 6 H88 L122 40 V160 H10 Z" fill={PARCH} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M88 6 V40 H122" fill="#e2c07c" stroke={INK} strokeWidth="5" />
    {kind === "blank" && [66, 90, 114, 138].map((y) => <line key={y} x1="28" y1={y} x2="104" y2={y} stroke={SEPIA} strokeWidth="3" strokeDasharray="7 7" />)}
    {kind === "question" && <text x="66" y="128" textAnchor="middle" fontSize="92" fontWeight="700" fill={RED} fontFamily="serif">?</text>}
    {kind === "slash" && <>{[66, 90, 114].map((y) => <line key={y} x1="28" y1={y} x2="104" y2={y} stroke={SEPIA} strokeWidth="3" />)}<line x1="14" y1="148" x2="118" y2="26" stroke={RED} strokeWidth="9" strokeLinecap="round" /></>}
  </svg>
);

/** كرسي (موقع قرار). */
export const Chair: React.FC<{ s?: number; color?: string }> = ({ s = 130, color = SEPIA }) => (
  <svg width={s} height={s} viewBox="0 0 130 130">
    <path d="M30 14 H100 V74 H30 Z" fill={color} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <rect x="18" y="74" width="94" height="22" rx="6" fill={color} stroke={INK} strokeWidth="5" />
    <rect x="26" y="96" width="12" height="28" fill={INK} /><rect x="92" y="96" width="12" height="28" fill={INK} />
  </svg>
);

/** تقويم (أيام الحبس). */
export const Calendar: React.FC<{ s?: number }> = ({ s = 150 }) => (
  <svg width={s} height={s} viewBox="0 0 150 150">
    <rect x="10" y="20" width="130" height="120" rx="10" fill={PARCH} stroke={INK} strokeWidth="6" />
    <rect x="10" y="20" width="130" height="30" rx="10" fill={RED} stroke={INK} strokeWidth="6" />
    {Array.from({ length: 15 }, (_, i) => <rect key={i} x={24 + (i % 5) * 22} y={64 + Math.floor(i / 5) * 24} width="14" height="14" rx="2" fill={SEPIA} />)}
  </svg>
);

/** سهم دائري للرجوع بالزمن؛ `a` زاوية الدوران بالدرجات (عكس عقارب الساعة). */
export const Rewind: React.FC<{ s?: number; a?: number }> = ({ s = 360, a = 0 }) => (
  <svg width={s} height={s} viewBox="0 0 200 200" style={{ transform: `rotate(${-a}deg)` }}>
    <path d="M100 30 A70 70 0 1 1 38 66" fill="none" stroke={SEPIA} strokeWidth="14" strokeLinecap="round" />
    <path d="M20 40 L40 78 L78 56 Z" fill={SEPIA} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <circle cx="100" cy="100" r="9" fill={RED} /><line x1="100" y1="100" x2="100" y2="62" stroke={INK} strokeWidth="7" strokeLinecap="round" /><line x1="100" y1="100" x2="128" y2="112" stroke={INK} strokeWidth="7" strokeLinecap="round" />
  </svg>
);

/** شارة استفهام دائرية (اسم مذكور دون إجراء موثّق). */
export const QBadge: React.FC<{ s?: number }> = ({ s = 110 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill={PARCH} stroke={RED} strokeWidth="7" strokeDasharray="12 8" /><text x="50" y="70" textAnchor="middle" fontSize="70" fontWeight="700" fill={RED} fontFamily="serif">?</text></svg>
);

/** ورقة شهر بتاريخ رقمي (يوم/شهر) فوق شريط أحمر. */
export const MonthCard: React.FC<{ n: string; s?: number }> = ({ n, s = 260 }) => (
  <svg width={s} height={s} viewBox="0 0 200 200">
    <rect x="12" y="22" width="176" height="166" rx="14" fill={PARCH} stroke={INK} strokeWidth="6" />
    <rect x="12" y="22" width="176" height="46" rx="14" fill={RED} stroke={INK} strokeWidth="6" />
    <circle cx="56" cy="22" r="9" fill={INK} /><circle cx="144" cy="22" r="9" fill={INK} />
    <text x="100" y="158" textAnchor="middle" fontSize="92" fontWeight="600" fill={INK} fontFamily="'EB Garamond', serif">{n}</text>
  </svg>
);

/** صورة حقيقية (من ملفات المستخدم) داخل إطار مربع بحدّ رق؛ `bars` 0–1 لهبوط القضبان فوقها. */
export const PhotoBust: React.FC<{ photo: string; s?: number; bars?: number }> = ({ photo, s = 300, bars = 0 }) => (
  <svg width={s} height={s} viewBox="0 0 300 300" style={{ display: "block" }}>
    <defs><clipPath id="pbclip"><rect x="8" y="8" width="284" height="284" rx="10" /></clipPath></defs>
    <rect x="3" y="3" width="294" height="294" rx="12" fill={PARCH} stroke={SEPIA} strokeWidth="5" />
    <image href={staticFile(photo)} x="8" y="8" width="284" height="284" preserveAspectRatio="xMidYMin slice" clipPath="url(#pbclip)" />
    <rect x="8" y="8" width="284" height="284" rx="10" fill="none" stroke={GOLD} strokeWidth="3" />
    {bars > 0 && (
      <g clipPath="url(#pbclip)" transform={`translate(0 ${-(1 - bars) * 300})`}>
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={30 + i * 40} y="0" width="8" height="300" rx="4" fill="#4a3a28" fillOpacity="0.85" stroke={INK} strokeWidth="1.5" />)}
        <rect x="8" y="30" width="284" height="13" fill="#4a3a28" /><rect x="8" y="248" width="284" height="13" fill="#4a3a28" />
      </g>
    )}
  </svg>
);
