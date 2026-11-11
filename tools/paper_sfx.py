"""Soft synthesised paper sounds (v2, no tonal/toy sounds): low-passed noise only, gentle attacks, quiet. numpy + wave only.
   python -I tools/paper_sfx.py public/fasel/sfx"""
import numpy as np, wave, os, sys
SR = 44100
rng = np.random.default_rng(23)
out_dir = sys.argv[1]
os.makedirs(out_dir, exist_ok=True)

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.clip((f - lo) / (lo * 0.4 + 1), 0, 1) * np.clip((hi - f) / (hi * 0.4 + 1), 0, 1)
    return np.fft.irfft(X * m, len(x))

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1.0) * np.exp(-np.maximum(t - a, 0) / max(d, 1e-4))

def save(name, x, gain=0.5):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    k = int(0.006 * SR); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    with wave.open(os.path.join(out_dir, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())

def crackle(n, dens, lo, hi, seed):
    r = np.random.default_rng(seed); x = np.zeros(n)
    idx = r.integers(0, n, int(dens * n / SR)); x[idx] = r.uniform(0.15, 0.8, len(idx)) * r.choice([-1, 1], len(idx))
    return band(x + r.normal(0, 0.015, n), lo, hi)

for k, (dur, dens, lo, hi) in enumerate([(0.5, 600, 700, 4200), (0.4, 420, 900, 4800), (0.6, 800, 500, 3800)]):
    n = int(dur * SR); save(f"rustle{k+1}", crackle(n, dens, lo, hi, 200 + k) * np.sin(np.linspace(0, np.pi, n)) ** 1.6, 0.45)
for k in range(2):                       # soft paper flick (no sharp tick)
    n = int(0.16 * SR); save(f"flick{k+1}", band(rng.normal(0, 1, n), 700 + 200 * k, 3600) * env(n, 0.012, 0.045), 0.4)
for k, hi in enumerate([1100, 1500]):    # paper laid on a desk: dull noise thud, no pitch
    n = int(0.22 * SR); save(f"slap{k+1}", band(rng.normal(0, 1, n), 120, hi) * env(n, 0.006, 0.05), 0.5)
n = int(0.7 * SR); am = 0.35 + 0.65 * np.abs(np.sin(np.cumsum(rng.uniform(18, 55, n)) / SR * 2 * np.pi)) ** 0.8
save("tear", band(rng.normal(0, 1, n), 600, 4500) * am * np.sin(np.linspace(0, np.pi, n)) ** 0.8, 0.5)
n = int(0.42 * SR); t = np.linspace(0, 1, n); base = rng.normal(0, 1, n); sw = np.zeros(n); seg = 2048
for i in range(0, n - seg, seg // 2):
    c = 500 + 2600 * np.sin(np.pi * i / n); sw[i:i + seg] += band(base[i:i + seg] * np.hanning(seg), c * 0.6, c * 1.5)
save("pageflip", sw * np.sin(np.pi * t) ** 1.2, 0.45)
n = int(0.55 * SR); t = np.arange(n) / SR
save("scribble", band(rng.normal(0, 1, n), 1800, 5200) * (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 6 * t))) * np.sin(np.pi * t / t[-1]) ** 0.6, 0.3)
n = int(0.3 * SR); save("stamp", band(rng.normal(0, 1, n), 80, 700) * env(n, 0.008, 0.09), 0.55)   # muffled ink-stamp thud
n = int(0.45 * SR); t = np.arange(n) / SR
save("tape", band(rng.normal(0, 1, n), 900, 4200) * (0.5 + 0.5 * np.sin(2 * np.pi * (14 + 40 * t) * t)) * np.sin(np.pi * t / t[-1]), 0.4)
n = int(0.12 * SR); save("pin", band(rng.normal(0, 1, n), 500, 2600) * env(n, 0.008, 0.02), 0.35)   # a soft press, not a ding
print(sorted(os.listdir(out_dir)))
