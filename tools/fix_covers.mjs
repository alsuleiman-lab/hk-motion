import fs from "node:fs";

function fixFile(file, coverTitle, coverSub) {
  let content = fs.readFileSync(file, "utf8");

  // Find export const Clip...
  const expMatch = content.match(/export const (Clip\w+): React\.FC = \(\) => \{/);
  if (!expMatch) {
    console.error("No export found in", file);
    return;
  }
  const prefix = content.slice(0, expMatch.index + expMatch[0].length);

  // Find TOP HEADER
  const topHeaderIdx = content.indexOf("{/* TOP HEADER");
  if (topHeaderIdx === -1) {
    console.error("No TOP HEADER in", file);
    return;
  }
  const suffix = content.slice(topHeaderIdx);

  const middle = `
  const f = useCurrentFrame();
  const t = f / fps;

  // Cover in first 3 frames (0.10s)
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
          padding: 60,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fontCairo,
            fontSize: 42,
            fontWeight: 800,
            color: C.gold,
            marginBottom: 20,
            letterSpacing: 2,
          }}
        >
          ${coverTitle}
        </div>
        <div
          style={{
            fontFamily: fontLalezar,
            fontSize: 90,
            lineHeight: 1.25,
            color: C.white,
            textShadow: "0 8px 30px rgba(0,0,0,0.8)",
          }}
        >
          ${coverSub}
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
      {/* Decorative Star Pattern Background (Visible brand navy and gold lattice) */}
      <AbsoluteFill
        style={{
          backgroundImage: \`url("data:image/svg+xml;utf8,\${encodeURIComponent(STAR)}")\`,
          backgroundSize: "140px 140px",
          backgroundPosition: \`\${f * 0.2}px \${f * 0.1}px\`,
          opacity: 0.22,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(15, 25, 45, 0.4) 100%)",
        }}
      />

      `;

  fs.writeFileSync(file, prefix + middle + suffix);
  console.log("Fixed", file);
}

fixFile("src/Clip2TaaddudPortrait.tsx", "طرفة ختام البث المباشر 😂", "سؤال: مو ناوي تعدد؟!<br /><span style={{ color: C.yellow }}>الشيخ: اللي ما يعدد ما يفهم!</span>");
fixFile("src/Clip3SunrisePortrait.tsx", "رد علمي ولغوي مفحم ☀️", "هل تشرق الشمس<br /><span style={{ color: C.yellow }}>أم تشرق الأرض؟!</span>");
fixFile("src/Clip4ThronePortrait.tsx", "فوائد عقدية من البث 📜", "المخلوق الوحيد فوق العرش<br /><span style={{ color: C.yellow }}>ومقام سيدنا محمد ﷺ</span>");
