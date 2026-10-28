import { SFX_LEVELS } from "./sfxConfig";
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { Icon } from "./Icon";
import { IconName } from "./data";
import { amiri, cairo } from "./Scenes";
import { lalezar } from "./RefStyle";

/**
 * Portrait (1080x1920) sample — first 1:59 of the Ahmed Al-Tayeb video, in the style of the user's second reference
 * (full-screen speaker with edge stickers <-> speaker card on a coloured background <-> full-screen illustrations) plus flat illustrations.
 */
const { fontFamily: rakkas } = loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const P_FPS = 30;
/** The first 3 s of the source are cut; the first COVER_FRAMES frames show a cover image (thumbnail). */
export const CUT_SECONDS = 3;
export const COVER_FRAMES = 3; // 0.10 s
export const P_SECONDS = 119 - CUT_SECONDS;
export const P_FRAMES = P_FPS * P_SECONDS;
const W = 1080;
const H = 1920;
const TAIL = 8;

const C = { dark: "#101115", teal2: "#7a5232", indigo: "#24456e", plum: "#6b4630", peri: "#2f5f94", pink: "#a8743f", white: "#ffffff", ink: "#16161a", yellow: "#ffd426", red: "#ee3b2f", teal: "#35c6b4", skin: "#e9b78e" };

// ---------- helpers ----------
const usePop = (at: number, damping = 12) => {
  const f = useCurrentFrame();
  return spring({ frame: f - Math.round(at * P_FPS), fps: P_FPS, config: { damping, stiffness: 170, mass: 0.7 } });
};
const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 0.6 }) => {
  const p = usePop(at);
  return <div style={{ opacity: Math.min(1, p * 2.2), transform: `scale(${from + (1 - from) * p})`, ...style }}>{children}</div>;
};
const At: React.FC<{ x?: number; y?: number; w?: number; children: React.ReactNode; right?: number; bottom?: number }> = ({ x, y, w, right, bottom, children }) => (
  <div style={{ position: "absolute", left: x, top: y, right, bottom, width: w, display: "flex", justifyContent: "center" }}>{children}</div>
);

