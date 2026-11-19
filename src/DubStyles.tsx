import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, applyBrand } from "./brand";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";
import { H, PH, PW, PX, PY, SC, SH, SW, SX, SY, Scene, W, panelK } from "./DubKmr";
import { CrumplePaper, poly, tornLine } from "./ext/PaperSteps";
import { ff, useFonts } from "./ext/fonts";
import { SfxTrack } from "./ext/sfx";

/**
 * دبلجة «دفع الحسد وتسريع الزواج» بنموذجَي موشن مختلفين (أمر المستخدم 2026-11-19: «حاول الجمع بين الكل… اعمل كل لغة نموذج موشن مختلف»):
 *  - الكرمنجية «لوحة التحقيق الورقية» (مرجعا ملف القضية والخطوات الورقية): ورق كرافت مجعّد يرتجف، الشيخ صورة مثبتة بدبوس وشريط لاصق،
 *    كل جملة بطاقة داكنة ممزقة تهبط من الكاميرا وتُثبَّت بدبوس، وخيط أحمر بين الصورة والبطاقة، وقصاصات تطير حول اللوحة.
 *  - السورانية «الألواح والضوء» (مرجعا حركة الكلمات وقبل وبعد): أرضية كريمية بشبكة، إطار بظل منزاح ومقابض تحديد، ألواح عنابية وخضراء
 *    تنزلق بميل من جهة متبدلة، وسلك يصل الإطار باللوح، وضوء ذهبي يتنفّس من الأعلى.
 * الصوت: الدبلجة المضبوطة بلا المؤثرات القديمة (public/dubkmr/dub_*.wav) وفوقها مؤثرات النموذج الهادئة (ثمانية لكلٍّ). لا كتابة كلام، ولا فاصل.
 */
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/** هندسة إطار الشيخ (كما في التركيبة الأولى): من الشاشة الكاملة إلى الإطار، وتقريب بطيء في المقاطع الكاملة */
const useFrameBox = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const k = panelK(t);
  const push = k < 0.01 ? 1 + 0.045 * smooth((t - (t > 50 ? 50.3 : 0)) / (t > 50 ? 3.6 : 4.45)) : 1;
  const bw = lerp(W, PW, k), bh = lerp(H, PH, k), bx = lerp(0, PX, k), by = lerp(0, PY, k);
  const vw = bw * push, vh = (vw * H) / W;
  const idx = SC.findIndex((s) => t >= s.a && t < s.b);
  return { f, t, k, bw, bh, bx, by, vw, vh, vx: -(vw - bw) / 2, vy: -(vh - bh) * 0.15, idx, sc: idx >= 0 ? SC[idx] : undefined };
};

