// يبني src/jordanCues.ts لفيديو الأردن من ملف مقاطع الراوي (chunks.json) وتفريغ كلماته (asr.json من asr_check.py).
//   node tools/ext/make_jordan_cues.mjs <narration.wav.chunks.json> [<narration.wav.asr.json>] [--offset 0.5]
//   node tools/ext/make_jordan_cues.mjs --placeholder      (توقيت تقديري لاختبار التخطيط قبل الصوت)
import fs from "node:fs";
const args = process.argv.slice(2);
const off = args.includes("--offset") ? parseFloat(args[args.indexOf("--offset") + 1]) : 0.5;
const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--offset" && args[i - 1] !== "--merge");
const NAMES = ["احمد", "عصر", "عمر", "احسان", "حسام"];
const norm = (s) => s.replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
let c = [], e = [], total = 0, names = [];
if (args.includes("--placeholder")) {
  const n = 16, tot = 125;
  const w = [5, 9, 4, 8, 7, 6, 7, 9, 9, 6, 8, 6, 6, 7, 6, 7];
  const sw = w.reduce((a, b) => a + b, 0);
  let t = off;
  for (let i = 0; i < n; i++) { c.push(+t.toFixed(2)); t += (w[i] / sw) * tot; e.push(+(t - 0.3).toFixed(2)); }
  total = +(t + 2).toFixed(2);
  names = [0, 1, 2, 3, 4].map((i) => +(c[0] + (i / 5) * (e[0] - c[0])).toFixed(2));
} else {
  const ch = JSON.parse(fs.readFileSync(files[0], "utf8"));
  // --merge 1,5 : المقطع i يُدمج مع التالي له (حين قُسِّم نص جملة لضبط النطق ويبقى للمشهد مقطع منطقي واحد)
  const mergeSet = new Set(args.includes("--merge") ? args[args.indexOf("--merge") + 1].split(",").map(Number) : []);
  const logical = [];
  for (let i = 0; i < ch.chunks.length; i++) {
    if (mergeSet.has(i)) { logical.push({ start: ch.chunks[i].start, end: ch.chunks[i + 1].end }); i++; }
    else logical.push({ start: ch.chunks[i].start, end: ch.chunks[i].end });
  }
  c = logical.map((k) => +(k.start + off).toFixed(2));
  e = logical.map((k) => +(k.end + off).toFixed(2));
  total = +(ch.duration + off + 2).toFixed(2);
  const words = files[1] ? JSON.parse(fs.readFileSync(files[1], "utf8")).words ?? JSON.parse(fs.readFileSync(files[1], "utf8")) : [];
  let from = c[0] - off;
  for (let i = 0; i < NAMES.length; i++) {
    const hit = words.find((w) => w.s >= from - 0.05 && w.s <= e[0] && norm(w.w).startsWith(NAMES[i]));
    if (hit) { names.push(+(hit.s + off).toFixed(2)); from = hit.e; }
    else names.push(+(c[0] + (i / 5) * (e[0] - c[0])).toFixed(2));
  }
}
// إشارات الكلمات: [المفتاح، المقطع المنطقي، بدائل الكلمة بعد التطبيع، نسبة احتياطية من المقطع إن لم تُسمع]
const WORDS = [
  ["jordanW", 1, ["الاردن"], 0.8], ["nov", 1, ["نوفمبر"], 0.05], ["arrest", 1, ["توقيف"], 0.5], ["noStmt", 1, ["بيان"], 0.3], ["noReason", 1, ["سبب"], 0.8],
  ["back", 2, ["وليس", "ليس"], 0.0], ["mashayikh", 2, ["المشايخ"], 0.6], ["jordan2", 2, ["الاردن"], 0.85],
  ["y2016", 3, ["2016", "الفين"], 0.3], ["bars", 3, ["حبس"], 0.4], ["qorsha", 3, ["قورشه", "قرشه", "قورش", "امجد"], 0.5], ["shariah", 3, ["الشريعه"], 0.7], ["univ", 3, ["الجامعه"], 0.85],
  ["phone", 4, ["انتقاده", "انتقاد"], 0.1], ["coal", 4, ["التدخلات"], 0.4], ["trouble", 4, ["اشكالات", "اشكال"], 0.85],
  ["y2021", 5, ["2021", "الفين"], 0.3],
  ["envelope", 6, ["يطلب"], 0.0], ["wazir", 6, ["وزير"], 0.15], ["ministry", 6, ["الاوقاف"], 0.25], ["stamp", 6, ["موافقه"], 0.4], ["book", 6, ["الدورات"], 0.8],
  ["y2022", 7, ["2022", "الفين"], 0.1], ["wazir22", 7, ["وزير"], 0.35], ["clubs", 7, ["انديه", "اندية"], 0.5], ["reg", 7, ["تنظيم"], 0.8],
  ["oct", 8, ["اكتوبر"], 0.05], ["nov23", 8, ["نوفمبر"], 0.15], ["y2023", 8, ["2023", "الفين"], 0.25], ["amnesty", 8, ["العفو"], 0.3], ["n1000", 8, ["الف", "1000"], 0.4], ["cr", 8, ["اعتقلوا"], 0.5],
  ["pm", 9, ["الوزراء"], 0.15], ["n24", 9, ["24", "اربعه"], 0.8],
  ["d23", 10, ["الثالث"], 0.05], ["y2025a", 10, ["2025", "الفين"], 0.3], ["seal", 10, ["حظر", "حضر"], 0.4], ["interior", 10, ["الداخليه"], 0.5], ["brother", 10, ["الاخوان"], 0.6], ["forbidA", 10, ["الانتساب"], 0.8], ["forbidB", 10, ["الترويج"], 0.92],
  ["after", 11, ["اثر"], 0.1], ["many", 11, ["كثير"], 0.3], ["mashayikh2", 11, ["المشايخ"], 0.5], ["loyal", 11, ["موالاتهم"], 0.8], ["group", 11, ["الجماعه"], 0.95],
  ["d14", 12, ["14", "اربعه"], 0.1], ["y2025b", 12, ["2025", "الفين"], 0.2], ["closed", 12, ["اغلقت"], 0.4], ["awqaf2", 12, ["الاوقاف"], 0.5], ["albani", 12, ["الالباني"], 0.6], ["amman", 12, ["عمان"], 0.9],
  ["bookA", 13, ["افكارا", "افكار"], 0.4], ["blank", 13, ["مخالفات"], 0.85],
  ["mp", 14, ["نائب"], 0.1], ["ghiras", 14, ["غراس"], 0.55],
  ["jordan18", 15, ["الاردن"], 0.2], ["ahbash", 15, ["الاحباش"], 0.45], ["ashaera", 15, ["الاشعريه"], 0.6], ["decision", 15, ["القرار"], 0.8],
];
const W = {};
{
  const allWords = files[1] && !args.includes("--placeholder") ? (JSON.parse(fs.readFileSync(files[1], "utf8")).words ?? []) : [];
  const nz = (w) => norm(w).replace(/^[وفبلك](?=..)/, "");
  for (const [k, ci, alts, frac] of WORDS) {
    const lo = c[ci] - off - 0.3, hi = e[ci] - off + 0.3;
    const hit = allWords.find((w) => w.s >= lo && w.s <= hi && alts.some((a) => norm(w.w) === a || nz(w.w) === a || (a.length >= 4 && norm(w.w).startsWith(a))));
    W[k] = +((hit ? hit.s + off : c[ci] + (e[ci] - c[ci]) * frac)).toFixed(2);
  }
}
const named = Object.fromEntries(c.map((v, i) => ["s" + String(i).padStart(2, "0"), v]));   // إشارات مسمّاة لبوابة الفحص (موجز المشاهد)
const src = `// مولَّد بـ tools/ext/make_jordan_cues.mjs — أزمنة مقاطع الراوي (ثوانٍ في الفيديو). لا يُعدَّل يدوياً.
export const CUE = ${JSON.stringify({ c, e, total, names })} as const;
export const W = ${JSON.stringify(W)} as const;
export const CUE_NAMED = { ${Object.entries(named).map(([k, v]) => `${k}: ${v}`).join(", ")} } as const;
`;
fs.writeFileSync("src/jordanCues.ts", src);
console.log("cues", c.length, "total", total, "names", names.join(","));
