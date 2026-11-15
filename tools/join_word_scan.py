"""Joins that cut INTO a word (user 2026-11-12: «الكلمة يقص من أولها إلى آخرها»): at every join of the cut, the sound level just before and just after.
A clean join sits in a pause on at least one side; voiced sound on BOTH sides (> -32 dB over 25 ms) means a word was cut mid-way (a half word / broken start).
Usage: python -I tools/join_word_scan.py <cut.wav> <map.json> [--db -32]   → prints the suspicious joins (cut seconds); exit 1 when any."""
import sys, json, wave
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
wav, mapf = sys.argv[1], sys.argv[2]
thr = float(sys.argv[sys.argv.index("--db") + 1]) if "--db" in sys.argv else -32.0
w = wave.open(wav); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
if w.getnchannels() > 1: x = x.reshape(-1, w.getnchannels()).mean(axis=1)
db = lambda a, b: 20 * np.log10(np.sqrt((x[max(0, int(a * sr)):int(b * sr)] ** 2).mean() + 1e-12) + 1e-9)
segs = json.load(open(mapf, encoding="utf-8"))["segments"]
# (user 2026-11-15 «أدواتنا لازم تفرق بين التشويش والإنسان») a join made by cutting a pause with NO human voice inside a kept clip (stage.mjs → .tmp/<p>/noise_gaps.json)
# has the clip's background noise on both sides, not a word: Silero heard no voice between its two edges. Such joins are counted, not failed.
import os
p = os.path.basename(mapf).replace("_map.json", "")
ng = []
try: ng = json.load(open(os.path.join(".tmp", p, "noise_gaps.json"), encoding="utf-8"))
except Exception: pass
noise_join = lambda left_b, right_a: any(abs(left_b - a) < 0.15 and abs(right_a - b) < 0.15 for a, b in ng)
t, bad, nj = 0.0, [], 0
for i, s in enumerate(segs[:-1]):
    t += s["b"] - s["a"]
    pre, post = db(t - 0.025, t - 0.002), db(t + 0.002, t + 0.025)
    if pre > thr and post > thr:
        if noise_join(s["b"], segs[i + 1]["a"]): nj += 1
        else: bad.append((round(t, 2), round(pre, 1), round(post, 1)))
if nj: print(f"ℹ join_word_scan: {nj} وصلة عند سكتة بلا صوت بشري داخل مقطع معروض (ضجيج خلفيته من الجهتين، لا كلمة)")
mm = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"
print(f"✘ join_word_scan: {len(bad)} وصلة قُطعت داخل كلام (صوت قبلها وبعدها):\n  " + "\n  ".join(f"{mm(a)} ({a}ث، الإطار {round(a * 30)}) قبل {p} dB / بعد {q} dB" for a, p, q in bad) if bad else f"✔ join_word_scan: كل الوصلات ({len(segs) - 1}) في سكتة")
sys.exit(1 if bad else 0)
