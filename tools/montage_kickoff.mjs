// ONE COMMAND STARTS EVERY INDEPENDENT STAGE OF A MONTAGE AT ONCE (user 2026-11-20, gta6: «تأخرت، يجب تشغيل أكثر من مهمة معاً… لماذا تشتغل متسلسلاً؟…
// أنا لا أقبل مونتاجاً يطول إلى هذه المدة»). The rule «ما لا يتوقف على غيره يعمل في الخلفية معاً» was text only: on gta6 the prep ran alone, then the cut alone,
// 15 minutes went into one click at a join while nothing else ran, and research, the cover and the custom elements started only after he complained.
// Now the parallel plan is a program, not a memory:
//   node tools/montage_kickoff.mjs <p> "<video>"|latest [--no-cover] [--dry-run] [-- <extra stage-prep args, e.g. --audio-only>]
//        registers the montage, writes the board .tmp/<p>/board.json, and starts ONE background runner (tools/proc.mjs, low priority, ttl 3 h) that runs
//        the machine lanes as a dependency graph — prep, then TOGETHER: the cut proposal, the early research queue (narrations to verify in Shamela, places,
//        people, years — source seconds), the cover brief. Returns at once and prints what I must do NOW, in parallel (questions, reading, agents).
//   node tools/montage_kickoff.mjs board <p> [--brief]          the board: what runs, what is done, ETA, what is READY and not started (= a violation), parked blockers
//   node tools/montage_kickoff.mjs lane <p> <id> start|done|park|fail ["note"]    mark my own lanes (agents, cover, research, plan)
//   node tools/montage_kickoff.mjs park <p> "<blocker>"         put a blocker aside (time box: 3 failures or 6 minutes) and go on with the rest
// The hook (tools/hooks/guard.mjs) refuses a direct `stage.mjs prep` (it goes through here), shows the board on every prompt of an active montage, nudges
// when a lane is ready and not started, and enforces the time box. Internal: `_run <p>` (the runner), `_proposal|_early|_cover <p>` (machine lanes).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { appliesToEpisode, sectionsFailures, packageFailures } from "./prepublish_gates.mjs";
import { hooksAlive } from "./lib/hooks_alive.mjs";

process.chdir(path.resolve(import.meta.dirname, ".."));
const argv = process.argv.slice(2);
const dd = argv.indexOf("--"), head = dd < 0 ? argv : argv.slice(0, dd), extra = dd < 0 ? [] : argv.slice(dd + 1);
const SUB = new Set(["board", "lane", "park", "_run", "_proposal", "_early", "_cover"]);
const cmd = SUB.has(head[0]) ? head[0] : "kickoff";
const pos = (cmd === "kickoff" ? head : head.slice(1)).filter((a) => !a.startsWith("--"));
const p = pos[0];
const flag = (f) => head.includes(f);
const T = (q) => path.join(".tmp", q);
const BF = (q) => path.join(T(q), "board.json");
const json = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const now = () => Date.now();
const mins = (ms) => (ms / 60e3).toFixed(1);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
if (!p || !/^[\w-]+$/.test(p)) { console.error("usage: node tools/montage_kickoff.mjs <p> \"<video>\"|latest [--dry-run] [--no-cover] [-- prep args] | board <p> | lane <p> <id> start|done|park|fail | park <p> \"…\""); process.exit(2); }

/** read-modify-write of the board (runner and lane commands both write it: re-read right before, write through a rename) */
const editBoard = (q, fn) => { const b = json(BF(q), null); if (!b) return null; fn(b); fs.writeFileSync(BF(q) + ".tmp", JSON.stringify(b, null, 1)); fs.renameSync(BF(q) + ".tmp", BF(q)); return b; };
const lanesById = (b) => Object.fromEntries(b.lanes.map((l) => [l.id, l]));
const depsDone = (b, l) => l.deps.every((d) => lanesById(b)[d]?.status === "done");

