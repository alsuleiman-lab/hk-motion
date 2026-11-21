// Mechanical enforcement of the workspace rules for Claude Code sessions (user order 2026-10-25: «ملزمة بشكل صارم، لا يستطيعون الحيد عنها»).
// Text rules alone can be reasoned around; these hooks cannot. Wired in .claude/settings.json:
//   node tools/hooks/guard.mjs prompt   (UserPromptSubmit)  inject the binding contract + the mandatory reading list on every video/montage prompt
//   node tools/hooks/guard.mjs pre      (PreToolUse)        ask the user before any rule/skill file is edited; deny renders aimed at C:
//   node tools/hooks/guard.mjs post     (PostToolUse)       after a rule/skill edit run rules_audit.mjs and hand the result back
//   node tools/hooks/guard.mjs stop     (Stop)              refuse «✅ انتهيتُ من المونتاج» without a fresh tools/final_review.mjs proof
// Limits (honest): applies to Claude Code only (Codex / Antigravity read AGENTS.md but run no hooks); a hook cannot judge visual quality, so the
// visual items stay with the final review checklist. To switch it off the user renames .claude/settings.json.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const mode = process.argv[2];
let input = {};
try { input = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { /* no stdin */ }
const norm = (p) => String(p ?? "").replace(/\\/g, "/");
const rel = (p) => { const n = norm(p), r = norm(ROOT); return n.toLowerCase().startsWith(r.toLowerCase() + "/") ? n.slice(r.length + 1) : n; };
const emit = (obj) => { process.stdout.write(JSON.stringify(obj)); process.exit(0); };
/* HEARTBEAT (2026-11-20, gta6 analysis): the montage session was opened in E:\apps\New remotion, so NOT ONE of these hooks ran for hours (Claude Code reads
   .claude/settings.json of the session folder only). Every run leaves a stamp; tools/montage_kickoff.mjs refuses to call the session «guarded» without a fresh one. */
try { fs.mkdirSync(path.join(ROOT, ".tmp"), { recursive: true }); fs.writeFileSync(path.join(ROOT, ".tmp", "hooks_alive.json"), JSON.stringify({ at: Date.now(), mode, cwd: input.cwd ?? process.cwd(), session: input.session_id ?? "", agent: input.agent_id ?? null })); } catch { /* never block */ }

/** files that ARE the rules: any change needs the user's yes (the agent cannot rewrite its own rules silently) */
const RULE_FILES = [
  /^القواعد_العامة\.md$/, /^شجرة_العمليات\.md$/, /^CLAUDE\.md$/, /^AGENTS\.md$/, /^STYLE_REFERENCES\.md$/,
  /^\.claude\/skills\/(?!remotion-|lessons-and-streams|gbro-)[^/]+\/[^/]+\.md$/,
  /^rules_registry\/(?!proposals\/)[^/]+\.md$/,
  /^\.claude\/settings(\.local)?\.json$/, /^tools\/hooks\//,
];
// sessions run in git worktrees (.claude/worktrees/<name>/): strip that prefix so their copies count as rule files too
const WT = /^\.claude\/worktrees\/[^/]+\//;
const inner = (p) => rel(p).replace(WT, "");
const inWorktree = (p) => WT.test(rel(p));
const isRuleFile = (p) => RULE_FILES.some((re) => re.test(inner(p)));
/** rules are READ only from the main folder (user order 2026-10-27: «لازم تكون ثابتة على الجهاز»): a worktree copy can be older than master */
const READ_PINNED = (p) => isRuleFile(p) || /^(القواعد_العامة|شجرة_العمليات)\.md$/.test(inner(p));
const mainPath = (p) => norm(ROOT) + "/" + inner(p);
const deny = (reason) => emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } });
const ask = (reason) => emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } });
/* THE STUDIO «راسلني» MESSAGES ARE NEVER MISSED (user 2026-11-21, gta6: four notes sat unread in the inbox until he sent a screenshot — «ليش ما اشتغلت عليها؟»).
   Every message of the last 24 h without a reply is handed to the agent on every prompt and after every tool, until it is answered (tools/hk_inbox.mjs reply). */
const inboxOpen = () => {
  try {
    const f = path.join(ROOT, ".tmp", "hk_inbox.jsonl"); if (!fs.existsSync(f)) return "";
    const open = fs.readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((m) => m && !m.reply && Date.now() - Date.parse(m.at ?? 0) < 24 * 3600e3);
    return open.length ? `📩 رسائل من الاستوديو بلا رد (${open.length}) — اعمل عليها الآن ثم ردّ بـ node tools/hk_inbox.mjs reply <id> "…":\n` + open.map((m) => `  #${m.id} ${m.comp ?? ""} إطار ${m.frame ?? "?"}: «${String(m.text ?? "").slice(0, 160)}»`).join("\n") : "";
  } catch { return ""; }
};
/** the montage registered by `montage_guard.mjs start` (the first action of every montage); null = none registered */
const activeProjects = () => { try { const r = JSON.parse(fs.readFileSync(path.join(ROOT, ".tmp", "active_montage.json"), "utf8")); return r.projects ?? (r.project ? [r.project] : []); } catch { return []; } };
/** the registered project a file path / command line names (case-insensitive); null = it names none, so it is not that montage's business */
const projectOf = (text) => activeProjects().find((p) => String(text).toLowerCase().includes(p.toLowerCase())) ?? null;
const guard = (...args) => { const r = spawnSync("node", ["tools/montage_guard.mjs", ...args], { cwd: ROOT, encoding: "utf8" }); return { ok: r.status === 0, out: ((r.stdout || "") + (r.stderr || "")).trim() }; };

