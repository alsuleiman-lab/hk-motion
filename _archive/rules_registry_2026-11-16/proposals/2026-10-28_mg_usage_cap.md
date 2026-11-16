# مقترح: سقف عدد أنواع الموشن في mg_usage_audit
- **الحالة:** مدمج في MONTAGE_BRIEF.md §3 (حتى 9 أنواع) (تدقيق 2026-11-12)

**المشكلة:** `tools/mg_usage_audit.mjs` يطلب `max(4, ⌈الدقائق×0.8⌉)` حتى 10 أنواع، لكن `APPROVED_TYPES` في `src/MontageSpec.tsx` (قرارات المعرض 2026-10-27) لا تعتمد `neon`، فأقصى ما يمكن بناؤه من عناصر معتمدة تسعة أنواع: BlurRise، SourceWalk، RewriteWindow، FlashCut، PhoneChips، KeyChip، StatRow، Subscribe، NameTag. أي فيديو ≥ 12.5 دقيقة يفشل في البوابة مهما فُعل (ظهر في فيديو الأردن 14:55).

**المقترح (أحد اثنين):** (1) `need = min(9, …)` ويُحدَّث `SPEC_KIT` ليطابق المعتمد؛ أو (2) إعادة اعتماد عنصر نوعه عاشر للنصوص الطويلة.

**أثر الانتظار:** بوابة `mg_usage_audit` تفشل في `stage check` لكل فيديو طويل، فيُهدر وقت المراجعة.
