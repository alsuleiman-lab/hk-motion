import { azCut, AZ_CUT_SECONDS } from "./azTime";
import { AZ_SCENES } from "./azData";

/**
 * Where the speaker is ALONE on screen (between the written scenes) and what goes there: behind-the-body words, face punch-ins, name bar, subscribe pill.
 * Everything is computed from the scenes, so changing a scene moves these automatically. Times: seconds of the CUT video.
 */
const fps = 30;
const scenesCut = AZ_SCENES.map((s) => [azCut(s.a), azCut(s.b)] as [number, number]).sort((x, y) => x[0] - y[0]);
export const AZ_PLAIN: [number, number][] = (() => {
  const runs: [number, number][] = [];
  let t = 0;
  for (const [a, b] of scenesCut) { if (a - t >= 0.5) runs.push([t, a]); t = b; }
  if (AZ_CUT_SECONDS - t >= 0.5) runs.push([t, AZ_CUT_SECONDS]);
  return runs;
})();
const inPlain = (a: number, b: number) => AZ_PLAIN.some(([x, y]) => a >= x - 0.01 && b <= y + 0.01);

/** [phrase written behind him, SOURCE second a little before he says it] */
const PHRASES: [string, number][] = [
  ["الحجاب يستحق الدفاع", 81.7],
  ["بكل وسيلة مشروعة", 208.2],
  ["الظلم والقهر", 292.5],
  ["تستحق الإشادة", 439.3],
  ["كبت أنفاس الشعوب", 681.7],
  ["حرية الدين", 750.1],
  ["حكم شرعي", 926.5],
  ["طاعة الله", 1091.3],
  ["الثبات على الدين", 1234.4],
  ["الحجاب يستحق", 1449.8],
  ["الانتقائية", 1564.8],
  ["الأطول نفساً والأعلى صوتاً", 1709.2],
  ["يثبتنا على دينه", 1741.4],
];
export const AZ_WIN_LEN = 3.8;
export const AZ_BEHIND = PHRASES.map(([word, src], i) => ({ i, word, src, t: azCut(src) }))
  .filter((k) => inPlain(k.t, k.t + AZ_WIN_LEN))
  .map((k, j) => ({ ...k, offset: j * AZ_WIN_LEN })); // offset = start inside the composed windows video

/** 10% punch-in (4.5 s) in the long plain stretches, a few seconds after the behind-word window */
export const AZ_ZOOMS: [number, number][] = AZ_PLAIN.filter(([a, b]) => b - a >= 11).filter((_, i) => i % 2 === 1).map(([a]) => [a + 4.8, a + 9.3]);

const longRuns = AZ_PLAIN.filter(([a, b]) => b - a >= 8);
export const AZ_NAME_AT = [longRuns[0][0] + 5.0, longRuns[Math.floor(longRuns.length / 2)][0] + 1.0, AZ_CUT_SECONDS - 12.5];
export const AZ_SUB_AT = [longRuns[1][0] + 1.5, longRuns[Math.floor(longRuns.length * 0.7)][0] + 5.5, AZ_CUT_SECONDS - 8.0];
export const AZ_FRAMES = Math.ceil(AZ_CUT_SECONDS * fps);
