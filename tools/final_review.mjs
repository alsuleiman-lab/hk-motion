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

/* (2026-11-12) the opening bumper must sit right before his first greeting (tools/bumper_at.mjs), not at 0 when the video opens with a clip or a hook */
if (gateName && bumper && bumper.position !== "end") { try { const want = Number(spawnSync("node", ["tools/bumper_at.mjs", gateName], { encoding: "utf8" }).stdout.trim()); add(Math.abs((bumper.at ?? 0) - want) <= 0.6, `فاصل الافتتاح عند ${(bumper.at ?? 0).toFixed(2)}ث${Math.abs((bumper.at ?? 0) - want) <= 0.6 ? " = قبل أول تحية" : ` والمطلوب ${want.toFixed(2)}ث (قبل «بسم الله/السلام عليكم»)`}`); } catch { /* no words */ } }
/* (2026-11-18) a short portrait video (reel, silent reaction; or any portrait file just over 3:00) must be <= the Shorts limit WITH its bumper */
{ const SL = await import("./short_limit.mjs"); const portraitV = v && Number(v.height) > Number(v.width); const short = (gateName && SL.isShort(gateName)) || (portraitV && dur > SL.SHORT_MAX && dur <= 240); if (short) add(dur <= SL.SHORT_MAX, `طول القصير ${dur.toFixed(2)}ث والحد ${SL.SHORT_MAX}ث (الفاصل داخله)${dur > SL.SHORT_MAX ? " — لن يكون Short على يوتيوب: قصّر ثم أعد" : ""}`); }
/* THE COVER FIRST (user 2026-11-21, GTA 6 reels rendered without it: «يعني يكون الغلاف في أوله»): the montage of this file must open with its cover picture (tools/cover_item.mjs) */
if (gateName && fs.existsSync(`data/specs/${gateName}.json`)) { const { coverFailure } = await import("./cover_item.mjs"); let sp = null; try { sp = JSON.parse(fs.readFileSync(`data/specs/${gateName}.json`, "utf8")); } catch { /* unreadable */ } const why = sp ? coverFailure(gateName, sp) : "✘ مواصفة المونتاج لا تُقرأ"; add(!why, why ? why.replace(/^✘ /, "") : "الغلاف أول عنصر في المونتاج وصورته موجودة"); }
add(dur > minSec && dur > 0, `المدة ${dur.toFixed(2)}ث${bumper ? ` (منها فاصل الافتتاح «${bumper.title}» ${bumper.seconds}ث)` : ""}`);
// the audio gate (tools/audio_gate.mjs) is MANDATORY for every montage (user order 2026-10-21)
import fs from "node:fs";
import crypto from "node:crypto";
{
  // the gate proof must belong to the CURRENT files: re-hash everything the gate hashed (tools/audio_gate.mjs)
  let proof = null; try { proof = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.audio.ok`, "utf8")); } catch { /* none / old format */ }
  const sha = (p) => { try { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); } catch { return null; } };
  let stale = proof?.files ? Object.entries(proof.files).filter(([p, h]) => sha(p) !== h).map(([p]) => p) : ["(صيغة قديمة)"];
  if (gateName && stale.length) {   /* (2026-11-16 cut model) the gate re-runs itself on the current files; its own report says what failed and where */
    let args = null; try { args = JSON.parse(fs.readFileSync(`.tmp/${gateName}/gate_args.json`, "utf8")); } catch { /* never ran with saved args */ }
    if (args) {
      console.log(`ℹ تغيّر بعد بوابة الصوت: ${stale.join("، ")} — أعيد تشغيلها الآن`);
      const r = spawnSync("node", ["tools/audio_gate.mjs", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
      for (const l of (r.stdout || "").trim().split(/\r?\n/).filter((x) => /^[✔✘ℹ]/.test(x) || /^✘ \[/.test(x))) console.log("   " + l);
      try { proof = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.audio.ok`, "utf8")); } catch { proof = null; }
      stale = r.status === 0 && proof?.files ? Object.entries(proof.files).filter(([p, h]) => sha(p) !== h).map(([p]) => p) : ["(فشلت إعادة التشغيل: التفاصيل أعلاه)"];
    }
  }
  add(gateName !== "" && proof !== null && stale.length === 0, gateName ? (stale.length ? `بوابة الصوت لـ${gateName} لم تنجح على الملفات الحالية: ${stale.join("، ")}` : `بوابة الصوت (audio_gate) نجحت لـ${gateName} على الملفات الحالية`) : "بلا --name لا يُعرف المشروع: أضف --name <المشروع>");
}
{
  // judder gate (tools/judder_check.mjs, user 2026-10-26): the rendered file must have passed the frame-by-frame comparison with its source, and be the SAME file (size) that passed
  const { contentId } = await import("./cut_model.mjs");
  const ids = [contentId(file)]; if (bumper?.originalId) ids.push(bumper.originalId);   // the gate may have run on the file before the bumper was added
  const hitId = ids.find((id) => fs.existsSync(`.tmp/gates/judder/${id}.json`));
  let legacy = null; if (!hitId) { try { const j = JSON.parse(fs.readFileSync(`.tmp/gates/${gateName}.judder.ok`, "utf8")); const size = fs.statSync(file).size; const jSize = bumper && bumper.size === size ? bumper.originalSize : size; legacy = j?.files ? Object.entries(j.files).find(([, s2]) => (s2 === jSize || s2 === size) && s2 > 0) : null; } catch { /* none */ } }
  const rec = hitId ? JSON.parse(fs.readFileSync(`.tmp/gates/judder/${hitId}.json`, "utf8")) : null;
  add(!!(rec || legacy), rec ? `بوابة الارتجاف نجحت لهذا الملف بعينه (${rec.share}٪ متطابقة، الحد ${rec.min}٪)` : legacy ? "بوابة الارتجاف نجحت لهذا الملف (سجل قديم بالحجم)" : "بوابة الارتجاف لم تُشغَّل على هذا الملف بعينه: node tools/judder_check.mjs <الناتج> --src <القص المنعَّم> --offset <إطار> --name <المشروع>");
}
if (v) {
  const [n, d] = v.r_frame_rate.split("/").map(Number);
  console.log(`  ${v.width}x${v.height} @ ${(n / d).toFixed(2)}fps`);
}
if (!hasAudio) { add(false, "لا مسار صوت"); process.exit(1); }

