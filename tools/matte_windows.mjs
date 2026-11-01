// Clean matte for every isolation window of a data spec (user 2026-10-31: «هذا يسمى عزل خلفية؟» — matte_cache's clean-up heuristics cut his body into blocks).
//   node tools/matte_windows.mjs data/specs/<p>.json [--force]
// For each `behind` window and each `mini` item: trim the cut at the window start (exact frame), raw RVM on the GPU (tools/matte_gpu.py --no-clean --ratio 0.25),
// then one contrast curve that drops the half-transparent chair/room (alpha < 0.45 → 0, > 0.8 → 1); the desk strip at the bottom (y ≥ 990) stays the original video (user 2026-10-31). Writes public/<p>/mt/m_<i>.mp4 and sets
// `matte: { src, start: <window start> }` on the window (matte frame 0 = cut frame round(start × 30)). Windows that already have a matte are kept unless --force.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2), specF = argv.find((a) => a.endsWith(".json")), force = argv.includes("--force");
if (!specF) { console.error("usage: node tools/matte_windows.mjs data/specs/<p>.json [--force]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8")), p = spec.id, cut = path.join("public", spec.cut);
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";
const T = path.join(".tmp", p, "mt"), out = path.join("public", p, "mt");
fs.mkdirSync(T, { recursive: true }); fs.mkdirSync(out, { recursive: true });
const low = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); return r; };
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
const wins = [...(spec.behind ?? []), ...spec.items.filter((i) => i.t === "mini")];
let n = 0, done = 0;
for (const w of wins) {
  const i = n++;
  if (w.matte && !force) continue;
  const s = (Math.round(w.from * 30) / 30).toFixed(4), d = (w.to - w.from + 0.3).toFixed(3), src = path.join(T, "w.mp4"), raw = path.join(T, "w_raw.mp4"), dst = path.join(out, `w_${w.from}_${w.to}.mp4`);   // a new name per window: Studio may hold the old file open
  let r = low("ffmpeg", ["-v", "error", "-y", "-ss", s, "-i", cut, "-t", d, "-an", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "constqp", "-qp", "12", "-g", "15", "-threads", "4", src]);
  if (r.status !== 0) { console.error(`✘ trim ${w.from}: ${r.stderr}`); process.exit(1); }
  r = low(PY, ["-X", "utf8", "tools/matte_gpu.py", src, raw, "--ratio", "0.25", "--no-clean"]);
  if (r.status !== 0) { console.error(`✘ matte ${w.from}: ${r.stdout}${r.stderr}`); process.exit(1); }
  r = low("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "format=gray,curves=all='0/0 0.45/0 0.8/1 1/1',drawbox=x=0:y=990:w=iw:h=ih-990:color=white:t=fill,format=yuv420p", "-c:v", "h264_nvenc", "-preset", "p5", "-rc", "constqp", "-qp", "10", dst]);
  if (r.status !== 0) { console.error(`✘ curve ${w.from}: ${r.stderr}`); process.exit(1); }
  w.matte = { src: `${p}/mt/w_${w.from}_${w.to}.mp4`, start: w.from };
  done++;
}
fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
console.log(`matte_windows: ${done} new / ${wins.length} windows → ${out} (spec updated)`);
