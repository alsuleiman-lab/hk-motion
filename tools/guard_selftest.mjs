#!/usr/bin/env node
// GUARD SELF-TEST (user 2026-11-21: «اعمل خطة سبر لكل ما يجنبك الوقوع في الأخطاء مستقبلا ونفذها»). Every guard below was built after a real mistake
// (data/error_ledger.json names the mistake, the guard and the case id here). Nothing tested them, so a later edit could switch one off silently.
// This runs each guard against FAKE inputs and prints one Arabic line per case (✔ / ✘ / ⚠ known gap / يدوي); exit 1 on any ✘.
//   node tools/guard_selftest.mjs                 every case
//   node tools/guard_selftest.mjs --for <file>    only the cases of that tool (tools/cover_item.mjs, tools/hooks/guard.mjs …)
//   node tools/guard_selftest.mjs --hook <file>   the PostToolUse hook (tools/hooks/guard.mjs post): silent when the file is not guarded or all pass;
//                                                 on a ✘ prints the failures (and rules_audit when the file is a rule file) and exits 1
//   --strict  a known gap (⚠) counts as ✘        --list  the case ids        --keep  keep the scratch folder
// SAFETY (never on real data): the hook is run from a COPY of tools/hooks/guard.mjs + tools/lib/inbox_watch.mjs in .tmp/selftest/<run>/<case>/ — its ROOT is
// that folder, so its state files (hooks_alive, hk_studio, hk_inbox, user_sleeping, active_montage, gates) are fake and the sleep/hibernate branch cannot fire.
// The other tools run with a scratch spec and a scratch cwd (spec_normalize, element_slots --spec), or as a pure function (coverFailure), or are read as
// source when running them would be a purge or a render (montage_guard end, gpu_render) — those are marked «يدوي» with the reason.
// One exception, named: recitation_check / name_doubt keep their reports in .tmp/<p>/ of the real workspace, so their scratch projects are .tmp/zz_selftest_*
// (no real project has that name) and only those folders are removed at the end. No second listening runs (no audio file, --no-audio): no GPU.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCR = path.join(ROOT, ".tmp", "selftest");
const RUN = path.join(SCR, `run_${process.pid}_${Date.now()}`);
const argv = process.argv.slice(2);
const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const STRICT = argv.includes("--strict"), KEEP = argv.includes("--keep"), HOOK = opt("--hook"), FOR = HOOK ?? opt("--for");
const relOf = (p) => { const n = String(p ?? "").replace(/\\/g, "/"), r = ROOT.replace(/\\/g, "/"); return n.toLowerCase().startsWith(r.toLowerCase() + "/") ? n.slice(r.length + 1) : n.replace(/^\.\//, ""); };
const NODE = process.execPath;

/* ── scratch helpers: everything this file creates or removes is under .tmp/selftest/ (checked) ── */
const inScr = (p) => path.resolve(p).toLowerCase().startsWith(path.resolve(SCR).toLowerCase() + path.sep);
const wipe = (p) => { if (!inScr(p)) throw new Error("refusing to remove outside .tmp/selftest: " + p); fs.rmSync(p, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); };   // Windows holds a just-closed child's folder for a moment
const put = (p, data) => { if (!inScr(p)) throw new Error("refusing to write outside .tmp/selftest: " + p); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data)); return p; };
/** a fake workspace root holding a fresh copy of the hook: its ROOT = this folder */
const mkRoot = (name) => {
  const r = path.join(RUN, name);
  for (const f of ["tools/hooks/guard.mjs", "tools/lib/inbox_watch.mjs"]) { fs.mkdirSync(path.dirname(path.join(r, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(r, f)); }
  put(path.join(r, ".tmp", "last_clean.txt"), String(Date.now()));   // the stop hook's background clean_temp is not started (and would not exist here)
  return r;
};
const runAsync = (cmd, args, { cwd, input, env, timeout = 20000 } = {}) => new Promise((res) => {
  const c = spawn(cmd, args, { cwd, env: env ?? process.env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let out = "", err = ""; const t = setTimeout(() => { try { c.kill(); } catch { /* gone */ } }, timeout);
  c.stdout.on("data", (d) => { out += d; }); c.stderr.on("data", (d) => { err += d; });
  c.on("close", (code) => { clearTimeout(t); res({ status: code, out, err }); });
  c.stdin.end(input ?? "");
});
/** run the hook copy in mode with a fake hook input; returns {decision, reason, context, raw} */
const hook = async (r, mode, input) => {
  const x = await runAsync(NODE, [path.join(r, "tools", "hooks", "guard.mjs"), mode], { cwd: r, input: JSON.stringify(input) });
  let j = {}; try { j = JSON.parse(x.out || "{}"); } catch { /* not JSON */ }
  const h = j.hookSpecificOutput ?? {};
  return { decision: h.permissionDecision ?? j.decision ?? null, reason: h.permissionDecisionReason ?? j.reason ?? "", context: h.additionalContext ?? "", raw: x.out + x.err, status: x.status };
};
const transcript = (r, text) => put(path.join(r, "transcript.jsonl"), JSON.stringify({ type: "user", message: { content: "سؤال" } }) + "\n" + JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } }) + "\n");
const AR_OK = "تمّ نقل العنوان إلى أسفل الشاشة، والرابط في سطره.";

/* a live dummy process (the fake Studio server / watcher) and a dead pid */
let dummy = null;
const livePid = () => { if (!dummy) { dummy = spawn(NODE, ["-e", "setTimeout(()=>{},180000)"], { stdio: "ignore", windowsHide: true }); } return dummy.pid; };
const deadPid = () => spawnSync(NODE, ["-e", ""], { windowsHide: true }).pid;

/* ── the cases. file = the tool whose edit re-runs the case (--hook / --for); ledger = data/error_ledger.json id ── */
const C = [];
const add = (id, files, ledger, title, run) => C.push({ id, files: [].concat(files), ledger, title, run });
const manual = (id, files, ledger, title, why) => C.push({ id, files: [].concat(files), ledger, title, manual: why });
const todo = (id, files, ledger, title, how) => C.push({ id, files: [].concat(files), ledger, title, todo: how });
const G = "tools/hooks/guard.mjs", IW = "tools/lib/inbox_watch.mjs";
const expect = (cond, why) => (cond ? { ok: true } : { ok: false, why });

// 1) THE SUB-AGENT DELETE BAN (guard.mjs pre, user 2026-11-21: a sub-agent ran the approval purge)
const AGENT_DENY = [
  ["agent.mg_end", "node tools/montage_guard.mjs end zzst", "إنهاء المونتاج (مسح الاعتماد)"],
  ["agent.mg_start", "node tools/montage_guard.mjs start zzst", "بدء المونتاج"],
  ["agent.approve_purge", "node tools/approve_purge.mjs zzst", "مسح الاعتماد"],
  ["agent.trash_file", "node tools/trash_file.mjs public/zzst/a.mp4", "الرمي إلى السلة"],
  ["agent.rm_public", "rm -rf public/zzst", "حذف في public"],
  ["agent.rm_tmp", "rm .tmp/zzst/board.json", "حذف في .tmp"],
  ["agent.rm_specs", "rm data/specs/zzst.json", "حذف مواصفة"],
  ["agent.rm_ready", "Remove-Item \"C:/Users/mshms/Videos/جاهز/x.mp4\"", "حذف في مجلد جاهز"],
  ["agent.cd_rm", "cd public/zzst && rm a.png", "حذف بعد الانتقال إلى public"],
  ["agent.code_rm", "node -e \"require('fs').rmSync('public/zzst',{recursive:true})\"", "حذف بالكود في public"],
];
for (const [id, cmd, ar] of AGENT_DENY) add(id, G, "subagent-ran-approval-purge", `الوكيل ممنوع من: ${ar}`, async () => {
  const r = mkRoot(id), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: cmd }, agent_id: "selftest-agent", cwd: ROOT });   // cwd = the real root: a cwd under .tmp/ is itself protected
  return expect(h.decision === "deny" && /للجلسة الرئيسية/.test(h.reason), `لم يُرفض (${h.decision ?? "سُمح"})`);
});
for (const [id, cmd, ar] of [["agent.ls_allowed", "ls public/zzst", "قراءة مجلد"], ["agent.rm_scratch_allowed", "rm C:/Users/x/AppData/Local/Temp/scratch/a.txt", "حذف خارج المجلدات المحمية"]]) add(id, G, "subagent-ran-approval-purge", `الوكيل مسموح له: ${ar}`, async () => {
  const r = mkRoot(id), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: cmd }, agent_id: "selftest-agent", cwd: ROOT });   // cwd = the real root: a cwd under .tmp/ is itself protected
  return expect(h.decision !== "deny", `رُفض خطأً: ${h.reason.slice(0, 80)}`);
});
for (const [id, cmd] of [["main.mg_end_allowed", "node tools/montage_guard.mjs end zzst"], ["main.trash_allowed", "node tools/trash_file.mjs public/zzst/a.mp4"]]) add(id, G, "subagent-ran-approval-purge", "الجلسة الرئيسية لا يمنعها حظر الوكيل", async () => {
  const r = mkRoot(id), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: cmd }, cwd: r });
  return expect(h.decision !== "deny", `رُفض للجلسة الرئيسية: ${h.reason.slice(0, 80)}`);
});

