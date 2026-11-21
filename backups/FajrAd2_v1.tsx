import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";
import wordsData from "../public/ad2/words.json";
import { SFX_LEVELS, WHOOSH_EVERY } from "./sfxConfig";

const { fontFamily } = loadFont("normal", { weights: ["600", "700", "800", "900"], subsets: ["arabic"], ignoreTooManyRequestsWarning: true });

export const FAJR2_FPS = 30;
export const FAJR2_FRAMES = 1800; // 60 s

// palette taken from the app screenshots (mint paper, deep green, amber)
const C = { paper: "#eaf3e6", mint: "#d7e9d4", green: "#1f5a43", deep: "#14412f", sage: "#718767", gold: "#d4a257", amber: "#b8731e", red: "#c93f2f", cream: "#fbf7ea", ink: "#16281f" };

const W = wordsData as { w: string; s: number; e: number }[];
const at = (i: number) => W[i].s; // word index -> seconds on the final timeline (all captions start when the word is spoken)

const f = (s: number) => Math.round(s * FAJR2_FPS);
const EMOJI = "'Segoe UI Emoji','Noto Color Emoji'";

/* ───────── helpers ───────── */
const useIn = (sec: number, damping = 13) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - f(sec), fps, config: { damping, stiffness: 150, mass: 0.7 } });
};

/** element that pops in at `sec` (scene-local seconds are NOT used: sec is absolute, the scene passes `from`). */
const Pop: React.FC<{ sec: number; from: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number }> = ({ sec, from, children, style, dy = 50 }) => {
  const frame = useCurrentFrame(); // local to Sequence
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - f(sec - from), fps, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  return (
    <div style={{ opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * dy}px) scale(${0.85 + 0.15 * p})`, ...style }}>{children}</div>
  );
};

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; stroke?: string; style?: React.CSSProperties }> = ({ children, size = 110, color = "#fff", stroke = C.deep, style }) => (
  <div style={{ fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.15, color, textAlign: "center", direction: "rtl", paintOrder: "stroke fill", WebkitTextStroke: `${Math.round(size / 9)}px ${stroke}`, textShadow: "0 8px 24px rgba(0,0,0,.35)", ...style }}>
    {children}
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.green, color = "#fff", size = 62, style }) => (
  <div style={{ fontFamily, fontWeight: 800, fontSize: size, direction: "rtl", background: bg, color, padding: "14px 40px", borderRadius: 999, boxShadow: "0 10px 30px rgba(0,0,0,.25)", border: `4px solid ${C.cream}`, ...style }}>{children}</div>
);

const Clip: React.FC<{ name: string; frames: number; zoom?: [number, number]; drift?: number }> = ({ name, frames, zoom = [1.04, 1.14], drift = 30 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = frame / Math.max(1, durationInFrames);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom[0] + (zoom[1] - zoom[0]) * k}) translateX(${(k - 0.5) * drift}px)` }}>
      <Loop durationInFrames={frames}>
        <OffthreadVideo src={staticFile(`ad2/clips/${name}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Loop>
    </AbsoluteFill>
  );
};

const Shade: React.FC<{ top?: number; bottom?: number }> = ({ top = 0.15, bottom = 0.55 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(31,90,67,${top}) 0%, rgba(31,90,67,0) 30%, rgba(31,90,67,0) 55%, rgba(31,90,67,${bottom}) 100%)` }} />
);

/** light mint background with a faint 8-point star pattern (Islamic motif, no dark colours) */
const PaperBG: React.FC<{ tone?: string }> = ({ tone = C.paper }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 20%, ${C.cream} 0%, ${tone} 55%, ${C.mint} 100%)` }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.1, transform: `translateY(${(frame * 0.3) % 120}px)` }}>
        <defs>
          <pattern id="st" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M60 8 L72 36 L102 28 L88 56 L112 76 L82 82 L78 112 L60 92 L42 112 L38 82 L8 76 L32 56 L18 28 L48 36 Z" fill="none" stroke={C.green} strokeWidth="2" />
          </pattern>
        </defs>
        <rect y={-120} width="1080" height="2160" fill="url(#st)" />
      </svg>
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ src: string; width?: number; style?: React.CSSProperties }> = ({ src, width = 560, style }) => (
  <div style={{ width, height: width * (1280 / 658) + 24, borderRadius: 64, background: C.cream, padding: 12, boxShadow: "0 30px 70px rgba(20,65,47,.45)", border: `6px solid ${C.green}`, ...style }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", borderRadius: 50, objectFit: "cover" }} />
  </div>
);

const AppIcon: React.FC<{ size?: number }> = ({ size = 220 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: `linear-gradient(145deg, ${C.green}, ${C.deep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px rgba(20,65,47,.5)", border: `${size * 0.03}px solid ${C.gold}` }}>
    <div style={{ fontFamily, fontWeight: 900, fontSize: size * 0.56, color: C.cream, lineHeight: 1 }}>فجر</div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.cream, borderRadius: 40, border: `5px solid ${C.green}`, boxShadow: "0 24px 60px rgba(20,65,47,.35)", overflow: "hidden", ...style }}>{children}</div>
);

