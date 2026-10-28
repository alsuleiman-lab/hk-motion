import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { lalezar } from "./RefStyle";
import { TitleBar } from "./TitleBar";
import { cut } from "./tirTime";
import { TirVid, TIR_SRC, TOP } from "./TirVideo";
import { ExplainerScene, SCENES } from "./TirExplainers";
import { CROP, NoteCard, SPK, SplitNote, SplitType, STAR, SWITCH_AT, VARIANTS } from "./SplitScene";
import splits from "../public/tir_split_segments_v4.json";
import { SHORT_FRAMES, SHORT_SEGS } from "./tirShort";
import { BEHIND, BOOKS, BROLL, Board, BookBoard, NAME_AT, NameBar, QUOTES, SFX, SUBSCRIBE_AT, Subscribe, TIR_FRAMES, TIR_TITLE, ZOOMS, fps, sec } from "./TirLandscape";

/**
 * Portrait (1080x1920) edit of the lesson — the SAME edit as the landscape one (user: "نفس العرضي بالضبط لكن طولي").
 * Same cut (tir_cut_v3), same timeline, same scenes (explainers, split shots with the opponent's quotes, B-roll/book boards, name/subscribe, cover).
 * Plain shots = speaker full-bleed (9:16 crop around his head); nothing but the speaker above y~1230; boards/pills below or at the edges.
 */
const { fontFamily: rakkas } = loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });
const K = 1920 / 1080; // full-bleed scale (source height -> 1920)
const HEADX = 925; // speaker's head centre in the source (x) on plain shots
export { TIR_FRAMES };

const PortraitZoom: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  let z = 1;
  for (const [a, b] of ZOOMS) z = Math.max(z, interpolate(t, [a, a + 0.4, b - 0.4, b], [1, 1.1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));
  return <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 28%" }}>{children}</AbsoluteFill>;
};

const Cropped: React.FC<{ src: string; crop: { x: number; y: number; w: number; h: number }; scale: number; from: number; w: number; h: number }> = ({ src, crop, scale, from, w, h }) => (
  <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
    <TirVid src={staticFile(src)} startFrom={from} muted style={{ position: "absolute", left: -crop.x * scale, top: -crop.y * scale, width: 1920 * scale, height: 1080 * scale, maxWidth: "none" }} />
  </div>
);