// 2) OTHER PRE-TOOL REFUSALS of the hook
add("pre.kickoff_prep_denied", G, "serial-work", "التجهيز المباشر مرفوض (المونتاج يبدأ بأمر الإطلاق)", async () => {
  const r = mkRoot("pre_prep"), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: "node tools/stage.mjs prep zzst \"v.mp4\"" }, cwd: r });
  return expect(h.decision === "deny" && /montage_kickoff/.test(h.reason), "لم يُرفض");
});
add("pre.long_foreground_denied", G, "long-foreground-commands", "أمر طويل في المقدمة أثناء مونتاج مرفوض، وفي الخلفية مسموح", async () => {
  const r = mkRoot("pre_long"); put(path.join(r, ".tmp", "active_montage.json"), { projects: ["zzst"] });
  const fg = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: "node tools/stage.mjs cut zzst" }, cwd: r });
  const bg = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: "node tools/stage.mjs cut zzst", run_in_background: true }, cwd: r });
  return expect(fg.decision === "deny" && bg.decision !== "deny", fg.decision !== "deny" ? "المقدمة لم تُرفض" : "الخلفية رُفضت");
});
add("pre.render_c_denied", G, null, "الرندر إلى القرص C خارج «جاهز» مرفوض", async () => {
  const r = mkRoot("pre_c"), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: "node tools/render_final.mjs --out C:/temp/x.mp4" }, cwd: r });
  return expect(h.decision === "deny", "لم يُرفض");
});
add("pre.rm_public_tree_denied", G, null, "حذف public كاملاً مرفوض حتى للجلسة الرئيسية", async () => {
  const r = mkRoot("pre_rmpub"), h = await hook(r, "pre", { tool_name: "Bash", tool_input: { command: "rm -rf public" }, cwd: r });
  return expect(h.decision === "deny", "لم يُرفض");
});
add("pre.rule_edit_ask", G, null, "تعديل ملف قواعد يسأل المستخدم", async () => {
  const r = mkRoot("pre_rule"), h = await hook(r, "pre", { tool_name: "Edit", tool_input: { file_path: path.join(r, "القواعد_العامة.md") }, cwd: r });
  return expect(h.decision === "ask", `القرار ${h.decision ?? "سُمح"}`);
});
add("pre.rewrite_big_denied", G, null, "إعادة كتابة ملف أدوات كبير بأداة الكتابة مرفوضة (يُعدَّل ولا يُعاد)", async () => {
  const r = mkRoot("pre_big"); put(path.join(r, "tools", "zz_big.mjs"), "// x\n".repeat(2000));
  const h = await hook(r, "pre", { tool_name: "Write", tool_input: { file_path: path.join(r, "tools", "zz_big.mjs"), content: "x" }, cwd: r });
  const n = await hook(r, "pre", { tool_name: "Write", tool_input: { file_path: path.join(r, "tools", "zz_new.mjs"), content: "x" }, cwd: r });
  return expect(h.decision === "deny" && n.decision !== "deny", h.decision !== "deny" ? "الكبير لم يُرفض" : "الملف الجديد رُفض");
});

// 3) THE STOP WATCHER RULE + UNREAD STUDIO MESSAGES (guard.mjs stop + tools/lib/inbox_watch.mjs, user 2026-11-21)
const stopCase = (id, title, setup, want) => add(id, [G, IW], "studio-inbox-unread", title, async () => {
  const r = mkRoot(id); transcript(r, AR_OK); setup(r);
  const h = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), session_id: "selftest", cwd: r });
  return want(h, r);
});
const studio = (r, pid) => put(path.join(r, ".tmp", "hk_studio", "3999.json"), { pid, port: 3999, studioPid: pid, at: new Date().toISOString() });
const watch = (r, pid, ago = 0) => put(path.join(r, ".tmp", "hk_inbox_watch.json"), { pid, beat: Date.now() - ago });
stopCase("stop.watcher_missing", "استوديو مفتوح بلا مراقب ← لا توقف", (r) => studio(r, livePid()), (h) => expect(h.decision === "block" && /لا مراقب/.test(h.reason), `لم يُمنع (${h.decision})`));
stopCase("stop.watcher_alive", "استوديو مفتوح ومراقب ينبض ← التوقف مسموح", (r) => { studio(r, livePid()); watch(r, livePid()); }, (h) => expect(h.decision !== "block", `مُنع خطأً: ${h.reason.slice(0, 80)}`));
stopCase("stop.watcher_stale", "نبضة مراقب أقدم من 20 ثانية ← لا توقف", (r) => { studio(r, livePid()); watch(r, livePid(), 60e3); }, (h) => expect(h.decision === "block", "نبضة قديمة قُبلت"));
stopCase("stop.watcher_dead_pid", "نبضة حديثة من عملية ميتة ← لا توقف", (r) => { studio(r, livePid()); watch(r, deadPid()); }, (h) => expect(h.decision === "block", "مراقب ميت قُبل"));
stopCase("stop.studio_dead_ignored", "تسجيل استوديو ميت لا يمنع، ويُحذف تسجيله", (r) => studio(r, deadPid()), (h, r) => expect(h.decision !== "block" && !fs.existsSync(path.join(r, ".tmp", "hk_studio", "3999.json")), h.decision === "block" ? "استوديو ميت منع التوقف" : "تسجيل الميت لم يُحذف"));
const inbox = (r, reply) => put(path.join(r, ".tmp", "hk_inbox.jsonl"), JSON.stringify({ id: 7, at: new Date().toISOString(), comp: "Zz-L", frame: 120, text: "انقل العنوان إلى الأسفل", ...(reply ? { reply: "نُقل" } : {}) }) + "\n");
stopCase("stop.inbox_open", "رسالة استوديو بلا رد ← لا توقف", (r) => inbox(r, false), (h) => expect(h.decision === "block" && /بلا رد/.test(h.reason), "رسالة بلا رد لم تمنع التوقف"));
stopCase("stop.inbox_answered", "رسالة استوديو مُجاب عنها لا تمنع", (r) => inbox(r, true), (h) => expect(h.decision !== "block", `مُنع خطأً: ${h.reason.slice(0, 80)}`));
add("prompt.inbox_injected", [G, IW], "studio-inbox-unread", "رسالة الاستوديو بلا رد تُلحق بكل رسالة من المستخدم", async () => {
  const r = mkRoot("prompt_inbox"); inbox(r, false);
  const h = await hook(r, "prompt", { prompt: "مرحبا", cwd: r });
  return expect(/رسائل من الاستوديو بلا رد/.test(h.context) && /#7/.test(h.context), "الرسالة لم تُلحق");
});

// 4) ARABIC ONLY at Stop (user 2026-11-13: «لا افهم غير العربي»)
const arCase = (id, title, text, block) => add(id, G, "non-arabic-replies", title, async () => {
  const r = mkRoot(id); transcript(r, text);
  const h = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), session_id: "selftest", cwd: r });
  return expect((h.decision === "block") === block, block ? "رد إنجليزي لم يُرجَع" : `رد عربي أُرجع: ${h.reason.slice(0, 60)}`);
});
arCase("stop.arabic_english_block", "رد بالإنجليزية ← يُعاد بالعربية", "I moved the title to the bottom of the screen and rendered the preview again, here is the link.", true);
arCase("stop.arabic_ok", "رد عربي يمرّ", AR_OK, false);
arCase("stop.arabic_code_ok", "رد عربي فيه كتلة أوامر إنجليزية يمرّ", AR_OK + "\n```\nnode tools/stage.mjs check something --only land --verbose and more english words here\n```", false);

// 5) «✅ انتهيتُ من المونتاج» needs a fresh final_review proof
add("stop.final_claim_block", G, null, "«انتهيتُ من المونتاج» بلا دليل الفحص النهائي ← يُمنع، ومع الدليل يمرّ", async () => {
  const r = mkRoot("stop_final"); transcript(r, "✅ انتهيتُ من المونتاج، والرابط في سطره.");
  const a = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), cwd: r });
  put(path.join(r, ".tmp", "gates", "zzst.final.ok"), "ok");
  const b = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), cwd: r });
  return expect(a.decision === "block" && b.decision !== "block", a.decision !== "block" ? "الإعلان بلا دليل لم يُمنع" : "الإعلان مع الدليل مُنع");
});

// 6) THE COVER GATE (tools/cover_item.mjs coverFailure, user 2026-11-21: GTA 6 reels rendered without their cover)
const CI = "tools/cover_item.mjs";
const cover = async () => import(pathToFileURL(path.join(ROOT, CI)).href);
add("cover.missing_first", CI, "reels-without-cover", "مواصفة لا يبدأ فيها الغلاف ← مرفوضة", async () => {
  const { coverFailure } = await cover();
  const a = coverFailure("zz-selftest", { kind: "episode", items: [{ t: "torn", at: 1, until: 3 }, { t: "cover", style: "image", src: "zz/x.png" }] }), b = coverFailure("zz-selftest", { kind: "reel", items: [] });
  return expect(/ليس أول عنصر/.test(a) && /ليس أول عنصر/.test(b), "مواصفة بلا غلاف قُبلت");
});
add("cover.image_missing", CI, "reels-without-cover", "غلاف بصورة مفقودة أو بلا صورة ← مرفوض", async () => {
  const { coverFailure } = await cover();
  const a = coverFailure("zz-selftest", { kind: "episode", items: [{ t: "cover", style: "image", src: "zz_selftest_none/cover_land.png" }] }), b = coverFailure("zz-selftest", { kind: "episode", items: [{ t: "cover", style: "image" }] });
  return expect(/مفقودة/.test(a) && /بلا صورة/.test(b), `صورة مفقودة قُبلت (${a.slice(0, 40)} | ${b.slice(0, 40)})`);
});
add("cover.cartoon_exempt", CI, "reels-without-cover", "الكرتون والورقة والإعلان معفاة من الغلاف", async () => {
  const { coverFailure } = await cover();
  return expect(["cartoon", "paper", "ad", "explainer"].every((k) => coverFailure("zz", { kind: k, items: [] }) === ""), "نوع معفى رُفض");
});