const CardClip: React.FC<{ name: string; frames: number; w: number; h: number; style?: React.CSSProperties }> = ({ name, frames, w, h, style }) => (
  <Card style={{ width: w, height: h, position: "relative", ...style }}>
    <Clip name={name} frames={frames} zoom={[1.0, 1.1]} />
  </Card>
);

const Check: React.FC<{ size?: number; sec: number; from: number }> = ({ size = 220, sec, from }) => (
  <Pop sec={sec} from={from} dy={0}>
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#2e9b62", border: `${size * 0.06}px solid ${C.cream}`, boxShadow: "0 16px 40px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
    </div>
  </Pop>
);

/* ───────── scenes ───────── */
type SceneDef = { from: number; to: number; render: (from: number, dur: number) => React.ReactNode };

const col: React.CSSProperties = { position: "absolute", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 };

const SCENES: SceneDef[] = [
  // 1) biggest problem: alarm clock
  { from: 0, to: at(9) - 0.1, render: (s) => (
    <>
      <Clip name="alarm_v2" frames={135} zoom={[1.05, 1.2]} /><Shade top={0.35} bottom={0.65} />
      <div style={{ ...col, top: 300 }}>
        <Pop sec={0.05} from={s}><Pill bg={C.red} size={58}>أكبر مشكلة</Pill></Pop>
        <Pop sec={at(2)} from={s}><Big size={120}>تضيّع عليك</Big></Pop>
        <Pop sec={at(4)} from={s}><Big size={170} color={C.gold} style={{ marginTop: 10 }}>صلاة الفجر</Big></Pop>
      </div>
    </>
  ) },
  // 2) wake up, turn off the alarm, go back to sleep
  { from: at(9) - 0.1, to: at(16) - 0.05, render: (s) => (
    <>
      <PaperBG />
      <Pop sec={at(7)} from={s} style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CardClip name="sleep" frames={135} w={900} h={1000} />
      </Pop>
      <div style={{ ...col, top: 1190 }}>
        <Pop sec={at(9)} from={s}><Pill size={70} bg={C.amber}><span style={{ fontFamily: EMOJI }}>⏰</span> تصحى على المنبه</Pill></Pop>
        <Pop sec={at(10)} from={s}><Pill size={70} bg={C.red}>تطفيه</Pill></Pop>
        <Pop sec={at(11)} from={s}><Pill size={70} bg={C.deep}><span style={{ fontFamily: EMOJI }}>😴</span> وترجع تنام</Pill></Pop>
      </div>
    </>
  ) },
  // 3) "I'll get up in five minutes"
  { from: at(16) - 0.05, to: at(21) - 0.1, render: (s) => (
    <>
      <PaperBG tone="#e4efd9" />
      <Pop sec={at(16)} from={s} style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CardClip name="cartoon" frames={150} w={860} h={860} />
      </Pop>
      <div style={{ ...col, top: 1060 }}>
        <Pop sec={at(16)} from={s}><Big size={100} color={C.deep} stroke={C.cream}>بتقول: هقوم</Big></Pop>
        <Pop sec={at(18)} from={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, direction: "rtl" }}>
            <Big size={300} color={C.amber} stroke={C.cream}>٥</Big>
            <Big size={120} color={C.deep} stroke={C.cream}>دقايق</Big>
          </div>
        </Pop>
      </div>
    </>
  ) },
  // 4) suddenly the time passed
  { from: at(21) - 0.1, to: at(27) - 0.1, render: (s) => (
    <>
      <Clip name="clock2" frames={135} zoom={[1.0, 1.15]} /><Shade top={0.3} bottom={0.55} />
      <div style={{ ...col, top: 260 }}>
        <Pop sec={at(21)} from={s}><Pill bg={C.amber} size={70}>وفجأة</Pill></Pop>
        <Pop sec={at(23)} from={s}><Big size={130}>الوقت عدّى</Big></Pop>
      </div>
      <div style={{ ...col, top: 1360 }}>
        <Pop sec={at(25)} from={s}><Big size={140} color={C.gold}>وفاتتك الصلاة</Big></Pop>
      </div>
    </>
  ) },
  // 5) reveal the app
  { from: at(27) - 0.1, to: at(35) - 0.1, render: (s) => (
    <>
      <PaperBG />
      <div style={{ ...col, top: 150 }}>
        <Pop sec={at(29)} from={s}><AppIcon size={230} /></Pop>
        <Pop sec={at(29)} from={s}><Big size={130} color={C.deep} stroke={C.cream}>تطبيق فجر</Big></Pop>
        <Pop sec={at(33)} from={s}><Pill bg={C.gold} color={C.deep} size={66}>طريقة مختلفة</Pill></Pop>
      </div>
      <Pop sec={at(31)} from={s} dy={140} style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Phone src="ad2/shot1.jpg" width={640} />
      </Pop>
    </>
  ) },
  // 6) alarm won't stop until you go to the sink and photograph it
  { from: at(35) - 0.1, to: at(44) - 0.15, render: (s) => (
    <>
      <PaperBG tone="#dfeed9" />
      <div style={{ ...col, top: 120 }}>
        <Pop sec={at(35)} from={s}><Big size={110} color={C.deep} stroke={C.cream}>المنبه مش هيتوقف</Big></Pop>
        <Pop sec={at(38)} from={s}><Big size={80} color={C.amber} stroke={C.cream}>غير لما…</Big></Pop>
      </div>
      <div style={{ ...col, top: 470, gap: 36 }}>
        {[
          { i: at(40), icon: "🛏️", t: "تقوم", c: C.amber },
          { i: at(42), icon: "🚿", t: "تروح للمغسلة", c: C.green },
          { i: at(43), icon: "📸", t: "تصوّرها", c: C.deep },
        ].map((x, n) => (
          <Pop key={n} sec={x.i} from={s} dy={90}>
            <div style={{ display: "flex", alignItems: "center", gap: 36, direction: "rtl", background: C.cream, border: `6px solid ${x.c}`, borderRadius: 60, padding: "26px 56px", width: 900, boxShadow: "0 18px 44px rgba(20,65,47,.3)" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: x.c, color: "#fff", fontFamily, fontWeight: 900, fontSize: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>{n + 1}</div>
              <div style={{ fontFamily: EMOJI, fontSize: 110 }}>{x.icon}</div>
              <div style={{ fontFamily, fontWeight: 900, fontSize: 84, color: C.ink }}>{x.t}</div>
            </div>
          </Pop>
        ))}
      </div>
      <Pop sec={at(44) - 1.2} from={s} dy={0} style={{ position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CardClip name="wash_v2" frames={120} w={620} h={400} />
      </Pop>
    </>
  ) },
  // 7) it checks you reached the ablution place, then stops
  { from: at(44) - 0.15, to: at(52) - 0.1, render: (s) => (
    <>
      <Clip name="wash_v2" frames={120} zoom={[1.0, 1.15]} /><Shade top={0.35} bottom={0.6} />
      <div style={{ ...col, top: 240 }}>
        <Pop sec={at(44)} from={s}><Pill bg={C.green} size={70}>فيتأكد</Pill></Pop>
        <Pop sec={at(45)} from={s}><Big size={96}>أنك وصلت</Big></Pop>
        <Pop sec={at(47)} from={s}><Big size={140} color={C.gold}>مكان الوضوء</Big></Pop>
      </div>
      <div style={{ ...col, top: 1360 }}>
        <Check sec={at(49)} from={s} />
        <Pop sec={at(50)} from={s}><Pill bg={"#2e9b62"} size={78}>وبيتوقف المنبه</Pill></Pop>
      </div>
    </>
  ) },
  // 8) instead of turning it off in bed
  { from: at(52) - 0.1, to: at(65) - 0.2, render: (s) => (
    <>
      <PaperBG tone="#e6f0da" />
      <Pop sec={at(52)} from={s} style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CardClip name="cartoon" frames={150} w={760} h={700} />
      </Pop>
      <div style={{ ...col, top: 860 }}>
        <Pop sec={at(52)} from={s}><Big size={78} color={C.deep} stroke={C.cream}>بدل ما</Big></Pop>
        <Pop sec={at(54)} from={s}>
          <div style={{ position: "relative" }}>
            <Big size={84} color={C.red} stroke={C.cream} style={{ whiteSpace: "nowrap" }}>تطفي المنبه وإنت في السرير</Big>
            <div style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 12, background: C.red, borderRadius: 8, transformOrigin: "right", transform: `scaleX(${Math.min(1, Math.max(0, (useIn(at(58)) )))})` }} />
          </div>
        </Pop>
        <Pop sec={at(60)} from={s} dy={80}><Pill bg={C.green} size={84}>التطبيق يجبرك تقوم</Pill></Pop>
      </div>
      <Pop sec={at(61)} from={s} dy={200} style={{ position: "absolute", bottom: -420, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Phone src="ad2/shot3.jpg" width={520} />
      </Pop>
    </>
  ) },
  // 9) simple step that breaks the habit, start your day with prayer
  { from: at(65) - 0.2, to: at(78) - 0.1, render: (s) => (
    <>
      <Clip name="sun_v2" frames={150} zoom={[1.02, 1.18]} /><Shade top={0.25} bottom={0.55} />
      <div style={{ ...col, top: 250 }}>
        <Pop sec={at(65)} from={s}><Big size={130}>خطوة بسيطة</Big></Pop>
        <Pop sec={at(68)} from={s}><Pill bg={C.red} size={72}>تكسر عادة الرجوع للنوم</Pill></Pop>
      </div>
      <div style={{ ...col, top: 1300 }}>
        <Pop sec={at(72)} from={s}><Pill bg={C.green} size={64}>وتقرّبك من</Pill></Pop>
        <Pop sec={at(75)} from={s}><Big size={110} color={C.gold}>استقبال يومك بالصلاة</Big></Pop>
      </div>
    </>
  ) },
  // 10) works offline, photos stay on the phone
  { from: at(78) - 0.1, to: at(91) - 0.1, render: (s) => (
    <>
      <PaperBG tone="#dcebd6" />
      <Pop sec={at(78)} from={s} style={{ position: "absolute", top: 100, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CardClip name="phone1" frames={120} w={800} h={760} />
      </Pop>
      <div style={{ ...col, top: 930, gap: 30 }}>
        <Pop sec={at(80)} from={s}><Pill bg={C.deep} size={80}><span style={{ fontFamily: EMOJI }}>📴</span> بدون إنترنت</Pill></Pop>
        <Pop sec={at(84)} from={s}><Pill bg={C.green} size={72}><span style={{ fontFamily: EMOJI }}>🛡️</span> صورك لا تغادر جهازك</Pill></Pop>
        <Pop sec={at(88)} from={s}><Pill bg={C.amber} size={72}><span style={{ fontFamily: EMOJI }}>📱</span> تُعالَج داخل هاتفك</Pill></Pop>
      </div>
    </>
  ) },
  // 11) AI verifies you did wudu
  { from: at(91) - 0.1, to: at(98) - 0.1, render: (s) => (
    <>
      <Clip name="wash_v2" frames={120} zoom={[1.05, 1.2]} drift={-40} /><Shade top={0.4} bottom={0.6} />
      <ScanLine from={s} start={at(91)} />
      <div style={{ ...col, top: 250 }}>
        <Pop sec={at(91)} from={s}><Big size={96}><span style={{ fontFamily: EMOJI }}>🤖</span> الذكاء الاصطناعي</Big></Pop>
        <Pop sec={at(93)} from={s}><Pill bg={C.green} size={76}>يتأكد أنك قمت بالوضوء</Pill></Pop>
      </div>
      <div style={{ ...col, top: 1400 }}><Check sec={at(96) + 0.3} from={s} size={200} /></div>
    </>
  ) },
  // 12) download call to action
  { from: at(98) - 0.1, to: at(110) - 0.1, render: (s) => (
    <>
      <Clip name="mosque" frames={150} zoom={[1.02, 1.16]} /><Shade top={0.3} bottom={0.55} />
      <div style={{ ...col, top: 230 }}>
        <Pop sec={at(98)} from={s}><Pill bg={C.gold} color={C.deep} size={84}>حمّل تطبيق</Pill></Pop>
        <Pop sec={at(100)} from={s}><AppIcon size={300} /></Pop>
      </div>
      <div style={{ ...col, top: 1130, gap: 30 }}>
        <Pop sec={at(102)} from={s}><Big size={96}>خلّي منبهك</Big></Pop>
        <Pop sec={at(103)} from={s}><Big size={120} color={C.gold}>بداية للقيام</Big></Pop>
        <Pop sec={at(105)} from={s}>
          <div style={{ position: "relative" }}>
            <Big size={84}>مش فرصة للنوم من جديد</Big>
            <div style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 10, background: C.red, borderRadius: 6 }} />
          </div>
        </Pop>
      </div>
    </>
  ) },
  // 13) tagline
  { from: at(110) - 0.1, to: at(116) - 0.1, render: (s) => (
    <>
      <Clip name="sil_v2" frames={150} zoom={[1.0, 1.12]} /><Shade top={0.2} bottom={0.5} />
      <div style={{ ...col, top: 380 }}>
        <Pop sec={at(110)} from={s}><Big size={260} color={C.gold}>فجر</Big></Pop>
        <Pop sec={at(111)} from={s}><Big size={90}>خطوة تساعدك</Big></Pop>
        <Pop sec={at(113)} from={s}><Big size={110} color={C.cream}>تقوم لصلاة الفجر</Big></Pop>
      </div>
    </>
  ) },
  // 14) Google Play + end card
  { from: at(116) - 0.1, to: 60, render: (s) => (
    <>
      <PaperBG />
      <div style={{ ...col, top: 90 }}>
        <Pop sec={at(116) + 0.3} from={s}><Pill bg={C.deep} size={70}><span style={{ fontFamily: EMOJI }}>▶️</span> ادخل Google Play</Pill></Pop>
        <Pop sec={at(119)} from={s}><Big size={96} color={C.deep} stroke={C.cream}>واكتب «فجر»</Big></Pop>
      </div>
      <Pop sec={at(117)} from={s} dy={160} style={{ position: "absolute", top: 460, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Phone src="ad2/shot2.jpg" width={600} />
      </Pop>
      <div style={{ ...col, top: 1640 }}>
        <Pop sec={at(121)} from={s}><Pill bg={C.green} size={64}>وتأكد إنك تحمّل التطبيق الصح ✔</Pill></Pop>
      </div>
    </>
  ) },
];

const ScanLine: React.FC<{ from: number; start: number }> = ({ from, start }) => {
  const frame = useCurrentFrame();
  const t = ((frame - f(start - from)) % 60) / 60;
  const y = 600 + t * 700;
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: y, height: 8, borderRadius: 8, background: C.gold, boxShadow: `0 0 40px 10px ${C.gold}`, opacity: frame < f(start - from) ? 0 : 0.9 }} />
  );
};

/** cover shown for the first 3 frames (0.10 s) */
const Cover: React.FC = () => (
  <AbsoluteFill>
    <Clip name="mosque" frames={150} zoom={[1.0, 1.0]} /><Shade top={0.4} bottom={0.7} />
    <div style={{ ...col, top: 260 }}>
      <AppIcon size={340} />
      <Big size={170} color={C.gold} style={{ marginTop: 20 }}>تطبيق فجر</Big>
      <Big size={96}>منبه لا يتوقف</Big>
      <Big size={96}>حتى تتوضأ</Big>
    </div>
  </AbsoluteFill>
);

export const FajrAd2: React.FC = () => {
  const { fps } = useVideoConfig();
  const bounds = SCENES.map((s) => [f(s.from), f(s.to)] as const);
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Audio src={staticFile("ad2/voice.mp3")} />
      {SCENES.map((s, i) => {
        const [a, b] = bounds[i];
        const start = i === 0 ? 0 : a - 4; // 4-frame overlap = quick cross-fade
        const dur = b - start + (i === SCENES.length - 1 ? 0 : 0);
        return (
          <Sequence key={i} from={start} durationInFrames={Math.max(1, dur)} layout="none">
            <Fade len={4} first={i === 0}>{s.render(start / fps, dur)}</Fade>
            {i > 0 && i % WHOOSH_EVERY === 0 ? (
              <Sequence from={0} durationInFrames={30}><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} /></Sequence>
            ) : null}
          </Sequence>
        );
      })}
      <Sequence from={0} durationInFrames={3}><Cover /></Sequence>
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ len: number; first: boolean; children: React.ReactNode }> = ({ len, first, children }) => {
  const frame = useCurrentFrame();
  const o = first ? 1 : interpolate(frame, [0, len], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
