import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

const queue = [
  {
    id: "Clip4ThronePortrait",
    out: "C:/Users/mshms/Videos/جاهز/المخلوق_الوحيد_فوق_العرش.mp4",
    title: "المخلوق الوحيد فوق العرش",
  },
  {
    id: "Clip3SunrisePortrait",
    out: "C:/Users/mshms/Videos/جاهز/هل_تشرق_الشمس_أم_تشرق_الأرض.mp4",
    title: "هل تشرق الشمس أم تشرق الأرض",
  },
  {
    id: "Clip5TaslamPortrait",
    out: "C:/Users/mshms/Videos/جاهز/قول_لا_نريدك_أن_تسلم_خطير_لا_يجوز.mp4",
    title: "قول لا نريدك أن تسلم خطير لا يجوز",
  },
  {
    id: "Clip1SunPortrait",
    out: "C:/Users/mshms/Videos/جاهز/سراج_حياني_يرد_على_نفسه_في_جريان_الشمس.mp4",
    title: "سراج يرد على نفسه في جريان الشمس",
  },
];

const LOCK = ".tmp/render.lock";

function isLocked() {
  if (!fs.existsSync(LOCK)) return false;
  try {
    const raw = fs.readFileSync(LOCK, "utf8");
    const owner = raw.trim().startsWith("{") ? JSON.parse(raw) : { pid: Number(raw) };
    if (!owner.pid) return false;
    // Check if alive
    process.kill(owner.pid, 0);
    return owner;
  } catch {
    return false;
  }
}

function waitLock() {
  while (true) {
    const owner = isLocked();
    if (!owner) {
      // Remove stale lock if any
      try {
        if (fs.existsSync(LOCK)) fs.unlinkSync(LOCK);
      } catch {}
      break;
    }
    console.log(`Waiting for existing render to finish: PID ${owner.pid} (${owner.label ?? "render"})...`);
    // Sleep 10s
    spawnSync("powershell", ["-Command", "Start-Sleep -Seconds 10"]);
  }
}

console.log(`=== STARTING RENDER QUEUE FOR ${queue.length} APPROVED CLIPS ===`);

for (let i = 0; i < queue.length; i++) {
  const item = queue[i];
  console.log(`\n--------------------------------------------------`);
  console.log(`[${i + 1}/${queue.length}] Preparing: ${item.title} (${item.id})`);
  console.log(`Target: ${item.out}`);
  
  waitLock();
  
  console.log(`Lock acquired. Launching render_final.mjs...`);
  try {
    execFileSync(
      "node",
      ["tools/render_final.mjs", item.id, item.out, item.title],
      { stdio: "inherit" }
    );
    console.log(`✅ [${i + 1}/${queue.length}] Successfully rendered: ${item.out}`);
  } catch (err) {
    console.error(`❌ Error rendering ${item.id}:`, err);
    process.exit(1);
  }
}

console.log("\n==================================================");
console.log("🎉 ALL 4 APPROVED CLIPS RENDERED SUCCESSFULLY!");
console.log("==================================================");
