// FRAGMENTS LEFT IN THE CUT (user 2026-11-11, third time: «صوت غريب… نصف كلمة أو كلمة محذوفة»). Two kinds the gates never flagged:
//  (a) a short kept piece SANDWICHED between two removed stretches (≤ 1.6 s kept, > 1.5 s removed on both sides in the source) — «وخذ أكل عادي»;
//  (b) trailing-off / unsure speech: «مدري»، «ايش»، «أبو مدري»، «يعني اه»، a sentence that breaks off — «وفي آلهة تصل أبو مدري إيش».
//   node tools/orphan_scan.mjs <p>      → lists them with cut time and frame; exit 1 while any is not decided in .tmp/<p>/orphans_ok.json ({"<the fragment text as printed>": "keep: reason"})
// Each one is cut with tools/cut_block.mjs (at the real silence) or kept with a written reason — before any link.
import fs from "node:fs";
import path from "node:path";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/orphan_scan.mjs <p>"); process.exit(2); }
process.chdir(path.resolve(import.meta.dirname, ".."));
const T = path.join(".tmp", p);
const map = JSON.parse(fs.readFileSync(path.join("public", `${p}_map.json`), "utf8")).segments;
const words = JSON.parse(fs.readFileSync(path.join(T, fs.existsSync(path.join(T, "drift_fresh.json")) ? "drift_fresh.json" : "cut_words.json"), "utf8"));
const ok = (() => { try { return JSON.parse(fs.readFileSync(path.join(T, "orphans_ok.json"), "utf8")); } catch { return {}; } })();
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/[^\p{L}\p{N} ]/gu, "").trim();
const text = (a, b) => words.filter((w) => w.s >= a - 0.05 && w.s < b).map((w) => w.w).join(" ");
const found = [];
// a gap counts only if SPEECH was removed there (words of the original transcript inside it), not a shortened pause
/* (rehearsal 2026-11-21, ledger orphan-false-pause-pieces) on the ALIGNED word table the cut itself was planned on (words_table.json), not the raw words.json:
   a slow speaker's «الإنسان … هذا … عنده …» with 2–3 s pauses cut out was flagged five times, because the raw start of a KEPT word (13.41 raw, 13.71 aligned)
   fell 0.2 s before its kept stretch and counted as «speech removed» */
const WT = (() => { try { const t = JSON.parse(fs.readFileSync(path.join(T, "words_table.json"), "utf8")); const w = t.words ?? t; return Array.isArray(w) && w.length ? w : null; } catch { return null; } })();
const src = WT ?? JSON.parse(fs.readFileSync(path.join(T, "words.json"), "utf8"));
const speechIn = (a, b) => src.some((w) => w.s >= a && w.s < b - 0.05);
let acc = 0; const segs = map.map((s) => { const r = { ...s, c0: acc, c1: acc + (s.b - s.a) }; acc = r.c1; return r; });
for (let i = 1; i < segs.length - 1; i++) {
  const s = segs[i], before = s.a - segs[i - 1].b, after = segs[i + 1].a - s.b, d = s.c1 - s.c0;
  if (d <= 1.6 && before > 1.5 && after > 1.5 && speechIn(segs[i - 1].b, s.a) && speechIn(s.b, segs[i + 1].a)) found.push({ t: s.c0, kind: "قطعة صغيرة بين حذفين", text: text(s.c0, s.c1) });
}
const UNSURE = /^(مدري|مادري|ايش|شو|اه|ااه|امم|يعني)$/;
for (let i = 0; i < words.length; i++) {
  const n = norm(words[i].w);
  if (n === "مدري" || n === "مادري" || (n === "ايش" && /مدري|ابو/.test(norm(words[i - 1]?.w ?? "")))) found.push({ t: words[i].s, kind: "كلام متردد/منقطع", text: text(words[i].s - 3, words[i].s + 1.5) });
  if (UNSURE.test(n) && UNSURE.test(norm(words[i + 1]?.w ?? "")) && UNSURE.test(norm(words[i + 2]?.w ?? ""))) found.push({ t: words[i].s, kind: "تلعثم", text: text(words[i].s - 1, words[i].s + 2) });
}
// a decision is keyed by the fragment's TEXT (frame numbers move with every later cut)
const open = found.filter((f) => !ok[f.text.trim()] && !ok[String(Math.round(f.t * 30))]);
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
console.log(open.length ? `✘ orphan_scan: ${open.length} موضعاً يبدو بقايا أو كلاماً منقطعاً — احذفه بـcut_block أو اكتب سبب إبقائه في orphans_ok.json:\n  ` + open.map((f) => `${mm(f.t)} (الإطار ${Math.round(f.t * 30)}) ${f.kind}: «${f.text}»`).join("\n  ") : `✔ orphan_scan: لا قطع صغيرة بين حذفين ولا كلام منقطع (${found.length} موضعاً حُسم)`);
process.exit(open.length ? 1 : 0);
