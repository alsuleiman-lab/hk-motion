// THE INDEPENDENT REVIEW OF CODEX'S 2026-11-22 TOOLING (render queue, requirements ledger, stream autobuild, GPU model lock, Git-Bash resolver). Every case is CPU-only and runs on
// FAKE data under .tmp/selftest/ (a scratch copy of the tool + stub neighbours; no real queue state, no real project, no real lock file, no GPU, no render).
// HK_SELFTEST_SRC=<dir holding an older copy of tools/…> runs the SAME cases against that copy (to prove each case fails without its fix).
export default async (api) => {
  const { add, expect, put, runAsync, livePid, RUN, ROOT, NODE, path, fs } = api;
  const { spawn, spawnSync } = await import("node:child_process");
  const { pathToFileURL } = await import("node:url");
  const crypto = await import("node:crypto");
  const SRC = process.env.HK_SELFTEST_SRC ? path.resolve(process.env.HK_SELFTEST_SRC) : ROOT;
  const GL = "tools/lib/gpu_model_lock.mjs", BR = "tools/lib/bash_runtime.mjs", RQ = "tools/render_queue.mjs", REQ = "tools/requirements.mjs", ND = "tools/name_doubt.mjs",
    AB = "tools/stream/clip_autobuild.mjs", RH = "tools/rehearsal.mjs", SRH = "tools/stream/stream_rehearsal.mjs", WD = "tools/words_drift_check.mjs";
  const L = "codex-review-2026-11-22";
  const src = (rel) => { const a = path.join(SRC, rel); return fs.existsSync(a) ? a : path.join(ROOT, rel); };
  const cp = (r, rel) => { fs.mkdirSync(path.dirname(path.join(r, rel)), { recursive: true }); fs.copyFileSync(src(rel), path.join(r, rel)); };
  const imp = (rel) => import(pathToFileURL(src(rel)).href + `?t=${Date.now()}_${Math.random()}`);
  const text = (rel) => fs.readFileSync(src(rel), "utf8");
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const dir = (name) => { const r = path.join(RUN, name); fs.mkdirSync(r, { recursive: true }); return r; };
  const deadPid = () => spawnSync(NODE, ["-e", ""], { windowsHide: true }).pid;
  const wins = process.platform === "win32";
  const quiet = { log: () => {}, detectLegacy: false };
  const tryLock = async (m, root, label, opts = {}) => { try { return { ok: true, v: await m.withGpuModel(label, async () => "ran", { root, pollMs: 20, maxWaitMs: 2500, ...quiet, ...opts }) }; } catch (e) { return { ok: false, why: String(e.message ?? e).slice(0, 160) }; } };
  const lockOf = (root) => path.join(root, ".tmp", "gpu_model.lock");

  /* ───────────── A. GPU model lock ───────────── */
  add("gpu.legacy_cutoff_is_epoch", GL, L, "قفل نموذج GPU: عملية بدأت بعد حدّ «القديم» لا تُعدّ قديمة (المقارنة بالميلي ثانية، لا بتوقيت محلي يزيح ساعة)", async () => {
    if (!wins) return { ok: true };
    const m = await imp(GL), r = dir("gl_epoch"), tag = `zzlegacy${process.pid}x${Date.now()}`, cutoff = Date.now() - 2000;
    const fake = spawn(NODE, ["-e", "setTimeout(()=>{},30000)", "tools/words_drift.py", tag], { stdio: "ignore", windowsHide: true });
    try {
      await sleep(1200);
      const res = await tryLock(m, r, "epoch", { detectLegacy: true, legacyPattern: tag, legacyCutoffMs: cutoff, maxWaitMs: 4000, pollMs: 100 });
      return expect(res.ok, `عملية بدأت بعد الحدّ بثانية اعتُبرت قديمة وحجزت القفل: ${res.why}`);
    } finally { try { fake.kill(); } catch { /* gone */ } }
  });
  add("gpu.legacy_old_process_still_blocks", GL, L, "قفل نموذج GPU: عملية نموذج بدأت قبل حدّ «القديم» ما زالت تُنتظر (الإصلاح لم يُعطّل الكشف)", async () => {
    if (!wins) return { ok: true };
    const m = await imp(GL), r = dir("gl_old"), tag = `zzold${process.pid}x${Date.now()}`;
    const fake = spawn(NODE, ["-e", "setTimeout(()=>{},30000)", "tools/words_drift.py", tag], { stdio: "ignore", windowsHide: true });
    try {
      await sleep(1200);
      const res = await tryLock(m, r, "old", { detectLegacy: true, legacyPattern: tag, legacyCutoffMs: Date.now() + 120000, maxWaitMs: 1500, pollMs: 100 });
      return expect(!res.ok && /الكرت مشغول/.test(res.why), `لم تُنتظر العملية القديمة: ${res.ok ? "أُخذ القفل" : res.why}`);
    } finally { try { fake.kill(); } catch { /* gone */ } }
  });
  add("gpu.takeover_never_deletes_live_lock", GL, L, "قفل نموذج GPU: من حكم على قفل بأنه ميّت لا يحذفه إن صار القفل غيره (قفل حي لمنتظر آخر)", async () => {
    const m = await imp(GL), r = dir("gl_takeover"), lock = lockOf(r);
    if (typeof m.takeoverDeadLock !== "function") return { ok: false, why: "لا استرداد ذرّي مُتحقَّق منه (takeoverDeadLock)" };
    const dead = JSON.stringify({ pid: deadPid(), label: "ميت", at: 1 }), live = JSON.stringify({ pid: livePid(), label: "حي", at: Date.now() });
    put(lock, live);                                         // the lock was replaced by a LIVE one after the waiter judged the dead one
    const refused = m.takeoverDeadLock(lock, dead), kept = fs.existsSync(lock) && fs.readFileSync(lock, "utf8") === live;
    put(lock, dead); const removed = m.takeoverDeadLock(lock, dead) && !fs.existsSync(lock);   // the lock it really judged IS removed
    return expect(refused === false && kept && removed, `رفض=${refused} القفل الحي باقٍ=${kept} الميت أُزيل=${removed}`);
  });
  add("gpu.dead_owner_recovered_and_exclusive", GL, L, "قفل نموذج GPU: قفل صاحبه ميّت يُسترد، وأربع عمليات متزامنة لا تتداخل أبداً", async () => {
    const r = dir("gl_stress"), lock = lockOf(r), logf = path.join(r, "log.txt"), go = path.join(r, "go");
    put(lock, { pid: deadPid(), start: 1, label: "ميت", at: 1 });
    const child = put(path.join(r, "child.mjs"), `import fs from "node:fs"; import { withGpuModel } from ${JSON.stringify(pathToFileURL(src(GL)).href)};
const [root, go, logf, who] = process.argv.slice(2); const sab = new Int32Array(new SharedArrayBuffer(4));
while (!fs.existsSync(go)) Atomics.wait(sab, 0, 0, 2);
await withGpuModel(who, async () => { fs.appendFileSync(logf, "in " + who + "\\n"); await new Promise((x) => setTimeout(x, 60)); fs.appendFileSync(logf, "out " + who + "\\n"); }, { root, pollMs: 5, maxWaitMs: 60000, log: () => {}, detectLegacy: false });`);
    const run = (i) => runAsync(NODE, [child, r, go, logf, `w${i}`], { cwd: r, timeout: 40000 });
    const all = [0, 1, 2, 3].map(run); await sleep(1200); put(go, "1");
    const res = await Promise.all(all), seq = fs.existsSync(logf) ? fs.readFileSync(logf, "utf8").trim().split(/\r?\n/) : [];
    const alternates = seq.length === 8 && seq.every((l, i) => l.startsWith(i % 2 ? "out" : "in")) && seq.every((l, i) => i % 2 === 0 || l.slice(4) === seq[i - 1].slice(3));
    return expect(res.every((x) => x.status === 0) && alternates && !fs.existsSync(lock), `رموز=${res.map((x) => x.status)} تسلسل=${seq.join(",")} ${res.map((x) => x.err.slice(0, 80)).join("|")}`);
  });
  add("gpu.pid_reuse_is_stale", GL, L, "قفل نموذج GPU: رقم PID حي لكن لعملية أخرى (وقت بدء مختلف) = قفل ميّت يُسترد؛ والمالك الحقيقي يُنتظر", async () => {
    if (!wins) return { ok: true };
    const m = await imp(GL), pid = livePid();
    const r1 = dir("gl_reuse1"); put(lockOf(r1), { pid, start: Date.now() - 3 * 3600e3, label: "PID أُعيد استعماله", at: Date.now() - 3 * 3600e3 });
    const reused = await tryLock(m, r1, "reuse");
    const real = typeof m.processStartMs === "function" ? m.processStartMs(pid) : null, r2 = dir("gl_reuse2");
    put(lockOf(r2), { pid, start: real ?? undefined, label: "مالك حقيقي", at: Date.now() });
    const owned = await tryLock(m, r2, "owned", { maxWaitMs: 1200 });
    return expect(reused.ok && !owned.ok && /الكرت مشغول/.test(owned.why), `المعاد استعماله: ${reused.ok ? "استُرد" : reused.why}؛ المالك الحقيقي: ${owned.ok ? "سُرق قفله" : owned.why}`);
  });
  add("gpu.empty_lock_recovers_after_grace", GL, L, "قفل نموذج GPU: ملف قفل فارغ (ماتت العملية بين الإنشاء والكتابة) يُسترد بعد مهلة قصيرة، ولا يُسرق وهو طازج", async () => {
    const m = await imp(GL), r1 = dir("gl_empty1"), r2 = dir("gl_empty2");
    put(lockOf(r1), ""); const old = new Date(Date.now() - 120e3); fs.utimesSync(lockOf(r1), old, old);
    const stale = await tryLock(m, r1, "stale-empty");
    put(lockOf(r2), "");   // just created: its writer may still be about to fill it
    const fresh = await tryLock(m, r2, "fresh-empty", { maxWaitMs: 800 });
    return expect(stale.ok && !fresh.ok, `الفارغ القديم: ${stale.ok ? "استُرد" : stale.why}؛ الفارغ الطازج: ${fresh.ok ? "سُرق" : "بقي"}`);
  });
  add("gpu.unreadable_lock_never_throws_raw", GL, L, "قفل نموذج GPU: قفل لا يمكن حذفه أو قراءته (مجلد مكانه) لا يرمي EPERM/EISDIR على المستدعي بل رسالة «الكرت مشغول» واضحة", async () => {
    const m = await imp(GL), r = dir("gl_dirlock"); fs.mkdirSync(lockOf(r), { recursive: true });
    const res = await tryLock(m, r, "dir", { maxWaitMs: 700 });
    return expect(!res.ok && /الكرت مشغول/.test(res.why) && !/^(EPERM|EISDIR|EACCES)/.test(res.why), `النتيجة: ${res.ok ? "أخذ القفل" : res.why}`);
  });

  /* ───────────── B. Git Bash resolver ───────────── */
  const fakeGit = (name, { under = "Git" } = {}) => { const base = dir(name), exe = path.join(base, under, "bin", "bash.exe"); put(exe, "MZ"); return { base, exe, bin: path.dirname(exe) }; };
  add("bash.env_keys_case_insensitive", BR, L, "Git Bash: نسخة عادية من البيئة بمفتاح Path وPROGRAMFILES (لا PATH ولا ProgramFiles) تُحلّ وتُعدَّل تحت مفتاحها نفسه، بلا مفتاح PATH ثانٍ", async () => {
    const { envWithBash, bashExecutable } = await imp(BR), g = fakeGit("br_case"), keep = "C:\\Windows;C:\\Tools\\node";
    const env = { Path: `${keep}`, PROGRAMFILES: g.base };
    let out, exe, err = ""; try { exe = bashExecutable(env, "win32"); out = envWithBash(env, "win32"); } catch (e) { err = String(e.message).slice(0, 140); }
    if (!out) return { ok: false, why: `رمى: ${err}` };
    const pk = Object.keys(out).filter((k) => k.toLowerCase() === "path"), entries = String(out[pk[0]] ?? "").split(";");
    return expect(exe === g.exe && pk.length === 1 && pk[0] === "Path" && entries[0] === g.bin && entries.includes("C:\\Tools\\node") && entries.includes("C:\\Windows"), `exe=${exe} مفاتيح=${pk} أول=${entries[0]} الأصلية باقية=${entries.includes("C:\\Tools\\node")}`);
  });
  add("bash.git_dir_promoted_first", BR, L, "Git Bash: مجلد Git يُوضع أولاً حتى لو ظهر بعد WindowsApps في PATH، وإن وُجد PATH وPath معاً صارا مفتاحاً واحداً", async () => {
    const { envWithBash } = await imp(BR), g = fakeGit("br_first"), apps = "C:\\Users\\u\\AppData\\Local\\Microsoft\\WindowsApps";
    const a = envWithBash({ Path: `C:\\Windows;${apps};${g.bin};C:\\Tools`, ProgramFiles: g.base }, "win32"), ea = a.Path.split(";");
    const b = envWithBash({ Path: "C:\\Tools", PATH: `C:\\Other;${g.bin}`, ProgramFiles: g.base }, "win32"), kb = Object.keys(b).filter((k) => k.toLowerCase() === "path"), eb = (b[kb[0]] ?? "").split(";");
    return expect(ea[0] === g.bin && ea.indexOf(apps) > 0 && ea.filter((e) => e === g.bin).length === 1 && kb.length === 1 && eb[0] === g.bin && eb.includes("C:\\Tools") && eb.includes("C:\\Other"), `أول=${ea[0]} مفاتيح=${kb} دمج=${eb.join(";").slice(0, 100)}`);
  });
  add("bash.explicit_hk_git_bash_is_validated_loudly", BR, L, "Git Bash: HK_GIT_BASH خاطئ أو يشير إلى WindowsApps يرمي رسالة تسمّيه، ولا يُتجاهل بصمت ليُستبدل بغيره", async () => {
    const { bashExecutable } = await imp(BR), g = fakeGit("br_hk"), tr = (env) => { try { return { v: bashExecutable(env, "win32") }; } catch (e) { return { err: String(e.message) }; } };
    const missing = "Z:\\nowhere\\Git\\bin\\bash.exe", apps = "C:\\Users\\u\\AppData\\Local\\Microsoft\\WindowsApps\\bash.exe";
    const a = tr({ HK_GIT_BASH: missing, ProgramFiles: g.base }), b = tr({ hk_git_bash: apps, ProgramFiles: g.base }), c = tr({ HK_GIT_BASH: g.exe }), d = tr({ ProgramFiles: "Z:\\x", LOCALAPPDATA: "Z:\\y" });
    return expect(a.err?.includes(missing) && /HK_GIT_BASH/.test(a.err) && b.err?.includes(apps) && c.v === g.exe && d.err && /Git Bash/.test(d.err), `خاطئ=${a.err ?? a.v} wsl=${b.err ?? b.v} صحيح=${c.v ?? c.err} بلا Git=${d.err ?? d.v}`);
  });

  /* ───────────── C, D, B-lazy: the render queue in a scratch root ───────────── */
  const rqRoot = (name, lockStub = "export const withGpuModel = async (label, fn) => fn();") => {
    const r = dir(name);
    cp(r, RQ); cp(r, BR);
    put(path.join(r, "tools", "lib", "gpu_model_lock.mjs"), lockStub);
    put(path.join(r, "tools", "lib", "overlap_gate.mjs"), "export const overlapFailures = () => [];");
    put(path.join(r, "tools", "lib", "prerender_gate.mjs"), "export const freshness = () => ({ ok: true });");
    put(path.join(r, "tools", "cover_item.mjs"), "export const coverFailure = () => '';");
    put(path.join(r, "tools", "comp_kinds.mjs"), `import fs from "node:fs"; import path from "node:path";
export const resolve = (comp) => { const r = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "route.json"), "utf8")); return { kind: "zz", file: "src/ZzComp.tsx", render: { ok: true, mode: "comp", jobs: [{ comp, orient: r.orient, dest: r.dest, name: r.name, bumper: "none" }] } }; };`);
    put(path.join(r, "src", "ZzComp.tsx"), "export const ZzComp = () => null; // v1");
    put(path.join(r, "route.json"), { orient: "R", dest: path.join(r, "dest"), name: "zz.mp4" });
    return r;
  };
  const rqRun = (r, args, env = {}) => runAsync(NODE, ["tools/render_queue.mjs", ...args], { cwd: r, env: { ...process.env, HK_RQ_BUSY_WAIT_MS: "20", ...env }, timeout: 60000 });
  const addArgs = (r) => ["add", "--comp", "ZzC", "--orient", "R", "--dest", path.join(r, "dest"), "--name", "zz.mp4", "--bumper", "none", "--kind", "zz"];
  const stateOf = (r) => JSON.parse(fs.readFileSync(path.join(r, "data", "render_queue", "state.json"), "utf8"));
  const failedJob = (r, over = {}) => ({ spec: "ZzC", comp: "ZzC", orient: "R", mode: "comp", kind: "zz", dest: path.join(r, "dest"), name: "zz.mp4", bumper: "none", state: "failed", inputFingerprint: "OLDFP", attemptFingerprint: "OLDFP", retryCount: 1, err: "فشل سابق", at: new Date().toISOString(), ...over });

  add("render_queue.busy_wait_uses_shared_buffer", RQ, L, "الطابور: رفض «ممنوع رندر» لا يُسقط العامل (Atomics.wait على مخزن مشترك) وتنتهي المهمة «failed» بسببها لا «rendering»", async () => {
    const r = rqRoot("rq_wait"); put(path.join(r, "tools", "gpu_render.mjs"), `console.log("✘ ممنوع رندر: رندر آخر يعمل الآن"); process.exit(1);`);
    const a = await rqRun(r, addArgs(r)); if (a.status !== 0) return { ok: false, why: `الإضافة فشلت: ${(a.out + a.err).slice(0, 160)}` };
    const w = await rqRun(r, ["run"]), j = stateOf(r).jobs[0];
    return expect(w.status === 0 && j?.state === "failed" && /ممنوع رندر|gpu_render/.test(j.err ?? "") && !/TypeError|shared typed array/.test(w.err), `خروج=${w.status} حالة=${j?.state} سبب=${(j?.err ?? "").slice(0, 80)} خطأ=${w.err.trim().split(/\r?\n/)[0]?.slice(0, 100)}`);
  });
  add("render_queue.crashing_job_ends_failed", RQ, L, "الطابور: استثناء داخل مهمة (مثل غياب ملف التشغيل) يجعل المهمة «failed» بسببه ويُكمل العامل، لا تبقى «rendering»", async () => {
    const r = rqRoot("rq_crash", 'export const withGpuModel = async () => { throw new Error("lock boom"); };');   // the lock layer itself throws inside the job
    const a = await rqRun(r, addArgs(r)); if (a.status !== 0) return { ok: false, why: `الإضافة فشلت: ${(a.out + a.err).slice(0, 160)}` };
    const w = await rqRun(r, ["run"]), j = stateOf(r).jobs[0];
    return expect(w.status === 0 && j?.state === "failed" && /lock boom/.test(j.err ?? ""), `خروج=${w.status} حالة=${j?.state} سبب=${(j?.err ?? "").slice(0, 80)}`);
  });
  add("render_queue.retry_cap_per_fingerprint", RQ, L, "الطابور: سقف الإعادة لكل بصمة مدخلات — مصدر تغيّر بعد الفشل يُقبل بعدّاد صفر (حتى لو العدّاد 1 أو حُذفت المهمة)، ونفس المدخلات تبقى مرفوضة", async () => {
    const r = rqRoot("rq_retry"), probe = await rqRun(r, [...addArgs(r), "--dry"]), fp = (probe.out.match(/"inputFingerprint":"([0-9a-f]{64})"/) ?? [])[1];
    if (!fp) return { ok: false, why: `لا بصمة في التجربة الجافة: ${(probe.out + probe.err).slice(0, 160)}` };
    put(path.join(r, "data", "render_queue", "state.json"), { jobs: [failedJob(r)] });                                   // failed, retried once, then the source was fixed
    const fixed = await rqRun(r, addArgs(r)), j1 = fixed.status === 0 ? stateOf(r).jobs[0] : null;
    put(path.join(r, "data", "render_queue", "state.json"), { jobs: [failedJob(r, { inputFingerprint: fp, attemptFingerprint: fp, retryCount: 0 })] });   // SAME inputs: blind retry
    const blind = await rqRun(r, addArgs(r));
    put(path.join(r, "data", "render_queue", "state.json"), { jobs: [failedJob(r)] }); await rqRun(r, ["drop", "ZzC", "R"]);   // the job was deleted: its counter stays in the log
    const afterDrop = await rqRun(r, addArgs(r)), j3 = afterDrop.status === 0 ? stateOf(r).jobs[0] : null;
    const spec = text(RQ), both = (spec.match(/retryGate\(prev, job,/g) ?? []).length === 2;
    return expect(j1?.state === "queued" && j1.retryCount === 0 && blind.status !== 0 && j3?.state === "queued" && j3.retryCount === 0 && both,
      `بعد الإصلاح: ${fixed.status === 0 ? `${j1?.state}/${j1?.retryCount}` : (fixed.err || fixed.out).trim().slice(0, 90)}؛ نفس المدخلات: ${blind.status === 0 ? "قُبلت!" : "رُفضت"}؛ بعد الحذف: ${afterDrop.status === 0 ? `${j3?.state}/${j3?.retryCount}` : (afterDrop.err || afterDrop.out).trim().slice(0, 90)}؛ المسارين يستعملان البوابة: ${both}`);
  });
  add("render_queue.lazy_git_bash", [RQ, BR], L, "الطابور: بلا Git Bash يعمل ls (لا رمي عند الاستيراد)، وطلب ما يحتاج bash يفشل برسالة واضحة", async () => {
    const r = rqRoot("rq_lazy"), env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(programfiles|programw6432|localappdata|hk_git_bash)/i.test(k)));
    env.ProgramFiles = "Z:\\no\\Program Files"; env.LOCALAPPDATA = "Z:\\no\\Local";
    put(path.join(r, "data", "render_queue", "state.json"), { jobs: [failedJob(r)] });
    const ls = await runAsync(NODE, ["tools/render_queue.mjs", "ls"], { cwd: r, env, timeout: 30000 }), pl = await runAsync(NODE, ["tools/render_queue.mjs", "plan", "--spec", "a", "--comp", "b", "--orient", "R"], { cwd: r, env, timeout: 30000 });
    return expect(ls.status === 0 && /ZzC/.test(ls.out) && /Git Bash/.test(pl.out + pl.err), `ls خروج=${ls.status} ${(ls.err || ls.out).trim().slice(0, 120)}؛ plan: ${(pl.err + pl.out).trim().slice(0, 100)}`);
  });

  /* ───────────── E. requirements ledger cache ───────────── */
  const reqRoot = (name) => {
    const r = dir(name); cp(r, REQ); cp(r, ND);
    put(path.join(r, "tools", "lib", "gpu_model_lock.mjs"), "export const withGpuModel = async (label, fn) => fn();");
    put(path.join(r, "tools", "words_drift.py"), "# stand-in: only its bytes enter the cache key");
    return r;
  };
  const ff = (...a) => spawnSync("ffmpeg", ["-v", "error", "-y", ...a], { windowsHide: true });
  const fp = (r, ...files) => { const h = crypto.createHash("sha256"); for (const f of files) { h.update(path.basename(f)); h.update(fs.readFileSync(path.join(r, f))); } return h.digest("hex"); };
  const reqFixture = (r, p, { freq = 440, cache = [{ w: "سلام", s: 0, e: 0.3 }] } = {}) => {
    const T = path.join(r, ".tmp", p); fs.mkdirSync(T, { recursive: true });
    put(path.join(T, "cut_words.json"), [{ w: "سلام", s: 0, e: 0.3 }]);
    const a = ff("-f", "lavfi", "-i", `sine=frequency=${freq}:duration=1`, "-ar", "16000", "-ac", "1", path.join(T, "cut.wav")); if (a.status !== 0) return false;
    const b = ff("-i", path.join(T, "cut.wav"), "-ar", "16000", "-ac", "1", path.join(T, "cut16k.wav")); if (b.status !== 0) return false;
    put(path.join(T, "drift_fresh.json"), cache);
    put(path.join(T, "drift_fresh.json.input.json"), { fingerprint: fp(r, `.tmp/${p}/cut16k.wav`, "tools/words_drift.py"), at: "2026-01-01T00:00:00Z" });   // the cache of the OLD cut (no cutFingerprint: written by the first version)
    return T;
  };
  const reqRun = (r, p) => runAsync(NODE, ["tools/requirements.mjs", p], { cwd: r, env: { ...process.env, PY: path.join(r, "no_such_python.exe") }, timeout: 60000 });
  if (!spawnSync("ffmpeg", ["-version"], { windowsHide: true }).error) {
    add("requirements.cut_change_invalidates_whisper_cache", REQ, L, "السجل: إعادة القص (cut.wav جديد) تُسقط تفريغ Whisper المخزَّن حتى لو cut16k.wav القديم مطابق للبصمة؛ والصوت نفسه يُعاد استعماله؛ والمصفوفة الفارغة ليست إصابة", async () => {
      const r1 = reqRoot("rq_stale"), T1 = reqFixture(r1, "zzreq");
      if (!T1) return { ok: false, why: "ffmpeg لم يُنتج صوت الاختبار" };
      ff("-f", "lavfi", "-i", "sine=frequency=880:duration=1", "-ar", "16000", "-ac", "1", path.join(T1, "cut.wav"));        // the cut was redone: cut16k.wav + the cache are those of the old cut
      const stale = await reqRun(r1, "zzreq");
      const r2 = reqRoot("rq_same"), T2 = reqFixture(r2, "zzreq"); const same = T2 ? await reqRun(r2, "zzreq") : { out: "", err: "" };
      const r3 = reqRoot("rq_empty"), T3 = reqFixture(r3, "zzreq", { cache: [] }); const empty = T3 ? await reqRun(r3, "zzreq") : { out: "", err: "" };
      const reran = (x) => /words_drift فشل/.test(x.out + x.err), reused = (x) => /♻ Whisper/.test(x.out + x.err);
      return expect(reran(stale) && reused(same) && !reran(same) && reran(empty) && !reused(empty), `قص جديد: ${reran(stale) ? "أُعيد التفريغ" : "خُدِم تفريغ قديم"}؛ صوت لم يتغير: ${reused(same) ? "أُعيد استعماله" : "أُعيد تشغيله"}؛ مصفوفة فارغة: ${reran(empty) ? "رُفضت" : "قُبلت كإصابة"}`);
    });
  }
  add("name_doubt.probe_without_recheck", ND, L, "أسماء مشكوكة: فحص النصوص وحدها (noRecheck) لا يطلق إعادة الاستماع (CUDA) بل يُرجع «recheck» ليُنفَّذ الاستماع تحت قفل GPU", async () => {
    const r = dir("nd_probe"); cp(r, ND); put(path.join(r, ".tmp", "zzn", "cut_words.json"), [{ w: "شيء", s: 1, e: 1.3 }]);
    const m = await import(pathToFileURL(path.join(r, ND)).href + `?t=${Date.now()}`), res = m.nameDoubts("zzn", [{ text: "لبنان", t: 5, kind: "place" }], { noRecheck: true });
    return expect(res[0]?.verdict === "recheck", `الحكم: ${res[0]?.verdict}`);
  });

  /* ───────────── F, G: wiring (source of the files whose launch cannot be run here) ───────────── */
  add("tools.bash_and_gpu_wiring_src", [RH, SRH, WD, REQ, AB], L, "المصدر: التجربة الكاملة وتجربة البث تستدعيان Git Bash الصريح لا الاسم المجرد، وتفريغ words_drift_check وإعادة استماع الأسماء تحت قفل GPU", async () => {
    const rh = text(RH), srh = text(SRH), wd = text(WD), rq = text(REQ);
    const viaBash = (s) => /bashExecutable\(\)/.test(s) && /envWithBash\(cenv\)/.test(s) && /spawn\(viaBash \? bashExecutable\(\) : args\[0\]/.test(s);
    return expect(viaBash(rh) && viaBash(srh) && /withGpuModel\([^\n]*words_drift\.py/.test(wd) && /withGpuModel\(`Whisper re-listen/.test(rq) && /nameDoubts\(p, nameCands, \{ noRecheck: true \}\)/.test(rq),
      `rehearsal=${viaBash(rh)} stream=${viaBash(srh)} words_drift_check=${/withGpuModel\([^\n]*words_drift\.py/.test(wd)} re-listen=${/withGpuModel\(`Whisper re-listen/.test(rq)}`);
  });
  add("autobuild.per_clip_needs_and_grid_exit", AB, L, "المصدر: قائمة المستحقات لكل مقطع في ملف خاص (لا قراءة-تعديل-كتابة لملف مشترك بين 3 عمليات)، ورمز خروج grid_plan --write يُفحص", async () => {
    const s = text(AB), shared = /rd\(nf, \{\}\)|cur\[c\.id\]\s*=\s*due/.test(s);
    return expect(!shared && /"needs_picks"\)/.test(s) && /writeNeeds\(c\.id, due\)/.test(s) && /renameSync\(tmp, file\)/.test(s) && /gp\.status >= 2/.test(s) && /grid_plan --write failed/.test(s),
      `ملف مشترك باقٍ=${shared} كتابة لكل مقطع=${/writeNeeds\(c\.id, due\)/.test(s)} فحص رمز grid_plan=${/gp\.status >= 2/.test(s)}`);
  });
};
