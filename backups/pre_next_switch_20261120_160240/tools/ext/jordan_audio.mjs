// يدمج صوت الراوي (بعد مقدّمة 0.5ث) مع فرشة ضجيج غرفة -58 dBFS ومؤثرات هادئة جداً قليلة في ملف واحد: public/jordan/mix.wav
//   node tools/ext/jordan_audio.mjs <narration.wav>
// المؤثرات (مكتبة .tmp/tay_sfx، CC0، مُهدَّأة بـ sfx_soft): باب زنزانة عند هبوط القضبان (قورشة، بكر)، وبوابة حديد مع سلسلة خفيفة عند إغلاق مبنى (الإخوان، الألباني).
// الحدود: قمة المؤثر ≤ -28 dBFS (≤ 0.06 من الكلام)، أربع لحظات فقط (≤ 6 في الدقيقة) وبينها أكثر من ثانية ونصف.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const src = fs.readFileSync(path.join(ROOT, "src/jordanCues.ts"), "utf8");
const CUE = JSON.parse(/export const CUE = (\{[^}]*\})/.exec(src)[1]);
const W = JSON.parse(/export const W = (\{[^}]*\})/.exec(src)[1]);
const narr = process.argv[2];
if (!narr) { console.error("usage: node tools/ext/jordan_audio.mjs <narration.wav>"); process.exit(2); }
const at = (i, f) => CUE.c[i] + (CUE.e[i] - CUE.c[i]) * f;
const SFX = path.join(ROOT, ".tmp/tay_sfx");
const OUT = path.join(ROOT, "public/jordan/mix.wav");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const soft = (id, peak) => {
  const s = path.join(SFX, `fs-${id}.mp3`), d = path.join(SFX, `jsoft_${id}.wav`);
  const r = spawnSync("node", [path.join(ROOT, "tools/ext/sfx_soft.mjs"), s, d, "--peak", String(peak)], { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  return d;
};
const FILES = { gate: [682775, -28, 0.625], cell: [214233, -30, 1.505], chain: [593458, -36, 0.0] };
const P = Object.fromEntries(Object.entries(FILES).map(([k, [id, pk]]) => [k, soft(id, pk)]));
const EV = [
  ["cell", W.bars + 0.1, FILES.cell[2]],
  ["gate", W.seal + 0.8, FILES.gate[2]], ["chain", W.seal + 0.85, 0],
  ["gate", W.closed + 0.8, FILES.gate[2]], ["chain", W.closed + 0.85, 0],
  ["cell", W.many + 0.4, FILES.cell[2]],
];
const dur = (f) => parseFloat(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout);
const TOTAL = CUE.total;
const PRE = 0.5, BED_DB = -31.6;
const inputs = ["-i", narr];
const parts = [`[0:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${PRE * 1000}|${PRE * 1000},apad=whole_dur=${TOTAL.toFixed(2)}[v]`];
const labels = ["[v]", "[bed]"];
parts.push(`anoisesrc=d=${TOTAL.toFixed(2)}:c=pink:r=48000:a=0.5:seed=11,lowpass=f=2600,highpass=f=90,volume=${BED_DB}dB,aformat=channel_layouts=stereo,afade=t=in:d=0.15,afade=t=out:st=${(TOTAL - 1.8).toFixed(2)}:d=1.8[bed]`);
EV.forEach(([k, t, off], i) => {
  inputs.push("-i", P[k]);
  const ms = Math.round(Math.max(0, t - off) * 1000);
  parts.push(`[${i + 1}:a]aformat=channel_layouts=stereo,afade=t=in:d=0.05,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
parts.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=first,alimiter=limit=0.95[o]`);
const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-threads", "4", ...inputs, "-filter_complex", parts.join(";"), "-map", "[o]", "-ar", "48000", "-ac", "2", OUT], { encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const m = spawnSync("ffmpeg", ["-hide_banner", "-i", OUT, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
console.log("كُتب", OUT, "| مدة", dur(OUT).toFixed(2), "|", (/mean_volume:\s*(-?[\d.]+)/.exec(m) || [])[0], "|", (/max_volume:\s*(-?[\d.]+)/.exec(m) || [])[0]);
