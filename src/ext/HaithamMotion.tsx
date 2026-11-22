import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { back } from "./PaperSteps";

/**
 * «موشن هيثم» (أمر المستخدم 2026-11-22، من مرجع تمرين «العظام»): لوحة ورق قديم واحدة تنزل عليها الكاميرا مشهداً بعد مشهد.
 * كل مشهد = (المتحدث في إطار معلّق، رقعة تُكتب كلماتها لحظة نطقها، صور مولّدة عن موضوع الجملة: بطل في الوسط + ميداليات دائرية حوله،
 * شطب أحمر على ما يرده الكلام). يبدأ المتحدث ملء الشاشة ثم يصغر إلى الإطار، ويعود ملء الشاشة في المشهد الأخير.
 * المواصفة (HSpec) هي كل ما يتغير بين فيديو وفيديو: لا كود جديد لكل مقطع.
 */
export type HWord = { w: string; at: number };
export type HNote = { source?: string; words: HWord[]; from: number; to: number; y?: number; h?: number; size?: number };
export type HTag = { words: HWord[]; to: number; y: number; size?: number };
export type HHero = { img: string; at: number; to: number; w: number; cx?: number; cy?: number; tilt?: number };
export type HMed = { img: string; at: number; to: number; pos: number };
export type HCross = { at: number; to: number; cx?: number; cy?: number; size?: number };
export type HScene = { from: number; to: number; card?: boolean; note?: HNote; tag?: HTag; heroes?: HHero[]; meds?: HMed[]; crosses?: HCross[]; full?: boolean };
export type HSpec = { video: string; dir: string; bg: string; total: number; offset: number; speakerAt: number; shrinkAt: number; srcY: number; endZoom: number; scenes: HScene[] };

const W = 1080, H = 1920, PAN = 0.9;
export const HC = { paper: "#eadfc6", paper2: "#f3ead3", ink: "#2a1c14", sepia: "#6a4a30", maroon: "#8f1d1d", band: "rgba(96,112,140,.30)" };

/** مسار الكاميرا: ارتفاع العالم (بكسل) عند الزمن t؛ كل مشهد يبدأ بنزول PAN ثانية */
export const camAt = (t: number, scenes: HScene[]) => scenes.reduce((y, s, i) => (i === 0 ? y : y + H * easeInOut((t - s.from) / PAN)), 0);

const Pin: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x - 34, top: y - 46, width: 68, height: 92 }}>
    <svg width="68" height="92" viewBox="0 0 68 92"><rect x="22" y="2" width="24" height="46" rx="6" fill="#7a4a26" /><rect x="8" y="40" width="52" height="46" rx="8" fill="#a8693a" stroke="#4a2a14" strokeWidth="4" /><circle cx="34" cy="62" r="8" fill="#3a2010" /></svg>
  </div>
);

