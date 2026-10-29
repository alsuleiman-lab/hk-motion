// «الحارس» — the montage router's checker (DRAFT 2026-10-23, new file; nothing else depends on it yet).
// Every stage of a montage ends with a SHORT unified report (done / not done / needs review) written here; the guard reads only these reports,
// never the long work log, and fails while any stage is missing, incomplete, or any plan item is not executed.
//
//   node tools/montage_guard.mjs stage <project> <stage> --skill <skill> [--done "a|b"] [--notdone "c|d"] [--review "e|f"] [--artifact path]... [--gate "name=ok|fail"]...
//        writes .tmp/<project>/stages/<stage>.json  (the stage report; re-running replaces it)
//   node tools/montage_guard.mjs plan-add <project> --id <id> --at <seconds|range> --what "<element>" --skill <skill>
//        adds a plan item (.tmp/<project>/plan.json): what will be built, where, and WHICH SKILL must execute it
//   node tools/montage_guard.mjs plan-done <project> <id> --evidence "<how it was verified>" [--skill <skill actually used>]
//   node tools/montage_guard.mjs check <project> [--stages cut,context,plan,assets,cover,hook,build,review]
//        exit 1 if: a required stage has no report / has notDone items / a declared artifact is missing / a gate failed;
//        a plan item is open, has no evidence, or was executed with a different skill than planned; open notes in montage_notes.
//   node tools/montage_guard.mjs start <project>   FIRST action of a montage: registers it so the hooks bind the session (no building before `ready`, no final render before `check`)
//   node tools/montage_guard.mjs ready <project>   pre-build gate: questions/cut/context/assets/cover/plan reported complete + a plan exists
//   node tools/montage_guard.mjs end <project>     after approval: unregister
//   node tools/montage_guard.mjs show <project>   → prints a one-screen summary (what the next stage needs to know)
//
// Honest limit: the `skill` in a report is SELF-DECLARED (a script cannot see which skill file was read). The independent reviewer (a fresh sub-agent that reads the plan,
// the skills' gate lists and the output) is what verifies it; the guard only makes a missing or empty declaration impossible to hide.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const cmd = argv[0], project = argv[1];
if (!cmd || !project) { console.error("usage: node tools/montage_guard.mjs start|stage|plan-add|plan-done|ready|check|show|end <project> ..."); process.exit(2); }
const dir = path.join(".tmp", project), sdir = path.join(dir, "stages"), planFile = path.join(dir, "plan.json");
const rest = argv.slice(2);
const all = (n) => rest.flatMap((x, i) => (x === "--" + n ? [rest[i + 1]] : []));
const one = (n, d = "") => all(n)[0] ?? d;
const list = (n) => all(n).flatMap((s) => String(s).split("|").map((x) => x.trim()).filter(Boolean));
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

/** the ordered stages the router (skill video-montage) walks; `skills` = the skills allowed to own that stage */
const STAGES = [
  { id: "questions", skills: ["video-montage"], label: "الأسئلة بالنقر" },
  { id: "cut", skills: ["video-cutting"], label: "التفريغ وتقطيع السكتات (+ بوابة الصوت)" },
  { id: "context", skills: ["video-montage"], label: "فهم السياق (تعليماتك داخل الفيديو)" },
  { id: "assets", skills: ["video-montage", "pixabay-search"], label: "جدول الأصول: صور كل الأسماء" },
  { id: "cover", skills: ["thumbnail-design"], label: "الغلاف" },
  { id: "plan", skills: ["video-montage", "cartoon-animation"], label: "الخطة (كل بند باسم مهارته)" },
  { id: "hook", skills: ["hook"], label: "الهوك" },
  { id: "build", skills: ["motion-graphics", "comparisons", "book-source-display", "website-source-display", "video-source-display", "source-motions", "timeline-and-numbers", "enumeration-and-flow", "collage-broll-local", "paper-montage", "video-montage", "cartoon-animation"], label: "بناء بقية الفيديو" },
  { id: "review", skills: ["video-montage"], label: "المراجعة والحارس" },
];
const stageIds = STAGES.map((s) => s.id);

