"""Micro-fade at every join of a clip's audio (2026-11-22, the real 3 h 46 min stream: the khariji and the deist call failed the audio gate on «نقرات عند وصلات القص»).
The one-pass stream cut joins two stretches of the source with a hard sample step; a clip sliced from it (tools/stream/clip_lazy.mjs) carries those steps. Each join gets a short raised-cosine
fade-out before it and fade-in after it (a dip of 2 x FADE ms, at the join, which the cut model puts in a pause), so no sample jump is left. In place, 16-bit PCM wav, any rate/channels.
clip_lazy.mjs passes 8 (the length of the stream cut's own fades): 4 ms left a speech burst 3 ms before a join audible to the engine's seam measure. The joins must be where the sound really joins: tools/stream/clip_audio.py lays it on the map's n.
Usage: python tools/stream/join_fade.py <wav> <joins.json (clip seconds)> [fade_ms=4]"""
import sys, json, struct
import numpy as np

wav, joins_f = sys.argv[1], sys.argv[2]
fade_ms = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0
joins = json.load(open(joins_f, encoding="utf-8"))
with open(wav, "r+b") as f:
    head = f.read(1 << 16)
    if head[:4] != b"RIFF" or head[8:12] != b"WAVE":
        raise SystemExit("join_fade: not a RIFF/WAVE file")
    off, rate, ch, bits, data_off, data_len = 12, 0, 0, 0, 0, 0
    while off + 8 <= len(head):
        cid, size = head[off:off + 4], struct.unpack("<I", head[off + 4:off + 8])[0]
        if cid == b"fmt ":
            _, ch, rate, _, _, bits = struct.unpack("<HHIIHH", head[off + 8:off + 24])
        elif cid == b"data":
            data_off, data_len = off + 8, size
            break
        off += 8 + size + (size & 1)
    if bits != 16 or not data_off:
        raise SystemExit(f"join_fade: need 16-bit PCM (got {bits} bits)")
    f.seek(0, 2); total = f.tell()
    if data_len == 0 or data_off + data_len > total:   # streamed header (size unknown): the rest of the file
        data_len = total - data_off
    n = data_len // (2 * ch)
    mm = np.memmap(wav, dtype="<i2", mode="r+", offset=data_off, shape=(n, ch))
    F = max(2, int(rate * fade_ms / 1000.0))
    ramp = (0.5 * (1 + np.cos(np.linspace(0, np.pi, F, endpoint=False)))).astype(np.float32)   # 1 → ~0
    done = 0
    for t in joins:
        j = int(round(float(t) * rate))
        a, b = j - F, j + F
        if a < 0 or b > n:
            continue
        mm[a:j] = (mm[a:j].astype(np.float32) * ramp[:, None]).astype(np.int16)           # fade out into the join
        mm[j:b] = (mm[j:b].astype(np.float32) * ramp[::-1][:, None]).astype(np.int16)     # fade in after it
        done += 1
    mm.flush()
print(f"join_fade: {done}/{len(joins)} joins faded ({fade_ms} ms) in {wav}")
