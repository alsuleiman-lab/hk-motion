import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Video, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { Chip, Gfx, MGTheme, Stamp, Strike, T, useSp, useT } from "./MG";
import { HybridBg, HybridHost, VSlot, hyBg } from "./hybrid/Slot";
import { TitleBar } from "./TitleBar";
import { CoverKit } from "./CoverKit";
import { STEEL } from "./CoverTry4";
import { BClip, Banner, Correction, Pic, EU_FPS, SRC, Sources, EuAudio, EuVid, EuWord, Flag, FlagCode, NameTag, PaperBgL, Sc, StatRow, Subscribe, TEXT, TITLE, Whooshes, mkTW, useCardMotion, useFonts } from "./EuKit";
import landWords from "../public/eu/land_words.json";
import landMap from "../public/eu/land_map.json";

const tw = mkTW(landWords as EuWord[]);
const DUR = (landMap as { duration: number }).duration;
const TOTAL = 510;                       // 8:30 (user request)
const FIN = TOTAL - DUR;                  // seconds of the closing protests montage
export const EU_L_FRAMES = Math.ceil(TOTAL * EU_FPS);
const TITLE_TXT = "اشتعال أوروبي: مظاهرات في فرنسا وإيطاليا وبلجيكا";
const BAR = { timerBg: "linear-gradient(#23706f,#0f3c42)", titleBg: "linear-gradient(#0f3c42,#10282a)", timerText: "#e9f6f3", titleText: "#f4faf8", subText: "#bfdcd6" };

// ---- layout (landscape 1920x1080): written area / clip on the left, the Sheikh's card on the right ----
const LP = { x: 60, y: 60, w: 1000, h: 960 };
const LC = { x: 1100, y: 150, w: 760, h: 780 };
const CROP_CARD = { x: 613, y: 0, w: LC.w - 16, h: LC.h - 16 };
const INTRO = 5.0;

const ChipG: React.FC<React.ComponentProps<typeof Chip>> = (p) => { const t = useT(); return t < p.phrases[0].at ? null : <Chip {...p} />; };

const SideCard: React.FC<{ phase?: number }> = ({ phase = 0 }) => {
  const m = useCardMotion(8, phase);
  return (
    <div style={{ position: "absolute", left: LC.x, top: LC.y + m.dy, width: LC.w, height: LC.h, borderRadius: 34, overflow: "hidden", border: `8px solid ${T.card}`, boxShadow: "0 24px 48px rgba(0,0,0,.38)", transform: `rotate(${m.rot}deg) scale(${m.scale})`, background: hyBg(T.paper2) }}>
      <EuVid ver="land" w={LC.w - 16} h={LC.h - 16} crop={CROP_CARD} radius={26} />
    </div>
  );
};
const CardW: React.FC<{ a: number; b: number; phase?: number }> = ({ a, b, phase }) => {
  const t = useT();
  if (t < a - 0.02 || t > b + 0.36) return null;
  const o = Math.min(Math.max(0, Math.min(1, (t - a) / 0.25)), Math.max(0, Math.min(1, (b + 0.34 - t) / 0.25)));
  return <AbsoluteFill style={{ opacity: o }}><SideCard phase={phase} /></AbsoluteFill>;
};
const FullW: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (t < a - 0.02 || t > b + 0.36) return null;
  return <EuVid ver="land" w={1920} h={1080} crop={{ x: 0, y: 0, w: 1920, h: 1080 }} />;
};
const Intro: React.FC = () => {
  return <Sequence from={0} durationInFrames={Math.ceil(INTRO * EU_FPS)}><VSlot src="eu/l_intro_v2.mp4" w={1920} h={1080} /></Sequence>;
};
const Cover: React.FC = () => {
  const f = useCurrentFrame();
  // stays mounted (hidden) after the first 3 frames: unmounting its images mid-load made the renderer fail on the first frames
  return <AbsoluteFill style={{ opacity: f < 3 ? 1 : 0, pointerEvents: "none" }}><CoverKit format="landscape" palette={STEEL} line1="أوروبا تحترق" line2="فرنسا · إيطاليا · بلجيكا" opp="" sheikh="eu/sheikh_cut.png" book="eu/prop_fr_blur15.jpg" /></AbsoluteFill>;
};

