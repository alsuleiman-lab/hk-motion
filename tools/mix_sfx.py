"""Light sound effects under the speech (PREFERENCES: ≤ 6 per minute, ≥ 1.5 s apart, ≤ 0.06 of the speech level, never over a word).
usage: python tools/mix_sfx.py <spec.json> <in.wav> <out.wav> [--words .tmp/<p>/cut_words.json]
Events come from the spec: a soft whoosh when a photo / news / scene / arc / flash enters, a tick for every list row and the clock, a chime for the subscribe card.
Each event is moved (±0.35 s) into the nearest gap between words; an event that finds no gap is skipped."""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
spec_f, inp, out = sys.argv[1:4]
words_f = sys.argv[sys.argv.index("--words") + 1] if "--words" in sys.argv else None
spec = json.load(open(spec_f, encoding="utf-8"))
MAX_PER_MIN, MIN_GAP, REL = 5, 1.8, 0.06

def load(p):
    with wave.open(p) as f:
        ch, n = f.getnchannels(), f.getnframes()
        return np.frombuffer(f.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768

def sfx(name):
    t = tempfile.mktemp(suffix=".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"public/sfx/{name}.wav", "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", t], check=True)
    a = load(t); os.remove(t)
    return a[: int(1.2 * SR)]

x = load(inp)
SFX = {k: sfx(k) for k in ("whoosh", "tick", "chime")}
# speech level = RMS of the loud part
frame = SR // 20
rms = np.sqrt(np.convolve(np.mean(x ** 2, axis=1), np.ones(frame) / frame, mode="same"))
speech = float(np.median(rms[rms > np.percentile(rms, 60)]))

words = []
if words_f and os.path.exists(words_f):
    w = json.load(open(words_f, encoding="utf-8")); w = w if isinstance(w, list) else w.get("words", [])
    words = [(a["s"], a["e"]) for a in w]
def in_word(t):
    return any(a <= t <= b for a, b in words)
def to_gap(t):
    if not in_word(t): return t
    for d in np.arange(0.05, 0.36, 0.05):
        for c in (t - d, t + d):
            if not in_word(c): return float(c)
    return None

ev = []
for it in spec["items"]:
    if it.get("only") == "port": continue            # one effect per element (the port copy has the same start)
    t = it.get("at") if it.get("at") is not None else it.get("from")
    k = it["t"]
    if k in ("tphoto", "pic", "news", "scene", "flash", "arc", "scholar"): ev.append((t, "whoosh", 0.05))
    elif k == "clock": ev.append((t, "tick", 0.05))
    elif k == "rows":
        for r in it["rows"]: ev.append((r["at"], "tick", 0.04))
    elif k == "subscribe": ev.append((t, "chime", 0.05))
    elif k == "rewrite": ev.append((it["newAt"], "tick", 0.05))
ev = sorted(e for e in ev if e[0] is not None)
chosen, perm = [], {}
for t, name, g in ev:
    t2 = to_gap(t)
    if t2 is None: continue
    m = int(t2 // 60)
    if perm.get(m, 0) >= MAX_PER_MIN: continue
    if chosen and t2 - chosen[-1][0] < MIN_GAP: continue
    chosen.append((t2, name, g)); perm[m] = perm.get(m, 0) + 1
y = x.copy()
for t, name, g in chosen:
    a = SFX[name] * min(g, REL)   # SFX_LEVELS_MOTION: a volume relative to the file's own level (1.0 = as recorded), ≤ 0.06
    fn = int(0.01 * SR); env = np.ones(len(a), np.float32); env[:fn] = np.linspace(0, 1, fn); env[-fn:] = np.linspace(1, 0, fn)
    i = int(t * SR); j = min(len(y), i + len(a))
    y[i:j] += (a * env[:, None])[: j - i]
with wave.open(out, "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"{len(chosen)} effects in {len(x)/SR/60:.1f} min (speech level {speech:.3f}); max/min {max(perm.values())}/min")
