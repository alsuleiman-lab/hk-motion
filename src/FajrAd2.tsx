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
import { SFX_LEVELS } from "./sfxConfig";

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


const Check: React.FC<{ size?: number; sec: number; from: number }> = ({ size = 220, sec, from }) => (
  <Pop sec={sec} from={from} dy={0}>
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#2e9b62", border: `${size * 0.06}px solid ${C.cream}`, boxShadow: "0 16px 40px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
    </div>
  </Pop>
);

/* ───────── shots (every visual changes at least every 2 s) ───────── */
const col: React.CSSProperties = { position: "absolute", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 };
const E = (c: string) => <span style={{ fontFamily: EMOJI }}>{c}</span>;
const Strike: React.FC<{ sec: number; from: number; children: React.ReactNode }> = ({ sec, from, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - f(sec - from), fps, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  return (
    <div style={{ position: "relative" }}>
      {children}
      <div style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 12, background: C.red, borderRadius: 8, transformOrigin: "right", transform: `scaleX(${Math.min(1, Math.max(0, p))})` }} />
    </div>
  );
};

/** full-bleed clip with a light green shade */
const Full: React.FC<{ clip: string; zoom?: [number, number]; drift?: number; top?: number; bottom?: number; children?: React.ReactNode }> = ({ clip, zoom, drift, top = 0.3, bottom = 0.5, children }) => (
  <>
    <Clip name={clip} frames={90} zoom={zoom} drift={drift} />
    <Shade top={top} bottom={bottom} />
    {children}
  </>
);

