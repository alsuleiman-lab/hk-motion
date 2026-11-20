// RELOAD THE TOOLS SERVER WITHOUT TOUCHING THE STUDIO (user 2026-11-20, a blank Studio page while it was restarted under him: «يجب أن لا يختفي»).
// The Studio page reloads its own code (src/*.ts) by itself; only tools/hk_server.mjs (the HK row's server, Studio port + 99) needs a restart after it changes.
// This stops the old server on that port and starts the new one bound to the same Studio process — the page he is watching never goes away.
//   node tools/hk_restart.mjs [studioPort=3200]
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sp = Number(process.argv[2] ?? 3200), hp = sp + 99;
const listener = (port) => {
  const out = spawnSync("netstat", ["-ano", "-p", "TCP"], { encoding: "utf8", windowsHide: true }).stdout ?? "";
  const l = out.split(/\r?\n/).find((x) => new RegExp(`:${port}\\s+\\S+\\s+LISTENING\\s+\\d+`).test(x));
  return l ? Number(l.trim().split(/\s+/).pop()) : 0;
};
const studio = listener(sp);
if (!studio) { console.error(`✘ لا استوديو على المنفذ ${sp}`); process.exit(1); }
const old = listener(hp);
if (old) spawnSync("taskkill", ["/PID", String(old), "/F"], { windowsHide: true });
for (let i = 0; i < 20 && listener(hp); i++) await new Promise((r) => setTimeout(r, 150));
const ch = spawn(process.execPath, [path.join(ROOT, "tools", "hk_server.mjs"), String(hp), String(studio)], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true });
ch.unref();
for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 150)); try { if ((await fetch(`http://127.0.0.1:${hp}/api/ping`)).ok) { console.log(`✔ أُعيد خادم الأدوات على ${hp} (الاستوديو ${studio} لم يُمس)`); process.exit(0); } } catch { /* starting */ } }
console.error("✘ لم يجب خادم الأدوات الجديد"); process.exit(1);
