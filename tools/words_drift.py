"""Fresh word-level Whisper pass over a 16 kHz mono wav → JSON [{s,w}] (absolute seconds). Used by words_drift_check.mjs.
Usage: python tools/words_drift.py <wav16k> <out.json>"""
import os, sys, json, wave
tl = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(tl):
    os.add_dll_directory(tl); os.environ["PATH"] = tl + os.pathsep + os.environ.get("PATH", "")
import numpy as np
from faster_whisper import WhisperModel
w = wave.open(sys.argv[1]); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
seg, _ = m.transcribe(a, language="ar", word_timestamps=True)
out = [{"s": round(x.start, 2), "w": x.word.strip()} for s in seg for x in (s.words or [])]
json.dump(out, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False)
