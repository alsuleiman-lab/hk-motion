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
export const HC = { paper: "#ded5c3", paper2: "#e6d3c2", ink: "#0e0c0b", sepia: "#1b1210", maroon: "#9a2a22", band: "#9f9f9f", card: "#ceb49f", folder: "#8a6e56", folderDk: "#795f4a", folderLt: "#b6a580", sheet: "#dbc7a7", sheet2: "#d4b88d", med: "#f3e8dd", frame: "#372c27", brass: "#9a7e69" };
export const camAt = (t: number, scenes: HScene[]) => scenes.reduce((y, s, i) => (i === 0 ? y : y + H * easeInOut((t - s.from) / PAN)), 0);
const kf = (t: number, k: number[][] | undefined, d: number[]) => {
  if (!k || !k.length) return d;
  if (t <= k[0][0]) return k[0].slice(1);
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) { const e = easeInOut((t - k[i][0]) / (k[i + 1][0] - k[i][0])); return k[i].slice(1).map((v, j) => lerp(v, k[i + 1][j + 1], e)); }
  return k[k.length - 1].slice(1);
};

const Clip: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width="96" height="110" viewBox="0 0 96 110" style={{ position: "absolute", left: x - 48, top: y - 34, filter: "drop-shadow(0 5px 5px rgba(40,28,18,.4))" }}>
    <path d="M24 40 V16 Q24 6 34 6 H62 Q72 6 72 16 V40" fill="none" stroke="#c2ad98" strokeWidth="8" strokeLinecap="round" />
    <path d="M24 40 V16 Q24 6 34 6 H62 Q72 6 72 16 V40" fill="none" stroke="#8d7560" strokeWidth="3" strokeLinecap="round" />
    <path d="M8 40 H88 L82 98 Q81 104 75 104 H21 Q15 104 14 98 Z" fill="#9a7e69" stroke="#5e4a3a" strokeWidth="3" />
    <path d="M14 50 H82" stroke="#bda690" strokeWidth="5" />
    <path d="M18 92 H78" stroke="#6f5845" strokeWidth="4" />
  </svg>
);

