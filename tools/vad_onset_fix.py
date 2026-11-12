"""Stop the cut from clipping the first syllable of a word (user 2026-11-06: «يتركون» lost its start).
Silero-VAD sometimes starts a speech segment a few tens of ms after the real onset (soft «ي/ت/و» openings). The cut then lands inside the word.
This pass extends every segment start backwards while the 20 ms level just before it is still above ONSET_DB (never into the previous segment, at most MAX_BACK s),
writes the fixed list into .tmp/<p>/vad.json (raw copy kept as vad.raw.json) and sets "onset_fixed". Idempotent. Run automatically by `stage.mjs cut`.
usage: python tools/vad_onset_fix.py <project>"""
import json, shutil, sys, wave
import numpy as np

ONSET_DB = -40.0   # level that still counts as the word's own sound (room noise sits at -55 … -65 dB)
MAX_BACK = 0.5     # never extend more than this
STEP = 0.02
p = sys.argv[1]; T = f".tmp/{p}"
vad = json.load(open(f"{T}/vad.json", encoding="utf-8"))
if vad.get("onset_fixed"):
    print("vad onset already fixed"); sys.exit(0)
shutil.copy(f"{T}/vad.json", f"{T}/vad.raw.json")
w = wave.open(f"{T}/a16k.wav"); sr = w.getframerate()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
n20 = int(STEP * sr)

def db(t):
    i = int(max(0.0, t) * sr)
    seg = a[i:i + n20]
    return -120.0 if len(seg) < n20 // 2 else 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)

speech, prev_end, moved = [], 0.0, []
for s, e in vad["speech"]:
    t, limit = s, max(prev_end + 0.02, s - MAX_BACK)
    while t - STEP >= limit and db(t - STEP) > ONSET_DB:
        t -= STEP
    if t < s - 0.001:
        moved.append((round(s, 2), round(s - t, 2)))
    speech.append([round(t, 3), e]); prev_end = e
gaps, end = [], 0.0
for s, e in speech:
    gaps.append([round(end, 3), round(s - end, 3)]); end = e
vad["speech"] = speech; vad["gaps"] = gaps; vad["onset_fixed"] = True
json.dump(vad, open(f"{T}/vad.json", "w", encoding="utf-8"))
print(f"vad onset fix: {len(moved)} segment start(s) moved earlier: " + ", ".join(f"{s}s -{d}s" for s, d in moved))
