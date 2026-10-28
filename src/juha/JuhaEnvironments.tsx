import React from "react";

/**
 * JuhaEnvironments.tsx
 * 3 Distinct, rich, animated environments for the story:
 * 1. HouseEnvironment (عند البيت) - Mud house, open window, wooden door, knocker ring, palm tree
 * 2. MarketEnvironment (في السوق) - Vibrant bazaar with striped fabric canopies, wooden stalls, pottery, spice sacks, carpets
 * 3. DesertRoadEnvironment (في الطريق) - Desert highway with rolling golden dunes, desert rocks/boulders, shrubs, warm sun
 */

// ==========================================
// 1. HOUSE ENVIRONMENT (عند البيت)
// ==========================================
export const HouseEnvironment: React.FC<{ doorOpen?: boolean }> = ({
  doorOpen = false,
}) => {
  return (
    <g>
      {/* Palm Tree on the right */}
      <g transform="translate(970, 1180)">
        {/* Trunk */}
        <path
          d="M 50 400 Q 20 220 5 0 Q 30 220 75 400 Z"
          fill="#b87a42"
          stroke="#1e242b"
          strokeWidth="5"
        />
        {[50, 100, 150, 200, 250, 300, 350].map((ty, i) => (
          <path
            key={i}
            d={`M ${18 - i * 1.5} ${ty} Q 38 ${ty - 12} ${58 + i * 2.5} ${ty}`}
            fill="none"
            stroke="#1e242b"
            strokeWidth="4"
          />
        ))}
        {/* Palm Fronds */}
        <g transform="translate(10, 0)">
          <path
            d="M 0 0 Q -90 10 -150 70 Q -80 30 0 0"
            fill="#3e7a36"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 0 0 Q -110 -50 -160 -30 Q -80 -20 0 0"
            fill="#488c3e"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 0 0 Q -50 -100 -30 -160 Q -10 -90 0 0"
            fill="#529e46"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 0 0 Q 60 -90 90 -140 Q 40 -80 0 0"
            fill="#488c3e"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 0 0 Q 90 -20 130 30 Q 60 10 0 0"
            fill="#3e7a36"
            stroke="#1e242b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Mud House */}
      <g transform="translate(0, 1040)">
        {/* House wall */}
        <path
          d="M -20 540 L 490 540 L 490 140 L 520 140 L 520 20 L -20 20 Z"
          fill="#dfb87f"
          stroke="#1e242b"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Clay corner blocks */}
        <rect x="440" y="150" width="55" height="36" rx="6" fill="#cfa264" stroke="#1e242b" strokeWidth="4" />
        <rect x="450" y="270" width="45" height="34" rx="6" fill="#cfa264" stroke="#1e242b" strokeWidth="4" />
        <rect x="435" y="420" width="60" height="38" rx="6" fill="#cfa264" stroke="#1e242b" strokeWidth="4" />

        {/* Decorative clay patches on the wall */}
        <ellipse cx="140" cy="380" rx="28" ry="16" fill="#cfa264" stroke="#1e242b" strokeWidth="3" opacity="0.85" />
        <ellipse cx="110" cy="440" rx="36" ry="18" fill="#cfa264" stroke="#1e242b" strokeWidth="3" opacity="0.85" />

        {/* Roof Beams */}
        {[
          { x: 100, y: 18 },
          { x: 220, y: 18 },
          { x: 340, y: 18 },
          { x: 450, y: 18 },
        ].map((beam, i) => (
          <g key={i} transform={`translate(${beam.x}, ${beam.y})`}>
            <rect x="-18" y="-12" width="36" height="54" rx="8" fill="#7a461e" stroke="#1e242b" strokeWidth="4" />
            <ellipse cx="0" cy="40" rx="18" ry="12" fill="#aa6b35" stroke="#1e242b" strokeWidth="4" />
            <circle cx="0" cy="40" r="3" fill="#1e242b" />
          </g>
        ))}

        {/* Window with wooden shutters */}
        <g transform="translate(60, 160)">
          <rect x="0" y="0" width="130" height="150" rx="6" fill="#11161b" stroke="#1e242b" strokeWidth="6" />
          {/* Left Shutter */}
          <path d="M -35 15 L 0 0 L 0 150 L -35 135 Z" fill="#8e4f20" stroke="#1e242b" strokeWidth="5" />
          <line x1="-35" y1="55" x2="0" y2="50" stroke="#1e242b" strokeWidth="4" />
          <line x1="-35" y1="105" x2="0" y2="100" stroke="#1e242b" strokeWidth="4" />
          {/* Lintel beam */}
          <rect x="-8" y="-12" width="146" height="18" rx="4" fill="#6d3a14" stroke="#1e242b" strokeWidth="4" />
        </g>

        {/* Main Wooden Plank Door */}
        <g transform="translate(245, 140)">
          <rect x="-14" y="-14" width="228" height="414" rx="6" fill="#6d3a14" stroke="#1e242b" strokeWidth="6" />
          <g transform={doorOpen ? "skewY(-6) scale(0.92, 1)" : ""}>
            <rect x="0" y="0" width="200" height="390" rx="4" fill="#935427" stroke="#1e242b" strokeWidth="5" />
            <line x1="40" y1="0" x2="40" y2="390" stroke="#1e242b" strokeWidth="3" />
            <line x1="80" y1="0" x2="80" y2="390" stroke="#1e242b" strokeWidth="3" />
            <line x1="120" y1="0" x2="120" y2="390" stroke="#1e242b" strokeWidth="3" />
            <line x1="160" y1="0" x2="160" y2="390" stroke="#1e242b" strokeWidth="3" />
            <rect x="0" y="45" width="200" height="26" fill="#7a441e" stroke="#1e242b" strokeWidth="4" />
            <rect x="0" y="325" width="200" height="26" fill="#7a441e" stroke="#1e242b" strokeWidth="4" />
            {[20, 60, 100, 140, 180].map((rx, idx) => (
              <React.Fragment key={idx}>
                <circle cx={rx} cy={58} r={4.5} fill="#1e242b" />
                <circle cx={rx} cy={338} r={4.5} fill="#1e242b" />
              </React.Fragment>
            ))}
            {/* Iron knocker ring */}
            <circle cx="160" cy="210" r="12" fill="#1e242b" />
            <circle cx="160" cy="232" r="26" fill="none" stroke="#1e242b" strokeWidth="10" />
          </g>
        </g>
      </g>
    </g>
  );
};

