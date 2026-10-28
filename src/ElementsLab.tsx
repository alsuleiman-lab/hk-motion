import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import {
  Bars, BlurRise, BrushX, Clock, CollageAssemble, ConvergeMerge, CornerTags, DashArc, DimLayer, EllipseMark, FlashCut, GlowCaption, GlowCounter,
  Highlight, MGTheme, NoteCard, PanelToCanvas, PhoneChips, PinnedPhoto,
  HandheldShake, PaperBg, RewriteWindow, SakugaMove, SpotlightCard, Stamp, Strike, T, TagChip, TiltNote, TimelineCounter, TimelineTravel, TypeBox, kufiF, naskhF,
} from "./MG";
import { Banner, Sources, StatRow, useFonts } from "./EuKit";
import { MapRoute, Marker, PaperMap, Word } from "./PortraitKit";
import { KeyChip, VerseWords, ReelVerseFull } from "./MGExtras";
import { NameTag, Subscribe, Pic } from "./EuKit";
import { PopCard, BAR_WARM, FullImage, PaperScene } from "./PortraitKit";
import { KhBg } from "./KhKit";
import { BACKGROUNDS } from "./Backgrounds";
import { TitleBar } from "./TitleBar";
import { PaperCoverKit } from "./CoverKit";
import { SplitCards, Curtain, TailVoice } from "./MontageSpec";
import { NAME_CARDS } from "./NameCards";
import LAB from "../data/elements_lab.json";

/**
 * ElementsLab — every kit element drawn ALONE on a calm backdrop, one 3-second Sequence each (user 2026-10-27: «العناصر مرسومة ومعها اسمها وأين توضع»).
 * Still frame of element i = i*LAB_LEN + LAB_STILL. Names/placement text live in data/elements_lab.json; tools/elements_page.mjs builds the page from stills.
 * Placeholder text and faceless silhouettes only.
 */
export const LAB_LEN = 90, LAB_STILL = 72;
export const ELEMENTS_LAB_FRAMES = LAB.length * LAB_LEN;

const Sil: React.FC<{ bg?: string }> = ({ bg = "linear-gradient(160deg,#a9b8c6,#5f7386)" }) => (
  <AbsoluteFill style={{ background: bg }}>
    <svg viewBox="0 0 100 120" width="100%" height="100%" preserveAspectRatio="xMidYMax slice"><circle cx="50" cy="42" r="19" fill="rgba(20,22,26,.78)" /><path d="M12 120 C14 84 32 70 50 70 C68 70 86 84 88 120 Z" fill="rgba(20,22,26,.78)" /></svg>
  </AbsoluteFill>
);
const Page: React.FC = () => (
  <AbsoluteFill style={{ background: "#efe6d0", padding: 34, direction: "rtl" }}>
    <div style={{ fontFamily: kufiF, fontSize: 40, color: "#2a2723", marginBottom: 14 }}>عنوان الصفحة</div>
    {Array.from({ length: 9 }).map((_, i) => (<div key={i} style={{ height: 14, margin: "14px 0", width: `${70 + ((i * 17) % 30)}%`, background: "rgba(40,36,30,.5)", borderRadius: 4 }} />))}
  </AbsoluteFill>
);
const Backdrop: React.FC<{ light?: boolean }> = ({ light }) => (
  <AbsoluteFill style={{ background: light ? "linear-gradient(135deg,#d9cdb0,#b9a98a)" : "linear-gradient(135deg,#1d2b3b,#33485f)" }}>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 1.6px)", backgroundSize: "26px 26px" }} />
  </AbsoluteFill>
);

