// inserts the lessons of the Europe-protests video (2026-10-18) into the skill, the checklist and AGENTS.md (idempotent)
const fs = require("fs");
const rd = (f) => fs.readFileSync(f, "utf8");
const T = ".tmp/";
const sf = ".claude/skills/video-montage/SKILL.md";
let s = rd(sf);
if (!s.includes("## 0.1 قواعد أُضيفت 2026-10-18")) {
  s = s.replace("## 1. قبل البدء", rd(T + "doc_skill_01.md") + "## 1. قبل البدء");
  s = s.replace("- تفريغ بمستوى الكلمة `tools/transcribe_words.py` (Whisper للتفريغ فقط؛ القرار قراري).",
    "- تفريغ بمستوى الكلمة `tools/transcribe_words.py` (Whisper للتفريغ فقط؛ القرار قراري). **ثم أعد التفريغ لكل مقطع VAD على حدة** (`transcribe_vad_segments.py`): تفريغ الملف الطويل يُسقط دقائق من الكلام ويؤلّف هلوسات («ترجمة نانسي قنقر»، «اشتركوا في القناة») وهي تُحذف.\n- **القص من عدة تسجيلات** (تسجيل أصلي + تسجيل تصحيح): `tools/eu_cut.mjs` يقبل مصدرين؛ وتوقيتات الكلمات من `<ver>_words.json` (`tw(سطر، كلمة)`) فلا يظهر عنصر قبل نطقه.");
  s = s.replace("## ملفات مرجعية", rd(T + "doc_skill_02.md") + "## ملفات مرجعية");
  s = s.replace("`PREFERENCES.md` (الأسباب والسجل)", "`src/EuKit.tsx` (StatRow, Sources, Correction, BClip contain, Banner, Flag, Pic) · `src/EuPortrait.tsx` / `src/EuLandscape.tsx` (مثال كامل) · `PREFERENCES.md` (الأسباب والسجل)");
  fs.writeFileSync(sf, s);
}
let c = rd("WORKFLOW_CHECKLIST.md");
if (!c.includes("قواعد صارمة من فيديو «اشتعال أوروبي»")) fs.writeFileSync("WORKFLOW_CHECKLIST.md", c.trimEnd() + "\n" + rd(T + "doc_checklist.md"));
let a = rd("AGENTS.md");
if (!a.includes("لا قصّ لمقاطعه")) {
  const marker = "- الحركة: لا بطاقة/لوحة فيها الشيخ ثابتة";
  if (!a.includes(marker)) throw new Error("AGENTS marker");
  fs.writeFileSync("AGENTS.md", a.replace(marker, rd(T + "doc_agents.md") + marker));
}
console.log("skill", rd(sf).includes("0.1 قواعد"), rd(sf).includes("5.1 دروس"), "checklist", rd("WORKFLOW_CHECKLIST.md").includes("اشتعال أوروبي"), "agents", rd("AGENTS.md").includes("لا قصّ لمقاطعه"));
