"""Detect non-speech human sounds (throat clearing, cough, sneeze, sniff, breath, gasp, burp, snort, lip sounds) with YAMNet (ONNX, AudioSet 521 classes).
Usage: python_embeded/python.exe tools/detect_noises.py <audio16k.wav> <out.json> [--thr 0.15] [--start 0] [--end 0]
YAMNet works on 0.96 s windows with a 0.48 s hop, so event times are coarse; refine them with the VAD segments / energy before cutting.
Output: [{"s","e","label","score","speech"}]  where speech = the mean 'Speech' score in the same frames (a high value means the noise is probably mixed with words: do NOT cut blindly)."""
import sys, json, csv, numpy as np, soundfile as sf, onnxruntime as ort
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
thr = float(a[a.index("--thr")+1]) if "--thr" in a else 0.15
st = float(a[a.index("--start")+1]) if "--start" in a else 0.0
en = float(a[a.index("--end")+1]) if "--end" in a else 0.0
names = [r[2] for r in list(csv.reader(open("models/yamnet/yamnet_class_map.csv", encoding="utf-8")))[1:]]
NOISE = {"Cough", "Throat clearing", "Sneeze", "Sniff", "Snort", "Burping, eructation", "Gasp", "Pant", "Breathing", "Snoring", "Hiccup", "Whistling", "Finger snapping", "Clicking", "Smack", "Chewing, mastication", "Gulp", "Hands", "Clapping"}
idx = {n: i for i, n in enumerate(names)}
wav, sr = sf.read(src, dtype="float32")
assert sr == 16000, "need 16 kHz mono"
if wav.ndim > 1: wav = wav.mean(1)
wav = wav[int(st*sr): int(en*sr) if en else None]
s = ort.InferenceSession("models/yamnet/yamnet.onnx", providers=["CPUExecutionProvider"])
scores = s.run(["output_0"], {"waveform": wav})[0]          # (frames, 521)
hop, win = 0.48, 0.96
res = []
for t, row in enumerate(scores):
    top = {n: float(row[idx[n]]) for n in NOISE if n in idx}
    lab, sc = max(top.items(), key=lambda x: x[1])
    if sc >= thr: res.append({"s": round(st + t*hop, 2), "e": round(st + t*hop + win, 2), "label": lab, "score": round(sc, 3), "speech": round(float(row[idx["Speech"]]), 3)})
json.dump(res, open(out, "w"), ensure_ascii=False)
print(len(scores), "frames;", len(res), "noise frames >=", thr)
for r in res[:60]: print(r)
