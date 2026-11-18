# Round 4: clear text fixes (approved by the user on 2026-11-18: «أصلح النص والأدوات كلها»)

How to apply:
- Each fix goes in the SKILL.md with one short line, and the full text goes in its `references/detail.md`. General rules go in `القواعد_العامة.md`.
- Date every new line with «(أمر المستخدم 2026-11-18)», or with the original date when restoring a lost rule, for example «(2026-10-23، أُعيدت 2026-11-18)».
- Archive every replaced sentence in `_archive/rules_review_2026-11-18/replaced_round4_<group>.md`.
- Keep each file's line endings.
- Do NOT touch the six pending decisions: z_sfx (sound-effect numbers), z_fade (fade with isolation), z_lessverse (verse in lesson/stream clips and the recitation splice), z_wait («لحظة»), z_fresh (fresh-eyes reviewer), z_coverside (cover side).

## Group T1: general rules, tree, AGENTS, first-questions, transcription, montage-orders, video-cutting, segment-cut, extraction, sensitive-words, identity, approval
1. `القواعد_العامة.md` §3, general:
   - r21 «لا أترك مرحلة لمساعد دون متابعة نتيجته».
   - r22 «سطر للمستخدم قبل أي سلسلة طويلة».
   - «الأوقات للمستخدم بالدقيقة:الثانية لا بالثواني» (2026-11-06).
   - «ملف موجود يُعدَّل لا يُعاد كتابته».
   - «لا تجاوز لبوابة ولا تحايل؛ فشل متكرر بالسبب نفسه = أصلح الأداة».
   - «اللقطات الثابتة عبر أداة اللقطات وحدها، ولا تُحزم مجلدات الوسائط الحقيقية».
2. `القواعد_العامة.md` women line: «لا امرأة حقيقية غير مطموسة» (s2/s5). A blurred woman or a drawn silhouette is allowed.
3. `القواعد_العامة.md` backgrounds: «لا خلفية خضراء ولا زيتية، ولا تدرّج وحده» (old brief, project_brand_identity).
4. `segment-cut` + `video-cutting`: «المقاطع المبقاة بالترتيب الذي يذكره المستخدم، لا بالترتيب الزمني» (2026-10-30).
5. `montage-orders` §3 + `video-cutting`: «"لا تحذف هذه السكتة" = `--keep` لها، ويُفحص الناتج بـ`final_review --max-gap`».
6. `montage-orders` §5:
   - «علامة تصحيح باقية في الصوت لا تُتجاوز إلا بتأكيد المستخدم (keepMarks)».
   - «يُعاد تفريغ ما حول كل وصلة ±7ث».
   - «"سأعيد الكلام" بلا "عفواً" لا تبدأ كتلة» (t11).
7. `transcription` detail:
   - «انحراف الكلمات > 0.3ث = ✘، وإطار يعطيه المستخدم هو الحَكَم».
   - «الطرف الآخر في المناظرة: اسم ولون ثابت، ويُحدَّد الشيخ بالسياق إن لم يطابق».
8. `video-cutting` detail: «أي قياس صوتي يبدأ بفحص عدد القنوات» (restore it).
9. `extraction`:
   - §2 and SKILL:15, maps: point every map line to the new map rule (drawn once, then moved to neighbours/cities; flag on the country map, none on a city). Remove «خريطة عند كل ذكر».
   - SKILL:12 scholars, already done; check it.
   - Coverage exemptions (skipRequired) are reported to the user with the link.
   - Model errors are fixed in `requirements_fixes.json`.
10. `sensitive-words` SKILL:10 and :31: remove «(بمعنى التنظيم)» and the general-meaning exemption for «الدولة الإسلامية» (always bleeped).
11. `first-questions`: write what the B-roll answer does. «نعم = يُضاف بلا سؤال بعد أن أنظره؛ لا = لا مقاطع B-roll مضافة».
12. `approval`: «أنظر قائمة الاستوديو: أي تركيبة مساعدة بقيت للمشروع (ولو ببادئة أخرى) تُحذف».
13. `شجرة_العمليات.md` stage ١١, render: «صفحة تقدّم الرندر :3105 تُفتح في لوحة المعاينة مع كل رندر بعنوان عربي».
14. `identity`: «بطاقة اسم الشيخ تبقى 7–9ث» (2026-10-23، أُعيدت 2026-11-18). Also put it in `video-montage` detail §9.2.

