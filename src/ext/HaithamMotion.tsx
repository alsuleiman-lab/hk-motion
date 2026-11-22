import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp, dampedSettle } from "./motion";
import { back } from "./PaperSteps";

/**
 * «موشن هيثم» v2 (أمر المستخدم 2026-11-22؛ مرجع «العظام» درس إطاراً بإطار): لوحة ورق قديم تنزل عليها الكاميرا لوحةً بعد لوحة، وفي كل لوحة طبقات كثيفة:
 * رقعة بطبقات وكليب، ووسم يتأرجح عند سقوطه، وبطل نقش كبير يبقى طوال لوحته، وشبكة ميداليات تتتابع بنطق معانيها، ولقطة صفحة كتاب حقيقية (الشاملة)
 * تنزلق مائلة من أسفل ويُمرَّر عليها التمييز الأصفر ثم الإطار الأحمر، وكاميرا تقرّب من نقطة الاهتمام وتبتعد، وشطب أحمر عند الرد.
 * كل ما يتغير بين مقطع ومقطع في المواصفة HSpec، لا في هذا الملف.
 */
export type HWord = { w: string; at: number };
export type HNote = { source?: string; words: HWord[]; from: number; to: number; y?: number; h?: number; size?: number };
export type HTag = { words: HWord[]; to: number; y?: number; size?: number };
export type HHero = { img: string; at: number; to: number; w: number; cy?: number };
export type HMed = { img: string; at: number; to: number; pos: number };
export type HCross = { at: number; to: number; cy?: number; size?: number };
export type HLine = { t: string; hl?: boolean; foot?: boolean };
export type HCard = { at: number; to: number; book: string; ref: string; lines: HLine[]; markAt?: number; boxAt?: number; boxFoot?: number; y?: number; rot?: number };
export type HScene = { from: number; to: number; card?: boolean; zoom?: number[][]; note?: HNote; tag?: HTag; heroes?: HHero[]; meds?: HMed[]; crosses?: HCross[]; cards?: HCard[]; full?: boolean };
export type HSpec = { video: string; dir: string; bg: string; total: number; offset: number; speakerAt: number; shrinkAt: number; srcY: number; endZoom: number; scenes: HScene[] };

const W = 1080, H = 1920, PAN = 0.9;
export const HC = { paper: "#eadfc6", paper2: "#f3ead3", ink: "#2a1c14", sepia: "#6a4a30", maroon: "#8f1d1d", band: "rgba(96,112,140,.32)", card: "#7a5a3a" };
export const camAt = (t: number, scenes: HScene[]) => scenes.reduce((y, s, i) => (i === 0 ? y : y + H * easeInOut((t - s.from) / PAN)), 0);
const kf = (t: number, k: number[][] | undefined, d: number[]) => {
  if (!k || !k.length) return d;
  if (t <= k[0][0]) return k[0].slice(1);
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) { const e = easeInOut((t - k[i][0]) / (k[i + 1][0] - k[i][0])); return k[i].slice(1).map((v, j) => lerp(v, k[i + 1][j + 1], e)); }
  return k[k.length - 1].slice(1);
};

const Clip: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width="86" height="104" viewBox="0 0 86 104" style={{ position: "absolute", left: x - 43, top: y - 30, filter: "drop-shadow(0 6px 6px rgba(40,24,10,.45))" }}>
    <rect x="10" y="30" width="66" height="60" rx="8" fill="#6d4524" stroke="#2f1b0c" strokeWidth="4" />
    <path d="M22 34 V8 Q22 2 29 2 H57 Q64 2 64 8 V34" fill="none" stroke="#b9bcc2" strokeWidth="7" strokeLinecap="round" />
    <rect x="16" y="46" width="54" height="12" rx="4" fill="#8a5a30" />
  </svg>
);

