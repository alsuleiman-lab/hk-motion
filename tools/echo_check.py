"""Before/after check for tools/echo_reduce.py: per source interval prints the echo correlation at the estimated lag (orig -> processed),
the 'ghost' correlations at 2x/3x the lag and at negative lags (a good result keeps them near 0), and the level change in dB.
Usage: python tools/echo_check.py <cut.mp4> <processed.wav> <map.json> <src_start-src_end> [...]"""
import sys, json, subprocess
import numpy as np
cut, proc, mp = sys.argv[1:4]
iv = [tuple(map(float, a.split("-"))) for a in sys.argv[4:]]
m = json.load(open(mp))["segments"]
sr = 16000
def tw(t):
    for x in m:
        if x["a"] <= t <= x["b"]: return x["n"] + t - x["a"]
    for x in m:
        if x["a"] >= t: return x["n"]
    return m[-1]["n"]
def get(f, a, b):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-t", str(b - a), "-i", f, "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
def ac(y):
    y = y - y.mean(); n = len(y); f = np.fft.rfft(y, 2 * n); r = np.fft.irfft(f * np.conj(f))[:n]; return r / r[0]
worst = 0
for s, e in iv:
    a, b = tw(s), tw(e)
    t = a
    while t + 3 < b:
        o = get(cut, t, min(b, t + 8)); p = get(proc, t, min(b, t + 8)); t += 8
        ro = ac(o); rp = ac(p); lo, hi = int(.2 * sr), int(.4 * sr)
        d = int(np.argmax(ro[lo:hi])) + lo
        if ro[d] < 0.2: continue
        g = [float(rp[k * d]) for k in (2, 3)]
        db = 20 * np.log10(np.sqrt((p ** 2).mean()) / np.sqrt((o ** 2).mean()))
        worst = max(worst, rp[d], *[abs(x) for x in g])
        print("src %.0f-%.0f lag %.3f s | echo corr %.2f -> %.2f | ghosts(2d,3d) %.2f %.2f | level %+.1f dB" % (s, e, d / sr, ro[d], rp[d], g[0], g[1], db))
print("worst remaining/ghost correlation: %.2f (target < 0.15)" % worst)
