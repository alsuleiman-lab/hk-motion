import React from "react";

/**
 * JuhaCharacters.tsx
 * High quality, hand-crafted vector cartoon character rigs for Juha story:
 * 1. JuhaRig (جحا) - Multiple expressive actions
 * 2. DaughterRig (الابنة) - Cute cartoon girl with thick braided hair, bows, eyelashes, gestures
 * 3. DonkeyRig (الحمار) - Cute trotting donkey with swishing tail, twitching ears, reins
 * 4. ThiefRig (اللص) - Sneaky bandit with eye-mask and tiptoe sneak cycle
 * 5. VendorRig (بائع السوق) - Friendly bazaar merchant with turban and stall wares
 * 6. MoneyPouch (صرة المال)
 */

// ==========================================
// 1. DAUGHTER RIG (الابنة الجميلة ذات الضفائر)
// ==========================================
interface DaughterProps {
  frame: number;
  talking?: boolean;
  gesture?: "listen" | "advise" | "peep";
}

export const DaughterRig: React.FC<DaughterProps> = ({
  frame,
  talking = false,
  gesture = "listen",
}) => {
  const bob = Math.sin(frame * 0.25) * 3;
  const mouthOpen = talking ? Math.abs(Math.sin(frame * 0.5)) * 10 : 0;
  const handRaise = gesture === "advise" ? Math.sin(frame * 0.3) * 6 : 0;

  return (
    <g transform={`translate(125, 1260) translate(0, ${bob})`}>
      {/* Upper Torso / Dress (Turquoise Arabic dress) */}
      <path
        d="M -38 52 Q 0 42 38 52 L 44 95 L -44 95 Z"
        fill="#0d9488"
        stroke="#1e242b"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* White lace collar */}
      <path
        d="M -24 52 Q 0 68 24 52 Q 0 56 -24 52 Z"
        fill="#ffffff"
        stroke="#1e242b"
        strokeWidth="3.5"
      />

      {/* Back Hair Mass (Long dark hair behind head) */}
      <path
        d="M -52 -10 Q -60 55 -40 85 Q -30 90 -20 85 Q -40 50 -35 -10 Z"
        fill="#1e242b"
      />
      <path
        d="M 52 -10 Q 60 55 40 85 Q 30 90 20 85 Q 40 50 35 -10 Z"
        fill="#1e242b"
      />

      {/* Left Braid with Ribbons */}
      <g transform="translate(-46, 25)">
        {/* Braided segments */}
        <ellipse cx="0" cy="0" rx="12" ry="16" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        <ellipse cx="-2" cy="22" rx="11" ry="15" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        <ellipse cx="-4" cy="42" rx="9" ry="14" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        {/* Pink Ribbon / Bow */}
        <path d="M -12 55 L 4 55 L -4 63 Z" fill="#ec4899" stroke="#1e242b" strokeWidth="3" />
        <circle cx="-4" cy="55" r="5" fill="#f43f5e" />
        {/* Braid tip */}
        <path d="M -4 58 Q -8 72 -3 78 Q 0 72 -4 58" fill="#1e242b" />
      </g>

      {/* Right Braid with Ribbons */}
      <g transform="translate(46, 25)">
        {/* Braided segments */}
        <ellipse cx="0" cy="0" rx="12" ry="16" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        <ellipse cx="2" cy="22" rx="11" ry="15" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        <ellipse cx="4" cy="42" rx="9" ry="14" fill="#1e242b" stroke="#1e242b" strokeWidth="2" />
        {/* Pink Ribbon / Bow */}
        <path d="M -4 55 L 12 55 L 4 63 Z" fill="#ec4899" stroke="#1e242b" strokeWidth="3" />
        <circle cx="4" cy="55" r="5" fill="#f43f5e" />
        {/* Braid tip */}
        <path d="M 4 58 Q 8 72 3 78 Q 0 72 4 58" fill="#1e242b" />
      </g>

      {/* Head: Cute Face */}
      <circle cx="0" cy="0" r="46" fill="#fff7ed" stroke="#1e242b" strokeWidth="5.5" />

      {/* Cute Front Hair Bangs / Fringe */}
      <path
        d="M -44 -12 Q -25 -42 0 -44 Q 25 -42 44 -12 Q 35 -26 15 -24 Q 0 -22 -15 -26 Q -35 -24 -44 -12 Z"
        fill="#1e242b"
      />
      {/* Cute Side Hair Strands */}
      <path d="M -42 -10 Q -48 15 -42 32 Q -38 18 -38 -10 Z" fill="#1e242b" />
      <path d="M 42 -10 Q 48 15 42 32 Q 38 18 38 -10 Z" fill="#1e242b" />

      {/* Rosy Cheeks */}
      <ellipse cx="-24" cy="14" rx="9" ry="5.5" fill="#fb7185" opacity="0.55" />
      <ellipse cx="24" cy="14" rx="9" ry="5.5" fill="#fb7185" opacity="0.55" />

      {/* Beautiful Cartoon Eyes */}
      {/* Left Eye */}
      <g transform="translate(-16, 2)">
        <ellipse cx="0" cy="0" rx="7.5" ry="9" fill="#1e242b" />
        <circle cx="-2.5" cy="-3" r="3" fill="#ffffff" />
        {/* Eyelashes */}
        <path d="M -7 -6 Q -4 -12 0 -9" fill="none" stroke="#1e242b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M -2 -9 Q 3 -13 6 -8" fill="none" stroke="#1e242b" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Right Eye */}
      <g transform="translate(16, 2)">
        <ellipse cx="0" cy="0" rx="7.5" ry="9" fill="#1e242b" />
        <circle cx="-2.5" cy="-3" r="3" fill="#ffffff" />
        {/* Eyelashes */}
        <path d="M 0 -9 Q 4 -12 7 -6" fill="none" stroke="#1e242b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M -6 -8 Q -3 -13 2 -9" fill="none" stroke="#1e242b" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Mouth (animated if talking) */}
      {talking ? (
        <path
          d={`M -12 18 Q 0 ${22 + mouthOpen} 12 18 Q 0 16 -12 18 Z`}
          fill="#e11d48"
          stroke="#1e242b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M -9 18 Q 0 26 9 18"
          fill="none"
          stroke="#1e242b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}

      {/* Hands on Window Sill / Gesturing */}
      {gesture === "advise" ? (
        <>
          {/* Left hand on sill */}
          <circle cx="-32" cy="52" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="4" />
          {/* Right hand raised advising with index finger up */}
          <g transform={`translate(36, ${28 - handRaise})`}>
            {/* Forearm */}
            <line x1="0" y1="24" x2="6" y2="4" stroke="#1e242b" strokeWidth="6" strokeLinecap="round" />
            {/* Hand */}
            <circle cx="6" cy="0" r="8" fill="#fff7ed" stroke="#1e242b" strokeWidth="3.5" />
            {/* Pointing index finger */}
            <line x1="6" y1="0" x2="6" y2="-16" stroke="#fff7ed" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="6" y1="0" x2="6" y2="-16" stroke="#1e242b" strokeWidth="3" strokeLinecap="round" />
          </g>
        </>
      ) : (
        <>
          {/* Both hands resting on sill */}
          <circle cx="-30" cy="52" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="4" />
          <circle cx="30" cy="52" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="4" />
        </>
      )}
    </g>
  );
};