// 7) THE OVERLAP GATE (tools/lib/overlap_gate.mjs = element_slots + slot_boxes; user 2026-11-20: «جمعت بين عنصرين فوق بعض»)
const OG = ["tools/lib/overlap_gate.mjs", "tools/element_slots.mjs", "tools/slot_boxes.mjs"];
const slots = (name, items) => runAsync(NODE, [path.join(ROOT, "tools", "element_slots.mjs"), "zz-selftest", "--spec", put(path.join(RUN, "slots", name + ".json"), { id: "zz-selftest", frames: 900, items })]);
add("overlap.slots_clash", OG, "two-elements-one-place", "عنصران كتابيان في مساحة واحدة في وقت واحد ← مرفوض", async () => {
  const x = await slots("clash", [{ t: "torn", text: "أ ب ج", at: 10, until: 14 }, { t: "scraps", text: "د ه و", at: 12, until: 16 }]);
  return expect(x.status === 1 && /✘/.test(x.out), `لم يُكشف التراكب (خروج ${x.status})`);
});
add("overlap.slots_clean", OG, "two-elements-one-place", "عنصران متتاليان بلا تراكب ← مقبولان", async () => {
  const x = await slots("clean", [{ t: "torn", text: "أ ب ج", at: 10, until: 12 }, { t: "scraps", text: "د ه و", at: 20, until: 22 }]);
  return expect(x.status === 0, `رُفض خطأً (خروج ${x.status}): ${(x.out + x.err).trim().slice(0, 100)}`);
});
add("overlap.missing_spec", OG, "overlap-gate-fail-open", "بوابة التراكب على مشروع بلا مواصفة لا تنجح بصمت", async () => {
  const { overlapFailures } = await import(pathToFileURL(path.join(ROOT, "tools", "lib", "overlap_gate.mjs")).href);
  const bad = overlapFailures("zz_selftest_no_such_spec");   // fixed 2026-11-21: a missing spec / crashed sub-tool is a failure (it was «no overlap»)
  return expect(bad.length && bad.every((l) => l.startsWith("✘")), "مواصفة مفقودة مرّت «بلا تراكب»");
});
manual("overlap.slot_boxes_spec", OG, "two-elements-one-place", "موضع الرسم على الشبكة (slot_boxes) على مواصفة وهمية", "slot_boxes.mjs لا يقبل --spec ويقرأ data/specs/<p>.json وحده؛ اختباره يحتاج مواصفة في مجلد المواصفات الحقيقي. يلزم خيار --spec فيه ثم حالة هنا.");

// 8) THE FACE ZONE (tools/lib/face_zone.mjs, user 2026-11-18 + corrected 2026-11-20: the zone ends at the upper half of the beard, 1.35 face heights)
const FZ = "tools/lib/face_zone.mjs";
add("face.constant_src", FZ, "face-zone-too-low", "المصدر: أسفل منطقة الوجه = y + 1.35h (لا 1.9h)", async () => {
  const s = fs.readFileSync(path.join(ROOT, FZ), "utf8");
  return expect(/z1\s*=\s*\[[^\]]*y\s*\+\s*1\.35\s*\*\s*h\s*\]/.test(s) && !/1\.9\s*\*\s*h/.test(s), "الثابت تغيّر في المصدر");
});
add("face.zone_bottom", FZ, "face-zone-too-low", "حساب المنطقة على تتبع وهمي: أسفلها عند 1.35 من ارتفاع الوجه (عرضي وطولي)", async () => {
  const { faceZoner } = await import(pathToFileURL(path.join(ROOT, FZ)).href);
  const d = path.join(RUN, "face"), cut = put(path.join(d, "public", "zzst_cut.mp4"), "fake"), st = fs.statSync(cut);
  const [x, y, w, h] = [800, 200, 300, 400];
  put(path.join(d, ".tmp", "facetrack", `zzst_cut_${st.size}_${Math.round(st.mtimeMs)}.json`), { fps: 30, boxes: Array.from({ length: 90 }, (_, i) => [i, x, y, w, h]) });
  const cwd = process.cwd(); let land, port;
  try { process.chdir(d); const z = faceZoner({ cut: "zzst_cut.mp4", items: [] }); land = z(1, "land"); port = z(1, "port"); } finally { process.chdir(cwd); }
  const wantL = y + 1.35 * h, wantP = wantL * 1920 / 1080;
  return expect(Math.abs(land[3] - wantL) < 0.5 && Math.abs(port[3] - wantP) < 0.5 && Math.abs(land[1] - (y - 0.38 * h)) < 0.5, `العرضي ${land?.[3]?.toFixed(1)} (المطلوب ${wantL})، الطولي ${port?.[3]?.toFixed(1)} (المطلوب ${wantP.toFixed(1)})`);
});

// 9) spec_normalize WRITE GUARD (2026-11-20, gta6: a long check wrote an older spec over three edits made meanwhile)
const SN = "tools/spec_normalize.mjs";
const normRun = async (name, otherWriter) => {
  const d = path.join(RUN, name), id = "zzst_norm", spec = put(path.join(d, "data", "specs", `${id}.json`), JSON.stringify({ id, frames: 300, comp: "Zz-L", items: [{ t: "cover", style: "image", src: "zz/cover_land.png" }] }, null, 1));
  put(path.join(d, ".tmp", id, "cut_words.json"), []);
  // the "other writer": a fake sub-tool of the run that edits the spec by itself (as a second session would) between two writes of spec_normalize
  if (otherWriter) put(path.join(d, "tools", "mg_usage_audit.mjs"), `import fs from "node:fs"; const f = process.argv[2]; const s = JSON.parse(fs.readFileSync(f, "utf8")); s.otherWriter = true; fs.writeFileSync(f, JSON.stringify(s, null, 1)); console.log("ok");`);
  const x = await runAsync(NODE, [path.join(ROOT, SN), spec, "--o", "land"], { cwd: d, timeout: 30000 });
  return { ...x, spec: JSON.parse(fs.readFileSync(spec, "utf8")) };
};
add("norm.concurrent_writer", SN, "concurrent-spec-writers", "كاتب آخر عدّل المواصفة أثناء التطبيع ← لا يُكتب فوقه", async () => {
  const x = await normRun("norm_other", true);
  return expect(x.status === 3 && /تغيّر أثناء عملي/.test(x.err) && x.spec.otherWriter === true, `خروج ${x.status}، تعديل الآخر ${x.spec.otherWriter ? "باقٍ" : "ضاع"}`);
});
add("norm.no_false_alarm", SN, "concurrent-spec-writers", "بلا كاتب آخر لا يدّعي التطبيع تعارضاً", async () => {
  const x = await normRun("norm_alone", false);
  return expect(x.status !== 3 && !/تغيّر أثناء عملي/.test(x.err), `ادّعى تعارضاً (خروج ${x.status})`);
});

// 10) el.mjs --no-gate only inside a batch (user 2026-11-20: «يجب ان لا يقبله البرنامج حتى لو فعلته أنت»)
const EL = "tools/el.mjs";
add("el.no_gate_refused", EL, "error-then-check-then-fix", "تخطّي فحص العناصر باليد مرفوض", async () => {
  const env = { ...process.env }; delete env.EL_BATCH_CHILD;
  const x = await runAsync(NODE, [path.join(ROOT, EL), "list", "zzqq_none", "--no-gate"], { env });
  return expect(x.status === 2 && /--no-gate لا يُقبل/.test(x.err), `قُبل (خروج ${x.status})`);
});
add("el.no_gate_batch_ok", EL, "error-then-check-then-fix", "داخل الدفعة فقط يُقبل التخطي (الدفعة تفحص نتيجتها كلها)", async () => {
  const x = await runAsync(NODE, [path.join(ROOT, EL), "list", "zzqq_none", "--no-gate"], { env: { ...process.env, EL_BATCH_CHILD: "1" } });
  return expect(!/--no-gate لا يُقبل/.test(x.err), "رُفض داخل الدفعة");
});

