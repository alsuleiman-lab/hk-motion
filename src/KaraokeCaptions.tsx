import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export interface CaptionWord {
  w: string;
  s: number;
  e: number;
}

export interface CaptionChunk {
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
}

interface KaraokeCaptionsProps {
  chunks: CaptionChunk[];
  bottom?: number;
}

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({ chunks, bottom = 180 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find active chunk
  const activeChunk = chunks.find((c) => currentTime >= c.start && currentTime <= c.end);

  if (!activeChunk) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        right: 36,
        bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        direction: "rtl",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(6, 14, 24, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1.5px solid rgba(255, 255, 255, 0.18)",
          borderRadius: 24,
          padding: "12px 28px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.8)",
          maxWidth: 960,
        }}
      >
        {activeChunk.words.map((word, idx) => {
          const isSpoken = currentTime >= word.s && currentTime < word.e;

          return (
            <span
              key={`${idx}-${word.w}`}
              style={{
                fontFamily: "Almarai, sans-serif",
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.35,
                color: isSpoken ? "#facc15" : "#ffffff",
                background: isSpoken ? "rgba(250, 204, 21, 0.16)" : "transparent",
                borderRadius: 10,
                padding: "2px 8px",
                transform: isSpoken ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.1s ease-out, color 0.1s ease-out",
                textShadow: isSpoken
                  ? "0 0 20px rgba(250, 204, 21, 0.8), 0 2px 8px rgba(0,0,0,0.9)"
                  : "0 2px 8px rgba(0, 0, 0, 0.9)",
              }}
            >
              {word.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
