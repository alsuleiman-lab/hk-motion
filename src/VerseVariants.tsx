import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { loadFont as loadQuran } from "@remotion/google-fonts/AmiriQuran";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { azCut } from "./azTime";
import { AZ_SCENES } from "./azData";

/** 10 alternative looks for showing Quran verses over the speaker (landscape 1920x1080 designs, shown at half size). */
const { fontFamily: q } = loadQuran("normal", { weights: ["400"], subsets: ["arabic"] });
const { fontFamily: kufi } = loadKufi("normal", { weights: ["800"], subsets: ["arabic"] });
const sc = AZ_SCENES.find((s) => s.kind === "verse" && s.title === "أمر الله");
const V = sc && sc.kind === "verse" ? sc.verses : [];
const A = V[0], B = V[1];
const t0 = azCut(950);

const Frame: React.FC<{ n: number; name: string; children: React.ReactNode }> = ({ n, name, children }) => (
  <div style={{ position: "relative", width: 960, height: 540, overflow: "hidden", borderRadius: 14, border: "3px solid #f6ecd3" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "0 0" }}>
      <OffthreadVideo src={staticFile("az_v3_cut_proxy.mp4")} startFrom={Math.round(t0 * 30)} muted style={{ width: 1920, height: 1080 }} />
      {children}
    </div>
    <div style={{ position: "absolute", right: 10, top: 8, background: "#e8ae2c", color: "#3a2412", fontFamily: kufi, fontSize: 26, padding: "2px 16px", borderRadius: 18 }}>{n} — {name}</div>
  </div>
);
const ref = (r: string, c = "#7a4b2a", s = 34) => <div style={{ fontFamily: kufi, fontSize: s, color: c }}>{r}</div>;
const txt = (t: string, s: number, c = "#2c1a0c") => <div style={{ fontFamily: q, fontSize: s, lineHeight: 1.9, color: c }}>﴿ {t} ﴾</div>;
const cream = "linear-gradient(#f9f0d8,#f1e2bb)";
const abs = (st: React.CSSProperties): React.CSSProperties => ({ position: "absolute", direction: "rtl", textAlign: "center", ...st });

