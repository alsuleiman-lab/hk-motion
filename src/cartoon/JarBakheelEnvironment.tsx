import React from "react";
import { interpolate } from "remotion";

export interface EnvironmentProps {
  frame: number;
  mode: "street" | "eating_flashback" | "outro";
}

export const JarBakheelEnvironment: React.FC<EnvironmentProps> = ({ frame, mode }) => {
  // Cloud drift
  const cloudOffset1 = (frame * 0.8) % 1300 - 200;
  const cloudOffset2 = ((frame * 0.5) + 500) % 1300 - 200;

  if (mode === "eating_flashback") {
    // Flashback Dining Hall Interior
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#fef3c7" }}>
        {/* Background Wallpaper Pattern */}
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <pattern id="stripes" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="30" height="60" fill="#fef9c3" opacity="0.6" />
            </pattern>
            {/* Flashback vignette */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0.45" />
            </radialGradient>
          </defs>

          {/* Wall */}
          <rect width="1080" height="1400" fill="url(#wallGrad)" />
          <rect width="1080" height="1400" fill="url(#stripes)" />

          {/* Floor / Carpet */}
          <rect y="1360" width="1080" height="560" fill="#991b1b" />
          {/* Carpet Pattern */}
          <rect y="1360" width="1080" height="28" fill="#b91c1c" />
          <rect y="1388" width="1080" height="12" fill="#facc15" />

          {/* Hanging Oriental Lantern */}
          <g transform="translate(540, 0)">
            <line x1="0" y1="0" x2="0" y2="180" stroke="#78350f" strokeWidth="6" />
            <ellipse cx="0" cy="220" rx="46" ry="65" fill="#f59e0b" stroke="#78350f" strokeWidth="6" />
            <polygon points="-30,220 30,220 20,280 -20,280" fill="#b45309" stroke="#78350f" strokeWidth="4" />
            {/* Light glow */}
            <circle cx="0" cy="220" r="110" fill="#fef08a" opacity="0.35" />
          </g>

          {/* Dreamy Flashback Border (Clouds / Comic wavy border) */}
          <rect width="1080" height="1920" fill="url(#vignette)" />
        </svg>

        {/* Comic Flashback Banner */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#b91c1c",
            color: "#ffffff",
            padding: "10px 40px",
            borderRadius: 30,
            fontSize: 34,
            fontWeight: 800,
            border: "4px solid #ffffff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            letterSpacing: 1,
            zIndex: 10,
          }}
        >
          💭 ذكريات وليمة الجار!
        </div>
      </div>
    );
  }

  // Street Environment (Default & Outro)
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#e0f2fe" }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#7dd3fc" />
            <stop offset="70%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="wall1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="wall2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="1080" height="1350" fill="url(#skyGrad)" />

        {/* Sun */}
        <g transform="translate(180, 200)">
          <circle cx="0" cy="0" r="70" fill="#facc15" stroke="#eab308" strokeWidth="8" />
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={Math.cos((angle * Math.PI) / 180) * 88}
              y1={Math.sin((angle * Math.PI) / 180) * 88}
              x2={Math.cos((angle * Math.PI) / 180) * 115}
              y2={Math.sin((angle * Math.PI) / 180) * 115}
              stroke="#eab308"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Moving Clouds */}
        <g transform={`translate(${cloudOffset1}, 180)`} opacity="0.95">
          <ellipse cx="60" cy="50" rx="70" ry="36" fill="#ffffff" />
          <ellipse cx="120" cy="35" rx="55" ry="42" fill="#ffffff" />
          <ellipse cx="180" cy="50" rx="65" ry="34" fill="#ffffff" />
        </g>
        <g transform={`translate(${cloudOffset2}, 280)`} opacity="0.9">
          <ellipse cx="40" cy="40" rx="50" ry="26" fill="#ffffff" />
          <ellipse cx="90" cy="30" rx="45" ry="30" fill="#ffffff" />
          <ellipse cx="130" cy="40" rx="45" ry="24" fill="#ffffff" />
        </g>

        {/* Distant skyline / minarets */}
        <g opacity="0.4">
          <rect x="480" y="520" width="80" height="500" fill="#38bdf8" />
          <polygon points="520,440 470,520 570,520" fill="#0284c7" />
          <rect x="580" y="600" width="120" height="420" fill="#38bdf8" />
          <ellipse cx="640" cy="600" rx="60" ry="50" fill="#0284c7" />
        </g>

        {/* House 1: Left (Neighbor's House - warm orange/terracotta) */}
        <g id="house-neighbor">
          <rect x="-40" y="650" width="480" height="850" fill="url(#wall1)" stroke="#c2410c" strokeWidth="8" />
          {/* Decorative roof trim */}
          <polygon points="-50,650 450,650 430,620 -40,620" fill="#c2410c" />
          {/* Upper Window with flower pot */}
          <rect x="120" y="740" width="140" height="180" rx="70" fill="#38bdf8" stroke="#7c2d12" strokeWidth="7" />
          <line x1="190" y1="740" x2="190" y2="920" stroke="#7c2d12" strokeWidth="6" />
          <line x1="120" y1="830" x2="260" y2="830" stroke="#7c2d12" strokeWidth="6" />
          {/* Flower pot */}
          <rect x="110" y="915" width="160" height="30" rx="6" fill="#b45309" stroke="#7c2d12" strokeWidth="4" />
          <circle cx="140" cy="910" r="14" fill="#ec4899" />
          <circle cx="170" cy="905" r="16" fill="#ef4444" />
          <circle cx="200" cy="908" r="15" fill="#f59e0b" />
          <circle cx="230" cy="912" r="13" fill="#ec4899" />

          {/* Open welcoming wooden door */}
          <rect x="110" y="1080" width="160" height="320" rx="12" fill="#78350f" stroke="#451a03" strokeWidth="8" />
          <circle cx="240" cy="1240" r="12" fill="#facc15" stroke="#78350f" strokeWidth="3" />
        </g>

        {/* House 2: Right (Miser's House - stone grey/slate with huge padlock) */}
        <g id="house-miser">
          <rect x="580" y="620" width="540" height="880" fill="url(#wall2)" stroke="#334155" strokeWidth="8" />
          {/* Roof battlements */}
          <polygon points="560,620 1100,620 1080,590 580,590" fill="#1e293b" />
          {/* Upper tiny barred window */}
          <rect x="740" y="720" width="120" height="120" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />
          <line x1="770" y1="720" x2="770" y2="840" stroke="#64748b" strokeWidth="6" />
          <line x1="800" y1="720" x2="800" y2="840" stroke="#64748b" strokeWidth="6" />
          <line x1="830" y1="720" x2="830" y2="840" stroke="#64748b" strokeWidth="6" />

          {/* Heavy Locked Door */}
          <rect x="710" y="1040" width="190" height="360" rx="8" fill="#451a03" stroke="#0f172a" strokeWidth="9" />
          {/* Iron straps */}
          <rect x="710" y="1100" width="190" height="20" fill="#334155" stroke="#0f172a" strokeWidth="4" />
          <rect x="710" y="1300" width="190" height="20" fill="#334155" stroke="#0f172a" strokeWidth="4" />

          {/* Comic Big Iron Padlock! */}
          <g transform="translate(805, 1220)">
            <path
              d="M -22 -10 C -22 -35, 22 -35, 22 -10 L 22 0 L -22 0 Z"
              fill="none"
              stroke="#64748b"
              strokeWidth="10"
            />
            <rect x="-32" y="0" width="64" height="60" rx="10" fill="#eab308" stroke="#854d0e" strokeWidth="6" />
            <circle cx="0" cy="24" r="8" fill="#713f12" />
            <polygon points="-4,24 4,24 6,42 -6,42" fill="#713f12" />
          </g>

          {/* House Sign: "بيت الجار البخيل" */}
          <g transform="translate(805, 980)">
            <rect x="-95" y="-28" width="190" height="56" rx="12" fill="#fef3c7" stroke="#b45309" strokeWidth="5" />
            <text
              x="0"
              y="10"
              textAnchor="middle"
              fill="#78350f"
              fontSize="24"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              🔒 بيت البخيل
            </text>
          </g>
        </g>

        {/* Street Ground / Cobblestone */}
        <g id="street-ground">
          <rect y="1380" width="1080" height="540" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="6" />
          {/* Cobblestone cracks & textures */}
          {[
            { x: 120, y: 1450, r: 28 },
            { x: 260, y: 1520, r: 35 },
            { x: 420, y: 1460, r: 24 },
            { x: 620, y: 1510, r: 32 },
            { x: 820, y: 1470, r: 26 },
            { x: 960, y: 1540, r: 34 },
            { x: 180, y: 1680, r: 32 },
            { x: 380, y: 1720, r: 36 },
            { x: 700, y: 1690, r: 30 },
            { x: 880, y: 1730, r: 38 },
          ].map((stone, i) => (
            <ellipse
              key={i}
              cx={stone.x}
              cy={stone.y}
              rx={stone.r * 1.5}
              ry={stone.r * 0.7}
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="3"
            />
          ))}
          {/* Street divider or curb */}
          <line x1="0" y1="1380" x2="1080" y2="1380" stroke="#64748b" strokeWidth="8" />
        </g>
      </svg>
    </div>
  );
};

