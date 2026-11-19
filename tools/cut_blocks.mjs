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
/* --snap-words: each span moves to the gaps between words first (tools/cut_block.mjs decides, the Studio's «حذف» button relies on it); then every cut point is checked (silence, no word tail)
   BEFORE any video is touched: a refusal costs nothing */
const frameArgs = (s2) => [`f${s2[0]}`, `f${s2[1]}`];
if (rest.includes("--snap-words")) {
  for (const s2 of spans) {
    const r0 = spawnSync(process.execPath, ["tools/cut_block.mjs", p, ...frameArgs(s2), "--snap-words", ...rest.filter((x) => x !== "--snap-words")], { encoding: "utf8", env: { ...process.env, CUT_BLOCK_SNAP_ONLY: "1" } });
    const m0 = (r0.stdout || "").match(/^SNAP (.*)$/m);
    if (!m0) { console.error((r0.stdout || "") + (r0.stderr || "")); process.exit(1); }
    const { fA: nA, fB: nB } = JSON.parse(m0[1]); s2[0] = nA; s2[1] = nB;
  }
  spans.sort((x, y) => x[0] - y[0]);
  for (let i = 0; i < spans.length; i++) if (!(spans[i][1] > spans[i][0]) || (i && spans[i][0] < spans[i - 1][1])) { console.error("✘ spans overlap after snapping to the words"); process.exit(2); }
}
/* --snap-words also moves every cut point to the NEAREST real silence (within ±0.5 s, quieter than −40 dB measured like tools/cut_block.mjs): the word times of the transcript are not
   exact to a frame, and a point a few frames off a gap used to be refused (the Studio's «حذف» button would then do nothing). Not found = left where it is, the check below refuses it. */
if (rest.includes("--snap-words")) {
  const lv = (() => { try { const b = fs.readFileSync(path.join(".tmp", p, "cut16k.wav")); let o = 12; while (o < b.length - 8 && b.toString("ascii", o, o + 4) !== "data") o += 8 + b.readUInt32LE(o + 4); const d = o + 8, sr = 16000;
    return (t) => { const i0 = d + Math.max(0, Math.floor(t * sr)) * 2, n = 320; let e = 0, k = 0; for (let i = i0; i < Math.min(b.length - 1, i0 + n * 2); i += 2) { const v = b.readInt16LE(i); e += v * v; k++; } return k ? 10 * Math.log10(e / k + 1e-9) - 90.3 : -99; }; } catch { return null; } })();
  if (lv) {
    const loud = (t) => Math.max(lv(t - 0.03), lv(t - 0.01), lv(t + 0.01));
    const quiet = (f0) => { if (loud(f0 / 30) <= -41) return f0; for (let k = 1; k <= 15; k++) for (const f1 of [f0 - k, f0 + k]) if (f1 >= 0 && loud(f1 / 30) <= -41) return f1; return f0; };
    for (const s2 of spans) { const na = quiet(s2[0]), nb = quiet(s2[1]); if (nb > na) { if (na !== s2[0] || nb !== s2[1]) console.log(`cut_blocks: cut points moved to the nearest silence: ${(s2[0] / 30).toFixed(2)}→${(na / 30).toFixed(2)}, ${(s2[1] / 30).toFixed(2)}→${(nb / 30).toFixed(2)}`); s2[0] = na; s2[1] = nb; } }
    for (let i = 0; i < spans.length; i++) if (!(spans[i][1] > spans[i][0]) || (i && spans[i][0] < spans[i - 1][1])) { console.error("✘ spans overlap after moving to silence"); process.exit(2); }
  }
}
for (const s2 of spans) {
  const r1 = spawnSync(process.execPath, ["tools/cut_block.mjs", p, ...frameArgs(s2), ...rest.filter((x) => x !== "--snap-words")], { encoding: "utf8", env: { ...process.env, CUT_BLOCK_CHECK_ONLY: "1", CUT_BLOCK_JSON_ONLY: "1" } });
  if (r1.status !== 0) { console.error((r1.stdout || "") + (r1.stderr || "")); console.error("✘ cut_blocks: a cut point is refused — nothing was changed"); process.exit(1); }
}
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
/* SMART CUT (user 2026-11-19, «كما يعمل بريمير برو»): no re-encode of the whole video. Only the frames that share a GOP with a cut point (about a second per join) are encoded again, every
   whole GOP in between is copied packet for packet (tools/cut_splice.py): minutes become seconds and the rest of the video does not change by a bit. The light Studio copy is spliced the same
   way, so it is ready with the new file. A file made by another encoder (exit 4) or no usable GPU (exit 3) falls back to the full encode below. CUT_BLOCKS_FULL=1 forces the full encode. */
