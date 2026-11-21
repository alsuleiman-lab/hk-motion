import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Chip, Gfx, T, useSp, useT } from "./MG";
import { THEMES } from "./mgThemes";
import { CoverKit } from "./CoverKit";
import { BLUE, STEEL } from "./CoverTry4";

export const L58_V2_FPS = 30;
export const L58_V2_TOTAL_FRAMES = 3538; // 117.93s * 30

const VID = staticFile("lesson58_v2_cut.mp4");
const WHOOSH = staticFile("sfx/whoosh.wav");
const CHIME = staticFile("sfx/chime.wav");

const TITLE_FONT = "'Noto Kufi Arabic', 'Cairo', sans-serif";
const TEXT_FONT = "'Almarai', 'Cairo', sans-serif";

const TH = THEMES.walnut;

// Rich Decorated Islamic Portrait Background (clearly ornamental, never black)
const PortraitDarkBg: React.FC = () => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("stock/islamic_portrait_bg.jpg")}
        style={{
          width: 1080,
          height: 1920,
          objectFit: "cover",
          filter: "brightness(0.76) contrast(1.08)",
        }}
      />
      {/* Subtle warm atmospheric glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 30%, rgba(30, 20, 12, 0.15) 0%, rgba(18, 12, 7, 0.60) 100%)",
        pointerEvents: "none"
      }} />
    </AbsoluteFill>
  );
};

// Sheikh Video Card in Upper Portion (Portrait 1080x1920)
const SheikhCardPortrait: React.FC = () => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 40) * 2;
  const s = 960 / 760; // scale factor to perfectly fit 760px Sheikh crop into 960px width

  return (
    <div style={{
      position: "absolute",
      left: 60,
      top: 100 + bob,
      width: 960,
      height: 900,
      borderRadius: 36,
      overflow: "hidden",
      border: `7px solid rgba(248, 242, 228, 0.95)`,
      boxShadow: "0 28px 60px rgba(0,0,0,0.65), 0 0 35px rgba(195,142,66,0.25)",
      background: "#160e08"
    }}>
      <OffthreadVideo
        src={VID}
        style={{
          position: "absolute",
          left: -1130 * s,
          top: -35 * s,
          width: 1920 * s,
          height: 1080 * s,
          maxWidth: "none"
        }}
      />
    </div>
  );
};

// Poetry Quote Card (Nooniyyah verse)
const VerseCard: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const s = useSp(at, 14, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.35));

  return (
    <div style={{
      position: "absolute",
      left: 60,
      top: 1040,
      width: 960,
      opacity: o,
      transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`,
      direction: "rtl",
      background: "linear-gradient(145deg, rgba(248, 242, 228, 0.96) 0%, rgba(238, 227, 206, 0.96) 100%)",
      borderRadius: 28,
      padding: "32px 38px",
      boxShadow: "0 24px 50px rgba(0,0,0,0.55)",
      border: `4px solid ${TH.accent}`,
      boxSizing: "border-box"
    }}>
      <div style={{
        display: "inline-block",
        background: "#b5412f",
        color: "#fff",
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 24,
        padding: "6px 18px",
        borderRadius: 10,
        marginBottom: 16
      }}>
        📜 نونية ابن القيم (الكافية الشافية)
      </div>

      <div style={{
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 36,
        color: "#16212e",
        lineHeight: 1.5,
        marginBottom: 16,
        borderBottom: "2px solid rgba(138, 90, 46, 0.25)",
        paddingBottom: 14
      }}>
        لَـوْ كَانَ يُمْكِنُنِي وَلَيْسَ بِمُمْكِنٍ<br />
        <span style={{ color: "#912b1d" }}>لَحَكَكْتُ مِنْ ذَا الْمُصْحَفِ الْعُثْمَانِي</span>
      </div>

      <div style={{
        fontFamily: TITLE_FONT,
        fontWeight: 700,
        fontSize: 32,
        color: "#2a1e15",
        lineHeight: 1.5
      }}>
        ذِكْـرَ اسْتِوَاءِ الرَّبِّ فَوْقَ الْعَرْشِ.. لَـكِـ<br />
        ـنَّ ذَاكَ مُمْتَنِعٌ عَلَى الإِنْسَانِ!
      </div>
    </div>
  );
};

// Historical Source Card
const SourceCard: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const s = useSp(at, 14, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.35));

  return (
    <div style={{
      position: "absolute",
      left: 60,
      top: 1040,
      width: 960,
      opacity: o,
      transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`,
      direction: "rtl",
      background: "linear-gradient(145deg, rgba(248, 242, 228, 0.96) 0%, rgba(238, 227, 206, 0.96) 100%)",
      borderRadius: 28,
      padding: "32px 38px",
      boxShadow: "0 24px 50px rgba(0,0,0,0.55)",
      border: `4px solid ${TH.accent}`,
      boxSizing: "border-box"
    }}>
      <div style={{
        display: "inline-block",
        background: TH.accent,
        color: TH.onAccent,
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 24,
        padding: "6px 18px",
        borderRadius: 10,
        marginBottom: 16
      }}>
        📖 تخريج الأثر
      </div>

      <div style={{
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 36,
        color: "#16212e",
        lineHeight: 1.3,
        marginBottom: 14
      }}>
        رواه الإمام البخاري في «خلق أفعال العباد»
      </div>

      <div style={{
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: 30,
        color: "#2a1e15",
        lineHeight: 1.5,
        marginBottom: 14
      }}>
        أن الجهم بن صفوان قال: «إنني لو استطعتُ لحككتُ هذه الآية (الرحمن على العرش استوى) من المصحف!»
      </div>

      <div style={{
        background: "rgba(181, 65, 47, 0.12)",
        borderRight: "6px solid #b5412f",
        padding: "12px 18px",
        borderRadius: 8,
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 26,
        color: "#912b1d"
      }}>
        ⚠️ حقيقة عقيدة التعطيل: النفور من صريح نصوص القرآن!
      </div>
    </div>
  );
};

// Explanatory Rule Card
const RuleCard: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const s = useSp(at, 14, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.35));

  return (
    <div style={{
      position: "absolute",
      left: 60,
      top: 1040,
      width: 960,
      opacity: o,
      transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`,
      direction: "rtl",
      background: "linear-gradient(145deg, rgba(248, 242, 228, 0.96) 0%, rgba(238, 227, 206, 0.96) 100%)",
      borderRadius: 28,
      padding: "32px 38px",
      boxShadow: "0 24px 50px rgba(0,0,0,0.55)",
      border: `4px solid ${TH.accent}`,
      boxSizing: "border-box"
    }}>
      <div style={{
        display: "inline-block",
        background: "#2f5f94",
        color: "#fff",
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 24,
        padding: "6px 18px",
        borderRadius: 10,
        marginBottom: 16
      }}>
        ⚖️ قاعدة عقدية مهمة
      </div>

      <div style={{
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 38,
        color: "#16212e",
        lineHeight: 1.3,
        marginBottom: 14
      }}>
        العبرة بحقائق الأمور لا بظواهرها
      </div>

      <div style={{
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: 30,
        color: "#2a1e15",
        lineHeight: 1.6
      }}>
        حتى وإن تبرّأ المتأخرون من الجهم بن صفوان اسماً، فإن أصول نفي الصفات التي بنوا عليها مذاهبهم هي عين أصول الجهم!
      </div>
    </div>
  );
};

// Sheikh Name Tag
const SheikhTagPortrait: React.FC<{ at: number; dur?: number }> = ({ at, dur = 5 }) => {
  const s = useSp(at, 13, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.3));

  return (
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: 50,
      transform: `translateX(-50%) translateY(${(1 - s) * 20}px) scale(${0.9 + 0.1 * s})`,
      opacity: o,
      direction: "rtl",
      background: "linear-gradient(135deg, #8a5a2e, #4a2f1d)",
      color: "#fff8e8",
      fontFamily: TITLE_FONT,
      fontWeight: 800,
      fontSize: 32,
      padding: "10px 36px 14px",
      borderRadius: 18,
      boxShadow: "0 14px 28px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.3)",
      border: "2px solid #d4af37",
      whiteSpace: "nowrap"
    }}>
      الشيخ محمد بن شمس الدين
    </div>
  );
};

// Main Exported Composition
export const Lesson58Portrait: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#241810", overflow: "hidden" }}>
      {/* 1. Deep Rich Background */}
      <PortraitDarkBg />

      {/* 2. Audio track */}
      <Audio src={VID} volume={1.0} />

      {/* 3. Speaker Card in Top Portion */}
      <SheikhCardPortrait />

      {/* 4. Motion Graphics / Content Cards in Bottom Portion */}
      <Gfx>
        {/* Intro Kinetic Chip */}
        <Chip
          at={1.0}
          dur={12}
          phrases={[
            { text: "مقالة كفرية شنيعة!", at: 1.0, color: "#f0a897" },
            { text: "كبير أهل التعطيل.. الجهم بن صفوان", at: 5.0, color: "#d4af37" }
          ]}
          x={80}
          y={1060}
        />

        {/* Card 1: بيت النونية (15s to 48s) */}
        <VerseCard at={16} dur={33} />

        {/* Card 2: أثر البخاري في خلق أفعال العباد (50s to 82s) */}
        <SourceCard at={51} dur={33} />

        {/* Card 3: العبرة بالحقائق لا بالظواهر (85s to 116s) */}
        <RuleCard at={86} dur={31} />

        {/* Sheikh Name Tag */}
        <SheikhTagPortrait at={8} dur={6} />
        <SheikhTagPortrait at={75} dur={6} />
      </Gfx>

      {/* 5. Sound Effects at transitions */}
      <Sequence from={Math.round(15 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(50 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(85 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>

      {/* 6. Approved CoverKit in first 3 frames (0.10s) */}
      <AbsoluteFill style={{ opacity: f < 3 ? 1 : 0, pointerEvents: "none" }}>
        <CoverKit
          format="portrait"
          palette={BLUE}
          line1="مقالة كفرية"
          line2="لو استطعت لحككتها من المصحف!"
          opp=""
          sheikh="cov/sheikh_t268.png"
          book="books/bukhari1.png"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
