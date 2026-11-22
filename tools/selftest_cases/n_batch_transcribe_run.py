"""Self-test helper (tools/selftest_cases/n_batch_transcribe.mjs): the per-VAD transcription one segment at a time (the old path) and 4 at a time (--batch 4), on a tiny
real clip (two of data/voices/*.wav, Arabic speech, cut into 4 short segments); ONE model load, both ways, on the card.
Prints one line:  RESULT {"batch_default","same_words","diff_segments","max_dt","segments","words","seq_s","bat_s"}"""
import os, sys, json, time, importlib.util
T_START = time.time()
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
spec = importlib.util.spec_from_file_location("tvs", os.path.join(ROOT, "tools", "transcribe_vad_segments.py"))
tvs = importlib.util.module_from_spec(spec); spec.loader.exec_module(tvs)
from faster_whisper.audio import decode_audio
a = decode_audio(os.path.join(ROOT, "data", "voices", "hasan.wav"), sampling_rate=16000)[:16000 * 6]
b = decode_audio(os.path.join(ROOT, "data", "voices", "juma.wav"), sampling_rate=16000)[:16000 * 4]
audio = np.concatenate([a, np.zeros(8000, dtype=np.float32), b])
segs = [[0.2, 3.1], [3.3, 5.9], [6.6, 8.2], [8.4, 10.3]]
quiet = lambda *x, **k: None
m = tvs.load_model()
t0 = time.time(); seq = tvs.transcribe_segments(m, audio, segs, batch=1, log=quiet); t1 = time.time()
bat = tvs.transcribe_segments(m, audio, segs, batch=4, log=quiet); t2 = time.time()
words = lambda r: [w["w"] for w in r["words"]]
diff = [x["i"] for x, y in zip(seq, bat) if words(x) != words(y) or x["s"] != y["s"] or x["e"] != y["e"]]
dt = max([max(abs(p["s"] - q["s"]), abs(p["e"] - q["e"])) for x, y in zip(seq, bat) if x["i"] not in diff for p, q in zip(x["words"], y["words"])] or [0.0])
print("RESULT " + json.dumps({"batch_default": tvs.BATCH_DEFAULT, "same_words": not diff and len(seq) == len(bat), "diff_segments": diff, "max_dt": dt, "segments": len(seq),
                              "words": sum(len(x["words"]) for x in seq), "seq_s": round(t1 - t0, 1), "bat_s": round(t2 - t1, 1), "load_s": round(t0 - T_START, 1)}))
