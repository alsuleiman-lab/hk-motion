// مدير زمن البث: من التسجيل إلى المقاطع المرندرة في ساعتين (أمر المستخدم 2026-11-16: «عملية التقطيع يجب ألا تستغرق أكثر من ساعتين كاملتين حتى نهاية الرندر»).
// لا يقص ولا يبني بنفسه؛ يضع ميزانية لكل مرحلة، ويقيس الزمن الفعلي، ويشغّل المراحل المتوازية (التقسيم، الفحوص، الطابور)، ويقف ويبلّغ عند تجاوز المرحلة ميزانيتها بدل أن يُعيدها في حلقة.
//   node tools/stream/fast_run.mjs start  <بث>              يكتب بداية الساعتين (.tmp/<p>/fast_run.json) ويعرض الميزانية
//   node tools/stream/fast_run.mjs status <بث>              الزمن المنقضي والمتبقي وزمن كل مرحلة مقيسة مقابل ميزانيتها
//   node tools/stream/fast_run.mjs mark   <بث> <مرحلة> start|end
//   node tools/stream/fast_run.mjs slice  <بث> [--jobs 4]   يقتطع كل المقاطع شرائح من القص الواحد، أربعة معاً، وبوابة الصوت لكل شريحة
//   node tools/stream/fast_run.mjs checks <بث> [--jobs 3] [--only a,b]   فحص كل مقطع بُنيت مواصفته، ثلاثة معاً، ويكتب الجدول .tmp/<p>/fast_checks.json (الناجح لا يُعاد)
//   node tools/stream/fast_run.mjs queue  <بث> [--dest <مجلد>]  يضع كل مقطع نجح فحصه في طابور الرندر (--bumper end) ثم يشغّل العامل
// ميزانية الساعتين (دقائق): قص 8 · كلمات النموذج الكبير 12 · تنعيم 15 (بالتوازي مع الكلمات) · تقسيم 12 · بناء الخطط والمواصفات 35 · فحوص 15 (متداخلة مع البناء) · رندر 45 (يبدأ عند أول مقطع ناجح).
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawn, spawnSync } from "node:child_process";
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [cmd, P, ...rest] = process.argv.slice(2);
if (!cmd || !P) { console.error("usage: node tools/stream/fast_run.mjs start|status|mark|slice|checks|queue <stream> …"); process.exit(2); }
const arg = (n, d = "") => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const T = path.join(".tmp", P), F = path.join(T, "fast_run.json"), TOTAL = 120;
const BUDGET = { cut: 8, words: 12, smooth: 15, slice: 12, build: 35, checks: 15, render: 45 };
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const st = () => rd(F, { t0: null, marks: {} });
const save = (s) => { fs.mkdirSync(T, { recursive: true }); fs.writeFileSync(F, JSON.stringify(s, null, 1)); };
const min = (ms) => (ms / 60000).toFixed(1);
const show = () => {
  const s = st(); if (!s.t0) { console.log("لم تبدأ الساعتان: node tools/stream/fast_run.mjs start " + P); return; }
  const el = Date.now() - s.t0, left = TOTAL * 60000 - el;
  console.log(`الساعتان: انقضى ${min(el)} د، المتبقي ${min(left)} د${left < 0 ? " ✘ تجاوز الحدّ" : ""}`);
  for (const [k, b] of Object.entries(BUDGET)) { const m = s.marks[k]; if (!m) { console.log(`  ${k.padEnd(7)} ميزانية ${b} د — لم تبدأ`); continue; }
    const d = (m.end ?? Date.now()) - m.start; console.log(`  ${k.padEnd(7)} ${min(d)} د من ${b} ${m.end ? "✔" : "(جارية)"}${d / 60000 > b ? "  ✘ تجاوزت ميزانيتها: أوقفها وعالج السبب ولا تُعد المرحلة في حلقة" : ""}`); }
};
const mark = (stage, what) => { const s = st(); s.marks[stage] ??= {}; if (what === "start") { s.marks[stage].start = Date.now(); delete s.marks[stage].end; } else s.marks[stage].end = Date.now(); save(s); };
if (cmd === "start") {
  // المساحة أولاً (2026-11-16: القرص امتلأ إلى 14 جيغابايت أثناء دمج القص فأبطأ الدمج ثماني دقائق): ذاكرة مجموعات القص (.tmp/cache/*/cutgroups) تتراكم 1–7 جيغابايت لكل قص ولا تُستعمل بعد تغيّر القص، فأحذف ما لم يُلمس منها منذ 12 ساعة، وأشترط 40 جيغابايت حرّة.
  { const cr = path.join(".tmp", "cache"); let freed = 0;
    for (const d of fs.existsSync(cr) ? fs.readdirSync(cr) : []) { const g = path.join(cr, d, "cutgroups"); try { if (Date.now() - fs.statSync(g).mtimeMs > 12 * 3600e3) { const n = fs.readdirSync(g).length; fs.rmSync(g, { recursive: true, force: true }); freed += n; } } catch { /* none */ } }
    const df = spawnSync("df", ["-BG", "/s"], { encoding: "utf8" }).stdout.split("\n")[1]?.trim().split(/\s+/), free = Number((df?.[3] ?? "0").replace("G", ""));
    console.log(`المساحة الحرة على S: ${free} جيغابايت${freed ? ` (حُذفت ${freed} ملفاً من ذاكرة القص القديمة)` : ""}${free < 40 ? " ✘ أقل من 40: أخبر المستخدم قبل البدء" : ""}`); }
  save({ t0: Date.now(), marks: {} }); console.log(`بدأت الساعتان الآن؛ الميزانية (دقائق): ${Object.entries(BUDGET).map(([k, v]) => `${k} ${v}`).join(" · ")}`); }
