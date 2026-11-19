// EVERY BACKGROUND JOB IS REGISTERED AND DIES WITH ITS OWNER (user 2026-11-19: «مطلوب منك أن توقف أي خدمة غير مستعملة حتى ما تستهلك موارد الجهاز…
// هذا أمر خطير جداً»). What went wrong: a check started in the background kept running (browser stills on the CPU, 12+ minutes) after its task was
// stopped — on Windows stopping the shell does not stop the programs under it — and the same check ran twice at once.
//   node tools/proc.mjs run [--label L] [--project p] [--ttl MIN] [--log FILE] -- <cmd> <args…>
//        start it at low priority, register it (.tmp/procs.json), and attach a watchdog: when the shell that started it dies, or after --ttl minutes,
//        the job AND everything under it is stopped. Prints the pid. (The caller can stay in the foreground: the job is detached, output → --log.)
//   node tools/proc.mjs ls               the registered jobs still alive: pid, label, minutes, CPU seconds, memory
//   node tools/proc.mjs stop <pid|label|all>   stop a REGISTERED job with everything under it (never touches a process this tool did not start)
//   node tools/proc.mjs reap             drop dead entries; stop jobs past their ttl or whose owner shell is gone
// In code:  import { guardSelf, lock } from "./proc.mjs"
//   guardSelf(label, {ttlMin, project}) — a long tool registers ITSELF and gets the same watchdog (tools/stage.mjs check does)
//   lock(name) → release() | null       — one copy at a time (null = another copy is alive; its pid is printed)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REG = path.join(ROOT, ".tmp", "procs.json");
const SHELLS = /^(bash|sh|nice|cmd|powershell|pwsh|timeout|env)\.exe$/i;

