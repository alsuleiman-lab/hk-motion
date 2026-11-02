import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SilentReaction, SilentConfigVO } from "./SilentReaction";
import { TitleBar } from "./TitleBar";
import { Gfx } from "./MG";
import { Man, PC, PaperDefs } from "./PaperPuppets";
import { cleanQuran } from "./MGExtras";
import { FONT_QURAN, FONT_TITLE, QURAN_FONT } from "./localFonts";

/**
 * «ثقوا في العمامة الأزهرية» — silent reaction (5.2 s clip of Sheikh Yousri Azzam) + a PAPER-MONTAGE outro on a Qur'anic recitation (An-Nisa 49-52, echo style 2).
 * Outro = voice only: flat coloured sheets, faceless black paper silhouettes, stop-motion on twos; every piece enters when its word is said;
 * the verse is written under the stage word by word (text from data/quran via tools/quran_ayah.mjs, KFGQPC Sousi font).
 */
type OutroWord = { aya: number; w: string; at: number };
type AzharConfig = SilentConfigVO & { outro: { src: string; durationSec: number; words: OutroWord[]; refs: Record<string, string> } };
type Props = { name: string; config?: AzharConfig };

export const calculateAzharMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const config: AzharConfig = await fetch(staticFile(`silent/${props.name}/config.json`)).then((r) => r.json());
  return { durationInFrames: Math.round((config.durationSec + config.outro.durationSec) * config.fps), fps: config.fps, width: 1080, height: 1920, props: { ...props, config } };
};

