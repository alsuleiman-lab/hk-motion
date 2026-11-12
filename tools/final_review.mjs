// Automatic checks from the mandatory final review (WORKFLOW_CHECKLIST.md): items 2, 13 and duration/frames.
//   node tools/final_review.mjs <video.mp4> [--db -38] [--max-gap 0.4] [--min-sec 0]
// Reports: duration, silent spans > max-gap (item 2), peak/mean volume (item 13: peak must not be 0 dB), and frame-rate sanity.
// Exit code 1 on any failure so it can gate "✅ انتهيتُ".
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/final_review.mjs <video.mp4> [--db -38] [--max-gap 0.4]"); process.exit(2); }
const arg = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
const gateName = arg("name", "");
const db = arg("db", "-38"), maxGap = Number(arg("max-gap", "0.4")), minSec = Number(arg("min-sec", "0"));

const run = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,r_frame_rate,width,height", "-of", "json", file]).stdout || "{}");
const dur = Number(probe.format?.duration ?? 0);
const v = (probe.streams ?? []).find((s) => s.codec_type === "video");
const hasAudio = (probe.streams ?? []).some((s) => s.codec_type === "audio");
let bumper = null; try { bumper = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.bumper.json`, "utf8")); } catch { /* no bumper */ }
/* (2026-11-12) the hybrid writes the record under its temp name (hyb_<p>_<L|R>): find the record whose size IS this file */
if (!bumper || bumper.size !== (() => { try { return fs.statSync(file).size; } catch { return -1; } })()) { try { const sz = fs.statSync(file).size; for (const f of fs.readdirSync(".tmp/gates").filter((x) => x.endsWith(".bumper.json"))) { const b = JSON.parse(fs.readFileSync(`.tmp/gates/${f}`, "utf8")); if (b.size === sz) { bumper = b; break; } } } catch { /* none */ } }   // فاصل الافتتاح: أول bumper.seconds ثانية فاصل (لا فحص سكتات فيها)
const results = [];
const add = (ok, msg) => { results.push(ok); console.log(`${ok ? "✔" : "✘"} ${msg}`); };

add(dur > minSec && dur > 0, `المدة ${dur.toFixed(2)}ث${bumper ? ` (منها فاصل الافتتاح «${bumper.title}» ${bumper.seconds}ث)` : ""}`);
// the audio gate (tools/audio_gate.mjs) is MANDATORY for every montage (user order 2026-10-21)
import fs from "node:fs";
import crypto from "node:crypto";
{
  // the gate proof must belong to the CURRENT files: re-hash everything the gate hashed (tools/audio_gate.mjs)
  let proof = null; try { proof = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.audio.ok`, "utf8")); } catch { /* none / old format */ }
  const sha = (p) => { try { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); } catch { return null; } };
  const stale = proof?.files ? Object.entries(proof.files).filter(([p, h]) => sha(p) !== h).map(([p]) => p) : ["(صيغة قديمة: أعد تشغيل audio_gate)"];
  add(gateName !== "" && proof !== null && stale.length === 0, gateName ? (stale.length ? `بوابة الصوت لـ${gateName} قديمة، تغيّرت: ${stale.join("، ")} — أعد تشغيل audio_gate` : `بوابة الصوت (audio_gate) نجحت لـ${gateName} وتطابق الملفات الحالية`) : "مرّر --name <المشروع> بعد تشغيل tools/audio_gate.mjs: بوابة الصوت إلزامية");
}
{
  // judder gate (tools/judder_check.mjs, user 2026-10-26): the rendered file must have passed the frame-by-frame comparison with its source, and be the SAME file (size) that passed
  let j = null; try { j = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.judder.ok`, "utf8")); } catch { /* none */ }
  const size = (() => { try { return fs.statSync(file).size; } catch { return -1; } })();
  const jSize = bumper && bumper.size === size ? bumper.originalSize : size;   // البوابة نجحت على الملف قبل الفاصل
  const hit = j?.files ? Object.entries(j.files).find(([p, s]) => (s === jSize || s === size) && s > 0) : null;   /* the gate may have run on the original (before the bumper) or on the final file */
  add(gateName !== "" && !!hit, hit ? `بوابة الارتجاف (judder_check) نجحت لهذا الملف` : "بوابة الارتجاف لم تنجح لهذا الملف: node tools/judder_check.mjs <الناتج> --src <القص المنعَّم> --offset <إطار> --name <المشروع> (إلزامي)");
}
if (v) {
  const [n, d] = v.r_frame_rate.split("/").map(Number);
  console.log(`  ${v.width}x${v.height} @ ${(n / d).toFixed(2)}fps`);
}
if (!hasAudio) { add(false, "لا مسار صوت"); process.exit(1); }

const sil = run("ffmpeg", ["-hide_banner", "-i", file, "-af", `silencedetect=noise=${db}dB:d=${maxGap}`, "-f", "null", "-"]).stderr;
const starts = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const durs = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
// a closing bumper (streams/lessons) starts right after the last word: the silence that runs from the speech into the bumper (begins ≤ 0.6 s before it) is the junction, not a pause in the talk
const bAt = typeof bumper?.at === "number" ? bumper.at : 0, bEnd = bumper?.position === "end";
const gaps = starts.map((s, i) => ({ s, d: durs[i] ?? dur - s })).filter((g) => !bumper || !(g.s >= bAt - (bEnd ? 0.6 : 0) && g.s < bAt + bumper.seconds));
add(gaps.length === 0, gaps.length ? `سكتات > ${maxGap}ث: ${gaps.map((g) => `${g.s.toFixed(2)}→${(g.s + g.d).toFixed(2)} (${g.d.toFixed(2)}ث)`).join("، ")}` : `لا سكتة > ${maxGap}ث`);

const vol = run("ffmpeg", ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"]).stderr;
const max = Number(vol.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
const mean = Number(vol.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);
add(Number.isFinite(max) && max < -0.1, `قمة الصوت ${max} dB (المتوسط ${mean} dB)${max >= -0.1 ? " — قمة 0 dB: أخفّض أو أستمع" : ""}`);

console.log("\nلا يزال عليك يدوياً: الوجه واللحية (face_check)، التلعثم بتفريغ الناتج، الصور والمصادر، الخلفيات.");
const allOk = results.every(Boolean);
// proof for the Stop hook (tools/hooks/guard.mjs): «✅ انتهيتُ من المونتاج» is refused without a fresh .final.ok
if (allOk && gateName) { fs.mkdirSync(".tmp/gates", { recursive: true }); fs.writeFileSync(`.tmp/gates/${gateName}.final.ok`, JSON.stringify({ at: new Date().toISOString(), video: file, duration: dur })); }
process.exit(allOk ? 0 : 1);
