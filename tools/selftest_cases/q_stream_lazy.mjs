/* THE LAZY STREAM (2026-11-22, user: «القص مرة واحدة… بلا ترميز فيديو قبل الرندر الأخير»): a stream clip is a RANGE LIST over the original (public/<clip>_map.json = the stream's cut list restricted to the clip's
   ranges, n re-based) with its own lossless cut audio; no whole-stream cut video, no per-clip slice. What each case keeps from breaking:
   1) lz.map_plan_equals_stream_plan   the clip's map reads EXACTLY the source frames the stream's cut list reads for the same cut frames (the renderer's plan, tools/gpu/edl_stream.py) — no frame lost or shifted at a piece or a join
   2) lz.edge_moves_out_of_word        a clip edge that falls inside a table word moves out to the word (the old slice hid half a word at the clip's start: the plan's VAD words differ from the aligned table by up to 0.3 s)
   3) lz.status_lazy_no_build          cut_lazy.status → «lazy» and ensureCut builds NOTHING for a marked clip (it used to rebuild the whole heavy cut from the original: an encode)
   4) lz.comp_name_finds_stream_spec   «Zz-Stream-Rehearsal1» → spec zz_stream_rehearsal_1 (the name rules failed, so the render found no EDL for a lazy clip and read a cut video it does not have)
   5) lz.window_is_frame_exact         the pixels a check reads (judder, face track) are the SAME source frames the render reads, across a join (a concat list was not: GOP-random frames)
   6) lz.wiring_*                      the cut step writes no cut video, the slice step registers ranges, the old path stays behind STREAM_ENCODE=1, the conductor plan says so
   No GPU: tiny CPU-made files (ffmpeg lavfi) under .tmp/zz_selftest_lz* and public/zz_selftest_lz* (removed by the case itself); the real project folders are never written. */
