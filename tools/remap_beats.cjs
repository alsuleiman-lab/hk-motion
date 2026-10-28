// Re-time every element in a composition after the cut changed: maps old-timeline times -> source -> new-timeline times (public/<name>_map_prev.json -> <name>_map.json).
// env: CUT_SRC (source video, only for ffmpeg checks), CUT_TSX (composition file), CUT_NAME. Used by tools/cut_at.mjs.
const { spawnSync } = require("child_process");
const fs = require("fs");
const SRC = process.env.CUT_SRC; const TSX = process.env.CUT_TSX || TSX; const NAME = process.env.CUT_NAME || "live";
const total = 166.0667;
function segs(thr, min, keep, cuts) {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-i", SRC, "-af", `silencedetect=noise=${thr}dB:d=${min}`, "-vn", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1e8 }).stderr;
  const sil = []; for (const m of log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)) sil.push([+m[1], +m[2]]);
  const rem = [];
  for (const [s, d] of sil) { if (d <= min) continue; if (s < 0.01) rem.push([0, Math.max(0, d - 0.12)]); else if (s + d >= total - 0.05) rem.push([s + keep, total]); else rem.push([s + keep / 2, s + d - keep / 2]); }
  rem.push(...cuts); rem.sort((x, y) => x[0] - y[0]);
  const merged = []; for (const r of rem) { const l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([...r]); }
  const fr = (t) => Math.round(t * 30) / 30; const keepS = []; let cur = 0;
  for (const [a, b] of merged) { if (a > cur) keepS.push([fr(cur), fr(a)]); cur = b; } if (cur < total) keepS.push([fr(cur), fr(total)]);
  let n = 0; return keepS.filter(([a, b]) => b - a > 0.05).map(([a, b]) => { const r = { a, b, n }; n += b - a; return r; });
}
const OLD = JSON.parse(fs.readFileSync(`public/${NAME}_map_prev.json`, "utf8")).segments;
const NEW = JSON.parse(fs.readFileSync(`public/${NAME}_map.json`, "utf8")).segments;
const oldToSrc = (t) => { for (const s of OLD) if (t >= s.n - 1e-6 && t <= s.n + (s.b - s.a) + 1e-6) return s.a + (t - s.n); const nxt = OLD.find((s) => s.n > t); return nxt ? nxt.a : total; };
const srcToNew = (t) => { for (const s of NEW) { if (t >= s.a - 1e-6 && t <= s.b + 1e-6) return s.n + (t - s.a); if (t < s.a) return s.n; } return NEW[NEW.length - 1].n + (NEW[NEW.length - 1].b - NEW[NEW.length - 1].a); };
const f = (t) => +srcToNew(oldToSrc(t)).toFixed(2);
console.log("check: 7.7->", f(7.7), " 24.1->", f(24.1));
let s = fs.readFileSync(TSX, "utf8");
const a = s.indexOf("const beats: Beat[] = ["), b = s.indexOf("// ---- speaker");
let body = s.slice(a, b);
body = body.replace(/from: (\d+(?:\.\d+)?), to: (\d+(?:\.\d+)?)/g, (m, x, y) => "from: " + f(+x) + ", to: " + f(+y));
body = body.replace(/sfx: \[([^\]]*)\]/g, (m, l) => "sfx: [" + l.split(",").map((v) => f(+v.trim())).join(", ") + "]");
body = body.replace(/\bat=\{(\d+(?:\.\d+)?)\}/g, (m, x) => "at={" + f(+x) + "}");
body = body.replace(/heads=\{(\d+(?:\.\d+)?)\}/g, (m, x) => "heads={" + f(+x) + "}");
body = body.replace(/at: (\d+(?:\.\d+)?) \}/g, (m, x) => "at: " + f(+x) + " }");
s = s.slice(0, a) + body + s.slice(b);
s = s.replace(/const SHIFT = [\d.]+;/, "const SHIFT = 0;");
s = s.replace(/const PHASE_B = [\d.]+;/, `const PHASE_B = ${f(24.1)};`);
s = s.replace(/export const LIVE_SECONDS = [\d.]+;/, `export const LIVE_SECONDS = ${(NEW[NEW.length - 1].n + (NEW[NEW.length - 1].b - NEW[NEW.length - 1].a)).toFixed(3)};`);
fs.writeFileSync(TSX, s);
console.log("remapped; duration", NEW[NEW.length - 1].n + (NEW[NEW.length - 1].b - NEW[NEW.length - 1].a));
