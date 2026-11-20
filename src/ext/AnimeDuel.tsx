import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Warrior, solve, STAND, lerp, type Pose, type Costume, type V2 } from "./DuelWarrior";
import { Captions, Watermark, capPages, type CapWord } from "../cartoon/Overlays";

/**
 * «المبارزة»: دقيقة أنمي بالكود (بطلب المستخدم 2026-11-20): جيشان يقفان صفّين، كافر يطلب المبارزة، وعليّ يبرز إليه، ثم قتال بلا كلام.
 * كل الرؤوس بخوذة ولثام (بلا وجوه). طولي ٩:١٦ حسب قاعدة الكرتون. الصوت: بدر لعليّ، وصوت حسن للكافر، ومؤثرات خافتة ≤ ٦.
 */
export const DUEL_FPS = 24;
export const DUEL_FRAMES = 1440;
const W = 1080, H = 1920, GROUND = 1500;
const LINE = "#1e1410";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EASE = { io: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), out: (t: number) => 1 - Math.pow(1 - t, 3), in: (t: number) => t * t * t, lin: (t: number) => t };
type EaseK = keyof typeof EASE;
const seeded = (seed: number) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); };

/* ───────────── الأزياء ───────────── */
const MUSLIM: Costume = {
  kind: "muslim", line: LINE, cloth: "#efe6d0", cloth2: "#cfc3a5", trouser: "#8a7a5a", boot: "#4a3322", sash: "#1f7a4d", mail: "#8e96a3",
  helm: "#aeb6c1", helmTrim: "#f4efe3", veil: "#f0ead8", plume: "#1f7a4d", cape: "#6a4a2f", shield: "#2d6b4a", boss: "#d8b04a", skin: "#c98a5e", steel: "#d9e1ea", build: 1,
};
const ALI: Costume = { ...MUSLIM, turban: true, cape: "#1d5e3f", cloth: "#f6f0df", sash: "#d8b04a", shield: "#1f7a4d" };
const KAFIR: Costume = {
  kind: "kafir", line: LINE, cloth: "#33343d", cloth2: "#3f4049", trouser: "#26262d", boot: "#17171c", sash: "#a3322a", mail: "#646b78",
  helm: "#4a505c", helmTrim: "#b08d3a", veil: "#26262d", plume: "#b0302a", cape: "#5a1f1f", shield: "#7a2a22", boss: "#c9a24a", skin: "#a8744f", steel: "#c4ccd6", build: 1.18,
};
const KAFIR_SOLDIER: Costume = { ...KAFIR, build: 1.05, cape: "#3a2020" };
const E1_CO: Costume = { ...KAFIR, build: 1.08, cape: "#2c2c3a", plume: "#8f2a22", sash: "#6e2a2a" };
const E2_CO: Costume = { ...KAFIR, build: 1.1, cape: "#47281c", plume: "#c07a30", sash: "#8a5a20", shield: "#4d3322" };

/* ───────────── الأوضاع ───────────── */
const SW_IDLE: Pose = { ...STAND, hand: [34, -14], blade: 166, bladeL: 0, sh: [50, -60], shield: 1, shA: 0 };
const GUARD_A: Pose = { ...STAND, crouch: 34, lean: 8, hand: [150, -150], blade: -30, bladeL: 1, sh: [150, -130], shA: -4, shield: 1, fa: 90, ba: -100, bAng: 25, cloak: 12 };
const GUARD_K: Pose = { ...STAND, crouch: 44, lean: 6, hand: [170, -160], blade: -25, bladeL: 1, sh: [130, -110], shA: 0, shield: 1, fa: 100, ba: -110, bAng: 25, cloak: 12 };
const P = (base: Pose, o: Partial<Pose>): Pose => ({ ...base, ...o });
const WIND_UP: Pose = P(GUARD_K, { hand: [90, -330], blade: -125, crouch: 20, lean: -8, fa: 70, ba: -80, bAng: 5, sh: [110, -150], shA: -10, cloak: 36 });
const CHOP: Pose = P(GUARD_K, { hand: [232, -170], blade: 35, crouch: 80, lean: 24, fa: 125, ba: -125, bAng: 42, cloak: -12 });

type Key = { f: number; x?: number; p: Pose; e?: EaseK; fall?: number; g?: number; d?: 1 | -1 };

