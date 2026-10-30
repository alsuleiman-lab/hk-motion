import React from "react";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";

export const LessonFooter: React.FC<{
  lessonName?: string;
  date?: string;
  topic?: string;
}> = ({
  lessonName = "شرح جامع الترمذي — المجلس 29",
  date = "18 جمادى الأولى 1448 هـ • 29/10/2026 م",
  topic,
}) => {
  FONT_TITLE();
  FONT_TEXT();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 30,
        right: 30,
        height: 74,
        background: "linear-gradient(135deg, rgba(15, 30, 55, 0.96) 0%, rgba(10, 25, 47, 0.98) 100%)",
        border: "2px solid rgba(245, 197, 66, 0.6)",
        borderRadius: 22,
        padding: "0 24px",
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        direction: "rtl",
        zIndex: 50,
        whiteSpace: "nowrap",
      }}
    >
      {/* Right side: Lesson Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>📖</span>
        <span
          style={{
            fontFamily: "Noto Kufi Arabic, sans-serif",
            fontSize: 23,
            fontWeight: 800,
            color: "#f5c542",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {lessonName}
        </span>
      </div>

      {/* Left side: Date Badge */}
      <div
        style={{
          fontFamily: "Almarai, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "#e2e8f0",
          background: "rgba(255, 255, 255, 0.08)",
          padding: "5px 16px",
          borderRadius: 999,
          border: "1px solid rgba(245, 197, 66, 0.3)",
        }}
      >
        {date}
      </div>
    </div>
  );
};