if (mode === "prompt") {
  const p = String(input.prompt ?? "");
  // SLEEP MODE (user 2026-11-12: «لم تفِ بعهدك… نمت واستيقظت والكمبيوتر شغال»): a message saying he goes to sleep sets .tmp/user_sleeping;
  // any other message from him means he is awake and clears it. The Stop handler below hibernates the PC when I stop while he sleeps.
  try {
    const flag = path.join(ROOT, ".tmp", "user_sleeping");
    if (/(سأنام|سانام|راح انام|راح أنام|رايح انام|رايح أنام|بروح انام|بروح أنام|ذاهب للنوم|ذاهب لأنام|أنا نائم|انا نائم|سوف أنام|سوف انام|نايم الحين|قبل ما انام|وانا نايم|وأنا نائم|سأخلد للنوم|good night|going to sleep)/i.test(p)) { fs.mkdirSync(path.dirname(flag), { recursive: true }); fs.writeFileSync(flag, new Date().toISOString()); }
    else if (fs.existsSync(flag)) fs.rmSync(flag, { force: true });
  } catch { /* never block a prompt */ }
  const contract = [
    "عقد الالتزام (القواعد_العامة.md — ملزم، لا استثناء إلا بنص المستخدم في رسالته الحالية):",
    "• القواعد ← `القواعد_العامة.md` ثم `شجرة_العمليات.md` (كل مرحلة بمهارتها، وتفصيل كل مهارة في `references/detail.md` بجانبها)، والتنفيذ ← المهارات بدءاً بـ`router`، والفحص ← مهارة `checking`. لا تحِد عن بند منها ولا تؤوّله لصالح الاختصار، ولا تقل «تمّ» إلا لمهمة أُنجزت كاملة بدليل.",
    "• إن تعارض طلب مع قاعدة: توقف واذكر البند ثم اسأل بالنقر؛ لا تتجاوز بصمت ولا تخترع استثناءً.",
    "• لا «✅ انتهيتُ» قبل `tools/final_review.mjs` (الهوك يمنع الإعلان دونه) وقبل قائمة المراجعة في مهارة `checking` بنداً بنداً.",
  ];
  const R = norm(ROOT);
  contract.push(`• القواعد والمهارات تُقرأ من المجلد الرئيسي فقط: \`${R}/القواعد_العامة.md\` و\`${R}/شجرة_العمليات.md\` و\`${R}/.claude/skills/…\`، لا من نسخة الجلسة في \`.claude/worktrees/\` (قد تكون أقدم)، وأدوات \`tools/\` تُشغَّل من \`${R}\`.`);
  if (/مونتاج|فيديو|رندر|ريندر|غلاف|هوك|موشن|تعليق صامت|render|montage|hook/i.test(p)) {
    // 2026-11-17 (user order): the tree replaced the brief — general rules → operations tree → router → each stage's skill when it is reached
    contract.push("• هذا عمل فيديو: اقرأ (لكل فيديو من جديد، ولو قرأتها لفيديو سابق في الجلسة) `القواعد_العامة.md` ← `شجرة_العمليات.md` ← مهارة `router` ← مهارة كل مرحلة حين تصلها (ومعها `video-montage/critical-rules.md` و`workflow-plan.md`، و`montage-orders` لتعليمات «مونتاج» المنطوقة). الأسئلة الأولى بالنقر أول فعل (مهارة `first-questions`)، ومعها `tools/stage.mjs prep` في الخلفية.");
    const b = spawnSync("node", ["tools/brief_check.mjs"], { cwd: ROOT, encoding: "utf8" });
    if (b.status !== 0) contract.push("• تنبيه: " + (b.stdout || "").trim());
    // PARALLEL WORK IS MANDATORY (user 2026-11-20, gta6: «تأخرت، يجب تشغيل أكثر من مهمة معاً… لماذا لا تقرأ كل التعليمات؟»)
    contract.push("• التوازي إلزامي (القواعد §3، أمر المستخدم 2026-11-20): المونتاج يبدأ بأمر واحد `node tools/montage_kickoff.mjs <المشروع> \"<الفيديو>\"` (التجهيز ثم معاً: اقتراح القص، وطابور البحث المبكر، وموجز الغلاف) — و`stage.mjs prep` المباشر مرفوض. ثم في الوقت نفسه: أسئلة البداية، وقراءة القائمة كاملة (ومعها مهارات first-questions وvideo-cutting وgallery-placement وchecking وdelivery-links)، ووكلاء البحث والغلاف والعناصر الخاصة في الخلفية حين تقول اللوحة «جاهز». كل أمر طويل بـrun_in_background (الأمر الطويل في المقدمة مرفوض). عائق يفشل 3 مرات أو يأخذ 6 دقائق ← `montage_kickoff.mjs park` ثم غيره. العناصر: `node tools/el_rules.mjs rules <العناصر>` قبل كتابة الخطة، والدفعة لا تُطبَّق قبل plan-check.");
  }
  // THE BOARD of every montage of the last 12 hours (tools/montage_kickoff.mjs): what runs, what is ready and NOT started, what is parked — on every prompt
  for (const ap of activeProjects()) {
    try {
      const bf = path.join(ROOT, ".tmp", ap, "board.json");
      if (!fs.existsSync(bf) || Date.now() - fs.statSync(bf).mtimeMs > 12 * 3600e3) continue;
      const r = spawnSync("node", ["tools/montage_kickoff.mjs", "board", ap, "--brief"], { cwd: ROOT, encoding: "utf8", timeout: 4000 });
      if ((r.stdout || "").trim()) contract.push("• " + r.stdout.trim());
    } catch { /* never block a prompt */ }
  }
  { const ib = inboxOpen(); if (ib) contract.push(ib); }
  emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: contract.join("\n") } });
}

