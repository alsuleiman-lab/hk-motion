import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadNaskh } from "@remotion/google-fonts/NotoNaskhArabic";
import { HybridBg, HybridHost, VSlot } from "./hybrid/Slot";
import { BRAND, RED } from "./brand";

export const TK10_FRAMES = 926; // 30.867 s
const KUFI = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] }).fontFamily;
const NASKH = loadNaskh("normal", { weights: ["700"], subsets: ["arabic"] }).fontFamily;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/* ---- layout (1080 × 1920) ---- */
const SRC = { x: 139, y: 147, w: 298, h: 356 };          // the sheikh's rounded square inside the 576×1022 source (inset 4 px from its edge)
const SK = { w: 470, k: 470 / 298 };                      // sheikh card: width, scale
const SK_H = Math.round(SRC.h * SK.k), SK_X = (1080 - SK.w) / 2, SK_Y = 64;
const PG = { w: 960, x: 60, y: SK_Y + SK_H + 46 };       // book page card (the source page is 475 × 399)
const PG_H = Math.round((960 * 399) / 475);
const KP = PG.w / 475;                                    // source px → page-card px
/** the red frame on the page, in screen px */
const RF = { x: PG.x + (53 - 50) * KP, y: PG.y + (785 - 584) * KP, w: 250 * KP, h: 60 * KP };
const CARD = { x: 40, y: SK_Y + SK_H + 50, w: 1000, h: 620 }; // the enlarged red text card

/** the quoted passage of the red frame (checked against «جامع العلوم والحكم» on Shamela) as runs; `m` = highlight window [from,to] in seconds */
type Run = { t: string; m?: [number, number] };
const RUNS: Run[] = [
  { t: "ثم إن الفقيه الإمام الزاهد القدوة " }, { t: "أبا زكريا يحيى النووي", m: [7.5, 8.4] }, { t: " – رحمة الله عليه – " },
  { t: "أخذ هذه الأحاديث التي أملاها ابن الصلاح", m: [8.2, 9.3] }, { t: "، " },
  { t: "وزاد عليها تمام اثنين وأربعين حديثاً", m: [9.2, 10.6] }, { t: "، وسمى كتابه بـ «الأربعين»، واشتهرت هذه الأربعون التي جمعها، وكثر حفظها، ونفع الله بها ببركة نية جامعها وحسن قصده – رحمه الله –." },
];
// the same passage re-lit when the speaker asks «أخذ منين؟» (19.7) — the answer is the highlighted source
const RE_LIT: [number, number] = [20.2, 22.0];

const MARK = "rgba(255,196,64,0.85)";

const Marked: React.FC<{ r: Run; t: number }> = ({ r, t }) => {
  let p = 0;
  if (r.m && t < r.m[1] + 1.4) p = easeOut((t - r.m[0]) / 0.45);
  const re = r.t.startsWith("أخذ هذه") && t < RE_LIT[1] ? easeOut((t - RE_LIT[0]) / 0.45) : 0;
  const q = Math.max(p, re);
  return (
    <span style={{ backgroundImage: `linear-gradient(${MARK},${MARK})`, backgroundRepeat: "no-repeat", backgroundPosition: "100% 100%", backgroundSize: `${q * 100}% 100%`, borderRadius: 6, padding: "0 4px", margin: "0 -4px", color: q > 0.5 ? "#1b1405" : undefined }}>{r.t}</span>
  );
};

