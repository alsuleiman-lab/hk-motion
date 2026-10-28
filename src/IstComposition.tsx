import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { amiri, cairo } from "./Scenes";
import { lalezar } from "./RefStyle";
import { TitleBar } from "./TitleBar";
import { SFX_LEVELS, WHOOSH_EVERY } from "./sfxConfig";

/**
 * Landscape (1920x1080) edit of «هل الاستغاثة مجمع على جوازها؟» — built from the user's already-produced video:
 * silences > 0.4 s shortened to ~0.25 s (public/ist_cut.mp4, mapping in public/ist_map.json),
 * layouts alternate between split-screen and full-screen speaker with elements on the edges.
 * Every element appears AFTER the matching word is spoken (word-level Whisper timings, remapped to the cut timeline).
 */
loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const IST_FPS = 30;
export const IST_SECONDS = 43.17;
export const IST_FRAMES = Math.ceil(IST_SECONDS * IST_FPS);
export const COVER_FRAMES = 3;
const W = 1920;
const H = 1080;
const TAIL = 8;
const PAD = 24;

/** Serious palette (user rule): brown, blue and wood tones with geometric ornaments — never pink/feminine colours. Keys keep old names: peach=oak, rose=steel blue, sage=walnut, sand=navy, tan=teak. */
const BG = { peach: "#9a6b3f", rose: "#2f5f94", sage: "#6b4630", sand: "#24456e", tan: "#7a5232" };
const C = { teal: "#2f5f94", indigo: "#7a4b2a", plum: "#24456e", peri: "#6b4630", pink: "#c9a36a", white: "#fff", ink: "#3b2616", yellow: "#e8ae2c", red: "#c93f2f", gold: "#e0bb62" };

/** Source modes (cut timeline). Panel/clip crops are valid only in split mode, wide crops only in wide mode. */
const SPLIT_END = 23.2;
const WIDE_START = 23.55;
void 0;
const CUT_TIMES = [0, 6.67, 8.1, 8.43, 10.93, 13.87, 21.83, 25.7, 28.7, 30.1, 34.27, 39.5, 39.77, 40.03, 41.13];

const fps = IST_FPS;
const sec = (t: number) => Math.round(t * fps);

/** Frame offset of the enclosing beat, so every `at` below is an ABSOLUTE time on the cut timeline. */
const BeatOffset = React.createContext(0);
const useAbsFrame = () => useCurrentFrame() + React.useContext(BeatOffset);
const usePop = (at: number, damping = 12) => {
  const f = useAbsFrame();
  return spring({ frame: f - sec(at), fps, config: { damping, stiffness: 170, mass: 0.7 } });
};
const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 0.6 }) => {
  const p = usePop(at);
  return <div style={{ opacity: Math.min(1, p * 2.2), transform: `scale(${from + (1 - from) * p})`, ...style }}>{children}</div>;
};
const At: React.FC<{ x: number; y: number; w?: number; children: React.ReactNode; center?: boolean }> = ({ x, y, w, children, center = true }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", justifyContent: center ? "center" : "flex-start" }}>{children}</div>
);

