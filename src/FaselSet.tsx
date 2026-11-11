import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { tornClip } from "./PaperKit";
import { HybridHost } from "./hybrid/Slot";
import {
  arefF, BLUE, BOOKS, book, CHANNELS, CREAM, DotPatch, fa, FPS, H, INK, kufiF, MAROON, PaperBg, Pic, pose, POSES, Sfx, Strip, Torn, useEnter, usePose, W, WHITE,
} from "./FaselKit";

/** خمسة نماذج مختلفة جذرياً لفاصل «كتبي وقنواتي» (5ث، 1920×1080). كل نموذج بنية وخامة وحركة ولوحة مختلفة.
 *  قواعد المستخدم (2026-11-11): لا كلمة «الشيخ» في أي نص؛ كل عبارة تظهر عند صورها (القنوات/الكتب/المدرسة)؛ لا تداخل نص؛ اهتزاز معتدل؛ لا أزرق. */
export const FASEL_FRAMES = 150;

export const sheikhPic = (name: string, pos = "50% 12%", style?: React.CSSProperties) => <Pic src={pose(name)} fit="cover" pos={pos} style={style} />;
/** عرض شريط يتّسع لنصه فلا يُقصّ */
export const lw = (t: string, s: number, min = 0) => Math.max(min, Math.round(t.length * s * 0.6 + 80));
/** أسماء القنوات الطويلة على سطرين بخط كبير (النقطة على النون تظهر) */
export const LAB2: Record<string, string> = { "محمد بن شمس الدين": "محمد بن\nشمس الدين", "مدرسة شمس الدين": "مدرسة\nشمس الدين" };
export const logo = (src: string, inset: number) => <div style={{ position: "absolute", inset, borderRadius: 999, overflow: "hidden" }}><Pic src={fa(src)} /></div>;

