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
/* ── PLACEMENT FIRST + SEARCH BEFORE ASKING: shared helpers (2026-11-21, ledger placement-fix-delayed / asked-instead-of-searching; tools/guard_selftest.mjs place.* ask.*) ── */
/** Arabic folded for matching: no diacritics or tatweel, أإآ→ا، ى→ي، ة→ه */
const arNorm = (s) => String(s ?? "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
const PLACE_V = /^(و|ف)?(حرك|انقل|نقل|كبر|صغر|اكبر|اصغر|ارفع|نزل|انزل|زيح|ازح|زح)(ه|ها|هم|ي|يه|يها)?$/;
const PLACE_W = /^(و|ف)?(ب|ل|لل|ال|بال|الي|في)?(فوق|تحت|يمين|يسار|جنب|جانب|اعلي|اسفل|وسط|مكان|موضع|حجم)(ه|ها|هم)?$/;
const PLACE_EL = /^(و|ف)?(ب|ل|لل|ال|بال)?(عنصر|صور|عنوان|كتاب|نص|خريط|بطاق|شعار|شريط|غلاف|كرتون|اطار|مربع|لوح|رسم|شكل|اسم|ايه|حديث|خانه|علامه|سهم|عداد|ملصق)/;
/** a message that asks to move / size / place an element: a placement word + an element (a noun, a timestamp, or the Studio's «on screen» list) */
const isPlacement = (text, onScreen = "") => {
  const t = arNorm(text); if (!t.trim() || /حارس|هوك|guard|hook/i.test(t)) return false;   // talk ABOUT the guards is not a placement order
  const words = t.split(/[^ء-ي]+/).filter(Boolean);
  /* (2026-11-21 false alarm: «المونتاج ما يأخذ أكثر من نص ساعة… النص ساعة هذا الحد الأعلى» was read as a move order — «نص ساعة» = half an hour, «الحد الأعلى» =
     the maximum) a time «نص/نصف ساعة|دقيقة» is not a text element, «الحد الأعلى/الأدنى» is not a place, and a place word without a move verb needs its element within 4 words */
  const isEl = (k) => PLACE_EL.test(words[k]) && !(/^(ال)?نص$/.test(words[k]) && /^(ساعه|ساعات|دقيقه|دقايق|دقائق|يوم|شهر|سنه)$/.test(words[k + 1] ?? ""));
  const isW = (k) => PLACE_W.test(words[k]) && !/^(ال)?حد$/.test(words[k - 1] ?? "");
  const near = (k) => words.some((_, j) => Math.abs(j - k) <= 4 && j !== k && isEl(j));
  const timed = /[0-9٠-٩]+\s*:\s*[0-9٠-٩]{2}/.test(t), screen = !!String(onScreen ?? "").trim();
  return words.some((w, k) => (PLACE_V.test(w) && (screen || timed || words.some((_, j) => isEl(j)))) || (isW(k) && (screen || timed || near(k))));
};
const PW_F = path.join(ROOT, ".tmp", "placement_watch.json"), PLACE_GRACE = 60e3, PLACE_PROMPT_TTL = 20 * 60e3;
const pwRead = () => { try { return JSON.parse(fs.readFileSync(PW_F, "utf8")); } catch { return {}; } };
const pwWrite = (o) => { try { fs.mkdirSync(path.dirname(PW_F), { recursive: true }); fs.writeFileSync(PW_F, JSON.stringify(o)); } catch { /* never block */ } };
/** the placement messages still waiting for their move: his prompt (20 min) and the «راسلني» notes without a reply (24 h) that arrived after the last move */
const placementPending = () => {
  const st = pwRead(), now = Date.now(), moved = Number(st.movedAt) || 0, out = [];
  if (st.prompt && now - st.prompt.at < PLACE_PROMPT_TTL && st.prompt.at > moved) out.push({ at: st.prompt.at, text: st.prompt.text, src: "رسالته" });
  try {
    for (const l of fs.readFileSync(path.join(ROOT, ".tmp", "hk_inbox.jsonl"), "utf8").split(/\r?\n/)) {
      if (!l.trim()) continue; let m; try { m = JSON.parse(l); } catch { continue; }
      const at = Date.parse(m.at ?? 0);
      if (!m.reply && now - at < 24 * 3600e3 && at > moved && isPlacement(m.text, m.elements)) out.push({ at, text: String(m.text ?? ""), src: `#${m.id}` });
    }
  } catch { /* no inbox */ }
  return out;
};

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
  /* PLACEMENT FIRST (ledger placement-fix-delayed): his message asks to move / size / place an element → the clock starts now (pre below); any other message
     from him ends the prompt's watch (the «راسلني» notes keep theirs until replied) */
  try {
    const st = pwRead();
    if (p.length <= 400 && isPlacement(p)) { pwWrite({ ...st, prompt: { at: Date.now(), text: p.slice(0, 200) } }); contract.push("• 📐 طلب نقل/تحجيم عنصر (أمر المستخدم 2026-11-20: «4 دقائق مرت ولم تعدل مكان عنصر»): الفعل الأول هو النقل نفسه — node tools/el.mjs items <المشروع> ثم slot/size/nudge/set — ثم ابحث في السبب. بعد 60 ث بلا نقل يُرفض البحث في tools/ وsrc/."); }
    else if (st.prompt) pwWrite({ ...st, prompt: null });
  } catch { /* never block a prompt */ }
  emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: contract.join("\n") } });
}

