"""Cut the silences out of a voice note (rule: pause > 0.4 s -> short) and re-time its word list.
Usage: python tools/voice_cut.py <in_audio> <words.json> <out.mp3> <out_words.json> [--padstart 100] [--padend 180] [--minsil 300]
 - speech segments by Silero VAD (as tools/vad_segments.py), concatenated with ffmpeg
 - words.json = [{s,e,w}] from tools/transcribe_words.py of the SAME input; output words are re-timed on the cut audio
 - a word that starts inside a removed gap snaps to the start of the next kept segment"""
import sys, json, subprocess, os
import numpy as np
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps, VadOptions

src, wj, out, outw = sys.argv[1:5]
a = sys.argv[5:]
ps = int(a[a.index("--padstart") + 1]) if "--padstart" in a else 100
pe = int(a[a.index("--padend") + 1]) if "--padend" in a else 180
ms = int(a[a.index("--minsil") + 1]) if "--minsil" in a else 300
audio = decode_audio(src, sampling_rate=16000)
total = len(audio) / 16000
ts = get_speech_timestamps(audio, VadOptions(threshold=0.35, min_silence_duration_ms=ms, speech_pad_ms=0, min_speech_duration_ms=120))
seg = [[t["start"] / 16000 - ps / 1000, t["end"] / 16000 + pe / 1000] for t in ts]
seg = [[max(0, s), min(total, e)] for s, e in seg]
merged = []
for s, e in seg:
    if merged and s <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], e)
    else:
        merged.append([s, e])
fc = ";".join(f"[0:a]atrim={s:.3f}:{e:.3f},asetpts=N/SR/TB[a{i}]" for i, (s, e) in enumerate(merged))
fc += ";" + "".join(f"[a{i}]" for i in range(len(merged))) + f"concat=n={len(merged)}:v=0:a=1[o]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[o]", "-c:a", "libmp3lame", "-q:a", "3", out], check=True)
maps, n = [], 0.0
for s, e in merged:
    maps.append((s, e, n)); n += e - s
def m(t):
    for s, e, off in maps:
        if t < s: return round(off, 3)
        if t <= e: return round(off + t - s, 3)
    return round(n, 3)
words = json.load(open(wj, encoding="utf8"))
res = [{"w": w["w"], "s": m(w["s"]), "e": m(w["e"])} for w in words]
json.dump({"duration": round(n, 3), "words": res, "segments": [[round(s, 2), round(e, 2)] for s, e, _ in maps]}, open(outw, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{len(merged)} segments, {total:.1f}s -> {n:.1f}s")
