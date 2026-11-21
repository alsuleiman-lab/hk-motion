import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { amiri, cairo } from "../Scenes";
import { lalezar } from "../RefStyle";

export const FALAQ_FPS = 30;
export const FALAQ_TOTAL_FRAMES = 998; // 33.26 seconds

interface VerseCut {
  id: number;
  startSec: number;
  endSec: number;
  verseArabic: string;
  verseNum?: string;
  type: "broll" | "speaker" | "outro";
  brollImg?: string;
  tag?: string;
  tagColor?: string;
}

const cuts: VerseCut[] = [
  // 1. Basmala [0.0 - 6.5s]
  {
    id: 1,
    startSec: 0.0,
    endSec: 6.5,
    verseArabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    type: "speaker",
    tag: "تِلَاوَةٌ خَاشِعَةٌ",
    tagColor: "#f5b723",
  },
  // 2. Verse 1 [6.5 - 10.4s]
  {
    id: 2,
    startSec: 6.5,
    endSec: 10.4,
    verseArabic: "﴿ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴾",
    verseNum: "١",
    type: "broll",
    brollImg: "broll/falaq_dawn.jpg",
    tag: "🌅 إِشْرَاقُ الفَلَقِ",
    tagColor: "#f59e0b",
  },
  // 3. Verse 2 [10.4 - 14.3s]
  {
    id: 3,
    startSec: 10.4,
    endSec: 14.3,
    verseArabic: "﴿ مِن شَرِّ مَا خَلَقَ ﴾",
    verseNum: "٢",
    type: "speaker",
    tag: "🛡️ الِاسْتِعَاذَةُ بِاللهِ",
    tagColor: "#10b981",
  },
  // 4. Verse 3 [14.3 - 19.8s]
  {
    id: 4,
    startSec: 14.3,
    endSec: 19.8,
    verseArabic: "﴿ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴾",
    verseNum: "٣",
    type: "broll",
    brollImg: "broll/ghasiq_night.jpg",
    tag: "🌙 غَسَقُ اللَّيْلِ",
    tagColor: "#38bdf8",
  },
  // 5. Verse 4 [19.8 - 26.5s]
  {
    id: 5,
    startSec: 19.8,
    endSec: 26.5,
    verseArabic: "﴿ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴾",
    verseNum: "٤",
    type: "speaker",
    tag: "⚠️ التَّحْصِينُ مِنَ الشُّرُورِ",
    tagColor: "#ef4444",
  },
  // 6. Verse 5 [26.5 - 31.4s]
  {
    id: 6,
    startSec: 26.5,
    endSec: 31.4,
    verseArabic: "﴿ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴾",
    verseNum: "٥",
    type: "broll",
    brollImg: "broll/falaq_dawn.jpg",
    tag: "✨ كِفَايَةُ اللهِ لِعَبْدِهِ",
    tagColor: "#10b981",
  },
  // 7. Outro [31.4 - 33.26s]
  {
    id: 7,
    startSec: 31.4,
    endSec: 33.26,
    verseArabic: "صَدَقَ اللَّهُ الْعَظِيمُ",
    type: "outro",
    tag: "قَنَاةُ مُحَمَّدِ بْنِ شَمْسِ الدِّينِ",
    tagColor: "#f5b723",
  },
];

