import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, applyBrand } from "./brand";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";
import { H, SC, SH, SW, Scene, W } from "./DubKmr";
import { CrumplePaper, poly, tornLine } from "./ext/PaperSteps";
import { ff, useFonts } from "./ext/fonts";
import { SfxTrack } from "./ext/sfx";
import { mulberry32 } from "./ext/rand";

/**
 * دبلجة «دفع الحسد وتسريع الزواج» بنموذجَي موشن مختلفين يجمعان المراجع الأربعة (أمر المستخدم 2026-11-19، ثم: «لا أرى اختلافاً عما عملته قبل التدريب»).
 * الفرق عن النسخة الأولى: لا تخطيط ثابت. «مخرج لقطات» يعطي كل جملة لقطة وانتقالاً:
 *  - الكرمنجية «لوحة التحقيق»: لقطة اللوحة (الشيخ صورة مثبتة أعلى اليسار وبطاقة الرسم أسفلها)، لقطة قريبة (البطاقة تملأ الشاشة والشيخ غائب)،
 *    لقطة معكوسة (الشيخ أسفل اليمين)؛ الانتقال: هبوط من الكاميرا، لفافة ورق تمسح الشاشة، سحب ضبابي؛ ختم يهزّ اللوحة، وميض وشظايا عند القطع.
 *  - السورانية «الألواح»: لقطة البطل (الشيخ كبير ولوح صغير تحته بسلك)، لوح بملء الشاشة فيه نافذة صغيرة للشيخ، لقطة مقسومة (الشيخ عمود والرسم عمود)؛
 *    الانتقال: ألواح تنزلق بميل وتطير الكاميرا؛ شبكة تصغير تكشف المشاهد السابقة، ومقابض تحديد، وضوء ذهبي يتنفّس.
 * الفيديو دائماً تحت الرسوم (المحرك)، فاللوح بملء الشاشة فيه ثقب بمكان الشيخ. لا كتابة كلام ولا فاصل؛ الصوت دبلجة بلا مؤثرات قديمة + ثمانية مؤثرات هادئة.
 */
type R = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpR = (a: R, b: R, k: number): R => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const backOut = (x: number, s = 1.5) => { const t = clamp(x) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };
const FULL: R = { x: 0, y: 0, w: W, h: H };
const ST = (x: number, y: number, w: number): R => ({ x, y, w, h: (w * SH) / SW });
const TR = 0.4; /* مدة الانتقال بالثواني */

type Shot = { vid: R | null; stage: R; rot: number; vrot?: number; kind: string };
/** مكان الفيديو في كل لحظة: كامل في المقدمة والمشهد المحروق، وإلا مكان لقطة الجملة (ويخرج يساراً إن غاب) */
const offLeft = (r: R): R => ({ ...r, x: -r.w - 120 });
const videoAt = (t: number, shots: Shot[]): { r: R; rot: number } => {
  const idx = SC.findIndex((s) => t >= s.a && t < s.b);
  const sv = (i: number) => shots[i].vid;
  const lastVid = (i: number) => { for (let j = i; j >= 0; j--) if (sv(j)) return sv(j)!; return FULL; };
  if (t < 4.45) return { r: FULL, rot: 0 };
  if (t < 4.95) return { r: lerpR(FULL, sv(0) ?? offLeft(FULL), smooth((t - 4.45) / 0.5)), rot: lerp(0, shots[0].vrot ?? 0, smooth((t - 4.45) / 0.5)) };
  if (t >= 49.95 && t < 54.3) {
    if (t < 50.3) return { r: lerpR(sv(14) ?? offLeft(lastVid(14)), FULL, smooth((t - 49.95) / 0.35)), rot: 0 };
    if (t < 53.85) return { r: FULL, rot: 0 };
    return { r: lerpR(FULL, sv(15) ?? offLeft(FULL), smooth((t - 53.85) / 0.45)), rot: lerp(0, shots[15].vrot ?? 0, smooth((t - 53.85) / 0.45)) };
  }
  if (idx < 0) return { r: FULL, rot: 0 };
  const u = t - SC[idx].a, k = smooth(u / TR);
  const cur = sv(idx), prevI = idx === 15 ? -1 : idx - 1, prev = prevI >= 0 ? sv(prevI) : cur;
  const from = prev ?? offLeft(cur ?? lastVid(idx)), to = cur ?? offLeft(prev ?? lastVid(idx));
  return { r: lerpR(from, to, prevI < 0 ? 1 : k), rot: lerp(prevI >= 0 ? shots[prevI].vrot ?? 0 : 0, shots[idx].vrot ?? 0, prevI < 0 ? 1 : k) };
};
/** إطار الفيديو: يملأ المستطيل ويُبقي الوجه في ثلثه الأعلى */
const vCrop = (r: R) => { const vw = Math.max(r.w, r.h * 0.94), vh = (vw * 16) / 9; return { vw, vh, vx: -(vw - r.w) / 2, vy: clamp(r.h * 0.4 - vh * 0.27, r.h - vh, 0) }; };