if (mode === "pre") {
  const tool = input.tool_name, ti = input.tool_input ?? {};
  /* PLACEMENT FIRST (user 2026-11-20: the court picture at 0:05 sat 4 minutes in the wrong place while the agent traced code — «4 دقائق مرت ولم تعدل مكان
     عنصر، هذا فساد كبير»; memory fix-first-then-investigate). A placement message is open (a «راسلني» note without a reply, or his prompt — see the prompt
     handler): after 60 s with no move since it arrived, the MAIN session may not investigate — Read/Grep/Glob of tools/ or src/, a shell read/search of them,
     a known long tool in the foreground — until it moved the element. A move = el.mjs slot|size|nudge|move|set, the Studio «تحريك» API (/api/slot,
     /api/gallery/size), an edit of data/specs/, or a reply (hk_inbox.mjs reply); it is recorded for any session (a sub-agent's move counts), and sub-agents are
     never blocked (their work is delegated). Reading the spec, el.mjs list/items and anything else stay free. State: .tmp/placement_watch.json {movedAt, prompt}. */
  try {
    const c = norm(ti.command ?? ""), fp = rel(ti.file_path ?? ti.notebook_path ?? "");
    const MOVE = /\bel\.mjs["']?\s+(slot|size|nudge|move|set)\b|\bhk_inbox\.mjs["']?\s+reply\b|\/api\/(slot|gallery\/size)\b/;
    if (((tool === "Bash" || tool === "PowerShell") && MOVE.test(c)) || (["Write", "Edit", "NotebookEdit"].includes(tool) && /^data\/specs\/[^/]+\.json$/.test(fp))) pwWrite({ ...pwRead(), movedAt: Date.now() });
    else if (!input.agent_id) {
      const under = (p) => /^(tools|src)(\/|$)/.test(rel(p && !/^[A-Za-z]:|^\//.test(norm(p)) && input.cwd ? path.join(input.cwd, p) : p));
      let inv = null;
      if (tool === "Read" && under(ti.file_path)) inv = rel(ti.file_path);
      else if ((tool === "Grep" || tool === "Glob") && ((ti.path && under(ti.path)) || /^(\*\*\/)?(tools|src)\//.test(norm(tool === "Grep" ? ti.glob ?? "" : ti.pattern ?? "")))) inv = `${tool} ${rel(ti.path ?? "") || ti.glob || ti.pattern}`;
      else if (tool === "Bash" || tool === "PowerShell") {
        const READS = /^\s*(sudo\s+)?(grep|egrep|rg|cat|sed|head|tail|less|more|awk|wc|find|Get-Content|gc|Select-String|sls|findstr|type)(\.exe)?\s/i, SRC = /(^|[\s"'=(,:/])(tools|src)\//;
        const LONG_FG = /\bstage\.mjs\s+(prep|cut|check)\b|reel_from_episode\.mjs|gpu_render\.mjs|render_project\.sh|judder_(probe|check)\.mjs|final_review\.mjs|transcribe_\w+\.py|research\.mjs|speech_loss_audit\.mjs|asr_audit\.mjs/;
        if (!ti.run_in_background && LONG_FG.test(c)) inv = "أمر طويل";
        else inv = c.split(/&&|\|\||;|\||\r?\n/).find((s) => READS.test(s) && SRC.test(s))?.trim().slice(0, 80) ?? null;
      }
      if (inv) {
        const now = Date.now(), late = placementPending().filter((m) => now - m.at > PLACE_GRACE);
        if (late.length) deny(`انقل العنصر أولاً (el.mjs slot/size) ثم ابحث في السبب — أمر المستخدم: إصلاح المكان في دقيقة (2026-11-20: «4 دقائق مرت ولم تعدل مكان عنصر، هذا فساد كبير»).\n${late.map((m) => `  ${m.src} منذ ${Math.round((now - m.at) / 1000)} ث: «${m.text.slice(0, 120)}»`).join("\n")}\nالمرفوض الآن: ${inv}. المسموح: قراءة المواصفة data/specs/<المشروع>.json، و node tools/el.mjs items|list <المشروع>، ثم النقل نفسه: node tools/el.mjs slot <المشروع> <#المعرّف> <الخانة> --land|--port، أو size <المشروع> <#المعرّف> k=… dx=… dy=…، أو set، أو تعديل العنصر في المواصفة؛ ثم node tools/hk_inbox.mjs reply <id> "…". بعد النقل يعود البحث مفتوحاً.`);
      }
    }
  } catch { /* the placement watch never breaks a tool */ }
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
  // GUARD SELF-TEST (user 2026-11-21: «اعمل خطة سبر لكل ما يجنبك الوقوع في الأخطاء مستقبلا»): an edit of a guarded tool re-runs its cases (tools/guard_selftest.mjs, data/error_ledger.json); silent when all pass
  if (f && !inWorktree(f) && /^tools\/.+\.mjs$/.test(rel(f))) { const st = spawnSync("node", ["tools/guard_selftest.mjs", "--hook", rel(f)], { cwd: ROOT, encoding: "utf8", timeout: 20000 }); if (st.status !== 0) emit({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: ((st.stdout || "").trim() || `✘ اختبار الحراس لم يعمل بعد تعديل ${rel(f)}: ${(st.stderr || "انتهت المهلة").trim().slice(-400)}`).slice(-3000) } }); }
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
     started for 2 minutes (the board) is named, at most every 3 minutes.
     STALE NAGS (2026-11-21, gta6: «الفحص فشل 17 مرة»، «بناء الريل»، «القص وبوابة الصوت» after every tool, hours after the episode was rendered and passed
     final_review — a warning that is always wrong teaches the agent to ignore every warning). Since then:
     • a failure counts only from a RUN of a montage tool or a READ of its log/output, never from a search of the source (a grep of stage.mjs printed «✘ الحارس»),
       and never from a line that is code (console./say(/=>/grep «file:line:»);
     • the stage's own success resets it; a proof newer than the failure drops it (.tmp/gates/<p>.final.ok for all, <p>.audio.ok for the cut);
     • an approved project (data/publish_queue/<p>/ saved) or a purged one (not registered) nags nothing;
     • a failure 30 min old is stale, and «6 minutes» = 6 minutes BETWEEN its first and last failure, not since the first;
     • one nag per stage at most every TB_NAG_MIN minutes, never after every tool. */
  if ((tool === "Bash" || tool === "PowerShell") && activeProjects().length) {
    try {
      const c = String(ti.command ?? ""), r = input.tool_response ?? {};
      const outTxt = typeof r === "string" ? r : [r.stdout, r.stderr, r.output, typeof r.content === "string" ? r.content : ""].filter(Boolean).join("\n");
      const p = projectOf(c) ?? projectOf(outTxt.slice(0, 4000));
      if (!p) process.exit(0);
      // approved (the publishing package is saved = «اعتمد» was said) → this project's time box and board are over; only the Studio inbox still speaks
      if (fs.existsSync(path.join(ROOT, "data", "publish_queue", p))) { const ib = inboxOpen(); if (ib) emit({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: ib } }); process.exit(0); }
      const KEYS = [
        ["el", /✘ رُفض (الدفعة|إضافة|تعديل|حذف|نقل)|✘ plan-check|✘ لم تُطبَّق الدفعة/, /✔ طُبّقت الدفعة|✔ أُضيف|✔ عُدّل|✔ حُذف|✔ نُقل|✔ plan-check/, "عناصر الخطة"],
        ["cut", /✘ audio_gate|\[cut\] FAILED/, /\[cut\] OK|audio_gate ✔/, "القص وبوابة الصوت"],
        ["check", /\[check\] FAILED|✘ الحارس/, /\[check\] OK|✔ الحارس/, "الفحص"],
        ["prep", /\[prep\] FAILED/, /\[prep\] OK/, "التجهيز"],
        ["reel", /✘ لم يُبنَ الريل/, /✔ .*الريل/, "بناء الريل"],
      ];
      const tf = path.join(ROOT, ".tmp", p, "timebox.json"); let tb = {}; try { tb = JSON.parse(fs.readFileSync(tf, "utf8")); } catch { /* none */ }
      const now = Date.now(); let changed = false, newFail = null;
      const TB_NAG_MIN = 10, TB_STALE_MIN = 30;
      const RUNS = /(^|[\s;&|(])(node|bun)(\.exe)?["']?\s[^;&|\n"]*\b(stage|montage_guard|montage_kickoff|el|el_rules|reel_from_episode|audio_gate)\.mjs\b/i;
      const READS_LOG = /(^|[\s;&|(])(cat|tail|head|less|type|gc|Get-Content)\s[^;&|\n]*\.(log|output|out|txt)\b/i;
      const counts = RUNS.test(c) || READS_LOG.test(c);
      const isCode = (l) => /console\.|\bsay\(|=>|\.test\(|^\s*[^\s:]+:\d+[:-]|^\s*\d+[:-]\s|\.(m?js|py|tsx?|sh):\d+[:-]|^\s*"[\w-]+":\s/.test(l);   // the last = a JSON field (the time box file itself, printed)
      const outLines = counts ? outTxt.split(/\r?\n/).filter((l) => !isCode(l)) : [];
      const hit = (re) => outLines.find((l) => re.test(l));
      // first: proofs newer than the failure, and stale failures, end the entry (so an old entry never grows with a new failure hours later)
      const mt = (n) => { try { return fs.statSync(path.join(ROOT, ".tmp", "gates", n)).mtimeMs; } catch { return 0; } };
      const finalAt = mt(`${p}.final.ok`), audioAt = mt(`${p}.audio.ok`);
      for (const [k, e] of Object.entries(tb)) {
        const last = e.last ?? e.first ?? 0;
        if (finalAt > last || (k === "cut" && audioAt > last) || now - last > TB_STALE_MIN * 60e3) { delete tb[k]; changed = true; }
      }
      if (counts) for (const [k, bad, good, ar] of KEYS) {
        if (hit(good) && !hit(bad)) { if (tb[k]) { delete tb[k]; changed = true; } continue; }
        const b = hit(bad);
        if (b) { const e = tb[k] ?? { n: 0, first: now, ar }; e.n++; e.last = now; e.msg = b.trim().slice(0, 200); delete e.parked; tb[k] = e; changed = true; newFail = k; }
      }
      const msgs = [];
      for (const [k, e] of Object.entries(tb)) {
        if (e.parked) continue;
        const span = ((e.last ?? e.first) - e.first) / 60e3;
        if ((e.n >= 3 || span >= 6) && now - (e.nagAt ?? 0) > TB_NAG_MIN * 60e3) {
          msgs.push(`⛔ حدّ الوقت (أمر المستخدم 2026-11-20: «لا أقبل مونتاجاً يطول»): «${e.ar}» فشل ${e.n} مرات خلال ${Math.max(span, 0).toFixed(1)} دقيقة (آخرها: ${e.msg}). توقف عن محاولته الآن: اركنه بـ node tools/montage_kickoff.mjs park ${p} "${e.ar}: …" أو أعطه وكيلاً في الخلفية، واعمل فوراً على غيره (اللوحة: node tools/montage_kickoff.mjs board ${p}). وقل للمستخدم سطراً بما ركنتَ.${k === "el" ? " للعناصر: node tools/el_rules.mjs rules <العناصر> ثم plan-check مرة واحدة بالخطة كلها." : ""}`);
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
  /* THE WATCHER IS PART OF THE STUDIO (user 2026-11-21: «المراقب اجعله جزء لا يتجزأ من الاستوديو»): I never go idle while a Studio is up and no inbox
     watcher beats (its end is what wakes this session when he writes in «راسلني»), nor with a message of his still without a reply. Main session only. */
  if (!input.agent_id) try {
    const W = await import("../lib/inbox_watch.mjs");
    const open = W.openMessages().filter((m) => Date.now() - new Date(m.at).getTime() < 24 * 3600e3);
    if (open.length) emit({ decision: "block", reason: `رسائل من الاستوديو بلا رد (${open.length}): ${open.map((m) => `#${m.id} «${String(m.text).slice(0, 80)}»`).join(" · ")} — اعمل عليها ثم ردّ بـ node tools/hk_inbox.mjs reply <id> "…" قبل أن تتوقف.` });
    if (W.studiosAlive().length && !W.watcherAlive()) emit({ decision: "block", reason: "الاستوديو مفتوح ولا مراقب لرسائله: شغّل الآن في الخلفية (run_in_background) الأمر: cd /s/AI_Tools/Remotion_Workspace; node tools/hk_inbox.mjs wait — ثم توقف. انتهاؤه هو ما يوقظك حين يكتب في «راسلني»." });
  } catch { /* the watcher check never breaks the stop */ }
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
  /* A PUBLISH CLAIM CARRIES ITS LINK (2026-11-21, gta6: I told him a stray OK tab was «left for him to close», and earlier that Studio messages «reached me» —
     neither was true). A reply that says something was published / uploaded / scheduled, with no link in the same reply, goes back once: add the link of what
     was verified, or say plainly what is not verified. Cheap regexes only; a negated mention («لم يُرفع»، «قبل النشر») and an honest «لم أتحقق» pass;
     stop_hook_active (checked above) lets the rewritten reply through, so it never loops. */
  {
    const prose = last.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
    const CLAIM = /(^|[^؀-ۿ])(و|ف)?(نُشِ?ر[تا]?|نشرتُ?ه?ا?|تم(ّ)? (ال)?نشر|رُفِ?ع[تا]?|رفعتُ?ه?ا?|تم(ّ)? (ال)?رفع|جُدوِ?ل[تا]?|جدولتُ?ه?ا?|تم(ّ)? (ال)?جدولة|مجدول[ةا]?ً?|منشور[ةا]?ً?)(?=$|[^؀-ۿ])/g;
    const NEG = /(لم|لا|لن|ليس|ليست|غير|قبل|بعد أن|حين|عندما|إن|إذا|هل|سوف|سي)\s*(\S+\s+)?$/;
    const claimed = [...prose.matchAll(CLAIM)].some((m) => !NEG.test(prose.slice(Math.max(0, m.index - 24), m.index + m[1].length)));
    const honest = /لم أتحقق|لم يُتحقَّ?ق|غير متحقَّ?ق|لم أتأكد|غير مؤكد|لم أره بعد|بلا تحقق/.test(prose);
    if (claimed && !honest && !/https?:\/\/\S+/.test(last)) emit({ decision: "block", reason: "ذكرتَ في ردك أن شيئاً نُشر أو رُفع أو جُدول، ولا رابط في الرد نفسه. أضف رابط كل ما تحققتَ منه في وجهته (يوتيوب، درايف، أوك)، أو قل صراحة ما لم تتحقق منه بعد («رُفع ولم أتحقق من ظهوره»). لا تدّعِ ما لم تره (2026-11-21)." });
  }
  /* SEARCH BEFORE ASKING (user 2026-11-20: he was asked for the link of the «مفتي الأردن» short while the element on screen held its words and one YouTube
     search found it — «انت لازم تعرفه»، «لا تكن كسولا»; memory search-before-asking). A reply that asks him for a link / episode / name / source / date, in a
     turn (the transcript after his last message) with no search — WebSearch/WebFetch, the web-fetch agent, the browser on youtube/google, a Grep / Read /
     shell search of data/ (channel index, playlists, episode_refs), channel_index / episode_ref / research, shamela — goes back once (stop_hook_active above
     lets the second reply through). Questions about his own decisions (approve, which option, delete?) are not lookups. Ledger asked-instead-of-searching. */
  if (!input.agent_id) {
    const prose = arNorm(last.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/https?:\/\/\S+/g, " "));
    const ASK_Q = /(^|[^ء-ي])((و|ف)?ما (هو |هي )?(ال)?(رابط|مصدر|تاريخ)|هل (عندك|لديك|معك) (ال)?رابط|(اي|ما) (ال)?حلقه|ما اسم|من اين|في اي (تاريخ|سنه|يوم|حلقه)|متي (كان|قال|سجل))/;
    const ASK_IMP = /(^|[^ء-ي])(اعطني|اعطيني|ارسل|ارسلي|ابعث|ابعثلي|ضع|الصق|زودني)( لي)? (ب)?(ال)?(رابط|اسم|مصدر)/;
    const DECISION = /توافق|موافق|اعتمد|تعتمد|تختار|اختر|خيار|تفضل|تريد|احذف|نحذف|تحذف|ابدا|نبدا|اكمل|نكمل|انشر|تسمح|اسمح|باذنك|اذنك/;
    const asked = prose.split(/(?<=[.!؟?\n])/).find((s) => ASK_IMP.test(s) || (!DECISION.test(s) && /[؟?]/.test(s) && ASK_Q.test(s)));   // «أعطني الرابط» is never a decision
    if (asked) {
      let searched = false;
      try {
        const L = fs.readFileSync(input.transcript_path, "utf8").trim().split("\n"), rows = [];
        for (let i = L.length - 1; i >= 0; i--) {
          let o; try { o = JSON.parse(L[i]); } catch { continue; }
          const ct = o.message?.content;
          if (o.type === "user" && !o.isMeta && !(Array.isArray(ct) && ct.some((b) => b?.type === "tool_result"))) break;   // his last message: the turn starts after it
          if (o.type === "assistant" && Array.isArray(ct)) rows.push(...ct.filter((b) => b?.type === "tool_use"));
        }
        const DATA = /(^|\/)data\/(channel|playlists|episode_refs|youtube|specs)\b|(^|\/)data(\/|$)/;
        searched = rows.some((b) => {
          const n = String(b.name ?? ""), x = b.input ?? {}, s = JSON.stringify(x), cmd = norm(x.command ?? "");
          return /^(WebSearch|WebFetch)$/.test(n) || /shamela/i.test(n)
            || ((n === "Agent" || n === "Task") && (x.subagent_type === "web-fetch" || /youtu|google|يوتيوب|ابحث|بحث|search/i.test(s)))
            || (/claude-in-chrome|Claude_Browser/.test(n) && /youtu|google/i.test(s))
            || ((n === "Grep" || n === "Glob" || n === "Read") && DATA.test(rel(x.path ?? x.file_path ?? "")))
            || ((n === "Bash" || n === "PowerShell") && (/\b(grep|egrep|rg|Select-String|sls|findstr|jq|find|cat|Get-Content)\b[^\n]*(^|[\s"'=(,:/])data\//i.test(cmd) || /channel_index\.mjs|episode_ref\.mjs|research\.mjs|ytsearch|yt-dlp[^\n]*search/i.test(cmd)));
        });
      } catch { searched = true; }   // transcript unreadable: never block on a guess
      if (!searched) emit({ decision: "block", reason: `ابحث أولاً بما هو موجود (نص العنصر، فهرس القناة، يوتيوب) ثم اسأل إن لم تجد — أمر المستخدم 2026-11-20: «لا تكن كسولا». سألتَه: «${asked.trim().slice(0, 120)}» ولا بحث في هذه الدورة. ابحث: نص العنصر في المواصفة، node tools/channel_index.mjs find "<الموضوع>"، data/playlists.json وdata/episode_refs/، بحث يوتيوب (WebSearch أو المتصفح)، أو الشاملة؛ ثم أعطه ما وجدت (بالرابط)، واسأل فقط إن لم تجد شيئاً مع ذكر ما بحثت فيه.` });
    }
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
