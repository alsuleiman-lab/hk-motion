#!/bin/bash
# Full render of a montage project with the GPU renderer, the way tools/render_job.sh does it (under-him windows, bumper, judder gate),
# but into a TEST folder (never «جاهز»):   bash tools/gpu/render_project.sh <spec> <CompL> <CompR> <outdir>
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; L=$2; R=$3; out=$4; mkdir -p "$out"
spec=data/specs/$p.json
# the opening bumper goes right before his first greeting with the bumper chosen in the spec (user 2026-11-14, repeated): never at second 0, never random
export BUMPER_AT=$(node tools/bumper_at.mjs $p 2>/dev/null | tail -1); export BUMPER_ID=$(node -e 'try{console.log(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).bumper?.id??"")}catch{console.log("")}'); if node -e 'try{process.exit(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).bumper?.end?0:1)}catch{process.exit(1)}'; then export BUMPER_POSITION=end; export BUMPER_AT=0; fi
cutsrc="public/$(node -e 'console.log(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).cut)')"
read -r cx avoid <<<"$(node -e '
const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));
console.log((s.cams?.[0]?.cx??940)+" "+(s.zooms||[]).map(z=>(z.from-0.5).toFixed(2)+"-"+(z.to+1.6).toFixed(2)).concat((s.shake||[]).map(z=>z.from+"-"+z.to)).join(","));')"
freeat=$(node -e 'const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));const d=s.frames/30;const b=[...(s.zooms||[]),...(s.shake||[])].map(z=>[z.from-0.5,z.to+1.6]).sort((x,y)=>x[0]-y[0]);let best=[0,0],t=0;for(const [a,c] of [...b,[d,d]]){if(a-t>best[1]-best[0])best=[t,a];t=Math.max(t,c)}console.log((best[0]+0.6).toFixed(2))')
while [ -f .tmp/render.lock ] && node -e 'const o=JSON.parse(require("fs").readFileSync(".tmp/render.lock","utf8"));try{process.kill(o.pid,0);process.exit(0)}catch{process.exit(1)}' 2>/dev/null; do sleep 15; done
# (2026-11-15) the lock alone is not enough (another session's render can start between two of mine and fill the card's memory: decode errors, «no painted frame»): before EACH orientation wait until no other gpu_render.mjs runs (twice in a row, 40 s apart)
wait_gpu_free() { local q=0; while [ $q -lt 2 ]; do if powershell -NoProfile -Command "if (Get-CimInstance Win32_Process | Where-Object { \$_.CommandLine -match 'gpu_render.mjs' -and \$_.CommandLine -notmatch '--no-bumper' }) { exit 1 } else { exit 0 }"; then q=$((q+1)); sleep 40; else q=0; sleep 30; fi; done; }
for o in ${GR_ONLY:-L R}; do
  comp=$L; [ $o = R ] && comp=$R
  wait_gpu_free
  free=$(df -BG --output=avail /s | tail -1 | tr -dc 0-9); if [ "$free" -lt ${GR_MIN_FREE_G:-33} ]; then echo "$o: only ${free}G free on S: — not started (needs 25G + ~8G)"; continue; fi
  under=$(node tools/window_frames.mjs $p under $o)
  t0=$(date +%s)
  node tools/gpu_render.mjs --comp $comp --out "$out/$comp.mp4" ${under:+--under "$under"} --procs 1 --windows 3 --name $p > "$out/$o.log" 2>&1
  rc=$?
  echo "$o: exit $rc in $(( $(date +%s) - t0 ))s  $(grep -a 'DONE [0-9]* frames' "$out/$o.log")"
  # (rehearsal 2026-11-21, ledger judder-zero-steps-no-file) a refused / failed render has no file: say WHY (the render's own ✘ lines) and never run the judder
  # check on nothing (it printed «0/0 steps … FAILED (stale/skipped frames)» and blamed frames that were never made)
  if [ $rc != 0 ] || [ ! -f "$out/$comp.mp4" ]; then echo "   ✘ $o: لا ملف — سبب الرندر: $(grep -a '✘\|Error\|refus' "$out/$o.log" | tail -3 | tr '\n' ' ' | cut -c1-400)"; echo "   judder result: not measured (no file)"; continue; fi
  rep=$(ls -t render_work/gpu_render_${comp}_*.json | head -1)
  node -e "const j=require('./$rep');console.log('   ',JSON.stringify({frames:j.frames,totalMin:j.totalMinutes,fps:j.fpsGraphicsPlusComposite,fpsE2E:j.fpsEndToEnd,cpu:j.cpuDuringRender&&j.cpuDuringRender.mean,sizeMB:j.sizeMB,video:j.probe[0],audio:j.probe[1]&&j.probe[1].duration}))"
  chk=".tmp/$(node tools/project.mjs root $p)/bumper_orig/$comp.mp4"; [ -f "$chk" ] || chk=.tmp/bumper_orig/$comp.mp4; [ -f "$chk" ] || chk="$out/$comp.mp4"
  if [ $o = R ]; then sx=$((cx - 163)); crop="--crop 250,300,580,700 --src-crop $sx,169,326,394"; else crop="--crop 700,150,520,520"; fi
  # judder is measured where his face is NOT moved aside by a half-screen element (tools/free_windows.mjs, user 2026-11-15); every window must pass at the same 96 % threshold.
  # No free window (a video of half-screen elements from start to end) → the old evenly spaced windows.
  fw=$(node tools/free_windows.mjs $p 2>/dev/null)
  if [ -n "$fw" ]; then
    ok=1
    for at in $fw; do r=$(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p --at $at --len 90 $crop 2>&1 | grep -a "judder:"); echo "   judder @${at}s: $r"; echo "$r" | grep -q PASSED || ok=0; done
    if [ $ok = 1 ]; then g1="judder: all free windows PASSED"; else g1="judder: FAILED in a free window"; fi
  else
    g1=$(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 10 2>&1 | grep -a "judder:")
  fi
  echo "   judder result: $g1"
  if ! echo "$g1" | grep -q PASSED; then
    echo "   judder 14 windows: $(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 14 2>&1 | grep -a 'judder:')"
    echo "   judder free span:  $(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p --at $freeat --len 90 $crop 2>&1 | grep -a 'judder:')"
  fi
  rm -f "$chk.tmp" 2>/dev/null; [ "$chk" != "$out/$comp.mp4" ] && cp -f "$chk" "$out/${comp}_prebumper.mp4" && rm -f "$chk"   # kept in the output folder: the final review maps the final file to this pre-bumper original (the gate is per project); cleaned at approval
done
# (ledger prerender-gpu-silent-hang) a paused foreign GPU job resumes after the final render — unless the caller renders another orientation right after
# (GPU_KEEP_PAUSED=1: the rehearsal renders the landscape then the reel, and resumes it itself at its end; 2026-11-21 the reel rendered beside the resumed training)
[ -z "$GPU_KEEP_PAUSED" ] && node tools/lib/gpu_busy.mjs resume --by "$(node tools/project.mjs root $p 2>/dev/null || echo $p)" --reason "انتهى الرندر النهائي" 2>/dev/null
echo "ALL DONE $(date +%T)"
