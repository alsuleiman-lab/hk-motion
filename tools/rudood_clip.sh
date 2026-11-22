#!/bin/bash
# تجهيز مقطع المخالف لـ«شيخ الردود»: عازل الموسيقى ← كشف السكتات على صوت الكلام النظيف ← قصها بقاعدة القص ← تحقق أن الكلمات لم تنقص
# الاستعمال: bash tools/rudood_clip.sh <الفيديو> <مجلد العمل> <مجلد public الفرعي> [ثانية النهاية]
set -e
SRC="$1"; W="$2"; PUB="$3"; END="${4:-}"; PY=/c/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe; ROOT=/s/AI_Tools/Remotion_Workspace
mkdir -p "$W/stems" "$ROOT/public/$PUB"; cd "$W"
if [ -n "$END" ]; then ffmpeg -v error -y -i "$SRC" -to "$END" -c:v h264_nvenc -preset p5 -cq 16 -c:a pcm_s16le src.mkv && ffmpeg -v error -y -i src.mkv -c:v copy -c:a aac -b:a 256k src.mp4; else cp "$SRC" src.mp4; fi
ffmpeg -v error -y -i src.mp4 -vn -ar 44100 -ac 2 a44.wav
/s/AI_Tools/RemoveMusic/.venv/Scripts/audio-separator.exe "$(cygpath -w $PWD/a44.wav)" --model_filename UVR_MDXNET_KARA_2.onnx --single_stem Vocals --output_format WAV --output_dir "$(cygpath -w $PWD/stems)" --model_file_dir S:/AI_Tools/RemoveMusic/models > sep.log 2>&1
V=$(ls stems/*ocals*.wav | head -1)
ffmpeg -v error -y -i "$V" -ar 16000 -ac 1 v16.wav; ffmpeg -v error -y -i "$V" -ar 48000 -ac 2 v48.wav
ffmpeg -i v16.wav -af silencedetect=n=-38dB:d=0.28 -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+" | awk '{print $2}' | paste - - > sil.txt || true
$PY -X utf8 - <<'PYEOF'
import json, subprocess
R = json.load(open(r"S:/AI_Tools/Remotion_Workspace/data/cut_rules.json")); pb, pa = R["padBefore"], R["padAfter"]
dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","src.mp4"],capture_output=True,text=True,stdin=subprocess.DEVNULL).stdout)
sil = [tuple(map(float, l.split())) for l in open("sil.txt") if len(l.split()) == 2]
segs, a = [], 0.0
for s, e in sil:
    if s <= 0.01: a = max(0, e - pb); continue
    segs.append((a, min(dur, s + pa))); a = max(0, e - pb)
if a < dur - 0.05: segs.append((a, dur))
segs = [(s, e) for s, e in segs if e - s > 0.05] or [(0, dur)]
fc = "".join(f"[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS,fps=30[v{k}];[1:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,areverse,afade=t=in:d=0.012,areverse[a{k}];" for k,(s,e) in enumerate(segs))
fc += "".join(f"[v{k}][a{k}]" for k in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
open("fc.txt","w").write(fc); print(len(segs), "segments", round(sum(e-s for s,e in segs),2), "of", round(dur,2))
PYEOF
ffmpeg -v error -y -i src.mp4 -i v48.wav -filter_complex "$(cat fc.txt)" -map "[v]" -map "[a]" -c:v h264_nvenc -preset p5 -cq 18 -c:a pcm_s16le cut_raw.mkv
ffmpeg -v error -y -i cut_raw.mkv -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k "$ROOT/public/$PUB/clip.mp4"
ffmpeg -v error -y -i "$ROOT/public/$PUB/clip.mp4" -vn -ar 48000 -ac 2 "$ROOT/public/$PUB/clip_audio.wav"
ffmpeg -v error -y -i "$ROOT/public/$PUB/clip.mp4" -ar 16000 -ac 1 c16.wav
$PY -X utf8 $ROOT/tools/transcribe_words.py v16.wav w_before.json > /dev/null 2>&1
$PY -X utf8 $ROOT/tools/transcribe_words.py c16.wav w_after.json > /dev/null 2>&1
$PY -X utf8 -c "
import json,difflib,re
n=lambda t:[re.sub(r'[\u064B-\u0652،.؟,!]','',x['w'].strip()) for x in json.load(open(t,encoding='utf-8'))]
a,b=n('w_before.json'),n('w_after.json'); print('words', len(a), len(b), 'match', round(difflib.SequenceMatcher(None,a,b).ratio(),3))
print('dur', round(float(__import__('subprocess').run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','$ROOT/public/$PUB/clip.mp4'],capture_output=True,text=True).stdout),2))
print(' '.join(b))"