export const DeedatFalaqShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  // Active cut
  const activeCut =
    cuts.find((c) => currentSec >= c.startSec && currentSec < c.endSec) ||
    cuts[0];
  const cutProgress = (currentSec - activeCut.startSec) / Math.max(0.1, activeCut.endSec - activeCut.startSec);

  // Transition spring
  const cutFrame = Math.max(0, Math.floor((currentSec - activeCut.startSec) * fps));
  const enterSpring = spring({
    frame: cutFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Zoom motion for B-roll (Smooth 1.0 -> 1.08)
  const brollZoom = interpolate(cutProgress, [0, 1], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1322",
        overflow: "hidden",
        direction: "rtl",
        fontFamily: cairo,
      }}
    >
      {/* Sound source */}
      <Audio src={staticFile("deedat_falaq_audio.wav")} />

      {/* SFX transitions */}
      {cuts.map((c, i) => {
        if (i === 0) return null;
        const triggerFrame = Math.floor(c.startSec * fps);
        return null;
      })}

      {/* 1. Background Visual Layer */}
      {activeCut.type === "broll" && activeCut.brollImg ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={staticFile(activeCut.brollImg)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${brollZoom})`,
              filter: "brightness(0.72) contrast(1.1)",
            }}
          />
          {/* Vignette & Gradient Overlays */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 30%, rgba(13,19,34,0.85) 100%)",
            }}
          />
        </AbsoluteFill>
      ) : (
        /* Speaker & Islamic Theme Gradient Background */
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 60%, #070a13 100%)",
          }}
        >
          {/* Subtle gold grid/dots */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(rgba(245, 183, 35, 0.12) 1.5px, transparent 1.5px)",
              backgroundSize: "36px 36px",
              opacity: 0.6,
            }}
          />
        </AbsoluteFill>
      )}

      {/* 2. Top Header Badge: Sheikh Ahmed Deedat */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "rgba(15, 23, 42, 0.85)",
          border: "2px solid rgba(245, 183, 35, 0.4)",
          borderRadius: 40,
          padding: "10px 24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(245, 183, 35, 0.2)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <Img
          src={staticFile("broll/deedat_portrait.png")}
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #f5b723",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: lalezar,
              fontSize: 26,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            الشَّيْخُ أَحْمَد دِيدَات رحمه الله
          </span>
          <span style={{ fontSize: 16, color: "#f5b723", fontWeight: 700 }}>
            تِلَاوَةٌ عَذْبَةٌ خَاشِعَةٌ • سُورَةُ الفَلَقِ
          </span>
        </div>
      </div>

      {/* 3. Center Speaker Card (when cut is 'speaker') */}
      {activeCut.type === "speaker" && (
        <div
          style={{
            position: "absolute",
            top: 260,
            left: "50%",
            transform: `translateX(-50%) scale(${enterSpring})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: "50%",
              overflow: "hidden",
              border: "6px solid #f5b723",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(245, 183, 35, 0.35)",
              background: "#0f172a",
              position: "relative",
            }}
          >
            <Img
              src={staticFile("broll/deedat_portrait.png")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${1.05 + 0.05 * Math.sin(frame * 0.08)})`,
              }}
            />
          </div>
          {/* Animated pulsing voice ripple */}
          <div
            style={{
              position: "absolute",
              width: 410,
              height: 410,
              borderRadius: "50%",
              border: "2px solid rgba(245, 183, 35, 0.4)",
              top: -15,
              animation: "none",
              transform: `scale(${1.0 + 0.04 * Math.sin(frame * 0.1)})`,
              opacity: 0.8,
            }}
          />
        </div>
      )}

      {/* 4. Verse Category Tag Pill */}
      {activeCut.tag && (
        <div
          style={{
            position: "absolute",
            bottom: 380,
            left: "50%",
            transform: `translateX(-50%) translateY(${(1 - enterSpring) * 20}px)`,
            background: activeCut.tagColor || "#f5b723",
            color: "#0b0f19",
            fontFamily: cairo,
            fontWeight: 800,
            fontSize: 22,
            padding: "8px 26px",
            borderRadius: 30,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 60,
          }}
        >
          {activeCut.tag}
        </div>
      )}

      {/* 5. Main Quranic Verse Card */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 40,
          right: 40,
          background: "rgba(10, 16, 30, 0.92)",
          border: "3px solid rgba(245, 183, 35, 0.6)",
          borderRadius: 28,
          padding: "36px 30px",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.8), 0 0 35px rgba(245, 183, 35, 0.25)",
          backdropFilter: "blur(18px)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          zIndex: 60,
          transform: `scale(${enterSpring})`,
        }}
      >
        <span
          style={{
            fontFamily: amiri,
            fontWeight: 700,
            fontSize: activeCut.id === 1 ? 52 : 56,
            color: "#ffffff",
            lineHeight: 1.5,
            textShadow: "0 4px 18px rgba(0,0,0,0.8), 0 0 20px rgba(245,183,35,0.4)",
          }}
        >
          {activeCut.verseArabic}
        </span>
      </div>

      {/* 6. Outro Card for Channel & Subscribe */}
      {activeCut.type === "outro" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(11, 15, 25, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            zIndex: 80,
          }}
        >
          <Img
            src={staticFile("broll/deedat_portrait.png")}
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "4px solid #f5b723",
              boxShadow: "0 0 40px rgba(245, 183, 35, 0.6)",
            }}
          />
          <h2
            style={{
              fontFamily: lalezar,
              fontSize: 54,
              color: "#fff",
              margin: 0,
            }}
          >
            سُورَةُ الفَلَقِ كَامِلَةً
          </h2>
          <div
            style={{
              background: "linear-gradient(135deg, #f5b723, #d99b10)",
              color: "#000",
              fontWeight: 900,
              fontSize: 32,
              padding: "16px 42px",
              borderRadius: 40,
              boxShadow: "0 10px 30px rgba(245, 183, 35, 0.4)",
              fontFamily: cairo,
            }}
          >
            🔔 اشْتَرِكْ فِي القَنَاةِ وَفَعِّلِ الجَرَسَ
          </div>
        </div>
      )}


      {/* 8. First 3 Frames (0.10s) Cover Art (User Rule) */}
      {frame < 3 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#0d1322",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            zIndex: 9999,
          }}
        >
          <Img
            src={staticFile("broll/deedat_portrait.png")}
            style={{
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: "8px solid #f5b723",
              boxShadow: "0 0 60px rgba(245, 183, 35, 0.7)",
            }}
          />
          <h1
            style={{
              fontFamily: lalezar,
              fontSize: 68,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.2,
              padding: "0 40px",
              textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            سُورَةُ الفَلَقِ
            <br />
            <span style={{ fontSize: 46, color: "#f5b723" }}>
              بِنَبْرَةِ الشَّيْخِ أَحْمَد دِيدَات رحمه الله
            </span>
          </h1>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
