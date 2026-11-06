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
  const fixed = tm.map((x, i) => x ?? (i ? tm[i - 1] ?? it.at : it.at));
  if (!check) { it.times = fixed; n++; }
}
if (!check) { fs.writeFileSync(f, JSON.stringify(spec, null, 1)); console.log(`scraps_times: ${n} items timed${bad ? `, ${bad} unmatched` : ""}`); }
process.exit(bad ? 1 : 0);
