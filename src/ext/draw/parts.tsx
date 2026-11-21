import React from "react";
import { type V2, add, sub, mul, norm, perp, lerp2, smoothPath, linePath } from "./construct";

/**
 * مكتبة أعضاء مبنية بقواعد (أمر المستخدم 2026-11-20: «اليد طالعة من مكان غريب»):
 * - اليد لا تظهر إلا من حافة كمّ، والكمّ لا يظهر إلا من تحت حافة العباءة أو من الكتف.
 * - القبضة الممسكة بلجام أو رمح: ظهر الكف، ثم أربع أصابع ملتفّة حول الشيء، والإبهام فوقها.
 * - كل المقاسات بالأمتار مضروبة في نقاط المتر عند عمق صاحبها.
 */

const SKIN = { base: "#dcab84", shade: "#ad7853", light: "#f2cfaa", line: "#6b4630" };

/** محوران للقبضة: u على امتداد الساعد نحو المفاصل، وv عرضي؛ v الموجب إلى الأعلى (حيث الإبهام) */
const handAxes = (elbow: V2, wrist: V2) => {
  const u = norm(sub(wrist, elbow));
  let v = perp(u);
  if (v.y > 0) v = mul(v, -1); // الإبهام فوق القبضة حين تمسك لجاماً أو رمحاً
  return { u, v };
};

/**
 * قبضة ممسكة: ظهر الكف من الرسغ إلى المفاصل، ثم الأصابع الأربع ملتفّة (كل إصبع ٢سم عرضاً)، والإبهام يلتف فوقها.
 * grip: نقطتا الشيء الممسوك (لجام أو رمح) فيُرسم مارّاً بين الأصابع.
 */
export const Fist: React.FC<{ elbow: V2; wrist: V2; s: number; tone?: number; grip?: [V2, V2]; gripW?: number; gripColor?: string }> = ({ elbow, wrist, s, tone = 0, grip, gripW = 2, gripColor = "#16100d" }) => {
  const { u, v } = handAxes(elbow, wrist);
  const P = (a: number, b: number): V2 => add(wrist, add(mul(u, a * s), mul(v, b * s)));
  const sk = tone ? { ...SKIN, base: "#d2a07a" } : SKIN;
  if (0.1 * s < 10) {
    // بعيدة: قفاز بسيط بخط ثني واحد (التفصيل أصغر من أن يُرى)
    return (
      <g>
        {grip && <path d={linePath(grip)} stroke={gripColor} strokeWidth={gripW} fill="none" />}
        <path d={smoothPath([P(0, -0.03), P(0.06, -0.045), P(0.105, -0.03), P(0.11, 0.02), P(0.07, 0.045), P(0, 0.032)])} fill={sk.base} stroke={sk.line} strokeWidth={Math.max(0.5, 0.004 * s)} />
        <path d={linePath([P(0.075, -0.035), P(0.08, 0.03)])} stroke={sk.shade} strokeWidth={Math.max(0.5, 0.003 * s)} />
      </g>
    );
  }
  const lw = Math.max(0.6, 0.0035 * s);
  // ظهر الكف: يتسع من الرسغ (٥٫٦سم) إلى المفاصل (٨٫٤سم)
  const back = smoothPath([P(-0.005, -0.028), P(0.04, -0.038), P(0.075, -0.043), P(0.08, 0.0), P(0.075, 0.04), P(0.04, 0.036), P(-0.005, 0.03)]);
  // الأصابع الأربع ملتفّة: كل إصبع كتلة مستديرة الطرف
  const fingers = [0, 1, 2, 3].map((i) => {
    const b0 = -0.043 + i * 0.0215, b1 = b0 + 0.0215;
    const curl = i === 3 ? 0.006 : 0; // الخنصر أقصر
    return smoothPath([P(0.07, b0 + 0.001), P(0.1 - curl, b0 + 0.001), P(0.113 - curl, (b0 + b1) / 2), P(0.1 - curl, b1 - 0.001), P(0.07, b1 - 0.001)]);
  });
  const thumb = smoothPath([P(0.01, 0.03), P(0.05, 0.05), P(0.088, 0.04), P(0.096, 0.026), P(0.075, 0.022), P(0.04, 0.026)]);
  return (
    <g>
      {grip && <path d={linePath([grip[0], P(0.095, 0.0)])} stroke={gripColor} strokeWidth={gripW} fill="none" />}
      <path d={back} fill={sk.base} stroke={sk.line} strokeWidth={lw} />
      <path d={smoothPath([P(0.0, -0.026), P(0.05, -0.036), P(0.07, -0.04), P(0.06, -0.01), P(0.02, -0.012)])} fill={sk.shade} opacity={0.45} />
      {fingers.map((d, i) => <path key={i} d={d} fill={i % 2 ? sk.base : hexShift(sk.base)} stroke={sk.line} strokeWidth={lw * 0.8} />)}
      {/* المفاصل: نتوءات فاتحة على خط واحد */}
      {[0, 1, 2, 3].map((i) => { const c = P(0.072, -0.033 + i * 0.0215); return <ellipse key={"k" + i} cx={c.x} cy={c.y} rx={0.007 * s} ry={0.005 * s} fill={sk.light} opacity={0.7} />; })}
      {grip && <path d={linePath([P(0.095, 0.0), grip[1]])} stroke={gripColor} strokeWidth={gripW} fill="none" />}
      <path d={thumb} fill={sk.base} stroke={sk.line} strokeWidth={lw} />
      <path d={linePath([P(0.06, 0.03), P(0.085, 0.03)])} stroke={sk.shade} strokeWidth={lw * 0.8} />
    </g>
  );
};

