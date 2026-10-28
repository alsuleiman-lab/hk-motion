"""Pause check (user rule: after cutting, a silence is ~0.28 s = 0.10 before + 0.18 after speech; none > 0.4 s).
Usage: python tools/pause_check.py <audio.wav|mp4> [max=0.45]
VAD is run WITHOUT padding, so the pauses are measured between the words themselves (the earlier check padded the VAD and hid 0.5-0.67 s pauses)."""
import sys, subprocess, os, json
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps, VadOptions
src = sys.argv[1]; mx = float(sys.argv[2]) if len(sys.argv) > 2 else 0.45
a = decode_audio(src, sampling_rate=16000)
sp = get_speech_timestamps(a, VadOptions(min_silence_duration_ms=120, speech_pad_ms=0))
gaps = [((sp[i]["end"]) / 16000, (sp[i + 1]["start"] - sp[i]["end"]) / 16000) for i in range(len(sp) - 1)]
bad = [(round(s, 2), round(d, 2)) for s, d in gaps if d > mx]
print("speech segments", len(sp), "| pauses > %.2f s: %d | longest %.2f s" % (mx, len(bad), max(d for _, d in gaps)))
print(json.dumps(bad))   # FULL list (start_s, duration_s): audio_gate checks every pause, not a count
