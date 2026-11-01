import React from 'react';

export const CartoonRoom: React.FC = () => {
  return (
    <g id="dual-room-environment">
      <defs>
        {/* Room 1 (Dining) Gradients & Patterns */}
        <linearGradient id="dining-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdfaf3" />
          <stop offset="70%" stopColor="#f5eedf" />
          <stop offset="100%" stopColor="#e8decb" />
        </linearGradient>
        <linearGradient id="dining-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c5b095" />
          <stop offset="100%" stopColor="#9c8365" />
        </linearGradient>
        <pattern id="dining-wallpaper" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="2" fill="#d9cbba" opacity="0.6" />
          <path d="M12 25 L38 25 M25 12 L25 38" stroke="#e8dcca" strokeWidth="1" opacity="0.4" />
        </pattern>

        {/* Room 2 (Majlis) Gradients & Patterns */}
        <linearGradient id="majlis-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7fbf9" />
          <stop offset="70%" stopColor="#eaf3ee" />
          <stop offset="100%" stopColor="#d9e6de" />
        </linearGradient>
        <linearGradient id="majlis-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfa98d" />
          <stop offset="100%" stopColor="#967e63" />
        </linearGradient>
        <pattern id="majlis-wallpaper" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,10 40,25 55,30 40,35 30,50 20,35 5,30 20,25" fill="#c4d8ce" opacity="0.25" />
          <circle cx="30" cy="30" r="3" fill="#8faeb1" opacity="0.3" />
        </pattern>
        <pattern id="carpet-pattern" width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="#8f322b" />
          <path d="M0 0 L22 22 L44 0 L22 44 Z" fill="#d99938" opacity="0.4" />
          <circle cx="22" cy="22" r="5" fill="#fcf6ec" opacity="0.5" />
        </pattern>
      </defs>

      {/* ========================================================================= */}
      {/* 1. ROOM 1: DINING / FOOD FRIEND'S HOUSE (X: 0 to 1200)                    */}
      {/* ========================================================================= */}
      <g id="room-1-dining">
        {/* Wall */}
        <rect x="0" y="0" width="1200" height="1350" fill="url(#dining-wall)" />
        <rect x="0" y="0" width="1200" height="1350" fill="url(#dining-wallpaper)" />

        {/* Baseboard */}
        <rect x="0" y="1320" width="1200" height="35" fill="#6d543d" />
        <rect x="0" y="1316" width="1200" height="5" fill="#4d3824" />

        {/* Floor */}
        <rect x="0" y="1350" width="1200" height="570" fill="url(#dining-floor)" />
        {/* Wood planks lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`plank-${i}`}
            x1="0"
            y1={1350 + i * 95}
            x2="1200"
            y2={1350 + i * 95}
            stroke="#877054"
            strokeWidth="3"
            opacity="0.5"
          />
        ))}

        {/* Window in Room 1 */}
        <g transform="translate(140, 260)">
          <path
            d="M 0 540 L 0 240 Q 0 0 190 0 Q 380 0 380 240 L 380 540 Z"
            fill="#cce4ef"
            stroke="#6d543d"
            strokeWidth="16"
          />
          <path
            d="M 12 530 L 12 245 Q 12 18 190 18 Q 368 18 368 245 L 368 530 Z"
            fill="#eaf6fb"
          />
          <circle cx="260" cy="150" r="55" fill="#ffefa8" opacity="0.8" />
          <line x1="190" y1="18" x2="190" y2="530" stroke="#6d543d" strokeWidth="8" />
          <line x1="12" y1="280" x2="368" y2="280" stroke="#6d543d" strokeWidth="8" />
          <line x1="12" y1="420" x2="368" y2="420" stroke="#6d543d" strokeWidth="8" />
          <rect x="-24" y="535" width="428" height="24" rx="6" fill="#4d3824" />
        </g>

        {/* Hanging Kitchen Lamp */}
        <g transform="translate(750, 0)">
          <line x1="0" y1="0" x2="0" y2="280" stroke="#242326" strokeWidth="4" />
          <path d="M -60 320 Q 0 260 60 320 Z" fill="#ebc469" stroke="#242326" strokeWidth="5" />
          <ellipse cx="0" cy="320" rx="60" ry="14" fill="#fef2cd" stroke="#242326" strokeWidth="4" />
          <circle cx="0" cy="330" r="16" fill="#fff" opacity="0.8" />
        </g>

        {/* Dining / Feast Table on the right side of Room 1 */}
        <g transform="translate(720, 1260)">
          <ellipse cx="180" cy="180" rx="200" ry="24" fill="#000" opacity="0.12" />
          <rect x="40" y="0" width="22" height="170" rx="4" fill="#6d4c2d" stroke="#242326" strokeWidth="4" />
          <rect x="300" y="0" width="22" height="170" rx="4" fill="#6d4c2d" stroke="#242326" strokeWidth="4" />
          <rect x="0" y="-20" width="360" height="36" rx="8" fill="#a47244" stroke="#242326" strokeWidth="6" />
          <rect x="15" y="-14" width="330" height="8" rx="3" fill="#c39263" />

          {/* Food Platter & Roast Chicken / Fruit on table */}
          <ellipse cx="180" cy="-35" rx="90" ry="18" fill="#eae6dc" stroke="#242326" strokeWidth="4" />
          <path d="M 125 -42 Q 180 -95 235 -42 Q 220 -20 140 -20 Z" fill="#c76d32" stroke="#242326" strokeWidth="5" />
          {/* Steam puffs */}
          <path d="M 160 -95 Q 155 -125 168 -145" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <path d="M 195 -90 Q 205 -120 190 -140" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 2. DIVIDER ARCH / DOORWAY CONNECTING BOTH ROOMS (X: 1200 to 1440)          */}
      {/* ========================================================================= */}
      <g id="middle-hallway-arch">
        {/* Wall pillar above arch */}
        <rect x="1200" y="0" width="240" height="240" fill="#ded5c5" stroke="#523b28" strokeWidth="4" />
        {/* Outer Wooden Arch Trim */}
        <path
          d="M 1200 1350 L 1200 420 Q 1320 220 1440 420 L 1440 1350 Z"
          fill="none"
          stroke="#523b28"
          strokeWidth="28"
        />
        {/* Inner Arch Molding & Threshold shadow */}
        <path
          d="M 1218 1350 L 1218 430 Q 1320 250 1422 430 L 1422 1350 Z"
          fill="none"
          stroke="#856345"
          strokeWidth="8"
        />
        {/* Doorway Floor Threshold strip */}
        <rect x="1195" y="1342" width="250" height="24" fill="#4d3824" stroke="#242326" strokeWidth="3" />
        <rect x="1205" y="1348" width="230" height="8" fill="#a47244" />
      </g>

      {/* ========================================================================= */}
      {/* 3. ROOM 2: MAJLIS / RIGHTEOUS FRIEND'S HOUSE (X: 1440 to 2640)            */}
      {/* ========================================================================= */}
      <g id="room-2-majlis">
        {/* Wall */}
        <rect x="1440" y="0" width="1200" height="1350" fill="url(#majlis-wall)" />
        <rect x="1440" y="0" width="1200" height="1350" fill="url(#majlis-wallpaper)" />

        {/* Baseboard */}
        <rect x="1440" y="1320" width="1200" height="35" fill="#523b28" />
        <rect x="1440" y="1316" width="1200" height="5" fill="#382618" />

        {/* Floor */}
        <rect x="1440" y="1350" width="1200" height="570" fill="url(#majlis-floor)" />

        {/* Beautiful Islamic Arched Window in Majlis */}
        <g transform="translate(1960, 240)">
          <path
            d="M 0 540 L 0 240 Q 0 0 190 0 Q 380 0 380 240 L 380 540 Z"
            fill="#e2eff5"
            stroke="#523b28"
            strokeWidth="16"
          />
          <path
            d="M 12 530 L 12 245 Q 12 18 190 18 Q 368 18 368 245 L 368 530 Z"
            fill="#edf7fa"
          />
          {/* Islamic geometric window grill */}
          <line x1="190" y1="18" x2="190" y2="530" stroke="#523b28" strokeWidth="6" />
          <line x1="12" y1="280" x2="368" y2="280" stroke="#523b28" strokeWidth="6" />
          <circle cx="190" cy="280" r="70" fill="none" stroke="#523b28" strokeWidth="6" />
          <circle cx="190" cy="280" r="30" fill="none" stroke="#ebc469" strokeWidth="4" />
          <rect x="-24" y="535" width="428" height="24" rx="6" fill="#382618" />
        </g>

        {/* Wall Clock / Prayer Times Frame in Majlis */}
        <g transform="translate(1620, 320)">
          <rect x="-90" y="-80" width="180" height="160" rx="14" fill="#3d2a1c" stroke="#242326" strokeWidth="6" />
          <rect x="-74" y="-64" width="148" height="128" rx="8" fill="#fffaf0" stroke="#ebc469" strokeWidth="4" />
          {/* Clock face */}
          <circle cx="0" cy="0" r="46" fill="#fdf8eb" stroke="#a47244" strokeWidth="3" />
          {/* Clock hands pointing to prayer time */}
          <line x1="0" y1="0" x2="0" y2="-28" stroke="#242326" strokeWidth="4" strokeLinecap="round" />
          <line x1="0" y1="0" x2="22" y2="8" stroke="#242326" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="0" r="5" fill="#b74365" />
          {/* Small Arabic title in clock */}
          <text x="0" y="-34" textAnchor="middle" fill="#8f322b" fontSize="12" fontWeight="bold">مواقيت الصلاة</text>
        </g>

        {/* Ornate Majlis Floor Carpet */}
        <g transform="translate(1560, 1420)">
          <ellipse cx="440" cy="140" rx="460" ry="100" fill="url(#carpet-pattern)" stroke="#521f1b" strokeWidth="8" />
          <ellipse cx="440" cy="140" rx="400" ry="80" fill="none" stroke="#ebc469" strokeWidth="4" />
          <ellipse cx="440" cy="140" rx="240" ry="45" fill="none" stroke="#fcf6ec" strokeWidth="2" strokeDasharray="8 6" />
        </g>
      </g>
    </g>
  );
};
