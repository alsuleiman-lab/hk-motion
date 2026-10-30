import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_QURAN, FONT_TITLE, QURAN_FONT } from "./localFonts";
import chunksJson from "../data/duel2_chunks.json";

// «أي دين من عند الله» — مواجهة طولية بطراز تقليدي هادئ (بيج / سكري / بني): النصارى (يمين) × المسلمون (يسار).
const FPS = 30;
const TITLE = "أي دين من عند الله";
// لوحة الألوان الهادئة
const INK = "#3a2616";
const BROWN = "#5b3a22"; // المسلمون
const BROWN2 = "#3f2615";
const CARAMEL = "#b8742b"; // النصارى
const CARAMEL2 = "#8c5219";
const GOLD = "#cfa968";
const SAND = "#e6d3b0";
const CREAM = "#fbf4e4";
const PAPER = "#f1e6cf";
const HILITE = "#f0d9a8";

type Word = { t: string; s: number; e: number };
type Chunk = { file: string; dur: number; first: string; last: string; words?: Word[] };
const CH = chunksJson as unknown as Record<string, Chunk>;

type Round = { tag: string; surah: string; turns: [string, string][] };
const ROUNDS: Round[] = [
  { tag: "ربكم دودة؟", surah: "سورة الزمر", turns: [["w1", "za"], ["w3", "zb"], ["w2", "zc"]] },
  { tag: "بروتستانتية", surah: "سورة المؤمنون", turns: [["g1", "q1"], ["g2", "q2"], ["g3", "q3"]] },
  { tag: "أرثوذكسي", surah: "سورة المائدة", turns: [["o1", "m1"], ["o2", "m2"], ["o3", "m3"]] },
  { tag: "كاثوليكي", surah: "سورة الحشر", turns: [["c1", "h1"], ["c2", "h2"], ["c3", "h3"]] },
];
const ORD = ["الأولى", "الثانية", "الثالثة", "الرابعة"];
const NUM = ["١", "٢", "٣", "٤"];

type Seg = { kind: "intro" | "turn"; from: number; dur: number; ri: number; ti: number; side: "c" | "m"; id: string; firstOfRound: boolean; turnNo: number; chunkNo: number };
const buildSegs = (): { segs: Seg[]; total: number } => {
  const segs: Seg[] = [];
  let f = 0;
  let turnNo = 0;
  let chunkNo = 0;
  ROUNDS.forEach((r, ri) => {
    const il = 42;
    segs.push({ kind: "intro", from: f, dur: il, ri, ti: 0, side: "c", id: "", firstOfRound: true, turnNo: -1, chunkNo });
    f += il;
    r.turns.forEach((pair, ti) => {
      (["c", "m"] as const).forEach((side, k) => {
        const id = pair[k];
        const dur = Math.ceil(CH[id].dur * FPS) + 3;
        segs.push({ kind: "turn", from: f, dur, ri, ti, side, id, firstOfRound: ti === 0 && side === "c", turnNo, chunkNo });
        f += dur;
        chunkNo++;
      });
      turnNo++;
    });
  });
  const TAIL = 24; // تثبيت اللقطة الأخيرة بعد آخر آية
  segs[segs.length - 1].dur += TAIL;
  f += TAIL;
  return { segs, total: f };
};
const BUILT = buildSegs();
export const DUEL2_FRAMES = BUILT.total;

