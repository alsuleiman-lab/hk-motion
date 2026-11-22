// THE INDEPENDENT REVIEW OF THE CONDUCTOR (user approved the fixes in chat 2026-11-22): tools/conduct.mjs + tools/lib/conduct_core.mjs + data/pipelines/stream.json + the stop hook's bash launch.
// Every case is CPU-only and runs on FAKE projects in a scratch root under .tmp/selftest/ (a copy of the conductor and the core; the real stream_1122 state is never opened).
// HK_SELFTEST_SRC=<dir holding an older copy of tools/… and data/pipelines/stream.json> runs the SAME cases against that copy (to prove each case fails without its fix).
export default async (api) => {
  const { add, expect, put, runAsync, livePid, RUN, ROOT, NODE, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const SRC = process.env.HK_SELFTEST_SRC ? path.resolve(process.env.HK_SELFTEST_SRC) : ROOT;
  const CC = "tools/lib/conduct_core.mjs", CD = "tools/conduct.mjs", BR = "tools/lib/bash_runtime.mjs", G = "tools/hooks/guard.mjs", SJ = "data/pipelines/stream.json";
  const FILES = [CD, CC, SJ], L = "conductor-review-2026-11-22";
  const src = (rel) => { const a = path.join(SRC, rel); return fs.existsSync(a) ? a : path.join(ROOT, rel); };
  const cp = (r, rel) => { fs.mkdirSync(path.dirname(path.join(r, rel)), { recursive: true }); fs.copyFileSync(src(rel), path.join(r, rel)); };
  const imp = (rel) => import(pathToFileURL(src(rel)).href + `?t=${Date.now()}_${Math.random()}`);
  const dir = (name) => { const r = path.join(RUN, name); fs.mkdirSync(r, { recursive: true }); return r; };
  const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
  const wins = process.platform === "win32";
  const P = "zz_cr_p";

  /** a scratch workspace holding a copy of the conductor, the core and the Git resolver, one fake definition and one run state */
  const cRoot = (name, steps, stepStates, { clips = [], extraDef = {} } = {}) => {
    const r = dir(name);
    for (const rel of [CD, CC, BR]) cp(r, rel);
    put(path.join(r, "data", "pipelines", "kinds.json"), { kinds: {} });
    put(path.join(r, "tools", "g.mjs"), "// the guarded tool the lint looks for\n");
    put(path.join(r, "data", "pipelines", "zz.json"), { kind: "zz", ar: "وهمي", totalMin: 60, guarded: [{ tool: "tools/g.mjs" }], steps, ...extraDef });
    put(path.join(r, ".tmp", P, "conduct.json"), { kind: "zz", project: P, defPath: "data/pipelines/zz.json", t0: Date.now() - 60000, args: {}, clips: [], active: true, steps: stepStates });
    if (clips.length) put(path.join(r, ".tmp", P, "clip_table.json"), clips.map((id) => ({ id, dur: 90 })));
    return r;
  };
  const cd = (r, args, env = {}) => runAsync(NODE, ["tools/conduct.mjs", ...args], { cwd: r, env: { ...process.env, ...env }, timeout: 60000 });
  const stateOf = (r) => readJson(path.join(r, ".tmp", P, "conduct.json"));
  const rootOf = (r) => ({ root: r, p: P });

  /* ───────────── 1. the build precondition reads the clip's real source ───────────── */
  add("conductor_review.build_precondition_uses_prep_config_source", FILES, L, "شرط بناء المقطع في stream.json يقرأ مصدر المقطع الفعلي من prep_config (المقطع ثم البث ثم public/<p>_src.mp4) لا المسار الثابت", async () => {
    const C = await imp(CC), def = readJson(src(SJ)), build = def.steps.find((s) => s.id === "build"), r = dir("cr_src"), c = "zz_cr_c1";
    const orig = path.join(r, "orig", "rec.mp4"), st = { project: P, args: {}, steps: { slice: { status: "done" }, titles: { status: "done" } } };
    put(path.join(r, ".tmp", P, "clip_table.json"), [{ id: c, dur: 90 }]);
    const ready = () => C.itemDepsReady(def, st, build, c, r);
    put(orig, "x"); put(path.join(r, ".tmp", c, "prep_config.json"), { source: orig });
    const a = ready();                                                   // the clip's own source, an absolute path outside public/, exists → ready (no public/<p>_src.mp4 here)
    fs.rmSync(orig);
    const b = ready();                                                   // the original is gone → not ready
    fs.rmSync(path.join(r, ".tmp", c, "prep_config.json"));
    put(orig, "x"); put(path.join(r, ".tmp", P, "prep_config.json"), { source: orig });
    const d = ready();                                                   // no clip config: the parent's source
    fs.rmSync(orig); fs.rmSync(path.join(r, ".tmp", P, "prep_config.json"));
    const e = ready();                                                   // no config, no public file → not ready
    put(path.join(r, "public", `${P}_src.mp4`), "x");
    const f = ready();                                                   // the old default location still counts when nothing names a source
    const filled = C.fill("{src}", { ...rootOf(r), c, args: {} });
    return expect(a === true && b === false && d === true && e === false && f === true && /{src}/.test(JSON.stringify(build.requiresFiles)),
      `مصدر المقطع=${a} بعد الحذف=${b} مصدر البث=${d} بلا شيء=${e} الافتراضي=${f} requiresFiles=${JSON.stringify(build.requiresFiles)} fill=${filled}`);
  });

  /* ───────────── 2. a clip whose audio gate failed does not continue ───────────── */
  add("conductor_review.audio_gate_proof_in_continue_lists", FILES, L, "قوائم continueAfter في stream.json تتضمن دليل بوابة الصوت: مقطع فشلت بوابة صوته لا يتابع إلى كشف الأحاديث ولا الصور ولا البناء", async () => {
    const C = await imp(CC), def = readJson(src(SJ)), by = (id) => def.steps.find((s) => s.id === id), r = dir("cr_audio"), c = "zz_cr_c1", orig = path.join(r, "orig.mp4");
    put(orig, "x"); put(path.join(r, ".tmp", P, "prep_config.json"), { source: orig }); put(path.join(r, "public", `${P}_src.mp4`), "x");   // the source precondition passes in both the old and the new definition
    put(path.join(r, ".tmp", P, "clip_table.json"), [{ id: c, dur: 90 }]);
    for (const f of [`public/${c}_map.json`, `.tmp/${c}/lazy_clip.json`, `.tmp/${c}/cut_words.json`, `.tmp/${c}/requirements.json`]) put(path.join(r, f), "{}");
    const st = { project: P, args: {}, steps: { slice: { status: "partial", items: { [c]: { status: "failed", why: "بوابة الصوت فشلت" } } }, titles: { status: "done" } } };
    const probe = () => ({ build: C.itemDepsReady(def, st, by("build"), c, r), scan: C.itemDepsReady(def, st, by("hadith_scan"), c, r), pic: C.depsReady(r, def, st, by("pictures_in")) });
    const without = probe();
    put(path.join(r, ".tmp", "gates", `${c}.audio.ok`), "{}");
    const withProof = probe();
    return expect(!without.build && !without.scan && !without.pic && withProof.build && withProof.scan && withProof.pic, `بلا دليل الصوت: ${JSON.stringify(without)} ومعه: ${JSON.stringify(withProof)}`);
  });

  /* ───────────── 3. recheck needs proof ───────────── */
  const DEAD = "مات المشغّل بلا نتيجة";
  const recheckCase = async (name, steps, stepStates, id, files = []) => {
    const r = cRoot(name, steps, stepStates, { clips: ["zz_cr_c1", "zz_cr_c2"] });
    for (const f of files) put(path.join(r, f), "x");
    const out = await cd(r, ["recheck", id, P]), s = stateOf(r).steps[id];
    return { out: out.out + out.err, status: out.status, step: s };
  };
  add("conductor_review.recheck_refuses_step_without_gate", FILES, L, "recheck: خطوة تلقائية بلا بوابة ماتت (لا بوابة = لا دليل) تبقى فاشلة ولا تُغلق «تمّت» بلا برهان", async () => {
    const steps = [{ id: "slots", ar: "مساحات", type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/g.mjs"] }];
    const x = await recheckCase("cr_rc_nogate", steps, { slots: { status: "failed", why: DEAD, exit: null } }, "slots");
    return expect(x.status === 1 && x.step.status === "failed" && /بلا بوابة/.test(x.out), `خرج=${x.status} حالة=${x.step?.status} نص=${x.out.slice(0, 120)}`);
  });
  add("conductor_review.recheck_per_clip_needs_every_item", FILES, L, "recheck: خطوة لكل مقطع لا تُغلق إلا إذا تمّ كل عنصر وبوابتها ناجحة؛ وإن تمّت كلها أُغلقت (الضابط الإيجابي)", async () => {
    const steps = [{ id: "hadith_scan", ar: "أحاديث", type: "auto", foreach: "clips", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/g.mjs"], gate: [{ type: "files", paths: [".tmp/{c}/hadith.json"] }] }];
    const files = [".tmp/zz_cr_c1/hadith.json", ".tmp/zz_cr_c2/hadith.json"];
    const part = await recheckCase("cr_rc_part", steps, { hadith_scan: { status: "failed", why: DEAD, exit: null, items: { zz_cr_c1: { status: "done" }, zz_cr_c2: { status: "pending" } } } }, "hadith_scan", files);
    const none = await recheckCase("cr_rc_noitems", steps, { hadith_scan: { status: "failed", why: DEAD, exit: null } }, "hadith_scan", files);
    const all = await recheckCase("cr_rc_all", steps, { hadith_scan: { status: "failed", why: DEAD, exit: null, items: { zz_cr_c1: { status: "done" }, zz_cr_c2: { status: "done" } } } }, "hadith_scan", files);
    const plain = await recheckCase("cr_rc_plain", [{ id: "cut", ar: "قص", type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/g.mjs"], gate: [{ type: "files", paths: [".tmp/{p}/cut.wav"] }] }], { cut: { status: "failed", why: DEAD, exit: null } }, "cut", [`.tmp/${P}/cut.wav`]);
    return expect(part.status === 1 && part.step.status === "failed" && none.status === 1 && none.step.status === "failed" && all.status === 0 && all.step.status === "done" && plain.status === 0 && plain.step.status === "done",
      `جزئي=${part.status}/${part.step?.status} بلا عناصر=${none.status}/${none.step?.status} كلها=${all.status}/${all.step?.status} بوابة عادية=${plain.status}/${plain.step?.status}`);
  });

  /* ───────────── 4. a stale snapshot never erases a runner's newer result ───────────── */
  const raceRoot = (name) => {
    const writer = `import * as C from "./lib/conduct_core.mjs"; C.editState(C.ROOT, "${P}", (st) => { st.steps.slice.items.zz_cr_c1 = { status: "done" }; });\n`;
    const steps = [{ id: "slice", ar: "تقسيم", type: "auto", foreach: "clips", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/g.mjs"], gate: [{ type: "cmd", cmd: [NODE, "tools/race_writer.mjs"] }] }];
    const r = cRoot(name, steps, { slice: { status: "running", exit: 0, pid: null, startedAt: Date.now() - 5000, items: { zz_cr_c1: { status: "pending" }, zz_cr_c2: { status: "done" } } } }, { clips: ["zz_cr_c1", "zz_cr_c2"] });
    put(path.join(r, "tools", "race_writer.mjs"), writer);   // the «runner»: writes an item result while the reconcile's gate is being evaluated
    return r;
  };
  add("conductor_review.status_does_not_erase_runner_item", FILES, L, "status/next: لقطة قديمة تصل بعد كتابة المشغّل لا تمحو نتيجة عنصره (كتابة ما تغيّر فقط داخل القفل)", async () => {
    const r = raceRoot("cr_race_cli"), out = await cd(r, ["status", P]), s = stateOf(r).steps.slice;
    return expect(s.items?.zz_cr_c1?.status === "done" && s.items?.zz_cr_c2?.status === "done" && s.status === "done", `خرج=${out.status} المقطع الأول=${s.items?.zz_cr_c1?.status} الثاني=${s.items?.zz_cr_c2?.status} الخطوة=${s.status} ${out.err.slice(0, 100)}`);
  });
  add("conductor_review.hook_reconcile_does_not_erase_runner_item", FILES, L, "الهوك (activeRun): نفس السباق، لقطة قديمة لا تمحو نتيجة عنصر كتبها المشغّل أثناء المطابقة", async () => {
    const r = raceRoot("cr_race_hook"), C = await import(pathToFileURL(path.join(r, CC)).href + `?t=${Date.now()}`);
    put(path.join(r, ".tmp", "conduct_active.json"), { project: P, kind: "zz", session: null, at: Date.now() });
    await C.activeRun(r, "me", { cheap: false });
    const s = stateOf(r).steps.slice;
    return expect(s.items?.zz_cr_c1?.status === "done" && s.status === "done", `المقطع الأول=${s.items?.zz_cr_c1?.status} الخطوة=${s.status}`);
  });
  add("conductor_review.stale_snapshot_skips_a_step_the_runner_moved", FILES, L, "المطابقة: خطوة تقدّم مشغّلها (خرجه كُتب) بعد اللقطة لا تُكتب فوقها «مات المشغّل» من لقطة قديمة", async () => {
    const C = await imp(CC);
    if (typeof C.reconcileAndSave !== "function") return { ok: false, why: "لا reconcileAndSave: الكتابة تستبدل الخطوات كلها بلقطة قديمة" };
    const dead = (await import("node:child_process")).spawnSync(NODE, ["-e", ""], { windowsHide: true }).pid;
    const steps = [{ id: "cut", ar: "قص", type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/g.mjs"], gate: [{ type: "files", paths: [".tmp/{p}/cut.wav"] }] }];
    const r = cRoot("cr_race_moved", steps, { cut: { status: "running", exit: null, pid: dead, startedAt: 111 } });
    const def = readJson(path.join(r, "data", "pipelines", "zz.json")), snap = readJson(path.join(r, ".tmp", P, "conduct.json"));
    // the runner finishes AFTER the snapshot was read (exit 0, its own gate not yet judged), then the stale reconcile (which saw a dead pid) tries to save
    C.editState(r, P, (x) => { x.steps.cut.exit = 0; x.steps.cut.pid = null; });
    await C.reconcileAndSave(r, P, def, snap, { cheap: false });
    const s = stateOf(r).steps.cut;
    return expect(s.status === "running" && s.exit === 0, `حالة=${s.status} خرج=${s.exit} سبب=${s.why ?? ""}`);
  });

  /* ───────────── 5. the real error is recorded ───────────── */
  add("conductor_review.failure_reason_is_the_real_error_with_exit_code", FILES, L, "سبب فشل الأمر المسجَّل هو سطر الخطأ الحقيقي (✘ / Error / ENOENT، وإلا آخر سطر خطأ قياسي) مع رمز الخروج، لا آخر سطر ناتج", async () => {
    const mk = (id, tool) => ({ id, ar: id, type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd: [NODE, tool] });
    const r = cRoot("cr_reason", [mk("a", "tools/fail_a.mjs"), mk("b", "tools/fail_b.mjs")], {});
    put(path.join(r, "tools", "fail_a.mjs"), `console.log("✘ ENOENT: لا ملف المصدر C:/x/rec.mp4"); console.log("لن تُعتمد مواصفة بلا مصدر"); process.exit(3);\n`);
    put(path.join(r, "tools", "fail_b.mjs"), `console.error("خطأ قياسي حقيقي: فشل التفريغ"); console.log("تنظيف الملفات المؤقتة انتهى"); process.exit(2);\n`);
    await cd(r, ["_run", P, "a"]); await cd(r, ["_run", P, "b"]);
    const a = stateOf(r).steps.a, b = stateOf(r).steps.b;
    return expect(/ENOENT: لا ملف المصدر/.test(a.why) && !/لن تُعتمد/.test(a.why) && /\(رمز 3\)/.test(a.why) && /خطأ قياسي حقيقي/.test(b.why) && /\(رمز 2\)/.test(b.why),
      `أ=${a.why} ب=${b.why}`);
  });

  /* ───────────── 6. Git absent never fails lint ───────────── */
  add("conductor_review.lint_survives_missing_git", FILES, L, "lint لا يفشل حين يغيب Git Bash أو يكون HK_GIT_BASH خاطئاً (الحلّ كسول عند إطلاق أمر فقط)", async () => {
    if (!wins) return { ok: true };
    const steps = [{ id: "ask", ar: "سؤال", type: "creative", skill: "اختبار", deps: [], budgetMin: null, creative: { what: "اكتب" }, gate: [{ type: "evidence" }] }];
    const r = cRoot("cr_nogit", steps, {}), bad = { HK_GIT_BASH: "Z:\\nowhere\\Git\\bin\\bash.exe" };
    const lint = await cd(r, ["lint", "--file", "data/pipelines/zz.json"], bad);
    return expect(lint.status === 0 && /✔/.test(lint.out), `lint خرج=${lint.status} ${(lint.out + lint.err).slice(0, 160)}`);
  });
  add("conductor_review.bash_step_fails_clearly_without_git", FILES, L, "خطوة تحتاج bash حين يغيب Git تفشل برسالة Git الواضحة (لا انهيار صامت) ولا تمنع خطوة لا تحتاجه", async () => {
    if (!wins) return { ok: true };
    const mk = (id, cmd) => ({ id, ar: id, type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd });
    const r = cRoot("cr_nogit_run", [mk("sh", ["bash", "tools/x.sh"]), mk("nd", [NODE, "tools/ok.mjs"])], {}), bad = { HK_GIT_BASH: "Z:\\nowhere\\Git\\bin\\bash.exe" };
    put(path.join(r, "tools", "ok.mjs"), "console.log('fine');\n");
    await cd(r, ["_run", P, "sh"], bad); await cd(r, ["_run", P, "nd"], bad);
    const s = stateOf(r).steps;
    return expect(s.sh.status === "failed" && /HK_GIT_BASH/.test(s.sh.why ?? "") && s.nd.status === "done" && s.nd.exit === 0, `bash=${s.sh?.status}/${(s.sh?.why ?? "").slice(0, 80)} غير bash=${s.nd?.status}`);
  });

  /* ───────────── 7. the stop hook never throws on a bash launch failure ───────────── */
  add("conductor_review.stop_hook_bash_launch_failure_is_logged", [G], L, "هوك الإيقاف: فشل إطلاق مراقب السبات (bash لا يُشغَّل) يُسجَّل في sleep_hook.log ولا يُسقط الهوك", async () => {
    if (!wins) return { ok: true };
    const r = dir("cr_stop_bash"), fakeBash = path.join(r, "fake", "bash.exe"), empty = path.join(r, "empty");
    for (const rel of [G, "tools/lib/inbox_watch.mjs", BR]) cp(r, rel);
    put(fakeBash, "not an executable"); fs.mkdirSync(empty, { recursive: true });
    // keep_awake: the 90 s hibernate branch can never be reached here, even if the fake worker pid were judged dead
    put(path.join(r, ".tmp", "last_clean.txt"), String(Date.now())); put(path.join(r, ".tmp", "user_sleeping"), "1"); put(path.join(r, ".tmp", "keep_awake"), new Date(Date.now() + 3600e3).toISOString()); put(path.join(r, "data", "render_queue", "worker.pid"), String(livePid()));
    const env = { ...process.env, HK_GIT_BASH: fakeBash }; for (const k of Object.keys(env)) if (k.toLowerCase() === "path") delete env[k]; env.Path = empty;   // a bare `bash` cannot be found either
    put(path.join(r, "transcript.jsonl"), JSON.stringify({ type: "user", message: { content: "س" } }) + "\n" + JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "تمّ." }] } }) + "\n");
    const x = await runAsync(NODE, [path.join(r, G), "stop"], { cwd: r, env, input: JSON.stringify({ session_id: "me", transcript_path: path.join(r, "transcript.jsonl") }) });
    let log = ""; try { log = fs.readFileSync(path.join(r, ".tmp", "sleep_hook.log"), "utf8"); } catch { /* none */ }
    return expect(x.status === 0 && !/Unhandled 'error' event/.test(x.err) && /failed to launch/.test(log), `خرج=${x.status} خطأ=${x.err.slice(0, 120)} سجل=${log.slice(0, 120)}`);
  });
};
