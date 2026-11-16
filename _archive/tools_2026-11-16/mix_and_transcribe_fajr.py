import os
import sys
import json
import subprocess

torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

scenes = [
    {"id": "scene1", "start": 0.0},
    {"id": "scene2", "start": 8.2},
    {"id": "scene3", "start": 17.0},
    {"id": "scene4", "start": 27.5},
    {"id": "scene5", "start": 38.5},
    {"id": "scene6", "start": 49.0},
]

# 1. Build FFmpeg filter_complex to place each audio segment at its designated start timestamp in 60s stereo/mono audio
inputs = []
filter_parts = []
for i, sc in enumerate(scenes):
    fpath = f"public/fajr/{sc['id']}.mp3"
    inputs.extend(["-i", fpath])
    delay_ms = int(sc["start"] * 1000)
    filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")

mix_inputs = "".join(f"[a{i}]" for i in range(len(scenes)))
filter_complex = ";".join(filter_parts) + f";{mix_inputs}amix=inputs={len(scenes)}:dropout_transition=0:normalize=0[aout]"

out_full = "public/fajr/fajr_full_voice.wav"
cmd = ["ffmpeg", "-y", "-v", "error"] + inputs + [
    "-filter_complex", filter_complex,
    "-map", "[aout]",
    "-t", "60",
    "-ar", "44100",
    out_full
]
subprocess.run(cmd, check=True)
print("Mixed full 60s voiceover to", out_full)

# 2. Transcribe words with Whisper on GPU
audio = decode_audio(out_full, sampling_rate=16000)
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = m.transcribe(
    audio,
    language="ar",
    beam_size=5,
    word_timestamps=True,
    condition_on_previous_text=False
)

words = []
for sg in segs:
    for w in sg.words:
        cleaned = w.word.strip()
        if cleaned:
            words.append({
                "w": cleaned,
                "s": round(w.start, 2),
                "e": round(w.end, 2)
            })

with open("public/fajr/fajr_words.json", "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f"Transcribed {len(words)} words successfully into public/fajr/fajr_words.json")