/** عليّ: يقف في صفّه، يتقدّم، ثم قتال */
const KEYS_A: Key[] = [
  { f: 0, x: -800, p: SW_IDLE },
  { f: 440, x: -800, p: SW_IDLE },
  { f: 540, x: -328, p: SW_IDLE },
  { f: 562, x: -328, p: P(SW_IDLE, { hand: [34, -14] }) },
  { f: 574, x: -328, p: P(GUARD_A, { hand: [120, -110], blade: -60, bladeL: 0.45, crouch: 20 }), e: "out" },
  { f: 584, x: -328, p: P(GUARD_A, { crouch: 30 }), e: "io" },
  { f: 624, x: -328, p: GUARD_A },
  { f: 640, x: -290, p: P(GUARD_A, { crouch: 38, fa: 96 }) },
  { f: 652, x: -262, p: P(GUARD_A, { crouch: 40 }) },
  { f: 658, x: -262, p: P(GUARD_A, { sh: [200, -230], shA: 12, hand: [100, -140], blade: -70, crouch: 56, lean: 14, fa: 110, ba: -120, bAng: 35 }), e: "out" },
  { f: 668, x: -262, p: P(GUARD_A, { sh: [204, -234], shA: 12, hand: [100, -140], blade: -70, crouch: 58, lean: 14, fa: 110, ba: -120, bAng: 35 }) },
  { f: 678, x: -296, p: P(GUARD_A, { crouch: 44, lean: 6, sh: [170, -160] }), e: "out" },
  { f: 690, x: -296, p: P(GUARD_A, { hand: [60, -150], blade: -5, crouch: 52, lean: 10, sh: [150, -140] }) },
  { f: 698, x: -262, p: P(GUARD_A, { hand: [262, -190], blade: -8, crouch: 72, lean: 20, fa: 130, ba: -130, bAng: 40, sh: [120, -120] }), e: "out" },
  { f: 708, x: -262, p: P(GUARD_A, { hand: [262, -190], blade: -8, crouch: 72, lean: 20, fa: 130, ba: -130, bAng: 40, sh: [120, -120] }) },
  { f: 720, x: -292, p: GUARD_A },
  { f: 730, x: -282, p: P(GUARD_A, { hand: [80, -320], blade: -125, crouch: 26, lean: -6, fa: 80, ba: -95, cloak: 36 }) },
  { f: 748, x: -248, p: P(GUARD_A, { hand: [230, -190], blade: 35, trail: [-130, 35], crouch: 76, lean: 20, fa: 125, ba: -125, bAng: 42, cloak: -14 }), e: "out" },
  { f: 758, x: -248, p: P(GUARD_A, { hand: [230, -190], blade: 35, crouch: 76, lean: 20, fa: 125, ba: -125, bAng: 42 }) },
  { f: 770, x: -300, p: P(GUARD_A, { crouch: 40, lean: -4 }), e: "out" },
  { f: 800, x: -300, p: GUARD_A },
  { f: 810, x: -280, p: P(GUARD_A, { crouch: 150, lean: 26, hand: [120, -60], blade: -30, sh: [130, -80], fa: 110, ba: -70, bAng: 60 }), e: "out" },
  { f: 830, x: -262, p: P(GUARD_A, { crouch: 150, lean: 26, hand: [120, -60], blade: -30, sh: [130, -80], fa: 110, ba: -70, bAng: 60 }) },
  { f: 846, x: -240, p: P(GUARD_A, { crouch: 60, lean: -4, sh: [60, -170], hand: [60, -150] }) },
  { f: 858, x: -180, p: P(GUARD_A, { sh: [232, -180], shA: 6, hand: [120, -140], blade: -30, crouch: 72, lean: 18, fa: 130, ba: -130, bAng: 40 }), e: "out" },
  { f: 866, x: -180, p: P(GUARD_A, { hand: [170, -60], blade: 70, crouch: 72, lean: 16, fa: 130, ba: -130, bAng: 40, sh: [200, -170] }) },
  { f: 876, x: -170, p: P(GUARD_A, { hand: [210, -250], blade: -58, trail: [60, -58], crouch: 68, lean: 12, fa: 130, ba: -130, bAng: 40 }), e: "out" },
  { f: 892, x: -170, p: P(GUARD_A, { hand: [210, -250], blade: -58, crouch: 60, lean: 10 }) },
  { f: 930, x: -170, p: GUARD_A },
  // رجلا العدو يقتربان: يتلقى ضربة الثاني بدرعه
  { f: 950, x: -170, p: P(GUARD_A, { crouch: 56, lean: 14, sh: [204, -234], shA: 12, hand: [100, -140], blade: -70, fa: 110, ba: -120, bAng: 35 }), e: "out" },
  { f: 966, x: -170, p: P(GUARD_A, { crouch: 58, lean: 14, sh: [204, -234], shA: 12, hand: [100, -140], blade: -70, fa: 110, ba: -120, bAng: 35 }) },
  // يدور بجسده نحو الرجل الأول وراءه
  { f: 978, x: -170, p: P(GUARD_A, { crouch: 92, lean: 30, hand: [60, -120], blade: -170, sh: [120, -100], fa: 100, ba: -110, bAng: 40, cloak: 30 }), e: "io" },
  { f: 990, x: -190, d: -1, p: P(GUARD_A, { crouch: 36, lean: 8, hand: [150, -150], blade: -30, sh: [150, -130] }), e: "out" },
  { f: 1004, x: -190, p: P(GUARD_A, { hand: [80, -320], blade: -125, crouch: 26, lean: -6, fa: 80, ba: -95, cloak: 36 }) },
  { f: 1016, x: -170, p: P(GUARD_A, { hand: [230, -190], blade: 35, trail: [-130, 35], crouch: 76, lean: 20, fa: 125, ba: -125, bAng: 42, cloak: -14 }), e: "out" },
  { f: 1030, x: -170, p: P(GUARD_A, { hand: [230, -190], blade: 35, crouch: 76, lean: 20, fa: 125, ba: -125, bAng: 42 }) },
  { f: 1060, x: -180, p: GUARD_A },
  { f: 1090, x: -150, d: 1, p: P(GUARD_A, { crouch: 24, lean: 4, hand: [150, -90], blade: 40, sh: [60, -80], fa: 70, ba: -70, bAng: 10 }) },
  { f: 1160, x: -110, p: P(GUARD_A, { crouch: 20, lean: 2, hand: [130, -60], blade: 70, sh: [40, -70], fa: 50, ba: -50, bAng: 0, cloak: 14 }) },
  { f: 1240, x: -140, p: P(GUARD_A, { crouch: 10, lean: 0, hand: [120, -20], blade: 80, sh: [40, -70], fa: 44, ba: -44, bAng: 0, cloak: 16 }) },
  { f: 1290, x: -140, p: P(SW_IDLE, { hand: [34, -14] }), e: "io" },
  { f: 1440, x: -140, p: P(SW_IDLE, { hand: [34, -14], head: -6, cloak: 22 }) },
];

/** الكافر: يتقدّم من صفّه، ينادي، ثم يقاتل ويُهزم */
const KEYS_K: Key[] = [
  { f: 0, x: 800, p: SW_IDLE, d: -1 },
  { f: 180, x: 800, p: SW_IDLE },
  { f: 281, x: 300, p: SW_IDLE },
  { f: 292, x: 300, p: P(SW_IDLE, { sh: [120, -310], shA: -10, head: -8 }), e: "out" },
  { f: 346, x: 300, p: P(SW_IDLE, { sh: [120, -310], shA: -10, head: -8 }) },
  { f: 358, x: 300, p: SW_IDLE },
  { f: 560, x: 300, p: SW_IDLE },
  { f: 574, x: 300, p: P(GUARD_K, { hand: [130, -120], blade: -60, bladeL: 0.45, crouch: 24 }), e: "out" },
  { f: 584, x: 300, p: P(GUARD_K, { crouch: 36 }) },
  { f: 624, x: 300, p: GUARD_K },
  { f: 640, x: 268, p: P(GUARD_K, { hand: [90, -330], blade: -125, crouch: 20, lean: -8, fa: 70, ba: -80, bAng: 5, sh: [110, -150], shA: -10, cloak: 36 }) },
  { f: 656, x: 250, p: P(GUARD_K, { hand: [90, -330], blade: -125, crouch: 20, lean: -8, fa: 70, ba: -80, bAng: 5, sh: [110, -150], shA: -10, cloak: 36 }) },
  { f: 660, x: 232, p: P(GUARD_K, { hand: [232, -170], blade: 35, trail: [-135, 35], crouch: 80, lean: 24, fa: 125, ba: -125, bAng: 42, cloak: -12 }), e: "out" },
  { f: 670, x: 238, p: P(GUARD_K, { hand: [232, -170], blade: 35, crouch: 80, lean: 24, fa: 125, ba: -125, bAng: 42 }) },
  { f: 680, x: 262, p: P(GUARD_K, { hand: [170, -190], blade: -20, crouch: 60, lean: 10 }), e: "out" },
  { f: 692, x: 262, p: P(GUARD_K, { hand: [150, -250], blade: -86, crouch: 52, lean: 4 }) },
  { f: 700, x: 266, p: P(GUARD_K, { hand: [150, -250], blade: -86, crouch: 54, lean: 4, fa: 104 }) },
  { f: 716, x: 262, p: GUARD_K },
  { f: 730, x: 258, p: P(GUARD_K, { hand: [150, -300], blade: -8, crouch: 40, lean: 2 }) },
  { f: 756, x: 256, p: P(GUARD_K, { hand: [150, -300], blade: -8, crouch: 44, lean: 2 }) },
  { f: 764, x: 226, p: P(GUARD_K, { sh: [214, -170], shA: 0, hand: [90, -160], blade: -40, crouch: 66, lean: 18, fa: 120, ba: -120, bAng: 38 }), e: "out" },
  { f: 786, x: 258, p: GUARD_K },
  { f: 794, x: 262, p: P(GUARD_K, { hand: [60, -345], blade: -135, crouch: 12, lean: -14, fa: 64, ba: -76, bAng: 2, cloak: 40 }) },
  { f: 810, x: 262, p: P(GUARD_K, { hand: [60, -345], blade: -135, crouch: 12, lean: -14, fa: 64, ba: -76, bAng: 2, cloak: 40 }) },
  { f: 814, x: 204, p: P(GUARD_K, { hand: [240, -120], blade: 60, trail: [-140, 60], crouch: 92, lean: 30, fa: 130, ba: -140, bAng: 45, cloak: -16 }), e: "out" },
  { f: 828, x: 204, p: P(GUARD_K, { hand: [240, -110], blade: 66, crouch: 92, lean: 36, fa: 130, ba: -140, bAng: 45, head: 14 }) },
  { f: 846, x: 208, p: P(GUARD_K, { hand: [200, -120], blade: 50, crouch: 80, lean: 30, fa: 126, ba: -136, bAng: 44, head: 10 }) },
  { f: 862, x: 270, p: P(GUARD_K, { hand: [100, -200], blade: -30, sh: [20, -150], shield: 0.4, crouch: 36, lean: -18, fa: 80, ba: -80, bAng: 10 }), e: "out" },
  { f: 876, x: 268, p: P(GUARD_K, { hand: [110, -210], blade: -35, sh: [20, -150], shield: 0.4, crouch: 36, lean: -18, fa: 80, ba: -80, bAng: 10 }) },
  { f: 884, x: 290, p: P(GUARD_K, { hand: [60, -110], blade: -10, bladeL: 0, sh: [20, -150], shield: 0.4, crouch: 46, lean: -14, fa: 70, ba: -70, bAng: 10, head: 16 }), e: "out" },
  { f: 930, x: 330, p: P(GUARD_K, { hand: [60, -90], bladeL: 0, sh: [20, -130], shield: 0, crouch: 64, lean: -8, fa: 60, ba: -70, bAng: 14, head: 18 }) },
  { f: 952, x: 330, p: P(GUARD_K, { hand: [40, -20], bladeL: 0, shield: 0, sh: [30, -60], crouch: 160, lean: -2, fa: 20, ba: -100, bAng: 72, head: 22 }), e: "out" },
  { f: 984, x: 330, p: P(GUARD_K, { hand: [40, -20], bladeL: 0, shield: 0, sh: [30, -60], crouch: 160, lean: -4, fa: 20, ba: -100, bAng: 72, head: 24 }) },
  { f: 1004, x: 330, p: P(GUARD_K, { hand: [40, -20], bladeL: 0, shield: 0, sh: [30, -60], crouch: 160, lean: -20, fa: 20, ba: -100, bAng: 72, head: 24 }), e: "in", fall: 0 },
  { f: 1022, x: 340, p: P(GUARD_K, { hand: [0, 20], bladeL: 0, shield: 0, sh: [10, 10], crouch: 160, lean: -6, fa: 30, ba: -100, bAng: 72, head: 10, cloak: 40 }), e: "out", fall: -80 },
  { f: 1440, x: 340, p: P(GUARD_K, { hand: [0, 20], bladeL: 0, shield: 0, sh: [10, 10], crouch: 160, lean: -6, fa: 30, ba: -100, bAng: 72, head: 10, cloak: 40 }), fall: -80 },
];

