const fs = require("fs");
// ---- kit: clips are always shown WHOLE (contain); big correction card ----
let k = fs.readFileSync("src/EuKit.tsx", "utf8");
k = k.replace("speed = 1.04, contain = false, patch = false })", "speed = 1.04, contain = true, patch = false })");
if (!k.includes("export const Correction")) {
  k += `
/** big clear correction when the Sheikh misspoke (e.g. "airport of Hormuz" -> "Strait of Hormuz"); user rule 2026-10-18 */
export const Correction: React.FC<{ at: number; dur: number; x: number; y: number; w: number; text: string; size?: number }> = ({ at, dur, x, y, w, text, size = 68 }) => {
  const s = useSp(at, 11, 190);
  const t = useT(at);
  if (t < 0 || t > dur) return null;
  const o = Math.min(clamp(s * 2), clamp((dur - t) / 0.3));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: \`scale(\${0.85 + 0.15 * s}) rotate(\${(1 - s) * -3}deg)\`, background: T.mark, border: "6px solid #fff", borderRadius: 20, boxShadow: "0 18px 36px rgba(0,0,0,.4)", padding: "10px 24px 16px", textAlign: "center", direction: "rtl" }}>
      <span style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, color: "#fff", lineHeight: 1.2 }}>{text}</span>
    </div>
  );
};
`;
}
fs.writeFileSync("src/EuKit.tsx", k);

// ---- portrait ----
let p = fs.readFileSync("src/EuPortrait.tsx", "utf8");
p = p.replace("T_BEL = tw(11),", "T_BEL = tw(9),");
p = p.replace(`[{ text: "التكاليف عالية", at: tw(11, "تكاليفها") }`, `[{ text: "الجامعات: دخولها صعب", at: tw(9, "الجامعات") }, { text: "التكاليف عالية", at: tw(11, "تكاليفها") }`);
p = p.replace("import { BClip, Banner, EU_FPS,", "import { BClip, Banner, Correction, EU_FPS,");
p = p.replace(/(<BClip n=\{4\}[^\n]*\/>)/, `$1\n            <Correction at={tw(18, "هرمز")} dur={5.5} x={60} y={120} w={960} text="تصحيح: مضيق هرمز" />`);
fs.writeFileSync("src/EuPortrait.tsx", p);

// ---- landscape ----
let l = fs.readFileSync("src/EuLandscape.tsx", "utf8");
l = l.replace("import { BClip, Banner, EU_FPS,", "import { BClip, Banner, Correction, EU_FPS,");
l = l.replace(/(<BClip n=\{4\}[^\n]*\/>)/, `$1\n            <Correction at={tw(18, "هرمز")} dur={5.5} x={110} y={110} w={900} text="تصحيح: مضيق هرمز" size={64} />`);
fs.writeFileSync("src/EuLandscape.tsx", l);

// ---- cut picks: portrait keeps the Belgium university sentences (lines 9-10) so the context is not broken ----
let c = fs.readFileSync("tools/eu_cut.mjs", "utf8");
c = c.replace("[1, 2, 4, 5, 11, 16, 17, 18, 19, 28, 29, 30]", "[1, 2, 4, 5, 9, 10, 11, 16, 17, 18, 19, 28, 29, 30]");
fs.writeFileSync("tools/eu_cut.mjs", c);
console.log("ok", k.includes("export const Correction"), p.includes("Correction at"), l.includes("Correction at"), c.includes("5, 9, 10, 11"));