/* ───────────────────────── 1) الجدار: لوحة قصاصات كثيفة ───────────────────────── */
const FaselWallInner: React.FC = () => {
  const f = useCurrentFrame(), zoom = 1 + 0.03 * (f / FASEL_FRAMES);
  const cols = [30, 235, 1495, 1700], rows = [130, 425, 720];
  const slots = cols.flatMap((x, ci) => rows.map((y, ri) => ({ x, y, ci, ri })));
  const t1 = "حمّل واقرأ الكتب", t2 = "من الموقع الرسمي";
  return (
    <AbsoluteFill style={{ background: "#d9c9a6" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
        <PaperBg tex="cream.png" />
        <DotPatch x={-40} y={-30} w={620} h={520} at={0.05} color={BLUE} seed="d1" rot={-4} />
        <DotPatch x={1380} y={650} w={620} h={470} at={0.1} color={MAROON} seed="d2" rot={3} />
        <DotPatch x={700} y={600} w={520} h={460} at={0.15} color={BLUE} seed="d3" rot={2} />
        {slots.map((s, i) => (
          <Torn key={i} x={s.x} y={s.y + (s.ci % 2 ? 24 : 0)} w={190} h={268} at={0.2 + i * 0.085} rot={((i * 37) % 9) - 4} from={s.ci < 2 ? "left" : "right"} seed={"wb" + i} amp={5} rim={7}
            tapes={i % 3 === 0 ? [{ x: 60, y: -18, w: 90, rot: -6 }] : undefined} pins={i % 3 === 1 ? [{ x: 95, y: 10 }] : undefined}>
            <Pic src={book(BOOKS[i % BOOKS.length])} />
          </Torn>
        ))}
        <Strip x={25} y={22} w={lw(t2, 40) + 40} h={96} at={1.3} text={t2} size={40} rot={-2} seed="wl2" from="left" paper={CREAM} z={5} />
        <Strip x={1895 - lw(t1, 44) - 40} y={22} w={lw(t1, 44) + 40} h={96} at={1.45} text={t1} size={44} rot={2} hl={1} seed="wl1" from="right" z={5} />
        <Torn x={700} y={40} w={520} h={540} at={1.0} from="bottom" rot={1.5} seed="wph" amp={8} tapes={[{ x: 200, y: -22, w: 120, rot: 3 }]} paper={CREAM}>
          <div style={{ position: "absolute", inset: 22, background: "#b8cfe6" }}>{sheikhPic(POSES.smile, "50% 8%")}</div>
        </Torn>
        <Strip x={560} y={612} w={800} h={104} at={2.0} text="تابع القنوات في يوتيوب" size={52} rot={-1} hl={1} seed="wp1" paper={CREAM} font="Almarai" />
        {CHANNELS.map((c, i) => (
          <React.Fragment key={i}>
            <Torn x={960 + (i - 1.5) * 262 - 90} y={745} w={180} h={180} at={2.4 + i * 0.25} rot={[-3, 2.5, -2, 3][i]} from="bottom" seed={"wc" + i} amp={6} paper={WHITE} tapes={[{ x: 45, y: -20, w: 90, rot: -5 }]}>
              {logo(c.img, 14)}
            </Torn>
            <Torn x={960 + (i - 1.5) * 262 - 124} y={935} w={248} h={104} at={2.55 + i * 0.25} rot={[2, -2, 2, -2][i]} from="bottom" seed={"wl" + i} amp={4} rim={6} paper={i % 2 ? CREAM : WHITE}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: 32, lineHeight: 1.25, color: INK, direction: "rtl", whiteSpace: "pre-line" }}>{LAB2[c.label] ?? c.label}</div>
            </Torn>
          </React.Fragment>
        ))}
      </AbsoluteFill>
      <Sfx cues={[[0.2, "slap1", 0.4], [0.62, "flick1", 0.35], [0.98, "slap2", 0.4], [1.3, "tape", 0.3], [2.0, "rustle1", 0.35], [2.4, "pin", 0.4], [2.9, "flick2", 0.3], [3.4, "rustle3", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2) الدفتر: صفحة مسطّرة بخط اليد ───────────────────────── */
export const Draw: React.FC<{ at: number; d: string; w: number; h: number; x: number; y: number; color?: string; sw?: number; dur?: number }> = ({ at, d, w, h, x, y, color = "#c0272d", sw = 9, dur = 0.35 }) => {
  const t = usePose(2) / FPS, u = Math.max(0, Math.min(1, (t - at) / dur));
  if (t < at) return null;
  return <svg width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}><path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} /></svg>;
};
/** كتابة بخط اليد تُكشف من اليمين؛ لا قصّ رأسي (الحروف العالية والنازلة كاملة) */
export const Handwritten: React.FC<{ at: number; x: number; y: number; w: number; text: string; size: number; color?: string; dur?: number }> = ({ at, x, y, w, text, size, color = "#3b2a1a", dur = 0.7 }) => {
  const t = usePose(2) / FPS;
  if (t < at) return null;
  const u = Math.max(0, Math.min(1, (t - at) / dur));
  return <div style={{ position: "absolute", left: x, top: y, width: w, direction: "rtl", textAlign: "right", fontFamily: arefF, fontSize: size, color, lineHeight: 1.7, paddingTop: size * 0.2, paddingBottom: size * 0.3, clipPath: `inset(-80px 0 -80px ${(1 - u) * 100}%)`, whiteSpace: "nowrap" }}>{text}</div>;
};
const FaselNotebookInner: React.FC = () => {
  const stickies = [{ c: "#f6e27a", r: -3 }, { c: "#f3a6b6", r: 2.5 }, { c: "#cfe3c0", r: -2 }, { c: "#f4d3a5", r: 3 }];
  const Block: React.FC<{ y0: number; at: number; text: string; check: number }> = ({ y0, at, text, check }) => (
    <>
      <Handwritten at={at} x={520} y={y0} w={1120} text={text} size={64} dur={0.8} />
      <Draw at={check} x={1690} y={y0 + 30} w={100} h={90} d="M8 48 L34 78 L92 8" sw={10} dur={0.3} />
    </>
  );
  const sticky = (c: { img: string; label: string }, i: number, x: number, y: number, at: number, size = 200) => (
    <Torn key={i} x={x} y={y} w={size} h={size} at={at} rot={stickies[i % 4].r} from="bottom" seed={"ns" + i} paper={stickies[i % 4].c} amp={3} rim={3}>
      <div style={{ position: "absolute", left: size * 0.2, top: 12, width: size * 0.6, height: size * 0.6, borderRadius: 999, overflow: "hidden" }}><Pic src={fa(c.img)} /></div>
      <div style={{ position: "absolute", left: 6, right: 6, bottom: 8, textAlign: "center", fontFamily: kufiF, fontSize: c.label.length > 14 ? 22 : 26, color: INK, direction: "rtl", lineHeight: 1.1 }}>{c.label}</div>
    </Torn>
  );
  return (
    <AbsoluteFill style={{ background: "#fbf8f0" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 79px, rgba(70,110,190,.38) 79px 81px)", backgroundPosition: "0 40px" }} />
      <div style={{ position: "absolute", right: 150, top: 0, bottom: 0, width: 3, background: "rgba(205,60,60,.55)" }} />
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.55 }}><Pic src={fa("tex/cream.png")} /></AbsoluteFill>
      {[200, 540, 880].map((y) => <div key={y} style={{ position: "absolute", left: 38, top: y, width: 46, height: 46, borderRadius: 23, background: "#5b4a33", boxShadow: "inset 3px 3px 6px rgba(0,0,0,.6), 1px 1px 0 rgba(255,255,255,.5)" }} />)}
      <Torn x={120} y={90} w={400} h={540} at={0.2} rot={-4} from="left" seed="nb1" paper="#fffdf6" amp={4} rim={4} tapes={[{ x: 140, y: -22, w: 130, rot: -4, tone: "rgba(244,190,90,.75)" }]}>
        <div style={{ position: "absolute", left: 26, right: 26, top: 26, height: 420, background: "#e6c89a" }}>{sheikhPic(POSES.explain, "50% 10%")}</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", fontFamily: arefF, fontSize: 40, color: INK, direction: "rtl" }}>محمد بن شمس الدين</div>
      </Torn>
      <Strip x={100} y={800} w={440} h={110} at={2.7} text="mshmsdin.com" size={46} rot={-2} seed="nweb" font="Almarai" />
      {/* 1) القنوات */}
      <Block y0={50} at={0.4} text="لا تنسَ متابعة القنوات الأخرى في يوتيوب" check={1.25} />
      {CHANNELS.slice(0, 3).map((c, i) => sticky(c, i, 1440 - i * 220, 175, 0.9 + i * 0.22))}
      {/* 2) الكتب */}
      <Block y0={390} at={1.8} text="حمّل كتب محمد بن شمس الدين" check={2.6} />
      {BOOKS.slice(0, 6).map((b, i) => (
        <Torn key={b} x={1530 - i * 128} y={505} w={112} h={158} at={2.1 + i * 0.1} rot={[-5, 4, -3, 5, -4, 3][i]} from="bottom" seed={"nbk" + i} amp={3} rim={4} pins={[{ x: 56, y: 8 }]}><Pic src={book(b)} /></Torn>
      ))}
      {/* 3) المدرسة */}
      <Block y0={710} at={3.2} text="تعلّم في مدرسة شمس الدين" check={4.0} />
      {sticky(CHANNELS[3], 3, 1420, 820, 3.7, 210)}
      <Sfx cues={[[0.4, "scribble", 0.3], [0.9, "flick1", 0.3], [1.12, "flick2", 0.3], [1.34, "flick1", 0.3], [1.8, "scribble", 0.3], [2.1, "slap2", 0.3], [2.4, "flick2", 0.25], [3.2, "scribble", 0.3], [3.7, "slap1", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3) التمزيق: ورقة تُمزَّق لتكشف التالية (ثلاث لقطات هادئة) ───────────────────────── */
const TearLayer: React.FC<{ from: number; to: number; tex: string; children: React.ReactNode; z: number; seed: string }> = ({ from, to, tex, children, z, seed }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const u = Math.max(0, Math.min(1, (t - to) / 0.4)), e = u * u * (3 - 2 * u);
  if (t >= to + 0.4) return null;
  return (
    <AbsoluteFill style={{ zIndex: z, transform: `translateY(${-e * 118}%) rotate(${-e * 3}deg)`, transformOrigin: "30% 100%", filter: "drop-shadow(0 22px 26px rgba(20,12,4,.45))" }}>
      <AbsoluteFill style={{ clipPath: tornClip(W, H, seed, 24, 28), overflow: "hidden" }}>
        <PaperBg tex={tex} vignette={0.16} />
        <Sequence from={Math.round(from * FPS)}>{children}</Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const FaselTearInner: React.FC = () => {
  const t1 = "حمّل الكتب من الموقع الرسمي", t2 = "تابع قنوات محمد بن شمس الدين", t3 = "في يوتيوب";
  return (
    <AbsoluteFill style={{ background: "#2b2118" }}>
      <TearLayer z={5} from={0} to={1.5} tex="kraft.png" seed="tl1">
        {BOOKS.slice(0, 8).map((b, i) => (
          <Torn key={b} x={110 + (i % 4) * 450} y={i < 4 ? 36 : 612} w={300} h={424} at={0.05 + i * 0.07} from={i < 4 ? "top" : "bottom"} rot={[-3, 2, -2, 3, 2, -3, 3, -2][i]} seed={"tb" + i} amp={7}><Pic src={book(b)} /></Torn>
        ))}
        <Strip x={960 - lw(t1, 66) / 2} y={470} w={lw(t1, 66)} h={140} at={0.55} text={t1} size={66} rot={-1.5} hl={1} seed="tbs" z={9} />
        <Strip x={1140} y={592} w={lw("mshmsdin.com", 40)} h={80} at={0.75} text="mshmsdin.com" size={40} rot={2} seed="tbw" z={9} paper={CREAM} font="Almarai" tape={false} />
      </TearLayer>
      <TearLayer z={4} from={1.5} to={3.0} tex="news.png" seed="tl2">
        {CHANNELS.map((c, i) => (
          <React.Fragment key={i}>
            <Torn x={150 + i * 440} y={250} w={340} h={340} at={0.1 + i * 0.12} from={i % 2 ? "bottom" : "top"} rot={[-3, 3, -2, 2][i]} seed={"tc" + i} amp={8} paper={WHITE}>{logo(c.img, 24)}</Torn>
            <Strip x={150 + i * 440 + 170 - lw(c.label, 40, 330) / 2} y={620} w={lw(c.label, 40, 330)} h={104} at={0.3 + i * 0.12} text={c.label} size={40} rot={[2, -2, 2, -2][i]} from="bottom" tape={false} paper={i % 2 ? CREAM : WHITE} seed={"tcs" + i} />
          </React.Fragment>
        ))}
        <Strip x={960 - lw(t2, 62) / 2} y={50} w={lw(t2, 62)} h={140} at={0.7} text={t2} size={62} rot={-1.2} hl={1} seed="tct" />
        <Strip x={960 - lw(t3, 56) / 2} y={850} w={lw(t3, 56)} h={120} at={0.9} text={t3} size={60} rot={1.2} seed="tcy" paper={CREAM} font="Almarai" />
      </TearLayer>
      <AbsoluteFill style={{ zIndex: 1 }}>
        <PaperBg tex="cream.png" />
        <Sequence from={Math.round(3.0 * FPS)}>
          <Torn x={110} y={140} w={620} h={860} at={0.05} from="left" rot={-2} seed="t4p" paper="#e6c89a" amp={8}>{sheikhPic(POSES.calm, "50% 6%")}</Torn>
          <Strip x={770} y={170} w={1080} h={210} at={0.15} text="محمد بن شمس الدين" size={84} rot={1.5} hl={2} seed="t4n" />
          <Strip x={860} y={450} w={900} h={120} at={0.3} text="ردود · دروس · كتب · مدرسة" size={54} rot={-1} seed="t4s" paper={CREAM} />
          <Strip x={960} y={620} w={700} h={110} at={0.45} text="mshmsdin.com" size={52} rot={1.5} seed="t4u" paper={WHITE} font="Almarai" />
          {CHANNELS.map((c, i) => (
            <Torn key={i} x={850 + i * 235} y={820} w={190} h={190} at={0.6 + i * 0.1} from="bottom" rot={[-3, 3, -2, 2][i]} seed={"t4c" + i} amp={6}>{logo(c.img, 14)}</Torn>
          ))}
        </Sequence>
      </AbsoluteFill>
      <Sfx cues={[[0.2, "slap1", 0.35], [0.6, "flick1", 0.3], [1.45, "tear", 0.45], [1.7, "slap2", 0.35], [2.0, "flick2", 0.3], [2.95, "tear", 0.45], [3.2, "slap1", 0.35], [3.6, "tape", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4) الرف الكرتوني: ديوراما كرتون ثلاثية العمق ───────────────────────── */
export const Cardboard: React.FC<{ x: number; y: number; w: number; h: number; depth?: number; color?: string }> = ({ x, y, w, h, depth = 16, color = "#b88a57" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
    <div style={{ position: "absolute", left: depth * 0.7, top: depth, width: w, height: h, background: "#7d5a33", boxShadow: "0 18px 24px rgba(30,18,6,.45)" }} />
    <div style={{ position: "absolute", inset: 0, background: color, boxShadow: "inset 0 0 0 3px rgba(255,255,255,.12)" }} />
  </div>
);
/** لوحة مربعة مسمَّرة على لوح علوي (عنوان الرف): أربعة مسامير في زواياها */
export const Plate: React.FC<{ i: number; x: number; y: number; at: number; text: string; color: string; ink: string }> = ({ i, x, y, at, text, color, ink }) => {
  const e = useEnter(at, "pl" + i, "top", (i % 2 ? 1.5 : -1.5), 0.35);
  if (!e) return null;
  const nail = (l: number, t: number) => <div key={l + "-" + t} style={{ position: "absolute", left: l, top: t, width: 16, height: 16, borderRadius: 8, background: "radial-gradient(circle at 35% 30%, #e8e0d0, #6c6254 70%)", boxShadow: "1px 2px 2px rgba(0,0,0,.55)" }} />;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 200, height: 200, transform: e.transform, filter: "drop-shadow(5px 8px 6px rgba(30,18,6,.5))" }}>
      <div style={{ position: "absolute", inset: 0, background: color, boxShadow: "inset 0 0 0 5px rgba(255,255,255,.18), inset 0 0 0 7px rgba(0,0,0,.15)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: kufiF, fontSize: 66, color: ink, direction: "rtl" }}>{text}</div>
        {nail(12, 12)}{nail(172, 12)}{nail(12, 172)}{nail(172, 172)}
      </div>
    </div>
  );
};
export const CutoutPiece: React.FC<{ x: number; y: number; w: number; h: number; at: number; src: string; rot?: number; seed: string; pos?: string }> = ({ x, y, w, h, at, src, rot = 0, seed, pos = "50% 8%" }) => {
  const e = useEnter(at, seed, "bottom", rot, 0.45);
  if (!e) return null;
  const rim = "drop-shadow(5px 0 0 #fbf7ee) drop-shadow(-5px 0 0 #fbf7ee) drop-shadow(0 -5px 0 #fbf7ee)";
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: e.transform, filter: `${rim} drop-shadow(8px 10px 0 #9a7444) drop-shadow(16px 20px 0 #7d5a33) drop-shadow(0 30px 26px rgba(30,18,6,.5))` }}><Pic src={src} fit="contain" pos={pos} /></div>;
};
const FaselShelfInner: React.FC = () => {
  const f = useCurrentFrame(), p = f / FASEL_FRAMES;
  const books = (row: number, n: number, off: number, y: number, x0: number, step: number, t0: number) =>
    Array.from({ length: n }, (_, i) => {
      const bw = 168 + ((i * 17) % 3) * 12, id = BOOKS[(i + off) % BOOKS.length];
      return (
        <Torn key={row + "-" + i} x={x0 + i * step} y={y - 248} w={bw} h={248} at={t0 + i * 0.12} from="bottom" rot={[-2, 1.5, -1, 2, -1.5][i % 5]} seed={`sb${row}${i}`} amp={3} rim={5} paper="#efe3c8">
          <Pic src={book(id)} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 14, background: "rgba(60,40,15,.35)" }} />
        </Torn>
      );
    });
  return (
    <AbsoluteFill style={{ background: "#8a6a43" }}>
      <AbsoluteFill style={{ transform: `translateX(${-18 * p}px)` }}><PaperBg tex="kraft.png" vignette={0.3} /></AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-34 * p}px) scale(1.02)` }}>
        <Cardboard x={30} y={540} w={1860} h={44} />
        <Cardboard x={30} y={965} w={1860} h={44} />
        {books(0, 8, 0, 540, 70, 215, 0.35)}
        {CHANNELS.map((c, i) => (
          <Torn key={i} x={70 + i * 245} y={690} w={222} h={282} at={2.2 + i * 0.25} from="top" rot={[-2.5, 2, -1.5, 2.5][i]} seed={"sc" + i} amp={5} paper={CREAM} tapes={[{ x: 66, y: -20, w: 90, rot: -4 }]}>
            <div style={{ position: "absolute", left: 31, top: 22, width: 160, height: 160, borderRadius: 999, overflow: "hidden" }}><Pic src={fa(c.img)} /></div>
            <div style={{ position: "absolute", left: 14, right: 14, top: 192, bottom: 14, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: c.label.length > 14 ? 25 : 30, color: INK, direction: "rtl", lineHeight: 1.2 }}>{c.label}</div>
          </Torn>
        ))}
      </AbsoluteFill>
      <Cardboard x={30} y={26} w={1860} h={250} />
      <Plate i={0} x={330} y={52} at={0.25} text="تابع" color={WHITE} ink={INK} />
      <Plate i={1} x={700} y={52} at={0.45} text="اقرأ" color={MAROON} ink="#fff" />
      <Plate i={2} x={1070} y={52} at={0.65} text="تعلّم" color={BLUE} ink="#fff" />
      <Plate i={3} x={1440} y={52} at={0.85} text="اشترك" color={CREAM} ink={INK} />
      <AbsoluteFill style={{ transform: `translateX(${-52 * p}px)` }}>
        <CutoutPiece x={960} y={372} w={940} h={705} at={1.5} src={pose(POSES.point)} rot={1.5} seed="shs" pos="50% 0%" />
      </AbsoluteFill>
      <Sfx cues={[[0.25, "flick1", 0.3], [0.5, "flick2", 0.3], [0.7, "flick1", 0.3], [0.9, "flick2", 0.3], [0.35, "slap1", 0.35], [1.5, "slap2", 0.4], [2.2, "pin", 0.4], [2.7, "pin", 0.4], [3.4, "rustle2", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5) الجريدة: صفحة أولى مطبوعة (ثابتة من الإطار 1، النصوص تدخل بعد 10 إطارات) ───────────────────────── */
const FaselPressInner: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const halftone: React.CSSProperties = { filter: "grayscale(1) contrast(1.3) brightness(1.04)" };
  const dots: React.CSSProperties = { position: "absolute", inset: 0, background: "radial-gradient(circle, #000 28%, transparent 32%)", backgroundSize: "8px 8px", mixBlendMode: "multiply", opacity: 0.2 };
  const HeadWord: React.FC<{ text: string; i: number; at: number; hl?: boolean }> = ({ text, i, at, hl }) => {
    const e = useEnter(at, "hw" + i, "none", [-1.5, 1.5, -1][i % 3], 0.2);
    if (!e) return null;
    return <span style={{ display: "inline-block", transform: e.transform, background: hl ? MAROON : "transparent", color: hl ? "#fff" : INK, padding: "0 26px", margin: "0 12px", fontFamily: kufiF, fontSize: 96 }}>{text}</span>;
  };
  const sk = Math.max(0, Math.min(1, (t - 3.5) / 0.18)), stampScale = 2.4 - 1.4 * sk;
  const header = (text: string, x: number, w: number, at: number, hl?: number) => <Strip x={x} y={404} w={w} h={86} at={at} text={text} size={40} rot={0} from="none" tape={false} paper="#f4f0e4" hl={hl} seed={"ph" + text} />;
  const channelPos = (i: number) => ({ x: 1300 + (i % 2) * 285, y: 505 + Math.floor(i / 2) * 262 });
  return (
    <AbsoluteFill style={{ background: "#2f261c" }}>
      <PaperBg tex="news.png" vignette={0.1} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 28, height: 150, borderTop: `6px solid ${INK}`, borderBottom: `3px double ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
        <span style={{ fontFamily: kufiF, fontSize: 108, color: INK }}>محمد بن شمس الدين</span>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 186, display: "flex", justifyContent: "space-between", direction: "rtl", fontFamily: "Almarai", fontWeight: 800, fontSize: 26, color: INK, borderBottom: `2px solid ${INK}`, paddingBottom: 6 }}>
        <span>الصفحة الأولى</span><span>ردود · دروس · كتب · مدرسة</span><span>mshmsdin.com</span>
      </div>
      {[655, 1275].map((x) => <div key={x} style={{ position: "absolute", left: x, top: 402, height: 640, width: 2, background: INK, opacity: 0.65 }} />)}
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 24, height: 0, borderTop: `3px double ${INK}` }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 236, textAlign: "center", direction: "rtl", height: 150 }}>
        <HeadWord text="تابع" i={0} at={0.33} /><HeadWord text="واقرأ" i={1} at={0.5} hl /><HeadWord text="وتعلّم" i={2} at={0.67} />
      </div>
      <Torn x={75} y={425} w={540} h={595} at={0.9} from="none" rot={-1} seed="pp" amp={3} rim={6} paper="#f1ede0">
        <div style={{ position: "absolute", left: 18, right: 18, top: 18, bottom: 64, overflow: "hidden", background: "#cfc9b8" }}><div style={halftone}>{sheikhPic(POSES.desk, "50% 10%")}</div><div style={dots} /></div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: "Almarai", fontWeight: 800, fontSize: 28, color: INK, direction: "rtl" }}>محمد بن شمس الدين</div>
      </Torn>
      {header("حمّل واقرأ الكتب", 690, 560, 1.2, 1)}
      {BOOKS.slice(0, 6).map((b, i) => (
        <Torn key={b} x={690 + (i % 3) * 190} y={505 + Math.floor(i / 3) * 262} w={168} h={236} at={1.45 + i * 0.12} from="none" rot={[-2, 1.5, -1, 2, -1.5, 1][i]} seed={"pb" + i} amp={2} rim={5} paper="#f1ede0">
          <div style={halftone}><Pic src={book(b)} /></div>
        </Torn>
      ))}
      {header("تابع القنوات الأخرى", 1300, 540, 2.2, 1)}
      {CHANNELS.map((c, i) => (
        <Torn key={i} {...channelPos(i)} w={255} h={240} at={2.45 + i * 0.16} from="none" rot={[-1.5, 1.5, 1, -1][i]} seed={"pc" + i} amp={2} rim={5} paper="#f1ede0">
          <div style={{ position: "absolute", left: 60, top: 14, width: 135, height: 135, borderRadius: 999, overflow: "hidden" }}><div style={halftone}><Pic src={fa(c.img)} /></div></div>
          <div style={{ position: "absolute", left: 8, right: 8, top: 156, bottom: 8, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: c.label.length > 14 ? 25 : 30, color: INK, direction: "rtl", lineHeight: 1.15 }}>{c.label}</div>
        </Torn>
      ))}
      <div style={{ position: "absolute", left: 1500, top: 996, transform: `rotate(-4deg) scale(${stampScale})`, opacity: sk, border: `6px solid ${MAROON}`, borderRadius: 10, padding: "0 22px", color: MAROON, fontFamily: kufiF, fontSize: 52, direction: "rtl", mixBlendMode: "multiply", background: "rgba(244,240,228,.55)" }}>اشترك</div>
      <Sfx cues={[[0.33, "stamp", 0.35], [0.5, "stamp", 0.3], [0.67, "stamp", 0.35], [0.9, "slap1", 0.3], [1.2, "flick1", 0.25], [1.5, "rustle3", 0.25], [2.2, "flick2", 0.25], [2.5, "rustle2", 0.25], [3.5, "stamp", 0.5]]} />
    </AbsoluteFill>
  );
};

/** مغلَّف بـHybridHost ليُرندَر بالمسار المختلط (إلزامي للرندر النهائي) */
export const FaselPress: React.FC = () => <HybridHost><FaselPressInner /></HybridHost>;
export const FaselShelf: React.FC = () => <HybridHost><FaselShelfInner /></HybridHost>;
export const FaselWall: React.FC = () => <HybridHost><FaselWallInner /></HybridHost>;
export const FaselNotebook: React.FC = () => <HybridHost><FaselNotebookInner /></HybridHost>;
export const FaselTear: React.FC = () => <HybridHost><FaselTearInner /></HybridHost>;
