"""A stream clip's sound laid on the clip's own frame grid (2026-11-22, the real 3 h 46 min stream; the khariji clip kept a ×14.1 «click» at 1705.2 s after its 4 ms join fade).
The stream's one-pass cut audio (tools/audio_cut.py) joins its segments at SAMPLE-EXACT cumulative positions; the picture and the clip's map join them on the renderer's cumulative FRAME rounding
(tools/lib/lazy_clip.mjs piecesOf: n0 = round(cum*30)). The two phases differ by up to ±16 ms, so cutting the clip's sound at the frame-grid piece boundaries (the old ffmpeg atrim) left every
join up to a frame away from the map's n — where the audio gate measures, where join_fade.py dips, and where the picture changes. Here every stretch (tools/lib/lazy_clip.mjs audioPlan: stream
segment k, offset into it, duration, clip second n) is copied from the stream's audio and laid at its own n: the sound of a source second plays at the picture frame of that second, and each join
(the stream's own 8 ms fade dip) lands exactly on n. A stretch that is longer than the stream segment's sound is padded with silence; a shorter one is truncated (join_fade.py softens the step).
The stream's cleaned audio (cut_clean.wav / cut_audio.wav / cut16k.wav, RNNoise) is DELAYED against the raw cut audio (cut.wav) by one RNNoise frame (480 samples at 48 kHz): measured, never assumed
(--lag-ref <raw cut.wav>: cross-correlation of 10 loud windows, median, refused if they disagree), and taken back so the clean sound is aligned too.
Usage: python -I tools/stream/clip_audio.py <stream audio.wav> <stream map.json> <plan.json> <out.wav> [--lag-ref <stream raw cut.wav>] [--lag SAMPLES] [--build-rate 48000]"""
import sys, json, os, struct
import numpy as np

def read_wav(path, mode="r"):
    with open(path, "rb") as f:
        head = f.read(1 << 16)
        if head[:4] != b"RIFF" or head[8:12] != b"WAVE":
            raise SystemExit(f"clip_audio: not a RIFF/WAVE file: {path}")
        off, rate, ch, bits, data_off, data_len = 12, 0, 0, 0, 0, 0
        while off + 8 <= len(head):
            cid, size = head[off:off + 4], struct.unpack("<I", head[off + 4:off + 8])[0]
            if cid == b"fmt ":
                _, ch, rate, _, _, bits = struct.unpack("<HHIIHH", head[off + 8:off + 24])
            elif cid == b"data":
                data_off, data_len = off + 8, size
                break
            off += 8 + size + (size & 1)
        f.seek(0, 2); total = f.tell()
    if bits != 16 or not data_off:
        raise SystemExit(f"clip_audio: need 16-bit PCM (got {bits} bits): {path}")
    if data_len == 0 or data_off + data_len > total:
        data_len = total - data_off
    n = data_len // (2 * ch)
    return np.memmap(path, dtype="<i2", mode=mode, offset=data_off, shape=(n, ch)), rate, ch

def measure_lag(ref, rref, x, rx, windows=10, win_s=2.0, search_s=0.05):
    """samples (at x's rate) by which x is DELAYED against ref: x[i + lag] ≈ ref[i]"""
    fac = rref // rx
    if fac * rx != rref:
        raise SystemExit(f"clip_audio: rates {rref}/{rx} are not a whole ratio")
    W, S = int(win_s * rref), int(search_s * rref)
    last = min(len(ref), len(x) * fac) - W - S
    if last <= S:
        raise SystemExit("clip_audio: file too short to measure the delay")
    cand = np.linspace(S, last, 41).astype(int)
    loud = sorted(cand, key=lambda c: -float(np.sqrt(np.mean(ref[c:c + W:8, 0].astype(np.float32) ** 2))))[:windows]
    lags = []
    for c in sorted(loud):
        a = ref[c:c + W, 0].astype(np.float32)
        b = x[(c - S) // fac:(c + W + S) // fac, 0].astype(np.float32)
        if fac > 1:
            m = len(a) // fac * fac
            a = a[:m].reshape(-1, fac).mean(1)
        a = a - a.mean(); b = b - b.mean()
        n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
        cc = np.fft.irfft(np.fft.rfft(b, n) * np.conj(np.fft.rfft(a, n)), n)
        Sx = S // fac
        k = int(np.argmax(cc[:2 * Sx + 1]))
        norm = float(np.sqrt((a ** 2).sum() * (b[k:k + len(a)] ** 2).sum())) + 1e-9
        if cc[k] / norm > 0.3:
            lags.append(k - Sx)
    if len(lags) < 5:
        raise SystemExit(f"clip_audio: delay not measurable ({len(lags)} confident windows of {windows})")
    med = int(np.median(lags))
    if max(abs(l - med) for l in lags) > 2:
        raise SystemExit(f"clip_audio: the windows disagree on the delay: {sorted(lags)}")
    return med

def main():
    A = sys.argv[1:]
    src, mapf, planf, out = A[:4]
    opt = lambda k, d=None: A[A.index(k) + 1] if k in A else d
    brate = int(opt("--build-rate", 48000))
    x, rate, ch = read_wav(src)
    segs = json.load(open(mapf, encoding="utf-8"))["segments"]
    plan = json.load(open(planf, encoding="utf-8"))
    if opt("--lag") is not None:
        lag = int(opt("--lag"))
    elif opt("--lag-ref") and os.path.abspath(opt("--lag-ref")) != os.path.abspath(src):
        ref, rref, _ = read_wav(opt("--lag-ref"))
        lag = measure_lag(ref, rref, x, rate)
    else:
        lag = 0
    # the sound of segment k in the stream's audio: [pos[k], pos[k] + ln[k]) samples at the build rate (the sums tools/audio_cut.py makes)
    pos, ln, cum = [], [], 0
    for g in segs:
        l = int(round(g["b"] * brate)) - int(round(g["a"] * brate))
        pos.append(cum); ln.append(l); cum += l
    sc = rate / brate
    total = int(round(max(p["n"] + p["dur"] for p in plan) * rate))
    tmp = out + ".part.wav"
    with open(tmp, "wb") as f:
        db = total * ch * 2
        f.write(b"RIFF" + struct.pack("<I", 36 + db) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, ch, rate, rate * ch * 2, ch * 2, 16) + b"data" + struct.pack("<I", db))
        f.truncate(44 + db)
    y = np.memmap(tmp, dtype="<i2", mode="r+", offset=44, shape=(total, ch))
    padded = trunc = 0
    for p in plan:
        k = p["k"]
        s0 = int(round(pos[k] * sc)) + int(round(p["off"] * rate)) + lag
        avail = int(round(ln[k] * sc)) - int(round(p["off"] * rate))
        d0 = int(round(p["n"] * rate)); want = int(round((p["n"] + p["dur"]) * rate)) - d0
        cnt = max(0, min(want, avail, len(x) - s0, total - d0))
        if cnt > 0 and s0 >= 0:
            y[d0:d0 + cnt] = x[s0:s0 + cnt]
        padded += cnt < want; trunc += avail > want
    y.flush(); del y
    os.replace(tmp, out)
    print(f"clip_audio: {len(plan)} stretches laid on the frame grid ({padded} padded with silence, {trunc} cut short), delay taken back {lag} samples -> {out}")

main()
