import fs from "node:fs";

const headerBlock = `  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 35%, #24456e 0%, #1b2a3d 60%, #132031 100%)",
        direction: "rtl",
        overflow: "hidden",
      }}
    >
      {/* Decorative Star Pattern Background */}
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
      />\n\n`;

for (const file of ["Clip2TaaddudPortrait.tsx", "Clip3SunrisePortrait.tsx", "Clip4ThronePortrait.tsx"]) {
  const p = "src/" + file;
  let code = fs.readFileSync(p, "utf8");
  if (!code.includes("return (\n    <AbsoluteFill\n      style={{\n        background: \"radial-gradient(circle at 50% 35%")) {
    code = code.replace("  {/* TOP HEADER", headerBlock + "      {/* TOP HEADER");
    fs.writeFileSync(p, code, "utf8");
    console.log("Fixed return in", file);
  }
}
