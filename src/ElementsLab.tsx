import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import {
  Bars, BlurRise, BrushX, Clock, CollageAssemble, ConvergeMerge, CornerTags, DashArc, EllipseMark, FlashCut, GlowCaption, GlowCounter,
  Highlight, MGTheme, NoteCard, PanelToCanvas, PhoneChips, PinnedPhoto,
  HandheldShake, PaperBg, RewriteWindow, SakugaMove, SpotlightCard, Stamp, Strike, T, TiltNote, TimelineCounter, TimelineTravel, TypeBox, kufiF, naskhF,
} from "./MG";
import { Banner, Sources, StatRow, useFonts } from "./EuKit";
import { MapRoute, Marker, PaperMap, Word } from "./PortraitKit";
import { VerseWords, ReelVerseFull } from "./MGExtras";
import { NameTag, Subscribe, Pic } from "./EuKit";
import { PopCard, BAR_WARM, FullImage, PaperScene} from "./PortraitKit";
import { KhBg } from "./KhKit";
import { MaskedVideo } from "./MaskedVideo";
import { BACKGROUNDS } from "./Backgrounds";
import { TitleBar } from "./TitleBar";
import { PaperCoverKit } from "./CoverKit";
import { LandFootage, Curtain, TailVoice } from "./MontageSpec";
import { realScene } from "./RealLab";
import { NAME_CARDS } from "./NameCards";
import LAB from "../data/elements_lab.json";
import GRIDS from "../data/layout_grids.json";
import { TRANSITIONS, TransitionScene } from "./TransitionsLab";
import { BRAND, applyBrand } from "./brand";
import type { BrandName } from "./brand";
import { BrowserFrame, VideoFrame, PostCard, CommentCard, BookPage, CitationTag, ArticleMock } from "./SourceFrames";
import { NewsClip, TornNote, WordScraps, TornPhoto, PaperGrain } from "./PaperKit";
import { DebateDossier, DebateBlocks } from "./DebateLayouts";
import { GALLERY_CUT, GALLERY_MATTE } from "./galleryCut";

/**
 * ElementsLab — every kit element drawn ALONE on a calm backdrop, one 3-second Sequence each (user 2026-10-27: «العناصر مرسومة ومعها اسمها وأين توضع»).
 * Still frame of element i = i*LAB_LEN + LAB_STILL. Names/placement text live in data/elements_lab.json; tools/elements_page.mjs builds the page from stills.
 * Every element sits on his real recording with real pictures and manuscript pages (user 2026-10-29: «لا تضع لقطات حقيقية لكي أستطيع الفهم»).
 */
export const LAB_LEN = 90, LAB_STILL = 72;