/** رقعة بطبقات: كرتون خلفي أغمق، ثم ورقة بردية، وكليب، وشارة مصدر، والكلمات بشريط تمييز تظهر عند نطقها */
const Note: React.FC<{ n: HNote; t: number; y: number; h: number }> = ({ n, t, y, h }) => {
  if (t < n.from || t >= n.to + 0.3) return null;
  const k = back((t - n.from) / 0.45, 1.4), out = clamp01((n.to + 0.3 - t) / 0.3), e = 1 - Math.min(1, k), size = n.size ?? 56;
  return (
    <div style={{ position: "absolute", left: 70, top: y, width: 940, height: h, opacity: out, transform: `translateY(${e * -80}px) rotate(${e * -3 - 0.4}deg)`, transformOrigin: "50% 0" }}>
      <div style={{ position: "absolute", left: 22, top: 20, right: -22, bottom: -20, background: "#9c7f58", borderRadius: 12, boxShadow: "0 26px 40px rgba(50,30,10,.45)" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 38% 30%, #f6eed6 0%, ${HC.paper2} 45%, #e0cf9f 100%)`, border: "9px solid #6f5233", borderRadius: 10, boxShadow: "inset 0 0 50px rgba(120,80,30,.35)" }}>
        <div style={{ position: "absolute", inset: 14, border: "2px solid rgba(110,80,40,.35)", borderRadius: 6 }} />
      </div>
      <Clip x={470} y={4} />
      {n.source && <div style={{ position: "absolute", right: 34, top: 28, background: "#17181c", color: "#fff", fontFamily: ff("amiri"), fontWeight: 700, fontSize: 30, padding: "3px 18px", borderRadius: 8, direction: "rtl" }}>{n.source}</div>}
      <div style={{ position: "absolute", left: 48, right: 48, top: n.source ? 92 : 44, bottom: 26, direction: "rtl", textAlign: "center", display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start", gap: "8px 4px", fontFamily: ff("amiri"), fontWeight: 700, fontSize: size, lineHeight: 1.5, color: HC.ink }}>
        {n.words.map((w, i) => {
          const o = easeOut((t - w.at) / 0.16);
          return <span key={i} style={{ opacity: o, background: o > 0 ? HC.band : "transparent", padding: "0 9px", borderRadius: 6, transform: `translateY(${(1 - o) * 18}px)` }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

/** وسم معلّق بدبوس يسقط ويتأرجح كالبندول ثم يستقر */
const Tag: React.FC<{ g: HTag; t: number; y: number }> = ({ g, t, y }) => {
  const at = g.words[0].at;
  if (t < at || t >= g.to + 0.3) return null;
  const u = (t - at) * 30, out = clamp01((g.to + 0.3 - t) / 0.3);
  const drop = easeOut((t - at) / 0.3), swing = -22 * dampedSettle(u, 0.06, 0.07);
  return (
    <div style={{ position: "absolute", left: 130, width: 820, top: y, opacity: out, transform: `translateY(${(1 - drop) * -200}px) rotate(${swing - 1}deg)`, transformOrigin: "50% -30px" }}>
      <div style={{ position: "absolute", left: 400, top: -34, width: 18, height: 18, borderRadius: "50%", background: "#a8693a", boxShadow: "0 3px 4px rgba(0,0,0,.4)" }} />
      <div style={{ padding: "12px 26px", background: HC.paper2, border: `7px solid ${HC.card}`, borderRadius: 12, boxShadow: "0 16px 24px rgba(60,40,20,.4)", direction: "rtl", textAlign: "center", fontFamily: ff("ruqaa"), fontWeight: 700, fontSize: g.size ?? 72, color: HC.maroon }}>
        {g.words.map((w, i) => <span key={i} style={{ opacity: easeOut((t - w.at) / 0.16), margin: "0 8px", display: "inline-block" }}>{w.w}</span>)}
      </div>
    </div>
  );
};

const Hero: React.FC<{ h: HHero; t: number; dir: string; cy: number }> = ({ h, t, dir, cy }) => {
  if (t < h.at || t >= h.to + 0.35) return null;
  const k = back((t - h.at) / 0.55, 1.6), out = clamp01((h.to + 0.35 - t) / 0.35), u = t - h.at;
  const bob = Math.sin(u * 2.0) * 10, rot = Math.sin(u * 1.3) * 1.6, sc = 1 + 0.015 * Math.sin(u * 1.7);
  return (
    <>
      <div style={{ position: "absolute", left: 540 - h.w * 0.3, top: (h.cy ?? cy) + h.w * 0.36, width: h.w * 0.6, height: h.w * 0.09, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(70,45,20,.32), rgba(70,45,20,0) 70%)", opacity: out * Math.max(0, k) }} />
      <Img src={staticFile(`${dir}/${h.img}.png`)} style={{ position: "absolute", left: 540 - h.w / 2, top: (h.cy ?? cy) - h.w / 2 + bob, width: h.w, height: h.w, opacity: out, transform: `scale(${(0.5 + 0.5 * Math.max(0, k)) * sc}) rotate(${rot + (1 - Math.min(1, k)) * -10}deg)`, filter: "drop-shadow(0 18px 18px rgba(60,40,20,.38))" }} />
    </>
  );
};

const MED = 248;
const Med: React.FC<{ m: HMed; t: number; dir: string; rows: number[] }> = ({ m, t, dir, rows }) => {
  if (t < m.at || t >= m.to + 0.35) return null;
  const k = back((t - m.at) / 0.5, 2.0), out = clamp01((m.to + 0.35 - t) / 0.35), u = t - m.at;
  const left = m.pos % 2 === 0, row = Math.floor(m.pos / 2);
  const cx = left ? 142 : 938, cy = rows[row] + Math.sin(u * 1.9 + m.pos) * 7;
  return (
    <div style={{ position: "absolute", left: cx - MED / 2, top: cy - MED / 2, width: MED, height: MED, opacity: out, transform: `scale(${Math.max(0, k)}) rotate(${(1 - Math.min(1, k)) * -14}deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #f8f0da, #e8dab5)", border: `7px solid ${HC.sepia}`, boxShadow: "0 16px 24px rgba(60,40,20,.42), inset 0 0 26px rgba(120,80,30,.35)", overflow: "hidden" }}>
        <Img src={staticFile(`${dir}/${m.img}.png`)} style={{ position: "absolute", left: MED * 0.05, top: MED * 0.05, width: MED * 0.9, height: MED * 0.9 }} />
      </div>
      <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "2px solid rgba(106,74,48,.5)" }} />
    </div>
  );
};

const Cross: React.FC<{ c: HCross; t: number; cy: number }> = ({ c, t, cy }) => {
  if (t < c.at || t >= c.to + 0.3) return null;
  const s = c.size ?? 250, y = c.cy ?? cy, a = easeOut((t - c.at) / 0.2), b = easeOut((t - c.at - 0.12) / 0.2), out = clamp01((c.to + 0.3 - t) / 0.3);
  const punch = 1 + 0.08 * Math.max(0, 1 - (t - c.at) / 0.25);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out, transform: `scale(${punch})`, transformOrigin: `540px ${y}px`, filter: "drop-shadow(0 8px 8px rgba(60,10,10,.45))" }}>
      <line x1={540 - s} y1={y - s} x2={540 - s + 2 * s * a} y2={y - s + 2 * s * a} stroke={HC.maroon} strokeWidth={38} strokeLinecap="round" />
      <line x1={540 + s} y1={y - s} x2={540 + s - 2 * s * b} y2={y - s + 2 * s * b} stroke={HC.maroon} strokeWidth={38} strokeLinecap="round" />
    </svg>
  );
};

/** لقطة صفحة كتاب حقيقية (من الشاملة): شريط عنوان، نص، تمييز أصفر يُمرَّر ثم إطار أحمر، تنزلق مائلة وتخرج للأسفل */
const Card: React.FC<{ c: HCard; t: number }> = ({ c, t }) => {
  if (t < c.at || t >= c.to + 0.45) return null;
  const k = back((t - c.at) / 0.7, 1.25), ex = clamp01((t - c.to) / 0.4), y0 = c.y ?? 1330, e = 1 - Math.min(1, k);
  const mk = c.markAt !== undefined ? easeInOut((t - c.markAt) / 0.7) : 0, bx = c.boxAt !== undefined ? easeOut((t - c.boxAt) / 0.35) : 0, bf = c.boxFoot !== undefined ? easeOut((t - c.boxFoot) / 0.35) : 0;
  const lastFoot = c.lines.length - 1;
  return (
    <div style={{ position: "absolute", left: 50, top: y0, width: 980, transform: `translateY(${e * 760 + ex * 700}px) rotate(${e * (c.rot ?? 7) - 0.5}deg)`, opacity: 1 - ex, transformOrigin: "50% 100%", filter: "drop-shadow(0 22px 24px rgba(40,24,10,.5))" }}>
      <div style={{ background: "#173f63", color: "#e9eef3", fontFamily: ff("amiri"), fontWeight: 700, fontSize: 30, padding: "12px 24px", direction: "rtl", display: "flex", justifyContent: "space-between", borderRadius: "10px 10px 0 0" }}><span>{c.book}</span><span style={{ opacity: 0.85 }}>{c.ref}</span></div>
      <div style={{ background: "#fbf8ee", padding: "20px 28px 24px", direction: "rtl", textAlign: "right", fontFamily: ff("amiri"), color: "#1d1a17", borderRadius: "0 0 8px 8px" }}>
        {c.lines.map((l, i) => {
          const hl = !!l.hl, ft = !!l.foot, firstFoot = ft && !c.lines[i - 1]?.foot;
          return (
            <div key={i} style={{ position: "relative", fontSize: ft ? 27 : 36, lineHeight: ft ? 1.7 : 1.85, opacity: ft ? 0.85 : 1, borderTop: firstFoot ? "2px solid #bbb" : undefined, marginTop: firstFoot ? 10 : 0, paddingTop: firstFoot ? 8 : 0 }}>
              {hl && <div style={{ position: "absolute", inset: "4px -6px", background: "rgba(255,214,10,.65)", clipPath: `inset(0 0 0 ${(1 - mk) * 100}%)`, borderRadius: 4 }} />}
              {hl && bx > 0 && <div style={{ position: "absolute", inset: "2px -10px", border: "4px solid #c11a1a", borderRadius: 6, clipPath: `inset(0 ${(1 - bx) * 100}% 0 0)` }} />}
              {ft && i === lastFoot && bf > 0 && <div style={{ position: "absolute", inset: "0 -10px", border: "4px solid #c11a1a", borderRadius: 6, clipPath: `inset(0 ${(1 - bf) * 100}% 0 0)` }} />}
              <span style={{ position: "relative" }}>{l.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const speakerBox = (t: number, shrinkAt: number) => {
  const k = easeInOut((t - shrinkAt) / 0.7);
  return { x: lerp(0, 150, k), y: lerp(0, 110, k), w: lerp(1080, 780, k), h: lerp(1920, 560, k), r: lerp(0, 26, k), k };
};

export const HaithamMotion: React.FC<{ spec: HSpec }> = ({ spec }) => {
  useFonts(["amiri", "ruqaa", "rakkas"]);
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps + spec.offset;
  const cam = camAt(t, spec.scenes);
  const speed = Math.abs(camAt(t + 0.03, spec.scenes) - camAt(t - 0.03, spec.scenes)) / 0.06;
  const blur = Math.min(18, speed / 150);
  const sp = speakerBox(t, spec.shrinkAt);
  const lastFrom = spec.scenes[spec.scenes.length - 1].from;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: HC.paper }}>
          <Img src={staticFile(`${spec.dir}/${spec.bg}.png`)} style={{ width: W, height: H, objectFit: "cover", transform: `translate(${Math.sin(t * 0.4) * 14}px, ${-(cam % H) * 0.15}px) scale(1.14)` }} />
        </AbsoluteFill>
      </HybridBg>
      <Audio src={staticFile(spec.video)} startFrom={Math.round(spec.offset * fps)} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translateY(${-cam}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        {spec.scenes.map((s, i) => {
          if (Math.abs(i * H - cam) > H * 1.02) return null;
          const sk = !!s.card;
          const [z, dx, dy] = kf(t, s.zoom, [1, 0, 0]);
          const breathe = 1 + 0.008 * Math.sin(t * 0.9 + i);
          const noteY = sk ? 700 : 90, noteH = sk ? 310 : 330, tagY = sk ? 1030 : 440, heroCy = sk ? 1480 : 960;
          const rows = sk ? [1215, 1475, 1735] : [700, 965, 1230];
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * H, width: W, height: H }}>
              {s.full ? (
                <VSlot src={spec.video} startFrom={Math.round(spec.offset * fps)} w={W} h={H} vx={-(W * spec.endZoom - W) / 2} vy={0} vw={W * spec.endZoom} vh={H * spec.endZoom} />
              ) : (
                <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${z * breathe})`, transformOrigin: "50% 50%" }}>
                  {sk && (
                    <>
                      <div style={{ position: "absolute", left: 150 - 16, top: 110 - 16, width: 780 + 32, height: 560 + 32, border: "16px solid #2a1c14", borderRadius: 30, boxSizing: "border-box", opacity: sp.k, boxShadow: "0 24px 36px rgba(40,24,10,.45)" }} />
                      <Clip x={540} y={96} />
                    </>
                  )}
                  {(s.heroes ?? []).map((h, j) => <Hero key={j} h={h} t={t} dir={spec.dir} cy={heroCy} />)}
                  {(s.meds ?? []).map((m, j) => <Med key={j} m={m} t={t} dir={spec.dir} rows={rows} />)}
                  {(s.crosses ?? []).map((c, j) => <Cross key={j} c={c} t={t} cy={heroCy} />)}
                  {(s.cards ?? []).map((c, j) => <Card key={j} c={c} t={t} />)}
                  {s.tag && <Tag g={s.tag} t={t} y={s.tag.y ?? tagY} />}
                  {s.note && <Note n={s.note} t={t} y={s.note.y ?? noteY} h={s.note.h ?? noteH} />}
                </div>
              )}
            </div>
          );
        })}
        {spec.scenes[0]?.card && (
          <VSlot src={spec.video} startFrom={Math.round(spec.offset * fps)} w={sp.w} h={sp.h} radius={sp.r} vx={-(sp.w * (lerp(spec.endZoom, 1, sp.k) - 1)) / 2} vy={-(spec.srcY * sp.k) * ((sp.w * lerp(spec.endZoom, 1, sp.k)) / W)} vw={sp.w * lerp(spec.endZoom, 1, sp.k)} vh={(sp.w * lerp(spec.endZoom, 1, sp.k) * 16) / 9} style={{ left: sp.x, top: sp.y, opacity: clamp01((t - spec.speakerAt) / 0.15) }} />
        )}
      </div>
      {t < lastFrom + PAN * 0.6 && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(70,45,20,.30) 100%)" }} />}
    </HybridHost>
  );
};
