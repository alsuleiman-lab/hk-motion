import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * «لوحة ١»: رسم بالكود (SVG) لصورة الفارس الملثّم أمام الجيش، لمطابقتها بصرياً وقياساً مع الصورة المرجعية (١٠٢٤×٥٧٦).
 * الحصان بلا عين (أمر المستخدم)، وعينا الفارس عربيتان رجوليتان. صورة واحدة بلا تحريك.
 */
export const KEY1_W = 1024, KEY1_H = 576;
const seeded = (seed: number) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); };
const LN = "#080706";

/** خوذة جندي طويلة بفتحة نظر: مركزها (x,y)، نصف عرضها rx ونصف ارتفاعها ry */
const Helmet: React.FC<{ x: number; y: number; rx: number; ry: number; lit?: number; body?: boolean }> = ({ x, y, rx, ry, lit = 1, body = false }) => (
  <g opacity={lit}>
    {body && <path d={`M ${x - rx * 2.4} ${y + ry * 2.2} Q ${x - rx * 2.2} ${y + ry * 0.7} ${x - rx * 0.8} ${y + ry * 0.75} L ${x + rx * 0.8} ${y + ry * 0.75} Q ${x + rx * 2.2} ${y + ry * 0.7} ${x + rx * 2.4} ${y + ry * 2.2} Z`} fill="#241f19" />}
    <path d={`M ${x - rx} ${y + ry * 0.35} Q ${x - rx * 1.08} ${y - ry * 0.95} ${x} ${y - ry} Q ${x + rx * 1.08} ${y - ry * 0.95} ${x + rx} ${y + ry * 0.35} Q ${x + rx * 0.9} ${y + ry * 0.8} ${x + rx * 0.3} ${y + ry} L ${x - rx * 0.3} ${y + ry} Q ${x - rx * 0.9} ${y + ry * 0.8} ${x - rx} ${y + ry * 0.35} Z`} fill="url(#steel)" filter="url(#relS)" stroke={LN} strokeWidth={Math.max(1, rx * 0.07)} />
    <path d={`M ${x - rx * 0.86} ${y - ry * 0.08} Q ${x} ${y - ry * 0.22} ${x + rx * 0.86} ${y - ry * 0.08} L ${x + rx * 0.8} ${y + ry * 0.1} Q ${x} ${y - ry * 0.04} ${x - rx * 0.8} ${y + ry * 0.1} Z`} fill="#070707" />
    <path d={`M ${x} ${y - ry * 0.98} L ${x} ${y + ry * 0.98}`} stroke="#101114" strokeWidth={Math.max(1, rx * 0.08)} opacity={0.55} />
    <path d={`M ${x - rx * 0.7} ${y + ry * 0.12} Q ${x - rx * 0.55} ${y + ry * 0.7} ${x - rx * 0.2} ${y + ry * 0.95}`} fill="none" stroke="#15161a" strokeWidth={Math.max(1, rx * 0.06)} opacity={0.6} />
    <path d={`M ${x - rx * 0.8} ${y - ry * 0.5} Q ${x - rx * 0.35} ${y - ry * 0.95} ${x} ${y - ry * 0.9}`} fill="none" stroke="#dfe3e8" strokeWidth={Math.max(1, rx * 0.11)} opacity={0.6} strokeLinecap="round" />
    <path d={`M ${x + rx * 0.55} ${y - ry * 0.5} Q ${x + rx * 0.85} ${y - ry * 0.1} ${x + rx * 0.8} ${y + ry * 0.3}`} fill="none" stroke="#8d939b" strokeWidth={Math.max(1, rx * 0.07)} opacity={0.45} strokeLinecap="round" />
  </g>
);

