// WordScraps never drop spoken words inside one context (user 2026-11-09, permanent rule of this element):
//   node tools/lost_words_check.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json]
// Lists the spoken words that fall between a scraps item and the next written item and are shown by nothing (not by a scraps `times`, verse/hadith/note card, rows, name tag, photo, map).
// Prints each gap as: start → next start (n) words. Exit 0 always (a report; the repeated/garbled words of the transcript show up too: judge them).
import fs from "node:fs"; import path from "node:path";
const argv = process.argv.slice(2), specF = argv.find((a) => a.endsWith(".json") && !a.includes("words"));
const spec = JSON.parse(fs.readFileSync(specF, "utf8")), wf = argv.includes("--words") ? argv[argv.indexOf("--words") + 1] : path.join(".tmp", spec.id, "cut_words.json");
const W = JSON.parse(fs.readFileSync(wf, "utf8")), items = spec.items;
const win = (i) => [(i.times?.[0] ?? i.at ?? i.from) - 0.15, (i.until ?? i.to ?? (i.at ?? 0) + (i.dur ?? 3)) + 0.1];
const cover = items.filter((i) => ["verse", "hadith", "note", "rows", "nameTag", "subscribe", "flag", "tphoto", "pic", "scholar", "clock", "crop", "news", "phone", "scene", "date", "rewrite", "flash", "pmap"].includes(i.t)).map(win);
const have = items.filter((i) => i.t === "scraps" && i.times).flatMap((i) => i.times);
const covered = (s) => cover.some(([a, b]) => s >= a && s <= b) || have.some((x) => Math.abs(x - s) < 0.04);
const wr = items.filter((i) => ["scraps", "torn"].includes(i.t)).sort((a, b) => a.at - b.at);
let n = 0;
for (let k = 0; k < wr.length - 1; k++) {
  const P = wr[k], N = wr[k + 1]; if (P.t !== "scraps" || !P.times) continue;
  const last = P.times.at(-1);
  const lost = W.filter((w) => w.s > last + 0.03 && w.s < N.at - 0.05 && !covered(w.s)).filter((w, q, a) => !(q > 0 && a[q - 1].w === w.w && Math.abs(a[q - 1].s - w.s) < 0.3));
  if (lost.length && N.at - last < 9) { n++; console.log(`⚠ ${Math.floor(P.at / 60)}:${String(Math.floor(P.at % 60)).padStart(2, "0")} → ${N.at.toFixed(1)}ث (${lost.length}): ${lost.map((w) => w.w).join(" ")}`); }
}
console.log(n ? `⚠ ${n} فجوة: كلمات منطوقة بلا كتابة داخل سياق واحد — أكملها بالقصاصات من نص كلامه أو برّرها` : "✔ لا كلمات ضائعة في الكتابة المتدفقة");
