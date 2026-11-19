// يدمج صوت الراوي مع مؤثرات هادئة جداً في ملف واحد لفيديو «سجن ابن تيمية»: public/tay/mix.wav
//   node tools/ext/tay_audio.mjs
// المؤثرات (CC0، مُهدَّأة بـ sfx_soft: قمة منخفضة ومرشحات تقصّ الحدة): حوافر خيل عند التتار، وإغلاق بوابة حديدية عند «فسجن»،
// وسلسلة خفيفة، وباب زنزانة عند كل سجن، وتشقق خشب عند كسر الخاتمين. توقيتها من جدول الإشارات (src/tayCues.ts).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const { CUES: c, AUDIO_SEC } = await import(pathToFileURL(path.join(ROOT, "src/tayCues.ts")).href);
const SFX = path.join(ROOT, ".tmp/tay_sfx");
const OUT = path.join(ROOT, "public/tay/mix.wav");
const soft = (id, peak) => {
  const src = path.join(SFX, `fs-${id}.mp3`), dst = path.join(SFX, `soft_${id}.wav`);
  const r = spawnSync("node", [path.join(ROOT, "tools/ext/sfx_soft.mjs"), src, dst, "--peak", String(peak)], { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  return dst;
};
// [المعرّف، قمة dBFS، موضع الضربة داخل الملف بالثواني]
const FILES = { gate: [682775, -21, 0.625], cell: [214233, -25, 1.505], gallop: [684446, -26, 0.0], crack: [875588, -24, 0.205], chain: [593458, -30, 0.0] };
const P = Object.fromEntries(Object.entries(FILES).map(([k, [id, pk]]) => [k, soft(id, pk)]));
// [الملف، لحظة الضربة في الفيديو بالثواني، موضع الضربة داخل الملف]
const EV = [
  ["gallop", c.tatar, 0.0], ["gate", c.jailed + 0.45, FILES.gate[2]], ["chain", c.jailed + 0.5, 0.0],
  ["cell", c.cairo + 0.3, FILES.cell[2]], ["cell", c.alex + 0.3, FILES.cell[2]], ["cell", c.citadel + 0.3, FILES.cell[2]], ["cell", c.citadel2 + 0.3, FILES.cell[2]],
  ["crack", c.divorce + 0.55, FILES.crack[2]],
];
const inputs = ["-i", path.join(ROOT, "public/tay/voice.wav")];
const PRE = 0.5;   // مقدّمة قبل أول كلمة (مطابقة لـ --offset في make_cues)
const BED_DB = -31.6; // التصحيح الخام: الضجيج الوردي المرشَّح بمتوسط -26.4 dB ← -58 dBFS مستمرة (قاعدة ضجيج الغرفة في مهارة النطق العربي؛ -42 كان فحيحاً مزعجاً بحكم المستخدم)
const parts = [`[0:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(PRE * 1000)}|${Math.round(PRE * 1000)},apad=whole_dur=${(AUDIO_SEC + 1.8).toFixed(2)}[v]`];
const labels = ["[v]", "[bed]"];
const TOTAL = AUDIO_SEC + 1.8;
// الخلفية: ضجيج وردي مرشَّح (دفء) يبدأ بتدرّج 0.8ث وينتهي بتلاشٍ طويل 2.4ث، فلا يوجد صمت رقمي في أي لحظة
parts.push(`anoisesrc=d=${TOTAL.toFixed(2)}:c=pink:r=48000:a=0.5:seed=11,lowpass=f=2600,highpass=f=90,volume=${BED_DB}dB,aformat=channel_layouts=stereo,afade=t=in:d=0.15,afade=t=out:st=${(TOTAL - 1.8).toFixed(2)}:d=1.8[bed]`);
EV.forEach(([k, at, off], i) => {
  inputs.push("-i", P[k]);
  const start = Math.max(0, at - off), ms = Math.round(start * 1000);
  parts.push(`[${i + 1}:a]aformat=channel_layouts=stereo,afade=t=in:d=0.05,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
parts.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=first,alimiter=limit=0.95[o]`);
const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-threads", "4", ...inputs, "-filter_complex", parts.join(";"), "-map", "[o]", "-ar", "48000", "-ac", "2", OUT], { encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const m = spawnSync("ffmpeg", ["-hide_banner", "-i", OUT, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
console.log("كُتب", OUT, "|", (/mean_volume:\s*(-?[\d.]+)/.exec(m) || [])[0], "|", (/max_volume:\s*(-?[\d.]+)/.exec(m) || [])[0]);
