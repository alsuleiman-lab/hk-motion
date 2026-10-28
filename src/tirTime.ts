import map from "../public/tir_map.json";

/** source-video seconds -> seconds in public/tir_cut_v3.mp4 (the edit after silences/stumbles/throat-clear were removed). A time inside a removed gap snaps to the next kept second. */
const segs = map.segments as { a: number; b: number; n: number }[];
export const TIR_CUT_SECONDS: number = (map as { duration: number }).duration;

export const cut = (s: number): number => {
  for (const g of segs) {
    if (s >= g.a && s <= g.b) return g.n + (s - g.a);
    if (s < g.a) return g.n;
  }
  const l = segs[segs.length - 1];
  return l.n + (l.b - l.a);
};
