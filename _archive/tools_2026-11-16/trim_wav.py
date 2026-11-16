"""Remove time ranges from a 48 kHz 16-bit wav; each join gets 6 ms fades so it never clicks.
usage: python tools/trim_wav.py <in.wav> <out.wav> --cut "a-b,c-d"   (seconds)"""
import sys, wave
import numpy as np

SR, FADE = 48000, 0.006
a = sys.argv[1:]
inp, out = a[0], a[1]
cuts = sorted(tuple(map(float, r.split("-"))) for r in a[a.index("--cut") + 1].split(","))
with wave.open(inp) as f:
    ch, n = f.getnchannels(), f.getnframes()
    x = np.frombuffer(f.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768
parts, pos = [], 0.0
for ca, cb in cuts + [(len(x) / SR, len(x) / SR)]:
    seg = x[int(pos * SR):int(ca * SR)].copy()
    fn = min(int(FADE * SR), len(seg) // 2)
    if fn:
        if pos > 0: seg[:fn] *= np.linspace(0, 1, fn)[:, None]
        if ca < len(x) / SR - 1e-6: seg[-fn:] *= np.linspace(1, 0, fn)[:, None]
    parts.append(seg); pos = cb
y = np.concatenate(parts)
with wave.open(out, "wb") as f:
    f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"trimmed {len(x)/SR:.2f}s -> {len(y)/SR:.2f}s")
