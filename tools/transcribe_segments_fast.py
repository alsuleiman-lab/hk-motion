import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception as e:
        print("add_dll_directory error:", e)
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel

src = sys.argv[1]
out = sys.argv[2]

model = WhisperModel("medium", device="cuda", compute_type="float16")
segments, info = model.transcribe(src, language="ar", beam_size=5, vad_filter=True)

results = []
for s in segments:
    results.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
    print(f"[{s.start:6.1f} -> {s.end:6.1f}] {s.text}")

with open(out, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Saved {len(results)} segments to {out}")
