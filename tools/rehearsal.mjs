#!/usr/bin/env node
// FULL DRESS REHEARSAL OF THE ENGINE on a FIXED test video (user 2026-11-21: «النص ساعة هذا الحد الأعلى» — a montage takes at most 30 minutes, and an engine
// bug must never show up for the first time on his real episode). Non-interactive, isolated project `zz_rehearsal` (+ its reel `zz_rehearsal-reel`), a stopwatch
// on every stage, a REAL GPU render of the landscape and of the reel into .tmp/rehearsal/out (never «جاهز», never the Studio, nothing uploaded), then its OWN
// scoped purge (never `montage_guard end` / `approve_purge`: those trash the original and save publishing packages).
//   node tools/rehearsal.mjs start [--quick] [--keep]   start it detached in the background (tools/proc.mjs: low priority, registered, ttl 120 min) → returns at once
//   node tools/rehearsal.mjs run   [--quick] [--keep]   the work itself, in this process (only through tools/bg.sh or run_in_background: it takes many minutes)
//   node tools/rehearsal.mjs --dry-run [--quick] [--json]   the plan only: every stage and its commands, nothing run, nothing written
//   node tools/rehearsal.mjs status                     the stage running now and the seconds so far (.tmp/rehearsal/progress.json)
//   node tools/rehearsal.mjs times [--last N]           the measured runs (data/rehearsal/times.jsonl), one line each
//   node tools/rehearsal.mjs purge [--dry]              remove everything of zz_rehearsal* (files whose name has «zzrehearsal» once - and _ are dropped) + its registry lines
// --quick: no full render — two 10-second preview windows per orientation at half size (a render-speed sample), no final review.
// --from <stage>: reuse the project as it is on disk up to that stage (a re-run after a fix); the record says from where.
// --to <stage>: stop after that stage, nothing purged (a debugging run: the record says where it stopped; with --from it re-runs one span).
// --keep : no purge at the end (to read the outputs; `purge` later).   --no-purge: no purge at all, neither the leftovers at the start nor at the end (a sub-agent may not
//          delete in public/ .tmp/<p>/ data/specs/ — tools/hooks/guard.mjs, user 2026-11-21 — so a run started by a sub-agent uses it and the main session purges).
// The fixed inputs: data/rehearsal/source.json (the test video: ranges of a real recording, rebuilt into .tmp/rehearsal/source.mp4 when missing),
// data/rehearsal/first_answers.json (landscape + one reel, no b-roll). Each run appends ONE line to data/rehearsal/times.jsonl: date, engine commit (+dirty),
// seconds per stage and per sub-step (the transcription, alignment, diarization… from the stage log), render seconds per minute of video, total, pass/fail and
// the first failing stage. Stages run one after another so each time is clean (a real montage overlaps research/cover/reel with the cut: the sum is an upper bound).
// tools/montage_build.mjs and tools/prerender_check.mjs (being written beside this file) are called when they exist and skipped with a note when not.
// A hard stage (source, prep, cut, spec) that fails stops the run (nothing after it can work); any other failure is recorded and the run goes on, so one run
// measures every stage. Wired: after an edit of an engine file the PostToolUse hook prints «شغّل التجربة الكاملة» (tools/guard_selftest.mjs --hook, isEngineFile below).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bashExecutable, envWithBash } from "./lib/bash_runtime.mjs";   // never the bare name `bash` (WindowsApps/WSL launcher on this machine)

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const P = "zz_rehearsal", REEL = `${P}-reel`;
const R = (...a) => path.join(ROOT, ...a);
const DIR = R(".tmp", "rehearsal"), OUT = path.join(DIR, "out"), LOGS = path.join(DIR, "logs"), PROG = path.join(DIR, "progress.json");
const DATA = R("data", "rehearsal"), TIMES = path.join(DATA, "times.jsonl");
const FPS = 30, MIN_FREE_G = Number(process.env.REHEARSAL_MIN_FREE_G ?? 16);

/** the files whose edit should be followed by a dress rehearsal: the montage engine (stages, cut, transcription, spec, checks, render). Read by guard_selftest --hook. */
export const ENGINE = /^(tools\/(stage|montage_kickoff|montage_build|prerender_check|gpu_render|render_queue|render_final|final_review|reel_from_episode|requirements|spec_[a-z]+|el|el_rules|cut_[a-z_]+|audio_gate|audio_clean|verse_scan|hadith_scan|names_scan|recitation_check|moves_plan|research|coverage_check|grid_plan|grid_sheet|element_slots|writing_sync|words_drift_check|cover_item|bumper_at|judder_check|window_frames|free_windows|mg_usage_audit|source_windows|make_preview_proxy|rehearsal)\.mjs|tools\/gpu\/[^/]+\.(mjs|sh|py|cjs)|tools\/(transcribe_vad_segments|vad_segments|words_table|diarize|cut_build_gpu|smooth_dups|gpu_compositor|bleep_words)\.py|tools\/(render_job)\.sh|src\/(MontageSpec|SpecComps|MontageBoth)\.tsx)$/;
export const isEngineFile = (rel) => ENGINE.test(String(rel ?? "").replace(/\\/g, "/"));

const json = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const has = (f) => fs.existsSync(R(f));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const autoId = (id) => id.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-");   // the default rule of src/SpecComps.tsx
const compOf = (id, o) => { const s = json(R("data", "specs", `${id}.json`), {}); const base = s.compId || autoId(id); return o === "land" ? `${base}-L` : base; };
/* the card before the rehearsal starts (another session's training or render makes every GPU stage slower: the times are read with it) */
const gpuNow = () => { const r = spawnSync("nvidia-smi", ["--query-gpu=utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"], { encoding: "utf8", windowsHide: true }); const [u, m, t] = (r.stdout || "").trim().split(",").map((x) => Number(x.trim())); return Number.isFinite(u) ? { util: u, memMiB: m, totalMiB: t } : null; };
const freeG = () => { const r = spawnSync("powershell", ["-NoProfile", "-Command", "[math]::Floor((Get-PSDrive S).Free/1GB)"], { encoding: "utf8", windowsHide: true }); return Number(r.stdout.trim()) || 0; };
const commit = () => { const h = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim(); const d = spawnSync("git", ["status", "--porcelain", "--", "tools", "src"], { cwd: ROOT, encoding: "utf8" }).stdout.trim(); return h + (d ? "+dirty" : ""); };

