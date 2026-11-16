// Render queue for 5 stream clips: outputs STRICTLY to C:/Users/mshms/Videos/جاهز directly (no subfolders).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const READY = "C:/Users/mshms/Videos/جاهز";

const clips = [
  {
    id: "Clip1SunPortrait",
    out: path.join(READY, "سراج_حياني_يرد_على_نفسه_في_جريان_الشمس.mp4"),
    title: "سراج حياني يرد على نفسه في جريان الشمس"
  },
  {
    id: "Clip2TaaddudPortrait",
    out: path.join(READY, "التعدد_ومصادر_الدخل_الشيخ_محمد_بن_شمس_الدين.mp4"),
    title: "التعدد ومصادر الدخل - الشيخ محمد بن شمس الدين"
  },
  {
    id: "Clip3SunrisePortrait",
    out: path.join(READY, "هل_تشرق_الشمس_أم_تشرق_الأرض_الشيخ_محمد_بن_شمس_الدين.mp4"),
    title: "هل تشرق الشمس أم تشرق الأرض"
  },
  {
    id: "Clip4ThronePortrait",
    out: path.join(READY, "المخلوق_الوحيد_فوق_العرش_الشيخ_محمد_بن_شمس_الدين.mp4"),
    title: "المخلوق الوحيد فوق العرش"
  },
  {
    id: "Clip5TaslamPortrait",
    out: path.join(READY, "قول_لا_نريدك_أن_تسلم_خطير_لا_يجوز_الشيخ_محمد_بن_شمس_الدين.mp4"),
    title: "قول لا نريدك أن تسلم خطير لا يجوز"
  }
];

function isRenderActive() {
  const LOCK = ".tmp/render.lock";
  if (!fs.existsSync(LOCK)) return false;
  try {
    const raw = fs.readFileSync(LOCK, "utf8");
    const o = raw.trim().startsWith("{") ? JSON.parse(raw) : { pid: Number(raw) };
    if (!o.pid || o.pid === process.pid) return false;
    process.kill(o.pid, 0);
    return true; // process is alive
  } catch {
    return false;
  }
}

// Ensure all mp4 files inside subfolders of جاهز are moved directly to جاهز root, and remove subfolders
function flattenReadyFolder() {
  const subDirs = ["طولي", "عرضي"];
  for (const sub of subDirs) {
    const fullSub = path.join(READY, sub);
    if (!fs.existsSync(fullSub)) continue;
    const findMp4 = (dir) => {
      let results = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, item.name);
        if (item.isDirectory()) results = results.concat(findMp4(p));
        else if (item.isFile() && item.name.endsWith(".mp4")) results.push(p);
      }
      return results;
    };
    const mp4s = findMp4(fullSub);
    for (const f of mp4s) {
      const dest = path.join(READY, path.basename(f));
      try {
        fs.renameSync(f, dest);
        console.log(`[Flatten] Moved: ${f} -> ${dest}`);
      } catch (e) {
        console.error(`[Flatten] Error moving ${f}:`, e.message);
      }
    }
    try {
      fs.rmSync(fullSub, { recursive: true, force: true });
      console.log(`[Flatten] Removed subfolder: ${fullSub}`);
    } catch {}
  }
}

async function run() {
  console.log("Render queue initialized. Checking if another render is active...");
  let waitCount = 0;
  while (isRenderActive()) {
    if (waitCount % 12 === 0) {
      console.log(`[Queue] Waiting for current render (PID in .tmp/render.lock) to complete... (${waitCount * 5}s elapsed)`);
    }
    waitCount++;
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("\nLock released! Starting sequential renders for 5 stream clips now...");

  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    console.log(`\n========================================`);
    console.log(`[${i + 1}/${clips.length}] Rendering: ${c.title}`);
    console.log(`Target: ${c.out}`);
    console.log(`========================================`);
    try {
      execFileSync("node", ["tools/render_final.mjs", c.id, c.out, c.title], {
        stdio: "inherit"
      });
      console.log(`[Queue] Successfully rendered: ${c.title}`);
    } catch (err) {
      console.error(`[Queue] Error rendering ${c.title}:`, err.message);
    }
  }

  // Strictly enforce flat READY folder
  flattenReadyFolder();

  console.log("\nAll 5 stream clips finished. Running clean_temp...");
  try {
    execFileSync("node", ["tools/clean_temp.mjs"], { stdio: "inherit" });
  } catch (e) {
    console.error("clean_temp error:", e.message);
  }
  console.log("=== ALL 5 STREAM CLIPS RENDER QUEUE COMPLETED ===");
}

run();
