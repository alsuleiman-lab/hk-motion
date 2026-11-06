import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

try {
  os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL);
} catch { /* ignore */ }

const outDir = path.resolve("C:/Users/mshms/Videos/جاهز/بثوث/طولي");
fs.mkdirSync(outDir, { recursive: true });

const REELS = [
  {
    comp: "S2-Ashari-Kalb-R",
    name: "إحراج متصل أشعري يلزم نفسه والدي كالكلب والشيخ يقصف منطقه الفاسد",
    cardTitle: "إحراج أشعري يلزم نفسه"
  },
  {
    comp: "S2-Ashari-Tifla-R",
    name: "متصل أشعري يحتج بطفلته في نفي العلو والشيخ يقصفه إذا ربك عاجز فهذا إله لا نعبده",
    cardTitle: "أشعري يحتج بطفلته"
  },
  {
    comp: "S2-Quburi-Sahaba-R",
    name: "قبوري يدافع عن القبور ويصف الصحابة بالجهل والشيخ يقصفه قبحك الله يا قليل الأدب",
    cardTitle: "قبوري يطعن بالصحابة"
  },
  {
    comp: "S2-Shia-Istislam-R",
    name: "متصل شيعي يجادل في صفات الله فيفحمه الشيخ بروايات أئمته حتى أقر قائلا أنا أستسلم",
    cardTitle: "متصل شيعي يستسلم"
  }
];

console.log("============================================================");
console.log("Starting precise re-rendering of 4 Reels (MP4 ONLY - NO JPGs):");
console.log(outDir);
console.log("============================================================\n");

for (let i = 0; i < REELS.length; i++) {
  const r = REELS[i];
  const mp4Out = path.join(outDir, `${r.name}.mp4`);

  console.log(`\n============================================================`);
  console.log(`[${i + 1}/${REELS.length}] Starting Render: ${r.cardTitle}`);
  console.log(`Target: ${mp4Out}`);
  console.log(`============================================================\n`);

  execFileSync("node", ["tools/render_final.mjs", r.comp, mp4Out, r.cardTitle], { stdio: "inherit" });

  if (!fs.existsSync(mp4Out)) {
    console.error(`ERROR: Render output missing: ${mp4Out}`);
    process.exit(1);
  }

  console.log(`Successfully completed [${i + 1}/${REELS.length}]: ${r.name}\n`);
}

console.log("\n============================================================");
console.log("All 4 reels rendered and exported successfully to MP4:");
console.log(outDir);
console.log("============================================================\n");

// Auto Cleanup
console.log("Running auto cleanup...");
try {
  execFileSync("node", ["tools/clean_temp.mjs"], { stdio: "inherit" });
} catch (e) {
  console.error("Cleanup warning:", e.message);
}
