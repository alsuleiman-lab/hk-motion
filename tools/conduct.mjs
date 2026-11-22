// THE CONDUCTOR — the written procedure as a state machine, so that I follow it by the system and not by memory
// (user 2026-11-22: «هذه هي مشكلتي الكبيرة معك، أنك ما تلتزم. كيف بدي ألزمك ما أعرف… أنا بدي كيف أنت تلتزم بالخطة الموجودة عندنا، دائماً تبقى ملتزم»;
// the day before, a stream plan was presented from memory: wrong order, verses and hadiths missing).
// The procedure lives in data/pipelines/<kind>.json (steps, dependencies, parallel, the exact command or creative input, the gate, the budget, the skill item);
// tools/lib/conduct_core.mjs is the machine; tools/hooks/guard.mjs refuses a pipeline command that is not the current step or an allowed parallel one,
// adds «الخطوة الحالية: … — المتبقي: … د» to every prompt and tool, and sends back a «done» claim with steps open and any plan presented from memory.
//   node tools/conduct.mjs plan <kind> [--json]       the written plan (the ONLY source for a plan presented to the user)
//   node tools/conduct.mjs start <kind> <project> [--set k=v] [--def file]   starts the run: the clock and .tmp/<p>/conduct.json
//   node tools/conduct.mjs next [project]             the ONE current step: what to do, the command or the creative input, the gate, the budget, the time left;
//                                                      an automatic step is started here (long ones in the background with a watcher), parallel ones with it
//   node tools/conduct.mjs done <step> --evidence "…" [--set k=v] [project]   a creative / guided step is closed: its gate is checked first
//   node tools/conduct.mjs status [project]           the table: done / current / waiting, elapsed against each budget
//   node tools/conduct.mjs lint [kind|--file f|--all] a tool named in the JSON that does not exist, a gate with no checker, a broken graph → exit 1
//   node tools/conduct.mjs end [project] [--user-said "…"]   ends the run (complete, or on the user's words only)
// Internal: `_run <p> <step>` (the runner and watcher of one automatic step).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import * as C from "./lib/conduct_core.mjs";