const PinDot: React.FC<{ x: number; y: number; drop?: number; c?: string }> = ({ x, y, drop = 1, c = "#7a2a22" }) => (
  <div style={{ position: "absolute", left: x - 17, top: y - 17 - (1 - drop) * 220, width: 34, height: 34, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #d0806a, ${c})`, boxShadow: `${(1 - drop) * 24 + 3}px ${(1 - drop) * 34 + 5}px ${(1 - drop) * 12 + 4}px rgba(0,0,0,.35)`, transform: `scale(${1 + (1 - drop) * 0.5})` }} />
);
const Tape: React.FC<{ x: number; y: number; rot: number; w?: number }> = ({ x, y, rot, w = 170 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 22, width: w, height: 44, background: "rgba(232,214,160,.78)", transform: `rotate(${rot}deg)`, boxShadow: "0 2px 4px rgba(0,0,0,.15)", clipPath: `polygon(${poly(tornLine(0, 0, 0, 44, 61, 6, 8))},${poly(tornLine(w, 44, w, 0, 62, 6, 8))})` }} />
);

/* ═══════════ الكرمنجية: لوحة التحقيق الورقية ═══════════ */
const KMR_SFX: [number, string][] = [[133, "tap"], [149, "hit"], [605, "swipe"], [993, "thud"], [1498, "tear"], [1629, "swipe"], [1901, "thud"], [2152, "sting"]];

export const DubKmrBoard: React.FC = () => {
  applyBrand("kraft"); useFonts(["ruqaa"]);
  const { t, k, bw, bh, bx, by, vw, vh, vx, vy, idx, sc } = useFrameBox();
  const u = sc ? t - sc.a : 0;
  const land = easeOut(u / 0.35);
  const rot = idx % 2 ? 1.6 : -1.4;
  const shake = sc?.id === "ban" && u > 0.45 && u < 0.75 ? Math.sin(u * 90) * (0.75 - u) * 30 : 0;
  const string = smooth((t - 4.95) / 0.6);
  /* قصاصات اللوحة تطير إلى الأطراف لحظة التصغير */
  const scraps: [number, number, number, number, number][] = [[-30, 40, -12, -500, -300], [960, 30, 9, 1500, -300], [-40, 1820, 8, -500, 2300], [940, 1830, -10, 1500, 2300]];
  return (
    <HybridHost>
      <HybridBg>
        <CrumplePaper color={BRAND.paper} id="kb-bg" seed={3} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 240px rgba(70,45,20,.4)" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_kmr.wav")} />
      <AbsoluteFill>
        <VSlot src="dubkmr/src.mp4" w={bw} h={bh} radius={lerp(0, 6, k)} vx={vx} vy={vy} vw={vw} vh={vh} style={{ left: bx, top: by }} grow={0} />
        {/* إطار الصورة الأبيض وشريطان ودبوس */}
        <div style={{ position: "absolute", left: bx - 18, top: by - 18, width: bw + 36, height: bh + 36, border: "18px solid #f6efe0", borderRadius: 8, opacity: k, boxShadow: "0 22px 40px rgba(0,0,0,.35)", pointerEvents: "none" }} />
        {k > 0.5 && <><Tape x={bx + 30} y={by - 6} rot={-38} /><Tape x={bx + bw - 30} y={by - 6} rot={38} /><PinDot x={W / 2} y={by - 2} drop={easeOut((t - 4.7) / 0.25)} /><PinDot x={bx + bw - 60} y={by + bh - 40} drop={easeOut((t - 4.9) / 0.2)} /></>}
        {/* قصاصات الأطراف */}
        {scraps.map(([x, y, r, fx, fy], i) => { const a = 4.45 + i * 0.08, q = easeOut((t - a) / 0.35); return t > a ? <div key={i} style={{ position: "absolute", left: lerp(fx, x, q), top: lerp(fy, y, q), width: 180, height: 110, background: i % 2 ? "#e9dcc0" : "#d9c39c", transform: `rotate(${r + (1 - q) * 90}deg)`, filter: `blur(${(1 - q) * 6}px) drop-shadow(0 6px 6px rgba(0,0,0,.25))`, opacity: k, clipPath: `polygon(${poly(tornLine(0, 2, 180, 0, 70 + i, 12, 9))},${poly(tornLine(180, 110, 0, 108, 80 + i, 12, 9))})` }} /> : null; })}
        {/* الخيط الأحمر من الصورة إلى البطاقة */}
        {k > 0.5 && string > 0 && <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><path d={`M ${bx + bw - 60} ${by + bh - 40} Q ${bx + bw - 40} ${SY - 10} ${W / 2} ${SY + 18}`} stroke="#a8322a" strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${string} 1`} /></svg>}
        {/* بطاقة الجملة: تهبط من الكاميرا بظل يصغر، وتُثبَّت بدبوس */}
        {sc && k > 0.02 && (
          <div key={sc.id + sc.a} style={{ position: "absolute", left: SX, top: SY + (1 - k) * 820, width: SW, height: SH, transform: `translate(${shake}px, ${shake * 0.4}px) rotate(${rot}deg) scale(${lerp(1.22, 1, land)})`, filter: `drop-shadow(${lerp(40, 6, land)}px ${lerp(60, 12, land)}px ${lerp(30, 8, land)}px rgba(0,0,0,.4))` }}>
            <div style={{ position: "absolute", inset: 0, background: BRAND.navy, clipPath: `polygon(${poly(tornLine(0, 0, SW, 8, 90 + idx, 30, 12))},${poly(tornLine(SW, SH, 0, SH - 6, 120 + idx, 30, 14))})` }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,240,210,.10), transparent 70%)" }} />
              <Scene id={sc.id} u={u} />
            </div>
          </div>
        )}
        {sc && k > 0.5 && <PinDot x={W / 2} y={SY + 18} drop={easeOut((u - 0.3) / 0.2)} />}
        {/* اسم القناة على شريط ورقي ممزق */}
        <div style={{ position: "absolute", left: W / 2 - 260, top: 1836, width: 520, height: 70, opacity: k, transform: "rotate(-1.5deg)", filter: "drop-shadow(0 4px 5px rgba(0,0,0,.25))" }}>
          <div style={{ position: "absolute", inset: 0, background: "#f4ecdb", clipPath: `polygon(${poly(tornLine(0, 3, 520, 0, 141, 16, 6))},${poly(tornLine(520, 70, 0, 67, 142, 16, 6))})` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 48, color: BRAND.ink, direction: "rtl" }}>محمد بن شمس الدين</div>
        </div>
      </AbsoluteFill>
      <SfxTrack cues={KMR_SFX} />
    </HybridHost>
  );
};

/* ═══════════ السورانية: الألواح والضوء ═══════════ */
const CKB_SFX: [number, string][] = [[133, "whoosh_big"], [149, "swish"], [727, "popdeep"], [1199, "fast"], [1498, "whoosh_big"], [1629, "swish"], [1993, "shimmer"], [2152, "sting"]];
const SIDES = ["r", "l", "b", "r", "l", "t"] as const;
const MAROON = "#6e2c2e", GREEN = "#5c7656", GOLD = "#c9a25a";

const SlidePanel: React.FC<{ i: number; u: number; children?: React.ReactNode }> = ({ i, u, children }) => {
  const q = easeOut(u / 0.32), d = 1 - q, side = SIDES[i % SIDES.length];
  const tx = side === "r" ? d * 1100 : side === "l" ? -d * 1100 : 0, ty = side === "b" ? d * 900 : side === "t" ? -d * 1300 : 0;
  const col = i % 2 ? GREEN : MAROON;
  return (
    <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, transform: `translate(${tx}px, ${ty}px) rotate(${d * (side === "l" ? -7 : 7)}deg)` }}>
      <div style={{ position: "absolute", left: 16, top: 16, width: SW, height: SH, borderRadius: 30, background: BRAND.mark }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", background: col, backgroundImage: "linear-gradient(rgba(255,255,255,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.07) 2px, transparent 2px)", backgroundSize: "54px 54px" }}>{children}</div>
    </div>
  );
};

export const DubCkbPanels: React.FC = () => {
  applyBrand("maroon"); BRAND.accent = GOLD; BRAND.accentDeep = "#9c7a3a"; useFonts(["ruqaa"]);   /* الرسوم بالذهبي فوق الألواح العنابية والخضراء */
  const { t, k, bw, bh, bx, by, vw, vh, vx, vy, idx, sc } = useFrameBox();
  const u = sc ? t - sc.a : 0;
  const handles = clamp((t - 4.5) / 0.25) * (1 - clamp((t - 6.4) / 0.4));
  const cable = smooth((t - 4.95) / 0.6), wave = Math.sin(t * 1.6) * 30;
  const leak = 0.16 + 0.06 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 4.1);
  const prev = idx > 0 && u < 0.34 && SC[idx - 1].b === sc!.a ? SC[idx - 1] : undefined;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: BRAND.card, backgroundImage: `linear-gradient(rgba(42,28,31,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,28,31,.06) 2px, transparent 2px)`, backgroundSize: "54px 54px" }} />
      </HybridBg>
      <Audio src={staticFile("dubkmr/dub_ckb.wav")} />
      <AbsoluteFill>
        <VSlot src="dubkmr/src.mp4" w={bw} h={bh} radius={lerp(0, 26, k)} vx={vx} vy={vy} vw={vw} vh={vh} style={{ left: bx, top: by }} grow={0} />
        {/* ظل منزاح بلون آخر (خارج الصورة فقط) وحدّ ذهبي */}
        {k > 0.02 && <>
          <div style={{ position: "absolute", left: bx + bw, top: by + 18, width: 18 * k, height: bh, background: MAROON, borderRadius: "0 14px 14px 0" }} />
          <div style={{ position: "absolute", left: bx + 18, top: by + bh, width: bw, height: 18 * k, background: MAROON, borderRadius: "0 0 14px 14px" }} />
          <div style={{ position: "absolute", left: bx - 4, top: by - 4, width: bw + 8, height: bh + 8, border: `4px solid ${BRAND.mark}`, borderRadius: 30, opacity: k }} />
        </>}
        {/* مقابض التحديد لحظة التصغير (كأنه برنامج تصميم) */}
        {handles > 0 && [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0.5, 1]].map(([a, b], i) => <div key={i} style={{ position: "absolute", left: bx + a * bw - 13, top: by + b * bh - 13, width: 26, height: 26, background: BRAND.card, border: `4px solid ${MAROON}`, opacity: handles }} />)}
        {/* السلك من الإطار إلى اللوح */}
        {k > 0.5 && cable > 0 && <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M ${bx + bw - 90} ${by + bh + 18} C ${bx + bw + 40 + wave} ${SY - 60} ${SX + SW - 200 - wave} ${SY - 30} ${SX + SW - 120} ${SY + 4}`} stroke={MAROON} strokeWidth={7} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={`${cable} 1`} />
          {cable > 0.95 && <rect x={SX + SW - 138} y={SY - 14} width={36} height={26} rx={6} fill={BRAND.mark} />}
        </svg>}
        {/* الألواح: اللوح السابق يبقى تحته حتى يغطيه الداخل */}
        {k > 0.02 && prev && <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - k) * 820}px)` }}><SlidePanel i={idx - 1} u={9}><Scene id={prev.id} u={t - prev.a} /></SlidePanel></div>}
        {k > 0.02 && sc && <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - k) * 820}px)` }}><SlidePanel key={sc.id + sc.a} i={idx} u={u}>{k > 0.02 && <Scene id={sc.id} u={u} />}</SlidePanel></div>}
        {/* اسم القناة بظل منزاح */}
        <div style={{ position: "absolute", left: 0, width: W, top: 1832, textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: 52, color: MAROON, textShadow: `3px 3px 0 ${BRAND.mark}`, opacity: k, direction: "rtl" }}>محمد بن شمس الدين</div>
        {/* ضوء ذهبي يتنفّس من الأعلى */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 40% at ${32 + 6 * Math.sin(t / 2)}% -6%, rgba(201,162,90,${leak}), rgba(201,162,90,0) 70%)`, pointerEvents: "none" }} />
      </AbsoluteFill>
      <SfxTrack cues={CKB_SFX} />
    </HybridHost>
  );
};
