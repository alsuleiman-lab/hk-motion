import { StatRow } from "./EuKit";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import { StreamFooter } from "./StreamFooter";
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

export const CLIP5_FPS = 30;
export const CLIP5_SECONDS = 75.0;
export const CLIP5_FRAMES = Math.ceil(CLIP5_SECONDS * CLIP5_FPS); // 2250 frames
const fps = CLIP5_FPS;
const fontTitle = "Noto Kufi Arabic, sans-serif";
const fontText = "Almarai, sans-serif";

const C = {
  white: "#ffffff",
  gold: "#f5c542",
  yellow: "#ffd152",
  red: "#e53935",
  crimson: "#b71c1c",
  navy: "#0a192f",
  darkBlue: "#112240",
  ink: "#0f172a",
};

const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke='#f5c542' stroke-width='1.2'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/><circle cx='70' cy='70' r='14'/></g></svg>`;

export const Clip5TaslamPortrait: React.FC = () => {
  FONT_TITLE();
  FONT_TEXT();
  const f = useCurrentFrame();
  const t = f / fps;

  // Cover in first 3 frames (0.10s) - Real photos of Sheikh & Opponent
  if (f < 3) {
    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 35%, #24456e 0%, #1b2a3d 60%, #132031 100%)",
          direction: "rtl",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 50,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", gap: 30, marginBottom: 30, alignItems: "center" }}>
          {/* Sheikh Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 340,
                height: 400,
                borderRadius: 28,
                border: "6px solid #f5c542",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("sheikh_current_stream.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="الشيخ محمد بن شمس الدين"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(10, 25, 47, 0.95)",
                border: "2px solid #f5c542",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#f5c542",
              }}
            >
              الشيخ محمد بن شمس الدين
            </div>
          </div>

          <div style={{ fontFamily: fontTitle, fontSize: 48, fontWeight: 900, color: "#e53935" }}>
            ⚠️
          </div>

          {/* Seraj Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 340,
                height: 400,
                borderRadius: 28,
                border: "6px solid #e53935",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(229,57,53,0.4)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("seraj_face.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="سراج حياني"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(183, 28, 28, 0.95)",
                border: "2px solid #ffffff",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              مناظرة سراج حياني
            </div>
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          تنبيه وتحذير شرعي خطير ⚠️
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 20,
          }}
        >
          قول «لا نريدك أن تسلم»
          <br />
          <span style={{ color: "#ffd152" }}>قول خطير لا يجوز.. فاحذر!</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 35%, #24456e 0%, #1b2a3d 60%, #132031 100%)",
        direction: "rtl",
        overflow: "hidden",
      }}
    >
      {/* Decorative Islamic Background */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`,
          backgroundSize: "140px 140px",
          backgroundPosition: `${f * 0.2}px ${f * 0.1}px`,
          opacity: 0.22,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(15, 25, 45, 0.4) 100%)",
        }}
      />

      {/* PANEL 1: TOP (Sheikh Muhammad bin Shams al-Din - الشيخ دائماً في الأعلى) */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 50,
          width: 980,
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          border: `6px solid ${C.gold}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          background: "#112240",
        }}
      >
        {/* Crop centered on the Sheikh */}
        <OffthreadVideo
          src={staticFile("stream_clip5_clean.mp4")}
          style={{
            position: "absolute",
            left: -1424,
            top: -273,
            width: 2534,
            height: 1425,
            maxWidth: "none",
          }}
        />

        {/* Panel Header Badge */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            background: "rgba(10, 25, 47, 0.94)",
            border: `2px solid ${C.gold}`,
            borderRadius: 999,
            padding: "6px 24px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>🎙️</span>
          <span
            style={{
              fontFamily: fontText,
              fontSize: 26,
              fontWeight: 800,
              color: C.gold,
            }}
          >
            الشيخ محمد بن شمس الدين
          </span>
        </div>
      </div>

      {/* PANEL 2: BOTTOM (The Debate Screen: Seraj & Anas - المناظرة في الأسفل) */}
      <div
        style={{
          position: "absolute",
          top: 830,
          left: 50,
          width: 980,
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          border: "6px solid rgba(229, 57, 53, 0.85)",
          boxShadow: "0 20px 50px rgba(229, 57, 53, 0.4)",
          background: "#112240",
        }}
      >
        <OffthreadVideo
          src={staticFile("stream_clip5_clean.mp4")}
          style={{
            position: "absolute",
            left: -136,
            top: -259,
            width: 2208,
            height: 1242,
            maxWidth: "none",
          }}
        />

        {/* Panel Header Badge */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            background: "rgba(183, 28, 28, 0.95)",
            border: "2px solid #fff",
            borderRadius: 999,
            padding: "6px 24px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>⚔️</span>
          <span
            style={{
              fontFamily: fontText,
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            المناظرة: سراج حياني وأنس محمد
          </span>
        </div>
      </div>

      {/* LOWER SECTION: Dynamic Phrase-by-Phrase Montage Cards */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {/* 1. 0.0s - 8.5s: تحدي سراج */}
        {t >= 0.0 && t < 8.5 && (
          <StatRow
            at={0.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: أظهر لي دراسة والآن أسلم!"
            sub="سراج يتحدى في المناظرة بإعلان إسلامه"
            rot={-1}
          />
        )}

        {/* 2. 8.5s - 15.0s: سقطة المحاور الشنيعة */}
        {t >= 8.5 && t < 15.0 && (
          <StatRow
            at={8.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-triangle"
            label="المحاور: «لا نريدك أن تسلم!»"
            sub="كلمة خطيرة شنيعة خرجت من لسان المحاور في المناظرة"
            rot={1}
          />
        )}

        {/* 3. 15.0s - 24.0s: إنكار الشيخ وتوبته */}
        {t >= 15.0 && t < 24.0 && (
          <StatRow
            at={15.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="shield-alert"
            label="الشيخ: كلامه خطير جداً.. فليتب لله!"
            sub="إنكار فوري من الشيخ وتنبيه المحاور للتوبة والاستغفار"
            rot={-1}
          />
        )}

        {/* 4. 24.0s - 33.5s: وظيفة الداعية */}
        {t >= 24.0 && t < 33.5 && (
          <StatRow
            at={24.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="user-check"
            label="أنت داعية.. يدخل للإسلام شئت أم أبيت!"
            sub="الداعية يفرح بهداية الخلق ولا يقف مانعاً في طريقهم"
            rot={1}
          />
        )}

        {/* 5. 33.5s - 43.0s: خطورة العبارة على دين القائل */}
        {t >= 33.5 && t < 43.0 && (
          <StatRow
            at={33.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-octagon"
            label="لا تريده أن يسلم؟! خطيرة على دينك!"
            sub="تمني بقاء الكافر على كفره أمر عظيم الخطر في العقيدة"
            rot={-1}
          />
        )}

        {/* 6. 43.0s - 53.0s: أنت تريده أن يكفر بالله؟ */}
        {t >= 43.0 && t < 53.0 && (
          <StatRow
            at={43.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="shield-x"
            label="أنت تريده أن يكفر بالله؟! فاحذر!"
            sub="المسلم يرجو التوحيد لكل الناس ويحذر من الرضا بالضلال"
            rot={1}
          />
        )}

        {/* 7. 53.0s - 61.5s: نقل قول الحنفية في تأخير الشهادة */}
        {t >= 53.0 && t < 61.5 && (
          <StatRow
            at={53.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="book-open"
            label="مسألة عند الحنفية: تأخير تلقين الشهادة"
            sub="نقل الشيخ لقول فقهاء الحنفية لبيان عظم هذا الباب وخطره"
            rot={-1}
          />
        )}

        {/* 8. 61.5s - نهاية الكليب: تصحيح المسألة وحرمة اللعب بالدين */}
        {t >= 61.5 && (
          <StatRow
            at={61.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="scale"
            label="ليست مناكفات ولعب بالألفاظ.. هذا دين!"
            sub="التحذير من الانجراف وراء حظوظ النفس والجدل في الدين"
            rot={1}
          />
        )}
      </div>

      <StreamFooter />
    </AbsoluteFill>
  );
};
