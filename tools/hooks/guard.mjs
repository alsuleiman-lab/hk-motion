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

/** files that ARE the rules: any change needs the user's yes (the agent cannot rewrite its own rules silently) */
const RULE_FILES = [
  /^PREFERENCES\.md$/, /^WORKFLOW_CHECKLIST\.md$/, /^CLAUDE\.md$/, /^AGENTS\.md$/, /^STYLE_REFERENCES\.md$/,
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
const READ_PINNED = (p) => isRuleFile(p) || /^MONTAGE_BRIEF\.md$/.test(inner(p));
const mainPath = (p) => norm(ROOT) + "/" + inner(p);
const deny = (reason) => emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } });
const ask = (reason) => emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } });
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
    "عقد الالتزام (PREFERENCES.md القسم 0 — ملزم، لا استثناء إلا بنص المستخدم في رسالته الحالية):",
    "• القواعد ← `PREFERENCES.md`، والتنفيذ ← المهارات، والفحص ← `WORKFLOW_CHECKLIST.md`. لا تحِد عن بند منها ولا تؤوّله لصالح الاختصار.",
    "• إن تعارض طلب مع قاعدة: توقف واذكر البند ثم اسأل بالنقر؛ لا تتجاوز بصمت ولا تخترع استثناءً.",
    "• لا «✅ انتهيتُ» قبل `tools/final_review.mjs` (الهوك يمنع الإعلان دونه) وقبل المراجعة النهائية بنداً بنداً.",
  ];
  const R = norm(ROOT);
  contract.push(`• القواعد والمهارات تُقرأ من المجلد الرئيسي فقط: \`${R}/MONTAGE_BRIEF.md\` و\`${R}/PREFERENCES.md\` و\`${R}/.claude/skills/…\`، لا من نسخة الجلسة في \`.claude/worktrees/\` (قد تكون أقدم)، وأدوات \`tools/\` تُشغَّل من \`${R}\`.`);
  if (/مونتاج|فيديو|رندر|ريندر|غلاف|هوك|موشن|تعليق صامت|render|montage|hook/i.test(p)) {
    // 2026-10-25 (user order): the brief replaces reading PREFERENCES.md in full (that read + the checklist + 4 skill files were ~60k tokens carried through every call)
    contract.push("• هذا عمل فيديو: اقرأ (لكل فيديو من جديد، ولو قرأتها لفيديو سابق في الجلسة) `MONTAGE_BRIEF.md` (ملزم مثل الأصل، بدل قراءة PREFERENCES.md كاملاً؛ ابحث في الأصل بـGrep عند الحاجة) ← مهارة المرحلة (video-montage/critical-rules.md وworkflow-plan.md لكلمة «مونتاج»). قائمة الفحص في المراجعة النهائية. الأسئلة الثلاثة بالنقر أول فعل (العنوان، B-roll، الصيغ)، ومعها `tools/stage.mjs prep` في الخلفية.");
    const b = spawnSync("node", ["tools/brief_check.mjs"], { cwd: ROOT, encoding: "utf8" });
    if (b.status !== 0) contract.push("• تنبيه: " + (b.stdout || "").trim() + " — حتى يُحدَّث الملخّص اقرأ الأقسام المتغيّرة من الأصل.");
  }
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
      const p = m[1], MUST = { "MONTAGE_BRIEF.md": /MONTAGE_BRIEF\.md$/, "critical-rules.md": /video-montage\/critical-rules\.md$/, "workflow-plan.md": /video-montage\/workflow-plan\.md$/ };
      try {
        let start = -1; const readAt = {};
        fs.readFileSync(input.transcript_path, "utf8").split("\n").forEach((line, i) => {
          if (!line.includes('"tool_use"')) return;
          let j; try { j = JSON.parse(line); } catch { return; }
          for (const b of j.message?.content ?? []) {
            if (b.type !== "tool_use") continue;
            const s = JSON.stringify(b.input ?? {});
            if (start < 0 && s.includes(p)) start = i;
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
    // rule 6 (AGENTS.md): work on S:; exports go only to C:\Users\mshms\Videos\جاهز\<title>.mp4 (user order 2026-10-26) — any other C: target is refused
    const cOther = c.replace(/[Cc]:[\\/]+Users[\\/]+mshms[\\/]+Videos[\\/]+جاهز[\\/]+[^\\/"']+\.mp4/g, "");
    if (/\b(node|npx|bash|sh)\b[^;&|]*(render_final|render_chunked|render_clip|hybrid_full)\.(mjs|sh)|\bnpx\s+remotion\s+render\b/i.test(c) && /(^|[\s"'=])[Cc]:[\\/]/.test(cOther)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع: الرندر على القرص C إلا إلى C:\\Users\\mshms\\Videos\\جاهز\\<العنوان>.mp4 حصراً (أمر المستخدم 2026-10-26). العمل على S فقط (AGENTS.md البند 6)." } });
    }
    // rule: nothing deletes the whole public/ or src/ tree (code imports from them)
    if (/(rm\s+-[a-zA-Z]*r[a-zA-Z]*f?|rm\s+-rf|Remove-Item[^|;]*-Recurse)[^|;&]*\b(public|src)\b[\\/]?\s*(["']|$|;|&)/.test(c)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع حذف public/ أو src/ كاملاً: الكود يستورد منهما (AGENTS.md البند 7)." } });
    }
    // STRICT HYBRID (user 2026-11-09): the old render path is refused unless the user's message asked for it (command carries LEGACY_RENDER_USER_OK=<his words>)
    if (/(node|npx|bash|sh)[^;&|]*(render_final|render_chunked|render_clip).(mjs|sh)|npxs+remotions+render/i.test(c) && !/--help|stills?/i.test(c) && !/LEGACY_RENDER_USER_OK=S/.test(c)) {
      emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "ممنوع: الرندر النهائي بالمسار المختلط حصراً (R-RENDER-SPEED.5، أمر 2026-11-09): node tools/hybrid_any.mjs --comp <المعرّف> --out <ملف>. تركيبة لا يرسمها الهجين تُنقل إلى HybridHost/VSlot؛ والقديم فقط إن طلبه المستخدم بنصه (LEGACY_RENDER_USER_OK=\"<كلامه>\")." } });
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
        if (missing.length) deny("الرندر النهائي مرفوض: التركيبة " + missing.join("، ") + " بلا عنوان عربي في Remotion. نفّذ: node tools/set_title.mjs <المعرّف> " + q + "العنوان العربي" + q + " (إلزامي، PREFERENCES القسم 6).");
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
