import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Chip, Gfx, MGTheme, Stamp, T, useSp, useT, NoteCard } from "./MG";
import { THEMES } from "./mgThemes";
import { CoverKit } from "./CoverKit";
import { STEEL, BLUE } from "./CoverTry4";
import v1Words from "../public/lesson58_v1_words.json";

export const L58_V1_FPS = 30;
export const L58_V1_TOTAL_FRAMES = 11122; // ~370.73 seconds

const VID = staticFile("lesson58_v1_cut.mp4");
const WHOOSH = staticFile("sfx/whoosh.wav");
const CHIME = staticFile("sfx/chime.wav");

const TITLE_FONT = "'Noto Kufi Arabic', 'Cairo', sans-serif";
const TEXT_FONT = "'Almarai', 'Cairo', sans-serif";

// Theme: Warm serious bookish/walnut palette
const TH = THEMES.walnut;

// Rich decorated Islamic walnut woodwork background (never black, clearly ornamental)
const RichDarkBg: React.FC = () => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("stock/islamic_walnut_bg.jpg")}
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          filter: "brightness(0.74) contrast(1.08)",
        }}
      />
      {/* Subtle warm atmospheric glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(30, 20, 12, 0.15) 0%, rgba(18, 12, 7, 0.65) 100%)",
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
            filter: "brightness(0.32) saturate(0.8) sepia(0.25)",
          }}
        />
        {/* Dark overlay pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(22, 14, 8, 0.72)",
          backgroundImage: `radial-gradient(${TH.accent} 1.5px, transparent 2px)`,
          backgroundSize: "50px 50px"
        }} />
      </AbsoluteFill>
    </Sequence>
  );
};

// Single persistent Sheikh Video frame that smoothly glides between center and right side
const SpeakerFrame: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;

  // Define side intervals (where cards/sources/documents are shown on left)
  const intervals: [number, number][] = [
    [44, 125],
    [165, 240],
    [275, 345],
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
      border: `7px solid rgba(248, 242, 228, 0.95)`,
      boxShadow: "0 30px 60px rgba(0,0,0,0.7), 0 0 45px rgba(195,142,66,0.28)",
      background: "#18110b",
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

// Side panel Card for historical quotes and details (left side)
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
      direction: "rtl",
      background: "linear-gradient(145deg, rgba(248, 242, 228, 0.96) 0%, rgba(238, 227, 206, 0.96) 100%)",
      borderRadius: 28,
      padding: "36px 44px",
      boxShadow: "0 28px 56px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.8)",
      border: `4px solid ${TH.accent}`,
      boxSizing: "border-box"
    }}>
      {tag ? (
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
          {tag}
        </div>
      ) : null}

      <div style={{
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        fontSize: 44,
        color: TH.ink,
        lineHeight: 1.3,
        marginBottom: 18,
        borderBottom: `2px solid rgba(138, 90, 46, 0.25)`,
        paddingBottom: 14
      }}>
        {title}
      </div>

      <div style={{
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: 34,
        color: "#2a1e15",
        lineHeight: 1.6,
        marginBottom: highlight ? 18 : 8
      }}>
        «{quote}»
      </div>

      {highlight ? (
        <div style={{
          background: "rgba(181, 65, 47, 0.12)",
          borderRight: `6px solid #b5412f`,
          padding: "12px 20px",
          borderRadius: 8,
          fontFamily: TITLE_FONT,
          fontWeight: 800,
          fontSize: 30,
          color: "#912b1d",
          lineHeight: 1.4,
          marginBottom: 14
        }}>
          ⚠️ {highlight}
        </div>
      ) : null}

      {source ? (
        <div style={{
          fontFamily: TEXT_FONT,
          fontWeight: 800,
          fontSize: 24,
          color: TH.accent,
          textAlign: "left",
          direction: "ltr",
          marginTop: 10
        }}>
          📖 المصدر: {source}
        </div>
      ) : null}
    </div>
  );
};

// Speaker Name Tag
const SheikhTag: React.FC<{ at: number; dur?: number }> = ({ at, dur = 5 }) => {
  const s = useSp(at, 13, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.3));

  return (
    <div style={{
      position: "absolute",
      right: 180,
      bottom: 50,
      opacity: o,
      transform: `translateY(${(1 - s) * 20}px) scale(${0.9 + 0.1 * s})`,
      direction: "rtl",
      background: "linear-gradient(135deg, #8a5a2e, #4a2f1d)",
      color: "#fff8e8",
      fontFamily: TITLE_FONT,
      fontWeight: 800,
      fontSize: 34,
      padding: "10px 36px 14px",
      borderRadius: 18,
      boxShadow: "0 14px 28px rgba(0,0,0,0.45), 0 0 20px rgba(212,175,55,0.3)",
      border: "2px solid #d4af37",
      whiteSpace: "nowrap"
    }}>
      الشيخ محمد بن شمس الدين
    </div>
  );
};

// Subscription reminder card
const SubscribeCard: React.FC<{ at: number; dur?: number }> = ({ at, dur = 8 }) => {
  const s = useSp(at, 13, 160);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(Math.min(1, s * 2), Math.max(0, (dur - t) / 0.3));

  return (
    <div style={{
      position: "absolute",
      left: 100,
      bottom: 60,
      opacity: o,
      transform: `translateY(${(1 - s) * 20}px) scale(${0.92 + 0.08 * s})`,
      direction: "rtl",
      display: "flex",
      alignItems: "center",
      gap: 24,
      background: "rgba(248, 242, 228, 0.95)",
      borderRadius: 22,
      padding: "18px 38px",
      boxShadow: "0 20px 45px rgba(0,0,0,0.5)",
      border: `4px solid ${TH.accent}`
    }}>
      <div style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "#b5412f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 30,
        boxShadow: "0 6px 14px rgba(181, 65, 47, 0.4)"
      }}>
        🔔
      </div>
      <div>
        <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 32, color: TH.ink }}>
          قناة محمد بن شمس الدين
        </div>
        <div style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 24, color: TH.accent }}>
          اشترك وفعّل الجرس ليصلك جديد الدروس والردود
        </div>
      </div>
    </div>
  );
};

// Main Exported Composition
export const Lesson58Landscape: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#2a1d13", overflow: "hidden" }}>
      {/* 1. Deep Rich Background */}
      <RichDarkBg />

      {/* 2. Mandatory Dual-Video B-roll Background (Scene 3: 180s to 220s) */}
      <DualBrollBg at={180} dur={42} />

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
            { text: "السلطان بيبرس الجاشنكير", at: 1.0, color: "#d4af37" },
            { text: "متذوق طعام الملوك!", at: 4.0, color: "#fff8e8" }
          ]}
          x={100}
          y={140}
        />

        <Chip
          at={15.0}
          dur={9}
          phrases={[
            { text: "وظيفة متذوق الطعام", at: 15.0, color: "#fff8e8" },
            { text: "صاحب المنصب والحكم", at: 19.5, color: "#e3b869" }
          ]}
          x={100}
          y={140}
        />

        {/* Card 1: مقدمة التسعينية */}
        <InfoCard
          at={48}
          dur={36}
          tag="وثيقة تاريخية"
          title="تحزّب الصوفية على شيخ الإسلام"
          quote="فتحزّب عليه الصوفية على ابن تيمية، وذهبوا إلى القلعة في جموع كثيرة يشكون ابن تيمية للسلطان، وادّعوا أنه يسب مشايخهم ويطعن بالعلماء!"
          highlight="التحريض عند السلطان لإسكات صوت الحق وسجن ابن تيمية"
          source="مقدمة كتاب التسعينية لشيخ الإسلام ابن تيمية"
        />

        {/* Card 2: ابن حجر ونصر المنبجي */}
        <InfoCard
          at={88}
          dur={36}
          tag="أئمة الجرح والتعديل"
          title="نصر المنبجي رأس التحريض"
          quote="وكان من أعظم القائمين عليه نصر المنبجي.. لأنه بلغه أن ابن تيمية يتعصب عليه لإنكاره على ابن عربي الصوفي الملحد"
          highlight="الحقد بسبب الرد على الحلول والاتحاد وتكفير ابن عربي"
          source="الحافظ ابن حجر العسقلاني — الدرر الكامنة"
        />

        {/* Chip for Ibn Arabi distinction */}
        <Chip
          at={132}
          dur={12}
          phrases={[
            { text: "ابن العربي (المالكي الأشعري)", at: 132, color: "#9ec5e8" },
            { text: "ابن عربي (الصوفي صاحب الفصوص)", at: 136, color: "#f0a897" }
          ]}
          x={100}
          y={140}
        />

        {/* Card 3: المقريزي وسلاح التهويل الأمني */}
        <InfoCard
          at={172}
          dur={42}
          tag="المكر السياسي"
          title="قل للأمراء: يُخشى على الدولة منه!"
          quote="فقام نصر المنبجي بالقاهرة، وقال لقاضي القضاة زين الدين بن مخلوف المالكي: قل للأمراء بأن ابن تيمية يُخشى على الدولة منه!"
          highlight="التهويل الأمني: ادعاء أن العالم يهدد أمن الدولة واستقرارها!"
          source="المؤرخ تقي الدين المقريزي — السلوك لمعرفة دول الملوك"
        />

        {/* Card 4: الشوكاني ومسألة الاستغاثة */}
        <InfoCard
          at={224}
          dur={38}
          tag="شهادة المؤرخين"
          title="شكاية الصوفية في القلعة"
          quote="ثم اجتمع جماعة من الصوفية عند تاج الدين بن عطاء، فطلعوا في العشر الأوسط من شوال إلى القلعة وشكوا ابن تيمية أنه قال: لا يستغاث بالنبي ﷺ"
          highlight="تصوير المسألة الشرعية للسلطان الجاهل كأنها تنقّص من مقام النبي ﷺ"
          source="الإمام الشوكاني — البدر الطالع بمحاسن من بعد القرن السابع"
        />

        {/* Card 5: البرزالي وخلاصة الوشاية */}
        <InfoCard
          at={280}
          dur={48}
          tag="معاصرة ومشاهدة"
          title="شهادة الإمام المؤرخ البرزالي"
          quote="والذي حمل الأمير على هذا الفعل كتاب ورد عليه من مصر في هذا المعنى.. وكان السبب فيه القاضي زين الدين المالكي والشيخ نصر المنبجي"
          highlight="استمالة قلب الحاكم الجاهل وتكرار ذلك عبر تاريخ أهل السنة"
          source="الإمام عَلَم الدين البرزالي (تلميذ ابن تيمية ومعاصره)"
        />

        {/* Sheikh Name Tag around 3m and 5m */}
        <SheikhTag at={12} dur={6} />
        <SheikhTag at={180} dur={6} />
        <SheikhTag at={330} dur={6} />

        {/* Subscribe Reminder */}
        <SubscribeCard at={350} dur={18} />
      </Gfx>

      {/* 6. Sound Effects at transitions */}
      <Sequence from={Math.round(44 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(124 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(164 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>
      <Sequence from={Math.round(274 * 30)} durationInFrames={30}>
        <Audio src={WHOOSH} volume={0.08} />
      </Sequence>

      {/* 7. Approved CoverKit in first 3 frames (0.10s) */}
      <AbsoluteFill style={{ opacity: f < 3 ? 1 : 0, pointerEvents: "none" }}>
        <CoverKit
          format="landscape"
          palette={BLUE}
          line1="مؤامرة سجن"
          line2="ابن تيمية والسلطان بيبرس"
          opp=""
          sheikh="cov/sheikh_t268.png"
          book="books/bukhari1.png"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
