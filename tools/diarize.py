"""Speaker diarization (WhisperX + pyannote community-1): who speaks when, per word and per turn.
Usage: python tools/diarize.py <audio|video> <out.json> [--words words.json] [--speakers N | --min N --max N]
                               [--ref NAME=voice.wav ...] [--start s] [--end s]
 - --words: reuse our transcript ([{"s","e","w","p"}], e.g. .tmp/stage/<p>/words.json) — no second Whisper pass.
   Without it: WhisperX large-v3 transcription + Arabic wav2vec2 alignment.
 - --ref: name speakers by voice. Default ref: data/voices/sheikh.wav (if present) → the sheikh is named "sheikh".
   Each diarized speaker's voice print is compared (cosine) with every ref; best match ≥ 0.5 takes its name.
 - Runs on the ComfyUI embedded python (torch cu126 + pyannote). whisperx was installed there with --no-deps;
   its protobuf is too old for pyannote, so a newer one lives in S:/AI_Tools/whisperx_libs (first on sys.path here only).
Output: {"speakers": {label: {"name", "talk_s", "ref_sim"}}, "turns": [{"s","e","spk","name","text"}], "words": [{"s","e","w","p","spk"}]}"""
import os, sys, json
sys.path.insert(0, r"S:\AI_Tools\whisperx_libs")
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib)
    os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
import warnings; warnings.filterwarnings("ignore")
import torchaudio  # old speechbrain (pulled in by pyannote) calls this removed API
if not hasattr(torchaudio, "set_audio_backend"): torchaudio.set_audio_backend = lambda *_: None
import numpy as np, torch, whisperx
from whisperx.diarize import DiarizationPipeline

SR = 16000
src, out = sys.argv[1], sys.argv[2]
a = sys.argv[3:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
st, en = float(opt("--start", 0)), float(opt("--end", 0))
refs = dict(a[i + 1].split("=", 1) for i, x in enumerate(a) if x == "--ref")
default_ref = os.path.join("data", "voices", "sheikh.wav")  # run from the workspace root
if not refs and os.path.exists(default_ref):
    refs = {"sheikh": default_ref}

audio = whisperx.load_audio(src)[int(st * SR): int(en * SR) if en else None]
token = os.environ.get("HF_TOKEN")

# 1) words: reuse ours, or WhisperX transcribe + align
if opt("--words"):
    words = [w for w in json.load(open(opt("--words"), encoding="utf-8")) if w["e"] > st and (not en or w["s"] < en)]
    words = [{**w, "s": w["s"] - st, "e": w["e"] - st} for w in words]
else:
    m = whisperx.load_model("large-v3", "cuda", compute_type="float16", language="ar")
    r = m.transcribe(audio, batch_size=16, language="ar")
    del m; torch.cuda.empty_cache()
    am, meta = whisperx.load_align_model(language_code="ar", device="cuda")
    r = whisperx.align(r["segments"], am, meta, audio, "cuda", return_char_alignments=False)
    del am; torch.cuda.empty_cache()
    words = [{"s": w["start"], "e": w["end"], "w": w["word"].strip(), "p": round(w.get("score", 0), 2)}
             for sg in r["segments"] for w in sg.get("words", []) if "start" in w]

# 2) diarize
dia = DiarizationPipeline(token=token, device=torch.device("cuda"))
n = opt("--speakers")
df, emb = dia(audio, num_speakers=int(n) if n else None,
              min_speakers=int(opt("--min")) if opt("--min") else None,
              max_speakers=int(opt("--max")) if opt("--max") else None, return_embeddings=True)

# 3) words → speaker (dominant overlap, else nearest turn)
res = whisperx.assign_word_speakers(df, {"segments": [{"start": w["s"], "end": w["e"], "words": [{"start": w["s"], "end": w["e"], "word": w["w"]}]} for w in words]}, fill_nearest=True)
for w, sg in zip(words, res["segments"]):
    w["spk"] = sg.get("speaker", "?")

# 4) name speakers by reference voice (same embedding model the pipeline uses)
talk = df.assign(d=df.end - df.start).groupby("speaker").d.sum().to_dict()
spk = {s: {"name": s, "talk_s": round(talk.get(s, 0), 1), "ref_sim": None} for s in sorted(talk)}
if refs and emb:
    from pyannote.audio import Inference, Model
    em = Inference(Model.from_pretrained("pyannote/wespeaker-voxceleb-resnet34-LM", token=token), window="whole", device=torch.device("cuda"))
    cos = lambda x, y: float(np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y) + 1e-9))
    def voice(x):  # one print from the speaker's longest turns (≤ 60 s), not the pipeline's centroid: same model as the ref
        return np.asarray(em({"waveform": torch.from_numpy(x[None, :]), "sample_rate": SR})).ravel()
    for s in spk:
        segs = df[df.speaker == s].assign(d=lambda t: t.end - t.start).sort_values("d", ascending=False)
        cut, tot = [], 0
        for _, r in segs.iterrows():
            if tot >= 60: break
            cut.append(audio[int(r.start * SR): int(r.end * SR)]); tot += r.end - r.start
        v = voice(np.concatenate(cut))
        best = max(((cos(v, voice(whisperx.load_audio(p))), name) for name, p in refs.items()), default=(0, None))
        spk[s]["ref_sim"] = round(best[0], 2)
        if best[0] >= 0.5: spk[s]["name"] = best[1]

# 5) turns = consecutive words of one speaker
turns = []
for w in words:
    if turns and turns[-1]["spk"] == w["spk"] and w["s"] - turns[-1]["e"] < 2.0:
        turns[-1]["e"] = w["e"]; turns[-1]["text"] += " " + w["w"]
    else:
        turns.append({"s": w["s"], "e": w["e"], "spk": w["spk"], "text": w["w"]})
for t in turns + words:
    t["s"], t["e"] = round(t["s"] + st, 2), round(t["e"] + st, 2)
for t in turns:
    t["name"] = spk.get(t["spk"], {}).get("name", t["spk"])
json.dump({"speakers": spk, "turns": turns, "words": words}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(json.dumps(spk, ensure_ascii=False))
print(len(turns), "turns,", len(words), "words")
