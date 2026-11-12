// STRICT HYBRID GATE (user order 2026-11-09: «نعتمد الهجين بصرامة، ولا يحدث خطأ يجعلك تستعمل الآخر»).
// Every final-render entry point of the OLD path (render_final / render_chunked / render_clip) calls requireHybrid() first and STOPS,
// unless the user's current message explicitly asked for the old path — only then is LEGACY_RENDER_USER_OK=<the user's words> set on the command.
// The final render is tools/hybrid_any.mjs. A composition the hybrid cannot draw is PORTED to HybridHost/VSlot (never silently rendered the old way).
export function requireHybrid(tool) {
  const ok = (process.env.LEGACY_RENDER_USER_OK ?? "").trim();
  if (ok) { console.error(`تحذير: ${tool} (المسار القديم) يعمل بإذن صريح من المستخدم: «${ok}»`); return; }
  console.error(`ممنوع: ${tool} هو المسار القديم. الرندر النهائي بالمسار المختلط حصراً (R-RENDER-SPEED.5):\n  node tools/hybrid_any.mjs --comp <المعرّف> --out <ملف.mp4>\nتركيبة لا يرسمها الهجين (طولي، splits/solos/behind/mini) تُنقل إلى HybridHost/VSlot ولا تُرندَر بالقديم؛ والاستثناء بنص المستخدم في رسالته الحالية فقط (LEGACY_RENDER_USER_OK="<كلامه>").`);
  process.exit(4);
}
