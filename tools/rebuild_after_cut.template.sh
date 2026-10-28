#!/usr/bin/env bash
# full rebuild after any re-cut: cut -> alpha clips -> echo-reduced audio -> audio gate
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh
PY=/s/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
node tools/auto_cut.mjs scratch/yh/src.mp4 yh --vad scratch/yh/vad_fine.json --keep 0.02 --min 0.15 --cut 21.13-21.64 --cut 199.55-203.2 --cut 186.95-195.0 --cut 718.9-726.1 --cut 1087.5-1090.7 2>&1 | tail -2
tools/hook_alpha_build.template.sh 2>&1 | grep -v Warning | tail -2
tools/iso_alpha_build.sh 168.73 181.5 yh_iso1_a.webm 2>&1 | grep -v Warning | tail -1
tools/iso_alpha_build.sh 971.27 984 yh_iso3_a.webm 2>&1 | grep -v Warning | tail -1
$PY tools/echo_reduce.py public/yh_cut.mp4 public/yh_map.json public/yh_audio.wav 74.83-88.37 97.3-109.17 152.67-168.73 370.97-395.73 664.83-696.2 712.13-718.9 745.4-760.6 767.0-787.0 806.67-817.57 825.7-853.3 1015.53-1036.83
node tools/audio_gate.mjs yh --cut public/yh_cut.mp4 --map public/yh_map.json --tr scratch/yh/tr.json --src16k scratch/yh/a.wav --audio public/yh_audio.wav
echo REBUILD_DONE
