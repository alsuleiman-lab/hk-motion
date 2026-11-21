// IS THIS SESSION GUARDED? (2026-11-20, gta6 analysis; ledger hooks-not-wired-session-folder): a session opened in E:\apps\New remotion ran for hours with
// NOT ONE hook, because Claude Code reads .claude/settings.json of the session folder only. tools/hooks/guard.mjs leaves a beat in <root>/.tmp/hooks_alive.json
// on every run; a session without a beat in the last two minutes is unguarded (tools/montage_kickoff.mjs says so loudly). Pure: reads one file, writes nothing.
import fs from "node:fs";
import path from "node:path";

export const HOOK_BEAT_MS = 120e3;
/** the last beat of the hook under `root` ({at, mode, cwd, session, agent}), or null */
export const hookBeat = (root) => { try { return JSON.parse(fs.readFileSync(path.join(root, ".tmp", "hooks_alive.json"), "utf8")); } catch { return null; } };
/** true when the hook ran under `root` less than two minutes before `now` */
export const hooksAlive = (root, now = Date.now()) => { const hb = hookBeat(root); return !!(hb?.at && now - hb.at < HOOK_BEAT_MS); };
