"""Reduce the long echo (~0.27-0.32 s) that some recorded clips (e.g. a TikTok played on his screen) carry — v2 (2026-10-21).
v1 used a waveform inverse comb and made the echo WORSE by ear (alternating-sign ghost echoes when the lag/strength was not exact). v2 works on
magnitudes (late-reverberation spectral subtraction, Lebart/Habets style): the echo of frame t is predicted from the power of frame t-lag
(P_echo = beta * P[t-lag]) and removed with a smoothed Wiener-like gain. No phase tricks, so no ghosts; repeated echoes fade naturally.
Usage: python tools/echo_reduce.py <cut.mp4> <map.json> <out.wav> <src_start-src_end> [...]   (intervals in SOURCE seconds)
Per 8 s block it estimates the lag (autocorrelation 0.2-0.4 s) and echo strength; skips blocks without echo (corr < 0.2).
Also de-clicks every join of the cut (±8 ms dip). Verify with tools/echo_check.py (before/after + ghost correlations) and by ear."""
import sys, os, json, subprocess, wave
import numpy as np
ALPHA = float(os.environ.get("ECHO_ALPHA", "1.6")); BETAK = float(os.environ.get("ECHO_BETAK", "1.6")); GMIN = float(os.environ.get("ECHO_GMIN", "0.15")); PASSES = int(os.environ.get("ECHO_PASSES", "2"))

cut, mp, out = sys.argv[1:4]
iv = [tuple(map(float, a.split("-"))) for a in sys.argv[4:]]
sr = 48000
m = json.load(open(mp))["segments"]

def tw(t):
    for x in m:
        if x["a"] <= t <= x["b"]: return x["n"] + t - x["a"]
    for x in m:
        if x["a"] >= t: return x["n"]
    return m[-1]["n"]

a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", cut, "-vn", "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"], capture_output=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)
mono = a.mean(axis=1)
o = a.copy()
N, H = 2048, 512
win = np.hanning(N)

def peak(y, s_):
    n = len(y); f = np.fft.rfft(y - y.mean(), 2 * n); r = np.fft.irfft(f * np.conj(f))[:n]; r /= r[0]
    lo, hi = int(.2 * s_), int(.4 * s_); j = int(np.argmax(r[lo:hi])) + lo
    return j, float(r[j])

def stft(x):
    pad = np.concatenate([np.zeros(N), x, np.zeros(N)])
    fr = np.lib.stride_tricks.sliding_window_view(pad, N)[::H] * win
    return np.fft.rfft(fr, axis=1), len(pad)

def istft(S, L):
    fr = np.fft.irfft(S, axis=1) * win
    y = np.zeros(L); w = np.zeros(L)
    for i, f in enumerate(fr):
        y[i * H:i * H + N] += f; w[i * H:i * H + N] += win ** 2
    return (y / np.maximum(w, 1e-8))[N:-N]

def suppress(block2, lag, strength):
    """block2: (n,2). Returns echo-reduced block."""
    mono_b = block2.mean(axis=1)
    Y, L = stft(mono_b)
    P = np.abs(Y) ** 2 + 1e-12
    Lf = max(1, int(round(lag / H)))
    beta = min(0.9, strength ** 2 * BETAK)      # echo power relative to the direct sound
    R = np.zeros_like(P)
    R[Lf:] = beta * P[:-Lf]
    G = np.clip(1 - ALPHA * R / P, GMIN, 1.0)
    # smooth the gain (frequency 5 bins, time 3 frames) to avoid musical noise
    k = np.ones(5) / 5
    G = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, G)
    k = np.ones(3) / 3
    G = np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), 0, G)
    res = np.zeros_like(block2)
    for ch in range(2):
        S, L = stft(block2[:, ch])
        res[:, ch] = istft(S * G[:S.shape[0]], L)[:len(block2)]
    return res

for s, e in iv:
    i0, i1 = int(max(0, tw(s) - 0.15) * sr), int(min(len(a) / sr, tw(e) + 0.15) * sr)
    blk = 8 * sr; pos = i0
    while pos < i1:
        q = min(i1, pos + blk)
        if i1 - q < 3 * sr: q = i1
        j, c = peak(mono[pos:q][::3], sr // 3); d = j * 3
        if c >= 0.2:
            c = min(c, 0.49)
            strength = (1 - np.sqrt(1 - 4 * c * c)) / (2 * c)      # echo amplitude ratio
            ctx = int(0.3 * sr)
            a0 = max(0, pos - ctx); a1 = min(len(a), q + ctx)
            blk_out = a[a0:a1]
            for _ in range(PASSES): blk_out = suppress(blk_out, d, strength)    # d = lag in samples
            seg = blk_out[pos - a0:q - a0]
            g = np.sqrt((a[pos:q] ** 2).mean() / max((seg ** 2).mean(), 1e-12)); seg = seg * min(g, 2.0)   # make-up gain: keep the loudness (max +6 dB)
            fade = int(0.08 * sr); w = np.ones(q - pos); w[:fade] = np.linspace(0, 1, fade); w[-fade:] = np.linspace(1, 0, fade)
            o[pos:q] = a[pos:q] * (1 - w)[:, None] + seg * w[:, None]
        pos = q

# de-click: a short smooth dip (±8 ms, depth 0.55) at EVERY join of the cut removes the transient a hard cut leaves
for x in m[1:]:
    c = int(x["n"] * sr); w = int(0.008 * sr)
    if c - w < 0 or c + w > len(o): continue
    o[c - w:c + w] *= (1 - 0.55 * np.hanning(2 * w))[:, None]
d = np.abs(o); mk = d > 0.8
o[mk] = np.sign(o[mk]) * (0.8 + 0.19 * np.tanh((d[mk] - 0.8) / 0.19))
pcm = (np.clip(o, -0.99, 0.99) * 32767).astype("<i2")
with wave.open(out, "wb") as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(sr); wv.writeframes(pcm.tobytes())
print("wrote", out)
