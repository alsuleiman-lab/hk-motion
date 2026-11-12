import json
import os
import sys

torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
os.environ["PATH"] = torch_lib + os.pathsep + os.environ["PATH"]
if hasattr(os, "add_dll_directory"):
    os.add_dll_directory(torch_lib)

from faster_whisper import WhisperModel

cut_path = "public/s2_ashari_kufr_deen_cut.mp4"
out_json = ".tmp/s2_ashari_kufr_deen_words.json"

print(f"Transcribing {cut_path} on GPU RTX 3090 (float16)...")
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
segments, info = model.transcribe(
    cut_path,
    language="ar",
    word_timestamps=True,
    vad_filter=True,
    vad_parameters=dict(min_silence_duration_ms=400)
)

words_list = []
for seg in segments:
    if seg.words:
        for w in seg.words:
            words_list.append({
                "s": round(w.start, 2),
                "e": round(w.end, 2),
                "w": w.word.strip(),
                "p": round(w.probability, 2)
            })

os.makedirs(os.path.dirname(out_json), exist_ok=True)
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(words_list, f, ensure_ascii=False, indent=2)

print(f"Done! {len(words_list)} words saved to {out_json}")
