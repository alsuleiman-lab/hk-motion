// The 12 picked elements must not be neglected (user 2026-11-14: «الذي اضيفه حدد لنفسك متى تستخدمه كي لا يهمل»).
//   node tools/pick_triggers.mjs data/specs/<p>.json [--words .tmp/<p>/cut_words.json]
// Reads what he says (cut_words) and finds the moments each element is due (its triggers below = data/elements_lab.json `where`).
// FAILS (exit 1) when an element is due somewhere in the video and the spec has no { t: "pick", el } of it (nor of an allowed alternative),
// unless the spec waives it: "skipPicks": [{ "el": "MythFact", "why": "…" }]. Prints each due moment as m:ss so the plan places it there.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const specF = argv.find((a) => a.endsWith(".json"));
if (!specF) { console.error("usage: node tools/pick_triggers.mjs data/specs/<p>.json [--words file]"); process.exit(2); }
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const spec = read(specF, null); if (!spec) { console.error("✘ cannot read " + specF); process.exit(2); }
const words = read(opt("words", path.join(".tmp", spec.id, "cut_words.json")), []);
if (!words.length) { console.log("pick_triggers: no cut_words — skipped"); process.exit(0); }
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}% ]/gu, " ").replace(/\s+/g, " ").trim();
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
// one running text with the start second of every character, so a phrase match maps back to its time
let text = ""; const at = [];
for (const w of words) { const n = norm(w.w ?? w.word ?? w.text ?? ""); if (!n) continue; if (text) { text += " "; at.push(w.s ?? w.start); } for (const _ of n) at.push(w.s ?? w.start); text += n; }

/** el: the element; also: alternatives that satisfy it; re: what makes it due (normalized text: ا for أإآ, ه for ة, ي for ى) */
const RULES = [
  { el: "SearchBar", re: /(حلقه سابقه|في حلقه|حلقتي|حلقتنا|حلقه بعنوان|راجعوا الحلقه|كتابي|كتابنا|في كتاب لي|رسالتي)/g, why: "ذكر حلقة له أو كتاباً من كتبه" },
  { el: "MythFact", re: /(خطا شائع|يظن بعض الناس|يظن كثير|يعتقد كثير|والصواب ان|والصحيح ان|هذا غير صحيح|ليس كما يظن|هذا خطا)/g, why: "قول خاطئ ثم تصحيحه" },
  { el: "BigQuestion", re: /(^| )(لماذا|فلماذا|فما الحل|فما السبب|ما السبب|والسؤال|السؤال هنا)( |$)/g, why: "سؤال محوري يجيب عنه" },
  { el: "ChatThread", re: /(قال لي|فقلت له|قلت له|سالني|ارسل لي|وصلتني رساله|راسلني|كتب لي)/g, why: "حوار أو رسالة يحكيها" },
  { el: "RingStat", re: /(\d+ ?%|بالمئه|بالمائه|في المئه|في المائه|ثلاثه ارباع|نصف الناس)/g, why: "نسبة مئوية" },
  { el: "LineGrowth", re: /(تضاعف|تضاعفت|ازداد|ازدادت|زاد عدد|ارتفع عدد|ارتفعت نسبه|في ازدياد)/g, why: "ازدياد عبر الزمن" },
  { el: "DecisionFlow", re: /(فيه تفصيل|المساله فيها تفصيل|ان كان .{1,40} اما اذا|اما اذا كان|والا فلا)/g, why: "حكم مشروط بتفصيل" },
  { el: "MindMap", re: /(جوانب|اركان|محاور|من عده جهات|عده اوجه|اقسام)/g, why: "تفكيك موضوع إلى جوانبه" },
  { el: "ViciousCycle", re: /(حلقه مفرغه|دائره مغلقه|يعود مره اخري|ثم يرجع|وهكذا دواليك|يدور في)/g, why: "دائرة تعيد نفسها" },
  { el: "InkQuote", re: /(قال ابن |قال الامام|قال شيخ الاسلام|يقول شيخ الاسلام|قال الشافعي|قال احمد|يقول ابن |قال السلف|كما قال)/g, why: "قول عالم أو حكمة يُنقل" },
  { el: "StickyNotes", also: ["FlapBoard", "rows"], re: /(اولا .{1,200} ثانيا|الامر الاول|السبب الاول|الصفه الاولي|من اسباب)/g, why: "تعداد صفات أو أسباب" },
];
const items = spec.items ?? [], skip = new Set((spec.skipPicks ?? []).map((s) => s.el));
const has = (el) => items.some((it) => (it.t === "pick" && it.el === el) || it.t === el);
let fails = 0;
for (const r of RULES) {
  const hits = [...text.matchAll(r.re)].map((m) => at[m.index] ?? 0);
  if (!hits.length) continue;
  const used = has(r.el) || (r.also ?? []).some(has);
  const where = [...new Set(hits.map(mm))].slice(0, 6).join("، ");
  if (used) console.log(`✔ ${r.el}: مستعمل (مستحق عند ${where})`);
  else if (skip.has(r.el)) console.log(`– ${r.el}: مُعفى في المواصفة (مستحق عند ${where})`);
  else { fails++; console.log(`✘ ${r.el}: ${r.why} عند ${where} — لم يُستعمل. أضف { t: "pick", el: "${r.el}", … } هناك، أو اكتب سبب تركه في "skipPicks"`); }
}
console.log(fails ? `pick_triggers FAILED: ${fails} عنصراً مستحقاً لم يُستعمل` : "pick_triggers PASSED");
process.exit(fails ? 1 : 0);
