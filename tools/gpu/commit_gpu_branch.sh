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
# nothing under src/ is ever committed here: the GPU renderer needs no change in the compositions (other sessions edit src/ in this tree)
for f in tools/gpu/*; do case "$f" in *__pycache__*|*render_job.gpu.sh|*.dll) ;; *) git add -f "$f";; esac; done
[ -f tools/gpu/render_job.gpu.sh ] && { blob=$(git hash-object -w tools/gpu/render_job.gpu.sh); git update-index --add --cacheinfo 100755,"$blob",tools/render_job.sh; }
t=$(git write-tree)
if [ "$t" = "$(git rev-parse "$parent^{tree}")" ]; then echo "nothing to commit"; rm -f "$GIT_INDEX_FILE"; exit 0; fi
c=$(printf '%s\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n' "$msg" | git commit-tree "$t" -p "$parent")
git update-ref refs/heads/gpu-render "$c" "$parent"
rm -f /s/AI_Tools/Remotion_Workspace/.tmp/gpu_render/tmp_index_commit
git log --oneline -1 "$c"; git diff --stat "$parent" "$c" | tail -1
