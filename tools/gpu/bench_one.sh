#!/bin/bash
# One span, reference (hybrid_any) vs GPU renderer, same dumps, then compare:
#   bash tools/gpu/bench_one.sh <tag> <comp> <start> <end> "<frames to compare, comma>" [extra args for BOTH, e.g. --under 2634-2787]
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
tag=$1; comp=$2; a=$3; b=$4; cf=$5; shift 5; extra="$*"
d=.tmp/gpu_render/bench/$tag; rm -rf "$d"; mkdir -p "$d/ref" "$d/gpu" "$d/cmp"
dump=""; for f in ${cf//,/ }; do dump="$dump,$((f - 1)),$f,$((f + 1))"; done; dump=${dump#,}
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
node tools/hybrid_any.mjs --comp "$comp" --start "$a" --end "$b" --out "$d/ref.mp4" --dump "$d/ref:$dump" --no-bumper $extra > "$d/ref.log" 2>&1
ls -t render_work/hybrid_any_${comp}_*.json | head -1 | xargs -I{} cp {} "$d/ref_report.json"
GR_DUMP_PREFIX=hy node tools/gpu_render.mjs --comp "$comp" --start "$a" --end "$b" --out "$d/gpu.mp4" --dump "$d/gpu:$dump" --no-bumper --procs 1 --windows 3 $extra > "$d/gpu.log" 2>&1
ls -t render_work/gpu_render_${comp}_*.json | head -1 | xargs -I{} cp {} "$d/gpu_report.json"
$PY -I tools/gpu/compare_frames.py --ref "$d/ref" --test "$d/gpu" --test-prefix hy --out "$d/cmp" --frames "$cf" 2>&1 | tail -1 | cut -c1-260
grep -a "ERROR\|WARNING\|FATAL" "$d/gpu.log" | head -3
