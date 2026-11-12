// node tools/scraps_times.mjs data/specs/<p>.json [--check]  → writes `times` (the second each word is spoken) into every `scraps` item from .tmp/<p>/cut_words.json
import fs from "node:fs"; import path from "node:path";
import { align } from "./lib/scraps_times.mjs";
const f = process.argv[2], check = process.argv.includes("--check");
const spec = JSON.parse(fs.readFileSync(f, "utf8"));
const words = JSON.parse(fs.readFileSync(path.join(".tmp", spec.id, "cut_words.json"), "utf8"));
let n = 0, bad = 0;
for (const it of spec.items) if (it.t === "scraps") {
  const tm = align(it.text, it.at, it.until, words), nW = it.text.split(" ").length;
  const miss = tm.filter((x) => x == null).length;
  if (miss > nW / 2) { console.log(`✘ «${it.text}» (${it.at}): لم تُطابَق ${miss}/${nW} كلمات`); bad++; continue; }
  // a word that could not be matched sits between its matched neighbours (never at the previous word's time: it would show before it is spoken)
  const fixed = tm.map((x, i) => { if (x != null) return x; let p = i - 1; while (p >= 0 && tm[p] == null) p--; let q = i + 1; while (q < tm.length && tm[q] == null) q++; const t0 = p >= 0 ? tm[p] : it.at, t1 = q < tm.length ? tm[q] : it.until; return Math.round((t0 + ((t1 - t0) * (i - p)) / (q - p)) * 100) / 100; });
  for (let i = 1; i < fixed.length; i++) { const c = Math.round(Math.max(fixed[i], fixed[i - 1] + 0.04) * 100) / 100; if (c - fixed[i] <= 0.25) fixed[i] = c; }   // a word never shows before the one that precedes it (small mis-ordering of the aligner output; a big jump means the transcript itself is jumbled there and is left as spoken)
  if (!check) { it.times = fixed; n++; }
}
if (!check) { fs.writeFileSync(f, JSON.stringify(spec, null, 1)); console.log(`scraps_times: ${n} items timed${bad ? `, ${bad} unmatched` : ""}`); }
process.exit(bad ? 1 : 0);
