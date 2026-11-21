import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Chip, Gfx, T, useSp, useT } from "./MG";
import { THEMES } from "./mgThemes";
import { CoverKit } from "./CoverKit";
import { BLUE, STEEL } from "./CoverTry4";
import v3Words from "../public/lesson58_v3_words.json";

export const L58_V3_FPS = 30;
export const L58_V3_TOTAL_FRAMES = 6095; // 203.15s * 30

const VID = staticFile("lesson58_v3_cut.mp4");
const WHOOSH = staticFile("sfx/whoosh.wav");
const CHIME = staticFile("sfx/chime.wav");

const TITLE_FONT = "'Noto Kufi Arabic', 'Cairo', sans-serif";
const TEXT_FONT = "'Almarai', 'Cairo', sans-serif";

// Theme: Deep teal & emerald with warm gold and ivory accents
const TH = THEMES.teal;

// Rich Decorated Islamic Teal Background (clearly ornamental, scholarly library ambiance)
const TealDarkBg: React.FC = () => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("stock/islamic_teal_bg.jpg")}
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          filter: "brightness(0.74) contrast(1.08)",
        }}
      />
      {/* Subtle atmospheric glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(15, 43, 43, 0.15) 0%, rgba(8, 24, 26, 0.65) 100%)",
        pointerEvents: "none"
      }} />
    </AbsoluteFill>
  );
};

// Moving B-roll background for the mandatory landscape dual-scene
const DualBrollBg: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  return (
    <Sequence from={Math.round(at * 30)} durationInFrames={Math.round(dur * 30)}>
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile("eu/l_intro_v2.mp4")}
          style={{
            width: 1920,
            height: 1080,
            objectFit: "cover",
            filter: "brightness(0.28) saturate(0.85) hue-rotate(150deg)",
          }}
        />
        {/* Dark overlay pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6, 20, 22, 0.75)",
          backgroundImage: `radial-gradient(${TH.accent} 1.5px, transparent 2px)`,
          backgroundSize: "50px 50px"
        }} />
      </AbsoluteFill>
    </Sequence>
  );
};

// Offthread video import helper
import { OffthreadVideo } from "remotion";

// Single persistent Sheikh Video frame that smoothly glides between center and right side
const SpeakerFrame: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;

  // Define side intervals (where cards/sources/documents are shown on left)
  const intervals: [number, number][] = [
    [26, 68],
    [86, 140],
    [148, 192],
  ];

  let sideWeight = 0;
  for (const [s, e] of intervals) {
    if (t >= s - 0.4 && t <= e + 0.4) {
      if (t < s) {
        sideWeight = Math.max(sideWeight, (t - (s - 0.4)) / 0.4);
      } else if (t > e) {
        sideWeight = Math.max(sideWeight, ((e + 0.4) - t) / 0.4);
      } else {
        sideWeight = 1;
      }
    }
  }

  // Smooth ease curve
  const ease = sideWeight * sideWeight * (3 - 2 * sideWeight);
  const bob = ease * Math.sin(f / 45) * 3;

  // Interpolate geometry
  const cardW = 805 - ease * (805 - 760);
  const cardH = 1000 - ease * (1000 - 960);
  const cardLeft = 557 + ease * (1100 - 557);
  const cardTop = 40 + ease * 20 + bob;
  const cardBr = 36 - ease * 4;

  const vidW = 2035.2 - ease * (2035.2 - 1920);
  const vidH = 1144.8 - ease * (1144.8 - 1080);
  const vidLeft = -1197.8 + ease * (1197.8 - 1130);
  const vidTop = -37.1 + ease * (37.1 - 35);

  return (
    <div style={{
      position: "absolute",
      left: cardLeft,
      top: cardTop,
      width: cardW,
      height: cardH,
      borderRadius: cardBr,
      overflow: "hidden",
      border: `7px solid rgba(244, 248, 247, 0.95)`,
      boxShadow: "0 30px 60px rgba(0,0,0,0.7), 0 0 45px rgba(35,112,111,0.35)",
      background: "#08181a",
      zIndex: 2,
    }}>
      <OffthreadVideo
        src={VID}
        style={{
          position: "absolute",
          left: vidLeft,
          top: vidTop,
          width: vidW,
          height: vidH,
          maxWidth: "none"
        }}
      />
    </div>
  );
};

// Side panel Card for scholarly quotes and details (left side)
const InfoCard: React.FC<{
  at: number;
  dur: number;
  title: string;
  source?: string;
  quote: string;
  highlight?: string;
  tag?: string;
}> = ({ at, dur, title, source, quote, highlight, tag }) => {
  const s = useSp(at, 14, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.35));

  return (
    <div style={{
      position: "absolute",
      left: 70,
      top: 140,
      width: 950,
      opacity: o,
      transform: `translateY(${(1 - s) * 45}px) scale(${0.96 + 0.04 * s})`,
      zIndex: 3,
      background: "linear-gradient(145deg, rgba(20, 48, 50, 0.94) 0%, rgba(9, 26, 28, 0.96) 100%)",
      borderRadius: 28,
      border: `2px solid rgba(130, 200, 195, 0.35)`,
      boxShadow: "0 25px 60px rgba(0,0,0,0.65), 0 0 35px rgba(35,112,111,0.25)",
      padding: "36px 42px",
      direction: "rtl",
      fontFamily: TEXT_FONT,
      color: "#f4f8f7",
    }}>
      {/* Top Tag & Source line */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        {tag && (
          <span style={{
            background: "rgba(35, 112, 111, 0.45)",
            border: `1px solid rgba(130, 200, 195, 0.5)`,
            color: "#88ded5",
            fontSize: 21,
            fontWeight: 800,
            padding: "6px 18px",
            borderRadius: 14,
            fontFamily: TITLE_FONT,
            letterSpacing: 0.5,
          }}>
            {tag}
          </span>
        )}
        {source && (
          <span style={{
            color: "#d4af37",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: TITLE_FONT,
          }}>
            📖 {source}
          </span>
        )}
      </div>

      {/* Card Title */}
      <h2 style={{
        margin: "0 0 20px 0",
        fontSize: 34,
        fontWeight: 900,
        color: "#ffffff",
        fontFamily: TITLE_FONT,
        lineHeight: 1.35,
        borderBottom: `2px solid rgba(130, 200, 195, 0.25)`,
        paddingBottom: 14,
      }}>
        {title}
      </h2>

      {/* Main Quote */}
      <div style={{
        fontSize: 27,
        lineHeight: 1.6,
        color: "#f0f6f5",
        fontWeight: 600,
        marginBottom: highlight ? 22 : 0,
        position: "relative",
        paddingRight: 22,
        borderRight: `4px solid ${TH.accent}`,
      }}>
        «{quote}»
      </div>

      {/* Highlight Key Point */}
      {highlight && (
        <div style={{
          background: "rgba(212, 175, 55, 0.14)",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: 16,
          padding: "16px 22px",
          color: "#ffeaa7",
          fontSize: 22,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>⚡</span>
          <span>{highlight}</span>
        </div>
      )}
    </div>
  );
};

// Sheikh Identification Badge
const SheikhTag: React.FC<{ at: number; dur: number }> = ({ at, dur }) => {
  const s = useSp(at, 12, 180);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.3));

  return (
    <div style={{
      position: "absolute",
      right: 90,
      bottom: 80,
      opacity: o,
      transform: `translateY(${(1 - s) * 20}px)`,
      zIndex: 5,
      background: "rgba(9, 26, 28, 0.92)",
      border: "1.5px solid rgba(130, 200, 195, 0.4)",
      borderRadius: 18,
      padding: "12px 26px",
      direction: "rtl",
      fontFamily: TITLE_FONT,
      textAlign: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: "#d4af37", fontSize: 22, fontWeight: 900 }}>الشيخ محمد بن شمس الدين</div>
      <div style={{ color: "#88ded5", fontSize: 16, fontWeight: 600, marginTop: 4 }}>شرح نونية ابن القيم — المجلس 58</div>
    </div>
  );
};