const hexShift = (h: string) => {
  const v = parseInt(h.slice(1), 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.max(0, x - 14));
  return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
};

/**
 * ساعد في كمّ: يخرج من نقطة start (حافة العباءة أو المرفق) إلى الرسغ، يضيق قليلاً،
 * وينتهي بحافة كمّ أعرض بقليل؛ ومنها وحدها تخرج اليد.
 */
export const Sleeve: React.FC<{ start: V2; wrist: V2; s: number; w0?: number; w1?: number; fill: string; edge: string; line: string; lw: number }> = ({ start, wrist, s, w0 = 0.055, w1 = 0.04, fill, edge, line, lw }) => {
  const u = norm(sub(wrist, start)), n = perp(u);
  const cuffA = add(wrist, mul(u, -0.035 * s));
  const d = smoothPath([add(start, mul(n, w0 * s)), add(lerp2(start, wrist, 0.5), mul(n, (w0 * 0.55 + w1 * 0.45) * s)), add(cuffA, mul(n, w1 * s)), add(wrist, mul(n, (w1 + 0.006) * s)),
    sub(wrist, mul(n, (w1 + 0.006) * s)), sub(cuffA, mul(n, w1 * s)), sub(lerp2(start, wrist, 0.5), mul(n, (w0 * 0.55 + w1 * 0.45) * s)), sub(start, mul(n, w0 * s))]);
  return (
    <g>
      <path d={d} fill={fill} stroke={line} strokeWidth={lw} />
      {/* حافة الكمّ: خط عرضي عند الرسغ، ومنه تخرج اليد */}
      <path d={linePath([add(cuffA, mul(n, w1 * s)), sub(cuffA, mul(n, w1 * s))])} stroke={edge} strokeWidth={lw * 1.2} fill="none" />
      {/* طيّة الساعد: من المرفق مائلة نحو الرسغ */}
      <path d={linePath([add(lerp2(start, wrist, 0.2), mul(n, w0 * 0.7 * s)), add(lerp2(start, wrist, 0.45), mul(n, -w0 * 0.1 * s))])} stroke={line} strokeWidth={lw * 0.8} opacity={0.6} fill="none" />
    </g>
  );
};
