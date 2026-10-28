#!/usr/bin/env bash
# rebuild the isolated-Sheikh alpha clips (hook + mid) for the current public/yh_cut.mp4 / yh_map.json
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh
PY=/s/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
read B0 B1 HE M0 M1 F0 F1 F2 FM0 FM <<< $(python - <<'P'
import json
m=json.load(open('public/yh_map.json'))['segments']
def tw(t):
    for x in m:
        if x['a']<=t<=x['b']: return x['n']+t-x['a']
    for x in m:
        if x['a']>=t: return x['n']
    return m[-1]['n']
F=lambda t:round(t*30)
b0,b1,he,m0,m1=tw(2.22),tw(21.65),tw(61.63),tw(695.8),tw(712.83)
print(round(b0,4),round(b1,4),round(he,4),round(m0,4),round(m1,4),F(b0),F(b1)-F(b0),F(he)-F(b1),F(m0),F(m1)-F(m0))
P
)
echo "b0=$B0 b1=$B1 he=$HE mid=$M0..$M1 frames $F0 $F1 $F2 $FM0 $FM"
rm -f .tmp/yh/k*.mp4 .tmp/yh/ka*.mp4 .tmp/yh/a?.webm
A="format=gray,lutyuv=y='clip((val-70)*2.2,0,255)',gblur=sigma=1.0"
E="-c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 24 -auto-alt-ref 0 -threads 4 -row-mt 1 -an"
X="-an -c:v libx264 -crf 12 -preset fast -r 30"
ffmpeg -y -v error -i public/yh_cut.mp4 -frames:v $F0 $X .tmp/yh/k0.mp4
ffmpeg -y -v error -ss $B0 -i public/yh_cut.mp4 -frames:v $F1 -vf "crop=960:1080:960:0" $X .tmp/yh/k1.mp4
ffmpeg -y -v error -ss $B1 -i public/yh_cut.mp4 -frames:v $F2 $X .tmp/yh/k2.mp4
ffmpeg -y -v error -ss $M0 -i public/yh_cut.mp4 -frames:v $FM $X .tmp/yh/km.mp4
for n in k0 k1 k2 km; do $PY tools/matte_rvm.py .tmp/yh/$n.mp4 .tmp/yh/ka_$n.mp4 --ratio 0.6 | tail -1; done
ffmpeg -y -v error -i .tmp/yh/k0.mp4 -i .tmp/yh/ka_k0.mp4 -filter_complex "[1:v]$A[a];[0:v][a]alphamerge,format=yuva420p[v]" -map "[v]" -r 30 $E .tmp/yh/a0.webm
ffmpeg -y -v error -i .tmp/yh/k1.mp4 -i .tmp/yh/ka_k1.mp4 -filter_complex "[1:v]$A[a];[0:v][a]alphamerge,format=yuva420p,pad=1920:1080:960:0:color=black@0[v]" -map "[v]" -r 30 $E .tmp/yh/a1.webm
ffmpeg -y -v error -i .tmp/yh/k2.mp4 -i .tmp/yh/ka_k2.mp4 -filter_complex "[1:v]$A[a];[0:v][a]alphamerge,format=yuva420p[v]" -map "[v]" -r 30 $E .tmp/yh/a2.webm
printf "file 'a0.webm'\nfile 'a1.webm'\nfile 'a2.webm'\n" > .tmp/yh/la.txt
ffmpeg -y -v error -f concat -safe 0 -i .tmp/yh/la.txt -c copy public/yh_hook_a.webm
ffmpeg -y -v error -i .tmp/yh/km.mp4 -i .tmp/yh/ka_km.mp4 -filter_complex "[1:v]$A[a];[0:v][a]alphamerge,format=yuva420p[v]" -map "[v]" -r 30 $E public/yh_mid_a.webm
echo built
