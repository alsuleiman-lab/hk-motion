// Plans the camera moves BEFORE the build (user 2026-10-28: «لازم من البداية يكون في نظام يشوف متى يجب أن يقرب، متى يجب أن يعمل اهتزاز، يعمل خطة ثم ينفذها؛ الفحص شيء لاحق»).
//   node tools/moves_plan.mjs <p>        → .tmp/<p>/moves.json (zooms + shake, cut timeline) and .tmp/<p>/moves.md (each move with its sentence and reason)
// Push-in on his face: the most important sentence of every ~75 s window, never more than 100 s without one (emphasis words + louder than his median). Handheld shake: interjection / sarcasm
// sentences (cue words), at most one per 2 min, never on a push-in or a baked split. stage cut runs it; spec_draft copies the result into the spec;
// Claude reads moves.md in the plan stage and keeps / moves / drops each line (the spec's `zooms` and `shake` are the plan, not an afterthought).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/moves_plan.mjs <p>"); process.exit(2); }
const T = path.join(".tmp", p);
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const words = read(path.join(T, "cut_words.json"), null);
if (!words?.length) { console.error(`${T}/cut_words.json missing — run stage cut first`); process.exit(2); }
const splits = read(path.join(T, "sources.json"), { windows: [] }).windows.filter((w) => w.split).map((w) => w.split);
const r2 = (v) => +v.toFixed(2);
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");

// sentences: a pause ≥ 0.45 s or 22 words closes one
const sents = [];
let cur = [];
for (let i = 0; i < words.length; i++) {
  cur.push(words[i]);
  const gap = i + 1 < words.length ? words[i + 1].s - words[i].e : 9;
  if (gap >= 0.45 || cur.length >= 22) { sents.push(cur); cur = []; }
}
if (cur.length) sents.push(cur);

