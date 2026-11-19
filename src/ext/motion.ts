/**
 * أدوات حركة نقية (كلها دوال من رقم الإطار، لا حالة تتراكم بين الإطارات).
 */

/** السرعة والاتجاه من أي مسار نقي بفرق مركزي حول الإطار: استعملها لتحديد قوة التمدد أو الضبابية. */
export const velocityAt = (
  posAt: (f: number) => { x: number; y: number },
  frame: number,
  dt = 0.5,
): { vx: number; vy: number; speed: number; direction: number } => {
  const before = posAt(frame - dt);
  const after = posAt(frame + dt);
  const vx = (after.x - before.x) / (2 * dt);
  const vy = (after.y - before.y) / (2 * dt);
  return { vx, vy, speed: Math.hypot(vx, vy), direction: Math.atan2(vy, vx) };
};

/** تتبّع متأخر بلا محاكاة: الطبقة التابعة = حالة الطبقة الأولى قبل `delayFrames` إطاراً (ظل 2، شبح 4…). */
export const lagged = <T>(stateAt: (f: number) => T, frame: number, delayFrames: number): T =>
  stateAt(frame - delayFrames);

/** ارتداد مخمّد بصيغة مغلقة: t بالإطارات منذ الاصطدام؛ freq دورة/إطار (~0.1)، damping لكل إطار (~0.15). */
export const dampedSettle = (t: number, freq: number, damping: number): number =>
  t <= 0 ? 0 : Math.exp(-damping * t) * Math.sin(2 * Math.PI * freq * t);

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** تباطؤ نهاية ناعم (تكعيبي). */
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
/** تسارع ثم تباطؤ. */
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
