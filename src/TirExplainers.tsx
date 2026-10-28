import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadQuran } from "@remotion/google-fonts/AmiriQuran";
import { AZ_MAP } from "./azMap";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { cairo } from "./Scenes";
import { lalezar } from "./RefStyle";
import { cut } from "./tirTime";
import { STUDIO, TirVid, TOP } from "./TirVideo";
/** soft drop shadow; none in the graphics-only hybrid pass, a cheap one in the Studio preview */
const sh = (s: string) => (TOP ? "none" : STUDIO ? "0 4px 10px rgba(20,12,4,.4)" : s);

/**
 * Written explainers for the lesson (user rule: every key word / comparison / ordering is WRITTEN, each spot in the form that fits it).
 * Plain (speaker-alone) shots only: the speaker is moved to a card on the right, the written content takes the other half on a designed
 * coloured background. Every item carries `at` = SOURCE second right AFTER the speaker finished saying it (nothing appears before it is spoken).
 */
const { fontFamily: rakkas } = loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });
const { fontFamily: quranFont } = loadQuran("normal", { weights: ["400"], subsets: ["arabic"] });
const fps = 30;
const SPK = { x: 550, y: 0, w: 760, h: 1080 };
const PAD = 24;
const TONE = { ok: "#2e7d5b", bad: "#b5392b", note: "#c98a1b", plain: "#24456e" } as const;
const MARK: Record<Tone, string> = { ok: "✓", bad: "✗", note: "★", plain: "" };

import { Item, Scene, SCENES, Tone } from "./tirData";
export { SCENES };
export type { Item, Scene };
const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='1.6'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/></g></svg>`;

export const useReveal = (atFrame: number, damping = 14) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - atFrame, fps, config: { damping, stiffness: 140 } });
  return f < atFrame ? 0 : p;
};

export const ItemCard: React.FC<{ it: Item; atFrame: number; size: number; num?: number; width?: number }> = ({ it, atFrame, size, num, width }) => {
  const p = useReveal(atFrame);
  const tone = it.tone ?? "plain";
  const col = TONE[tone];
  return (
    <div style={{ opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 140}px) scale(${0.94 + 0.06 * p})`, width, display: "flex", alignItems: "center", gap: 16, background: "#f6ecd3", borderRadius: 22, borderRight: `14px solid ${col}`, boxShadow: "0 10px 26px rgba(30,18,6,.35)", padding: "10px 24px", direction: "rtl" }}>
      {num !== undefined ? <div style={{ minWidth: size * 0.95, height: size * 0.95, borderRadius: "50%", background: col, color: "#fff", fontFamily: lalezar, fontSize: size * 0.7, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{num}</div> : MARK[tone] ? <div style={{ minWidth: size * 0.95, height: size * 0.95, borderRadius: "50%", background: col, color: "#fff", fontFamily: cairo, fontWeight: 900, fontSize: size * 0.62, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{MARK[tone]}</div> : null}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: lalezar, fontSize: size, color: "#3a2414", lineHeight: 1.25 }}>{it.t}</div>
        {it.sub ? <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: size * 0.55, color: "#6b4630" }}>{it.sub}</div> : null}
      </div>
      {it.big ? <div style={{ fontFamily: rakkas, fontSize: size * 1.7, color: col, lineHeight: 1 }}>{it.big}</div> : null}
    </div>
  );
};

