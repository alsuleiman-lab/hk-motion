import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TOTAL_FRAMES } from "./quranData";
import {
  BRollCut,
  CleanChannelBadge,
  FastSubtitle,
} from "./QuranScenes";

export { TOTAL_FRAMES };

// 19 Fast Scene Cuts (Every ~2 Seconds)
const cuts = [
  // Scene 1 [0.0 - 2.0s]: Speaker Normal Wide
  { id: 1, type: "speaker", scale: 1.0, text: "قال الله سبحانه وتعالى" },
  // Scene 2 [2.0 - 4.3s]: B-Roll Army Marching in Desert
  { id: 2, type: "broll", img: "army_talut.jpg", tag: "⚔️ جَيْشُ طَالُوتَ", tagColor: "#F59E0B", text: "فَلَمَّا فَصَلَ طَالُوتُ بِالْجُنُودِ", highlight: "طَالُوتُ", hColor: "#F59E0B" },
  // Scene 3 [4.3 - 5.8s]: Speaker Punch-in Zoom (scale 1.25)
  { id: 3, type: "speaker", scale: 1.25, text: "قَالَ إِنَّ اللَّهَ" },
  // Scene 4 [5.8 - 7.5s]: B-Roll River in Desert
  { id: 4, type: "broll", img: "quran_river.jpg", tag: "🌊 ابْتِلَاءُ النَّهَرِ", tagColor: "#38BDF8", text: "مُبْتَلِيكُمْ بِنَهَرٍ", highlight: "بِنَهَرٍ", hColor: "#38BDF8" },
  // Scene 5 [7.5 - 9.0s]: B-Roll River close-up
  { id: 5, type: "broll", img: "quran_river.jpg", tag: "⚠️ امْتِحَانُ الصَّبْرِ", tagColor: "#EF4444", text: "فَمَنْ شَرِبَ مِنْهُ", highlight: "شَرِبَ", hColor: "#EF4444" },
  // Scene 6 [9.0 - 10.5s]: Speaker Punch-in Zoom (Warning alert)
  { id: 6, type: "speaker", scale: 1.25, text: "« فَلَيْسَ مِنِّي »", pillColor: "rgba(220, 38, 38, 0.95)", isPunch: true },
  // Scene 7 [10.5 - 12.0s]: B-Roll Disciplined Army
  { id: 7, type: "broll", img: "army_talut.jpg", tag: "🛡️ أَهْلُ الانْضِبَاطِ", tagColor: "#10B981", text: "وَمَنْ لَمْ يَطْعَمْهُ", highlight: "لَمْ يَطْعَمْهُ", hColor: "#10B981" },
  // Scene 8 [12.0 - 13.5s]: Speaker Normal Wide
  { id: 8, type: "speaker", scale: 1.0, text: "« فَإِنَّهُ مِنِّي »", pillColor: "rgba(16, 185, 129, 0.95)", isPunch: true },
  // Scene 9 [13.5 - 16.0s]: B-Roll Hands Scooping Crystal Water
  { id: 9, type: "broll", img: "scoop_water.jpg", tag: "🤲 غُرْفَةُ اليَدِ", tagColor: "#F59E0B", text: "إِلَّا مَنِ اغْتَرَفَ غُرْفَةً بِيَدِهِ", highlight: "غُرْفَةً بِيَدِهِ", hColor: "#FBBF24" },
  // Scene 10 [16.0 - 18.0s]: Speaker Normal Wide
  { id: 10, type: "speaker", scale: 1.0, text: "وكأن الله سبحانه وتعالى يعلّمنا.." },
  // Scene 11 [18.0 - 20.0s]: Speaker Punch-in Zoom
  { id: 11, type: "speaker", scale: 1.25, text: "أنك إذا سِرتَ بالطريق الصحيح", highlight: "بالطريق الصحيح", hColor: "#10B981" },
  // Scene 12 [20.0 - 22.0s]: B-Roll Traveler Walking on Desert Road
  { id: 12, type: "broll", img: "traveler_path.jpg", tag: "🧭 طَرِيقُ الصِّدِّيقِينَ", tagColor: "#F59E0B", text: "مع الأنبياء والصديقين..", highlight: "والصديقين", hColor: "#F59E0B" },
  // Scene 13 [22.0 - 23.5s]: Speaker Punch-in Zoom (Intense Focus)
  { id: 13, type: "speaker", scale: 1.28, text: "فلا تلتفت!" },
  // Scene 14 [23.5 - 25.5s]: B-Roll Traveler (Massive Punch: "فلا تلتفت!")
  { id: 14, type: "broll", img: "traveler_path.jpg", text: "« فَـلَا تَلْتَفِـتْ ! »", pillColor: "rgba(220, 38, 38, 0.96)", isPunch: true },
  // Scene 15 [25.5 - 27.5s]: Speaker Normal Wide
  { id: 15, type: "speaker", scale: 1.0, text: "ولو اضطررت للالتفات.." },
  // Scene 16 [27.5 - 29.8s]: Speaker Punch-in Zoom
  { id: 16, type: "speaker", scale: 1.25, text: "إلى أمرٍ ما تحتاج إليه.." },
  // Scene 17 [29.8 - 31.5s]: Speaker Normal Wide with Principle Pill
  { id: 17, type: "speaker", scale: 1.0, text: "« فَقَطْ بِقَدْرِ حَاجَتِكَ ! »", pillColor: "rgba(245, 158, 11, 0.95)", isPunch: true },
  // Scene 18 [31.5 - 34.0s]: B-Roll Ancient Compass Direction
  { id: 18, type: "broll", img: "compass_direction.jpg", tag: "🧭 ثَبَاتُ الوُجْهَةِ", tagColor: "#10B981", text: "وسِرْ فِي طَرِيقِكَ.. وَلَا تَنْشَغِلْ!", highlight: "وَلَا تَنْشَغِلْ", hColor: "#34D399" },
  // Scene 19 [34.0 - 37.78s]: Speaker Normal Wide Outro
  { id: 19, type: "speaker", scale: 1.0, text: "والسلام عليكم ورحمة الله" },
];