// ==========================================
// 2. MONEY POUCH (صرة المال)
// ==========================================
export const MoneyPouch: React.FC<{ scale?: number }> = ({ scale = 1.0 }) => {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M -22 10 Q -38 45 0 52 Q 38 45 22 10 Q 30 -5 16 -18 Q 0 -12 -16 -18 Q -30 -5 -22 10 Z"
        fill="#eab308"
        stroke="#1e242b"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line x1="-16" y1="2" x2="16" y2="2" stroke="#713f12" strokeWidth="4" />
      <circle cx="0" cy="2" r="4" fill="#713f12" />
      <path d="M 0 2 Q 10 12 16 24" fill="none" stroke="#713f12" strokeWidth="3" />
      <path d="M 0 2 Q -8 14 -12 26" fill="none" stroke="#713f12" strokeWidth="3" />
      {/* Coin symbol on pouch */}
      <circle cx="0" cy="30" r="10" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
      <path d="M -4 30 L 4 30 M 0 26 L 0 34" stroke="#ca8a04" strokeWidth="2.5" />
    </g>
  );
};

// ==========================================
// 3. JUHA RIG (شخصية جحا المفصلة)
// ==========================================
export interface JuhaRigProps {
  x: number;
  floorY?: number;
  action:
    | "talk_house"
    | "shrug_why"
    | "show_money"
    | "walk_right"
    | "shocked_turned"
    | "walk_left"
    | "knock"
    | "inshallah_smile";
  frame: number;
  holdingRope?: boolean;
}

