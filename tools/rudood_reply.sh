#!/bin/bash
# تجهيز رد «شيخ الردود» بعد التوليد: قصّ خفيف لطرفي الصوت (−52 د.ب)، رفع العلو (−16)، ضجيج غرفة خافت، ثم حساب حركة الفم من تغيّر مستوى الصوت
# وكتابتها في src/ext/rudoodMouth.ts تحت الاسم المعطى (تُستبدل إن وُجدت وتُضاف إن لم توجد).
# الاستعمال: bash tools/rudood_reply.sh <wav من فويس تت> <مجلد public الفرعي> <اسم ثابت الفم مثل SULTAN_TUT> [اسم الناتج=reply_final.wav]
set -e
cd "$(dirname "$0")/.."
SRC="$1"; SUB="$2"; CONST="$3"; OUT="${4:-reply_final.wav}"; PY=/c/Users/mshms/AppData/Local/Programs/Python/Python310/python.exe
mkdir -p "public/$SUB" .tmp
ffmpeg -v error -y -i "$SRC" -filter_complex "[0]silenceremove=start_periods=1:start_threshold=-52dB:start_silence=0.12,areverse,silenceremove=start_periods=1:start_threshold=-52dB:start_silence=0.15,areverse,afade=t=in:d=0.02,loudnorm=I=-16:TP=-1.5:LRA=11[v];anoisesrc=d=60:c=pink:a=0.002:r=24000[n];[v][n]amix=inputs=2:duration=first:normalize=0" -ar 48000 "public/$SUB/$OUT"
ffmpeg -v error -y -i "public/$SUB/$OUT" -ac 1 -ar 48000 -f s16le .tmp/rudood_mouth.raw
$PY -X utf8 - "$CONST" <<'PYEOF'
import sys, re, json, numpy as np
name = sys.argv[1]
x = np.fromfile(r"S:/AI_Tools/Remotion_Workspace/.tmp/rudood_mouth.raw", np.int16).astype(np.float32) / 32768
h = 400; n = len(x) // h
db = 20 * np.log10(np.array([np.sqrt((x[i*h:(i+1)*h] ** 2).mean()) for i in range(n)]) + 1e-9)
W = 18; mn = np.array([db[max(0, i-W):i+W].min() for i in range(n)]); mx = np.array([db[max(0, i-W):i+W].max() for i in range(n)])
o = np.clip((db - mn - 6) / np.maximum(mx - mn - 6, 6), 0, 1) * (db > -36)
f = np.array([o[i*4:(i+1)*4].mean() for i in range(n // 4)])
f = np.round(np.clip(np.convolve(f, [0.25, 0.5, 0.25], "same") * 1.15, 0, 1), 2)
import os
p = r"S:/AI_Tools/Remotion_Workspace/src/ext/rudoodMouth.ts"
t = open(p, encoding="utf-8").read() if os.path.exists(p) else "/* حركة فم «شيخ الردود» لكل فيديو (يكتبها tools/rudood_reply.sh): قيم 0..1 لكل إطار */
"
line = f"export const {name}: number[] = " + json.dumps(f.tolist()) + ";"
pat = rf"export const {name}: number\[\] = [^\n]*"
t = re.sub(pat, lambda m: line, t) if re.search(pat, t) else t.rstrip("\n") + "\n" + line + "\n"
open(p, "w", encoding="utf-8").write(t); print(name, len(f), "إطاراً")
PYEOF
echo "الصوت: public/$SUB/$OUT"
