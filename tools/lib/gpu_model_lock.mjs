// Serialize heavyweight CUDA model jobs across clip workers. Unlike the render
// lock, this covers Whisper/NER model initialization and inference too.
//
// Lock file = {pid, start, token, label, at}, written atomically (temp file + hard link, so a reader never sees an
// empty lock). A holder is dead when its pid is gone OR the pid now belongs to another process (the recorded start
// time differs: PID reuse). A dead/broken lock is taken over under a short mutex and only if it is still byte-for-byte
// the lock that was judged dead, so two waiters can never delete each other's LIVE lock.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pidOk = (pid) => Number.isInteger(Number(pid)) && Number(pid) > 0;
const alive = (pid) => { if (!pidOk(pid)) return false; try { process.kill(Number(pid), 0); return true; } catch (e) { return e.code === "EPERM"; } };
const START_SLACK_MS = 10000;                       // Node's own clock vs the OS creation time of the same process
const OWN_START_MS = Math.round(Date.now() - process.uptime() * 1000);

/* Workers started before this module existed do not know the lock. A FIXED instant (the file's creation, 2026-11-22 11:49 +01:00),
   not the file's mtime: an mtime cutoff moves on every edit and made newer, lock-aware workers look «old» to each other. */
export const LEGACY_CUTOFF_MS = Date.parse("2026-11-22T11:49:00+01:00");
const LEGACY_PATTERN = String.raw`tools[\\/](words_drift|ner_scan)\.py|tools[\\/]requirements\.mjs`;

const ps = (script, env = {}) => spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8", windowsHide: true, timeout: 15000, env: { ...process.env, ...env } });

/** OS creation time of a process in epoch ms (Windows only; null = unknown). Epoch milliseconds, never a local-time DateTime. */
export function processStartMs(pid) {
  if (process.platform !== "win32" || !pidOk(pid)) return null;
  if (Number(pid) === process.pid) return OWN_START_MS;
  const r = ps(`$ErrorActionPreference='SilentlyContinue'; Get-CimInstance Win32_Process -Filter "ProcessId=${Number(pid)}" | ForEach-Object { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() }`);
  const n = Number((r.stdout || "").trim().split(/\s+/)[0]);
  return r.status === 0 && Number.isFinite(n) && n > 0 ? n : null;
}

/** Pids of model processes (words_drift / ner_scan / requirements) that started BEFORE the cutoff: their CUDA work is not under this lock. */
export function legacyModelPids({ cutoffMs = LEGACY_CUTOFF_MS, pattern = LEGACY_PATTERN, selfPid = process.pid } = {}) {
  if (process.platform !== "win32") return [];
  const r = ps(`$ErrorActionPreference='SilentlyContinue'; $pat=$env:HK_GPU_LEGACY_PAT; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match $pat } | ForEach-Object { '{0} {1}' -f $_.ProcessId, ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() }`, { HK_GPU_LEGACY_PAT: pattern });
  if (r.status !== 0) return [];
  const out = [];
  for (const line of (r.stdout || "").split(/\r?\n/)) {
    const [pid, ms] = line.trim().split(/\s+/).map(Number);
    if (pidOk(pid) && pid !== selfPid && Number.isFinite(ms) && ms < cutoffMs) out.push(pid);   // epoch ms vs epoch ms: no timezone anywhere
  }
  return out;
}

/** Is the process that wrote this lock still the same live process? Unknown start time = assume alive (never steal a live lock). */
const ownerAlive = (owner) => {
  if (!alive(owner.pid)) return false;
  if (Number(owner.pid) !== process.pid && typeof owner.start === "number" && process.platform === "win32") {
    const s = processStartMs(owner.pid);
    if (s !== null && Math.abs(s - owner.start) > START_SLACK_MS) return false;   // PID reused by another process
  }
  return true;
};

function readLock(lock) {
  let raw;
  try { raw = fs.readFileSync(lock, "utf8"); } catch (e) { return e.code === "ENOENT" ? { kind: "none" } : { kind: "busy", code: e.code }; }
  try { const owner = JSON.parse(raw); if (owner && pidOk(owner.pid)) return { kind: "owner", owner, raw }; } catch { /* empty or torn file */ }
  let age = 0; try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { return { kind: "none" }; }
  return { kind: "broken", raw, age };
}

