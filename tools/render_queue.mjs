// Render queue (user order 2026-11-11: «اعمل برمجية للرندر تنظّمه في طابور؛ أنت تجهّز وترسل لها، هي تضعه بالانتظار»).
// I prepare a clip (spec normalised and ALL gates passed BEFORE this point), submit it, and keep working; one worker renders the jobs one at a time.
//   node tools/render_queue.mjs add --spec q2_01 --comp Q2-01-R --orient R|L --dest "<folder>" [--title "<export title>"] [--bumper end|start]   (البثوث والدروس: end = الفاصل خاتمة في آخر الفيديو)   (add many; order = submit order)
//   node tools/render_queue.mjs run        # start the single worker (refuses to start a second one); exits when the queue is empty
//   node tools/render_queue.mjs ls         # state of every job
//   node tools/render_queue.mjs retry <spec> [R|L] | drop <spec> [R|L]
// Admission gate (cheap, plain mode, no fixing): coverage_check + grid_plan + mg_usage_audit on the spec. A job that fails is REJECTED with the reason (fix the spec with tools/spec_normalize.mjs, then add again) — the queue never retries blindly.
// Per job: tools/render_job.sh (hybrid render + opening bumper kept + judder gate on the pre-bumper original) → copy to dest → state `done`. Progress page: the worker keeps `.tmp/render_queue.log`.
// (user 2026-11-18, rules review) the bumper and the output name come from the montage: spec.bumper {id?, at?, position: start|end|none} and spec.exportTitle
// (render_job.sh decides; an old spec without them keeps the legacy default with a warning). --bumper is kept only when given (no "start" default any more),
// and `add` prints the planned bumper and file name (render_job.sh with RENDER_PLAN_ONLY=1: nothing is rendered).
//   node tools/render_queue.mjs plan --spec <id> --comp <Comp> --orient R|L [--title <t>] [--bumper …]   → the same print, no job added
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { overlapFailures } from "./lib/overlap_gate.mjs";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
const DIR = "data/render_queue", STATE = path.join(DIR, "state.json"), LOCK = path.join(DIR, "worker.pid"), LOG = ".tmp/render_queue.log";
fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(".tmp", { recursive: true });
const [cmd, ...rest] = process.argv.slice(2);
const arg = (n, d = "") => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
const load = () => { try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return { jobs: [] }; } };
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 1));
const log = (m) => { const l = `[${new Date().toTimeString().slice(0, 8)}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const sh = (c, a) => spawnSync(c, a, { encoding: "utf8", maxBuffer: 1 << 27 });
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

const admit = (spec, orient) => {
  const f = `data/specs/${spec}.json`; if (!fs.existsSync(f)) return `لا مواصفة ${f}`;
  const s = JSON.parse(fs.readFileSync(f, "utf8")), o = orient === "L" ? "land" : "port";
  const outs = [sh("node", ["tools/coverage_check.mjs", f]), sh("node", ["tools/grid_plan.mjs", f, "--o", o]), sh("node", ["tools/mg_usage_audit.mjs", f, "--minutes", String(Math.max(0.2, s.frames / 1800))]), sh("node", ["tools/writing_sync.mjs", f])];
  const bad = outs.flatMap((r) => (r.stdout.match(/✘[^\n]*/g) || []));
  bad.push(...overlapFailures(spec, o));   /* (user 2026-11-20) no two elements in one place, whoever wrote them: refused at the queue entry too */
  return bad.length ? bad.slice(0, 3).map((b) => b.slice(0, 140)).join(" | ") : "";
};

/* (user 2026-11-18, rules review) the title render_job.sh receives, and its print-only plan (bumper + output name, from spec.bumper / spec.exportTitle) */
const titleOf = (spec, t) => { if (t) return t; try { return JSON.parse(fs.readFileSync(`data/specs/${spec}.json`, "utf8")).title ?? spec; } catch { return spec; } };
const plan = (spec, comp, orient, title, bumper) => { const r = spawnSync("bash", ["tools/render_job.sh", spec, comp, orient, titleOf(spec, title), bumper || ""], { encoding: "utf8", env: { ...process.env, RENDER_PLAN_ONLY: "1" } }); return ((r.stderr || "") + (r.stdout || "")).trim(); };

if (cmd === "add") {
  const spec = arg("spec"), comp = arg("comp"), orient = arg("orient"), dest = arg("dest");
  if (!spec || !comp || !/^[RL]$/.test(orient) || !dest) { console.error("usage: add --spec <id> --comp <Comp> --orient R|L --dest <folder> [--title <t>] [--bumper start|end|none]"); process.exit(2); }
  const s = load(); s.jobs = s.jobs.filter((j) => !(j.spec === spec && j.orient === orient));   // one job per project AND orientation (the portrait add erased the landscape one, 2026-11-11)
  const why = admit(spec, orient);
  if (why) { s.jobs.push({ spec, comp, orient, dest, title: arg("title"), bumper: arg("bumper", ""), state: "rejected", why }); save(s); console.log(`✘ مرفوض ${spec}: ${why}\n  أصلحه بـ node tools/spec_normalize.mjs data/specs/${spec}.json --o ${orient === "L" ? "land" : "port"} ثم أضِفه من جديد`); process.exit(1); }
  s.jobs.push({ spec, comp, orient, dest, title: arg("title"), bumper: arg("bumper", ""), state: "queued", at: new Date().toISOString() }); save(s);
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
  if (cmd === "drop") s.jobs = s.jobs.filter((x) => x !== j); else { j.state = "queued"; delete j.err; delete j.why; } save(s);
} else if (cmd === "run") {
  try { const pid = Number(fs.readFileSync(LOCK, "utf8")); if (pid && alive(pid)) { console.error(`عامل الطابور يعمل أصلاً (PID ${pid}): لا عاملين معاً.`); process.exit(1); } } catch { /* none */ }
  fs.writeFileSync(LOCK, String(process.pid));
  try { (await import("node:os")).default.setPriority(0, 10); } catch { /* below normal */ }
  { const s0 = load(); let n = 0; for (const j of s0.jobs) if (j.state === "rendering") { j.state = "queued"; n++; } if (n) { save(s0); log(`استئناف: ${n} مقطع انقطع إخراجه يعود إلى الانتظار`); } }
  const done = () => { try { fs.rmSync(LOCK); } catch { /* ignore */ } };
  process.on("exit", done); process.on("SIGINT", () => process.exit(130)); process.on("SIGTERM", () => process.exit(143));
  for (;;) {
    const s = load(), j = s.jobs.find((x) => x.state === "queued");
    if (!j) { log("الطابور فارغ"); break; }
    j.state = "rendering"; save(s); log(`رندر ${j.spec} (${j.comp})`);
    const title = titleOf(j.spec, j.title);
    /* (user 2026-11-18, rules review) no "start" default: an empty 5th argument lets render_job.sh take spec.bumper (or its legacy default) */
    const r = sh("bash", ["tools/render_job.sh", j.spec, j.comp, j.orient, title, j.bumper || ""]);
    const m = r.stdout.match(/RENDER exit 0 -> (.+)$/m);
    const cur = load(), jj = cur.jobs.find((x) => x.spec === j.spec && x.orient === j.orient);   /* by project AND orientation: matching the spec alone wrote the portrait result onto the landscape job (2026-11-12) */
    /* (2026-11-12) a passed render was marked failed with only its guard line: record WHY the job stopped (spawn error / signal / status) */
    if (!m) { jj.state = "failed"; jj.err = [r.error?.code ?? r.error?.message, r.signal && `signal ${r.signal}`, `status ${r.status}`].filter(Boolean).join(" ") + " — " + r.stdout.trim().split("\n").slice(-2).join(" ").slice(0, 200); log(`✘ ${j.spec}: ${jj.err}`); save(cur); continue; }
    const file = path.join("render_work/export", m[1].trim());
    try { fs.mkdirSync(j.dest, { recursive: true }); const to = path.join(j.dest, path.basename(file)); fs.copyFileSync(file, to); if (fs.statSync(to).size !== fs.statSync(file).size) throw new Error("copy size mismatch"); jj.state = "done"; jj.to = to; jj.file = file; }
    catch (e) { jj.state = "failed"; jj.err = String(e.message).slice(0, 160); }
    save(cur); log(`${jj.state === "done" ? "✔" : "✘"} ${j.spec} ${jj.state}`);
  }
} else { console.error("usage: node tools/render_queue.mjs add|plan|run|ls|retry|drop"); process.exit(2); }
