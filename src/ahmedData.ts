// Timings and metadata for Ahmed Al-Tayeb Refutation Video
export const FPS = 25;
export const TOTAL_SECONDS = 798.36;
export const TOTAL_FRAMES = 19959;

export interface LowerThird {
  id: string;
  from: number; // in frames
  dur: number;  // in frames
  title: string;
  subtitle?: string;
  type: "speaker" | "topic" | "hadith" | "warning";
}

export interface BRollCard {
  id: string;
  from: number; // in frames
  dur: number;  // in frames
  image: string;
  title: string;
  caption: string;
  position: "top-left" | "top-right";
}

export interface ZoomInterval {
  from: number;
  dur: number;
  scale: number;
}

// 10% Zoom punch-in segments (fps = 25)
// Kept moderate and non-intrusive (6 moments across 13.3 mins)
export const zoomIntervals: ZoomInterval[] = [
  { from: 10 * FPS, dur: 14 * FPS, scale: 1.10 },    // Opening strong quote refutation
  { from: 70 * FPS, dur: 16 * FPS, scale: 1.10 },    // Topic of (العباد كلهم إخوة)
  { from: 175 * FPS, dur: 15 * FPS, scale: 1.10 },   // Hadith text analysis
  { from: 320 * FPS, dur: 14 * FPS, scale: 1.10 },   // Apostasy rule emphasis
  { from: 438 * FPS, dur: 15 * FPS, scale: 1.10 },   // Addressing Ahmed Al-Tayeb
  { from: 700 * FPS, dur: 16 * FPS, scale: 1.10 },   // Grand Imam position critique
  { from: 775 * FPS, dur: 18 * FPS, scale: 1.10 },   // Strong closing argument
];

// Lower Thirds: Key terms, topics, and speaker name
export const lowerThirds: LowerThird[] = [
  // Intro & Speaker name
  {
    id: "main-title",
    from: 3 * FPS,
    dur: 7 * FPS,
    title: "بيان كذب وافتراء أحمد الطيب على النبي ﷺ",
    subtitle: "تفنيد تحريف حديث (العباد كلهم إخوة)",
    type: "topic",
  },
  {
    id: "speaker-1",
    from: 12 * FPS,
    dur: 6 * FPS,
    title: "الشيخ د. عبد الرحمن دمشقية",
    subtitle: "عالم ومناظر إسلامي",
    type: "speaker",
  },
  {
    id: "topic-ridda",
    from: 28 * FPS,
    dur: 8 * FPS,
    title: "ثبوت حكم الردة في الشريعة الإسلامية",
    subtitle: "إجماع نصوص الكتاب والسنة المطهرة",
    type: "warning",
  },
  {
    id: "hadith-1",
    from: 68 * FPS,
    dur: 9 * FPS,
    title: "تحريف لفظ وسياق الحديث",
    subtitle: "دعوى (العباد كلهم إخوة) وتوظيفها الباطل",
    type: "hadith",
  },
  {
    id: "topic-context",
    from: 172 * FPS,
    dur: 9 * FPS,
    title: "سياق الأحاديث وأسباب ورودها",
    subtitle: "الأخوة الإيمانية لا تتساوى مع الكفر والشرك",
    type: "topic",
  },
  {
    id: "speaker-2",
    from: 290 * FPS,
    dur: 6 * FPS,
    title: "الشيخ د. عبد الرحمن دمشقية",
    subtitle: "عالم ومناظر إسلامي",
    type: "speaker",
  },
  {
    id: "topic-sorbonne",
    from: 390 * FPS,
    dur: 8 * FPS,
    title: "خطورة الفكر التلفيقي المنهزم",
    subtitle: "التنازل عن ثوابت الدين لمجاملة أعدائه",
    type: "warning",
  },
  {
    id: "topic-azhar-crisis",
    from: 485 * FPS,
    dur: 8 * FPS,
    title: "لماذا السكوت عن هذا التضليل؟",
    subtitle: "واجب العلماء في الصدع بالحق والتحذير من الباطل",
    type: "warning",
  },
  {
    id: "speaker-3",
    from: 590 * FPS,
    dur: 6 * FPS,
    title: "الشيخ د. عبد الرحمن دمشقية",
    subtitle: "عالم ومناظر إسلامي",
    type: "speaker",
  },
  {
    id: "topic-sunnah-defense",
    from: 642 * FPS,
    dur: 8 * FPS,
    title: "الدفاع عن جناب النبي المصطفى ﷺ",
    subtitle: "رد افتراءات الملبسين على رسول الله",
    type: "hadith",
  },
  {
    id: "topic-conclusion",
    from: 760 * FPS,
    dur: 10 * FPS,
    title: "نصيحة وتحذير للأمة الإسلامية",
    subtitle: "الحق أحق أن يتبع ولا عصمة لأحد بعد المعصوم ﷺ",
    type: "warning",
  },
];

// B-roll cards for prominent figures
export const brollCards: BRollCard[] = [
  {
    id: "tayeb-portrait-1",
    from: 438 * FPS,
    dur: 11 * FPS,
    image: "broll/ahmed_el_tayeb.jpg",
    title: "أحمد الطيب",
    caption: "شيخ الأزهر الحالي",
    position: "top-left",
  },
  {
    id: "tayeb-portrait-2",
    from: 700 * FPS,
    dur: 12 * FPS,
    image: "broll/ahmed_el_tayeb2.jpg",
    title: "منصب مشيخة الأزهر",
    caption: "مسؤولية الكلمة وأمانة الدين",
    position: "top-left",
  },
];

// Periodic subscribe reminders
export const subscribeMoments: [number, number][] = [
  [120 * FPS, 6 * FPS],
  [380 * FPS, 6 * FPS],
  [670 * FPS, 6 * FPS],
];