/* lanes I (the agent) own are known done by their files when possible, so a forgotten «lane … done» never shows a false «waiting» */
const artifactDone = (q, l, b) => {
  const after = (f) => { try { return fs.statSync(f).mtimeMs > b.createdAt; } catch { return false; } };
  if (l.id === "questions") return fs.existsSync(path.join(T(q), "stages", "questions.json"));
  if (l.id === "orders") return fs.existsSync(path.join(T(q), "montage_notes.json")) || fs.existsSync(path.join(T(q), "stages", "context.json"));
  if (l.id === "cut") return after(path.join(T(q), "cut_words.json")) && after(path.join("public", `${q}_map.json`));
  if (l.id === "research") return fs.existsSync(path.join(T(q), "stages", "assets.json"));
  if (l.id === "cover") return fs.existsSync(path.join(T(q), "stages", "cover.json"));
  if (l.id === "plan") return fs.existsSync(path.join(T(q), "stages", "plan.json"));
  /* (user 2026-11-21, gta6: sections.json appeared only at publishing, no rail, a package with no description or tags) done = the gate passes, never a memory */
  if (l.id === "sections" || l.id === "package") {
    const spec = json(path.join("data", "specs", `${q}.json`), null);
    if (!spec) return false;
    if (!appliesToEpisode(q, spec)) return true;   // a reel, cartoon, paper, ad, explainer: no sections, no package
    return l.id === "sections" ? sectionsFailures(q, spec).length === 0 : packageFailures(q).length === 0;
  }
  return false;
};
const refresh = (q) => editBoard(q, (b) => { for (const l of b.lanes) if (l.kind === "agent" && l.status !== "done" && l.status !== "parked" && artifactDone(q, l, b)) { l.status = "done"; l.endedAt ??= now(); } });

/** the board in a few lines (Arabic): running with ETA, ready-not-started (the violation), waiting, parked */
/** ready since: the moment its last dependency ended (the board's start for a lane with none) */
const readySince = (b, l) => Math.max(b.createdAt, ...l.deps.map((d) => lanesById(b)[d]?.endedAt ?? 0));
const boardText = (q, { brief = false, nudge = false } = {}) => {
  const b = refresh(q) ?? json(BF(q), null); if (!b) return null;
  const L = lanesById(b), out = [], t = now();
  if (nudge) { const late = b.lanes.filter((l) => l.kind === "agent" && l.status === "waiting" && depsDone(b, l) && t - readySince(b, l) > 2 * 60e3); return late.length ? `⛔ «${q}»: جاهز ولم يبدأ منذ أكثر من دقيقتين — ابدأه الآن في الخلفية (وكيل أو أمر بـrun_in_background)، ثم node tools/montage_kickoff.mjs lane ${q} <المعرّف> start: ${late.map((l) => `${l.ar} [${l.id}] منذ ${mins(t - readySince(b, l))} د`).join("، ")}` : ""; }
  const st = (l) => {
    if (l.status === "running") return `يعمل منذ ${mins(t - l.startedAt)} د${l.etaMin ? ` من نحو ${l.etaMin} د` : ""}`;
    if (l.status === "done") return "تمّ";
    if (l.status === "failed") return `فشل — ${l.out ?? ""}`.slice(0, 160);
    if (l.status === "parked") return `مركون: ${l.note ?? ""}`;
    if (l.status === "blocked") return "متوقف لفشل ما قبله";
    return depsDone(b, l) ? `⚠ جاهز ولم يبدأ منذ ${mins(t - readySince(b, l))} د` : `ينتظر ${l.deps.filter((d) => L[d]?.status !== "done").map((d) => L[d]?.ar ?? d).join("، ")}`;
  };
  const ready = b.lanes.filter((l) => l.kind === "agent" && l.status === "waiting" && depsDone(b, l));
  out.push(`لوحة «${q}» — منذ ${mins(t - b.createdAt)} د · يعمل الآن ${b.lanes.filter((l) => l.status === "running").length}`);
  for (const l of b.lanes) if (!brief || l.status !== "done") out.push(`  ${l.kind === "proc" ? "⚙" : "✋"} ${l.ar}: ${st(l)}`);
  if (ready.length) out.push(`⛔ جاهز ولم يبدأ (ابدأه الآن في الخلفية، ثم: node tools/montage_kickoff.mjs lane ${q} <المعرّف> start): ${ready.map((l) => `${l.ar} [${l.id}]`).join("، ")}`);
  for (const x of b.parked ?? []) out.push(`  ⏸ مركون: ${x.what} (منذ ${mins(t - x.at)} د)`);
  return out.join("\n");
};

