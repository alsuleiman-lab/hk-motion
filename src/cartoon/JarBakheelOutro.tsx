import React from "react";
import { Img, staticFile } from "remotion";
import { FONT_TITLE } from "../localFonts";

export interface OutroProps {
  frame: number;
}

export const JarBakheelOutro: React.FC<OutroProps> = ({ frame }) => {
  const bellRing = Math.sin(frame * 0.6) * 16;
  const bounce = Math.sin(frame * 0.15) * 6;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 220,
      }}
    >
      {/* Both Neighbors Side-by-Side Waving */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 40,
          marginBottom: 40,
        }}
      >
        {/* Neighbor (Blue Shirt) Waving */}
        <div style={{ transform: `scale(1.1) translateY(${bounce}px)` }}>
          <Img
            src={staticFile("jar_bakheel/hands_up.png")}
            style={{ width: 280, height: 215, objectFit: "contain" }}
          />
        </div>

        {/* Miser (Olive Shirt) Waving */}
        <div style={{ transform: `scale(1.1) scaleX(-1) translateY(${-bounce}px)` }}>
          <Img
            src={staticFile("jar_bakheel/miser_hands_up.png")}
            style={{ width: 280, height: 215, objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Subscribe & Like Card */}
      <div
        style={{
          width: 820,
          background: "#ffffff",
          borderRadius: 36,
          border: "6px solid #0f172a",
          padding: "24px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 18px 36px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: FONT_TITLE(),
            fontSize: 42,
            fontWeight: 900,
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          طرفة لجار مع جاره البخيل ✨
        </div>

        {/* Buttons Row */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {/* Subscribe Button */}
          <div
            style={{
              background: "#dc2626",
              color: "#ffffff",
              padding: "14px 36px",
              borderRadius: 30,
              fontFamily: FONT_TITLE(),
              fontSize: 32,
              fontWeight: 800,
              border: "4px solid #991b1b",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 6px 16px rgba(220,38,38,0.4)",
            }}
          >
            <span style={{ fontSize: 34 }}>▶️</span>
            <span>اشترك في القناة</span>
          </div>

          {/* Like Button */}
          <div
            style={{
              background: "#0284c7",
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: 30,
              fontFamily: FONT_TITLE(),
              fontSize: 32,
              fontWeight: 800,
              border: "4px solid #0369a1",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 6px 16px rgba(2,132,199,0.4)",
            }}
          >
            <span style={{ fontSize: 34 }}>👍</span>
            <span>إعجاب</span>
          </div>

          {/* Bell Icon */}
          <div
            style={{
              transform: `rotate(${bellRing}deg)`,
              fontSize: 46,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            }}
          >
            🔔
          </div>
        </div>
      </div>
    </div>
  );
};

