# Remotion Workspace

**كلّم المستخدم بالعربية حصراً:** كل رد وسطر حالة وملخص وسؤال وخطوة خطة وجدول؛ لا حرف لاتيني فيها إطلاقاً: لا كلمة إنجليزية ولا اسم ملف أو أداة أو مسار؛ الأسماء بالعربية (مثل «مجلد جاهز ← بثوث ← طولي»). الاستثناء الوحيد رابط المعاينة لأنه يُنقر، في سطره وحده بلا كلام لاتيني حوله. وقبل الإرسال أراجع الرد: أي حرف لاتيني يُحذف أو يُعرَّب.

**عقد الالتزام:** القواعد والمهارات وقائمة الفحص ملزمة لا اختيارية؛ لا حيد ولا تأويل ولا اختصار.
الاستثناء بنص المستخدم في رسالته الحالية فقط ولهذا الفيديو، وعند التعارض توقّف واسأل بالنقر.
الإنجاز ببوابات تنجح لا بالكلام (التفصيل `MONTAGE_BRIEF.md` §0).

**قبل أي عمل على فيديو (كل فيديو من جديد):** اقرأ `MONTAGE_BRIEF.md` (الملف الوحيد الملزم، مرتّب بمراحل §0–§11) ثم مهارة `router` التي توجّه إلى سلسلة المهارات، وابحث في `PREFERENCES.md` بـGrep عن تفصيل البند عند الحاجة. كل مرحلة بأمر واحد `node tools/stage.mjs prep|cut|check <المشروع>`. **والعناصر بأسمائها ومتغيراتها فقط:** `node tools/el.mjs show <الاسم>` ثم `el.mjs add` (نموذج العمل في رأس مهارة `video-montage`)؛ ريموشن يأخذ الشكل والمكان من المعرض.
**قبل «✅ انتهيتُ»:** مرّ على «المراجعة النهائية الإلزامية» في أول `WORKFLOW_CHECKLIST.md` بنداً بنداً، ثم «هل تعتمده؟» بالنقر.
**تفضيل أو تصحيح جديد:** سطره في `MONTAGE_BRIEF.md` (وتفصيله في `PREFERENCES.md` بالرقم نفسه) ومهارته في الدورة نفسها، ثم `node tools/brief_check.mjs --stamp`.

## كلمة السر «مونتاج … انتهى مونتاج» (كلود فقط)
- **البداية:** «مونتاج» في أول الرسالة أو أول سطر = ما بعدها تعليمات لهذا الفيديو تُنفَّذ كأوامر، وقد تصل أثناء البناء. «اعمل مونتاج لهذا الفيديو» طلب بدء لا كلمة سر.
- **النهاية:** «انتهى مونتاج» أو ما يقاربها («خلص المونتاج»، «هذا كل شيء»…)، وإلا فنهاية الرسالة.
- **التنفيذ:** كل تعليمة `node tools/montage_notes.mjs add <المشروع> "نصها" --at <ثانية الأصل>` ← تُنفَّذ بلا أسئلة إلا لعائق حقيقي ← `done <المشروع> <رقم> "كيف نُفّذت"` ← `check <المشروع>` ينجح قبل «انتهيت»؛ وما كان تفضيلاً دائماً يُكتب في القواعد أيضاً.

# Video Processing & FFmpeg (NVIDIA RTX 3090) — full settings in `.claude/skills/remotion-render/SKILL.md` (keep in sync)
- GPU by default: decode `-hwaccel cuda`; encode NVENC, never `libx264/libx265` (preview `-c:v h264_nvenc -preset p4 -cq 23`; final `-preset p7 -rc vbr -cq 19 -b:v 0`); `-c copy` when nothing is re-encoded.
- CPU-bound FFmpeg filters `-threads 4`; long jobs at below-normal priority.
- Remotion Node renders: `ffmpegOverride: nvencOverride` (`tools/nvenc.mjs`) + `concurrency: 3` (`remotion.config.ts` does not apply to the Node API).
- Final render = the GPU engine (`tools/gpu_render.mjs`, `bash tools/gpu/render_project.sh`); hybrid only as fallback with the user's permission.
- One render at a time; both orientations: landscape (عرضي) first, then portrait (طولي).

@AGENTS.md
