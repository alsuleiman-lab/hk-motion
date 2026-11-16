// One exact part of a YouTube video for the montage (rules §8.4; user 2026-11-16 «تنزيل جزء محدد من فيديو يوتيوب»).
//   node tools/yt_section.mjs <url> <from> <to> --p <project> [--name clip] [--height 1080]
//   from / to: seconds or m:ss or h:mm:ss. Writes public/<p>/yt_<name>.mp4 (30 fps, H.264 NVENC, AAC) and logs it in public/<p>/yt_sources.json
//   ({file, url, title, channel, from, to}) for the source credit. Frame-exact: yt-dlp only resolves the stream URLs; ffmpeg seeks the input and re-encodes on the GPU.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : d);
const [url, a, b] = argv.filter((x, i) => !x.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const p = opt("p", ""), H = Number(opt("height", "1080"));
const sec = (t) => String(t).split(":").map(Number).reduce((s, x) => s * 60 + x, 0);
if (!url || a == null || b == null || !p) { console.error("usage: node tools/yt_section.mjs <url> <from> <to> --p <project> [--name clip]"); process.exit(2); }
const from = sec(a), to = sec(b);
if (!(to > from)) { console.error("✘ <to> must be after <from>"); process.exit(2); }

const meta = spawnSync("yt-dlp", ["--no-warnings", "-f", `bestvideo[height<=${H}][vcodec^=avc1]/bestvideo[height<=${H}]`, "--print", "%(title)s\t%(channel)s\t%(id)s", "-g", url], { encoding: "utf8", windowsHide: true });
const lines = (meta.stdout || "").trim().split(/\r?\n/);
const aud = spawnSync("yt-dlp", ["--no-warnings", "-f", "bestaudio[ext=m4a]/bestaudio", "-g", url], { encoding: "utf8", windowsHide: true });
const vUrl = lines.find((l) => l.startsWith("http")), aUrl = (aud.stdout || "").trim().split(/\r?\n/).find((l) => l.startsWith("http"));
const [title = "", channel = "", id = "yt"] = (lines.find((l) => l.includes("\t")) ?? "").split("\t");
if (!vUrl) { console.error("✘ yt-dlp could not resolve the video: " + (meta.stderr || "").trim().split("\n").pop()); process.exit(1); }

const name = opt("name", `${id}_${Math.round(from)}`), dir = path.join("public", p), out = path.join(dir, `yt_${name}.mp4`);
fs.mkdirSync(dir, { recursive: true });
const seek = ["-ss", String(from), "-to", String(to)];
const args = ["-y", "-v", "error", "-threads", "4", "-hwaccel", "cuda", ...seek, "-i", vUrl, ...(aUrl ? [...seek, "-i", aUrl, "-map", "0:v:0", "-map", "1:a:0"] : ["-map", "0:v:0"]),
  "-r", "30", "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "19", "-b:v", "0", "-pix_fmt", "yuv420p", ...(aUrl ? ["-c:a", "aac", "-b:a", "192k"] : []), "-movflags", "+faststart", out];
console.log(`[yt_section] ${title} — ${a} → ${b} (${(to - from).toFixed(1)} s)`);
const r = spawnSync("ffmpeg", args, { stdio: "inherit", windowsHide: true });
if (r.status !== 0 || !fs.existsSync(out)) { console.error("✘ ffmpeg failed"); process.exit(1); }
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" }).stdout);
const logF = path.join(dir, "yt_sources.json"), log = fs.existsSync(logF) ? JSON.parse(fs.readFileSync(logF, "utf8")) : [];
log.push({ file: out.replaceAll("\\", "/").replace(/^public\//, ""), url, title, channel, from, to });
fs.writeFileSync(logF, JSON.stringify(log, null, 1));
console.log(`✔ ${out} · ${dur.toFixed(2)} s (asked ${(to - from).toFixed(2)} s) · source logged in ${logF} — look at it before placing (women, faces), then a VSlot item`);