// ───────────── هندسة زخرفية
const starPoints = (cx: number, cy: number, r: number, inner = 0.62) =>
  Array.from({ length: 16 }, (_, k) => {
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * inner;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(" ");

/** مستطيل بزوايا مستديرة بحجم W×H مُدخَل بمقدار i (يُستعمل لإطار الفيديو وقصّه) */
const archPath = (W: number, H: number, i: number) => {
  const r = Math.max(10, 44 - i * 0.7);
  const x0 = i, x1 = W - i, y0 = i, y1 = H - i;
  return `M ${x0 + r} ${y0} H ${x1 - r} Q ${x1} ${y0} ${x1} ${y0 + r} V ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} H ${x0 + r} Q ${x0} ${y1} ${x0} ${y1 - r} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
};

/** إطار مستطيل بزوايا مقعّرة (طراز المخطوطات) */
const notchPath = (w: number, h: number, i: number, r: number) =>
  `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 0 ${w - i} ${i + r} V ${h - i - r} A ${r} ${r} 0 0 0 ${w - i - r} ${h - i} H ${i + r} A ${r} ${r} 0 0 0 ${i} ${h - i - r} V ${i + r} A ${r} ${r} 0 0 0 ${i + r} ${i} Z`;

/** كرتوش بأطراف مدبّبة */
const cartouchePath = (w: number, h: number, i: number) => {
  const t = h / 2;
  return `M ${i + 56} ${i} H ${w - i - 56} Q ${w - i - 20} ${i} ${w - i} ${t} Q ${w - i - 20} ${h - i} ${w - i - 56} ${h - i} H ${i + 56} Q ${i + 20} ${h - i} ${i} ${t} Q ${i + 20} ${i} ${i + 56} ${i} Z`;
};

const Cartouche: React.FC<{ w: number; h: number; fill: string; line: string; edge: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, fill, line, edge, children, style }) => (
  <div style={{ position: "relative", width: w, height: h, ...style }}>
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <path d={cartouchePath(w, h, 3)} fill={fill} stroke={edge} strokeWidth={4} />
      <path d={cartouchePath(w, h, 11)} fill="none" stroke={line} strokeWidth={2} />
      <polygon points={starPoints(14, h / 2, 6)} fill={line} />
      <polygon points={starPoints(w - 14, h / 2, 6)} fill={line} />
    </svg>
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>{children}</div>
  </div>
);

// ───────────── الخلفية
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const motes = Array.from({ length: 16 }, (_, i) => {
    const x = random(`px${i}`) * 1080;
    const speed = 8 + random(`ps${i}`) * 14;
    const y = 1960 - ((random(`py${i}`) * 2000 + t * speed) % 2000);
    const r = 2.5 + random(`pr${i}`) * 4;
    return <circle key={i} cx={x + Math.sin(t * 0.5 + i) * 14} cy={y} r={r} fill={GOLD} opacity={0.25 + random(`po${i}`) * 0.25} />;
  });
  const sweep = (frame * 0.3) % 300;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <polygon points={starPoints(30, 30, 24)} fill={CREAM} stroke={BROWN} strokeWidth="3" />
      <polygon points={starPoints(30, 30, 11)} fill={GOLD} />
      <path d="M 62 30 H 130 M 30 62 V 130" stroke={GOLD} strokeWidth="2.5" />
      <circle cx="146" cy="30" r="4" fill={BROWN} />
      <circle cx="30" cy="146" r="4" fill={BROWN} />
    </g>
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, #f8efdc 0%, ${PAPER} 50%, #e9d9b8 100%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 38%, #fff8e8aa, transparent 70%), radial-gradient(1000px 520px at 50% 105%, ${GOLD}40, transparent 70%)` }} />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
        <defs>
          <pattern id="d2star" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={BROWN} strokeWidth="1.5">
              <rect x="30" y="30" width="60" height="60" />
              <rect x="30" y="30" width="60" height="60" transform="rotate(45 60 60)" />
              <circle cx="60" cy="60" r="12" />
            </g>
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#d2star)" />
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${sweep - 40}%, #fff6e255 ${sweep}%, transparent ${sweep + 40}%)` }} />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {motes}
        <rect x="20" y="20" width="1040" height="1880" fill="none" stroke={BROWN} strokeWidth="4" />
        <rect x="34" y="34" width="1012" height="1852" fill="none" stroke={GOLD} strokeWidth="2" />
        {corner(20, 20, 1, 1)}
        {corner(1060, 20, -1, 1)}
        {corner(20, 1900, 1, -1)}
        {corner(1060, 1900, -1, -1)}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, #5b3a2230 100%)" }} />
    </AbsoluteFill>
  );
};

// ───────────── عناصر مساعدة
const Bars: React.FC<{ color: string; n?: number; h?: number; w?: number; gap?: number }> = ({ color, n = 7, h = 60, w = 10, gap = 7 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap, height: h }}>
      {Array.from({ length: n }, (_, i) => {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.3 + i * 1.15) * Math.cos(frame * 0.13 + i * 0.6));
        return <div key={i} style={{ width: w, height: Math.max(h * 0.16, h * a), borderRadius: w, background: color }} />;
      })}
    </div>
  );
};

