"""Re-transcribe every VAD segment of a project with Whisper large-v3 (per-segment slice, word times) and rewrite tr_vad.json.
usage: python tools/retr_vad_large.py <project> [--pad 0.4] — keeps a backup tr_vad.small.json (when the first pass hallucinates on short/dialect segments)."""
import os, sys, json, shutil, wave
torch_lib = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/Lib/site-packages/torch/lib"  # cublas DLL for faster-whisper on the GPU (python -I ignores PATH)
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
import numpy as np
from faster_whisper import WhisperModel
p = sys.argv[1]; pad = float(sys.argv[sys.argv.index("--pad")+1]) if "--pad" in sys.argv else 0.4
T = f".tmp/{p}"
tr = json.load(open(f"{T}/tr_vad.json", encoding="utf-8"))
shutil.copy(f"{T}/tr_vad.json", f"{T}/tr_vad.small.json")
w = wave.open(f"{T}/a16k.wav"); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)/32768
m = WhisperModel("large-v3", device="cuda", compute_type="float16", local_files_only=True)
out = []
for seg in tr:
    s0 = max(0, seg["s"]-pad); e0 = min(len(a)/sr, seg["e"]+pad)
    x = a[int(s0*sr):int(e0*sr)]
    ss,_ = m.transcribe(x, language="ar", word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    words = []; text = []
    for s in ss:
        text.append(s.text.strip())
        for ww in s.words: words.append({"s": round(s0+ww.start,2), "e": round(s0+ww.end,2), "w": ww.word.strip()})
    seg2 = dict(seg); seg2["text"] = " ".join(text).strip(); seg2["words"] = words; out.append(seg2)
    print(f"[{seg['s']:.1f}-{seg['e']:.1f}] {seg2['text']}")
json.dump(out, open(f"{T}/tr_vad.json", "w", encoding="utf-8"), ensure_ascii=False)