export default async (api) => {
  const { add, expect, runAsync, ROOT, NODE, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const imp = (f) => import(pathToFileURL(path.join(ROOT, f)).href);
  const src = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
  const LC = "tools/lib/lazy_clip.mjs", CL = "tools/cut_lazy.mjs", LZL = "lazy-stream-zero-encode";
  const planOf = (segs) => { const plan = []; let cum = 0; for (const s of segs) { const d = s.b - s.a, n = Math.round((cum + d) * 30) - Math.round(cum * 30); cum += d; for (let k = 0; k < n; k++) plan.push(Math.round((s.a + k / 30) * 30)); } return plan; };
  const parent = { segments: [{ a: 10, b: 20, n: 0, type: "speech" }, { a: 30, b: 35, n: 10, type: "speech" }, { a: 50, b: 60, n: 15, type: "clip" }], model: "cut_model", duration: 25 };

  add("lz.map_plan_equals_stream_plan", [LC, "tools/stream/clip_lazy.mjs"], LZL, "خريطة المقطع تقرأ الإطارات نفسها التي تقرؤها قائمة قص البث لنفس إطارات القص (عبر قطعة تعبر وصلة)، بلا إطار ضائع أو منزاح", async () => {
    const L = await imp(LC), PC = L.piecesOf(parent, "12-33,52-55"), segs = L.childSegments(parent, PC), par = planOf(parent.segments), ch = planOf(segs);
    let j = 0, bad = 0; for (const pc of PC.pieces) for (let k = 0; k < pc.nf; k++, j++) if (ch[j] !== par[pc.f0 + k]) bad++;
    return expect(PC.pieces.length === 2 && ch.length === PC.frames && j === PC.frames && bad === 0 && Math.abs(segs.at(-1).n + (segs.at(-1).b - segs.at(-1).a) - PC.D) < 1e-3 && segs.some((s) => s.type === "clip"),
      `قطع ${PC.pieces.length}، إطارات ${ch.length}/${PC.frames}، إطارات مصدر مختلفة ${bad}، أنواع ${segs.map((s) => s.type).join(",")}`);
  });
  add("lz.edge_moves_out_of_word", [LC], LZL, "حافة مقطع تقع داخل كلمة من الجدول المحاذى تخرج إلى حدّ الكلمة (بداية ونهاية)، ولا تتحرك حافة في فراغ", async () => {
    const L = await imp(LC), words = [{ s: 12.9, e: 13.3 }, { s: 13.4, e: 13.9 }, { s: 16.1, e: 16.7 }, { s: 16.8, e: 17.2 }];
    const a = L.piecesOf(parent, "13.0-16.5", words).pieces[0], b = L.piecesOf(parent, "13.35-16.75", words).pieces[0];   // 13.0 inside [12.9,13.3]; 16.5 inside [16.1,16.7]
    /* the pieces are on the stream's CUT timeline: this parent's first stretch starts at source 10 = cut 0, so source 12.9 → cut 2.9 */
    const okA = a.cs <= 2.9 + 1e-6 && a.cs > 2.9 - 0.04 && a.ce >= 6.7 - 1e-6 && a.ce < 6.7 + 0.04, okB = Math.abs(b.cs - 3.35) < 0.02 && Math.abs(b.ce - 6.75) < 0.02;   // source 13.35 and 16.75 fall in gaps
    return expect(okA && okB, `داخل كلمة: [${a.cs.toFixed(3)}, ${a.ce.toFixed(3)}] (المطلوب ≤2.9 و≥6.7 بزمن القص)، في فراغ: [${b.cs.toFixed(3)}, ${b.ce.toFixed(3)}]`);
  });
  add("lz.status_lazy_no_build", [CL], LZL, "مقطع بعلامة lazy_clip.json: status «lazy» وensureCut لا يبني ملفاً (كان يعيد بناء القص الثقيل كله من الأصل = ترميزاً)", async () => {
    const id = "zz_selftest_lzstatus", T = path.join(ROOT, ".tmp", id), before = fs.readdirSync(path.join(ROOT, "public")).filter((f) => f.startsWith(id));
    try {
      fs.mkdirSync(T, { recursive: true }); fs.writeFileSync(path.join(T, "lazy_clip.json"), "{}");
      const L = await imp(CL), s = L.status(id), e = L.ensureCut(id, { quiet: true }), after = fs.readdirSync(path.join(ROOT, "public")).filter((f) => f.startsWith(id)), t = (() => { try { L.ensureCut(id, { quiet: true, build: true }); return "لم يرفض البناء المقصود بلا مواصفة"; } catch (x) { return /no spec\.cut/.test(String(x.message)) ? "ok" : String(x.message).slice(0, 80); } })();
      return expect(s === "lazy" && e === "lazy" && after.length === before.length && t === "ok", `status ${s}، ensureCut ${e}، ملفات public جديدة ${after.length - before.length}، البناء المقصود: ${t}`);
    } finally { try { fs.rmSync(T, { recursive: true, force: true }); } catch { /* held */ } }
  });
  add("lz.comp_name_finds_stream_spec", [CL], LZL, "معرّف تركيبة مقطع بث (رقمه ملصوق باسمه) يجد مواصفته: وإلا لا يجد الرندر قائمة الأصل ويقرأ ملف قص لا وجود له", async () => {
    const L = await imp(CL), ids = ["zz_stream_rehearsal_1", "stream_1122_12", "zz_stream_rehearsal_lazy_3"], got = ids.map((i) => L.specCompBase(i));
    const ok = got[0] === "zz-stream-rehearsal1" && got[1] === "stream112212" && got[2] === "zz-stream-rehearsal-lazy3" && /specCompBase\(f\.slice\(0, -5\)\) === base/.test(src(CL));
    return expect(ok, `المشتق: ${got.join(" · ")}`);
  });
  add("lz.window_is_frame_exact", [LC], LZL, "ما تقرؤه الفحوص من بكسلات مقطع كسول (حاجز تتبع الوجه، الارتجاف) هو إطارات الأصل نفسها التي يقرؤها الرندر، عبر وصلة، إطاراً بإطار", async () => {
    const id = "zz_selftest_lzwin", T = path.join(ROOT, ".tmp", id), P = path.join(ROOT, "public"), mp4 = path.join(P, `${id}_src.mp4`);
    try {
      fs.mkdirSync(T, { recursive: true });
      const g = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=128x72:r=30:d=6", "-g", "17", "-c:v", "libx264", "-pix_fmt", "yuv420p", mp4], { timeout: 60000 });
      if (g.status !== 0) return { ok: false, why: "ffmpeg لم يصنع مادة الاختبار: " + g.err.slice(-120) };
      fs.writeFileSync(path.join(T, "prep_config.json"), JSON.stringify({ source: `public/${id}_src.mp4` }));
      fs.writeFileSync(path.join(P, `${id}_map.json`), JSON.stringify({ segments: [{ a: 0.5, b: 1.5, n: 0 }, { a: 3, b: 4, n: 1 }, { a: 4.3, b: 5.2, n: 2 }], duration: 2.9 }));
      const L = await imp(LC), view = L.viewFile(id), W = 32, H = 18, SZ = W * H, tail = `scale=${W}:${H},format=gray`;
      const lay = L.layout(id), plan = []; for (const s of lay) for (let k = 0; k < s.n; k++) plan.push(Math.round((s.a + k / 30) * 30));
      const f0 = 20, n = 25, got = L.rawWindow(view, f0 / 30, n, tail);   // frames 20..44: across the join at frame 30
      const { spawnSync } = await import("node:child_process");
      const bin = spawnSync("ffmpeg", ["-v", "error", "-i", mp4, "-vf", tail, "-fps_mode", "passthrough", "-f", "rawvideo", "-"], { maxBuffer: 1 << 26 }).stdout;
      let same = 0; for (let k = 0; k < n; k++) if (Buffer.compare(got.subarray(k * SZ, (k + 1) * SZ), bin.subarray(plan[f0 + k] * SZ, (plan[f0 + k] + 1) * SZ)) === 0) same++;
      return expect(got.length === n * SZ && same === n, `${same}/${n} إطاراً مطابقاً لإطارات الأصل في الخطة (طول الناتج ${got.length / SZ} إطاراً)`);
    } finally { for (const f of [T, path.join(P, `${id}_map.json`), mp4]) try { fs.rmSync(f, { recursive: true, force: true }); } catch { /* held */ } }
  });

  add("lz.stage_cut_writes_no_video", ["tools/stage.mjs", "tools/stream/cut_smart.sh"], LZL, "قص البث (stage cut بـSTAGE_CUT_LAZY=1) يكتب الخريطة وصوت القص اللاضائع وكلمات القص ولا يكتب ملف فيديو، على مادة صغيرة صنعها المعالج", async () => {
    const R = path.join(api.RUN, "l_lz", "cut"), pr = "p1";
    fs.mkdirSync(path.join(R, "public"), { recursive: true }); fs.mkdirSync(path.join(R, ".tmp", pr), { recursive: true });
    for (const d of ["tools", "data"]) { const l = path.join(R, d); if (!fs.existsSync(l)) fs.symlinkSync(path.join(ROOT, d), l, "junction"); }
    const mp4 = path.join(R, "public", `${pr}_src.mp4`), T = path.join(R, ".tmp", pr), J = (f, o) => fs.writeFileSync(path.join(T, f), JSON.stringify(o));
    const g = await runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=128x72:r=30:d=8", "-f", "lavfi", "-i", "sine=f=300:r=48000:d=8", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", mp4], { timeout: 60000 });
    if (g.status !== 0) return { ok: false, why: "ffmpeg لم يصنع مادة الاختبار: " + g.err.slice(-120) };
    const W = [["اول", 0.6, 1.2], ["كلمة", 1.3, 1.9], ["هنا", 2.0, 2.6], ["ثم", 4.6, 5.1], ["كلام", 5.2, 5.8], ["اخر", 5.9, 6.5]].map(([w, s, e], i) => ({ i, w, s, e, aligned: true }));
    J("prep_config.json", { source: `public/${pr}_src.mp4`, audioOnly: false }); J("words_table.json", { words: W }); J("words_vad.json", W.map(({ w, s, e }) => ({ w, s, e }))); J("words.json", W.map(({ w, s, e }) => ({ w, s, e })));
    J("vad.json", { speech: [[0.5, 2.7], [4.5, 6.6]] }); J("tr_vad.json", []); J("speakers.json", { speakers: [], turns: [] });
    const env = { ...process.env, STAGE_CUT_LAZY: "1", SKIP_GATE: "1", STREAM_WHOLE: "1", STREAM_SLICE_OK: "1", CUT_BUILD_OLD: "" };
    const x = await runAsync(NODE, ["tools/stage.mjs", "cut", pr], { cwd: R, env, timeout: 170000 });
    const vids = fs.readdirSync(path.join(R, "public")).filter((f) => /\.(mp4|mov|mkv)$/i.test(f) && f !== `${pr}_src.mp4`), log = fs.existsSync(path.join(T, "stage_cut.log")) ? fs.readFileSync(path.join(T, "stage_cut.log"), "utf8") : "";
    const map = fs.existsSync(path.join(R, "public", `${pr}_map.json`)) ? JSON.parse(fs.readFileSync(path.join(R, "public", `${pr}_map.json`), "utf8")) : null, wav = path.join(T, "cut_audio.wav");
    return expect(x.status === 0 && !vids.length && map?.segments?.length && fs.existsSync(wav) && fs.existsSync(path.join(T, "cut_words.json")) && /lazy cut: no cut video encoded/.test(log),
      `الخروج ${x.status}، ملفات فيديو جديدة: ${vids.join(",") || "لا شيء"}، الخريطة ${map?.segments?.length ?? "لا"}، cut_audio ${fs.existsSync(wav)}، ${/lazy cut/.test(log) ? "" : "السجل بلا سطر القص الكسول: "}${log.split("\n").slice(-4).join(" | ").slice(0, 200)} ${x.err.slice(-160)}`);
  });

  /* wiring: the stream plan and the tools agree that no cut video is built unless STREAM_ENCODE=1 */
  add("lz.wiring_cut_and_slice", ["tools/stage.mjs", "tools/stream/cut_smart.sh", "tools/stream/clip_cut_all.mjs", "tools/stream/clip_lazy.mjs", "data/pipelines/stream.json"], LZL, "خطوة القص لا تبني فيديو (STAGE_CUT_LAZY) وخطوة التقسيم تسجّل نطاقات (clip_lazy) والمسار القديم خلف STREAM_ENCODE=1، وخطة المُوصِل تقول ذلك", async () => {
    const st = src("tools/stage.mjs"), cs = src("tools/stream/cut_smart.sh"), ca = src("tools/stream/clip_cut_all.mjs"), cl = src("tools/stream/clip_lazy.mjs"), pj = JSON.parse(src("data/pipelines/stream.json"));
    const step = (id) => pj.steps.find((s) => s.id === id), gate = (id) => JSON.stringify(step(id)?.gate ?? []);
    const checks = {
      "stage cut: lazy branch skips the encode": /lazyCut/.test(st) && /process\.env\.CUT_BUILD_OLD && !lazyCut/.test(st) && /STAGE_CUT_LAZY === "1" && process\.env\.STREAM_ENCODE !== "1"/.test(st),
      "cut_smart.sh: lazy unless STREAM_ENCODE=1": /STAGE_CUT_LAZY=1/.test(cs) && /STREAM_ENCODE" = 1/.test(cs),
      "clip_cut_all: clip_lazy unless STREAM_ENCODE=1": /STREAM_ENCODE === "1" \? "tools\/stream\/clip_slice\.mjs" : "tools\/stream\/clip_lazy\.mjs"/.test(ca),
      "clip_lazy writes no video": !/"h264_nvenc"|"libx264"|"-c:v"|"-vf"/.test(cl),
      "stream.json cut gate: no cut video": !/_cut\.mp4/.test(gate("cut")) && /cut_audio\.wav/.test(gate("cut")),
      "stream.json slice gate: no clip video": !/_cut\.mp4|_cut_s\.mp4/.test(gate("slice")) && /_map\.json/.test(gate("slice")) && /lazy_clip\.json/.test(gate("slice")),
      "stream.json guards clip_lazy": (pj.guarded ?? []).some((g) => g.tool === "tools/stream/clip_lazy.mjs"),
    };
    const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    return expect(!bad.length, bad.length ? `لم يتحقق: ${bad.join(" · ")}` : "ok");
  });
  add("lz.wiring_pixel_consumers", ["tools/spec_draft.mjs", "tools/lib/face_zone.mjs", "tools/face_fast.mjs", "tools/clip_people_gate.py", "tools/judder_check.mjs", "tools/prerender_check.mjs", "tools/bumper_at.mjs", "tools/moves_plan.mjs", "tools/words_cut_large.py", "tools/render_job.sh"], LZL, "كل أداة تحتاج بكسلات القص أو صوته تقرأ الأصل عبر القائمة للمقطع الكسول (لا ملف قص ثقيلاً)", async () => {
    const has = (f, re) => re.test(src(f)), c = {
      "spec_draft: lazy face track": has("tools/spec_draft.mjs", /LZ\.isLazy\(p\)\) trackF = LZ\.faceTrackFile\(p\)/),
      "face_zone: lazy face track": has("tools/lib/face_zone.mjs", /isLazy\(spec\.id\)\) trackF = faceTrackFile\(spec\.id\)/),
      "face_fast: lazy face track": has("tools/face_fast.mjs", /LZ\.isLazy\(spec\.id\)/),
      "clip_people_gate: original through the map": has("tools/clip_people_gate.py", /lazy_clip\.json/) && has("tools/clip_people_gate.py", /to_src\(t\)/),
      "judder_check: lazy view": has("tools/judder_check.mjs", /LZ\.rawWindow/) && has("tools/judder_check.mjs", /repairDups/),
      "prerender_check: view + placeholder": has("tools/prerender_check.mjs", /LZ\.isLazy\(c\.p\) \? LZ\.viewFile\(c\.p\)/) && has("tools/prerender_check.mjs", /withPlaceholder/),
      "bumper_at: cut audio": has("tools/bumper_at.mjs", /lazy_clip\.json/),
      "moves_plan: cut audio": has("tools/moves_plan.mjs", /lazy_clip\.json/),
      "words_cut_large: cut audio": has("tools/words_cut_large.py", /STAGE_CUT_LAZY/),
      "render job: judder on the view": has("tools/render_job.sh", /lazy_clip\.json/) && has("tools/render_job.sh", /clip_lazy\.mjs view/),
    };
    const bad = Object.entries(c).filter(([, v]) => !v).map(([k]) => k);
    return expect(!bad.length, bad.length ? `لم يتحقق: ${bad.join(" · ")}` : "ok");
  });
  void NODE;
};
