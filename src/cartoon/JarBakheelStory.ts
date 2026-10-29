/**
 * JarBakheelStory.ts
 * Storyboard beats, character roles, actions, camera framing, and word-by-word synced captions.
 */

export interface WordCue {
  text: string;
  at: number;
}

export interface CaptionCue {
  from: number;
  to: number;
  words: WordCue[];
}

export type Role = "neighbor" | "miser" | "narrator" | "both" | "none";

export interface StoryBeat {
  id: string;
  from: number;
  to: number;
  speaker: Role;
  focus: "street" | "neighbor" | "miser" | "eating_flashback" | "outro";
  actionNeighbor: string;
  actionMiser: string;
  note: string;
}

export const JAR_FPS = 30;
export const JAR_TOTAL_FRAMES = 1652; // 55.07 seconds * 30 fps

export const BEATS: StoryBeat[] = [
  // 1. Establishing / Narration
  {
    id: "intro",
    from: 0.0,
    to: 3.06,
    speaker: "narrator",
    focus: "street",
    actionNeighbor: "idle",
    actionMiser: "idle",
    note: "Two neighboring houses, warm comic street atmosphere",
  },
  {
    id: "tease_intro",
    from: 3.06,
    to: 8.16,
    speaker: "narrator",
    focus: "street",
    actionNeighbor: "walk_in",
    actionMiser: "guard_door",
    note: "Neighbor approaches miser's door smiling; miser clutches his door and locked chest",
  },
  // 2. Neighbor confronts miser
  {
    id: "neighbor_shout",
    from: 8.16,
    to: 14.24,
    speaker: "neighbor",
    focus: "neighbor",
    actionNeighbor: "point_accuse",
    actionMiser: "hands_hips",
    note: "Neighbor: ويلك منذ عشرين سنة وأنت جاري",
  },
  {
    id: "neighbor_complain",
    from: 14.24,
    to: 17.86,
    speaker: "neighbor",
    focus: "neighbor",
    actionNeighbor: "shrug_spread",
    actionMiser: "hands_hips",
    note: "لم تدعني مرة إلى بيتك!",
  },
  // 3. Miser shock & rejection
  {
    id: "miser_refusal",
    from: 17.86,
    to: 21.80,
    speaker: "miser",
    focus: "miser",
    actionNeighbor: "hands_hips",
    actionMiser: "hands_up_refuse",
    note: "Miser: معاذ الله أن أدعوك!",
  },
  // 4. Neighbor asks why
  {
    id: "neighbor_why",
    from: 21.80,
    to: 24.08,
    speaker: "neighbor",
    focus: "neighbor",
    actionNeighbor: "shrug_spread",
    actionMiser: "hands_hips",
    note: "قال: لمَ؟",
  },
  // 5. Miser explains: flashback starts
  {
    id: "miser_saw_you",
    from: 24.08,
    to: 29.50,
    speaker: "miser",
    focus: "miser",
    actionNeighbor: "listen",
    actionMiser: "point_talk",
    note: "قال: لأني رأيتك مرة تأكل فرأيت عجباً!",
  },
  // 6. Flashback: The dining scene
  {
    id: "flashback_chewing",
    from: 29.50,
    to: 34.86,
    speaker: "miser",
    focus: "eating_flashback",
    actionNeighbor: "gobble_food",
    actionMiser: "spectate_shock",
    note: "رأيتك لا تحسن المضغ، وتسرع البلع!",
  },
  {
    id: "flashback_three_morsels",
    from: 34.86,
    to: 41.10,
    speaker: "miser",
    focus: "eating_flashback",
    actionNeighbor: "three_morsels_climax",
    actionMiser: "spectate_shock",
    note: "لقمة في فمك، وأخرى في يدك، وعينك ترنو إلى الثالثة!",
  },
  // 7. Climax Punchline: Neighbor laughs / complains
  {
    id: "climax_punchline",
    from: 41.10,
    to: 47.24,
    speaker: "neighbor",
    focus: "street",
    actionNeighbor: "hands_up_laugh",
    actionMiser: "hands_behind",
    note: "فقال سبحان الله، أتريد أن أصلي بين اللقمة واللقمة ركعتين؟!",
  },
  // 8. Outro
  {
    id: "outro",
    from: 47.24,
    to: 55.07,
    speaker: "none",
    focus: "outro",
    actionNeighbor: "wave",
    actionMiser: "wave",
    note: "Outro with friendly like & subscribe card and smiling cartoon characters",
  },
];

