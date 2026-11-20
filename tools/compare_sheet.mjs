// لوحة مقارنة: المرجع فوق والقالب تحت عند نسب متساوية من مدة كلٍّ منهما (خطة التدرّب، المرحلة ٨، 2026-11-20).
//   node tools/compare_sheet.mjs <ref.mp4> <ours.mp4> <out.png> [--n 8]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [ref, ours, out] = process.argv.slice(2);
if (!ref || !ours || !out) { console.error("usage: node tools/compare_sheet.mjs <ref.mp4> <ours.mp4> <out.png> [--n 8]"); process.exit(2); }
const n = Number(process.argv.includes("--n") ? process.argv[process.argv.indexOf("--n") + 1] : 8);
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout);
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), "cmp_"));
const row = (f, tag) => {
  const d = dur(f), files = [];
  for (let i = 0; i < n; i++) { const t = (d * (i + 0.5)) / n, o = path.join(tmp, `${tag}${i}.png`); spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", f, "-frames:v", "1", "-vf", "scale=200:356,setsar=1", o]); files.push(o); }
  const o = path.join(tmp, `${tag}.png`);
  spawnSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((x) => ["-i", x]), "-filter_complex", `hstack=inputs=${n}`, o]);
  return o;
};
const a = row(ref, "r"), b = row(ours, "o");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", a, "-i", b, "-filter_complex", "vstack", out], { encoding: "utf8" });
fs.rmSync(tmp, { recursive: true, force: true });
if (r.status) { console.error(r.stderr); process.exit(1); }
console.log(out);
