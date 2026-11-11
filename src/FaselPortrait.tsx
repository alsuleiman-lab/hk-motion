import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { HybridHost } from "./hybrid/Slot";
import { tornClip } from "./PaperKit";
import {
  arefF, BLUE, BOOKS, book, CHANNELS, CREAM, DotPatch, fa, FPS, INK, kufiF, MAROON, PaperBg, Pic, pose, POSES, Sfx, Strip, Torn, useEnter, usePose, WHITE,
} from "./FaselKit";
import { Cardboard, CutoutPiece, Draw, LAB2, logo, lw, Plate, sheikhPic } from "./FaselSet";

/** النسخ الطولية (1080×1920) من فواصل «كتبي وقنواتي» الخمسة: نفس البنية والمحتوى والقواعد (لا «الشيخ»، العبارة عند صورها، لا تداخل، اهتزاز معتدل). */
export const FASEL_P_FRAMES = 150;
const PW = 1080, PH = 1920;

/* ── 1) الجدار ── */
const WallP: React.FC = () => {
  const f = useCurrentFrame(), zoom = 1 + 0.03 * (f / FASEL_P_FRAMES);
  const t1 = "حمّل واقرأ الكتب", t2 = "من الموقع الرسمي";
  const slots = [0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4].map((c) => ({ r, c })));
  return (
    <AbsoluteFill style={{ background: "#d9c9a6" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
        <PaperBg tex="p_cream.png" />
        <DotPatch x={-40} y={60} w={700} h={640} at={0.05} color={BLUE} seed="pd1" rot={-3} />
        <DotPatch x={500} y={1500} w={700} h={520} at={0.1} color={MAROON} seed="pd2" rot={3} />
        {slots.map((s, i) => (
          <Torn key={i} x={22 + s.c * 205} y={125 + s.r * 285 + (s.c % 2 ? 22 : 0)} w={180} h={254} at={0.2 + i * 0.07} rot={((i * 37) % 9) - 4} from={s.c < 2 ? "left" : s.c > 2 ? "right" : "top"} seed={"pw" + i} amp={5} rim={7}
            tapes={i % 3 === 0 ? [{ x: 55, y: -18, w: 80, rot: -6 }] : undefined} pins={i % 3 === 1 ? [{ x: 90, y: 10 }] : undefined}>
            <Pic src={book(BOOKS[i % BOOKS.length])} />
          </Torn>
        ))}
        <Strip x={20} y={14} w={lw(t2, 40) + 20} h={92} at={1.3} text={t2} size={40} rot={-1.5} seed="pw2" from="left" paper={CREAM} z={5} />
        <Strip x={1060 - lw(t1, 42) - 20} y={14} w={lw(t1, 42) + 20} h={92} at={1.45} text={t1} size={42} rot={1.5} hl={1} seed="pw1" from="right" z={5} />
        <Torn x={290} y={965} w={500} h={470} at={1.0} from="bottom" rot={1.5} seed="pwph" amp={8} tapes={[{ x: 230, y: -22, w: 120, rot: 3 }]} paper={CREAM}>
          <div style={{ position: "absolute", inset: 22, background: "#b8cfe6" }}>{sheikhPic(POSES.smile, "50% 8%")}</div>
        </Torn>
        <Strip x={150} y={1452} w={780} h={104} at={2.0} text="تابع القنوات في يوتيوب" size={50} rot={-1} hl={1} seed="pwp1" paper={CREAM} font="Almarai" />
        {CHANNELS.map((c, i) => (
          <React.Fragment key={i}>
            <Torn x={540 + (i - 1.5) * 262 - 85} y={1578} w={170} h={170} at={2.4 + i * 0.25} rot={[-3, 2.5, -2, 3][i]} from="bottom" seed={"pwc" + i} amp={6} paper={WHITE} tapes={[{ x: 40, y: -20, w: 90, rot: -5 }]}>{logo(c.img, 12)}</Torn>
            <Torn x={540 + (i - 1.5) * 262 - 124} y={1762} w={248} h={104} at={2.55 + i * 0.25} rot={[2, -2, 2, -2][i]} from="bottom" seed={"pwl" + i} amp={4} rim={6} paper={i % 2 ? CREAM : WHITE}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: 32, lineHeight: 1.25, color: INK, direction: "rtl", whiteSpace: "pre-line" }}>{LAB2[c.label] ?? c.label}</div>
            </Torn>
          </React.Fragment>
        ))}
      </AbsoluteFill>
      <Sfx cues={[[0.2, "slap1", 0.4], [0.62, "flick1", 0.35], [0.98, "slap2", 0.4], [1.3, "tape", 0.3], [2.0, "rustle1", 0.35], [2.4, "pin", 0.4], [2.9, "flick2", 0.3], [3.4, "rustle3", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ── 2) الدفتر ── */
const HandP: React.FC<{ at: number; x: number; y: number; w: number; text: string; size: number; dur?: number }> = ({ at, x, y, w, text, size, dur = 0.8 }) => {
  const t = usePose(2) / FPS;
  if (t < at) return null;
  const u = Math.max(0, Math.min(1, (t - at) / dur));
  return <div style={{ position: "absolute", left: x, top: y, width: w, direction: "rtl", textAlign: "right", fontFamily: arefF, fontSize: size, color: "#3b2a1a", lineHeight: 1.75, paddingTop: size * 0.2, paddingBottom: size * 0.3, clipPath: `inset(-80px 0 -80px ${(1 - u) * 100}%)` }}>{text}</div>;
};
const NotebookP: React.FC = () => {
  const stickies = [{ c: "#f6e27a", r: -3 }, { c: "#f3a6b6", r: 2.5 }, { c: "#cfe3c0", r: -2 }, { c: "#f4d3a5", r: 3 }];
  const sticky = (c: { img: string; label: string }, i: number, x: number, y: number, at: number, size: number) => (
    <Torn key={i} x={x} y={y} w={size} h={size} at={at} rot={stickies[i % 4].r} from="bottom" seed={"pns" + i} paper={stickies[i % 4].c} amp={3} rim={3}>
      <div style={{ position: "absolute", left: size * 0.2, top: 10, width: size * 0.6, height: size * 0.6, borderRadius: 999, overflow: "hidden" }}><Pic src={fa(c.img)} /></div>
      <div style={{ position: "absolute", left: 4, right: 4, bottom: 6, textAlign: "center", fontFamily: kufiF, fontSize: c.label.length > 14 ? 20 : 24, color: INK, direction: "rtl", lineHeight: 1.1, whiteSpace: "pre-line" }}>{LAB2[c.label] ?? c.label}</div>
    </Torn>
  );
  return (
    <AbsoluteFill style={{ background: "#fbf8f0" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 79px, rgba(70,110,190,.38) 79px 81px)", backgroundPosition: "0 40px" }} />
      <div style={{ position: "absolute", right: 110, top: 0, bottom: 0, width: 3, background: "rgba(205,60,60,.55)" }} />
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.55 }}><Pic src={fa("tex/p_cream.png")} /></AbsoluteFill>
      {[260, 780, 1300, 1700].map((y) => <div key={y} style={{ position: "absolute", left: 22, top: y, width: 42, height: 42, borderRadius: 21, background: "#5b4a33", boxShadow: "inset 3px 3px 6px rgba(0,0,0,.6), 1px 1px 0 rgba(255,255,255,.5)" }} />)}
      {/* 1) القنوات */}
      <Torn x={90} y={60} w={360} h={500} at={0.2} rot={-4} from="left" seed="pnb1" paper="#fffdf6" amp={4} rim={4} tapes={[{ x: 120, y: -22, w: 120, rot: -4, tone: "rgba(244,190,90,.75)" }]}>
        <div style={{ position: "absolute", left: 24, right: 24, top: 24, height: 390, background: "#e6c89a" }}>{sheikhPic(POSES.explain, "50% 10%")}</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", fontFamily: arefF, fontSize: 36, color: INK, direction: "rtl" }}>محمد بن شمس الدين</div>
      </Torn>
      <HandP at={0.4} x={470} y={70} w={470} text="لا تنسَ متابعة القنوات الأخرى في يوتيوب" size={52} />
      <Draw at={1.3} x={950} y={90} w={90} h={80} d="M8 42 L30 68 L82 8" color="#c0272d" sw={9} dur={0.3} />
      {CHANNELS.slice(0, 3).map((c, i) => sticky(c, i, 770 - i * 165, 330, 0.9 + i * 0.22, 150))}
      {/* 2) الكتب */}
      <HandP at={1.8} x={60} y={640} w={860} text="حمّل كتب محمد بن شمس الدين" size={58} />
      <Draw at={2.6} x={950} y={660} w={90} h={80} d="M8 42 L30 68 L82 8" color="#c0272d" sw={9} dur={0.3} />
      {BOOKS.slice(0, 6).map((b, i) => (
        <Torn key={b} x={880 - i * 145} y={790} w={128} h={182} at={2.1 + i * 0.1} rot={[-5, 4, -3, 5, -4, 3][i]} from="bottom" seed={"pnbk" + i} amp={3} rim={4} pins={[{ x: 64, y: 8 }]}><Pic src={book(b)} /></Torn>
      ))}
      <Strip x={150} y={1010} w={560} h={110} at={2.7} text="mshmsdin.com" size={46} rot={-2} seed="pnweb" font="Almarai" />
      {/* 3) المدرسة */}
      <HandP at={3.2} x={60} y={1230} w={860} text="تعلّم في مدرسة شمس الدين" size={58} />
      <Draw at={4.0} x={950} y={1250} w={90} h={80} d="M8 42 L30 68 L82 8" color="#c0272d" sw={9} dur={0.3} />
      {sticky(CHANNELS[3], 3, 560, 1380, 3.7, 300)}
      <Sfx cues={[[0.4, "scribble", 0.3], [0.9, "flick1", 0.3], [1.12, "flick2", 0.3], [1.34, "flick1", 0.3], [1.8, "scribble", 0.3], [2.1, "slap2", 0.3], [2.4, "flick2", 0.25], [3.2, "scribble", 0.3], [3.7, "slap1", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ── 3) التمزيق ── */
const TearLayerP: React.FC<{ from: number; to: number; tex: string; children: React.ReactNode; z: number; seed: string }> = ({ from, to, tex, children, z, seed }) => {
  const f = useCurrentFrame(), t = f / FPS, { width, height } = useVideoConfig();
  const u = Math.max(0, Math.min(1, (t - to) / 0.4)), e = u * u * (3 - 2 * u);
  if (t >= to + 0.4) return null;
  return (
    <AbsoluteFill style={{ zIndex: z, transform: `translateY(${-e * 118}%) rotate(${-e * 3}deg)`, transformOrigin: "30% 100%", filter: "drop-shadow(0 22px 26px rgba(20,12,4,.45))" }}>
      <AbsoluteFill style={{ clipPath: tornClip(width, height, seed, 24, 28), overflow: "hidden" }}>
        <PaperBg tex={tex} vignette={0.16} />
        <Sequence from={Math.round(from * FPS)}>{children}</Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const TearP: React.FC = () => {
  const t1 = "حمّل الكتب من الموقع الرسمي", t2 = "تابع قنوات محمد بن شمس الدين", t3 = "في يوتيوب";
  return (
    <AbsoluteFill style={{ background: "#2b2118" }}>
      <TearLayerP z={5} from={0} to={1.5} tex="p_kraft.png" seed="ptl1">
        {BOOKS.slice(0, 6).map((b, i) => (
          <Torn key={b} x={95 + (i % 2) * 450} y={100 + Math.floor(i / 2) * 460} w={440} h={420} at={0.05 + i * 0.07} from={i % 2 ? "right" : "left"} rot={[-3, 2, -2, 3, 2, -3][i]} seed={"ptb" + i} amp={7}><Pic src={book(b)} /></Torn>
        ))}
        <Strip x={540 - lw(t1, 54) / 2} y={1500} w={lw(t1, 54)} h={130} at={0.55} text={t1} size={54} rot={-1.5} hl={1} seed="ptbs" z={9} />
        <Strip x={540 - lw("mshmsdin.com", 44) / 2} y={1680} w={lw("mshmsdin.com", 44)} h={90} at={0.75} text="mshmsdin.com" size={44} rot={1.5} seed="ptbw" z={9} paper={CREAM} font="Almarai" tape={false} />
      </TearLayerP>
      <TearLayerP z={4} from={1.5} to={3.0} tex="p_news.png" seed="ptl2">
        {CHANNELS.map((c, i) => (
          <React.Fragment key={i}>
            <Torn x={95 + (i % 2) * 505} y={300 + Math.floor(i / 2) * 560} w={385} h={385} at={0.1 + i * 0.12} from={i % 2 ? "right" : "left"} rot={[-3, 3, -2, 2][i]} seed={"ptc" + i} amp={8} paper={WHITE}>{logo(c.img, 26)}</Torn>
            <Strip x={95 + (i % 2) * 505 + 192 - lw(c.label, 36, 385) / 2} y={300 + Math.floor(i / 2) * 560 + 410} w={lw(c.label, 36, 385)} h={100} at={0.3 + i * 0.12} text={c.label} size={36} rot={[2, -2, 2, -2][i]} from="bottom" tape={false} paper={i % 2 ? CREAM : WHITE} seed={"ptcs" + i} />
          </React.Fragment>
        ))}
        <Strip x={540 - lw(t2, 48) / 2} y={90} w={lw(t2, 48)} h={140} at={0.7} text={t2} size={48} rot={-1.2} hl={1} seed="ptct" />
        <Strip x={540 - lw(t3, 56) / 2} y={1560} w={lw(t3, 56)} h={120} at={0.9} text={t3} size={56} rot={1.2} seed="ptcy" paper={CREAM} font="Almarai" />
      </TearLayerP>
      <AbsoluteFill style={{ zIndex: 1 }}>
        <PaperBg tex="p_cream.png" />
        <Sequence from={Math.round(3.0 * FPS)}>
          <Torn x={140} y={120} w={800} h={860} at={0.05} from="left" rot={-2} seed="pt4p" paper="#e6c89a" amp={8}>{sheikhPic(POSES.calm, "50% 6%")}</Torn>
          <Strip x={540 - (lw("محمد بن شمس الدين", 62) + 120) / 2} y={1040} w={lw("محمد بن شمس الدين", 62) + 120} h={170} at={0.15} text="محمد بن شمس الدين" size={62} rot={1.2} hl={2} seed="pt4n" />
          <Strip x={540 - lw("ردود · دروس · كتب · مدرسة", 46) / 2} y={1250} w={lw("ردود · دروس · كتب · مدرسة", 46)} h={110} at={0.3} text="ردود · دروس · كتب · مدرسة" size={46} rot={-1} seed="pt4s" paper={CREAM} />
          <Strip x={300} y={1400} w={480} h={96} at={0.45} text="mshmsdin.com" size={44} rot={1.5} seed="pt4u" paper={WHITE} font="Almarai" />
          {CHANNELS.map((c, i) => (
            <Torn key={i} x={540 + (i - 1.5) * 245 - 95} y={1600} w={190} h={190} at={0.6 + i * 0.1} from="bottom" rot={[-3, 3, -2, 2][i]} seed={"pt4c" + i} amp={6}>{logo(c.img, 14)}</Torn>
          ))}
        </Sequence>
      </AbsoluteFill>
      <Sfx cues={[[0.2, "slap1", 0.35], [0.6, "flick1", 0.3], [1.45, "tear", 0.45], [1.7, "slap2", 0.35], [2.0, "flick2", 0.3], [2.95, "tear", 0.45], [3.2, "slap1", 0.35], [3.6, "tape", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ── 4) الرف الكرتوني ── */
const ShelfP: React.FC = () => {
  const f = useCurrentFrame(), p = f / FASEL_P_FRAMES;
  const books = (n: number, y: number, x0: number, step: number, t0: number, off: number) =>
    Array.from({ length: n }, (_, i) => {
      const bw = 170 + ((i * 17) % 3) * 12;
      return (
        <Torn key={"b" + i + off} x={x0 + i * step} y={y - 250} w={bw} h={250} at={t0 + i * 0.12} from="bottom" rot={[-2, 1.5, -1, 2, -1.5][i % 5]} seed={`psb${i}${off}`} amp={3} rim={5} paper="#efe3c8">
          <Pic src={book(BOOKS[(i + off) % BOOKS.length])} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 14, background: "rgba(60,40,15,.35)" }} />
        </Torn>
      );
    });
  return (
    <AbsoluteFill style={{ background: "#8a6a43" }}>
      <AbsoluteFill style={{ transform: `translateX(${-14 * p}px)` }}><PaperBg tex="p_kraft.png" vignette={0.3} /></AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-24 * p}px) scale(1.02)` }}>
        <Cardboard x={20} y={26} w={1040} h={250} />
        <Cardboard x={20} y={660} w={1040} h={44} />
        <Cardboard x={20} y={1030} w={1040} h={44} />
        {books(5, 660, 50, 200, 0.35, 0)}
        {CHANNELS.map((c, i) => (
          <Torn key={i} x={34 + i * 256} y={744} w={226} h={286} at={2.2 + i * 0.25} from="top" rot={[-2.5, 2, -1.5, 2.5][i]} seed={"psc" + i} amp={5} paper={CREAM} tapes={[{ x: 68, y: -20, w: 90, rot: -4 }]}>
            <div style={{ position: "absolute", left: 33, top: 22, width: 160, height: 160, borderRadius: 999, overflow: "hidden" }}><Pic src={fa(c.img)} /></div>
            <div style={{ position: "absolute", left: 12, right: 12, top: 192, bottom: 12, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: c.label.length > 14 ? 26 : 30, color: INK, direction: "rtl", lineHeight: 1.2, whiteSpace: "pre-line" }}>{LAB2[c.label] ?? c.label}</div>
          </Torn>
        ))}
      </AbsoluteFill>
      <Plate i={0} x={40} y={52} at={0.25} text="تابع" color={WHITE} ink={INK} />
      <Plate i={1} x={296} y={52} at={0.45} text="اقرأ" color={MAROON} ink="#fff" />
      <Plate i={2} x={552} y={52} at={0.65} text="تعلّم" color={BLUE} ink="#fff" />
      <Plate i={3} x={808} y={52} at={0.85} text="اشترك" color={CREAM} ink={INK} />
      <AbsoluteFill style={{ transform: `translateX(${-30 * p}px)` }}>
        <CutoutPiece x={-120} y={1130} w={1300} h={975} at={1.5} src={pose(POSES.point)} rot={1} seed="pshs" pos="50% 0%" />
      </AbsoluteFill>
      <Sfx cues={[[0.25, "flick1", 0.3], [0.5, "flick2", 0.3], [0.7, "flick1", 0.3], [0.9, "flick2", 0.3], [0.35, "slap1", 0.35], [1.5, "slap2", 0.4], [2.2, "pin", 0.4], [2.7, "pin", 0.4], [3.4, "rustle2", 0.3]]} />
    </AbsoluteFill>
  );
};

/* ── 5) الجريدة ── */
const PressP: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const halftone: React.CSSProperties = { filter: "grayscale(1) contrast(1.3) brightness(1.04)" };
  const dots: React.CSSProperties = { position: "absolute", inset: 0, background: "radial-gradient(circle, #000 28%, transparent 32%)", backgroundSize: "8px 8px", mixBlendMode: "multiply", opacity: 0.2 };
  const HeadWord: React.FC<{ text: string; i: number; at: number; hl?: boolean }> = ({ text, i, at, hl }) => {
    const e = useEnter(at, "phw" + i, "none", [-1.5, 1.5, -1][i % 3], 0.2);
    if (!e) return null;
    return <span style={{ display: "inline-block", transform: e.transform, background: hl ? MAROON : "transparent", color: hl ? "#fff" : INK, padding: "0 20px", margin: "0 8px", fontFamily: kufiF, fontSize: 84 }}>{text}</span>;
  };
  const sk = Math.max(0, Math.min(1, (t - 3.5) / 0.18)), stampScale = 2.4 - 1.4 * sk;
  const header = (text: string, y: number, at: number) => <Strip x={40} y={y} w={1000} h={84} at={at} text={text} size={40} rot={0} from="none" tape={false} paper="#f4f0e4" hl={1} seed={"pph" + text} />;
  return (
    <AbsoluteFill style={{ background: "#2f261c" }}>
      <PaperBg tex="p_news.png" vignette={0.1} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 40, height: 140, borderTop: `6px solid ${INK}`, borderBottom: `3px double ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
        <span style={{ fontFamily: kufiF, fontSize: 80, color: INK }}>محمد بن شمس الدين</span>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 192, display: "flex", justifyContent: "space-between", direction: "rtl", fontFamily: "Almarai", fontWeight: 800, fontSize: 24, color: INK, borderBottom: `2px solid ${INK}`, paddingBottom: 6 }}>
        <span>الصفحة الأولى</span><span>ردود · دروس · كتب · مدرسة</span><span>mshmsdin.com</span>
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 250, textAlign: "center", direction: "rtl", height: 140 }}>
        <HeadWord text="تابع" i={0} at={0.33} /><HeadWord text="واقرأ" i={1} at={0.5} hl /><HeadWord text="وتعلّم" i={2} at={0.67} />
      </div>
      <Torn x={40} y={420} w={1000} h={580} at={0.9} from="none" rot={-0.6} seed="ppp" amp={3} rim={6} paper="#f1ede0">
        <div style={{ position: "absolute", left: 18, right: 18, top: 18, bottom: 62, overflow: "hidden", background: "#cfc9b8" }}><div style={halftone}>{sheikhPic(POSES.desk, "50% 12%")}</div><div style={dots} /></div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontFamily: "Almarai", fontWeight: 800, fontSize: 28, color: INK, direction: "rtl" }}>محمد بن شمس الدين</div>
      </Torn>
      {header("حمّل واقرأ الكتب", 1040, 1.2)}
      {BOOKS.slice(0, 6).map((b, i) => (
        <Torn key={b} x={45 + i * 165} y={1140} w={148} h={208} at={1.45 + i * 0.12} from="none" rot={[-2, 1.5, -1, 2, -1.5, 1][i]} seed={"ppb" + i} amp={2} rim={5} paper="#f1ede0">
          <div style={halftone}><Pic src={book(b)} /></div>
        </Torn>
      ))}
      {header("تابع القنوات الأخرى", 1380, 2.2)}
      {CHANNELS.map((c, i) => (
        <Torn key={i} x={40 + i * 255} y={1480} w={235} h={236} at={2.45 + i * 0.16} from="none" rot={[-1.5, 1.5, 1, -1][i]} seed={"ppc" + i} amp={2} rim={5} paper="#f1ede0">
          <div style={{ position: "absolute", left: 50, top: 14, width: 135, height: 135, borderRadius: 999, overflow: "hidden" }}><div style={halftone}><Pic src={fa(c.img)} /></div></div>
          <div style={{ position: "absolute", left: 6, right: 6, top: 152, bottom: 8, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: kufiF, fontSize: 24, color: INK, direction: "rtl", lineHeight: 1.15, whiteSpace: "pre-line" }}>{LAB2[c.label] ?? c.label}</div>
        </Torn>
      ))}
      <div style={{ position: "absolute", left: 640, top: 1790, transform: `rotate(-4deg) scale(${stampScale})`, opacity: sk, border: `6px solid ${MAROON}`, borderRadius: 10, padding: "0 24px", color: MAROON, fontFamily: kufiF, fontSize: 56, direction: "rtl", mixBlendMode: "multiply", background: "rgba(244,240,228,.55)" }}>اشترك</div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 28, height: 0, borderTop: `3px double ${INK}` }} />
      <Sfx cues={[[0.33, "stamp", 0.35], [0.5, "stamp", 0.3], [0.67, "stamp", 0.35], [0.9, "slap1", 0.3], [1.2, "flick1", 0.25], [1.5, "rustle3", 0.25], [2.2, "flick2", 0.25], [2.5, "rustle2", 0.25], [3.5, "stamp", 0.5]]} />
    </AbsoluteFill>
  );
};

/** مغلَّفة بـHybridHost للرندر المختلط */
export const FaselWallP: React.FC = () => <HybridHost><WallP /></HybridHost>;
export const FaselNotebookP: React.FC = () => <HybridHost><NotebookP /></HybridHost>;
export const FaselTearP: React.FC = () => <HybridHost><TearP /></HybridHost>;
export const FaselShelfP: React.FC = () => <HybridHost><ShelfP /></HybridHost>;
export const FaselPressP: React.FC = () => <HybridHost><PressP /></HybridHost>;
export const FASEL_P_SIZE = { w: PW, h: PH };
