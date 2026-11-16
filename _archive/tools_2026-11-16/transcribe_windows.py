"""Windowed word-level transcription (higher fidelity than one pass over a long file: Whisper otherwise smooths away restarts).
Usage: python tools/transcribe_windows.py <audio16k.wav> <vad.json> <out.json> [--win 18]
Windows are cut at the middle of VAD gaps near every <win> seconds. Output: [{"s","e","w"}] with absolute seconds."""
import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
src, vadf, out = sys.argv[1:4]
a = sys.argv[4:]
WIN = float(a[a.index("--win")+1]) if "--win" in a else 18.0
audio = decode_audio(src, sampling_rate=16000); total = len(audio)/16000
gaps = json.load(open(vadf))["gaps"]  # [start,dur]
mids = [g[0]+g[1]/2 for g in gaps if g[1] >= 0.25]
cuts = [0.0]; t = WIN
while t < total:
    near = [m for m in mids if cuts[-1] + 6 < m < cuts[-1] + WIN * 1.6]
    c = min(near, key=lambda m: abs(m-t)) if near else t
    cuts.append(c)
    t = c + WIN
cuts.append(total)
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
CUES = "أعيد، عفواً، عفوا، لحظة، آسف، غلط، مرة أخرى"
res = []
for s, e in zip(cuts[:-1], cuts[1:]):
    seg = audio[int(s*16000):int(e*16000)]
    segs, _ = m.transcribe(seg, language="ar", vad_filter=False, beam_size=8, word_timestamps=True, condition_on_previous_text=False,
                           temperature=[0.0, 0.2, 0.4], no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None,
                           hotwords=CUES, initial_prompt="تسجيل بصوت المتحدث، قد يقول: أعيد، أو عفواً، ثم يعيد الجملة. ")
    for sg in segs:
        for w in sg.words:
            res.append({"s": round(w.start+s, 2), "e": round(w.end+s, 2), "w": w.word.strip()})
    print(round(s), end=" ", flush=True)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("\n", len(res), "words")
