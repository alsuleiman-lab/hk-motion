#!/usr/bin/env node
// STREAM DRESS REHEARSAL (user 2026-11-22: a 3 h 47 min stream, the whole montage in ≤ 2 hours, ZERO errors on the real run — «لازم ما أشوف أخطاء»).
// An engine bug must show up for the first time HERE, on a 10-minute sample of the real stream, never on his stream. This runs the STREAM flow of the skill
// lessons-and-streams (items 0–15) end to end on that sample, isolated under the project `zz_stream_rehearsal` (clips zz_stream_rehearsal_1…3), a stopwatch on
// every stage, a REAL render of the 3 clips through the render queue into .tmp/zz_stream_rehearsal/out (never «جاهز», nothing uploaded), then final_review.
//   node tools/stream/stream_rehearsal.mjs plan [--json]      the stages in order with their tools and the last measured times; nothing runs, nothing is written
//   node tools/stream/stream_rehearsal.mjs start [--purge]    detached in the background (tools/proc.mjs: low priority, registered, ttl 150 min) → returns at once
//   node tools/stream/stream_rehearsal.mjs run [--purge] [--from <stage>] [--to <stage>]   the work itself (only through tools/bg.sh or run_in_background)
//   node tools/stream/stream_rehearsal.mjs status             the stage running now          node tools/stream/stream_rehearsal.mjs times [--last N]   the measured runs
//   node tools/stream/stream_rehearsal.mjs report             the table of the last run: seconds, ×22.7, and which stages scale linearly and which do not
//   node tools/stream/stream_rehearsal.mjs purge [--dry]      removes ONLY zz_stream_rehearsal* data (scoped by name) and its registry lines
// NOTHING IS DELETED unless asked: `run` leaves the project on disk (to read the outputs); `run --purge` clears the leftovers of an earlier run before the first stage
// and the run's data after the last; `purge` alone does it by hand. (The hooks forbid a sub-agent to delete in .tmp/<project>/ public/ data/specs/: such a run
// leaves the data and the main session purges.)
// The sample: data/rehearsal/stream_source.json (10 min of the real recording from 30:00, three audio tracks, stream copy, read-only origin).
// The inputs a human wrote once: data/rehearsal/stream_plan.json (the 3 clips of the sample: one call, one > 2 min → landscape, one ≤ 2 min → portrait, start/end
// phrases from the sample's own transcript) and data/rehearsal/stream_titles.json. Each run appends ONE line to data/rehearsal/stream_times.jsonl.
// --from <stage>: reuse the project as it is on disk up to that stage (a re-run after a fix; the record says from where). --to <stage>: stop after it, nothing purged.
// A hard stage (setup, prep, split, cut, slice) that fails stops the run; any other failure is recorded and the run goes on so one run measures every stage.
// The card: another session's voice training may hold it; tools/lib/gpu_busy.mjs pauses it (never kills) and the run resumes it at its end.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const P = "zz_stream_rehearsal", CLIPS = [`${P}_1`, `${P}_2`, `${P}_3`];
const R = (...a) => path.join(ROOT, ...a);
const DIR = R(".tmp", P), OUT = path.join(DIR, "out"), LOGS = path.join(DIR, "rh_logs"), PROG = path.join(DIR, "rh_progress.json");
const DATA = R("data", "rehearsal"), TIMES = path.join(DATA, "stream_times.jsonl"), SRCJ = path.join(DATA, "stream_source.json");
const FPS = 30, MIN_FREE_G = Number(process.env.REHEARSAL_MIN_FREE_G ?? 16), STREAM_S = 13609, SCALE = Math.round((STREAM_S / 600) * 10) / 10;   // 22.7
const NODE = "node", STANDIN = "people/azharMosque.jpg";   // the stand-in picture of the rehearsal (public/people): the real flow's research lane supplies the images
const json = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const has = (f) => fs.existsSync(R(f));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const hms = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const commit = () => { const h = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim(); const d = spawnSync("git", ["status", "--porcelain", "--", "tools", "src"], { cwd: ROOT, encoding: "utf8" }).stdout.trim(); return h + (d ? "+dirty" : ""); };
const gpuNow = () => { const r = spawnSync("nvidia-smi", ["--query-gpu=utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"], { encoding: "utf8", windowsHide: true }); const [u, m, t] = (r.stdout || "").trim().split(",").map((x) => Number(x.trim())); return Number.isFinite(u) ? { util: u, memMiB: m, totalMiB: t } : null; };
const freeG = () => { const r = spawnSync("powershell", ["-NoProfile", "-Command", "[math]::Floor((Get-PSDrive S).Free/1GB)"], { encoding: "utf8", windowsHide: true }); return Number(r.stdout.trim()) || 0; };
const lastLines = (s, n = 3) => String(s ?? "").trim().split(/\r?\n/).filter(Boolean).slice(-n).join(" | ").slice(0, 500);
const mapDur = (id) => json(R("public", `${id}_map.json`), {}).duration ?? 0;
const realDur = (id, fallback = 0) => { const s = json(R("data", "specs", `${id}.json`), null); return s?.frames ? s.frames / FPS : fallback; };

