import { StatRow } from "./EuKit";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import { StreamFooter } from "./StreamFooter";
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

export const CLIP1_FPS = 30;
export const CLIP1_SECONDS = 112.1;
export const CLIP1_FRAMES = Math.ceil(CLIP1_SECONDS * CLIP1_FPS); // 3363 frames
const fps = CLIP1_FPS;
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

export const Clip1SunPortrait: React.FC = () => {
  FONT_TITLE();
  FONT_TEXT();
  const f = useCurrentFrame();
  const t = f / fps;

  // Cover in first 3 frames (0.10s) - Vertically Stacked (Sheikh large on top, Opponent below)
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
          padding: "50px 40px",
          textAlign: "center",
        }}
      >
        {/* Category Header Badge */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 26,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 20,
            background: "rgba(6, 17, 30, 0.9)",
            padding: "8px 30px",
            borderRadius: 999,
            border: "1.5px solid rgba(245, 197, 66, 0.5)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          مناظرة سراج حياني وأنس محمد • تعليق الشيخ
        </div>

        {/* 1. TOP: Sheikh Muhammad bin Shams al-Din (Large & Prominent) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
          <div
            style={{
              width: 540,
              height: 440,
              borderRadius: 32,
              border: "6px solid #f5c542",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
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
              marginTop: -22,
              background: "rgba(10, 25, 47, 0.98)",
              border: "2px solid #f5c542",
              borderRadius: 999,
              padding: "6px 26px",
              fontFamily: fontTitle,
              fontSize: 24,
              fontWeight: 800,
              color: "#f5c542",
              boxShadow: "0 6px 20px rgba(0,0,0,0.8)",
              zIndex: 10,
            }}
          >
            الشيخ محمد بن شمس الدين
          </div>
        </div>

        {/* VS Divider Badge */}
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 24,
            fontWeight: 900,
            color: "#ffd152",
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(245, 197, 66, 0.3)",
            borderRadius: 999,
            padding: "4px 20px",
            margin: "4px 0 10px 0",
          }}
        >
          ⚔️ ضد ⚔️
        </div>

        {/* 2. BOTTOM: Seraj Hayani (Underneath) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 400,
              height: 320,
              borderRadius: 26,
              border: "5px solid #e53935",
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
              marginTop: -18,
              background: "rgba(183, 28, 28, 0.98)",
              border: "2px solid #ffffff",
              borderRadius: 999,
              padding: "4px 22px",
              fontFamily: fontTitle,
              fontSize: 20,
              fontWeight: 800,
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(0,0,0,0.8)",
              zIndex: 10,
            }}
          >
            سراج حياني
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 50,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.95)",
            marginBottom: 16,
          }}
        >
          سراج حياني يرد على نفسه في
          <br />
          <span style={{ color: "#ffd152" }}>«جريان الشمس وتوقفها وسجودها»</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 20,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "5px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }

  const isPastVideo = t >= 58.0 && t < 102.5;

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 35%, #24456e 0%, #1b2a3d 60%, #132031 100%)",
        direction: "rtl",
        overflow: "hidden",
      }}
    >
      {/* Decorative Star Pattern Background */}
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
        {/* Crop centered on the Sheikh on the right */}
        <OffthreadVideo
          src={staticFile("stream_clip1_clean.mp4")}
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

      {/* PANEL 2: BOTTOM (The Debate / Opponent Box - الطرف المردود عليه في الأسفل) */}
      <div
        style={{
          position: "absolute",
          top: 830,
          left: 50,
          width: 980,
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          border: isPastVideo ? `6px solid ${C.red}` : "6px solid rgba(255, 255, 255, 0.85)",
          boxShadow: isPastVideo ? "0 20px 50px rgba(229, 57, 53, 0.45)" : "0 20px 50px rgba(0,0,0,0.75)",
          background: "#112240",
        }}
      >
        <OffthreadVideo
          src={staticFile("stream_clip1_clean.mp4")}
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
            background: isPastVideo ? "rgba(183, 28, 28, 0.95)" : "rgba(10, 25, 47, 0.92)",
            border: `2px solid ${isPastVideo ? "#fff" : C.gold}`,
            borderRadius: 999,
            padding: "6px 24px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>{isPastVideo ? "⏮️" : "⚔️"}</span>
          <span
            style={{
              fontFamily: fontText,
              fontSize: 26,
              fontWeight: 800,
              color: isPastVideo ? "#fff" : C.yellow,
            }}
          >
            {isPastVideo ? "سراج حياني (وهو مسلم يرد على الشبهة)" : "سراج حياني في المناظرة (طرح الشبهة)"}
          </span>
        </div>
      </div>

      {/* LOWER SECTION: Dynamic Phrase-by-Phrase Montage Cards */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {/* 1. 0.0s - 10.0s: طرح الشبهة من الآية */}
        {t >= 0.0 && t < 10.0 && (
          <StatRow
            at={0.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: الآية تقول مستقرها تحت العرش"
            sub="سراج حياني في المناظرة يطرح إشكاله حول جريان الشمس"
            rot={-1}
          />
        )}

        {/* 2. 10.0s - 17.5s: ادعاء توقف الشمس */}
        {t >= 10.0 && t < 17.5 && (
          <StatRow
            at={10.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="compass"
            label="سراج: الشمس لا تتوقف في مدارها!"
            sub="ادعاء سراج أن نصوص الحديث تفيد توقفها الحسي الحالي"
            rot={1}
          />
        )}

        {/* 3. 17.5s - 25.0s: رد المحاور المفحم */}
        {t >= 17.5 && t < 25.0 && (
          <StatRow
            at={17.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-circle"
            label="المحاور: العرش فوقها والمستقر بالآخرة!"
            sub="تنبيه سراج على سعة العرش ومعنى المستقر الزماني"
            rot={-1}
          />
        )}

        {/* 4. 25.0s - 37.0s: إصرار سراج */}
        {t >= 25.0 && t < 37.0 && (
          <StatRow
            at={25.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: الحديث يقول تجري وتتوقف!"
            sub="إصرار سراج على تفسيره الخاطئ لحديث السجود"
            rot={1}
          />
        )}

        {/* 5. 37.0s - 51.5s: ذروة الشبهة والطعن */}
        {t >= 37.0 && t < 51.5 && (
          <StatRow
            at={37.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-triangle"
            label="سراج: القرآن يدعي ادعاء باطلاً!"
            sub="قمة الشبهة والادعاء السقيم في المناظرة"
            rot={-1}
          />
        )}

        {/* 6. 51.5s - 58.0s: تدخل الشيخ ومفاجأة المقطع القديم */}
        {t >= 51.5 && t < 58.0 && (
          <StatRow
            at={51.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="zap"
            label="الشيخ: اسمعوا رده لما كان مسلماً!"
            sub="الشيخ يكشف تناقض سراج بعرض مقطعه القديم بالصوت والصورة"
            rot={1}
          />
        )}

        {/* 7. 58.0s - 67.5s: سراج القديم يفند الشبهة */}
        {t >= 58.0 && t < 67.5 && (
          <StatRow
            at={58.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="check-circle"
            label="سراج القديم: ادعاء سقيم وفيه تحامل!"
            sub="سراج وهو مسلم يصف نفس الشبهة بالجهل والتحامل"
            rot={-1}
          />
        )}

        {/* 8. 67.5s - 81.5s: توجيه ألفاظ الحديث */}
        {t >= 67.5 && t < 81.5 && (
          <StatRow
            at={67.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="book-open"
            label="سراج القديم: مجموع الألفاظ يوضح المعنى"
            sub="تقرير الفهم الصحيح لحديث سجود الشمس"
            rot={1}
          />
        )}

        {/* 9. 81.5s - 88.0s: نفي توقف الجريان */}
        {t >= 81.5 && t < 88.0 && (
          <StatRow
            at={81.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="shield-check"
            label="سراج القديم: لا إشارة لتوقف جريانها!"
            sub="سراج وهو مسلم ينسف شبهة سراج الملحد بالدليل"
            rot={-1}
          />
        )}

        {/* 10. 88.0s - 95.5s: وقت التوقف الحقيقي */}
        {t >= 88.0 && t < 95.5 && (
          <StatRow
            at={88.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="clock"
            label="سراج القديم: التوقف خاص بيوم القيامة!"
            sub="بيان وقت التوقف الحقيقي عند طلوع الشمس من مغربها"
            rot={1}
          />
        )}

        {/* 11. 95.5s - 102.5s: كيفية السجود وعدم التوقف */}
        {t >= 95.5 && t < 102.5 && (
          <StatRow
            at={95.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="sun"
            label="سراج القديم: سجودها لا يقتضي توقفها!"
            sub="سجود المخلوقات يليق بها دون تعطيل حركتها وفلكها"
            rot={-1}
          />
        )}

        {/* 12. 102.5s - نهاية الكليب: قفلة الشيخ وسقوط الشبهة */}
        {t >= 102.5 && (
          <StatRow
            at={102.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="smile"
            label="الشيخ: شكل العقل راح لما ألحدت!"
            sub="سراج بعد الإفحام: هذا خارج محل النزاع!"
            rot={1}
          />
        )}
      </div>

      <StreamFooter />
    </AbsoluteFill>
  );
};