const Real: React.FC<{ src: string; pos?: string }> = ({ src, pos = "50% 25%" }) => (
  <Pic src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
);
const Page: React.FC = () => (
  <AbsoluteFill style={{ background: "#efe6d0" }}><Real src="books/bukhari2.jpg" pos="50% 35%" /></AbsoluteFill>
);
const Rec: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <OffthreadVideo src={staticFile(GALLERY_CUT)} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover", ...style }} />
);
/** his real frame behind the element, never shifted, blurred or scaled: the screen is not split here (only verses and hadiths split it — user 2026-10-30) */
const Stage: React.FC<{ id: string; children: React.ReactNode }> = ({ children }) => (
  <><AbsoluteFill style={{ background: BRAND.base }}><Rec /></AbsoluteFill>{children}</>
);
/** the stars background in the dark paper colour of the palette, read at render time so it follows the colour pattern (user 2026-10-30: «ألوانها تتغير مع النمط اللوني») */
const BgKhLive: React.FC<{ brand?: BrandName }> = () => <KhBg a={BRAND.navy} b={BRAND.navy} c={BRAND.navyDeep} />;
/** the montage engine's own pieces (src/MontageSpec.tsx), shown alone like the rest (user 2026-10-27: «استخدمت أموراً من خارجها، أضفها لأراها هنا») */
const SPLIT = { from: 0, to: 99, clip: { x: 140, w: 632 }, sheikh: { x: 772, w: 1148 }, clipName: "اسم المقطع المعروض" };
const SPEC_E: Record<string, { node: React.ReactNode; light?: boolean }> = {
  VerseWords: { node: <VerseWords words={["مُّحَمَّدٌ", "رَّسُولُ", "ٱللَّهِ"]} times={[0.4, 0.9, 1.3]} x={560} y={300} w={800} size={64} title="سُورَةُ الفَتۡحِ" refText="الآية 29" until={2.7} /> },
  ReelVerseFull: { node: <div style={{ position: "absolute", left: 656, top: 0, width: 1080, height: 1920, transform: "scale(0.5625)", transformOrigin: "top left", overflow: "hidden" }}><ReelVerseFull to={2.8} refName="سُورَةُ الفَتۡحِ — الآية 29" lines={[{ words: ["مُّحَمَّدٌ", "رَّسُولُ", "ٱللَّهِ"], times: [0.4, 0.9, 1.3] }]} /></div> },
  PaperScene: { node: <PaperScene at={0.1} until={2.9} x={460} y={200} w={1000} h={640} pieces={[{ src: "collage/car.png", at: 0.3, x: 60, y: 160, w: 300, rot: -3, from: "left" }, { src: "collage/robe.png", at: 0.9, x: 380, y: 120, w: 260, rot: 2, from: "top" }, { src: "collage/ant.png", at: 1.5, x: 700, y: 220, w: 240, rot: -2, from: "right" }]} /> },
  BrowserFrame: { node: <BrowserFrame at={0.1} x={520} y={70} w={880} h={940} url="www.azhar.eg/news/article-2026" site="الأزهر" scroll={260} until={9}><ArticleMock w={880} img="people/azharMosque.jpg" title="عنوان الخبر كما في الموقع" /></BrowserFrame> },
  VideoFrame: { node: <VideoFrame at={0.1} x={700} y={110} w={600} h={860} src="gallery_opp_clip.mp4" channel="المقطع المردود عليه" title="مقطع من البث" until={9} /> },
  PostCard: { node: <PostCard at={0.1} x={560} y={250} w={800} name="محمد بن شمس الدين" handle="@MShmsDin" avatar="cover_sheikh_25_sq.jpg" text="هذا نص المنشور كما كتبه صاحبه نعرضه هنا بخط الهوية وألوانها" mark={["نص", "المنشور"]} date="12 أكتوبر 2026" /> },
  CommentCard: { node: <CommentCard at={0.1} x={520} y={380} w={880} name="أحد المشاهدين" avatar="broll/wall1.jpg" text="لماذا لا تذكرون المصدر الذي نقلتم منه هذا الكلام؟" likes={1240} underline={[3, 5]} /> },
  BookPage: { node: <BookPage at={0.1} x={660} y={50} w={620} h={940} src="books/bukhari2.jpg" line={{ y: 330, h: 70 }} book="صحيح البخاري" part="1" page="45" until={9} /> },
  CitationTag: { node: <CitationTag at={0.2} x={740} y={480} book="صحيح مسلم" part="2" page="118" /> },
  NewsClip: { node: <NewsClip at={0.1} x={560} y={110} w={800} h={520} src="people/azharCourt.jpg" headline="عنوان الخبر في الصحيفة" source="اسم الصحيفة، 2026" /> },
  TornNote: { node: <TornNote at={0.1} x={560} y={430} w={800} text="العبارة المهمة هنا" underline={1} /> },
  WordScraps: { node: <WordScraps at={0.1} text="كلام مهم من كلامه" /> },
  TornPhoto: { node: <TornPhoto at={0.1} x={740} y={150} w={440} h={600} src="people/ibn_uthaymeen.jpg" name="ابن عثيمين" /> },
  PaperGrain: { node: <PaperGrain opacity={0.22} /> },   // the grain layer itself over his recording, not a manuscript under it (user 2026-10-31: «أرى صورة مخطوط وليس طبقة»)
  BgFullImage: { node: <><FullImage src="people/azharMosque.jpg" from={1} to={3} marker={{ x: 1180, y: 20, w: 560, h: 560, at: 1.5 }} /><MaskedVideo video={GALLERY_CUT} matte={GALLERY_MATTE} width={1920} height={1080} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: kufiF, fontSize: 46, color: BRAND.card, direction: "rtl", textShadow: "0 3px 10px rgba(0,0,0,.6)" }}>«…وقبّة هذا المسجد في القاهرة»</div></> },
  BgKh: { node: <BgKhLive /> },
  BgPaperDark: { node: <PaperBg dark /> },
  BgMashrabiya: { node: React.createElement(BACKGROUNDS.BgMashrabiya) },
  TitleBar: { node: <TitleBar title="عنوان الحلقة في الشريط" theme={BAR_WARM} /> },
  NameTag: { node: <NameTag at={0.1} x={960} y={880} dur={9} /> },
  Subscribe: { node: <Subscribe at={0.1} x={960} y={420} /> },
  PhotoFrame: { node: (
    <SakugaMove at={0.1} w={600} h={400} from={{ x: -640, y: 300 }} mid={{ x: 630, y: 305 }} to={{ x: 660, y: 300 }} switchAt={0.2} sprint={0.55} impact={false}>
      <div style={{ position: "relative", width: 600, height: 400, borderRadius: 14, overflow: "hidden", border: "5px solid #f6efe0", boxSizing: "border-box" }}><Pic src="people/azharMosque.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
    </SakugaMove>) },
  PopCard: { node: <PopCard at={0.1} x={700} y={240}><div style={{ width: 520, height: 600, borderRadius: 14, overflow: "hidden", border: "5px solid #f6efe0", position: "relative" }}><Real src="people/azharMosque.jpg" /></div></PopCard> },
  DebateDossier: { node: <DebateDossier at={0.1} url="www.azhar.eg/news/article-2026" main={{ src: GALLERY_CUT }} guest={{ src: "gallery_opp_clip.mp4", aspect: 544 / 720 }} /> },
  DebateBlocks: { node: <DebateBlocks at={0.1} main={{ src: GALLERY_CUT }} guest={{ src: "gallery_opp_clip.mp4", aspect: 544 / 720 }} /> },
  Curtain: { node: <><LandFootage cut={GALLERY_CUT} splits={[SPLIT]} /><Curtain at={2.58} /></> },
  TailVoice: { node: <TailVoice tl={{ from: 0, to: 99, src: "", label: "رسالة صوتية من …", photos: ["people/azharMosque.jpg", "people/azharCourt.jpg"] }} /> },
  PaperCover: { node: <PaperCoverKit format="landscape" line1="عنوان الغلاف" line2="سطر تحت العنوان" /> },
  PushIn: { node: (
    <AbsoluteFill style={{ transform: "scale(1.08)", transformOrigin: "51.6% 30.5%" }}>
      <OffthreadVideo src={staticFile(GALLERY_CUT)} muted style={{ width: 1920, height: 1080 }} />
    </AbsoluteFill>) },
};
/** the ten name-tag designs (src/NameCards.tsx), each over a real frame at the name-tag line under the chin */
const NAME_E: Record<string, { node: React.ReactNode }> = Object.fromEntries(Object.entries(NAME_CARDS).map(([id, C]) => [
  id,
  { node: <><OffthreadVideo src={staticFile(GALLERY_CUT)} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} /><C at={0.2} x={960} y={880} /></> },
]));
const E: Record<string, { node: React.ReactNode; light?: boolean }> = {
  StatRow: { node: <><Banner at={0.1} x={560} y={170} w={800} text="إيطاليا: ضيق المعيشة" size={48} flag="it" /><StatRow at={0.4} countAt={0.6} x={560} y={330} w={800} h={170} icon="Banknote" label="بند فيه رقم (2024)" sub="سطر صغير يوضّح" to={322} unit="مليون يورو" rot={-1} big={84} flag="fr" /><StatRow at={0.8} x={560} y={530} w={800} h={150} icon="Wallet" label="والبند الثاني من كلامه" rot={1} /></> },
  Stamp: { node: <Stamp at={0.2} x={640} y={440} text="والشعوب تغلي" size={96} /> },
  Sources: { node: <Sources x={360} bottom={420} w={1200} size={26} links={[{ at: 0.1, url: "https://example.org/source-of-the-figure" }]} /> },
  BlurRise: { node: <BlurRise at={0.1} text="عبارة مفتاحية من كلامه" x={260} w={1400} y={440} size={100} /> },
  TypeBox: { node: <TypeBox at={0.1} x={440} y={380} w={1040} text="جملة مقتبسة تُكتب حرفاً حرفاً" title="اقتباس" chip="الفكرة" cps={20} size={56} /> },
  Highlight: { node: <div style={{ position: "absolute", left: 460, top: 440, width: 1000, textAlign: "center", fontFamily: kufiF, fontSize: 84, color: "#fff", direction: "rtl" }}>جملة فيها <Highlight at={0.1}>كلمة مهمة</Highlight> مظلَّلة</div> },
  TimelineCounter: { node: <TimelineCounter at={0.1} x={260} y={380} w={1400} unit="سنة" stops={[{ t: 0, value: 0, label: "البداية" }, { t: 1.2, value: 40, label: "محطة" }, { t: 2.2, value: 60, label: "النهاية" }]} size={110} /> },
  GlowCounter: { node: <GlowCounter at={0.1} x={700} y={400} steps={[4, 23, 36]} stepDur={0.6} size={190} /> },
  TimelineTravel: { node: <TimelineTravel stages={[{ at: 0.1, date: "٦٩٠ هـ", title: "المرحلة الأولى", sub: "ميلاده" }, { at: 0.9, date: "٧٤٠ هـ", title: "المرحلة الثانية" }, { at: 1.7, date: "٧٩٠ هـ", title: "المرحلة الثالثة" }]} bandY={560} /> },
  Clock: { node: <div style={{ position: "absolute", left: 740, top: 320 }}><Clock at={0.1} size={440} /></div> },
  Bars: { node: <Bars at={0.1} x={660} y={300} w={600} h={420} vals={[1, 0.62, 0.38]} /> },
  SakugaMove: { node: <SakugaMove at={0.1} w={560} h={360} from={{ x: -600, y: 360 }} mid={{ x: 680, y: 360 }} to={{ x: 680, y: 360 }} switchAt={1.0} impact={false} name="اسم المردود عليه" accent="#d9b36a" labelPos={{ left: 680, top: 250 }}><Real src="people/popeTayeb1.jpg" /></SakugaMove> },
  SpotlightCard: { node: <SpotlightCard at={0.1} card={{ x: 600, y: 200, w: 720, h: 640 }} lockAt={1.2} stops={[[400, 300], [1200, 700], [800, 500]]}><Page /></SpotlightCard> },
  FlashCut: { node: <FlashCut at={0.1} x={0} y={0} w={1920} h={1080} crops={[{ fx: 0.5, fy: 0.5, zoom: 1 }, { fx: 0.4, fy: 0.3, zoom: 1.7 }]} beats={[0.6]} hud="حُفظ"><Page /></FlashCut> },
  PinnedPhoto: { node: <PinnedPhoto at={0.1} x={720} y={200} w={420} h={560} name="ابن عثيمين" sub="رحمه الله (ت 1421هـ)"><Real src="people/sheikh_ibn_uthaymeen_real.png" pos="50% 15%" /></PinnedPhoto> },
  PhoneChips: { node: <PhoneChips at={0.1} cx={960} cy={540} w={360} h={740} dur={3} chips={[{ text: "رسالة قصيرة", side: "left", at: 0.4 }, { text: "رد من كلامه", side: "right", at: 0.9, dy: 80 }]} screen={<Page />} /> },
  ConvergeMerge: { node: <ConvergeMerge at={0.1} mergeAt={1.9} x={260} y={260} w={1400} h={560} sources={["المصدر الأول", "المصدر الثاني", "المصدر الثالث"]} sourceAt={[0.1, 0.6, 1.1]} result="النتيجة الواحدة" rtl /> },
  PanelToCanvas: { node: <PanelToCanvas at={0.1} panel={{ x: 1180, y: 150, w: 560, h: 780, title: "القائمة", button: "اختيار" }} canvas={{ x: 180, y: 220, w: 800, h: 620 }} rows={[{ title: "الأول" }, { title: "الثاني" }, { title: "الثالث" }, { title: "الرابع" }]} picks={[{ row: 0, check: 0.6, fly: 1.4 }, { row: 2, check: 0.9, fly: 1.6 }]} /> },
  NoteCard: { node: <NoteCard at={0.1} x={660} y={220} w={600} h={520} label="NOTE 01" tag="ملاحظة" title="عنوان الملاحظة" lines={4} /> },
  CollageAssemble: { node: <div style={{ position: "absolute", left: 360, top: 140, width: 1200, height: 800 }}><CollageAssemble at={0.1} bg="transparent" w={1200} h={800} pieces={[{ at: 0.2, x: 80, y: 120, w: 300, h: 380, rot: -4, from: "left", color: "#2f5a8a" }, { at: 0.6, x: 460, y: 200, w: 380, h: 260, rot: 3, from: "top", color: "#f4efe3", halftone: true }, { at: 1.0, x: 840, y: 360, w: 280, h: 330, rot: -2, from: "right", color: "#b8432f" }]} /></div> },
  Strike: { node: <><div style={{ position: "absolute", left: 640, top: 420, width: 640, textAlign: "center", fontFamily: kufiF, fontSize: 90, color: "#fff" }}>كلمة خاطئة</div><Strike at={0.1} x={640} y={480} w={640} /></> },
  BrushX: { node: <><div style={{ position: "absolute", left: 700, top: 240, width: 520, height: 600, borderRadius: 24, overflow: "hidden" }}><Real src="people/azharCourt.jpg" /></div><BrushX at={0.1} x={680} y={230} w={560} h={620} /></> },
  EllipseMark: { node: <><div style={{ position: "absolute", left: 600, top: 430, width: 720, textAlign: "center", fontFamily: kufiF, fontSize: 84, color: "#fff" }}>عبارة تحتاج تمييزاً</div><EllipseMark at={0.1} x={560} y={380} w={800} h={200} /></> },
  Marker: { node: <div style={{ position: "absolute", left: 560, top: 180, width: 800, height: 720 }}><Page /><Marker at={0.1} x={0.1} y={0.28} w={0.8} h={0.12} /></div> },
  TiltNote: { node: <TiltNote at={0.1} x={660} y={440} w={600} text="اشترك في القناة" /> },
  RewriteWindow: { node: <RewriteWindow x={500} y={300} w={920} oldText="العبارة القديمة" newText="العبارة الأحسن" oldAt={0.1} strikeAt={0.8} newAt={1.3} extra="سطر توضيحي" /> },
  Word: { node: <Word text="كلمة مفتاحية" at={0.1} until={3} x={560} y={430} size={120} /> },
  CornerTags: { node: <CornerTags right={["الموضوع", "الحكم"]} left={["محمد بن شمس الدين"]} y={120} size={34} /> },
  GlowCaption: { node: <GlowCaption words={[{ t: "كلمة", at: 0.1 }, { t: "كلمة", at: 0.5 }, { t: "ذهبية", at: 0.9, gold: true }, { t: "متوهجة", at: 1.3 }]} x={360} y={440} w={1200} size={90} /> },
  DashArc: { node: <><PinnedPhoto at={0.1} x={1260} y={300} w={300} h={380} name="ابن عثيمين"><Real src="people/ibn_uthaymeen.jpg" pos="50% 15%" /></PinnedPhoto><PinnedPhoto at={0.5} x={360} y={300} w={300} h={380} name="أحمد الطيب"><Real src="broll/ahmed_el_tayeb.jpg" pos="50% 15%" /></PinnedPhoto><DashArc at={0.9} x1={1260} y1={420} x2={660} y2={420} lift={160} /></> },
  MapRoute: { node: <MapRoute at={0.1} until={3} x={460} y={140} w={1000} h={800} center={[36, 38]} spanLat={10} highlight={["Syria"]} pts={[{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }]} legs={[{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1 }]} /> },
  PaperMap: { node: <PaperMap at={0.1} until={3} x={460} y={140} w={1000} h={800} center={[36, 38]} spanLat={10} highlight={["Syria"]} pts={[{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }]} legs={[{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1, car: true }]} /> },
  HandheldShake: { node: <HandheldShake windows={[{ from: 0.2, to: 2.8 }]} amp={6} rot={0.4}><OffthreadVideo src={staticFile(GALLERY_CUT)} muted /></HandheldShake> },
};