/* ── THE PLAN: one list, printed by `plan` and run by `run` ── */
export function plan() {
  const clips = CLIPS.join(" ");
  const S = [
    { id: "setup", ar: "تهيئة: المساحة، الكرت، عيّنة الـ10 دقائق (3 مسارات صوت)", hard: true, montage: false, tools: ["purge (scoped, only with --purge)", "gpu_busy.mjs pause", "ffmpeg -c copy (stream copy, read-only origin)"] },
    { id: "start", ar: "بدء الساعتين", hard: false, montage: false, tools: [`${NODE} tools/stream/fast_run.mjs start ${P}`] },
    { id: "prep", ar: "التجهيز على العيّنة كلها (كشف كلام، تفريغ، محاذاة، متكلمون، مصادر)", hard: true, tools: [`STREAM_WHOLE=1 ${NODE} tools/stage.mjs prep ${P} <العيّنة>`] },
    { id: "split", ar: "خطة المقاطع الثلاثة وحدودها من الكلمات", hard: true, tools: [`data/rehearsal/stream_plan.json → .tmp/${P}/plan.json`, `${NODE} tools/stream/clip_cut_all.mjs .tmp/${P}/plan.json --resolve`] },
    { id: "cut", ar: "قصّ واحد للعيّنة كلها (مرور واحد بلا بوابة صوت)", hard: true, tools: [`bash tools/stream/cut_smart.sh ${P}`, `${NODE} tools/stream/lost_speech_check.mjs ${P}`] },
    { id: "slice", ar: "اقتطاع المقاطع شرائح (4 معاً) وبوابة الصوت لكل شريحة", hard: true, tools: [`${NODE} tools/stream/fast_run.mjs slice ${P}`] },
    { id: "titles", ar: "العناوين وكلمات الغلاف (titles.json)", hard: false, montage: false, tools: [`data/rehearsal/stream_titles.json → .tmp/${P}/titles.json`] },
    { id: "build", ar: "البناء الآلي (قالب البث السريع)", hard: false, tools: [`${NODE} tools/stream/clip_autobuild.mjs ${P} <id> --run`] },
    { id: "pictures", ar: "صور المذكورات وعناصر المستحقات (pictures.json بـvals) ثم pick_triggers", hard: false, tools: [`${NODE} tools/stream/clip_pictures.mjs ${P} ${clips}`] },
    { id: "repair", ar: "الإصلاح الآلي للمواصفات", hard: false, tools: [`${NODE} tools/stream/clip_repair.mjs ${clips}`] },
    { id: "montage_build", ar: "الباني الآلي الجديد (يُجرَّب على مقطع بث بنسخة مؤقتة)", hard: false, tools: [`${NODE} tools/montage_build.mjs <id> --picks-template --out <scratch>`] },
    { id: "scans", ar: "آيات وأحاديث وتلاوة وأسماء مشكوكة لكل مقطع", hard: false, tools: ["verse_scan.mjs", "hadith_scan.mjs", "recitation_check.mjs", "name_doubt.mjs"].map((t) => `${NODE} tools/${t} <id>`) },
    { id: "prerender", ar: "فحص ما قبل الرندر لكل مقطع", hard: false, tools: [`${NODE} tools/prerender_check.mjs <id> --o land|port`] },
    { id: "checks", ar: "فحوص المقاطع (3 معاً)", hard: false, tools: [`${NODE} tools/stream/fast_run.mjs checks ${P}`] },
    { id: "render", ar: "الرندر الحقيقي للثلاثة عبر الطابور إلى .tmp/zz_stream_rehearsal/out", hard: false, tools: [`${NODE} tools/stream/fast_run.mjs queue ${P} --dest <out>/طولي`, `${NODE} tools/render_queue.mjs run (detached worker)`] },
    { id: "final_review", ar: "الفحص النهائي على كل ملف مرندر", hard: false, tools: [`${NODE} tools/final_review.mjs <file> --name <id>`] },
    { id: "purge", ar: "تنظيف التجربة وحدها (مع --purge فقط)", hard: false, montage: false, tools: ["purge zz_stream_rehearsal* (scoped)"] },
  ];
  return S.map((s) => ({ montage: true, ...s }));
}

/* ── how each stage scales to the whole stream (the table `report` prints; the reasons are the answer to «which scale linearly and which do not») ── */
export const SCALING = {
  setup: { k: "fixed", why: "ثابت: فحوص ومساحة وإيقاف الكرت (والعيّنة نسخ بلا ترميز؛ البث الحقيقي لا يُقتطع)" },
  start: { k: "fixed", why: "ثابت" },
  prep: { k: "linear", why: "خطي بالمدة لكل خطوة فرعية (كشف الكلام، تفريغ كرت الشاشة، محاذاة، متكلمون، نوافذ المصدر)؛ ويُخشى من غير الخطي في ملف 3.8 ساعة: ذاكرة المحاذاة والتمييز (ملف صوت واحد)، فيُقاس بتجربة أطول قبل البث" },
  split: { k: "human", why: "لا يتناسب مع المدة: قراءة التفريغ وكتابة الخطة عمل يدوي بقدر طول التفريغ، وحساب الحدود من الكلمات خطي رخيص" },
  cut: { k: "linear", why: "خطي: بناء الخطة من الكلمات ثم ترميز واحد على الكرت؛ لكن جولات الإعادة (حتى 3) تضاعفه عند عيب بنيوي" },
  slice: { k: "clips", why: "بعدد المقاطع ومجموع مدتها لا بمدة البث: كل شريحة ترميز + كشف كلام + بوابة صوت (4 معاً)" },
  titles: { k: "fixed", why: "نسخ ملف؛ كتابة العناوين نفسها عمل يدوي بعدد المقاطع" },
  build: { k: "clips", why: "بعدد المقاطع وطولها (ما يُبنى من كلماتها)؛ ثلاثة مقاطع لا تمثّل كثافة بث كامل" },
  pictures: { k: "clips", why: "بعدد المذكورات والمقاطع" },
  repair: { k: "clips", why: "بعدد المقاطع" },
  montage_build: { k: "clips", why: "بعدد المقاطع وطولها" },
  scans: { k: "clips", why: "بعدد المقاطع؛ الأسماء المشكوكة تعيد تفريغ مقطع صغير لكل اسم (يتبع عدد الأسماء لا الطول)" },
  prerender: { k: "clips", why: "بعدد المقاطع ومدتها: دمج الصوت ومعاينة صغيرة لكل مقطع" },
  checks: { k: "clips", why: "بعدد المقاطع (3 معاً) ومدتها؛ شبكة الفحص (grid_sheet) ثابتة نسبياً لكل مقطع" },
  render: { k: "linear-gpu", why: "خطي بمجموع دقائق المقاطع على كرت واحد وبالتتابع (لا توازٍ)، وأي حمل من جلسة أخرى على الكرت يبطّئه" },
  final_review: { k: "clips", why: "بعدد المقاطع ومدتها (فك الصوت كاملاً بالنموذج الكبير في الفحص)" },
  purge: { k: "fixed", why: "ثابت" },
};

