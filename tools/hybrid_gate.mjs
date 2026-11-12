// STRICT HYBRID GATE (user order 2026-11-09: «نعتمد الهجين بصرامة، ولا يحدث خطأ يجعلك تستعمل الآخر»).
// Every final-render entry point of the OLD path (render_final / render_chunked) calls requireHybrid() first and STOPS,
// unless the user's current message explicitly asked for the old path — only then is LEGACY_RENDER_USER_OK=<the user's words> set on the command.
// (2026-11-12, R-RENDER-GPU.1) The final render is tools/gpu_render.mjs (render_clip / render_trial / render_silent / hybrid_parallel now run it);
// tools/hybrid_any.mjs is the fallback, only with the user's permission. A video still decoded by Chromium is PORTED to <VSlot>.
export function requireHybrid(tool) {
  const ok = (process.env.LEGACY_RENDER_USER_OK ?? "").trim();
  if (ok) { console.error(`تحذير: ${tool} (المسار القديم) يعمل بإذن صريح من المستخدم: «${ok}»`); return; }
  console.error(`ممنوع: ${tool} هو المسار القديم. الرندر بالمحرّك الجديد على كرت الشاشة حصراً (R-RENDER-GPU.1):\n  node tools/gpu_render.mjs --comp <المعرّف> --out <ملف.mp4>   (مقطع: --start A --end B --no-bumper)\nفيديو ما زال يفكّه Chromium يُنقل إلى <VSlot> ولا يُرندَر بالقديم؛ والهجين hybrid_any احتياط بإذن المستخدم؛ والاستثناء للقديم بنص المستخدم في رسالته الحالية فقط (LEGACY_RENDER_USER_OK="<كلامه>").`);
  process.exit(4);
}