const Note: React.FC<{ n: HNote; t: number; hasCard: boolean }> = ({ n, t, hasCard }) => {
  if (t < n.from || t >= n.to + 0.3) return null;
  const y = n.y ?? (hasCard ? 720 : 120), h = n.h ?? (hasCard ? 300 : 470), size = n.size ?? 54;
  const k = back((t - n.from) / 0.4, 1.3), out = clamp01((n.to + 0.3 - t) / 0.3);
  return (
    <div style={{ position: "absolute", left: 80, top: y, width: 920, height: h, opacity: out, transform: `translateY(${(1 - Math.min(1, k)) * -60}px) rotate(${(1 - Math.min(1, k)) * -2}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 40% 35%, ${HC.paper2}, #e2d3a8)`, border: `10px solid #7a5a3a`, borderRadius: 10, boxShadow: "0 22px 36px rgba(60,40,20,.38), inset 0 0 40px rgba(120,80,30,.25)" }} />
      <Pin x={460} y={4} />
      {n.source && <div style={{ position: "absolute", right: 34, top: 26, background: "#17181c", color: "#fff", fontFamily: ff("amiri"), fontWeight: 700, fontSize: 30, padding: "4px 18px", borderRadius: 8, direction: "rtl" }}>{n.source}</div>}
      <div style={{ position: "absolute", left: 44, right: 44, top: n.source ? 84 : 36, bottom: 24, direction: "rtl", textAlign: "center", display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start", gap: "6px 4px", fontFamily: ff("amiri"), fontWeight: 700, fontSize: size, lineHeight: 1.5, color: HC.ink }}>
        {n.words.map((w, i) => {
          const o = easeOut((t - w.at) / 0.16);
          return <span key={i} style={{ opacity: o, background: o > 0 ? HC.band : "transparent", padding: "0 8px", borderRadius: 6, transform: `translateY(${(1 - o) * 16}px)` }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

const Tag: React.FC<{ g: HTag; t: number }> = ({ g, t }) => {
  const at = g.words[0].at;
  if (t < at || t >= g.to + 0.3) return null;
  const k = back((t - at) / 0.35, 1.5), out = clamp01((g.to + 0.3 - t) / 0.3);
  return (
    <div style={{ position: "absolute", left: 120, width: 840, top: g.y, padding: "14px 24px", background: HC.paper2, border: "6px solid #7a5a3a", borderRadius: 12, boxShadow: "0 12px 22px rgba(60,40,20,.35)", direction: "rtl", textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: g.size ?? 78, color: HC.maroon, opacity: out, transform: `scale(${0.6 + 0.4 * Math.max(0, k)}) rotate(-1.2deg)` }}>
      {g.words.map((w, i) => <span key={i} style={{ opacity: easeOut((t - w.at) / 0.16), margin: "0 7px", display: "inline-block" }}>{w.w}</span>)}
    </div>
  );
};

const Hero: React.FC<{ h: HHero; t: number; dir: string }> = ({ h, t, dir }) => {
  if (t < h.at || t >= h.to + 0.3) return null;
  const k = back((t - h.at) / 0.45, 1.5), out = clamp01((h.to + 0.3 - t) / 0.3);
  const bob = Math.sin((t - h.at) * 2.2) * 8, sc = 1 + 0.012 * Math.sin((t - h.at) * 1.7);
  return <Img src={staticFile(`${dir}/${h.img}.png`)} style={{ position: "absolute", left: (h.cx ?? 540) - h.w / 2, top: (h.cy ?? 1480) - h.w / 2 + bob, width: h.w, height: h.w, opacity: out, transform: `scale(${(0.55 + 0.45 * Math.max(0, k)) * sc}) rotate(${(h.tilt ?? 0) + (1 - Math.min(1, k)) * -8}deg)`, filter: "drop-shadow(0 14px 14px rgba(60,40,20,.35))" }} />;
};

const MED = 232;
const Med: React.FC<{ m: HMed; t: number; dir: string; top: number }> = ({ m, t, dir, top }) => {
  if (t < m.at || t >= m.to + 0.3) return null;
  const k = back((t - m.at) / 0.4, 1.8), out = clamp01((m.to + 0.3 - t) / 0.3);
  const left = m.pos % 2 === 0, row = Math.floor(m.pos / 2);
  const cx = left ? 150 : 930, cy = top + 150 + row * 262 + Math.sin((t - m.at) * 1.9 + m.pos) * 6;
  return (
    <div style={{ position: "absolute", left: cx - MED / 2, top: cy - MED / 2, width: MED, height: MED, borderRadius: "50%", background: HC.paper2, border: `6px solid ${HC.sepia}`, boxShadow: "0 14px 22px rgba(60,40,20,.35), inset 0 0 22px rgba(120,80,30,.3)", overflow: "hidden", opacity: out, transform: `scale(${Math.max(0, k)})` }}>
      <Img src={staticFile(`${dir}/${m.img}.png`)} style={{ position: "absolute", left: MED * 0.06, top: MED * 0.06, width: MED * 0.88, height: MED * 0.88 }} />
    </div>
  );
};

const Cross: React.FC<{ c: HCross; t: number }> = ({ c, t }) => {
  if (t < c.at || t >= c.to + 0.3) return null;
  const s = c.size ?? 230, cx = c.cx ?? 540, cy = c.cy ?? 1480;
  const a = easeOut((t - c.at) / 0.22), b = easeOut((t - c.at - 0.14) / 0.22), out = clamp01((c.to + 0.3 - t) / 0.3);
  const sh = (1 - a) * 6;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out, filter: "drop-shadow(0 8px 8px rgba(60,10,10,.4))" }}>
      <line x1={cx - s + sh} y1={cy - s} x2={cx - s + 2 * s * a} y2={cy - s + 2 * s * a} stroke={HC.maroon} strokeWidth={34} strokeLinecap="round" />
      <line x1={cx + s} y1={cy - s} x2={cx + s - 2 * s * b} y2={cy - s + 2 * s * b} stroke={HC.maroon} strokeWidth={34} strokeLinecap="round" />
    </svg>
  );
};

/** مربع المتحدث: ملء الشاشة ثم يصغر إلى إطار معلّق (قصّ من المصدر الطولي يبقى الوجه واللحية فيه) */
const speakerBox = (t: number, shrinkAt: number) => {
  const k = easeInOut((t - shrinkAt) / 0.7);
  return { x: lerp(0, 150, k), y: lerp(0, 110, k), w: lerp(1080, 780, k), h: lerp(1920, 560, k), r: lerp(0, 26, k), k };
};

export const HaithamMotion: React.FC<{ spec: HSpec }> = ({ spec }) => {
  useFonts(["amiri", "ruqaa", "rakkas"]);
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps + spec.offset;   // كل الأزمنة في المواصفة بزمن المصدر؛ offset يتخطى مقدمة المقطع
  const cam = camAt(t, spec.scenes);
  const speed = Math.abs(camAt(t + 0.03, spec.scenes) - camAt(t - 0.03, spec.scenes)) / 0.06;
  const blur = Math.min(16, speed / 160);
  const sp = speakerBox(t, spec.shrinkAt);
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: HC.paper }}>
          <Img src={staticFile(`${spec.dir}/${spec.bg}.png`)} style={{ width: W, height: H, objectFit: "cover", transform: `translateY(${-(cam % H) * 0.12}px) scale(1.12)` }} />
        </AbsoluteFill>
      </HybridBg>
      <Audio src={staticFile(spec.video)} startFrom={Math.round(spec.offset * fps)} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translateY(${-cam}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        {spec.scenes.map((s, i) => {
          if (Math.abs(i * H - cam) > H * 1.02) return null;
          const hasCard = !!s.card;
          const top = hasCard ? 1060 : 640;
          const drift = hasCard ? 1 : 1 + 0.04 * clamp01((t - s.from) / Math.max(1, s.to - s.from));
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * H, width: W, height: H }}>
              {s.full ? (
                <VSlot src={spec.video} startFrom={Math.round(spec.offset * fps)} w={W} h={H} vx={-(W * spec.endZoom - W) / 2} vy={0} vw={W * spec.endZoom} vh={H * spec.endZoom} />
              ) : (
                <div style={{ position: "absolute", inset: 0, transform: `scale(${drift})`, transformOrigin: "50% 55%" }}>
                  {hasCard && (
                    <>
                      <div style={{ position: "absolute", left: 150 - 16, top: 110 - 16, width: 780 + 32, height: 560 + 32, border: "16px solid #2a1c14", borderRadius: 30, boxSizing: "border-box", opacity: sp.k, boxShadow: "0 22px 34px rgba(40,24,10,.4)" }} />
                      <Pin x={540} y={96} />
                    </>
                  )}
                  {s.tag && <Tag g={s.tag} t={t} />}
                  {s.note && <Note n={s.note} t={t} hasCard={hasCard} />}
                  {(s.heroes ?? []).map((h, j) => <Hero key={j} h={h} t={t} dir={spec.dir} />)}
                  {(s.meds ?? []).map((m, j) => <Med key={j} m={m} t={t} dir={spec.dir} top={top} />)}
                  {(s.crosses ?? []).map((c, j) => <Cross key={j} c={c} t={t} />)}
                </div>
              )}
            </div>
          );
        })}
        {/* المتحدث في المشهد الأول: ملء الشاشة ثم الإطار (يخرج مع الكاميرا لأنه في إحداثيات العالم) */}
        {spec.scenes[0]?.card && (
          <VSlot src={spec.video} startFrom={Math.round(spec.offset * fps)} w={sp.w} h={sp.h} radius={sp.r} vx={-(sp.w * (lerp(spec.endZoom, 1, sp.k) - 1)) / 2} vy={-(spec.srcY * sp.k) * ((sp.w * lerp(spec.endZoom, 1, sp.k)) / W)} vw={sp.w * lerp(spec.endZoom, 1, sp.k)} vh={(sp.w * lerp(spec.endZoom, 1, sp.k) * 16) / 9} style={{ left: sp.x, top: sp.y, opacity: clamp01((t - spec.speakerAt) / 0.15) }} />
        )}
      </div>
    </HybridHost>
  );
};
