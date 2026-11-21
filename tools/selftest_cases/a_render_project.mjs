// GUARD SELF-TEST CASES — render, project folder, Studio, services, hooks wiring, Shorts length (user 2026-11-21: «نعم» to tests for the untested guards).
// Loaded by tools/guard_selftest.mjs (api = its helpers). Everything runs on scratch inputs under .tmp/selftest/<run>/:
//   - tools that take ROOT from their own place (project.mjs, prepend_bumper.mjs, short_limit.mjs, reel_from_episode.mjs, hk_restart.mjs) run as a COPY in a
//     scratch root, so their ROOT is that folder;
//   - tools that work in their cwd (final_review.mjs, grid_sheet.mjs) run from the real file with a scratch cwd; coverage_check.mjs reads only (scratch spec);
//   - render_job.sh is never run (it renders): its two guard snippets are cut out of the real file and run on a scratch spec / gate.
// Ledger ids: hooks-not-wired-session-folder, bumper-orig-shared-folder, portrait-judder-wrong-camera, final-review-bumper-size-after-remux,
//             studio-restarted-under-review, idle-services-cpu-fallback, shorts-length-without-bumper.
import net from "node:net";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export default async (api) => {
  const { add, expect, put, hook, runAsync, RUN, ROOT, NODE, path, fs } = api;
  const R = (...a) => path.join(ROOT, ...a);
  const src = (rel) => fs.readFileSync(R(rel), "utf8");
  const norm = (s) => String(s).replace(/\\/g, "/");
  /** a scratch root holding copies of these workspace files (their ROOT = the scratch root) */
  const copyRoot = (name, files) => { const r = path.join(RUN, name); for (const f of files) { fs.mkdirSync(path.dirname(path.join(r, f)), { recursive: true }); fs.copyFileSync(R(f), path.join(r, f)); } return r; };
  const imp = (f) => import(pathToFileURL(f).href + `?t=${Date.now()}_${Math.random()}`);
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  const killQuiet = (pid) => { try { if (pid) process.kill(pid); } catch { /* gone */ } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /** a tiny portrait mp4 of `sec` seconds with a silent audio track (16×32 at 1 fps, 8 kHz: CPU, milliseconds; no GPU) — memoised per length */
  const vids = new Map();
  const portraitVideo = (sec) => { if (!vids.has(sec)) { const f = path.join(RUN, "a_media", `portrait_${sec}.mp4`); fs.mkdirSync(path.dirname(f), { recursive: true });
    vids.set(sec, runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=16x32:r=1", "-f", "lavfi", "-i", "anullsrc=r=8000:cl=mono", "-t", String(sec), "-c:v", "mpeg4", "-c:a", "aac", "-b:a", "16k", f], { timeout: 20000 })
      .then((x) => { if (x.status !== 0 || !fs.existsSync(f)) throw new Error("ffmpeg: " + x.err.slice(-120)); return f; })); }
    return vids.get(sec); };

  /* ── 1) HOOKS WIRED IN THE SESSION FOLDER (ledger hooks-not-wired-session-folder, 2026-11-20: a session in E:\apps\New remotion ran with NO hook) ── */
  const HL = "hooks-not-wired-session-folder", HA = "tools/lib/hooks_alive.mjs";
  add("hooks.heartbeat_written", ["tools/hooks/guard.mjs", HA], HL, "الحارس يكتب نبضه في كل تشغيل، ونبض حديث = جلسة محروسة، وقديم (3 د) أو مفقود = غير محروسة", async () => {
    const r = api.mkRoot("hooks_beat"), t0 = Date.now();
    await hook(r, "prompt", { prompt: "مرحبا", cwd: r, session_id: "selftest-beat" });
    let hb = null; try { hb = JSON.parse(fs.readFileSync(path.join(r, ".tmp", "hooks_alive.json"), "utf8")); } catch { /* none */ }
    const { hooksAlive } = await imp(R(HA));
    const fresh = hooksAlive(r);
    put(path.join(r, ".tmp", "hooks_alive.json"), { at: Date.now() - 180e3, mode: "prompt" }); const old = hooksAlive(r);
    fs.rmSync(path.join(r, ".tmp", "hooks_alive.json")); const none = hooksAlive(r);
    return expect(hb && hb.at >= t0 - 1000 && hb.mode === "prompt" && hb.session === "selftest-beat" && fresh && !old && !none,
      !hb ? "الحارس لم يكتب نبضاً في .tmp/hooks_alive.json" : !(hb.mode === "prompt" && hb.session === "selftest-beat") ? `نبض بلا نوع أو جلسة: ${JSON.stringify(hb).slice(0, 80)}` : !fresh ? "نبض حديث لم يُعدّ حياً" : old ? "نبض عمره 3 دقائق عُدّ حياً" : "بلا نبض عُدّت الجلسة محروسة");
  });
  add("hooks.kickoff_uses_beat", ["tools/montage_kickoff.mjs", HA], HL, "المصدر: أمر الإطلاق يحكم بالنبض نفسه ويعلن «الهوكات لا تعمل» بلا نبض حديث (التشغيل يطلق مونتاجاً فلا يُشغَّل)", async () => {
    const s = src("tools/montage_kickoff.mjs");
    return expect(/import \{ hooksAlive \} from "\.\/lib\/hooks_alive\.mjs"/.test(s) && /const hooksOk = hooksAlive\("\."\)/.test(s) && /hooksOk \? "✔ الهوكات تعمل[^"]*" : `⛔ الهوكات لا تعمل/.test(s),
      "أمر الإطلاق لم يعد يقرأ النبض أو لا يعلن الجلسة غير المحروسة");
  });
  /** the four events wired to the workspace guard with their mode; the tool events cover Bash/Write/Edit */
  const wiringFailures = (j) => {
    const bad = [], want = { UserPromptSubmit: "prompt", PreToolUse: "pre", PostToolUse: "post", Stop: "stop" };
    for (const [ev, mode] of Object.entries(want)) {
      const hs = (j?.hooks?.[ev] ?? []).flatMap((m) => (m.hooks ?? []).map((h) => ({ m: m.matcher ?? "", c: String(h.command ?? "") })));
      const g = hs.find((h) => new RegExp(`(^|\\s)node\\s+"?${norm(R("tools", "hooks", "guard.mjs")).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?\\s+${mode}(\\s|$)`, "i").test(norm(h.c)));
      if (!g) { bad.push(`${ev} غير موصول بـguard.mjs ${mode}`); continue; }
      if (ev.endsWith("ToolUse") && !["Bash", "Write", "Edit"].every((t) => g.m.split("|").includes(t))) bad.push(`${ev} لا يطابق Bash|Write|Edit (${g.m})`);
    }
    return bad;
  };
  add("hooks.settings_wired", [".claude/settings.json", HA], HL, "الإعدادان (مجلد العمل ومجلد الجلسة E:\\apps\\New remotion) يصلان الأحداث الأربعة بالحارس، وقواعد مجلد العمل مستوردة هناك", async () => {
    const bad = [];
    for (const f of [R(".claude", "settings.json"), "E:/apps/New remotion/.claude/settings.json"]) { let j = null; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { bad.push(`${f}: لا يُقرأ (${e.code ?? "JSON"})`); continue; } for (const b of wiringFailures(j)) bad.push(`${f}: ${b}`); }
    let md = ""; try { md = fs.readFileSync("E:/apps/New remotion/CLAUDE.md", "utf8"); } catch { /* none */ }
    if (!/^@S:\/AI_Tools\/Remotion_Workspace\/CLAUDE\.md\s*$/m.test(md)) bad.push("E:/apps/New remotion/CLAUDE.md لا يستورد قواعد مجلد العمل");
    // the checker itself must catch a missing event (so a silent pass is impossible)
    if (!wiringFailures({ hooks: {} }).length) bad.push("فاحص الوصل لا يرى إعداداً فارغاً");
    return expect(!bad.length, bad.join(" | "));
  });

  /* ── 2) THE BUMPER-FREE COPY BELONGS TO ITS PROJECT (ledger bumper-orig-shared-folder, 2026-11-20: the Hiraba copy survived its deletion in .tmp/bumper_orig) ── */
  const BL = "bumper-orig-shared-folder";
  add("bumper.orig_found_by_project", ["tools/project.mjs", "tools/lib/projdir.mjs"], BL, "حذف المشروع يجد نسخته بلا فاصل: في مجلده، وفي المجلد المشترك القديم بالاسم وبسجل الفاصل (orig وoriginalSize)، ولا يأخذ نسخة مشروع آخر", async () => {
    const r = copyRoot("bumper_proj", ["tools/project.mjs", "tools/lib/projdir.mjs"]), bo = path.join(r, ".tmp", "bumper_orig");
    put(path.join(r, "data", "specs", "zzbo.json"), { id: "zzbo", kind: "episode" });
    put(path.join(r, ".tmp", "zzbo", "bumper_orig", "Zzbo-R.mp4"), "a");
    put(path.join(bo, "hyb_zzbo_R.mp4"), "bb");
    put(path.join(bo, "عنوان الحلقة.mp4"), "ccc");
    put(path.join(bo, "titled_by_size.mp4"), "x".repeat(777));
    put(path.join(bo, "zzother_R.mp4"), "y".repeat(778));
    put(path.join(r, ".tmp", "gates", "zzbo.bumper.json"), { orig: ".tmp/bumper_orig/عنوان الحلقة.mp4" });
    put(path.join(r, ".tmp", "gates", "hyb_zzbo_L.bumper.json"), { originalSize: 777 });
    const x = await runAsync(NODE, [path.join(r, "tools", "project.mjs"), "ls", "zzbo"], { cwd: r }), o = norm(x.out);
    const want = [".tmp/zzbo", ".tmp/bumper_orig/hyb_zzbo_R.mp4", ".tmp/bumper_orig/عنوان الحلقة.mp4", ".tmp/bumper_orig/titled_by_size.mp4"], miss = want.filter((w) => !o.includes(w));
    return expect(x.status === 0 && !miss.length && !o.includes("zzother_R"), x.status !== 0 ? `انهار (خروج ${x.status}): ${(x.err || x.out).trim().slice(0, 120)}` : miss.length ? `لم يجد: ${miss.join("، ")}` : "أخذ نسخة مشروع آخر");
  });
  add("bumper.orig_written_per_project", ["tools/prepend_bumper.mjs", "tools/gpu_render.mjs", "tools/lib/projdir.mjs"], BL, "النسخة بلا فاصل تُكتب في .tmp/<المشروع>/bumper_orig: مكانها محسوب على جذر وهمي، والكاتبان يستعملانه (المصدر: تشغيلهما رندر)", async () => {
    const r = copyRoot("bumper_projtmp", ["tools/lib/projdir.mjs"]); put(path.join(r, "data", "specs", "zzbo.json"), { id: "zzbo" });
    const { projTmp } = await imp(path.join(r, "tools", "lib", "projdir.mjs"));
    const got = norm(path.relative(r, projTmp("Zzbo-L", "bumper_orig"))), got2 = norm(path.relative(r, projTmp("zzbo-reel", "bumper_orig")));
    const pb = src("tools/prepend_bumper.mjs"), gr = src("tools/gpu_render.mjs");
    const pbOk = /const keep = \(await import\("\.\/lib\/projdir\.mjs"\)\)\.projTmp\(name, "bumper_orig"\)/.test(pb) && /moveFile\(file, path\.join\(keep, /.test(pb) && !/["'`]\.tmp[\\/]+bumper_orig/.test(pb) && !/"\.tmp", "bumper_orig"/.test(pb);
    const grOk = /const PROJ = \(await import\("\.\/lib\/projdir\.mjs"\)\)\.projTmp\(compId\)/.test(gr) && /keepDir = path\.join\(PROJ, "bumper_orig"\)/.test(gr) && /orig = path\.join\(keepDir, /.test(gr) && !/"\.tmp", "bumper_orig"/.test(gr);
    return expect(got === ".tmp/zzbo/bumper_orig" && got2 === ".tmp/zzbo/bumper_orig" && pbOk && grOk, got !== ".tmp/zzbo/bumper_orig" || got2 !== ".tmp/zzbo/bumper_orig" ? `المكان المحسوب ${got} / ${got2}` : !pbOk ? "prepend_bumper لم يعد يكتب في مجلد المشروع" : "gpu_render لم يعد يكتب في مجلد المشروع");
  });

  /* ── 3) render_job.sh guards, run from the real file without rendering ── */
  const RJ = "tools/render_job.sh";
  const cut = (s, open, close) => { const a = s.indexOf(open); if (a < 0) return null; const b = s.indexOf(close, a + open.length); return b < 0 ? null : s.slice(a + open.length, b); };
  const CAM_OPEN = `read -r cx2 camavoid <<<"$(node -e '`;
  const camRun = async (specF, t) => { const code = cut(src(RJ), CAM_OPEN, `')"`); if (!code) return null; const js = code.split(`'$spec'`).join(norm(specF)).split(`'$freeat'`).join(String(t)); const x = await runAsync(NODE, ["-e", js]); return x.out.trim(); };
  add("judder.camera_at_window", RJ, "portrait-judder-wrong-camera", "فحص ارتجاف الطولي: الكاميرا هي التي تغطي نافذة الفحص لا الأطول، ومقاطع الكاميرات الأخرى تُتجنَّب (المقطع من render_job.sh على مواصفة وهمية؛ الرندر لا يُشغَّل)", async () => {
    // the end-to-end failure of 2026-11-20: the longest camera 1404, the window at 39.7 s under the other camera 990
    const specF = put(path.join(RUN, "judder", "zzcam.json"), { id: "zzcam", frames: 120 * 30, cams: [{ cx: 1404, from: 0, to: 35 }, { cx: 990, from: 35, to: 45 }, { cx: 1404, from: 45, to: 200 }] });
    const atOther = await camRun(specF, 39.7), atLong = await camRun(specF, 10);
    const s = src(RJ), iR = s.indexOf(`if [ "$o" = R ]; then`), iFw = s.indexOf("fw=$(node tools/free_windows.mjs"), iCam = s.indexOf(CAM_OPEN), iSx = s.indexOf(`sx=$(node -e "console.log(Math.round($cx-163))")`);
    const wired = iFw > 0 && iFw < iR && iR < iCam && iCam < iSx && s.slice(iCam, iSx).includes(`[ -n "$cx2" ] && cx=$cx2`) && s.slice(iCam, iSx).includes(`avoid="\${avoid:+$avoid,}$camavoid"`);
    return expect(atOther === "990 0.00-35.50,44.50-120.50" && atLong === "1404 34.50-45.50" && wired,
      atOther == null ? "مقطع اختيار الكاميرا اختفى من render_job.sh" : atOther !== "990 0.00-35.50,44.50-120.50" ? `النافذة تحت 990 أعطت «${atOther}»` : atLong !== "1404 34.50-45.50" ? `النافذة تحت 1404 أعطت «${atLong}»` : "اختيار الكاميرا لم يعد يغيّر cx أو قائمة التجنب قبل القص");
  });
  const FS = "final-review-bumper-size-after-remux", REMUX_OPEN = `[ -s "$out" ] && node -e '`;
  add("bumper.record_after_remux", RJ, FS, "بعد إعادة التغليف يُكتب في سجل الفاصل الملف المسلَّم وحجمه الجديد (المقطع من render_job.sh على سجل وهمي)، وموضعه بعد إعادة التغليف وقبل فحص الارتجاف", async () => {
    const s = src(RJ), code = cut(s, REMUX_OPEN, `' "$out"`);
    if (!code) return expect(false, "مقطع تحديث سجل الفاصل اختفى من render_job.sh");
    const d = path.join(RUN, "remux"), js = code.split(`'"$p"'`).join("zzrx").split(`'"$o"'`).join("R");
    put(path.join(d, ".tmp", "gates", "hyb_zzrx_R.bumper.json"), { inMontage: true, title: "فاصل وهمي", seconds: 5, size: 11 });
    const out = put(path.join(d, "export", "R", "زز.mp4"), "z".repeat(1234));
    const x = await runAsync(NODE, ["-e", js, out], { cwd: d });
    let g = {}; try { g = JSON.parse(fs.readFileSync(path.join(d, ".tmp", "gates", "hyb_zzrx_R.bumper.json"), "utf8")); } catch { /* none */ }
    const iMux = s.indexOf("-movflags +faststart \"$out\""), iRec = s.indexOf(REMUX_OPEN), iJud = s.indexOf("node tools/judder_check.mjs");
    return expect(x.status === 0 && g.size === 1234 && norm(g.file) === norm(out) && iMux > 0 && iMux < iRec && iRec < iJud,
      x.status !== 0 ? `انهار: ${x.err.slice(0, 100)}` : g.size !== 1234 ? `الحجم في السجل ${g.size} والملف المسلَّم 1234` : norm(g.file) !== norm(out) ? "السجل لا يسمّي الملف المسلَّم" : "تحديث السجل ليس بين إعادة التغليف وفحص الارتجاف");
  });
  add("bumper.final_review_by_size", "tools/final_review.mjs", FS, "الفحص النهائي يجد سجل الفاصل بحجم الملف وإن اختلف اسمه، ولا يأخذ سجلاً بحجم آخر", async () => {
    const run1 = async (name, sz) => { const d = path.join(RUN, name), f = put(path.join(d, "delivered.mp4"), "v".repeat(4321));
      put(path.join(d, ".tmp", "gates", "hyb_zzfr_R.bumper.json"), { title: "فاصل وهمي", seconds: 5, size: sz, position: "start", at: 0 });
      return runAsync(NODE, [R("tools", "final_review.mjs"), f], { cwd: d }); };
    const [hit, miss] = await Promise.all([run1("fr_hit", 4321), run1("fr_miss", 4322)]);
    return expect(/منها فاصل الافتتاح «فاصل وهمي» 5ث/.test(hit.out) && !/فاصل الافتتاح/.test(miss.out),
      !/فاصل الافتتاح/.test(hit.out) ? `لم يجد السجل بالحجم: ${hit.out.trim().split("\n").find((l) => /المدة/.test(l)) ?? (hit.err || hit.out).slice(0, 100)}` : "أخذ سجلاً بحجم آخر");
  });

  /* ── 4) THE STUDIO STAYS UP (ledger studio-restarted-under-review, 2026-11-20: a blank Studio page under him) ── */
  const freePort = (port) => new Promise((res) => { const s = net.createServer(); s.once("error", () => res(false)); s.listen(port, "127.0.0.1", () => s.close(() => res(true))); });
  const listenDummy = (port) => new Promise((res) => {
    const c = spawn(NODE, ["-e", `require("net").createServer(()=>{}).listen(${port},"127.0.0.1",()=>console.log("up"));setTimeout(()=>process.exit(0),30000)`], { stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
    c.stdout.once("data", () => res(c)); c.once("exit", () => res(c));
  });
  add("studio.hk_restart_tools_only", "tools/hk_restart.mjs", "studio-restarted-under-review", "إعادة خادم الأدوات: الاستوديو (عملية وهمية على منفذ حر) يبقى حياً، والخادم القديم وحده يُوقف ويقوم جديد", async () => {
    let sp = 0; for (let i = 0; i < 40 && !sp; i++) { const p = 42000 + Math.floor(Math.random() * 1800); if ((await freePort(p)) && (await freePort(p + 99))) sp = p; }
    if (!sp) return expect(false, "لا منفذ حر للتجربة");
    const r = copyRoot("hk_restart", ["tools/hk_restart.mjs"]), pidF = path.join(r, "new_server.pid");
    put(path.join(r, "tools", "hk_server.mjs"), `import fs from "node:fs"; import http from "node:http";
const [port, studio] = process.argv.slice(2).map(Number);
http.createServer((q, s) => s.end("ok")).listen(port, "127.0.0.1", () => fs.writeFileSync(${JSON.stringify(pidF)}, JSON.stringify({ pid: process.pid, studio })));
setTimeout(() => process.exit(0), 20000);
`);
    const studio = await listenDummy(sp), oldSrv = await listenDummy(sp + 99);
    let newPid = 0;
    try {
      const x = await runAsync(NODE, [path.join(r, "tools", "hk_restart.mjs"), String(sp)], { cwd: r, timeout: 15000 });
      let nw = {}; try { nw = JSON.parse(fs.readFileSync(pidF, "utf8")); newPid = nw.pid; } catch { /* not started */ }
      for (let i = 0; i < 10 && alive(oldSrv.pid); i++) await sleep(50);
      const sAlive = alive(studio.pid), oGone = !alive(oldSrv.pid), nOk = newPid && alive(newPid) && newPid !== oldSrv.pid && nw.studio === studio.pid;
      return expect(x.status === 0 && sAlive && oGone && nOk, !sAlive ? "أُوقف الاستوديو" : !oGone ? "الخادم القديم لم يُوقف" : !nOk ? `الخادم الجديد لم يقم مربوطاً بالاستوديو (خروج ${x.status}: ${(x.err || x.out).trim().slice(0, 80)})` : `خروج ${x.status}`);
    } finally { killQuiet(newPid); killQuiet(oldSrv.pid); killQuiet(studio.pid); }
  });

  /* ── 5) NO SILENT CPU FALLBACK (ledger idle-services-cpu-fallback, 2026-11-19: browser stills ran on the CPU for 12+ minutes) ── */
  add("grid.no_cpu_fallback", "tools/grid_sheet.mjs", "idle-services-cpu-fallback", "فشل محرك كرت الشاشة يوقف ورقة الشبكة بخطأ ظاهر ولا يسقط إلى لقطات المتصفح، إلا بـGRID_BROWSER_FALLBACK=1 عمداً (محرك ولقطات وهميان)", async () => {
    const mk = (name) => { const d = path.join(RUN, name);
      put(path.join(d, "tools", "gpu_render.mjs"), "process.exit(3);\n");
      put(path.join(d, "tools", "stills.mjs"), `import fs from "node:fs"; fs.writeFileSync(${JSON.stringify(path.join(d, "stills_called"))}, "1");\n`);
      return { d, spec: put(path.join(d, "spec.json"), { id: "zzgrid", frames: 300, fps: 30, items: [] }) }; };
    const env = { ...process.env }; delete env.GRID_BROWSER_FALLBACK;
    const a = mk("grid_strict"), b = mk("grid_fallback");
    const [xa, xb] = await Promise.all([runAsync(NODE, [R("tools", "grid_sheet.mjs"), "Zzgrid-R", a.spec], { cwd: a.d, env }), runAsync(NODE, [R("tools", "grid_sheet.mjs"), "Zzgrid-R", b.spec], { cwd: b.d, env: { ...env, GRID_BROWSER_FALLBACK: "1" } })]);
    const calledA = fs.existsSync(path.join(a.d, "stills_called")), calledB = fs.existsSync(path.join(b.d, "stills_called"));
    return expect(xa.status === 1 && /no CPU fallback/.test(xa.err) && !calledA && calledB,
      calledA ? "سقط صامتاً إلى لقطات المتصفح" : xa.status !== 1 || !/no CPU fallback/.test(xa.err) ? `لا خطأ ظاهر (خروج ${xa.status}): ${xa.err.trim().slice(0, 100)}` : "الإذن العمدي GRID_BROWSER_FALLBACK=1 لم يعد يعمل");
  });

  api.manual("idle.bg_proc_studio_stop", ["tools/bg.sh", "tools/proc.mjs"], "idle-services-cpu-fallback", "الأعمال الطويلة عبر bg.sh وإيقافها بـproc.mjs، وإيقاف الاستوديو نفسه بعد 30 دقيقة بلا صفحة",
    "تشغيلها يطلق ويوقف عمليات خلفية حقيقية مسجّلة في .tmp/procs.json المشترك؛ يلزم خيار سجل بديل (--registry) في proc.mjs ثم حالة هنا. المختبَر آلياً من هذا الخطأ: لا سقوط صامت إلى المعالج في grid_sheet.");

  /* ── 6) THE SHORTS LIMIT COUNTS THE BUMPER (ledger shorts-length-without-bumper, 2026-11-18: 176.5 s + 5 s bumper = 181.6 s, published as a normal video) ── */
  const SL = "shorts-length-without-bumper", SLF = "tools/short_limit.mjs";
  const slRoot = (name, bumpers = [5]) => { const r = copyRoot(name, [SLF]); put(path.join(r, "data", "short_limit.json"), { maxTotal: 179 });
    put(path.join(r, "public", "fawasel", "manifest.json"), { bumpers: bumpers.map((s, i) => ({ id: `zz${i}`, title: "فاصل وهمي", seconds: s, file: `zz${i}.mp4`, fileP: `zz${i}P.mp4`, rendered: true, renderedP: true })), last: null });
    for (let i = 0; i < bumpers.length; i++) put(path.join(r, "public", "fawasel", `zz${i}P.mp4`), "not a video");
    return r; };
  add("short.limit_math", SLF, SL, "حدّ القصير: الكل ≤ 179ث، والمحتوى = الحد − أطول فاصل، ويُعرف القصير بمواصفة الريل أو بالتعليق الصامت (جذر وهمي)", async () => {
    const r = slRoot("short_math", [5, 7]);
    put(path.join(r, "data", "specs", "zzreel.json"), { kind: "reel" }); put(path.join(r, "data", "specs", "zzep.json"), { kind: "episode" }); put(path.join(r, "public", "silent", "zzsil", "config.json"), {});
    const m = await imp(path.join(r, "tools", "short_limit.mjs"));
    let real = null; try { real = JSON.parse(fs.readFileSync(R("data", "short_limit.json"), "utf8")).maxTotal; } catch { /* none */ }
    const got = [m.SHORT_MAX, m.bumperSeconds(), m.contentBudget(), m.isShort("zzreel"), m.isShort("zzsil"), m.isShort("zzep")].join(",");
    return expect(got === "179,7,172,true,true,false" && Number(real) > 0 && Number(real) <= 179, got !== "179,7,172,true,true,false" ? `الحد،الفاصل،المحتوى،ريل،صامت،حلقة = ${got}` : `الحد الحقيقي في data/short_limit.json ${real} (يجب ≤ 179)`);
  });
  add("short.coverage_counts_bumper", "tools/coverage_check.mjs", SL, "فحص التغطية: ريل 176ث يُرفض لأنه مع الفاصل فوق الحد، وريل 170ث لا يُرفض لطوله (مواصفة وهمية، قراءة فقط)", async () => {
    const spec = (sec) => put(path.join(RUN, "coverage", `zz_selftest_cov${sec}.json`), { id: `zz_selftest_cov${sec}`, kind: "reel", fps: 30, frames: sec * 30, items: [] });
    const [a, b] = await Promise.all([176, 170].map((s) => runAsync(NODE, [R("tools", "coverage_check.mjs"), spec(s)], { cwd: ROOT })));
    return expect(/فوق حد القصير/.test(a.out) && !/فوق حد القصير/.test(b.out) && !/انهار|Error/.test(a.err), !/فوق حد القصير/.test(a.out) ? `ريل 176ث لم يُرفض: ${(a.out + a.err).split("\n").find((l) => /الصيغة|Error/.test(l))?.slice(0, 120) ?? ""}` : "ريل 170ث رُفض لطوله");
  });
  add("short.prepend_refuses", "tools/prepend_bumper.mjs", SL, "أداة الفاصل ترفض لصق فاصل 5ث بريل 176ث (176 + 5 > 179) قبل أي دمج، والملف كما هو (نسخة في جذر وهمي)", async () => {
    const r = slRoot("short_prepend"); copyRoot("short_prepend", ["tools/prepend_bumper.mjs", "tools/lib/projdir.mjs"]);
    put(path.join(r, "data", "specs", "zzreel.json"), { id: "zzreel", kind: "reel" });
    const v = path.join(r, "zzreel.mp4"); fs.copyFileSync(await portraitVideo(176), v); const before = fs.statSync(v).size;
    const x = await runAsync(NODE, [path.join(r, "tools", "prepend_bumper.mjs"), v, "--name", "zzreel"], { cwd: r });
    const left = fs.existsSync(v) && fs.statSync(v).size === before && !fs.existsSync(path.join(r, "zzreel.bumper_tmp.mp4")) && !fs.existsSync(path.join(r, ".tmp", "gates", "zzreel.bumper.json"));
    return expect(x.status === 1 && /فوق حد القصير 179ث/.test(x.err) && left, !/فوق حد القصير/.test(x.err) ? `لم يرفض (خروج ${x.status}): ${(x.err || x.out).trim().split("\n").pop().slice(0, 120)}` : "لمس الملف أو كتب سجلاً");
  });
  add("short.final_review_portrait", "tools/final_review.mjs", SL, "الفحص النهائي يرفض ملفاً طولياً 181ث (فوق حد القصير) ولو بلا اسم مشروع", async () => {
    const d = path.join(RUN, "short_final"); fs.mkdirSync(d, { recursive: true });
    const x = await runAsync(NODE, [R("tools", "final_review.mjs"), await portraitVideo(181)], { cwd: d });
    return expect(/✘ طول القصير 181\.\d\dث والحد 179ث/.test(x.out) && x.status === 1, `لم يُرفض: ${x.out.trim().split("\n").find((l) => /طول القصير/.test(l)) ?? (x.out + x.err).trim().slice(0, 120)}`);
  });
  add("short.reel_build_budget", "tools/reel_from_episode.mjs", SL, "بناء الريل يرفض أمدية 190ث (الحد 179 − الفاصل 5 − 4 احتياط = 170) قبل الاقتطاع، ويقبل 160ث (نسخة في جذر وهمي بحلقة وهمية)", async () => {
    const mk = (name) => { const r = slRoot(name); copyRoot(name, ["tools/reel_from_episode.mjs", "tools/cover_item.mjs"]);
      put(path.join(r, "public", "zzep_map.json"), { model: "cut_model", segments: [{ a: 0, b: 200, n: 0, type: "speech" }] });
      put(path.join(r, ".tmp", "zzep", "words_table.json"), { words: Array.from({ length: 400 }, (_, i) => ({ w: "كلام", s: +(i * 0.5).toFixed(2), e: +(i * 0.5 + 0.4).toFixed(2) })) });
      return r; };
    const ra = mk("reel_over"), rb = mk("reel_under");
    const [a, b] = await Promise.all([runAsync(NODE, [path.join(ra, "tools", "reel_from_episode.mjs"), "zzep", "--ranges", "0-190"], { cwd: ra }), runAsync(NODE, [path.join(rb, "tools", "reel_from_episode.mjs"), "zzep", "--ranges", "0-160"], { cwd: rb })]);
    const noSpec = !fs.existsSync(path.join(ra, "data", "specs", "zzep-reel.json"));
    return expect(a.status === 1 && /✘ الريل 1\d\d\.\dث والحد 170ث/.test(a.err) && noSpec && !/✘ الريل/.test(b.err), !/✘ الريل/.test(a.err) ? `أمدية 190ث لم تُرفض (خروج ${a.status}): ${(a.err || a.out).trim().split("\n").pop().slice(0, 120)}` : !noSpec ? "كُتبت مواصفة رغم الرفض" : "أمدية 160ث رُفضت لطولها");
  });
};
