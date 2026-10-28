import { cut } from "./tirTime";
import times from "../public/tir_src_times.json";
import splitsJson from "../public/tir_split_segments_v4.json";

/** PURE DATA of the lesson edit (no React): shared by the Remotion components and by the GPU hybrid exporter. Times = seconds of the ORIGINAL recording unless noted. */
export type Tone = "ok" | "bad" | "note" | "plain";
export type Item = { t: string; at: number; tone?: Tone; sub?: string; big?: string; col?: 0 | 1 };
/** a person/place mentioned by the speaker: shown as a photo card (on the right side) right after he names it */
export type Photo = { img: string; at: number; name: string; sub?: string };
export type Scene =
  | { kind: "cards" | "order"; a: number; b: number; title: string; items: Item[]; photos?: Photo[] }
  | { kind: "compare"; a: number; b: number; title: string; heads: [string, string]; headImgs?: [string, string]; items: Item[] }
  | { kind: "chain"; a: number; b: number; title: string; items: Item[] }
  | { kind: "news"; a: number; b: number; title: string; img: string; credit: string; imgAt: number; hl?: [number, number, number, number]; hlAt?: number; items: Item[] }
  | { kind: "verse"; a: number; b: number; title: string; verses: { text: string; ref: string; at: number }[]; items: Item[]; photos?: Photo[] }
  | { kind: "person"; a: number; b: number; title: string; img: string; name: string; sub: string; imgAt: number; items: Item[] }
  | { kind: "map"; a: number; b: number; title: string; trAt: number; azAt: number; linkAt: number; items: Item[] };



