---
name: video-montage
description: سلسلة مونتاج حلقة الشيخ محمد بن شمس الدين (فيديو يُرسل وحده) وسلسلة الريل منها؛ الصيغ عرضي / طولي كامل / ريلز تُبنى معاً في مرور واحد. ترتّب المراحل (القواعد §2→§11) وتوجّه كل مرحلة إلى مهارتها الصغيرة. يسبقها الموجّه router. الدروس والبثوث سلسلتها lessons-and-streams، والكرتون cartoon-animation، والتعليق الصامت silent-reaction، والإعلان advertising-video، والمونتاج الورقي paper-montage.
---

# سلسلة المونتاج (حلقة عادية وريل)

**دورك ترتيب لا حفظ.** امشِ على المراحل بالترتيب، واقرأ مهارة المرحلة حين تصلها فقط، وأنهِ كل مرحلة بتقرير موحّد. القواعد في `MONTAGE_BRIEF.md` بأقسامها (§0–§11)، والبحث عن بند في `PREFERENCES.md` بـ`Grep`. عند البدء: `MONTAGE_BRIEF.md` ← `router` ← هذا الملف + `critical-rules.md` (الحاسم في التنفيذ) + `workflow-plan.md` (الخطة) ← `montage-orders` (التعليمات والإعادات وقائمة المهام). دليل القطع: `MG_CATALOG.md` (مولَّد بـ`node tools/gen_quickref.mjs`). **كل مرحلة بأمر واحد** `node tools/stage.mjs prep|cut|check` (يطبع الخلاصة؛ السجل `.tmp/<p>/stage_*.log` عند الفشل وحده)، والملفات الموجودة تُعدَّل بـEdit.

## المحرّك (القواعد الخمس، R-RENDER-GPU.1 و.2)
1. **كل فيديو في التركيبة `<VSlot>`** (`src/hybrid/Slot.tsx`؛ `w`، `h`، `radius`، `vx/vy/vw/vh`، `startFrom`، `playbackRate`، `fx`، `matte`، `fit`، `grow={0}` لنافذة بلا إطار)؛ لا `OffthreadVideo` ولا `<Video>` ولا `RV` في مسار الرندر (النمط `{HY ? <VSlot/> : <القديم/>}` يبقى لـStudio). تأثير غير مدعوم يُضاف في المركِّبين (`tools/gpu_compositor.py` و`tools/hybrid_generic.py`) قبل استعماله.
2. **ما تحت الفيديو:** `hyBg(لون)`، و`<HybridBg>` للخلفية الثابتة، و`<UnderHim>` تحت الشيخ المعزول، و`<HyLayer z>` مع `<VSlot z>` تحت فيديو بعينه (مثال `src/DebateLayouts.tsx`). غلاف التركيب في `Root.tsx` بلا خلفية معتمة عند `HY` (`critical-rules.md` البند 37).
3. **عنصر جديد** يُبنى للمحرّك من أول سطر (القواعد الخمس في أول `motion-graphics`)، و`tools/gpu/video_lint.mjs` داخل `stage.mjs check` يرفض فيديو يفكّه المتصفح.
4. **رندر اختبار قصير** قبل الكامل على نافذة فيها كل نوع فيديو: `node tools/gpu_render.mjs --comp <Id> --start A --end B --out .tmp/gpu_render/<p>_test.mp4 --no-bumper`؛ `chromeVideo` في التقرير فارغ.
5. **لا تغيير لشكل عناصر المعرض** لأجل الرندر (المطابقة ≥ 45 dB بـ`--dump` و`tools/gpu/compare_frames.py`).

## بوابة البدء والحارس
- `stage.mjs prep` يسجّل المونتاج تلقائياً (`montage_guard start`)، وقائمة المهام `.tmp/<p>/tasks.md` (`tasks.mjs`)؛ لا مواصفة ولا ملف جديد في `src/` قبل نجاح `montage_guard ready <p>`، ولا رندر نهائي قبل نجاح `check` وبوابة الصوت (`tools/hooks/guard.mjs` يفرضها). العنوان العربي لكل تركيبة قبل أي معاينة (`set_title.mjs`).
- **التقرير الموحّد** آخر كل مرحلة:
  `node tools/montage_guard.mjs stage <p> <المرحلة> --skill <المهارة> --done "…|…" --notdone "…|…" --review "…|…" --artifact <ملف> --gate "اسم=ok|fail"`
  رموز المراحل: `questions cut context assets cover plan hook build review`.
- بعد الاعتماد: `node tools/montage_guard.mjs end <p>` (القواعد §11).