/** still photo: blurred copy fills the frame, sharp copy sits in a card with a slow push-in */
const PhotoShot: React.FC<{ src: string; pos?: string; children?: React.ReactNode }> = ({ src, pos = "50% 50%", children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = frame / Math.max(1, durationInFrames);
  return (
    <>
      <AbsoluteFill style={{ background: C.paper }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(38px) saturate(1.1) brightness(1.1)", transform: "scale(1.3)" }} />
        <AbsoluteFill style={{ background: "rgba(215,233,212,0.45)" }} />
      </AbsoluteFill>
      <Card style={{ position: "absolute", left: 50, top: 330, width: 980, height: 1060 }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${1.02 + 0.12 * k})`, transformOrigin: pos }} />
      </Card>
      {children}
    </>
  );
};

/** phone camera viewfinder over the sink: focus box, shutter flash, saved thumbnail */
const CameraShot: React.FC<{ from: number; flash: number; clip: string; label: string }> = ({ from, flash, clip, label }) => {
  const frame = useCurrentFrame();
  const fl = frame - f(flash - from);
  const focus = interpolate(frame, [0, 14], [1.35, 1], { extrapolateRight: "clamp" });
  const brk = (pos: React.CSSProperties) => <div style={{ position: "absolute", width: 120, height: 120, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, ...pos }} />;
  return (
    <>
      <Clip name={clip} frames={90} zoom={[1.0, 1.08]} />
      <Shade top={0.25} bottom={0.4} />
      <div style={{ position: "absolute", inset: 90, top: 200, bottom: 300 }}>
        {brk({ top: 0, left: 0, borderTopWidth: 10, borderLeftWidth: 10, borderTopLeftRadius: 30 })}
        {brk({ top: 0, right: 0, borderTopWidth: 10, borderRightWidth: 10, borderTopRightRadius: 30 })}
        {brk({ bottom: 0, left: 0, borderBottomWidth: 10, borderLeftWidth: 10, borderBottomLeftRadius: 30 })}
        {brk({ bottom: 0, right: 0, borderBottomWidth: 10, borderRightWidth: 10, borderBottomRightRadius: 30 })}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 280, height: 280, marginLeft: -140, marginTop: -140, border: `7px solid ${C.gold}`, borderRadius: 24, transform: `scale(${focus})` }} />
      </div>
      <div style={{ ...col, top: 90 }}>
        <Pop sec={flash - 0.3} from={from}><Pill bg={C.deep} size={64}>{E("📸")} {label}</Pill></Pop>
      </div>
      {/* shutter */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 150, height: 150, borderRadius: "50%", border: "10px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${fl >= 0 && fl < 4 ? 0.88 : 1})` }}>
          <div style={{ width: 106, height: 106, borderRadius: "50%", background: "#fff" }} />
        </div>
      </div>
      {fl >= 0 ? <AbsoluteFill style={{ background: "#fff", opacity: interpolate(fl, [0, 2, 9], [0, 0.95, 0], { extrapolateRight: "clamp" }) }} /> : null}
      {fl >= 0 ? <Sequence from={Math.max(0, f(flash - from))} durationInFrames={20}><Audio src={staticFile("sfx/shutter.wav")} volume={0.25} /></Sequence> : null}
      <div style={{ position: "absolute", left: 60, bottom: 330 }}>
        <Pop sec={flash + 0.35} from={from} dy={0}>
          <div style={{ width: 230, height: 300, borderRadius: 26, border: "8px solid #fff", overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.4)", position: "relative" }}>
            <Clip name={clip} frames={90} zoom={[1.0, 1.0]} />
            <div style={{ position: "absolute", right: 10, top: 10, width: 64, height: 64, borderRadius: "50%", background: "#2e9b62", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily, fontWeight: 900, fontSize: 40 }}>✓</div>
          </div>
        </Pop>
      </div>
    </>
  );
};

type Shot = { a: number; b: number; r: (s: number) => React.ReactNode };
const S: Shot[] = [];
const add = (a: number, b: number, r: (s: number) => React.ReactNode) => { S.push({ a, b, r }); };
const P = (n: number, s: number, ch: React.ReactNode, style?: React.CSSProperties, dy?: number) => <Pop sec={at(n)} from={s} style={style} dy={dy}>{ch}</Pop>;

// no B-roll clip is used twice; clips: r_wake1b, alarm_v2, r_wake2, r_lie, clock1, clock2, cartoon_b, wash_v2b, r_hands, r_face, r_soap, r_splash,
// sun_v2, mosque, sil_v2, phone1, phone2, r_sky, r_pray. (stills: wudu_c, wudu_b2, wudu_a2)
const Ring: React.FC<{ from: number; sec: number; size?: number }> = ({ from, sec, size = 220 }) => {
  const frame = useCurrentFrame();
  const t = frame - f(sec - from);
  const on = t >= 0;
  return (
    <div style={{ opacity: on ? 1 : 0, fontFamily: EMOJI, fontSize: size, transform: `rotate(${on ? Math.sin(t * 1.6) * 16 : 0}deg)`, filter: "drop-shadow(0 10px 20px rgba(0,0,0,.4))" }}>⏰</div>
  );
};

// 1) first thing: a man in bed wakes up to the alarm
add(0, 3.54, (s) => (<Full clip="r_wake1b" zoom={[1.0, 1.1]} top={0.2} bottom={0.55}>
  <div style={{ ...col, top: 150 }}><Ring from={s} sec={0.05} /></div>
  <div style={{ ...col, top: 1230 }}>
    <Pop sec={0.05} from={s}><Pill bg={C.red} size={62}>أكبر مشكلة</Pill></Pop>
    {P(2, s, <Big size={110}>تضيّع عليك</Big>)}
    {P(4, s, <Big size={160} color={C.gold}>صلاة الفجر</Big>)}
  </div></Full>));
// 2) wakes on the alarm, switches it off, goes back to sleep
add(3.54, 4.9, (s) => (<Full clip="alarm_v2" zoom={[1.05, 1.15]}>
  <div style={{ ...col, top: 260 }}>{P(9, s, <Pill size={76} bg={C.amber}>{E("⏰")} تصحى على المنبه</Pill>)}</div>
  <div style={{ ...col, top: 1300 }}>{P(10, s, <Pill size={80} bg={C.red}>تطفيه {E("🔕")}</Pill>)}</div></Full>));
add(4.9, 8.09, (s) => (<Full clip="r_wake2" zoom={[1.0, 1.08]} top={0.1} bottom={0.5}>
  <div style={{ ...col, top: 1280 }}>
    {P(11, s, <Pill size={80} bg={C.deep}>{E("😴")} وترجع تنام</Pill>)}
    {P(13, s, <Pill size={64} bg={C.amber}>بيحصل معايا برضو {E("😅")}</Pill>)}
  </div></Full>));
// 3) "I'll get up in five minutes"
add(8.09, 9.7, (s) => (<Full clip="r_lie" zoom={[1.0, 1.08]} top={0.1} bottom={0.5}>
  <div style={{ ...col, top: 1280 }}>{P(16, s, <Pill size={84} bg={C.green}>بتقول: هقوم…</Pill>)}</div></Full>));
add(9.7, 11.37, (s) => (<Full clip="clock1" top={0.2} bottom={0.55}>
  <div style={{ ...col, top: 1050, flexDirection: "row", justifyContent: "center", gap: 30, direction: "rtl" }}>
    {P(18, s, <Big size={80}>بعد</Big>)}
    {P(19, s, <Big size={330} color={C.gold}>٥</Big>)}
    {P(20, s, <Big size={120}>دقايق</Big>)}
  </div></Full>));
// 4) suddenly the time is gone
add(11.37, 14.8, (s) => (<Full clip="clock2" zoom={[1.0, 1.12]}>
  <div style={{ ...col, top: 250 }}>{P(21, s, <Pill bg={C.amber} size={76}>وفجأة</Pill>)}{P(22, s, <Big size={120}>تلاقي الوقت</Big>)}{P(24, s, <Big size={150}>عدّى</Big>)}</div>
  <div style={{ ...col, top: 1330 }}>{P(25, s, <Big size={140} color={C.gold}>وفاتتك الصلاة</Big>)}</div></Full>));
// 5) the app
add(14.8, 15.7, (s) => (<><PaperBG tone="#dfeed9" />
  <div style={{ ...col, top: 760 }}>{P(27, s, <Big size={130} color={C.deep} stroke={C.cream}>عشان كده…</Big>)}</div></>));
add(15.7, 17.2, (s) => (<><PaperBG />
  <div style={{ ...col, top: 420 }}>
    {P(29, s, <AppIcon size={380} />)}
    {P(29, s, <Big size={170} color={C.deep} stroke={C.cream}>تطبيق فجر</Big>)}
    {P(31, s, <Big size={80} color={C.green} stroke={C.cream}>بيقدم لك…</Big>)}
  </div></>));
add(17.2, 18.1, (s) => (<><PaperBG />
  <Pop sec={17.25} from={s} dy={140} style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Phone src="ad2/shot1.jpg" width={700} /></Pop>
  <div style={{ ...col, top: 90 }}>{P(33, s, <Pill bg={C.gold} color={C.deep} size={78}>طريقة مختلفة</Pill>)}</div></>));
// 6) alarm won't stop until you go to the sink and photograph it
add(18.1, 19.9, (s) => (<><PaperBG tone="#dfeed9" />
  <div style={{ ...col, top: 110 }}>
    {P(35, s, <Big size={118} color={C.deep} stroke={C.cream}>المنبه مش هيتوقف</Big>)}
    {P(38, s, <Big size={84} color={C.amber} stroke={C.cream}>غير لما…</Big>)}
  </div>
  <div style={{ ...col, top: 620 }}><Ring from={s} sec={18.15} size={520} /></div></>));
add(19.9, 21.1, (s) => (<><PaperBG tone="#dfeed9" />
  <div style={{ ...col, top: 330, gap: 50 }}>
    {[{ i: 40, ic: "🛏️", t: "تقوم", c: C.amber, n: 1 }, { i: 42, ic: "🚿", t: "تروح للمغسلة", c: C.green, n: 2 }].map((x) => (
      <Pop key={x.n} sec={at(x.i)} from={s} dy={90}>
        <div style={{ display: "flex", alignItems: "center", gap: 36, direction: "rtl", background: C.cream, border: `7px solid ${x.c}`, borderRadius: 70, padding: "40px 60px", width: 940, boxShadow: "0 18px 44px rgba(20,65,47,.3)" }}>
          <div style={{ width: 150, height: 150, borderRadius: "50%", background: x.c, color: "#fff", fontFamily, fontWeight: 900, fontSize: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>{x.n}</div>
          <div style={{ fontFamily: EMOJI, fontSize: 130 }}>{x.ic}</div>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 90, color: C.ink }}>{x.t}</div>
        </div>
      </Pop>
    ))}
  </div></>));
add(21.1, 22.1, (s) => (<CameraShot from={s} flash={21.5} clip="wash_v2b" label="وتصوّرها" />));
// 7) checks you are at the ablution place (real men washing), then stops
add(22.1, 23.6, (s) => (<Full clip="r_face" zoom={[1.0, 1.12]} top={0.25} bottom={0.5}>
  <div style={{ ...col, top: 200 }}>{P(44, s, <Pill bg={C.green} size={76}>فيتأكد</Pill>)}{P(45, s, <Big size={100}>أنك وصلت</Big>)}</div></Full>));
add(23.6, 24.7, (s) => (<PhotoShot src="ad2/wudu/wudu_c.jpg" pos="50% 50%">
  <div style={{ ...col, top: 120 }}>{P(47, s, <Big size={110} color={C.deep} stroke={C.cream}>مكان الوضوء</Big>)}</div></PhotoShot>));
add(24.7, 25.9, (s) => (<Full clip="r_soap" zoom={[1.0, 1.1]} top={0.2} bottom={0.5}>
  <div style={{ ...col, top: 1360 }}><Check sec={24.75} from={s} size={170} />{P(50, s, <Pill bg={"#2e9b62"} size={76}>وبيتوقف المنبه</Pill>)}</div></Full>));
// 8) instead of turning it off in bed, the app makes you get up
add(25.9, 28.7, (s) => (<Full clip="cartoon_b" top={0} bottom={0}>
  <div style={{ ...col, top: 1130 }}>
    {P(52, s, <Pill size={70} bg={C.deep}>بدل ما</Pill>)}
    {P(54, s, <Strike from={s} sec={27.0}><Big size={100} color={C.deep} stroke={C.cream}>تطفي المنبه</Big></Strike>)}
    {P(56, s, <Pill size={76} bg={C.red}>وإنت لسه في السرير</Pill>)}
  </div></Full>));
add(28.7, 30.0, (s) => (<><PaperBG />
  <Pop sec={28.72} from={s} dy={90} style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Phone src="ad2/shot3.jpg" width={760} /></Pop>
  <div style={{ ...col, top: 1650 }}>{P(60, s, <Pill bg={C.green} size={76}>التطبيق يجبرك تقوم</Pill>)}</div></>));
add(30.0, 31.05, (s) => (<CameraShot from={s} flash={30.3} clip="r_hands" label="ويتصوّرها" />));
// 9) simple step that breaks the habit
add(31.05, 33.0, (s) => (<Full clip="sun_v2" zoom={[1.02, 1.15]}>
  <div style={{ ...col, top: 250 }}>{P(65, s, <Big size={140}>خطوة بسيطة</Big>)}{P(67, s, <Pill bg={C.green} size={70}>تساعدك</Pill>)}</div></Full>));
add(33.0, 34.4, (s) => (<><PaperBG tone="#e6f0da" />
  <div style={{ ...col, top: 380 }}>
    {P(68, s, <Strike from={s} sec={at(71)}><Big size={380}>{E("🛏️")}</Big></Strike>)}
    {P(68, s, <Pill bg={C.red} size={76}>تكسر عادة</Pill>)}
    {P(70, s, <Big size={110} color={C.deep} stroke={C.cream}>الرجوع للنوم</Big>)}
  </div></>));
add(34.4, 36.0, (s) => (<Full clip="mosque" zoom={[1.0, 1.12]}>
  <div style={{ ...col, top: 1200 }}>{P(72, s, <Pill bg={C.green} size={66}>وتقرّبك من</Pill>)}{P(75, s, <Big size={110}>استقبال يومك</Big>)}</div></Full>));
add(36.0, 37.0, (s) => (<Full clip="sil_v2" zoom={[1.0, 1.1]}>
  <div style={{ ...col, top: 1200 }}>{P(77, s, <Big size={170} color={C.gold}>بالصلاة</Big>)}</div></Full>));
// 10) offline, photos stay on the phone
add(37.0, 38.4, (s) => (<Full clip="phone1" top={0.25} bottom={0.45}>
  <div style={{ ...col, top: 1250 }}>{P(78, s, <Pill bg={C.amber} size={80}>وللعلم…</Pill>)}</div></Full>));
add(38.4, 40.2, (s) => (<><PaperBG tone="#dcebd6" />
  <div style={{ ...col, top: 520 }}>{P(80, s, <Big size={380}>{E("📴")}</Big>)}{P(80, s, <Big size={130} color={C.deep} stroke={C.cream}>بدون إنترنت</Big>)}</div></>));
add(40.2, 41.9, (s) => (<><PaperBG tone="#dcebd6" />
  <div style={{ ...col, top: 520 }}>{P(84, s, <Big size={380}>{E("🛡️")}</Big>)}{P(84, s, <Big size={104} color={C.deep} stroke={C.cream}>صورك لا تغادر جهازك</Big>)}</div></>));
add(41.9, 42.8, (s) => (<Full clip="phone2" top={0.25} bottom={0.5}>
  <div style={{ ...col, top: 1250 }}>{P(88, s, <Pill bg={C.green} size={76}>{E("📱")} تُعالَج داخل هاتفك</Pill>)}</div></Full>));
// 11) AI checks you made wudu
add(42.8, 44.2, (s) => (<Full clip="r_splash" zoom={[1.05, 1.2]} drift={-40} top={0.3} bottom={0.5}>
  <ScanLine from={s} start={42.9} />
  <div style={{ ...col, top: 250 }}>{P(91, s, <Big size={100}>{E("🤖")} الذكاء الاصطناعي</Big>)}</div></Full>));
add(44.2, 45.3, (s) => (<PhotoShot src="ad2/wudu/wudu_a2.jpg" pos="40% 60%">
  <div style={{ ...col, top: 110 }}>{P(93, s, <Pill bg={C.green} size={80}>يتأكد أنك قمت</Pill>)}</div></PhotoShot>));
add(45.3, 46.5, (s) => (<PhotoShot src="ad2/wudu/wudu_b2.jpg" pos="50% 60%">
  <div style={{ ...col, top: 110 }}>{P(96, s, <Big size={150} color={C.deep} stroke={C.cream}>تتوضأ</Big>)}</div>
  <div style={{ ...col, top: 1460 }}><Check sec={45.9} from={s} size={170} /></div></PhotoShot>));
// 12) download
add(46.5, 48.0, (s) => (<Full clip="r_sky" zoom={[1.02, 1.12]}>
  <div style={{ ...col, top: 330 }}>{P(98, s, <Pill bg={C.gold} color={C.deep} size={90}>حمّل تطبيق</Pill>)}{P(100, s, <AppIcon size={360} />)}</div></Full>));
add(48.0, 51.2, (s) => (<><PaperBG tone="#dfeed9" />
  <div style={{ ...col, top: 300 }}>
    {P(101, s, <Big size={100} color={C.deep} stroke={C.cream}>خلّي منبهك</Big>)}
    {P(103, s, <Big size={140} color={C.amber} stroke={C.cream}>بداية للقيام</Big>)}
    <div style={{ marginTop: 40 }}><Ring from={s} sec={at(103)} size={300} /></div>
    {P(105, s, <Strike from={s} sec={at(107)}><Big size={92} color={C.deep} stroke={C.cream}>مش فرصة للنوم</Big></Strike>)}
    {P(108, s, <Big size={110} color={C.red} stroke={C.cream}>من جديد</Big>)}
  </div></>));
// 13) tagline
add(51.2, 54.4, (s) => (<Full clip="r_pray" zoom={[1.0, 1.1]} top={0.2} bottom={0.5}>
  <div style={{ ...col, top: 260 }}>{P(110, s, <Big size={300} color={C.gold}>فجر</Big>)}{P(111, s, <Big size={100}>خطوة تساعدك</Big>)}</div>
  <div style={{ ...col, top: 1350 }}>{P(113, s, <Big size={120} color={C.cream}>تقوم لصلاة الفجر</Big>)}</div></Full>));
// 14) Google Play + end card
add(54.4, 56.1, (s) => (<><PaperBG />
  <div style={{ ...col, top: 90 }}>{P(116, s, <Pill bg={C.deep} size={78}>{E("▶️")} ادخل Google Play</Pill>)}</div>
  <Pop sec={54.5} from={s} dy={160} style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Phone src="ad2/shot2.jpg" width={700} /></Pop></>));
add(56.1, 58.0, (s) => (<><PaperBG />
  <div style={{ ...col, top: 90 }}>{P(119, s, <Big size={104} color={C.deep} stroke={C.cream}>واكتب «فجر»</Big>)}</div>
  <div style={{ position: "absolute", left: 40, top: 330, width: 1000, height: 640, borderRadius: 40, overflow: "hidden", border: `6px solid ${C.green}`, boxShadow: "0 24px 60px rgba(20,65,47,.4)", background: C.cream }}>
    <Img src={staticFile("ad2/shot2.jpg")} style={{ width: 1000, height: 1946, marginTop: -40 }} />
  </div>
  <div style={{ ...col, top: 1100 }}>{P(121, s, <Pill bg={C.green} size={74}>وتأكد إنك تحمّل</Pill>)}{P(123, s, <Big size={110} color={C.deep} stroke={C.cream}>التطبيق الصح ✔</Big>)}</div></>));
add(58.0, 60, (s) => (<><PaperBG tone="#dfeed9" />
  <div style={{ ...col, top: 420 }}><Pop sec={58.05} from={s}><AppIcon size={400} /></Pop><Pop sec={58.2} from={s}><Big size={160} color={C.deep} stroke={C.cream}>تطبيق فجر</Big></Pop><Pop sec={58.5} from={s}><Pill bg={C.gold} color={C.deep} size={84}>حمّله الآن</Pill></Pop></div></>));

const ScanLine: React.FC<{ from: number; start: number }> = ({ from, start }) => {
  const frame = useCurrentFrame();
  const t = ((frame - f(start - from)) % 60) / 60;
  const y = 600 + t * 700;
  return <div style={{ position: "absolute", left: 120, right: 120, top: y, height: 8, borderRadius: 8, background: C.gold, boxShadow: `0 0 40px 10px ${C.gold}`, opacity: frame < f(start - from) ? 0 : 0.9 }} />;
};

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

const Fade: React.FC<{ len: number; first: boolean; children: React.ReactNode }> = ({ len, first, children }) => {
  const frame = useCurrentFrame();
  const o = first ? 1 : interpolate(frame, [0, len], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const FajrAd2: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Audio src={staticFile("ad2/voice.mp3")} />
      {S.map((sh, i) => {
        const start = i === 0 ? 0 : f(sh.a) - 3;
        const end = f(sh.b) + (i === S.length - 1 ? 0 : 0);
        return (
          <Sequence key={i} from={start} durationInFrames={Math.max(1, end - start)} layout="none">
            <Fade len={3} first={i === 0}>{sh.r(start / fps)}</Fade>
            {i > 0 && i % 3 === 0 ? <Sequence  durationInFrames={30}><Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} /></Sequence> : null}
          </Sequence>
        );
      })}
      <Sequence  durationInFrames={3}><Cover /></Sequence>
    </AbsoluteFill>
  );
};
