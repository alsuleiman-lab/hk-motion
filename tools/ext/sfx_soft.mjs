// تهدئة مؤثر صوتي للموشن التوضيحي المستقل: «ما تكون شديدة وعالية» (أمر المستخدم 2026-11-17).
//   node tools/ext/sfx_soft.mjs <ملف-صوت> [<مخرج.wav>] [--peak -22]
// الخطوات: قص الترددات الحادة (مرشح علوي عند 9000 هرتز ومرشح سفلي عند 80)، تلاشٍ قصير في الطرفين، ثم خفض القمة إلى الحد
// (الافتراضي −22 dBFS، أي أهدأ بكثير من الصوت البشري) ولا يرفع مؤثراً أهدأ منه. يطبع القمة والمتوسط قبل وبعد.
import { spawnSync } from "node:child_process";
import path from "node:path";

const a = process.argv.slice(2).filter((x, i, arr) => !(x === "--peak" || arr[i - 1] === "--peak"));
const peakTarget = Number(process.argv.includes("--peak") ? process.argv[process.argv.indexOf("--peak") + 1] : -22);
const [src, out0] = a;
if (!src) { console.error("usage: node tools/ext/sfx_soft.mjs <ملف> [<مخرج.wav>] [--peak -22]"); process.exit(2); }
const out = out0 ?? src.replace(/\.[^.]+$/, "") + "_soft.wav";

const measure = (file, filter = "") => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-threads", "4", "-i", file, ...(filter ? ["-af", filter + ",volumedetect"] : ["-af", "volumedetect"]), "-f", "null", "-"], { encoding: "utf8" });
  const t = r.stderr || "";
  const mean = /mean_volume:\s*(-?[\d.]+)/.exec(t), max = /max_volume:\s*(-?[\d.]+)/.exec(t);
  return { mean: mean ? Number(mean[1]) : NaN, peak: max ? Number(max[1]) : NaN };
};
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" }).stdout) || 1;
const shaping = `highpass=f=80,lowpass=f=9000,afade=t=in:d=0.005,afade=t=out:st=${Math.max(0, dur - 0.04).toFixed(3)}:d=0.04`;
const before = measure(src);
const shaped = measure(src, shaping);
const gain = Math.min(0, peakTarget - shaped.peak);   // لا رفع أبداً
const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-threads", "4", "-i", src, "-af", `${shaping},volume=${gain.toFixed(2)}dB`, "-ar", "48000", "-ac", "2", out], { encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const after = measure(out);
console.log(`قبل: قمة ${before.peak} dB، متوسط ${before.mean} dB`);
console.log(`بعد: قمة ${after.peak} dB، متوسط ${after.mean} dB (حد القمة ${peakTarget})`);
console.log(`الناتج: ${path.resolve(out)}`);
