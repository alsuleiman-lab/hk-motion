import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, Img } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar";
import { SFX_LEVELS } from "./sfxConfig";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: lalezar } = loadLalezar("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const PRAYER_FPS = 30;
export const PRAYER_DURATION_FRAMES = 1798; // 59.93 s * 30 fps

const sec = (t: number) => Math.round(t * PRAYER_FPS);

// User-specified Library & Parchment Palette:
const P = {
  parchment: "#f7f2e7",
  cream: "#ede3ce",
  sand: "#dfd2b5",
  leather: "#4a2e1b",
  walnut: "#382113",
  oak: "#6e472a",
  olive: "#4f6345",
  sage: "#6b805f",
  deepOlive: "#2d3b27",
  gold: "#cda04f",
  amber: "#b87d2a",
  ink: "#1d140e",
};

const usePop = (at: number, damping = 14) => {
  const f = useCurrentFrame();
  return spring({ frame: f - sec(at), fps: PRAYER_FPS, config: { damping, stiffness: 180, mass: 0.8 } });
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  const opacity = interpolate(p, [0, 0.4, 1], [0, 0.9, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(p, [0, 1], [0.85, 1], { extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `scale(${scale})`, ...style }}>{children}</div>;
};

/** Portrait cover art in first 3 frames (0.10s) */
const PrayerCover: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, #4a2e1b, #2d1b10 65%, #170d07 100%)`,
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "100px 50px 80px 50px",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(247,242,231,0.12) 2px, transparent 2px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />

      <div
        style={{
          zIndex: 2,
          background: P.gold,
          color: P.ink,
          fontFamily: cairo,
          fontWeight: 900,
          fontSize: 34,
          padding: "10px 36px",
          borderRadius: 999,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        شرح جامع الترمذي — حديث 125
      </div>

      <div
        style={{
          zIndex: 2,
          width: 640,
          height: 640,
          borderRadius: 48,
          overflow: "hidden",
          border: `8px solid ${P.gold}`,
          boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <Img
          src={staticFile("cover_sheikh.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 25%",
          }}
        />
      </div>

      <div
        style={{
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: lalezar,
            fontSize: 76,
            lineHeight: 1.2,
            color: "#ffffff",
            textShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          هل يجوز تأخير الصلاة
          <br />
          <span style={{ color: P.gold }}>عن وقتها؟</span>
        </div>

        <div
          style={{
            fontFamily: cairo,
            fontWeight: 800,
            fontSize: 36,
            color: P.parchment,
            maxWidth: 900,
            lineHeight: 1.5,
          }}
        >
          حكم تأخير الصلاة لعذر أو عمد.. وماذا يفعل فاقد الطهورين؟
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            border: `2px solid ${P.gold}`,
            padding: "12px 36px",
            borderRadius: 20,
            marginTop: 10,
          }}
        >
          <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: "#ffffff" }}>
            فضيلة الشيخ محمد بن شمس الدين
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LessonPrayerPortrait: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / PRAYER_FPS;

  return (
    <AbsoluteFill style={{ background: "#150d08" }}>
      {/* 1. Video stream */}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("prayer_portrait_video.mp4")} />
      </AbsoluteFill>

      {/* 2. Dynamic Montaged Overlays (Strictly below y=1230, above y=1800) */}
      <div
        style={{
          position: "absolute",
          top: 1240,
          left: 40,
          right: 40,
          direction: "rtl",
          zIndex: 15,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Beat 1: 1.5s - 6.8s -> الأصل الشرعي: لا يجوز تأخير الصلاة عن وقتها */}
        {t >= 1.4 && t < 6.8 && (
          <Pop at={1.4}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 28,
                padding: "24px 36px",
                textAlign: "center",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 52, color: P.walnut, lineHeight: 1.2 }}>
                الأصل الشرعي:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 38, color: P.amber, marginTop: 8 }}>
                لا يجوز تأخير الصلاة عن وقتها لعَمْدٍ بحالٍ من الأحوال
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 2: 7.0s - 12.0s -> الاستثناء: حالة الجمع بين الصلاتين */}
        {t >= 7.0 && t < 12.2 && (
          <Pop at={7.0}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 28,
                padding: "24px 36px",
                textAlign: "center",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 48, color: P.deepOlive, lineHeight: 1.2 }}>
                الاستثناء الوحيد:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 36, color: P.ink, marginTop: 8 }}>
                حالة الجمع بين الصلاتين (لأنه وقتها أصلاً)
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 3: 12.2s - 22.0s -> الجمع بين الظهر والعصر */}
        {t >= 12.2 && t < 22.0 && (
          <Pop at={12.2}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 28,
                padding: "20px 32px",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: lalezar, fontSize: 44, color: P.walnut }}>الجمع بين الصلاتين</span>
                <span
                  style={{
                    background: P.leather,
                    color: P.parchment,
                    fontFamily: cairo,
                    fontWeight: 800,
                    fontSize: 22,
                    padding: "4px 18px",
                    borderRadius: 999,
                  }}
                >
                  كالظهر والعصر
                </span>
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, marginTop: 12, lineHeight: 1.5 }}>
                إذا نوى جمع التأخير، صار وقت الثانية وقتاً للأولى شرعاً وفق شروط الجمع المعروفة.
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 4: 23.0s - 33.5s -> الأعذار المسقطة للإثم */}
        {t >= 23.0 && t < 33.5 && (
          <Pop at={23.0}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 28,
                padding: "20px 32px",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut, textAlign: "center" }}>
                الأعذار التي يسقط بها الإثم لمن لم يملك نفسه:
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
                <div
                  style={{
                    background: t >= 26.5 ? P.olive : "#ffffff",
                    border: `2px solid ${P.olive}`,
                    borderRadius: 18,
                    padding: "10px 24px",
                    fontFamily: cairo,
                    fontWeight: 900,
                    fontSize: 28,
                    color: t >= 26.5 ? "#ffffff" : P.ink,
                    transform: t >= 26.5 ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  ١. النائم
                </div>
                <div
                  style={{
                    background: t >= 28.0 ? P.olive : "#ffffff",
                    border: `2px solid ${P.olive}`,
                    borderRadius: 18,
                    padding: "10px 24px",
                    fontFamily: cairo,
                    fontWeight: 900,
                    fontSize: 28,
                    color: t >= 28.0 ? "#ffffff" : P.ink,
                    transform: t >= 28.0 ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  ٢. المغمى عليه
                </div>
                <div
                  style={{
                    background: t >= 31.0 ? P.olive : "#ffffff",
                    border: `2px solid ${P.olive}`,
                    borderRadius: 18,
                    padding: "10px 24px",
                    fontFamily: cairo,
                    fontWeight: 900,
                    fontSize: 28,
                    color: t >= 31.0 ? "#ffffff" : P.ink,
                    transform: t >= 31.0 ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  ٣. زوال العقل المؤقت
                </div>
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 5: 34.0s - 43.5s -> فاقد الطهورين */}
        {t >= 34.0 && t < 43.5 && (
          <Pop at={34.0}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.leather}`,
                borderRadius: 28,
                padding: "22px 36px",
                textAlign: "center",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: lalezar, fontSize: 46, color: P.walnut }}>
                مسألة «فاقد الطهورين»
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 32, color: P.ink, marginTop: 8 }}>
                من لم يجد ماءً ولا تراباً (كالمحبوس والمربوط):
              </div>
              <div
                style={{
                  marginTop: 12,
                  background: `rgba(205, 160, 79, 0.25)`,
                  border: `2px solid ${P.amber}`,
                  padding: "10px 24px",
                  borderRadius: 16,
                  fontFamily: cairo,
                  fontWeight: 900,
                  fontSize: 34,
                  color: P.walnut,
                }}
              >
                يصلي على حاله في الوقت.. ولا يترك الصلاة!
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 6: 44.0s - 59.5s -> حكم الإعادة */}
        {t >= 44.0 && (
          <Pop at={44.0}>
            <div
              style={{
                width: 980,
                background: `linear-gradient(135deg, ${P.parchment}, ${P.cream})`,
                border: `4px solid ${P.olive}`,
                borderRadius: 28,
                padding: "20px 32px",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: lalezar, fontSize: 40, color: P.walnut }}>قول بعض أهل العلم:</span>
                <span style={{ fontFamily: cairo, fontWeight: 800, fontSize: 24, color: P.deepOlive }}>حرمة الوقت</span>
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 30, color: P.ink, marginTop: 10, lineHeight: 1.5 }}>
                يصلي في الوقت ثم يعيد إذا تيسر له الماء أو التراب لاحقاً (صلاها مرتين)..
              </div>
              <div
                style={{
                  marginTop: 10,
                  background: `rgba(184, 125, 42, 0.2)`,
                  border: `2px solid ${P.amber}`,
                  padding: "8px 20px",
                  borderRadius: 14,
                  fontFamily: cairo,
                  fontWeight: 900,
                  fontSize: 28,
                  color: P.walnut,
                  textAlign: "center",
                }}
              >
                ولم يقل أحدٌ من العلماء أبداً بإخراج الصلاة عن وقتها!
              </div>
            </div>
          </Pop>
        )}
      </div>

      {/* 3. Audio SFX (lightweight, following SFX_LEVELS) */}
      <Sequence from={sec(1.4)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(7.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(23.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(34.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(44.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>

      {/* 4. Cover Image in the first 0.10s (first 3 frames) */}
      <Sequence  durationInFrames={3} layout="none">
        <PrayerCover />
      </Sequence>
    </AbsoluteFill>
  );
};
