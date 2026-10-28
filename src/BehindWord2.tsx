import React, { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, Easing, interpolate, spring, useCurrentFrame } from "remotion";

/**
 * "Behind the body" word with ONE elongated connection (tatweel ـ) placed in the middle of the phrase, between two letters,
 * so the first part of the word sits to the right of the speaker's head, the second part to the left, and the line between them runs behind his head.
 * - the tatweel run is auto-sized to ~connectorPx (head + beard width) and centred on headX,
 * - the whole word auto-fits the frame, - no text-stroke contour per glyph (paint-order stroke) so no inner lines appear.
 */
const RIGHT_JOINING = new Set("اأإآدذرزوؤةىء");
const isLetter = (c: string) => /[ء-ي]/.test(c);
/** Index i where text[i] can join text[i+1] (both Arabic letters, text[i] dual-joining), closest to the middle of the string. */
export const pickJoin = (text: string): number => {
  const mid = (text.length - 1) / 2;
  let best = -1;
  for (let i = 0; i < text.length - 1; i++) {
    if (!isLetter(text[i]) || !isLetter(text[i + 1]) || RIGHT_JOINING.has(text[i])) continue;
    if (best < 0 || Math.abs(i + 0.5 - mid) < Math.abs(best + 0.5 - mid)) best = i;
  }
  return best;
};

type Loaded = { fontFamily: string; waitUntilDone: () => Promise<void> };
export const BehindWord2: React.FC<{
  text: string; font: Loaded; weight?: number; from: number; to: number; fps: number; frame?: number;
  nominal?: number; headX?: number; connectorPx?: number; maxW?: number; y?: number; color?: string;
}> = ({ text, font, weight = 400, from, to, fps, nominal = 460, headX = 985, connectorPx = 440, y = 120, color = "#f3d9a4" }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const k = pickJoin(text);
  const right = k >= 0 ? text.slice(0, k + 1) : text;
  const left = k >= 0 ? text.slice(k + 1) : "";
  const meas = useRef<HTMLDivElement>(null);
  const [lay, setLay] = useState<{ size: number; n: number; shift: number } | null>(null);
  const [handle] = useState(() => delayRender("behind word measure"));
  useLayoutEffect(() => {
    font.waitUntilDone().then(() => document.fonts.ready).then(() => {
      const el = meas.current!;
      const s = (sel: string) => (el.querySelector(sel) as HTMLElement).getBoundingClientRect().width;
      const S0 = 300, rw = s(".r"), lw = s(".l"), tw = s(".t") / 10;
      // each side must fit between the head and the frame edge (right side = start of the word, left side = its end)
      const margin = 50;
      const kR = (1920 - headX - margin - connectorPx / 2) / Math.max(1, rw);
      const kL = (headX - margin - connectorPx / 2) / Math.max(1, lw);
      const size = Math.min(nominal, S0 * Math.min(kR, kL));
      const kf = size / S0;
      const n = Math.max(3, Math.round(connectorPx / (tw * kf)));
      const conn = n * tw * kf;
      const total = (rw + lw) * kf + conn;
      const connCenterFromRight = rw * kf + conn / 2; // RTL: text starts at the right edge
      const connCenterX = 960 + total / 2 - connCenterFromRight;
      setLay({ size, n, shift: headX - connCenterX });
      continueRender(handle);
    });
  }, [handle]);
  const style: React.CSSProperties = { fontFamily: font.fontFamily, fontWeight: weight, whiteSpace: "nowrap", direction: "rtl", lineHeight: 1.05 };
  const inP = spring({ frame: Math.round((t - from) * fps), fps, config: { damping: 18, stiffness: 100, mass: 0.9 } });
  const out = interpolate(t, [to - 0.35, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const visible = t >= from - 0.1 && t <= to + 0.1 && lay;
  const x = (1 - Math.min(1, inP)) * 650 - out * 750 + (lay?.shift ?? 0);
  return (
    <>
      {/* hidden measuring copy at a fixed reference size */}
      <div ref={meas} style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden", fontSize: 300, ...style }}>
        <span className="r">{right}</span>
        <span className="l">{left}</span>
        <span className="t">{"ـ".repeat(10)}</span>
      </div>
      {lay && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `translateX(${x}px)`, opacity: visible ? Math.min(1, inP * 1.5) * (1 - out) : 0 }}>
          <div style={{ fontSize: lay.size, color, paintOrder: "stroke fill", WebkitTextStroke: "6px rgba(110,70,35,.6)", textShadow: "0 14px 30px rgba(60,35,15,.45)", ...style }}>
            {right}
            {k >= 0 ? "ـ".repeat(lay.n) : ""}
            {left}
          </div>
        </div>
      )}
    </>
  );
};
