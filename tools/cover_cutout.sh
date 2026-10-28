#!/usr/bin/env bash
# Cut a person out of a video frame (for covers/thumbnails): RVM matting on a 1.3 s window ending at <time>, last frame -> transparent PNG.
# usage: tools/cover_cutout.sh <video> <time_sec> <out.png> [crop_filter] [ratio]
#   crop_filter: ffmpeg filter applied first (e.g. "crop=550:440:150:340,scale=1100:880:flags=lanczos,unsharp=5:5:0.8" for a small inset), default "null"
# Picking the frame is the important part: eyes to the camera, mouth closed/calm, no inset/guest overlay in the frame. Check the result on a flat colour.
set -e
V="$1"; T="$2"; OUT="$3"; F="${4:-null}"; R="${5:-0.6}"
cd "$(dirname "$0")/.."; source tools/env.sh
PY=/s/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
mkdir -p .tmp/cov; N=$(basename "$OUT" .png)
ffmpeg -v error -y -ss $(node -e "console.log(Math.max(0,$T-1.2))") -t 1.3 -i "$V" -an -vf "$F" -c:v libx264 -crf 12 -preset fast ".tmp/cov/k_$N.mp4"
$PY tools/matte_rvm.py ".tmp/cov/k_$N.mp4" ".tmp/cov/ka_$N.mp4" --ratio "$R" | tail -1
ffmpeg -v error -y -sseof -0.08 -i ".tmp/cov/k_$N.mp4" -sseof -0.08 -i ".tmp/cov/ka_$N.mp4" -filter_complex "[1:v]format=gray,lutyuv=y='clip((val-30)*1.25,0,255)',gblur=sigma=1.1[a];[0:v][a]alphamerge" -frames:v 1 "$OUT"
echo "cut-out -> $OUT"