const ROOT = C.ROOT;
process.chdir(ROOT);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
const argv = process.argv.slice(2);
const FLAG_VAL = new Set(["evidence", "set", "def", "user-said", "file"]);
const flags = {}, sets = [], pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) { const k = a.slice(2); if (FLAG_VAL.has(k) && argv[i + 1] !== undefined) { const v = argv[++i]; if (k === "set") sets.push(v); else flags[k] = v; } else flags[k] = true; }
  else pos.push(a);
}
const [cmd, ...rest] = pos;
const say = (s = "") => console.log(s);
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const activeP = () => C.rd(C.activeFile(ROOT), null)?.project ?? null;
const resolveP = (given) => given ?? activeP();
const loadRun = (p) => {
  const st = C.readState(ROOT, p); if (!st) return { error: `لا تشغيل لـ«${p}»: node tools/conduct.mjs start <النوع> ${p}` };
  const L = C.loadDef(st.defPath ?? st.kind, ROOT); if (!L.def) return { error: L.error };
  return { st, def: L.def };
};
const cmdsOf = (s) => s.cmds ?? (s.cmd ? [s.cmd] : []);
const gateText = (g) => ({
  files: `ملفات: ${(g.paths ?? []).join("، ")}${g.newer ? ` (أحدث من ${g.newer})` : ""}`, evidence: "دليل بنص (--evidence)", arg_set: `قيمة «${g.name}» (--set)`, json_clips: `خطة صالحة ${g.path}`, json_covers_clips: `${g.path} يغطي كل مقطع${(g.fields ?? []).length ? ` بالحقول ${g.fields.join("، ")}` : ""}`,
  board_lane: `لوحة المونتاج: مسار «${g.lane}» تمّ`, fast_clock: "ساعة fast_run بدأت", fast_checks_ok: "نجح فحص كل مقطع (fast_checks.json)", perclip_artifacts: "أثر كل أداة مقطع (verse_scan، recitation_check، hadith_scan، name_doubt) لكل مقطع",
  any_files: `أحد الملفات: ${(g.paths ?? []).join("، ")}`, sections_ok: "الأقسام (sections.json) تجتاز بوابة النشر", package_ok: "حزمة يوتيوب تجتاز بوابة النشر",
  hadith_verified: "كل رواية موثَّقة أو مُستثناة بسبب", log_has: `«${g.text}» في ${g.file}`, queue_jobs: "كل مقطع في الطابور: الفاصل في الآخر والوجهة بالطول", render_done: "كل مقطع مرندر (done)", final_ok: "دليل final_review لكل مقطع",
  prerender_fresh: "فحص ما قبل الرندر حديث لكل مقطع", cover_ok: "الغلاف في أول كل مقطع وصورته موجودة", cmd: `أمر ينجح: ${(g.cmd ?? []).join(" ")}${g.foreach ? " (لكل مقطع)" : ""}`,
}[g.type] ?? g.type);
const gatesText = (s) => ((s.gate ?? []).length ? s.gate.map(gateText).join(" ؛ ") : "رمز خروج الأمر 0");
const budgetText = (s) => (s.budgetMin === null || s.budgetMin === undefined ? "غير مقيس" : `${s.budgetMin} د${s.budgetNote ? ` (${s.budgetNote})` : ""}`);
const TYPE_AR = { auto: "تلقائية (ينفّذها المُوصِل)", creative: "إدخال إبداعي مني", guided: "موجَّهة: أنفّذ الأمر بنفسي", watch: "مراقبة (تجري في الخلفية)" };
const fillCtx = (st, def) => ({ root: ROOT, p: st.project, args: st.args, clips: def?.single ? [st.project] : C.clipsOf(ROOT, st.project, st), ...(def?.single ? { c: st.project } : {}) });
const cmdLine = (s, st, def) => cmdsOf(s).map((a) => C.fillArgv(a, fillCtx(st, def)).map((t) => (/\s/.test(t) ? JSON.stringify(t) : t)).join(" ")).join("  ثم  ");