/* ── running a child: low priority, own log, a time box, sub-steps read live from the stage log («$ …» lines) ── */
const lowPrio = (pid) => { try { os.setPriority(pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* gone */ } };
const killTree = (pid) => spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true });
const subLabel = (line) => { const m = line.match(/tools\/[\w/]+\.(?:mjs|py|sh)/); if (m) return m[0].replace(/^tools\//, ""); const w = line.slice(2).trim().split(/\s+/)[0] ?? ""; return path.basename(w).replace(/\.exe$/i, ""); };
function runCmd(stage, args, { env = {}, timeoutMin = 40, watch = null } = {}) {
  return new Promise((res) => {
    fs.mkdirSync(LOGS, { recursive: true });
    const log = path.join(LOGS, `${stage}.log`), t0 = Date.now();
    fs.appendFileSync(log, `\n$ ${args.join(" ")}   [${new Date().toISOString()}]\n`);
    const c = spawn(args[0], args.slice(1), { cwd: ROOT, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", FAST_RUN_KEEP_CACHE: "1", ...env } });
    lowPrio(c.pid);
    let tail = "", timedOut = false; const take = (d) => { const s = d.toString(); tail = (tail + s).slice(-8000); fs.appendFileSync(log, s); };
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

/* ── the scoped purge: ONLY names that carry «zzstreamrehearsal» (case, - and _ ignored); never .tmp/rehearsal, data/rehearsal, the origin or anything of another project ── */
export const ownName = (n) => String(n).toLowerCase().replace(/[-_]/g, "").includes("zzstreamrehearsal");
export function purge({ dry = false } = {}) {
  const done = [], left = [];
  const rm = (f) => { if (!dry) fs.rmSync(f, { recursive: true, force: true, maxRetries: 6, retryDelay: 300 }); done.push(path.relative(ROOT, f).replace(/\\/g, "/")); };
  /* registry lines first (the hooks read them) */
  { const f = R(".tmp", "active_montage.json"), reg = json(f, null);
    if (reg?.projects?.some(ownName)) { const list = reg.projects.filter((x) => !ownName(x)); if (!dry) { if (list.length) fs.writeFileSync(f, JSON.stringify({ ...reg, projects: list })); else fs.rmSync(f, { force: true }); } done.push(".tmp/active_montage.json (سطر التجربة)"); } }
  { const f = R("data", "render_queue", "state.json"), st = json(f, null);   // only my jobs; the other sessions' jobs stay as they are
    if (st?.jobs?.some((j) => ownName(j.spec))) { if (!dry) { const fresh = json(f, st); fresh.jobs = fresh.jobs.filter((j) => !ownName(j.spec)); fs.writeFileSync(f, JSON.stringify(fresh, null, 1)); } done.push("data/render_queue/state.json (مهام التجربة)"); } }
  { const r = spawnSync(process.execPath, ["tools/set_title.mjs", "--list"], { cwd: ROOT, encoding: "utf8" });
    for (const id of (r.stdout || "").split(/\r?\n/).map((l) => l.split("  ←  ")[0].trim()).filter((id) => id && ownName(id))) { if (!dry) spawnSync(process.execPath, ["tools/set_title.mjs", "--remove", id], { cwd: ROOT, encoding: "utf8" }); done.push(`عنوان ${id}`); } }
  { const f = R("data", "preview_proxies.json"), j = json(f, null); if (j && typeof j === "object") { const ks = Object.keys(j).filter(ownName); if (ks.length) { if (!dry) { const fresh = json(f, {}); for (const k of ks) delete fresh[k]; fs.writeFileSync(f, JSON.stringify(fresh, null, 1)); } done.push(`data/preview_proxies.json (${ks.length})`); } } }
  { const f = R("src", "compositionDates.ts"); try { const s = fs.readFileSync(f, "utf8"), t = s.split("\n").filter((l) => !(/^\s*"[^"]+":/.test(l) && ownName(l.split('"')[1]))).join("\n"); if (t !== s) { if (!dry) fs.writeFileSync(f, t); done.push("src/compositionDates.ts (سطور التجربة)"); } } catch { /* none */ } }
  const DIRS = [".tmp", ".tmp/gates", ".tmp/gpu_render", ".tmp/bumper_orig", ".tmp/locks", ".tmp/stills_bundle", ".tmp/cache", "public", "data/specs", "data/youtube", "data/publish_queue", "render_work", "render_work/gpu", "render_work/export", "render_work/audit"];
  for (const d of DIRS) { let ns = []; try { ns = fs.readdirSync(R(d)); } catch { continue; } for (const n of ns) if (ownName(n)) rm(R(d, n)); }
  for (const o of ["R", "L"]) { let ns = []; try { ns = fs.readdirSync(R("render_work", "export", o)); } catch { continue; } for (const n of ns) if (ownName(n)) rm(R("render_work", "export", o, n)); }
  if (!dry) for (const d of DIRS) { try { for (const n of fs.readdirSync(R(d))) if (ownName(n)) left.push(`${d}/${n}`); } catch { /* none */ } }
  for (const f of ["src/compositionTitles.ts", "src/compositionDates.ts", "data/preview_proxies.json", "data/render_queue/state.json", ".tmp/active_montage.json", "src/Root.tsx"]) { try { if (!dry && /zz_?stream_?rehearsal/i.test(fs.readFileSync(R(f), "utf8"))) left.push(`${f} (يذكر التجربة)`); } catch { /* none */ } }
  return { done, left };
}

/* ── the sample: 10 minutes of the real stream from 30:00, stream copy, the origin read-only, all three audio tracks ── */
function ensureSample() {
  const m = json(SRCJ, null); if (!m) return "✘ لا data/rehearsal/stream_source.json";
  const f = R(m.file), probe = (x) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", x], { encoding: "utf8" }).stdout) || 0;
  const tracks = (x) => (spawnSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", x], { encoding: "utf8" }).stdout || "").trim().split(/\s+/).filter(Boolean).length;
  if (fs.existsSync(f) && Math.abs(probe(f) - m.lengthS) < 1.5 && tracks(f) === m.audioTracks) return "";
  if (!fs.existsSync(m.origin)) return `✘ التسجيل الأصلي غير موجود: ${m.origin}`;
  if (path.resolve(f).toLowerCase().includes(path.join("Users", "mshms", "Videos").toLowerCase())) return "✘ العيّنة لا تُكتب تحت Videos";
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(m.startS), "-i", m.origin, "-t", String(m.lengthS), "-map", "0:v:0", ...Array.from({ length: m.audioTracks }, (_, k) => ["-map", `0:a:${k}`]).flat(), "-c", "copy", "-avoid_negative_ts", "make_zero", f], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return `✘ اقتطاع العيّنة فشل: ${lastLines(r.stderr)}`;
  return Math.abs(probe(f) - m.lengthS) < 1.5 && tracks(f) === m.audioTracks ? "" : `✘ العيّنة ليست ${m.lengthS} ث بـ${m.audioTracks} مسارات`;
}

/* ── run ── */
async function run({ purgeOn, from = null, to = null }) {
  const { guardSelf, lock } = await import("../proc.mjs");
  if (!lock("stream_rehearsal")) process.exit(3);
  guardSelf("stream_rehearsal", { project: P, ttlMin: 150 });
  try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(LOGS, { recursive: true });
  const stages = plan(), rec = { at: new Date().toISOString(), commit: commit(), mode: "stream", stages: {}, steps: {}, perClip: {}, notes: [], sampleS: json(SRCJ, {}).lengthS ?? 600, streamS: STREAM_S };
  const res = {}, t0 = Date.now(); let abort = false;
  const prog = (cur) => fs.writeFileSync(PROG, JSON.stringify({ pid: process.pid, startedAt: t0, current: cur, done: res }, null, 1));
  const note = (s) => { rec.notes.push(s); console.log("  " + s); };
  const GB = await import("../lib/gpu_busy.mjs");
  if (from) { if (!stages.some((s) => s.id === from)) { console.error(`✘ لا مرحلة ${from}: ${stages.map((s) => s.id).join(", ")}`); process.exit(2); } rec.from = from; rec.gpuAtStart = gpuNow();
    const pr = GB.pauseForMontage({ by: P }); if (pr.line) { note(pr.line); rec.gpuPaused = pr.paused.map((x) => ({ pid: x.pid, name: x.name })); } }
  let reached = !from, passedTo = false;
  if (to) { if (!stages.some((s) => s.id === to)) { console.error(`✘ لا مرحلة ${to}: ${stages.map((s) => s.id).join(", ")}`); process.exit(2); } rec.to = to; }
  const clipsOf = () => CLIPS.filter((id) => has(`data/specs/${id}.json`) || has(`public/${id}_map.json`));
  const table = () => json(R(".tmp", P, "clip_table.json"), []);
  const perClip = (stage, id, sec) => { (rec.perClip[stage] ??= {})[id] = +sec.toFixed(1); };
  const src = () => path.relative(ROOT, R(json(SRCJ, {}).file ?? "")).replace(/\\/g, "/");
  const orientOf = (id) => (realDur(id, table().find((c) => c.id === id)?.dur ?? 0) > 120 ? "L" : "R");
  /* every stage that needs clips of the plan, one after another per clip (so each clip's own seconds are known) */
  const eachClip = async (stage, mk, { ids = null, timeoutMin = 20 } = {}) => {
    const bad = []; for (const id of ids ?? clipsOf()) { const c = mk(id); if (!c) continue; const r = await runCmd(stage, c, { timeoutMin }); perClip(stage, id, r.sec); if (r.code !== 0) bad.push(`${id}: ${r.timedOut ? "تجاوز الوقت — " : ""}${(r.tail.match(/^.*✘.*$/gm) ?? [lastLines(r.tail, 2)]).slice(0, 2).join(" | ")}`); }
    return { ok: !bad.length, why: bad.join(" ‖ ").slice(0, 700) };
  };

  const ops = {
    async setup() {
      if (purgeOn) { const pg = purge(); if (pg.done.length) note(`بقايا تجربة سابقة حُذفت: ${pg.done.length}`); }
      else if (has(`.tmp/${P}/words_vad.json`)) note("بقايا تجربة سابقة على القرص (لم تُحذف: بلا --purge): المراحل تعيد كتابة ناتجها");
      fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
      rec.gpuAtStart = gpuNow(); if (rec.gpuAtStart?.util >= 30) note(`⚠ كرت الشاشة مشغول قبل البدء (${rec.gpuAtStart.util}%، ${rec.gpuAtStart.memMiB} م.ب): أوقات التفريغ والرندر أبطأ من جهاز فارغ`);
      { const pr = GB.pauseForMontage({ by: P }); if (pr.line) { note(pr.line); rec.gpuPaused = pr.paused.map((x) => ({ pid: x.pid, name: x.name })); } else if (pr.why) note(`⚠ ${pr.why}`); }
      const g = freeG(); rec.freeG = g; if (g < MIN_FREE_G) return { ok: false, why: `مساحة S: ${g} غيغا < ${MIN_FREE_G}` };
      const e = ensureSample(); if (e) return { ok: false, why: e };
      return { ok: true };
    },
    async start(s) { const r = await runCmd(s.id, s.tools[0].split(" "), { timeoutMin: 3 }); return { ok: r.code === 0, why: lastLines(r.tail) }; },
    async prep() { const r = await runCmd("prep", [NODE, "tools/stage.mjs", "prep", P, src()], { timeoutMin: 40, env: { STREAM_WHOLE: "1" }, watch: R(".tmp", P, "stage_prep.log") }); rec.steps.prep = r.steps; return { ok: r.code === 0, why: lastLines(r.tail) }; },
    async split() {
      const pl = json(path.join(DATA, "stream_plan.json"), null); if (!pl) return { ok: false, why: "لا data/rehearsal/stream_plan.json" };
      fs.writeFileSync(R(".tmp", P, "plan.json"), JSON.stringify({ ...pl, src: src(), words: `.tmp/${P}/words_vad.json` }, null, 1));
      const r = await runCmd("split", [NODE, "tools/stream/clip_cut_all.mjs", `.tmp/${P}/plan.json`, "--resolve"], { timeoutMin: 3 }); if (r.code !== 0) return { ok: false, why: lastLines(r.tail) };
      const t = table(), land = t.filter((c) => c.dur >= 150), port = t.filter((c) => c.dur <= 100);
      if (t.length !== 3 || !land.length || !port.length) return { ok: false, why: `شكل المقاطع المطلوب (3: واحد ≥ 150 ث عرضي وواحد ≤ 100 ث طولي): ${t.map((c) => `${c.id} ${Math.round(c.dur)}ث`).join("، ")}` };
      note(`المقاطع: ${t.map((c) => `${c.id} ${mmss(c.dur)}`).join("، ")}`); return { ok: true };
    },
    async cut() {
      const drops = json(R(".tmp", P, "plan.json"), {}).drops ?? "";   // the retakes judged from redo.txt (cut_smart.sh's second argument)
      const tc = Date.now();
      const r = await runCmd("cut", ["bash", "tools/stream/cut_smart.sh", P, ...(drops ? [drops] : [])], { timeoutMin: 30, env: { STREAM_WHOLE: "1" } });
      /* the two halves of cut_smart.sh (stage cut rounds / post_cut: onset check, a second large-v3 pass over the CUT audio, merge), told apart by the files they write */
      { const mt = (f) => { try { return fs.statSync(R(".tmp", P, f)).mtimeMs; } catch { return 0; } }, loops = (fs.existsSync(DIR) ? fs.readdirSync(DIR) : []).filter((f) => /^loop_cut_\d+\.log$/.test(f)).map(mt).filter((x) => x >= tc);
        if (loops.length) { const mid = Math.max(...loops); rec.steps.cut = [{ step: "cut_loop (stage cut: plan, audio cut; no cut video since the lazy stream 2026-11-22)", sec: +((mid - tc) / 1000).toFixed(1) }, { step: "post_cut (onset, large-v3 words over the cut, merge)", sec: +((Date.now() - mid) / 1000).toFixed(1) }]; } }
      if (r.code !== 0 || /cut FAILED/.test(r.tail) || !has(`public/${P}_map.json`) || !has(process.env.STREAM_ENCODE === "1" ? `public/${P}_cut.mp4` : `.tmp/${P}/cut_audio.wav`)) return { ok: false, why: lastLines(r.tail, 4) };
      rec.cutS = Math.round(mapDur(P));
      const l = await runCmd("cut", [NODE, "tools/stream/lost_speech_check.mjs", P], { timeoutMin: 5 }); return { ok: l.code === 0, why: lastLines(l.tail, 3) };
    },
    async slice() {
      /* the agent's decisions on the review sounds (data/rehearsal/stream_noise_ok.json) are written before the slice, where the agent would write them after the gate's first refusal */
      for (const [id, dec] of Object.entries(json(path.join(DATA, "stream_noise_ok.json"), {}))) if (!id.startsWith("_")) { fs.mkdirSync(R(".tmp", id), { recursive: true }); fs.writeFileSync(R(".tmp", id, "noise_ok.json"), JSON.stringify(dec, null, 1)); }
      const r = await runCmd("slice", [NODE, "tools/stream/fast_run.mjs", "slice", P, "--jobs", "4"], { timeoutMin: 30 });
      for (const l of (fs.existsSync(R(".tmp", P, "clip_batch.log")) ? fs.readFileSync(R(".tmp", P, "clip_batch.log"), "utf8").split("\n") : [])) { const m = l.match(/\((\d+)s\).*?✔ (zz_stream_rehearsal_\d)/); if (m) perClip("slice", m[2], Number(m[1])); }
      return { ok: r.code === 0, why: lastLines(r.tail, 4) };
    },
    async titles() { const f = path.join(DATA, "stream_titles.json"); if (!fs.existsSync(f)) return { ok: false, why: "لا data/rehearsal/stream_titles.json" }; fs.copyFileSync(f, R(".tmp", P, "titles.json")); return { ok: true }; },
    async build() { return eachClip("build", (id) => [NODE, "tools/stream/clip_autobuild.mjs", P, id, "--run"], { timeoutMin: 20 }); },
    async pictures() {
      /* what the agent / the research lane gives each clip (rules «صور المذكورات» 2026-11-19 + «لا طلب إعفاء»): a picture for every mention of requirements.json and an element for every DUE pick.
         The pictures here are a STAND-IN image from public/people (the image search is not what is measured, and nothing of this is ever published); the picks are data/rehearsal/stream_picks.json. */
      const pics = {}, picks = json(path.join(DATA, "stream_picks.json"), {});
      for (const id of clipsOf()) { const rows = json(R(".tmp", id, "requirements.json"), []), list = [];
        for (const q of Array.isArray(rows) ? rows : []) { if (!(q.need ?? []).includes("pic")) continue; const at = +(+q.t).toFixed(2); list.push(q.kind === "person" ? { el: "PinnedPhoto", at, until: +(at + 4).toFixed(2), src: STANDIN, name: q.text } : { el: "PhotoFrame", at, until: +(at + 4).toFixed(2), src: STANDIN }); }
        pics[id] = [...list, ...(picks[id] ?? [])]; }
      fs.writeFileSync(R(".tmp", P, "pictures.json"), JSON.stringify(pics, null, 1));
      const r = await runCmd("pictures", [NODE, "tools/stream/clip_pictures.mjs", P, ...clipsOf()], { timeoutMin: 10 }); if (r.code !== 0) return { ok: false, why: lastLines(r.tail) };
      /* the due picks are judged right here, before any later stage: a due pick with no element is a failure of THIS stage */
      const bad = []; for (const id of clipsOf()) { const t = await runCmd("pictures", [NODE, "tools/pick_triggers.mjs", `data/specs/${id}.json`], { timeoutMin: 3 }); if (t.code !== 0) bad.push(`${id}: ${(t.tail.match(/^✘.*$/gm) ?? []).slice(0, 2).join(" | ")}`); }
      return { ok: !bad.length, why: bad.join(" ‖ ").slice(0, 600) };
    },
    async repair() { const r = await runCmd("repair", [NODE, "tools/stream/clip_repair.mjs", ...clipsOf()], { timeoutMin: 10 }); return { ok: r.code === 0 && !/✘/.test(r.tail), why: lastLines(r.tail, 4) }; },
    async montage_build() {
      /* does the episode builder apply to a stream clip? it is probed on a SCRATCH out (never over the clip's real spec): the picks template of every clip */
      const bad = []; for (const id of clipsOf()) { const out = path.join(".tmp", P, `mb_${id}.picks.json`), r = await runCmd("montage_build", [NODE, "tools/montage_build.mjs", id, "--picks-template", "--out", out], { timeoutMin: 5 }); perClip("montage_build", id, r.sec); if (r.code !== 0 || !has(out)) bad.push(`${id}: ${lastLines(r.tail, 2)}`); }
      return { ok: !bad.length, why: bad.join(" ‖ ") };
    },
    async scans() {
      const bad = []; for (const id of clipsOf()) { const t0 = Date.now();
        for (const c of [["verse_scan.mjs", id], ["hadith_scan.mjs", id], ["recitation_check.mjs", id], ["name_doubt.mjs", id]]) {
          if (c[0] === "name_doubt.mjs") { const nm = json(R(".tmp", id, "requirements.json"), []); const names = (Array.isArray(nm) ? nm : nm.items ?? []).filter((x) => /place|person|name|مكان|شخص/.test(String(x.kind ?? x.type ?? ""))).slice(0, 3).map((x) => `${x.name ?? x.text}@${Math.round(x.t ?? x.at ?? 0)}`); if (!names.length) { note(`${id}: لا اسم في سجل المطلوب لـname_doubt`); continue; } c.push(...names); }
          const r = await runCmd("scans", [NODE, `tools/${c[0]}`, ...c.slice(1)], { timeoutMin: 10 }); if (r.code !== 0) bad.push(`${id} ${c[0]}: ${(r.tail.match(/^.*✘.*$/gm) ?? [lastLines(r.tail, 2)]).slice(0, 2).join(" | ")}`); }
        perClip("scans", id, (Date.now() - t0) / 1000); }
      /* the sample has no recited verse and no hadith (30:00–40:00 of the stream), so the three detectors found nothing real: they are also run once on a PROBE project (his words replaced by
         Al Imran 3:110 and the hadith of intentions, the stream clip's file layout) so a detector that stopped detecting fails here, not on the stream. Card building after Shamela verification is not run. */
      { const PR = `${P}_probe`, txt = "كنتم خير أمة أخرجت للناس تأمرون بالمعروف وتنهون عن المنكر وتؤمنون بالله ثم قال النبي صلى الله عليه وسلم إنما الأعمال بالنيات وإنما لكل امرئ ما نوى فمن كانت هجرته إلى الله ورسوله فهجرته إلى الله ورسوله";
        const W = txt.split(" ").map((w, i) => ({ w, s: +(1 + i * 0.45).toFixed(2), e: +(1 + i * 0.45 + 0.4).toFixed(2) }));
        fs.mkdirSync(R(".tmp", PR), { recursive: true }); for (const f of ["cut_words.json", "words.json"]) fs.writeFileSync(R(".tmp", PR, f), JSON.stringify(W));
        fs.writeFileSync(R("public", `${PR}_map.json`), JSON.stringify({ segments: [{ a: 0, b: 30, n: 0 }], duration: 30 }));
        const probe = {};
        for (const [k, c, re] of [["verse", ["verse_scan.mjs", PR], /\(1 تلاوة\)/], ["hadith", ["hadith_scan.mjs", PR], /hadith: 1 narration/], ["recitation", ["recitation_check.mjs", PR, "--no-audio"], /1 تلاوة، كلها كما في المصحف/]]) {
          const r = await runCmd("scans", [NODE, `tools/${c[0]}`, ...c.slice(1)], { timeoutMin: 5 }); probe[k] = r.code === 0 && re.test(r.tail); if (!probe[k]) bad.push(`probe ${k}: لم يكشف ما وُضع له (${lastLines(r.tail, 2)})`); }
        rec.probe = probe; note(`مجسّ الكشف (آية 3:110 وحديث النيات): ${Object.entries(probe).map(([k, v]) => `${k} ${v ? "✔" : "✘"}`).join("، ")}`); }
      return { ok: !bad.length, why: bad.join(" ‖ ").slice(0, 700) };
    },
    async prerender() { return eachClip("prerender", (id) => [NODE, "tools/prerender_check.mjs", id, "--o", orientOf(id) === "L" ? "land" : "port"], { timeoutMin: 30 }); },
    async checks() {
      const r = await runCmd("checks", [NODE, "tools/stream/fast_run.mjs", "checks", P, "--jobs", "3"], { timeoutMin: 40 });
      for (const m of r.tail.matchAll(/[✔✘] (zz_stream_rehearsal_\d) \((\d+)s\)/g)) perClip("checks", m[1], Number(m[2]));
      return { ok: r.code === 0, why: (r.tail.match(/^✘.*$/gm) ?? [lastLines(r.tail, 3)]).slice(0, 3).join(" ‖ ").slice(0, 600) };
    },
    async render() {
      const g = freeG(); if (g < MIN_FREE_G) return { ok: false, why: `مساحة S: ${g} غيغا < ${MIN_FREE_G}` };
      const dest = path.join(OUT, "طولي"), q = await runCmd("render", [NODE, "tools/stream/fast_run.mjs", "queue", P, "--dest", dest], { timeoutMin: 20 });
      const mine = () => (json(R("data", "render_queue", "state.json"), { jobs: [] }).jobs ?? []).filter((j) => ownName(j.spec));
      if (!mine().length) return { ok: false, why: `لا مهمة دخلت الطابور: ${lastLines(q.tail, 4)}` };
      const rejected = mine().filter((j) => j.state === "rejected"); const seen = {}, t1 = Date.now();
      /* the worker is detached by fast_run; wait for every one of my jobs to finish (done / failed / rejected), noting the second each one left the queue */
      for (;;) { const js = mine(); for (const j of js) { if (j.state === "rendering") seen[j.spec + j.orient] ??= { start: Date.now() }; if (["done", "failed", "rejected"].includes(j.state) && seen[j.spec + j.orient] && !seen[j.spec + j.orient].end) seen[j.spec + j.orient].end = Date.now(); }
        if (js.every((j) => ["done", "failed", "rejected"].includes(j.state))) break;
        if (Date.now() - t1 > 90 * 60e3) return { ok: false, why: "الرندر لم ينته في 90 دقيقة" };
        { const w = (() => { try { return Number(fs.readFileSync(R("data", "render_queue", "worker.pid"), "utf8")); } catch { return 0; } })(); let up = false; try { process.kill(w, 0); up = !!w; } catch { /* none */ } if (!up && js.some((j) => j.state === "queued")) { spawn(process.execPath, ["tools/render_queue.mjs", "run"], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true }).unref(); note("عامل الطابور لم يكن يعمل: أُعيد تشغيله"); } }
        await new Promise((r2) => setTimeout(r2, 4000)); }
      const js = mine(); rec.render = {}; const bad = [...rejected.map((j) => `${j.spec}: ${j.why}`)];
      for (const j of js) { const v = seen[j.spec + j.orient], sec = v?.end && v?.start ? (v.end - v.start) / 1000 : null, vs = realDur(j.spec); perClip("render", j.spec, sec ?? 0);
        rec.render[j.spec] = { orient: j.orient, state: j.state, renderS: sec != null ? +sec.toFixed(1) : null, videoS: +vs.toFixed(1), perMin: sec != null && vs ? +(sec / (vs / 60)).toFixed(1) : null, to: j.to ?? null };
        if (j.state !== "done") bad.push(`${j.spec}${j.orient}: ${j.err ?? j.why}`); }
      return { ok: !bad.length, why: bad.join(" ‖ ").slice(0, 700) };
    },
    async final_review() {
      const bad = []; for (const [id, x] of Object.entries(rec.render ?? {})) { if (!x.to || !fs.existsSync(x.to)) { bad.push(`${id}: لا ملف`); continue; }
        const r = await runCmd("final_review", [NODE, "tools/final_review.mjs", path.relative(ROOT, x.to).replace(/\\/g, "/"), "--name", id], { timeoutMin: 20 }); perClip("final_review", id, r.sec); if (r.code !== 0) bad.push(`${id}: ${(r.tail.match(/^.*✘.*$/gm) ?? [lastLines(r.tail, 2)]).slice(0, 3).join(" | ")}`); }
      return { ok: !bad.length && !!Object.keys(rec.render ?? {}).length, why: bad.join(" ‖ ").slice(0, 700) || "لا ملف مرندر للفحص" };
    },
    async purge() { const r = purge(); note(`التنظيف: ${r.done.length} حُذف${r.left.length ? `، بقي: ${r.left.join("، ")}` : ""}`); return { ok: !r.left.length, why: r.left.join("، ") }; },
  };

  console.log(`[تجربة البث الشاملة] ${rec.at} — المحرك ${rec.commit} — عيّنة ${mmss(rec.sampleS)} من بث ${hms(STREAM_S)}`);
  for (const s of stages) {
    if (!reached && s.id === from) reached = true;
    if (!reached) { res[s.id] = { status: "reused" }; continue; }
    if (passedTo) { res[s.id] = { status: "skipped" }; continue; }
    if (abort && s.id !== "purge") { res[s.id] = { status: "skipped" }; continue; }
    if (s.id === "purge" && (!purgeOn || to)) { res[s.id] = { status: "skipped" }; continue; }
    prog(s.id); const ts = Date.now();
    try { fs.writeFileSync(path.join(LOGS, `${s.id}.log`), ""); } catch { /* none yet */ }   // each stage's log holds this run only
    if (s.id === "cut" || s.id === "prep") { /* their sub-step logs are written by the tools themselves */ }
    let r; try { r = await ops[s.id](s); } catch (e) { r = { ok: false, why: "انهار: " + String(e?.stack ?? e).slice(0, 300) }; }
    const sec = +((Date.now() - ts) / 1000).toFixed(1);
    res[s.id] = { status: r.skipped ? "skipped" : r.ok ? "ok" : "fail", sec, ...(r.ok ? {} : { why: r.why }) };
    rec.stages[s.id] = sec;
    console.log(`${r.skipped ? "◌" : r.ok ? "✔" : "✘"} ${s.ar}: ${mmss(sec)}${r.ok ? "" : ` — ${String(r.why ?? "").slice(0, 400)}`}`);
    if (!r.ok && s.hard) abort = true;
    if (to && s.id === to) passedTo = true;
  }
  rec.total = +((Date.now() - t0) / 1000).toFixed(1);
  rec.result = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.status]));
  const fails = Object.entries(res).filter(([, v]) => v.status === "fail");
  rec.ok = !fails.length && !rec.to && !rec.from; if (rec.to || rec.from) rec.partial = true; rec.firstFail = fails[0]?.[0] ?? null; rec.fails = Object.fromEntries(fails.map(([k, v]) => [k, String(v.why ?? "").slice(0, 400)]));
  rec.clipS = Object.fromEntries(CLIPS.map((id) => [id, +realDur(id, mapDur(id)).toFixed(1)]));
  { const rr = GB.resumePaused({ by: P, reason: "انتهت تجربة البث الشاملة" }); if (rr.line) note(rr.line); }
  fs.appendFileSync(TIMES, JSON.stringify(rec) + "\n");
  prog(null);
  console.log(`\n${rec.partial && !fails.length ? `✔ نجحت المراحل المشغّلة (تشغيل جزئي${rec.from ? ` من ${rec.from}` : ""}${rec.to ? ` حتى ${rec.to}` : ""} — ليس نجاح التجربة)` : rec.ok ? "✔ نجحت التجربة" : `✘ فشلت التجربة عند «${stages.find((s) => s.id === rec.firstFail)?.ar ?? rec.firstFail}»`} — المجموع ${mmss(rec.total)}`);
  printTable(rec);
  process.exit(rec.ok ? 0 : 1);
}

/* ── the table: seconds on the sample, the straight ×22.7, and the honest scaling per stage ── */
export function scaleRow(id, rec) {
  const sec = rec.stages?.[id] ?? 0, sc = SCALING[id] ?? { k: "fixed", why: "" };
  const lin = sec * SCALE;
  if (sc.k === "fixed") return { id, sec, linear: sec, honest: sec, kind: "ثابت", why: sc.why };
  if (sc.k === "human") return { id, sec, linear: lin, honest: sec, kind: "ليس خطياً", why: sc.why };
  if (sc.k === "linear" || sc.k === "linear-gpu") return { id, sec, linear: lin, honest: lin, kind: "خطي", why: sc.why };
  /* per-clip stages: serial seconds per clip × the clips the stream will have (same clip density as the sample), divided by the jobs that run together */
  const jobs = id === "slice" ? 4 : id === "checks" ? 3 : 1, pc = rec.perClip?.[id], serial = pc && Object.keys(pc).length ? Object.values(pc).reduce((a, b) => a + b, 0) : sec;
  return { id, sec, linear: lin, honest: (serial * SCALE) / jobs, kind: "بعدد المقاطع", why: sc.why };
}
export function printTable(rec) {
  const ids = Object.keys(rec.stages ?? {}); if (!ids.length) return;
  const rows = ids.map((id) => scaleRow(id, rec)), pad = (s, n) => String(s).padEnd(n);
  console.log(`\nالمرحلة          العيّنة(${mmss(rec.sampleS)})   ×${SCALE} خطياً   التقدير الصادق   النوع`);
  for (const r of rows) console.log(`${pad(r.id, 16)} ${pad(mmss(r.sec), 14)} ${pad(hms(r.linear), 14)} ${pad(hms(r.honest), 15)} ${r.kind}`);
  const sum = (k) => rows.filter((r) => !["purge", "setup"].includes(r.id)).reduce((a, r) => a + r[k], 0);
  console.log(`${pad("المجموع", 16)} ${pad(mmss(sum("sec")), 14)} ${pad(hms(sum("linear")), 14)} ${pad(hms(sum("honest")), 15)}`);
}

/* ── CLI (only when run directly: guard_selftest imports the pure functions) ── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.chdir(ROOT);
  const argv = process.argv.slice(2), flag = (f) => argv.includes(f), cmd = argv.find((a) => !a.startsWith("--")) ?? "";
  const last = () => { try { return fs.readFileSync(TIMES, "utf8").trim().split("\n").map((l) => JSON.parse(l)); } catch { return []; } };
  if (cmd === "plan") {
    const all = last(), full = all.filter((r) => r.ok).pop() ?? all.filter((r) => !r.partial).pop() ?? all.pop(), pl = plan();
    if (flag("--json")) { console.log(JSON.stringify({ project: P, clips: CLIPS, out: ".tmp/zz_stream_rehearsal/out", times: "data/rehearsal/stream_times.jsonl", scale: SCALE, stages: pl.map((s) => ({ ...s, measuredS: full?.stages?.[s.id] ?? null, scaling: SCALING[s.id] })) }, null, 1)); process.exit(0); }
    console.log(`[خطة بلا تشغيل] تجربة البث الشاملة — المشروع ${P} (المقاطع ${CLIPS.join("، ")})، النواتج .tmp/zz_stream_rehearsal/out، القياس السابق: ${full ? `${full.at.slice(0, 16)} ${full.commit} ${full.ok ? "نجح" : "فشل عند " + (full.firstFail ?? "جزئي")}` : "لا قياس بعد"}`);
    for (const s of pl) console.log(`  ${s.hard ? "■" : "□"} ${s.id}: ${s.ar}${full?.stages?.[s.id] != null ? `  [${mmss(full.stages[s.id])}]` : ""}\n${s.tools.map((c) => `      ${c}`).join("\n")}`);
    process.exit(0);
  }
  if (cmd === "report") { const r = last().pop(); if (!r) { console.log("لا قياس بعد"); process.exit(0); } console.log(`${r.at.slice(0, 16)} ${r.commit} ${r.ok ? "✔ نجحت" : `✘ ${r.firstFail ?? "جزئي"}`}`); printTable(r); for (const x of Object.keys(r.stages)) console.log(`  ${x}: ${SCALING[x]?.why ?? ""}`); process.exit(0); }
  if (cmd === "status") { const g = json(PROG, null); if (!g) { console.log("لا تجربة تعمل"); process.exit(0); } let alive = false; try { process.kill(g.pid, 0); alive = true; } catch { /* gone */ }
    console.log(`${alive ? (g.current ? `تعمل الآن: ${g.current}` : "انتهت") : "توقفت"} — منذ ${mmss((Date.now() - g.startedAt) / 1000)}`); for (const [k, v] of Object.entries(g.done ?? {})) console.log(`  ${v.status === "ok" ? "✔" : v.status === "fail" ? "✘" : "◌"} ${k} ${v.sec != null ? mmss(v.sec) : ""}`); process.exit(0); }
  if (cmd === "times") { const n = Number(argv[argv.indexOf("--last") + 1]) || 10; for (const r of last().slice(-n)) console.log(`${r.at.slice(0, 16)} ${r.commit} ${r.ok ? "✔" : `✘ ${r.firstFail ?? "جزئي"}`} المجموع ${mmss(r.total)} · ${Object.entries(r.stages).map(([k, v]) => `${k} ${mmss(v)}`).join(" · ")}`); process.exit(0); }
  if (cmd === "purge") { const r = purge({ dry: flag("--dry") }); console.log(`${flag("--dry") ? "[تجربة] " : ""}حُذف ${r.done.length}: ${r.done.join("، ") || "—"}${r.left.length ? `\n✘ بقي: ${r.left.join("، ")}` : ""}`); process.exit(r.left.length ? 1 : 0); }
  if (cmd === "start") {
    fs.mkdirSync(DIR, { recursive: true });
    const r = spawnSync(process.execPath, ["tools/proc.mjs", "run", "--label", "stream_rehearsal", "--project", P, "--ttl", "150", "--log", path.join(DIR, "rh_run.log"), "--", process.execPath, "tools/stream/stream_rehearsal.mjs", "run", ...(flag("--purge") ? ["--purge"] : [])], { encoding: "utf8" });
    console.log(`✔ بدأت تجربة البث الشاملة في الخلفية (العملية ${(r.stdout || "").trim().split(/\r?\n/).pop()}) — المتابعة: node tools/stream/stream_rehearsal.mjs status · السجل .tmp/zz_stream_rehearsal/rh_run.log`); process.exit(r.status ?? 0);
  }
  if (cmd === "run") await run({ purgeOn: flag("--purge"), from: argv.includes("--from") ? argv[argv.indexOf("--from") + 1] : null, to: argv.includes("--to") ? argv[argv.indexOf("--to") + 1] : null });
  else { console.error("usage: node tools/stream/stream_rehearsal.mjs plan [--json] | start|run [--purge] [--from <stage>] [--to <stage>] | status | times [--last N] | report | purge [--dry]"); process.exit(2); }
}