export const alive = (pid) => { try { process.kill(Number(pid), 0); return true; } catch (e) { return e.code === "EPERM"; } };
const readReg = () => { try { return JSON.parse(fs.readFileSync(REG, "utf8")); } catch { return []; } };
const writeReg = (r) => { fs.mkdirSync(path.dirname(REG), { recursive: true }); fs.writeFileSync(REG + ".tmp", JSON.stringify(r, null, 1)); fs.renameSync(REG + ".tmp", REG); };
const edit = (fn) => { const r = readReg(); const o = fn(r) ?? r; writeReg(o); return o; };
export const killTree = (pid) => spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true, encoding: "utf8" }).status === 0;
const lowPrio = (pid) => { try { os.setPriority(pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* gone or not allowed */ } };

/** the shells above `pid` (bash → nice → …) up to the first program that is not a shell: if any of them dies, the job is an orphan */
export const shellOwners = (pid) => {
  const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { [string]$_.ProcessId + ' ' + [string]$_.ParentProcessId + ' ' + $_.Name }"], { encoding: "utf8", windowsHide: true });
  const m = new Map(); for (const l of (r.stdout || "").split(/\r?\n/)) { const [a, b, ...n] = l.trim().split(" "); if (a) m.set(Number(a), { pp: Number(b), name: n.join(" ") }); }
  const out = []; let cur = m.get(Number(pid))?.pp, guard = 0;
  while (cur && m.has(cur) && guard++ < 12) { const e = m.get(cur); if (!SHELLS.test(e.name)) break; out.push(cur); cur = e.pp; }
  return out;
};

/** the watchdog: a tiny detached node that checks every 5 s */
const watch = (pid, owners, ttlMin) => {
  const code = `const {spawnSync}=require("child_process");const P=${pid},O=${JSON.stringify(owners)},END=${ttlMin ? Date.now() + ttlMin * 60e3 : 0};
const alive=(p)=>{try{process.kill(p,0);return true}catch(e){return e.code==="EPERM"}};
const t=setInterval(()=>{if(!alive(P)){clearInterval(t);return}const why=O.some((o)=>!alive(o))?"owner":(END&&Date.now()>END?"ttl":"");
if(why){spawnSync("taskkill",["/T","/F","/PID",String(P)],{windowsHide:true});clearInterval(t)}},5000);`;
  spawn(process.execPath, ["-e", code], { detached: true, stdio: "ignore", windowsHide: true }).unref();
};

const register = (e) => edit((r) => [...r.filter((x) => alive(x.pid) && x.pid !== e.pid), e]);

/** a long tool registers itself: listed by `ls`, stopped with everything under it when its shell dies or after ttlMin */
export const guardSelf = (label, { ttlMin = 0, project = "" } = {}) => {
  const owners = [...new Set([...shellOwners(process.pid), ...(process.env.HK_OWNER ?? "").split(",").map(Number).filter((n) => n > 0)])];
  register({ pid: process.pid, label, project, cmd: process.argv.slice(1).join(" ").slice(0, 200), started: Date.now(), ttlMin, owners });
  watch(process.pid, owners, ttlMin);
  lowPrio(process.pid);
  process.on("exit", () => { try { edit((r) => r.filter((x) => x.pid !== process.pid)); } catch { /* best effort */ } });
};

/** one copy at a time: returns release() or null when another live copy holds it */
export const lock = (name) => {
  const f = path.join(ROOT, ".tmp", "locks", name.replace(/[^\w.-]+/g, "_") + ".lock");
  fs.mkdirSync(path.dirname(f), { recursive: true });
  try { const o = JSON.parse(fs.readFileSync(f, "utf8")); if (o.pid !== process.pid && alive(o.pid)) { console.error(`✘ ${name}: نسخة أخرى تعمل الآن (العملية ${o.pid}، منذ ${Math.round((Date.now() - o.at) / 60e3)} د) — لا تشغيل لنسختين`); return null; } } catch { /* free */ }
  fs.writeFileSync(f, JSON.stringify({ pid: process.pid, at: Date.now() }));
  const release = () => { try { const o = JSON.parse(fs.readFileSync(f, "utf8")); if (o.pid === process.pid) fs.rmSync(f); } catch { /* gone */ } };
  process.on("exit", release);
  return release;
};

const stats = (pids) => {
  if (!pids.length) return new Map();
  const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", `Get-Process -Id ${pids.join(",")} -ErrorAction SilentlyContinue | ForEach-Object { [string]$_.Id + ' ' + [int]$_.CPU + ' ' + [int]($_.WorkingSet64/1MB) }`], { encoding: "utf8", windowsHide: true });
  const m = new Map(); for (const l of (r.stdout || "").split(/\r?\n/)) { const [a, c, mem] = l.trim().split(" "); if (a) m.set(Number(a), { cpu: Number(c), mem: Number(mem) }); }
  return m;
};

const reap = (quiet) => {
  let stopped = 0;
  edit((r) => r.filter((x) => {
    if (!alive(x.pid)) return false;
    const why = (x.owners ?? []).some((o) => !alive(o)) ? "صاحبها انتهى" : x.ttlMin && Date.now() - x.started > x.ttlMin * 60e3 ? "تجاوزت مدتها" : "";
    if (why) { killTree(x.pid); stopped++; if (!quiet) console.log(`أُوقفت ${x.pid} «${x.label}»: ${why}`); return false; }
    return true;
  }));
  if (!quiet) console.log(stopped ? `reap: ${stopped} أُوقفت` : "reap: لا شيء يُوقف");
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...a] = process.argv.slice(2);
  const head = a.indexOf("--") >= 0 ? a.slice(0, a.indexOf("--")) : a;   // options before «--» belong to proc.mjs, the rest to the job
  const opt = (k, d) => { const i = head.indexOf("--" + k); return i < 0 ? d : head[i + 1]; };
  if (cmd === "run") {
    const dd = a.indexOf("--"); if (dd < 0 || dd === a.length - 1) { console.error("usage: proc.mjs run [--label L] [--project p] [--ttl MIN] [--log FILE] -- <cmd> …"); process.exit(2); }
    /* --wait: run.mjs stays in the foreground until the job ends and the job is bound to the shells above it (stopping that task stops the job and
       everything under it). Without --wait the job is detached — its shell ends at once — so it MUST have a limit: --ttl (default 90 min). */
    const WAIT = head.includes("--wait");
    const [c, ...args] = a.slice(dd + 1), label = opt("label", path.basename(args[0] ?? c)), log = opt("log", ""), ttl = Number(opt("ttl", WAIT ? 0 : 90));
    const fd = log ? fs.openSync(log, "a") : WAIT ? "inherit" : "ignore";
    // npx / npm are .cmd scripts on Windows: they need the command shell (the whole tree is still stopped together, taskkill /T)
    const viaShell = process.platform === "win32" && /^(npx|npm|pnpm|yarn)$/i.test(c);
    const ch = spawn(c, args, { cwd: process.cwd(), detached: !WAIT, windowsHide: true, stdio: ["ignore", fd, fd], shell: viaShell });
    lowPrio(ch.pid);
    /* Git Bash hides its shells from the Windows parent chain (nice.exe's parent pid is already a dead fork): tools/bg.sh passes the real Windows pid of
       the calling bash (/proc/$$/winpid) as --owner and in HK_OWNER, so stopping the task (which kills that bash) stops the job and its tree. */
    const given = [opt("owner", ""), process.env.HK_OWNER ?? ""].join(",").split(",").map(Number).filter((n) => n > 0);
    const owners = WAIT ? [...new Set([process.pid, ...shellOwners(process.pid), ...given])] : [];
    register({ pid: ch.pid, label, project: opt("project", ""), cmd: [c, ...args].join(" ").slice(0, 200), started: Date.now(), ttlMin: ttl, owners, log });
    watch(ch.pid, owners, ttl);
    if (WAIT) ch.on("exit", (code) => { edit((r) => r.filter((x) => x.pid !== ch.pid)); process.exit(code ?? 1); });
    else { ch.unref(); console.log(ch.pid); }
  } else if (cmd === "ls") {
    reap(true);
    const r = readReg(), st = stats(r.map((x) => x.pid));
    if (!r.length) console.log("لا عمل مسجَّل يعمل الآن");
    for (const x of r) { const s = st.get(x.pid) ?? {}; console.log(`${x.pid}\t${x.label}\t${x.project || "—"}\t${Math.round((Date.now() - x.started) / 60e3)} د\tمعالج ${s.cpu ?? "?"} ث\tذاكرة ${s.mem ?? "?"} م.ب${x.ttlMin ? `\tحدّها ${x.ttlMin} د` : ""}`); }
  } else if (cmd === "stop") {
    const k = a[0]; const r = readReg(); const hit = r.filter((x) => k === "all" || String(x.pid) === k || x.label === k);
    if (!hit.length) { console.error(`✘ لا عمل مسجَّل بهذا: ${k} (هذه الأداة لا توقف إلا ما شغّلته)`); process.exit(1); }
    for (const x of hit) { const ok = !alive(x.pid) || killTree(x.pid); console.log(`${ok ? "✔ أُوقفت" : "✘ لم تتوقف"} ${x.pid} «${x.label}»`); }
    edit((rr) => rr.filter((x) => alive(x.pid)));
  } else if (cmd === "reap") reap(a.includes("--quiet"));
  else { console.error("usage: node tools/proc.mjs run|ls|stop|reap"); process.exit(2); }
}