const Arrow: React.FC<{ atFrame: number; w?: number; label?: string; up?: boolean }> = ({ atFrame, w = 120, label }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [atFrame, atFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center", opacity: p }}>
      {label ? <div style={{ fontFamily: lalezar, fontSize: 34, color: "#fff4d6" }}>{label}</div> : null}
      <svg width={w} height="34" viewBox={`0 0 ${w} 34`}>
        <line x1={w - 8} y1="17" x2={w - 8 - (w - 30) * p} y2="17" stroke="#f6ecd3" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 11" />
        <path d={`M${w - 8 - (w - 30) * p + 4} 6 L${w - 8 - (w - 30) * p - 12} 17 L${w - 8 - (w - 30) * p + 4} 28`} stroke="#f6ecd3" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Node: React.FC<{ it: Item; atFrame: number; w: number; size?: number }> = ({ it, atFrame, w, size = 46 }) => {
  const p = useReveal(atFrame, 11);
  const col = TONE[it.tone ?? "plain"];
  return (
    <div style={{ width: w, minHeight: 110, opacity: Math.min(1, p * 1.5), transform: `scale(${0.6 + 0.4 * p})`, background: "#f6ecd3", border: `6px solid ${col}`, borderRadius: 26, boxShadow: "0 10px 26px rgba(30,18,6,.4)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10px 14px", fontFamily: lalezar, fontSize: size, color: "#3a2414", lineHeight: 1.2, direction: "rtl" }}>{it.t}</div>
  );
};

/** motion graphic: how we know whether the narrators of an isnad are trustworthy (src 183-207) */
const ChainBody: React.FC<{ s: Scene; rf: (at: number) => number; portrait?: boolean }> = ({ s, rf, portrait }) => {
  const it = (i: number) => s.items[i];
  const f = useCurrentFrame();
  const q = rf(it(1).at);
  const pulse = f >= q ? 1 + 0.07 * Math.sin((f - q) / 4) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: portrait ? 330 : 210, bottom: 0, direction: "rtl", transform: portrait ? "scale(1.04)" : undefined, transformOrigin: "top right" }}>
      {/* row 1: the narrator we want to judge */}
      <div style={{ position: "absolute", right: 30, top: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <Node it={it(0)} atFrame={rf(it(0).at)} w={420} />
        <div style={{ transform: `scale(${pulse})`, opacity: f >= q ? 1 : 0 }}>
          <Node it={it(1)} atFrame={q} w={250} size={52} />
        </div>
        <div style={{ marginRight: 10 }}><Node it={it(2)} atFrame={rf(it(2).at)} w={290} size={40} /></div>
      </div>
      {/* row 2: the chain of OUR isnad up to the critics' sayings */}
      <div style={{ position: "absolute", right: 30, top: 340, display: "flex", alignItems: "center" }}>
        <Node it={it(3)} atFrame={rf(it(3).at)} w={170} size={52} />
        <Arrow atFrame={rf(it(4).at)} w={170} label="إسناد" />
        <Node it={it(5)} atFrame={rf(it(5).at)} w={290} size={50} />
        <Arrow atFrame={rf(it(6).at)} w={90} />
        <Node it={it(6)} atFrame={rf(it(6).at)} w={230} size={50} />
      </div>
      <div style={{ position: "absolute", right: 30, top: 640 }}>
        <Node it={it(7)} atFrame={rf(it(7).at)} w={900} size={52} />
      </div>
    </div>
  );
};

type RF = (at: number) => number;

/** a news page headline (screenshot crop) with an animated yellow highlight, its source line, and the spoken points under it */
const NewsBody: React.FC<{ s: Extract<Scene, { kind: "news" }>; rf: RF; portrait?: boolean }> = ({ s, rf, portrait }) => {
  const f = useCurrentFrame();
  const p = useReveal(rf(s.imgAt), 16);
  const hlF = s.hlAt !== undefined ? rf(s.hlAt) : null;
  const hp = hlF === null ? 0 : interpolate(f, [hlF, hlF + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const n = s.items.length;
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: portrait ? 270 : 230, bottom: 40, display: "flex", flexDirection: "column", gap: 20, direction: "rtl" }}>
      <div style={{ opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 60}px) scale(${0.95 + 0.05 * p})`, background: "#fff", borderRadius: 18, border: "8px solid #f6ecd3", boxShadow: sh("0 14px 34px rgba(20,12,4,.45)"), position: "relative", overflow: "hidden", direction: "ltr" }}>
        <Img src={staticFile(s.img)} style={{ display: "block", width: "100%" }} />
        {s.hl ? <div style={{ position: "absolute", left: `${s.hl[0] * 100}%`, top: `${s.hl[1] * 100}%`, width: `${s.hl[2] * 100}%`, height: `${s.hl[3] * 100}%`, background: "rgba(255,214,10,.5)", mixBlendMode: "multiply", transformOrigin: "left center", transform: `scaleX(${hp})`, borderRadius: 6 }} /> : null}
      </div>
      <div style={{ opacity: Math.min(1, p * 1.5), fontFamily: cairo, fontWeight: 800, fontSize: 28, color: "#fff4d6", textAlign: "center" }}>المصدر: {s.credit}</div>
      {n ? <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", flex: 1 }}>{s.items.map((i, k) => <ItemCard key={k} it={i} atFrame={rf(i.at)} size={n > 3 ? 40 : 46} />)}</div> : null}
    </div>
  );
};

export const VerseCard: React.FC<{ v: { text: string; ref: string; at: number }; atFrame: number }> = ({ v, atFrame }) => {
  const p = useReveal(atFrame, 16);
  return (
    <div style={{ opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 50}px)`, background: "linear-gradient(#f9f0d8,#f1e2bb)", border: "6px solid #c98a1b", borderRadius: 26, padding: "26px 34px 18px", boxShadow: sh("0 12px 30px rgba(20,12,4,.4)"), textAlign: "center" }}>
      <div style={{ fontFamily: quranFont, fontSize: v.text.length > 70 ? 56 : 66, lineHeight: 1.95, color: "#2c1a0c" }}>﴿ {v.text} ﴾</div>
      <div style={{ fontFamily: lalezar, fontSize: 36, color: "#7a4b2a", marginTop: 6 }}>{v.ref}</div>
    </div>
  );
};

