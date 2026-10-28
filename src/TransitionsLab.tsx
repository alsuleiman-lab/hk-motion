import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { HandheldShake, HeatFlash, Iris, MGTheme, useT } from "./MG";
import { StatRow, useFonts } from "./EuKit";
import { WarmBase } from "./PortraitKit";
import { PaperCoverKit, PAPER_COVER_END } from "./CoverKit";
import { Curtain, LandFootage, SplitCards } from "./MontageSpec";
import { BRAND } from "./brand";
import { TrAccentWipe, TrDoors, TrPageTurn, TrPush, TrSection, TrZoomFade } from "./Transitions";

/**
 * TransitionsLab — every transition and camera move of the montage, played between two real scenes (his recording → a montage scene),
 * with the same components and values the engine uses. The live gallery page (tools/gallery_build.mjs) plays these in Remotion Player
 * (user 2026-10-28: «فرّق بين الأشكال والانتقالات واكتبها برمجياً»). Each scene is 90 frames (3 s); the switch is at 1.5 s.
 */
const CUT = "kit_sample_sheikh.mp4";
const SWITCH = 1.5;
const SPLIT = { from: 0, to: 99, clip: { x: 140, w: 632 }, sheikh: { x: 772, w: 1148 }, clipName: "اسم المقطع المعروض" };

/** scene A: his recording, full frame */
const SceneA: React.FC = () => <OffthreadVideo src={staticFile(CUT)} muted style={{ width: 1920, height: 1080 }} />;
/** scene B: a montage scene on the decorated base */
const SceneB: React.FC = () => (
  <AbsoluteFill>
    <WarmBase />
    <StatRow at={SWITCH + 0.1} x={560} y={430} w={800} h={170} icon="Quote" label="المشهد التالي" sub="بعد الانتقال" />
  </AbsoluteFill>
);
/** A before `at`, B after */
const Switch: React.FC<{ at: number; a: React.ReactNode; b: React.ReactNode }> = ({ at, a, b }) => <>{useT() < at ? a : b}</>;
const Cover: React.FC = () => (useCurrentFrame() < PAPER_COVER_END ? <PaperCoverKit format="landscape" line1="عنوان الغلاف" line2="سطر تحت العنوان" /> : null);

export const TRANSITIONS: Record<string, { ar: string; where: string; kit: string; node: React.ReactNode }> = {
  Curtain: { ar: "الستارة بين التخطيطين", kit: "MontageSpec", where: "عند كل تبديل بين إطاره الكامل وبطاقتي نصف الشاشة: لوح بالخلفية المزخرفة يعبر ويتبدّل التخطيط خلفه.",
    node: <><Switch at={SWITCH} a={<SceneA />} b={<SplitCards cut={CUT} sp={SPLIT} />} /><Curtain at={SWITCH} /></> },
  Iris: { ar: "قرص متسع", kit: "MG", where: "قطع بين مشهدين بقرص لوني يتسع من نقطة ثم يظهر المشهد التالي.",
    node: <><Switch at={SWITCH} a={<SceneA />} b={<SceneB />} /><Sequence durationInFrames={Math.round(SWITCH * 30)} layout="none"><Iris at={SWITCH - 0.5} cx={990} cy={330} dur={0.5} color={BRAND.navy} /></Sequence></> },
  HeatFlash: { ar: "وهج الانتقال الحار", kit: "MG", where: "عند تغيير الموضوع: وهج قصير يمرّ والمشهد يتبدّل تحته.",
    node: <HeatFlash at={SWITCH - 0.3} dur={0.6}><Switch at={SWITCH} a={<SceneA />} b={<SceneB />} /></HeatFlash> },
  PaperCover: { ar: "الغلاف الورقي يتمزق", kit: "CoverKit", where: "افتتاح كل فيديو: الغلاف أول 3 إطارات ثم يتمزق الورق حتى الإطار 51 فيظهر التسجيل.",
    node: <><SceneA /><Cover /></> },
  PushIn: { ar: "تقريب الوجه", kit: "MontageSpec", where: "مرة في كل نافذة 3 دقائق عند كلام مهم: تقريب ناعم نحو وجهه ثم عودة.",
    node: <LandFootage cut={CUT} zooms={[{ from: 0.4, to: 1.9, amt: 0.08 }]} /> },
  HandheldShake: { ar: "اهتزاز كاميرا اليد", kit: "MG", where: "فقط أثناء الجملة الاعتراضية أو التهكمية: يهزّ لقطته كأنها كاميرا محمولة.",
    node: <HandheldShake windows={[{ from: 0.2, to: 2.8 }]} amp={6} rot={0.4}><SceneA /></HandheldShake> },
  TrPush: { ar: "دفع وانزلاق", kit: "Transitions", where: "الانتقال المعتاد بين مشهدين: المشهد الجديد يدفع القديم إلى اليسار مع تلاشٍ خفيف وخط بلون التمييز.",
    node: <TrPush at={SWITCH - 0.4} dur={0.8} a={<SceneA />} b={<SceneB />} /> },
  TrAccentWipe: { ar: "مسح بشريط التمييز", kit: "Transitions", where: "شريط مائل بلون التمييز يعبر من اليمين ويكشف المشهد الجديد خلفه.",
    node: <TrAccentWipe at={SWITCH - 0.4} dur={0.75} a={<SceneA />} b={<SceneB />} /> },
  TrZoomFade: { ar: "تقريب مع تلاشٍ", kit: "Transitions", where: "انتقال هادئ حين تستمر الفكرة: القديم يقترب ويتلاشى والجديد يستقر.",
    node: <TrZoomFade at={SWITCH - 0.35} dur={0.7} a={<SceneA />} b={<SceneB />} /> },
  TrPageTurn: { ar: "قلب الصفحة", kit: "Transitions", where: "عند الانتقال إلى مصدر مكتوب أو كتاب: المشهد يُقلب كصفحة على كعب يمين.",
    node: <TrPageTurn at={SWITCH - 0.45} dur={0.9} a={<SceneA />} b={<SceneB />} /> },
  TrDoors: { ar: "البابان المزخرفان", kit: "Transitions", where: "نصفا الخلفية المزخرفة ينغلقان على شق بلون التمييز ثم ينفتحان على المشهد الجديد.",
    node: <TrDoors at={SWITCH - 0.5} dur={1.0} a={<SceneA />} b={<SceneB />} /> },
  TrSection: { ar: "بطاقة القسم", kit: "Transitions", where: "عند تغيير الموضوع: الخلفية المزخرفة تصعد وعليها عنوان القسم الجديد، ثم ترتفع عن المشهد التالي.",
    node: <TrSection at={SWITCH - 0.9} dur={1.8} title="عنوان القسم التالي" sub="الجزء الثاني" a={<SceneA />} b={<SceneB />} /> },
};

export const TransitionScene: React.FC<{ id: string }> = ({ id }) => {
  useFonts();
  return (
    <MGTheme theme="steel">
      <AbsoluteFill style={{ overflow: "hidden", background: BRAND.base }}>{TRANSITIONS[id]?.node ?? null}</AbsoluteFill>
    </MGTheme>
  );
};