/** رقعة بطبقات: كرتون خلفي أغمق، ثم ورقة بردية، وكليب، وشارة مصدر، والكلمات بشريط تمييز تظهر عند نطقها */
const Note: React.FC<{ n: HNote; t: number; y: number; h: number }> = ({ n, t, y, h }) => {
  if (t < n.from || t >= n.to + 0.3) return null;
  const k = back((t - n.from) / 0.45, 1.4), out = clamp01((n.to + 0.3 - t) / 0.3), e = 1 - Math.min(1, k), size = n.size ?? 52;
  return (
    <div style={{ position: "absolute", left: 70, top: y, width: 940, height: h, opacity: out, transform: `translateY(${e * -80}px) rotate(${e * -2}deg)`, transformOrigin: "50% 0" }}>
      <div style={{ position: "absolute", inset: 0, background: HC.folder, borderRadius: 6, boxShadow: "0 18px 28px rgba(50,36,24,.34)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 30, background: HC.folderDk, borderRadius: "6px 6px 0 0" }} />
      <div style={{ position: "absolute", right: -34, bottom: 26, width: 56, height: h * 0.34, background: HC.folderDk, borderRadius: "0 10px 10px 0" }} />
      <div style={{ position: "absolute", left: 22, right: 22, top: 36, bottom: 22, background: HC.folderLt, border: "3px solid #c9bb9a" }} />
      <div style={{ position: "absolute", left: 34, right: 34, top: 46, bottom: 34, background: `radial-gradient(ellipse at 18% 22%, rgba(168,140,100,.45), rgba(0,0,0,0) 38%), radial-gradient(ellipse at 82% 70%, rgba(150,120,80,.4), rgba(0,0,0,0) 42%), radial-gradient(ellipse at 55% 40%, rgba(235,220,190,.7), rgba(0,0,0,0) 55%), ${HC.sheet}` }} />
      <Clip x={820} y={6} />
      {n.source && <div style={{ position: "absolute", right: 60, top: 60, background: "#15171b", color: "#fff", fontFamily: ff("almarai"), fontWeight: 700, fontSize: 26, padding: "2px 16px", borderRadius: 6, direction: "rtl" }}>{n.source}</div>}
      <div style={{ position: "absolute", left: 60, right: 60, top: n.source ? 118 : 68, bottom: 44, direction: "rtl", textAlign: "right", fontFamily: ff("almarai"), fontWeight: 700, fontSize: size, lineHeight: 1.62, color: HC.ink }}>
        {n.words.map((w, i) => {
          const o = easeOut((t - w.at) / 0.14);
          return <span key={i} style={{ background: o > 0 ? HC.band : "transparent", color: `rgba(14,12,11,${o})`, padding: "0 4px 0 4px", display: "inline", boxDecorationBreak: "clone" as const, WebkitBoxDecorationBreak: "clone" as const }}>{w.w}{" "}</span>;
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
  const drop = easeOut((t - at) / 0.3), swing = -18 * dampedSettle(u, 0.06, 0.07);
  return (
    <div style={{ position: "absolute", left: 160, width: 760, top: y, opacity: out, transform: `translateY(${(1 - drop) * -200}px) rotate(${swing}deg)`, transformOrigin: "50% -20px" }}>
      <div style={{ position: "absolute", left: 340, top: -52, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #cdb7a2, #7a5b47 70%)", border: "5px solid #5e4a3a", boxShadow: "0 5px 6px rgba(40,28,18,.4)" }}><div style={{ position: "absolute", inset: 20, borderRadius: "50%", background: "#3c2c22" }} /></div>
      <div style={{ position: "absolute", left: 0, top: -14, width: 320, height: 26, background: HC.card, borderRadius: "10px 10px 0 0" }} />
      <div style={{ padding: "12px 30px 14px", background: HC.paper2, borderBottom: `7px solid ${HC.card}`, borderLeft: `3px solid ${HC.card}`, borderRight: `3px solid ${HC.card}`, borderTop: `3px solid ${HC.card}`, boxShadow: "0 12px 18px rgba(50,36,24,.3)", direction: "rtl", textAlign: "center", fontFamily: ff("almarai"), fontWeight: 700, fontSize: g.size ?? 50, color: "#15110e" }}>
        {g.words.map((w, i) => <span key={i} style={{ opacity: easeOut((t - w.at) / 0.14), margin: "0 7px", display: "inline-block" }}>{w.w}</span>)}
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
      <div style={{ position: "absolute", left: 540 - h.w * 0.3, top: (h.cy ?? cy) + h.w * 0.36, width: h.w * 0.6, height: h.w * 0.09, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(60,44,30,.26), rgba(60,44,30,0) 70%)", opacity: out * Math.max(0, k) }} />
      <Img src={staticFile(`${dir}/${h.img}.png`)} style={{ position: "absolute", left: 540 - h.w / 2, top: (h.cy ?? cy) - h.w / 2 + bob, width: h.w, height: h.w, opacity: out, transform: `scale(${(0.5 + 0.5 * Math.max(0, k)) * sc}) rotate(${rot + (1 - Math.min(1, k)) * -10}deg)`, filter: "drop-shadow(0 10px 10px rgba(60,44,30,.22))" }} />
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
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: HC.med, border: `3px solid ${HC.sepia}`, overflow: "hidden" }}>
        <Img src={staticFile(`${dir}/${m.img}.png`)} style={{ position: "absolute", left: MED * 0.05, top: MED * 0.05, width: MED * 0.9, height: MED * 0.9 }} />
      </div>
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
  useFonts(["amiri", "almarai"]);
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
          <Img src={staticFile(`${spec.dir}/${spec.bg}.png`)} style={{ width: W, height: H, objectFit: "cover", opacity: 0.3, mixBlendMode: "multiply" as const, transform: `translate(${Math.sin(t * 0.4) * 14}px, ${-(cam % H) * 0.15}px) scale(1.14)` }} />
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
                      <div style={{ position: "absolute", left: 150 - 16, top: 110 - 16, width: 780 + 32, height: 560 + 32, border: `14px solid ${HC.frame}`, borderRadius: 22, boxSizing: "border-box", opacity: sp.k, boxShadow: "inset 0 0 0 5px #e9dfd0, 0 18px 26px rgba(40,28,18,.34)" }} />
                      <div style={{ position: "absolute", left: 120, top: 330, width: 38, height: 70, background: "#823827", borderRadius: "6px 0 0 6px", opacity: sp.k }} />
                      <div style={{ position: "absolute", left: 120, top: 250, width: 38, height: 70, background: "#696075", borderRadius: "6px 0 0 6px", opacity: sp.k }} />
                      <Clip x={820} y={96} />
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
