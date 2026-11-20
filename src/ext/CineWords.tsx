import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, easeInOut, easeOut, lerp } from "./motion";
import { SfxTrack } from "./sfx";
import { ff, useFonts } from "./fonts";

/**
 * تمرين على مرجع «قبل وبعد» (ريل إنستغرام طولي 12.8ث، 2026-11-19، محفوظ في معرض المراجع):
 * تسجيل متحدث بلون سينمائي داكن دافئ وضوء ذهبي يتسرّب من الأعلى، وكلمات تظهر كلمةً كلمة بضبابية ووهج خفيف بخط فخم،
 * سطر صغير فوق كلمة كبيرة ممدودة بالكشيدة، ولقطات قاطعة: صفحة مصحف يمرّ عليها قلم التظليل، ونجمة زخرفية ذهبية تدور.
 * الكلمات هنا عبارات مفتاحية قليلة لا كتابةُ كلامٍ متصل (قاعدة «لا كابشن» في مونتاج الشيخ)، وكلها أسفل الصورة بعيداً عن الوجه واللحية.
 */
export const CINE_WORDS_FRAMES = 420;
const W = 1080, H = 1920;
export const GOLD = "#d9b24a";

/** ضوء ذهبي يتسرّب من زاوية ويتنفّس، وحبيبات خفيفة. */
export const Leak: React.FC = () => {
  const f = useCurrentFrame();
  const a = 0.5 + 0.15 * Math.sin(f / 23) + 0.08 * Math.sin(f / 7.3);
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at ${30 + 8 * Math.sin(f / 60)}% -5%, rgba(222,184,80,${a}), rgba(222,184,80,0) 70%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.65))" }} />
    </>
  );
};

/** كلمة تظهر بضبابية وصعود خفيف ووهج؛ تخرج بضبابية. */
export const Word: React.FC<{ at: number; until: number; text: string; font: Parameters<typeof ff>[0]; size: number; color?: string }> = ({ at, until, text, font, size, color = "#fffaf0" }) => {
  const f = useCurrentFrame();
  if (f < at || f >= until) return null;
  /* كما في المرجع الرابع (§٣٣): الكلمة تولد باهتة (٣٠٪) وتشتد في ٤ إطارات، وتصعد ١٤ بكسل في ٦، وتخرج في ٣ */
  const i = easeOut((f - at) / 6), o = clamp01((until - f) / 3);
  const k = Math.min(0.3 + 0.7 * clamp01((f - at) / 4), o);
  return <span style={{ display: "inline-block", margin: "0 0.12em", fontFamily: ff(font), fontSize: size, color, opacity: k, filter: `blur(${(1 - clamp01((f - at) / 4)) * 6}px)`, transform: `translateY(${(1 - i) * 14}px)`, textShadow: `0 0 ${18 + 10 * k}px rgba(255,236,190,.45)` }}>{text}</span>;
};
/** كلمة تمتد بالكشيدة بعد ظهورها (الأثر المميّز في المرجع). */
export const StretchWord: React.FC<{ at: number; until: number; a: string; b: string; size: number; font: Parameters<typeof ff>[0] }> = ({ at, until, a, b, size, font }) => {
  const f = useCurrentFrame();
  const n = Math.round(easeInOut((f - at - 6) / 18) * 6);
  return <Word at={at} until={until} text={a + "ـ".repeat(Math.max(0, n)) + b} font={font} size={size} />;
};
/** سطر من كلمات متتابعة. */
export const Line: React.FC<{ y: number; children: React.ReactNode }> = ({ y, children }) => (
  <div style={{ position: "absolute", left: 0, width: W, top: y, textAlign: "center", direction: "rtl", whiteSpace: "nowrap", lineHeight: 1.2 }}>{children}</div>
);

/** صورة الشيخ بلون سينمائي واقتراب بطيء. */
const Speaker: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  const s = lerp(1.0, 1.07, clamp01((f - from) / (to - from)));
  return <AbsoluteFill style={{ overflow: "hidden" }}><Img src={staticFile("sheikh_gallery/black/sheikh_iso3413.png")} style={{ width: W, height: H, objectFit: "cover", transform: `scale(${s})`, transformOrigin: "50% 30%", filter: "brightness(.62) contrast(1.18) saturate(.75) sepia(.18)" }} /></AbsoluteFill>;
};

