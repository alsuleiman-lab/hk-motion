/**
 * محرّك الرسم بالبناء (أمر المستخدم 2026-11-20): كل نقطة تُشتق من سبب، لا من تخمين.
 *
 * ١) الكاميرا والمنظور: كل شيء يُعطى بالأمتار في العالم ثم يُسقَط. البعيد أصغر تلقائياً بنسبة f/z،
 *    وقدما كل قائم على الأرض، وخط الأفق = ارتفاع الكاميرا. عدسة طويلة (f كبير) تضغط العمق فيبدو الجيش جداراً خلف الفارس.
 * ٢) النسب بالأمتار: رجل ١٫٧٦م، رأسه ٠٫٢٣٥م، وخطوط بناء الرأس (الحاجب، العين، قاعدة الأنف، الذقن) نسب ثابتة من طول الرأس.
 * ٣) اللباس يلتصق بما تحته بقاعدة: الطاقية تتبع قوس الجمجمة، والعمامة تبدأ فوق الحاجبين، واللثام يبدأ تحت العينين؛
 *    فيبقى شريط العينين فراغاً مقصوداً، وما سواه لا فراغ فيه.
 * ٤) الخط له سبب واحد من أربعة: حدّ خارجي، أو تراكب (القريب فوق البعيد)، أو طيّة من نقطة تعليق، أو معلم تشريحي (حاجب، جفن).
 *    وسماكته تتناسب مع القرب، ولا يُرسم تفصيل أصغر من ٣ نقاط على الشاشة.
 * ٥) الجو: البعيد أبهت (يقترب لونه من لون الغبار) وأقل تفصيلاً؛ والشمس عند الأفق يساراً فالحافة المضيئة يساراً والظل يميناً.
 */

export type V2 = { x: number; y: number };
export type V3 = { x: number; y: number; z: number };
export type Cam = { f: number; camH: number; horizonY: number; cx: number };

/**
 * كاميرا اللوحة: حُسبت من الصورة نفسها لا بالتخمين:
 * - الجندي الأول: قدماه عند سطر ٥٧٦ وقمة خوذته عند ٢٣٢ ← ١٨٨ نقطة لكل متر.
 * - خوذ الجيش البعيد بنصف عرض ١٢ نقطة ← نحو ١٠٠ نقطة لكل متر، ومراكزها عند ٢٤٥.
 * - عين الفارس عند ١٠٦ على ارتفاع ٢٫١٦م (سرج ١٫٣٨ + ٠٫٧٨ جلوساً).
 * الحل المشترك: ارتفاع الكاميرا ١٫٩٠م، والأفق عند السطر ٢١٩، وعدسة طويلة (٦٠٠٠ نقطة).
 */
export const CAM: Cam = { f: 6000, camH: 1.9, horizonY: 219, cx: 512 };

export const proj = (p: V3, c: Cam = CAM): V2 => ({ x: c.cx + (c.f * p.x) / p.z, y: c.horizonY + (c.f * (c.camH - p.y)) / p.z });
/** نقاط لكل متر عند العمق z */
export const pxm = (z: number, c: Cam = CAM) => c.f / z;
/** العمق الذي تقع عنده قدما القائم على سطر الشاشة y */
export const zForFootY = (y: number, c: Cam = CAM) => (c.f * c.camH) / (y - c.horizonY);
/** الموضع الأفقي بالأمتار لنقطة على الشاشة sx عند العمق z */
export const xAt = (sx: number, z: number, c: Cam = CAM) => ((sx - c.cx) * z) / c.f;

/** رجل بالغ بالأمتار (متوسطات القياس البشري) */
export const MAN = {
  H: 1.76, head: 0.235, headW: 0.158, neckBase: 1.47, shoulder: 1.44, chest: 1.28, waist: 1.06, hip: 0.93, knee: 0.5, ankle: 0.08,
  shoulderW: 0.44, chestW: 0.34, waistW: 0.3, hipW: 0.35, thighW: 0.16, shinW: 0.11, armW: 0.1, handL: 0.19, footL: 0.26,
  upperArm: 0.32, forearm: 0.27,
  /** جالساً: من السرج إلى قاعدة العنق وإلى العين */
  seatToNeck: 0.6, seatToEye: 0.78,
};

/** خطوط بناء الرأس: كسور من طول الرأس، من قمة الجمجمة (٠) إلى الذقن (١) */
export const HEAD = { hairline: 0.2, turbanEdge: 0.3, brow: 0.4, eye: 0.48, underEye: 0.56, noseBase: 0.68, mouth: 0.78, chin: 1 };

