# Remotion Workspace

**قبل أن تكتب «✅ انتهيتُ» مرّ على «المراجعة النهائية الإلزامية» في أول `WORKFLOW_CHECKLIST.md` بنداً بنداً.**

**عقد الالتزام:** القواعد ومهاراتها وقوائم الفحص ملزمة؛ نصّه في `AGENTS.md` أدناه وتفصيله في `PREFERENCES.md` القسم 0.

**قبل أي عمل على فيديو — كل فيديو، ولو الثاني في الجلسة نفسها — اقرأ `MONTAGE_BRIEF.md`** (ملزم مثل الأصل، بدل قراءة `PREFERENCES.md` كاملاً)، وابحث في `PREFERENCES.md` بـ`Grep` عن البند المعني عند الحاجة. قائمة الفحص تُقرأ في المراجعة النهائية. كل مرحلة بأمر واحد: `tools/stage.mjs prep|cut|check`. أي تفضيل جديد يُكتب في `PREFERENCES.md` (أو مقترح في `rules_registry/proposals/`) ثم في الملخّص، و`node tools/brief_check.mjs --stamp`.

**كلمة «مونتاج» = خطة أولاً ثم السير عليها (كلود فقط):** اقرأ `.claude/skills/video-montage/workflow-plan.md` و`.claude/skills/video-montage/critical-rules.md` قبل أي بناء.

@AGENTS.md

**المهارات:** للمونتاج `video-montage`، وللموشن `motion-graphics`، وللغلاف `thumbnail-design`، وللتعليق الصامت `silent-reaction`، **وكلمة «مونتاج ورقي» = `paper-montage`** (صوت فقط + قصاصات ورقية، طولي). بعد كل بناء `node tools/stage.mjs check …` (typecheck + mg_usage_audit + face_fast/face_check + frame_audit) قبل العرض.

**بعد إتمام أي فيديو:** «هل تعتمده؟» بالنقر فتُنفَّذ قواعد الاعتماد والحذف (`PREFERENCES.md` القسم 2)، وفي أول الرد عند الانتهاء «✅ انتهيتُ من المونتاج» + رابط المشاهدة.

# Video Processing & FFmpeg (NVIDIA RTX 3090) — full settings in `.claude/skills/remotion-render/SKILL.md` (keep in sync)
- GPU by default: decode `-hwaccel cuda`; encode NVENC, never `libx264/libx265` (preview `-c:v h264_nvenc -preset p4 -cq 23`; final `-preset p7 -rc vbr -cq 19 -b:v 0`); `-c copy` when nothing is re-encoded.
- CPU-bound FFmpeg filters `-threads 4`; long jobs at below-normal priority.
- Remotion Node renders: `ffmpegOverride: nvencOverride` (`tools/nvenc.mjs`) + `concurrency: 3` (`remotion.config.ts` does not apply to the Node API).
- One render at a time; both orientations: landscape (عرضي) first, then portrait (طولي).

## كلمة السر «مونتاج … انتهى مونتاج» (كلود فقط)
- **البداية:** «مونتاج» افتتاحاً لكتلة تعليمات (أول الرسالة أو أول سطر، أو مقرونة بـ«انتهى مونتاج») = ما بعدها **تعليمات لهذا الفيديو** تُنفَّذ كأوامر، وقد تصل أثناء البناء. «اعمل مونتاج لهذا الفيديو» طلب البدء المعتاد لا كلمة سر.
- **النهاية:** «انتهى مونتاج» أو صياغة قريبة («خلص المونتاج»، «انتهت التعليمات»، «هذا كل شيء»…)، وإن لم يقلها فنهاية الرسالة نهاية الكتلة.
- **التنفيذ:** كل تعليمة `node tools/montage_notes.mjs add <المشروع> "نصها"` ← تُنفَّذ مباشرة دون أسئلة إلا لعائق حقيقي ← `done <المشروع> <رقم> "كيف نُفّذت"` ← قبل «انتهيت» `check <المشروع>` ينجح؛ وما كان تفضيلاً دائماً يُكتب في القواعد أيضاً.
