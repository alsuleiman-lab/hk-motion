"""20 light montage sound effects (no music) → scratch (the 5 kept sounds were copied to public/sfx/el_*.wav, user 2026-11-06)  (stdlib only). user 2026-11-06: «20 صوتاً وسأربط كل صوت بعنصر»"""
import math, random, struct, wave, os
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx_pack"); os.makedirs(OUT, exist_ok=True)
random.seed(11)
N = lambda d: int(SR * d)
def write(name, y, peak=0.7):
    m = max(abs(s) for s in y) or 1
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(s / m * peak * 32767)) for s in y))
def tone(d, f0, f1=None, dec=6, att=40):
    f1 = f1 or f0; y = []; ph = 0.0
    for i in range(N(d)):
        t = i / N(d); ph += 2 * math.pi * (f0 + (f1 - f0) * t) / SR
        y.append(math.sin(ph) * math.exp(-t * dec) * min(1, i / att))
    return y
def noise(d, lpmax=0.3, dec=5, shape="exp"):
    y = []; lp = 0.0; n = N(d)
    for i in range(n):
        t = i / n; lp += lpmax * (random.uniform(-1, 1) - lp)
        env = math.exp(-t * dec) if shape == "exp" else math.sin(math.pi * t) ** 2
        y.append(lp * env)
    return y
def sweep(d, a, b):
    y = []; lp = 0.0; n = N(d)
    for i in range(n):
        t = i / n; c = a + (b - a) * t; lp += c * (random.uniform(-1, 1) - lp)
        y.append(lp * math.sin(math.pi * t) ** 1.5)
    return y
def cat(*p):
    o = []
    for x in p: o += x
    return o
def mix(*p):
    n = max(len(x) for x in p); return [sum(x[i] for x in p if i < len(x)) for i in range(n)]
def gap(d): return [0.0] * N(d)
def chime(base, d=0.9): return [sum(a * math.sin(2 * math.pi * base * k * (i / SR)) for k, a in ((1, 1), (2.01, .4), (3.02, .15))) * math.exp(-(i / SR) * 5) * min(1, i / 80) for i in range(N(d))]

write("01_whoosh_soft", sweep(0.7, 0.02, 0.2))
write("02_whoosh_fast", sweep(0.3, 0.05, 0.4))
write("03_pop", tone(0.14, 620, 300))
write("04_pop_double", cat(tone(0.1, 700, 380), gap(0.06), tone(0.12, 880, 450)))
write("05_chime_bell", chime(880))
write("06_chime_low", chime(523, 1.1))
write("07_tick", noise(0.05, 0.6, 30))
write("08_click_paper", mix(noise(0.04, 0.7, 40), tone(0.04, 1800, 900, 40)))
write("09_paper_tear", noise(0.55, 0.45, 2.5, "sin"))
write("10_paper_slide", sweep(0.45, 0.03, 0.12))
write("11_stamp", mix(tone(0.25, 110, 60, 9, 8), noise(0.06, 0.5, 30)))
write("12_typing", cat(*[noise(0.03, 0.6, 35) + gap(random.uniform(0.04, 0.08)) for _ in range(8)]))
write("13_swoosh_up", sweep(0.5, 0.02, 0.5))
write("14_swoosh_down", sweep(0.5, 0.5, 0.02))
write("15_ding", tone(0.8, 1320, None, 5, 60))
write("16_success", cat(tone(0.18, 660, None, 6), tone(0.45, 990, None, 5)))
write("17_alert", cat(tone(0.14, 880, None, 8), gap(0.04), tone(0.14, 660, None, 8)))
write("18_bubble", tone(0.22, 300, 900, 8, 10))
write("19_thump", tone(0.35, 70, 40, 7, 6))
write("20_sparkle", mix(*[gap(i * 0.06) + tone(0.2, random.choice([1568, 1760, 2093, 2349]), None, 14, 30) for i in range(7)]))
print("ok")
