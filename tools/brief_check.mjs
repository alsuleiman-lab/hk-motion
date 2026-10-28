// Is MONTAGE_BRIEF.md still in step with the rule files it summarises? (user order 2026-10-25: the brief is read instead of the full PREFERENCES.md)
//   node tools/brief_check.mjs           OK (exit 0) or STALE + which source changed since the brief was last stamped (exit 1)
//   node tools/brief_check.mjs --stamp   after updating MONTAGE_BRIEF.md to match the sources: record their current fingerprints
// The guard hook (tools/hooks/guard.mjs prompt) adds a warning to every montage prompt while the brief is stale.
import fs from "node:fs";
import crypto from "node:crypto";

const SOURCES = ["PREFERENCES.md", "WORKFLOW_CHECKLIST.md", ".claude/skills/video-montage/critical-rules.md", ".claude/skills/video-montage/SKILL.md"];
const STAMP = "tools/brief_stamp.json";
const sha = (f) => { try { return crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex"); } catch { return "missing"; } };
const now = Object.fromEntries(SOURCES.map((f) => [f, sha(f)]));

if (process.argv.includes("--stamp")) {
  fs.writeFileSync(STAMP, JSON.stringify({ stamped: new Date().toISOString(), brief: sha("MONTAGE_BRIEF.md"), sources: now }, null, 1) + "\n");
  console.log("brief stamped");
  process.exit(0);
}
let old = null; try { old = JSON.parse(fs.readFileSync(STAMP, "utf8")); } catch { /* never stamped */ }
const changed = old ? SOURCES.filter((f) => old.sources?.[f] !== now[f]) : SOURCES;
if (!changed.length) { console.log("brief OK"); process.exit(0); }
console.log(`brief STALE: ${changed.join(", ")} changed after ${old?.stamped ?? "(never stamped)"} — update MONTAGE_BRIEF.md from the changed lines, then node tools/brief_check.mjs --stamp`);
process.exit(1);
