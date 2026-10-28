const fs = require("fs");
const rd = (f) => fs.readFileSync(f, "utf8");
const sf = ".claude/skills/video-montage/SKILL.md";
let s = rd(sf);
if (!s.includes("قبل أي ريندر أكّد النسخ المطلوبة الآن")) {
  const anchor = "- المسار العادي لا يستغل الكرت";
  if (!s.includes(anchor)) throw new Error("anchor");
  s = s.replace(anchor, rd(".tmp/doc_skill_03.md") + anchor);
  fs.writeFileSync(sf, s);
}
const mf = ".claude/skills/motion-graphics/SKILL.md";
let m = rd(mf);
if (!m.includes("## 6) مكتبة الأخبار والأرقام")) fs.writeFileSync(mf, m.trimEnd() + "\n" + rd(".tmp/doc_mg.md"));
// checklist: one line per new lesson
let c = rd("WORKFLOW_CHECKLIST.md");
if (!c.includes("أكّد النسخ المطلوبة الآن")) {
  c = c.trimEnd() + "\n- [ ] **قبل الريندر أكّد النسخ المطلوبة الآن؛ ولا تُعلن ضياع ملف قبل البحث في كل الأقراص (C/G/E/S) وسلة المحذوفات.** أوقف الريندر بالـPID وأوقف حلقة إعادة المحاولة معه، وقِس الصوت (القمة 0 dB = استمع أو خفّض).\n";
  fs.writeFileSync("WORKFLOW_CHECKLIST.md", c);
}
console.log(rd(sf).includes("أكّد النسخ المطلوبة الآن"), rd(mf).includes("## 6) مكتبة"), rd("WORKFLOW_CHECKLIST.md").includes("أكّد النسخ"));
