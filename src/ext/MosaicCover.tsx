import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_TITLE } from "../localFonts";
import { clamp01, easeOut, easeInOut } from "./motion";
import { mulberry32 } from "./rand";

/**
 * «الفسيفساء تتجمع غلافاً» (أمر الشيخ في حلقة gta6، 2026-11-20): تسع قطع بازل غير منتظمة من صورة الغلاف (`src`)، على كل قطعة كلمة عربية كبيرة،
 * تصل كل قطعة لحظة نطق كلمتها (`words[i].at`، بثواني القص المطلقة) فتتجمع الغلاف كاملاً، ثم برق (`flashAt`) يمحو الكلمات ويبقى الغلاف نظيفاً حتى `until`.
 * عنصر ملء الشاشة فوق كل شيء (الشيخ مختفٍ خلفه كعنصر «الأوزار على الظهر»)، يرسم في الاتجاهين بمقاس التركيب (useVideoConfig).
 * دالة نقية من الإطار: لا حالة بين الإطارات، وكل «عشوائية» من بذرة ثابتة.
 * الصورة تُطمس فيها النساء قبل وضعها (tools/blur_region.py)؛ هذا المكوّن لا يطمس شيئاً.
 * الصوت: لمعة خافتة واحدة عند البرق (ref_sfx/shimmer.wav، مخفّضة سلفاً)، `sound: false` يسكتها.
 */
export type MosaicCoverProps = {
  at: number;
  until: number;
  /** الكلمات بترتيب نطقها؛ تسع على الأكثر (الزائد يُهمل)، وإن نقصت جاءت القطع الباقية بلا كلمة مع آخر كلمة */
  words: { text: string; at: number }[];
  /** صورة الغلاف تحت public/ */
  src: string;
  /** ارتفاع الصورة ÷ عرضها (الافتراضي غلاف gta6/cover_blur.png: 1182 ÷ 966) */
  ar?: number;
  /** ثانية البرق؛ الافتراضي بعد آخر كلمة بـ 0.9 ث (وبعد استقرار آخر قطعة) */
  flashAt?: number;
  sound?: boolean;
  soundVol?: number;
  muted?: boolean;
  /** مستطيل في الصورة لا تغطيه الكلمات ([x, y, w, h] نسبةً إلى الصورة): الافتراضي مربع «18» في غلاف gta6/cover_blur.png، فتُرفع الكلمة فوقه ليبقى ظاهراً */
  keep?: [number, number, number, number];
};

const N = 3;                       // 3 × 3 = تسع قطع
const FLY = 0.55;                  // زمن طيران القطعة إلى مكانها
const EXIT = 0.3;               // زمن الخروج في آخر العنصر
const ORDER = [4, 0, 2, 8, 1, 5, 7, 3, 6];   // أي خانة تأخذ الكلمة رقم k (الوسط أولاً، والأخيرة في الزاوية التي فيها علامة +18)

type Pt = [number, number];

