import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HybridHost, HybridBg, VSlot } from "../hybrid/Slot";
import { ff, useFonts } from "./fonts";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { back } from "./PaperSteps";

/**
 * صورة المتحدث عنصر متحرك في المشهد (أمر المستخدم 2026-11-19): تبدأ كاملة والرسوم فوق صدره وجانب رأسه،
 * ثم تنزاح إلى الجانب على خلفية سادة يُكتب عليها، ثم ترجع قليلاً، ثم تُوضع في الوسط وتُكتب الكلمات حولها.
 * فيديو المتحدث هو الملف المرفوع (public/dubkmr/src.mp4)، وكل الكتابة بالخط الفخم.
 */
export const ACTIVE_FRAMES = 1080; // 36 ثانية
const W = 1080, H = 1920;
const C = { cream: "#ece3d3", maroon: "#6b1b2b", teal: "#1f6b66", ink: "#2a1518" };

/* مسار الصورة: [زمن بالثواني، يسار، أعلى، عرض، ارتفاع] */
const KF: number[][] = [
  [0.0, 0, 0, 1080, 1920],
  [1.2, 0, 0, 1080, 1920],
  [2.0, 600, 560, 432, 768],
  [2.6, 560, 520, 480, 853],
  [3.4, 270, 120, 540, 960],
  [9.0, 250, 100, 580, 1031],
  [17.0, 270, 120, 540, 960],
  [17.8, 560, 560, 432, 768],
  [20.0, 560, 560, 432, 768],
  [21.5, 1200, 560, 432, 768],
  [22.4, 1200, 560, 432, 768],
  [23.4, 0, 0, 1080, 1920],
  [26.0, 0, 0, 1080, 1920],
  [26.5, -1300, 0, 1080, 1920],
  [32.6, -1300, 120, 540, 960],
  [33.3, 270, 120, 540, 960],
  [40.0, 270, 120, 540, 960],
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
  if (t < at || t > at + 1.2) return null;
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={C.maroon} strokeWidth={6} strokeLinecap="round" /></svg>;
};