const timings = [
  0.0, 2.0, 4.3, 5.8, 7.5, 9.0, 10.5, 12.0, 13.5, 16.0,
  18.0, 20.0, 22.0, 23.5, 25.5, 27.5, 29.8, 31.5, 34.0, 37.78,
];

export const QuranComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSeconds = frame / fps;

  // Determine current active cut index
  let activeIndex = 0;
  for (let i = 0; i < timings.length - 1; i++) {
    if (currentSeconds >= timings[i] && currentSeconds < timings[i + 1]) {
      activeIndex = i;
      break;
    }
  }

  const activeCut = cuts[activeIndex] || cuts[0];
  const isSpeaker = activeCut.type === "speaker";
  const speakerScale = isSpeaker ? activeCut.scale || 1.0 : 1.0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        overflow: "hidden",
      }}
    >
      {/* 1. Base Speaker Video Layer (Alternates scale dynamically like Camera 1 and Camera 2) */}
      <AbsoluteFill
        style={{
          transform: `scale(${speakerScale})`,
          transformOrigin: "center 35%",
          filter: "contrast(1.08) saturate(1.12) brightness(1.02)",
          transition: "transform 0.15s ease",
        }}
      >
        <OffthreadVideo
          src={staticFile("quran_talut.mp4")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
          }}
          volume={1.0}
        />
      </AbsoluteFill>

      {/* 2. Fast B-Roll Cuts (Cuts in seamlessly every ~2 seconds when active) */}
      {cuts.map((c, i) => {
        if (c.type !== "broll") return null;
        return (
          <BRollCut
            key={c.id}
            imageSrc={c.img!}
            startSec={timings[i]}
            endSec={timings[i + 1]}
            currentSeconds={currentSeconds}
            tag={c.tag}
            tagColor={c.tagColor}
          />
        );
      })}

      {/* 3. Fast Subtitle Pill (Changes and jumps synchronously with each cut) */}
      <FastSubtitle
        text={activeCut.text}
        highlightWord={activeCut.highlight}
        highlightColor={activeCut.hColor}
        pillColor={activeCut.pillColor}
        isPunch={activeCut.isPunch}
      />

      {/* 4. Minimalist Channel Badge at the top */}
      <CleanChannelBadge currentSeconds={currentSeconds} />
    </AbsoluteFill>
  );
};
