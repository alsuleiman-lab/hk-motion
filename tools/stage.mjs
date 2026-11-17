// One command per montage stage (user order 2026-10-25: the «ريلز» reel spent ~47 min in 158 small tool calls). Each stage writes its full log to
// .tmp/<p>/stage_<stage>.log and prints ONLY a short summary, so the session context stays small. Child processes run at below-normal priority.
//   node tools/stage.mjs prep  <p> <video>            copy → public/<p>_src.mp4, 16k wav, word transcript, VAD, per-VAD-segment transcript, contact sheet, source-display windows
//                                                     → .tmp/<p>/{a16k.wav, words.json, vad.json, tr_vad.json, words_vad.json, transcript.txt, sheet.jpg, sources.json,
//                                                        speakers.json + speakers.txt (who speaks when: tools/diarize.py)}
//        run it with run_in_background together with the first question, and keep working: the question is written in the message, not a blocking
//        AskUserQuestion (user 2026-11-15, MONTAGE_BRIEF.md «لا انتظار أبداً»).
//   node tools/stage.mjs cut   <p> [--rem a-b,c-d]    map from VAD minus the removed source ranges (seconds) → public/<p>_map.json; audio-only cut; pauses > 0.40 s
//        [--keep a-b] [--keep-sound a-b] [--no-auto-keep]  are trimmed at their join automatically (up to 4 rounds); audio_gate; only if it passes: one NVENC build.
//                                                     ONE run settles it all (user 2026-11-15): shown clips kept as speech automatically (sources.json windows ×
//                                                     speakers.json turns), their pauses with no human voice cut, digital silence cut, a pause inside a segment
//                                                     split out, the gate's own «cut» sounds removed and the cut redone inside the same command; only a «review»
//                                                     sound (his decision) fails. --keep-sound = a range kept with ALL its sound (adhan, nasheed).
//                                                     → public/<p>_cut.mp4 and the cut transcript .tmp/<p>/cut_transcript.txt (for timing elements).
//   node tools/stage.mjs check <p> <CompId> --file src/<X>.tsx --minutes <m> [--skip 0-12,40-55]
//                                                     typecheck → rules_lint → element_usage → brand_audit (spec) → mg_usage_audit → writing_sync (spec: no writing before its words) → coverage_check (spec) → pick_triggers (spec: the picked elements where due) → grid_plan + grid_sheet (spec montage; else face_check) → frame_audit (old TSX only), one after another (never two renders at once).
//        BOTH ORIENTATIONS AT ONCE (user 2026-11-16): for a data-spec montage the check runs for the portrait AND the landscape form whichever composition is named
//        (spec_register: the three Studio compositions exist · spec_normalize/grid_plan for both · a grid sheet for both); a reel (kind reel or an id ending -R) is portrait only.
// Exit code 1 when any step fails; the summary names the step and the log line to read.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const [stage, p, ...rest] = process.argv.slice(2);
/* (user 2026-11-12: «وين عم تروح تعليماتي؟») no montage stage while an order of the user is still an unmerged draft/proposal in rules_registry/ */
if (["prep", "cut", "check"].includes(stage)) { const { spawnSync: _sp } = await import("node:child_process"); const r = _sp(process.execPath, ["tools/rules_pending.mjs"], { encoding: "utf8" }); if (r.status !== 0) { console.log(r.stdout.trim()); console.log("✘ stage: أدمج أوامر المستخدم في الملفات الملزمة أولاً (أو اعرض التعارض عليه)"); process.exit(1); } }
/* (أمر المستخدم 2026-11-16: «القص يكون مرة واحدة في البداية ثم بعد ذلك تقسم مقاطع»؛ تجاهلتُه فضاعت ساعتان) مقطع من بث هو شريحة من القص الواحد للبث كله: لا تجهيز ولا قص له وحده. */
if (["prep", "cut"].includes(stage) && !process.env.STREAM_SLICE_OK) { const _m = /^(.+)_(\d+[a-z]?|r\d+)$/.exec(p ?? ""); try { if (_m && JSON.parse(fs.readFileSync(path.join(".tmp", _m[1], "plan.json"), "utf8")).clips?.some((c) => c.id === p)) { console.log(`✘ stage ${stage} ${p}: «${p}» مقطع من البث «${_m[1]}» (في خطته): لا تجهيز ولا قص لمقطع على حدة. قصّ البث كله مرة واحدة (cut_smart على «${_m[1]}») ثم اقتطع المقاطع شرائح بـtools/stream/clip_cut_all.mjs.`); process.exit(1); } } catch { /* not a stream clip */ } }
const opt = (n, d) => (rest.includes("--" + n) ? rest[rest.indexOf("--" + n) + 1] : d);
if (!["prep", "cut", "check"].includes(stage) || !p) { console.error("usage: node tools/stage.mjs prep|cut|check <project> …  (see the header)"); process.exit(2); }
const PY = process.env.PY ?? "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";   // has faster_whisper + torch (system python does not)
const T = path.join(".tmp", p);
// pids of THIS project's background smoothing (the node job, smooth_dups.py and its re-exec'd ComfyUI child), found by command line — never by a stored pid alone,
// which Windows may have handed to another process since
const smoothingPids = (proj) => {
  const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*smooth_dups.py*' } | ForEach-Object { [string]$_.ProcessId + [char]9 + $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
  const re = new RegExp(`[\\\\/]${proj.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_cut\\.mp4`);
  return (r.stdout || "").split(/\r?\n/).map((l) => l.split("\t")).filter(([id, cmd]) => id && cmd && re.test(cmd) && Number(id) !== process.pid).map(([id]) => Number(id));
};
fs.mkdirSync(T, { recursive: true });
const logFile = path.join(T, `stage_${stage}.log`);
fs.writeFileSync(logFile, `# stage ${stage} ${p} ${new Date().toISOString()}\n`);
const log = (s) => fs.appendFileSync(logFile, s.endsWith("\n") ? s : s + "\n");
const t0 = Date.now();
const lines = [];
const say = (s) => { lines.push(s); log("» " + s); };