/* ── plan ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
if (cmd === "plan") {
  const kind = rest[0]; if (!kind) { console.error("usage: node tools/conduct.mjs plan <kind>   (" + Object.keys(C.loadKinds(ROOT)).join("، ") + ")"); process.exit(2); }
  const L = C.loadDef(flags.def ?? kind, ROOT);
  if (!L.def) { say(L.error); process.exit(L.notReady ? 0 : 1); }
  const def = L.def;
  if (flags.json) { say(JSON.stringify(def, null, 1)); process.exit(0); }
  const level = {}; const by = Object.fromEntries(def.steps.map((s) => [s.id, s]));
  const lv = (id) => (level[id] ??= 1 + Math.max(0, ...(by[id]?.deps ?? []).map(lv)));
  def.steps.forEach((s) => lv(s.id));
  say(`الخطة المكتوبة — ${def.ar ?? def.kind} (${rel(L.file)}، الإصدار ${def.version ?? 1})`);
  say(def.about ? `المصدر: ${def.about}` : "");
  say(`الزمن الكلي: ${def.totalMin ? def.totalMin + " د" : "غير مقيس"}${def.totalSource ? ` — ${def.totalSource}` : ""}`);
  say("كل ما بعده من تقدير أو ترتيب يخرج من هذه الأداة وحدها؛ والمُوصِل يمنع غيره (node tools/conduct.mjs start " + def.kind + " <المشروع>).\n");
  const maxL = Math.max(...Object.values(level));
  for (let l = 1; l <= maxL; l++) {
    const grp = def.steps.filter((s) => level[s.id] === l); if (!grp.length) continue;
    say(`── المرحلة ${l}${grp.length > 1 ? " (معاً)" : ""}`);
    for (const s of grp) {
      const n = def.steps.indexOf(s) + 1;
      say(`${String(n).padStart(2)}. [${s.id}] ${s.ar}${s.deps.length ? ` — بعد: ${s.deps.join("، ")}` : ""}`);
      say(`     النوع: ${TYPE_AR[s.type]}${s.exclusive ? " · وحدها (لا شيء معها)" : ""}${s.foreach ? " · لكل مقطع" : ""} · الميزانية: ${budgetText(s)} · المصدر: ${s.skill}`);
      if (cmdsOf(s).length) say(`     الأمر: ${cmdsOf(s).map((a) => a.join(" ")).join("  ثم  ")}`);
      if (s.creative?.what) say(`     المطلوب مني: ${s.creative.what}`);
      say(`     البوابة: ${gatesText(s)}`);
    }
  }
  if ((def.perClip ?? []).length) { say("\nأدوات كل مقطع الإلزامية (يتحقق المُوصِل من أثر كل منها لكل مقطع قبل أن يجتاز الفحص):"); for (const t of def.perClip) say(`  - ${t.ar} ← خطوة «${t.step}» ← ${t.artifact} (${t.skill})`); }
  process.exit(0);
}

/* ── lint ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
if (cmd === "lint") {
  const targets = flags.file ? [flags.file] : rest[0] && !flags.all ? [rest[0]] : Object.entries(C.loadKinds(ROOT)).filter(([, v]) => v.ready).map(([k]) => k);
  let bad = 0;
  for (const t of targets) {
    const L = C.loadDef(t, ROOT); if (!L.def) { say(`✘ ${t}: ${L.error}`); bad++; continue; }
    const P = C.lintDef(L.def, ROOT);
    if (P.length) { bad++; say(`✘ ${t}: ${P.length} مشكلة`); P.forEach((x) => say(`   - ${x}`)); } else say(`✔ ${t}: ${L.def.steps.length} خطوة، كل أداة موجودة وكل بوابة لها فاحص`);
  }
  process.exit(bad ? 1 : 0);
}

/* ── start ────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const setArgs = (st) => { for (const kv of sets) { const i = kv.indexOf("="); if (i > 0) (st.args ??= {})[kv.slice(0, i)] = kv.slice(i + 1); } };
if (cmd === "start") {
  const [kind, p] = rest;
  if (!kind || !p || !/^[\w-]+$/.test(p)) { console.error("usage: node tools/conduct.mjs start <kind> <project> [--set video=<path>] [--def file]"); process.exit(2); }
  const L = C.loadDef(flags.def ?? kind, ROOT);
  if (!L.def) { say(`✘ ${L.error}`); process.exit(1); }
  const P = C.lintDef(L.def, ROOT); if (P.length) { say(`✘ التعريف لا يجتاز الفحص (node tools/conduct.mjs lint ${kind}):\n  - ${P.slice(0, 5).join("\n  - ")}`); process.exit(1); }
  const act = C.rd(C.activeFile(ROOT), null), prev = act?.project ? C.readState(ROOT, act.project) : null;
  if (prev?.active && act.project !== p && Date.now() - (act.at ?? 0) < 24 * 3600e3 && !flags.force) { say(`✘ تشغيل «${act.project}» (${prev.kind}) ما زال مفتوحاً: أكمله أو node tools/conduct.mjs end ${act.project}`); process.exit(1); }
  if (C.readState(ROOT, p)?.active && !flags.redo) { say(`✘ «${p}» يعمل من قبل: node tools/conduct.mjs next ${p} (أو --redo لإعادته من أوله)`); process.exit(1); }
  const defPath = flags.def ? (path.isAbsolute(flags.def) ? flags.def : path.resolve(ROOT, flags.def)) : null;
  const st = C.newState(L.def, p, { defPath: defPath ? (rel(defPath).startsWith("..") ? defPath : rel(defPath)) : null });
  setArgs(st); st.kind = L.def.kind;
  fs.mkdirSync(path.join(ROOT, ".tmp", p), { recursive: true });
  fs.writeFileSync(C.stateFile(ROOT, p), JSON.stringify(st, null, 1));
  // the session that started it: the PreToolUse hook saw this very command a moment ago and left its session id (another session's run never binds this one)
  const pend = C.rd(path.join(ROOT, ".tmp", "conduct_pending_owner.json"), null), session = pend && Date.now() - pend.at < 120e3 ? (pend.agent ? "__agent__" : pend.session) : null;   // a run a sub-agent starts (a rehearsal) binds no main session
  fs.writeFileSync(C.activeFile(ROOT), JSON.stringify({ project: p, kind: L.def.kind, session, at: Date.now() }));
  say(`✔ بدأ ${L.def.ar ?? L.def.kind} «${p}» — الساعة تعدّ من الآن (${L.def.totalMin ? L.def.totalMin + " د" : "غير مقيس"}) والحالة في .tmp/${p}/conduct.json`);
  say(`${L.def.steps.length} خطوة. من الآن المُوصِل يقرّر التالي: الهوك يرفض أي أمر إجراء ليس خطوة حالية أو موازية.\nالخطوة الأولى: node tools/conduct.mjs next`);
  process.exit(0);
}

/* ── the runner of an automatic step ──────────────────────────────────────────────────────────────────────────────── */
const logOf = (p, id) => path.join(ROOT, ".tmp", p, `conduct_${id}.log`);
const fastMark = (p, key, what) => { if (key && fs.existsSync(path.join(ROOT, "tools", "stream", "fast_run.mjs"))) spawnSync(process.execPath, ["tools/stream/fast_run.mjs", "mark", p, key, what], { cwd: ROOT, encoding: "utf8", windowsHide: true }); };
const runOne = (argv, env, log, cwd) => new Promise((resolve) => {
  const [c, ...a] = argv; fs.appendFileSync(log, `\n$ ${argv.join(" ")}\n`);
  const ch = spawn(c, a, { cwd, env: { ...process.env, PYTHONIOENCODING: "utf-8", ...env }, windowsHide: true });
  try { os.setPriority(ch.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
  let tail = ""; const take = (d) => { const s = d.toString(); tail = (tail + s).slice(-2000); fs.appendFileSync(log, s); };
  ch.stdout.on("data", take); ch.stderr.on("data", take);
  ch.on("error", (e) => resolve({ code: 127, tail: String(e.message) }));
  ch.on("close", (code) => resolve({ code: code ?? 1, tail }));
});
/** run every command of a step (per clip, `jobs` at a time), then its gates; the outcome goes into the state */
async function runStep(p, id) {
  const R = loadRun(p); if (R.error) { console.error(R.error); return 1; }
  const { def } = R, s = def.steps.find((x) => x.id === id); if (!s) { console.error(`لا خطوة ${id}`); return 1; }
  const log = logOf(p, id); fs.mkdirSync(path.dirname(log), { recursive: true }); fs.writeFileSync(log, `# ${id} ${new Date().toISOString()}\n`);
  C.editState(ROOT, p, (st) => { Object.assign(C.stepState(st, id), { status: "running", startedAt: Date.now(), pid: process.pid, exit: null, why: null, waiting: null, log: rel(log), overBudget: false }); });
  if (s.budgetMin) setTimeout(() => C.editState(ROOT, p, (st) => { const x = C.stepState(st, id); if (x.status === "running") x.overBudget = true; }), s.budgetMin * 60e3).unref();
  fastMark(p, s.fastMark, "start");
  const st0 = C.readState(ROOT, p), clips = C.clipsFor(ROOT, def, st0);
  const jobs = s.foreach === "clips" ? clips.map((c) => ({ c })) : [{ c: null }];
  const fails = []; let lastTail = "";
  const doJob = async (j) => {
    for (const a of cmdsOf(s)) {
      const ctx = { ...fillCtx(st0, def), c: j.c ?? undefined, clips };
      const argv2 = C.fillArgv(a, ctx), env = Object.fromEntries(Object.entries(s.env ?? {}).map(([k, v]) => [k, C.fill(v, ctx)]));
      const r = await runOne(argv2, env, log, ROOT); lastTail = r.tail;
      if (r.code !== 0) { fails.push(`${j.c ?? s.id}: ${r.tail.trim().split(/\r?\n/).filter(Boolean).slice(-1)[0]?.slice(0, 120) ?? "رمز " + r.code}`); return; }
    }
  };
  if (s.foreach === "clips" && !clips.length) fails.push("لا مقاطع (clip_table.json) لهذه الخطوة");
  const q = [...jobs], n = Math.max(1, Math.min(s.jobs ?? 1, q.length || 1));
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await doJob(q.shift()); }));
  fastMark(p, s.fastMark, "end");
  const exit = fails.length ? 1 : 0;
  C.editState(ROOT, p, (st) => { const x = C.stepState(st, id); x.exit = exit; x.pid = null; if (exit) { x.status = "failed"; x.why = fails.slice(0, 3).join(" | "); x.endedAt = Date.now(); } });
  if (exit) return 1;
  const st1 = C.readState(ROOT, p), ctx1 = { root: ROOT, def, state: st1, p, args: st1.args, clips };
  const g = await C.checkGates(s, ctx1);
  C.editState(ROOT, p, (st) => { const x = C.stepState(st, id); if (g.ok) { x.status = "done"; x.endedAt = Date.now(); x.waiting = null; } else if (s.async) x.waiting = g.why; else { x.status = "failed"; x.why = g.why; x.endedAt = Date.now(); } });
  return g.ok || s.async ? 0 : 1;
}
if (cmd === "_run") { const code = await runStep(rest[0], rest[1]); process.exit(code); }

