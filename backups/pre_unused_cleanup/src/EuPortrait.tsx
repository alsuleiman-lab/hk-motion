import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, Video, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { Chip, Gfx, MGTheme, PaperBg, Stamp, Strike, T, useT } from "./MG";
import { THEMES } from "./mgThemes";
import { TitleBar } from "./TitleBar";
import { CoverKit } from "./CoverKit";
import { STEEL } from "./CoverTry4";
import { BClip, Banner, Correction, EU_FPS, SRC, Sources, EuAudio, EuVid, EuWord, NameTag, Sc, StatRow, Subscribe, TITLE, Whooshes, mkTW, useCardMotion, useFonts } from "./EuKit";
import portWords from "../public/eu/port_words.json";
import portMap from "../public/eu/port_map.json";

const tw = mkTW(portWords as EuWord[]);
export const EU_P_FRAMES = Math.ceil((portMap as { duration: number }).duration * EU_FPS);
export const EU_TITLE = "اشتعال أوروبي: مظاهرات في فرنسا وإيطاليا وبلجيكا";
const BAR = { timerBg: "linear-gradient(#23706f,#0f3c42)", titleBg: "linear-gradient(#0f3c42,#10282a)", timerText: "#e9f6f3", titleText: "#f4faf8", subText: "#bfdcd6" };

// ---- layout (portrait 1080x1920) ----
const PANEL = { x: 40, y: 80, w: 1000, h: 980 };           // clip / written area (top)
const CARD = { x: 40, y: 80, w: 1000, h: 640 };             // the Sheikh's card (TOP: user rule, never at the bottom)
const CROP_CARD = { x: 485, y: 0, w: 1000, h: 640 };        // window on the 1920x1080 recording
const CROP_FULL = { x: 681, y: 0, w: 608, h: 1080 };        // full-screen portrait window (head x ~ 985)

// ---- timeline anchors (all derived from the word timestamps) ----
const T_ITA = 5.0, T_ITA2 = 15.0, T_BEL = tw(9), T_LYON = tw(16), T_CAND = tw(17), T_FULL1 = tw(19, "الأسعار") - 0.4, T_Q = tw(28), T_FR = tw(1001), T_BENUM = tw(1019), T_CULT = tw(1025), T_LGBT = tw(1045), T_ISR = tw(1059), T_END = tw(116);
const ChipG: React.FC<React.ComponentProps<typeof Chip>> = (p) => { const t = useT(); return t < p.phrases[0].at ? null : <Chip {...p} />; };
const DUR = (portMap as { duration: number }).duration;

const SpeakerCard: React.FC<{ y?: number; phase?: number }> = ({ y = CARD.y, phase = 0 }) => {
  const m = useCardMotion(8, phase);
  return (
    <div style={{ position: "absolute", left: CARD.x, top: y + m.dy, width: CARD.w, height: CARD.h, borderRadius: 34, overflow: "hidden", border: `8px solid ${T.card}`, boxShadow: "0 24px 48px rgba(0,0,0,.38)", transform: `rotate(${m.rot}deg) scale(${m.scale})`, background: T.paper2 }}>
      <EuVid ver="port" w={CARD.w - 16} h={CARD.h - 16} crop={CROP_CARD} />
    </div>
  );
};

/** a window of the timeline where the speaker is in a card: [a,b) */
const Card: React.FC<{ a: number; b: number; y?: number; phase?: number }> = ({ a, b, y, phase }) => {
  const t = useT();
  if (t < a - 0.02 || t > b + 0.36) return null;
  const o = Math.min(Math.max(0, Math.min(1, (t - a) / 0.25)), Math.max(0, Math.min(1, (b + 0.34 - t) / 0.25)));
  return <AbsoluteFill style={{ opacity: o }}><SpeakerCard y={y} phase={phase} /></AbsoluteFill>;
};

const Full: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (t < a - 0.02 || t > b + 0.36) return null;
  return <EuVid ver="port" w={1080} h={1920} crop={CROP_FULL} />;
};

