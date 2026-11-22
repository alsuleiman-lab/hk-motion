"""Transcribe every VAD speech segment on its own (short, independent decodes) so Whisper cannot smooth away restarts/stumbles the way it does on long audio.
Usage: python tools/transcribe_vad_segments.py <audio16k.wav> <vad.json> <out.json> [--merge 0.3] [--batch N]
Output: [{"i","s","e","text","words":[{"s","e","w"}]}] with absolute seconds.

--batch N (default BATCH_DEFAULT = 1 = the old path, one segment at a time, bit-for-bit what the pipeline always produced).
  N > 1 decodes the first 30 s window of N segments TOGETHER on the card: each window goes through the encoder ALONE (batch 1, the exact old numbers), then ONE beam-8
  decode serves the N independent segments (same model large-v3, float16, beam 8, temperature, word timestamps; everything after the decode is faster-whisper's own code).
  MEASURED 2026-11-22 (10-min stream sample, 66 segments, against the sequential result): NOT identical — a batched matrix product rounds differently from a batch of one,
  so in near-tie beam choices some segments come out with other words (3 of 66 at batch 4 and 8). The word times of the segments whose words agree are identical (0.000 s).
  Hence it is opt-in for measurement only; the pipeline (tools/stage.mjs) calls the tool without it. Do NOT raise BATCH_DEFAULT unless
  tools/selftest_cases/n_batch_transcribe.mjs and a full-sample comparison (word by word, ±20 ms) both pass.
  Several workers (num_workers / threads) and several processes were measured too: identical words, but NO speed-up on this card (the decode of one segment already keeps it busy).
Memory safety: out of memory halves the batch (down to 1); never the processor, never a lower precision."""
import os, sys, json
torch_lib = r"S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib):
    os.add_dll_directory(torch_lib); os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

BATCH_DEFAULT = 1
KW = dict(language="ar", vad_filter=False, beam_size=8, word_timestamps=True, condition_on_previous_text=False,
          temperature=[0.0, 0.2], no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None)


def merge_segments(speech, merge=0.3):
    segs = []
    for s, e in speech:
        if segs and s - segs[-1][1] < merge: segs[-1][1] = e
        else: segs.append([s, e])
    return segs


def is_oom(err):
    t = str(err).lower()
    return "out of memory" in t or "alloc" in t


def load_model(threads=4):
    """THE model: large-v3, float16, on the card (never the processor, never a lower precision)."""
    return WhisperModel("large-v3", device="cuda", compute_type="float16", cpu_threads=threads, num_workers=1)


def transcribe_segments(m, audio, segs, batch=1, log=print, checkpoint=None):
    """-> [{"i","s","e","text","words"}] in segment order. `m` was made by load_model()."""
    chunks = []
    for s, e in segs:
        s0, e0 = max(0, s - 0.15), min(len(audio) / 16000, e + 0.15)
        chunks.append((s0, audio[int(s0 * 16000):int(e0 * 16000)]))
    res_by_i = {}

    def finish_one(i, it):
        s, e = segs[i]; s0 = chunks[i][0]
        words = [{"s": round(w.start + s0, 2), "e": round(w.end + s0, 2), "w": w.word.strip()} for g in it for w in g.words]
        res_by_i[i] = {"i": i, "s": round(s, 2), "e": round(e, 2), "text": " ".join(w["w"] for w in words), "words": words}
        log(f"segment {i+1}/{len(segs)}: {res_by_i[i]['text']}", flush=True)
        if checkpoint: checkpoint([res_by_i[k] for k in sorted(res_by_i)])

    def decode_one(i):
        it, _ = m.transcribe(chunks[i][1], **KW)
        return list(it)

    if batch > 1:
        _batched(m, chunks, finish_one, batch, log)
    else:
        for i in range(len(segs)): finish_one(i, decode_one(i))
    return [res_by_i[k] for k in sorted(res_by_i)]