// ==========================================
// 2. MARKET ENVIRONMENT (في السوق)
// ==========================================
export const MarketEnvironment: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <g>
      {/* Background Bazaar Buildings with arched doorways */}
      <g transform="translate(0, 920)">
        {/* Distant building wall */}
        <rect x="-50" y="100" width="1180" height="560" fill="#eed9b8" stroke="#1e242b" strokeWidth="5" />
        {/* Arched doorways */}
        <path d="M 60 450 L 60 300 Q 130 220 200 300 L 200 450 Z" fill="#8d6e63" stroke="#1e242b" strokeWidth="5" />
        <path d="M 880 450 L 880 300 Q 950 220 1020 300 L 1020 450 Z" fill="#8d6e63" stroke="#1e242b" strokeWidth="5" />
      </g>

      {/* Decorative Hanging Oriental Carpets */}
      <g transform="translate(80, 1140)">
        <rect x="0" y="0" width="110" height="180" fill="#dc2626" stroke="#1e242b" strokeWidth="4" rx="4" />
        <rect x="15" y="15" width="80" height="150" fill="#b91c1c" stroke="#facc15" strokeWidth="3" />
        <polygon points="55,30 85,90 55,150 25,90" fill="#facc15" />
        {/* Carpet tassels */}
        {[10, 30, 50, 70, 90, 100].map((tx, idx) => (
          <line key={idx} x1={tx} y1="180" x2={tx} y2="198" stroke="#facc15" strokeWidth="3" />
        ))}
      </g>

      {/* Vendor Market Stall (Right side) */}
      <g transform="translate(620, 1180)">
        {/* Striped Canopy / Awning (Red & Yellow scalloped canopy) */}
        <g transform="translate(-80, -80)">
          {/* Canopy cloth */}
          <path
            d="M 0 0 L 380 0 L 360 90 L 0 90 Z"
            fill="#facc15"
            stroke="#1e242b"
            strokeWidth="5"
          />
          {/* Red stripes */}
          {[0, 60, 120, 180, 240, 300].map((sx, idx) => (
            <path
              key={idx}
              d={`M ${sx} 0 L ${sx + 30} 0 L ${sx + 25} 90 L ${sx - 5} 90 Z`}
              fill="#ef4444"
              stroke="#1e242b"
              strokeWidth="4"
            />
          ))}
          {/* Scalloped edge */}
          {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((scx, idx) => (
            <path
              key={idx}
              d={`M ${scx - 15} 90 Q ${scx} 115 ${scx + 15} 90`}
              fill={idx % 2 === 0 ? "#ef4444" : "#facc15"}
              stroke="#1e242b"
              strokeWidth="4"
            />
          ))}
          {/* Canopy support wooden poles */}
          <line x1="10" y1="90" x2="10" y2="400" stroke="#5c381e" strokeWidth="8" strokeLinecap="round" />
          <line x1="350" y1="90" x2="350" y2="400" stroke="#5c381e" strokeWidth="8" strokeLinecap="round" />
        </g>

        {/* Stall Wooden Table / Counter */}
        <rect x="-60" y="270" width="340" height="130" rx="6" fill="#a16207" stroke="#1e242b" strokeWidth="6" />
        <line x1="-60" y1="310" x2="280" y2="310" stroke="#78350f" strokeWidth="4" />
        <line x1="-60" y1="350" x2="280" y2="350" stroke="#78350f" strokeWidth="4" />

        {/* Spice Sacks on Counter (Turmeric, Saffron, Paprika) */}
        <g transform="translate(-30, 210)">
          {/* Sack 1 (Yellow) */}
          <path d="M 0 60 Q -15 30 0 10 Q 30 0 60 10 Q 75 30 60 60 Z" fill="#b45309" stroke="#1e242b" strokeWidth="4" />
          <ellipse cx="30" cy="12" rx="22" ry="12" fill="#fbbf24" stroke="#1e242b" strokeWidth="3" />
        </g>
        <g transform="translate(45, 210)">
          {/* Sack 2 (Red paprika) */}
          <path d="M 0 60 Q -15 30 0 10 Q 30 0 60 10 Q 75 30 60 60 Z" fill="#b45309" stroke="#1e242b" strokeWidth="4" />
          <ellipse cx="30" cy="12" rx="22" ry="12" fill="#dc2626" stroke="#1e242b" strokeWidth="3" />
        </g>
        <g transform="translate(120, 210)">
          {/* Sack 3 (Green herbs) */}
          <path d="M 0 60 Q -15 30 0 10 Q 30 0 60 10 Q 75 30 60 60 Z" fill="#b45309" stroke="#1e242b" strokeWidth="4" />
          <ellipse cx="30" cy="12" rx="22" ry="12" fill="#16a34a" stroke="#1e242b" strokeWidth="3" />
        </g>
      </g>

      {/* Clay Pottery & Urns stacked on the left */}
      <g transform="translate(240, 1420)">
        {/* Big Clay Amphora */}
        <path
          d="M 30 0 Q 55 45 45 100 Q 35 150 0 160 Q -35 150 -45 100 Q -55 45 -30 0 Z"
          fill="#c2410c"
          stroke="#1e242b"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <ellipse cx="0" cy="0" rx="30" ry="10" fill="#9a3412" stroke="#1e242b" strokeWidth="4" />
        {/* Amphora handles */}
        <path d="M -35 30 Q -60 60 -40 90" fill="none" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
        <path d="M 35 30 Q 60 60 40 90" fill="none" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Wooden Hitching Post for Donkey */}
      <g transform="translate(480, 1370)">
        <rect x="0" y="0" width="22" height="210" rx="4" fill="#6d3a14" stroke="#1e242b" strokeWidth="5" />
        <circle cx="11" cy="40" r="14" fill="none" stroke="#1e242b" strokeWidth="6" />
      </g>
    </g>
  );
};

