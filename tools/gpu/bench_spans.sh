#!/bin/bash
# Benchmark + match check of the GPU renderer against the hybrid on the three reference spans of SaintRambal-L (quiet / isolation / busy).
# For each span: hybrid_any (reference, dumps) then gpu_render (same dumps) back to back, then tools/gpu/compare_frames.py.
# The spec hash is recorded before and after each pair (the project is edited by other sessions: a pair whose spec changed is flagged).
#   bash tools/gpu/bench_spans.sh <tag> [comp=SaintRambal-L] [gpu args...]      -> .tmp/gpu_render/bench/<tag>/
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
tag=${1:-run}; comp=${2:-SaintRambal-L}; shift 2 2>/dev/null; extra="$*"
spec=data/specs/saint_rambal.json
B=.tmp/gpu_render/bench/$tag; mkdir -p "$B"
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
frames() { local a=$1 s=""; for k in 0 1 2 3 4 5 6 7 8 9; do f=$((a + 10 + 60 * k)); s="$s,$((f - 1)),$f,$((f + 1))"; done; echo "${s#,}"; }
centres() { local a=$1 s=""; for k in 0 1 2 3 4 5 6 7 8 9; do s="$s,$((a + 10 + 60 * k))"; done; echo "${s#,}"; }
for span in quiet:9000:9599 iso:600:1199 busy:19200:19799; do
  IFS=: read -r name a b <<<"$span"
  d="$B/$name"; mkdir -p "$d/ref" "$d/gpu" "$d/cmp"
  h0=$(sha1sum "$spec" | cut -c1-12)
  if [ ! -f "$d/ref/done" ]; then
    node tools/hybrid_any.mjs --comp "$comp" --start "$a" --end "$b" --out "$d/ref.mp4" --dump "$d/ref:$(frames "$a")" --no-bumper > "$d/ref.log" 2>&1 && touch "$d/ref/done"
    ls -t render_work/hybrid_any_${comp}_*.json | head -1 | xargs -I{} cp {} "$d/ref_report.json"
  fi
  GR_DUMP_PREFIX=hy node tools/gpu_render.mjs --comp "$comp" --start "$a" --end "$b" --out "$d/gpu.mp4" --dump "$d/gpu:$(frames "$a")" --no-bumper $extra > "$d/gpu.log" 2>&1
  ls -t render_work/gpu_render_${comp}_*.json | head -1 | xargs -I{} cp {} "$d/gpu_report.json"
  h1=$(sha1sum "$spec" | cut -c1-12)
  $PY -I tools/gpu/compare_frames.py --ref "$d/ref" --test "$d/gpu" --test-prefix hy --out "$d/cmp" --frames "$(centres "$a")" > "$d/cmp.log" 2>&1
  echo "$name spec $h0 -> $h1 $( [ "$h0" = "$h1" ] && echo same || echo CHANGED )  $(tail -1 "$d/cmp.log" | cut -c1-200)"
  node -e "const r=(f)=>{try{return require('./'+f)}catch{return null}};const R=r('$d/ref_report.json'),G=r('$d/gpu_report.json');const s=(j)=>j?{fps:j.fpsGraphicsPlusComposite,cpu:j.cpuDuringRender&&j.cpuDuringRender.mean,gpu:j.gpuDuringRender.util&&j.gpuDuringRender.util.mean,min:j.totalMinutes}:null;console.log('  ref',JSON.stringify(s(R)),'\n  gpu',JSON.stringify(s(G)))"
done