export const CAPTIONS: CaptionCue[] = [
  {
    from: 0.0,
    to: 3.06,
    words: [
      { text: "جارٌ", at: 0.0 },
      { text: "مع", at: 1.24 },
      { text: "جارهِ،", at: 1.48 },
    ],
  },
  {
    from: 3.06,
    to: 8.16,
    words: [
      { text: "داعبَ", at: 3.06 },
      { text: "بعضُهم", at: 5.18 },
      { text: "جاراً", at: 5.92 },
      { text: "لهُ", at: 6.44 },
      { text: "معروفاً", at: 6.64 },
      { text: "بالبخل،", at: 7.52 },
    ],
  },
  {
    from: 8.16,
    to: 14.24,
    words: [
      { text: "فقالَ", at: 8.16 },
      { text: "لهُ:", at: 10.44 },
      { text: "ويلَكَ!", at: 10.64 },
      { text: "منذُ", at: 11.18 },
      { text: "عشرينَ", at: 11.86 },
      { text: "سنة", at: 12.42 },
      { text: "وأنتَ", at: 12.86 },
      { text: "جاري،", at: 13.7 },
    ],
  },
  {
    from: 14.24,
    to: 17.86,
    words: [
      { text: "لم", at: 14.24 },
      { text: "تدعُني", at: 15.06 },
      { text: "مرّةً", at: 15.68 },
      { text: "إلى", at: 16.74 },
      { text: "بيتكَ!", at: 17.08 },
    ],
  },
  {
    from: 17.86,
    to: 21.80,
    words: [
      { text: "فقالَ", at: 17.86 },
      { text: "جارهُ:", at: 19.18 },
      { text: "معاذَ", at: 19.7 },
      { text: "اللهِ", at: 20.48 },
      { text: "أن", at: 20.64 },
      { text: "أدعوَك!", at: 21.1 },
    ],
  },
  {
    from: 21.80,
    to: 24.08,
    words: [
      { text: "قالَ:", at: 21.8 },
      { text: "لِمَ؟", at: 23.56 },
    ],
  },
  {
    from: 24.08,
    to: 29.50,
    words: [
      { text: "قالَ:", at: 24.08 },
      { text: "لأنّي", at: 24.92 },
      { text: "رأيتُكَ", at: 25.44 },
      { text: "مرّةً", at: 26.12 },
      { text: "تأكُلُ", at: 26.68 },
      { text: "فرأيتُ", at: 27.46 },
      { text: "عجباً!", at: 28.5 },
    ],
  },
  {
    from: 29.50,
    to: 34.86,
    words: [
      { text: "رأيتُكَ", at: 30.0 },
      { text: "لا", at: 31.32 },
      { text: "تُحسِنُ", at: 31.6 },
      { text: "المَضغ،", at: 32.28 },
      { text: "وتُسرِعُ", at: 32.82 },
      { text: "البَلع،", at: 34.34 },
    ],
  },
  {
    from: 34.86,
    to: 41.10,
    words: [
      { text: "لُقمةٌ", at: 34.86 },
      { text: "في", at: 36.0 },
      { text: "فمِك،", at: 36.3 },
      { text: "وأُخرى", at: 36.94 },
      { text: "في", at: 38.02 },
      { text: "يدِك،", at: 38.12 },
      { text: "وعينُك", at: 38.7 },
      { text: "ترنو", at: 39.68 },
      { text: "إلى", at: 40.18 },
      { text: "الثالثة!", at: 40.36 },
    ],
  },
  {
    from: 41.10,
    to: 47.24,
    words: [
      { text: "فقالَ:", at: 41.1 },
      { text: "سبحانَ", at: 42.92 },
      { text: "اللهِ!", at: 43.38 },
      { text: "أتريدُ", at: 43.7 },
      { text: "أن", at: 44.26 },
      { text: "أُصلّي", at: 44.38 },
      { text: "بينَ", at: 44.92 },
      { text: "اللقمةِ", at: 45.22 },
      { text: "واللقمةِ", at: 45.84 },
      { text: "ركعتين؟!", at: 46.42 },
    ],
  },
  {
    from: 47.24,
    to: 54.50,
    words: [
      { text: "لا", at: 47.24 },
      { text: "تنسوا", at: 48.14 },
      { text: "الإعجابَ", at: 48.52 },
      { text: "بالفيديو", at: 48.96 },
      { text: "والاشتراكَ", at: 49.52 },
      { text: "في", at: 50.08 },
      { text: "القناةِ", at: 50.28 },
      { text: "تشجيعاً", at: 50.78 },
      { text: "لنا", at: 51.48 },
      { text: "لنستمر", at: 51.72 },
      { text: "بنشر", at: 52.54 },
      { text: "المزيد", at: 53.0 },
      { text: "إن", at: 53.46 },
      { text: "شاء", at: 53.66 },
      { text: "الله", at: 53.92 },
    ],
  },
];

export function getCurrentBeat(time: number): StoryBeat {
  const b = BEATS.find((beat) => time >= beat.from && time < beat.to);
  return b || BEATS[BEATS.length - 1];
}

