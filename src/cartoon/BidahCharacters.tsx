import React from "react";

/**
 * BidahCharacters.tsx - High-Quality 2D Cutout Puppet Character Rigs
 * 1. YouthCutout: Young disputer with backwards cap, oversized tee, modern sneakers.
 * 2. SheikhCutout: Dignified scholar with white turban, flowing jubba, expressive beard and eyes.
 * 3. FriendCutout: Calming companion in white thobe, white ghutra and black egal.
 */

export interface CharacterProps {
  frame: number;
  time: number;
  pulse: number;
  action: string;
  isSpeaker?: boolean;
}

// ==========================================
// 1. YOUTH CUTOUT (الشاب المعترض ذو الكاب)
// ==========================================
export const YouthCutout: React.FC<CharacterProps> = ({
  frame,
  pulse,
  action,
  isSpeaker = false,
}) => {
  const breathe = Math.sin(frame * 0.12) * 2.5;
  const mouthOpen = isSpeaker ? Math.min(18, pulse * 22) : 0;

  const isArgue = action === "argue_confidently";
  const isSmug = action === "stubborn_smug";
  const isClueless = action === "clueless_question";
  const isBlank = action === "blank_repetition";
  const isHit = action === "hit_and_beat";

  // Head tilt & bob
  const headTilt = isHit
    ? 24 + Math.sin(frame * 1.5) * 8
    : isClueless
    ? 10
    : isBlank
    ? -8
    : isSmug
    ? -5
    : breathe * 0.4;
  const headBob = isHit
    ? Math.sin(frame * 2.2) * 8
    : isSpeaker
    ? Math.sin(frame * 0.45) * 3.5
    : 0;

  // Arm poses
  const rightArmRot = isHit
    ? -115 + Math.sin(frame * 1.4) * 16
    : isArgue
    ? -55 + Math.sin(frame * 0.35) * 8
    : isClueless
    ? 28 + Math.sin(frame * 0.2) * 5
    : isBlank
    ? -68 + Math.sin(frame * 0.15) * 3
    : 10 + breathe * 0.5;

  const leftArmRot = isHit
    ? -92 - Math.cos(frame * 1.4) * 16
    : isClueless
    ? -28 - Math.sin(frame * 0.2) * 5
    : isSmug
    ? -32
    : -8 + breathe * 0.4;

  return (
    <g transform={`translate(${isHit ? Math.sin(frame * 1.8) * 12 : 0}, ${breathe}) rotate(${isHit ? 14 : 0})`}>
      {/* Ground Shadow */}
      <ellipse cx="0" cy="810" rx="140" ry="18" fill="#05070a" opacity="0.6" />

      {/* Legs & Cargo Pants */}
      <g>
        {/* Left Leg */}
        <path
          d="M -50 440 Q -60 620 -62 755 L -18 755 Q -22 620 -15 440 Z"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="4"
        />
        {/* Right Leg */}
        <path
          d="M 15 440 Q 22 620 18 755 L 62 755 Q 60 620 50 440 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="4"
        />
        {/* Cargo Pockets */}
        <rect x="22" y="520" width="36" height="40" rx="4" fill="#0f172a" opacity="0.4" />
        <rect x="-58" y="520" width="36" height="40" rx="4" fill="#0f172a" opacity="0.4" />

        {/* Shoes */}
        <path
          d="M -74 755 Q -38 750 -12 755 L -8 790 Q -42 796 -78 790 Z"
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="3.5"
        />
        <rect x="-76" y="776" width="66" height="10" fill="#10b981" rx="3" />

        <path
          d="M 12 755 Q 38 750 74 755 L 78 790 Q 42 796 8 790 Z"
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="3.5"
        />
        <rect x="10" y="776" width="66" height="10" fill="#10b981" rx="3" />
      </g>

      {/* Left Arm (Behind) */}
      <g transform={`translate(-70, 195) rotate(${leftArmRot})`}>
        <path d="M -15 0 C -25 45 -28 100 -22 125 L 14 125 C 18 100 18 45 14 0 Z" fill="#475569" stroke="#0f172a" strokeWidth="4" />
        <g transform="translate(-8, 125)">
          <path d="M -10 0 L -12 100 L 12 100 L 10 0 Z" fill="#e2a878" stroke="#0f172a" strokeWidth="3" />
          <ellipse cx="0" cy="112" rx="16" ry="15" fill="#e2a878" stroke="#0f172a" strokeWidth="3" />
        </g>
      </g>

      {/* Torso - Oversized T-Shirt */}
      <g>
        <path
          d="M -80 170 Q 0 155 80 170 Q 88 310 82 455 Q 0 475 -82 455 Q -88 310 -80 170 Z"
          fill="#475569"
          stroke="#0f172a"
          strokeWidth="4.5"
        />
        {/* Collar */}
        <path
          d="M -32 170 Q 0 198 32 170 Q 0 162 -32 170 Z"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="3"
        />
        {/* Badge */}
        <g transform="translate(0, 270)" opacity="0.85">
          <rect x="-38" y="-20" width="76" height="40" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <circle cx="0" cy="0" r="12" fill="none" stroke="#10b981" strokeWidth="3" />
          <line x1="-7" y1="-7" x2="7" y2="7" stroke="#10b981" strokeWidth="2.5" />
        </g>
      </g>

      {/* Right Arm (Foreground) */}
      <g transform={`translate(70, 195) rotate(${rightArmRot})`}>
        <path d="M -14 0 C -18 45 -18 100 -14 125 L 22 125 C 28 100 24 45 14 0 Z" fill="#475569" stroke="#0f172a" strokeWidth="4" />
        <g transform="translate(4, 125)">
          <path d="M -10 0 L -12 100 L 12 100 L 10 0 Z" fill="#e2a878" stroke="#0f172a" strokeWidth="3" />
          <g transform="translate(0, 108)">
            {isArgue ? (
              // Pointing finger
              <g transform="rotate(-60)">
                <rect x="-12" y="0" width="24" height="24" rx="7" fill="#e2a878" stroke="#0f172a" strokeWidth="2.5" />
                <rect x="0" y="-34" width="12" height="38" rx="6" fill="#e2a878" stroke="#0f172a" strokeWidth="2.5" />
                <path d="M -10 8 L -10 18 M -3 8 L -3 18 M 4 8 L 4 18" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : isClueless ? (
              // Open shrugging palm
              <g transform="rotate(25)">
                <ellipse cx="0" cy="10" rx="16" ry="14" fill="#e2a878" stroke="#0f172a" strokeWidth="2.5" />
                <path d="M -9 2 L -10 -12 M -2 2 L -2 -16 M 5 2 L 5 -16 M 10 2 L 12 -12" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : (
              <ellipse cx="0" cy="10" rx="16" ry="15" fill="#e2a878" stroke="#0f172a" strokeWidth="2.5" />
            )}
          </g>
        </g>
      </g>

      {/* Head & Backward Cap */}
      <g transform={`translate(0, 165) translate(0, ${headBob}) rotate(${headTilt})`}>
        {/* Neck */}
        <path d="M -18 -25 L -22 15 L 22 15 L 18 -25 Z" fill="#e2a878" stroke="#0f172a" strokeWidth="3.5" />

        {/* Head */}
        <ellipse cx="0" cy="-70" rx="54" ry="60" fill="#e2a878" stroke="#0f172a" strokeWidth="3.5" />

        {/* Ears */}
        <ellipse cx="-52" cy="-68" rx="11" ry="16" fill="#e2a878" stroke="#0f172a" strokeWidth="3" />
        <ellipse cx="52" cy="-68" rx="11" ry="16" fill="#e2a878" stroke="#0f172a" strokeWidth="3" />

        {/* Backward Cap Visor */}
        <path
          d="M -46 -98 Q -88 -110 -100 -92 Q -92 -74 -50 -84 Z"
          fill="#0f172a"
          stroke="#020617"
          strokeWidth="3.5"
        />
        {/* Cap Dome */}
        <path
          d="M -54 -70 C -54 -142 54 -142 54 -70 Z"
          fill="#1e293b"
          stroke="#020617"
          strokeWidth="4"
        />
        {/* Snapback strap */}
        <rect x="-22" y="-112" width="44" height="13" rx="4" fill="#0f172a" stroke="#020617" strokeWidth="2" />
        <ellipse cx="0" cy="-118" rx="6" ry="4" fill="#94a3b8" />

        {/* Eyebrows */}
        {isHit ? (
          <>
            <path d="M -34 -104 L -4 -90" stroke="#0f172a" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 4 -90 L 34 -104" stroke="#0f172a" strokeWidth="5.5" strokeLinecap="round" />
          </>
        ) : isSmug ? (
          <>
            <path d="M -34 -88 Q -16 -100 -4 -90" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 4 -90 Q 16 -84 34 -90" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        ) : isClueless ? (
          <>
            <path d="M -34 -96 Q -16 -102 -4 -92" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 4 -92 Q 16 -102 34 -96" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M -34 -90 Q -16 -96 -4 -90" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 4 -90 Q 16 -96 34 -90" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Nose */}
        <path d="M 0 -70 Q 5 -58 0 -54" stroke="#b87a4c" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {isHit ? (
          <ellipse
            cx="0"
            cy="-36"
            rx="14"
            ry={15 + Math.sin(frame * 1.5) * 3}
            fill="#881337"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
        ) : isSpeaker ? (
          <ellipse
            cx="0"
            cy="-38"
            rx="14"
            ry={Math.max(4, mouthOpen)}
            fill="#881337"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
        ) : isSmug ? (
          <path d="M -12 -40 Q 0 -32 14 -44" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : isClueless ? (
          <ellipse cx="0" cy="-38" rx="6" ry="7" fill="#881337" stroke="#0f172a" strokeWidth="2" />
        ) : (
          <path d="M -10 -38 Q 0 -34 10 -38" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </g>
    </g>
  );
};

// ==========================================
// 2. SHEIKH CUTOUT (الشيخ المحاور الوقور)
// ==========================================
export const SheikhCutout: React.FC<CharacterProps> = ({
  frame,
  pulse,
  action,
  isSpeaker = false,
}) => {
  const isShocked = action === "shocked_rage";
  const isExplaining = action === "explain_calmly" || action === "explain_passionately";
  const isDespair = action === "despair_struggle";
  const isInsult = action === "insult_disbelief";
  const isHit = action === "hit_and_beat";

  const shake = (isShocked || isDespair) ? Math.sin(frame * 1.4) * 6 : 0;
  const breathe = Math.sin(frame * 0.15) * 2.5;
  const mouthOpen = isSpeaker ? Math.min(24, pulse * 26) : 0;

  // Arm poses
  const hitCycle = Math.sin(frame * 1.5);
  const leftArmRot = isHit
    ? -65 - Math.cos(frame * 1.5) * 45
    : isDespair
    ? -128 + Math.sin(frame * 0.5) * 6
    : isShocked
    ? -112
    : isExplaining
    ? -44 + Math.sin(frame * 0.25) * 14
    : -15;

  const rightArmRot = isHit
    ? -75 + hitCycle * 50
    : isDespair
    ? 128 - Math.sin(frame * 0.5) * 6
    : isShocked
    ? 112
    : isExplaining
    ? 52 + Math.sin(frame * 0.3) * 16
    : isInsult
    ? 78 + Math.sin(frame * 0.4) * 12
    : 15;

  return (
    <g transform={`translate(${isHit ? 10 : shake}, ${breathe}) rotate(${isHit ? -12 : 0})`}>
      {/* Ground Shadow */}
      <ellipse cx="0" cy="810" rx="170" ry="22" fill="#05070a" opacity="0.6" />

      {/* Traditional Flowing Jubba */}
      <g>
        <path
          d="M -105 170 Q -125 480 -130 760 L 130 760 Q 125 480 105 170 Z"
          fill="#fbf7ee"
          stroke="#261e19"
          strokeWidth="4.5"
        />
        {/* Soft Folds */}
        <path d="M -42 210 Q -52 500 -56 760" stroke="#e8ded0" strokeWidth="4" fill="none" />
        <path d="M 0 210 L 0 760" stroke="#d5c7b3" strokeWidth="4.5" fill="none" />
        <path d="M 42 210 Q 52 500 56 760" stroke="#e8ded0" strokeWidth="4" fill="none" />

        {/* Golden Placket */}
        <rect x="-9" y="170" width="18" height="250" fill="#d4af37" rx="3" stroke="#856404" strokeWidth="2" />
        {[195, 240, 285, 330, 375].map((y) => (
          <circle key={y} cx="0" cy={y} r="4" fill="#533f03" />
        ))}
      </g>

      {/* Left Arm (Behind) */}
      <g transform={`translate(-95, 195) rotate(${leftArmRot})`}>
        <path d="M -28 0 C -42 55 -50 115 -42 145 L 24 145 C 28 115 28 55 24 0 Z" fill="#fbf7ee" stroke="#261e19" strokeWidth="4" />
        <g transform="translate(-14, 145)">
          <path d="M -11 0 L -13 105 L 13 105 L 11 0 Z" fill="#deb887" stroke="#261e19" strokeWidth="3" />
          <ellipse cx="0" cy="115" rx={isHit ? 22 : 18} ry={isHit ? 22 : 16} fill="#deb887" stroke="#261e19" strokeWidth="3" />
        </g>
      </g>

      {/* Right Arm (Foreground) */}
      <g transform={`translate(95, 195) rotate(${rightArmRot})`}>
        <path d="M -24 0 C -28 55 -28 115 -24 145 L 42 145 C 50 115 42 55 28 0 Z" fill="#fbf7ee" stroke="#261e19" strokeWidth="4" />
        <g transform="translate(14, 145)">
          <path d="M -11 0 L -13 105 L 13 105 L 11 0 Z" fill="#deb887" stroke="#261e19" strokeWidth="3" />
          <g transform="translate(0, 114)">
            {isHit || isDespair ? (
              <circle cx="0" cy="0" r="22" fill="#deb887" stroke="#261e19" strokeWidth="3" />
            ) : isShocked || isExplaining ? (
              <g transform="rotate(20)">
                <ellipse cx="0" cy="0" rx="20" ry="16" fill="#deb887" stroke="#261e19" strokeWidth="3" />
                <path d="M -11 -10 L -11 -26 M -4 -10 L -4 -30 M 4 -10 L 4 -30 M 11 -10 L 11 -26" stroke="#261e19" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : (
              <ellipse cx="0" cy="0" rx="18" ry="16" fill="#deb887" stroke="#261e19" strokeWidth="3" />
            )}
          </g>
        </g>
      </g>

      {/* Head, Turban & Beard */}
      <g transform="translate(0, 160)">
        <path d="M -22 -25 L -25 15 L 25 15 L 22 -25 Z" fill="#deb887" stroke="#261e19" strokeWidth="3.5" />

        <ellipse cx="0" cy="-70" rx="60" ry="66" fill="#deb887" stroke="#261e19" strokeWidth="4" />

        {/* Beard & Mustache */}
        <path
          d="M -60 -70 C -64 -8 -36 30 0 32 C 36 30 64 -8 60 -70 C 45 -52 26 -42 0 -42 C -26 -42 -45 -52 -60 -70 Z"
          fill="#1c1613"
          stroke="#0a0807"
          strokeWidth="3.5"
        />
        <path
          d="M -36 -50 Q 0 -64 36 -50 Q 16 -36 0 -40 Q -16 -36 -36 -50 Z"
          fill="#1c1613"
          stroke="#0a0807"
          strokeWidth="2.5"
        />

        {/* Ears */}
        <ellipse cx="-58" cy="-68" rx="12" ry="18" fill="#deb887" stroke="#261e19" strokeWidth="3" />
        <ellipse cx="58" cy="-68" rx="12" ry="18" fill="#deb887" stroke="#261e19" strokeWidth="3" />

        {/* White Turban */}
        <path d="M -24 -124 Q 0 -150 24 -124 Z" fill="#991b1b" stroke="#261e19" strokeWidth="2.5" />
        <path
          d="M -72 -75 C -80 -142 -52 -166 0 -166 C 52 -166 80 -142 72 -75 Q 0 -95 -72 -75 Z"
          fill="#ffffff"
          stroke="#261e19"
          strokeWidth="4.5"
        />
        <path d="M -66 -114 Q 0 -140 66 -114" stroke="#d5c7b3" strokeWidth="3.5" fill="none" />
        <path d="M -62 -95 Q 0 -118 62 -95" stroke="#e8ded0" strokeWidth="3.5" fill="none" />

        {/* Eyebrows */}
        {isHit ? (
          <>
            <path d="M -40 -92 L -6 -108" stroke="#1c1613" strokeWidth="6" strokeLinecap="round" />
            <path d="M 40 -92 L 6 -108" stroke="#1c1613" strokeWidth="6" strokeLinecap="round" />
          </>
        ) : isShocked || isDespair ? (
          <>
            <path d="M -38 -108 L -8 -92" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 38 -108 L 8 -92" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" />
          </>
        ) : isExplaining ? (
          <>
            <path d="M -40 -102 Q -20 -114 -6 -102" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M 6 -102 Q 20 -114 40 -102" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M -40 -98 L -8 -104" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 40 -98 L 8 -104" stroke="#1c1613" strokeWidth="5.5" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <path d="M 0 -78 Q 7 -62 0 -58" stroke="#a06e42" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {isHit ? (
          <g>
            <ellipse
              cx="0"
              cy="-34"
              rx="17"
              ry={12 + Math.sin(frame * 1.5) * 4}
              fill="#881337"
              stroke="#1c1613"
              strokeWidth="3"
            />
            <rect x="-12" y="-38" width="24" height="6" rx="2" fill="#ffffff" stroke="#1c1613" strokeWidth="1" />
          </g>
        ) : isSpeaker ? (
          <ellipse
            cx="0"
            cy="-34"
            rx="15"
            ry={Math.max(5, mouthOpen)}
            fill="#881337"
            stroke="#1c1613"
            strokeWidth="3"
          />
        ) : (
          <path d="M -11 -34 Q 0 -30 11 -34" stroke="#1c1613" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </g>
    </g>
  );
};

// ==========================================
// 3. FRIEND CUTOUT (الصديق الهادئ بالغترة والعقال)
// ==========================================
export const FriendCutout: React.FC<CharacterProps> = ({
  frame,
  pulse,
  action,
  isSpeaker = false,
}) => {
  const breathe = Math.sin(frame * 0.1) * 2;
  const mouthOpen = isSpeaker ? Math.min(14, pulse * 18) : 0;
  const isHit = action === "hit_and_beat";
  const armHold = isHit
    ? -75 + Math.sin(frame * 0.9) * 8
    : -30 + Math.sin(frame * 0.2) * 4;

  return (
    <g transform={`translate(0, ${breathe}) rotate(${isHit ? -6 : 0})`}>
      {/* Ground Shadow */}
      <ellipse cx="0" cy="810" rx="145" ry="18" fill="#05070a" opacity="0.5" />

      {/* Clean White Thobe */}
      <path
        d="M -80 170 Q -100 480 -105 760 L 105 760 Q 100 480 80 170 Z"
        fill="#f8fafc"
        stroke="#1e293b"
        strokeWidth="4"
      />
      <path d="M -28 170 L 0 205 L 28 170 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2.5" />

      {/* Right Arm Reaching Reassuringly to Sheikh's shoulder */}
      <g transform={`translate(-65, 195) rotate(${armHold})`}>
        <path d="M -20 0 C -32 45 -38 105 -32 135 L 16 135 C 20 105 20 45 16 0 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" />
        <g transform="translate(-10, 135)">
          <path d="M -9 0 L -11 100 L 11 100 L 9 0 Z" fill="#deb887" stroke="#1e293b" strokeWidth="3" />
          <ellipse cx="0" cy="108" rx="16" ry="14" fill="#deb887" stroke="#1e293b" strokeWidth="3" />
        </g>
      </g>

      {/* Head with White Ghutra & Black Egal */}
      <g transform="translate(0, 155)">
        <path d="M -16 -25 L -18 15 L 18 15 L 16 -25 Z" fill="#deb887" stroke="#1e293b" strokeWidth="3" />

        {/* Ghutra draped fabric behind neck */}
        <path
          d="M -65 -60 Q -75 30 -55 100 L 55 100 Q 75 30 65 -60 Z"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3.5"
        />

        {/* Face */}
        <ellipse cx="0" cy="-65" rx="50" ry="56" fill="#deb887" stroke="#1e293b" strokeWidth="3.5" />

        {/* White Ghutra Dome over head */}
        <path
          d="M -54 -65 C -54 -130 54 -130 54 -65 Z"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3.5"
        />

        {/* Black Egal (double ring) */}
        <ellipse cx="0" cy="-105" rx="46" ry="11" fill="none" stroke="#0f172a" strokeWidth="7" />
        <ellipse cx="0" cy="-97" rx="48" ry="11" fill="none" stroke="#0f172a" strokeWidth="7" />

        {/* Ears */}
        <ellipse cx="-48" cy="-62" rx="10" ry="15" fill="#deb887" stroke="#1e293b" strokeWidth="2.5" />
        <ellipse cx="48" cy="-62" rx="10" ry="15" fill="#deb887" stroke="#1e293b" strokeWidth="2.5" />

        {/* Short Groomed Beard along jawline */}
        <path
          d="M -42 -35 Q -44 -12 0 -10 Q 44 -12 42 -35 Q 30 -18 0 -16 Q -30 -18 -42 -35 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="2.5"
        />

        {/* Eyebrows (Calming or Panicked during hit) */}
        {isHit ? (
          <>
            <path d="M -30 -74 L -4 -64" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 30 -74 L 4 -64" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M -30 -65 Q -15 -72 -3 -65" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 3 -65 Q 15 -72 30 -65" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Nose */}
        <path d="M 0 -50 Q 5 -38 0 -34" stroke="#a06e42" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Gentle Mouth */}
        {isHit ? (
          <ellipse cx="0" cy="-24" rx="9" ry="11" fill="#881337" stroke="#1e293b" strokeWidth="2.5" />
        ) : isSpeaker ? (
          <ellipse
            cx="0"
            cy="-24"
            rx="12"
            ry={Math.max(4, mouthOpen)}
            fill="#881337"
            stroke="#1e293b"
            strokeWidth="2.5"
          />
        ) : (
          <path d="M -10 -24 Q 0 -20 10 -24" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
      </g>
    </g>
  );
};