export const SCENES: Scene[] = [
  { kind: "cards", a: 69.2, b: 82.4, title: "دعواه في التدوين", items: [
    { t: "يزعم أن التدوين بدأ متأخراً", at: 69.3, tone: "bad" },
    { t: "ثم يُقرّ: «فيه تدوين قبل ذلك»", at: 75.8, tone: "note" },
    { t: "ويُوهم الناس بالباطل", at: 79.8, tone: "bad" },
  ] },
  { kind: "compare", a: 86.6, b: 121.5, title: "التدوين أقدم مما زعم", heads: ["زعمه", "الواقع"], items: [
    { t: "تدوين متأخر — بعد القرن الثالث", at: 94.4, tone: "bad", col: 0 },
    { t: "موطأ مالك — ومالك مات قبل القرن الثالث", at: 94.6, tone: "ok", col: 1 },
    { t: "مصنَّف معمر بن راشد الكبير قبل مالك", at: 107.9, tone: "ok", col: 1 },
    { t: "ما وصل إلينا قليل بالنسبة لما دُوِّن", at: 113.6, tone: "note", col: 1 },
    { t: "كانوا يدوّنون للعلم لا للنشر", at: 119.9, tone: "note", col: 1 },
  ] },
  { kind: "chain", a: 183.2, b: 207.4, title: "الإسناد إلى رواة الإسناد", items: [
    { t: "رجل من التابعين أو أتباعهم", at: 183.3 },
    { t: "ثقة أم لا؟", at: 185.8, tone: "bad" },
    { t: "قرائن وأقران", at: 190.2, tone: "note" },
    { t: "نحن", at: 193.8 },
    { t: "إسناد", at: 194.6 },
    { t: "أقوال الأئمة", at: 197.6, tone: "ok" },
    { t: "شعبة وغيره", at: 199.9, tone: "ok" },
    { t: "أئمة النقد في زمن التابعين", at: 202.8, tone: "ok" },
  ] },
  { kind: "order", a: 208.5, b: 226.4, title: "طرق أخرى لمعرفة الثقة", items: [
    { t: "تثبت موثوقية راوٍ معيّن", at: 214.4 },
    { t: "نقارن مروياته بمرويات غيره", at: 217.6 },
    { t: "فيتبيّن من يُخطئ", at: 222.4 },
    { t: "ومن يخالف الجمهور", at: 224.3 },
  ] },
  { kind: "compare", a: 226.4, b: 242.4, title: "هل التوثيق مجرد قول؟", heads: ["المنهج العلمي", "ما يتوهّمه"], items: [
    { t: "علم متكامل: قرائن ومقارنة وأئمة نقد", at: 226.6, tone: "ok", col: 0 },
    { t: "أن يقول واحد: «فلان ثقة»", at: 231.8, tone: "bad", col: 1 },
    { t: "معروف في علم المصطلح", at: 241.9, tone: "note", col: 0 },
  ] },
  { kind: "cards", a: 363.7, b: 391.7, title: "لا محاباة عند أهل العلم", items: [
    { t: "أبو داود تكلّم في ولده", at: 364.8, tone: "ok" },
    { t: "ابن المديني تكلّم في والده", at: 367.6, tone: "ok" },
    { t: "المشكلة: اختلاف المذهب", at: 382.0, tone: "note", sub: "فتُضعّف من خالف مذهبك" },
    { t: "وهذا غلط", at: 389.9, tone: "bad" },
  ] },
  { kind: "cards", a: 557.8, b: 571.9, title: "علماؤنا منصفون", items: [
    { t: "يذكرون بدعته ويوثّقونه", at: 560.6, tone: "ok" },
    { t: "ويضعّفون السنّي إن أخطأ", at: 565.4, tone: "ok" },
    { t: "ضعّفوا حتى مشايخهم", at: 571.4, tone: "note" },
  ] },
  { kind: "cards", a: 609.9, b: 621.2, title: "الستمائة ألف حديث", items: [
    { t: "ما يجمعه البخاري من الحديث", at: 609.6, tone: "note", big: "٦٠٠٬٠٠٠" },
    { t: "ليست نصوصاً وإنما أسانيد", at: 619.0, tone: "ok" },
  ] },
  { kind: "cards", a: 637.4, b: 665.6, title: "الجامع الصحيح المختصر", items: [
    { t: "لم يزعم أن كل صحيح فيه فقط", at: 628.8, tone: "note" },
    { t: "باقي الستمائة ألف: لا ضعيفة ولا موضوعة", at: 641.9, tone: "ok" },
    { t: "مثال: كتاب مختصر ≈ ٧٬٥٦٠ حديثاً", at: 651.6, tone: "plain", big: "٧٬٥٦٠" },
    { t: "ولم يقل: كل ما بقي غلط", at: 656.8, tone: "bad" },
  ] },
  { kind: "cards", a: 695.0, b: 740.0, title: "الوثيقة المكتوبة وحدها", items: [
    { t: "ثقة عن ثقة = مصدر نقي", at: 702.9, tone: "ok" },
    { t: "قد يدخلها التدليس والدسّ والتصحيف", at: 709.8, tone: "bad" },
    { t: "قد تُقرأ «عمر» كأنها «محمد»", at: 725.8, tone: "bad" },
    { t: "كانت الكتابة بلا نقاط", at: 731.6, tone: "bad" },
    { t: "الثقة يعرف ما قرأ وما كتب", at: 735.8, tone: "ok" },
  ] },
  { kind: "order", a: 743.9, b: 761.8, title: "كيف يوثّق المحدّثون النص؟", items: [
    { t: "يقرؤون ما كتبوا على تلاميذهم", at: 745.4 },
    { t: "التلميذ يسمع ويكتب", at: 748.6 },
    { t: "ويقارن نسخته بنسخة شيخه", at: 752.2 },
    { t: "فالتوثيق أعظم من نسخة ورقية", at: 758.8, tone: "ok" },
  ] },
  { kind: "order", a: 777.0, b: 791.4, title: "مثال الوشوشة الصينية", items: [
    { t: "أناس في غرفة", at: 785.0 },
    { t: "رسالة تُنقل للآخر", at: 789.4 },
  ] },
  { kind: "order", a: 795.8, b: 870.9, title: "هل الرواة مثل أصحاب الوشوشة؟", items: [
    { t: "تغيّرت القصة، فقالوا: ضعف النقل", at: 808.0, tone: "bad" },
    { t: "حافظون؟", at: 818.0, tone: "ok" },
    { t: "عدول؟", at: 821.0, tone: "ok" },
    { t: "يأخذون الأمر بجدية", at: 827.0, tone: "ok" },
    { t: "يعدّونه ديناً — وعقابه جهنم", at: 838.0, tone: "ok" },
    { t: "العلماء يضعّفون المخطئ ويسقط حديثه", at: 842.0, tone: "ok" },
    { t: "سمعته ودينه على المحك", at: 857.6, tone: "ok" },
    { t: "منهج توثيق ورد لمن يخطئ", at: 864.6, tone: "ok" },
    { t: "فمثالهم فاسد", at: 871.0 - 0.1, tone: "bad" },
  ] },
  { kind: "order", a: 1141.2, b: 1198.4, title: "تعارض الروايات", items: [
    { t: "تُقدَّم رواية الثقة عند التعارض", at: 1144.7, tone: "ok" },
    { t: "لبّ الحكاية: النبي ﷺ اتخذ منبراً", at: 1157.9, tone: "note" },
    { t: "ابن أبي رواد قد يخطئ في التفصيل", at: 1163.8, tone: "bad" },
    { t: "فنقدّم الرواية الصحيحة", at: 1172.6, tone: "ok" },
    { t: "ولا خلاف في أصل القصة", at: 1180.9, tone: "ok" },
    { t: "وهنا موضع العلم", at: 1184.6, tone: "note" },
  ] },
];