// ==========================================
// 3. DESERT ROAD ENVIRONMENT (في الطريق)
// ==========================================
export const DesertRoadEnvironment: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <g>
      {/* Warm Cartoon Desert Sun */}
      <g transform="translate(860, 420)">
        {/* Sun Aura */}
        <circle cx="0" cy="0" r="90" fill="#fde047" opacity="0.3" />
        {/* Sun Body */}
        <circle cx="0" cy="0" r="60" fill="#f59e0b" stroke="#d97706" strokeWidth="6" />
        {/* Sun Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => (
          <line
            key={idx}
            x1="0"
            y1="0"
            x2={Math.cos((deg * Math.PI) / 180) * 110}
            y2={Math.sin((deg * Math.PI) / 180) * 110}
            stroke="#f59e0b"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Distant Mountain Ridges */}
      <path
        d="M -100 1280 L 120 1140 L 320 1250 L 560 1100 L 780 1240 L 980 1120 L 1200 1280 Z"
        fill="#fed7aa"
        stroke="#ea580c"
        strokeWidth="3"
        opacity="0.6"
      />

      {/* Rolling Sand Dunes - Background Layer */}
      <path
        d="M -100 1480 Q 240 1340 540 1420 Q 840 1500 1200 1360 L 1200 1700 L -100 1700 Z"
        fill="#fde047"
        stroke="#1e242b"
        strokeWidth="5"
      />

      {/* Rolling Sand Dunes - Foreground Layer */}
      <path
        d="M -100 1580 Q 300 1460 700 1560 Q 950 1620 1200 1540 L 1200 1700 L -100 1700 Z"
        fill="#eab308"
        stroke="#1e242b"
        strokeWidth="6"
      />

      {/* Large Desert Rocks & Boulders (Where the thief sneaks from!) */}
      <g transform="translate(180, 1500)">
        {/* Big Boulder */}
        <path
          d="M -90 80 Q -110 0 -50 -40 Q 20 -70 80 -30 Q 120 10 90 80 Z"
          fill="#94a3b8"
          stroke="#1e242b"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Rock texture ridges */}
        <path d="M -30 -30 Q -10 10 10 50" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        <path d="M 30 -20 Q 50 15 60 60" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

        {/* Small Boulder next to it */}
        <path
          d="M 60 80 Q 50 40 85 20 Q 130 15 140 60 Q 145 80 130 80 Z"
          fill="#64748b"
          stroke="#1e242b"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </g>

      {/* Desert Shrubs / Cacti / Dry tufts */}
      <g transform="translate(80, 1550)">
        <path d="M 0 30 Q -15 -10 -20 -35 Q -5 -10 0 30" fill="#65a30d" stroke="#1e242b" strokeWidth="3" />
        <path d="M 0 30 Q 5 -20 15 -45 Q 10 -10 0 30" fill="#84cc16" stroke="#1e242b" strokeWidth="3" />
        <path d="M 0 30 Q 25 -5 35 -20 Q 15 5 0 30" fill="#65a30d" stroke="#1e242b" strokeWidth="3" />
      </g>

      <g transform="translate(940, 1560)">
        <path d="M 0 20 Q -12 -15 -15 -35 Q -2 -8 0 20" fill="#65a30d" stroke="#1e242b" strokeWidth="3" />
        <path d="M 0 20 Q 8 -18 18 -40 Q 8 -5 0 20" fill="#84cc16" stroke="#1e242b" strokeWidth="3" />
      </g>
    </g>
  );
};
