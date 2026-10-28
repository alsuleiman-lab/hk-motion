import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_TITLE } from "./localFonts";
import { BidahEnvironment } from "./cartoon/BidahEnvironment";
import { YouthCutout, SheikhCutout, FriendCutout } from "./cartoon/BidahCharacters";
import {
  CAPTIONS,
  getBeat,
  speechPulse,
  BIDAH_FPS,
  BIDAH_TOTAL_FRAMES,
} from "./cartoon/bidahStory";

export { BIDAH_FPS, BIDAH_TOTAL_FRAMES };

const Gfx: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>{children}</AbsoluteFill>
);

// Comic Speech Bubble Component
interface ComicBubbleProps {
  speaker: string;
  time: number;
}

const ComicSpeechBubble: React.FC<ComicBubbleProps> = ({ speaker, time }) => {
  const currentCue = CAPTIONS.find((c) => time >= c.from && time < c.to);
  if (!currentCue) return null;

  const visibleWords = currentCue.words.filter((w) => time >= w.at);
  if (visibleWords.length === 0) return null;

  const isYouth = speaker === "youth";
  const isFriend = speaker === "friend";

  const bubbleColor = isYouth ? "#fffbeb" : isFriend ? "#f0f9ff" : "#ffffff";
  const borderColor = isYouth ? "#f59e0b" : isFriend ? "#0284c7" : "#b91c1c";
  const tailX = isYouth ? 680 : isFriend ? 260 : 380;

  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        left: 70,
        right: 70,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 200,
        filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.5))",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: bubbleColor,
          border: `5px solid ${borderColor}`,
          borderRadius: 32,
          padding: "20px 42px",
          fontFamily: FONT_TITLE(),
          fontSize: 48,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.45,
          textAlign: "center",
          maxWidth: 920,
        }}
      >
        {visibleWords.map((w, i) => (
          <span
            key={i}
            style={{
              margin: "0 6px",
              display: "inline-block",
              color: i === visibleWords.length - 1 ? (isYouth ? "#b45309" : "#b91c1c") : "#0f172a",
            }}
          >
            {w.text}
          </span>
        ))}
      </div>

      {/* Bubble Tail */}
      <svg
        width="50"
        height="32"
        style={{
          position: "absolute",
          bottom: -28,
          left: Math.max(40, Math.min(840, tailX - 70 - 25)),
        }}
      >
        <path d="M 5 0 L 25 28 L 45 0 Z" fill={bubbleColor} stroke={borderColor} strokeWidth="4" />
        <line x1="8" y1="0" x2="42" y2="0" stroke={bubbleColor} strokeWidth="6" />
      </svg>
    </div>
  );
};

// Comic Visual Effects (Question marks, Anger steam)
const ComicEmotes: React.FC<{ action: string; frame: number }> = ({ action, frame }) => {
  if (action === "clueless_question" || action === "blank_repetition") {
    const bounce = Math.sin(frame * 0.3) * 14;
    return (
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 660 + bounce,
          zIndex: 160,
          display: "flex",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: FONT_TITLE(),
            fontSize: 88,
            fontWeight: 900,
            color: "#f59e0b",
            WebkitTextStroke: "3.5px #0f172a",
            textShadow: "0 6px 14px rgba(0,0,0,0.5)",
          }}
        >
          ؟
        </span>
        <span
          style={{
            fontFamily: FONT_TITLE(),
            fontSize: 104,
            fontWeight: 900,
            color: "#ef4444",
            WebkitTextStroke: "4px #0f172a",
            textShadow: "0 6px 14px rgba(0,0,0,0.5)",
            transform: "translateY(-18px) rotate(14deg)",
          }}
        >
          ؟
        </span>
      </div>
    );
  }

  if (action === "hit_and_beat") {
    return <HitSlapVFX frame={frame} />;
  }

  if (action === "shocked_rage" || action === "despair_struggle") {
    const pulse = 1 + Math.sin(frame * 0.45) * 0.18;
    return (
      <div
        style={{
          position: "absolute",
          left: 310,
          top: 640,
          zIndex: 160,
          transform: `scale(${pulse})`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_TITLE(),
            fontSize: 98,
            fontWeight: 900,
            color: "#dc2626",
            WebkitTextStroke: "4px #0f172a",
            textShadow: "0 8px 18px rgba(0,0,0,0.6)",
          }}
        >
          💢
        </span>
      </div>
    );
  }

  return null;
};

