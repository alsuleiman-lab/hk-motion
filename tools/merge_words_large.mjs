// Merge the large-v3 words (right spelling, tools/words_cut_large.py) with the per-VAD aligner's word times (.tmp/<p>/cut_words.json) into ONE cut timeline.
// large-v3 spells dialect and short segments correctly but inflates the start of the first word of every segment (it starts at the segment edge), while the
// aligned times are tight but misspelt. For each large word the nearest aligned word of (almost) the same letters lends its start/end; unmatched words keep their
// own time clamped inside the neighbours. The result replaces .tmp/<p>/cut_words.json (originals kept as cut_words.aligned.json / cut_words_large.raw.json),
// so writing_sync / scraps_times / coverage_check / the generators all see the same, correctly spelt and tightly timed words.
//   node tools/merge_words_large.mjs <project>
import fs from "node:fs";
const p = process.argv[2];
if (!p) { console.error("usage: node tools/merge_words_large.mjs <project>"); process.exit(2); }
const T = `.tmp/${p}`;
const rd = (f) => { const x = JSON.parse(fs.readFileSync(f, "utf8")); return Array.isArray(x) ? x : x.words; };
const alignedF = fs.existsSync(`${T}/cut_words.aligned.json`) ? `${T}/cut_words.aligned.json` : `${T}/cut_words.json`;
const largeF = fs.existsSync(`${T}/cut_words_large.raw.json`) ? `${T}/cut_words_large.raw.json` : `${T}/cut_words_large.json`;
const A = rd(alignedF), L = rd(largeF);
if (!fs.existsSync(`${T}/cut_words.aligned.json`)) fs.copyFileSync(`${T}/cut_words.json`, `${T}/cut_words.aligned.json`);
if (!fs.existsSync(`${T}/cut_words_large.raw.json`)) fs.copyFileSync(`${T}/cut_words_large.json`, `${T}/cut_words_large.raw.json`);
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const strip = (w) => norm(w).replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك|ت|ي|ن|ا)(?=.{3,})/, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const same = (x, y) => { const a = strip(x), b = strip(y); if (!a || !b) return false; if (a === b) return true; return Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1; };
let ptr = 0, matched = 0;
const out = L.map((l) => {
  let hit = -1;
  for (let k = Math.max(0, ptr - 2); k < A.length && A[k].s < l.e + 2.5; k++) if (Math.abs(A[k].s - l.s) < 2.5 && same(A[k].w, l.w)) { hit = k; break; }
  if (hit >= 0) { ptr = hit + 1; matched++; return { w: l.w, s: A[hit].s, e: A[hit].e, m: 1 }; }
  return { w: l.w, s: l.s, e: l.e, m: 0 };
});
// (2026-11-14, nvidia_crash: «الله» got the time of the previous «الله» and a whole element appeared 0.9 s early) a matched word that goes BACK in time, or shares the previous word's time, falls back to the large model's own time
let repaired = 0;
for (let i = 1; i < out.length; i++) if (out[i].m && (out[i].s <= out[i - 1].s - 0.02 || (out[i - 1].m && Math.abs(out[i].s - out[i - 1].s) < 0.001))) { out[i] = { w: L[i].w, s: L[i].s, e: L[i].e, m: 0 }; repaired++; }
if (repaired) console.log(`merge_words_large: ${repaired} word(s) that went back in time took the large model's time`);
// unmatched words: keep inside the neighbours and never earlier than the previous word's end
for (let i = 0; i < out.length; i++) {
  if (out[i].m) continue;
  const prevE = i ? out[i - 1].e : 0;
  if (out[i].s < prevE) out[i].s = prevE;
  if (out[i].e < out[i].s + 0.08) out[i].e = +(out[i].s + 0.08).toFixed(3);
  const nxt = out.slice(i + 1).find((x) => x.m);
  if (nxt && out[i].e > nxt.s) out[i].e = Math.max(out[i].s + 0.05, nxt.s);
}
const final = out.map(({ w, s, e }) => ({ w, s: +s.toFixed(3), e: +e.toFixed(3) }));
fs.writeFileSync(`${T}/cut_words.json`, JSON.stringify(final, null, 1));
fs.writeFileSync(`${T}/cut_words_large.json`, JSON.stringify(final, null, 1));
console.log(`merge_words_large: ${matched}/${L.length} large words took the aligned timing → ${T}/cut_words.json`);
