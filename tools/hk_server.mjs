// HK-Motion tools server (user 2026-11-19: «في الريموشن أستطيع أن أقص بنفسي: أحدد بداية ونهاية وأكبس حذف … أو حذف موسيقى»).
// The Studio runs in a browser and cannot start tools; this small local server does it for the buttons in its «تحديد» strip (src/studioTools.ts), one job at a time:
//   POST /api/preview {comp, a, b}   → what a deletion would take: project, seconds, the words inside (nothing is changed)
//   POST /api/delete  {comp, a, b}   → tools/cut_blocks.mjs --snap-words (smart cut: no re-encode of the video, the span moves to the gaps between words first)
//   POST /api/music   {comp, a, b}   → tools/music_cut.mjs (the music remover on that span only; the video is not touched)
//   POST /api/gallery/list | items | add | del | size | status   the gallery (tools/hk_gallery.mjs, tools/el.mjs): browse, add an element at the Studio's current frame, delete it, make it bigger/smaller/nudge it
//   POST /api/grade/get | set | presets | savepreset | delpreset   the colour tool (tools/hk_grade.mjs): the montage's grade and the saved looks
//   GET  /api/job                    → the running / last job: state, summary, the end of its log
//   GET  /api/ping
// Port = the Studio's port + 99 (remotion.config.ts starts it with the Studio: 3100 → 3199, a Studio on 3200 → 3299).
// comp = the Studio composition id (Sufi-Baath-Both → the spec data/specs/sufi-baath.json); a, b = Studio frames (the Studio adds 150 frames after the montage's bumper: removed here).
// Only private-network clients are served. Run:  node tools/hk_server.mjs [port=3199]   (the Studio launchers start it next to the Studio).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { load as loadGallery } from "./hk_gallery.mjs";
import * as G from "./hk_grade.mjs";
import { state as progressState, nowItem } from "./render_progress.mjs";
import { projectOf } from "./cut_lazy.mjs";
import { registerStudio, watcherAlive } from "./lib/inbox_watch.mjs";
import * as K from "./comp_kinds.mjs";

/* EVERY COMPOSITION, EVERY TOOL (user 2026-11-21, after «رندر» refused a «شيخ الردود» video: «عليه يتعرف على كل شيء ويفعل ميزات لكل شيء، لأن المسألة نحن عندنا
   الآن برنامج متكامل»): tools/comp_kinds.mjs knows what the open composition is (a montage spec, a lesson/stream clip, شيخ الردود، الدبلجة، الموشن، الكرتون، عرض…)
   and how each tool works on it. POST /api/kind {comp} → which tools apply (the strip dims the others and says why); /api/render queues the kind's own job(s);
   /api/delete cuts where the kind has a cut, else the request goes to its owner through «راسلني»; /api/grade/* writes the spec's grade or data/comp_grades.json.
   Every action takes {dry: true}: the decision and the commands are returned, nothing is queued, cut, written or sent (tools/selftest_cases/k_comp_kinds.mjs). */
const toInbox = (comp, text, body = {}) => {
  const m = { id: Date.now().toString(36), at: new Date().toISOString(), comp, frame: Number(body.frame ?? 0), time: String(body.time ?? "0:00"), cutTime: 0, elements: "", text, reply: null };
  if (!body.dry) { fs.mkdirSync(".tmp", { recursive: true }); fs.appendFileSync(INBOX, JSON.stringify(m) + "\n"); }
  return m;
};

/* THE RENDER QUEUE INSIDE HK-MOTION (user 2026-11-19: «ادمج طابور الرندر مع مستوى التقدم في البرنامج الجديد تبعنا»): the queue (tools/render_queue.mjs,
   data/render_queue/state.json) and the progress of every render (tools/render_progress.mjs state()) answered here, shown by the «الطابور» sheet of the
   Studio (src/hkQueuePanel.ts). Adding a montage from the Studio = the user asking for its render (rules: no render without his permission). The worker
   is started registered (tools/proc.mjs: listed, a 12-hour limit) and only when none runs; it exits by itself when the queue is empty. */