if (cmd === "board" && flag("--nudge")) { const s = boardText(p, { nudge: true }); if (s) console.log(s); process.exit(0); }
if (cmd === "board") { const s = boardText(p, { brief: flag("--brief") }); if (!s) { console.log(`لا لوحة لـ«${p}» — ابدأ المونتاج بـ node tools/montage_kickoff.mjs ${p} "<الفيديو>"`); process.exit(1); } console.log(s); process.exit(0); }

if (cmd === "lane") {
  const [, id, what, ...note] = pos; const S = { start: "running", done: "done", park: "parked", fail: "failed" }[what];
  if (!id || !S) { console.error("usage: lane <p> <id> start|done|park|fail [\"note\"]"); process.exit(2); }
  const b = editBoard(p, (b) => { const l = b.lanes.find((x) => x.id === id); if (!l) throw new Error(`no lane ${id}: ${b.lanes.map((x) => x.id).join(", ")}`); l.status = S; if (S === "running") l.startedAt = now(); else l.endedAt = now(); if (note.length) l.note = note.join(" "); if (S === "parked") (b.parked ??= []).push({ what: `${l.ar}${note.length ? ": " + note.join(" ") : ""}`, at: now() }); });
  if (!b) { console.error(`✘ لا لوحة لـ«${p}»`); process.exit(1); }
  console.log(boardText(p, { brief: true })); process.exit(0);
}

if (cmd === "park") {
  const what = pos.slice(1).join(" "); if (!what) { console.error("usage: park <p> \"<العائق>\""); process.exit(2); }
  const b = editBoard(p, (b) => { (b.parked ??= []).push({ what, at: now() }); });
  if (!b) { console.error(`✘ لا لوحة لـ«${p}»`); process.exit(1); }
  // the time-box record of tools/hooks/guard.mjs: a parked blocker stops nagging
  try { const f = path.join(T(p), "timebox.json"), tb = json(f, {}); for (const k of Object.keys(tb)) tb[k].parked = now(); fs.writeFileSync(f, JSON.stringify(tb, null, 1)); } catch { /* none */ }
  console.log(`⏸ رُكن: ${what}\nاعمل الآن على ما في اللوحة:\n${boardText(p, { brief: true })}`); process.exit(0);
}

// ── machine lanes (run by the runner, each in its own low-priority process)
if (cmd === "_proposal") {
  /* the cut proposal: the retakes (redo.txt) and the editor-talk blocks (orders_cand.txt) as ONE --rem draft — I only judge it, the cut then runs in the background */
  const redo = fs.existsSync(path.join(T(p), "redo.txt")) ? fs.readFileSync(path.join(T(p), "redo.txt"), "utf8") : "";
  const orders = fs.existsSync(path.join(T(p), "orders_cand.txt")) ? fs.readFileSync(path.join(T(p), "orders_cand.txt"), "utf8") : "";
  const rem = [...redo.matchAll(/اقتراح --rem\s+([\d.]+)-([\d.]+)/g)].map((m) => [+m[1], +m[2], "إعادة"]);
  const blocks = [...orders.matchAll(/\[([\d.]+)[^\]]*?→\s*([\d.]+)[^\]]*كتلة «مونتاج»\]\s*([^\n[]*)/g)].map((m) => [+m[1], +m[2], "مونتاج", m[3].trim().slice(0, 120)]);
  const all = [...rem, ...blocks].sort((a, b) => a[0] - b[0]);
  const merged = all.reduce((o, [a, b]) => { const l = o[o.length - 1]; if (l && a <= l[1] + 0.05) l[1] = Math.max(l[1], b); else o.push([a, b]); return o; }, []);   // overlapping suggestions → one range
  const md = [`# اقتراح القص — ${p} (ثواني الأصل)`, "", "مسودة لا قرار: احكم على كل سطر من سياقه (montage-orders) — كتلة «مونتاج» تُحذف من بدايتها المنطوقة إلى «انتهى مونتاج»، والإعادة من الخطأ إلى العلامة — ثم شغّل القص في الخلفية بـrun_in_background:", "",
    "```", `bash tools/bg.sh ${p}-cut --project ${p} -- node tools/stage.mjs cut ${p} --rem ${merged.map(([a, b]) => `${a}-${b}`).join(",")}`, "```", "",
    ...all.map(([a, b, k, txt]) => `- ${mmss(a)}–${mmss(b)} (${a}-${b}) ${k}${txt ? `: ${txt}` : ""}`)];
  fs.writeFileSync(path.join(T(p), "cut_proposal.md"), md.join("\n") + "\n");
  console.log(`cut proposal: ${rem.length} retake(s) + ${blocks.length} «مونتاج» block(s) → ${path.join(T(p), "cut_proposal.md")}`);
  process.exit(0);
}

