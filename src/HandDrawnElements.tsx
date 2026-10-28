import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** دائرة بيضاوية مرسومة يدوياً متحركة بـ SVG dashoffset */
export const HandDrawnOval: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  startFrame?: number;
}> = ({ width = 360, height = 120, color = "#facc15", strokeWidth = 5, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 15, mass: 0.8 },
  });

  const perimeter = 850;
  const strokeDashoffset = interpolate(progress, [0, 1], [perimeter, 0]);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 120"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-2deg)",
        pointerEvents: "none",
        filter: `drop-shadow(0 0 12px ${color})`,
      }}
    >
      <ellipse
        cx="180"
        cy="60"
        rx="165"
        ry="48"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={perimeter}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};

/** سهم يدوي منحنٍ متحرك */
export const HandDrawnArrow: React.FC<{
  color?: string;
  startFrame?: number;
}> = ({ color = "#38bdf8", startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14 },
  });

  const length = 400;
  const offset = interpolate(progress, [0, 1], [length, 0]);

  return (
    <svg
      width="240"
      height="100"
      viewBox="0 0 240 100"
      style={{
        filter: `drop-shadow(0 0 10px ${color})`,
        pointerEvents: "none",
      }}
    >
      <path
        d="M 20 80 Q 120 20 210 60"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={offset}
      />
      <polygon
        points="225,65 205,50 215,75"
        fill={color}
        style={{
          opacity: interpolate(progress, [0.8, 1], [0, 1]),
          transform: `scale(${interpolate(progress, [0.8, 1], [0, 1])})`,
          transformOrigin: "215px 65px",
        }}
      />
    </svg>
  );
};
