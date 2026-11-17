# Remotion Workspace

**كلّم المستخدم بالعربية حصراً:** كل رد وسطر حالة وملخص وسؤال وخطوة خطة وجدول؛ لا حرف لاتيني فيها إطلاقاً: لا كلمة إنجليزية ولا اسم ملف أو أداة أو مسار؛ الأسماء بالعربية (مثل «مجلد جاهز ← بثوث ← طولي»). الاستثناء الوحيد رابط المعاينة لأنه يُنقر، في سطره وحده بلا كلام لاتيني حوله. وقبل الإرسال أراجع الرد: أي حرف لاتيني يُحذف أو يُعرَّب.

**عقد الالتزام:** القواعد والمهارات وقائمة الفحص ملزمة لا اختيارية؛ لا حيد ولا تأويل ولا اختصار.
الاستثناء بنص المستخدم في رسالته الحالية فقط ولهذا الفيديو، وعند التعارض توقّف واسأل بالنقر.
الإنجاز ببوابات تنجح لا بالكلام (`القواعد_العامة.md`)؛ ولا تقل مهارة «تمّ» إلا لمهمة أُنجزت كاملة.

**قبل أي عمل على فيديو (كل فيديو من جديد):** اقرأ `القواعد_العامة.md` ثم `شجرة_العمليات.md` ثم مهارة `router`، ثم مهارة كل مرحلة حين تصلها (تفصيلها في `references/detail.md` بجانبها، بحث لا قراءة كاملة). كل مرحلة بأمر واحد `node tools/stage.mjs prep|cut|check <المشروع>`. **والعناصر بأسمائها ومتغيراتها فقط:** `node tools/el.mjs show <الاسم>` ثم `el.mjs add`؛ ريموشن يأخذ الشكل والمكان من المعرض.
**قبل «✅ انتهيتُ»:** مرّ على قائمة المراجعة في مهارة `checking` بنداً بنداً، ثم «هل تعتمده؟» بالنقر.
**تفضيل أو تصحيح جديد:** سطره في المهارة المعنية (وتفصيله في `references/detail.md` لها، وفي `القواعد_العامة.md` إن كان عاماً) في الدورة نفسها، ثم `node tools/brief_check.mjs --stamp`.

## كلمة السر «مونتاج … انتهى مونتاج» (كلود فقط)
- **تُقال داخل التسجيل فقط** (كلامه في الفيديو للمونتير)، ولا علاقة لها بما يكتبه المستخدم عند الإرسال: رسائله عادية، وما فيها من تعليمات تُنفَّذ وتُسجَّل مهاماً بلا كلمة سر.
- **البداية والنهاية:** من كلمة «مونتاج» المنطوقة إلى «انتهى مونتاج» (أو ما يقاربها: «خلص المونتاج»، «هذا كل شيء»…)، وإلا حيث يعود إلى مخاطبة الجمهور بالسياق والسماع.
- **التنفيذ:** كل تعليمة `node tools/montage_notes.mjs add <المشروع> "نصها" --at <ثانية الأصل>` ← تُنفَّذ بلا أسئلة إلا لعائق حقيقي ← `done <المشروع> <رقم> "كيف نُفّذت"` ← `check <المشروع>` ينجح قبل «انتهيت»؛ وما كان تفضيلاً دائماً يُكتب في القواعد أيضاً. والكتلة نفسها تُحذف من الفيديو.

# Video Processing & FFmpeg (NVIDIA RTX 3090) — full settings in `.claude/skills/remotion-render/SKILL.md` (keep in sync)
- GPU by default: decode `-hwaccel cuda`; encode NVENC, never `libx264/libx265` (preview `-c:v h264_nvenc -preset p4 -cq 23`; final `-preset p7 -rc vbr -cq 19 -b:v 0`); `-c copy` when nothing is re-encoded.
- CPU-bound FFmpeg filters `-threads 4`; long jobs at below-normal priority.
- Remotion Node renders: `ffmpegOverride: nvencOverride` (`tools/nvenc.mjs`) + `concurrency: 3` (`remotion.config.ts` does not apply to the Node API).
- Final render = the GPU engine (`tools/gpu_render.mjs`, `bash tools/gpu/render_project.sh`); hybrid only as fallback with the user's permission.
- One render at a time; both orientations: landscape (عرضي) first, then portrait (طولي).

@AGENTS.md
