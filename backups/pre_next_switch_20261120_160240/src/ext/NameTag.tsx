import React from "react";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const KUFI = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] }).fontFamily;
const INTER = loadInter("normal", { weights: ["600"], subsets: ["latin"] }).fontFamily;

/**
 * بطاقة الاسم الثنائية: الاسم بالعربية فوق، وبالحروف اللاتينية تحته، بتهجئة موحّدة ثابتة طوال الفيديو.
 * هي النص الوحيد المسموح في الموشن التوضيحي (مع الأرقام والتواريخ)، فتُقرأ بكل اللغات مهما تُرجم الصوت.
 * الأحجام: العربي 64 بكسل واللاتيني 42 بكسل عند ارتفاع 1080 (للقراءة على الجوال)؛ `scale` يضرب الاثنين.
 * `data-qa` لفحص التخطيط الآلي (الاسم لا يُقصّ ولا يتداخل).
 */
export const NameTag: React.FC<{
  ar: string;
  lat: string;
  id?: string;
  scale?: number;
  accent?: string;
  ink?: string;
  panel?: string;
  align?: "center" | "start";
  /** بطاقة على هيئة لفافة رق (للخرائط التاريخية) */
  scroll?: boolean;
  /** خطّا العربي واللاتيني (للطابع التاريخي: Amiri وIM Fell) */
  famAr?: string;
  famLat?: string;
  style?: React.CSSProperties;
}> = ({ ar, lat, id, scale = 1, accent = "#e0a93b", ink = "#f4efe4", panel = "rgba(10,20,36,0.86)", align = "center", scroll, famAr, famLat, style }) => (
  <div
    data-qa={id ?? ar}
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: 6 * scale,
      padding: `${18 * scale}px ${34 * scale}px ${20 * scale}px`,
      position: "relative",
      background: scroll ? "linear-gradient(180deg,#f8edcf 0%,#efdcaa 55%,#e6cd92 100%)" : panel,
      borderRadius: (scroll ? 10 : 22) * scale,
      border: scroll ? `${3 * scale}px solid #8a6a3b` : undefined,
      borderBottom: scroll ? `${3 * scale}px solid #8a6a3b` : `${6 * scale}px solid ${accent}`,
      boxShadow: scroll ? "inset 0 0 22px rgba(160,120,50,0.28), 0 10px 24px rgba(90,64,37,0.3)" : "0 12px 30px rgba(31,53,80,0.28)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {scroll && [-1, 1].map((sd) => (
      <span key={sd} style={{ position: "absolute", top: -9 * scale, bottom: -9 * scale, [sd < 0 ? "left" : "right"]: -17 * scale, width: 30 * scale, borderRadius: 15 * scale, background: "linear-gradient(90deg,#cfa95d,#f0dca6 45%,#c79e52)", border: `${3 * scale}px solid #8a6a3b`, boxShadow: "0 4px 10px rgba(90,64,37,0.3)" } as React.CSSProperties} />
    ))}
    {scroll && <span style={{ position: "absolute", left: 22 * scale, right: 22 * scale, bottom: 9 * scale, height: 4 * scale, background: accent, borderRadius: 2 * scale, opacity: 0.9 }} />}
    <span style={{ fontFamily: famAr ?? KUFI, fontWeight: famAr ? 700 : 800, fontSize: 64 * scale, lineHeight: 1.25, color: ink, direction: "rtl" }}>{ar}</span>
    <span style={{ fontFamily: famLat ?? INTER, fontWeight: famLat ? 400 : 600, fontSize: (famLat ? 46 : 42) * scale, lineHeight: 1.2, color: accent, direction: "ltr", letterSpacing: 0.5 }}>{lat}</span>
  </div>
);

export { KUFI as NAME_FONT_AR, INTER as NAME_FONT_LAT };
