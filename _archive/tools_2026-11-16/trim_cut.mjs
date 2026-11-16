// Removes source-time ranges from an ALREADY smoothed cut without redoing the cut or the smoothing (the smoothing took 31 min for a 15 min video).
//   node tools/trim_cut.mjs <project> "1175.2-1181.8,1810.95-1819.0" --from public/<p>_cut2_s.mp4 --to public/<p>_cut3_s.mp4
// 1) maps each source range through public/<p>_map.json to the cut-timeline spans it covers (rounded to whole frames, merged)
// 2) writes the new map (the old one is kept as <p>_map_before_trim.json) so every element timed from SOURCE seconds (spec scripts) moves with it
// 3) one NVENC encode of the kept parts: video by frame numbers, audio by time with a 12 ms fade at each join (no click); below-normal priority, -threads 4
// The --to name must be NEW (a file Studio has open cannot be replaced). Rule 47 of video-montage/critical-rules.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const [p, ranges, ...rest] = process.argv.slice(2);
const opt = (n) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : null);
const from = opt("from"), to = opt("to");
if (!p || !ranges || !from || !to) { console.error('usage: node tools/trim_cut.mjs <project> "a-b,c-d" --from <smoothed.mp4> --to <new.mp4>'); process.exit(2); }
if (fs.existsSync(to)) { console.error(`${to} exists — use a new name`); process.exit(2); }
const mapF = path.join("public", `${p}_map.json`);
const mj = JSON.parse(fs.readFileSync(mapF, "utf8")), M = mj.segments;
const FPS = 30, fr = (t) => Math.round(t * FPS);
const rem = ranges.split(",").filter(Boolean).map((r) => r.split("-").map(Number));

// 1) cut-timeline spans (frames)
let spans = [];
for (const [A, B] of rem) for (const g of M) if (g.b > A && g.a < B) spans.push([fr(g.n + Math.max(A, g.a) - g.a), fr(g.n + Math.min(B, g.b) - g.a)]);
spans.sort((x, y) => x[0] - y[0]);
spans = spans.reduce((o, s) => { const l = o[o.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else o.push([...s]); return o; }, []).filter(([a, b]) => b > a);
if (!spans.length) { console.error("the ranges cover nothing of the cut"); process.exit(1); }

// the removed source ranges are re-derived from the frame-rounded spans, so the map shortens by EXACTLY the frames removed (a few ms of drift per trim would shift every later join away from its click-scan window)
const exact = spans.map(([f0, f1]) => { const g = M.find((q) => f0 / FPS >= q.n - 1e-6 && f1 / FPS <= q.n + (q.b - q.a) + 1e-6); return g ? [g.a + f0 / FPS - g.n, g.a + f1 / FPS - g.n] : null; });
if (exact.every(Boolean)) { rem.length = 0; rem.push(...exact); }

// 2) new map
const ns = [];
for (const g of M) {
  let pieces = [[g.a, g.b]];
  for (const [A, B] of rem) pieces = pieces.flatMap(([a, b]) => (b <= A || a >= B ? [[a, b]] : [...(a < A ? [[a, A]] : []), ...(b > B ? [[B, b]] : [])]));
  for (const [a, b] of pieces) if (b - a > 0.03) ns.push({ a: +a.toFixed(4), b: +b.toFixed(4) });
}
let n = 0; for (const g of ns) { g.n = +n.toFixed(3); n += g.b - g.a; }
fs.copyFileSync(mapF, path.join("public", `${p}_map_before_trim.json`));
fs.writeFileSync(mapF, JSON.stringify({ segments: ns, duration: +n.toFixed(3) }, null, 1));

// 3) encode the kept parts
const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames", "-of", "csv=p=0", from], { encoding: "utf8" });
const total = parseInt(probe.stdout);
const keep = []; let cur = 0;
for (const [a, b] of spans) { if (a > cur) keep.push([cur, a]); cur = b; }
if (cur < total) keep.push([cur, total]);
const F = 0.012;
const v = keep.map(([a, b], i) => `[0:v]trim=start_frame=${a}:end_frame=${b},setpts=PTS-STARTPTS[v${i}]`);
const au = keep.map(([a, b], i) => `[0:a]atrim=start=${a / FPS}:end=${b / FPS},asetpts=PTS-STARTPTS${i > 0 ? `,afade=t=in:st=0:d=${F}` : ""}${i < keep.length - 1 ? `,afade=t=out:st=${(b - a) / FPS - F}:d=${F}` : ""}[a${i}]`);
const fc = [...v, ...au, `${keep.map((_, i) => `[v${i}]`).join("")}concat=n=${keep.length}:v=1:a=0[v]`, `${keep.map((_, i) => `[a${i}]`).join("")}concat=n=${keep.length}:v=0:a=1[a]`].join(";");
const removed = spans.reduce((s, [a, b]) => s + (b - a), 0);
console.log(`removing ${spans.length} span(s): ${spans.map(([a, b]) => `${(a / FPS).toFixed(2)}–${(b / FPS).toFixed(2)}s`).join(", ")} = ${removed} frames; keeping ${keep.length} parts; new duration ≈ ${((total - removed) / FPS).toFixed(2)}s`);
const c = spawn("ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", from, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p4", "-rc", "vbr", "-cq", "21", "-b:v", "0", "-c:a", "aac", "-b:a", "192k", to], { stdio: "inherit", windowsHide: true });
try { os.setPriority(c.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
c.on("close", (code) => {
  if (code !== 0) { console.error("ffmpeg failed — the map was already changed; restore public/" + p + "_map_before_trim.json"); process.exit(code ?? 1); }
  const pr = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames", "-of", "csv=p=0", to], { encoding: "utf8" });
  console.log(`DONE → ${to}: ${parseInt(pr.stdout)} frames (expected ${total - removed}); map duration ${n.toFixed(3)}s`);
});
