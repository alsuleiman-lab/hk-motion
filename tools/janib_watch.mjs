// Mirrors a render log's last "NN%" into a Janib progress card. Usage: node tools/janib_watch.mjs <logfile> <cardId> "<title label>"
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const [log, id, label = "render"] = process.argv.slice(2);
let last = -1;
for (;;) {
  try {
    const txt = fs.readFileSync(log, "utf8");
    const m = [...txt.matchAll(/(\d+)%/g)].pop();
    const done = /DONE/.test(txt);
    const p = done ? 100 : m ? Number(m[1]) : 0;
    if (p !== last) {
      last = p;
      spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:/Users/mshms/AppData/Local/Programs/Janib/resources/janib.ps1", "-Action", "update", "-Id", id, "-Progress", String(p), "-Title", `${label} ${p}%`, "-Body", `${p}%`], { windowsHide: true });
    }
    if (done) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 15000));
}
