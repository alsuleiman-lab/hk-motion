// Send measured Remotion progress to Janib in order over its named pipe.
// The caller logs [جزء i/n] p% and DONE; no AI-estimated percentages are used.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { sendJanib } from "./janib_client.mjs";

const slug = (value) => value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "render";

export function startMonitor(logFile, title, stableId) {
  const name = title || "فيديو";
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, "");
  if (process.env.RENDER_WINDOW === "1") {
    spawn("powershell", ["-STA", "-ExecutionPolicy", "Bypass", "-File", path.resolve("tools/render_monitor.ps1"), "-Log", path.resolve(logFile), "-Title", name], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  }

  const id = stableId || ("render-" + slug(path.basename(logFile, path.extname(logFile)) + "-" + name));
  let last = -1;
  let lastLine = Date.now();
  let done = false;
  let pending = Promise.resolve();
  let lastErrorAt = 0;
  const send = (request) => {
    pending = pending.then(() => sendJanib(request)).catch((error) => {
      if (Date.now() - lastErrorAt > 30000) {
        console.warn("تعذر تحديث بطاقة Janib:", error.message);
        lastErrorAt = Date.now();
      }
    });
    return pending;
  };

  const completionBody = (line) => {
    const out = line.replace(/^DONE\s+/, "").trim();
    try {
      const size = (fs.statSync(out).size / (1024 * 1024)).toFixed(1);
      return `اكتمل الرندر • ${size} MB • ${path.dirname(out)}\n${path.basename(out)}`;
    } catch {
      return "اكتمل الرندر";
    }
  };

  send({ action: "notify", notification: { id, source: "Remotion", title: name, body: "بدأ الرندر", kind: "progress", progress: 0 } });
  const update = (progress, body) => send({ action: "update", id, progress, body });
  const stall = setInterval(() => {
    const idleMinutes = Math.floor((Date.now() - lastLine) / 60000);
    if (!done && idleMinutes >= 5) update(Math.max(last, 0), `لا تقدّم في سجل الرندر منذ ${idleMinutes} دقائق`);
  }, 60000);
  stall.unref();

  return (line) => {
    console.log(line);
    fs.appendFileSync(logFile, line + "\n");
    lastLine = Date.now();
    let progress = null;
    const part = line.match(/\[جزء (\d+)\/(\d+)\]\s*(\d+)%/);
    let completedBody = "اكتمل الرندر";
    if (part) {
      const [, index, count, percent] = part.map(Number);
      progress = Math.min(96, ((index - 1) * 100 + percent) / count);
    } else if (/\bDONE\b/.test(line)) {
      progress = 100;
      done = true;
      completedBody = completionBody(line);
      clearInterval(stall);
    } else {
      const match = line.match(/(\d+)%/);
      if (match) progress = Math.min(96, Number(match[1]));
    }
    if (progress === null) return;
    progress = Math.round(progress);
    if (progress !== last) {
      last = progress;
      update(progress, done ? completedBody : `${progress}%`);
    }
    if (done) send({ action: "archive", id });
  };
}
