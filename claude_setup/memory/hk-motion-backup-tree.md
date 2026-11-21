---
name: hk-motion-backup-tree
description: HK-Motion is the main Remotion since 2026-11-20; the backup worktree Remotion_Workspace_next was deleted that day — all work goes to main
metadata:
  node_type: memory
  type: project
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-20T17:03:49.025Z
---

HK-Motion was built from 2026-11-19 on a backup worktree `S:\AI_Tools\Remotion_Workspace_next` (branch `next-cut`). On **2026-11-20** the user ordered «تجعل هذا هو الريموشن الأساسي»: main was fast-forwarded to it without switching branches in the shared tree.

Later the same day, after the episode «مفتي الأردن والحرابة» was approved, the user ordered the backup tree deleted («إذا ما عاد تلزم نحذفها إجباري»). Before deleting:
- the files only it had were copied into main: `src/ext/AnimeDuel*.tsx`, `DuelWarrior.tsx`, the cut maps in `public/*_map.json`, `data/youtube/*`, the newer `episodes.json` and `hk_gallery.json`, and a cover-log line;
- its 25 junctions pointing into main (`node_modules`, `public/fawasel`, …) were unlinked first, so the deletion could not reach main;
- `git worktree prune` was run afterwards.

The `next-cut` branch ref is kept only as history.

**Why:** a recursive delete of a tree with junctions into main can wipe main's folders.

**How to apply:**
- All work goes to `S:\AI_Tools\Remotion_Workspace` (main).
- Before deleting any folder in this workspace, list its links first; unlink them, then delete.
- Episode data is deleted with `node tools/project.mjs clean <p>` (dry run, then `--yes`), never by hand; see [[remotion-shared-git-tree]].