/** the montage engine's own pieces (src/MontageSpec.tsx), shown alone like the rest (user 2026-10-27: «استخدمت أموراً من خارجها، أضفها لأراها هنا») */
const SPLIT = { from: 0, to: 99, clip: { x: 140, w: 632 }, sheikh: { x: 772, w: 1148 }, clipName: "اسم المقطع المعروض" };
const SPEC_E: Record<string, { node: React.ReactNode; light?: boolean }> = {
  VerseWords: { node: <VerseWords words={["مُّحَمَّدٌۭ", "رَّسُولُ", "ٱللَّهِ"]} times={[0.4, 0.9, 1.3]} x={560} y={300} w={800} size={64} title="سُورَةُ الفَتۡحِ" refText="الآية 29" until={2.7} /> },
  ReelVerseFull: { node: <div style={{ position: "absolute", left: 656, top: 0, width: 1080, height: 1920, transform: "scale(0.5625)", transformOrigin: "top left", overflow: "hidden" }}><ReelVerseFull to={2.8} refName="سُورَةُ الفَتۡحِ — الآية 29" lines={[{ words: ["مُّحَمَّدٌۭ", "رَّسُولُ", "ٱللَّهِ"], times: [0.4, 0.9, 1.3] }]} /></div> },
  PaperScene: { node: <PaperScene at={0.1} until={2.9} x={460} y={200} w={1000} h={640} pieces={[{ src: "collage/car.png", at: 0.3, x: 60, y: 160, w: 300, rot: -3, from: "left" }, { src: "collage/robe.png", at: 0.9, x: 380, y: 120, w: 260, rot: 2, from: "top" }, { src: "collage/ant.png", at: 1.5, x: 700, y: 220, w: 240, rot: -2, from: "right" }]} /> },
  BgFullImage: { node: <><Sil /><div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: kufiF, fontSize: 46, color: "#f6f8fa", direction: "rtl", textShadow: "0 3px 10px rgba(0,0,0,.6)" }}>«…وقبّة هذا المسجد في القاهرة»</div><FullImage src="people/azharMosque.jpg" from={1} to={3} marker={{ x: 1180, y: 20, w: 560, h: 560, at: 1.5 }} /></> },
  BgKh: { node: <KhBg /> },
  BgPaperDark: { node: <PaperBg dark /> },
  BgMashrabiya: { node: React.createElement(BACKGROUNDS.BgMashrabiya) },
  TitleBar: { node: <TitleBar title="عنوان الحلقة في الشريط" theme={BAR_WARM} /> },
  KeyChip: { node: <KeyChip phrases={[{ text: "عبارة مفتاحية من كلامه", at: 0.1 }]} theme={BAR_WARM} size={54} /> },
  NameTag: { node: <NameTag at={0.1} x={960} y={880} dur={9} /> },
  Subscribe: { node: <Subscribe at={0.1} x={960} y={420} /> },
  PhotoFrame: { node: (
    <SakugaMove at={0.1} w={600} h={400} from={{ x: -640, y: 300 }} mid={{ x: 630, y: 305 }} to={{ x: 660, y: 300 }} switchAt={0.2} sprint={0.55} impact={false}>
      <div style={{ position: "relative", width: 600, height: 400, borderRadius: 14, overflow: "hidden", border: "5px solid #f6efe0", boxSizing: "border-box" }}><Pic src="people/azharMosque.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
    </SakugaMove>) },
  PopCard: { node: <PopCard at={0.1} x={700} y={240}><div style={{ width: 520, height: 600, borderRadius: 14, overflow: "hidden", border: "5px solid #f6efe0" }}><Sil /></div></PopCard> },
  SplitCards: { node: <SplitCards cut="kit_sample_sheikh.mp4" sp={SPLIT} /> },
  Curtain: { node: <><SplitCards cut="kit_sample_sheikh.mp4" sp={SPLIT} /><Curtain at={2.58} /></> },
  TailVoice: { node: <TailVoice tl={{ from: 0, to: 99, src: "", label: "رسالة صوتية من …", photos: ["people/azharMosque.jpg", "people/azharCourt.jpg"] }} /> },
  PaperCover: { node: <PaperCoverKit format="landscape" line1="عنوان الغلاف" line2="سطر تحت العنوان" /> },
  PushIn: { node: (
    <AbsoluteFill style={{ transform: "scale(1.08)", transformOrigin: "51.6% 30.5%" }}>
      <OffthreadVideo src={staticFile("kit_sample_sheikh.mp4")} muted style={{ width: 1920, height: 1080 }} />
    </AbsoluteFill>) },
};
/** the ten name-tag designs (src/NameCards.tsx), each over a real frame at the name-tag line under the chin */
const NAME_E: Record<string, { node: React.ReactNode }> = Object.fromEntries(Object.entries(NAME_CARDS).map(([id, C]) => [
  id,
  { node: <><OffthreadVideo src={staticFile("kit_sample_sheikh.mp4")} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} /><C at={0.2} x={960} y={880} /></> },
]));
const E: Record<string, { node: React.ReactNode; light?: boolean }> = {
  StatRow: { node: <><Banner at={0.1} x={560} y={170} w={800} text="إيطاليا: ضيق المعيشة" size={48} flag="it" /><StatRow at={0.4} countAt={0.6} x={560} y={330} w={800} h={170} icon="Banknote" label="بند فيه رقم (2024)" sub="سطر صغير يوضّح" to={322} unit="مليون يورو" rot={-1} big={84} flag="fr" /><StatRow at={0.8} x={560} y={530} w={800} h={150} icon="Wallet" label="والبند الثاني من كلامه" rot={1} /></> },
  Banner: { node: <Banner at={0.1} x={460} y={440} w={1000} text="أين تذهب الأموال؟" size={64} /> },
  Stamp: { node: <Stamp at={0.2} x={640} y={440} text="والشعوب تغلي" size={96} /> },
  Sources: { node: <Sources x={360} bottom={420} w={1200} size={26} links={[{ at: 0.1, url: "https://example.org/source-of-the-figure" }]} /> },
  BlurRise: { node: <BlurRise at={0.1} text="عبارة مفتاحية من كلامه" x={260} w={1400} y={440} size={100} /> },
  TypeBox: { node: <TypeBox at={0.1} x={440} y={380} w={1040} text="جملة مقتبسة تُكتب حرفاً حرفاً" title="اقتباس" chip="الفكرة" cps={20} size={56} /> },
  TagChip: { node: <><TagChip at={0.1} x={700} y={380} text="عبارة مفتاحية" kind="orange" bullet /><TagChip at={0.4} x={1100} y={380} text="تصنيف" kind="red" /><TagChip at={0.7} x={900} y={560} text="كلمة" sub="(سطر صغير تحتها)" kind="cream" /></> },
  Highlight: { node: <div style={{ position: "absolute", left: 460, top: 440, width: 1000, textAlign: "center", fontFamily: kufiF, fontSize: 84, color: "#fff", direction: "rtl" }}>جملة فيها <Highlight at={0.1}>كلمة مهمة</Highlight> مظلَّلة</div> },
  TimelineCounter: { node: <TimelineCounter at={0.1} x={260} y={380} w={1400} unit="سنة" stops={[{ t: 0, value: 0, label: "البداية" }, { t: 1.2, value: 40, label: "محطة" }, { t: 2.2, value: 60, label: "النهاية" }]} size={110} /> },
  GlowCounter: { node: <GlowCounter at={0.1} x={700} y={400} steps={[4, 23, 36]} stepDur={0.6} size={190} /> },
  TimelineTravel: { node: <TimelineTravel stages={[{ at: 0.1, date: "٦٩٠ هـ", title: "المرحلة الأولى", sub: "ميلاده" }, { at: 0.9, date: "٧٤٠ هـ", title: "المرحلة الثانية" }, { at: 1.7, date: "٧٩٠ هـ", title: "المرحلة الثالثة" }]} bandY={560} /> },
  Clock: { node: <div style={{ position: "absolute", left: 740, top: 320 }}><Clock at={0.1} size={440} /></div> },
  Bars: { node: <Bars at={0.1} x={660} y={300} w={600} h={420} vals={[1, 0.62, 0.38]} /> },
  SakugaMove: { node: <SakugaMove at={0.1} w={560} h={360} from={{ x: -600, y: 360 }} mid={{ x: 680, y: 360 }} to={{ x: 680, y: 360 }} switchAt={1.0} impact={false} name="اسم المردود عليه" accent="#d9b36a" labelPos={{ left: 680, top: 250 }}><Sil bg="linear-gradient(160deg,#6c7a89,#3d4753)" /></SakugaMove> },
  SpotlightCard: { node: <SpotlightCard at={0.1} card={{ x: 600, y: 200, w: 720, h: 640 }} lockAt={1.2} stops={[[400, 300], [1200, 700], [800, 500]]}><Page /></SpotlightCard> },
  FlashCut: { node: <FlashCut at={0.1} x={560} y={160} w={800} h={760} crops={[{ fx: 0.5, fy: 0.5, zoom: 1 }, { fx: 0.4, fy: 0.3, zoom: 1.7 }]} beats={[0.6]} hud="حُفظ"><Page /></FlashCut> },
  PinnedPhoto: { node: <PinnedPhoto at={0.1} x={720} y={200} w={420} h={560} name="اسم العالِم" sub="رحمه الله (ت 1421هـ)"><Sil /></PinnedPhoto> },
  PhoneChips: { node: <PhoneChips at={0.1} cx={960} cy={540} w={360} h={740} dur={3} chips={[{ text: "رسالة قصيرة", side: "left", at: 0.4 }, { text: "رد من كلامه", side: "right", at: 0.9, dy: 80 }]} screen={<Page />} /> },
  ConvergeMerge: { node: <ConvergeMerge at={0.1} mergeAt={1.9} x={260} y={260} w={1400} h={560} sources={["المصدر الأول", "المصدر الثاني", "المصدر الثالث"]} sourceAt={[0.1, 0.6, 1.1]} result="النتيجة الواحدة" rtl /> },
  PanelToCanvas: { node: <PanelToCanvas at={0.1} panel={{ x: 1180, y: 150, w: 560, h: 780, title: "القائمة", button: "اختيار" }} canvas={{ x: 180, y: 220, w: 800, h: 620 }} rows={[{ title: "الأول" }, { title: "الثاني" }, { title: "الثالث" }, { title: "الرابع" }]} picks={[{ row: 0, check: 0.6, fly: 1.4 }, { row: 2, check: 0.9, fly: 1.6 }]} /> },
  NoteCard: { node: <NoteCard at={0.1} x={660} y={220} w={600} h={520} label="NOTE 01" tag="ملاحظة" title="عنوان الملاحظة" lines={4} /> },
  CollageAssemble: { node: <div style={{ position: "absolute", left: 360, top: 140, width: 1200, height: 800 }}><CollageAssemble at={0.1} bg="#e0a93a" w={1200} h={800} pieces={[{ at: 0.2, x: 80, y: 120, w: 300, h: 380, rot: -4, from: "left", color: "#2f5a8a" }, { at: 0.6, x: 460, y: 200, w: 380, h: 260, rot: 3, from: "top", color: "#f4efe3", halftone: true }, { at: 1.0, x: 840, y: 360, w: 280, h: 330, rot: -2, from: "right", color: "#b8432f" }]} /></div> },
  Strike: { node: <><div style={{ position: "absolute", left: 640, top: 420, width: 640, textAlign: "center", fontFamily: kufiF, fontSize: 90, color: "#fff" }}>كلمة خاطئة</div><Strike at={0.1} x={640} y={480} w={640} /></> },
  BrushX: { node: <><div style={{ position: "absolute", left: 700, top: 240, width: 520, height: 600, borderRadius: 24, overflow: "hidden" }}><Sil /></div><BrushX at={0.1} x={680} y={230} w={560} h={620} /></> },
  EllipseMark: { node: <><div style={{ position: "absolute", left: 600, top: 430, width: 720, textAlign: "center", fontFamily: kufiF, fontSize: 84, color: "#fff" }}>عبارة تحتاج تمييزاً</div><EllipseMark at={0.1} x={560} y={380} w={800} h={200} /></> },
  Marker: { node: <div style={{ position: "absolute", left: 560, top: 180, width: 800, height: 720 }}><Page /><Marker at={0.1} x={0.1} y={0.28} w={0.8} h={0.12} /></div> },
  TiltNote: { node: <TiltNote at={0.1} x={660} y={440} w={600} text="اشترك في القناة" /> },
  RewriteWindow: { node: <RewriteWindow x={500} y={300} w={920} oldText="العبارة القديمة" newText="العبارة الأحسن" oldAt={0.1} strikeAt={0.8} newAt={1.3} extra="سطر توضيحي" /> },
  Word: { node: <Word text="كلمة مفتاحية" at={0.1} until={3} x={560} y={430} size={120} /> },
  CornerTags: { node: <CornerTags right={["الموضوع", "الحكم"]} left={["محمد بن شمس الدين"]} y={120} size={34} /> },
  GlowCaption: { node: <GlowCaption words={[{ t: "كلمة", at: 0.1 }, { t: "كلمة", at: 0.5 }, { t: "ذهبية", at: 0.9, gold: true }, { t: "متوهجة", at: 1.3 }]} x={360} y={440} w={1200} size={90} /> },
  DashArc: { node: <><PinnedPhoto at={0.1} x={1260} y={300} w={300} h={380} name="الأول"><Sil /></PinnedPhoto><PinnedPhoto at={0.5} x={360} y={300} w={300} h={380} name="الثاني"><Sil bg="linear-gradient(160deg,#c9b99a,#8d7a5c)" /></PinnedPhoto><DashArc at={0.9} x1={1260} y1={420} x2={660} y2={420} lift={160} /></> },
  DimLayer: { light: true, node: <><AbsoluteFill style={{ background: "linear-gradient(120deg,#d9a35b,#6fb0d6)" }} /><DimLayer at={0.1} amount={0.62} blur={6} x={160} y={160} w={900} h={760} r={24} /><div style={{ position: "absolute", left: 220, top: 420, width: 780, textAlign: "center", fontFamily: kufiF, fontSize: 80, color: "#fff" }}>رسم واضح فوق التعتيم</div></> },
  MapRoute: { node: <MapRoute at={0.1} until={3} x={460} y={140} w={1000} h={800} center={[36, 38]} spanLat={10} highlight={["Syria"]} pts={[{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }]} legs={[{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1 }]} /> },
  PaperMap: { node: <PaperMap at={0.1} until={3} x={460} y={140} w={1000} h={800} center={[36, 38]} spanLat={10} highlight={["Syria"]} pts={[{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }]} legs={[{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1, car: true }]} /> },
  HandheldShake: { node: <HandheldShake windows={[{ from: 0.2, to: 2.8 }]} amp={6} rot={0.4}><OffthreadVideo src={staticFile("kit_sample_sheikh.mp4")} muted /></HandheldShake> },
};