export const JuhaRig: React.FC<JuhaRigProps> = ({
  x,
  floorY = 1580,
  action,
  frame,
  holdingRope = false,
}) => {
  const isWalking =
    action === "walk_right" || action === "walk_left";
  const walkPhase = frame * 0.45;
  const walkCycle = Math.sin(walkPhase);
  const bobbing = isWalking ? -Math.abs(Math.sin(walkPhase)) * 9 : 0;
  const isFlipped = action === "walk_left" || action === "knock";

  const isShocked = action === "shocked_turned";
  const isSmiling = action === "inshallah_smile";
  const isTalking =
    action === "talk_house" ||
    action === "shrug_why" ||
    action === "show_money" ||
    action === "inshallah_smile";

  const mouthOpen = isTalking ? Math.abs(Math.sin(frame * 0.4)) * 8 : 0;

  return (
    <g
      transform={`translate(${x}, ${floorY + bobbing}) scale(${
        isFlipped ? -1 : 1
      }, 1)`}
    >
      {/* Shadow */}
      <ellipse cx="0" cy="0" rx="65" ry="12" fill="#20272c" opacity="0.18" />

      {/* Legs */}
      <g>
        {/* Left Leg */}
        <line
          x1="-22"
          y1="-190"
          x2={isWalking ? -22 - walkCycle * 38 : -22}
          y2={isWalking ? (walkCycle > 0 ? -12 : 0) : 0}
          stroke="#1e242b"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Right Leg */}
        <line
          x1="22"
          y1="-190"
          x2={isWalking ? 22 + walkCycle * 38 : 22}
          y2={isWalking ? (walkCycle < 0 ? -12 : 0) : 0}
          stroke="#1e242b"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>

      {/* Torso: Traditional Tunic (brown vest) */}
      <path
        d="M -44 -335 L 44 -335 L 56 -190 L -56 -190 Z"
        fill="#925a2e"
        stroke="#1e242b"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* Tunic button line */}
      <line x1="0" y1="-335" x2="0" y2="-195" stroke="#1e242b" strokeWidth="4" />
      <circle cx="0" cy="-300" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />
      <circle cx="0" cy="-260" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />
      <circle cx="0" cy="-220" r="5" fill="#facc15" stroke="#1e242b" strokeWidth="2" />

      {/* Head Group */}
      <g transform={`translate(0, -425)`}>
        {/* Shock / Confusion sweat drops */}
        {isShocked && (
          <g transform={`translate(65, -30) scale(${1 + Math.sin(frame * 0.8) * 0.2})`}>
            <path
              d="M 0 -18 Q 12 0 0 16 Q -12 0 0 -18 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* Head Circle */}
        <circle
          cx="0"
          cy="0"
          r="72"
          fill="#ffffff"
          stroke="#1e242b"
          strokeWidth="8"
        />

        {/* Traditional White Cap (طاقية جحا) with pattern */}
        <path
          d="M -70 -20 Q 0 -115 70 -20 Q 0 -45 -70 -20 Z"
          fill="#f3f4f6"
          stroke="#1e242b"
          strokeWidth="6"
        />
        <line x1="-35" y1="-30" x2="-22" y2="-75" stroke="#1e242b" strokeWidth="4" />
        <line x1="0" y1="-35" x2="0" y2="-82" stroke="#1e242b" strokeWidth="4" />
        <line x1="35" y1="-30" x2="22" y2="-75" stroke="#1e242b" strokeWidth="4" />

        {/* Facial Features */}
        {isShocked ? (
          <>
            {/* Shocked Eyes (Huge O-O) */}
            <circle cx="-28" cy="-5" r="14" fill="#ffffff" stroke="#1e242b" strokeWidth="5" />
            <circle cx="-28" cy="-5" r="5.5" fill="#1e242b" />
            <circle cx="28" cy="-5" r="14" fill="#ffffff" stroke="#1e242b" strokeWidth="5" />
            <circle cx="28" cy="-5" r="5.5" fill="#1e242b" />
            {/* Raised slanted shocked eyebrows */}
            <line x1="-42" y1="-34" x2="-14" y2="-24" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
            <line x1="14" y1="-24" x2="42" y2="-34" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
            {/* Shocked Open Mouth */}
            <ellipse cx="0" cy="36" rx="14" ry="20" fill="#1e242b" stroke="#1e242b" strokeWidth="4" />
          </>
        ) : isSmiling ? (
          <>
            {/* Happy / Sheepish eyes (curved arches) */}
            <path
              d="M -38 -2 Q -26 -16 -14 -2"
              fill="none"
              stroke="#1e242b"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 14 -2 Q 26 -16 38 -2"
              fill="none"
              stroke="#1e242b"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Rosy blush */}
            <ellipse cx="-40" cy="15" rx="10" ry="6" fill="#f87171" opacity="0.6" />
            <ellipse cx="40" cy="15" rx="10" ry="6" fill="#f87171" opacity="0.6" />
            {/* Big sheepish smile */}
            <path
              d="M -26 24 Q 0 48 26 24"
              fill="none"
              stroke="#1e242b"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            {/* Regular Cartoon Eyes */}
            <circle cx="-24" cy="-5" r="6.5" fill="#1e242b" />
            <circle cx="24" cy="-5" r="6.5" fill="#1e242b" />
            {/* Eyebrows */}
            <line x1="-36" y1="-24" x2="-12" y2="-24" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
            <line x1="12" y1="-24" x2="36" y2="-24" stroke="#1e242b" strokeWidth="5" strokeLinecap="round" />
            {/* Mouth */}
            {isTalking && mouthOpen > 2 ? (
              <ellipse
                cx="0"
                cy="24"
                rx={10 + mouthOpen * 0.5}
                ry={mouthOpen}
                fill="#1e242b"
              />
            ) : (
              <line
                x1="-14"
                y1="24"
                x2="14"
                y2="24"
                stroke="#1e242b"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
          </>
        )}

        {/* Juha's Short Beard / Mustache */}
        <path
          d="M -18 36 Q 0 46 18 36"
          fill="none"
          stroke="#1e242b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M -26 50 Q 0 68 26 50"
          fill="none"
          stroke="#1e242b"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Arms & Hands according to Action */}
      {action === "talk_house" && (
        <>
          {/* Left hand relaxed */}
          <line x1="-44" y1="-320" x2="-68" y2="-230" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-68" cy="-230" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
          {/* Right hand gesturing forward */}
          <line
            x1="44"
            y1="-320"
            x2="85"
            y2={-270 + Math.sin(frame * 0.3) * 10}
            stroke="#1e242b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="85"
            cy={-270 + Math.sin(frame * 0.3) * 10}
            r="10"
            fill="#ffffff"
            stroke="#1e242b"
            strokeWidth="4"
          />
        </>
      )}

      {action === "shrug_why" && (
        <>
          {/* Both hands raised in dramatic comical shrug */}
          <line x1="-44" y1="-320" x2="-90" y2="-270" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="-90" y1="-270" x2="-115" y2="-330" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-115" cy="-330" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          <line x1="44" y1="-320" x2="90" y2="-270" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="90" y1="-270" x2="115" y2="-330" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="115" cy="-330" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
        </>
      )}

      {action === "show_money" && (
        <>
          {/* Left hand on hip */}
          <line x1="-44" y1="-320" x2="-75" y2="-270" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="-75" y1="-270" x2="-45" y2="-250" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-45" cy="-250" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          {/* Right hand raised high, triumphantly displaying the money pouch! */}
          <g transform={`translate(0, ${Math.sin(frame * 0.3) * 6})`}>
            <line x1="44" y1="-320" x2="105" y2="-390" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
            <circle cx="105" cy="-390" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
            <g transform="translate(108, -420)">
              <MoneyPouch scale={1.2} />
            </g>
          </g>
        </>
      )}

      {action === "walk_right" && (
        <>
          {/* Left arm swinging back */}
          <line
            x1="-44"
            y1="-320"
            x2={-44 - walkCycle * 25}
            y2="-230"
            stroke="#1e242b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={-44 - walkCycle * 25} cy="-230" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          {/* Right arm extended back holding lead rope */}
          <line
            x1="44"
            y1="-320"
            x2="-70"
            y2="-250"
            stroke="#1e242b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="-70" cy="-250" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
        </>
      )}

      {action === "shocked_turned" && (
        <>
          {/* Both hands holding cheeks/head in classic cartoon scream shock */}
          <line x1="-44" y1="-320" x2="-95" y2="-390" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="-95" y1="-390" x2="-72" y2="-435" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-72" cy="-435" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          <line x1="44" y1="-320" x2="95" y2="-390" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="95" y1="-390" x2="72" y2="-435" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="72" cy="-435" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
        </>
      )}

      {action === "walk_left" && (
        <>
          {/* Walking back home: slouched sad walk */}
          <line
            x1="-44"
            y1="-320"
            x2={-44 - walkCycle * 20}
            y2="-220"
            stroke="#1e242b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={-44 - walkCycle * 20} cy="-220" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          <line
            x1="44"
            y1="-320"
            x2={44 + walkCycle * 20}
            y2="-220"
            stroke="#1e242b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={44 + walkCycle * 20} cy="-220" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
        </>
      )}

      {action === "knock" && (
        <>
          {/* Left arm relaxed */}
          <line x1="-44" y1="-320" x2="-55" y2="-240" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-55" cy="-240" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          {/* Right arm knocking on the door */}
          <g>
            <line
              x1="44"
              y1="-320"
              x2="95"
              y2="-275"
              stroke="#1e242b"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <line
              x1="95"
              y1="-275"
              x2={130 + Math.sin(frame * 0.9) * 12}
              y2="-280"
              stroke="#1e242b"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle
              cx={130 + Math.sin(frame * 0.9) * 12}
              cy="-280"
              r="11"
              fill="#ffffff"
              stroke="#1e242b"
              strokeWidth="4"
            />
          </g>
        </>
      )}

      {action === "inshallah_smile" && (
        <>
          {/* Left hand scratching head sheepishly */}
          <line x1="-44" y1="-320" x2="-90" y2="-370" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="-90" y1="-370" x2="-60" y2="-450" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="-60" cy="-450" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />

          {/* Right hand pointing index finger up with "Inshallah" */}
          <line x1="44" y1="-320" x2="85" y2="-320" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <line x1="85" y1="-320" x2="105" y2="-370" stroke="#1e242b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="105" cy="-370" r="10" fill="#ffffff" stroke="#1e242b" strokeWidth="4" />
          <line x1="105" y1="-370" x2="105" y2="-395" stroke="#1e242b" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

// ==========================================
// 4. DONKEY RIG (الحمار الكرتوني اللطيف)
// ==========================================
export interface DonkeyProps {
  x: number;
  floorY?: number;
  frame: number;
  walking?: boolean;
  flipped?: boolean;
}

export const DonkeyRig: React.FC<DonkeyProps> = ({
  x,
  floorY = 1580,
  frame,
  walking = false,
  flipped = false,
}) => {
  const walkPhase = frame * 0.55;
  const leg1 = walking ? Math.sin(walkPhase) * 26 : 0;
  const leg2 = walking ? -Math.sin(walkPhase) * 26 : 0;
  const earTwitch = Math.sin(frame * 0.3) * 6;
  const tailWag = Math.sin(frame * 0.6) * 16;
  const bob = walking ? -Math.abs(Math.sin(walkPhase)) * 6 : 0;

  return (
    <g
      transform={`translate(${x}, ${floorY + bob}) scale(${
        flipped ? -1 : 1
      }, 1)`}
    >
      {/* Shadow */}
      <ellipse cx="0" cy="0" rx="90" ry="16" fill="#20272c" opacity="0.18" />

      {/* Tail with tuft */}
      <g transform="translate(-115, -165)">
        <path
          d={`M 0 0 Q -35 ${25 + tailWag} -45 ${60 + tailWag}`}
          fill="none"
          stroke="#1e242b"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse
          cx={-45}
          cy={60 + tailWag}
          rx="10"
          ry="15"
          fill="#1e242b"
          transform={`rotate(-20, -45, ${60 + tailWag})`}
        />
      </g>

      {/* Back Legs */}
      <line
        x1="-70"
        y1="-110"
        x2={-70 + leg1}
        y2="0"
        stroke="#1e242b"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1="-45"
        y1="-110"
        x2={-45 + leg2}
        y2="0"
        stroke="#1e242b"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Front Legs */}
      <line
        x1="55"
        y1="-110"
        x2={55 + leg2}
        y2="0"
        stroke="#1e242b"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="-110"
        x2={80 + leg1}
        y2="0"
        stroke="#1e242b"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Donkey Body (Oval grey shape) */}
      <ellipse
        cx="0"
        cy="-135"
        rx="125"
        ry="72"
        fill="#9ca3af"
        stroke="#1e242b"
        strokeWidth="7"
      />

      {/* Saddle Blanket (Brown/orange cloth) */}
      <rect
        x="-35"
        y="-185"
        width="75"
        height="60"
        rx="6"
        fill="#c2410c"
        stroke="#1e242b"
        strokeWidth="4"
      />
      <line x1="2" y1="-185" x2="2" y2="-125" stroke="#7c2d12" strokeWidth="4" />

      {/* Neck */}
      <path
        d="M 60 -165 L 105 -255 L 140 -235 L 105 -130 Z"
        fill="#9ca3af"
        stroke="#1e242b"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Mane (Short black hair along neck) */}
      <path
        d="M 68 -180 L 72 -200 L 80 -190 L 88 -225 L 98 -215 L 108 -255 L 100 -245"
        fill="none"
        stroke="#1e242b"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Head Group */}
      <g transform="translate(140, -260)">
        {/* Long Donkey Ears */}
        {/* Back Ear */}
        <path
          d={`M -20 -15 Q ${-35 + earTwitch} -85 ${-15 + earTwitch} -105 Q 5 -75 0 -15 Z`}
          fill="#9ca3af"
          stroke="#1e242b"
          strokeWidth="5"
        />
        <path
          d={`M -14 -20 Q ${-26 + earTwitch} -75 ${-15 + earTwitch} -95 Q -5 -65 -4 -20 Z`}
          fill="#fca5a5"
        />

        {/* Front Ear */}
        <path
          d={`M 5 -15 Q ${-10 - earTwitch} -85 ${15 - earTwitch} -110 Q 30 -75 25 -15 Z`}
          fill="#9ca3af"
          stroke="#1e242b"
          strokeWidth="5"
        />
        <path
          d={`M 10 -20 Q ${-2 - earTwitch} -75 ${15 - earTwitch} -100 Q 24 -65 20 -20 Z`}
          fill="#fca5a5"
        />

        {/* Head Shape */}
        <ellipse
          cx="15"
          cy="0"
          rx="52"
          ry="34"
          fill="#9ca3af"
          stroke="#1e242b"
          strokeWidth="6"
          transform="rotate(22, 15, 0)"
        />

        {/* Muzzle (Lighter grey/white nose) */}
        <ellipse
          cx="52"
          cy="18"
          rx="25"
          ry="20"
          fill="#e5e7eb"
          stroke="#1e242b"
          strokeWidth="4"
          transform="rotate(22, 52, 18)"
        />
        {/* Nostril */}
        <circle cx="62" cy="18" r="3.5" fill="#1e242b" />
        {/* Cute Mouth */}
        <path d="M 45 28 Q 55 35 65 28" fill="none" stroke="#1e242b" strokeWidth="3" />

        {/* Big Cute Eye */}
        <circle cx="15" cy="-8" r="8" fill="#1e242b" />
        <circle cx="13" cy="-11" r="3" fill="#ffffff" />

        {/* Leather Halter & Bridle */}
        <circle cx="15" cy="0" r="4" fill="#78350f" />
        <line x1="15" y1="0" x2="52" y2="18" stroke="#78350f" strokeWidth="4" />
        <line x1="15" y1="0" x2="-2" y2="-12" stroke="#78350f" strokeWidth="4" />
        <line x1="15" y1="0" x2="22" y2="28" stroke="#78350f" strokeWidth="4" />
      </g>
    </g>
  );
};

