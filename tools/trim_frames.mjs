// Delete frame ranges the user marked on the Remotion timeline from a data-spec montage (user 2026-11-06: «احذف من الإطار 13877 إلى 13957»).
//   node tools/trim_frames.mjs <project> "13877-13957,14075-14385" [--src public/<p>_cut_s.mp4] [--audio .tmp/<p>/cut_final.wav] [--name <p>_cut_g]
// A range a-b removes frames a … b-1 of the CURRENT cut timeline (30 fps). Steps (all one command, backups first):
//   1) data/specs/<p>.json: every time after a removal moves earlier; an element fully inside a removal is dropped, one that straddles is clipped (zooms, shake, rows, verses,
//      rewrite, scraps times …); `frames` shrinks; `cut` → the new file
//   2) .tmp/<p>/cut_words.json and public/<p>_map.json follow the same mapping (backups *_before_trim)
//   3) video: NVENC re-encode with the frames removed (select filter) ; audio: the pre-effects wav trimmed with 6 ms fades at each join, then tools/mix_sfx.py on the new timeline
//   4) mux → public/<name>.mp4 (a NEW name: Studio keeps the old file open)
// Afterwards run (the montage order): node tools/writing_sync.mjs <spec> --fix ; node tools/scraps_times.mjs <spec> ; node tools/grid_plan.mjs <spec> --write ; stage check.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const [p, rangesArg] = argv;
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
if (!p || !rangesArg) { console.error('usage: node tools/trim_frames.mjs <project> "a-b,c-d" [--src …] [--audio …] [--name …]'); process.exit(2); }
const FPS = 30, T = path.join(".tmp", p);
const specF = path.join("data", "specs", `${p}.json`), wordsF = path.join(T, "cut_words.json"), mapF = path.join("public", `${p}_map.json`);
const frames = rangesArg.split(",").map((r) => r.split("-").map(Number)).sort((x, y) => x[0] - y[0]);
const R = frames.map(([a, b]) => [a / FPS, b / FPS]);
const removedFrames = frames.reduce((n, [a, b]) => n + (b - a), 0), removedSec = removedFrames / FPS;
const mapT = (t) => t - R.reduce((s, [a, b]) => s + Math.max(0, Math.min(t - a, b - a)), 0);
const r2 = (v) => +v.toFixed(3);
const stamp = Date.now();
for (const [f, b] of [[specF, path.join(T, "spec_before_trim.json")], [wordsF, path.join(T, "cut_words_before_trim.json")], [mapF, path.join("public", `${p}_map_before_trim.json`)]]) if (!fs.existsSync(b)) fs.copyFileSync(f, b);

// ---- 1) spec ----
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const P_SINGLE = ["at", "oldAt", "strikeAt", "newAt", "arcAt"];
const keepSpan = (a, b) => { const a2 = mapT(a), b2 = mapT(b); const gone = (b - a) - (b2 - a2); return gone >= (b - a) - 0.05 || b2 - a2 < 0.8 ? null : [a2, b2]; };
function shiftItem(it) {
  const a = it.at ?? it.from ?? it.times?.[0] ?? it.oldAt, b = it.until ?? it.to;
  if (b !== undefined && a !== undefined) {
    const sp = keepSpan(a, b);
    if (!sp && !["nameTag", "subscribe", "cover"].includes(it.t)) return null;
    if (sp) { if ("at" in it) it.at = r2(sp[0]); if ("from" in it) it.from = r2(sp[0]); if ("until" in it) it.until = r2(sp[1]); if ("to" in it) it.to = r2(sp[1]); }
  } else if (a !== undefined && it.t !== "cover") { if ("at" in it) it.at = r2(mapT(it.at)); if ("from" in it) it.from = r2(mapT(it.from)); }
  for (const k of ["oldAt", "strikeAt", "newAt", "arcAt"]) if (k in it) it[k] = r2(mapT(it[k]));
  if (Array.isArray(it.times)) it.times = it.times.map((t) => r2(mapT(t)));
  if (it.rows) for (const r of it.rows) r.at = r2(mapT(r.at));
  if (it.title && typeof it.title === "object" && "at" in it.title) it.title.at = r2(mapT(it.title.at));
  if (it.stages) for (const s of it.stages) s.at = r2(mapT(s.at));
  if (it.also) for (const s of it.also) s.at = r2(mapT(s.at));
  return it;
}
spec.items = spec.items.map((it) => ((it.t === "cover") ? it : shiftItem(it))).filter(Boolean);
for (const k of ["zooms", "shake"]) spec[k] = (spec[k] ?? []).map((z) => { const sp = keepSpan(z.from, z.to); return sp ? { ...z, from: r2(sp[0]), to: r2(sp[1]) } : null; }).filter(Boolean);
spec.cams = (spec.cams ?? []).map((c) => ({ ...c, from: r2(mapT(c.from)), to: c.to >= 9000 ? c.to : r2(mapT(c.to)) }));
spec.frames -= removedFrames;
const outName = opt("name", `${p}_cut_g`);
spec.cut = `${outName}.mp4`;
fs.writeFileSync(specF, JSON.stringify(spec, null, 1));

