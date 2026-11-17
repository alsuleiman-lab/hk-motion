// Generates .claude/skills/video-montage/MG_CATALOG.md — a compact, always-accurate catalogue of every component exported from src/MG.tsx (name, one-line purpose, exact props),
// so a montage can start from ONE short file instead of re-reading the long motion-graphics skill (user request 2026-10-22). Re-run after adding/changing a component: node tools/gen_quickref.mjs
import fs from "node:fs";

const KIT_FILES = ["src/MG.tsx", "src/PortraitKit.tsx", "src/SourceFrames.tsx", "src/PaperKit.tsx", "src/PaperTear.tsx", "src/DebateLayouts.tsx"]; // PortraitKit added 2026-10-26: the shared portrait elements live in the same catalogue
const src = KIT_FILES.map((f) => fs.readFileSync(f, "utf8").split("\r\n").join("\n")).join("\n\n");
const rows = [];
// pieces the user rejected that stay in MG.tsx only because src/KashfHadith.tsx still imports them (2026-10-24): never list them
const RETIRED = new Set(JSON.parse(fs.readFileSync("data/retired_elements.json", "utf8")).components);   // retired by the user: their code is DELETED (2026-10-28); this only filters stale lines out of old notes
const re = /export const (\w+): React\.FC<(\{)/g;
let m;
while ((m = re.exec(src))) {
  if (RETIRED.has(m[1])) continue;
  // props type with balanced braces
  const i = m.index + m[0].length - 1;
  let depth = 0, j = i;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) break; }
  }
  const props = src.slice(i + 1, j).replace(/\s+/g, " ").trim().replace(/;\s*$/, "");
  // up to two doc blocks directly above (only helper const/type/comment lines may sit between): take the longer one
  let doc = "", cursor = m.index;
  for (let k = 0; k < 2; k++) {
    const end = src.lastIndexOf("*/", cursor);
    if (end === -1) break;
    const lines = src.slice(end + 2, cursor).split("\n").filter((l) => l.trim() !== "");
    if (!lines.every((l) => /^(export )?(const|type|function|let) /.test(l.trim()) || l.trim().startsWith("//")) || lines.length > 4) break;
    const st = src.lastIndexOf("/**", end);
    if (st === -1) break;
    const d = src.slice(st + 3, end).replace(/^\s*\*\s?/gm, "").replace(/\s+/g, " ").trim();
    if (d.length > doc.length) doc = d;
    cursor = st;
  }
  doc = doc.replace(/^\d+\)\s*/, "").replace(/^[\w ]+—\s*«[^»]*»\s*\([^)]*\)\.?\s*/, "");
  rows.push({ name: m[1], doc: doc.slice(0, 260), props: props.length > 330 ? props.slice(0, 330) + " …" : props });
}
const body = rows.map((r) => `### \`${r.name}\`\n${r.doc || "(بلا وصف: مكوّن أساسي)"}\n\`props:\` ${r.props}\n`).join("\n");
const out = `> **للمونتاج لا تقرأ هذا الفهرس:** العنصر يُضاف باسمه ومتغيراته «node tools/el.mjs list|show|add» (نموذج العمل في رأس مهارة video-montage)؛ هذا فهرس لمكوّنات الكود للتراكيب القديمة المكتوبة يدوياً.

# فهرس قطع الموشن (مولَّد آلياً من src/MG.tsx وPortraitKit وSourceFrames وPaperKit وPaperTear وDebateLayouts — لا تعدّله يدوياً)\n\n> يُولَّد بـ\`node tools/gen_quickref.mjs\`. الزمن بالثواني المطلقة ما لم يُذكر؛ كل قطعة تُوضع داخل \`<Gfx>\`؛ التفاصيل والضوابط الكاملة لكل قطعة في مهارة motion-graphics وأخواتها، وهنا ما يكفي لاستدعائها دون قراءة طويلة. عدد القطع: ${rows.length}.\n\n${body}`;
fs.writeFileSync(".claude/skills/video-montage/MG_CATALOG.md", out);
console.log(`catalogued ${rows.length} components → .claude/skills/video-montage/MG_CATALOG.md (${out.length} chars)`);
