import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadRakkas } from "@remotion/google-fonts/Rakkas";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { cairo } from "./Scenes";
import { lalezar } from "./RefStyle";
import { hijri, gregorian } from "./TitleBar";

/**
 * Gallery: 10 alternative designs for the standing info box (title + timer + Hijri/Gregorian date + "no cropping" notice).
 * Every design is drawn 1:1 (real size, ~330x120 px on a 1920x1080 frame) over a real frame of the video, in the bottom-right corner.
 */
const { fontFamily: rakkas } = loadRakkas("normal", { weights: ["400"], subsets: ["arabic", "latin"] });
void rakkas;
const { fontFamily: amiri } = loadAmiri("normal", { weights: ["400", "700"], subsets: ["arabic"] });
const TITLE = "شبهات أحمد زايد على أسانيد السنة";
const CLOCK = "00:06:23";
const DATE = "2026-10-15";
const NOTICE = "يمنع اقتصاص الفيديو دون عرض العداد";
const H = hijri(DATE);
const G = gregorian(DATE);

const STAR = `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 140 140'><g fill='none' stroke='#f3e3c0' stroke-width='3'><path d='M70 8 L84 40 L116 26 L102 58 L134 70 L102 82 L116 114 L84 100 L70 132 L56 100 L24 114 L38 82 L6 70 L38 58 L24 26 L56 40 Z'/></g></svg>`;
const starUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(STAR)}")`;
const grain = `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/><feColorMatrix values='0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .1 0 0 0 .35 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`;
const wood = `repeating-linear-gradient(92deg, rgba(0,0,0,.07) 0 3px, rgba(255,255,255,.04) 3px 7px), linear-gradient(135deg,#a9743f,#8a5a2e 55%,#a06b38)`;

type P = { children?: React.ReactNode };
const Box: React.FC<{ style: React.CSSProperties } & P> = ({ style, children }) => (
  <div style={{ position: "absolute", right: 34, bottom: 24, direction: "rtl", ...style }}>{children}</div>
);
const tick = { fontFamily: amiri, fontWeight: 700, fontSize: 11 } as const;

// 1 — glass + gold side bar + timer pill
const V1 = () => (
  <Box style={{ width: 340, display: "flex", background: "rgba(14,28,60,.55)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,.35)", borderRadius: 16, overflow: "hidden" }}>
    <div style={{ width: 8, background: "linear-gradient(#f3d37a,#c9902a)" }} />
    <div style={{ flex: 1, padding: "7px 12px 5px" }}>
      <div style={{ fontFamily: lalezar, fontSize: 20, color: "#fff", textAlign: "center", lineHeight: 1.1 }}>{TITLE}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ background: "linear-gradient(#f3d37a,#d79a2a)", color: "#3b2616", fontFamily: cairo, fontWeight: 900, fontSize: 26, padding: "0 12px", borderRadius: 10, direction: "ltr" }}>{CLOCK}</div>
        <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
      </div>
      <div style={{ ...tick, color: "#ffe9d8", textAlign: "center", marginTop: 2 }}>{NOTICE}</div>
    </div>
  </Box>
);

// 2 — carved wood plaque with brass border
const V2 = () => (
  <Box style={{ width: 340, background: `${grain}, ${wood}`, border: "3px solid #d9b45a", borderRadius: 10, boxShadow: "0 8px 20px rgba(40,25,10,.55), inset 0 0 0 3px #6b4630", padding: "7px 12px 5px" }}>
    <div style={{ fontFamily: amiri, fontWeight: 700, fontSize: 23, color: "#fff4d6", textAlign: "center", lineHeight: 1.1, textShadow: "0 2px 0 rgba(60,35,15,.8)" }}>{TITLE}</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 27, color: "#ffe9a8", direction: "ltr", textShadow: "0 2px 0 rgba(60,35,15,.8)" }}>{CLOCK}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 13, color: "#fff4d6", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#f3dcae", textAlign: "center" }}>{NOTICE}</div>
  </Box>
);

// 3 — navy glass with Islamic star watermark and gold hairline
const V3 = () => (
  <Box style={{ width: 340, background: `${starUri} right 6px center / 72px no-repeat, rgba(20,45,92,.62)`, backdropFilter: "blur(10px)", border: "1.5px solid #e0bb62", borderRadius: 14, padding: "7px 14px 5px", boxShadow: "0 0 0 3px rgba(224,187,98,.25)" }}>
    <div style={{ fontFamily: lalezar, fontSize: 19, color: "#fff", lineHeight: 1.1, paddingRight: 78 }}>{TITLE}</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingRight: 78 }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 26, color: "#ffe3a0", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 12, color: "#fff", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#ffe9d8", textAlign: "center", marginTop: 1 }}>{NOTICE}</div>
  </Box>
);

