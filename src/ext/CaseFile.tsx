import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { mulberry32 } from "./rand";
import { back, CrumplePaper, FONT, poly, settle, tornLine, useAlmarai } from "./PaperSteps";

/**
 * تمرين على مرجع «ملف القضية» (إعلان طولي 112ث على بنترست، 2026-11-19، محفوظ في معرض المراجع):
 * لوحة تحقيق من ورق قديم: صور وقصاصات تطير وتستقر، مذكرة تهبط بظل كبير ثم يثبّتها دبوس، خيوط حمراء تُرسم بين الدبابيس،
 * سلسلة تُبنى حلقةً حلقة ثم تتشقق وتنكسر بوميض، مطر قصاصات يتكوّم ثم بطاقة عنوان تقفز، علامات صح وختم يضغط ويترك حبراً،
 * وظل «المتهم» بعلامة استفهام تتصل به الخيوط. الانتقال بين المشاهد بلفافة ورق تمر أفقياً. كل الرسوم من الكود؛ النص مثال.
 */
export const CASE_FILE_FRAMES = 720;
const W = 1080, H = 1920;
const C = { board: "#e8dcc4", note: "#efe1c2", kraft: "#c9a874", ink: "#3a2a1c", red: "#b8322a", photo: "#8d877c", photoD: "#4d4a44", glow: "#7fd6e6", tape: "rgba(231,206,140,.85)" };