/** literal asset paths so tools/lib/cached_bundle.mjs (face check, probes) links them: the config loads them dynamically */
export const AZHAR_ASSETS = ["silent/azhar-turban/config.json", "silent/azhar-turban/reaction.mp4", "silent/azhar-turban/reaction_proxy.mp4", "silent/azhar-turban/source.mp4", "silent/azhar-turban/source_proxy.mp4", "silent/azhar-turban/outro_voice2.mp3", "silent/azhar-turban/cover_frame.jpg", "cov/az_sheikh.png", "collage/book.png"];
const FPS = 30;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x: number) => { const u = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const INK = "#1c1a18";
const STAGE_TOP = 200, STAGE_H = 1230;

/** stop-motion clock: seconds quantised to every 2nd frame */
const useQ = () => Math.floor(useCurrentFrame() / 2) * 2 / FPS;

/** a paper piece: slides in from an edge with an overshoot at `at`, then breathes by a tiny fixed-seed wobble */
const Piece: React.FC<{ at: number; x: number; y: number; from?: "left" | "right" | "top" | "bottom" | "pop"; rot?: number; s?: number; seed?: number; out?: number; children: React.ReactNode }> = ({ at, x, y, from = "pop", rot = 0, s = 1, seed = 1, out, children }) => {
  const t = useQ();
  if (t < at) return null;
  if (out != null && t > out) return null;
  const u = back((t - at) / 0.5);
  const e = ease((t - at) / 0.5);
  const dx = from === "left" ? -(1 - e) * 900 : from === "right" ? (1 - e) * 900 : 0;
  const dy = from === "top" ? -(1 - e) * 900 : from === "bottom" ? (1 - e) * 900 : 0;
  const sc = from === "pop" ? u : 1;
  const wob = Math.floor(t * 12);
  const jx = (random(`jx${seed}-${wob}`) - 0.5) * 3, jy = (random(`jy${seed}-${wob}`) - 0.5) * 3, jr = (random(`jr${seed}-${wob}`) - 0.5) * 1.2;
  return <g transform={`translate(${x + dx + jx},${y + dy + jy}) rotate(${rot + jr}) scale(${s * sc})`} filter="url(#pe)">{children}</g>;
};

/** a coloured sheet that slides over the previous one (paper slide, no dissolve) */
const Sheet: React.FC<{ from: number; to: number; bg: string; children: React.ReactNode }> = ({ from, to, bg, children }) => {
  const t = useQ();
  if (t < from || t >= to) return null;
  const e = ease((t - from) / 0.28);
  return (
    <div style={{ position: "absolute", left: 0, top: STAGE_TOP, width: 1080, height: STAGE_H, overflow: "hidden", background: bg, transform: `translateX(${(1 - e) * -1080}px)`, boxShadow: "-18px 0 30px rgba(30,19,10,.35)" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, mixBlendMode: "multiply", backgroundImage: "radial-gradient(rgba(70,45,20,.55) 1px, transparent 1.4px)", backgroundSize: "9px 9px" }} />
      <svg viewBox={`0 0 1080 ${STAGE_H}`} width={1080} height={STAGE_H} style={{ position: "absolute", left: 0, top: 0 }}>
        <PaperDefs id="pe" />
        {children}
      </svg>
    </div>
  );
};

const TornTag: React.FC<{ at: number; x: number; y: number; text: string; rot?: number }> = ({ at, x, y, text, rot = -3 }) => (
  <Piece at={at} x={x} y={y} rot={rot} seed={9}>
    <rect x={-150} y={-42} width={300} height={84} rx={6} fill="#f6efe0" stroke={PC.dark} strokeWidth={3} />
    <text x={0} y={16} textAnchor="middle" fontSize={50} fontFamily="Noto Kufi Arabic" fontWeight={800} fill={PC.dark}>{text}</text>
  </Piece>
);

/** black faceless paper man; the big turban = a leader */
const Sil: React.FC<{ x: number; y: number; s?: number; turban?: string; turbanW?: number; flip?: boolean; armL?: number; armR?: number }> = ({ x, y, s = 1.4, turban = PC.white, turbanW = 62, flip, armL = 15, armR = 15 }) => (
  <Man x={x} y={y} s={s} flip={flip} robe={INK} robe2={INK} hand={INK} turban={turban} turbanW={turbanW} armL={armL} armR={armR} />
);

/** Aristotle: black bust with a long beard on a cream column */
const Aristotle: React.FC = () => (
  <g>
    <rect x={-150} y={-30} width={300} height={44} fill="#f1e6cc" stroke={PC.dark} strokeWidth={3} />
    <rect x={-110} y={-250} width={220} height={224} fill="#efe3c8" stroke={PC.dark} strokeWidth={3} />
    {[-70, -35, 0, 35, 70].map((dx) => <line key={dx} x1={dx} y1={-244} x2={dx} y2={-34} stroke="#cdbf9f" strokeWidth={5} />)}
    <rect x={-150} y={-286} width={300} height={40} fill="#f1e6cc" stroke={PC.dark} strokeWidth={3} />
    <path d="M-135,-286 Q-135,-356 -76,-382 L-44,-396 L44,-396 L76,-382 Q135,-356 135,-286 Z" fill={INK} />
    <rect x={-30} y={-448} width={60} height={60} fill={INK} />
    <ellipse cx={0} cy={-508} rx={58} ry={72} fill={INK} />
    <path d="M-52,-520 Q-66,-440 -32,-408 Q0,-388 32,-408 Q66,-440 52,-520 Q0,-468 -52,-520 Z" fill={INK} />
    <path d="M-30,-440 Q0,-420 30,-440 M-24,-418 Q0,-402 24,-418" fill="none" stroke="#6a655e" strokeWidth={4} />
    <path d="M-58,-540 Q0,-600 58,-540" fill="none" stroke="#6a655e" strokeWidth={5} />
  </g>
);

/** a ruler's throne: tall carved back, arms, cushion */
const Throne: React.FC = () => (
  <g>
    <path d="M-120,-20 L-120,-250 L-150,-470 L-108,-440 L-70,-540 L-32,-450 L0,-580 L32,-450 L70,-540 L108,-440 L150,-470 L120,-250 L120,-20 Z" fill="#3a2414" stroke={INK} strokeWidth={4} />
    <path d="M-92,-60 L-92,-260 L-120,-440 L-80,-410 L-60,-480 L0,-540 L60,-480 L80,-410 L120,-440 L92,-260 L92,-60 Z" fill="#b5573a" />
    <circle cx={0} cy={-400} r={34} fill={PC.mustard} stroke={INK} strokeWidth={3} />
    <rect x={-170} y={-190} width={60} height={170} rx={14} fill="#3a2414" stroke={INK} strokeWidth={4} />
    <rect x={110} y={-190} width={60} height={170} rx={14} fill="#3a2414" stroke={INK} strokeWidth={4} />
    <rect x={-120} y={-150} width={240} height={70} rx={14} fill={PC.mustard} stroke={INK} strokeWidth={4} />
    <rect x={-110} y={-20} width={36} height={60} fill="#3a2414" />
    <rect x={74} y={-20} width={36} height={60} fill="#3a2414" />
  </g>
);

const Cross: React.FC = () => (
  <g>
    <rect x={-42} y={-470} width={84} height={500} fill={INK} stroke="#f6efe0" strokeWidth={7} />
    <rect x={-170} y={-350} width={340} height={84} fill={INK} stroke="#f6efe0" strokeWidth={7} />
    <rect x={-35} y={-463} width={70} height={486} fill={INK} />
  </g>
);

const Bubble: React.FC = () => (
  <g>
    <path d="M-190,-110 Q-190,-190 -100,-190 L100,-190 Q190,-190 190,-110 Q190,-30 100,-30 L-20,-30 L-90,40 L-70,-30 L-100,-30 Q-190,-30 -190,-110 Z" fill="#f6efe0" stroke={PC.dark} strokeWidth={4} />
    <path d="M-120,-130 L120,-130 M-120,-100 L90,-100 M-120,-70 L60,-70" stroke="#8d8577" strokeWidth={9} strokeLinecap="round" />
  </g>
);

const Weight: React.FC = () => (
  <g>
    <path d="M-110,60 L-70,-70 L70,-70 L110,60 Z" fill={INK} />
    <path d="M-40,-70 Q-40,-120 0,-120 Q40,-120 40,-70" fill="none" stroke={INK} strokeWidth={14} />
  </g>
);

/** an Azhari scholar: red tarboosh wrapped in a white turban, dark robe, faceless */
const Azhari: React.FC<{ x: number; y: number; s?: number; armL?: number; armR?: number; flip?: boolean }> = ({ x, y, s = 1.4, armL = 15, armR = 15, flip }) => (
  <g>
    <Man x={x} y={y} s={s} flip={flip} robe={INK} robe2={INK} hand={INK} turban={PC.white} turbanW={50} armL={armL} armR={armR} />
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      <path d="M-36,-338 L-31,-420 Q0,-434 31,-420 L36,-338 Z" fill="#b5261e" stroke={PC.dark} strokeWidth={3} />
      <ellipse cx={0} cy={-340} rx={56} ry={22} fill={PC.white} stroke={PC.dark} strokeWidth={3.5} />
      <path d="M-50,-340 Q0,-326 50,-340" fill="none" stroke={PC.dark} strokeWidth={3} opacity={0.55} />
    </g>
  </g>
);

/** a salafi shaykh: white thobe, white ghutra with a black agal, full beard, a small book in the hand — faceless */
const Salafi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1.55 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-70,-236 Q0,-262 70,-236 L104,-6 Q0,10 -104,-6 Z" fill="#f6efe0" stroke="#cdbf9f" strokeWidth={4} />
    <path d="M0,-246 L0,-170" stroke="#cdbf9f" strokeWidth={5} />
    {[-196, -168, -140].map((yy) => <circle key={yy} cx={0} cy={yy} r={4} fill="#cdbf9f" />)}
    <g transform="translate(-66,-232) rotate(14)"><rect x={-14} y={0} width={28} height={120} rx={12} fill="#f6efe0" stroke="#cdbf9f" strokeWidth={3} /><circle cx={0} cy={124} r={16} fill={INK} /></g>
    <g transform="translate(66,-232) rotate(-62)"><rect x={-14} y={0} width={28} height={108} rx={12} fill="#f6efe0" stroke="#cdbf9f" strokeWidth={3} /><circle cx={0} cy={112} r={16} fill={INK} /></g>
    <g transform="translate(150,-262) rotate(-12)"><rect x={-26} y={-34} width={52} height={68} rx={4} fill="#3a2414" stroke={INK} strokeWidth={3} /><rect x={-20} y={-28} width={8} height={56} fill={PC.mustard} /></g>
    <rect x={-17} y={-262} width={34} height={30} fill={INK} />
    <circle cx={0} cy={-290} r={38} fill={INK} />
    <path d="M-38,-286 Q-46,-224 -22,-200 Q0,-184 22,-200 Q46,-224 38,-286 Q0,-246 -38,-286 Z" fill="#3b2a1c" />
    <path d="M-62,-300 Q0,-366 62,-300 L88,-236 Q60,-250 38,-262 L-38,-262 Q-60,-250 -88,-236 Z" fill="#f6efe0" stroke="#cdbf9f" strokeWidth={3.5} />
    <path d="M-30,-330 Q0,-312 30,-330 M-40,-300 Q0,-282 40,-300" fill="none" stroke="#cdbf9f" strokeWidth={4} />
    <ellipse cx={0} cy={-338} rx={46} ry={10} fill="none" stroke={INK} strokeWidth={10} />
    <rect x={-48} y={-12} width={30} height={40} fill={INK} />
    <rect x={18} y={-12} width={30} height={40} fill={INK} />
  </g>
);

