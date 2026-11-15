// Writing must never appear BEFORE the words it shows are spoken (user 2026-11-06: «الكتابة قبل الكلام خطأ يتكرر»).
//   node tools/writing_sync.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json] [--fix] [--slack 0.3]
// For every written item (torn, scraps, rewrite old text, rows cards, note) it takes the content words of its text and looks for the FIRST of them in the cut
// transcript inside [start-0.6 s, end+0.3 s]; the item may start at most `slack` s before that word. Early items fail (exit 1); --fix moves `at` to
// 0.15 s before the first spoken content word (an item left shorter than 1.2 s is dropped). Text with no spoken match in its window is reported as «غير مطابق».
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json") && !a.includes("cut_words"));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const fix = argv.includes("--fix"), slack = Number(opt("slack", 0.3));
if (!specF) { console.error("usage: node tools/writing_sync.mjs data/specs/<p>.json [--fix]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const wordsF = opt("words", path.join(".tmp", spec.id, "cut_words.json"));
const W = JSON.parse(fs.readFileSync(wordsF, "utf8")), words = Array.isArray(W) ? W : W.words;
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const strip = (w) => norm(w).replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك)(?=.{3,})/, "");
const STOP = new Set(["هذا", "هذه", "ذلك", "التي", "الذي", "الذين", "لكن", "ثم", "كان", "يكون", "قد", "ماذا", "كيف", "لماذا", "اكثر", "بعد", "قبل", "عند", "حتي", "غير", "كل", "بين", "عن", "علي", "الي", "من", "في", "ان", "او", "هل", "ما", "لا", "لم", "لن", "هو", "هي", "نحن", "انه", "انها", "ايضا", "فقط", "جدا", "اصلا", "الان", "مثل", "عليه", "منه", "له", "لها", "بها", "به", "فيه", "فيها", "لانه", "ولكن", "اذا", "حين", "حيث"]);
const toks = (text) => [...new Set(String(text).split(/\s+/).map(strip).filter((t) => t.length >= 3 && !STOP.has(t)))];
const wstems = words.map((w) => ({ s: w.s, e: w.e, t: strip(w.w) }));
const match = (tok, t) => t === tok || (tok.length >= 4 && t.length >= 4 && (t.startsWith(tok) || tok.startsWith(t)));
const firstSpoken = (text, a, b) => {
  const T = toks(text); let best = null;
  for (const w of wstems) { if (w.s < a - 0.6 || w.s > b + 0.3) continue; if (T.some((q) => match(q, w.t))) { best = w.s; break; } }
  return best;
};
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
let bad = 0, moved = 0, dropped = 0, nomatch = 0;
const drop = new Set();
const check = (label, text, a, b, setAt, only) => {
  const t0 = firstSpoken(text, a, b);
  if (t0 === null) { nomatch++; return; }
  if (a < t0 - slack) {
    bad++;
    console.log(`  ✘ ${label} ${mm(a)} — الكلام يبدأ ${mm(t0)} (${(t0 - a).toFixed(1)}ث متأخر): «${String(text).slice(0, 40)}»${only ? " [" + only + "]" : ""}`);
    if (fix) { const na = +(t0 - 0.15).toFixed(2); if (b - na < 1.2) return "drop"; setAt(na); moved++; }
  }
};
for (const [i, it] of spec.items.entries()) {
  if (it.t === "torn" || it.t === "scraps") { const r = check(`${it.t}#${i}`, it.text, it.at, it.until, (v) => { it.at = v; }, it.only); if (r === "drop") drop.add(i); }
  else if (it.t === "rewrite") check(`rewrite#${i}`, it.oldText, it.oldAt - 0.4, it.until, (v) => { it.oldAt = Math.max(it.oldAt, +(v + 0.4).toFixed(2)); }, it.only);
  else if (it.t === "rows") for (const [n, r] of it.rows.entries()) check(`rows#${i}.${n}`, r.label, r.at, it.to, (v) => { r.at = v; }, it.only);
  else if (it.t === "note") {
    check(`note#${i}`, it.title, it.at, it.until, (v) => { it.at = v; }, it.only);
    /* أمر المستخدم 2026-11-13: بطاقة الحديث تبقى ثانية على الأقل بعد انتهاء كتابتها (بدء الكتابة at+0.25، كل حرف بما فيه «» يُحسب) */
    const typeEnd = it.at + 0.25 + [...it.title].length / (it.cps ?? Math.max(10, Math.round([...it.title].length / Math.max(2, it.until - it.at - 1.2))));
    if (it.until - typeEnd < 1.0) { bad++; console.log(`  ✘ note#${i} ${mm(it.at)} — تنتهي كتابتها ${typeEnd.toFixed(1)}ث وتزول ${it.until}ث (تبقى ${(it.until - typeEnd).toFixed(1)}ث، المطلوب ثانية على الأقل): «${String(it.title).slice(0, 40)}»`); }
  }
}
if (fix) { spec.items = spec.items.filter((_, i) => !drop.has(i)); dropped = drop.size; fs.writeFileSync(specF, JSON.stringify(spec, null, 1)); }
console.log(`writing_sync: ${bad ? "✘ " + bad + " كتابة قبل الكلام" : "✔ لا كتابة قبل كلامها"}${fix ? ` (نُقل ${moved}، حُذف ${dropped})` : ""}${nomatch ? ` · ${nomatch} غير مطابق (ملخّص بلا كلمات منطوقة)` : ""}`);
process.exit(bad && !fix ? 1 : 0);
