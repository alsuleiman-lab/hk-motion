#!/bin/bash
# usage: cut_loop.sh <project> <initial drops a-b,c-d>
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
p=$1; drops=$2
for i in 1 2 3; do
  $PY -I tools/cut_safe_rem.py $p --drop "$drops" ${KEEP:+--keep "$KEEP"} > .tmp/$p/loop_$i.log 2>&1
  KX="$(cat .tmp/$p/keep_extra.txt 2>/dev/null)${EXEMPT:+,$EXEMPT}"; KX="${KX#,}"; node tools/stage.mjs cut $p --rem "$(cat .tmp/$p/rem_vad.txt)" ${KX:+--keep "$KX"} ${KS:+--keep-sound "$KS"} > .tmp/$p/loop_cut_$i.log 2>&1
  if grep -q "\[cut\] OK" .tmp/$p/loop_cut_$i.log; then echo "$p OK after round $i drops=$drops"; tail -6 .tmp/$p/loop_cut_$i.log; exit 0; fi
  [ -n "$NOAUTO" ] && { echo "round $i failed (noauto)"; grep -E "✘|inside a segment" .tmp/$p/loop_cut_$i.log | tail -4 | cut -c1-300; exit 1; }
  new=$(grep -oE "source [0-9.]+–[0-9.]+" .tmp/$p/loop_cut_$i.log | sed 's/source //; s/–/-/' | paste -sd, -)
  echo "round $i failed; new drops: $new"; grep -E "✘|inside a segment" .tmp/$p/loop_cut_$i.log | tail -3
  [ -z "$new" ] && { echo "no new drop ranges; stopping"; exit 1; }
  drops="$drops,$new"
done
echo "gave up drops=$drops"; exit 1