const GridBG: React.FC<{ color: string }> = ({ color }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${color}, ${color}dd 60%, ${color}aa)` }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.16) 2px, transparent 2px)", backgroundSize: "36px 36px", backgroundPosition: `${f * 0.3}px ${f * 0.2}px`, opacity: 0.6 }} />
    </AbsoluteFill>
  );
};

const PillW: React.FC<{ children: React.ReactNode; at: number; size?: number; bg?: string; color?: string }> = ({ children, at, size = 54, bg = C.white, color = C.ink }) => (
  <Pop at={at}>
    <div style={{ background: bg, color, fontFamily: cairo, fontWeight: 800, fontSize: size, padding: "10px 40px", borderRadius: 999, boxShadow: "0 8px 22px rgba(0,0,0,.35)", textAlign: "center" }}>{children}</div>
  </Pop>
);

const IconTile: React.FC<{ icon: IconName; label: string; at: number; tint?: string }> = ({ icon, label, at, tint = C.ink }) => (
  <Pop at={at} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 280 }}>
    <div style={{ background: "rgba(255,255,255,.92)", color: C.ink, fontFamily: cairo, fontWeight: 800, fontSize: 34, padding: "4px 22px", borderRadius: 999, textAlign: "center" }}>{label}</div>
    <div style={{ width: 190, height: 190, borderRadius: 46, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>
      <Icon name={icon} size={110} color={tint} stroke={3} />
    </div>
  </Pop>
);

const Stamp: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const p = usePop(at, 8);
  return (
    <div style={{ transform: `scale(${2.4 - 1.4 * Math.min(p, 1.05)}) rotate(-9deg)`, opacity: Math.min(1, p * 3), border: `14px solid ${C.red}`, borderRadius: 22, padding: "8px 46px", fontFamily: lalezar, fontSize: 120, color: C.red, background: "rgba(255,255,255,.93)", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}>{children}</div>
  );
};

const Bubble: React.FC<{ children: React.ReactNode; at: number; w?: number; tail?: "left" | "right" | "down"; bg?: string; color?: string }> = ({ children, at, w = 780, tail = "down", bg = C.white, color = C.ink }) => (
  <Pop at={at} from={0.7} style={{ position: "relative", width: w }}>
    <div style={{ background: bg, color, borderRadius: 48, padding: "34px 44px", fontFamily: lalezar, fontSize: 66, lineHeight: 1.3, textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,.4)" }}>{children}</div>
    <div style={{ position: "absolute", bottom: -34, [tail === "right" ? "right" : "left"]: tail === "down" ? "50%" : 90, marginLeft: tail === "down" ? -30 : 0, width: 0, height: 0, borderLeft: "34px solid transparent", borderRight: "34px solid transparent", borderTop: `44px solid ${bg}` }} />
  </Pop>
);

const IsnadChain: React.FC<{ at: number }> = ({ at }) => {
  const nodes = [
    { t: "راوٍ", bad: false },
    { t: "مجهول", bad: true },
    { t: "راوٍ", bad: false },
    { t: "مجهول", bad: true },
    { t: "راوٍ", bad: false },
  ];
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, direction: "rtl" }}>
      {nodes.map((n, i) => {
        const p = spring({ frame: f - Math.round((at + i * 0.35) * P_FPS), fps: P_FPS, config: { damping: 12, stiffness: 170 } });
        return (
          <React.Fragment key={i}>
            <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.4 + 0.6 * p})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill={n.bad ? C.red : "#ffffff"} stroke={n.bad ? "#ffd1cc" : "#cfd3ff"} strokeWidth="6" />
                <circle cx="60" cy="48" r="18" fill={n.bad ? "#ffe3df" : "#6d72b8"} />
                <path d="M26 98 Q60 52 94 98 Z" fill={n.bad ? "#ffe3df" : "#6d72b8"} />
                {n.bad && <text x="60" y="64" textAnchor="middle" fontSize="40" fontWeight="900" fill={C.red} fontFamily="Cairo">?</text>}
              </svg>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 28, color: n.bad ? C.yellow : "#fff" }}>{n.t}</div>
            </div>
            {i < nodes.length - 1 && <div style={{ width: 34, height: 6, background: "rgba(255,255,255,.7)", marginBottom: 34, opacity: Math.min(1, p * 2) }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Distinct slam text for the hadith: "في إسناده مجهولان !!!" */
const Slam: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const f = useCurrentFrame();
  const t0 = Math.round(at * P_FPS);
  const p = spring({ frame: f - t0, fps: P_FPS, config: { damping: 9, stiffness: 200, mass: 0.8 } });
  const shake = f - t0 < 18 && f >= t0 ? Math.sin((f - t0) * 2.4) * 14 * (1 - (f - t0) / 18) : 0;
  const flash = f >= t0 ? interpolate(f - t0, [0, 6], [0.7, 0], { extrapolateRight: "clamp" }) : 0;
  const pulse = 1 + Math.sin(f / 5) * 0.015;
  const out = interpolate(f, [t0 + dur - 6, t0 + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})`, pointerEvents: "none" }} />
      <div style={{ opacity: Math.min(1, p * 3) * out, transform: `translateX(${shake}px) scale(${(2.2 - 1.2 * Math.min(p, 1.04)) * pulse}) rotate(-3deg)`, background: C.red, padding: "18px 40px 8px", borderRadius: 26, boxShadow: "0 0 0 8px #fff, 0 20px 50px rgba(0,0,0,.6)", width: 960 }}>
        <div style={{ fontFamily: rakkas, fontSize: 118, lineHeight: 1.25, textAlign: "center", color: C.yellow, WebkitTextStroke: "8px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.45)" }}>في إسناده مجهولان !!!</div>
      </div>
    </>
  );
};

// ---------- timeline ----------
type Layout = "fs" | "card" | "broll";
type Beat = { from: number; to: number; layout: Layout; bg: string; reveals: number[]; content: React.ReactNode };