/** حصان عربي بالأمتار */
export const HORSE = { withers: 1.45, headL: 0.6, foreheadW: 0.22, muzzleW: 0.14, earL: 0.16, neckL: 0.95, backToCroup: 1.1 };

/** قواعد اللباس: موضع كل قطعة وسببه */
export const WEAR = {
  skullcap: { thick: 0.01, why: "الطاقية لاصقة بالرأس: تتبع قوس الجمجمة من خط الشعر إلى القمة بسماكة سنتيمتر" },
  turban: { edge: HEAD.turbanEdge, rise: 0.075, side: 0.035, why: "العمامة تبدأ فوق الحاجبين بإصبعين، وتعلو الجمجمة بلفّاتها نحو ٧ سم، ولا تزيد العرض إلا بسماكة اللف" },
  litham: { top: HEAD.underEye, drop: 0.09, side: 0.018, why: "اللثام يبدأ تحت العينين مباشرة على قصبة الأنف، ويغطي الأنف والفم والذقن، ويُدسّ تحت العمامة عند الأذنين" },
  eyeStrip: { why: "شريط العينين فراغ مقصود بين حافة العمامة وحافة اللثام: الحاجبان والعينان فقط" },
  helmet: { thick: 0.02, why: "الخوذة تغطي الجمجمة والوجه حتى الذقن، وشقّ النظر على خط العين بالضبط" },
  cloak: { why: "العباءة معلّقة من الكتفين، فتتسع نحو الأسفل، وتطير مع الريح؛ طيّاتها تخرج من نقطتي التعليق" },
  scarf: { why: "الوشاح ملفوف حول العنق، فطيّاته أفقية تلتف حوله" },
};

/** سماكة الخط بحسب نوعه وعمق صاحبه */
export const INK_M = { outline: 0.005, overlap: 0.0038, fold: 0.0026, detail: 0.0018 } as const;
export const ink = (z: number, kind: keyof typeof INK_M) => Math.max(0.5, INK_M[kind] * pxm(z));
/** يُرسم التفصيل إن كان على الشاشة ٣ نقاط فأكثر */
export const lod = (z: number, sizeM: number) => sizeM * pxm(z) >= 3;
/** نسبة الغلالة الجوية بالعمق: صفر قريباً، وتزيد مع البعد */
export const haze = (z: number, zh = 140) => 1 - Math.exp(-z / zh);
export const HAZE_COLOR = "#b49c78";

/** الشمس: عند الأفق يساراً خلف المشهد */
export const SUN = { dir: { x: -1, y: -0.15 }, rim: "#e9c995", shadowDir: { x: 0.9, y: 0.12 } };
/** الريح من اليسار إلى اليمين */
export const WIND = { x: 1, y: 0.18 };

// ───────── أدوات هندسية ─────────
const n1 = (v: number) => v.toFixed(1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp2 = (a: V2, b: V2, t: number): V2 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
export const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: V2, k: number): V2 => ({ x: a.x * k, y: a.y * k });
export const len = (a: V2) => Math.hypot(a.x, a.y);
export const norm = (a: V2): V2 => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
/** العمود على المتجه (يميناً إذا كان المتجه نازلاً) */
export const perp = (a: V2): V2 => ({ x: -a.y, y: a.x });

export const rng = (seed: number) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

