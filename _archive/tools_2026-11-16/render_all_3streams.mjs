import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const targetDir = "C:\\Users\\mshms\\Videos\\جاهز\\بثوث\\طولي";
fs.mkdirSync(targetDir, { recursive: true });

const clips = [
  {
    id: "Stream-Arsh-Fakh-R",
    filename: "إحراج متصل شيعي جاء يسخر من العرش فأقر به وقال الشيخ حطيت عقيدتك تحت رجلك",
    cardTitle: "إحراج متصل شيعي في العرش",
    coverFrame: 1000
  },
  {
    id: "Stream-Julani-Takfir-R",
    filename: "حوار مع خارجي تكفيري يستدل بالجولاني ويكفر الأمة والشيخ يقصفه تتمضحك مثل النسوان",
    cardTitle: "قصف تكفيري يستدل بالجولاني",
    coverFrame: 180
  },
  {
    id: "Stream-Mayyit-Ilm-R",
    filename: "إفحام متصل أشعري في علم الله هل الله يعلم أنك ميت الآن إذا علمه غلط",
    cardTitle: "إفحام أشعري في علم الله",
    coverFrame: 2000
  }
];

for (let i = 0; i < clips.length; i++) {
  const c = clips[i];
  const outMp4 = path.join(targetDir, `${c.filename}.mp4`);
  const outJpg = path.join(targetDir, `${c.filename}.jpg`);

  console.log(`\n============================================================`);
  console.log(`[${i + 1}/3] Starting Render: ${c.cardTitle}`);
  console.log(`Target: ${outMp4}`);
  console.log(`============================================================\n`);

  execFileSync("node", ["tools/render_final.mjs", c.id, outMp4, c.cardTitle], { stdio: "inherit" });

  console.log(`Extracting thumbnail JPG for ${c.cardTitle}...`);
  // Render frame as jpg thumbnail
  execFileSync("node", ["tools/fast_still.mjs", c.id, String(c.coverFrame), outJpg], { stdio: "inherit" });

  console.log(`Successfully completed [${i + 1}/3]: ${c.filename}\n`);
}

console.log("\nAll 3 clips rendered and exported successfully to:");
console.log(targetDir);

// Run temp cleanup per rule 6: "node tools/clean_temp.mjs بعد كل عملية"
console.log("\nRunning auto cleanup...");
execFileSync("node", ["tools/clean_temp.mjs"], { stdio: "inherit" });
console.log("Cleanup done.");