/** Quran verse (Uthmani script) or hadith text, each appearing right after the speaker recites it */
const VerseBody: React.FC<{ s: Extract<Scene, { kind: "verse" }>; rf: RF; portrait?: boolean }> = ({ s, rf, portrait }) => (
  <div style={{ position: "absolute", left: 20, right: 20, top: portrait ? 280 : 240, bottom: 50, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, direction: "rtl" }}>
    {s.verses.map((v, k) => <VerseCard key={k} v={v} atFrame={rf(v.at)} />)}
    {s.items.map((i, k) => <ItemCard key={"i" + k} it={i} atFrame={rf(i.at)} size={44} />)}
  </div>
);

/** a person mentioned by the speaker: photo (faces of women always blurred), name, and what he said about them */
const PersonBody: React.FC<{ s: Extract<Scene, { kind: "person" }>; rf: RF; portrait?: boolean }> = ({ s, rf, portrait }) => {
  const p = useReveal(rf(s.imgAt), 16);
  const n = s.items.length;
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: portrait ? 280 : 230, bottom: 50, display: "flex", gap: 30, direction: "rtl", alignItems: "center" }}>
      <div style={{ width: portrait ? 330 : 400, opacity: Math.min(1, p * 1.5), transform: `scale(${0.9 + 0.1 * p})` }}>
        <div style={{ borderRadius: 24, overflow: "hidden", border: "8px solid #f6ecd3", boxShadow: sh("0 14px 34px rgba(20,12,4,.45)") }}>
          <Img src={staticFile(s.img)} style={{ display: "block", width: "100%" }} />
        </div>
        <div style={{ marginTop: 14, background: "#7a4b2a", color: "#fff4d6", borderRadius: 16, textAlign: "center", padding: "6px 10px", border: "3px solid #e8ae2c" }}>
          <div style={{ fontFamily: lalezar, fontSize: 40 }}>{s.name}</div>
          <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 24, color: "#f3dcae" }}>{s.sub}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>{s.items.map((i, k) => <ItemCard key={k} it={i} atFrame={rf(i.at)} size={n > 4 ? 40 : 46} />)}</div>
    </div>
  );
};

