#!/bin/bash
# Full render of a montage project with the GPU renderer, the way tools/render_job.sh does it (under-him windows, bumper, judder gate),
# but into a TEST folder (never «جاهز»):   bash tools/gpu/render_project.sh <spec> <CompL> <CompR> <outdir>
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; L=$2; R=$3; out=$4; mkdir -p "$out"
spec=data/specs/$p.json
cutsrc="public/$(node -e 'console.log(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).cut)')"
read -r cx avoid <<<"$(node -e '
const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));
console.log((s.cams?.[0]?.cx??940)+" "+(s.zooms||[]).map(z=>(z.from-0.5).toFixed(2)+"-"+(z.to+1.6).toFixed(2)).concat((s.shake||[]).map(z=>z.from+"-"+z.to)).join(","));')"
freeat=$(node -e 'const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));const d=s.frames/30;const b=[...(s.zooms||[]),...(s.shake||[])].map(z=>[z.from-0.5,z.to+1.6]).sort((x,y)=>x[0]-y[0]);let best=[0,0],t=0;for(const [a,c] of [...b,[d,d]]){if(a-t>best[1]-best[0])best=[t,a];t=Math.max(t,c)}console.log((best[0]+0.6).toFixed(2))')
while [ -f .tmp/render.lock ] && node -e 'const o=JSON.parse(require("fs").readFileSync(".tmp/render.lock","utf8"));try{process.kill(o.pid,0);process.exit(0)}catch{process.exit(1)}' 2>/dev/null; do sleep 15; done
for o in ${GR_ONLY:-L R}; do
  comp=$L; [ $o = R ] && comp=$R
  free=$(df -BG --output=avail /s | tail -1 | tr -dc 0-9); if [ "$free" -lt ${GR_MIN_FREE_G:-33} ]; then echo "$o: only ${free}G free on S: — not started (needs 25G + ~8G)"; continue; fi
  under=$(node tools/window_frames.mjs $p under $o)
  t0=$(date +%s)
  node tools/gpu_render.mjs --comp $comp --out "$out/$comp.mp4" ${under:+--under "$under"} --procs 1 --windows 3 --name $p > "$out/$o.log" 2>&1
  echo "$o: exit $? in $(( $(date +%s) - t0 ))s  $(grep -a 'DONE [0-9]* frames' "$out/$o.log")"
  rep=$(ls -t render_work/gpu_render_${comp}_*.json | head -1)
  node -e "const j=require('./$rep');console.log('   ',JSON.stringify({frames:j.frames,totalMin:j.totalMinutes,fps:j.fpsGraphicsPlusComposite,fpsE2E:j.fpsEndToEnd,cpu:j.cpuDuringRender&&j.cpuDuringRender.mean,sizeMB:j.sizeMB,video:j.probe[0],audio:j.probe[1]&&j.probe[1].duration}))"
  chk=.tmp/bumper_orig/$comp.mp4; [ -f "$chk" ] || chk="$out/$comp.mp4"
  if [ $o = R ]; then sx=$((cx - 163)); crop="--crop 250,300,580,700 --src-crop $sx,169,326,394"; else crop="--crop 700,150,520,520"; fi
  g1=$(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 10 2>&1 | grep -a "judder:")
  echo "   judder 10 windows: $g1"
  if ! echo "$g1" | grep -q PASSED; then
    echo "   judder 14 windows: $(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 14 2>&1 | grep -a 'judder:')"
    echo "   judder free span:  $(node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p --at $freeat --len 90 $crop 2>&1 | grep -a 'judder:')"
  fi
  rm -f "$chk.tmp" 2>/dev/null; [ "$chk" != "$out/$comp.mp4" ] && rm -f "$chk"   # the pre-bumper copy (ours) is no longer needed
done
echo "ALL DONE $(date +%T)"
