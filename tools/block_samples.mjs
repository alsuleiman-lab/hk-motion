// Event-based sample times for the face check (user 2026-10-26: 2–3 samples per element — start, middle, end — plus the big face-movement moments, instead of ~365 uniform samples).
//   node tools/block_samples.mjs events <src/File.tsx>                       → JSON array of composition seconds (scans `const O = n`, <Win a b>, <Rows from to>, at={a(x)})
//   node tools/block_samples.mjs motion <cut.mp4> <out.json> [--region x,y,w,h] [--offset 7] [--top 0.08]
//        → seconds (composition time = cut time + offset) where the face zone moves most; measured ONCE per footage (ffmpeg YDIF at 4 fps), not per edit
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const [cmd, a1, a2, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);

if (cmd === "events") {
  const t = fs.readFileSync(a1, "utf8");
  const off = Number((t.match(/const O\s*=\s*([\d.]+)/) ?? [])[1] ?? 0);
  const out = new Set(), add = (x) => out.add(+(x + off).toFixed(2));
  for (const m of t.matchAll(/<Win a=\{(-?[\d.]+)\} b=\{(-?[\d.]+)\}/g)) { const s = Number(m[1]), e = Number(m[2]); add(s + 0.5); add((s + e) / 2); add(e - 0.3); }
  for (const m of t.matchAll(/<Rows[^>]*?from=\{(-?[\d.]+)\} to=\{(-?[\d.]+)\}/g)) { const s = Number(m[1]), e = Number(m[2]); add(s + 0.5); add((s + e) / 2); add(e - 0.3); }
  for (const m of t.matchAll(/at=\{a\((-?[\d.]+)\)\}/g)) add(Number(m[1]) + 0.5);
  console.log(JSON.stringify([...out].filter((x) => x > 0).sort((x, y) => x - y)));
} else if (cmd === "motion") {
  const [x, y, w, h] = opt("region", "720,60,480,600").split(",").map(Number), off = Number(opt("offset", "0")), top = Number(opt("top", "0.08"));
  const log = a2 + ".ydif.txt";
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", a1, "-vf", `fps=4,crop=${w}:${h}:${x}:${y},scale=160:-1,signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=${log}`, "-f", "null", "-"], { stdio: "inherit" });
  if (r.status !== 0) process.exit(1);
  const v = [...fs.readFileSync(log, "utf8").matchAll(/YDIF=([\d.]+)/g)].map((m) => Number(m[1]));
  const cut = [...v].sort((p, q) => q - p)[Math.floor(v.length * top)] ?? 1e9;
  const secs = v.map((d, i) => (d >= cut ? +(i / 4 + off).toFixed(2) : null)).filter((s) => s !== null);
  fs.writeFileSync(a2, JSON.stringify(secs));
  fs.rmSync(log, { force: true });
  console.log(`${secs.length} big-motion moments → ${a2}`);
} else { console.error("usage: block_samples.mjs events <file.tsx> | motion <cut.mp4> <out.json> [--region x,y,w,h] [--offset s] [--top 0.08]"); process.exit(2); }
