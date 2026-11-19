import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { amiri, cairo } from "./Scenes";
import { lalezar } from "./RefStyle";
import { EDIT_DATE } from "./editDate";
import { BRAND_BAR } from "./brand";

/**
 * Standing info box for the WHOLE video — design #9 (user's choice): split bar, the timer block on the right edge and the title block next to it,
 * with the notice under it. Bottom-RIGHT corner (~380x80 px on 1920x1080). Colours are NOT fixed: pass `timerBg`/`titleBg` (gradients) chosen per video
 * from the palette of the design (frames, word colours, accents) so the bar matches the rest of the edit.
 * Defaults = the palette of the lesson (steel/ink blue timer + walnut title).
 */
export const hijri = (iso: string) => new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00Z"));
export const gregorian = (iso: string) => new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00Z")) + "م";
const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

export type BarTheme = { timerBg: string; titleBg: string; timerText: string; titleText: string; subText: string };
/** one colour identity for every video (src/brand.ts): the bar always uses BRAND_BAR; a `theme` passed by an older composition is ignored */
export const THEME_LESSON: BarTheme = BRAND_BAR;

export const TitleBar: React.FC<{ title: string; theme?: BarTheme; date?: string; offsetSec?: number; bottomHalf?: boolean; hideNotice?: boolean; sub?: string }> = ({ title, sub, date = EDIT_DATE, offsetSec = 0, bottomHalf = false, hideNotice = false }) => {
  const theme = BRAND_BAR;
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const portrait = width < 1500;
  const t = f / fps + offsetSec;
  // PORTRAIT (user order 2026-10-18, "في المرات القادمة"): same card, title + date fonts DOUBLED (it was unreadable), placed at the TOP. Content must start at y >= 190.
  // bottomHalf (portrait, user 2026-10-25 «أسفل الفيديو ولا تأخذ أكثر من نصف الشاشة عرضاً»): bottom-right, at most half the width; the title stays ONE line (the bar rule) and its font shrinks to fit
  const k = bottomHalf ? 1.15 : portrait ? 1.8 : 1;
  const timerK = bottomHalf ? 1.1 : portrait ? 1.45 : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", direction: "rtl" }}>
      <div style={{ position: "absolute", right: portrait ? 24 : 34, ...(portrait && !bottomHalf ? { top: 22 } : { bottom: 24 }), minWidth: bottomHalf ? 0 : portrait ? 690 : 380, maxWidth: bottomHalf ? 540 : portrait ? 1030 : 900 }}>
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,.7)", boxShadow: "0 6px 14px rgba(0,0,0,.4)" }}>
          <div style={{ background: theme.timerBg, padding: "6px 12px", display: "flex", alignItems: "center", fontFamily: cairo, fontWeight: 900, fontSize: 27 * timerK, color: theme.timerText, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{clock(t)}</div>
          <div style={{ flex: 1, background: theme.titleBg, padding: "5px 10px", minWidth: 0 }}>
            {/* title font ×2 (user 2026-10-25: «خط العنوان اجعله أكبر بمقدار 130%» → chose ×2); the box grows leftward to fit it */}
            <div style={{ fontFamily: lalezar, fontSize: bottomHalf ? Math.min(17 * 2 * k, 395 / (title.length * 0.52)) : 17 * 2 * k, color: theme.titleText, lineHeight: 1.1, whiteSpace: "nowrap" }}>{title}</div>
            {sub ? <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 14 * k, color: theme.titleText, opacity: 0.9, lineHeight: 1.25, whiteSpace: "nowrap" }}>{sub}</div> : null}{/* (user 2026-11-19) the one exception: a second line under the title («مأخوذة من مناظرة …») */}
            <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 11 * k, color: theme.subText, whiteSpace: "nowrap" }}>{hijri(date)} • {gregorian(date)}</div>
          </div>
        </div>
        {hideNotice ? null : <div style={{ fontFamily: amiri, fontWeight: 700, fontSize: 11 * 2 * k, color: "#fff", WebkitTextStroke: `${portrait ? 3 : 2}px #000`, paintOrder: "stroke fill", textShadow: "0 1px 4px rgba(0,0,0,.9)", textAlign: "center", marginTop: 2 }}>يمنع اقتصاص الفيديو دون عرض العداد</div>}
      </div>
    </AbsoluteFill>
  );
};
