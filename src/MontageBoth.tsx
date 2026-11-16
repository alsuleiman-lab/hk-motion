import React from "react";
// @ts-expect-error react-dom ships no types in this project (no @types/react-dom); only createPortal is used
import { createPortal } from "react-dom";
import { AbsoluteFill, getRemotionEnvironment } from "remotion";
import type { MontageSpec } from "./MontageSpec";

/**
 * PREVIEW ONLY: the «<Id>-Both» composition shows the SAME spec on TWO SEPARATE SCREENS, a portrait screen and a landscape screen, inside the Studio window
 * (user 2026-11-16: «الطولي شاشة والعرضي شاشة داخل الواجهة»; the first version drew both on one canvas: refused). The two real players live in their own page
 * (src/dual/DualApp.tsx, served by tools/dual_serve.mjs on port 3101) because a <Player> cannot live in the Studio's own page; this composition lays that page
 * over the Studio's canvas area as an iframe (the sidebar, menus and timeline stay). Play / pause / seek / space bar there move both screens together.
 * Final renders never use this composition: it refuses to run while rendering (render the landscape and the portrait compositions one after the other).
 */
export const BOTH = { W: 1920, H: 1080 };   // the registered composition itself is only a placeholder under the iframe
export const DUAL_PORT = 3101;

/** the Studio's canvas area: the biggest ancestor of the placeholder that is not the whole window (falls back to the window) */
const canvasPanel = (el: HTMLElement | null): DOMRect => {
  let best: DOMRect | null = null;
  for (let n = el?.parentElement ?? null; n && n !== document.body; n = n.parentElement) {
    const r = n.getBoundingClientRect();
    if (r.width < window.innerWidth - 8 && r.height < window.innerHeight - 8 && r.width > 300 && r.height > 200 && r.top >= 20) best = r;
  }
  return best ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
};

export const MontageBoth: React.FC<{ spec: MontageSpec }> = ({ spec }) => {
  if (getRemotionEnvironment().isRendering) throw new Error("تركيبة «الاثنان معاً» للمعاينة فقط: لا تُرندر. ارندر العرضي ثم الطولي كلاً على حدة بتركيبتيهما.");
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [up, setUp] = React.useState<boolean | null>(null);
  const src = `http://localhost:${DUAL_PORT}/?spec=${encodeURIComponent(spec.id)}`;
  React.useEffect(() => {
    const upd = () => { const r = canvasPanel(hostRef.current); setRect((o) => (o && o.left === r.left && o.top === r.top && o.width === r.width && o.height === r.height ? o : r)); };
    upd(); const t = window.setInterval(upd, 500); window.addEventListener("resize", upd);
    return () => { window.clearInterval(t); window.removeEventListener("resize", upd); };
  }, []);
  React.useEffect(() => {
    let live = true;
    const ping = () => fetch(`http://localhost:${DUAL_PORT}/spec/${encodeURIComponent(spec.id)}.json`, { mode: "no-cors", cache: "no-store" }).then(() => live && setUp(true), () => live && setUp(false));
    ping(); const t = window.setInterval(() => { if (!up) ping(); }, 3000);
    return () => { live = false; window.clearInterval(t); };
  }, [spec.id, up]);
  const panel = rect ? (
    <div style={{ position: "fixed", left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 100000, background: "#0b0d12" }}>
      {up === false
        ? <div style={{ color: "#fff", padding: 40, direction: "rtl", fontFamily: "Noto Kufi Arabic, sans-serif", fontSize: 22, lineHeight: 1.9 }}>خادم الشاشتين متوقف. شغّله بالأمر: node tools/dual_serve.mjs ثم أعد فتح هذه التركيبة.</div>
        : <iframe title="الطولي والعرضي" src={src} allow="autoplay; fullscreen" style={{ width: "100%", height: "100%", border: 0, background: "#0b0d12" }} />}
    </div>
  ) : null;
  return <AbsoluteFill ref={hostRef} style={{ background: "#0b0d12" }}>{panel ? createPortal(panel, document.body) : null}</AbsoluteFill>;
};
