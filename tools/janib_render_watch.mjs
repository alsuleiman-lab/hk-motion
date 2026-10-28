// Mirrors a chunked render's TRUE overall progress into a Janib card (janib_watch.mjs showed only the current part's %, so the card looked stuck at 1%).
// Usage: node tools/janib_render_watch.mjs <logfile> <cardId> [<logfile2> ...]   — with several logs (landscape then portrait) it averages them.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const [id0, ...rest] = [process.argv[3], ...process.argv.slice(4)];
const logs = [process.argv[2], ...rest.filter(Boolean)].filter((x) => x && x !== id0 || x === process.argv[2]);
const id = process.argv[3];
const files = [process.argv[2], ...process.argv.slice(4)];
const pct = (f) => {
  try {
    const t = fs.readFileSync(f, "utf8");
    if (/DONE/.test(t)) return 100;
    const m = [...t.matchAll(/\[جزء (\d+)\/(\d+)\] (\d+)%/g)].pop();
    if (!m) return /الصوت جاهز|الفحص/.test(t) ? 97 : 0;
    const [, i, n, p] = m.map(Number);
    return Math.min(96, ((i - 1) * 100 + p) / n);
  } catch { return 0; }
};
let last = -1;
for (;;) {
  const p = Math.round(files.reduce((s, f) => s + pct(f), 0) / files.length);
  if (p !== last) {
    last = p;
    spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:/Users/mshms/AppData/Local/Programs/Janib/resources/janib.ps1", "-Action", "update", "-Id", id, "-Progress", String(p)], { windowsHide: true });
  }
  if (p >= 100) break;
  await new Promise((r) => setTimeout(r, 15000));
}
