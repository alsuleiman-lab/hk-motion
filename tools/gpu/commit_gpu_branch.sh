#!/bin/bash
# Commit the GPU-renderer files to branch gpu-render WITHOUT switching the shared working tree's branch (other sessions commit to main in this
# same folder: `git checkout` here once sent their commits into gpu-render, 2026-11-12). Uses a temporary index; the shared index is untouched.
#   bash tools/gpu/commit_gpu_branch.sh "message"
set -e
cd /s/AI_Tools/Remotion_Workspace
msg="$1"; test -n "$msg" || { echo "usage: commit_gpu_branch.sh \"message\""; exit 2; }
export GIT_INDEX_FILE=/s/AI_Tools/Remotion_Workspace/.tmp/gpu_render/tmp_index_commit
rm -f /s/AI_Tools/Remotion_Workspace/.tmp/gpu_render/tmp_index_commit
parent=$(git rev-parse refs/heads/gpu-render)
git read-tree "$parent"
git add -f tools/gpu_render.mjs tools/gpu_compositor.py docs/gpu_render_report.md docs/gpu_render 2>/dev/null || true
git add -f tools/gpu_render.mjs tools/gpu_compositor.py
# src/hybrid/Slot.tsx is skip-worktree in the shared index: hash the working-tree file explicitly
blob=$(git hash-object -w src/hybrid/Slot.tsx); git update-index --add --cacheinfo 100644,"$blob",src/hybrid/Slot.tsx
for f in tools/gpu/*; do case "$f" in *__pycache__*|*.dll) ;; *) git add -f "$f";; esac; done
[ -f tools/render_job.sh.gpu ] && { blob=$(git hash-object -w tools/render_job.sh.gpu); git update-index --add --cacheinfo 100755,"$blob",tools/render_job.sh; }
t=$(git write-tree)
if [ "$t" = "$(git rev-parse "$parent^{tree}")" ]; then echo "nothing to commit"; rm -f "$GIT_INDEX_FILE"; exit 0; fi
c=$(printf '%s\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n' "$msg" | git commit-tree "$t" -p "$parent")
git update-ref refs/heads/gpu-render "$c" "$parent"
rm -f /s/AI_Tools/Remotion_Workspace/.tmp/gpu_render/tmp_index_commit
git log --oneline -1 "$c"; git diff --stat "$parent" "$c" | tail -1
