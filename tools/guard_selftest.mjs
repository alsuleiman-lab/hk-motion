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
add("overlap.missing_spec", OG, "two-elements-one-place", "بوابة التراكب على مشروع بلا مواصفة لا تنجح بصمت", async () => {
  const { overlapFailures } = await import(pathToFileURL(path.join(ROOT, "tools", "lib", "overlap_gate.mjs")).href);
  const bad = overlapFailures("zz_selftest_no_such_spec");
  return bad.length ? { ok: true } : { ok: false, known: true, why: "ثغرة معروفة: الأداتان تنهاران بلا سطر ✘ فتُرجع البوابة «لا تراكب» — تُصلح في tools/lib/overlap_gate.mjs (انهيار أداة = فشل)" };
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
manual("mg.shared_original_run", MG, "reel-end-trashed-episode-original", "تشغيل «إنهاء المونتاج» على أصل مشترك", "لا تشغيل تجريبي ولا دالة نقية: الأمر نفسه مسحٌ (السلة، approve_purge، project clean). يلزم تصدير دالة originalUsers(project) أو خيار --dry-run في montage_guard ثم حالة هنا.");

// 12) gpu_render refuses a FULL render of a montage without a bumper (user 2026-11-20) — no dry-run: read as source
const GR = "tools/gpu_render.mjs";
add("gpu.no_bumper_src", GR, "bumper-glued-by-render", "المصدر: رندر كامل لمونتاج بلا فاصل مرفوض قبل أي إطار", async () => {
  const s = fs.readFileSync(path.join(ROOT, GR), "utf8"), i = s.search(/if \(BSPEC && !BSPEC\.bumper[^\n]*\n[^\n]*\n\s*console\.error\([^\n]*has no bumper[^\n]*process\.exit\(1\)/), j = s.indexOf("const FRAME_LIST");
  return expect(i > 0 && j > i, "شرط الفاصل اختفى أو تأخر بعد بدء الإطارات");
});
manual("gpu.no_bumper_run", GR, "bumper-glued-by-render", "تشغيل الرندر على مونتاج بلا فاصل", "الرفض يقع بعد قفل الرندر وتجهيز الحزمة (دقائق)، ولا وضع فحص فقط؛ يلزم خيار --check-only يفحص الغلاف والفاصل والتراكب قبل القفل ثم حالة هنا.");

/* 13) TODO — guards landing today from the other agents (main session: replace each todo() with add() once the file is committed):
   - timebox.stale_reset   guard.mjs post: scratch root + .tmp/active_montage.json + .tmp/zzst/timebox.json 40 min old (or older than .tmp/gates/zzst.final.ok)
                           → a Bash post with a «✘ الحارس» line from a grep of the source must NOT count or nag; a run of stage.mjs check must.
   - publish.claim         guard.mjs stop: a reply claiming «نُشر / وصلت الرسائل» with no link / proof → block.
   - sections.gate         tools/prepublish_gates.mjs: a scratch package without sections / sections line → ✘.
   - package.gate          tools/yt_package.mjs --check (or prepublish_gates): no description, no tags, or a playlist other than the event's → ✘.
   - verse.audit           tools/span_recheck.py + recitation_check.mjs / verse_audit.mjs: a misrecited verse span (scratch words) → ✘.
   - names.doubt           tools/span_recheck.py + name_doubt.mjs: a country name heard once by the small model only («لبنان») → asked, not drawn. */
todo("timebox.stale_reset", G, "stale-nags", "تنبيه حدّ الوقت لا يتكرر بعد حلّ العائق أو الاعتماد", "تعديل guard.mjs قيد الالتزام من وكيل آخر");
todo("publish.claim", G, "false-progress-claims", "ادعاء النشر أو وصول الرسائل بلا دليل ← يُمنع", "الفحص لم يُكتب بعد في guard.mjs");
todo("sections.gate", "tools/prepublish_gates.mjs", "sections-skipped", "حلقة بلا أقسام أو بلا سطر الأقسام ← مرفوضة قبل الاعتماد", "prepublish_gates.mjs لم يوصل بعد بالفحص النهائي");
todo("package.gate", ["tools/yt_package.mjs", "tools/prepublish_gates.mjs"], "youtube-package-incomplete", "حزمة يوتيوب بلا وصف أو وسوم أو بقائمة خاطئة ← مرفوضة", "خيار --check في yt_package.mjs لم يُكتب بعد");
todo("verse.audit", ["tools/verse_audit.mjs", "tools/span_recheck.py"], "misrecited-verse-not-caught", "آية قُرئت خطأً تُكشف قبل النشر", "recitation_check.mjs قيد البناء");
todo("names.doubt", ["tools/names_scan.mjs", "tools/span_recheck.py"], "lebanon-transcription-error", "اسم بلد من خطأ تفريغ لا يُرسم دون تحقق", "name_doubt.mjs قيد البناء");

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