const WaitOverlay: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const rot = frame * 5;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, background: `linear-gradient(180deg, ${PAPER}a0, ${PAPER}d8)` }}>
      <div style={{ position: "relative", width: 170, height: 170 }}>
        <svg width="170" height="170" viewBox="0 0 150 150" style={{ position: "absolute", inset: 0 }}>
          <circle cx="75" cy="75" r="66" fill={`${CREAM}ee`} stroke={`${BROWN}30`} strokeWidth="6" />
          <circle cx="75" cy="75" r="66" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray="110 305" transform={`rotate(${rot} 75 75)`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 18, height: 60, borderRadius: 6, background: BROWN2 }} />
          <div style={{ width: 18, height: 60, borderRadius: 6, background: BROWN2 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: color, transform: `translateY(${Math.sin(frame * 0.22 - i * 0.9) * 10}px)` }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const PW = 490;
const PH = 790;
const PY = 330;
const XL = 34; // المسلمون
const XR = 556; // النصارى

type CardProps = {
  x: number; color: string; dark: string; label: string; plate: string; active: boolean; waiting: boolean; chunk: string | null; poster: string; scale: number; dx?: number; opacity?: number; pos: string; frames: number;
};
const ArchCard: React.FC<CardProps> = ({ x, color, dark, label, plate, active, waiting, chunk, poster, scale, dx = 0, opacity = 1, pos, frames }) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.16);
  const showVideo = active && chunk && frame < frames;
  const clip = archPath(PW, PH, 24);
  return (
    <div style={{ position: "absolute", left: x, top: PY, width: PW, height: PH, transform: `translateX(${dx}px) scale(${scale})`, transformOrigin: "50% 60%", opacity }}>
      <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, filter: active ? `drop-shadow(0 0 ${14 + pulse * 14}px ${GOLD}) drop-shadow(0 14px 18px #3a261655)` : "drop-shadow(0 12px 16px #3a261640)" }}>
        <path d={archPath(PW, PH, 4)} fill={active ? CREAM : SAND} stroke={dark} strokeWidth={8} />
        <path d={archPath(PW, PH, 15)} fill="none" stroke={active ? color : GOLD} strokeWidth={3} />
        <path d={archPath(PW, PH, 24)} fill="none" stroke={dark} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", inset: 0, clipPath: `path('${clip}')` }}>
        {showVideo ? (
          <OffthreadVideo src={staticFile(CH[chunk!].file)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
        ) : (
          <Img src={staticFile(poster)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter: waiting ? "grayscale(0.6) sepia(0.45) brightness(0.97) contrast(0.92)" : "none" }} />
        )}
        {waiting ? <WaitOverlay color={color} /> : null}
      </div>
      {/* لوحة الاسم */}
      <Cartouche w={400} h={104} fill={active ? dark : `${SAND}`} line={active ? GOLD : `${BROWN}66`} edge={active ? BROWN2 : `${BROWN}77`} style={{ position: "absolute", left: (PW - 400) / 2, bottom: -58, zIndex: 3, filter: "drop-shadow(0 8px 10px #3a261640)" }}>
        <span style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 40, color: active ? "#f8ecd0" : BROWN2, lineHeight: 1.1 }}>{label}</span>
        <span style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 700, fontSize: 26, color: active ? GOLD : `${BROWN}cc`, lineHeight: 1.25 }}>{plate}</span>
      </Cartouche>
    </div>
  );
};