export type SplitSeg = { from: number; to: number; type: "clip" | "book" | "browser" };
export const SPLITS = splitsJson as SplitSeg[];

export const BROLL = [
  { src: "stock/prep/ab_prepped.mp4", t: cut(66.86) }, // old book pages: "التدوين"
  { src: "stock/prep/ps_prepped.mp4", t: cut(686.73) }, // parchment: "وثيقة قد تكون مزورة"
  { src: "stock/prep/ip_prepped.mp4", t: cut(741.5) }, // pen writing: "كانوا يكتبون ثم يقرؤون على تلاميذهم"
];

export const ZOOMS: [number, number][] = [[10.0, 14.5], [305.0, 309.5], [346.0, 350.5], [567.0, 571.5], [622.0, 626.5], [665.0, 669.5]]; // cut-time seconds, only on speaker-alone shots (no scene/split there)

/** the opponent's own words, written above his clip; [source second right after he said it, text] */
export const QUOTES: [number, string][] = [
  [41.9, "تدوين الكبير في القرن الثالث الهجري"],
  [47.5, "بعد أكثر من 200 سنة من وفاة النبي ﷺ"],
  [50.9, "النبي محمد كان بيقول هذا؟"],
  [133.4, "الإسناد الخفي؟ ما هو؟"],
  [148.7, "كيف نعرف رجال الإسناد عن طريق واحد شافهم؟"],
  [274.3, "الانطباعية والشخصنة"],
  [276.4, "أنا بحب فلان…"],
  [286.8, "كان عليه سلوكيات مش مظبوطة…"],
  [293.0, "أو ممكن تتجاوز عن الحكاية الحلوة"],
  [590.2, "روايات بمئات الآلاف"],
  [596.5, "البخاري جمع حوالي 600 ألف حديث"],
  [600.8, "اختار منها حوالي 5000–6000 حديث"],
  [676.6, "أنا ليه أحتاج للإسناد؟"],
  [678.9, "لو عندي وثيقة عن عصر محمد علي"],
  [776.0, "Chinese Whispers: الوشوشة الصينية"],
  [895.5, "قصة المنبر"],
  [922.4, "ما تعملش لرسول منبرين في حياته"],
  [939.0, "روايتان صحيحتان وفق مناهج فن الحديث والرجال"],
  [953.6, "واحدة: ست عندها غلام نجار"],
  [954.8, "والثانية: راجل"],
];

export const NAME_AT = [12.0, 667.0, 1022.2].map(cut);
export const SUBSCRIBE_AT = [21.0, 309.0, 1126.5].map(cut);

export const BOOKS: { src: string; t: number; len: number; w: number; h: number; caption: string }[] = [
  { src: "books/muwatta1.jpg", t: cut(82.77), len: 3.4, w: 330, h: 470, caption: "الموطأ — الإمام مالك" },
  { src: "books/bukhari1.png", t: cut(621.47), len: 3.4, w: 560, h: 322, caption: "الجامع الصحيح — الإمام البخاري" },
];

export const BEHIND = times.behind.map((k) => ({ ...k, t: cut(k.src) }));


/** ---- split-screen geometry constants (source 1920x1080 coordinates) ---- */
export type SplitType = "clip" | "book" | "browser";
export const CROP: Record<SplitType, { x: number; y: number; w: number; h: number }> = {
  clip: { x: 70, y: 277, w: 967, h: 581 },
  book: { x: 14, y: 0, w: 1022, h: 1080 },
  browser: { x: 40, y: 0, w: 852, h: 1080 },
};
export const SPK = { x: 1044, y: 0, w: 876, h: 1080 };
export const PAD = 24;
/** Variety (user: "عرضه بطرق مختلفة لإزالة الملل"): the panel changes size / height / tilt every ~7-9 s with a springy move, never over the speaker. */
export const VARIANTS = [
  { s: 1, dy: 0, r: 0 },
  { s: 0.82, dy: -120, r: -2.5 },
  { s: 0.82, dy: 120, r: 2.5 },
  { s: 0.92, dy: 0, r: -3.5 },
  { s: 0.78, dy: -80, r: 0 },
  { s: 0.9, dy: 70, r: 3.5 },
];
export const SWITCH_AT = (n: number) => { const a = [0]; for (let i = 1; a[a.length - 1] < n; i++) a.push(a[i - 1] + 210 + (i % 3) * 30); return a; };
