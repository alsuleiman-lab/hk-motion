"""Word-onset-safe cut ranges (user order 2026-11-06: «تحذف بدايات بعض الكلمات… لابد أن تضبط أمرك»).
Usage: python -I tools/cut_safe_rem.py <project> [--drop a-b,c-d] [--keep a-b,c-d]
  --drop: source ranges to remove whole (editor instruction blocks, noise, hallucinated intro/outro words).
  --keep: source ranges that must stay whole (a quiet nasheed / the clip's own sound) — added as speech.
Reads .tmp/<p>/a16k.wav; writes .tmp/<p>/vad.json (the kept ranges with their natural pauses; sets onset_fixed so `vad_onset_fix` does not override), rem_vad.txt (= your --drop, feed to `stage.mjs cut --rem`) and keep_extra.txt (feed to `--keep`, with yours); original vad saved once (original saved once as vad.orig.json).
Why: the gate measures pauses with Silero VAD (unpadded), which starts 0.1-0.3 s AFTER a soft word onset; cutting at VAD start − pad clipped «بالمقابل» to «مقابل».
Here the cut point is placed from the audio energy (the true onset found by scanning back from the VAD start) minus a margin, the tail pad is 0.02 s after the VAD end, and the pause left behind is kept <= 0.375 s.
A join where that is impossible is listed in keep_extra.txt (pause slightly over 0.40 s, exempted explicitly; the word is never clipped)."""
import sys, json, os, shutil
import numpy as np
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps, VadOptions
p = sys.argv[1]; T = os.path.join(".tmp", p)
def opt(k):
    if "--" + k not in sys.argv: return []
    return [tuple(map(float, x.split("-"))) for x in sys.argv[sys.argv.index("--" + k) + 1].split(",") if x]
DROP, KEEP = opt("drop"), opt("keep")
a = decode_audio(os.path.join(T, "a16k.wav"), sampling_rate=16000)
sp = get_speech_timestamps(a, VadOptions(min_silence_duration_ms=120, speech_pad_ms=0))
iv = [[s["start"] / 16000, s["end"] / 16000] for s in sp]
out = []
for s, e in iv:
    parts = [[s, e]]
    for pa, qa in DROP:
        np_ = []
        for x, y in parts:
            if y <= pa or x >= qa: np_.append([x, y])
            else:
                if x < pa: np_.append([x, pa])
                if y > qa: np_.append([qa, y])
        parts = np_
    out += [q for q in parts if q[1] - q[0] > 0.05]
iv = sorted(out + [[x, y] for x, y in KEEP])
fr = int(0.01 * 16000); n = len(a) // fr
db = 20 * np.log10(np.array([np.sqrt(np.mean(a[i * fr:(i + 1) * fr] ** 2) + 1e-12) for i in range(n)]) + 1e-9)
def onset(e, s):
    lo = int(max(e, s - 0.5) * 100); hi = int(s * 100)
    seg = db[int(e * 100) + 10:hi - 5] if hi - int(e * 100) > 20 else db[lo:hi]
    floor = np.percentile(seg, 25) if len(seg) else -70
    thr = max(floor + 8, -62); k = hi
    while k > lo and db[k - 1] > thr: k -= 1
    return k / 100.0
TAIL = 0.02; lefts = []; keeps = []
segs = [[max(0.0, min(iv[0][0] - 0.10, onset(0.0, iv[0][0]) - 0.06)), iv[0][1]]]   # first segment too: start from the TRUE onset (VAD starts 0.1–0.3 s late)
for i in range(len(iv) - 1):
    e, s = iv[i][1], iv[i + 1][0]
    if s - e <= 0.30:                                   # natural short pause: left whole
        segs[-1][1] = iv[i + 1][1]; continue
    t0 = onset(e, s)
    for M in (0.08, 0.06, 0.04):
        r1 = min(s - 0.10, t0 - M)                      # onset side: never later than the true onset − margin
        tail = min(0.18, 0.31 - (s - r1))             # natural pause ≈ 0.28 s; the tail gives way when the onset needs room
        if tail >= TAIL: break
    if db[int(r1 * 100)] > -45:                         # the cut would land inside sound: move it to the quietest 10 ms frame just before (a valley between syllables / the true silence)
        k0 = int(max(e + 0.05, r1 - 0.25) * 100); k1 = int(r1 * 100)
        if k1 > k0: r1 = (k0 + int(np.argmin(db[k0:k1 + 1]))) / 100.0
    tail = min(0.18, 0.31 - (s - r1)); tail = max(tail, TAIL); left = tail + (s - r1); lefts.append(left)
    if left > 0.36: keeps.append((round(e - 0.05, 2), round(e + 0.12, 2)))
    segs[-1][1] = e + tail; segs.append([r1, iv[i + 1][1]])
segs[-1][1] += 0.18
kept = []
for x, y in segs:                                        # the dropped blocks stay dropped
    parts = [[x, y]]
    for pa, qa in DROP:
        np_ = []
        for u, w in parts:
            if w <= pa or u >= qa: np_.append([u, w])
            else:
                if u < pa: np_.append([u, pa])
                if w > qa: np_.append([qa, w])
        parts = np_
    kept += [q for q in parts if q[1] - q[0] > 0.06]
fmt = lambda L: ",".join(f"{x:.2f}-{y:.2f}" for x, y in L)
open(os.path.join(T, "rem_vad.txt"), "w").write(fmt(DROP)); open(os.path.join(T, "keep_extra.txt"), "w").write(fmt(keeps))
vf = os.path.join(T, "vad.json"); orig = os.path.join(T, "vad.orig.json")
if not os.path.exists(orig): shutil.copy(vf, orig)
v = json.load(open(orig, encoding="utf-8")); v["speech"] = [[round(x, 3), round(y, 3)] for x, y in kept]; v["onset_fixed"] = True; json.dump(v, open(vf, "w"))
print(f"mean pause left {np.mean(lefts):.2f}s | kept ranges {len(kept)} | joins needing --keep (pause just over 0.40): {len(keeps)}")