/** animated map: Turkey and Azerbaijan light up as the speaker names them, a dotted line and a "!" mark the crisis between them */
const MapBody: React.FC<{ s: Extract<Scene, { kind: "map" }>; rf: RF; portrait?: boolean }> = ({ s, rf, portrait }) => {
  const f = useCurrentFrame();
  const fade = (at: number) => interpolate(f, [rf(at), rf(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tr = fade(s.trAt);
  const az = fade(s.azAt);
  const link = interpolate(f, [rf(s.linkAt), rf(s.linkAt) + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const [ax, ay] = AZ_MAP.pts.ankara;
  const [bx, by] = AZ_MAP.pts.baku;
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - 95;
  const pulse = 1 + 0.12 * Math.sin(f / 4);
  const n = s.items.length;
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: portrait ? 270 : 220, bottom: 40, display: "flex", flexDirection: "column", gap: 16, direction: "rtl" }}>
      <div style={{ borderRadius: 22, overflow: "hidden", border: "7px solid #f6ecd3", background: "#9bc0dc", boxShadow: sh("0 12px 30px rgba(20,12,4,.4)") }}>
        <svg viewBox="180 110 1260 600" style={{ display: "block", width: "100%" }}>
          {Object.entries(AZ_MAP.countries).map(([name, d]) => (
            <path key={name} d={d} fill={name === "Turkey" ? `rgba(201,63,47,${0.25 + 0.75 * tr})` : name === "Azerbaijan" ? `rgba(46,125,91,${0.25 + 0.75 * az})` : "#efe3c8"} stroke="#8a6a3c" strokeWidth={1.6} strokeLinejoin="round" />
          ))}
          <text x={ax - 160} y={ay + 110} fontFamily={lalezar} fontSize={64} fill="#fff" stroke="#6b2a1f" strokeWidth={8} paintOrder="stroke" opacity={tr} textAnchor="middle">تركيا</text>
          <text x={bx + 20} y={by - 28} fontFamily={lalezar} fontSize={64} fill="#fff" stroke="#1d4d3a" strokeWidth={8} paintOrder="stroke" opacity={az} textAnchor="middle">أذربيجان</text>
          <path d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} fill="none" stroke="#e8ae2c" strokeWidth={9} strokeLinecap="round" strokeDasharray="2 20" style={{ opacity: link }} />
          <circle cx={ax} cy={ay} r={13} fill="#c93f2f" stroke="#fff" strokeWidth={4} opacity={tr} />
          <circle cx={bx} cy={by} r={13} fill="#2e7d5b" stroke="#fff" strokeWidth={4} opacity={az} />
          <g opacity={link} transform={`translate(${mx},${my + 70}) scale(${pulse})`}>
            <circle r={44} fill="#e8ae2c" stroke="#fff" strokeWidth={6} />
            <text y={22} fontSize={66} fontFamily={cairo} fontWeight={900} fill="#3a2414" textAnchor="middle">!</text>
          </g>
        </svg>
      </div>
      {n ? <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center", flex: 1 }}>{s.items.map((i, k) => <ItemCard key={k} it={i} atFrame={rf(i.at)} size={n > 3 ? 36 : 42} />)}</div> : null}
    </div>
  );
};

export const ExplainerScene: React.FC<{ scene: Scene; src: string; startFrame: number; durFrames: number; portrait?: boolean; cutFn?: (s: number) => number; spkX?: number; videoBg?: boolean }> = ({ scene, src, startFrame, portrait, cutFn, spkX, videoBg }) => {
  const SPKL = { ...SPK, x: spkX ?? SPK.x }; // source x where the speaker's card crop starts (depends on where he sits in the recording)
  const f = useCurrentFrame();
  const a = 1; // hard cut (no ghosting of two speakers)
  const H = 1080 - PAD * 2;
  const sk = H / SPK.h;
  const spkW = SPK.w * sk;
  const zoneW = portrait ? 1032 : 1920 - spkW - PAD * 3;
  const slide = (1 - a) * 60;
  const rf = (at: number) => Math.max(8, Math.round((cutFn ?? cut)(at) * fps) - startFrame);
  const n = scene.items.length;
  const maxCol = scene.kind === "compare" ? Math.max(scene.items.filter((i) => i.col === 0).length, scene.items.filter((i) => i.col === 1).length) : n;
  const size0 = scene.kind === "compare" ? (maxCol <= 3 ? 54 : 44) : n <= 3 ? 72 : n <= 4 ? 64 : n <= 6 ? 52 : 44;
  const size = portrait ? Math.round(size0 * 1.12) : size0;
  const titleSize = 76;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {/* user's favourite style: the speaker video enlarged behind the writing under a blue veil + stars, and the speaker again in the side card (hybrid renderer draws the video + veil itself) */}
      {TOP || !videoBg ? null : (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <TirVid src={staticFile(src)} startFrom={startFrame} muted style={{ position: "absolute", left: -(SPKL.x + 31) * 1.56, top: 0, width: 1920 * 1.56, height: 1080 * 1.56, maxWidth: "none" }} />
          <AbsoluteFill style={{ background: "linear-gradient(135deg, #24456e, #2f5f94 48%, #6b4630)", opacity: 0.8 }} />
        </AbsoluteFill>
      )}
      {videoBg ? <div style={{ position: "absolute", left: 0, top: 0, width: 1920 - spkW - PAD * 2, height: 1080, backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: STUDIO ? "0px 0px" : `${f * 0.25}px ${f * 0.15}px`, opacity: 0.2 }} /> : null}
      {TOP || videoBg ? null :<AbsoluteFill style={{ background: "linear-gradient(135deg, #24456e, #2f5f94 48%, #6b4630)" }} />}
      {TOP || videoBg ? null :<AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: STUDIO ? "0px 0px" : `${f * 0.25}px ${f * 0.15}px`, opacity: 0.2 }} />}
      {TOP || videoBg ? null :<AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(25,15,8,.32) 100%)" }} />}
      {/* written side */}
      <div style={{ position: "absolute", left: PAD - slide, top: 0, width: zoneW, height: portrait ? 1010 : 1080, direction: "rtl" }}>
        <div style={{ position: "absolute", left: 20, right: 20, top: 58, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: rakkas, fontSize: titleSize, color: "#f6ecd3", paintOrder: "stroke fill", WebkitTextStroke: "12px #4a2f1d", textShadow: "0 8px 22px rgba(0,0,0,.45)", textAlign: "center", lineHeight: 1.15 }}>{scene.title}</div>
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 70 + titleSize * 1.35, height: 8, borderRadius: 4, background: "linear-gradient(90deg,transparent,#e8ae2c,transparent)" }} />
        {scene.kind === "chain" ? (
          <ChainBody s={scene} rf={rf} portrait={portrait} />
        ) : scene.kind === "news" ? (
          <NewsBody s={scene} rf={rf} portrait={portrait} />
        ) : scene.kind === "verse" ? (
          <VerseBody s={scene} rf={rf} portrait={portrait} />
        ) : scene.kind === "person" ? (
          <PersonBody s={scene} rf={rf} portrait={portrait} />
        ) : scene.kind === "map" ? (
          <MapBody s={scene} rf={rf} portrait={portrait} />
        ) : scene.kind === "compare" ? (
          <div style={{ position: "absolute", left: 20, right: 20, top: portrait ? 300 : 230, bottom: 60, display: "flex", alignItems: "stretch", gap: 22, direction: "rtl" }}>
            {[0, 1].map((c) => (
              <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", fontFamily: lalezar, fontSize: 52, color: "#fff4d6", background: c === 0 ? "#7a4b2a" : "#1d3a5d", borderRadius: 20, padding: "4px 10px", border: "4px solid #e8ae2c" }}>{scene.headImgs ? <Img src={staticFile(scene.headImgs[c])} style={{ height: 52, borderRadius: 6, border: "2px solid #fff" }} /> : null}{scene.heads[c]}</div>
                {scene.items.filter((i) => (i.col ?? 0) === c).map((i, k) => <ItemCard key={k} it={i} atFrame={rf(i.at)} size={size} />)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ position: "absolute", left: 20, right: 20, top: 230, bottom: 60, display: "flex", flexDirection: "column", justifyContent: "center", gap: n > 6 ? 12 : 26 }}>
            {scene.items.map((i, k) => <ItemCard key={k} it={i} atFrame={rf(i.at)} size={size} num={scene.kind === "order" ? k + 1 : undefined} />)}
          </div>
        )}
      </div>
      {/* the speaker, moved aside to a card */}
      {portrait ? (
        <div style={{ position: "absolute", left: PAD, top: 1040, width: 1032, height: 830, borderRadius: 30, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: sh("0 18px 48px rgba(20,12,4,.6)") }}>
          <div style={{ position: "relative", width: 1032, height: 830, overflow: "hidden" }}>
            <TirVid src={staticFile(src)} startFrom={startFrame} muted style={{ position: "absolute", left: -SPKL.x * (1032 / SPK.w), top: -6, width: 1920 * (1032 / SPK.w), height: 1080 * (1032 / SPK.w), maxWidth: "none" }} />
          </div>
        </div>
      ) : null}
      <div style={{ display: portrait ? "none" : "block", position: "absolute", right: PAD + slide, top: PAD, width: spkW, height: H, borderRadius: 30, overflow: "hidden", border: "7px solid #f6ecd3", boxShadow: sh("0 18px 48px rgba(20,12,4,.6)") }}>
        <div style={{ position: "relative", width: SPK.w * sk, height: SPK.h * sk, overflow: "hidden" }}>
          <TirVid src={staticFile(src)} startFrom={startFrame} muted style={{ position: "absolute", left: -SPKL.x * sk, top: -SPK.y * sk, width: 1920 * sk, height: 1080 * sk, maxWidth: "none" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