// 11) montage_guard end never trashes an original another project still uses (2026-11-20, gta6) — running it is a purge: read as source
const MG = "tools/montage_guard.mjs";
add("mg.shared_original_src", MG, "reel-end-trashed-episode-original", "المصدر: الأصل لا يُرمى ما دام مشروع آخر يستعمله (فحص المستعملين قبل الرمي)", async () => {
  const s = fs.readFileSync(path.join(ROOT, MG), "utf8"), iU = s.indexOf("if (users.length)"), iT = s.indexOf("SendToRecycleBin");
  return expect(/const users = orig \?/.test(s) && /prep_config\.json/.test(s) && /data", "specs"/.test(s) && iU > 0 && iT > iU, "فحص المستعملين اختفى أو صار بعد الرمي");
});
/* (2026-11-21, user: «اعمل حارس للأخطاء الأربعة الباقية») the decision itself, run read-only (montage_guard orig-plan --root <scratch>) — gta6/mufti: the
   project's own reels kept its original, then the same end deleted them and the re-run no longer knew the original */
const mgTree = (name, { other = false, ownReel = true, pendOnly = false } = {}) => {
  const r = path.join(RUN, name), orig = path.join(r, "orig.mp4");
  put(orig, "x");
  if (!pendOnly) put(path.join(r, ".tmp", "ep", "prep_config.json"), { original: orig });
  else put(path.join(r, "data", "pending_originals.json"), { ep: orig });
  put(path.join(r, "data", "specs", "ep.json"), {});
  if (ownReel) { put(path.join(r, ".tmp", "ep-reel", "prep_config.json"), { original: orig }); put(path.join(r, "data", "specs", "ep-reel.json"), {}); }
  if (other) { put(path.join(r, ".tmp", "other", "prep_config.json"), { original: orig }); put(path.join(r, "data", "specs", "other.json"), {}); }
  return r;
};
const origPlan = async (r, p) => { const x = await runAsync(NODE, [path.join(ROOT, MG), "orig-plan", p, "--root", r], { cwd: ROOT }); try { return JSON.parse(x.out.trim().split(String.fromCharCode(10)).pop().trim()); } catch { return { err: x.out + x.err }; } };
add("mg.own_reel_not_user", MG, "mufti-original-missed-in-purge", "ريلز المشروع نفسه لا تحجز أصله: الحلقة تُعتمد فيُرمى الأصل", async () => {
  const p = await origPlan(mgTree("mg_own"), "ep"); return expect(p.action === "trash" && !p.users?.length, `القرار ${JSON.stringify(p)}`);
});
add("mg.other_project_keeps", MG, "reel-end-trashed-episode-original", "مشروع آخر يستعمل الأصل نفسه: يبقى الأصل", async () => {
  const p = await origPlan(mgTree("mg_other", { other: true }), "ep"); return expect(p.action === "keep" && p.users?.includes("other"), `القرار ${JSON.stringify(p)}`);
});
add("mg.reel_end_keeps_episode", MG, "reel-end-trashed-episode-original", "اعتماد ريل والحلقة ما زالت تُعدّل: لا يُرمى أصلها", async () => {
  const p = await origPlan(mgTree("mg_reel"), "ep-reel"); return expect(p.action === "keep" && p.users?.includes("ep"), `القرار ${JSON.stringify(p)}`);
});
add("mg.pending_original_found", MG, "mufti-original-missed-in-purge", "أصل محجوز سابقاً يجده المسح ولو حُذف سجل التجهيز", async () => {
  const p = await origPlan(mgTree("mg_pend", { ownReel: false, pendOnly: true }), "ep"); return expect(p.action === "trash" && /orig\.mp4$/.test(p.orig ?? ""), `القرار ${JSON.stringify(p)}`);
});

// 12) gpu_render refuses a FULL render of a montage without a bumper (user 2026-11-20) — no dry-run: read as source
const GR = "tools/gpu_render.mjs";
add("gpu.no_bumper_src", GR, "bumper-glued-by-render", "المصدر: رندر كامل لمونتاج بلا فاصل مرفوض قبل أي إطار", async () => {
  const s = fs.readFileSync(path.join(ROOT, GR), "utf8"), i = s.search(/if \(BSPEC && !BSPEC\.bumper[^\n]*\n[^\n]*\n\s*console\.error\([^\n]*has no bumper[^\n]*process\.exit\(1\)/), j = s.indexOf("const FRAME_LIST");
  return expect(i > 0 && j > i, "شرط الفاصل اختفى أو تأخر بعد بدء الإطارات");
});
manual("gpu.no_bumper_run", GR, "bumper-glued-by-render", "تشغيل الرندر على مونتاج بلا فاصل", "الرفض يقع بعد قفل الرندر وتجهيز الحزمة (دقائق)، ولا وضع فحص فقط؛ يلزم خيار --check-only يفحص الغلاف والفاصل والتراكب قبل القفل ثم حالة هنا.");

// 13) THE TIME BOX DOES NOT NAG ABOUT A STAGE THAT IS OVER (guard.mjs post, 84789ec; gta6 2026-11-21: «الفحص فشل 17 مرة» hours after final_review passed)
const tbRoot = (id, entry) => { const r = mkRoot(id); put(path.join(r, ".tmp", "active_montage.json"), { projects: ["zzst"] }); if (entry) put(path.join(r, ".tmp", "zzst", "timebox.json"), { check: { n: 5, ar: "الفحص", msg: "✘ الحارس: 2 مشكلة", ...entry } }); return r; };
const post = (r, command, stdout) => hook(r, "post", { tool_name: "Bash", tool_input: { command }, tool_response: { stdout, stderr: "" }, cwd: r });
const tbFile = (r) => { try { return JSON.parse(fs.readFileSync(path.join(r, ".tmp", "zzst", "timebox.json"), "utf8")); } catch { return {}; } };
const NAG = /حدّ الوقت/;
add("timebox.source_grep_ignored", G, "stale-nags", "سطر «✘ الحارس» من بحث في المصدر لا يُعدّ فشلاً", async () => {
  const r = tbRoot("tb_grep"); let nag = false;
  for (let i = 0; i < 4; i++) nag = NAG.test((await post(r, "grep -n \"الحارس\" tools/montage_guard.mjs # zzst", "193:   if (cmd === \"check\") { console.log(bad ? `\\n✘ الحارس: ${bad} مشكلة` : \"\"); }\n✘ الحارس: 3 مشكلة — لا «انتهيت».")).context) || nag;
  return expect(!nag && !tbFile(r).check, "بحث في المصدر عُدّ فشلاً");
});
add("timebox.real_failure_nags", G, "time-box-blocker", "ثلاث إخفاقات حقيقية للفحص ← تنبيه حدّ الوقت (الحارس الأصلي ما زال يعمل)", async () => {
  const r = tbRoot("tb_real"); let nag = false;
  for (let i = 0; i < 3; i++) nag = NAG.test((await post(r, "node tools/stage.mjs check zzst", "✘ الحارس: 2 مشكلة — لا «انتهيت».")).context) || nag;
  return expect(nag && tbFile(r).check?.n === 3, `لا تنبيه بعد 3 إخفاقات (العدّاد ${tbFile(r).check?.n ?? 0})`);
});
add("timebox.control_nags", G, "stale-nags", "إخفاق حديث بلا دليل نجاح ← ينبّه (ضابط الحالات التالية)", async () => {
  const r = tbRoot("tb_ctrl", { first: Date.now() - 120e3, last: Date.now() - 60e3 });
  return expect(NAG.test((await post(r, "echo zzst", "")).context), "لم ينبّه");
});
add("timebox.proof_resets", G, "stale-nags", "دليل فحص نهائي أحدث من الإخفاق يُسقطه", async () => {
  const r = tbRoot("tb_proof", { first: Date.now() - 120e3, last: Date.now() - 60e3 }); put(path.join(r, ".tmp", "gates", "zzst.final.ok"), "ok");
  const h = await post(r, "echo zzst", "");
  return expect(!NAG.test(h.context) && !tbFile(r).check, "نبّه رغم الدليل الأحدث");
});
add("timebox.stale_dropped", G, "stale-nags", "إخفاق مضى عليه 30 دقيقة يسقط", async () => {
  const r = tbRoot("tb_stale", { first: Date.now() - 50 * 60e3, last: Date.now() - 40 * 60e3 });
  const h = await post(r, "echo zzst", "");
  return expect(!NAG.test(h.context) && !tbFile(r).check, "إخفاق قديم نبّه");
});
add("timebox.approved_silent", G, "stale-nags", "مشروع معتمد (حزمة النشر محفوظة) لا ينبّه", async () => {
  const r = tbRoot("tb_appr", { first: Date.now() - 120e3, last: Date.now() - 60e3 }); put(path.join(r, "data", "publish_queue", "zzst", "package.md"), "x");
  return expect(!NAG.test((await post(r, "echo zzst", "")).context), "مشروع معتمد نبّه");
});

// 14) A PUBLISH CLAIM CARRIES ITS LINK (guard.mjs stop, 84789ec; «ليش تكذب رسائلي؟»)
const claim = (id, title, text, block) => add(id, G, "false-progress-claims", title, async () => {
  const r = mkRoot(id); transcript(r, text);
  const h = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), cwd: r });
  return expect((h.decision === "block") === block, block ? "ادعاء نشر بلا رابط مرّ" : `مُنع خطأً: ${h.reason.slice(0, 80)}`);
});
claim("publish.claim_no_link", "«نُشر» بلا رابط ← يُعاد", "نُشر الفيديو على يوتيوب وجُدول الريل للغد.", true);
claim("publish.claim_with_link", "«نُشر» مع رابطه يمرّ", "نُشر الفيديو على يوتيوب:\nhttps://youtu.be/zzselftest", false);
claim("publish.negated_ok", "«لم يُرفع بعد» ليس ادعاءً", "لم يُرفع الفيديو بعد؛ ينتظر موافقتك.", false);
claim("publish.honest_ok", "«رُفع ولم أتحقق» صادق فيمرّ", "رُفع الملف ولم أتحقق من ظهوره بعد.", false);

// 15) APPROVAL: the question names the deletion; the package outlives the purge (84789ec; «ارفع واعتمد» was not a yes to delete)
add("approval.question_names_delete_src", [".claude/skills/approval/SKILL.md", "tools/publish_queue.mjs"], "approval-purge-blocked", "المصدر: سؤال الاعتماد يسمّي الحذف، وحزمة النشر لا تُحذف قبل المسح", async () => {
  const sk = fs.readFileSync(path.join(ROOT, ".claude", "skills", "approval", "SKILL.md"), "utf8"), pq = fs.readFileSync(path.join(ROOT, "tools", "publish_queue.mjs"), "utf8");
  const iReg = pq.indexOf("ما زال مسجَّلاً"), iClear = pq.indexOf('cmd === "clear"');
  return expect(/أعتمده وأحذف ملفات العمل نهائياً/.test(sk) && /«ارفع واعتمد»\) = إذن بالنشر لا بالحذف/.test(sk) && iClear > 0 && iReg > iClear && /active_montage\.json/.test(pq), "نص السؤال أو شرط الحزمة اختفى");
});
manual("approval.purge_run", ["tools/publish_queue.mjs", "tools/montage_guard.mjs"], "approval-purge-blocked", "تشغيل حذف الحزمة والمسح فعلاً", "publish_queue.mjs ينتقل إلى مجلد العمل الحقيقي ويحذف؛ ولا خيار --root. يلزم خيار --root (كما في yt_package) ثم حالة هنا.");

