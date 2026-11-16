#!/usr/bin/env bash
# usage: iso_build.sh <src_start> <src_end> <out.webm>   -> alpha WebM of the isolated Sheikh for that source range (full-frame layout A)
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh
PY=/s/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
read S N <<< $(python - "$1" "$2" <<'P'
import json,sys
m=json.load(open('public/yh_map.json'))['segments']
def tw(t):
    for x in m:
        if x['a']<=t<=x['b']: return x['n']+t-x['a']
    for x in m:
        if x['a']>=t: return x['n']
    return m[-1]['n']
a,b=float(sys.argv[1]),float(sys.argv[2])
print(round(tw(a),4), round(tw(b)*30)-round(tw(a)*30))
P
)
A="format=gray,lutyuv=y='clip((val-70)*2.2,0,255)',gblur=sigma=1.0"
ffmpeg -y -v error -ss $S -i public/yh_cut.mp4 -frames:v $N -an -c:v libx264 -crf 12 -preset fast -r 30 .tmp/yh/ik.mp4
$PY tools/matte_rvm.py .tmp/yh/ik.mp4 .tmp/yh/ika.mp4 --ratio 0.6 | tail -1
ffmpeg -y -v error -i .tmp/yh/ik.mp4 -i .tmp/yh/ika.mp4 -filter_complex "[1:v]$A[a];[0:v][a]alphamerge,format=yuva420p[v]" -map "[v]" -r 30 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 24 -auto-alt-ref 0 -threads 4 -row-mt 1 -an "public/$3"
echo built $3 frames=$N from=$S