const PortraitSplit: React.FC<{ src: string; type: SplitType; startFrame: number; durFrames: number; notes?: SplitNote[] }> = ({ src, type, startFrame, durFrames, notes }) => {
  const f = useCurrentFrame();
  const hasNotes = !!(notes && notes.length);
  const c = CROP[type];
  const y0 = hasNotes ? 204 : 60;
  const areaH = type === "clip" ? 640 : 900;
  const pk = Math.min(1032 / c.w, areaH / c.h);
  const pW = c.w * pk;
  const pH = c.h * pk;
  const sw = SWITCH_AT(durFrames);
  let k = 0;
  while (k + 1 < sw.length && f >= sw[k + 1]) k++;
  const seed = Math.round(startFrame / 30) % VARIANTS.length;
  const cur = VARIANTS[(seed + k) % VARIANTS.length];
  const prev = VARIANTS[(seed + k + VARIANTS.length - 1) % VARIANTS.length];
  const m = k === 0 ? 1 : spring({ frame: f - sw[k], fps: 30, config: { damping: 14, stiffness: 90 } });
  const vs = Math.min(1, prev.s + (cur.s - prev.s) * m);
  const vr = (prev.r + (cur.r - prev.r) * m) * 0.8;
  const cardTop = y0 + areaH + 24;
  const cardH = 1880 - cardTop;
  const sk = 1032 / SPK.w;
  return (
    <AbsoluteFill>
      {TOP ? null : <AbsoluteFill style={{ background: "linear-gradient(160deg, #24456e, #2f5f94 48%, #6b4630)" }} />}
      {TOP ? null : <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.25}px ${f * 0.15}px`, opacity: 0.2 }} />}
      {hasNotes ? <NoteCard notes={notes as SplitNote[]} w={1032} /> : null}
      <div style={{ position: "absolute", left: 24 + (1032 - pW) / 2, top: y0 + (areaH - pH) / 2, transform: `rotate(${vr}deg) scale(${vs})`, borderRadius: 26, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: TOP ? "none" : "0 18px 48px rgba(20,12,4,.6)", background: TOP ? "transparent" : "#fff" }}>
        <Cropped src={src} crop={c} scale={pk} from={startFrame} w={pW} h={pH} />
      </div>
      <div style={{ position: "absolute", left: 24, top: cardTop, width: 1032, height: cardH, borderRadius: 30, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: TOP ? "none" : "0 18px 48px rgba(20,12,4,.6)" }}>
        <Cropped src={src} crop={SPK} scale={sk} from={startFrame} w={1032} h={cardH} />
      </div>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => (
  <AbsoluteFill style={{ direction: "rtl", overflow: "hidden" }}>
    <Img src={staticFile("cover/tir_shot.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "48% 50%" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(36,69,110,0) 50%, rgba(36,69,110,.6) 70%, rgba(60,36,18,.85) 100%)" }} />
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 150, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: rakkas, fontSize: 130, lineHeight: 1.12, color: "#f6ecd3", textAlign: "center", paintOrder: "stroke fill", WebkitTextStroke: "14px #4a2f1d", textShadow: "0 12px 30px rgba(0,0,0,.5)" }}>{TIR_TITLE}</div>
    </div>
    <div style={{ position: "absolute", top: 60, right: 50, background: "rgba(10,18,48,.6)", border: "3px solid #fff", borderRadius: 18, padding: "8px 30px", fontFamily: lalezar, fontSize: 52, color: "#fff" }}>شرح جامع الترمذي</div>
  </AbsoluteFill>
);

/** wrap a landscape board (hangs at left 60 / top 70) so it sits at (L, T) scaled by s */
const Placed: React.FC<{ L: number; T: number; s: number; children: React.ReactNode }> = ({ L, T, s, children }) => (
  <div style={{ position: "absolute", left: L - 60 * s, top: T - 70 * s, transform: `scale(${s})`, transformOrigin: "top left", width: 1920, height: 1080 }}>{children}</div>
);

export const TirPortraitContent: React.FC<{ names?: boolean }> = ({ names = true }) => (
  <>
    <PortraitZoom>
      <TirVid src={staticFile(TIR_SRC)} style={{ position: "absolute", left: -(HEADX * K - 540), top: 0, width: 1920 * K, height: 1920, maxWidth: "none" }} />
      {BEHIND.map((k) => (
        <Sequence key={k.i} from={sec(k.t)} durationInFrames={sec(k.len)} layout="none">
          <TirVid src={staticFile("tirwin/composed_all_p.mp4")} startFrom={sec(k.offset)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      ))}
    </PortraitZoom>
    {splits.map((sp, i) => (
      <Sequence key={`sp${i}`} from={sec(sp.from)} durationInFrames={sec(sp.to - sp.from)} layout="none">
        <PortraitSplit src={TIR_SRC} type={sp.type as SplitType} startFrame={sec(sp.from)} durFrames={sec(sp.to - sp.from)} notes={sp.type === "clip" ? QUOTES.map(([a, tx]) => ({ at: sec(cut(a) - sp.from), t: tx })).filter((n) => n.at >= 0 && n.at < sec(sp.to - sp.from)) : undefined} />
      </Sequence>
    ))}
    {SCENES.map((sc, i) => {
      const from = sec(cut(sc.a));
      const dur = sec(cut(sc.b)) - from;
      return (
        <Sequence key={`ex${i}`} from={from} durationInFrames={dur} layout="none">
          <ExplainerScene scene={sc} src={TIR_SRC} startFrame={from} durFrames={dur} portrait />
        </Sequence>
      );
    })}
    {BROLL.map((b, i) => (
      <Sequence key={i} from={sec(b.t)} durationInFrames={sec(2.0)} layout="none">
        <Placed L={90} T={1290} s={1.3}>
          <Board src={b.src} dur={sec(2.0)} />
        </Placed>
      </Sequence>
    ))}
    {BOOKS.map((b, i) => (
      <Sequence key={`bk${i}`} from={sec(b.t)} durationInFrames={sec(b.len)} layout="none">
        <Placed L={90} T={1250} s={1.3}>
          <BookBoard src={b.src} w={b.w} h={b.h} caption={b.caption} dur={sec(b.len)} />
        </Placed>
      </Sequence>
    ))}
    {names ? NAME_AT.map((t, i) => (
      <Sequence key={`n${i}`} from={sec(t)} durationInFrames={sec(6)} layout="none">
        <NameBar dur={sec(6)} />
      </Sequence>
    )) : null}
    {names ? SUBSCRIBE_AT.map((t, i) => (
      <Sequence key={`s${i}`} from={sec(t)} durationInFrames={sec(6)} layout="none">
        <Subscribe dur={sec(6)} />
      </Sequence>
    )) : null}
    {SFX.map((x, i) => (
      <Sequence key={`x${i}`} from={sec(x.at)} durationInFrames={fps * 2} layout="none">
        <Audio src={staticFile(x.src)} volume={x.vol} />
      </Sequence>
    ))}
  </>
);

export const TirPortrait: React.FC = () => (
<AbsoluteFill style={{ background: TOP ? "transparent" : "#24456e" }}>
    <TirPortraitContent />
    <TitleBar title={TIR_TITLE} />
    <Sequence  durationInFrames={3} layout="none">
      <Cover />
    </Sequence>
  </AbsoluteFill>
);

/** the 3-minute essence in portrait (see TirShort in TirLandscape.tsx) */
export const TirShortPortrait: React.FC = () => (
<AbsoluteFill style={{ background: TOP ? "transparent" : "#24456e" }}>
    {SHORT_SEGS.map((g, i) => (
      <Sequence key={i} from={g.s} durationInFrames={g.n} layout="none">
        <Sequence from={-g.a} layout="none">
          <TirPortraitContent names={false} />
        </Sequence>
      </Sequence>
    ))}
    <Sequence from={SHORT_FRAMES - sec(6.7)} durationInFrames={sec(6)} layout="none">
      <NameBar dur={sec(6)} />
    </Sequence>
    <Sequence from={SHORT_FRAMES - sec(5.8)} durationInFrames={sec(5.5)} layout="none">
      <Subscribe dur={sec(5.5)} />
    </Sequence>
    <TitleBar title={TIR_TITLE} />
    <Sequence  durationInFrames={3} layout="none">
      <Cover />
    </Sequence>
  </AbsoluteFill>
);