if (cmd === "stage") {
  const stage = rest[0];
  if (!stageIds.includes(stage)) { console.error(`unknown stage «${stage}». stages: ${stageIds.join(", ")}`); process.exit(2); }
  const skill = one("skill");
  if (!skill) { console.error("--skill is required (which skill executed this stage)"); process.exit(2); }
  const gates = all("gate").map((g) => { const [name, v] = g.split("="); return { name, ok: v === "ok" }; });
  const rep = { stage, skill, at: new Date().toISOString(), done: list("done"), notDone: list("notdone"), needsReview: list("review"), artifacts: all("artifact"), gates };
  fs.mkdirSync(sdir, { recursive: true });
  fs.writeFileSync(path.join(sdir, `${stage}.json`), JSON.stringify(rep, null, 1));
  console.log(`✔ تقرير المرحلة «${stage}» (${skill}): أُنجز ${rep.done.length} | لم يُنجز ${rep.notDone.length} | يحتاج مراجعة ${rep.needsReview.length}`);
} else if (cmd === "plan-add") {
  const plan = readJson(planFile, []);
  const id = one("id"), skill = one("skill"), what = one("what"), at = one("at");
  if (!id || !skill || !what) { console.error("--id --what --skill are required (and --at)"); process.exit(2); }
  const i = plan.findIndex((p) => p.id === id);
  const item = { id, at, what, skill, status: "open", evidence: "", usedSkill: "" };
  if (i >= 0) plan[i] = item; else plan.push(item);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 1));
  console.log(`＋ بند ${id} [${at}] ${what} ← ${skill}`);
} else if (cmd === "plan-done") {
  const plan = readJson(planFile, []);
  const id = rest[0], p = plan.find((x) => x.id === id);
  if (!p) { console.error(`no plan item «${id}»`); process.exit(2); }
  const ev = one("evidence");
  if (!ev) { console.error("--evidence is required (how it was verified: a still, a tool result …)"); process.exit(2); }
  p.status = "done"; p.evidence = ev; p.usedSkill = one("skill", p.skill);
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 1));
  console.log(`✔ بند ${id}: ${ev}${p.usedSkill !== p.skill ? `  ⚠ نُفِّذ بمهارة ${p.usedSkill} لا ${p.skill}` : ""}`);
} else if (cmd === "start") {
  // FIRST action of every montage (user order 2026-10-25: «ملزم من الأول حتى لا يعيد العمل مرتين»): registers the project so the hooks (tools/hooks/guard.mjs)
  // bind the session from now on: no new src/ file before the pre-build stages pass (`ready`), no final render before `check` passes.
  fs.mkdirSync(".tmp", { recursive: true });
  { // several montages can be registered at once (one per session); the hooks bind each to the files/commands that name it
    let reg = readJson(path.join(".tmp", "active_montage.json"), {}); const list = reg.projects ?? (reg.project ? [reg.project] : []);
    if (!list.includes(project)) list.push(project);
    fs.writeFileSync(path.join(".tmp", "active_montage.json"), JSON.stringify({ projects: list, startedAt: new Date().toISOString() }));
  }
  console.log(`✔ بدأ المونتاج «${project}» وصار الالتزام آلياً.\nالترتيب الإلزامي (لا تبنِ قبل أن ينجح \`ready\`، ولا ترندر قبل أن ينجح \`check\`):`);
  for (const s of STAGES) console.log(`  ${s.id.padEnd(10)} ${s.label}  [${s.skills.join("/")}]`);
  console.log(`\nلكل مرحلة: node tools/montage_guard.mjs stage ${project} <المرحلة> --skill <المهارة> --done "…"\nثم قبل أول ملف بناء: node tools/montage_guard.mjs ready ${project}`);
} else if (cmd === "end") {
  // APPROVAL step (user order 2026-10-25): unregister, purge Remotion's residue on C:, then report every leftover of the project in Remotion's data
  // (composition, component, public assets, tools, render_work, .tmp, titles/dates); exit 1 while anything remains so "approved & cleaned" cannot be claimed early.
  { const reg = readJson(path.join(".tmp", "active_montage.json"), {}); const list = (reg.projects ?? (reg.project ? [reg.project] : [])).filter((p) => p !== project);
    try { if (list.length) fs.writeFileSync(path.join(".tmp", "active_montage.json"), JSON.stringify({ projects: list, startedAt: reg.startedAt })); else fs.unlinkSync(path.join(".tmp", "active_montage.json")); console.log(`✔ أُنهي تسجيل المونتاج «${project}»`); } catch { console.log("لا مونتاج مسجَّل"); } }
  const cp = (await import("node:child_process")).spawnSync("node", ["tools/clean_temp.mjs", "--approval", "--project", project], { encoding: "utf8" });
  console.log("— تنظيف المؤقتات (الاعتماد: كل ما لم يُكتب في آخر 3 دقائق، ما لم يعمل رندر) —\n" + ((cp.stdout || "") + (cp.stderr || "")).trim().split("\n").slice(-6).join("\n"));
  const key = project.toLowerCase(), left = [];
  // approval deletes the project's own files (name starts with the project key) in public/, .tmp/, .tmp/gates, render_work/ and tools/; code (src/, Root.tsx, titles) stays for the agent to remove and typecheck
  // safety: a key under 4 letters is only listed (too many shared names match), and a tool named in the rules or skills is shared, never deleted
  const walkMd = (d) => { let t = ""; try { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); t += e.isDirectory() ? walkMd(p) : e.name.endsWith(".md") ? fs.readFileSync(p, "utf8") : ""; } } catch { /* none */ } return t; };
  const docs = key.length >= 4 ? ["PREFERENCES.md", "MONTAGE_BRIEF.md", "WORKFLOW_CHECKLIST.md", "AGENTS.md", "CLAUDE.md"].map((f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } }).join("\n") + walkMd(path.join(".claude", "skills")) : "";
  let removed = 0;
  if (key.length >= 4) for (const d of ["public", ".tmp", path.join(".tmp", "gates"), "render_work", "tools"]) {
    try { for (const n of fs.readdirSync(d)) if (n.toLowerCase().startsWith(key) && !(d === "tools" && docs.includes(n)) && !/^(sheikh_gallery|broll_lib|fonts|sfx|collage)$/i.test(n)) { /* permanent libraries are never deleted */ fs.rmSync(path.join(d, n), { recursive: true, force: true }); removed++; } } catch { /* no such dir */ }
  }
  console.log(key.length >= 4 ? `✔ حُذف ${removed} من ملفات «${project}» (public/ و.tmp/ وrender_work/ وtools/)` : `⚠ اسم المشروع «${project}» أقصر من 4 أحرف: لا حذف آلي، احذف البقايا المسرودة يدوياً`);
  const has = (n) => n.toLowerCase().includes(key);
  const scan = (dirp, label, filter = () => true) => { try { for (const n of fs.readdirSync(dirp)) if (has(n) && filter(n)) left.push(`${label}/${n}`); } catch { /* no such dir */ } };
  scan("src", "src", (n) => !/Demo/i.test(n));
  scan("tools", "tools"); scan("public", "public"); scan("render_work", "render_work"); scan(".tmp", ".tmp");
  for (const f of ["src/Root.tsx", "src/compositionTitles.ts", "src/compositionDates.ts"]) {
    try { fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => { if (has(l) && !/Demo/.test(l)) left.push(`${f}:${i + 1}  ${l.trim().slice(0, 90)}`); }); } catch { /* none */ }
  }
  if (left.length) {
    console.log(`\n✘ بقايا «${project}» في Remotion/المشروع (تُحذف نهائياً عند الاعتماد، PREFERENCES القسم 2):\n  ` + left.join("\n  "));
    console.log("\nاحذفها (التركيبة من Root.tsx والعنوان بـ node tools/set_title.mjs <المعرّف> --remove، والمكوّن، وpublic/…، و.tmp/…) ثم أعد: node tools/montage_guard.mjs end " + project + " ؛ ولا تقل «اكتمل الحذف» قبل أن ينجح.");
    process.exit(1);
  }
  console.log("\n✔ لا بقايا للمشروع في Remotion، ومؤقتات C: نُظّفت.");
} else if (cmd === "ready") {
  // pre-build gate: every stage before the build must be reported complete and the plan must exist (items may still be open)
  const pre = ["questions", "cut", "context", "assets", "cover", "plan"];
  let bad = 0;
  for (const id of pre) {
    const st = STAGES.find((s) => s.id === id);
    const r = readJson(path.join(sdir, `${id}.json`), null);
    if (!r) { console.log(`✘ ${st.label}: لا تقرير`); bad++; continue; }
    const problems = [];
    if (!st.skills.includes(r.skill)) problems.push(`المهارة المعلنة «${r.skill}» ليست من ${st.skills.join("/")}`);
    if (r.notDone.length) problems.push(`لم يُنجز: ${r.notDone.join("؛ ")}`);
    for (const a of r.artifacts) if (!fs.existsSync(a)) problems.push(`ناتج مفقود: ${a}`);
    for (const g of r.gates) if (!g.ok) problems.push(`فحص فاشل: ${g.name}`);
    if (problems.length) bad++;
    console.log(`${problems.length ? "✘" : "✔"} ${st.label}${problems.length ? " — " + problems.join(" | ") : ""}`);
  }
  const plan = readJson(planFile, []);
  if (!plan.length) { console.log("✘ الخطة فارغة: سجّل بنودها بـ plan-add (كل بند باسم مهارته)"); bad++; } else console.log(`✔ الخطة: ${plan.length} بنداً مسجَّلاً`);
  console.log(bad ? `\n✘ غير جاهز للبناء: ${bad} مشكلة — أكمل المراحل أولاً.` : "\n✔ جاهز للبناء.");
  process.exit(bad ? 1 : 0);
} else if (cmd === "check" || cmd === "show") {
  const required = (one("stages") ? one("stages").split(",") : stageIds).filter((s) => stageIds.includes(s));
  let bad = 0;
  const out = [];
  for (const st of STAGES.filter((s) => required.includes(s.id))) {
    const f = path.join(sdir, `${st.id}.json`);
    const r = readJson(f, null);
    if (!r) { bad++; out.push(`✘ ${st.label}: لا تقرير`); continue; }
    const problems = [];
    if (!st.skills.includes(r.skill)) problems.push(`المهارة المعلنة «${r.skill}» ليست من ${st.skills.join("/")}`);
    if (r.notDone.length) problems.push(`لم يُنجز: ${r.notDone.join("؛ ")}`);
    for (const a of r.artifacts) if (!fs.existsSync(a)) problems.push(`ناتج مفقود: ${a}`);
    for (const g of r.gates) if (!g.ok) problems.push(`فحص فاشل: ${g.name}`);
    if (problems.length) bad++;
    out.push(`${problems.length ? "✘" : "✔"} ${st.label} [${r.skill}] أُنجز ${r.done.length}${r.needsReview.length ? ` | ⚠ يحتاج مراجعة: ${r.needsReview.join("؛ ")}` : ""}${problems.length ? "  ← " + problems.join(" ؛ ") : ""}`);
  }
  const plan = readJson(planFile, []);
  if (required.includes("plan") || required.includes("build") || required.includes("review")) {
    const open = plan.filter((p) => p.status !== "done"), wrong = plan.filter((p) => p.status === "done" && p.usedSkill && p.usedSkill !== p.skill);
    out.push(`${open.length || wrong.length ? "✘" : "✔"} بنود الخطة: ${plan.length - open.length}/${plan.length} منفَّذة${open.length ? " | مفتوحة: " + open.map((p) => `${p.id}(${p.what})`).join("، ") : ""}${wrong.length ? " | بمهارة مختلفة: " + wrong.map((p) => `${p.id}`).join("،") : ""}`);
    if (open.length || wrong.length) bad++;
    if (!plan.length && cmd === "check" && required.includes("review")) { out.push("✘ الخطة فارغة"); bad++; }
  }
  const notes = readJson(path.join(dir, "montage_notes.json"), []);
  const openNotes = notes.filter((n) => n.state !== "done");
  if (notes.length) { out.push(`${openNotes.length ? "✘" : "✔"} تعليمات المستخدم: ${notes.length - openNotes.length}/${notes.length}`); if (openNotes.length) bad++; }
  console.log(out.join("\n"));
  if (cmd === "check") { console.log(bad ? `\n✘ الحارس: ${bad} مشكلة — لا «انتهيت».` : "\n✔ الحارس: كل المراحل والبنود مكتملة."); process.exit(bad ? 1 : 0); }
} else { console.error("unknown command"); process.exit(2); }
