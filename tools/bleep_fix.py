# -*- coding: utf-8 -*-
"""Fix the bleeps of an already-built cut audio (.tmp/<p>/cut_audio.wav, the lazy cut's sound) without rebuilding the episode:
  · NEVER inside the Quran or a hadith (user 2026-11-20, frame 11116: «جعلت كلمتي "يقتلوا" مشفرة، في القرآن هذا الفعل ممنوع»): every bleeped word inside a verse
    (.tmp/<p>/verses.json cut times) or a narrated hadith (.tmp/<p>/hadith.json) gets its own sound back — taken from the original, cleaned the same way (RNNoise,
    tools/audio_clean.mjs), laid in with 15-ms cross-fades;
  · words of the table that the cut sound missed are bleeped now (a root added later, e.g. «اغتصب», user 2026-11-20 frame 13921).
usage (Remotion root): python tools/bleep_fix.py <p>      → rewrites .tmp/<p>/cut_audio.wav (the old one kept as cut_audio.before_bleep_fix.wav) and prints what it did
"""
import json, os, re, subprocess, sys, wave
import numpy as np

p = sys.argv[1]
T = json.load(open("data/sensitive_words.json", encoding="utf-8"))
PATTERN = "|".join(map(re.escape, T["roots"] + T.get("forms", [])))
PART = tuple(T.get("part", [0.25, 0.75]))
FREQ, GAIN = float(T.get("tone_hz", 880)), 10 ** (float(T.get("gain_db", -16)) / 20)
TMP = f".tmp/{p}"
A = f"{TMP}/cut_audio.wav"
cw = json.load(open(f"{TMP}/cut_words.json", encoding="utf-8")); words = cw if isinstance(cw, list) else cw["words"]
segs = json.load(open(f"public/{p}_map.json"))["segments"]
src = json.load(open(f"{TMP}/prep_config.json", encoding="utf-8")).get("source", f"public/{p}_src.mp4")

prot = []   # cut-second ranges where nothing is ever bleeped
try:
    for v in json.load(open(f"{TMP}/verses.json", encoding="utf-8")):
        if v.get("cut"): prot.append((v["cut"][0] - 0.3, v["cut"][-1] + 0.9))
except FileNotFoundError: pass
try:
    for h in json.load(open(f"{TMP}/hadith.json", encoding="utf-8")):
        if h.get("at") is not None: prot.append((h["at"] - 0.3, (h.get("until") or h["at"] + 3) + 0.5))
except FileNotFoundError: pass
inprot = lambda t: any(a <= t <= b for a, b in prot)

def to_src(t):
    for s in segs:
        if s["n"] - 0.001 <= t <= s["n"] + (s["b"] - s["a"]) + 0.001: return s["a"] + (t - s["n"])
    return None

with wave.open(A) as f:
    SR, ch, n = f.getframerate(), f.getnchannels(), f.getnframes()
    x = np.frombuffer(f.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768
y = x.copy()
FADE = int(0.015 * SR)
done = []
for w in words:
    t, s, e = w["w"], w["s"], w["e"]
    if not re.search(PATTERN, t): continue
    # (user 2026-11-20, frame 13095: «كلمة القتل شفرتها كلها، المفترض نصف الكلمة فقط») every word first gets its own sound back, then (outside the Quran and
    # a hadith) ONE bleep on the middle half of the ROOT inside it — a second bleep at slightly different times had covered the whole word
    if True:
        ss, se = to_src(s - 0.06), to_src(e + 0.06)
        if ss is None or se is None or se <= ss: continue
        raw, cln = f"{TMP}/_bf_raw.wav", f"{TMP}/_bf_clean.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.4f}", "-t", f"{se - ss:.4f}", "-i", src, "-vn", "-ac", str(ch), "-ar", str(SR), raw], check=True)
        r = subprocess.run(["node", "tools/audio_clean.mjs", raw, cln], capture_output=True, text=True)
        piece = cln if r.returncode == 0 and os.path.exists(cln) else raw
        with wave.open(piece) as g:
            q = np.frombuffer(g.readframes(g.getnframes()), dtype=np.int16).reshape(-1, g.getnchannels()).astype(np.float32) / 32768
        if q.shape[1] != ch: q = np.repeat(q[:, :1], ch, axis=1)
        i0 = int((s - 0.06) * SR); m = min(len(q), len(y) - i0)
        env = np.ones(m, np.float32); env[:FADE] = np.linspace(0, 1, FADE); env[-FADE:] = np.linspace(1, 0, FADE)
        y[i0:i0 + m] = y[i0:i0 + m] * (1 - env[:, None]) + q[:m] * env[:, None]
        if inprot(s): done.append(f"أُعيد صوت «{t}» عند {s:.2f} (آية أو حديث)"); continue
    m = re.search(PATTERN, t); L = max(1, len(t))
    r0, r1 = s + (e - s) * m.start() / L, s + (e - s) * m.end() / L   # the root inside the word («لقتل» → «قتل»)
    a, b = r0 + (r1 - r0) * PART[0], r0 + (r1 - r0) * PART[1]
    i, j = int(a * SR), int(b * SR); tt = np.arange(j - i) / SR
    env = np.minimum(1, np.minimum(tt, (j - i) / SR - tt) / 0.012)
    y[i:j] = y[i:j] * (1 - env[:, None]) + (np.sin(2 * np.pi * FREQ * tt) * GAIN * env)[:, None]
    done.append(f"كُتم نصف جذر «{t}» عند {s:.2f}")
for f in (f"{TMP}/_bf_raw.wav", f"{TMP}/_bf_clean.wav"):
    try: os.remove(f)
    except OSError: pass
os.replace(A, f"{TMP}/cut_audio.before_bleep_fix.wav")
with wave.open(A, "wb") as f:
    f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print("\n".join(done) or "لا كلمة أُعيدت")
print(f"bleep_fix: {len(done)} أُعيدت، والباقي مكتوم بالجدول ({A})")
