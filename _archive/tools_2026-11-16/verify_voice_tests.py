# -*- coding: utf-8 -*-
import sys
import os
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from faster_whisper import WhisperModel

model = WhisperModel('small', device='cpu', compute_type='int8')

test_dir = r"S:\AI_Tools\Remotion_Workspace\render_work\cartoon_abukhat\voice_tests"
files = ["var1_comma.wav", "var2_nocomma.wav", "var3_pause.wav"]

for f in files:
    path = os.path.join(test_dir, f)
    if not os.path.exists(path):
        continue
    segs, info = model.transcribe(path, language="ar", word_timestamps=True)
    words = []
    text = ""
    for s in segs:
        text += s.text + " "
        for w in s.words:
            words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
    print(f"=== {f} ({info.duration:.2f}s) ===")
    print("Full text:", text.strip())
    print("Words:", [w["w"] for w in words])
    json_path = os.path.join(test_dir, f.replace(".wav", "_words.json"))
    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(words, jf, ensure_ascii=False, indent=2)