/** الرجل الأول من العدو: يخرج من صفّه، ويدور حول عليّ أمامه (أقرب إلى الكاميرا) إلى خلفه، ثم يقاتله ويسقط */
const E1_GUARD = P(GUARD_K, { hand: [170, -160], blade: -25, crouch: 40 });
const KEYS_E1: Key[] = [
  { f: 0, x: 918, g: GROUND, d: -1, p: SW_IDLE },
  { f: 760, x: 918, p: SW_IDLE },
  { f: 776, x: 900, p: E1_GUARD, e: "out" },
  { f: 880, x: 330, g: 1520, p: E1_GUARD },
  { f: 940, x: -90, g: 1574, p: E1_GUARD },
  { f: 954, x: -230, g: 1570, d: 1, p: E1_GUARD },
  { f: 1000, x: -664, g: 1536, p: E1_GUARD },
  { f: 1006, x: -664, g: 1536, p: WIND_UP, e: "out" },
  { f: 1014, x: -640, g: 1536, p: P(CHOP, { trail: [-135, 35] }), e: "out" },
  { f: 1030, x: -640, g: 1536, p: CHOP },
  { f: 1044, x: -700, g: 1536, p: P(GUARD_K, { hand: [60, -100], bladeL: 0, shield: 0, sh: [20, -130], crouch: 100, lean: -10, fa: 40, ba: -80, bAng: 30, head: 20 }), e: "out", fall: 0 },
  { f: 1064, x: -720, g: 1536, p: P(GUARD_K, { hand: [0, 20], bladeL: 0, shield: 0, sh: [10, 10], crouch: 150, lean: -6, fa: 30, ba: -100, bAng: 70, head: 10, cloak: 40 }), e: "io", fall: -80 },
  { f: 1440, x: -720, g: 1536, p: P(GUARD_K, { hand: [0, 20], bladeL: 0, shield: 0, sh: [10, 10], crouch: 150, lean: -6, fa: 30, ba: -100, bAng: 70, head: 10, cloak: 40 }), fall: -80 },
];
/** الرجل الثاني: يخرج ويلتفّ من الخلف (أبعد عن الكاميرا) ويضرب عليّاً من يمينه ثم يتراجع */
const KEYS_E2: Key[] = [
  { f: 0, x: 1036, g: GROUND, d: -1, p: SW_IDLE },
  { f: 800, x: 1036, p: SW_IDLE },
  { f: 816, x: 1020, p: E1_GUARD, e: "out" },
  { f: 936, x: 324, g: 1446, p: E1_GUARD },
  { f: 944, x: 324, g: 1446, p: WIND_UP, e: "out" },
  { f: 958, x: 310, g: 1446, p: P(CHOP, { trail: [-135, 35] }), e: "out" },
  { f: 970, x: 316, g: 1446, p: CHOP },
  { f: 986, x: 380, g: 1446, p: P(GUARD_K, { hand: [170, -190], blade: -20, crouch: 56, lean: 8 }), e: "out" },
  { f: 1060, x: 420, g: 1446, p: E1_GUARD },
  { f: 1130, x: 560, g: 1446, p: P(E1_GUARD, { hand: [90, -60], blade: -88, crouch: 30 }) },
  { f: 1440, x: 760, g: 1446, p: P(E1_GUARD, { hand: [90, -60], blade: -88, crouch: 30 }) },
];

