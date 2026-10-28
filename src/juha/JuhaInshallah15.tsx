import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_TITLE, FONT_TEXT } from "../localFonts";
import {
  DaughterRig,
  DonkeyRig,
  JuhaRig,
  ThiefRig,
  VendorRig,
} from "./JuhaCharacters";
import {
  DesertRoadEnvironment,
  HouseEnvironment,
  MarketEnvironment,
} from "./JuhaEnvironments";
import { CartoonEndScreen } from "./CartoonEndScreen";

export const JUHA_15S_FPS = 30;
export const JUHA_15S_FRAMES = 540; // 18.00 seconds: 15s Story + 3s End Screen

/**
 * Comic Speech Bubble Component
 */
interface BubbleProps {
  text: string;
  top?: number;
  pointerX?: number;
  flipPointer?: boolean;
}

const ComicSpeechBubble: React.FC<BubbleProps> = ({
  text,
  top = 160,
  pointerX = 540,
  flipPointer = false,
}) => {
  const fontTitle = FONT_TITLE();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: "50%",
        transform: "translateX(-50%)",
        width: "max-content",
        maxWidth: 960,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "6px solid #1e242b",
          borderRadius: 36,
          padding: "20px 48px",
          fontFamily: fontTitle,
          fontSize: 48,
          fontWeight: 800,
          color: "#1e242b",
          textAlign: "center",
          lineHeight: 1.45,
          whiteSpace: "pre-line",
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.16)",
          direction: "rtl",
        }}
      >
        {text}
      </div>

      {/* Bubble Pointer Arrow */}
      {pointerX && (
        <svg
          width="50"
          height="40"
          style={{
            position: "absolute",
            bottom: -32,
            left: `${((pointerX - 100) / 880) * 100}%`,
            transform: flipPointer ? "scaleX(-1)" : "none",
            filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.12))",
          }}
          viewBox="0 0 50 40"
        >
          <path
            d="M 5 0 L 45 0 L 25 36 Z"
            fill="#ffffff"
            stroke="#1e242b"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Top seam cover */}
          <line x1="8" y1="2" x2="42" y2="2" stroke="#ffffff" strokeWidth="8" />
        </svg>
      )}
    </div>
  );
};

