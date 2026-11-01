// Audit: did the montage actually USE the motion-kit pieces, and with variety? (user order 2026-10-20: mandatory, varied, as many as fit)
//   node tools/mg_usage_audit.mjs src/<Composition>.tsx [--minutes 8]
// Scans the file (and the src files it imports from ./) for JSX uses of the kit components. FAILS (exit 1) if distinct kit kinds < needed
// (max(4, ceil(minutes*0.8)), capped at 10) or any single kind is used more than 3 times. Run it before saying «انتهيتُ».
import fs from "node:fs";
import path from "node:path";

const KIT = {
  "عدّاد/خط زمني": ["TimelineCounter", "TimelineTravel"],
  "تحويل مشترك": ["MorphBox"],
  "صندوق كتابة": ["TypeBox"],
  "ومضات تقريب": ["FlashCut"],
  "التقاء مصادر": ["ConvergeMerge"],
  "ظهور ضبابي": ["BlurRise"],
  "قائمة→لوحة": ["PanelToCanvas"],
  "جوال": ["PhoneChips"],
  "نافذة تحسين/ملاحظة": ["RewriteWindow", "TiltNote"],
  "شطب": ["BrushX"],
  "مشي المصدر": ["SakugaMove", "SourceWalk"],
  "كشّاف": ["SpotlightCard"],
  "عبارة مفتاحية": ["KeyChip"],
  "ملاحظة ممزقة": ["TornNote"],   // the key phrase of the full screen (user 2026-10-31); KeyChip is the half screen's
  "بطاقات بنود": ["StatRow"],
  "اشتراك": ["Subscribe"],
  "بطاقة اسم": ["NameTag", "NameCard1", "NameCard3"],
};
const file = process.argv[2];
if (!file) { console.error("usage: node tools/mg_usage_audit.mjs src/<File>.tsx [--minutes 8]"); process.exit(2); }
const minutes = Number(process.argv.includes("--minutes") ? process.argv[process.argv.indexOf("--minutes") + 1] : 5);
const seen = new Set(), texts = [];
const walk = (f) => {
  const p = path.resolve(f);
  if (seen.has(p) || !fs.existsSync(p)) return;
  seen.add(p);
  const t = fs.readFileSync(p, "utf8");
  texts.push(t);
  for (const m of t.matchAll(/from\s+"(\.\/[^"]+)"/g)) {
    const base = path.resolve(path.dirname(p), m[1]);
    if (/MG(Extras)?$|EuKit$|MotionKit$|mgThemes$|localFonts$/.test(base)) continue; // the kit itself, not its uses
    for (const ext of [".tsx", ".ts"]) if (fs.existsSync(base + ext)) walk(base + ext);
  }
};
// a data-driven montage (data/specs/<id>.json, src/MontageSpec.tsx): count each item as the kit component the renderer draws for it (2026-10-27)
const SPEC_KIT = { blur: "BlurRise", pic: "SourceWalk", rewrite: "RewriteWindow", flash: "FlashCut", phone: "PhoneChips", word: "KeyChip", torn: "TornNote", rows: "StatRow", subscribe: "Subscribe", nameTag: "NameTag" };
if (file.endsWith(".json")) {
  const spec = JSON.parse(fs.readFileSync(file, "utf8"));
  texts.push(spec.items.map((it) => { const k = it.t === "crop" && it.walk ? "SourceWalk" : SPEC_KIT[it.t]; return k ? `<${k} />` : ""; }).join("\n"));
  seen.add(path.resolve(file));
} else walk(file);
const all = texts.join("\n"), counts = {};
for (const [kind, names] of Object.entries(KIT)) counts[kind] = names.reduce((n, nm) => n + (all.match(new RegExp(`<${nm}[\\s>/]`, "g")) ?? []).length, 0);
const used = Object.entries(counts).filter(([, n]) => n > 0), need = Math.min(9, Math.max(4, Math.ceil(minutes * 0.8)));
console.log(`ملفات مفحوصة: ${seen.size} | المدة المفترضة: ${minutes} د | المطلوب: ${need} أنواع مختلفة على الأقل من القطع\n`);
for (const [k, n] of Object.entries(counts)) console.log(`${n > 0 ? "✔" : "·"} ${k}: ${n}`);
const EXEMPT = new Set(["عبارة مفتاحية", "ملاحظة ممزقة", "اشتراك", "بطاقة اسم"]);   // content/periodic obligations, not decoration (user 2026-10-29: «أنت لا تكتب الكلمات المهمة»): no cap
const over = used.filter(([k, n]) => n > 3 && !EXEMPT.has(k));
const ok = used.length >= need && over.length === 0;
console.log(`\nالأنواع المستعملة: ${used.length}/${need}${over.length ? ` | مفرَط الاستعمال (>3): ${over.map(([k]) => k).join("، ")}` : ""}`);
console.log(ok ? "✅ تنويع كافٍ." : "✘ ناقص: استعمل أنواعاً أخرى مناسبة للكلام أو خفّف المكرَّر.");
process.exit(ok ? 0 : 1);
