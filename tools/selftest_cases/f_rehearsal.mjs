// Self-test cases: the dress rehearsal (tools/rehearsal.mjs, user 2026-11-21: «النص ساعة هذا الحد الأعلى» — engine bugs must not first appear on his real episode).
// Ledger id: engine-bug-on-real-episode. Only the DRY-RUN PLAN is tested (a real run takes many minutes and renders on the card): the plan is the same list
// `run` executes, so a stage that drops out, a render that leaves .tmp/rehearsal/out, a purge that reaches beyond zz_rehearsal*, or a call of the approval purge
// fails here. Nothing is written: the dry run must leave data/rehearsal/times.jsonl and .tmp/rehearsal/progress.json as they were.
export default async (api) => {
  const { add, expect, runAsync, ROOT, NODE, path, fs } = api;
  const T = "tools/rehearsal.mjs", L = "engine-bug-on-real-episode";
  const plan = async (...a) => { const x = await runAsync(NODE, [path.join(ROOT, T), "--dry-run", "--json", ...a], { cwd: ROOT, timeout: 20000 }); try { return JSON.parse(x.out); } catch { return { err: (x.err || x.out).slice(-200) }; } };
  const cmdText = (pl) => pl.stages.flatMap((s) => s.cmds.map((c) => (Array.isArray(c) ? c.join(" ") : c))).join("\n");
  const FORBID = [/montage_guard\.mjs end/, /approve_purge/, /جاهز/, /C:[\\/]Users/i, /upload|publish_queue\.mjs|yt_upload/i, /hk_restart|studio/i];

  add("rehearsal.plan_full", T, L, "خطة التجربة الكاملة: كل المراحل بترتيبها، مشروع معزول، رندر حقيقي إلى مجلد التجربة لا «جاهز»، وتنظيف خاص في آخرها", async () => {
    const pl = await plan(); if (!pl.stages) return expect(false, `لا خطة: ${pl.err}`);
    const ids = pl.stages.map((s) => s.id), want = ["setup", "prep", "proposal", "cut", "smooth", "scans", "spec", "reel", "build", "check_land", "check_reel", "prerender", "render_land", "render_reel", "final_review", "purge"];
    const txt = cmdText(pl), bad = FORBID.filter((re) => re.test(txt)).map(String);
    const renders = pl.stages.filter((s) => /^render_/.test(s.id)).flatMap((s) => s.cmds.map((c) => c.join(" ")));
    const hard = pl.stages.filter((s) => s.hard).map((s) => s.id).join(",");
    const opt = pl.stages.filter((s) => s.optional).map((s) => s.optional).sort().join(",");
    return expect(pl.project === "zz_rehearsal" && JSON.stringify(ids) === JSON.stringify(want) && !bad.length && renders.length === 2 && renders.every((c) => /render_project\.sh zz_rehearsal\S* .* \.tmp\/rehearsal\/out$/.test(c))
      && hard === "setup,prep,proposal,cut,spec" && opt === "tools/montage_build.mjs,tools/prerender_check.mjs" && /stage\.mjs prep zz_rehearsal \.tmp\/rehearsal\/source\.mp4/.test(txt),
      `المراحل ${ids.join(",")}؛ ممنوع في الأوامر: ${bad.join(" ") || "—"}؛ الرندر: ${renders.join(" | ")}؛ الصلبة ${hard}؛ الاختيارية ${opt}`);
  });

  add("rehearsal.plan_quick", T, L, "التجربة السريعة: بلا رندر كامل ولا فحص نهائي، نوافذ معاينة بنصف الحجم بلا فاصل؛ و--keep يسقط التنظيف وحده", async () => {
    const [q, k] = await Promise.all([plan("--quick"), plan("--keep")]); if (!q.stages || !k.stages) return expect(false, `لا خطة: ${q.err ?? k.err}`);
    const qi = q.stages.map((s) => s.id), prev = q.stages.filter((s) => /^preview_/.test(s.id)).flatMap((s) => s.cmds.map((c) => c.join(" ")));
    const ki = k.stages.map((s) => s.id);
    return expect(q.mode === "quick" && !qi.some((id) => /^render_|final_review/.test(id)) && prev.length === 2 && prev.every((c) => /gpu_render\.mjs .*--start .*--no-bumper --scale 0\.5/.test(c) && /\.tmp\/rehearsal\/out\//.test(c)) && qi.at(-1) === "purge"
      && !ki.includes("purge") && ki.includes("render_land"), `السريعة ${qi.join(",")}؛ النوافذ ${prev.join(" | ")}؛ مع --keep ${ki.join(",")}`);
  });

  add("rehearsal.dry_writes_nothing", T, L, "الخطة بلا تشغيل لا تكتب شيئاً: سجل الأوقات وملف التقدم كما هما", async () => {
    const st = (f) => { try { const s = fs.statSync(path.join(ROOT, f)); return `${s.size}:${s.mtimeMs}`; } catch { return "none"; } };
    const F = ["data/rehearsal/times.jsonl", ".tmp/rehearsal/progress.json"], before = F.map(st);
    await plan(); await plan("--quick");
    const after = F.map(st); return expect(JSON.stringify(before) === JSON.stringify(after), `تغيّر: ${F.filter((f, i) => before[i] !== after[i]).join("، ")}`);
  });

  /* the first engine bug the rehearsal found (2026-11-21, ledger stage-autofix-own-lock): the audio gate's re-cut child hit the lock its own parent holds.
     Read as source (running a cut needs a real project): the lock is skipped exactly for that child, and the re-cut still marks its child with the variable. */
  add("rehearsal.autofix_lock", "tools/stage.mjs", "stage-autofix-own-lock", "القص الثاني الذي تطلقه بوابة الصوت داخل الأمر نفسه لا يصطدم بقفل أبيه", async () => {
    const s = fs.readFileSync(path.join(ROOT, "tools", "stage.mjs"), "utf8");
    const lockLine = s.split("\n").find((l) => l.includes("lock(`stage_${p}`)")) ?? "", spawnSet = /STAGE_CUT_AUTOFIX: "1"/.test(s);
    return expect(/stage === "cut" && process\.env\.STAGE_CUT_AUTOFIX === "1"\) && !lock\(`stage_\$\{p\}`\)/.test(lockLine) && spawnSet, `سطر القفل: ${lockLine.slice(0, 160)}؛ الابن معلَّم: ${spawnSet}`);
  });

  add("rehearsal.scope", T, L, "التنظيف لا يمس إلا zz_rehearsal* (لا الفيديو الثابت ولا سجل الأوقات ولا مشروعاً حقيقياً)، وملفات المحرك تقترح التجربة", async () => {
    const { pathToFileURL } = await import("node:url"); const { ownName, isEngineFile } = await import(pathToFileURL(path.join(ROOT, T)).href);
    const yes = ["zz_rehearsal", "zz_rehearsal-reel_cut_s.mp4", "Zz_rehearsal-Reel", "gpu_render_Zz_rehearsal-L_2026.json", "zz-rehearsal_map.json"], no = ["rehearsal", "times.jsonl", "source.mp4", "anchor-kills-children", "zz_selftest_x", "rehearsal_notes"];
    const eYes = ["tools/stage.mjs", "tools/gpu_render.mjs", "tools/gpu/render_project.sh", "tools/transcribe_vad_segments.py", "src/MontageSpec.tsx", "tools/montage_build.mjs"], eNo = ["tools/hk_inbox.mjs", "tools/set_title.mjs", "data/specs/x.json"];
    const w = [...yes.filter((n) => !ownName(n)).map((n) => `لا يلتقط ${n}`), ...no.filter(ownName).map((n) => `يلتقط ${n}`), ...eYes.filter((f) => !isEngineFile(f)).map((f) => `ليس محركاً: ${f}`), ...eNo.filter(isEngineFile).map((f) => `محرك خطأً: ${f}`)];
    return expect(!w.length, w.join("، "));
  });
};
