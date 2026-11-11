// Resume unattended work after a reboot / logon (user approved 2026-11-11: «منبّه يستأنف العمل وحده بعد إعادة تشغيل الجهاز»).
// Windows runs this at every logon (task «RemotionResumeWork», hidden via tools/resume_after_reboot.vbs). It:
//   1. restarts the render queue worker when jobs are waiting or were cut off mid-render (render_queue.mjs resets them to queued);
//   2. relaunches every registered long job whose «done» file does not exist yet (whole-stream cut, transcription, …).
// Register a long job before starting it, unregister when it finished:
//   node tools/resume_after_reboot.mjs register <name> <doneFile> -- <bash command…>
//   node tools/resume_after_reboot.mjs unregister <name>
//   node tools/resume_after_reboot.mjs ls | now        (now = do the resume pass immediately, for a test)
// Everything it does goes to .tmp/resume_after_reboot.log and .tmp/RESUMED_AFTER_REBOOT.txt (Claude reads it at the next check).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
const REG = "data/resume_jobs.json", LOG = ".tmp/resume_after_reboot.log", MARK = ".tmp/RESUMED_AFTER_REBOOT.txt";
const BASH = "C:/Program Files/Git/bin/bash.exe", NODE = process.execPath;
fs.mkdirSync(".tmp", { recursive: true }); fs.mkdirSync("data", { recursive: true });
const load = () => { try { return JSON.parse(fs.readFileSync(REG, "utf8")); } catch { return { jobs: [] }; } };
const save = (r) => fs.writeFileSync(REG, JSON.stringify(r, null, 1));
const log = (m) => fs.appendFileSync(LOG, `[${new Date().toISOString().slice(0, 19).replace("T", " ")}] ${m}\n`);
const [cmd, ...rest] = process.argv.slice(2);

const detached = (exe, args, out) => {
  const fd = fs.openSync(out, "a");
  const p = spawn(exe, args, { cwd: root, detached: true, windowsHide: true, stdio: ["ignore", fd, fd] });
  try { os.setPriority(p.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
  p.unref(); return p.pid;
};

if (cmd === "register") {
  const [name, doneFile] = rest, k = rest.indexOf("--"), line = k >= 0 ? rest.slice(k + 1).join(" ") : "";
  if (!name || !doneFile || !line) { console.error("usage: register <name> <doneFile> -- <bash command>"); process.exit(2); }
  const r = load(); r.jobs = r.jobs.filter((j) => j.name !== name); r.jobs.push({ name, doneFile, cmd: line, at: new Date().toISOString() }); save(r);
  console.log(`registered ${name}`);
} else if (cmd === "unregister") {
  const r = load(); r.jobs = r.jobs.filter((j) => j.name !== rest[0]); save(r); console.log(`unregistered ${rest[0]}`);
} else if (cmd === "ls") {
  for (const j of load().jobs) console.log(`${j.name}  ${fs.existsSync(j.doneFile) ? "done" : "pending"}  ${j.cmd.slice(0, 120)}`);
} else if (!cmd || cmd === "now" || cmd === "logon") {
  if (cmd === "logon") await new Promise((r) => setTimeout(r, 90_000));   // let the desktop, GPU driver and disks settle after logon
  const did = [];
  // 1) render queue
  let rq = { jobs: [] }; try { rq = JSON.parse(fs.readFileSync("data/render_queue/state.json", "utf8")); } catch { /* none */ }
  const waiting = rq.jobs.filter((j) => j.state === "queued" || j.state === "rendering").length;
  if (waiting) { const pid = detached(NODE, ["tools/render_queue.mjs", "run"], ".tmp/render_queue.log"); did.push(`طابور الإخراج: ${waiting} مقطع (PID ${pid})`); }
  // 2) registered long jobs
  const r = load();
  for (const j of r.jobs) {
    if (fs.existsSync(j.doneFile)) continue;
    const pid = detached(BASH, ["-lc", `cd /s/AI_Tools/Remotion_Workspace && source tools/env.sh >/dev/null 2>&1; ${j.cmd}`], `.tmp/resume_${j.name}.log`);
    did.push(`${j.name} (PID ${pid})`);
  }
  if (did.length) { const t = `${new Date().toISOString()} استؤنف بعد إعادة التشغيل/الدخول: ${did.join(" | ")}`; log(t); fs.appendFileSync(MARK, t + "\n"); console.log(t); }
  else { log("لا عمل معلّق"); console.log("لا عمل معلّق"); }
} else { console.error("usage: node tools/resume_after_reboot.mjs [now|logon|ls|register|unregister]"); process.exit(2); }
