"""Generate the reusable light sound-effects pack (no music) into public/sfx.
Usage: python tools/make_sfx.py   (stdlib only)"""
import math, random, struct, wave, os
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

def write(name, samples, peak=0.8):
    m = max(abs(s) for s in samples) or 1
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(s / m * peak * 32767)) for s in samples))

def whoosh(dur=0.7):
    n = int(SR * dur); y = []; lp = 0.0
    for i in range(n):
        t = i / n
        cutoff = 0.02 + 0.30 * math.sin(math.pi * t)          # sweep up then down
        lp += cutoff * (random.uniform(-1, 1) - lp)
        env = math.sin(math.pi * t) ** 2
        y.append(lp * env)
    return y

def pop(dur=0.14, f0=620, f1=300):
    n = int(SR * dur); y = []; ph = 0.0
    for i in range(n):
        t = i / n; f = f0 + (f1 - f0) * t; ph += 2 * math.pi * f / SR
        y.append(math.sin(ph) * math.exp(-t * 6) * min(1, i / 60))
    return y

def chime(dur=0.9, base=880):
    n = int(SR * dur); y = []
    for i in range(n):
        t = i / SR
        y.append(sum(a * math.sin(2 * math.pi * base * k * t) for k, a in ((1, 1), (2.01, .4), (3.02, .15))) * math.exp(-t * 5) * min(1, i / 80))
    return y

def tick(dur=0.05):
    n = int(SR * dur)
    return [random.uniform(-1, 1) * math.exp(-i / n * 9) for i in range(n)]

write("whoosh.wav", whoosh())
write("pop.wav", pop(), 0.7)
write("chime.wav", chime(), 0.6)
write("tick.wav", tick(), 0.5)
print("sfx written to", os.path.abspath(OUT))
