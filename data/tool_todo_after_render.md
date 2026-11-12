# إصلاحات أدوات تُنفَّذ بعد انتهاء الرندر الجاري (أخطاء 2026-11-12)
> لا تُعدَّل الأدوات أثناء انتظار رندر؛ تُنفَّذ هذه البنود فور التسليم ثم يُحذف البند المنفَّذ.

1. نقل أدوات البثوث والدروس من `.tmp` إلى `tools/stream/` بأسماء عامة: cut_smart.sh، cut_loop.sh، inner_pauses.py، post_cut.sh، join_keep.mjs، b2_fix.sh، b2_lib.mjs، b2_land_extra.mjs، b2_solo.mjs، fix_overlaps.mjs، close_gaps.mjs، tirm31_build.mjs ← clip_build.mjs (ملف الخطة معامل)، tirm31_reg.mjs ← clip_register.mjs؛ وتعديل المسارات داخلها.
2. أداة تقسيم دائمة `tools/stream/clip_split.mjs`: حدّ المقطع على نهاية آخر كلمة (التفريغ الكبير) + ذيل حتى أدنى صوت، والدمج متعدد المقاطع بإعادة ترميز بمعدل ثابت لا `-c copy`.
3. `b2_solo.mjs` و`fix_overlaps.mjs` و`close_gaps.mjs`: بداية العنصر `at ?? from ?? times[0]` (الآية بلا `at` قُصّت).
4. `spec_draft.mjs`: إهمال نافذة مصدر عرض بطاقتها < 120px.
5. `stills.mjs`: اختيار منفذ حر آلياً إن كان 3457 مشغولاً.
6. `merge_words_large.mjs`: سدّ ثغرة النموذج الكبير (لا كلمات ≥ 2ث والتفريغ المحاذى فيه كلمات) بكلمات المحاذى.
7. سكربت البناء: الخروج بخطأ إن فشل `writing_place --write`.
8. `montage_guard.mjs end`: حذف `.tmp/*<p>*` وسجلات `b2_*_<p>` و`data/stream_queue/<p>*` ومدخلات `data/preview_proxies.json` ومهام `resume_after_reboot` للمشروع، وسرد الباقي.
9. `requirements.mjs --check`: قبول صورة الشخص المعروضة عند أي ذكر سابق له بصيغة أخرى من اسمه.
10. فحص «آخر كلمة كاملة» قبل الرندر: طاقة الصوت في آخر 0.3ث من القص وكلمة التفريغ الأخيرة لا تتجاوز نهاية الملف.
