import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, getRemotionEnvironment, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GFX_ONLY, useT } from "./MG";
import { SafeVideo } from "./SafeMedia";
import { clamp } from "./PortraitKit";
import { Img } from "remotion";
import { VSlot, HY } from "./hybrid/Slot";

/**
 * GazaFx — video-specific effects ordered by the user INSIDE the recording of «أين الله من فيضانات غزة؟» («مونتاج … انتهى مونتاج»):
 *   bgclip     a clip fills the screen behind him (he is isolated over it: put a `behind` window with the matte on the same span)
 *   hclip      a clip on half the screen with a soft blend into his half (landscape: left half + `shifts`; portrait: lower panel + `psplits`)
 *   wm         a faint watermark text that fades in from 0 to its opacity
 *   zoomblend  a strong transition: a zoom pulse + white flash around `at` (the layers that leave dissolve in the same moment)
 *   horror     the whole video goes dark like a horror film (grey, vignette, flicker) for the opponent's words
 * All times are seconds on the CUT timeline (spec items), the components below live inside <Sequence> so their own frame starts at 0.
 */
const FPS = 30;
const ease = (x: number) => x * x * (3 - 2 * x);

/** clip playback: frame-accurate OffthreadVideo in the final render, SafeVideo in Studio; the fast face check sees an empty box */
export const ClipVideo: React.FC<{ src: string; style: React.CSSProperties; start?: number }> = ({ src, style, start = 0 }) => {
  if (GFX_ONLY) return <div style={style} />;
  const s = staticFile(src);
  return getRemotionEnvironment().isRendering
    ? <OffthreadVideo src={s} muted startFrom={Math.round(start * FPS)} style={style} />
    : <SafeVideo src={s} muted startFrom={Math.round(start * FPS)} style={style} />;
};

