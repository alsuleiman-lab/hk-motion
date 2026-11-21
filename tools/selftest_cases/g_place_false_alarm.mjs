// (2026-11-21) the placement watch took the user's «المونتاج ما يأخذ أكثر من نص ساعة… النص ساعة هذا الحد الأعلى» for a move order («نص» = half, «الأعلى» = the maximum)
export default async ({ add, expect, mkRoot, hook }) => {
  const G = "tools/hooks/guard.mjs";
  const asks = async (r, prompt) => /📐/.test((await hook(r, "prompt", { session_id: "st", prompt, cwd: r })).context);
  add("place.no_false_alarm_half_hour", G, "placement-fix-delayed", "«نص ساعة» و«الحد الأعلى» ليسا طلب نقل؛ و«انقل الصورة لفوق» و«الخريطة كبّرها» طلبا نقل", async () => {
    const r = mkRoot("place_false_alarm");
    const a = await asks(r, "طيب الآن أنا لما أعطيتك تعمل المونتاج أنت طولت جدا. أنا بدي المونتاج ما يأخذ أكثر من نص ساعة، يعني النص ساعة هذا الحد الأعلى");
    const b = await asks(r, "انقل الصورة لفوق");
    const c = await asks(r, "الخريطة كبرها شوي");
    return expect(!a && b && c, `نص ساعة=${a} انقل الصورة=${b} الخريطة كبرها=${c}`);
  });
};
