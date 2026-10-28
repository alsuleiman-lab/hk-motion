"""Transcribe every VAD speech segment on its own (short, independent decodes) so Whisper cannot smooth away restarts/stumbles the way it does on long audio.
Usage: python tools/transcribe_vad_segments.py <audio16k.wav> <vad.json> <out.json> [--merge 0.3]
Output: [{"i","s","e","text","words":[{"s","e","w"}]}] with absolute seconds."""
import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
src, vadf, out = sys.argv[1:4]
a = sys.argv[4:]
MERGE = float(a[a.index("--merge")+1]) if "--merge" in a else 0.3
DEVICE = a[a.index("--device")+1] if "--device" in a else "cuda"
THREADS = min(4, max(1, int(a[a.index("--threads")+1]))) if "--threads" in a else 4
audio = decode_audio(src, sampling_rate=16000)
sp = json.load(open(vadf))["speech"]
segs = []
for s, e in sp:
    if segs and s - segs[-1][1] < MERGE: segs[-1][1] = e
    else: segs.append([s, e])
m = WhisperModel("large-v3", device=DEVICE, compute_type="int8" if DEVICE == "cpu" else "int8_float16", cpu_threads=THREADS, num_workers=1)
res = []
for i, (s, e) in enumerate(segs):
    s0, e0 = max(0, s - 0.15), min(len(audio)/16000, e + 0.15)
    chunk = audio[int(s0*16000):int(e0*16000)]
    it, _ = m.transcribe(chunk, language="ar", vad_filter=False, beam_size=8, word_timestamps=True, condition_on_previous_text=False,
                         temperature=[0.0, 0.2], no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None)
    words = [{"s": round(w.start+s0, 2), "e": round(w.end+s0, 2), "w": w.word.strip()} for g in it for w in g.words]
    res.append({"i": i, "s": round(s, 2), "e": round(e, 2), "text": " ".join(w["w"] for w in words), "words": words})
    print(f"segment {i+1}/{len(segs)}: {res[-1]['text']}", flush=True)
    with open(out + ".partial.json", "w", encoding="utf-8") as checkpoint:
        json.dump(res, checkpoint, ensure_ascii=False)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(len(res), "segments")