def _batched(m, chunks, finish_one, batch, log):
    """the (non-identical) batch path: window 1 of `batch` segments in one encoder pass + one beam-8 decode; the rest is faster-whisper's own code per segment."""
    import numpy as np, ctranslate2
    from faster_whisper.audio import pad_or_trim
    from faster_whisper.transcribe import get_compression_ratio
    class _Cap(Exception): pass
    cap = {}
    def _probe(encoder_output, prompt, tokenizer, options):
        cap.update(prompt=prompt, tokenizer=tokenizer, options=options); raise _Cap()
    orig_encode, orig_gwf = m.encode, m.generate_with_fallback
    m.generate_with_fallback = _probe
    try: list(m.transcribe(np.zeros(16000, dtype=np.float32), **KW)[0])
    except _Cap: pass
    m.generate_with_fallback = orig_gwf
    o, prompt, tok = cap["options"], cap["prompt"], cap["tokenizer"]
    assert o.temperatures[0] == 0 and o.beam_size == 8 and not o.without_timestamps and list(o.clip_timestamps) == [0.0] and len(prompt) == 3, "unexpected decode options"
    max_len = o.max_new_tokens and len(prompt) + o.max_new_tokens or m.max_length
    mit = int(round(o.max_initial_timestamp / m.time_precision))
    state = {}
    def _encode(features):    # a segment's first window: the encoder output computed in the batch; later windows: the normal call
        if state.get("enc") is not None and not state["enc_used"] and tuple(features.shape[-2:]) == (128, 3000) and np.array_equal(features.reshape(128, 3000), state["feat"]):
            state["enc_used"] = True; return state["enc"]
        return orig_encode(features)
    def _gwf(encoder_output, pr, tokenizer, options):
        if encoder_output is state.get("enc") and not state["gen_used"] and pr == prompt:
            state["gen_used"] = True; return state["res"]
        return orig_gwf(encoder_output, pr, tokenizer, options)
    m.encode, m.generate_with_fallback = _encode, _gwf
    def first_window(chunk):
        f = m.feature_extractor(chunk, chunk_length=30)
        return pad_or_trim(f[:, :min(f.shape[-1] - 1, 3000)])
    def decode_group(idx):
        feats = [first_window(chunks[i][1]) for i in idx]
        # each window through the encoder ALONE (batch 1 = the numbers of the old path); only the beam-8 decode is batched
        enc_np = np.concatenate([np.array(m.model.encode(ctranslate2.StorageView.from_array(np.ascontiguousarray(f[None])), to_cpu=True)) for f in feats])
        enc = ctranslate2.StorageView.from_array(np.ascontiguousarray(enc_np))
        results = m.model.generate(enc, [prompt] * len(idx), beam_size=o.beam_size, patience=o.patience, length_penalty=o.length_penalty,
                                   repetition_penalty=o.repetition_penalty, no_repeat_ngram_size=o.no_repeat_ngram_size, max_length=max_len, return_scores=True,
                                   return_no_speech_prob=True, suppress_blank=o.suppress_blank, suppress_tokens=o.suppress_tokens, max_initial_timestamp_index=mit)
        for k, i in enumerate(idx):
            r = results[k]; toks = r.sequences_ids[0]
            avg = r.scores[0] * (len(toks) ** o.length_penalty) / (len(toks) + 1)
            state.update(enc=ctranslate2.StorageView.from_array(np.ascontiguousarray(enc_np[k:k+1])), feat=feats[k], enc_used=False, gen_used=False,
                         res=(r, avg, 0.0, get_compression_ratio(tok.decode(toks).strip())))
            it, _ = m.transcribe(chunks[i][1], **KW)
            finish_one(i, list(it))
    order = sorted(range(len(chunks)), key=lambda i: -len(chunks[i][1]))   # similar lengths decode together
    pos, size = 0, batch
    try:
        while pos < len(order):
            idx = order[pos:pos + size]
            try: decode_group(idx); pos += len(idx)
            except RuntimeError as err:
                if not is_oom(err) or size == 1: raise
                size = max(1, size // 2); log(f"تنبيه: نفدت الذاكرة: الدفعة صارت {size}", flush=True)
    finally:
        m.encode, m.generate_with_fallback = orig_encode, orig_gwf


if __name__ == "__main__":
    src, vadf, out = sys.argv[1:4]
    a = sys.argv[4:]
    MERGE = float(a[a.index("--merge")+1]) if "--merge" in a else 0.3
    DEVICE = a[a.index("--device")+1] if "--device" in a else "cuda"
    # STRONGEST MODEL ONLY (user 2026-11-17): large-v3 at float16 on the GPU. A CPU/int8 decode is a weaker model and is refused, never used as a silent fallback.
    if DEVICE != "cuda": raise SystemExit("✘ التفريغ بأقوى نموذج فقط: large-v3 float16 على كرت الشاشة؛ ممنوع المعالج أو الدقة المنخفضة")
    THREADS = min(4, max(1, int(a[a.index("--threads")+1]))) if "--threads" in a else 4
    BATCH = max(1, int(a[a.index("--batch")+1])) if "--batch" in a else BATCH_DEFAULT
    if BATCH > 1: print("تنبيه: --batch ليس مطابقاً للتفريغ المتسلسل (يغيّر كلمات في حالات الحسم القريب)؛ للقياس فقط، لا يستعمله خط التحضير", flush=True)
    audio = decode_audio(src, sampling_rate=16000)
    segs = merge_segments(json.load(open(vadf))["speech"], MERGE)
    m = load_model(THREADS)
    def checkpoint(r):
        with open(out + ".partial.json", "w", encoding="utf-8") as f: json.dump(r, f, ensure_ascii=False)
    res = transcribe_segments(m, audio, segs, batch=BATCH, checkpoint=checkpoint)
    json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print(len(res), "segments")
