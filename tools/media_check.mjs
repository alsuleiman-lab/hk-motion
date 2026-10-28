// Decode-test a media file BEFORE using it in a composition (user rule 2026-10-20: no error screens).
//   node tools/media_check.mjs <file.mp4> [--fix]
// Decodes audio and video fully with ffmpeg (-v error); any message = a bad packet. With --fix writes <name>_fixed.mp4 (video copied, audio re-encoded to AAC 192k)
// NEVER over the same name (a same-name rewrite while Studio is open is what breaks playback). Exit 1 if problems were found.
import { spawnSync } from "node:child_process";
import path from "node:path";

const file = process.argv[2], fix = process.argv.includes("--fix");
if (!file) { console.error("usage: node tools/media_check.mjs <file> [--fix]"); process.exit(2); }
const run = (args) => spawnSync("ffmpeg", ["-hide_banner", "-v", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
const has = (k) => spawnSync("ffprobe", ["-v", "error", "-select_streams", k, "-show_entries", "stream=index", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout.trim() !== "";
const a = has("a") ? run(["-i", file, "-vn", "-f", "null", "-"]).stderr.trim() : "";
const v = has("v") ? run(["-i", file, "-an", "-f", "null", "-"]).stderr.trim() : "";
if (!has("a")) console.log("· لا مسار صوت (غير مفحوص)");
console.log(a ? `✘ صوت: ${a.split("\n").slice(0, 3).join(" | ")}` : "✔ الصوت يُفكّ بلا أخطاء");
console.log(v ? `✘ فيديو: ${v.split("\n").slice(0, 3).join(" | ")}` : "✔ الفيديو يُفكّ بلا أخطاء");
if ((a || v) && fix) {
  const out = path.join(path.dirname(file), path.basename(file, path.extname(file)) + "_fixed.mp4");
  const r = spawnSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", file, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", out], { encoding: "utf8" });
  console.log(r.status === 0 ? `أُنشئ ملف مصحَّح: ${out} (اعتمد اسمه الجديد في الكود، ولا تستبدل الأصلي)` : `فشل الإصلاح: ${r.stderr}`);
}
process.exit(a || v ? 1 : 0);