/* ── starting a step from `next` ──────────────────────────────────────────────────────────────────────────────────── */
function startStep(def, st, s) {
  const p = st.project, ctx = fillCtx(st, def);
  if (s.type === "watch") { C.editState(ROOT, p, (x) => { Object.assign(C.stepState(x, s.id), { status: "running", startedAt: Date.now(), exit: null }); }); return { how: "تراقب الخلفية" }; }
  if (s.type !== "auto") return null;
  const joined = JSON.stringify(cmdsOf(s)).replace(/\{file:[^}]*\}/g, "");
  for (const k of ["video", "comp", "minutes"]) if (joined.includes("{" + k + "}") && !st.args?.[k]) return { error: `ينقص «${k}»: node tools/conduct.mjs set ${k}=<القيمة> ${p}` };
  if (s.foreach === "clips" && !ctx.clips.length) return { error: "لا مقاطع بعد (clip_table.json)" };
  if (s.fg) {
    // quick: run here and now (its outcome is in the state before this command returns)
    return { fgPromise: runStep(p, s.id) };
  }
  const ttl = Math.max(20, (s.budgetMin ?? 60) * 2 + 10), log = logOf(p, s.id);
  fs.mkdirSync(path.dirname(log), { recursive: true });
  C.editState(ROOT, p, (x) => { Object.assign(C.stepState(x, s.id), { status: "running", startedAt: Date.now(), exit: null, pid: null, why: null, waiting: null, log: rel(log) }); });
  const hasProc = fs.existsSync(path.join(ROOT, "tools", "proc.mjs"));
  const args = hasProc ? ["tools/proc.mjs", "run", "--label", `conduct-${p}-${s.id}`, "--project", p, "--ttl", String(ttl), "--log", path.join(".tmp", p, `conduct_${s.id}.proc.log`), "--", process.execPath, "tools/conduct.mjs", "_run", p, s.id] : null;
  let pid = null;
  if (args) { const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", windowsHide: true }); pid = Number((r.stdout || "").trim().split(/\r?\n/).pop()) || null; }
  else { const ch = spawn(process.execPath, ["tools/conduct.mjs", "_run", p, s.id], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true }); ch.unref(); pid = ch.pid; }
  C.editState(ROOT, p, (x) => { const ss = C.stepState(x, s.id); if (ss.status === "running" && (ss.exit === undefined || ss.exit === null)) ss.pid = ss.pid ?? pid; });
  return { how: `بدأت في الخلفية (العملية ${pid ?? "؟"}، السجل ${rel(log)})` };
}

