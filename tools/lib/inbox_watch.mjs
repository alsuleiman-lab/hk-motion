// THE INBOX WATCHER IS PART OF THE STUDIO (user 2026-11-21: «المراقب اجعله جزء لا يتجزأ من الاستوديو» — four «راسلني» notes sat unread because no watcher ran).
// Every tools server of a Studio (tools/hk_server.mjs) registers itself in .tmp/hk_studio/<port>.json; the watcher (tools/hk_inbox.mjs wait) beats in
// .tmp/hk_inbox_watch.json every 3 s and lives exactly as long as a Studio does. The Stop hook (tools/hooks/guard.mjs stop) refuses to let the session
// go idle while a Studio is up and no watcher beats, and the «راسلني» sheet shows whether the agent is listening.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const STUDIO_DIR = path.join(ROOT, ".tmp", "hk_studio");
export const WATCH_F = path.join(ROOT, ".tmp", "hk_inbox_watch.json");
export const INBOX_F = path.join(ROOT, ".tmp", "hk_inbox.jsonl");

export const pidAlive = (n) => { try { process.kill(Number(n), 0); return Number(n) > 0; } catch (e) { return e.code === "EPERM"; } };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };

/** the Studios up now: [{pid, port, studioPid, at}] (stale registrations of dead servers are removed) */
export function studiosAlive() {
  let names = []; try { names = fs.readdirSync(STUDIO_DIR).filter((n) => n.endsWith(".json")); } catch { return []; }
  const out = [];
  for (const n of names) {
    const f = path.join(STUDIO_DIR, n), s = readJson(f);
    if (s && pidAlive(s.pid)) out.push(s); else { try { fs.rmSync(f, { force: true }); } catch { /* another reader */ } }
  }
  return out;
}

export function registerStudio(port, studioPid) {
  fs.mkdirSync(STUDIO_DIR, { recursive: true });
  const f = path.join(STUDIO_DIR, `${port}.json`);
  fs.writeFileSync(f, JSON.stringify({ pid: process.pid, port, studioPid, at: new Date().toISOString() }));
  const drop = () => { try { const s = readJson(f); if (s?.pid === process.pid) fs.rmSync(f, { force: true }); } catch { /* gone */ } };
  process.on("exit", drop);
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { drop(); process.exit(0); });
}

/** a watcher beats: its process lives and its last beat is under 20 s old */
export function watcherAlive() {
  const w = readJson(WATCH_F);
  return !!w && pidAlive(w.pid) && Date.now() - Number(w.beat) < 20e3;
}
export const beat = () => { try { fs.mkdirSync(path.dirname(WATCH_F), { recursive: true }); fs.writeFileSync(WATCH_F, JSON.stringify({ pid: process.pid, beat: Date.now() })); } catch { /* next beat */ } };
export const unbeat = () => { try { if (readJson(WATCH_F)?.pid === process.pid) fs.rmSync(WATCH_F, { force: true }); } catch { /* gone */ } };

export const openMessages = () => { try { return fs.readFileSync(INBOX_F, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((m) => !m.reply); } catch { return []; } };