if (cmd === "_early") {
  /* the research queue on the SOURCE transcript, while the cut has not run yet: narrations (tools/hadith_scan.mjs on a shadow folder), places/books/sects
     of data/mention_lexicon.json, years and big numbers. Source seconds: the times move with the cut, the CONTENT does not — verify, fetch, prepare now. */
  const words = json(path.join(T(p), "words.json"), []); const E = path.join(T(p), "early"); fs.mkdirSync(E, { recursive: true });
  fs.writeFileSync(path.join(E, "cut_words.json"), JSON.stringify(words));
  const hs = spawnSync(process.execPath, ["tools/hadith_scan.mjs", `${p}/early`], { encoding: "utf8" });
  const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");
  const bare = (w) => norm(w).replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
  const lex = json(path.join("data", "mention_lexicon.json"), {}), hits = [];
  for (const [cat, entries] of Object.entries(lex)) if (cat !== "_" && entries && typeof entries === "object") for (const [name, forms] of Object.entries(entries)) {
    const fs0 = new Set([name, ...(Array.isArray(forms) ? forms : [])].map(bare));
    const w = words.find((x) => fs0.has(bare(x.w))); if (w) hits.push(`- ${mmss(w.s)} ${cat}: ${name}`);
  }
  const nums = words.filter((w) => /^(1[0-9]{3}|20[0-9]{2})$/.test(norm(w.w)) || /^\d{3,}$/.test(norm(w.w))).map((w) => `- ${mmss(w.s)} ${w.w}`);
  const md = [`# طابور البحث المبكر — ${p} (ثواني الأصل، قبل القص)`, "", "ابدأه الآن بوكيل في الخلفية: التحقق من الأحاديث في الشاملة، وصور الأشخاص والأماكن، ومصادر الأرقام. الأوقات تتغير بالقص والمحتوى لا يتغير.", "",
    "## الأحاديث (للتحقق في الشاملة)", (hs.stdout || "").trim() || "—", "", "## أماكن وكتب وفرق مذكورة", hits.join("\n") || "—", "", "## سنوات وأرقام", nums.slice(0, 40).join("\n") || "—"];
  fs.writeFileSync(path.join(T(p), "early_queue.md"), md.join("\n") + "\n");
  console.log(`early queue: ${(hs.stdout || "").match(/^hadith: (\d+)/)?.[1] ?? 0} narration(s), ${hits.length} mention(s), ${nums.length} number(s) → ${path.join(T(p), "early_queue.md")}`);
  process.exit(0);
}

