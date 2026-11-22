// Render queue (user order 2026-11-11: «اعمل برمجية للرندر تنظّمه في طابور؛ أنت تجهّز وترسل لها، هي تضعه بالانتظار»).
// I prepare a clip (spec normalised and ALL gates passed BEFORE this point), submit it, and keep working; one worker renders the jobs one at a time.
//   node tools/render_queue.mjs add --spec q2_01 --comp Q2-01-R --orient R|L --dest "<folder>" [--title "<export title>"] [--bumper end|start]   (البثوث والدروس: end = الفاصل خاتمة في آخر الفيديو)   (add many; order = submit order)
//   node tools/render_queue.mjs run        # start the single worker (refuses to start a second one); exits when the queue is empty
//   node tools/render_queue.mjs ls         # state of every job
//   node tools/render_queue.mjs retry <spec> [R|L] --reason "ما تغيّر" | drop <spec> [R|L]
// Admission gate: coverage_check + grid_plan + mg_usage_audit + a fresh prerender proof on the spec. Generic comps must match comp_kinds' resolved route.
// A failed job cannot be retried with the same input fingerprint; at most one retry is allowed after a source change and a fresh admission pass.
// Per job: tools/render_job.sh (hybrid render + opening bumper kept + judder gate on the pre-bumper original) → copy to dest → state `done`. Progress page: the worker keeps `.tmp/render_queue.log`.
// (user 2026-11-18, rules review) the bumper and the output name come from the montage: spec.bumper {id?, at?, position: start|end|none} and spec.exportTitle
// (render_job.sh decides; an old spec without them keeps the legacy default with a warning). --bumper is kept only when given (no "start" default any more),
// and `add` prints the planned bumper and file name (render_job.sh with RENDER_PLAN_ONLY=1: nothing is rendered).
//   node tools/render_queue.mjs plan --spec <id> --comp <Comp> --orient R|L [--title <t>] [--bumper …]   → the same print, no job added
// (user 2026-11-21) admission also needs a fresh pass of tools/prerender_check.mjs (.tmp/<p>/prerender.json); add … --prerender runs it first when stale.
// (user 2026-11-21: «عليه يتعرف على كل شيء ويفعل ميزات لكل شيء») a composition that is NOT a montage spec (شيخ الردود، الدبلجة، الموشن، الكرتون…) is a generic job:
//   node tools/render_queue.mjs add --comp <Id> --orient R|L --dest "<folder>" --name "<file>.mp4" [--bumper none|end] [--kind <kind>]   (no --spec; tools/comp_kinds.mjs decides
//   the folder, the name and the bumper by the kind's skill). The worker renders it with tools/gpu_render.mjs --comp, then tools/kind_review.mjs (the checks of its own kind) on the file: a failure
//   keeps the file in render_work/export (not copied to جاهز) and writes the reasons to the «راسلني» inbox for the session that owns the video.
//   add … --dry  prints the job (and the spec's render plan) and adds nothing: no admission, no pre-render check, no state written.
import fs from "node:fs";
import path from "node:path";
import { withGpuModel } from "./lib/gpu_model_lock.mjs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { overlapFailures } from "./lib/overlap_gate.mjs";
import { coverFailure } from "./cover_item.mjs";
import { freshness as prerenderFresh } from "./lib/prerender_gate.mjs";
import { resolve as resolveComp } from "./comp_kinds.mjs";
import { bashExecutable, envWithBash } from "./lib/bash_runtime.mjs";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
try { Object.assign(process.env, envWithBash(process.env)); } catch { /* Git Bash is needed only by plan/run/admission: bashExecutable() reports it there, so ls/drop/lint work without it */ }
const BUSY_WAIT_MS = Number(process.env.HK_RQ_BUSY_WAIT_MS) > 0 ? Number(process.env.HK_RQ_BUSY_WAIT_MS) : 60000;   // wait between «ممنوع رندر» retries (a test shortens it)
const DIR = "data/render_queue", STATE = path.join(DIR, "state.json"), LOCK = path.join(DIR, "worker.pid"), LOG = ".tmp/render_queue.log";
const PERMIT = path.join(DIR, "render_permit.json");
fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(".tmp", { recursive: true });
const [cmd, ...rest] = process.argv.slice(2);
const arg = (n, d = "") => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const load = () => { try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return { jobs: [] }; } };
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 1));
/* Retry cap, per identical input: a failed job whose inputs are unchanged (or unknown) stays refused — no blind retry; the same job with CHANGED inputs is a new attempt
   and its counter restarts at 0 (an old counter in state or in the log must not close the door after the source was fixed). Returns the refusal text or ""; sets job.retryCount. */
