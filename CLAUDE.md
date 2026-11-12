# Remotion Workspace

**كلّم المستخدم بالعربية حصراً (أمره 2026-11-11):** كل رد وسطر حالة وملخص وسؤال؛ لا إنجليزي إطلاقاً.

**قبل أن تكتب «✅ انتهيتُ» مرّ على «المراجعة النهائية الإلزامية» في أول `WORKFLOW_CHECKLIST.md` بنداً بنداً.**

**عقد الالتزام:** القواعد ومهاراتها وقوائم الفحص ملزمة؛ نصّه في `AGENTS.md` أدناه وتفصيله في `PREFERENCES.md` القسم 0.

**قبل أي عمل على فيديو — كل فيديو، ولو الثاني في الجلسة نفسها — اقرأ `MONTAGE_BRIEF.md`** (ملزم مثل الأصل، بدل قراءة `PREFERENCES.md` كاملاً)، وابحث في `PREFERENCES.md` بـ`Grep` عن البند المعني عند الحاجة. قائمة الفحص تُقرأ في المراجعة النهائية. كل مرحلة بأمر واحد: `tools/stage.mjs prep|cut|check`. أي تفضيل جديد يُكتب في `PREFERENCES.md` (أو مقترح في `rules_registry/proposals/`) ثم في الملخّص، و`node tools/brief_check.mjs --stamp`.

**كلمة «مونتاج» = خطة أولاً ثم السير عليها (كلود فقط):** اقرأ `.claude/skills/video-montage/workflow-plan.md` و`.claude/skills/video-montage/critical-rules.md` قبل أي بناء.

@AGENTS.md

**المهارات:** للمونتاج `video-montage`، وللموشن `motion-graphics`، وللغلاف `thumbnail-design`، وللتعليق الصامت `silent-reaction`، **وكلمة «مونتاج ورقي» = `paper-montage`** (صوت فقط + قصاصات ورقية، طولي). بعد كل بناء `node tools/stage.mjs check …` (typecheck + mg_usage_audit + coverage_check + face_fast؛ face_check/frame_audit للتركيبات القديمة) قبل العرض.

**فاصل الافتتاح (صارم، 2026-11-11):** في أول كل فيديو، قبل أول كلمة ينطقها (بسم الله أو السلام عليكم)، يوضع فاصل ورقي 5ث **عشوائي** من الفواصل الخمسة في `public/fawasel/` بـ`node tools/pick_bumper.mjs pick`؛ يُلحق آلياً في أول الملف النهائي بعد الرندر الكامل (`tools/prepend_bumper.mjs` يستدعيه `hybrid_any`/`hybrid_parallel`؛ `--no-bumper` للاستثناء بنص المستخدم)، فلا يُخطَّط له في المواصفة ولا تُزاح عناصرها؛ قبل الغلاف أيضاً. لكل فاصل نسخة عرضية 1920×1080 وطولية 1080×1920 (`fileP`) تُختار حسب اتجاه الفيديو، فيشمل الطولي والريلز. التفصيل في `PREFERENCES.md` القسم 4 ومهارة `paper-montage`. **استثناء البثوث والدروس (أمر المستخدم 2026-11-11):** لا يوضع الفاصل قبل «بسم الله»؛ يوضع **آخر الفيديو** خاتمةً له (`prepend_bumper.mjs --end`، أو متغير `BUMPER_POSITION=end`؛ وفي طابور الرندر `--bumper end`)، وتبقى مدته وبقية أحكامه كما هي.

**بعد إتمام أي فيديو:** «هل تعتمده؟» بالنقر فتُنفَّذ قواعد الاعتماد والحذف (`PREFERENCES.md` القسم 2)، وفي أول الرد عند الانتهاء «✅ انتهيتُ من المونتاج» + رابط المشاهدة.

**الرندر = المحرّك الجديد على كرت الشاشة (أمر المستخدم 2026-11-12: «يجب نقل كل شيء إلى طريقتنا الجديدة»، R-RENDER-GPU.1):**
- **حين يطلب المستخدم رندراً:** اتبع الخطوات التسع في أول `.claude/skills/remotion-render/SKILL.md`: الإذن، ورندر واحد، والمساحة ≥ 25 GB بعد الذروة، و`node tools/gpu_render.mjs …` أو `bash tools/gpu/render_project.sh …` (العرضي ثم الطولي)، والتقرير (`chromeVideo` فارغ)، والارتجاف، والوجهة، والإصلاح عند الفشل، والتنظيف. الهجين `hybrid_any` احتياط بإذنه فقط.
- **حين تعمل مونتاجاً:** القواعد الخمس في أول `.claude/skills/video-montage/SKILL.md`:
  - كل فيديو `<VSlot>`، ولا `OffthreadVideo` ولا `Video` ولا `RV` في مسار الرندر؛
  - ما تحت الفيديو بـ `hyBg` و`HybridBg` و`UnderHim`؛
  - لا تستعمل المكوّنات المحصورة التي ما زالت في Chromium قبل نقلها؛
  - رندر اختبار قصير قبل الرندر الكامل؛
  - ولا تغيير لشكل عناصر المعرض.

# Video Processing & FFmpeg (NVIDIA RTX 3090) — full settings in `.claude/skills/remotion-render/SKILL.md` (keep in sync)
- GPU by default: decode `-hwaccel cuda`; encode NVENC, never `libx264/libx265` (preview `-c:v h264_nvenc -preset p4 -cq 23`; final `-preset p7 -rc vbr -cq 19 -b:v 0`); `-c copy` when nothing is re-encoded.
- CPU-bound FFmpeg filters `-threads 4`; long jobs at below-normal priority.
- Remotion Node renders: `ffmpegOverride: nvencOverride` (`tools/nvenc.mjs`) + `concurrency: 3` (`remotion.config.ts` does not apply to the Node API).
- One render at a time; both orientations: landscape (عرضي) first, then portrait (طولي).

## كلمة السر «مونتاج … انتهى مونتاج» (كلود فقط)
- **البداية:** «مونتاج» افتتاحاً لكتلة تعليمات (أول الرسالة أو أول سطر، أو مقرونة بـ«انتهى مونتاج») = ما بعدها **تعليمات لهذا الفيديو** تُنفَّذ كأوامر، وقد تصل أثناء البناء. «اعمل مونتاج لهذا الفيديو» طلب البدء المعتاد لا كلمة سر.
- **النهاية:** «انتهى مونتاج» أو صياغة قريبة («خلص المونتاج»، «انتهت التعليمات»، «هذا كل شيء»…)، وإن لم يقلها فنهاية الرسالة نهاية الكتلة.
- **التنفيذ:** كل تعليمة `node tools/montage_notes.mjs add <المشروع> "نصها"` ← تُنفَّذ مباشرة دون أسئلة إلا لعائق حقيقي ← `done <المشروع> <رقم> "كيف نُفّذت"` ← قبل «انتهيت» `check <المشروع>` ينجح؛ وما كان تفضيلاً دائماً يُكتب في القواعد أيضاً.
