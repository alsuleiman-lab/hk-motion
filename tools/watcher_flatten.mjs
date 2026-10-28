// Continuous flattener to ensure every exported video is directly in C:/Users/mshms/Videos/جاهز with no subdirectories.
import fs from "node:fs";
import path from "node:path";

const READY = "C:/Users/mshms/Videos/جاهز";

function flatten() {
  const subDirs = ["طولي", "عرضي"];
  for (const s of subDirs) {
    const full = path.join(READY, s);
    if (!fs.existsSync(full)) continue;

    const findMp4 = (dir) => {
      let results = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, item.name);
        if (item.isDirectory()) results = results.concat(findMp4(p));
        else if (item.isFile() && item.name.endsWith(".mp4")) results.push(p);
      }
      return results;
    };

    const mp4s = findMp4(full);
    for (const f of mp4s) {
      // Check if file is still being written to by seeing if it can be opened with write lock or size is stable
      const dest = path.join(READY, path.basename(f));
      try {
        fs.renameSync(f, dest);
        console.log(`[Flatten Watcher] Moved: ${path.basename(dest)} -> جاهز root`);
      } catch {
        // File may be actively writing by render process; wait until next tick
      }
    }

    try {
      // Clean up empty directories
      const cleanEmpty = (d) => {
        for (const item of fs.readdirSync(d, { withFileTypes: true })) {
          if (item.isDirectory()) cleanEmpty(path.join(d, item.name));
        }
        if (fs.readdirSync(d).length === 0) fs.rmdirSync(d);
      };
      cleanEmpty(full);
    } catch {}
  }
}

async function loop() {
  console.log("Flatten watcher running...");
  while (true) {
    try {
      flatten();
    } catch {}
    await new Promise((r) => setTimeout(r, 4000));
  }
}

loop();
