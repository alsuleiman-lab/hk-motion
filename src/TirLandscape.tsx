import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { cairo } from "./Scenes";
import { lalezar } from "./RefStyle";
import { TitleBar } from "./TitleBar";
import { SFX_LEVELS, WHOOSH_EVERY } from "./sfxConfig";
import splits from "../public/tir_split_segments_v4.json";
import { cut, TIR_CUT_SECONDS } from "./tirTime";
import { DEBUG, TirVid, TIR_SRC, TOP } from "./TirVideo";
import { HY, HybridBg, HybridHost, hyBg } from "./hybrid/Slot";
import { ExplainerScene } from "./TirExplainers";
import { BEHIND, BOOKS, BROLL, NAME_AT, QUOTES, SCENES, SUBSCRIBE_AT, ZOOMS } from "./tirData";
export { BEHIND, BOOKS, BROLL, NAME_AT, QUOTES, SUBSCRIBE_AT, ZOOMS };
import { SplitScene, SplitType } from "./SplitScene";
import { SHORT_FRAMES, SHORT_SEGS } from "./tirShort";

/**
 * Landscape edit of the lesson «شبهات أحمد زايد على أسانيد السنة» (شرح جامع الترمذي - 27).
 * Base = public/tir_cut_v3.mp4 (silences shortened, one restart removed). Windows = public/tirwin/composed_all.mp4 (words BEHIND the body, composed in ffmpeg).
 * Plus: cover (first 3 frames, the user's photo), 3 B-roll boards (2 s each, modified), name bar + subscribe pill at calm moments, very light SFX, TitleBar.
 */
const { fontFamily: rakkas } = loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });
export const TIR_FPS = 30;
export const TIR_SECONDS = TIR_CUT_SECONDS;
export const TIR_FRAMES = Math.ceil(TIR_SECONDS * TIR_FPS);
export const TIR_TITLE = "شبهات أحمد زايد على أسانيد السنة";
export const fps = TIR_FPS;
export const sec = (t: number) => Math.round(t * fps);
const COVER_FRAMES = 3;
export const C = { navy: "#24456e", brown: "#7a4b2a", wood: "#c9a36a", red: "#c93f2f", cream: "#f6ecd3", gold: "#e8ae2c" };

/** 10% face punch-in at the important sentences (user rule: "أحياناً عند الكلام المهم"). Only on shots where the speaker is alone. [from, to] in seconds. */
const ZoomGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  let z = 1;
  for (const [a, b] of ZOOMS) z = Math.max(z, interpolate(t, [a, a + 0.4, b - 0.4, b], [1, 1.1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));
  return <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "48% 34%" }}>{children}</AbsoluteFill>;
};


