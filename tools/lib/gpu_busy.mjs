// THE GPU IS SHARED — never wait on it in silence (rehearsal 2026-11-21, ledger prerender-gpu-silent-hang: prerender_check's second listening pass and its judder
// sample stalled for 15 minutes with no line while another session trained a voice model at 99 %; the user: «النص ساعة هذا الحد الأعلى»).
//   gpuState({details})        nvidia-smi load + memory and the compute processes (name, pid, command line, age, dedicated GPU memory when Windows reports it)
//   holderText(state)          one Arabic phrase naming what holds the card: «python.exe» (العملية 71216، 14 غيغا، منذ 3 س)
//   waitForGpu({needG, maxWaitS, log})   free → at once; busy → one Arabic line naming the holder, then a visible countdown every 15 s up to the limit;
//                              still busy → {ok:false, why:"الكرت مشغول: …"} (never a silent wait)
//   runTimed(cmd, args, {timeoutS, label, log})   a GPU child with a heartbeat line every 30 s and a hard limit: on timeout the process tree is killed and
//                              {timedOut:true, why:"الكرت مشغول: …"} comes back — never a hang
// PAUSING A FOREIGN LONG JOB (user via the coordinator, 2026-11-21: «لا يسأل؛ يحلها بأفضل طريقة»): at a montage start (montage_kickoff) or a rehearsal start, a long
// NON-montage job on the card (a python process of another tool — the voice-model training — running ≥ 10 min, not ours: nothing under this workspace's tools,
// never the Studio, a render, ffmpeg, node, ComfyUI or our own transcription) is SUSPENDED (NtSuspendProcess; never killed). Record: .tmp/gpu_paused.json
// {paused:[{pid,name,at,by,until}]}. It is RESUMED when the montage's final render ends (tools/gpu/render_project.sh), at `montage_guard end`, at the end of the
// rehearsal, by a detached watchdog after 90 minutes at most, or when its owner asks: node tools/lib/gpu_busy.mjs resume [--pid N]. Each pause and resume is one
// Arabic line on the montage board (.tmp/<by>/board.json «gpu»). Honest limit: a suspended process keeps its GPU memory; only the card's compute is freed.
//   CLI  node tools/lib/gpu_busy.mjs status | pause --by <p> [--max-min 90] | resume [--by <p>] [--pid N] [--reason "…"] | _watchdog <file> <untilMs>
// Self-test: tools/selftest_cases/i_rehearsal_fixes.mjs (a fake nvidia-smi state through HK_GPU_FAKE, and a dummy node process for suspend/resume).
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BUSY = { util: 85, longMin: 10, minMemG: 2, maxPauseMin: 90 };
export const PAUSED_FILE = path.join(ROOT, ".tmp", "gpu_paused.json");
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.round(Math.max(0, s) % 60)).padStart(2, "0")}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ps = (script, timeout = 30000) => spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { encoding: "utf8", windowsHide: true, timeout });

/** never paused: our own work and everything that is not a foreign python job */
const OURS = /Remotion_Workspace|remotion|ComfyUI|whisper|transcribe|diariz|gpu_render|render_job|cut_build|gpu_compositor/i;
const PROTECTED_NAME = /^(node|ffmpeg|ffprobe|chrome|msedge|electron|claude|explorer|dwm|csrss|winlogon|system)(\.exe)?$/i;
export const isOurs = (a) => OURS.test(String(a.cmd ?? "")) || OURS.test(String(a.path ?? ""));