/** Islamic geometric ornament (8-point star lattice), drawn in light cream so it works on brown and blue. */
const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='1.6'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/><path d='M0 0 L12 12 M140 0 L128 12 M0 140 L12 128 M140 140 L128 128'/></g></svg>`;
const Dots: React.FC<{ color: string }> = ({ color }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${color}, ${color}e0 60%, ${color}b0)` }}>
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`, backgroundSize: "140px 140px", backgroundPosition: `${f * 0.25}px ${f * 0.15}px`, opacity: 0.22 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(25,15,8,.28) 100%)" }} />
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ children: React.ReactNode; at: number; size?: number; bg?: string; color?: string }> = ({ children, at, size = 54, bg = C.white, color = C.ink }) => (
  <Pop at={at}>
    <div style={{ background: bg, color, fontFamily: cairo, fontWeight: 800, fontSize: size, padding: "10px 38px", borderRadius: 999, boxShadow: "0 8px 22px rgba(0,0,0,.3)", textAlign: "center", lineHeight: 1.35 }}>{children}</div>
  </Pop>
);

const Kin: React.FC<{ children: React.ReactNode; at: number; size?: number; color?: string }> = ({ children, at, size = 110, color = C.yellow }) => (
  <Pop at={at} from={1.5}>
    <div style={{ fontFamily: lalezar, fontSize: size, lineHeight: 1.15, color, textAlign: "center", WebkitTextStroke: "9px #4a2f1d", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.3)" }}>{children}</div>
  </Pop>
);

const Plate: React.FC<{ children: React.ReactNode; at: number; bg: string; color?: string; size?: number; w?: number }> = ({ children, at, bg, color = "#fff", size = 50, w }) => (
  <Pop at={at} from={0.7}>
    <div style={{ width: w, background: bg, color, fontFamily: lalezar, fontSize: size, lineHeight: 1.3, padding: "12px 28px", borderRadius: 26, border: "5px solid #fff", boxShadow: "0 10px 26px rgba(0,0,0,.4)", textAlign: "center" }}>{children}</div>
  </Pop>
);

const Photo: React.FC<{ src: string; w: number; h: number; at: number; rot?: number; pos?: string }> = ({ src, w, h, at, rot = 0, pos = "50% 30%" }) => (
  <Pop at={at} from={0.8}>
    <div style={{ width: w, height: h, borderRadius: 30, overflow: "hidden", border: "7px solid #fff", boxShadow: "0 14px 38px rgba(0,0,0,.45)", transform: `rotate(${rot}deg)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
    </div>
  </Pop>
);

