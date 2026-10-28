import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";
import {
  brollCards,
  FPS,
  lowerThirds,
  subscribeMoments,
  zoomIntervals,
} from "./ahmedData";

const { fontFamily } = loadFont();

// Islamic-themed luxury color palette
const C = {
  gold: "#e0bb62",
  goldLight: "#f4dc96",
  goldDark: "#9c7625",
  teal: "#0d5c52",
  tealDark: "#062b26",
  navy: "#0a192f",
  red: "#cc2b2b",
  glassBg: "rgba(10, 25, 47, 0.88)",
  glassBorder: "rgba(224, 187, 98, 0.45)",
};

// Calculate active zoom smoothly (1.00 -> 1.10)
const useActiveZoom = (frame: number): number => {
  for (const z of zoomIntervals) {
    if (frame >= z.from - 15 && frame <= z.from + z.dur + 15) {
      const enter = interpolate(frame, [z.from, z.from + 15], [1, z.scale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const exit = interpolate(
        frame,
        [z.from + z.dur - 15, z.from + z.dur],
        [z.scale, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );
      if (frame < z.from + 15) return enter;
      if (frame > z.from + z.dur - 15) return exit;
      return z.scale;
    }
  }
  return 1.0;
};

// Lower Third Card Component
const LowerThirdItem: React.FC<{
  title: string;
  subtitle?: string;
  type: string;
  dur: number;
}> = ({ title, subtitle, type, dur }) => {
  const f = useCurrentFrame();
  const enter = spring({
    frame: f,
    fps: FPS,
    config: { damping: 16, stiffness: 120 },
  });
  const exit = interpolate(f, [dur - 15, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isSpeaker = type === "speaker";
  const isWarning = type === "warning";
  const accentColor = isSpeaker ? C.teal : isWarning ? C.red : C.gold;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        right: 60,
        direction: "rtl",
        fontFamily,
        transform: `translateY(${(1 - enter) * 60}px) scale(${0.92 + 0.08 * enter})`,
        opacity: Math.min(enter, 1) * exit,
        background: C.glassBg,
        backdropFilter: "blur(14px)",
        border: `2px solid ${C.glassBorder}`,
        borderRight: `8px solid ${accentColor}`,
        borderRadius: 16,
        padding: "18px 32px 18px 28px",
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.65)",
        maxWidth: 820,
        zIndex: 50,
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: isSpeaker ? 36 : 32,
          fontWeight: 800,
          lineHeight: 1.35,
          letterSpacing: "0.2px",
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            color: C.goldLight,
            fontSize: 22,
            fontWeight: 600,
            marginTop: 6,
            lineHeight: 1.3,
            opacity: 0.95,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

// B-Roll Overlay Card for Figures
const BRollOverlay: React.FC<{
  image: string;
  title: string;
  caption: string;
  dur: number;
  position: "top-left" | "top-right";
}> = ({ image, title, caption, dur, position }) => {
  const f = useCurrentFrame();
  const enter = spring({
    frame: f,
    fps: FPS,
    config: { damping: 14, stiffness: 100 },
  });
  const exit = interpolate(f, [dur - 15, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const posStyle =
    position === "top-left"
      ? { top: 60, left: 60 }
      : { top: 60, right: 60 };

  return (
    <div
      style={{
        position: "absolute",
        ...posStyle,
        direction: "rtl",
        fontFamily,
        transform: `scale(${0.85 + 0.15 * enter}) translateY(${(1 - enter) * -40}px)`,
        opacity: Math.min(enter, 1) * exit,
        background: C.glassBg,
        backdropFilter: "blur(16px)",
        border: `2px solid ${C.gold}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
        width: 340,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 280,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(224, 187, 98, 0.3)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
          background: "#000",
        }}
      >
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 14,
          textAlign: "center",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: C.goldLight,
          fontSize: 18,
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {caption}
      </div>
    </div>
  );
};

// Subscription Bell Pill
const SubscribePill: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const enter = spring({
    frame: f,
    fps: FPS,
    config: { damping: 12, stiffness: 130 },
  });
  const exit = interpolate(f, [dur - 12, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bell = Math.sin(f / 2.5) * 18 * Math.exp(-(f % 40) / 12);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 60,
        direction: "rtl",
        fontFamily,
        transform: `scale(${enter}) translateY(${(1 - exit) * -30}px)`,
        opacity: exit,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "linear-gradient(135deg, #d32f2f, #b71c1c)",
        color: "#ffffff",
        borderRadius: 999,
        padding: "14px 32px",
        fontSize: 26,
        fontWeight: 800,
        boxShadow: "0 10px 30px rgba(211, 47, 47, 0.45)",
        zIndex: 40,
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `rotate(${bell}deg)`,
          transformOrigin: "top center",
          fontSize: 30,
        }}
      >
        🔔
      </span>
      اشترك في القناة
    </div>
  );
};

export const AhmedComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = useActiveZoom(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Main Video with smooth zoom and color enhancement */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center 38%",

          // Quality and lighting enhancement filters
          filter: "brightness(1.06) contrast(1.08) saturate(1.05)"
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

      {/* Subtle top and bottom cinematic gradient protection for overlays */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 18%, transparent 80%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Lower Thirds Sequences */}
      {lowerThirds.map((lt) => (
        <Sequence key={lt.id} from={lt.from} durationInFrames={lt.dur}>
          <LowerThirdItem
            title={lt.title}
            subtitle={lt.subtitle}
            type={lt.type}
            dur={lt.dur}
          />
        </Sequence>
      ))}

      {/* B-Roll Card Overlays */}
      {brollCards.map((bc) => (
        <Sequence key={bc.id} from={bc.from} durationInFrames={bc.dur}>
          <BRollOverlay
            image={bc.image}
            title={bc.title}
            caption={bc.caption}
            dur={bc.dur}
            position={bc.position}
          />
        </Sequence>
      ))}

      {/* Channel Subscribe Prompts */}
      {subscribeMoments.map(([from, dur], idx) => (
        <Sequence key={`sub-${idx}`} from={from} durationInFrames={dur}>
          <SubscribePill dur={dur} />
        </Sequence>
      ))}

      {/* Light SFX (strictly <= 20% volume, from public/sfx) */}
      {lowerThirds.map((lt) => (
        <Sequence key={`sfx-lt-${lt.id}`} from={lt.from} durationInFrames={25}>
          <Audio src={staticFile("sfx/chime.wav")} volume={0.12} />
        </Sequence>
      ))}

      {brollCards.map((bc) => (
        <Sequence key={`sfx-bc-${bc.id}`} from={bc.from} durationInFrames={25}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.16} />
        </Sequence>
      ))}

      {subscribeMoments.map(([from], idx) => (
        <Sequence key={`sfx-sub-${idx}`} from={from} durationInFrames={25}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.12} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
