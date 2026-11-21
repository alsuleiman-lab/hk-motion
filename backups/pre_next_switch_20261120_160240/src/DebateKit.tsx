import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_TITLE, FONT_TEXT, FONT_QURAN, QURAN_FONT } from "./localFonts";
import { HybridHost, HybridBg, VSlot } from "./hybrid/Slot";

/**
 * ريل مناظرة طولي بالنموذج الثالث المعتمد (أمر المستخدم 2026-11-19): صورتان فوق بعض (الشيخ فوق والخصم تحت) والمتكلم يكبر ويصغر الآخر،
 * وعند ضحك الشيخ تكبر صورته وتقرّب بنبضة خفيفة. المصدر فيديو واحد 1920×1080 بنصفين مدموجين (الشيخ يساراً والخصم يميناً).
 * البيانات (الأدوار والضحكات والآيات) في data/debate/<id>.json يبنيها tools/debate_reel_build.mjs.
 */
export type DebateData = {
  src: string; frames: number; title: string; sheikhName?: string; guestName?: string;
  turns: { from: number; to: number; who: "S" | "R" }[];
  /* مشاهد البث الموجَّه بزمن الشريحة: split نصفان متجاوران · doc وثيقة مشاركة وبطاقتا كاميرا · full كاميرا الشيخ وحدها (لا صورة للخصم) */
  scenes: { from: number; to: number; kind: SceneKind }[];
  laughs?: { from: number; to: number }[];
  verses?: { from: number; to: number; text: string; ref: string; naskh?: boolean; fs?: number; h?: number }[];
  sections?: { from: number; to: number; title: string }[];
  /* تركيز على لحظة في صورة الخصم (أمر المستخدم 2026-11-19): تكبر صورته ويقرَّب حول النقطة (x,y من الإطار الأصلي 1920×1080)؛ وrSrc ملف فيديو بديل لصورته (فيه تشويه عين السمكة على نفس الخط الزمني) */
  focus?: { from: number; to: number; x: number; y: number; zoom: number }[];
  rSrc?: string;
  /* تذييل الريل: اسم المناظرة ورابطها واسم القناة (data/debate/footer.json) */
  footer?: { name: string; link?: string; channel: string };
  /* بطاقة شرح بجانب صورة المتكلم (أمر المستخدم 2026-11-19): تُزاح صورته إلى الجانب وتظهر بجانبها بطاقة بيج فيها الكلمة بالعبرية والعربية */
  notes?: { from: number; to: number; who: "S" | "R"; label: string; he: string; ar: string; cap?: string }[];
};
export type SceneKind = "split" | "split3" | "doc" | "full" | "meme";   // meme = بطاقة ميم مدموجة في ملف القص نفسه: تملأ المساحة وحدها بنسبتها 16:9 (أمر المستخدم 2026-11-19)

const W = 1080, H = 1920, GAP = 20, SIDE = 24, BOTTOM = 140, TITLE_H = 190, VERSE_H = 270;
const GOLD = "#e8b84a";
/* مستطيل من الإطار الأصلي 1920×1080 ونقطة العينين فيه، لكل مشهد: قصّ الشيخ وقصّ الخصم (null = لا صورة للخصم في المشهد) */
type Crop = { x0: number; y0: number; cw: number; ch: number; ex: number; ey: number };
const CROPS: Record<SceneKind, { S: Crop; R: Crop | null }> = {
  split: { S: { x0: 0, y0: 0, cw: 950, ch: 900, ex: 420, ey: 230 }, R: { x0: 1048, y0: 0, cw: 870, ch: 900, ex: 1440, ey: 365 } },
  split3: { S: { x0: 0, y0: 0, cw: 618, ch: 900, ex: 350, ey: 280 }, R: { x0: 1312, y0: 0, cw: 608, ch: 900, ex: 1560, ey: 380 } },   // ثلاثة أعمدة: الشيخ | شعار القناة | الخصم
  doc: { S: { x0: 1108, y0: 205, cw: 812, ch: 442, ex: 1600, ey: 380 }, R: { x0: 1537, y0: 650, cw: 360, ch: 407, ex: 1690, ey: 850 } },
  full: { S: { x0: 380, y0: 60, cw: 1120, ch: 800, ex: 940, ey: 350 }, R: null },
  meme: { S: { x0: 0, y0: 0, cw: 1920, ch: 1080, ex: 960, ey: 540 }, R: null },
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (x: number) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };

const whoAt = (turns: DebateData["turns"], t: number): "S" | "R" => { const k = turns.find((x) => t >= x.from && t < x.to); return k ? k.who : (turns.filter((x) => x.to <= t).slice(-1)[0]?.who ?? "S"); };
const inWin = (wins: { from: number; to: number }[] | undefined, t: number, ramp = 0.25) => { let m = 0; for (const w of wins ?? []) m = Math.max(m, smooth((t - w.from) / ramp) * smooth((w.to - t) / ramp)); return m; };

/** يضع جزءاً من الإطار الأصلي في صندوق (bw×h) بحيث تبقى العينان في الثلث الأعلى؛ zm تقريب حول العينين */
const frameFor = (c: Crop, bw: number, h: number, zm = 1) => {
  const s = Math.max(bw / c.cw, h / c.ch) * zm, visW = bw / s, visH = h / s;
  const top = clamp(c.ey - 0.44 * visH, c.y0, c.y0 + c.ch - visH), left = clamp(c.ex - visW / 2, c.x0, c.x0 + c.cw - visW);
  return { vx: -left * s, vy: -top * s, vw: 1920 * s, vh: 1080 * s };
};
const avg = (fn: (t: number) => number, t: number) => { let a = 0; const n = 9; for (let i = 0; i < n; i++) a += fn(t - 0.2 + (0.4 * i) / (n - 1)); return smooth(a / n); };   // انتقال ناعم ≈ 0.4ث
const sceneAt = (sc: DebateData["scenes"], t: number): SceneKind => (sc.find((x) => t >= x.from && t < x.to) ?? sc[sc.length - 1] ?? { kind: "split" as SceneKind }).kind;
const Bg: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #2a3350 0 3px, transparent 4px) 0 0/90px 90px, radial-gradient(circle at 0 0, #232b45 0 28px, transparent 29px) 0 0/90px 90px, radial-gradient(circle at 90px 90px, #232b45 0 28px, transparent 29px) 0 0/90px 90px, linear-gradient(160deg,#171d33,#0f1426)" }} />;
const VerseCard: React.FC<{ v: { text: string; ref: string; naskh?: boolean }; k: number; style: React.CSSProperties; fs?: number }> = ({ v, k, style, fs = 50 }) => (
  <div style={{ position: "absolute", opacity: k, transform: `translateY(${(1 - k) * -26}px)`, background: "linear-gradient(160deg,#2b2113,#171209)", border: `5px solid ${GOLD}`, borderRadius: 26, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 36px", boxSizing: "border-box", direction: "rtl", ...style }}>
    <div style={{ color: "#fff4d6", fontFamily: v.naskh ? "Amiri" : QURAN_FONT, fontSize: fs, lineHeight: v.naskh ? 1.55 : 1.45, textAlign: "center" }}>{v.text}</div>
    <div style={{ color: GOLD, fontFamily: "Almarai", fontWeight: 800, fontSize: Math.round(fs * 0.64), marginTop: 4 }}>{v.ref}</div>
  </div>
);

export const DebateReel: React.FC<DebateData> = (d) => {
  FONT_TITLE(); FONT_TEXT(); FONT_QURAN();
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const kind = sceneAt(d.scenes, t), crops = CROPS[kind];
  if (kind === "meme") {
    const bw = W - 2 * SIDE, mh = Math.round((bw * 9) / 16), my = Math.round((TITLE_H + H - BOTTOM - mh) / 2);
    return (
      <HybridHost>
        <HybridBg><Bg /></HybridBg>
        <Audio src={staticFile(d.src)} volume={0.8} />
        <AbsoluteFill style={{ direction: "rtl" }}>
          <div style={{ position: "absolute", left: SIDE, right: SIDE, top: 34, height: TITLE_H - 60, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: GOLD, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 54, lineHeight: 1.25 }}>{d.title}</div>
          <VSlot src={d.src} w={bw} h={mh} radius={28} vx={0} vy={0} vw={bw} vh={mh} style={{ left: SIDE, top: my }} grow={0} />
          {d.footer ? <div style={{ position: "absolute", left: SIDE, right: SIDE, top: H - BOTTOM + 14, height: BOTTOM - 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
            <div style={{ color: GOLD, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 34, lineHeight: 1.2 }}>{d.footer.name}</div>
            {d.footer.link ? <div style={{ color: "#fff", fontFamily: "Almarai", fontWeight: 700, fontSize: 28, direction: "ltr", letterSpacing: 0.3 }}>{d.footer.link}</div> : null}
            <div style={{ color: "#dfe6ff", fontFamily: "Almarai", fontWeight: 800, fontSize: 30 }}>{d.footer.channel}</div></div> : null}
        </AbsoluteFill>
      </HybridHost>
    );
  }
  const ws = avg((x) => (whoAt(d.turns, x) === "S" ? 1 : 0), t), laugh = inWin(d.laughs, t);
  const fk = inWin(d.focus, t, 0.3), fo = (d.focus ?? []).find((x) => t >= x.from - 0.01 && t <= x.to + 0.01) ?? (d.focus ?? []).find((x) => t >= x.from - 0.4 && t <= x.to + 0.4);
  const wsL = ws * (1 - fk);   // في لحظة التركيز تكبر صورة الخصم كأنه المتكلم (الحلقة تبقى بصوت الشيخ)
  const rShow = crops.R ? 1 : avg((x) => (whoAt(d.turns, x) === "R" ? 1 : 0), t);   // في مشهد full ينطوي الخصم إلا حين يتكلم
  const verse = (d.verses ?? []).find((v) => t >= v.from && t < v.to + 1.5);
  const vk = verse ? smooth((t - verse.from) / 0.3) * smooth((verse.to + 1.5 - t) / 0.3) : 0;   // الآية تبقى 1.5ث بعد آخر كلمة
  const topY = TITLE_H + Math.round(VERSE_H * vk);   // مساحة الآية تُزيح الصورتين إلى أسفل
  const area = H - BOTTOM - topY - GAP;
  const bigK = 0.652, smallK = 1 - bigK;
  const hRn = Math.round(area * (smallK + (bigK - smallK) * (1 - wsL)));
  let hR = Math.round(hRn * rShow);
  let hS = area - hR - (hR > 4 ? GAP : 0);
  hS = Math.round(hS + (area * 0.74 - hS) * laugh * (hR > 4 ? 1 : 0)); hR = area - hS - (hR > 4 ? GAP : 0);
  /* الصورة الصغرى (غير المتكلم) تصغر عرضاً أيضاً بنسبة ارتفاعها إلى ارتفاع الكبرى فيبقى الوجه واللحية كاملين (أمر المستخدم 2026-11-19) */
  const BW = W - 2 * SIDE, hBig = Math.round(area * bigK), pwOf = (h: number) => Math.round(Math.min(BW, (BW * Math.max(h, 10)) / hBig));
  const pwS0 = pwOf(hS), pwR0 = pwOf(hR), xS0 = SIDE + Math.round((BW - pwS0) / 2), xR0 = SIDE + Math.round((BW - pwR0) / 2);
  const nk = inWin(d.notes, t, 0.3), note = (d.notes ?? []).find((n) => t >= n.from - 0.3 && t <= n.to + 0.3), NW = 470, NX = SIDE + BW - NW;
  const pwS = note?.who === "S" ? Math.round(pwS0 + (NW - pwS0) * nk) : pwS0, xS = note?.who === "S" ? Math.round(xS0 + (NX - xS0) * nk) : xS0;
  const pwR = note?.who === "R" ? Math.round(pwR0 + (NW - pwR0) * nk) : pwR0, xR = note?.who === "R" ? Math.round(xR0 + (NX - xR0) * nk) : xR0;
  const zmS = 1 + 0.12 * laugh, shk = laugh > 0.2 ? Math.sin(t * 2 * Math.PI * 7) * 3 * laugh : 0;
  const fs = frameFor(crops.S, pwS, Math.max(hS, 10), zmS), fr0 = crops.R ? frameFor(crops.R, pwR, Math.max(hR, 10)) : null;
  const fr = (() => {
    if (!fr0 || !crops.R || !fo || fk < 0.001) return fr0;
    const bw = pwR, h = Math.max(hR, 10), c = crops.R, s = Math.max(bw / c.cw, h / c.ch) * fo.zoom, visW = bw / s, visH = h / s;
    const left = clamp(fo.x - visW / 2, 0, 1920 - visW), top = clamp(fo.y - 0.5 * visH, 0, 1080 - visH);
    const z = { vx: -left * s, vy: -top * s, vw: 1920 * s, vh: 1080 * s };
    return { vx: fr0.vx + (z.vx - fr0.vx) * fk, vy: fr0.vy + (z.vy - fr0.vy) * fk, vw: fr0.vw + (z.vw - fr0.vw) * fk, vh: fr0.vh + (z.vh - fr0.vh) * fk };
  })();
  const ring = (x: number, w: number, y: number, h: number, hot: number) => <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 28, boxSizing: "border-box", border: `${Math.round(3 + 6 * hot)}px solid ${hot > 0.5 ? GOLD : "rgba(255,255,255,.35)"}`, boxShadow: hot > 0.5 ? `0 0 28px ${GOLD}66` : "none" }} />;
  const tag = (x: number, w: number, y: number, h: number, name: string) => <div style={{ position: "absolute", right: W - (x + w) + 18, maxWidth: w - 36, whiteSpace: "nowrap", overflow: "hidden", top: y + h - 74,background: "rgba(0,0,0,.72)", color: "#fff", borderRadius: 14, padding: "4px 22px", fontFamily: "Almarai", fontWeight: 800, fontSize: w < 700 ? 32 : 44, direction: "rtl" }}>{name}</div>;
  const yR = topY + hS + GAP;
  const noteBox = (y: number, h: number) => note && nk > 0.01 ? (
    <div style={{ position: "absolute", left: SIDE, top: y, width: BW - NW - GAP, height: h, opacity: nk, transform: `translateX(${(1 - nk) * -60}px)`, borderRadius: 28, boxSizing: "border-box", background: "linear-gradient(160deg,#f3e7cf,#e6d3ad)", border: "5px solid #c9a96a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "0 24px", textAlign: "center", color: "#3b2f1a" }}>
      <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 52, color: "#7a5a1e" }}>{note.label}</div>
      <div style={{ fontFamily: "'Noto Serif Hebrew','Frank Ruhl Libre','David',Arial,sans-serif", fontWeight: 700, fontSize: 150, lineHeight: 1.1, direction: "rtl" }}>{note.he}</div>
      <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 40, color: "#7a5a1e" }}>بالعبرية</div>
      <div style={{ width: "70%", height: 4, background: "#c9a96a", borderRadius: 2 }} />
      <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 120, lineHeight: 1.2 }}>{note.ar}</div>
      <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 40, color: "#7a5a1e" }}>{note.cap ?? "ترجمتها بالعربية"}</div>
    </div>) : null;
  return (
    <HybridHost>
      <HybridBg><Bg /></HybridBg>
      <Audio src={staticFile(d.src)} volume={0.8} />
      <AbsoluteFill style={{ direction: "rtl" }}>
        <div style={{ position: "absolute", left: SIDE, right: SIDE, top: 34, height: TITLE_H - 60, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: GOLD, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 54, lineHeight: 1.25 }}>{d.title}</div>
        {verse ? <VerseCard v={verse} k={vk} style={{ left: SIDE, right: SIDE, top: TITLE_H - 20, height: VERSE_H - 20 }} fs={46} /> : null}
        <VSlot src={d.src} w={pwS} h={Math.max(hS, 10)} radius={28} vx={fs.vx} vy={fs.vy} vw={fs.vw} vh={fs.vh} style={{ left: xS, top: topY + shk }} grow={0} />
        {note?.who === "S" ? noteBox(topY + shk, hS) : null}{ring(xS, pwS, topY + shk, hS, Math.max(ws, laugh))}{tag(xS, pwS, topY + shk, hS, d.sheikhName ?? "الشيخ محمد بن شمس الدين")}
        {hR > 4 && fr ? <><VSlot src={d.rSrc ?? d.src} w={pwR} h={hR} radius={28} vx={fr.vx} vy={fr.vy} vw={fr.vw} vh={fr.vh} style={{ left: xR, top: yR }} grow={0} />{note?.who === "R" ? noteBox(yR, hR) : null}{ring(xR, pwR, yR, hR, 1 - ws)}{tag(xR, pwR, yR, hR, d.guestName ?? "الحاخام سومر شروخ")}</> : null}
        {hR > 4 && !fr ? <div style={{ position: "absolute", left: SIDE, top: yR, width: W - 2 * SIDE, height: hR, borderRadius: 28, background: "linear-gradient(160deg,#1d2338,#10152a)", boxSizing: "border-box", border: `${Math.round(3 + 6 * (1 - ws))}px solid ${GOLD}`, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 90 }}>{Array.from({ length: 13 }).map((_, i) => <div key={i} style={{ width: 14, borderRadius: 7, background: GOLD, height: 16 + 70 * Math.abs(Math.sin(t * 9 + i * 1.3)) }} />)}</div>
          <div style={{ color: "#fff", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 44, direction: "rtl" }}>{d.guestName ?? "الحاخام سومر شروخ"}</div>
          <div style={{ color: GOLD, fontFamily: "Almarai", fontWeight: 800, fontSize: 30, direction: "rtl" }}>يتكلم الآن (صوت فقط)</div></div> : null}
        {d.footer ? <div style={{ position: "absolute", left: SIDE, right: SIDE, top: H - BOTTOM + 14, height: BOTTOM - 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
          <div style={{ color: GOLD, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 34, lineHeight: 1.2 }}>{d.footer.name}</div>
          {d.footer.link ? <div style={{ color: "#fff", fontFamily: "Almarai", fontWeight: 700, fontSize: 28, direction: "ltr", letterSpacing: 0.3 }}>{d.footer.link}</div> : null}
          <div style={{ color: "#dfe6ff", fontFamily: "Almarai", fontWeight: 800, fontSize: 30 }}>{d.footer.channel}</div></div> : null}
      </AbsoluteFill>
    </HybridHost>
  );
};

/* غلاف يوتيوب للحلقة الطويلة (1280×720) */
export const DebateThumb: React.FC<{ line1: string; line2: string; tag?: string }> = ({ line1, line2, tag }) => {
  FONT_TITLE(); FONT_TEXT();
  return (
    <AbsoluteFill style={{ background: "#0f1426", direction: "rtl" }}>
      <img src={staticFile("debate_thumb_bg.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 720, objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,28,.05) 35%, rgba(10,14,28,.92) 100%)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 128, textAlign: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 104, lineHeight: 1.15, color: GOLD, textShadow: "0 6px 0 #000, 0 0 28px #000" }}>{line1}</div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 24, textAlign: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 104, color: "#fff", textShadow: "0 5px 0 #000, 0 0 24px #000" }}>{line2}</div>
      {tag ? <div style={{ position: "absolute", top: 22, right: 26, background: GOLD, color: "#1a1206", fontFamily: "Almarai", fontWeight: 800, fontSize: 38, borderRadius: 14, padding: "4px 24px" }}>{tag}</div> : null}
    </AbsoluteFill>
  );
};