/* ── الشكل: شبكة 3×3 رؤوسها الداخلية مزاحة، وكل حدّ داخلي فيه لسان بازل (عرضه يتسع نحو رأسه فيقفل) وتعرّجات صغيرة؛ الحدّ المشترك يُحسب مرة واحدة فتنطبق القطعتان */
const GEOM = (() => {
  const r = mulberry32(6061);
  const J = 0.055;
  const P: Pt[][] = [];
  for (let i = 0; i <= N; i++) {
    P.push([]);
    for (let j = 0; j <= N; j++) {
      const inX = j > 0 && j < N, inY = i > 0 && i < N;
      P[i].push([j / N + (inX ? (r() - 0.5) * 2 * J : 0), i / N + (inY ? (r() - 0.5) * 2 * J : 0)]);
    }
  }
  const edge = (a: Pt, b: Pt, inner: boolean): Pt[] => {
    if (!inner) return [a, b];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const s = r() < 0.5 ? 1 : -1, h = 0.16 * L * s, sh = (r() - 0.5) * 0.08;
    const at = (t: number, o: number): Pt => [a[0] + dx * t + nx * o, a[1] + dy * t + ny * o];
    const w1 = (r() - 0.5) * 0.018, w2 = (r() - 0.5) * 0.018;
    return [a, at(0.2, w1), at(0.41 + sh, 0), at(0.37 + sh, h), at(0.63 + sh, h), at(0.59 + sh, 0), at(0.8, w2), b];
  };
  const H: Pt[][][] = [], V: Pt[][][] = [];
  for (let i = 0; i <= N; i++) { H.push([]); for (let j = 0; j < N; j++) H[i].push(edge(P[i][j], P[i][j + 1], i > 0 && i < N)); }
  for (let i = 0; i < N; i++) { V.push([]); for (let j = 0; j <= N; j++) V[i].push(edge(P[i][j], P[i + 1][j], j > 0 && j < N)); }
  const pieces = [] as { poly: Pt[]; c: Pt; w: number }[];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const top = H[i][j], right = V[i][j + 1], bottom = [...H[i + 1][j]].reverse(), left = [...V[i][j]].reverse();
    const poly = [...top, ...right.slice(1), ...bottom.slice(1), ...left.slice(1, -1)];
    const q = [P[i][j], P[i][j + 1], P[i + 1][j + 1], P[i + 1][j]];
    const c: Pt = [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4];
    const w = Math.min(P[i][j + 1][0] - P[i][j][0], P[i + 1][j + 1][0] - P[i + 1][j][0]);
    pieces.push({ poly, c, w });
  }
  /* اتجاه دخول كل قطعة ودورانها */
  const fly = pieces.map((p) => {
    let vx = p.c[0] - 0.5, vy = p.c[1] - 0.5;
    if (Math.hypot(vx, vy) < 0.05) { vx = r() - 0.5; vy = -0.6; }
    const L = Math.hypot(vx, vy), sw = (r() - 0.5) * 0.7;
    return { ux: vx / L + sw * (-vy / L), uy: vy / L + sw * (vx / L), rot: (r() < 0.5 ? -1 : 1) * (16 + r() * 20) };
  });
  /* البرق: خط متعرج من أعلى الغلاف إلى أسفله، وفرعان */
  const bolt = (x0: number, y0: number, x1: number, y1: number, n: number, amp: number): Pt[] => {
    const out: Pt[] = [[x0, y0]];
    for (let k = 1; k < n; k++) { const t = k / n; out.push([x0 + (x1 - x0) * t + (r() - 0.5) * amp, y0 + (y1 - y0) * t + (r() - 0.5) * amp * 0.25]); }
    out.push([x1, y1]); return out;
  };
  const main = bolt(0.58, -0.05, 0.36, 1.05, 14, 0.16);
  const br1 = bolt(main[4][0], main[4][1], 0.86, 0.5, 6, 0.1);
  const br2 = bolt(main[9][0], main[9][1], 0.1, 0.86, 5, 0.1);
  return { pieces, fly, bolts: [main, br1, br2] };
})();

const polyCss = (poly: Pt[], W: number, H: number) => `polygon(${poly.map(([x, y]) => `${(x * W).toFixed(1)}px ${(y * H).toFixed(1)}px`).join(", ")})`;
const polyAttr = (poly: Pt[], W: number, H: number) => poly.map(([x, y]) => `${(x * W).toFixed(1)},${(y * H).toFixed(1)}`).join(" ");

