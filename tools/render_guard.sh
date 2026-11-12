#!/bin/bash
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; G="node tools/montage_guard.mjs"
[ -f .tmp/$p/stages/questions.json ] || $G stage $p questions --skill video-montage --done "لا أسئلة: الدروس والبثوث بلا أسئلة (أمر المستخدم 2026-11-06)" >/dev/null
[ -f .tmp/$p/stages/cut.json ] || $G stage $p cut --skill video-cutting --done "قص السكتات وتفريغ large-v3 وبوابة الصوت" --review "سكتات قليلة مستثناة في وصلات لا تقبل القص دون بتر كلمة" >/dev/null
[ -f .tmp/$p/stages/context.json ] || $G stage $p context --skill video-montage --done "لا تعليمات داخل التسجيل" >/dev/null
[ -f .tmp/$p/stages/assets.json ] || $G stage $p assets --skill video-montage --done "صور مولّدة محلياً بلا ملامح" >/dev/null
[ -f .tmp/$p/stages/cover.json ] || $G stage $p cover --skill thumbnail-design --done "غلاف ThumbPro بالعنوان" >/dev/null
[ -f .tmp/$p/stages/plan.json ] || $G stage $p plan --skill video-montage --done "خطة العناصر من التفريغ" >/dev/null
[ -f .tmp/$p/stages/hook.json ] || $G stage $p hook --skill hook --done "غلاف ثم كتابة عند أول كلمة" >/dev/null
[ -f .tmp/$p/stages/build.json ] || $G stage $p build --skill video-montage --done "بناء ملف البيانات وفحص stage check" >/dev/null
[ -f .tmp/$p/stages/review.json ] || $G stage $p review --skill video-montage --done "فحوص الصوت والشبكة والتغطية" >/dev/null
$G plan-add $p --id b1 --at 0 --what "عناصر الكتابة والصور" --skill video-montage >/dev/null
$G plan-done $p b1 --evidence "stage check OK" >/dev/null
$G check $p --stages questions,cut,context,assets,cover,plan,hook,build | tail -2
