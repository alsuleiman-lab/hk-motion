import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";
import captionsData from "./debate_yameen_captions.json";

export const SHIA_YAMEEN_FPS = 30;
export const SHIA_YAMEEN_TOTAL_FRAMES = 1065; // 35.5s at 30 fps

const THEME = {
  bgGradient: "linear-gradient(180deg, #fdfbf7 0%, #f5efe4 45%, #ece3d3 100%)",
  goldDark: "#9a741e",
  goldPrimary: "#c69214",
  goldLight: "#e9c368",
  goldBorder: "#dfb858",
  charcoal: "#1c1917",
  darkBrown: "#2d2013",
  warmGray: "#57534e",
  redCrimson: "#b91c1c",
  redBorder: "#dc2626",
};

const LIGHT_STAR_PATTERN = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='#c69214' stroke-width='0.8' stroke-opacity='0.15'><path d='M60 6 L72 36 L102 24 L90 54 L120 66 L90 78 L102 108 L72 96 L60 126 L48 96 L18 108 L30 78 L0 66 L30 54 L18 24 L48 36 Z'/><circle cx='60' cy='66' r='16'/></g></svg>`;

export const ShiaYameenDebate: React.FC = () => {
  FONT_TITLE();
  FONT_TEXT();

  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps; // 0 to 35.5s

  // Active Caption Chunk
  const activeChunk = (captionsData as any[]).find((c) => t >= c.start && t <= c.end);

  const headerOpacity = interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: THEME.bgGradient,
        direction: "rtl",
        overflow: "hidden",
        fontFamily: "Noto Kufi Arabic, Almarai, sans-serif",
      }}
    >
      {/* Background Subtle Warm Pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(LIGHT_STAR_PATTERN)}")`,
          backgroundRepeat: "repeat",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      {/* Decorative Outer Border */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `2px solid ${THEME.goldBorder}`,
          borderRadius: 44,
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {/* 1. TOP HEADER BANNER */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 45,
          right: 45,
          display: "flex",
          justifyContent: "center",
          opacity: headerOpacity,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #9a741e 0%, #c69214 50%, #9a741e 100%)",
            color: "#ffffff",
            padding: "8px 28px",
            borderRadius: 999,
            fontSize: 23,
            fontWeight: 800,
            boxShadow: "0 6px 20px rgba(198, 146, 20, 0.35)",
            border: "1.5px solid #fef3c7",
            textAlign: "center",
          }}
        >
          الشيعي يستهزئ بإثبات اليمين • والشيخ يصدمه من مرآة العقول!
        </div>
      </div>

      {/* 2. TOP SECTION: THE TWO DEBATERS SIDE BY SIDE (NATURAL FRAMING, ZERO OVER-ZOOM) */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 45,
          right: 45,
          height: 400,
          zIndex: 20,
        }}
      >
        {/* RIGHT BOX: SHEIKH MUHAMMAD BIN SHAMS AL-DIN */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 485,
            height: 400,
          }}
        >
          {/* Floating Badge above Sheikh Muhammad */}
          <div
            style={{
              position: "absolute",
              top: -42,
              right: 0,
              left: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #991b1b 0%, #b91c1c 100%)",
                color: "#ffffff",
                padding: "6px 20px",
                borderRadius: 999,
                fontSize: 19,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1.5px solid rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              ● الشيخ محمد بن شمس الدين
            </div>
          </div>

          {/* Video Container for Sheikh: Natural medium framing */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 10px 28px rgba(45, 32, 19, 0.14)",
              border: `3px solid ${THEME.redBorder}`,
              backgroundColor: "#000",
            }}
          >
            <OffthreadVideo
              src={staticFile("debate_yameen_cut.mp4")}
              style={{
                position: "absolute",
                left: -978,
                top: -49,
                width: 1707,
                height: 960,
                maxWidth: "none",
              }}
            />
          </div>
        </div>

        {/* LEFT BOX: HASSAN ALLAHYARI (THE SHIA DEBATER) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 485,
            height: 400,
          }}
        >
          {/* Floating Badge above Allahyari */}
          <div
            style={{
              position: "absolute",
              top: -42,
              right: 0,
              left: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #1c1917 0%, #44403c 100%)",
                color: "#ffffff",
                padding: "6px 20px",
                borderRadius: 999,
                fontSize: 19,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              ● حسن اللهياري (المناظر الشيعي)
            </div>
          </div>

          {/* Video Container for Allahyari: Natural framing */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 10px 28px rgba(45, 32, 19, 0.14)",
              border: `3px solid ${THEME.goldDark}`,
              backgroundColor: "#000",
            }}
          >
            <OffthreadVideo
              src={staticFile("debate_yameen_cut.mp4")}
              style={{
                position: "absolute",
                left: -951,
                top: -551,
                width: 1873,
                height: 1054,
                maxWidth: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SUBTITLE / KARAOKE AREA */}
      <div
        style={{
          position: "absolute",
          top: 552,
          left: 45,
          right: 45,
          height: 85,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 35,
        }}
      >
        {activeChunk && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(12px)",
              border: `2px solid ${THEME.goldBorder}`,
              borderRadius: 20,
              padding: "10px 28px",
              boxShadow: "0 8px 24px rgba(45, 32, 19, 0.12)",
              textAlign: "center",
              maxWidth: 960,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: THEME.charcoal,
                lineHeight: 1.4,
              }}
            >
              {activeChunk.words.map((w: any, idx: number) => {
                const isWordActive = t >= w.start && t <= w.end;
                return (
                  <span
                    key={idx}
                    style={{
                      color: isWordActive ? THEME.redCrimson : THEME.charcoal,
                      backgroundColor: isWordActive ? "rgba(254, 226, 226, 0.7)" : "transparent",
                      padding: "2px 6px",
                      borderRadius: 6,
                      display: "inline-block",
                      marginLeft: 3,
                    }}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM SECTION: THE REAL SOURCE DOCUMENT (المصدر تحت - عريض وواضح) */}
      <div
        style={{
          position: "absolute",
          top: 695,
          left: 45,
          right: 45,
          height: 1130,
          zIndex: 20,
        }}
      >
        {/* Floating Source Document Badge */}
        <div
          style={{
            position: "absolute",
            top: -42,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(90deg, #9a741e 0%, #c69214 100%)",
              color: "#ffffff",
              padding: "6px 22px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 800,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1.5px solid rgba(255,255,255,0.4)",
            }}
          >
            📖 وثيقة المصدر من شاشة البث الحية
          </div>

          <div
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "4px 18px",
              borderRadius: 999,
              fontSize: 17,
              fontWeight: 800,
              border: "1px solid rgba(217, 119, 6, 0.2)",
            }}
          >
            مرآة العقول للمجلسي (ج9 ص33)
          </div>
        </div>

        {/* Document Box: The actual page zoomed legibly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(45, 32, 19, 0.16)",
            border: `3.5px solid ${THEME.goldBorder}`,
            backgroundColor: "#ffffff",
          }}
        >
          <OffthreadVideo
            src={staticFile("debate_yameen_cut.mp4")}
            style={{
              position: "absolute",
              left: -98,
              top: -98,
              width: 2679,
              height: 1507,
              maxWidth: "none",
            }}
          />
        </div>
      </div>

      {/* 5. FOOTER BADGE */}
      <div
        style={{
          position: "absolute",
          bottom: 25,
          left: 45,
          right: 45,
          display: "flex",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            border: `1.5px solid ${THEME.goldBorder}`,
            padding: "7px 24px",
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
            color: THEME.warmGray,
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          كتب الشيعة تثبت ما ينفونه • المصدر معروض مباشرة من البث
        </div>
      </div>
    </AbsoluteFill>
  );
};

