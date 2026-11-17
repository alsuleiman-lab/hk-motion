"""كتم نصف الكلمات الحساسة (إرهاب، داعش، تفجير …) بصفّارة هادئة، والصوت مكتوم تحتها (القاعدة في PREFERENCES.md القسم 3).
usage: python tools/bleep_words.py <project> <out.wav> [--sample a-b,c-d]   (أزمنة القص؛ بلا --sample = الصوت كاملاً)
المدخل: .tmp/<p>/cut.wav + public/<p>_map.json + .tmp/<p>/words_vad.json (يُشغَّل من جذر Remotion). الصفّارة 880Hz بمستوى -16dB، وتغطي منتصف جذر الكلمة (25%-75% بعد «ال»)."""
import json, re, sys, wave
import numpy as np

# (2026-11-17) the list and the level live in ONE table: data/sensitive_words.json (roots, misheard forms, two-word phrases, tone, level)
T = json.load(open("data/sensitive_words.json", encoding="utf-8"))
PATTERN = "|".join(map(re.escape, T["roots"] + T.get("forms", [])))
PHRASES = [tuple(x) for x in T.get("phrases", [])]
PART = tuple(T.get("part", [0.25, 0.75]))
SR, FREQ, GAIN, FADE = 48000, float(T.get("tone_hz", 880)), 10 ** (float(T.get("gain_db", -16)) / 20), 0.012

p, out = sys.argv[1], sys.argv[2]
sample = None
if "--sample" in sys.argv:
    sample = [tuple(map(float, r.split("-"))) for r in sys.argv[sys.argv.index("--sample") + 1].split(",")]

only = []   # --word a-b,c-d (source seconds): bleep the word(s) starting inside, whatever they are (a user instruction for one spot)
if "--word" in sys.argv:
    only = [tuple(map(float, r.split("-"))) for r in sys.argv[sys.argv.index("--word") + 1].split(",")]
w = json.load(open(f".tmp/{p}/words_vad.json", encoding="utf-8"))
words = w if isinstance(w, list) else (w.get("words") or [x for s in w["segments"] for x in s["words"]])
segs = json.load(open(f"public/{p}_map.json"))["segments"]

def to_cut(t):
    for s in segs:
        if s["a"] - 0.001 <= t <= s["b"] + 0.001:
            return s["n"] + (t - s["a"])
    near = min(segs, key=lambda s: min(abs(t - s["a"]), abs(t - s["b"])))   # a word edge inside the VAD pad that the cut trimmed
    return near["n"] if abs(t - near["a"]) <= 0.15 else None

ranges = []
nz = lambda s: re.sub(r"[ً-ْٰـ]", "", s).replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").strip(".,،؟?!")
prev = ""
for x in words:
    t = (x.get("word") or x.get("w")).strip()
    s, e = x.get("start", x.get("s")), x.get("end", x.get("e"))
    forced = any(lo <= s <= hi for lo, hi in only)   # --word a-b: a word the user asked to bleep at that exact source time
    phrase = any(nz(prev).endswith(nz(a)) and nz(t).endswith(nz(b)) for a, b in PHRASES)
    prev = t
    if not re.search(PATTERN, t) and not forced and not phrase:
        continue
    lead = 2 if t.startswith("ال") else 0
    cs = s + (e - s) * lead / len(t)
    a, b = cs + (e - cs) * PART[0], cs + (e - cs) * PART[1]
    ca, cb = to_cut(a), to_cut(b)
    print(f"src {s:7.2f}-{e:7.2f} -> cut {ca}-{cb}" if ca is not None else f"src {s:7.2f} outside the cut")
    if ca is not None and cb is not None:
        ranges.append((ca, cb))

with wave.open(f".tmp/{p}/cut.wav") as f:
    ch, n = f.getnchannels(), f.getnframes()
    x = np.frombuffer(f.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768

def bleep(x, rs):
    y = x.copy()
    for a, b in rs:
        i, j = int(a * SR), int(b * SR)
        tt = np.arange(j - i) / SR
        env = np.minimum(1, np.minimum(tt, (j - i) / SR - tt) / FADE)
        y[i:j] = y[i:j] * (1 - env[:, None]) + (np.sin(2 * np.pi * FREQ * tt) * GAIN * env)[:, None]
    return y

if sample:
    parts = []
    for lo, hi in sample:
        parts += [bleep(x[int(lo * SR):int(hi * SR)], [(a - lo, b - lo) for a, b in ranges if a >= lo and b <= hi]), np.zeros((int(0.6 * SR), ch), np.float32)]
    y = np.concatenate(parts)
else:
    y = bleep(x, ranges)
with wave.open(out, "wb") as f:
    f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"wrote {out} {len(y)/SR:.1f}s, {len(ranges)} spots")
# measured gate (2026-11-17): the beep must sit BELOW his speech level, never louder — the difference is printed, exit 1 when the beep is louder
mono = x.mean(axis=1)
fr = mono[: len(mono) // 960 * 960].reshape(-1, 960)
rms = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
speech = float(np.median(rms[rms > -40])) if (rms > -40).any() else -20.0
beep = 20 * np.log10(GAIN / np.sqrt(2))
print(f"level: speech {speech:.1f} dBFS, beep {beep:.1f} dBFS, difference {beep - speech:+.1f} dB")
if ranges and beep > speech:
    print("FAIL: the beep is louder than his speech — lower gain_db in data/sensitive_words.json"); sys.exit(1)
