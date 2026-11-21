// THE FINAL CHECK OF A RENDERED FILE BY ITS OWN KIND (2026-11-21: «شيخ الردود - طعام لمسلمي الجن» rendered from the Studio's 🎬 was refused by tools/final_review.mjs
// for montage rules that do not fit it: «بلا --name»، بوابة الارتجاف على القص المنعَّم، سكتات > 0.4ث — the listening silences of a «شيخ الردود» video are by design).
// tools/final_review.mjs stays the check of a MONTAGE spec (its words, cut plan, audio gate, judder against the smoothed cut). A composition that is not a spec
// (tools/comp_kinds.mjs kinds) is checked here by the rules of its own skill, measured on the file:
//   every kind  a video and an audio stream, the audio as long as the video (± 0.25 s), the peak under 0 dB (final_review «peak»), the tail of the audio not broken;
//   parts       the audio is not dead in any part of the video (mean ≥ −55 dB in each window): the GPU engine drops the sound embedded in a <Video>/<OffthreadVideo>
//               (lesson of «شيخ الردود» 2026-11-21, remotion-render references/detail.md) — rudood, cartoon, dubbing, debate-reel, explainer, silent, paper, scholars;
//   pauses      no silence > 0.40 s (rules «لا سكتة > 0.40ث») where the skill asks it: cartoon (FilmKit stories), dubbing (the mix gate), debate-reel, paper, scholars —
//               NOT rudood (the sheikh listens to the clip and pauses by design), NOT explainer/silent (their skills measure loudness, not pauses);
//   short       a portrait channel reel ≤ 179 s with its bumper (data/short_limit.json): debate-reel, silent.
//   node tools/kind_review.mjs <file.mp4> --kind <kind> [--comp <Id>] [--json]     exit 1 on any ✘; writes .tmp/gates/<Id>.kind_review.json (file, size, checks)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
export const RULES = {
  rudood: { parts: true, pauses: false }, cartoon: { parts: true, pauses: true }, dubbing: { parts: true, pauses: true }, "debate-reel": { parts: true, pauses: true, short: true },
  explainer: { parts: true, pauses: false }, silent: { parts: true, pauses: false, short: true }, paper: { parts: true, pauses: true }, scholars: { parts: true, pauses: true },
};
const run = (a) => spawnSync(a[0], a.slice(1), { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true });