/** the card now. HK_GPU_FAKE=<json file> replaces nvidia-smi (self-test) */
export function gpuState({ details = true } = {}) {
  const fake = process.env.HK_GPU_FAKE ? rd(process.env.HK_GPU_FAKE) : null;
  if (fake) return { ok: true, util: fake.util ?? 0, memUsed: fake.memUsed ?? 0, memTotal: fake.memTotal ?? 24576, apps: (fake.apps ?? []).map((a) => ({ ...a })), fake: true };
  const g = spawnSync("nvidia-smi", ["--query-gpu=utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"], { encoding: "utf8", windowsHide: true, timeout: 15000 });
  if (g.status !== 0 || !g.stdout) return { ok: false, util: 0, memUsed: 0, memTotal: 0, apps: [], why: "nvidia-smi لا يجيب" };
  const [util, memUsed, memTotal] = g.stdout.trim().split(/\r?\n/)[0].split(",").map((x) => Number(x.trim()));
  const c = spawnSync("nvidia-smi", ["--query-compute-apps=pid,process_name,used_memory", "--format=csv,noheader,nounits"], { encoding: "utf8", windowsHide: true, timeout: 15000 });
  let apps = String(c.stdout ?? "").trim().split(/\r?\n/).filter(Boolean).map((l) => { const [pid, p, m] = l.split(",").map((x) => x.trim()); return { pid: Number(pid), path: p, name: path.basename(p ?? ""), memG: Number.isFinite(Number(m)) ? Number(m) / 1024 : null }; }).filter((a) => a.pid > 0);
  /* Windows (WDDM) lists every desktop app and no memory per process: the details come from the process table and the «GPU Process Memory» counter, for python processes only */
  const py = apps.filter((a) => /python/i.test(a.name));
  if (details && py.length) {
    const r = ps(`$c=@{}; try { (Get-Counter '\\GPU Process Memory(*)\\Dedicated Usage' -ErrorAction Stop).CounterSamples | % { if ($_.InstanceName -match 'pid_(\\d+)_') { $p=[int]$matches[1]; $c[$p]=[double]$c[$p]+$_.CookedValue } } } catch {}
$o = foreach ($i in @(${py.map((a) => a.pid).join(",")})) { $w = Get-CimInstance Win32_Process -Filter "ProcessId=$i" -ErrorAction SilentlyContinue; if ($w) { [pscustomobject]@{pid=$i; cmd=$w.CommandLine; created=$w.CreationDate.ToUniversalTime().ToString('o'); mem=[double]$c[$i]} } }
@($o) | ConvertTo-Json -Compress`);
    let d = []; try { d = [].concat(JSON.parse(r.stdout || "[]") ?? []); } catch { /* none */ }
    for (const x of d) { const a = apps.find((y) => y.pid === x.pid); if (!a) continue; a.cmd = x.cmd ?? ""; a.ageMin = x.created ? (Date.now() - Date.parse(x.created)) / 60e3 : null; if (x.mem > 0) a.memG = x.mem / 1024 ** 3; }
  }
  return { ok: true, util, memUsed, memTotal, apps };
}
/** the process that most likely holds the card: the python job with the most memory (else the first python) */
export const holderOf = (st) => [...(st.apps ?? [])].filter((a) => /python/i.test(a.name ?? "")).sort((a, b) => (b.memG ?? 0) - (a.memG ?? 0))[0] ?? null;
export function holderText(st) {
  const h = holderOf(st), load = `الحمل ${st.util}%، الذاكرة ${(st.memUsed / 1024).toFixed(0)} من ${(st.memTotal / 1024).toFixed(0)} غيغا`;
  if (!h) return `عملية لا يسمّيها التعريف (${load})`;
  const what = /VoiceStudio|voice|tts|train/i.test(`${h.cmd ?? ""} ${h.path ?? ""}`) ? " — تدريب نموذج صوت لجلسة أخرى" : "";
  return `«${h.name}» (العملية ${h.pid}${h.memG ? `، ${h.memG.toFixed(0)} غيغا` : ""}${Number.isFinite(h.ageMin) ? `، منذ ${h.ageMin >= 60 ? `${(h.ageMin / 60).toFixed(1)} س` : `${Math.round(h.ageMin)} د`}` : ""}${what}؛ ${load})`;
}
/** busy for a job that needs needG GB: high load, or not enough free memory */
export function isBusy(st, needG = 0) { if (!st.ok) return false; const freeG = (st.memTotal - st.memUsed) / 1024; return st.util >= BUSY.util || (needG > 0 && freeG < needG); }