/* ───────────── أخذ العيّنة من المفاتيح ───────────── */
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  crouch: lerp(a.crouch, b.crouch, t), lean: lerp(a.lean, b.lean, t),
  hand: [lerp(a.hand[0], b.hand[0], t), lerp(a.hand[1], b.hand[1], t)], blade: lerp(a.blade, b.blade, t), bladeL: lerp(a.bladeL, b.bladeL, t),
  sh: [lerp(a.sh[0], b.sh[0], t), lerp(a.sh[1], b.sh[1], t)], shA: lerp(a.shA, b.shA, t), shield: lerp(a.shield, b.shield, t), cloak: lerp(a.cloak, b.cloak, t),
  fa: lerp(a.fa, b.fa, t), ba: lerp(a.ba, b.ba, t), fAng: lerp(a.fAng, b.fAng, t), bAng: lerp(a.bAng, b.bAng, t), lf: 0, lb: 0, head: lerp(a.head, b.head, t),
});
/** مشية طبيعية من الطور ph (راديان) بوزن w: كعب أولاً ثم إصبع، ارتفاع الحوض، ذراعان تتأرجحان عكس الساقين، رأس ورداء */
const walkify = (p: Pose, ph: number, w: number) => {
  const s1 = Math.sin(ph), c1 = Math.cos(ph);
  p.fa = lerp(p.fa, p.fa + 30 * s1, w); p.ba = lerp(p.ba, p.ba - 30 * s1, w);
  p.lf = 28 * w * Math.max(0, c1); p.lb = 28 * w * Math.max(0, -c1);
  p.fAng = lerp(p.fAng, -12 * Math.pow(Math.max(0, s1), 3) + 34 * Math.pow(Math.max(0, -s1), 2), w);
  p.bAng = lerp(p.bAng, -12 * Math.pow(Math.max(0, -s1), 3) + 34 * Math.pow(Math.max(0, s1), 2), w);
  p.crouch += w * 4 * Math.abs(s1);
  p.lean += w * 2.2 * s1;
  p.hand = [p.hand[0] - w * 20 * s1, p.hand[1] + w * 7 * Math.abs(c1)];
  p.sh = [p.sh[0] + w * 18 * s1, p.sh[1] + w * 5 * Math.abs(c1)];
  p.head += w * 1.6 * c1;
  p.cloak += w * 9 * Math.sin(ph - 0.9);
};
const idxOf = (keys: Key[], f: number) => { let i = 0; while (i < keys.length - 1 && keys[i + 1].f <= f) i++; return i; };
const xAt = (keys: Key[], f: number) => {
  const i = idxOf(keys, f); const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const t = b.f === a.f ? 1 : clamp01((f - a.f) / (b.f - a.f));
  return lerp(a.x ?? 0, b.x ?? a.x ?? 0, EASE.io(t));
};
type Sampled = { x: number; g: number; d: 1 | -1; p: Pose; fall: number };
const sample = (keys: Key[], f: number): Sampled => {
  const i = idxOf(keys, f); const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const t = b.f === a.f ? 1 : clamp01((f - a.f) / (b.f - a.f));
  const k = EASE[b.e ?? "io"](t);
  const x = xAt(keys, f);
  let d: 1 | -1 = 1; for (let j = i; j >= 0; j--) if (keys[j].d !== undefined) { d = keys[j].d as 1 | -1; break; }
  let ga = GROUND, gb = GROUND; for (let j = i; j >= 0; j--) if (keys[j].g !== undefined) { ga = keys[j].g as number; break; }
  for (let j = Math.min(i + 1, keys.length - 1); j >= 0; j--) if (keys[j].g !== undefined) { gb = keys[j].g as number; break; }
  const g = lerp(ga, gb, EASE.io(t));
  const p = mixPose(a.p, b.p, k);
  if (b.p.trail && f >= b.f - 4 && f <= b.f + 2) p.trail = b.p.trail; else if (a.p.trail && f - a.f < 3) p.trail = a.p.trail;
  // المشي: الطور من المسافة المقطوعة فلا تنزلق القدمان
  const v = (xAt(keys, f + 1) - xAt(keys, f - 1)) / 2;
  const w = clamp01(Math.abs(v * d) / 1.5);
  if (w > 0) walkify(p, (x * d) / 30, w);
  const fall = lerp(a.fall ?? 0, b.fall ?? 0, k);
  return { x, g, d, p, fall };
};

/* ───────────── الجنود: صفّان لكل جيش ───────────── */
type Soldier = { x0: number; ground: number; s: number; flip: boolean; co: Costume; front: boolean; seed: number };
const SOLDIERS: Soldier[] = (() => {
  const r = seeded(11); const out: Soldier[] = [];
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row < 2; row++) {
      const n = 8;
      for (let i = row === 0 ? 1 : 0; i < n; i++) {
        if (side === 1 && row === 0 && (i === 1 || i === 2)) continue;   // موضعا الرجلين اللذين يخرجان للقتال
        const base = 800 + i * 118 + row * 70;
        out.push({ x0: side === 0 ? -base : base, ground: GROUND - row * 46, s: row === 0 ? 0.96 : 0.86, flip: side === 1, co: side === 0 ? { ...MUSLIM, cape: ["#6a4a2f", "#4e5d3b", "#7a6a4e"][Math.floor(r() * 3)] } : KAFIR_SOLDIER, front: row === 0, seed: Math.floor(r() * 1000) });
      }
    }
  }
  return out.sort((a, b) => a.ground - b.ground);
})();

const soldierPose = (sd: Soldier, f: number): { x: number; p: Pose } => {
  const f2 = f - (f % 2);
  const muslim = !sd.flip;
  const idx = (sd.seed % 7);
  let x = sd.x0;
  const sway = Math.sin((f2 + sd.seed) * 0.07) * 1.5;
  let p: Pose = { ...STAND, hand: [62, -70], blade: -88, bladeL: 0, sh: [60, -50], shield: sd.front ? 1 : 0, shA: 0, cloak: 14 + sway * 4, crouch: (idx % 3) * 3, fa: 38 + idx, ba: -38 - idx };
  if (muslim && f2 > 1100 + idx * 3) {
    // هتاف: رفع الرماح وخفضها
    const k = clamp01((f2 - (1100 + idx * 3)) / 14); const bob = Math.sin((f2 - 1100) * 0.28 + idx) * 0.5 + 0.5;
    p = { ...p, hand: [lerp(62, 100, k), lerp(-70, -330 + bob * 34, k)], blade: -80, cloak: 20 + bob * 20 };
  }
  if (!muslim && f2 > 1130) {
    // انسحاب: خطوات للخلف ببطء والوجه نحو الخصم
    const t0 = 1130 + idx * 4; const v = f2 > t0 ? Math.min(2.4, (f2 - t0) * 0.08) : 0;
    const travelled = f2 > t0 ? (f2 - t0) * Math.min(2.4, 2.4) * 0.6 : 0;
    x = sd.x0 + travelled; void v;
    const ph = -travelled / 30; const w = f2 > t0 ? 1 : 0;
    p = { ...p, hand: [lerp(62, 50, w), lerp(-70, -50, w)], blade: -88 };
    if (w > 0) walkify(p, ph, w);
  }
  return { x, p };
};

/* ───────────── اللقطات ───────────── */
type Geo = ReturnType<typeof solve>;
type Act = Sampled & { geo: Geo; s: number };
type St = { A: Act; K: Act; E1: Act; E2: Act; f: number };
const wp = (a: Act, pt: V2): V2 => (a.d < 0 ? [2 * a.x - pt[0], pt[1]] : pt);
const mid = (st: St) => (st.A.x + st.K.x) / 2;
const groundFocus = (fx: (st: St) => number, sy: number) => ({ fx, fy: () => GROUND, sy });
type Shot = { a: number; b: number; z: [number, number]; fx: (st: St) => number; fy: (st: St) => number; sx?: number; sy?: number };
/** لقطتا العينين القريبتان تُرسمان بالكود في مستوى الشاشة لا في العالم */
const EYES: { a: number; b: number; kind: "ali" | "kafir" }[] = [{ a: 560, b: 584, kind: "ali" }, { a: 584, b: 604, kind: "kafir" }];
const SHOTS: Shot[] = [
  { a: 0, b: 192, z: [0.44, 0.5], ...groundFocus(() => 0, 1380) },
  { a: 192, b: 290, z: [0.8, 0.8], ...groundFocus((st) => st.K.x - 170, 1370) },
  { a: 290, b: 360, z: [1.1, 1.3], ...groundFocus((st) => st.K.x - 60, 1400) },
  { a: 360, b: 440, z: [0.85, 1.0], ...groundFocus((st) => st.A.x + 180, 1370) },
  { a: 440, b: 540, z: [0.8, 0.8], ...groundFocus((st) => st.A.x + 200, 1370) },
  { a: 540, b: 560, z: [0.6, 0.62], ...groundFocus(mid, 1330) },
  { a: 604, b: 624, z: [0.7, 0.72], ...groundFocus(mid, 1340) },
  { a: 624, b: 656, z: [0.75, 0.85], ...groundFocus(mid, 1360) },
  { a: 656, b: 674, z: [1.18, 1.26], fx: mid, fy: (st) => flashPt(st, 0)[1], sy: 960 },
  { a: 674, b: 722, z: [0.95, 1.0], ...groundFocus(mid, 1380) },
  { a: 722, b: 752, z: [0.85, 0.9], ...groundFocus(mid, 1370) },
  { a: 752, b: 774, z: [1.18, 1.26], fx: mid, fy: (st) => flashPt(st, 1)[1], sy: 960 },
  { a: 774, b: 808, z: [0.8, 0.8], ...groundFocus(mid, 1360) },
  { a: 808, b: 846, z: [1.0, 1.15], ...groundFocus((st) => st.K.x - 60, 1400) },
  { a: 846, b: 872, z: [1.35, 1.4], fx: mid, fy: () => GROUND - 280, sy: 980 },
  { a: 872, b: 900, z: [1.55, 1.6], fx: (st) => flashPt(st, 2)[0], fy: (st) => flashPt(st, 2)[1], sy: 900 },
  { a: 900, b: 936, z: [0.7, 0.7], fx: (st) => flyAt(st.f)[0], fy: (st) => Math.min(flyAt(st.f)[1], GROUND - 200), sy: 1000 },
  { a: 936, b: 962, z: [0.7, 0.78], ...groundFocus((st) => st.A.x + 60, 1400) },
  { a: 962, b: 980, z: [1.15, 1.22], fx: (st) => (st.A.x + st.E2.x) / 2, fy: (st) => flashPt(st, 3)[1], sy: 960 },
  { a: 980, b: 1016, z: [0.78, 0.82], ...groundFocus((st) => st.A.x - 80, 1400) },
  { a: 1016, b: 1034, z: [1.1, 1.18], fx: (st) => (st.A.x + st.E1.x) / 2, fy: (st) => flashPt(st, 4)[1], sy: 960 },
  { a: 1034, b: 1066, z: [0.8, 0.9], ...groundFocus((st) => st.E1.x + 200, 1400) },
  { a: 1066, b: 1110, z: [0.62, 0.62], ...groundFocus((st) => (st.E1.x + st.E2.x) / 2, 1370) },
  { a: 1110, b: 1200, z: [0.6, 0.55], ...groundFocus(() => 0, 1390) },
  { a: 1200, b: 1320, z: [0.5, 0.46], ...groundFocus(() => 0, 1400) },
  { a: 1320, b: 1440, z: [1.0, 1.08], ...groundFocus((st) => st.A.x + 110, 1400) },
];

