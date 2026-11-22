#!/bin/bash
# usage: cut_smart.sh <p> [initial drops]  — whole-stream cut in ONE pass, then post_cut.
# (user order 2026-11-16: the whole job stream → rendered clips ≤ 2 h.) The strict audio gate is NOT run on the 83-minute cut: every failed gate meant another full cut
# (2.5 min) and the loop ran for hours. SKIP_GATE=1 builds the cut once; the gate (noise, join edges, pauses) runs on each clip slice in clip_slice.mjs, seconds per clip.
# At most 3 outer rounds, and only for structural failures (a join inside a segment).
export SKIP_GATE=${SKIP_GATE:-1}
export STREAM_WHOLE=${STREAM_WHOLE:-1}   # no verse scan / research / moves / requirements on the whole stream: clip_slice runs them per clip
# (user 2026-11-22: zero video encoding before the final render) the whole-stream cut is the LIST (public/<p>_map.json) + its lossless audio (.tmp/<p>/cut_audio.wav); no cut video is encoded.
# STREAM_ENCODE=1 = the old path (one whole-stream cut video, then every clip encoded from it by clip_slice.mjs).
if [ "$STREAM_ENCODE" = 1 ]; then export STAGE_CUT_LAZY=0; else export STAGE_CUT_LAZY=1; fi
cd /s/AI_Tools/Remotion_Workspace
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
p=$1; init=$2
d=$($PY -I tools/stream/inner_pauses.py $p -34)
all="$d"; [ -n "$init" ] && all="$init,$d"
extra=""; jk="$EXEMPT"
for r in 1 2 3; do
  KEEP="" EXEMPT="$jk" bash tools/stream/cut_loop.sh $p "$all$extra" > .tmp/$p/smart_$r.log 2>&1
  if grep -q "OK after" .tmp/$p/smart_$r.log; then echo "$p cut OK round $r"; break; fi
  new=$(grep -ahoE "\[[0-9.]+-[0-9.]+ «[^»]*»" .tmp/$p/loop_cut_*.log | sed -E 's/^\[([0-9.]+)-([0-9.]+).*/\1-\2/' | sort -u | paste -sd,)
  j=$(node tools/stream/join_keep.mjs $p); case ",$jk," in *",$j,"*) j="";; esac; if [ -n "$j" ]; then jk="${jk:+$jk,}$j"; echo "$p round $r: keep joins $j"; continue; fi
  [ -z "$new" ] && { echo "$p cut FAILED (no new drops)"; tail -3 .tmp/$p/smart_$r.log | cut -c1-200; break; }
  extra="$extra,$new"
done
PYTHONIOENCODING=utf-8 bash tools/stream/post_cut.sh $p | tail -2
if [ "$STAGE_CUT_LAZY" = 1 ]; then node -e 'console.log(JSON.parse(require("fs").readFileSync("public/'$p'_map.json","utf8")).duration)'; else ffprobe -v error -show_entries format=duration -of csv=p=0 public/${p}_cut.mp4; fi
