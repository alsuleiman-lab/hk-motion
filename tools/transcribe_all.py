import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

clips = [
    ("public/stream_clip1_sun.mp4", "src/clip1_words.json"),
    ("public/stream_clip3_sunrise.mp4", "src/clip3_words.json"),
    ("public/stream_clip4_throne.mp4", "src/clip4_words.json"),
    ("public/stream_clip5_danger.mp4", "src/clip5_words.json"),
]

print("Loading Whisper model...")
m = WhisperModel("large-v3", device="cuda", compute_type="float16")

for src, out in clips:
    if os.path.exists(out):
        print(f"Skipping {out}, already exists")
        continue
    print(f"Transcribing {src} -> {out}...")
    audio = decode_audio(src, sampling_rate=16000)
    segs, _ = m.transcribe(audio, language="ar", vad_filter=False, beam_size=5, word_timestamps=True)
    words = [{"s": round(w.start, 2), "e": round(w.end, 2), "w": w.word.strip(), "p": round(w.probability, 2)} for sg in segs for w in sg.words]
    json.dump(words, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"Done {src}: {len(words)} words")

print("All transcriptions complete!")