// 16) BEFORE APPROVAL: sections, the YouTube package, the questions page (tools/prepublish_gates.mjs + yt_package --check, 6685870; gta6 2026-11-21)
const PG = "tools/prepublish_gates.mjs", YP = "tools/yt_package.mjs";
const pgMod = async () => import(pathToFileURL(path.join(ROOT, PG)).href);
const pubRoot = async (id, { sections = true, rail = true, pkg = "good", answers = null } = {}) => {
  const { sectionsWant } = await pgMod(), r = path.join(RUN, id), p = "zzpub";
  fs.mkdirSync(path.join(r, "data"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "data", "sections_rule.json"), path.join(r, "data", "sections_rule.json"));
  const spec = { id: p, kind: "episode", frames: 20 * 60 * 30, fps: 30, items: [] }, { want } = sectionsWant(spec, r), step = (20 * 60) / want;
  const S = Array.from({ length: want }, (_, i) => ({ title: `القسم ${i + 1}`, at: i * step }));
  if (rail) spec.items.push({ t: "pick", el: "SectionsRail", at: 2, until: 8, sections: S });
  put(path.join(r, "data", "specs", `${p}.json`), spec);
  if (sections) put(path.join(r, ".tmp", p, "sections.json"), S);
  const mm = (s) => { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const md = pkg === "good"
    ? ["# حزمة يوتيوب — حلقة تجريبية", "", "## الوصف", "فقرة وصف تجريبية من تفريغ القص تشرح موضوع الحلقة وما يقال فيها بوضوح.", "", "## الفصول", ...S.map((x, i) => `${mm(i ? x.at : 0)} ${x.title}`), "", "## قائمة التشغيل", "https://www.youtube.com/playlist?list=PLzzselftest", "", "## الوسوم", "وسم أول، وسم ثان", ""]
    : ["# حزمة يوتيوب — حلقة تجريبية", "", "## الوصف", "✍ (اكتب هنا فقرة الوصف)", "", "## الفصول", ...S.map((x, i) => `${mm(i ? x.at : 0)} ${x.title}`), "", "## الوسوم", "", ""];
  put(path.join(r, "data", "youtube", `${p}_package.md`), md.join("\n"));
  put(path.join(r, ".tmp", p, "questions.json"), [{ id: "q1", q: "زيد بن ثابت أم أسامة بن زيد؟" }]);
  put(path.join(r, ".tmp", p, "answers.json"), answers ?? {});
  return { r, p, spec };
};
add("sections.missing", PG, "sections-skipped", "حلقة بلا ملف أقسام وبلا خط أقسام ← مرفوضة", async () => {
  const { sectionsFailures } = await pgMod(), { r, p, spec } = await pubRoot("pub_nosec", { sections: false, rail: false }), f = sectionsFailures(p, spec, r);
  return expect(f.some((x) => /لا أقسام/.test(x)) && f.some((x) => /لا خط أقسام/.test(x)), `لم يُرفض: ${f.join(" | ").slice(0, 120)}`);
});
add("sections.ok", PG, "sections-skipped", "أقسام بعدد الجدول وخطها في أول الثواني ← مقبولة", async () => {
  const { sectionsFailures } = await pgMod(), { r, p, spec } = await pubRoot("pub_sec"), f = sectionsFailures(p, spec, r);
  return expect(!f.length, `رُفض خطأً: ${f.join(" | ").slice(0, 160)}`);
});
add("package.incomplete", [YP, PG], "youtube-package-incomplete", "حزمة بلا وصف ولا وسوم ولا قائمة تشغيل ← مرفوضة", async () => {
  const { packageFailures } = await pgMod(), { r, p } = await pubRoot("pub_badpkg", { pkg: "bad" }), f = packageFailures(p, r);
  return expect(f.some((x) => /الوصف/.test(x)) && f.some((x) => /الوسوم/.test(x)) && f.some((x) => /قائمة تشغيل/.test(x)), `ما رُفض: ${f.join(" | ").slice(0, 160)}`);
});
add("package.ok", [YP, PG], "youtube-package-incomplete", "حزمة كاملة (وصف، وسوم، فصول = الأقسام، قائمة) ← مقبولة", async () => {
  const { packageFailures } = await pgMod(), { r, p } = await pubRoot("pub_goodpkg"), f = packageFailures(p, r);
  return expect(!f.length, `رُفضت خطأً: ${f.join(" | ").slice(0, 160)}`);
});
manual("package.event_playlist", [YP], "youtube-package-incomplete", "تعليق على حدث في قائمة غير «التعليق على الأحداث»", "الفحص (--check) يتحقق من وجود قائمة فقط؛ اختيار قائمة الأحداث يجري عند كتابة الحزمة لا عند فحصها، فلا رفض يُختبر. يلزم فحص مطابقة القائمة لنوع الحلقة في --check.");
add("questions.open", PG, "youtube-package-incomplete", "صفحة الأسئلة فيها بند بلا جواب ← مرفوضة، وبجواب من كلامه ← مقبولة", async () => {
  const { questionsFailures } = await pgMod(), a = await pubRoot("pub_q_open"), b = await pubRoot("pub_q_done", { answers: { q1: { note: "قال: أسامة بن زيد" } } });
  const fa = questionsFailures(a.p, a.r), fb = questionsFailures(b.p, b.r);
  return expect(fa.length === 1 && /\[q1\]/.test(fa[0]) && !fb.length, fa.length ? "بند مُجاب عُدّ مفتوحاً" : "بند بلا جواب مرّ");
});

/* 17) A MISRECITED VERSE AND A DOUBTFUL NAME (tools/recitation_check.mjs, tools/name_doubt.mjs, 0130256; gta6 2026-11-21: «عذاب شديد» for «أليم»; «لبنان» never said).
   Scratch transcripts only, no second listening (no GPU): recitation_check --no-audio, name_doubt with no audio file. Both tools keep their own reports in
   .tmp/<p>/ of the real workspace, so the projects here are named zz_selftest_* and those folders (only) are removed at the end. */
const OWN_TMP = new Set();
const ownTmp = (name) => { if (!/^zz_selftest_[a-z_]+$/.test(name)) throw new Error("not a self-test project: " + name); OWN_TMP.add(name); return path.join(ROOT, ".tmp", name); };
const wordsOf = (text, t0 = 230) => text.split(" ").map((w, i) => ({ w, s: +(t0 + i * 0.45).toFixed(2), e: +(t0 + i * 0.45 + 0.4).toFixed(2), p: 0.9 }));
const NUR19 = "إن الذين يحبون أن تشيع الفاحشة في الذين آمنوا لهم عذاب أليم في الدنيا والآخرة والله يعلم وأنتم لا تعلمون";
const recite = async (name, text) => {
  const d = ownTmp(name), wf = put(path.join(RUN, name, "cut_words.json"), wordsOf("قال الله تعالى " + text + " فانظروا"));
  void d; return runAsync(NODE, [path.join(ROOT, "tools", "recitation_check.mjs"), name, "--words", wf, "--no-audio", "--strict"], { timeout: 60000 });
};
const RC = ["tools/recitation_check.mjs", "tools/verse_audit.mjs"];
add("verse.misrecited", RC, "misrecited-verse-not-caught", "«عذاب شديد» مكان «عذاب أليم» (النور 19) ← سطر فشل باستبدال", async () => {
  const x = await recite("zz_selftest_recite_bad", NUR19.replace("أليم", "شديد"));
  return expect(x.status === 1 && /✘[^\n]*24:19[^\n]*استبدال: قال «شديد»/.test(x.out), `لم يُكشف (خروج ${x.status}): ${(x.out + x.err).trim().split("\n").slice(0, 3).join(" | ").slice(0, 160)}`);
});
add("verse.correct_ok", RC, "misrecited-verse-not-caught", "الآية كما في المصحف ← لا سطر فشل", async () => {
  const x = await recite("zz_selftest_recite_good", NUR19);
  return expect(x.status === 0 && /24:19/.test(x.out) && !/✘/.test(x.out), `خروج ${x.status}: ${(x.out.match(/✘[^\n]*/) ?? [x.err.trim()])[0].slice(0, 140)}`);
});
const ND = ["tools/name_doubt.mjs", "tools/names_scan.mjs", "tools/requirements.mjs"];
const doubt = async (name, cut, full) => {
  const d = ownTmp(name); put0(path.join(d, "cut_words.json"), cut); if (full) put0(path.join(d, "drift_fresh.json"), full);
  const { nameDoubts } = await import(pathToFileURL(path.join(ROOT, "tools", "name_doubt.mjs")).href);
  return nameDoubts(name, [{ text: "لبنان", t: 95, kind: "place" }])[0];
};
const put0 = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data)); };   // only under ownTmp() folders
const ONCE = wordsOf("هذه صور لبنان فقط يا إخوة", 94);
add("names.single_hit_doubt", ND, "lebanon-transcription-error", "«لبنان» سمعه تفريغ واحد مرة واحدة ولا صوت ← مشكوك لا عنصر", async () => {
  const r = await doubt("zz_selftest_names_once", ONCE, null);
  return expect(r.verdict === "doubt", `الحكم ${r.verdict}: ${r.why}`);
});
add("names.both_passes_ok", ND, "lebanon-transcription-error", "سمعه التفريغان في الموضع نفسه ← مؤكد", async () => {
  const r = await doubt("zz_selftest_names_both", ONCE, wordsOf("هذه صور لبنان فقط", 94.1));
  return expect(r.verdict === "ok", `الحكم ${r.verdict}: ${r.why}`);
});
add("names.full_pass_disagrees", ND, "lebanon-transcription-error", "التفريغ الكامل سمع غيره («صور لفقط») ← مشكوك", async () => {
  const r = await doubt("zz_selftest_names_other", ONCE, wordsOf("هذه صور لفقط يا إخوة", 94));
  return expect(r.verdict === "doubt" && /لفقط/.test(r.why), `الحكم ${r.verdict}: ${r.why}`);
});
add("names.two_moments_ok", ND, "lebanon-transcription-error", "ذُكر في موضعين من الحلقة ← مؤكد", async () => {
  const r = await doubt("zz_selftest_names_twice", [...ONCE, ...wordsOf("وقال لبنان كلها", 300)], null);
  return expect(r.verdict === "ok", `الحكم ${r.verdict}: ${r.why}`);
});
add("names.nisba_ok", ND, "name-doubt-nisba-missed", "ذُكرت نسبته في موضع آخر (لبنان ثم اللبنانيين) ← مؤكد", async () => {
  const r = await doubt("zz_selftest_names_nisba", [...ONCE, ...wordsOf("وقال اللبنانيين كلهم", 300)], null);
  return r.verdict === "ok" ? { ok: true } : { ok: false, known: true, why: `ثغرة معروفة في tools/name_doubt.mjs: bare() يقطع لام «لبنان» كأنها حرف جر («بنان»)، فلا تطابق نسبته «اللبنانيين» — الحكم ${r.verdict} (يعني سؤالاً زائداً، لا عنصراً خاطئاً)` };
});

