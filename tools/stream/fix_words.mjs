// تصحيح أخطاء التفريغ الآلي في مقاطع درس بخريطة يكتبها كلود بعد قراءة التفريغ (2026-11-17): كل تصحيح = تسلسل كلمات ← تسلسل صحيح، والتوقيت يُقسَّم على الكلمات الجديدة.
//   node tools/stream/fix_words.mjs <مقطع> <خريطة.json>     خريطة: [[ "كلمة كلمة" , "كلمات صحيحة" ], …]  (المقارنة بلا علامات ترقيم)
// يكتب على .tmp/<مقطع>/{cut_words,cut_words_large,words,words_vad}.json وcut_transcript.txt؛ ويطبع ما غُيّر وما لم يُعثر عليه.
import fs from "node:fs"; import path from "node:path";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [id, mapF] = process.argv.slice(2); const T = path.join(".tmp", id);
const maps = JSON.parse(fs.readFileSync(mapF, "utf8"));
const norm = (s) => String(s).replace(/[.،؟?!:؛"«»]/g, "").trim();
const files = ["cut_words.json", "cut_words_large.json", "words.json", "words_vad.json"].map((f) => path.join(T, f)).filter((f) => fs.existsSync(f));
let report = [];
for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(f, "utf8")); const isObj = !Array.isArray(raw); let W = (isObj ? raw.words : raw).map((x) => ({ ...x }));
  for (const [from, to] of maps) {
    const F = from.split(/\s+/), R = to.split(/\s+/).filter(Boolean); let found = 0;
    for (let i = 0; i + F.length <= W.length; i++) {
      if (!F.every((x, k) => norm(W[i + k].w) === x)) continue; found++;
      const s0 = W[i].s, e0 = W[i + F.length - 1].e, span = e0 - s0, n = Math.max(R.length, 1);
      const rep = R.map((w, k) => ({ ...W[i], w, s: +(s0 + (span * k) / n).toFixed(3), e: +(s0 + (span * (k + 1)) / n).toFixed(3) }));
      W.splice(i, F.length, ...rep); i += rep.length - 1;
    }
    if (f.endsWith("cut_words.json")) report.push(`${found ? "✔" : "✘ لم يُعثر"} ${from} ← ${to}${found ? " ×" + found : ""}`);
  }
  fs.writeFileSync(f, JSON.stringify(isObj ? { ...raw, words: W } : W, null, 1));
  if (f.endsWith("cut_words.json")) fs.writeFileSync(path.join(T, "cut_transcript.txt"), W.reduce((o, w, i) => { if (i % 12 === 0) o.push(`[${(w.s ?? 0).toFixed(1)}] `); o[o.length - 1] += w.w + " "; return o; }, []).join("\n") + "\n");
}
console.log(report.join("\n"));