const retryGate = (prev, job, label) => {
  job.retryCount = 0;
  if (!prev) return "";
  if (prev.state === "done" && prev.inputFingerprint === job.inputFingerprint) return `✘ لم يُضف: ${label} له إخراج ناجح بالمدخلات نفسها؛ غيّر المصدر أولاً.`;
  if (prev.state === "failed" && (!prev.inputFingerprint || prev.inputFingerprint === job.inputFingerprint)) return `✘ لم يُضف: ${label} له فشل سابق بالمدخلات نفسها. أصلح المصدر ثم أعد المهمة الفاشلة مع وصف الإصلاح.`;
  return "";   // changed inputs: retryCount stays 0
};
const previousJob = (s, spec, orient) => s.jobs.find((j) => j.spec === spec && j.orient === orient)
  ?? [...(s.history ?? [])].reverse().find((j) => j.spec === spec && j.orient === orient);
const rememberJob = (s, j) => { (s.history ??= []).push({ spec: j.spec, comp: j.comp, orient: j.orient, state: j.state, inputFingerprint: j.inputFingerprint, attemptFingerprint: j.attemptFingerprint, retryCount: j.retryCount ?? 0, at: j.at, err: j.err ?? j.why ?? null }); if (s.history.length > 500) s.history.splice(0, s.history.length - 500); };
const log = (m) => { const l = `[${new Date().toTimeString().slice(0, 8)}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const sh = (c, a, env = process.env) => spawnSync(c === "bash" ? bashExecutable() : c, a, { encoding: "utf8", maxBuffer: 1 << 27, env: envWithBash(env), windowsHide: true });
const withRenderPermit = (comp, run) => {
  const token = crypto.randomUUID();
  fs.writeFileSync(PERMIT, JSON.stringify({ token, comp, at: new Date().toISOString() }));
  try { return run({ ...process.env, HK_RENDER_QUEUE_TOKEN: token }); }
  finally { try { if (JSON.parse(fs.readFileSync(PERMIT, "utf8")).token === token) fs.rmSync(PERMIT); } catch { /* permit already removed */ } }
};
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const compRouteFailure = (j) => {
  const r = resolveComp(j.comp), job = r.render?.jobs?.find((x) => x.comp === j.comp && x.orient === j.orient);
  const samePath = (a, b) => path.resolve(String(a)).toLowerCase() === path.resolve(String(b)).toLowerCase();
  if (!r.render?.ok || r.render.mode !== "comp" || r.kind !== j.kind || !r.file || !job || !samePath(j.dest, job.dest) || j.name !== job.name || (j.bumper || "none") !== (job.bumper || "none"))
    return `مسار ${j.comp} لم يعد مطابقاً لتصنيف HK-Motion الحالي؛ أعد توجيهه عبر tools/comp_kinds.mjs queue ${j.comp} --dry`;
  return "";
};

/* Stable input fingerprint: a failed output may be retried only after something that can affect it changed.
   Hash the composition and its local imports/assets; montage specs also include the cut/audio inputs and checked audio plan. */
const inputFingerprint = (j) => {
  const files = new Set(), visited = new Set();
  const add = (rel) => {
    if (!rel || typeof rel !== "string") return;
    const abs = path.resolve(root, rel), inside = path.relative(root, abs);
    if (inside.startsWith("..") || path.isAbsolute(inside) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return;
    files.add(abs);
  };
  const module = (rel) => {
    const abs = path.resolve(root, rel);
    if (visited.has(abs) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return;
    visited.add(abs); add(path.relative(root, abs));
    const src = fs.readFileSync(abs, "utf8");
    for (const m of src.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g)) {
      const base = path.resolve(path.dirname(abs), m[1]);
      for (const candidate of [base, ...[".tsx", ".ts", ".jsx", ".js", ".json", ".css", ".svg"].map((ext) => base + ext), ...["index.tsx", "index.ts", "index.jsx", "index.js"].map((n) => path.join(base, n))]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { module(path.relative(root, candidate)); break; }
      }
    }
    for (const m of src.matchAll(/["'`]((?:public|data)\/[^"'`]+)["'`]/g)) add(m[1]);
    for (const m of src.matchAll(/staticFile\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) add(path.join("public", m[1].replace(/^[/\\]+/, "")));
  };
  if (j.mode === "comp") {
    if (compRouteFailure(j)) return null;
    const r = resolveComp(j.comp);
    module(r.file);
    if (r.clip?.file) add(r.clip.file);
  } else {
    add(`data/specs/${j.spec}.json`); add(`public/${j.spec}_map.json`); add(`.tmp/${j.spec}/cut_words.json`);
    module("src/MontageSpec.tsx"); module("src/SpecComps.tsx");
    const f = prerenderFresh(j.spec, j.orient);
    if (f.ok) {
      add(f.entry.wav);
      for (const rel of Object.keys(f.entry.planStamp ?? {})) add(rel);
    }
  }
  const digest = crypto.createHash("sha256");
  digest.update(JSON.stringify({ spec: j.spec, comp: j.comp, orient: j.orient, mode: j.mode ?? "spec", kind: j.kind ?? "", bumper: j.bumper ?? "none", name: j.name ?? "" }));
  for (const abs of [...files].sort()) {
    digest.update(path.relative(root, abs).replace(/\\/g, "/"));
    digest.update(fs.readFileSync(abs));
  }
  if (!files.size) return null;
  return digest.digest("hex");
};

const admit = (spec, orient) => {
  const f = `data/specs/${spec}.json`; if (!fs.existsSync(f)) return `لا مواصفة ${f}`;
  const s = JSON.parse(fs.readFileSync(f, "utf8")), o = orient === "L" ? "land" : "port";
  const outs = [sh("node", ["tools/coverage_check.mjs", f]), sh("node", ["tools/grid_plan.mjs", f, "--o", o]), sh("node", ["tools/mg_usage_audit.mjs", f, "--minutes", String(Math.max(0.2, s.frames / 1800))]), sh("node", ["tools/writing_sync.mjs", f])];
  const bad = outs.flatMap((r) => (r.stdout.match(/✘[^\n]*/g) || []));
  { const why = coverFailure(spec, s); if (why) bad.unshift(why); }   /* (user 2026-11-21: «يعني يكون الغلاف في أوله») the cover first, its picture present */
  bad.push(...overlapFailures(spec, o));   /* (user 2026-11-20) no two elements in one place, whoever wrote them: refused at the queue entry too */
  /* (user 2026-11-21: «ليش تظهر أخطاء بعد الرندر؟ … لازم حل جذري») no job without a fresh pass of tools/prerender_check.mjs for this orientation (newer than the
     spec, the words, the cut list and the audio sources); `add --prerender` runs it first (the lesson/stream pipeline does) */
  { let fr = prerenderFresh(spec, orient); if (!fr.ok && rest.includes("--prerender")) { const r = sh("node", ["tools/prerender_check.mjs", spec, "--o", o]); if (r.status !== 0) console.log((r.stdout || "").split(/\r?\n/).filter((l) => /^✘/.test(l)).slice(0, 6).join(" | ")); fr = prerenderFresh(spec, orient); } if (!fr.ok) bad.unshift("✘ " + fr.why); }
  return bad.length ? bad.slice(0, 3).map((b) => b.slice(0, 140)).join(" | ") : "";
};

/* (user 2026-11-18, rules review) the title render_job.sh receives, and its print-only plan (bumper + output name, from spec.bumper / spec.exportTitle) */
const titleOf = (spec, t) => { if (t) return t; try { return JSON.parse(fs.readFileSync(`data/specs/${spec}.json`, "utf8")).title ?? spec; } catch { return spec; } };
const plan = (spec, comp, orient, title, bumper) => { const BASH = bashExecutable(); const r = spawnSync(BASH, ["tools/render_job.sh", spec, comp, orient, titleOf(spec, title), bumper || ""], { encoding: "utf8", env: { ...envWithBash(process.env), RENDER_PLAN_ONLY: "1" }, windowsHide: true }); return [r.error?.message, r.stderr, r.stdout].filter(Boolean).join("\n").trim(); };

const DRY = rest.includes("--dry");
const INBOX = ".tmp/hk_inbox.jsonl";
const renderedMarker = (spec, orient) => path.join(".tmp", "gates", `${spec}.${orient}.render.ok`);
const clearRenderedMarker = (spec, orient) => { try { fs.rmSync(renderedMarker(spec, orient), { force: true }); } catch { /* no old proof */ } };
const writeRenderedMarker = (j) => { const f = renderedMarker(j.spec, j.orient); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ spec: j.spec, orient: j.orient, inputFingerprint: j.inputFingerprint ?? null, file: j.to ?? j.file ?? "", at: new Date().toISOString() }, null, 1)); };
const note = (comp, text) => { try { fs.appendFileSync(INBOX, JSON.stringify({ id: Date.now().toString(36), at: new Date().toISOString(), comp, frame: 0, time: "0:00", cutTime: 0, elements: "", text, reply: null }) + "\n"); } catch { /* the queue result stands */ } };
/* (2026-11-21, «شيخ الردود - طعام لمسلمي الجن» refused by montage rules) a generic job is confirmed by ITS kind's checks (tools/kind_review.mjs: the cartoon's
   listening silences are not pauses, a non-spec video has no cut plan or smoothed cut for the judder gate), then copied to its skill's folder */
