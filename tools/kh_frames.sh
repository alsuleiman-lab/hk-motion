#!/usr/bin/env bash
# Pre-extract the base video's frames as JPEG for the fast final render (rule R-RENDER-SPEED.4; RV in src/PortraitKit.tsx reads them when the render gets --props '{"frames":true}').
#   tools/kh_frames.sh public/<cut>.mp4      ->  public/fr/<cut>/f_000000.jpg …  (file number = frame number of the cut)
# NVDEC decode, mjpeg quality 3, -threads 4, below-normal priority (rule 8). Skips when the folder already holds as many frames as the video.
set -euo pipefail
cd /s/AI_Tools/Remotion_Workspace
src="$1"; base=$(basename "${src%.*}"); out="public/fr/$base"
n=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$src")
have=$(ls "$out" 2>/dev/null | wc -l || true)
if [ "$have" -ge "$n" ] 2>/dev/null; then echo "✔ $out already has $have/$n frames"; exit 0; fi
mkdir -p "$out"
nice -n 10 ffmpeg -v error -stats -hwaccel cuda -i "$src" -an -threads 4 -q:v 3 -start_number 0 "$out/f_%06d.jpg"
echo "✔ $out: $(ls "$out" | wc -l)/$n frames"