const Intro: React.FC<{ end: number }> = ({ end }) => {
  const studio = getRemotionEnvironment().isStudio;
  const p = { src: staticFile("eu/p_intro_v3.mp4"), muted: true, style: { position: "absolute" as const, inset: 0, width: 1080, height: 1920 } };
  return <Sequence from={0} durationInFrames={Math.ceil(end * EU_FPS)}>{studio ? <Video {...p} /> : <OffthreadVideo {...p} />}</Sequence>;
};

const Cover: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 3) return null;
  return <AbsoluteFill><CoverKit format="portrait" palette={STEEL} line1="أوروبا تحترق" line2="فرنسا · إيطاليا · بلجيكا" opp="" sheikh="eu/sheikh_cut.png" book="eu/prop_fr_blur15.jpg" /></AbsoluteFill>;
};

export const EuPortrait: React.FC = () => {
  useFonts();
  const t = useT();
  const full1 = (t >= T_FULL1 && t < T_Q - 0.1) || t >= T_END;
  return (
    <MGTheme theme="teal">
      <AbsoluteFill style={{ background: T.paper }}>
        <EuAudio ver="port" />
        <PaperBg tag=" " />
        <Whooshes at={[T_ITA, T_ITA2, T_BEL, T_LYON, T_CAND, T_FULL1, T_Q, T_FR, T_BENUM, T_CULT, T_LGBT, T_ISR, T_END]} />

        {/* 0-5 s: isolated Sheikh over a motion-graphics background (baked by tools/eu_intro.mjs) */}
        <Intro end={T_ITA} />

        {/* speaker: card scenes / full screen scenes */}
        <Card a={T_ITA} b={T_ITA2} />
        <Card a={T_ITA2} b={T_BEL - 0.05} phase={2} />
        <Card a={T_BEL} b={T_FULL1} phase={4} />
        <Card a={T_Q} b={T_END} phase={1} />
        <Full a={T_FULL1} b={T_Q - 0.05} />
        <Full a={T_END} b={DUR + 1} />

        <Gfx>
          {/* --- Italy riots (c2) then Italians' cost-of-living (c3, panel moves below the card) --- */}
          <Sc dy={680} a={T_ITA} b={T_ITA2 - 0.05}>
            <BClip n={2} at={T_ITA} dur={T_ITA2 - T_ITA} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} fy={0.45} />
            <Banner at={T_ITA + 0.3} x={70} y={110} w={560} text="إيطاليا" flag="it" />
          </Sc>
          <Sc dy={680} a={T_ITA2} b={T_BEL - 0.05}>
            <Banner at={tw(5, 0)} x={50} y={90} w={980} text="إيطاليا: ضيق المعيشة" flag="it" size={56} />
            <StatRow at={tw(5, "ضيق")} x={60} y={250} w={960} h={200} icon="Wallet" label="ضيق في المعيشة" rot={-1} />
            <StatRow at={tw(5, "الأسعار")} x={60} y={480} w={960} h={200} icon="TrendingUp" label="الأسعار غالية" rot={1} />
            <StatRow at={tw(5, "الرواتب")} x={60} y={710} w={960} h={200} icon="Banknote" label="والرواتب لا تكفي" rot={-1} />
          </Sc>
          {/* --- Belgium (c5 starts on the police horses) --- */}
          <Sc dy={680} a={T_BEL} b={T_LYON - 0.05}>
            <BClip n={5} at={T_BEL} dur={T_LYON - T_BEL} from={11} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} />
            <Banner at={T_BEL + 0.2} x={70} y={110} w={600} text="بلجيكا" flag="be" />
            <ChipG x={540} y={1000} size={50} phrases={[{ text: "الجامعات: دخولها صعب", at: tw(9, "الجامعات") }, { text: "التكاليف عالية", at: tw(11, "تكاليفها") }]} />
          </Sc>
          {/* --- Lyon: historic town hall set on fire (c6) --- */}
          <Sc dy={680} a={T_LYON} b={T_CAND - 0.05}>
            <BClip n={6} at={T_LYON} dur={T_CAND - T_LYON} from={0.2} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} fy={0.3} rot={-0.6} />
            <Banner at={T_LYON + 0.2} x={70} y={110} w={640} text="فرنسا · بلدية ليون" flag="fr" size={50} />
            <Stamp at={tw(16, "أحرقوا")} x={560} y={330} text="أُحرق!" size={74} />
          </Sc>
          {/* --- the French candidate (c4: logo area cropped out by the panel window) --- */}
          <Sc dy={680} a={T_CAND} b={T_FULL1 + 0.3}>
            <BClip n={4} at={T_CAND} dur={T_FULL1 - T_CAND + 0.3} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} speed={1} contain patch />
            <Correction at={tw(18, "هرمز")} dur={5.5} x={60} y={120} w={960} text="تصحيح: مضيق هرمز" />
          </Sc>
          {/* --- full-screen speaker: chips low on the chest --- */}
          <Sc a={T_FULL1} b={T_Q - 0.05} slide={0}>
            <ChipG x={540} y={1420} size={56} phrases={[{ text: "غلاء الأسعار", at: tw(19, "غلاء") }, { text: "الشعوب تضغط عليها الأسعار", at: tw(19, "شعوبها") }, { text: "ما عادت تسد حاجاتها", at: tw(19, "تسد") }]} />
          </Sc>
          {/* --- the question: where does the money go? --- */}
          <Sc dy={680} a={T_Q} b={T_FR - 0.05}>
            <Banner at={tw(28, 0)} x={50} y={90} w={980} text="أين تذهب الأموال؟" size={64} />
            <StatRow at={tw(28, "دافعية")} x={60} y={230} w={960} h={160} icon="Landmark" label="أموال دافعي الضرائب" sub="في تلك الدول" rot={-1} />
            <StatRow at={tw(29, "المنهوبة")} x={60} y={410} w={960} h={160} icon="Coins" label="الأموال المنهوبة" sub="من بلاد المسلمين أثناء الاستعمار" rot={1} />
            <StatRow at={tw(29, "الذهب")} x={60} y={590} w={960} h={160} icon="Gem" label="الذهب المنهوب" rot={-1} />
            <StatRow at={tw(30, "النقط")} x={60} y={770} w={960} h={160} icon="Droplets" label="النفط الذي امتُصّ من بلادنا" sub="ويُمتصّ حتى الآن" rot={1} />
          </Sc>
          {/* --- the wars: Chammal, Barkhane, Italy (from the correction recording) --- */}
          <Sc dy={680} a={T_FR} b={T_BENUM - 0.05}>
            <Sources x={40} bottom={702} w={640} size={20} links={[{ at: tw(1003, "شمال"), url: SRC.chammal }, { at: tw(1006, "برخان"), url: SRC.barkhaneHearing }, { at: tw(1011, "إيطاليا"), url: SRC.itOps }]} />
            <Banner at={T_FR + 0.1} x={50} y={90} w={980} text="حروب في الشرق الأوسط وإفريقيا" size={52} />
            <StatRow at={tw(1003, "شمال")} countAt={tw(1005, "ثلاثمية")} x={60} y={250} w={960} h={200} icon="Shield" label="فرنسا: عملية «شمال» 2025" sub="سوريا والعراق" flag="fr" to={322} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1006, "برخان")} countAt={tw(1007, "مليار")} x={60} y={480} w={960} h={200} icon="Swords" label="فرنسا: «برخان» (الساحل)" sub="نحو مليونَي يورو يومياً، بحسب متحدثين في الشيوخ" to={1} unit="مليار يورو سنوياً" rot={1} />
            <StatRow at={tw(1011, "إيطاليا")} countAt={tw(1012, "252")} x={60} y={710} w={960} h={200} icon="Globe" label="إيطاليا: العراق والشرق الأوسط" flag="it" to={252} unit="مليون يورو" rot={-1} />
          </Sc>
          <Sc dy={680} a={T_BENUM} b={T_CULT - 0.05}>
            <Sources x={40} bottom={702} w={640} size={20} links={[{ at: T_BENUM + 0.2, url: SRC.be24 }]} />
            <Banner at={T_BENUM + 0.1} x={50} y={90} w={980} text="بلجيكا: ضد داعش" flag="be" size={60} />
            <StatRow at={tw(1020, "أنفقت")} countAt={tw(1021, "24")} x={60} y={270} w={960} h={210} icon="Plane" label="طائرات F-16 (2020–2021)" sub="كلفة صافية" to={24} unit="مليون يورو" rot={-1} />
          </Sc>
          <Sc dy={680} a={T_CULT} b={T_LGBT - 0.05}>
            <Sources x={40} bottom={702} w={640} size={20} links={[{ at: T_CULT + 0.2, url: SRC.cultFr }]} />
            <Banner at={T_CULT + 0.1} x={50} y={90} w={980} text="نشر الثقافة: فرنسا" flag="fr" size={60} />
            <StatRow at={tw(1025, "86")} x={60} y={250} w={960} h={200} icon="Palette" label="التعاون الثقافي والترويج للفرنسية" sub="عام 2024" to={86} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1029, "806")} x={60} y={480} w={960} h={200} icon="Landmark" label="البرنامج الثقافي كله" sub="عام 2024" to={806} unit="مليون يورو" rot={1} />
          </Sc>
          <Sc dy={680} a={T_LGBT} b={T_ISR - 0.05}>
            <Sources x={40} bottom={702} w={640} size={20} links={[{ at: T_LGBT + 0.2, url: SRC.lgbtFr }]} />
            <Banner at={T_LGBT + 0.1} x={50} y={90} w={980} text="فرنسا: دعم المثلية الجنسية" flag="fr" size={56} />
            <StatRow at={tw(1046, "29")} x={60} y={250} w={960} h={200} icon="Calendar" label="بين 2017 و2022" to={29} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1047, "10")} x={60} y={480} w={960} h={200} icon="Calendar" label="السنوات الثلاث التالية" sub="مبلغ إضافي معلن" to={10} unit="ملايين يورو" rot={1} />
          </Sc>
          <Sc dy={680} a={T_ISR} b={T_END - 0.05}>
            <Sources x={40} bottom={702} w={640} size={20} links={[{ at: T_ISR + 0.2, url: SRC.euIsrael }]} />
            <Banner at={T_ISR + 0.1} x={50} y={90} w={980} text="دعم إسرائيل" flag="il" size={60} />
            <StatRow at={tw(1059, "نتنياهو")} x={60} y={250} w={960} h={210} icon="User" label="برنامج لدعم حكومة نتنياهو" sub="الدول الثلاث مجتمعة" photo="eu/people/netanyahu.jpg" rot={-1} />
            <StatRow at={tw(1060, "عشرة")} x={60} y={490} w={960} h={200} icon="Banknote" label="إجمالي أوروبي مشترك (2024)" sub="يُقسَّم على الدول الأوروبية" to={10} unit="ملايين يورو" rot={1} />
          </Sc>
          {/* --- conclusion on the full-screen speaker --- */}
          <Sc a={T_END} b={DUR + 1} slide={0}>
            <ChipG x={540} y={1400} size={58} phrases={[{ text: "بهرج خارجي", at: tw(116, "بهرج") }, { text: "هشاشة داخلية", at: tw(116, "هشاشة") }, { text: "تكاد أن تتكسر", at: tw(117, "تكاد") }, { text: "فماذا لو انهارت؟", at: tw(120, "فماذا") }]} />
            <Subscribe at={DUR - 3.6} x={540} y={1560} />
          </Sc>
          <NameTag at={19} x={540} y={640} />
                    <TitleBar title={EU_TITLE} theme={BAR} />
        </Gfx>
        <Cover />
      </AbsoluteFill>
    </MGTheme>
  );
};
void THEMES; void Img; void TITLE;
