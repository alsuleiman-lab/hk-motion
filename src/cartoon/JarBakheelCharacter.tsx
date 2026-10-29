import React from "react";
import { Img, interpolate, staticFile } from "remotion";

export interface CharacterProps {
  frame: number;
  role: "neighbor" | "miser";
  pose: "hands_up" | "point_talk" | "hands_hips" | "hands_folded" | "shrug_spread" | "hands_behind";
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  isSpeaker?: boolean;
  action?: string;
}

export const JarBakheelCharacter: React.FC<CharacterProps> = ({
  frame,
  role,
  pose,
  x,
  y,
  scale = 1.0,
  flip = false,
  isSpeaker = false,
  action = "idle",
}) => {
  // Gentle subtle breathing - NO whole-body trembling/bouncing
  const breathe = Math.sin(frame * 0.08) * 2;
  const totalY = y + breathe;

  // Walk cycle leg swing if walking
  const isWalking = action === "walk_in";
  const legCycle = isWalking ? Math.sin(frame * 0.4) : 0;
  const leg1Angle = legCycle * 25;
  const leg2Angle = -legCycle * 25;

  // Animated mouth movement (lip-sync):
  // When speaker is active, mouth opens and closes dynamically with syllable rhythm.
  // When listening / silent, mouth stays closed.
  const mouthCycle = Math.floor(frame / 3) % 3;
  const isMouthOpen = isSpeaker && mouthCycle !== 0;
  const mouthSuffix = isMouthOpen ? "" : "_closed";

  const prefix = role === "miser" ? "miser_" : "";
  const spriteFile = staticFile(`jar_bakheel/${prefix}${pose}${mouthSuffix}.png`);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: totalY,
        transform: `translate(-50%, -50%) scale(${scale}) scaleX(${flip ? -1 : 1})`,
        transformOrigin: "bottom center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      {/* Upper Body Sprite */}
      <div style={{ position: "relative", width: 340, height: 260, display: "flex", justifyContent: "center" }}>
        <Img
          src={spriteFile}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))",
          }}
        />

        {/* Emotion Effects overlay */}
        {action === "hands_up_refuse" && (
          <div
            style={{
              position: "absolute",
              top: -30,
              right: 20,
              fontSize: 54,
              animation: "none",
            }}
          >
            💢
          </div>
        )}

        {action === "point_accuse" && (
          <div
            style={{
              position: "absolute",
              top: -40,
              left: 40,
              fontSize: 52,
            }}
          >
            ❗
          </div>
        )}

        {action === "shrug_spread" && (
          <div
            style={{
              position: "absolute",
              top: -40,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 54,
            }}
          >
            ❓
          </div>
        )}
      </div>

      {/* Grounded Stick Legs matching ink line thickness */}
      <svg width="240" height="240" style={{ marginTop: -15, overflow: "visible" }}>
        {/* Ground shadow */}
        <ellipse cx="120" cy="230" rx="90" ry="16" fill="#0f172a" opacity="0.3" />

        {/* Left Leg */}
        <g transform={`rotate(${leg1Angle}, 95, 10)`}>
          <line x1="95" y1="10" x2="95" y2="200" stroke="#000000" strokeWidth="14" strokeLinecap="round" />
          {/* Shoe */}
          <ellipse cx="80" cy="210" rx="32" ry="14" fill="#0f172a" stroke="#000000" strokeWidth="4" />
        </g>

        {/* Right Leg */}
        <g transform={`rotate(${leg2Angle}, 145, 10)`}>
          <line x1="145" y1="10" x2="145" y2="200" stroke="#000000" strokeWidth="14" strokeLinecap="round" />
          {/* Shoe */}
          <ellipse cx="160" cy="210" rx="32" ry="14" fill="#0f172a" stroke="#000000" strokeWidth="4" />
        </g>
      </svg>
    </div>
  );
};

