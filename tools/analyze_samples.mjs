import fs from "fs";
import { execSync } from "child_process";

const files = [
  { id: "sample1_kafer", path: "C:/Users/mshms/Downloads/كافر ويعالج الناس وينفق عليهم لماذا لا يدخل الجنة؟ الإجابة في دقيقة #كافر #ملحد [360x640].mp4" },
  { id: "sample2_joe", path: "C:/Users/mshms/Downloads/جو يكشف سبب خسارة الزمالك  لبطولة الكونفدرالية! [360x640].mp4" },
  { id: "sample3_saturday", path: "C:/Users/mshms/Downloads/السبت الممتاز ｜ إياد الموجي Mogzz و محمد السعدني في الحضارة يهاجمان هيثم طلعت ｜ Ragebait Content [1280x720].mp4" },
  { id: "sample4_sabb_aldeen", path: "C:/Users/mshms/Downloads/سب الدين ： أسهل كفر  ( انشروا وحذروا الشباب ضروري ) #سب_الدين [360x640].mp4" }
];

fs.mkdirSync(".tmp/study_deep", { recursive: true });

for (const item of files) {
  console.log(`\n========================================`);
  console.log(`ANALYZING: ${item.id} -> ${item.path}`);
  if (!fs.existsSync(item.path)) {
    console.error(`File NOT FOUND: ${item.path}`);
    continue;
  }
  const probe = execSync(`ffprobe -v error -show_entries format=duration -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 "${item.path}"`).toString();
  console.log(probe);

  // Extract duration
  const match = probe.match(/duration=([\d.]+)/);
  const dur = match ? parseFloat(match[1]) : 60;
  console.log(`Duration: ${dur}s`);

  // Extract frames every 3 to 5 seconds to capture EVERY visual change/transition/caption
  const outDir = `.tmp/study_deep/${item.id}`;
  fs.mkdirSync(outDir, { recursive: true });
  
  // Extract 15 representative timestamps across the video
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = ((dur / (count + 1)) * (i + 1)).toFixed(1);
    const outImg = `${outDir}/frame_${String(i+1).padStart(2, "0")}_t${t}s.jpg`;
    try {
      execSync(`ffmpeg -y -ss ${t} -i "${item.path}" -vframes 1 -q:v 2 "${outImg}" 2>nul`);
    } catch (e) {}
  }
  console.log(`Extracted 15 frames for ${item.id} to ${outDir}`);
}

console.log("\nALL EXTRACTIONS COMPLETE!");
