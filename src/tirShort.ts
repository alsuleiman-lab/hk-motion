import { cut } from "./tirTime";
import { SPLITS } from "./tirData";

/**
 * THE 3-MINUTE ESSENCE of the lesson (user: "اختصر ردي بـ 3 دقائق، عصارة الرد"): the opponent's claim, then the main rebuttals, then the closing.
 * Each piece = a range of the edited lesson (tir_cut_v3 frames, 30 fps) taken at sentence / scene boundaries. Source seconds are converted with cut().
 * The short edit plays these pieces back to back; its own timer (title bar) starts at 0.
 */
const fps = 30;
const F = (srcSec: number) => Math.round(cut(srcSec) * fps);
/** [label, startSrcSec, endSrcSec] — src = seconds of the original recording */
export const SHORT_PIECES: [string, number, number][] = [
  ["دعوى الخصم: التدوين متأخر (لقطته)", 37.5, 54.2],
  ["يزعم ثم يقرّ", 69.2, 82.4],
  ["التدوين أقدم: الموطأ ومصنف معمر", 86.6, 109.0],
  ["كيف نعرف رواة الإسناد (موشن)", 167.6, 203.6],
  ["لا محاباة: ابن المديني وأبو داود والمذهب", 359.6, 392.3],
  ["الستمائة ألف أسانيد لا نصوص", 605.8, 619.6],
  ["الجامع الصحيح المختصر", 637.4, 657.0],
  ["ثقة عن ثقة", 688.3, 710.2],
  ["الوشوشة الصينية: الرواة ليسوا أصحاب وشوشة", 783.0, 870.97],
  ["الخاتمة", 1199.0, 1207.6],
];
export type ShortSeg = { s: number; a: number; n: number }; // s = start in the short, a = start in the v3 edit, n = frames
const build = (): ShortSeg[] => {
  let s = 0;
  return SHORT_PIECES.map(([, x, y], i) => {
    let a = F(x), b = F(y);
    if (i === 0) { a = Math.round(SPLITS[1].from * fps); b = Math.round(SPLITS[1].to * fps); } // exactly the first recorded clip
    const seg = { s, a, n: b - a };
    s += b - a;
    return seg;
  });
};
export const SHORT_SEGS = build();
export const SHORT_FRAMES = SHORT_SEGS.reduce((t, g) => t + g.n, 0);
/** short frame -> v3 frame (null if outside) */
export const shortToV3 = (f: number): { v3: number; seg: number } | null => {
  for (let i = 0; i < SHORT_SEGS.length; i++) {
    const g = SHORT_SEGS[i];
    if (f >= g.s && f < g.s + g.n) return { v3: g.a + (f - g.s), seg: i };
  }
  return null;
};
