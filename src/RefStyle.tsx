import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar";
import { cairo } from "./Scenes";

/**
 * "Reference style" test (first minute) — modelled on the analysed channel's look:
 * paper / cut-out look, red + mustard + teal, big kinetic Arabic type, concrete-and-caution-tape frames for real footage,
 * yellow lower thirds, fast cuts. Two layouts: "split" (default) and "alternate" (full-screen speaker <-> full-screen B-roll).
 */
export const { fontFamily: lalezar } = loadLalezar("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const REF_FPS = 30;
export const REF_SECONDS = 60;
export const REF_FRAMES = REF_FPS * REF_SECONDS;

const R = { red: "#d02a1c", yellow: "#f4c400", teal: "#63c6c0", ink: "#1b1b1b", paper: "#efece5", cream: "#f6f1e6" };
const PAD = 24;
const PANEL_H = 1080 - PAD * 2;
const SPEAKER_W = 868;
const BROLL_W = 1920 - SPEAKER_W - PAD * 3;
const TAIL = 8;

const usePop = (at: number, damping = 10) => {
  const f = useCurrentFrame();
  return spring({ frame: f - Math.round(at * REF_FPS), fps: REF_FPS, config: { damping, stiffness: 170, mass: 0.7 } });
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 0.5 }) => {
  const p = usePop(at);
  return (
    <div style={{ opacity: Math.min(1, p * 2.2), transform: `scale(${from + (1 - from) * p}) rotate(${(1 - p) * -5}deg)`, ...style }}>{children}</div>
  );
};

const Kin: React.FC<{ children: React.ReactNode; at?: number; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, at = 0.1, color = R.red, size = 140, style }) => (
  <Pop at={at} from={1.5} style={style}>
    <div style={{ fontFamily: lalezar, fontSize: size, lineHeight: 1.1, color, textAlign: "center", WebkitTextStroke: `10px ${R.cream}`, paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(0,0,0,0.2)", letterSpacing: 2 }}>{children}</div>
  </Pop>
);

const Ribbon: React.FC<{ children: React.ReactNode; at: number; color?: string; textColor?: string; size?: number; rot?: number }> = ({ children, at, color = R.teal, textColor = R.ink, size = 44, rot = -2 }) => (
  <Pop at={at} style={{ transform: undefined }}>
    <div style={{ transform: `rotate(${rot}deg)`, background: color, color: textColor, fontFamily: lalezar, fontSize: size, padding: "8px 34px", clipPath: "polygon(0 8%, 4% 0, 12% 6%, 24% 0, 40% 5%, 58% 0, 76% 6%, 92% 0, 100% 8%, 97% 50%, 100% 92%, 90% 100%, 70% 94%, 50% 100%, 30% 94%, 12% 100%, 2% 92%, 4% 50%)", textAlign: "center", boxShadow: "0 8px 0 rgba(0,0,0,.18)" }}>{children}</div>
  </Pop>
);

const Tape: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", width: 360, height: 38, background: `repeating-linear-gradient(45deg, ${R.yellow} 0 22px, ${R.ink} 22px 44px)`, boxShadow: "0 4px 10px rgba(0,0,0,.5)", ...style }} />
);

const noiseUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}")`;

const Paper: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #fbf9f4, ${R.paper} 60%, #d9d4c9)` }}>
      <AbsoluteFill style={{ backgroundImage: noiseUri, opacity: 0.18 }} />
      {Array.from({ length: 26 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: `${random(`x${i}`) * 100}%`, top: `${(random(`y${i}`) * 100 + f * (0.04 + random(`s${i}`) * 0.05)) % 100}%`, width: 4 + random(`w${i}`) * 5, height: 4 + random(`w${i}`) * 5, borderRadius: "50%", background: "rgba(0,0,0,.35)" }} />
      ))}
    </AbsoluteFill>
  );
};

const Concrete: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #4a4a4a, #262626 80%)" }}>
    <AbsoluteFill style={{ backgroundImage: noiseUri, opacity: 0.35 }} />
  </AbsoluteFill>
);