/* ---------- أدوات ---------- */
/** يطير من خارج الإطار بدوران وضبابية ثم يستقر (صور اللوحة). */
const FlyIn: React.FC<{ at: number; x: number; y: number; w: number; h: number; rot: number; fromX: number; fromY: number; children: React.ReactNode; dur?: number }> = ({ at, x, y, w, h, rot, fromX, fromY, children, dur = 10 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = easeOut(f / dur), sp = 1 - clamp01(f / dur);
  return (
    <div style={{ position: "absolute", left: lerp(fromX, x, k) - w / 2, top: lerp(fromY, y, k) - h / 2, width: w, height: h, transform: `rotate(${rot + sp * 120 + settle(f - dur) * 2}deg)`, filter: `blur(${(sp * 8).toFixed(1)}px) drop-shadow(0 6px 8px rgba(0,0,0,.3))` }}>{children}</div>
  );
};
/** صورة قديمة بالأبيض والأسود: نقش نقطي وإطار أبيض. */
const OldPhoto: React.FC<{ w: number; h: number; seed: number }> = ({ w, h, seed }) => {
  const r = mulberry32(seed);
  return (
    <svg width={w} height={h}>
      <rect width={w} height={h} fill="#f4f0e6" />
      <rect x={8} y={8} width={w - 16} height={h - 30} fill={C.photo} />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={8 + r() * (w - 60)} y={8 + (h - 30) * (0.3 + r() * 0.5)} width={20 + r() * 50} height={(h - 30) * (0.2 + r() * 0.5)} fill={C.photoD} />)}
      <rect x={8} y={8 + (h - 30) * 0.7} width={w - 16} height={(h - 30) * 0.3} fill="#6e695f" />
      <rect x={14} y={h - 18} width={w * 0.5} height={6} fill="#9c958a" />
    </svg>
  );
};
/** دبوس يسقط من أعلى ويغرس. */
const Pin: React.FC<{ at: number; x: number; y: number; c?: string }> = ({ at, x, y, c = "#3b2a22" }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = easeOut(f / 7);
  return <div style={{ position: "absolute", left: x - 16, top: y - 16 - (1 - k) * 260, width: 32, height: 32, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #8a6a58, ${c})`, boxShadow: `${(1 - k) * 30 + 3}px ${(1 - k) * 40 + 4}px ${(1 - k) * 14 + 3}px rgba(0,0,0,.35)`, transform: `scale(${1 + (1 - k) * 0.6})` }} />;
};
/** خيط أحمر يُرسم بين نقطتين. */
const Str: React.FC<{ at: number; a: [number, number]; b: [number, number]; dur?: number }> = ({ at, a, b, dur = 12 }) => {
  const k = easeInOut((useCurrentFrame() - at) / dur);
  if (k <= 0) return null;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 30;
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`} stroke={C.red} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={`${k} 1`} /></svg>;
};
/** شريط ورقي ممزق عليه تسمية (خط آلة كاتبة غير متاح: العريض). */
const Label: React.FC<{ at: number; x: number; y: number; text: string; rot?: number; size?: number }> = ({ at, x, y, text, rot = -3, size = 54 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const k = back(f / 10, 1.8), w = text.length * size * 0.62 + 80;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, height: size * 1.7, transform: `rotate(${rot}deg) scale(${Math.max(0, k)})`, filter: "drop-shadow(0 6px 6px rgba(0,0,0,.3))" }}>
      <div style={{ position: "absolute", inset: 0, background: "#f5efe2", clipPath: `polygon(${poly(tornLine(0, 4, w, 0, 41, 16, 6))},${poly(tornLine(w, size * 1.7, 0, size * 1.7 - 4, 42, 16, 6))})` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, color: C.ink, direction: "rtl" }}>{text}</div>
    </div>
  );
};
/** لفافة ورق تمر أفقياً فتمسح المشهد وتترك ورقاً فارغاً، ثم يُبنى المشهد التالي من الفراغ (انتقال المرجع). */
const Roll: React.FC<{ at: number }> = ({ at }) => {
  const k = easeInOut((useCurrentFrame() - at) / 12);
  if (k <= 0 || k >= 1) return null;
  const x = lerp(-260, W + 60, k);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: x, height: H, background: C.board }}><CrumplePaper color={C.board} id={`roll${at}`} seed={at} /></div>
      <div style={{ position: "absolute", left: x - 10, top: 0, width: 200, height: H, background: "linear-gradient(90deg,#5d4c38,#f1e7d1 30%,#fff8e8 45%,#c9b58f 70%,#3c2f22)", boxShadow: "20px 0 40px rgba(0,0,0,.4)" }} />
    </>
  );
};

/* ---------- المشاهد ---------- */
const BoardScene: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame() - t0;
  const PH: [number, number, number, number, number][] = [[150, 230, -10, -400, -200], [930, 210, 8, 1500, -300], [140, 1700, 6, -400, 2200], [940, 1690, -7, 1500, 2300], [880, 980, 12, 1600, 900], [180, 1150, -9, -500, 1100]];
  return (
    <>
      {PH.map(([x, y, rot, fx, fy], i) => <FlyIn key={i} at={t0 + 4 + i * 4} x={x} y={y} w={260} h={220} rot={rot} fromX={fx} fromY={fy}><OldPhoto w={260} h={220} seed={i + 1} /></FlyIn>)}
      <Str at={t0 + 34} a={[180, 1150]} b={[880, 980]} dur={16} />
      <Str at={t0 + 40} a={[150, 230]} b={[940, 1690]} dur={18} />
      {/* المذكرة تهبط من الكاميرا: ظل كبير يصغر حتى تلامس اللوحة */}
      {f >= 30 && (() => { const k = easeOut((f - 30) / 16); return (
        <div style={{ position: "absolute", left: W / 2 - 280, top: 620, width: 560, height: 680, transform: `scale(${lerp(1.7, 1, k)}) rotate(${lerp(-8, -2, k)}deg)`, filter: `drop-shadow(${lerp(50, 6, k)}px ${lerp(80, 10, k)}px ${lerp(40, 8, k)}px rgba(0,0,0,${lerp(0.25, 0.4, k)}))` }}>
          <div style={{ position: "absolute", inset: 0, background: C.note, clipPath: `polygon(${poly(tornLine(0, 0, 560, 6, 51, 24, 10))},${poly(tornLine(560, 680, 0, 676, 52, 24, 12))})` }}><CrumplePaper color={C.note} id="cf-note" seed={5} /></div>
          <div style={{ position: "absolute", left: 60, top: 190, width: 440, height: 300, border: `6px solid ${C.red}`, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, color: C.ink, direction: "rtl" }}>
            <div style={{ fontSize: 74, lineHeight: 1.2, whiteSpace: "nowrap" }}>ملف القضية</div>
            <div style={{ fontSize: 96, lineHeight: 1.2, whiteSpace: "nowrap" }}>رقم ١</div>
          </div>
        </div>); })()}
      <Pin at={t0 + 54} x={W / 2} y={650} />
      <Pin at={t0 + 38} x={180} y={1150} c={C.red} /><Pin at={t0 + 38} x={880} y={980} c={C.red} />
      <Pin at={t0 + 44} x={150} y={230} c={C.red} /><Pin at={t0 + 44} x={940} y={1690} c={C.red} />
    </>
  );
};

const ChainScene: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame() - t0;
  const BREAK = 70, cy = 900;
  const flash = clamp01(1 - Math.abs(f - BREAK) / 6);
  const split = easeOut((f - BREAK) / 18);
  const glow = clamp01((f - 40) / 20);
  const link = (i: number) => {
    const at = i * 5, k = easeOut((f - at) / 10);
    if (f < at) return null;
    const baseX = 40 + i * 170, side = baseX + 85 < W / 2 ? -1 : 1;
    const x = lerp(W + 200, baseX, k) + side * split * 110;
    const crack = i === 2 || i === 3 ? clamp01((f - 50) / 18) : 0;
    return (
      <svg key={i} width={230} height={150} style={{ position: "absolute", left: x, top: cy - 75 + (i % 2 ? 0 : 0), overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${8 + glow * 14}px ${C.glow})` : undefined }}>
        <rect x={10} y={i % 2 ? 50 : 25} width={210} height={i % 2 ? 50 : 100} rx={i % 2 ? 25 : 50} fill="none" stroke="#2e3a3e" strokeWidth={30} />
        <rect x={10} y={i % 2 ? 50 : 25} width={210} height={i % 2 ? 50 : 100} rx={i % 2 ? 25 : 50} fill="none" stroke={C.glow} strokeWidth={4} opacity={glow * 0.9} />
        {crack > 0 && f < BREAK && <polyline points={`${i === 2 ? 205 : 15},40 ${i === 2 ? 185 : 35},70 ${i === 2 ? 210 : 10},95`} stroke="#fff" strokeWidth={4} fill="none" opacity={crack} />}
      </svg>
    );
  };
  const r = mulberry32(77);
  const shards = Array.from({ length: 26 }, () => ({ a: r() * Math.PI * 2, v: 8 + r() * 18, s: 6 + r() * 16, rot: r() * 360 }));
  const tt = f - BREAK;
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map(link)}
      {f > 50 && f < BREAK && Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + f * 0.4; return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(a) * (10 + (f - 50) * 2), top: cy + Math.sin(a) * (10 + (f - 50) * 2), width: 6, height: 6, background: "#2a2a2a", transform: `rotate(${a}rad)` }} />; })}
      {tt >= 0 && shards.map((s, i) => <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(s.a) * s.v * tt, top: cy + Math.sin(s.a) * s.v * tt + 0.6 * tt * tt, width: s.s, height: s.s * 0.6, background: "#262626", transform: `rotate(${s.rot + tt * 12}deg)`, opacity: clamp01(1.4 - tt / 40) }} />)}
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% ${(cy / H) * 100}%, rgba(255,255,255,${flash}), rgba(127,214,230,${flash * 0.6}) 30%, transparent 65%)` }} />}
      {flash > 0.2 && <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => <polyline key={i} points={`${W / 2},${cy} ${W / 2 + sx * 120},${cy + sy * 200} ${W / 2 + sx * 90},${cy + sy * 320} ${W / 2 + sx * 260},${cy + sy * 520}`} stroke="#eaffff" strokeWidth={6} fill="none" opacity={flash} />)}</svg>}
      <Label at={t0 + BREAK + 16} x={W / 2} y={1180} text="روابط مقطوعة" />
    </>
  );
};

const ScrapsScene: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame() - t0;
  const r = mulberry32(19);
  const pieces = Array.from({ length: 56 }, (_, i) => ({ x: 60 + r() * (W - 120), y: 240 + r() * 1440, rot: (r() - 0.5) * 70, at: Math.floor(i * 1.0 + r() * 4), w: 210 + r() * 120, seed: 100 + i, tone: r() }));
  return (
    <>
      {pieces.map((p, i) => { const g = f - p.at; if (g < 0) return null; const k = easeOut(g / 9); const h = p.w * 0.62;
        return <div key={i} style={{ position: "absolute", left: p.x - p.w / 2, top: lerp(-300, p.y, k) - h / 2, width: p.w, height: h, transform: `rotate(${p.rot + (1 - k) * 90}deg)`, filter: `blur(${((1 - k) * 5).toFixed(1)}px) drop-shadow(0 5px 5px rgba(0,0,0,.28))` }}>
          <div style={{ position: "absolute", inset: 0, background: p.tone > 0.5 ? "#d9c7a6" : "#e7dcc8", clipPath: `polygon(${poly(tornLine(0, 3, p.w, 0, p.seed, 12, 9))},${poly(tornLine(p.w, h, 0, h - 3, p.seed + 1, 12, 9))})` }} />
        </div>; })}
      {f >= 64 && (() => { const k = back((f - 64) / 12, 2.4); return (
        <div style={{ position: "absolute", left: W / 2 - 300, top: 820, width: 600, height: 280, transform: `rotate(-5deg) scale(${Math.max(0, k)})`, background: "#f6efe0", border: `10px solid ${C.glow}`, boxShadow: "0 16px 30px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 100, lineHeight: 1.05, color: C.red, direction: "rtl" }}>أدلّة<br />متناثرة</div>); })()}
    </>
  );
};

const StampScene: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame() - t0;
  const cards = [0, 1, 2];
  const SL = 78; /* لحظة الضغط */
  const sy = f < SL ? lerp(-500, 0, easeInOut((f - SL + 10) / 10)) : f < SL + 4 ? 0 : -easeOut((f - SL - 4) / 10) * 700;
  const shake = f >= SL && f < SL + 8 ? Math.sin(f * 3) * (SL + 8 - f) * 1.6 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <div style={{ position: "absolute", left: 150, top: 380, width: 780, height: 1000, background: C.kraft, transform: "rotate(-2deg)", boxShadow: "0 14px 30px rgba(0,0,0,.3)" }} />
      <div style={{ position: "absolute", left: 200, top: 430, width: 680, height: 560, background: "#f7f4ec", boxShadow: "0 8px 16px rgba(0,0,0,.2)" }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 40, top: 60 + i * 90, width: 600 - (i % 3) * 90, height: 22, background: i === 0 ? "#2e7da6" : "#cfc9bd" }} />)}
      </div>
      {cards.map((i) => { const at = 6 + i * 6, k = easeOut((f - at) / 10); if (f < at) return null; const x = 210 + i * 230, y = 1080;
        const ck = clamp01((f - 34 - i * 8) / 8);
        return <div key={i} style={{ position: "absolute", left: lerp(W + 100, x, k), top: y, width: 200, height: 250, background: "#fbf8f1", transform: `rotate(${(1 - k) * 40 + (i - 1) * 3}deg)`, boxShadow: "0 8px 14px rgba(0,0,0,.28)" }}>
          <svg width={200} height={250}><polyline points="50,130 88,170 156,92" fill="none" stroke="#222" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${ck} 1`} /></svg>
        </div>; })}
      {/* أثر الحبر بعد الضغط */}
      {f >= SL && <div style={{ position: "absolute", left: W / 2 - 230, top: 760, width: 460, height: 150, border: `10px solid ${C.red}`, borderRadius: 16, transform: "rotate(-8deg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 84, color: C.red, opacity: 0.9, mixBlendMode: "multiply", direction: "rtl" }}>تمّ التحقق</div>}
      {/* الختم نفسه */}
      {f > SL - 12 && f < SL + 16 && <div style={{ position: "absolute", left: W / 2 - 250, top: 640 + sy, width: 500, height: 280, transform: "rotate(-8deg)", filter: f < SL ? "blur(3px)" : undefined }}>
        <div style={{ position: "absolute", left: 210, top: 0, width: 80, height: 120, borderRadius: "40px 40px 10px 10px", background: "#2a2320" }} />
        <div style={{ position: "absolute", left: 20, top: 110, width: 460, height: 150, borderRadius: 14, background: "linear-gradient(#a8573c,#7a3424)", boxShadow: "0 20px 30px rgba(0,0,0,.4)" }} />
      </div>}
    </div>
  );
};

const SuspectScene: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame() - t0;
  const k = back(f / 12, 1.4);
  const PH: [number, number][] = [[160, 300], [920, 320], [120, 1500], [950, 1520], [140, 900], [960, 920]];
  return (
    <>
      {PH.map(([x, y], i) => <FlyIn key={i} at={t0 + 4 + i * 3} x={x} y={y} w={220} h={190} rot={(i % 2 ? 1 : -1) * 8} fromX={x < W / 2 ? -300 : W + 300} fromY={y}><OldPhoto w={220} h={190} seed={20 + i} /></FlyIn>)}
      {PH.map(([x, y], i) => <Str key={i} at={t0 + 26 + i * 3} a={[W / 2, 960]} b={[x, y]} dur={12} />)}
      <div style={{ position: "absolute", left: W / 2 - 260, top: 620, width: 520, height: 700, transform: `scale(${Math.max(0, k)})`, filter: "drop-shadow(0 0 0 #fff) drop-shadow(6px 10px 0 rgba(0,0,0,.18))" }}>
        <svg width={520} height={700}>
          <ellipse cx={260} cy={150} rx={170} ry={34} fill="#141414" />
          <path d="M150 150 Q150 40 260 40 Q370 40 370 150 Z" fill="#141414" />
          <ellipse cx={260} cy={220} rx={95} ry={110} fill="#141414" />
          <path d="M40 700 Q60 380 260 350 Q460 380 480 700 Z" fill="#141414" />
          <text x={260} y={560} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={230} fill="#fff">؟</text>
        </svg>
      </div>
      <Pin at={t0 + 20} x={W / 2} y={960} c={C.red} />
      <Label at={t0 + 36} x={W / 2} y={1360} text="المتّهم" size={64} />
    </>
  );
};

/* ---------- الجدول ---------- */
const T = { board: 0, chain: 150, scraps: 300, stamp: 430, suspect: 580 };

export const CaseFile: React.FC = () => {
  useAlmarai();
  const f = useCurrentFrame();
  const scene = f < T.chain + 12 ? 0 : f < T.scraps + 12 ? 1 : f < T.stamp + 12 ? 2 : f < T.suspect + 12 ? 3 : 4;
  return (
    <AbsoluteFill style={{ background: C.board, overflow: "hidden" }}>
      <CrumplePaper color={C.board} id="cf-bg" seed={12} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(90,60,30,.35)" }} />
      {scene === 0 && <BoardScene t0={T.board} />}
      {scene === 1 && <ChainScene t0={T.chain + 12} />}
      {scene === 2 && <ScrapsScene t0={T.scraps + 12} />}
      {scene === 3 && <StampScene t0={T.stamp + 12} />}
      {scene === 4 && <SuspectScene t0={T.suspect + 12} />}
      {[T.chain, T.scraps, T.stamp, T.suspect].map((a) => <Roll key={a} at={a} />)}
    </AbsoluteFill>
  );
};