const Photo: React.FC<{ src: string; w: number; h: number; at: number; rot?: number }> = ({ src, w, h, at, rot = 0 }) => (
  <Pop at={at} from={0.8}>
    <div style={{ width: w, height: h, borderRadius: 40, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 16px 44px rgba(0,0,0,.5)", transform: `rotate(${rot}deg)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  </Pop>
);

const beats: Beat[] = [
  {
    from: 3, to: 11, layout: "card", bg: C.peri, reveals: [1.4, 2.4],
    content: (
      <>
        <At x={0} y={830} w={W}>
          <Photo src="broll/ahmed_el_tayeb.jpg" w={760} h={640} at={1.4} rot={-2} />
        </At>
        <At x={0} y={1500} w={W}>
          <PillW at={2.4}>أحمد الطيب</PillW>
        </At>
      </>
    ),
  },
  {
    from: 11, to: 21, layout: "broll", bg: C.teal2, reveals: [4.5, 6, 7.5, 8],
    content: (
      <>
        <At x={0} y={170} w={W}>
          <Bubble at={4.5}>ما عندي مشكلة إذا المسلم تنصّر</Bubble>
        </At>
        <At x={0} y={520} w={W}>
          <div style={{ display: "flex", gap: 26 }}>
            <Photo src="people/hangingChurch.jpg" w={456} h={760} at={6} rot={-1.5} />
            <Photo src="people/markCathedral.jpg" w={456} h={760} at={7.5} rot={1.5} />
          </div>
        </At>
        <At x={0} y={1640} w={W}>
          <PillW at={8} bg={C.yellow}>العبارة محلّ النقاش</PillW>
        </At>
      </>
    ),
  },
  {
    from: 21, to: 33, layout: "fs", bg: C.indigo, reveals: [0.4, 9],
    content: (
      <>
        <At x={0} y={130} w={W}>
          <Bubble at={0.4} w={900} bg={C.white}>
            <span style={{ fontSize: 50 }}>هل تفهم أنك لست ضدّ من يتحوّل من الإسلام إلى المسيحية؟</span>
          </Bubble>
        </At>
        <At x={0} y={1320} w={W}>
          <Bubble at={9} w={900} bg={C.red} color="#fff">
            <span style={{ fontSize: 56 }}>لستُ ضدّ ... ولكن ضدّ نشر مذهب</span>
          </Bubble>
        </At>
      </>
    ),
  },
  {
    from: 33, to: 41, layout: "card", bg: C.pink, reveals: [2.9, 3.7, 4.3],
    content: (
      <>
        <At x={0} y={800} w={W}>
          <div style={{ display: "flex", gap: 26 }}>
            <Photo src="people/shia1_blur.jpg" w={456} h={600} at={2.9} rot={-1.5} />
            <Photo src="people/markCathedral.jpg" w={456} h={600} at={3.7} rot={1.5} />
          </div>
        </At>
        <At x={0} y={1430} w={W}>
          <div style={{ display: "flex", gap: 26 }}>
            <PillW at={3} size={46}>الشيعة</PillW>
            <PillW at={3.9} size={46}>الدين المسيحي</PillW>
          </div>
        </At>
        <At x={0} y={1640} w={W}>
          <PillW at={4.3} bg={C.ink} color="#fff" size={44}>هل لديك مشكلة لو أحدٌ غيّر دينه؟</PillW>
        </At>
      </>
    ),
  },
  {
    from: 41, to: 48, layout: "fs", bg: C.plum, reveals: [1, 2.2],
    content: (
      <>
        <At x={0} y={820} w={W}>
          <Stamp at={1}>لا أؤمن بالردّة</Stamp>
        </At>
        <At x={0} y={1210} w={W}>
          <PillW at={2.2} bg={C.yellow}>ولا أؤمن بهذا الكلام</PillW>
        </At>
      </>
    ),
  },
  {
    from: 48, to: 60, layout: "card", bg: C.peri, reveals: [1.2, 3.3, 4.8, 7.8],
    content: (
      <>
        <At x={0} y={840} w={W}>
          <div style={{ display: "flex", gap: 20 }}>
            <IconTile icon="scroll" label="يترك يهوديته" at={1.2} />
            <IconTile icon="question" label="ما الشاهد؟" at={3.3} />
            <IconTile icon="book" label="الحديث الصحيح" at={4.8} />
          </div>
        </At>
        <At x={0} y={1230} w={W}>
          <Pop at={7.8} from={1.5}>
            <div style={{ fontFamily: lalezar, fontSize: 118, color: C.yellow, WebkitTextStroke: "8px #1b1b2a", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.35)", textAlign: "center" }}>حديث عجيب جدّاً</div>
          </Pop>
        </At>
      </>
    ),
  },
  {
    from: 60, to: 79, layout: "card", bg: C.indigo, reveals: [6.3, 12, 13],
    content: (
      <>
        <At x={0} y={770} w={W}>
          <Pop at={6.3} from={0.8}>
            <div style={{ width: 940, background: "#fff", border: "6px solid #e0bb62", borderRadius: 36, padding: "26px 34px", textAlign: "center", boxShadow: "0 14px 40px rgba(0,0,0,.5)" }}>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: "#8a6a1a" }}>نصّ الحديث</div>
              <div style={{ fontFamily: amiri, fontWeight: 700, fontSize: 56, lineHeight: 1.7, color: C.ink }}>«اللَّهُمَّ رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ ... أَنَا شَهِيدٌ أَنَّ الْعِبَادَ كُلَّهُمْ إِخْوَةٌ»</div>
            </div>
          </Pop>
        </At>
        <At x={0} y={1120} w={W}>
          <Slam at={12} dur={Math.round(8 * P_FPS)} />
        </At>
        <At x={0} y={1390} w={W}>
          <IsnadChain at={13} />
        </At>
        <At x={0} y={1590} w={W}>
          <Pop at={13.5}>
            <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 26, color: "rgba(255,255,255,.7)" }}>تمثيل توضيحي لسلسلة الإسناد</div>
          </Pop>
        </At>
      </>
    ),
  },
  {
    from: 79, to: 96, layout: "fs", bg: C.teal2, reveals: [3, 3.5, 4.2, 6.9],
    content: (
      <>
        <At x={0} y={110} w={W}>
          <div style={{ display: "flex", gap: 16 }}>
            <PillW at={3} size={44}>مؤمنون</PillW>
            <PillW at={3.5} size={44}>كافرون</PillW>
            <PillW at={4.2} size={44}>أعداء</PillW>
          </div>
        </At>
        <At x={0} y={250} w={W}>
          <PillW at={6.9} size={50} bg={C.yellow}>«أنا شهيد»</PillW>
        </At>
      </>
    ),
  },
  {
    from: 96, to: 100.6, layout: "card", bg: C.peri, reveals: [0.5],
    content: (
      <At x={0} y={850} w={W}>
        <Pop at={0.5} from={1.5}>
            <div style={{ fontFamily: lalezar, fontSize: 118, color: C.yellow, WebkitTextStroke: "8px #1b1b2a", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.35)", textAlign: "center" }}>حديث عجيب جدّاً</div>
          </Pop>
      </At>
    ),
  },
  {
    from: 100.6, to: 107.5, layout: "card", bg: C.peri, reveals: [0.2, 2.2, 2.6, 3, 3.4],
    content: (
      <>
        <At x={0} y={800} w={W}>
          <Pop at={0.2} from={1.5}>
            <div style={{ fontFamily: lalezar, fontSize: 118, color: "#fff", WebkitTextStroke: "8px #1b1b2a", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.35)", textAlign: "center" }}>لأنه يناسب ...</div>
          </Pop>
        </At>
        <At x={0} y={1010} w={W}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Photo src="people/azharMosque.jpg" w={440} h={420} at={2.2} rot={-1.5} />
            <PillW at={3} size={80} bg={C.yellow}>=</PillW>
            <Photo src="people/markCathedral.jpg" w={440} h={420} at={3.4} rot={1.5} />
          </div>
        </At>
        <At x={0} y={1500} w={W}>
          <PillW at={2.6} bg={C.ink} color="#fff">«الدين الإبراهيمي»</PillW>
        </At>
      </>
    ),
  },
  {
    from: 107.5, to: 119, layout: "broll", bg: C.plum, reveals: [0.2, 1.7, 4.2, 5.2, 6.4, 8.8, 10.5],
    content: (
      <>
        <At x={0} y={110} w={W}>
          <PillW at={0.2} size={56}>ويناسب معانقاتك الكثيرة</PillW>
        </At>
        <At x={0} y={300} w={W}>
          <Photo src="people/popeTayeb2.jpg" w={940} h={600} at={1.7} rot={-1.5} />
        </At>
        <At x={0} y={940} w={W}>
          <div style={{ display: "flex", gap: 26 }}>
            <Photo src="people/popeTayeb1.jpg" w={456} h={330} at={4.2} rot={1.5} />
            <Photo src="people/popeTayeb6.jpg" w={456} h={330} at={5.2} rot={-1.5} />
          </div>
        </At>
        <At x={0} y={1290} w={W}>
          <PillW at={4.2} size={46}>الباباوات</PillW>
        </At>
        <At x={110} y={1380} w={360}>
          <Photo src="people/sisi.jpg" w={300} h={200} at={8.8} rot={2} />
        </At>
        <At x={110} y={1590} w={360}>
          <PillW at={9} size={38} bg={C.yellow}>السيسي</PillW>
        </At>
        <At x={610} y={1380} w={360}>
          <Photo src="people/tawadros.jpg" w={300} h={200} at={6.4} rot={-2} />
        </At>
        <At x={610} y={1590} w={360}>
          <PillW at={6.6} size={38}>الأقباط</PillW>
        </At>
        <At x={0} y={1795} w={W}>
          <PillW at={10.5} bg={C.red} color="#fff" size={38}>🔔 اشترك في القناة</PillW>
        </At>
      </>
    ),
  },
];

const captions: { from: number; to: number; text: string }[] = [
  { from: 3, to: 5, text: "السلام عليكم" },
  { from: 5.2, to: 13.8, text: "ما الذي قيل؟" },
  { from: 15, to: 19.5, text: "«ما عندي مشكلة إذا المسلم تنصّر»" },
  { from: 21.5, to: 29.5, text: "هل تفهم أنك لست ضدّ من يتحوّل إلى المسيحية؟" },
  { from: 30, to: 34.2, text: "«لست ضدّ ... ولكن ضدّ نشر مذهب»" },
  { from: 34.3, to: 37.2, text: "أتحدث عن الشيعة وأيضاً عن الدين المسيحي" },
  { from: 37.3, to: 40.2, text: "هل لديك مشكلة لو أحدٌ غيّر دينه؟" },
  { from: 41.6, to: 44.8, text: "«لا أؤمن بالردّة ولا أؤمن بهذا الكلام»" },
  { from: 45.7, to: 51, text: "ولا أرضى أن يترك اليهودي يهوديته" },
  { from: 51.3, to: 54.5, text: "ما الشاهد؟ الحديث النبوي الصحيح" },
  { from: 54.7, to: 57.5, text: "وهذا حديث عجيب جدّاً" },
  { from: 62.1, to: 66.8, text: "النبي صلى الله عليه وسلم كان يقول عقب صلاته" },
  { from: 67.1, to: 71.9, text: "«اللهم ربنا ورب كل شيء أنا شهيد»" },
  { from: 72.1, to: 78, text: "النبي صلى الله عليه وسلم يقول: أنا شهيد أن العباد كلهم إخوة" },
  { from: 81, to: 84.5, text: "العباد سواء كانوا مؤمنين كافرين أعداء" },
  { from: 85.5, to: 88.5, text: "«أنا شهيد» كرسول أرسلتني" },
  { from: 90, to: 94.5, text: "«أنا شهيد أن ما بين العباد الأخوّة»" },
  { from: 96, to: 100.5, text: "هذا حديث عجيب جدّاً" },
  { from: 100.8, to: 104, text: "لأنه يناسب الدين الإبراهيمي" },
  { from: 107.7, to: 112.5, text: "ولأنه يناسب معانقاتك الكثيرة مع الباباوات" },
  { from: 113.9, to: 115, text: "والأقباط" },
  { from: 115, to: 118.5, text: "اللي أنت والسيسي بتنرعبوا منهم" },
];

// ---------- speaker rect animation ----------
type Rect = { x: number; y: number; w: number; h: number; r: number; o: number };
const rectFor = (l: Layout): Rect => (l === "fs" ? { x: 0, y: 0, w: W, h: H, r: 0, o: 1 } : l === "card" ? { x: 130, y: 110, w: 820, h: 640, r: 48, o: 1 } : { x: 130, y: 110, w: 820, h: 640, r: 48, o: 0 });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const SFX = [
  ...beats.map((b) => ({ src: "sfx/whoosh.wav", at: b.from, vol: SFX_LEVELS.whoosh })),
  ...beats.flatMap((b) => (SFX_LEVELS.pop > 0 ? b.reveals : []).map((r) => ({ src: "sfx/pop.wav", at: b.from + r, vol: SFX_LEVELS.pop }))),
  { src: "sfx/chime.wav", at: 64, vol: SFX_LEVELS.chime },
];

const Speaker: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / P_FPS;
  let i = beats.findIndex((b) => t >= b.from && t < b.to);
  if (i < 0) i = beats.length - 1;
  const cur = rectFor(beats[i].layout);
  const prev = i > 0 ? rectFor(beats[i - 1].layout) : cur;
  const p = Easing.out(Easing.cubic)(interpolate(f - Math.round(beats[i].from * P_FPS), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const r = { x: lerp(prev.x, cur.x, p), y: lerp(prev.y, cur.y, p), w: lerp(prev.w, cur.w, p), h: lerp(prev.h, cur.h, p), r: lerp(prev.r, cur.r, p), o: lerp(prev.o, cur.o, p) };
  const fs = beats[i].layout === "fs";
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r, overflow: "hidden", opacity: r.o, boxShadow: r.r > 0 ? "0 16px 44px rgba(0,0,0,.5)" : undefined, border: r.r > 0 ? "6px solid #fff" : undefined }}>
      <OffthreadVideo src={staticFile("ref_test_120s.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: fs ? "40% 50%" : "25% 30%", filter: "brightness(1.03) contrast(1.06) saturate(1.05)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)", opacity: fs ? 1 : 0 }} />
    </div>
  );
};