const Framed: React.FC<{ src: string; at: number; w: number; h: number; crop?: string; rot?: number; tape?: boolean }> = ({ src, at, w, h, crop, rot = 0, tape = true }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 200], [1, 1.1], { extrapolateRight: "clamp" });
  return (
    <Pop at={at} from={0.8} style={{ position: "relative" }}>
      <div style={{ width: w, height: h, borderRadius: 26, overflow: "hidden", transform: `rotate(${rot}deg)`, boxShadow: "0 16px 40px rgba(0,0,0,.55)", border: `6px solid ${R.cream}` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, ...({ objectViewBox: crop ? `inset(${crop})` : undefined } as React.CSSProperties) }} />
      </div>
      {tape && <Tape style={{ top: 24, left: -90, transform: "rotate(-40deg)", width: 260 }} />}
    </Pop>
  );
};

type RefScene = { from: number; to: number; bg: "paper" | "concrete"; reveals: number[]; node: React.ReactNode };

const Stack: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 26 }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, padding: "60px 40px 140px" }}>{children}</AbsoluteFill>
);

const Chip: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Pop at={at}>
    <div style={{ background: R.cream, border: `5px solid ${R.ink}`, borderRadius: 18, padding: "8px 28px", fontFamily: lalezar, fontSize: 42, color: R.ink, boxShadow: "0 7px 0 rgba(0,0,0,.25)" }}>{children}</div>
  </Pop>
);

const Stamp: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const p = usePop(at, 8);
  return (
    <div style={{ transform: `scale(${2.4 - 1.4 * Math.min(p, 1.05)}) rotate(-8deg)`, opacity: Math.min(1, p * 3), border: `12px solid ${R.red}`, borderRadius: 18, padding: "6px 44px", fontFamily: lalezar, fontSize: 110, color: R.red, background: "rgba(246,241,230,.9)", boxShadow: "0 0 0 6px rgba(246,241,230,.9)", textAlign: "center" }}>{children}</div>
  );
};

const Bubble: React.FC<{ at: number; fill: string; color: string; label: string; children: React.ReactNode; rot?: number }> = ({ at, fill, color, label, children, rot = 0 }) => (
  <Pop at={at} from={0.7}>
    <div style={{ width: 780, background: fill, color, border: `6px solid ${R.ink}`, borderRadius: 34, padding: "22px 36px", boxShadow: "0 10px 0 rgba(0,0,0,.25)", transform: `rotate(${rot}deg)` }}>
      <div style={{ fontFamily: lalezar, fontSize: 36, opacity: 0.8 }}>{label}</div>
      <div style={{ fontFamily: lalezar, fontSize: 50, lineHeight: 1.35 }}>{children}</div>
    </div>
  </Pop>
);

const scenes: RefScene[] = [
  {
    from: 0, to: 11, bg: "concrete", reveals: [0.2, 1, 3],
    node: (
      <Stack>
        <Kin at={0.2} color={R.yellow} size={140}>ما الذي قيل؟</Kin>
        <Framed src="broll/ahmed_el_tayeb.jpg" at={1} w={600} h={520} rot={-2} />
        <Ribbon at={3} color={R.yellow}>أحمد الطيب والردّة</Ribbon>
      </Stack>
    ),
  },
  {
    from: 11, to: 21, bg: "paper", reveals: [0.3, 1.5, 5, 8],
    node: (
      <Stack gap={14}>
        <Pop at={0.3} from={1.6}>
          <div style={{ fontFamily: lalezar, fontSize: 260, lineHeight: 0.7, color: R.red, WebkitTextStroke: `8px ${R.cream}`, paintOrder: "stroke fill" }}>“</div>
        </Pop>
        <Kin at={1.5} size={96}>ما عندي مشكلة إذا المسلم تنصّر</Kin>
        <Ribbon at={5} color={R.teal}>العبارة محلّ النقاش كما نُقلت</Ribbon>
        <Chip at={8}>«أبداً ما عندي مشكلة»</Chip>
      </Stack>
    ),
  },
  {
    from: 21, to: 33, bg: "paper", reveals: [0.4, 8],
    node: (
      <Stack gap={34}>
        <Bubble at={0.4} fill={R.cream} color={R.ink} label="السؤال" rot={-1.5}>هل تفهم أنك لست ضدّ من يريد أن يتحوّل من الإسلام إلى المسيحية؟</Bubble>
        <Bubble at={8} fill={R.red} color={R.cream} label="الجواب" rot={1.5}>لستُ ضدّ ... ولكن ضدّ نشر مذهب</Bubble>
      </Stack>
    ),
  },
  {
    from: 33, to: 41, bg: "paper", reveals: [0.3, 1.8, 3.4, 5.5],
    node: (
      <Stack gap={24}>
        <Kin at={0.3} size={130} color={R.teal}>نشر المذاهب</Kin>
        <div style={{ display: "flex", gap: 20 }}>
          <Chip at={1.8}>الشيعة</Chip>
          <Chip at={3.4}>الدين المسيحي</Chip>
        </div>
        <Ribbon at={5.5} color={R.yellow}>هل لديك مشكلة لو أحدٌ غيّر دينه؟</Ribbon>
      </Stack>
    ),
  },
  {
    from: 41, to: 48, bg: "concrete", reveals: [0.4, 3.2],
    node: (
      <Stack gap={40}>
        <Stamp at={0.4}>لا أؤمن بالردّة</Stamp>
        <Ribbon at={3.2} color={R.yellow}>ولا أؤمن بهذا الكلام</Ribbon>
      </Stack>
    ),
  },
  {
    from: 48, to: 61, bg: "paper", reveals: [0.4, 3.2, 5.5, 8.5],
    node: (
      <Stack gap={26}>
        <Ribbon at={0.4} color={R.red} textColor={R.cream} size={46}>ولا أرضى أن يترك اليهودي يهوديته</Ribbon>
        <Kin at={3.2} size={150}>ما الشاهد؟</Kin>
        <Ribbon at={5.5} color={R.teal}>الحديث النبوي الصحيح</Ribbon>
        <Ribbon at={8.5} color={R.ink} textColor={R.yellow} size={50}>«وهذا حديث عجيب جدّاً»</Ribbon>
      </Stack>
    ),
  },
];

