"""Find non-speech vocal sounds (throat clearing, cough, hmm, breath, lip sounds) that VAD keeps as "speech".
Why this exists: VAD (Silero) marks any human sound as speech, YAMNet/AudioSet did NOT recognise a real throat-clear in this project (it scored it "Speech 0.3-0.5"),
but Whisper itself gives the tell: for a short sound with no words it hallucinates a stock phrase ("شكرا", "ترجمة نانسي قنقر", "اشتركوا في القناة"...).

Method:  1) take VAD speech segments that contain NO word of the word-level transcript,
         2) re-transcribe each segment (+/-0.6 s context) with no safety thresholds,
         3) classify as NOISE when the text is empty or only a known hallucination phrase and the segment is short (< --maxdur, default 1.2 s).
Usage: python tools/clean_noises.py <audio16k.wav> <vad.json> <words.json> <out.json> [--maxdur 1.2] [--pad 0.05]
Output: {"noise":[[start,end,text]...], "review":[[start,end,text]...]}   noise = safe to cut, review = has plausible words (ask the user / do not cut)."""
import os, sys, json, re
torch_lib = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/Lib/site-packages/torch/lib"  # cublas DLL for faster-whisper on the GPU
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
audio_p, vad_p, words_p, out_p = sys.argv[1:5]
a = sys.argv[5:]
maxdur = float(a[a.index("--maxdur") + 1]) if "--maxdur" in a else 1.2
pad = float(a[a.index("--pad") + 1]) if "--pad" in a else 0.05
HALLU = ["شكرا", "شكراً", "شكرا لكم", "شكراً لكم", "ترجمة نانسي قنقر", "اشتركوا", "اشترك", "لا تنسوا الاشتراك", "مرحبا", "تمت الترجمة", "الله", "آه", "اه", "امم", "امممم", "هم", "ممم", "ها"]
norm = lambda s: re.sub(r"[^؀-ۿ ]", "", s).strip()
HSET = {norm(h) for h in HALLU}
# Whisper's stock hallucinations on silence/noise: also match when the phrase merely CONTAINS one of these stems ("اشتركوا في القناة", "شكرا على المشاهدة"...)
HSTEMS = ["اشترك", "شكرا", "شكراً", "ترجمة", "نانسي", "الاشتراك", "مشاهدت", "لا تنسوا", "الى اللقاء", "إلى اللقاء"]
# Whisper writes throat-clearing / coughs / hums as repeated letters or laugh-like strings ("ههههههه", "ااااا", "ممم", "اممبو"...): treat those as noise too.
def is_hallu(t):
    if t == "" or t in HSET or any(k in t for k in HSTEMS): return True
    c = t.replace(" ", "")
    if re.search(r"(.)\1{3,}", c): return True                       # same letter 4+ times
    if 0 < len(c) <= 2: return True                                  # 1-2 letters: a hum, not a word
    if re.fullmatch(r"[هحخعغكقمنوايأآ]{2,}", c) and len(set(c)) <= 2: return True
    return False
wav = decode_audio(audio_p, sampling_rate=16000)
vad = json.load(open(vad_p))["speech"]
words = json.load(open(words_p))
# Whisper word timestamps can be stretched over long silences/noises (a single word lasting 10+ s). Never trust more than 1.2 s per word,
# otherwise a stretched word hides a throat-clear that sits inside its fake span (this happened: "من" 105.6-117.9).
eff = lambda w: (w["s"], min(w["e"], w["s"] + 1.2))
ghost = [(s, e) for s, e in vad if not any(eff(w)[1] > s and eff(w)[0] < e for w in words)]
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
noise, review = [], []
for s, e in ghost:
    x = wav[int(max(0, s - 0.6) * 16000): int((e + 0.6) * 16000)]
    segs, _ = m.transcribe(x, language="ar", beam_size=5, temperature=0.0, condition_on_previous_text=False, no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None, vad_filter=False)
    t = norm(" ".join(g.text for g in segs))
    short = (e - s) <= maxdur
    (noise if (short and is_hallu(t)) else review).append([round(s - pad, 2), round(e + pad, 2), t])
json.dump({"noise": noise, "review": review}, open(out_p, "w", encoding="utf-8"), ensure_ascii=False)
print(len(ghost), "ghost segments ->", len(noise), "noise,", len(review), "review")
