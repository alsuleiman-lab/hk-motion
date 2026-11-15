"""Word-level Arabic transcription tuned NOT to drop editor cue words ("أعيد", "عفواً", ...) and quiet/short speech.
Usage: python tools/transcribe_words.py <audio16k.wav> <out.json> [--start 0] [--end 0]
 - hotwords + initial_prompt bias the decoder towards the cue words
 - every "silence gives up" safety is off (no_speech/log_prob/compression thresholds) so faint phrases are not discarded
 - condition_on_previous_text=False so one hallucination doesn't cascade
Output: [{"s","e","w","p"}] seconds; also prints cue-word hits."""
import os, sys, json, re
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except Exception:
        pass
os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")

from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
st = float(a[a.index("--start")+1]) if "--start" in a else 0.0
en = float(a[a.index("--end")+1]) if "--end" in a else 0.0
audio = decode_audio(src, sampling_rate=16000)
audio = audio[int(st*16000): int(en*16000) if en else None]
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
CUES = "أعيد، عفواً، عفوا، أعيد الكلام، لحظة، آسف، غلط، مرة أخرى"
segs, _ = m.transcribe(audio, language="ar", vad_filter=False, beam_size=8, word_timestamps=True,
                       condition_on_previous_text=False, temperature=[0.0, 0.2, 0.4],
                       no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None,
                       hotwords=CUES, initial_prompt="تسجيل بصوت المتحدث، قد يقول: أعيد، أو عفواً، ثم يعيد الجملة. " )
words = [{"s": round(w.start+st, 2), "e": round(w.end+st, 2), "w": w.word.strip(), "p": round(w.probability, 2)} for sg in segs for w in sg.words]
json.dump(words, open(out, "w", encoding="utf-8"), ensure_ascii=False)
cue = re.compile(r"(عفو|أفو|افو|أعيد|اعيد|أعد|اعد|لحظ|آسف|اسف|غلط|مرة)")
print(len(words), "words; cue hits:", [f'{x["w"]}@{x["s"]}' for x in words if cue.search(x["w"])])
