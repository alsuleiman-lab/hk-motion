import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { F_AR, F_NUM, HS, HistTimeline } from "./ext/HistStyle";
import { NameTag } from "./ext/NameTag";
import { DigitRoll } from "./ext/DigitRoll";
import { QAProbe } from "./ext/QAProbe";
import { JORDAN_MAP } from "./ext/jordanMap";
import { PhotoBust, MonthCard, Building, Envelope, Stamp, Book, Crowd, Kids, PhoneVideo, Coalition, Megaphone, PersonBadge, Forbid, Doc, Chair, Calendar, Rewind, QBadge } from "./ext/NewsIcons";
import { CUE, W } from "./jordanCues";

/**
 * «موشن توضيحي»: توقيفات وتضييقات على المشايخ والمراكز الدينية في الأردن (طولي 1080×1920).
 * النص المنطوق بحرفية تصحيحات المستخدم (data/explainer/Jordan-Salafi/script.txt)؛ كل ظهور مربوط بزمن نطق كلمته (W من تفريغ الراوي).
 * الشاشة: أسماء وأرقام وتواريخ ورموز فقط. التوثيق: data/explainer/Jordan-Salafi.sources.md.
 */
export const JORDAN_FPS = 30;
export const JORDAN_FRAMES = Math.ceil(CUE.total * JORDAN_FPS);
const c = (i: number) => CUE.c[i];
const e = (i: number) => CUE.e[i];
const EASE = Easing.bezier(0, 0, 0.2, 1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const AR = { fontFamily: F_AR };
const LEAD = 0.12;

/** ظهور: دخول 0.45ث وخروج 0.3ث، مركزه (x,y)؛ `at` لحظة الكلمة. */
const Pop: React.FC<{ at: number; to: number; x: number; y: number; children: React.ReactNode; rise?: number; enter?: number; exit?: number; z?: number }> = ({ at, to, x, y, children, rise = 26, enter = 0.45, exit = 0.3, z = 1 }) => {
  const t = useCurrentFrame() / JORDAN_FPS;
  const from = at - LEAD;
  if (t < from - 0.02 || t > to + exit) return null;
  const a = EASE(clamp01((t - from) / enter));
  const b = 1 - EASE(clamp01((t - to) / exit));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - a) * rise}px) scale(${0.95 + 0.05 * a})`, opacity: a * b, zIndex: z }}>{children}</div>;
};

const Tag: React.FC<{ ar: string; lat: string; scale?: number; dashed?: boolean; accent?: string }> = ({ ar, lat, scale = 0.9, dashed, accent = HS.vermilion }) => (
  <NameTag ar={ar} lat={lat} scroll scale={scale} famAr={F_AR} famLat="'IM Fell DW Pica', serif" ink={HS.ink} accent={accent} style={dashed ? { border: `4px dashed ${HS.sepia}`, borderBottom: `4px dashed ${HS.sepia}`, opacity: 0.92 } : undefined} />
);

const Num: React.FC<{ value: string; size: number; color?: string; delay?: number; from?: string }> = ({ value, size, color = HS.ink, delay = 0, from }) => (
  <DigitRoll value={value} fontSize={size} color={color} fontFamily={F_NUM} delay={delay} from={from} rollFrames={26} />
);

/** شريط السنوات: يجتاز الختم بين السنوات عند نطق كل سنة (يرجع إلى 2016 عند «ليس هذا أول تضييق»). */
const progAt = (t: number) => {
  const P: [number, number][] = [
    [0, 2026.85], [W.y2016 - 0.9, 2026.85], [W.y2016, 2016.3],
    [W.y2021 - 0.9, 2016.3], [W.y2021, 2021.65], [W.y2022 - 0.9, 2021.65], [W.y2022, 2022.2],
    [W.y2023 - 0.9, 2022.2], [W.y2023, 2023.85], [W.y2025a - 0.9, 2023.85], [W.y2025a, 2025.3],
    [W.y2025b - 0.9, 2025.3], [W.y2025b, 2025.8], [CUE.total, 2025.8],
  ];
  return interpolate(t, P.map((p) => p[0]), P.map((p) => p[1]), { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

const YEARS: { at: number; v: string; prev: string }[] = [
  { at: c(2), v: "2026", prev: "2026" },
  { at: W.y2016 - 0.35, v: "2016", prev: "2026" }, { at: W.y2021 - 0.35, v: "2021", prev: "2016" }, { at: W.y2022 - 0.35, v: "2022", prev: "2021" },
  { at: Math.min(W.y2023 - 0.35, W.oct - 0.3), v: "2023", prev: "2022" }, { at: W.y2025a - 0.35, v: "2025", prev: "2023" },
];
const YEAR_END = c(15) - 0.1;
const DATES: { at: number; to: number; v: string }[] = [
  { at: W.y2016 + 0.5, to: c(5), v: "06.2016" }, { at: W.y2021 + 0.5, to: c(7), v: "08.2021" }, { at: W.y2023 + 0.5, to: c(10), v: "10–11.2023" },
  { at: W.y2025a + 0.5, to: W.d14 + 0.3, v: "23.04.2025" }, { at: W.closed, to: c(15), v: "14.10.2025" },
];

const MapJordan: React.FC<{ s: number; pulse?: number }> = ({ s, pulse = 0 }) => {
  const m = JORDAN_MAP;
  const [ax, ay] = m.cities.amman;
  return (
    <svg width={s} height={s} viewBox="0 0 1000 1000" style={{ display: "block" }}>
      <rect x="0" y="0" width="1000" height="1000" rx="14" fill="#cfe0d8" stroke={HS.sepia} strokeWidth="6" />
      {(["saudi", "iraq", "syria", "israel", "palestine", "egypt", "lebanon"] as const).map((k) => <path key={k} d={m.paths[k]} fill="#efe0b2" stroke={HS.sepia} strokeWidth="2.2" strokeLinejoin="round" />)}
      <path d={m.paths.jordan} fill="#e0a93b" stroke={HS.ink} strokeWidth="5" strokeLinejoin="round" />
      <circle cx={ax} cy={ay} r={10 + pulse * 34} fill="none" stroke={HS.vermilion} strokeWidth="5" opacity={1 - pulse} />
      <circle cx={ax} cy={ay} r="13" fill={HS.vermilion} stroke={HS.parch} strokeWidth="4" />
    </svg>
  );
};

const Arrow: React.FC<{ w?: number; down?: boolean }> = ({ w = 150, down }) => (
  <svg width={w} height={w * 0.4} viewBox="0 0 150 60" style={down ? { transform: "rotate(90deg)" } : undefined}><path d="M6 30 H128 M104 8 L132 30 L104 52" fill="none" stroke={HS.ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** قضبان تهبط فوق منطقة (k من 0 إلى 1). */
const BarsOver: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => (
  <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "hidden" }}>
    <g transform={`translate(0 ${-(1 - k) * h})`}>
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={20 + i * ((w - 40) / 11) - 6} y="0" width="12" height={h} rx="5" fill="#4a3a28" fillOpacity="0.88" stroke={HS.ink} strokeWidth="2" />)}
      <rect x="0" y="22" width={w} height="14" fill="#4a3a28" /><rect x="0" y={h - 36} width={w} height="14" fill="#4a3a28" />
    </g>
  </svg>
);

/** غلاف الفيديو: أول 5 إطارات (0–4) — سؤال الحلقة وخريطة الأردن وعلمه وصور الخمسة؛ يُستخرج منه الغلاف بإطار 2. */
export const COVER_FRAMES = 5;
const COVER_PEOPLE: [string, string][] = [["sahouri", "أحمد الساحوري"], ["nasr", "عصر النصر"], ["abutalha", "عمر أبو طلحة"], ["otaibi", "إحسان العتيبي"], ["hamaydeh", "حسام الحمايدة"]];
const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${HS.parch} 0%, #f0dfb3 55%, ${HS.parch2} 100%)`, zIndex: 100, ...AR }}>
    <div style={{ position: "absolute", inset: 28, border: `6px double ${HS.sepia}`, borderRadius: 18 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: F_AR, fontWeight: 700, fontSize: 124, lineHeight: 1.25, color: HS.vermilion, direction: "rtl" }}>إلى أين يسير الأردن؟</div>
    <div style={{ position: "absolute", left: 70, right: 70, top: 340, textAlign: "center", fontFamily: F_AR, fontWeight: 700, fontSize: 66, lineHeight: 1.4, color: HS.ink, direction: "rtl" }}>هل سيطر الأحباش والأشعرية على مواقع القرار؟</div>
    <div style={{ position: "absolute", left: 60, top: 540 }}><MapJordan s={700} pulse={0.3} /></div>
    <div style={{ position: "absolute", left: 640, top: 640, width: 380, boxShadow: `0 14px 30px ${HS.shadow}`, border: `5px solid ${HS.sepia}`, borderRadius: 6, overflow: "hidden", lineHeight: 0 }}>
      <img src={staticFile("jordan/flag_jordan.svg")} style={{ width: 380, height: 190, display: "block" }} />
    </div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 1290, display: "flex", justifyContent: "space-between" }}>
      {COVER_PEOPLE.map(([n, ar]) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 192 }}>
          <PhotoBust photo={`jordan/people/${n}.jpg`} s={192} />
          <div style={{ fontFamily: F_AR, fontWeight: 700, fontSize: 31, lineHeight: 1.2, color: HS.ink, direction: "rtl", whiteSpace: "nowrap" }}>{ar}</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1600, textAlign: "center", fontFamily: F_NUM, fontWeight: 600, fontSize: 150, lineHeight: 1.2, color: HS.vermilion, direction: "ltr" }}>11.2026</div>
  </AbsoluteFill>
);