// 4 — circular ring timer on the right, title and dates on the left
const V4 = () => (
  <Box style={{ width: 400, display: "flex", alignItems: "center", gap: 10, background: "rgba(40,24,12,.55)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 60, padding: "8px 14px 8px 18px" }}>
    <div style={{ position: "relative", width: 92, height: 92, flex: "none" }}>
      <svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="7" /><circle cx="46" cy="46" r="40" fill="none" stroke="#e8ae2c" strokeWidth="7" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="100" transform="rotate(-90 46 46)" /></svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: cairo, fontWeight: 900, fontSize: 19, color: "#ffe3a0", direction: "ltr" }}>{CLOCK}</div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: lalezar, fontSize: 18, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap" }}>{TITLE}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 12, color: "#f3dcae", marginTop: 2, whiteSpace: "nowrap" }}>{H} • {G}</div>
      <div style={{ ...tick, color: "#ffe9d8" }}>{NOTICE}</div>
    </div>
  </Box>
);

// 5 — minimal, no box: text on a soft shadow with a gold rule
const V5 = () => (
  <Box style={{ width: 360, textAlign: "right", textShadow: "0 2px 8px rgba(40,20,5,.85), 0 0 18px rgba(40,20,5,.6)" }}>
    <div style={{ fontFamily: lalezar, fontSize: 25, color: "#fff", lineHeight: 1.1 }}>{TITLE}</div>
    <div style={{ height: 3, background: "linear-gradient(270deg,#f3d37a,rgba(243,211,122,0))", margin: "3px 0" }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 34, color: "#ffe9a8", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#fff", textAlign: "center" }}>{NOTICE}</div>
  </Box>
);

// 6 — ribbon banner title with folded ends + cream tag below
const V6 = () => (
  <Box style={{ width: 350 }}>
    <div style={{ position: "relative", background: "linear-gradient(#8a4a2a,#6b3a1e)", color: "#fff4d6", fontFamily: lalezar, fontSize: 20, textAlign: "center", padding: "4px 16px", borderRadius: 4, boxShadow: "0 5px 12px rgba(40,20,5,.5)", clipPath: "polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)" }}>{TITLE}</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f6ecd3", border: "2px solid #7a4b2a", borderRadius: 10, margin: "4px 12px 0", padding: "3px 12px", boxShadow: "0 5px 12px rgba(40,20,5,.4)" }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 24, color: "#7a3a1c", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 12, color: "#4a2f1d", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#fff", textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,.9)", marginTop: 2 }}>{NOTICE}</div>
  </Box>
);

// 7 — mihrab (arch) card
const V7 = () => (
  <Box style={{ width: 300, background: "linear-gradient(180deg,rgba(36,69,110,.85),rgba(24,46,82,.85))", border: "2.5px solid #e0bb62", borderRadius: "70px 70px 14px 14px", padding: "9px 14px 5px", textAlign: "center", boxShadow: "0 8px 18px rgba(0,0,0,.4)" }}>
    <div style={{ fontFamily: lalezar, fontSize: 18, color: "#fff", lineHeight: 1.1 }}>{TITLE}</div>
    <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 28, color: "#ffe3a0", direction: "ltr", lineHeight: 1.1 }}>{CLOCK}</div>
    <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 12, color: "#fff" }}>{H} • {G}</div>
    <div style={{ ...tick, color: "#ffe9d8" }}>{NOTICE}</div>
  </Box>
);

// 8 — cream paper card with ink text and a wax-stamp date
const V8 = () => (
  <Box style={{ width: 340, background: `${grain}, #f3e6c8`, border: "2px solid #7a4b2a", borderRadius: 8, padding: "6px 12px 4px", boxShadow: "0 8px 16px rgba(40,20,5,.45)", transform: "rotate(-1.2deg)" }}>
    <div style={{ fontFamily: amiri, fontWeight: 700, fontSize: 22, color: "#4a2f1d", textAlign: "center", lineHeight: 1.1 }}>{TITLE}</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 26, color: "#8a2f1d", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ border: "2px solid #a63a24", borderRadius: 8, padding: "1px 8px", fontFamily: cairo, fontWeight: 800, fontSize: 12, color: "#a63a24", lineHeight: 1.2, textAlign: "center", transform: "rotate(-3deg)" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#6b4630", textAlign: "center" }}>{NOTICE}</div>
  </Box>
);

