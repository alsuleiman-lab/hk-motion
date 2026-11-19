import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { back } from "./PaperSteps";

/**
 * صورة المتحدث عنصر متحرك في المشهد (أمر المستخدم 2026-11-19): تبدأ كاملة والرسوم فوق صدره وجانب رأسه،
 * ثم تنزاح إلى الجانب على خلفية سادة يُكتب عليها، ثم ترجع قليلاً، ثم تُوضع في الوسط وتُكتب الكلمات حولها.
 * فيديو المتحدث هو الملف المرفوع (public/dubkmr/src.mp4)، وكل الكتابة بالخط الفخم.
 */
export const ACTIVE_FRAMES = 600; // 20 ثانية
const W = 1080, H = 1920;
const C = { cream: "#ece3d3", maroon: "#6b1b2b", teal: "#1f6b66", ink: "#2a1518" };

/* مسار الصورة: [زمن بالثواني، يسار، أعلى، عرض، ارتفاع] */
const KF: number[][] = [
  [0.0, 0, 0, 1080, 1920],
  [1.2, 0, 0, 1080, 1920],
  [2.0, 600, 560, 432, 768],
  [2.6, 560, 520, 480, 853],
  [3.4, 270, 120, 540, 960],
  [9.0, 270, 120, 540, 960],
  [17.0, 270, 120, 540, 960],
  [17.8, 560, 560, 432, 768],
  [30.0, 560, 560, 432, 768],
];
const frameBox = (t: number): number[] => {
  for (let i = 0; i < KF.length - 1; i++) {
    const a = KF[i], b = KF[i + 1];
    if (t >= a[0] && t < b[0]) {
      const k = easeInOut((t - a[0]) / (b[0] - a[0]));
      return [1, 2, 3, 4].map((j) => lerp(a[j], b[j], k));
    }
  }
  return KF[KF.length - 1].slice(1);
};

/** كلمة تدخل بوهج وانكماش ثم تخرج بالتلاشي */
const Word: React.FC<{ at: number; out?: number; x: number; y: number; w?: number; size: number; text: string; color?: string; shadow?: string; font?: Parameters<typeof ff>[0]; stretch?: number }> = ({ at, out, x, y, w = 1080, size, text, color = C.cream, shadow = C.maroon, font = "rakkas", stretch = 0 }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || (out !== undefined && t >= out)) return null;
  const k = back((t - at) / 0.22, 1.6);
  const fade = out !== undefined ? clamp01((out - t) / 0.12) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: "center", fontFamily: ff(font), fontSize: size, lineHeight: 1.1, color, textShadow: `${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px 0 ${shadow}`, direction: "rtl", letterSpacing: stretch ? stretch * clamp01((t - at) / 1.2) : undefined, opacity: fade, transform: `scale(${0.6 + 0.4 * Math.max(0, k)})` }}>{text}</div>
  );
};

/** خط يُرسم بين نقطتين (يصل الكلمة بالصورة) */
const Line: React.FC<{ at: number; x1: number; y1: number; x2: number; y2: number }> = ({ at, x1, y1, x2, y2 }) => {
  const t = useCurrentFrame() / 30;
  const k = easeOut((t - at) / 0.4);
  if (t < at) return null;
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={C.maroon} strokeWidth={6} strokeLinecap="round" /></svg>;
};

export const ActiveSpeaker: React.FC = () => {
  useFonts(["rakkas", "ruqaa"]);
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const [x, y, w, h] = frameBox(t);
  /* الخلفية تتحول من الفيديو إلى السادة بعد أن تنزاح الصورة */
  const plain = t >= 1.2;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: C.cream }} />
      </HybridBg>
      {plain && <AbsoluteFill style={{ background: C.cream, backgroundImage: "linear-gradient(rgba(42,28,31,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,28,31,.06) 2px, transparent 2px)", backgroundSize: "54px 54px" }} />}
      <VSlot src="dubkmr/src.mp4" w={w} h={h} radius={plain ? 26 : 0} vx={0} vy={0} vw={w} vh={h} style={{ left: x, top: y }} grow={0} />

      {/* المرحلة ١: فوق الصدر وجانب الرأس، والصورة كاملة */}
      <Word at={0.1} out={1.25} x={0} y={40} size={120} text="ما راح" color={C.cream} shadow={C.maroon} />
      <Word at={0.35} out={1.25} x={0} y={1260} size={240} text="تصدق" color={C.cream} shadow={C.maroon} />

      {/* المرحلة ٢: على الخلفية السادة وبجانب الصورة المنزاحة */}
      <Word at={1.5} out={3.1} x={40} y={560} w={520} size={110} text="شوف الحروف" color={C.maroon} shadow={C.cream} font="ruqaa" />
      <Word at={1.9} out={3.1} x={40} y={740} w={520} size={210} text="تتمدد" color={C.teal} shadow={C.cream} stretch={36} />
      <Line at={2.0} x1={560} y1={780} x2={600} y2={800} />

      {/* المرحلة ٤: الصورة في الوسط والكلمات حولها */}
      <Word at={3.7} out={9.0} x={0} y={1180} size={170} text="والكاميرا تطير" color={C.maroon} shadow={C.cream} />
      <Word at={4.5} out={9.0} x={0} y={1400} size={130} text="بدون ولا قطع" color={C.teal} shadow={C.cream} font="ruqaa" />
      <Word at={5.2} out={9.0} x={0} y={1560} size={120} text="تبي تتعلم؟" color={C.maroon} shadow={C.cream} font="ruqaa" />

      {/* من ٩ إلى ١٤ ثانية: الكتابة المتمددة والانتقال، والصورة في الوسط */}
      <Word at={9.2} out={14.0} x={0} y={1180} size={120} text="شوف الحروف كيف تتمدد" color={C.maroon} shadow={C.cream} font="ruqaa" stretch={30} />
      <Word at={10.5} out={14.0} x={0} y={1400} size={150} text="وهذا الانتقال؟" color={C.teal} shadow={C.cream} />

      {/* من ١٤ إلى ١٧ ثانية: الوصف الكامل للعملية */}
      <Word at={14.0} out={17.0} x={0} y={1180} size={170} text="كله بضربة وحدة" color={C.maroon} shadow={C.cream} />
      <Word at={14.6} out={17.0} x={0} y={1400} size={92} text="مونتاج · طبقات · تحريك · تصدير" color={C.teal} shadow={C.cream} font="ruqaa" />

      {/* من ١٧ إلى ٢٠ ثانية: الصورة تنزاح يميناً والكلام على اليسار */}
      <Word at={17.6} x={20} y={520} w={520} size={84} text="تبي تتعلم كيف؟" color={C.maroon} shadow={C.cream} font="ruqaa" />
      <Word at={18.4} x={0} y={680} w={560} size={118} text="اكتب موشن" color={C.teal} shadow={C.cream} stretch={6} />
      <Word at={19.0} x={20} y={960} w={520} size={84} text="تبي إعلانك كذا؟" color={C.maroon} shadow={C.cream} font="ruqaa" />
      <Word at={19.6} x={20} y={1090} w={520} size={70} text="فريقنا يسويه لك" color={C.teal} shadow={C.cream} font="ruqaa" />
    </HybridHost>
  );
};
