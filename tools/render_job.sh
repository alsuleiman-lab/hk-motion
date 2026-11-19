#!/bin/bash
# usage: render_job.sh <p> <CompId> <R|L> "<title>"  -> renders into render_work/export (S:), moved later
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; id=$2; o=$3; title=$4
# (user 2026-11-18, rules review) the bumper and the file name come FROM THE MONTAGE (the spec), decided in one place below:
#   spec.bumper = { id?, at?, position: "start"|"end"|"none" } (identity skill) → used as written; "none" = no bumper at all.
#   no spec.bumper.position (old specs) → warning "no spec.bumper — legacy default" and the old rule: $5 if given, else a reel portrait at the end,
#     everything else at the start (أمر 2026-11-15); kinds paper/ad/explainer/cartoon (and Stick-/Dodo- compositions) → none.
#   spec.exportTitle (a string, or {L,R}) → the output name exactly as written (the montage adds the hashtag and the landscape «-»);
#     else the old append (hashtag + landscape «-», a pre-added hashtag stripped); a cartoon gets no hashtag.
#   RENDER_PLAN_ONLY=1 bash tools/render_job.sh … → prints the decision and exits (no render, nothing written).
plan=$(node -e '
const fs=require("fs"),[p,o,title,explicit,comp]=process.argv.slice(1),W=(m)=>process.stderr.write(m+"\n");
let s={};try{s=JSON.parse(fs.readFileSync(`data/specs/${p}.json`,"utf8"))}catch{}
const cartoon=s.kind==="cartoon"||/^(Stick|Dodo)-/.test(comp||"");
const b=s.bumper&&typeof s.bumper==="object"&&["start","end","none"].includes(s.bumper.position)?s.bumper:null;
let pos,at="",bid="";
if(b){pos=b.position;at=b.at??"";bid=b.id??"";if(explicit&&explicit!==pos)W(`bumper: spec.bumper.position=${pos} (the montage) wins over the argument «${explicit}»`);}
else{W("no spec.bumper — legacy default");pos=["paper","ad","explainer","cartoon"].includes(s.kind)||cartoon?"none":explicit||(o==="R"&&s.kind==="reel"?"end":"start");}
const et=s.exportTitle&&typeof s.exportTitle==="object"?(o==="L"?s.exportTitle.L??s.exportTitle.land:s.exportTitle.R??s.exportTitle.port):s.exportTitle;
const strip=(t)=>String(t??"").replace(/[:?؟«»"]/g,"").replace(/\s*#محمد_بن_شمس_الدين\s*-?\s*$/u,"").replace(/\s*-\s*$/,"").trim();
let name;
if(typeof et==="string"&&et.trim()){name=et.replace(/[<>:"\/\\|?*\u0000-\u001f]/g,"").trim();if(!/\.mp4$/i.test(name))name+=".mp4";}
else if(cartoon)name=strip(title)+(o==="L"?"-":"")+".mp4";
else name=strip(title)+(o==="R"?" #محمد_بن_شمس_الدين":" #محمد_بن_شمس_الدين-")+".mp4";
process.stdout.write([pos,at,bid,name].join("\x1f"));' "$p" "$o" "$title" "$5" "$id")
IFS=$'\x1f' read -r bpos bat bid name <<<"$plan"
if [ -n "$RENDER_PLAN_ONLY" ]; then echo "PLAN $p $o: bumper=$bpos at=${bat:-auto} id=${bid:-auto} -> $o/$name"; exit 0; fi
# the opening bumper goes right before his first «بسم الله / السلام عليكم» (with «طيب»), not at second 0 when the video opens with a clip or a hook (2026-11-12)
if [ "$bpos" = start ]; then [ -n "$bat" ] || bat=$(node tools/bumper_at.mjs $p); [ -n "$bid" ] || bid=$(node tools/bumper_at.mjs $p --id); fi
export BUMPER_POSITION=$bpos BUMPER_AT=$bat BUMPER_ID=$bid
spec=data/specs/$p.json
cutsrc="public/$(node -e 'console.log(JSON.parse(require("fs").readFileSync("'$spec'","utf8")).cut)')"
# cx = the camera that covers MOST of the video, not cams[0] (the opening split framed him at 1326 → 0 % judder on a clean portrait, 2026-11-12)
# avoid: zooms, shakes, full-screen verses (he is hidden, 2026-11-12) AND isolation windows shifted aside (dx) — the face crop sees the shifted figure there (false judder, 2026-11-12)
read -r cx avoid <<<"$(node -e '
const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));
const cm=(s.cams||[]).map(c=>({cx:c.cx,d:Math.min(c.to,s.frames/30)-c.from})).sort((a,b)=>b.d-a.d)[0];console.log((cm?.cx??940)+" "+(s.zooms||[]).map(z=>(z.from-0.5).toFixed(2)+"-"+(z.to+1.6).toFixed(2)).concat((s.shake||[]).map(z=>z.from+"-"+z.to)).concat((s.behind||[]).filter(w=>w.dx).map(w=>(w.from-0.3).toFixed(2)+"-"+(w.to+0.3).toFixed(2))).concat((s.items||[]).filter(i=>i.t==="pick"||(i.t==="note"&&i.phrases&&i.phrases.length)).map(i=>{const a=i.at??i.phrases[0].at;return (a-0.8).toFixed(2)+"-"+((i.until??a+6)+2.0).toFixed(2)})).concat((s.items||[]).filter(i=>(i.t==="verse"&&i.full)||i.t==="hadith").map(i=>((i.at??i.times[0])-0.4).toFixed(2)+"-"+((i.until??i.times[i.times.length-1]+2)+0.6).toFixed(2))).join(","));')"
freeat=$(node -e 'const s=JSON.parse(require("fs").readFileSync("'$spec'","utf8"));const d=s.frames/30;const b=[...(s.zooms||[]),...(s.shake||[])].map(z=>[z.from-0.5,z.to+1.6]).concat((s.items||[]).filter(i=>i.t==="pick"||(i.t==="note"&&i.phrases&&i.phrases.length)).map(i=>{const a=i.at??i.phrases[0].at;return [a-0.8,(i.until??a+6)+2.0]})).concat((s.items||[]).filter(i=>(i.t==="verse"&&i.full)||i.t==="hadith").map(i=>[(i.at??i.times[0])-0.4,(i.until??i.times[i.times.length-1]+2)+0.6])).sort((x,y)=>x[0]-y[0]);let best=[0,0],t=0;for(const [a,c] of [...b,[d,d]]){if(a-t>best[1]-best[0])best=[t,a];t=Math.max(t,c)}console.log((best[0]+0.6).toFixed(2))')
# (2026-11-19) the fallback window comes from free_windows (the same clear stretches the gate uses: verse boxes and every element that shifts him aside count), not only from picks/zooms:
# the old calculation put the window on a verse box → his face crop saw the shifted figure → a false 45% failure on a clean render
fw=$(node tools/free_windows.mjs $p 2>/dev/null | awk '{print $1}'); [ -n "$fw" ] && freeat=$fw
# (2026-11-17) the channel hashtag and the landscape dash: now decided in the plan at the top (spec.exportTitle first, user 2026-11-18, rules review)
if [ "$o" = R ]; then
  sx=$(node -e "console.log(Math.round($cx-163))"); crop="--crop 250,300,580,700 --src-crop $sx,169,326,394"
else crop="--crop 700,150,520,520"; fi
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
  eng_opt=""; [ "$engine" = tools/gpu_render.mjs ] && eng_opt="--procs 1 --windows 3 --spec $p"   # the measured best (remotion-render step 4); also one process = one asset file
  # (user 2026-11-18, rules review) no bumper: gpu_render reads BUMPER_POSITION=none; the hybrid fallback needs its --no-bumper flag
  [ "$bpos" = none ] && [ "$engine" = tools/hybrid_any.mjs ] && eng_opt="$eng_opt --no-bumper"
  until node $engine --comp $id --out "$tmpv" ${under:+--under "$under"} $eng_opt > .tmp/b2_render_$p.log 2>&1; do grep -aq "ممنوع رندر" .tmp/b2_render_$p.log || break; sleep 60; done
  hasA=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$tmpv" 2>/dev/null | head -1)
  if [ -s "$tmpv" ]; then
    # hybrid_any already mixes the audio and prepends the opening bumper (user 2026-11-11): never replace its audio with the unshifted wav
    if [ -n "$hasA" ]; then ffmpeg -y -v error -i "$tmpv" -c copy -movflags +faststart "$out" >> .tmp/b2_render_$p.log 2>&1 && rm -f "$tmpv"
    else ffmpeg -y -v error -i "$tmpv" -i public/${p}_audio.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart "$out" >> .tmp/b2_render_$p.log 2>&1 && rm -f "$tmpv"; [ "$bpos" = none ] || node tools/prepend_bumper.mjs "$out" --name $p ${BUMPER_AT:+--at $BUMPER_AT} ${BUMPER_ID:+--id $BUMPER_ID} >> .tmp/b2_render_$p.log 2>&1; fi
    # (user 2026-11-18, rules review) no bumper → the output itself is the original (a stale bumper_orig copy from an earlier render must not be judged)
    if [ "$bpos" = none ]; then chk="$out"; else chk=".tmp/bumper_orig/hyb_${p}_$o.mp4"; [ -f "$chk" ] || chk=".tmp/bumper_orig/$(basename "$out")"; [ -f "$chk" ] || chk="$out"; fi
    node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 10 >> .tmp/b2_probe_$p.log 2>&1 || node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p ${avoid:+--avoid "$avoid"} $crop --windows 14 >> .tmp/b2_probe_$p.log 2>&1 || node tools/judder_check.mjs "$chk" --src "$cutsrc" --offset 0 --name $p --at $freeat --len 90 $crop >> .tmp/b2_probe_$p.log 2>&1 || { echo "$p JUDDER FAIL"; tail -3 .tmp/b2_probe_$p.log; echo "judder gate failed" >> .tmp/b2_render_$p.log; false; }
  else echo "HYBRID FAILED — لا رندر بالقديم (أمر 2026-11-09)" >> .tmp/b2_render_$p.log; false
  fi
fi
rc=$?
echo "$p RENDER exit $rc -> $o/$name"; (exit $rc)