let planMap = null; try { planMap = JSON.parse(fs.readFileSync(`public/${gateName}_map.json`, "utf8")); } catch { /* none */ }
if (gateName && planMap?.model === "cut_model") {
  const { verifyCut, projectInputs, printViolations } = await import("./cut_model.mjs");
  const { words, source } = projectInputs(gateName);
  const b = bumper ? { at: bumper.position === "end" ? Infinity : (bumper.at ?? 0), seconds: bumper.seconds, end: bumper.position === "end" } : null;
  const vio = verifyCut({ segments: planMap.segments, words, file, bumper: b ? { ...b, seconds: b.end ? b.seconds : b.seconds } : null });
  add(vio.length === 0, vio.length ? `القص في هذا الملف يخالف القاعدة في ${vio.length} موضعاً:\n${printViolations(vio).map((l) => "   " + l).join("\n")}` : `لا سكتة بين كلمتين فوق الحد ولا قطع داخل كلمة، والملف يطابق خطة القص (المقياس الواحد، الجدول: ${source})`);
} else {
  console.log("ℹ لا خطة قص بالنموذج لهذا الملف (كرتون أو مشروع قديم): يُقاس الصمت في الملف");
const sil = run("ffmpeg", ["-hide_banner", "-i", file, "-af", `silencedetect=noise=${db}dB:d=${maxGap}`, "-f", "null", "-"]).stderr;
const starts = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const durs = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
// a closing bumper (streams/lessons) starts right after the last word: the silence that runs from the speech into the bumper (begins ≤ 0.6 s before it) is the junction, not a pause in the talk
const bAt = typeof bumper?.at === "number" ? bumper.at : 0, bEnd = bumper?.position === "end";
/* (2026-11-12) only the PART of a silence inside the bumper is excused: a silence that starts in the bumper and runs on after it (6 s of lost audio after a
   start bumper) was dropped whole and the file passed */
const gaps = starts.map((s, i) => ({ s, d: durs[i] ?? dur - s })).map((g) => { if (!bumper) return g; const a = bAt - (bEnd ? 0.6 : 0), b = bAt + bumper.seconds; if (g.s >= a && g.s < b) { const e = g.s + g.d; return { s: b, d: e - b }; } return g; }).filter((g) => g.d > maxGap);
add(gaps.length === 0, gaps.length ? `سكتات > ${maxGap}ث: ${gaps.map((g) => `${g.s.toFixed(2)}→${(g.s + g.d).toFixed(2)} (${g.d.toFixed(2)}ث)`).join("، ")}` : `لا سكتة > ${maxGap}ث`);

}
const vol = run("ffmpeg", ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"]).stderr;
const max = Number(vol.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
const mean = Number(vol.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);
add(Number.isFinite(max) && max < -0.1, `قمة الصوت ${max} dB (المتوسط ${mean} dB)${max >= -0.1 ? " — قمة 0 dB: أخفّض أو أستمع" : ""}`);
/* (2026-11-17, umawi reel) a corrupt audio tail at the very end of a render (peak +2 dB) was heard as a click at the bumper: the last 0.6 s must not peak above
   the body of the file nor near 0 dB. Fix in the engine; this gate catches it on every final file. */
{
  const tail = run("ffmpeg", ["-hide_banner", "-sseof", "-0.6", "-i", file, "-af", "volumedetect", "-f", "null", "-"]).stderr;
  const tmax = Number(tail.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
  const okTail = !Number.isFinite(tmax) || (tmax < -1 && !(Number.isFinite(max) && tmax > max - 0.05 && tmax > -3));
  add(okTail, `ذيل الصوت (آخر 0.6ث) قمته ${Number.isFinite(tmax) ? tmax : "؟"} dB${okTail ? "" : " — ذيل تالف يُسمع نقرة: أصلح الصوت ثم أعد إلحاق الفاصل"}`);
}

console.log("\nلا يزال عليك يدوياً: الوجه واللحية (face_check)، التلعثم بتفريغ الناتج، الصور والمصادر، الخلفيات.");
const allOk = results.every(Boolean);
// proof for the Stop hook (tools/hooks/guard.mjs): «✅ انتهيتُ من المونتاج» is refused without a fresh .final.ok
if (allOk && gateName) { fs.mkdirSync(".tmp/gates", { recursive: true }); fs.writeFileSync(`.tmp/gates/${gateName}.final.ok`, JSON.stringify({ at: new Date().toISOString(), video: file, duration: dur })); }
process.exit(allOk ? 0 : 1);