/** صفحة مصحف (سورة العلق ١–٣) يمرّ قلم التظليل على الآية الأولى. */
export const Page: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame() - at;
  const k = easeOut(f / 14), hl = easeInOut((f - 22) / 20), z = lerp(1.0, 1.08, clamp01(f / 110));
  return (
    <AbsoluteFill style={{ background: "#0d0b08", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 880, padding: "44px 46px", background: "#f1ead8", transform: `scale(${z * (0.9 + 0.1 * k)}) rotate(${(1 - k) * -4}deg)`, opacity: k, boxShadow: "0 30px 60px rgba(0,0,0,.6)", direction: "rtl", textAlign: "center", fontFamily: ff("amiri") }}>
        <div style={{ border: `3px double #8a6b2a`, padding: "8px 0", fontSize: 44, color: "#3a2a12", marginBottom: 26 }}>سُورَةُ العَلَق</div>
        <div style={{ fontSize: 40, color: "#3a2a12", marginBottom: 14 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div style={{ fontSize: 54, lineHeight: 2, color: "#2a1d0c" }}>
          <span style={{ position: "relative", whiteSpace: "nowrap" }}>
            <span style={{ position: "absolute", right: 0, top: "18%", height: "64%", width: `${hl * 100}%`, background: "rgba(246,226,60,.75)", mixBlendMode: "multiply", borderRadius: 8 }} />
            اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ﴿١﴾
          </span>{" "}
          خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ﴿٢﴾ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ﴿٣﴾
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** نجمة زخرفية ذهبية بثماني نقاط تدور ببطء خلف الكلمات. */
export const Rosette: React.FC = () => {
  const f = useCurrentFrame();
  const star = (r1: number, r2: number, n = 8) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, a = (Math.PI * i) / n; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(" ");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #2a2110, #090806 70%)", alignItems: "center", justifyContent: "center" }}>
      <svg width={1000} height={1000} viewBox="-500 -500 1000 1000" style={{ transform: `rotate(${f * 0.25}deg)`, opacity: 0.85, marginTop: -260 }}>
        {[440, 360, 280, 200, 120].map((r, i) => <polygon key={r} points={star(r, r * 0.72)} fill="none" stroke={GOLD} strokeWidth={i === 0 ? 4 : 2} opacity={1 - i * 0.12} transform={`rotate(${i * 11.25})`} />)}
        {Array.from({ length: 16 }, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 8) * 460} y2={Math.sin((i * Math.PI) / 8) * 460} stroke={GOLD} strokeWidth={1} opacity={0.35} />)}
        <circle r={60} fill="none" stroke={GOLD} strokeWidth={3} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- الجدول ---------- */
const T = { a: 0, page: 125, ros: 230, b: 330 };

export const CineWords: React.FC = () => {
  useFonts(["mirza", "ruqaa", "amiri", "kafRuqaa"]);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0b0a08", overflow: "hidden" }}>
      {f < T.page && (<>
        <Speaker from={T.a} to={T.page} />
        <Line y={1430}><Word at={10} until={T.page} text="نحن" font="ruqaa" size={104} /><Word at={22} until={T.page} text="لسنا" font="ruqaa" size={104} /></Line>
        <Line y={1540}><StretchWord at={36} until={T.page} a="أمّ" b="ة" size={190} font="mirza" /><Word at={62} until={T.page} text="تقرأ" font="mirza" size={190} /></Line>
      </>)}
      {f >= T.page && f < T.ros && (<>
        <Page at={T.page} />
        <Line y={330}><Word at={T.page + 8} until={T.ros} text="قد" font="mirza" size={130} /><Word at={T.page + 18} until={T.ros} text="تقرأ" font="mirza" size={130} /><Word at={T.page + 30} until={T.ros} text="أكثر" font="mirza" size={130} color={GOLD} /></Line>
      </>)}
      {f >= T.ros && f < T.b && (<>
        <Rosette />
        <Line y={1250}><Word at={T.ros + 8} until={T.b} text="نحن" font="mirza" size={150} /><Word at={T.ros + 18} until={T.b} text="أمّة" font="mirza" size={150} /></Line>
        <Line y={1450}><StretchWord at={T.ros + 32} until={T.b} a="الق" b="راءة" size={200} font="kafRuqaa" /></Line>
      </>)}
      {f >= T.b && (<>
        <Speaker from={T.b} to={CINE_WORDS_FRAMES} />
        <Line y={1430}><Word at={T.b + 8} until={CINE_WORDS_FRAMES} text="التي" font="ruqaa" size={104} /><Word at={T.b + 16} until={CINE_WORDS_FRAMES} text="تربط" font="ruqaa" size={104} /><Word at={T.b + 24} until={CINE_WORDS_FRAMES} text="المخلوق" font="ruqaa" size={104} /></Line>
        <Line y={1540}><StretchWord at={T.b + 38} until={CINE_WORDS_FRAMES} a="بالخ" b="الق" size={190} font="mirza" /></Line>
      </>)}
      <Leak />
      <SfxTrack cues={[[8,"shimmer"],[125,"subdrop"],[147,"swipe"],[230,"hit"],[262,"swell"],[330,"subdrop"],[368,"shimmer"]]} />
    </AbsoluteFill>
  );
};
