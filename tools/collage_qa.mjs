// QA for a finished collage B-roll clip (ideas from gbro-collage-broll / VOX-COLLAGE-BROLL QA playbook, MIT) — run before showing it.
//   node tools/collage_qa.mjs <clip.mp4> --still <confirmed_still.png> --bg <RRGGBB> [--out <dir>]
// Writes: contact-sheet.jpg (one frame per second), end-frame-comparison.jpg (confirmed still | video last frame); prints PASS/FLAG for:
//   works for portrait 9:16 (1080x1920) and landscape 16:9 (1920x1080). First frame ≈ empty colour field (PSNR vs flat --bg ≥ 24 dB), zero audio streams, duration 3–6 s, size. Never overwrites old sheets (adds _v2, _v3…).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const clip = process.argv[2];
const arg = (n) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : undefined);
const still = arg("still"), bg = arg("bg"), outDir = arg("out") ?? path.dirname(clip);
if (!clip || !bg) { console.error("usage: node tools/collage_qa.mjs <clip.mp4> --still <png> --bg <RRGGBB> [--out dir]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 26 });
const fresh = (name) => { let p = path.join(outDir, name), i = 2; while (fs.existsSync(p)) p = path.join(outDir, name.replace(/(\.\w+)$/, `_v${i++}$1`)); return p; };
const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", clip]).stdout);
const v = probe.streams.find((s) => s.codec_type === "video"), audio = probe.streams.filter((s) => s.codec_type === "audio").length, dur = Number(probe.format.duration);
const results = [];
const check = (ok, msg) => { results.push(ok); console.log(`${ok ? "PASS" : "FLAG"}  ${msg}`); };
check(dur >= 3 && dur <= 6, `المدة ${dur.toFixed(2)}ث (المتوقع نحو 5)`);
check(audio === 0, audio === 0 ? "لا مسار صوت (صامت)" : `يوجد ${audio} مسار صوت — احذفه: ffmpeg -i in.mp4 -map 0:v:0 -c:v copy -an out.mp4`);
const land = v.width > v.height;
console.log(`      ${v.width}x${v.height} (${land ? "عرضي" : "طولي"})`);
// first frame vs flat colour (PSNR)
const first = fresh("first-frame.png");
run("ffmpeg", ["-v", "error", "-y", "-i", clip, "-frames:v", "1", first]);
const ps = run("ffmpeg", ["-hide_banner", "-i", first, "-f", "lavfi", "-i", `color=c=0x${bg}:s=${v.width}x${v.height}:d=1:r=1`, "-lavfi", "psnr", "-frames:v", "1", "-f", "null", "-"]).stderr;
const m = ps.match(/average:([\d.]+|inf)/), psnr = m ? (m[1] === "inf" ? 99 : Number(m[1])) : 0;
check(psnr >= 24, `الإطار الأول ${psnr >= 24 ? "قريب من أرضية فارغة" : "ليس فارغاً"} (PSNR ${psnr.toFixed(1)} dB؛ المطلوب ≥ 24؛ حواف ورق صغيرة مقبولة)`);
// contact sheet: 1 fps
const sheet = fresh("contact-sheet.jpg"), n = Math.max(1, Math.ceil(dur));
run("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `fps=1,scale=${land ? 360 : 270}:-2,tile=${n}x1`, "-frames:v", "1", sheet]);
console.log("لوحة اللقطات:", sheet);
// end-frame comparison
if (still && fs.existsSync(still)) {
  const last = fresh("video-last-frame.jpg"), cmp = fresh("end-frame-comparison.jpg");
  run("ffmpeg", ["-v", "error", "-y", "-sseof", "-0.1", "-i", clip, "-frames:v", "1", last]);
  run("ffmpeg", ["-v", "error", "-y", "-i", still, "-i", last, "-filter_complex", `[0]scale=${land ? 800 : 540}:-2[a];[1]scale=${land ? 800 : 540}:-2[b];[a][b]hstack`, cmp]);
  console.log("مقارنة الإطار الأخير:", cmp, "(انظر إليها: انحراف بسيط لا يغيّر المعنى = مقبول، لا تعد التوليد من أجله)");
}
console.log("\nبالعين أيضاً: القطع تدخل واحدة بعد أخرى (لا تلاشٍ شامل)، لا قطع ولا تقريب ولا مجسمات، لا نص مزيف ولا شعار ولا واجهة، لا نساء، لا تغطية لوجه الشيخ.");
process.exit(results.every(Boolean) ? 0 : 1);
