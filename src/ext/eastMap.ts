import { LEVANT } from "../levantMap";
import { RIVERS } from "./riversEast";
import { HIST } from "./histBorders";

/**
 * خريطة المشرق (مصر ← العراق، تركيا ← الجزيرة) لفيديوهات التاريخ: بيانات مفتوحة فقط.
 *  - السواحل: Natural Earth 1:50m (ملك عام). - الأنهار: Natural Earth. - الحدود التاريخية التقريبية نحو 1300م: مشروع historical-basemaps (دقة «تقريبية»).
 * الإسقاط: مستطيل متساوي المسافة مصحَّح بجيب تمام 33.5° (1 درجة عرض = 180 بكسل عالم).
 */
export const LON0 = 26, LAT1 = 40, KY = 180;
export const KX = KY * Math.cos((33.5 * Math.PI) / 180);
export const proj = (lon: number, lat: number) => ({ x: (lon - LON0) * KX, y: (LAT1 - lat) * KY });
export const WORLD = { w: Math.round(20 * KX), h: 13 * KY };

const ringD = (ring: number[][]) => "M" + ring.map(([lo, la]) => { const p = proj(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("L") + "Z";

export const LAND_PATH = (() => {
  let d = "";
  for (const poly of Object.values(LEVANT)) for (const part of poly) for (const ring of part) d += ringD(ring);
  return d;
})();

export const RIVER_PATH = RIVERS.map((l) => "M" + l.map(([lo, la]) => { const p = proj(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("L")).join("");

/** كيانات سنة 1300م: كل كيان مساره ولونه الفاتح (ألوان باستيل خريطة قديمة) */
export const POLITY_FILL: Record<string, string> = {
  "Mamluke Sultanate": "#d7e4b6",
  Ilkhanate: "#f0cfae",
  "Seljuk Caliphate": "#ede1a9",
  "Byzantine Empire": "#ddd0e6",
  Cyprus: "#ead2d2",
  Trebizond: "#d9e1ef",
  Georgia: "#e7ddc4",
  "Khanate of the Golden Horde": "#ecd9c4",
  "Bulgar Khanate": "#e1e7d0",
};
/**
 * تصحيح حدّ الفرات: في بيانات المشروع المفتوح يمرّ الحدّ بين سلطنة المماليك والإيلخانية غرب حلب (فتقع حلب في الإيلخانية)،
 * والمعروف تاريخياً أن الحدّ نحو 1300م على الفرات (حلب وحماة وحمص ودمشق للمماليك، وحرّان والجزيرة شرق الفرات للإيلخانية). نبدّل مقطع الحدّ بمسار الفرات التقريبي.
 */
const EUPH: number[][] = [[37.97, 37.0], [38.0, 36.8], [38.5, 36.3], [39.0, 35.95], [39.6, 35.6], [40.14, 35.34], [40.6, 34.9], [40.9, 34.45]];
const idx = (ring: number[][], p: number[]) => ring.findIndex((q) => Math.abs(q[0] - p[0]) < 0.011 && Math.abs(q[1] - p[1]) < 0.011);
const patchedHist = HIST["1300"].map((p) => {
  const ring = p.rings[0].map((q) => q.slice());
  if (p.name === "Mamluke Sultanate") {
    const i = idx(ring, [35.81, 36.3]), j = idx(ring, [37.21, 33.57]);
    if (i >= 0 && j > i) ring.splice(i + 1, j - i - 1, [36.4, 36.6], [36.8, 36.9], ...EUPH, [39.5, 34.2], [38.3, 34.0]);
  }
  if (p.name === "Ilkhanate") {
    const i = idx(ring, [40.03, 34.39]), j = idx(ring, [35.89, 36.77]);
    if (i >= 0 && j > i) ring.splice(i, j - i + 1, ...EUPH.slice().reverse());
  }
  return { ...p, rings: [ring, ...p.rings.slice(1)] };
});
export const POLITIES = patchedHist.map((p) => ({ name: p.name ?? "", d: p.rings.map(ringD).join(""), fill: POLITY_FILL[p.name ?? ""] ?? "#ece3c9" }));
