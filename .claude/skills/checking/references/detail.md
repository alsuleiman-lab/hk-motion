# التفصيل (منقول بنصه من ملف التفصيل القديم عند تثبيت الشجرة، 2026-11-17)

> ملزم كالمهارة نفسها. عند التعارض مع نص المهارة المكتوب في 2026-11-17 فما في المهارة أحدث.

### 10) الفحص
- مع إرسال الرابط يبدأ تلقائياً فحص ارتجاف على عشر ثوانٍ من موضع عشوائي في وسط الفيديو (يطلقه `stage.mjs check` في الخلفية، سجله `.tmp/<p>/probe.log`)، وأذكر نتيجته للمستخدم حين ينتهي؛ وإن فشل أصلحتُ السبب قبل أي رندر.
- `stage.mjs check` يشغّل معاً: `typecheck`، `mg_usage_audit`، `coverage_check`، `face_fast`، `requirements --check`، `montage_notes check`، `writing_place`، `writing_sync`، `gallery_geometry`، `orphan_scan`، `words_drift_check`، `verse_audit --strict`، `pick_triggers`، `clip_people_gate`، `grid_plan` للاتجاهين، `source_crop`، `brand_audit`، `gpu/video_lint.mjs`، `make_preview_proxy --auto`، `bumper_at --write`؛ `--dry` يسرد الناقص، و`--normalize` للبثوث. الفحص الناجح لا يُعاد ما لم يتغير شيء.
- فحص الوجه على نوافذ العناصر (بداية ومنتصف ونهاية كل عنصر) لا كل إطار؛ أي عنصر رسوم داخل `<Gfx>` وإلا لا يراه الفحص.
- الرابط: Studio تبويب واحد `http://localhost:3100/<Id>` ورابط IP الشبكة الحالي للجوال، بعد HTTP 200 والعثور على التركيبة، وبعد كل سبات. عنوان عربي `set_title.mjs <Id> "…"` لكل تركيبة ومجلدات Studio عربية. نسخة المعاينة `<اسم>_prev_<إصدار>.mp4` (عرض 960) لكل فيديو > 100 ميغا (`src/studioProxy.ts`، `data/preview_proxies.json`).
- `media_check.mjs` لكل وسائط جديدة. تجميد فيديو = `<Freeze frame>` حول `VSlot` لا `playbackRate` صغير.