/* 18) PLACEMENT FIRST (guard.mjs prompt + pre, 2026-11-21; user 2026-11-20: the court picture at 0:05 sat 4 minutes in the wrong place — «4 دقائق مرت ولم تعدل
   مكان عنصر، هذا فساد كبير»). A «راسلني» note / his prompt asking to move an element: after 60 s with no move, the main session may not investigate tools/ src/. */
const PLC = "placement-fix-delayed";
const plNote = (r, ago, extra = {}) => put(path.join(r, ".tmp", "hk_inbox.jsonl"), JSON.stringify({ id: "zzpl1", at: new Date(Date.now() - ago).toISOString(), comp: "Zz-L", frame: 150, elements: "صورة المحكمة", text: "صورة المحكمة عند 0:05 في غير مكانها، انقلها إلى اليمين", reply: null, ...extra }) + "\n");
const pre = (r, tool_name, tool_input, extra = {}) => hook(r, "pre", { tool_name, tool_input, cwd: r, session_id: "selftest", ...extra });
const readTools = (r, extra) => pre(r, "Read", { file_path: path.join(r, "tools", "el.mjs") }, extra);
const PL_DENY = /انقل العنصر أولاً/;
add("place.note_blocks_read", G, PLC, "رسالة نقل عمرها 90 ث بلا نقل ← قراءة tools/ مرفوضة بأمر «انقل العنصر أولاً»", async () => {
  const r = mkRoot("pl_block"); plNote(r, 90e3); const h = await readTools(r);
  return expect(h.decision === "deny" && PL_DENY.test(h.reason) && /#zzpl1/.test(h.reason), `لم تُرفض (${h.decision ?? "سُمح"})`);
});
add("place.note_fresh_allowed", G, PLC, "رسالة نقل عمرها 20 ث ← البحث ما زال مسموحاً (المهلة دقيقة)", async () => {
  const r = mkRoot("pl_fresh"); plNote(r, 20e3); const h = await readTools(r);
  return expect(h.decision !== "deny", `رُفض قبل الدقيقة: ${h.reason.slice(0, 60)}`);
});
add("place.investigation_kinds_blocked", G, PLC, "بعد الدقيقة: البحث في src/ وgrep على tools/ والأمر الطويل في المقدمة كلها مرفوضة", async () => {
  const r = mkRoot("pl_kinds"); plNote(r, 90e3);
  const a = await pre(r, "Grep", { pattern: "slot", path: path.join(r, "src") }), b = await pre(r, "Bash", { command: "cd /s/AI_Tools/Remotion_Workspace && grep -n slot tools/el.mjs" });
  const c = await pre(r, "Glob", { pattern: "tools/**/*.mjs" }), d = await pre(r, "Bash", { command: "node tools/final_review.mjs --name zzst" });
  const bad = [["Grep src", a], ["grep tools", b], ["Glob tools", c], ["أمر طويل", d]].filter(([, h]) => h.decision !== "deny").map(([n]) => n);
  return expect(!bad.length, `لم يُرفض: ${bad.join("، ")}`);
});
add("place.spec_and_list_allowed", G, PLC, "بعد الدقيقة: قراءة المواصفة وel.mjs items/list مسموحة", async () => {
  const r = mkRoot("pl_free"); plNote(r, 90e3);
  const a = await pre(r, "Read", { file_path: path.join(r, "data", "specs", "zzst.json") }), b = await pre(r, "Bash", { command: "node tools/el.mjs items zzst" }), c = await pre(r, "Bash", { command: "node tools/el.mjs list zzst" });
  const bad = [["المواصفة", a], ["items", b], ["list", c]].filter(([, h]) => h.decision === "deny").map(([n]) => n);
  return expect(!bad.length, `رُفض خطأً: ${bad.join("، ")}`);
});
add("place.move_unblocks", G, PLC, "el.mjs slot يُسجَّل نقلاً ← البحث يعود مفتوحاً", async () => {
  const r = mkRoot("pl_move"); plNote(r, 90e3);
  const m = await pre(r, "Bash", { command: "node tools/el.mjs slot zzst #a1 right --land" }), h = await readTools(r);
  return expect(m.decision !== "deny" && h.decision !== "deny", m.decision === "deny" ? "النقل نفسه رُفض" : "بعد النقل ما زال البحث مرفوضاً");
});
add("place.spec_edit_counts", G, PLC, "تعديل العنصر في المواصفة (أو size عبر الاستوديو) يُعدّ نقلاً", async () => {
  const r = mkRoot("pl_spec"); plNote(r, 90e3);
  await pre(r, "Edit", { file_path: path.join(r, "data", "specs", "zzst.json"), old_string: "a", new_string: "b" }); const a = await readTools(r);
  const r2 = mkRoot("pl_api"); plNote(r2, 90e3);
  await pre(r2, "Bash", { command: "curl -s -X POST localhost:3999/api/gallery/size -d '{\"id\":\"a1\"}'" }); const b = await readTools(r2);
  return expect(a.decision !== "deny" && b.decision !== "deny", a.decision === "deny" ? "تعديل المواصفة لم يُعدّ نقلاً" : "تحجيم الاستوديو لم يُعدّ نقلاً");
});
add("place.agent_exempt", G, PLC, "الوكيل المساعد لا يُمنع (عمله مفوَّض)", async () => {
  const r = mkRoot("pl_agent"); plNote(r, 90e3); const h = await readTools(r, { agent_id: "selftest-agent" });
  return expect(h.decision !== "deny", "الوكيل مُنع");
});
add("place.replied_or_other_free", G, PLC, "رسالة مُجاب عنها أو ليست عن المكان ← لا منع", async () => {
  const r = mkRoot("pl_replied"); plNote(r, 90e3, { reply: { at: new Date().toISOString(), text: "نُقلت" } }); const a = await readTools(r);
  const r2 = mkRoot("pl_other"); plNote(r2, 90e3, { text: "الصوت منخفض هنا، ارفع صوت الشيخ", elements: "" }); const b = await readTools(r2);
  return expect(a.decision !== "deny" && b.decision !== "deny", a.decision === "deny" ? "رسالة مُجاب عنها منعت" : "رسالة صوت عُدّت نقلاً");
});
add("place.prompt_watch", G, PLC, "رسالته «انقلها يمين» تبدأ العدّ وتذكّر بالنقل؛ رسالة تالية عادية تنهيه؛ والكلام عن الحارس ليس طلب نقل", async () => {
  const r = mkRoot("pl_prompt"), f = path.join(r, ".tmp", "placement_watch.json");
  const p1 = await hook(r, "prompt", { prompt: "صورة المحكمة عند ٠:٠٥ في غير مكانها، انقلها يمين", cwd: r });
  let st = {}; try { st = JSON.parse(fs.readFileSync(f, "utf8")); } catch { /* none */ }
  if (!st.prompt) return expect(false, "طلب النقل لم يُسجَّل");
  st.prompt.at = Date.now() - 90e3; put(f, st);
  const blocked = await readTools(r);
  await hook(r, "prompt", { prompt: "شكراً، تابع", cwd: r }); const freed = await readTools(r);
  const r2 = mkRoot("pl_prompt_guard"); await hook(r2, "prompt", { prompt: "اعمل حارساً: إن قلت انقل الصورة يمين فانقلها", cwd: r2 });
  return expect(/📐/.test(p1.context) && blocked.decision === "deny" && freed.decision !== "deny" && !fs.existsSync(path.join(r2, ".tmp", "placement_watch.json")),
    !/📐/.test(p1.context) ? "لا تذكير بالنقل" : blocked.decision !== "deny" ? "بعد الدقيقة لم يُمنع البحث" : freed.decision === "deny" ? "الرسالة التالية لم تنهِ العدّ" : "الكلام عن الحارس عُدّ طلب نقل");
});

/* 19) SEARCH BEFORE ASKING (guard.mjs stop, 2026-11-21; user 2026-11-20: asked for the link of the «مفتي الأردن» short that one YouTube search found —
   «انت لازم تعرفه»، «لا تكن كسولا»). A reply asking him for a link / episode / name / source / date, with no search in the turn, goes back once. */
const ASKL = "asked-instead-of-searching";
const ASK_TXT = "لم أجد المقطع في الملفات. ما رابط قصير مفتي الأردن؟ أرسله لأضيفه.";
const turn = (r, { before = [], tools = [], text }) => {
  const U = (c) => JSON.stringify({ type: "user", message: { role: "user", content: c } }), A = (c) => JSON.stringify({ type: "assistant", message: { role: "assistant", content: c } });
  const use = (t, i) => [A([{ type: "tool_use", id: `tu${i}`, name: t.name, input: t.input }]), U([{ type: "tool_result", tool_use_id: `tu${i}`, content: "نتيجة" }])];
  const rows = [U("أول رسالة"), ...before.flatMap((t, i) => use(t, 100 + i)), A([{ type: "text", text: "تمّ." }]), U("أكمل الريل وضع قصير المفتي"), ...tools.flatMap((t, i) => use(t, i)), A([{ type: "text", text }])];
  return put(path.join(r, "transcript.jsonl"), rows.join("\n") + "\n");
};
const askCase = (id, title, spec, block, extra = {}) => add(id, G, ASKL, title, async () => {
  const r = mkRoot(id); turn(r, spec);
  const h = await hook(r, "stop", { transcript_path: path.join(r, "transcript.jsonl"), session_id: "selftest", cwd: r, ...extra });
  return expect((h.decision === "block") === block && (!block || /ابحث أولاً/.test(h.reason)), block ? `سؤال بلا بحث مرّ (${h.decision ?? "سُمح"})` : `مُنع خطأً: ${h.reason.slice(0, 80)}`);
});
askCase("ask.link_no_search_block", "«ما رابط…؟» بلا أي بحث في الدورة ← يُعاد «ابحث أولاً»", { text: ASK_TXT }, true);
askCase("ask.imperative_block", "«أعطني الرابط» بلا بحث ← يُعاد", { text: "أعطني الرابط لأكمل الريل." }, true);
askCase("ask.episode_name_block", "«في أي حلقة…؟» و«ما اسم…؟» بلا بحث ← يُعاد", { text: "في أي حلقة تكلمتَ عن هذا؟" }, true);
askCase("ask.search_last_turn_not_counted", "بحث في دورة سابقة لا يُحسب لهذه ← يُعاد", { before: [{ name: "WebSearch", input: { query: "مفتي الأردن" } }], text: ASK_TXT }, true);
askCase("ask.after_websearch_ok", "بعد بحث على الويب يمرّ السؤال", { tools: [{ name: "WebSearch", input: { query: "مفتي الأردن قصير" } }], text: ASK_TXT }, false);
askCase("ask.after_channel_index_ok", "بعد البحث في فهرس القناة يمرّ", { tools: [{ name: "Bash", input: { command: "node tools/channel_index.mjs find \"مفتي الأردن\"" } }], text: ASK_TXT }, false);
askCase("ask.after_data_grep_ok", "بعد Grep في data/ (قوائم التشغيل) يمرّ", { tools: [{ name: "Grep", input: { pattern: "مفتي", path: "data/playlists.json" } }], text: ASK_TXT }, false);
askCase("ask.after_browser_youtube_ok", "بعد فتح يوتيوب في المتصفح يمرّ", { tools: [{ name: "mcp__claude-in-chrome__navigate", input: { url: "https://www.youtube.com/results?search_query=x" } }], text: ASK_TXT }, false);
askCase("ask.after_shamela_ok", "بعد بحث الشاملة يمرّ", { tools: [{ name: "mcp__f3c712d1__shamela_search_exact", input: { q: "x" } }], text: "ما المصدر الذي قرأتَ منه؟" }, false);
askCase("ask.decision_exempt", "سؤال عن قراره (الاعتماد، أي خيار) ليس طلب معلومة ← يمرّ", { text: "أعتمده وأحذف ملفات العمل نهائياً؟ أم أي الخيارين تفضّل لاسم الحلقة؟" }, false);
askCase("ask.statement_ok", "«لا أعرف من أين…» بلا سؤال ← يمرّ", { text: "لا أعرف من أين جاء هذا الصوت، وسأفحصه الآن." }, false);
askCase("ask.stop_hook_active_passes", "الرد الثاني (stop_hook_active) يمرّ فلا دوران", { text: ASK_TXT }, false, { stop_hook_active: true });

/* 20) JOIN SEAMS OF A REEL (tools/join_seam_check.mjs; ledger intro-reel-join-click: gta6-intro-reel 2026-11-20, built «as is», clicked at a join — a word's tail
   left at the cut point). SYNTHETIC audio only (ffmpeg aevalsrc, 1.8 s, 48 kHz, in .tmp/selftest/<run>/seam/): a «word» is a 180 Hz tone with a decaying tail
   over a −65 dB noise floor; the join is at 0.90 s. The reel-joins plumbing runs on a scratch root (fake spec + maps), the snap on the synthetic audio. */
const SJ = ["tools/join_seam_check.mjs", "tools/reel_from_episode.mjs", "tools/final_review.mjs", "tools/stream/clip_slice.mjs"], SJL = "intro-reel-join-click";
const sjMod = async () => import(pathToFileURL(path.join(ROOT, "tools", "join_seam_check.mjs")).href);
const SJW = (s, e, tau) => `(between(t,${s},${e})*0.3*sin(2*PI*180*t)+gt(t,${e})*0.3*sin(2*PI*180*t)*exp(-(t-${e})/${tau}))`, SJN = "0.002*(random(0)-0.5)";
const SJA = {
  clean: `${SJN}+${SJW(0.2, 0.55, 0.03)}+${SJW(1.25, 1.6, 0.03)}`,
  tail: `${SJN}+${SJW(0.45, 0.8, 0.08)}*if(lt(t,0.89),1,if(lt(t,0.9),(0.9-t)/0.01,0))+${SJW(1.25, 1.6, 0.03)}`,   // cut inside the tail with a 10 ms fade: no click, a tail
  click: `${SJN}+${SJW(0.2, 0.55, 0.03)}+${SJW(1.25, 1.6, 0.03)}+if(between(t,0.9,0.9005),0.5,0)`,               // the clean join with a 0.5 ms spike on it
  snap: `${SJN}+${SJW(0.3, 0.8, 0.05)}+${SJW(1.3, 1.6, 0.03)}`,                                                   // a piece ending at 0.85 s, in the tail of «أ»
  nogap: `${SJN}+${SJW(0.3, 0.8, 0.05)}+${SJW(0.86, 1.4, 0.03)}`,                                                 // the next word starts at 0.86 s: no quiet point
};
const sjMemo = new Map();
const sjWav = (name) => { if (!sjMemo.has(name)) { const f = path.join(RUN, "seam", `${name}.wav`); fs.mkdirSync(path.dirname(f), { recursive: true });
  sjMemo.set(name, runAsync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `aevalsrc='${SJA[name]}':s=48000:d=1.8`, "-ac", "1", f]).then((x) => { if (x.status !== 0 || !inScr(f)) throw new Error("ffmpeg: " + x.err.slice(-120)); return f; })); }
  return sjMemo.get(name); };
