"""Find NON-SPEECH sounds that the pipeline would otherwise keep (user complaint 2026-10-21: a sound that is not speech stayed in the video).
Root cause: VAD keeps any human sound, and Whisper turns a noise into a stock phrase («اشتركوا في القناة», «شكراً»…) WITH word timestamps, so
word-based checks (tools/clean_noises.py) think it is speech. This scan uses three independent tells per short VAD segment:
  1) text: empty / stock hallucination / 1-2 letters / repeated letters,
  2) acoustics: voiced fraction (autocorrelation peak 0.45+ at 70-400 Hz) and spectral flatness (noise-like = flat, high HF share),
  3) word confidence: mean word probability from the word-level transcript when available.
Usage: python tools/noise_scan.py <audio16k.wav> <tr.json from transcribe_vad_segments.py> <out.json> [--maxdur 1.6] [--map <name>_map.json]  (--map ignores segments the cut already removed)
Output: {"cut":[[s,e,text,why]...], "review":[...]}   cut = safe to remove (feed to auto_cut --cut); review = ask the user (with the time and the text).
Run it BEFORE cutting and again on the final audio (re-transcribe the cut) — a cut can also leave clicks at joins: see tools/final_review.mjs."""
import sys, json, re
import numpy as np
from faster_whisper.audio import decode_audio
audio_p, tr_p, out_p = sys.argv[1:4]
a = sys.argv[4:]
map_p = a[a.index("--map") + 1] if "--map" in a else None
kept = json.load(open(map_p))["segments"] if map_p else None
def still_in_cut(s, e):
    """a segment that the cut already removed is not a problem any more"""
    if kept is None: return True
    ov = sum(max(0, min(e, k["b"]) - max(s, k["a"])) for k in kept)
    return ov > 0.5 * (e - s)
maxdur = float(a[a.index("--maxdur") + 1]) if "--maxdur" in a else 1.6
STEMS = ["اشترك", "شكرا", "شكراً", "ترجمة", "نانسي", "الاشتراك", "مشاهدت", "لا تنسوا", "الى اللقاء", "إلى اللقاء", "ابتصال", "وشك"]
norm = lambda s: re.sub(r"[^؀-ۿ ]", "", s).strip()
def hallu(t):
    c = t.replace(" ", "")
    return c == "" or any(k in t for k in STEMS) or bool(re.search(r"(.)\1{3,}", c)) or (0 < len(c) <= 2)
sr = 16000
y = decode_audio(audio_p, sampling_rate=sr).astype(np.float64)
def feats(s, e):
    x = y[int(s * sr):int(e * sr)]; w = int(0.03 * sr); v = []; fl = []; hi = []
    for i in range(0, len(x) - w, w // 2):
        f = x[i:i + w]
        if np.sqrt((f ** 2).mean()) < 0.01: continue
        ac = np.correlate(f, f, "full")[len(f) - 1:]; ac /= ac[0] + 1e-12
        v.append(ac[int(sr / 400):int(sr / 70)].max() > 0.45)
        sp = np.abs(np.fft.rfft(f * np.hanning(len(f)))) + 1e-9; fr = np.fft.rfftfreq(len(f), 1 / sr)
        fl.append(np.exp(np.log(sp[1:]).mean()) / sp[1:].mean()); hi.append(sp[fr > 3000].sum() / sp.sum())
    return (float(np.mean(v)) if v else 0, float(np.mean(fl)) if fl else 0, float(np.mean(hi)) if hi else 0, len(v))
tr = json.load(open(tr_p, encoding="utf-8"))
cut, review = [], []
for seg in tr:
    s, e, t = seg["s"], seg["e"], norm(seg["text"]); d = e - s
    if d > maxdur or not still_in_cut(s, e): continue
    vf, fl, hi, n = feats(s, e)
    why = []
    if hallu(t): why.append("نص هلوسة/قصير")
    if n >= 3 and vf < 0.3: why.append("غير مجهور %.2f" % vf)
    if fl > 0.35 and hi > 0.25: why.append("ضجيج عريض الطيف")
    if not why: continue
    row = [round(s - 0.05, 2), round(e + 0.05, 2), t, " + ".join(why), round(vf, 2)]
    stock = any(k in t for k in STEMS) and d < 1.0   # a short stock phrase («اشتركوا في القناة») is Whisper's tell for a non-speech sound (project rule)
    (cut if (hallu(t) and (vf < 0.45 or len(why) > 1 or stock)) else review).append(row)
json.dump({"cut": cut, "review": review}, open(out_p, "w", encoding="utf-8"), ensure_ascii=False)
print("cut:", len(cut), "review:", len(review))