/** the drawing of one element by id: the same node the studio composition shows */
export const labNode = (id: string) => E[id] ?? SPEC_E[id] ?? NAME_E[id];
/** one element alone on its backdrop — the live gallery page plays this in Remotion Player (user 2026-10-28: «الصفحة تكتب العناصر برمجياً لا صوراً») */
export const LabScene: React.FC<{ id: string }> = ({ id }) => {
  useFonts();
  const e = labNode(id);
  return (
    <MGTheme theme="steel">
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Backdrop light={e?.light} />
        {e ? e.node : null}
      </AbsoluteFill>
    </MGTheme>
  );
};

export const ElementsLab: React.FC = () => {
  useFonts();
  return (
    <MGTheme theme="steel">
      <AbsoluteFill>
        {LAB.map((m, i) => {
          const e = E[m.id] ?? SPEC_E[m.id] ?? NAME_E[m.id];
          return (
            <Sequence key={m.id} from={i * LAB_LEN} durationInFrames={LAB_LEN} layout="none">
              <AbsoluteFill style={{ overflow: "hidden" }}>
                <Backdrop light={e?.light} />
                {e ? e.node : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontFamily: naskhF, fontSize: 60 }}>{m.id}</div>}
                <div style={{ position: "absolute", left: 24, top: 18, fontFamily: "monospace", fontSize: 22, color: "rgba(255,255,255,.35)" }}>{m.id}</div>
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </MGTheme>
  );
};
void T;