/** a pulpit (minbar): carved back, steps, a dome */
const Minbar: React.FC = () => (
  <g>
    <path d="M-120,-330 L-120,-560 Q0,-690 120,-560 L120,-330 Z" fill="#7a5233" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-640} r={22} fill={PC.mustard} stroke={INK} strokeWidth={3} />
    <path d="M-150,-330 L150,-330 L150,-300 L-150,-300 Z" fill="#9a6b3f" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-150 + i * 18} y={-300 + i * 60} width={300 - i * 18} height={60} fill={i % 2 ? "#8a5a2e" : "#9a6b3f"} stroke={INK} strokeWidth={3} />)}
    <path d="M-150,-300 L-150,-420 M150,-300 L150,-420" stroke={INK} strokeWidth={8} />
  </g>
);

/** the balance: `dropAt` lets a weight fall on the left pan, then the beam tips (tilt in degrees, left side down) */
const Scale: React.FC<{ dropAt?: number; tilt?: number }> = ({ dropAt, tilt = 14 }) => {
  const t = useQ();
  const k = dropAt == null ? 0 : ease((t - dropAt - 0.3) / 0.55);
  const th = -tilt * k;
  const fall = dropAt == null ? 0 : 1 - ease((t - dropAt) / 0.32);
  const pan = (sx: number, weighted: boolean) => (
    <g transform={`translate(${sx * 190},0) rotate(${-th})`}>
      <path d={`M0,0 L-70,150 M0,0 L70,150`} stroke={INK} strokeWidth={4} />
      <path d="M-90,150 Q0,205 90,150 Z" fill={PC.mustard} stroke={INK} strokeWidth={4} />
      {weighted && dropAt != null && t >= dropAt ? <g transform={`translate(0,${-fall * 520 + 90}) scale(0.62)`}><Weight /></g> : null}
    </g>
  );
  return (
    <g>
      <path d="M-110,0 L110,0 L70,-40 L-70,-40 Z" fill="#7a5233" stroke={INK} strokeWidth={4} />
      <rect x={-12} y={-420} width={24} height={384} fill="#7a5233" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-430} r={22} fill={PC.mustard} stroke={INK} strokeWidth={3} />
      <g transform={`translate(0,-420) rotate(${th})`}>
        <rect x={-190} y={-9} width={380} height={18} rx={8} fill={INK} />
        {pan(-1, true)}
        {pan(1, false)}
      </g>
    </g>
  );
};

