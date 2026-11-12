#!/bin/bash
# Quick throughput/CPU matrix of the GPU renderer on one span:  bash tools/gpu/try_configs.sh <start> <end> "procs:windows" ...
# Prints the compositor fps, the whole-run fps, the machine CPU (report) and the CPU of the render's own processes (sampled mid-run).
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
a=$1; b=$2; shift 2
for c in "$@"; do
  IFS=: read -r P Wn <<<"$c"
  log=.tmp/gpu_render/cfg_${P}x${Wn}.log
  (timeout 900 node tools/gpu_render.mjs --comp SaintRambal-L --bundle .tmp/gpu_render/bundle_keep_SaintRambal-L --start $a --end $b --procs $P --windows $Wn --out .tmp/gpu_render/cfg.mp4 $GR_EXTRA > $log 2>&1 &)
  for i in $(seq 1 90); do grep -q "frame 300/" $log 2>/dev/null && break; grep -q "ERROR\|stopped" $log 2>/dev/null && break; sleep 1; done
  own=$(powershell -NoProfile -File tools/gpu/cpu_by_process.ps1 -Seconds 5 | grep -E "electron|python|ffmpeg|^total" | tr '\n' ' ')
  for i in $(seq 1 300); do grep -q "DONE →\|ERROR\|stopped" $log && break; sleep 2; done
  rep=$(ls -t render_work/gpu_render_SaintRambal-L_*.json | head -1)
  echo "== ${P}x${Wn}: $(grep -a 'DONE [0-9]* frames' $log | cut -c1-60) | $(node -e "const j=require('./$rep');console.log('run fps',j.fpsGraphicsPlusComposite,'machine cpu',j.cpuDuringRender&&j.cpuDuringRender.mean,'gpu',j.gpuDuringRender.util&&j.gpuDuringRender.util.mean)")"
  echo "   $(grep -a GRAPHICS $log | cut -c10-200)"
  echo "   own: $own"
done
