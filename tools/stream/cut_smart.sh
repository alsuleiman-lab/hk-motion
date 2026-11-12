#!/bin/bash
# usage: cut_smart.sh <p> [initial drops]  — cut_auto + auto-drop of flagged non-speech ranges, up to 4 rounds, then post_cut
cd /s/AI_Tools/Remotion_Workspace
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
p=$1; init=$2
d=$($PY -I tools/stream/inner_pauses.py $p -34)
all="$d"; [ -n "$init" ] && all="$init,$d"
extra=""; jk="$EXEMPT"
for r in 1 2 3 4; do
  KEEP="" EXEMPT="$jk" bash tools/stream/cut_loop.sh $p "$all$extra" > .tmp/$p/smart_$r.log 2>&1
  if grep -q "OK after" .tmp/$p/smart_$r.log; then echo "$p cut OK round $r"; break; fi
  new=$(grep -ahoE "\[[0-9.]+-[0-9.]+ «[^»]*»" .tmp/$p/loop_cut_*.log | sed -E 's/^\[([0-9.]+)-([0-9.]+).*/\1-\2/' | sort -u | paste -sd,)
  j=$(node tools/stream/join_keep.mjs $p); case ",$jk," in *",$j,"*) j="";; esac; if [ -n "$j" ]; then jk="${jk:+$jk,}$j"; echo "$p round $r: keep joins $j"; continue; fi
  [ -z "$new" ] && { echo "$p cut FAILED (no new drops)"; tail -3 .tmp/$p/smart_$r.log | cut -c1-200; break; }
  extra="$extra,$new"
done
PYTHONIOENCODING=utf-8 bash tools/stream/post_cut.sh $p | tail -2
ffprobe -v error -show_entries format=duration -of csv=p=0 public/${p}_cut.mp4