export const Board: React.FC<{ src: string; dur: number }> = ({ src, dur }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const out = interpolate(f, [dur - 10, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const swing = Math.sin(f / 9) * 1.6 * (1 - out);
  return (
    <div style={{ position: "absolute", left: 60, top: 70, width: 640, height: 360, opacity: Math.min(1, inP * 1.6) * (1 - out), transform: `translateY(${(1 - inP) * -90}px) rotate(${-2 + swing}deg) scale(${0.9 + 0.1 * inP})`, transformOrigin: "top center" }}>
      <div style={{ position: "absolute", left: 90, top: -70, width: 6, height: 80, background: "repeating-linear-gradient(180deg,#bfa56a 0 8px,#7a5a26 8px 14px)" }} />
      <div style={{ position: "absolute", right: 90, top: -70, width: 6, height: 80, background: "repeating-linear-gradient(180deg,#bfa56a 0 8px,#7a5a26 8px 14px)" }} />
      <div style={{ width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", border: "14px solid #7a4b2a", boxShadow: TOP ? "none" : HY ? "0 22px 50px rgba(40,25,10,.55)" /* the inset ring lies under the video (covered by it): not in the graphics layer */ : "0 22px 50px rgba(40,25,10,.55), inset 0 0 0 4px #c9a36a" }}>
        <TirVid src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
};

/** A book the speaker names, shown on a hanging wooden board (cover / manuscript image) right after he says its name. */
export const BookBoard: React.FC<{ src: string; w: number; h: number; caption: string; dur: number }> = ({ src, w, h, caption, dur }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const out = interpolate(f, [dur - 10, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const swing = Math.sin(f / 9) * 1.4 * (1 - out);
  return (
    <div style={{ position: "absolute", left: 60, top: 70, width: w + 28, opacity: Math.min(1, inP * 1.6) * (1 - out), transform: `translateY(${(1 - inP) * -90}px) rotate(${-1.5 + swing}deg) scale(${0.9 + 0.1 * inP})`, transformOrigin: "top center" }}>
      <div style={{ position: "absolute", left: 60, top: -70, width: 6, height: 80, background: "repeating-linear-gradient(180deg,#bfa56a 0 8px,#7a5a26 8px 14px)" }} />
      <div style={{ position: "absolute", right: 60, top: -70, width: 6, height: 80, background: "repeating-linear-gradient(180deg,#bfa56a 0 8px,#7a5a26 8px 14px)" }} />
      <div style={{ borderRadius: 14, overflow: "hidden", border: "14px solid #7a4b2a", background: "#f3e6c8", boxShadow: "0 22px 50px rgba(40,25,10,.55), inset 0 0 0 4px #c9a36a" }}>
        <Img src={staticFile(src)} style={{ display: "block", width: w, height: h, objectFit: "cover" }} />
        <div style={{ background: "#7a4b2a", color: "#fff4d6", fontFamily: lalezar, fontSize: 28, textAlign: "center", padding: "2px 8px", direction: "rtl" }}>{caption}</div>
      </div>
    </div>
  );
};

export const NameBar: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps, config: { damping: 15, stiffness: 140 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: 34, bottom: 24, transform: `translateX(${(1 - p) * -520}px)`, opacity: out, direction: "rtl" }}>
      <div style={{ display: "flex", background: "rgba(10,18,48,.5)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,.35)", borderRadius: 14, overflow: "hidden", boxShadow: "0 6px 16px rgba(0,0,0,.3)" }}>
        <div style={{ width: 8, background: C.gold }} />
        <div style={{ padding: "6px 22px 8px" }}>
          <div style={{ fontFamily: lalezar, fontSize: 40, color: "#fff", lineHeight: 1.15 }}>الشيخ محمد بن شمس الدين</div>
          <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 22, color: "#ffe3a0" }}>قناة محمد بن شمس الدين</div>
        </div>
      </div>
    </div>
  );
};

export const Subscribe: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps, config: { damping: 12, stiffness: 140 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  const bell = Math.sin(f / 3) * 16 * Math.exp(-(f % 45) / 14);
  return (
    <div style={{ position: "absolute", top: 28, right: 34, transform: `scale(${p})`, transformOrigin: "top right", opacity: out, display: "flex", alignItems: "center", gap: 12, background: C.red, color: "#fff", borderRadius: 999, padding: "10px 26px", fontFamily: cairo, fontWeight: 900, fontSize: 32, border: "3px solid #fff", boxShadow: "0 8px 24px rgba(0,0,0,.4)", direction: "rtl" }}>
      <span style={{ display: "inline-block", transform: `rotate(${bell}deg)`, transformOrigin: "top center" }}>🔔</span>
      اشترك في القناة
    </div>
  );
};

/** First 3 frames: the user's photo as the thumbnail, with the title. */
const Cover: React.FC = () => (
  <AbsoluteFill style={{ direction: "rtl", overflow: "hidden" }}>
    <Img src={staticFile("cover/tir_shot.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(36,69,110,0) 52%, rgba(36,69,110,.55) 74%, rgba(60,36,18,.82) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: rakkas, fontSize: 150, lineHeight: 1.1, color: "#f6ecd3", textAlign: "center", paintOrder: "stroke fill", WebkitTextStroke: "14px #4a2f1d", textShadow: "0 12px 30px rgba(0,0,0,.5)" }}>{TIR_TITLE}</div>
    </div>
    <div style={{ position: "absolute", top: 40, right: 50, background: "rgba(10,18,48,.6)", border: "3px solid #fff", borderRadius: 18, padding: "8px 30px", fontFamily: lalezar, fontSize: 52, color: "#fff" }}>شرح جامع الترمذي</div>
  </AbsoluteFill>
);

export const SFX = BEHIND.filter((_, i) => i % WHOOSH_EVERY === 0).map((k) => ({ src: "sfx/whoosh.wav", at: k.t, vol: SFX_LEVELS.whoosh }));

/** everything of the lesson edit except the title bar and the cover (shared by the full lesson and by the 3-minute essence) */
export const TirContent: React.FC<{ names?: boolean }> = ({ names = true }) => (
  <>
    <ZoomGroup>
    <TirVid src={staticFile(TIR_SRC)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    {/* split-screen shots are rebuilt on a designed background (never shown as recorded, never black) */}
    {splits.map((sp, i) => (
      <Sequence key={`sp${i}`} from={sec(sp.from)} durationInFrames={sec(sp.to - sp.from)} layout="none">
        <SplitScene src={TIR_SRC} type={sp.type as SplitType} startFrame={sec(sp.from)} durFrames={sec(sp.to - sp.from)} notes={sp.type === "clip" ? QUOTES.map(([a, tx]) => ({ at: sec(cut(a) - sp.from), t: tx })).filter((n) => n.at >= 0 && n.at < sec(sp.to - sp.from)) : undefined} />
      </Sequence>
    ))}
    {BEHIND.map((k) => (
      <Sequence key={k.i} from={sec(k.t)} durationInFrames={sec(k.len)} layout="none">
        <TirVid src={staticFile("tirwin/composed_all.mp4")} startFrom={sec(k.offset)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
    ))}
    </ZoomGroup>
    {SCENES.map((sc, i) => {
      const from = sec(cut(sc.a));
      const dur = sec(cut(sc.b)) - from;
      return (
        <Sequence key={`ex${i}`} from={from} durationInFrames={dur} layout="none">
          <ExplainerScene scene={sc} src={TIR_SRC} startFrame={from} durFrames={dur} />
        </Sequence>
      );
    })}
    {BROLL.map((b, i) => (
      <Sequence key={i} from={sec(b.t)} durationInFrames={sec(2.0)} layout="none">
        <Board src={b.src} dur={sec(2.0)} />
      </Sequence>
    ))}
    {BOOKS.map((b, i) => (
      <Sequence key={`bk${i}`} from={sec(b.t)} durationInFrames={sec(b.len)} layout="none">
        <BookBoard src={b.src} w={b.w} h={b.h} caption={b.caption} dur={sec(b.len)} />
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

export const TirLandscape: React.FC = () => (
  <HybridHost>
  <AbsoluteFill style={{ background: TOP ? "transparent" : hyBg(C.navy) }}>
    {HY ? <HybridBg><AbsoluteFill style={{ background: C.navy }} /></HybridBg> : null}
    {DEBUG.includes("noshadow") ? <style>{`*{box-shadow:none!important;text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important;backdrop-filter:none!important}`}</style> : null}
    <TirContent />
    <TitleBar title={TIR_TITLE} />
    <Sequence  durationInFrames={COVER_FRAMES} layout="none">
      <Cover />
    </Sequence>
  </AbsoluteFill>
  </HybridHost>
);

/** THE 3-MINUTE ESSENCE: pieces of the edit played back to back; frames inside each piece are the lesson's own frames (nested negative-offset Sequence), so every scene/geometry is unchanged. The timer starts at 0. */
export const TirShort: React.FC = () => (
  <HybridHost>
  <AbsoluteFill style={{ background: TOP ? "transparent" : hyBg(C.navy) }}>
    {HY ? <HybridBg><AbsoluteFill style={{ background: C.navy }} /></HybridBg> : null}
    {SHORT_SEGS.map((g, i) => (
      <Sequence key={i} from={g.s} durationInFrames={g.n} layout="none">
        <Sequence from={-g.a} layout="none">
          <TirContent names={false} />
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
    <Sequence  durationInFrames={COVER_FRAMES} layout="none">
      <Cover />
    </Sequence>
  </AbsoluteFill>
  </HybridHost>
);