// Slapstick Comic Hit Visual Effects
const HitSlapVFX: React.FC<{ frame: number }> = ({ frame }) => {
  const cycle = Math.sin(frame * 1.5);
  const isStrike = cycle > 0.15 || cycle < -0.15;
  const soundWord = cycle > 0 ? "طاخ!" : "طرق!";
  const starScale = isStrike ? 0.95 + Math.sin(frame * 2.5) * 0.16 : 0.55;

  return (
    <div
      style={{
        position: "absolute",
        left: 825,
        top: 1070,
        zIndex: 180,
        pointerEvents: "none",
        transform: `translate(-50%, -50%) scale(${starScale})`,
        opacity: isStrike ? 1 : 0.65,
      }}
    >
      <svg width="240" height="240" viewBox="0 0 300 300" style={{ overflow: "visible" }}>
        {/* Outer Red Starburst */}
        <polygon
          points="150,15 185,95 275,60 225,135 295,185 210,205 240,285 165,235 125,290 95,215 15,235 65,160 5,115 85,100 65,20 135,70"
          fill="#ef4444"
          stroke="#7f1d1d"
          strokeWidth="6"
        />
        {/* Inner Yellow Starburst */}
        <polygon
          points="150,45 175,105 245,80 205,140 260,180 195,195 215,255 160,215 130,255 105,200 45,215 85,155 35,125 100,110 85,50 135,90"
          fill="#fde047"
          stroke="#b45309"
          strokeWidth="5"
        />
        {/* Action Speed Lines */}
        <path d="M 30 70 Q 70 90 90 120" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M 270 70 Q 230 90 210 120" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M 50 240 Q 90 220 110 190" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M 250 240 Q 210 220 190 190" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>

      {/* Comic Impact Word: طاخ! / طرق! */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(${Math.sin(frame * 1.5) * 16}deg)`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_TITLE(),
            fontSize: 66,
            fontWeight: 900,
            color: "#ffffff",
            WebkitTextStroke: "4px #991b1b",
            textShadow: "0 6px 16px rgba(0,0,0,0.7), 0 0 16px #f59e0b",
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {soundWord}
        </span>
      </div>
    </div>
  );
};

export const BidahCartoon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const beat = getBeat(time);
  const pulse = speechPulse(time);
  const isHit = beat.action === "hit_and_beat";

  // Dynamic Camera Framing for Current Shot
  let targetScale = 1.0;
  let targetX = 0;
  let targetY = 0;

  if (beat.shot === "medium_youth") {
    targetScale = 1.25;
    targetX = -180;
    targetY = -60;
  } else if (beat.shot === "medium_sheikh") {
    targetScale = 1.25;
    targetX = 180;
    targetY = -60;
  } else if (beat.shot === "closeup_sheikh") {
    targetScale = 1.48;
    targetX = 220;
    targetY = -150;
  } else if (beat.shot === "two_shot_sheikh_friend") {
    targetScale = 1.20;
    targetX = 190;
    targetY = -50;
  } else {
    // wide_chase
    targetScale = 1.0;
    targetX = 0;
    targetY = 0;
  }

  // Comedic camera rumble impact during the beating scene
  if (isHit) {
    targetX += Math.sin(frame * 2.5) * 10;
    targetY += Math.cos(frame * 2.1) * 8;
    targetScale = 1.05;
  }

  // Smooth shot transition over 5 frames at beat start
  const beatStartFrame = Math.round(beat.from * fps);
  const progress = Math.min(1, Math.max(0, (frame - beatStartFrame) / 5));
  const easeProgress = progress * progress * (3 - 2 * progress);

  // Dynamic positions when Sheikh lunges forward to beat the youth
  const sheikhX = isHit
    ? interpolate(time, [29.5, 29.85], [410, 650], { extrapolateRight: "clamp" }) + Math.sin(frame * 1.5) * 8
    : 410;
  const sheikhY = isHit ? 950 + Math.sin(frame * 1.5) * 6 : 950;

  const youthX = isHit
    ? interpolate(time, [29.5, 30.0], [770, 835], { extrapolateRight: "clamp" }) + Math.sin(frame * 2.0) * 10
    : 770;
  const youthY = isHit ? 960 + Math.cos(frame * 2.0) * 8 : 960;

  const friendX = isHit
    ? interpolate(time, [29.5, 29.9], [230, 420], { extrapolateRight: "clamp" })
    : 230;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0f172a" }}>
      {/* Audio playback with pitch shift */}
      <Audio src={staticFile("bidah_cartoon/voice.wav")} />

      {/* Camera Container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          transform: `scale(${targetScale}) translate(${targetX * easeProgress}px, ${targetY * easeProgress}px)`,
          transformOrigin: "540px 1050px",
        }}
      >
        {/* Environment Setting */}
        <BidahEnvironment shot={beat.shot} />

        {/* 2D Cutout Characters in Scene */}
        <svg
          width="1080"
          height="1920"
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {/* 1. Friend Character (Standing behind Sheikh on Left) */}
          <g transform={`translate(${friendX}, 960) scale(0.92)`}>
            <FriendCutout
              frame={frame}
              time={time}
              pulse={pulse}
              action={beat.action}
              isSpeaker={beat.speaker === "friend"}
            />
          </g>

          {/* 2. Sheikh Character (Main Actor on Left, lunging to hit youth) */}
          <g transform={`translate(${sheikhX}, ${sheikhY}) scale(0.96)`}>
            <SheikhCutout
              frame={frame}
              time={time}
              pulse={pulse}
              action={beat.action}
              isSpeaker={beat.speaker === "sheikh"}
            />
          </g>

          {/* 3. Youth Disputer Character (Main Actor on Right, recoiling from hits) */}
          <g transform={`translate(${youthX}, ${youthY}) scale(-0.95, 0.95)`}>
            <YouthCutout
              frame={frame}
              time={time}
              pulse={pulse}
              action={beat.action}
              isSpeaker={beat.speaker === "youth"}
            />
          </g>
        </svg>
      </div>

      {/* Screen-space Graphic Overlays inside <Gfx> */}
      <Gfx>
        {/* Comic Speech Bubbles */}
        <ComicSpeechBubble speaker={beat.speaker} time={time} />

        {/* Comic Emotes */}
        <ComicEmotes action={beat.action} frame={frame} />

        {/* Top Header Badge */}
        <div
          style={{
            position: "absolute",
            top: 45,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.88)",
            border: "2px solid rgba(245, 158, 11, 0.6)",
            borderRadius: 30,
            padding: "10px 34px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            direction: "rtl",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 26 }}>🎬</span>
          <span
            style={{
              fontFamily: FONT_TITLE(),
              fontSize: 28,
              fontWeight: 800,
              color: "#fef3c7",
              letterSpacing: 0.5,
            }}
          >
            حوار البدعة والدليل
          </span>
        </div>
      </Gfx>
    </AbsoluteFill>
  );
};