/* ── THE PLAN: one list, printed by --dry-run and run by `run` (so the self-test of the plan is a test of what runs) ── */
export function plan({ quick = false, keep = false, noPurge = false } = {}) {
  if (noPurge) keep = true;
  const node = "node", src = path.posix.join(".tmp", "rehearsal", "source.mp4"), out = ".tmp/rehearsal/out";
  const S = [
    { id: "setup", ar: "تهيئة: تنظيف بقايا تجربة سابقة، المساحة، الفيديو الثابت، الأجوبة الأولى", hard: true, montage: false,
      cmds: [...(noPurge ? [] : [`purge ${P}*`]), `disk S: ≥ ${MIN_FREE_G} GB`, `source ${src} (data/rehearsal/source.json)`, `answers data/rehearsal/first_answers.json → .tmp/${P}/first_answers.json`] },
    { id: "prep", ar: "التجهيز والتفريغ", hard: true, cmds: [[node, "tools/stage.mjs", "prep", P, src]] },
    { id: "proposal", ar: "اقتراح القص (الإعادات وكتل «مونتاج»)", hard: true, cmds: [[node, "tools/montage_kickoff.mjs", "_proposal", P]] },
    { id: "cut", ar: "القص (بالاقتراح كما هو)", hard: true, cmds: [[node, "tools/stage.mjs", "cut", P, "--rem", "<from cut_proposal.md>"]] },
    { id: "smooth", ar: "تنعيم الحركة في الخلفية (انتظار انتهائه)", hard: false, cmds: [`wait .tmp/${P}/smooth.running`] },
    { id: "scans", ar: "المطلوب والفحوص الأولى (البحث المبكر، الأماكن، التلاوة)", hard: false,
      cmds: [[node, "tools/montage_kickoff.mjs", "_early", P], [node, "tools/names_scan.mjs", P], [node, "tools/recitation_check.mjs", P]] },
    { id: "spec", ar: "المواصفة والغلاف", hard: true,
      cmds: [[node, "tools/spec_draft.mjs", P, "--title", "<first_answers.title>", "--forms", "land"], `cover public/${P}/cover_land.png + cover_reel.png (a frame of the test video, written before the draft)`, [node, "tools/cover_item.mjs", P, "--fix"]] },
    { id: "reel", ar: "الريل من الحلقة (القصة معتمدة آلياً)", hard: false,
      cmds: [[node, "tools/reel_from_episode.mjs", P, "--story-only", "--target", "60-90"], [node, "tools/reel_from_episode.mjs", P, "--approved"], [node, "tools/cover_item.mjs", REEL, "--fix"]] },
    { id: "build", ar: "البناء الآلي (montage_build بملف اختيارات آلي)", hard: false, optional: "tools/montage_build.mjs",
      cmds: [[node, "tools/montage_build.mjs", P, "--picks", `.tmp/${P}/rehearsal_picks_${P}.json (= --picks-template, defaults as they are)`], [node, "tools/montage_build.mjs", REEL, "--picks", `.tmp/${P}/rehearsal_picks_${REEL}.json`]] },
    { id: "check_land", ar: "فحص العرضي", hard: false, cmds: [[node, "tools/stage.mjs", "check", P, "<Comp>-L", "--file", `data/specs/${P}.json`, "--minutes", "<m>", "--only", "land"]] },
    { id: "check_reel", ar: "فحص الريل", hard: false, cmds: [[node, "tools/stage.mjs", "check", REEL, "<Comp>", "--file", `data/specs/${REEL}.json`, "--minutes", "<m>"]] },
    { id: "prerender", ar: "فحص ما قبل الرندر", hard: false, optional: "tools/prerender_check.mjs", cmds: [[node, "tools/prerender_check.mjs", P], [node, "tools/prerender_check.mjs", REEL]] },
    ...(quick ? [
      { id: "preview_land", ar: "نوافذ معاينة العرضي (عيّنة سرعة الرندر)", hard: false, cmds: [[node, "tools/gpu_render.mjs", "--comp", "<Comp>-L", "--out", `${out}/quick_<Comp>-L_<a>.mp4`, "--start", "<a>", "--end", "<a+300>", "--no-bumper", "--scale", "0.5", "--name", P]] },
      { id: "preview_reel", ar: "نوافذ معاينة الريل (عيّنة سرعة الرندر)", hard: false, cmds: [[node, "tools/gpu_render.mjs", "--comp", "<Comp>", "--out", `${out}/quick_<Comp>_<a>.mp4`, "--start", "<a>", "--end", "<a+300>", "--no-bumper", "--scale", "0.5", "--name", REEL]] },
    ] : [
      { id: "render_land", ar: "رندر العرضي على كرت الشاشة", hard: false, cmds: [["bash", "tools/gpu/render_project.sh", P, "<Comp>-L", "<Comp>", out]], env: { GR_ONLY: "L" } },
      { id: "render_reel", ar: "رندر الريل على كرت الشاشة", hard: false, cmds: [["bash", "tools/gpu/render_project.sh", REEL, "<Comp>", "<Comp>", out]], env: { GR_ONLY: "R" } },
      { id: "final_review", ar: "الفحص النهائي على الملفين", hard: false, cmds: [[node, "tools/final_review.mjs", `${out}/<Comp>-L.mp4`, "--name", P], [node, "tools/final_review.mjs", `${out}/<ReelComp>.mp4`, "--name", REEL]] },
    ]),
    ...(keep ? [] : [{ id: "purge", ar: "تنظيف التجربة وحدها", hard: false, montage: false, cmds: [`purge ${P}*`] }]),
  ];
  return S.map((s) => ({ montage: true, ...s }));
}

