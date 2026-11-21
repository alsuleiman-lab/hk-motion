# -*- coding: utf-8 -*-
# Raw engine outputs → the candidates of a recitation fix (tools/recitation_fix.mjs), from the gta6 trial's m_finalize/m_common/m_match:
#   trim to the words (30 ms kept), the original's loudness (active dB of his wrong words), an in-context preview made by THE SAME splice as --apply
#   (rf_common.build: his gap + the words + his own pause, silence after ≤ 0.4 s, 30 ms fades, whole frames), and MP3 copies to listen to.
#   python tools/voice/rf_finalize.py <job.json> [raw.wav …]       (default: every <dir>/raw_s*.wav)
# job "match": true also writes a «_m» variant pitch-shifted (rubberband, formants preserved) to the median pitch of his own wrong words (m_match.py).
import glob
import json
import os
import subprocess
import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_common import SR, active_db, assemble, build, ff, job, level, read, read_wav, trim, write  # noqa: E402

J = job(sys.argv[1]); D = J["dir"]
raws = sys.argv[2:] or sorted(glob.glob(os.path.join(D, "raw_s*.wav")))
his = read_wav(J["cut_audio"], J["first_s"], J["last_e"]); his = his.mean(1) if his.ndim > 1 else his
target = active_db(his)[0]
ctx = read_wav(J["cut_audio"], J["ctx_from"], J["ctx_to"])
cx = lambda t: int(round((t - J["ctx_from"]) * SR))


def f0med(x):
    import librosa
    y = librosa.resample(x, orig_sr=SR, target_sr=16000)
    f, _, _ = librosa.pyin(y, fmin=70, fmax=320, sr=16000, frame_length=640, hop_length=160)
    f = f[~np.isnan(f)]
    return float(np.median(f)) if len(f) else float("nan")


def rubber(x, pitch):
    p, q = os.path.join(D, "rb_in.tmp.wav"), os.path.join(D, "rb_out.tmp.wav"); write(p, x)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-af", f"rubberband=pitch={pitch:.4f}:formant=preserved:pitchq=quality:transients=smooth", q], check=True)
    y = read(q); os.remove(p); os.remove(q); return y


def finish(name, x):
    x = level(trim(x), target)
    out = os.path.join(D, name + ".wav"); write(out, x)
    seg, info = build(dict(J, orig_from=J["ctx_from"]), x, ctx)
    cp = os.path.join(D, name + "_ctx.wav"); write(cp, assemble(ctx[:cx(J["A"])], seg, ctx[cx(J["B"]):], info))
    for f in (out, cp):
        ff("-i", f, "-c:a", "libmp3lame", "-b:a", "192k", f[:-4] + ".mp3")
    db, pk = active_db(x)
    return dict(name=name, wav=out, ctx=cp, dur=round(len(x) / SR, 3), act_db=round(db, 1), peak_db=round(pk, 1), target_db=round(target, 1), **info)


res = []
for r in raws:
    base = os.path.splitext(os.path.basename(r))[0].replace("raw_", "cand_")
    x = read(r)
    res.append(finish(base, x) | {"src": os.path.basename(r)})
    if J.get("match"):
        y = trim(x); ratio = f0med(his) / f0med(y)
        if np.isfinite(ratio) and 0.6 < ratio < 1.6:
            res.append(finish(base + "_m", rubber(y, ratio)) | {"src": os.path.basename(r), "pitch_ratio": round(ratio, 3)})
for r in res:
    print(json.dumps({k: r[k] for k in ("name", "dur", "act_db", "target_db", "m", "silence_after")}, ensure_ascii=False))
json.dump(res, open(os.path.join(D, "finalize.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