// his loudness per sentence (RMS of the cut audio, mono 4 kHz) as a z-score against the whole video
const cutMp4 = path.join("public", `${p}_cut.mp4`);
let rmsOf = () => 0;
if (fs.existsSync(cutMp4)) {
  const SR = 4000;
  const r = spawnSync("ffmpeg", ["-v", "error", "-threads", "4", "-i", cutMp4, "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], { maxBuffer: 1 << 30, windowsHide: true });
  if (r.status === 0) {
    const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
    const raw = (a, b) => { let s = 0, n = 0; for (let i = Math.max(0, Math.floor(a * SR)); i < Math.min(pcm.length, Math.floor(b * SR)); i++) { s += pcm[i] * pcm[i]; n++; } return n ? 10 * Math.log10(s / n + 1) : 0; };
    const all = sents.map((s) => raw(s[0].s, s[s.length - 1].e));
    const mean = all.reduce((a, b) => a + b, 0) / all.length, sd = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length) || 1;
    rmsOf = (i) => (all[i] - mean) / sd;
  }
}

// cue words (normalised, prefixes stripped); phrases match on consecutive words
const ZOOM_CUES = ["انتبه", "انتبهوا", "اسمع", "اسمعوا", "خطير", "خطيره", "خطر", "والله", "اقسم", "مصيبه", "كارثه", "حقيقه", "اهم", "مهم", "خلاصه", "لاحظ", "لاحظوا", "تنبه", "كفر", "حرام", "باطل", "يجوز", "يجب", "ابدا", "قطعا", "اكبر", "اعظم", "اخطر", "الخلاصه", "الحقيقه", "المصيبه", "الكارثه"];
const SHAKE_CUES = ["يا سلام", "ما شاء الله", "عجيب", "عجيبه", "سبحان الله", "تخيل", "تخيلوا", "مسكين", "يا حبيبي", "يا رجل", "يا اخي", "حلو", "برافو", "عبقري", "يا عيني", "يا جماعه", "شو هذا", "ايش هذا", "هههه", "ههه", "ضحك", "كوميدي", "مهزله", "نكته", "يضحك", "شاطر", "فهمان", "علامه", "فيلسوف"];
const cueHits = (s, cues) => {
  const toks = s.map((w) => bare(norm(w.w))), full = s.map((w) => norm(w.w));
  const hits = [];
  for (const c of cues) {
    const q = c.split(" ");
    for (let i = 0; i + q.length <= toks.length; i++) if (q.every((x, k) => full[i + k] === x || toks[i + k] === x)) { hits.push(c); break; }
  }
  return hits;
};
const inSplit = (a, b) => splits.some((x) => a < x.to && b > x.from);
const text = (s) => s.map((w) => w.w).join(" ");
const dur = words[words.length - 1].e;

const rows = sents.map((s, i) => {
  const a = s[0].s, b = s[s.length - 1].e, z = cueHits(s, ZOOM_CUES), k = cueHits(s, SHAKE_CUES), loud = rmsOf(i);
  return { i, a: r2(a), b: r2(b), text: text(s), zHits: z, kHits: k, loud: +loud.toFixed(2),
    zScore: 2 * z.length + loud + (s.length >= 5 && s.length <= 18 ? 0.5 : 0), kScore: 2 * k.length + 0.5 * loud };
}).filter((r) => r.a > 2 && r.b < dur - 8 && !inSplit(r.a, r.b));   // not on the cover, not on the closing greeting, not on a baked split

// push-ins: the best sentence of every ~75 s window (emphasis words / louder than his median), then any gap over 100 s is filled by the best sentence inside it
const MAXGAP = 100, WIN = 75;
const zooms = [];
const pushZ = (best) => zooms.push({ from: best.a, to: r2(Math.min(best.b, best.a + 5)), why: (best.zHits.length ? `كلمات التأكيد: ${best.zHits.join("، ")}` : "") + (best.loud > 0.8 ? `${best.zHits.length ? "؛ " : ""}صوته أعلى من المعتاد` : "") || "أقوى جملة في هذه الفترة", text: best.text });
const longEnough = (r) => r.text.split(" ").length >= 5;
for (let w = 0; w < dur; w += WIN) {
  const best = rows.filter((r) => r.a >= w && r.a < w + WIN && r.zScore > 0.8 && longEnough(r) && !zooms.some((z) => Math.abs(z.from - r.a) < 40)).sort((x, y) => y.zScore - x.zScore)[0];
  if (best) pushZ(best);
}
const noFill = [];   // gaps no sentence can fill (all of it is a baked split / too short): stay in the plan as a warning
for (let guard = 0; guard < 60; guard++) {
  zooms.sort((x, y) => x.from - y.from);
  const pts = [0, ...zooms.map((z) => z.from), dur];
  let done = true;
  for (let i = 0; i + 1 < pts.length; i++) {
    if (pts[i + 1] - pts[i] <= MAXGAP || noFill.includes(pts[i])) continue;
    let best = null;
    for (const m of [25, 8]) { best = rows.filter((r) => r.a >= pts[i] + m && r.a <= pts[i + 1] - m && longEnough(r)).sort((x, y) => y.zScore - x.zScore)[0]; if (best) break; }
    if (best) { pushZ(best); done = false; break; } else noFill.push(pts[i]);
  }
  if (done) break;
}
zooms.sort((x, y) => x.from - y.from);
// shake: cue sentences, best first, ≥ 120 s apart, not on a push-in
const shake = [];
for (const r of rows.filter((x) => x.kHits.length).sort((x, y) => y.kScore - x.kScore)) {
  if (shake.some((s) => Math.abs(s.from - r.a) < 120) || zooms.some((z) => r.a < z.to + 1 && r.b > z.from - 1)) continue;
  shake.push({ from: r.a, to: r2(Math.min(r.b, r.a + 3)), why: `عبارة اعتراضية/تهكمية: ${r.kHits.join("، ")}`, text: r.text });
}
shake.sort((a, b) => a.from - b.from);

const shakeCand = rows.filter((r) => !r.kHits.length && r.text.split(" ").length <= 8 && r.loud > 1.2 && !zooms.some((z) => r.a < z.to + 1 && r.b > z.from - 1)).sort((x, y) => y.loud - x.loud).slice(0, 8).sort((x, y) => x.a - y.a);
fs.writeFileSync(path.join(T, "moves.json"), JSON.stringify({ zooms, shake }, null, 1));
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const md = [`# خطة الحركات — ${p} (${mm(dur)})`, "", "راجع كل سطر في مرحلة الخطة: أبقِه أو انقله إلى جملة أنسب أو احذفه، ثم يُكتب في `zooms`/`shake` من ملف البيانات (spec_draft يضعها تلقائياً).", "",
  `## تقريب الوجه (${zooms.length})`, ...zooms.map((z) => `- ${mm(z.from)} (${z.from}–${z.to}) — ${z.why}\n  «${z.text}»`), "",
  `## اهتزاز الكاميرا (${shake.length})`, ...(shake.length ? shake.map((z) => `- ${mm(z.from)} (${z.from}–${z.to}) — ${z.why}\n  «${z.text}»`) : ["- لم أجد عبارة تهكمية بكلماتها المعروفة."]), "",
  `### مرشحات للاهتزاز (جمل قصيرة بصوت مرتفع — احكم من السياق: اعتراضية أو تهكمية؟ فأضفها إلى shake)`, ...shakeCand.map((r) => `- ${mm(r.a)} (${r.a}–${r2(Math.min(r.b, r.a + 3))}) — أعلى من صوته المعتاد بـ${r.loud}σ
  «${r.text}»`), ""].join("\n");
fs.writeFileSync(path.join(T, "moves.md"), md);
console.log(`moves: ${zooms.length} push-in(s) · ${shake.length} shake(s) → ${path.join(T, "moves.md")}`);
