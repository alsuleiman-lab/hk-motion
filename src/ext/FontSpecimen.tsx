import React from "react";
import { AbsoluteFill } from "remotion";
import { FONTS, FontKey, ff, useFonts } from "./fonts";

/** لوحة عيّنات الخطوط الفخمة واليدوية (مرجعية): كل خط باسمه وعبارة مثال. */
export const FONT_SPECIMEN_FRAMES = 60;
const KEYS = Object.keys(FONTS) as FontKey[];

export const FontSpecimen: React.FC = () => {
  useFonts(KEYS);
  return (
    <AbsoluteFill style={{ background: "#f3ece0", padding: "40px 50px", direction: "rtl", display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: 150, columnGap: 40 }}>
      {KEYS.map((k) => (
        <div key={k} style={{ borderBottom: "2px solid #d8ccb6", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: ff(k), fontSize: 66, lineHeight: 1.25, color: "#5a1a22", whiteSpace: "nowrap" }}>بسم الله نبدأ الحكاية</div>
          <div style={{ fontFamily: ff("messiri"), fontSize: 24, color: "#2b6e68" }}>{FONTS[k].label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
