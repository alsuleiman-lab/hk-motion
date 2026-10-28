import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * BidahEnvironment.tsx
 * Rich indoor Majlis setting with decorative woodwork, bookshelf with leather volumes,
 * arched window with Islamic geometric mashrabiya, leather sofa, parquet floor, and oriental rug.
 * Strictly adheres to rule: No plain/black backgrounds, rich subtle textures.
 */

interface EnvironmentProps {
  shot: string;
}

export const BidahEnvironment: React.FC<EnvironmentProps> = () => {
  const frame = useCurrentFrame();
  const lampGlow = 0.88 + Math.sin(frame * 0.08) * 0.08;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        background: "linear-gradient(180deg, #1b2129 0%, #151a21 55%, #0f1318 100%)",
        overflow: "hidden",
      }}
    >
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#252e3a" />
            <stop offset="60%" stopColor="#1a222c" />
            <stop offset="100%" stopColor="#141a22" />
          </linearGradient>

          <radialGradient id="twilightWindow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#38495f" />
            <stop offset="60%" stopColor="#202b38" />
            <stop offset="100%" stopColor="#111720" />
          </radialGradient>

          <radialGradient id="lampGlowLeft" cx="240" cy="380" r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffb347" stopOpacity={0.24 * lampGlow} />
            <stop offset="60%" stopColor="#ffb347" stopOpacity={0.06 * lampGlow} />
            <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="lampGlowRight" cx="840" cy="380" r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffb347" stopOpacity={0.24 * lampGlow} />
            <stop offset="60%" stopColor="#ffb347" stopOpacity={0.06 * lampGlow} />
            <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c1f17" />
            <stop offset="100%" stopColor="#160f0a" />
          </linearGradient>

          <pattern id="mashrabiyaPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 60 30 L 30 60 L 0 30 Z M 30 10 L 50 30 L 30 50 L 10 30 Z"
              fill="none"
              stroke="#2e3d4f"
              strokeWidth="2"
              opacity="0.4"
            />
          </pattern>
        </defs>

        {/* 1. Base Wall & Ambient Lights */}
        <rect width="1080" height="1920" fill="url(#wallGrad)" />
        <rect width="1080" height="1920" fill="url(#lampGlowLeft)" />
        <rect width="1080" height="1920" fill="url(#lampGlowRight)" />

        {/* Wall Cornice */}
        <rect x="0" y="0" width="1080" height="45" fill="#1e2733" />
        <line x1="0" y1="45" x2="1080" y2="45" stroke="#364557" strokeWidth="4" />

        {/* 2. Central Arched Mashrabiya Window */}
        <g transform="translate(320, 260)">
          <path
            d="M 0 850 L 0 220 Q 0 0 220 0 Q 440 0 440 220 L 440 850 Z"
            fill="url(#twilightWindow)"
            stroke="#453324"
            strokeWidth="12"
          />
          <path
            d="M 12 840 L 12 225 Q 12 12 220 12 Q 428 12 428 225 L 428 840 Z"
            fill="url(#mashrabiyaPattern)"
          />
          <line x1="220" y1="12" x2="220" y2="840" stroke="#38281b" strokeWidth="6" />
          <line x1="12" y1="420" x2="428" y2="420" stroke="#38281b" strokeWidth="6" />
          <line x1="12" y1="640" x2="428" y2="640" stroke="#38281b" strokeWidth="6" />
        </g>

        {/* 3. Bookshelf on the Left */}
        <g transform="translate(60, 420)">
          <rect x="0" y="0" width="145" height="780" rx="8" fill="#2d2017" stroke="#4a3525" strokeWidth="6" />
          {[160, 340, 520, 700].map((y) => (
            <rect key={y} x="6" y={y} width="133" height="14" fill="#5c422e" rx="2" />
          ))}
          {/* Books */}
          <rect x="15" y="40" width="20" height="120" rx="3" fill="#8b3a2b" />
          <rect x="38" y="55" width="24" height="105" rx="3" fill="#2a5840" />
          <rect x="65" y="35" width="22" height="125" rx="3" fill="#b8860b" />
          <rect x="90" y="50" width="24" height="110" rx="3" fill="#1e3f66" />
          <rect x="116" y="65" width="18" height="95" rx="3" fill="#6d4c41" />

          <rect x="15" y="210" width="24" height="130" rx="3" fill="#1b4d3e" />
          <rect x="42" y="225" width="20" height="115" rx="3" fill="#884920" />
          <rect x="65" y="200" width="26" height="140" rx="3" fill="#2c3e50" />
          <rect x="94" y="230" width="22" height="110" rx="3" fill="#a0522d" />

          <rect x="15" y="405" width="22" height="115" rx="3" fill="#9c5b28" />
          <rect x="40" y="390" width="25" height="130" rx="3" fill="#1e4d2b" />
          <rect x="68" y="420" width="20" height="100" rx="3" fill="#7b241c" />
          <rect x="91" y="395" width="28" height="125" rx="3" fill="#2e4053" />
        </g>

        {/* 4. Display Bookshelf on the Right */}
        <g transform="translate(875, 420)">
          <rect x="0" y="0" width="145" height="780" rx="8" fill="#2d2017" stroke="#4a3525" strokeWidth="6" />
          {[160, 340, 520, 700].map((y) => (
            <rect key={y} x="6" y={y} width="133" height="14" fill="#5c422e" rx="2" />
          ))}
          <rect x="16" y="45" width="24" height="115" rx="3" fill="#1b4d3e" />
          <rect x="43" y="30" width="28" height="130" rx="3" fill="#78281f" />
          <rect x="74" y="55" width="20" height="105" rx="3" fill="#b7950b" />
          <rect x="97" y="40" width="26" height="120" rx="3" fill="#1b2631" />
          <ellipse cx="72" cy="300" rx="22" ry="32" fill="#c09a5b" stroke="#785b28" strokeWidth="2" />
          <rect x="64" y="258" width="16" height="18" fill="#dfbb7b" rx="2" />
        </g>

        {/* 5. Hanging Brass Lamps */}
        <line x1="240" y1="45" x2="240" y2="280" stroke="#b89358" strokeWidth="3.5" />
        <ellipse cx="240" cy="285" rx="14" ry="7" fill="#8c6d3b" />
        <path d="M 215 340 Q 240 280 265 340 Z" fill="#b89358" stroke="#7d6032" strokeWidth="2.5" />
        <ellipse cx="240" cy="340" rx="25" ry="9" fill="#ffd175" />
        <circle cx="240" cy="348" r="16" fill="#fff5d0" opacity={lampGlow} />

        <line x1="840" y1="45" x2="840" y2="280" stroke="#b89358" strokeWidth="3.5" />
        <ellipse cx="840" cy="285" rx="14" ry="7" fill="#8c6d3b" />
        <path d="M 815 340 Q 840 280 865 340 Z" fill="#b89358" stroke="#7d6032" strokeWidth="2.5" />
        <ellipse cx="840" cy="340" rx="25" ry="9" fill="#ffd175" />
        <circle cx="840" cy="348" r="16" fill="#fff5d0" opacity={lampGlow} />

        {/* 6. Floor Baseboard & Parquet */}
        <rect x="0" y="1280" width="1080" height="35" fill="#3a2719" />
        <line x1="0" y1="1280" x2="1080" y2="1280" stroke="#573c27" strokeWidth="3" />
        <rect x="0" y="1315" width="1080" height="605" fill="url(#floorGrad)" />

        {/* 7. Classic Leather Sofa / Majlis Seating (Behind Characters) */}
        <g transform="translate(190, 920)">
          <rect x="0" y="0" width="700" height="240" rx="24" fill="#3f2e23" stroke="#261b14" strokeWidth="5" />
          {[60, 140].map((rowY) =>
            [80, 180, 280, 380, 480, 580, 620].map((btnX) => (
              <circle key={`${rowY}-${btnX}`} cx={btnX} cy={rowY} r="6" fill="#1c130d" />
            ))
          )}
          <rect x="-35" y="40" width="65" height="200" rx="20" fill="#4d382b" stroke="#261b14" strokeWidth="4" />
          <rect x="670" y="40" width="65" height="200" rx="20" fill="#4d382b" stroke="#261b14" strokeWidth="4" />
        </g>

        {/* 8. Oriental Rug */}
        <g transform="translate(140, 1380)">
          <polygon points="120,0 680,0 780,480 20,480" fill="#78231b" stroke="#9c3a30" strokeWidth="5" />
          <polygon points="140,25 660,25 745,455 55,455" fill="#8e2b21" stroke="#c8963e" strokeWidth="4" />
          <polygon points="400,90 520,240 400,390 280,240" fill="#1d3557" stroke="#dfab43" strokeWidth="4" />
          <circle cx="400" cy="240" r="42" fill="#b91c1c" stroke="#fef3c7" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
};
