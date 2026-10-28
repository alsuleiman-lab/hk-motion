import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";
import wordsData from "../public/fajr/fajr_words.json";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800", "900"],
  subsets: ["arabic"],
  ignoreTooManyRequestsWarning: true,
});

export const FAJR_FPS = 30;
export const FAJR_TOTAL_FRAMES = 1800; // 60 seconds

interface WordItem {
  w: string;
  s: number;
  e: number;
}

const WORDS = wordsData as WordItem[];

interface SceneConfig {
  id: string;
  image: string;
  startFrame: number;
  endFrame: number;
  badgeText: string;
  badgeIcon: string;
}

const SCENES: SceneConfig[] = [
  {
    id: "scene1",
    image: "fajr/scene1.jpg",
    startFrame: 0,
    endFrame: 246,
    badgeText: "05:32 AM • أذان الفجر",
    badgeIcon: "⏰",
  },
  {
    id: "scene2",
    image: "fajr/scene2.jpg",
    startFrame: 246,
    endFrame: 510,
    badgeText: "06:15 AM • اقتراب الشروق!",
    badgeIcon: "⚠️",
  },
  {
    id: "scene3",
    image: "fajr/scene3.jpg",
    startFrame: 510,
    endFrame: 825,
    badgeText: "تطبيق فجر • منبه النهوض الذكي",
    badgeIcon: "📱",
  },
  {
    id: "scene4",
    image: "fajr/scene4.jpg",
    startFrame: 825,
    endFrame: 1155,
    badgeText: "إيقاف المنبه بتصوير المغسلة",
    badgeIcon: "📷",
  },
  {
    id: "scene5",
    image: "fajr/scene5.jpg",
    startFrame: 1155,
    endFrame: 1470,
    badgeText: "الوضوء والاستعداد للقيام",
    badgeIcon: "💧",
  },
  {
    id: "scene6",
    image: "fajr/scene6.jpg",
    startFrame: 1470,
    endFrame: 1800,
    badgeText: "فجر • ابدأ يومك بالصلاة",
    badgeIcon: "✨",
  },
];

