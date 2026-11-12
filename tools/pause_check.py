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
# (2026-11-12) the VAD calls the drawn-out end of a recited word silence («من دون الله» — a madd of 0.3 s at -10..-30 dB counted as a 0.51 s pause):
# each candidate gap is trimmed at both ends to the part that is really quiet (20 ms frames below -40 dBFS), so a pause is the silence itself
import numpy as np
_all = a[: len(a) // 320 * 320].reshape(-1, 320); _lv = 20 * np.log10(np.sqrt((_all ** 2).mean(1)) + 1e-9)
QUIET = max(-40.0, float(np.percentile(_lv, 10)) + 8.0)   # quiet = below -40 dBFS or 8 dB above this recording's own noise floor, whichever is higher
def quiet_len(s0, d):
    i0, i1 = int(s0 * 16000), int((s0 + d) * 16000); seg = a[i0:i1]; fr = 320
    lv = [20 * np.log10(np.sqrt(np.mean(seg[k:k + fr] ** 2)) + 1e-9) for k in range(0, max(0, len(seg) - fr + 1), fr)]
    q = [x < QUIET for x in lv]
    if not any(q): return 0.0
    first, last = q.index(True), len(q) - 1 - q[::-1].index(True)
    return (last - first + 1) * fr / 16000
gaps = [(s0, min(d, quiet_len(s0, d))) for s0, d in gaps]
bad = [(round(s, 2), round(d, 2)) for s, d in gaps if d > mx]
print("speech segments", len(sp), "| pauses > %.2f s: %d | longest %.2f s" % (mx, len(bad), max(d for _, d in gaps)))
print(json.dumps(bad))   # FULL list (start_s, duration_s): audio_gate checks every pause, not a count
