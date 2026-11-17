"""THE word table of a video — the single source of truth for cutting and every cut check (user 2026-11-16, «نموذج قص واحد»).
Usage: python -I tools/words_table.py <a16k.wav> <tr_vad.json> <out words_table.json> --sha <sha256 of the wav>
Input : the large-v3 (float16, beam 8) transcript per VAD segment (tools/transcribe_vad_segments.py → tr_vad.json).
Work  : WhisperX wav2vec2 Arabic forced alignment of that exact text → each word's start/end on the audio + its alignment score.
        A word the aligner cannot place (digits, symbols) keeps Whisper's own times and gets p = null, aligned = false.
Output: {"model": "...", "audio_sha": "...", "words": [{"i","w","s","e","p","aligned"}]} — built once per video; tools read it, nobody re-measures.
Runs on the ComfyUI embedded python (torch + whisperx, same setup as tools/diarize.py)."""
import os, sys, json
sys.path.insert(0, r"S:\AI_Tools\whisperx_libs")
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib)
    os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
import warnings; warnings.filterwarnings("ignore")
import torchaudio
if not hasattr(torchaudio, "set_audio_backend"): torchaudio.set_audio_backend = lambda *_: None
import torch, whisperx

wav, tr_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
a = sys.argv[4:]
sha = a[a.index("--sha") + 1] if "--sha" in a else None
audio = whisperx.load_audio(wav)
tr = json.load(open(tr_path, encoding="utf-8"))
segs = [{"start": max(0.0, s["s"] - 0.15), "end": s["e"] + 0.15, "text": s["text"]} for s in tr if s.get("text", "").strip()]
am, meta = whisperx.load_align_model(language_code="ar", device="cuda")
words = []
for k, (sg, src) in enumerate(zip(segs, [s for s in tr if s.get("text", "").strip()])):
    try:
        r = whisperx.align([sg], am, meta, audio, "cuda", return_char_alignments=False)
        al = [w for x in r["segments"] for w in x.get("words", [])]
    except Exception:
        al = []
    wh = src.get("words", [])
    # one aligned entry per Whisper word when the counts agree; otherwise keep the aligner's words and fall back to Whisper times where it gave none
    base = al if al else [{"word": w["w"]} for w in wh]
    for j, w in enumerate(base):
        fw = wh[j] if j < len(wh) else None
        if "start" in w and "end" in w:
            words.append({"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3), "p": round(w.get("score", 0), 3), "aligned": True})
        elif fw:
            words.append({"w": w.get("word", fw["w"]).strip(), "s": fw["s"], "e": fw["e"], "p": None, "aligned": False})
    if (k + 1) % 50 == 0: print(f"aligned {k + 1}/{len(segs)} segments", flush=True)
del am; torch.cuda.empty_cache()
words.sort(key=lambda w: w["s"])
for i, w in enumerate(words): w["i"] = i
json.dump({"model": "faster-whisper large-v3 float16 beam 8 (per VAD segment) + whisperx wav2vec2-ar alignment", "audio_sha": sha, "words": words},
          open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(f"words_table: {len(words)} words, {sum(1 for w in words if w['aligned'])} aligned -> {out}")