if (cmd === "_cover") {
  /* everything the cover agent needs, in one file (skill thumbnail-design): title, the sheikh's cut-out poses, the last covers to differ from, the opening of the talk */
  const ans = json(path.join(T(p), "first_answers.json"), {}), poses = (() => { try { return fs.readdirSync("S:/AI_Tools/covers/sheikh_poses").filter((f) => /\.(png|jpe?g)$/i.test(f)); } catch { return []; } })();
  const cv = spawnSync(process.execPath, ["tools/cover_variety.mjs", "list"], { encoding: "utf8" }).stdout?.trim().split(/\r?\n/).slice(-3) ?? [];
  const tr = (() => { try { return fs.readFileSync(path.join(T(p), "transcript.txt"), "utf8").split(/\r?\n/).slice(0, 25).join("\n"); } catch { return ""; } })();
  const md = [`# موجز الغلاف — ${p}`, "", "أطلق وكيل الغلاف الآن في الخلفية (مهارة thumbnail-design كاملة: ChatGPT في محادثة جديدة، صورة الشيخ من مجلد صوره المفرّغة، فحص الجوال).", "",
    `- العنوان: ${ans.title ?? "(لم يُجب بعد — من أسئلة البداية)"}`, `- صور الشيخ المفرّغة: S:\\AI_Tools\\covers\\sheikh_poses (${poses.length} صورة)`, "- آخر الأغلفة (لا تكرار خلفيتها):", ...cv.map((l) => `  - ${l}`), "", "## أول الكلام", "```", tr, "```"];
  fs.writeFileSync(path.join(T(p), "cover_brief.md"), md.join("\n") + "\n");
  console.log(`cover brief → ${path.join(T(p), "cover_brief.md")}`);
  process.exit(0);
}

