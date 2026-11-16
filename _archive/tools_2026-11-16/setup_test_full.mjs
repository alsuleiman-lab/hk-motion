import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

// Create a test composition file that tests full screen video
const testCompCode = `
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const TestFullSheikh: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("stream_clip2_taaddud_clean.mp4")}
        style={{
          position: "absolute",
          top: 0,
          left: -2060,
          width: 3413,
          height: 1920,
          maxWidth: "none",
        }}
      />
      {/* Visual Guides */}
      <div style={{ position: "absolute", top: 1100, left: 40, right: 40, height: 4, background: "red" }} />
      <div style={{ position: "absolute", top: 1400, left: 40, right: 40, height: 4, background: "yellow" }} />
    </AbsoluteFill>
  );
};
`;

fs.writeFileSync("src/TestFullSheikh.tsx", testCompCode, "utf8");

// Add to Root.tsx temporarily
let rootCode = fs.readFileSync("src/Root.tsx", "utf8");
if (!rootCode.includes("TestFullSheikh")) {
  rootCode = 'import { TestFullSheikh } from "./TestFullSheikh";\n' + rootCode;
  rootCode = rootCode.replace(
    'return (',
    'return (\n      <Composition id="TestFullSheikh" component={TestFullSheikh} durationInFrames={300} fps={30} width={1080} height={1920} />'
  );
  fs.writeFileSync("src/Root.tsx", rootCode, "utf8");
}

console.log("Registered TestFullSheikh in Root.tsx");