/** the studio composition shows the elements drawn here (a transition that only TransitionsLab draws, like TrSection, is left out) */
const LAB_ITEMS = LAB.filter((m) => !(m.id in TRANSITIONS) || m.id in SPEC_E);
export const ELEMENTS_LAB_FRAMES = LAB_ITEMS.length * LAB_LEN;
/** the drawing of one element by id: the same node the studio composition shows */
export const labNode = (id: string) => E[id] ?? SPEC_E[id] ?? NAME_E[id];

// ── the gallery scene (user 2026-10-31): three screen modes, each with its grid (data/layout_grids.json), in both orientations ─────────────────────
type Orient = "land" | "port";
type Mode = "full" | "half" | "iso";
type Rect = [number, number, number, number];   // x, y, w, h
const META = Object.fromEntries((LAB as { id: string; mode?: string; slot?: { land: string; port: string } }[]).map((m) => [m.id, { mode: (m.mode ?? "full") as Mode, slot: m.slot ?? { land: "frame", port: "frame" } }]));
const G = GRIDS as unknown as Record<Orient, Record<string, { slots?: Record<string, { rect: number[] }> }>>;
export const slotRect = (o: Orient, mode: Mode, slot: string): Rect | null => { const r = G[o]?.[mode]?.slots?.[slot]?.rect; return r ? [r[0], r[1], r[2] - r[0], r[3] - r[1]] : null; };
/** his face centre in the gallery clip (face track of public/gallery_silent_clip.mp4: x 811–1121); the portrait crop keeps it in the middle, as SheikhLayers does */
const FACE_CX = 966, PK = 1920 / 1080, PORT_LEFT = Math.round(540 - FACE_CX * PK), PORT_W = Math.round(1920 * PK);
const PortRec: React.FC = () => <OffthreadVideo src={staticFile(GALLERY_CUT)} muted style={{ position: "absolute", top: 0, left: PORT_LEFT, width: PORT_W, height: 1920 }} />;
const Him: React.FC<{ o: Orient }> = ({ o }) => (o === "land" ? <Rec /> : <PortRec />);
const HimCut: React.FC<{ o: Orient }> = ({ o }) => (o === "land"
  ? <MaskedVideo video={GALLERY_CUT} matte={GALLERY_MATTE} width={1920} height={1080} />
  : <div style={{ position: "absolute", top: 0, left: PORT_LEFT, width: PORT_W, height: 1920 }}><MaskedVideo video={GALLERY_CUT} matte={GALLERY_MATTE} width={PORT_W} height={1920} /></div>);
