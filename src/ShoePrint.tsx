import React from "react";
import { Img, staticFile } from "remotion";
import { useT } from "./MG";

/**
 * ShoePrint — «ختم أثر حذاء» (user orders 2026-11-15: every picture of Bashar al-Assad gets a shoe stamped on it; «يجب أن يكبس عليه بعد أن تظهر صورته،
 * ويجب أن يختار شكل نعل دقيق لأننا سنستخدمه بشكل متكرر»؛ «الحذاء غير جيد» ← the drawn cartoon sole was replaced by a REAL boot-sole print).
 *  - the print is public/shoe/sole_boot.png: the approved boot outsole print (the user-approved black boot-sole silhouette (toe cap, chevron lugs, side lugs, heel block), drawn as vector and exported to PNG; shown at 50% opacity (user 2026-11-15: «هذه جيدة، اجعل شفافيتها 50%»)); the ONLY shoe used in every video.
 *  - starts `at` (the caller gives the picture's appearance + ~0.9 s): the sole drops from big to the picture's size (ease-in), PRESSES (a small squash and rebound with
 *    impact strokes), then stays as the ink imprint until the picture leaves. No fade anywhere.
 */
const RATIO = 400 / 800;

export const ShoePrint: React.FC<{ at: number; until: number; x: number; y: number; w: number; h: number; rot?: number }> = ({ at, until, x, y, w, h, rot = -12 }) => {
  const t = useT(0);
  if (t < at || t > until) return null;
  const c = (v: number) => Math.max(0, Math.min(1, v)), u = t - at;
  const H = Math.min(h * 0.98, (w * 0.98) / RATIO), Wd = H * RATIO;
  const DROP = 0.22, PRESS = 0.14;
  let scale = 1, lift = 0, dropping = false, impact = 0;
  if (u < DROP) { const k = c(u / DROP), e = k * k * k; scale = 2.5 - 1.46 * e; lift = (1 - e) * 26; dropping = true; }
  else if (u < DROP + PRESS) { const k = c((u - DROP) / PRESS); scale = 1.04 - 0.1 * Math.sin(k * Math.PI) * (k < 0.5 ? 1 : 0.55) - 0.04 * k; dropping = true; impact = 1 - k; }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, pointerEvents: "none", overflow: dropping && u < DROP ? "visible" : "hidden" }}>
      <div style={{ position: "absolute", left: (w - Wd) / 2, top: (h - H) / 2, width: Wd, height: H, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: "50% 50%",
        filter: dropping ? `drop-shadow(0 ${6 + lift}px ${5 + lift * 0.6}px rgba(0,0,0,${0.42 - 0.1 * c(lift / 26)}))` : "none" }}>
        <Img src={staticFile("shoe/sole_boot.png")} style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.5 }} />
        {impact > 0 ? (
          <svg width={Wd} height={H} viewBox="0 0 220 560" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g stroke="#2a1c12" strokeWidth={7} strokeLinecap="round" opacity={0.9}>
              {[[-18, 120, -52, 120], [-14, 250, -46, 268], [-12, 380, -44, 408], [238, 120, 272, 120], [234, 250, 266, 268], [232, 380, 264, 408]].map(([a, b, d, e], i) => (
                <line key={i} x1={a} y1={b} x2={a + (d - a) * (0.5 + 0.5 * (1 - impact))} y2={b + (e - b) * (0.5 + 0.5 * (1 - impact))} />
              ))}
            </g>
          </svg>
        ) : null}
      </div>
    </div>
  );
};
