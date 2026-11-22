// THE CONDUCTOR'S CASES (user 2026-11-22: «هذه هي مشكلتي الكبيرة معك، أنك ما تلتزم. كيف بدي ألزمك ما أعرف… أنا بدي كيف أنت تلتزم بالخطة الموجودة عندنا، دائماً تبقى ملتزم»;
// ledger plan-from-memory). tools/conduct.mjs + tools/lib/conduct_core.mjs + data/pipelines/*.json + the hook (tools/hooks/guard.mjs) on FAKE projects only (zz_conduct_*):
// every case lives in its own scratch root under .tmp/selftest/ (a copy of the hook, the core, the kinds registry and a fake definition), so no real run, no real stream and no
// real .tmp/<project> is touched; the real definitions are only read (lint, plan).
export default async (api) => {
  const { add, expect, put, mkRoot, runAsync, hook, transcript, RUN, ROOT, NODE, path, fs } = api;
  const G = "tools/hooks/guard.mjs", CC = "tools/lib/conduct_core.mjs", CD = "tools/conduct.mjs", F = [G, CC, CD, "data/pipelines/stream.json", "data/pipelines/episode.json"], L = "plan-from-memory";
  const P = "zz_conduct_t";

  /** the fake pipeline of the hook cases: prep ✔ orders ✔ → cut (current, alone) · cover_build (parallel, a command) · slice → checks → queue */
  const FAKE = {
    kind: "fake", ar: "إجراء وهمي", totalMin: 120,
    guarded: [{ tool: "tools/stage.mjs", subs: ["prep", "cut", "check"] }, { tool: "tools/stream/fast_run.mjs", subs: ["start", "slice", "checks", "queue"] }, { tool: "tools/stream/clip_autobuild.mjs" }, { tool: "tools/render_queue.mjs", subs: ["add", "run"] }, { tool: "tools/prerender_check.mjs" }, { tool: "tools/final_review.mjs" }, { tool: "tools/stream/clip_cut_all.mjs" }],
    perClip: [],
    steps: [
      { id: "prep", ar: "التجهيز", type: "auto", skill: "اختبار", deps: [], budgetMin: 12, cmd: ["node", "tools/stage.mjs", "prep", "{p}", "v.mp4"] },
      { id: "orders", ar: "حكم القص", type: "creative", skill: "اختبار", deps: ["prep"], budgetMin: null, creative: { what: "احكم" }, gate: [{ type: "evidence" }] },
      { id: "cut", ar: "القص الواحد", type: "auto", bg: true, skill: "اختبار", deps: ["orders"], budgetMin: 20, cmd: ["node", "tools/stage.mjs", "cut", "{p}"] },
      { id: "cover_build", ar: "بناء الأغلفة", type: "auto", bg: true, skill: "اختبار", deps: ["orders"], budgetMin: null, cmd: ["node", "tools/stream/clip_autobuild.mjs", "{p}", "--run"] },
      { id: "slice", ar: "التقسيم", type: "auto", bg: true, skill: "اختبار", deps: ["cut"], budgetMin: 12, cmd: ["node", "tools/stream/fast_run.mjs", "slice", "{p}", "--jobs", "4"] },
      { id: "checks", ar: "الفحوص", type: "auto", bg: true, skill: "اختبار", deps: ["slice"], budgetMin: 15, cmd: ["node", "tools/stream/fast_run.mjs", "checks", "{p}"] },
      { id: "queue", ar: "الطابور", type: "auto", skill: "اختبار", deps: ["checks"], budgetMin: null, cmd: ["node", "tools/stream/fast_run.mjs", "queue", "{p}"] },
    ],
  };
  const STATE = (over = {}) => ({ kind: "fake", project: P, defPath: "data/pipelines/zz_fake.json", t0: Date.now() - 5 * 60e3, args: {}, clips: [], active: true,
    steps: { prep: { status: "done" }, orders: { status: "done", evidence: "حُكم القص" }, ...over } });
  /** a scratch workspace: the hook copy + the core + the kinds registry + the fake definition + a run state (session null = binds every main session) */
  const cRoot = (name, { state = STATE(), session = null, active = true, clips = ["zz_conduct_t_01", "zz_conduct_t_02"] } = {}) => {
    const r = mkRoot(name);
    fs.mkdirSync(path.join(r, "tools", "lib"), { recursive: true }); fs.copyFileSync(path.join(ROOT, CC), path.join(r, CC));
    fs.mkdirSync(path.join(r, "data", "pipelines"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "data", "pipelines", "kinds.json"), path.join(r, "data", "pipelines", "kinds.json"));
    put(path.join(r, "data", "pipelines", "zz_fake.json"), FAKE);
    if (clips.length) put(path.join(r, ".tmp", P, "clip_table.json"), clips.map((id) => ({ id, dur: 90 })));
    if (state) put(path.join(r, ".tmp", P, "conduct.json"), state);
    if (state && active) put(path.join(r, ".tmp", "conduct_active.json"), { project: P, kind: "fake", session, at: Date.now() });
    return r;
  };
  const pre = (r, command, extra = {}) => hook(r, "pre", { tool_name: "Bash", tool_input: { command }, cwd: r, session_id: "me", ...extra });
  const reply = async (r, text, extra = {}) => { transcript(r, text); return hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), session_id: "me", ...extra }); };
  /** a transcript where this turn already ran a tool (a tool_use of Bash, its result, then the final text) */
  const replyAfterTool = async (r, command, text) => {
    const L2 = [{ type: "user", message: { content: "اعمل خطة" } },
      { type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command } }] } },
      { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] } },
      { type: "assistant", message: { content: [{ type: "text", text }] } }];
    put(path.join(r, "transcript.jsonl"), L2.map((o) => JSON.stringify(o)).join("\n") + "\n");
    return hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), session_id: "me" });
  };

  // 1) THE PRE-TOOL VERDICT: out of order refused with the current step and its command named; the current step and a parallel one allowed; housekeeping free
  add("conduct.hook_refuses_out_of_order", F, L, "الهوك يرفض أمراً من خارج الترتيب (التقسيم قبل القص، الرندر قبل فحص ما قبل الرندر، تجهيز مقطع من بث) ويسمّي الخطوة الحالية وأمرها", async () => {
    const r = cRoot("cd_refuse");
    const slice = await pre(r, `node tools/stream/fast_run.mjs slice ${P} --jobs 4`);
    const render = await pre(r, "node tools/render_queue.mjs add --spec zz_conduct_t_01 --comp X --orient R --dest D");
    const clip = await pre(r, `node tools/stage.mjs prep zz_conduct_t_01 "v.mp4"`);
    const ok1 = slice.decision === "deny" && /القص الواحد/.test(slice.reason) && /stage\.mjs cut zz_conduct_t/.test(slice.reason) && /المتبقي/.test(slice.reason);
    return expect(ok1 && render.decision === "deny" && /القص الواحد/.test(render.reason) && clip.decision === "deny" && /مقطع من بث/.test(clip.reason),
      `slice=${slice.decision}/${slice.reason.slice(0, 80)} render=${render.decision} clip=${clip.decision}`);
  });
  add("conduct.hook_allows_current_and_parallel", F, L, "الهوك يسمح بالخطوة الحالية وبالخطوة المتوازية المسموحة، ولا يمسّ ما ليس أمر إجراء (قراءة، git، الاستوديو، حالة المُوصِل)", async () => {
    const r = cRoot("cd_allow");
    const out = {};
    for (const [k, c] of Object.entries({ cur: `node tools/stage.mjs cut ${P}`, par: `node tools/stream/clip_autobuild.mjs ${P} --run`, bg: `bash tools/bg.sh cut --project ${P} -- node tools/stage.mjs cut ${P}`, git: "git status && cat .tmp/zz/board.json", inbox: "node tools/hk_inbox.mjs reply a1 \"تم\"", conduct: "node tools/conduct.mjs status", help: "node tools/stream/fast_run.mjs slice --help", grep: "grep -n slice tools/stream/fast_run.mjs" })) out[k] = (await pre(r, c)).decision;
    const bad = Object.entries(out).filter(([, d]) => d === "deny").map(([k]) => k);
    return expect(!bad.length, `رُفض خطأً: ${bad.join("، ")}`);
  });
  add("conduct.hook_binds_only_main_session_of_the_run", F, L, "الهوك لا يربط وكيلاً فرعياً ولا جلسة أخرى غير جلسة التشغيل", async () => {
    const r = cRoot("cd_session", { session: "owner" });
    const mine = await pre(r, `node tools/stream/fast_run.mjs slice ${P}`, { session_id: "owner" });
    const other = await pre(r, `node tools/stream/fast_run.mjs slice ${P}`, { session_id: "someone-else" });
    const agent = await pre(r, `node tools/stream/fast_run.mjs slice ${P}`, { session_id: "owner", agent_id: "sub-1" });
    return expect(mine.decision === "deny" && other.decision !== "deny" && agent.decision !== "deny", `صاحبها ${mine.decision}، غيرها ${other.decision}، الوكيل ${agent.decision}`);
  });
  add("conduct.hook_silent_without_run", F, L, "بلا تشغيل مفتوح (أو بعد تمامه) لا يرفض الهوك شيئاً ولا يضيف سطراً", async () => {
    const r1 = cRoot("cd_norun", { state: null }), r2 = cRoot("cd_done", { state: STATE({ cut: { status: "done" }, cover_build: { status: "done" }, slice: { status: "done" }, checks: { status: "done" }, queue: { status: "done" } }) });
    const a = await pre(r1, `node tools/stream/fast_run.mjs slice ${P}`), b = await pre(r2, `node tools/stream/fast_run.mjs slice ${P}`);
    const pr = await hook(r1, "prompt", { prompt: "ما الحال؟", session_id: "me" });
    return expect(a.decision !== "deny" && b.decision !== "deny" && !/الخطوة الحالية/.test(pr.context), `${a.decision}/${b.decision}/${pr.context.slice(0, 60)}`);
  });

  // 2) THE LINE on every prompt and every tool answer
  add("conduct.line_on_prompt_and_post", F, L, "كل رسالة وكل أداة تحمل سطر «الخطوة الحالية: … — المتبقي: … د»", async () => {
    const r = cRoot("cd_line");
    const pr = await hook(r, "prompt", { prompt: "ما الحال؟", session_id: "me" });
    const po = await hook(r, "post", { tool_name: "Bash", tool_input: { command: "ls" }, tool_response: { stdout: "" }, session_id: "me", cwd: r });
    const ag = await hook(r, "post", { tool_name: "Bash", tool_input: { command: "ls" }, tool_response: { stdout: "" }, session_id: "me", cwd: r, agent_id: "sub-1" });
    const re = /الخطوة الحالية: القص الواحد \[cut\].*المتبقي: .*د/;
    return expect(re.test(pr.context) && re.test(po.context) && !/الخطوة الحالية/.test(ag.context), `prompt=${pr.context.slice(0, 90)} post=${po.context.slice(0, 90)} agent=${ag.context.slice(0, 40)}`);
  });

  // 3) THE STOP HOOK: «done» with steps open goes back; a plan from memory goes back until the plan tool ran
  add("conduct.stop_done_claim_blocked", F, L, "رد يعلن الإنجاز أو الجاهزية والخطوات مفتوحة يُرَدّ؛ والنفي والسؤال وتقرير الخطوة والتكرار (stop_hook_active) تمرّ", async () => {
    const r = cRoot("cd_stop");
    const claim = await reply(r, "انتهيتُ من البث وكل المقاطع جاهزة.");
    const ready = await reply(r, "البث جاهز للمراجعة.");
    const neg = await reply(r, "لم ينتهِ البث بعد، والقص يعمل الآن.");
    const step = await reply(r, "تمّت خطوة التجهيز وبدأ القص في الخلفية.");
    const again = await reply(r, "انتهيتُ من البث وكل المقاطع جاهزة.", { stop_hook_active: true });
    const r0 = cRoot("cd_stop_norun", { state: null }), free = await reply(r0, "انتهيتُ من البث وكل المقاطع جاهزة.");
    return expect(claim.decision === "block" && /خطوة مفتوحة/.test(claim.reason) && ready.decision === "block" && neg.decision !== "block" && step.decision !== "block" && again.decision !== "block" && free.decision !== "block",
      `ادعاء=${claim.decision} جاهز=${ready.decision} نفي=${neg.decision} خطوة=${step.decision} تكرار=${again.decision} بلا تشغيل=${free.decision}`);
  });
  const MEMORY_PLAN = "خطتي للبث: 1. أجهّز التسجيل. 2. أقص السكتات. 3. أقسّم المقاطع. 4. أبني وأرندر. وسيستغرق البث ساعتين تقريباً.";
  add("conduct.plan_from_memory_refused", F, L, "خطة أو تقدير زمن لبث أو درس أو حلقة أو ريل من الذاكرة تُرَدّ بـ«اطبع الخطة من الأداة»، وتمرّ بعد تشغيل أداة الخطة في الدورة نفسها", async () => {
    const r = cRoot("cd_plan", { state: null });
    const mem = await reply(r, MEMORY_PLAN);
    const les = await reply(r, "ترتيب الدرس: أولاً التنزيل ثم التفريغ ثم القص، والدرس يأخذ 40 دقيقة.");
    const reel = await reply(r, "الخطة للريل: - الهوك - الصور - الفاصل، وسيأخذ الريل 20 دقيقة.");
    const ok = await replyAfterTool(r, "node tools/conduct.mjs plan stream", MEMORY_PLAN);
    const wrongKind = await replyAfterTool(r, "node tools/conduct.mjs plan episode", MEMORY_PLAN);
    return expect(mem.decision === "block" && /اطبع الخطة من الأداة: node tools\/conduct\.mjs plan stream/.test(mem.reason) && les.decision === "block" && /plan lesson/.test(les.reason) && reel.decision === "block" && /plan reel/.test(reel.reason) && ok.decision !== "block" && wrongKind.decision === "block",
      `ذاكرة=${mem.decision}/${mem.reason.slice(0, 60)} درس=${les.decision} ريل=${reel.decision} بعد الأداة=${ok.decision} نوع آخر=${wrongKind.decision}`);
  });
  add("conduct.plan_check_lets_questions_and_reports_pass", F, L, "السؤال والرد الذي لا يقدّم خطة (تقرير، حالة، حلقة بلا ترتيب) لا يُمنع، ولا يتكرر المنع", async () => {
    const r = cRoot("cd_plan_ok", { state: null });
    const q = await reply(r, "هل تريد أن أبدأ بث الأمس أم الدرس الأخير؟");
    const report = await reply(r, "أصلحتُ فحص الحلقة: أضفتُ بوابة للغلاف، وعدّلتُ رسالة الرفض، ونقلتُ الاختبار إلى ملف جديد.");
    const other = await reply(r, "خطتي: 1. أقرأ الملف. 2. أعدّل. 3. أختبر. وسيستغرق هذا عشر دقائق.");
    const again = await reply(r, MEMORY_PLAN, { stop_hook_active: true });
    return expect(q.decision !== "block" && report.decision !== "block" && other.decision !== "block" && again.decision !== "block", `سؤال=${q.decision} تقرير=${report.decision} بلا نوع=${other.decision} تكرار=${again.decision}`);
  });

  // 4) THE LINT: a bad JSON fails (a tool that does not exist, a gate with no checker, a broken file, a broken graph); the real definitions pass
  add("conduct.lint_fails_on_bad_json", F, L, "الفاحص يفشل على تعريف فيه أداة غير موجودة أو بوابة بلا فاحص أو JSON فاسد أو دورة، وينجح على تعريف سليم", async () => {
    const D = path.join(RUN, "cd_lint"), step = (o) => ({ id: "a", ar: "أ", type: "auto", skill: "اختبار", deps: [], budgetMin: null, cmd: ["node", "tools/stage.mjs", "check", "{p}"], ...o });
    const mk = (name, steps, extra = {}) => put(path.join(D, name), { kind: "x", ar: "اختبار", guarded: [{ tool: "tools/stage.mjs", subs: ["check"] }], steps, ...extra });
    const good = mk("good.json", [step({})]);
    const noTool = mk("no_tool.json", [step({ cmd: ["node", "tools/zz_not_a_tool.mjs", "{p}"] })]);
    const noGate = mk("no_gate.json", [step({ gate: [{ type: "zz_no_such_gate" }] })]);
    const noChecker = mk("creative_no_gate.json", [step({ type: "creative", cmd: undefined, creative: { what: "ما" } })]);
    const cycle = mk("cycle.json", [step({ id: "a", deps: ["b"] }), step({ id: "b", deps: ["a"] })]);
    const unguarded = mk("unguarded.json", [step({ cmd: ["node", "tools/final_review.mjs", "{p}"] })]);
    const broken = put(path.join(D, "broken.json"), "{ \"kind\": \"x\", \"steps\": [ { ");
    const lint = (f) => runAsync(NODE, [path.join(ROOT, CD), "lint", "--file", f], { cwd: ROOT });
    const [g, a, b, c, d, e, f] = await Promise.all([good, noTool, noGate, noChecker, cycle, unguarded, broken].map(lint));
    return expect(g.status === 0 && a.status === 1 && /zz_not_a_tool/.test(a.out) && b.status === 1 && /بلا فاحص/.test(b.out) && c.status === 1 && /بوابة بلا فاحص|gate/.test(c.out) && d.status === 1 && /دورة/.test(d.out) && e.status === 1 && /غير مصنَّف/.test(e.out) && f.status === 1 && /JSON فاسد/.test(f.out),
      `سليم=${g.status} أداة=${a.status} بوابة=${b.status} بلا بوابة=${c.status} دورة=${d.status} غير مصنف=${e.status} فاسد=${f.status}: ${(g.out + a.out).slice(0, 160)}`);
  });
  add("conduct.real_definitions_lint_clean", F, L, "تعريفا البث والحلقة الحقيقيان يجتازان الفاحص: كل أداة موجودة وكل بوابة لها فاحص", async () => {
    const x = await runAsync(NODE, [path.join(ROOT, CD), "lint", "--all"], { cwd: ROOT });
    return expect(x.status === 0 && /✔ stream/.test(x.out) && /✔ episode/.test(x.out), x.out.slice(0, 300));
  });

  // 5) THE COMMANDS on a scratch workspace: `next` prints exactly one step; a step does not start before its dependencies and gate; a creative step is closed by its gate
  add("conduct.next_prints_one_step_and_gates", F, L, "next يطبع خطوة واحدة فقط ويشغّل التلقائية والمتوازية معاً، ولا تُغلق خطوة قبل ما قبلها ولا قبل بوابتها", async () => {
    const r = mkRoot("cd_next");
    fs.mkdirSync(path.join(r, "tools", "lib"), { recursive: true }); fs.copyFileSync(path.join(ROOT, CC), path.join(r, CC)); fs.copyFileSync(path.join(ROOT, CD), path.join(r, CD));
    fs.mkdirSync(path.join(r, "data", "pipelines"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "data", "pipelines", "kinds.json"), path.join(r, "data", "pipelines", "kinds.json"));
    const NEXT = { kind: "next", ar: "اختبار next", totalMin: 30, guarded: [{ tool: "tools/stage.mjs", subs: ["cut"] }], steps: [
      { id: "a", ar: "إدخال أول", type: "creative", skill: "اختبار", deps: [], budgetMin: null, creative: { what: "اكتب" }, gate: [{ type: "evidence", min: 4 }] },
      { id: "b", ar: "أمر سريع", type: "auto", fg: true, skill: "اختبار", deps: ["a"], budgetMin: 1, cmd: ["node", "-e", "require('fs').writeFileSync('.tmp/{p}/b.txt','x')"], gate: [{ type: "files", paths: [".tmp/{p}/b.txt"] }] },
      { id: "c", ar: "أمر بطيء", type: "auto", bg: true, skill: "اختبار", deps: ["a"], budgetMin: 2, cmd: ["node", "-e", "setTimeout(()=>require('fs').writeFileSync('.tmp/{p}/c.txt','y'),600)"], gate: [{ type: "files", paths: [".tmp/{p}/c.txt"] }] },
      { id: "d", ar: "إدخال ثانٍ", type: "creative", skill: "اختبار", deps: ["b"], budgetMin: null, creative: { what: "اكتب" }, gate: [{ type: "evidence", min: 4 }] },
      { id: "e", ar: "بوابة لا تنجح", type: "auto", fg: true, skill: "اختبار", deps: ["d", "c"], budgetMin: null, cmd: ["node", "-e", "0"], gate: [{ type: "files", paths: [".tmp/{p}/never.txt"] }] },
      { id: "f", ar: "لاحقة", type: "auto", fg: true, skill: "اختبار", deps: ["e"], budgetMin: null, cmd: ["node", "-e", "require('fs').writeFileSync('.tmp/{p}/f.txt','z')"], gate: [{ type: "files", paths: [".tmp/{p}/f.txt"] }] },
    ] };
    put(path.join(r, "tools", "stage.mjs"), "// the scratch copy has the guarded tool the lint looks for\n");
    const def = put(path.join(r, "data", "pipelines", "zz_next.json"), NEXT);
    const cd = (...a) => runAsync(NODE, [path.join(r, CD), ...a], { cwd: r, timeout: 30000 });
    const ones = (o) => (o.match(/^الخطوة الحالية \[/gm) || []).length;
    const st = await cd("start", "next", P, "--def", def);
    const n1 = await cd("next");
    const early = await cd("done", "d", "--evidence", "دليل كافٍ"), shortEv = await cd("done", "a", "--evidence", "x");
    const a = await cd("done", "a", "--evidence", "تمّ الإدخال");
    const n2 = await cd("next");
    let cdone = false; for (let i = 0; i < 20 && !cdone; i++) { cdone = /✔\s+\d+ \[c\]/.test((await cd("status")).out); if (!cdone) await new Promise((x) => setTimeout(x, 400)); }
    const d = await cd("done", "d", "--evidence", "تمّ الثاني");
    const n3 = await cd("next"), stat = await cd("status");
    const ok = st.status === 0 && ones(n1.out) === 1 && /\[a\]/.test(n1.out.split("\n").find((l) => /^الخطوة الحالية \[/.test(l)) ?? "")
      && early.status === 1 && /ما قبلها/.test(early.out) && shortEv.status === 1 && /بوابة/.test(shortEv.out) && a.status === 0
      && ones(n2.out) === 1 && /\[d\]/.test(n2.out) && /▶ \[b\] نُفِّذت الآن ونجحت/.test(n2.out) && /▶ \[c\] بدأت في الخلفية/.test(n2.out)
      && cdone && d.status === 0 && ones(n3.out) === 1 && /✘ فشلت/.test(n3.out) && /✘\s+\d+ \[e\]/.test(stat.out) && !/✔\s+\d+ \[f\]/.test(stat.out);
    return expect(ok, `start=${st.status} one1=${ones(n1.out)} early=${early.status} short=${shortEv.status} a=${a.status} one2=${ones(n2.out)}/${n2.out.slice(0, 160)} c=${cdone} d=${d.status} one3=${ones(n3.out)} ${n3.out.slice(0, 200)} ${stat.out.slice(0, 300)}`);
  });
  add("conduct.run_owner_session", F, L, "التشغيل يرتبط بالجلسة التي بدأته (يتركها الهوك قبل الأمر)، وما بدأه وكيل فرعي (التجربة الكاملة) لا يربط أي جلسة رئيسية", async () => {
    const mkScratch = (name) => {
      const r = mkRoot(name);
      fs.mkdirSync(path.join(r, "tools", "lib"), { recursive: true }); fs.copyFileSync(path.join(ROOT, CC), path.join(r, CC)); fs.copyFileSync(path.join(ROOT, CD), path.join(r, CD));
      fs.mkdirSync(path.join(r, "data", "pipelines"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "data", "pipelines", "kinds.json"), path.join(r, "data", "pipelines", "kinds.json"));
      put(path.join(r, "tools", "stage.mjs"), "// scratch\n");
      put(path.join(r, "data", "pipelines", "zz_own.json"), { kind: "own", ar: "ملكية", totalMin: 5, guarded: [{ tool: "tools/stage.mjs", subs: ["cut"] }], steps: [{ id: "a", ar: "أ", type: "creative", skill: "اختبار", deps: [], budgetMin: null, creative: { what: "ما" }, gate: [{ type: "evidence" }] }] });
      return r;
    };
    const start = (r) => runAsync(NODE, [path.join(r, CD), "start", "own", P, "--def", path.join(r, "data", "pipelines", "zz_own.json")], { cwd: r });
    const owner = (r) => { try { return JSON.parse(fs.readFileSync(path.join(r, ".tmp", "conduct_active.json"), "utf8")).session; } catch { return "(لا ملف)"; } };
    const r1 = mkScratch("cd_own_main"); put(path.join(r1, ".tmp", "conduct_pending_owner.json"), { session: "main-1", agent: null, at: Date.now() }); await start(r1);
    const r2 = mkScratch("cd_own_agent"); put(path.join(r2, ".tmp", "conduct_pending_owner.json"), { session: "main-1", agent: "sub-9", at: Date.now() }); await start(r2);
    const r3 = mkScratch("cd_own_none"); await start(r3);
    // the hook of a scratch copy writes the pending file for the main session and the agent alike
    const r4 = mkRoot("cd_own_hook"); await hook(r4, "pre", { tool_name: "Bash", tool_input: { command: "node tools/conduct.mjs start stream zz_x" }, cwd: r4, session_id: "main-7" });
    await hook(r4, "pre", { tool_name: "Bash", tool_input: { command: "node tools/conduct.mjs start stream zz_x" }, cwd: r4, session_id: "main-7", agent_id: "sub-3" });
    let pend = null; try { pend = JSON.parse(fs.readFileSync(path.join(r4, ".tmp", "conduct_pending_owner.json"), "utf8")); } catch { /* none */ }
    return expect(owner(r1) === "main-1" && owner(r2) === "__agent__" && owner(r3) === null && pend?.session === "main-7" && pend?.agent === "sub-3", `رئيسية=${owner(r1)} وكيل=${owner(r2)} بلا هوك=${owner(r3)} الأثر=${JSON.stringify(pend)}`);
  });
  add("conduct.argv_fill", F, L, "ملء الأوامر: {clips} عدة وسائط لا واحدة، وخيار قيمته فارغة يُحذف معها (--rem بلا نطاقات)، و{file:…} يقرأ الملف، والاتجاه بالمواصفة", async () => {
    const C = await import((await import("node:url")).pathToFileURL(path.join(ROOT, CC)).href), r = path.join(RUN, "cd_fill");
    put(path.join(r, ".tmp", "zz_f", "rem.txt"), "  \n"); put(path.join(r, ".tmp", "zz_f", "drops.txt"), "10-20,30-40\n");
    put(path.join(r, "data", "specs", "zz_f_01.json"), { frames: 3000 }); put(path.join(r, "data", "specs", "zz_f_02.json"), { frames: 6000 });
    const ctx = { root: r, p: "zz_f", clips: ["zz_f_01", "zz_f_02"], args: { video: "a b.mp4" } };
    const a1 = C.fillArgv(["node", "tools/stream/clip_repair.mjs", "{clips}"], ctx), a2 = C.fillArgv(["node", "tools/stage.mjs", "cut", "{p}", "--rem", "{file:.tmp/{p}/rem.txt}"], ctx);
    const a3 = C.fillArgv(["bash", "tools/stream/cut_smart.sh", "{p}", "{file:.tmp/{p}/drops.txt}"], ctx), a4 = C.fillArgv(["node", "tools/prerender_check.mjs", "{c}", "--o", "{o}"], { ...ctx, c: "zz_f_02" }), a5 = C.fillArgv(["node", "tools/montage_kickoff.mjs", "{p}", "{video}"], ctx);
    return expect(a1.join("|") === "node|tools/stream/clip_repair.mjs|zz_f_01|zz_f_02" && a2.join("|") === "node|tools/stage.mjs|cut|zz_f" && a3[3] === "10-20,30-40" && a4.join("|").endsWith("zz_f_02|--o|land") && a5[3] === "a b.mp4" && a5.length === 4, `${a1}  ${a2}  ${a3}  ${a4}  ${a5}`);
  });
  // 6) BYPASS ATTEMPTS (user 2026-11-22: «كيف ألزمك أنك ما تنفذ شيء إلا بعد الرجوع إلى المهارات والتعليمات؟»): deliberate ways OUT of the plan — each must be refused or sent back; a hole is fixed in the hook, never in the test
  const SK = ".claude/skills/zz/SKILL.md", NOTES = ".claude/skills/zz/notes.md";
  const FAKE2 = { ...FAKE, guarded: [...FAKE.guarded, { tool: "tools/gpu_render.mjs" }], steps: [
    ...FAKE.steps.map((s) => (s.id === "cut" ? { ...s, requires: [{ file: SK }, { file: NOTES, mode: "search" }] } : s)),
    { id: "prerender", ar: "فحص ما قبل الرندر", type: "auto", bg: true, foreach: "clips", skill: "اختبار", deps: ["checks"], budgetMin: null, cmd: ["node", "tools/prerender_check.mjs", "{c}", "--o", "{o}"] },
  ].map((s) => (s.id === "queue" ? { ...s, deps: ["prerender"] } : s)) };
  const D = (...ids) => Object.fromEntries(ids.map((i) => [i, { status: "done" }]));
  /** the hook's scratch root with the richer fake pipeline, two skill files, and a scratch script or two */
  const bRoot = (name, over = {}) => {
    const r = cRoot(name, { state: STATE(over.steps ?? {}), session: over.session ?? null }); put(path.join(r, "data", "pipelines", "zz_fake.json"), FAKE2);
    put(path.join(r, SK), Array.from({ length: 30 }, (_, i) => `سطر ${i + 1} من المهارة`).join("\n") + "\n"); put(path.join(r, NOTES), Array.from({ length: 20 }, (_, i) => `ملاحظة ${i + 1}`).join("\n") + "\n");
    put(path.join(r, ".tmp", "wrap.sh"), `node tools/stream/fast_run.mjs slice ${P}\n`); put(path.join(r, ".tmp", "wrap.mjs"), `import { execSync } from "node:child_process"; execSync("node tools/stream/fast_run.mjs slice ${P}");\n`);
    put(path.join(r, ".tmp", "edit.mjs"), `import fs from "node:fs"; fs.writeFileSync("tools/conduct.mjs", "");\n`);
    return r;
  };
  const viol = (r) => { try { return fs.readFileSync(path.join(r, "data", "conduct_violations.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
  const readTool = (r, file, extra = {}, tool = "Read") => hook(r, "pre", { tool_name: tool, tool_input: { file_path: path.join(r, file), ...extra }, cwd: r, session_id: "me" });

  add("bypass.skip_a_step", F, L, "محاولة: القفز فوق الخطوة الحالية (التقسيم والفحوص والطابور والفحص النهائي قبل القص) — كلها مرفوضة وتُسجَّل في سجل المخالفات بالخطوة والسبب", async () => {
    const r = bRoot("bp_skip");
    const tries = [`node tools/stream/fast_run.mjs slice ${P}`, `node tools/stream/fast_run.mjs checks ${P}`, `node tools/stream/fast_run.mjs queue ${P}`, "node tools/final_review.mjs x.mp4 --name zz_conduct_t_01", `node tools/stream/clip_cut_all.mjs .tmp/${P}/plan.json`];
    const got = []; for (const c of tries) got.push((await pre(r, c)).decision);
    const v = viol(r);
    return expect(got.every((d) => d === "deny") && v.length === tries.length && v.every((x) => x.step === "cut" && x.project === P && x.session === "me" && x.tried && x.why && x.at), `القرارات=${got} سجل=${v.length}/${tries.length} ${JSON.stringify(v[0] ?? {}).slice(0, 160)}`);
  });
  add("bypass.render_before_prerender", F, L, "محاولة: بدء الرندر (الطابور أو gpu_render) والخطوة الحالية فحص ما قبل الرندر — مرفوض؛ وفحص ما قبل الرندر نفسه مسموح", async () => {
    const r = bRoot("bp_render", { steps: D("cut", "cover_build", "slice", "checks") });
    // the skill of «cut» is not needed here: its step is done; the current step is «prerender»
    const a = await pre(r, "node tools/render_queue.mjs add --spec zz_conduct_t_01 --comp X --orient R --dest D --prerender"), b = await pre(r, "node tools/render_queue.mjs run"), c = await pre(r, "node tools/gpu_render.mjs --comp X --out o.mp4");
    const ok = await pre(r, `node tools/prerender_check.mjs zz_conduct_t_01 --o port`);
    return expect(a.decision === "deny" && b.decision === "deny" && c.decision === "deny" && /فحص ما قبل الرندر/.test(a.reason) && /prerender_check\.mjs \{c\}/.test(a.reason) && ok.decision !== "deny", `طابور=${a.decision} عامل=${b.decision} gpu=${c.decision} الفحص=${ok.decision}/${ok.reason.slice(0, 80)}`);
  });
  add("bypass.command_without_reading_its_skill", F, L, "محاولة: أمر إجراء دون قراءة مهارة خطوته — مرفوض باسم الملف؛ ولا تكفي قراءة مقتطف ولا قراءة قبل بدء التشغيل ولا ملف «بحث» ناقص؛ وتكفي القراءة الكاملة بعد البدء", async () => {
    const r = bRoot("bp_reads"), cmd = `node tools/stage.mjs cut ${P}`;
    const none = await pre(r, cmd);
    await readTool(r, SK, { offset: 1, limit: 5 }); const partial = await pre(r, cmd);
    put(path.join(r, ".tmp", `conduct_reads_me.json`), { [SK.toLowerCase()]: { total: 30, reads: [{ a: 1, b: 30, at: Date.now() - 3600e3 }], searches: [] } }); const old = await pre(r, cmd);   // read an hour ago, before the run began (5 min ago)
    await readTool(r, SK); const noSearch = await pre(r, cmd);
    await readTool(r, NOTES, { pattern: "x", path: path.join(r, NOTES) }, "Grep"); const full = await pre(r, cmd);
    const mirror = (() => { try { return Object.keys(JSON.parse(fs.readFileSync(path.join(r, ".tmp", P, "conduct_reads.json"), "utf8"))); } catch { return []; } })();
    const v = viol(r).map((x) => x.why).join(" | ");
    return expect(none.decision === "deny" && /skills\/zz\/SKILL\.md/.test(none.reason) && partial.decision === "deny" && old.decision === "deny" && noSearch.decision === "deny" && /notes\.md/.test(noSearch.reason) && full.decision !== "deny" && mirror.includes(SK.toLowerCase()) && /لم تُقرأ مهارة/.test(v),
      `بلا قراءة=${none.decision}/${none.reason.slice(0, 90)} مقتطف=${partial.decision} قديمة=${old.decision} بلا بحث=${noSearch.decision} كاملة=${full.decision}/${full.reason.slice(0, 80)} مرآة=${mirror}`);
  });
  add("bypass.whole_file_by_cat_counts_and_pipes_do_not", F, L, "قراءة الملف كله بـcat تُحسب، وcat مع أنبوب (head) لا تُحسب", async () => {
    const r = bRoot("bp_cat"), cmd = `node tools/stage.mjs cut ${P}`;
    await hook(r, "pre", { tool_name: "Bash", tool_input: { command: `cat ${SK} | head -3` }, cwd: r, session_id: "me" }); await readTool(r, NOTES, {}, "Read");
    const piped = await pre(r, cmd);
    await hook(r, "pre", { tool_name: "Bash", tool_input: { command: `cat ${SK}` }, cwd: r, session_id: "me" }); const whole = await pre(r, cmd);
    return expect(piped.decision === "deny" && whole.decision !== "deny", `أنبوب=${piped.decision}/${piped.reason.slice(0, 70)} كاملة=${whole.decision}`);
  });
  add("bypass.plan_or_estimate_from_memory", F, L, "محاولة: خطة أو تقدير زمن من الذاكرة بصيغ مختلفة (قائمة مرقّمة، «سيستغرق»، «الخطة»، ريل/درس/حلقة) — تُرَدّ حتى تُطبع الخطة من الأداة", async () => {
    const r = bRoot("bp_memory"), lines = [];
    for (const t of ["سيستغرق البث ساعتين من التسجيل إلى الرندر.", "خطتي للحلقة: - أجهّز - أقص - أبني - أرندر.", "ترتيب الريل: 1. الهوك 2. الصور 3. الفاصل، وسيأخذ الريل 30 دقيقة.", "الدرس سيأخذ 45 دقيقة من التنزيل إلى الرندر."]) lines.push((await reply(r, t)).decision);
    return expect(lines.every((d) => d === "block"), `القرارات=${lines}`);
  });
  add("bypass.edit_conductor_files_without_approval", F, L, "محاولة: تعديل الهوك أو المُوصِل أو خططه بأدوات التحرير — يُسأل المستخدم؛ ولو كانت الجلسة موافَقاً عليها فالوكيل الفرعي يُسأل أيضاً؛ وملف آخر لا يُسأل عنه", async () => {
    const r = bRoot("bp_edit"), files = ["data/pipelines/stream.json", "data/pipelines/new_kind.json", "tools/lib/conduct_core.mjs", "tools/conduct.mjs", "tools/hooks/guard.mjs"];
    const ed = (f, tool, extra = {}) => hook(r, "pre", { tool_name: tool, tool_input: { file_path: path.join(r, f) }, cwd: r, session_id: "me", ...extra });
    const noOk = []; for (const f of files) for (const tool of ["Edit", "Write"]) noOk.push((await ed(f, tool)).decision);
    put(path.join(r, ".tmp", "rules_edit_ok.json"), { me: Date.now() });
    const mainOk = (await ed("data/pipelines/stream.json", "Edit")).decision, agent = (await ed("tools/conduct.mjs", "Edit", { agent_id: "sub-1" })).decision, agentJson = (await ed("data/pipelines/stream.json", "Write", { agent_id: "sub-1" })).decision;
    const other = (await ed("tools/zz_other.mjs", "Edit")).decision, noCore = (await ed("data/zz_data.json", "Edit")).decision;
    return expect(noOk.every((d) => d === "ask") && mainOk !== "ask" && agent === "ask" && agentJson === "ask" && other !== "ask" && noCore !== "ask" && viol(r).length >= 10, `بلا موافقة=${noOk} موافق عليها=${mainOk} وكيل=${agent}/${agentJson} آخر=${other}/${noCore}`);
  });
  add("bypass.edit_conductor_files_by_shell", F, L, "محاولة: تعديل الهوك أو خططه بالشلّ (إعادة توجيه، sed -i، cp، node -e، git checkout، ملف نصي خارج tools) — يُسأل المستخدم، حتى من وكيل؛ والقراءة حرة", async () => {
    const r = bRoot("bp_shell_edit");
    const write = ["echo x >> data/pipelines/stream.json", "sed -i s/a/b/ tools/lib/conduct_core.mjs", "cp x.mjs tools/conduct.mjs", `node -e "require('fs').writeFileSync('tools/hooks/guard.mjs','')"`, "git checkout -- data/pipelines/stream.json", "node .tmp/edit.mjs", "tee tools/hooks/guard.mjs < x", "rm data/pipelines/episode.json"];
    const read = ["grep -n writeFileSync tools/hooks/guard.mjs", "cat data/pipelines/stream.json", "git diff tools/conduct.mjs", "git add tools/conduct.mjs data/pipelines/stream.json", "node tools/conduct.mjs status > .tmp/o.txt", "node tools/guard_selftest.mjs --for tools/hooks/guard.mjs"];
    const w = []; for (const c of write) w.push((await pre(r, c)).decision); const wa = (await pre(r, write[0], { agent_id: "sub-1" })).decision;
    const rd = []; for (const c of read) rd.push((await pre(r, c)).decision);
    return expect(w.every((d) => d === "ask") && wa === "ask" && rd.every((d) => d !== "ask" && d !== "deny"), `كتابة=${w} وكيل=${wa} قراءة=${rd}`);
  });
  add("bypass.tamper_with_conductor_state", F, L, "محاولة: تزوير حالة المُوصِل (إغلاق الخطوات بكتابة conduct.json، حذف مؤشر التشغيل، تعديل سجل المخالفات) بأي أداة — مرفوضة حتى لوكيل", async () => {
    const r = bRoot("bp_tamper"), tools = [["Write", `.tmp/${P}/conduct.json`], ["Edit", `.tmp/${P}/conduct.json`], ["Edit", ".tmp/conduct_active.json"], ["Write", "data/conduct_violations.jsonl"], ["Write", `.tmp/${P}/conduct_reads.json`], ["Write", ".tmp/user_prompts.jsonl"]];
    const got = []; for (const [t, f] of tools) { got.push((await hook(r, "pre", { tool_name: t, tool_input: { file_path: path.join(r, f) }, cwd: r, session_id: "me" })).decision); }
    const sh = ["rm .tmp/conduct_active.json", `echo {} > .tmp/${P}/conduct.json`, `node -e "require('fs').writeFileSync('.tmp/${P}/conduct.json','{}')"`, "> data/conduct_violations.jsonl", `mv .tmp/${P}/conduct.json /tmp/x`, "truncate -s 0 data/conduct_violations.jsonl"];
    const g2 = []; for (const c of sh) g2.push((await pre(r, c)).decision); const ag = (await pre(r, sh[0], { agent_id: "sub-1" })).decision, rdOk = (await pre(r, `cat .tmp/${P}/conduct.json`)).decision;
    return expect(got.every((d) => d === "deny") && g2.every((d) => d === "deny") && ag === "deny" && rdOk !== "deny", `أدوات=${got} شلّ=${g2} وكيل=${ag} قراءة=${rdOk}`);
  });
  add("bypass.wrappers_around_a_guarded_tool", F, L, "محاولة: تشغيل أداة إجراء من خارج دورها عبر غلاف (bash -c، sh -c، node -e، python -c، ملف .sh أو .mjs خارج tools، powershell، cmd /c، eval، أنبوب إلى bash، xargs، heredoc، start-process) — مرفوضة؛ والغلاف الحرّ (grep) مسموح، والغلاف حول الخطوة الحالية نفسها يُحسب أمراً عادياً", async () => {
    const r = bRoot("bp_wrap"), T = "node tools/stream/fast_run.mjs slice zz_conduct_t";
    const bad = [`bash -c "bash -c '${T}'"`, `node -e "require('child_process').execSync('${T}')"`, `python -c "import os; os.system('${T}')"`, "bash .tmp/wrap.sh", "node .tmp/wrap.mjs", `pwsh -NoProfile -c "${T}"`, `cmd /c ${T}`, `eval "${T}"`, `echo "${T}" | bash`, `echo x | xargs -I{} ${T}`, `node - <<'EOF'\nrequire('child_process').execSync('${T}')\nEOF`, `Start-Process node -ArgumentList "tools/stream/fast_run.mjs slice zz_conduct_t"`, "powershell -EncodedCommand AAAA", `bash -c "bash -c '${T}'"`, `iex "${T}"`];
    const got = []; for (const c of bad) got.push((await pre(r, c)).decision);
    const ps = (await hook(r, "pre", { tool_name: "PowerShell", tool_input: { command: `& ${T}` }, cwd: r, session_id: "me" })).decision;
    const free = [`bash -c "grep -n slice tools/stream/fast_run.mjs"`, `bash -c "node tools/stage.mjs cut ${P}"`], fr = []; await readTool(r, SK); await readTool(r, NOTES, { path: path.join(r, NOTES) }, "Grep"); for (const c of free) fr.push((await pre(r, c)).decision);
    return expect(got.every((d) => d === "deny") && ps === "deny" && fr.every((d) => d !== "deny"), `مرفوض=${got.map((d, i) => (d === "deny" ? "" : i + ":" + d)).join("") || "الكل"} powershell=${ps} حرّ=${fr}`);
  });
  add("bypass.claim_done_with_open_steps", F, L, "محاولة: ادّعاء الإنجاز بصيغ مختلفة والخطوات مفتوحة — كلها تُرَدّ، ويُسجَّل الرد في السجل", async () => {
    const r = bRoot("bp_claim"), out = [];
    for (const t of ["انتهيتُ.", "تم العمل على البث كله.", "اكتمل البث وكل المقاطع جاهزة للمراجعة.", "✅ تم", "أنجزتُ كل الخطوات."]) out.push((await reply(r, t)).decision);
    return expect(out.every((d) => d === "block") && viol(r).filter((x) => /ادّعاء إنجاز/.test(x.tried)).length >= 5, `القرارات=${out} سجل=${viol(r).length}`);
  });
  const mkConductRoot = (name, extra = {}) => {
    const r = mkRoot(name);
    fs.mkdirSync(path.join(r, "tools", "lib"), { recursive: true }); fs.copyFileSync(path.join(ROOT, CC), path.join(r, CC)); fs.copyFileSync(path.join(ROOT, CD), path.join(r, CD));
    fs.mkdirSync(path.join(r, "data", "pipelines"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "data", "pipelines", "kinds.json"), path.join(r, "data", "pipelines", "kinds.json"));
    put(path.join(r, "tools", "stage.mjs"), "// scratch\n"); put(path.join(r, SK), "سطر 1\nسطر 2\nسطر 3\n");
    put(path.join(r, "data", "pipelines", "zz_bp.json"), { kind: "bp", ar: "تجاوز", totalMin: 5, guarded: [{ tool: "tools/stage.mjs", subs: ["cut"] }], steps: [
      { id: "reading", ar: "قراءة", type: "creative", skill: "اختبار", deps: [], budgetMin: null, creative: { what: "اقرأ" }, gate: [{ type: "files_read", files: [{ file: SK }] }, { type: "evidence", min: 4 }] },
      { id: "work", ar: "عمل", type: "creative", skill: "اختبار", deps: ["reading"], budgetMin: null, creative: { what: "اعمل" }, gate: [{ type: "evidence", min: 4 }] },
      { id: "last", ar: "أخيرة", type: "creative", skill: "اختبار", deps: ["work"], budgetMin: null, creative: { what: "أنهِ" }, gate: [{ type: "evidence", min: 4 }] }] });
    return r;
  };
  const cdIn = (r, ...a) => runAsync(NODE, [path.join(r, CD), ...a], { cwd: r, timeout: 30000 });
  add("bypass.reading_step_cannot_be_closed_by_text", F, L, "محاولة: إغلاق خطوة القراءة بنص دليل بلا قراءة — مرفوضة وتُسجَّل، وnext يسرد الملفات غير المقروءة؛ وبعد قراءتها فعلاً (يراها الهوك) تُغلق", async () => {
    const r = mkConductRoot("bp_reading");
    await cdIn(r, "start", "bp", P, "--def", path.join(r, "data", "pipelines", "zz_bp.json"));
    const n1 = await cdIn(r, "next"), text = await cdIn(r, "done", "reading", "--evidence", "قرأتُ كل شيء بدقة");
    await hook(r, "pre", { tool_name: "Read", tool_input: { file_path: path.join(r, SK) }, cwd: r, session_id: "me" });
    const n2 = await cdIn(r, "next"), real = await cdIn(r, "done", "reading", "--evidence", "قرأتُ كل شيء بدقة"), skip = await cdIn(r, "done", "last", "--evidence", "قفزة فوق خطوة");
    const v = viol(r), st = await cdIn(r, "status");
    return expect(/القراءة الناقصة/.test(n1.out) && /skills\/zz\/SKILL\.md/.test(n1.out) && text.status === 1 && /لم تنجح|قراءة مهارتها/.test(text.out) && !/القراءة الناقصة/.test(n2.out) && real.status === 0 && skip.status === 1 && v.some((x) => /لم تُقرأ|إغلاق خطوة القراءة/.test(x.why)) && v.some((x) => /قبل ما قبلها/.test(x.why)) && new RegExp(`المرفوضة: ${v.length}`).test(st.out),
      `next1=${n1.out.slice(0, 200)} نص=${text.status}/${text.out.slice(0, 120)} next2=${n2.out.slice(0, 100)} حقيقية=${real.status}/${real.out.slice(0, 120)} قفز=${skip.status} سجل=${v.length} حالة=${st.out.slice(-200)}`);
  });
  add("bypass.end_the_run_early", F, L, "محاولة: إنهاء التشغيل مبكراً (بلا نص، بنص قصير، بنص من عندي لم يقله المستخدم) — مرفوضة وتُسجَّل والتشغيل باقٍ؛ وبنص من رسالته المسجَّلة بعد البدء يُنهى ويُسجَّل نصه", async () => {
    const r = mkConductRoot("bp_end");
    await cdIn(r, "start", "bp", P, "--def", path.join(r, "data", "pipelines", "zz_bp.json"));
    const a = await cdIn(r, "end"), b = await cdIn(r, "end", "--user-said", "ok"), c = await cdIn(r, "end", "--user-said", "قال لي المستخدم أن أنهي التشغيل");
    await hook(r, "prompt", { prompt: "أنهِ التشغيل الآن واتركه", session_id: "me" });
    const still = JSON.parse(fs.readFileSync(path.join(r, ".tmp", P, "conduct.json"), "utf8")).active, d = await cdIn(r, "end", "--user-said", "أنهِ التشغيل الآن");
    const after = JSON.parse(fs.readFileSync(path.join(r, ".tmp", P, "conduct.json"), "utf8"));
    return expect(a.status === 1 && b.status === 1 && c.status === 1 && still === true && d.status === 0 && after.active === false && /أنهِ التشغيل الآن/.test(after.endedByUser ?? "") && viol(r).filter((x) => /إنهاء التشغيل مبكراً/.test(x.why)).length === 3, `${a.status}${b.status}${c.status} ما زال=${still} ${d.status}/${d.out.slice(0, 120)} نصه=${after.endedByUser}`);
  });
  add("bypass.violation_log_and_status_line", F, L, "سجل المخالفات (التاريخ، الجلسة، الخطوة، ما جُرِّب، السبب) في data/conduct_violations.jsonl، وسطر عدّه في conduct.mjs status", async () => {
    const r = mkConductRoot("bp_log");
    await cdIn(r, "start", "bp", P, "--def", path.join(r, "data", "pipelines", "zz_bp.json")); await cdIn(r, "done", "work", "--evidence", "قفزة فوق القراءة"); await cdIn(r, "done", "last", "--evidence", "قفزة ثانية");
    const st = await cdIn(r, "status"), v = viol(r), m = st.out.match(/المرفوضة: (\d+)/);
    return expect(v.length === 2 && m && Number(m[1]) === 2 && v.every((x) => x.at && x.project === P && x.step && x.tried && x.why), `سجل=${v.length} حالة=${st.out.slice(-160)}`);
  });
  add("conduct.plan_and_unprepared_kinds", F, L, "plan يطبع الخطة المكتوبة بأدوات كل مقطع (الآيات والتلاوة والأحاديث والأسماء) وبالفاصل في الآخر؛ والأنواع غير المجهَّزة تقول «لم يُجهَّز»", async () => {
    const s = await runAsync(NODE, [path.join(ROOT, CD), "plan", "stream"], { cwd: ROOT }), e = await runAsync(NODE, [path.join(ROOT, CD), "plan", "episode"], { cwd: ROOT });
    const l = await runAsync(NODE, [path.join(ROOT, CD), "plan", "lesson"], { cwd: ROOT }), rl = await runAsync(NODE, [path.join(ROOT, CD), "plan", "reel"], { cwd: ROOT });
    const need = ["verse_scan", "recitation_check", "hadith_scan", "hadith_verify", "name_doubt", "clip_people_gate", "الفاصل", "prerender_check", "final_review", "الصافرة", "غير مقيس"];
    const miss = need.filter((k) => !s.out.includes(k));
    return expect(!miss.length && /لم يُجهَّز/.test(l.out) && /لم يُجهَّز/.test(rl.out) && /\[prep\]/.test(e.out) && /ساعتان|120 د/.test(s.out), `ينقص في خطة البث: ${miss.join("، ")} | درس: ${l.out.slice(0, 60)}`);
  });
  add("conduct.stream_definition_order", F, L, "تعريف البث: الترتيب بالتبعيات (التجهيز ← الخطة ← القص ← التقسيم ← الأحاديث ← البناء ← الفحص ← الطابور ← الرندر ← المراجعة)، والميزانيات من fast_run، وبوابة كل أداة مقطع", async () => {
    const def = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "pipelines", "stream.json"), "utf8")), by = Object.fromEntries(def.steps.map((s) => [s.id, s]));
    const after = (a, b) => { const seen = new Set(); const walk = (id) => { for (const d of by[id].deps) { seen.add(d); walk(d); } }; walk(a); return seen.has(b); };   // a is after b
    const chain = [["plan", "prep"], ["resolve", "plan"], ["cut", "resolve"], ["slice", "cut"], ["hadith_scan", "slice"], ["hadith_verify", "hadith_scan"], ["build", "titles"], ["build", "slice"], ["hadith_write", "hadith_verify"], ["repair", "pictures"], ["prerender", "slots"], ["checks", "prerender"], ["queue", "checks"], ["render", "queue"], ["final_review", "render"], ["listen", "final_review"], ["approve", "listen"]];
    const wrong = chain.filter(([a, b]) => !after(a, b)).map(([a, b]) => `${a}≺${b}`);
    const FB = { prep: 12, cut: 20, slice: 12, build: 35, checks: 15, render: 45 }, fb = Object.entries(FB).filter(([k, v]) => by[k]?.budgetMin !== v).map(([k]) => k);
    const per = (def.perClip ?? []).map((t) => t.id).sort().join(","), gates = JSON.stringify(by.queue.gate) + JSON.stringify(by.checks.gate) + JSON.stringify(by.cut.gate);
    return expect(!wrong.length && !fb.length && per === "hadith_scan,name_doubt,recitation_check,verse_scan" && /queue_jobs/.test(gates) && /perclip_artifacts/.test(gates) && /cover_ok/.test(gates) && /bleep/.test(gates) && /clip_people_gate/.test(gates) && by.queue.gate.some((g) => g.type === "prerender_fresh"),
      `ترتيب خاطئ: ${wrong.join("،")} | ميزانية خاطئة: ${fb.join("،")} | أدوات المقطع: ${per}`);
  });
  add("conduct.hook_wired_src", F, L, "المصدر: الهوك يستورد المُوصِل ويحكم قبل الأوامر ويضيف السطر ويردّ الإنجاز المدّعى والخطة من الذاكرة؛ والمهارة والقواعد تشيران إليه", async () => {
    const g = fs.readFileSync(path.join(ROOT, G), "utf8");
    const need = ['import("../lib/conduct_core.mjs")', "hookVerdict(", "claimsDone(", "presentsPlan(", "planToolRun(", "conductLine()", "اطبع الخطة من الأداة"], miss = need.filter((k) => !g.includes(k));
    const sk = fs.readFileSync(path.join(ROOT, ".claude", "skills", "lessons-and-streams", "SKILL.md"), "utf8"), gr = fs.readFileSync(path.join(ROOT, "القواعد_العامة.md"), "utf8");
    return expect(!miss.length && /conduct\.mjs/.test(sk) && /conduct\.mjs/.test(gr), `ينقص: ${miss.join("، ")} مهارة=${/conduct\.mjs/.test(sk)} قواعد=${/conduct\.mjs/.test(gr)}`);
  });
};
