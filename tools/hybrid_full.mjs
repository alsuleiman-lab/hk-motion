// FULL GPU hybrid render of the lesson in chunks (so a crash or a Chrome memory leak only costs one chunk), then audio + mux.
//   node tools/hybrid_full.mjs --orient landscape|portrait --out out/tir_landscape.mp4 [--chunk 4000] [--from 0] [--to 20132]
// Each chunk: tools/hybrid_render.mjs (Remotion graphics only → socket → GPU compositor → NVENC). Finished chunks are kept in .tmp/hybrid/<orient>/ and skipped on re-run.
import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const root = "S:/AI_Tools/Remotion_Workspace";
const orient = arg("orient", "landscape");
const out = path.resolve(root, arg("out", `C:/Users/mshms/Videos/جاهز/${arg("project", "tir") === "az" ? "az" : "tir"}_${orient}.mp4`)); // user rule 2026-10-16: export DIRECTLY to جاهز, never to out/ first
const chunk = Number(arg("chunk", 4000));
const AZ = arg("project", "tir") === "az";
const SHORT = process.argv.includes("--short");
let total = AZ ? 21015 : JSON.parse(execFileSync("node", ["-e", "console.log(Math.ceil(require('./public/tir_map.json').duration*30))"], { cwd: root }).toString());
if (SHORT) {
  execFileSync("npx", ["esbuild", "src/tirShort.ts", "--bundle", "--platform=node", "--format=cjs", `--outfile=${root}/.tmp/hybrid/tirShort.cjs`, "--log-level=error"], { cwd: root, shell: true });
  total = (await import("module")).createRequire(import.meta.url)(`${root}/.tmp/hybrid/tirShort.cjs`).SHORT_FRAMES;
}
const mode = (SHORT ? "short-" : "") + orient;
const from = Number(arg("from", 0)), to = Math.min(Number(arg("to", total - 1)), total - 1);
const dir = path.join(root, ".tmp/hybrid", (AZ ? "az_" : "") + orient + (SHORT ? "_short" : ""));
fs.mkdirSync(dir, { recursive: true });
const log = (m) => console.log(`[full ${new Date().toLocaleTimeString()}] ${m}`);

const parts = [];
for (let s = from; s <= to; s += chunk) {
  const e = Math.min(s + chunk - 1, to);
  const f = path.join(dir, `part_${String(s).padStart(6, "0")}.mp4`);
  parts.push(f);
  if (fs.existsSync(f) && fs.statSync(f).size > 100000) { log(`chunk ${s}-${e} already done`); continue; }
  log(`chunk ${s}-${e}`);
  const r = spawnSync("node", ["tools/hybrid_render.mjs", "--orient", orient, ...(SHORT ? ["--short"] : []), ...(AZ ? ["--project", "az"] : []), "--start", String(s), "--end", String(e), "--no-audio", "--out", f], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) { log("chunk failed — fix and re-run (finished chunks are kept)"); process.exit(1); }
}
// concat video parts (stream copy), then the audio of the whole range
const list = path.join(dir, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
const vid = path.join(dir, "video_all.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", vid]);
log("mixing audio (ffmpeg)…");
const aud = path.join(dir, "audio.aac");
execFileSync("npx", ["esbuild", AZ ? "src/hybrid/exportAz.ts" : "src/hybrid/export.ts", "--bundle", "--platform=node", "--format=cjs", "--external:remotion", "--external:react", `--outfile=${root}/.tmp/hybrid/export.cjs`, "--log-level=warning"], { cwd: root, shell: true, stdio: "inherit" });
execFileSync("node", [`${root}/.tmp/hybrid/export.cjs`, `${root}/.tmp/hybrid/timeline_audio.json`, String(from), String(to), `${root}/.tmp/hybrid/clipdims.json`, mode], { cwd: root, stdio: "inherit" });
execFileSync("node", ["tools/hybrid_audio.mjs", `${root}/.tmp/hybrid/timeline_audio.json`, aud, String(from), String(to)], { cwd: root, stdio: "inherit" });
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", vid, "-i", aud, "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", out]);
spawnSync("node", ["tools/clean_temp.mjs"], { cwd: root, stdio: "inherit" });
log(`DONE → ${out}`);

