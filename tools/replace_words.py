"""Replace a misspoken word with the same speaker's own word taken from elsewhere in the cut (user 2026-11-06: «ابحث عن كلمة بديلة قلتها أثناء كلامي»).
usage: python tools/replace_words.py <in.wav> <out.wav> --src <source.wav> --rep "dst_a-dst_b:src_a-src_b[:skip_s],…"     (all times in CUT seconds)
The source clip is tempo-matched to the slot (ffmpeg atempo, 0.6–1.8), faded 10 ms at both edges and pasted over the slot; a clip that is still shorter than the
slot is centred, a longer one is trimmed at its end. In/out/source are 48 kHz 16-bit wav files."""
import subprocess, sys, wave, os, tempfile
import numpy as np

SR, FADE = 48000, 0.010
a = sys.argv[1:]
inp, out = a[0], a[1]
src = a[a.index("--src") + 1]
reps = [r.split(":") for r in a[a.index("--rep") + 1].split(",")]

def load(p):
    with wave.open(p) as f:
        ch, n = f.getnchannels(), f.getnframes()
        return np.frombuffer(f.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768

x, s = load(inp), load(src)
ch = x.shape[1]
for r in reps:
    da, db = map(float, r[0].split("-")); sa, sb = map(float, r[1].split("-")); skip = float(r[2]) if len(r) > 2 else 0.0
    sa += skip
    slot = db - da
    clip = s[int(sa * SR):int(sb * SR)]
    tmp_in = tempfile.mktemp(suffix=".wav"); tmp_out = tempfile.mktemp(suffix=".wav")
    with wave.open(tmp_in, "wb") as f:
        f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(clip, -1, 1) * 32767).astype(np.int16).tobytes())
    ratio = min(1.8, max(0.6, (sb - sa) / slot))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp_in, "-af", f"atempo={ratio:.4f}", tmp_out], check=True)
    c = load(tmp_out); os.remove(tmp_in); os.remove(tmp_out)
    n = int(slot * SR)
    if len(c) > n: c = c[:n]
    elif len(c) < n: pad = n - len(c); c = np.concatenate([np.zeros((pad // 2, ch), np.float32), c, np.zeros((pad - pad // 2, ch), np.float32)])
    fn = int(FADE * SR); env = np.ones(len(c), np.float32); env[:fn] = np.linspace(0, 1, fn); env[-fn:] = np.linspace(1, 0, fn)
    i = int(da * SR); x[i:i + len(c)] = x[i:i + len(c)] * (1 - env[:, None]) + c * env[:, None]
    print(f"replaced {da:.2f}-{db:.2f} with {sa:.2f}-{sb:.2f} (tempo x{ratio:.2f})")
with wave.open(out, "wb") as f:
    f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
