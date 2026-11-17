// Off-machine backup (user 2026-10-28: «ترفع عليه حتى ما يضيع من عندنا شيء»).
// A SEPARATE small git store (S:/AI_Tools/Remotion_Workspace_backup.git, work tree = this folder) that holds only the code, tools, data, rules and skills (~20 MB),
// never the media. It exists apart from the workspace's own .git because that one grew to 22 GB of packs that concurrent `git gc` runs from several sessions corrupted twice;
// gc is switched off there and here. Each run commits what changed and pushes the history to the `backup` remote of the backup store.
//   node tools/backup_push.mjs          commit what changed, push to the remote (if one is set)
//   node tools/backup_push.mjs --dry    only show what would be committed
// One-time setup by the user (needs their GitHub login): create an EMPTY PRIVATE repo, then
//   git --git-dir=S:/AI_Tools/Remotion_Workspace_backup.git remote add backup <url>
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd()).split(path.sep).join("/"), BK = "S:/AI_Tools/Remotion_Workspace_backup.git";
const dry = process.argv.includes("--dry");
const git = (...a) => { const r = spawnSync("git", [`--git-dir=${BK}`, `--work-tree=${ROOT}`, "-c", "user.name=mshms", "-c", "user.email=alsuleimanmohammed@gmail.com", ...a], { encoding: "utf8", windowsHide: true, cwd: ROOT }); return { ok: r.status === 0, out: ((r.stdout || "") + (r.stderr || "")).trim() }; };
if (!fs.existsSync(path.join(BK, "HEAD"))) {
  git("init", "-q", "-b", "main");
  for (const [k, v] of [["core.bare", "false"], ["core.worktree", ROOT], ["gc.auto", "0"], ["gc.autoDetach", "false"], ["maintenance.auto", "false"], ["core.autocrlf", "false"]]) git("config", k, v);
  fs.mkdirSync(path.join(BK, "info"), { recursive: true });
  fs.writeFileSync(path.join(BK, "info", "exclude"), ".claude/worktrees/\n.claude/settings.local.json\n.codex-*/\n*.wav\n*.mp4\n*.exe\n");
  console.log("created", BK);
}
// the code and the rules, not the media (public/, models/, scratch/, render_work/ … stay out)
git("add", "-A", "--", "src", "tools", "data", ".claude", "rules_registry", "CLAUDE.md", "AGENTS.md", "القواعد_العامة.md", "شجرة_العمليات.md", "STYLE_REFERENCES.md", "package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "eslint.config.mjs", ".gitignore", "skills-lock.json", "effects_catalog.html");
const staged = git("diff", "--cached", "--name-only").out.split("\n").filter(Boolean);
console.log(`${staged.length} changed file(s)`);
if (dry) process.exit(0);
if (staged.length) { const c = git("commit", "-q", "-m", `Backup ${new Date().toISOString()}\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`); console.log(c.ok ? "committed" : "✘ commit failed: " + c.out); if (!c.ok) process.exit(1); }
if (!git("remote").out.split("\n").includes("backup")) { console.log("• committed locally only: no `backup` remote yet (create an empty PRIVATE GitHub repo, then  git --git-dir=" + BK + " remote add backup <url>)"); process.exit(0); }
const p = git("push", "-u", "backup", "main");
console.log(p.ok ? "✔ pushed to backup/main" : "✘ push failed: " + p.out.split("\n").slice(-3).join(" | "));
process.exit(p.ok ? 0 : 1);
