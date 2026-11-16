#!/bin/bash
# usage: tools/hybrid_verify.sh <CompId> "f1,f2,..."  — hybrid single-frame renders vs normal Remotion stills (needs refs in render_work/hybrid_test/v/ref_NNNNNN.png: node tools/hybrid_baseline.mjs --comp ID --stills "dir:frames")
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh
for f in ${2//,/ }; do
  n=$(printf %06d $f)
  node tools/hybrid_any.mjs --comp "$1" --out render_work/hybrid_test/b.mp4 --start $f --end $f --dump "S:/AI_Tools/Remotion_Workspace/render_work/hybrid_test:$f" >/dev/null 2>&1
  echo -n "$f: "; /s/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe tools/hybrid_diff.py render_work/hybrid_test/hy_$n.png render_work/hybrid_test/v/ref_$n.png
done
