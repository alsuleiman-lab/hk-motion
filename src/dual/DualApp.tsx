import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import "../studioProxy";
import { MontageFromSpec, specFrames } from "../MontageSpec";
import type { MontageSpec } from "../MontageSpec";

/**
 * THE TWO-SCREEN PREVIEW PAGE (user 2026-11-16: «الطولي شاشة والعرضي شاشة داخل الواجهة»). Served by tools/dual_serve.mjs (http://localhost:3101/?spec=<id>) and shown
 * inside the Studio by the «<Id>-Both» composition (src/MontageBoth.tsx, an iframe over the canvas area). Two real players, a portrait screen (1080×1920) and a landscape
 * screen (1920×1080), each at its own size, driven by ONE transport bar: play / pause / seek / space bar move both (the landscape screen is the clock; the portrait one
 * follows and is re-seeked when it drifts more than 2 frames; the sound is the landscape screen's only). Both run the montage's own code (MontageFromSpec reads the
 * orientation from its player's size), so no gallery element changes. The spec file is polled: one edit of data/specs/<id>.json shows in both screens within seconds.
 * A <Player> cannot live in the Studio's own page (the Studio itself calls getInputProps), hence a page of its own.
 */
const PortraitScreen: React.FC<{ spec: MontageSpec }> = ({ spec }) => <MontageFromSpec spec={spec} muted />;
const LandscapeScreen: React.FC<{ spec: MontageSpec }> = ({ spec }) => <MontageFromSpec spec={spec} />;
const fmt = (f: number) => { const s = Math.floor(f / 30); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

const Panel: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  const frames = specFrames(spec);
  const pRef = React.useRef<PlayerRef>(null), lRef = React.useRef<PlayerRef>(null);
  const [frame, setFrame] = React.useState(0), [playing, setPlaying] = React.useState(false);
  const [win, setWin] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => { const f = () => setWin({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const BAR = 56, LAB = 34, PAD = 16, GAP = 24;
  const k = Math.max(0.05, Math.min((win.w - 2 * PAD - GAP) / 3000, (win.h - BAR - LAB - 2 * PAD) / 1920));
  const play = React.useCallback(() => { lRef.current?.play(); pRef.current?.play(); }, []);
  const pause = React.useCallback(() => { lRef.current?.pause(); pRef.current?.pause(); }, []);
  const seek = React.useCallback((f: number) => { const x = Math.max(0, Math.min(frames - 1, Math.round(f))); lRef.current?.seekTo(x); pRef.current?.seekTo(x); setFrame(x); }, [frames]);
  React.useEffect(() => {
    const l = lRef.current, p = pRef.current;
    if (!l || !p) return;
    const onFrame = (e: { detail: { frame: number } }) => { setFrame(e.detail.frame); if (Math.abs(p.getCurrentFrame() - e.detail.frame) > 2) p.seekTo(e.detail.frame); };
    const onPlay = () => { setPlaying(true); if (!p.isPlaying()) p.play(); }, onPause = () => { setPlaying(false); if (p.isPlaying()) p.pause(); };
    l.addEventListener("frameupdate", onFrame); l.addEventListener("play", onPlay); l.addEventListener("pause", onPause); l.addEventListener("ended", onPause);
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" && e.key !== " ") return;
      if (e.key === " ") { e.preventDefault(); l.isPlaying() ? pause() : play(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); seek(l.getCurrentFrame() + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 30 : 1)); }
    };
    window.addEventListener("keydown", key, true);
    return () => { l.removeEventListener("frameupdate", onFrame); l.removeEventListener("play", onPlay); l.removeEventListener("pause", onPause); l.removeEventListener("ended", onPause); window.removeEventListener("keydown", key, true); };
  }, [play, pause, seek]);
  const common = { durationInFrames: frames, fps: 30, controls: false, clickToPlay: false, doubleClickToFullscreen: false, acknowledgeRemotionLicense: true, inputProps: { spec } } as const;
  const shadow = "0 0 0 2px rgba(255,255,255,.25), 0 10px 30px rgba(0,0,0,.55)";
  const btn: React.CSSProperties = { background: "#2b3140", color: "#fff", border: "1px solid #4a5268", borderRadius: 6, padding: "6px 18px", fontFamily: "Noto Kufi Arabic, sans-serif", fontSize: 15, cursor: "pointer" };
  const screens = [
    { label: "عرضي", ref: lRef, comp: LandscapeScreen, w: 1920, h: 1080, muted: false },
    { label: "طولي", ref: pRef, comp: PortraitScreen, w: 1080, h: 1920, muted: true },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0b0d12", display: "flex", flexDirection: "column", direction: "rtl", fontFamily: "Noto Kufi Arabic, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: GAP, padding: PAD }}>
        {screens.map((x) => (
          <div key={x.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "#fff", opacity: 0.8, fontSize: 18, height: LAB - 6 }}>{x.label}</div>
            <div style={{ width: x.w * k, height: x.h * k, position: "relative", overflow: "hidden", background: "#000", boxShadow: shadow, borderRadius: 6, direction: "ltr" }}>   {/* the player lays itself out left-to-right */}
              <Player ref={x.ref} component={x.comp} compositionWidth={x.w} compositionHeight={x.h} style={{ width: x.w * k, height: x.h * k }} initiallyMuted={x.muted} {...common} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: BAR, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", background: "#141822", borderTop: "1px solid #2b3140", direction: "ltr" }}>
        <button style={btn} onClick={() => (playing ? pause() : play())}>{playing ? "إيقاف" : "تشغيل"}</button>
        <input type="range" min={0} max={Math.max(1, frames - 1)} value={frame} onChange={(e) => seek(Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ color: "#fff", fontSize: 15, minWidth: 110, textAlign: "center" }}>{fmt(frame)} / {fmt(frames)}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const id = new URLSearchParams(location.search).get("spec") ?? "";
  const [spec, setSpec] = React.useState<MontageSpec | null>(null), [err, setErr] = React.useState("");
  const last = React.useRef("");
  React.useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch(`/spec/${encodeURIComponent(id)}.json`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const t = await r.text();
        if (live && t !== last.current) { last.current = t; setSpec(JSON.parse(t) as MontageSpec); setErr(""); }
      } catch { if (live && !last.current) setErr(`لا مواصفة باسم «${id}»`); }
    };
    load(); const t = window.setInterval(load, 3000);
    return () => { live = false; window.clearInterval(t); };
  }, [id]);
  if (!spec) return <div style={{ color: "#fff", padding: 40, fontFamily: "Noto Kufi Arabic, sans-serif", direction: "rtl", fontSize: 22 }}>{err || "جارٍ التحميل…"}</div>;
  return <Panel spec={spec} />;
};

createRoot(document.getElementById("root")!).render(<App />);
