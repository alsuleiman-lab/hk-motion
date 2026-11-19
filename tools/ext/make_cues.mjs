// يبني جدول الإشارات الزمنية (متى تُنطق كل كلمة مفتاحية) من تفريغ الصوت: يقرأ words.json (من asr_check.py) وملف المقاطع، ويكتب src/tayCues.ts.
//   node tools/ext/make_cues.mjs <words.json> <narration.wav.chunks.json> [src/tayCues.ts]
// كل إشارة = (اسم، الكلمة بلا تشكيل، رقم ظهورها). ما لم يُعثر عليه يُطبع ويُعوَّض بتقدير من جاره فيُراجَع بالعين.
import fs from "node:fs";
const pos = process.argv.slice(2).filter((a, i, arr) => !a.startsWith("--") && arr[i - 1] !== "--offset");
const [wordsFile, chunksFile, out = "src/tayCues.ts"] = pos;
const OFFSET = process.argv.includes("--offset") ? Number(process.argv[process.argv.indexOf("--offset") + 1]) : 0;   // مقدّمة صامتة قبل أول كلمة (ثانية)
const W = JSON.parse(fs.readFileSync(wordsFile, "utf8")).words;
const dur = +(JSON.parse(fs.readFileSync(chunksFile, "utf8")).duration + OFFSET).toFixed(2);
const norm = (s) => s.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
const N = W.map((w) => ({ n: norm(w.w), t: w.s }));
const find = (word, nth = 1) => { let k = 0; for (const x of N) if (x.n === norm(word) && ++k === nth) return x.t; return null; };
const pre = (p) => { for (const x of N) if (x.n.startsWith(p)) return x.t; return null; };
const last = (word) => { let r = null; for (const x of N) if (x.n === norm(word)) r = x.t; return r; };
const SPEC = [
  ["name0", () => find("ابن")], ["harran", () => find("حران")], ["year661", () => find("إحدى", 1) ?? pre("61")],
  ["flee", () => find("وانتقل")], ["dimashq", () => find("دمشق", 1)], ["tatar", () => find("التتار")],
  ["house", () => find("نشأ")], ["teach", () => find("ودرس")], ["age", () => find("إحدى", 2) ?? pre("21")],
  ["dispute", () => find("اشتدت")], ["qudat", () => find("القضاة")], ["umara", () => find("والأمراء")],
  ["jailed", () => find("فسجن") ?? find("سجن")], ["four", () => find("أربع")], ["eighteen", () => find("ثمانية")],
  ["cairo", () => find("القاهرة")], ["aqeeda", () => find("العقيدة")], ["alex", () => find("الإسكندرية")],
  ["citadel", () => find("قلعة", 1)], ["divorce", () => find("الطلاق")], ["last", () => find("وآخرها")],
  ["citadel2", () => find("القلعة")], ["shadd", () => find("شد")], ["died", () => find("فمات")],
  ["year728", () => last("عام")],
];
const cues = {};
const missing = [];
// الكلمة الأولى بعد سكتة بين مقطعين يقدّر التفريغ بدايتها داخل السكتة أو قبلها؛ فتُصحَّح إلى بداية المقطع (من ملف المقاطع) إن وقعت قبلها
const CH = JSON.parse(fs.readFileSync(chunksFile, "utf8")).chunks;
const fixStart = (v) => { for (let i = 1; i < CH.length; i++) { if (v < CH[i].start && v > CH[i].start - 2.2 && v >= CH[i - 1].end - 1.6) return CH[i].start + 0.04; } return v; };
for (const [k, fn] of SPEC) { let v = fn(); if (v === null || v === undefined) { missing.push(k); continue; } if (["house", "eighteen", "dispute"].includes(k)) v = fixStart(v); cues[k] = +(v + OFFSET).toFixed(2); }
if (missing.length) { console.log("غير موجودة في التفريغ:", missing.join(" ")); }
if (!cues.jailed && cues.umara) { cues.jailed = +(cues.umara + 0.9).toFixed(2); console.log("jailed تقدير:", cues.jailed); }
const body = Object.entries(cues).map(([k, v]) => `  ${k}: ${v},`).join("\n");
fs.writeFileSync(out, `/** إشارات التوقيت (بالثواني) من تفريغ الصوت: يُولَّد بـ tools/ext/make_cues.mjs ولا يُعدَّل يدوياً إلا بنص موثّق. */\nexport const AUDIO_SEC = ${dur};\nexport const CUES = {\n${body}\n};\n`);
console.log("كُتب", out, Object.keys(cues).length, "إشارة؛ المدة", dur);
