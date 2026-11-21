// Self-test cases: the pre-render twins (user 2026-11-21, GTA 6: «ليش تظهر أخطاء بعد الرندر؟ … لازم حل جذري»; ledger post-render-discovery).
// Loaded by tools/guard_selftest.mjs (api = its helpers). Everything is fake and tiny: wav files (48 kHz mono, ≤ 4 s), PNGs made by ffmpeg, scratch specs and
// a scratch workspace root for the freshness gate — all under api.RUN (.tmp/selftest/). Nothing renders, nothing reads a real project: the twins run through
// tools/prerender_check.mjs runTwins() on a context whose workspace-reading dependencies are stubs, so each case FAILS when its twin is taken out of TWINS
// (the result has no line for that id) or stops catching the bad input, and each case checks the good input passes too (no twin that fails everything).
export default async (api) => {
  const { add, expect, RUN, ROOT, SCR, path, fs } = api;
  const { pathToFileURL } = await import("node:url");
  const { spawnSync } = await import("node:child_process");
  const D = path.join(RUN, "e_prerender");
  const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
  const inScr = (p) => path.resolve(p).toLowerCase().startsWith(path.resolve(SCR).toLowerCase() + path.sep);
  const putBin = (p, buf) => { if (!inScr(p)) throw new Error("refusing to write outside .tmp/selftest: " + p); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); return p; };
  const putJ = (p, d) => putBin(p, Buffer.from(JSON.stringify(d)));
  const SR = 48000;
  const wav = (p, sec, fn) => {
    const n = Math.round(sec * SR), b = Buffer.alloc(44 + n * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
    b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(fn(i / SR) * 32767))), 44 + i * 2);
    return putBin(p, b);
  };
  const tone = (a = 0.3) => (t) => a * Math.sin(2 * Math.PI * 180 * t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 3 * t));
  const PC = await imp("tools/prerender_check.mjs");
  /** a context with neutral stubs: only the twin under test sees real measures */
  const ctx = (o = {}) => ({ p: "zz_selftest_pre", o: "R", comp: "Zz-Selftest-Pre", root: ROOT, shortMax: 179, cutModel: null, noPixels: false, NF: 90, plan: [], wav: null, bumper: null,
    spec: { kind: "reel", frames: 90, items: [{ t: "cover" }], bumper: { id: "shelf", end: true } }, ...o,
    deps: { coverFailure: () => "", pre: { appliesToEpisode: () => false, sectionsFailures: () => [], packageFailures: () => [], questionsFailures: () => [] }, isShort: () => false, overlap: () => [],
      verifyCut: () => [], printViolations: (v) => v.map(String), bumperKnown: () => true, bumperWant: () => null, hasQuestions: () => false, seamLine: () => null,
      edgeClicks: () => [], audioGate: () => ({ ok: true, msg: "" }), recitation: () => null, listen: () => ({ ok: true, msg: "" }), probe: () => ({ ok: true, msg: "" }), black: () => ({ ok: true, msg: "" }), ...(o.deps ?? {}) } });
  const one = async (id, c) => (await PC.runTwins(c, [id])).find((x) => x.id === id) ?? null;
  /** bad must fail, good must pass, and the twin must be there */
  const pair = async (id, bad, good) => {
    const [b, g] = [await one(id, bad), await one(id, good)];
    if (!b || !g) return expect(false, `التوأم «${id}» غائب من tools/prerender_check.mjs TWINS`);
    return expect(!b.ok && g.ok, `الحالة السيئة: ${b.ok ? "✔" : "✘"} ${b.msg} | السليمة: ${g.ok ? "✔" : "✘"} ${g.msg}`);
  };
  const F = ["tools/prerender_check.mjs"];

  /* 1) the audio tail (gta6: a click in the last frame found only by final_review on the rendered file) */
  add("pre.tail", F, "post-render-discovery", "قبل الرندر: ذيل صوت المونتاج بقمة كاملة يُرفض، والذيل السليم يمرّ", async () => {
    const bad = wav(path.join(D, "tail_bad.wav"), 2, (t) => (t >= 2 - 0.01 ? -1 : tone()(t))), good = wav(path.join(D, "tail_ok.wav"), 2, tone());
    return pair("tail", ctx({ wav: bad }), ctx({ wav: good }));
  });
  /* 2) the peak */
  add("pre.peak", F, "post-render-discovery", "قبل الرندر: صوت مونتاج قمته 0 dB يُرفض", async () => {
    const bad = wav(path.join(D, "peak_bad.wav"), 1.5, (t) => (Math.sin(2 * Math.PI * 180 * t) >= 0 ? 1 : -1)), good = wav(path.join(D, "peak_ok.wav"), 1.5, tone());
    return pair("peak", ctx({ wav: bad }), ctx({ wav: good }));
  });
  /* 3) silences in the mix (a file without a cut-model map: final_review's silencedetect, the part inside the bumper excused) */
  add("pre.silence", F, "post-render-discovery", "قبل الرندر: سكتة 1ث في صوت المونتاج تُرفض، والسكتة داخل الفاصل تُعذر", async () => {
    const f = wav(path.join(D, "gap.wav"), 4, (t) => (t > 1.5 && t < 2.5 ? 0 : tone()(t)));
    const bad = await one("cut_plan", ctx({ wav: f })), excused = await one("cut_plan", ctx({ wav: f, bumper: { at: 1.4, seconds: 1.2, position: "start" } }));
    if (!bad || !excused) return expect(false, "التوأم «cut_plan» غائب");
    return expect(!bad.ok && excused.ok, `بلا فاصل: ${bad.ok ? "✔" : "✘"} ${bad.msg} | والسكتة في الفاصل: ${excused.ok ? "✔" : "✘"} ${excused.msg}`);
  });
  /* 4) a click at an edge of the mix (urwa-reel 2026-11-21: a 0.05 spike in the last 10 ms of the voice right before the end bumper; final_review's tail window saw only the bumper) */
  add("pre.edges", F, "post-render-discovery", "قبل الرندر: نقرة عند حافة في الصوت (الفاصل/المؤثر) تُرفض، والحافة الهادئة تمرّ", async () => {
    const SEAMJ = await imp("tools/join_seam_check.mjs"), floor = (t) => 0.0006 * Math.sin(2 * Math.PI * 97 * t);
    const bad = wav(path.join(D, "edge_bad.wav"), 2, (t) => (t >= 0.995 && t < 1.0 ? 0.08 * Math.sin(2 * Math.PI * 900 * t) + 0.05 : t >= 1.0 ? 0 : floor(t)));
    const good = wav(path.join(D, "edge_ok.wav"), 2, (t) => (t >= 1.0 ? 0 : floor(t) * Math.min(1, (1.0 - t) / 0.2)));
    const plan = [{ src: "a.wav", at: 0, frames: 30, trim: 0, rate: 1, vol: 0.8 }, { src: "b.mp4", at: 30, frames: 30, trim: 0, rate: 1, vol: 1 }];
    const real = { edgeClicks: (file, edges) => PC.edgeClicks(file, edges, SEAMJ) };
    const edges = PC.mixEdges(plan, 60);
    if (edges.length !== 1 || Math.abs(edges[0] - 1) > 1e-6) return expect(false, `حواف الخطة ${JSON.stringify(edges)} والمتوقع [1]`);
    return pair("edges", ctx({ wav: bad, plan, NF: 60, deps: real }), ctx({ wav: good, plan, NF: 60, deps: real }));
  });
  /* 5) the loudness */
  add("pre.loudness", F, "post-render-discovery", "قبل الرندر: صوت خافت جداً (−50 LUFS) يُرفض، والعادي يمرّ", async () => {
    const bad = wav(path.join(D, "quiet.wav"), 3, tone(0.002)), good = wav(path.join(D, "normal.wav"), 3, tone(0.3));
    return pair("loudness", ctx({ wav: bad }), ctx({ wav: good }));
  });
  /* 6) the reel joins on the mix (gta6-intro-reel: a click at a join) — the twin hands the CHECKED file to join_seam_check */
  add("pre.seams", F, "post-render-discovery", "قبل الرندر: وصلة ريل فيها نقرة في صوت المونتاج تُرفض", async () => {
    const SEAMJ = await imp("tools/join_seam_check.mjs");
    const bad = wav(path.join(D, "seam_bad.wav"), 3, (t) => (Math.abs(t - 1.5) < 0.0005 ? 0.9 : 0.02 * Math.sin(2 * Math.PI * 150 * t))), good = wav(path.join(D, "seam_ok.wav"), 3, (t) => 0.02 * Math.sin(2 * Math.PI * 150 * t));
    const seamLine = (p, file) => { const res = SEAMJ.checkFile(file, [{ t: 1.5, kind: "reel", outSrc: 1.5, inSrc: 1.5 }], []), b = res.filter((x) => x.issues.length); return { ok: !b.length, msg: b.length ? b.map((x) => SEAMJ.describe(x)).join(" · ") : "لا نقرة" }; };
    return pair("seams", ctx({ wav: bad, deps: { seamLine } }), ctx({ wav: good, deps: { seamLine } }));
  });
  /* 7) the mix is built at the picture's length */
  add("pre.audio_built", F, "post-render-discovery", "قبل الرندر: لا صوت مبني، أو صوت أقصر من الصورة، يُرفض", async () => {
    const f = wav(path.join(D, "len.wav"), 3, tone()), plan = [{ src: "a.wav", at: 0, frames: 90, trim: 0, rate: 1, vol: 0.8 }];
    const none = await one("audio", ctx({ wav: null })), short = await one("audio", ctx({ wav: f, plan, NF: 120 })), ok = await one("audio", ctx({ wav: f, plan, NF: 90 }));
    if (!none || !short || !ok) return expect(false, "التوأم «audio» غائب");
    return expect(!none.ok && !short.ok && ok.ok, `بلا صوت ${none.ok ? "✔" : "✘"}، أقصر ${short.ok ? "✔" : "✘"} (${short.msg})، مطابق ${ok.ok ? "✔" : "✘"}`);
  });
  /* 8) spec twins: cover (real coverFailure), bumper, short length, overlap, sections/package/questions, audio gate, recitation */
  add("pre.cover", [...F, "tools/cover_item.mjs"], "reels-without-cover", "قبل الرندر: مونتاج أوله ليس الغلاف يُرفض (الدالة الحقيقية)، والكرتون بلا غلاف يمرّ", async () => {
    const { coverFailure } = await imp("tools/cover_item.mjs");
    return pair("cover", ctx({ spec: { kind: "reel", frames: 90, items: [{ t: "pick", at: 0 }] }, deps: { coverFailure } }), ctx({ spec: { kind: "cartoon", frames: 90, items: [{ t: "pick", at: 0 }] }, deps: { coverFailure } }));
  });
  add("pre.bumper", F, "bumper-glued-by-render", "قبل الرندر: مونتاج بلا فاصل، أو فاصل افتتاح بعيد عن أول تحية، يُرفض", async () => {
    const none = await one("bumper", ctx({ spec: { frames: 900, items: [] } })), far = await one("bumper", ctx({ spec: { frames: 900, items: [], bumper: { id: "shelf", at: 10 } }, deps: { bumperWant: () => 20 } }));
    const near = await one("bumper", ctx({ spec: { frames: 900, items: [], bumper: { id: "shelf", at: 10 } }, deps: { bumperWant: () => 10.3 } })), unknown = await one("bumper", ctx({ spec: { frames: 900, items: [], bumper: { id: "nope", end: true } }, deps: { bumperKnown: () => false } }));
    if (!none || !far || !near || !unknown) return expect(false, "التوأم «bumper» غائب");
    return expect(!none.ok && !far.ok && !unknown.ok && near.ok, `بلا فاصل ${none.ok ? "✔" : "✘"}، بعيد ${far.ok ? "✔" : "✘"}، مجهول ${unknown.ok ? "✔" : "✘"}، قريب ${near.ok ? "✔" : "✘"}`);
  });
  add("pre.short", F, "shorts-length-without-bumper", "قبل الرندر: ريل طوله مع الفاصل فوق 179ث يُرفض", async () => pair("short", ctx({ NF: 5300 + 150 }), ctx({ NF: 5000 + 150 })));
  add("pre.spec_plumbing", F, "post-render-discovery", "قبل الرندر: التراكب والوجه، والأقسام والحزمة والأسئلة، وبوابة الصوت، والتلاوة: كل توأم حاضر ويرفض ما ترفضه بوابته", async () => {
    const no = { ok: false, msg: "✘" };
    const cases = [
      ["overlap", { overlap: () => ["✘ صورة على الوجه (طولي)"] }, {}],
      ["sections", { pre: { appliesToEpisode: () => true, sectionsFailures: () => ["لا sections.json"], packageFailures: () => [], questionsFailures: () => [] } }, { pre: { appliesToEpisode: () => true, sectionsFailures: () => [], packageFailures: () => [], questionsFailures: () => [] } }, "L"],
      ["package", { pre: { appliesToEpisode: () => true, sectionsFailures: () => [], packageFailures: () => ["لا وصف"], questionsFailures: () => [] } }, { pre: { appliesToEpisode: () => true, sectionsFailures: () => [], packageFailures: () => [], questionsFailures: () => [] } }, "L"],
      ["questions", { pre: { appliesToEpisode: () => false, sectionsFailures: () => [], packageFailures: () => [], questionsFailures: () => ["بند بلا جواب"] } }, { hasQuestions: () => true }],
      ["audio_gate", { audioGate: () => no }, {}],
      ["recitation", { recitation: () => no }, { recitation: () => ({ ok: true, msg: "✔" }) }],
      ["listen", { listen: () => ({ ok: false, msg: "«عفواً» عند 1:02" }) }, { listen: () => ({ ok: true, msg: "✔" }) }],
    ];
    const bad = [];
    for (const [id, b, g, o] of cases) { const r1 = await one(id, ctx({ o: o ?? "R", deps: b })), r2 = await one(id, ctx({ o: o ?? "R", deps: g })); if (!r1 || !r2) bad.push(`${id} غائب`); else if (r1.ok || !r2.ok) bad.push(`${id}: السيئ ${r1.ok ? "✔" : "✘"} السليم ${r2.ok ? "✔" : "✘"}`); }
    return expect(!bad.length, bad.join("؛ "));
  });
  /* 9) pixels: the risky frames and the black-frame measure (the stills themselves need the GPU engine: the probe is the judder twin) */
  add("pre.black", F, "post-render-discovery", "قبل الرندر: المواضع الخطرة تشمل أول تقسيم والمنتصف، وإطار أسود يُعرف أسود والمزخرف لا", async () => {
    const pts = PC.riskyFrames({ frames: 3000, splits: [{ from: 20, to: 30 }], behind: [{ from: 50, to: 55 }] }, "L"), names = pts.map(([n]) => n);
    const blk = path.join(D, "black.png"), lit = path.join(D, "lit.png"); fs.mkdirSync(D, { recursive: true });
    for (const [f, c] of [[blk, "black"], [lit, "0x6b4a2a"]]) spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=${c}:s=160x90`, "-frames:v", "1", f]);
    const yb = PC.meanLuma(blk), yl = PC.meanLuma(lit), withTwin = PC.TWINS.some((t) => t.id === "black" && t.pixels) && PC.TWINS.some((t) => t.id === "judder" && t.pixels);
    return expect(withTwin && ["split1", "middle", "window1", "end"].every((n) => names.includes(n)) && yb <= PC.BLACK_Y && yl > PC.BLACK_Y, `التوأمان ${withTwin ? "حاضران" : "غائبان"}، المواضع ${names.join("،")}، سطوع الأسود ${yb} والمزخرف ${yl}`);
  });
  /* 10) one builder for the check and the render: the same records give the same plan; a changed volume is a difference; the mix is the picture's length */
  add("pre.plan_same", ["tools/lib/audio_plan.mjs", "tools/gpu_render.mjs"], "post-render-discovery", "خطة الصوت واحدة للفحص والرندر: السجلات نفسها = الخطة نفسها، والفرق يُسمّى، والمزج بطول الصورة", async () => {
    const AP = await imp("tools/lib/audio_plan.mjs");
    const a = wav(path.join(D, "voice.wav"), 3, tone()), b = wav(path.join(D, "sfx.wav"), 0.5, tone(0.1));
    const url = (f) => pathToFileURL(f).href;
    const frames = (volSfx) => Array.from({ length: 90 }, (_, f) => ({ frame: f, audioAndVideoAssets: [{ type: "audio", id: "v", src: url(a), mediaFrame: f, playbackRate: 1, volume: 0.8 }, ...(f >= 30 && f < 45 ? [{ type: "audio", id: "s", src: url(b), mediaFrame: f - 30, playbackRate: 1, volume: volSfx }] : [])] }));
    const p1 = AP.planOf(AP.segmentsFromFrames(frames(0.05), 0), { root: D }), p2 = AP.planOf(AP.segmentsFromFrames(frames(0.05), 0), { root: D }), p3 = AP.planOf(AP.segmentsFromFrames(frames(0.5), 0), { root: D });
    const out = path.join(D, "mix.wav"); AP.mixToFile(AP.segmentsFromFrames(frames(0.05), 0), out, { NF: 90, fps: 30, root: D, codec: "pcm", work: path.join(D, "mixwork") });
    const d = PC.duration(out), gr = fs.readFileSync(path.join(ROOT, "tools", "gpu_render.mjs"), "utf8");
    const shared = /AP\.segmentsFromFrames\(frames, start\)/.test(gr) && /AP\.mixToFile\(segs, audio/.test(gr) && !/const open = new Map\(\), segs = \[\]/.test(gr);
    return expect(!AP.comparePlans(p1, p2).length && AP.comparePlans(p1, p3).length === 1 && Math.abs(d - 3) < 0.03 && shared, `نفس الخطة ${AP.comparePlans(p1, p2).length} فرق، حجم مختلف ${AP.comparePlans(p1, p3).length} فرق، طول المزج ${d.toFixed(3)}ث، الرندر يستعمل المكتبة: ${shared ? "نعم" : "لا"}`);
  });
  /* 11) the gate: fresh only while nothing it measured changed; the render muxes the checked file on the same plan, says «عيب في البرنامج» on another */
  const gateRoot = (name) => {
    const r = path.join(D, name), p = "zz";
    putJ(path.join(r, "data", "specs", `${p}.json`), { frames: 90, kind: "reel" });
    const w = wav(path.join(r, ".tmp", p, "prerender", "audio_R.wav"), 3, tone()), src = wav(path.join(r, "public", "zz_voice.wav"), 3, tone());
    return { r, p, w, src };
  };
  const writeRec = async (g, { ok = true, twins = [{ id: "tail", label: "ذيل الصوت بلا نقرة", ok: true }] } = {}) => {
    const G = await imp("tools/lib/prerender_gate.mjs"), AP = await imp("tools/lib/audio_plan.mjs");
    const plan = [{ src: "public/zz_voice.wav", at: 0, frames: 90, trim: 0, rate: 1, vol: 0.8 }];
    putJ(G.recordFile(g.p, g.r), { p: g.p, spec: G.sha(path.join(g.r, "data", "specs", `${g.p}.json`)), side: G.sideStamp(g.p, g.r), orients: { R: { ok, plan, planStamp: AP.inputStamp(plan, g.r), wav: `.tmp/${g.p}/prerender/audio_R.wav`, wavStamp: G.stampOf(g.w), wavSha: G.sha(g.w), twins } } });
    return { G, plan };
  };
  add("pre.fresh", ["tools/lib/prerender_gate.mjs", "tools/render_queue.mjs", "tools/gpu_render.mjs"], "post-render-discovery", "الطابور والرندر الكامل يرفضان بلا فحص ما قبل الرندر حديث: تغيّر المواصفة أو مصدر صوت أو فشل توأم = مرفوض", async () => {
    const g = gateRoot("fresh"); const { G } = await writeRec(g);
    const f1 = G.freshness(g.p, "R", { root: g.r }), fL = G.freshness(g.p, "L", { root: g.r });
    wav(g.src, 3, tone(0.25)); const f2 = G.freshness(g.p, "R", { root: g.r });
    await writeRec(g); putJ(path.join(g.r, "data", "specs", `${g.p}.json`), { frames: 91, kind: "reel" }); const f3 = G.freshness(g.p, "R", { root: g.r });
    const g2 = gateRoot("fresh_fail"); await writeRec(g2, { ok: false, twins: [{ id: "tail", label: "ذيل الصوت", ok: false }] }); const f4 = G.freshness(g2.p, "R", { root: g2.r });
    const none = G.freshness("zz_none", "R", { root: g.r });
    const rq = fs.readFileSync(path.join(ROOT, "tools", "render_queue.mjs"), "utf8"), gr = fs.readFileSync(path.join(ROOT, "tools", "gpu_render.mjs"), "utf8");
    const wired = /const admit = [\s\S]*?let fr = prerenderFresh\(spec, orient\);[\s\S]*?if \(!fr\.ok\) bad\.unshift[\s\S]*?return bad\.length/.test(rq) && /freshness\(sid, PO, \{ root \}\); if \(!fr\.ok\) \{[\s\S]{0,300}process\.exit\(1\)/.test(gr) && gr.indexOf("freshness(sid, PO") < gr.indexOf("acquireRenderLock(");
    return expect(f1.ok && !fL.ok && !f2.ok && !f3.ok && !f4.ok && !none.ok && wired, `حديث ${f1.ok ? "✔" : "✘ " + f1.why}، عرضي غير مفحوص ${fL.ok ? "✔" : "✘"}، مصدر تغيّر ${f2.ok ? "✔" : "✘"}، مواصفة تغيّرت ${f3.ok ? "✔" : "✘"}، توأم فاشل ${f4.ok ? "✔" : "✘"}، لا سجل ${none.ok ? "✔" : "✘"}، موصول بالطابور والرندر: ${wired ? "نعم" : "لا"}`);
  });
  add("pre.mux", ["tools/lib/prerender_gate.mjs", "tools/gpu_render.mjs"], "post-render-discovery", "الرندر يأخذ الصوت المفحوص بخطته نفسها، وخطة أخرى = «عيب في البرنامج لا في الحلقة»", async () => {
    const g = gateRoot("mux"); const { G, plan } = await writeRec(g);
    const same = G.verifiedAudio(g.p, "R", plan, { root: g.r }), other = G.verifiedAudio(g.p, "R", [{ ...plan[0], vol: 0.5 }], { root: g.r });
    const gr = fs.readFileSync(path.join(ROOT, "tools", "gpu_render.mjs"), "utf8"), wired = /verifiedAudio\(BSPEC_ID[\s\S]{0,400}v\.file[\s\S]{0,200}audioFrom = "prerender"/.test(gr);
    return expect(same.file && path.resolve(same.file) === path.resolve(g.w) && other.fault?.[0]?.includes(G.PROGRAM_FAULT) && wired, `الخطة نفسها: ${same.file ? "الملف المفحوص" : same.fault?.join(" ")}؛ خطة أخرى: ${other.fault?.[0] ?? "لا عيب"}؛ الرندر موصول: ${wired ? "نعم" : "لا"}`);
  });
  add("pre.program_fault", ["tools/lib/prerender_gate.mjs", "tools/final_review.mjs"], "post-render-discovery", "الفحص النهائي يقول «عيب في البرنامج لا في الحلقة» حين يفشل فيما نجح قبل الرندر، ولا يقولها لما فشل قبله", async () => {
    const g = gateRoot("fault"); const { G } = await writeRec(g, { twins: [{ id: "tail", label: "ذيل الصوت بلا نقرة", ok: true }, { id: "seams", label: "وصلات الريل", ok: false }] });
    const lines = G.programFaults(g.p, "R", ["tail", "seams"], { root: g.r });
    const fr = fs.readFileSync(path.join(ROOT, "tools", "final_review.mjs"), "utf8");
    const ids = ["bumper", "short", "cover", "sections", "package", "questions", "seams", "audio", "audio_gate", "judder", "cut_plan", "peak", "tail"].filter((id) => !fr.includes(`addI("${id}"`));
    const wired = /programFaults\(gateName,/.test(fr) && !ids.length;
    return expect(lines.length === 1 && lines[0].includes(G.PROGRAM_FAULT) && lines[0].includes("ذيل الصوت") && wired, `السطور: ${lines.join(" | ") || "لا شيء"}؛ أسماء ناقصة في الفحص النهائي: ${ids.join("، ") || "لا"}؛ موصول: ${wired ? "نعم" : "لا"}`);
  });
};
