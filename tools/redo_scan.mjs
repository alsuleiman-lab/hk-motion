// Lists every spot where the speaker corrects himself, so the wrong attempt is cut BEFORE the montage (rule: «أعيد/عفواً» = delete the first attempt).
//   node tools/redo_scan.mjs <project>        reads .tmp/<p>/words.json (source seconds) → prints each marker with the words around it and a suggested --rem range
// Whisper spells the markers wrongly («عفواً» came out as «أفوال»), so a marker is matched by a spelling family, and a repeated 2-word phrase within 6 words is also listed.
// It only SUGGESTS: the range to delete starts where the wrong phrase starts (usually 2–4 words before the marker) and ends at the marker's last word; confirm on the transcript.
import fs from "node:fs";
import path from "node:path";

const p = process.argv[2];
if (!p) { console.error("usage: node tools/redo_scan.mjs <project>"); process.exit(2); }
const norm = (w) => w.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^ء-ي]/g, "");
const MARK = ["افضل", "عفوا", "عفو", "افوال", "افوان", "افون", "افوه", "افوا", "افو", "اعيد", "اعد", "معليش", "اسف", "غلطت", "غلط", "خطا", "اقصد", "قصدي", "لحظه", "من جديد", "مره ثانيه", "اصحح", "تصحيح", "اعيدها", "عفوان"];
const W = JSON.parse(fs.readFileSync(path.join(".tmp", p, "words.json"), "utf8"));
const N = W.map((w) => norm(w.w));
const fmt = (a, b) => W.slice(Math.max(0, a), Math.min(W.length, b)).map((w) => `${w.w}[${w.s.toFixed(1)}]`).join(" ");
const hits = [];
N.forEach((n, i) => {
  if (MARK.includes(n) || (n === "من" && N[i + 1] === "جديد") || (n === "مره" && N[i + 1] === "ثانيه")) hits.push({ i, why: "علامة تصحيح" });
});
// a 3-word phrase said twice within 8 words (a stumble then the retake)
for (let i = 0; i + 3 < N.length; i++) for (let k = 3; k <= 8; k++) {
  if (i + k + 1 < N.length && N[i] && N[i] === N[i + k] && N[i + 1] === N[i + k + 1] && N[i + 2] === N[i + k + 2] && N[i].length > 2 && !hits.some((h) => Math.abs(h.i - i) < 4)) { hits.push({ i, k, why: "عبارة مكررة" }); break; }
}
hits.sort((a, b) => a.i - b.i);
for (const h of hits) {
  const a = Math.max(0, h.i - 4), b = h.i + 3;
  if (h.k) console.log(`[${W[h.i].s.toFixed(1)}] ${h.why} (العبارة نفسها بعد ${h.k} كلمات — غالباً خطأ ثم إعادة): ${fmt(h.i, h.i + h.k + 3)}
      اقتراح --rem ${(W[h.i].s - 0.05).toFixed(2)}-${(W[h.i + h.k].s - 0.05).toFixed(2)}   (يحذف المحاولة الأولى حتى بداية الإعادة؛ إن كانت بلاغة متعمدة فلا تحذف)`);
  else console.log(`[${W[h.i].s.toFixed(1)}] ${h.why}: ${fmt(a, b)}
      اقتراح --rem ${W[Math.max(0, h.i - 3)].s.toFixed(2)}-${(W[Math.min(W.length - 1, h.i)].e + 0.05).toFixed(2)}   (الخطأ ثم العلامة ثم الإعادة)`);
}
console.log(`→ ${hits.length} موضع محتمل (كل ما سبق يُراجع قبل stage cut)`);