/* ── running children: low priority, own log, a time box, sub-steps read live from the stage log («$ …» lines of tools/stage.mjs) ── */
const lowPrio = (pid) => { try { os.setPriority(pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* gone */ } };
const killTree = (pid) => spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true });
const subLabel = (line) => { const m = line.match(/tools\/[\w/]+\.(?:mjs|py|sh)/); if (m) return m[0].replace(/^tools\//, ""); const w = line.slice(2).trim().split(/\s+/)[0] ?? ""; return path.basename(w).replace(/\.exe$/i, ""); };
function runCmd(stage, args, { env = {}, timeoutMin = 40, watch = null } = {}) {
  return new Promise((res) => {
    const log = path.join(LOGS, `${stage}.log`), t0 = Date.now();
    fs.appendFileSync(log, `\n$ ${args.join(" ")}   [${new Date().toISOString()}]\n`);
    let c; try { const viaBash = args[0] === "bash", cenv = { ...process.env, PYTHONIOENCODING: "utf-8", ...env }; c = spawn(viaBash ? bashExecutable() : args[0], args.slice(1), { cwd: ROOT, windowsHide: true, env: viaBash ? envWithBash(cenv) : cenv }); }
    catch (e) { return res({ code: -1, sec: 0, tail: String(e?.message ?? e), steps: [], timedOut: false }); }   // Git Bash missing/invalid: a clear failed step, not a crash
    lowPrio(c.pid);
    let tail = "", timedOut = false; const take = (d) => { const s = d.toString(); tail = (tail + s).slice(-6000); fs.appendFileSync(log, s); };
    c.stdout.on("data", take); c.stderr.on("data", take);
    const subs = []; let off = 0, buf = "";
    const poll = () => { if (!watch) return; try { const st = fs.statSync(watch); if (st.mtimeMs < t0 - 1000) return; if (st.size < off) { off = 0; buf = ""; } if (st.size === off) return;
      const fd = fs.openSync(watch, "r"), b = Buffer.alloc(st.size - off); fs.readSync(fd, b, 0, b.length, off); fs.closeSync(fd); off = st.size; buf += b.toString("utf8");
      const lines = buf.split("\n"); buf = lines.pop(); for (const l of lines) if (l.startsWith("$ ")) subs.push({ step: subLabel(l), at: Date.now() }); } catch { /* not yet */ } };
    const iv = setInterval(poll, 1000);
    const to = setTimeout(() => { timedOut = true; killTree(c.pid); }, timeoutMin * 60e3);
    c.on("close", (code) => { clearInterval(iv); clearTimeout(to); poll(); const end = Date.now();
      const steps = subs.map((s, i) => ({ step: s.step, sec: +(((subs[i + 1]?.at ?? end) - s.at) / 1000).toFixed(1) }));
      res({ code: timedOut ? 124 : code, sec: (end - t0) / 1000, tail, steps, timedOut }); });
    c.on("error", (e) => { clearInterval(iv); clearTimeout(to); res({ code: -1, sec: (Date.now() - t0) / 1000, tail: String(e), steps: [] }); });
  });
}
const lastLines = (s, n = 3) => String(s ?? "").trim().split(/\r?\n/).filter(Boolean).slice(-n).join(" | ").slice(0, 400);

/* ── the scoped purge: ONLY names that carry «zzrehearsal» (case, - and _ ignored); never .tmp/rehearsal or data/rehearsal (the fixed source and the history) ── */
export const ownName = (n) => String(n).toLowerCase().replace(/[-_]/g, "").includes("zzrehearsal");
export function purge({ dry = false } = {}) {
  const done = [], left = [];
  const rm = (f) => { if (!dry) fs.rmSync(f, { recursive: true, force: true, maxRetries: 6, retryDelay: 300 }); done.push(path.relative(ROOT, f).replace(/\\/g, "/")); };
  /* registry lines first (the hooks read them): the montage registry stage prep wrote, the Studio titles/dates, the preview proxies */
  { const f = R(".tmp", "active_montage.json"), reg = json(f, null);
    if (reg?.projects?.some(ownName)) { const list = reg.projects.filter((x) => !ownName(x)); if (!dry) { if (list.length) fs.writeFileSync(f, JSON.stringify({ ...reg, projects: list })); else fs.rmSync(f, { force: true }); } done.push(".tmp/active_montage.json (سطر التجربة)"); } }
  { const r = spawnSync(process.execPath, ["tools/set_title.mjs", "--list"], { cwd: ROOT, encoding: "utf8" });
    for (const id of (r.stdout || "").split(/\r?\n/).map((l) => l.split("  ←  ")[0].trim()).filter((id) => id && ownName(id))) { if (!dry) spawnSync(process.execPath, ["tools/set_title.mjs", "--remove", id], { cwd: ROOT, encoding: "utf8" }); done.push(`عنوان ${id}`); } }
  for (const f of [R("data", "preview_proxies.json")]) { const j = json(f, null); if (j && typeof j === "object") { const ks = Object.keys(j).filter(ownName); if (ks.length) { if (!dry) { const fresh = json(f, {}); for (const k of ks) delete fresh[k]; fs.writeFileSync(f, JSON.stringify(fresh, null, 1)); } done.push(`${path.relative(ROOT, f)} (${ks.length})`); } } }
  { const f = R("src", "compositionDates.ts"); try { const s = fs.readFileSync(f, "utf8"), t = s.split("\n").filter((l) => !(/^\s*"[^"]+":/.test(l) && ownName(l.split('"')[1]))).join("\n"); if (t !== s) { if (!dry) fs.writeFileSync(f, t); done.push("src/compositionDates.ts (سطور التجربة)"); } } catch { /* none */ } }
  /* files and folders by name */
  const DIRS = [".tmp", ".tmp/gates", ".tmp/gpu_render", ".tmp/bumper_orig", ".tmp/locks", ".tmp/stills_bundle", "public", "data/specs", "data/youtube", "data/publish_queue", "render_work", "render_work/gpu", "render_work/export", "render_work/audit"];
  for (const d of DIRS) { let ns = []; try { ns = fs.readdirSync(R(d)); } catch { continue; } for (const n of ns) if (ownName(n)) rm(R(d, n)); }
  /* what is still there (a tool wrote somewhere new): named, never guessed at */
  if (!dry) for (const d of DIRS) { try { for (const n of fs.readdirSync(R(d))) if (ownName(n)) left.push(`${d}/${n}`); } catch { /* none */ } }
  for (const f of ["src/compositionTitles.ts", "src/compositionDates.ts", "data/preview_proxies.json", "data/render_queue/state.json", ".tmp/active_montage.json"]) { try { if (!dry && /zz_?rehearsal/i.test(fs.readFileSync(R(f), "utf8"))) left.push(`${f} (يذكر التجربة)`); } catch { /* none */ } }
  return { done, left };
}

/* ── the fixed test video: rebuilt from data/rehearsal/source.json when missing ── */
function ensureSource() {
  const m = json(path.join(DATA, "source.json"), null); if (!m) return "✘ لا data/rehearsal/source.json";
  const f = R(m.file);
  if (fs.existsSync(f) && Math.abs(Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout) - m.durationS) < 0.5) return "";
  if (!fs.existsSync(R(m.origin))) return `✘ الفيديو الثابت مفقود (${m.file}) وأصله غير موجود (${m.origin}): اختر أصلاً آخر في data/rehearsal/source.json`;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const n = m.ranges.length, A = m.audioTracks ?? 1; let fc = "", cat = "";
  m.ranges.forEach(([a, b], i) => { fc += `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS[v${i}];`; for (let k = 0; k < A; k++) fc += `[0:a:${k}]atrim=${a}:${b},asetpts=PTS-STARTPTS[a${k}_${i}];`; cat += `[v${i}]` + Array.from({ length: A }, (_, k) => `[a${k}_${i}]`).join(""); });
  fc += `${cat}concat=n=${n}:v=1:a=${A}[v]` + Array.from({ length: A }, (_, k) => `[A${k}]`).join("");
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-hwaccel", "cuda", "-i", R(m.origin), "-filter_complex", fc, "-map", "[v]", ...Array.from({ length: A }, (_, k) => ["-map", `[A${k}]`]).flat(), ...m.encode, "-threads", "4", "-metadata", `creation_time=${m.creationTime}`, f], { encoding: "utf8", windowsHide: true });
  return r.status === 0 ? "" : `✘ بناء الفيديو الثابت فشل: ${lastLines(r.stderr)}`;
}
/* a cover picture for the cover-first gate: a frame of the test video (the real one comes from the cover agent; not part of the engine's timing) */
const coverFrame = (dst, portrait) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", "20", "-i", path.join(DIR, "source.mp4"), "-frames:v", "1", "-vf", portrait ? "crop=608:1080:656:0,scale=1080:1920" : "scale=1920:1080", dst], { encoding: "utf8", windowsHide: true }); return r.status === 0; };

/* ── run ── */
async function run({ quick, keep, noPurge, from = null, to = null }) {
  const { guardSelf, lock } = await import("./proc.mjs");
  if (!lock("rehearsal")) process.exit(3);
  guardSelf(`rehearsal${quick ? " --quick" : ""}`, { project: P, ttlMin: 120 });
  try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
  fs.rmSync(LOGS, { recursive: true, force: true }); fs.mkdirSync(LOGS, { recursive: true }); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(DATA, { recursive: true });
  const stages = plan({ quick, keep, noPurge }), rec = { at: new Date().toISOString(), commit: commit(), mode: quick ? "quick" : "full", stages: {}, steps: {}, notes: [] };
  const res = {}, t0 = Date.now(); let abort = false;
  const prog = (cur) => fs.writeFileSync(PROG, JSON.stringify({ pid: process.pid, startedAt: t0, mode: rec.mode, current: cur, done: res }, null, 1));
  const ctx = { minutes: 0, reelMinutes: 0, renders: {} };
  /* --from <stage>: the stages before it are REUSED from the project as it is on disk (a re-run after a fix, or after a stage another tool was still finishing) */
  if (from) { if (!stages.some((s) => s.id === from)) { console.error(`✘ لا مرحلة ${from}: ${stages.map((s) => s.id).join(", ")}`); process.exit(2); } rec.from = from;
    ctx.minutes = +((json(R("public", `${P}_map.json`), {}).duration ?? 0) / 60).toFixed(2); rec.cutS = Math.round(ctx.minutes * 60); rec.sourceS = json(path.join(DATA, "source.json"), {}).durationS;
    ctx.reelMinutes = +((json(R("public", `${REEL}_map.json`), null)?.duration ?? (json(R("data", "specs", `${REEL}.json`), {}).frames ?? 0) / FPS) / 60).toFixed(2); rec.reelS = Math.round(ctx.reelMinutes * 60); rec.gpuAtStart = gpuNow();
    /* the setup stage is skipped: the pause of a foreign GPU job it does is done here (resumed at the end as always) */
    { const GB = await import("./lib/gpu_busy.mjs"), pr = GB.pauseForMontage({ by: P }); if (pr.line) { rec.notes.push(pr.line); console.log("  " + pr.line); rec.gpuPaused = pr.paused.map((x) => ({ pid: x.pid, name: x.name })); } } }
  let reached = !from, passedTo = false;   // --to <stage>: stop after it (a debugging run; the record says where it stopped)
  if (to) { if (!stages.some((s) => s.id === to)) { console.error(`✘ لا مرحلة ${to}: ${stages.map((s) => s.id).join(", ")}`); process.exit(2); } rec.to = to; }
  const note = (s) => { rec.notes.push(s); console.log("  " + s); };
  /* (rehearsal 2026-11-21, ledger rehearsal-guard-unreported) the rehearsal stands in for the agent, so it reports each stage it RAN to the montage guard
     (tools/montage_guard.mjs stage: skill, what was done, artifacts the guard checks exist) — before, every check failed on «tasks: مفتوح 10» because no stage
     was ever reported. Only a stage that passed is reported; a failed one stays unreported and the task list stays open, as it should. */
  const G = (proj, stage, skill, done, artifacts = []) => { const r = spawnSync(process.execPath, ["tools/montage_guard.mjs", "stage", proj, stage, "--skill", skill, "--done", done, ...artifacts.flatMap((a) => ["--artifact", a])], { cwd: ROOT, encoding: "utf8", windowsHide: true }); if (r.status !== 0) note(`⚠ تقرير المرحلة ${stage} لـ${proj}: ${(r.stderr || r.stdout || "").trim().split(/\r?\n/).pop()}`); };
  const REPORT = {
    setup: () => G(P, "questions", "first-questions", "الأجوبة الأولى ثابتة للتجربة (data/rehearsal/first_answers.json: عرضي + ريل، بلا مقاطع مضافة)", [`.tmp/${P}/first_answers.json`]),
    cut: () => G(P, "cut", "video-cutting", "stage cut بالاقتراح كما هو (الإعادات وكتل «مونتاج» من cut_proposal.md، وبوابة الصوت داخله)", [`public/${P}_map.json`]),
    scans: () => { G(P, "context", "montage-orders", "orders_scan وتعليمات «مونتاج» والإعادات (montage_kickoff _early)"); G(P, "assets", "extraction", "سجل المطلوب والأماكن والتلاوة (requirements، names_scan، recitation_check)", [`.tmp/${P}/requirements.json`]); },
    spec: () => G(P, "cover", "thumbnail-design", "غلاف التجربة: إطار من الفيديو الثابت، أول عنصر (cover_item --fix)", [`public/${P}/cover_land.png`]),
    reel: () => { G(REEL, "questions", "first-questions", "أجوبة الحلقة (الريل منها)", [`.tmp/${P}/first_answers.json`]); G(REEL, "cut", "reel-from-episode", "شريحة من قص الحلقة بالقصة المعتمدة آلياً (وصلاتها مفحوصة)", [`public/${REEL}_map.json`]);
      G(REEL, "context", "montage-orders", "تعليمات الحلقة؛ لا كتلة «مونتاج» في أجزاء الريل"); G(REEL, "assets", "extraction", "سجل مطلوب الريل من كلماته المزاحة", [`.tmp/${REEL}/requirements.json`]); G(REEL, "cover", "thumbnail-design", "غلاف الريل: إطار طولي من الفيديو الثابت", [`public/${P}/cover_reel.png`]); },
  };
  const reportBuilt = (proj, picks) => { G(proj, "plan", "video-montage", "الخطة = اختيارات الباني (قالبه بافتراضياته كما هو)", [path.relative(ROOT, picks)]); G(proj, "hook", "gallery-placement", "الهوك والدقيقة الأولى من الباني (لا فراغ > 1 ث)"); G(proj, "build", "video-montage", "montage_build: كل البوابات على المواصفة المكتوبة", [`data/specs/${proj}.json`]); };
  const reportReview = (proj) => G(proj, "review", "checking", "المراجعة: stage check الكامل يجري الآن، ثم فحص ما قبل الرندر والرندر والفحص النهائي في هذه التجربة");

  const ops = {
    async setup() {
      const pg = noPurge ? { done: [] } : purge(); if (pg.done.length) note(`بقايا تجربة سابقة حُذفت: ${pg.done.length}`);
      rec.gpuAtStart = gpuNow(); if (rec.gpuAtStart?.util >= 30) note(`⚠ كرت الشاشة مشغول قبل البدء (${rec.gpuAtStart.util}%، ${rec.gpuAtStart.memMiB} م.ب): أوقات التفريغ والرندر هنا أبطأ من جهاز فارغ`);
      /* (ledger prerender-gpu-silent-hang) a foreign long job holding the card is paused (never killed) for the rehearsal and resumed at its end (tools/lib/gpu_busy.mjs) */
      { const GB = await import("./lib/gpu_busy.mjs"), pr = GB.pauseForMontage({ by: P }); if (pr.line) { note(pr.line); rec.gpuPaused = pr.paused.map((x) => ({ pid: x.pid, name: x.name })); } else if (pr.why) note(`⚠ ${pr.why}`); }
      const g = freeG(); rec.freeG = g; if (g < MIN_FREE_G) return { ok: false, why: `مساحة S: ${g} غيغا < ${MIN_FREE_G} (REHEARSAL_MIN_FREE_G)` };
      const e = ensureSource(); if (e) return { ok: false, why: e };
      fs.mkdirSync(R(".tmp", P), { recursive: true }); fs.copyFileSync(path.join(DATA, "first_answers.json"), R(".tmp", P, "first_answers.json"));
      rec.sourceS = json(path.join(DATA, "source.json"), {}).durationS; return { ok: true };
    },
    async prep(s) { const r = await runCmd(s.id, s.cmds[0], { timeoutMin: 30, watch: R(".tmp", P, "stage_prep.log") }); rec.steps.prep = r.steps; return { ok: r.code === 0, why: lastLines(r.tail) }; },
    async proposal(s) { const r = await runCmd(s.id, s.cmds[0], { timeoutMin: 3 }); return { ok: r.code === 0, why: lastLines(r.tail) }; },
    async cut(s) {
      const md = fs.readFileSync(R(".tmp", P, "cut_proposal.md"), "utf8"), rem = md.match(/--rem\s+(\S+)/)?.[1] ?? "";
      const args = [...s.cmds[0].slice(0, 4), ...(rem ? ["--rem", rem] : [])]; if (rem) note(`القص بالاقتراح: --rem ${rem}`);
      const r = await runCmd(s.id, args, { timeoutMin: 30, watch: R(".tmp", P, "stage_cut.log") }); rec.steps.cut = r.steps;
      ctx.minutes = +((json(R("public", `${P}_map.json`), {}).duration ?? 0) / 60).toFixed(2); rec.cutS = Math.round(ctx.minutes * 60);
      return { ok: r.code === 0, why: lastLines(r.tail) };
    },
    async smooth() { const f = R(".tmp", P, "smooth.running"), t = Date.now(); while (fs.existsSync(f) && Date.now() - t < 20 * 60e3) await new Promise((r) => setTimeout(r, 2000)); return fs.existsSync(f) ? { ok: false, why: "التنعيم لم ينته في 20 دقيقة" } : { ok: true }; },
    async scans(s) { const bad = []; for (const c of s.cmds) { if (!has(c[1])) { note(`تخطٍّ: ${c[1]} غير موجود`); continue; } const r = await runCmd(s.id, c, { timeoutMin: 10 }); if (r.code !== 0) bad.push(`${path.basename(c[1])}: ${lastLines(r.tail, 2)}`); } return { ok: !bad.length, why: bad.join(" ‖ ") }; },
    async spec(s) {
      const title = json(path.join(DATA, "first_answers.json"), {}).title ?? "تجربة شاملة";
      if (!coverFrame(R("public", P, "cover_land.png"), false) || !coverFrame(R("public", P, "cover_reel.png"), true)) return { ok: false, why: "صورة الغلاف التجريبية لم تُصنع" };   // before the draft: it puts the cover first
      const r = await runCmd(s.id, s.cmds[0].map((a) => (a === "<first_answers.title>" ? title : a)), { timeoutMin: 10 }); if (r.code !== 0 || !has(`data/specs/${P}.json`)) return { ok: false, why: lastLines(r.tail) };
      const c = await runCmd(s.id, s.cmds[2], { timeoutMin: 2 }); return { ok: c.code === 0, why: lastLines(c.tail) };
    },
    async reel(s) {
      /* the story is «approved» as it is. When the builder refuses parts of its own story (a join with no quiet gap), that is an ENGINE failure and is recorded as one,
         but the reel is still built from the story minus the refused parts (--ranges), so the reel's check and render are measured in the same run */
      let fail = "";
      for (const c of s.cmds) { const r = await runCmd(s.id, c, { timeoutMin: 15 }); if (r.code === 0) continue;
        if (c.includes("--approved")) { fail = `${c.slice(2).join(" ")}: ${lastLines(r.tail)}`; const bad = new Set([...r.tail.matchAll(/الجزء (\d+):/g)].map((m) => Number(m[1])));
          const keep = (json(R(".tmp", P, "reel_ranges.json"), {}).parts ?? []).map((x) => x.n).filter((n) => !bad.has(n));
          if (!bad.size || !keep.length) return { ok: false, why: fail };
          note(`الريل: القصة كما هي رُفضت (الأجزاء ${[...bad].join("،")}) — يُبنى من الباقي (${keep.join(",")}) لقياس فحصه ورندره`);
          const r2 = await runCmd(s.id, ["node", "tools/reel_from_episode.mjs", P, "--ranges", keep.join(",")], { timeoutMin: 15 }); if (r2.code !== 0) return { ok: false, why: `${fail} ‖ --ranges ${keep.join(",")}: ${lastLines(r2.tail)}` };
        } else return { ok: false, why: `${c.slice(2).join(" ")}: ${lastLines(r.tail)}` }; }
      ctx.reelMinutes = +((json(R("public", `${REEL}_map.json`), null)?.duration ?? (json(R("data", "specs", `${REEL}.json`), {}).frames ?? 0) / FPS) / 60).toFixed(2); rec.reelS = Math.round(ctx.reelMinutes * 60); return fail ? { ok: false, why: fail } : { ok: true }; },
    async build(s) {
      if (!has(s.optional)) { note(`تخطٍّ: ${s.optional} لم يُبنَ بعد (وكيل آخر يبنيه) — البناء الآلي غير مقيس`); return { ok: true, skipped: true }; }
      /* the AUTO picks file = the builder's own template (every moment and requirement with its default), taken as it is: no question asked */
      const bad = []; for (const c of s.cmds) { if (c[2] === REEL && !has(`data/specs/${REEL}.json`)) continue;
        const picks = R(".tmp", P, `rehearsal_picks_${c[2]}.json`), t = await runCmd(s.id, ["node", "tools/montage_build.mjs", c[2], "--picks-template", "--out", path.relative(ROOT, picks)], { timeoutMin: 10 });
        if (t.code !== 0 || !fs.existsSync(picks)) { bad.push(`${c[2]} --picks-template: ${lastLines(t.tail, 2)}`); continue; }
        const r = await runCmd(s.id, [...c.slice(0, 3), "--picks", path.relative(ROOT, picks)], { timeoutMin: 20 }); if (r.code !== 0) bad.push(`${c[2]}: ${lastLines(r.tail, 2)}`); else reportBuilt(c[2], picks); }
      return { ok: !bad.length, why: bad.join(" ‖ ") };
    },
    async check_land(s) { reportReview(P); const a = s.cmds[0].map((x) => (x === "<Comp>-L" ? compOf(P, "land") : x === "<m>" ? String(Math.max(0.2, ctx.minutes)) : x)); const r = await runCmd(s.id, a, { timeoutMin: 30, watch: R(".tmp", P, "stage_check.log") }); rec.steps.check_land = r.steps; return { ok: r.code === 0, why: (r.tail.match(/^✘.*$/gm) ?? []).slice(0, 4).join(" ‖ ").slice(0, 500) || lastLines(r.tail) }; },
    async check_reel(s) { if (!has(`data/specs/${REEL}.json`)) return { ok: false, why: "لا ريل (فشلت مرحلة الريل)" }; reportReview(REEL); const a = s.cmds[0].map((x) => (x === "<Comp>" ? compOf(REEL, "port") : x === "<m>" ? String(Math.max(0.2, ctx.reelMinutes)) : x)); const r = await runCmd(s.id, a, { timeoutMin: 30, watch: R(".tmp", REEL, "stage_check.log") }); rec.steps.check_reel = r.steps; return { ok: r.code === 0, why: (r.tail.match(/^✘.*$/gm) ?? []).slice(0, 4).join(" ‖ ").slice(0, 500) || lastLines(r.tail) }; },
    async prerender(s) { if (!has(s.optional)) { note(`تخطٍّ: ${s.optional} لم يُبنَ بعد (وكيل آخر يبنيه)`); return { ok: true, skipped: true }; }
      const bad = []; for (const c of s.cmds) { if (c[2] === REEL && !has(`data/specs/${REEL}.json`)) continue; const r = await runCmd(s.id, c, { timeoutMin: 30 }); if (r.code !== 0) bad.push(`${c[2]}: ${r.timedOut ? "تجاوز 30 دقيقة — " : ""}${lastLines(r.tail, 2)}`); } return { ok: !bad.length, why: bad.join(" ‖ ") }; },
    async render(s, id, o) {
      if (!has(`data/specs/${id}.json`)) return { ok: false, why: "لا مواصفة" };
      const g = freeG(); if (g < MIN_FREE_G) return { ok: false, why: `مساحة S: ${g} غيغا < ${MIN_FREE_G}` };
      const comp = compOf(id, o), a = ["bash", "tools/gpu/render_project.sh", id, o === "land" ? comp : compOf(id, "land"), comp, ".tmp/rehearsal/out"];
      const t = Date.now(), r = await runCmd(s.id, a, { timeoutMin: 60, env: { ...s.env, GR_MIN_FREE_G: String(MIN_FREE_G), GPU_KEEP_PAUSED: "1" } });   /* the rehearsal resumes a paused foreign job itself, at its end (not between its two renders) */
      const m = r.tail.match(/\b[LR]: exit (\d+) in (\d+)s/), file = path.join(OUT, `${comp}.mp4`);
      const rep = (() => { try { return fs.readdirSync(R("render_work")).filter((n) => n.startsWith(`gpu_render_${comp}_`) && fs.statSync(R("render_work", n)).mtimeMs > t).sort().map((n) => json(R("render_work", n), null)).pop(); } catch { return null; } })();
      const videoS = rep?.frames ? rep.frames / FPS : Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout) || 0;
      const renderS = m ? Number(m[2]) : r.sec;
      ctx.renders[o] = { comp, file, renderS, videoS: +videoS.toFixed(1), perMin: videoS ? +(renderS / (videoS / 60)).toFixed(1) : null, judderS: +(r.sec - renderS).toFixed(1), fps: rep?.fpsEndToEnd ?? null };
      const judderOk = /judder result: .*PASSED/.test(r.tail);
      return { ok: !!m && m[1] === "0" && fs.existsSync(file) && judderOk, why: !m ? lastLines(r.tail) : m[1] !== "0" ? `الرندر خرج ${m[1]}: ${lastLines(r.tail)}` : !judderOk ? `فحص الارتجاف: ${(r.tail.match(/judder result: .*/) ?? ["لا نتيجة"])[0]}` : "" };
    },
    async render_land(s) { return ops.render(s, P, "land"); },
    async render_reel(s) { return ops.render(s, REEL, "port"); },
    async preview(s, id, o) {
      if (!has(`data/specs/${id}.json`)) return { ok: false, why: "لا مواصفة" };
      const comp = compOf(id, o), frames = json(R("data", "specs", `${id}.json`), {}).frames ?? 0, bad = [], per = [];
      for (const a of [Math.min(900, Math.max(0, frames - 300)), Math.max(0, Math.floor(frames / 2) - 150)]) {
        const r = await runCmd(s.id, ["node", "tools/gpu_render.mjs", "--comp", comp, "--out", path.join(".tmp/rehearsal/out", `quick_${comp}_${a}.mp4`), "--start", String(a), "--end", String(Math.min(frames, a + 300)), "--no-bumper", "--scale", "0.5", "--name", id], { timeoutMin: 10 });
        if (r.code !== 0) bad.push(`${a}: ${lastLines(r.tail, 2)}`); else per.push(r.sec / ((Math.min(frames, a + 300) - a) / FPS / 60));
      }
      ctx.renders[o] = { comp, sample: true, perMin: per.length ? +(per.reduce((x, y) => x + y, 0) / per.length).toFixed(1) : null };
      return { ok: !bad.length, why: bad.join(" ‖ ") };
    },
    async preview_land(s) { return ops.preview(s, P, "land"); },
    async preview_reel(s) { return ops.preview(s, REEL, "port"); },
    async final_review() {
      const bad = []; for (const [o, id] of [["land", P], ["port", REEL]]) { const x = ctx.renders[o]; if (!x?.file || !fs.existsSync(x.file)) { bad.push(`${o}: لا ملف`); continue; }
        const r = await runCmd("final_review", ["node", "tools/final_review.mjs", path.relative(ROOT, x.file).replace(/\\/g, "/"), "--name", id], { timeoutMin: 15 }); if (r.code !== 0) bad.push(`${id}: ${(r.tail.match(/^.*✘.*$/gm) ?? [lastLines(r.tail, 2)]).slice(0, 3).join(" | ")}`); }
      return { ok: !bad.length, why: bad.join(" ‖ ").slice(0, 600) };
    },
    async purge() { const r = purge(); note(`التنظيف: ${r.done.length} حُذف${r.left.length ? `، بقي: ${r.left.join("، ")}` : ""}`); return { ok: !r.left.length, why: r.left.join("، ") }; },
  };

  console.log(`[تجربة شاملة ${rec.mode}] ${rec.at} — المحرك ${rec.commit}`);
  for (const s of stages) {
    if (!reached && s.id === from) reached = true;
    if (!reached) { res[s.id] = { status: "reused" }; continue; }
    if (passedTo) { res[s.id] = { status: "skipped" }; continue; }   // a --to run keeps what it made (no purge)
    if (abort && s.id !== "purge") { res[s.id] = { status: "skipped" }; continue; }
    prog(s.id); const ts = Date.now();
    let r; try { r = await ops[s.id](s); } catch (e) { r = { ok: false, why: "انهار: " + String(e?.stack ?? e).slice(0, 300) }; }
    const sec = +((Date.now() - ts) / 1000).toFixed(1);
    res[s.id] = { status: r.skipped ? "skipped" : r.ok ? "ok" : "fail", sec, ...(r.ok ? {} : { why: r.why }) };
    rec.stages[s.id] = sec;
    console.log(`${r.skipped ? "◌" : r.ok ? "✔" : "✘"} ${s.ar}: ${mmss(sec)}${r.ok ? "" : ` — ${String(r.why ?? "").slice(0, 300)}`}`);
    if (r.ok && !r.skipped) REPORT[s.id]?.();
    if (!r.ok && s.hard) abort = true;
    if (to && s.id === to) passedTo = true;
  }
  const sum = (ids) => +ids.reduce((x, id) => x + (rec.stages[id] ?? 0), 0).toFixed(1);
  const montageIds = stages.filter((s) => s.montage).map((s) => s.id);
  rec.total = +((Date.now() - t0) / 1000).toFixed(1); rec.montageTotal = sum(montageIds);
  const stepSec = (k, re) => +((rec.steps[k] ?? []).filter((x) => re.test(x.step)).reduce((a, x) => a + x.sec, 0)).toFixed(1);
  rec.transcribeS = stepSec("prep", /transcribe_vad_segments/); rec.alignS = stepSec("prep", /words_table/); rec.diarizeS = stepSec("prep", /diarize/);
  rec.render = ctx.renders;
  rec.result = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.status]));
  const fails = Object.entries(res).filter(([, v]) => v.status === "fail");
  rec.ok = !fails.length && !rec.to && !rec.from; if (rec.to || rec.from) rec.partial = true; rec.firstFail = fails[0]?.[0] ?? null; rec.fails = Object.fromEntries(fails.map(([k, v]) => [k, String(v.why ?? "").slice(0, 400)]));
  /* the 30-minute verdict for a 10-minute episode: every stage scaled by its own driver (recording length, cut length, reel length; fixed costs stay) */
  if (rec.sourceS && rec.cutS) {
    const ep = 600, src = rec.sourceS, cut = rec.cutS, k = { prep: ep / src, cut: ep / src, smooth: (ep * cut / src) / cut, scans: (ep * cut / src) / cut, check_land: (ep * cut / src) / cut };
    const land = ctx.renders.land, reel = ctx.renders.port, epCut = ep * cut / src;
    const est = Object.fromEntries(montageIds.filter((id) => !/^render_|^preview_/.test(id)).map((id) => [id, +((rec.stages[id] ?? 0) * (k[id] ?? 1)).toFixed(0)]));
    if (land?.perMin) est.render_land = Math.round(land.perMin * epCut / 60 + (land.judderS ?? 0));
    if (reel?.perMin) est.render_reel = Math.round(reel.perMin * (rec.reelS ?? 90) / 60 + (reel.judderS ?? 0));
    rec.estimate10min = { ...est, total: Object.values(est).reduce((a, b) => a + b, 0) };
  }
  { const GB = await import("./lib/gpu_busy.mjs"), rr = GB.resumePaused({ by: P, reason: "انتهت التجربة الشاملة" }); if (rr.line) note(rr.line); }   // (ledger prerender-gpu-silent-hang) never left suspended
  fs.appendFileSync(TIMES, JSON.stringify(rec) + "\n");
  prog(null);
  console.log(`\n${rec.partial && !fails.length ? `✔ نجحت المراحل المشغّلة (تشغيل جزئي${rec.from ? ` من ${rec.from}` : ""}${rec.to ? ` حتى ${rec.to}` : ""} — ليس نجاح التجربة)` : rec.ok ? "✔ نجحت التجربة" : `✘ فشلت التجربة عند «${stages.find((s) => s.id === rec.firstFail)?.ar ?? rec.firstFail}»`} — المجموع ${mmss(rec.total)} (المونتاج ${mmss(rec.montageTotal)}) لفيديو ${mmss(rec.sourceS ?? 0)} قُصّ إلى ${mmss(rec.cutS ?? 0)}`);
  console.log(`  التفريغ ${mmss(rec.transcribeS)} · المحاذاة ${mmss(rec.alignS)} · المتحدثون ${mmss(rec.diarizeS)}`);
  for (const [o, x] of Object.entries(ctx.renders)) console.log(`  رندر ${o === "land" ? "العرضي" : "الريل"}: ${x.perMin ?? "—"} ث لكل دقيقة فيديو${x.sample ? " (عيّنة نوافذ بنصف الحجم)" : ` (${mmss(x.renderS)} لـ${mmss(x.videoS)}، ثم الارتجاف ${mmss(x.judderS)})`}`);
  if (rec.estimate10min) console.log(`  تقدير حلقة 10 دقائق: ${mmss(rec.estimate10min.total)} — ${Object.entries(rec.estimate10min).filter(([k]) => k !== "total").sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${mmss(v)}`).join("، ")}`);
  console.log(`  السجل: data/rehearsal/times.jsonl · السجلات: .tmp/rehearsal/logs/`);
  process.exit(rec.ok ? 0 : 1);
}

/* ── CLI (only when run directly: guard_selftest imports isEngineFile) ── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.chdir(ROOT);
  const argv = process.argv.slice(2), flag = (f) => argv.includes(f), cmd = argv.find((a) => !a.startsWith("--")) ?? (flag("--dry-run") ? "plan" : "");
  const quick = flag("--quick"), noPurge = flag("--no-purge"), keep = flag("--keep") || noPurge;
  if (flag("--dry-run") || cmd === "plan") {
    const pl = plan({ quick, keep, noPurge });
    if (flag("--json")) { console.log(JSON.stringify({ project: P, reel: REEL, mode: quick ? "quick" : "full", out: ".tmp/rehearsal/out", times: "data/rehearsal/times.jsonl", stages: pl }, null, 1)); process.exit(0); }
    console.log(`[خطة بلا تشغيل] التجربة الشاملة ${quick ? "السريعة" : "الكاملة"} — المشروع ${P} (والريل ${REEL})، النواتج .tmp/rehearsal/out:`);
    for (const s of pl) console.log(`  ${s.hard ? "■" : "□"} ${s.id}: ${s.ar}${s.optional ? ` (إن وُجد ${s.optional})` : ""}\n${s.cmds.map((c) => `      ${Array.isArray(c) ? c.join(" ") : c}`).join("\n")}`);
    process.exit(0);
  }
  if (cmd === "status") { const g = json(PROG, null); if (!g) { console.log("لا تجربة تعمل"); process.exit(0); } let alive = false; try { process.kill(g.pid, 0); alive = true; } catch { /* gone */ }
    console.log(`${alive ? (g.current ? `تعمل الآن: ${g.current}` : "انتهت") : "توقفت"} — منذ ${mmss((Date.now() - g.startedAt) / 1000)} (${g.mode})`); for (const [k, v] of Object.entries(g.done ?? {})) console.log(`  ${v.status === "ok" ? "✔" : v.status === "fail" ? "✘" : "◌"} ${k} ${v.sec != null ? mmss(v.sec) : ""}`); process.exit(0); }
  if (cmd === "times") { const n = Number(argv[argv.indexOf("--last") + 1]) || 10; const ls = (() => { try { return fs.readFileSync(TIMES, "utf8").trim().split("\n").map((l) => JSON.parse(l)); } catch { return []; } })().slice(-n);
    for (const r of ls) console.log(`${r.at.slice(0, 16)} ${r.commit} ${r.mode} ${r.ok ? "✔" : `✘ ${r.firstFail}`} المجموع ${mmss(r.total)} · التفريغ ${mmss(r.transcribeS ?? 0)} · ${Object.entries(r.stages).map(([k, v]) => `${k} ${mmss(v)}`).join(" · ")}${r.estimate10min ? ` · تقدير 10د ${mmss(r.estimate10min.total)}` : ""}`); process.exit(0); }
  if (cmd === "purge") { const r = purge({ dry: flag("--dry") }); console.log(`${flag("--dry") ? "[تجربة] " : ""}حُذف ${r.done.length}: ${r.done.join("، ") || "—"}${r.left.length ? `\n✘ بقي: ${r.left.join("، ")}` : ""}`); process.exit(r.left.length ? 1 : 0); }
  if (cmd === "start") {
    fs.mkdirSync(DIR, { recursive: true });
    const r = spawnSync(process.execPath, ["tools/proc.mjs", "run", "--label", "rehearsal", "--project", P, "--ttl", "120", "--log", path.join(DIR, "run.log"), "--", process.execPath, "tools/rehearsal.mjs", "run", ...(quick ? ["--quick"] : []), ...(keep ? ["--keep"] : []), ...(noPurge ? ["--no-purge"] : [])], { encoding: "utf8" });
    console.log(`✔ بدأت التجربة الشاملة${quick ? " السريعة" : ""} في الخلفية (العملية ${(r.stdout || "").trim().split(/\r?\n/).pop()}) — المتابعة: node tools/rehearsal.mjs status · السجل .tmp/rehearsal/run.log`); process.exit(r.status ?? 0);
  }
  if (cmd === "run") await run({ quick, keep, noPurge, from: argv.includes("--from") ? argv[argv.indexOf("--from") + 1] : null, to: argv.includes("--to") ? argv[argv.indexOf("--to") + 1] : null });
  else { console.error("usage: node tools/rehearsal.mjs start|run [--quick] [--keep] [--no-purge] [--from <stage>] | --dry-run [--quick] [--json] | status | times [--last N] | purge [--dry]"); process.exit(2); }
}