const StatusPill: React.FC<{ x: number; color: string; active: boolean }> = ({ x, color, active }) => (
  <div style={{ position: "absolute", left: x + PW / 2 - 78, top: PY + PH + 80, width: 156, height: 62, borderRadius: 31, background: active ? color : `${CREAM}e0`, border: `3px solid ${active ? CREAM : `${BROWN}40`}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: active ? `0 0 24px ${GOLD}` : "0 5px 12px #3a26162a" }}>
    {active ? <Bars color={CREAM} n={6} h={32} w={8} /> : <div style={{ display: "flex", gap: 9 }}><div style={{ width: 10, height: 28, borderRadius: 4, background: `${BROWN}88` }} /><div style={{ width: 10, height: 28, borderRadius: 4, background: `${BROWN}88` }} /></div>}
  </div>
);

const VS: React.FC<{ f: number }> = ({ f }) => {
  const s = spring({ frame: f, fps: FPS, config: { damping: 9, stiffness: 150 } });
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 540 - 62, top: PY + PH / 2 - 62, width: 124, height: 124, zIndex: 6, transform: `scale(${s}) rotate(${(1 - s) * -90 + Math.sin(frame * 0.05) * 4}deg)` }}>
      <svg width="124" height="124" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 8px 10px #3a261655)" }}>
        <polygon points={starPoints(62, 62, 58, 0.7)} fill={CREAM} stroke={BROWN2} strokeWidth="4" />
        <polygon points={starPoints(62, 62, 46, 0.7)} fill={BROWN} stroke={GOLD} strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 38, color: "#f6e3b4" }}>VS</div>
    </div>
  );
};

// ───────────── اللوحات السفلية
const CAP_TOP = 1330;
const CAP_H = 440;
const OrnateFrame: React.FC<{ color: string; tag: string; children: React.ReactNode; f: number; glow?: string }> = ({ color, tag, children, f, glow = GOLD }) => {
  const s = spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 140 } });
  const W = 980;
  return (
    <div style={{ position: "absolute", left: 50, top: CAP_TOP, width: W, height: CAP_H, transform: `translateY(${(1 - s) * 40}px)`, opacity: 1 }}>
      <svg width={W} height={CAP_H} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 22px ${glow}66) drop-shadow(0 16px 20px #3a261644)` }}>
        <path d={notchPath(W, CAP_H, 4, 40)} fill={CREAM} stroke={color} strokeWidth={8} />
        <path d={notchPath(W, CAP_H, 16, 30)} fill="none" stroke={GOLD} strokeWidth={2.5} />
        {[[40, 40], [W - 40, 40], [40, CAP_H - 40], [W - 40, CAP_H - 40]].map(([cx, cy], i) => <polygon key={i} points={starPoints(cx, cy, 9)} fill={color} />)}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: -34, display: "flex", justifyContent: "center", zIndex: 3 }}>
        <Cartouche w={400} h={70} fill={color} line={GOLD} edge={BROWN2}>
          <span style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 32, color: "#f8ecd0" }}>{tag}</span>
        </Cartouche>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 56px 12px" }}>{children}</div>
    </div>
  );
};

const QuranCaption: React.FC<{ words: Word[]; f: number }> = ({ words, f }) => {
  const t = f / FPS;
  const n = words.length;
  const size = n > 18 ? 60 : n > 15 ? 68 : n > 11 ? 78 : n > 7 ? 90 : 106;
  let cur = -1;
  words.forEach((w, i) => { if (t >= w.s - 0.03) cur = i; });
  return (
    <div style={{ direction: "rtl", display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", columnGap: size * 0.3, rowGap: size * 0.1, fontFamily: QURAN_FONT, fontSize: size, lineHeight: 1.7 }}>
      {words.map((w, i) => {
        const started = i <= cur;
        const p = started ? spring({ frame: f - Math.round((w.s - 0.03) * FPS), fps: FPS, config: { damping: 13, stiffness: 220 } }) : 0;
        const isCur = i === cur;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 6px", borderRadius: 14, background: isCur ? `${HILITE}cc` : "transparent", opacity: started ? Math.min(1, p * 1.5) : 0, transform: `translateY(${(1 - p) * 16}px) scale(${0.85 + 0.15 * p})`, color: isCur ? CARAMEL2 : INK }}>
            {w.t}
            {isCur ? <span style={{ position: "absolute", left: "10%", right: "10%", bottom: size * 0.06, height: 5, borderRadius: 3, background: `linear-gradient(90deg, ${CARAMEL}, ${GOLD})` }} /> : null}
          </span>
        );
      })}
    </div>
  );
};

const ChristianCaption: React.FC<{ tag: string }> = ({ tag }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, direction: "rtl" }}>
    <Bars color={CARAMEL} n={11} h={124} w={17} gap={10} />
    <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 62, color: BROWN2 }}>{tag}</div>
  </div>
);

