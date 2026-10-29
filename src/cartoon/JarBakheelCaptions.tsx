import React from "react";
import { FONT_TITLE } from "../localFonts";
import { CAPTIONS, getCurrentBeat } from "./JarBakheelStory";

export interface CaptionsProps {
  time: number;
}

export const JarBakheelCaptions: React.FC<CaptionsProps> = ({ time }) => {
  // Find current active caption cue
  const activeCue = CAPTIONS.find((c) => time >= c.from && time < c.to);
  if (!activeCue) return null;

  // Words that have spoken up to this exact moment
  const visibleWords = activeCue.words.filter((w) => time >= w.at);
  if (visibleWords.length === 0) return null;

  const currentBeat = getCurrentBeat(time);
  const speaker = currentBeat.speaker;

  // Speaker badge
  const speakerLabel =
    speaker === "neighbor"
      ? "🗣️ الجار المعترض"
      : speaker === "miser"
      ? "🤐 الجار البخيل"
      : speaker === "narrator"
      ? "🎙️ الراوي (الشيخ صالح آل الشيخ)"
      : "";

  const speakerColor =
    speaker === "neighbor"
      ? "#0284c7"
      : speaker === "miser"
      ? "#b45309"
      : "#475569";

  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        top: 80,
        left: 60,
        right: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 200,
        filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.4))",
      }}
    >
      {/* Speaker Tag */}
      {speakerLabel && (
        <div
          style={{
            alignSelf: "flex-start",
            marginBottom: 8,
            marginRight: 20,
            background: speakerColor,
            color: "#ffffff",
            padding: "6px 22px",
            borderRadius: "16px 16px 4px 4px",
            fontFamily: FONT_TITLE(),
            fontSize: 26,
            fontWeight: 800,
            border: "3px solid #0f172a",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          {speakerLabel}
        </div>
      )}

      {/* Main Subtitle Box */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#ffffff",
          border: "5px solid #0f172a",
          borderRadius: 28,
          padding: "20px 36px",
          textAlign: "center",
          fontFamily: FONT_TITLE(),
          fontSize: 48,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.45,
          minHeight: 110,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {visibleWords.map((w, i) => {
          const isLatest = i === visibleWords.length - 1;
          return (
            <span
              key={i}
              style={{
                margin: "0 8px",
                display: "inline-block",
                color: isLatest ? speakerColor : "#0f172a",
                transform: isLatest ? "scale(1.06)" : "scale(1)",
                transition: "transform 0.1s ease",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

