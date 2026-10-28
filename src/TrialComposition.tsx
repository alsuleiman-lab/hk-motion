import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";
import {
  cameraCuts,
  FPS,
  kineticTitles,
} from "./trialData";

const { fontFamily } = loadFont();

// Modern YouTube Theme Colors (Ghanayem aesthetic)
const G = {
  accentGold: "#f3c64c",
  accentAmber: "#f59e0b",
  accentRed: "#ef4444",
  accentBlue: "#0ea5e9",
  cardBg: "rgba(15, 23, 42, 0.90)",
  cardBorder: "rgba(243, 198, 76, 0.40)",
  darkGlass: "rgba(0, 0, 0, 0.78)",
};

// Calculate current camera angle framing
const useCameraFraming = (frame: number): { scale: number; origin: string } => {
  for (const cut of cameraCuts) {
    if (frame >= cut.from && frame < cut.from + cut.dur) {
      return { scale: cut.scale, origin: cut.origin };
    }
  }
  return { scale: 1.0, origin: "center 38%" };
};

// Ghanayem-style Kinetic Title Component
const KineticBadge: React.FC<{
  mainText: string;
  highlightText?: string;
  subText?: string;
  style: "quote" | "statement" | "speaker" | "topic";
  dur: number;
}> = ({ mainText, highlightText, subText, style, dur }) => {
  const f = useCurrentFrame();

  // Snappy spring entry (characteristic of fast modern YouTube edits)
  const enter = spring({
    frame: f,
    fps: FPS,
    config: { damping: 13, stiffness: 150 },
  });
  const exit = interpolate(f, [dur - 10, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isQuote = style === "quote";
  const isSpeaker = style === "speaker";

  const borderColor = isQuote
    ? G.accentRed
    : isSpeaker
    ? G.accentGold
    : G.accentAmber;

  return (
    <div
      style={{
        position: "absolute",
        bottom: isSpeaker ? 60 : 70,
        right: isSpeaker ? 60 : "auto",
        left: isSpeaker ? "auto" : "50%",
        transform: isSpeaker
          ? `translateY(${(1 - enter) * 50}px) scale(${0.9 + 0.1 * enter})`
          : `translateX(-50%) translateY(${(1 - enter) * 45}px) scale(${
              0.92 + 0.08 * enter
            })`,
        opacity: Math.min(enter, 1) * exit,
        direction: "rtl",
        fontFamily,
        background: G.cardBg,
        backdropFilter: "blur(18px)",
        border: `2px solid ${borderColor}`,
        borderRadius: 20,
        padding: isSpeaker ? "16px 30px" : "20px 42px",
        boxShadow: `0 18px 45px rgba(0, 0, 0, 0.75), 0 0 20px ${borderColor}25`,
        maxWidth: 960,
        textAlign: isSpeaker ? "right" : "center",
        zIndex: 50,
      }}
    >
      {/* Top Tag for Quotes */}
      {isQuote && (
        <div
          style={{
            display: "inline-block",
            background: G.accentRed,
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            padding: "4px 14px",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          اقتباس موثق
        </div>
      )}

      {/* Main Bold Text */}
      <div
        style={{
          color: isQuote ? "#ffdede" : "#ffffff",
          fontSize: isSpeaker ? 34 : 36,
          fontWeight: 900,
          lineHeight: 1.35,
          letterSpacing: "0.2px",
          textShadow: "0 3px 10px rgba(0,0,0,0.6)",
        }}
      >
        {mainText}
      </div>

      {/* Highlight or Subtext */}
      {highlightText && (
        <div
          style={{
            color: G.accentGold,
            fontSize: 22,
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          {highlightText}
        </div>
      )}
      {subText && (
        <div
          style={{
            color: "#cbd5e1",
            fontSize: 20,
            fontWeight: 600,
            marginTop: 6,
            opacity: 0.95,
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
};

export const TrialComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { scale, origin } = useCameraFraming(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Video with Snappy Camera Cuts & Polished Grading */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: origin,
          filter: "contrast(1.10) brightness(1.05) saturate(1.06)",
        }}
      >
        <OffthreadVideo
          src={staticFile("ahmed_clean.mp4")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Subtle YouTube-style Edge Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 65%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Kinetic Titles */}
      {kineticTitles.map((item) => (
        <Sequence key={item.id} from={item.from} durationInFrames={item.dur}>
          <KineticBadge
            mainText={item.mainText}
            highlightText={item.highlightText}
            subText={item.subText}
            style={item.style}
            dur={item.dur}
          />
        </Sequence>
      ))}

      {/* Sound Effects: Whoosh on Camera Punch Cuts (14% volume) */}
      {cameraCuts
        .filter((c) => c.scale > 1.0)
        .map((c, i) => (
          <Sequence key={`cut-sfx-${i}`} from={c.from} durationInFrames={20}>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.14} />
          </Sequence>
        ))}

      {/* Sound Effects: Pop on Kinetic Title Entries (12% volume) */}
      {kineticTitles.map((t) => (
        <Sequence key={`title-sfx-${t.id}`} from={t.from} durationInFrames={20}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.12} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