const StageArt: React.FC<{ id: string; u: number; r: R }> = ({ id, u, r }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transform: `scale(${r.w / SW})`, transformOrigin: "0 0" }}><Scene id={id} u={u} /></div>
);
const PinDot: React.FC<{ x: number; y: number; drop?: number }> = ({ x, y, drop = 1 }) => (
  <div style={{ position: "absolute", left: x - 17, top: y - 17 - (1 - drop) * 220, width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #d0806a, #7a2a22)", boxShadow: `${(1 - drop) * 24 + 3}px ${(1 - drop) * 34 + 5}px ${(1 - drop) * 12 + 4}px rgba(0,0,0,.35)`, transform: `scale(${1 + (1 - drop) * 0.5})` }} />
);
const Tape: React.FC<{ x: number; y: number; rot: number; w?: number }> = ({ x, y, rot, w = 160 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 22, width: w, height: 44, background: "rgba(232,214,160,.8)", transform: `rotate(${rot}deg)`, clipPath: `polygon(${poly(tornLine(0, 0, 0, 44, 61, 6, 8))},${poly(tornLine(w, 44, w, 0, 62, 6, 8))})` }} />
);

/* ═══════════ الكرمنجية: لوحة التحقيق ═══════════ */
const K_BOARD: Shot = { kind: "board", vid: { x: 60, y: 140, w: 600, h: 700 }, vrot: -1.5, stage: ST(300, 900, 740), rot: 2.5 };
const K_CLOSE: Shot = { kind: "close", vid: null, stage: ST(40, 520, 1000), rot: -1.2 };
const K_PINR: Shot = { kind: "pinR", vid: { x: 440, y: 1000, w: 580, h: 680 }, vrot: 1.8, stage: ST(50, 220, 720), rot: -2.5 };
const K_CYCLE = [K_BOARD, K_CLOSE, K_PINR, K_CLOSE];
const K_SHOTS: Shot[] = SC.map((s, i) => (i === 0 || i === 15 || i === 21 ? K_BOARD : s.id === "ban" || s.id === "cut" ? K_CLOSE : K_CYCLE[i % 4]));
const K_TRANS = ["drop", "roll", "whip"] as const;
const KMR_SFX: [number, string][] = [[133, "tap"], [149, "hit"], [605, "swipe"], [1238, "blast"], [1498, "tear"], [1629, "swipe"], [1901, "thud"], [2152, "sting"]];

const Note: React.FC<{ r: R; rot: number; seed: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ r, rot, seed, children, style }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, transform: `rotate(${rot}deg)`, ...style }}>
    <div style={{ position: "absolute", inset: 0, background: BRAND.navy, clipPath: `polygon(${poly(tornLine(0, 0, r.w, 8, 90 + seed, 30, 12))},${poly(tornLine(r.w, r.h, 0, r.h - 6, 120 + seed, 30, 14))})` }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,240,210,.12), transparent 70%)" }} />
      {children}
    </div>
  </div>
);