if (mode === "pre") {
  const tool = input.tool_name, ti = input.tool_input ?? {};
  if (["Read", "Grep", "Glob"].includes(tool)) {
    const raw = ti.file_path ?? ti.path ?? "";
    const f = raw && !/^[A-Za-z]:|^\//.test(norm(raw)) && input.cwd ? path.join(input.cwd, raw) : raw;
    if (f && inWorktree(f) && READ_PINNED(f)) deny(`القواعد تُقرأ من المجلد الرئيسي فقط (نسخة الجلسة قد تكون أقدم من master): اقرأ ${mainPath(f)}`);
  }
  if (["Write", "Edit", "NotebookEdit"].includes(tool)) {
    const f = ti.file_path ?? ti.notebook_path;
    if (f && isRuleFile(f)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: `تعديل ملف قواعد/مهارة (${rel(f)}): لا يُنفَّذ إلا بتوجيه صريح من المستخدم، ويُحلّ الجديد محل القديم في الدورة نفسها وينتقل القديم للسجل (بروتوكول الإحلال). وافق فقط إن كان هذا ما طلبه.` } });
    }
  }
  // START GATE (user order 2026-10-25: binding from the first step so nothing is built twice): once a montage is registered, no NEW file under src/ may be
  // created until every pre-build stage is reported complete and a plan exists (montage_guard ready)
  // EDIT, DON'T REWRITE (user order 2026-10-25: the reel rewrote its 19 KB component twice): an existing code file > 6 KB under src/ or tools/ is changed with Edit
  if (tool === "Write" && ti.file_path && /^(src|tools)\//.test(rel(ti.file_path))) {
    let size = 0; try { size = fs.statSync(ti.file_path).size; } catch { /* new file */ }
    if (size > 6 * 1024) deny(`الملف ${rel(ti.file_path)} موجود (${Math.round(size / 1024)} KB): عدّله بـEdit في المواضع المتغيّرة، ولا تُعِد كتابته كاملاً.`);
  }
  // SPEC GATE (2026-11-16): the build is now the spec, not a src/ file — the montage's spec (spec_draft or a new data/specs/<p>.json) waits for the same
  // pre-build stages (questions, cut, context with the user's orders, assets, cover, plan): the task list is walked in order and cannot be skipped.
  {
    const c = String(ti.command ?? "");
    const sm = c.match(/spec_draft\.mjs\s+["']?([A-Za-z0-9_-]+)/) ?? (tool === "Write" && !fs.existsSync(ti.file_path ?? "") ? rel(ti.file_path ?? "").match(/^data\/specs\/([A-Za-z0-9_-]+)\.json$/) : null);
    if (sm && activeProjects().some((x) => x.toLowerCase() === sm[1].toLowerCase()) && !/--out\s/.test(c)) {
      const g = guard("ready", sm[1]);
      if (!g.ok) deny(`المونتاج «${sm[1]}»: لا مواصفة قبل أن تكتمل مراحل ما قبل البناء في قائمة المهام (الأسئلة، القص، تعليمات المستخدم، الأصول، الغلاف، الخطة). شغّل: node tools/montage_guard.mjs ready ${sm[1]}\n${g.out.split("\n").slice(-12).join("\n")}`);
    }
  }
  if (tool === "Write") {
    const f = ti.file_path, p = projectOf(rel(f ?? ""));
    if (p && f && /^src\/[^/]+\.tsx?$/.test(rel(f)) && !fs.existsSync(f)) {
      const g = guard("ready", p);
      if (!g.ok) deny(`المونتاج «${p}» مسجَّل ولا يجوز بدء البناء (ملف جديد في src/) قبل أن تنجح مراحل ما قبل البناء. شغّل أولاً: node tools/montage_guard.mjs ready ${p}\n${g.out.split("\n").slice(-12).join("\n")}`);
    }
  }
  // READ GATE (user order 2026-10-28: «لازم يقرأ في كل فيديو»): every video re-reads the rules, even the second video of the same session.
  // Cutting (stage cut), the spec (data/specs/<p>.json) and the checks (stage check) need Reads of the three files AFTER this video's first command.
  {
    const c = String(ti.command ?? "");
    const m = c.match(/stage\.mjs\s+(?:cut|check)\s+["']?([A-Za-z0-9_-]+)/) ?? (tool === "Write" ? rel(ti.file_path ?? "").match(/^data\/specs\/([A-Za-z0-9_-]+)\.json$/) : null);
    if (m && input.transcript_path) {
      // (2026-11-16, user: «تأكد أنه سيقرأ كل القواعد وينفذها ويمشي على قائمة مهام ويسجل تعليماتي») + the router and the orders/task-list skill
      const p = m[1], MUST = { "القواعد_العامة.md": /القواعد_العامة\.md$/, "شجرة_العمليات.md": /شجرة_العمليات\.md$/, "critical-rules.md": /video-montage\/critical-rules\.md$/, "workflow-plan.md": /video-montage\/workflow-plan\.md$/, "router/SKILL.md": /skills\/router\/SKILL\.md$/, "montage-orders/SKILL.md": /skills\/montage-orders\/SKILL\.md$/ };
      try {
        // (2026-11-17) rules read in the same user turn BEFORE the first command naming the project count: the video starts at that user message
        let start = -1, lastUser = -1; const readAt = {};
        fs.readFileSync(input.transcript_path, "utf8").split("\n").forEach((line, i) => {
          if (start < 0 && line.includes('"type":"user"') && !line.includes('"tool_result"')) lastUser = i;
          if (!line.includes('"tool_use"')) return;
          let j; try { j = JSON.parse(line); } catch { return; }
          for (const b of j.message?.content ?? []) {
            if (b.type !== "tool_use") continue;
            const s = JSON.stringify(b.input ?? {});
            if (start < 0 && s.includes(p)) start = Math.max(0, lastUser);
            const cmd = norm(b.input?.command ?? "");
            // a whole-file read: the Read tool, or cat / Get-Content aimed at the file itself (a grep over it is not a read)
            for (const [k, re] of Object.entries(MUST)) if ((b.name === "Read" && re.test(norm(b.input?.file_path ?? ""))) || new RegExp(`(^|[;&|]\\s*)(cat|Get-Content)\\s+["']?[^\\s"';&|]*${k.replace(".", "\\.")}["']?\\s*($|[;&])`).test(cmd)) readAt[k] = i;
          }
        });
        const missing = Object.keys(MUST).filter((k) => !(readAt[k] > start));
        if (missing.length) deny(`فيديو «${p}»: اقرأ القواعد لهذا الفيديو قبل القص والبناء والفحص، ولو قرأتها لفيديو سابق في الجلسة نفسها (أمر المستخدم 2026-10-28). لم تُقرأ بعد بدء هذا الفيديو: ${missing.join("، ")} — اقرأها بأداة Read من ${norm(ROOT)} ثم أعد الأمر.`);
      } catch { /* transcript unreadable: do not block */ }
    }
  }
  if (tool === "Bash" || tool === "PowerShell") {
    const c = String(ti.command ?? "");
    /* DESTRUCTIVE TOOLS = MAIN SESSION ONLY, AFTER THE USER'S YES (user 2026-11-21: a sub-agent ran `montage_guard.mjs end` — the approval purge — so the reel files
       were deleted and the original recording trashed). A sub-agent's call carries input.agent_id (Claude Code hook input; seen 2026-11-21 in .tmp/hooks_alive.json,
       which this hook writes on every run). The main session has no agent_id (under --agent it gets agent_type only), and it asks the user in chat first.
       Refused for a sub-agent: montage_guard start/end, approve_purge, trash_file, cleanup_leftovers, and any delete (shell rm/del/Remove-Item…, or code rmSync/
       os.remove/shutil.rmtree/Recycle Bin…) that names public/, .tmp/<project>/, data/specs/ or C:\Users\mshms\Videos\جاهز (or runs after a cd into one). */
    if (input.agent_id) {
      const n = norm(c);
      const TOOL = /\b(node|bun|deno|bash|sh)(\.exe)?["']?\s[^;&|\n]*(montage_guard\.mjs["']?\s+["']?(start|end)\b|approve_purge\.mjs|trash_file\.mjs|cleanup_leftovers\.mjs)/i;
      const PROT = /(^|[\s"'=(,:\/])(public|data\/specs)(\/|["'\s;)]|$)|(^|[\s"'=(,:\/])\.tmp(\/|["'\s;)]|$)|Videos\/جاهز/i;
      const SHELL_DEL = /(^|[\s;&|({`])(rm|rmdir|unlink|shred|del|erase|rd|ri|Remove-Item|Clear-Content)(\.exe)?(\s|$)|\bgit\s+(rm|clean)\b|\s-delete\b|-exec\s+rm\b|\bxargs\s+(-\S+\s+)*rm\b/i;
      const CODE_DEL = /\b(rmSync|rmdirSync|unlinkSync|rm|unlink|rmdir)\s*\(|\bos\.(remove|unlink|rmdir|removedirs)\b|\bshutil\.rmtree\b|\bsend2trash\b|\.Delete\s*\(|::Delete(File|Directory)?\b|SendToRecycleBin|\bRemove-Item\b/i;
      let hit = TOOL.test(n) || (CODE_DEL.test(n) && PROT.test(n));
      let inProt = PROT.test(norm(input.cwd ?? "") + "/");
      for (const seg of n.split(/&&|\|\||;|\r?\n/)) {
        if (/^\s*(cd|pushd|Set-Location|sl)\s/i.test(seg)) inProt = PROT.test(seg);
        if (SHELL_DEL.test(seg) && (inProt || PROT.test(seg))) hit = true;
      }
      if (hit) deny("أداة حذف — للجلسة الرئيسية فقط بعد إذن المستخدم (أمر المستخدم 2026-11-21: وكيل شغّل «اعتماد المونتاج» فحذف ملفات الريل ورمى التسجيل الأصلي). لا يشغّل الوكيل: بدء المونتاج أو إنهاءه، ولا مسح الاعتماد، ولا الرمي إلى السلة، ولا حذف شيء في public/ أو .tmp/<المشروع>/ أو data/specs/ أو مجلد «جاهز». اذكر ما تريد حذفه في تقريرك، والجلسة الرئيسية تسأل المستخدم.");
    }
    /* KICKOFF (user 2026-11-20, gta6): a montage starts with tools/montage_kickoff.mjs, which runs the prep AND every independent lane together in the
       background; a bare `stage.mjs prep` is how the serial montage began */
    if (/\bstage\.mjs\s+prep\b/.test(c) && !/montage_kickoff/.test(c) && !/--help/.test(c)) {
      const m = c.match(/stage\.mjs\s+prep\s+["']?([\w-]+)["']?\s+("[^"]+"|'[^']+'|\S+)?(.*)$/);
      deny(`التجهيز وحده مرفوض (أمر المستخدم 2026-11-20: «يجب تشغيل أكثر من مهمة معاً»): ابدأ المونتاج بأمر الإطلاق، فيعمل التجهيز وبعده معاً اقتراح القص وطابور البحث المبكر وموجز الغلاف، ولوحة بما يجري:\n  node tools/montage_kickoff.mjs ${m?.[1] ?? "<المشروع>"} ${m?.[2] ?? "\"<الفيديو>\""}${m?.[3]?.trim() ? " -- " + m[3].trim().replace(/\s*2>&1.*$|\s*\|.*$/, "") : ""}\n(خيارات التجهيز بعد --؛ وأعد التجهيز بـ --redo)`);
    }
    /* NO LONG COMMAND IN THE FOREGROUND OF A MONTAGE (user 2026-11-20, gta6: a 4-min transcription, a 4-min reel build and the cut in bg.sh all ran in the
       foreground while nothing else moved). A command of a registered montage that runs a known long tool must go with run_in_background. */
    const LONG = /\bstage\.mjs\s+(prep|cut|check)\b|reel_from_episode\.mjs|gpu_render\.mjs|render_project\.sh|judder_(probe|check)\.mjs|final_review\.mjs|transcribe_\w+\.py|WhisperModel|faster_whisper|words_table\.py|diarize\.py|cut_blocks?\.mjs|smooth_dups\.py|cut_build_gpu\.py|hybrid_\w+\.mjs|comfy_still\.mjs|bumper_at\.mjs|research\.mjs|speech_loss_audit\.mjs|asr_audit\.mjs|full_tr\.py/;
    // a sub-agent (input.agent_id) already runs beside the main session: its foreground is the main session's background, so it is not refused
    if (LONG.test(c) && !ti.run_in_background && !input.agent_id && !/--help|--dry-run/.test(c) && projectOf(c)) {
      deny(`أمر طويل في المقدمة أثناء مونتاج «${projectOf(c)}» (أمر المستخدم 2026-11-20: «يجب تشغيل أكثر من مهمة معاً»): أعده بـrun_in_background (ويُبلَّغ بانتهائه)، واعمل في الأثناء على ما في اللوحة: node tools/montage_kickoff.mjs board ${projectOf(c)}`);
    }
    // rule 6 (AGENTS.md): work on S:; exports go only to C:\Users\mshms\Videos\جاهز\<title>.mp4 (user order 2026-10-26) — any other C: target is refused
    const cOther = c.replace(/[Cc]:[\\/]+Users[\\/]+mshms[\\/]+Videos[\\/]+جاهز[\\/]+[^\\/"']+\.mp4/g, "");
    if (/\b(node|npx|bash|sh)\b[^;&|]*(render_final|render_chunked|render_clip|hybrid_full)\.(mjs|sh)|\bnpx\s+remotion\s+render\b/i.test(c) && /(^|[\s"'=])[Cc]:[\\/]/.test(cOther)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع: الرندر على القرص C إلا إلى C:\\Users\\mshms\\Videos\\جاهز\\<العنوان>.mp4 حصراً (أمر المستخدم 2026-10-26). العمل على S فقط (AGENTS.md البند 6)." } });
    }
    // rule: nothing deletes the whole public/ or src/ tree (code imports from them)
    if (/(rm\s+-[a-zA-Z]*r[a-zA-Z]*f?|rm\s+-rf|Remove-Item[^|;]*-Recurse)[^|;&]*\b(public|src)\b[\\/]?\s*(["']|$|;|&)/.test(c)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع حذف public/ أو src/ كاملاً: الكود يستورد منهما (AGENTS.md البند 7)." } });
    }
    // STRICT GPU RENDER (user 2026-11-09, R-RENDER-GPU.1 2026-11-12): the old render path is refused unless the user's message asked for it (command carries
    // LEGACY_RENDER_USER_OK=<his words>). render_clip / render_trial / render_silent now run tools/gpu_render.mjs, so they are allowed.
    if (/\b(node|npx|bash|sh)\b[^;&|]*(render_final|render_chunked)\.(mjs|sh)|\bnpx\s+remotion\s+render\b/i.test(c) && !/--help|\bstills?\b/i.test(c) && !/LEGACY_RENDER_USER_OK=\S/.test(c)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع: الرندر بالمحرّك الجديد على كرت الشاشة حصراً (R-RENDER-GPU.1، أمر 2026-11-12): node tools/gpu_render.mjs --comp <المعرّف> --out <ملف> (مقطع: --start A --end B --no-bumper؛ المشروع كله: bash tools/gpu/render_project.sh). فيديو ما زال يفكّه Chromium يُنقل إلى <VSlot>؛ والهجين hybrid_any احتياط بإذن المستخدم؛ والقديم فقط إن طلبه المستخدم بنصه (LEGACY_RENDER_USER_OK=\"<كلامه>\")." } });
    }
    // RENDER GATE: a final render (not a preview/still) needs a registered montage whose stages, plan items, user notes and audio gate all pass — re-rendering is the costly redo
    if (/\b(node|npx|bash|sh)\b[^;&|]*(render_final|render_chunked|hybrid_full)\.(mjs|sh)|\bnpx\s+remotion\s+render\b/i.test(c) && !/--help|\bstills?\b/i.test(c)) {
      const p = projectOf(c);
      if (!p) ask("رندر نهائي بلا مونتاج مسجَّل: المونتاج يبدأ بـ node tools/montage_guard.mjs start <المشروع> فيصير الرندر مشروطاً آلياً بنجاح الحارس والبوابات. وافق فقط إن كان هذا رندراً قديماً أو خارج مسار المونتاج الجديد.");
      // TITLE GATE (user order 2026-10-25): every composition named in the render command must already have its Arabic title in Remotion (src/compositionTitles.ts)
      try {
        const q = String.fromCharCode(34);
        const ids = [...fs.readFileSync(path.join(ROOT, "src", "Root.tsx"), "utf8").matchAll(new RegExp("<Composition[^>]*id=" + q + "([A-Za-z0-9_-]+)" + q, "g"))].map((m) => m[1]);
        const titles = fs.readFileSync(path.join(ROOT, "src", "compositionTitles.ts"), "utf8");
        const missing = ids.filter((id) => c.includes(id) && !titles.includes(q + id + q + ":"));
        if (missing.length) deny("الرندر النهائي مرفوض: التركيبة " + missing.join("، ") + " بلا عنوان عربي في Remotion. نفّذ: node tools/set_title.mjs <المعرّف> " + q + "العنوان العربي" + q + " (إلزامي، مهارة remotion-render).");
      } catch { /* Root.tsx unreadable: do not block */ }
      const g = guard("check", p, "--stages", "questions,cut,context,assets,cover,plan,hook,build");
      const audio = fs.existsSync(path.join(ROOT, ".tmp", "gates", p + ".audio.ok"));
      // JUDDER PROBE GATE (user order 2026-10-27): a 10-second render from the middle must pass tools/judder_probe.mjs (newer than every src/*.tsx edit) before any full render
      let probeOk = false;
      try {
        const pj = JSON.parse(fs.readFileSync(path.join(ROOT, ".tmp", "gates", p + ".probe.ok"), "utf8"));
        const newest = Math.max(0, ...fs.readdirSync(path.join(ROOT, "src")).filter((f) => /.tsx?$/.test(f)).map((f) => fs.statSync(path.join(ROOT, "src", f)).mtimeMs));
        probeOk = Number(pj.at) >= newest;
      } catch { /* no probe yet */ }
      if (!probeOk) deny("الرندر الكامل مرفوض للمونتاج «" + p + "»: لا فحص ارتجاف حديث. شغّل أولاً: node tools/judder_probe.mjs <التركيبة> --src <القص المنعَّم> --offset <إطار> --name " + p + " (يرندر 10 ثوانٍ من وسط الفيديو ويقارنها بالمصدر؛ يجب أن يكون أحدث من آخر تعديل في src/).");
      if (!g.ok || !audio) deny(`الرندر النهائي مرفوض للمونتاج «${p}» حتى يكتمل: ${!audio ? "بوابة الصوت (audio_gate) لم تنجح؛ " : ""}${g.ok ? "" : "الحارس:\n" + g.out.split("\n").slice(-14).join("\n")}\nأكمل ما سبق ثم أعد الأمر (لا إعادة رندر لإصلاح ما كان يُكتشف قبله).`);
    }
  }
  process.exit(0);
}

if (mode === "post") {
  const ti = input.tool_input ?? {};
  const f = ti.file_path ?? ti.notebook_path;
  if (f && isRuleFile(f)) {
    const r = spawnSync("node", ["tools/rules_audit.mjs"], { cwd: ROOT, encoding: "utf8" });
    const out = (r.stdout || r.stderr || "").trim();
    const failed = /(^|\n)FAIL/.test(out) || r.status !== 0;
    emit({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: `rules_audit بعد تعديل ${rel(f)} — ${failed ? "فيه إخفاق: أصلحه الآن قبل أي عمل آخر" : "نجح"}:\n${out.split("\n").slice(-12).join("\n")}${inWorktree(f) ? "\n• عُدِّل في نسخة الجلسة: احفظه وادمجه في master في الدورة نفسها، فالجلسات الأخرى تقرأ المجلد الرئيسي." : ""}` } });
  }
  const tool = input.tool_name;
  /* AN AGENT STARTED = its lane on the board is running (tools/montage_kickoff.mjs), so «ready and not started» never nags about work that is under way */
  if ((tool === "Agent" || tool === "Task") && activeProjects().length) {
    try {
      const txt = `${ti.description ?? ""} ${ti.prompt ?? ""}`.slice(0, 4000);
      const boards = activeProjects().filter((ap) => fs.existsSync(path.join(ROOT, ".tmp", ap, "board.json")));
      const ap = boards.find((x) => txt.toLowerCase().includes(x.toLowerCase())) ?? (boards.length === 1 ? boards[0] : null);
      const lane = /غلاف|cover|thumbnail/i.test(txt) ? "cover" : /بحث|تحقق|شاملة|research|verif|hadith|shamela/i.test(txt) ? "research" : /عنصر|عناصر|element|effect|mosaic|build/i.test(txt) ? "elements" : null;
      if (ap && lane) spawnSync("node", ["tools/montage_kickoff.mjs", "lane", ap, lane, "start"], { cwd: ROOT, encoding: "utf8", timeout: 4000 });
    } catch { /* never block */ }
    process.exit(0);
  }
  /* TIME BOX (user 2026-11-20, gta6: 15 minutes on one click at a cut join, alone, while nothing else ran; six refused element batches in a row).
     A blocker = a gate failure of a montage tool. 3 failures, or 6 minutes since its first failure without a success, → a loud order to PARK it and go on with the
     rest; it repeats (at most every 90 s) on every command until it is solved or parked (node tools/montage_kickoff.mjs park). And a lane that is ready and not
     started for 2 minutes (the board) is named, at most every 3 minutes. */
  if ((tool === "Bash" || tool === "PowerShell") && activeProjects().length) {
    try {
      const c = String(ti.command ?? ""), r = input.tool_response ?? {};
      const outTxt = typeof r === "string" ? r : [r.stdout, r.stderr, r.output, typeof r.content === "string" ? r.content : ""].filter(Boolean).join("\n");
      const p = projectOf(c) ?? projectOf(outTxt.slice(0, 4000));
      if (!p) process.exit(0);
      const KEYS = [
        ["el", /✘ رُفض (الدفعة|إضافة|تعديل|حذف|نقل)|✘ plan-check|✘ لم تُطبَّق الدفعة/, /✔ طُبّقت الدفعة|✔ أُضيف|✔ عُدّل|✔ حُذف|✔ نُقل|✔ plan-check/, "عناصر الخطة"],
        ["cut", /✘ audio_gate|\[cut\] FAILED/, /\[cut\] OK|audio_gate ✔/, "القص وبوابة الصوت"],
        ["check", /\[check\] FAILED|✘ الحارس/, /\[check\] OK|✔ الحارس/, "الفحص"],
        ["prep", /\[prep\] FAILED/, /\[prep\] OK/, "التجهيز"],
        ["reel", /✘ لم يُبنَ الريل/, /✔ .*الريل/, "بناء الريل"],
      ];
      const tf = path.join(ROOT, ".tmp", p, "timebox.json"); let tb = {}; try { tb = JSON.parse(fs.readFileSync(tf, "utf8")); } catch { /* none */ }
      const now = Date.now(); let changed = false, newFail = null;
      for (const [k, bad, good, ar] of KEYS) {
        if (good.test(outTxt) && !bad.test(outTxt)) { if (tb[k]) { delete tb[k]; changed = true; } continue; }
        if (bad.test(outTxt)) { const e = tb[k] ?? { n: 0, first: now, ar }; e.n++; e.last = now; e.msg = (outTxt.split(/\r?\n/).find((l) => bad.test(l)) ?? "").trim().slice(0, 200); delete e.parked; tb[k] = e; changed = true; newFail = k; }
      }
      const msgs = [];
      for (const [k, e] of Object.entries(tb)) {
        if (e.parked) continue;
        const age = (now - e.first) / 60e3;
        if ((e.n >= 3 || age >= 6) && (k === newFail || now - (e.nagAt ?? 0) > 90e3)) {
          msgs.push(`⛔ حدّ الوقت (أمر المستخدم 2026-11-20: «لا أقبل مونتاجاً يطول»): «${e.ar}» فشل ${e.n} مرات خلال ${age.toFixed(1)} دقيقة (آخرها: ${e.msg}). توقف عن محاولته الآن: اركنه بـ node tools/montage_kickoff.mjs park ${p} "${e.ar}: …" أو أعطه وكيلاً في الخلفية، واعمل فوراً على غيره (اللوحة: node tools/montage_kickoff.mjs board ${p}). وقل للمستخدم سطراً بما ركنتَ.${k === "el" ? " للعناصر: node tools/el_rules.mjs rules <العناصر> ثم plan-check مرة واحدة بالخطة كلها." : ""}`);
          e.nagAt = now; changed = true;
        }
      }
      if (changed) { fs.mkdirSync(path.dirname(tf), { recursive: true }); fs.writeFileSync(tf, JSON.stringify(tb, null, 1)); }
      // the board: a lane ready and not started (at most every 3 minutes)
      const bf = path.join(ROOT, ".tmp", p, "board.json"), nf = path.join(ROOT, ".tmp", p, "nudge_at");
      let last = 0; try { last = Number(fs.readFileSync(nf, "utf8")) || 0; } catch { /* first */ }
      if (fs.existsSync(bf) && now - last > 3 * 60e3) {
        fs.writeFileSync(nf, String(now));
        const n = spawnSync("node", ["tools/montage_kickoff.mjs", "board", p, "--nudge"], { cwd: ROOT, encoding: "utf8", timeout: 4000 });
        if ((n.stdout || "").trim()) msgs.push(n.stdout.trim());
      }
      { const ib = inboxOpen(); if (ib) msgs.push(ib); }
      if (msgs.length) emit({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: msgs.join("\n") } });
    } catch { /* the time box never breaks a command */ }
  }
  process.exit(0);
}

if (mode === "stop") {
  // SLEEP MODE: he is asleep and I am stopping (done, a question, a blocker). A render worker running → the hibernate watcher (armed here if missing) sleeps the PC
  // after the queue; .tmp/keep_awake (an ISO time, written by me for a background job I will come back to) holds it until then; otherwise → hibernate in 90 s.
  try {
    const flag = path.join(ROOT, ".tmp", "user_sleeping");
    if (fs.existsSync(flag)) {
      const pidF = path.join(ROOT, "data", "render_queue", "worker.pid"); let rendering = false;
      try { const pid = Number(fs.readFileSync(pidF, "utf8")); process.kill(pid, 0); rendering = true; } catch { /* no worker */ }
      let keep = false; try { keep = new Date(fs.readFileSync(path.join(ROOT, ".tmp", "keep_awake"), "utf8").trim()).getTime() > Date.now(); } catch { /* none */ }
      const log = (m) => fs.appendFileSync(path.join(ROOT, ".tmp", "sleep_hook.log"), `${new Date().toISOString()} ${m}
`);
      if (rendering) {
        const armed = path.join(ROOT, ".tmp", "hibernate_watcher.pid"); let alive = false; try { process.kill(Number(fs.readFileSync(armed, "utf8")), 0); alive = true; } catch { /* not running */ }
        if (!alive) { const ch = spawn("bash", [path.join(ROOT, "tools", "hibernate_after_queue.sh")], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true }); fs.writeFileSync(armed, String(ch.pid)); ch.unref(); log("rendering: hibernate watcher armed"); }
      } else if (!keep) {
        log("asleep and I stopped with no render: hibernating in 90 s");
        spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", "Start-Sleep 90; shutdown.exe /h"], { detached: true, stdio: "ignore", windowsHide: true }).unref();
      } else log("asleep, keep_awake until " + fs.readFileSync(path.join(ROOT, ".tmp", "keep_awake"), "utf8").trim());
    }
  } catch { /* the stop hook never fails the turn */ }
  // AUTO CLEANUP: at the end of every reply, in the background, at most every 15 min (at once when S: has < 50 GB free). clean_temp skips anything touched in the last 30 min.
  try {
    const stamp = path.join(ROOT, ".tmp", "last_clean.txt");
    let last = 0; try { last = Number(fs.readFileSync(stamp, "utf8")) || 0; } catch { /* first run */ }
    let lowDisk = false; try { const s = fs.statfsSync("S:/"); lowDisk = s.bavail * s.bsize < 50 * 1024 ** 3; } catch { /* unknown */ }
    if (lowDisk || Date.now() - last > 15 * 60e3) {
      fs.mkdirSync(path.dirname(stamp), { recursive: true });
      fs.writeFileSync(stamp, String(Date.now()));
      spawn("node", ["tools/clean_temp.mjs"], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true }).unref();
    }
  } catch { /* never block the reply */ }
  if (input.stop_hook_active) process.exit(0);          // never loop
  let last = "";
  try {
    const lines = fs.readFileSync(input.transcript_path, "utf8").trim().split("\n");
    for (let i = lines.length - 1; i >= 0 && !last; i--) {
      const o = JSON.parse(lines[i]);
      if (o.type === "assistant") last = (o.message?.content ?? []).filter((x) => x.type === "text").map((x) => x.text).join("\n");
    }
  } catch { process.exit(0); }
  // ARABIC ONLY (user 2026-11-13: «لا افهم غير العربي» — an English reply slipped out after a context summary): a reply whose prose is mostly
  // Latin letters is sent back to be rewritten in Arabic; code blocks, inline code, links and paths do not count
  {
    const prose = last.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]").replace(/https?:\/\/\S+/g, " ").replace(/[A-Za-z]:[\\/]\S*/g, " ").replace(/\S+\.(mp4|json|mjs|tsx?|md|py|sh|jpg|png)\b/g, " ");
    const lat = (prose.match(/[A-Za-z]/g) || []).length, ar = (prose.match(/[؀-ۿ]/g) || []).length;
    if (lat >= 40 && lat > ar) emit({ decision: "block", reason: "ردّك الأخير مكتوب بغير العربية. المستخدم لا يفهم إلا العربية (أمره 2026-11-11 و2026-11-13): أعد كتابة الرد نفسه كاملاً بالعربية الواضحة، بلا أسماء أوامر ولا إنجليزي." });
  }
  if (/^\s*(✅\s*)?انتهيتُ من المونتاج/.test(last)) {
    const dir = path.join(ROOT, ".tmp", "gates");
    const now = Date.now(), DAY = 24 * 3600e3;
    let fresh = false;
    const aps = activeProjects();   // with registered montages, one of THEM needs its own fresh proof
    try { fresh = fs.readdirSync(dir).filter((n) => n.endsWith(".final.ok") && (!aps.length || aps.some((p) => n === p + ".final.ok"))).some((n) => now - fs.statSync(path.join(dir, n)).mtimeMs < DAY); } catch { /* none */ }
    if (!fresh) {
      emit({ decision: "block", reason: "أعلنتَ «انتهيتُ من المونتاج» دون دليل `tools/final_review.mjs --name <المشروع>` ناجح خلال آخر 24 ساعة (`.tmp/gates/<المشروع>.final.ok`). شغّله على الناتج النهائي (يتطلب نجاح audio_gate) ثم أعد الإعلان بعد مراجعة قائمة الفحص بنداً بنداً. لا تتجاوز هذا الشرط." });
    }
  }
  process.exit(0);
}
process.exit(0);
