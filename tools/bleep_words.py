"""كتم نصف الكلمات الحساسة (إرهاب، داعش، تفجير …) بصفّارة هادئة، والصوت مكتوم تحتها (القاعدة في PREFERENCES.md القسم 3).
usage: python tools/bleep_words.py <project> <out.wav> [--sample a-b,c-d]   (أزمنة القص؛ بلا --sample = الصوت كاملاً)
المدخل: .tmp/<p>/cut.wav + public/<p>_map.json + .tmp/<p>/words_vad.json (يُشغَّل من جذر Remotion). الصفّارة 880Hz بمستوى -16dB، وتغطي منتصف جذر الكلمة (25%-75% بعد «ال»)."""
import json, re, sys, wave
import numpy as np

PATTERN = r"إره|ارها|إرها|داعش|دواعش|تفجير|تفجّر|انتحاري|انتحارية|متفجر|مجزر"   # أضف هنا ما يماثلها (مجزرة: تعليمة المستخدم 2026-10-29)
SR, FREQ, GAIN, FADE = 48000, 880, 0.16, 0.012

p, out = sys.argv[1], sys.argv[2]
sample = None
if "--sample" in sys.argv:
    sample = [tuple(map(float, r.split("-"))) for r in sys.argv[sys.argv.index("--sample") + 1].split(",")]

w = json.load(open(f".tmp/{p}/words_vad.json", encoding="utf-8"))
words = w if isinstance(w, list) else (w.get("words") or [x for s in w["segments"] for x in s["words"]])
segs = json.load(open(f"public/{p}_map.json"))["segments"]

def to_cut(t):
    for s in segs:
        if s["a"] - 0.001 <= t <= s["b"] + 0.001:
            return s["n"] + (t - s["a"])
    return None

ranges = []
for x in words:
    t = (x.get("word") or x.get("w")).strip()
    if not re.search(PATTERN, t):
        continue
    s, e = x.get("start", x.get("s")), x.get("end", x.get("e"))
    lead = 2 if t.startswith("ال") else 0
    cs = s + (e - s) * lead / len(t)
    a, b = cs + (e - cs) * 0.25, cs + (e - cs) * 0.75
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
