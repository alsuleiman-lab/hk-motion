import { StatRow } from "./EuKit";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import { StreamFooter } from "./StreamFooter";
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

export const CLIP4_FPS = 30;
export const CLIP4_SECONDS = 35.3;
export const CLIP4_FRAMES = Math.ceil(CLIP4_SECONDS * CLIP4_FPS); // 1059 frames

const fps = CLIP4_FPS;
const fontTitle = "Noto Kufi Arabic, sans-serif";
const fontText = "Almarai, sans-serif";

const C = {
  white: "#ffffff",
  gold: "#f5c542",
  yellow: "#ffd152",
  blue: "#2563eb",
  navy: "#0a192f",
  darkBlue: "#112240",
  ink: "#0f172a",
};

export const Clip4ThronePortrait: React.FC = () => {
  FONT_TITLE();
  FONT_TEXT();
  const f = useCurrentFrame();
  const t = f / fps;

  // Cover in first 3 frames (0.10s) - Real photo of the Sheikh
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
        {/* Sheikh Photo Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 420,
              height: 480,
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
              marginTop: 14,
              background: "rgba(10, 25, 47, 0.95)",
              border: "2px solid #f5c542",
              borderRadius: 999,
              padding: "6px 24px",
              fontFamily: fontTitle,
              fontSize: 24,
              fontWeight: 800,
              color: "#f5c542",
            }}
          >
            الشيخ محمد بن شمس الدين
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
          فوائد عقدية من البث 📜
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 16,
          }}
        >
          المخلوق الوحيد فوق العرش
          <br />
          <span style={{ color: "#ffd152" }}>«كتاب: إن رحمتي سبقت غضبي»</span>
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
      {/* FULL FRAME SHEIKH VIDEO: Fills 100% of the screen (Silences fully cut) */}
      <OffthreadVideo
        src={staticFile("stream_clip4_clean.mp4")}
        style={{
          position: "absolute",
          top: 0,
          left: -1166,
          width: 3413,
          height: 1920,
          maxWidth: "none",
        }}
      />

      {/* Top subtle vignette for header badge contrast */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background: "linear-gradient(to bottom, rgba(10, 25, 47, 0.75) 0%, rgba(10, 25, 47, 0.3) 60%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Bottom gradient for paper cards & footer legibility */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 820,
          background: "linear-gradient(to bottom, transparent 0%, rgba(10, 25, 47, 0.25) 25%, rgba(10, 25, 47, 0.82) 58%, rgba(10, 25, 47, 0.97) 82%, #0a192f 100%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* TOP HEADER */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: "rgba(10, 25, 47, 0.92)",
            border: `3px solid ${C.gold}`,
            borderRadius: 999,
            padding: "10px 42px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 36 }}>
            {t < 3.7 ? "📜" : t < 10.8 ? "📖" : t < 17.5 ? "🌟" : t < 27.0 ? "👑" : "☀️"}
          </span>
          <span
            style={{
              fontFamily: fontTitle,
              fontSize: 42,
              color: C.gold,
              letterSpacing: 1,
            }}
          >
            {t < 3.7
              ? "سؤال: ما هو المخلوق فوق العرش؟"
              : t < 10.8
              ? "كتاب: «إن رحمتي سبقت غضبي»"
              : t < 17.5
              ? "مخلوق آخر يوم القيامة؟"
              : t < 27.0
              ? "سيدنا محمد ﷺ صاحب المقام المحمود"
              : "الشمس ومخلوقات الكون تحت العرش"}
          </span>
        </div>
      </div>

      {/* LOWER SECTION: Dynamic Phrase-by-Phrase Montage Cards */}
      <div style={{ position: "absolute", top: 1420, left: 50, width: 980, height: 380, zIndex: 30 }}>
        {/* 1. 0.0s - 3.7s: ما في مخلوق فوق العرش إلا واحد */}
        {t >= 0.0 && t < 3.7 && (
          <StatRow
            at={0.0}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="help-circle"
            label="ما في مخلوق فوق العرش إلا واحد!"
            sub="الشيخ يطرح سؤالاً عقدياً دقيقاً على المتابعين في البث"
            rot={-1}
          />
        )}

        {/* 2. 3.7s - 10.8s: كتب كتاباً فهو عنده فوق العرش */}
        {t >= 3.7 && t < 10.8 && (
          <StatRow
            at={3.7}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="book-open"
            label="الحديث: كتب كتاباً فهو عنده فوق العرش"
            sub="«إن رحمتي سبقت غضبي» - المخلوق الوحيد فوق العرش حالياً"
            rot={1}
          />
        )}

        {/* 3. 10.8s - 17.5s: مخلوق آخر يوم القيامة */}
        {t >= 10.8 && t < 17.5 && (
          <StatRow
            at={10.8}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="alert-circle"
            label="ويوم القيامة سيكون مخلوق آخر.. من هو؟"
            sub="سدرة المنتهى تحت العرش، فمن هو المخلوق الموعود؟"
            rot={-1}
          />
        )}

        {/* 4. 17.5s - 27.0s: سيدنا محمد ﷺ يجلسه الله على العرش */}
        {t >= 17.5 && t < 27.0 && (
          <StatRow
            at={17.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="star"
            label="سيدنا محمد ﷺ يجلسه الله على العرش"
            sub="المقام المحمود الخاص بالنبي عليه الصلاة والسلام يوم القيامة"
            rot={1}
          />
        )}

        {/* 5. 27.0s - نهاية الكليب: الشمس وسائر الخلق تحت العرش */}
        {t >= 27.0 && (
          <StatRow
            at={27.0}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="sun"
            label="الشمس وسائر الكون تحت العرش"
            sub="العرش أعظم المخلوقات وسقفها، وسائر الخلق تحت العرش دائماً"
            rot={-1}
          />
        )}
      </div>

      <StreamFooter />
    </AbsoluteFill>
  );
};
