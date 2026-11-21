"""Second listening of short spans: re-transcribes each span ON ITS OWN with the strongest model (large-v3 float16, GPU, beam 8, no prompt, no previous text),
so a word one pass invented (gta6 2026-11-21: «صور لبنان» — he never said Lebanon) or a misrecited verse word (gta6: «عذاب شديد» for «عذاب أليم») is judged by
the audio a second time, with the word confidence. No prompt on purpose: a prompt with the expected text would push the decoder towards it.
Usage: python -I tools/span_recheck.py <audio (any format)> <spans.json> <out.json>
  spans.json = [{"id": "...", "s": sec, "e": sec}, ...]   out.json = [{"id","s","e","text","words":[{"s","e","w","p"}]}] (absolute seconds)
Used by tools/name_doubt.mjs (names before they become a required element) and tools/recitation_check.mjs (verse words before a misrecitation is reported)."""
import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
    os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

src, spf, out = sys.argv[1:4]
spans = json.load(open(spf, encoding="utf-8"))
audio = decode_audio(src, sampling_rate=16000)
dur = len(audio) / 16000
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
res = []
for sp in spans:
    s0, e0 = max(0.0, float(sp["s"])), min(dur, float(sp["e"]))
    if e0 - s0 < 0.3:
        res.append({"id": sp["id"], "s": s0, "e": e0, "text": "", "words": []}); continue
    chunk = audio[int(s0 * 16000): int(e0 * 16000)]
    it, _ = m.transcribe(chunk, language="ar", vad_filter=False, beam_size=8, word_timestamps=True, condition_on_previous_text=False,
                         temperature=[0.0, 0.2], no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None)
    words = [{"s": round(w.start + s0, 2), "e": round(w.end + s0, 2), "w": w.word.strip(), "p": round(w.probability, 3)} for g in it for w in g.words]
    res.append({"id": sp["id"], "s": round(s0, 2), "e": round(e0, 2), "text": " ".join(w["w"] for w in words), "words": words})
    print(f"span {sp['id']}: {res[-1]['text']}", flush=True)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(len(res), "spans")
