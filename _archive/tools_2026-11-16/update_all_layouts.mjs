import fs from "node:fs";

// 1. Clip5TaslamPortrait.tsx - swap panels so Sheikh is on TOP
let c5 = fs.readFileSync("src/Clip5TaslamPortrait.tsx", "utf8");

const sheikhPanelC5 = `      {/* PANEL 1: TOP (Sheikh Muhammad bin Shams al-Din - الشيخ دائماً في الأعلى) */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 50,
          width: 980,
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          border: \`6px solid \${C.gold}\`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          background: "#112240",
        }}
      >
        {/* Crop centered on the Sheikh */}
        <OffthreadVideo
          src={staticFile("stream_clip5_danger.mp4")}
          style={{
            position: "absolute",
            left: -1424,
            top: -273,
            width: 2534,
            height: 1425,
            maxWidth: "none",
          }}
        />

        {/* Panel Header Badge */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            background: "rgba(10, 25, 47, 0.94)",
            border: \`2px solid \${C.gold}\`,
            borderRadius: 999,
            padding: "6px 24px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>🎙️</span>
          <span
            style={{
              fontFamily: fontCairo,
              fontSize: 26,
              fontWeight: 800,
              color: C.gold,
            }}
          >
            الشيخ محمد بن شمس الدين
          </span>
        </div>
      </div>`;

const debatePanelC5 = `      {/* PANEL 2: BOTTOM (The Debate Screen: Seraj & Anas - المناظرة في الأسفل) */}
      <div
        style={{
          position: "absolute",
          top: 830,
          left: 50,
          width: 980,
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          border: t < 17.5 ? "6px solid rgba(255, 255, 255, 0.85)" : "6px solid rgba(229, 57, 53, 0.7)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
          background: "#112240",
        }}
      >
        {/* Crop centered on the debate screen */}
        <OffthreadVideo
          src={staticFile("stream_clip5_danger.mp4")}
          style={{
            position: "absolute",
            left: -136,
            top: -259,
            width: 2208,
            height: 1242,
            maxWidth: "none",
          }}
        />

        {/* Panel Header Badge */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            background: "rgba(10, 25, 47, 0.94)",
            border: \`2px solid \${C.gold}\`,
            borderRadius: 999,
            padding: "6px 24px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>⚔️</span>
          <span
            style={{
              fontFamily: fontCairo,
              fontSize: 26,
              fontWeight: 800,
              color: C.yellow,
            }}
          >
            {t < 17.5 ? "المناظرة: سراج يتحدى والمحاور يرد" : "المناظرة على تيك توك"}
          </span>
        </div>
      </div>`;

c5 = c5.replace(/\{\/\* PANEL 1: TOP[\s\S]*?\{\/\* LOWER SECTION: KINETIC CARDS/, sheikhPanelC5 + "\n\n" + debatePanelC5 + "\n\n      {/* LOWER SECTION: KINETIC CARDS");
fs.writeFileSync("src/Clip5TaslamPortrait.tsx", c5);
console.log("Updated Clip5 panels: Sheikh on TOP!");

// 2. Update background in Clip2, Clip3, Clip4
const newBg = `<AbsoluteFill
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
      />`;

for (const file of ["src/Clip2TaaddudPortrait.tsx", "src/Clip3SunrisePortrait.tsx", "src/Clip4ThronePortrait.tsx"]) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/<AbsoluteFill\s+style=\{\{\s+background:\s*"linear-gradient[\s\S]*?\{\/\* TOP HEADER/m, newBg + "\n\n      {/* TOP HEADER");
  fs.writeFileSync(file, content);
  console.log("Updated background in", file);
}