/* ── next ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
async function finishIfComplete(def, st) {
  const ev = C.evaluate(def, st);
  if (ev.complete && st.active) { C.editState(ROOT, st.project, (x) => { x.active = false; x.completedAt = Date.now(); }); const a = C.rd(C.activeFile(ROOT), null); if (a?.project === st.project) fs.rmSync(C.activeFile(ROOT), { force: true }); }
  return ev;
}
if (cmd === "next" || cmd === "status") {
  const p = resolveP(rest[0]); if (!p) { say("لا تشغيل مفتوح: node tools/conduct.mjs start <النوع> <المشروع> (الخطة: node tools/conduct.mjs plan <النوع>)"); process.exit(1); }
  let R = loadRun(p); if (R.error) { say(R.error); process.exit(1); }
  await C.reconcile(ROOT, R.def, R.st); C.editState(ROOT, p, (x) => { Object.assign(x.steps, R.st.steps); }); R = loadRun(p);
  const { def } = R; let st = R.st, ev = await finishIfComplete(def, st);
  const el = Date.now() - st.t0, N = def.steps.length;
  if (cmd === "status") {
    say(`${def.ar ?? def.kind} «${p}» — انقضى ${mmss(el)} من ${def.totalMin ? def.totalMin + " د" : "غير مقيس"}${def.totalMin && el > def.totalMin * 60e3 ? "  ✘ تجاوز الحدّ" : ""} — تمّت ${ev.done.length} من ${N}`);
    for (const r of ev.rows) {
      const s = r.s, ss = r.ss, cur = ev.current === r;
      const mark = r.status === "done" ? "✔" : r.status === "skipped" ? "↷" : r.status === "failed" ? "✘" : r.status === "running" ? "⏳" : cur ? "◀" : ev.eligible.includes(r) ? "▶" : "·";
      const spent = ss.startedAt ? ((ss.endedAt ?? Date.now()) - ss.startedAt) : 0;
      const bud = s.budgetMin ? `${(spent / 60000).toFixed(1)}/${s.budgetMin} د${spent / 60000 > s.budgetMin && r.status !== "done" ? " ✘ تجاوز" : ""}` : spent ? `${(spent / 60000).toFixed(1)} د (غير مقيس)` : "غير مقيس";
      const state = { done: "تمّت", running: "جارية", failed: "فشلت", pending: ev.eligible.includes(r) ? "جاهزة" : `تنتظر ${s.deps.filter((d) => !["done", "skipped"].includes(st.steps[d]?.status)).join("،")}`, skipped: "تخطّتها بسبب" }[r.status] ?? r.status;
      say(`${mark} ${String(def.steps.indexOf(s) + 1).padStart(2)} [${s.id}] ${s.ar} — ${state} — ${bud}${ss.why && r.status === "failed" ? ` — ${ss.why.slice(0, 120)}` : ""}${ss.waiting && r.status === "running" ? ` — ينتظر: ${String(ss.waiting).slice(0, 100)}` : ""}`);
    }
    say(ev.complete ? "\n✔ الخطوات كلها تمّت." : `\n${C.lineOf(def, st, ev)}`);
    process.exit(0);
  }
  if (ev.complete) { say(`✔ الخطوات كلها تمّت لـ«${p}» (${mmss(el)}). ما بقي خارج المُوصِل: سؤال الاعتماد والنشر بمهارتيهما.`); process.exit(0); }
  const cur = ev.current;
  if (!cur) { say("لا خطوة متاحة: كل شيء جارٍ في الخلفية. انتظر (node tools/conduct.mjs status)."); process.exit(0); }
  // start the current step when it is automatic and not yet running; start the parallel automatic ones with it
  const started = []; const errors = [];
  const toStart = [cur, ...ev.parallel].filter((r) => ["pending", "failed"].includes(r.status) && ["auto", "watch"].includes(r.s.type) && ev.eligible.includes(r));
  const exclusive = toStart.find((r) => r.s.exclusive);
  for (const r of exclusive ? [exclusive] : toStart) {
    const res = startStep(def, st, r.s);
    if (res?.error) errors.push(`[${r.s.id}] ${res.error}`);
    else if (res?.fgPromise) { const code = await res.fgPromise; started.push(`[${r.s.id}] نُفِّذت الآن ${code === 0 ? "ونجحت بوابتها" : "وفشلت (انظر السجل)"}`); }
    else if (res) started.push(`[${r.s.id}] ${res.how}`);
  }
  R = loadRun(p); st = R.st; await C.reconcile(ROOT, def, st); C.editState(ROOT, p, (x) => { Object.assign(x.steps, st.steps); }); st = C.readState(ROOT, p); ev = await finishIfComplete(def, st);
  const c2 = ev.current ?? cur, s = c2.s, ss = c2.ss;
  say(`الخطوة الحالية [${s.id}] (${def.steps.indexOf(s) + 1}/${N}) — ${s.ar}`);
  say(`  المهارة: ${s.skill}`);
  say(`  النوع: ${TYPE_AR[s.type]}${s.exclusive ? " · وحدها" : ""}${s.foreach ? " · لكل مقطع" : ""} — الحالة: ${{ pending: "جاهزة", running: "جارية", failed: "فشلت", done: "تمّت" }[c2.status] ?? c2.status}`);
  if (cmdsOf(s).length) say(`  الأمر: ${cmdLine(s, st, def)}`);
  if (s.creative?.what) say(`  المطلوب مني: ${C.fill(s.creative.what, fillCtx(st, def))}${s.creative.files ? `\n  الملفات: ${s.creative.files.map((f) => C.fill(f, fillCtx(st, def))).join("، ")}` : s.creative.file ? `\n  الملف: ${C.fill(s.creative.file, fillCtx(st, def))}` : ""}`);
  if (s.watch) say(`  المراقبة: ${s.watch}`);
  if (s.note) say(`  ملاحظة: ${s.note}`);
  say(`  البوابة: ${gatesText(s)}`);
  say(`  الميزانية: ${budgetText(s)} — المتبقي: ${C.remainingText(def, st, ev)}`);
  if (ss.status === "failed") say(`  ✘ فشلت: ${ss.why ?? ""}${ss.log ? ` (السجل ${ss.log})` : ""} — أصلح السبب ثم node tools/conduct.mjs next (لا تتجاوز البوابة)`);
  if (ss.overBudget) say("  ✘ تجاوزت ميزانيتها: أوقف الحلقة وعالج السبب ولا تُعد المرحلة (حدّ الوقت)");
  if (ss.waiting && ss.status === "running") say(`  ينتظر البوابة: ${String(ss.waiting).slice(0, 160)}`);
  if (s.type === "creative" || s.type === "guided") say(`  عند الانتهاء: ${s.done ?? `node tools/conduct.mjs done ${s.id} --evidence "…"`}`);
  for (const x of started) say(`  ▶ ${x}`);
  for (const x of errors) say(`  ✘ ${x}`);
  const par = ev.parallel.filter((r) => r !== c2); if (par.length) say(`معها بالتوازي: ${par.slice(0, 8).map((r) => `[${r.s.id}] ${r.s.ar} (${r.status === "running" ? "جارية" : r.s.type === "auto" ? "بدأت" : "عليّ"})`).join(" · ")}`);
  process.exit(errors.length ? 1 : 0);
}

/* ── done ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
if (cmd === "done") {
  const [id, given] = rest, p = resolveP(given);
  if (!id || !p) { console.error('usage: node tools/conduct.mjs done <step> --evidence "…" [--set k=v] [project]'); process.exit(2); }
  const R = loadRun(p); if (R.error) { say(R.error); process.exit(1); }
  const s = R.def.steps.find((x) => x.id === id); if (!s) { say(`✘ لا خطوة «${id}»: ${R.def.steps.map((x) => x.id).join("، ")}`); process.exit(1); }
  if (s.type === "auto" || s.type === "watch") { say(`✘ «${id}» خطوة ${s.type === "auto" ? "تلقائية" : "مراقبة"}: يُغلقها المُوصِل ببوابتها لا بقولي (node tools/conduct.mjs next).`); process.exit(1); }
  const pend = s.deps.filter((d) => !["done", "skipped"].includes(R.st.steps[d]?.status));
  if (pend.length) { say(`✘ «${id}» لا تُغلق قبل ما قبلها: ${pend.join("، ")} (node tools/conduct.mjs status)`); process.exit(1); }
  C.editState(ROOT, p, (st) => { setArgs(st); const ss = C.stepState(st, id); if (flags.evidence) ss.evidence = String(flags.evidence); if (!ss.startedAt) ss.startedAt = Date.now(); });
  const st = C.readState(ROOT, p), g = await C.checkGates(s, { root: ROOT, def: R.def, state: st, p, args: st.args, clips: C.clipsFor(ROOT, R.def, st) });
  if (!g.ok) { say(`✘ بوابة «${id}» لم تنجح: ${g.why}\nلا تُغلق الخطوة بقولي؛ أكمل المطلوب ثم أعد.`); process.exit(1); }
  C.editState(ROOT, p, (x) => { const ss = C.stepState(x, id); ss.status = "done"; ss.endedAt = Date.now(); });
  const st2 = C.readState(ROOT, p); const ev = await finishIfComplete(R.def, st2);
  say(`✔ تمّت [${id}] ${s.ar}`); say(ev.complete ? "✔ الخطوات كلها تمّت." : C.lineOf(R.def, st2, ev));
  process.exit(0);
}

/* ── set ──────────────────────────────────────────────────────────────────────────────────────────────────────────── */
if (cmd === "set") {
  const kv = rest.find((x) => x.includes("=")), p = resolveP(rest.find((x) => x !== kv));
  if (!kv || !p) { console.error("usage: node tools/conduct.mjs set key=value [project]"); process.exit(2); }
  sets.push(kv); const st = C.editState(ROOT, p, (x) => setArgs(x)); if (!st) { say(`✘ لا تشغيل لـ«${p}»`); process.exit(1); }
  say(`✔ ${kv.split("=")[0]} = ${kv.slice(kv.indexOf("=") + 1)}`); process.exit(0);
}