/** the checks of one file for one kind → { ok, checks: [{id, ok, msg}] } */
export const reviewFile = (file, kind, { comp = "" } = {}) => {
  const R = RULES[kind] ?? { parts: true, pauses: true }, checks = [], add = (id, ok, msg) => checks.push({ id, ok: !!ok, msg });
  if (!fs.existsSync(file)) { add("file", false, `لا ملف: ${file}`); return { ok: false, checks }; }
  const pr = JSON.parse(run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,duration,width,height,r_frame_rate", "-of", "json", file]).stdout || "{}");
  const v = (pr.streams ?? []).find((s) => s.codec_type === "video"), a = (pr.streams ?? []).find((s) => s.codec_type === "audio"), dur = Number(pr.format?.duration ?? 0);
  add("streams", v && a && dur > 0.5, v && a ? `فيديو ${v.width}×${v.height} وصوت، المدة ${dur.toFixed(2)}ث` : `ينقص ${v ? "" : "الفيديو "}${a ? "" : "الصوت"}`);
  if (!v || !a) return { ok: false, checks };
  const vd = Number(v.duration ?? dur), ad = Number(a.duration ?? dur);
  add("sync", Math.abs(vd - ad) <= 0.25, `مدة الصوت ${ad.toFixed(2)}ث ومدة الفيديو ${vd.toFixed(2)}ث${Math.abs(vd - ad) > 0.25 ? " — غير متطابقتين" : ""}`);
  const vol = run(["ffmpeg", "-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"]).stderr;
  const max = Number(vol.match(/max_volume: (-?[\d.]+) dB/)?.[1]), mean = Number(vol.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);
  add("peak", Number.isFinite(max) && max < -0.1, `قمة الصوت ${max} dB (المتوسط ${mean} dB)${max >= -0.1 ? " — قمة 0 dB: يُخفَّض" : ""}`);
  if (R.parts) {   // the mean level of each window: a dead part = a sound that did not reach the file
    const W = dur > 120 ? 10 : 4, n = Math.max(1, Math.floor(dur / W)), dead = [];
    const st = run(["ffmpeg", "-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", `asetnsamples=n=${Math.round(48000 * W)}:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level`, "-f", "null", "-"]).stderr;
    const lv = [...st.matchAll(/RMS_level=(-?[\d.]+|-inf)/g)].map((m) => (m[1] === "-inf" ? -200 : Number(m[1])));
    lv.slice(0, n).forEach((x, i) => { if (x < -55) dead.push(`${i * W}–${(i + 1) * W}ث (${x <= -199 ? "صمت تام" : x.toFixed(0) + " dB"})`); });
    add("parts", lv.length > 0 && !dead.length, lv.length ? (dead.length ? `صوت ميت في: ${dead.join("، ")} — صوت لم يدخل الملف (فيديو بصوت مضمَّن؟)` : `الصوت حاضر في كل أجزاء الفيديو (${Math.min(n, lv.length)} جزءاً، كل ${W}ث)`) : "تعذّر قياس مستوى الأجزاء");
  }
  if (R.pauses) {
    const sil = run(["ffmpeg", "-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "silencedetect=noise=-38dB:d=0.4", "-f", "null", "-"]).stderr;
    const s = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1])), d = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
    const gaps = s.map((x, i) => ({ s: x, d: d[i] ?? dur - x })).filter((g) => g.d > 0.4 && g.s + g.d < dur - 0.05);   // the very end is the tail check
    add("pauses", !gaps.length, gaps.length ? `سكتات > 0.4ث: ${gaps.slice(0, 8).map((g) => `${g.s.toFixed(2)}→${(g.s + g.d).toFixed(2)}`).join("، ")}` : "لا سكتة > 0.4ث");
  } else add("pauses", true, `السكتات لا تُقاس في هذا النوع (${kind}): مقصودة بقواعد مهارته`);
  { const t = run(["ffmpeg", "-hide_banner", "-nostats", "-sseof", "-0.6", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"]).stderr, tm = Number(t.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
    add("tail", !Number.isFinite(tm) || tm < -0.1, `ذيل الصوت (آخر 0.6ث) قمته ${Number.isFinite(tm) ? tm : "؟"} dB`); }
  if (R.short && Number(v.height) > Number(v.width)) { let lim = 179; try { lim = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "short_limit.json"), "utf8")).maxTotal ?? 179; } catch { /* default */ } add("short", dur <= lim, `طول القصير ${dur.toFixed(2)}ث (الحد ${lim}ث)`); }
  const ok = checks.every((c) => c.ok);
  try { const g = path.join(ROOT, ".tmp", "gates"); fs.mkdirSync(g, { recursive: true }); if (comp) fs.writeFileSync(path.join(g, `${comp}.kind_review.json`), JSON.stringify({ file: path.resolve(file), size: fs.statSync(file).size, kind, ok, at: new Date().toISOString(), checks }, null, 1)); } catch { /* the result stands */ }
  return { ok, checks };
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const argv = process.argv.slice(2), opt = (n) => (argv.includes("--" + n) ? argv[argv.indexOf("--" + n) + 1] : null);
  const file = argv[0], kind = opt("kind");
  if (!file || !kind) { console.error("usage: node tools/kind_review.mjs <file.mp4> --kind <kind> [--comp <Id>] [--json]"); process.exit(2); }
  const r = reviewFile(file, kind, { comp: opt("comp") ?? "" });
  if (argv.includes("--json")) console.log(JSON.stringify(r)); else { for (const c of r.checks) console.log(`${c.ok ? "✔" : "✘"} ${c.msg}`); console.log(r.ok ? `✔ الفحص النهائي لنوع «${kind}» نجح` : `✘ الفحص النهائي لنوع «${kind}» لم ينجح`); }
  process.exit(r.ok ? 0 : 1);
}