// ---- 2) words + map ----
const W = JSON.parse(fs.readFileSync(wordsF, "utf8")), ws = Array.isArray(W) ? W : W.words;
const inside = (t) => R.some(([a, b]) => t >= a && t < b);
const nw = ws.filter((w) => !inside((w.s + w.e) / 2)).map((w) => ({ ...w, s: r2(mapT(w.s)), e: r2(mapT(w.e)) }));
fs.writeFileSync(wordsF, JSON.stringify(Array.isArray(W) ? nw : { ...W, words: nw }));
const M = JSON.parse(fs.readFileSync(mapF, "utf8"));
const segs = [];
for (const s of M.segments) {
  let pieces = [[s.n, s.n + (s.b - s.a)]];
  for (const [ra, rb] of R) pieces = pieces.flatMap(([x, y]) => (rb <= x || ra >= y ? [[x, y]] : [[x, Math.min(y, ra)], [Math.max(x, rb), y]].filter(([u, v]) => v - u > 0.02)));
  for (const [x, y] of pieces) segs.push({ ...s, a: r2(s.a + (x - s.n)), b: r2(s.a + (y - s.n)), n: r2(mapT(x)) });
}
fs.writeFileSync(mapF, JSON.stringify({ ...M, segments: segs, duration: r2(M.duration - removedSec) }));

// ---- 3) audio + video ----
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const audioIn = opt("audio", path.join(T, "cut_final.wav")), audioOut = path.join(T, "cut_final_trim.wav"), sfxOut = path.join(T, "cut_sfx_trim.wav");
const run = (cmd, args) => { const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], windowsHide: true }); if (r.status !== 0) { console.error("✘", cmd, args.slice(0, 4).join(" ")); process.exit(1); } };
run(PY, ["-I", "tools/trim_wav.py", audioIn, audioOut, "--cut", R.map(([a, b]) => `${a}-${b}`).join(",")]);
run(PY, ["-I", "tools/mix_sfx.py", specF, audioOut, sfxOut, "--words", wordsF]);
const src = opt("src", path.join("public", `${p}_cut_s.mp4`)), vOut = path.join("public", `${outName}.mp4`);
const sel = frames.map(([a, b]) => `between(n\\,${a}\\,${b - 1})`).join("+");
run("ffmpeg", ["-v", "error", "-y", "-hwaccel", "cuda", "-i", src, "-i", sfxOut, "-filter_complex", `[0:v]select='not(${sel})',setpts=N/(${FPS}*TB)[v]`, "-map", "[v]", "-map", "1:a", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "19", "-b:v", "0", "-maxrate", "20M", "-g", "15", "-c:a", "aac", "-b:a", "192k", "-shortest", vOut]);
console.log(`✔ removed ${removedFrames} frames (${removedSec.toFixed(2)} s) → ${spec.frames} frames · ${vOut}\n  spec/words/map updated (backups *_before_trim). Next: writing_sync --fix, scraps_times, grid_plan --write, stage check.`);