if (cmd === "_run") {
  /* THE RUNNER: every machine lane whose dependencies are done starts at once, each its own low-priority process with its own log; a failed lane blocks only
     what depends on it. KICKOFF_STUB=1 (tests) replaces every lane command by a 2-s no-op, so the graph itself can be tested without a transcription. */
  const STUB = process.env.KICKOFF_STUB === "1", procs = new Map();
  const startLane = (l) => {
    const log = path.join(T(p), `lane_${l.id}.log`); fs.writeFileSync(log, `# ${l.id} ${new Date().toISOString()}\n$ ${l.cmd.join(" ")}\n`);
    const [c, ...a] = STUB ? [process.execPath, "-e", "setTimeout(()=>console.log('stub ok'),2000)"] : l.cmd;
    const ch = spawn(c, a, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    try { os.setPriority(ch.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* best effort */ }
    let tail = ""; const take = (d) => { const s = d.toString(); tail = (tail + s).slice(-3000); fs.appendFileSync(log, s); };
    ch.stdout.on("data", take); ch.stderr.on("data", take);
    procs.set(l.id, ch);
    editBoard(p, (b) => { const x = b.lanes.find((y) => y.id === l.id); x.status = "running"; x.startedAt = now(); x.pid = ch.pid; x.log = log; });
    ch.on("close", (code) => { procs.delete(l.id); const last = tail.trim().split(/\r?\n/).filter(Boolean).slice(-2).join(" | ").slice(0, 300);
      editBoard(p, (b) => { const x = b.lanes.find((y) => y.id === l.id); x.status = code === 0 ? "done" : "failed"; x.endedAt = now(); x.exit = code; x.out = last; }); });
  };
  const tick = () => {
    const b = json(BF(p), null); if (!b) process.exit(1);
    for (const l of b.lanes.filter((x) => x.kind === "proc" && x.status === "waiting")) {
      const L = lanesById(b);
      if (l.deps.some((d) => ["failed", "blocked"].includes(L[d]?.status))) { editBoard(p, (bb) => { bb.lanes.find((y) => y.id === l.id).status = "blocked"; }); continue; }
      if (depsDone(b, l) && !procs.has(l.id)) startLane(l);
    }
    const open = json(BF(p), b).lanes.filter((x) => x.kind === "proc" && ["waiting", "running"].includes(x.status));
    if (!open.length && !procs.size) process.exit(0);
  };
  tick(); setInterval(tick, 1500);
}

if (cmd === "kickoff") {
  const dry = flag("--dry-run"), STUB = process.env.KICKOFF_STUB === "1";
  let video = pos[1];
  if (!video) { console.error("✘ أعطني الفيديو: node tools/montage_kickoff.mjs <p> \"<الفيديو>\" (أو latest)"); process.exit(2); }
  if (video === "latest") { const r = spawnSync(process.execPath, ["tools/latest_recording.mjs", "episode", "--json"], { encoding: "utf8" }); try { video = JSON.parse(r.stdout).file; } catch { console.error("✘ لا تسجيل أخير: " + (r.stdout || r.stderr)); process.exit(1); } }
  if (!STUB && !fs.existsSync(video)) { console.error(`✘ لا ملف: ${video}`); process.exit(1); }
  const old = json(BF(p), null);
  if (old && !flag("--redo") && old.lanes.some((l) => l.kind === "proc" && ["waiting", "running"].includes(l.status))) { console.log(`✘ المونتاج «${p}» بدأ من قبل ولوحته تعمل (--redo لإعادته):\n${boardText(p)}`); process.exit(1); }
  const dur = STUB ? 600 : Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout.trim()) || 0;
  const me = ["tools/montage_kickoff.mjs"], node = process.execPath;
  /* ETA: prep ≈ a third of the recording (gta6: 21:45 → 7 min); the others are seconds */
  const lanes = [
    { id: "prep", ar: "التجهيز والتفريغ", kind: "proc", deps: [], cmd: [node, "tools/stage.mjs", "prep", p, video, ...extra], etaMin: Math.max(2, Math.round((dur / 60) * 0.35)) },
    { id: "proposal", ar: "اقتراح القص (الإعادات وكتل «مونتاج»)", kind: "proc", deps: ["prep"], cmd: [node, ...me, "_proposal", p], etaMin: 0.1 },
    { id: "early", ar: "طابور البحث المبكر (أحاديث، أماكن، أرقام)", kind: "proc", deps: ["prep"], cmd: [node, ...me, "_early", p], etaMin: 0.3 },
    ...(flag("--no-cover") ? [] : [{ id: "cover_brief", ar: "موجز الغلاف", kind: "proc", deps: ["prep"], cmd: [node, ...me, "_cover", p], etaMin: 0.1 }]),
    { id: "questions", ar: "أسئلة البداية بالنقر", kind: "agent", deps: [] },
    { id: "reading", ar: "قراءة القواعد والشجرة والمهارات كاملة", kind: "agent", deps: [] },
    { id: "orders", ar: "تعليمات «مونتاج» والإعادات ← حكم القص", kind: "agent", deps: ["proposal"] },
    { id: "cut", ar: "القص في الخلفية", kind: "agent", deps: ["orders"] },
    { id: "research", ar: "وكيل البحث والتحقق (الشاملة، الصور)", kind: "agent", deps: ["early"] },
    ...(flag("--no-cover") ? [] : [{ id: "cover", ar: "وكيل الغلاف", kind: "agent", deps: ["cover_brief"] }]),
    { id: "elements", ar: "وكلاء العناصر الخاصة (أوامر «مونتاج»)", kind: "agent", deps: ["orders"] },
    { id: "plan", ar: "خطة العناصر (el_rules ثم plan-check ثم دفعة واحدة)", kind: "agent", deps: ["cut"] },
    { id: "sections", ar: "أقسام الفيديو: sections.json بعدد الجدول + خط الأقسام في أول الثواني (video-sections)", kind: "agent", deps: ["cut"] },
    { id: "package", ar: "حزمة يوتيوب: الوصف من تفريغ القص والوسوم والفصول وقائمة التشغيل (yt_package)", kind: "agent", deps: ["sections"] },
  ].map((l) => ({ status: "waiting", ...l }));
  const board = { project: p, video, durationS: dur, createdAt: now(), lanes, parked: [] };
  const plan = lanes.filter((l) => l.kind === "proc").map((l) => `  ⚙ ${l.ar}${l.deps.length ? ` (بعد ${l.deps.join("،")})` : ""}: ${l.cmd.slice(1).join(" ")}`).join("\n");
  if (dry) { console.log(`[تجربة بلا تشغيل] «${p}» — ${mmss(dur)} من التسجيل، التجهيز نحو ${lanes[0].etaMin} د. يعمل في الخلفية معاً:\n${plan}`); process.exit(0); }
  fs.mkdirSync(T(p), { recursive: true });
  fs.writeFileSync(BF(p), JSON.stringify(board, null, 1));
  if (!STUB) { const g = spawnSync(node, ["tools/montage_guard.mjs", "start", p], { encoding: "utf8" }); if (g.status !== 0) console.log(`⚠ montage_guard start: ${(g.stdout + g.stderr).trim().split(/\r?\n/).pop()}`); }
  /* the runner is a registered background job (tools/proc.mjs: low priority, listed by `proc.mjs ls`, stopped with everything under it after its ttl) */
  const r = spawnSync(node, ["tools/proc.mjs", "run", "--label", `kickoff-${p}`, "--project", p, "--ttl", "180", "--log", path.join(T(p), "kickoff.log"), "--", node, ...me, "_run", p], { encoding: "utf8", env: process.env });
  const pid = Number((r.stdout || "").trim().split(/\r?\n/).pop());
  editBoard(p, (b) => { b.runner = { pid, at: now() }; });
  // the hooks must be alive in this session, or nothing above is enforced (2026-11-20: a session opened outside the workspace ran with NO hook)
  const hooksOk = hooksAlive(".");   // the beat of tools/hooks/guard.mjs in .tmp/hooks_alive.json, fresher than 2 min (tools/lib/hooks_alive.mjs, tested by guard_selftest)
  const R = "S:/AI_Tools/Remotion_Workspace";
  console.log([
    `✔ بدأ «${p}» (${mmss(dur)}): المشغّل في الخلفية (العملية ${pid || "?"}) — التجهيز نحو ${lanes[0].etaMin} د، ثم معاً: اقتراح القص، وطابور البحث المبكر${flag("--no-cover") ? "" : "، وموجز الغلاف"}.`,
    hooksOk ? "✔ الهوكات تعمل في هذه الجلسة." : `⛔ الهوكات لا تعمل في هذه الجلسة (لا نبض من tools/hooks/guard.mjs منذ دقيقتين): الإلزام الآلي معطّل. افتح الجلسة في ${R} أو في مجلد فيه .claude/settings.json بهوكات الحارس، وأخبر المستخدم.`,
    "", "الآن، بالتوازي، لا بالتسلسل:",
    "  1) أسئلة البداية بالنقر (مهارة first-questions) — والعمل لا ينتظر جوابها.",
    `  2) اقرأ كاملة ريثما يعمل التجهيز: ${R}/القواعد_العامة.md ← شجرة_العمليات.md ← .claude/skills/router ← first-questions ← montage-orders ← video-cutting ← video-montage (SKILL + critical-rules + workflow-plan) ← gallery-placement ← checking ← delivery-links.`,
    `  3) عند انتهاء التجهيز (اللوحة تقول): احكم على .tmp/${p}/cut_proposal.md وشغّل القص في الخلفية؛ وأطلق معاً وكيل البحث من .tmp/${p}/early_queue.md ووكيل الغلاف من .tmp/${p}/cover_brief.md ووكلاء العناصر الخاصة.`,
    `  4) العناصر: node tools/el_rules.mjs rules <العناصر> قبل الخطة، ثم plan-check، ثم دفعة واحدة.`,
    `     ومع الخطة (بعد القص): الأقسام .tmp/${p}/sections.json (العدد: node tools/yt_package.mjs ${p} --count) وخط الأقسام SectionsRail في أول الثواني، ثم الحزمة: node tools/yt_package.mjs ${p} --desc "…" --tags "…" [--event]. لا تنتظر النشر (2026-11-21).`,
    "  5) حدّ الوقت: عائق يفشل 3 مرات أو يأخذ 6 دقائق ← اركنه (park) واعمل غيره، ولا أمر طويل في المقدمة.",
    `اللوحة: node tools/montage_kickoff.mjs board ${p}`,
  ].join("\n"));
  process.exit(0);
}
