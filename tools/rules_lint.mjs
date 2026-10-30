// Stale-rule lint (user 2026-10-29: «وجود تعليمات قديمة أحياناً تأخذ وقت للتفكير وأحياناً يعمل عليها بدل الجديدة»).
//   node tools/rules_lint.mjs        exit 1 when the rules or skills still carry a replaced instruction
// Fails on: (1) a tools/<file> named in the rules that does not exist; (2) a cancelled element (data/retired_elements.json) named in a skill, or in the rules outside a
// «cancelled» line; (3) a replaced wording (list below: the new rule's date + what replaced it); (4) a time-limited rule whose «حتى YYYY-MM-DD» has passed.
// A new replacement: add its old wording to REPLACED in the same turn as the rule change.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RULES = ["PREFERENCES.md", "MONTAGE_BRIEF.md", "WORKFLOW_CHECKLIST.md", "AGENTS.md", "CLAUDE.md"];
const OWN_SKILLS = ["video-montage", "motion-graphics", "thumbnail-design", "silent-reaction", "paper-montage", "collage-selection", "collage-broll-local", "hook", "source-motions", "timeline-and-numbers", "enumeration-and-flow", "video-source-display", "website-source-display", "book-source-display", "comparisons", "video-cutting", "investigative-osint-reel", "advertising-video", "pixabay-search"];
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".md") ? [path.join(d, e.name)] : [])) : []);
const skillFiles = OWN_SKILLS.flatMap((s) => walk(path.join(".claude", "skills", s)));
const rel = (f) => f.split(path.sep).join("/");

/** replaced wordings: [regex, what replaced it] */
const REPLACED = [
  [/(الطولي|للطولي|بالطولي) القصير/, "«ريلز» (الصيغ الثلاث، 2026-10-29)"],
  [/الربع الثالث|الخمس الرابع طولاً|1152–1536|1340–1536/, "خانة الكتابة من الشبكة data/layout_grids.json (2026-10-30)"],
  [/ساكن > ?12 ?ث|فراغ > ?15 ?ث|على 12 ثانية/, "لا 5 ثوانٍ بلا عنصر، والدقيقة الأولى بلا فراغ (2026-10-29)"],
  [/العصارة/, "«ريلز» (الصيغ الثلاث، 2026-10-29)"],
  [/المجلد يُسأل/, "لا سؤال عن مجلد (2026-10-26)"],
  [/أربعة أسئلة|«طولي؟»/, "ثلاثة أسئلة: العنوان، B-roll، الصيغ (2026-10-29)"],
  [/splits\[\]\.iso/, "العزل السريع: matte + behind (2026-10-29)"],
  [/هوية لونية واحدة|الهوية الواحدة/, "هوية واحدة الشكل وخمسة أنماط لونية (2026-10-29)"],
  [/تجربة الـ ?10 أيام/, "الدروس أولوية دائمة (2026-10-29)"],
  [/لا عزل للخلفية إطلاقاً/, "العزل السريع (2026-10-29)", ["hook/SKILL.md"]],
];
const ret = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "retired_elements.json"), "utf8"));
const out = [];
const today = new Date().toISOString().slice(0, 10);
for (const f of [...RULES, ...skillFiles]) {
  if (!fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/), r = rel(f);
  lines.forEach((l, i) => {
    const at = `${r}:${i + 1}`;
    for (const m of l.matchAll(/tools\/([A-Za-z_0-9]+\.(?:mjs|py|cjs|sh))/g)) if (!fs.existsSync(path.join(ROOT, "tools", m[1]))) out.push(`${at}  أداة غير موجودة: tools/${m[1]}`);
    const cancelledLine = /أُلغي|ألغي|ملغا|ملغى|retired|حُذف/.test(l);
    if (!cancelledLine) for (const n of ret.components) if (new RegExp("`" + n + "`").test(l)) out.push(`${at}  عنصر ملغى: ${n}`);
    for (const [re, now, except = []] of REPLACED) if (re.test(l) && !except.some((e) => r.endsWith(e)) && !/لا تُستعمل «الطولي القصير»|لا «طولي قصير»|ولا «العصارة»|ولا «عصارة»/.test(l)) out.push(`${at}  صياغة قديمة «${l.match(re)[0]}» ← ${now}`);
    for (const m of l.matchAll(/حتى (20\d\d-\d\d-\d\d)/g)) if (m[1] < today) out.push(`${at}  قاعدة مؤقتة انتهت ${m[1]}`);
  });
}
if (out.length) { console.log(`✘ rules_lint: ${out.length}\n` + out.join("\n")); process.exit(1); }
console.log(`✔ rules_lint: no stale instruction in ${RULES.length} rule files and ${skillFiles.length} skill files`);