export const VerseVariants: React.FC = () => (
  <AbsoluteFill style={{ background: "#2f5f94", padding: 20, display: "grid", gridTemplateColumns: "960px 960px", gap: 16, alignContent: "start" }}>
    <Frame n={1} name="شريط سفلي عريض">
      <div style={abs({ left: 0, right: 0, bottom: 40, margin: "0 120px", background: cream, border: "6px solid #c98a1b", borderRadius: 28, padding: "10px 30px" })}>{txt(A.text, 62)}{ref(A.ref)}</div>
    </Frame>
    <Frame n={2} name="شريط علوي (فوق الرأس)">
      <div style={abs({ left: 0, right: 0, top: 0, background: "linear-gradient(#24456e,#2f5f94)", borderBottom: "8px solid #e8ae2c", padding: "10px 60px 14px" })}>{txt(A.text, 64, "#f6ecd3")}{ref(A.ref, "#e8ae2c")}</div>
    </Frame>
    <Frame n={3} name="ورقة مصحف طويلة يسار">
      <div style={abs({ left: 50, top: 60, width: 520, bottom: 120, background: cream, border: "8px double #8a5a14", borderRadius: 14, padding: "30px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 })}>{txt(A.text, 54)}<div style={{ height: 4, background: "#c98a1b" }} />{txt(B.text, 46)}{ref("النور ٣١ · الأحزاب ٥٩")}</div>
    </Frame>
    <Frame n={4} name="إطار مزخرف بزوايا">
      <div style={abs({ left: 60, bottom: 50, width: 900, background: cream, border: "4px solid #8a5a14", outline: "10px solid #e8ae2c", outlineOffset: "-22px", borderRadius: 10, padding: "30px 50px 18px" })}>
        <div style={{ position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)", background: "#7a4b2a", color: "#fff4d6", fontFamily: kufi, fontSize: 32, padding: "2px 30px", borderRadius: 20, border: "3px solid #e8ae2c" }}>{A.ref}</div>
        {txt(A.text, 58)}
      </div>
    </Frame>
    <Frame n={5} name="لوح أزرق زجاجي وكتابة ذهبية">
      <div style={abs({ left: 50, top: 150, width: 560, background: "rgba(36,69,110,.88)", border: "5px solid #e8ae2c", borderRadius: 30, padding: "24px 30px" })}>{txt(A.text, 58, "#ffe9a8")}{ref(A.ref, "#f6ecd3")}</div>
    </Frame>
    <Frame n={6} name="كتابة مباشرة بحدّ بني بلا بطاقة">
      <div style={abs({ left: 40, right: 40, bottom: 40 })}><div style={{ fontFamily: q, fontSize: 78, lineHeight: 1.7, color: "#fff1b8", paintOrder: "stroke fill", WebkitTextStroke: "14px #4a2f1d", textShadow: "0 8px 20px rgba(0,0,0,.5)" }}>﴿ {A.text} ﴾</div>{ref(A.ref, "#f6ecd3", 36)}</div>
    </Frame>
    <Frame n={7} name="أسلوبك المحبّب: الفيديو خلفية + الشيخ في بطاقة جانبية">
      <OffthreadVideo src={staticFile("az_v3_cut_proxy.mp4")} startFrom={Math.round(t0 * 30)} muted style={{ position: "absolute", left: -500, top: -300, width: 3000, height: 1688, maxWidth: "none", filter: "blur(3px)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(135deg,rgba(36,69,110,.82),rgba(47,95,148,.78) 55%,rgba(107,70,48,.8))" }} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle,rgba(246,236,211,.5) 3px,transparent 4px)", backgroundSize: "90px 90px", opacity: 0.35 }} />
      <div style={abs({ left: 40, top: 150, width: 1000 })}>{txt(A.text, 78, "#f6ecd3")}{ref(A.ref, "#e8ae2c", 40)}<div style={{ height: 40 }} />{txt(B.text, 56, "#f6ecd3")}{ref("سورة الأحزاب — الآية ٥٩", "#e8ae2c", 36)}</div>
      <div style={{ position: "absolute", right: 24, top: 24, width: 740, height: 1032, borderRadius: 30, overflow: "hidden", border: "7px solid #f6ecd3" }}><OffthreadVideo src={staticFile("az_v3_cut_proxy.mp4")} startFrom={Math.round(t0 * 30)} muted style={{ position: "absolute", left: -700, top: 0, width: 1920, height: 1080, maxWidth: "none" }} /></div>
    </Frame>
    <Frame n={8} name="عمود يمين رفيع بتلوين الكلمات">
      <div style={abs({ right: 40, top: 40, width: 380, bottom: 150, background: cream, border: "6px solid #c98a1b", borderRadius: 26, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "center" })}>
        <div style={{ fontFamily: q, fontSize: 56, lineHeight: 1.9, color: "#2c1a0c" }}>﴿ <span style={{ color: "#b3261e" }}>{A.text.split(" ").slice(0, 3).join(" ")}</span> {A.text.split(" ").slice(3).join(" ")} ﴾</div>{ref(A.ref)}
      </div>
    </Frame>
    <Frame n={9} name="بطاقة عائمة بشارة السورة">
      <div style={abs({ left: 50, bottom: 70, width: 700, background: cream, border: "6px solid #c98a1b", borderRadius: 26, padding: "50px 30px 16px", boxShadow: "0 16px 34px rgba(0,0,0,.45)" })}>
        <div style={{ position: "absolute", top: -34, right: 30, background: "#1d3a5d", color: "#fff4d6", fontFamily: kufi, fontSize: 34, padding: "4px 26px", borderRadius: 22, border: "4px solid #e8ae2c" }}>سورة النور</div>
        <div style={{ position: "absolute", top: -34, left: 30, background: "#7a4b2a", color: "#fff4d6", fontFamily: kufi, fontSize: 34, padding: "4px 26px", borderRadius: 22, border: "4px solid #e8ae2c" }}>الآية ٣١</div>
        {txt(A.text, 60)}
      </div>
    </Frame>
    <Frame n={10} name="بطاقتان صغيرتان يمين ويسار تحت">
      <div style={abs({ left: 30, bottom: 30, width: 560, background: cream, border: "5px solid #c98a1b", borderRadius: 22, padding: "8px 20px" })}>{txt(A.text, 44)}{ref(A.ref, "#7a4b2a", 28)}</div>
      <div style={abs({ right: 30, bottom: 30, width: 600, background: cream, border: "5px solid #c98a1b", borderRadius: 22, padding: "8px 20px" })}>{txt(B.text, 38)}{ref("سورة الأحزاب — الآية ٥٩", "#7a4b2a", 28)}</div>
    </Frame>
  </AbsoluteFill>
);