/** a person photo tag (right/left band beside the speaker, never over the face) */
const PersonTag: React.FC<{ at: number; x: number; y: number; photo: string; name: string; dur?: number }> = ({ at, x, y, photo, name, dur = 6 }) => {
  const s = useSp(at, 13, 160), t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, Math.min(1, (dur - t) / 0.3)));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `rotate(-3deg) scale(${0.85 + 0.15 * s})`, background: T.card, padding: 14, paddingBottom: 10, borderRadius: 10, boxShadow: "0 18px 34px rgba(0,0,0,.3)", textAlign: "center" }}>
      <Pic src={photo} style={{ width: 230, height: 290, objectFit: "cover", objectPosition: "50% 12%", display: "block", borderRadius: 4 }} />
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 40, color: T.ink, marginTop: 8, direction: "rtl" }}>{name}</div>
    </div>
  );
};
const FlagTag: React.FC<{ at: number; x: number; y: number; c: FlagCode; name: string; dur?: number }> = ({ at, x, y, c, name, dur = 6 }) => {
  const s = useSp(at, 13, 160), t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, Math.min(1, (dur - t) / 0.3)));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `scale(${0.8 + 0.2 * s})`, textAlign: "center" }}>
      <Flag c={c} w={250} h={166} />
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 46, color: T.ink, marginTop: 8, direction: "rtl" }}>{name}</div>
    </div>
  );
};

