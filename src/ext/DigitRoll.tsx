import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

const WEST = "0123456789";
const EAST = "٠١٢٣٤٥٦٧٨٩";

/**
 * عدّاد أرقام ميكانيكي (أودومتر): كل رقم عمود يدور دورة كاملة ثم يستقر على قيمته، بتأخير 4 إطارات بين الخانات.
 * الاتجاه دائماً من اليسار لليمين (الأرقام لا تنقلب في العربية). `arabicIndic` يعرض الأرقام الهندية.
 * أي رمز غير رقمي (فاصلة، نقطة، ٪، +) يُرسم ثابتاً.
 */
export const DigitRoll: React.FC<{
  value: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  arabicIndic?: boolean;
  rollFrames?: number;
  stagger?: number;
  /** قيمة سابقة بالطول نفسه: يدور كل رقم من قيمته القديمة إلى الجديدة (وما لم يتغير يبقى ثابتاً) بدل البدء من الصفر. */
  from?: string;
}> = ({ value, delay = 0, fontSize = 64, color = "#fff", fontFamily, arabicIndic = false, rollFrames = 22, stagger = 4, from }) => {
  const frame = useCurrentFrame();
  const lineH = fontSize * 1.15;
  const glyphs = arabicIndic ? EAST : WEST;
  return (
    <span style={{ display: "inline-flex", direction: "ltr", unicodeBidi: "isolate", overflow: "hidden", height: lineH, verticalAlign: "bottom", fontFamily }}>
      {value.split("").map((ch, i) => {
        const target = WEST.indexOf(ch) >= 0 ? WEST.indexOf(ch) : EAST.indexOf(ch);
        if (target < 0) {
          return (
            <span key={i} style={{ fontSize, lineHeight: `${lineH}px`, color }}>
              {ch}
            </span>
          );
        }
        const t = interpolate(frame, [delay + i * stagger, delay + i * stagger + rollFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.25, 0.8, 0.25, 1),
        });
        const fd = from && from.length === value.length ? WEST.indexOf(from[i]) : -1;
        const offset = fd >= 0 ? (fd === target ? 10 + target : fd + (10 + target - fd) * t) * lineH : (10 + target) * t * lineH;
        return (
          <span key={i} style={{ display: "inline-block", height: lineH }}>
            <span style={{ display: "block", transform: `translateY(${-offset}px)` }}>
              {(glyphs + glyphs).split("").map((d, j) => (
                <span key={j} style={{ display: "block", fontSize, lineHeight: `${lineH}px`, color, fontVariantNumeric: "lining-nums tabular-nums", fontFeatureSettings: "\"lnum\" 1" }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};
