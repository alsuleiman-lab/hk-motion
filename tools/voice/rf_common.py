# -*- coding: utf-8 -*-
# Shared helpers of the recitation fix (tools/recitation_fix.mjs). Pure numpy + ffmpeg, so every local Python can import it
# (the Chatterbox venv, ComfyUI's Python for faster-whisper, the system Python).
# Moved from the gta6 trial (.tmp/gta6/voice_fix/m_common.py, user's choice 2026-11-21) and made general: every number comes from the job file.
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
KEEP = 0.03        # silence kept around the trimmed words of a candidate
FADE = 0.03        # every join of the splice: 30 ms fades (critical-rules 17: 20–60 ms)


def ff(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def job(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read(p, sr=SR, ch=1):
    """any audio file → float32 [n] (ch=1) or [n, ch]"""
    q = p + f".{sr}.{ch}.tmp.wav"
    ff("-i", p, "-ac", str(ch), "-ar", str(sr), "-c:a", "pcm_s16le", q)
    x = read_wav(q)
    os.remove(q)
    return x if ch > 1 else (x if x.ndim == 1 else x[:, 0])


def read_wav(p, a=None, b=None):
    """a 16-bit PCM wav (or a stretch a..b seconds of it) → float32 [n] mono or [n, ch]"""
    w = wave.open(p, "rb")
    sr, ch = w.getframerate(), w.getnchannels()
    s = 0 if a is None else int(round(a * sr))
    n = w.getnframes() - s if b is None else int(round(b * sr)) - s
    w.setpos(max(0, s))
    x = np.frombuffer(w.readframes(max(0, n)), np.int16).astype(np.float32) / 32768
    w.close()
    return x.reshape(-1, ch) if ch > 1 else x


def wav_info(p):
    w = wave.open(p, "rb")
    r = (w.getframerate(), w.getnchannels(), w.getnframes())
    w.close()
    return r


def write(p, x, sr=SR):
    x = np.asarray(x, np.float32)
    ch = 1 if x.ndim == 1 else x.shape[1]
    w = wave.open(p, "wb")
    w.setnchannels(ch); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()


def mono(x):
    return x if x.ndim == 1 else x.mean(1)


def active_db(x, sr=SR):
    """loudness of the voiced part only (20 ms frames within 30 dB of the loudest), and the peak"""
    x = mono(x)
    n = int(sr * 0.02)
    fr = [x[i:i + n] for i in range(0, max(1, len(x) - n), n)]
    db = np.array([10 * np.log10((f ** 2).mean() + 1e-12) for f in fr])
    act = db[db > db.max() - 30]
    return float(10 * np.log10(np.mean(10 ** (act / 10)))), float(20 * np.log10(np.abs(x).max() + 1e-9))


def trim(x, sr=SR, thr_db=-42, keep=KEEP):
    n = int(sr * 0.01)
    e = np.array([20 * np.log10(np.sqrt((x[i:i + n] ** 2).mean()) + 1e-9) for i in range(0, max(1, len(x) - n), n)])
    on = np.where(e > max(thr_db, e.max() - 40))[0]
    if len(on) == 0:
        return x
    s = max(0, on[0] * n - int(keep * sr)); t = min(len(x), (on[-1] + 1) * n + int(keep * sr))
    return x[s:t]


def ramp(x, sr=SR, fin=0.0, fout=0.0):
    """linear fade-in / fade-out (seconds) on [n] or [n, ch]"""
    y = np.array(x, np.float32, copy=True)
    for d, at_start in ((fin, True), (fout, False)):
        k = min(len(y) // 2, int(sr * d))
        if k <= 0:
            continue
        g = np.linspace(0, 1, k, dtype=np.float32)
        if not at_start:
            g = g[::-1]
        if y.ndim > 1:
            g = g[:, None]
        if at_start:
            y[:k] *= g
        else:
            y[-k:] *= g
    return y


def level(x, target_db):
    """the candidate at the original's loudness (active dB), peak kept under −0.3 dBFS"""
    db, _ = active_db(x)
    y = x * 10 ** ((target_db - db) / 20)
    pk = np.abs(y).max()
    return y * (0.97 / pk) if pk > 0.97 else y


def fit_tail(src, n, sr=SR):
    """his own pause (room tone) fitted to n samples: cut, or repeated with 10 ms crossfades when it is shorter"""
    if n <= 0:
        return np.zeros((0,) + src.shape[1:], np.float32)
    if len(src) >= n:
        return src[:n].copy()
    if len(src) < int(0.03 * sr):
        return np.zeros((n,) + src.shape[1:], np.float32)
    k = int(0.01 * sr); out = src.copy()
    while len(out) < n:
        g = np.linspace(0, 1, k, dtype=np.float32)
        if src.ndim > 1:
            g = g[:, None]
        out = np.concatenate([out[:-k], out[-k:] * (1 - g) + src[:k] * g, src[k:]])
    return out[:n]


def build(J, cand, orig):
    """THE SPLICE (critical-rules 17), shared by the in-context preview and --apply so the preview is exactly what will be applied.
    orig: the cut audio around the spot as [n, ch] starting at J['A'] − J['pre_ctx'] … ; cand: the corrected words alone (mono, levelled).
    The span A..B (his wrong words with the gaps around them) becomes: his real gap before the words + the candidate + his real pause after the words,
    fitted so the silence after the new words (in the span + after B) is ≤ 0.4 s, rounded to whole frames (30 fps).
    Returns (segment [m_samples, ch], info)."""
    A, B, w0, w1, nxt = J["A"], J["B"], J["first_s"], J["last_e"], J["next_s"]
    base = J["orig_from"]
    S = lambda t: int(round((t - base) * SR))
    ch = orig.shape[1] if orig.ndim > 1 else 1
    c = np.repeat(cand[:, None], ch, 1) if orig.ndim > 1 else cand
    pre = orig[S(A):S(max(A, w0 - KEEP))]
    tail_src = orig[S(min(B, w1 + KEEP)):S(B)]
    after = max(0.0, nxt - B)                                   # his pause that stays after B
    want_tail = min(max(B - w1 - KEEP, 0.05), max(0.05, 0.40 - KEEP - after - 0.01))
    raw = len(pre) / SR + len(c) / SR + want_tail
    m = max(1, int(round(raw * 30)))
    tail_n = int(m / 30 * SR) - len(pre) - len(c)
    if tail_n < int(0.02 * SR):
        m += 1; tail_n = int(m / 30 * SR) - len(pre) - len(c)
    tail = fit_tail(tail_src, tail_n)
    seg = np.concatenate([ramp(pre, fout=min(FADE, len(pre) / SR / 2)) if len(pre) else pre,
                          ramp(c, fin=FADE, fout=FADE),
                          ramp(tail, fin=min(FADE, tail_n / SR / 2), fout=min(FADE, tail_n / SR / 2))])
    info = dict(n=int(round((B - A) * 30)), m=m, cand_at=round(A + len(pre) / SR, 4), cand_len=round(len(c) / SR, 4),
                tail=round(tail_n / SR, 4), silence_after=round(KEEP + tail_n / SR + after, 3), pre=len(pre))
    return seg.astype(np.float32), info


def assemble(head, seg, rest, info, sr=SR):
    """head (audio up to A) + the segment + rest (audio from B). The join at B is in his pause: 30 ms fade-in; at A the segment starts with his own
    gap (continuous), or, when that gap is empty, the head ends with a 20 ms fade-out into the candidate's own fade-in."""
    head = np.array(head, np.float32, copy=True); rest = np.array(rest, np.float32, copy=True)
    if info["pre"] == 0 and len(head) > int(0.02 * sr):
        k = int(0.02 * sr); head[-k:] = ramp(head[-k:], sr, fout=0.02)
    k = min(len(rest), int(FADE * sr)); rest[:k] = ramp(rest[:k], sr, fin=FADE)
    return np.concatenate([head, seg, rest])


def splice_into(J, cand, orig_full, sr=SR):
    """orig_full: the whole cut audio [n, ch]. Returns the new whole audio and the info."""
    seg, info = build(dict(J, orig_from=0.0), cand, orig_full)
    a, b = int(round(J["A"] * sr)), int(round(J["B"] * sr))
    return assemble(orig_full[:a], seg, orig_full[b:], info, sr), info
