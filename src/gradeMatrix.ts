/**
 * THE COLOUR TOOL, BASE OF THE PROGRAM (user 2026-11-19: «عندنا أداة الألوان، هاي نضيفها أساسية»).
 * A montage's `grade` (data/specs/<p>.json) is a handful of exact settings for the recording's colours. They are folded into ONE colour matrix (3 rows × [r g b offset], on 0..1 values)
 * which is applied identically in the Studio (an SVG feColorMatrix filter on the recording's video layers, src/hybrid/Slot.tsx) and in the GPU render (the compositor multiplies each
 * pixel of the same layers by the same matrix, tools/gpu_compositor.py): what the Studio shows is what is exported. Only the recording's layers (the montage's `cut` video) are graded,
 * never the graphics, pictures or cards drawn over it. A neutral grade (or none) changes nothing, so old specs are untouched.
 * Settings (UI scale, neutral = 100 / 0): brightness 0–200, contrast 0–200, saturation 0–200, sepia 0–100, temperature −100…100 (cool ← warm), tint −100…100 (green ← magenta), warmth 0–100.
 */
export type Grade = { brightness?: number; contrast?: number; saturation?: number; sepia?: number; temperature?: number; tint?: number; warmth?: number };
export const NEUTRAL_GRADE: Required<Grade> = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, temperature: 0, tint: 0, warmth: 0 };
export const GRADE_LIMITS: Record<keyof Grade, [number, number]> = { brightness: [0, 200], contrast: [0, 200], saturation: [0, 200], sepia: [0, 100], temperature: [-100, 100], tint: [-100, 100], warmth: [0, 100] };
type M = number[][];   // 4×4 homogeneous, acts on the column [r, g, b, 1]
const I4 = (): M => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
const mul = (a: M, b: M): M => a.map((_, i) => b[0].map((__, j) => a[i].reduce((s, _v, k) => s + a[i][k] * b[k][j], 0)));
const diag = (r: number, g: number, b: number): M => [[r, 0, 0, 0], [0, g, 0, 0], [0, 0, b, 0], [0, 0, 0, 1]];
const L = [0.2126, 0.7152, 0.0722];
export const isNeutralGrade = (g?: Grade | null): boolean => !g || (Object.keys(NEUTRAL_GRADE) as (keyof Grade)[]).every((k) => (g[k] ?? NEUTRAL_GRADE[k]) === NEUTRAL_GRADE[k]);
/** 12 numbers: row r, g, b = [m_r, m_g, m_b, offset] on 0..1 values; order: brightness → contrast → saturation → sepia → temperature → tint → warmth */
export const gradeMatrix = (g: Grade): number[] => {
  const v = { ...NEUTRAL_GRADE, ...g };
  const clamp = (k: keyof Grade) => Math.min(GRADE_LIMITS[k][1], Math.max(GRADE_LIMITS[k][0], Number(v[k]) || 0));
  const b = clamp("brightness") / 100, c = clamp("contrast") / 100, s = clamp("saturation") / 100, sp = clamp("sepia") / 100, t = clamp("temperature") / 100, ti = clamp("tint") / 100, w = clamp("warmth") / 100;
  let m = I4();
  const step = (x: M) => { m = mul(x, m); };
  step(diag(b, b, b));
  step([[c, 0, 0, 0.5 - 0.5 * c], [0, c, 0, 0.5 - 0.5 * c], [0, 0, c, 0.5 - 0.5 * c], [0, 0, 0, 1]]);
  step([[L[0] + (1 - L[0]) * s, L[1] * (1 - s), L[2] * (1 - s), 0], [L[0] * (1 - s), L[1] + (1 - L[1]) * s, L[2] * (1 - s), 0], [L[0] * (1 - s), L[1] * (1 - s), L[2] + (1 - L[2]) * s, 0], [0, 0, 0, 1]]);
  const S = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]];
  step([[...S[0].map((x, j) => sp * x + (j === 0 ? 1 - sp : 0)), 0], [...S[1].map((x, j) => sp * x + (j === 1 ? 1 - sp : 0)), 0], [...S[2].map((x, j) => sp * x + (j === 2 ? 1 - sp : 0)), 0], [0, 0, 0, 1]]);
  step(diag(1 + 0.18 * t, 1 + 0.02 * t, 1 - 0.18 * t));
  step(diag(1 + 0.06 * ti, 1 - 0.12 * ti, 1 + 0.06 * ti));
  step(diag(1 + 0.08 * w, 1 + 0.01 * w, 1 - 0.12 * w));
  return [...m[0], ...m[1], ...m[2]].map((x) => Math.round(x * 1e5) / 1e5);
};
/** the SVG feColorMatrix `values` string (4×5: r g b a offset) of a 12-number matrix */
export const svgValues = (gm: number[]): string => `${gm[0]} ${gm[1]} ${gm[2]} 0 ${gm[3]}  ${gm[4]} ${gm[5]} ${gm[6]} 0 ${gm[7]}  ${gm[8]} ${gm[9]} ${gm[10]} 0 ${gm[11]}  0 0 0 1 0`;
