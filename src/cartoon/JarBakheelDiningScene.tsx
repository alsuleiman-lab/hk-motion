import React from "react";
import { Img, staticFile } from "remotion";
import { FONT_TITLE } from "../localFonts";

export interface DiningSceneProps {
  frame: number;
  time: number;
}

export const JarBakheelDiningScene: React.FC<DiningSceneProps> = ({ frame, time }) => {
  // Timing for the three morsels:
  // 34.86s - 36.94s: لقمة في فمك
  // 36.94s - 38.70s: وأخرى في يدك
  // 38.70s - 41.10s: وعينك ترنو إلى الثالثة
  const isMorsel1 = time >= 34.86;
  const isMorsel2 = time >= 36.94;
  const isMorsel3 = time >= 38.70;

  // Chewing mouth animation (alternating mouth open / closed at chewing cadence)
  const isChewing = time >= 29.5 && time < 34.86;
  const chewMouthOpen = isChewing ? Math.floor(frame / 3) % 2 === 0 : true;
  const eaterMouthSuffix = isMorsel1 ? "" : (chewMouthOpen ? "" : "_closed");
  const eaterBase = isMorsel2 ? "point_talk" : "hands_up";

  // Laser beam opacity / pulsing for third morsel
  const laserPulse = isMorsel3 ? 0.7 + Math.sin(frame * 0.5) * 0.3 : 0;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Miser on the left watching in pure shock */}
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 1040,
          transform: "translate(-50%, -50%) scale(1.1)",
          zIndex: 40,
        }}
      >
        <Img
          src={staticFile("jar_bakheel/miser_hands_up.png")}
          style={{ width: 320, height: 240, objectFit: "contain" }}
        />
        <div
          style={{
            position: "absolute",
            top: -50,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fee2e2",
            color: "#991b1b",
            padding: "6px 18px",
            borderRadius: 20,
            fontFamily: FONT_TITLE(),
            fontSize: 26,
            fontWeight: 800,
            border: "3px solid #ef4444",
            whiteSpace: "nowrap",
          }}
        >
          😱 مذهول من الأكل!
        </div>
      </div>

      {/* The Eater Neighbor in the center/right */}
      <div
        style={{
          position: "absolute",
          right: 220,
          top: 1020,
          transform: "translate(50%, -50%) scale(1.25)",
          zIndex: 50,
        }}
      >
        {/* Main eater character with animated chewing mouth */}
        <Img
          src={staticFile(`jar_bakheel/${eaterBase}${eaterMouthSuffix}.png`)}
          style={{ width: 340, height: 260, objectFit: "contain" }}
        />

        {/* MORSEL 1: Inside / at mouth */}
        {isMorsel1 && (
          <div
            style={{
              position: "absolute",
              top: 75,
              left: 155,
              zIndex: 60,
              transform: "scale(1.2)",
            }}
          >
            {/* Comic morsel shape */}
            <div
              style={{
                width: 32,
                height: 24,
                borderRadius: "50%",
                background: "#b45309",
                border: "3px solid #78350f",
                boxShadow: "0 0 10px #f59e0b",
              }}
            />
            {/* Tag */}
            <div
              style={{
                position: "absolute",
                top: -38,
                left: -70,
                background: "#fef08a",
                color: "#713f12",
                border: "3px solid #ca8a04",
                borderRadius: 14,
                padding: "2px 10px",
                fontFamily: FONT_TITLE(),
                fontSize: 22,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              🍗 1. في فمك!
            </div>
          </div>
        )}

        {/* MORSEL 2: In hand */}
        {isMorsel2 && (
          <div
            style={{
              position: "absolute",
              top: 35,
              right: 25,
              zIndex: 60,
              transform: "scale(1.25)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 28,
                borderRadius: "45%",
                background: "#ea580c",
                border: "3px solid #7c2d12",
                boxShadow: "0 0 12px #fb923c",
              }}
            />
            {/* Tag */}
            <div
              style={{
                position: "absolute",
                top: -38,
                right: -40,
                background: "#ffedd5",
                color: "#9a3412",
                border: "3px solid #ea580c",
                borderRadius: 14,
                padding: "2px 10px",
                fontFamily: FONT_TITLE(),
                fontSize: 22,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              🖐️ 2. في يدك!
            </div>
          </div>
        )}

        {/* EYE BEAM to Morsel 3 */}
        {isMorsel3 && (
          <svg
            style={{
              position: "absolute",
              top: 40,
              left: -320,
              width: 480,
              height: 380,
              overflow: "visible",
              zIndex: 70,
              pointerEvents: "none",
            }}
          >
            <line
              x1="380"
              y1="35"
              x2="70"
              y2="340"
              stroke="#ef4444"
              strokeWidth="6"
              strokeDasharray="10 6"
              opacity={laserPulse}
            />
            {/* Laser glow */}
            <line
              x1="380"
              y1="35"
              x2="70"
              y2="340"
              stroke="#fca5a5"
              strokeWidth="14"
              opacity={laserPulse * 0.4}
            />
          </svg>
        )}
      </div>

      {/* Comic Dining Table / Brass Tray in foreground */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 180,
          transform: "translateX(-50%)",
          width: 900,
          height: 360,
          zIndex: 55,
        }}
      >
        <svg width="900" height="360" viewBox="0 0 900 360">
          <defs>
            <radialGradient id="brassGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>
          </defs>

          {/* Table Legs */}
          <rect x="220" y="220" width="30" height="120" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="6" />
          <rect x="650" y="220" width="30" height="120" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="6" />

          {/* Large Brass Tray (سفرة) */}
          <ellipse cx="450" cy="210" rx="420" ry="110" fill="url(#brassGrad)" stroke="#713f12" strokeWidth="12" />
          <ellipse cx="450" cy="205" rx="390" ry="95" fill="#facc15" stroke="#a16207" strokeWidth="4" />

          {/* Platter of Rice & Meat */}
          <ellipse cx="450" cy="195" rx="280" ry="70" fill="#fef9c3" stroke="#ca8a04" strokeWidth="6" />
          {/* Meat chunks */}
          <ellipse cx="410" cy="185" rx="55" ry="32" fill="#7c2d12" stroke="#451a03" strokeWidth="4" />
          <ellipse cx="490" cy="190" rx="60" ry="35" fill="#9a3412" stroke="#451a03" strokeWidth="4" />
          <ellipse cx="450" cy="175" rx="45" ry="26" fill="#b45309" stroke="#451a03" strokeWidth="4" />

          {/* MORSEL 3: On the tray waiting to be eaten! */}
          <g transform="translate(340, 200)">
            <ellipse
              cx="0"
              cy="0"
              rx="40"
              ry="26"
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="5"
              filter={isMorsel3 ? "drop-shadow(0 0 16px #ef4444)" : undefined}
            />
            {/* Shiny highlight */}
            <ellipse cx="-10" cy="-6" rx="14" ry="7" fill="#fca5a5" />

            {/* Tag & Bouncing Arrow for Morsel 3 */}
            {isMorsel3 && (
              <g transform={`translate(0, ${Math.sin(frame * 0.4) * 8 - 50})`}>
                <polygon points="0,0 -16,-24 16,-24" fill="#dc2626" />
                <rect x="-105" y="-70" width="210" height="46" rx="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="4" />
                <text
                  x="0"
                  y="-40"
                  textAnchor="middle"
                  fill="#991b1b"
                  fontSize="24"
                  fontWeight="900"
                  fontFamily={FONT_TITLE()}
                >
                  👀 3. ترنو إليها!
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};