/** paper flames, flickering on twos */
const Fire: React.FC = () => {
  const t = useQ();
  const f = (a: number, ph: number) => 1 + a * Math.sin(t * 13 + ph);
  const flame = "M-90,0 Q-120,-120 -44,-210 Q-62,-120 -10,-176 Q-10,-270 32,-330 Q44,-226 92,-166 Q124,-84 90,0 Z";
  return (
    <g>
      <g transform={`scale(1,${f(0.06, 0)})`}><path d={flame} fill="#c8301f" stroke={INK} strokeWidth={4} /></g>
      <g transform={`scale(0.72,${0.72 * f(0.08, 1.7)})`}><path d={flame} fill="#f08a24" /></g>
      <g transform={`scale(0.44,${0.44 * f(0.1, 3.1)})`}><path d={flame} fill="#f7d247" /></g>
    </g>
  );
};

const Road: React.FC = () => (
  <g>
    <path d="M-260,0 L-60,-380 L60,-380 L260,0 Z" fill="#7a5233" stroke={INK} strokeWidth={3} />
    {[-40, -150, -250, -330].map((y, i) => <rect key={y} x={-8 + i * 1} y={y} width={16 - i * 2} height={50 - i * 7} fill="#f6efe0" />)}
  </g>
);

const Outro: React.FC<{ cfg: AzharConfig["outro"]; title: string; clipSec: number; barTheme: AzharConfig["barTheme"] }> = ({ cfg, title, clipSec, barTheme }) => {
  FONT_TITLE(); FONT_QURAN();
  const t = useQ();
  const W = cfg.words;
  // current aya = the aya of the last word whose onset has passed
  let cur = W[0].aya;
  for (const w of W) if (t >= w.at) cur = w.aya;
  const ayaWords = W.filter((w) => w.aya === cur);
  const aya_chars = ayaWords.reduce((n, w) => n + cleanQuran(w.w).length + 1, 0);
  const aya_fs = aya_chars > 110 ? 60 : aya_chars > 80 ? 70 : 80;
  return (
    <AbsoluteFill style={{ background: "#2a1d13" }}>
      {/* S1: they praise themselves / God purifies whom He wills / not wronged by a thread */}
      <Sheet from={0} to={9.86} bg="#d98f4e">
        <Piece at={1.92} x={280} y={1130} from="left" seed={3}><Azhari x={0} y={0} s={1.6} armL={150} armR={20} /></Piece>
        <Piece at={3.82} x={800} y={520} from="right" s={0.95} rot={4} seed={4}>
          <image href={staticFile("collage/book.png")} x={-260} y={-260} width={520} height={520} />
        </Piece>
        <Piece at={7.16} x={800} y={1150} from="bottom" s={1.0} seed={5}><Scale /></Piece>
      </Sheet>
      {/* S2: they invent lies against God (from the pulpit) */}
      <Sheet from={9.56} to={16.88} bg="#b7a58a">
        <Piece at={10.72} x={300} y={1180} from="left" s={1.15} seed={6}>
          <Minbar />
          <Azhari x={0} y={-330} s={1.0} armL={110} armR={30} />
        </Piece>
        <Piece at={11.9} x={430} y={380} from="pop" s={1.0} rot={-3} seed={7}><Bubble /></Piece>
        <Piece at={12.16} x={430} y={360} from="pop" s={1.0} seed={8}>
          <path d="M-150,-150 L150,30 M150,-150 L-150,30" stroke="#c8301f" strokeWidth={26} strokeLinecap="round" />
        </Piece>
        <Piece at={13.4} x={800} y={1180} from="bottom" s={1.0} seed={9}><Scale dropAt={13.7} /></Piece>
      </Sheet>
      {/* S3: those given a portion of the Book */}
      <Sheet from={16.58} to={20.71} bg="#e0b04a">
        <Piece at={17.31} x={300} y={1150} from="left" seed={10}><Sil x={0} y={0} s={1.5} turban={PC.sand} turbanW={64} armL={40} armR={40} /></Piece>
        <Piece at={19.69} x={730} y={820} from="right" seed={11} rot={4}>
          <image href={staticFile("collage/book.png")} x={-260} y={-260} width={520} height={520} />
        </Piece>
      </Sheet>
      {/* S4: Jibt and Taghut, the disbelievers */}
      <Sheet from={20.41} to={29.19} bg="#c8553d">
        <Piece at={20.41} x={620} y={1080} from="bottom" seed={12}><Sil x={0} y={0} s={1.1} turban={PC.sand} turbanW={52} armL={30} armR={30} /></Piece>
        <Piece at={21.17} x={880} y={950} from="right" s={1.0} seed={13}><Aristotle /></Piece>
        <TornTag at={21.9} x={880} y={1010} text="أرسطو" rot={-4} />
        <Piece at={22.36} x={290} y={990} from="left" s={1.0} seed={14}><Throne /></Piece>
        <Piece at={24.61} x={600} y={590} from="top" s={0.8} rot={-5} seed={15}><Cross /></Piece>
      </Sheet>
      {/* S5: those who believed — a salafi shaykh */}
      <Sheet from={28.89} to={31.1} bg="#d98f4e">
        <Piece at={29.0} x={540} y={1180} from="bottom" seed={16}><Road /></Piece>
        <Piece at={28.89} x={500} y={1050} from="pop" seed={17}><Salafi x={0} y={0} s={1.7} /></Piece>
      </Sheet>
      {/* S6: cursed by God — fire, and no helper */}
      <Sheet from={30.8} to={99} bg="#b7a58a">
        <Piece at={32.59} x={560} y={1190} from="bottom" s={1.9} seed={19}><Fire /></Piece>
        <Piece at={33.19} x={250} y={1130} from="left" seed={20}><Sil x={0} y={0} s={1.7} turban={PC.sand} turbanW={64} armL={10} armR={10} /></Piece>
        <Piece at={36.31} x={900} y={1130} from="pop" s={0.9} seed={21}>
          <g opacity={0.5} strokeDasharray="14 12" fill="none" stroke={INK} strokeWidth={6}>
            <path d="M-100,0 L-62,-380 Q0,-420 62,-380 L100,0 Z" />
            <circle cx={0} cy={-470} r={50} />
          </g>
        </Piece>
      </Sheet>

      {/* the verse under the stage, word by word */}
      <Gfx>
        <div style={{ position: "absolute", left: 50, right: 50, top: STAGE_TOP + STAGE_H + 28, height: 1920 - (STAGE_TOP + STAGE_H + 28) - 60, borderRadius: 14, background: "#f6efe0", border: `4px solid ${PC.dark}`, boxShadow: "0 12px 26px rgba(20,12,4,.5)", transform: "rotate(-0.8deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 34px" }}>
          <div style={{ position: "absolute", top: -24, right: 40, padding: "4px 22px", background: PC.mustard, border: `3px solid ${PC.dark}`, borderRadius: 6, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 30, color: PC.dark, transform: "rotate(2deg)" }}>{cfg.refs[String(cur)]}</div>
          <div dir="rtl" style={{ fontFamily: QURAN_FONT, fontSize: aya_fs, lineHeight: 1.75, textAlign: "center", color: PC.dark }}>
            {ayaWords.map((w, i) => {
              const u = clamp((t - w.at) / 0.18);
              return <span key={i} style={{ display: "inline-block", margin: "0 8px", opacity: u, transform: `translateY(${(1 - u) * 14}px)`, color: u > 0 && u < 1 ? "#b5573a" : PC.dark }}>{cleanQuran(w.w)}</span>;
            })}
          </div>
        </div>
      </Gfx>
      <Gfx><TitleBar title={title} theme={barTheme} offsetSec={clipSec} /></Gfx>
      <Audio src={staticFile(cfg.src)} />
    </AbsoluteFill>
  );
};

export const AzharSilent: React.FC<Props> = ({ config: c, name }) => {
  if (!c) return null;
  const f = Math.round(c.durationSec * c.fps);
  return (
    <AbsoluteFill style={{ background: "#2a1d13" }}>
      <Sequence from={0} durationInFrames={f}><SilentReaction name={name} orient="portrait" config={c} /></Sequence>
      <Sequence from={f}><Outro cfg={c.outro} title={c.title} clipSec={c.durationSec} barTheme={c.barTheme} /></Sequence>
    </AbsoluteFill>
  );
};