export const FajrAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find active scene
  const activeScene =
    SCENES.find((s) => frame >= s.startFrame && frame < s.endFrame) ||
    SCENES[SCENES.length - 1];

  // Active scene progress for smooth Ken Burns effect
  const sceneDuration = activeScene.endFrame - activeScene.startFrame;
  const sceneProgress = (frame - activeScene.startFrame) / sceneDuration;

  // Camera Motion (Ken Burns)
  const scale = interpolate(sceneProgress, [0, 1], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(sceneProgress, [0, 1], [0, -25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene transition opacity
  const fadeIn = interpolate(
    frame - activeScene.startFrame,
    [0, 15],
    [0.4, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtitles / Active spoken words (group around current time)
  // Window of active sentence or phrase
  const activeWordIdx = WORDS.findIndex(
    (w) => currentTime >= w.s && currentTime <= w.e
  );

  // Find chunk of ~5-7 words around active word for clean readable subtitle box
  let startW = Math.max(0, activeWordIdx - 3);
  if (activeWordIdx === -1) {
    // Find closest upcoming word
    const nextIdx = WORDS.findIndex((w) => w.s > currentTime);
    startW = nextIdx !== -1 ? Math.max(0, nextIdx - 2) : Math.max(0, WORDS.length - 6);
  }
  const endW = Math.min(WORDS.length, startW + 7);
  const currentWordsChunk = WORDS.slice(startW, endW);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1b2a",
        fontFamily,
        overflow: "hidden",
        direction: "rtl",
      }}
    >
      {/* 0. First 3 frames Cover Thumbnail (0.10s) */}
      {frame < 3 && (
        <AbsoluteFill
          style={{
            zIndex: 999,
            background: "linear-gradient(135deg, #091921 0%, #112d32 50%, #254b52 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 36,
              overflow: "hidden",
              border: "3px solid #ffd166",
              marginBottom: 30,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <Img
              src={staticFile("fajr/fajr_app_logo_clean.png")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              color: "#ffd166",
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: 2,
              marginBottom: 16,
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            تطبيق فَجْر
          </div>
          <div
            style={{
              color: "#f8f9fa",
              fontSize: 34,
              fontWeight: 700,
              maxWidth: 800,
              lineHeight: 1.5,
              marginBottom: 40,
            }}
          >
            أكبر مشكلة بتضيّع عليك صلاة الفجر؟ وكيف تحلها؟
          </div>
          <div
            style={{
              background: "rgba(255, 209, 102, 0.15)",
              border: "1px solid #ffd166",
              borderRadius: 30,
              padding: "14px 36px",
              color: "#ffd166",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            منبه النهوض الذكي ⏰
          </div>
        </AbsoluteFill>
      )}

      {/* 1. Background Video Audio Track */}
      <Audio src={staticFile("fajr/fajr_final_audio.mp3")} />

      {/* 2. Visual Scene Layer with Ken Burns Motion */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          opacity: fadeIn,
          filter: "brightness(0.96) contrast(1.05)",
        }}
      >
        <Img
          src={staticFile(activeScene.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* 2.1 Scene 3: Actual Fajr App Interface Screens (Frames 510 to 825) */}
      {activeScene.id === "scene3" && (
        <AbsoluteFill
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {/* Backdrop blur to highlight the app phone mockup */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(10, 20, 30, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Smartphone device frame */}
          <div
            style={{
              width: 580,
              height: 1180,
              borderRadius: 48,
              border: "8px solid #1f2937",
              boxShadow: "0 25px 70px rgba(0,0,0,0.8), 0 0 25px rgba(255, 209, 102, 0.3)",
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#f4f6f0",
              transform: `translateY(${interpolate(sceneProgress, [0, 1], [20, -10])}px)`,
            }}
          >
            {/* Top Speaker / Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 140,
                height: 22,
                backgroundColor: "#111827",
                borderRadius: 12,
                zIndex: 30,
              }}
            />

            {/* Screen 1: Home / Prayer Times (First half: frames 510 to 660) */}
            {frame < 665 ? (
              <Img
                src={staticFile("fajr/user_img_1.jpg")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              /* Screen 2: Alarm settings / Camera sink verification (Second half: frames 665 to 825) */
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Img
                  src={staticFile("fajr/user_img_3.jpg")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Glowing highlight box around 'التأكيد بالصورة - صوّر المغسلة' */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 140,
                    left: 20,
                    right: 20,
                    height: 140,
                    border: "3px solid #06d6a0",
                    borderRadius: 20,
                    boxShadow: "0 0 25px rgba(6, 214, 160, 0.6)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* 3. Cinematic Gradients / Vignette Overlays */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* 4. Top Header & Scene Badge */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: "rgba(10, 25, 47, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 215, 0, 0.35)",
            borderRadius: 30,
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontSize: 26 }}>{activeScene.badgeIcon}</span>
          <span
            style={{
              color: "#f8f9fa",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {activeScene.badgeText}
          </span>
        </div>
      </div>

      {/* 5. Scene 4 Interactive Camera Scan Overlay (Frames 825 to 1155) */}
      {activeScene.id === "scene4" && (
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            height: 380,
            border: "2px dashed rgba(6, 214, 160, 0.8)",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 16,
            boxShadow: "0 0 30px rgba(6, 214, 160, 0.25)",
            zIndex: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#06d6a0",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span>[ AI SINK SCANNER ]</span>
            <span>LIVE 🔴</span>
          </div>

          {/* Pulsing Scan Beam */}
          <div
            style={{
              height: 3,
              background: "linear-gradient(90deg, transparent, #06d6a0, transparent)",
              boxShadow: "0 0 15px #06d6a0",
              transform: `translateY(${Math.sin((frame / 10) * Math.PI) * 120}px)`,
            }}
          />

          <div
            style={{
              alignSelf: "center",
              background: "rgba(6, 214, 160, 0.9)",
              color: "#001e1d",
              padding: "6px 20px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {frame > 960 ? "✓ تم التحقق بنجاح!" : "جاري فحص المغسلة..."}
          </div>
        </div>
      )}

      {/* 6. Scene 6 Call To Action Badge (Frames 1560 to 1800) */}
      {activeScene.id === "scene6" && (
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(13, 27, 42, 0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "2px solid #e0a96d",
            borderRadius: 36,
            padding: "36px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            zIndex: 25,
            width: "82%",
          }}
        >
          {/* Official App Icon */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              overflow: "hidden",
              border: "3px solid #ffd166",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <Img
              src={staticFile("fajr/fajr_app_logo_clean.png")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#ffd166",
                fontSize: 46,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              فَجْر
            </div>
            <div
              style={{
                color: "#06d6a0",
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              (مؤذن بدون إعلانات)
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 18,
                marginTop: 2,
              }}
            >
              المطور: Din.hk
            </div>
          </div>

          {/* Store search mockup badge */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 20,
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 22 }}>🔍</span>
            <span style={{ color: "#f8f9fa", fontSize: 20, fontWeight: 700 }}>
              ابحث في Google Play عن: «فجر»
            </span>
          </div>

          <div
            style={{
              marginTop: 12,
              background: "linear-gradient(135deg, #e0a96d, #d49a5b)",
              color: "#1a0f00",
              padding: "16px 52px",
              borderRadius: 30,
              fontSize: 26,
              fontWeight: 800,
              boxShadow: "0 8px 24px rgba(224, 169, 109, 0.45)",
            }}
          >
            حمّل التطبيق الآن مجاناً 📲
          </div>
        </div>
      )}

      {/* 7. Subtitles / Word-by-Word Active Karaoke Spoken Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 40,
          right: 40,
          display: "flex",
          justifyContent: "center",
          zIndex: 30,
        }}
      >
        <div
          style={{
            background: "rgba(10, 20, 30, 0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 24,
            padding: "24px 32px",
            maxWidth: 960,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px 14px",
            lineHeight: 1.6,
          }}
        >
          {currentWordsChunk.map((word, idx) => {
            const isSpoken = currentTime >= word.s && currentTime <= word.e;
            const isPast = currentTime > word.e;

            return (
              <span
                key={`${word.w}-${idx}-${word.s}`}
                style={{
                  fontSize: 34,
                  fontWeight: isSpoken ? 900 : 700,
                  color: isSpoken
                    ? "#ffd166"
                    : isPast
                    ? "#ffffff"
                    : "rgba(255, 255, 255, 0.55)",
                  transform: isSpoken ? "scale(1.14)" : "scale(1.0)",
                  transition: "transform 0.1s ease-out, color 0.1s ease-out",
                  textShadow: isSpoken
                    ? "0 0 20px rgba(255, 209, 102, 0.8)"
                    : "0 2px 8px rgba(0,0,0,0.8)",
                  display: "inline-block",
                }}
              >
                {word.w}
              </span>
            );
          })}
        </div>
      </div>

      {/* 8. Bottom App Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          color: "rgba(255,255,255,0.7)",
          fontSize: 20,
          fontWeight: 600,
          zIndex: 30,
        }}
      >
        <span>تطبيق فجر • خطوة تساعدك تقوم لصلاة الفجر</span>
      </div>
    </AbsoluteFill>
  );
};
