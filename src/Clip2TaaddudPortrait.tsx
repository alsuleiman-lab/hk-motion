import { StatRow } from "./EuKit";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import { StreamFooter } from "./StreamFooter";
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
export const CLIP2_FPS = 30;
export const CLIP2_SECONDS = 70.2;
export const CLIP2_FRAMES = Math.ceil(CLIP2_SECONDS * CLIP2_FPS); // 2922 frames

const fps = CLIP2_FPS;
const fontTitle = "Noto Kufi Arabic, sans-serif";
const fontText = "Almarai, sans-serif";

const C = {
  white: "#ffffff",
  gold: "#f5c542",
  yellow: "#ffd152",
  green: "#2e7d32",
  emerald: "#10b981",
  red: "#d32f2f",
  navy: "#0a192f",
  darkBlue: "#112240",
  ink: "#0f172a",
};


export const Clip2TaaddudPortrait: React.FC = () => {
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
              width: 380,
              height: 460,
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
          طرفة عفوية من البث المباشر 💬
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 16,
          }}
        >
          طرفة التعدد ومصادر الدخل
          <br />
          <span style={{ color: "#ffd152" }}>«تعدد مصادر دخلك.. التعدد زين!»</span>
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
      {/* FULL FRAME SHEIKH VIDEO: Fills 100% of the screen */}
      <OffthreadVideo
        src={staticFile("stream_clip2_taaddud_clean.mp4")}
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

      {/* Bottom gradient for paper cards & footer legibility and stream banner cover */}
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

      {/* TOP HEADER: Badge */}
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
            {t < 41.5 ? "💍" : "💼"}
          </span>
          <span
            style={{
              fontFamily: fontTitle,
              fontSize: 46,
              color: C.gold,
              letterSpacing: 1,
            }}
          >
            {t < 2.5
              ? "سؤال متابع: مو ناوي تعدد؟"
              : t < 9.6
              ? "الشيخ: إيش دخل التعدد بالموضوع؟"
              : t < 13.2
              ? "ليش تنامون برة؟ الأمر عادي!"
              : t < 22.4
              ? "الشيخ: اللي ما يعدد غلطان!"
              : t < 32.0
              ? "اللي ما يعدد ما يفهم!"
              : t < 41.5
              ? "زوجتك ستحبك أكثر إذا عددت..."
              : t < 60.4
              ? "لا بد بالضرورة أن تعدد مصادر دخلك!"
              : t < 65.0
              ? "التعدد زين.. نحتاج إلى التعدد!"
              : "طرفة ختام البث المباشر"}
          </span>
        </div>
      </div>

      {/* LOWER SECTION: Dynamic Phrase-by-Phrase Montage Cards */}
      <div style={{ position: "absolute", top: 1420, left: 50, width: 980, height: 380, zIndex: 30 }}>
        {/* 1. 0.0s - 2.5s: سؤال المتابع */}
        {t >= 0.0 && t < 2.5 && (
          <StatRow
            at={0.0}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="help-circle"
            label="سؤال متابع: مو ناوي تعدد؟"
            sub="طرفة عفوية من أسئلة المتابعين في البث"
            rot={-1}
          />
        )}

        {/* 2. 2.5s - 9.6s: تعجب الشيخ */}
        {t >= 2.5 && t < 9.6 && (
          <StatRow
            at={2.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="alert-circle"
            label="إيش دخل الموضوع؟!"
            sub="نحكي عن شبهات الملاحدة.. فجاء سؤال التعدد!"
            rot={1}
          />
        )}

        {/* 3. 9.6s - 13.2s: ليش تنامون برة؟ */}
        {t >= 9.6 && t < 13.2 && (
          <StatRow
            at={9.6}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="shield"
            label="ليش تنامون برة؟ الأمر عادي!"
            sub="مشان سؤال التعدد تنامون في الشارع؟"
            rot={-1}
          />
        )}

        {/* 4. 13.2s - 18.0s: اللي ما يعدد غلطان */}
        {t >= 13.2 && t < 18.0 && (
          <StatRow
            at={13.2}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="check-circle"
            label="صراحة: اللي ما يعدد غلطان!"
            sub="أنا أقولها بصراحة دون أي تردد"
            rot={1}
          />
        )}

        {/* 5. 18.0s - 22.4s: أحب التعدد وأدعو إليه */}
        {t >= 18.0 && t < 22.4 && (
          <StatRow
            at={18.0}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="heart"
            label="أحب التعدد.. وأدعو للتعدد!"
            sub="أنا واحد من الناس أحب التعدد وأشجع عليه"
            rot={-1}
          />
        )}

        {/* 6. 22.4s - 32.0s: اللي ما يعدد ما يفهم */}
        {t >= 22.4 && t < 32.0 && (
          <StatRow
            at={22.4}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="zap"
            label="اللي ما يعدد ما يفهم!"
            sub="صراحة أقولها: لا يدرك تبعات الواقع"
            rot={1}
          />
        )}

        {/* 7. 32.0s - 41.5s: زوجتك ستحبك أكثر إذا عددت! */}
        {t >= 32.0 && t < 41.5 && (
          <StatRow
            at={32.0}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="smile"
            label="زوجتك ستحبك أكثر إذا عددت!"
            sub="وستحترمك أكثر.. وستعتبرك رجلاً أكثر إذا عددت!"
            rot={-1}
          />
        )}

        {/* 8. 41.5s - 45.0s: المفاجأة: تعدد مصادر دخلك! */}
        {t >= 41.5 && t < 45.0 && (
          <StatRow
            at={41.5}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="coins"
            label="لا بد أن تعدد مصادر دخلك!"
            sub="هذا هو التعدد الحقيقي الضروري في واقعنا!"
            rot={1}
          />
        )}

        {/* 9. 45.0s - 51.2s: خطر مصدر الدخل الواحد */}
        {t >= 45.0 && t < 51.2 && (
          <StatRow
            at={45.0}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="alert-triangle"
            label="مصدر دخل واحد = خطر كبير!"
            sub="إذا طرت من عملك ستبقى بدون مال إطلاقاً"
            rot={-1}
          />
        )}

        {/* 10. 51.2s - 56.5s: المعدد مصادر دخله متعددة */}
        {t >= 51.2 && t < 56.5 && (
          <StatRow
            at={51.2}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="trending-up"
            label="أما المعدد: مصدر أول وثانٍ وثالث"
            sub="توزيع مصادر الدخل يمنحك الأمان المالي"
            rot={1}
          />
        )}

        {/* 11. 56.5s - 60.4s: فشلت في واحد عندك ثان وثالث */}
        {t >= 56.5 && t < 60.4 && (
          <StatRow
            at={56.5}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="shield-check"
            label="فشلت في واحد؟ عندك ثانٍ وثالث!"
            sub="لا تسقط أبداً إذا تنوعت مداخيلك"
            rot={-1}
          />
        )}

        {/* 12. 60.4s - 65.0s: التعدد زين يا جماعة */}
        {t >= 60.4 && t < 65.0 && (
          <StatRow
            at={60.4}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="thumbs-up"
            label="التعدد زين يا جماعة!"
            sub="نحن في زمن نحتاج فيه إلى التعدد المالي"
            rot={1}
          />
        )}

        {/* 13. 65.0s - نهاية الكليب: طلعتونا عن الموضوع */}
        {t >= 65.0 && (
          <StatRow
            at={65.0}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="laugh"
            label="طلعتونا عن الموضوع.. خلونا نرجع!"
            sub="الشيخ يضحك ويعود لموضوع البث الأساسي"
            rot={-1}
          />
        )}
      </div>

      <StreamFooter />
    </AbsoluteFill>
  );
};
