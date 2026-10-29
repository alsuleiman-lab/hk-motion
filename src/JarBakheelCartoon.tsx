import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_TITLE } from "./localFonts";
import { JarBakheelEnvironment } from "./cartoon/JarBakheelEnvironment";
import { JarBakheelCharacter } from "./cartoon/JarBakheelCharacter";
import { JarBakheelDiningScene } from "./cartoon/JarBakheelDiningScene";
import { JarBakheelCaptions } from "./cartoon/JarBakheelCaptions";
import { JarBakheelOutro } from "./cartoon/JarBakheelOutro";
import {
  BEATS,
  getCurrentBeat,
  JAR_FPS,
  JAR_TOTAL_FRAMES,
} from "./cartoon/JarBakheelStory";

export { JAR_FPS, JAR_TOTAL_FRAMES };

const Gfx: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>{children}</AbsoluteFill>
);

export const JarBakheelCartoon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const currentBeat = getCurrentBeat(time);
  const isFlashback = currentBeat.focus === "eating_flashback";
  const isOutro = currentBeat.focus === "outro";

  // Dynamic Camera Framing (Pan & Zoom)
  // wide: scale 1.0, x: 0
  // focus neighbor: scale 1.15, pan left
  // focus miser: scale 1.15, pan right
  const cameraZoom = isFlashback
    ? 1.0
    : currentBeat.focus === "neighbor"
    ? 1.12
    : currentBeat.focus === "miser"
    ? 1.12
    : 1.0;

  const cameraPanX = isFlashback
    ? 0
    : currentBeat.focus === "neighbor"
    ? 80
    : currentBeat.focus === "miser"
    ? -80
    : 0;

  // Neighbor character positioning & pose
  let neighborPose: "hands_up" | "point_talk" | "hands_hips" | "hands_folded" | "shrug_spread" | "hands_behind" = "hands_folded";
  let neighborX = 330;
  const neighborY = 1320;
  let neighborFlip = false; // faces right towards miser

  // Miser character positioning & pose
  let miserPose: "hands_up" | "point_talk" | "hands_hips" | "hands_folded" | "shrug_spread" | "hands_behind" = "hands_hips";
  const miserX = 750;
  const miserY = 1320;
  const miserFlip = true; // faces left towards neighbor

  // Update poses based on current beat
  switch (currentBeat.id) {
    case "intro":
      neighborPose = "hands_folded";
      miserPose = "hands_hips";
      break;
    case "tease_intro":
      // Neighbor walks in towards miser's house
      neighborX = interpolate(time, [3.06, 6.5], [120, 330], { extrapolateRight: "clamp" });
      neighborPose = "point_talk";
      miserPose = "hands_hips";
      break;
    case "neighbor_shout":
      neighborPose = "point_talk";
      miserPose = "hands_behind";
      break;
    case "neighbor_complain":
      neighborPose = "shrug_spread";
      miserPose = "hands_hips";
      break;
    case "miser_refusal":
      // Miser shouts "معاذ الله أن أدعوك!" with hands raised
      neighborPose = "hands_hips";
      miserPose = "hands_up";
      break;
    case "neighbor_why":
      // Neighbor baffled: "قال لمَ؟"
      neighborPose = "shrug_spread";
      miserPose = "point_talk";
      break;
    case "miser_saw_you":
      // Miser pointing and explaining flashback
      neighborPose = "hands_behind";
      miserPose = "point_talk";
      break;
    case "climax_punchline":
      // Neighbor bursting with laughter / disbelief: "سبحان الله، أتريد أن أصلي ركعتين؟!"
      neighborPose = "hands_up";
      miserPose = "shrug_spread";
      break;
    default:
      neighborPose = "hands_folded";
      miserPose = "hands_hips";
      break;
  }

  // Opening Story Title Card (First 3.2 seconds)
  const titleOpacity = interpolate(time, [0, 0.4, 2.8, 3.2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(time, [0, 0.5], [0.85, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", overflow: "hidden" }}>
      {/* Original Spoken Audio Track */}
      <Audio src={staticFile("jar_bakheel/audio.mp3")} />

      {/* Main Animated Stage with Camera Transform */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraZoom}) translate(${cameraPanX}px, 0px)`,
          transformOrigin: "center 70%",
          transition: "transform 0.4s ease-out",
        }}
      >
        {/* Environment Background */}
        <JarBakheelEnvironment
          frame={frame}
          mode={isFlashback ? "eating_flashback" : "street"}
        />

        {/* Street Scene Characters (when not in flashback and not in outro) */}
        {!isFlashback && !isOutro && (
          <>
            {/* Visiting Neighbor (Blue Shirt) */}
            <JarBakheelCharacter
              frame={frame}
              role="neighbor"
              pose={neighborPose}
              x={neighborX}
              y={neighborY}
              scale={1.4}
              flip={neighborFlip}
              isSpeaker={currentBeat.speaker === "neighbor"}
              action={currentBeat.actionNeighbor}
            />

            {/* Miser Neighbor (Olive Shirt) */}
            <JarBakheelCharacter
              frame={frame}
              role="miser"
              pose={miserPose}
              x={miserX}
              y={miserY}
              scale={1.4}
              flip={miserFlip}
              isSpeaker={currentBeat.speaker === "miser"}
              action={currentBeat.actionMiser}
            />
          </>
        )}

        {/* Flashback Dining Scene (Beat 6: 29.5s - 41.1s) */}
        {isFlashback && <JarBakheelDiningScene frame={frame} time={time} />}

        {/* Outro Scene (47.24s - 55.07s) */}
        {isOutro && <JarBakheelOutro frame={frame} />}
      </div>

      {/* Overlays inside <Gfx> */}
      <Gfx>
        {/* Word-by-word Synced Subtitles in Top Safe Area */}
        <JarBakheelCaptions time={time} />

        {/* Opening Title Card */}
        {titleOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              top: 380,
              left: "50%",
              transform: `translateX(-50%) scale(${titleScale})`,
              opacity: titleOpacity,
              background: "#ffffff",
              border: "6px solid #0f172a",
              borderRadius: 36,
              padding: "30px 48px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
              textAlign: "center",
              zIndex: 300,
              width: 840,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: FONT_TITLE(),
                fontSize: 54,
                fontWeight: 900,
                color: "#c2410c",
                marginBottom: 12,
              }}
            >
              طرفة لجار مع جاره البخيل 😄
            </div>
            <div
              style={{
                fontFamily: FONT_TITLE(),
                fontSize: 34,
                fontWeight: 700,
                color: "#475569",
              }}
            >
              🎙️ رواها الشيخ صالح بن عبد العزيز آل الشيخ
            </div>
          </div>
        )}
      </Gfx>
    </AbsoluteFill>
  );
};

