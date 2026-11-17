// Spots where he talks to the EDITOR in the original recording (rules §5), found at prep so they are planned and cut BEFORE `stage cut`
// (2026-11-16 audit: they were only found inside cut, after the cut had run). Same cue list as requirements.mjs «ordercand» (read from its source: one list).
//   node tools/orders_scan.mjs <p>   → .tmp/<p>/orders_cand.txt (original seconds + words); each spot → montage_notes add <p> "…" --at <sec>, and its words → --rem for the cut
import fs from "node:fs";
import path from "node:path";
const p = process.argv[2];
if (!p) { console.error("usage: node tools/orders_scan.mjs <p>"); process.exit(2); }
const src = fs.readFileSync("tools/requirements.mjs", "utf8");
const line = src.split(/\r?\n/).find((l) => /^\s*const CUE = \//.test(l));
const CUE = new Function(`return ${line.trim().replace(/^const CUE = /, "").replace(/;\s*$/, "")}`)();
const norm = (s) => String(s).replace(/[ً-ْٰـ]/g, "").replace(/[إأآٱا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => norm(w).replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const W = JSON.parse(fs.readFileSync(path.join(".tmp", p, "words.json"), "utf8"));
const cues = W.filter((w) => CUE.test(bare(w.w)) || CUE.test(norm(w.w)) || /^مونتاج$/.test(norm(w.w)));
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const out = []; let last = -99;
for (const c of cues) {
  const win = cues.filter((x) => x.s >= c.s && x.s <= c.s + 12);
  if ((win.length >= 3 || /^مونتاج$/.test(norm(c.w))) && c.s - last > 20) { last = c.s; out.push(`[${c.s.toFixed(1)} ${mm(c.s)}] ${W.filter((w) => w.s >= c.s - 3 && w.s <= c.s + 15).map((w) => w.w).join(" ")}`); }
}
fs.writeFileSync(path.join(".tmp", p, "orders_cand.txt"), out.join("\n") + "\n");
console.log(`orders: ${out.length} spot(s) where he may talk to the editor → .tmp/${p}/orders_cand.txt (listen, then montage_notes add --at; cut the order words with --rem)`);