/** Muted video crop in a rounded box. `startFrom` keeps sync inside Sequences. */
const Vid: React.FC<{ src: string; x: number; y: number; w: number; h: number; from: number; r?: number; border?: boolean; zoom?: number; pos?: string }> = ({ src, x, y, w, h, from, r = 34, border = true, zoom = 1, pos = "50% 50%" }) => {
  const f = useCurrentFrame();
  const t = (from * fps + f) / fps;
  // jump-cut punch-in: alternate scale on every cut so cuts feel intentional
  let idx = CUT_TIMES.findIndex((c, i) => t >= c && (i === CUT_TIMES.length - 1 || t < CUT_TIMES[i + 1]));
  if (idx < 0) idx = 0;
  const s = zoom * (idx % 2 === 0 ? 1 : 1.06);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r, overflow: "hidden", border: border ? "6px solid #fff" : undefined, boxShadow: "0 16px 44px rgba(0,0,0,.45)", background: BG.peach }}>
      <OffthreadVideo src={staticFile(src)} startFrom={sec(from)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${s})` }} />
    </div>
  );
};

// layout geometry -------------------------------------------------------------------------
const PANEL_H = H - PAD * 2; // 1032
const PANEL_W = Math.round((724 * PANEL_H) / 840); // 889
const WSPK_W = Math.round((860 * PANEL_H) / 834); // 1064

type Beat = { from: number; to: number; bg: string; render: (from: number) => React.ReactNode; sfx?: number[] };

/** SPLIT: speaker panel on the right (or left when `flip`). */
const SpeakerPanel: React.FC<{ from: number; flip?: boolean; src?: "ist_panel.mp4" | "ist_wspk.mp4" }> = ({ from, flip, src = "ist_panel.mp4" }) => {
  const w = src === "ist_panel.mp4" ? PANEL_W : WSPK_W;
  return <Vid src={src} x={flip ? PAD : W - PAD - w} y={PAD} w={w} h={PANEL_H} from={from} />;
};
/** FULL-SCREEN-ish: speaker centred at full height, coloured background on both sides (elements go on the edges). */
const SpeakerCentre: React.FC<{ from: number }> = ({ from }) => {
  const w = Math.round((724 * H) / 840);
  return <Vid src="ist_panel.mp4" x={(W - w) / 2} y={0} w={w} h={H} from={from} r={0} border={false} />;
};
/** Wide full-screen speaker. */
const SpeakerWide: React.FC<{ from: number }> = ({ from }) => <Vid src="ist_wide.mp4" x={0} y={0} w={W} h={H} from={from} r={0} border={false} zoom={1} pos="50% 35%" />;

const ClipCard: React.FC<{ from: number; x: number; y: number; w: number; at: number }> = ({ from, x, y, w, at }) => {
  const h = Math.round((298 * w) / 720);
  return (
    <Pop at={at} from={0.8} style={{ position: "absolute", left: x, top: y }}>
      <Vid src="ist_clip.mp4" x={0} y={0} w={w} h={h} from={from} r={26} />
    </Pop>
  );
};

const beats: Beat[] = [
  // 0 - 4.36 : split (speaker right), key phrase on the left
  {
    from: 0, to: 4.36, bg: BG.peach, sfx: [0.72, 2.34, 3.48],
    render: (f) => (
      <>
        <SpeakerPanel from={f} />
        <At x={PAD} y={170} w={940}><Kin at={0.72} size={118}>الاستغاثة بغير الله</Kin></At>
        <At x={PAD} y={470} w={940}><Pill at={2.34} bg={C.yellow} size={64}>أمر جائز؟</Pill></At>
        <At x={PAD} y={640} w={940}><Pill at={3.48} bg={C.red} color="#fff" size={62}>ومجمع على جوازه؟</Pill></At>
        <At x={PAD + 30} y={830} w={900}><LowerName at={0.9} /></At>
      </>
    ),
  },
  // 4.36 - 8.1 : speaker centred, mufti on the edge
  {
    from: 4.36, to: 8.1, bg: BG.rose, sfx: [5.58, 7.34],
    render: (f) => (
      <>
        <SpeakerCentre from={f} />
        <At x={1450} y={170} w={440}><Photo src="ist/mufti.jpg" w={420} h={300} at={5.58} rot={2} /></At>
        <At x={1450} y={500} w={440}><Plate at={5.58} bg={C.red} size={46}>أمين الفتوى</Plate></At>
        <At x={24} y={380} w={440}><Plate at={7.34} bg={C.teal} size={44}>دار الإفتاء<br />المصرية</Plate></At>
      </>
    ),
  },
  // 8.1 - 13.87 : split, quoted clip left, card under it
  {
    from: 8.1, to: 13.87, bg: BG.sage, sfx: [8.75, 13.13],
    render: (f) => (
      <>
        <SpeakerPanel from={f} />
        <ClipCard from={f} x={PAD + 10} y={170} w={940} at={8.75} />
        <At x={PAD} y={640} w={960}><Kin at={8.75} size={84} color="#fff">استمع للمقطع ...</Kin></At>
        <At x={PAD} y={830} w={960}><Plate at={13.13} bg={C.yellow} color={C.ink} size={56}>الاستغاثة نوع من أنواع التوسل</Plate></At>
      </>
    ),
  },
  // 13.87 - 21.83 : speaker centred, small clip on the left edge, cards on the right edge
  {
    from: 13.87, to: 21.83, bg: BG.peach, sfx: [15.53, 21.03],
    render: (f) => (
      <>
        <SpeakerCentre from={f} />
        <ClipCard from={f} x={24} y={150} w={450} at={13.87} />
        <At x={1445} y={230} w={450}><Plate at={15.53} bg={C.red} size={48}>استفعال<br />من الغوث</Plate></At>
        <At x={1445} y={520} w={450}><Plate at={21.03} bg={C.yellow} color={C.ink} size={44}>هل هي نوع<br />من التوسل؟</Plate></At>
      </>
    ),
  },
  // 21.83 - 23.4 : split, leading into the wide shot
  {
    from: 21.83, to: 23.4, bg: BG.rose, sfx: [21.9],
    render: (f) => (
      <>
        <SpeakerPanel from={f} flip />
        <At x={PANEL_W + 70} y={420} w={W - PANEL_W - 100}><Kin at={21.9} size={150} color="#fff">التوسل</Kin></At>
      </>
    ),
  },
  // 23.4 - 28.7 : wide full-screen speaker, words on the edges
  {
    from: 23.4, to: 28.7, bg: BG.sage, sfx: [23.92, 24.94, 28.33],
    render: (f) => (
      <>
        <SpeakerWide from={f} />
        <At x={40} y={130} w={470}><Plate at={23.92} bg={C.indigo} size={50}>الوصول إلى شيء</Plate></At>
        <At x={40} y={290} w={470}><Plate at={24.94} bg={C.red} size={50}>من خلال وسيلة</Plate></At>
        <At x={1410} y={130} w={470}><Plate at={28.33} bg={C.yellow} color={C.ink} size={52}>الاستغاثة = دعاء</Plate></At>
      </>
    ),
  },
  // 28.7 - 34.27 : wide-mode speaker panel on the right, phrase cards on the left
  {
    from: 28.7, to: 34.27, bg: BG.rose, sfx: [29.52, 30.95, 32.21, 33.17],
    render: (f) => (
      <>
        <SpeakerPanel from={f} src="ist_wspk.mp4" />
        <At x={PAD} y={140} w={800}><Plate at={29.52} bg={C.indigo} size={54}>أو الطلب</Plate></At>
        <At x={PAD} y={330} w={800}><Plate at={30.95} bg={C.teal} size={54}>تكون دعاءً إذا كانت</Plate></At>
        <At x={PAD} y={520} w={800}><Plate at={32.21} bg={C.red} size={60}>لغائب</Plate></At>
        <At x={PAD} y={710} w={800}><Plate at={33.17} bg={C.yellow} color={C.ink} size={60}>لا يسمع</Plate></At>
      </>
    ),
  },
  // 34.27 - 39.5 : wide full-screen, words on the edges
  {
    from: 34.27, to: 39.5, bg: BG.peach, sfx: [35.71, 36.55, 37.57],
    render: (f) => (
      <>
        <SpeakerWide from={f} />
        <At x={40} y={130} w={470}><Plate at={35.71} bg={C.plum} size={50}>حتى لو</Plate></At>
        <At x={40} y={290} w={470}><Plate at={36.55} bg={C.teal} size={48}>اعتقد أن له سمعاً</Plate></At>
        <At x={1410} y={130} w={470}><Plate at={37.57} bg={C.red} size={50}>سنناقش هذه المسألة</Plate></At>
      </>
    ),
  },
  // 39.5 - 41.13 : wide speaker panel + subscribe
  {
    from: 39.5, to: 41.13, bg: BG.rose, sfx: [39.7],
    render: (f) => (
      <>
        <SpeakerPanel from={f} flip src="ist_wspk.mp4" />
        <At x={WSPK_W + 70} y={300} w={W - WSPK_W - 100}><Kin at={39.7} size={100} color="#fff">ابقَ معنا</Kin></At>
        <At x={WSPK_W + 70} y={500} w={W - WSPK_W - 100}><Pill at={40.1} bg={C.red} color="#fff" size={54}>🔔 اشترك في القناة</Pill></At>
      </>
    ),
  },
  // 41.13 - end : closing card
  {
    from: 41.13, to: 43.17, bg: BG.peach, sfx: [41.3],
    render: () => <Closing />,
  },
];

const LowerName: React.FC<{ at: number }> = ({ at }) => {
  const f = useAbsFrame();
  const p = spring({ frame: f - sec(at), fps, config: { damping: 15, stiffness: 140 } });
  return (
    <div style={{ transform: `translateX(${(1 - p) * -600}px)`, opacity: Math.min(1, p * 2), width: 900 }}>
      <div style={{ background: C.red, color: "#fff", borderRadius: 18, padding: "12px 30px", boxShadow: "0 10px 26px rgba(0,0,0,.4)", border: "4px solid #fff" }}>
        <div style={{ fontFamily: lalezar, fontSize: 54, lineHeight: 1.2 }}>الشيخ محمد بن شمس الدين</div>
        <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 30, color: "#ffe9e6" }}>قناة محمد بن شمس الدين</div>
      </div>
    </div>
  );
};

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const bell = Math.sin(f / 4) * 14 * Math.exp(-(f % 40) / 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26, flexDirection: "column" }}>
      <Kin at={41.15} size={150} color={C.yellow}>قناة محمد بن شمس الدين</Kin>
      <Pop at={41.5}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, background: C.red, color: "#fff", borderRadius: 999, padding: "16px 54px", fontFamily: cairo, fontWeight: 900, fontSize: 64, border: "6px solid #fff", boxShadow: "0 12px 30px rgba(0,0,0,.45)" }}>
          <span style={{ display: "inline-block", transform: `rotate(${bell}deg)`, transformOrigin: "top center" }}>🔔</span>
          اشترك وفعّل الجرس
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// cover (first 0.10 s) -----------------------------------------------------------------
const CoverArt: React.FC = () => (
  <AbsoluteFill style={{ direction: "rtl", fontFamily: cairo, overflow: "hidden" }}>
    <Dots color={BG.peach} />
    <AbsoluteFill style={{ background: "linear-gradient(120deg, rgba(36,69,110,0) 40%, rgba(36,69,110,.95) 100%)" }} />
    <div style={{ position: "absolute", right: PAD, top: PAD, width: PANEL_W, height: PANEL_H, borderRadius: 40, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
      <Img src={staticFile("ist/speaker.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <At x={PAD} y={90} w={940}>
      <div style={{ fontFamily: lalezar, fontSize: 130, lineHeight: 1.12, textAlign: "center", color: C.yellow, WebkitTextStroke: "11px #4a2f1d", paintOrder: "stroke fill", textShadow: "0 12px 0 rgba(0,0,0,.35)" }}>هل الاستغاثة<br />بغير الله<br />مجمع على جوازها؟</div>
    </At>
    <div style={{ position: "absolute", left: 130, top: 600, width: 700, height: 330, borderRadius: 34, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 16px 44px rgba(0,0,0,.5)" }}>
      <Img src={staticFile("ist/mufti.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
    </div>
    <At x={130} y={935} w={700}><div style={{ background: C.red, color: "#fff", fontFamily: lalezar, fontSize: 46, padding: "4px 36px", borderRadius: 999, border: "5px solid #fff" }}>أمين الفتوى في دار الإفتاء</div></At>
  </AbsoluteFill>
);

// sound effects (light) ------------------------------------------------------------------
const SFX = [
  ...beats.filter((_, i) => i % WHOOSH_EVERY === 0).map((b) => ({ src: "sfx/whoosh.wav", at: b.from, vol: SFX_LEVELS.whoosh })),
  ...(SFX_LEVELS.pop > 0 ? beats.flatMap((b) => (b.sfx ?? []).map((t) => ({ src: "sfx/pop.wav", at: t, vol: SFX_LEVELS.pop }))) : []),
  { src: "sfx/chime.wav", at: 0.9, vol: SFX_LEVELS.chime },
  { src: "sfx/chime.wav", at: 40.1, vol: SFX_LEVELS.chime },
];

const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  const a = sec(SPLIT_END - 0.1);
  const b = sec(WIDE_START + 0.1);
  const p = interpolate(f, [a, a + 6, b - 6, b], [0, 1, 1, 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  if (f < a || f > b) return null;
  const x = p <= 1 ? (1 - p) * W : -(p - 1) * W;
  return <div style={{ position: "absolute", left: x, top: 0, width: W, height: H, background: `linear-gradient(90deg, ${C.red}, ${C.plum})` }} />;
};

export const IstComposition: React.FC = () => (
  <AbsoluteFill style={{ background: BG.peach, direction: "rtl", fontFamily: cairo }}>
    {beats.map((b, i) => {
      const dur = sec(b.to - b.from) + TAIL;
      return (
        <Sequence key={i} from={sec(b.from)} durationInFrames={dur} layout="none">
          <AbsoluteFill>
            <BgFade>
              <Dots color={b.bg} />
            </BgFade>
            <BeatOffset.Provider value={sec(b.from)}>{b.render(sec(b.from) / fps)}</BeatOffset.Provider>
          </AbsoluteFill>
        </Sequence>
      );
    })}
    <Wipe />
    <Audio src={staticFile("ist_audio.m4a")} />
    {SFX.map((x, i) => (
      <Sequence key={i} from={sec(x.at)} durationInFrames={fps * 2} layout="none">
        <Audio src={staticFile(x.src)} volume={x.vol} />
      </Sequence>
    ))}
    <Sequence  durationInFrames={COVER_FRAMES} layout="none">
      <CoverArt />
    </Sequence>
    <TitleBar title="هل الاستغاثة بغير الله مجمع على جوازها؟" />
  </AbsoluteFill>
);

const BgFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

void amiri;
