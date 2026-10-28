import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { amiri, cairo } from "../Scenes";
import { lalezar } from "../RefStyle";

export const NASR_FPS = 30;
export const NASR_TOTAL_FRAMES = 1048; // 34.95 seconds

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
  // 1. Basmala [0.0 - 7.56s]
  {
    id: 1,
    startSec: 0.0,
    endSec: 7.56,
    verseArabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    type: "speaker",
    tag: "تِلَاوَةٌ خَاشِعَةٌ",
    tagColor: "#f5b723",
  },
  // 2. Verse 1 [7.56 - 14.80s]
  {
    id: 2,
    startSec: 7.56,
    endSec: 14.8,
    verseArabic: "﴿ إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴾",
    verseNum: "١",
    type: "broll",
    brollImg: "broll/kaaba.jpg",
    tag: "✨ نَصْرُ اللهِ وَفَتْحُ مَكَّةَ",
    tagColor: "#10b981",
  },
  // 3. Verse 2 [14.80 - 23.48s]
  {
    id: 3,
    startSec: 14.8,
    endSec: 23.48,
    verseArabic: "﴿ وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ﴾",
    verseNum: "٢",
    type: "speaker",
    tag: "🤲 انْتِشَارُ الإِسْلَامِ وَدُخُولُ النَّاسِ",
    tagColor: "#38bdf8",
  },
  // 4. Verse 3 [23.48 - 32.80s]
  {
    id: 4,
    startSec: 23.48,
    endSec: 32.8,
    verseArabic:
      "﴿ فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا ﴾",
    verseNum: "٣",
    type: "broll",
    brollImg: "broll/falaq_dawn.jpg",
    tag: "✨ التَّسْبِيحُ وَالِاسْتِغْفَارُ",
    tagColor: "#f59e0b",
  },
  // 5. Outro [32.80 - 34.95s]
  {
    id: 5,
    startSec: 32.8,
    endSec: 34.95,
    verseArabic: "صَدَقَ اللَّهُ الْعَظِيمُ",
    type: "outro",
    tag: "سُورَةُ النَّصْرِ كَامِلَةً",
    tagColor: "#f5b723",
  },
];

export const DeedatNasrShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const activeCut =
    cuts.find((c) => currentSec >= c.startSec && currentSec < c.endSec) ||
    cuts[0];
  const cutProgress =
    (currentSec - activeCut.startSec) /
    Math.max(0.1, activeCut.endSec - activeCut.startSec);

  const cutFrame = Math.max(
    0,
    Math.floor((currentSec - activeCut.startSec) * fps)
  );
  const enterSpring = spring({
    frame: cutFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

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
      <Audio src={staticFile("deedat_nasr_audio.wav")} />

      {activeCut.type === "broll" && activeCut.brollImg ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={staticFile(activeCut.brollImg)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${brollZoom})`,
              filter: "brightness(0.65) contrast(1.15)",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 30%, rgba(13,19,34,0.85) 100%)",
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 60%, #070a13 100%)",
          }}
        >
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

      {/* Top Header Badge */}
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
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(245, 183, 35, 0.2)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
          width: "max-content",
          maxWidth: "90%",
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
            تِلَاوَةٌ عَذْبَةٌ خَاشِعَةٌ • سُورَةُ النَّصْرِ
          </span>
        </div>
      </div>

      {/* Speaker Avatar Card */}
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
          <div
            style={{
              position: "absolute",
              width: 410,
              height: 410,
              borderRadius: "50%",
              border: "2px solid rgba(245, 183, 35, 0.4)",
              top: -15,
              transform: `scale(${1.0 + 0.04 * Math.sin(frame * 0.1)})`,
              opacity: 0.8,
            }}
          />
        </div>
      )}

      {/* Tag Pill */}
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

      {/* Main Quranic Verse Card */}
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
            fontSize: activeCut.id === 1 ? 52 : 54,
            color: "#ffffff",
            lineHeight: 1.5,
            textShadow:
              "0 4px 18px rgba(0,0,0,0.8), 0 0 20px rgba(245,183,35,0.4)",
          }}
        >
          {activeCut.verseArabic}
        </span>
      </div>

      {/* Outro */}
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
            سُورَةُ النَّصْرِ كَامِلَةً
          </h2>
          <p
            style={{
              fontFamily: cairo,
              fontSize: 26,
              color: "#f5b723",
              fontWeight: 700,
              margin: 0,
            }}
          >
            بِصَوْتِ الشَّيْخِ أَحْمَد دِيدَات رحمه الله
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