export const MosaicCover: React.FC<MosaicCoverProps> = ({ at, until, words, src, ar = 1182 / 966, flashAt, sound = true, soundVol = 1, muted, keep = [0.02, 0.8, 0.16, 0.19] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const fam = FONT_TITLE();
  const ws = words.slice(0, 9);
  const lastAt = ws.length ? ws[ws.length - 1].at : at;
  const F = flashAt ?? Math.max(lastAt + FLY + 0.25, lastAt + 0.9);
  const snd = sound && !muted ? <Sequence from={Math.max(0, Math.round((F - 0.05) * fps))} durationInFrames={Math.round(1.2 * fps)} layout="none"><Audio src={staticFile("ref_sfx/shimmer.wav")} volume={Math.min(1, 0.5 * soundVol)} /></Sequence> : null;
  if (t < at - 0.001 || t > until) return snd;

  const land = width > height;
  /* الغلاف في وسط الإطار: العرضي بارتفاع 960، والطولي بعرض 1000 */
  const BH0 = land ? Math.min(960, height * 0.89) : Math.min(1000 * ar, height * 0.66);
  const BW = Math.round(BH0 / ar), BH = Math.round(BH0);
  const BX = Math.round((width - BW) / 2), BY = Math.round((height - BH) / 2) + (land ? 0 : -20);
  const cellW = BW / N;
  const fontBase = Math.round(cellW * 0.24);
  const dist = land ? 980 : 1200;

  const tIn = clamp01((t - at) / 0.3);
  const tOut = clamp01((t - (until - EXIT)) / EXIT);
  const appear = easeOut(tIn) * (1 - easeInOut(tOut));
  const tf = t - F;
  const flashed = tf >= 0.02;
  /* البياض: ومضة قوية ثم ومضة ثانية أخف (رفّة البرق) */
  const white = tf < -0.06 ? 0 : tf < 0.04 ? clamp01((tf + 0.06) / 0.1) * 0.96 : 0.96 * Math.exp(-(tf - 0.04) / 0.13) + (tf > 0.17 ? 0.45 * Math.exp(-Math.max(0, tf - 0.2) / 0.08) * clamp01((tf - 0.17) / 0.03) : 0);
  const boltOn = (tf > -0.06 && tf < 0.11) || (tf > 0.17 && tf < 0.27);
  /* بعد اكتمال الغلاف: نبضة صغيرة، وبعد البرق تقريب بطيء */
  const lastLand = lastAt + FLY;
  const done = clamp01((t - lastLand) / 0.35);
  const push = flashed ? 1.012 + 0.03 * easeInOut(clamp01(tf / Math.max(0.5, until - EXIT - F))) : 1 + 0.012 * done;
  const exitK = 1 - 0.08 * easeInOut(tOut);

  const timeOf = (cell: number): number | null => {
    const k = ORDER.indexOf(cell);
    if (k < ws.length) return ws[k].at;
    return ws.length ? lastAt + 0.15 * (k - ws.length + 1) : at + 0.15 * k;
  };
  const wordOf = (cell: number) => ws[ORDER.indexOf(cell)]?.text;

  return (
    <>
      {snd}
      <AbsoluteFill style={{ opacity: appear, overflow: "hidden", background: "#120b1c" }}>
        {/* الأرضية: الغلاف نفسه مطموساً معتماً (صورة لا لون سادة) */}
        <Img src={staticFile(src)} style={{ position: "absolute", left: -60, top: -60, width: width + 120, height: height + 120, objectFit: "cover", filter: "blur(38px) brightness(.32) saturate(1.25)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(10,4,20,0) 35%, rgba(6,2,12,.7) 100%)" }} />

        <div style={{ position: "absolute", left: BX, top: BY, width: BW, height: BH, transform: `scale(${push * exitK})`, transformOrigin: "50% 50%" }}>
          {/* اللوح الفارغ: مكان الغلاف وحدود قطعه بخط منقّط، يُملأ قطعة قطعة */}
          {!flashed ? (
            <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <rect x={0} y={0} width={BW} height={BH} rx={6} fill="rgba(4,0,10,.45)" stroke="rgba(255,255,255,.35)" strokeWidth={2} />
              {GEOM.pieces.map((p, i) => <polygon key={i} points={polyAttr(p.poly, BW, BH)} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={2} strokeDasharray="10 8" />)}
            </svg>
          ) : null}

          {/* القطع */}
          {!flashed ? GEOM.pieces.map((p, cell) => {
            const ta = timeOf(cell);
            if (ta == null || t < ta) return null;
            const q = clamp01((t - ta) / FLY), e = easeOut(q), fl = GEOM.fly[cell];
            const land1 = clamp01((t - ta - FLY) / 0.18);
            const bump = land1 > 0 && land1 < 1 ? 0.03 * Math.sin(Math.PI * land1) : 0;
            const s = 1 + 0.2 * (1 - e) - bump;
            const dx = fl.ux * dist * (1 - e), dy = fl.uy * dist * (1 - e), rot = fl.rot * (1 - e);
            const cx = p.c[0] * BW, cy = p.c[1] * BH;
            const glow = land1 > 0 ? 1 - land1 : 0;
            const word = wordOf(cell);
            const fs = word && word.length > 11 ? Math.round(fontBase * 0.78) : fontBase;
            /* موضع الكلمة: وسط القطعة، وتُرفع فوق المستطيل المحفوظ (مربع «18») إن وقعت عليه — تقدير مقاسها من طول النص */
            const maxW = p.w * BW * 0.92, padX = Math.round(fs * 0.32), cap = Math.max(1, Math.floor((maxW - 2 * padX) / (fs * 0.55)));
            const lines = word ? Math.max(1, Math.ceil(word.length / cap)) : 1, hh = (lines * fs * 1.3 + fs * 0.32) / 2, hw = Math.min(maxW, (word?.length ?? 0) * fs * 0.55 + 2 * padX) / 2;
            const kx0 = keep[0] * BW, ky0 = keep[1] * BH, kx1 = kx0 + keep[2] * BW, ky1 = ky0 + keep[3] * BH;
            const ly = cx + hw > kx0 && cx - hw < kx1 && cy + hh > ky0 && cy - hh < ky1 ? ky0 - hh - 12 : cy;
            return (
              <div key={cell} style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, opacity: clamp01(q / 0.15), transformOrigin: `${cx}px ${cy}px`, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${s})`, filter: `drop-shadow(0 ${8 + 22 * (1 - e)}px ${10 + 24 * (1 - e)}px rgba(0,0,0,${0.45 + 0.25 * (1 - e)}))`, zIndex: q < 1 ? 20 : 1 }}>
                <div style={{ position: "absolute", inset: 0, clipPath: polyCss(p.poly, BW, BH) }}>
                  <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(14,6,26,.22)" }} />
                </div>
                <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <polygon points={polyAttr(p.poly, BW, BH)} fill="none" stroke={`rgba(255,255,255,${0.55 + 0.45 * glow})`} strokeWidth={2 + 4 * glow} strokeLinejoin="round" />
                </svg>
                {word ? (
                  <div style={{ position: "absolute", left: cx - maxW / 2, top: ly, width: maxW, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
                    <div dir="rtl" style={{ fontFamily: fam, fontWeight: 800, fontSize: fs, lineHeight: 1.3, color: "#fff", textAlign: "center", padding: `${Math.round(fs * 0.12)}px ${padX}px ${Math.round(fs * 0.2)}px`, background: "rgba(12,5,24,.78)", border: "2px solid rgba(255,255,255,.28)", borderRadius: Math.round(fs * 0.28), textShadow: "0 2px 6px rgba(0,0,0,.6)", boxShadow: "0 6px 18px rgba(0,0,0,.45)" }}>{word}</div>
                  </div>
                ) : null}
              </div>
            );
          }) : null}

          {/* بعد البرق: الغلاف وحده نظيفاً */}
          {flashed ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 4, overflow: "hidden", boxShadow: `0 0 ${40 + 60 * Math.exp(-Math.max(0, tf) / 0.6)}px rgba(255,236,250,${0.25 + 0.5 * Math.exp(-Math.max(0, tf) / 0.6)}), 0 18px 40px rgba(0,0,0,.55)` }}>
              <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH }} />
            </div>
          ) : null}

          {/* البرق */}
          {boltOn ? (
            <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 30 }}>
              <defs><filter id="mosaicBoltGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10} /></filter></defs>
              {GEOM.bolts.map((b, i) => (
                <g key={i}>
                  <polyline points={polyAttr(b, BW, BH)} fill="none" stroke="rgba(190,170,255,.95)" strokeWidth={i ? 14 : 26} strokeLinejoin="miter" filter="url(#mosaicBoltGlow)" />
                  <polyline points={polyAttr(b, BW, BH)} fill="none" stroke="#fff" strokeWidth={i ? 3 : 6} strokeLinejoin="miter" />
                </g>
              ))}
            </svg>
          ) : null}
        </div>

        {white > 0.001 ? <AbsoluteFill style={{ background: `rgba(255,252,255,${white})` }} /> : null}
      </AbsoluteFill>
    </>
  );
};
