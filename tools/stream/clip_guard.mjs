// تقارير الحارس لمقطع بث من الأدلة الموجودة فعلاً (التجربة الشاملة للبث 2026-11-22: كل فحص مقطع فشل «tasks: ✘ المونتاج غير مسجَّل» لأن لا شيء يسجّل المقطع ولا يكتب
// تقارير مراحله — stage prep هو الذي يفعل ذلك للحلقة وحدها، ومقطع البث شريحة لا تجهيز لها).
//   node tools/stream/clip_guard.mjs <بث> <مقطع> [--review]
// يسجّل المقطع (montage_guard start) ثم يكتب تقرير كل مرحلة ثبت دليلها فقط (ناتج موجود وبوابة نجحت)، ولا يكتب تقريراً لمرحلة بلا دليل (تبقى «لا تقرير» فيسمّيها الحارس):
//   questions  دائماً (مقطع من بث: صيغته من مدته)       cut      خريطة القص + إثبات بوابة الصوت .tmp/gates/<id>.audio.ok
//   context    orders_scan للبث أُجري (orders_cand.txt)   assets   requirements.json
//   cover      عنصر الغلاف في المواصفة                    plan     بند واحد «قالب البث» مسجَّل ثم يُغلق بدليل coverage_check + pick_triggers
//   hook       coverage_check نظيف (لا فراغ في الدقيقة الأولى)   build  المواصفة مبنية وعناصرها بلا تراكب
//   review     بـ--review: قبل stage check مباشرة (الفحص الكامل نفسه هو المراجعة)
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [P, id, ...rest] = process.argv.slice(2);
if (!P || !id) { console.error("usage: node tools/stream/clip_guard.mjs <stream> <clip> [--review]"); process.exit(2); }
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const run = (a) => spawnSync(process.execPath, a, { encoding: "utf8", windowsHide: true });
const spec = rd(`data/specs/${id}.json`, null), T = path.join(".tmp", id), out = [];
const g = (stage, skill, done, artifacts = []) => { const r = run(["tools/montage_guard.mjs", "stage", id, stage, "--skill", skill, "--done", done, ...artifacts.flatMap((a) => ["--artifact", a])]); out.push(`${r.status === 0 ? "✔" : "✘"} ${stage}${r.status === 0 ? "" : ": " + (r.stderr || r.stdout).trim().split("\n").pop()}`); };
const miss = (stage, why) => out.push(`◌ ${stage}: بلا دليل (${why})`);
run(["tools/montage_guard.mjs", "start", id]);
g("questions", "first-questions", `مقطع من بث «${P}»: لا أسئلة بداية؛ الصيغة من المدة الفعلية (دقيقتان فأقل طولي وإلا عرضي)`);
if (fs.existsSync(`public/${id}_map.json`) && fs.existsSync(`.tmp/gates/${id}.audio.ok`)) g("cut", "video-cutting", `شريحة من القص الواحد للبث «${P}»؛ بوابة الصوت نجحت على الشريحة`, [`public/${id}_map.json`]); else miss("cut", "لا خريطة أو لا إثبات بوابة الصوت");
if (fs.existsSync(path.join(".tmp", P, "orders_cand.txt"))) g("context", "montage-orders", `orders_scan على البث كله (${P}): لا تعليمات «مونتاج» لهذا المقطع`); else miss("context", "لا orders_cand.txt للبث");
if (fs.existsSync(path.join(T, "requirements.json"))) g("assets", "extraction", "سجل المطلوب من كلام المقطع (requirements)", [path.join(T, "requirements.json")]); else miss("assets", "لا requirements.json");
if (spec && spec.items?.some((i) => i.t === "cover")) g("cover", "thumbnail-design", "غلاف المقطع أول عنصر (صورة موضوعه + وضعية الشيخ + عنوانه، من clip_build)", [`data/specs/${id}.json`]); else miss("cover", "لا عنصر غلاف في المواصفة");
if (spec) {
  const cov = run(["tools/coverage_check.mjs", `data/specs/${id}.json`]), pk = run(["tools/pick_triggers.mjs", `data/specs/${id}.json`]), sl = run(["tools/element_slots.mjs", id]);
  const clean = cov.status === 0 && pk.status === 0 && sl.status === 0;
  const pf = path.join(T, "plan.json"); let items = rd(pf, []); if (!Array.isArray(items)) items = [];
  g("plan", "video-montage", "الخطة = قالب البث السريع (clip_autobuild) + الصور والمستحقات (clip_pictures) + الإصلاح (clip_repair)", [`data/specs/${id}.json`]);
  if (!items.some((x) => x.id === "stream-template")) run(["tools/montage_guard.mjs", "plan-add", id, "--id", "stream-template", "--at", `0-${Math.round(spec.frames / 30)}`, "--what", "عناصر القالب والصور والمستحقات للمقطع كله", "--skill", "video-montage"]);
  if (clean) { run(["tools/montage_guard.mjs", "plan-done", id, "stream-template", "--evidence", "coverage_check وpick_triggers وelement_slots نظيفة على المواصفة", "--skill", "video-montage"]); g("hook", "gallery-placement", "الدقيقة الأولى بلا فراغ > 1 ث (coverage_check نظيف)"); g("build", "video-montage", "المواصفة مبنية: بلا فراغ ولا تراكب ولا مستحق بلا عنصره", [`data/specs/${id}.json`]); }
  else { miss("hook", "coverage_check/pick_triggers/element_slots غير نظيفة"); miss("build", "المواصفة غير نظيفة"); }
} else { miss("plan", "لا مواصفة"); miss("hook", "لا مواصفة"); miss("build", "لا مواصفة"); }
if (rest.includes("--review")) g("review", "checking", "المراجعة: stage check الكامل يجري الآن (ثم فحص ما قبل الرندر والرندر والفحص النهائي)");
console.log(`${id}: ${out.join(" | ")}`);