const Caption: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps: P_FPS, config: { damping: 16, stiffness: 190 } });
  const out = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 170, display: "flex", justifyContent: "center", opacity: out * Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ background: "rgba(10,10,14,.72)", color: "#fff", fontFamily: cairo, fontWeight: 800, fontSize: 46, lineHeight: 1.4, padding: "12px 34px", borderRadius: 30, textAlign: "center", maxWidth: 980, border: "2px solid rgba(255,255,255,.18)" }}>{text}</div>
    </div>
  );
};

const CoverArt: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, #5a63d6, #3a4fb0 55%, #7b4a9e 100%)", direction: "rtl", fontFamily: cairo, overflow: "hidden" }}>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.14) 2px, transparent 2px)", backgroundSize: "36px 36px", opacity: 0.6 }} />
    <At x={0} y={70} w={W}>
      <div style={{ fontFamily: lalezar, fontSize: 190, lineHeight: 1.05, textAlign: "center", color: C.yellow, WebkitTextStroke: "14px #101115", paintOrder: "stroke fill", textShadow: "0 14px 0 rgba(0,0,0,.4)" }}>أحمد الطيب<br />والردّة؟!</div>
    </At>
    <div style={{ position: "absolute", left: 40, right: 40, top: 520, display: "flex", gap: 20 }}>
      {["people/popeTayeb2.jpg", "broll/ahmed_el_tayeb.jpg", "people/tawadros.jpg", "people/sisi.jpg"].map((src) => (
        <div key={src} style={{ flex: 1, height: 270, borderRadius: 28, overflow: "hidden", border: "6px solid #fff", boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%" }} />
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1000, borderTop: "10px solid #fff", borderRadius: "60px 60px 0 0", overflow: "hidden", boxShadow: "0 -20px 60px rgba(0,0,0,.6)" }}>
      <Img src={staticFile("cover/speaker.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,.65) 100%)" }} />
    </div>
    <At x={0} y={1790} w={W}>
      <div style={{ background: C.red, color: "#fff", fontFamily: cairo, fontWeight: 900, fontSize: 48, padding: "10px 40px", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>من يرضى بالردّة؟ شاهد الحقيقة</div>
    </At>
  </AbsoluteFill>
);

export const RefPortrait: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.indigo, direction: "rtl", fontFamily: cairo }}>
      <Sequence from={-CUT_SECONDS * P_FPS} layout="none">
      {beats.map((b, i) => {
        const dur = Math.round((b.to - b.from) * P_FPS) + TAIL;
        return (
          <Sequence key={`bg${i}`} from={Math.round(b.from * P_FPS)} durationInFrames={dur} layout="none">
            <BgFade dur={dur}>
              <GridBG color={b.bg} />
            </BgFade>
          </Sequence>
        );
      })}
      <Speaker />
      {beats.map((b, i) => {
        const dur = Math.round((b.to - b.from) * P_FPS) + TAIL;
        return (
          <Sequence key={`c${i}`} from={Math.round(b.from * P_FPS)} durationInFrames={dur} layout="none">
            <AbsoluteFill>{b.content}</AbsoluteFill>
          </Sequence>
        );
      })}
      {captions.map((c, i) => (
        <Sequence key={`cap${i}`} from={Math.round(c.from * P_FPS)} durationInFrames={Math.round((c.to - c.from) * P_FPS)} layout="none">
          <Caption text={c.text} dur={Math.round((c.to - c.from) * P_FPS)} />
        </Sequence>
      ))}
      {SFX.map((x, i) => (
        <Sequence key={`s${i}`} from={Math.round(x.at * P_FPS)} durationInFrames={P_FPS * 2} layout="none">
          <Audio src={staticFile(x.src)} volume={x.vol} />
        </Sequence>
      ))}
      </Sequence>
      <Sequence  durationInFrames={COVER_FRAMES} layout="none">
        <CoverArt />
      </Sequence>
    </AbsoluteFill>
  );
};

const BgFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

void random;