## المراحل
| # | المرحلة (`id`) | تنفّذها | القواعد | الناتج والبوابة |
|---|---|---|---|---|
| 0 | الأسئلة (`questions`) | هذا الملف | §2 | **أول فعل:** أربعة أسئلة بالنقر في دفعة واحدة: العنوان (3 مقترحات)، B-roll (مقاطع فيديو مضافة فقط)، الصيغ (اختيار متعدد: عرضي / طولي كامل / ريلز)، أين يُرفع العرضي (القناة الأساسية أم الردود العلمية؛ وجهة الطولي والريلز لا تُسأل هنا). بلا سؤال مجلد. **قبلها مباشرة في الخلفية** `node tools/stage.mjs prep <p> "<الفيديو>"`، ثم الحكم في الإعادات ومواضع مخاطبة المونتير، ثم القص مرة واحدة. ما لم يُختر لا يُبنى. |
| 1 | القص والتفريغ (`cut`) | `video-cutting` | §3 §4 | `public/<p>_cut.mp4` + الخريطة + نجاح `audio_gate`؛ التفريغ `.tmp/<p>/transcript.txt` والمتحدثون `.tmp/<p>/speakers.txt` |
| 2 | الأوامر وقائمة المهام (`context`) | `montage-orders` | §5 §6 | تعليمات مسجّلة بزمنها، كتلة «مونتاج» و«عفواً» محذوفة، `requirements.md` |
| 3 | الأصول (`assets`) | `workflow-plan.md` 1ج + `pixabay-search` + `source-display` + `collage-broll-local` | §8.1–§8.6 | `.tmp/<p>/assets.md`، وما تعذّر يُعلَم به المستخدم |
| 4 | الغلاف (`cover`) | `thumbnail-design` | §11.4 | يُراجع بصرياً قبل البناء |
| 5 | الخطة (`plan`) | `workflow-plan.md` + `gallery-placement` | §8.8 §9 | `plan.json` (كل بند باسم مهارته) + `data/specs/<p>.json` يجتاز `coverage_check` |
| 6 | الهوك (`hook`) | `gallery-placement` §1 | §8.8 | أول 30ث (عرضي وطولي كامل) أو 10–15ث للريل، جدول ✔/✘ |
| 7 | البناء (`build`) | `motion-graphics` · `gallery-placement` · `source-display` · `collage-broll-local` | §9 | بنود الخطة منفَّذة للاتجاهين معاً، ثم `grid_plan --write` (PASSED) |
| 8 | المراجعة (`review`) | هذا الملف + `WORKFLOW_CHECKLIST.md` | §10 | تقرير الحارس + المراجع بعين جديدة + الرابط |
| 9 | الرندر والتصدير والاعتماد | `remotion-render` | §11 | بإذن صريح؛ عرضي ثم طولي؛ الفاصل: القواعد §11 |

**المتحدثون (`speakers.txt`، أستعمله بنفسي):** كل دور غير `sheikh` = كلام غيره: المقطع الذي يرد عليه (يُطابَق مع `sources.json` و`splits` ولا يُقصّ كأنه كلامه)، أو الطرف الآخر في المناظرة (اسم ولون ثابت في شريط الاسم؛ `--ref اسم=ملف.wav` لتسميته). `⚠ sheikh not matched` = أحدّد الشيخ بالسياق؛ يدوياً `node tools/diarize.mjs <p>`.

**لا انتظار:** عدا أسئلة البداية الأربعة، لا `AskUserQuestion` ما دام عندي عمل لا يتوقف على الجواب (نافذته توقف الجلسة)؛ القص والبحث والصور والغلاف لا تنتظره، ولا يُحسَم بالفحص شيء يغيّره جوابه. ريندر واحد فقط في وقت واحد.

## سلسلة الريل
الريل طولي 9:16 دائماً (`kind: reel`) ويُبنى في مرور الصيغ نفسه: الهوك 10–15ث عند حدّ جملة (`gallery-placement` §1)، بطاقة المقطع بجانب الرأس وشبكة النافذة الدائمة (`critical-rules.md` البندان 34–35)، الآية ملء الشاشة (البند 18)، العزل السريع عند عرض فيديو فقط. الفاصل: القواعد §11.

## المراجعة (المرحلة 8)
1. لكل بند: `montage_guard plan-done <p> <id> --evidence "…" [--skill <المستعملة>]` (لقطة أو نتيجة أداة).
2. `node tools/stage.mjs check <p> <Comp> --file src/<X>.tsx --minutes <m>` بعد **آخر** تعديل (typecheck + `mg_usage_audit` + `coverage_check` + `face_fast`؛ `face_check`/`frame_audit` للتركيبات القديمة)، و`audio_gate` و`final_review.mjs` و`montage_notes.mjs check`، وتُسجَّل `--gate` في التقرير؛ ثم `WORKFLOW_CHECKLIST.md` بنداً بنداً.
3. `node tools/montage_guard.mjs check <p>` ينجح.
4. **مراجع بعين جديدة:** وكيل فرعي يُعطى `plan.json` وبوابات المهارات المستعملة واللقطات، ويجيب لكل بند: «نُفِّذ وفق مهارته؟ نعم/لا/غير واضح + السبب».
5. المعاينة والرابط بعد التأكد أنه يعمل، ومعه فحص الارتجاف العشوائي من وسط الفيديو يعمل في الخلفية (يطلقه `stage.mjs check`) وتُذكر نتيجته حين ينتهي؛ لا رندر نهائي قبل إذن صريح؛ ثم «✅ انتهيتُ من المونتاج» + الرابط، ثم «هل تعتمده؟».

## بوابات المهارات (يقرؤها المراجع)
- **video-cutting:** لا سكتة > 0.4ث؛ بوابة الصوت نجحت؛ لا بداية كلمة مقصوصة (`onset_check.py` صفر)؛ لا قص لكلامه أو مقاطعه بلا إذن.
- **montage-orders:** كل تعليمة مغلقة بدليل؛ لا «عفواً/أعيد/مونتاج» مسموعة.
- **gallery-placement:** كل عنصر عند نطقه ومن مكانه في المعرض؛ لا نوع فوق 3 مرات؛ جدول الهوك ✔/✘.
- **source-display:** المصدر كاملاً بإطاره وشاشة القناة الختامية مخفية؛ رابط أو صورة لكل خبر/رقم.
- **thumbnail-design:** الغلاف يعبّر عن الموضوع؛ الشيخ + العنوان + صور المذكورين؛ اللحية كاملة؛ بلا نساء.
