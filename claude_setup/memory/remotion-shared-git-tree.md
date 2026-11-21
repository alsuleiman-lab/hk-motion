---
name: remotion-shared-git-tree
description: Never git checkout/switch branches in S:\AI_Tools\Remotion_Workspace — other Claude sessions commit to main in the same folder at the same time
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-12T13:48:03.379Z
---

S:\AI_Tools\Remotion_Workspace is ONE working tree shared by several concurrent sessions (montage editing, rendering queue, etc.) that commit to `main` with broad adds. Switching its branch (`git checkout -b X`) makes their commits land on X and sweeps your untracked files into their commits.

**Why:** 2026-11-12, `git checkout -b gpu-render` there sent three saint_rambal/fatima commits of another session into gpu-render; had to rebuild main and the branch with plumbing (backup ref `backup/gpu-render-mixed-20261112`).

**How to apply:** keep the shared tree on `main`. Commit side-branch work with a temporary index (`GIT_INDEX_FILE=... git read-tree/add/write-tree/commit-tree/update-ref`; helper `tools/gpu/commit_gpu_branch.sh` on branch gpu-render), list your new paths in `.git/info/exclude` (git dir: S:/AI_Tools/Remotion_Workspace_backup.git) and `--skip-worktree` any tracked file you change, so their adds can't pick them up. Also expect the specs/cuts (e.g. saint_rambal cut b5→b10) and the render queue to change under you. Related: [[gpu-render-engine]]