/* ── end ──────────────────────────────────────────────────────────────────────────────────────────────────────────── */
if (cmd === "end") {
  const p = resolveP(rest[0]); if (!p) { say("لا تشغيل مفتوح"); process.exit(1); }
  const R = loadRun(p); if (R.error) { say(R.error); process.exit(1); }
  const ev = C.evaluate(R.def, R.st);
  if (!ev.complete && !(typeof flags["user-said"] === "string" && flags["user-said"].trim().length >= 6)) { say(`✘ بقيت ${ev.open.length} خطوة مفتوحة: لا يُنهى التشغيل إلا بتمامه أو بقول المستخدم نصاً (--user-said "…")؛ تُسجَّل كلماته في الحالة.`); process.exit(1); }
  C.editState(ROOT, p, (x) => { x.active = false; x.endedAt = Date.now(); if (!ev.complete) x.endedByUser = String(flags["user-said"]); });
  const a = C.rd(C.activeFile(ROOT), null); if (a?.project === p) fs.rmSync(C.activeFile(ROOT), { force: true });
  say(`✔ انتهى تشغيل «${p}»${ev.complete ? "" : ` بقول المستخدم: «${flags["user-said"]}» (بقيت ${ev.open.length} خطوة مفتوحة)`}`);
  process.exit(0);
}

console.error("usage: node tools/conduct.mjs plan|start|next|done|status|lint|end …   (الرأس: شرح كل أمر)"); process.exit(2);