const OPP = "gallery_opp_clip.mp4";
/** half screen = a source shown beside him. Landscape: the engine's split layout (DebateDossier: the source window left, his window right).
 *  Portrait: the engine's psplits (he is scaled 0.66 from the top centre, the source fills the lower panel). */
const HalfBase: React.FC<{ o: Orient; source: boolean }> = ({ o, source }) => {
  if (o === "land") return <DebateDossier at={0} main={{ src: GALLERY_CUT }} guest={{ src: OPP, aspect: 544 / 720 }} />;
  const p = slotRect("port", "half", "panel")!;
  return (
    <AbsoluteFill style={{ background: BRAND.base }}>
      <AbsoluteFill style={{ transform: "scale(0.66)", transformOrigin: "50% 0%" }}><PortRec /></AbsoluteFill>
      {source ? <div style={{ position: "absolute", left: p[0], top: p[1], width: p[2], height: p[3], borderRadius: 18, overflow: "hidden", border: `6px solid ${BRAND.card}`, boxSizing: "border-box" }}><OffthreadVideo src={staticFile(OPP)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div> : null}
    </AbsoluteFill>
  );
};

/** the element's own drawing at the still frame: the union of its boxes (a wrapper as big as the frame is looked into, not counted) */
const measure = (root: HTMLElement): Rect | null => {
  const b = root.getBoundingClientRect(), k = b.width / 1920 || 1;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const visit = (el: Element, depth: number) => {
    for (const c of Array.from(el.children)) {
      if (c instanceof HTMLElement && getComputedStyle(c).display === "none") continue;
      const r = c.getBoundingClientRect(), whole = r.width >= b.width * 0.97 && r.height >= b.height * 0.97;
      if (r.width < 3 || r.height < 3 || whole) { if (depth < 8) visit(c, depth + 1); continue; }
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
  };
  visit(root, 0);
  return x1 > x0 ? [(x0 - b.left) / k, (y0 - b.top) / k, (x1 - x0) / k, (y1 - y0) / k] : null;
};
/** moves + scales (never enlarges) the measured drawing into the grid slot, centred; dx/dy = the user's nudge from grid mode */
const Fit: React.FC<{ to: Rect | null; dx: number; dy: number; children: React.ReactNode }> = ({ to, dx, dy, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Rect | null>(null);
  useLayoutEffect(() => { if (to && !box && ref.current) setBox(measure(ref.current) ?? [0, 0, 1920, 1080]); });
  let tf = `translate(${dx}px, ${dy}px)`;
  if (to && box) {
    const s = Math.min(1, to[2] / box[2], to[3] / box[3]);
    tf = `translate(${to[0] + (to[2] - box[2] * s) / 2 - box[0] * s + dx}px, ${to[1] + (to[3] - box[3] * s) / 2 - box[1] * s + dy}px) scale(${s})`;
  }
  return <div ref={ref} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: tf, transformOrigin: "0 0", visibility: to && !box ? "hidden" : "visible" }}>{children}</div>;
};
/** whole-frame elements drawn natively in the portrait frame (the other whole-frame elements are fitted into the portrait grid) */
const PORT_NODES: Record<string, React.ReactNode> = {
  FlashCut: <FlashCut at={0.1} x={0} y={0} w={1080} h={1920} crops={[{ fx: 0.5, fy: 0.5, zoom: 1 }, { fx: 0.4, fy: 0.3, zoom: 1.7 }]} beats={[0.6]} hud="حُفظ"><Page /></FlashCut>,
  TitleBar: <TitleBar title="عنوان الحلقة في الشريط" theme={BAR_WARM} bottomHalf />,
  CornerTags: <CornerTags right={["الموضوع", "الحكم"]} left={["محمد بن شمس الدين"]} y={120} size={30} />,
  ReelVerseFull: <ReelVerseFull to={2.8} refName="سُورَةُ الفَتۡحِ — الآية 29" lines={[{ words: ["مُّحَمَّدٌ", "رَّسُولُ", "ٱللَّهِ"], times: [0.4, 0.9, 1.3] }]} />,
  TailVoice: <TailVoice tl={{ from: 0, to: 99, src: "", label: "رسالة صوتية من …", photos: ["people/azharMosque.jpg", "people/azharCourt.jpg"] }} />,   // sizes itself from the frame
};
const isBg = (id: string) => /^Bg|^PaperGrain$/.test(id);
/** elements drawn AT their slot's own size instead of being scaled into it (scaling shrank their writing, or a layer of theirs reached his face):
 *  each takes the slot rectangle [x, y, w, h] of its mode in the current orientation (user 2026-10-31: «ادرس مكان كل عنصر وحركته وعمله جيداً») */
const AT_SLOT: Record<string, (r: Rect, o: Orient) => React.ReactNode> = {
  TypeBox: (r, o) => <TypeBox at={0.1} x={r[0]} y={r[1] + Math.round(r[3] * (o === "land" ? 0.3 : 0.12))} w={r[2]} text="جملة مقتبسة تُكتب حرفاً حرفاً" title="اقتباس" chip="الفكرة" cps={20} size={o === "land" ? 44 : 50} />,
  TimelineCounter: (r, o) => <TimelineCounter at={0.1} x={r[0] + 20} y={r[1] + Math.round(r[3] * 0.3)} w={r[2] - 40} unit="سنة" stops={[{ t: 0, value: 0, label: "البداية" }, { t: 1.2, value: 40, label: "محطة" }, { t: 2.2, value: 60, label: "النهاية" }]} size={o === "land" ? 90 : 80} />,
  NoteCard: (r) => <NoteCard at={0.1} x={r[0] + 20} y={r[1] + 20} w={Math.min(560, r[2] - 40)} h={Math.min(480, r[3] - 40)} label="NOTE 01" tag="ملاحظة" title="عنوان الملاحظة" lines={4} />,
  Stamp: (r, o) => <Stamp at={0.2} x={r[0] + Math.round(r[2] * 0.08)} y={r[1] + Math.round(r[3] * (o === "land" ? 0.4 : 0.3))} text="والشعوب تغلي" size={o === "land" ? 84 : 76} />,
  GlowCaption: (r, o) => <GlowCaption words={[{ t: "كلمة", at: 0.1 }, { t: "كلمة", at: 0.5 }, { t: "ذهبية", at: 0.9, gold: true }, { t: "متوهجة", at: 1.3 }]} x={r[0]} y={r[1] + Math.round(r[3] * (o === "land" ? 0.12 : 0.35))} w={r[2]} size={o === "land" ? 72 : 64} />,
  Bars: (r) => <Bars at={0.1} x={r[0] + 60} y={r[1] + 40} w={Math.min(520, r[2] - 120)} h={Math.min(420, r[3] - 80)} vals={[1, 0.62, 0.38]} />,
  // the opponent's words under his window: dark ink on the dossier paper (landscape), light on the dark lower panel (portrait)
  BlurRise: (r, o) => <BlurRise at={0.1} text="عبارة مفتاحية من كلامه" x={r[0]} w={r[2]} y={r[1] + Math.round(r[3] * 0.12)} size={o === "land" ? 46 : 56} color={o === "land" ? BRAND.ink : "#fff"} canvasW={o === "land" ? 1920 : 1080} />,
  BookPage: (r) => <BookPage at={0.1} x={r[0]} y={r[1]} w={r[2]} h={r[3]} src="books/bukhari2.jpg" line={{ y: Math.round(r[3] * 0.35), h: 64 }} book="صحيح البخاري" part="1" page="45" until={9} />,
  // the map fills the frame behind him (isolated background)
  MapRoute: (r, o) => <MapRoute at={0.1} until={3} x={r[0]} y={r[1]} w={r[2]} h={r[3]} center={[36.8, 34.9]} spanLat={o === "land" ? 7 : 12} highlight={["Syria"]} pts={[{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }]} legs={[{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1 }]} />,
  // the spotlight's dimming stays inside the slot: it never darkens his face (PREFERENCES: لا تغطية وجهه)
  SpotlightCard: (r) => <div style={{ position: "absolute", inset: 0, clipPath: `inset(${r[1]}px calc(100% - ${r[0] + r[2]}px) calc(100% - ${r[1] + r[3]}px) ${r[0]}px round 18px)` }}><SpotlightCard at={0.1} card={{ x: r[0], y: r[1], w: r[2], h: r[3] }} lockAt={1.2} stops={[[r[0] + r[2] * 0.3, r[1] + r[3] * 0.3], [r[0] + r[2] * 0.7, r[1] + r[3] * 0.6], [r[0] + r[2] * 0.5, r[1] + r[3] * 0.45]]}><Page /></SpotlightCard></div>,
  ConvergeMerge: (r) => <ConvergeMerge at={0.1} mergeAt={1.9} x={r[0] + 150} y={r[1] + 40} w={r[2] - 150} h={r[3] - 80} sources={["المصدر الأول", "المصدر الثاني", "المصدر الثالث"]} sourceAt={[0.1, 0.6, 1.1]} result="النتيجة الواحدة" rtl />,
  // the list (originals) on the right, what is picked flies to the board on the left (user 2026-10-30/31); portrait: the band split in two
  PanelToCanvas: (_r, o) => {
    const P = o === "land" ? slotRect("land", "full", "right")! : ([560, 1320, 480, 370] as Rect), C = o === "land" ? slotRect("land", "full", "left")! : ([40, 1320, 500, 370] as Rect);
    return <PanelToCanvas at={0.1} panel={{ x: P[0], y: P[1], w: P[2], h: P[3], title: "القائمة", button: "اختيار" }} canvas={{ x: C[0], y: C[1], w: C[2], h: C[3] }} rows={[{ title: "الأول" }, { title: "الثاني" }, { title: "الثالث" }, { title: "الرابع" }]} picks={[{ row: 0, check: 0.6, fly: 1.4 }, { row: 2, check: 0.9, fly: 1.6 }]} />;
  },
};

/** one element alone in its screen mode; the live gallery plays this in Remotion Player (user 2026-10-28: «الصفحة تكتب العناصر برمجياً لا صوراً»).
 *  The orientation is the composition's shape; `slot` overrides the element's slot (gallery grid mode), dx/dy nudge it. */
export const LabScene: React.FC<{ id: string; brand?: BrandName; slot?: string; dx?: number; dy?: number }> = ({ id, brand, slot, dx = 0, dy = 0 }) => {
  applyBrand(brand);
  useFonts();
  const { width, height } = useVideoConfig();
  const o: Orient = width > height ? "land" : "port";
  const real = realScene(id, brand, dx, dy, o);
  if (real) return <AbsoluteFill style={{ overflow: "hidden" }}>{real}</AbsoluteFill>;
  if (TRANSITIONS[id]) return <TransitionScene id={id} brand={brand} />;
  const m = META[id] ?? { mode: "full" as Mode, slot: { land: "frame", port: "frame" } };
  const e = id === "BgKh" ? { node: <BgKhLive brand={brand} /> } : labNode(id);
  const sl = slot ?? m.slot[o];
  const native = o === "port" && id in PORT_NODES ? PORT_NODES[id] : null;
  // a whole-frame drawing in portrait goes into the portrait grid of its mode (half → the source panel, iso → the whole frame, full → the band under the beard)
  const to = native || isBg(id) ? null : slotRect(o, m.mode, sl) ?? (o === "port" && sl === "frame" ? slotRect("port", m.mode, m.mode === "half" ? "panel" : m.mode === "iso" ? "back" : "band") : null);
  const own = AT_SLOT[id] && (to || sl === "frame") ? <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px)` }}>{AT_SLOT[id](to ?? [0, 0, width, height], o)}</div> : null;
  const node = native ?? own ?? (e ? (isBg(id) ? e.node : <Fit key={o + sl} to={to} dx={dx} dy={dy}>{e.node}</Fit>) : null);
  return (
    <MGTheme theme="steel">
      <AbsoluteFill style={{ overflow: "hidden", background: BRAND.base }}>
        {m.mode === "iso" ? <>{node}<HimCut o={o} /></>
          : m.mode === "half" && !/^Debate|^Curtain$/.test(id) ? <><HalfBase o={o} source={id !== "BookPage"} />{node}</>
          : isBg(id) && id !== "PaperGrain" ? node
          : <><Him o={o} />{node}</>}
      </AbsoluteFill>
    </MGTheme>
  );
};

export const ElementsLab: React.FC = () => {
  useFonts();
  return (
    <MGTheme theme="steel">
      <AbsoluteFill>
        {LAB_ITEMS.map((m, i) => {
          const e = E[m.id] ?? SPEC_E[m.id] ?? NAME_E[m.id], real = realScene(m.id);
          if (real) return <Sequence key={m.id} from={i * LAB_LEN} durationInFrames={LAB_LEN} layout="none"><AbsoluteFill style={{ overflow: "hidden" }}>{real}</AbsoluteFill></Sequence>;
          return (
            <Sequence key={m.id} from={i * LAB_LEN} durationInFrames={LAB_LEN} layout="none">
              <AbsoluteFill style={{ overflow: "hidden" }}>
                <Stage id={m.id}>{e ? e.node : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontFamily: naskhF, fontSize: 60 }}>{m.id}</div>}</Stage>
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