export const DubKmrBoard: React.FC = () => {
  applyBrand("kraft"); useFonts(["ruqaa"]);
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const idx = SC.findIndex((s) => t >= s.a && t < s.b), sc = idx >= 0 ? SC[idx] : undefined, u = sc ? t - sc.a : 0;
  const full = t < 4.45 || (t >= 49.95 && t < 54.3);
  const shot = idx >= 0 ? K_SHOTS[idx] : K_BOARD, tr = K_TRANS[Math.max(0, idx) % 3];
  /* هزّة الختم في مشهد المنع */
  const shake = sc?.id === "ban" && u > 0.5 && u < 0.85 ? Math.sin(u * 95) * (0.85 - u) * 34 : 0;
  const v = videoAt(t, K_SHOTS), vc = vCrop(v.r);
  const prevI = idx > 0 && idx !== 15 ? idx - 1 : -1, prevSc = prevI >= 0 ? SC[prevI] : undefined, prevShot = prevI >= 0 ? K_SHOTS[prevI] : undefined;
  /* دخول البطاقة بحسب نوع الانتقال */
  let enter: React.CSSProperties = {}, rollX = -1;
  if (tr === "drop") { const q = easeOut(u / 0.35); enter = { transform: `rotate(${shot.rot}deg) scale(${lerp(1.3, 1, q)})`, filter: `drop-shadow(${lerp(46, 6, q)}px ${lerp(70, 12, q)}px ${lerp(34, 8, q)}px rgba(0,0,0,.42))` }; }
  else if (tr === "whip") { const q = easeOut(u / 0.3); enter = { transform: `translateY(${(1 - q) * 1400}px) rotate(${shot.rot}deg)`, filter: `blur(${(1 - q) * 14}px) drop-shadow(6px 12px 8px rgba(0,0,0,.4))` }; }
  else { rollX = lerp(-240, W + 60, smooth(u / 0.45)); enter = { filter: "drop-shadow(6px 12px 8px rgba(0,0,0,.4))", clipPath: u < 0.45 ? `inset(-200px ${W - rollX}px -200px -200px)` : undefined }; }
  const nr = shot.stage;
  const rnd = mulberry32(idx + 7);
  return (
    <HybridHost>
      <HybridBg>
        <CrumplePaper color={BRAND.paper} id="kb-bg" seed={3} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 260px rgba(70,45,20,.45)" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_kmr.wav")} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
        <VSlot src="dubkmr/src.mp4" w={v.r.w} h={v.r.h} radius={full ? 0 : 4} vx={vc.vx} vy={vc.vy} vw={vc.vw} vh={vc.vh} style={{ left: v.r.x, top: v.r.y, transform: `rotate(${v.rot}deg)` }} grow={0} />
        {/* إطار الصورة الأبيض وشريطان ودبوس يتبع الفيديو */}
        {!full && v.r.x > -v.r.w && (
          <div style={{ position: "absolute", left: v.r.x, top: v.r.y, width: v.r.w, height: v.r.h, transform: `rotate(${v.rot}deg)` }}>
            <div style={{ position: "absolute", left: -16, top: -16, right: -16, bottom: -16, border: "16px solid #f6efe0", borderRadius: 6, boxShadow: "0 20px 36px rgba(0,0,0,.35)" }} />
            <Tape x={20} y={-8} rot={-36} /><Tape x={v.r.w - 20} y={-8} rot={36} />
            <PinDot x={v.r.w / 2} y={-2} />
          </div>
        )}
        {/* البطاقة السابقة تبقى تحت الداخلة أثناء الانتقال، وفي السحب الضبابي تطير إلى أعلى */}
        {!full && prevSc && prevShot && u < 0.45 && (
          <Note r={prevShot.stage} rot={prevShot.rot} seed={prevI} style={tr === "whip" ? { transform: `translateY(${-easeOut(u / 0.3) * 1500}px) rotate(${prevShot.rot}deg)`, filter: `blur(${easeOut(u / 0.3) * 14}px)` } : tr === "roll" ? { clipPath: `inset(-200px -200px -200px ${rollX}px)` } : {}}>
            <StageArt id={prevSc.id} u={t - prevSc.a} r={prevShot.stage} />
          </Note>
        )}
        {!full && sc && (
          <Note key={sc.id + sc.a} r={nr} rot={shot.rot} seed={idx} style={enter}>
            <StageArt id={sc.id} u={u} r={nr} />
            {/* ختم المنع: حبر أحمر يبقى بعد الضغط */}
            {sc.id === "ban" && u > 0.5 && <div style={{ position: "absolute", left: nr.w * 0.18, top: nr.h * 0.62, width: nr.w * 0.64, height: nr.h * 0.24, border: "12px solid #c4342a", borderRadius: 18, transform: "rotate(-8deg)", opacity: 0.85, background: "repeating-linear-gradient(45deg, rgba(196,52,42,.18) 0 10px, transparent 10px 22px)" }} />}
          </Note>
        )}
        {/* لفافة الورق نفسها */}
        {!full && rollX > -240 && u < 0.45 && <div style={{ position: "absolute", left: rollX - 10, top: 0, width: 190, height: H, background: "linear-gradient(90deg,#5d4c38,#f1e7d1 30%,#fff8e8 45%,#c9b58f 70%,#3c2f22)", boxShadow: "20px 0 40px rgba(0,0,0,.4)" }} />}
        {/* الخيط الأحمر من دبوس الصورة إلى دبوس البطاقة */}
        {!full && sc && shot.vid && (() => { const a = { x: shot.vid.x + shot.vid.w / 2, y: shot.vid.y - 2 }, b = { x: nr.x + nr.w / 2, y: nr.y + 16 }, d = smooth((u - 0.35) / 0.5);
          return d > 0 ? <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M ${a.x} ${a.y} Q ${a.x < b.x ? W - 40 : 40} ${(a.y + b.y) / 2} ${b.x} ${b.y}`} stroke="#a8322a" strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${d} 1`} /></svg> : null; })()}
        {!full && sc && <PinDot x={nr.x + nr.w / 2} y={nr.y + 16} drop={easeOut((u - 0.32) / 0.2)} />}
        {/* وميض وشظايا لحظة قطع الحلقة */}
        {sc?.id === "cut" && u > 1.25 && u < 2.2 && (() => { const g = u - 1.25, fl = clamp(1 - g / 0.25); return <>
          {fl > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(255,250,235,${fl}), rgba(255,220,150,${fl * 0.5}) 30%, transparent 65%)` }} />}
          {Array.from({ length: 22 }, (_, i) => { const a = rnd() * Math.PI * 2, sp = 300 + rnd() * 700, s = 8 + rnd() * 16; return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(a) * sp * g, top: 880 + Math.sin(a) * sp * g + 900 * g * g, width: s, height: s * 0.6, background: "#2c2418", transform: `rotate(${i * 40 + g * 600}deg)`, opacity: clamp(1.3 - g) }} />; })}
        </>; })()}
        {/* قصاصات الأطراف (تطير لحظة أول تصغير وتبقى) */}
        {t > 4.45 && !full && [[-40, 1700, 8, -600, 2300], [900, 1780, -10, 1600, 2300], [960, -10, 12, 1600, -400], [-50, 880, -6, -600, 880]].map(([x, y, r, fx, fy], i) => { const q = easeOut((t - 4.45 - i * 0.08) / 0.35); return <div key={i} style={{ position: "absolute", left: lerp(fx, x, q), top: lerp(fy, y, q), width: 190, height: 120, background: i % 2 ? "#e9dcc0" : "#d9c39c", transform: `rotate(${r + (1 - q) * 90}deg)`, filter: `blur(${(1 - q) * 6}px) drop-shadow(0 6px 6px rgba(0,0,0,.25))`, clipPath: `polygon(${poly(tornLine(0, 2, 190, 0, 70 + i, 12, 9))},${poly(tornLine(190, 120, 0, 118, 80 + i, 12, 9))})` }} />; })}
        {/* اسم القناة على شريط ورقي */}
        {!full && <div style={{ position: "absolute", left: W / 2 - 250, top: 1840, width: 500, height: 66, transform: "rotate(-1.5deg)", filter: "drop-shadow(0 4px 5px rgba(0,0,0,.25))" }}>
          <div style={{ position: "absolute", inset: 0, background: "#f4ecdb", clipPath: `polygon(${poly(tornLine(0, 3, 500, 0, 141, 16, 6))},${poly(tornLine(500, 66, 0, 63, 142, 16, 6))})` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 46, color: BRAND.ink, direction: "rtl" }}>محمد بن شمس الدين</div>
        </div>}
      </AbsoluteFill>
      <SfxTrack cues={KMR_SFX} />
    </HybridHost>
  );
};

/* ═══════════ السورانية: الألواح ═══════════ */
const MAROON = "#6e2c2e", GREEN = "#5c7656", GOLD = "#c9a25a", CREAM = "#f5efe6";
const C_HERO: Shot = { kind: "hero", vid: { x: 90, y: 150, w: 900, h: 1000 }, stage: ST(190, 1250, 700), rot: 0 };
const C_PANEL: Shot = { kind: "panel", vid: { x: 690, y: 110, w: 330, h: 390 }, stage: ST(60, 640, 960), rot: 0 };
const C_SPLIT: Shot = { kind: "split", vid: { x: 50, y: 330, w: 470, h: 880 }, stage: ST(560, 620, 480), rot: 0 };
const C_MOSAIC: Shot = { kind: "mosaic", vid: null, stage: ST(60, 600, 960), rot: 0 };
const C_CYCLE = [C_HERO, C_PANEL, C_SPLIT, C_PANEL];
const C_SHOTS: Shot[] = SC.map((s, i) => (i === 0 || i === 15 || i === 21 ? C_HERO : s.id === "shield" ? C_MOSAIC : C_CYCLE[i % 4]));
const SIDES = ["r", "l", "b", "r", "t", "l"] as const;
const CKB_SFX: [number, string][] = [[133, "whoosh_big"], [149, "swish"], [727, "popdeep"], [1199, "fast"], [1498, "whoosh_big"], [1629, "swish"], [1993, "shimmer"], [2152, "sting"]];

/** لوح بلون الجملة: بملء الشاشة (بثقب مكان الشيخ) أو عمود أو لوح صغير */
const panelRect = (s: Shot): R => (s.kind === "panel" || s.kind === "mosaic" ? FULL : s.kind === "split" ? { x: 545, y: 250, w: 505, h: 1040 } : { x: s.stage.x - 20, y: s.stage.y - 20, w: s.stage.w + 40, h: s.stage.h + 40 });
const holeClip = (p: R, hole: R | null) => {
  if (!hole) return undefined;
  const hx = hole.x - p.x - 14, hy = hole.y - p.y - 14, hw = hole.w + 28, hh = hole.h + 28;
  return `path(evenodd, "M0 0 H${p.w} V${p.h} H0 Z M${hx} ${hy} H${hx + hw} V${hy + hh} H${hx} Z")`;
};

const Panel: React.FC<{ s: Shot; i: number; u: number; hole: R | null; children: React.ReactNode }> = ({ s, i, u, hole, children }) => {
  const p = panelRect(s), side = SIDES[i % SIDES.length], q = easeOut(u / 0.34), d = 1 - q;
  const tx = side === "r" ? d * 1200 : side === "l" ? -d * 1200 : 0, ty = side === "b" ? d * 1900 : side === "t" ? -d * 1900 : 0;
  const col = i % 2 ? GREEN : MAROON, round = s.kind === "panel" || s.kind === "mosaic" ? 0 : 30;
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, transform: `translate(${tx}px, ${ty}px) rotate(${d * (side === "l" ? -8 : 8)}deg)` }}>
      {round > 0 && <div style={{ position: "absolute", left: 16, top: 16, width: p.w, height: p.h, borderRadius: round, background: GOLD }} />}
      <div style={{ position: "absolute", inset: 0, borderRadius: round, overflow: "hidden", background: col, backgroundImage: "linear-gradient(rgba(255,255,255,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.07) 2px, transparent 2px)", backgroundSize: "54px 54px", clipPath: holeClip(p, hole) }}>
        <div style={{ position: "absolute", left: s.stage.x - p.x, top: s.stage.y - p.y, width: s.stage.w, height: s.stage.h }}>{children}</div>
      </div>
    </div>
  );
};

export const DubCkbPanels: React.FC = () => {
  applyBrand("maroon"); BRAND.accent = GOLD; BRAND.accentDeep = "#9c7a3a"; useFonts(["ruqaa"]);   /* الرسوم بالذهبي فوق الألواح العنابية والخضراء */
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const idx = SC.findIndex((s) => t >= s.a && t < s.b), sc = idx >= 0 ? SC[idx] : undefined, u = sc ? t - sc.a : 0;
  const full = t < 4.45 || (t >= 49.95 && t < 54.3);
  const shot = idx >= 0 ? C_SHOTS[idx] : C_HERO;
  const v = videoAt(t, C_SHOTS), vc = vCrop(v.r);
  const vis = !full && v.r.x > -v.r.w + 10 ? v.r : null;
  const prevI = idx > 0 && idx !== 15 ? idx - 1 : -1, prevSc = prevI >= 0 ? SC[prevI] : undefined;
  /* الكاميرا تطير: انتقال كل رابع جملة بميل وتكبير وضبابية بدل الانزلاق */
  const fly = idx >= 0 && idx % 4 === 2 && u < 0.32 ? 1 - u / 0.32 : 0;
  const handles = shot.kind === "hero" && !full ? clamp(u / 0.2) * (1 - clamp((u - 1.2) / 0.3)) : t > 4.5 && t < 6.6 ? 1 : 0;
  const leak = 0.16 + 0.06 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 4.1);
  /* شبكة التصغير في مشهد الدرع: تسع بلاطات للمشاهد السابقة ثم تقريب إلى الوسط */
  const mosaic = sc?.id === "shield" && u < 1.1;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: CREAM, backgroundImage: "linear-gradient(rgba(42,28,31,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,28,31,.06) 2px, transparent 2px)", backgroundSize: "54px 54px" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_ckb.wav")} />
      <AbsoluteFill>
        <VSlot src="dubkmr/src.mp4" w={v.r.w} h={v.r.h} radius={full ? 0 : 26} vx={vc.vx} vy={vc.vy} vw={vc.vw} vh={vc.vh} style={{ left: v.r.x, top: v.r.y }} grow={0} />
        <AbsoluteFill style={{ transform: fly ? `rotate(${fly * 10}deg) scale(${1 + fly * 0.25})` : undefined, filter: fly ? `blur(${fly * 12}px)` : undefined }}>
          {!full && prevSc && u < 0.36 && <Panel s={C_SHOTS[prevI]} i={prevI} u={9} hole={vis}><StageArt id={prevSc.id} u={t - prevSc.a} r={C_SHOTS[prevI].stage} /></Panel>}
          {!full && sc && !mosaic && <Panel key={sc.id + sc.a} s={shot} i={idx} u={fly ? 9 : u} hole={vis}><StageArt id={sc.id} u={u} r={shot.stage} /></Panel>}
        </AbsoluteFill>
        {mosaic && (() => { const z = lerp(1, 3, smooth((u - 0.55) / 0.5)), tiles = [0, 2, 4, 6, 10, 13, 16, 19, 20];
          return <AbsoluteFill style={{ background: "#2a1c1f", transform: `scale(${z})`, transformOrigin: "50% 50%" }}>
            {tiles.map((j, n) => { const s = SC[j], q = backOut((u - n * 0.04) / 0.25); const r = { x: (n % 3) * 360 + 8, y: Math.floor(n / 3) * 640 + 8, w: 344, h: 624 };
              return <div key={n} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: n % 2 ? GREEN : MAROON, transform: `scale(${q})`, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 2, top: (r.h - (340 * SH) / SW) / 2, width: 340, height: (340 * SH) / SW }}><StageArt id={n === 4 ? "shield" : s.id} u={3} r={ST(0, 0, 340)} /></div>
              </div>; })}
          </AbsoluteFill>; })()}
        {/* ظل منزاح وحد ذهبي حول الشيخ */}
        {vis && <>
          <div style={{ position: "absolute", left: vis.x + vis.w, top: vis.y + 18, width: 18, height: vis.h, background: MAROON, borderRadius: "0 14px 14px 0" }} />
          <div style={{ position: "absolute", left: vis.x + 18, top: vis.y + vis.h, width: vis.w, height: 18, background: MAROON, borderRadius: "0 0 14px 14px" }} />
          <div style={{ position: "absolute", left: vis.x - 4, top: vis.y - 4, width: vis.w + 8, height: vis.h + 8, border: `4px solid ${GOLD}`, borderRadius: 30 }} />
        </>}
        {vis && handles > 0 && [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0.5, 1]].map(([a, b], i) => <div key={i} style={{ position: "absolute", left: vis.x + a * vis.w - 13, top: vis.y + b * vis.h - 13, width: 26, height: 26, background: CREAM, border: `4px solid ${MAROON}`, opacity: handles }} />)}
        {/* السلك من الشيخ إلى اللوح الصغير في لقطة البطل */}
        {vis && sc && shot.kind === "hero" && (() => { const d = smooth((u - 0.3) / 0.5), w = Math.sin(t * 1.6) * 30, a = { x: vis.x + vis.w - 90, y: vis.y + vis.h + 18 }, b = { x: shot.stage.x + shot.stage.w - 60, y: shot.stage.y - 20 };
          return d > 0 ? <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M ${a.x} ${a.y} C ${a.x + 120 + w} ${a.y + 40} ${b.x + 120 - w} ${b.y - 60} ${b.x} ${b.y}`} stroke={MAROON} strokeWidth={7} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={`${d} 1`} />{d > 0.95 && <rect x={b.x - 18} y={b.y - 12} width={36} height={24} rx={6} fill={GOLD} />}</svg> : null; })()}
        {/* اسم القناة في شارة عنابية */}
        {!full && <div style={{ position: "absolute", left: W / 2 - 230, top: 1838, width: 460, height: 64, borderRadius: 32, background: MAROON, boxShadow: `5px 5px 0 ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 44, color: CREAM, direction: "rtl" }}>محمد بن شمس الدين</div>}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 40% at ${32 + 6 * Math.sin(t / 2)}% -6%, rgba(201,162,90,${leak}), rgba(201,162,90,0) 70%)`, pointerEvents: "none" }} />
      </AbsoluteFill>
      <SfxTrack cues={CKB_SFX} />
    </HybridHost>
  );
};