const RoundCard: React.FC<{ ri: number; f: number }> = ({ ri, f }) => {
  const r = ROUNDS[ri];
  const s = spring({ frame: f, fps: FPS, config: { damping: 11, stiffness: 140 } });
  const s2 = spring({ frame: f - 8, fps: FPS, config: { damping: 14, stiffness: 150 } });
  return (
    <OrnateFrame color={BROWN} tag="مواجهة" f={f}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, direction: "rtl" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, transform: `scale(${0.85 + 0.15 * s})` }}>
          <div style={{ position: "relative", width: 128, height: 128 }}>
            <svg width="128" height="128" style={{ position: "absolute", inset: 0 }}>
              <polygon points={starPoints(64, 64, 60, 0.72)} fill={BROWN} stroke={GOLD} strokeWidth="4" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 70, color: "#f6e3b4" }}>{NUM[ri]}</div>
          </div>
          <div style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 84, color: BROWN2 }}>الجولة {ORD[ri]}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Noto Kufi Arabic", fontWeight: 800, fontSize: 48, transform: `scale(${0.85 + 0.15 * s2})` }}>
          <span style={{ color: CARAMEL2 }}>{r.tag}</span>
          <span style={{ color: GOLD, margin: "0 26px", fontSize: 40 }}>◆</span>
          <span style={{ color: BROWN }}>{r.surah}</span>
        </div>
      </div>
    </OrnateFrame>
  );
};

// ───────────── مشهد واحد (مقطع أو تمهيد جولة)
const posterOf = (id: string, kind: "first" | "last") => CH[id][kind];

