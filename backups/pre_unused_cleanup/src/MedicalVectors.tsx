import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { amiri, cairo } from "./Scenes";
import { lalezar } from "./RefStyle";

/**
 * 1. Clean Anatomical Vector Cross-Section of the Uterus (الرحم وبطانته والمبيضان)
 */
export const UterusVectorDiagram: React.FC<{ highlightEndometrium?: boolean; w?: number; h?: number }> = ({
  highlightEndometrium = true,
  w = 460,
  h = 340,
}) => {
  const f = useCurrentFrame();
  const pulse = Math.sin(f * 0.08) * 0.04 + 1;

  return (
    <div style={{ position: "relative", width: w, height: h, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg viewBox="0 0 500 400" width={w} height={h} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="myoGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#c95a6a" />
            <stop offset="100%" stopColor="#872938" />
          </radialGradient>
          <linearGradient id="endoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb3ba" />
            <stop offset="100%" stopColor="#d94b60" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background Glow */}
        <ellipse cx="250" cy="200" rx="200" ry="140" fill="rgba(217, 75, 96, 0.12)" filter="url(#glow)" />

        {/* Fallopian Tubes & Ovaries (الأنابيب والمبيضان) */}
        {/* Left Tube & Ovary */}
        <path d="M 180 130 C 130 90, 70 100, 50 140 C 40 160, 60 180, 80 170" fill="none" stroke="#ba4858" strokeWidth="14" strokeLinecap="round" />
        <ellipse cx="90" cy="185" rx="24" ry="18" fill="#ffd8a8" stroke="#d97706" strokeWidth="3" />
        <text x="90" y="225" fill="#ffd8a8" fontFamily={cairo} fontWeight="800" fontSize="16" textAnchor="middle">مبيض (تبييض)</text>

        {/* Right Tube & Ovary */}
        <path d="M 320 130 C 370 90, 430 100, 450 140 C 460 160, 440 180, 420 170" fill="none" stroke="#ba4858" strokeWidth="14" strokeLinecap="round" />
        <ellipse cx="410" cy="185" rx="24" ry="18" fill="#ffd8a8" stroke="#d97706" strokeWidth="3" />
        <text x="410" y="225" fill="#ffd8a8" fontFamily={cairo} fontWeight="800" fontSize="16" textAnchor="middle">مبيض (تبييض)</text>

        {/* Uterus Myometrium (عضلة الرحم الخارجية) */}
        <path
          d="M 170 130 C 210 115, 290 115, 330 130 C 370 145, 350 240, 280 290 L 280 340 L 220 340 L 220 290 C 150 240, 130 145, 170 130 Z"
          fill="url(#myoGrad)"
          stroke="#ff8899"
          strokeWidth="4"
        />

        {/* Endometrium Layer (بطانة الرحم الإسفنجية المخاطية) */}
        <path
          d="M 195 150 C 225 140, 275 140, 305 150 C 330 165, 315 235, 265 275 L 265 310 L 235 310 L 235 275 C 185 235, 170 165, 195 150 Z"
          fill="url(#endoGrad)"
          stroke={highlightEndometrium ? "#ffd426" : "#ffb3ba"}
          strokeWidth={highlightEndometrium ? 5 : 2}
          transform={`scale(${highlightEndometrium ? pulse : 1})`}
          style={{ transformOrigin: "250 210" }}
          filter={highlightEndometrium ? "url(#glow)" : undefined}
        />

        {/* Internal Uterine Cavity (تجويف الرحم) */}
        <path
          d="M 220 165 C 235 160, 265 160, 280 165 C 295 180, 275 220, 255 250 L 255 300 L 245 300 L 245 250 C 225 220, 205 180, 220 165 Z"
          fill="#1b2a3d"
        />

        {/* Callout Labels */}
        {/* Label: جدار الرحم العضلي */}
        <line x1="140" y1="210" x2="80" y2="250" stroke="#ff8899" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="140" cy="210" r="4" fill="#ffd426" />
        <rect x="10" y="245" width="125" height="32" rx="8" fill="rgba(10,25,45,0.85)" stroke="#ff8899" strokeWidth="1.5" />
        <text x="72" y="267" fill="#fff" fontFamily={cairo} fontWeight="800" fontSize="15" textAnchor="middle">جدار الرحم</text>

        {/* Label: بطانة الرحم (المشروحة) */}
        <line x1="215" y1="210" x2="160" y2="310" stroke="#ffd426" strokeWidth="3" />
        <circle cx="215" cy="210" r="6" fill="#ffd426" />
        <rect x="75" y="305" width="160" height="38" rx="10" fill="rgba(255,212,38,0.95)" />
        <text x="155" y="331" fill="#111" fontFamily={lalezar} fontSize="22" textAnchor="middle">بطانة الرحم الإسفنجية</text>

        {/* Label: عنق الرحم */}
        <line x1="280" y1="330" x2="340" y2="350" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="280" cy="330" r="4" fill="#94a3b8" />
        <rect x="345" y="335" width="110" height="30" rx="8" fill="rgba(10,25,45,0.85)" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="400" y="356" fill="#cbd5e1" fontFamily={cairo} fontWeight="700" fontSize="14" textAnchor="middle">عنق الرحم</text>
      </svg>
    </div>
  );
};

/**
 * 2. Detailed Microscopic Cross-Section of the Endometrium & Spiral Arterioles (الشُرينات الحلزونية)
 */
export const EndometriumLayersDiagram: React.FC<{
  thicknessMm?: number; // 1 to 15 mm
  showSpiralVessels?: boolean;
  ruptured?: boolean; // whether the vessel ruptured ("عرق")
  w?: number;
  h?: number;
}> = ({ thicknessMm = 10, showSpiralVessels = true, ruptured = false, w = 520, h = 380 }) => {
  const f = useCurrentFrame();
  const currentHeight = interpolate(thicknessMm, [1, 15], [90, 230], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseRupture = Math.sin(f * 0.2) * 4 + 10;

  return (
    <div style={{ position: "relative", width: w, height: h, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg viewBox="0 0 540 400" width={w} height={h} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="muscleGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#661c28" />
            <stop offset="100%" stopColor="#872938" />
          </linearGradient>
          <linearGradient id="spongeGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c9495c" />
            <stop offset="60%" stopColor="#e8687a" />
            <stop offset="100%" stopColor="#ff9eaa" />
          </linearGradient>
          <pattern id="spongeDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="3.5" fill="rgba(255,255,255,0.25)" />
            <circle cx="6" cy="6" r="2" fill="rgba(100,10,20,0.2)" />
          </pattern>
        </defs>

        {/* 1. Base Muscle Layer (عضلة الرحم Myometrium) */}
        <rect x="40" y="320" width="460" height="60" rx="12" fill="url(#muscleGrad)" stroke="#a33646" strokeWidth="2" />
        <text x="270" y="358" fill="#ffd8a8" fontFamily={cairo} fontWeight="800" fontSize="18" textAnchor="middle">
          جدار الرحم العضلي (القاعدة)
        </text>

        {/* 2. Endometrium Spongy Layer (بطانة الرحم الإسفنجية المتنامية) */}
        <g>
          {/* Main Spongy Body */}
          <rect
            x="40"
            y={320 - currentHeight}
            width="460"
            height={currentHeight}
            rx="16"
            fill="url(#spongeGrad)"
            stroke="#ffb3ba"
            strokeWidth="3"
          />
          {/* Spongy mucosal pattern */}
          <rect
            x="40"
            y={320 - currentHeight}
            width="460"
            height={currentHeight}
            rx="16"
            fill="url(#spongeDots)"
          />

          {/* Top Mucosal Boundary */}
          <path
            d={`M 40 ${320 - currentHeight} Q 155 ${315 - currentHeight}, 270 ${320 - currentHeight} T 500 ${320 - currentHeight}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
          />
        </g>

        {/* Thickness Indicator Dimension Bar */}
        <g>
          <line x1="515" y1="320" x2="515" y2={320 - currentHeight} stroke="#ffd426" strokeWidth="3" markerEnd="url(#arrow)" />
          <line x1="508" y1="320" x2="522" y2="320" stroke="#ffd426" strokeWidth="3" />
          <line x1="508" y1={320 - currentHeight} x2="522" y2={320 - currentHeight} stroke="#ffd426" strokeWidth="3" />
          <rect x="460" y={320 - currentHeight / 2 - 18} width="70" height="36" rx="8" fill="#1b2a3d" stroke="#ffd426" strokeWidth="2" />
          <text x="495" y={320 - currentHeight / 2 + 6} fill="#ffd426" fontFamily={lalezar} fontSize="20" textAnchor="middle">
            {thicknessMm} ملم
          </text>
        </g>

        {/* 3. Spiral Arterioles (الشُرينات الحلزونية الدقيقة) */}
        {showSpiralVessels && (
          <g>
            {/* Vessel 1 (Normal Spiral on the right) */}
            <path
              d={`M 140 320 
                  C 115 290, 165 260, 140 230 
                  C 115 200, 165 170, 140 ${Math.max(320 - currentHeight + 20, 140)} 
                  C 125 ${Math.max(320 - currentHeight + 10, 120)}, 155 ${Math.max(320 - currentHeight, 100)}, 140 ${320 - currentHeight}`}
              fill="none"
              stroke="#e11d48"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Vessel 2 (Center Spiral - The one that ruptures in Istihada) */}
            <path
              d={`M 270 320 
                  C 240 290, 300 260, 270 230 
                  C 240 200, 300 170, 270 ${Math.max(320 - currentHeight + 20, 140)} 
                  C 250 ${Math.max(320 - currentHeight + 10, 120)}, 290 ${Math.max(320 - currentHeight, 100)}, 270 ${320 - currentHeight}`}
              fill="none"
              stroke={ruptured ? "#ff0033" : "#e11d48"}
              strokeWidth={ruptured ? 7 : 5}
              strokeLinecap="round"
            />

            {/* Vessel 3 (Left Spiral) */}
            <path
              d={`M 400 320 
                  C 375 290, 425 260, 400 230 
                  C 375 200, 425 170, 400 ${Math.max(320 - currentHeight + 20, 140)} 
                  C 385 ${Math.max(320 - currentHeight + 10, 120)}, 415 ${Math.max(320 - currentHeight, 100)}, 400 ${320 - currentHeight}`}
              fill="none"
              stroke="#e11d48"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Vessel Label */}
            <rect x="70" y="20" width="220" height="38" rx="10" fill="rgba(15,30,50,0.9)" stroke="#e11d48" strokeWidth="2" />
            <text x="180" y="45" fill="#ffb3ba" fontFamily={cairo} fontWeight="800" fontSize="16" textAnchor="middle">
              الشُّرينات الحلزونية (عروق البطانة)
            </text>
            <line x1="180" y1="58" x2="155" y2="150" stroke="#e11d48" strokeWidth="2" strokeDasharray="3 3" />

            {/* Rupture Callout (إذا كان هناك تمزق وعاء دموي: إنما ذلك عِرق!) */}
            {ruptured && (
              <g>
                <circle cx="270" cy={320 - currentHeight} r={pulseRupture} fill="rgba(255,0,50,0.4)" />
                <circle cx="270" cy={320 - currentHeight} r="7" fill="#ff0033" stroke="#fff" strokeWidth="2" />

                {/* Blood flow spurts */}
                <path
                  d={`M 270 ${320 - currentHeight} Q 285 ${300 - currentHeight}, 310 ${290 - currentHeight} T 340 ${280 - currentHeight}`}
                  fill="none"
                  stroke="#ff1744"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                <rect x="290" y={220 - currentHeight} width="220" height="52" rx="12" fill="rgba(220,20,40,0.95)" stroke="#ffd426" strokeWidth="3" />
                <text x="400" y={246 - currentHeight} fill="#fff" fontFamily={lalezar} fontSize="22" textAnchor="middle">
                  انفجار الوعاء الدموي
                </text>
                <text x="400" y={264 - currentHeight} fill="#ffd426" fontFamily={cairo} fontWeight="900" fontSize="15" textAnchor="middle">
                  «إنما ذلك عِــرْق!»
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