export const JuhaInshallah15: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontTitle = FONT_TITLE();
  const fontText = FONT_TEXT();

  // Springs for pop-up key texts
  const popSpring1 = spring({
    frame: frame - 182,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const popSpring2 = spring({
    frame: frame - 302,
    fps,
    config: { damping: 9, stiffness: 180 },
  });

  const popSpring3 = spring({
    frame: frame - 412,
    fps,
    config: { damping: 11, stiffness: 130 },
  });

  // Scene transition opacity
  // Scene 1: Frames 0 - 220
  // Scene 2: Frames 220 - 290
  // Scene 3: Frames 290 - 350
  // Scene 4: Frames 350 - 450
  const isScene1 = frame < 220;
  const isScene2 = frame >= 220 && frame < 290;
  const isScene3 = frame >= 290 && frame < 350;
  const isScene4 = frame >= 350;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf6ee", // Warm comic paper canvas
        overflow: "hidden",
      }}
    >
      {/* 1. Main Audio Narration Track (Full 15.00s) */}
      <Audio
        src={staticFile("juha_inshallah_15s.wav")}
        volume={1.0}
      />

      {/* 2. Softened Sound Effects (Much quieter as requested by user) */}
      {/* Money Pouch Pop SFX (quiet 0.12) */}
      <Sequence from={182} durationInFrames={30}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.12} />
      </Sequence>

      {/* Thief Stealth / Rope cut Whoosh SFX (quiet 0.10) */}
      <Sequence from={305} durationInFrames={30}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.10} />
      </Sequence>

      {/* Door Knock SFX (quiet 0.18) */}
      <Sequence from={375} durationInFrames={35}>
        <Audio src={staticFile("sfx/knock.wav")} volume={0.18} />
      </Sequence>

      {/* Climax Chime SFX (gentle 0.15) */}
      <Sequence from={414} durationInFrames={36}>
        <Audio src={staticFile("sfx/chime.wav")} volume={0.15} />
      </Sequence>

      {/* 3. Paper Canvas Subtle Texture Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 60%, rgba(220,210,195,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ==================================================== */}
      {/* 4. ANIMATED VECTOR SCENES (SVG CANVAS 1080x1920)     */}
      {/* ==================================================== */}
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
        {/* Crisp Ground Line */}
        <line
          x1="-400"
          y1="1580"
          x2="2400"
          y2="1580"
          stroke="#1e242b"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* -------------------------------------------------- */}
        {/* SCENE 1: AT HOME (البيت، الحوار، صرة المال)         */}
        {/* Frames: 0 to 220                                   */}
        {/* -------------------------------------------------- */}
        {isScene1 && (
          <g>
            {/* House & Palm Environment */}
            <HouseEnvironment />

            {/* The Daughter at the window with braids, ribbons & gestures */}
            <DaughterRig
              frame={frame}
              talking={frame >= 105 && frame < 138}
              gesture={frame >= 105 && frame < 138 ? "advise" : "listen"}
            />

            {/* Juha at home */}
            <JuhaRig
              x={640}
              frame={frame}
              action={
                frame < 105
                  ? "talk_house"
                  : frame < 138
                  ? "talk_house"
                  : frame < 180
                  ? "shrug_why"
                  : "show_money"
              }
            />
          </g>
        )}

        {/* -------------------------------------------------- */}
        {/* SCENE 2: THE MARKET (في السوق وشراء الحمار)         */}
        {/* Frames: 220 to 290                                 */}
        {/* -------------------------------------------------- */}
        {isScene2 && (
          <g>
            {/* Vibrant Market Bazaar Environment */}
            <MarketEnvironment frame={frame} />

            {/* Market Vendor behind his stall */}
            <VendorRig frame={frame} />

            {/* Donkey at the market post */}
            <DonkeyRig
              x={480}
              frame={frame}
              walking={false}
              flipped={false}
            />

            {/* Juha walking in and buying the donkey */}
            <JuhaRig
              x={interpolate(frame, [220, 245, 290], [140, 320, 330], {
                extrapolateRight: "clamp",
              })}
              frame={frame}
              action={frame < 245 ? "walk_right" : "talk_house"}
            />

            {/* Donkey Lead Rope to Juha's hand once bought */}
            {frame >= 250 && (
              <path
                d="M 415 1310 Q 520 1360 635 1320"
                fill="none"
                stroke="#5c381e"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
          </g>
        )}

        {/* -------------------------------------------------- */}
        {/* SCENE 3: DESERT ROAD & THEFT (في الطريق وسرقة الحمار) */}
        {/* Frames: 290 to 350                                 */}
        {/* -------------------------------------------------- */}
        {isScene3 && (
          <g>
            {/* Desert Road Environment: Dunes, Boulder, Sun */}
            <DesertRoadEnvironment frame={frame} />

            {/* Lead rope connecting Juha to donkey (before theft at frame 306) */}
            {frame < 306 ? (
              <path
                d="M 710 1330 Q 650 1380 595 1320"
                fill="none"
                stroke="#5c381e"
                strokeWidth="5"
                strokeLinecap="round"
              />
            ) : (
              /* Cut/dangling severed rope in Juha's hand */
              <path
                d={`M 710 1330 Q 700 1370 ${690 + Math.sin(frame * 0.5) * 6} 1410`}
                fill="none"
                stroke="#5c381e"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}

            {/* The Donkey */}
            <DonkeyRig
              x={
                frame < 306
                  ? 440
                  : 440 - (frame - 306) * 14 // Runs away to the left with thief!
              }
              frame={frame}
              walking={true}
              flipped={frame >= 306} // Turns around when stolen!
            />

            {/* The Sneaky Thief */}
            <ThiefRig
              x={
                frame < 306
                  ? interpolate(frame, [290, 306], [160, 370], {
                      extrapolateRight: "clamp",
                    })
                  : 370 - (frame - 306) * 14 // Runs away leading donkey!
              }
              frame={frame}
              holdingDonkey={frame >= 306}
            />

            {/* Juha on the road */}
            <JuhaRig
              x={780}
              frame={frame}
              action={frame < 312 ? "walk_right" : "shocked_turned"}
            />
          </g>
        )}

        {/* -------------------------------------------------- */}
        {/* SCENE 4: RETURN HOME & PUNCHLINE (العودة وطرق الباب)  */}
        {/* Frames: 350 to 450                                 */}
        {/* -------------------------------------------------- */}
        {isScene4 && (
          <g>
            {/* Mud House Environment */}
            <HouseEnvironment doorOpen={frame >= 420} />

            {/* Daughter appears at the window for the dialogue */}
            {frame >= 395 && (
              <DaughterRig
                frame={frame}
                talking={frame >= 400 && frame < 416}
                gesture="listen"
              />
            )}

            {/* Juha returning, knocking, and punchline smile */}
            <JuhaRig
              x={
                frame < 375
                  ? interpolate(frame, [350, 375], [740, 500])
                  : 500
              }
              frame={frame}
              action={
                frame < 375
                  ? "walk_left"
                  : frame < 414
                  ? "knock"
                  : "inshallah_smile"
              }
            />

            {/* Door Knock visual ripple effect at 12.5s (frames 375 - 402) */}
            {frame >= 375 && frame <= 402 && (
              <g transform="translate(405, 1370)">
                <circle
                  cx="0"
                  cy="0"
                  r={((frame - 375) % 9) * 8 + 8}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="4"
                  opacity={1 - ((frame - 375) % 9) / 9}
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* ==================================================== */}
      {/* 5. COMIC SPEECH BUBBLES OVERLAY (Top layer)          */}
      {/* ==================================================== */}

      {/* SCENE 1 BUBBLES */}
      {frame >= 0 && frame < 105 && (
        <ComicSpeechBubble
          text={"إن جحا قال لابنته:\nغداً سوف أشتري حماراً"}
          pointerX={640}
        />
      )}

      {frame >= 105 && frame < 138 && (
        <ComicSpeechBubble
          text={"فقالت:\nقُلْ إِنْ شَاءَ الله!"}
          pointerX={220}
          flipPointer={true}
        />
      )}

      {frame >= 138 && frame < 180 && (
        <ComicSpeechBubble
          text={"قال لها:\nولماذا أقولُ إن شاء الله؟!"}
          pointerX={640}
        />
      )}

      {frame >= 180 && frame < 220 && (
        <ComicSpeechBubble
          text={"الْمَالُ فِي جَيْبِي\nوَالْحَمِيرُ فِي السُّوق!"}
          pointerX={640}
        />
      )}

      {/* SCENE 2 BUBBLE */}
      {frame >= 220 && frame < 290 && (
        <ComicSpeechBubble
          text={"فَلَمَّا أَصْبَحَ، ذَهَبَ إِلَى السُّوقِ\nوَاشْتَرَى الْحِمَار..."}
          top={140}
        />
      )}

      {/* SCENE 3 BUBBLE */}
      {frame >= 290 && frame < 350 && (
        <ComicSpeechBubble
          text={"وَفِي الطَّرِيقِ...\nسُرِقَ مِنْهُ الْحِمَار!"}
          top={140}
        />
      )}

      {/* SCENE 4 BUBBLE */}
      {frame >= 350 && frame < 400 && (
        <ComicSpeechBubble
          text={"فَرَجَعَ إِلَى بَيْتِهِ\nفَطَرَقَ الْبَاب!"}
          top={140}
          pointerX={460}
        />
      )}

      {frame >= 400 && frame < 418 && (
        <ComicSpeechBubble
          text={"قَالَتِ الْبِنْتُ: مَنْ؟!\nقَالَ: أَنَا جُحَا..."}
          top={140}
          pointerX={460}
        />
      )}

      {/* ==================================================== */}
      {/* 6. DYNAMIC CENTER POP-UP KEYWORDS                    */}
      {/* ==================================================== */}

      {/* Pop-up 1: "المال في جيبي" */}
      {frame >= 182 && frame < 220 && (
        <div
          style={{
            position: "absolute",
            top: 540,
            left: "50%",
            transform: `translateX(-50%) scale(${popSpring1})`,
            fontFamily: fontTitle,
            fontSize: 88,
            fontWeight: 900,
            color: "#b45309",
            textShadow: "0 6px 20px rgba(180, 83, 9, 0.25)",
            zIndex: 120,
            whiteSpace: "nowrap",
          }}
        >
          💰 الْمَالُ فِي جَيْبِي!
        </div>
      )}

      {/* Pop-up 2: Market Badge */}
      {frame >= 226 && frame < 284 && (
        <div
          style={{
            position: "absolute",
            top: 540,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ffffff",
            border: "4px solid #1e242b",
            padding: "8px 32px",
            borderRadius: 30,
            fontFamily: fontTitle,
            fontSize: 44,
            fontWeight: 800,
            color: "#047857",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 120,
            whiteSpace: "nowrap",
          }}
        >
          🛒 سُـــوقُ الْمَدِينَةِ
        </div>
      )}

      {/* Pop-up 3: "سُرِقَ الحِمَار!" in vibrant shaking red */}
      {frame >= 302 && frame < 350 && (
        <div
          style={{
            position: "absolute",
            top: 520,
            left: "50%",
            transform: `translateX(-50%) scale(${popSpring2}) rotate(${
              Math.sin(frame * 0.9) * 4
            }deg)`,
            fontFamily: fontTitle,
            fontSize: 96,
            fontWeight: 900,
            color: "#dc2626",
            textShadow: "0 8px 30px rgba(220, 38, 38, 0.45)",
            zIndex: 120,
            whiteSpace: "nowrap",
          }}
        >
          ⚠️ سُـــرِقَ الْحِمَار!
        </div>
      )}

      {/* Pop-up 4: The Grand Punchline "إِنْ شَاءَ الله!" */}
      {frame >= 414 && frame < 448 && (
        <div
          style={{
            position: "absolute",
            top: 500,
            left: "50%",
            transform: `translateX(-50%) scale(${popSpring3})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            zIndex: 150,
          }}
        >
          <span
            style={{
              fontFamily: fontTitle,
              fontSize: 108,
              fontWeight: 900,
              color: "#d97706",
              textShadow:
                "0 8px 35px rgba(217, 119, 6, 0.5), 0 0 50px rgba(245, 183, 35, 0.6)",
              whiteSpace: "nowrap",
            }}
          >
            ✨ إِنْ شَاءَ الله! ✨
          </span>
          <span
            style={{
              fontFamily: fontText,
              fontSize: 38,
              fontWeight: 800,
              color: "#1e242b",
              background: "#fef08a",
              border: "3.5px solid #1e242b",
              padding: "8px 32px",
              borderRadius: 26,
              boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            }}
          >
            قَالَ: أَنَا جُحَا... إِنْ شَاءَ الله!
          </span>
        </div>
      )}

      {/* 7. CARTOON END SCREEN / OUTRO (Frames 446 to 540) */}
      {frame >= 446 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 200,
            opacity: interpolate(frame, [446, 456], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <CartoonEndScreen startFrameOffset={448} />
        </div>
      )}
    </AbsoluteFill>
  );
};