const PYG = "C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe", keepArg = keep.filter(([s, e]) => e > s).map(([s, e]) => `${s}-${e}`).join(",");
let spliced = false;
if (!process.env.CUT_BLOCKS_FULL) {
  const r = spawnSync(PYG, ["tools/cut_splice.py", src, out, "--keep", keepArg, "--audio-from", src], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  const line = (r.stdout || "").trim().split("\n").filter((l) => /^cut_splice/.test(l)).slice(-1)[0] ?? "";
  if (r.status === 0) {
    spliced = true; console.log(line);
    try {   // the light copy of the old file (same frames) spliced the same way, then registered for the new file
      const LIST = path.join("data", "preview_proxies.json"), px = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : {}, rel = path.relative("public", src).replace(/\\/g, "/"), v0 = px[rel];
      const base0 = src.replace(/\.mp4$/, ""), pv0 = `${base0}_prev_${v0}.mp4`;
      if (v0 && fs.existsSync(pv0)) {
        const v1 = Math.floor(fs.statSync(out).mtimeMs / 1000).toString(36), base1 = out.replace(/\.mp4$/, ""), pv1 = `${base1}_prev_${v1}.mp4`, pa1 = `${base1}_prev_${v1}.m4a`;
        const rp = spawnSync(PYG, ["tools/cut_splice.py", pv0, pv1, "--keep", keepArg, "--kind", "proxy"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
        if (rp.status === 0) {
          ff(["-i", out, "-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", pa1]);
          for (const f2 of fs.readdirSync("public").filter((x) => x.startsWith(`${p}_cut_s_b${n}_prev_`) && !x.startsWith(`${p}_cut_s_b${n}_prev_${v1}.`))) { try { fs.rmSync(path.join("public", f2)); } catch { /* open */ } }
          px[`${outName}`] = v1; fs.writeFileSync(LIST, JSON.stringify(px, null, 1)); console.log("cut_blocks: light copy spliced →", path.basename(pv1));
        } else console.log("cut_blocks: the light copy was not spliced (" + (rp.stdout || "").trim().split("\n").slice(-1)[0] + ") — stage check makes a new one");
      }
    } catch (e) { console.log("cut_blocks: light copy skipped:", e.message); }
  } else console.log(`cut_blocks: smart cut not used (${line || "exit " + r.status}) → full encode`);
}
if (!spliced) ff(["-hwaccel", "cuda", "-i", src, "-filter_complex", [...parts, ...aparts, cat].join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "16", "-b:v", "0", "-c:a", "aac", "-b:a", "256k", out]);
/* ONE NAME: the new cut takes the old file's place (tools/hk_inplace.mjs); only when that is refused does it stay as <p>_cut_s_b<n>.mp4 */
let outFinal = outName, outPath = out;
if (!process.env.CUT_BLOCKS_VERSIONED && fs.existsSync(src) && path.resolve(src) !== path.resolve(out)) {
  const { swapInPlace } = await import("./hk_inplace.mjs");
  if (swapInPlace({ fresh: out, target: src })) { outFinal = path.basename(src); outPath = src; console.log(`cut_blocks: the new cut replaced ${outFinal} (no extra version)`); }
}
ff(["-i", outPath, "-vn", "-ac", "1", "-ar", "48000", path.join(T, "cut.wav")]);
ff(["-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")]);
for (const [a, b] of [...spans].reverse()) {
  const r = spawnSync(process.execPath, ["tools/cut_block.mjs", p, `f${a}`, `f${b}`, ...rest.filter((x) => x !== "--snap-words" && x !== "--force"), "--force"], { encoding: "utf8", env: { ...process.env, CUT_BLOCK_JSON_ONLY: "1", CUT_BLOCK_OUT: outFinal } });
  console.log((r.stdout || "").trim().split("\n").slice(-2).join(" | ")); if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
}
// (the silence gate ran above on the audio BEFORE the cut; the data pass below runs on the audio AFTER it, so it must not judge again: --force)
// older versions (each ~1.7 GB): keep only the new one and the one before it
for (let k = 1; k < n - 1; k++) for (const f of fs.readdirSync("public").filter((x) => x.startsWith(`${p}_cut_s_b${k}.`) || x.startsWith(`${p}_cut_s_b${k}_prev_`))) { try { fs.rmSync(path.join("public", f)); } catch { /* open in Studio */ } }
console.log("cut_blocks: DONE");
