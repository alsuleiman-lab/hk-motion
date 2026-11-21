// (user 2026-11-21, the Studio «رندر» refused a «شيخ الردود» video: «عليه يتعرف على كل شيء ويفعل ميزات لكل شيء، لأن المسألة نحن عندنا الآن برنامج متكامل»)
// tools/comp_kinds.mjs knows every composition's kind and how each Studio tool works on it; tools/hk_server.mjs routes render / cut / grade through it.
// READ-ONLY on the real workspace: the real registries (src/Root.tsx …) are only read; the spec kinds use fake specs in .tmp/selftest; the render routing runs
// with --dry (tools/render_queue.mjs adds nothing — checked on data/render_queue/state.json); the grade registry is written to a scratch file only.
export default async (api) => {
  const { add, expect, put, runAsync, RUN, ROOT, NODE, path, fs } = api;
  await kindReview(api);
  const { pathToFileURL } = await import("node:url");
  const K = await import(pathToFileURL(path.join(ROOT, "tools", "comp_kinds.mjs")).href);
  const READY = K.READY;
  const fakeSpecs = () => {
    const d = path.join(RUN, "comp_kinds_specs"), sp = (n, o) => put(path.join(d, `${n}.json`), { title: `عنوان ${n}`, frames: 1800, cut: `${n}_cut_s.mp4`, ...o });
    sp("zz-full", { bumper: { id: "shelf", at: 20 } }); sp("zz-reel", { kind: "reel", bumper: { id: "press", at: 50, end: true } });
    sp("zzbook7_2", { kind: "reel", bumper: { id: "wall", at: 50, end: true } }); sp("stream_zz", { kind: "reel", bumper: { id: "wall", at: 50, end: true } });
    sp("zz-off", { studio: false }); put(path.join(d, "zz-notmontage.json"), { title: "ليس مونتاجاً" });
    return d;
  };
  const SH = "C:/Users/mshms/Videos/جاهز";

  add("kinds.each_kind", "tools/comp_kinds.mjs", "studio-tools-spec-only", "كل نوع من التركيبات يُعرف، ولكل أداة طريقته الصحيحة فيه (مونتاج، ريل، درس، بث، شيخ الردود، دبلجة، مناظرة، موشن، عرض، أصل داخلي)", async () => {
    const specDir = fakeSpecs(), reg = K.registry({ specDir }), R = (id) => K.resolve(id, { registry: reg }), bad = [];
    const chk = (id, cond, why) => { if (!cond) bad.push(`${id}: ${why}`); };
    const both = R("Zz-Full-Both"); chk("Zz-Full-Both", both.kind === "hk-full" && both.render.mode === "spec" && both.render.jobs.map((j) => j.orient).join("") === "LR" && both.render.jobs.every((j) => j.dest === READY) && both.cut.ok && both.grade.where === "spec", JSON.stringify(both.render).slice(0, 160));
    const reel = R("Zz-Reel"); chk("Zz-Reel", reel.kind === "hk-reel" && reel.render.jobs.length === 1 && reel.render.jobs[0].orient === "R", reel.kind);
    const les = R("Zzbook7_2"); chk("Zzbook7_2", les.kind === "lesson" && les.render.jobs[0].dest === `${SH}/دروس` && les.render.jobs[0].bumper === "end", JSON.stringify(les.render.jobs));
    const st = R("Stream_zz"); chk("Stream_zz", st.kind === "stream" && st.render.jobs[0].dest === `${SH}/بثوث/طولي` && st.render.jobs[0].bumper === "end", JSON.stringify(st.render.jobs));
    chk("zz-off", !reg.has("Zz-Off") && !reg.has("Zz-Notmontage"), "مواصفة خارج الاستوديو أو ليست مونتاجاً سُجّلت");
    const first = (re) => [...reg.keys()].find((k) => re.test(k));
    const ru = first(/^Rudood-/); if (ru) { const x = R(ru); chk(ru, x.kind === "rudood" && x.render.mode === "comp" && x.render.jobs[0].dest === `${SH}/كرتون` && x.render.jobs[0].bumper === "none" && !/#محمد_بن_شمس_الدين/.test(x.render.jobs[0].name) && /^شيخ الردود - /.test(x.render.jobs[0].name) && !x.cut.ok && x.grade.scope === "frame", JSON.stringify({ r: x.render, c: x.cut.ok, g: x.grade.scope })); }
    const du = first(/^Dub-/); if (du) { const x = R(du); chk(du, x.kind === "dubbing" && /دبلجة (كرمنجية|سورانية)/.test(x.render.jobs[0].name) && x.render.jobs[0].bumper === "none" && x.grade.scope === "video" && !x.cut.ok, JSON.stringify(x.render.jobs)); }
    const de = first(/^DebateR\d/); if (de) { const x = R(de); chk(de, x.kind === "debate-reel" && x.render.jobs[0].bumper === "end", x.kind); }
    const hy = first(/^Hybrid/); if (hy) { const x = R(hy); chk(hy, x.kind === "engine-asset" && !x.render.ok && !x.grade.ok, x.kind); }
    const dm = first(/-Demo$/); if (dm) { const x = R(dm); chk(dm, x.kind === "demo" && x.render.mode === "still" && !x.cut.ok, x.kind); }
    const ex = first(/^Jordan-Detain$/); if (ex) { const x = R(ex); chk(ex, x.kind === "explainer" && x.render.mode === "comp", x.kind); }
    // the kinds with no live composition today, on fake entries (their skills' rules)
    const fake = new Map([["Silent-Zz-Portrait", { id: "Silent-Zz-Portrait", file: "src/SilentReaction.tsx", folder: "", hidden: null }], ["Stick-Zz", { id: "Stick-Zz", file: null, folder: "", hidden: null }], ["Reel-Aqida-Zz", { id: "Reel-Aqida-Zz", file: null, folder: "", hidden: null }]]);
    const si = K.resolve("Silent-Zz-Portrait", { registry: fake }); chk("Silent", si.kind === "silent" && si.render.jobs[0].bumper === "end" && si.render.jobs[0].dest === READY, si.kind);
    const ca = K.resolve("Stick-Zz", { registry: fake }); chk("Stick", ca.kind === "cartoon" && ca.render.jobs[0].dest === `${SH}/كرتون` && ca.render.jobs[0].bumper === "none", ca.kind);
    const sc = K.resolve("Reel-Aqida-Zz", { registry: fake }); chk("Aqida", sc.kind === "scholars" && sc.render.jobs[0].dest === `${SH}/موشن مشايخ`, sc.kind);
    chk("paper", K.compKind({ id: "Zz-Paper", file: "src/ZzPaper.tsx", folder: "" }, 'import { Sheet } from "./PaperKit";') === "paper", "الورقي لم يُعرف");
    chk("unknown", K.resolve("Zz-Nothing", { registry: reg }).kind === "unknown", "تركيب مجهول لم يُعلَّم مجهولاً");
    return expect(!bad.length, bad.join(" ؛ "));
  });

  add("kinds.no_unknown_in_studio", "tools/comp_kinds.mjs", "studio-tools-spec-only", "لا تركيب في سجلات الاستوديو بلا نوع معروف (الجديد يُضاف نوعه في المحلّل)", async () => {
    const reg = K.registry(), unk = [...reg.keys()].filter((id) => K.resolve(id, { registry: reg }).kind === "unknown");
    return expect(!unk.length && reg.size > 0, `بلا نوع: ${unk.join("، ") || "(السجل فارغ)"}`);
  });

  add("kinds.route_dry", ["tools/comp_kinds.mjs", "tools/render_queue.mjs"], "studio-tools-spec-only", "توجيه الأدوات: الرندر يضع مهمة نوعه (بالتجربة الجافة لا يُضاف شيء)، والقصّ لما لا يُقصّ يذهب لصاحبه، والألوان تُرفض بسببها", async () => {
    const reg = K.registry(), bad = [], first = (re) => [...reg.keys()].find((k) => re.test(k));
    const ru = first(/^Rudood-/), hy = first(/^Hybrid/), spec = [...reg.values()].find((e) => e.spec && e.form === "port" && e.spec !== "demo");
    if (ru) {
      const d = K.route("render", ru, { frame: 12 }); if (d.do !== "queue" || d.argv[1] !== "queue") bad.push(`رندر ${ru}: ${d.do}`);
      const c = K.route("cut", ru, { a: 30, b: 90 }); if (c.do !== "inbox" || !/^قصّ هذا: من الإطار 30 إلى 90/.test(c.text) || !/لا يُقصّ هنا/.test(c.message)) bad.push(`قصّ ${ru}: ${c.do} ${c.text ?? ""}`);
      if (K.route("grade", ru).do !== "grade") bad.push(`ألوان ${ru}`);
    }
    if (hy) { const d = K.route("render", hy); if (d.do !== "na") bad.push(`رندر ${hy}: ${d.do}`); if (K.route("grade", hy).do !== "na") bad.push(`ألوان ${hy}`); }
    if (K.route("render", "Zz-Nothing-At-All").do !== "inbox") bad.push("المجهول لا يذهب لصاحبه");
    if (spec && K.route("cut", spec.id, { a: 1, b: 2 }).do !== "cut") bad.push(`قصّ ${spec.id} لا يمرّ بأداة القص`);
    const qf = path.join(ROOT, "data", "render_queue", "state.json"), before = fs.existsSync(qf) ? fs.readFileSync(qf, "utf8") : null;
    for (const id of [ru, spec?.id].filter(Boolean)) {
      const x = await runAsync(NODE, [path.join(ROOT, "tools", "comp_kinds.mjs"), "queue", id, "--dry"], { cwd: ROOT, timeout: 60000 });
      if (x.status !== 0 || !/DRY add/.test(x.out)) bad.push(`التجربة الجافة ${id}: ${(x.out + x.err).slice(0, 160)}`);
    }
    const after = fs.existsSync(qf) ? fs.readFileSync(qf, "utf8") : null;
    if (before !== after) bad.push("التجربة الجافة غيّرت ملف الطابور");
    return expect(!bad.length, bad.join(" ؛ "));
  });

  add("kinds.grade_registry", "tools/hk_grade.mjs", "studio-tools-spec-only", "ألوان التركيب غير المونتاج تُكتب في سجلها بنطاقها، واللون المحايد يحذف السطر فلا يتغيّر التركيب", async () => {
    const f = put(path.join(RUN, "comp_grades", "g.json"), { comps: {} }), js = put(path.join(RUN, "comp_grades", "t.mjs"),
      `const G = await import(${JSON.stringify(pathToFileURL(path.join(ROOT, "tools", "hk_grade.mjs")).href)}); const f = ${JSON.stringify(f)};
       G.setCompGrade("Zz-A", "frame", { brightness: 120 }, false, f); const a = JSON.parse((await import("node:fs")).readFileSync(f, "utf8"));
       G.setCompGrade("Zz-A", "frame", {}, true, f); const b = JSON.parse((await import("node:fs")).readFileSync(f, "utf8"));
       let bad = ""; try { G.setCompGrade("Zz-B", "everything", { brightness: 90 }, false, f); bad = "نطاق مجهول قُبل"; } catch { /* refused */ }
       console.log(JSON.stringify({ a: a.comps["Zz-A"], b: b.comps["Zz-A"] ?? null, bad }));`);
    const x = await runAsync(NODE, [js], { cwd: ROOT }); let o = {}; try { o = JSON.parse(x.out.trim().split("\n").pop()); } catch { /* broken */ }
    return expect(o.a?.scope === "frame" && o.a?.grade?.brightness === 120 && o.b === null && !o.bad, `${x.out}${x.err}`.slice(0, 200));
  });

  add("kinds.wired_src", ["tools/hk_server.mjs", "src/studioTools.ts", "src/compGrade.tsx", "src/ByRecency.tsx", "src/hybrid/Slot.tsx", "src/SafeComposition.tsx"], "studio-tools-spec-only", "الخادم يوجّه الرندر والقصّ والألوان عبر المحلّل، والشريط يعتّم ما لا ينطبق ويقول السبب، وألوان كل تركيب تصل إلى المعاينة والرندر", async () => {
    const r = (f) => fs.readFileSync(path.join(ROOT, f), "utf8"), sv = r("tools/hk_server.mjs"), st = r("src/studioTools.ts"), bad = [];
    if (!/K\.route\("render"/.test(sv) || !/K\.route\("cut"/.test(sv) || !/K\.route\("grade"/.test(sv) || !/\/api\/kind/.test(sv)) bad.push("الخادم لا يمرّ بالمحلّل");
    if (!/body\.dry/.test(sv)) bad.push("الخادم بلا تجربة جافة");
    if (!/\/api\/kind/.test(st) || !/dataset\.na/.test(st) || !/لا ينطبق هنا/.test(st)) bad.push("الشريط لا يعتّم ولا يقول السبب");
    if (!/gradeTree\(children\)/.test(r("src/ByRecency.tsx"))) bad.push("ByRecency لا يلفّ التركيبات بألوانها");
    if (!/graded\(String\(props\.id\)/.test(r("src/SafeComposition.tsx"))) bad.push("SafeComposition بلا ألوان");
    if (!/gc\.cut === "\*"/.test(r("src/hybrid/Slot.tsx"))) bad.push("طبقات الفيديو لا تأخذ لون التركيب كله");
    if (!/comp_grades\.json/.test(r("src/compGrade.tsx"))) bad.push("compGrade لا يقرأ السجل");
    return expect(!bad.length, bad.join(" ؛ "));
  });
};

// (2026-11-21) «شيخ الردود - طعام لمسلمي الجن» rendered from 🎬 was refused by montage rules (no --name, judder on a smoothed cut, pauses > 0.4 s by design):
// a non-spec composition is confirmed by its own kind's checks (tools/kind_review.mjs). Fake files made here (CPU mpeg4, no GPU), in .tmp/selftest only.
export const kindReview = async ({ add, expect, runAsync, RUN, ROOT, NODE, path, fs }) => {
  add("kinds.review_by_kind", ["tools/kind_review.mjs", "tools/render_queue.mjs"], "studio-tools-spec-only", "الملف المرندر يُفحص بقواعد نوعه: سكتة الاستماع في شيخ الردود مقبولة وفي الدبلجة عيب، والجزء الصامت (صوت لم يدخل الملف) يُرفض في كل نوع", async () => {
    const d = path.join(RUN, "kind_review"); fs.mkdirSync(d, { recursive: true });
    const mk = async (name, expr) => { const f = path.join(d, name); const x = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=144x256:r=30:d=12", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=12`, "-shortest", "-c:v", "mpeg4", "-c:a", "aac", f], { timeout: 60000 }); return x.status === 0 ? f : null; };
    const tone = "0.3*sin(2*PI*440*t)";
    const pause = await mk("pause.mp4", `${tone}*(between(t,0,5)+between(t,6.2,12))`), dead = await mk("dead.mp4", `${tone}*between(t,8,12)`);
    if (!pause || !dead) return expect(false, "تعذّر صنع ملفات الاختبار (ffmpeg)");
    const rv = async (f, k) => { const x = await runAsync(NODE, [path.join(ROOT, "tools", "kind_review.mjs"), f, "--kind", k, "--json"], { cwd: ROOT, timeout: 60000 }); try { return JSON.parse(x.out.trim().split("\n").pop()); } catch { return { ok: null, raw: x.out + x.err }; } };
    const a = await rv(pause, "rudood"), b = await rv(pause, "dubbing"), c = await rv(dead, "rudood");
    const fail = (r, id) => r.checks?.find((x) => x.id === id)?.ok === false;
    const rq = fs.readFileSync(path.join(ROOT, "tools", "render_queue.mjs"), "utf8");
    return expect(a.ok === true && b.ok === false && fail(b, "pauses") && c.ok === false && fail(c, "parts") && /tools\/kind_review\.mjs/.test(rq) && !/"tools\/final_review\.mjs", (jj|j)\.file/.test(rq),
      `شيخ الردود بسكتة=${a.ok} الدبلجة بسكتة=${b.ok} جزء صامت=${c.ok}`);
  });
};
