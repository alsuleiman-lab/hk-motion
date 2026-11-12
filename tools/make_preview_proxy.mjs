// light Studio-only proxy of a heavy video: public/<name>_prev_<v>.mp4 (960 wide, short GOP, faststart) + public/<name>_prev_<v>.m4a (audio only);
// <v> = the source's modified time (base36 seconds) so a rebuilt proxy has a NEW url: a browser can never mix bytes of an old copy with the new one (silent/stuck audio, 2026-11-09).
// usage: node tools/make_preview_proxy.mjs --auto <project>   (the project's heavy mp4s whose proxy is missing or stale; runs inside `stage.mjs check`; without <project> = all of public/)
//        node tools/make_preview_proxy.mjs gaza_floods_cut_s.mp4 [gaza_floods/clip_rain.mp4 ...]   (paths relative to public/)
// src/studioProxy.ts swaps the proxy in Studio/Player only (map: data/preview_proxies.json {"<rel>": "<v>"}); renders keep the full file.
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
const LIST = "data/preview_proxies.json";
let list = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : {};
if (Array.isArray(list)) list = {};   // old format (unversioned names): rebuilt below
const MIN_MB = 100;   // --auto: every public/**/*.mp4 over this size (not a proxy, not extracted frames, not an unsmoothed _cut that has a _cut_s)
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (["fr", "node_modules"].includes(e.name) ? [] : walk(`${d}/${e.name}`)) : [`${d}/${e.name}`]);
const ver = (f) => Math.floor(fs.statSync(f).mtimeMs / 1000).toString(36);
const auto = process.argv.includes("--auto");
const proj = auto ? process.argv.slice(2).find((a) => !a.startsWith("--")) : undefined;   // --auto <project>: only that project's files (public/<project>_* and public/<project>/*)
const files = auto
  ? walk("public").filter((f) => !proj || f.startsWith(`public/${proj}_`) || f.startsWith(`public/${proj}/`)).filter((f) => /\.mp4$/i.test(f) && !/_prev(_\w+)?\.mp4$/i.test(f) && !/_src\.mp4$/i.test(f) && !(/_cut\.mp4$/i.test(f) && fs.existsSync(f.replace(/\.mp4$/i, "_s.mp4"))) && fs.statSync(f).size > MIN_MB * 1e6)
      .filter((f) => list[f.slice("public/".length)] !== ver(f) || !fs.existsSync(f.replace(/\.mp4$/i, `_prev_${ver(f)}.mp4`))).map((f) => f.slice("public/".length))
  : process.argv.slice(2);
if (auto && !files.length) { console.log("preview proxies up to date"); process.exit(0); }
if (!files.length) { console.error("usage: make_preview_proxy.mjs <file relative to public/> ..."); process.exit(1); }
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* below-normal priority so the machine stays smooth */ }
for (const rel of files) {
  const src = `public/${rel}`;
  if (!fs.existsSync(src)) { console.error("missing", src); process.exit(1); }
  const base = src.replace(/\.mp4$/, ""), v = ver(src);
  const vOut = `${base}_prev_${v}.mp4`, aOut = `${base}_prev_${v}.m4a`;
  const run = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" }); if (r.status !== 0) throw new Error("ffmpeg failed: " + rel); };
  run(["-hwaccel", "cuda", "-i", src, "-an", "-vf", "scale=960:-2", "-r", "30", "-c:v", "h264_nvenc", "-preset", "p4", "-rc", "vbr", "-cq", "30", "-b:v", "0", "-g", "15", "-bf", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", vOut]);
  const hasAudio = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", src], { encoding: "utf8" }).stdout.trim();
  if (hasAudio) run(["-i", src, "-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", aOut]);
  // older copies of this proxy (other versions / the unversioned names) are deleted
  const dir = base.slice(0, base.lastIndexOf("/")), stem = base.slice(base.lastIndexOf("/") + 1);
  for (const f of fs.readdirSync(dir)) if (f.startsWith(stem + "_prev") && /\.(mp4|m4a)$/.test(f) && !f.startsWith(`${stem}_prev_${v}.`)) fs.unlinkSync(`${dir}/${f}`);
  list[rel] = v;
  console.log(rel, "→", (fs.statSync(vOut).size / 1e6).toFixed(0) + " MB" + (hasAudio ? " + m4a " + (fs.statSync(aOut).size / 1e6).toFixed(0) + " MB" : ""), "v=" + v);
  fs.writeFileSync(LIST, JSON.stringify(list, null, 1));
}