/** wait for the card with a visible countdown (never silent); maxWaitS from PRERENDER_GPU_WAIT_S or the caller */
export async function waitForGpu({ needG = 0, maxWaitS = Number(process.env.HK_GPU_WAIT_S ?? 300), pollS = 15, log = console.log, label = "خطوة الكرت" } = {}) {
  let st = gpuState({ details: false });
  if (!isBusy(st, needG)) return { ok: true, waitedS: 0, state: st };
  st = gpuState();
  log(`⏳ الكرت مشغول بـ${holderText(st)} — ${label} تنتظره حتى ${mmss(maxWaitS)} ثم تفشل بسببها، لا صمت.`);
  const t0 = Date.now();
  for (;;) {
    const left = maxWaitS - (Date.now() - t0) / 1000;
    if (left <= 0) return { ok: false, waitedS: maxWaitS, state: st, why: `الكرت مشغول: ${holderText(st)} — ${label} انتظرت ${mmss(maxWaitS)} ولم يفرغ` };
    await sleep(Math.min(pollS, Math.max(0.2, left)) * 1000);
    st = gpuState({ details: false });
    if (!isBusy(st, needG)) { log(`✔ فرغ الكرت بعد ${mmss((Date.now() - t0) / 1000)} — ${label} تبدأ.`); return { ok: true, waitedS: (Date.now() - t0) / 1000, state: st }; }
    log(`   … ${label}: الكرت ما زال مشغولاً (الحمل ${st.util}%)، بقي ${mmss(maxWaitS - (Date.now() - t0) / 1000)} من الانتظار`);
  }
}
const killTree = (pid) => { try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, timeout: 15000 }); else process.kill(pid, "SIGKILL"); } catch { /* gone */ } };
/** a GPU child with a heartbeat and a hard limit; resolves {status, stdout, stderr, timedOut, why} */
export function runTimed(cmd, args, { timeoutS = 600, label = "خطوة الكرت", log = console.log, beatS = 30, cwd = ROOT, env = process.env } = {}) {
  return new Promise((res) => {
    const t0 = Date.now(), c = spawn(cmd, args, { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "", done = false;
    c.stdout.on("data", (d) => { out += d; if (out.length > 1 << 24) out = out.slice(-(1 << 23)); });
    c.stderr.on("data", (d) => { err += d; if (err.length > 1 << 24) err = err.slice(-(1 << 23)); });
    const beat = setInterval(() => log(`   … ${label} تعمل منذ ${mmss((Date.now() - t0) / 1000)} (الحد ${mmss(timeoutS)})`), beatS * 1000);
    const kill = setTimeout(() => {
      if (done) return; done = true; clearInterval(beat); killTree(c.pid);
      const st = gpuState(), why = `الكرت مشغول: ${label} لم تنتهِ في ${mmss(timeoutS)} فأُوقفت — ${isBusy(st) ? `يمسكه ${holderText(st)}` : `الحمل الآن ${st.util}%`}`;
      log(`✘ ${why}`); res({ status: null, stdout: out, stderr: err, timedOut: true, why });
    }, timeoutS * 1000);
    c.on("error", (e) => { if (done) return; done = true; clearInterval(beat); clearTimeout(kill); res({ status: null, stdout: out, stderr: String(e.message), timedOut: false, why: String(e.message) }); });
    c.on("close", (code) => { if (done) return; done = true; clearInterval(beat); clearTimeout(kill); res({ status: code, stdout: out, stderr: err, timedOut: false }); });
  });
}

/* ── pausing a foreign long job ── */
const SUSPEND_PS = (pid, fn) => `$s=@"
using System; using System.Runtime.InteropServices;
public static class HkSusp { [DllImport("ntdll.dll")] public static extern int NtSuspendProcess(IntPtr h); [DllImport("ntdll.dll")] public static extern int NtResumeProcess(IntPtr h);
[DllImport("kernel32.dll", SetLastError=true)] public static extern IntPtr OpenProcess(int a, bool i, int p); [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h); }
"@
Add-Type -TypeDefinition $s; $h=[HkSusp]::OpenProcess(0x0800,$false,${Number(pid)}); if ($h -eq [IntPtr]::Zero) { exit 3 }; $r=[HkSusp]::${fn}($h); [void][HkSusp]::CloseHandle($h); exit $r`;
/** suspend / resume one process (Windows NtSuspendProcess / NtResumeProcess; elsewhere SIGSTOP / SIGCONT). true on success */
export function suspendPid(pid) { if (process.platform !== "win32") { try { process.kill(pid, "SIGSTOP"); return true; } catch { return false; } } return ps(SUSPEND_PS(pid, "NtSuspendProcess")).status === 0; }
export function resumePid(pid) { if (process.platform !== "win32") { try { process.kill(pid, "SIGCONT"); return true; } catch { return false; } } return ps(SUSPEND_PS(pid, "NtResumeProcess")).status === 0; }
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

/** the foreign long jobs that may be paused (never ours, never a protected name, a python job ≥ 10 min with ≥ 2 GB when the memory is known) */
export function pausable(st) {
  return (st.apps ?? []).filter((a) => /python/i.test(a.name ?? "") && !PROTECTED_NAME.test(a.name ?? "") && !isOurs(a) && a.pid !== process.pid && a.pid !== process.ppid
    && (a.ageMin == null || a.ageMin >= BUSY.longMin) && (a.memG == null || a.memG >= BUSY.minMemG) && a.cmd !== undefined);
}
/** one line on the montage board (.tmp/<by>/board.json «gpu»), when that board exists */
export function boardNote(by, line, root = ROOT) {
  const f = path.join(root, ".tmp", String(by ?? ""), "board.json"); const b = by ? rd(f) : null; if (!b) return false;
  b.gpu = line; b.gpuLog = [...(b.gpuLog ?? []), { at: Date.now(), line }].slice(-10);
  fs.writeFileSync(f + ".tmp", JSON.stringify(b, null, 1)); fs.renameSync(f + ".tmp", f); return true;
}
/** pause the foreign long jobs holding a busy card; returns {paused:[…], line} (line = the Arabic board line, or "" when nothing was done) */
export function pauseForMontage({ by, maxMin = BUSY.maxPauseMin, file = PAUSED_FILE, state = null, watchdog = true, root = ROOT } = {}) {
  const st = state ?? gpuState();
  if (!isBusy(st)) return { paused: [], line: "" };
  const rec = rd(file, { paused: [] }), now = Date.now(), done = [];
  for (const a of pausable(st)) {
    if (rec.paused.some((x) => x.pid === a.pid)) continue;
    if (!suspendPid(a.pid)) continue;
    const x = { pid: a.pid, name: a.name, cmd: String(a.cmd ?? "").slice(0, 300), at: new Date(now).toISOString(), by, until: now + maxMin * 60e3, holder: holderText({ ...st, apps: [a] }) };
    rec.paused.push(x); done.push(x);
  }
  if (!done.length) return { paused: [], line: "", why: `الكرت مشغول بـ${holderText(st)} ولا عملية خارجية طويلة يجوز إيقافها (عملنا لا يُوقف)` };
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(rec, null, 1));
  if (watchdog) { const w = spawn(process.execPath, [fileURLToPath(import.meta.url), "_watchdog", file, String(Math.max(...done.map((x) => x.until)))], { detached: true, stdio: "ignore", windowsHide: true, cwd: ROOT }); w.unref(); }
  const line = `⏸ أوقفتُ مؤقتاً ${done.map((x) => x.holder).join("، ")} لأن الكرت كان مشغولاً — يُستأنف آلياً بعد الرندر النهائي أو بإنهاء المونتاج أو بعد ${maxMin} دقيقة على الأكثر (لم يُقتل).`;
  boardNote(by, line, root);
  return { paused: done, line };
}
/** resume what was paused (all, or one montage's, or one pid); returns {resumed:[…], line} */
export function resumePaused({ by = null, pid = null, reason = "طُلب الاستئناف", file = PAUSED_FILE, root = ROOT } = {}) {
  const rec = rd(file, null); if (!rec?.paused?.length) return { resumed: [], line: "" };
  const pick = rec.paused.filter((x) => (pid == null || x.pid === Number(pid)) && (by == null || x.by === by)), keep = rec.paused.filter((x) => !pick.includes(x)), got = [];
  for (const x of pick) { const ok = !alive(x.pid) || resumePid(x.pid); if (ok) got.push(x); else keep.push(x); }
  if (keep.length) fs.writeFileSync(file, JSON.stringify({ ...rec, paused: keep }, null, 1)); else fs.rmSync(file, { force: true });
  try { fs.appendFileSync(path.join(path.dirname(file), "gpu_pause_history.jsonl"), JSON.stringify({ at: new Date().toISOString(), resumed: got.map((x) => x.pid), reason }) + "\n"); } catch { /* best effort */ }
  if (!got.length) return { resumed: [], line: "" };
  const line = `▶ استُؤنف ${got.map((x) => `«${x.name}» (العملية ${x.pid})`).join("، ")} — ${reason}.`;
  for (const b of new Set(got.map((x) => x.by))) boardNote(b, line, root);
  return { resumed: got, line };
}

/* ── CLI ── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), opt = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : null), cmd = argv[0];
  if (cmd === "status") { const st = gpuState(); console.log(st.ok ? `${isBusy(st) ? "⛔ الكرت مشغول" : "✔ الكرت متاح"}: ${holderText(st)}${pausable(st).length ? ` — يجوز إيقافه مؤقتاً: ${pausable(st).map((a) => a.pid).join("، ")}` : ""}` : `✘ ${st.why}`); const r = rd(PAUSED_FILE); if (r?.paused?.length) console.log(`⏸ موقوف مؤقتاً: ${r.paused.map((x) => `${x.name} (${x.pid}) لـ${x.by} حتى ${new Date(x.until).toLocaleTimeString()}`).join("، ")}`); process.exit(0); }
  if (cmd === "pause") { const r = pauseForMontage({ by: opt("by") ?? "manual", maxMin: Number(opt("max-min") ?? BUSY.maxPauseMin) }); console.log(r.line || r.why || "✔ الكرت متاح: لا إيقاف"); process.exit(0); }
  if (cmd === "resume") { const r = resumePaused({ by: opt("by"), pid: opt("pid"), reason: opt("reason") ?? "طُلب الاستئناف" }); console.log(r.line || "لا شيء موقوف"); process.exit(0); }
  if (cmd === "_watchdog") {
    const file = argv[1], until = Number(argv[2]);
    for (;;) { const r = rd(file); if (!r?.paused?.length) process.exit(0); const due = r.paused.filter((x) => Date.now() >= x.until); for (const x of due) resumePaused({ pid: x.pid, reason: `مرّ الحد الأقصى للإيقاف (${BUSY.maxPauseMin} دقيقة)`, file }); if (Date.now() > until + 60e3 && !rd(file)?.paused?.length) process.exit(0); await sleep(Math.min(30e3, Math.max(1000, Math.min(...(rd(file)?.paused ?? [{ until }]).map((x) => x.until)) - Date.now()))); }
  }
  console.error("usage: node tools/lib/gpu_busy.mjs status | pause --by <p> | resume [--by <p>] [--pid N] [--reason …]"); process.exit(2);
}
