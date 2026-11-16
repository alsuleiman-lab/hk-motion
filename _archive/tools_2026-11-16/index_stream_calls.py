import os, sys, json

torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel

src = sys.argv[1] if len(sys.argv) > 1 else ".tmp/stream2_full.wav"
out = sys.argv[2] if len(sys.argv) > 2 else ".tmp/stream2_calls_transcript.json"

print(f"Loading Whisper large-v3 for indexing calls from {src}...")
m = WhisperModel("large-v3", device="cuda", compute_type="float16")

print("Transcribing with VAD filter enabled...")
segs, info = m.transcribe(
    src,
    language="ar",
    vad_filter=True,
    beam_size=2,
    temperature=0.0
)

results = []
for s in segs:
    text = s.text.strip()
    if text:
        results.append({
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": text
        })
        print(f"[{s.start:6.1f}s -> {s.end:6.1f}s] {text}")

with open(out, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nDone. Extracted {len(results)} segments saved to {out}")

