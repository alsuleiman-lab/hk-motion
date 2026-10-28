"""Audio-only cut from an EDL in a fraction of a second: slice a decoded WAV with numpy and join with 8 ms fades (same fades as the ffmpeg graph).
Why: an ffmpeg graph with one atrim per segment is O(n^2) — 292 segments took 240 s; slicing the samples takes < 1 s.
Usage: python tools/audio_cut.py <audio48.wav> <map.json> <out.wav> [--until S] [--fade 0.008]
audio48.wav = the source audio decoded once (ffmpeg -vn -ac 2 -ar 48000 -c:a pcm_s16le); tools/cut_edl.mjs keeps it cached next to the video analysis."""
import sys, json, wave, numpy as np
src, mapf, out = sys.argv[1:4]
a = sys.argv[4:]
until = float(a[a.index("--until") + 1]) if "--until" in a else 1e9
fade = float(a[a.index("--fade") + 1]) if "--fade" in a else 0.008
w = wave.open(src, "rb"); sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
assert sw == 2, "16-bit PCM expected"
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch); w.close()
segs = [s for s in json.load(open(mapf))["segments"] if s["n"] < until]
if segs and segs[-1]["n"] + (segs[-1]["b"] - segs[-1]["a"]) > until: segs[-1]["b"] = segs[-1]["a"] + (until - segs[-1]["n"])
pieces, nf = [], int(round(fade * sr))
for s in segs:
    i0, i1 = int(round(s["a"] * sr)), int(round(s["b"] * sr))
    p = x[i0:i1].astype(np.float32)
    if len(p) > 2 * nf:
        r = np.linspace(0, 1, nf, dtype=np.float32)[:, None]
        p[:nf] *= r; p[-nf:] *= r[::-1]
    pieces.append(p)
y = np.concatenate(pieces) if pieces else np.zeros((0, ch), np.float32)
o = wave.open(out, "wb"); o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr); o.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes()); o.close()
print(f"audio cut: {len(segs)} segments, {len(y) / sr:.2f} s -> {out}")