// 9 — split bar: blue timer block + brown title block
const V9 = () => (
  <Box style={{ width: 380 }}>
    <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,.7)", boxShadow: "0 6px 14px rgba(0,0,0,.4)" }}>
      <div style={{ background: "linear-gradient(#2f5f94,#24456e)", padding: "6px 12px", display: "flex", alignItems: "center", fontFamily: cairo, fontWeight: 900, fontSize: 27, color: "#ffe3a0", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ flex: 1, background: "linear-gradient(#8a5a2e,#6b4630)", padding: "5px 10px" }}>
        <div style={{ fontFamily: lalezar, fontSize: 17, color: "#fff4d6", lineHeight: 1.1, whiteSpace: "nowrap" }}>{TITLE}</div>
        <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 11, color: "#f3dcae", whiteSpace: "nowrap" }}>{H} • {G}</div>
      </div>
    </div>
    <div style={{ ...tick, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.9)", textAlign: "center", marginTop: 2 }}>{NOTICE}</div>
  </Box>
);

// 10 — glass with gold corner brackets
const Corner: React.FC<{ s: React.CSSProperties }> = ({ s }) => <div style={{ position: "absolute", width: 16, height: 16, borderColor: "#f3d37a", borderStyle: "solid", borderWidth: 0, ...s }} />;
const V10 = () => (
  <Box style={{ width: 340, background: "rgba(16,34,70,.58)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "8px 16px 6px" }}>
    <Corner s={{ top: -3, right: -3, borderTopWidth: 3, borderRightWidth: 3 }} />
    <Corner s={{ top: -3, left: -3, borderTopWidth: 3, borderLeftWidth: 3 }} />
    <Corner s={{ bottom: -3, right: -3, borderBottomWidth: 3, borderRightWidth: 3 }} />
    <Corner s={{ bottom: -3, left: -3, borderBottomWidth: 3, borderLeftWidth: 3 }} />
    <div style={{ fontFamily: lalezar, fontSize: 20, color: "#fff", textAlign: "center", lineHeight: 1.1 }}>{TITLE}</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
      <div style={{ fontFamily: cairo, fontWeight: 900, fontSize: 27, color: "#ffe3a0", direction: "ltr" }}>{CLOCK}</div>
      <div style={{ fontFamily: cairo, fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2, textAlign: "center" }}><div>{H}</div><div>{G}</div></div>
    </div>
    <div style={{ ...tick, color: "#ffe9d8", textAlign: "center" }}>{NOTICE}</div>
  </Box>
);

const VARIANTS = [V1, V2, V3, V4, V5, V6, V7, V8, V9, V10];
const NAMES = ["زجاج + شريط ذهبي + عدّاد في قرص", "لوحة خشب منقوشة بإطار نحاسي", "زجاج أزرق بنجمة إسلامية وإطار ذهبي", "عدّاد دائري بحلقة تقدّم", "بلا صندوق: كتابة بظل وخط ذهبي", "شريط ريبون + بطاقة ورقية للعدّاد", "بطاقة محراب (قوس)", "ورقة بردي بختم التاريخ", "شريط منقسم: أزرق للعدّاد وبني للعنوان", "زجاج بأقواس ذهبية في الزوايا"];
const CW = 960, CH = 420;
export const TitleBarGallery: React.FC = () => (
  <AbsoluteFill style={{ background: "#2a1a0e", fontFamily: cairo }}>
    {VARIANTS.map((V, i) => (
      <div key={i} style={{ position: "absolute", left: (i % 2) * CW, top: Math.floor(i / 2) * CH, width: CW, height: CH, overflow: "hidden", border: "2px solid #2a1a0e" }}>
        {/* bottom-right crop of the real frame, 1:1 */}
        <div style={{ position: "absolute", right: 0, bottom: 0, width: 1920, height: 1080 }}>
          <Img src={staticFile("cover/tir_still.jpg")} style={{ width: 1920, height: 1080 }} />
          <V />
        </div>
        <div style={{ position: "absolute", left: 10, top: 8, background: "#24456e", color: "#fff", fontFamily: cairo, fontWeight: 800, fontSize: 26, padding: "2px 16px", borderRadius: 12, border: "3px solid #fff" }}>{i + 1}</div>
        <div style={{ position: "absolute", left: 70, top: 10, color: "#fff", fontFamily: cairo, fontWeight: 700, fontSize: 22, textShadow: "0 2px 6px rgba(0,0,0,.9)" }}>{NAMES[i]}</div>
      </div>
    ))}
  </AbsoluteFill>
);
