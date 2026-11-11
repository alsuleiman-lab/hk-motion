#!/bin/bash
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; G="node tools/montage_guard.mjs"
$G stage $p questions --skill video-montage --done "لا أسئلة: الدروس والبثوث بلا أسئلة (أمر المستخدم 2026-11-06)" >/dev/null
$G stage $p cut --skill video-cutting --done "قص السكتات وتفريغ large-v3 وبوابة الصوت" --review "سكتات قليلة مستثناة في وصلات لا تقبل القص دون بتر كلمة" >/dev/null
$G stage $p context --skill video-montage --done "لا تعليمات داخل التسجيل" >/dev/null
$G stage $p assets --skill video-montage --done "صور مولّدة محلياً بلا ملامح" >/dev/null
$G stage $p cover --skill thumbnail-design --done "غلاف ThumbPro بالعنوان" >/dev/null
$G stage $p plan --skill video-montage --done "خطة العناصر من التفريغ" >/dev/null
$G stage $p hook --skill hook --done "غلاف ثم كتابة عند أول كلمة" >/dev/null
$G stage $p build --skill video-montage --done "بناء ملف البيانات وفحص stage check" >/dev/null
$G stage $p review --skill video-montage --done "فحوص الصوت والشبكة والتغطية" >/dev/null
$G plan-add $p --id b1 --at 0 --what "عناصر الكتابة والصور" --skill video-montage >/dev/null
$G plan-done $p b1 --evidence "stage check OK" >/dev/null
$G check $p --stages questions,cut,context,assets,cover,plan,hook,build | tail -2