/* ───────────── مواضع الشرر وتحليق السيف ───────────── */
const FLASH_F = [668, 756, 878, 962, 1022];
const midPt = (a: V2, b: V2): V2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const flashPt = (st: St, i: number): V2 => {
  const A = st.A, K = st.K, E1 = st.E1;
  if (i === 0) { const s0 = wp(A, A.geo.shC); return [s0[0] + 24, s0[1] - 80]; }
  if (i === 1) return midPt(wp(K, K.geo.G), wp(K, K.geo.tip));
  if (i === 2) return wp(A, A.geo.tip);
  if (i === 3) { const s0 = wp(A, A.geo.shC); return [s0[0] + 30, s0[1] - 70]; }
  return midPt(wp(E1, E1.geo.G), wp(E1, E1.geo.tip));
};
const FLY0 = { f: 878, vx: 13, vy: -30, g: 1.7 };
let flyStart: V2 = [0, 0];
const flyAt = (f: number): V2 => {
  const t = Math.max(0, f - FLY0.f);
  const gnd = GROUND - 14;
  let y = flyStart[1] + FLY0.vy * t + 0.5 * FLY0.g * t * t;
  let x = flyStart[0] + FLY0.vx * t;
  if (y > gnd) { y = gnd; const tl = (-FLY0.vy + Math.sqrt(FLY0.vy * FLY0.vy + 2 * FLY0.g * (gnd - flyStart[1]))) / FLY0.g; x = flyStart[0] + FLY0.vx * tl; }
  return [x, y];
};

const DUST: { f: number; x: number; s: number; g?: number }[] = [
  { f: 664, x: -150, s: 30 }, { f: 820, x: 30, s: 70 }, { f: 860, x: -130, s: 50 }, { f: 915, x: 0, s: 40 }, { f: 1004, x: 350, s: 60 }, { f: 1060, x: -720, s: 60, g: 1540 }, { f: 1064, x: 380, s: 40, g: 1450 },
];

/* ───────────── رسم البيئة ───────────── */
const Sky: React.FC<{ f: number }> = ({ f }) => {
  const sunY = 760 - f * 0.05;
  return (
    <g>
      <defs>
        <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#233a66" /><stop offset="0.45" stopColor="#9a5a6e" /><stop offset="0.8" stopColor="#f0a45f" /><stop offset="1" stopColor="#f8cf86" /></linearGradient>
        <radialGradient id="dsun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff2c4" stopOpacity="1" /><stop offset="0.5" stopColor="#ffd98a" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={-3000} y={-2600} width={6000} height={4700} fill="url(#dsky)" />
      <circle cx={0} cy={sunY} r={560} fill="url(#dsun)" />
      {Array.from({ length: 9 }, (_, i) => { const a = -Math.PI * (0.12 + i * 0.095); return <polygon key={i} points={`0,${sunY} ${Math.cos(a - 0.03) * 2400},${sunY + Math.sin(a - 0.03) * 2400} ${Math.cos(a + 0.03) * 2400},${sunY + Math.sin(a + 0.03) * 2400}`} fill="#fff1c0" opacity={0.07 + 0.03 * Math.sin(f * 0.04 + i)} />; })}
      <circle cx={0} cy={sunY} r={170} fill="#fff4cf" />
      {/* غيوم مسطّحة طويلة */}
      <path d={`M -1500 380 Q -1000 340 -500 372 Q 0 400 500 360 Q 1000 330 1500 372 L 1500 410 Q 1000 380 500 400 Q 0 430 -500 410 Q -1000 384 -1500 420 Z`} fill="#f7c8a0" opacity={0.5} />
      <path d={`M -1500 560 Q -900 530 -300 556 Q 300 580 900 548 Q 1300 530 1500 552 L 1500 584 Q 1000 566 400 592 Q -200 610 -800 586 Q -1200 570 -1500 590 Z`} fill="#fbd9b0" opacity={0.4} />
    </g>
  );
};
const Ground: React.FC<{ cx: number }> = ({ cx }) => (
  <g>
    <path d={`M -3000 ${GROUND - 330} Q -1700 ${GROUND - 470} -700 ${GROUND - 350} Q 400 ${GROUND - 250} 1500 ${GROUND - 410} Q 2400 ${GROUND - 470} 3000 ${GROUND - 320} L 3000 2400 L -3000 2400 Z`} fill="#b17a55" transform={`translate(${cx * 0.7} 0)`} />
    <path d={`M -3000 ${GROUND - 160} Q -1500 ${GROUND - 270} -300 ${GROUND - 190} Q 900 ${GROUND - 110} 2000 ${GROUND - 220} Q 2700 ${GROUND - 260} 3000 ${GROUND - 180} L 3000 2400 L -3000 2400 Z`} fill="#c58f58" transform={`translate(${cx * 0.35} 0)`} />
    <rect x={-3000} y={GROUND - 70} width={6000} height={1200} fill="#d7a766" />
    <path d={`M -3000 ${GROUND - 70} L 3000 ${GROUND - 70}`} stroke="#b9854a" strokeWidth={6} opacity={0.6} />
    {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M ${-2800 + i * 260} ${GROUND + 40 + (i % 4) * 46} q 90 -14 180 0`} fill="none" stroke="#b58246" strokeWidth={5} opacity={0.5} strokeLinecap="round" />)}
    {/* خيام بعيدة صغيرة */}
    {Array.from({ length: 70 }, (_, i) => { const r = seeded(i + 40); const x = -2600 + r() * 5200, y = GROUND - 40 + r() * 330, sz = 8 + r() * 26; return i % 3 === 0 ? <path key={"g" + i} d={`M ${x} ${y} q ${-sz * 0.4} ${-sz * 1.6} ${-sz * 0.9} ${-sz * 2} M ${x} ${y} q ${sz * 0.1} ${-sz * 1.8} ${sz * 0.2} ${-sz * 2.3} M ${x} ${y} q ${sz * 0.5} ${-sz * 1.4} ${sz * 1.1} ${-sz * 1.7}`} fill="none" stroke="#8a6a3a" strokeWidth={3} strokeLinecap="round" opacity={0.6} /> : <ellipse key={"g" + i} cx={x} cy={y} rx={sz * 1.2} ry={sz * 0.55} fill={i % 3 === 1 ? "#a97d4c" : "#e5bd7c"} opacity={0.55} />; })}
    {[-1700, -1300, 1250, 1650].map((x, i) => <polygon key={i} points={`${x},${GROUND - 330} ${x + 70},${GROUND - 400} ${x + 140},${GROUND - 330}`} fill="#7a5a48" opacity={0.7} />)}
  </g>
);
const Banner: React.FC<{ x: number; f: number; col: string; band: string; flip?: boolean; ground: number }> = ({ x, f, col, band, flip, ground }) => {
  const f2 = f - (f % 2); const dirn = flip ? -1 : 1;
  const top = ground - 1000, hgt = 240, len = 340;
  const pts: string[] = [], pts2: string[] = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8; const wv = Math.sin(f2 * 0.3 - u * 5 + x * 0.01) * 16 * u; pts.push(`${x + dirn * u * len},${top + wv}`); pts2.push(`${x + dirn * u * len},${top + hgt + wv}`); }
  return (
    <g>
      <line x1={x} y1={ground} x2={x} y2={top - 40} stroke={LINE} strokeWidth={14} strokeLinecap="round" />
      <line x1={x} y1={ground} x2={x} y2={top - 40} stroke="#6a4a2f" strokeWidth={7} strokeLinecap="round" />
      <polygon points={[...pts, ...pts2.reverse()].join(" ")} fill={col} stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${x} ${top + hgt * 0.4} L ${x + dirn * len} ${top + hgt * 0.4 + Math.sin(f2 * 0.3 - 5 + x * 0.01) * 16}`} stroke={band} strokeWidth={34} opacity={0.9} />
      <circle cx={x} cy={top - 46} r={14} fill="#d8b04a" stroke={LINE} strokeWidth={4} />
    </g>
  );
};
const Dust: React.FC<{ f: number; cx: number }> = ({ f, cx }) => {
  const r = seeded(5);
  return (
    <g>
      {Array.from({ length: 46 }, (_, i) => {
        const bx = r() * 4000 - 2000, by = GROUND - 80 + r() * 160, sp = 5 + r() * 9, sz = 26 + r() * 60, o = 0.07 + r() * 0.12;
        const x = ((bx + sp * f * 0.5 + 2000) % 4000) - 2000 + cx * 0.2;
        return <ellipse key={i} cx={x} cy={by - Math.sin((f + i * 9) * 0.05) * 14} rx={sz * 2.4} ry={sz * 0.55} fill="#f4d9aa" opacity={o} />;
      })}
    </g>
  );
};
const Puff: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {DUST.map((d, i) => {
      const t = f - d.f; if (t < 0 || t > 30) return null; const u = t / 30; const gy = d.g ?? GROUND;
      return (
        <g key={i} opacity={0.6 * (1 - u)}>
          {[-1, 0, 1].map((k) => <circle key={k} cx={d.x + k * d.s * (0.6 + u)} cy={gy - 20 - u * d.s * 0.9 - Math.abs(k) * 10} r={d.s * (0.4 + u * 0.8)} fill="#f0d29c" />)}
        </g>
      );
    })}
  </g>
);

