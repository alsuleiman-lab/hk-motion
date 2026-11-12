#!/bin/bash
# usage: render_job.sh <p> <CompId> <R|L> "<title>"  -> renders into render_work/export (S:), moved later
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; id=$2; o=$3; title=$4; export BUMPER_POSITION=${5:-start}
# the opening bumper goes right before his first «بسم الله / السلام عليكم» (with «طيب»), not at second 0 when the video opens with a clip or a hook (2026-11-12)
[ "$BUMPER_POSITION" = start ] && export BUMPER_AT=$(node tools/bumper_at.mjs $p) && export BUMPER_ID=$(node tools/bumper_at.mjs $p --id)
spec=data/specs/$p.json
cutsrc="public/$(node -e 'console.log(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).cut)')"
# cx = the camera that covers MOST of the video, not cams[0] (the opening split framed him at 1326 → 0 % judder on a clean portrait, 2026-11-12)
# avoid: zooms, shakes, full-screen verses (he is hidden, 2026-11-12) AND isolation windows shifted aside (dx) — the face crop sees the shifted figure there (false judder, 2026-11-12)
read -r cx avoid <<<"$(node -e '
const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));
const cm=(s.cams||[]).map(c=>({cx:c.cx,d:Math.min(c.to,s.frames/30)-c.from})).sort((a,b)=>b.d-a.d)[0];console.log((cm?.cx??940)+" "+(s.zooms||[]).map(z=>(z.from-0.5).toFixed(2)+"-"+(z.to+1.6).toFixed(2)).concat((s.shake||[]).map(z=>z.from+"-"+z.to)).concat((s.behind||[]).filter(w=>w.dx).map(w=>(w.from-0.3).toFixed(2)+"-"+(w.to+0.3).toFixed(2))).concat((s.items||[]).filter(i=>i.t==="verse"&&i.full).map(i=>((i.at??i.times[0])-0.4).toFixed(2)+"-"+((i.until??i.times[i.times.length-1]+2)+0.6).toFixed(2))).join(","));')"
freeat=$(node -e 'const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));const d=s.frames/30;const b=[...(s.zooms||[]),...(s.shake||[])].map(z=>[z.from-0.5,z.to+1.6]).concat((s.items||[]).filter(i=>i.t==="verse"&&i.full).map(i=>[(i.at??i.times[0])-0.4,(i.until??i.times[i.times.length-1]+2)+0.6])).sort((x,y)=>x[0]-y[0]);let best=[0,0],t=0;for(const [a,c] of [...b,[d,d]]){if(a-t>best[1]-best[0])best=[t,a];t=Math.max(t,c)}console.log((best[0]+0.6).toFixed(2))')
safe=$(node -e 'console.log(process.argv[1].replace(/[:?؟«»"]/g,""))' "$title")
if [ "$o" = R ]; then
  sx=$(node -e "console.log(Math.round($cx-163))"); crop="--crop 250,300,580,700 --src-crop $sx,169,326,394"; name="$safe #محمد_بن_شمس_الدين.mp4"
else crop="--crop 700,150,520,520"; name="$safe #محمد_بن_شمس_الدين-.mp4"; fi
bash tools/render_guard.sh $p | tail -1
# probe (legacy render) is blocked by hybrid_gate: the judder gate runs on the hybrid OUTPUT below (2026-11-11)
out="S:/AI_Tools/Remotion_Workspace/render_work/export/$o/$name"; mkdir -p "$(dirname "$out")"
if true; then
  node tools/mix_audio.mjs $p $p >/dev/null 2>&1
  # hybrid (user 2026-11-09): Remotion draws graphics only, FFmpeg composites on NVDEC/NVENC; STRICT: no fallback to the old path (a failure stops and is fixed)
  tmpv=".tmp/hyb_${p}_$o.mp4"; rm -f "$tmpv"   # one temp name per orientation: the bumper and judder records of L and R must not overwrite each other (2026-11-12)
  # isolation windows: his cut-out is made on the GPU (masked VSlot, 2026-11-12); graphics UNDER him (a map in a window) go in the under layer = these frames
  under=$(node tools/window_frames.mjs $p under $o)
  # render engine (R-RENDER-GPU.1, user 2026-11-12): the all-GPU renderer by default; RENDER_ENGINE=hybrid = the previous path (fallback, with the user's permission).
  # Same arguments, same output (audio mixed, opening bumper prepended), same lock and retry: nothing else in this job changes.
  engine=tools/gpu_render.mjs; [ "${RENDER_ENGINE:-gpu}" = hybrid ] && engine=tools/hybrid_any.mjs
  eng_opt=""; [ "$engine" = tools/gpu_render.mjs ] && eng_opt="--procs 1 --windows 3 --name $p"   # the measured best (remotion-render step 4); also one process = one asset file
  until node $engine --comp $id --out "$tmpv" ${under:+--under "$under"} $eng_opt > .tmp/b2_render_$p.log 2>&1; do grep -aq "ممنوع رندر" .tmp/b2_render_$p.log || break; sleep 60; done
  hasA=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$tmpv" 2>/dev/null | head -1)
  if [ -s "$tmpv" ]; then
    # hybrid_any already mixes the audio and prepends the opening bumper (user 2026-11-11): never replace its audio with the unshifted wav
    if [ -n "$hasA" ]; then ffmpeg -y -v error -i "$tmpv" -c copy -movflags +faststart "$out" >> .tmp/b2_render_$p.log 2>&1 && rm -f "$tmpv"
    else ffmpeg -y -v error -i "$tmpv" -i public/${p}_audio.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart "$out" >> .tmp/b2_render_$p.log 2>&1 && rm -f "$tmpv"; node tools/prepend_bumper.mjs "$out" --name $p >> .tmp/b2_render_$p.log 2>&1; fi
    chk=".tmp/bumper_orig/hyb_${p}_$o.mp4"; [ -f "$chk" ] || chk=".tmp/bumper_orig/$(basename "$out")"; [ -f "$chk" ] || chk="$out"
    node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 10 >> .tmp/b2_probe_$p.log 2>&1 || node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 14 >> .tmp/b2_probe_$p.log 2>&1 || node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p --at $freeat --len 90 $crop >> .tmp/b2_probe_$p.log 2>&1 || { echo "$p JUDDER FAIL"; tail -3 .tmp/b2_probe_$p.log; echo "judder gate failed" >> .tmp/b2_render_$p.log; false; }
  else echo "HYBRID FAILED — لا رندر بالقديم (أمر 2026-11-09)" >> .tmp/b2_render_$p.log; false
  fi
fi
rc=$?
echo "$p RENDER exit $rc -> $o/$name"; (exit $rc)