/** full-screen clip behind him; it dissolves over `fade` seconds centred on `to` (so the layer under it — his own recording — is revealed by the same dissolve as his cut-out) */
export const BgClip: React.FC<{ src: string; from: number; to: number; fade?: number; start?: number; dim?: number }> = ({ src, from, to, fade = 0.5, start = 0, dim = 0.3 }) => {
  const d = to - from;
  return (
    <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round(d * FPS)}>
      <BgClipInner src={src} d={d} fade={fade} start={start} dim={dim} />
    </Sequence>
  );
};
const BgClipInner: React.FC<{ src: string; d: number; fade: number; start: number; dim: number }> = ({ src, start, dim }) => {
  // no opacity transition (user 2026-11-09: dissolves are forbidden; only gallery transitions): hard edges, the end is covered by the Curtain placed by MontageFromSpec
  return (
    <AbsoluteFill>
      <ClipVideo src={src} start={start} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(6,12,22,${dim * 0.5}) 0%, rgba(6,12,22,${dim + 0.25}) 100%)` }} />
    </AbsoluteFill>
  );
};

/** half-screen clip: landscape = the left 1000 px (soft right edge blending into his half), portrait = the lower panel (soft top edge) */
export const HClip: React.FC<{ src: string; from: number; to: number; start?: number; zoom?: number; fx?: number; fy?: number; label?: string; enter?: boolean; leave?: boolean }> = ({ src, from, to, start = 0, zoom = 1.2, fx = 50, fy = 55, label, enter = true, leave = true }) => (
  <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round((to - from) * FPS) + 1}>
    <HClipInner src={src} d={to - from} start={start} zoom={zoom} fx={fx} fy={fy} label={label} enter={enter} leave={leave} />
  </Sequence>
);
const HClipInner: React.FC<{ src: string; d: number; start: number; zoom: number; fx: number; fy: number; label?: string; enter: boolean; leave: boolean }> = ({ src, d, start, zoom, fx, fy, label, enter, leave }) => {
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  const land = width > height;
  // NO opacity at all (user 2026-11-09): the pane SLIDES in/out with his frame's shift (same 0.4 s / ease as `shifts` / PortPanel); between two clips of one group the swap is hard, hidden by the Curtain
  const k = Math.min(enter ? ease(clamp(t / 0.4)) : 1, leave ? ease(clamp((d - t) / 0.4)) : 1);
  const box: React.CSSProperties = land
    ? { position: "absolute", left: -(1 - k) * 1120, top: 0, width: 1120, height: 1080, WebkitMaskImage: "linear-gradient(to right, #000 0, #000 78%, transparent 100%)", maskImage: "linear-gradient(to right, #000 0, #000 78%, transparent 100%)" }
    : { position: "absolute", left: 0, top: 944 + (1 - k) * 976, width: 1080, height: 976, WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 16%, #000 100%)", maskImage: "linear-gradient(to bottom, transparent 0, #000 16%, #000 100%)" };
  const sc = zoom * (1 + 0.04 * (t / Math.max(1, d)));   // a slow push so the clip never sits dead still
  return (
    <AbsoluteFill>
      <div style={{ ...box, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${sc.toFixed(4)})`, transformOrigin: `${fx}% ${fy}%` }}>
          {HY ? <VSlot src={src} startFrom={Math.round(start * FPS)} w={land ? 1120 : 1080} h={land ? 1080 : 976} /> : <ClipVideo src={src} start={start} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx}% ${fy}%` }} />}
        </div>
      </div>
      {label ? <div style={{ position: "absolute", left: land ? 34 : 40, top: land ? 1010 : 1850, direction: "rtl", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: land ? 27 : 28, color: "#fff", background: "rgba(24,16,8,.82)", padding: "6px 18px", borderRadius: 10 }}>{label}</div> : null}
    </AbsoluteFill>
  );
};

/** a faint watermark text: opacity ramps from 0 to `opacity`, tilted, never over his face (the caller chooses y) */
export const Watermark: React.FC<{ text: string; from: number; to: number; opacity?: number; ramp?: number; x?: number; y: number; size?: number; rot?: number }> = ({ text, from, to, opacity = 0.5, ramp = 1.8, x, y, size = 64, rot = -8 }) => {
  const t = useT(0);
  const { width } = useVideoConfig();
  if (t < from || t > to) return null;
  void ramp;
  const o = opacity;   // constant: no fade in/out (user 2026-11-09: no opacity transitions); it leaves with the background clip under the Curtain
  return (
    <div style={{ position: "absolute", left: x ?? width / 2, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, opacity: o, direction: "rtl", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: size, color: "#fff", whiteSpace: "nowrap", letterSpacing: 2, textShadow: "0 3px 14px rgba(0,0,0,.55)", WebkitTextStroke: "1.5px rgba(10,18,30,.55)", pointerEvents: "none" }}>{text}</div>
  );
};

/** the stage every video layer sits in: zoom pulses (transitions) and the horror grade; with neither it adds nothing */
export const FxStage: React.FC<{ pulses: { at: number; amt?: number }[]; horrors: { from: number; to: number }[]; children: React.ReactNode }> = ({ pulses, horrors, children }) => {
  const t = useT(0);
  const bump = 0;   // no zoom/blur/flash pulses any more (user 2026-11-09: only gallery transitions); `pulses` is ignored
  void pulses;
  const hr = Math.max(0, ...horrors.map((h) => (t >= h.from && t < h.to ? 1 : 0)));   // hard switch, no ramp
  const filter = [hr > 0.01 ? `grayscale(${(hr * 0.85).toFixed(3)}) contrast(${(1 + hr * 0.25).toFixed(3)}) brightness(${(1 - hr * 0.48).toFixed(3)}) sepia(${(hr * 0.25).toFixed(3)}) hue-rotate(${(-hr * 12).toFixed(1)}deg)` : ""].filter(Boolean).join(" ");
  return <AbsoluteFill style={{ transform: bump > 0.0005 ? `scale(${(1 + bump).toFixed(4)})` : undefined, transformOrigin: "50% 38%", filter: filter || undefined }}>{children}</AbsoluteFill>;
};

/** the overlay half of the horror grade (over everything): vignette, a flicker and faint grain lines */
export const HorrorVeil: React.FC<{ windows: { from: number; to: number }[] }> = ({ windows }) => {
  const t = useT(0), f = useCurrentFrame();
  const hr = Math.max(0, ...windows.map((h) => (t >= h.from && t < h.to ? 1 : 0)));   // hard switch, no ramp
  if (hr < 0.01) return null;
  const flick = 0.85 + 0.15 * Math.sin(f * 1.7) * Math.sin(f * 0.53 + 1) + (f % 23 === 0 ? -0.18 : 0);
  return (
    <AbsoluteFill style={{ opacity: hr * flick, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 22%, rgba(0,0,0,.62) 62%, rgba(0,0,0,.92) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(60,0,0,.22), rgba(0,0,0,.18))", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 4px)" }} />
    </AbsoluteFill>
  );
};

/** fades its children out over the last `fade` seconds of the sequence it sits in (the dissolve of the isolated cut-out) */
export const TailFade: React.FC<{ dur: number; fade?: number; children: React.ReactNode }> = ({ dur, fade, children }) => {
  void dur; void fade;   // no dissolve (user 2026-11-09): the cut-out ends hard, the Curtain covers the switch
  return <>{children}</>;
};

/** CRT «screen switching off» (user order inside the recording of «فضل شاكر», 2026-11-10: «طفّي الشاشة مثل شاشة تنطفئ»): two black bars close from top and bottom
 *  until only a bright horizontal line is left, the line shrinks to a dot, then black. Movement only — no opacity ramp. Draw it over everything, from `at` for `dur` seconds, then it stays black. */
export const TvOff: React.FC<{ at: number; dur?: number }> = ({ at, dur = 0.6 }) => {
  const t = useT(at), { width, height } = useVideoConfig();
  if (t < 0) return null;
  const a = clamp(t / (dur * 0.62)), b = clamp((t - dur * 0.62) / (dur * 0.38));
  if (b >= 1) return <AbsoluteFill style={{ background: "#000" }} />;
  const bar = (height / 2 - 3) * (a * a * (3 - 2 * a)), lineW = width * (1 - b * b * (3 - 2 * b)), dot = 6 + 10 * b * (1 - b);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {b < 0.02 ? <>
        <div style={{ position: "absolute", left: 0, top: 0, width, height: bar, background: "#000" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width, height: bar, background: "#000" }} />
      </> : <AbsoluteFill style={{ background: "#000" }} />}
      {a > 0.9 ? <div style={{ position: "absolute", left: (width - lineW) / 2, top: height / 2 - dot / 2, width: lineW, height: dot, background: "#fff", borderRadius: dot, boxShadow: "0 0 26px 10px rgba(190,220,255,.75)" }} /> : null}
    </AbsoluteFill>
  );
};


/** «احمل مثلها» (user order 2026-11-10): a full-screen scene — the crowd (generated, faceless) behind, one bowed figure, and iron weights (the sins) dropping one after another onto his back, stop-motion;
 *  no opacity ramps, no sound of its own. */
export const WeightsOnBack: React.FC<{ at: number; until: number; fig: string; crowd: string; n?: number }> = ({ at, until, fig, crowd, n = 10 }) => {
  const f = useCurrentFrame(), t = Math.floor(f / 2) * 2 / FPS - at;
  if (t < 0 || f / FPS > until) return null;
  const FH = 700, FW = Math.round(FH * 832 / 1216), FL = 1010, FT = 1040 - FH;
  const backX = FL + FW * 0.6, shoulderY = FT + FH * 0.27, SW = 190, SH = 46;
  const times = Array.from({ length: n }, (_, i) => 0.5 + i * 0.3);
  const landed = times.filter((x) => t >= x + 0.28).length;
  return (
    <AbsoluteFill style={{ background: "#1c2a30", overflow: "hidden" }}>
      <Img src={staticFile(crowd)} style={{ position: "absolute", left: -Math.min(t * 38, 600), top: 0, height: 1080, width: "auto", filter: "brightness(.55) saturate(.9)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 62% 55%, rgba(0,0,0,0) 20%, rgba(8,14,18,.55) 80%)" }} />
      <div style={{ position: "absolute", left: FL, top: FT + landed * 3, width: FW, height: FH * (1 - 0.008 * landed), transformOrigin: "50% 100%" }}>
        <Img src={staticFile(fig)} style={{ width: "100%", height: "100%", filter: "drop-shadow(10px 14px 14px rgba(0,0,0,.6))" }} />
      </div>
      {times.map((ts, i) => {
        const p = clamp((t - ts) / 0.28);
        if (p <= 0) return null;
        const targetY = shoulderY + landed * 3 - (i + 1) * (SH - 4) + 6, e = p * p, y = targetY - (1 - e) * 950, x = backX - SW / 2 + (i % 2 ? 7 : -7) + ((i * 13) % 9) - 4;
        return (
          <svg key={i} width={SW} height={SH} viewBox="0 0 190 46" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(4px 6px 5px rgba(0,0,0,.55))" }}>
            <rect x={2} y={2} width={186} height={42} rx={13} fill="#2f353a" stroke="#0e1114" strokeWidth={3} />
            <rect x={10} y={8} width={170} height={7} rx={3.5} fill="#4a525a" />
            <circle cx={95} cy={27} r={9} fill="#161a1d" stroke="#59626b" strokeWidth={2} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};