const SceneFx: React.FC<{ index: number; dur: number; children: React.ReactNode; bg: "paper" | "concrete"; scale: number }> = ({ index, dur, children, bg, scale }) => {
  const f = useCurrentFrame();
  const enter = spring({ frame: f, fps: REF_FPS, config: { damping: 16, stiffness: 200 }, durationInFrames: 14 });
  const exit = interpolate(f, [dur - TAIL, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = index % 3;
  const tx = v === 0 ? (1 - enter) * 300 : v === 1 ? 0 : (1 - enter) * -300;
  const ty = v === 1 ? (1 - enter) * 200 : 0;
  const zoom = interpolate(f, [0, dur], [1, 1.06]);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, enter * 1.5) * (1 - exit), transform: `translate(${tx}px, ${ty}px)` }}>
      {bg === "paper" ? <Paper /> : <Concrete />}
      <AbsoluteFill style={{ transform: `scale(${zoom * scale})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const BrollLayer: React.FC<{ scale: number }> = ({ scale }) => (
  <AbsoluteFill>
    {scenes.map((s, i) => {
      const dur = Math.round((s.to - s.from) * REF_FPS) + TAIL;
      return (
        <Sequence key={i} from={Math.round(s.from * REF_FPS)} durationInFrames={dur} layout="none">
          <SceneFx index={i} dur={dur} bg={s.bg} scale={scale}>
            {s.node}
          </SceneFx>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

const YellowLowerThird: React.FC<{ title: string; sub?: string; dur: number; name?: boolean }> = ({ title, sub, dur, name }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f, fps: REF_FPS, config: { damping: 14, stiffness: 160 } });
  const out = interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: 20, right: 20, bottom: 36, textAlign: "center", opacity: out * Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ fontFamily: lalezar, fontSize: name ? 60 : 56, color: name ? R.cream : R.yellow, textShadow: "0 4px 0 rgba(0,0,0,.85), 0 0 18px rgba(0,0,0,.9)", WebkitTextStroke: "2px rgba(0,0,0,.7)", paintOrder: "stroke fill" }}>{title}</div>
      {sub && <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 28, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.95)" }}>{sub}</div>}
    </div>
  );
};

const firstMinuteLT: { from: number; to: number; title: string; sub?: string; name?: boolean }[] = [
  { from: 3, to: 10, title: "أحمد الطيب والردّة", sub: "موضوع الحلقة" },
  { from: 12, to: 20, title: "«ما عندي مشكلة إذا المسلم تنصّر»", sub: "العبارة محلّ النقاش" },
  { from: 30, to: 36, title: "«ولكن أنا ضدّ نشر مذهب»" },
  { from: 42, to: 47, title: "«لا أؤمن بالردّة»" },
  { from: 52, to: 59, title: "ما الشاهد من الحديث الصحيح؟" },
];

type Mode = "split" | "alternate";
/** Alternate mode: seconds when the speaker is shown full-screen. */
const SPEAKER_FULL: [number, number][] = [[0, 4], [26, 30], [41, 45], [56, 60]];

const SFX = [
  ...scenes.map((s) => ({ src: "sfx/whoosh.wav", at: s.from, vol: 0.16 })),
  ...scenes.flatMap((s) => s.reveals.map((r) => ({ src: "sfx/pop.wav", at: s.from + r, vol: 0.11 }))),
  ...firstMinuteLT.map((l) => ({ src: "sfx/chime.wav", at: l.from, vol: 0.1 })),
];

const Speaker: React.FC<{ full: boolean }> = ({ full }) => (
  <>
    <OffthreadVideo
      src={staticFile("ref_test_60s.mp4")}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: full ? "50% 50%" : "40% 50%", filter: "brightness(1.02) contrast(1.06) saturate(1.05)" }}
    />
    <AbsoluteFill style={{ mixBlendMode: "multiply", background: "radial-gradient(ellipse at 52% 48%, rgba(255,255,255,1) 50%, rgb(205,198,188) 100%)" }} />
    <AbsoluteFill style={{ mixBlendMode: "soft-light", background: "radial-gradient(ellipse at 50% 38%, rgba(255,214,160,0.25), rgba(255,214,160,0) 55%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
  </>
);

export const RefComposition: React.FC<{ mode: Mode }> = ({ mode }) => {
  const f = useCurrentFrame();
  const t = f / REF_FPS;
  // 0 = b-roll visible, 1 = speaker full-screen (alternate mode only)
  const full =
    mode === "alternate"
      ? Math.max(0, ...SPEAKER_FULL.map(([a, b]) => interpolate(t, [a, a + 0.25, b - 0.25, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))
      : 0;

  return (
    <AbsoluteFill style={{ background: R.paper, direction: "rtl", fontFamily: cairo }}>
      {mode === "split" ? (
        <>
          <div style={{ position: "absolute", left: PAD, top: PAD, width: BROLL_W, height: PANEL_H, borderRadius: 32, overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.35)" }}>
            <BrollLayer scale={1} />
          </div>
          <div style={{ position: "absolute", right: PAD, top: PAD, width: SPEAKER_W, height: PANEL_H, borderRadius: 32, overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.45)", border: `5px solid ${R.cream}`, background: "#000" }}>
            <Speaker full={false} />
            {firstMinuteLT.map((l, i) => (
              <Sequence key={i} from={Math.round(l.from * REF_FPS)} durationInFrames={Math.round((l.to - l.from) * REF_FPS)} layout="none">
                <YellowLowerThird title={l.title} sub={l.sub} dur={Math.round((l.to - l.from) * REF_FPS)} name={l.name} />
              </Sequence>
            ))}
          </div>
        </>
      ) : (
        <>
          <AbsoluteFill style={{ opacity: 1 - full }}>
            <BrollLayer scale={1.35} />
          </AbsoluteFill>
          <AbsoluteFill style={{ opacity: full, transform: `scale(${1 + (1 - full) * 0.06})` }}>
            <Speaker full />
          </AbsoluteFill>
          {firstMinuteLT.map((l, i) => (
            <Sequence key={i} from={Math.round(l.from * REF_FPS)} durationInFrames={Math.round((l.to - l.from) * REF_FPS)} layout="none">
              <YellowLowerThird title={l.title} sub={l.sub} dur={Math.round((l.to - l.from) * REF_FPS)} name={l.name} />
            </Sequence>
          ))}
        </>
      )}
      {SFX.map((x, i) => (
        <Sequence key={i} from={Math.round(x.at * REF_FPS)} durationInFrames={REF_FPS * 2} layout="none">
          <Audio src={staticFile(x.src)} volume={x.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const RefSplit: React.FC = () => <RefComposition mode="split" />;
export const RefAlternate: React.FC = () => <RefComposition mode="alternate" />;