/** panel that rises into place */
const Rise: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const s = useSp(at, 14, 150);
  return <AbsoluteFill style={{ opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 90}px)` }}>{children}</AbsoluteFill>;
};
const Label: React.FC<{ at: number; x: number; y: number; w: number; text: string; flag: FlagCode }> = ({ at, x, y, w, text, flag }) => (
  <Banner at={at} x={x} y={y} w={w} text={text} flag={flag} size={34} />
);

/** closing montage of the protest footage, slowed down and shown together (no music: the clips' own sound, very low) */
const Finale: React.FC = () => {
  const A = DUR, M2 = DUR + 21;
  return (
    <>
      <Sc a={A} b={M2 - 0.05} slide={0}>
        <Rise at={A + 0.1}><BClip n={2} at={A + 0.1} dur={21} speed={0.5} x={90} y={60} w={540} h={960} /><Label at={A + 0.5} x={110} y={80} w={300} text="إيطاليا" flag="it" /></Rise>
        <Rise at={A + 0.7}><BClip n={6} at={A + 0.7} dur={21} speed={0.5} x={690} y={60} w={540} h={960} /><Label at={A + 1.1} x={710} y={80} w={380} text="ليون" flag="fr" /></Rise>
        <Rise at={A + 1.3}><BClip n={5} at={A + 1.3} dur={21} from={11} speed={0.5} x={1290} y={60} w={540} h={960} /><Label at={A + 1.7} x={1310} y={80} w={330} text="بلجيكا" flag="be" /></Rise>
      </Sc>
      <Sc a={M2} b={DUR + FIN + 1} slide={0}>
        <Rise at={M2 + 0.1}><BClip n={1} at={M2 + 0.1} dur={FIN - 21} speed={0.7} x={60} y={130} w={1100} h={619} /><Label at={M2 + 0.5} x={80} y={150} w={300} text="باريس" flag="fr" /></Rise>
        <Sc a={M2 + 0.5} b={M2 + 19} slide={0}>
          <Rise at={M2 + 0.6}><BClip n={6} at={M2 + 0.6} dur={18} speed={0.5} from={0} x={1220} y={90} w={270} h={480} /></Rise>
          <Rise at={M2 + 1.1}><BClip n={2} at={M2 + 1.1} dur={18} speed={0.5} from={0} x={1520} y={90} w={270} h={480} /></Rise>
        </Sc>
        <Banner at={M2 + 1.5} x={60} y={800} w={1100} text="فرنسا · إيطاليا · بلجيكا" size={56} />
        <Subscribe at={DUR + FIN - 7} x={1500} y={640} dur={99} />
      </Sc>
      <Sequence from={Math.round(A * EU_FPS)} durationInFrames={Math.round(21 * EU_FPS)}><Audio src={staticFile("eu/broll/c6.mp4")} volume={0.1} /></Sequence>
      <Sequence from={Math.round(M2 * EU_FPS)} durationInFrames={Math.round((FIN - 21) * EU_FPS)}><Audio src={staticFile("eu/broll/c1.mp4")} volume={0.1} /></Sequence>
    </>
  );
};

export const EuLandscape: React.FC = () => {
  useFonts();
  const T_FULL1 = tw(19, "الأسعار") - 0.4;
  const T_Q = tw(27), T_Q_END = tw(34), T_GER = tw(34), T_WHERE = tw(39), T_FR = tw(1001), T_BE = tw(1019), T_CU = tw(1023), T_LG = tw(1045), T_IS = tw(1059), T_WHY = tw(108), T_F3 = tw(113), T_END = tw(116);
  const T_C2 = tw(4), T_C3 = 20.9, T_WAR = 31.6, T_BEL = tw(9), T_3 = tw(12), T_LYON = tw(16), T_CAND = tw(17);
  const cards: [number, number, number][] = [[INTRO, T_FULL1, 0], [T_Q, T_GER, 3], [T_WHERE, T_F3, 1]];
  const fulls: [number, number][] = [[T_FULL1, T_Q], [T_GER, T_WHERE], [T_F3, DUR + 1]];
  const rowX = LP.x, rowW = 960;
  return (
    <MGTheme theme="teal">
     <HybridHost>
      <AbsoluteFill>
        <HybridBg><AbsoluteFill style={{ background: T.paper }} /><PaperBgL /></HybridBg>
        <EuAudio ver="land" />
        <Whooshes at={[INTRO, T_C2, T_C3, T_WAR, T_BEL, T_3, T_LYON, T_CAND, T_FULL1, T_Q, T_GER, T_WHERE, T_FR, T_BE, T_CU, T_LG, T_IS, T_WHY, T_F3]} />
        <Intro />
        {cards.map(([a, b, ph], i) => <CardW key={i} a={a} b={b} phase={ph} />)}
        {fulls.map(([a, b], i) => <FullW key={i} a={a} b={b} />)}

        <Gfx>
          {/* France / Italy riots, Italians' cost of living */}
          <Sc a={INTRO} b={10.85}>
            <BClip n={1} at={INTRO} dur={6} from={6} x={LP.x} y={LP.y} w={LP.w} h={LP.h} fx={0.5} />
            <Banner at={INTRO + 0.3} x={90} y={90} w={420} text="فرنسا" flag="fr" />
          </Sc>
          <Sc a={10.9} b={T_C3 - 0.05}>
            <BClip n={2} at={10.9} dur={T_C3 - 10.9} x={LP.x} y={LP.y} w={LP.w} h={LP.h} fy={0.45} />
            <Banner at={11.2} x={90} y={90} w={440} text="إيطاليا" flag="it" />
          </Sc>
          <Sc a={T_C3} b={T_WAR - 0.05}>
            <Banner at={T_C3 + 0.2} x={rowX} y={90} w={rowW} text="إيطاليا: ضيق المعيشة" flag="it" size={56} />
            <StatRow at={tw(5, "ضيق")} x={rowX} y={270} w={rowW} h={200} icon="Wallet" label="ضيق في المعيشة" rot={-1} />
            <StatRow at={tw(5, "الأسعار")} x={rowX} y={500} w={rowW} h={200} icon="TrendingUp" label="الأسعار غالية" rot={1} />
            <StatRow at={tw(5, "الرواتب")} x={rowX} y={730} w={rowW} h={200} icon="Banknote" label="والرواتب لا تكفي" rot={-1} />
          </Sc>
          <Sc a={T_WAR} b={T_BEL - 0.05}>
            <Banner at={tw(6, "تدخل")} x={rowX} y={90} w={rowW} text="الإنفاق على الحروب" size={60} />
            <StatRow at={tw(6, "تدخل")} x={rowX} y={250} w={rowW} h={180} icon="Swords" label="تدخّل الدول في الحروب" rot={-1} />
            <StatRow at={tw(7, "وإنفاق")} x={rowX} y={460} w={rowW} h={180} icon="Banknote" label="وإنفاق دولهم عليها" rot={1} />
            <StatRow at={tw(8, "ضوائق")} x={rowX} y={670} w={rowW} h={180} icon="Wallet" label="بينما شعوبهم في ضوائق مالية" rot={-1} />
          </Sc>
          {/* Belgium */}
          <Sc a={T_BEL} b={T_3 - 0.05}>
            <BClip n={5} at={T_BEL} dur={T_3 - T_BEL} from={11} x={LP.x} y={LP.y} w={LP.w} h={LP.h} />
            <Banner at={T_BEL + 0.2} x={90} y={90} w={460} text="بلجيكا" flag="be" />
            <ChipG x={560} y={960} size={50} phrases={[{ text: "الجامعات: دخولها صعب", at: tw(9, "الجامعات") }, { text: "تكاليفها عالية", at: tw(11, "تكاليفها") }, { text: "مظاهرات في بلجيكا", at: tw(11, "بلجيكا") }]} />
          </Sc>
          {/* the three countries */}
          <Sc a={T_3} b={T_LYON - 0.05}>
            <Banner at={tw(12, "الثلاث")} x={rowX} y={90} w={rowW} text="ثلاث دول أوروبية" size={60} />
            <StatRow at={tw(12, "فرنسا")} x={rowX} y={250} w={rowW} h={170} icon="MapPin" label="فرنسا" flag="fr" rot={-1} />
            <StatRow at={tw(13, "إيطاليا")} x={rowX} y={450} w={rowW} h={170} icon="MapPin" label="إيطاليا" flag="it" rot={1} />
            <StatRow at={tw(13, "بلجيكا")} x={rowX} y={650} w={rowW} h={170} icon="MapPin" label="بلجيكا" flag="be" rot={-1} />
            <Stamp at={tw(15, "كبيرة")} x={330} y={880} text="مظاهرات كبيرة جداً" size={64} />
          </Sc>
          <Sc a={T_LYON} b={T_CAND - 0.05}>
            <BClip n={6} at={T_LYON} dur={T_CAND - T_LYON} from={0.2} x={LP.x} y={LP.y} w={LP.w} h={LP.h} fy={0.3} rot={-0.6} />
            <Banner at={T_LYON + 0.2} x={90} y={90} w={560} text="فرنسا · بلدية ليون" flag="fr" size={50} />
            <Stamp at={tw(16, "أحرقوا")} x={560} y={800} text="أُحرق!" size={74} />
          </Sc>
          <Sc a={T_CAND} b={T_FULL1 + 0.3}>
            <BClip n={4} at={T_CAND} dur={T_FULL1 - T_CAND + 0.3} x={LP.x} y={LP.y} w={LP.w} h={LP.h} speed={1} contain patch />
            <Correction at={tw(18, "هرمز")} dur={5.5} x={110} y={110} w={900} text="تصحيح: مضيق هرمز" size={64} />
          </Sc>
          {/* full-screen speaker: prices, Trump, Russia, Iran */}
          <Sc a={T_FULL1} b={T_Q - 0.05} slide={0}>
            <ChipG x={960} y={930} size={56} phrases={[
              { text: "غلاء الأسعار", at: tw(19, "غلاء") }, { text: "الشعوب تضغط عليها الأسعار", at: tw(19, "شعوبها") }, { text: "ما عادت تسد حاجاتها", at: tw(19, "تسد") },
              { text: "ترامب ورّط العالم", at: tw(22, "ورط") }, { text: "أعلى عقوبات في العالم", at: tw(25, "عقوبات") }, { text: "الوقود والغاز", at: tw(25, "بالوقود") },
              { text: "دروس يجب أن نتعلمها", at: tw(26, "دروس") }, { text: "ثقافة وفهم لما يجري", at: tw(26, "ثقافة") }]} />
            <Subscribe at={100.5} x={1560} y={640} dur={4.5} />
            <PersonTag at={tw(22, "وترامب")} x={110} y={230} photo="eu/people/trump.jpg" name="ترامب" dur={7} />
            <FlagTag at={tw(22, "إيران")} x={1480} y={170} c="ir" name="إيران" dur={3.5} />
            <FlagTag at={tw(23, "روسيا")} x={1480} y={170} c="ru" name="روسيا" dur={8} />
          </Sc>
          {/* the question */}
          <Sc a={T_Q} b={T_GER - 0.05}>
            <Banner at={tw(28, 0)} x={rowX} y={70} w={rowW} text="أين تذهب الأموال؟" size={62} />
            <StatRow at={tw(28, "دافعية")} x={rowX} y={220} w={rowW} h={160} icon="Landmark" label="أموال دافعي الضرائب" sub="في تلك الدول" rot={-1} />
            <StatRow at={tw(29, "المنهوبة")} x={rowX} y={405} w={rowW} h={160} icon="Coins" label="الأموال المنهوبة" sub="من بلاد المسلمين أثناء الاستعمار" rot={1} />
            <StatRow at={tw(29, "الذهب")} x={rowX} y={590} w={rowW} h={160} icon="Gem" label="الذهب المنهوب" rot={-1} />
            <StatRow at={tw(30, "النقط")} x={rowX} y={775} w={rowW} h={160} icon="Droplets" label="النفط الذي امتُصّ من بلادنا" sub="ويُمتصّ حتى الآن" rot={1} />
            <Stamp at={tw(33, 0)} x={640} y={960} text="والشعوب تغلي" size={56} />
          </Sc>
          {/* Germany and others */}
          <Sc a={T_GER} b={T_WHERE - 0.05} slide={0}>
            <ChipG x={960} y={930} size={54} phrases={[{ text: "دول أخرى قد تتفاقم فيها المسائل", at: tw(35, "دول") }, { text: "ألمانيا ليست أحسن حالاً", at: tw(36, "ألمانيا") }, { text: "ضوائق اقتصادية وغلاء أسعار", at: tw(37, "الشعب") }, { text: "والعدوى تنتقل بين الجيران", at: tw(38, "يعدى") }]} />
            <FlagTag at={tw(36, "ألمانيا")} x={1480} y={170} c="de" name="ألمانيا" dur={9} />
          </Sc>
          {/* where does the money go: Israel + Netanyahu */}
          <Sc a={T_WHERE} b={T_FR - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: tw(40, "بالملايين"), url: SRC.euIsrael }]} />
            <Banner at={T_WHERE + 0.1} x={rowX} y={70} w={rowW} text="أين تذهب هذه الأموال؟" size={62} />
            <StatRow at={tw(40, "بالملايين")} x={rowX} y={220} w={rowW} h={180} icon="Banknote" label="أوروبا خصّصت مبالغ بالملايين" rot={-1} />
            <StatRow at={tw(41, "إسرائيل")} x={rowX} y={430} w={rowW} h={180} icon="Flag" label="لدعم إسرائيل" flag="il" rot={1} />
            <StatRow at={tw(41, "نيتنياهو")} x={rowX} y={640} w={rowW} h={180} icon="User" label="أو لدعم نتنياهو" sub="لأنهم يسمّونه «دعم إسرائيل»" photo="eu/people/netanyahu.jpg" rot={-1} />
            <Stamp at={tw(43, "صادمة")} x={330} y={880} text="أرقام صادمة" size={64} />
          </Sc>
          {/* the wars (correction recording): Chammal, Barkhane, Italy */}
          <Sc a={T_FR} b={T_BE - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: tw(1003, "شمال"), url: SRC.chammal }, { at: tw(1006, "برخان"), url: SRC.barkhaneHearing }, { at: tw(1011, "إيطاليا"), url: SRC.itOps }]} />
            <Banner at={T_FR + 0.1} x={rowX} y={70} w={rowW} text="حروب في الشرق الأوسط وإفريقيا" size={54} />
            <StatRow at={tw(1003, "شمال")} countAt={tw(1005, "ثلاثمية")} x={rowX} y={230} w={rowW} h={190} icon="Shield" label="فرنسا: عملية «شمال» 2025" sub="سوريا والعراق" flag="fr" to={322} unit="مليون يورو" rot={-1} big={84} />
            <StatRow at={tw(1006, "برخان")} countAt={tw(1007, "مليار")} x={rowX} y={450} w={rowW} h={190} icon="Swords" label="فرنسا: «برخان» (الساحل)" sub="نحو مليونَي يورو يومياً، بحسب متحدثين في الشيوخ" to={1} unit="مليار يورو سنوياً" rot={1} big={84} />
            <StatRow at={tw(1011, "إيطاليا")} countAt={tw(1012, "252")} x={rowX} y={670} w={rowW} h={190} icon="Globe" label="إيطاليا: العراق والشرق الأوسط" flag="it" to={252} unit="مليون يورو" rot={-1} big={84} />
            <Stamp at={tw(1018, "وشعبها")} x={330} y={900} text="وشعبها يتظاهر" size={54} />
          </Sc>
          <Sc a={T_BE} b={T_CU - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: T_BE + 0.2, url: SRC.be24 }, { at: tw(1022, "17"), url: SRC.be17 }]} />
            <Banner at={T_BE + 0.1} x={rowX} y={70} w={rowW} text="بلجيكا: ضد داعش" flag="be" size={58} />
            <StatRow at={tw(1020, "أنفقت")} countAt={tw(1021, "24")} x={rowX} y={250} w={rowW} h={200} icon="Plane" label="طائرات F-16 (2020–2021)" sub="كلفة صافية" to={24} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1022, "17")} x={rowX} y={480} w={rowW} h={200} icon="Plane" label="تمديد المهمة (2017)" to={17} unit="مليون يورو" rot={1} />
          </Sc>
          {/* culture */}
          <Sc a={T_CU} b={T_LG - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: tw(1025, "86"), url: SRC.cultFr }, { at: tw(1037, "تسعين"), url: SRC.itCult }, { at: tw(1040, 0), url: SRC.flanders }]} />
            <Banner at={T_CU + 0.1} x={rowX} y={50} w={rowW} text="نشر الثقافة خارج الدول" size={54} />
            <StatRow at={tw(1025, "86")} x={rowX} y={185} w={rowW} h={140} icon="Palette" label="فرنسا: التعاون الثقافي (2024)" flag="fr" to={86} unit="مليون يورو" rot={-1} big={70} />
            <StatRow at={tw(1029, "806")} x={rowX} y={340} w={rowW} h={140} icon="Landmark" label="فرنسا: البرنامج الثقافي كله" flag="fr" to={806} unit="مليون يورو" rot={1} big={70} />
            <StatRow at={tw(1037, "تسعين")} x={rowX} y={495} w={rowW} h={140} icon="Languages" label="إيطاليا: الترويج اللغوي والثقافي" flag="it" to={90} unit="مليون يورو" rot={-1} big={70} />
            <StatRow at={tw(1038, "سبعين")} x={rowX} y={650} w={rowW} h={140} icon="GraduationCap" label="إيطاليا: رواتب مدارسها بالخارج" flag="it" to={70} unit="مليون يورو" rot={1} big={70} />
            <StatRow at={tw(1041, "657")} x={rowX} y={805} w={rowW} h={140} icon="Palette" label="بلجيكا (فلاندرز): منح ثقافية سنوياً" flag="be" sub="بين 657 ألفاً ومليون يورو" rot={-1} big={70} />
          </Sc>
          {/* LGBT */}
          <Sc a={T_LG} b={T_IS - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: T_LG + 0.2, url: SRC.lgbtFr }, { at: tw(1049, "6"), url: SRC.itLgbt }, { at: tw(1056, "138"), url: SRC.beCavaria }]} />
            <Banner at={T_LG + 0.1} x={rowX} y={70} w={rowW} text="دعم المثلية الجنسية" size={58} />
            <StatRow at={tw(1046, "29")} x={rowX} y={215} w={rowW} h={140} icon="Calendar" label="فرنسا: بين 2017 و2022" flag="fr" to={29} unit="مليون يورو" rot={-1} big={70} />
            <StatRow at={tw(1047, "10")} x={rowX} y={365} w={rowW} h={140} icon="Calendar" label="فرنسا: السنوات الثلاث التالية" flag="fr" to={10} unit="ملايين يورو" rot={1} big={70} />
            <StatRow at={tw(1049, "6")} x={rowX} y={515} w={rowW} h={140} icon="Home" label="إيطاليا: مراكز داخل إيطاليا" flag="it" to={6} unit="ملايين يورو" rot={-1} big={70} />
            <StatRow at={tw(1051, "أرقام")} x={rowX} y={665} w={rowW} h={120} icon="SearchX" label="بلجيكا: لا أرقام تضاهي فرنسا" flag="be" rot={1} />
            <StatRow at={tw(1052, "جمعية")} countAt={tw(1056, "138")} x={rowX} y={795} w={rowW} h={150} icon="Users" label="بلجيكا: جمعية Çavaria (2024)" sub="تصحيح: نُطق «138 ألفاً» والمصدر 183,150" to={183150} comma unit="يورو" rot={-1} big={64} />
          </Sc>
          {/* Israel */}
          <Sc a={T_IS} b={T_WHY - 0.05}>
            <Sources x={60} bottom={14} size={26} w={1000} links={[{ at: T_IS + 0.2, url: SRC.euIsrael }]} />
            <Banner at={T_IS + 0.1} x={rowX} y={70} w={rowW} text="دعم إسرائيل" flag="il" size={58} />
            <StatRow at={tw(1059, "نتنياهو")} x={rowX} y={240} w={rowW} h={190} icon="Flag" label="برنامج دعم الحكومة الإسرائيلية" sub="الدول الثلاث مجتمعة" flag="il" rot={-1} />
            <StatRow at={tw(1060, "عشرة")} x={rowX} y={460} w={rowW} h={200} icon="Banknote" label="إجمالي أوروبي مشترك (2024)" sub="يُقسَّم على الدول الأوروبية" to={10} unit="ملايين يورو" rot={1} />
            <StatRow at={tw(1062, "الدعم")} x={rowX} y={690} w={rowW} h={170} icon="HelpCircle" label="والدعم غير المباشر؟" sub="لا ندري كم يُقدَّر" rot={-1} />
          </Sc>
          {/* why pump this money abroad */}
          <Sc a={T_WHY} b={T_F3 - 0.05}>
            <Banner at={T_WHY + 0.1} x={rowX} y={70} w={rowW} text="لماذا تُضَخّ هذه الأموال؟" size={58} />
            <StatRow at={tw(109, 0)} x={rowX} y={240} w={rowW} h={170} icon="Plane" label="خارج بلادهم" rot={-1} />
            <StatRow at={tw(110, "جيوب")} x={rowX} y={440} w={rowW} h={170} icon="Wallet" label="من جيوب شعوبهم ودافعي الضرائب" rot={1} />
            <StatRow at={tw(111, "تريد")} x={rowX} y={640} w={rowW} h={170} icon="TrendingDown" label="والشعوب تريد دعم الأسعار" rot={-1} />
            <StatRow at={tw(112, "التعليم")} x={rowX} y={840} w={rowW} h={170} icon="GraduationCap" label="ودعم التعليم" rot={1} />
          </Sc>
          {/* conclusion */}
          <Sc a={T_F3} b={DUR + 1} slide={0}>
            <ChipG x={960} y={930} size={56} phrases={[
              { text: "اهتمام بالخارج أكثر من الداخل", at: tw(113, "تهتم") }, { text: "أفكار تحملها الأحزاب الحاكمة", at: tw(114, "بأفكار") }, { text: "أكثر من الاهتمام بشعبها", at: tw(115, "أكثر") },
              { text: "بهرج خارجي", at: tw(116, "بهرج") }, { text: "هشاشة داخلية", at: tw(116, "هشاشة") }, { text: "تكاد أن تتكسر", at: tw(117, "تكاد") }, { text: "فماذا لو انهارت؟", at: tw(120, "فماذا") },
              { text: "سياسات التقشف", at: tw(121, "التقشو") }, { text: "هل سيخرج العلمانيون؟", at: tw(122, "علمان") }, { text: "تطور وثراء وشوارع نظيفة عندنا", at: tw(124, "تطور") },
              { text: "عندهم: تقشف وشوارع متسخة", at: tw(126, "تقشف") }, { text: "كما قالوا عن الإلحاد والنصرانية", at: tw(129, "الإلحاد") }]} />
            
          </Sc>
          {/* user rule 2026-10-18: his name every ~3 minutes, a subscribe reminder every ~5 minutes */}
          <Finale />
          <NameTag at={80} x={330} y={960} />
          <NameTag at={260} x={1275} y={948} />
          <NameTag at={400} x={330} y={960} />
          <TitleBar title={TITLE_TXT} theme={BAR} />
        </Gfx>
        <Cover />
      </AbsoluteFill>
     </HybridHost>
    </MGTheme>
  );
};
void TEXT;