/** run a child at below-normal priority, everything into the log; resolves {code, out} (out = last 4000 chars) */
const run = (cmd, args, { env } = {}) => new Promise((res) => {
  log(`$ ${cmd} ${args.join(" ")}`);
  const c = spawn(cmd, args, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", ...env } });
  try { os.setPriority(c.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
  let out = "";
  const take = (d) => { const s = d.toString(); out = (out + s).slice(-4000); fs.appendFileSync(logFile, s); };
  c.stdout.on("data", take); c.stderr.on("data", take);
  c.on("close", (code) => res({ code, out }));
  c.on("error", (e) => res({ code: -1, out: String(e) }));
});
const must = async (label, cmd, args, o) => {
  const r = await run(cmd, args, o);
  if (r.code !== 0) { say(`✘ ${label} (exit ${r.code}) — ${r.out.trim().split("\n").slice(-3).join(" | ")}`); finish(1); }
  return r;
};
// نوافذ «عرض المصدر» (نصف الشاشة) بـtools/source_windows.mjs — لا تُوقف المرحلة إن فشلت، تُذكر فقط
const sources = async (src, extra = []) => {
  const r = await run("node", ["tools/source_windows.mjs", src, "--out", path.join(T, "sources.json"), ...extra]);
  if (r.code !== 0) { say(`⚠ source windows failed — ${r.out.trim().split(String.fromCharCode(10)).slice(-2).join(" | ")}`); return; }
  const w = JSON.parse(fs.readFileSync(path.join(T, "sources.json"), "utf8")).windows;
  say(`source display: ${w.length} window(s)${w.length ? " — " + w.map((x) => (x.cut ? `cut ${x.cut[0]}–${x.cut[1]}` : x.cut === null ? `${x.a}–${x.b} (cut out)` : `${x.a}–${x.b}`) + " " + x.side).join(", ") : ""} → ${path.join(T, "sources.json")}`);
};
/** source words → cut timeline through the map segments {a,b,n}: a word is kept when its middle lies in a kept segment (user 2026-10-27: no second Whisper pass) */
const remapWords = (words, segs) => {
  const out = [];
  for (const w of words) {
    const m = (w.s + w.e) / 2, g = segs.find((x) => m >= x.a && m < x.b);
    if (g) out.push({ s: +(g.n + Math.max(0, w.s - g.a)).toFixed(3), e: +(g.n + Math.min(g.b, w.e) - g.a).toFixed(3), w: w.w });
  }
  return out.sort((x, y) => x.s - y.s);   // a moved block (--move) makes the source order differ from the cut order
};
const finish = (code) => {
  console.log(lines.join("\n"));
  console.log(`[${stage}] ${code ? "FAILED" : "OK"} in ${((Date.now() - t0) / 60000).toFixed(1)} min — full log: ${logFile}`);
  process.exit(code);
};
const dur = async (f) => Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).out.trim().split("\n").pop());

/** readable transcript: one line per ~12 words or per gap > 0.6 s, «[t] text» — read this instead of the JSON */
const toText = (words) => {
  const out = []; let cur = [], s0 = 0, last = -1;
  for (const w of words) {
    if (cur.length && (cur.length >= 12 || w.s - last > 0.6)) { out.push(`[${s0.toFixed(1)}] ${cur.join(" ")}`); cur = []; }
    if (!cur.length) s0 = w.s;
    cur.push(w.w.trim()); last = w.e;
  }
  if (cur.length) out.push(`[${s0.toFixed(1)}] ${cur.join(" ")}`);
  return out.join("\n") + "\n";
};

if (stage === "prep") {
  // the task list binds from the first step (rules §6; user 2026-11-16 «ياخذ قائمة مهام يمشي عليها وما يتجاوزها»): prep registers the montage itself, so the hooks hold the spec until `ready`
  { const g = await run("node", ["tools/montage_guard.mjs", "start", p]); say(g.code === 0 ? `tasks: «${p}» مسجَّل — لا مواصفة قبل اكتمال مراحل ما قبل البناء (montage_guard ready)` : `⚠ montage_guard start: ${g.out.trim().split(/\r?\n/).pop()}`); }
  const video = rest.find((a) => !a.startsWith("--"));
  if (!video || !fs.existsSync(video)) { say(`✘ video not found: ${video}`); finish(1); }
  const audioOnly = rest.includes("--audio-only");
  const src = path.join("public", `${p}_src${audioOnly ? path.extname(video).toLowerCase() : ".mp4"}`);
  fs.writeFileSync(path.join(T, "prep_config.json"), JSON.stringify({ source: src, original: path.resolve(video), audioOnly }, null, 2));
  if (!fs.existsSync(src)) { try { fs.linkSync(video, src); } catch { fs.copyFileSync(video, src); } }
  fs.mkdirSync(path.join("public", p), { recursive: true });
  const a16 = path.join(T, "a16k.wav");
  await must("audio 16k", "ffmpeg", ["-v", "error", "-y", "-threads", "4", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-threads", "4", a16]);
  const srcWin = audioOnly ? Promise.resolve() : sources(src);
  /* contact sheet decoded on the card (2026-11-13: 9 s instead of 46 s for an 18-min 1080p source, and the 4 processor threads stay free for the transcript); the processor if NVDEC refuses the file */
  const sheetArgs = (gpu) => ["-v", "error", "-y", ...(gpu ? ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"] : ["-threads", "4"]), "-i", src, "-vf", gpu ? "fps=1/6,scale_cuda=320:-2,hwdownload,format=nv12,tile=8x8" : "fps=1/6,scale=320:-1,tile=8x8", "-frames:v", "1", path.join(T, "sheet.jpg")];
  const sheet = audioOnly ? Promise.resolve() : run("ffmpeg", sheetArgs(true)).then((r) => (r.code === 0 ? r : must("contact sheet", "ffmpeg", sheetArgs(false))));
  await must("VAD", PY, ["tools/vad_segments.py", a16, path.join(T, "vad.json"), "--padstart", "100", "--padend", "180", "--minsil", "150"]);
  if (opt("asr-device", "cuda") !== "cuda") { say("✘ التفريغ بأقوى نموذج فقط (large-v3 float16 على كرت الشاشة): --asr-device غير cuda ممنوع"); finish(1); }
  await must("per-VAD transcript", PY, ["tools/transcribe_vad_segments.py", a16, path.join(T, "vad.json"), path.join(T, "tr_vad.json"), "--device", opt("asr-device", "cuda"), "--threads", opt("asr-threads", "4")]);
  await sheet;
  await srcWin;
  const segs = JSON.parse(fs.readFileSync(path.join(T, "tr_vad.json"), "utf8"));
  const words = segs.flatMap((g) => g.words ?? []);
  fs.writeFileSync(path.join(T, "words_vad.json"), JSON.stringify(words));
  fs.writeFileSync(path.join(T, "words.json"), JSON.stringify(words));   // one Whisper pass (per VAD segment, no long-file hallucinations); words.json kept for find_restarts & co.
  fs.writeFileSync(path.join(T, "transcript.txt"), toText(words));
  // THE word table (cut model, user 2026-11-16): the large-v3 transcript aligned word by word (wav2vec2) — built once here; the cut and every cut check read it
  { const sha = (await import("node:crypto")).createHash("sha256").update(fs.readFileSync(a16)).digest("hex");
    const wt = await run(PY, ["-I", "tools/words_table.py", a16, path.join(T, "tr_vad.json"), path.join(T, "words_table.json"), "--sha", sha], { env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    say(wt.code === 0 ? wt.out.trim().split(/\r?\n/).pop() : `✘ words_table — ${wt.out.trim().split(/\r?\n/).slice(-2).join(" | ")}`); if (wt.code !== 0) finish(1); }
  say(`source ${(await dur(src)).toFixed(1)} s · ${segs.length} VAD segments · ${words.length} words`);
  // من يتكلم ومتى (WhisperX/pyannote، 2026-10-28): أدوار غير «sheikh» = المقطع الذي يرد عليه / الطرف الآخر في المناظرة. لا يوقف المرحلة إن فشل
  if (!rest.includes("--skip-diarize")) {
  const dz = await run(PY, ["tools/diarize.py", a16, path.join(T, "speakers.json"), "--words", path.join(T, "words.json")]);
  if (dz.code !== 0) say(`⚠ speakers failed — ${dz.out.trim().split("\n").slice(-2).join(" | ")}`);
  else {
    const { speakers, turns } = JSON.parse(fs.readFileSync(path.join(T, "speakers.json"), "utf8"));
    const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    fs.writeFileSync(path.join(T, "speakers.txt"), turns.map((t) => `[${t.s.toFixed(1)}–${t.e.toFixed(1)} ${mm(t.s)}] ${t.name}: ${t.text}`).join("\n") + "\n");
    const others = turns.filter((t) => t.name !== "sheikh");
    say(`speakers: ${Object.values(speakers).map((v) => `${v.name} ${v.talk_s}s`).join(", ")}${Object.values(speakers).some((v) => v.name === "sheikh") ? "" : " (⚠ sheikh not matched)"} · ${others.length} other-speaker turn(s) → ${path.join(T, "speakers.txt")}`);
  }
  } else say("speaker roles: review the narrator and story dialogue from the audio/transcript");
  // «عفواً/أعيد» and stumbles (rules §5, skill montage-orders): the spots are listed now; I judge each from its context and pass the wrong attempts as --rem to stage cut
  { const rs = await run("node", ["tools/redo_scan.mjs", p]); fs.writeFileSync(path.join(T, "redo.txt"), rs.out); const os = await run("node", ["tools/orders_scan.mjs", p]); say(os.out.trim().split(/\r?\n/).pop()); say(`retakes: ${(rs.out.match(/اقتراح --rem/g) ?? []).length} spot(s) → ${path.join(T, "redo.txt")} (judge each from its context → --rem for stage cut)`); }
  say(`read: ${path.join(T, "transcript.txt")}${audioOnly ? " (audio-only source)" : `  (contact sheet: ${path.join(T, "sheet.jpg")})`}`);
  finish(0);
}

if (stage === "cut") {
  const cfgFile = path.join(T, "prep_config.json");
  const prepConfig = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, "utf8")) : {};
  const src = prepConfig.source ?? path.join("public", `${p}_src.mp4`), mapF = path.join("public", `${p}_map.json`), wav = path.join(T, "cut.wav");
  const rem = (opt("rem", "") || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  try { for (const d of JSON.parse(fs.readFileSync(path.join(T, "stray_drops.json"), "utf8"))) rem.push(d.range); say(`stray drops: ${rem.length} range(s) incl. stray_drops.json`); } catch { /* none yet */ }   // (2026-11-13) a leftover sound found by stray_find.py stays removed in every rebuild
  fs.writeFileSync(path.join(T, "explicit_rem.json"), JSON.stringify(rem));   // the removals he/I ordered
  /* THE cut model (user 2026-11-16 «نموذج قص واحد»): the plan is built from the word table (tools/words_table.py, built at prep) by the one rule in data/cut_rules.json —
     no VAD segments, no pause-trim rounds, no join polishing, no second measure. Shown clips (sources.json × speakers.json) and --keep ranges are typed «clip» IN the plan,
     --keep-sound ranges «sound» (kept whole); the gate and the final review read the types from the plan, nobody passes exemptions by hand. */
  const { buildPlan, loadTable, autoClips, verifyCut, printViolations, untranscribed } = await import("./cut_model.mjs");
  const { words: tableWords0, source: tableSrc } = loadTable(p);
  const extraSpeech = untranscribed(p, tableWords0), tableWords = [...tableWords0, ...extraSpeech];   // speech Whisper missed is kept, never dropped silently
  if (extraSpeech.length) say(`ℹ speech with no transcribed word kept (listen): ${extraSpeech.map((x) => `${x.s.toFixed(2)}-${x.e.toFixed(2)}`).join(",")}`);
  if (!tableWords.length) { say("✘ no word table (.tmp/<p>/words_table.json): run stage prep"); finish(1); }
  if (tableSrc !== "words_table") say(`⚠ word table: ${tableSrc} — run stage prep again to build the aligned table`);
  const rng = (x) => (x || "").split(",").filter(Boolean).map((r) => r.split("-").map(Number));
  const keepSound = rng(opt("keep-sound", "")), keep = rng(opt("keep", ""));
  if (!rest.includes("--no-auto-keep")) { const ac = autoClips(p); if (ac.length) { keep.push(...ac); say(`shown clips typed «clip» in the plan: ${ac.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)}`).join(",")}`); } }
  const fr = (t) => Math.round(t * 30) / 30;   // 1/30 s grid (cut_edl)
  let segments = buildPlan(tableWords, { rem, keep, keepSound, duration: await dur(src) });
  // --move a-b@t,…: a recorded block (source seconds a–b) is re-placed just before the segment that starts at/after source time t (in-recording order «حط الكلام التالي مكان …»)
  for (const mv of (opt("move", "") || "").split(",").filter(Boolean).map((x) => { const [r, t] = x.split("@"); const [a, b] = r.split("-").map(Number); return { a, b, t: Number(t) }; })) {
    const splitAt = (x) => { const i = segments.findIndex((g) => g.a < x - 1e-6 && g.b > x + 1e-6); if (i >= 0) { const g = segments[i]; segments.splice(i, 1, { a: g.a, b: fr(x) }, { a: fr(x), b: g.b }); } };
    splitAt(mv.a); splitAt(mv.b);
    const moved = segments.filter((g) => g.a >= mv.a - 1e-6 && g.b <= mv.b + 1e-6);
    const rest = segments.filter((g) => !moved.includes(g));
    const k = rest.findIndex((g) => g.a >= mv.t - 1e-6);
    rest.splice(k < 0 ? rest.length : k, 0, ...moved);
    segments = rest;
    say(`move ${mv.a}–${mv.b} → before source ${mv.t} (${moved.length} segment(s))`);
  }
  const renumber = () => { for (let i = segments.length - 1; i > 0; i--) if (Math.abs(segments[i].a - segments[i - 1].b) < 0.01) { segments[i - 1].b = segments[i].b; segments.splice(i, 1); }   /* contiguous pieces are one segment: no phantom join for the gate */
    let n = 0; for (const g of segments) { g.n = +n.toFixed(3); n += g.b - g.a; } return n; };
  const writeMap = () => { const n = renumber(); fs.writeFileSync(mapF, JSON.stringify({ segments, duration: +n.toFixed(3) }, null, 1)); return n; };
  writeMap();
  const keepGate = segments.filter((g) => g.type && g.type !== "speech").map((g) => `${g.a}-${g.b}`).join(",");   // the clip/sound ranges of the plan (noise_scan exemption)
  { const v0 = verifyCut({ segments: JSON.parse(fs.readFileSync(mapF, "utf8")).segments, words: tableWords });
    if (v0.length) { for (const l of printViolations(v0)) say(l); say("✘ the plan breaks the cut rule (see above) — nothing was built"); finish(1); }
    say(`plan ✔ ${segments.length} segments, no pause > rule, no cut inside a word (table: ${tableSrc})`); }
  await must("audio cut", "node", ["tools/cut_edl.mjs", "audio", src, mapF, wav]);
  const gate = process.env.SKIP_GATE === "1" ? { code: 1, out: "" } : await run("node", ["tools/audio_gate.mjs", p, "--cut", wav, "--map", mapF, "--tr", path.join(T, "tr_vad.json"), "--src16k", path.join(T, "a16k.wav"), "--audio", wav]);
  if (gate.code !== 0 && process.env.SKIP_GATE === "1") say("⚠ audio_gate متجاوَز (SKIP_GATE) — يُفحص كل مقطع بعد التقسيم");
  else if (gate.code !== 0) {
    /* (user 2026-11-15 «مرة واحدة نكتشف العيوب ما يعاد هذا الأمر مرة أخرى») the sounds the gate itself marks for deletion (noise_scan «cut»: a laugh, a stock
       phrase Whisper hallucinated on a breath) are added to --rem and the cut is rebuilt ONCE inside this same command; only what needs his decision
       (a «review» sound, a word cut) comes back as a failure */
    let nsj = { cut: [] }; try { nsj = JSON.parse(fs.readFileSync(path.join(".tmp", "gates", `${p}.noise.json`), "utf8")); } catch { /* none */ }
    const kr = keepGate.split(",").filter(Boolean).map((r) => r.split("-").map(Number));
    const auto = nsj.cut.filter((r) => !kr.some(([x, y]) => r[0] >= x - 0.05 && r[1] <= y + 0.05)).map((r) => `${r[0]}-${r[1]}`);
    if (auto.length && !process.env.STAGE_CUT_AUTOFIX) {
      say(`audio_gate: ${auto.length} sound(s) it marks for deletion → --rem ${auto.join(",")}; cutting again in this same run`);
      const args = process.argv.slice(2), i = args.indexOf("--rem");
      if (i >= 0) args[i + 1] = [args[i + 1], ...auto].filter(Boolean).join(","); else args.push("--rem", auto.join(","));
      console.log(lines.join("\n"));
      const { spawnSync: sp2 } = await import("node:child_process");
      const r2 = sp2(process.execPath, [process.argv[1], ...args], { stdio: "inherit", env: { ...process.env, STAGE_CUT_AUTOFIX: "1" } });
      process.exit(r2.status ?? 1);
    }
    say(`✘ audio_gate — ${gate.out.trim().split("\n").slice(-6).join(" | ")}`); say("fix with --rem (source seconds) and re-run this stage; nothing was built"); finish(1);
  }
  say("audio_gate ✔");
  // VOICE CLEAN-UP (user 2026-11-13, picked by ear: «الشبكة الصغيرة لإزالة الضجيج» = RNNoise, tools/audio_clean.mjs): his voice only, after the gate, before any sfx/bumper mix
  const wavClean = wav.replace(/.wav$/i, "_clean.wav");
  await must("voice clean-up", "node", ["tools/audio_clean.mjs", wav, wavClean]);
  say("voice clean-up ✔ (RNNoise)");
  if (prepConfig.audioOnly) {
    const audioAsset = path.join("public", p, `voice_${Date.now()}.wav`);
    fs.copyFileSync(wavClean, audioAsset);
    fs.writeFileSync(cfgFile, JSON.stringify({ ...prepConfig, cutAudio: audioAsset }, null, 2));
    const cutWords = remapWords(JSON.parse(fs.readFileSync(path.join(T, "words_vad.json"), "utf8")), JSON.parse(fs.readFileSync(mapF, "utf8")).segments);
    fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cutWords));
    fs.writeFileSync(path.join(T, "cut_transcript.txt"), toText(cutWords));
    say(`audio-only cut ${(await dur(audioAsset)).toFixed(1)} s · ${segments.length} segments → ${audioAsset}`);
    const vs = await run("node", ["tools/verse_scan.mjs", p]);
    say(`verse_scan: ${(vs.out.match(/✔ /g) ?? []).length} تلاوة في القص → .tmp/${p}/verses.json`);
    say(`read: ${path.join(T, "cut_transcript.txt")}`);
    finish(0);
  }
  const cut = path.join("public", `${p}_cut.mp4`);
  const cutS = path.join("public", `${p}_cut_s.mp4`);
  const running = path.join(T, "smooth.running");
  // (user 2026-11-16 «عالج تصادم التنعيم») a re-cut while the previous cut's smoothing still runs: the old job read the cut video being rewritten, both wrote the
  // same part file, and the old job's end renamed a stale video over <p>_cut_s.mp4 and removed the flag the new job set. Now the old job (its whole process tree,
  // found by command line, so an orphan or a recycled pid is handled right) is stopped BEFORE the cut video is rebuilt, and its leftovers and the stale smoothed video go
  const old = smoothingPids(p);
  if (old.length) { for (const pid of old) spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true }); say(`stopped the previous cut's background smoothing (${old.length} process(es)) — it would have overwritten this cut`); }
  fs.rmSync(running, { force: true });
  for (const f of fs.readdirSync(T).filter((f) => /^cut_s_part.*\.mp4$/.test(f))) { try { fs.rmSync(path.join(T, f)); } catch { /* gone */ } }
  try { fs.rmSync(cutS, { force: true }); } catch { say(`⚠ ${cutS} is held open (Studio?): the new smoothed video replaces it when free`); }
  await must("NVENC build", "node", ["tools/cut_edl.mjs", "build", src, mapF, cut, "--audio-from", wavClean]);
  // duplicated frames of the recording (frame-rate conversion) make the motion judder: ALWAYS smooth them right here (PREFERENCES §6 «تسجيلاته ترتجف»); the video is built on <p>_cut_s.mp4
  const srcWin = sources(src, ["--map", mapF]);
  // smoothing (≈5 min for 8 min) runs in the BACKGROUND: <p>_cut_s.mp4 appears when it is done (part file renamed); `check` waits for it (user 2026-10-27: «تسريع المونتاج»)
  // each job has its own token and part file; it renames/clears only while the flag still carries ITS token (a newer cut owns the flag otherwise)
  const token = `${Date.now()}_${process.pid}`;
  fs.writeFileSync(running, JSON.stringify({ token, t: Date.now() }));
  const part = path.join(T, `cut_s_part_${token}.mp4`);
  const job = `const {spawnSync}=require("child_process"),fs=require("fs");const F=${JSON.stringify(running)},K=${JSON.stringify(token)},mine=()=>{try{return JSON.parse(fs.readFileSync(F,"utf8")).token===K}catch{return false}};const r=spawnSync(${JSON.stringify("C:/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe")},["tools/smooth_dups.py",${JSON.stringify(cut)},${JSON.stringify(part)}],{encoding:"utf8",windowsHide:true});if(!mine()){fs.rmSync(${JSON.stringify(part)},{force:true});process.exit(0)}fs.writeFileSync(${JSON.stringify(path.join(T, "smooth.log"))},(r.stdout||"")+(r.stderr||""));let ok=false;if(r.status===0){for(let i=0;i<60&&!ok;i++){try{fs.renameSync(${JSON.stringify(part)},${JSON.stringify(cutS)});ok=true}catch(e){fs.appendFileSync(${JSON.stringify(path.join(T, "smooth.log"))},"rename: "+e.code+"\\n");Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5000)}}}fs.rmSync(F,{force:true});`;
  const jp = spawn(process.execPath, ["-e", job], { detached: true, stdio: "ignore", windowsHide: true });
  fs.writeFileSync(running, JSON.stringify({ token, t: Date.now(), pid: jp.pid }));
  jp.unref();
  const cutWords = remapWords(JSON.parse(fs.readFileSync(path.join(T, "words_vad.json"), "utf8")), JSON.parse(fs.readFileSync(mapF, "utf8")).segments);
  for (const stale of ["cut_words.aligned.json", "cut_words_large.raw.json", "cut_words_large.json", "drift_fresh.json"]) { try { fs.rmSync(path.join(T, stale)); } catch { /* absent */ } }   // (2026-11-13) a stale alignment from the previous cut shifted every word 0.45 s
  fs.writeFileSync(path.join(T, "cut_words.json"), JSON.stringify(cutWords));
  fs.writeFileSync(path.join(T, "cut_transcript.txt"), toText(cutWords));
  await srcWin;
  say(`cut ${(await dur(cut)).toFixed(1)} s · ${segments.length} segments → ${cut} (smoothing in the background → ${cutS} in ≈5 min, log ${path.join(T, "smooth.log")} — build on it; after the render run tools/judder_check.mjs)`);
  say(`read: ${path.join(T, "cut_transcript.txt")} (cut timeline — check stumbles/«أعيد» are gone)`);
  if (process.env.STREAM_WHOLE === "1") { say("بث كامل: بلا آيات ولا بحث ولا حركات ولا متطلبات على القص كله؛ يُجرى كل منها على كل شريحة في clip_slice.mjs (ميزانية الساعتين)"); finish(0); }
  const vs = await run("node", ["tools/verse_scan.mjs", p]);   // every recited verse becomes a verse item at the second it is said (user 2026-10-28)
  say(`verse_scan: ${(vs.out.match(/✔ /g) ?? []).length} تلاوة في القص → .tmp/${p}/verses.json (كل تلاوة تُكتب في الخطة)`);
  const hs = await run("node", ["tools/hadith_scan.mjs", p]);   // every narration → verify in Shamela, then a note card from its first word (rules §8.3)
  say(hs.out.trim().split(/\r?\n/)[0] || "hadith_scan: —");
  // research (verse slips, hadith, people, countries/places, numbers) and the camera-move plan run AT THE SAME TIME (user 2026-11-10); findings that need the user go to the questions page
  // the camera moves are PLANNED here, before the build (user 2026-10-28): push-ins + shake with their sentences → moves.md, copied into the spec by spec_draft
  // the REQUIREMENTS LEDGER (user 2026-11-11 «اشتغل صح من البداية»): every place → map, person → his picture, date → date element, described thing → picture,
  // every «مونتاج» order → planned elements, every editor-talk stretch of the original → a note; the spec is built FROM .tmp/<p>/requirements.md and check fails on any unmet row
  const [rs, mv, rq] = await Promise.all([run("node", ["tools/research.mjs", p]), run("node", ["tools/moves_plan.mjs", p]), run("node", ["tools/requirements.mjs", p])]);
  say(`${rq.out.trim().split("\n").pop()} — ابنِ المواصفة منها صفاً صفاً`);
  for (const l of rs.out.trim().split("\n")) say(`research: ${l}`);
  say(`${mv.out.trim().split("\n").pop()} (راجعها في الخطة: أبقِ/انقل/احذف، ثم zooms/shake في ملف البيانات)`);
  finish(0);
}

if (stage === "check") {
  const comp = rest.find((a) => !a.startsWith("--") && rest[rest.indexOf(a) - 1]?.startsWith("--") !== true);
  const file = opt("file", ""), minutes = opt("minutes", "");
  if (!comp || !file || !minutes) { say("✘ usage: check <p> <CompId> --file src/X.tsx --minutes M [--skip a-b,…]"); finish(1); }
  const running = path.join(T, "smooth.running");
  if (fs.existsSync(running)) {
    say("waiting for the background smoothing (<p>_cut_s.mp4)…");
    for (let k = 1; fs.existsSync(running); k++) {
      await new Promise((r) => setTimeout(r, 5000));
      if (k % 6 === 0 && fs.existsSync(running) && !smoothingPids(p).length) { fs.rmSync(running, { force: true }); say(`✘ the background smoothing died without finishing (reboot/killed?) — log ${path.join(T, "smooth.log")}; re-run the cut`); finish(1); }
    }
  }
  if (!fs.existsSync(path.join("public", `${p}_cut_s.mp4`)) && fs.existsSync(path.join("public", `${p}_cut.mp4`))) { say(`✘ no smoothed video public/${p}_cut_s.mp4 after the smoothing — log ${path.join(T, "smooth.log")}`); finish(1); }
  let failed = 0;
  /* both orientations (2026-11-16): a spec montage is checked in portrait AND landscape whichever composition was named; a reel (kind reel, or an id ending -R) in portrait only */
  const specKind = (() => { try { return JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8")).kind ?? "full"; } catch { return "full"; } })();
  const isReel = specKind === "reel" || /-R$/.test(comp);
  const baseId = isReel ? comp : comp.replace(/-(?:L|Both)$/, "");
  const only = opt("only", null);   // --only port|land: just one orientation was asked for («لا أريد» the other)
  const orients = isReel ? ["port"] : only === "port" || only === "land" ? [only] : comp.endsWith("-L") ? ["land", "port"] : ["port", "land"];   // the named composition's form first
  const compOf = (o) => (isReel ? comp : o === "land" ? `${baseId}-L` : baseId);
  await run("node", ["tools/make_preview_proxy.mjs", "--auto", p]);   // light Studio copies of every heavy video (no stutter in the preview; renders use the full files)
  const step = async (label, cmd, args, pick) => {
    const ts = Date.now();
    const r = await run(cmd, args);
    const key = r.out.trim().split("\n").filter((l) => pick.test(l)).slice(-2).join(" | ") || r.out.trim().split("\n").pop();
    if (r.code !== 0) failed++;
    say(`${r.code === 0 ? "✔" : "✘"} ${label} (${((Date.now() - ts) / 1000).toFixed(0)}s): ${key}`);   /* seconds per step (2026-11-13): where the check spends its time */
  };
  // build it right, not check-and-redo (user 2026-11-11): with --normalize (streams/lessons) the spec is completed here first;
  // any other spec gets a dry report of what is still incomplete (fix it in the plan, then check)
  {
    const sf = path.join("data", "specs", `${p}.json`), norm = process.argv.includes("--normalize");
    // the montage's forms (user 2026-11-16: «نبني طولي وعرضي، ويبنيهما بنفس الوقت»): a full montage is built AND checked as portrait + landscape, a reel as portrait only;
    // the three Studio compositions (طولي، عرضي، الاثنان معاً) are registered from the same spec first (idempotent)
    if (fs.existsSync(sf)) await step("spec_register", "node", ["tools/spec_register.mjs", p, "--id", baseId, ...(isReel ? ["--kind", "reel"] : []), ...(only === "port" || only === "land" ? ["--forms", only] : [])], /spec_register|✘/);
    if (fs.existsSync(sf) && fs.existsSync(path.join(T, "cut_words.json")))
      for (const o of orients) await step(`${norm ? "spec_normalize" : "spec_normalize --dry"} (${o === "land" ? "عرضي" : "طولي"})`, "node", ["tools/spec_normalize.mjs", sf, "--o", o, ...(norm ? [] : ["--dry"])], /spec_normalize|✘/);
  }
  // the gallery's size and place of every element, as the engine reads them (user 2026-11-17: a change in the gallery reaches every video without a request)
  await step("gallery_geo", "node", ["tools/gallery_geo.mjs"], /gallery_geo/);
  // (user 2026-11-17) the names are the gallery keeper's job, never the montage agent's: reported only, never a failed check
  await run("node", ["tools/el.mjs", "names", "--warn"]);
  await step("studio_drag_lint", "node", ["tools/studio_drag_lint.mjs"], /studio_drag_lint|^s+src/);
  await step("typecheck", "node", ["node_modules/typescript/bin/tsc", "-p", "."], /error TS/);
  // every video of the montage path reaches the render as a <VSlot> on the GPU (R-RENDER-GPU.2, user 2026-11-12: new elements use the new system)
  await step("video_lint", "node", ["tools/gpu/video_lint.mjs"], /video_lint|^\s+src\//);
  // one colour identity (src/brand.ts, user 2026-10-27): the montage's spec carries no colours of its own
  await step("rules_lint", "node", ["tools/rules_lint.mjs"], /^✘|✔ rules_lint/);
  await step("asr_audit", "node", ["tools/asr_audit.mjs"], /^✘|✔ asr_audit/);   // every transcription = the strongest model (large-v3 float16, GPU)
  await step("element_usage", "node", ["tools/element_usage.mjs", "check"], /^✘|✔ element_usage/);   // the user's «متى تستخدمه» texts are synced and binding (2026-11-02)
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("brand_audit", "node", ["tools/brand_audit.mjs", "--strict", path.join("data", "specs", `${p}.json`)], /outside the identity|brand OK/);
  await step("mg_usage_audit", "node", ["tools/mg_usage_audit.mjs", fs.existsSync(path.join("data", "specs", `${p}.json`)) && !file.endsWith(".json") ? path.join("data", "specs", `${p}.json`) : file, "--minutes", minutes], /PASS|FAIL|kinds|نوع/i);
  // complete, not just valid (user 2026-10-28): every named thing has its picture, no long empty stretch, the moves are in the spec
  // every element time comes from cut_words.json: prove it matches the REAL cut audio first (user 2026-11-09, a stale file made all elements 2.7 s late and every other check passed)
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("words_drift", "node", ["tools/words_drift_check.mjs", p], /words_drift/);
  // the source itself, not the browser window: missing crop boxes are detected and written, the sheet .tmp/<p>/source_crops.jpg is looked at
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("source_crop", "node", ["tools/source_crop.mjs", path.join("data", "specs", `${p}.json`), "--write"], /✘|→|لا نوافذ/);
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("writing_sync", "node", ["tools/writing_sync.mjs", path.join("data", "specs", `${p}.json`)], /^s*✘|writing_sync/);
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("coverage_check", "node", ["tools/coverage_check.mjs", path.join("data", "specs", `${p}.json`)], /^✘|PASSED|FAILED/);
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("pick_triggers", "node", ["tools/pick_triggers.mjs", path.join("data", "specs", `${p}.json`)], /^✘|PASSED|FAILED/);   // the 12 picked elements are used where due (user 2026-11-14)
  // every card at the gallery's size and place (user 2026-11-11: «حل مشكلة عدم الالتزام بمواقع المعرض جذرياً»): exact gallery-sample geometry, run gallery_geometry --write last in every build
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("gallery_geometry", "node", ["tools/gallery_geometry.mjs", path.join("data", "specs", `${p}.json`)], /gallery_geometry|^s+S/);
  // fragments left by cuts or trailing-off speech (user 2026-11-11, third time «صوت غريب… نصف كلمة»): each decided before any link
  await step("orphan_scan", "node", ["tools/orphan_scan.mjs", p], /orphan_scan|^s+S/);
  // the writing is the chosen list, verbatim and complete (user 2026-11-11)
  if (fs.existsSync(path.join(T, "writing.json"))) await step("writing_place", "node", ["tools/writing_place.mjs", p], /writing_place|^s+S/);
  // after the review link the spec is frozen: a change outside a block applied with spec_block.mjs apply = a whole-video rebuild the user forbade (2026-11-11)
  if (fs.existsSync(path.join(T, "spec_frozen.json"))) await step("spec_block", "node", ["tools/spec_block.mjs", "diff", p], /spec_block|^\s+\S/);
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) await step("requirements", "node", ["tools/requirements.mjs", p, "--check"], /requirements|^\s+\S/);
  await step("tasks", "node", ["tools/tasks.mjs", p], /^✘ مفتوح|^✔ كل المهام/);   // the one task list of the video (rules §6): requirements + orders + stages
  if (fs.existsSync(path.join(T, "montage_notes.json"))) await step("montage_notes", "node", ["tools/montage_notes.mjs", "check", p], /✘|✔/);
  /* (user 2026-11-13: «أنت ما وضعت الفاصل… كل مرة عم تخطئ فيه» + «وجود امرأة يعني تغبيش»): the bumper position is written by the check itself and must exist (reels excepted),
     and no face may stay visible in a clip window / B-roll without an explicit decision (tools/clip_people_gate.py) */
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) {
    await step("bumper_at --write", "node", ["tools/bumper_at.mjs", p, "--write"], /bumper|فاصل|✘|—/);
    await step("bumper_present", "node", ["-e", "const s=JSON.parse(require('fs').readFileSync('data/specs/" + p + ".json','utf8'));if(s.kind==='reel'){console.log('✔ bumper_present (ريل)');process.exit(0)}if(s.bumper&&s.bumper.at<1&&!s.bumper.end){console.log('✘ bumper_present: الفاصل عند الثانية 0 ممنوع');process.exit(1)}if(!s.bumper||typeof s.bumper.at!=='number'){console.log('✘ bumper_present: لا فاصل في المواصفة');process.exit(1)}console.log('✔ bumper_present '+s.bumper.id+' @'+s.bumper.at)"], /bumper_present/);
    await step("clip_people_gate", PY, ["-I", "tools/clip_people_gate.py", path.join("data", "specs", `${p}.json`)], /clip_people_gate|وجه/);
  }
  // continuous captions lose no spoken word (user 2026-11-09): a report, judged by me
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) { const lw = await run("node", ["tools/lost_words_check.mjs", path.join("data", "specs", `${p}.json`)]); for (const l of lw.out.trim().split("\n").slice(-8)) say(l); }
  // verse-reading audit (user 2026-11-09: «إن أخطأتُ بقراءة أي آية اكتب لي بوضوح قبل الرندر»): the FULL report goes to the user, never a one-line summary
  if (fs.existsSync(path.join("data", "specs", `${p}.json`))) {
    const va = await run("node", ["tools/verse_audit.mjs", path.join("data", "specs", `${p}.json`), "--strict"]);
    if (va.code === 0) say("✔ verse_audit: كل آية مقروءة كما في المصحف (حسب التفريغ)");
    else { failed++; say("✘ verse_audit — فروق بين قراءة الشيخ ونص الآية؛ اعرضها عليه بوضوح قبل أي رندر ليصلحها أو يؤكدها:"); for (const l of va.out.trim().split("\n").filter((x) => /^✘|^\s+- /.test(x))) say("   " + l); }
  }
  // his face is fixed vertically and moves sideways only when a source is shown (user 2026-10-27): check the frames where something is drawn (each plan window: start, middle, end), not every N seconds
  const faceFrames = (() => {
    try {
      const plan = JSON.parse(fs.readFileSync(path.join(".tmp", p, "plan.json"), "utf8")), fr = new Set();
      for (const it of plan) {
        const m = String(it.at ?? "").match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/); if (!m) continue;
        const a = Number(m[1]), b = m[2] ? Number(m[2]) : a + 3;
        for (const s of [a + 0.6, (a + b) / 2, b - 0.2]) if (s > 0) fr.add(Math.round(s * 30));
      }
      return [...fr].sort((x, y) => x - y).slice(0, 80);
    } catch { return []; }
  })();
  // data-spec montage → the fast geometric check (face track + one gfx-only render, every 0.5 s); old TSX compositions keep face_check.mjs
  const specF = path.join("data", "specs", `${p}.json`);
  // data-spec montage: the layout grid (data/layout_grids.json) reserves a place and a time for every element and keeps the face zone (from the face track) free
  // — computed in a second, no render (user 2026-10-29); then ONE sheet of 3 rendered frames per minute to look at. face_fast stays available by hand.
  if (fs.existsSync(specF)) {
    for (const o of orients) await step(`grid_plan (${o === "land" ? "عرضي" : "طولي"})`, "node", ["tools/grid_plan.mjs", specF, "--o", o], /^\[|PASSED|FAILED/);
    // one sheet per form, one render after the other (never two at once)
    for (const o of orients) await step(`grid_sheet ${compOf(o)}`, "node", ["tools/grid_sheet.mjs", compOf(o), specF], /→/);
  }
  else await step("face_check", "node", ["tools/face_check.mjs", comp, ...(faceFrames.length ? ["--frames", faceFrames.join(",")] : ["--step", "90"]), "--out", path.join(T, "fc")], /FAIL overlap|PASSED|FAILED|UNVERIFIED/);
  // data-spec montage: coverage_check already proves from the spec that nothing is empty > 5 s and the first minute never (seconds, not the 30+ min
  // two-pass render of the whole video that frame_audit needs); frame_audit stays for old TSX compositions
  // judder probe at the end of every montage (user 2026-11-16): with the preview link, a random 10 s from the middle is rendered and compared with the source — detached, log <T>/probe.log
  if (!failed && fs.existsSync(specF) && !rest.includes("--no-probe")) {
    const sp = JSON.parse(fs.readFileSync(specF, "utf8")), src = sp.cut ? path.join("public", sp.cut) : path.join("public", `${p}_cut_s.mp4`);
    if (fs.existsSync(src)) {
      const { spawn: _spawn } = await import("node:child_process");
      const log = fs.openSync(path.join(T, "probe.log"), "w");
      _spawn(process.execPath, ["tools/judder_probe.mjs", comp, "--src", src, "--offset", "0", "--name", p, "--random"], { detached: true, stdio: ["ignore", log, log], windowsHide: true }).unref();
      say(`judder probe: random 10 s from the middle rendering in the background → ${path.join(T, "probe.log")} (✔/✘ at its end; send the preview link now, report the result when it ends)`);
    } else say(`– judder probe skipped: no cut file ${src}`);
  }
  if (!fs.existsSync(specF)) await step("frame_audit", "node", ["tools/frame_audit.mjs", comp, ...(opt("skip", "") ? ["--skip", opt("skip", "")] : [])], /plain share|PASSED|FAILED/);
  finish(failed ? 1 : 0);
}