// ==========================================
// 5. THIEF RIG (اللص المتسلل)
// ==========================================
export interface ThiefProps {
  x: number;
  floorY?: number;
  frame: number;
  holdingDonkey?: boolean;
}

export const ThiefRig: React.FC<ThiefProps> = ({
  x,
  floorY = 1580,
  frame,
  holdingDonkey = false,
}) => {
  const sneakPhase = frame * 0.6;
  const sneakCycle = Math.sin(sneakPhase);
  const sneakBob = -Math.abs(Math.sin(sneakPhase)) * 8;

  return (
    <g transform={`translate(${x}, ${floorY + sneakBob})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="0" rx="55" ry="10" fill="#20272c" opacity="0.18" />

      {/* Legs (Tiptoe sneak posture) */}
      <line
        x1="-18"
        y1="-165"
        x2={-18 - sneakCycle * 32}
        y2={sneakCycle > 0 ? -15 : 0}
        stroke="#1e242b"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="-165"
        x2={18 + sneakCycle * 32}
        y2={sneakCycle < 0 ? -15 : 0}
        stroke="#1e242b"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Body: Dark crouching tunic */}
      <path
        d="M -36 -280 L 36 -280 L 44 -165 L -44 -165 Z"
        fill="#334155"
        stroke="#1e242b"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Head crouching forward */}
      <g transform="translate(15, -345)">
        <circle cx="0" cy="0" r="56" fill="#ffffff" stroke="#1e242b" strokeWidth="7" />
        {/* Bandit Eye Mask */}
        <path
          d="M -56 -8 Q 0 -18 56 -8 L 52 14 Q 0 6 -52 14 Z"
          fill="#0f172a"
          stroke="#1e242b"
          strokeWidth="3"
        />
        {/* Sly Eyes inside mask */}
        <circle cx="-18" cy="2" r="5" fill="#f8fafc" />
        <circle cx="-16" cy="2" r="2.5" fill="#0f172a" />
        <circle cx="18" cy="2" r="5" fill="#f8fafc" />
        <circle cx="20" cy="2" r="2.5" fill="#0f172a" />

        {/* Wicked sly grin */}
        <path
          d="M -15 28 Q 0 38 18 24"
          fill="none"
          stroke="#1e242b"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>

      {/* Arms extended sneaking forward */}
      <line
        x1="25"
        y1="-265"
        x2={65 + Math.sin(frame * 0.4) * 8}
        y2="-240"
        stroke="#1e242b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle
        cx={65 + Math.sin(frame * 0.4) * 8}
        cy="-240"
        r="9"
        fill="#ffffff"
        stroke="#1e242b"
        strokeWidth="3.5"
      />
    </g>
  );
};

// ==========================================
// 6. VENDOR RIG (بائع السوق)
// ==========================================
export const VendorRig: React.FC<{ frame: number }> = ({ frame }) => {
  const armWave = Math.sin(frame * 0.3) * 12;
  return (
    <g transform="translate(740, 1580)">
      {/* Shadow */}
      <ellipse cx="0" cy="0" rx="60" ry="12" fill="#20272c" opacity="0.18" />

      {/* Robe / Body */}
      <path
        d="M -40 -300 L 40 -300 L 52 0 L -52 0 Z"
        fill="#047857"
        stroke="#1e242b"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Golden sash belt */}
      <rect x="-45" y="-170" width="90" height="20" fill="#f59e0b" stroke="#1e242b" strokeWidth="4" />

      {/* Head */}
      <g transform="translate(0, -375)">
        <circle cx="0" cy="0" r="62" fill="#fff7ed" stroke="#1e242b" strokeWidth="6" />

        {/* Green/Gold Big Turban */}
        <path
          d="M -60 -15 Q 0 -95 60 -15 Q 0 -45 -60 -15 Z"
          fill="#10b981"
          stroke="#1e242b"
          strokeWidth="6"
        />
        <circle cx="0" cy="-45" r="14" fill="#fbbf24" stroke="#1e242b" strokeWidth="4" />

        {/* Eyes & Big friendly mustache */}
        <circle cx="-20" cy="-6" r="5.5" fill="#1e242b" />
        <circle cx="20" cy="-6" r="5.5" fill="#1e242b" />
        {/* Curled Big Mustache */}
        <path
          d="M -35 15 Q -10 10 0 20 Q 10 10 35 15 Q 20 28 0 22 Q -20 28 -35 15 Z"
          fill="#1e242b"
        />
        {/* Happy smile underneath */}
        <path d="M -12 28 Q 0 38 12 28" fill="none" stroke="#1e242b" strokeWidth="3" />
      </g>

      {/* Right Arm: Waving / welcoming customer */}
      <line
        x1="35"
        y1="-285"
        x2={80}
        y2={-270 + armWave}
        stroke="#1e242b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx={80} cy={-270 + armWave} r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="3.5" />

      {/* Left Arm: Resting on stall */}
      <line x1="-35" y1="-285" x2="-80" y2="-230" stroke="#1e242b" strokeWidth="7" strokeLinecap="round" />
      <circle cx="-80" cy="-230" r="9" fill="#fff7ed" stroke="#1e242b" strokeWidth="3.5" />
    </g>
  );
};
