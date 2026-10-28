/**
 * bidahStory.ts
 * Storyboard beats, camera framing, speech pulses, and word-by-word synced captions
 * for the Bidah Comedy Cartoon.
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

export type Role = "youth" | "sheikh" | "friend" | "none";

export interface StoryBeat {
  from: number;
  to: number;
  actor: Role;
  speaker: Role;
  environment: string;
  action: string;
  shot: "medium_youth" | "medium_sheikh" | "closeup_sheikh" | "two_shot_sheikh_friend" | "wide_chase";
  note: string;
}

export const BIDAH_FPS = 30;
export const BIDAH_DURATION_SEC = 31.833;
export const BIDAH_TOTAL_FRAMES = 955;

export const BEATS: StoryBeat[] = [
  {
    from: 0.0,
    to: 3.04,
    actor: "youth",
    speaker: "youth",
    environment: "majlis",
    action: "argue_confidently",
    shot: "medium_youth",
    note: "Youth raises finger challenging for proof",
  },
  {
    from: 3.04,
    to: 7.22,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "insult_disbelief",
    shot: "medium_sheikh",
    note: "Sheikh stares in disbelief and calls out the foolishness",
  },
  {
    from: 7.22,
    to: 8.26,
    actor: "youth",
    speaker: "youth",
    environment: "majlis",
    action: "stubborn_smug",
    shot: "medium_youth",
    note: "Youth smugly repeats: but you have no proof",
  },
  {
    from: 8.26,
    to: 9.3,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "shocked_rage",
    shot: "closeup_sheikh",
    note: "Sheikh is stunned: I have no proof?!",
  },
  {
    from: 9.3,
    to: 10.04,
    actor: "friend",
    speaker: "friend",
    environment: "majlis",
    action: "calm_down",
    shot: "two_shot_sheikh_friend",
    note: "Friend holds Sheikh back saying calm down",
  },
  {
    from: 10.04,
    to: 14.92,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "explain_calmly",
    shot: "medium_sheikh",
    note: "Sheikh explains that absence of proof IS the proof of bidah",
  },
  {
    from: 14.92,
    to: 15.96,
    actor: "youth",
    speaker: "youth",
    environment: "majlis",
    action: "clueless_question",
    shot: "medium_youth",
    note: "Youth looks blankly: What does that mean?",
  },
  {
    from: 15.96,
    to: 23.42,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "explain_passionately",
    shot: "medium_sheikh",
    note: "Sheikh bursts out explaining the obvious logic",
  },
  {
    from: 23.42,
    to: 25.38,
    actor: "youth",
    speaker: "youth",
    environment: "majlis",
    action: "blank_repetition",
    shot: "medium_youth",
    note: "Youth repeats blankly: So there is no proof?",
  },
  {
    from: 25.38,
    to: 29.5,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "despair_struggle",
    shot: "wide_chase",
    note: "Sheikh clutches his head shouting he will give me a stroke, then says minute!",
  },
  {
    from: 29.5,
    to: 31.833,
    actor: "sheikh",
    speaker: "sheikh",
    environment: "majlis",
    action: "hit_and_beat",
    shot: "wide_chase",
    note: "Sheikh lunges and hits the youth in comedic slapstick beatdown",
  },
];

export const getBeat = (time: number): StoryBeat => {
  const hit = BEATS.find((b) => time >= b.from && time < b.to);
  return hit ?? BEATS[BEATS.length - 1];
};

export const CAPTIONS: CaptionCue[] = [
  {
    from: 0.0,
    to: 3.04,
    words: [
      { text: "أعطني", at: 0.0 },
      { text: "دليل", at: 0.3 },
      { text: "واحد،", at: 0.6 },
      { text: "إن", at: 0.94 },
      { text: "الموضوع", at: 1.06 },
      { text: "هذا", at: 1.5 },
      { text: "بدعة،", at: 1.64 },
      { text: "وأنا", at: 2.08 },
      { text: "بصدقك!", at: 2.46 },
    ],
  },
  {
    from: 3.04,
    to: 7.22,
    words: [
      { text: "شوف", at: 4.02 },
      { text: "يا", at: 4.58 },
      { text: "علي،", at: 4.72 },
      { text: "هو", at: 4.98 },
      { text: "أنت", at: 6.26 },
      { text: "غبي", at: 6.4 },
      { text: "فعلاً؟!...", at: 6.68 },
    ],
  },
  {
    from: 7.22,
    to: 8.26,
    words: [
      { text: "بس", at: 7.22 },
      { text: "ما", at: 7.52 },
      { text: "عندك", at: 7.6 },
      { text: "دليل!", at: 7.9 },
    ],
  },
  {
    from: 8.26,
    to: 9.3,
    words: [
      { text: "ما", at: 8.3 },
      { text: "عندي", at: 8.52 },
      { text: "دليل؟!", at: 8.84 },
    ],
  },
  {
    from: 9.3,
    to: 10.04,
    words: [
      { text: "اهدأ،", at: 9.3 },
      { text: "اهدأ...", at: 9.62 },
    ],
  },
  {
    from: 10.04,
    to: 14.92,
    words: [
      { text: "سيبني", at: 10.04 },
      { text: "يا", at: 10.26 },
      { text: "بيه", at: 10.36 },
      { text: "أفهمه", at: 10.56 },
      { text: "بالراحة..", at: 10.86 },
      { text: "ما", at: 11.52 },
      { text: "هو", at: 11.94 },
      { text: "الدليل", at: 12.08 },
      { text: "إنه", at: 12.6 },
      { text: "بدعة", at: 12.78 },
      { text: "إنه", at: 13.22 },
      { text: "ما", at: 13.54 },
      { text: "فيش", at: 13.62 },
      { text: "دليل", at: 14.06 },
      { text: "عليه!", at: 14.38 },
    ],
  },
  {
    from: 14.92,
    to: 15.96,
    words: [
      { text: "شو", at: 14.92 },
      { text: "يعني؟!", at: 15.6 },
    ],
  },
  {
    from: 15.96,
    to: 23.42,
    words: [
      { text: "شو", at: 15.96 },
      { text: "اللي", at: 16.16 },
      { text: "يعني", at: 16.24 },
      { text: "شو؟!", at: 16.54 },
      { text: "ما", at: 16.78 },
      { text: "فيش", at: 17.06 },
      { text: "دليل", at: 17.26 },
      { text: "عليه", at: 17.6 },
      { text: "فبالتالي", at: 17.94 },
      { text: "هو", at: 18.66 },
      { text: "بدعة!", at: 18.98 },
      { text: "عايز", at: 19.88 },
      { text: "دليل", at: 20.54 },
      { text: "على", at: 20.94 },
      { text: "إنه", at: 21.24 },
      { text: "بدعة", at: 21.52 },
      { text: "وهو", at: 22.02 },
      { text: "مالوش", at: 22.44 },
      { text: "وجود", at: 22.62 },
      { text: "أصلاً!", at: 22.9 },
    ],
  },
  {
    from: 23.42,
    to: 25.38,
    words: [
      { text: "يعني", at: 23.42 },
      { text: "ما", at: 23.88 },
      { text: "في", at: 24.1 },
      { text: "دليل؟!", at: 24.52 },
    ],
  },
  {
    from: 25.38,
    to: 29.5,
    words: [
      { text: "هيشلني!", at: 25.38 },
      { text: "ده", at: 25.76 },
      { text: "هيشلني!", at: 26.36 },
      { text: "سيبني", at: 27.06 },
      { text: "يا", at: 27.44 },
      { text: "بيه...", at: 27.68 },
      { text: "دقيقة!", at: 29.16 },
    ],
  },
  {
    from: 29.5,
    to: 31.833,
    words: [
      { text: "تعال", at: 29.8 },
      { text: "لي", at: 30.4 },
      { text: "هنا!", at: 30.98 },
    ],
  },
];

export const VOICE_SPANS: [number, number][] = [
  [0.0, 0.3], [0.3, 0.6], [0.6, 0.94], [0.94, 1.06], [1.06, 1.5], [1.5, 1.64], [1.64, 2.08], [2.08, 2.46], [2.46, 3.04],
  [4.02, 4.58], [4.58, 4.72], [4.72, 4.98], [4.98, 5.16], [5.16, 5.52], [5.52, 5.78],
  [6.18, 6.4], [6.4, 6.68], [6.68, 7.22],
  [7.22, 7.52], [7.52, 7.6], [7.6, 7.9], [7.9, 8.26],
  [8.3, 8.52], [8.52, 8.84], [8.84, 9.3],
  [9.3, 9.62], [9.62, 9.96],
  [10.04, 10.26], [10.26, 10.36], [10.36, 10.56], [10.56, 10.86], [10.86, 11.52],
  [11.52, 11.94], [11.94, 12.08], [12.08, 12.6], [12.6, 12.78], [12.78, 13.22],
  [13.22, 13.54], [13.54, 13.82], [13.82, 14.06], [14.06, 14.38], [14.38, 14.92],
  [14.92, 15.6], [15.6, 15.96],
  [15.96, 16.16], [16.16, 16.54], [16.54, 16.78], [16.78, 17.26], [17.26, 17.6], [17.6, 17.94],
  [17.94, 18.66], [18.66, 18.98], [18.98, 19.56], [19.56, 20.12], [20.12, 20.4], [20.4, 20.94],
  [20.94, 21.24], [21.24, 21.52], [21.52, 22.02], [22.02, 22.36], [22.36, 22.62], [22.62, 22.9], [22.9, 23.42],
  [23.42, 23.88], [23.88, 24.1], [24.1, 24.52],
  [25.38, 25.76], [25.76, 26.36], [26.36, 27.06], [27.06, 27.44], [27.44, 27.68], [27.68, 28.3], [28.3, 28.84], [28.9, 29.45],
  [29.7, 30.2], [30.2, 30.7], [30.8, 31.5]
];

export const speechPulse = (time: number): number => {
  const span = VOICE_SPANS.find(([s, e]) => time >= s && time < e);
  if (!span) return 0;
  const p = (time - span[0]) / Math.max(0.04, span[1] - span[0]);
  return Math.sin(Math.PI * p) * (0.75 + 0.25 * Math.sin(time * 16) ** 2);
};