export const KeyArt1: React.FC = () => {
  const r = seeded(11);
  // صف الخوذ البعيدة: متفاوتة الحجم والإضاءة
  const back = Array.from({ length: 80 }, (_, i) => { const row = i % 2; return { x: 4 + Math.floor(i / 2) * 26 + row * 13 + r() * 5, y: 254 + r() * 5 - row * 9, rx: 10.5 + r() * 2.5 - row * 1, lit: 0.92 + r() * 0.08 - row * 0.2, row }; }).sort((p, q) => p.row - q.row);
  return (
    <AbsoluteFill style={{ background: "#2a2a2c" }}>
      <svg width={KEY1_W} height={KEY1_H} viewBox={`0 0 ${KEY1_W} ${KEY1_H}`}>
        <defs>
          <filter id="b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="b5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="b12" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
          <filter id="b26" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="26" /></filter>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7d7464" /><stop offset="0.28" stopColor="#a8957a" /><stop offset="0.5" stopColor="#dcc7a0" /><stop offset="0.64" stopColor="#ecdcb6" /><stop offset="0.8" stopColor="#d4bb94" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#f0e2bd" stopOpacity="0.95" /><stop offset="1" stopColor="#f0e2bd" stopOpacity="0" /></radialGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a9aeb6" /><stop offset="0.4" stopColor="#62666e" /><stop offset="1" stopColor="#1f2125" /></linearGradient>
          <linearGradient id="horseFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5d4d42" /><stop offset="0.45" stopColor="#372d29" /><stop offset="1" stopColor="#1b1514" /></linearGradient>
          <linearGradient id="horseNeck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1b1717" /><stop offset="1" stopColor="#090808" /></linearGradient>
          <linearGradient id="cloak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2c2b2b" /><stop offset="0.5" stopColor="#101010" /><stop offset="1" stopColor="#040404" /></linearGradient>
          <linearGradient id="cloakL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1c1c1b" /><stop offset="1" stopColor="#403f3d" /></linearGradient>
          <linearGradient id="vest" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#74757b" /><stop offset="0.55" stopColor="#585960" /><stop offset="1" stopColor="#35363c" /></linearGradient>
          <linearGradient id="sleeve" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#47474b" /><stop offset="1" stopColor="#1d1d20" /></linearGradient>
          <radialGradient id="dust" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#bd9e74" stopOpacity="0.9" /><stop offset="1" stopColor="#b08f66" stopOpacity="0" /></radialGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a4a38" /><stop offset="0.5" stopColor="#7b6648" /><stop offset="1" stopColor="#9a7e5a" /></linearGradient>
        <filter id="cloudDark" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0055 0.013" numOctaves="5" seed="7" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.6 0 0 0 -2.45" /></filter>
          <filter id="cloudMid" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves="4" seed="19" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 5 0 0 -2.5" /></filter>
          <linearGradient id="cmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="0.3" stopColor="#fff" /><stop offset="0.52" stopColor="#555" /><stop offset="0.62" stopColor="#000" /></linearGradient>
          <linearGradient id="cmx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#777" /><stop offset="0.35" stopColor="#bbb" /><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#fff" /></linearGradient>
          <mask id="cloudMask"><rect width={1024} height={340} fill="url(#cmg)" /><rect width={1024} height={340} fill="url(#cmx)" style={{ mixBlendMode: "multiply" }} /></mask>
        <filter id="relS" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2" result="h" /><feDiffuseLighting in="h" surfaceScale="3" diffuseConstant="1" lightingColor="#ffffff" result="d"><feDistantLight azimuth="225" elevation="48" /></feDiffuseLighting><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="-0.22" result="m" /><feComposite in="m" in2="SourceAlpha" operator="in" /></filter><filter id="relM" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="5" result="h" /><feDiffuseLighting in="h" surfaceScale="6" diffuseConstant="1" lightingColor="#ffffff" result="d"><feDistantLight azimuth="225" elevation="48" /></feDiffuseLighting><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="0" k2="1" k3="0.34" k4="-0.25" result="m" /><feComposite in="m" in2="SourceAlpha" operator="in" /></filter><filter id="relB" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="9" result="h" /><feDiffuseLighting in="h" surfaceScale="9" diffuseConstant="1" lightingColor="#ffffff" result="d"><feDistantLight azimuth="225" elevation="48" /></feDiffuseLighting><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="0" k2="1" k3="0.38" k4="-0.28" result="m" /><feComposite in="m" in2="SourceAlpha" operator="in" /></filter><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.9 -0.28" /></filter></defs>

        {/* ───── السماء ───── */}
        <rect width={1024} height={340} fill="url(#sky)" />
        
        
        <ellipse cx={920} cy={232} rx={150} ry={26} fill="#cdbb9c" opacity={0.6} filter="url(#b12)" />
        {/* غيوم عضوية: ضجيج كسري مُقطَّع بقناع تدرّجي */}
        <g mask="url(#cloudMask)">
          <rect width={1024} height={340} fill="#1d1d1b" filter="url(#cloudDark)" />
          <rect width={1024} height={340} fill="#6d5a45" filter="url(#cloudMid)" opacity={0.8} />
        </g>
        <ellipse cx={80} cy={185} rx={230} ry={62} fill="#f3e6c2" opacity={0.95} filter="url(#b12)" />
        <ellipse cx={300} cy={215} rx={260} ry={34} fill="#ecd9b0" opacity={0.95} filter="url(#b12)" />
        <ellipse cx={560} cy={222} rx={140} ry={22} fill="#d8c19a" opacity={0.8} filter="url(#b12)" />
        <path d="M 330 30 L 346 48 L 338 58 L 358 76" fill="none" stroke="#a9bfd3" strokeWidth={1.6} opacity={0.35} />
        {/* عتمة أعلى الوسط ويمين السماء */}
        <g filter="url(#b26)" opacity={0.55}>
          <ellipse cx={430} cy={50} rx={170} ry={46} fill="#161615" />
          <ellipse cx={870} cy={70} rx={190} ry={60} fill="#1f2020" />
        </g>

        {/* ───── الأرض ───── */}
        <rect y={258} width={1024} height={318} fill="url(#ground)" />
        <g filter="url(#b26)">
          <ellipse cx={500} cy={290} rx={620} ry={50} fill="#6e5f4a" opacity={0.8} />
          <ellipse cx={90} cy={540} rx={260} ry={60} fill="#a9906a" opacity={0.9} />
          <ellipse cx={920} cy={480} rx={240} ry={110} fill="#b79672" opacity={0.9} />
          <ellipse cx={700} cy={570} rx={300} ry={40} fill="#8a735a" opacity={0.7} />
        </g>

        {/* ───── جنود الخلف: أجسام داكنة وخوذ ───── */}
        <rect y={262} width={1024} height={150} fill="#413a2f" opacity={0.85} filter="url(#b5)" />
                {back.map((h, i) => <Helmet key={i} x={h.x} y={h.y} rx={h.rx} ry={h.rx * 1.5} lit={h.lit} body />)}
        <rect y={228} width={1024} height={80} fill="#c9a97c" opacity={0.08} />
        {/* رايات سوداء بأعمدتها */}
        <g>
          
          <line x1={20} y1={140} x2={20} y2={300} stroke="#1a1612" strokeWidth={3} />
          <line x1={210} y1={180} x2={205} y2={300} stroke="#1a1612" strokeWidth={3} />
          <line x1={340} y1={175} x2={336} y2={300} stroke="#1a1612" strokeWidth={3} />
          <line x1={459} y1={170} x2={455} y2={300} stroke="#1a1612" strokeWidth={3} />
          <line x1={930} y1={122} x2={920} y2={300} stroke="#1a1612" strokeWidth={4} />
          <line x1={1012} y1={160} x2={1000} y2={420} stroke="#1a1612" strokeWidth={4} />
          <path d="M 150 140 C 112 142 70 160 34 160 C 18 162 8 168 0 176 L 0 206 C 24 192 56 186 86 190 C 114 194 134 186 150 172 Z" fill="#1b1916" /><path d="M 150 142 C 118 150 80 168 44 172 C 30 174 14 180 0 190" fill="none" stroke="#4a4540" strokeWidth={2} opacity={0.7} />
          <polygon points="276,224 340,198 330,206 344,222" fill="#15140f" />
          <polygon points="378,222 458,190 448,208 462,224" fill="#15140f" />
          <polygon points="486,205 504,200 498,214 508,222 486,222" fill="#15140f" />
          <polygon points="808,194 928,176 912,196 928,210 808,212" fill="#14130f" />
          <polygon points="930,212 1012,188 1000,206 1014,218" fill="#14130f" />
        </g>

        {/* ───── جنديان في المقدمة يساراً ───── */}
        <g>
          {/* الجندي الثاني (أبعد، خافت) */}
          <path d="M 156 282 Q 190 266 218 282 Q 238 300 246 362 L 250 440 L 234 502 L 160 504 Q 146 420 150 330 Z" fill="#26241f" filter="url(#relM)" />
          <path d="M 160 318 L 208 318 L 210 384 L 162 384 Z" fill="#3b3b40" />
          <path d="M 170 330 L 200 372 M 200 330 L 170 372" stroke="#16161a" strokeWidth={1.2} opacity={0.8} />
          <rect x={159} y={380} width={52} height={10} fill="#5f342c" />
          <path d="M 172 392 L 212 392 L 212 548 L 176 548 Z" fill="#a9a8af" />
          <path d="M 172 546 L 214 546 L 218 576 L 170 576 Z" fill="#2a241f" />
          <path d="M 178 396 L 196 396 L 194 440 L 180 440 Z" fill="#c4c3c8" opacity={0.7} />
          <Helmet x={182} y={258} rx={21} ry={34} />
          {/* الجندي الأول: عباءة واسعة وصدرية مشدودة وساقان رماديتان */}
          <path d="M 80 268 Q 40 286 12 332 Q -6 384 2 440 Q 8 480 10 506 L 60 524 L 104 506 L 192 504 Q 202 440 188 380 Q 176 320 144 290 Q 120 276 100 270 Z" fill="#232220" filter="url(#relM)" />
          <path d="M 12 336 Q 48 302 66 290 L 60 424 Q 40 464 12 484 Z" fill="#161615" />
          <path d="M 186 384 Q 176 330 144 296 L 140 430 Q 170 470 190 500 Z" fill="#1a1918" />
          <path d="M 62 298 Q 92 288 124 296 L 134 334 L 130 406 L 60 410 L 56 334 Z" fill="#2d2e33" />
          <path d="M 66 306 L 128 400 M 128 306 L 66 400 M 62 350 L 132 350 M 64 380 L 130 322" stroke="#141418" strokeWidth={1.3} opacity={0.85} />
          <path d="M 70 300 Q 94 292 118 300" fill="none" stroke="#55555c" strokeWidth={1.6} opacity={0.6} />
          <rect x={54} y={402} width={82} height={12} fill="#5c2a23" />
          <rect x={86} y={403} width={9} height={10} fill="#c9a24a" />
          <rect x={42} y={400} width={16} height={38} rx={4} fill="#b07a38" />
          <rect x={122} y={398} width={20} height={26} rx={4} fill="#b8843c" />
          <path d="M 38 430 L 92 428 L 88 566 L 52 566 Q 40 500 38 430 Z" fill="#a2a1a8" />
          <path d="M 94 428 L 146 430 L 142 566 L 102 566 Z" fill="#9b9aa1" />
          <path d="M 44 436 L 70 436 L 66 480 L 46 480 Z" fill="#c7c6cb" opacity={0.65} />
          <path d="M 40 420 L 144 420 L 138 446 L 44 448 Z" fill="#4b362b" />
          <path d="M 44 556 L 92 556 L 96 576 L 40 576 Z" fill="#2a241f" />
          <path d="M 100 556 L 144 556 L 150 576 L 98 576 Z" fill="#2a241f" />
          <path d="M 50 538 L 90 538 M 104 538 L 142 538" stroke="#5a5560" strokeWidth={3} opacity={0.7} />
          <path d="M 88 440 L 94 566" stroke="#33323a" strokeWidth={5} opacity={0.7} />
          <Helmet x={88} y={262} rx={24} ry={35} />
          <path d="M 150 94 L 138 330 L 126 576" stroke="#16130f" strokeWidth={4.5} fill="none" />
          <polygon points="150,84 154,104 150,112 146,104" fill="#d9dde2" stroke="#2a2a2a" strokeWidth={0.8} />
          <path d="M 132 322 Q 134 312 142 316 L 144 340 Q 136 346 130 338 Z" fill="#dba57d" stroke="#7a5238" strokeWidth={1} />
        </g>

        {/* ───── جنود اليمين ───── */}
        <rect x={760} y={268} width={270} height={170} fill="#2e2a22" opacity={0.85} filter="url(#b5)" />
        {[792, 826, 862, 898, 934, 970, 1008].map((x, i) => <Helmet key={"r" + i} x={x} y={250 + (i % 2) * 6} rx={13 + (i % 3)} ry={19 + (i % 3)} lit={0.85} />)}
        <path d="M 940 280 L 1024 280 L 1024 330 L 940 330 Z" fill="#24211c" opacity={0.8} filter="url(#b5)" />

        {/* ───── غبار ───── */}
        <g filter="url(#b12)">
          <ellipse cx={870} cy={450} rx={150} ry={70} fill="url(#dust)" />
          <ellipse cx={980} cy={540} rx={120} ry={60} fill="url(#dust)" />
          <ellipse cx={780} cy={470} rx={110} ry={40} fill="#9a7f5c" opacity={0.7} />
          <ellipse cx={160} cy={470} rx={120} ry={60} fill="#7c6a50" opacity={0.7} />
        </g>

        {/* ───── مؤخرة الحصان والساق ───── */}
        <path d="M 776 500 Q 800 480 850 484 Q 900 490 910 530 Q 905 560 900 576 L 776 576 Z" fill="#14110f" stroke="#080706" strokeWidth={2} filter="url(#relB)" />
        <path d="M 784 506 Q 830 490 884 506" fill="none" stroke="#3a3430" strokeWidth={3} opacity={0.55} />
        <path d="M 884 512 Q 940 500 966 540 Q 985 560 990 576 L 900 576 Q 910 540 884 512 Z" fill="#17130f" />
        <path d="M 900 520 Q 940 520 962 556" fill="none" stroke="#3b332b" strokeWidth={3} opacity={0.5} />
        <path d="M 664 490 Q 700 484 750 490 L 752 576 L 676 576 Q 668 540 664 490 Z" fill="#b6b7be" filter="url(#relM)" />
        <path d="M 672 500 L 700 496 L 708 576 L 682 576 Z" fill="#d3d4d8" opacity={0.7} />
        <path d="M 540 446 Q 640 440 700 470 L 780 496 L 800 576 L 540 576 Z" fill="#16120f" />
        <path d="M 590 476 Q 625 470 652 488 L 646 520 Q 614 534 592 514 Z" fill="#8c6034" />
        <path d="M 600 482 Q 625 478 646 492" fill="none" stroke="#d2a05a" strokeWidth={2} opacity={0.8} />
        <path d="M 630 450 Q 690 468 724 540 L 706 548 Q 676 496 622 468 Z" fill="#4a2a24" />

        {/* ───── جسد الفارس السفلي: ذيل المعطف، الحزام، الفخذ ───── */}
        <path d="M 596 398 L 704 398 Q 748 420 756 470 L 752 500 L 664 494 Q 618 470 596 398 Z" fill="#2a2a2f" filter="url(#relM)" />
        <path d="M 660 410 Q 700 440 716 492" fill="none" stroke="#15151a" strokeWidth={2} opacity={0.7} />
        <path d="M 690 428 L 754 430 L 756 452 L 692 452 Z" fill="#1c1613" />
        <path d="M 690 430 L 754 432" stroke="#4a3a2e" strokeWidth={1.4} opacity={0.8} />
        <rect x={724} y={432} width={14} height={18} rx={3} fill="none" stroke="#b5aa90" strokeWidth={2.2} />
        <path d="M 664 482 Q 706 470 750 478 L 764 540 Q 758 566 752 576 L 680 576 Q 666 530 664 482 Z" fill="#b8b8be" filter="url(#relM)" />
        <path d="M 676 492 Q 700 486 722 490 L 716 576 L 690 576 Q 680 540 676 492 Z" fill="#d6d6da" opacity={0.65} />
        <path d="M 744 484 L 764 540 L 754 576" fill="none" stroke="#6a6a72" strokeWidth={3} opacity={0.7} />
        <path d="M 535 392 Q 552 380 566 394 L 563 420 Q 548 428 538 414 Z" fill="#dcaa82" stroke="#7a5238" strokeWidth={1.2} />

        {/* ───── عباءة الفارس: كتلة سوداء متطايرة ───── */}
        <path d="M 552 190 L 690 192 Q 750 215 808 267 Q 860 288 884 302 Q 932 330 987 407 Q 950 395 918 396 Q 895 396 884 402 Q 870 410 866 420 Q 850 446 837 459 Q 822 470 806 466 Q 790 456 785 440 Q 762 432 745 402 Q 736 384 733 372 L 600 380 L 540 340 Q 505 350 503 372 L 508 300 Q 520 240 552 190 Z" fill="url(#cloak)" filter="url(#relB)" />
        <path d="M 700 236 Q 790 262 880 318" fill="none" stroke="#3d3c3d" strokeWidth={4} opacity={0.6} strokeLinecap="round" />
        <path d="M 760 300 Q 850 340 940 380" fill="none" stroke="#2c2b2c" strokeWidth={3} opacity={0.55} strokeLinecap="round" />
        <path d="M 800 400 Q 840 425 860 415" fill="none" stroke="#2a2a2a" strokeWidth={3} opacity={0.5} strokeLinecap="round" />

        {/* ───── الكم الأيسر والذراع المنخفضة ───── */}
        <path d="M 552 205 Q 520 250 509 302 Q 500 350 506 410 L 520 440 L 580 440 L 592 414 Q 560 360 570 290 Z" fill="#17171a" />
        <path d="M 520 300 Q 512 350 520 400" fill="none" stroke="#4a4a50" strokeWidth={2} opacity={0.7} />

        {/* ───── الصدرية الرمادية بأزرارها ───── */}
        <path d="M 581 256 Q 620 250 660 264 Q 690 290 692 317 Q 690 350 676 372 L 652 407 L 616 403 Q 596 370 591 331 Q 576 290 581 256 Z" fill="url(#vest)" filter="url(#relM)" />
        <path d="M 596 262 Q 630 256 650 268 L 604 330 Z" fill="#7f8087" opacity={0.7} />
        <path d="M 604 276 L 618 400" stroke="#2a2b2f" strokeWidth={1.6} opacity={0.6} />
        <path d="M 592 300 Q 625 296 668 306" stroke="#2a2b2f" strokeWidth={1.4} opacity={0.5} fill="none" />
        <path d="M 595 345 Q 630 340 672 350" stroke="#2a2b2f" strokeWidth={1.4} opacity={0.5} fill="none" />
        {[286, 318, 350, 382].map((y, i) => <circle key={i} cx={606 + i} cy={y} r={3} fill="#9f9a80" stroke="#222" strokeWidth={1} />)}
        {/* الكم الأيمن نحو اللجام */}
        <path d="M 655 264 Q 700 280 716 300 Q 736 330 732 350 Q 722 392 692 420 L 652 434 L 628 396 Q 636 350 646 312 Z" filter="url(#relM)" fill="url(#sleeve)" stroke="#8a8a92" strokeWidth={1.4} />
        <path d="M 646 318 Q 690 312 722 346" fill="none" stroke="#707078" strokeWidth={1.6} opacity={0.7} />
        <path d="M 640 420 Q 680 424 730 412 L 744 432 Q 690 446 640 440 Z" fill="#2d211c" />
        {/* اليد واللجام */}
        <path d="M 578 424 Q 596 410 636 414 L 650 438 Q 622 460 588 452 Q 574 440 578 424 Z" fill="#e4b891" stroke="#8b6244" strokeWidth={1.4} />
        <path d="M 592 428 L 636 426 M 590 438 L 640 440" stroke="#8b6244" strokeWidth={1} />
        <path d="M 612 452 Q 560 490 520 548" stroke="#16100d" strokeWidth={3} fill="none" />
        <path d="M 644 450 Q 610 504 560 576" stroke="#16100d" strokeWidth={2.5} fill="none" />

        {/* ───── الوشاح الأسود حول الرقبة ───── */}
        <path d="M 548 218 Q 560 178 604 152 L 696 158 Q 738 188 754 230 Q 722 252 694 262 Q 640 282 600 270 Q 560 256 548 218 Z" fill="#0f0e0e" filter="url(#relM)" />
        <path d="M 556 214 Q 590 180 650 168 Q 710 166 746 214" fill="none" stroke="#3b3a39" strokeWidth={4} opacity={0.75} strokeLinecap="round" />
        <path d="M 560 238 Q 620 214 700 226 Q 738 236 752 244" fill="none" stroke="#2f2e2e" strokeWidth={3} opacity={0.75} strokeLinecap="round" />
        <path d="M 574 258 Q 640 246 716 262" fill="none" stroke="#262525" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
        <path d="M 590 190 Q 610 230 636 272" fill="none" stroke="#000" strokeWidth={4} opacity={0.5} />

        {/* ذيل العمامة المتطاير */}
        <path d="M 694 100 Q 735 122 792 126 Q 835 134 852 158 L 836 184 Q 800 152 770 144 Q 730 142 700 126 Z" fill="#0a0a0a" stroke="#242323" strokeWidth={1.5} />
        <path d="M 710 110 Q 770 122 830 148" fill="none" stroke="#3b3a3a" strokeWidth={2} opacity={0.6} />

        {/* ───── الرأس ───── */}
        <g>
          {/* الشعر على الصدغين */}
          <path d="M 574 90 Q 574 118 582 128 L 592 112 Z" fill="#0a0908" />
          <path d="M 668 96 Q 682 108 684 134 L 672 130 Z" fill="#0a0908" />
          {/* الوجه والجبهة */}
          <path d="M 583 82 Q 625 72 672 84 L 676 128 L 590 130 Z" fill="#dba67c" />
          <path d="M 583 82 Q 625 72 672 84 L 672 96 Q 625 88 583 100 Z" fill="#8a5a3e" opacity={0.65} />
          <ellipse cx={678} cy={122} rx={6} ry={11} fill="#d19a74" />
          {/* العينان: عربيتان داكنتان */}
          <path d="M 589 108 Q 601 99 613 107 Q 601 116 589 108 Z" fill="#f3eee4" />
          <path d="M 627 106 Q 640 97 652 105 Q 640 114 627 106 Z" fill="#f3eee4" />
          <ellipse cx={601} cy={107} rx={5.2} ry={5.6} fill="#2e2018" />
          <ellipse cx={640} cy={105} rx={5.2} ry={5.6} fill="#2e2018" />
          <circle cx={603} cy={105} r={1.4} fill="#fff" />
          <circle cx={642} cy={103} r={1.4} fill="#fff" />
          {/* الحاجبان الغليظان المقطّبان */}
          <path d="M 586 97 L 618 106 L 616 100 L 588 91 Z" fill="#0a0807" />
          <path d="M 660 94 L 626 104 L 628 98 L 658 89 Z" fill="#0a0807" />
          {/* اللثام */}
          <path d="M 580 122 Q 630 114 684 122 Q 692 160 668 192 L 648 208 Q 600 198 582 150 Z" fill="#0b0b0b" stroke="#252423" strokeWidth={2} />
          <path d="M 590 128 L 622 214 L 640 130 Z" fill="#1d1d1d" opacity={0.7} />
          <path d="M 602 150 Q 630 170 664 150" fill="none" stroke="#2c2b2b" strokeWidth={2} opacity={0.6} />
          {/* العمامة */}
          <path d="M 563 74 Q 568 40 606 31 Q 650 20 686 44 Q 712 74 698 104 Q 662 96 640 90 Q 600 82 583 94 Z" filter="url(#relM)" fill="#141414" stroke="#262524" strokeWidth={2} />
          <path d="M 575 62 Q 630 36 690 56" fill="none" stroke="#3a3a39" strokeWidth={3} opacity={0.7} />
          <path d="M 580 78 Q 640 50 696 84" fill="none" stroke="#050505" strokeWidth={4} opacity={0.8} />
          <path d="M 606 44 Q 650 38 680 56" fill="none" stroke="#2c2c2b" strokeWidth={2} opacity={0.6} />
        </g>

        {/* ───── الحصان (بلا عين): عنق ورأس وأذنان وعرف خصلات ───── */}
        <g>
          <path d="M 392 318 Q 470 296 536 330 Q 584 396 590 480 Q 574 530 556 576 L 330 576 Q 392 480 398 400 Z" fill="url(#horseNeck)" filter="url(#relB)" />
          <path d="M 470 360 Q 520 420 540 500" fill="none" stroke="#30282a" strokeWidth={5} opacity={0.6} />
          <path d="M 430 380 Q 470 440 480 520" fill="none" stroke="#241e1f" strokeWidth={4} opacity={0.7} />
          {/* الوجه */}
          <path d="M 246 360 Q 254 330 300 318 Q 350 312 394 326 Q 404 360 410 411 Q 404 460 386 501 Q 372 540 356 576 L 258 576 Q 246 530 252 486 Q 248 420 246 352 Z" fill="url(#horseFace)" filter="url(#relM)" />
          <path d="M 250 352 Q 256 330 270 320 Q 256 400 262 480 Q 258 530 266 576 L 256 576 Q 244 530 252 486 Q 250 420 250 352 Z" fill="#6b5545" opacity={0.65} />
          <path d="M 300 340 Q 330 380 336 440 Q 330 500 340 540" fill="none" stroke="#1b1514" strokeWidth={6} opacity={0.55} />
          <path d="M 352 338 Q 384 380 394 430 Q 380 480 366 540" fill="none" stroke="#1a1413" strokeWidth={5} opacity={0.55} />
          <path d="M 340 392 Q 372 400 388 430" fill="none" stroke="#120e0d" strokeWidth={7} opacity={0.5} />
          {/* الأذنان */}
          <path d="M 270 300 Q 268 272 286 254 Q 304 280 308 322 L 282 342 Z" fill="#17120f" stroke="#050404" strokeWidth={2} />
          <path d="M 276 296 Q 278 276 286 266 Q 294 288 296 316 Z" fill="#46362d" opacity={0.7} />
          <path d="M 362 300 Q 364 264 380 252 Q 398 272 397 296 L 378 342 Z" fill="#17120f" stroke="#050404" strokeWidth={2} />
          <path d="M 370 296 Q 372 272 380 262 Q 388 280 388 298 L 378 322 Z" fill="#4a3a31" opacity={0.7} />
          <path d="M 244 358 L 258 326 L 274 300 L 292 282 L 330 274 L 362 292 L 398 288 L 450 280 L 520 294 L 568 338 L 598 400 L 592 472 L 566 440 L 544 402 L 510 380 L 470 372 L 430 352 L 400 346 L 370 352 L 340 380 L 320 370 L 296 386 L 276 372 Z" fill="#0e0c0c" />
          <path d="M 300 296 Q 340 280 380 292" fill="none" stroke="#3b312c" strokeWidth={2} opacity={0.6} />
          {/* خصلات العرف: شفرات منحنية */}
          {Array.from({ length: 12 }, (_, i) => {
            const bx = 294 + i * 9, by = 296 + (i % 2) * 4, tx = 236 + i * 8 + (i % 3) * 6, ty = 340 + ((i * 17) % 40);
            return <path key={"f" + i} d={`M ${bx} ${by} Q ${bx - 30} ${by + 20} ${tx} ${ty} Q ${bx - 10} ${by + 30} ${bx + 10} ${by + 4} Z`} fill={i % 3 === 0 ? "#1b1615" : "#0d0b0b"} />;
          })}
          {Array.from({ length: 14 }, (_, i) => {
            const bx = 404 + i * 9, by = 296 + i * 2.2, tx = 520 + i * 5, ty = 340 + i * 11 + ((i * 13) % 22);
            return <path key={"n" + i} d={`M ${bx} ${by} Q ${bx + 40} ${by + 10} ${tx} ${ty} Q ${bx + 30} ${by + 40} ${bx + 4} ${by + 16} Z`} fill={i % 3 === 1 ? "#1d1817" : "#0c0a0a"} />;
          })}
          <path d="M 300 308 Q 345 298 395 312" fill="none" stroke="#120e0d" strokeWidth={9} />
          <path d="M 404 316 Q 470 304 540 340 L 560 380 Q 470 340 404 340 Z" fill="#0c0a0a" />
          {/* لجام الحصان */}
          <path d="M 392 322 Q 400 380 394 440 Q 380 500 352 548" fill="none" stroke="#17110f" strokeWidth={6.5} />
          <path d="M 394 330 Q 402 380 398 440" fill="none" stroke="#4b3a30" strokeWidth={1.4} opacity={0.8} />
          <path d="M 256 504 Q 304 520 352 548" fill="none" stroke="#17110f" strokeWidth={8} />
          <path d="M 258 502 Q 304 516 348 540" fill="none" stroke="#54443a" strokeWidth={1.6} opacity={0.85} />
          <circle cx={352} cy={553} r={10} fill="none" stroke="#c4bfae" strokeWidth={3.2} />
          <circle cx={397} cy={423} r={5} fill="#cdbd9c" stroke="#3b2f25" strokeWidth={1} />
          <path d="M 420 520 Q 520 520 640 500" fill="none" stroke="#120e0c" strokeWidth={2.5} opacity={0.8} />
        </g>

        <rect width={1024} height={576} filter="url(#grain)" opacity={0.35} style={{ mixBlendMode: "overlay" }} />
        <rect width={1024} height={576} fill="#000" opacity={0.06} />
      </svg>
    </AbsoluteFill>
  );
};