/* ───────────── لقطة العينين القريبة (تُرسم بالكود): عينان عربيتان رجوليتان أو شقّ خوذة حديدية ───────────── */
const EyeCloseup: React.FC<{ kind: "ali" | "kafir"; lf: number; len: number }> = ({ kind, lf, len }) => {
  const u = lf / len; const z = 1 + 0.06 * u;
  const open = kind === "ali" ? lerp(1, 0.72, EASE.io(u)) : 1;
  const glint = kind === "ali" ? (lf > 10 ? (lf - 10) / 14 : undefined) : u;
  const eye = (cx: number, cy: number, w: number, flip: boolean, id: string) => {
    const h = w * 0.27 * open;
    const inner: V2 = [cx - w / 2, cy + 14], outer: V2 = [cx + w / 2, cy - 16];
    const up: V2 = [cx + w * 0.02, cy - h * 2 - 10], lo: V2 = [cx + w * 0.06, cy + h * 0.8 + 8];
    const almond = `M ${inner[0]} ${inner[1]} Q ${up[0]} ${up[1]} ${outer[0]} ${outer[1]} Q ${lo[0]} ${lo[1]} ${inner[0]} ${inner[1]} Z`;
    const rI = w * 0.19, ix = cx + w * 0.04, iy = cy - h * 0.1;
    return (
      <g transform={flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
        <defs><clipPath id={id}><path d={almond} /></clipPath></defs>
        <polygon points={`${cx - w * 0.62},${cy - h - 36} ${cx + w * 0.2},${cy - h - 92} ${cx + w * 0.74},${cy - h - 70} ${cx + w * 0.3},${cy - h - 50} ${cx - w * 0.6},${cy - h - 6}`} fill={LINE} />
        <path d={`M ${inner[0] + 18} ${inner[1] - 40} Q ${up[0]} ${up[1] - 22} ${outer[0] - 10} ${outer[1] - 34}`} fill="none" stroke={LINE} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
        <path d={almond} fill="#f2ece0" />
        <g clipPath={`url(#${id})`}>
          <ellipse cx={ix} cy={iy} rx={rI} ry={rI * 1.2} fill="#5a3418" />
          <ellipse cx={ix} cy={iy + rI * 0.5} rx={rI * 0.8} ry={rI * 0.6} fill="#8a5a30" opacity={0.8} />
          <ellipse cx={ix} cy={iy} rx={rI} ry={rI * 1.2} fill="none" stroke={LINE} strokeWidth={8} />
          <ellipse cx={ix + 2} cy={iy + 2} rx={rI * 0.44} ry={rI * 0.6} fill="#0f0a08" />
          <rect x={ix - rI * 0.6} y={iy - rI * 0.9} width={rI * 0.36} height={rI * 0.44} rx={7} fill="#fff4de" />
          <circle cx={ix + rI * 0.4} cy={iy + rI * 0.5} r={rI * 0.12} fill="#fff4de" />
          <path d={`M ${inner[0]} ${inner[1] - h * 1.3} L ${outer[0]} ${outer[1] - h * 1.5} L ${outer[0]} ${outer[1] + h * 0.1} Q ${up[0]} ${cy - h * 0.9} ${inner[0]} ${inner[1] + 2} Z`} fill="#000" opacity={0.28} />
          {glint !== undefined && <polygon points={`${cx - w * 0.6 + glint * w * 1.3},${cy - h * 2.4} ${cx - w * 0.48 + glint * w * 1.3},${cy - h * 2.4} ${cx - w * 0.34 + glint * w * 1.3},${cy + h * 1.6} ${cx - w * 0.48 + glint * w * 1.3},${cy + h * 1.6}`} fill="#ffd98a" />}
        </g>
        <path d={`M ${inner[0] - 6} ${inner[1] + 4} Q ${up[0]} ${up[1] - 6} ${outer[0] + 4} ${outer[1] + 2}`} fill="none" stroke={LINE} strokeWidth={16} strokeLinecap="round" />
        <path d={`M ${outer[0]} ${outer[1]} L ${outer[0] + 46} ${outer[1] - 22}`} stroke={LINE} strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${inner[0] + 14} ${inner[1] + 8} Q ${lo[0]} ${lo[1] + 6} ${outer[0] - 12} ${outer[1] + 4}`} fill="none" stroke={LINE} strokeWidth={4} opacity={0.75} strokeLinecap="round" />
        {[0, 1, 2].map((k) => <path key={k} d={`M ${outer[0] + 20} ${outer[1] + 14 + k * 20} q 40 ${8 + k * 6} 72 ${22 + k * 8}`} fill="none" stroke={LINE} strokeWidth={3} opacity={0.35} strokeLinecap="round" />)}
      </g>
    );
  };
  if (kind === "kafir") {
    const gl = glint ?? 0;
    return (
      <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
        <rect width={W} height={H} fill="#2a2d36" />
        <path d={`M 0 0 L ${W} 0 L ${W} 640 Q 540 700 0 640 Z`} fill="#3a3f4b" />
        <rect x={0} y={640} width={W} height={1280} fill="#4a505c" />
        <polygon points={`0,640 ${W},640 ${W},700 0,700`} fill="#000" opacity={0.18} />
        <path d={`M 0 560 Q 540 520 ${W} 560 L ${W} 620 Q 540 580 0 620 Z`} fill="#b08d3a" stroke={LINE} strokeWidth={6} />
        {[120, 300, 480, 660, 840, 980].map((x) => <circle key={x} cx={x} cy={598} r={12} fill="#d9be6a" stroke={LINE} strokeWidth={3} />)}
        <path d="M 540 640 L 540 1500" stroke={LINE} strokeWidth={8} opacity={0.5} />
        <rect x={110} y={800} width={860} height={78} rx={14} fill="#0b0a0c" stroke={LINE} strokeWidth={6} />
        <polygon points={`${100 + gl * 840},800 ${150 + gl * 840},800 ${130 + gl * 840},878 ${80 + gl * 840},878`} fill="#ffd98a" opacity={0.85} />
        {[0, 1, 2, 3, 4, 5].map((k) => <line key={"r" + k} x1={620 + k * 52} y1={1080} x2={640 + k * 52} y2={1180} stroke={LINE} strokeWidth={8} strokeLinecap="round" opacity={0.7} />)}
        {[0, 1, 2, 3, 4, 5].map((k) => <line key={"l" + k} x1={400 - k * 52} y1={1080} x2={380 - k * 52} y2={1180} stroke={LINE} strokeWidth={8} strokeLinecap="round" opacity={0.7} />)}
        <path d={`M 90 0 Q 300 -100 540 -40 Q 800 -100 990 0 L 990 520 L 90 520 Z`} fill="#8f2a22" stroke={LINE} strokeWidth={6} opacity={0.95} />
      </g>
    );
  }
  return (
    <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
      <rect width={W} height={H} fill="#f0d9b0" />
      <path d={`M 0 0 L ${W} 0 L ${W} 520 Q 540 470 0 520 Z`} fill="#7a828f" />
      <path d={`M 0 300 Q 540 250 ${W} 300 L ${W} 560 Q 540 520 0 560 Z`} fill="#f4efe3" stroke={LINE} strokeWidth={6} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M ${-40 + k * 30} ${330 + k * 6} Q 540 ${290 + k * 20} ${W + 40 - k * 30} ${340 + k * 6}`} fill="none" stroke={LINE} strokeWidth={4} opacity={0.3} />)}
      <path d={`M 0 520 Q 540 470 ${W} 520 L ${W} 580 Q 540 530 0 580 Z`} fill="#4a505c" stroke={LINE} strokeWidth={6} />
      {[140, 340, 540, 740, 940].map((x) => <circle key={x} cx={x} cy={540} r={11} fill="#c9ced6" stroke={LINE} strokeWidth={3} />)}
      <rect x={0} y={575} width={W} height={430} fill="#b9805a" />
      <rect x={0} y={575} width={W} height={90} fill="#000" opacity={0.2} />
      <polygon points="500,640 590,640 610,1000 480,1000" fill="#000" opacity={0.15} />
      <polygon points="590,640 604,640 626,1000 610,1000" fill="#fff1c8" opacity={0.2} />
      {eye(300, 850, 380, true, "eyeAl")}
      {eye(780, 856, 360, false, "eyeAr")}
      <path d={`M 0 1000 Q 300 940 540 1010 Q 780 940 ${W} 1000 L ${W} 1920 L 0 1920 Z`} fill="#f2ece0" stroke={LINE} strokeWidth={6} />
      {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M ${60 + k * 220} 1040 Q ${100 + k * 220} 1400 ${40 + k * 220} 1800`} fill="none" stroke={LINE} strokeWidth={4} opacity={0.22} />)}
      <path d={`M 0 1300 Q 540 1240 ${W} 1300 L ${W} 1920 L 0 1920 Z`} fill="#000" opacity={0.12} />
    </g>
  );
};

/* ───────────── التركيب ───────────── */
const captionLines = (() => {
  const mk = (start: number, arr: [string, number, number][]): { words: CapWord[] } => ({ words: arr.map(([t, a, b]) => ({ t, at: start + a, to: start + b })) });
  return [
    mk(290 / 24, [["هل", 0, 0.28], ["من", 0.28, 0.5], ["مبارز؟", 0.5, 1.01]]),
    mk(290 / 24, [["ابرزوا", 1.39, 1.84], ["لنا", 1.84, 2.02], ["أحداً", 2.02, 2.3]]),
    mk(384 / 24, [["أنا", 0, 0.42], ["أبرز", 0.42, 0.98], ["إليك", 0.98, 1.7]]),
  ];
})();
const PAGES = capPages(captionLines);

const SC = { A: 1.0, K: 1.15, E1: 1.06, E2: 1.08 };
const buildState = (f: number): St => {
  const f2 = f - (f % 2);
  const mk = (keys: Key[], s: number): Act => { const sm = sample(keys, f2); return { ...sm, s, geo: solve(sm.p, sm.x, sm.g, s) }; };
  return { A: mk(KEYS_A, SC.A), K: mk(KEYS_K, SC.K), E1: mk(KEYS_E1, SC.E1), E2: mk(KEYS_E2, SC.E2), f };
};

export const AnimeDuel: React.FC = () => {
  const frame = useCurrentFrame();
  const st = buildState(frame);
  { const pre = buildState(FLY0.f - 2); const t = wp(pre.K, pre.K.geo.tip); flyStart = [t[0], t[1]]; }

  const eyes = EYES.find((e) => frame >= e.a && frame < e.b);
  const shot = SHOTS.find((s) => frame >= s.a && frame < s.b) ?? SHOTS[SHOTS.length - 1];
  const u = clamp01((frame - shot.a) / Math.max(1, shot.b - shot.a));
  const z = lerp(shot.z[0], shot.z[1], EASE.io(u));
  const sx = shot.sx ?? 540, sy = shot.sy ?? 960;
  let cx = shot.fx(st) - (sx - 540) / z, cy = shot.fy(st) - (sy - 960) / z;
  let shx = 0, shy = 0;
  for (const cf of FLASH_F) { const t = frame - cf; if (t >= 0 && t < 9) { const a = 16 * (1 - t / 9); shx += Math.sin(t * 2.7) * a; shy += Math.cos(t * 3.3) * a * 0.7; } }
  cx -= shx / z; cy -= shy / z;
  const hx = Math.sin(frame * 0.13) * 3.2, hy = Math.cos(frame * 0.11) * 2.4, hr = Math.sin(frame * 0.05) * 0.22;
  const tr = `translate(${hx} ${hy}) rotate(${hr} 540 960) translate(540 960) scale(${z}) translate(${-cx} ${-cy})`;

  const f2 = frame - (frame % 2);
  const vis = (x: number, s: number) => Math.abs(x - cx) * z < 540 + 260 * s * z + 200;
  const dropK = frame >= 884;
  const dropE1 = frame >= 1044;

  let flashOp = 0; let fp: V2 | null = null;
  FLASH_F.forEach((cf, i) => { const t = frame - cf; if (t >= 0 && t < 4) { flashOp = [0.9, 0.55, 0.3, 0.15][t]; fp = flashPt(st, i); } });

  const fly = frame >= FLY0.f ? flyAt(frame) : null;
  const flyRot = frame >= FLY0.f ? (frame - FLY0.f) * 26 : 0;
  const flyLanded = fly && fly[1] >= GROUND - 15;

  const t = frame / DUEL_FPS;
  const fade = Math.max(clamp01(1 - frame / 10), clamp01((frame - (DUEL_FRAMES - 14)) / 14));

  const fighter = (a: Act, co: Costume, weapon: "sword" | "none") => {
    const pivot: V2 = [a.x - 50 * a.s, a.g];
    const inner = (
      <g transform={a.fall !== 0 ? `rotate(${a.fall} ${pivot[0]} ${pivot[1]})` : undefined}>
        <Warrior p={a.p} x={a.x} ground={a.g} s={a.s} co={co} weapon={weapon} />
      </g>
    );
    return (
      <g>
        <ellipse cx={a.x} cy={a.g + 6} rx={140 * a.s} ry={16} fill="#4a2f18" opacity={0.34} filter="url(#blurShadow)" />
        {a.d < 0 ? <g transform={`translate(${a.x} 0) scale(-1 1) translate(${-a.x} 0)`}>{inner}</g> : inner}
      </g>
    );
  };
  // ترتيب الرسم بالعمق: الأبعد عن الكاميرا أولاً
  const actors = [
    { a: st.E2, co: E2_CO, w: "sword" as const },
    { a: st.K, co: KAFIR, w: dropK ? ("none" as const) : ("sword" as const) },
    { a: st.A, co: ALI, w: "sword" as const },
    { a: st.E1, co: E1_CO, w: dropE1 ? ("none" as const) : ("sword" as const) },
  ].sort((p, q) => p.a.g - q.a.g);

  return (
    <AbsoluteFill style={{ background: "#233a66" }}>
      <Audio src={staticFile("duel/duel_mix.wav")} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {eyes ? <EyeCloseup kind={eyes.kind} lf={frame - eyes.a} len={eyes.b - eyes.a} /> : (
          <g transform={tr}>
            <Sky f={f2} />
            <Ground cx={cx} />
            <Banner x={-820} f={f2} col="#f4efe3" band="#1f7a4d" ground={GROUND - 40} />
            <Banner x={-1080} f={f2} col="#1f7a4d" band="#f4efe3" ground={GROUND - 40} />
            <Banner x={820} f={f2} col="#26262d" band="#a3322a" flip ground={GROUND - 40} />
            <Banner x={1080} f={f2} col="#a3322a" band="#26262d" flip ground={GROUND - 40} />
            {[false, true].map((fr) => <g key={String(fr)} filter={fr ? "url(#blurFront)" : "url(#blurBack)"}>{SOLDIERS.filter((sd) => sd.front === fr).map((sd, i) => {
              const sp = soldierPose(sd, frame);
              if (!vis(sp.x, sd.s)) return null;
              const inner = <Warrior p={sp.p} x={sp.x} ground={sd.ground} s={sd.s} co={sd.co} weapon="spear" lite />;
              return <g key={i}>{sd.flip ? <g transform={`translate(${sp.x} 0) scale(-1 1) translate(${-sp.x} 0)`}>{inner}</g> : inner}</g>;
            })}</g>)}
            <rect x={-3000} y={GROUND - 760} width={6000} height={800} fill="url(#dhaze)" />
            <Dust f={f2} cx={cx} />
            {actors.map((o, i) => <g key={i}>{fighter(o.a, o.co, o.w)}</g>)}
            {fly && (
              <g transform={`rotate(${flyLanded ? -72 : flyRot} ${fly[0]} ${fly[1]})`}>
                <polygon points={`${fly[0] - 190},${fly[1] - 9} ${fly[0] + 190},${fly[1]} ${fly[0] - 190},${fly[1] + 9}`} fill="#c4ccd6" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />
                <rect x={fly[0] - 232} y={fly[1] - 9} width={44} height={18} fill="#4a3322" stroke={LINE} strokeWidth={4} />
                <rect x={fly[0] - 196} y={fly[1] - 24} width={8} height={48} fill="#c9a24a" stroke={LINE} strokeWidth={3} />
              </g>
            )}
            <Puff f={frame} />
            {fp && (
              <g opacity={flashOp}>
                <polygon points={Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8; const r2 = i % 2 === 0 ? 130 : 46; return `${(fp as V2)[0] + Math.cos(a) * r2},${(fp as V2)[1] + Math.sin(a) * r2}`; }).join(" ")} fill="#fff6d0" />
                {Array.from({ length: 9 }, (_, i) => { const a = i * 0.7 + 0.3; return <line key={i} x1={(fp as V2)[0] + Math.cos(a) * 60} y1={(fp as V2)[1] + Math.sin(a) * 60} x2={(fp as V2)[0] + Math.cos(a) * 190} y2={(fp as V2)[1] + Math.sin(a) * 190} stroke="#ffd98a" strokeWidth={8} strokeLinecap="round" />; })}
              </g>
            )}
          </g>
        )}
        <defs>
          <filter id="blurBack" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.4" /></filter>
          <filter id="blurFront" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
          <filter id="blurShadow" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="7" /></filter>
          <linearGradient id="dhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4c88a" stopOpacity="0" /><stop offset="1" stopColor="#f4c88a" stopOpacity="0.22" /></linearGradient>
          <linearGradient id="dgrade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b4c86" stopOpacity="0.55" /><stop offset="0.6" stopColor="#ffb064" stopOpacity="0.35" /><stop offset="1" stopColor="#ff8a3c" stopOpacity="0.5" /></linearGradient>
          <linearGradient id="dvig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2412" stopOpacity="0" /><stop offset="1" stopColor="#3a2412" stopOpacity="0.55" /></linearGradient>
          <radialGradient id="dvig2" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stopColor="#1a0f08" stopOpacity="0" /><stop offset="1" stopColor="#1a0f08" stopOpacity="0.5" /></radialGradient>
        </defs>
        {!eyes && <rect y={1450} width={W} height={470} fill="url(#dvig)" />}
        {!eyes && Array.from({ length: 12 }, (_, i) => { const r = seeded(i + 90); const px = ((r() * 1300 + frame * (6 + r() * 7)) % 1300) - 110, py = 200 + r() * 1500 + Math.sin((frame + i * 17) * 0.04) * 22, rr = 18 + r() * 46; return <circle key={"b" + i} cx={px} cy={py} r={rr} fill="#ffe2a8" opacity={0.1 + r() * 0.12} filter="url(#blurFront)" />; })}
        <rect width={W} height={H} fill="url(#dgrade)" style={{ mixBlendMode: "soft-light" }} />
        <rect width={W} height={H} fill="url(#dvig2)" />
        <image href={staticFile("duel/noise.png")} x={-(frame * 37) % 90} y={-(frame * 53) % 130} width={1200} height={2100} opacity={0.09} style={{ mixBlendMode: "overlay" }} />
        <rect width={W} height={H} fill="#fff" opacity={flashOp * 0.22} />
        <rect width={W} height={H} fill="#0d0a08" opacity={fade} />
      </svg>
      <Captions t={t} pages={PAGES} />
      <Watermark />
    </AbsoluteFill>
  );
};
