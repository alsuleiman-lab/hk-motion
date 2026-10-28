"""Speech segments via Silero VAD (bundled with faster-whisper). Robust to clicks, breaths and room noise,
unlike plain level-based silencedetect (which either keeps pauses full of clicks or clips soft word endings).
Usage: python tools/vad_segments.py <audio16k.wav> <out.json> [--pad 180] [--padstart 200 --padend 180] [--minsil 300]
(--padstart = safety margin kept BEFORE each speech segment, --padend = AFTER it; defaults to --pad. User standing rule 2026-10-16: 0.20 s before, 0.18 s after, nothing extra in between.)
Output: {"speech":[[start,end],...], "gaps":[[start,dur],...]}  (seconds, padded)"""
import sys, json, numpy as np
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps, VadOptions
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
pad = int(a[a.index("--pad")+1]) if "--pad" in a else 180
minsil = int(a[a.index("--minsil")+1]) if "--minsil" in a else 300
pad_start = int(a[a.index("--padstart")+1]) if "--padstart" in a else pad
pad_end = int(a[a.index("--padend")+1]) if "--padend" in a else pad
asym = ("--padstart" in a) or ("--padend" in a)
audio = decode_audio(src, sampling_rate=16000)
ts = get_speech_timestamps(audio, VadOptions(threshold=0.35, min_silence_duration_ms=minsil, speech_pad_ms=(0 if asym else pad), min_speech_duration_ms=120))
total = len(audio)/16000
sp = [[t["start"]/16000, t["end"]/16000] for t in ts]
if asym:  # pad each speech segment: pad_start before it, pad_end after it, then merge overlaps
    sp = [[max(0.0, x - pad_start/1000), min(total, y + pad_end/1000)] for x, y in sp]
    m = []
    for x, y in sp:
        if m and x <= m[-1][1]: m[-1][1] = max(m[-1][1], y)
        else: m.append([x, y])
    sp = m
gaps = []
prev = 0.0
for s, e in sp:
    if s - prev > 0.01: gaps.append([round(prev, 3), round(s - prev, 3)])
    prev = e
if total - prev > 0.01: gaps.append([round(prev, 3), round(total - prev, 3)])
json.dump({"speech": sp, "gaps": gaps}, open(out, "w"))
print(len(sp), "speech segments;", len([g for g in gaps if g[1] > 0.3]), "gaps >0.3s; longest gap", max(g[1] for g in gaps))
