"""Word-onset check on a finished cut map (user order 2026-11-06: no word may lose its first letters).
Usage: python -I tools/onset_check.py <project>
At every cut join the first 10 ms of the kept segment must still be quiet (below -40 dB): a segment that already starts loud AND louder than the pause just before it (+10 dB) begins inside a word (clipped onset). A start a few ms before an abrupt onset is correct.
Exit 1 on any clipped join (lists source second)."""
import sys, os, json
import numpy as np
from faster_whisper.audio import decode_audio
p = sys.argv[1]; T = os.path.join(".tmp", p)
a = decode_audio(os.path.join(T, "a16k.wav"), sampling_rate=16000)
m = json.load(open(os.path.join("public", p + "_map.json"), encoding="utf-8"))["segments"]
def db(x, y):
    s = a[int(x * 16000):int(y * 16000)]
    return 20 * np.log10(np.sqrt(np.mean(s ** 2) + 1e-12) + 1e-9) if len(s) else -90
bad = []
for i, g in enumerate(m):
    if i and abs(g["a"] - m[i - 1]["b"]) < 0.02: continue      # contiguous: not a join
    first = db(g["a"], g["a"] + 0.01)
    fl = [db(t, t + 0.01) for t in np.arange(max(0, g["a"] - 0.30), max(0.02, g["a"] - 0.02), 0.02)]
    floor = float(np.percentile(fl, 10)) if fl else -90   # quietest moment of the pause just before: a noisy recording sits at -35 dB all the time
    if first > -40 and first - floor > 10: bad.append((round(g["a"], 2), round(float(first), 1)))
print(f"joins {len(m)} | clipped onsets {len(bad)}", bad[:30])
sys.exit(1 if bad else 0)
