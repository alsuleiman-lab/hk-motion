// shared helpers for the bath2 stream clips (data specs). Every item starts with its first spoken word (cut seconds).
import fs from "node:fs";
export const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
export const COVER_SHEIKH = { src: "sheikh_gallery/brown/sheikh_cov.png", headX: 994, headTop: 57, headW: 238, srcW: 1920 };
export const sc = (text, at, until, o = {}) => ({ t: "scraps", text, at, until, y: 1520, ...o });
export const tn = (text, at, until, o = {}) => ({ t: "torn", text, at, until, y: 1530, size: 42, ...o });
export const pic = (src, at, until, o = {}) => ({ t: "pic", src, at, until, x: 330, y: 1440, w: 420, h: 240, ...o });
export function finish(p, title, cover, items, { frames, landscape = false } = {}) {
  const f = `data/specs/${p}.json`;
  const s = rd(f);
  s.title = title;
  if (frames) { s.frames = frames; s.duration = +(frames / 30).toFixed(2); }
  s.showTitleBar = false;
  s.brand = s.brand ?? "steel";
  s.items = [{ t: "cover", style: "pro", pro: cover }, ...items].sort((a, b) => (a.at ?? a.from ?? 0) - (b.at ?? b.from ?? 0));
  fs.writeFileSync(f, JSON.stringify(s, null, 1));
  const tornN = s.items.filter((i) => i.t === "torn").length, writ = s.items.filter((i) => i.t === "torn" || i.t === "scraps").length;
  console.log(p, "items", s.items.length, "frames", s.frames, `torn ${tornN}/${writ}`);
}
