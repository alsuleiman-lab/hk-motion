import fs from "node:fs";
import path from "node:path";

const root = "s:/AI_Tools/Remotion_Workspace";

// 1. Update Clip1SunPortrait.tsx
function updateClip1() {
  const file = path.join(root, "src/Clip1SunPortrait.tsx");
  let code = fs.readFileSync(file, "utf8");

  // Remove google fonts imports and calls
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadCairo\s*\}\s*from\s*"@remotion\/google-fonts\/Cairo";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadLalezar\s*\}\s*from\s*"@remotion\/google-fonts\/Lalezar";\s*/g, "");
  code = code.replace(/loadCairo\([^)]+\);\s*/g, "");
  code = code.replace(/loadLalezar\([^)]+\);\s*/g, "");

  // Add local fonts import + StreamFooter import
  if (!code.includes('import { FONT_TEXT, FONT_TITLE } from "./localFonts";')) {
    code = 'import { FONT_TEXT, FONT_TITLE } from "./localFonts";\nimport { StreamFooter } from "./StreamFooter";\n' + code;
  }

  // Replace font definitions
  code = code.replace(/const fontLalezar = "Lalezar, cursive";/g, 'const fontTitle = "Noto Kufi Arabic, sans-serif";');
  code = code.replace(/const fontCairo = "Cairo, sans-serif";/g, 'const fontText = "Almarai, sans-serif";');
  code = code.replace(/fontFamily: fontLalezar/g, 'fontFamily: fontTitle');
  code = code.replace(/fontFamily: fontCairo/g, 'fontFamily: fontText');

  // Insert FONT_TITLE(); FONT_TEXT(); in component
  if (!code.includes("FONT_TITLE();")) {
    code = code.replace(/export const Clip1SunPortrait: React\.FC = \(\) => \{/, 'export const Clip1SunPortrait: React.FC = () => {\n  FONT_TITLE();\n  FONT_TEXT();');
  }

  // Replace Cover (if (f < 3) block)
  const coverStart = code.indexOf("// Cover in first 3 frames");
  const coverEnd = code.indexOf("const isPastVideo = t >=");
  if (coverStart !== -1 && coverEnd !== -1) {
    const newCover = `// Cover in first 3 frames (0.10s) - Real photos of Sheikh & Opponent
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
          padding: 50,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", gap: 30, marginBottom: 30, alignItems: "center" }}>
          {/* Sheikh Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 320,
                height: 380,
                borderRadius: 28,
                border: "6px solid #f5c542",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("sheikh_current_stream.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="الشيخ محمد بن شمس الدين"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(10, 25, 47, 0.95)",
                border: "2px solid #f5c542",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#f5c542",
              }}
            >
              الشيخ محمد بن شمس الدين
            </div>
          </div>

          <div style={{ fontFamily: fontTitle, fontSize: 48, fontWeight: 900, color: "#f5c542" }}>
            ⚔️
          </div>

          {/* Seraj Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 320,
                height: 380,
                borderRadius: 28,
                border: "6px solid #e53935",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(229,57,53,0.4)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("seraj_face.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="سراج حياني"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(183, 28, 28, 0.95)",
                border: "2px solid #ffffff",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              سراج حياني
            </div>
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          مناظرة سراج حياني وأنس محمد
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 20,
          }}
        >
          سراج حياني يرد على نفسه في
          <br />
          <span style={{ color: "#ffd152" }}>«جريان الشمس وتوقفها وسجودها»</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }\n\n  `;
    code = code.slice(0, coverStart) + newCover + code.slice(coverEnd);
  }

  // Add <StreamFooter /> before the closing </AbsoluteFill>
  if (!code.includes("<StreamFooter")) {
    const lastFill = code.lastIndexOf("</AbsoluteFill>");
    if (lastFill !== -1) {
      code = code.slice(0, lastFill) + "      <StreamFooter />\n    " + code.slice(lastFill);
    }
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("Updated Clip1SunPortrait.tsx");
}

// 2. Update Clip2TaaddudPortrait.tsx
function updateClip2() {
  const file = path.join(root, "src/Clip2TaaddudPortrait.tsx");
  let code = fs.readFileSync(file, "utf8");

  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadCairo\s*\}\s*from\s*"@remotion\/google-fonts\/Cairo";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadLalezar\s*\}\s*from\s*"@remotion\/google-fonts\/Lalezar";\s*/g, "");
  code = code.replace(/loadCairo\([^)]+\);\s*/g, "");
  code = code.replace(/loadLalezar\([^)]+\);\s*/g, "");

  if (!code.includes('import { FONT_TEXT, FONT_TITLE } from "./localFonts";')) {
    code = 'import { FONT_TEXT, FONT_TITLE } from "./localFonts";\nimport { StreamFooter } from "./StreamFooter";\n' + code;
  }

  code = code.replace(/const fontLalezar = "Lalezar, cursive";/g, 'const fontTitle = "Noto Kufi Arabic, sans-serif";');
  code = code.replace(/const fontCairo = "Cairo, sans-serif";/g, 'const fontText = "Almarai, sans-serif";');
  code = code.replace(/fontFamily: fontLalezar/g, 'fontFamily: fontTitle');
  code = code.replace(/fontFamily: fontCairo/g, 'fontFamily: fontText');

  // Update duration to 70.2 seconds (clean cut without silences)
  code = code.replace(/export const CLIP2_SECONDS = [\d.]+;/, "export const CLIP2_SECONDS = 70.2;");
  // Update video src to clean cut
  code = code.replace(/stream_clip2_taaddud\.mp4/g, "stream_clip2_taaddud_clean.mp4");

  if (!code.includes("FONT_TITLE();")) {
    code = code.replace(/export const Clip2TaaddudPortrait: React\.FC = \(\) => \{/, 'export const Clip2TaaddudPortrait: React.FC = () => {\n  FONT_TITLE();\n  FONT_TEXT();');
  }

  // Replace Cover
  const coverStart = code.indexOf("// Cover in first 3 frames");
  const coverEnd = code.indexOf("{/* TOP HEADER");
  if (coverStart !== -1 && coverEnd !== -1) {
    const newCover = `// Cover in first 3 frames (0.10s) - Real photo of the Sheikh
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
          padding: 50,
          textAlign: "center",
        }}
      >
        {/* Sheikh Photo Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 380,
              height: 460,
              borderRadius: 32,
              border: "6px solid #f5c542",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
              background: "#112240",
            }}
          >
            <img
              src={staticFile("sheikh_current_stream.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="الشيخ محمد بن شمس الدين"
            />
          </div>
          <div
            style={{
              marginTop: 14,
              background: "rgba(10, 25, 47, 0.95)",
              border: "2px solid #f5c542",
              borderRadius: 999,
              padding: "6px 24px",
              fontFamily: fontTitle,
              fontSize: 24,
              fontWeight: 800,
              color: "#f5c542",
            }}
          >
            الشيخ محمد بن شمس الدين
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          طرفة عفوية من البث المباشر 💬
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 16,
          }}
        >
          طرفة التعدد ومصادر الدخل
          <br />
          <span style={{ color: "#ffd152" }}>«تعدد مصادر دخلك.. التعدد زين!»</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }\n\n  `;
    code = code.slice(0, coverStart) + newCover + code.slice(coverEnd);
  }

  // Replace old bottom channel badge with <StreamFooter />
  const oldFooterMatch = code.match(/\{\/\*\s*Bottom channel badge\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/AbsoluteFill>/);
  if (oldFooterMatch) {
    code = code.replace(oldFooterMatch[0], '{/* Bottom Channel Footer */}\n      <StreamFooter />\n    </AbsoluteFill>');
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("Updated Clip2TaaddudPortrait.tsx");
}

// 3. Update Clip3SunrisePortrait.tsx
function updateClip3() {
  const file = path.join(root, "src/Clip3SunrisePortrait.tsx");
  let code = fs.readFileSync(file, "utf8");

  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadCairo\s*\}\s*from\s*"@remotion\/google-fonts\/Cairo";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadLalezar\s*\}\s*from\s*"@remotion\/google-fonts\/Lalezar";\s*/g, "");
  code = code.replace(/loadCairo\([^)]+\);\s*/g, "");
  code = code.replace(/loadLalezar\([^)]+\);\s*/g, "");

  if (!code.includes('import { FONT_TEXT, FONT_TITLE } from "./localFonts";')) {
    code = 'import { FONT_TEXT, FONT_TITLE } from "./localFonts";\nimport { StreamFooter } from "./StreamFooter";\n' + code;
  }

  code = code.replace(/const fontLalezar = "Lalezar, cursive";/g, 'const fontTitle = "Noto Kufi Arabic, sans-serif";');
  code = code.replace(/const fontCairo = "Cairo, sans-serif";/g, 'const fontText = "Almarai, sans-serif";');
  code = code.replace(/fontFamily: fontLalezar/g, 'fontFamily: fontTitle');
  code = code.replace(/fontFamily: fontCairo/g, 'fontFamily: fontText');

  if (!code.includes("FONT_TITLE();")) {
    code = code.replace(/export const Clip3SunrisePortrait: React\.FC = \(\) => \{/, 'export const Clip3SunrisePortrait: React.FC = () => {\n  FONT_TITLE();\n  FONT_TEXT();');
  }

  // Replace Cover
  const coverStart = code.indexOf("// Cover in first 3 frames");
  const coverEnd = code.indexOf("{/* TOP HEADER");
  if (coverStart !== -1 && coverEnd !== -1) {
    const newCover = `// Cover in first 3 frames (0.10s) - Real photo of the Sheikh
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
          padding: 50,
          textAlign: "center",
        }}
      >
        {/* Sheikh Photo Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 380,
              height: 460,
              borderRadius: 32,
              border: "6px solid #f5c542",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
              background: "#112240",
            }}
          >
            <img
              src={staticFile("sheikh_current_stream.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="الشيخ محمد بن شمس الدين"
            />
          </div>
          <div
            style={{
              marginTop: 14,
              background: "rgba(10, 25, 47, 0.95)",
              border: "2px solid #f5c542",
              borderRadius: 999,
              padding: "6px 24px",
              fontFamily: fontTitle,
              fontSize: 24,
              fontWeight: 800,
              color: "#f5c542",
            }}
          >
            الشيخ محمد بن شمس الدين
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          شبهة لغوية وعلمية ☀️
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 16,
          }}
        >
          هل تشرق الشمس أم تشرق الأرض؟
          <br />
          <span style={{ color: "#ffd152" }}>«الرد اللغوي ودلالة عين الناظر»</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }\n\n  `;
    code = code.slice(0, coverStart) + newCover + code.slice(coverEnd);
  }

  // Replace old bottom channel badge with <StreamFooter />
  const oldFooterMatch = code.match(/\{\/\*\s*Bottom channel badge\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/AbsoluteFill>/);
  if (oldFooterMatch) {
    code = code.replace(oldFooterMatch[0], '{/* Bottom Channel Footer */}\n      <StreamFooter />\n    </AbsoluteFill>');
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("Updated Clip3SunrisePortrait.tsx");
}

// 4. Update Clip4ThronePortrait.tsx
function updateClip4() {
  const file = path.join(root, "src/Clip4ThronePortrait.tsx");
  let code = fs.readFileSync(file, "utf8");

  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadRakkas\s*\}\s*from\s*"@remotion\/google-fonts\/Rakkas";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadCairo\s*\}\s*from\s*"@remotion\/google-fonts\/Cairo";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadLalezar\s*\}\s*from\s*"@remotion\/google-fonts\/Lalezar";\s*/g, "");
  code = code.replace(/loadRakkas\([^)]+\);\s*/g, "");
  code = code.replace(/loadCairo\([^)]+\);\s*/g, "");
  code = code.replace(/loadLalezar\([^)]+\);\s*/g, "");

  if (!code.includes('import { FONT_TEXT, FONT_TITLE } from "./localFonts";')) {
    code = 'import { FONT_TEXT, FONT_TITLE } from "./localFonts";\nimport { StreamFooter } from "./StreamFooter";\n' + code;
  }

  code = code.replace(/const fontLalezar = "Lalezar, cursive";/g, 'const fontTitle = "Noto Kufi Arabic, sans-serif";');
  code = code.replace(/const fontCairo = "Cairo, sans-serif";/g, 'const fontText = "Almarai, sans-serif";');
  code = code.replace(/fontFamily: fontLalezar/g, 'fontFamily: fontTitle');
  code = code.replace(/fontFamily: fontCairo/g, 'fontFamily: fontText');

  if (!code.includes("FONT_TITLE();")) {
    code = code.replace(/export const Clip4ThronePortrait: React\.FC = \(\) => \{/, 'export const Clip4ThronePortrait: React.FC = () => {\n  FONT_TITLE();\n  FONT_TEXT();');
  }

  // Replace Cover
  const coverStart = code.indexOf("// Cover in first 3 frames");
  const coverEnd = code.indexOf("{/* TOP HEADER");
  if (coverStart !== -1 && coverEnd !== -1) {
    const newCover = `// Cover in first 3 frames (0.10s) - Real photo of the Sheikh
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
          padding: 50,
          textAlign: "center",
        }}
      >
        {/* Sheikh Photo Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 380,
              height: 460,
              borderRadius: 32,
              border: "6px solid #f5c542",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
              background: "#112240",
            }}
          >
            <img
              src={staticFile("sheikh_current_stream.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="الشيخ محمد بن شمس الدين"
            />
          </div>
          <div
            style={{
              marginTop: 14,
              background: "rgba(10, 25, 47, 0.95)",
              border: "2px solid #f5c542",
              borderRadius: 999,
              padding: "6px 24px",
              fontFamily: fontTitle,
              fontSize: 24,
              fontWeight: 800,
              color: "#f5c542",
            }}
          >
            الشيخ محمد بن شمس الدين
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          فوائد عقدية من البث 📜
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 16,
          }}
        >
          المخلوق الوحيد فوق العرش
          <br />
          <span style={{ color: "#ffd152" }}>«كتاب: إن رحمتي سبقت غضبي»</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }\n\n  `;
    code = code.slice(0, coverStart) + newCover + code.slice(coverEnd);
  }

  // Replace old bottom channel badge with <StreamFooter />
  const oldFooterMatch = code.match(/\{\/\*\s*Bottom channel badge\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/AbsoluteFill>/);
  if (oldFooterMatch) {
    code = code.replace(oldFooterMatch[0], '{/* Bottom Channel Footer */}\n      <StreamFooter />\n    </AbsoluteFill>');
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("Updated Clip4ThronePortrait.tsx");
}

// 5. Update Clip5TaslamPortrait.tsx
function updateClip5() {
  const file = path.join(root, "src/Clip5TaslamPortrait.tsx");
  let code = fs.readFileSync(file, "utf8");

  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadCairo\s*\}\s*from\s*"@remotion\/google-fonts\/Cairo";\s*/g, "");
  code = code.replace(/import\s*\{\s*loadFont\s*as\s*loadLalezar\s*\}\s*from\s*"@remotion\/google-fonts\/Lalezar";\s*/g, "");
  code = code.replace(/loadCairo\([^)]+\);\s*/g, "");
  code = code.replace(/loadLalezar\([^)]+\);\s*/g, "");

  if (!code.includes('import { FONT_TEXT, FONT_TITLE } from "./localFonts";')) {
    code = 'import { FONT_TEXT, FONT_TITLE } from "./localFonts";\nimport { StreamFooter } from "./StreamFooter";\n' + code;
  }

  code = code.replace(/const fontLalezar = "Lalezar, cursive";/g, 'const fontTitle = "Noto Kufi Arabic, sans-serif";');
  code = code.replace(/const fontCairo = "Cairo, sans-serif";/g, 'const fontText = "Almarai, sans-serif";');
  code = code.replace(/fontFamily: fontLalezar/g, 'fontFamily: fontTitle');
  code = code.replace(/fontFamily: fontCairo/g, 'fontFamily: fontText');

  if (!code.includes("FONT_TITLE();")) {
    code = code.replace(/export const Clip5TaslamPortrait: React\.FC = \(\) => \{/, 'export const Clip5TaslamPortrait: React.FC = () => {\n  FONT_TITLE();\n  FONT_TEXT();');
  }

  // Replace Cover
  const coverStart = code.indexOf("// Cover in first 3 frames");
  const coverEnd = code.indexOf("return (");
  if (coverStart !== -1 && coverEnd !== -1) {
    const newCover = `// Cover in first 3 frames (0.10s) - Real photos of Sheikh & Opponent
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
          padding: 50,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", gap: 30, marginBottom: 30, alignItems: "center" }}>
          {/* Sheikh Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 320,
                height: 380,
                borderRadius: 28,
                border: "6px solid #f5c542",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("sheikh_current_stream.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="الشيخ محمد بن شمس الدين"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(10, 25, 47, 0.95)",
                border: "2px solid #f5c542",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#f5c542",
              }}
            >
              الشيخ محمد بن شمس الدين
            </div>
          </div>

          <div style={{ fontFamily: fontTitle, fontSize: 48, fontWeight: 900, color: "#f5c542" }}>
            ⚖️
          </div>

          {/* Seraj Photo Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 320,
                height: 380,
                borderRadius: 28,
                border: "6px solid #e53935",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(229,57,53,0.4)",
                background: "#112240",
              }}
            >
              <img
                src={staticFile("seraj_face.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="سراج حياني"
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: "rgba(183, 28, 28, 0.95)",
                border: "2px solid #ffffff",
                borderRadius: 999,
                padding: "6px 20px",
                fontFamily: fontTitle,
                fontSize: 22,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              سراج حياني
            </div>
          </div>
        </div>

        {/* Title Badges */}
        <div
          style={{
            fontFamily: fontText,
            fontSize: 32,
            fontWeight: 800,
            color: "#f5c542",
            marginBottom: 16,
            background: "rgba(6, 17, 30, 0.85)",
            padding: "8px 28px",
            borderRadius: 999,
            border: "1px solid rgba(245, 197, 66, 0.4)",
          }}
        >
          تنبيه عقدي خطير من المناظرة ⚠️
        </div>
        <div
          style={{
            fontFamily: fontTitle,
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            marginBottom: 20,
          }}
        >
          قول «لا نريدك أن تسلم»
          <br />
          <span style={{ color: "#ffd152" }}>قول خطير لا يجوز.. فاحذر!</span>
        </div>
        <div
          style={{
            fontFamily: fontText,
            fontSize: 22,
            fontWeight: 700,
            color: "#c9d4e0",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
        </div>
      </AbsoluteFill>
    );
  }\n\n  `;
    code = code.slice(0, coverStart) + newCover + code.slice(coverEnd);
  }

  // Add <StreamFooter /> before the closing </AbsoluteFill>
  if (!code.includes("<StreamFooter")) {
    const lastFill = code.lastIndexOf("</AbsoluteFill>");
    if (lastFill !== -1) {
      code = code.slice(0, lastFill) + "      <StreamFooter />\n    " + code.slice(lastFill);
    }
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("Updated Clip5TaslamPortrait.tsx");
}

updateClip1();
updateClip2();
updateClip3();
updateClip4();
updateClip5();
console.log("All 5 clips updated successfully!");