## Group T2: video-montage (SKILL, critical-rules, workflow-plan, detail, MG_CATALOG), gallery-placement, source-display, motion-graphics, thumbnail-design (incl. refs prompt + legacy.md), checking, remotion-render, publishing, lessons-and-streams, advertising-video, pixabay-search, collage-broll-local
1. `video-montage/references/detail.md:35`: first minute → 1 s, and `--first-gap` default 1.
2. Spec freeze:
   - «تُجمَّد المواصفة بعد نجاح الفحص الكامل في الخلفية، لا عند الرابط».
   - Fix `video-montage/SKILL.md:30`, `critical-rules` item 40 and `workflow-plan.md:33`.
3. `workflow-plan.md`:
   - :31/:45 — items 1–20 are required before the render, not before the link (d1).
   - :17 — replace «إضافة تبلغ 8 دقائق» with t5: «أنبّه المستخدم ليرسل لي ما أضيفه».
   - :7 — images and hadith start right after transcription (q5).
4. `critical-rules` item 4: fragment warnings are read in context. Cut what is broken or hesitant; keep complete speech with a written reason in `orphans_ok.json`.
5. `critical-rules` 34ب and `gallery-placement/SKILL.md:12`: align with p1, the newest order (2026-11-18). Wide B-roll, pictures and maps are 16:9 above his shoulders with his head in the middle; when room is needed, his video shrinks and the screen splits. Remove «لا تُصغّر أبداً».
6. `critical-rules` item 11 and `gallery-placement`: the map rule in one line (drawn once and moved; flag on the country; no automatic elements in the hook).
7. Stable element ids: until they exist, `video-montage/SKILL.md:22` and `workflow-plan.md:21` say «أعرض القائمة من جديد قبل كل تعديل أو حذف، وحذف واحد في كل مرة».
8. `video-montage` §4:
   - «جولة التصحيح بعد الرابط: أسجّل كل ملاحظات المستخدم قواعدَ دفعة واحدة، والفحص الكامل مرة قبل الرندر».
   - «التعديل المتأخر يُعاد رندر مداه فقط ويُدمج (لا رندر كامل)».
9. `video-montage` / `motion-graphics`: «تراكيب المرجع والتجارب مخفية من الاستوديو».
10. `gallery-placement`:
    - «حاجة بلا عنصر في المعرض: أقول ذلك وأسأل قبل أن أبني؛ لا شيء من عندي بلا أمر صريح» (2026-10-30، 2026-11-10).
    - «متن الحديث في وسط الحيّز في الاتجاهين» (2026-11-17).
11. `source-display`: reply layout in landscape. His card is about 86% of the height with its centre near (1289,543), and the opponent chip sits near (431,880) at −7° (2026-11-05).
12. `thumbnail-design`:
    - `refs/chatgpt_cover_prompt.md:18`: replace «no signature, no name» with the signature clause («plus a small signature … محمد بن شمس الدين bottom-left …; no other text»).
    - `legacy.md`: repoint the `references/rules.md` mentions to the archive path `_archive/rules_review_2026-11-18/thumbnail_rules_old.md`.
    - z_coverside is pending; do not change the sheikh's side.
13. `checking`:
    - item 18: keep «بلا تلاشٍ» as it is, since z_fade is pending.
    - Add: «تقرير التغطية: كل استثناء يُذكر للمستخدم مع الرابط».
14. `remotion-render`:
    - :47 bumper env vars and :157 re-append bumper: mark both «مؤقت حتى ينتقل الفاصل إلى المونتاج (r5)».
    - Add the progress page :3105 line.
    - Add «إبقاء ملفات المشروع حيّة أثناء الرندر الطويل؛ وتسجيل التراكيب خارج Root».
    - Add «فشل = أشخّص وأصلح وأعيد، وبعد تعديل الكود أنظر الاستوديو بحثاً عن شاشة الخطأ».
15. `advertising-video/references/detail.md:8`: replace «لم يُحسم» with «لا ترجمة ولا كابتشن (2026-11-18)».
16. `lessons-and-streams`: z_lessverse is pending, leave it.

## Already decided elsewhere; check only
- The z_* items are pending.
- Memory updates are done by the main session.
