"""Replace one span of a wav with another wav of the same length, with short crossfades at both edges (used by tools/music_cut.mjs).
    python tools/audio_patch.py <full.wav> <patch.wav> <A_sec> <out.wav> [--fade 0.03]
<patch.wav> holds exactly the span that starts at A seconds of <full.wav> (its length decides where it ends); the audio before and after is untouched.
Both files must have the same rate and channel count (the caller resamples)."""
import sys, wave
import numpy as np
sys.stdout.reconfigure(encoding="utf-8")
a = sys.argv[1:]
if len(a) < 4:
    print(__doc__); sys.exit(2)
full_p, patch_p, A, out_p = a[0], a[1], float(a[2]), a[3]
fade = float(a[a.index("--fade") + 1]) if "--fade" in a else 0.03
def read(p):
    w = wave.open(p, "rb"); sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
    assert sw == 2, f"{p}: 16-bit wav expected"
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, ch); w.close(); return x, sr, ch
full, sr, ch = read(full_p); patch, sr2, ch2 = read(patch_p)
assert (sr, ch) == (sr2, ch2), f"rate/channels differ: {sr}/{ch} vs {sr2}/{ch2}"
i0 = int(round(A * sr)); n = min(len(patch), len(full) - i0)
if n <= 0:
    print("audio_patch: the span is outside the audio"); sys.exit(2)
patch = patch[:n]
k = max(1, min(int(fade * sr), n // 2))
ramp = np.linspace(0.0, 1.0, k, dtype=np.float32)[:, None]
res = full.copy()
seg = patch.copy()
seg[:k] = full[i0:i0 + k] * (1 - ramp) + patch[:k] * ramp                 # in
tail = np.linspace(1.0, 0.0, k, dtype=np.float32)[:, None]
seg[n - k:] = patch[n - k:] * tail + full[i0 + n - k:i0 + n] * (1 - tail)  # out
res[i0:i0 + n] = seg
w = wave.open(out_p, "wb"); w.setnchannels(ch); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(np.clip(res, -32768, 32767).astype(np.int16).tobytes()); w.close()
print(f"audio_patch: {n / sr:.2f} s replaced at {A:.2f} s ({fade * 1000:.0f} ms crossfades) -> {out_p}")