/** Remove a lock judged dead. One waiter at a time; the lock is deleted only if it is still exactly the text that was judged. */
function takeover(lock, raw) {
  const mutex = `${lock}.takeover`;
  try { if (Date.now() - fs.statSync(mutex).mtimeMs > 15000) fs.rmSync(mutex, { force: true }); } catch { /* none */ }   // its holder died inside the few-ms section
  let fd; try { fd = fs.openSync(mutex, "wx"); } catch { return false; }   // another waiter is already recovering
  try {
    let now; try { now = fs.readFileSync(lock, "utf8"); } catch { return true; }   // already gone
    if (now !== raw) return false;                                                  // replaced meanwhile (maybe by a LIVE lock): leave it
    try { fs.rmSync(lock, { force: true }); return true; } catch { return false; }  // EPERM/EBUSY: retry next poll, never throw into the caller
  } finally { try { fs.closeSync(fd); } catch { /* closed */ } try { fs.rmSync(mutex, { force: true }); } catch { /* gone */ } }
}

/** exported for the self-test: remove a lock only while it is still exactly the text that was judged dead */
export const takeoverDeadLock = takeover;

const TRANSIENT = new Set(["EEXIST", "EPERM", "EACCES", "EBUSY"]);
/** Create the lock with its content already inside (hard link of a finished temp file); falls back to an exclusive create. */
function tryCreate(lock, owner, note) {
  const tmp = `${lock}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`, body = JSON.stringify(owner);
  fs.writeFileSync(tmp, body);
  try { fs.linkSync(tmp, lock); return true; }
  catch (e) {
    if (e.code === "EEXIST") return false;
    if (!TRANSIENT.has(e.code) && e.code !== "ENOSYS" && e.code !== "EXDEV") throw e;
    try { fs.writeFileSync(lock, body, { flag: "wx" }); return true; }
    catch (e2) { if (!TRANSIENT.has(e2.code)) throw e2; if (e2.code !== "EEXIST") note.code = e2.code; return false; }   // a delete-pending file answers EPERM: just wait
  } finally { try { fs.rmSync(tmp, { force: true }); } catch { /* gone */ } }
}

/** Run one heavyweight model phase at a time; waits visibly, never kills a holder. */
export async function withGpuModel(label, fn, { root = process.env.HK_GPU_LOCK_ROOT || ROOT, pollMs = 15000, maxWaitMs = 6 * 60 * 60 * 1000, log = console.log, detectLegacy = true, emptyGraceMs = 30000, legacyCutoffMs = LEGACY_CUTOFF_MS, legacyPattern = LEGACY_PATTERN } = {}) {
  const lock = path.join(root, ".tmp", "gpu_model.lock");
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  const started = Date.now(), note = { code: "" }, owner = { pid: process.pid, start: OWN_START_MS, token: crypto.randomBytes(8).toString("hex"), label, at: Date.now() };
  let lastNote = 0;
  for (;;) {
    let holder = null;
    const st = readLock(lock);
    if (st.kind === "owner") {
      if (ownerAlive(st.owner)) holder = st.owner;
      else if (takeover(lock, st.raw)) continue;               // dead owner removed: try to create right away
      else holder = { ...st.owner, label: `${st.owner.label ?? "؟"} (يُستعاد قفله)` };
    } else if (st.kind === "broken") {
      if (st.age > emptyGraceMs && takeover(lock, st.raw)) continue;   // the writer died before finishing the file
      holder = { pid: "؟", label: "قفل فارغ قيد الكتابة أو تالف" };
    } else if (st.kind === "busy") holder = { pid: "؟", label: `قفل لا يُقرأ الآن (${st.code})` };
    if (!holder) {
      const legacy = detectLegacy ? legacyModelPids({ cutoffMs: legacyCutoffMs, pattern: legacyPattern }) : [];
      if (!legacy.length) { if (tryCreate(lock, owner, note)) break; }
      else holder = { pid: legacy[0], label: "نموذج CUDA من دفعة بدأت قبل المنظّم" };
    }
    const waited = Date.now() - started;
    if (waited >= maxWaitMs) throw new Error(`الكرت مشغول: ${label} انتظر ${Math.max(1, Math.round(waited / 60000))} دقيقة؛ الماسك ${holder?.label ?? "قفل مجهول"} (PID ${holder?.pid ?? "؟"})${note.code ? ` وآخر خطأ إنشاء ${note.code}` : ""}.`);
    if (Date.now() - lastNote >= 30000) {
      log(`⏳ ${label} ينتظر منظّم نماذج GPU؛ الماسك ${holder?.label ?? "عملية أخرى"} (PID ${holder?.pid ?? "؟"}) — انتظر ${Math.round(waited / 60000)} د`);
      lastNote = Date.now();
    }
    await sleep(Math.max(1, Math.min(pollMs, maxWaitMs - waited)));
  }
  log(`▶ ${label}: بدأ دوره الوحيد على GPU.`);
  try { return await fn(); }
  finally {
    try { const cur = JSON.parse(fs.readFileSync(lock, "utf8")); if (cur.token === owner.token && cur.pid === process.pid) fs.rmSync(lock, { force: true }); } catch { /* removed by recovery or never ours: nothing to release */ }
    log(`✔ ${label}: أُفرغ مورد GPU.`);
  }
}