/* مربع التحديد الذي يتحرك بين الكلمات (كما في المرجع): يُرسم بخط ثخين ويتنقّل بين الهدفين بإطار الكتابة */
const BOX_KF: number[][] = [
  [21.6, 220, 1380, 640, 170],
  [22.4, 220, 1380, 640, 170],
  [23.0, 180, 1280, 760, 200],
  [23.8, 180, 1280, 760, 200],
  [25.2, 240, 1400, 600, 150],
  [26.0, 240, 1400, 600, 150],
];
const MovingBox: React.FC = () => {
  const t = useCurrentFrame() / 30;
  if (t < BOX_KF[0][0] || t >= 26.0) return null;
  let [x, y, w, h] = BOX_KF[BOX_KF.length - 1].slice(1);
  for (let i = 0; i < BOX_KF.length - 1; i++) {
    const a = BOX_KF[i], b = BOX_KF[i + 1];
    if (t >= a[0] && t < b[0]) {
      const k = easeInOut((t - a[0]) / (b[0] - a[0]));
      [x, y, w, h] = [1, 2, 3, 4].map((j) => lerp(a[j], b[j], k));
      break;
    }
  }
  const draw = easeOut((t - BOX_KF[0][0]) / 0.5);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `7px solid ${C.maroon}`, borderRadius: 14, boxSizing: "border-box", clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`, boxShadow: "0 8px 18px rgba(0,0,0,.25)" }} />
  );
};

/** شاشة كاملة تنزلق من جهة بميل ثم تستقيم، وتبقى حتى تغطيها التالية. out = شاشة شفافة الوسط تحت الصورة (للأخيرة) */
const SlideScreen: React.FC<{ at: number; until: number; from: "r" | "l" | "b"; color: string; out?: boolean; children: React.ReactNode }> = ({ at, until, from, color, out, children }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t >= until) return null;
  const k = easeOut((t - at) / 0.45), d = 1 - k;
  const tx = from === "r" ? d * 1200 : from === "l" ? -d * 1200 : 0, ty = from === "b" ? d * 2000 : 0;
  const grid = color === C.cream ? "rgba(42,28,31,.06)" : "rgba(255,255,255,.07)";
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${tx}px, ${ty}px) rotate(${d * (from === "l" ? -7 : 7)}deg)`, boxShadow: "0 0 60px rgba(0,0,0,.3)", background: out ? "transparent" : color, backgroundImage: out ? undefined : `linear-gradient(${grid} 2px, transparent 2px), linear-gradient(90deg, ${grid} 2px, transparent 2px)`, backgroundSize: "54px 54px" }}>
      {children}
    </div>
  );
};
const Counter: React.FC<{ at: number; to: number }> = ({ at, to }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const n = Math.round(to * easeOut((t - at) / 1.4));
  return <div style={{ position: "absolute", left: 0, width: W, top: 460, textAlign: "center", fontFamily: ff("rakkas"), fontSize: 240, color: C.cream, textShadow: `10px 10px 0 ${C.ink}`, direction: "rtl" }}>{n.toLocaleString("ar-EG")} ساعة</div>;
};
const Bar: React.FC<{ at: number; i: number; text: string }> = ({ at, i, text }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const k = back((t - at) / 0.3, 1.4);
  const col = [C.maroon, C.cream, C.ink, C.maroon][i];
  return <div style={{ position: "absolute", left: 140 + (1 - Math.min(1, k)) * 900, top: 1640 - i * 150, width: 800, height: 120, background: col, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("ruqaa"), fontSize: 80, color: col === C.cream ? C.ink : C.cream, boxShadow: "0 10px 20px rgba(0,0,0,.3)", direction: "rtl" }}>{text}</div>;
};
const Button: React.FC<{ at: number }> = ({ at }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const k = back((t - at) / 0.3, 2.2), pulse = 1 + 0.04 * Math.sin((t - at) * 6);
  return <div style={{ position: "absolute", left: W / 2 - 220, top: 1580, width: 440, height: 140, borderRadius: 70, background: C.maroon, boxShadow: `8px 8px 0 ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff("rakkas"), fontSize: 100, color: C.cream, transform: `scale(${Math.max(0, k) * pulse})`, direction: "rtl" }}>كلّمني</div>;
};

export const ActiveSpeaker: React.FC = () => {
  useFonts(["rakkas", "ruqaa"]);
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const [x, y, w, h] = frameBox(t);
  /* قلب البطاقة: الصورة تضيق حتى تختفي، ويظهر ظهرها (صورة شارحة) ثم تعود الصورة */
  /* قلب واقعي: الصورة ثابتة (لقطة من لحظة القلب) تدور ٠ إلى ١٨٠ ثم تعود، مع منظور ثلاثي الأبعاد */
  const flipping = t >= 5.6 && t < 8.0;
  const flipAng = t < 5.6 ? 0 : t < 6.0 ? (180 * (t - 5.6)) / 0.4 : t < 7.6 ? 180 : t < 8.0 ? 180 + (180 * (t - 7.6)) / 0.4 : 360;

  /* ميلان خفيف أثناء القلب يعطي إحساس البطاقة في الفراغ */

  /* الخلفية تتحول من الفيديو إلى السادة بعد أن تنزاح الصورة */
  const plain = t >= 1.2;
  return (
    <HybridHost>
      <HybridBg>
        <AbsoluteFill style={{ background: C.cream }} />
      </HybridBg>
      {plain && <AbsoluteFill style={{ background: C.cream, backgroundImage: "linear-gradient(rgba(42,28,31,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,28,31,.06) 2px, transparent 2px)", backgroundSize: "54px 54px" }} />}
      {w < 1000 && !flipping && <div style={{ position: "absolute", left: x - 14, top: y - 14, width: w + 28, height: h + 28, background: "#fffdf6", borderRadius: 26, boxShadow: "0 18px 34px rgba(0,0,0,.28)", transformOrigin: "50% 50%" }} />}
      {!flipping && <VSlot src="dubkmr/src.mp4" w={w} h={h} radius={w > 1000 ? 0 : 26} vx={0} vy={0} vw={w} vh={h} style={{ left: x, top: y, transformOrigin: "50% 50%" }} grow={0} />}

      {flipping && (
        <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1600 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flipAng}deg)`, transformOrigin: "50% 50%" }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 26, overflow: "hidden", boxShadow: "0 18px 34px rgba(0,0,0,.35)" }}>
              <Img src={staticFile("dubkmr/flip_still.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 26, background: "#fffdf6", boxShadow: "0 18px 34px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="88%" height="80%" viewBox="0 0 400 600">
                <rect x="30" y="40" width="340" height="110" rx="18" fill="none" stroke={C.maroon} strokeWidth="8" />
                <text x="200" y="110" textAnchor="middle" fontFamily={ff("ruqaa")} fontSize="44" fill={C.maroon}>الوصف بالكلام</text>
                <line x1="200" y1="160" x2="200" y2="260" stroke={C.teal} strokeWidth="10" strokeLinecap="round" />
                <polygon points="170,250 230,250 200,300" fill={C.teal} />
                <rect x="30" y="310" width="340" height="110" rx="18" fill="none" stroke={C.maroon} strokeWidth="8" />
                <text x="200" y="380" textAnchor="middle" fontFamily={ff("ruqaa")} fontSize="44" fill={C.maroon}>الحركة</text>
                <line x1="200" y1="430" x2="200" y2="500" stroke={C.teal} strokeWidth="10" strokeLinecap="round" />
                <polygon points="174,480 226,480 200,520" fill={C.teal} />
                <text x="200" y="590" textAnchor="middle" fontFamily={ff("rakkas")} fontSize="64" fill={C.teal}>موشن</text>
              </svg>
            </div>
          </div>
        </div>
      )}
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
      <Word at={17.6} out={21.5} x={20} y={520} w={520} size={84} text="تبي تتعلم كيف؟" color={C.maroon} shadow={C.cream} font="ruqaa" />
      <Word at={18.4} out={21.5} x={0} y={680} w={560} size={118} text="اكتب موشن" color={C.teal} shadow={C.cream} stretch={6} />
      <Word at={19.0} out={21.5} x={20} y={960} w={520} size={84} text="تبي إعلانك كذا؟" color={C.maroon} shadow={C.cream} font="ruqaa" />
      <Word at={19.6} out={21.5} x={20} y={1090} w={520} size={70} text="فريقنا يسويه لك" color={C.teal} shadow={C.cream} font="ruqaa" />

      {/* من ٢٠ ثانية: شاشة الكتابة فقط، ومربع يتحرك بخط بين الكلمات */}
      <Word at={20.6} out={21.8} x={0} y={640} size={150} text="كتابة بس" color={C.teal} shadow={C.cream} />
      <MovingBox />

      {/* من ٢٦ ثانية: شاشات تنزلق فوق بعضها بميل (كما في المرجع) */}
      <SlideScreen at={26.0} until={29.9} from="r" color={C.teal}>
        <Word at={26.4} x={0} y={300} size={110} text="شغلك الحين:" color={C.cream} shadow={C.ink} font="ruqaa" />
        <Counter at={26.6} to={14} />
        {["تصدير", "تحريك", "طبقات", "مونتاج"].map((s, i) => <Bar key={s} at={27.4 + i * 0.35} i={i} text={s} />)}
      </SlideScreen>
      <SlideScreen at={29.5} until={33.0} from="b" color={C.maroon}>
        <Word at={29.9} x={0} y={640} size={120} text="وكل هذا" color={C.cream} shadow={C.ink} font="ruqaa" />
        <Word at={30.3} x={0} y={820} size={230} text="بضربة وحدة" color={C.cream} shadow={C.teal} stretch={24} />
      </SlideScreen>
      <SlideScreen at={32.4} until={99} from="l" color={C.cream} out>
        <Word at={33.4} x={0} y={1180} size={150} text="تبي إعلانك كذا؟" color={C.maroon} shadow={C.cream} />
        <Word at={34.0} x={0} y={1380} size={90} text="فريقنا يسويه لك" color={C.teal} shadow={C.cream} font="ruqaa" />
        <Button at={34.6} />
      </SlideScreen>

      {/* من ٢٣ ثانية: الصورة كاملة والكتابة فوقها */}
      <Word at={23.6} out={26.0} x={0} y={1340} size={110} text="شوف الكتابة فوقها" color={C.cream} shadow={C.maroon} />
      <Word at={25.0} out={26.0} x={0} y={1460} size={80} text="والكتابة تتحرك معها" color={C.cream} shadow={C.maroon} font="ruqaa" />
    </HybridHost>
  );
};
