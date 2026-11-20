// AN ELEMENT MUST NOT COME LATE AFTER ITS WORDS (user 2026-11-20, frame 321: «أنا ذكرت الحلقة ولكنك لم تضعها… يجب أن نلتزم بالوقت»).
// tools/writing_sync.mjs refuses writing BEFORE its words; this is the other side. For every item that names something (name, text, title, query, caption…),
// its content words are looked for in the cut transcript in the 8 s before it shows: when the name was said there and NOT again within 1.5 s before / 1 s
// after the moment it shows, the item is late by that gap. > 2.5 s = ✘ (refused by the el.mjs gate), 1.5–2.5 s = ⚠.
// A searched phrase (SearchBar) shows when it is typed (typeAt); a picture inside it (img) has no words of its own and is not judged here.
//   node tools/late_check.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json]
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json") && !a.includes("cut_words"));
if (!specF) { console.error("usage: node tools/late_check.mjs data/specs/<p>.json"); process.exit(2); }
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const spec = JSON.parse(fs.readFileSync(specF, "utf8"));
const wordsF = opt("words", path.join(".tmp", spec.id, "cut_words.json"));
if (!fs.existsSync(wordsF)) { console.log(`⚠ لا نص للقص (${wordsF}): لم يُفحص التأخر`); process.exit(0); }
const W = JSON.parse(fs.readFileSync(wordsF, "utf8")), words = Array.isArray(W) ? W : W.words;
const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
const strip = (w) => norm(w).replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل|ك)(?=.{3,})/, "");
const STOP = new Set(["هذا", "هذه", "ذلك", "التي", "الذي", "الذين", "لكن", "كان", "يكون", "ماذا", "كيف", "لماذا", "اكثر", "بعد", "قبل", "عند", "حتي", "غير", "بين", "رضي", "الله", "عنه", "عنها", "عنهم", "تعالي", "سبحانه", "صلي", "عليه", "وسلم", "مقطع", "صوره", "حلقه"]);
const toks = (text) => [...new Set(String(text ?? "").split(/\s+/).map(strip).filter((t) => t.length >= 3 && !STOP.has(t)))];
const ws = words.map((w) => ({ s: w.s ?? w.start, t: strip(w.w ?? w.word ?? w.text ?? "") }));
const match = (q, t) => t === q || (q.length >= 4 && t.length >= 4 && (t.startsWith(q) || q.startsWith(t)));
const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const LABEL = ["name", "text", "title", "query", "caption", "label", "who"];
const out = [];
for (const it of spec.items) {
  if (it.t === "subscribe" || it.t === "cover" || it.t === "wm") continue;
  const show = it.t === "pick" && it.typeAt != null ? it.typeAt : it.at ?? it.from; if (show == null) continue;
  const label = LABEL.map((k) => it[k]).find((v) => typeof v === "string" && v.trim()); if (!label) continue;
  const T = toks(label); if (!T.length) continue;
  const said = ws.filter((w) => T.some((q) => match(q, w.t)));
  if (said.some((w) => w.s >= show - 1.5 && w.s <= show + 1)) continue;   // said at the moment it shows
  const before = said.filter((w) => w.s < show - 1.5 && w.s >= show - 8).pop(); if (!before) continue;
  const late = show - before.s;
  out.push(`${late > 2.5 ? "✘" : "⚠"} متأخر ${late.toFixed(1)} ث: #${it.id ?? "?"} «${label.slice(0, 40)}» يظهر ${mm(show)} والكلمة قيلت ${mm(before.s)} (${before.s.toFixed(2)})`);
}
/* (user 2026-11-20, frame 2765: «أبقيت اسم علي كثيراً، لا يسمح ببقاء عنصر كثيراً إلا إذا كان عنصراً شرحياً… صورة تبقى هيك غلط، انتهت الحاجة إليها»)
   a PICTURE (person, place, photo) stays while it is spoken about: > 10 s is refused, 7–10 s warned. An explaining element (a calculation, a clip, a map
   explained on, a news page read out) may stay longer: mark it "explain": true in the spec with the reason. */
for (const it of spec.items) {
  if (!["scholar", "tphoto", "pic"].includes(it.t) || it.explain) continue;
  const a = it.at ?? it.from, b = it.until ?? it.to; if (a == null || b == null) continue;
  const d = b - a; if (d <= 7) continue;
  out.push(`${d > 10 ? "✘" : "⚠"} باقٍ طويلاً ${d.toFixed(1)} ث: #${it.id ?? "?"} «${String(it.name ?? it.src ?? "").slice(0, 40)}» ${mm(a)}–${mm(b)} — صورة تذهب حين تنتهي الحاجة إليها`);
}
/* (user 2026-11-20, frame 7976: «المؤثر الذي وضعته على الخلفية ثابت، وبقي مدة طويلة… المؤثرات على الخلفية تعبر عن الموضوع، فلا يسمح بمؤثر ثابت») a scene
   effect lives a few seconds around its words and keeps moving: > 8 s refused */
for (const it of spec.items.filter((x) => x.t === "scenefx")) { const d = it.to - it.from; if (d > 8) out.push(`✘ مؤثر خلفية طويل ${d.toFixed(1)} ث: #${it.id} ${it.fx} ${mm(it.from)}–${mm(it.to)} — المؤثر قصير متحرك عند كلماته`); }
const bad = out.filter((l) => l.startsWith("✘")).length;
console.log(out.length ? out.join("\n") : "✔ لا عنصر متأخر عن كلامه");
if (bad) console.log(`✘ ${bad} مخالفة وقت: عنصر متأخر عن كلامه أكثر من 2.5 ث أو صورة باقية بعد الحاجة إليها`);
process.exit(bad ? 1 : 0);
