// SEVERAL pauses/blocks out of the existing cut in ONE video encode (user 2026-11-15: a single block = a 3-minute re-encode of the whole video; 14 blocks = 40 minutes).
//   node tools/cut_blocks.mjs <p> A-B,C-D,… [--force]     (A,B = seconds of the CURRENT cut; snapped to frames)
// 1) one ffmpeg pass over the current cut video (all kept stretches, 12 ms audio fades at every join, NVENC like cut_block) → public/<p>_cut_s_b<n>.mp4, then cut.wav / cut16k.wav;
// 2) the data (spec items/zooms/splits/…, map, words, writing, notes, draft) are updated block by block by tools/cut_block.mjs in JSON-only mode, last block first.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const [p, list, ...rest] = process.argv.slice(2);
if (!p || !list) { console.error("usage: node tools/cut_blocks.mjs <p> A-B,C-D"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const spans = list.split(",").map((x) => x.split("-").map((v) => Math.round(Number(v) * 30))).sort((a, b) => a[0] - b[0]);
for (let i = 0; i < spans.length; i++) if (!(spans[i][1] > spans[i][0]) || (i && spans[i][0] < spans[i - 1][1])) { console.error("✘ spans overlap or are empty"); process.exit(2); }
const T = path.join(".tmp", p), specF = path.join("data", "specs", `${p}.json`), spec = JSON.parse(fs.readFileSync(specF, "utf8")), src = path.join("public", spec.cut);
const nFile = path.join(T, "cut_block_n.txt");
const n = 1 + Math.max(0, ...fs.readdirSync("public").map((f) => Number(f.match(new RegExp(`^${p}_cut_s_b(\d+)`))?.[1] ?? 0)), Number(fs.existsSync(nFile) ? fs.readFileSync(nFile, "utf8") : 0));
fs.writeFileSync(nFile, String(n));
const outName = `${p}_cut_s_b${n}.mp4`, out = path.join("public", outName), total = spec.frames;
const keep = []; let prev = 0; for (const [a, b] of spans) { keep.push([prev, a]); prev = b; } keep.push([prev, total]);
const parts = keep.map(([s, e], i) => `[0:v]trim=start_frame=${s}:end_frame=${e},setpts=PTS-STARTPTS[v${i}]`);
const aparts = keep.map(([s, e], i) => { const d = (e - s) / 30; return `[0:a]atrim=start=${(s / 30).toFixed(4)}:end=${(e / 30).toFixed(4)},asetpts=PTS-STARTPTS${i > 0 ? ",afade=t=in:st=0:d=0.012" : ""}${i < keep.length - 1 ? `,afade=t=out:st=${Math.max(0, d - 0.012).toFixed(4)}:d=0.012` : ""}[a${i}]`; });
const cat = keep.map((_, i) => `[v${i}]`).join("") + `concat=n=${keep.length}:v=1:a=0[v];` + keep.map((_, i) => `[a${i}]`).join("") + `concat=n=${keep.length}:v=0:a=1[a]`;
const ff = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-threads", "4", ...args], { encoding: "utf8" }); if (r.status !== 0) { console.error(r.stderr); process.exit(1); } };
console.log(`cut_blocks: ${spans.length} blocks (${(spans.reduce((s, [a, b]) => s + b - a, 0) / 30).toFixed(2)} s) → ${outName}`);
ff(["-hwaccel", "cuda", "-i", src, "-filter_complex", [...parts, ...aparts, cat].join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "16", "-b:v", "0", "-c:a", "aac", "-b:a", "256k", out]);
ff(["-i", out, "-vn", "-ac", "1", "-ar", "48000", path.join(T, "cut.wav")]);
ff(["-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")]);
for (const [a, b] of [...spans].reverse()) {
  const r = spawnSync(process.execPath, ["tools/cut_block.mjs", p, `f${a}`, `f${b}`, ...rest], { encoding: "utf8", env: { ...process.env, CUT_BLOCK_JSON_ONLY: "1", CUT_BLOCK_OUT: outName } });
  console.log((r.stdout || "").trim().split("\n").slice(-2).join(" | ")); if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
}
// older versions (each ~1.7 GB): keep only the new one and the one before it
for (let k = 1; k < n - 1; k++) for (const f of fs.readdirSync("public").filter((x) => x.startsWith(`${p}_cut_s_b${k}.`) || x.startsWith(`${p}_cut_s_b${k}_prev_`))) { try { fs.rmSync(path.join("public", f)); } catch { /* open in Studio */ } }
console.log("cut_blocks: DONE");