const deliverComp = (st, jj) => {
  const r = sh("node", ["tools/kind_review.mjs", jj.file, "--kind", jj.kind || "unknown", "--comp", jj.comp]), out = ((r.stdout || "") + (r.stderr || ""));
  const bad = out.split("\n").filter((l) => /^✘/.test(l.trim()) && !/الفحص النهائي لنوع/.test(l));
  jj.review = r.status === 0 ? `✔ فحص نوع «${jj.kind}»` : bad.join(" | ").slice(0, 400);
  if (r.status !== 0) { jj.state = "failed"; jj.err = `الفحص النهائي (${jj.kind}): ${jj.review}`; save(st); log(`✘ ${jj.comp}: ${jj.err} — الملف باقٍ في ${jj.file}`); note(jj.comp, `رندر هذا — رُندر ولم ينجح فحص نوعه (الملف في ${jj.file}، لم يُنسخ إلى جاهز): ${jj.review}`); return; }
  try { fs.mkdirSync(jj.dest, { recursive: true }); const to = path.join(jj.dest, jj.name); fs.copyFileSync(jj.file, to); if (fs.statSync(to).size !== fs.statSync(jj.file).size) throw new Error("copy size mismatch"); jj.state = "done"; jj.to = to; delete jj.err; }
  catch (e) { jj.state = "failed"; jj.err = String(e.message).slice(0, 160); }
  save(st); if (jj.state === "done") writeRenderedMarker(jj); log(`${jj.state === "done" ? "✔" : "✘"} ${jj.comp} ${jj.state}${jj.to ? ` → ${jj.to}` : ""}`);
};
if (cmd === "add" && !arg("spec") && arg("comp")) {
  /* a generic composition job (no montage spec): tools/comp_kinds.mjs gave the folder, the name and the bumper */
  const comp = arg("comp"), orient = arg("orient"), dest = arg("dest"), name = arg("name"), bumper = arg("bumper", "none"), requestedKind = arg("kind", "");
  if (!/^[RL]$/.test(orient) || !dest || !name || !/\.mp4$/i.test(name) || /[<>:"/\\|?*]/.test(name) || !["none", "end"].includes(bumper)) { console.error("usage: add --comp <Id> --orient R|L --dest <folder> --name <file>.mp4 [--bumper none|end] [--kind <kind>]"); process.exit(2); }
  const routed = resolveComp(comp), kind = requestedKind || routed.kind;
  const routeWhy = compRouteFailure({ comp, orient, dest, name, bumper, kind });
  if (routeWhy) {
    console.error(`✘ رفض الإضافة: ${routeWhy}`); process.exit(1);
  }
  clearRenderedMarker(comp, orient);
  const job = { spec: comp, comp, orient, dest, name, bumper, kind, mode: "comp", state: "queued", at: new Date().toISOString() };
  job.inputFingerprint = inputFingerprint(job);
  if (!job.inputFingerprint) { console.error(`✘ لا بصمة موثوقة لمدخلات ${comp}: لم يُضف للطابور`); process.exit(1); }
  if (DRY) { console.log(`DRY add ${JSON.stringify(job)}\n  رندر: node tools/gpu_render.mjs --comp ${comp} --out render_work/export/${orient}/${name} --procs 1 --windows 3${bumper === "none" ? " --no-bumper" : " (BUMPER_POSITION=end)"} ثم فحص نوعه (kind_review) ثم نسخ إلى ${dest}`); process.exit(0); }
  const s = load(), prev = previousJob(s, comp, orient);
  if (prev && ["queued", "rendering"].includes(prev.state)) { console.error(`✘ ${comp} موجود في الطابور أو يُرندر الآن؛ لم تُستبدل المهمة.`); process.exit(1); }
  { const refused = retryGate(prev, job, comp); if (refused) { console.error(refused); process.exit(1); } }
  s.jobs = s.jobs.filter((j) => !(j.spec === comp && j.orient === orient)); s.jobs.push(job); save(s);
  console.log(`✔ في الطابور: ${comp} (${s.jobs.filter((j) => j.state === "queued").length} بالانتظار)\n  → ${dest}/${name}${bumper === "end" ? " (الفاصل في آخره)" : " (بلا فاصل)"}`);
} else if (cmd === "deliver") {
  /* a generic job already rendered (its file in render_work/export): checked again by its kind and copied to its folder — no re-render */
  const s = load(), j = s.jobs.find((x) => x.mode === "comp" && x.spec === rest[0] && (!rest[1] || x.orient === rest[1]));
  if (!j || !j.file) { console.error(`لا مهمة مرندرة باسم ${rest[0]}`); process.exit(1); }
  deliverComp(s, j); console.log(j.state === "done" ? `✔ ${j.comp} → ${j.to}` : `✘ ${j.comp}: ${j.err}`); process.exit(j.state === "done" ? 0 : 1);
} else if (cmd === "add") {
  const spec = arg("spec"), comp = arg("comp"), orient = arg("orient"), dest = arg("dest");
  if (!spec || !comp || !/^[RL]$/.test(orient) || !dest) { console.error("usage: add --spec <id> --comp <Comp> --orient R|L --dest <folder> [--title <t>] [--bumper start|end|none]"); process.exit(2); }
  if (DRY) { console.log(`DRY add ${JSON.stringify({ spec, comp, orient, dest, bumper: arg("bumper", ""), prerender: rest.includes("--prerender") })}\n  القبول: التغطية والشبكة والعناصر والغلاف وفحص ما قبل الرندر${rest.includes("--prerender") ? " (يُشغَّل إن كان قديماً)" : ""}\n  ` + plan(spec, comp, orient, arg("title"), arg("bumper", "")).replace(/\n/g, "\n  ")); process.exit(0); }
  const s = load();
  const why = admit(spec, orient);
  if (why) { console.error(`✘ مرفوض ${spec}: ${why}\n  أصلحه ثم أضِفه من جديد`); process.exit(1); }
  clearRenderedMarker(spec, orient);
  const job = { spec, comp, orient, dest, title: arg("title"), bumper: arg("bumper", ""), state: "queued", at: new Date().toISOString() };
  job.inputFingerprint = inputFingerprint(job);
  const prev = previousJob(s, spec, orient);
  if (prev && ["queued", "rendering"].includes(prev.state)) { console.error(`✘ ${spec} موجود في الطابور أو يُرندر الآن؛ لم تُستبدل المهمة.`); process.exit(1); }
  { const refused = retryGate(prev, job, spec); if (refused) { console.error(refused); process.exit(1); } }
  s.jobs = s.jobs.filter((j) => !(j.spec === spec && j.orient === orient)); s.jobs.push(job); save(s);
  console.log(`✔ في الطابور: ${spec} (${s.jobs.filter((j) => j.state === "queued").length} بالانتظار)`);
  console.log("  " + plan(spec, comp, orient, arg("title"), arg("bumper", "")).replace(/\n/g, "\n  "));
} else if (cmd === "plan") {
  const spec = arg("spec"), comp = arg("comp"), orient = arg("orient");
  if (!spec || !comp || !/^[RL]$/.test(orient)) { console.error("usage: plan --spec <id> --comp <Comp> --orient R|L [--title <t>] [--bumper start|end|none]"); process.exit(2); }
  console.log(plan(spec, comp, orient, arg("title"), arg("bumper", "")));
} else if (cmd === "ls") {
  for (const j of load().jobs) console.log(`${j.spec.padEnd(8)} ${j.orient} ${j.state.padEnd(9)} ${j.why ?? j.err ?? j.to ?? ""}`.slice(0, 200));
} else if (cmd === "retry" || cmd === "drop") {
  const s = load(); const j = s.jobs.find((x) => x.spec === rest[0] && (!rest[1] || x.orient === rest[1])); if (!j) { console.error("no such job"); process.exit(1); }
  if (cmd === "drop") { if (["done", "failed"].includes(j.state)) rememberJob(s, j); s.jobs = s.jobs.filter((x) => x !== j); }
  else {
    const reason = arg("reason").trim();
    if (j.state !== "failed") { console.error(`✘ لا تُعاد مهمة حالتها ${j.state}; الإعادة متاحة للمهمة الفاشلة فقط.`); process.exit(1); }
    if (reason.length < 8) { console.error('✘ اذكر التشخيص والإصلاح بـ --reason "ما تغيّر في المصدر".'); process.exit(1); }
    if (j.mode === "comp") { const why = compRouteFailure(j); if (why) { console.error(`✘ الإعادة مرفوضة: ${why}`); process.exit(1); } }
    let now = inputFingerprint(j);
    if (!now || (j.attemptFingerprint && now === j.attemptFingerprint) || (!j.attemptFingerprint && !rest.includes("--legacy-after-fix"))) { console.error("✘ مدخلات الرندر لم تتغير منذ الفشل، أو أن المهمة القديمة تحتاج تأكيد إصلاح صريح. أعد الإضافة بعد تعديل المصدر واجتياز فحص القبول؛ لن أعيد الملف نفسه."); process.exit(1); }
    if (j.mode !== "comp") {
      const why = admit(j.spec, j.orient);
      if (why) { console.error(`✘ الإعادة مرفوضة: ${why}`); process.exit(1); }
      now = inputFingerprint(j);  // admission may rebuild a stale prerender proof; fingerprint the accepted inputs after that pass
    }
    /* one retry per identical input: the inputs just checked differ from the failed attempt's (refused above otherwise), so this is a fresh count; the same input retried again stays refused */
    if (j.inputFingerprint && now === j.inputFingerprint && (j.retryCount ?? 0) >= 1) { console.error("✘ استُنفدت الإعادة الواحدة بهذه المدخلات نفسها. أوقف الحلقة، وافحص المصدر والخطأ قبل محاولة أخرى."); process.exit(1); }
    j.retryCount = (j.inputFingerprint && now === j.inputFingerprint ? (j.retryCount ?? 0) : 0) + 1; j.inputFingerprint = now; j.retryReason = reason; j.state = "queued"; delete j.err; delete j.why;
  }
  save(s);
} else if (cmd === "run") {
  const BASH = bashExecutable();   // the worker renders through render_job.sh: fail here, loudly, when Git Bash is missing
  try { const pid = Number(fs.readFileSync(LOCK, "utf8")); if (pid && alive(pid)) { console.error(`عامل الطابور يعمل أصلاً (PID ${pid}): لا عاملين معاً.`); process.exit(1); } } catch { /* none */ }
  fs.writeFileSync(LOCK, String(process.pid));
  try { (await import("node:os")).default.setPriority(0, 10); } catch { /* below normal */ }
  { const s0 = load(); let n = 0; for (const j of s0.jobs) if (j.state === "rendering") { j.state = "queued"; n++; } if (n) { save(s0); log(`استئناف: ${n} مقطع انقطع إخراجه يعود إلى الانتظار`); } }
  const done = () => { try { fs.rmSync(LOCK); } catch { /* ignore */ } };
  process.on("exit", done); process.on("SIGINT", () => process.exit(130)); process.on("SIGTERM", () => process.exit(143));
  for (;;) {
    const s = load(), j = s.jobs.find((x) => x.state === "queued");
    if (!j) { log("الطابور فارغ"); break; }
    try {
    const stamp = inputFingerprint(j);
    if (!stamp || (j.inputFingerprint && stamp !== j.inputFingerprint)) { j.state = "failed"; j.err = "تغيّرت مدخلات الرندر بعد القبول؛ أعد فحص القبول ثم أضف المهمة من جديد"; save(s); log(`✘ ${j.comp}: ${j.err}`); continue; }
    if (j.mode === "comp") { const why = compRouteFailure(j); if (why) { j.state = "failed"; j.err = why; save(s); log(`✘ ${j.comp}: ${why}`); continue; } }
    if (!j.inputFingerprint) j.inputFingerprint = stamp;  // queued jobs created before fingerprints were introduced
    j.attemptFingerprint = stamp; j.state = "rendering"; clearRenderedMarker(j.spec, j.orient); save(s); log(`رندر ${j.spec} (${j.comp})`);
    if (j.mode === "comp") {   /* a generic composition (tools/comp_kinds.mjs): the GPU engine on the composition itself, then final_review on the file */
      const file = path.join("render_work/export", j.orient, j.name); fs.mkdirSync(path.dirname(file), { recursive: true });
      const env = { ...process.env, BUMPER_POSITION: j.bumper === "end" ? "end" : "none" };
      const ga = ["tools/gpu_render.mjs", "--comp", j.comp, "--out", file, "--procs", "1", "--windows", "3", "--name", j.comp, ...(j.bumper === "end" ? [] : ["--no-bumper"])];
      let r; for (let k = 0; k < 30; k++) { r = await withGpuModel(`رندر ${j.comp}`, () => withRenderPermit(j.comp, (permitEnv) => spawnSync(process.execPath, ga, { encoding: "utf8", maxBuffer: 1 << 27, env: { ...permitEnv, ...env, HK_RENDER_QUEUE_TOKEN: permitEnv.HK_RENDER_QUEUE_TOKEN }, windowsHide: true })), { log }); if (r.status === 0 || !/ممنوع رندر/.test((r.stdout || "") + (r.stderr || ""))) break; log(`${j.comp}: رندر آخر يعمل — أنتظر دقيقة`); Atomics.wait(new Int32Array(new SharedArrayBuffer(16)), 0, 0, BUSY_WAIT_MS); }   /* Atomics.wait needs a SHARED buffer (a plain Int32Array threw TypeError and left the job «rendering») */
      const cur = load(), jj = cur.jobs.find((x) => x.spec === j.spec && x.orient === j.orient);
      if (r.status !== 0 || !fs.existsSync(file)) { jj.state = "failed"; jj.err = `gpu_render status ${r.status} — ` + ((r.stderr || "") + (r.stdout || "")).trim().split("\n").filter((l) => /✘|ممنوع رندر/.test(l)).slice(-2).join(" ").slice(0, 200); save(cur); log(`✘ ${j.comp}: ${jj.err}`); note(j.comp, `رندر هذا — فشل الرندر: ${jj.err}`); continue; }
      jj.file = file; deliverComp(cur, jj); continue;
    }
    const title = titleOf(j.spec, j.title);
    /* (user 2026-11-18, rules review) no "start" default: an empty 5th argument lets render_job.sh take spec.bumper (or its legacy default) */
    const r = await withGpuModel(`رندر ${j.comp}`, () => withRenderPermit(j.comp, (env) => sh(BASH, ["tools/render_job.sh", j.spec, j.comp, j.orient, title, j.bumper || ""], env)), { log });
    const m = r.stdout.match(/RENDER exit 0 -> (.+)$/m);
    const cur = load(), jj = cur.jobs.find((x) => x.spec === j.spec && x.orient === j.orient);   /* by project AND orientation: matching the spec alone wrote the portrait result onto the landscape job (2026-11-12) */
    /* (2026-11-12) a passed render was marked failed with only its guard line: record WHY the job stopped (spawn error / signal / status) */
    if (!m) { jj.state = "failed"; jj.err = [r.error?.code ?? r.error?.message, r.signal && `signal ${r.signal}`, `status ${r.status}`].filter(Boolean).join(" ") + " — " + r.stdout.trim().split("\n").slice(-2).join(" ").slice(0, 200); log(`✘ ${j.spec}: ${jj.err}`); save(cur); continue; }
    const file = path.join("render_work/export", m[1].trim());
    try { fs.mkdirSync(j.dest, { recursive: true }); const to = path.join(j.dest, path.basename(file)); fs.copyFileSync(file, to); if (fs.statSync(to).size !== fs.statSync(file).size) throw new Error("copy size mismatch"); jj.state = "done"; jj.to = to; jj.file = file; }
    catch (e) { jj.state = "failed"; jj.err = String(e.message).slice(0, 160); }
    save(cur); if (jj.state === "done") writeRenderedMarker(jj); log(`${jj.state === "done" ? "✔" : "✘"} ${j.spec} ${jj.state}`);
    } catch (e) {   /* an unexpected crash inside one job (spawn, lock, copy…): that job fails with the reason, and the worker moves on instead of dying with the job left «rendering» */
      const cur = load(), jj = cur.jobs.find((x) => x.spec === j.spec && x.orient === j.orient), why = `انهار العامل أثناء المهمة: ${String(e?.stack ?? e?.message ?? e).split(String.fromCharCode(10)).slice(0, 2).join(" ").slice(0, 200)}`;
      if (jj) { jj.state = "failed"; jj.err = why; save(cur); }
      log(`✘ ${j.comp}: ${why}`); note(j.comp, `رندر هذا — فشل الرندر: ${why}`);
    }
  }
} else { console.error("usage: node tools/render_queue.mjs add|plan|run|ls|retry|drop"); process.exit(2); }
