export const FPS = 25;
export const TRIAL_SECONDS = 120;
export const TOTAL_FRAMES = TRIAL_SECONDS * FPS; // 3000 frames

// Camera angles / framing switches (Muhammad Ghanayem style)
// Alternating between normal framing (1.0) and punch-in tight framing (1.12)
export interface CameraCut {
  from: number; // frame
  dur: number;  // frame
  scale: number;
  origin: string;
}

export const cameraCuts: CameraCut[] = [
  { from: 0, dur: 4 * FPS, scale: 1.0, origin: "center 38%" },           // 0-4s: Wide intro
  { from: 4 * FPS, dur: 7 * FPS, scale: 1.12, origin: "center 35%" },     // 4-11s: Tight (Opening hook)
  { from: 11 * FPS, dur: 4 * FPS, scale: 1.0, origin: "center 38%" },     // 11-15s: Wide
  { from: 15 * FPS, dur: 7 * FPS, scale: 1.12, origin: "center 35%" },     // 15-22s: Tight (The quote)
  { from: 22 * FPS, dur: 6 * FPS, scale: 1.0, origin: "center 38%" },     // 22-28s: Wide
  { from: 28 * FPS, dur: 8 * FPS, scale: 1.12, origin: "center 35%" },     // 28-36s: Tight (Interview context)
  { from: 36 * FPS, dur: 8 * FPS, scale: 1.0, origin: "center 38%" },     // 36-44s: Wide
  { from: 44 * FPS, dur: 9 * FPS, scale: 1.12, origin: "center 35%" },     // 44-53s: Tight (Refutation starts)
  { from: 53 * FPS, dur: 8 * FPS, scale: 1.0, origin: "center 38%" },     // 53-61s: Wide
  { from: 61 * FPS, dur: 10 * FPS, scale: 1.12, origin: "center 35%" },    // 61-71s: Tight (Hadith mention)
  { from: 71 * FPS, dur: 9 * FPS, scale: 1.0, origin: "center 38%" },     // 71-80s: Wide
  { from: 80 * FPS, dur: 10 * FPS, scale: 1.12, origin: "center 35%" },    // 80-90s: Tight (Meaning analysis)
  { from: 90 * FPS, dur: 9 * FPS, scale: 1.0, origin: "center 38%" },     // 90-99s: Wide
  { from: 99 * FPS, dur: 11 * FPS, scale: 1.12, origin: "center 35%" },    // 99-110s: Tight (Faith brotherhood)
  { from: 110 * FPS, dur: 10 * FPS, scale: 1.0, origin: "center 38%" },   // 110-120s: Wide closing section
];

// Ghanayem-style Kinetic Callout Titles (Bold, centered or dynamic Lower-Thirds)
export interface KineticTitle {
  id: string;
  from: number;
  dur: number;
  mainText: string;
  highlightText?: string;
  subText?: string;
  style: "quote" | "statement" | "speaker" | "topic";
}

export const kineticTitles: KineticTitle[] = [
  {
    id: "spk",
    from: 1 * FPS,
    dur: 4 * FPS,
    mainText: "الشيخ د. عبد الرحمن دمشقية",
    subText: "عالم ومناظر إسلامي",
    style: "speaker",
  },
  {
    id: "hook",
    from: 5 * FPS,
    dur: 6 * FPS,
    mainText: "«ما رأيت في حياتي أحمر وأغبى من هذا المرتد!»",
    highlightText: "افتراء صريح وتضليل",
    style: "statement",
  },
  {
    id: "quote-1",
    from: 16 * FPS,
    dur: 6 * FPS,
    mainText: "«إذا المسلم تنصّر... ما عندي مشكلة!»",
    subText: "المقابلة المزعومة المروّجة لإلغاء حد الردة",
    style: "quote",
  },
  {
    id: "quote-2",
    from: 35 * FPS,
    dur: 6 * FPS,
    mainText: "«لا أؤمن بالردة ولا أؤمن بهذا الكلام!»",
    subText: "إنكار ما هو معلوم من الدين بالضرورة",
    style: "quote",
  },
  {
    id: "topic-prophet",
    from: 54 * FPS,
    dur: 6 * FPS,
    mainText: "الافتراء على جناب النبي ﷺ",
    subText: "تحريف الأحاديث واستغلال ألفاظها بغير وجهها",
    style: "topic",
  },
  {
    id: "hadith-name",
    from: 68 * FPS,
    dur: 8 * FPS,
    mainText: "شبهة حديث: «العباد كلهم إخوة»",
    subText: "كيف وظّفه دعاة التمييع لضرب عقيدة الولاء والبراء؟",
    style: "topic",
  },
  {
    id: "faith-distinction",
    from: 88 * FPS,
    dur: 8 * FPS,
    mainText: "«الأخوة الإيمانية لا تتساوى مع الكفر»",
    highlightText: "بيان الفارق القرآني بين المسلم والكافر",
    style: "statement",
  },
  {
    id: "warning-conclusion",
    from: 104 * FPS,
    dur: 8 * FPS,
    mainText: "تحذير الأمة من التلفيق المنهزم",
    subText: "ثوابت الشريعة ليست محلاً للمجاملات السياسية",
    style: "statement",
  },
];
