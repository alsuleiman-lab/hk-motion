import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HandheldShake, MGTheme, useT } from "./MG";
import { useFonts } from "./EuKit";
import { PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import { Curtain, LandFootage } from "./MontageSpec";
import { DebateDossier } from "./DebateLayouts";
import { BRAND, applyBrand } from "./brand";
import type { BrandName } from "./brand";
import { TrSection, TrHalftone } from "./Transitions";
import { GALLERY_CUT } from "./galleryCut";
import { TvOff } from "./GazaFx";

/**
 * TransitionsLab — every transition and camera move of the montage, played between two real photos (the scene-to-scene ones) or on his recording (the camera moves, the curtain, the cover),
 * with the same components and values the engine uses. The live gallery page (tools/gallery_build.mjs) plays these in Remotion Player
 * (user 2026-10-28: «فرّق بين الأشكال والانتقالات واكتبها برمجياً»). Each scene is 90 frames (3 s); the switch is at 1.5 s.
 */
const CUT = GALLERY_CUT;
const SWITCH = 1.5;

/** scene A: his recording, full frame */
const SceneA: React.FC = () => {   // portrait: the same crop around his face as the gallery's portrait stage (src/ElementsLab.tsx)
  const { width, height } = useVideoConfig();
  if (width > height) return <OffthreadVideo src={staticFile(CUT)} muted style={{ width: 1920, height: 1080 }} />;
  return <OffthreadVideo src={staticFile(CUT)} muted style={{ position: "absolute", top: 0, left: Math.round(540 - 966 * (1920 / 1080)), width: Math.round(1920 * (1920 / 1080)), height: 1920 }} />;
};
/** two real photos to judge a scene-to-scene transition by (user 2026-10-28: «جيب صورتين لتجريب الانتقالات»): the Azhar courtyard, then a mosque dome */
const Photo: React.FC<{ src: string }> = ({ src }) => { const { width, height } = useVideoConfig(); return <Img src={staticFile(src)} style={{ width, height, objectFit: "cover" }} />; };
const PhotoA: React.FC = () => <Photo src="people/azharCourt.jpg" />;
const PhotoB: React.FC = () => <Photo src="people/azharMosque.jpg" />;
/** A before `at`, B after */
const Switch: React.FC<{ at: number; a: React.ReactNode; b: React.ReactNode }> = ({ at, a, b }) => <>{useT() < at ? a : b}</>;
const Cover: React.FC = () => (useCurrentFrame() < PAPER_COVER_END ? <PaperCoverKit format="landscape" line1="عنوان الغلاف" line2="سطر تحت العنوان" /> : null);

export const TRANSITIONS: Record<string, { ar: string; where: string; kit: string; node: React.ReactNode }> = {
  Curtain: { ar: "الستارة بين التخطيطين", kit: "MontageSpec", where: "عند كل تبديل بين إطاره الكامل وتخطيط الرد (الكتل المنحوتة): لوح بالخلفية المزخرفة يعبر ويتبدّل التخطيط خلفه.",
    node: <><Switch at={SWITCH} a={<SceneA />} b={<DebateDossier at={SWITCH} main={{ src: CUT }} guest={{ src: "gallery_opp_clip.mp4", aspect: 544 / 720 }} />} /><Curtain at={SWITCH} /></> },
  PaperCover: { ar: "الغلاف الورقي يتمزق", kit: "CoverKit", where: "افتتاح كل فيديو: الغلاف أول 3 إطارات ثم يتمزق الورق حتى الإطار 35 فيظهر التسجيل.",
    node: <><SceneA /><Cover /></> },
  PushIn: { ar: "تقريب الوجه", kit: "MontageSpec", where: "مرة كل 2 دقائق عند كلام مهم: تقريب ناعم نحو وجهه ثم عودة بعد انتهاء الكلام المهم.",
    node: <LandFootage cut={CUT} zooms={[{ from: 0.4, to: 1.9, amt: 0.08 }]} /> },
  HandheldShake: { ar: "اهتزاز كاميرا اليد", kit: "MG", where: "فقط أثناء الجملة الاعتراضية أو التهكمية: يهزّ لقطته كأنها كاميرا محمولة.",
    node: <HandheldShake windows={[{ from: 0.2, to: 2.8 }]} amp={6} rot={0.4}><SceneA /></HandheldShake> },
  TrSection: { ar: "بطاقة القسم", kit: "Transitions", where: "عند تغيير الموضوع: الخلفية المزخرفة تصعد وعليها عنوان القسم الجديد، ثم ترتفع عن المشهد التالي.",
    node: <TrSection at={SWITCH - 0.9} dur={1.8} title="عنوان القسم التالي" sub="الجزء الثاني" a={<PhotoA />} b={<PhotoB />} /> },
  TrHalftone: { ar: "انتقال النقاط", kit: "Transitions", where: "بين فصلين أو مشهدين مختلفين: نقاط مطبوعة تكبر من الوسط حتى تغطي الإطار، يتبدّل المشهد تحتها، ثم تتلاشى؛ بديل للستارة إن وافقتَ عليه.",
    node: <TrHalftone at={SWITCH - 0.5} dur={1.0} a={<PhotoA />} b={<PhotoB />} /> },
  TvOff: { ar: "إطفاء الشاشة", kit: "MontageSpec", where: "عند أمره بإطفاء الشاشة أو لإغلاق مشهد كشاشة تلفاز تنطفئ: شريطان أسودان يغلقان من الأعلى والأسفل ثم يتقلص خط أبيض إلى نقطة، حركة بلا تدرج شفافية.",
    node: <><SceneA /><TvOff at={SWITCH} dur={0.6} /></> },
};

export const TransitionScene: React.FC<{ id: string; brand?: BrandName }> = ({ id, brand }) => {
  applyBrand(brand);
  useFonts();
  return (
    <MGTheme theme="steel">
      <AbsoluteFill style={{ overflow: "hidden", background: BRAND.base }}>{TRANSITIONS[id]?.node ?? null}</AbsoluteFill>
    </MGTheme>
  );
};
