import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";

const { fontFamily: cairoFont } = loadCairo();
export { cairoFont };

// Modern TikTok/Reels rounded subtitle pill
export const FastSubtitle: React.FC<{
  text: string;
  highlightWord?: string;
  highlightColor?: string;
  pillColor?: string;
  isPunch?: boolean;
}> = ({
  text,
  highlightWord,
  highlightColor = "#F59E0B",
  pillColor = "rgba(15, 15, 15, 0.92)",
  isPunch = false,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: isPunch ? 480 : 380, // Safe zone on mobile
        left: 30,
        right: 30,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: pillColor,
          borderRadius: 22,
          padding: isPunch ? "20px 48px" : "14px 34px",
          boxShadow: isPunch
            ? "0 20px 50px rgba(220, 38, 38, 0.75), 0 0 35px rgba(239, 68, 68, 0.5)"
            : "0 10px 30px rgba(0,0,0,0.7)",
          direction: "rtl",
          textAlign: "center",
          maxWidth: "94%",
          border: isPunch ? "2.5px solid #FFFFFF" : "1px solid rgba(255,255,255,0.15)",
          transform: isPunch ? "scale(1.08)" : "scale(1)",
        }}
      >
        <span
          style={{
            fontFamily: cairoFont,
            fontSize: isPunch ? 52 : 38,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.4,
          }}
        >
          {highlightWord ? (
            text.split(highlightWord).map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    style={{
                      color: highlightColor,
                      textShadow: `0 0 16px ${highlightColor}88`,
                      padding: "0 4px",
                    }}
                  >
                    {highlightWord}
                  </span>
                )}
              </React.Fragment>
            ))
          ) : (
            text
          )}
        </span>
      </div>
    </div>
  );
};

// Generic Smooth B-Roll Scene Component
export const BRollCut: React.FC<{
  imageSrc: string;
  startSec: number;
  endSec: number;
  currentSeconds: number;
  tag?: string;
  tagColor?: string;
  zoomDirection?: "in" | "out";
}> = ({
  imageSrc,
  startSec,
  endSec,
  currentSeconds,
  tag,
  tagColor = "#F59E0B",
  zoomDirection = "in",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (currentSeconds < startSec || currentSeconds >= endSec) return null;

  const startFrame = Math.floor(startSec * fps);
  const endFrame = Math.floor(endSec * fps);
  const localFrame = frame - startFrame;
  const dur = endFrame - startFrame;

  // Flash cut transition (very fast 4 frames fade)
  const opacity = interpolate(localFrame, [0, 4, dur - 4, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale =
    zoomDirection === "in"
      ? interpolate(localFrame, [0, dur], [1.0, 1.08])
      : interpolate(localFrame, [0, dur], [1.08, 1.0]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 25,
        opacity,
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(imageSrc)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* Cinematic dark gradients top & bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 30%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Top Floating Tag */}
      {tag && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10, 15, 12, 0.88)",
            border: `1.5px solid ${tagColor}`,
            borderRadius: 999,
            padding: "8px 24px",
            color: tagColor,
            fontFamily: cairoFont,
            fontSize: 20,
            fontWeight: 800,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
          }}
        >
          {tag}
        </div>
      )}
    </div>
  );
};

// Minimalist Top Channel Badge (Clean and never covers beard or chest)
export const CleanChannelBadge: React.FC<{ currentSeconds: number }> = ({ currentSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isStart = currentSeconds <= 3.5;
  const isEnd = currentSeconds >= 34.0;

  if (!isStart && !isEnd) return null;

  const localFrame = isStart ? frame : frame - Math.floor(34.0 * fps);
  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: "50%",
        transform: `translateX(-50%) scale(${entrance})`,
        opacity: entrance,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(15, 23, 42, 0.88)",
        border: "1.5px solid #F59E0B",
        borderRadius: 999,
        padding: "10px 28px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: 22 }}>🕌</span>
      <span
        style={{
          fontFamily: cairoFont,
          fontSize: 22,
          fontWeight: 800,
          color: "#FFFFFF",
          direction: "rtl",
        }}
      >
        الشيخ محمد بن شمس الدين
      </span>
    </div>
  );
};