else if (cmd === "status") show();
else if (cmd === "mark") { mark(rest[0], rest[1] ?? "start"); show(); }
else if (cmd === "slice") {
  if (!st().t0) save({ t0: Date.now(), marks: {} });
  mark("slice", "start");
  const r = spawnSync(process.execPath, ["tools/stream/clip_cut_all.mjs", path.join(T, "plan.json"), "--jobs", arg("jobs", "4")], { stdio: "inherit" });
  mark("slice", "end"); show(); process.exit(r.status ?? 1);
} else if (cmd === "checks" || cmd === "queue") {
  const table = rd(path.join(T, "clip_table.json"), []); if (!table.length) { console.error("لا جدول مقاطع: شغّل slice أولاً"); process.exit(1); }
  const CF = path.join(T, "fast_checks.json"), res = rd(CF, {});
  const pascal = (x) => x.split(/[-_ ]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");   // كما في tools/spec_register.mjs
  const realDur = (c) => { const s = rd(`data/specs/${c.id}.json`, null); return s?.frames ? s.frames / 30 : c.dur; };   // مدة المواصفة الفعلية لا مدة الخطة (قصّ السكتات يقصّرها)
  const orientOf = (c) => (c.kind === "reel" || realDur(c) <= 120 ? "R" : "L");   // دقيقتان فأقل طولي، وأكثر عرضي (AGENTS.md)
  const compOf = (id, o = "R") => pascal(id).replace(/([a-z0-9])([A-Z])/g, "$1-$2") + (o === "L" ? "-L" : "");
  const only = arg("only") ? new Set(arg("only").split(",")) : null;
  if (cmd === "checks") {
    mark("checks", "start");
    const todo = table.filter((c) => (!only || only.has(c.id)) && fs.existsSync(`data/specs/${c.id}.json`) && res[c.id]?.ok !== true);
    const jobs = Math.max(1, Number(arg("jobs", "3"))); let next = 0;
    const one = (c) => new Promise((done) => {
      const t0 = Date.now(), ch = spawn(process.execPath, ["tools/stage.mjs", "check", c.id, compOf(c.id, orientOf(c)), "--file", "src/Root.tsx", "--minutes", String(Math.max(0.2, realDur(c) / 60).toFixed(2))], { windowsHide: true });
      let out = ""; ch.stdout.on("data", (d) => (out += d)); ch.stderr.on("data", (d) => (out += d));
      ch.on("close", (code) => { res[c.id] = { ok: code === 0, s: Math.round((Date.now() - t0) / 1000), why: code === 0 ? "" : out.split("\n").filter((l) => /✘/.test(l)).slice(-2).join(" | ").slice(0, 300) }; fs.writeFileSync(CF, JSON.stringify(res, null, 1));
        console.log(`${code === 0 ? "✔" : "✘"} ${c.id} (${res[c.id].s}s) ${res[c.id].why}`); done(); });
    });
    await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, async () => { while (next < todo.length) await one(todo[next++]); }));
    mark("checks", "end"); show();
    process.exit(table.some((c) => res[c.id]?.ok !== true) ? 1 : 0);
  } else {
    const dest = arg("dest", "C:\\Users\\mshms\\Videos\\جاهز\\بثوث\\طولي");
    const ready = table.filter((c) => res[c.id]?.ok === true && (!only || only.has(c.id)));
    for (const c of ready) { const spec = rd(`data/specs/${c.id}.json`, {});
      const r = spawnSync(process.execPath, ["tools/render_queue.mjs", "add", "--spec", c.id, "--comp", compOf(c.id, orientOf(c)), "--orient", orientOf(c), "--dest", orientOf(c) === "L" ? dest.replace(/طولي$/, "عرضي") : dest, "--title", spec.title ?? c.topic, "--bumper", "end"], { encoding: "utf8" });
      console.log((r.stdout || r.stderr || "").trim().split("\n").pop()); }
    mark("render", "start");
    spawn(process.execPath, ["tools/render_queue.mjs", "run"], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    console.log(`${ready.length} مقطعاً في الطابور والعامل يعمل؛ المراقبة: node tools/render_queue.mjs ls`);
  }
} else { console.error("أمر مجهول"); process.exit(2); }
