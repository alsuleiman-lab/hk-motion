// Stop the hidden background ComfyUI (frees VRAM): node tools/comfy_stop.mjs
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const ps = spawnSync("powershell", ["-NoProfile", "-Command", "(Get-NetTCPConnection -LocalPort 8188 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"], { encoding: "utf8", windowsHide: true });
const pid = (ps.stdout || "").trim() || (fs.existsSync(".tmp/comfy.pid") ? fs.readFileSync(".tmp/comfy.pid", "utf8").trim() : "");
if (!pid) { console.log("ComfyUI غير شغّال"); process.exit(0); }
spawnSync("taskkill", ["/PID", pid, "/T", "/F"], { windowsHide: true });
console.log("أُوقف ComfyUI (pid " + pid + ")");
