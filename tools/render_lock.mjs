// ONE render at a time, for EVERY render entry point (render_final, render_clip, …). User order 2026-10-22; review fix: the lock is created EXCLUSIVELY (flag "wx"), so two
// processes starting together cannot both get it. A dead owner (stale PID) is taken over. Usage: import { acquireRenderLock } from "./render_lock.mjs"; acquireRenderLock("اسم المهمة");
import fs from "node:fs";
const LOCK = ".tmp/render.lock";
const alive = (pid) => { if (!pid || pid === process.pid) return false; try { process.kill(pid, 0); return true; } catch { return false; } };
export function acquireRenderLock(label = "") {
  fs.mkdirSync(".tmp", { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const fd = fs.openSync(LOCK, "wx");                       // fails if it exists → atomic
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, label, at: new Date().toISOString() })); fs.closeSync(fd);
      const unlock = () => { try { const o = JSON.parse(fs.readFileSync(LOCK, "utf8")); if (o.pid === process.pid) fs.unlinkSync(LOCK); } catch { /* ignore */ } };
      process.on("exit", unlock); process.on("SIGINT", () => process.exit(130)); process.on("SIGTERM", () => process.exit(143));
      return unlock;
    } catch {
      let owner = {}; try { const raw = fs.readFileSync(LOCK, "utf8"); owner = raw.trim().startsWith("{") ? JSON.parse(raw) : { pid: Number(raw) }; } catch { /* unreadable */ }
      if (alive(owner.pid)) { console.error(`ممنوع رندر مقطعين معاً: رندر آخر يعمل (PID ${owner.pid}${owner.label ? "، " + owner.label : ""}). انتظر انتهاءه ثم أعد التشغيل.`); process.exit(3); }
      try { fs.unlinkSync(LOCK); } catch { /* raced: retry */ }
    }
  }
  console.error("تعذّر الحصول على قفل الرندر"); process.exit(3);
}