export const hexMix = (a: string, b: string, t: number) => {
  const ch = (h: string) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const A = ch(a), B = ch(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
/** لون الشيء عند عمقه: يقترب من لون الغبار بقدر الغلالة */
export const atDepth = (color: string, z: number) => hexMix(color, HAZE_COLOR, haze(z));

export const polyPath = (pts: V2[]) => "M " + pts.map((p) => `${n1(p.x)} ${n1(p.y)}`).join(" L ") + " Z";
/** منحنى ناعم يمر بالنقاط (كاتمل-روم إلى بيزييه) */
export const smoothPath = (pts: V2[], closed = true, k = 1 / 6): string => {
  const n = pts.length;
  if (n < 2) return "";
  const P = (i: number) => pts[closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M ${n1(P(0).x)} ${n1(P(0).y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C ${n1(p1.x + (p2.x - p0.x) * k)} ${n1(p1.y + (p2.y - p0.y) * k)} ${n1(p2.x - (p3.x - p1.x) * k)} ${n1(p2.y - (p3.y - p1.y) * k)} ${n1(p2.x)} ${n1(p2.y)}`;
  }
  return closed ? d + " Z" : d;
};
export const linePath = (pts: V2[]) => smoothPath(pts, false);

/**
 * طيّات معلّقة: تخرج من نقطة التعليق a باتجاه القوة dir (الجاذبية + الريح)، وتتفرّق بزاوية spread،
 * وتطول كلما ابتعدت عن الشد. هذا سبب كل خط طيّة.
 */
export const hangFolds = (a: V2, dir: V2, n: number, length: number, spread: number, seed = 1): string[] => {
  const r = rng(seed);
  const base = Math.atan2(dir.y, dir.x);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const ang = base + t * spread + (r() - 0.5) * 0.1;
    const L = length * (0.7 + r() * 0.4);
    const s = { x: a.x + Math.cos(ang) * L * 0.08, y: a.y + Math.sin(ang) * L * 0.08 };
    const e = { x: a.x + Math.cos(ang) * L, y: a.y + Math.sin(ang) * L };
    const c = { x: a.x + Math.cos(ang) * L * 0.55 + (r() - 0.5) * L * 0.12, y: a.y + Math.sin(ang) * L * 0.55 + (r() - 0.5) * L * 0.06 };
    out.push(`M ${n1(s.x)} ${n1(s.y)} Q ${n1(c.x)} ${n1(c.y)} ${n1(e.x)} ${n1(e.y)}`);
  }
  return out;
};

/** خطوط بناء تُظهر للمستخدم سبب كل نقطة (إطار «البناء») */
export type Guide = { pts: V2[]; label?: string; color?: string; dot?: boolean };
export class Guides {
  list: Guide[] = [];
  line(pts: V2[], label?: string, color = "#38d0ff") { this.list.push({ pts, label, color }); }
  dot(p: V2, label?: string, color = "#ffd23a") { this.list.push({ pts: [p], label, color, dot: true }); }
}

/** إطار الرأس على الشاشة: من القمة إلى الذقن، مع ميلان الوجه (يمين/يسار) */
export type HeadFrame = { crown: V2; chin: V2; w: number; yaw: number };
/** نقطة على الرأس: u أفقياً من -١ (يسار الوجه) إلى ١، وv من القمة (٠) إلى الذقن (١) */
export const headPt = (h: HeadFrame, u: number, v: number): V2 => {
  const axis = sub(h.chin, h.crown);
  const side = norm(perp(axis)); // يشير إلى يسار الشاشة حين يكون المحور نازلاً
  const right = mul(side, -1);
  // الرأس كرة تقريباً: نقطة على زاوية θ=asin(u) تظهر بعد الالتفات عند sin(θ+yaw) (خط المنتصف عند لومِس)
  const th = Math.asin(Math.max(-1, Math.min(1, u)));
  const uu = Math.abs(u) > 1 ? u + Math.sin(h.yaw) : Math.sin(th + h.yaw);
  return add(add(h.crown, mul(axis, v)), mul(right, (uu * h.w) / 2));
};

/**
 * حلّ الطرف بعظمتين (عضد وساعد، أو فخذ وساق): المرفق/الركبة يُحسب من الطولين الحقيقيين،
 * فلا تطول الذراع ولا تقصر؛ وإن بعد الهدف أكثر من الطولين امتدّ الطرف مستقيماً نحوه.
 * bend: اتجاه انثناء المفصل (للمرفق: إلى الخارج والخلف).
 */
export const ik2 = (a: V3, target: V3, l1: number, l2: number, bend: V3): { mid: V3; end: V3 } => {
  const d = { x: target.x - a.x, y: target.y - a.y, z: target.z - a.z };
  const D = Math.hypot(d.x, d.y, d.z) || 1e-6;
  const reach = Math.min(D, l1 + l2 - 1e-4);
  const u = { x: d.x / D, y: d.y / D, z: d.z / D };
  const end = { x: a.x + u.x * reach, y: a.y + u.y * reach, z: a.z + u.z * reach };
  // بُعد المفصل على المحور، وارتفاعه عنه (قانون جيب التمام)
  const x = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  // اتجاه الانثناء عمودي على المحور
  const bd = bend.x * u.x + bend.y * u.y + bend.z * u.z;
  let b = { x: bend.x - u.x * bd, y: bend.y - u.y * bd, z: bend.z - u.z * bd };
  const bl = Math.hypot(b.x, b.y, b.z) || 1;
  b = { x: b.x / bl, y: b.y / bl, z: b.z / bl };
  return { mid: { x: a.x + u.x * x + b.x * h, y: a.y + u.y * x + b.y * h, z: a.z + u.z * x + b.z * h }, end };
};
