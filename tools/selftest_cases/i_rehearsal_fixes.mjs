/* THE ENGINE REHEARSAL'S DEFECTS (tools/rehearsal.mjs, data/rehearsal/times.jsonl, commit 6bf1801 — found before any real episode; fixed 2026-11-21):
   1) reel-suggest-unbuildable          the reel story started a part between two words with no quiet point, and its own build refused it
   2) prerender-gpu-silent-hang         prerender_check's second listening pass and judder sample stalled silently on a busy card (+ the pause of a foreign job)
   3) shared-typecheck-foreign-file     another session's half-written src file failed this montage's typecheck
   4) builder-mention-image-missing     the builder's default for «القرآن» needed an image it could not fetch, and the build failed
   NO GPU anywhere: synthetic audio (ffmpeg aevalsrc, CPU), a FAKE nvidia-smi state (HK_GPU_FAKE) in child processes, a dummy node process for suspend/resume,
   scratch trees under .tmp/selftest/<run>/i_rf/. */
export default async (api) => {
  const { add, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const D = path.join(RUN, "i_rf");
  const src = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SJ = () => import(pathToFileURL(path.join(ROOT, "tools", "join_seam_check.mjs")).href);
  const GB = () => import(pathToFileURL(path.join(ROOT, "tools", "lib", "gpu_busy.mjs")).href);

  /* ── 1) the reel suggester snaps every boundary to a word gap by the build's own rule ── */
  const RS = ["tools/reel_from_episode.mjs", "tools/join_seam_check.mjs"], RSL = "reel-suggest-unbuildable";
  // 12 s, a 180 Hz «word» per word over a −65 dB floor; «و5» runs straight into «و6» (5.6–6.8 one tone: the table puts a 0.1 s gap there, the audio has none)
  const W = (s, e) => `(between(t,${s},${e})*0.3*sin(2*PI*180*t)+gt(t,${e})*0.3*sin(2*PI*180*t)*exp(-(t-${e})/0.03))`;
  const EXPR = ["0.002*(random(0)-0.5)", W(0.3, 1.0), W(1.4, 2.0), W(2.4, 3.6), W(4.6, 5.2), W(5.6, 6.8), W(7.2, 8.0), W(8.4, 9.6), W(10.0, 10.8)].join("+");
  const WORDS = [["و1", 0.3, 1.0], ["و2", 1.4, 2.0], ["و3", 2.4, 3.6], ["و4", 4.6, 5.2], ["و5", 5.6, 5.95], ["و6", 6.05, 6.8], ["و7", 7.2, 8.0], ["و8", 8.4, 9.6], ["و9", 10.0, 10.8]].map(([w, s, e]) => ({ w, s, e }));
  let wav = null;
  const wavF = () => (wav ??= (async () => { const f = path.join(D, "reel_story.wav"); fs.mkdirSync(D, { recursive: true }); const x = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `aevalsrc='${EXPR}':s=48000:d=12`, "-ac", "1", f], { timeout: 30000 }); if (x.status !== 0) throw new Error("ffmpeg: " + x.err.slice(-120)); return f; })());
  const SEGS = [{ a: 0, b: 12, n: 0, type: "speech" }];
  add("reel.suggest_snaps_to_gap", RS, RSL, "قصة الريل: بداية جزء بين كلمتين بلا فراغ هادئ («و5» «و6») تُزاح إلى أقرب فراغ هادئ بين كلمتين، ويقبلها البناء بقاعدته نفسها بلا رفض", async () => {
    const { seamSafeRanges, snapReelRanges } = await SJ(), audio = await wavF();
    const ranges = [{ from: 0.2, to: 3.8 }, { from: 6.0, to: 11.0 }];
    const before = snapReelRanges({ ranges, parentSegs: SEGS, words: WORDS, audio });
    const r = seamSafeRanges({ ranges, parentSegs: SEGS, words: WORDS, audio, minDur: 3 });
    const after = snapReelRanges({ ranges: r.ranges, parentSegs: SEGS, words: WORDS, audio });
    const f = r.ranges[1]?.from;
    return expect(before.fails.length === 1 && before.bad[0]?.edge === "from" && !r.fails.length && !r.dropped.length && f > 5.2 && f < 5.6 && !after.fails.length && r.notes.length === 1 && /بين «و4» و«و5»/.test(r.notes[0]),
      `قبل: ${before.fails.length} رفض؛ بعد الضبط: البداية ${f?.toFixed(3)}، رفض البناء ${after.fails.length}، حذف ${r.dropped.join(",") || "—"} — ${r.notes.join(" | ").slice(0, 160)}`);
  });
  add("reel.suggest_drops_unfixable", RS, RSL, "قصة الريل: حدّ لا فراغ هادئ قربه (في المدى المسموح) ← يُحذف الجزء من القصة ويُقال، فلا تخرج قصة يرفضها البناء", async () => {
    const { seamSafeRanges } = await SJ(), audio = await wavF();
    const r = seamSafeRanges({ ranges: [{ from: 0.2, to: 3.8 }, { from: 6.0, to: 11.0 }], parentSegs: SEGS, words: WORDS, audio, reach: 0.3, minDur: 3 });
    return expect(r.ranges.length === 1 && r.dropped[0] === 1 && !r.fails.length && /الجزء 2 حُذف من القصة/.test(r.notes.join(" ")), `الأجزاء ${r.ranges.length}، المحذوف ${r.dropped.join(",") || "—"}، باقٍ مرفوض ${r.fails.length} — ${r.notes.join(" | ").slice(0, 160)}`);
  });
  add("reel.story_wired_src", RS, RSL, "المصدر: --story-only يضبط وصلات القصة (seamSafeRanges على صوت القص وكلمات ALL) قبل كتابتها، والبناء ما زال يقيسها بالقاعدة نفسها", async () => {
    const s = src("tools/reel_from_episode.mjs"), iSafe = s.indexOf("await seamSafeStory(); const iss = writeStory()"), fn = s.slice(s.indexOf("async function seamSafeStory"), iSafe);
    return expect(iSafe > 0 && /seamSafeRanges\(\{ ranges: storyRanges[\s\S]*parentSegs: segs, words: ALL/.test(fn) && /cut_audio\.wav/.test(fn) && s.indexOf("SEAMJ.snapReelRanges(") > iSafe, "ضبط القصة على الوصلات اختفى من --story-only أو تغيّرت مدخلاته");
  });

  /* ── 2) the GPU: never a silent wait, a hard limit on every GPU child, the warning at a montage start, the pause of a foreign long job ── */
  const GP = ["tools/lib/gpu_busy.mjs", "tools/prerender_check.mjs", "tools/montage_kickoff.mjs", "tools/rehearsal.mjs", "tools/montage_guard.mjs"], GPL = "prerender-gpu-silent-hang";
  const FAKE_APPS = [{ pid: 71216, name: "python.exe", path: "S:/AI_Tools/VoiceStudio_Runtime/python.exe", cmd: "python.exe train_voice.py --model quran", ageMin: 60, memG: 15 }];
  const fake = (name, st) => put(path.join(D, `${name}.gpu.json`), st);
  const busyF = () => fake("busy", { util: 99, memUsed: 19000, memTotal: 24576, apps: FAKE_APPS });
  const child = (code, env = {}, timeout = 30000) => runAsync(NODE, ["--input-type=module", "-e", code], { cwd: ROOT, env: { ...process.env, ...env }, timeout });
  const gbUrl = pathToFileURL(path.join(ROOT, "tools", "lib", "gpu_busy.mjs")).href;
  add("gpu.wait_busy_says_and_fails", GP, GPL, "الكرت مشغول: الانتظار يقول من يمسكه (الاسم والعملية) ويعدّ تنازلياً، ثم يفشل «الكرت مشغول: …» عند الحد — لا صمت", async () => {
    const x = await child(`const G = await import(${JSON.stringify(gbUrl)}); const r = await G.waitForGpu({ maxWaitS: 1.2, pollS: 0.4, label: "التفريغ الثاني" }); console.log("RESULT " + JSON.stringify(r.ok) + " " + r.why);`, { HK_GPU_FAKE: busyF() });
    const lines = x.out.split(/\r?\n/);
    return expect(/RESULT false الكرت مشغول: «python\.exe» \(العملية 71216/.test(x.out) && /⏳ الكرت مشغول بـ«python\.exe» \(العملية 71216[^\n]*تدريب نموذج صوت/.test(x.out) && lines.filter((l) => /بقي \d+:\d\d من الانتظار/.test(l)).length >= 1, `المخرج: ${x.out.trim().slice(0, 300)} ${x.err.slice(0, 120)}`);
  });
  add("gpu.wait_free_goes", GP, GPL, "الكرت متاح: لا انتظار ولا سطر", async () => {
    const x = await child(`const G = await import(${JSON.stringify(gbUrl)}); const t = Date.now(); const r = await G.waitForGpu({ maxWaitS: 5 }); console.log("RESULT " + r.ok + " " + (Date.now() - t));`, { HK_GPU_FAKE: fake("free", { util: 3, memUsed: 1000, memTotal: 24576, apps: [] }) });
    const m = x.out.match(/RESULT (\w+) (\d+)/);
    return expect(m && m[1] === "true" && +m[2] < 1500 && x.out.trim().split(/\r?\n/).length === 1, `المخرج: ${x.out.trim().slice(0, 200)}`);
  });
  add("gpu.child_timeout_kills", GP, GPL, "عملية للكرت تتجاوز حدّها ← تُقتل وتعود «الكرت مشغول: … لم تنتهِ» مع نبض أثناءها، لا تعليق", async () => {
    const x = await child(`const G = await import(${JSON.stringify(gbUrl)}); const r = await G.runTimed(process.execPath, ["-e", "setTimeout(()=>{}, 60000)"], { timeoutS: 1.5, beatS: 0.5, label: "عيّنة الارتجاف" }); console.log("RESULT " + r.timedOut + " " + r.why);`, { HK_GPU_FAKE: busyF() }, 40000);
    return expect(/RESULT true الكرت مشغول: عيّنة الارتجاف لم تنتهِ في 0:02 فأُوقفت — يمسكه «python\.exe»/.test(x.out) && /… عيّنة الارتجاف تعمل منذ/.test(x.out), `المخرج: ${x.out.trim().slice(-300)}`);
  });
  add("gpu.prerender_wired_src", GP, GPL, "المصدر: التفريغ الثاني وعيّنة الارتجاف ولقطات المواضع الخطرة في فحص ما قبل الرندر تنتظر الكرت بعدّ وتعمل بحدّ زمني (لا spawnSync صامت)", async () => {
    const s = src("tools/prerender_check.mjs"), fn = (n) => s.slice(s.indexOf(`async function ${n}(`), s.indexOf("\n}\n", s.indexOf(`async function ${n}(`)));
    const L = fn("listenTwin"), J = fn("probeTwin"), B = fn("blackTwin");
    return expect(/waitForGpu\(/.test(L) && /runTimed\(PY/.test(L) && /r\.timedOut/.test(L) && !/run\(PY/.test(L) && /waitForGpu\(/.test(J) && /runTimed\(process\.execPath, \["tools\/judder_probe\.mjs"/.test(J) && /runTimed\(process\.execPath, \["tools\/stills\.mjs"/.test(B), "توصيل الكرت في فحص ما قبل الرندر انكسر");
  });
  add("gpu.kickoff_warns_busy", GP, GPL, "أمر الإطلاق والكرت مشغول يقول في أوله «الكرت مشغول بـ… — المونتاج لن يكون في نصف ساعة» (تجربة بلا تشغيل، حالة كرت وهمية)", async () => {
    const x = await runAsync(NODE, [path.join(ROOT, "tools", "montage_kickoff.mjs"), "zz_selftest_gpu", "x.mp4", "--dry-run"], { cwd: ROOT, env: { ...process.env, KICKOFF_STUB: "1", HK_GPU_FAKE: busyF() }, timeout: 30000 });
    return expect(/⚠ الكرت مشغول بـ«python\.exe» \(العملية 71216[^\n]*— المونتاج لن يكون في نصف ساعة/.test(x.out) && !fs.existsSync(path.join(ROOT, ".tmp", "zz_selftest_gpu", "board.json")), `المخرج: ${(x.out + x.err).trim().split(/\r?\n/)[0]?.slice(0, 200)}`);
  });
  add("gpu.pausable_never_ours", GP, GPL, "ما يجوز إيقافه: عملية بايثون خارجية طويلة وحدها — لا تفريغنا ولا ComfyUI ولا الاستوديو ولا الرندر ولا عملية عمرها دقائق", async () => {
    const { pausable } = await GB();
    const apps = [...FAKE_APPS, { pid: 2, name: "python.exe", cmd: "python S:/AI_Tools/Remotion_Workspace/tools/transcribe_words.py a.wav", ageMin: 30, memG: 5 }, { pid: 3, name: "python.exe", cmd: "python S:/AI_Tools/ComfyUI_windows_portable/main.py", ageMin: 90, memG: 8 },
      { pid: 4, name: "node.exe", cmd: "node remotion studio", ageMin: 300, memG: 3 }, { pid: 5, name: "ffmpeg.exe", cmd: "ffmpeg -hwaccel cuda", ageMin: 20, memG: 1 }, { pid: 6, name: "python.exe", cmd: "python other_train.py", ageMin: 3, memG: 9 }];
    const got = pausable({ ok: true, util: 99, memUsed: 20000, memTotal: 24576, apps }).map((a) => a.pid);
    return expect(got.length === 1 && got[0] === 71216, `اختير للإيقاف: ${got.join("، ") || "—"}`);
  });
  /** a dummy job: a node loop writing a counter every 50 ms (the «training»); progress = the counter moves */
  const dummyJob = async (name) => {
    const cf = path.join(D, `${name}.count`), js = put(path.join(D, `${name}.js`), `const fs=require("fs");let n=0;setInterval(()=>{n++;fs.writeFileSync(${JSON.stringify(cf)},String(n))},50);setTimeout(()=>process.exit(0),45000);`);
    const { spawn } = await import("node:child_process"), c = spawn(NODE, [js], { stdio: "ignore", windowsHide: true });
    for (let i = 0; i < 40 && !fs.existsSync(cf); i++) await sleep(100);
    const read = () => { try { return fs.readFileSync(cf, "utf8"); } catch { return ""; } };
    const moving = async (ms = 700) => { const a = read(); await sleep(ms); return read() !== a; };
    return { c, moving, kill: () => { try { c.kill(); } catch { /* gone */ } } };
  };
  add("gpu.pause_resume_dummy", GP, GPL, "إيقاف مؤقت لعملية وهمية تمسك الكرت: تتوقف (العدّاد لا يتحرك) ويُكتب السجل وسطر اللوحة، ثم تُستأنف فيتحرك — ولا تُقتل", async () => {
    const G = await GB(), j = await dummyJob("pause"), file = path.join(D, "pause_gpu_paused.json"), root = path.join(D, "pause_root");
    put(path.join(root, ".tmp", "zzgp", "board.json"), { project: "zzgp", lanes: [], createdAt: Date.now() });
    try {
      const st = { ok: true, util: 99, memUsed: 20000, memTotal: 24576, apps: [{ pid: j.c.pid, name: "python.exe", cmd: "python train_voice.py", ageMin: 60, memG: 12 }] };
      const movingBefore = await j.moving();
      const p = G.pauseForMontage({ by: "zzgp", state: st, file, watchdog: false, root });
      await sleep(400); const frozen = !(await j.moving(1000)), rec = JSON.parse(fs.readFileSync(file, "utf8")), b1 = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "zzgp", "board.json"), "utf8")).gpu ?? "";
      const r = G.resumePaused({ by: "zzgp", reason: "اختبار", file, root }); await sleep(300);
      const movingAfter = await j.moving(), b2 = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "zzgp", "board.json"), "utf8")).gpu ?? "";
      return expect(movingBefore && p.paused.length === 1 && frozen && rec.paused[0]?.pid === j.c.pid && rec.paused[0]?.by === "zzgp" && /^⏸ أوقفتُ مؤقتاً/.test(b1) && r.resumed.length === 1 && movingAfter && !fs.existsSync(file) && /^▶ استُؤنف/.test(b2),
        `قبل يتحرك=${movingBefore} أُوقف=${p.paused.length} متوقف=${frozen} استؤنف=${r.resumed.length} يتحرك بعد=${movingAfter} السجل باقٍ=${fs.existsSync(file)} اللوحة: ${b1.slice(0, 40)} / ${b2.slice(0, 40)}`);
    } finally { G.resumePid(j.c.pid); j.kill(); }
  });
  add("gpu.watchdog_resumes", GP, GPL, "الحارس المنفصل يستأنف العملية الموقوفة عند حدّها الأقصى بلا أمر (حد وهمي 1.5ث)", async () => {
    const G = await GB(), j = await dummyJob("watch"), file = path.join(D, "watch_gpu_paused.json");
    try {
      const st = { ok: true, util: 99, memUsed: 20000, memTotal: 24576, apps: [{ pid: j.c.pid, name: "python.exe", cmd: "python train_voice.py", ageMin: 60, memG: 12 }] };
      const p = G.pauseForMontage({ by: "zzgw", state: st, file, maxMin: 0.025, root: path.join(D, "watch_root") });
      await sleep(300); const frozen = !(await j.moving(600));
      let back = false; for (let i = 0; i < 40 && !back; i++) { await sleep(250); back = !fs.existsSync(file) && (await j.moving(300)); }
      return expect(p.paused.length === 1 && frozen && back, `أُوقف=${p.paused.length} متوقف=${frozen} استأنفه الحارس=${back}`);
    } finally { G.resumePid(j.c.pid); j.kill(); }
  });
  add("gpu.resume_wired_src", GP, GPL, "المصدر: الاستئناف موصول بنهاية الرندر النهائي وبإنهاء المونتاج وبنهاية التجربة الشاملة، والإيقاف ببدء المونتاج والتجربة", async () => {
    const k = src("tools/montage_kickoff.mjs"), g = src("tools/montage_guard.mjs"), rh = src("tools/rehearsal.mjs"), rj = src("tools/render_job.sh"), rp = src("tools/gpu/render_project.sh");
    return expect(/pauseForMontage\(\{ by: p/.test(k) && /resumePaused\(\{ by: project/.test(g.slice(g.indexOf('cmd === "end"'))) && /pauseForMontage\(\{ by: P/.test(rh) && /resumePaused\(\{ by: P/.test(rh) && /gpu_busy\.mjs resume/.test(rj) && /gpu_busy\.mjs resume/.test(rp), "حلقة إيقاف/استئناف ناقصة");
  });

  /* ── 3) the montage's typecheck judges only the files its compositions import ── */
  const TC = ["tools/project_typecheck.mjs", "tools/stage.mjs"], TCL = "shared-typecheck-foreign-file";
  const tcRoot = () => { const r = path.join(D, "tc_root");
    put(path.join(r, "data", "specs", "zztc.json"), { id: "zztc" });
    put(path.join(r, "src", "SpecComps.tsx"), `import { MontageFromSpec } from "./MontageSpec";\nexport const X = MontageFromSpec;\n`);
    put(path.join(r, "src", "MontageSpec.tsx"), `import type { K } from "./kit/Kit";\nexport { Y } from "./kit/Y";\nexport const MontageFromSpec = 1;\n`);
    put(path.join(r, "src", "kit", "Kit.ts"), "export type K = 1;\n"); put(path.join(r, "src", "kit", "Y.tsx"), "export const Y = 2;\n");
    put(path.join(r, "src", "ext", "KeyArt2.tsx"), "export const Broken = 1;\n"); put(path.join(r, "src", "Root.tsx"), `import "./ext/KeyArt2";\nimport "./SpecComps";\n`);
    return r; };
  const tc = async (name, lines) => { const r = tcRoot(), f = put(path.join(D, `${name}.tsc.txt`), lines.join("\n")); return runAsync(NODE, [path.join(ROOT, "tools", "project_typecheck.mjs"), "zztc", "--root", r, "--tsc-output", f], { cwd: ROOT, timeout: 20000 }); };
  add("typecheck.foreign_file_is_note", TC, TCL, "خطأ أنواع في ملف جلسة أخرى لا تستورده تركيبات المشروع ← ملاحظة باسمه ومكانه، والفحص ينجح", async () => {
    const x = await tc("foreign", ["src/ext/KeyArt2.tsx(436,9): error TS2322: Type 'ReactNode | Promise<ReactNode>' is not assignable to type 'ReactNode'."]);
    return expect(x.status === 0 && /⚠ ملاحظة لا فشل: 1 خطأ[^\n]*src\/ext\/KeyArt2\.tsx\(436,9\) TS2322/.test(x.out) && /✔ typecheck \(zztc\)/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 240)}`);
  });
  add("typecheck.own_file_fails", TC, TCL, "خطأ في ملف تستورده تركيبات المشروع (عبر import type و export from) ← ✘ يفشل الفحص، ومعه ملاحظة ملف الجلسة الأخرى", async () => {
    const x = await tc("own", ["src/kit/Kit.ts(1,1): error TS2304: Cannot find name 'q'.", "src/ext/KeyArt2.tsx(2,2): error TS1005: ';' expected."]);
    return expect(x.status === 1 && /✘ typecheck \(zztc\): 1 خطأ في ملفات تستوردها تركيبات المشروع/.test(x.out) && /src\/kit\/Kit\.ts\(1,1\): error TS2304/.test(x.out) && /خطأ صياغة قد يكسر حزمة الاستوديو/.test(x.out), `خروج ${x.status}: ${x.out.trim().slice(0, 240)}`);
  });
  add("typecheck.stage_wired_src", TC, TCL, "المصدر: فحص المرحلة يشغّل فحص أنواع المشروع لا tsc على المجلد كله", async () => {
    const s = src("tools/stage.mjs");
    return expect(/step\("typecheck", "node", \["tools\/project_typecheck\.mjs", p, "--comp", comp\]/.test(s) && !/step\("typecheck", "node", \["node_modules\/typescript\/bin\/tsc"/.test(s), "فحص المرحلة عاد إلى tsc الكامل");
  });

  /* ── 4) the builder: a sacred text is a text card, never an image; a missing picture takes the next valid element without one ── */
  const MB = ["tools/montage_build.mjs", "tools/coverage_check.mjs"], MBL = "builder-mention-image-missing";
  const DB = path.join(D, "mb"), pName = (n) => path.relative(path.join(ROOT, ".tmp"), path.join(DB, n)).split(path.sep).join("/");
  /* the speech of d_builder.mjs + a closing mention of the Quran (the note card takes the end, so the speech runs on for the subscribe reminder) */
  const SPEECH = "بسم الله والحمد لله. اليوم نتكلم عن الصبر في البيت. لماذا يغضب الإنسان من أولاده؟ انتبه يا أخي من الغضب الشديد. " +
    "الغضب نار تحرق صاحبها قبل غيره. والصبر مفتاح كل خير في البيت. من صبر على أولاده نال الأجر العظيم. وقد صبر عليهم 150 ألف أب. " +
    "الصبر جذر والأجر ثمرته الطيبة. والبيت الهادئ يربي أولادا هادئين. والسلام عليكم ورحمة الله وبركاته. وفي القرآن الكريم شفاء لما في الصدور. ونسأل الله أن يرزقنا الصبر الجميل.";
  const words = (text, t0) => text.split(" ").map((w, i) => ({ w, s: +(t0 + i * 0.45).toFixed(2), e: +(t0 + i * 0.45 + 0.4).toFixed(2) }));
  const project = (n, req = []) => {
    const p = pName(n), T = path.join(DB, n), Wd = words(SPEECH, 0.3), dur = Math.ceil(Wd.at(-1).e + 3.6);
    put(path.join(T, "cut_words.json"), Wd); put(path.join(T, "drift_fresh.json"), Wd);
    put(path.join(T, "sections.json"), [{ title: "الصبر في البيت", at: 0 }, { title: "لماذا يغضب الإنسان", at: 6 }, { title: "الغضب نار", at: 13 }, { title: "الأجر العظيم", at: 19 }]);
    const rq = put(path.join(T, "requirements.json"), req); const later = new Date(Date.now() + 5000); fs.utimesSync(rq, later, later);
    const base = put(path.join(DB, `${n}.base.json`), JSON.stringify({ id: p, title: "اختبار الباني", fps: 30, frames: dur * 30, cut: "anchor-kills-children_cut_s.mp4", galleryRef: true, brand: "steel", date: "2026-11-21", showTitleBar: true,
      zooms: [{ from: 10, to: 12 }], shake: [], bumper: { position: "none" }, items: [{ t: "nameTag", at: 12, dur: 3 }] }, null, 1));
    const picks = put(path.join(DB, `${n}.picks.json`), { moments: { cover: { vals: { src: "anchor-kills-children/cover_gpt.png" } } }, metaphors: [], extra: [] });
    return { p, base, picks, out: path.join(DB, `${n}.out.json`) };
  };
  const mbTool = path.join(ROOT, "tools", "montage_build.mjs");
  const quranAt = words(SPEECH, 0.3).find((w) => w.w === "القرآن").s;
  add("mb.sacred_mention_default_text", MB, MBL, "قالب الاختيارات: «القرآن» المذكور افتراضه بطاقة كتابة (NoteCard) لا صورة، ولا يطلب صورة", async () => {
    const x = project("tplq"), f = path.join(DB, "tplq.template.json");
    const r = await runAsync(NODE, [mbTool, x.p, "--base", x.base, "--picks-template", "--out", f], { cwd: ROOT, timeout: 90000 });
    let t = {}; try { t = JSON.parse(fs.readFileSync(f, "utf8")); } catch { /* none */ }
    const m = t.moments?.["mention:القرآن"];
    return expect(r.status === 0 && m?._default?.el === "NoteCard" && !m._media, `خروج ${r.status}؛ اللحظة: ${JSON.stringify(m ?? null).slice(0, 200)}`);
  });
  add("mb.sacred_mention_builds", MB, MBL, "البناء الكامل وفيه «القرآن»: لا فشل لصورة ناقصة، بطاقة كتابة بكلماته عند ذكره ولا صورة هناك، وفحص التغطية يقبلها (20–40 ث)", async () => {
    const x = project("buildq"), r = await runAsync(NODE, [mbTool, x.p, "--base", x.base, "--picks", x.picks, "--out", x.out, "--no-mattes"], { cwd: ROOT, timeout: 300000 });
    let s = null; try { s = JSON.parse(fs.readFileSync(x.out, "utf8")); } catch { /* none */ }
    const card = (s?.items ?? []).find((i) => i.t === "note" && i.at <= quranAt + 0.05 && i.until >= quranAt), pic = (s?.items ?? []).find((i) => ["pic", "tphoto", "scholar", "full", "flash"].includes(i.t) && i.at <= quranAt + 4 && (i.until ?? i.at + 3) >= quranAt - 3);
    return expect(r.status === 0 && !/mention:القرآن/.test(r.out.split("ينقص البناءَ")[1] ?? "") && card && /القرآن/.test(card.title ?? "") && !pic && !/مذكور بلا صورة/.test(r.out),
      r.status !== 0 ? `خروج ${r.status}: ${(r.out + r.err).split(/\r?\n/).filter((l) => /✘|BUG|القرآن/.test(l)).slice(0, 4).join(" | ").slice(0, 300)}` : `البطاقة: ${JSON.stringify(card ?? null).slice(0, 140)}؛ صورة هناك: ${pic?.t ?? "لا"}`);
  });
  add("mb.picture_only_row_still_named", MB, MBL, "صف لا يقبل إلا صورة (pic/tphoto/scholar) يبقى وسيطاً ناقصاً مسمّى — البديل بلا صورة لا يُستعمل حيث لا يصحّ", async () => {
    const s = src("tools/montage_build.mjs");
    return expect(/if \(m\.kind !== "order" && \(m\.needTypes \?\? \[\]\)\.some\(\(x\) => \(NOIMG\.textTypes \?\? \[\]\)\.includes\(x\) \|\| x === "\*"\)\) return \{ el: "NoteCard"/.test(s) && /if \(m\.kind === "mention" && NOIMG_T\.has\(m\.text\)\) return \{ el: "NoteCard"/.test(s), "قاعدة البديل بلا صورة تغيّرت");
  });
};