const Stage: React.FC<{ seg: Seg }> = ({ seg }) => {
  const f = useCurrentFrame();
  const r = ROUNDS[seg.ri];
  const isIntro = seg.kind === "intro";
  const cId = r.turns[seg.ti][0];
  const mId = r.turns[seg.ti][1];
  const cActive = seg.kind === "turn" && seg.side === "c";
  const mActive = seg.kind === "turn" && seg.side === "m";
  const prevC = seg.ti > 0 ? r.turns[seg.ti - 1][0] : null;
  const prevM = seg.ti > 0 ? r.turns[seg.ti - 1][1] : null;
  const mFirstPoster = seg.ri === 0 && seg.ti === 0 ? "duel2/intro_sheikh.jpg" : posterOf(mId, "first");
  const cPoster = isIntro || !prevC || cActive ? posterOf(cId, "first") : posterOf(cId, "last");
  const mPoster = isIntro || !prevM ? mFirstPoster : mActive ? posterOf(mId, "first") : posterOf(prevM, "last");
  const cWaitPoster = cActive ? cPoster : seg.side === "m" && seg.kind === "turn" ? posterOf(cId, "last") : cPoster;
  const mWaitPoster = mActive ? mPoster : seg.side === "c" && seg.kind === "turn" ? (prevM ? posterOf(prevM, "last") : mFirstPoster) : mPoster;

  const sp = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 120 } });
  const target = (act: boolean) => (act ? 1.04 : 0.96);
  const sc = (act: boolean, isC: boolean) => {
    if (isIntro) return 1;
    const from = seg.firstOfRound ? 1 : isC ? (cActive ? 0.96 : 1.04) : (mActive ? 0.96 : 1.04);
    return from + (target(act) - from) * sp;
  };
  const enter = isIntro ? spring({ frame: f, fps: FPS, config: { damping: 13, stiffness: 110 } }) : 1;
  const firstEver = isIntro && seg.ri === 0;
  const dxC = 0;
  const dxM = 0;
  const popI = isIntro ? 0.95 + 0.05 * enter : 1;
  const vis = firstEver ? 1 : Math.min(1, enter * 1.6);
  const cFrames = cActive ? Math.ceil(CH[cId].dur * FPS) : 0;
  const mFrames = mActive ? Math.ceil(CH[mId].dur * FPS) : 0;
  const words = mActive ? CH[mId].words ?? [] : [];
  return (
    <AbsoluteFill>
      <ArchCard x={XL} color={BROWN} dark={BROWN2} label="المسلمون" plate={r.surah} active={mActive} waiting={seg.kind === "turn" && !mActive} chunk={mActive ? mId : null} poster={mWaitPoster} scale={sc(mActive, false) * popI} dx={dxM} opacity={vis} pos="50% 14%" frames={mFrames} />
      <ArchCard x={XR} color={CARAMEL} dark={CARAMEL2} label="النصارى" plate={r.tag} active={cActive} waiting={seg.kind === "turn" && !cActive} chunk={cActive ? cId : null} poster={cWaitPoster} scale={sc(cActive, true) * popI} dx={dxC} opacity={vis} pos="50% 22%" frames={cFrames} />
      <VS f={isIntro ? f : seg.firstOfRound ? 0 : 99} />
      {seg.kind === "turn" ? <StatusPill x={XL} color={BROWN} active={mActive} /> : null}
      {seg.kind === "turn" ? <StatusPill x={XR} color={CARAMEL} active={cActive} /> : null}
      {isIntro ? <RoundCard ri={seg.ri} f={f} /> : null}
      {seg.kind === "turn" && mActive ? (
        <OrnateFrame color={BROWN} tag={`﴿ ${r.surah} ﴾`} f={f}>
          <QuranCaption words={words} f={f} />
        </OrnateFrame>
      ) : null}
      {seg.kind === "turn" && cActive ? (
        <OrnateFrame color={CARAMEL2} tag="يتحدّث الآن" f={f} glow={CARAMEL}>
          <ChristianCaption tag={r.tag} />
        </OrnateFrame>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────── شريط التقدّم: نجمة لكل مقطع
const Progress: React.FC<{ frame: number }> = ({ frame }) => {
  const idx = BUILT.segs.findIndex((s, i) => frame >= s.from && (i === BUILT.segs.length - 1 || frame < BUILT.segs[i + 1].from));
  const seg = BUILT.segs[idx];
  const cur = seg.kind === "turn" ? seg.chunkNo : -1;
  const done = seg.chunkNo;
  const stars: React.ReactNode[] = [];
  let n = 0;
  ROUNDS.forEach((r, ri) => {
    r.turns.forEach((_, ti) => {
      (["c", "m"] as const).forEach((side) => {
        const k = n;
        const isDone = k < done;
        const isCur = k === cur;
        const col = side === "c" ? CARAMEL : BROWN;
        stars.push(
          <svg key={`${ri}-${ti}-${side}`} width={isCur ? 38 : 30} height={isCur ? 38 : 30} viewBox="0 0 30 30" style={{ marginInlineStart: ti === 0 && side === "c" && ri > 0 ? 26 : 5, filter: isCur ? `drop-shadow(0 0 8px ${GOLD})` : "none" }}>
            <polygon points={starPoints(15, 15, 13, 0.64)} fill={isDone || isCur ? col : "none"} stroke={isCur ? GOLD : col} strokeWidth={isCur ? 2.5 : 1.8} opacity={isDone || isCur ? 1 : 0.45} />
          </svg>
        );
        n++;
      });
    });
  });
  return <div style={{ position: "absolute", left: 0, right: 0, top: 1812, height: 40, display: "flex", justifyContent: "center", alignItems: "center", direction: "ltr" }}>{stars}</div>;
};

// ───────────── العنوان
const TW = 900;
const TH = 140;
const TitlePlate: React.FC<{ frame: number }> = ({ frame }) => {
  const pop = spring({ frame, fps: FPS, config: { damping: 11, stiffness: 140 } });
  const sc = 0.88 + 0.12 * pop;
  return (
    <div style={{ position: "absolute", top: 82, left: 0, right: 0, display: "flex", justifyContent: "center", direction: "rtl", transform: `scale(${sc})`, transformOrigin: "50% 0%", zIndex: 20 }}>
      <Cartouche w={TW} h={TH} fill={BROWN2} line={GOLD} edge={BROWN} style={{ filter: "drop-shadow(0 14px 18px #3a261666)" }}>
        <span style={{ fontFamily: "Noto Kufi Arabic", fontWeight: 900, fontSize: 80, color: "#f8e9c4", lineHeight: 1.3, textShadow: "0 3px 6px #0006" }}>{TITLE}</span>
      </Cartouche>
    </div>
  );
};

export const Duel2: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();
  FONT_TITLE();
  FONT_QURAN();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Background />
      <AbsoluteFill>
        {BUILT.segs.filter((s) => s.kind === "intro" || s.kind === "turn").map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
            <Stage seg={s} />
          </Sequence>
        ))}
        <Progress frame={frame} />
      </AbsoluteFill>
      <TitlePlate frame={frame} />
    </AbsoluteFill>
  );
};