/** the enlarged red-frame text card: grows out of the frame's place on the page; inner layout is fixed (1000 × 590) and scaled to the live box */
const RedCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 4.5) return null;
  const p = easeOut((t - 4.5) / 0.85);
  const bx = lerp(RF.x, CARD.x, p), by = lerp(RF.y, CARD.y, p), bw = lerp(RF.w, CARD.w, p), bh = lerp(RF.h, CARD.h, p);
  const s = Math.min(bw / CARD.w, bh / CARD.h);
  return (
    <div style={{ position: "absolute", left: bx, top: by, width: bw, height: bh, background: "#fffdf6", border: `${lerp(3, 9, p)}px solid ${RED}`, borderRadius: lerp(4, 22, p), overflow: "hidden", boxShadow: `0 ${p * 24}px ${p * 60}px rgba(0,0,0,0.55)` }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: CARD.w, height: CARD.h, transform: `translate(-50%,-50%) scale(${s})`, direction: "rtl", fontFamily: NASKH, color: "#15110a" }}>
        <div style={{ padding: "38px 46px 0", fontSize: 45, lineHeight: 1.72, textAlign: "justify" }}>
          {RUNS.map((r, i) => <Marked key={i} r={r} t={t} />)}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 74, background: "#f3ecd8", borderTop: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: KUFI, fontSize: 30, color: "#3a2f18" }}>
          <span>جامع العلوم والحكم</span><span style={{ color: RED }}>•</span><span>ابن رجب الحنبلي</span><span style={{ color: RED }}>•</span><span>ص 26</span>
        </div>
      </div>
    </div>
  );
};

/** the closing line written at the bottom, word by word after «منين أخذها» */
const BOTTOM: [string, number][] = [["يعني", 27.0], ["حتى", 27.35], ["«الأربعين»", 27.7], ["سرقها؟!", 28.15]];
const Bottom: React.FC<{ t: number }> = ({ t }) => {
  if (t < BOTTOM[0][1]) return null;
  const k = easeOut((t - BOTTOM[0][1]) / 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1 - k) * 60}px) scale(${0.92 + 0.08 * k})`, background: "rgba(8,16,30,0.9)", border: `3px solid ${RED}`, borderRadius: 34, padding: "22px 54px 30px", direction: "rtl", fontFamily: KUFI, fontSize: 66, lineHeight: 1.3, whiteSpace: "nowrap", boxShadow: "0 16px 44px rgba(0,0,0,0.55)" }}>
        {BOTTOM.map(([w, at], i) => <span key={i} style={{ visibility: t >= at ? "visible" : "hidden", color: i >= 2 ? "#ffc440" : "#fff", margin: "0 9px", display: "inline-block" }}>{w}</span>)}
      </div>
    </div>
  );
};

export const Tk10Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const open = easeOut(t / 0.5);
  const focus = easeOut((t - 4.5) / 0.85);
  const dim = 1 - 0.58 * focus;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%,${BRAND.base2} 0%,${BRAND.base} 55%,${BRAND.base3} 100%)` }} />
        <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 2px,transparent 2.5px)", backgroundSize: "46px 46px" }} />
        <AbsoluteFill>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {[520, 760, 1000, 1240].map((r, i) => <circle key={i} cx={540} cy={430} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />)}
          </svg>
        </AbsoluteFill>
      </HybridBg>
      <Audio src={staticFile("tk10/voice.m4a")} />
      {/* the sheikh (the source's rounded square, enlarged) */}
      <div style={{ position: "absolute", left: SK_X, top: SK_Y, width: SK.w, height: SK_H, transform: `scale(${0.94 + 0.06 * open})`, transformOrigin: "50% 0" }}>
        <VSlot src="tk10/src.mp4" w={SK.w} h={SK_H} radius={50} vx={-SRC.x * SK.k} vy={-SRC.y * SK.k} vw={576 * SK.k} vh={1022 * SK.k} />
        <div style={{ position: "absolute", inset: -5, border: "5px solid rgba(255,255,255,0.9)", borderRadius: 56, pointerEvents: "none" }} />
      </div>
      {/* the book page, bigger */}
      <div style={{ position: "absolute", left: PG.x, top: PG.y, width: PG.w, height: PG_H, transform: `scale(${0.96 + 0.04 * open})`, filter: `brightness(${dim})`, boxShadow: "0 18px 50px rgba(0,0,0,0.5)", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
        <Img src={staticFile("tk10/page.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <RedCard t={t} />
      <Bottom t={t} />
    </HybridHost>
  );
};
