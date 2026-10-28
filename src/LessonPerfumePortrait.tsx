import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, Img } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar";
import { SFX_LEVELS } from "./sfxConfig";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: lalezar } = loadLalezar("normal", { weights: ["400"], subsets: ["arabic", "latin"] });

export const PERFUME_FPS = 30;
export const PERFUME_DURATION_FRAMES = 831; // 27.7s * 30 fps

const sec = (t: number) => Math.round(t * PERFUME_FPS);

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
  return spring({ frame: f - sec(at), fps: PERFUME_FPS, config: { damping, stiffness: 180, mass: 0.8 } });
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  const opacity = interpolate(p, [0, 0.4, 1], [0, 0.9, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(p, [0, 1], [0.85, 1], { extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `scale(${scale})`, ...style }}>{children}</div>;
};

/** Portrait cover art in first 3 frames (0.10s) */
const PerfumeCover: React.FC = () => {
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
        شرح جامع الترمذي — حديث 120
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
          src={staticFile("cover_sheikh_25_sq.jpg")}
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
          تحذير للرجال:
          <br />
          <span style={{ color: P.gold }}>الخروج بعطر الزوجة!</span>
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
          ما حكم خروج الرجل وأثر عطر زوجته عالق به؟ وماذا يجب عليه أن يفعل؟
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

export const LessonPerfumePortrait: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / PERFUME_FPS;

  return (
    <AbsoluteFill style={{ background: "#150d08" }}>
      {/* 1. Portrait Video */}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("perfume_portrait_video.mp4")} />
      </AbsoluteFill>

      {/* 2. Overlays - STRICTLY below y=1230 */}
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
        {/* Beat 1: 0.0s - 10.5s -> الصفرة وعطر النساء لا يجوز للرجل */}
        {t >= 0.2 && t < 11.0 && (
          <Pop at={0.2}>
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
              <div style={{ fontFamily: lalezar, fontSize: 50, color: P.walnut }}>
                حكم شرعي مهم:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 36, color: P.amber, marginTop: 8 }}>
                الطيب النسائي والخَلوق والصفرة لا تجوز للرجل
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 26, color: P.ink, marginTop: 10 }}>
                إذا أصابه شيء منه من زوجته: لابد من أن يزيل أثره!
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 2: 11.0s - 20.0s -> إذا اقترب من زوجته فأصابه عطر نسائي */}
        {t >= 11.0 && t < 20.0 && (
          <Pop at={11.0}>
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
              <div style={{ fontFamily: lalezar, fontSize: 46, color: P.deepOlive }}>
                إذا علق به عطر زوجته:
              </div>
              <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 34, color: P.walnut, marginTop: 8 }}>
                إذا كانت الزوجة متعطرة فاقترب منها فأصابه العطر..
              </div>
              <div
                style={{
                  marginTop: 12,
                  background: `rgba(79, 99, 69, 0.2)`,
                  border: `2px solid ${P.olive}`,
                  padding: "10px 24px",
                  borderRadius: 16,
                  fontFamily: cairo,
                  fontWeight: 900,
                  fontSize: 32,
                  color: P.deepOlive,
                }}
              >
                يجب عليه أن يزيله قبل الخروج!
              </div>
            </div>
          </Pop>
        )}

        {/* Beat 3: 20.0s - 27.5s -> الحل العملي: إزالة العطر أو رش عطر يطغى عليه */}
        {t >= 20.0 && (
          <Pop at={20.0}>
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
              <div style={{ fontFamily: lalezar, fontSize: 46, color: P.walnut }}>
                ماذا يفعل إذا تعذر غسله؟
              </div>
              <div
                style={{
                  marginTop: 10,
                  background: `rgba(184, 125, 42, 0.2)`,
                  border: `2px solid ${P.amber}`,
                  padding: "12px 24px",
                  borderRadius: 16,
                  fontFamily: cairo,
                  fontWeight: 900,
                  fontSize: 34,
                  color: P.walnut,
                }}
              >
                يرشّ عطراً رجالياً يطغى عليه.. فلا تُشمّ منه رائحة النساء!
              </div>
            </div>
          </Pop>
        )}
      </div>

      {/* 3. Audio SFX */}
      <Sequence from={sec(0.5)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>
      <Sequence from={sec(11.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/chime.wav")} volume={SFX_LEVELS.chime} />
      </Sequence>
      <Sequence from={sec(20.0)} durationInFrames={sec(1.5)}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={SFX_LEVELS.whoosh} />
      </Sequence>

      {/* 4. Cover Image in first 3 frames */}
      <Sequence  durationInFrames={3} layout="none">
        <PerfumeCover />
      </Sequence>
    </AbsoluteFill>
  );
};