const sjRun = async (name, extra = []) => runAsync(NODE, [path.join(ROOT, "tools", "join_seam_check.mjs"), await sjWav(name), "--joins", "0.9", ...extra], { cwd: ROOT, timeout: 30000 });
add("seam.clean_ok", SJ, SJL, "وصلة في صمت بين كلمتين ← تمرّ", async () => {
  const x = await sjRun("clean");
  return expect(x.status === 0 && /✔ وصلات/.test(x.out), `رُفضت خطأً (خروج ${x.status}): ${(x.out + x.err).trim().split("\n")[0].slice(0, 140)}`);
});
add("seam.word_tail_fails", SJ, SJL, "وصلة في ذيل كلمة يخفت (بلا نقرة) ← تُرفض بالزمن «ذيل كلمة»", async () => {
  const x = await sjRun("tail");
  return expect(x.status === 1 && /✘ وصلة عند 0:00\.90[^\n]*ذيل كلمة قبل الوصلة/.test(x.out), `لم يُكشف الذيل (خروج ${x.status}): ${x.out.trim().split("\n")[0].slice(0, 140)}`);
});
add("seam.click_fails", SJ, SJL, "نقرة مدسوسة عند الوصلة ← تُرفض «نقرة عند الوصلة»", async () => {
  const x = await sjRun("click");
  return expect(x.status === 1 && /0:00\.90[^\n]*نقرة عند الوصلة/.test(x.out), `لم تُكشف النقرة (خروج ${x.status}): ${x.out.trim().split("\n")[0].slice(0, 140)}`);
});
add("seam.inside_word_fails", SJ, SJL, "الصوت هادئ لكن جدول الكلمات يضع الوصلة داخل كلمة ← تُرفض «داخل كلمة»", async () => {
  const wf = put(path.join(RUN, "seam", "words_inside.json"), [{ w: "كلمة", s: 0.8, e: 1.0 }]), x = await sjRun("clean", ["--words", wf]);
  return expect(x.status === 1 && /داخل كلمة «كلمة»/.test(x.out), `لم يُكشف (خروج ${x.status}): ${x.out.trim().split("\n")[0].slice(0, 140)}`);
});
add("seam.reel_joins_plumbing", SJ, SJL, "وصلات ريل من حلقة: وصلة الريل، ووصلة قص الحلقة داخل الجزء، ووصلة حذف بعد البناء، بأزمنتها", async () => {
  const { reelJoins } = await sjMod(), r = path.join(RUN, "seam_root");
  put(path.join(r, "data", "specs", "zzseam-reel.json"), { id: "zzseam-reel", kind: "reel", fromEpisode: { project: "zzseam", ranges: [{ from: 2, to: 5.01 }, { from: 8, to: 14 }] } });
  put(path.join(r, "public", "zzseam_map.json"), { model: "cut_model", segments: [{ a: 0, b: 10, n: 0, type: "speech" }, { a: 12, b: 20, n: 10, type: "speech" }] });
  put(path.join(r, "public", "zzseam-reel_map.json"), { model: "cut_model", segments: [{ a: 0, b: 3, n: 0 }, { a: 3, b: 5, n: 3 }, { a: 5, b: 5.5, n: 5 }, { a: 6, b: 7, n: 5.5 }] });   // a cut_block took 5.5–6
  put(path.join(r, ".tmp", "zzseam", "words_table.json"), { words: [{ w: "أ", s: 3, e: 4 }, { w: "ب", s: 12.6, e: 13.4 }] });
  const J = reelJoins("zzseam-reel", r), got = (J?.joins ?? []).map((j) => `${j.kind}@${j.t}:${j.outSrc?.toFixed(2)}→${j.inSrc?.toFixed(2)}`).join(" ");
  return expect(got === "reel@3:5.00→8.00 episode@5:10.00→12.00 block@5.5:12.50→13.00" && J.words.length === 2, `الوصلات: ${got || "لا شيء"}`);
});
const sjView = async (name) => { const { decode } = await sjMod(); return { y: decode(await sjWav(name)), sr: 48000, t0: 0 }; };
add("seam.snap_moves_join", SJ, SJL, "بناء الريل: نهاية جزء في ذيل كلمة تُزاح إلى أقرب فراغ هادئ على شبكة الإطارات، ويُقال ذلك", async () => {
  const { snapPiece } = await sjMod(), r = snapPiece(await sjView("snap"), 0, 0.85, [{ w: "أ", cs: 0.3, ce: 0.8 }, { w: "ب", cs: 1.3, ce: 1.6 }], { snapStart: false });
  return expect(!r.fail && r.E > 1.0 && r.E < 1.17 && Math.abs(r.E * 30 - Math.round(r.E * 30)) < 1e-6 && r.notes.length === 1 && /ذيل «أ»/.test(r.notes[0]), `النتيجة ${r.E?.toFixed(3)} ${r.fail ?? r.notes.join(" | ")}`);
});
add("seam.snap_refuses_no_gap", SJ, SJL, "بناء الريل: لا فراغ هادئ بين الكلمتين ← يرفض البناء ولا يزيح", async () => {
  const { snapPiece } = await sjMod(), r = snapPiece(await sjView("nogap"), 0, 0.85, [{ w: "أ", cs: 0.3, ce: 0.8 }, { w: "ب", cs: 0.86, ce: 1.4 }], { snapStart: false });
  return expect(!!r.fail && /لا فراغ هادئ بين «أ» و«ب»/.test(r.fail), `لم يُرفض: ${r.fail ?? `أُزيح إلى ${r.E?.toFixed(3)}`}`);
});
add("seam.wired_src", SJ, SJL, "المصدر: بناء الريل يضبط الوصلات قبل الاقتطاع (ولا يتخطاه --as-is) ويفحصها بعده، والفحص النهائي يفحصها على الملف", async () => {
  const rf = fs.readFileSync(path.join(ROOT, "tools", "reel_from_episode.mjs"), "utf8"), fr = fs.readFileSync(path.join(ROOT, "tools", "final_review.mjs"), "utf8");
  const iSnap = rf.indexOf("SEAMJ.snapReelRanges("), iSlice = rf.indexOf('"tools/stream/clip_slice.mjs"'), snapBlock = iSnap > 0 ? rf.slice(rf.lastIndexOf("{", iSnap), iSlice) : "";
  return expect(iSnap > 0 && iSnap < iSlice && !/as-is/.test(snapBlock) && /SEAMJ\.reelJoins\(id\)[\s\S]{0,400}gate\.push/.test(rf) && /join_seam_check\.mjs"\)\)\.finalReviewLine\(gateName, file, bumper\)/.test(fr), "حلقة الوصل اختفت من بناء الريل أو الفحص النهائي");
});

/* ── case files (2026-11-21, user: «نعم» to tests for the 19 untested guards): every tools/selftest_cases/*.mjs exports default (api) => { api.add(…) } so
   parallel writers never edit this file; api = the helpers above ── */
{ const dir = path.join(ROOT, "tools", "selftest_cases"); let fl = []; try { fl = fs.readdirSync(dir).filter((n) => n.endsWith(".mjs")).sort(); } catch { /* none yet */ }
  const api = { add, manual, expect, put, wipe, mkRoot, runAsync, hook, transcript, livePid, RUN, ROOT, NODE, SCR, path, fs };
  const { pathToFileURL } = await import("node:url"); for (const n of fl) { const mod = await import(pathToFileURL(path.join(dir, n)).href); await mod.default(api); } }
/* ── run ── */
if (argv.includes("--list")) { for (const c of C) console.log(`${c.id}\t${c.files.join(",")}\t${c.ledger ?? ""}\t${c.manual ? "يدوي" : c.todo ? "محجوز" : ""}`); process.exit(0); }
const forRel = FOR ? relOf(path.resolve(ROOT, FOR)) : null;
const selected = forRel && forRel !== "tools/guard_selftest.mjs" ? C.filter((c) => c.files.includes(forRel)) : C;
if (HOOK && !selected.some((c) => c.run)) process.exit(0);   // not a guarded tool: the hook says nothing
const t0 = Date.now(), lines = [];
let fail = 0, pass = 0, known = 0;
try {
  fs.mkdirSync(RUN, { recursive: true });
  // a crashed earlier run leaves its folder: removed when older than an hour (another run may be going on beside this one)
  try { for (const n of fs.readdirSync(SCR)) { const p = path.join(SCR, n); if (n.startsWith("run_") && p !== RUN && Date.now() - fs.statSync(p).mtimeMs > 3600e3) wipe(p); } } catch { /* none */ }
  const runnable = selected.filter((c) => c.run), results = new Map();
  for (let i = 0; i < runnable.length; i += 8) {   // 8 at a time: each case has its own scratch root, so they never share state
    await Promise.all(runnable.slice(i, i + 8).map(async (c) => { let r; try { r = await c.run(); } catch (e) { r = { ok: false, why: "انهار الاختبار: " + String(e?.message ?? e).slice(0, 160) }; } results.set(c.id, r); }));
  }
  for (const c of selected) {
    if (c.manual) { lines.push(`◌ يدوي [${c.id}] ${c.title} — ${c.manual}`); continue; }
    if (c.todo) { lines.push(`⏳ محجوز [${c.id}] ${c.title} — ${c.todo}`); continue; }
    const r = results.get(c.id);
    if (r.ok) { pass++; lines.push(`✔ [${c.id}] ${c.title}`); }
    else if (r.known && !STRICT) { known++; lines.push(`⚠ [${c.id}] ${c.title} — ${r.why}`); }
    else { fail++; lines.push(`✘ [${c.id}] ${c.title} — ${r.why}`); }
  }
} finally {
  if (dummy) try { dummy.kill(); } catch { /* gone */ }
  if (!KEEP) try { wipe(RUN); } catch { /* a file still held */ }
  // the zz_selftest_* report folders that recitation_check / name_doubt keep in the real .tmp/ (names checked by ownTmp)
  if (!KEEP) for (const n of OWN_TMP) try { fs.rmSync(path.join(ROOT, ".tmp", n), { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); } catch { /* held */ }
}
const nMan = selected.filter((c) => c.manual).length, nTodo = selected.filter((c) => c.todo).length;
const sum = `${fail ? "✘" : "✔"} اختبار الحراس${forRel ? ` (${forRel})` : ""}: ${pass} نجح، ${fail} فشل، ${known} ثغرة معروفة، ${nMan} يدوي، ${nTodo} محجوز — ${((Date.now() - t0) / 1000).toFixed(1)} ث`;
if (HOOK) {
  if (!fail) process.exit(0);
  const out = [`⛔ اختبار الحراس بعد تعديل ${forRel}: ${fail} حالة فشلت — حارسٌ بُني بعد خطأ سابق (data/error_ledger.json) انكسر. أصلحه الآن قبل أي عمل آخر، ثم: node tools/guard_selftest.mjs --for ${forRel}`, ...lines.filter((l) => l.startsWith("✘")), sum];
  if (/^tools\/hooks\//.test(forRel)) { const ra = spawnSync(NODE, ["tools/rules_audit.mjs"], { cwd: ROOT, encoding: "utf8" }); out.push(`rules_audit بعد تعديل ${forRel}:`, ...((ra.stdout || ra.stderr || "").trim().split("\n").slice(-6))); }
  console.log(out.join("\n")); process.exit(1);
}
console.log(lines.join("\n") + "\n\n" + sum);
process.exit(fail ? 1 : 0);
