import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_TITLE, FONT_TEXT } from "../localFonts";

export const CartoonEndScreen: React.FC<{
  startFrameOffset?: number;
}> = ({ startFrameOffset = 0 }) => {
  const currentFrame = useCurrentFrame();
  const frame = Math.max(0, currentFrame - startFrameOffset);
  const { fps } = useVideoConfig();

  const fontTitle = FONT_TITLE();
  const fontText = FONT_TEXT();

  // Entrance spring for main card
  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  // Pulse for mention badge
  const pulse = Math.sin(frame * 0.18) * 0.05;
  const floatBob = Math.sin(frame * 0.12) * 8;

  // Waving hand for Juha
  const waveAngle = Math.sin(frame * 0.35) * 18;

  // Daughter bouncing happily
  const daughterBob = Math.sin(frame * 0.22) * 6;

  // Donkey ears twitch
  const earTwitch = Math.sin(frame * 0.3) * 8;
  const tailWag = Math.sin(frame * 0.5) * 14;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf6ee",
        overflow: "hidden",
      }}
    >
      {/* Decorative Warm Paper Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 50%, rgba(225,215,200,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative Cartoon Border Frame */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <rect
          x="40"
          y="60"
          width="1000"
          height="1800"
          rx="32"
          fill="none"
          stroke="#1e242b"
          strokeWidth="6"
          strokeDasharray="24 16"
          opacity="0.25"
        />
        {/* Corner Stars */}
        {[
          { x: 75, y: 95 },
          { x: 1005, y: 95 },
          { x: 75, y: 1825 },
          { x: 1005, y: 1825 },
        ].map((pt, i) => (
          <g
            key={i}
            transform={`translate(${pt.x}, ${pt.y}) rotate(${
              (frame * 1.5) % 360
            })`}
          >
            <polygon
              points="0,-18 5,-5 18,0 5,5 0,18 -5,5 -18,0 -5,-5"
              fill="#f59e0b"
              stroke="#1e242b"
              strokeWidth="2.5"
            />
          </g>
        ))}
      </svg>

      {/* Floating Sparkles & @ Icons */}
      {[
        { x: 160, y: 380, delay: 5, size: 42, icon: "@" },
        { x: 920, y: 460, delay: 10, size: 48, icon: "✨" },
        { x: 140, y: 880, delay: 15, size: 38, icon: "💬" },
        { x: 940, y: 840, delay: 20, size: 44, icon: "@" },
      ].map((item, i) => {
        const itemSpring = spring({
          frame: frame - item.delay,
          fps,
          config: { damping: 10, stiffness: 100 },
        });
        const floatY = Math.sin((frame + i * 15) * 0.1) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y + floatY,
              transform: `scale(${itemSpring})`,
              fontSize: item.size,
              color: "#d97706",
              fontWeight: 900,
              userSelect: "none",
              pointerEvents: "none",
              opacity: 0.85,
            }}
          >
            {item.icon}
          </div>
        );
      })}

      {/* ======================================================= */}
      {/* 1. CENTRAL CALL-TO-ACTION CARD (بطاقة الإشارة والمطالبة) */}
      {/* ======================================================= */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: "50%",
          transform: `translateX(-50%) translateY(${floatBob}px) scale(${cardSpring})`,
          width: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          zIndex: 50,
        }}
      >
        {/* Top Floating Badge */}
        <div
          style={{
            background: "#ef4444",
            color: "#ffffff",
            padding: "10px 36px",
            borderRadius: 30,
            border: "4px solid #1e242b",
            fontFamily: fontTitle,
            fontSize: 34,
            fontWeight: 800,
            boxShadow: "0 6px 16px rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>📢</span>
          <span>شَارِكْنَا القِصَّة القَادِمَة!</span>
        </div>

        {/* Main Card Bubble */}
        <div
          style={{
            width: "100%",
            background: "#ffffff",
            border: "7px solid #1e242b",
            borderRadius: 44,
            padding: "50px 40px",
            boxShadow:
              "0 20px 50px rgba(0, 0, 0, 0.16), 0 6px 0 #1e242b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            direction: "rtl",
            gap: 22,
          }}
        >
          {/* Main Headline */}
          <div
            style={{
              fontFamily: fontTitle,
              fontSize: 66,
              fontWeight: 900,
              color: "#1e242b",
              lineHeight: 1.35,
              textShadow: "0 3px 6px rgba(0,0,0,0.06)",
            }}
          >
            اعْمَلْ لَنَا <span style={{ color: "#d97706" }}>إِشَارَةً</span>
            <br />
            لِأَيِّ قِصَّةٍ تُرِيدُهَا!
          </div>

          {/* Subtitle / Instructions pill */}
          <div
            style={{
              background: "#fef3c7",
              border: "3.5px dashed #d97706",
              borderRadius: 24,
              padding: "14px 34px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `scale(${1 + pulse})`,
            }}
          >
            <span style={{ fontSize: 32 }}>🔖</span>
            <span
              style={{
                fontFamily: fontText,
                fontSize: 32,
                fontWeight: 800,
                color: "#92400e",
              }}
            >
              في التعليقات أو المنشورات (تاغ / منشن)
            </span>
          </div>
        </div>

        {/* Small pointing down arrow */}
        <svg width="48" height="28" viewBox="0 0 48 28">
          <polygon points="0,0 48,0 24,24" fill="#1e242b" />
          <polygon points="6,0 42,0 24,18" fill="#ffffff" />
        </svg>
      </div>

      {/* ======================================================= */}
      {/* 2. ANIMATED CHARACTERS AT BOTTOM (الشخصيات الكرتونية)    */}
      {/* ======================================================= */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
        }}
      >
        {/* Ground Line */}
        <line
          x1="-200"
          y1="1620"
          x2="1280"
          y2="1620"
          stroke="#1e242b"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* ---------------------------------------------------- */}
        {/* A. JUHA (جحا يلوح بيده مبتسماً)                      */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(680, 1620)">
          {/* Shadow */}
          <ellipse cx="0" cy="0" rx="65" ry="12" fill="#20272c" opacity="0.18" />

          {/* Legs */}
          <line x1="-22" y1="-190" x2="-22" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />
          <line x1="22" y1="-190" x2="22" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />

          {/* Torso: Traditional Tunic */}
          <path
            d="M -44 -335 L 44 -335 L 56 -190 L -56 -190 Z"
            fill="#925a2e"
            stroke="#1e242b"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <line x1="0" y1="-335" x2="0" y2="-195" stroke="#1e242b" strokeWidth="4" />
          <circle cx="0" cy="-300" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />
          <circle cx="0" cy="-260" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />
          <circle cx="0" cy="-220" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />

          {/* Left Arm: Resting on hip */}
          <line x1="-44" y1="-320" x2="-75" y2="-270" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="-75" y1="-270" x2="-45" y2="-250" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-45" cy="-250" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          {/* Right Arm: Raised waving cheerfully */}
          <g transform={`translate(44, -320)`}>
            <line x1="0" y1="0" x2="35" y2="-45" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
            <g transform={`translate(35, -45) rotate(${waveAngle})`}>
              <line x1="0" y1="0" x2="35" y2="-35" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
              <circle cx="35" cy="-35" r="12" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
              {/* Fingers waving */}
              <line x1="38" y1="-44" x2="44" y2="-55" stroke="#1e242b" strokeWidth="4" strokeLinecap="round" />
              <line x1="43" y1="-40" x2="52" y2="-48" stroke="#1e242b" strokeWidth="4" strokeLinecap="round" />
              <line x1="45" y1="-34" x2="55" y2="-38" stroke="#1e242b" strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>

          {/* Head Group */}
          <g transform="translate(0, -425)">
            <circle cx="0" cy="0" r="72" fill="#ffffff" stroke="#1e242b" strokeWidth="8" />

            {/* Traditional Cap */}
            <path
              d="M -70 -20 Q 0 -115 70 -20 Q 0 -45 -70 -20 Z"
              fill="#f3f4f6"
              stroke="#1e242b"
              strokeWidth="6"
            />
            <line x1="-35" y1="-30" x2="-22" y2="-75" stroke="#1e242b" strokeWidth="4" />
            <line x1="0" y1="-35" x2="0" y2="-82" stroke="#1e242b" strokeWidth="4" />
            <line x1="35" y1="-30" x2="22" y2="-75" stroke="#1e242b" strokeWidth="4" />

            {/* Faceless head (امتثالاً لقاعدة منع ملامح الوجوه) */}
          </g>
        </g>

        {/* ---------------------------------------------------- */}
        {/* B. DAUGHTER (الابنة تشير للأعلى وتبتسم)              */}
        {/* ---------------------------------------------------- */}
        <g transform={`translate(380, ${1620 + daughterBob})`}>
          {/* Shadow */}
          <ellipse cx="0" cy="0" rx="50" ry="11" fill="#20272c" opacity="0.18" />

          {/* Legs */}
          <line x1="-16" y1="-140" x2="-16" y2="0" stroke="#1e242b" strokeWidth="7" strokeLinecap="round" />
          <line x1="16" y1="-140" x2="16" y2="0" stroke="#1e242b" strokeWidth="7" strokeLinecap="round" />

          {/* Turquoise Arabic Dress */}
          <path
            d="M -36 -260 L 36 -260 L 52 -135 L -52 -135 Z"
            fill="#0d9488"
            stroke="#1e242b"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* White collar */}
          <path d="M -20 -260 Q 0 -245 20 -260" fill="none" stroke="#ffffff" strokeWidth="4" />

          {/* Back Hair Mass */}
          <path d="M -48 -290 Q -56 -230 -38 -200 Q -30 -195 -20 -200 Q -38 -230 -34 -290 Z" fill="#1e242b" />
          <path d="M 48 -290 Q 56 -230 38 -200 Q 30 -195 20 -200 Q 38 -230 34 -290 Z" fill="#1e242b" />

          {/* Left Braid with Pink Bow */}
          <g transform="translate(-44, -250)">
            <ellipse cx="0" cy="0" rx="10" ry="14" fill="#1e242b" />
            <ellipse cx="-2" cy="18" rx="9" ry="13" fill="#1e242b" />
            <ellipse cx="-4" cy="34" rx="8" ry="12" fill="#1e242b" />
            <circle cx="-4" cy="46" r="6" fill="#ec4899" />
          </g>

          {/* Right Braid with Pink Bow */}
          <g transform="translate(44, -250)">
            <ellipse cx="0" cy="0" rx="10" ry="14" fill="#1e242b" />
            <ellipse cx="2" cy="18" rx="9" ry="13" fill="#1e242b" />
            <ellipse cx="4" cy="34" rx="8" ry="12" fill="#1e242b" />
            <circle cx="4" cy="46" r="6" fill="#ec4899" />
          </g>

          {/* Head: Cute Face */}
          <g transform="translate(0, -320)">
            <circle cx="0" cy="0" r="54" fill="#fff7ed" stroke="#1e242b" strokeWidth="6" />

            {/* Hair bangs */}
            <path
              d="M -50 -14 Q -30 -50 0 -52 Q 30 -50 50 -14 Q 40 -30 18 -28 Q 0 -26 -18 -30 Q -40 -28 -50 -14 Z"
              fill="#1e242b"
            />

            {/* Faceless head (امتثالاً لقاعدة منع ملامح الوجوه) */}
          </g>

          {/* Left hand pointing up to the card */}
          <g transform="translate(-36, -250)">
            <line x1="0" y1="0" x2="-25" y2="-60" stroke="#1e242b" strokeWidth="7" strokeLinecap="round" />
            <circle cx="-25" cy="-60" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="3.5" />
            {/* Pointing index finger */}
            <line x1="-25" y1="-60" x2="-25" y2="-82" stroke="#1e242b" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Right hand waving */}
          <line x1="36" y1="-250" x2="65" y2="-210" stroke="#1e242b" strokeWidth="7" strokeLinecap="round" />
          <circle cx="65" cy="-210" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="3.5" />
        </g>

        {/* ---------------------------------------------------- */}
        {/* C. CUTE DONKEY (الحمار يطل ويهز أذنيه وذيله)          */}
        {/* ---------------------------------------------------- */}
        <g transform="translate(180, 1620)">
          {/* Shadow */}
          <ellipse cx="0" cy="0" rx="80" ry="14" fill="#20272c" opacity="0.18" />

          {/* Tail wag */}
          <g transform="translate(-95, -145)">
            <path
              d={`M 0 0 Q -30 ${20 + tailWag} -40 ${50 + tailWag}`}
              fill="none"
              stroke="#1e242b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <ellipse cx={-40} cy={50 + tailWag} rx="8" ry="13" fill="#1e242b" />
          </g>

          {/* Legs */}
          <line x1="-60" y1="-95" x2="-60" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />
          <line x1="-38" y1="-95" x2="-38" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />
          <line x1="45" y1="-95" x2="45" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />
          <line x1="68" y1="-95" x2="68" y2="0" stroke="#1e242b" strokeWidth="9" strokeLinecap="round" />

          {/* Body */}
          <ellipse cx="0" cy="-115" rx="105" ry="60" fill="#9ca3af" stroke="#1e242b" strokeWidth="6" />

          {/* Saddle Blanket */}
          <rect x="-28" y="-155" width="60" height="48" rx="6" fill="#c2410c" stroke="#1e242b" strokeWidth="3.5" />

          {/* Neck */}
          <path
            d="M 50 -140 L 85 -215 L 115 -200 L 85 -110 Z"
            fill="#9ca3af"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Head */}
          <g transform="translate(115, -220)">
            {/* Long Ears */}
            <path
              d={`M -15 -10 Q ${-25 + earTwitch} -70 ${-10 + earTwitch} -85 Q 5 -60 2 -10 Z`}
              fill="#9ca3af"
              stroke="#1e242b"
              strokeWidth="4"
            />
            <path
              d={`M 5 -10 Q ${-5 - earTwitch} -70 ${12 - earTwitch} -90 Q 24 -60 18 -10 Z`}
              fill="#9ca3af"
              stroke="#1e242b"
              strokeWidth="4"
            />
            <path d={`M 9 -14 Q ${-1 - earTwitch} -60 ${12 - earTwitch} -80 Q 18 -50 15 -14 Z`} fill="#fca5a5" />

            {/* Head oval - faceless */}
            <ellipse cx="12" cy="0" rx="42" ry="28" fill="#9ca3af" stroke="#1e242b" strokeWidth="5" />
            <ellipse cx="40" cy="14" rx="20" ry="16" fill="#e5e7eb" stroke="#1e242b" strokeWidth="3.5" />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
