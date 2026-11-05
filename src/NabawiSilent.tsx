import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SilentReaction, SilentConfigVO } from "./SilentReaction";
import { TitleBar } from "./TitleBar";
import { Gfx } from "./MG";
import { Man, PC, PaperDefs } from "./PaperPuppets";
import { FONT_QURAN, FONT_TITLE } from "./localFonts";

/** «حديث نبوي جديد عن الوهابية» — silent reaction + a PAPER-MONTAGE outro on a spoken hadith (text checked in Shamela; source name + page, no link). */
type OutroWord = { w: string; at: number };
type NwConfig = SilentConfigVO & { outro: { src: string; durationSec: number; words: OutroWord[]; ref: string } };
type Props = { name: string; config?: NwConfig };

export const calculateNwMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const config: NwConfig = await fetch(staticFile(`silent/${props.name}/config.json`)).then((r) => r.json());
  return { durationInFrames: Math.round((config.durationSec + config.outro.durationSec) * config.fps), fps: config.fps, width: 1080, height: 1920, props: { ...props, config } };
};

/** literal asset paths so tools/lib/cached_bundle.mjs (face check, probes) links them: the config loads them dynamically */
export const NW_ASSETS = ["silent/nabawi-wahhabi/config.json", "silent/nabawi-wahhabi/reaction.mp4", "silent/nabawi-wahhabi/reaction_proxy.mp4", "silent/nabawi-wahhabi/source.mp4", "silent/nabawi-wahhabi/source_proxy.mp4", "silent/nabawi-wahhabi/outro_voice2.mp3", "silent/nabawi-wahhabi/cover_frame.jpg", "cov/nw_sheikh.png", "cov/nw_opp.png", "stock/nw_30087.mp4", "stock/nw_192687.mp4", "stock/nw_130073.mp4", "silent/nabawi-wahhabi/under/book.png", "silent/nabawi-wahhabi/under/circle.png", "collage/book.png"];
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

/** black faceless paper man; the big turban = a leader */
const Sil: React.FC<{ x: number; y: number; s?: number; turban?: string; turbanW?: number; flip?: boolean; armL?: number; armR?: number }> = ({ x, y, s = 1.4, turban = PC.white, turbanW = 62, flip, armL = 15, armR = 15 }) => (
  <Man x={x} y={y} s={s} flip={flip} robe={INK} robe2={INK} hand={INK} turban={turban} turbanW={turbanW} armL={armL} armR={armR} />
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

const Bubble: React.FC = () => (
  <g>
    <path d="M-190,-110 Q-190,-190 -100,-190 L100,-190 Q190,-190 190,-110 Q190,-30 100,-30 L-20,-30 L-90,40 L-70,-30 L-100,-30 Q-190,-30 -190,-110 Z" fill="#f6efe0" stroke={PC.dark} strokeWidth={4} />
    <path d="M-120,-130 L120,-130 M-120,-100 L90,-100 M-120,-70 L60,-70" stroke="#8d8577" strokeWidth={9} strokeLinecap="round" />
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

const Outro: React.FC<{ cfg: NwConfig["outro"]; title: string; clipSec: number; barTheme: NwConfig["barTheme"] }> = ({ cfg, title, clipSec, barTheme }) => {
  FONT_TITLE(); FONT_QURAN();
  const t = useQ();
  return (
    <AbsoluteFill style={{ background: "#2a1d13" }}>
      {/* S1: «قال رسول الله ﷺ» — the book of hadith, the pulpit */}
      <Sheet from={0} to={2.4} bg="#d98f4e">
        <Piece at={0.15} x={540} y={400} from="pop" s={1.0} rot={-3} seed={3}>
          <image href={staticFile("collage/book.png")} x={-260} y={-260} width={520} height={520} />
        </Piece>
        <Piece at={1.14} x={540} y={1180} from="bottom" s={0.75} seed={4}><Minbar /></Piece>
      </Sheet>
      {/* S2: «من كذب علي متعمداً» — a man invents a lie */}
      <Sheet from={2.1} to={4.5} bg="#b7a58a">
        <Piece at={2.7} x={330} y={1150} from="left" seed={5}><Sil x={0} y={0} s={1.6} turban={PC.white} turbanW={50} armL={110} armR={30} /></Piece>
        <Piece at={3.1} x={700} y={480} from="pop" rot={-3} seed={6}><Bubble /></Piece>
        <Piece at={3.24} x={700} y={460} from="pop" seed={7}>
          <path d="M-150,-150 L150,30 M150,-150 L-150,30" stroke="#c8301f" strokeWidth={26} strokeLinecap="round" />
        </Piece>
      </Sheet>
      {/* S3: «فليتبوأ مقعده من النار» — the seat in the fire */}
      <Sheet from={4.2} to={99} bg="#c8553d">
        <Piece at={4.26} x={800} y={1130} from="right" seed={8}><Sil x={0} y={0} s={1.5} turban={PC.white} turbanW={50} armL={20} armR={20} /></Piece>
        <Piece at={5.36} x={330} y={1060} from="left" seed={9}><Throne /></Piece>
        <Piece at={6.22} x={330} y={1190} from="bottom" s={1.9} seed={10}><Fire /></Piece>
      </Sheet>

      {/* the hadith under the stage, word by word */}
      <Gfx>
        <div style={{ position: "absolute", left: 50, right: 50, top: STAGE_TOP + STAGE_H + 28, height: 1920 - (STAGE_TOP + STAGE_H + 28) - 60, borderRadius: 14, background: "#f6efe0", border: `4px solid ${PC.dark}`, boxShadow: "0 12px 26px rgba(20,12,4,.5)", transform: "rotate(-0.8deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 34px" }}>
          <div style={{ position: "absolute", top: -24, right: 40, padding: "4px 22px", background: PC.mustard, border: `3px solid ${PC.dark}`, borderRadius: 6, fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 30, color: PC.dark, transform: "rotate(2deg)" }}>{cfg.ref}</div>
          <div dir="rtl" style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 64, lineHeight: 1.7, textAlign: "center", color: PC.dark }}>
            {cfg.words.map((w, i) => {
              const u = clamp((t - w.at) / 0.18);
              return <span key={i} style={{ display: "inline-block", margin: "0 9px", opacity: u, transform: `translateY(${(1 - u) * 14}px)`, color: u > 0 && u < 1 ? "#b5573a" : PC.dark }}>{w.w}</span>;
            })}
          </div>
        </div>
      </Gfx>
      <Gfx><TitleBar title={title} theme={barTheme} offsetSec={clipSec} hideNotice /></Gfx>
      <Audio src={staticFile(cfg.src)} />
    </AbsoluteFill>
  );
};

export const NabawiSilent: React.FC<Props> = ({ config: c, name }) => {
  if (!c) return null;
  const f = Math.round(c.durationSec * c.fps);
  return (
    <AbsoluteFill style={{ background: "#2a1d13" }}>
      <Sequence from={0} durationInFrames={f}><SilentReaction name={name} orient="portrait" config={c} /></Sequence>
      <Sequence from={f}><Outro cfg={c.outro} title={c.title} clipSec={c.durationSec} barTheme={c.barTheme} /></Sequence>
    </AbsoluteFill>
  );
};