// Dynamic Captions Layer (Bottom center, completely clear of face and beard)
const BottomCaptions: React.FC = () => {
  const t = useT();

  const windowWords = (v3Words as Array<{ s: number; e: number; w: number | string }>).filter(
    (w) => w.s <= t + 0.1 && w.e >= t - 0.8
  );

  const activeIndex = windowWords.findIndex((w) => t >= w.s && t <= w.e + 0.15);

  if (windowWords.length === 0) return null;

  return (
    <div style={{
      position: "absolute",
      bottom: 45,
      left: 120,
      width: 860,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 6,
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(4, 14, 15, 0.88)",
        backdropFilter: "blur(8px)",
        border: "1.5px solid rgba(130, 200, 195, 0.35)",
        borderRadius: 22,
        padding: "14px 28px",
        display: "flex",
        flexWrap: "wrap",
        gap: "10px 14px",
        direction: "rtl",
        justifyContent: "center",
        boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
      }}>
        {windowWords.slice(Math.max(0, activeIndex - 3), activeIndex + 4).map((w, idx) => {
          const isActive = t >= w.s && t <= w.e + 0.15;
          return (
            <span
              key={idx}
              style={{
                fontSize: 27,
                fontWeight: isActive ? 900 : 700,
                color: isActive ? "#ffeaa7" : "#f4f8f7",
                fontFamily: TITLE_FONT,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.1s ease",
                textShadow: isActive ? "0 0 16px rgba(255,234,167,0.6)" : "none",
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Main Composition for Video 3 (Landscape)
export const Lesson58V3Landscape: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#0f2b2b", overflow: "hidden" }}>
      {/* 1. Deep Rich Background */}
      <TealDarkBg />

      {/* 2. Mandatory Dual-Video B-roll Background (Scene 2: 90s to 132s) */}
      <DualBrollBg at={90} dur={42} />

      {/* 3. Audio track from cut video */}
      <Audio src={VID} volume={1.0} />

      {/* 4. Single persistent Speaker Frame gliding smoothly between Center & Side */}
      <SpeakerFrame />

      {/* 5. Motion Graphics Layer (<Gfx> protects from face obstruction) */}
      <Gfx>
        {/* Intro Kinetic Chips */}
        <Chip
          at={1.0}
          dur={7}
          phrases={[
            { text: "إمام الأئمة ابن خزيمة", at: 1.0, color: "#d4af37" },
            { text: "صاحب كتاب التوحيد", at: 4.0, color: "#f4f8f7" }
          ]}
          x={100}
          y={140}
        />

        <Chip
          at={14.0}
          dur={8}
          phrases={[
            { text: "طعن الفخر الرازي", at: 14.0, color: "#f4f8f7" },
            { text: "سمى كتابه كتاب الشرك!", at: 17.5, color: "#ff7675" }
          ]}
          x={100}
          y={140}
        />

        {/* Card 1: الإمام ابن خزيمة ومكانته */}
        <InfoCard
          at={28}
          dur={38}
          tag="ترجمة إمام الأئمة"
          title="من هو الإمام ابن خزيمة النيسابوري؟"
          quote="قال عنه الحافظ الذهبي: إمام الأئمة، وعالم خراسان، وصاحب التصانيف الكبار، جمع في كتاب التوحيد أحاديث الصفات النبوية بالسند الصحيح"
          highlight="المتوفى سنة 311 هـ — من أكابر أئمة السنة والحديث"
          source="الحافظ الذهبي — سير أعلام النبلاء"
        />

        {/* Card 2: طعن الرازي والسبب الحقيقي */}
        <InfoCard
          at={90}
          dur={46}
          tag="حقيقة الوشاية والطعن"
          title="لماذا قال الرازي: هو كتاب الشرك؟"
          quote="قال الرازي في أساس التقديس: وسمى كتابه كتاب التوحيد وهو كتاب الشرك! صدق الرازي في التزام أصول مذهبه؛ لأن نصوص السنة تبطل مذهب التأويل والتعطيل"
          highlight="الطعن في العالم هو حيلة لإسقاط الأحاديث النبوية التي رواها!"
          source="الفخر الرازي — أساس التقديس"
        />

        {/* Card 3: التنفير من كتب السنة والحديث */}
        <InfoCard
          at={150}
          dur={38}
          tag="قاعدة أهل السنة"
          title="حرب التنفير عن كتب الحديث"
          quote="إذا أردت أن تبطل نصوص الصفات فعليك أولاً بالطعن في أئمتها: كفّروا ابن خزيمة، اتهموا السلف، ونفّروا العامة عن كتب الأثر!"
          highlight="الحل: التمسك بما كان عليه النبي ﷺ وأصحابه وسلف الأمة"
          source="شرح نونية ابن القيم — المجلس 58"
        />

        {/* Sheikh Name Tag */}
        <SheikhTag at={10} dur={6} />
        <SheikhTag at={95} dur={6} />
        <SheikhTag at={175} dur={6} />
      </Gfx>

      {/* Subtitles on Left/Center bottom */}
      <BottomCaptions />

      {/* 6. Sound Effects at transitions */}
      <Sequence from={Math.round(28 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(88 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(148 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>

      {/* 7. Approved CoverKit in first 3 frames (0.10s) */}
      <AbsoluteFill style={{ opacity: f < 3 ? 1 : 0, pointerEvents: "none" }}>
        <CoverKit
          format="landscape"
          palette={BLUE}
          line1="سر طعن الرازي في"
          line2="إمام الأئمة ابن خزيمة وكتاب التوحيد"
          opp=""
          sheikh="cov/sheikh_t268.png"
          book="books/bukhari1.png"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
