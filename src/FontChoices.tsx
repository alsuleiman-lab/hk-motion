import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as f1 } from "@remotion/google-fonts/Lalezar";
import { loadFont as f2 } from "@remotion/google-fonts/ReemKufi";
import { loadFont as f3 } from "@remotion/google-fonts/ElMessiri";
import { loadFont as f4 } from "@remotion/google-fonts/Changa";
import { loadFont as f5 } from "@remotion/google-fonts/Katibeh";
import { loadFont as f6 } from "@remotion/google-fonts/Lemonada";
import { loadFont as f7 } from "@remotion/google-fonts/Kufam";
import { loadFont as f8 } from "@remotion/google-fonts/ArefRuqaa";
import { loadFont as f9 } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as f10 } from "@remotion/google-fonts/Cairo";

/** Title-font candidates for future videos (same look as the current title style: cream fill, brown outline). */
const fonts = [
  ["لالزار", f1("normal", { weights: ["400"], subsets: ["arabic"] })],
  ["ريم كوفي", f2("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["المسيري", f3("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["چانغا", f4("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["كاتبة", f5("normal", { weights: ["400"], subsets: ["arabic"] })],
  ["ليمونادا", f6("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["كوفام", f7("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["عارف رقعة", f8("normal", { weights: ["700"], subsets: ["arabic"] })],
  ["نوتو كوفي", f9("normal", { weights: ["800"], subsets: ["arabic"] })],
  ["القاهرة (أسود)", f10("normal", { weights: ["900"], subsets: ["arabic"] })],
] as const;

export const FontChoices: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(135deg,#24456e,#2f5f94 48%,#6b4630)", direction: "rtl", padding: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "1fr", gap: 20 }}>
    {fonts.map(([name, f], i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, background: "rgba(0,0,0,.18)", borderRadius: 24, padding: "10px 24px" }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: "#e8ae2c", color: "#3a2412", fontSize: 44, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: f.fontFamily, fontSize: 66, lineHeight: 1.3, whiteSpace: "nowrap", color: "#f6ecd3", paintOrder: "stroke fill", WebkitTextStroke: "10px #4a2f1d", textShadow: "0 6px 16px rgba(0,0,0,.45)" }}>قانون اللباس المدرسي</div>
          <div style={{ fontFamily: f.fontFamily, fontSize: 30, color: "#f6ecd3" }}>١٢٣ ٤٥٦ — {name}</div>
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