export const JordanDetain: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / JORDAN_FPS;
  const PEOPLE = [
    { ar: "أحمد الساحوري", lat: "Ahmad Al-Sahouri", x: 290, y: 480, photo: "jordan/people/sahouri.jpg" }, { ar: "عصر النصر", lat: "Asr Al-Nasr", x: 790, y: 480, photo: "jordan/people/nasr.jpg" },
    { ar: "عمر أبو طلحة", lat: "Omar Abu Talha", x: 290, y: 1000, photo: "jordan/people/abutalha.jpg" }, { ar: "إحسان العتيبي", lat: "Ihsan Al-Otaibi", x: 790, y: 1000, photo: "jordan/people/otaibi.jpg" },
    { ar: "حسام الحمايدة", lat: "Hussam Al-Hamaydeh", x: 540, y: 1520, photo: "jordan/people/hamaydeh.jpg" },
  ];
  const bars = (a: number, d = 0.5) => EASE(clamp01((t - a) / d));
  const envY = interpolate(t, [W.envelope, W.book - 0.1], [900, 1260], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const crowdN = Math.round(interpolate(t, [W.n1000 - 0.2, W.n1000 + 2.8], [120, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${HS.parch} 0%, #f0dfb3 55%, ${HS.parch2} 100%)`, ...AR }}>
      <Audio src={staticFile("jordan/mix.wav")} />
      {f < COVER_FRAMES && <Cover />}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.2 }}><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="4" /><feColorMatrix type="saturate" values="0" /></filter><rect width="1080" height="1920" filter="url(#grain)" /></svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(120,88,40,0.28) 100%)" }} />

      {/* ٠: الأسماء الخمسة بصورها، كل اسم عند نطقه */}
      {PEOPLE.map((p, i) => (
        <Pop key={p.lat} at={CUE.names[i]} to={W.jordanW} x={p.x} y={p.y} z={2}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <PhotoBust photo={p.photo} s={300} bars={bars(W.arrest, 0.8)} />
            <Tag ar={p.ar} lat={p.lat} scale={0.86} />
          </div>
        </Pop>
      ))}

      {/* ١: نوفمبر 2026 — توقيف كل هؤلاء في الأردن دون بيان رسمي ولا سبب معلن */}
      <Pop at={W.jordanW} to={c(2) - 0.05} x={540} y={960} z={2}><MapJordan s={800} pulse={(t * 0.5) % 1} /></Pop>
      <Pop at={W.nov} to={c(2) - 0.05} x={540} y={130} z={4}><Num value="11.2026" size={120} color={HS.vermilion} /></Pop>
      <Pop at={W.noStmt} to={c(2) - 0.05} x={320} y={1560} z={3}><Doc s={230} kind="slash" /></Pop>
      <Pop at={W.noReason} to={c(2) - 0.05} x={760} y={1560} z={3}><Doc s={230} kind="question" /></Pop>

      {/* ٢: ليس هذا أول تضييق على المشايخ */}
      <Pop at={W.back} to={W.y2016 + 0.2} x={540} y={720} z={2} enter={0.6}><Rewind s={420} a={interpolate(t, [W.back, W.y2016], [0, 540], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })} /></Pop>
      {PEOPLE.map((p, i) => <Pop key={"sh" + i} at={W.mashayikh + i * 0.1} to={W.y2016 + 0.2} x={150 + i * 195} y={1180} z={2}><PhotoBust photo={p.photo} s={150} /></Pop>)}
      <Pop at={W.jordan2} to={W.y2016 + 0.2} x={540} y={1530} z={2}><MapJordan s={330} pulse={(t * 0.5) % 1} /></Pop>

      {/* السنة الكبيرة والتواريخ */}
      {YEARS.map((y, i) => (
        <Sequence key={y.v + i} from={Math.round(y.at * JORDAN_FPS)} durationInFrames={Math.max(1, Math.round(((YEARS[i + 1]?.at ?? YEAR_END) - y.at) * JORDAN_FPS))} layout="none">
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", zIndex: 4 }}><Num value={y.v} from={y.prev} size={190} /></div>
        </Sequence>
      ))}
      {DATES.map((d) => <Pop key={d.v} at={d.at} to={d.to} x={540} y={345} z={3}><Num value={d.v} size={92} color={HS.vermilion} /></Pop>)}

      {/* تقويم رمزي يملأ الفراغ بين نطق التاريخ وأول عنصر خاص بالمشهد */}
      <Pop at={c(5) + 0.3} to={W.envelope - 0.35} x={540} y={940} z={2}><Calendar s={320} /></Pop>
      <Pop at={c(7) + 0.3} to={W.wazir22 - 0.3} x={540} y={940} z={2}><Calendar s={320} /></Pop>
      <Pop at={c(10) + 0.3} to={W.seal - 0.4} x={540} y={940} z={2}><Calendar s={320} /></Pop>

      {/* ٣: 2016 — حُبس أمجد قورشة بسبب انتقاده بعض التدخلات الخارجية للأردن */}
      <Pop at={W.y2016 + 0.2} to={e(4) + 0.2} x={540} y={800} z={2}><PhotoBust photo="jordan/people/qorsha.jpg" s={300} bars={bars(W.bars)} /></Pop>
      <Pop at={W.qorsha} to={e(4) + 0.2} x={540} y={1060} z={3}><Tag ar="أمجد قورشة" lat="Amjad Qorsha" /></Pop>
      <Pop at={W.shariah} to={e(4) + 0.2} x={870} y={1060} z={2}><Book s={190} /></Pop>
      <Pop at={W.phone} to={e(4) + 0.2} x={300} y={1480} z={2}><PhoneVideo s={250} /></Pop>
      <Pop at={W.phone + 0.5} to={e(4) + 0.2} x={540} y={1480} z={2}><Arrow w={150} /></Pop>
      <Pop at={W.coal} to={e(4) + 0.2} x={780} y={1480} z={2}><Coalition s={270} /></Pop>

      {/* ٤: 2021 — وزير الأوقاف يطلب موافقة الوزارة لعقد الدورات الشرعية */}
      <Pop at={W.wazir - 0.2} to={e(6) + 0.2} x={540} y={600} z={2}><Building s={330} /></Pop>
      <Pop at={W.ministry} to={e(6) + 0.2} x={540} y={830} z={2}><Tag ar="وزارة الأوقاف" lat="Ministry of Awqaf" accent={HS.lapis} /></Pop>
      <Pop at={W.envelope} to={e(6) + 0.2} x={540} y={envY} z={2} rise={0}><Envelope s={210} /></Pop>
      <Pop at={W.stamp} to={e(6) + 0.2} x={680} y={1000} z={3}><Stamp s={140} kind="ok" /></Pop>
      <Pop at={W.book} to={e(6) + 0.2} x={540} y={1520} z={2}><Book s={250} /></Pop>

      {/* ٥: 2022 — وزير الأوقاف يمنع أندية الطفل القرآني بحجة تنظيم عملها */}
      <Pop at={W.wazir22 - 0.2} to={e(7) + 0.2} x={540} y={560} z={2}><Building s={260} /></Pop>
      <Pop at={W.clubs - 0.2} to={e(7) + 0.2} x={540} y={900} z={2}><div style={{ position: "relative", width: 380, height: 190 }}><Kids s={380} /></div></Pop>
      <Pop at={W.clubs} to={e(7) + 0.2} x={540} y={1130} z={2}><Tag ar="أندية الطفل القرآني" lat="Quranic Child Clubs" /></Pop>
      <Pop at={W.clubs + 0.8} to={e(7) + 0.2} x={540} y={900} z={3}><div style={{ position: "relative", width: 260, height: 260 }}><Forbid s={260} k={bars(W.clubs + 0.8, 0.8)} /></div></Pop>
      <Pop at={W.reg - 0.2} to={e(7) + 0.2} x={420} y={1480} z={2}><Doc s={230} kind="blank" /></Pop>
      <Pop at={W.reg} to={e(7) + 0.2} x={600} y={1520} z={3}><Stamp s={150} kind="ok" /></Pop>

      {/* ٦: 2023 — مظاهرات غزة: ألف ثم 24 */}
      <Pop at={W.oct} to={W.amnesty - 0.2} x={330} y={940} z={2}><MonthCard n="10" s={300} /></Pop>
      <Pop at={W.nov23} to={W.amnesty - 0.2} x={750} y={940} z={2}><MonthCard n="11" s={300} /></Pop>
      <Pop at={W.n1000 - 0.2} to={W.n24 + 0.2} x={540} y={1090} z={2}><Crowd w={960} h={820} n={crowdN} size={21} /></Pop>
      <Pop at={W.n1000} to={W.n24 - 0.1} x={540} y={520} z={3}><Num value="1000+" size={200} color={HS.vermilion} /></Pop>
      <Pop at={W.amnesty} to={e(8) + 0.2} x={540} y={1600} z={3}><Tag ar="منظمة العفو الدولية" lat="Amnesty International" scale={0.82} /></Pop>
      <Pop at={W.n24} to={e(9) + 0.2} x={540} y={1060} z={2}><Crowd w={640} h={330} n={24} hi={24} size={64} seed={9} /></Pop>
      <Pop at={W.n24} to={e(9) + 0.2} x={540} y={520} z={3}><Num value="24" size={230} color={HS.vermilion} /></Pop>
      <Pop at={W.pm} to={e(9) + 0.2} x={540} y={1600} z={3}><Tag ar="رئيس الوزراء" lat="Prime Minister" accent={HS.lapis} /></Pop>

      {/* ٧: 23 أبريل 2025 — حظر الإخوان */}
      <Pop at={W.seal - 0.3} to={W.after - 0.2} x={540} y={940} z={2}><Building s={400} seal={bars(W.seal, 1.4)} /></Pop>
      <Pop at={W.interior} to={W.after - 0.2} x={540} y={560} z={2}><Tag ar="وزارة الداخلية" lat="Ministry of Interior" accent={HS.lapis} /></Pop>
      <Pop at={W.interior + 0.3} to={W.after - 0.2} x={540} y={720} z={2}><Arrow w={150} down /></Pop>
      <Pop at={W.brother} to={W.after - 0.2} x={540} y={1250} z={2}><Tag ar="جماعة الإخوان المسلمين" lat="Muslim Brotherhood" scale={0.82} /></Pop>
      <Pop at={W.forbidA - 0.3} to={W.after - 0.2} x={340} y={1530} z={2}><div style={{ position: "relative", width: 190, height: 190 }}><PersonBadge s={190} /><Forbid s={190} k={bars(W.forbidA, 0.7)} /></div></Pop>
      <Pop at={W.forbidB - 0.3} to={W.after - 0.2} x={740} y={1530} z={2}><div style={{ position: "relative", width: 190, height: 190 }}><Megaphone s={190} /><Forbid s={190} k={bars(W.forbidB, 0.7)} /></div></Pop>

      {/* ٨: وعلى إثر ذلك ضُيّق على كثير من المشايخ بحجة موالاتهم لهذه الجماعة */}
      <Pop at={W.many - 0.2} to={e(11) + 0.2} x={540} y={820} z={2}>
        <div style={{ position: "relative", width: 700, height: 460 }}>
          <Crowd w={700} h={460} n={40} size={64} seed={3} />
          <BarsOver w={700} h={460} k={bars(W.many + 0.2, 1.0)} />
        </div>
      </Pop>
      <Pop at={W.group} to={e(11) + 0.2} x={540} y={1250} z={2}><Tag ar="جماعة الإخوان المسلمين" lat="Muslim Brotherhood" scale={0.82} /></Pop>
      <Pop at={W.loyal} to={e(11) + 0.2} x={540} y={1470} z={2}><Arrow w={150} down /></Pop>

      {/* ٩: 14 أكتوبر 2025 — مركز الإمام الألباني */}
      <Pop at={W.d14} to={W.closed - 0.1} x={540} y={940} z={3} enter={0.6}><Num value="14.10.2025" size={190} color={HS.vermilion} /></Pop>
      <Pop at={W.amman} to={e(14) + 0.2} x={760} y={780} z={2}><MapJordan s={440} pulse={(t * 0.6) % 1} /></Pop>
      <Pop at={W.closed - 0.3} to={e(14) + 0.2} x={330} y={780} z={2}><Building s={420} dome seal={bars(W.closed, 1.4)} /></Pop>
      <Pop at={W.awqaf2} to={e(14) + 0.2} x={540} y={1010} z={3}><Tag ar="وزارة الأوقاف" lat="Ministry of Awqaf" scale={0.78} accent={HS.lapis} /></Pop>
      <Pop at={W.albani} to={e(14) + 0.2} x={540} y={1170} z={3}><Tag ar="مركز الإمام الألباني" lat="Imam Al-Albani Center" scale={0.86} /></Pop>
      <Pop at={W.bookA} to={e(14) + 0.2} x={330} y={1360} z={2}><Book s={200} /></Pop>
      <Pop at={W.blank} to={e(14) + 0.2} x={750} y={1360} z={2}><Doc s={190} kind="blank" /></Pop>
      <Pop at={W.mp} to={e(14) + 0.2} x={540} y={1520} z={2}><Tag ar="نائب" lat="Member of Parliament" scale={0.74} accent={HS.lapis} /></Pop>
      <Pop at={W.ghiras} to={e(14) + 0.2} x={470} y={1665} z={2}><Tag ar="مركز غراس" lat="Ghiras Center" scale={0.74} dashed /></Pop>
      <Pop at={W.ghiras + 2.0} to={e(14) + 0.2} x={760} y={1665} z={2}><QBadge s={110} /></Pop>

      {/* ١٠: السؤال الأخير */}
      <Pop at={c(15)} to={CUE.total + 1} x={540} y={620} z={2} enter={0.7} rise={0}><div style={{ fontFamily: F_AR, fontSize: 560, lineHeight: 1, color: HS.vermilion, fontWeight: 700, transform: `scale(${1 + 0.025 * Math.sin(t * 2.2)})` }}>؟</div></Pop>
      <Pop at={W.jordan18} to={CUE.total + 1} x={190} y={1165} z={2}><MapJordan s={300} pulse={(t * 0.5) % 1} /></Pop>
      <Pop at={W.ahbash} to={CUE.total + 1} x={540} y={1050} z={2}><Tag ar="الأحباش" lat="Al-Ahbash" scale={0.95} /></Pop>
      <Pop at={W.ashaera} to={CUE.total + 1} x={540} y={1280} z={2}><Tag ar="الأشعرية" lat="Al-Ash'ariyya" scale={0.95} accent={HS.lapis} /></Pop>
      {[0, 1, 2, 3, 4].map((i) => <Pop key={"ch" + i} at={W.decision + i * 0.12} to={CUE.total + 1} x={190 + i * 175} y={1560} z={2}><Chair s={150} color={i === 2 ? HS.gold : HS.sepia} /></Pop>)}

      {/* شريط السنوات الدائم */}
      <HistTimeline w={1080} h={1920} y={1815} x0={110} x1={970} y0={2016} y1={2026} events={[2016, 2021, 2022, 2023, 2025]} prog={progAt(t)} />
      <QAProbe />
    </AbsoluteFill>
  );
};
