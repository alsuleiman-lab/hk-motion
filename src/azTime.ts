import map from "../public/az_v3_map.json";

/** source-recording seconds -> seconds of public/az_v3_cut.mp4 (silences shortened, noises/restarts removed). A time inside a removed gap snaps to the next kept second. */
const segs = map.segments as { a: number; b: number; n: number }[];
export const AZ_CUT_SECONDS: number = (map as { duration: number }).duration;
export const azCut = (s: number): number => {
  for (const g of segs) {
    if (s >= g.a && s <= g.b) return g.n + (s - g.a);
    if (s < g.a) return g.n;
  }
  const l = segs[segs.length - 1];
  return l.n + (l.b - l.a);
};
