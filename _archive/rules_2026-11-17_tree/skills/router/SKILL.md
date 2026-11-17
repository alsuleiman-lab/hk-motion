---
name: router
description: الموجّه — أول مهارة تُقرأ عند أي طلب فيديو (حلقة، ريل، درس، بث، كرتون، تعديل فيديو، تعليق صامت، مونتاج ورقي، إعلان، رندر). جدول قصير: نوع الطلب ← سلسلته، ثم ترتيب المراحل المشترك (القواعد §2→§11) ومن ينفّذ كل مرحلة.
---

# الموجّه

> قبل أي فيديو: `MONTAGE_BRIEF.md` (القواعد §0–§11) ثم هذا الملف ثم مهارة السلسلة و`montage-orders`. كل مرحلة مهارة صغيرة تعمل وحدها؛ اقرأها حين تصلها فقط.

## 1) الطلب ← السلسلة
| الطلب | السلسلة (المهارة الأولى) |
|---|---|
| فيديو يُرسل وحده («اعمل مونتاج لهذا الفيديو») | `video-montage` — حلقة عادية |
| «ريل» / «ريلز» من فيديو | `video-montage` — سلسلة الريل (طولي 9:16 دائماً) |
| «الدرس الأخير» / «البث الأخير»، أو رابط درس أو بث | `lessons-and-streams` — تجلب أحدث تسجيل من `C:\Users\mshms\Videos` بنفسها (`node tools/latest_recording.mjs lesson` أو `stream`) |
| «كرتون دودو» / «كرتون أبو خط» / أي كرتون | `cartoon-animation` (طولي، رسوم فقط) |
| «عدّل هذا الفيديو واعمل فيه كذا» (رسوم وتعديل) | `motion-graphics` (+ `gallery-placement` للمكان والوقت) |
| «تعليق صامت» / «ريأكشن» / تسجيل مشاهدة صامت | `silent-reaction` |
| «مونتاج ورقي» | `paper-montage` |
| «إعلان» | `advertising-video` |
| «رندر» لفيديو جاهز | `remotion-render` |
| «مونتاج … انتهى مونتاج» تُقال داخل التسجيل، أو رسالة تعليمات أثناء العمل (بلا كلمة سر) | `montage-orders` (في أي سلسلة) |
| غلاف | `thumbnail-design` |

## 2) المراحل المشتركة (بالترتيب)
| القواعد | المرحلة | تنفّذها |
|---|---|---|
| §2 | الأسئلة بالنقر (حيث تلزم) + بدء التجهيز (prep) في الخلفية فوراً؛ القص بعد الحكم في الإعادات والتعليمات | السلسلة نفسها؛ `node tools/stage.mjs prep` |
| §3 | قص السكتات والتلعثم + بوابة الصوت | `video-cutting`؛ `node tools/stage.mjs cut` |
| §4 | التفريغ (بالكلمات، والمتحدثون) | `stage.mjs prep` و`cut` (`transcript.txt`، `speakers.txt`) |
| §5 | أوامر «مونتاج…انتهى مونتاج» و«عفواً/أعيد» | `montage-orders` §1–§2 |
| §6 | قائمة مهام الفيديو `.tmp/<p>/tasks.md` (`tasks.mjs`) | `montage-orders` §3 (مداخلها: `requirements.md`، `montage_notes.mjs`، `montage_guard`) |
| §7 | الهوية: نمط لوني عشوائي + فاصل عشوائي (الكرتون بلا فاصل) | `src/brand.ts` (حقل `brand`)؛ `node tools/pick_bumper.mjs pick` |
| §8.1 | الأسماء: صور وخرائط | `video-montage/workflow-plan.md` 1ج (`fetch_images.mjs`) |
| §8.2–§8.3 | القرآن والحديث | `verse_scan.mjs`، `verse_audit.mjs`؛ `critical-rules.md` ج |
| §8.4 | B-roll ومقاطع يوتيوب | `pixabay-search`، `source-display` |
| §8.5 | صور مصممة (رسم كود من المعرض أولاً، ثم المولَّدة) | `gallery-placement`، ثم `collage-broll-local` (`comfy_still.mjs`) |
| §8.6 | الأخبار والمصادر | `source-display` |
| §8.7 | شريط الحلقة والعدّاد | تلقائي في المحرّك (`TitleBar` + `episode_date.mjs`) |
| §8.8 | توزيع العناصر من المعرض + الهوك | `gallery-placement` |
| §9 | البناء | السلسلة + `motion-graphics` (`spec_draft.mjs`) |
| §10 | الفحص | `node tools/stage.mjs check …` + `WORKFLOW_CHECKLIST.md` |
| §11 | الرندر والتصدير والاعتماد (والفاصل) | `remotion-render`؛ الاعتماد والرفع مهارة `approval` |

## 3) مراجع لا سلاسل
`remotion-*` (عدا `remotion-render`): توثيق Remotion الرسمي للرجوع فقط. `pixabay-search`: بحث B-roll. عناصر المعرض بأسمائها ومتغيراتها: `node tools/el.mjs list|show`.