/* «راسلني» (user 2026-11-20: «اجعل لي زر أراسلك من هناك… صحح أو غير العنصر… من صفحة ريموشن»): a message written in the Studio, with the composition,
   the frame, the time and the elements on screen, is appended to .tmp/hk_inbox.jsonl; tools/hk_inbox.mjs wakes the agent's session (a background
   wait that ends when a new message lands) and writes the reply back into the same line, shown under the message in the Studio. */
const INBOX = ".tmp/hk_inbox.jsonl";
const inbox = () => { try { return fs.readFileSync(INBOX, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
const QDEST = "C:/Users/mshms/Videos/جاهز", QSTATE = "data/render_queue/state.json", QLOCK = "data/render_queue/worker.pid";
const pidAlive = (n) => { try { process.kill(Number(n), 0); return true; } catch (e) { return e.code === "EPERM"; } };
const workerAlive = () => { try { const n = Number(fs.readFileSync(QLOCK, "utf8")); return n > 0 && pidAlive(n) ? n : 0; } catch { return 0; } };
const startWorker = () => { if (workerAlive()) return false; spawnSync(process.execPath, ["tools/proc.mjs", "run", "--label", "render-worker", "--ttl", "720", "--log", ".tmp/render_worker.log", "--", process.execPath, "tools/render_queue.mjs", "run"], { windowsHide: true }); return true; };
const arTitleOf = (comp) => { try { return fs.readFileSync("src/compositionTitles.ts", "utf8").match(new RegExp(`"${comp}"\\s*:\\s*"([^"]+)"`))?.[1] ?? comp; } catch { return comp; } };
const queueState = () => {
  let jobs = []; try { jobs = JSON.parse(fs.readFileSync(QSTATE, "utf8")).jobs ?? []; } catch { /* empty */ }
  let log = ""; try { log = fs.readFileSync(".tmp/render_queue.log", "utf8").trim().split(/\r?\n/).slice(-6).join("\n"); } catch { /* none */ }
  return { jobs: jobs.map((j) => ({ ...j, ar: arTitleOf(j.comp) })), worker: workerAlive(), progress: progressState(), now: nowItem(), log, dest: QDEST };
};
const NL_RE = new RegExp("\r?\n");
const queue = (url, body) => {
  if (url === "/api/queue/add") {
    const comp = String(body.comp ?? ""), d = K.route("render", comp, body); if (d.do !== "queue") throw new Error(d.message);   // the kind's own job(s) (tools/comp_kinds.mjs)
    const r = spawnSync(process.execPath, [...d.argv, ...(body.dry ? ["--dry"] : [])], { encoding: "utf8", windowsHide: true, timeout: 600000 });
    const out = (r.stdout + r.stderr).trim();
    if (r.status !== 0 || /✘ مرفوض/.test(out)) throw new Error(out.split(/\r?\n/).slice(0, 4).join(" | ") || "رُفض");
    if (body.dry) return { dry: true, message: out };
    const started = startWorker();
    return { message: `✔ في الطابور: ${arTitleOf(comp)}${started ? " — بدأ الإخراج" : ""}`, ...queueState() };
  }
  if (url === "/api/queue/drop" || url === "/api/queue/retry") {
    const r = spawnSync(process.execPath, ["tools/render_queue.mjs", url.endsWith("drop") ? "drop" : "retry", String(body.spec), String(body.orient ?? "")], { encoding: "utf8", windowsHide: true });
    if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim() || "تعذّر");
    if (url.endsWith("retry")) startWorker();
    return queueState();
  }
  throw Object.assign(new Error("not found"), { code: 404 });
};

process.chdir(path.resolve(import.meta.dirname, ".."));
const PORT = Number(process.argv[2] ?? process.env.HK_PORT ?? 3199);
try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
let job = null;   // { id, kind, project, state, startedAt, endedAt, summary, log }
let seq = 0;

const project = (comp) => {
  const base = String(comp ?? "").replace(/-(Both|BothV|L)$/i, "").toLowerCase();
  for (const c of [base, base.replace(/-/g, "_")]) if (fs.existsSync(path.join("data", "specs", `${c}.json`))) return c;
  return null;
};
/** Studio frame → frame of the montage's own timeline (the Studio inserts 150 frames for the bumper after its `at`) */
const specFrame = (spec, f) => {
  const b = spec.bumper;
  if (!b || b.end || !(b.at >= 1)) { if (f > spec.frames) throw new Error(`الإطار ${f} بعد نهاية المونتاج (${spec.frames}): اختر موضعاً من الكلام`); return f; }
  const at = Math.round(b.at * 30);
  if (f <= at) return f;
  if (f < at + 150) throw new Error(`الإطار ${f} داخل الفاصل (${at}–${at + 150}): اختر موضعاً من الكلام`);
  return f - 150;
};
const words = (p) => { try { const raw = JSON.parse(fs.readFileSync(path.join(".tmp", p, "cut_words.json"), "utf8")); return (raw.words ?? raw).map((w) => ({ s: +(w.s ?? w.start), e: +(w.e ?? w.end ?? (w.s ?? w.start) + 0.2), w: String(w.w ?? w.word) })); } catch { return []; } };
const parse = (body) => {
  const comp = String(body.comp ?? ""), p = project(comp);
  if (!p) throw new Error(`لا أجد مواصفة للتركيب «${comp}» (data/specs)`);
  const spec = JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8"));
  let fa = specFrame(spec, Math.round(Number(body.a))), fb = specFrame(spec, Math.round(Number(body.b)));
  if (fa > fb) [fa, fb] = [fb, fa];
  if (!(fb > fa)) throw new Error("النهاية يجب أن تكون بعد البداية");
  if (fb > spec.frames) throw new Error(`النهاية بعد آخر المونتاج (${spec.frames})`);
  return { p, spec, fa, fb };
};

/** the gallery calls: quick tools run to the end here (tools/el.mjs does the editing; its messages are returned as they are) */
const el = (args) => { const r = spawnSync(process.execPath, ["tools/el.mjs", ...args], { encoding: "utf8", maxBuffer: 1 << 26 }); return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() }; };
const gallery = (url, body) => {
  if (job?.state === "running" && url !== "/api/gallery/list" && url !== "/api/gallery/items") throw Object.assign(new Error(`يعمل الآن: ${job.label}`), { code: 409 });
  if (url === "/api/gallery/list") { const g = loadGallery(); return { version: g.version, sizePresets: g.sizePresets, elements: Object.values(g.elements).map((e) => ({ code: e.code, ar: e.ar, group: e.group, orient: e.orient, when: e.when, fields: e.fields, status: e.status, uses: e.uses, place: e.place })) }; }
  const comp = String(body.comp ?? ""), p = project(comp);
  if (url === "/api/gallery/status") { const r = spawnSync(process.execPath, ["tools/hk_gallery.mjs", "status", String(body.code), String(body.status || "none"), ...(body.note ? [String(body.note)] : [])], { encoding: "utf8" }); if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim()); return { message: r.stdout.trim() }; }
  if (url === "/api/gallery/size" && body.gallery) {
    const orient = body.orient === "port" ? "--port" : "--land", a = ["gsize", String(body.code), orient, ...(body.reset ? ["--reset"] : []), ...(body.scale != null ? [`scale=${Number(body.scale)}`] : []), ...(body.dx != null ? [`dx=${Math.round(Number(body.dx))}`] : []), ...(body.dy != null ? [`dy=${Math.round(Number(body.dy))}`] : [])];
    const r = el(a); if (!r.ok) throw new Error(r.err || r.out); return { message: r.out };
  }
  if (!p) throw new Error(`لا أجد مواصفة للتركيب «${comp}» (data/specs)`);
  const spec = JSON.parse(fs.readFileSync(path.join("data", "specs", `${p}.json`), "utf8"));
  if (url === "/api/gallery/items") {
    const r = el(["items", p, "--json"]); if (!r.ok) throw new Error(r.err || r.out);
    const t = body.frame != null ? specFrame(spec, Math.round(Number(body.frame))) / 30 : null;
    return { project: p, now: t, items: JSON.parse(r.out).filter((x) => t == null || (x.from != null && x.from - 0.05 <= t && t <= (x.to ?? x.from + 3) + 0.05)) };
  }
  if (url === "/api/gallery/add") {
    const g = loadGallery(), e = g.elements[String(body.code)]; if (!e) throw new Error(`لا عنصر باسم ${body.code}`);
    const t0 = Math.round((specFrame(spec, Math.round(Number(body.frame))) / 30) * 100) / 100, len = Math.max(0.5, Number(body.len ?? 4)), t1 = Math.round((t0 + len) * 100) / 100, names = new Set(e.fields.map((f) => f.name));
    const timing = [];
    if (names.has("at")) timing.push(`at=${t0}`); if (names.has("from")) timing.push(`from=${t0}`);
    if (names.has("until")) timing.push(`until=${t1}`); if (names.has("to")) timing.push(`to=${t1}`); if (names.has("dur")) timing.push(`dur=${len}`);
    const vals = Object.entries(body.fields ?? {}).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`);
    const r = el(["add", p, e.code, ...timing, ...vals]); if (!r.ok) throw new Error(r.err || r.out);
    return { message: r.out.split("\n")[0], at: t0, until: t1 };
  }
  if (url === "/api/gallery/del") { const r = el(["del", p, `#${String(body.id).replace(/^#/, "")}`]); if (!r.ok) throw new Error(r.err || r.out); return { message: r.out }; }
  if (url === "/api/gallery/size") {
    const o = body.orient === "land" ? "--land" : body.orient === "port" ? "--port" : "--both";
    const a = ["size", p, `#${String(body.id).replace(/^#/, "")}`, ...(o === "--both" ? [] : [o]), ...(body.reset ? ["--reset"] : []), ...(body.k != null ? [`k=${Number(body.k)}`] : []), ...(body.dx != null ? [`dx=${Math.round(Number(body.dx))}`] : []), ...(body.dy != null ? [`dy=${Math.round(Number(body.dy))}`] : [])];
    const r = el(a); if (!r.ok) throw new Error(r.err || r.out); return { message: r.out };
  }
  throw new Error("not found");
};

/** the colour tool: quick, done here (the spec is rewritten, the Studio hot-reloads it) */
const grade = (url, body) => {
  if (url === "/api/grade/presets") return { presets: G.presets() };
  if (url === "/api/grade/savepreset") { G.savePreset(String(body.name ?? "").trim() || "لون جديد", body.grade ?? {}); return { presets: G.presets() }; }
  if (url === "/api/grade/delpreset") { G.deletePreset(String(body.name)); return { presets: G.presets() }; }
  /* (user 2026-11-21) the grade lives where the kind keeps it: a montage spec's `grade`, or data/comp_grades.json for any other composition with a video layer
     (src/compGrade.tsx); a composition without one is answered with the reason */
  const comp = String(body.comp ?? ""), d = K.route("grade", comp, body); if (d.do !== "grade") throw new Error(d.message);
  const p = d.r.project, cur = () => (d.where === "spec" ? G.getGrade(p) : G.getCompGrade(comp)), info = { project: p, comp, where: d.where, scope: d.scope, note: d.note };
  if (url === "/api/grade/get") return { ...info, grade: cur() };
  if (job?.state === "running") throw Object.assign(new Error(`يعمل الآن: ${job.label}`), { code: 409 });
  if (url === "/api/grade/set" && body.dry) return { ...info, dry: true, file: d.r.grade.file, grade: { ...(body.replace ? {} : cur()), ...G.clean(body.grade ?? {}) } };
  if (url === "/api/grade/set") return { ...info, grade: d.where === "spec" ? G.setGrade(p, body.grade ?? {}, !!body.replace) : G.setCompGrade(comp, d.scope, body.grade ?? {}, !!body.replace) };
  throw new Error("not found");
};

/* NOTHING LEFT RUNNING UNUSED (user 2026-11-19: «مطلوب منك أن توقف أي خدمة غير مستعملة حتى ما تستهلك موارد الجهاز»): every open Studio page calls
   /api/alive once a minute (src/studioTools.ts). No page and no job for HK_IDLE_MIN minutes (default 30, user 2026-11-20: «خليه نص ساعة») → the Studio this server came with (its pid is
   the 2nd argument, passed by remotion.config.ts) is stopped with everything under it, then this server exits. */
const IDLE_MIN = Number(process.env.HK_IDLE_MIN || 30), STUDIO_PID = Number(process.argv[3] || 0);
let lastSeen = Date.now();
setInterval(() => {
  if (job?.state === "running" || Date.now() - lastSeen < IDLE_MIN * 60e3) return;
  console.log(`no Studio page open for ${IDLE_MIN} min and no job: stopping the Studio (${STUDIO_PID || "unknown"}) and this server`);
  if (STUDIO_PID) spawnSync("taskkill", ["/T", "/F", "/PID", String(STUDIO_PID)], { windowsHide: true });
  process.exit(0);
}, 60e3).unref();

const start = (kind, p, args, label, onDone) => {
  if (job?.state === "running") throw Object.assign(new Error(`يعمل الآن: ${job.label}`), { code: 409 });
  const j = (job = { id: ++seq, kind, project: p, label, state: "running", startedAt: Date.now(), endedAt: null, summary: "", log: "" });
  const ch = spawn(process.execPath, args, { windowsHide: true, env: process.env });
  const add = (d) => { j.log = (j.log + d.toString()).slice(-6000); };
  ch.stdout.on("data", add); ch.stderr.on("data", add);
  ch.on("close", (code) => {
    j.state = code === 0 ? "done" : "failed"; j.endedAt = Date.now();
    try { onDone?.(code, j); } catch { /* the job result stands */ }
    const lines = j.log.trim().split("\n").filter(Boolean);
    if (!j.summary) j.summary = code === 0 ? (lines.filter((l) => /^(cut_blocks: DONE|music_cut:)/.test(l)).slice(-1)[0] ?? lines.slice(-1)[0] ?? "تم") : (lines.filter((l) => l.startsWith("✘ cut_block:")).slice(0, 1)[0] ?? lines.filter((l) => l.startsWith("✘")).slice(-1)[0] ?? lines.slice(-1)[0] ?? "فشل");
  });
  return j;
};

const send = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-private-network": "true", "access-control-allow-methods": "GET,POST,OPTIONS" }); res.end(JSON.stringify(obj)); };
const priv = (ip) => /^(::1|127\.|::ffff:127\.|10\.|::ffff:10\.|192\.168\.|::ffff:192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:172\.(1[6-9]|2\d|3[01])\.|fe80:|fc|fd)/i.test(ip ?? "");

http.createServer((req, res) => {
  if (!priv(req.socket.remoteAddress)) return send(res, 403, { error: "private network only" });
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = (req.url ?? "").split("?")[0];
  if (req.method === "GET" && url === "/api/alive") { lastSeen = Date.now(); return send(res, 200, { ok: true, idleMin: IDLE_MIN }); }
  if (req.method === "GET" && url === "/api/queue") { try { return send(res, 200, queueState()); } catch (e) { return send(res, 500, { error: String(e.message) }); } }
  if (req.method === "GET" && url === "/api/msg") return send(res, 200, { messages: inbox().slice(-30), listening: watcherAlive() });
  if (req.method === "GET" && url === "/api/ping") return send(res, 200, { ok: true, name: "HK-Motion", busy: job?.state === "running" });
  if (req.method === "GET" && url === "/api/job") return send(res, 200, job ? { ...job, seconds: Math.round(((job.endedAt ?? Date.now()) - job.startedAt) / 1000), log: job.log.slice(-1200) } : { state: "idle" });
  if (req.method !== "POST") return send(res, 404, { error: "not found" });
  let raw = ""; req.on("data", (d) => { raw += d; if (raw.length > 1e5) req.destroy(); });
  req.on("end", () => {
    try {
      const body = raw ? JSON.parse(raw) : {};
      if (url.startsWith("/api/gallery/")) return send(res, 200, gallery(url, body));
      if (url.startsWith("/api/grade/")) return send(res, 200, grade(url, body));
      if (url.startsWith("/api/queue/")) return send(res, 200, queue(url, body));
      /* «رندر» (user 2026-11-21: «ضع لي زر (رندر) في ريموشن يعطيك الأمر بالرندرة مباشرة»): the open composition goes to the render queue as a job — the
         pre-render check first (render_queue add --prerender), then the worker starts. A refusal is written to the «راسلني» inbox so the session that owns the video fixes it. */
      if (url === "/api/kind") return send(res, 200, K.tools(String(body.comp ?? "")));   // which tools apply to the open composition, and why not (the strip)
      if (url === "/api/render") {
        const comp = String(body.comp ?? ""); if (!comp) throw new Error("افتح فيديو أولاً");
        /* (user 2026-11-21) the kind decides (tools/comp_kinds.mjs): a montage/lesson/stream spec → the queue with its pre-render check, in its skill's folder with its
           bumper; any other video (شيخ الردود، الدبلجة، المناظرة، الموشن…) → a generic --comp job (tools/gpu_render.mjs, then final_review); a demo or reference →
           a still of this frame; an engine asset → not rendered, with the reason; an unknown composition → «رندر هذا» to its owner through «راسلني» (the earlier routing,
           user's phone screenshot «لا مونتاج لهذه التركيبة: Rudood-Ukhuwwa») */
        const d = K.route("render", comp, body);
        if (d.do === "na") return send(res, 200, { ok: false, na: true, message: d.message, kind: d.r.kind });
        if (d.do === "inbox") { toInbox(comp, d.text, body); return send(res, 200, { ok: true, routed: true, dry: !!body.dry, message: d.message, kind: d.r.kind }); }
        if (body.dry) { const x = spawnSync(process.execPath, [...d.argv, "--dry"], { encoding: "utf8", windowsHide: true, timeout: 120000 }); return send(res, 200, { ok: x.status === 0, dry: true, kind: d.r.kind, mode: d.r.render.mode, jobs: d.r.render.jobs, argv: d.argv, plan: ((x.stdout || "") + (x.stderr || "")).trim() }); }
        const p = d.r.project ?? comp, still = d.r.render.mode === "still";
        const j = start("render", p, d.argv, still ? `لقطة ثابتة من ${arTitleOf(comp)}` : `رندر ${arTitleOf(comp)}`, (code, jj) => {
          const out = jj.log.trim(), bad = code !== 0 || /✘ مرفوض/.test(out);
          if (!bad && still) { jj.summary = out.split(NL_RE).filter((l) => l.startsWith("✔")).slice(-1)[0] ?? "✔ لقطة ثابتة"; return; }
          if (!bad) { const st = startWorker(), to = [...new Set(d.r.render.jobs.map((x) => x.dest.replace(/^C:\/Users\/mshms\/Videos\//, "")))].join(" و"); jj.summary = `✔ في الطابور: ${arTitleOf(comp)} → ${to}${st ? " — بدأ الإخراج" : ""}`; return; }
          jj.state = "failed"; jj.summary = "✘ رُفض الرندر — أرسلتُ السبب لي في «راسلني» لأصلحه";
          const why = out.split(NL_RE).filter((l) => /✘/.test(l)).slice(0, 6).join(" | ").slice(0, 900) || out.slice(-600);
          const m = { id: Date.now().toString(36), at: new Date().toISOString(), comp, frame: 0, time: "0:00", cutTime: 0, elements: "", text: `رندر هذا — رُفض الرندر: ${why}`, reply: null };
          fs.mkdirSync(".tmp", { recursive: true }); fs.appendFileSync(INBOX, JSON.stringify(m) + "\n");
        });
        return send(res, 202, { id: j.id, label: j.label, message: "… أفحص قبل الرندر ثم أضيفه للطابور" });
      }
      if (url === "/api/msg") {
        const text = String(body.text ?? "").trim().slice(0, 4000); if (!text) throw new Error("اكتب الرسالة");
        /* (2026-11-20) the Studio inserts the 5-s break (spec.bumper.at) into its timeline: the frame he sees is ahead of the cut by 150 frames after it —
           the cut time is written with the message, so the agent never misreads a frame (it did: 6.5 s instead of 5) */
        const fr = Number(body.frame ?? 0), pj = projectOf(String(body.comp ?? ""));
        let cut = fr / 30; try { const b = pj ? JSON.parse(fs.readFileSync(path.join("data", "specs", `${pj}.json`), "utf8")).bumper : null; if (b && b.at >= 1 && !b.end && fr / 30 >= b.at) cut = fr / 30 < b.at + 5 ? b.at : fr / 30 - 5; } catch { /* no spec */ }
        const m = { id: Date.now().toString(36), at: new Date().toISOString(), comp: String(body.comp ?? ""), frame: fr, time: String(body.time ?? ""), cutTime: +cut.toFixed(2), elements: String(body.elements ?? "").slice(0, 300), text, reply: null };
        fs.mkdirSync(".tmp", { recursive: true }); fs.appendFileSync(INBOX, JSON.stringify(m) + "\n");
        return send(res, 200, { ok: true, message: m, messages: inbox().slice(-30), listening: watcherAlive() });
      }
      /* «تحريك» (user 2026-11-20: «التحريك لا يحتاج إلى الوصف، يحتاج فقط إلى حساب مواقع»): the elements on screen at the playhead with the grid slots they may
         take (/api/slots), and the move itself (/api/slot → tools/el.mjs slot: the place gates judge the drawn box as numbers, ~1 s, refused moves are undone) */
      if (url === "/api/slots" || url === "/api/slot") {
        const comp = String(body.comp ?? ""), pj = projectOf(comp); if (!pj) throw new Error(`لا مشروع لهذا التركيب: ${comp}`);
        const o = /(-P|Reel|reel|Port|port)$/.test(comp) || /reel/i.test(pj) ? "port" : "land", sf = path.join("data", "specs", `${pj}.json`), spec = JSON.parse(fs.readFileSync(sf, "utf8"));
        if (url === "/api/slot") {
          const id = String(body.id ?? "").replace(/[^a-z0-9]/gi, ""), slot = String(body.slot ?? "").replace(/[^a-z]/gi, ""); if (!id || !slot) throw new Error("اختر العنصر والخانة");
          const r = spawnSync(process.execPath, ["tools/el.mjs", "slot", pj, `#${id}`, slot, `--${o}`], { encoding: "utf8", windowsHide: true });
          const out = ((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/).filter((l) => /^\s*[✔✘]/.test(l)).join("\n");
          return send(res, r.status === 0 ? 200 : 409, r.status === 0 ? { ok: true, text: out } : { error: out || "رُفض" });
        }
        const fr = Number(body.frame ?? 0); let t = fr / 30; const b = spec.bumper; if (b && b.at >= 1 && !b.end && t >= b.at) t = t < b.at + 5 ? b.at : t - 5;
        const grids = JSON.parse(fs.readFileSync(path.join("data", "layout_grids.json"), "utf8")), names = [];
        for (const g of Object.values(grids[o] ?? {})) for (const sn of Object.keys(g?.slots ?? {})) if (!names.includes(sn) && sn !== "back") names.push(sn);
        const span = (x) => { const a = x.at ?? x.from ?? x.times?.[0]; return a == null ? null : [a, x.until ?? x.to ?? (x.dur != null ? a + x.dur : a + 6)]; };
        const live = spec.items.filter((x) => { const s = span(x); return x.id && x.slot?.[o] && (!x.only || x.only === o) && s && t >= s[0] && t < s[1]; });
        const items = live.map((x) => { const s = span(x), taken = new Set(spec.items.filter((y) => y !== x && y.slot?.[o] && (!y.only || y.only === o) && (() => { const q = span(y); return q && q[0] < s[1] && q[1] > s[0]; })()).map((y) => y.slot[o]));
          return { id: x.id, name: String(x.name ?? x.text ?? x.title ?? x.el ?? x.t).slice(0, 40), slot: x.slot[o], choices: names.map((n) => ({ name: n, state: n === x.slot[o] ? "here" : taken.has(n) ? "taken" : "free" })) }; });
        return send(res, 200, { project: pj, o, t: +t.toFixed(2), items });
      }
      if (url === "/api/preview" || url === "/api/delete" || url === "/api/music") {
        const comp = String(body.comp ?? ""), d = K.route("cut", comp, body);
        if (d.do === "inbox") {   /* (user 2026-11-21) this kind has no cut here: said clearly, and the request goes to its owner session through «راسلني» */
          if (url === "/api/preview") return send(res, 200, { routed: true, na: d.r.cut.why, owner: d.r.owner, kind: d.r.kind, seconds: +(Math.abs(Number(body.b) - Number(body.a)) / 30).toFixed(1), words: [], count: 0 });
          const m = toInbox(comp, url === "/api/music" ? d.text.replace(/^قصّ هذا/, "احذف الموسيقى") : d.text, body);
          return send(res, 200, { ok: true, routed: true, dry: !!body.dry, message: d.message, inbox: m, kind: d.r.kind });
        }
      }
      const { p, fa, fb } = parse(body), A = (fa / 30).toFixed(4), B = (fb / 30).toFixed(4), secs = ((fb - fa) / 30).toFixed(1);
      if (url === "/api/preview") {
        const inside = words(p).filter((w) => w.s >= fa / 30 - 0.03 && w.e <= fb / 30 + 0.03).map((w) => w.w);
        return send(res, 200, { project: p, from: +A, to: +B, seconds: +secs, words: inside.length > 40 ? [...inside.slice(0, 20), "…", ...inside.slice(-15)] : inside, count: inside.length });
      }
      if (body.dry && (url === "/api/delete" || url === "/api/music")) return send(res, 200, { dry: true, project: p, from: +A, to: +B, seconds: +secs, argv: url === "/api/delete" ? ["tools/cut_blocks.mjs", p, `${A}-${B}`, "--snap-words"] : ["tools/music_cut.mjs", p, A, B] });
      if (url === "/api/delete") { const j = start("delete", p, ["tools/cut_blocks.mjs", p, `${A}-${B}`, "--snap-words"], `حذف ${secs} ث من ${p}`); return send(res, 202, { id: j.id, label: j.label }); }
      if (url === "/api/music") { const j = start("music", p, ["tools/music_cut.mjs", p, A, B], `حذف الموسيقى ${secs} ث من ${p}`); return send(res, 202, { id: j.id, label: j.label }); }
      return send(res, 404, { error: "not found" });
    } catch (e) { return send(res, e.code === 409 ? 409 : 400, { error: e.message }); }
  });
}).on("error", (e) => { if (e.code === "EADDRINUSE") { console.log(`HK-Motion tools server: :${PORT} is taken (already running)`); process.exit(0); } throw e; })
  .listen(PORT, "0.0.0.0", () => { registerStudio(PORT, STUDIO_PID); console.log(`HK-Motion tools server on :${PORT}`); });   // tools/lib/inbox_watch.mjs: the watcher lives with this Studio
